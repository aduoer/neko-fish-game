// Cosmetics are pure data so the shop, cat, pond and share card stay in sync.
export const RING_SKINS = Object.freeze([
  Object.freeze({
    id: "sakura",
    name: "樱花泳圈",
    price: 0,
    pattern: "stripe",
    colors: {
      main: "#ff8ea3",
      dark: "#e85f7c",
      light: "#ffb7c4",
      accent: "#fff0d9",
      shade: "rgba(176, 45, 72, 0.24)",
      water: "rgba(217, 77, 110, 0.2)",
      rim: "rgba(255, 255, 245, 0.42)",
    },
  }),
  Object.freeze({
    id: "mint",
    name: "薄荷泳圈",
    price: 120,
    pattern: "dots",
    colors: {
      main: "#79dfc5",
      dark: "#36a894",
      light: "#b7f6e7",
      accent: "#fff9e7",
      shade: "rgba(24, 115, 105, 0.24)",
      water: "rgba(40, 150, 137, 0.2)",
      rim: "rgba(255, 255, 245, 0.46)",
    },
  }),
  Object.freeze({
    id: "lemon",
    name: "柠檬泳圈",
    price: 180,
    pattern: "stars",
    colors: {
      main: "#ffd35f",
      dark: "#e1a52f",
      light: "#ffe9a1",
      accent: "#fffdf0",
      shade: "rgba(151, 106, 10, 0.22)",
      water: "rgba(198, 150, 34, 0.18)",
      rim: "rgba(255, 255, 250, 0.5)",
    },
  }),
  Object.freeze({
    id: "lagoon",
    name: "泻湖泳圈",
    price: 260,
    pattern: "waves",
    colors: {
      main: "#62bfe6",
      dark: "#3388b9",
      light: "#a9e5f7",
      accent: "#eaffff",
      shade: "rgba(22, 91, 128, 0.24)",
      water: "rgba(31, 119, 159, 0.2)",
      rim: "rgba(247, 255, 255, 0.48)",
    },
  }),
  Object.freeze({
    id: "galaxy",
    name: "星夜泳圈",
    price: 380,
    pattern: "stars",
    colors: {
      main: "#8274dc",
      dark: "#5346a9",
      light: "#beb5ff",
      accent: "#ffe895",
      shade: "rgba(43, 33, 115, 0.3)",
      water: "rgba(64, 50, 146, 0.24)",
      rim: "rgba(255, 248, 222, 0.5)",
    },
  }),
  Object.freeze({
    id: "queen",
    name: "鱼王泳圈",
    price: 520,
    pattern: "stripe",
    colors: {
      main: "#ffd05d",
      dark: "#d79222",
      light: "#fff0b0",
      accent: "#ff8e8f",
      shade: "rgba(137, 86, 9, 0.24)",
      water: "rgba(186, 120, 19, 0.2)",
      rim: "rgba(255, 255, 235, 0.58)",
    },
  }),
]);

