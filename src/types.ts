import { GameState } from "./gamestate";
import { GameView } from "./gameview";
import { Howl } from "howler";

export type GameStateClass<T extends GameState> = {
  new (gameView: GameView): T;
};

export type Donation = {
  username: string;
  amount: number;
  message?: string;
  sound?: Howl;
};

export type Clue =
  | {
      username: string;
      kind: "joined";
      onAdded?: () => void;
    }
  | {
      username: string;
      kind: "banned";
      onAdded?: () => void;
    }
  | {
      username: string;
      kind: "message";
      message: string;
    }
  | {
      kind: "player-message";
      message: string;
    }
  | {
      username: string;
      kind: "screenshot";
      image: string;
    }
  | {
      kind: "easter-egg";
      message: string;
    };
