import { Cat } from "./cat.js";
import { SCORE_RANKS } from "./config.js";
import { getCatSkin } from "./cat-skins.js";
import { getPondSkin, getRingSkin } from "./cosmetics.js";
import { TAU, drawStar, roundedRect } from "./utils.js";

const WIDTH = 1080;
const HEIGHT = 1350;
const MODE_LABELS = {
  classic: "经典 60 秒",
  daily: "每日挑战",
  endless: "无尽模式",
};

function font(size, weight = 900) {
  return `${weight} ${size}px "Nunito", "PingFang SC", "Microsoft YaHei", sans-serif`;
}

function text(ctx, value, x, y, size, color, weight = 900, align = "center") {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(value, x, y);
}

function drawBackground(ctx, theme) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH * 0.3, HEIGHT);
  theme.gradient.forEach((color, index) => {
    gradient.addColorStop(index / (theme.gradient.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const glow = ctx.createRadialGradient(220, 330, 20, 220, 330, 520);
  glow.addColorStop(0, "rgba(255, 255, 235, 0.5)");
  glow.addColorStop(1, "rgba(255, 255, 235, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = `rgba(${theme.wave}, 0.65)`;
  ctx.lineWidth = 2;
  for (let row = 0; row < 12; row += 1) {
    ctx.beginPath();
    const baseY = 60 + row * 112;
    for (let x = -20; x <= WIDTH + 20; x += 32) {
      const y = baseY + Math.sin(x * 0.012 + row * 0.9) * 13;
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  const bubbles = [
    [110, 250, 22], [960, 210, 34], [1000, 1120, 18], [70, 1090, 28],
    [130, 720, 14], [980, 760, 12], [900, 1210, 24], [150, 1280, 16],
  ];
  for (const [x, y, radius] of bubbles) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 250, 0.4)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // A couple of floating lily pads keep the card recognisably part of the pond.
  for (const [x, y, radius, color] of [
    [105, 1235, 72, theme.lily[0]],
    [995, 145, 58, theme.lily[1]],
    [65, 455, 46, theme.lily[2]],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.72);
    ctx.fillStyle = theme.lilyShade;
    ctx.beginPath();
    ctx.arc(5, 7, radius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0.32, TAU - 0.32);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawMascot(ctx, ring, catSkin) {
  const mascot = new Cat(1);
  mascot.setRingStyle(ring);
  mascot.setCatStyle(catSkin);
  mascot.starEyes = 99;
  ctx.save();
  ctx.translate(WIDTH / 2, 468);
  ctx.scale(3.15, 3.15);
  mascot.drawRing(ctx, 0.65, 0);
  mascot.drawPaws(ctx);
  mascot.drawHead(ctx, 0.9, 0);
  ctx.restore();
}

function drawStars(ctx, count) {
  const y = 650;
  const gap = 94;
  for (let i = 0; i < 3; i += 1) {
    const x = WIDTH / 2 + (i - 1) * gap;
    ctx.save();
    ctx.translate(x, y);
    drawStar(ctx, 0, 0, 36, 17, 5);
    ctx.fillStyle = i < count ? "#ffc83f" : "rgba(198, 180, 151, 0.35)";
    ctx.fill();
    if (i < count) {
      ctx.strokeStyle = "rgba(213, 144, 20, 0.45)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(-10, -11, 4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawStat(ctx, x, label, value) {
  text(ctx, label, x, 901, 22, "#a08876", 800);
  text(ctx, value, x, 947, 43, "#43352e", 900);
}

function drawDailyPanel(ctx, daily) {
  ctx.save();
  roundedRect(ctx, 122, 1002, 836, 216, 32);
  ctx.fillStyle = "#fbf4e6";
  ctx.fill();
  ctx.strokeStyle = "#f0e2cb";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const claimed = daily.claim?.claimed ?? [];
  const expired = Boolean(daily.claim?.expired);
  const doneList = daily.completed.map(
    (done, index) => done || Boolean(claimed[index]),
  );
  const completed = doneList.filter(Boolean).length;
  text(
    ctx,
    expired ? "挑战已跨天 · 本局不计入" : `今日挑战 ${completed}/3`,
    540,
    1028,
    22,
    "#b06a22",
    900,
  );
  daily.challenge.goals.forEach((goal, index) => {
    const y = 1066 + index * 44;
    const done = doneList[index];
    const alreadyClaimed = Boolean(claimed[index]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(176, y, 13, 0, TAU);
    ctx.fillStyle = done ? "#6ac3a4" : "#e7dccb";
    ctx.fill();
    if (done) {
      ctx.strokeStyle = "#fffdf5";
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(169, y);
      ctx.lineTo(174, y + 5);
      ctx.lineTo(184, y - 5);
      ctx.stroke();
    }
    ctx.restore();
    text(ctx, goal.label, 202, y, 21, done ? "#4c6f5d" : "#86705e", 800, "left");
    const shownValue = alreadyClaimed
      ? goal.target
      : Math.min(goal.target, daily.values[index]);
    text(
      ctx,
      `${Math.floor(shownValue)}/${goal.target}`,
      912,
      y,
      20,
      "#b08c62",
      800,
      "right",
    );
  });
}

function drawCard(ctx, snapshot) {
  ctx.save();
  roundedRect(ctx, 70, 190, 940, 1072, 58);
  ctx.fillStyle = "rgba(255, 252, 243, 0.95)";
  ctx.shadowColor = "rgba(6, 45, 52, 0.2)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, 70, 190, 940, 1072, 58);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  if (snapshot.modeKey === "daily") {
    text(ctx, snapshot.daily.challenge.key, 540, 310, 20, "#ad9a84", 800);
  } else {
    text(ctx, snapshot.dateLabel, 540, 310, 20, "#ad9a84", 800);
  }

  drawMascot(ctx, snapshot.ring, snapshot.cat);
  // The badge sits above the mascot so long ear tufts tuck behind it.
  ctx.save();
  roundedRect(ctx, 394, 225, 292, 52, 26);
  ctx.fillStyle = "#fff0d7";
  ctx.fill();
  ctx.restore();
  text(ctx, MODE_LABELS[snapshot.modeKey] ?? "喵喵捞鱼记", 540, 252, 23, "#b46156", 900);
  drawStars(ctx, snapshot.stars);

  text(ctx, "本局得分", 540, 725, 23, "#a08876", 800);
  text(ctx, String(snapshot.score), 540, 817, 142, "#ef5f78", 900);

  drawStat(ctx, 250, "捞到小鱼", String(snapshot.caught));
  drawStat(ctx, 443, "小金鱼", String(snapshot.goldCaught));
  drawStat(ctx, 637, "最高连击", String(snapshot.bestCombo));
  drawStat(ctx, 830, "金币", `+${snapshot.coins}`);

  if (snapshot.modeKey === "daily") {
    drawDailyPanel(ctx, snapshot.daily);
  } else {
    const rank = SCORE_RANKS.reduce(
      (current, entry) => (snapshot.score >= entry.min ? entry : current),
      SCORE_RANKS[0],
    );
    text(ctx, rank.text, 540, 1050, 28, "#6b5547", 800);
    const bestLabel =
      snapshot.isNewBest ? "✦ 刷新了历史最佳 ✦" : `历史最佳 ${snapshot.best} 分`;
    text(ctx, bestLabel, 540, 1120, 22, "#c38618", 800);
  }

}

export function renderShareCard(canvas, snapshot) {
  const ctx = canvas.getContext("2d");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const pond = getPondSkin(snapshot.pondId);
  drawBackground(ctx, pond.theme);

  text(ctx, "NEKO FISHING", WIDTH / 2, 72, 24, "rgba(255, 253, 245, 0.72)", 900);
  text(ctx, "喵喵捞鱼记", WIDTH / 2, 126, 58, "#fffdf4", 900);
  text(ctx, "今天也捞到好多快乐", WIDTH / 2, 1292, 26, "rgba(255, 253, 245, 0.94)", 800);
  text(
    ctx,
    "aduoer.github.io/neko-fish-game",
    WIDTH / 2,
    1329,
    20,
    "rgba(255, 253, 245, 0.74)",
    800,
  );

  drawCard(ctx, {
    ...snapshot,
    ring: getRingSkin(snapshot.ringId),
    cat: getCatSkin(snapshot.catId),
  });
  return canvas;
}

function canvasBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export class ShareOverlay {
  constructor({ ui, audio, onModalChange }) {
    this.ui = ui;
    this.audio = audio;
    this.onModalChange = onModalChange;
    this.snapshot = null;
    this.isOpen = false;
    this.previousFocus = null;
    this.blob = null;
    this.bind();
  }

  bind() {
    this.ui.shareCloseBtn.addEventListener("click", () => this.close());
    this.ui.shareDownloadBtn.addEventListener("click", () => this.download());
    this.ui.shareNativeBtn.addEventListener("click", () => this.nativeShare());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen) {
        event.preventDefault();
        this.close();
      }
    });
  }

  setSnapshot(snapshot) {
    this.snapshot = snapshot;
    this.blob = null;
  }

  open() {
    if (!this.snapshot || this.isOpen) return;
    this.isOpen = true;
    this.previousFocus = document.activeElement;
    this.ui.shareStatus.textContent = "";
    this.ui.shareNativeBtn.classList.add("is-hidden");
    renderShareCard(this.ui.shareCanvas, this.snapshot);
    this.ui.shareOverlay.classList.remove("is-hidden");
    this.ui.shareOverlay.setAttribute("aria-hidden", "false");
    this.onModalChange?.(true);
    this.audio.ui();
    canvasBlob(this.ui.shareCanvas).then((blob) => {
      this.blob = blob;
      this.detectNativeShare(blob);
    });
    window.setTimeout(() => this.ui.shareCloseBtn.focus({ preventScroll: true }), 30);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.ui.shareOverlay.classList.add("is-hidden");
    this.ui.shareOverlay.setAttribute("aria-hidden", "true");
    this.onModalChange?.(false);
    this.previousFocus?.focus?.({ preventScroll: true });
  }

  detectNativeShare(blob) {
    if (!blob || !navigator.share || !navigator.canShare) return;
    try {
      const file = new File([blob], "neko-fish-score.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        this.shareFile = file;
        this.ui.shareNativeBtn.classList.remove("is-hidden");
      }
    } catch {
      // File sharing is optional.
    }
  }

  async download() {
    const blob = this.blob ?? (await canvasBlob(this.ui.shareCanvas));
    if (!blob) {
      this.ui.shareStatus.textContent = "导出失败了，请再试一次。";
      return;
    }
    this.blob = blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const score = this.snapshot?.score ?? 0;
    link.href = url;
    link.download = `neko-fish-${this.snapshot?.dateKey ?? "score"}-${score}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    this.ui.shareStatus.textContent = "成绩卡已保存，去分享给朋友吧！";
    this.audio.ui();
  }

  async nativeShare() {
    const blob = this.blob ?? (await canvasBlob(this.ui.shareCanvas));
    if (!blob) return;
    try {
      const file =
        this.shareFile ??
        new File([blob], "neko-fish-score.png", { type: "image/png" });
      await navigator.share({
        title: "喵喵捞鱼记",
        text: `我在喵喵捞鱼记里捞到了 ${this.snapshot?.score ?? 0} 分！`,
        files: [file],
      });
      this.ui.shareStatus.textContent = "已打开分享面板。";
    } catch {
      this.ui.shareStatus.textContent = "分享已取消，也可以下载图片再发送。";
    }
  }
}
