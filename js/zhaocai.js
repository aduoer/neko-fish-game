import { TAU, clamp, drawStar } from "./utils.js";

// Q-version portrait of the silver tabby in the reference photos: a big fluffy
// head, white blaze and muzzle, warm nose bridge and bright blue eyes.
const C = Object.freeze({
  furLight: "#faf8f4",
  furMid: "#c9cdcd",
  furDark: "#8f9597",
  cap: "#a6aaaa",
  ear: "#a9acac",
  earInner: "#efc3c0",
  stripe: "#62696c",
  blaze: "#fffdf9",
  bridge: "#c8ab8f",
  nose: "#b97883",
  eye: "#67c4e9",
  irisDark: "#2b526b",
  pupil: "#1c3546",
  blush: "#ef9fa7",
  collar: "#d95963",
  collarDark: "#b64151",
  coin: "#f6ca4f",
  coinDark: "#b77c18",
  coinLight: "#fff2ad",
});

function ellipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
}

function drawTail(ctx, time) {
  const sway = Math.sin(time * 2.2) * 0.08;
  ctx.save();
  ctx.translate(-21, 38);
  ctx.rotate(-0.32 + sway);
  ctx.lineCap = "round";
  ctx.strokeStyle = C.furMid;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-27, 0, -45, -17, -44, -41);
  ctx.stroke();
  ctx.strokeStyle = C.furLight;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.bezierCurveTo(-24, 2, -37, -14, -38, -33);
  ctx.stroke();
  ctx.strokeStyle = C.stripe;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-43, -35);
  ctx.lineTo(-44, -43);
  ctx.stroke();
  ctx.restore();
}

