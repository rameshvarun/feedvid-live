import { WatchIgnorePlugin } from "webpack";
import { BathroomStart } from "./bathroom";
import { GameState } from "../gamestate";
import * as TWEEN from "tween.js";
import {
  alt,
  fuzzy,
  never,
  onSuccess,
  Parser,
  run,
  search,
  seq,
  word
} from "../parsing";
import {
  goBack,
  goTo,
  standUp,
  take,
  takeObject,
  useObject
} from "../patterns";
import { wait } from "../utils";
import { TimestampAllocator } from "../timestampallocator";
import { HELPER_A, HELPER_B, HELPER_C } from "./constants";
import { GameView } from "../gameview";

import * as sound from "../sound";
import { persistentState } from "../persist";

//** Objects referred to in this puzzle. */
const TOILET = search(alt(fuzzy("toilet"), fuzzy("shitter")));
const DRAIN = search(
  alt(fuzzy("drain"), fuzzy("drainage"), word("vent"), word("panel"))
);
const DOOR = search(alt(word("door"), word("lock")));

const KEY = search(word("key"));
const SCREWDRIVER = search(
  alt(fuzzy("screwdriver"), seq(word("screw"), word("driver")))
);

export abstract class StallState extends GameState {
  navigationParser(): Parser {
    return alt(
      this instanceof StallToilet
        ? never
        : onSuccess(goTo(TOILET), () => {
            this.gameView.stateTransition(StallToilet.transitionFn);
          }),
      this instanceof StallDrain
        ? never
        : onSuccess(goTo(DRAIN), () => {
            this.gameView.stateTransition(StallDrain.transitionFn);
          }),
      this instanceof StallDoor
        ? never
        : onSuccess(goTo(DOOR), () => {
            this.gameView.stateTransition(StallDoor.transitionFn);
          })
    );
  }

  checkSuccesfulNavigation() {
    if (this.context.succesfullyNavigatedOnce === false) {
      this.context.succesfullyNavigatedOnce = true;
    }
  }
}

export class StallStart extends StallState {
  static async transitionFn(gameView: GameView) {
    await gameView.animateCameraTo("StartCamera", 5, undefined, true);
    return StallStart;
  }

  onEnter() {
    this.context.doOnce("stallstart", async () => {
      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_A,
          kind: "joined",
          onAdded: () => {
            this.gameView.helpersJoined++;
          }
        },
        timer.longPause()
      );
      this.queueClue(
        {
          username: HELPER_B,
          kind: "joined",
          onAdded: () => {
            this.gameView.helpersJoined++;
          }
        },

        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_B,
          kind: "message",
          message: "just clicked on, whats this?"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message:
            "not sure... looks like a livestream from a bathroom stall..."
        },
        timer.longPause()
      );
      this.queueClue(
        {
          username: HELPER_C,
          kind: "joined",
          onAdded: () => {
            this.gameView.helpersJoined++;
          }
        },
        timer.longPause()
      );
      this.queueClue(
        {
          kind: "message",
          message: "did anyone else randomly get gifted a sub?",
          username: HELPER_C
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          kind: "message",
          message: "yeah i did",
          username: HELPER_B
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          kind: "message",
          message: "so what exactly are we looking at",
          username: HELPER_C
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          kind: "message",
          message:
            "its a bathroom stall with a <span class='keyword'>toilet</span> a <span class='keyword'>door</span> and a <span class='keyword'>drain</span>",
          username: HELPER_A
        },
        timer.longPause()
      );
    });
  }

  getParser(): Parser {
    return this.navigationParser();
  }
}

