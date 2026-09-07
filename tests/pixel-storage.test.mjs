import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { initialPixelState, SAVE_KEY } from "../src/pixel/model.js";
import { createPixelStorage } from "../src/pixel/storage.js";

function legacy(values = []) {
  const map = new Map(values);
  return {
    map,
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i],
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}
const open = (store, factory = new IDBFactory()) =>
  createPixelStorage(store, { indexedDB: factory, broadcast: null });
const encoded = (state) =>
  JSON.stringify({ state, savedAt: "2026-09-07T00:00:00Z" });

test("migration commits all slots, backups and deletions before releasing only matching legacy values", async () => {
  const state = initialPixelState(),
    entries = [];
  for (const suffix of [
    "",
    "-backup",
    "-transfer-backup",
    ...[1, 2, 3, 4, 5].flatMap((n) => [
      `-slot-${n}`,
      `-slot-${n}-backup`,
      `-slot-${n}-deleted`,
    ]),
  ])
    entries.push([SAVE_KEY + suffix, encoded(state)]);
  const old = legacy([...entries, ["unrelated", "keep"]]);
  const factory = new IDBFactory(),
    storage = await open(old, factory);
  for (const n of [1, 2, 3, 4, 5]) {
    assert.ok(storage.read(n).state);
    assert.ok(storage.readBackup(n).state);
    assert.ok(storage.deleted(n).state);
  }
  assert.ok(storage.readBackup().state);
  assert.deepEqual([...old.map], [["unrelated", "keep"]]);
  // Re-seeding the retired key cannot overwrite the authoritative database.
  old.setItem(SAVE_KEY, encoded({ ...state, playerName: "stale" }));
  storage.close();
  const reopened = await open(old, factory);
  assert.equal(reopened.read().state.playerName, state.playerName);
  assert.ok(old.map.has(SAVE_KEY));
  reopened.close();
});

test("a corrupt primary cannot be overwritten until explicit recovery, which quarantines raw data and preserves backup", async () => {
  const state = initialPixelState();
  state.playerName = "recover me";
  const old = legacy([
    [SAVE_KEY, "{broken"],
    [SAVE_KEY + "-backup", encoded(state)],
  ]);
  const factory = new IDBFactory(),
    storage = await open(old, factory);
  assert.ok(storage.read().error);
  assert.equal(await storage.write(initialPixelState()), false);
  assert.equal(storage.raw(), "{broken");
  assert.equal(await storage.replace(state, null, { recover: true }), true);
  assert.equal(storage.read().state.playerName, "recover me");
  assert.equal(storage.readBackup("auto").state.playerName, "recover me");
  await storage.write(state);
  assert.equal(storage.raw(), "{broken");
  storage.close();
  const reopened = await open(old, factory);
  assert.equal(reopened.raw(), "{broken");
  reopened.close();
});

test("concurrent writers compare revisions atomically even without BroadcastChannel", async () => {
  const old = legacy(),
    factory = new IDBFactory(),
    first = await open(old, factory),
    second = await open(old, factory);
  const a = initialPixelState(),
    b = initialPixelState();
  a.playerName = "A";
  b.playerName = "B";
  const results = await Promise.all([first.write(a), second.write(b)]);
  assert.equal(results.filter(Boolean).length, 1);
  const winner = results[0] ? first : second,
    loser = results[0] ? second : first;
  assert.equal(loser.conflicted, true);
  assert.equal(await loser.write(b, 1), false);
  assert.equal(await loser.backup(b), false);
  assert.equal(await loser.refresh(), true);
  assert.equal(loser.read().state.playerName, winner.read().state.playerName);
  first.close();
  second.close();
});

test("failed primary writes roll back backup and cached data together", async () => {
  const storage = await open(legacy()),
    state = initialPixelState();
  await storage.write(state, 1);
  state.playerName = "second";
  await storage.write(state, 1);
  const before = storage.read(1),
    backup = storage.readBackup(1);
  const put = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = function (value, key) {
      if (key === SAVE_KEY + "-slot-1") throw new Error("quota");
      return put.call(this, value, key);
    };
    state.playerName = "failed";
    assert.equal(await storage.write(state, 1), false);
  } finally {
    IDBObjectStore.prototype.put = put;
  }
  assert.deepEqual(storage.read(1), before);
  assert.deepEqual(storage.readBackup(1), backup);
  storage.close();
});

test("replacement, transfer backup and primary save are one transaction", async () => {
  const storage = await open(legacy()),
    before = initialPixelState();
  before.playerName = "before";
  await storage.write(before);
  const next = initialPixelState();
  next.playerName = "next";
  assert.equal(await storage.replace(next, before), true);
  assert.equal(storage.read().state.playerName, "next");
  assert.equal(storage.readBackup().state.playerName, "before");
  assert.equal(storage.readBackup("auto").state.playerName, "before");
  storage.close();
});

test("queued saves capture the requested state before later edits", async () => {
  const storage = await open(legacy()),
    state = initialPixelState();
  state.playerName = "one";
  const first = storage.write(state, 1);
  state.playerName = "two";
  const second = storage.write(state, 2);
  state.playerName = "unsaved";
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(storage.read(1).state.playerName, "one");
  assert.equal(storage.read(2).state.playerName, "two");
  storage.close();
});

test("unavailable IndexedDB preserves legacy data and reports actual failure", async () => {
  const old = legacy([[SAVE_KEY, encoded(initialPixelState())]]);
  const storage = await createPixelStorage(old, {
    indexedDB: null,
    broadcast: null,
  });
  assert.equal(storage.available, false);
  assert.ok(storage.read().state);
  assert.equal(await storage.write(initialPixelState(), 1), false);
  assert.ok(storage.error);
  assert.ok(old.map.has(SAVE_KEY));
});

test("unload journals recover newer memory even if an older queued transaction commits afterward", async () => {
  const old = legacy(),
    factory = new IDBFactory(),
    storage = await open(old, factory);
  const state = initialPixelState();
  await storage.write(state);
  state.playerName = "queued";
  const pending = storage.write(state);
  state.playerName = "at unload";
  assert.equal(storage.stageExit(state), true);
  await pending;
  storage.close();
  const reopened = await open(old, factory);
  assert.equal(reopened.read().state.playerName, "at unload");
  assert.ok(reopened.startupNotice);
  assert.equal(
    [...old.map.keys()].filter((k) => k.includes("-pending-")).length,
    0,
  );
  reopened.close();
});

test("stale unload journals are archived for explicit recovery instead of replacing another writer", async () => {
  const old = legacy([[SAVE_KEY, encoded(initialPixelState())]]),
    factory = new IDBFactory();
  const a = await open(old, factory),
    b = await open(old, factory),
    state = initialPixelState();
  state.playerName = "new winner";
  await b.write(state);
  state.playerName = "old tab";
  assert.equal(a.stageExit(state), true);
  a.close();
  b.close();
  const reopened = await open(old, factory);
  assert.equal(reopened.read().state.playerName, "new winner");
  assert.equal(reopened.sessionCopies()[0].state.playerName, "old tab");
  reopened.close();
});

test("a newer acknowledged checkpoint retires the page's emergency journal", async () => {
  const old = legacy(),
    storage = await open(old),
    state = initialPixelState();
  await storage.write(state);
  assert.equal(storage.stageExit(state), true);
  state.playerName = "after return";
  await storage.write(state);
  assert.equal(
    [...old.map.keys()].filter((k) => k.includes("-pending-")).length,
    0,
  );
  assert.equal(storage.read().state.playerName, "after return");
  storage.close();
});
