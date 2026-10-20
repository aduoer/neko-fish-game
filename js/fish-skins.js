// Visual variants for each fish type. Gameplay stats stay in FISH_TYPES.
export const FISH_SKINS = Object.freeze({
  sardine: Object.freeze([
    {
      id: "azure",
      label: "蓝小青",
      size: 1,
      colors: {
        body: "#7bd2f2", belly: "#eafcff", accent: "#3d9acb",
        stripe: "#54b4de", fin: "rgba(104, 207, 238, 0.72)",
      },
      shape: { nose: 1.34, height: 0.74, shoulder: 0.95 },
      tail: { style: "fork", size: 1, spread: 0.8 },
      dorsal: 1,
      pattern: "stripe",
      eye: "normal",
    },
    {
      id: "lagoon",
      label: "青柠小青",
      size: 1.04,
      colors: {
        body: "#76e2c5", belly: "#edfffa", accent: "#249b87",
        stripe: "#46c7ae", fin: "rgba(105, 224, 197, 0.72)",
      },
      shape: { nose: 1.3, height: 0.78, shoulder: 0.9 },
      tail: { style: "fork", size: 0.94, spread: 0.86 },
      dorsal: 1,
      pattern: "freckles",
      freckles: 5,
      eye: "normal",
    },
    {
      id: "silver",
      label: "银光小青",
      size: 0.96,
      colors: {
        body: "#d3ddf0", belly: "#fbfdff", accent: "#7e90b5",
        stripe: "#aebbd8", fin: "rgba(186, 202, 230, 0.72)",
      },
      shape: { nose: 1.4, height: 0.68, shoulder: 1 },
      tail: { style: "fork", size: 1.08, spread: 0.72 },
      dorsal: 1,
      pattern: "sideStripe",
      eye: "normal",
    },
  ]),

  koi: Object.freeze([
    {
      id: "kohaku",
      label: "红白锦鲤",
      size: 1,
      colors: {
        body: "#fff4e8", belly: "#fffaf4", accent: "#e7765e",
        stripe: "#ff9a83", fin: "rgba(255, 180, 158, 0.72)",
        patch: "rgba(244, 105, 83, 0.9)", patch2: "rgba(255, 255, 250, 0.7)",
      },
      shape: { nose: 1.3, height: 0.86, shoulder: 0.82 },
      tail: { style: "fan", size: 1, spread: 0.88 },
      dorsal: 1,
      pattern: "patches",
      patches: [
        { x: -0.48, y: -0.3, rx: 0.48, ry: 0.42, rot: -0.35, color: "patch" },
        { x: 0.36, y: 0.24, rx: 0.4, ry: 0.32, rot: 0.5, color: "patch" },
        { x: -0.1, y: -0.62, rx: 0.22, ry: 0.16, rot: 0.2, color: "patch" },
      ],
      eye: "normal",
    },
    {
      id: "tancho",
      label: "丹顶锦鲤",
      size: 0.96,
      colors: {
        body: "#fffdf7", belly: "#ffffff", accent: "#d95f52",
        stripe: "#ff9b8d", fin: "rgba(247, 205, 196, 0.82)",
        patch: "rgba(231, 76, 65, 0.92)", patch2: "rgba(255, 255, 255, 0.65)",
      },
      shape: { nose: 1.24, height: 0.9, shoulder: 0.8 },
      tail: { style: "fan", size: 0.94, spread: 0.94 },
      dorsal: 1,
      pattern: "crown",
      eye: "normal",
    },
    {
      id: "sanke",
      label: "三色锦鲤",
      size: 1.06,
      colors: {
        body: "#fff8ec", belly: "#ffffff", accent: "#e07052",
        stripe: "#ffb09b", fin: "rgba(255, 199, 179, 0.74)",
        patch: "rgba(240, 116, 74, 0.9)", patch2: "rgba(57, 54, 64, 0.82)",
      },
      shape: { nose: 1.34, height: 0.84, shoulder: 0.86 },
      tail: { style: "fork", size: 1.14, spread: 0.76 },
      dorsal: 1,
      pattern: "patches",
      freckles: 4,
      patches: [
        { x: -0.54, y: -0.22, rx: 0.42, ry: 0.38, rot: -0.5, color: "patch" },
        { x: 0.26, y: -0.42, rx: 0.3, ry: 0.26, rot: 0.2, color: "patch2" },
        { x: 0.22, y: 0.4, rx: 0.34, ry: 0.26, rot: -0.3, color: "patch" },
        { x: -0.18, y: 0.18, rx: 0.18, ry: 0.14, rot: 0.4, color: "patch2" },
      ],
      eye: "normal",
    },
    {
      id: "shiro",
      label: "墨白锦鲤",
      size: 1.02,
      colors: {
        body: "#f6f7fa", belly: "#ffffff", accent: "#68748c",
        stripe: "#aeb6c7", fin: "rgba(205, 214, 230, 0.8)",
        patch: "rgba(57, 61, 76, 0.86)", patch2: "rgba(255, 255, 255, 0.55)",
      },
      shape: { nose: 1.28, height: 0.88, shoulder: 0.84 },
      tail: { style: "veil", size: 1.08, spread: 0.82 },
      dorsal: 1,
      pattern: "patches",
      patches: [
        { x: -0.36, y: -0.4, rx: 0.4, ry: 0.3, rot: -0.2, color: "patch" },
        { x: 0.4, y: 0.28, rx: 0.28, ry: 0.36, rot: 0.35, color: "patch" },
      ],
      eye: "normal",
    },
  ]),

  gold: Object.freeze([
    {
      id: "orange",
      label: "橙金鱼",
      size: 1,
      colors: {
        body: "#ffb449", belly: "#fff0c9", accent: "#d98616",
        stripe: "#ffc968", fin: "rgba(255, 188, 92, 0.8)",
        aura: "#ffe58a", patch: "rgba(255, 142, 59, 0.55)",
      },
      shape: { nose: 1.06, height: 1, shoulder: 0.6 },
      tail: { style: "fan", size: 1, spread: 1 },
      dorsal: 1,
      pattern: "scales",
      eye: "normal",
    },
    {
      id: "ranchu",
      label: "红白兰寿",
      size: 1.08,
      colors: {
        body: "#fff6ea", belly: "#ffffff", accent: "#e2674f",
        stripe: "#ff9d8e", fin: "rgba(255, 219, 207, 0.88)",
        aura: "#ffd2c9", patch: "rgba(239, 98, 79, 0.9)",
      },
      shape: { nose: 0.98, height: 1.04, shoulder: 0.48 },
      tail: { style: "fan", size: 0.78, spread: 1.05 },
      dorsal: 0,
      pattern: "patches",
      patches: [
        { x: -0.36, y: -0.36, rx: 0.42, ry: 0.34, rot: -0.3, color: "patch" },
        { x: 0.3, y: 0.3, rx: 0.34, ry: 0.26, rot: 0.4, color: "patch" },
      ],
      eye: "normal",
    },
    {
      id: "dragon",
      label: "黑龙睛",
      size: 1.02,
      colors: {
        body: "#4b4358", belly: "#8b819b", accent: "#241f31",
        stripe: "#6f657f", fin: "rgba(92, 80, 113, 0.74)",
        aura: "#cbb8ff", patch: "rgba(255, 255, 255, 0.08)",
      },
      shape: { nose: 1.02, height: 0.98, shoulder: 0.55 },
      tail: { style: "veil", size: 1.18, spread: 0.95 },
      dorsal: 1,
      pattern: "scales",
      eye: "telescope",
    },
    {
      id: "bubble",
      label: "水泡眼",
      size: 1.05,
      colors: {
        body: "#ffd98a", belly: "#fff8dd", accent: "#dfa12c",
        stripe: "#ffe6a8", fin: "rgba(255, 215, 150, 0.8)",
        aura: "#ffeab2", patch: "rgba(255, 166, 99, 0.5)",
      },
      shape: { nose: 1, height: 1.02, shoulder: 0.52 },
      tail: { style: "fan", size: 0.9, spread: 1 },
      dorsal: 1,
      pattern: "scales",
      scales: 3,
      eye: "bubble",
    },
    {
      id: "butterfly",
      label: "蝶尾金鱼",
      size: 0.98,
      colors: {
        body: "#ff8d5c", belly: "#ffe1cd", accent: "#c95632",
        stripe: "#ffb28e", fin: "rgba(255, 151, 102, 0.76)",
        aura: "#ffd0a8", patch: "rgba(255, 220, 190, 0.35)",
      },
      shape: { nose: 1.1, height: 0.92, shoulder: 0.62 },
      tail: { style: "veil", size: 1.25, spread: 1.1 },
      dorsal: 1,
      pattern: "freckles",
      freckles: 4,
      eye: "normal",
    },
  ]),

  king: Object.freeze([
    {
      id: "king",
      label: "鱼王",
      size: 1,
      colors: {
        body: "#ffd35c", belly: "#fff7ce", accent: "#bd7814",
        stripe: "#f1b52a", fin: "rgba(255, 201, 74, 0.82)",
        aura: "#fff2a8", patch: "rgba(255, 139, 104, 0.55)",
      },
      shape: { nose: 1.2, height: 0.98, shoulder: 0.74 },
      tail: { style: "fan", size: 1.12, spread: 1 },
      dorsal: 1,
      pattern: "scales",
      eye: "normal",
    },
  ]),
});

export function skinsFor(type) {
  return FISH_SKINS[type] ?? FISH_SKINS.sardine;
}

export function pickSkin(type, random = Math.random) {
  const skins = skinsFor(type);
  return skins[Math.floor(random() * skins.length)];
}

export function findSkin(type, id) {
  return skinsFor(type).find((skin) => skin.id === id) ?? skinsFor(type)[0];
}
