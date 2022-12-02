import { SourceMapDevToolPlugin } from "webpack";
import { GameState } from "../gamestate";
import { GameView } from "../gameview";
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
import { goBack, goTo, take, takeObject, useObject } from "../patterns";
import { TimestampAllocator } from "../timestampallocator";
import { wait } from "../utils";
import { HELPER_A, HELPER_B, HELPER_C } from "./constants";
import { trapIntro } from "./trap";
import * as sound from "../sound";
import { persistentState } from "../persist";

const DOOR = search(word("door"));
const BODY = search(
  alt(
    word("body"),
    fuzzy("person"),
    fuzzy("corpse"),
    fuzzy("gurney"),
    word("table")
  )
);
const LOCKER = search(fuzzy("locker"));
const DRAWING = search(alt(fuzzy("drawing"), word("wall")));
const SAW = search(
  alt(
    fuzzy("cleaver"),
    fuzzy("bonesaw"),
    word("saw"),
    fuzzy("handsaw"),
    word("knife")
  )
);
const HAND = search(alt(word("hand"), word("palm")));
export const TAKE_SAW = alt(take, takeObject(SAW));

export abstract class OperationState extends GameState {
  navigationParser(): Parser {
    return alt(
      this instanceof OperationDoor
        ? never
        : onSuccess(goTo(DOOR), () => {
            this.gameView.stateTransition(OperationDoor.transitionFn);
          }),
      this instanceof OperationLocker
        ? never
        : onSuccess(goTo(LOCKER), () => {
            this.gameView.stateTransition(OperationLocker.transitionFn);
          }),
      this instanceof OperationBody
        ? never
        : onSuccess(goTo(BODY), () => {
            this.gameView.stateTransition(OperationBody.transitionFn);
          }),
      this instanceof OperationWall
        ? never
        : onSuccess(goTo(DRAWING), () => {
            this.gameView.stateTransition(OperationWall.transitionFn);
          })
    );
  }
}

export class OperationStart extends OperationState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (previousState instanceof OperationLocker) {
      await gameView.animateCameraTo("OperationWalkLeft", 5, undefined, true);
    } else if (previousState instanceof OperationWall) {
      await gameView.animateCameraTo("OperationWalkRight", 5, undefined, true);
    } else if (previousState instanceof OperationDoor) {
      await gameView.animateCameraTo("OperationWalkRight", 5, undefined, true);
    }

    await gameView.animateCameraTo("OperationStart", 5, undefined, true);
    return OperationStart;
  }

  onEnter() {
    this.context.doOnce("operationstart", async () => {
      this.context.finishedPuzzle2 = true;
      this.gameView.helpersJoined = 3;

      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_B,
          kind: "message",
          message: "jesus christ is that a <span class='keyword'>body</span>??"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message:
            "not sure but i think i see a <span class='keyword'>locker</span> and a <span class='keyword'>door</span>"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_C,
          kind: "message",
          message:
            "theres also some kind of <span class='keyword'>drawing</span> on the wall"
        },
        timer.shortPause()
      );
    });
  }

  getParser(): Parser {
    return this.navigationParser();
  }
}

