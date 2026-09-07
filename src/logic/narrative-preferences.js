import { ACTIONS } from "../data/actions.js";
import { state } from "../core/state.js";
import { normalizeNarrativeSettings, normalizeRoutineNarrativeHistory } from "../core/narrative-settings-state.js";
export { normalizeNarrativeSettings, normalizeRoutineNarrativeHistory };

export function narrativePreferences(game = state) {
  return normalizeNarrativeSettings(game?.narrativeSettings);
}
// Only presentation uses this helper. Saved events, choices and outcomes stay
// complete, and the reader can expand the original passage at any time.
export function narrativeText(text, game = state) {
  const full = String(text || "").replace(/<[^>]*>/g, " ").trim();
  if (narrativePreferences(game).textMode !== "concise") return full;
  const sentences = full.match(/[^。！？]+[。！？]?/g) || [full];
  if (sentences.length <= 2) return full;
  return `${sentences[0].trim()} ${sentences.at(-1).trim()}`;
}
export function routineNarrativeId(moment) {
  let hash = 2166136261;
  for (const char of `${moment?.title || ""}\n${moment?.text || ""}\n${moment?.outcome || ""}`)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return `routine:${moment?.id || moment?.title || "moment"}:${hash.toString(36)}`;
}
export function routineWasRead(moment, game = state) {
  return normalizeRoutineNarrativeHistory(game.routineNarrativeHistory).includes(routineNarrativeId(moment));
}
export function markRoutineRead(moments, game = state) {
  game.routineNarrativeHistory = normalizeRoutineNarrativeHistory([
    ...normalizeRoutineNarrativeHistory(game.routineNarrativeHistory),
    ...(moments || []).map(routineNarrativeId),
  ]);
}
export function canSkipRoutineResult(result, game = state) {
  if (!narrativePreferences(game).skipReadRoutine || !result?.success || result.presentation || game.endingResult || game.activeEvent || game.eventOutcome) return false;
  const choice = result.assignment?.choice;
  const implicitFocus = choice === "focus" && ["train", "rest", "work", "life"].includes(ACTIONS[result.assignment?.id]?.type) && result.assignment?.id !== "free";
  if (!result.moments?.length || (choice && !implicitFocus) || result.assignment?.taskId || result.assignment?.npcId || result.assignment?.appointmentId) return false;
  if (game.forcedRestWeek > game.week || (result.notes || []).some(note => /休養|解鎖|初次|第一次|新人物|約定|邀約|來訊|機會/.test(note))) return false;
  return result.moments.every(moment => moment.routine === true && !moment.important && !moment.hasChoices && !moment.followUp && moment.readBefore === true);
}
