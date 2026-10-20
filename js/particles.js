import { TAU, drawHeart, drawStar, rand, pick } from "./utils.js";

const MAX_PARTICLES = 240;

export class Particles {
  constructor() {
    this.items = [];
    this.ambientTimer = 0;
  }

  clear() {
    this.items.length = 0;
    this.ambientTimer = 0;
  }

  add(particle) {
    if (this.items.length >= MAX_PARTICLES) return;
    this.items.push({
      kind: "sparkle",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      gravity: 0,
      drag: 1,
      size: 4,
      rotation: 0,
      spin: 0,
      life: 0.6,
      maxLife: 0.6,
      color: "#ffffff",
      alpha: 1,
      text: "",
      ...particle,
      maxLife: particle.life ?? 0.6,
    });
  }

  ambientBubble(x, y) {
    this.add({
      kind: "bubble",
      x,
      y,
      vx: rand(-6, 6),
      vy: rand(-26, -14),
      size: rand(1.6, 3.6),
      life: rand(1.8, 3.2),
      color: "rgba(240, 255, 250, 0.8)",
      wobble: rand(0, TAU),
    });
  }

  catchBurst(x, y, options = {}) {
    const colors = options.special
      ? ["#ffe27a", "#fff7cc", "#ffb86b", "#ff8fa3"]
      : ["#fff8dc", "#b8f7ea", "#ffd1d8", "#ffe7a3"];

    for (let i = 0; i < (options.special ? 15 : 9); i += 1) {
      const angle = rand(-Math.PI, 0);
      const speed = rand(45, options.special ? 190 : 135);
      this.add({
        kind: "sparkle",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 120,
        drag: 0.97,
        size: rand(3, options.special ? 9 : 6),
        rotation: rand(0, TAU),
        spin: rand(-5, 5),
        life: rand(0.35, 0.75),
        color: pick(colors),
      });
    }

    for (let i = 0; i < 7; i += 1) {
      this.add({
        kind: "bubble",
        x: x + rand(-16, 16),
        y: y + rand(-8, 12),
        vx: rand(-22, 22),
        vy: rand(-72, -24),
        size: rand(2, 5.5),
        life: rand(0.6, 1.25),
        color: "rgba(245, 255, 250, 0.9)",
        wobble: rand(0, TAU),
      });
    }

    this.add({
      kind: "ring",
      x,
      y,
      size: 8,
      grow: options.special ? 130 : 82,
      life: 0.5,
      color: options.special ? "rgba(255, 231, 140, 0.8)" : "rgba(232, 255, 249, 0.8)",
    });

    if (options.text) {
      this.add({
        kind: "text",
        x,
        y: y - 16,
        vy: -44,
        size: options.special ? 26 : 21,
        life: 0.9,
        color: options.special ? "#ffda58" : "#fffdf4",
        text: options.text,
        stroke: "rgba(41, 104, 104, 0.55)",
      });
    }

    if (!options.noHearts) {
      this.hearts(options.heart ?? { x, y }, options.special);
    }
  }

  hearts(origin, special = false) {
    const colors = special
      ? ["#ff8fa8", "#ffb3c6", "#ffd9e2"]
      : ["#ff9fb2", "#ffbfcd", "#ffdbe3"];
    const count = special ? 9 : 5;
    for (let i = 0; i < count; i += 1) {
      this.add({
        kind: "heart",
        x: origin.x + rand(-26, 26),
        y: origin.y + rand(-8, 10),
        vx: rand(-46, 46),
        vy: rand(-104, -52),
        gravity: -12,
        drag: 0.99,
        size: rand(11, special ? 20 : 16),
        rotation: rand(-0.35, 0.35),
        life: rand(0.85, 1.4),
        color: pick(colors),
      });
    }
  }

  heartRain(width) {
    const colors = ["#ff8fa8", "#ffb3c6", "#ffd9e2", "#ff7f96"];
    for (let i = 0; i < 26; i += 1) {
      this.add({
        kind: "heart",
        x: rand(0, width),
        y: rand(-36, 8),
        vx: rand(-24, 24),
        vy: rand(65, 125),
        gravity: 14,
        drag: 0.996,
        size: rand(10, 18),
        rotation: rand(-0.5, 0.5),
        spin: rand(-0.9, 0.9),
        life: rand(1.7, 2.8),
        color: pick(colors),
      });
    }
  }

  dashWake(x, y, angle) {
    const offsetX = Math.cos(angle) * -20;
    const offsetY = Math.sin(angle) * -20;
    this.add({
      kind: "wake",
      x: x + offsetX,
      y: y + offsetY,
      vx: Math.cos(angle) * -22,
      vy: Math.sin(angle) * -22,
      size: rand(16, 26),
      grow: rand(45, 68),
      life: 0.5,
      color: "rgba(239, 255, 250, 0.55)",
    });
    for (let i = 0; i < 2; i += 1) {
      this.add({
        kind: "bubble",
        x: x + offsetX + rand(-8, 8),
        y: y + offsetY + rand(-8, 8),
        vx: rand(-15, 15),
        vy: rand(-25, 5),
        size: rand(2, 4),
        life: rand(0.4, 0.8),
        color: "rgba(245, 255, 252, 0.9)",
        wobble: rand(0, TAU),
      });
    }
  }

