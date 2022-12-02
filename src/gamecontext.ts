import { GameState } from "./gamestate";

type ViewerBanState =
  | { state: "unbanned" }
  | { state: "banned"; startTime: number; startValue: number };

export class GameContext {
  /** ==== PUZZLE 1 ==== **/
  /** Set to true once the player has sucessfully navigate away from the start camera state. */
  succesfullyNavigatedOnce: boolean = false;
  /** Is the toilet seat in the stall puzzle open? */
  toiletLidOpen: boolean = false;
  /** Does the player have the screwdriver? */
  hasScrewdriver: boolean = false;
  /** Has the drain been opened. */
  drainOpen: boolean = false;
  /** Does the player have the drain key. */
  hasDrainKey: boolean = false;
  /** Has the player finished puzzle 1. */
  finishedPuzzle1: boolean = false;

  /** ==== PUZZLE 2 ==== **/
  hasSeenReptile: boolean = false;
  hasVisitedStall: boolean = false;
  hasVisitedUrinal: boolean = false;
  hasVisitedSink: boolean = false;
  hasVisitedDoor: boolean = false;
  finishedPuzzle2: boolean = false;

  /** ==== PUZZLE 3 ==== **/
  hasSeenDrawing: boolean = false;
  /** Is the locker open. */
  lockerOpen: boolean = false;
  /** Does the player have the bone saw. */
  hasSaw: boolean = false;
  /** Has the player cut off the cadaver's hand. */
  hasHand: boolean = false;
  /** Has the player finished puzzle 3. */
  finishedPuzzle3: boolean = false;

  /** ==== PUZZLE 4 ==== */
  hasDroppedSaw: boolean = false;

  viewersBanned: ViewerBanState = { state: "unbanned" };

  doOnceKeys: Set<string> = new Set();
  doOnce(key: string, func: () => void) {
    if (!this.doOnceKeys.has(key)) {
      func();
      this.doOnceKeys.add(key);
    }
  }

  getNumPuzzle2LocationsVisited(): number {
    return (
      (this.hasVisitedStall ? 1 : 0) +
      (this.hasVisitedUrinal ? 1 : 0) +
      (this.hasVisitedSink ? 1 : 0) +
      (this.hasVisitedDoor ? 1 : 0)
    );
  }
}
