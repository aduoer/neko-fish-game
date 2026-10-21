import {
  DEFAULT_POND,
  DEFAULT_RING,
  POND_SKINS,
  RING_SKINS,
} from "./cosmetics.js";
import { CAT_SKINS, DEFAULT_CAT } from "./cat-skins.js";
import { DAILY_BONUS, DAILY_REWARD, dateKey } from "./daily.js";
import { readNumber, writeValue } from "./utils.js";

const PROFILE_KEY = "neko-fish-profile-v2";
const LEGACY_PROFILE_KEY = "neko-fish-profile-v1";
const LEGACY_BEST_KEY = "neko-fish-best";
const MODES = ["classic", "daily", "endless"];
const CATALOGS = new Map([
  ["ring", RING_SKINS],
  ["pond", POND_SKINS],
  ["cat", CAT_SKINS],
]);
const OWNED_KEYS = new Map([
  ["ring", "ownedRings"],
  ["pond", "ownedPonds"],
  ["cat", "ownedCats"],
]);
const EQUIPPED_KEYS = new Map([
  ["ring", "ring"],
  ["pond", "pond"],
  ["cat", "cat"],
]);
const VALID_IDS = new Map(
  [...CATALOGS].map(([kind, catalog]) => [kind, new Set(catalog.map((item) => item.id))]),
);

function catalogFor(kind) {
  return CATALOGS.get(kind) ?? null;
}

function ownedKeyFor(kind) {
  return OWNED_KEYS.get(kind) ?? null;
}

function equippedKeyFor(kind) {
  return EQUIPPED_KEYS.get(kind) ?? null;
}

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function validOwned(list, valid, fallback) {
  const owned = Array.isArray(list) ? list.filter((id) => valid.has(id)) : [];
  if (!owned.includes(fallback)) owned.unshift(fallback);
  return [...new Set(owned)];
}

function sanitiseDaily(record) {
  const today = dateKey();
  if (!record || record.date !== today) {
    return { date: today, best: 0, claimed: [false, false, false], bonus: false };
  }
  return {
    date: today,
    best: Math.max(0, Math.floor(Number(record.best) || 0)),
    claimed: Array.from({ length: 3 }, (_, index) => Boolean(record.claimed?.[index])),
    bonus: Boolean(record.bonus),
  };
}

function sanitise(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const bests = {};
  for (const mode of MODES) {
    const value = Number(source.bests?.[mode]);
    bests[mode] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }
  if (bests.classic === 0) {
    bests.classic = Math.max(0, Math.floor(readNumber(LEGACY_BEST_KEY, 0)));
  }

  const ownedRings = validOwned(source.ownedRings, VALID_IDS.get("ring"), DEFAULT_RING);
  const ownedPonds = validOwned(source.ownedPonds, VALID_IDS.get("pond"), DEFAULT_POND);
  const ownedCats = validOwned(source.ownedCats, VALID_IDS.get("cat"), DEFAULT_CAT);
  const ring = ownedRings.includes(source.ring) ? source.ring : DEFAULT_RING;
  const pond = ownedPonds.includes(source.pond) ? source.pond : DEFAULT_POND;
  const cat = ownedCats.includes(source.cat) ? source.cat : DEFAULT_CAT;
  const coins = Math.max(0, Math.floor(Number(source.coins) || 0));

  return {
    version: 2,
    coins,
    ownedRings,
    ownedPonds,
    ownedCats,
    ring,
    pond,
    cat,
    bests,
    daily: sanitiseDaily(source.daily),
  };
}

const PROFILE_LOCK = "neko-fish-profile-v2-lock";

const initialProfile = readJson(PROFILE_KEY) ?? readJson(LEGACY_PROFILE_KEY);
let profile = sanitise(initialProfile);

function save() {
  try {
    writeValue(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // The game remains playable when storage is unavailable.
  }
}

// Move a pre-cat save into the v2 key so an older open tab cannot strip the
// new ownedCats/cat fields when it writes the v1 record after deployment.
if (initialProfile && !readJson(PROFILE_KEY)) save();

// Another tab may have saved since this page loaded. Pull the latest copy
// before any read/write so purchases and rewards are not clobbered.
function syncFromStorage() {
  const stored = readJson(PROFILE_KEY);
  if (stored && typeof stored === "object") profile = sanitise(stored);
}

// Serialize read-modify-write transactions across tabs so two simultaneous
// purchases (or daily claims) merge instead of overwriting each other.
function withProfileLock(task) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(PROFILE_LOCK, () => {
      syncFromStorage();
      return task();
    });
  }
  syncFromStorage();
  return task();
}

