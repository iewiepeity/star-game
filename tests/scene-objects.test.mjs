import test from "node:test";
import assert from "node:assert/strict";
import { ROOMS } from "../src/pixel/data.js";
import { initialPixelState, validatePixelState } from "../src/pixel/model.js";
import {
  APPEARANCES,
  appearanceValue,
  setObjectAppearance,
  canReturnHome,
  pickObject,
} from "../src/pixel/scene-objects.js";
import { inside, buildGrid, findPath } from "../src/pixel/navigation.js";

test("all 32 spaces have unified named props and retain reachable service geometry", () => {
  assert.equal(Object.keys(ROOMS).length, 32);
  for (const [id, room] of Object.entries(ROOMS)) {
    assert.equal(room.schemaVersion, 1, id);
    assert.ok(
      room.objects.filter((o) => o.action === "inspect").length >= 6,
      id,
    );
    assert.equal(
      new Set(room.entities.map((o) => o.id)).size,
      room.entities.length,
      id,
    );
    assert.deepEqual(
      room.blocks,
      room.entities.flatMap((o) => o.collision),
      id,
    );
    const grid = buildGrid(room);
    for (const o of room.objects) {
      assert.ok(o.name && o.response && o.hit.length >= 3, `${id}/${o.id}`);
      assert.ok(
        o.hit.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
        `${id}/${o.id}`,
      );
      if (o.action !== "inspect")
        assert.ok(
          findPath(grid, room.entry, o.target).length,
          `${id}/${o.id} reachable`,
        );
    }
  }
});
test("appearance mutations persist across slots/normalization without spending a day or resources", () => {
  const state = initialPixelState(),
    life = structuredClone(state.life);
  assert.ok(setObjectAppearance(state, ROOMS, "prop-wardrobe-doors", "open"));
  assert.ok(setObjectAppearance(state, ROOMS, "prop-lamp", "off"));
  state.sceneId = "cafe";
  assert.ok(setObjectAppearance(state, ROOMS, "prop-pendant-a", "off"));
  const restored = validatePixelState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.objectStates, state.objectStates);
  assert.deepEqual(state.life, life);
  assert.equal(restored.objectStates.home["prop-wardrobe-doors"], "open");
  assert.equal(
    setObjectAppearance(state, ROOMS, "prop-wardrobe-doors", "open"),
    false,
  );
  assert.equal(
    setObjectAppearance(state, ROOMS, "prop-bell", "arbitrary"),
    false,
  );
});
test("legacy and hostile object-state data is normalized to the allowlisted catalog", () => {
  const old = initialPixelState();
  delete old.objectStates;
  assert.deepEqual(validatePixelState(old).objectStates, {});
  old.objectStates = {
    home: { "prop-lamp": "bad", "prop-wardrobe-doors": "open", unknown: "on" },
    unknown: { x: "on" },
  };
  assert.deepEqual(validatePixelState(old).objectStates, {
    home: { "prop-wardrobe-doors": "open" },
  });
  for (const room of Object.values(ROOMS))
    for (const item of room.objects)
      if (item.appearance)
        assert.equal(
          appearanceValue({}, "", item),
          APPEARANCES[item.appearance].initial,
        );
});
test("home shortcut guards choices, in-flight daily activities and transitions", () => {
  const state = initialPixelState();
  assert.equal(canReturnHome(state), false);
  state.sceneId = "cafe";
  assert.equal(canReturnHome(state), true);
  assert.equal(canReturnHome(state, true), false);
  for (const field of ["storyStage", "pending"]) {
    state.life[field] = {};
    assert.equal(canReturnHome(state), false);
    state.life[field] = null;
  }
  state.dialogue = {};
  assert.equal(canReturnHome(state), false);
  state.dialogue = null;
  state.life.game.activeEvent = {};
  assert.equal(canReturnHome(state), false);
});
test("small props win overlapping furniture and empty floor remains navigable", () => {
  const room = ROOMS.home,
    lamp = room.objects.find((o) => o.id === "prop-lamp");
  assert.equal(
    pickObject(room.objects, { x: lamp.x, y: lamp.y }, inside).id,
    lamp.id,
  );
  assert.equal(pickObject(room.objects, { x: 500, y: 550 }, inside), null);
});
