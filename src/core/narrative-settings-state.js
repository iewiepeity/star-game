export function normalizeNarrativeSettings(raw) {
  return {
    textMode: ["full", "concise"].includes(raw?.textMode) ? raw.textMode : "full",
    skipReadRoutine: raw?.skipReadRoutine === true,
    romanceFrequency: ["off", "low", "normal", "high"].includes(raw?.romanceFrequency) ? raw.romanceFrequency : "normal",
    conflictIntensity: ["gentle", "normal", "dramatic"].includes(raw?.conflictIntensity) ? raw.conflictIntensity : "normal",
    storyReminders: raw?.storyReminders !== false,
  };
}

export function normalizeRoutineNarrativeHistory(raw) {
  return [...new Set((Array.isArray(raw) ? raw : []).filter(x => typeof x === "string" && x.length < 180))].slice(-1200);
}
