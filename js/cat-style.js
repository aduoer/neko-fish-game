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
  }
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
