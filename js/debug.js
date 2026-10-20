import { createDailyChallenge } from "./daily.js";
import { FISH_SKINS } from "./fish-skins.js";
import { addCoins, getDailyRecord, getProfile } from "./progress.js";
import { pickFishType } from "./spawner.js";
import { syncHud } from "./ui.js";

export function installDebug(api) {
  if (!new URLSearchParams(window.location.search).has("debug")) return;
  const {
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
    castNet,
    beginNet,
    releaseNet,
    cancelNet,
    showBanner,
    getLastResult,
  } = api;

  window.__nekoDebug = {
    state,
    fishList,
    cat,
    net,
    events,
    shop,
    share: shareOverlay,
    start: startGame,
    end: endGame,
    menu: showMenu,
    setScore(value) {
      state.score = value;
      syncHud(state, true);
    },
    setMode(mode) {
      state.modeKey = mode;
      refreshModeUi();
    },
    startMode(mode) {
      state.modeKey = mode;
      startGame();
    },
    grantCoins: addCoins,
    profile: getProfile,
    dailyRecord: getDailyRecord,
    dailyChallenge: () => createDailyChallenge(),
    spawnFish: (type = null) => spawner.addFish(type, false),
    spawnAt(type, x, y) {
      const fish = spawner.makeFish(type, false);
      fish.x = x;
      fish.y = y;
      fish.spawnFade = 1;
      fishList.push(fish);
      return fish;
    },
    spawnVariant(type, skinId, x, y) {
      const fish = spawner.makeFish(type, false, skinId);
      fish.x = x;
      fish.y = y;
      fish.angle = 0;
      fish.spawnFade = 1;
      fishList.push(fish);
      return fish;
    },
    skins: FISH_SKINS,
    spawnKing: () => events.triggerKing(),
    startFrenzy: () => events.startFrenzy(),
    triggerFrenzy: () => events.startFrenzy(),
    pickFishType: (
      elapsed = state.elapsed,
      frenzyActive = events.frenzyActive,
      random = state.random,
    ) => pickFishType(elapsed, frenzyActive, random),
    beginNet,
    releaseNet,
    cancelNet,
    castNet,
    banner: showBanner,
    refreshModeUi,
    getLastResult,
  };
}
