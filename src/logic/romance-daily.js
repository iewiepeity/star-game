import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { ROMANCE_ROUTES } from "../data/romance.js";
import { romanceDailyPool, romanceDailyBond } from "../data/romance-personal-daily.js";
import { normalizeRomanceDaily } from "../core/personal-stories-state.js";
import { narrativePreferences } from "./narrative-preferences.js";
import { characterMemory } from "./character-memory.js";

const STAGES = { ambiguous: "ambiguous", dating: "dating", committed: "steady", engaged: "steady", married: "married" };
const STAGE_LABELS = { ambiguous: "曖昧相處", dating: "交往日常", steady: "穩定生活", married: "婚後日常" };
const INTERVALS = { low: 6, normal: 3, high: 1 };
const INTENSITY = { gentle: 0, normal: 1, dramatic: 2 };
const weekOf = game => Math.max(1, Math.floor(Number(game.week) || 1));
const fill = (text, id) => (text || "").replaceAll("{name}", NPCS[id]?.name || "對方");
function recordFor(id, game) { return normalizeRomanceDaily({ [id]: game.romanceDaily?.[id] || {} })[id] || null; }
function stageFor(id, game) {
  if (!Object.hasOwn(NPCS, id) || !game.knownPeople?.includes(id) || (game.relationships?.[id]?.hostility || 0) >= 45) return null;
  if (ROMANCE_ROUTES[id]?.tier === "disabled") return null;
  // The hidden route does not itself promise romance. A partner already established
  // by a supported save or route may still share ordinary partner life.
  if (ROMANCE_ROUTES[id]?.tier === "hidden" && game.partnerId !== id) return null;
  const stage = STAGES[game.relationships?.[id]?.romance];
  if (!stage || (stage !== "ambiguous" && game.partnerId !== id)) return null;
  return stage;
}
function availablePool(id, stage, game) {
  const limit = INTENSITY[narrativePreferences(game).conflictIntensity] ?? 1;
  return romanceDailyPool(id, stage).filter(scene => INTENSITY[scene.intensity] <= limit);
}
function nextScene(id, game) {
  const stage = stageFor(id, game), record = recordFor(id, game);
  if (!stage || !record) return null;
  const history = record.history.filter(item => item.stage === stage).map(item => item.sceneId);
  const pool = availablePool(id, stage, game);
  return pool.find(scene => !history.includes(scene.id)) || [...pool].sort((a, b) => history.lastIndexOf(a.id) - history.lastIndexOf(b.id))[0] || null;
}
export function romanceDailyStatus(id, game = state) {
  const stage = stageFor(id, game), record = recordFor(id, game), preferences = narrativePreferences(game);
  if (!stage || !record) return null;
  const nextWeek = record.lastWeek ? record.lastWeek + (INTERVALS[preferences.romanceFrequency] || 3) : 1;
  return {
    npcId: id, stage, stageLabel: STAGE_LABELS[stage], frequency: preferences.romanceFrequency,
    nextWeek, lastWeek: record.lastWeek, history: record.history,
    ready: preferences.romanceFrequency !== "off" && weekOf(game) >= nextWeek && record.lastWeek < weekOf(game),
    reason: preferences.romanceFrequency === "off" ? "戀愛日常目前關閉，既有關係與已安排的相處仍會保留。" : weekOf(game) < nextWeek ? "剛留下新的相處，下一段日常會在之後的週次出現。" : "有一段符合目前關係的日常可以相處。",
  };
}
function memoryOpening(id, game) {
  const memory = characterMemory(id, game);
  if (memory.boundaries?.space === "ask") return "訊息先跳出一句：『今天想不想見面？不方便就改天。』";
  if (memory.boundaries?.notice === "advance") return "這次是提前約好的時間。對方到了，先傳來一張門口的照片。";
  if (memory.disclosure === "guarded") return "對方把話停在嘴邊，先問：『現在有空聽嗎？』";
  return "";
}
export function romanceDailyEvent(id, game = state) {
  const status = romanceDailyStatus(id, game);
  if (!status?.ready) return null;
  const record = recordFor(id, game), scene = nextScene(id, game);
  if (!scene) return null;
  const payload = { kind: "romanceDaily", npcId: id, stage: status.stage, sceneId: scene.id, revision: record.revision, offeredWeek: weekOf(game) };
  const previous = record.history.at(-1);
  const memory = characterMemory(id, game);
  const nickname = memory.preferences?.["romance-nickname"];
  const echo = previous ? `你想起上回的「${romanceDailyPool(id, previous.stage).find(item => item.id === previous.sceneId)?.title || "相處"}」。${previous.outcome}` : "";
  const greeting = status.stage !== "ambiguous" && nickname && nickname !== "name" ? `『${nickname}。』對方只在你聽得到的距離這樣叫了一聲。` : "";
  const style = scene.id.startsWith("personal-") ? ({ playful: "對方先笑著補了一句：『我知道，你又準備逗我了。』", quiet: "對方把旁邊的位置留給你，沒有急著把話說滿。", direct: "對方先問起你今天過得如何，等你說完才接下去。" }[memory.preferences?.["romance-style"]] || "") : "";
  return {
    id: `romance-daily:${id}:${status.stage}:${scene.id}:${record.revision}`,
    npcId: id, kind: "戀愛日常", priority: 64, persistent: true,
    personalStory: payload,
    title: `${NPCS[id].name}｜${STAGE_LABELS[status.stage]}・${scene.title}`,
    text: [memoryOpening(id, game), greeting, echo, fill(scene.text, id), style].filter(Boolean).join("\n\n"),
    choices: scene.choices.map(choice => ({ id: choice.id, label: choice.label, outcome: fill(choice.outcome, id), effect: { personalStory: { ...payload, choice: choice.id } } })),
  };
}
export function requestRomanceDaily(id, game = state) {
  const event = romanceDailyEvent(id, game);
  return event ? { ok: true, event, text: "這段相處已準備好，可以留到彼此方便的時候繼續。" } : { ok: false, text: romanceDailyStatus(id, game)?.reason || "目前還沒有適合這段關係的戀愛日常。" };
}
function validPayload(payload, game) {
  if (payload?.kind !== "romanceDaily") return false;
  const id = payload.npcId, record = recordFor(id, game), stage = stageFor(id, game);
  return !!record && !!stage && stage === payload.stage && record.revision === payload.revision && record.lastWeek < weekOf(game) && Number.isInteger(payload.offeredWeek) && payload.offeredWeek >= 1 && payload.offeredWeek <= weekOf(game) && romanceDailyPool(id, stage).some(scene => scene.id === payload.sceneId);
}
export function isRomanceDailyEventCurrent(event, game = state) {
  const payload = event?.personalStory || event?.choices?.find(choice => choice.effect?.personalStory)?.effect.personalStory;
  // Settings affect new invitations; already accepted or queued invitations survive a later frequency change.
  return validPayload(payload, game);
}
export function applyRomanceDailyChoice(payload, game = state) {
  if (!validPayload(payload, game)) return { ok: false, text: "你們目前的相處階段已經改變，請從人物頁重新確認。", effects: [], memoryEntries: [] };
  const id = payload.npcId, record = recordFor(id, game);
  const scene = romanceDailyPool(id, payload.stage).find(scene => scene.id === payload.sceneId);
  const choice = scene.choices.find(choice => choice.id === payload.choice);
  if (!choice) return { ok: false, text: "這個相處選項不存在。", effects: [], memoryEntries: [] };
  const outcome = fill(choice.outcome, id);
  const bond = romanceDailyBond(scene, choice);
  if (game.relationships?.[id]) game.relationships[id].lastInteractionWeek = weekOf(game);
  record.history.push({ week: weekOf(game), stage: payload.stage, sceneId: scene.id, choice: choice.id, outcome, intensity: scene.intensity });
  record.history = record.history.slice(-120);
  record.lastWeek = weekOf(game);
  record.revision++;
  game.romanceDaily = { ...(game.romanceDaily || {}), [id]: record };
  return {
    ok: true, text: outcome,
    effects: [{ npc: id, ...choice.effect }],
    memoryEntries: [
      { npcId: id, kind: "shared", key: `romance:${payload.stage}:${scene.id}`, value: choice.id, label: `${STAGE_LABELS[payload.stage]}・${scene.title}`, text: outcome, source: "戀愛日常", week: weekOf(game) },
      ...(bond ? [{ npcId: id, kind: "shared", key: `bond:${bond}`, value: bond, label: scene.title, text: outcome, source: "戀愛日常", week: weekOf(game) }] : []),
      ...(choice.memory ? [{ ...choice.memory, npcId: id, source: "戀愛日常", week: weekOf(game) }] : []),
    ],
  };
}
