import { FISH_TYPES } from "./config.js";
import { Fish } from "./fish.js";
import { FISH_SKINS } from "./fish-skins.js";
import { getDex } from "./progress.js";
import { mulberry32 } from "./utils.js";

const PREVIEW_WIDTH = 96;
const PREVIEW_HEIGHT = 72;

export const FISH_VARIANTS = Object.freeze(
  Object.entries(FISH_SKINS).flatMap(([type, skins]) =>
    skins.map((skin) => Object.freeze({ type, skin })),
  ),
);

function seedFor(text) {
  let seed = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    seed ^= text.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

export function drawFishPreview(canvas, variant, found) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = PREVIEW_WIDTH * dpr;
  canvas.height = PREVIEW_HEIGHT * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

  const spec = FISH_TYPES[variant.type];
  const fit = Math.min(1.45, 21 / spec.radius);
  const fish = new Fish(
    variant.type,
    PREVIEW_WIDTH / 2,
    PREVIEW_HEIGHT / 2,
    0,
    fit,
    variant.skin.id,
    mulberry32(seedFor(variant.skin.id)),
  );
  fish.spawnFade = 1;
  fish.depth = 1;
  fish.draw(ctx, 1.2);

  if (!found) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(20, 74, 82, 0.82)";
    ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
    ctx.globalCompositeOperation = "source-over";
  }
}

export function getDexSummary() {
  const dex = getDex();
  const found = FISH_VARIANTS.filter((variant) => dex[variant.skin.id]?.count > 0);
  return { dex, found: found.length, total: FISH_VARIANTS.length };
}

export function refreshDexMenu(ui) {
  const { found, total } = getDexSummary();
  if (ui.dexMenuCount) ui.dexMenuCount.textContent = `${found}/${total}`;
  return { found, total };
}

function buildCard(variant, entry) {
  const found = Boolean(entry?.count > 0);
  const card = document.createElement("article");
  card.className = `dex-item${found ? " is-found" : " is-locked"}`;
  card.setAttribute(
    "aria-label",
    found
      ? `${variant.skin.label}，已捕获 ${entry.count} 条`
      : "未发现的小鱼",
  );

  const preview = document.createElement("div");
  preview.className = "dex-preview";
  const canvas = document.createElement("canvas");
  canvas.className = "dex-canvas";
  canvas.setAttribute("aria-hidden", "true");
  preview.appendChild(canvas);
  drawFishPreview(canvas, variant, found);

  const name = document.createElement("strong");
  name.className = "dex-name";
  name.textContent = found ? variant.skin.label : "未发现";

  const type = document.createElement("span");
  type.className = "dex-type";
  type.textContent = FISH_TYPES[variant.type].label;

  const meta = document.createElement("span");
  meta.className = "dex-meta";
  meta.textContent = found ? `×${entry.count}` : "???";

  const date = document.createElement("small");
  date.className = "dex-date";
  date.textContent = found
    ? entry.first
      ? `首次 ${entry.first.replaceAll("-", ".")}`
      : "首次记录"
    : "捞到一次就会点亮";

  card.append(preview, name, type, meta, date);
  return card;
}

export class DexOverlay {
  constructor({ ui, audio, onModalChange }) {
    this.ui = ui;
    this.audio = audio;
    this.onModalChange = onModalChange;
    this.isOpen = false;
    this.previousFocus = null;

    ui.dexCloseBtn.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen) {
        event.preventDefault();
        this.close();
      }
    });
  }

  render() {
    const { dex, found, total } = getDexSummary();
    this.ui.dexFound.textContent = String(found);
    this.ui.dexTotal.textContent = String(total);
    this.ui.dexBadge.hidden = found < total;
    this.ui.dexProgressText.textContent =
      found >= total
        ? "全部遇见啦，池塘的小鱼都认识你了。"
        : `再遇见 ${total - found} 种小鱼，就能点亮整本图鉴。`;

    const cards = FISH_VARIANTS.map((variant) =>
      buildCard(variant, dex[variant.skin.id]),
    );
    this.ui.dexGrid.replaceChildren(...cards);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.previousFocus = document.activeElement;
    this.render();
    this.ui.dexOverlay.classList.remove("is-hidden");
    this.ui.dexOverlay.setAttribute("aria-hidden", "false");
    this.onModalChange?.(true);
    this.audio?.init();
    this.audio?.ui();
    window.setTimeout(() => this.ui.dexCloseBtn.focus({ preventScroll: true }), 30);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.ui.dexOverlay.classList.add("is-hidden");
    this.ui.dexOverlay.setAttribute("aria-hidden", "true");
    this.onModalChange?.(false);
    this.audio?.ui();
    this.previousFocus?.focus?.({ preventScroll: true });
  }
}
