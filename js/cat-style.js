import { TAU, drawStar } from "./utils.js";

const COSMIC_STARS = Object.freeze([
  Object.freeze([-21, -20, 2.8]),
  Object.freeze([9, -25, 2]),
  Object.freeze([27, -6, 1.6]),
  Object.freeze([-13, 10, 1.4]),
  Object.freeze([6, 17, 1.1]),
]);

const PATTERN_DRAWERS = new Map([
  ["tabby", (ctx, colors) => drawTabby(ctx, colors, false)],
  ["shaded", (ctx, colors) => drawTabby(ctx, colors, true)],
  ["tuxedo", drawTuxedo],
  ["calico", drawCalico],
  ["point", drawPoint],
  ["cosmic", drawCosmic],
  ["fortune", drawFortune],
]);

export function drawHeadPattern(ctx, catSkin) {
  const drawer = PATTERN_DRAWERS.get(catSkin.pattern);
  if (!drawer) return;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 35.6, 32.1, 0, 0, TAU);
  ctx.clip();
  drawer(ctx, catSkin.colors);
  ctx.restore();
}

function drawTabby(ctx, c, shaded) {
  ctx.strokeStyle = c.stripe;
  ctx.lineWidth = shaded ? 3.2 : 4.1;
  ctx.lineCap = "round";
  ctx.globalAlpha = shaded ? 0.28 : 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(0, -19);
  ctx.moveTo(-11, -27);
  ctx.quadraticCurveTo(-13, -22, -10, -18);
  ctx.moveTo(11, -27);
  ctx.quadraticCurveTo(13, -22, 10, -18);
  for (let side = -1; side <= 1; side += 2) {
    ctx.moveTo(side * 23, -16);
    ctx.quadraticCurveTo(side * 30, -10, side * 34, -4);
    ctx.moveTo(side * 25, -7);
    ctx.quadraticCurveTo(side * 31, -2, side * 33, 4);
  }
  ctx.stroke();
}

