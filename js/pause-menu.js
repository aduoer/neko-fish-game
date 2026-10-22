import { clearKeys } from "./input.js";

function isTypingTarget(target) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "input, textarea, select, [contenteditable='true'], [role='textbox']",
      ),
    )
  );
}

export function createPauseMenu({
  ui,
  state,
  audio,
  net,
  syncNetUi,
  onPauseChange,
  onRestart,
  onQuit,
  onOpenSettings,
  resetFrameClock,
}) {
  let manual = false;

  function setOverlay(open) {
    ui.pauseOverlay.classList.toggle("is-hidden", !open);
    ui.pauseOverlay.setAttribute("aria-hidden", String(!open));
    ui.pauseOverlay.inert = !open;
  }

  function open() {
    if (state.mode !== "playing" || state.modalOpen || manual) return false;
    manual = true;
    onPauseChange?.(true);
    clearKeys();
    net.cancel();
    syncNetUi(net, true);
    setOverlay(true);
    resetFrameClock?.();
    audio?.init();
    audio?.ui();
    ui.liveRegion.textContent = "游戏已暂停。按 P 或 Escape 继续。";
    window.setTimeout(() => {
      if (manual) ui.pauseResumeBtn.focus({ preventScroll: true });
    }, 30);
    return true;
  }

  function close() {
    if (!manual) return false;
    manual = false;
    setOverlay(false);
    onPauseChange?.(false);
    resetFrameClock?.();
    audio?.ui();
    ui.liveRegion.textContent = "继续捞鱼。";
    return true;
  }

  function reset() {
    if (!manual) {
      setOverlay(false);
      return;
    }
    manual = false;
    setOverlay(false);
    onPauseChange?.(false);
  }

  ui.pauseBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    open();
  });
  ui.pauseResumeBtn.addEventListener("click", () => close());
  ui.pauseRestartBtn.addEventListener("click", () => {
    if (!close()) return;
    onRestart?.();
  });
  ui.pauseQuitBtn.addEventListener("click", () => {
    if (!close()) return;
    onQuit?.();
  });
  ui.pauseSettingsBtn.addEventListener("click", () => {
    audio?.ui();
    onOpenSettings?.();
  });

  document.addEventListener("keydown", (event) => {
    if (state.mode !== "playing" || state.modalOpen || event.defaultPrevented) return;
    if (isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase?.() ?? "";
    if (key !== "p" && event.key !== "Escape") return;
    event.preventDefault();
    if (manual) close();
    else open();
  });

  return {
    open,
    close,
    reset,
    isOpen: () => manual,
  };
}
