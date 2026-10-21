import { CONFIG, SCORE_RANKS, comboMultiplier, starsForScore } from "./config.js";
import { countCompleted } from "./daily.js";
import { clamp, formatClock } from "./utils.js";

export const MODE_LABELS = {
  classic: "经典 60 秒",
  daily: "每日挑战",
  endless: "无尽模式",
};

export const ui = {
  hud: document.getElementById("hud"),
  timerPill: document.getElementById("timerPill"),
  timerValue: document.getElementById("timerValue"),
  timerUnit: document.getElementById("timerUnit"),
  bestValue: document.getElementById("bestValue"),
  scoreValue: document.getElementById("scoreValue"),
  comboTag: document.getElementById("comboTag"),
  comboValue: document.getElementById("comboValue"),
  comboBar: document.getElementById("comboBar"),
  dailyPill: document.getElementById("dailyPill"),
  dailyProgress: document.getElementById("dailyProgress"),
  soundBtn: document.getElementById("soundBtn"),
  dashBtn: document.getElementById("dashBtn"),
  dashCd: document.getElementById("dashCd"),
  netBtn: document.getElementById("netBtn"),
  netCd: document.getElementById("netCd"),
  netCharge: document.getElementById("netCharge"),
  fortuneBtn: document.getElementById("fortuneBtn"),
  fortuneAvatar: document.getElementById("fortuneAvatar"),
  fortuneCount: document.getElementById("fortuneCount"),
  fortuneMenuAvatar: document.getElementById("fortuneMenuAvatar"),
  secretBtn: document.getElementById("secretBtn"),
  secretConsole: document.getElementById("secretConsole"),
  secretForm: document.getElementById("secretForm"),
  secretInput: document.getElementById("secretInput"),
  secretNote: document.getElementById("secretNote"),
  hint: document.getElementById("hint"),
  eventBanner: document.getElementById("eventBanner"),
  eventKicker: document.getElementById("eventKicker"),
  eventTitle: document.getElementById("eventTitle"),
  eventDetail: document.getElementById("eventDetail"),
  menuOverlay: document.getElementById("menuOverlay"),
  menuBest: document.getElementById("menuBest"),
  menuCoins: document.getElementById("menuCoins"),
  shopBtn: document.getElementById("shopBtn"),
  modePicker: document.getElementById("modePicker"),
  modePreview: document.getElementById("modePreview"),
  modePreviewTitle: document.getElementById("modePreviewTitle"),
  modePreviewGoals: document.getElementById("modePreviewGoals"),
  modePreviewNote: document.getElementById("modePreviewNote"),
  startBtn: document.getElementById("startBtn"),
  startLabel: document.getElementById("startLabel"),
  overOverlay: document.getElementById("overOverlay"),
  overEyebrow: document.getElementById("overEyebrow"),
  overTitle: document.getElementById("overTitle"),
  rankLine: document.getElementById("rankLine"),
  resultStars: document.getElementById("resultStars"),
  resultHook: document.getElementById("resultHook"),
  resultMode: document.getElementById("resultMode"),
  resultNote: document.getElementById("resultNote"),
  finalScore: document.getElementById("finalScore"),
  finalCaught: document.getElementById("finalCaught"),
  finalCombo: document.getElementById("finalCombo"),
  finalGold: document.getElementById("finalGold"),
  finalBest: document.getElementById("finalBest"),
  finalCoins: document.getElementById("finalCoins"),
  walletCoins: document.getElementById("walletCoins"),
  dailyResults: document.getElementById("dailyResults"),
  dailyResultList: document.getElementById("dailyResultList"),
  dailyResultNote: document.getElementById("dailyResultNote"),
  newBest: document.getElementById("newBest"),
  replayBtn: document.getElementById("replayBtn"),
  replayLabel: document.getElementById("replayLabel"),
  shareBtn: document.getElementById("shareBtn"),
  homeBtn: document.getElementById("homeBtn"),
  shopOverlay: document.getElementById("shopOverlay"),
  shopCloseBtn: document.getElementById("shopCloseBtn"),
  shopWallet: document.getElementById("shopWallet"),
  shopTabs: document.getElementById("shopTabs"),
  shopGrid: document.getElementById("shopGrid"),
  shopMessage: document.getElementById("shopMessage"),
  shareOverlay: document.getElementById("shareOverlay"),
  shareCanvas: document.getElementById("shareCanvas"),
  shareCloseBtn: document.getElementById("shareCloseBtn"),
  shareDownloadBtn: document.getElementById("shareDownloadBtn"),
  shareNativeBtn: document.getElementById("shareNativeBtn"),
  shareStatus: document.getElementById("shareStatus"),
  liveRegion: document.getElementById("liveRegion"),
};

