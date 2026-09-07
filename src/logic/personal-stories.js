import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { PERSONAL_STORIES } from "../data/personal-stories.js";
import { normalizePersonalStories } from "../core/personal-stories-state.js";
import { canInitiateMemoryContact } from "./character-memory.js";
import { romanceDailyEvent, isRomanceDailyEventCurrent, applyRomanceDailyChoice } from "./romance-daily.js";
export { normalizePersonalStories, normalizeRomanceDaily } from "../core/personal-stories-state.js";
export { romanceDailyStatus, requestRomanceDaily } from "./romance-daily.js";

const currentWeek = game => Math.max(1, Math.floor(Number(game.week) || 1));
const fill = (text, id) => (text || "").replaceAll("{name}", NPCS[id]?.name || "對方");
function progressFor(id, game) {
  return normalizePersonalStories({ [id]: game.personalStories?.[id] || {} })[id] || null;
}
function previousRoute(record) { return record.history.at(-1)?.route || null; }
function routeForEnding(record) {
  const scores = { accompany: 0, advise: 0, ignore: 0 };
  for (const item of record.history) scores[item.route]++;
  const last = previousRoute(record);
  return Object.keys(scores).sort((a, b) => scores[b] - scores[a] || Number(b === last) - Number(a === last))[0];
}
export function personalStoryStatus(id, game = state) {
  const definition = Object.hasOwn(PERSONAL_STORIES, id) ? PERSONAL_STORIES[id] : null, record = progressFor(id, game);
  if (!definition || !record || !game.knownPeople?.includes(id)) return null;
  const rel = game.relationships?.[id] || {}, week = currentWeek(game);
  const eligible = (record.chapter > 0 || (rel.closeness || 0) >= 15) && (rel.hostility || 0) < 45;
  const invitation = record.chapter === definition.invitation.chapter ? definition.invitation[previousRoute(record)] || null : null;
  const ready = record.status === "active" && eligible && record.nextWeek <= week && record.lastChoiceWeek < week;
  return {
    npcId: id, storyId: definition.id, title: definition.title,
    status: record.status, chapter: record.chapter, chapterNumber: Math.min(record.chapter + 1, definition.chapters.length),
    chapterCount: definition.chapters.length, chapterTitle: definition.chapters[record.chapter]?.title || "故事已完成",
    history: record.history, ready, nextWeek: record.nextWeek,
    canPause: record.status === "active", canResume: record.status === "paused",
    invitation: invitation ? { label: invitation.label, text: invitation.text } : null,
    ending: record.ending,
    reason: record.status === "paused" ? "已替你保留；沒有期限，想繼續時再恢復。" : record.status === "completed" ? "這段故事已留下完整記錄。" : !eligible ? "先多相處一點，等彼此能自在說話時再開始。" : !ready ? "上一段已經聊完，下一章會在之後的週次接續。" : "這一章可以繼續；也可以先保留。",
  };
}
export function pausePersonalStory(id, game = state) {
  const status = personalStoryStatus(id, game);
  if (!status?.canPause) return { ok: false, text: "這段故事目前不用再暫放。" };
  const record = progressFor(id, game);
  record.status = "paused";
  record.revision++;
  record.pausedAtWeek = currentWeek(game);
  game.personalStories = { ...(game.personalStories || {}), [id]: record };
  return { ok: true, text: "故事已保留。沒有期限，也不會因為暫放扣除關係數值。", effects: [], memoryEntries: [] };
}
export function resumePersonalStory(id, game = state) {
  const status = personalStoryStatus(id, game);
  if (!status?.canResume) return { ok: false, text: "這段故事目前不需要恢復。" };
  const record = progressFor(id, game);
  record.status = "active";
  record.revision++;
  record.resumedAtWeek = currentWeek(game);
  game.personalStories = { ...(game.personalStories || {}), [id]: record };
  return { ok: true, text: record.nextWeek > currentWeek(game) ? "已恢復，下一章仍會從之後的週次接續。" : "已恢復，可以從原來那一章繼續。", effects: [], memoryEntries: [] };
}
export function personalStoryEvent(id, game = state) {
  const status = personalStoryStatus(id, game);
  if (!status?.ready) return null;
  const definition = PERSONAL_STORIES[id], record = progressFor(id, game), chapter = definition.chapters[record.chapter];
  const payload = { kind: "personal", npcId: id, storyId: definition.id, chapter: record.chapter, revision: record.revision };
  const invitation = record.chapter === definition.invitation.chapter ? definition.invitation[previousRoute(record)] : null;
  const text = [chapter.followups[previousRoute(record)], chapter.text, invitation?.text].filter(Boolean).map(text => fill(text, id)).join("\n\n");
  const choices = [
    { id: "accompany", label: "陪對方一起走這一段", outcome: chapter.outcomes.accompany },
    { id: "advise", label: "提出一個具體的建議", outcome: chapter.outcomes.advise },
    { id: "ignore", label: "這次不參與，讓對方自行往前", outcome: chapter.outcomes.ignore },
    ...(invitation ? [{ id: "invitation", label: invitation.label, outcome: invitation.outcome }] : []),
    { id: "pause", label: "先暫放這段故事，之後由我恢復", outcome: "這一章停在原處，不推進、不扣分，也沒有需要趕上的期限。" },
  ].map(choice => ({ ...choice, effect: { personalStory: { ...payload, choice: choice.id } } }));
  return {
    id: `personal-story:${id}:${record.chapter}:${record.revision}`,
    npcId: id, kind: "人物連續故事", priority: 76, persistent: true,
    personalStory: payload,
    title: `${NPCS[id].name}｜${definition.title}・${record.chapter + 1}/${definition.chapters.length}`,
    text: `${chapter.title}\n\n${text}`, choices,
  };
}
export function tickPersonalStories(game = state) {
  const events = [];
  for (const id of game.knownPeople || []) {
    const event = personalStoryEvent(id, game);
    if (event) events.push(event);
    const daily = canInitiateMemoryContact(id, game) ? romanceDailyEvent(id, game) : null;
    if (daily) events.push(daily);
  }
  return events;
}
export function isPersonalStoryEventCurrent(event, game = state) {
  const payload = event?.personalStory || event?.choices?.find(choice => choice.effect?.personalStory)?.effect.personalStory;
  if (!payload) return true;
  if (payload.kind === "romanceDaily") return isRomanceDailyEventCurrent(event, game);
  const status = personalStoryStatus(payload.npcId, game), record = progressFor(payload.npcId, game);
  return !!status?.ready && status.storyId === payload.storyId && record.chapter === payload.chapter && record.revision === payload.revision;
}
export function applyPersonalStoryChoice(payload, game = state) {
  if (payload?.kind === "romanceDaily") return applyRomanceDailyChoice(payload, game);
  const { npcId: id, choice } = payload || {};
  const status = personalStoryStatus(id, game), record = progressFor(id, game);
  if (!status?.ready || payload.storyId !== status.storyId || payload.chapter !== record.chapter || payload.revision !== record.revision)
    return { ok: false, text: "這一章的狀態已經改變，請從人物頁重新開啟。", effects: [], memoryEntries: [] };
  if (choice === "pause") return pausePersonalStory(id, game);
  const definition = PERSONAL_STORIES[id], chapter = definition.chapters[record.chapter];
  const invitation = record.chapter === definition.invitation.chapter ? definition.invitation[previousRoute(record)] : null;
  if (!Object.hasOwn(chapter.outcomes, choice) && !(choice === "invitation" && invitation))
    return { ok: false, text: "這個邀請目前沒有解鎖。", effects: [], memoryEntries: [] };
  const route = choice === "invitation" ? previousRoute(record) : choice;
  const outcome = fill(choice === "invitation" ? invitation.outcome : chapter.outcomes[choice], id);
  const completedChapter = record.chapter;
  record.history.push({ chapter: completedChapter, choice, route, week: currentWeek(game), outcome, invitation: choice === "invitation" });
  record.chapter++;
  record.lastChoiceWeek = currentWeek(game);
  record.nextWeek = currentWeek(game) + 1;
  record.revision++;
  if (record.chapter >= definition.chapters.length) {
    record.status = "completed";
    record.ending = definition.endings[routeForEnding(record)];
  }
  game.personalStories = { ...(game.personalStories || {}), [id]: record };
  const effect = route === "accompany" ? { npc: id, relation: 3, trust: 2 } : route === "advise" ? { npc: id, relation: 1, trust: 4 } : null;
  if (effect && choice === "invitation") effect.relation++;
  return {
    ok: true, text: outcome, ending: record.ending,
    effects: effect ? [effect] : [],
    memoryEntries: [
      { npcId: id, kind: "shared", key: `personal:${definition.id}:${completedChapter}`, value: route, label: `${definition.title}・${chapter.title}`, text: outcome, source: "人物連續故事", week: currentWeek(game) },
      ...(route === "ignore" ? [] : [{ npcId: id, kind: "response", key: "support", value: route === "accompany" ? "listened" : "advised", text: outcome, source: "人物連續故事", week: currentWeek(game) }]),
    ],
  };
}
