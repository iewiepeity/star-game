import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { JOB_STORYLINES } from "../src/data/job-storylines.js";
import { NPC_LIST } from "../src/data/npcs.js";
import { MAP_LOCATIONS } from "../src/data/map-locations.js";
import { JOB_DEPTH_TIERS, FLAGSHIP_JOB_BEATS, YEAR_CHAPTERS, MANAGER_STANCES } from "../src/data/deepening-content.js";
import { NPC_AUTONOMOUS_BEATS, ROMANCE_STAGE_FLAVOR, WORLD_REACTION_SIGNALS } from "../src/data/living-world-content.js";
import { state, resetState } from "../src/core/state.js";
import { tickDeepeningSystems } from "../src/logic/deepening-engine.js";

const root = new URL("../", import.meta.url);

test("vertical deepening does not grow horizontal content counts", () => {
  assert.equal(JOB_CATALOG.length, 75);
  assert.equal(NPC_LIST.length, 10);
  assert.equal(Object.keys(MAP_LOCATIONS).length, 26);
});

test("15 flagship jobs use bespoke production beats instead of category template only", () => {
  const ids = Object.entries(JOB_DEPTH_TIERS).filter(([, tier]) => tier === "A").map(([id]) => id);
  assert.equal(ids.length, 15);
  for (const id of ids) {
    const story = JOB_STORYLINES[id], beat = FLAGSHIP_JOB_BEATS[id];
    assert.equal(story.depth, "A", id);
    assert.equal(story.production.length, 4, id);
    assert.equal(story.production[0].text, beat.opening, id);
    assert.equal(story.production[1].text, beat.crisis, id);
    assert.equal(story.production[2].text, beat.pivot, id);
    assert.equal(story.production[3].text, beat.wrap, id);
    assert.equal(story.legacy.text, beat.publicEcho, id);
  }
  assert.equal(new Set(ids.map((id) => JOB_STORYLINES[id].production[1].text)).size, 15);
});

test("five years have distinct dramatic chapters and pressure", () => {
  assert.deepEqual(YEAR_CHAPTERS.map((x) => x.title), ["活下來", "我是誰", "位置有限", "選擇有代價", "留下什麼"]);
  assert.equal(new Set(YEAR_CHAPTERS.map((x) => x.pressure)).size, 5);
  assert.ok(YEAR_CHAPTERS.every((x) => x.goal && x.world));
});

test("all existing managers have four explicit stances", () => {
  assert.equal(Object.keys(MANAGER_STANCES).length, 4);
  for (const stance of Object.values(MANAGER_STANCES))
    for (const key of ["conservative", "ambitious", "crisis", "renewal"])
      assert.ok(stance[key]?.length > 12, key);
});

test("living-world content covers every main NPC, romance stages and hidden signals", () => {
  assert.equal(Object.keys(NPC_AUTONOMOUS_BEATS).length, 10);
  assert.ok(Object.values(NPC_AUTONOMOUS_BEATS).every((pool) => pool.length >= 3));
  for (const stage of ["interested", "ambiguous", "dating", "committed", "engaged", "married", "broken"])
    assert.ok(ROMANCE_STAGE_FLAVOR[stage]?.length >= 2, stage);
  assert.equal(Object.keys(WORLD_REACTION_SIGNALS.hidden).length, 8);
  assert.equal(Object.keys(WORLD_REACTION_SIGNALS.rep).length, 8);
});

test("flagship completion becomes a delayed visible world echo", () => {
  resetState();
  state.week = 10;
  state.completedWorks.push({ id: "work-J061-10", jobId: "J061", title: "夏季音樂祭主題單曲", completedWeek: 10, stars: 3, quality: 80 });
  let result = tickDeepeningSystems();
  assert.equal(result.queued.length, 1);
  assert.equal(state.worldEchoes[0].dueWeek, 12);
  state.week = 12;
  result = tickDeepeningSystems();
  assert.equal(result.echoes.length, 1);
  assert.ok(state.livingWorldFeed.some((x) => x.type === "作品長尾"));
  assert.ok(state.eventQueue.some((x) => x.event?.id?.startsWith("echo-event:")) || state.activeEvent?.id?.startsWith("echo-event:"));
});

test("autonomous NPC updates never add strangers to contacts", () => {
  resetState();
  state.week = 6;
  tickDeepeningSystems();
  assert.deepEqual(state.knownPeople, []);
  assert.ok((state.livingWorldFeed || []).some((x) => x.type === "人物近況"));
});

test("romance stage and manager stance become player-visible messages", () => {
  resetState();
  state.week = 3;
  state.knownPeople = ["jiqing"];
  state.relationships.jiqing = { romance: "dating", closeness: 70, trust: 70, affection: 70, hostility: 0 };
  state.partnerId = "jiqing";
  state.currentAgencyId = "starlight";
  state.health = 100;
  state.fatigue = 10;
  const result = tickDeepeningSystems();
  assert.ok(result.romance);
  assert.ok(state.npcMessages.some((x) => x.source === "romance"));
  assert.equal(state.managerAdvice?.type, "ambitious");
});

test("world tick and player-facing UI are actually wired to the deepening layer", async () => {
  const [tick, room, map, planner] = await Promise.all([
    readFile(new URL("src/logic/world-tick.js", root), "utf8"),
    readFile(new URL("src/views/room.js", root), "utf8"),
    readFile(new URL("src/views/map.js", root), "utf8"),
    readFile(new URL("src/views/planner.js", root), "utf8"),
  ]);
  assert.match(tick, /tickDeepeningSystems\(\)/);
  assert.match(room, /① 現在最急/);
  assert.match(room, /② 有人在找你/);
  assert.match(room, /③ 本章目標/);
  assert.match(map, /今日線索/);
  assert.match(planner, /contractConflictPreview/);
  assert.match(planner, /疲勞趨勢/);
});
