import { syncDashUi, syncNetUi } from "./ui.js";

export function createControls({ state, ui, cat, audio, net, startGame }) {
  function requestStart() {
    if (state.mode === "playing" || state.modalOpen) return;
    ui.startBtn.blur();
    ui.replayBtn.blur();
    ui.homeBtn.blur();
    startGame();
  }

  function triggerDash() {
    if (state.mode !== "playing" || net.charging) return;
    if (cat.triggerDash()) {
      syncDashUi(cat);
      audio.init();
    }
  }

  function beginNet() {
    if (state.mode !== "playing" || state.modalOpen) return;
    audio.init();
    if (net.begin()) syncNetUi(net, true);
  }

  function releaseNet() {
    if (state.mode !== "playing") {
      net.cancel();
      return;
    }
    const result = net.release();
    if (result) {
      syncNetUi(net, true);
      ui.liveRegion.textContent =
        result.count > 0 ? `一网捞到 ${result.count} 条小鱼。` : "这一网没有捞到小鱼。";
    }
  }

  function cancelNet() {
    net.cancel();
    syncNetUi(net, true);
  }

  function onModalChange(open) {
    state.modalOpen = open;
    if (state.mode === "menu") ui.menuOverlay.inert = open;
    if (state.mode === "over") ui.overOverlay.inert = open;
  }

  return { beginNet, cancelNet, onModalChange, releaseNet, requestStart, triggerDash };
}
