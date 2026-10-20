import { FISH_TYPES } from "./config.js";
import { findSkin, pickSkin } from "./fish-skins.js";
import { TAU, clamp, lerp, rand, rotateTowards } from "./utils.js";

export class Fish {
  constructor(type, x, y, angle, scale = 1, skinId = null, random = Math.random) {
    this.type = type;
    this.spec = FISH_TYPES[type];
    this.random = random;
    this.skin = skinId ? findSkin(type, skinId) : pickSkin(type, random);
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.scale = scale;
    this.radius = this.spec.radius * this.skin.size * scale;
    this.baseSpeed = rand(this.spec.minSpeed, this.spec.maxSpeed, random);
    this.speed = this.baseSpeed;
    this.age = rand(0, 8, random);
    this.phase = rand(0, TAU, random);
    this.wobbleSpeed = rand(1.2, 2.1, random);
    this.turnTimer = rand(1.4, 3.2, random);
    this.depth = rand(0.86, 1.08, random);
    this.caught = false;
    this.catchTimer = 0;
    this.catchDuration = 0.16;
    this.catchTargetX = x;
    this.catchTargetY = y;
    this.spawnFade = 0;
    this.freckles = Array.from({ length: this.skin.freckles ?? 0 }, () => ({
      x: rand(-0.62, 0.55, random),
      y: rand(-0.5, 0.55, random),
      radius: rand(0.05, 0.1, random),
    }));
  }

  get isGold() {
    return this.type === "gold" || this.type === "king";
  }

  get isKing() {
    return this.type === "king";
  }

  startCatch(target) {
    this.caught = true;
    this.catchTimer = this.catchDuration;
    this.catchTargetX = target.x;
    this.catchTargetY = target.y;
    this.speed = 0;
  }

