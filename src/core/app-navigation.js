const APP_IDS = new Set(["planner","timeline","gallery","stats","people","log","world","map","jobs","creative","social","forum","wardrobe","agency","achievements","save","settings"]);

export function recordRecentApp(gameState, appId) {
  const normalized = appId === "npc" ? "people" : appId;
  if (!APP_IDS.has(normalized)) return false;
  gameState.recentAppIds = [normalized, ...(gameState.recentAppIds || []).filter((id) => id !== normalized)].slice(0, 6);
  return true;
}

export function openApp(gameState, appId, { returnContext = null, track = true } = {}) {
  const normalized = appId === "npc" ? "people" : appId;
  if (!APP_IDS.has(normalized)) return false;
  gameState.appOpen = normalized;
  gameState.appReturnContext = returnContext;
  gameState.confirmDialog = null;
  if (track) recordRecentApp(gameState, normalized);
  return true;
}
