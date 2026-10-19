import { CONFIG } from "./config.js";
import { TAU, clamp, damp, drawStar, rand } from "./utils.js";

export class Cat {
  constructor(scale = 1) {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.vx = 0;
    this.vy = 0;
    this.scale = scale;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.dashDirX = 0;
    this.dashDirY = -1;
    this.wakeTimer = 0;
    this.catchPop = 0;
    this.blink = 0;
    this.blinkTimer = rand(1.5, 4);
    this.lookX = 0;
    this.lookY = 0;
    this.lastDirX = 0;
    this.lastDirY = 1;
    this.events = [];
    this.time = 0;
    this.starEyes = 0;
    this.trail = [];
    this.trailTimer = 0;
  }

  get catchRadius() {
    return (CONFIG.catchRadius + (this.dashTime > 0 ? 9 : 0)) * this.scale;
  }

  get isDashing() {
    return this.dashTime > 0;
  }

  place(x, y, scale = this.scale) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;
    this.scale = scale;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.catchPop = 0;
    this.starEyes = 0;
    this.trail.length = 0;
    this.trailTimer = 0;
    this.events.length = 0;
  }

  setScale(scale) {
    this.scale = scale;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  triggerCatch() {
    this.catchPop = 0.42;
  }

  triggerStarEyes(duration = CONFIG.starEyesDuration) {
    this.starEyes = Math.max(this.starEyes, duration);
  }

  finishRound() {
    this.dashTime = 0;
    this.starEyes = 0;
    this.trail.length = 0;
  }

  triggerDash() {
    if (this.dashCooldown > 0 || this.dashTime > 0) return false;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.hypot(dx, dy);
    let dirX = this.lastDirX;
    let dirY = this.lastDirY;
    if (distance > 10) {
      dirX = dx / distance;
      dirY = dy / distance;
    }
    const length = Math.hypot(dirX, dirY) || 1;
    this.dashDirX = dirX / length;
    this.dashDirY = dirY / length;
    this.dashTime = CONFIG.dashDuration;
    this.dashCooldown = CONFIG.dashCooldown;
    this.wakeTimer = 0;
    this.trailTimer = 0;
    this.events.push({ type: "dash" });
    return true;
  }

  update(dt, env) {
    this.time += dt;
    const { bounds, keysX, keysY } = env;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.catchPop = Math.max(0, this.catchPop - dt);
    this.starEyes = Math.max(0, this.starEyes - dt);
    for (let i = this.trail.length - 1; i >= 0; i -= 1) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blink = 0.13;
      this.blinkTimer = rand(1.8, 4.6);
    }
    this.blink = Math.max(0, this.blink - dt);

    const hasKeys = Math.abs(keysX) + Math.abs(keysY) > 0;
    if (hasKeys) {
      const length = Math.hypot(keysX, keysY) || 1;
      this.targetX = this.x + (keysX / length) * 260;
      this.targetY = this.y + (keysY / length) * 260;
    }

    const maxSpeed = CONFIG.catSpeed * this.scale;

    if (this.dashTime > 0) {
      this.dashTime = Math.max(0, this.dashTime - dt);
      const dashSpeed = CONFIG.dashSpeed * this.scale;
      this.x += this.dashDirX * dashSpeed * dt;
      this.y += this.dashDirY * dashSpeed * dt;
      this.vx = this.dashDirX * dashSpeed;
      this.vy = this.dashDirY * dashSpeed;
      this.targetX = this.x;
      this.targetY = this.y;
      this.wakeTimer -= dt;
      if (this.wakeTimer <= 0) {
        this.wakeTimer = 0.055;
        this.events.push({
          type: "wake",
          x: this.x,
          y: this.y,
          angle: Math.atan2(this.dashDirY, this.dashDirX),
        });
      }
      this.trailTimer -= dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.032;
        this.trail.push({ x: this.x, y: this.y, life: 0.3, maxLife: 0.3 });
      }
    } else {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.hypot(dx, dy);
      let desiredX = 0;
      let desiredY = 0;
      if (distance > 3) {
        const ease = clamp(distance / 90, 0.18, 1);
        desiredX = (dx / distance) * maxSpeed * ease;
        desiredY = (dy / distance) * maxSpeed * ease;
      }
      this.vx = damp(this.vx, desiredX, 11, dt);
      this.vy = damp(this.vy, desiredY, 11, dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    const margin = 72 * this.scale;
    this.x = clamp(this.x, bounds.left + margin, bounds.right - margin);
    this.y = clamp(this.y, bounds.top + margin, bounds.bottom - margin);

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 24) {
      this.lastDirX = this.vx / speed;
      this.lastDirY = this.vy / speed;
    }
    this.lookX = damp(
      this.lookX,
      clamp((this.targetX - this.x) / (150 * this.scale), -1, 1),
      7,
      dt,
    );
    this.lookY = damp(
      this.lookY,
      clamp((this.targetY - this.y) / (150 * this.scale), -1, 1),
      7,
      dt,
    );
  }

  drainEvents() {
    if (this.events.length === 0) return [];
    const events = this.events.slice();
    this.events.length = 0;
    return events;
  }

  draw(ctx, time) {
    const S = this.scale;
    const speed = Math.hypot(this.vx, this.vy);
    const moving = clamp(speed / (CONFIG.catSpeed * S), 0, 1.4);
    const bob = Math.sin(time * 2.5) * 2.2;
    const tilt = clamp(this.vx / (CONFIG.catSpeed * S), -1, 1) * 0.1;

    this.drawTrail(ctx);

    ctx.save();
    ctx.translate(this.x, this.y);

    this.drawRipple(ctx, time, moving);

    ctx.translate(0, bob);
    ctx.rotate(tilt);
    ctx.scale(S, S);

    this.drawTail(ctx, time, moving);
    this.drawRing(ctx, time, moving);
    this.drawPaws(ctx);
    this.drawHead(ctx, time, moving);

    if (this.isDashing) this.drawSpeedLines(ctx, moving);

    ctx.restore();
  }

  drawTrail(ctx) {
    const S = this.scale;
    for (const ghost of this.trail) {
      const fade = clamp(ghost.life / ghost.maxLife, 0, 1);
      ctx.save();
      ctx.translate(ghost.x, ghost.y - 6 * S);
      ctx.scale(S, S);
      ctx.globalAlpha = fade * 0.22;
      ctx.fillStyle = "#ffd29a";
      ctx.beginPath();
      ctx.moveTo(-28, -13);
      ctx.quadraticCurveTo(-33, -39, -23, -43);
      ctx.quadraticCurveTo(-13, -38, -7, -25);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(28, -13);
      ctx.quadraticCurveTo(33, -39, 23, -43);
      ctx.quadraticCurveTo(13, -38, 7, -25);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -4, 32, 28, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = fade * 0.15;
      ctx.strokeStyle = "#eafff8";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawRipple(ctx, time, moving) {
    ctx.save();
    ctx.globalAlpha = 0.16 + moving * 0.1;
    ctx.strokeStyle = "#eafff8";
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i += 1) {
      const cycle = (time * 0.32 + i * 0.5) % 1;
      ctx.globalAlpha = (1 - cycle) * (0.1 + moving * 0.14);
      ctx.beginPath();
      ctx.ellipse(0, 6, 66 + cycle * 42, 50 + cycle * 30, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTail(ctx, time, moving) {
    const sway = Math.sin(time * 2.8) * 7 + Math.sin(time * 4.1) * 2;
    ctx.save();
    ctx.strokeStyle = "#f3a75f";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(4, 36);
    ctx.bezierCurveTo(30, 54 + sway * 0.4, 56, 48 + sway, 48, 72 + sway * 0.7);
    ctx.stroke();
    ctx.strokeStyle = "#ffe5c4";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(48, 66 + sway * 0.7);
    ctx.quadraticCurveTo(47, 72 + sway * 0.7, 49, 77 + sway * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  drawRing(ctx, time, moving) {
    const outer = 60;
    const mid = 50;
    const thickness = 20;

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#064b58";
    ctx.beginPath();
    ctx.ellipse(3, 10, outer * 1.02, outer * 0.78, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.scale(1, 0.91);

    ctx.strokeStyle = "#e85f7c";
    ctx.lineWidth = thickness + 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, mid, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "#ff8ea3";
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.arc(0, 0, mid, 0, TAU);
    ctx.stroke();

    // Cream stripes
    ctx.strokeStyle = "#fff0d9";
    const stripeCount = 7;
    for (let i = 0; i < stripeCount; i += 1) {
      const angle = (i / stripeCount) * TAU + time * 0.04;
      ctx.beginPath();
      ctx.arc(0, 0, mid, angle, angle + 0.29);
      ctx.stroke();
    }

    // Inner shading and rim highlights
    ctx.strokeStyle = "rgba(176, 45, 72, 0.24)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, mid + thickness / 2 - 4, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 245, 0.4)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, mid - thickness / 2 + 3, 2.35, 3.25);
    ctx.stroke();

    ctx.globalAlpha = 0.2 + moving * 0.08;
    ctx.fillStyle = "#d94d6e";
    ctx.beginPath();
    ctx.arc(0, 0, mid - thickness / 2 - 1, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  drawPaws(ctx) {
    const paw = (x, y, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#fff1db";
      ctx.strokeStyle = "rgba(196, 121, 66, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10.5, 8.5, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(185, 117, 66, 0.36)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-3.5, -3.2);
      ctx.lineTo(-3.5, 2.2);
      ctx.moveTo(0, -3.8);
      ctx.lineTo(0, 2.8);
      ctx.moveTo(3.5, -3.2);
      ctx.lineTo(3.5, 2.2);
      ctx.stroke();
      ctx.restore();
    };
    paw(-34, 31, -0.24);
    paw(34, 31, 0.24);
  }

  drawHead(ctx, time, moving) {
    const headY = -11 + Math.sin(time * 2.5 + 0.4) * 0.6;
    ctx.save();
    ctx.translate(0, headY);

    // Ears
    this.drawEar(ctx, -1);
    this.drawEar(ctx, 1);

    // Head
    const gradient = ctx.createRadialGradient(-10, -16, 5, 0, 2, 46);
    gradient.addColorStop(0, "#ffe1b4");
    gradient.addColorStop(0.6, "#ffc987");
    gradient.addColorStop(1, "#f7ad68");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 32.5, 0, 0, TAU);
    ctx.fill();

    // Forehead stripes
    ctx.save();
    ctx.strokeStyle = "#e99552";
    ctx.lineWidth = 4.1;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, -19);
    ctx.moveTo(-11, -27);
    ctx.quadraticCurveTo(-13, -22, -10, -18);
    ctx.moveTo(11, -27);
    ctx.quadraticCurveTo(13, -22, 10, -18);
    ctx.stroke();
    ctx.restore();

    // Muzzle
    ctx.fillStyle = "#fff5e5";
    ctx.beginPath();
    ctx.ellipse(0, 10.5, 19, 13.5, 0, 0, TAU);
    ctx.fill();

    this.drawEyes(ctx, time, moving);

    // Nose
    ctx.fillStyle = "#e87986";
    ctx.beginPath();
    ctx.moveTo(0, 6.4);
    ctx.quadraticCurveTo(4.6, 8.4, 2.5, 10.8);
    ctx.quadraticCurveTo(0, 12, -2.5, 10.8);
    ctx.quadraticCurveTo(-4.6, 8.4, 0, 6.4);
    ctx.fill();

    // Mouth
    if (this.catchPop > 0.12) {
      ctx.fillStyle = "#7d4c43";
      ctx.beginPath();
      ctx.ellipse(0, 17.2, 4.2, 5.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ff9dab";
      ctx.beginPath();
      ctx.ellipse(0, 19.6, 3.1, 2.1, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#8a5b4b";
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 11.5);
      ctx.quadraticCurveTo(-2.2, 15, -5.4, 13.6);
      ctx.moveTo(0, 11.5);
      ctx.quadraticCurveTo(2.2, 15, 5.4, 13.6);
      ctx.stroke();
    }

    // Whiskers
    ctx.save();
    ctx.strokeStyle = "rgba(255, 252, 242, 0.85)";
    ctx.lineWidth = 1.35;
    ctx.lineCap = "round";
    const whiskerWiggle = Math.sin(time * 2.2) * 0.6;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(side * 16, 9 + i * 4.2);
        ctx.quadraticCurveTo(
          side * 29,
          7 + i * 5 + whiskerWiggle,
          side * 40,
          6 + i * 7 + whiskerWiggle,
        );
        ctx.stroke();
      }
    }
    ctx.restore();

    // Blush
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#f7949a";
    ctx.beginPath();
    ctx.ellipse(-25, 12, 6, 3.5, -0.2, 0, TAU);
    ctx.ellipse(25, 12, 6, 3.5, 0.2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Little daisy by the left ear
    this.drawDaisy(ctx, 28, -28, time);

    ctx.restore();
  }

  drawEar(ctx, side) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.fillStyle = "#f7b06b";
    ctx.beginPath();
    ctx.moveTo(-27, -18);
    ctx.quadraticCurveTo(-35, -42, -27, -48);
    ctx.quadraticCurveTo(-15, -45, -5, -30);
    ctx.quadraticCurveTo(-17, -25, -27, -18);
    ctx.fill();
    ctx.fillStyle = "#ffd9be";
    ctx.beginPath();
    ctx.moveTo(-24, -23);
    ctx.quadraticCurveTo(-29, -38, -26, -42);
    ctx.quadraticCurveTo(-18, -38, -11, -28);
    ctx.quadraticCurveTo(-18, -26, -24, -23);
    ctx.fill();
    ctx.strokeStyle = "rgba(214, 129, 74, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  drawEyes(ctx, time, moving) {
    if (this.starEyes > 0) {
      const pulse = 0.86 + Math.sin(time * 9) * 0.14;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 15, -2);
        ctx.rotate(Math.sin(time * 3 + side) * 0.12);
        ctx.fillStyle = "#ffcf3c";
        drawStar(ctx, 0, 0, 9.6 * pulse, 4.5 * pulse, 5);
        ctx.fill();
        ctx.strokeStyle = "rgba(154, 96, 8, 0.4)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.fillStyle = "#fff8cf";
        ctx.beginPath();
        ctx.arc(-2.2, -2.6, 1.7, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    const happy = this.catchPop > 0.08;
    const blink = this.blink > 0;
    if (blink) {
      ctx.strokeStyle = "#5b4038";
      ctx.lineWidth = 2.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-15, -1, 6.5, 1.15, 1.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(15, -1, 6.5, 1.15, 1.95);
      ctx.stroke();
      return;
    }

    if (happy) {
      ctx.strokeStyle = "#5b4038";
      ctx.lineWidth = 2.9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-15, 0, 6.8, Math.PI + 0.32, TAU - 0.32);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(15, 0, 6.8, Math.PI + 0.32, TAU - 0.32);
      ctx.stroke();
      return;
    }

    const lookX = this.lookX * 1.9;
    const lookY = this.lookY * 1.7;
    for (const side of [-1, 1]) {
      const eyeX = side * 15;
      const eyeY = -2;
      ctx.fillStyle = "#4a352f";
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 7.1, 9.2, -side * 0.05, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#6b4a3d";
      ctx.beginPath();
      ctx.ellipse(eyeX + lookX * 0.25, eyeY + 1.2 + lookY * 0.2, 4.6, 6.1, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fffdf6";
      ctx.beginPath();
      ctx.arc(eyeX + lookX + 2.3, eyeY - 3.8 + lookY, 2.35, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(eyeX + lookX - 1.4, eyeY + 3 + lookY, 1.1, 0, TAU);
      ctx.fill();
    }
  }

  drawDaisy(ctx, x, y, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 1.8) * 0.12 - 0.2);
    for (let i = 0; i < 5; i += 1) {
      ctx.save();
      ctx.rotate((i / 5) * TAU);
      ctx.fillStyle = "#fffaf0";
      ctx.beginPath();
      ctx.ellipse(0, -6, 3.4, 5.2, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#ffcf5d";
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawSpeedLines(ctx, moving) {
    ctx.save();
    const angle = Math.atan2(this.dashDirY, this.dashDirX);
    ctx.rotate(angle + Math.PI / 2);
    ctx.strokeStyle = "rgba(255, 255, 245, 0.6)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (let i = -1; i <= 1; i += 1) {
      ctx.globalAlpha = 0.45 - Math.abs(i) * 0.12;
      ctx.beginPath();
      ctx.moveTo(i * 26, 65);
      ctx.lineTo(i * 31, 96 + Math.abs(i) * 9);
      ctx.stroke();
    }
    ctx.restore();
  }
}
