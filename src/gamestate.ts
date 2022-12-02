import { Scene } from "three";
import { GameContext } from "./gamecontext";
import { GameView } from "./gameview";
import { Parser, run } from "./parsing";
import { TimestampAllocator } from "./timestampallocator";
import { Clue } from "./types";

const EASTER_EGG_MESSAGES = {
  xyzzy: "Nothing happens.",
  plugh: "Nothing happens.",
  "0451": "Wait... This isn't an immersive sim...",
  "7395": "Hmmm... I think you're in the wrong game.",
  vim: "I prefer emacs, myself.",
  emacs: "I prefer vim, myself.",
  sudo: "This incident will be reported."
};

export class GameState {
  gameView: GameView;
  scene: Scene;
  context: GameContext;

  queueClue(clue: Clue, time: number) {
    this.gameView.queueClue(clue, time);
  }

  constructor(gameView: GameView) {
    this.gameView = gameView;
    this.scene = gameView.scene;
    this.context = gameView.context;
  }

  parse(text: string) {
    // Extra alphanumerical tokens.
    let tokens = text.match(/[a-z0-9]+/gi) || [];

    tokens = tokens.map(token => token.toLowerCase());
    console.log(tokens);

    // Easter egg processing.
    if (tokens.length >= 1 && EASTER_EGG_MESSAGES[tokens[0]]) {
      const easterEgg = tokens[0];
      this.context.doOnce(`easter-egg-${easterEgg}`, () => {
        const timer = new TimestampAllocator();
        this.queueClue(
          {
            kind: "easter-egg",
            message: EASTER_EGG_MESSAGES[tokens[0]]
          },
          timer.veryShortPause()
        );
      });

      return;
    }

    // Normal command processing.
    this.handleTokens(tokens);
  }

  getParser(): Parser {
    throw new Error("getParser unimplemented.");
  }

  handleTokens(tokens: Array<string>) {
    let parser = this.getParser();
    if (!run(parser, tokens)) {
      console.log("Failed to parse.");
    }
  }

  getTranslateNoiseMultiplier() {
    return 1.0;
  }

  getRotateNoiseMultiplier() {
    return 1.0;
  }

  onEnter() {}
}