export const POND_SKINS = Object.freeze([
  Object.freeze({
    id: "meadow",
    name: "晴日池塘",
    price: 0,
    swatch: Object.freeze(["#9cecd9", "#63d0c8", "#3fb1c0", "#2d98b2"]),
    theme: Object.freeze({
      gradient: Object.freeze(["#9cecd9", "#63d0c8", "#3fb1c0", "#2d98b2"]),
      light: "rgba(255, 255, 235, 0.55)",
      lightSoft: "rgba(226, 255, 245, 0.18)",
      wave: "255, 255, 244",
      sparkle: "#f4fff8",
      petalColors: Object.freeze(["#ffd4dc", "#ffe9de"]),
      lily: Object.freeze(["#69bd85", "#58ae7d", "#7bcb8f"]),
      lilyShade: "rgba(20, 92, 82, 0.14)",
      reed: Object.freeze(["#3f8d64", "#579f70"]),
      reedHead: "#4a3428",
      flower: Object.freeze(["#fff6f1", "#ffd3db"]),
      vignette: "rgba(5, 51, 61, 0.28)",
    }),
  }),
  Object.freeze({
    id: "sunset",
    name: "蜜桃落日",
    price: 200,
    swatch: Object.freeze(["#ffd4ad", "#f4a7a0", "#d97994", "#9b5f8f"]),
    theme: Object.freeze({
      gradient: Object.freeze(["#ffd9b5", "#f5b0a6", "#dc8596", "#a76791"]),
      light: "rgba(255, 250, 224, 0.5)",
      lightSoft: "rgba(255, 232, 218, 0.2)",
      wave: "255, 248, 238",
      sparkle: "#fff7df",
      petalColors: Object.freeze(["#ffe0cb", "#ffd0dd"]),
      lily: Object.freeze(["#75b38b", "#8dc696", "#6aa87e"]),
      lilyShade: "rgba(98, 55, 84, 0.18)",
      reed: Object.freeze(["#6b8d62", "#879e6e"]),
      reedHead: "#664637",
      flower: Object.freeze(["#fff4e5", "#ffc9bd"]),
      vignette: "rgba(77, 37, 67, 0.3)",
    }),
  }),
  Object.freeze({
    id: "sakura",
    name: "樱花水镜",
    price: 300,
    swatch: Object.freeze(["#ffe7ef", "#f8c4d5", "#de9fc1", "#af7eab"]),
    theme: Object.freeze({
      gradient: Object.freeze(["#ffe8f0", "#f5c5d7", "#de9fc2", "#b27fae"]),
      light: "rgba(255, 255, 245, 0.58)",
      lightSoft: "rgba(255, 240, 247, 0.22)",
      wave: "255, 253, 250",
      sparkle: "#fff7fb",
      petalColors: Object.freeze(["#ffd6e2", "#fff0f4"]),
      lily: Object.freeze(["#7ebd96", "#8fcca2", "#6eaf88"]),
      lilyShade: "rgba(95, 53, 92, 0.14)",
      reed: Object.freeze(["#5d9a71", "#75af84"]),
      reedHead: "#66453f",
      flower: Object.freeze(["#fff7fa", "#ffc6d8"]),
      vignette: "rgba(91, 43, 83, 0.26)",
    }),
  }),
  Object.freeze({
    id: "night",
    name: "星月夜池",
    price: 420,
    swatch: Object.freeze(["#29456f", "#1d5b7b", "#1c476c", "#111f43"]),
    theme: Object.freeze({
      gradient: Object.freeze(["#294d78", "#21637f", "#1c4e70", "#111f43"]),
      light: "rgba(190, 232, 255, 0.36)",
      lightSoft: "rgba(150, 212, 255, 0.12)",
      wave: "207, 241, 255",
      sparkle: "#fff0a8",
      petalColors: Object.freeze(["#d5e2ff", "#b9c6f2"]),
      lily: Object.freeze(["#3c7f7e", "#4c9188", "#34716e"]),
      lilyShade: "rgba(1, 19, 39, 0.3)",
      reed: Object.freeze(["#2f6758", "#3f7967"]),
      reedHead: "#2b2229",
      flower: Object.freeze(["#fff2cf", "#d7d2ff"]),
      vignette: "rgba(3, 12, 31, 0.42)",
    }),
  }),
  Object.freeze({
    id: "arctic",
    name: "极光冰池",
    price: 560,
    swatch: Object.freeze(["#d9fbff", "#8ee7ef", "#59c4dd", "#3278b3"]),
    theme: Object.freeze({
      gradient: Object.freeze(["#e2fdff", "#9beaf1", "#5dc8df", "#3279b4"]),
      light: "rgba(255, 255, 255, 0.6)",
      lightSoft: "rgba(219, 255, 255, 0.24)",
      wave: "255, 255, 255",
      sparkle: "#ffffff",
      petalColors: Object.freeze(["#eaffff", "#d8f5ff"]),
      lily: Object.freeze(["#66b5b3", "#7bc8c3", "#519d9e"]),
      lilyShade: "rgba(20, 83, 112, 0.14)",
      reed: Object.freeze(["#4d9b91", "#62afa3"]),
      reedHead: "#315a62",
      flower: Object.freeze(["#ffffff", "#d8f6ff"]),
      vignette: "rgba(12, 55, 91, 0.3)",
    }),
  }),
]);

export const DEFAULT_RING = "sakura";
export const DEFAULT_POND = "meadow";

export function getRingSkin(id) {
  return RING_SKINS.find((skin) => skin.id === id) ?? RING_SKINS[0];
}

export function getPondSkin(id) {
  return POND_SKINS.find((skin) => skin.id === id) ?? POND_SKINS[0];
}

export function ringById(id) {
  return getRingSkin(id);
}

export function pondById(id) {
  return getPondSkin(id);
}
