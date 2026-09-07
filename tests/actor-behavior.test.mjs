import test from "node:test";
import assert from "node:assert/strict";
import { advanceMotion, bodyClear } from "../src/pixel/actor-motion.js";
import {
  initialBehavior,
  objectApproaches,
  chooseInteraction,
  normalizeBehaviors,
  freePoint,
  usableBehavior,
} from "../src/pixel/npc-behavior.js";
import { ROOMS, PEOPLE } from "../src/pixel/data.js";
import {
  buildGrid,
  findPath,
  footClear,
  walkable,
} from "../src/pixel/navigation.js";
import { initialPixelState, validatePixelState } from "../src/pixel/model.js";

test("distance-paced motion accelerates, turns cardinally and settles exactly at the goal", () => {
  const a = {
    x: 0,
    y: 0,
    path: [
      { x: 90, y: 0 },
      { x: 90, y: 60 },
    ],
    facing: 0,
  };
  advanceMotion(a, 1 / 60, 165);
  const first = a.x;
  advanceMotion(a, 1 / 60, 165);
  assert.ok(a.x - first > first);
  let turning = false;
  for (let i = 0; i < 300 && a.path.length; i++) {
    const before = { x: a.x, y: a.y };
    advanceMotion(a, 1 / 60, 165);
    assert.ok(a.x === before.x || a.y === before.y);
    if (a.turnWait > 0) turning = true;
  }
  assert.equal(a.x, 90);
  assert.equal(a.y, 60);
  assert.ok(turning);
  assert.ok(Math.abs(a.walkDistance - 150) < 0.01);
  assert.equal(a.speed, 0);
  assert.equal(advanceMotion(a, 0.1, 165), false);
});
test("blocked feet stop the walk animation and cannot tunnel through another actor at high playback speed", () => {
  const a = { x: 0, y: 0, path: [{ x: 200, y: 0 }] },
    b = { x: 40, y: 0 };
  for (let i = 0; i < 10; i++)
    advanceMotion(a, 0.64, 165, (p) => bodyClear(a, p, [a, b]));
  assert.ok(a.x <= 24);
  const steps = a.walkDistance;
  assert.equal(
    advanceMotion(a, 0.64, 165, (p) => bodyClear(a, p, [a, b])),
    false,
  );
  assert.equal(a.walkDistance, steps);
  assert.equal(a.speed, 0);
  assert.ok(
    bodyClear({ x: 39, y: 0 }, { x: 38, y: 0 }, [b]),
    "old overlap may separate",
  );
});
test("a visiting NPC cannot trap an off-grid player in the route lead-in", () => {
  const room = ROOMS.home,
    grid = buildGrid(room);
  // Two blocked player positions observed while walking to the sofa.
  const cases = [
    [
      { x: 737.5, y: 506.25 },
      { x: 740.3444, y: 522 },
      { x: 714, y: 414 },
    ],
    [
      { x: 738, y: 508.89 },
      { x: 747.1889, y: 522 },
      { x: 714, y: 414 },
    ],
  ];
  for (const [from, other, goal] of cases) {
    const actor = { ...from, path: [] };
    const clear = (point) =>
      Math.hypot(point.x - from.x, point.y - from.y) < 0.01 ||
      bodyClear(from, point, [other], 19);
    const nodes = grid.nodes.filter(
      (point) =>
        Math.hypot(point.x - other.x, point.y - other.y) >= 19 ||
        Math.hypot(point.x - from.x, point.y - from.y) < 5,
    );
    actor.path = findPath(
      {
        ...grid,
        nodes,
        byId: new Map(nodes.map((point) => [point.id, point])),
      },
      from,
      goal,
      clear,
    );
    assert.ok(
      actor.path.length,
      "there is a clear route around the other actor",
    );
    for (let i = 0; i < 1200 && actor.path.length; i++)
      advanceMotion(
        actor,
        1 / 60,
        165,
        (point) => footClear(room, point) && bodyClear(actor, point, [other]),
      );
    assert.equal(
      actor.path.length,
      0,
      "the route must actually be walkable, not just its nodes",
    );
    assert.ok(Math.hypot(actor.x - goal.x, actor.y - goal.y) < 1);
  }
  // A dynamic check must not poison the shared static furniture edge cache.
  assert.ok(findPath(grid, room.entry, cases[0][2]).length);
});
test("all city spaces offer reachable grounded interaction approaches", () => {
  for (const [id, room] of Object.entries(ROOMS)) {
    const grid = buildGrid(room),
      approaches = objectApproaches(room, grid);
    assert.ok(approaches.size > 0, id);
    for (const points of approaches.values())
      for (const p of points) assert.ok(walkable(room, p), id);
    const actor = { id: "jiqing", ...room.entry },
      choice = chooseInteraction({
        actor,
        room,
        grid,
        approaches,
        behavior: initialBehavior(),
      });
    assert.ok(choice, id);
    assert.ok(walkable(room, choice.target));
  }
});
test("NPC object choice is deterministic, respects ownership and remembers recently used objects", () => {
  const room = ROOMS.cafe,
    grid = buildGrid(room),
    approaches = objectApproaches(room, grid),
    actor = { id: "jiqing", ...room.entry };
  const args = { actor, room, grid, approaches, behavior: initialBehavior() };
  const first = chooseInteraction(args);
  assert.deepEqual(chooseInteraction(args), first);
  const next = chooseInteraction({
    ...args,
    reserved: new Set([first.item.id]),
    occupied: [first.target],
  });
  assert.ok(next);
  assert.notEqual(next.item.id, first.item.id);
  assert.ok(
    Math.hypot(
      next.target.x - first.target.x,
      next.target.y - first.target.y,
    ) >= 23,
  );
  const repeated = chooseInteraction({
    ...args,
    behavior: { ...args.behavior, recent: [first.item.id] },
  });
  assert.notEqual(repeated.item.id, first.item.id);
  const spawn = freePoint(grid, room.entry, [room.entry]);
  assert.ok(Math.hypot(spawn.x - room.entry.x, spawn.y - room.entry.y) >= 20);
});
test("NPC behavior saves are bounded, legacy-safe, and never alter simulation state", () => {
  const state = initialPixelState(),
    before = structuredClone(state.life.game);
  state.npcBehaviors = {
    jiqing: {
      sceneId: "cafe",
      phase: "using",
      objectId: "prop-cups",
      remaining: 4,
      cycle: 2,
      recent: ["prop-windows"],
      completed: 1,
    },
    unknown: { sceneId: "cafe" },
  };
  const saved = validatePixelState(state);
  assert.deepEqual(saved.npcBehaviors.jiqing, state.npcBehaviors.jiqing);
  assert.equal(saved.npcBehaviors.unknown, undefined);
  delete state.npcBehaviors;
  assert.deepEqual(validatePixelState(state).npcBehaviors, {});
  assert.deepEqual(state.life.game, before);
  const invalid = normalizeBehaviors(
    {
      jiqing: {
        sceneId: "cafe",
        phase: "using",
        objectId: "missing",
        remaining: Infinity,
        recent: 42,
      },
    },
    ROOMS,
    PEOPLE,
  );
  assert.equal(invalid.jiqing.phase, "idle");
  assert.equal(invalid.jiqing.remaining, 1);
});

test("idle NPCs keep recent activity memory after reload", () => {
  const saved = {
    ...initialBehavior(),
    sceneId: "cafe",
    recent: ["prop-windows"],
    cycle: 7,
  };
  const restored = usableBehavior(saved, "cafe", ROOMS.cafe, ROOMS.cafe.entry);
  assert.deepEqual(restored.recent, saved.recent);
  assert.equal(restored.cycle, 7);
  assert.equal(restored.phase, "idle");
  assert.notEqual(restored.recent, saved.recent);
});
