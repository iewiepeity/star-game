import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialLife,
  beginDay,
  settleDay,
  advanceDay,
  nextWeek,
  planDay,
  access,
  normalizeLife,
  newProject,
  buyOutfit,
  recordMeeting,
  arriveAt,
  cancelDay,
  CHOICES,
} from "../src/pixel/life.js";
import {
  createStorage,
  initialPixelState,
  SAVE_KEY,
} from "../src/pixel/model.js";
function day(l, a) {
  const p = beginDay(l, a);
  assert.ok(!p.error, p.error);
  const r = settleDay(l, "focus");
  assert.ok(!r.error, r.error);
  advanceDay(l);
  return r;
}
test("first-week planning and immediate arrivals need no registration day", () => {
  const l = initialLife("arrival");
  assert.equal(access(l, { id: "acting" }), "");
  assert.equal(access(l, { id: "tv_assistant" }), "");
  for (let day = 0; day < 7; day++)
    assert.equal(planDay(l, day, { id: "acting" }), "");
  assert.deepEqual(l.game.visitedLocationsByWeek, {});
  const before = structuredClone(l.game);
  assert.equal(arriveAt(l, "rehearsal"), true);
  assert.equal(arriveAt(l, "rehearsal"), false);
  assert.equal(l.day, 0);
  assert.equal(l.game.money, before.money);
  assert.deepEqual(l.game.stats, before.stats);
  assert.deepEqual(l.game.visitedLocationsByWeek, { 1: ["rehearsal"] });
  beginDay(l, { id: "acting" });
  assert.equal(planDay(l, 0, { id: "study" }), "");
  assert.equal(l.pending, null);
  beginDay(l);
  settleDay(l);
  assert.ok(cancelDay(l));
  assert.ok(planDay(l, 0, { id: "rest" }));
});
test("action IDs survive save/reload; replays cannot duplicate money, growth, RNG or weekly reward", () => {
  let l = initialLife("ledger");
  day(l, { id: "visit_tv" });
  beginDay(l, { id: "tv_assistant" });
  const r = settleDay(l),
    snapshot = structuredClone(l.game);
  for (let i = 0; i < 4; i++) {
    l = normalizeLife(l);
    assert.deepEqual(settleDay(l), r);
    assert.deepEqual(l.game, snapshot);
  }
  assert.equal(advanceDay(l), true);
  assert.equal(advanceDay(l), false);
  while (l.day < 7) day(l, { id: "rest" });
  assert.equal(l.weekSummary.reward.money, 1500);
  const balance = l.game.money;
  assert.equal(advanceDay(l), false);
  assert.equal(l.game.money, balance);
  assert.equal(nextWeek(l), true);
  assert.equal(nextWeek(l), false);
  assert.equal(l.game.week, 2);
  assert.equal(l.day, 0);
});
test("one full week gives identical economics and stats at all five speeds, manual or auto", () => {
  const results = [];
  for (const speed of [1, 2, 4, 8, 16]) {
    const l = initialLife("same-seed");
    l.speed = speed;
    l.auto = speed !== 1;
    while (l.day < 7) day(l, l.plan[l.day]);
    results.push({
      game: l.game,
      ledger: l.ledger,
      reward: l.weekSummary.reward,
    });
  }
  for (const r of results.slice(1)) assert.deepEqual(r, results[0]);
  assert.equal(results[0].game.trainingSessionsCompleted, 1);
  assert.equal(results[0].game.partTimeShifts.tv_assistant, 1);
});
test("creative work may use multiple days per week, and creates persistent original-core projects", () => {
  const l = initialLife("writer"),
    p = newProject(l, "script", "第一幕");
  assert.equal(l.day, 0);
  assert.equal(p.progress, 0);
  day(l, { id: "creative", projectId: p.id });
  const first = l.game.creativeProjects[0].progress;
  day(l, { id: "creative", projectId: p.id });
  assert.ok(l.game.creativeProjects[0].progress > first);
  assert.equal(l.day, 2);
  assert.equal(l.game.fatigue, 12);
  assert.equal(l.game.money, 18000);
});
test("shop purchases use original outfit prices, ownership and reject duplicate spending", () => {
  const l = initialLife("shop");
  arriveAt(l, "shop");
  assert.equal(l.day, 0);
  const before = l.game.money;
  assert.equal(buyOutfit(l, "practice"), "");
  assert.equal(l.game.money, before - 1200);
  assert.ok(l.game.ownedOutfits.raven.includes("practice"));
  assert.ok(buyOutfit(l, "practice"));
  assert.equal(l.game.money, before - 1200);
});
test("social publishing and NPC meeting use original core outcomes; repeat greetings do not farm rewards", () => {
  const l = initialLife("phone");
  day(l, { id: "social" });
  assert.equal(l.game.socialPosts.length, 1);
  assert.ok(l.game.fans > 0);
  recordMeeting(l, "sufei");
  const rel = structuredClone(l.game.relationships.sufei);
  recordMeeting(l, "sufei");
  assert.deepEqual(l.game.relationships.sufei, rel);
});
test("cannot execute locked/poorly funded days or overwrite completed days", () => {
  const l = initialLife("blocked");
  assert.ok(beginDay(l, { id: "missing" }).error);
  assert.equal(l.pending, null);
  day(l, { id: "rest" });
  assert.ok(planDay(l, 0, { id: "study" }));
  l.game.money = 0;
  assert.ok(beginDay(l, { id: "visit_tv" }).error);
  assert.equal(l.game.money, 0);
  assert.equal(l.day, 1);
});
test("phase-one migration and pending actions stay isolated from classic saves", () => {
  const data = new Map([["star-game-save", "sentinel"]]);
  const s = createStorage({
    getItem: (k) => data.get(k),
    setItem: (k, v) => data.set(k, v),
  });
  const legacy = initialPixelState();
  delete legacy.life;
  legacy.outfitId = "practice";
  data.set(SAVE_KEY, JSON.stringify({ state: legacy }));
  const migrated = s.read().state;
  assert.ok(migrated.life.game.ownedOutfits.raven.includes("practice"));
  beginDay(migrated.life, { id: "study" });
  assert.ok(s.write(migrated));
  assert.equal(s.read().state.life.pending.assignment.id, "study");
  assert.equal(data.get("star-game-save"), "sentinel");
  assert.equal(Object.keys(CHOICES).length, 50);
});
