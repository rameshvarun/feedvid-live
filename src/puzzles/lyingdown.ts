import { GameState } from "../gamestate";
import { GameView } from "../gameview";
import { persistentState } from "../persist";
import { StallStart } from "./stall";
import * as sound from "../sound";

export class LyingDown extends GameState {
  static async standUp(gameView: GameView, previousState: GameState) {
    persistentState.advancePhase("stall");
    sound.STREAM_FX.SHUFFLE.play();
    await gameView.animateCameraTo("StartCamera", 9);
    return StallStart;
  }

  getTranslateNoiseMultiplier() {
    return 0;
  }

  getRotateNoiseMultiplier() {
    return 0;
  }

  parse(text: string) {
    this.gameView.stateTransition(LyingDown.standUp);
  }

  onEnter() {}
}
