import { CONFIG, FISH_TYPES, SCORE_RANKS } from "./config.js";
import {
  clamp,
  distSq,
  formatClock,
  pick,
  rand,
  readNumber,
  weightedPick,
  writeValue,
} from "./utils.js";
import { AudioKit } from "./audio.js";
import { PondBackground } from "./background.js";
import { Particles } from "./particles.js";
import { Fish } from "./fish.js";
import { Cat } from "./cat.js";

const BEST_KEY = "neko-fish-best";

const canvas = document.getElementById("pond");
const ctx = canvas.getContext("2d", { alpha: false });

const ui = {
  hud: document.getElementById("hud"),
  timerPill: document.getElementById("timerPill"),
  timerValue: document.getElementById("timerValue"),
  bestValue: document.getElementById("bestValue"),
  scoreValue: document.getElementById("scoreValue"),
  comboTag: document.getElementById("comboTag"),
  comboValue: document.getElementById("comboValue"),
  comboBar: document.getElementById("comboBar"),
  soundBtn: document.getElementById("soundBtn"),
  dashBtn: document.getElementById("dashBtn"),
  dashCd: document.getElementById("dashCd"),
  hint: document.getElementById("hint"),
  menuOverlay: document.getElementById("menuOverlay"),
  menuBest: document.getElementById("menuBest"),
  startBtn: document.getElementById("startBtn"),
  overOverlay: document.getElementById("overOverlay"),
  overTitle: document.getElementById("overTitle"),
  rankLine: document.getElementById("rankLine"),
  finalScore: document.getElementById("finalScore"),
  finalCaught: document.getElementById("finalCaught"),
  finalCombo: document.getElementById("finalCombo"),
  finalBest: document.getElementById("finalBest"),
  newBest: document.getElementById("newBest"),
  replayBtn: document.getElementById("replayBtn"),
  flash: document.getElementById("flash"),
  liveRegion: document.getElementById("liveRegion"),
};

const audio = new AudioKit();
const background = new PondBackground();
const particles = new Particles();
const cat = new Cat(1);

const state = {
  mode: "menu",
  score: 0,
  best: readNumber(BEST_KEY, 0),
  caught: 0,
  combo: 0,
  comboTimer: 0,
  bestCombo: 0,
  timeLeft: CONFIG.duration,
  elapsed: 0,
  spawnTimer: 0.4,
  bubbleTimer: 1.2,
  shake: 0,
  hintTimer: 0,
  paused: false,
  pointerId: null,
};

let width = 0;
let height = 0;
let dpr = 1;
let scale = 1;
let vignette = null;
let endOverlayTimer = 0;
let lastFrame = performance.now();
let hudScore = -1;
let hudTime = -1;
let hudCombo = -1;
let hudComboVisible = false;
let dashWasCooling = null;

const fishList = [];

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

function getBounds() {
  return {
    left: 14,
    right: width - 14,
    top: width < 600 ? 88 : 102,
    bottom: height - (width < 600 ? 88 : 44),
  };
}

