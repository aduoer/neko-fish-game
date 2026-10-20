import { CONFIG } from "./config.js";
import { TAU, clamp, easeOutCubic } from "./utils.js";

export class PawNet {
  constructor({ getCat, getScale, onCast, audio }) {
    this.getCat = getCat;
    this.getScale = getScale;
    this.onCast = onCast;
    this.audio = audio;
    this.cooldown = 0;
    this.charge = 0;
    this.charging = false;
    this.pulse = 0;
    this.pulseRadius = 0;
    this.lastCount = 0;
  }

  reset() {
    this.cooldown = 0;
    this.charge = 0;
    this.charging = false;
    this.pulse = 0;
    this.pulseRadius = 0;
    this.lastCount = 0;
  }

  get ready() {
    return this.cooldown <= 0 && !this.charging;
  }

  get chargeRatio() {
    return clamp(this.charge / CONFIG.netChargeTime, 0, 1);
  }

  get radius() {
    const eased = easeOutCubic(this.chargeRatio);
    return (
      (CONFIG.netMinRadius + (CONFIG.netMaxRadius - CONFIG.netMinRadius) * eased) *
      this.getScale()
    );
  }

  begin() {
    if (this.cooldown > 0 || this.charging) return false;
    this.charging = true;
    this.charge = 0;
    return true;
  }

  release() {
    if (!this.charging) return null;
    const ratio = this.chargeRatio;
    const radius = this.radius;
    this.charging = false;
    this.charge = 0;
    this.cooldown = CONFIG.netCooldown;
    this.pulse = 0.55;
    this.pulseRadius = radius;
    const count = this.onCast?.(radius, ratio) ?? 0;
    this.lastCount = count;
    this.audio?.netCast(count, ratio);
    return { radius, ratio, count };
  }

  cancel() {
    this.charging = false;
    this.charge = 0;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.pulse = Math.max(0, this.pulse - dt);
    if (this.charging) {
      this.charge = Math.min(CONFIG.netChargeTime, this.charge + dt);
    }
  }

  draw(ctx, time) {
    const cat = this.getCat();
    if (!cat) return;

    if (this.charging) {
      const radius = this.radius;
      const ratio = this.chargeRatio;
      ctx.save();
      const glow = ctx.createRadialGradient(cat.x, cat.y, radius * 0.25, cat.x, cat.y, radius);
      glow.addColorStop(0, "rgba(255, 252, 231, 0.02)");
      glow.addColorStop(0.72, "rgba(255, 248, 217, 0.08)");
      glow.addColorStop(1, "rgba(255, 238, 158, 0.2)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cat.x, cat.y, radius, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 251, 231, 0.9)";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = -time * 34;
      ctx.beginPath();
      ctx.arc(cat.x, cat.y, radius, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      // Faint net weave inside the paw-net area.
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#eafff7";
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i += 1) {
        const offset = (i / 2.6) * radius;
        const half = Math.sqrt(Math.max(0, radius * radius - offset * offset));
        ctx.beginPath();
        ctx.moveTo(cat.x - half, cat.y + offset);
        ctx.lineTo(cat.x + half, cat.y + offset);
        ctx.moveTo(cat.x + offset, cat.y - half);
        ctx.lineTo(cat.x + offset, cat.y + half);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = ratio > 0.98 ? "#ffe16c" : "#fff6c9";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(
        cat.x,
        cat.y,
        radius + 5,
        -Math.PI / 2,
        -Math.PI / 2 + TAU * Math.max(0.03, ratio),
      );
      ctx.stroke();

      for (let i = 0; i < 4; i += 1) {
        const angle = time * 1.25 + (i / 4) * TAU;
        ctx.fillStyle = "rgba(255, 249, 221, 0.6)";
        ctx.beginPath();
        ctx.arc(
          cat.x + Math.cos(angle) * radius,
          cat.y + Math.sin(angle) * radius,
          3.1,
          0,
          TAU,
        );
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.pulse > 0) {
      const progress = 1 - this.pulse / 0.55;
      const radius = this.pulseRadius * (1.08 + progress * 0.18);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress) * 0.8;
      ctx.strokeStyle = "rgba(255, 247, 211, 0.9)";
      ctx.lineWidth = 5 * (1 - progress * 0.6);
      ctx.beginPath();
      ctx.arc(cat.x, cat.y, radius, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha *= 0.45;
      ctx.strokeStyle = "#a9f5e6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cat.x, cat.y, radius * 0.82, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}
