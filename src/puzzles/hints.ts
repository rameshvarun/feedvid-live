import { GameContext } from "../gamecontext";
import { GameState } from "../gamestate";
import { BathroomState } from "./bathroom";
import { LyingDown } from "./lyingdown";
import {
  OperationBody,
  OperationDoor,
  OperationLocker,
  OperationState
} from "./operation";
import { StallDoor, StallDrain, StallState, StallToilet } from "./stall";
import { TrapGameState } from "./trap";

export function getHints(
  context: GameContext,
  gameState: GameState
): Array<string> {
  if (gameState instanceof LyingDown) {
    return [
      "Is there any way you can interact with the stream?",
      "Try sending a chat message."
    ];
  } else if (gameState instanceof StallState) {
    if (!context.succesfullyNavigatedOnce) {
      return [
        "Can you get a closer look at one of the items in the room?",
        "Try asking the streamer to go to an object."
      ];
    } else if (!context.hasScrewdriver) {
      if (gameState instanceof StallToilet) {
        if (!context.toiletLidOpen) {
          return [
            "There might be something under the toilet lid.",
            "Try opening the toilet lid."
          ];
        } else {
          return ["Try taking the screwdriver."];
        }
      } else {
        return ["Have you investigated the toilet?"];
      }
    } else if (!context.hasDrainKey) {
      if (gameState instanceof StallDrain) {
        if (!context.drainOpen) {
          return [
            "Do you have any items that can be used here?",
            "Try unscrewing the drain cover with the screwdriver."
          ];
        } else {
          return ["Try taking the key."];
        }
      } else {
        return ["Have you investigated the drain?"];
      }
    } else if (!context.finishedPuzzle1) {
      if (gameState instanceof StallDoor) {
        return [
          "Do you have any items that can be useful here?",
          "Try unlocking the door with your key."
        ];
      } else {
        return ["Have you investigated the stall door?"];
      }
    }
  } else if (gameState instanceof BathroomState) {
    if (context.getNumPuzzle2LocationsVisited() < 4) {
      let hints: Array<string> = [];
      if (!context.hasVisitedStall) {
        hints.push("Have you investigated the bathroom stall?");
      }
      if (!context.hasVisitedUrinal) {
        hints.push("Have you investigated the bathroom urinal?");
      }
      if (!context.hasVisitedSink) {
        hints.push("Have you investigated the bathroom sink?");
      }
      if (!context.hasVisitedDoor) {
        hints.push("Have you investigated the bathroom door?");
      }
      return hints;
    } else {
      return [
        "Do you notice any similarities between the markings on the door lock and the markings on the bathroom objects?",
        "Try using the markings on the bathroom objects as a translation guide.",
        "Try using the door code 'oculi'."
      ];
    }
  } else if (gameState instanceof OperationState) {
    if (!context.hasSeenDrawing) {
      return ["Have you investigated the drawing on the wall?"];
    } else if (!context.lockerOpen) {
      if (gameState instanceof OperationLocker) {
        return [
          "Could the drawing on the wall help you figure out the code?",
          "Have you tried to fill in the missing numbers in the magic square?",
          "The dots might give you a clue as to the order of numbers in the code.",
          "The locker code is 369."
        ];
      } else {
        return ["Have you investigated the locker?"];
      }
    } else if (!context.hasSaw) {
      if (gameState instanceof OperationLocker) {
        return ["Try taking the saw."];
      } else {
        return ["Have you investigated the locker?"];
      }
    } else if (!context.hasHand) {
      if (gameState instanceof OperationBody) {
        return [
          "Do you have any items that can be useful here?",
          "Try cutting off the hand of the corpse with your saw."
        ];
      } else {
        return ["Have you investigated the body?"];
      }
    } else {
      if (gameState instanceof OperationDoor) {
        return [
          "Do you have any items that can be useful here?",
          "Try unlocking the door with the hand from the corpse."
        ];
      } else {
        return ["Have you investigated the door?"];
      }
    }
  } else if (gameState instanceof TrapGameState) {
    return [
      "Your fingers are stuck in the trap. You need to free them!",
      "Try using the saw to cut off your fingers!"
    ];
  }

  return [];
}
