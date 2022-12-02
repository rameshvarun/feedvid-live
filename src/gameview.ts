import * as THREE from "three";
import * as TWEEN from "tween.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  MathUtils,
  Object3D,
  Quaternion,
  Scene,
  TriangleFanDrawMode
} from "three";
import { setCastShadows, setReceiveShadows } from "./utils";
import { GameState } from "./gamestate";
import { GameContext } from "./gamecontext";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { JPEGPass } from "./postprocessing/jpegpass";

import { BathroomStart } from "./puzzles/bathroom";
import { OperationStart } from "./puzzles/operation";
import { NoisePass } from "./postprocessing/noisepass";
import { LensPass } from "./postprocessing/lenspass";
import { Clue, Donation, GameStateClass } from "./types";
import { StallStart } from "./puzzles/stall";
import { SourceMapDevToolPlugin } from "webpack";

const SimplexNoise = require("simplex-noise");
const deepEqual = require("deep-equal");

import * as sound from "./sound";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { getHints } from "./puzzles/hints";
import { sanctumReveal } from "./puzzles/sanctum";
import { trapIntro } from "./puzzles/trap";
import { LyingDown } from "./puzzles/lyingdown";
import { persistentState } from "./persist";

// @ts-ignore
window.THREE = THREE;
// @ts-ignore
window.TWEEN = TWEEN;

// 3D view runs at a low resolution to emulate shitty video.
const STREAM_WIDTH = 426;
const STREAM_HEIGHT = 240;

// 3D view runs at a low framerate to emulate real cameras.
const FRAME_RATE = 15;
const MS_PER_FRAME = 1000 / FRAME_RATE;

function calculatePublicViewersTarget(context: GameContext): number {
  if (context.finishedPuzzle3) {
    return 150_000;
  } else if (context.hasHand) {
    return 100_000;
  } else if (context.hasSaw) {
    return 50_000;
  } else if (context.finishedPuzzle2) {
    return 20_000;
  } else if (context.finishedPuzzle1) {
    return 120 + context.getNumPuzzle2LocationsVisited() * 50;
  } else if (context.hasDrainKey) {
    return 100;
  } else if (context.drainOpen) {
    return 50;
  } else if (context.hasScrewdriver) {
    return 10;
  } else if (context.succesfullyNavigatedOnce) {
    return 5;
  } else {
    return 0;
  }
}

export class GameView {
  canvas: HTMLCanvasElement;

  // The base position of the camera, before shaking is applied.
  cameraBase: THREE.Object3D;
  // The camera, parented to the base, which shakes.
  camera: THREE.PerspectiveCamera;

  scene: THREE.Scene;
  renderer: THREE.WebGL1Renderer;

  state: GameState | null = null;

  context: GameContext = new GameContext();

  composer: EffectComposer;

  getHints(): Array<string> {
    if (this.state) {
      return getHints(this.context, this.state);
    } else {
      return [];
    }
  }

  // Instantly transition to a new state.
  setState<T extends GameState>(constructorFn: GameStateClass<T>) {
    // Construct and set the next state.
    this.state = new constructorFn(this);

    // Call onEnter callback.
    console.log("Set state as %o... Calling onEnter...", this.state);
    this.state.onEnter();
  }

  // Transition to a new state while playing an asynchronous transition function.
  async stateTransition<T extends GameState>(
    transitionFn: (
      gameView: GameView,
      previousState: GameState | null
    ) => Promise<GameStateClass<T>>
  ) {
    // Set the current state to null temporarily so that commands will be queued.
    const previousState = this.state;
    this.state = null;

    // Play the transition function, which returns the class of the next state.
    let constructorFn = await transitionFn(this, previousState);

    // Construct and set the next state.
    this.state = new constructorFn(this);

    // Call onEnter callback.
    console.log("Set state as %o... Calling onEnter...", this.state);
    this.state.onEnter();

    // If a command was queued during the transition, dispatch it.
    if (this.queuedCommand) {
      this.state.parse(this.queuedCommand);
      this.queuedCommand = null;
    }
  }

  snapCameraTo(name: string) {
    name = `${name}_Orientation`;
    let object = this.scene.getObjectByName(name);
    if (!object) throw new Error(`Could not find object with name ${name}.`);

    object!.getWorldPosition(this.cameraBase.position);
    object!.getWorldQuaternion(this.cameraBase.quaternion);
    console.log(
      "Snap camera to %o... World position: %o",
      object,
      this.cameraBase.position
    );
  }