function drawTuxedo(ctx, c) {
  ctx.fillStyle = c.patch;
  ctx.beginPath();
  ctx.ellipse(0, -28, 38, 26, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(19, -3, 12, 15, -0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.muzzle;
  ctx.beginPath();
  ctx.moveTo(0, -49);
  ctx.quadraticCurveTo(-7, -32, 0, -13);
  ctx.quadraticCurveTo(7, -32, 0, -49);
  ctx.fill();
}

function drawCalico(ctx, c) {
  ctx.fillStyle = c.patch2;
  ctx.beginPath();
  ctx.ellipse(-21, -15, 17, 16, -0.2, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-26, 8, 9, 8, -0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.patch;
  ctx.beginPath();
  ctx.ellipse(19, -19, 17, 15, 0.25, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(24, 8, 11, 9, 0.2, 0, TAU);
  ctx.fill();
}

function drawPoint(ctx, c) {
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = c.patch;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 23, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.ellipse(0, -26, 13, 12, 0, 0, TAU);
  ctx.fill();
}

function drawCosmic(ctx, c) {
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = c.patch;
  ctx.beginPath();
  ctx.ellipse(17, -13, 20, 18, 0.2, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = c.stripe;
  for (const [x, y, size] of COSMIC_STARS) {
    drawStar(ctx, x, y, size, size * 0.45, 5);
    ctx.fill();
  }
}

function drawFortune(ctx, c) {
  // Silver cap, white blaze and a warm nose-bridge patch echo the real cat.
  ctx.fillStyle = c.ear;
  ctx.globalAlpha = 0.94;
  ctx.beginPath();
  ctx.ellipse(0, -25, 39, 23, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-31, 0, 11, 18, 0.18, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(31, 0, 11, 18, -0.18, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = c.muzzle;
  ctx.beginPath();
  ctx.moveTo(-10, -43);
  ctx.quadraticCurveTo(-3, -18, -12, 7);
  ctx.quadraticCurveTo(0, 17, 12, 7);
  ctx.quadraticCurveTo(3, -18, 10, -43);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = c.patch;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, -2, 10, 8.5, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = c.stripe;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-18, -34);
  ctx.quadraticCurveTo(-14, -26, -17, -18);
  ctx.moveTo(18, -34);
  ctx.quadraticCurveTo(14, -26, 17, -18);
  ctx.moveTo(-8, -40);
  ctx.quadraticCurveTo(-6, -30, -9, -23);
  ctx.moveTo(8, -40);
  ctx.quadraticCurveTo(6, -30, 9, -23);
  ctx.moveTo(0, -41);
  ctx.lineTo(0, -28);
  ctx.stroke();

  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(side * 27, -12);
    ctx.quadraticCurveTo(side * 33, -7, side * 32, -1);
    ctx.moveTo(side * 29, 2);
    ctx.quadraticCurveTo(side * 34, 7, side * 32, 12);
    ctx.stroke();
  }
}

export function drawFaceExtra(ctx, catSkin, time) {
  if (catSkin.faceExtra === "shades") drawShades(ctx, time);
}

export function drawCheekFluff(ctx, catSkin) {
  const c = catSkin.colors;
  ctx.save();
  ctx.fillStyle = c.furMid;
  ctx.globalAlpha = 0.72;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(side * 30, 2);
    ctx.quadraticCurveTo(side * 40, 6, side * 36, 14);
    ctx.quadraticCurveTo(side * 32, 9, side * 27, 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawAccessory(ctx, catSkin, x, y, time) {
  const { extra, extraColor } = catSkin;
  if (extra === "daisy") {
    drawDaisy(ctx, x, y, time, extraColor);
  } else if (extra === "bow") {
    drawBow(ctx, x, y, time, extraColor);
  } else if (extra === "star") {
    drawStarCharm(ctx, x, y, time, extraColor);
  } else if (extra === "leaf") {
    drawLeaf(ctx, x, y, time, extraColor);
  } else if (extra === "coin") {
    drawCoinCharm(ctx, x, y, time, extraColor);
  }
}

function drawShades(ctx, time) {
  // A pair of aviator shades with a warm gold bridge and a slow lens glint.
  const glint = 0.24 + Math.sin(time * 2.4) * 0.08;
  ctx.save();

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 15, -2);
    ctx.rotate(side * 0.045);
    const lens = ctx.createLinearGradient(-8, -9, 8, 8);
    lens.addColorStop(0, "#4b5b5f");
    lens.addColorStop(0.35, "#243338");
    lens.addColorStop(1, "#11191d");
    ctx.fillStyle = lens;
    ctx.strokeStyle = "rgba(34, 29, 24, 0.95)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, -0.4, 11.7, 9.2, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(190, 245, 235, ${glint})`;
    ctx.lineWidth = 1.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7.6, 2.2);
    ctx.lineTo(0.5, -6.2);
    ctx.stroke();

    ctx.fillStyle = "#d8b16a";
    ctx.beginPath();
    ctx.arc(side * 11.8, -1.8, 1.35, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(34, 29, 24, 0.95)";
  ctx.lineWidth = 2.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, -4.6);
  ctx.quadraticCurveTo(0, -1.8, 8, -4.6);
  ctx.stroke();

  ctx.strokeStyle = "#c9a25c";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(-6.4, -4.1);
  ctx.quadraticCurveTo(0, -2.2, 6.4, -4.1);
  ctx.stroke();

  ctx.strokeStyle = "rgba(32, 27, 22, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, -7.2);
  ctx.lineTo(-33.5, -10.2);
  ctx.moveTo(26, -7.2);
  ctx.lineTo(33.5, -10.2);
  ctx.stroke();

  ctx.fillStyle = "#d8b16a";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * 26.4, -7.4, 1.2, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function drawBow(ctx, x, y, time, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 1.8) * 0.1 - 0.16);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(-5.2, -0.8, 5.8, 4.2, -0.42, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5.2, -0.8, 5.8, 4.2, 0.42, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(83, 38, 47, 0.28)";
  ctx.beginPath();
  ctx.arc(0, -0.4, 2.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawStarCharm(ctx, x, y, time, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 1.6) * 0.16 + 0.18);
  ctx.fillStyle = color;
  drawStar(ctx, 0, 0, 6.6, 3, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(112, 77, 26, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(-1.6, -1.8, 1.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCoinCharm(ctx, x, y, time, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 1.7) * 0.14 + 0.12);
  ctx.strokeStyle = "#c56f45";
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, -2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(145, 91, 18, 0.48)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 4.4, 6.6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#b47b1c";
  ctx.fillRect(-1.9, 2.5, 3.8, 3.8);
  ctx.fillStyle = "rgba(255, 253, 220, 0.75)";
  ctx.beginPath();
  ctx.arc(-2.2, 1.5, 1.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawLeaf(ctx, x, y, time, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 1.7) * 0.12 - 0.25);
  ctx.strokeStyle = "#5d8b47";
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.quadraticCurveTo(-1, 0, 0, -5);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(2.6, -5.3, 4.4, 2.6, -0.55, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawDaisy(ctx, x, y, time, color) {
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
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 2.8, 0, TAU);
  ctx.fill();
  ctx.restore();
}
