import { clamp, writeValue } from "./utils.js";

const PREF_KEY = "neko-fish-preferences-v1";
const MOTION_MODES = new Set(["system", "reduce", "normal"]);

function sanitise(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    volume: Math.round(clamp(readNumberValue(source.volume, 100), 0, 100)),
    reduceMotion: MOTION_MODES.has(source.reduceMotion)
      ? source.reduceMotion
      : "system",
  };
}

function readNumberValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readPreferences() {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let preferences = sanitise(readPreferences());

function persist() {
  try {
    writeValue(PREF_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences are optional; the game still works without storage.
  }
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function reduceMotionActive() {
  if (preferences.reduceMotion === "reduce") return true;
  if (preferences.reduceMotion === "normal") return false;
  return prefersReducedMotion();
}

export function motionIntensity() {
  return reduceMotionActive() ? 0.25 : 1;
}

export function applyPreferences() {
  document.documentElement.classList.toggle("reduce-motion", reduceMotionActive());
}

export function getPreferences() {
  return preferences;
}

export function updatePreferences(patch) {
  preferences = sanitise({ ...preferences, ...patch });
  persist();
  applyPreferences();
  return preferences;
}

export function exportPreferences() {
  return { ...preferences };
}

export function replacePreferences(raw) {
  preferences = sanitise(raw);
  persist();
  applyPreferences();
  return preferences;
}

// Keep an open page in sync when the OS-level motion preference changes.
try {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener?.("change", applyPreferences);
} catch {
  // Older browsers simply keep the initial value.
}

applyPreferences();

export { PREF_KEY };
