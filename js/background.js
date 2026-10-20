import { DEFAULT_POND, getPondSkin } from "./cosmetics.js";
import { TAU, rand } from "./utils.js";

const LILY_SPOTS = [
  [0.06, 0.18, 0.95],
  [0.16, 0.74, 0.72],
  [0.91, 0.72, 0.88],
  [0.84, 0.2, 0.63],
  [0.48, 0.95, 0.55],
  [0.7, 0.08, 0.5],
];

const PETAL_SPOTS = [
  [0.08, 0.4],
  [0.26, 0.12],
  [0.66, 0.36],
  [0.92, 0.52],
  [0.42, 0.62],
  [0.58, 0.84],
  [0.77, 0.66],
  [0.32, 0.9],
];

export class PondBackground {
  constructor() {
    this.w = 0;
    this.h = 0;
    this.time = 0;
    this.gradient = null;
    this.vignette = null;
    this.theme = getPondSkin(DEFAULT_POND).theme;
    this.lilies = [];
    this.petals = [];
    this.sparkles = [];
    this.waves = [];
    this.lightPools = [];
  }

  setTheme(theme) {
    this.theme = theme ?? getPondSkin(DEFAULT_POND).theme;
    this.gradient = null;
    this.vignette = null;
    const colors = this.theme.petalColors ?? ["#ffd4dc", "#ffe9de"];
    this.petals.forEach((petal, index) => {
      petal.color = colors[index % colors.length];
    });
  }

  resize(width, height) {
    this.w = width;
    this.h = height;
    this.gradient = null;
    this.vignette = null;
    this.buildDecor();
  }

