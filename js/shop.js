import { POND_SKINS, RING_SKINS } from "./cosmetics.js";
import { getCoins, getProfile, isOwned, purchase } from "./progress.js";

function ringPreview(ring) {
  const node = document.createElement("div");
  node.className = `ring-preview ring-preview--${ring.pattern}`;
  node.style.setProperty("--ring-main", ring.colors.main);
  node.style.setProperty("--ring-dark", ring.colors.dark);
  node.style.setProperty("--ring-light", ring.colors.light);
  node.style.setProperty("--ring-accent", ring.colors.accent);
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

export class Shop {
  constructor({ ui, audio, onChange, onModalChange }) {
    this.ui = ui;
    this.audio = audio;
    this.onChange = onChange;
    this.onModalChange = onModalChange;
    this.tab = "ring";
    this.isOpen = false;
    this.previousFocus = null;
    this.bind();
  }

  bind() {
    this.ui.shopCloseBtn.addEventListener("click", () => this.close());
    this.ui.shopTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-shop-tab]");
      if (!button) return;
      this.tab = button.dataset.shopTab;
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

  open(tab = this.tab) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.tab = tab;
    this.previousFocus = document.activeElement;
    this.setMessage("");
    this.render();
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
    const profile = getProfile();
    const coins = getCoins();
    this.ui.shopWallet.textContent = String(coins);

    for (const button of this.ui.shopTabs.querySelectorAll("[data-shop-tab]")) {
      const active = button.dataset.shopTab === this.tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    const catalog = this.tab === "ring" ? RING_SKINS : POND_SKINS;
    const equipped = this.tab === "ring" ? profile.ring : profile.pond;
    const fragment = document.createDocumentFragment();

    for (const item of catalog) {
      const owned = isOwned(this.tab, item.id);
      const active = equipped === item.id;
      const card = document.createElement("article");
      card.className = `shop-item${active ? " is-equipped" : ""}${owned ? "" : " is-locked"}`;

      const preview = document.createElement("div");
      preview.className = "shop-preview";
      preview.appendChild(this.tab === "ring" ? ringPreview(item) : pondPreview(item));

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