export function getProfile() {
  syncFromStorage();
  return profile;
}

export function getCoins() {
  syncFromStorage();
  return profile.coins;
}

export function addCoins(amount) {
  return withProfileLock(() => {
    const gain = Math.max(0, Math.floor(Number(amount) || 0));
    if (gain === 0) return profile.coins;
    profile = { ...profile, coins: profile.coins + gain };
    save();
    return profile.coins;
  });
}

export function isOwned(kind, id) {
  const key = ownedKeyFor(kind);
  return key ? profile[key].includes(id) : false;
}

function equipUnlocked(kind, id) {
  const catalog = catalogFor(kind);
  const item = catalog?.find((entry) => entry.id === id);
  if (!item || !isOwned(kind, id)) {
    return { ok: false, reason: "locked" };
  }
  const equipKey = equippedKeyFor(kind);
  if (profile[equipKey] !== id) {
    profile = { ...profile, [equipKey]: id };
    save();
  }
  return { ok: true, item };
}

export function purchase(kind, id) {
  return withProfileLock(() => {
    const catalog = catalogFor(kind);
    const item = catalog?.find((entry) => entry.id === id);
    if (!item) return { ok: false, reason: "missing" };
    if (isOwned(kind, id)) {
      equipUnlocked(kind, id);
      return { ok: true, already: true, item };
    }
    if (profile.coins < item.price) {
      return { ok: false, reason: "coins", item, missing: item.price - profile.coins };
    }

    const key = ownedKeyFor(kind);
    const equipKey = equippedKeyFor(kind);
    profile = {
      ...profile,
      coins: profile.coins - item.price,
      [key]: [...profile[key], id],
      [equipKey]: id,
    };
    save();
    return { ok: true, item, cost: item.price };
  });
}

export function equip(kind, id) {
  return withProfileLock(() => equipUnlocked(kind, id));
}

export function bestFor(mode) {
  syncFromStorage();
  return profile.bests[mode] ?? 0;
}

export function updateBest(mode, score) {
  return withProfileLock(() => {
    const value = Math.max(0, Math.floor(Number(score) || 0));
    const previous = profile.bests[mode] ?? 0;
    if (value <= previous) return false;
    profile = {
      ...profile,
      bests: { ...profile.bests, [mode]: value },
      daily:
        mode === "daily"
          ? { ...profile.daily, best: Math.max(profile.daily.best, value) }
          : profile.daily,
    };
    save();
    return true;
  });
}

export function getDailyRecord() {
  syncFromStorage();
  const normalised = sanitiseDaily(profile.daily);
  if (normalised.date !== profile.daily.date) {
    profile = { ...profile, daily: normalised };
    save();
  }
  return profile.daily;
}

export function claimDaily(completed, challengeKey = dateKey()) {
  return withProfileLock(() => {
    if (challengeKey !== dateKey()) {
      return {
        claimed: [false, false, false],
        newlyClaimed: 0,
        bonusEarned: false,
        coinsEarned: 0,
        allDone: false,
        bonus: false,
        wallet: profile.coins,
        expired: true,
      };
    }

    const record = getDailyRecord();
    const flags = Array.from({ length: 3 }, (_, index) => Boolean(completed?.[index]));
    const claimed = [...record.claimed];
    let newlyClaimed = 0;

    flags.forEach((done, index) => {
      if (done && !claimed[index]) {
        claimed[index] = true;
        newlyClaimed += 1;
      }
    });

    const allDone = claimed.every(Boolean);
    const bonusEarned = allDone && !record.bonus;
    const coinsEarned = newlyClaimed * DAILY_REWARD + (bonusEarned ? DAILY_BONUS : 0);

    if (coinsEarned > 0) {
      profile = {
        ...profile,
        coins: profile.coins + coinsEarned,
        daily: {
          ...record,
          claimed,
          bonus: record.bonus || bonusEarned,
        },
      };
      save();
    }

    return {
      claimed,
      newlyClaimed,
      bonusEarned,
      coinsEarned,
      allDone,
      bonus: record.bonus || bonusEarned,
      wallet: profile.coins,
      expired: false,
    };
  });
}

export function resetProgressForDebug() {
  return withProfileLock(() => {
    profile = sanitise(null);
    save();
    return profile;
  });
}
