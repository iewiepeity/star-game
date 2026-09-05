export const APP_IDS = Object.freeze(["planner","timeline","gallery","stats","people","log","world","map","jobs","creative","social","forum","wardrobe","agency","achievements","save","settings"]);
const APP_ID_SET = new Set(APP_IDS);
export const isAppId = (appId) => APP_ID_SET.has(appId === "npc" ? "people" : appId);

export function recordRecentApp(gameState, appId) {
  const normalized = appId === "npc" ? "people" : appId;
  if (!APP_ID_SET.has(normalized)) return false;
  gameState.recentAppIds = [normalized, ...(gameState.recentAppIds || []).filter((id) => id !== normalized)].slice(0, 6);
  return true;
}

export function openApp(gameState, appId, { returnContext = null, track = true, silent = false } = {}) {
  const normalized = appId === "npc" ? "people" : appId;
  if (!APP_ID_SET.has(normalized)) {
    if (!silent) gameState.notice = "這個來源目前無法開啟，已保留在原畫面。";
    return false;
  }
  if (normalized === "wardrobe") gameState.wardrobePreview = null;
  gameState.appOpen = normalized;
  gameState.appReturnContext = returnContext;
  gameState.confirmDialog = null;
  if (track) recordRecentApp(gameState, normalized);
  return true;
}
