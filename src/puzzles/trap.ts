import { GameState } from "../gamestate";
import { GameView } from "../gameview";
import { alt, never, onSuccess, Parser, search, seq, word } from "../parsing";
import { sanctumReveal } from "./sanctum";
import * as TWEEN from "tween.js";

import * as sound from "../sound";
import { TAKE_SAW } from "./operation";
import { onFrame, wait } from "../utils";

export async function trapIntro(gameView: GameView) {
  // Stop playing binaural sounds to prevent distracting player.
  sound.stopBinauralSounds();

  // Player starts walking, the pauses looking at the ground.
  sound.startFootsteps();
  onFrame(197, () => {
    sound.stopFootsteps();
  });

  // Player starts walking again.
  onFrame(399, () => {
    sound.startFootsteps();
  });

  // Planks break.
  onFrame(448, () => {
    sound.stopBreathing();
    sound.STREAM_FX.PLANKS_BREAK.play();
    sound.stopFootsteps();
  });

  // Saws start.
  onFrame(604, () => {
    sound.sawLoop.startSawLoop();
  });

  await gameView.playAnimation("TrapIntroTrack", "TrapCameraIntro");
  return TrapGameState;
}

export async function trapOutro(gameView: GameView) {
  await gameView.animateCameraTo("TrapCameraTransition");

  if (!gameView.context.hasDroppedSaw) {
    sound.STREAM_FX.CERAMIC_CLINK.play();
    gameView.scene.getObjectByName("FinalPuzzleSaw")!.visible = false;
    gameView.context.hasDroppedSaw = true;
    await wait(1 * 1000);
  }

  sound.sawLoop.lowerSawVolume();
  sound.STREAM_FX.SAW_OFF_FINGER.play();

  setTimeout(() => {
    sound.painfulBreathing.start();
  }, 28 * 1000);

  await wait(23 * 1000);

  gameView.scene.getObjectByName("PlanksIntact")!.visible = false;
  const introClip = gameView.animations!.find(
    a => a.name === "TrapIntroTrack"
  )!;
  const introAction = gameView.mixer!.clipAction(introClip);
  introAction.reset();
  introAction.setEffectiveWeight(0.0);

  onFrame(214, () => {
    sound.STREAM_FX.SAW_SWING.play();
  });

  onFrame(428, () => {
    sound.sawLoop.fadeOut();
  });

  onFrame(232, () => {
    gameView.sendDonation({
      username: "Anonymous",
      amount: 69_420,
      message: "lol nice",
      sound: sound.DONATIONS.NICE
    });
  });

  onFrame(382, () => {
    sound.startFootsteps();
    gameView.context.viewersBanned = {
      state: "banned",
      startTime: performance.now(),
      startValue: gameView.publicViewers
    };
  });

  await gameView.playAnimation("TrapOutroTrack", "TrapCameraOutro");
  sound.stopFootsteps();

  return await sanctumReveal(gameView);
}

export class TrapGameState extends GameState {
  static async takeSaw(gameView: GameView) {
    await gameView.animateCameraTo("TrapCameraTransition");
    sound.STREAM_FX.CERAMIC_CLINK.play();
    gameView.scene.getObjectByName("FinalPuzzleSaw")!.visible = false;
    gameView.context.hasDroppedSaw = true;
    await gameView.animateCameraTo("TrapCameraIntro");

    return TrapGameState;
  }

  getParser(): Parser {
    const ACTION = alt(
      word("cut"),
      word("maim"),
      word("sever"),
      word("mutilate"),
      word("saw"),
      word("knife"),
      word("cleave"),
      word("hack"),
      word("chop"),
      word("remove"),
      word("amputate")
    );
    const TARGET = alt(
      word("hand"),
      word("arm"),
      word("finger"),
      word("fingers"),
      word("wrist")
    );

    const CUT_HAND = alt(
      seq(search(ACTION), search(TARGET)),
      seq(search(TARGET), search(ACTION))
    );

    return alt(
      onSuccess(CUT_HAND, () => {
        this.gameView.stateTransition(trapOutro);
      }),
      !this.context.hasDroppedSaw
        ? onSuccess(TAKE_SAW, () => {
            this.gameView.stateTransition(TrapGameState.takeSaw);
          })
        : never
    );
  }

  getTranslateNoiseMultiplier(): number {
    return 0.6;
  }
}
