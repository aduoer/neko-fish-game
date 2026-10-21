import { CONFIG, FISH_TYPES, comboMultiplier } from "./config.js";
import { clamp, distSq, pick, rand, TAU } from "./utils.js";
import { AudioKit } from "./audio.js";
import { PondBackground } from "./background.js";
import { Particles } from "./particles.js";
import { Cat } from "./cat.js";
import { clearKeys, keyDirection, setupInput } from "./input.js";
import { getPondSkin, getRingSkin } from "./cosmetics.js";
import { getCatSkin } from "./cat-skins.js";
import { FishSpawner } from "./spawner.js";
import { PondEvents, linkEventState } from "./events.js";
import { PawNet } from "./net.js";
import { FortuneRush } from "./fortune-rush.js";
import { drawZhaocaiPortrait } from "./zhaocai.js";
import {
  addCoins,
  bestFor,
  claimDaily,
  getCoins,
  getProfile,
  updateBest,
} from "./progress.js";
import { createDailyRandom, dateKey, evaluateGoals, goalValue } from "./daily.js";
import { Shop } from "./shop.js";
import { ShareOverlay } from "./share-card.js";
import { createModeUi } from "./mode-ui.js";
import { buildShareSnapshot } from "./result.js";
import { installDebug } from "./debug.js";
import { createControls } from "./game-controls.js";
import { setupUiEvents } from "./ui-events.js";
import { setupSecretCommand } from "./secret-command.js";
import { drawTouchIndicator } from "./touch-indicator.js";
import {
  fillResults,
  hideBanner,
  popScore,
  resetHudCache,
  showBanner,
  syncDashUi,
  syncFortuneUi,
  syncHud,
  syncNetUi,
  syncWallet,
  ui,
  updateSoundButton,
} from "./ui.js";

const canvas = document.getElementById("pond");
const ctx = canvas.getContext("2d", { alpha: false });

let width = 0;
let height = 0;
let dpr = 1;
let scale = 1;
let endOverlayTimer = 0;
let lastFrame = performance.now();
let lastResult = null;

const audio = new AudioKit();
const background = new PondBackground();
const particles = new Particles();
const cat = new Cat(1);

const state = {
  mode: "menu",
  modeKey: "classic",
  score: 0,
  best: bestFor("classic"),
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
  bonusTimer: 0,
  magnetTimer: 0,
  hitStop: 0,
  touchPoint: null,
  runCoins: 0,
  random: Math.random,
  daily: null,
  endlessLimit: CONFIG.endlessStart,
  endlessTime: 0,
  lowWarned: false,
  modalOpen: false,
  runId: 0,
  fortuneUsed: false,
};

const modeUi = createModeUi({ state, ui });
const refreshModeUi = modeUi.refreshModeUi;

const spawner = new FishSpawner({
  cat,
  getBounds,
  getElapsed: () => state.elapsed,
  getFrenzy: () => events.frenzyActive,
});
const fishList = spawner.fishList;

const fortuneRush = new FortuneRush({
  onCatch(fish) {
    catchFish(fish, { silent: true, showText: true });
  },
  onFinish(count) {
    finishFortuneRush(count);
  },
});

const events = new PondEvents({
  audio,
  addFish: (type) => spawner.addFish(type, true),
  spawnKingFish,
  showBanner,
});

// Keep the original debug/state surface in sync with the extracted event timer.
linkEventState(state, events);

const net = new PawNet({
  getCat: () => cat,
  getScale: () => scale,
  onCast: castNet,
  audio,
});

const controls = createControls({ state, ui, cat, audio, net, startGame });
const { beginNet, cancelNet, onModalChange, releaseNet, requestStart, triggerDash } = controls;

const shop = new Shop({
  ui,
  audio,
  onChange: () => {
    applyCosmetics();
    refreshModeUi();
  },
  onModalChange,
});

const shareOverlay = new ShareOverlay({ ui, audio, onModalChange });

function getBounds() {
  return {
    left: 14,
    right: width - 14,
    top: width < 600 ? 88 : 102,
    bottom: height - (width < 600 ? 88 : 44),
  };
}

