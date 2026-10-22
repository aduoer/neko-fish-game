import { getTopRuns } from "./progress.js";

const MODE_INFO = {
  classic: { label: "经典", full: "经典 60 秒" },
  daily: { label: "每日", full: "每日挑战" },
  endless: { label: "无尽", full: "无尽模式" },
};
const MODES = Object.keys(MODE_INFO);

function formatDate(value) {
  if (typeof value !== "string" || value === "") return "早先的记录";
  return value.replaceAll("-", ".");
}

function buildRow(entry, index) {
  const row = document.createElement("li");
  row.className = "board-row";
  row.setAttribute("aria-label", `第 ${index + 1} 名，${entry.score} 分`);

  const rank = document.createElement("span");
  rank.className = "board-rank";
  rank.textContent = String(index + 1);

  const copy = document.createElement("div");
  copy.className = "board-copy";

  const score = document.createElement("strong");
  score.className = "board-score";
  score.textContent = `${entry.score} 分`;

  const meta = document.createElement("small");
  meta.className = "board-meta";
  meta.textContent = `捞到 ${entry.caught} 条 · 最高连击 ${entry.bestCombo} · ${formatDate(entry.date)}`;

  copy.append(score, meta);
  row.append(rank, copy);
  return row;
}

export class BoardOverlay {
  constructor({ ui, audio, onModalChange, getMode }) {
    this.ui = ui;
    this.audio = audio;
    this.onModalChange = onModalChange;
    this.getMode = getMode;
    this.isOpen = false;
    this.previousFocus = null;
    this.mode = "classic";

    ui.boardCloseBtn.addEventListener("click", () => this.close());
    ui.boardTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-board-mode]");
      if (!button || !MODES.includes(button.dataset.boardMode)) return;
      this.mode = button.dataset.boardMode;
      this.syncTabs();
      this.renderList();
      this.audio?.ui();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !this.isOpen) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.close();
    });
  }

  syncTabs() {
    for (const button of this.ui.boardTabs.querySelectorAll("[data-board-mode]")) {
      const active = button.dataset.boardMode === this.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  renderList() {
    const entries = getTopRuns(this.mode);
    this.ui.boardList.replaceChildren(...entries.map(buildRow));
    this.ui.boardList.classList.toggle("is-hidden", entries.length === 0);
    this.ui.boardEmpty.classList.toggle("is-hidden", entries.length > 0);
    this.ui.boardEmpty.textContent = `${MODE_INFO[this.mode].full}还没有记录，去捞一局吧。`;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.previousFocus = document.activeElement;
    const preferred = this.getMode?.();
    this.mode = MODES.includes(preferred) ? preferred : "classic";
    this.syncTabs();
    this.renderList();
    this.ui.boardOverlay.classList.remove("is-hidden");
    this.ui.boardOverlay.setAttribute("aria-hidden", "false");
    this.onModalChange?.(true);
    this.audio?.init();
    this.audio?.ui();
    window.setTimeout(() => this.ui.boardCloseBtn.focus({ preventScroll: true }), 30);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.ui.boardOverlay.classList.add("is-hidden");
    this.ui.boardOverlay.setAttribute("aria-hidden", "true");
    this.onModalChange?.(false);
    this.audio?.ui();
    this.previousFocus?.focus?.({ preventScroll: true });
  }
}
