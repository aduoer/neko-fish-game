import { FISH_TYPES } from "./config.js";
import { TAU, clamp, lerp, rand, rotateTowards } from "./utils.js";

export class Fish {
  constructor(type, x, y, angle, scale = 1) {
    this.type = type;
    this.spec = FISH_TYPES[type];
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.scale = scale;
    this.radius = this.spec.radius * scale;
    this.baseSpeed = rand(this.spec.minSpeed, this.spec.maxSpeed);
    this.speed = this.baseSpeed;
    this.age = rand(0, 8);
    this.phase = rand(0, TAU);
    this.wobbleSpeed = rand(1.2, 2.1);
    this.turnTimer = rand(1.4, 3.2);
    this.depth = rand(0.86, 1.08);
    this.caught = false;
    this.catchTimer = 0;
    this.catchDuration = 0.16;
    this.catchTargetX = x;
    this.catchTargetY = y;
    this.spawnFade = 0;
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
      this.angle += rand(-0.7, 0.7);
      this.turnTimer = rand(1.3, 3);
    }

    this.angle += Math.sin(this.age * this.wobbleSpeed + this.phase) * 0.65 * dt;

    const dx = this.x - cat.x;
    const dy = this.y - cat.y;
    const distance = Math.hypot(dx, dy);
    const fleeRadius = env.fleeRadius;

    if (distance < fleeRadius && distance > 0.001) {
      const away = Math.atan2(dy, dx);
      const sideStep = this.isGold
        ? Math.sin(this.age * 6.4 + this.phase) * 0.92
        : Math.sin(this.phase) > 0 ? 0.32 : -0.32;
      const turnSpeed = this.isGold ? 7.2 : 5.2;
      this.angle = rotateTowards(this.angle, away + sideStep, turnSpeed * dt);
      this.speed = lerp(
        this.speed,
        this.spec.fleeSpeed * speedFactor,
        1 - Math.exp(-5.5 * dt),
      );
    } else {
      this.speed = lerp(
        this.speed,
        this.baseSpeed * speedFactor,
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
      ctx.save();
      ctx.globalAlpha = 0.18 + pulse * 0.16;
      ctx.strokeStyle = this.isKing ? "#fff2a8" : "#ffe78a";
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
        ctx.fillStyle = i === 1 ? "#fff9d1" : "#ffd75e";
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

  drawFish(ctx, time, r) {
    const spec = this.spec;
    const wag = Math.sin(time * 8 + this.phase + this.age * 2) * 0.36;

    // Tail
    ctx.fillStyle = spec.fin;
    ctx.beginPath();
    ctx.moveTo(-r * 0.83, 0);
    ctx.quadraticCurveTo(-r * 1.45, -r * (0.8 - wag), -r * 2.05, -r * (0.62 - wag));
    ctx.quadraticCurveTo(-r * 1.58, 0, -r * 2.05, r * (0.62 + wag));
    ctx.quadraticCurveTo(-r * 1.45, r * (0.8 + wag), -r * 0.83, 0);
    ctx.fill();

    // Dorsal fin
    ctx.fillStyle = spec.fin;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.6);
    ctx.quadraticCurveTo(-r * 0.08, -r * 1.22, r * 0.42, -r * 0.6);
    ctx.quadraticCurveTo(0, -r * 0.46, -r * 0.42, -r * 0.6);
    ctx.fill();

    // Side fin
    ctx.fillStyle = spec.fin;
    ctx.beginPath();
    ctx.ellipse(r * 0.1, r * 0.52, r * 0.48, r * 0.25, 0.45, 0, TAU);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(r * 1.28, 0);
    ctx.bezierCurveTo(r * 0.9, -r * 0.78, -r * 0.3, -r * 0.92, -r * 0.85, 0);
    ctx.bezierCurveTo(-r * 0.3, r * 0.92, r * 0.9, r * 0.78, r * 1.28, 0);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, -r * 0.9, 0, r * 0.9);
    gradient.addColorStop(0, spec.body);
    gradient.addColorStop(0.58, spec.body);
    gradient.addColorStop(1, spec.belly);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Markings clipped to body
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = spec.stripe;
    ctx.lineCap = "round";
    if (this.type === "koi") {
      ctx.lineWidth = r * 0.34;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(-r * 0.46, -r * 0.8);
      ctx.quadraticCurveTo(-r * 0.2, -r * 0.2, -r * 0.44, r * 0.72);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.32, -r * 0.72);
      ctx.quadraticCurveTo(r * 0.48, 0, r * 0.22, r * 0.8);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 250, 238, 0.5)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.6, -r * 0.18, r * 0.22, r * 0.15, -0.4, 0, TAU);
      ctx.fill();
    } else if (this.isGold) {
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = r * 0.13;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(
          -r * 0.35 + i * r * 0.3,
          Math.sin(i * 2.1) * r * 0.16,
          r * 0.24,
          0.2,
          Math.PI - 0.2,
        );
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = r * 0.18;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.82);
      ctx.quadraticCurveTo(-r * 0.12, 0, -r * 0.3, r * 0.82);
      ctx.stroke();
    }
    ctx.restore();

    // Belly highlight
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(r * 0.12, r * 0.28, r * 0.56, r * 0.16, 0.06, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Eye
    const eyeX = r * 0.72;
    const eyeY = -r * 0.16;
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

    // Mouth
    ctx.strokeStyle = spec.accent;
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(r * 1.05, r * 0.08, r * 0.14, 0.2, 1.4);
    ctx.stroke();
  }
}