export class OperationDoor extends OperationState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (
      previousState instanceof OperationStart ||
      previousState instanceof OperationBody
    ) {
      await gameView.animateCameraTo("OperationWalkRight", 5, undefined, true);
    }

    if (previousState instanceof OperationLocker) {
      await gameView.animateCameraTo("OperationDoor", 9, undefined, true);
    } else {
      await gameView.animateCameraTo("OperationDoor", 5, undefined, true);
    }
    return OperationDoor;
  }

  static async openDoorFail(gameView: GameView) {
    await gameView.animateCameraTo("OperationDoorTransition");
    sound.STREAM_FX.HAND_SCANNER_FAIL.play();
    await wait(1.5 * 1000);
    await gameView.animateCameraTo("OperationDoor");

    gameView.context.doOnce("operationdoor_openfail", async () => {
      const timer = new TimestampAllocator();
      gameView.queueClue(
        {
          username: HELPER_B,
          kind: "message",
          message: "hmm... the door didn't open with your hand"
        },
        timer.shortPause()
      );
    });

    return OperationDoor;
  }

  static async entryToHallway(gameView: GameView) {
    await gameView.animateCameraTo("OperationDoorTransition");

    await wait(500);

    sound.STREAM_FX.HAND_SCANNER_OKAY.play();

    await wait(1.5 * 1000);

    sound.STREAM_FX.STALL_DOOR_OPEN.play();
    gameView.playAnimation("OperationDoorOpen");

    gameView.sendDonation({
      username: "MrJOHNSTER",
      amount: 500,
      message: "this is the biggest stream on the site right now",
      sound: sound.DONATIONS.BIGGEST_STREAM
    });

    await gameView.animateCameraTo("TrapCameraIntro", 4);

    persistentState.advancePhase("trap");

    return await trapIntro(gameView);
  }

  getTranslateNoiseMultiplier(): number {
    return 0.4;
  }

  onEnter() {
    this.context.doOnce("operationdoor", async () => {
      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message: "looks like the door opens with a hand scan"
        },
        timer.shortPause()
      );
    });
  }

  getParser(): Parser {
    const USE_HAND = alt(useObject(HAND));

    return alt(
      onSuccess(goBack, () => {
        this.gameView.stateTransition(OperationStart.transitionFn);
      }),
      onSuccess(USE_HAND, () => {
        if (this.context.hasHand) {
          this.gameView.context.finishedPuzzle3 = true;
          this.gameView.stateTransition(OperationDoor.entryToHallway);
        } else {
          this.gameView.stateTransition(OperationDoor.openDoorFail);
        }
      }),
      this.navigationParser()
    );
  }
}

export class OperationLocker extends OperationState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (
      previousState instanceof OperationStart ||
      previousState instanceof OperationBody
    ) {
      await gameView.animateCameraTo("OperationWalkLeft", 5, undefined, true);
    }

    if (gameView.context.lockerOpen) {
      await gameView.animateCameraTo(
        "OperationLockerShelf",
        5,
        undefined,
        true
      );
    } else {
      await gameView.animateCameraTo(
        "OperationLockerKeypad",
        5,
        undefined,
        true
      );
    }
    return OperationLocker;
  }

  getTranslateNoiseMultiplier(): number {
    return 0.3;
  }

  static async lockerOpen(gameView: GameView) {
    await gameView.animateCameraTo("OperationLockerTransition");
    gameView.context.lockerOpen = true;
    gameView.scene.getObjectByName("LockerDoorClosed")!.visible = false;
    gameView.scene.getObjectByName("LockerDoorOpen")!.visible = true;

    sound.STREAM_FX.LOCKER_CODE.play();
    await wait(3 * 1000);

    await gameView.animateCameraTo("OperationLockerShelf");

    const timer = new TimestampAllocator();
    gameView.queueClue(
      {
        username: HELPER_B,
        kind: "message",
        message: "i see a <span class='keyword'>saw</span> of some kind?"
      },
      timer.shortPause()
    );

    return OperationLocker;
  }

  static async takeSaw(gameView: GameView) {
    await gameView.animateCameraTo("OperationLockerTransition");
    sound.STREAM_FX.CERAMIC_CLINK.play();
    gameView.context.hasSaw = true;
    gameView.scene.getObjectByName("SawTool")!.visible = false;
    await gameView.animateCameraTo("OperationLockerShelf");

    return OperationLocker;
  }

  onEnter() {
    this.context.doOnce("operationlocker", async () => {
      const timer = new TimestampAllocator();
      this.queueClue(
        {
          username: HELPER_A,
          kind: "message",
          message: "seems like we need a numeric code"
        },
        timer.shortPause()
      );
    });
  }

  checkLockerCode(text: string): boolean {
    return text
      .replace(/\s+/g, "")
      .toLowerCase()
      .includes("369");
  }

  parse(text: string) {
    if (!this.context.lockerOpen && this.checkLockerCode(text)) {
      this.gameView.stateTransition(OperationLocker.lockerOpen);
    } else {
      super.parse(text);
    }
  }

  getParser(): Parser {
    return alt(
      this.navigationParser(),
      onSuccess(goBack, () => {
        this.gameView.stateTransition(OperationStart.transitionFn);
      }),
      this.context.lockerOpen && !this.context.hasSaw
        ? onSuccess(TAKE_SAW, () => {
            this.gameView.stateTransition(OperationLocker.takeSaw);
          })
        : never
    );
  }
}

