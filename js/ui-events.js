import { clearKeys } from "./input.js";
import { syncNetUi, updateSoundButton } from "./ui.js";

export function setupUiEvents({
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
  resetFrameClock,
}) {
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
  ui.homeBtn.addEventListener("click", () => {
    audio.init();
    audio.ui();
    showMenu();
  });
  ui.shareBtn.addEventListener("click", () => {
    audio.init();
    shareOverlay.open();
  });
  ui.shopBtn.addEventListener("click", () => {
    audio.init();
    audio.ui();
    shop.open();
  });
  ui.modePicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button || state.mode !== "menu") return;
    const mode = button.dataset.mode;
    if (!["classic", "daily", "endless"].includes(mode)) return;
    state.modeKey = mode;
    audio.init();
    audio.ui();
    refreshModeUi();
  });
  ui.soundBtn.addEventListener("click", () => {
    audio.toggle();
    updateSoundButton(audio);
  });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => window.setTimeout(resize, 180));
  document.addEventListener("visibilitychange", () => {
    state.paused = document.hidden;
    if (document.hidden) {
      clearKeys();
      net.cancel();
      syncNetUi(net, true);
    }
    resetFrameClock();
    if (!document.hidden && state.mode === "menu") refreshModeUi();
  });

  // Keep the date-seeded preview current if the menu stays open past midnight.
  window.setInterval(() => {
    if (!document.hidden && state.mode === "menu") refreshModeUi();
  }, 60_000);
}
