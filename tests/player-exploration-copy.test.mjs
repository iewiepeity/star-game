import test from "node:test";
import assert from "node:assert/strict";
import {
  CHOICES,
  initialLife,
  beginDay,
  settleDay,
  access,
} from "../src/pixel/life.js";
import { MAP_LOCATIONS } from "../src/data/map-locations.js";
import { NPCS } from "../src/data/npcs.js";
import {
  LOCATION_DAY_COPY,
  locationDayCopy,
  explorationResultNotes,
} from "../src/pixel/location-day-copy.js";
import { createLifeUI } from "../src/pixel/life-ui.js";

const visits = Object.entries(CHOICES).filter(
  ([, action]) => action.action === "free" && action.venue,
);

function completeVisit(id) {
  const life = initialLife(`player-copy-${id}`);
  life.game.money = 20_000;
  life.game.fatigue = 30;
  life.game.mood = 60;
  assert.equal(access(life, { id }), "");
  assert.ok(!beginDay(life, { id }).error);
  const result = settleDay(life, "focus");
  assert.ok(!result.error);
  return { life, result };
}

test("every explorable location has day narration without design notes or an invented named encounter", () => {
  const venues = [...new Set(visits.map(([, action]) => action.venue))];
  assert.deepEqual(venues.sort(), Object.keys(LOCATION_DAY_COPY).sort());
  assert.equal(new Set(Object.values(LOCATION_DAY_COPY)).size, venues.length);
  for (const venue of venues) {
    const copy = LOCATION_DAY_COPY[venue];
    assert.ok(copy.length > 20, venue);
    assert.doesNotMatch(
      copy,
      /NPC|玩家|系統開放|事件池|不可通行|觸發|資料欄位|好感度|解鎖|可能遇見/,
      venue,
    );
    for (const npc of Object.values(NPCS)) {
      assert.ok(!copy.includes(npc.name), `${venue}: ${npc.name}`);
    }
  }
});

test("actual day settlement keeps map help out of narration and preserves all growth and costs", () => {
  for (const [id, action] of visits) {
    const normal = completeVisit(id);
    const location = MAP_LOCATIONS[action.venue];
    const { effect, note } = location;
    let poisoned;
    try {
      location.effect = "INTERNAL_EFFECT_SENTINEL：候選 NPC／引擎規格";
      location.note = "INTERNAL_NOTE_SENTINEL：開發欄位勿顯示";
      poisoned = completeVisit(id);
    } finally {
      location.effect = effect;
      location.note = note;
    }
    assert.equal(normal.result.notes[0], LOCATION_DAY_COPY[action.venue], id);
    assert.deepEqual(poisoned.result.notes, normal.result.notes, id);
    assert.doesNotMatch(poisoned.result.notes.join(" "), /INTERNAL_/, id);
    assert.deepEqual(poisoned.result.deltas, normal.result.deltas, id);
    assert.deepEqual(poisoned.result.gains, normal.result.gains, id);
    assert.deepEqual(poisoned.life.game.stats, normal.life.game.stats, id);
    assert.equal(poisoned.life.game.money, normal.life.game.money, id);
    assert.deepEqual(
      poisoned.life.game.knownPeople,
      normal.life.game.knownPeople,
      id,
    );
  }
});

test("an airport day ends with a public-terminal visit rather than an unfinished-feature notice", () => {
  const { life, result } = completeVisit("explore_airport");
  assert.match(result.notes[0], /公共航廈/);
  assert.doesNotMatch(result.notes.join(" "), /系統|尚待|解鎖|海外工作|錄取/);
  assert.doesNotMatch(MAP_LOCATIONS.airport.effect, /尚待|系統開放/);
  assert.deepEqual(life.game.knownPeople, []);
  assert.equal(life.game.completedWorks.length, 0);
});

test("an unknown location gets neutral narration without reading any model description", () => {
  const copy = locationDayCopy("future_place");
  assert.match(copy, /手帳/);
  assert.doesNotMatch(copy, /future_place|NPC|玩家|系統/);
});

test("legacy explore results replace exact map text only, preserving additional encounters and saved history", () => {
  for (const [id, action] of visits.filter(([id]) =>
    id.startsWith("explore_"),
  )) {
    for (const legacy of [
      MAP_LOCATIONS[action.venue].effect,
      MAP_LOCATIONS[action.venue].note,
    ]) {
      const { life, result } = completeVisit(id);
      const encounter = "喬映澄傳來一則訊息，問你什麼時候方便聊聊。";
      result.notes = [legacy, encounter];
      life.game.history.push({ week: 1, results: [result] });
      const before = JSON.stringify(life);
      Object.freeze(result.notes);
      assert.deepEqual(explorationResultNotes(result, action), [
        LOCATION_DAY_COPY[action.venue],
        encounter,
      ]);
      assert.equal(JSON.stringify(life), before, id);
      assert.equal(life.game.history.at(-1).results[0].notes[0], legacy);
    }
  }
});

test("legacy airport wording is repaired only for an airport explore result", () => {
  const result = {
    assignment: { id: "explore_airport" },
    notes: ["尚待外地發展系統開放"],
  };
  assert.deepEqual(explorationResultNotes(result, CHOICES.explore_airport), [
    LOCATION_DAY_COPY.airport,
  ]);
  assert.deepEqual(result.notes, ["尚待外地發展系統開放"]);
  const elsewhere = { ...result, assignment: { id: "explore_beach" } };
  assert.deepEqual(
    explorationResultNotes(elsewhere, CHOICES.explore_beach),
    result.notes,
  );
});

test("new prose, partial quotations, unrelated locations, and non-explore results are unchanged", () => {
  const notes = [
    LOCATION_DAY_COPY.radio,
    `你讀到「${MAP_LOCATIONS.radio.effect}」，另外記下自己的想法。`,
    MAP_LOCATIONS.beach.effect,
  ];
  const result = { assignment: { id: "explore_radio" }, notes };
  assert.deepEqual(
    explorationResultNotes(result, CHOICES.explore_radio),
    notes,
  );
  for (const id of ["career_job", "cafe", "visit_tv", "explore_unknown"]) {
    const other = { assignment: { id }, notes: [MAP_LOCATIONS.radio.effect] };
    assert.strictEqual(
      explorationResultNotes(other, CHOICES[id]),
      other.notes,
      id,
    );
  }
});

test("resuming a saved result shows corrected notes without modifying the stored result or numeric gains", () => {
  const { life, result } = completeVisit("explore_airport");
  delete result.moments; // This fixture represents a save from before daily moments existed.
  result.notes = ["尚待外地發展系統開放", "你將朋友的來信收進手帳。"];
  result.presentation = { title: result.label, portrait: "portrait.webp" };
  life.game.activeEvent = null;
  life.game.eventOutcome = null;
  const before = JSON.stringify(life);
  let shown;
  const ui = createLifeUI({
    state: () => ({ life }),
    narrate: (data) => {
      shown = data;
    },
  });
  assert.equal(ui.resumeNarrative(), true);
  assert.equal(
    shown.text,
    `${LOCATION_DAY_COPY.airport} 你將朋友的來信收進手帳。`,
  );
  assert.equal(JSON.stringify(life), before);
});
