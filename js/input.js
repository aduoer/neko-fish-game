import { CONFIG } from "./config.js";
import { distSq } from "./utils.js";

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const keyMap = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

export function clearKeys() {
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
}

function keyDirection() {
  return {
    x: (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
    y: (keys.down ? 1 : 0) - (keys.up ? 1 : 0),
  };
}

export { keyDirection };

function isInteractiveTarget(target) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, a[href], input, select, textarea, [role='button'], [contenteditable='true']",
      ),
    )
  );
}

export function setupInput({
  canvas,
  ui,
  state,
  cat,
  audio,
  triggerDash,
  triggerFortune,
  beginNet,
  releaseNet,
  cancelNet,
  requestStart,
  isBlocked,
  onTouchPoint,
  getViewport,
}) {
  let longPressTimer = 0;
  let pressStart = null;
  let lastTap = null;
  let dashFired = false;
  let netPointer = null;

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const viewport = getViewport();
    return {
      x: ((event.clientX - rect.left) / rect.width) * viewport.width,
      y: ((event.clientY - rect.top) / rect.height) * viewport.height,
    };
  }

  function targetFor(event) {
    const point = pointerPosition(event);
    if (event.pointerType === "mouse") return point;
    return { x: point.x, y: point.y - CONFIG.touchOffset };
  }

  function clearLongPress() {
    window.clearTimeout(longPressTimer);
    longPressTimer = 0;
  }

  function handlePointerMove(event) {
    if (state.mode !== "playing") return;

    if (event.pointerType === "mouse") {
      const point = pointerPosition(event);
      cat.setTarget(point.x, point.y);
      return;
    }

    if (state.pointerId === null || event.pointerId !== state.pointerId) return;
    const point = pointerPosition(event);
    if (
      pressStart &&
      distSq(point.x, point.y, pressStart.x, pressStart.y) > 18 * 18
    ) {
      clearLongPress();
    }
    onTouchPoint?.(point);
    const target = targetFor(event);
    cat.setTarget(target.x, target.y);
  }

  function handlePointerDown(event) {
    audio.init();
    if (isBlocked?.() || state.mode !== "playing") return;
    if (state.pointerId !== null && event.pointerId !== state.pointerId) return;
    const point = pointerPosition(event);
    const target = targetFor(event);
    cat.setTarget(target.x, target.y);
    state.pointerId = event.pointerId;

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is a progressive enhancement.
    }

    if (event.pointerType === "mouse" && event.button === 2) {
      event.preventDefault();
      netPointer = event.pointerId;
      beginNet();
      return;
    }

    if (event.pointerType === "mouse") {
      triggerDash();
      return;
    }

    pressStart = point;
    dashFired = false;
    onTouchPoint?.(point);

    const now = performance.now();
    if (
      lastTap &&
      now - lastTap.time <= CONFIG.doubleTapWindow * 1000 &&
      distSq(point.x, point.y, lastTap.x, lastTap.y) < 48 * 48
    ) {
      lastTap = null;
      dashFired = true;
      triggerDash();
      return;
    }

    lastTap = { time: now, x: point.x, y: point.y };
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      longPressTimer = 0;
      if (dashFired || state.mode !== "playing" || state.pointerId !== event.pointerId) {
        return;
      }
      dashFired = true;
      triggerDash();
    }, CONFIG.longPressDelay * 1000);
  }

  function handlePointerUp(event) {
    if (state.pointerId !== event.pointerId) return;
    if (netPointer === event.pointerId) {
      netPointer = null;
      if (event.type === "pointercancel") cancelNet?.();
      else releaseNet?.();
    }
    state.pointerId = null;
    pressStart = null;
    clearLongPress();
    onTouchPoint?.(null);
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Nothing to release.
    }
  }

  function handleKeyDown(event) {
    if (isBlocked?.()) return;
    const mapped = keyMap[event.key] ?? keyMap[event.key.toLowerCase?.()];
    if (mapped) {
      keys[mapped] = true;
      if (state.mode === "playing") event.preventDefault();
      return;
    }

    if (event.key.toLowerCase?.() === "e") {
      if (state.mode === "playing") {
        event.preventDefault();
        if (!event.repeat) beginNet?.();
      }
      return;
    }

    if (event.key.toLowerCase?.() === "q") {
      if (
        state.mode === "playing" &&
        !event.repeat &&
        !isInteractiveTarget(event.target)
      ) {
        event.preventDefault();
        triggerFortune?.();
      }
      return;
    }

    if (event.code === "Space") {
      if (state.mode === "menu" || state.mode === "over") {
        const overlayVisible =
          state.mode === "menu"
            ? !ui.menuOverlay.classList.contains("is-hidden")
            : !ui.overOverlay.classList.contains("is-hidden");
        if (overlayVisible && !isInteractiveTarget(event.target)) {
          event.preventDefault();
          requestStart();
          return;
        }
      }
      if (state.mode === "playing" && !isInteractiveTarget(event.target)) {
        event.preventDefault();
        triggerDash();
      }
      return;
    }

    if (event.key === "Enter" && (state.mode === "menu" || state.mode === "over")) {
      const overlayVisible =
        state.mode === "menu"
          ? !ui.menuOverlay.classList.contains("is-hidden")
          : !ui.overOverlay.classList.contains("is-hidden");
      if (overlayVisible && !isInteractiveTarget(event.target)) {
        event.preventDefault();
        requestStart();
      }
    }
  }

  function handleKeyUp(event) {
    if (event.key.toLowerCase?.() === "e") {
      if (state.mode === "playing") releaseNet?.();
      return;
    }
    const mapped = keyMap[event.key] ?? keyMap[event.key.toLowerCase?.()];
    if (mapped) keys[mapped] = false;
  }

  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("keydown", handleKeyDown, { passive: false });
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => {
    clearKeys();
    clearLongPress();
    cancelNet?.();
  });

  ui.dashBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    audio.init();
    triggerDash();
  });

  ui.dashBtn.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      triggerDash();
    }
  });

  ui.fortuneBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isBlocked?.()) return;
    audio.init();
    triggerFortune?.();
  });

  ui.netBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isBlocked?.()) return;
    audio.init();
    try {
      ui.netBtn.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional.
    }
    beginNet();
  });

  ui.netBtn.addEventListener("pointerup", (event) => {
    event.preventDefault();
    event.stopPropagation();
    releaseNet?.();
  });

  ui.netBtn.addEventListener("pointercancel", (event) => {
    event.stopPropagation();
    cancelNet?.();
  });

  ui.netBtn.addEventListener("keydown", (event) => {
    if ((event.code === "Space" || event.code === "Enter") && !event.repeat) {
      event.preventDefault();
      beginNet();
    }
  });

  ui.netBtn.addEventListener("keyup", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      releaseNet?.();
    }
  });
}
