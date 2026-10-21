import { TAU, clamp, drawStar } from "./utils.js";
import { drawZhaocai } from "./zhaocai.js";

const RUSH_DURATION = 1.5;
const TRAIL_LIFE = 0.34;

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

/**
 * Selects one third to two thirds of the fish on screen and sends the chibi
 * mascot across the pond to scoop them up. The selection is deliberately
 * random inside that range, using the run's seeded RNG for daily challenges.
 */
export class FortuneRush {
  constructor({ onCatch, onFinish, onTargets } = {}) {
    this.onCatch = onCatch;
    this.onFinish = onFinish;
    this.onTargets = onTargets;
    this.active = false;
    this.elapsed = 0;
    this.duration = RUSH_DURATION;
    this.targets = [];
    this.caught = 0;
    this.x = 0;
    this.y = 0;
    this.dir = 1;
    this.startX = 0;
    this.endX = 0;
    this.baseY = 0;
    this.wave = 36;
    this.tilt = 0;
    this.scale = 1;
    this.trail = [];
    this.trailTimer = 0;
    this.finished = false;
  }

  get progress() {
    return clamp(this.elapsed / this.duration, 0, 1);
  }

  get pending() {
    return this.targets.reduce((total, entry) => total + (entry.caught ? 0 : 1), 0);
  }

  releaseTargets() {
    for (const entry of this.targets) {
      entry.fish.fortuneBound = false;
    }
  }

  reset() {
    this.releaseTargets();
    this.active = false;
    this.elapsed = 0;
    this.targets = [];
    this.caught = 0;
    this.trail = [];
    this.trailTimer = 0;
    this.finished = false;
  }

  start({ fishList, width, height, bounds, cat, random = Math.random }) {
    this.reset();
    const available = fishList.filter((fish) => !fish.caught);
    if (available.length === 0) {
      return { ok: false, reason: "empty" };
    }

    const total = available.length;
    const minCount = Math.max(1, Math.ceil(total / 3));
    const maxCount = Math.max(minCount, Math.floor((total * 2) / 3));
    const count = minCount + Math.floor(random() * (maxCount - minCount + 1));

    const pool = available.slice();
    for (let index = 0; index < count; index += 1) {
      const swapIndex = index + Math.floor(random() * (pool.length - index));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }

    this.dir = cat.x > width * 0.5 ? 1 : -1;
    this.startX = this.dir === 1 ? -110 : width + 110;
    this.endX = this.dir === 1 ? width + 110 : -110;
    this.baseY = clamp(
      height * 0.46,
      bounds.top + Math.min(100, height * 0.16),
      bounds.bottom - Math.min(100, height * 0.16),
    );
    this.wave = Math.min(52, Math.max(20, height * 0.055));
    this.scale = clamp(Math.min(width, height) / 760, 0.64, 1);
    this.x = this.startX;
    this.y = this.baseY;
    this.tilt = 0;
    this.elapsed = 0;
    this.caught = 0;
    this.finished = false;
    this.active = true;

    this.targets = pool.slice(0, count).map((fish) => {
      fish.fortuneBound = true;
      const ratio = clamp(
        (fish.x - bounds.left) / Math.max(1, bounds.right - bounds.left),
        0,
        1,
      );
      const sweep = this.dir === 1 ? ratio : 1 - ratio;
      return {
        fish,
        caught: false,
        catchAt: 0.16 + sweep * 0.68,
      };
    });

    this.onTargets?.(this.targets.map((entry) => entry.fish));
    return {
      ok: true,
      count: this.targets.length,
      minCount,
      maxCount,
      total,
    };
  }

  catchEntry(entry) {
    if (entry.caught) return;
    entry.caught = true;
    entry.fish.fortuneBound = false;
    if (entry.fish.caught) return;
    entry.fish.startCatch({ x: this.x, y: this.y + 24 * this.scale });
    this.caught += 1;
    this.onCatch?.(entry.fish, { x: this.x, y: this.y });
  }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;
    const progress = this.progress;
    const eased = easeInOutCubic(progress);

