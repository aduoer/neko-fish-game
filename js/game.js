import { CONFIG, FISH_TYPES, comboMultiplier } from "./config.js";
import {
  clamp,
  distSq,
  pick,
  rand,
  readNumber,
  weightedPick,
  writeValue,
  TAU,
} from "./utils.js";
import { AudioKit } from "./audio.js";
import { PondBackground } from "./background.js";
import { Particles } from "./particles.js";
import { Fish } from "./fish.js";
import { Cat } from "./cat.js";
import { clearKeys, keyDirection, setupInput } from "./input.js";
import {
  ui,
  fillResults,
  hideBanner,
  popScore,
  resetHudCache,
  showBanner,
  syncDashUi,
  syncHud,
  updateSoundButton,
} from "./ui.js";

const BEST_KEY = "neko-fish-best";

const canvas = document.getElementById("pond");
const ctx = canvas.getContext("2d", { alpha: false });

const audio = new AudioKit();
const background = new PondBackground();
const particles = new Particles();
const cat = new Cat(1);

const state = {
  mode: "menu",
  score: 0,
  best: readNumber(BEST_KEY, 0),
  caught: 0,
  goldCaught: 0,
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
  frenzyIndex: 0,
  frenzyActive: false,
  frenzyTimer: 0,
  bonusTimer: 0,
  magnetTimer: 0,
  hitStop: 0,
  kingSpawned: false,
  touchPoint: null,
};

let width = 0;
let height = 0;
let dpr = 1;
let scale = 1;
let vignette = null;
let endOverlayTimer = 0;
let lastFrame = performance.now();

const fishList = [];

