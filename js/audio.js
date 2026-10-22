import { getPreferences, updatePreferences } from "./preferences.js";
import { clamp, readBool, writeValue } from "./utils.js";

const SOUND_KEY = "neko-fish-sound";
const BASE_GAIN = 0.15;

export class AudioKit {
  constructor() {
    this.enabled = readBool(SOUND_KEY, true);
    this.volume = getPreferences().volume;
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  get gainValue() {
    return BASE_GAIN * (this.volume / 100);
  }

  init() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        this.ctx = new Context();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.gainValue;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      this.ctx = null;
      this.master = null;
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    writeValue(SOUND_KEY, this.enabled ? 1 : 0);
    if (this.enabled) this.init();
  }

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) this.ui();
    return this.enabled;
  }

  setVolume(percent) {
    this.volume = Math.round(clamp(Number(percent) || 0, 0, 100));
    updatePreferences({ volume: this.volume });
    if (this.master) {
      this.master.gain.value = this.gainValue;
    }
    return this.volume;
  }

  syncPreferences() {
    this.volume = getPreferences().volume;
    if (this.master) this.master.gain.value = this.gainValue;
  }

  get ready() {
    return Boolean(this.enabled && this.ctx && this.master);
  }

  note({
    freq = 440,
    endFreq = null,
    duration = 0.18,
    volume = 0.3,
    type = "sine",
    delay = 0,
    attack = 0.008,
  } = {}) {
    if (!this.ready) return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    } catch {
      // Sound is decorative; never let it break gameplay.
    }
  }

  noise({ duration = 0.2, volume = 0.18, delay = 0, from = 700, to = 180 } = {}) {
    if (!this.ready) return;
    try {
      if (!this.noiseBuffer) {
        const length = Math.floor(this.ctx.sampleRate * 1.2);
        this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      }
      const now = this.ctx.currentTime + delay;
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 1.2;
      filter.frequency.setValueAtTime(from, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, to), now + duration);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(now);
      source.stop(now + duration + 0.03);
    } catch {
      // Ignore audio failures.
    }
  }

  ui() {
    this.note({ freq: 620, endFreq: 780, duration: 0.08, volume: 0.12, type: "sine" });
  }

  start() {
    this.note({ freq: 392, endFreq: 523, duration: 0.16, volume: 0.2, type: "triangle" });
    this.note({ freq: 523, endFreq: 784, duration: 0.22, volume: 0.18, type: "triangle", delay: 0.12 });
    this.note({ freq: 988, endFreq: 1318, duration: 0.2, volume: 0.1, type: "sine", delay: 0.24 });
  }

  catchFish(combo = 1, special = false) {
    const base = 523 * Math.pow(2, Math.min(combo, 8) / 12);
    this.note({ freq: base, endFreq: base * 1.28, duration: 0.11, volume: 0.22, type: "triangle" });
    this.note({ freq: base * 1.5, duration: 0.16, volume: 0.12, type: "sine", delay: 0.055 });
    this.noise({ duration: 0.1, volume: 0.06, from: 1200, to: 500 });
    if (special) {
      [1046, 1318, 1568].forEach((freq, index) => {
        this.note({ freq, duration: 0.22, volume: 0.11, type: "sine", delay: 0.08 + index * 0.06 });
      });
    }
  }

  dash() {
    this.noise({ duration: 0.22, volume: 0.15, from: 1200, to: 260 });
    this.note({ freq: 260, endFreq: 520, duration: 0.16, volume: 0.08, type: "sine" });
  }

  netCast(count = 0, charge = 0) {
    this.noise({ duration: 0.32, volume: 0.16 + charge * 0.05, from: 360, to: 1500 });
    this.note({
      freq: 190,
      endFreq: 320,
      duration: 0.2,
      volume: 0.1,
      type: "triangle",
    });
    if (count > 0) {
      const notes = [523, 659, 784, 1046].slice(0, Math.min(4, 1 + count));
      notes.forEach((freq, index) => {
        this.note({
          freq,
          duration: 0.2,
          volume: 0.11,
          type: "triangle",
          delay: 0.08 + index * 0.055,
        });
      });
    }
  }

  purchase() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      this.note({ freq, duration: 0.18, volume: 0.1, type: "sine", delay: index * 0.06 });
    });
  }

  fortune() {
    this.noise({ duration: 0.35, volume: 0.11, from: 500, to: 1800 });
    [523, 659, 784, 1046, 1318].forEach((freq, index) => {
      this.note({
        freq,
        endFreq: freq * 1.06,
        duration: 0.22,
        volume: 0.1,
        type: "triangle",
        delay: index * 0.055,
      });
    });
    this.note({ freq: 2093, duration: 0.3, volume: 0.06, type: "sine", delay: 0.32 });
  }

  dailyComplete() {
    [659, 784, 988, 1318, 1568].forEach((freq, index) => {
      this.note({ freq, duration: 0.3, volume: 0.12, type: "triangle", delay: index * 0.09 });
    });
  }

  milestone(level = 1) {
    const notes = level >= 2 ? [784, 1046, 1318, 1568] : [698, 880, 1046];
    notes.forEach((freq, index) => {
      this.note({
        freq,
        duration: 0.24,
        volume: 0.12,
        type: "triangle",
        delay: index * 0.07,
      });
    });
    this.note({ freq: 2093, duration: 0.3, volume: 0.07, type: "sine", delay: 0.22 });
  }

  frenzy() {
    this.noise({ duration: 0.7, volume: 0.12, from: 400, to: 1600 });
    [392, 523, 659, 784].forEach((freq, index) => {
      this.note({
        freq,
        endFreq: freq * 1.12,
        duration: 0.3,
        volume: 0.11,
        type: "triangle",
        delay: index * 0.09,
      });
    });
  }

  kingSpawn() {
    [262, 330, 392, 523].forEach((freq, index) => {
      this.note({
        freq,
        duration: 0.32,
        volume: 0.13,
        type: "sawtooth",
        delay: index * 0.11,
      });
    });
  }

  kingCaught() {
    [523, 659, 784, 1046, 1318].forEach((freq, index) => {
      this.note({
        freq,
        duration: 0.3,
        volume: 0.13,
        type: "triangle",
        delay: index * 0.08,
      });
    });
    this.noise({ duration: 0.35, volume: 0.08, from: 1800, to: 500 });
  }

  gameOver() {
    [523, 440, 349, 262].forEach((freq, index) => {
      this.note({ freq, duration: 0.3, volume: 0.12, type: "triangle", delay: index * 0.14 });
    });
  }

  newBest() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      this.note({ freq, duration: 0.28, volume: 0.12, type: "sine", delay: 0.45 + index * 0.09 });
    });
  }
}
