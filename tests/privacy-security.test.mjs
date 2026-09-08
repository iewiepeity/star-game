import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { clearGameData, isGameStorageKey } from "../src/privacy-data.js";
import { createPixelStorage } from "../src/pixel/storage.js";
import { initialPixelState } from "../src/pixel/model.js";

const memory = (entries = []) => {
  const map = new Map(entries);
  return { get length() { return map.size; }, key: i => [...map.keys()][i],
    getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) };
};
test("storage ownership excludes other projects and similar names", () => {
  for (const key of ["star-game-save", "star-game-save-slot-1", "star-game-pixel-phase-one-v1-pending-test", "star-game-pixel-preferences-v1"]) assert.equal(isGameStorageKey(key), true);
  for (const key of ["other-project", "star-game-save2", "star-game-pixel-preferences-v10"]) assert.equal(isGameStorageKey(key), false);
});
test("erase stops old writers, clears backups/preferences and preserves unrelated data and workers", async () => {
  const indexedDB = new IDBFactory();
  const localStorage = memory([["other-project", "keep"], ["star-game-preferences", "{}"]]);
  let invalidated = 0;
  const writer = await createPixelStorage(localStorage, { indexedDB, broadcast: null, onDataDeleted: () => invalidated++ });
  const state = initialPixelState();
  await writer.write(state);
  const sessionStorage = memory([["other-session", "keep"], ["star-game-save", "old"]]);
  const deleted = [], unregistered = [];
  const registrations = [
    { scope: "https://example.com/star-game/", active: { scriptURL: "https://example.com/star-game/service-worker.js" }, unregister: async () => unregistered.push("game") },
    { scope: "https://example.com/other/", active: { scriptURL: "https://example.com/other/service-worker.js" }, unregister: async () => unregistered.push("other") },
  ];
  await clearGameData({ indexedDB, localStorage, sessionStorage,
    caches: { keys: async () => ["star-game-runtime-v1", "other-cache"], delete: async key => deleted.push(key) },
    serviceWorker: { getRegistrations: async () => registrations }, pageURL: "https://example.com/star-game/privacy.html" });
  assert.equal(invalidated, 1);
  assert.equal(writer.stageExit(state), false);
  assert.equal(await writer.write(state), false);
  assert.equal(writer.read().state, null);
  assert.equal(localStorage.length, 1);
  assert.equal(localStorage.getItem("other-project"), "keep");
  assert.equal(sessionStorage.length, 1);
  assert.deepEqual(deleted, ["star-game-runtime-v1"]);
  assert.deepEqual(unregistered, ["game"]);
  const reopened = await createPixelStorage(localStorage, { indexedDB, broadcast: null });
  assert.equal(reopened.read().state, null);
  reopened.close(); writer.close();
});
