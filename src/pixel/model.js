import { normalizeObjectStates } from "./scene-objects.js";
import { normalizeIdentity } from "./identity.js";
import { AVATARS } from "../data/wardrobe.js";
import { initialLife, normalizeLife, recordMeeting, arriveAt } from "./life.js";
import {
  ROOMS,
  OUTFIT_IDS,
  PEOPLE,
  CONVERSATIONS,
  ACTIVITY_TYPES,
  activityAllowed,
} from "./data.js";
export const SAVE_KEY = "star-game-pixel-phase-one-v1";
export const initialPixelState = () => ({
  version: 1,
  sceneId: "home",
  position: { ...ROOMS.home.entry },
  outfitId: "newcomer",
  avatarId: "raven",
  identity: { gender: "女性", locked: false, changes: [] },
  playerName: "星途新人",
  elapsed: 0,
  visited: ["home"],
  knownPeople: [],
  npcPositions: {},
  flags: {},
  objectStates: {},
  dialogue: null,
  activity: null,
  life: initialLife(),
});
export function validatePixelState(raw) {
  if (
    !raw ||
    raw.version !== 1 ||
    !ROOMS[raw.sceneId] ||
    !OUTFIT_IDS.includes(raw.outfitId)
  )
    throw new Error("不相容的像素體驗存檔");
  const state = initialPixelState();
  state.sceneId = raw.sceneId;
  state.outfitId = raw.outfitId;
  state.avatarId = AVATARS[raw.avatarId] ? raw.avatarId : "raven";
  if (raw.position && [raw.position.x, raw.position.y].every(Number.isFinite))
    state.position = {
      x: Math.max(0, Math.min(960, raw.position.x)),
      y: Math.max(0, Math.min(640, raw.position.y)),
    };
  else state.position = { ...ROOMS[raw.sceneId].entry };
  state.playerName =
    typeof raw.playerName === "string"
      ? raw.playerName.slice(0, 16)
      : state.playerName;
  state.elapsed = Number.isFinite(raw.elapsed) ? Math.max(0, raw.elapsed) : 0;
  state.visited = [
    ...new Set([
      "home",
      raw.sceneId,
      ...(Array.isArray(raw.visited) ? raw.visited : []).filter(
        (id) => ROOMS[id],
      ),
    ]),
  ];
  state.knownPeople = (
    Array.isArray(raw.knownPeople) ? raw.knownPeople : []
  ).filter((id) => PEOPLE[id]);
  for (const flag of [
    "intro",
    "changed",
    "practiced",
    "rested",
    "coffee",
    "notice",
  ])
    if (raw.flags?.[flag] === true) state.flags[flag] = true;
  for (const id of Object.keys(PEOPLE)) {
    const pos = raw.npcPositions?.[id];
    if (
      pos &&
      ROOMS[pos.sceneId] &&
      Number.isFinite(pos.x) &&
      Number.isFinite(pos.y) &&
      pos.x >= 0 &&
      pos.x <= 960 &&
      pos.y >= 0 &&
      pos.y <= 640
    )
      state.npcPositions[id] = { sceneId: pos.sceneId, x: pos.x, y: pos.y };
  }
  const d = raw.dialogue;
  if (
    d &&
    PEOPLE[d.npcId] &&
    Number.isInteger(d.index) &&
    d.index >= 0 &&
    d.index < CONVERSATIONS[d.npcId].length
  )
    state.dialogue = {
      npcId: d.npcId,
      index: d.index,
      reply: typeof d.reply === "string" ? d.reply.slice(0, 200) : null,
    };
  const activity = raw.activity;
  if (
    activity &&
    activityAllowed(state.sceneId, activity.itemId, activity.kind) &&
    Number.isFinite(activity.elapsed)
  ) {
    state.activity = {
      kind: activity.kind,
      itemId: activity.itemId,
      elapsed: Math.max(
        0,
        Math.min(ACTIVITY_TYPES[activity.kind].duration, activity.elapsed),
      ),
    };
  }
  state.objectStates = normalizeObjectStates(raw.objectStates, ROOMS);
  state.life = normalizeLife(raw.life, state.outfitId);
  normalizeIdentity(state, raw);
  if (!state.life.game.realName && !state.life.game.stageName)
    state.life.game.realName = state.playerName;
  state.life.game.name = state.life.game.stageName || state.life.game.realName;
  for (const id of state.visited) arriveAt(state.life, id);
  if (!raw.life)
    for (const id of state.knownPeople) recordMeeting(state.life, id);
  return state;
}
export function createStorage(storage) {
  const key = (slot) =>
    slot === "auto" ? SAVE_KEY : `${SAVE_KEY}-slot-${slot}`;
  function read(slot = "auto") {
    try {
      const raw = storage.getItem(key(slot));
      if (!raw) return { state: null };
      const item = JSON.parse(raw);
      return { state: validatePixelState(item.state), savedAt: item.savedAt };
    } catch {
      return { state: null, error: "這份像素存檔無法讀取" };
    }
  }
  function write(state, slot = "auto") {
    try {
      const valid = validatePixelState(state),
        old = read(slot);
      if (old.state)
        storage.setItem(`${key(slot)}-backup`, JSON.stringify(old));
      storage.setItem(
        key(slot),
        JSON.stringify({ state: valid, savedAt: new Date().toISOString() }),
      );
      return true;
    } catch {
      return false;
    }
  }
  function backup(state) {
    try {
      storage.setItem(
        `${SAVE_KEY}-transfer-backup`,
        JSON.stringify({
          state: validatePixelState(state),
          savedAt: new Date().toISOString(),
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
  function readBackup(slot = "transfer") {
    try {
      const raw = JSON.parse(
        storage.getItem(
          slot === "transfer"
            ? `${SAVE_KEY}-transfer-backup`
            : `${key(slot)}-backup`,
        ),
      );
      return raw
        ? { state: validatePixelState(raw.state), savedAt: raw.savedAt }
        : { state: null };
    } catch {
      return { state: null, error: "備份無法讀取" };
    }
  }
  function remove(slot) {
    if (![1, 2, 3, 4, 5].includes(Number(slot))) return false;
    try {
      const raw = storage.getItem(key(slot));
      if (!raw) return false;
      storage.setItem(`${key(slot)}-deleted`, raw);
      storage.removeItem(key(slot));
      return true;
    } catch {
      return false;
    }
  }
  function deleted(slot) {
    try {
      const raw = JSON.parse(storage.getItem(`${key(slot)}-deleted`));
      return raw
        ? { state: validatePixelState(raw.state), savedAt: raw.savedAt }
        : { state: null };
    } catch {
      return { state: null };
    }
  }
  function restoreDeleted(slot) {
    const r = deleted(slot);
    if (!r.state || read(slot).state) return false;
    if (!write(r.state, slot)) return false;
    try {
      storage.removeItem(`${key(slot)}-deleted`);
    } catch {}
    return true;
  }
  return { read, write, backup, readBackup, remove, deleted, restoreDeleted };
}
export function objectives(state) {
  const game = state.life.game;
  const visits = Object.values(game.visitedLocationsByWeek).flat();
  return [
    { done: visits.includes("rehearsal"), label: "走進排練室" },
    { done: game.trainingSessionsCompleted > 0, label: "上完第一堂表演課" },
    {
      done:
        state.life.milestones?.firstWork ||
        state.life.ledger.some((r) =>
          ["tv_assistant", "newcomer_gig"].includes(r.assignment.id),
        ),
      label: "賺到第一份零工收入",
    },
    { done: state.knownPeople.length > 0, label: "認識一位城市裡的人" },
    {
      done: game.creativeProjects.some((p) => p.progress > 0),
      label: "讓一個靈感成為作品草稿",
    },
  ];
}
