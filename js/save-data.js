import { getProfile, replaceProfile } from "./progress.js";
import {
  exportPreferences,
  replacePreferences,
} from "./preferences.js";

const APP_ID = "neko-fish";
const SAVE_VERSION = 3;
const MAX_SAVE_LENGTH = 1_000_000;

export function buildSaveText() {
  return JSON.stringify(
    {
      app: APP_ID,
      version: SAVE_VERSION,
      exportedAt: new Date().toISOString(),
      profile: getProfile(),
      preferences: exportPreferences(),
    },
    null,
    2,
  );
}

export async function importSaveText(text) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error("存档内容为空。");
  }
  if (text.length > MAX_SAVE_LENGTH) {
    throw new Error("存档文件太大，无法读取。");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("这不是有效的 JSON 存档。");
  }

  if (!data || data.app !== APP_ID || !data.profile || typeof data.profile !== "object") {
    throw new Error("这不是喵喵捞鱼记的存档。");
  }
  if (Number(data.version) > SAVE_VERSION) {
    throw new Error("存档版本太新，请先更新游戏。");
  }

  const profile = await replaceProfile(data.profile);
  if (data.preferences && typeof data.preferences === "object") {
    replacePreferences(data.preferences);
  }
  return profile;
}

export { APP_ID, SAVE_VERSION };
