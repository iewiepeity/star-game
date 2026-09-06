import test from "node:test";
import assert from "node:assert/strict";
import { ROOMS } from "../src/pixel/data.js";
import { CITY_CATALOG } from "../src/pixel/city-catalog.js";
import { CITY_DETAIL_COPY, cityDetailText } from "../src/pixel/city-interaction-copy.js";

test("every inspectable city object has its own player-facing observation", () => {
  const ids = Object.entries(ROOMS)
    .filter(([, room]) => room.objects.some(object => object.action === "detail"))
    .map(([id]) => id);
  assert.equal(ids.length, 25);
  assert.deepEqual(Object.keys(CITY_DETAIL_COPY).sort(), [...ids].sort());
  assert.equal(new Set(ids.map(cityDetailText)).size, ids.length);
  for (const id of ids) {
    assert.ok(cityDetailText(id).length >= 30, id);
    assert.doesNotMatch(cityDetailText(id), /NPC|avatar|玩家實體|可走岸線|不可通行|觸發|解鎖|既有劇情|隱藏人物|系統|數值/);
  }
});

test("inspection never falls back to authoring gates or internal catalogue fields", () => {
  const before = cityDetailText("beach");
  CITY_CATALOG.beach.gate = "INTERNAL_GATE_DO_NOT_SHOW";
  CITY_CATALOG.beach.internalNotes = "INTERNAL_NPC_PLACEMENT";
  try {
    assert.equal(cityDetailText("beach"), before);
    assert.doesNotMatch(cityDetailText("unknown-place"), /INTERNAL/);
  } finally {
    delete CITY_CATALOG.beach.gate;
    delete CITY_CATALOG.beach.internalNotes;
  }
});