function applyCosmetics() {
  const profile = getProfile();
  cat.setCatStyle(getCatSkin(profile.cat));
  cat.setRingStyle(getRingSkin(profile.ring));
  background.setTheme(getPondSkin(profile.pond).theme);
  syncWallet(profile.coins);
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
  spawner.setScale(scale);
  background.resize(width, height);

  const bounds = getBounds();
  if (previousWidth > 0 && previousHeight > 0) {
    const ratioX = width / previousWidth;
    const ratioY = height / previousHeight;
    cat.x *= ratioX;
    cat.y *= ratioY;
    cat.targetX *= ratioX;
    cat.targetY *= ratioY;
    spawner.resizeFish(ratioX, ratioY, bounds);
  }

  const margin = 72 * scale;
  if (state.mode === "menu") {
    cat.place(
      width * 0.5,
      clamp(bounds.bottom - 100 * scale, bounds.top + margin, bounds.bottom - margin),
      scale,
    );
  } else {
    cat.x = clamp(cat.x, bounds.left + margin, bounds.right - margin);
    cat.y = clamp(cat.y, bounds.top + margin, bounds.bottom - margin);
    cat.targetX = clamp(cat.targetX, bounds.left + margin, bounds.right - margin);
    cat.targetY = clamp(cat.targetY, bounds.top + margin, bounds.bottom - margin);
  }
}

function spawnKingFish() {
  const bounds = getBounds();
  const king = spawner.makeFish("king", false);
  king.x = rand(width * 0.28, width * 0.72, state.random);
  king.y = rand(bounds.top + 95 * scale, height * 0.55, state.random);
  king.angle = rand(0, TAU, state.random);
  king.spawnFade = 0.7;
  fishList.push(king);
  return king;
}

function showMenu() {
  window.clearTimeout(endOverlayTimer);
  state.mode = "menu";
  state.paused = false;
  state.daily = null;
  state.touchPoint = null;
  state.modalOpen = false;
  state.fortuneUsed = false;
  cat.finishRound();
  net.cancel();
  fortuneRush.cancel();
  syncFortuneUi(false, false, true);
  events.reset(state.modeKey);
  spawner.setRandom(Math.random);
  spawner.seedMenuFish();
  particles.clear();
  hideBanner();

  ui.menuOverlay.classList.remove("is-hidden");
  ui.menuOverlay.setAttribute("aria-hidden", "false");
  ui.menuOverlay.inert = false;
  ui.overOverlay.classList.add("is-hidden");
  ui.overOverlay.setAttribute("aria-hidden", "true");
  ui.overOverlay.inert = false;
  ui.hud.classList.remove("is-visible");
  ui.hud.setAttribute("aria-hidden", "true");
  ui.dashBtn.classList.remove("is-visible");
  ui.netBtn.classList.remove("is-visible");
  ui.fortuneBtn.classList.remove("is-visible");
  ui.hint.classList.remove("is-visible");
  ui.comboTag.classList.remove("is-visible");
  ui.timerPill.classList.remove("is-low");
  ui.dailyPill.classList.add("is-hidden");

  modeUi.dropStaleDaily();
  applyCosmetics();
  refreshModeUi();
  resetHudCache();

  const bounds = getBounds();
  const margin = 72 * scale;
  cat.place(
    width * 0.5,
    clamp(bounds.bottom - 100 * scale, bounds.top + margin, bounds.bottom - margin),
    scale,
  );
  window.setTimeout(() => ui.startBtn.focus({ preventScroll: true }), 80);
}