    this.x = this.startX + (this.endX - this.startX) * eased;
    this.y =
      this.baseY +
      Math.sin(eased * Math.PI * 2 - Math.PI / 2) * this.wave +
      Math.sin(this.elapsed * 19) * 2;
    this.tilt = Math.cos(eased * Math.PI * 2 - Math.PI / 2) * 0.09 * this.dir;

    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = 0.035;
      this.trail.push({ x: this.x, y: this.y, life: TRAIL_LIFE, maxLife: TRAIL_LIFE });
    }
    for (let index = this.trail.length - 1; index >= 0; index -= 1) {
      this.trail[index].life -= dt;
      if (this.trail[index].life <= 0) this.trail.splice(index, 1);
    }

    for (const entry of this.targets) {
      if (!entry.caught && progress >= entry.catchAt) this.catchEntry(entry);
    }

    if (progress >= 1) {
      for (const entry of this.targets) {
        if (!entry.caught) this.catchEntry(entry);
      }
      this.finish();
    }
  }

  finish() {
    if (!this.active || this.finished) return;
    this.finished = true;
    this.active = false;
    const caught = this.caught;
    this.releaseTargets();
    this.targets = [];
    this.onFinish?.(caught);
  }

  cancel() {
    this.reset();
  }

  drawTrail(ctx) {
    if (this.trail.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ghost of this.trail) {
      const fade = clamp(ghost.life / ghost.maxLife, 0, 1);
      ctx.globalAlpha = fade * 0.18;
      ctx.fillStyle = "#ffd665";
      ctx.beginPath();
      ctx.ellipse(
        ghost.x,
        ghost.y + 20 * this.scale,
        22 * this.scale * (0.5 + fade * 0.5),
        12 * this.scale * (0.5 + fade * 0.5),
        0,
        0,
        TAU,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  drawTargets(ctx, time) {
    const activeTargets = this.targets.filter(
      (entry) => !entry.caught && !entry.fish.caught,
    );
    if (activeTargets.length === 0) return;

    ctx.save();
    for (const entry of activeTargets) {
      const fish = entry.fish;
      const pulse = 0.5 + Math.sin(time * 6 + fish.phase) * 0.5;

      ctx.globalAlpha = 0.14 + pulse * 0.1;
      ctx.strokeStyle = "#ffe082";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(fish.x, fish.y, fish.radius * 2 + 5 + pulse * 3, 0, TAU);
      ctx.stroke();

      ctx.globalAlpha = 0.09 + pulse * 0.08;
      ctx.setLineDash([]);
      ctx.strokeStyle = "#fff4c2";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + 24 * this.scale);
      ctx.quadraticCurveTo(
        (this.x + fish.x) / 2,
        Math.min(this.y, fish.y) - 24,
        fish.x,
        fish.y,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAura(ctx, time) {
    const pulse = 0.5 + Math.sin(time * 7) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(
      this.x,
      this.y,
      10,
      this.x,
      this.y,
      115 * this.scale,
    );
    glow.addColorStop(0, "rgba(255, 228, 129, 0.24)");
    glow.addColorStop(0.56, "rgba(255, 198, 75, 0.12)");
    glow.addColorStop(1, "rgba(255, 198, 75, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 115 * this.scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 226, 130, 0.5)";
    ctx.lineWidth = 2;
    for (let index = 0; index < 2; index += 1) {
      const cycle = (this.progress * 1.4 + index * 0.48) % 1;
      ctx.globalAlpha = (1 - cycle) * 0.32;
      ctx.beginPath();
      ctx.arc(this.x, this.y, (38 + cycle * 90) * this.scale, 0, TAU);
      ctx.stroke();
    }

    for (let index = 0; index < 7; index += 1) {
      const angle = time * 2.9 + index * 1.15;
      const radius = (48 + (index % 3) * 14) * this.scale;
      ctx.globalAlpha = 0.28 + Math.sin(time * 5 + index) * 0.18;
      ctx.fillStyle = index % 2 === 0 ? "#ffe483" : "#fffdf1";
      drawStar(
        ctx,
        this.x + Math.cos(angle) * radius,
        this.y + Math.sin(angle) * radius * 0.7,
        (2.6 + (index % 3) * 1.3) * this.scale,
        1.2 * this.scale,
        5,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  drawSpeedLines(ctx) {
    const direction = this.dir;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 239, 184, 0.5)";
    ctx.lineCap = "round";
    for (let index = 0; index < 5; index += 1) {
      const offset = (index - 2) * 17 * this.scale;
      const length = (32 + (index % 2) * 22) * this.scale;
      ctx.globalAlpha = 0.25 + (index % 3) * 0.08;
      ctx.lineWidth = 1.5 * this.scale;
      ctx.beginPath();
      ctx.moveTo(this.x - direction * (34 * this.scale + offset), this.y + offset);
      ctx.lineTo(
        this.x - direction * (34 * this.scale + offset + length),
        this.y + offset,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  draw(ctx, time) {
    if (!this.active) return;
    this.drawTrail(ctx);
    this.drawTargets(ctx, time);
    this.drawAura(ctx, time);
    this.drawSpeedLines(ctx);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);
    drawZhaocai(ctx, time, {
      scale: this.scale,
      flip: this.dir,
      sparkle: true,
    });
    ctx.restore();
  }
}

export { RUSH_DURATION };
