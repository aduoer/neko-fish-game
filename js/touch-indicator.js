import { CONFIG } from "./config.js";
import { TAU } from "./utils.js";

export function drawTouchIndicator(ctx, state) {
  const point = state.touchPoint;
  if (!point || state.mode !== "playing") return;
  const targetY = point.y - CONFIG.touchOffset;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 252, 240, 0.85)";
  ctx.fillStyle = "rgba(255, 252, 240, 0.12)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, 17, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255, 252, 240, 0.4)";
  ctx.beginPath();
  ctx.moveTo(point.x, point.y - 19);
  ctx.lineTo(point.x, targetY + 5);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 248, 221, 0.92)";
  ctx.beginPath();
  ctx.arc(point.x, targetY, 3.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}