function getKeyDirection() {
  return {
    x: (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
    y: (keys.down ? 1 : 0) - (keys.up ? 1 : 0),
  };
}

function resize() {
  const previousWidth = width;
  const previousHeight = height;
  width = Math.max(320, window.innerWidth);
  height = Math.max(420, window.innerHeight);
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  scale = clamp(Math.min(width, height) / 760, 0.86, 1.26);
  cat.setScale(scale);
  background.resize(width, height);
  vignette = null;

  const bounds = getBounds();
  if (previousWidth > 0 && previousHeight > 0) {
    const ratioX = width / previousWidth;
    const ratioY = height / previousHeight;
    cat.x *= ratioX;
    cat.y *= ratioY;
    cat.targetX *= ratioX;
    cat.targetY *= ratioY;
    for (const fish of fishList) {
      fish.x = clamp(fish.x * ratioX, bounds.left + fish.radius, bounds.right - fish.radius);
      fish.y = clamp(fish.y * ratioY, bounds.top + fish.radius, bounds.bottom - fish.radius);
      fish.scale = scale;
      fish.radius = fish.spec.radius * scale;
    }
  }

  const margin = 72 * scale;
  if (state.mode === "menu") {
    cat.place(width * 0.5, clamp(bounds.bottom - 100 * scale, bounds.top + margin, bounds.bottom - margin), scale);
  } else {
    cat.x = clamp(cat.x, bounds.left + margin, bounds.right - margin);
    cat.y = clamp(cat.y, bounds.top + margin, bounds.bottom - margin);
    cat.targetX = clamp(cat.targetX, bounds.left + margin, bounds.right - margin);
    cat.targetY = clamp(cat.targetY, bounds.top + margin, bounds.bottom - margin);
  }
}

function makeFish(type, awayFromCat = true) {
  const bounds = getBounds();
  const spec = FISH_TYPES[type];
  const radius = spec.radius * scale;
  let x = width / 2;
  let y = height / 2;
  let angle = 0;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const side = weightedPick([
      { value: "left", weight: 0.38 },
      { value: "right", weight: 0.38 },
      { value: "top", weight: 0.12 },
      { value: "bottom", weight: 0.12 },
    ]);

    if (side === "left") {
      x = bounds.left + radius + 2;
      y = rand(bounds.top + radius, bounds.bottom - radius);
      angle = rand(-0.55, 0.55);
    } else if (side === "right") {
      x = bounds.right - radius - 2;
      y = rand(bounds.top + radius, bounds.bottom - radius);
      angle = Math.PI + rand(-0.55, 0.55);
    } else if (side === "top") {
      x = rand(bounds.left + radius, bounds.right - radius);
      y = bounds.top + radius + 2;
      angle = Math.PI / 2 + rand(-0.55, 0.55);
    } else {
      x = rand(bounds.left + radius, bounds.right - radius);
      y = bounds.bottom - radius - 2;
      angle = -Math.PI / 2 + rand(-0.55, 0.55);
    }

    if (!awayFromCat || distSq(x, y, cat.x, cat.y) > (230 * scale) ** 2) break;
  }

  return new Fish(type, x, y, angle, scale);
}

function pickFishType() {
  const progress = clamp(state.elapsed / CONFIG.duration, 0, 1);
  const pufferCount = fishList.filter((fish) => fish.isPuffer).length;
  const type = weightedPick([
    { value: "sardine", weight: 58 },
    { value: "koi", weight: 27 },
    { value: "gold", weight: 8 },
    { value: "puffer", weight: pufferCount >= 2 ? 0 : 8 + progress * 12 },
  ]);
  return type;
}

function addFish(type = null, awayFromCat = true) {
  if (fishList.length >= CONFIG.maxFish) return;
  const fishType = type ?? pickFishType();
  if (fishType === "puffer") {
    const pufferCount = fishList.filter((fish) => fish.isPuffer).length;
    if (pufferCount >= 2) return;
  }
  fishList.push(makeFish(fishType, awayFromCat));
}

function seedMenuFish() {
  fishList.length = 0;
  const menuTypes = ["sardine", "koi", "sardine", "gold", "koi", "sardine", "koi", "sardine"];
  for (const type of menuTypes) addFish(type, false);
}

function spawnInitialFish() {
  fishList.length = 0;
  const openingTypes = ["sardine", "koi", "sardine", "gold", "sardine", "koi", "sardine", "sardine"];
  for (const type of openingTypes) addFish(type, true);
}

function multiplierForCombo(combo) {
  return Math.min(CONFIG.maxMultiplier, 1 + Math.floor(combo / 2));
}

function updateSoundButton() {
  ui.soundBtn.classList.toggle("is-muted", !audio.enabled);
  ui.soundBtn.setAttribute("aria-pressed", String(audio.enabled));
  ui.soundBtn.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");
}

function syncHud(force = false) {
  const time = formatClock(state.timeLeft);
  if (force || time !== hudTime) {
    hudTime = time;
    ui.timerValue.textContent = String(time);
    ui.timerPill.classList.toggle("is-low", state.mode === "playing" && state.timeLeft <= 10);
  }

  if (force || state.score !== hudScore) {
    hudScore = state.score;
    ui.scoreValue.textContent = String(state.score);
  }

  const comboVisible = state.mode === "playing" && state.combo >= 2 && state.comboTimer > 0;
  if (force || comboVisible !== hudComboVisible) {
    hudComboVisible = comboVisible;
    ui.comboTag.classList.toggle("is-visible", comboVisible);
  }

  if (comboVisible && state.combo !== hudCombo) {
    hudCombo = state.combo;
    ui.comboValue.textContent = `×${multiplierForCombo(state.combo)}`;
  }

  if (comboVisible) {
    const ratio = clamp(state.comboTimer / CONFIG.comboWindow, 0, 1);
    ui.comboBar.style.transform = `scaleX(${ratio.toFixed(3)})`;
  }
}

function popScore() {
  ui.scoreValue.classList.remove("is-popping");
  void ui.scoreValue.offsetWidth;
  ui.scoreValue.classList.add("is-popping");
}

