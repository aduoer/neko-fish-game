import { createDailyChallenge, dateKey } from "./daily.js";
import { bestFor, getCoins, getDailyRecord } from "./progress.js";
import { syncWallet } from "./ui.js";

function modeGoalRow(icon, label, meta, done = false) {
  const row = document.createElement("div");
  row.className = `mode-goal${done ? " is-done" : ""}`;
  const iconNode = document.createElement("span");
  iconNode.textContent = icon;
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const metaNode = document.createElement("strong");
  metaNode.textContent = meta;
  row.append(iconNode, labelNode, metaNode);
  return row;
}

export function createModeUi({ state, ui }) {
  let currentDaily = null;

  function ensureDailyChallenge() {
    if (currentDaily?.key !== dateKey()) currentDaily = createDailyChallenge();
    return currentDaily;
  }

  function makeDailyState() {
    return {
      challenge: ensureDailyChallenge(),
      values: [0, 0, 0],
      completed: [false, false, false],
    };
  }

  function dropStaleDaily() {
    if (currentDaily?.key !== dateKey()) currentDaily = null;
  }

  function refreshModeUi() {
    state.best = bestFor(state.modeKey);
    ui.menuOverlay.dataset.mode = state.modeKey;
    for (const button of ui.modePicker.querySelectorAll("[data-mode]")) {
      const active = button.dataset.mode === state.modeKey;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    ui.menuBest.textContent = String(state.best);
    ui.bestValue.textContent = String(state.best);
    syncWallet(getCoins());

    const labels = {
      classic: "开始捞鱼",
      daily: "开始今日挑战",
      endless: "开始无尽模式",
    };
    ui.startLabel.textContent = labels[state.modeKey] ?? labels.classic;
    ui.modePreview.classList.toggle("is-hidden", state.modeKey === "classic");

    if (state.modeKey === "daily") {
      const challenge = ensureDailyChallenge();
      const record = getDailyRecord();
      ui.modePreviewTitle.textContent = `今日挑战 · ${challenge.key}`;
      const rows = challenge.goals.map((goal, index) => {
        const claimed = record.claimed[index];
        return modeGoalRow(
          goal.icon,
          goal.label,
          claimed ? "已领取" : `+${goal.reward}`,
          claimed,
        );
      });
      ui.modePreviewGoals.replaceChildren(...rows);
      const allClaimed = record.claimed.every(Boolean) && record.bonus;
      ui.modePreviewNote.textContent = allClaimed
        ? "今日奖励已全部领取，继续刷新每日最佳吧。"
        : `三项目标完成再得 ${challenge.bonus} 金币 · 每天 0 点刷新`;
    } else if (state.modeKey === "endless") {
      ui.modePreviewTitle.textContent = "耐心无尽模式";
      ui.modePreviewGoals.replaceChildren(
        modeGoalRow("⏳", "开局耐心 5 秒，捞到鱼就回满", "松手即结束"),
        modeGoalRow("🐟", "每捞 10 条，耐心上限 +2 秒", "最高 21 秒"),
        modeGoalRow("🏆", "历史最佳", `${state.best} 分`, false),
      );
      ui.modePreviewNote.textContent = "鱼潮和鱼王仍会出现，看看小猫能坚持多久。";
    }
  }

  return { dropStaleDaily, makeDailyState, refreshModeUi };
}
