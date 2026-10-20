export const TAU = Math.PI * 2;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

export const rand = (min, max, random = Math.random) => min + random() * (max - min);

export const mulberry32 = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const randInt = (min, max) => Math.floor(rand(min, max + 1));

export const pick = (items, random = Math.random) =>
  items[Math.floor(random() * items.length)];

export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

export const distSq = (ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
};

export const normalizeAngle = (angle) => {
  let a = angle % TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  return a;
};

export const rotateTowards = (current, target, maxDelta) => {
  const diff = normalizeAngle(target - current);
  if (Math.abs(diff) <= maxDelta) return target;
  return current + Math.sign(diff) * maxDelta;
};

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const weightedPick = (entries, random = Math.random) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return entries[0]?.value;
  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
};

export const formatClock = (seconds) => Math.max(0, Math.ceil(seconds));

export const readNumber = (key, fallback = 0) => {
  try {
    const raw = window.localStorage.getItem(key);
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

export const readBool = (key, fallback = true) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
};

export const writeValue = (key, value) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage may be unavailable in private mode; the game still works.
  }
};

export const roundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

export const drawHeart = (ctx, x, y, size) => {
  const s = size / 16;
  ctx.beginPath();
  ctx.moveTo(x, y + 5 * s);
  ctx.bezierCurveTo(x, y, x - 8 * s, y - 2 * s, x - 8 * s, y + 4 * s);
  ctx.bezierCurveTo(x - 8 * s, y + 9 * s, x, y + 12 * s, x, y + 15 * s);
  ctx.bezierCurveTo(x, y + 12 * s, x + 8 * s, y + 9 * s, x + 8 * s, y + 4 * s);
  ctx.bezierCurveTo(x + 8 * s, y - 2 * s, x, y, x, y + 5 * s);
  ctx.closePath();
};

export const drawStar = (ctx, x, y, outer, inner, points = 4) => {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * TAU - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
};
