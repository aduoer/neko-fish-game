import { mulberry32 } from "./utils.js";

export const DAILY_REWARD = 25;
export const DAILY_BONUS = 50;

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dailySeed(key = dateKey()) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createDailyRandom(seed) {
  return mulberry32(seed >>> 0);
}

export function createDailyChallenge(key = dateKey()) {
  const seed = dailySeed(key);
  const random = createDailyRandom(seed);
  const scoreTarget = 320 + Math.floor(random() * 6) * 40;
  const goldTarget = 6 + Math.floor(random() * 5);
  const comboTarget = 9 + Math.floor(random() * 5);

  return Object.freeze({
    key,
    seed,
    title: "今日池塘挑战",
    goals: Object.freeze([
      Object.freeze({
        id: "score",
        metric: "score",
        icon: "🎯",
        short: "得分",
        label: `得分达到 ${scoreTarget}`,
        target: scoreTarget,
        reward: DAILY_REWARD,
      }),
      Object.freeze({
        id: "gold",
        metric: "gold",
        icon: "🐠",
        short: "金鱼",
        label: `捞到 ${goldTarget} 条金鱼`,
        target: goldTarget,
        reward: DAILY_REWARD,
      }),
      Object.freeze({
        id: "combo",
        metric: "combo",
        icon: "🔥",
        short: "连击",
        label: `最高连击达到 ${comboTarget}`,
        target: comboTarget,
        reward: DAILY_REWARD,
      }),
    ]),
    bonus: DAILY_BONUS,
    totalReward: DAILY_REWARD * 3 + DAILY_BONUS,
  });
}

export function goalValue(goal, run) {
  if (!goal || !run) return 0;
  if (goal.metric === "score") return run.score ?? 0;
  if (goal.metric === "gold") return run.goldCaught ?? 0;
  if (goal.metric === "combo") return run.bestCombo ?? 0;
  return 0;
}

export function goalPercent(goal, run) {
  const target = Math.max(1, goal?.target ?? 1);
  return Math.min(1, goalValue(goal, run) / target);
}

export function evaluateGoals(challenge, run) {
  return challenge.goals.map((goal) => goalValue(goal, run) >= goal.target);
}

export function countCompleted(challenge, run) {
  return evaluateGoals(challenge, run).filter(Boolean).length;
}

export function goalProgressLabel(goal, run) {
  return `${Math.min(goal.target, Math.floor(goalValue(goal, run)))}/${goal.target}`;
}
