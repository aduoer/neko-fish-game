import { CONFIG, FISH_TYPES } from "./config.js";
import { Fish } from "./fish.js";
import { findSkin, pickSkin } from "./fish-skins.js";
import { clamp, distSq, mulberry32, rand, weightedPick } from "./utils.js";

export function fishTypeWeights(elapsed, frenzyActive) {
  const pressure = clamp(elapsed / CONFIG.duration, 0, 1);
  const goldRush = frenzyActive ? 16 : 0;
  return [
    { value: "sardine", weight: 54 - pressure * 30 - goldRush * 0.5 },
    { value: "koi", weight: 26 + pressure * 10 },
    { value: "gold", weight: 20 + pressure * 24 + goldRush },
  ];
}

export function pickFishType(elapsed, frenzyActive, random = Math.random) {
  return weightedPick(fishTypeWeights(elapsed, frenzyActive), random);
}

export class FishSpawner {
  constructor({ cat, getBounds, getElapsed, getFrenzy }) {
    this.fishList = [];
    this.cat = cat;
    this.getBounds = getBounds;
    this.getElapsed = getElapsed;
    this.getFrenzy = getFrenzy;
    this.scale = 1;
    this.random = Math.random;
  }

  setRandom(random = Math.random) {
    this.random = random;
  }

  setScale(scale) {
    this.scale = scale;
  }

  clear() {
    this.fishList.length = 0;
  }

  maxFishNow() {
    return this.getFrenzy?.() ? CONFIG.maxFishFrenzy : CONFIG.maxFish;
  }

  pickFishType() {
    return pickFishType(this.getElapsed?.() ?? 0, this.getFrenzy?.() ?? false, this.random);
  }

  makeFish(type, awayFromCat = true, skinId = null) {
    const bounds = this.getBounds();
    const spec = FISH_TYPES[type] ?? FISH_TYPES.sardine;
    const fishRandom = mulberry32(Math.floor(this.random() * 0xffffffff));
    const skin = skinId ? findSkin(type, skinId) : pickSkin(type, fishRandom);
    const radius = spec.radius * skin.size * this.scale;
    const cat = this.cat;
    let x = bounds.left + radius;
    let y = bounds.top + radius;
    let angle = 0;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const side = weightedPick(
        [
          { value: "left", weight: 0.38 },
          { value: "right", weight: 0.38 },
          { value: "top", weight: 0.12 },
          { value: "bottom", weight: 0.12 },
        ],
        this.random,
      );

      if (side === "left") {
        x = bounds.left + radius + 2;
        y = rand(bounds.top + radius, bounds.bottom - radius, this.random);
        angle = rand(-0.55, 0.55, this.random);
      } else if (side === "right") {
        x = bounds.right - radius - 2;
        y = rand(bounds.top + radius, bounds.bottom - radius, this.random);
        angle = Math.PI + rand(-0.55, 0.55, this.random);
      } else if (side === "top") {
        x = rand(bounds.left + radius, bounds.right - radius, this.random);
        y = bounds.top + radius + 2;
        angle = Math.PI / 2 + rand(-0.55, 0.55, this.random);
      } else {
        x = rand(bounds.left + radius, bounds.right - radius, this.random);
        y = bounds.bottom - radius - 2;
        angle = -Math.PI / 2 + rand(-0.55, 0.55, this.random);
      }

      if (!awayFromCat || distSq(x, y, cat.x, cat.y) > (230 * this.scale) ** 2) break;
    }

    return new Fish(type, x, y, angle, this.scale, skin.id, fishRandom);
  }

  addFish(type = null, awayFromCat = true) {
    if (this.fishList.length >= this.maxFishNow()) return null;
    const fish = this.makeFish(type ?? this.pickFishType(), awayFromCat);
    this.fishList.push(fish);
    return fish;
  }

  seedMenuFish() {
    this.clear();
    const menuTypes = [
      "sardine", "koi", "sardine", "gold", "koi",
      "sardine", "gold", "koi", "sardine",
    ];
    for (const type of menuTypes) this.addFish(type, false);
  }

  spawnInitialFish() {
    this.clear();
    const openingTypes = [
      "sardine", "koi", "sardine", "gold", "sardine",
      "gold", "koi", "sardine", "sardine",
    ];
    for (const type of openingTypes) this.addFish(type, true);
  }

  resizeFish(ratioX, ratioY, bounds) {
    for (const fish of this.fishList) {
      fish.x = clamp(fish.x * ratioX, bounds.left + fish.radius, bounds.right - fish.radius);
      fish.y = clamp(fish.y * ratioY, bounds.top + fish.radius, bounds.bottom - fish.radius);
      fish.scale = this.scale;
      fish.radius = fish.spec.radius * fish.skin.size * this.scale;
    }
  }
}