export class OperationBody extends OperationState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (previousState instanceof OperationLocker) {
      await gameView.animateCameraTo("OperationWalkLeft", 5, undefined, true);
    } else if (previousState instanceof OperationWall) {
      await gameView.animateCameraTo("OperationWalkRight", 5, undefined, true);
    } else if (previousState instanceof OperationDoor) {
      await gameView.animateCameraTo("OperationWalkRight", 5, undefined, true);
    }

    await gameView.animateCameraTo("OperationBody", 5, undefined, true);
    return OperationBody;
  }

  getTranslateNoiseMultiplier(): number {
    return 0.5;
  }

  static async cutHand(gameView: GameView) {
    await gameView.animateCameraTo("OperationBodyTransition");
    gameView.scene.getObjectByName("Hand")!.visible = false;
    gameView.context.hasHand = true;

    sound.STREAM_FX.HANDSAW.play();

    await wait(3.5 * 1000);

    await gameView.animateCameraTo("OperationBody");

    const timer = new TimestampAllocator();
    gameView.queueClue(
      {
        username: HELPER_C,
        kind: "message",
        message: "HOLY SHIT!!!"
      },
      timer.shortPause()
    );
    gameView.queueClue(
      {
        username: HELPER_B,
        kind: "message",
        message: "wtf??? Is this real??? this can't be real"
      },
      timer.shortPause()
    );

    return OperationBody;
  }

  onEnter() {
    this.context.doOnce("operationbody", async () => {
      const timer = new TimestampAllocator();
    });
  }

  getParser(): Parser {
    const CUT_HAND = alt(
      search(word("cut")),
      search(word("sever")),
      search(word("saw")),
      useObject(SAW)
    );

    const LIFT_SHEET = seq(
      search(alt(word("remove"), word("lift"), word("take"), word("reveal"))),
      search(alt(word("sheet"), word("cloth"), word("blanket")))
    );

    return alt(
      this.navigationParser(),
      onSuccess(goBack, () => {
        this.gameView.stateTransition(OperationStart.transitionFn);
      }),
      this.context.hasSaw && !this.context.hasHand
        ? onSuccess(CUT_HAND, () => {
            this.gameView.stateTransition(OperationBody.cutHand);
          })
        : never,
      onSuccess(LIFT_SHEET, () => {
        this.context.doOnce("operation_lift_sheet", async () => {
          this.queueClue(
            {
              username: HELPER_A,
              kind: "message",
              message: "yeah... i don't think we want to do that"
            },
            new TimestampAllocator().veryShortPause()
          );
        });
      })
    );
  }
}

export class OperationWall extends OperationState {
  static async transitionFn(gameView: GameView, previousState: GameState) {
    if (
      previousState instanceof OperationStart ||
      previousState instanceof OperationBody
    ) {
      await gameView.animateCameraTo("OperationWalkRight", 5, undefined, true);
    }

    await gameView.animateCameraTo("OperationWall", 5, undefined, true);
    return OperationWall;
  }

  onEnter() {
    this.context.doOnce("operationwall", async () => {
      this.context.hasSeenDrawing = true;
      const timer = new TimestampAllocator();
      this.queueClue(
        {
          kind: "screenshot",
          image: require("../images/operation-screenshot.png"),
          username: HELPER_C
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_C,
          kind: "message",
          message:
            "i think i've seen something like this in math class... magic squares?"
        },
        timer.shortPause()
      );
      this.queueClue(
        {
          username: HELPER_B,
          kind: "message",
          message:
            "right - you fill in the blanks so that each row, column, and both diagonals have the same sum"
        },
        timer.shortPause()
      );
    });
  }

  getParser(): Parser {
    return alt(
      this.navigationParser(),
      onSuccess(goBack, () => {
        this.gameView.stateTransition(OperationStart.transitionFn);
      })
    );
  }
}
