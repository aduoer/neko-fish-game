import { CONFIG } from "./config.js";

const CLASSIC_FRENZY_TIMES = Object.freeze([15, 35]);
const CLASSIC_KING_TIMES = Object.freeze([32]);
const ENDLESS_FIRST_FRENZY = 20;
const ENDLESS_FRENZY_INTERVAL = 30;
const ENDLESS_FIRST_KING = 45;
const ENDLESS_KING_INTERVAL = 60;

export function linkEventState(state, events) {
  Object.defineProperties(state, {
    frenzyActive: {
      enumerable: true,
      get: () => events.frenzyActive,
      set: (value) => {
        events.frenzyActive = Boolean(value);
      },
    },
    frenzyTimer: {
      enumerable: true,
      get: () => events.frenzyTimer,
      set: (value) => {
        events.frenzyTimer = Number(value) || 0;
      },
    },
    frenzyIndex: {
      enumerable: true,
      get: () => events.frenzyIndex,
    },
    kingSpawned: {
      enumerable: true,
      get: () => events.kingIndex > 0,
    },
  });
}

export class PondEvents {
  constructor({ audio, addFish, spawnKingFish, showBanner }) {
    this.audio = audio;
    this.addFish = addFish;
    this.spawnKingFish = spawnKingFish;
    this.showBanner = showBanner;
    this.modeKey = "classic";
    this.frenzyActive = false;
    this.frenzyTimer = 0;
    this.frenzyIndex = 0;
    this.kingIndex = 0;
  }

  reset(modeKey = "classic") {
    this.modeKey = modeKey;
    this.frenzyActive = false;
    this.frenzyTimer = 0;
    this.frenzyIndex = 0;
    this.kingIndex = 0;
  }

  nextFrenzyTime() {
    if (this.modeKey !== "endless") return CLASSIC_FRENZY_TIMES[this.frenzyIndex];
    return ENDLESS_FIRST_FRENZY + this.frenzyIndex * ENDLESS_FRENZY_INTERVAL;
  }

  nextKingTime() {
    if (this.modeKey !== "endless") return CLASSIC_KING_TIMES[this.kingIndex];
    return ENDLESS_FIRST_KING + this.kingIndex * ENDLESS_KING_INTERVAL;
  }

  startFrenzy() {
    this.frenzyActive = true;
    this.frenzyTimer = CONFIG.frenzyDuration;
    for (let i = 0; i < CONFIG.frenzyBurst; i += 1) {
      this.addFish(i < 2 ? "gold" : null);
    }
    this.showBanner({
      kicker: "FISH TIDE",
      title: "鱼潮来了！",
      detail: "6 秒双倍积分，小鱼成群",
      tone: "frenzy",
      duration: 2800,
    });
    this.audio.frenzy();
  }

  spawnKing() {
    this.spawnKingFish();
    this.showBanner({
      kicker: "RARE CATCH",
      title: "鱼王出现！",
      detail: "抓住它，+20 分",
      tone: "king",
      duration: 3200,
    });
    this.audio.kingSpawn();
  }

  triggerKing() {
    this.kingIndex += 1;
    this.spawnKing();
  }

  update(dt, elapsed) {
    let nextFrenzy = this.nextFrenzyTime();
    while (nextFrenzy !== undefined && elapsed >= nextFrenzy) {
      this.frenzyIndex += 1;
      this.startFrenzy();
      nextFrenzy = this.nextFrenzyTime();
    }

    let nextKing = this.nextKingTime();
    while (nextKing !== undefined && elapsed >= nextKing) {
      this.triggerKing();
      nextKing = this.nextKingTime();
    }

    if (this.frenzyActive) {
      this.frenzyTimer = Math.max(0, this.frenzyTimer - dt);
      if (this.frenzyTimer <= 0) this.frenzyActive = false;
    }
  }
}