  async animateCameraTo(
    name: string,
    duration: number = 2.0,
    easing = TWEEN.Easing.Quadratic.InOut,
    walking: boolean = false
  ) {
    name = `${name}_Orientation`;
    let object = this.scene.getObjectByName(name);
    if (!object) throw new Error(`Could not find object with name ${name}.`);

    let targetPosition = new THREE.Vector3();
    object.getWorldPosition(targetPosition);

    let originalQuaternion = this.cameraBase.quaternion.clone();
    let targetQuaternion = new THREE.Quaternion();
    object.getWorldQuaternion(targetQuaternion);

    if (walking) sound.startFootsteps();

    let translation: Promise<void> = new Promise((resolve, reject) => {
      new TWEEN.Tween(this.cameraBase.position)
        .to(
          { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z },
          duration * 1000
        )
        .easing(easing)
        .onComplete(() => resolve())
        .start();
    });

    let rotation: Promise<void> = new Promise((resolve, reject) => {
      new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, duration * 1000)
        .easing(easing)
        .onUpdate(t => {
          this.cameraBase.quaternion
            .copy(originalQuaternion)
            .slerp(targetQuaternion, t);
        })
        .onComplete(() => resolve())
        .start();
    });

    await Promise.all([translation, rotation]);

    if (walking) sound.stopFootsteps();
  }

  lamp: THREE.PointLight;

  addClue: (clue: Clue) => void;
  sendDonation: (donation: Donation) => void;
  updateViewerCount: (count: number) => void;
  showCredits: () => void;

  animations: Array<THREE.AnimationClip> | null = [];
  mixer: THREE.AnimationMixer | null = null;
  animationClock: THREE.Clock = new THREE.Clock();

  clueQueue: Array<{ clue: Clue; time: number }> = [];
  queueClue(clue: Clue, time: number) {
    this.clueQueue.push({ clue, time });
  }

  animationCameraNode: THREE.Object3D | null = null;
  playAnimation(name: string, cameraNode?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.animations && this.mixer) {
        if (cameraNode) {
          this.animationCameraNode = this.scene.getObjectByName(
            `${cameraNode}_Orientation`
          )!;
        }

        const clip = this.animations.find(a => a.name === name)!;
        const action = this.mixer.clipAction(clip);

        const onFinish = e => {
          if (e.action === action) {
            console.log("Finished playing animation: %s", name);
            this.mixer!.removeEventListener("finished", onFinish);

            if (cameraNode) {
              this.animationCameraNode = null;
            }

            resolve();
          }
        };

        this.mixer.addEventListener("finished", onFinish);

        action.clampWhenFinished = true;
        action.setLoop(THREE.LoopOnce, 0);
        action.reset();
        action.play();
      } else {
        throw new Error("Animations and mixer not loaded.");
      }
    });
  }

  constructor(
    canvas,
    addClue: (clue: Clue) => void,
    sendDonation: (donation: Donation) => void,
    updateViewerCount: (count: number) => void,
    onLoaded: () => void,
    showCredits: () => void
  ) {
    this.canvas = canvas;
    this.canvas.width = STREAM_WIDTH;
    this.canvas.height = STREAM_HEIGHT;

    this.scene = new THREE.Scene();

    this.addClue = addClue;
    this.sendDonation = sendDonation;
    this.updateViewerCount = updateViewerCount;
    this.showCredits = showCredits;

    this.cameraBase = new Object3D();
    this.camera = new THREE.PerspectiveCamera(
      130 * (STREAM_HEIGHT / STREAM_WIDTH),
      16.0 / 9.0,
      0.1,
      10000
    );
    this.cameraBase.add(this.camera);
    this.scene.add(this.cameraBase);

    this.lamp = new THREE.PointLight(0x00ff00, 15, 100);
    this.lamp.decay = 2;
    this.lamp.castShadow = true;
    this.lamp.position.set(0, 0.5, 0.5);
    this.camera.add(this.lamp);

    this.renderer = new THREE.WebGL1Renderer({
      canvas: canvas,
      antialias: true
    });
    console.log(this.renderer.getContext().getSupportedExtensions());

    this.renderer.physicallyCorrectLights = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    this.lamp.shadow.mapSize.width = 2048;
    this.lamp.shadow.mapSize.height = 2048;
    this.lamp.shadow.camera.near = 0.1;
    this.lamp.shadow.camera.far = 500;
    this.lamp.shadow.bias = -0.0005;
    this.lamp.shadow.radius = 50;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.composer.addPass(new LensPass());
    this.composer.addPass(new NoisePass());
    if (JPEGPass.isSupported(this.renderer)) {
      this.composer.addPass(new JPEGPass(STREAM_WIDTH, STREAM_HEIGHT));
    }

    let ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("basis/");
    ktx2Loader.detectSupport(this.renderer);

    let loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.load(
      require("./scenes/level.glb"),
      gltf => {
        setCastShadows(gltf.scene);
        setReceiveShadows(gltf.scene);

        const exitLight = gltf.scene.getObjectByName("ExitLight_Orientation");
        exitLight!.castShadow = false;

        this.mixer = new THREE.AnimationMixer(gltf.scene);
        this.animations = gltf.animations;

        this.scene.add(gltf.scene);
        this.scene.updateMatrixWorld();

        if (
          window.location.hash === "#stall" ||
          persistentState.user?.phase === "stall"
        ) {
          this.snapCameraTo("StartCamera");
          this.setState(StallStart);
        } else if (
          window.location.hash === "#bathroom" ||
          persistentState.user?.phase === "bathroom"
        ) {
          this.helpersJoined = 3;
          this.context.finishedPuzzle1 = true;

          this.snapCameraTo("BathroomStart");
          this.setState(BathroomStart);
        } else if (
          window.location.hash === "#operation" ||
          persistentState.user?.phase === "operation"
        ) {
          this.helpersJoined = 3;
          this.context.finishedPuzzle1 = true;
          this.context.finishedPuzzle2 = true;

          this.snapCameraTo("OperationStart");
          this.setState(OperationStart);
        } else if (
          window.location.hash === "#trap" ||
          persistentState.user?.phase === "trap"
        ) {
          this.helpersJoined = 3;
          this.context.finishedPuzzle1 = true;
          this.context.finishedPuzzle2 = true;
          this.context.finishedPuzzle3 = true;

          this.snapCameraTo("TrapCameraIntro");
          this.stateTransition(trapIntro);
        } else if (window.location.hash === "#sanctum") {
          this.helpersJoined = 3;

          this.context.finishedPuzzle1 = true;
          this.context.finishedPuzzle2 = true;
          this.context.finishedPuzzle3 = true;

          this.stateTransition(sanctumReveal);
        } else {
          this.snapCameraTo("LyingDown");
          this.setState(LyingDown);
        }

        this.publicViewers = calculatePublicViewersTarget(this.context);

        this.scene.getObjectByName("ToiletLidOpen")!.visible = false;
        this.scene.getObjectByName("DrainOpen")!.visible = false;
        this.scene.getObjectByName("LockerDoorOpen")!.visible = false;
        this.scene.getObjectByName("Reptile")!.visible = false;

        // Start animation frames.
        requestAnimationFrame(this.animate.bind(this));

        // Start stream background sounds.
        sound.startAmbience();
        sound.startBreathing();
        sound.pauseComfortNoise();
        sound.startBinauralSounds();

        onLoaded();
      },
      xhr => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      error => {
        console.log("An error happened");
      }
    );
  }

  lastFrameTimestamp: number = 0;

  cameraNoiseX = new SimplexNoise();
  cameraNoiseY = new SimplexNoise();
  cameraNoiseZ = new SimplexNoise();

  cameraNoiseRotX = new SimplexNoise();
  cameraNoiseRotY = new SimplexNoise();
  cameraNoiseRotZ = new SimplexNoise();

  translateNoise: number = 0;
  getTranslateNoiseMultiplier() {
    if (this.state) {
      return this.state.getTranslateNoiseMultiplier();
    }
    return 1.0;
  }

  rotateNoise: number = 0;
  getRotateNoiseMultiplier() {
    if (this.state) {
      return this.state.getRotateNoiseMultiplier();
    }
    return 1.0;
  }

  canSignOut(): boolean {
    return this.state !== null;
  }

  helpersJoined: number = 0;
  publicViewers: number = 0;
  publicViewersNoise = new SimplexNoise();
  lastViewerCountUpdate: number = 0;

  stopped: boolean = false;
  stop() {
    this.stopped = true;
    this.renderer.dispose();
    sound.stopBinauralSounds();
    sound.stopAmbience();
    sound.stopBreathing();
    sound.stopFootsteps();
    sound.resumeComfortNoise();
  }

  animate(timestamp) {
    if (this.stopped) return;

    // @ts-ignore
    window.RENDERER = this.renderer;

    // Immediately schedule another animation frame.
    requestAnimationFrame(this.animate.bind(this));
    if (timestamp < this.lastFrameTimestamp + MS_PER_FRAME) return;

    if (this.mixer) this.mixer.update(this.animationClock.getDelta());

    const dt = MS_PER_FRAME / 1000;
    this.lastFrameTimestamp = timestamp;

    // If we are playing an animation, move our camera to the animated camera node.
    if (this.animationCameraNode) {
      const targetPosition = new THREE.Vector3();
      const targetOrientation = new THREE.Quaternion();

      this.animationCameraNode!.getWorldPosition(targetPosition);
      this.animationCameraNode!.getWorldQuaternion(targetOrientation);

      this.cameraBase.position.lerp(targetPosition, 5.0 * dt);
      this.cameraBase.quaternion.slerp(targetOrientation, 5.0 * dt);
    }

    // Update tweenings.
    TWEEN.update(timestamp);

    let elapsedSeconds = timestamp / 1000.0;

    // Install some variables on the window for debugging purposes
    // @ts-ignore
    window.SCENE = this.scene;
    // @ts-ignore
    window.CONTEXT = this.context;

    if (this.context.viewersBanned.state === "unbanned") {
      // Update number of public viewers.
      let publicViewersTarget = calculatePublicViewersTarget(this.context);
      publicViewersTarget +=
        0.4 *
        publicViewersTarget *
        this.publicViewersNoise.noise2D(elapsedSeconds * 0.01, 0);
      publicViewersTarget = Math.max(publicViewersTarget, 0);

      this.publicViewers = MathUtils.lerp(
        this.publicViewers,
        publicViewersTarget,
        0.15 * dt
      );
    } else {
      let t =
        (performance.now() - this.context.viewersBanned.startTime) /
        (15 * 1000);
      t = MathUtils.clamp(t, 0, 1);
      t = TWEEN.Easing.Quintic.Out(t);
      this.publicViewers = MathUtils.lerp(
        this.context.viewersBanned.startValue,
        0,
        t
      );
    }

    // Update viewer count every second.
    if (performance.now() - this.lastViewerCountUpdate > 1000) {
      this.lastViewerCountUpdate = performance.now();
      this.updateViewerCount(
        1 + this.helpersJoined + Math.round(this.publicViewers)
      );
    }

    // Camera shake.
    this.translateNoise = MathUtils.lerp(
      this.translateNoise,
      this.getTranslateNoiseMultiplier(),
      2 * dt
    );
    let TRANSLATE_NOISE_AMPLITUDE = 0.08 * this.translateNoise;
    let TRANSLATE_NOISE_SCALE = 0.3;
    this.camera.position.x =
      TRANSLATE_NOISE_AMPLITUDE *
      this.cameraNoiseX.noise2D(elapsedSeconds * TRANSLATE_NOISE_SCALE, 0);
    this.camera.position.y =
      TRANSLATE_NOISE_AMPLITUDE *
      this.cameraNoiseY.noise2D(elapsedSeconds * TRANSLATE_NOISE_SCALE, 0);
    this.camera.position.z =
      TRANSLATE_NOISE_AMPLITUDE *
      this.cameraNoiseZ.noise2D(elapsedSeconds * TRANSLATE_NOISE_SCALE, 0);

    this.rotateNoise = MathUtils.lerp(
      this.rotateNoise,
      this.getRotateNoiseMultiplier(),
      2 * dt
    );
    let ROTATE_NOISE_AMPLITUDE = 0.01 * this.rotateNoise;
    let ROTATE_NOISE_SCALE = 0.3;
    this.camera.setRotationFromEuler(
      new THREE.Euler(
        ROTATE_NOISE_AMPLITUDE *
          this.cameraNoiseRotX.noise2D(elapsedSeconds * ROTATE_NOISE_SCALE, 0),
        ROTATE_NOISE_AMPLITUDE *
          this.cameraNoiseRotY.noise2D(elapsedSeconds * ROTATE_NOISE_SCALE, 0),
        ROTATE_NOISE_AMPLITUDE *
          this.cameraNoiseRotZ.noise2D(elapsedSeconds * ROTATE_NOISE_SCALE, 0),
        "XYZ"
      )
    );

    this.composer.render();

    // Look for clue time non-monotonicity
    for (let i = 1; i < this.clueQueue.length; ++i) {
      if (this.clueQueue[i].time < this.clueQueue[i - 1].time) {
        let now = performance.now();

        let buffer = Math.max(Math.min(1000, this.clueQueue[i].time - now), 0);
        console.log(
          "Found clue time non-monotonicity. Adjusting time stamps, buffer = %sms",
          buffer
        );

        for (let j = 0; j < i; ++j) {
          this.clueQueue[j].time = THREE.MathUtils.mapLinear(
            this.clueQueue[j].time,
            now,
            this.clueQueue[i - 1].time,
            now,
            this.clueQueue[i].time - buffer
          );
        }
        break;
      }
    }

    // Post queued clues.
    while (this.clueQueue.length > 0) {
      if (this.clueQueue[0].time > performance.now()) break;
      this.addClue(this.clueQueue.shift()!.clue);
    }
  }

  queuedCommand: string | null = null;
  parse(text: string) {
    // If we are currently in a state, dispatch the command to that state.
    // Otherwise, queue it so it can be executed after we enter the state.
    if (this.state) {
      this.state.parse(text);
    } else {
      this.queuedCommand = text;
    }
  }
}
