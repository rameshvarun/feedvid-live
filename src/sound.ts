import { Howl } from "howler";
import { MathUtils } from "three";
import * as utils from "./utils";

export const DONATIONS = {
  BASED_SHIBE: new Howl({
    preload: true,
    src: [require("./assets/audio/donation-basedshibe.mp3")]
  }),
  CONTENT: new Howl({
    preload: true,
    src: [require("./assets/audio/donation-content.mp3")]
  }),
  RAIDED: new Howl({
    preload: true,
    src: [require("./assets/audio/donation-raided.mp3")]
  }),
  BIGGEST_STREAM: new Howl({
    preload: true,
    src: [require("./assets/audio/donation-biggest-stream.mp3")]
  }),
  NICE: new Howl({
    preload: true,
    src: [require("./assets/audio/donation-nice.mp3")]
  })
};

const COMFORT_NOISE = new Howl({
  preload: true,
  src: [require("./assets/audio/comfort-noise.mp3")],
  loop: true,
  autoplay: true,
  volume: 0.15
});
export function pauseComfortNoise() {
  COMFORT_NOISE.pause();
}
export function resumeComfortNoise() {
  COMFORT_NOISE.play();
}

const PING = new Howl({
  preload: true,
  src: [require("./assets/audio/chat.wav")]
});
export function notification() {
  PING.play();
}

const CLINK = new Howl({
  preload: true,
  src: [require("./assets/audio/clink.wav")],
  volume: 0.5
});
export function clink() {
  CLINK.play();
}

const CLICK = new Howl({
  preload: true,
  src: [require("./assets/audio/click.wav")],
  volume: 0.8
});
export function click() {
  CLICK.play();
}

const ERROR = new Howl({
  preload: true,
  src: [require("./assets/audio/error.wav")],
  volume: 0.8
});
export function error() {
  ERROR.play();
}

const JOINED = new Howl({
  preload: true,
  src: [require("./assets/audio/joined.wav")]
});
export function joined() {
  JOINED.play();
}

const BANNED = new Howl({
  preload: true,
  src: [require("./assets/audio/banned.wav")]
});
export function banned() {
  BANNED.play();
}

const GIFTED = new Howl({
  preload: true,
  src: [require("./assets/audio/gifted.wav")]
});
export function gifted() {
  GIFTED.play();
}

const SNAP = new Howl({
  preload: true,
  src: [require("./assets/audio/snap.wav")]
});
export function snap() {
  SNAP.play();
}

const DONATION = new Howl({
  preload: true,
  src: [require("./assets/audio/donation.wav")]
});
export function donation() {
  DONATION.play();
}

const AMBIENCE = new Howl({
  preload: true,
  src: [require("./assets/audio/ambience.mp3")],
  loop: true
});
export function startAmbience() {
  AMBIENCE.volume(1.0);
  AMBIENCE.play();
}
export function stopAmbience() {
  AMBIENCE.stop();
}
export function fadeOutAmbience() {
  AMBIENCE.fade(1, 0, 3 * 1000);
}

const BREATHING = new Howl({
  preload: true,
  src: [require("./assets/audio/breathing-slow.mp3")],
  loop: true
});
export function startBreathing() {
  BREATHING.volume(1.0);
  BREATHING.play();
}
export function stopBreathing() {
  BREATHING.stop();
}
export function fadeOutBreathing() {
  BREATHING.fade(1, 0, 3 * 1000);
}

const PAINFUL_BREATHING = new Howl({
  preload: true,
  src: [require("./assets/audio/painful-breathing.mp3")],
  loop: true
});
export const painfulBreathing = {
  start() {
    PAINFUL_BREATHING.volume(1.0);
    PAINFUL_BREATHING.play();
  },
  stop() {
    PAINFUL_BREATHING.stop();
  },
  fadeOut() {
    PAINFUL_BREATHING.fade(1, 0, 3 * 1000);
  }
};

const FOOTSTEPS = new Howl({
  preload: true,
  src: [require("./assets/audio/footsteps.mp3")]
});
let FOOTSTEPS_ID: null | number = null;
export function startFootsteps() {
  FOOTSTEPS_ID = FOOTSTEPS.play();
  FOOTSTEPS.seek(
    utils.choose([0.0, 1.44, 2.855, 4.117, 5.435, 6.679]),
    FOOTSTEPS_ID
  );
  FOOTSTEPS.volume(1.0, FOOTSTEPS_ID);
  FOOTSTEPS.loop(true, FOOTSTEPS_ID);
}
export function stopFootsteps() {
  FOOTSTEPS.fade(1.0, 0, 500, FOOTSTEPS_ID!);
}
/** Slowly fade out footsteps, to be used in the ending. */
export function fadeOutFootsteps() {
  FOOTSTEPS.fade(1, 0, 3 * 1000, FOOTSTEPS_ID!);
}

