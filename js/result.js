import { dateKey } from "./daily.js";
import { getProfile } from "./progress.js";

function formatShareDate() {
  return dateKey().replaceAll("-", ".");
}

export function buildShareSnapshot(state, stars, coinsEarned, isNewBest, dailyInfo) {
  const profile = getProfile();
  return {
    modeKey: state.modeKey,
    score: state.score,
    caught: state.caught,
    goldCaught: state.goldCaught,
    bestCombo: state.bestCombo,
    best: state.best,
    stars,
    coins: coinsEarned,
    isNewBest,
    dateKey: dateKey(),
    dateLabel: formatShareDate(),
    ringId: profile.ring,
    pondId: profile.pond,
    catId: profile.cat,
    daily: dailyInfo
      ? {
          challenge: dailyInfo.challenge,
          completed: dailyInfo.completed,
          values: dailyInfo.values,
          claim: dailyInfo.claim,
        }
      : null,
  };
}
