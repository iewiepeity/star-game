import { NPC_ROMANCE_SCENES } from "../data/romance-scenes.js";
export const REPAIR_REASONS = ["neglect", "values", "betrayal"];
const week = (value, fallback = 1) => Number.isFinite(Number(value)) ? Math.max(fallback, Math.min(10000, Math.floor(Number(value)))) : fallback;
export function normalizeRomanceLife(rel) {
  rel.ceremony = ["undecided", "none", "small", "legacy"].includes(rel.ceremony) ? rel.ceremony : rel.romance === "married" ? "legacy" : "undecided";
  const raw = rel.romanceRepair;
  rel.romanceRepair = raw && REPAIR_REASONS.includes(raw.reason) ? {
    reason: raw.reason,
    sinceWeek: week(raw.sinceWeek),
    step: [0, 1, 2].includes(raw.step) ? raw.step : 0,
    startedWeek: week(raw.startedWeek, 0),
  } : rel.romance === "broken" ? { reason: "values", sinceWeek: week(rel.romanceSinceWeek), step: 0, startedWeek: 0 } : null;
  return rel;
}

// 只刷新尚未作答的舊邀請，已完成的歷史敘事保留原樣。
export function refreshMarriageInvitation(event) {
  if (!event?.id?.startsWith("npc-romance-") || !event.id.includes(":romance:engaged:") || event.romanceCopyVersion === 2) return event;
  const copy = NPC_ROMANCE_SCENES[event.npcId]?.engaged;
  if (!copy) return event;
  return { ...event, romanceCopyVersion: 2, text: copy.text, choices: (event.choices || []).map(choice => {
    if (choice.id === "later") return { ...choice, outcome: copy.later };
    if (choice.id === "yes") return { ...choice, label: copy.label, outcome: copy.yes };
    if (choice.id !== "private-vow") return choice;
    return { ...choice, label: "結婚，並辦一場只邀親友的小婚禮", note: "小型親友婚禮；不會自動公開婚訊。", special: false, requires: {}, outcome: copy.yes + " 你們另外辦了一場只邀親友的小婚禮。", effect: { ...choice.effect, romanceCeremony: "small", relation: 4, trust: 5, affection: 4 } };
  }) };
}

export function refreshQueuedMarriageInvitations(game) {
  for (const key of ["eventQueue", "queuedEvents"]) game[key] = (game[key] || []).map(item => item?.event ? { ...item, event: refreshMarriageInvitation(item.event) } : item);
  if (game.activeEvent?.event) game.activeEvent = { ...game.activeEvent, event: refreshMarriageInvitation(game.activeEvent.event) };
}
