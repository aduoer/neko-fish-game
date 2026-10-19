import { CONFIG, SCORE_RANKS, comboMultiplier, starsForScore } from "./config.js";
import { clamp, formatClock } from "./utils.js";

export const ui = {
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
  eventBanner: document.getElementById("eventBanner"),
  eventKicker: document.getElementById("eventKicker"),
  eventTitle: document.getElementById("eventTitle"),
  eventDetail: document.getElementById("eventDetail"),
  menuOverlay: document.getElementById("menuOverlay"),
  menuBest: document.getElementById("menuBest"),
  startBtn: document.getElementById("startBtn"),
  overOverlay: document.getElementById("overOverlay"),
  overTitle: document.getElementById("overTitle"),
  rankLine: document.getElementById("rankLine"),
  resultStars: document.getElementById("resultStars"),
  resultHook: document.getElementById("resultHook"),
  finalScore: document.getElementById("finalScore"),
  finalCaught: document.getElementById("finalCaught"),
  finalCombo: document.getElementById("finalCombo"),
  finalGold: document.getElementById("finalGold"),
  finalBest: document.getElementById("finalBest"),
  newBest: document.getElementById("newBest"),
  replayBtn: document.getElementById("replayBtn"),
  replayLabel: document.getElementById("replayLabel"),
  liveRegion: document.getElementById("liveRegion"),
};

let hudScore = -1;
let hudTime = -1;
let hudCombo = -1;
let hudComboVisible = false;
let dashWasCooling = null;
let bannerTimer = 0;

export function resetHudCache() {
  hudScore = -1;
  hudTime = -1;
  hudCombo = -1;
  hudComboVisible = false;
  dashWasCooling = null;
}

export function syncHud(state, force = false) {
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
    ui.comboValue.textContent = `×${comboMultiplier(state.combo)}`;
  }

  if (comboVisible) {
    const ratio = clamp(state.comboTimer / CONFIG.comboWindow, 0, 1);
    ui.comboBar.style.transform = `scaleX(${ratio.toFixed(3)})`;
  }
}

export function popScore() {
  ui.scoreValue.classList.remove("is-popping");
  void ui.scoreValue.offsetWidth;
  ui.scoreValue.classList.add("is-popping");
}

export function syncDashUi(cat, force = false) {
  const cooling = cat.dashCooldown > 0;
  if (force || cooling !== dashWasCooling) {
    dashWasCooling = cooling;
    ui.dashBtn.classList.toggle("is-cooling", cooling);
    ui.dashBtn.setAttribute("aria-disabled", String(cooling));
  }
  const progress = clamp(cat.dashCooldown / CONFIG.dashCooldown, 0, 1);
  ui.dashCd.style.setProperty("--cd", (progress * 100).toFixed(1));
}

export function updateSoundButton(audio) {
  ui.soundBtn.classList.toggle("is-muted", !audio.enabled);
  ui.soundBtn.setAttribute("aria-pressed", String(audio.enabled));
  ui.soundBtn.setAttribute("aria-label", audio.enabled ? "关闭声音" : "开启声音");
}

export function showBanner({
  kicker = "",
  title,
  detail = "",
  tone = "gold",
  duration = 2600,
} = {}) {
  window.clearTimeout(bannerTimer);
  ui.eventKicker.textContent = kicker;
  ui.eventTitle.textContent = title;
  ui.eventDetail.textContent = detail;
  ui.eventBanner.dataset.tone = tone;
  ui.eventBanner.classList.remove("is-visible");
  void ui.eventBanner.offsetWidth;
  ui.eventBanner.classList.add("is-visible");
  ui.eventBanner.setAttribute("aria-hidden", "false");
  if (duration > 0) {
    bannerTimer = window.setTimeout(hideBanner, duration);
  }
}

export function hideBanner() {
  window.clearTimeout(bannerTimer);
  bannerTimer = 0;
  ui.eventBanner.classList.remove("is-visible");
  ui.eventBanner.setAttribute("aria-hidden", "true");
}

export function fillResults(state, isNewBest) {
  const stars = starsForScore(state.score);
  const starElements = ui.resultStars.querySelectorAll("span");
  starElements.forEach((element, index) => {
    element.classList.toggle("is-on", index < stars);
  });
  ui.resultStars.classList.remove("is-popping");
  void ui.resultStars.offsetWidth;
  ui.resultStars.classList.add("is-popping");
  ui.resultStars.setAttribute("aria-label", `3 颗星中点亮 ${stars} 颗`);

  const nextThreshold = CONFIG.starThresholds[stars];
  let nearMiss = false;
  if (stars === 3) {
    ui.resultHook.textContent = isNewBest
      ? "三星满分，还刷新了纪录！"
      : "三星达成！下一次挑战更高分吧。";
  } else if (nextThreshold !== undefined) {
    const gap = nextThreshold - state.score;
    const nearGap = Math.max(8, Math.round(nextThreshold * 0.06));
    nearMiss = gap <= nearGap;
    ui.resultHook.textContent = nearMiss
      ? `只差 ${gap} 分就多一颗星，差一点点！`
      : `再捞 ${gap} 分，就能点亮下一颗星。`;
  }

  ui.finalScore.textContent = String(state.score);
  ui.finalCaught.textContent = String(state.caught);
  ui.finalCombo.textContent = String(state.bestCombo);
  ui.finalGold.textContent = String(state.goldCaught);
  ui.finalBest.textContent = String(state.best);
  ui.newBest.classList.toggle("is-hidden", !isNewBest);
  ui.replayLabel.textContent =
    stars === 3 ? "再挑战一局" : nearMiss ? "差一点，再来一篮" : "再来一篮";

  const rank = SCORE_RANKS.reduce(
    (current, entry) => (state.score >= entry.min ? entry : current),
    SCORE_RANKS[0],
  );
  ui.rankLine.textContent = rank.text;
  return stars;
}
