import { PERSONAL_STORIES } from "../data/personal-stories.js";
import { ROMANCE_DAILY_STORIES } from "../data/romance-daily-stories.js";
import { NPCS } from "../data/npcs.js";

const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const copy = value => typeof value === "string" ? value.slice(0, 2400) : "";
export function normalizePersonalStories(raw) {
  const normalized = {};
  for (const [npcId, source] of Object.entries(object(raw))) {
    const definition = Object.hasOwn(PERSONAL_STORIES, npcId) ? PERSONAL_STORIES[npcId] : null;
    if (!definition) continue;
    const input = object(source), history = [];
    for (const item of Array.isArray(input.history) ? input.history : []) {
      const record = object(item), chapter = count(record.chapter);
      if (chapter >= definition.chapters.length || !["accompany", "advise", "ignore", "invitation"].includes(record.choice) || history.some(entry => entry.chapter === chapter)) continue;
      const route = ["accompany", "advise", "ignore"].includes(record.route) ? record.route : record.choice === "invitation" ? "accompany" : record.choice;
      history.push({ chapter, choice: record.choice, route, week: count(record.week), outcome: copy(record.outcome), invitation: record.invitation === true });
    }
    history.sort((a, b) => a.chapter - b.chapter);
    const chapter = Math.min(definition.chapters.length, Math.max(count(input.chapter), history.length ? history.at(-1).chapter + 1 : 0));
    const lastChoiceWeek = Math.max(count(input.lastChoiceWeek), ...history.map(entry => entry.week));
    normalized[npcId] = {
      storyId: definition.id,
      chapter,
      status: chapter >= definition.chapters.length ? "completed" : input.status === "paused" ? "paused" : "active",
      history,
      lastChoiceWeek,
      nextWeek: Math.max(count(input.nextWeek), lastChoiceWeek ? lastChoiceWeek + 1 : 0),
      revision: count(input.revision),
      pausedAtWeek: count(input.pausedAtWeek),
      resumedAtWeek: count(input.resumedAtWeek),
      ending: copy(input.ending),
    };
  }
  return normalized;
}
export function normalizeRomanceDaily(raw) {
  const normalized = {};
  for (const [npcId, source] of Object.entries(object(raw))) {
    if (!Object.hasOwn(NPCS, npcId)) continue;
    const input = object(source), history = [];
    for (const item of Array.isArray(input.history) ? input.history : []) {
      const record = object(item);
      const scene = Object.hasOwn(ROMANCE_DAILY_STORIES, record.stage) ? ROMANCE_DAILY_STORIES[record.stage].find(scene => scene.id === record.sceneId) : null;
      if (!scene?.choices.some(choice => choice.id === record.choice)) continue;
      const week = count(record.week);
      if (history.some(entry => entry.week === week)) continue;
      history.push({ week, stage: record.stage, sceneId: scene.id, choice: record.choice, outcome: copy(record.outcome), intensity: scene.intensity });
    }
    history.sort((a, b) => a.week - b.week);
    normalized[npcId] = {
      lastWeek: Math.max(count(input.lastWeek), ...history.map(entry => entry.week)),
      revision: count(input.revision),
      history: history.slice(-120),
    };
  }
  return normalized;
}