export const STREAM_FX = {
  SHUFFLE: new Howl({
    preload: true,
    src: [require("./assets/audio/shuffle.mp3")]
  }),
  CERAMIC_CLINK: new Howl({
    preload: true,
    src: [require("./assets/audio/ceramic-clink.mp3")]
  }),
  DRAIN_OPEN: new Howl({
    preload: true,
    src: [require("./assets/audio/drain-open.mp3")]
  }),
  STALL_DOOR_OPEN: new Howl({
    preload: true,
    src: [require("./assets/audio/stall-door-open.mp3")]
  }),
  STALL_DOOR_UNLOCK: new Howl({
    preload: true,
    src: [require("./assets/audio/stall-door-unlock.mp3")]
  }),
  BATHROOM_DOOR_LOCK_CODE: new Howl({
    preload: true,
    src: [require("./assets/audio/bathroom-door-lock-code.mp3")]
  }),
  DOOR_CLOSE: new Howl({
    preload: true,
    src: [require("./assets/audio/door-close.mp3")]
  }),
  HANDSAW: new Howl({
    preload: true,
    src: [require("./assets/audio/handsaw.mp3")]
  }),
  LOCKER_CODE: new Howl({
    preload: true,
    src: [require("./assets/audio/locker-code.mp3")]
  }),
  HAND_SCANNER_FAIL: new Howl({
    preload: true,
    src: [require("./assets/audio/hand-scanner-fail.mp3")]
  }),
  HAND_SCANNER_OKAY: new Howl({
    preload: true,
    src: [require("./assets/audio/hand-scanner-okay.mp3")]
  }),
  PLANKS_BREAK: new Howl({
    preload: true,
    src: [require("./assets/audio/planks-break.mp3")]
  }),
  SAW_OFF_FINGER: new Howl({
    preload: true,
    src: [require("./assets/audio/saw-off-finger.mp3")]
  }),
  SAW_SWING: new Howl({
    preload: true,
    src: [require("./assets/audio/saw-swing.mp3")]
  })
};

const TOILET_LID_OPEN = new Howl({
  preload: true,
  src: [require("./assets/audio/toilet-lid-open.mp3")]
});
export function toiletLidOpen() {
  TOILET_LID_OPEN.play();
}

const TOILET_LID_CLOSED = new Howl({
  preload: true,
  src: [require("./assets/audio/toilet-lid-closed.mp3")]
});
export function toiletLidClosed() {
  TOILET_LID_CLOSED.play();
}

const CREDITS_MUSIC = new Howl({
  preload: true,
  src: [require("./assets/audio/credits-music.mp3")],
  volume: 0.8
});
export function startCreditsMusic() {
  CREDITS_MUSIC.play();
}
export function stopCreditsMusic() {
  CREDITS_MUSIC.stop();
}

const SAW_LOOP = new Howl({
  preload: true,
  src: [require("./assets/audio/saw-loop.mp3")],
  loop: true,
  volume: 1.0
});
export const sawLoop = {
  startSawLoop() {
    SAW_LOOP.play();
  },
  lowerSawVolume() {
    SAW_LOOP.fade(1.0, 0.25, 1 * 1000);
  },
  fadeOut() {
    SAW_LOOP.fade(0.25, 0, 2 * 1000);
  }
};

const CULT_WHISPER = new Howl({
  preload: true,
  src: [require("./assets/audio/cult-whisper.mp3")],
  loop: true
});
export const cultWhispering = {
  startLoop() {
    CULT_WHISPER.play();
    CULT_WHISPER.volume(0);
    CULT_WHISPER.fade(0.0, 0.4, 4000);
  },
  fadeOut() {
    CULT_WHISPER.fade(0.4, 0.0, 4000);
  }
};

class Generator<T> {
  source: Array<T>;

  pool: Array<T> = [];

  constructor(source: Array<T>) {
    this.source = source;
  }

  get(): T {
    if (this.pool.length === 0) {
      this.pool = utils.shuffle(this.source);
    }

    return this.pool.shift()!;
  }
}

export const BINAURAL_SOUNDS = new Generator([
  new Howl({
    preload: true,
    volume: 0.1,
    src: [require("./assets/audio/binaural-door-open.wav")]
  }),
  new Howl({
    preload: true,
    volume: 0.25,
    src: [require("./assets/audio/binaural-footsteps.wav")]
  })
]);

let binauralAudioRunning: boolean = false;

function scheduleBinauralSound() {
  setTimeout(() => {
    // Schedule the next sound.
    scheduleBinauralSound();

    // If binaural audio is stopped, don't play any more sounds.
    if (binauralAudioRunning) {
      // Pick a random sound and play it.
      console.log("Playing binaural audio sound.");
      const sound = BINAURAL_SOUNDS.get();
      sound.play();
    }
  }, MathUtils.randFloat(5, 10) * 60 * 1000);
}

// Schedule the first sound.
scheduleBinauralSound();

export function startBinauralSounds() {
  console.log("Starting binaural audio sound...");
  binauralAudioRunning = true;
}

export function stopBinauralSounds() {
  binauralAudioRunning = false;
}
