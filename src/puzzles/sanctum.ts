import { GameState } from "../gamestate";
import { GameView } from "../gameview";
import { TimestampAllocator } from "../timestampallocator";
import { hashString, onFrame, wait } from "../utils";
import { HELPER_A, HELPER_B, HELPER_C } from "./constants";
import * as sound from "../sound";
import { persistentState } from "../persist";
import { never, Parser } from "../parsing";

const CHANTS = [
  "WATCH THEM SUFFER",
  "watch them suffer",
  "Watch them suffer.",
  "watch them suffer.",
  "WATCH THEM SUFFER!",
  "Watch them suffer!",
  "watch them suffer",
  "watch them suffer..."
];

export async function sanctumReveal(gameView: GameView) {
  await wait(5 * 1000);

  const onBan = () => {
    gameView.helpersJoined = Math.max(0, gameView.helpersJoined - 1);
  };

  setTimeout(() => {
    const timer = new TimestampAllocator();
    gameView.queueClue(
      {
        username: HELPER_B,
        kind: "banned",
        onAdded: onBan
      },
      timer.pause(0)
    );

    gameView.queueClue(
      {
        username: HELPER_C,
        kind: "banned",
        onAdded: onBan
      },
      timer.pause(1000)
    );

    gameView.queueClue(
      {
        username: HELPER_A,
        kind: "message",
        message: "hey wtf"
      },
      timer.pause(2000)
    );

    gameView.queueClue(
      {
        username: HELPER_A,
        kind: "banned",
        onAdded: onBan
      },
      timer.pause(1000)
    );
  }, 2 * 1000);

  await wait(10 * 1000);

  setTimeout(() => {
    const timer = new TimestampAllocator();

    let VIEWER_NAMES = [
      "viewer598",
      "viewer877",
      "viewer967",
      "viewer602",
      "viewer359",
      "viewer180"
    ];
    VIEWER_NAMES.map((username, i) => {
      gameView.queueClue(
        {
          username: username,
          kind: "joined",
          onAdded: () => {
            gameView.helpersJoined++;
          }
        },
        timer.pause(500)
      );

      if (i === 0) timer.pause(1000);
      if (i === 1) timer.pause(500);
    });

    timer.pause(2000);

    VIEWER_NAMES = [
      "viewer598",
      "viewer359",
      "viewer967",
      "viewer180",
      "viewer602",
      "viewer877",
      "viewer967",
      "viewer180",
      "viewer602"
    ];
    VIEWER_NAMES.map((username, i) => {
      gameView.queueClue(
        {
          username: username,
          kind: "message",
          message: CHANTS[hashString(username, CHANTS.length)]
        },
        timer.pause(600)
      );

      if (i === 0) timer.pause(1200);
      if (i === 1) timer.pause(600);
    });
  }, 8 * 1000);

  setTimeout(() => {
    gameView.showCredits();
  }, 53 * 1000);

  sound.STREAM_FX.STALL_DOOR_OPEN.play();
  gameView.playAnimation("ExitDoorAnimation");
  sound.cultWhispering.startLoop();
  await gameView.animateCameraTo("SanctumCamera", 4);

  sound.startFootsteps();
  // Player stops to look at Police and hallway.
  onFrame(671, () => {
    sound.stopFootsteps();
  });
  // Player continues up steps.
  onFrame(789, () => {
    sound.startFootsteps();
  });
  onFrame(936, () => {
    sound.cultWhispering.fadeOut();
  });

  await gameView.playAnimation("SanctumCameraAnimation", "SanctumCamera");

  persistentState.finishGame();

  return EndGameState;
}

export class EndGameState extends GameState {
  getParser(): Parser {
    return never;
  }
}