  netBurst(x, y, radius, count = 0, gain = 0) {
    this.add({
      kind: "ring",
      x,
      y,
      size: radius * 0.18,
      grow: radius * 2.6,
      life: 0.58,
      color: "rgba(255, 250, 223, 0.84)",
    });
    this.add({
      kind: "ring",
      x,
      y,
      size: radius * 0.3,
      grow: radius * 1.5,
      life: 0.42,
      color: "rgba(170, 246, 232, 0.72)",
    });
    const bubbles = Math.min(22, 6 + count * 3);
    for (let i = 0; i < bubbles; i += 1) {
      const angle = rand(0, TAU);
      const distance = Math.sqrt(Math.random()) * radius * 0.82;
      this.add({
        kind: "bubble",
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance * 0.72,
        vx: Math.cos(angle) * rand(18, 70),
        vy: rand(-58, -12),
        size: rand(2, 5),
        life: rand(0.45, 0.95),
        color: "rgba(245, 255, 250, 0.9)",
        wobble: rand(0, TAU),
      });
    }
    if (count > 0) {
      this.add({
        kind: "text",
        x,
        y: y - 34,
        vy: -38,
        size: 23,
        life: 0.85,
        color: "#fff6c2",
        text: `一网 ${count} 条 · +${gain}`,
        stroke: "rgba(33, 104, 104, 0.6)",
      });
    }
  }

  floatText(x, y, text, color = "#fff6d5") {
    this.add({
      kind: "text",
      x,
      y,
      vy: -34,
      size: 18,
      life: 0.85,
      color,
      text,
      stroke: "rgba(33, 104, 104, 0.54)",
    });
  }

  splash(x, y) {
    for (let i = 0; i < 6; i += 1) {
      this.add({
        kind: "bubble",
        x: x + rand(-8, 8),
        y,
        vx: rand(-28, 28),
        vy: rand(-52, -20),
        size: rand(1.5, 3.6),
        life: rand(0.4, 0.8),
        color: "rgba(240, 255, 250, 0.85)",
        wobble: rand(0, TAU),
      });
    }
  }

  confetti(width) {
    const colors = ["#ff8fa3", "#ffd166", "#8fe3d3", "#fff3cf", "#ffad7a"];
    for (let i = 0; i < 54; i += 1) {
      this.add({
        kind: "confetti",
        x: rand(0, width),
        y: rand(-90, -10),
        vx: rand(-28, 28),
        vy: rand(45, 120),
        gravity: 22,
        drag: 0.995,
        size: rand(4, 9),
        rotation: rand(0, TAU),
        spin: rand(-4, 4),
        life: rand(2.2, 4.2),
        color: pick(colors),
      });
    }
  }

  update(dt) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const p = items[i];
      p.life -= dt;
      if (p.life <= 0) {
        items.splice(i, 1);
        continue;
      }
      if (p.kind === "text") {
        p.y += p.vy * dt;
        p.vy *= 0.96;
        continue;
      }
      if (p.kind === "wake" || p.kind === "ring") {
        p.size += p.grow * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = p.life / p.maxLife;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.spin * dt;
      if (p.kind === "bubble") {
        p.x += Math.sin(p.life * 5 + p.wobble) * 8 * dt;
      }
      p.alpha = Math.min(1, (p.life / p.maxLife) * 2.2);
    }
  }

  draw(ctx) {
    for (const p of this.items) {
      const fade = Math.max(0, Math.min(1, p.alpha ?? 1));
      ctx.save();
      ctx.globalAlpha = fade;
      if (p.kind === "sparkle") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        drawStar(ctx, 0, 0, p.size, p.size * 0.28, 4);
        ctx.fill();
      } else if (p.kind === "bubble") {
        ctx.strokeStyle = p.color;
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.28, p.y - p.size * 0.3, p.size * 0.22, 0, TAU);
        ctx.fill();
      } else if (p.kind === "heart") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        drawHeart(ctx, 0, 0, p.size);
        ctx.fill();
      } else if (p.kind === "ring" || p.kind === "wake") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.kind === "wake" ? 2 : 2.4;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.55, 0, 0, TAU);
        ctx.stroke();
      } else if (p.kind === "text") {
        ctx.font = `900 ${p.size}px "Nunito", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 4;
        ctx.strokeStyle = p.stroke;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.kind === "confetti") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.62);
      }
      ctx.restore();
    }
  }
}