function startGame() {
  if (state.mode === "playing" || state.modalOpen) return;
  window.clearTimeout(endOverlayTimer);
  audio.init();
  lastResult = null;

  state.mode = "playing";
  state.runId += 1;
  state.score = 0;
  state.caught = 0;
  state.goldCaught = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.bestCombo = 0;
  state.timeLeft = state.modeKey === "endless" ? CONFIG.endlessStart : CONFIG.duration;
  state.elapsed = 0;
  state.spawnTimer = 0.35;
  state.bubbleTimer = 1;
  state.shake = 0;
  state.paused = false;
  state.bonusTimer = 0;
  state.magnetTimer = 0;
  state.hitStop = 0;
  state.touchPoint = null;
  state.pointerId = null;
  state.runCoins = 0;
  state.endlessLimit = CONFIG.endlessStart;
  state.endlessTime = 0;
  state.lowWarned = false;
  state.fortuneUsed = false;
  state.best = bestFor(state.modeKey);
  state.daily = state.modeKey === "daily" ? modeUi.makeDailyState() : null;
  state.random =
    state.modeKey === "daily" && state.daily
      ? createDailyRandom(state.daily.challenge.seed)
      : Math.random;

  spawner.setRandom(state.random);
  events.reset(state.modeKey);
  net.reset();
  fortuneRush.cancel();
  syncFortuneUi(false, false, true);
  particles.clear();
  hideBanner();
  resetHudCache();
  applyCosmetics();

  const bounds = getBounds();
  cat.place(
    width * 0.5,
    clamp(bounds.bottom - 90 * scale, bounds.top + 100 * scale, bounds.bottom - 80 * scale),
    scale,
  );
  spawner.spawnInitialFish();
  clearKeys();
  particles.splash(cat.x, cat.y + 16);

  ui.menuOverlay.classList.add("is-hidden");
  ui.menuOverlay.setAttribute("aria-hidden", "true");
  ui.overOverlay.classList.add("is-hidden");
  ui.overOverlay.setAttribute("aria-hidden", "true");
  ui.hud.classList.add("is-visible");
  ui.hud.setAttribute("aria-hidden", "false");
  ui.dashBtn.classList.add("is-visible");
  ui.netBtn.classList.add("is-visible");
  ui.fortuneBtn.classList.add("is-visible");
  ui.hint.classList.add("is-visible");
  const touchPrimary = window.matchMedia("(pointer: coarse)").matches;
  ui.hint.textContent = touchPrimary
    ? "拖动带小猫走；按住左下撒网，点右侧招财突击！"
    : "碰到小鱼就能捞；空格冲刺，E 撒网，Q 招财突击！";
  state.hintTimer = CONFIG.hintDuration + 1.4;
  ui.comboTag.classList.remove("is-visible");
  ui.timerPill.classList.remove("is-low");
  ui.dailyPill.classList.add("is-hidden");

  syncHud(state, true);
  syncDashUi(cat, true);
  syncNetUi(net, true);
  syncFortuneUi(false, false, true);
  updateSoundButton(audio);
  ui.liveRegion.textContent =
    state.modeKey === "endless"
      ? "无尽模式开始，捞鱼回满耐心。"
      : state.modeKey === "daily"
        ? "每日挑战开始，完成三个目标赢金币。"
        : "游戏开始，移动小猫去捞鱼吧。";
  audio.start();
}

async function endGame(reason = "time") {
  if (state.mode !== "playing") return;
  const run = {
    runId: state.runId,
    modeKey: state.modeKey,
    score: state.score,
    caught: state.caught,
    goldCaught: state.goldCaught,
    bestCombo: state.bestCombo,
    runCoins: state.runCoins,
    endlessTime: state.endlessTime,
    endlessLimit: state.endlessLimit,
    dailyChallenge: state.daily?.challenge ?? null,
  };

  state.mode = "over";
  state.lastEndReason = reason;
  state.timeLeft = Math.max(0, state.timeLeft);
  state.combo = 0;
  state.comboTimer = 0;
  state.hintTimer = 0;
  state.bonusTimer = 0;
  state.magnetTimer = 0;
  state.hitStop = 0;
  state.touchPoint = null;
  cat.finishRound();
  net.cancel();
  fortuneRush.cancel();
  syncFortuneUi(state.fortuneUsed, false, true);
  events.frenzyActive = false;
  ui.hint.classList.remove("is-visible");
  ui.dashBtn.classList.remove("is-visible");
  ui.netBtn.classList.remove("is-visible");
  ui.fortuneBtn.classList.remove("is-visible");
  ui.comboTag.classList.remove("is-visible");
  hideBanner();
  syncNetUi(net, true);

  const dailyExpired =
    run.modeKey === "daily" &&
    Boolean(run.dailyChallenge) &&
    run.dailyChallenge.key !== dateKey();
  const isNewBest = dailyExpired ? false : await updateBest(run.modeKey, run.score);
  await addCoins(run.runCoins);

  let dailyInfo = null;
  if (run.modeKey === "daily" && run.dailyChallenge) {
    const challenge = run.dailyChallenge;
    const values = challenge.goals.map((goal) => goalValue(goal, run));
    const completed = evaluateGoals(challenge, run);
    const claim = await claimDaily(completed, challenge.key);
    dailyInfo = { challenge, values, completed, claim };
  }

  const wallet = getCoins();
  state.best = bestFor(state.modeKey);

  // A fast replay or a menu exit may have started a newer session while the
  // profile transaction was queued behind another tab.
  if (state.mode !== "over" || state.runId !== run.runId) return;

  ui.bestValue.textContent = String(state.best);
  syncHud(state, true);
  if (state.daily && dailyInfo) {
    state.daily.values = dailyInfo.values;
    state.daily.completed = dailyInfo.completed;
  }

  const coinsEarned = run.runCoins + (dailyInfo?.claim.coinsEarned ?? 0);
  syncWallet(wallet);
  const info = {
    modeKey: run.modeKey,
    reason,
    endlessTime: run.endlessTime,
    endlessLimit: run.endlessLimit,
    coinsEarned,
    wallet,
    daily: dailyInfo,
  };
  const stars = fillResults(state, isNewBest, info);
  lastResult = buildShareSnapshot(state, stars, coinsEarned, isNewBest, dailyInfo);
  shareOverlay.setSnapshot(lastResult);
  ui.liveRegion.textContent = `游戏结束，本局得分 ${run.score} 分，捞到 ${run.caught} 条小鱼，获得 ${coinsEarned} 金币。`;
  audio.gameOver();

  endOverlayTimer = window.setTimeout(() => {
    if (state.mode !== "over") return;
    ui.overOverlay.classList.remove("is-hidden");
    ui.overOverlay.setAttribute("aria-hidden", "false");
    ui.overOverlay.inert = false;
    ui.replayBtn.focus({ preventScroll: true });
    particles.confetti(width);
    if (stars === 3) particles.heartRain(width);
    if (isNewBest) audio.newBest();
    if (dailyInfo?.claim.coinsEarned > 0) {
      window.setTimeout(() => audio.dailyComplete(), 700);
    }
  }, 620);
}

