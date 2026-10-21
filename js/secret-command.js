import { addCoins } from "./progress.js";
import { syncWallet } from "./ui.js";

export const SECRET_CODE = "xiaomaoaixiaoyu";
export const SECRET_REWARD = 99_999_999_999;

/**
 * A deliberately quiet little paw in the corner of the menu. Opening it reveals
 * a tiny command line; the fixed code grants a very large pile of coins.
 */
export function setupSecretCommand({ ui, audio }) {
  let open = false;
  let busy = false;
  let closeTimer = 0;

  function setMessage(text, tone = "") {
    ui.secretNote.textContent = text;
    ui.secretNote.classList.toggle("is-error", tone === "error");
    ui.secretNote.classList.toggle("is-success", tone === "success");
  }

  function shake() {
    ui.secretConsole.classList.remove("is-shaking");
    void ui.secretConsole.offsetWidth;
    ui.secretConsole.classList.add("is-shaking");
  }

  function show(nextOpen) {
    window.clearTimeout(closeTimer);
    closeTimer = 0;
    open = nextOpen;
    ui.secretConsole.classList.toggle("is-hidden", !open);
    ui.secretConsole.setAttribute("aria-hidden", String(!open));
    ui.secretBtn.setAttribute("aria-expanded", String(open));
    if (!open) {
      setMessage("");
      return;
    }
    window.setTimeout(() => ui.secretInput.focus({ preventScroll: true }), 20);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const value = ui.secretInput.value.trim().toLowerCase();
    if (!value) {
      setMessage("小声输入一个口令吧。");
      ui.secretInput.focus();
      return;
    }
    if (value !== SECRET_CODE) {
      setMessage("喵？好像不是这个口令。", "error");
      shake();
      audio.ui();
      ui.secretInput.select();
      return;
    }

    busy = true;
    const button = ui.secretForm.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    try {
      const wallet = await addCoins(SECRET_REWARD);
      syncWallet(wallet);
      setMessage(`喵！金币 +${SECRET_REWARD.toLocaleString("en-US")}`, "success");
      ui.secretInput.value = "";
      audio.purchase();
      audio.milestone?.(2);
      closeTimer = window.setTimeout(() => {
        if (open) show(false);
      }, 1600);
    } catch {
      setMessage("金币罐暂时打不开，请再试一次。", "error");
    } finally {
      busy = false;
      if (button) button.disabled = false;
    }
  }

  ui.secretBtn.addEventListener("click", () => {
    audio.init();
    audio.ui();
    show(!open);
  });
  ui.secretForm.addEventListener("submit", submit);
  ui.secretInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      show(false);
      ui.secretBtn.focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      show(false);
      ui.secretBtn.focus({ preventScroll: true });
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!open) return;
    if (
      ui.secretConsole.contains(event.target) ||
      ui.secretBtn.contains(event.target)
    ) {
      return;
    }
    show(false);
  });

  return {
    open: () => show(true),
    close: () => show(false),
    isOpen: () => open,
  };
}