function drawBody(ctx, time) {
  ctx.save();
  ctx.translate(0, 43 + Math.sin(time * 3.2) * 1.2);

  ctx.fillStyle = C.furMid;
  ellipse(ctx, 0, 2, 31, 27);
  ctx.fill();

  ctx.fillStyle = C.blaze;
  ellipse(ctx, 0, 2, 20, 23);
  ctx.fill();

  // Little front paws tucked in front of the body.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 18, 18);
    ctx.rotate(side * 0.12);
    ctx.fillStyle = C.furLight;
    ellipse(ctx, 0, 0, 11, 8.5);
    ctx.fill();
    ctx.strokeStyle = "rgba(111, 118, 120, 0.25)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(111, 118, 120, 0.34)";
    ctx.beginPath();
    ctx.moveTo(-3.5, -3);
    ctx.lineTo(-3.5, 2.2);
    ctx.moveTo(0, -3.4);
    ctx.lineTo(0, 2.8);
    ctx.moveTo(3.5, -3);
    ctx.lineTo(3.5, 2.2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawEar(ctx, side, time) {
  ctx.save();
  ctx.scale(side, 1);
  const twitch = Math.sin(time * 2.5 + side) * 0.025;

  ctx.save();
  ctx.rotate(twitch);
  ctx.fillStyle = C.ear;
  ctx.beginPath();
  ctx.moveTo(-32, -19);
  ctx.quadraticCurveTo(-41, -50, -31, -62);
  ctx.quadraticCurveTo(-9, -55, 1, -33);
  ctx.quadraticCurveTo(-14, -28, -32, -19);
  ctx.fill();

  ctx.fillStyle = C.earInner;
  ctx.beginPath();
  ctx.moveTo(-27, -26);
  ctx.quadraticCurveTo(-33, -46, -28, -54);
  ctx.quadraticCurveTo(-16, -46, -8, -33);
  ctx.quadraticCurveTo(-18, -31, -27, -26);
  ctx.fill();

  ctx.strokeStyle = "rgba(252, 253, 251, 0.86)";
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-30, -54);
  ctx.lineTo(-34, -63);
  ctx.moveTo(-25, -53);
  ctx.lineTo(-27, -60);
  ctx.moveTo(-18, -45);
  ctx.lineTo(-17, -50);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = C.cap;
  ctx.beginPath();
  ctx.moveTo(-32, -19);
  ctx.quadraticCurveTo(-39, -35, -31, -50);
  ctx.quadraticCurveTo(-22, -44, -15, -30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFluff(ctx) {
  ctx.save();
  ctx.fillStyle = C.furMid;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 34, -3);
    ctx.quadraticCurveTo(side * 49, 0, side * 43, 12);
    ctx.quadraticCurveTo(side * 38, 6, side * 33, 10);
    ctx.quadraticCurveTo(side * 35, 17, side * 28, 21);
    ctx.quadraticCurveTo(side * 30, 8, side * 34, -3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCollar(ctx) {
  ctx.save();
  ctx.strokeStyle = C.collarDark;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 28, 25, 0.32, Math.PI - 0.32);
  ctx.stroke();
  ctx.strokeStyle = C.collar;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 28, 25, 0.32, Math.PI - 0.32);
  ctx.stroke();

  ctx.fillStyle = C.coinDark;
  ellipse(ctx, 0, 50, 8.4, 8.4);
  ctx.fill();
  ctx.fillStyle = C.coin;
  ellipse(ctx, 0, 49, 7.4, 7.4);
  ctx.fill();
  ctx.fillStyle = "rgba(183, 124, 24, 0.9)";
  ctx.fillRect(-2.1, 46.9, 4.2, 4.2);
  ctx.fillStyle = C.coinLight;
  ellipse(ctx, -2.5, 46.9, 2, 1.35, -0.55);
  ctx.fill();
  ctx.strokeStyle = "rgba(99, 60, 20, 0.42)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(0, 44);
  ctx.stroke();
  ctx.restore();
}

function drawFace(ctx, time, options) {
  const blink = clamp(options.blink ?? 0, 0, 1);
  const joy = Boolean(options.joy);
  const look = clamp(options.look ?? 0, -1, 1);

  // Gray cap and white blaze.
  ctx.fillStyle = C.cap;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.moveTo(-37, -12);
  ctx.quadraticCurveTo(-40, -43, 0, -43);
  ctx.quadraticCurveTo(40, -43, 37, -12);
  ctx.quadraticCurveTo(23, -20, 14, -24);
  ctx.quadraticCurveTo(0, -17, -14, -24);
  ctx.quadraticCurveTo(-23, -20, -37, -12);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = C.blaze;
  ctx.beginPath();
  ctx.moveTo(-10, -44);
  ctx.quadraticCurveTo(-3, -26, -11, -2);
  ctx.quadraticCurveTo(-14, 12, 0, 17);
  ctx.quadraticCurveTo(14, 12, 11, -2);
  ctx.quadraticCurveTo(3, -26, 10, -44);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = C.bridge;
  ctx.globalAlpha = 0.92;
  ellipse(ctx, 0, 4, 9.4, 8);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = C.stripe;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-18, -35);
  ctx.quadraticCurveTo(-14, -27, -17, -19);
  ctx.moveTo(18, -35);
  ctx.quadraticCurveTo(14, -27, 17, -19);
  ctx.moveTo(-8, -41);
  ctx.quadraticCurveTo(-6, -32, -9, -25);
  ctx.moveTo(8, -41);
  ctx.quadraticCurveTo(6, -32, 9, -25);
  ctx.moveTo(0, -42);
  ctx.lineTo(0, -29);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // White muzzle and chin.
  ctx.fillStyle = C.blaze;
  ellipse(ctx, -8, 17, 12, 9.5, -0.08);
  ctx.fill();
  ellipse(ctx, 8, 17, 12, 9.5, 0.08);
  ctx.fill();
  ellipse(ctx, 0, 23, 13, 7);
  ctx.fill();

  for (const side of [-1, 1]) {
    const eyeX = side * 14;
    const eyeY = -2;
    const squint = joy ? 0.22 : 0;
    ctx.save();
    ctx.translate(eyeX + look * 1.4, eyeY);

    ctx.fillStyle = C.irisDark;
    ellipse(ctx, 0, 0, 8.6 * (1 - squint), 10.2 * (1 - squint));
    ctx.fill();

    if (blink > 0.5) {
      ctx.strokeStyle = C.pupil;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 3, 7, Math.PI + 0.35, TAU - 0.35);
      ctx.stroke();
    } else {
      ctx.fillStyle = C.eye;
      ellipse(ctx, look * 0.9, 0.5, 6.1, 7.9 * (1 - squint));
      ctx.fill();
      ctx.fillStyle = C.pupil;
      ellipse(ctx, look * 1.3, 1, 2.1, 6.1);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ellipse(ctx, -2.1 + look, -3.1, 2.25, 2.7, -0.2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
      ellipse(ctx, 2 + look, 4.1, 1.2, 1.35);
      ctx.fill();
    }
    ctx.restore();
  }

  // Nose and the tiny smiling mouth.
  ctx.fillStyle = C.nose;
  ctx.beginPath();
  ctx.moveTo(0, 11.5);
  ctx.quadraticCurveTo(4.2, 13.6, 2.2, 16);
  ctx.quadraticCurveTo(0, 17, -2.2, 16);
  ctx.quadraticCurveTo(-4.2, 13.6, 0, 11.5);
  ctx.fill();
  ctx.strokeStyle = C.pupil;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 16.3);
  ctx.quadraticCurveTo(-2, 19.5, -5.2, 18.2);
  ctx.moveTo(0, 16.3);
  ctx.quadraticCurveTo(2, 19.5, 5.2, 18.2);
  ctx.stroke();

  ctx.globalAlpha = 0.62;
  ctx.fillStyle = C.blush;
  ellipse(ctx, -27, 15, 6.2, 3.6, -0.18);
  ctx.fill();
  ellipse(ctx, 27, 15, 6.2, 3.6, 0.18);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.25;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(side * 16, 17 + i * 4);
      ctx.quadraticCurveTo(
        side * 32,
        15 + i * 7 + Math.sin(time * 2.4 + side) * 0.7,
        side * 46,
        13 + i * 8,
      );
      ctx.stroke();
    }
  }

  if (options.sparkle) {
    for (const [x, y, size] of [
      [-33, -30, 3.6],
      [31, -25, 2.7],
      [-38, 4, 2.2],
    ]) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(time * 5 + x) * 0.25;
      ctx.fillStyle = C.coinLight;
      drawStar(ctx, x, y, size, size * 0.42, 5);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawZhaocaiHead(ctx, time = 0, options = {}) {
  drawEar(ctx, -1, time);
  drawEar(ctx, 1, time);

  const gradient = ctx.createRadialGradient(-10, -17, 5, 0, 0, 46);
  gradient.addColorStop(0, C.furLight);
  gradient.addColorStop(0.62, C.furMid);
  gradient.addColorStop(1, C.furDark);
  ctx.fillStyle = gradient;
  ellipse(ctx, 0, 0, 39, 36);
  ctx.fill();

  drawFluff(ctx);
  drawFace(ctx, time, options);
}

/**
 * Draw the full-bodied helper used by 招财突击. The origin is the head centre.
 */
export function drawZhaocai(ctx, time = 0, options = {}) {
  const scale = options.scale ?? 1;
  const flip = options.flip ?? 1;
  const bob = Math.sin(time * 4.4) * 2.2;

  ctx.save();
  ctx.scale(flip * scale, scale);
  ctx.translate(0, bob);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#074953";
  ellipse(ctx, 3, 72, 45, 10);
  ctx.fill();
  ctx.restore();

  drawTail(ctx, time);
  drawBody(ctx, time);
  drawZhaocaiHead(ctx, time, options);
  drawCollar(ctx);

  // A few floating lucky stars orbit the helper.
  for (let i = 0; i < 4; i += 1) {
    const angle = time * 1.8 + i * 1.9;
    const radius = 53 + Math.sin(time * 2.2 + i) * 5;
    const x = Math.cos(angle) * radius;
    const y = -9 + Math.sin(angle) * radius * 0.58;
    ctx.save();
    ctx.globalAlpha = 0.42 + Math.sin(time * 4 + i) * 0.22;
    ctx.fillStyle = i % 2 === 0 ? C.coinLight : "#fffdf0";
    drawStar(ctx, x, y, 3.1 + (i % 2) * 1.2, 1.4, 5);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Paint the small HUD portrait. The canvas is 192px backed by a 96px design
 * coordinate space, so it stays crisp on high-DPI phones.
 */
export function drawZhaocaiPortrait(canvas, time = 1.1) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = canvas.width / 96;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(48, 57);
  ctx.scale(0.92, 0.92);
  drawZhaocaiHead(ctx, time, { sparkle: true });
  ctx.restore();
}

export const ZHAOCAI_COLORS = C;
