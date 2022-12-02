const screenfull = require("screenfull");

export function setCastShadows(object: THREE.Object3D, value: boolean = true) {
  object.traverse(obj => (obj.castShadow = value));
}

export function setReceiveShadows(
  object: THREE.Object3D,
  value: boolean = true
) {
  object.traverse(obj => (obj.receiveShadow = value));
}

export function wait(duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), duration);
  });
}

export function hashString(s: string, modulo: number = 0xffffffff + 1): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + 31 * hash;
    hash %= modulo;
  }
  return hash;
}

export function readableNumber(n: number): string {
  if (n < 1_000) {
    return n.toString();
  } else if (n < 10_000) {
    if (n % 1_000 < 100) {
      return Math.floor(n / 1_000) + "K";
    } else {
      return (n / 1_000).toFixed(1) + "K";
    }
  } else if (n < 1_000_000) {
    return Math.floor(n / 1_000) + "K";
  } else if (n < 10_000_000) {
    if (n % 1_000_000 < 100_000) {
      return Math.floor(n / 1_000_000) + "M";
    } else {
      return (n / 1_000_000).toFixed(1) + "M";
    }
  } else {
    return Math.floor(n / 1_000_000) + "M";
  }
}

export function toggleFullscreen() {
  if (screenfull.isEnabled) {
    screenfull.toggle();
  }
}

const FRAMES_PER_SECOND = 24;
export function onFrame(frame: number, callback: () => void) {
  setTimeout(() => {
    callback();
  }, (frame / FRAMES_PER_SECOND) * 1000);
}

// Pick a random element out of an array.
export function choose<T>(choices: Array<T>): T {
  return choices[Math.floor(Math.random() * choices.length)];
}

// Return a shuffled copy of the array that is passed in.
export function shuffle<T>(unshuffled: Array<T>): Array<T> {
  let array = unshuffled.slice(0);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
