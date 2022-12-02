import { GameState } from "../gamestate";
import { GameView } from "../gameview";
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
import { TimestampAllocator } from "../timestampallocator";
import { wait } from "../utils";
import { HELPER_A, HELPER_B, HELPER_C } from "./constants";
import { OperationStart } from "./operation";

import * as sound from "../sound";
import { persistentState } from "../persist";

//** Objects referred to in this puzzle. */
const STALL = search(alt(fuzzy("toilet"), fuzzy("stall")));
const URINAL = search(word("urinal"));
const SINK = search(word("sink"));
const DOOR = search(alt(word("door"), word("keypad")));

const TURN_AROUND = alt(
  word("turn"),
  word("twirl"),
  word("pivot"),
  goTo(fuzzy("behind")),
  goTo(fuzzy("around"))
);

export abstract class BathroomState extends GameState {
  navigationParser(): Parser {
    return alt(
      this instanceof BathroomStall
        ? never
        : onSuccess(goTo(STALL), () => {
            this.gameView.stateTransition(BathroomStall.transitionFn);
          }),
      this instanceof BathroomUrinal
        ? never
        : onSuccess(goTo(URINAL), () => {
            this.gameView.stateTransition(BathroomUrinal.transitionFn);
          }),
      this instanceof BathroomSink
        ? never
        : onSuccess(goTo(SINK), () => {
            this.gameView.stateTransition(BathroomSink.transitionFn);
          }),
      this instanceof BathroomDoor
        ? never
        : onSuccess(goTo(DOOR), () => {
            this.gameView.stateTransition(BathroomDoor.transitionFn);
          })
    );
  }
}

abstract class ForwardFacingState extends BathroomState {
  navigationParser(): Parser {
    return alt(
      onSuccess(alt(goBack, TURN_AROUND), () => {
        this.gameView.stateTransition(BathroomBehind.transitionFn);
      }),
      super.navigationParser()
    );
  }
}

abstract class BackwardFacingState extends BathroomState {
  navigationParser(): Parser {
    return alt(
      onSuccess(alt(goBack, TURN_AROUND), () => {
        this.gameView.stateTransition(BathroomStart.transitionFn);
      }),
      super.navigationParser()
    );
  }
}

export class BathroomStart extends ForwardFacingState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (previousState instanceof BathroomBehind) {
      if (!gameView.context.hasSeenReptile) {
        gameView.context.hasSeenReptile = true;
        gameView.scene.getObjectByName("Reptile")!.visible = true;
      }

      await gameView.animateCameraTo("BathroomStart", 5, undefined, true);

      gameView.scene.getObjectByName("Reptile")!.visible = false;
    } else {
      let duration = 4.0;
      if (previousState instanceof ForwardFacingState) {
        duration = 5.0;
      }
      await gameView.animateCameraTo(
        "BathroomStart",
        duration,
        undefined,
        true
      );
    }

    return BathroomStart;
  }

  onEnter() {
    this.context.doOnce("bathroomstart", async () => {
      this.context.finishedPuzzle1 = true;
      this.gameView.helpersJoined = 3;

      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_B,
          kind: "message",
          message:
            "i see another <span class='keyword'>stall</span> and a <span class='keyword'>urinal</span>"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_C,
          kind: "message",
          message:
            "i think there's also something <span class='keyword'>behind</span> us"
        },
        timer.shortPause()
      );
    });
  }

  getParser(): Parser {
    return alt(this.navigationParser());
  }
}

export class BathroomBehind extends BackwardFacingState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (previousState instanceof BathroomStall) {
      await gameView.animateCameraTo("BathroomStart", 5, undefined, true);
      await gameView.animateCameraTo("BathroomBehind", 5, undefined, true);
    } else if (previousState instanceof BathroomStart) {
      if (!gameView.context.hasSeenReptile) {
        gameView.context.hasSeenReptile = true;
        gameView.scene.getObjectByName("Reptile")!.visible = true;
      }

      await gameView.animateCameraTo("BathroomBehind", 5, undefined, true);

      gameView.scene.getObjectByName("Reptile")!.visible = false;
    } else {
      await gameView.animateCameraTo("BathroomBehind", 5, undefined, true);
    }

    return BathroomBehind;
  }

  onEnter() {
    this.context.doOnce("bathroombehind", async () => {
      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message:
            "i see a <span class='keyword'>sink</span> and a <span class='keyword'>door</span>"
        },
        timer.shortPause()
      );
    });
  }

  getParser(): Parser {
    return alt(this.navigationParser());
  }
}

export class BathroomUrinal extends ForwardFacingState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (
      previousState instanceof BathroomStall ||
      previousState instanceof BathroomDoor
    ) {
      await gameView.animateCameraTo("BathroomStart", 5, undefined, true);
      await gameView.animateCameraTo("BathroomUrinal", 5, undefined, true);
    } else {
      await gameView.animateCameraTo("BathroomUrinal", 5, undefined, true);
    }
    return BathroomUrinal;
  }

  getParser(): Parser {
    return alt(
      onSuccess(goBack, () => {
        this.gameView.stateTransition(BathroomStart.transitionFn);
      }),
      this.navigationParser()
    );
  }

  onEnter() {
    this.context.doOnce("bathroomurinal", async () => {
      this.context.hasVisitedUrinal = true;

      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message: "there's something written on the urinal"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          kind: "screenshot",
          image: require("../images/urinal-screenshot.png"),
          username: HELPER_A
        },
        timer.shortPause()
      );
    });
  }
}