let hudScore = -1;
let hudTime = -1;
let hudCombo = -1;
let hudComboVisible = false;
let hudDaily = -1;
let dailyWasVisible = false;
let dashWasCooling = null;
let netWasCooling = null;
let netWasCharging = null;
let fortuneWasUsed = null;
let fortuneWasActive = null;
let bannerTimer = 0;

export function resetHudCache() {
  hudScore = -1;
  hudTime = -1;
  hudCombo = -1;
  hudComboVisible = false;
  hudDaily = -1;
  dailyWasVisible = false;
  dashWasCooling = null;
  netWasCooling = null;
  netWasCharging = null;
  fortuneWasUsed = null;
  fortuneWasActive = null;
}

export function syncHud(state, force = false) {
  const endless = state.modeKey === "endless";
  const time = endless
    ? Math.max(0, state.timeLeft).toFixed(1)
    : String(formatClock(state.timeLeft));
  if (force || time !== hudTime) {
    hudTime = time;
    ui.timerValue.textContent = time;
    ui.timerUnit.textContent = "秒";
    const low = endless ? state.timeLeft <= 1.8 : state.timeLeft <= 10;
    ui.timerPill.classList.toggle("is-low", state.mode === "playing" && low);
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

  const dailyVisible = state.mode === "playing" && state.modeKey === "daily" && state.daily;
  if (force || dailyVisible !== dailyWasVisible) {
    dailyWasVisible = dailyVisible;
    ui.dailyPill.classList.toggle("is-hidden", !dailyVisible);
  }
  if (dailyVisible) {
    const done = countCompleted(state.daily.challenge, state);
    if (force || done !== hudDaily) {
      hudDaily = done;
      ui.dailyProgress.textContent = `${done}/3`;
      ui.dailyPill.classList.toggle("is-complete", done === 3);
    }
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

export function syncNetUi(net, force = false) {
  const cooling = net.cooldown > 0;
  const charging = net.charging;
  if (force || cooling !== netWasCooling) {
    netWasCooling = cooling;
    ui.netBtn.classList.toggle("is-cooling", cooling);
    ui.netBtn.setAttribute("aria-disabled", String(cooling || charging));
  }
  if (force || charging !== netWasCharging) {
    netWasCharging = charging;
    ui.netBtn.classList.toggle("is-charging", charging);
    ui.netBtn.setAttribute("aria-pressed", String(charging));
  }
  const cooldownProgress = clamp(net.cooldown / CONFIG.netCooldown, 0, 1);
  ui.netCd.style.setProperty("--cd", (cooldownProgress * 100).toFixed(1));
  ui.netCharge.style.setProperty("--charge", (net.chargeRatio * 100).toFixed(1));
  ui.netBtn.setAttribute(
    "aria-label",
    cooling ? "撒网冷却中" : charging ? "松开撒网" : "按住蓄力撒网",
  );
}

export function syncFortuneUi(used, active, force = false) {
  if (force || used !== fortuneWasUsed) {
    fortuneWasUsed = used;
    ui.fortuneBtn.classList.toggle("is-used", used);
  }
  if (force || active !== fortuneWasActive) {
    fortuneWasActive = active;
    ui.fortuneBtn.classList.toggle("is-active", active);
  }
  const unavailable = used || active;
  ui.fortuneBtn.setAttribute("aria-disabled", String(unavailable));
  ui.fortuneCount.textContent = active ? "✦" : used ? "✓" : "1";
  ui.fortuneBtn.setAttribute(
    "aria-label",
    active
      ? "招财突击出动中"
      : used
        ? "招财突击本局已经用过了"
        : "招财突击：收集屏幕内三分之一到三分之二的小鱼，每局一次",
  );
}

export function syncWallet(coins) {
  const text = String(coins);
  ui.menuCoins.textContent = text;
  ui.walletCoins.textContent = text;
  ui.shopWallet.textContent = text;
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

function buildDailyResultRow(goal, completed, claimed, value = 0) {
  const row = document.createElement("div");
  row.className = `daily-result-row${completed ? " is-done" : ""}`;
  const icon = document.createElement("span");
  icon.className = "daily-result-icon";
  icon.textContent = completed ? "✓" : goal.icon;
  const copy = document.createElement("div");
  copy.className = "daily-result-copy";
  const label = document.createElement("b");
  label.textContent = goal.label;
  const status = document.createElement("small");
  status.textContent = claimed ? "奖励已领取" : completed ? "目标完成" : "还差一点点";
  copy.append(label, status);
  const progress = document.createElement("span");
  progress.className = "daily-result-progress";
  const shownValue = claimed ? goal.target : Math.min(goal.target, Math.floor(value));
  progress.textContent = `${shownValue}/${goal.target}`;
  row.append(icon, copy, progress);
  return row;
}

export function fillResults(state, isNewBest, info = {}) {
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

  ui.overOverlay.dataset.mode = info.modeKey ?? "classic";
  ui.overEyebrow.textContent =
    info.reason === "patience"
      ? "PATIENCE UP"
      : info.modeKey === "daily"
        ? "DAILY CHALLENGE"
        : "TIME'S UP";
  ui.overTitle.textContent =
    info.reason === "patience"
      ? "小鱼溜走啦！"
      : info.modeKey === "daily"
        ? "今日挑战结束！"
        : isNewBest
          ? "新纪录，喵！"
          : "时间到啦！";
  ui.resultMode.textContent = MODE_LABELS[info.modeKey] ?? MODE_LABELS.classic;
  ui.resultNote.classList.toggle("is-hidden", info.modeKey === "daily");
  ui.resultNote.textContent =
    info.modeKey === "endless"
      ? `小猫坚持了 ${info.endlessTime.toFixed(1)} 秒，最高耐心 ${info.endlessLimit} 秒。`
      : info.modeKey === "daily"
        ? "每天 0 点刷新目标，明天再来挑战吧。"
        : "慢慢来，池塘里的小鱼明天也还在。";

  ui.finalScore.textContent = String(state.score);
  ui.finalCaught.textContent = String(state.caught);
  ui.finalCombo.textContent = String(state.bestCombo);
  ui.finalGold.textContent = String(state.goldCaught);
  ui.finalBest.textContent = String(state.best);
  ui.finalCoins.textContent = String(info.coinsEarned ?? 0);
  ui.walletCoins.textContent = String(info.wallet ?? 0);
  ui.newBest.classList.toggle("is-hidden", !isNewBest);
  ui.replayLabel.textContent =
    info.modeKey === "daily"
      ? "再挑战今日"
      : info.modeKey === "endless"
        ? "再撑一会儿"
        : stars === 3
          ? "再挑战一局"
          : nearMiss
            ? "差一点，再来一篮"
            : "再来一篮";

  ui.dailyResults.classList.toggle("is-hidden", info.modeKey !== "daily" || !info.daily);
  if (info.modeKey === "daily" && info.daily) {
    const { challenge, completed, claim } = info.daily;
    const rows = challenge.goals.map((goal, index) => {
      const claimed = Boolean(claim.claimed[index]);
      return buildDailyResultRow(
        goal,
        completed[index] || claimed,
        claimed,
        info.daily.values?.[index] ?? (completed[index] ? goal.target : 0),
      );
    });
    ui.dailyResultList.replaceChildren(...rows);
    if (claim.expired) {
      ui.dailyResultNote.textContent =
        "每日目标已跨天刷新，本局不计入新一天，明天再来挑战吧。";
    } else if (claim.coinsEarned > 0) {
      ui.dailyResultNote.textContent = claim.bonusEarned
        ? `三项目标全部达成！每日奖励 +${claim.coinsEarned} 金币。`
        : `每日奖励 +${claim.coinsEarned} 金币，继续完成剩余目标吧。`;
    } else if (claim.claimed.every(Boolean)) {
      ui.dailyResultNote.textContent = "今日目标已全部完成，奖励也已经领取啦。";
    } else {
      ui.dailyResultNote.textContent = "完成每日目标就能领取金币，明天还会刷新。";
    }
  }

  const rank = SCORE_RANKS.reduce(
    (current, entry) => (state.score >= entry.min ? entry : current),
    SCORE_RANKS[0],
  );
  ui.rankLine.textContent = rank.text;
  return stars;
}
