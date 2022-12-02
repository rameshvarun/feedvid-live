const SAVE_FILE_KEY = "FEEDVIDLIVE_SAVE_KEY";
const SAVE_FILE_VERSION = 1;

type GamePhase =
  | "feed"
  | "streamstart"
  | "stall"
  | "bathroom"
  | "operation"
  | "trap";

type PersistentUser = { username: string; phase: GamePhase };

export class PersistentState {
  completed: boolean;
  user: null | PersistentUser;

  constructor(completed: boolean, user: null | PersistentUser) {
    this.completed = completed;
    this.user = user;
  }

  startNewGame(username: string) {
    this.user = {
      username: username,
      phase: "feed"
    };
    this.save();
  }

  advancePhase(nextPhase: GamePhase) {
    if (this.user) {
      console.log(`Advancing game to phase: ${nextPhase}`);
      this.user.phase = nextPhase;
      this.save();
    }
  }

  finishGame() {
    this.completed = true;
    this.user = null;
    this.save();
  }

  /** Create a default state. */
  static create(): PersistentState {
    return new PersistentState(false, null);
  }

  static fromJSON(json: any): PersistentState {
    if (json.version === 1) {
      return new PersistentState(json.completed, json.user);
    } else {
      throw new Error("Unknown save data version number.");
    }
  }

  toJSON() {
    return {
      version: 1,
      completed: this.completed,
      user: this.user
    };
  }

  static load(): PersistentState {
    // Try to load the save file from local storage.
    // This needs a try/catch since incognito mode
    // will throw an error here.
    let save: any = null;
    try {
      save = window.localStorage.getItem(SAVE_FILE_KEY);
    } catch (e) {
      console.warn("Failed to load save data.");
    }

    if (save) {
      // Try to restore from the JSON snapshot.
      try {
        console.log("Loading save data...");
        return PersistentState.fromJSON(JSON.parse(save));
      } catch (e) {
        // Save data was corrupted. We need to show an error to the user.
        alert(`Error parsing save data: ${e.message}`);
        return PersistentState.create();
      }
    } else {
      console.log("No save data found... Creating save data...");
      return PersistentState.create();
    }
  }

  save() {
    // Try to save the game state to local storage.
    try {
      let json = this.toJSON();
      window.localStorage.setItem(SAVE_FILE_KEY, JSON.stringify(json));
    } catch (e) {
      console.warn("Failed to save data.");
    }
  }
}

export const persistentState = PersistentState.load();
