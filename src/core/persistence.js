import { assertGameState } from "./save-schema.js";
import { migrateSaveState } from "./migrations.js";
const AUTO_KEY = "star-game-save";
const MANUAL_PREFIX = "star-game-save-slot-";
const LEGACY_MANUAL_KEY = "star-game-save-manual";
const BACKUP_KEY = "star-game-save-backup";
const RECENT_MANUAL_KEY = "star-game-save-recent-manual";
export const SAVE_VERSION = 15;
export const SAVE_SLOT_COUNT = 5;
export const AUTO_SAVE_DELAY = 300;
const SUPPORTED_SAVE_VERSIONS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
]);
let autoSaveTimer = null,
  pendingAutoState = null,
  lastCheckpoint = "";
export const TRANSIENT_STATE_KEYS = Object.freeze([
  "appOpen",
  "appCloseConfirm",
  "dockEditing",
  "dockDraftIds",
  "dockNotice",
  "saveNotice",
  "saveConfirm",
  "wardrobeNotice",
  "socialNotice",
  "jobQuery",
  "jobSort",
  "jobStatusFilter",
  "peopleQuery",
  "peopleSection",
  "appQuery",
  "appCategory",
  "appReturnContext",
  "creativeDraftTitle",
  "timelineQuery",
  "gallerySelection",
  "selectedNpc",
  "selectedJobId",
  "forumThread",
  "notice",
]);
export function persistableState(state) {
  const snapshot = structuredClone(state);
  for (const key of TRANSIENT_STATE_KEYS) delete snapshot[key];
  return snapshot;
}
function migrateEnvelope(parsed) {
  if (!parsed || !SUPPORTED_SAVE_VERSIONS.has(parsed.v) || !parsed.state)
    return null;
  const migrated = migrateSaveState(parsed.state, parsed.v);
  return { ...parsed, v: migrated.version, state: migrated.state };
}
function readRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return migrateEnvelope(JSON.parse(raw));
  } catch {
    return null;
  }
}
function writeRaw(key, state, label = "") {
  try {
    assertGameState(state);
    const snapshot = persistableState(state);
    localStorage.setItem(
      key,
      JSON.stringify({
        game: "star-game",
        v: SAVE_VERSION,
        state: snapshot,
        savedAt: Date.now(),
        label,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
function meta(slot, data) {
  return data
    ? {
        slot,
        savedAt: data.savedAt,
        week: data.state.week,
        name: data.state.name,
        label: data.label || "",
        version: data.v,
      }
    : null;
}
function checkpoint(state) {
  return [
    state?.screen,
    state?.week,
    state?.runnerDay,
    state?.runnerPhase,
    state?.activeEvent?.event?.id || state?.activeEvent?.id || "",
  ].join(":");
}
export function saveState(state) {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = null;
  pendingAutoState = null;
  lastCheckpoint = checkpoint(state);
  return writeRaw(AUTO_KEY, state, "自動存檔");
}
export function flushSaveState() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = null;
  const target = pendingAutoState;
  pendingAutoState = null;
  return target ? saveState(target) : true;
}
export function scheduleSaveState(
  state,
  { delay = AUTO_SAVE_DELAY, force = false } = {},
) {
  // Keep the live state reference until the debounce expires. writeRaw creates the
  // immutable snapshot once, avoiding a full game-state clone on every render.
  pendingAutoState = state;
  const next = checkpoint(state),
    critical = !lastCheckpoint || next !== lastCheckpoint;
  if (force || critical) return flushSaveState();
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => flushSaveState(), Math.max(0, delay));
  return true;
}
export function loadState() {
  return readRaw(AUTO_KEY)?.state || null;
}
export function autoSaveMeta() {
  return meta("auto", readRaw(AUTO_KEY));
}
export function manualSlotKey(slot) {
  return `${MANUAL_PREFIX}${slot}`;
}
export function saveManualSlot(slot, state, label = "") {
  if (slot < 1 || slot > SAVE_SLOT_COUNT) return false;
  if (!archiveManualSlot(slot, "overwrite")) return false;
  return writeRaw(manualSlotKey(slot), state, label);
}
export function loadManualSlot(slot) {
  return readRaw(manualSlotKey(slot))?.state || null;
}
export function manualSlotMetas() {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) =>
    meta(index + 1, readRaw(manualSlotKey(index + 1))),
  );
}
export function deleteManualSlot(slot) {
  try {
    if (!archiveManualSlot(slot, "delete")) return false;
    localStorage.removeItem(manualSlotKey(slot));
    return true;
  } catch {
    return false;
  }
}
function archiveManualSlot(slot, action) {
  try {
    const saved = readRaw(manualSlotKey(slot));
    if (!saved?.state) return action === "overwrite";
    localStorage.setItem(
      RECENT_MANUAL_KEY,
      JSON.stringify({ ...saved, sourceSlot: slot, action }),
    );
    return true;
  } catch {
    return false;
  }
}
export function recentManualMeta() {
  const saved = readRaw(RECENT_MANUAL_KEY);
  return saved
    ? {
        ...meta(saved.sourceSlot, saved),
        action: saved.action,
        sourceSlot: saved.sourceSlot,
      }
    : null;
}
export function restoreRecentManualSlot() {
  try {
    const saved = readRaw(RECENT_MANUAL_KEY),
      slot = Number(saved?.sourceSlot);
    if (!saved?.state || slot < 1 || slot > SAVE_SLOT_COUNT) return false;
    const current = readRaw(manualSlotKey(slot));
    const { sourceSlot: _sourceSlot, action: _action, ...restored } = saved;
    localStorage.setItem(manualSlotKey(slot), JSON.stringify(restored));
    if (current?.state)
      localStorage.setItem(
        RECENT_MANUAL_KEY,
        JSON.stringify({ ...current, sourceSlot: slot, action: "overwrite" }),
      );
    else localStorage.removeItem(RECENT_MANUAL_KEY);
    return slot;
  } catch {
    return false;
  }
}
export function backupCurrent(state, label = "自動備份") {
  return writeRaw(BACKUP_KEY, state, label);
}
export function backupLastAutoSave(label = "錯誤發生前的安全備份") {
  try {
    const saved = readRaw(AUTO_KEY);
    if (!saved?.state) return false;
    return writeRaw(BACKUP_KEY, saved.state, label);
  } catch {
    return false;
  }
}
export function loadBackup() {
  return readRaw(BACKUP_KEY)?.state || null;
}
export function backupMeta() {
  return meta("backup", readRaw(BACKUP_KEY));
}
export function exportSave(state) {
  assertGameState(state);
  return JSON.stringify(
    {
      game: "star-game",
      v: SAVE_VERSION,
      exportedAt: Date.now(),
      state: persistableState(state),
    },
    null,
    2,
  );
}
export function parseImportedSave(text) {
  const raw = JSON.parse(text),
    parsed = migrateEnvelope(raw);
  if (parsed?.game !== "star-game" || !parsed.state)
    throw new Error("不是可支援的《星途未定》存檔");
  assertGameState(parsed.state);
  return parsed.state;
}
export function migrateLegacyManualSlot() {
  try {
    if (localStorage.getItem(manualSlotKey(1))) return;
    const legacy = readRaw(LEGACY_MANUAL_KEY);
    if (legacy)
      localStorage.setItem(
        manualSlotKey(1),
        JSON.stringify({ ...legacy, v: SAVE_VERSION, label: "舊版手動存檔" }),
      );
  } catch {}
}
export const saveManualState = (state) => saveManualSlot(1, state);
export const loadManualState = () => loadManualSlot(1);
export const manualSaveMeta = () => manualSlotMetas()[0];
