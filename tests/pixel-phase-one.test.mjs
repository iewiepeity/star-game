import { test } from "node:test";
import assert from "node:assert/strict";
import { ROOMS, PEOPLE, itinerary } from "../src/pixel/data.js";
import { buildGrid, findPath, footClear } from "../src/pixel/navigation.js";
import {
  createStorage,
  initialPixelState,
  validatePixelState,
  SAVE_KEY,
} from "../src/pixel/model.js";
for (const [id, room] of Object.entries(ROOMS))
  test(`${id}: every object and NPC route is reachable without crossing furniture`, () => {
    const grid = buildGrid(room);
    for (const target of [
      ...room.objects.map((o) => o.target),
      ...room.route,
    ]) {
      const path = findPath(grid, room.entry, target);
      assert.ok(path.length > 0);
      assert.ok(
        Math.hypot(path.at(-1).x - target.x, path.at(-1).y - target.y) < 18,
      );
      let previous = room.entry;
      for (const step of path) {
        assert.ok(
          step.x === previous.x || step.y === previous.y,
          "walking sprites must never travel diagonally",
        );
        for (let t = 0; t <= 1; t += 0.1)
          assert.ok(
            footClear(room, {
              x: previous.x + (step.x - previous.x) * t,
              y: previous.y + (step.y - previous.y) * t,
            }),
          );
        previous = step;
      }
    }
  });
test("home: crossing the central table takes a detour", () => {
  const path = findPath(
    buildGrid(ROOMS.home),
    { x: 348, y: 438 },
    { x: 564, y: 402 },
  );
  assert.ok(path.length > 0);
  assert.ok(path.some((p) => p.y < 360 || p.y > 468));
});
test("off-grid starts keep every route segment cardinal", () => {
  for (const room of Object.values(ROOMS)) {
    const start = { x: room.entry.x + 1.7, y: room.entry.y - 0.6 };
    for (const object of room.objects) {
      const path = findPath(buildGrid(room), start, object.target);
      assert.ok(path.length > 0);
      let previous = start;
      for (const next of path) {
        assert.ok(next.x === previous.x || next.y === previous.y);
        previous = next;
      }
    }
  }
});
test("legacy pixel saves load without activities; only room-compatible poses resume", () => {
  const state = initialPixelState();
  delete state.activity;
  assert.equal(validatePixelState(state).activity, null);
  const rest = { itemId: "bed", kind: "rest", elapsed: 2.25 };
  assert.deepEqual(
    validatePixelState({ ...state, activity: rest }).activity,
    rest,
  );
  assert.deepEqual(
    validatePixelState({ ...state, activity: { ...rest, elapsed: 900 } })
      .activity,
    { ...rest, elapsed: 5 },
  );
  for (const activity of [
    { ...rest, kind: "dance" },
    { ...rest, itemId: "missing" },
    { ...rest, elapsed: NaN },
  ])
    assert.equal(validatePixelState({ ...state, activity }).activity, null);
  assert.equal(
    validatePixelState({ ...state, sceneId: "cafe", activity: rest }).activity,
    null,
  );
  assert.equal(
    validatePixelState({ ...state, activity: rest }).flags.rested,
    undefined,
  );
});
test("NPC itineraries have one location, and contain both travel and activity", () => {
  assert.equal(Object.keys(PEOPLE).length, 11);
  for (const id of Object.keys(PEOPLE)) {
    const plans = Array.from({ length: 360 }, (_, i) =>
      itinerary(id, i, { knownPeople: ["silver_pc"] }),
    );
    assert.ok(plans.some((p) => p.scene === null));
    assert.ok(plans.some((p) => p.leaving));
    assert.ok(plans.every((p) => p.scene === null || ROOMS[p.scene]));
  }
});
test("pixel saves preserve position, outfit, encounter and NPC progress without touching the main game", () => {
  const data = new Map([
    ["star-game-save", "original-save"],
    ["star-game-preferences", "original-prefs"],
  ]);
  const storage = createStorage({
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
  });
  const state = initialPixelState();
  state.sceneId = "cafe";
  state.position = { x: 540, y: 450 };
  state.outfitId = "practice";
  state.dialogue = { npcId: "jiqing", index: 2, reply: null };
  state.npcPositions.jiqing = { sceneId: "cafe", x: 570, y: 425 };
  state.elapsed = 72;
  assert.ok(storage.write(state, 1));
  const restored = storage.read(1).state;
  assert.deepEqual(restored, validatePixelState(state));
  assert.deepEqual(restored.visited, ["home", "cafe"]);
  assert.equal(restored.life.game.outfitId, "practice");
  storage.write({ ...state, outfitId: "audition" }, 1);
  assert.ok(data.has(`${SAVE_KEY}-slot-1-backup`));
  assert.equal(data.get("star-game-save"), "original-save");
  assert.equal(data.get("star-game-preferences"), "original-prefs");
});
test("corrupt, incompatible and unavailable storage fail without crashing", () => {
  const broken = createStorage({
    getItem: () => "{bad",
    setItem: () => {
      throw new Error("quota");
    },
  });
  assert.equal(broken.read().state, null);
  assert.equal(broken.write(initialPixelState()), false);
  assert.throws(() =>
    validatePixelState({ ...initialPixelState(), version: 99 }),
  );
  assert.throws(() =>
    validatePixelState({ ...initialPixelState(), sceneId: "missing" }),
  );
  assert.throws(() =>
    validatePixelState({ ...initialPixelState(), outfitId: "missing" }),
  );
  const safe = validatePixelState({
    ...initialPixelState(),
    position: { x: Infinity, y: NaN },
    knownPeople: ["sunny", "jiqing"],
    dialogue: { npcId: "jiqing", index: 999 },
  });
  assert.deepEqual(safe.position, ROOMS.home.entry);
  assert.deepEqual(safe.knownPeople, ["jiqing"]);
  assert.equal(safe.dialogue, null);
});