export class BathroomSink extends BackwardFacingState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (previousState instanceof BathroomStall) {
      await gameView.animateCameraTo("BathroomStart", 5, undefined, true);
      await gameView.animateCameraTo("BathroomSink", 5, undefined, true);
    } else {
      await gameView.animateCameraTo("BathroomSink", 5, undefined, true);
    }

    return BathroomSink;
  }

  getParser(): Parser {
    return alt(
      onSuccess(goBack, () => {
        this.gameView.stateTransition(BathroomBehind.transitionFn);
      }),
      this.navigationParser()
    );
  }

  onEnter() {
    this.context.doOnce("bathroomsink", async () => {
      this.context.hasVisitedSink = true;

      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_B,
          kind: "message",
          message: "there's something scratched onto the sink"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          kind: "screenshot",
          image: require("../images/sink-screenshot.png"),
          username: HELPER_B
        },
        timer.shortPause()
      );
    });
  }
}

export class BathroomDoor extends BackwardFacingState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (previousState instanceof BathroomUrinal) {
      await gameView.animateCameraTo("BathroomStart", 5, undefined, true);
      await gameView.animateCameraTo("BathroomDoor", 5, undefined, true);
    } else {
      await gameView.animateCameraTo("BathroomDoor", 5, undefined, true);
    }

    return BathroomDoor;
  }

  static async openDoor(gameView: GameView) {
    const bathroomDoor = gameView.scene.getObjectByName("BathroomDoorObject")!;

    await gameView.animateCameraTo("BathroomDoorTransition");
    sound.STREAM_FX.BATHROOM_DOOR_LOCK_CODE.play();

    await wait(4.5 * 1000);

    const rotation = bathroomDoor.rotation;
    new TWEEN.Tween(bathroomDoor.rotation)
      .to({ y: -Math.PI / 2 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    sound.STREAM_FX.STALL_DOOR_OPEN.play();
    await gameView.animateCameraTo(
      "OperationStart",
      6.0,
      TWEEN.Easing.Linear.None,
      true
    );

    new TWEEN.Tween(bathroomDoor.rotation)
      .to({ y: 0 }, 2000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();

    await wait(1 * 1000);
    sound.STREAM_FX.DOOR_CLOSE.play();

    await wait(1 * 1000);
    gameView.sendDonation({
      username: "MicahKismal",
      amount: 100,
      message: "you just got raided by CarlJ lmao",
      sound: sound.DONATIONS.RAIDED
    });

    persistentState.advancePhase("operation");

    return OperationStart;
  }

  getTranslateNoiseMultiplier(): number {
    return 0.3;
  }

  getParser(): Parser {
    return alt(
      onSuccess(goBack, () => {
        this.gameView.stateTransition(BathroomBehind.transitionFn);
      }),
      this.navigationParser()
    );
  }

  checkDoorCode(text: string): boolean {
    return text
      .replace(/\s+/g, "")
      .toLowerCase()
      .includes("oculi");
  }

  parse(text: string) {
    if (this.checkDoorCode(text)) {
      this.gameView.stateTransition(BathroomDoor.openDoor);
    } else {
      super.parse(text);
    }
  }

  onEnter() {
    this.context.doOnce("bathroomdoor", async () => {
      this.context.hasVisitedDoor = true;

      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_C,
          kind: "message",
          message: "huh, looks like one of those door locks that needs a code"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          kind: "screenshot",
          image: require("../images/door-screenshot.png"),
          username: HELPER_C
        },
        timer.shortPause()
      );
    });
  }
}

export class BathroomStall extends ForwardFacingState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (
      previousState instanceof BathroomUrinal ||
      previousState instanceof BathroomSink ||
      previousState instanceof BathroomBehind
    ) {
      await gameView.animateCameraTo("BathroomStart", 5, undefined, true);
      await gameView.animateCameraTo("BathroomStall", 5, undefined, true);
      return BathroomStall;
    } else {
      await gameView.animateCameraTo("BathroomStall", 5, undefined, true);
      return BathroomStall;
    }
  }

  getParser(): Parser {
    const UNROLL = word("unroll");
    return alt(
      onSuccess(goBack, () => {
        this.gameView.stateTransition(BathroomStart.transitionFn);
      }),
      this.navigationParser()
    );
  }

  onEnter() {
    this.context.doOnce("bathroomstall", async () => {
      this.context.hasVisitedStall = true;

      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_C,
          kind: "message",
          message: "hey does anyone else see something written on the toilet?"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          kind: "screenshot",
          image: require("../images/stall-screenshot.png"),
          username: HELPER_C
        },
        timer.shortPause()
      );
    });
  }
}