function syncDashUi() {
  const cooling = cat.dashCooldown > 0;
  if (cooling !== dashWasCooling) {
    dashWasCooling = cooling;
    ui.dashBtn.classList.toggle("is-cooling", cooling);
    ui.dashBtn.setAttribute("aria-disabled", String(cooling));
  }
  const progress = clamp(cat.dashCooldown / CONFIG.dashCooldown, 0, 1);
  ui.dashCd.style.setProperty("--cd", (progress * 100).toFixed(1));
}

function startGame() {
  if (state.mode === "playing") return;
  window.clearTimeout(endOverlayTimer);
  audio.init();

  state.mode = "playing";
  state.score = 0;
  state.caught = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.bestCombo = 0;
  state.timeLeft = CONFIG.duration;
  state.elapsed = 0;
  state.spawnTimer = 0.35;
  state.bubbleTimer = 1;
  state.shake = 0;
  state.paused = false;
  hudScore = -1;
  hudTime = -1;
  hudCombo = -1;
  hudComboVisible = false;
  dashWasCooling = null;

  particles.clear();

  const bounds = getBounds();
  cat.place(
    width * 0.5,
    clamp(bounds.bottom - 90 * scale, bounds.top + 100 * scale, bounds.bottom - 80 * scale),
    scale,
  );
  spawnInitialFish();
  clearKeys();
  state.pointerId = null;
  particles.splash(cat.x, cat.y + 16);

  ui.menuOverlay.classList.add("is-hidden");
  ui.menuOverlay.setAttribute("aria-hidden", "true");
  ui.overOverlay.classList.add("is-hidden");
  ui.overOverlay.setAttribute("aria-hidden", "true");
  ui.hud.classList.add("is-visible");
  ui.hud.setAttribute("aria-hidden", "false");
  ui.dashBtn.classList.add("is-visible");
  ui.hint.classList.add("is-visible");
  ui.hint.textContent = "移动小猫，碰到小鱼就能捞到！";
  state.hintTimer = CONFIG.hintDuration;
  ui.comboTag.classList.remove("is-visible");
  ui.timerPill.classList.remove("is-low");

  syncHud(true);
  updateSoundButton();
  syncDashUi();
  ui.liveRegion.textContent = "游戏开始，移动小猫去捞鱼吧。";
  audio.start();
}

function endGame() {
  if (state.mode !== "playing") return;
  state.mode = "over";
  state.timeLeft = Math.max(0, state.timeLeft);
  state.combo = 0;
  state.comboTimer = 0;
  state.hintTimer = 0;
  ui.hint.classList.remove("is-visible");
  ui.dashBtn.classList.remove("is-visible");
  ui.comboTag.classList.remove("is-visible");
  hudComboVisible = false;
  hudTime = -1;
  syncHud(true);

  const previousBest = state.best;
  const isNewBest = state.score > previousBest;
  if (isNewBest) {
    state.best = state.score;
    writeValue(BEST_KEY, state.best);
  }
  ui.bestValue.textContent = String(state.best);
  ui.menuBest.textContent = String(state.best);
  ui.finalScore.textContent = String(state.score);
  ui.finalCaught.textContent = String(state.caught);
  ui.finalCombo.textContent = String(state.bestCombo);
  ui.finalBest.textContent = String(state.best);
  ui.newBest.classList.toggle("is-hidden", !isNewBest);
  ui.overTitle.textContent = isNewBest ? "新纪录，喵！" : "时间到啦！";

  const rank = SCORE_RANKS.reduce(
    (current, entry) => (state.score >= entry.min ? entry : current),
    SCORE_RANKS[0],
  );
  ui.rankLine.textContent = rank.text;
  ui.liveRegion.textContent = `游戏结束，本局得分 ${state.score} 分，捞到 ${state.caught} 条小鱼。`;
  audio.gameOver();

  endOverlayTimer = window.setTimeout(() => {
    if (state.mode !== "over") return;
    ui.overOverlay.classList.remove("is-hidden");
    ui.overOverlay.setAttribute("aria-hidden", "false");
    ui.replayBtn.focus({ preventScroll: true });
    particles.confetti(width);
    if (isNewBest) audio.newBest();
  }, 620);
}

function flashScreen() {
  ui.flash.classList.remove("is-active");
  void ui.flash.offsetWidth;
  ui.flash.classList.add("is-active");
}