export class StallDoor extends StallState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    let duration = 3;
    if (previousState instanceof StallStart) {
      duration = 4;
    }
    if (previousState instanceof StallDrain) {
      duration = 6;
    }

    await gameView.animateCameraTo("StallDoorCam", duration, undefined, true);
    return StallDoor;
  }

  static async openDoor(gameView: GameView) {
    await gameView.animateCameraTo("StallDoorOpening", 2.0);

    sound.STREAM_FX.STALL_DOOR_UNLOCK.play();
    await wait(2000);

    const stallDoor = gameView.scene.getObjectByName("StallDoorObject")!;
    gameView.scene.getObjectByName("StallLock")!.visible = false;

    setTimeout(() => {
      gameView.sendDonation({
        username: "AnimeLord",
        amount: 50,
        message: "now this is content poggers",
        sound: sound.DONATIONS.CONTENT
      });
    }, 4000);

    const rotation = stallDoor.rotation;
    new TWEEN.Tween(stallDoor.rotation)
      .to({ y: 2.0 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    sound.STREAM_FX.STALL_DOOR_OPEN.play();

    await gameView.animateCameraTo(
      "BathroomStart",
      9.0,
      TWEEN.Easing.Linear.None,
      true
    );

    persistentState.advancePhase("bathroom");

    await wait(1000);

    return BathroomStart;
  }

  getTranslateNoiseMultiplier(): number {
    return 0.4;
  }

  getParser(): Parser {
    const UNLOCK_DOOR = alt(
      search(word("unlock")),
      search(word("open")),
      useObject(KEY)
    );

    return alt(
      onSuccess(goBack, () => {
        this.gameView.stateTransition(StallStart.transitionFn);
      }),
      onSuccess(UNLOCK_DOOR, () => {
        if (this.context.hasDrainKey) {
          this.gameView.stateTransition(StallDoor.openDoor);
        } else {
          this.context.doOnce("stalldoor_unlockfail", async () => {
            this.queueClue(
              {
                username: HELPER_C,
                kind: "message",
                message: "i think we probably need a key"
              },
              new TimestampAllocator().veryShortPause()
            );
          });
        }
      }),
      this.navigationParser()
    );
  }

  onEnter() {
    this.checkSuccesfulNavigation();
    this.context.doOnce("stalldoor", async () => {
      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_C,
          kind: "message",
          message: "looks like its locked"
        },
        timer.shortPause()
      );
    });
  }
}

export class StallToilet extends StallState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    const duration = previousState instanceof StallStart ? 5 : 3;
    await gameView.animateCameraTo("StallToilet", duration, undefined, true);
    return StallToilet;
  }

  getParser(): Parser {
    const CLOSE = search(alt(word("close"), word("lower"), word("shut")));
    const OPEN = search(alt(word("open"), word("raise"), word("lift")));

    const TAKE_SCREWDRIVER = alt(take, takeObject(SCREWDRIVER));

    return alt(
      onSuccess(alt(goBack, standUp), () => {
        this.gameView.stateTransition(StallStart.transitionFn);
      }),
      this.context.toiletLidOpen
        ? onSuccess(CLOSE, () => {
            this.gameView.stateTransition(StallToilet.closeToiletLid);
          })
        : onSuccess(OPEN, () => {
            this.gameView.stateTransition(StallToilet.openToiletLid);
          }),
      this.context.toiletLidOpen && !this.context.hasScrewdriver
        ? onSuccess(TAKE_SCREWDRIVER, () => {
            this.gameView.stateTransition(StallToilet.takeScrewdriver);
          })
        : never,
      this.navigationParser()
    );
  }

  onEnter() {
    this.checkSuccesfulNavigation();
    this.context.doOnce("stalltoilet", async () => {
      const timer = new TimestampAllocator();
      this.queueClue(
        { username: HELPER_B, kind: "message", message: "the lid is shut" },
        timer.shortPause()
      );
    });
  }

  static async openToiletLid(gameView: GameView) {
    await gameView.animateCameraTo("LidOpening");
    gameView.scene.getObjectByName("ToiletLidClosed")!.visible = false;
    gameView.scene.getObjectByName("ToiletLidOpen")!.visible = true;
    gameView.context.toiletLidOpen = true;
    sound.toiletLidOpen();
    await gameView.animateCameraTo("StallToilet");

    gameView.context.doOnce("stalltoiletopen", async () => {
      const timer = new TimestampAllocator();
      gameView.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message:
            "is there... a <span class='keyword'>screwdriver</span> in there?"
        },
        timer.shortPause()
      );
    });

    return StallToilet;
  }

  static async closeToiletLid(gameView: GameView) {
    await gameView.animateCameraTo("LidOpening");
    gameView.scene.getObjectByName("ToiletLidClosed")!.visible = true;
    gameView.scene.getObjectByName("ToiletLidOpen")!.visible = false;
    gameView.context.toiletLidOpen = false;
    sound.toiletLidClosed();
    await gameView.animateCameraTo("StallToilet");
    return StallToilet;
  }

  static async takeScrewdriver(gameView: GameView) {
    await gameView.animateCameraTo("LidOpening");
    gameView.scene.getObjectByName("Screwdriver")!.visible = false;
    gameView.context.hasScrewdriver = true;
    sound.STREAM_FX.CERAMIC_CLINK.play();
    await gameView.animateCameraTo("StallToilet");

    gameView.sendDonation({
      username: "BasedShibe",
      amount: 10,
      message: "damn that's gross bro...",
      sound: sound.DONATIONS.BASED_SHIBE
    });

    return StallToilet;
  }
}

