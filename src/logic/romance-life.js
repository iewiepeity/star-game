import { state } from "../core/state.js";
import { normalizeRomanceLife, REPAIR_REASONS } from "../core/romance-life-state.js";
import { characterMemory, recordCharacterMemory } from "./character-memory.js";
import { NPCS } from "../data/npcs.js";

export const REPAIR_COPY = {
  neglect: { label: "太久沒有好好相處", plan: "承認曾把聯絡一再往後放，先約一次做得到的關心", text: "你說出那些一直沒回的訊息，沒有再拿忙當結尾。對方想先看看，你是否真的能留出時間。", need: "先在下一週或之後實際關心、傾聽對方，再來談這個約定。", bond: "care", end: "這次你沒有只傳一句改天再聊。對方記得你留下來聽完，願意再慢慢認識現在的你。" },
  values: { label: "生活方向與相處方式不合", plan: "談清楚當時不同的需要，不要求對方照自己的方式生活", text: "你把自己的期待和做不到的事攤開，也聽見對方不想再退讓的部分。你們先約好，再找一次不以復合為前提的談話。", need: "先在下一週或之後完成一次深入談心或工作交流，讓新安排有實際的相處可以對照。", bond: "private", end: "你們回頭看這次實際相處，有些差異還在，但不再只剩誰該配合誰。對方願意留一個重新認識的可能。" },
  betrayal: { label: "失信或傷害了彼此的界線", plan: "承認具體的失信，先履行一個對方願意接受的小約定", text: "你沒有要求一句道歉就換回信任。對方只願意先觀察一個小約定，也保留不再交往的決定。", need: "先提出並在下一週或之後履行一次關心約定；只增加好感或等待不能替代履約。", bond: "reliability", end: "對方提起你這次確實赴了約。傷害沒有被抹掉，但這件小事讓重新認識不再只是一句話。" },
};
export function romanceRepairStatus(id, game = state) {
  const source = game.relationships?.[id];
  if (!source || source.romance !== "broken") return null;
  const repair = normalizeRomanceLife({ ...source }).romanceRepair;
  const copy = REPAIR_COPY[repair.reason];
  const memory = characterMemory(id, game);
  const acted = repair.step > 0 && (repair.reason === "betrayal"
    ? memory.promises.some(p => p.status === "fulfilled" && p.week > repair.startedWeek)
    : memory.shared.some(p => p.week > repair.startedWeek && p.key.startsWith("bond:") && (p.value === copy.bond || (repair.reason === "values" && p.value === "work"))));
  return { ...repair, ...copy, ready: repair.step === 2, canReview: repair.step === 1 && acted && game.week > repair.startedWeek };
}
export function beginRomanceRepair(id) {
  const progress = romanceRepairStatus(id);
  if (!progress || progress.step !== 0 || !state.knownPeople.includes(id) || state.relationships[id].hostility >= 45)
    return { ok: false, reason: "目前對方還不願談這段關係，先尊重距離。" };
  state.relationships[id].romanceRepair = { reason: progress.reason, sinceWeek: progress.sinceWeek, step: 1, startedWeek: state.week };
  recordCharacterMemory(id, { kind: "shared", key: "romance-repair:plan", value: progress.reason, label: "先把當時的事說清楚", text: progress.text });
  return { ok: true, text: `${progress.text}${progress.need}` };
}
export function reviewRomanceRepair(id) {
  const progress = romanceRepairStatus(id);
  if (!progress?.canReview || state.relationships[id].hostility >= 45) return { ok: false, reason: progress?.need || "目前沒有待確認的修復約定。" };
  state.relationships[id].romanceRepair.step = 2;
  recordCharacterMemory(id, { kind: "shared", key: "romance-repair:review", value: progress.reason, label: "看見這次做到了什麼", text: progress.end });
  return { ok: true, text: `${progress.end}這不會直接恢復伴侶關係，雙方仍需重新決定。` };
}
export function inferBreakupReason(source, rel) {
  if (REPAIR_REASONS.includes(source)) return source;
  if (/失信|背叛|劈腿|洩露|界線|傷害/.test(source) || rel.hostility >= 45) return "betrayal";
  if (/忽略|失聯|沒有聯絡|疏遠/.test(source)) return "neglect";
  return "values";
}
export function chooseRomanceCeremony(id, choice) {
  const rel = state.relationships?.[id];
  if (!rel || rel.romance !== "married" || state.partnerId !== id || !["none", "small"].includes(choice)) return { ok: false, reason: "先由雙方決定結婚，再商量儀式。" };
  normalizeRomanceLife(rel);
  if (rel.ceremony === choice || rel.ceremony === "small" || rel.ceremony === "legacy") return { ok: false, reason: "這份婚姻已有儀式記錄，不重複舉辦或覆寫。" };
  rel.ceremony = choice;
  const text = choice === "small" ? `你和${NPCS[id].name}一起列出真正想邀請的親友，辦了一場小婚禮。沒有直播，婚訊仍照原本的公開設定。` : `你和${NPCS[id].name}決定暫時不辦儀式，留一頓只有彼此的晚餐。日後想補辦時仍可以再商量，婚訊不會因此公開。`;
  recordCharacterMemory(id, { kind: "shared", key: "marriage:ceremony", value: choice, label: "我們選的儀式", text });
  return { ok: true, text };
}
export function romanceCommitmentRecall(id, game = state) {
  const memory = characterMemory(id, game);
  const entry = [...memory.shared].reverse().find(item => item.key.startsWith("bond:") && item.text);
  const repair = [...memory.shared].reverse().find(item => item.key === "romance-repair:review");
  const selected = game.relationships?.[id]?.romance === "broken" ? repair : entry;
  return selected ? `你們聊起那次「${selected.label || "相處"}」。${selected.text}` : "";
}