function catchFish(fish) {
  state.combo += 1;
  state.comboTimer = CONFIG.comboWindow;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const multiplier = multiplierForCombo(state.combo);
  const gain = fish.spec.points * multiplier;

  state.score += gain;
  state.caught += 1;
  cat.triggerCatch();
  state.shake = Math.max(state.shake, fish.isGold ? 6 : 2.5);
  particles.catchBurst(fish.x, fish.y, {
    special: fish.isGold,
    text: `+${gain}`,
  });
  audio.catchFish(state.combo, fish.isGold);
  popScore();
  syncHud();
}

function hitPuffer(fish) {
  state.timeLeft = Math.max(0, state.timeLeft - CONFIG.pufferPenalty);
  state.combo = 0;
  state.comboTimer = 0;
  state.shake = 18;
  cat.hitPuffer();
  particles.pufferBurst(fish.x, fish.y);
  flashScreen();
  audio.puffer();
  syncHud(true);
  ui.liveRegion.textContent = `碰到河豚，扣除 ${CONFIG.pufferPenalty} 秒。`;
}

function checkCatches() {
  for (let i = fishList.length - 1; i >= 0; i -= 1) {
    const fish = fishList[i];
    const catchDistance = cat.catchRadius + fish.radius;
    if (distSq(cat.x, cat.y, fish.x, fish.y) > catchDistance * catchDistance) continue;

    if (fish.isPuffer) {
      if (cat.invulnerable > 0) continue;
      fishList.splice(i, 1);
      hitPuffer(fish);
    } else {
      fishList.splice(i, 1);
      catchFish(fish);
    }
  }

  if (state.timeLeft <= 0 && state.mode === "playing") endGame();
}

function updateSpawning(dt) {
  const targetCount = Math.min(
    CONFIG.maxFish,
    CONFIG.initialFish + Math.floor(state.elapsed / 18) * 2,
  );

  if (fishList.length < targetCount) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      addFish();
      const pressure = clamp(state.elapsed / CONFIG.duration, 0, 1);
      state.spawnTimer = rand(0.34, 0.82) * (1 - pressure * 0.32);
    }
  } else {
    state.spawnTimer = Math.max(state.spawnTimer, 0.25);
  }
}

function updateAmbient(dt) {
  state.bubbleTimer -= dt;
  if (state.bubbleTimer <= 0) {
    state.bubbleTimer = rand(0.45, 1.3);
    const source = fishList.length > 0 ? pick(fishList) : null;
    if (source) {
      particles.ambientBubble(source.x + source.radius * 0.7, source.y - source.radius * 0.35);
    } else {
      particles.ambientBubble(rand(width * 0.1, width * 0.9), height - rand(20, 80));
    }
  }
}

function update(dt) {
  background.update(dt);
  particles.update(dt);
  state.shake = Math.max(0, state.shake - dt * 55);

  if (state.mode === "menu") {
    cat.update(dt, {
      bounds: getBounds(),
      keysX: 0,
      keysY: 0,
    });
    const env = {
      cat,
      bounds: getBounds(),
      speedFactor: 0.9,
      fleeRadius: CONFIG.fleeRadius * scale,
    };
    for (const fish of fishList) fish.update(dt, env);
    return;
  }

  if (state.mode === "over") {
    const env = {
      cat,
      bounds: getBounds(),
      speedFactor: 0.9,
      fleeRadius: CONFIG.fleeRadius * scale,
    };
    for (const fish of fishList) fish.update(dt, env);
    return;
  }

  state.elapsed += dt;
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer <= 0 && state.combo !== 0) state.combo = 0;
  state.hintTimer = Math.max(0, state.hintTimer - dt);
  if (state.hintTimer <= 0) ui.hint.classList.remove("is-visible");

  const direction = getKeyDirection();
  cat.update(dt, {
    bounds: getBounds(),
    keysX: direction.x,
    keysY: direction.y,
  });

  for (const event of cat.drainEvents()) {
    if (event.type === "dash") audio.dash();
    else if (event.type === "wake") particles.dashWake(event.x, event.y, event.angle);
  }

  const speedFactor = 1 + clamp(state.elapsed / CONFIG.duration, 0, 1) * 0.5;
  const env = {
    cat,
    bounds: getBounds(),
    speedFactor,
    fleeRadius: CONFIG.fleeRadius * scale,
  };
  for (const fish of fishList) fish.update(dt, env);

  checkCatches();
  if (state.mode !== "playing") return;

  updateSpawning(dt);
  updateAmbient(dt);

  if (state.timeLeft <= 0) endGame();

  syncHud();
  syncDashUi();
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  if (state.shake > 0) {
    ctx.translate(rand(-state.shake, state.shake) * 0.35, rand(-state.shake, state.shake) * 0.35);
  }

  background.draw(ctx);

  const visualTime = performance.now() / 1000;
  const sortedFish = fishList.slice().sort((a, b) => a.y - b.y);
  for (const fish of sortedFish) fish.draw(ctx, visualTime);

  cat.draw(ctx, visualTime);
  particles.draw(ctx);
  ctx.restore();

  if (!vignette) {
    const centerX = width / 2;
    const centerY = height * 0.46;
    const inner = Math.min(width, height) * 0.36;
    const outer = Math.hypot(width, height) * 0.62;
    vignette = ctx.createRadialGradient(centerX, centerY, inner, centerX, centerY, outer);
    vignette.addColorStop(0, "rgba(6, 65, 73, 0)");
    vignette.addColorStop(0.72, "rgba(6, 65, 73, 0.06)");
    vignette.addColorStop(1, "rgba(5, 51, 61, 0.28)");
  }
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function frame(now) {
  requestAnimationFrame(frame);
  const rawDt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (state.paused) return;

  const dt = clamp(rawDt, 0, 0.05);
  if (dt > 0) update(dt);
  render();
}

