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
    this.spawnFade = 0;
  }

  get isPuffer() {
    return this.type === "puffer";
  }

  get isGold() {
    return this.type === "gold";
  }

  update(dt, env) {
    this.age += dt;
    this.spawnFade = Math.min(1, this.spawnFade + dt * 2.4);
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

    if (!this.isPuffer && distance < fleeRadius && distance > 0.001) {
      const away = Math.atan2(dy, dx);
      const sideStep = Math.sin(this.phase) > 0 ? 0.32 : -0.32;
      this.angle = rotateTowards(this.angle, away + sideStep, 5.2 * dt);
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
    const bob = Math.sin(time * 1.9 + this.phase) * 1.1 * this.scale;
    ctx.save();
    ctx.globalAlpha = this.spawnFade;
    ctx.translate(this.x, this.y + bob);

    ctx.save();
    ctx.globalAlpha = 0.12 * this.spawnFade;
    ctx.fillStyle = "#064d5b";
    ctx.beginPath();
    ctx.ellipse(5, 8, r * 1.35, r * 0.62, this.angle, 0, TAU);
    ctx.fill();
    ctx.restore();

    this.drawAura(ctx, time, r);

    ctx.rotate(this.angle);
    ctx.scale(this.depth, this.depth);
    if (this.isPuffer) this.drawPuffer(ctx, time, r);
    else this.drawFish(ctx, time, r);
    ctx.restore();
  }

  drawAura(ctx, time, r) {
    if (this.isGold) {
      const pulse = 0.5 + Math.sin(time * 3 + this.phase) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.18 + pulse * 0.16;
      ctx.strokeStyle = "#ffe78a";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.85, 0, TAU);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < 3; i += 1) {
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
    } else if (this.isPuffer) {
      const pulse = 0.5 + Math.sin(time * 2.6 + this.phase) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.16 + pulse * 0.1;
      ctx.strokeStyle = "#ff7b7b";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.7, 0, TAU);
      ctx.stroke();
      ctx.restore();
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
    } else if (this.type === "gold") {
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

  drawPuffer(ctx, time, r) {
    const spec = this.spec;
    const pulse = 0.5 + Math.sin(time * 2.6 + this.phase) * 0.5;
    const bodyR = r * (1.12 + pulse * 0.035);

    // Tail
    ctx.fillStyle = spec.fin;
    ctx.beginPath();
    ctx.moveTo(-bodyR * 0.82, 0);
    ctx.quadraticCurveTo(-bodyR * 1.5, -bodyR * 0.52, -bodyR * 1.75, -bodyR * 0.1);
    ctx.quadraticCurveTo(-bodyR * 1.45, 0, -bodyR * 1.75, bodyR * 0.56);
    ctx.quadraticCurveTo(-bodyR * 1.4, bodyR * 0.42, -bodyR * 0.82, 0);
    ctx.fill();

    // Spikes
    ctx.fillStyle = spec.accent;
    const spikes = 14;
    for (let i = 0; i < spikes; i += 1) {
      const angle = (i / spikes) * TAU + Math.sin(this.phase) * 0.02;
      const innerAngle = angle - 0.13;
      const outerAngle = angle + 0.13;
      const baseR = bodyR * 1.02;
      const tipR = bodyR * (1.4 + pulse * 0.1);
      ctx.beginPath();
      ctx.moveTo(Math.cos(innerAngle) * baseR, Math.sin(innerAngle) * baseR);
      ctx.lineTo(Math.cos(angle) * tipR, Math.sin(angle) * tipR);
      ctx.lineTo(Math.cos(outerAngle) * baseR, Math.sin(outerAngle) * baseR);
      ctx.closePath();
      ctx.fill();
    }

    // Body
    const gradient = ctx.createRadialGradient(
      -bodyR * 0.28,
      -bodyR * 0.32,
      bodyR * 0.1,
      0,
      0,
      bodyR,
    );
    gradient.addColorStop(0, "#fff1bd");
    gradient.addColorStop(0.65, spec.body);
    gradient.addColorStop(1, "#f1bd5c");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR, 0, TAU);
    ctx.fill();

    // Belly
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = spec.belly;
    ctx.beginPath();
    ctx.ellipse(bodyR * 0.08, bodyR * 0.34, bodyR * 0.58, bodyR * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Fins
    ctx.fillStyle = spec.fin;
    ctx.beginPath();
    ctx.ellipse(bodyR * 0.24, -bodyR * 0.95, bodyR * 0.22, bodyR * 0.12, -0.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-bodyR * 0.34, bodyR * 0.8, bodyR * 0.24, bodyR * 0.12, 0.5, 0, TAU);
    ctx.fill();

    // Eyes
    const eyeY = -bodyR * 0.18;
    ctx.fillStyle = "#fffdf4";
    ctx.beginPath();
    ctx.arc(-bodyR * 0.3, eyeY, bodyR * 0.21, 0, TAU);
    ctx.arc(bodyR * 0.3, eyeY, bodyR * 0.21, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#46362f";
    ctx.beginPath();
    ctx.arc(-bodyR * 0.27, eyeY + bodyR * 0.015, bodyR * 0.105, 0, TAU);
    ctx.arc(bodyR * 0.33, eyeY + bodyR * 0.015, bodyR * 0.105, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-bodyR * 0.24, eyeY - bodyR * 0.03, bodyR * 0.035, 0, TAU);
    ctx.arc(bodyR * 0.36, eyeY - bodyR * 0.03, bodyR * 0.035, 0, TAU);
    ctx.fill();

    // Angry brows
    ctx.strokeStyle = "#9c6a2c";
    ctx.lineWidth = Math.max(1.4, bodyR * 0.085);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-bodyR * 0.5, eyeY - bodyR * 0.3);
    ctx.lineTo(-bodyR * 0.22, eyeY - bodyR * 0.22);
    ctx.moveTo(bodyR * 0.5, eyeY - bodyR * 0.3);
    ctx.lineTo(bodyR * 0.22, eyeY - bodyR * 0.22);
    ctx.stroke();

    // Mouth
    ctx.strokeStyle = "#9c6a2c";
    ctx.lineWidth = Math.max(1.2, bodyR * 0.07);
    ctx.beginPath();
    ctx.arc(0, bodyR * 0.28, bodyR * 0.13, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.fillStyle = "#f09c89";
    ctx.beginPath();
    ctx.ellipse(0, bodyR * 0.46, bodyR * 0.11, bodyR * 0.07, 0, 0, TAU);
    ctx.fill();

    // Cheeks
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ff8f84";
    ctx.beginPath();
    ctx.arc(-bodyR * 0.58, bodyR * 0.22, bodyR * 0.13, 0, TAU);
    ctx.arc(bodyR * 0.58, bodyR * 0.22, bodyR * 0.13, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