  buildDecor() {
    const { w, h } = this;
    const scale = Math.max(0.8, Math.min(1.35, Math.min(w, h) / 820));

    this.lilies = LILY_SPOTS.map(([nx, ny, size], index) => {
      const radius = (24 + size * 26) * Math.max(0.85, scale);
      return {
        x: nx * w,
        y: ny * h,
        radius,
        rotation: rand(0, TAU),
        tint: index % 3,
        flower: index % 2 === 0,
        phase: rand(0, TAU),
      };
    });

    this.petals = PETAL_SPOTS.map(([nx, ny], index) => ({
      x: nx * w,
      y: ny * h,
      vx: rand(-8, 8),
      vy: rand(3, 9),
      size: rand(5, 9),
      rotation: rand(0, TAU),
      spin: rand(-0.3, 0.3),
      phase: rand(0, TAU),
      color:
        this.theme.petalColors?.[index % this.theme.petalColors.length] ??
        (index % 3 === 0 ? "#ffd4dc" : "#ffe9de"),
    }));

    this.sparkles = Array.from({ length: 44 }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      size: rand(1, 2.8),
      phase: rand(0, TAU),
      speed: rand(0.5, 1.4),
    }));

    this.waves = Array.from({ length: 7 }, (_, index) => ({
      y: (index + 1) / 8,
      amplitude: rand(5, 13),
      frequency: rand(0.005, 0.011),
      speed: rand(0.12, 0.3),
      phase: rand(0, TAU),
      alpha: rand(0.032, 0.075),
    }));

    this.lightPools = [
      { x: w * 0.24, y: h * 0.32, radius: Math.min(w, h) * 0.35, phase: 0.4 },
      { x: w * 0.79, y: h * 0.62, radius: Math.min(w, h) * 0.42, phase: 2.1 },
      { x: w * 0.55, y: h * 0.12, radius: Math.min(w, h) * 0.24, phase: 4.3 },
    ];
  }

  update(dt) {
    this.time += dt;
    const { w, h } = this;
    for (const petal of this.petals) {
      petal.x += (petal.vx + Math.sin(this.time * 0.5 + petal.phase) * 7) * dt;
      petal.y += petal.vy * dt;
      petal.rotation += petal.spin * dt;
      if (petal.y > h + 16) {
        petal.y = -16;
        petal.x = rand(0, w);
      }
      if (petal.x < -16) petal.x = w + 16;
      if (petal.x > w + 16) petal.x = -16;
    }
  }

  draw(ctx) {
    const { w, h, time } = this;
    if (w <= 0 || h <= 0) return;

    if (!this.gradient) {
      const stops = this.theme.gradient;
      this.gradient = ctx.createLinearGradient(0, 0, w * 0.22, h);
      this.gradient.addColorStop(0, stops[0]);
      this.gradient.addColorStop(0.38, stops[1]);
      this.gradient.addColorStop(0.72, stops[2]);
      this.gradient.addColorStop(1, stops[3]);
    }
    ctx.fillStyle = this.gradient;
    ctx.fillRect(0, 0, w, h);

    this.drawLightPools(ctx);
    this.drawWaves(ctx);
    this.drawSparkles(ctx);
    this.drawPetals(ctx);
    this.drawLilies(ctx);
    this.drawReeds(ctx);
  }

  drawLightPools(ctx) {
    const { w, h } = this;
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    for (const pool of this.lightPools) {
      const driftX = Math.sin(this.time * 0.18 + pool.phase) * w * 0.02;
      const driftY = Math.cos(this.time * 0.14 + pool.phase) * h * 0.015;
      const gradient = ctx.createRadialGradient(
        pool.x + driftX,
        pool.y + driftY,
        0,
        pool.x + driftX,
        pool.y + driftY,
        pool.radius,
      );
      gradient.addColorStop(0, this.theme.light);
      gradient.addColorStop(0.55, this.theme.lightSoft);
      gradient.addColorStop(1, "rgba(226, 255, 245, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pool.x + driftX, pool.y + driftY, pool.radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawWaves(ctx) {
    const { w, h, time } = this;
    ctx.save();
    ctx.lineCap = "round";
    for (const wave of this.waves) {
      const baseY = wave.y * h;
      ctx.beginPath();
      for (let x = -16; x <= w + 16; x += 24) {
        const y =
          baseY +
          Math.sin(x * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude +
          Math.sin(x * wave.frequency * 2.3 + time * 0.21) * wave.amplitude * 0.32;
        if (x === -16) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${this.theme.wave}, ${wave.alpha})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSparkles(ctx) {
    const { w, h, time } = this;
    ctx.save();
    for (const sparkle of this.sparkles) {
      const twinkle = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(time * sparkle.speed + sparkle.phase)), 2);
      ctx.globalAlpha = twinkle * 0.55;
      ctx.fillStyle = this.theme.sparkle;
      const driftX = Math.sin(time * 0.2 + sparkle.phase) * 3;
      const driftY = Math.cos(time * 0.15 + sparkle.phase) * 3;
      ctx.beginPath();
      ctx.arc(
        (sparkle.x + driftX + w) % w,
        (sparkle.y + driftY + h) % h,
        sparkle.size,
        0,
        TAU,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  drawPetals(ctx) {
    ctx.save();
    for (const petal of this.petals) {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = petal.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size, petal.size * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  drawLilies(ctx) {
    const { time } = this;
    for (const lily of this.lilies) {
      const bob = Math.sin(time * 0.7 + lily.phase) * 2.2;
      ctx.save();
      ctx.translate(lily.x, lily.y + bob);
      ctx.rotate(lily.rotation + Math.sin(time * 0.18 + lily.phase) * 0.035);
      ctx.scale(1, 0.7);

      const r = lily.radius;
      ctx.fillStyle = this.theme.lilyShade;
      ctx.beginPath();
      ctx.ellipse(4, 7, r * 1.03, r * 0.94, 0, 0, TAU);
      ctx.fill();

      ctx.fillStyle = this.theme.lily[lily.tint];
      ctx.beginPath();
      ctx.arc(0, 0, r, 0.32, TAU - 0.32);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(35, 110, 79, 0.28)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.strokeStyle = "rgba(240, 255, 233, 0.32)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i += 1) {
        const angle = 0.65 + i * 0.62;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r * 0.2, Math.sin(angle) * r * 0.2);
        ctx.lineTo(Math.cos(angle) * r * 0.82, Math.sin(angle) * r * 0.82);
        ctx.stroke();
      }

      if (lily.flower) this.drawFlower(ctx, r);
      ctx.restore();
    }
  }

  drawFlower(ctx, lilyRadius) {
    ctx.save();
    ctx.translate(lilyRadius * 0.22, -lilyRadius * 0.2);
    ctx.scale(1, 1.3);
    const petalCount = 6;
    for (let ring = 0; ring < 2; ring += 1) {
      const radius = 8 - ring * 2.6;
      const offset = ring * 0.45;
      for (let i = 0; i < petalCount; i += 1) {
        const angle = (i / petalCount) * TAU + offset;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = this.theme.flower[ring];
        ctx.beginPath();
        ctx.ellipse(0, -radius * 0.86, radius * 0.56, radius * 1.02, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = "#ffd264";
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawReeds(ctx) {
    const { w, h, time } = this;
    const sway = Math.sin(time * 0.5) * 4;
    ctx.save();
    ctx.lineCap = "round";

    const drawCluster = (baseX, baseY, dir, alpha) => {
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 5; i += 1) {
        const length = 45 + i * 14;
        const lean = dir * (18 + i * 9);
        const startX = baseX + i * 7 * dir;
        ctx.strokeStyle = i % 2 === 0 ? this.theme.reed[0] : this.theme.reed[1];
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(startX, baseY);
        ctx.quadraticCurveTo(
          startX + lean * 0.4,
          baseY - length * 0.52,
          startX + lean + sway,
          baseY - length,
        );
        ctx.stroke();
      }
      ctx.fillStyle = this.theme.reedHead;
      for (let i = 0; i < 2; i += 1) {
        const x = baseX + 14 + i * 18;
        const y = baseY - 70 - i * 20;
        ctx.beginPath();
        ctx.ellipse(x + sway * 0.8, y, 3.2, 9, 0.1, 0, TAU);
        ctx.fill();
      }
    };

    drawCluster(w * 0.02, h - 26, 1, 0.82);
    drawCluster(w * 0.89, h - 20, 1, 0.68);
    drawCluster(w - 30, h * 0.2, -1, 0.45);
    ctx.restore();
  }

  drawVignette(ctx) {
    const { w, h } = this;
    if (w <= 0 || h <= 0) return;
    if (!this.vignette) {
      const centerX = w / 2;
      const centerY = h * 0.46;
      const inner = Math.min(w, h) * 0.36;
      const outer = Math.hypot(w, h) * 0.62;
      this.vignette = ctx.createRadialGradient(centerX, centerY, inner, centerX, centerY, outer);
      this.vignette.addColorStop(0, "rgba(6, 65, 73, 0)");
      this.vignette.addColorStop(0.72, "rgba(6, 65, 73, 0.05)");
      this.vignette.addColorStop(1, this.theme.vignette);
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, w, h);
  }
}