function requestStart() {
  if (state.mode === "playing") return;
  ui.startBtn.blur();
  ui.replayBtn.blur();
  startGame();
}

function triggerDash() {
  if (state.mode !== "playing") return;
  if (cat.triggerDash()) {
    syncDashUi();
    audio.init();
  }
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  };
}

function handlePointerMove(event) {
  if (state.mode !== "playing") return;
  if (event.pointerType !== "mouse" && state.pointerId !== null && event.pointerId !== state.pointerId) {
    return;
  }
  const point = pointerPosition(event);
  cat.setTarget(point.x, point.y);
}

function handlePointerDown(event) {
  audio.init();
  if (state.mode !== "playing") return;
  const point = pointerPosition(event);
  cat.setTarget(point.x, point.y);
  state.pointerId = event.pointerId;
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is a progressive enhancement.
  }
  if (event.pointerType === "mouse") triggerDash();
}

function handlePointerUp(event) {
  if (state.pointerId !== event.pointerId) return;
  state.pointerId = null;
  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Nothing to release.
  }
}

const keyMap = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

function handleKeyDown(event) {
  const mapped = keyMap[event.key] ?? keyMap[event.key.toLowerCase?.()];
  if (mapped) {
    keys[mapped] = true;
    if (state.mode === "playing") event.preventDefault();
    return;
  }

  if (event.code === "Space") {
    if (state.mode === "menu" || state.mode === "over") {
      const overlayVisible =
        state.mode === "menu"
          ? !ui.menuOverlay.classList.contains("is-hidden")
          : !ui.overOverlay.classList.contains("is-hidden");
      if (overlayVisible) {
        event.preventDefault();
        requestStart();
        return;
      }
    }
    if (state.mode === "playing") {
      event.preventDefault();
      triggerDash();
    }
    return;
  }

  if (event.key === "Enter" && (state.mode === "menu" || state.mode === "over")) {
    const overlayVisible =
      state.mode === "menu"
        ? !ui.menuOverlay.classList.contains("is-hidden")
        : !ui.overOverlay.classList.contains("is-hidden");
    if (overlayVisible) {
      event.preventDefault();
      requestStart();
    }
  }
}

function handleKeyUp(event) {
  const mapped = keyMap[event.key] ?? keyMap[event.key.toLowerCase?.()];
  if (mapped) keys[mapped] = false;
}

function clearKeys() {
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
}

function setupInput() {
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("keydown", handleKeyDown, { passive: false });
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", clearKeys);
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => window.setTimeout(resize, 180));

  document.addEventListener("visibilitychange", () => {
    state.paused = document.hidden;
    if (document.hidden) clearKeys();
    lastFrame = performance.now();
  });

  ui.startBtn.addEventListener("click", () => {
    audio.init();
    audio.ui();
    requestStart();
  });
  ui.replayBtn.addEventListener("click", () => {
    audio.init();
    audio.ui();
    requestStart();
  });

  ui.soundBtn.addEventListener("click", () => {
    audio.toggle();
    updateSoundButton();
  });

  ui.dashBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    audio.init();
    triggerDash();
  });

  ui.dashBtn.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      triggerDash();
    }
  });
}

function init() {
  resize();
  seedMenuFish();
  updateSoundButton();
  ui.bestValue.textContent = String(state.best);
  ui.menuBest.textContent = String(state.best);
  syncHud(true);
  setupInput();
  requestAnimationFrame((now) => {
    lastFrame = now;
    frame(now);
  });
}

init();