function catchFish(fish, options = {}) {
  const silent = Boolean(options.silent);
  state.combo += 1;
  state.comboTimer = CONFIG.comboWindow;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const boost = (events.frenzyActive ? 2 : 1) * (state.bonusTimer > 0 ? 2 : 1);
  const gain = fish.spec.points * comboMultiplier(state.combo) * boost;

  state.score += gain;
  state.caught += 1;
  state.runCoins += fish.spec.coins;
  if (fish.type === "gold") state.goldCaught += 1;
  cat.triggerCatch();
  state.shake = Math.max(state.shake, fish.isKing ? 11 : fish.isGold ? 6 : 2.5);

  if (state.modeKey === "endless") {
    const nextLimit = Math.min(
      CONFIG.endlessMax,
      CONFIG.endlessStart +
        Math.floor(state.caught / CONFIG.endlessStep) * CONFIG.endlessBonus,
    );
    if (nextLimit > state.endlessLimit) {
      state.endlessLimit = nextLimit;
      particles.floatText(cat.x, cat.y - 76 * scale, `耐心 +${CONFIG.endlessBonus} 秒！`, "#ffe897");
    }
    state.timeLeft = state.endlessLimit;
    state.lowWarned = false;
  }

  particles.catchBurst(fish.x, fish.y, {
    special: fish.isGold,
    text: options.showText === false ? "" : `+${gain}`,
    noHearts: silent,
    heart: silent ? null : { x: cat.x, y: cat.y - 24 },
  });
  if (!silent) audio.catchFish(state.combo, fish.isGold);

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
    if (!silent) audio.milestone(1);
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
    if (!silent) audio.milestone(2);
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
    if (!silent) audio.kingCaught();
  }

  if (!silent) popScore();
  syncHud(state);
  return gain;
}

function finishFortuneRush(count) {
  syncFortuneUi(state.fortuneUsed, false, true);
  if (state.mode !== "playing") return;
  if (count > 0) {
    particles.hearts({ x: cat.x, y: cat.y - 24 }, true);
    particles.floatText(width * 0.5, height * 0.44, `招财 +${count}`, "#ffe58b");
    showBanner({
      kicker: "LUCKY RUSH",
      title: `招财捞到 ${count} 条！`,
      detail: "小猫的幸运突击",
      tone: "fortune",
      duration: 2200,
    });
    audio.milestone(count >= 5 ? 2 : 1);
    ui.liveRegion.textContent = `招财突击捞到 ${count} 条小鱼。`;
  } else {
    showBanner({
      kicker: "LUCKY RUSH",
      title: "招财扑了个空…",
      detail: "等小鱼多一点再用吧",
      tone: "fortune",
      duration: 1900,
    });
    ui.liveRegion.textContent = "招财突击没有捞到小鱼。";
  }
  syncHud(state);
}

