import { MathUtils } from "three";

export class TimestampAllocator {
  now: number;
  constructor() {
    this.now = performance.now();
  }

  pause(duration: number) {
    this.now += duration;
    return this.now;
  }

  veryShortPause() {
    this.now += MathUtils.randFloat(1000, 2000);
    return this.now;
  }

  shortPause() {
    this.now += MathUtils.randFloat(3000, 4000);
    return this.now;
  }

  longPause() {
    this.now += MathUtils.randFloat(5000, 6000);
    return this.now;
  }
}