export class StallDrain extends StallState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    let duration = previousState instanceof StallStart ? 5 : 3;
    if (previousState instanceof StallDoor) {
      duration = 6;
    }
    await gameView.animateCameraTo("StallDrain", duration, undefined, true);
    return StallDrain;
  }

  getParser(): Parser {
    const UNSCREW_DRAIN = alt(
      search(word("unscrew")),
      search(word("open")),
      useObject(SCREWDRIVER)
    );

    const TAKE_KEY = alt(takeObject(KEY), take);

    return alt(
      onSuccess(alt(goBack, standUp), () => {
        this.gameView.stateTransition(StallStart.transitionFn);
      }),
      !this.context.drainOpen
        ? onSuccess(UNSCREW_DRAIN, () => {
            if (this.context.hasScrewdriver) {
              this.gameView.stateTransition(StallDrain.openDrain);
            } else {
              this.context.doOnce("stalldrain_openfail", async () => {
                this.queueClue(
                  {
                    username: HELPER_A,
                    kind: "message",
                    message: "we need something to remove the screws"
                  },
                  new TimestampAllocator().veryShortPause()
                );
              });
            }
          })
        : never,
      this.context.drainOpen && !this.context.hasDrainKey
        ? onSuccess(TAKE_KEY, () => {
            this.gameView.stateTransition(StallDrain.takeKey);
          })
        : never,
      this.navigationParser()
    );
  }

  static async openDrain(gameView: GameView) {
    await gameView.animateCameraTo("DrainOpening");
    gameView.scene.getObjectByName("DrainOpen")!.visible = true;
    gameView.scene.getObjectByName("DrainClosed")!.visible = false;
    gameView.context.drainOpen = true;
    sound.STREAM_FX.DRAIN_OPEN.play();
    await wait(2.5 * 1000);
    await gameView.animateCameraTo("StallDrain");

    gameView.context.doOnce("stallopendrain", async () => {
      const timer = new TimestampAllocator();
      gameView.queueClue(
        {
          username: HELPER_B,
          kind: "message",
          message: "a <span class='keyword'>key</span>??????"
        },
        timer.shortPause()
      );
    });

    return StallDrain;
  }

  static async takeKey(gameView: GameView) {
    await gameView.animateCameraTo("DrainOpening");
    gameView.scene.getObjectByName("DrainKey")!.visible = false;
    gameView.context.hasDrainKey = true;
    sound.STREAM_FX.CERAMIC_CLINK.play();
    await gameView.animateCameraTo("StallDrain");

    return StallDrain;
  }

  getTranslateNoiseMultiplier(): number {
    return 0.5;
  }

  onEnter() {
    this.checkSuccesfulNavigation();
    this.context.doOnce("stalldrain", async () => {
      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_C,
          kind: "message",
          message: "wait is there something in the drain?"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message: "the cover is screwed shut though"
        },
        timer.shortPause()
      );
    });
  }
}