function useFortuneRush() {
  if (
    state.mode !== "playing" ||
    state.modalOpen ||
    state.fortuneUsed ||
    fortuneRush.active
  ) {
    return false;
  }

  const result = fortuneRush.start({
    fishList,
    width,
    height,
    bounds: getBounds(),
    cat,
    random: state.random,
  });
  if (!result.ok) {
    particles.floatText(
      cat.x,
      cat.y - 76 * scale,
      "等小鱼游过来再用…",
      "#fff3c4",
    );
    ui.liveRegion.textContent = "池塘里还没有小鱼，招财突击没有出发。";
    return false;
  }

  state.fortuneUsed = true;
  state.hitStop = Math.max(state.hitStop, 0.045);
  audio.init();
  audio.fortune();
  syncFortuneUi(true, true, true);
  showBanner({
    kicker: "LUCKY RUSH",
    title: "招财突击！",
    detail: `瞄准 ${result.count} 条小鱼（屏幕内 ${Math.round((result.count / result.total) * 100)}%）`,
    tone: "fortune",
    duration: 1700,
  });
  ui.liveRegion.textContent = `招财突击出动，准备收集 ${result.count} 条小鱼。`;
  return true;
}

function castNet(radius) {
  const caught = [];
  for (let i = fishList.length - 1; i >= 0; i -= 1) {
    const fish = fishList[i];
    if (fish.caught || fish.fortuneBound) continue;
    const reach = radius + fish.radius * 0.4;
    if (distSq(cat.x, cat.y, fish.x, fish.y) > reach * reach) continue;
    fish.startCatch({ x: cat.x, y: cat.y - 6 * scale });
    caught.push(fish);
  }

  let totalGain = 0;
  for (const fish of caught) {
    totalGain += catchFish(fish, { silent: true, showText: false });
  }
  if (caught.length > 0) {
    state.hitStop = Math.max(state.hitStop, 0.045);
    state.shake = Math.max(state.shake, 7);
    particles.netBurst(cat.x, cat.y, radius, caught.length, totalGain);
    particles.hearts({ x: cat.x, y: cat.y - 24 }, caught.some((fish) => fish.isGold));
    audio.catchFish(Math.min(state.combo, 8), caught.some((fish) => fish.isGold));
  } else {
    particles.netBurst(cat.x, cat.y, radius, 0);
    particles.floatText(cat.x, cat.y - 72 * scale, "空网…", "#effffb");
  }
  syncHud(state);
  return caught.length;
}

function pruneCaughtFish() {
  for (let i = fishList.length - 1; i >= 0; i -= 1) {
    if (fishList[i].caught && fishList[i].catchTimer <= 0) fishList.splice(i, 1);
  }
}

function checkCatches() {
  for (let i = fishList.length - 1; i >= 0; i -= 1) {
    const fish = fishList[i];
    if (fish.caught || fish.fortuneBound) continue;
    const catchDistance = cat.catchRadius + fish.radius;
    if (distSq(cat.x, cat.y, fish.x, fish.y) > catchDistance * catchDistance) continue;
    fish.startCatch({ x: cat.x, y: cat.y - 6 * scale });
    catchFish(fish);
    state.hitStop = Math.max(state.hitStop, CONFIG.hitStop);
  }
}