function getBounds() {
  return {
    left: 14,
    right: width - 14,
    top: width < 600 ? 88 : 102,
    bottom: height - (width < 600 ? 88 : 44),
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
  const pressure = clamp(state.elapsed / CONFIG.duration, 0, 1);
  return weightedPick([
    { value: "sardine", weight: 62 - pressure * 30 },
    { value: "koi", weight: 28 + pressure * 14 },
    { value: "gold", weight: 10 + pressure * 16 },
  ]);
}

function maxFishNow() {
  return state.frenzyActive ? CONFIG.maxFishFrenzy : CONFIG.maxFish;
}

function addFish(type = null, awayFromCat = true) {
  if (fishList.length >= maxFishNow()) return;
  fishList.push(makeFish(type ?? pickFishType(), awayFromCat));
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

function startFrenzy() {
  state.frenzyActive = true;
  state.frenzyTimer = CONFIG.frenzyDuration;
  state.spawnTimer = 0;
  for (let i = 0; i < CONFIG.frenzyBurst; i += 1) addFish(i === 0 ? "gold" : null);
  showBanner({
    kicker: "FISH TIDE",
    title: "鱼潮来了！",
    detail: "6 秒双倍积分，小鱼成群",
    tone: "frenzy",
    duration: 2800,
  });
  audio.frenzy();
}

function spawnKing() {
  if (state.kingSpawned) return;
  state.kingSpawned = true;
  const bounds = getBounds();
  const king = makeFish("king", false);
  king.x = rand(width * 0.28, width * 0.72);
  king.y = rand(bounds.top + 95 * scale, height * 0.55);
  king.angle = rand(0, TAU);
  king.spawnFade = 0.7;
  fishList.push(king);
  showBanner({
    kicker: "RARE CATCH",
    title: "鱼王出现！",
    detail: "抓住它，+20 分",
    tone: "king",
    duration: 3200,
  });
  audio.kingSpawn();
}

function updateEvents(dt) {
  while (
    state.frenzyIndex < CONFIG.frenzyTimes.length &&
    state.elapsed >= CONFIG.frenzyTimes[state.frenzyIndex]
  ) {
    state.frenzyIndex += 1;
    startFrenzy();
  }

  if (!state.kingSpawned && state.elapsed >= CONFIG.kingSpawnAt) spawnKing();

  if (state.frenzyActive) {
    state.frenzyTimer = Math.max(0, state.frenzyTimer - dt);
    if (state.frenzyTimer <= 0) state.frenzyActive = false;
  }
  state.bonusTimer = Math.max(0, state.bonusTimer - dt);
  state.magnetTimer = Math.max(0, state.magnetTimer - dt);
}

function startGame() {
  if (state.mode === "playing") return;
  window.clearTimeout(endOverlayTimer);
  audio.init();

  state.mode = "playing";
  state.score = 0;
  state.caught = 0;
  state.goldCaught = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.bestCombo = 0;
  state.timeLeft = CONFIG.duration;
  state.elapsed = 0;
  state.spawnTimer = 0.35;
  state.bubbleTimer = 1;
  state.shake = 0;
  state.paused = false;
  state.frenzyIndex = 0;
  state.frenzyActive = false;
  state.frenzyTimer = 0;
  state.bonusTimer = 0;
  state.magnetTimer = 0;
  state.hitStop = 0;
  state.kingSpawned = false;
  state.touchPoint = null;
  state.pointerId = null;

  particles.clear();
  hideBanner();
  resetHudCache();

  const bounds = getBounds();
  cat.place(
    width * 0.5,
    clamp(bounds.bottom - 90 * scale, bounds.top + 100 * scale, bounds.bottom - 80 * scale),
    scale,
  );
  spawnInitialFish();
  clearKeys();
  particles.splash(cat.x, cat.y + 16);

  ui.menuOverlay.classList.add("is-hidden");
  ui.menuOverlay.setAttribute("aria-hidden", "true");
  ui.overOverlay.classList.add("is-hidden");
  ui.overOverlay.setAttribute("aria-hidden", "true");
  ui.hud.classList.add("is-visible");
  ui.hud.setAttribute("aria-hidden", "false");
  ui.dashBtn.classList.add("is-visible");
  ui.hint.classList.add("is-visible");
  const touchPrimary = window.matchMedia("(pointer: coarse)").matches;
  ui.hint.textContent = touchPrimary
    ? "按住屏幕带着小猫走；双击或长按可以冲刺！"
    : "移动小猫碰小鱼；点击或按空格可以冲刺！";
  state.hintTimer = CONFIG.hintDuration + 1;
  ui.comboTag.classList.remove("is-visible");
  ui.timerPill.classList.remove("is-low");

  syncHud(state, true);
  updateSoundButton(audio);
  syncDashUi(cat, true);
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
  state.bonusTimer = 0;
  state.magnetTimer = 0;
  state.frenzyActive = false;
  state.hitStop = 0;
  state.touchPoint = null;
  cat.finishRound();
  ui.hint.classList.remove("is-visible");
  ui.dashBtn.classList.remove("is-visible");
  ui.comboTag.classList.remove("is-visible");
  hideBanner();
  syncHud(state, true);

  const previousBest = state.best;
  const isNewBest = state.score > previousBest;
  if (isNewBest) {
    state.best = state.score;
    writeValue(BEST_KEY, state.best);
  }
  ui.bestValue.textContent = String(state.best);
  ui.menuBest.textContent = String(state.best);

  const stars = fillResults(state, isNewBest);
  ui.overTitle.textContent = isNewBest ? "新纪录，喵！" : "时间到啦！";
  ui.liveRegion.textContent = `游戏结束，本局得分 ${state.score} 分，捞到 ${state.caught} 条小鱼，点亮 ${stars} 颗星。`;
  audio.gameOver();

  endOverlayTimer = window.setTimeout(() => {
    if (state.mode !== "over") return;
    ui.overOverlay.classList.remove("is-hidden");
    ui.overOverlay.setAttribute("aria-hidden", "false");
    ui.replayBtn.focus({ preventScroll: true });
    particles.confetti(width);
    if (stars === 3) particles.heartRain(width);
    if (isNewBest) audio.newBest();
  }, 620);
}

function catchFish(fish) {
  state.combo += 1;
  state.comboTimer = CONFIG.comboWindow;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const boost = (state.frenzyActive ? 2 : 1) * (state.bonusTimer > 0 ? 2 : 1);
  const gain = fish.spec.points * comboMultiplier(state.combo) * boost;

  state.score += gain;
  state.caught += 1;
  if (fish.type === "gold") state.goldCaught += 1;
  cat.triggerCatch();
  state.shake = Math.max(state.shake, fish.isKing ? 11 : fish.isGold ? 6 : 2.5);
  particles.catchBurst(fish.x, fish.y, {
    special: fish.isGold,
    text: `+${gain}`,
    heart: { x: cat.x, y: cat.y - 24 },
  });
  audio.catchFish(state.combo, fish.isGold);

  if (state.combo === CONFIG.magnetCombo) {
    state.magnetTimer = CONFIG.magnetDuration;
    cat.triggerStarEyes();
    showBanner({
      kicker: "COMBO ×5",
      title: "猫猫磁铁！",
      detail: "小鱼会被吸过来",
      tone: "magnet",
      duration: 2200,
    });
    audio.milestone(1);
  }

  if (state.combo === CONFIG.bonusCombo) {
    state.bonusTimer = CONFIG.bonusDuration;
    cat.triggerStarEyes(CONFIG.starEyesDuration + 0.8);
    particles.heartRain(width);
    showBanner({
      kicker: "COMBO ×10",
      title: "爱心雨！",
      detail: "3 秒双倍积分",
      tone: "bonus",
      duration: 2800,
    });
    audio.milestone(2);
  }

  if (fish.isKing) {
    particles.hearts({ x: cat.x, y: cat.y - 24 }, true);
    showBanner({
      kicker: "KING CATCH",
      title: "鱼王落网！",
      detail:
        state.combo === CONFIG.bonusCombo
          ? `+${gain} 分 · 双倍积分开启`
          : `+${gain} 分`,
      tone: "king",
      duration: 2000,
    });
    audio.kingCaught();
  }

  popScore();
  syncHud(state);
}

function pruneCaughtFish() {
  for (let i = fishList.length - 1; i >= 0; i -= 1) {
    if (fishList[i].caught && fishList[i].catchTimer <= 0) fishList.splice(i, 1);
  }
}

function checkCatches() {
  for (let i = fishList.length - 1; i >= 0; i -= 1) {
    const fish = fishList[i];
    if (fish.caught) continue;
    const catchDistance = cat.catchRadius + fish.radius;
    if (distSq(cat.x, cat.y, fish.x, fish.y) > catchDistance * catchDistance) continue;

    fish.startCatch({ x: cat.x, y: cat.y - 6 * scale });
    catchFish(fish);
    state.hitStop = Math.max(state.hitStop, CONFIG.hitStop);
  }

  if (state.timeLeft <= 0 && state.mode === "playing") endGame();
}

function updateSpawning(dt) {
  const frenzyBonus = state.frenzyActive ? 5 : 0;
  const targetCount = Math.min(
    maxFishNow(),
    CONFIG.initialFish + Math.floor(state.elapsed / 18) * 2 + frenzyBonus,
  );

  if (fishList.length < targetCount) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      addFish();
      const pressure = clamp(state.elapsed / CONFIG.duration, 0, 1);
      const interval = rand(0.34, 0.82) * (1 - pressure * 0.32);
      state.spawnTimer = state.frenzyActive ? interval * 0.5 : interval;
    }
  } else {
    state.spawnTimer = Math.max(state.spawnTimer, 0.18);
  }
}