  attract(dt, cat, radius, strength) {
    if (this.caught) return;
    const dx = cat.x - this.x;
    const dy = cat.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance > radius || distance < 0.001) return;
    const pull = strength * (0.35 + (1 - distance / radius) * 0.65);
    this.x += (dx / distance) * pull * dt;
    this.y += (dy / distance) * pull * dt;
    this.angle = rotateTowards(this.angle, Math.atan2(dy, dx), 4.5 * dt);
  }

  update(dt, env) {
    this.age += dt;
    this.spawnFade = Math.min(1, this.spawnFade + dt * 2.4);

    if (this.caught) {
      const ease = 1 - Math.exp(-19 * dt);
      const dx = this.catchTargetX - this.x;
      const dy = this.catchTargetY - this.y;
      this.x += dx * ease;
      this.y += dy * ease;
      if (Math.abs(dx) + Math.abs(dy) > 1) {
        this.angle = rotateTowards(this.angle, Math.atan2(dy, dx), 12 * dt);
      }
      this.catchTimer = Math.max(0, this.catchTimer - dt);
      return;
    }

    const { cat, bounds, speedFactor } = env;

    this.turnTimer -= dt;
    if (this.turnTimer <= 0) {
      this.angle += rand(-0.7, 0.7, this.random);
      this.turnTimer = rand(1.3, 3, this.random);
    }

    this.angle += Math.sin(this.age * this.wobbleSpeed + this.phase) * 0.65 * dt;

    const dx = this.x - cat.x;
    const dy = this.y - cat.y;
    const distance = Math.hypot(dx, dy);
    const fleeRadius = env.fleeRadius;
    const netSlow =
      env.slowRadius && distance < env.slowRadius ? env.slowFactor ?? 1 : 1;

    if (distance < fleeRadius && distance > 0.001) {
      const away = Math.atan2(dy, dx);
      const sideStep = this.isGold
        ? Math.sin(this.age * 6.4 + this.phase) * 0.92
        : Math.sin(this.phase) > 0 ? 0.32 : -0.32;
      const turnSpeed = this.isGold ? 7.2 : 5.2;
      this.angle = rotateTowards(this.angle, away + sideStep, turnSpeed * dt);
      this.speed = lerp(
        this.speed,
        this.spec.fleeSpeed * speedFactor * netSlow,
        1 - Math.exp(-5.5 * dt),
      );
    } else {
      this.speed = lerp(
        this.speed,
        this.baseSpeed * speedFactor * netSlow,
        1 - Math.exp(-1.4 * dt),
      );
    }

    this.speed = clamp(this.speed, 32, 320);
    let nx = this.x + Math.cos(this.angle) * this.speed * dt;
    let ny = this.y + Math.sin(this.angle) * this.speed * dt;

    const r = this.radius;
    const left = bounds.left + r;
    const right = bounds.right - r;
    const top = bounds.top + r;
    const bottom = bounds.bottom - r;

    if (nx < left) {
      nx = left;
      this.angle = Math.PI - this.angle;
    } else if (nx > right) {
      nx = right;
      this.angle = Math.PI - this.angle;
    }
    if (ny < top) {
      ny = top;
      this.angle = -this.angle;
    } else if (ny > bottom) {
      ny = bottom;
      this.angle = -this.angle;
    }

    this.x = nx;
    this.y = ny;
  }

  draw(ctx, time) {
    const r = this.radius;
    const pop = this.caught ? clamp(this.catchTimer / this.catchDuration, 0, 1) : 1;
    const bob = Math.sin(time * 1.9 + this.phase) * 1.1 * this.scale * pop;
    ctx.save();
    ctx.globalAlpha = this.spawnFade * (0.15 + pop * 0.85);
    ctx.translate(this.x, this.y + bob);

    ctx.save();
    ctx.globalAlpha = 0.12 * this.spawnFade * pop;
    ctx.fillStyle = "#064d5b";
    ctx.beginPath();
    ctx.ellipse(5, 8, r * 1.35, r * 0.62, this.angle, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (!this.caught) this.drawAura(ctx, time, r);

    ctx.save();
    ctx.rotate(this.angle);
    const bodyScale = this.depth * (0.25 + pop * 0.75);
    ctx.scale(bodyScale, bodyScale);
    this.drawFish(ctx, time, r);
    ctx.restore();

    if (this.isKing && !this.caught) this.drawCrown(ctx, time, r);
    ctx.restore();
  }

  drawCrown(ctx, time, r) {
    const bob = Math.sin(time * 2.6 + this.phase) * 1.8;
    ctx.save();
    ctx.translate(0, -r * 1.12 + bob);
    ctx.rotate(Math.sin(time * 1.7 + this.phase) * 0.07);
    ctx.fillStyle = "#fff4c8";
    ctx.strokeStyle = "rgba(151, 95, 16, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.48, r * 0.12);
    ctx.lineTo(-r * 0.56, -r * 0.34);
    ctx.lineTo(-r * 0.2, -r * 0.08);
    ctx.lineTo(0, -r * 0.52);
    ctx.lineTo(r * 0.2, -r * 0.08);
    ctx.lineTo(r * 0.56, -r * 0.34);
    ctx.lineTo(r * 0.48, r * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ff8ba0";
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.07, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#78d8dc";
    ctx.beginPath();
    ctx.arc(-r * 0.36, r * 0.01, r * 0.05, 0, TAU);
    ctx.arc(r * 0.36, r * 0.01, r * 0.05, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawAura(ctx, time, r) {
    if (this.isGold) {
      const pulse = 0.5 + Math.sin(time * 3 + this.phase) * 0.5;
      const aura = this.skin.colors.aura ?? "#ffe78a";
      ctx.save();
      ctx.globalAlpha = 0.18 + pulse * 0.16;
      ctx.strokeStyle = aura;
      ctx.lineWidth = this.isKing ? 2.2 : 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, r * (this.isKing ? 2 : 1.85), 0, TAU);
      ctx.stroke();
      if (this.isKing) {
        ctx.globalAlpha = 0.12 + pulse * 0.12;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.3, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      const starCount = this.isKing ? 5 : 3;
      for (let i = 0; i < starCount; i += 1) {
        const angle = time * 0.8 + i * 2.1 + this.phase;
        const radius = r * (1.9 + Math.sin(time * 2.4 + i) * 0.28);
        ctx.save();
        ctx.globalAlpha = 0.55 + Math.sin(time * 4 + i * 2) * 0.3;
        ctx.fillStyle = i === 1 ? "#fff9d1" : aura;
        ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.rotate(angle);
        this.drawTinyStar(ctx, 2.4 + (i % 2) * 1.4);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawTinyStar(ctx, size) {
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const radius = i % 2 === 0 ? size : size * 0.28;
      const angle = (i / 8) * TAU - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  bodyPath(ctx, r) {
    const { nose, height, shoulder } = this.skin.shape;
    const noseX = r * nose;
    const backY = r * height;
    ctx.beginPath();
    ctx.moveTo(noseX, 0);
    ctx.bezierCurveTo(r * shoulder, -backY, -r * 0.3, -backY * 1.02, -r * 0.84, 0);
    ctx.bezierCurveTo(-r * 0.3, backY * 1.02, r * shoulder, backY, noseX, 0);
    ctx.closePath();
  }

  drawTail(ctx, r, wag) {
    const { colors, tail } = this.skin;
    const { style, size, spread } = tail;
    ctx.fillStyle = colors.fin;

    if (style === "fork") {
      const sp = spread;
      ctx.beginPath();
      ctx.moveTo(-r * 0.83, 0);
      ctx.quadraticCurveTo(
        -r * 1.45 * size,
        -r * (0.8 * sp - wag),
        -r * 2.05 * size,
        -r * (0.62 * sp - wag),
      );
      ctx.quadraticCurveTo(-r * 1.58 * size, 0, -r * 2.05 * size, r * (0.62 * sp + wag));
      ctx.quadraticCurveTo(
        -r * 1.45 * size,
        r * (0.8 * sp + wag),
        -r * 0.83,
        0,
      );
      ctx.fill();
      return;
    }

    if (style === "fan") {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 0);
      ctx.quadraticCurveTo(
        -r * 1.18 * size,
        -r * (0.7 * spread - wag * 0.5),
        -r * 1.7 * size,
        -r * (1.04 * spread - wag),
      );
      ctx.quadraticCurveTo(-r * 1.94 * size, -r * 0.56 * spread, -r * 2.02 * size, 0);
      ctx.quadraticCurveTo(-r * 1.94 * size, r * 0.56 * spread, -r * 1.7 * size, r * (1.04 * spread + wag));
      ctx.quadraticCurveTo(
        -r * 1.18 * size,
        r * (0.7 * spread + wag * 0.5),
        -r * 0.8,
        0,
      );
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.strokeStyle = colors.belly;
      ctx.lineWidth = r * 0.05;
      ctx.lineCap = "round";
      for (const lane of [-0.62, 0, 0.62]) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.88, lane * r * 0.16);
        ctx.quadraticCurveTo(
          -r * 1.3 * size,
          lane * r * 0.52 + wag * r * 0.12,
          -r * 1.72 * size,
          lane * r * 0.68 + wag * r * 0.24,
        );
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // Veil tail: a long, wavy double layer.
    const veil = (alpha, scale, sway) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 0);
      ctx.bezierCurveTo(
        -r * 1.25 * size * scale,
        -r * (0.42 * spread) - sway,
        -r * 1.95 * size * scale,
        -r * (0.72 * spread) - sway,
        -r * 2.5 * size * scale,
        -r * (0.34 * spread) - sway * 1.6,
      );
      ctx.quadraticCurveTo(-r * 2.1 * size, 0, -r * 2.5 * size * scale, r * (0.34 * spread) + sway * 1.6);
      ctx.bezierCurveTo(
        -r * 1.95 * size * scale,
        r * (0.72 * spread) + sway,
        -r * 1.25 * size * scale,
        r * (0.42 * spread) + sway,
        -r * 0.8,
        0,
      );
      ctx.fill();
      ctx.restore();
    };
    veil(0.46, 1.08, wag * r * 0.55);
    veil(0.82, 1, wag * r * 0.45);
  }

  drawMarkings(ctx, r) {
    const { colors, shape, pattern } = this.skin;
    ctx.save();
    this.bodyPath(ctx, r);
    ctx.clip();
    ctx.strokeStyle = colors.stripe;
    ctx.fillStyle = colors.stripe;
    ctx.lineCap = "round";

    if (pattern === "patches") {
      for (const patch of this.skin.patches ?? []) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors[patch.color] ?? colors.patch ?? colors.stripe;
        ctx.beginPath();
        ctx.ellipse(
          r * patch.x,
          r * patch.y,
          r * patch.rx,
          r * patch.ry,
          patch.rot ?? 0,
          0,
          TAU,
        );
        ctx.fill();
      }
    } else if (pattern === "scales") {
      const count = this.skin.scales ?? 4;
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = r * 0.11;
      for (let row = 0; row < 2; row += 1) {
        for (let i = 0; i < count; i += 1) {
          ctx.beginPath();
          ctx.arc(
            -r * 0.5 + i * r * 0.3 + row * r * 0.15,
            r * (row ? 0.25 : -0.18),
            r * 0.23,
            0.2,
            Math.PI - 0.2,
          );
          ctx.stroke();
        }
      }
    } else if (pattern === "crown") {
      ctx.fillStyle = colors.patch ?? colors.stripe;
      ctx.globalAlpha = 0.94;
      ctx.beginPath();
      ctx.ellipse(
        r * 0.28,
        -r * shape.height * 0.66,
        r * 0.31,
        r * 0.2,
        -0.16,
        0,
        TAU,
      );
      ctx.fill();
    } else if (pattern === "sideStripe") {
      ctx.globalAlpha = 0.52;
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, r * 0.02);
      ctx.quadraticCurveTo(0, r * 0.08, r * shape.nose * 0.88, -r * 0.02);
      ctx.stroke();
    } else if (pattern === "stripe") {
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = r * 0.17;
      ctx.beginPath();
      ctx.moveTo(-r * 0.36, -r * shape.height * 0.85);
      ctx.quadraticCurveTo(-r * 0.14, 0, -r * 0.34, r * shape.height * 0.85);
      ctx.stroke();
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.moveTo(r * 0.24, -r * shape.height * 0.72);
      ctx.quadraticCurveTo(r * 0.38, 0, r * 0.22, r * shape.height * 0.72);
      ctx.stroke();
    }

    if (this.freckles.length > 0) {
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = colors.stripe;
      for (const spot of this.freckles) {
        ctx.beginPath();
        ctx.arc(r * spot.x, r * spot.y, r * spot.radius, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawEye(ctx, r) {
    const { colors, eye, shape } = this.skin;
    const eyeX = r * shape.nose * 0.58;
    const eyeY = -r * shape.height * 0.2;

    if (eye === "telescope") {
      ctx.save();
      ctx.fillStyle = colors.fin;
      ctx.beginPath();
      ctx.arc(eyeX + r * 0.05, eyeY - r * 0.04, r * 0.37, 0, TAU);
      ctx.fill();
      const gradient = ctx.createRadialGradient(
        eyeX + r * 0.02,
        eyeY - r * 0.12,
        r * 0.05,
        eyeX + r * 0.05,
        eyeY - r * 0.04,
        r * 0.32,
      );
      gradient.addColorStop(0, "#6b6275");
      gradient.addColorStop(1, "#1d1927");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(eyeX + r * 0.05, eyeY - r * 0.04, r * 0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(eyeX + r * 0.13, eyeY - r * 0.14, r * 0.07, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (eye === "bubble") {
      const bubbleX = eyeX + r * 0.06;
      const bubbleY = eyeY - r * 0.12;
      ctx.save();
      ctx.globalAlpha = 0.84;
      ctx.fillStyle = "rgba(255, 249, 238, 0.34)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
      ctx.lineWidth = r * 0.05;
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, r * 0.39, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#3e312b";
      ctx.beginPath();
      ctx.arc(bubbleX + r * 0.02, bubbleY + r * 0.03, r * 0.09, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(bubbleX - r * 0.12, bubbleY - r * 0.14, r * 0.07, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = "#fffdf4";
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, r * 0.24, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#3e312b";
    ctx.beginPath();
    ctx.arc(eyeX + r * 0.04, eyeY, r * 0.13, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(eyeX + r * 0.08, eyeY - r * 0.04, r * 0.045, 0, TAU);
    ctx.fill();
  }

  drawFish(ctx, time, r) {
    const { colors, shape } = this.skin;
    const wag = Math.sin(time * 8 + this.phase + this.age * 2) * 0.36;

    this.drawTail(ctx, r, wag);

    // Dorsal fin (some fancy goldfish have none).
    if (this.skin.dorsal > 0) {
      const backY = r * shape.height;
      ctx.fillStyle = colors.fin;
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, -backY * 0.66);
      ctx.quadraticCurveTo(
        -r * 0.08,
        -backY - r * (0.3 + this.skin.dorsal * 0.26),
        r * 0.42,
        -backY * 0.66,
      );
      ctx.quadraticCurveTo(0, -backY * 0.52, -r * 0.42, -backY * 0.66);
      ctx.fill();
    }

    // Side fin
    ctx.fillStyle = colors.fin;
    ctx.beginPath();
    ctx.ellipse(r * 0.1, r * shape.height * 0.56, r * 0.48, r * 0.25, 0.45, 0, TAU);
    ctx.fill();

    // Body
    this.bodyPath(ctx, r);
    const gradient = ctx.createLinearGradient(0, -r * shape.height, 0, r * shape.height);
    gradient.addColorStop(0, colors.body);
    gradient.addColorStop(0.58, colors.body);
    gradient.addColorStop(1, colors.belly);
    ctx.fillStyle = gradient;
    ctx.fill();

    this.drawMarkings(ctx, r);

    // Belly highlight
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(r * 0.12, r * shape.height * 0.32, r * 0.56, r * 0.16, 0.06, 0, TAU);
    ctx.fill();
    ctx.restore();

    this.drawEye(ctx, r);

    // Mouth
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(r * shape.nose * 0.84, r * shape.height * 0.08, r * 0.14, 0.2, 1.4);
    ctx.stroke();
  }
}