function updateSpawning(dt) {
  const frenzyBonus = events.frenzyActive ? 5 : 0;
  const targetCount = Math.min(
    spawner.maxFishNow(),
    CONFIG.initialFish + Math.floor(state.elapsed / 18) * 2 + frenzyBonus,
  );

  if (fishList.length < targetCount) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawner.addFish();
      const pressure = clamp(state.elapsed / CONFIG.duration, 0, 1);
      const interval =
        rand(0.34, 0.82, state.random) * (1 - pressure * 0.32);
      state.spawnTimer = events.frenzyActive ? interval * 0.5 : interval;
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
  const bounds = getBounds();

  if (state.mode === "menu" || state.mode === "over") {
    cat.update(dt, { bounds, keysX: 0, keysY: 0 });
    const env = { cat, bounds, speedFactor: 0.9, fleeRadius: CONFIG.fleeRadius * scale };
    for (const fish of fishList) fish.update(dt, env);
    if (state.mode === "over") pruneCaughtFish();
    return;
  }

  state.elapsed += dt;
  if (state.modeKey === "endless") state.endlessTime += dt;
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer <= 0 && state.combo !== 0) state.combo = 0;
  state.hintTimer = Math.max(0, state.hintTimer - dt);
  if (state.hintTimer <= 0) ui.hint.classList.remove("is-visible");

  events.update(dt, state.elapsed);
  net.update(dt);
  state.bonusTimer = Math.max(0, state.bonusTimer - dt);
  state.magnetTimer = Math.max(0, state.magnetTimer - dt);

  if (
    state.modeKey === "endless" &&
    state.timeLeft <= 2 &&
    !state.lowWarned &&
    state.timeLeft > 0
  ) {
    state.lowWarned = true;
    particles.floatText(cat.x, cat.y - 80 * scale, "快！再捞一条", "#ffdf8d");
  }

  const direction = keyDirection();
  cat.update(dt, {
    bounds,
    keysX: direction.x,
    keysY: direction.y,
    speedFactor: net.charging ? 0.46 : 1,
  });

  for (const event of cat.drainEvents()) {
    if (event.type === "dash") audio.dash();
    else if (event.type === "wake") particles.dashWake(event.x, event.y, event.angle);
  }

  const speedFactor = 1 + clamp(state.elapsed / CONFIG.duration, 0, 1) * 0.5;
  const env = {
    cat,
    bounds,
    speedFactor,
    fleeRadius: CONFIG.fleeRadius * scale,
    slowRadius: net.charging ? net.radius : 0,
    slowFactor: 0.32,
  };
  for (const fish of fishList) {
    fish.update(dt, env);
    if (!fish.caught && !fish.fortuneBound && state.magnetTimer > 0) {
      fish.attract(dt, cat, CONFIG.magnetRadius * scale, CONFIG.magnetSpeed * scale);
    }
  }

  fortuneRush.update(dt);
  pruneCaughtFish();
  checkCatches();
  if (state.mode !== "playing") return;

  updateSpawning(dt);
  updateAmbient(dt);

  if (state.timeLeft <= 0) {
    endGame(state.modeKey === "endless" ? "patience" : "time");
    return;
  }

  syncHud(state);
  syncDashUi(cat);
  syncNetUi(net);
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  if (state.shake > 0) {
    ctx.translate(rand(-state.shake, state.shake) * 0.35, rand(-state.shake, state.shake) * 0.35);
  }

  background.draw(ctx);
  net.draw(ctx, performance.now() / 1000);

  const visualTime = performance.now() / 1000;
  const sortedFish = fishList.slice().sort((a, b) => a.y - b.y);
  for (const fish of sortedFish) fish.draw(ctx, visualTime);

  cat.draw(ctx, visualTime);
  fortuneRush.draw(ctx, visualTime);
  particles.draw(ctx);
  ctx.restore();

  background.drawVignette(ctx);
  drawTouchIndicator(ctx, state);
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

function init() {
  drawZhaocaiPortrait(ui.fortuneAvatar, 1.1);
  drawZhaocaiPortrait(ui.fortuneMenuAvatar, 2.4);
  setupSecretCommand({ ui, audio });
  applyCosmetics();
  resize();
  state.best = bestFor(state.modeKey);
  spawner.setRandom(Math.random);
  spawner.seedMenuFish();
  updateSoundButton(audio);
  syncWallet(getCoins());
  resetHudCache();
  syncHud(state, true);
  syncNetUi(net, true);
  refreshModeUi();
  setupUiEvents({
    ui,
    audio,
    state,
    net,
    shop,
    shareOverlay,
    requestStart,
    showMenu,
    refreshModeUi,
    resize,
    resetFrameClock: () => {
      lastFrame = performance.now();
    },
  });
  setupInput({
    canvas,
    ui,
    state,
    cat,
    audio,
    triggerDash,
    triggerFortune: useFortuneRush,
    beginNet,
    releaseNet,
    cancelNet,
    requestStart,
    isBlocked: () => state.modalOpen,
    onTouchPoint(point) {
      state.touchPoint = point;
    },
    getViewport: () => ({ width, height }),
  });
  installDebug({
    state,
    fishList,
    cat,
    net,
    events,
    shop,
    shareOverlay,
    startGame,
    endGame,
    showMenu,
    refreshModeUi,
    spawner,
    castNet: () => castNet(net.radius),
    beginNet,
    releaseNet,
    cancelNet,
    showBanner,
    getLastResult: () => lastResult,
    fortuneRush,
    useFortune: useFortuneRush,
  });
  requestAnimationFrame((now) => {
    lastFrame = now;
    frame(now);
  });
}

init();
