import { dateKey } from "./daily.js";
import { getPreferences, updatePreferences } from "./preferences.js";
import { resetProfile } from "./progress.js";
import { buildSaveText, importSaveText } from "./save-data.js";

const MAX_IMPORT_BYTES = 1_000_000;
const RESET_CONFIRM_MS = 3500;

function message(ui, text, tone = "") {
  ui.saveStatus.textContent = text;
  ui.saveStatus.classList.toggle("is-error", tone === "error");
  ui.saveStatus.classList.toggle("is-success", tone === "success");
}

function downloadSave() {
  const blob = new Blob([buildSaveText()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `neko-fish-save-${dateKey()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createSettingsPanel({
  ui,
  audio,
  onModalChange,
  onProfileChanged,
}) {
  let open = false;
  let opener = null;
  let resetArmed = false;
  let resetTimer = 0;

  function syncControls() {
    const volume = audio.volume;
    ui.volumeRange.value = String(volume);
    ui.volumeValue.textContent = `${volume}%`;
    ui.motionSelect.value = getPreferences().reduceMotion;
  }

  function disarmReset() {
    resetArmed = false;
    window.clearTimeout(resetTimer);
    resetTimer = 0;
    ui.saveResetBtn.textContent = "重置进度";
    ui.saveResetBtn.classList.remove("is-armed");
  }

  function show(nextOpen) {
    if (open === nextOpen) return;
    open = nextOpen;
    if (open) {
      opener = document.activeElement;
      syncControls();
      message(ui, "", "");
      disarmReset();
      ui.settingsOverlay.classList.remove("is-hidden");
      ui.settingsOverlay.setAttribute("aria-hidden", "false");
      onModalChange?.(true);
      window.setTimeout(() => ui.settingsCloseBtn.focus({ preventScroll: true }), 30);
    } else {
      disarmReset();
      ui.settingsOverlay.classList.add("is-hidden");
      ui.settingsOverlay.setAttribute("aria-hidden", "true");
      onModalChange?.(false);
      opener?.focus?.({ preventScroll: true });
    }
  }

  ui.settingsCloseBtn.addEventListener("click", () => show(false));

  ui.volumeRange.addEventListener("input", () => {
    const volume = audio.setVolume(Number(ui.volumeRange.value));
    ui.volumeValue.textContent = `${volume}%`;
  });

  ui.motionSelect.addEventListener("change", () => {
    updatePreferences({ reduceMotion: ui.motionSelect.value });
    message(ui, "动态效果偏好已保存。", "success");
  });

  ui.saveExportBtn.addEventListener("click", () => {
    try {
      downloadSave();
      message(ui, "存档已导出，保存好这个 JSON 文件吧。", "success");
      audio.ui();
    } catch {
      message(ui, "导出失败，请再试一次。", "error");
    }
  });

  ui.saveImportBtn.addEventListener("click", () => {
    ui.saveImportFile.click();
  });

  ui.saveImportFile.addEventListener("change", async () => {
    const file = ui.saveImportFile.files?.[0];
    ui.saveImportFile.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      message(ui, "存档文件太大，无法读取。", "error");
      return;
    }
    try {
      const text = await file.text();
      await importSaveText(text);
      audio.syncPreferences();
      syncControls();
      onProfileChanged?.({ source: "import" });
      message(ui, "存档已导入，进度和装扮都回来啦。", "success");
      audio.purchase();
    } catch (error) {
      message(ui, error?.message || "存档读取失败，请检查文件。", "error");
    }
  });

  ui.saveResetBtn.addEventListener("click", async () => {
    if (!resetArmed) {
      resetArmed = true;
      ui.saveResetBtn.textContent = "再点一次确认";
      ui.saveResetBtn.classList.add("is-armed");
      resetTimer = window.setTimeout(disarmReset, RESET_CONFIRM_MS);
      message(ui, "重置会清空金币、装扮、图鉴和本地榜。", "error");
      return;
    }

    disarmReset();
    try {
      await resetProfile();
      onProfileChanged?.({ source: "reset" });
      message(ui, "进度已重置，可以重新开始啦。", "success");
      audio.ui();
    } catch {
      message(ui, "重置失败，请再试一次。", "error");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!open || event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    show(false);
  });

  return {
    open: () => show(true),
    close: () => show(false),
    isOpen: () => open,
  };
}
