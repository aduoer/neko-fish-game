import { Cat } from "./cat.js";
import { CAT_SKINS } from "./cat-skins.js";
import { POND_SKINS, RING_SKINS } from "./cosmetics.js";
import { getProfile, isOwned, purchase } from "./progress.js";

const DEFAULT_TAB = "cat";
const CATALOGS = new Map([
  ["cat", CAT_SKINS],
  ["ring", RING_SKINS],
  ["pond", POND_SKINS],
]);
const PREVIEW_CACHE = new Map();

function ringPreview(ring) {
  const node = document.createElement("div");
  node.className = `ring-preview ring-preview--${ring.pattern}`;
  node.style.setProperty("--ring-main", ring.colors.main);
  node.style.setProperty("--ring-dark", ring.colors.dark);
  node.style.setProperty("--ring-light", ring.colors.light);
  node.style.setProperty("--ring-accent", ring.colors.accent);
  if (ring.pattern === "rainbow" && ring.patternColors?.length) {
    const stops = ring.patternColors
      .map((color, index) => {
        const start = (index / ring.patternColors.length) * 100;
        const end = ((index + 1) / ring.patternColors.length) * 100;
        return `${color} ${start}% ${end}%`;
      })
      .join(", ");
    node.style.background = `conic-gradient(from -8deg, ${stops})`;
  }
  node.innerHTML = "<i></i>";
  return node;
}

function pondPreview(pond) {
  const node = document.createElement("div");
  node.className = "pond-preview";
  node.style.setProperty("--pond-a", pond.swatch[0]);
  node.style.setProperty("--pond-b", pond.swatch[1]);
  node.style.setProperty("--pond-c", pond.swatch[2]);
  node.innerHTML = "<i></i><i></i>";
  return node;
}

function catPreview(skin) {
  const cached = PREVIEW_CACHE.get(skin.id);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.className = "cat-preview";
  canvas.width = 160;
  canvas.height = 160;
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const mascot = new Cat(1);
  mascot.setCatStyle(skin);
  ctx.translate(80, 100);
  ctx.scale(1.4, 1.4);
  mascot.drawHead(ctx, 1.1, 0);
  PREVIEW_CACHE.set(skin.id, canvas);
  return canvas;
}

export class Shop {
  constructor({ ui, audio, onChange, onModalChange }) {
    this.ui = ui;
    this.audio = audio;
    this.onChange = onChange;
    this.onModalChange = onModalChange;
    this.tab = DEFAULT_TAB;
    this.isOpen = false;
    this.previousFocus = null;
    this.bind();
  }

  bind() {
    this.ui.shopCloseBtn.addEventListener("click", () => this.close());
    this.ui.shopTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-shop-tab]");
      if (!button) return;
      const tab = button.dataset.shopTab;
      if (!CATALOGS.has(tab)) return;
      this.tab = tab;
      this.audio.ui();
      this.render();
    });

    this.ui.shopGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-shop-action]");
      if (!button) return;
      const { shopKind: kind, shopId: id, shopAction: action } = button.dataset;
      if (action === "equip") {
        void this.equip(kind, id);
      } else {
        void this.buy(kind, id);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen) {
        event.preventDefault();
        this.close();
      }
    });
  }

  async buy(kind, id) {
    try {
      const result = await purchase(kind, id);
      if (!result.ok) {
        this.setMessage(
          result.reason === "coins"
            ? `还差 ${result.missing} 金币，再去捞几网吧。`
            : "这件装扮暂时找不到。",
          true,
        );
        this.audio.ui();
        return;
      }
      this.audio.purchase();
      this.setMessage(
        result.already ? `已经拥有${result.item.name}啦。` : `${result.item.name} 已装备！`,
      );
      this.onChange?.();
      this.render();
    } catch {
      this.setMessage("操作没有完成，请再试一次。", true);
    }
  }

  async equip(kind, id) {
    try {
      const result = await purchase(kind, id);
      if (!result.ok) {
        this.setMessage("需要先拥有这件装扮。", true);
        return;
      }
      this.audio.ui();
      this.setMessage(`${result.item.name} 已装备！`);
      this.onChange?.();
      this.render();
    } catch {
      this.setMessage("操作没有完成，请再试一次。", true);
    }
  }

  setMessage(text, error = false) {
    this.ui.shopMessage.textContent = text;
    this.ui.shopMessage.classList.toggle("is-error", error);
    this.ui.shopMessage.classList.remove("is-popping");
    void this.ui.shopMessage.offsetWidth;
    this.ui.shopMessage.classList.add("is-popping");
  }

  open(tab = DEFAULT_TAB) {
    if (this.isOpen) return;
    const previousFocus = document.activeElement;
    this.tab = CATALOGS.has(tab) ? tab : DEFAULT_TAB;
    this.setMessage("");
    this.render();
    this.isOpen = true;
    this.previousFocus = previousFocus;
    this.ui.shopOverlay.classList.remove("is-hidden");
    this.ui.shopOverlay.setAttribute("aria-hidden", "false");
    this.onModalChange?.(true);
    window.setTimeout(() => this.ui.shopCloseBtn.focus({ preventScroll: true }), 30);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.ui.shopOverlay.classList.add("is-hidden");
    this.ui.shopOverlay.setAttribute("aria-hidden", "true");
    this.onModalChange?.(false);
    this.previousFocus?.focus?.({ preventScroll: true });
  }

  render() {
    if (!CATALOGS.has(this.tab)) this.tab = DEFAULT_TAB;
    const profile = getProfile();
    this.ui.shopWallet.textContent = String(profile.coins);

    for (const button of this.ui.shopTabs.querySelectorAll("[data-shop-tab]")) {
      const active = button.dataset.shopTab === this.tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    const catalog = CATALOGS.get(this.tab);
    const equipped = profile[this.tab] ?? profile.ring;
    const fragment = document.createDocumentFragment();

    for (const item of catalog) {
      const owned = isOwned(this.tab, item.id);
      const active = equipped === item.id;
      const card = document.createElement("article");
      card.className = `shop-item${active ? " is-equipped" : ""}${owned ? "" : " is-locked"}`;
      if (item.breed) card.title = item.breed;

      const preview = document.createElement("div");
      preview.className = "shop-preview";
      if (this.tab === "cat") preview.appendChild(catPreview(item));
      else if (this.tab === "ring") preview.appendChild(ringPreview(item));
      else preview.appendChild(pondPreview(item));

      const copy = document.createElement("div");
      copy.className = "shop-copy";
      const name = document.createElement("strong");
      name.className = "shop-name";
      name.textContent = item.name;
      const meta = document.createElement("span");
      meta.className = "shop-meta";
      meta.textContent = owned ? (active ? "正在使用" : "已拥有") : `${item.price} 金币`;
      copy.append(name, meta);

      const action = document.createElement("button");
      action.type = "button";
      action.className = `shop-action${active ? " is-equipped" : owned ? " is-owned" : ""}`;
      action.dataset.shopKind = this.tab;
      action.dataset.shopId = item.id;
      action.dataset.shopAction = owned ? "equip" : "buy";
      action.disabled = active;
      if (active) action.textContent = "已装备";
      else if (owned) action.textContent = "装备";
      else action.textContent = `${item.price} 金币`;

      card.append(preview, copy, action);
      fragment.appendChild(card);
    }

    this.ui.shopGrid.replaceChildren(fragment);
  }
}