function updateAmbient(dt) {
  state.bubbleTimer -= dt;
  if (state.bubbleTimer <= 0) {
    state.bubbleTimer = rand(0.45, 1.3);
    const activeFish = fishList.filter((fish) => !fish.caught);
    const source = activeFish.length > 0 ? pick(activeFish) : null;
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
    pruneCaughtFish();
    return;
  }

  state.elapsed += dt;
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer <= 0 && state.combo !== 0) state.combo = 0;
  state.hintTimer = Math.max(0, state.hintTimer - dt);
  if (state.hintTimer <= 0) ui.hint.classList.remove("is-visible");

  updateEvents(dt);

  const direction = keyDirection();
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
  for (const fish of fishList) {
    fish.update(dt, env);
    if (!fish.caught && state.magnetTimer > 0) {
      fish.attract(dt, cat, CONFIG.magnetRadius * scale, CONFIG.magnetSpeed * scale);
    }
  }

  pruneCaughtFish();
  checkCatches();
  if (state.mode !== "playing") return;

  updateSpawning(dt);
  updateAmbient(dt);

  if (state.timeLeft <= 0) endGame();

  syncHud(state);
  syncDashUi(cat);
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

  drawTouchIndicator();
}

function drawTouchIndicator() {
  const point = state.touchPoint;
  if (!point || state.mode !== "playing") return;
  const targetY = point.y - CONFIG.touchOffset;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 252, 240, 0.85)";
  ctx.fillStyle = "rgba(255, 252, 240, 0.12)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, 17, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255, 252, 240, 0.4)";
  ctx.beginPath();
  ctx.moveTo(point.x, point.y - 19);
  ctx.lineTo(point.x, targetY + 5);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 248, 221, 0.92)";
  ctx.beginPath();
  ctx.arc(point.x, targetY, 3.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function frame(now) {
  requestAnimationFrame(frame);
  const rawDt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (state.paused) return;

  if (state.hitStop > 0) {
    state.hitStop = Math.max(0, state.hitStop - Math.min(rawDt, 0.05));
    render();
    return;
  }

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
    syncDashUi(cat);
    audio.init();
  }
}

function setupUi() {
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
    updateSoundButton(audio);
  });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => window.setTimeout(resize, 180));

  document.addEventListener("visibilitychange", () => {
    state.paused = document.hidden;
    if (document.hidden) clearKeys();
    lastFrame = performance.now();
  });
}

function setupDebug() {
  if (!new URLSearchParams(window.location.search).has("debug")) return;
  window.__nekoDebug = {
    state,
    fishList,
    cat,
    start: startGame,
    end: endGame,
    setScore(value) {
      state.score = value;
      syncHud(state, true);
    },
    spawnFish: addFish,
    spawnAt(type, x, y) {
      const fish = makeFish(type, false);
      fish.x = x;
      fish.y = y;
      fish.spawnFade = 1;
      fishList.push(fish);
      return fish;
    },
    spawnKing,
    pickFishType,
    triggerFrenzy: startFrenzy,
    banner: showBanner,
  };
}

function init() {
  resize();
  seedMenuFish();
  updateSoundButton(audio);
  ui.bestValue.textContent = String(state.best);
  ui.menuBest.textContent = String(state.best);
  resetHudCache();
  syncHud(state, true);
  setupUi();
  setupInput({
    canvas,
    ui,
    state,
    cat,
    audio,
    triggerDash,
    requestStart,
    onTouchPoint(point) {
      state.touchPoint = point;
    },
    getViewport: () => ({ width, height }),
  });
  setupDebug();
  requestAnimationFrame((now) => {
    lastFrame = now;
    frame(now);
  });
}

init();
