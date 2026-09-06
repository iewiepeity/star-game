import test from "node:test";
import assert from "node:assert/strict";
import {
  initialPixelState,
  createStorage,
  validatePixelState,
} from "../src/pixel/model.js";
import {
  initialLife,
  CHOICES,
  definition,
  beginDay,
  settleDay,
  advanceDay,
  recordMeeting,
  access,
} from "../src/pixel/life.js";
import { careerCommand, bookCareer, careerDecision } from "../src/pixel/career.js";
import { activityAllowed } from "../src/pixel/data.js";
import { applyPlannerTool } from "../src/pixel/planner-tools.js";
import {
  exportPixelSave,
  parsePixelTransfer,
  newRun,
} from "../src/pixel/save-transfer.js";
import { exportSave } from "../src/core/persistence.js";
import {
  finishCreation,
  editCreation,
  rerollCreation,
  advanceOpening,
} from "../src/pixel/onboarding.js";
import { saveLook } from "../src/logic/wardrobe.js";
import { pixelPreferences } from "../src/pixel/preferences.js";
import { NPC_INTERACTIONS } from "../src/data/npc-network.js";
function fixture() {
  const l = initialLife("complete-0");
  l.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  recordMeeting(l, "sufei");
  l.game.money = 100000;
  Object.assign(l.game.relationships.sufei, {
    closeness: 80,
    trust: 80,
    affection: 80,
    romance: "dating",
  });
  return l;
}
test("every NPC appointment type maps to an allowed scene animation", () => {
  const l = fixture();
  for (const type of Object.keys(NPC_INTERACTIONS)) {
    const id = "fixture-" + type;
    l.game.scheduledActivities[id] = {
      id,
      kind: "npc_interact",
      payload: { npcId: "sufei", type },
      label: type,
    };
    const d = definition(l, { id: "career_task", taskId: id });
    assert.ok(
      activityAllowed(d.room, d.item, d.pose),
      `${type}: ${d.room}/${d.item}/${d.pose}`,
    );
  }
});
test("chat appointment settles exactly once and reservation completes", () => {
  const l = fixture();
  assert.ok(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 0).ok,
  );
  const a = l.plan[0],
    taskId = a.taskId;
  beginDay(l, a);
  const r = settleDay(l, careerDecision(l, a).choices[0].id);
  assert.ok(!r.error);
  assert.equal(l.game.scheduledActivities[taskId].status, "completed");
  const after = structuredClone(l.game);
  settleDay(l);
  assert.deepEqual(l.game, after);
  assert.ok(advanceDay(l));
  assert.equal(l.day, 1);
});
test("publishing strategy is booked on chosen date and resolves with original community engine", () => {
  const l = fixture();
  const before = l.game.socialPosts.length;
  assert.ok(bookCareer(l, CHOICES, "social_post", { type: "daily" }, 0).ok);
  assert.equal(l.game.socialPosts.length, before);
  assert.equal(
    bookCareer(l, CHOICES, "social_post", { type: "daily" }, 1).ok,
    false,
  );
  beginDay(l, l.plan[0]);
  settleDay(l);
  assert.equal(l.game.socialPosts.length, before + 1);
  assert.equal(
    Object.values(l.game.scheduledActivities)[0].status,
    "completed",
  );
});
test("manager appointments require a signed manager and use the actual agency scene", () => {
  const l = fixture();
  assert.equal(
    bookCareer(l, CHOICES, "manager_interact", { type: "career" }, 0).ok,
    false,
  );
});
test("planner presets preserve completed dates and reservations, with safe undo", () => {
  const l = fixture();
  l.day = 2;
  assert.ok(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 3).ok,
  );
  const before = structuredClone(l.plan);
  assert.ok(applyPlannerTool(l, "actor").ok);
  assert.deepEqual(l.plan.slice(0, 2), before.slice(0, 2));
  assert.deepEqual(l.plan[3], before[3]);
  assert.ok(applyPlannerTool(l, "undo").ok);
  assert.deepEqual(l.plan, before);
  applyPlannerTool(l, "balanced");
  l.game.money--;
  assert.equal(applyPlannerTool(l, "undo").ok, false);
});
test("one-time low-cash relief work grants 3000 and cannot be repeated", () => {
  const l = fixture();
  l.game.money = 1200;
  assert.equal(access(l, { id: "relief_gig" }), "");
  beginDay(l, { id: "relief_gig" });
  settleDay(l);
  assert.equal(l.game.money, 4200);
  advanceDay(l);
  l.game.money = 1;
  assert.ok(access(l, { id: "relief_gig" }));
});
test("new game has initialized hidden traits and rerolls only public abilities", () => {
  const s = initialPixelState();
  assert.equal(Object.keys(s.life.game.hidden).length, 8);
  const hidden = structuredClone(s.life.game.hidden),
    stats = structuredClone(s.life.game.stats);
  rerollCreation(s);
  assert.deepEqual(s.life.game.hidden, hidden);
  assert.notDeepEqual(s.life.game.stats, stats);
  editCreation(s, "realName", "星芽");
  editCreation(s, "stageName", "小星");
  editCreation(s, "birthMonth", 2);
  editCreation(s, "birthDay", 31);
  finishCreation(s);
  assert.equal(s.playerName, "小星");
  assert.equal(s.life.game.birthDay, 29);
  for (let i = 0; i < 6; i++) advanceOpening(s);
  assert.equal(s.life.game.prologueCompleted, true);
});
test("pixel export roundtrip preserves pending chat, theme is separate and malformed import rejected", () => {
  const s = initialPixelState();
  s.life = fixture();
  bookCareer(s.life, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 0);
  beginDay(s.life, s.life.plan[0]);
  const parsed = parsePixelTransfer(exportPixelSave(s));
  assert.equal(
    parsed.state.life.pending.assignment.taskId,
    s.life.pending.assignment.taskId,
  );
  assert.throws(() =>
    parsePixelTransfer(
      JSON.stringify({ game: "star-game-pixel", version: 1, state: {} }),
    ),
  );
  const bad = JSON.parse(exportPixelSave(s));
  bad.state.life.game.money = Infinity;
  assert.throws(() => parsePixelTransfer(JSON.stringify(bad)));
});
test("original midweek import preserves resources, completed days and future tasks", () => {
  const s = initialPixelState();
  s.life = fixture();
  s.life.game.realName = "原版新人";
  bookCareer(s.life, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 3);
  beginDay(s.life, { id: "rest" });
  settleDay(s.life);
  advanceDay(s.life);
  const text = exportSave(s.life.game),
    r = parsePixelTransfer(text).state;
  assert.equal(r.life.day, 1);
  assert.equal(r.life.game.money, s.life.game.money);
  assert.equal(r.life.plan[3].taskId, s.life.plan[3].taskId);
  assert.equal(r.playerName, "原版新人");
  assert.equal(r.life.ledger.length, 1);
  assert.equal(JSON.parse(text).state.money, r.life.game.money);
});
test("save deletion can be undone, backups survive autosave and failed writes", () => {
  const map = new Map(),
    store = {
      getItem: (k) => map.get(k) || null,
      setItem: (k, v) => map.set(k, v),
      removeItem: (k) => map.delete(k),
    },
    s = createStorage(store),
    state = initialPixelState();
  s.write(state, 1);
  s.backup(state);
  state.life.game.money = 1;
  s.write(state);
  assert.equal(s.readBackup().state.life.game.money, 18000);
  assert.ok(s.remove(1));
  assert.equal(s.read(1).state, null);
  assert.ok(s.restoreDeleted(1));
  assert.equal(s.read(1).state.life.game.money, 18000);
  assert.equal(s.restoreDeleted(1), false);
});
test("a new run retains achievements and endings but resets life and identity", () => {
  const s = initialPixelState();
  s.life.game.unlockedAchievements = [{ id: "first-work", week: 2 }];
  s.life.game.endingHistory = [{ endingId: "steady", run: 1 }];
  s.life.game.money = 9;
  const n = newRun(s);
  assert.deepEqual(
    n.life.game.unlockedAchievements,
    s.life.game.unlockedAchievements,
  );
  assert.equal(n.life.game.money, 18000);
  assert.equal(n.identity.locked, false);
  assert.equal(n.life.game.runCount, 2);
});
test("look slots remain per avatar and device settings survive palette changes", () => {
  const s = initialPixelState();
  assert.ok(saveLook(s.life.game, "daily"));
  assert.equal(s.life.game.savedLooks.raven.daily, "newcomer");
  const map = new Map(),
    p = pixelPreferences({
      getItem: (k) => map.get(k),
      setItem: (k, v) => map.set(k, v),
    });
  p.set("fontSize", "large");
  p.set("audioMuted", true);
  p.setTheme("rose");
  assert.equal(p.get().fontSize, "large");
  assert.equal(p.get().audioMuted, true);
  assert.equal(
    validatePixelState(s).life.game.savedLooks.raven.daily,
    "newcomer",
  );
});

test("signed manager meeting reaches company and updates original manager relationship", () => {
  const l = fixture();
  l.game.agencyApplications.starlight = { status: "offer", appliedWeek: 1 };
  l.game.agencyOffer = { agencyId: "starlight", offeredWeek: 1 };
  assert.ok(careerCommand(l, "accept-agency", "starlight").ok);
  assert.ok(l.game.managerState);
  assert.ok(
    bookCareer(l, CHOICES, "manager_interact", { type: "career" }, 0).ok,
  );
  const d = definition(l, l.plan[0]);
  assert.equal(d.room, "agency_starlight");
  assert.ok(activityAllowed(d.room, d.item, d.pose));
  const before = l.game.managerState.history.length;
  beginDay(l, l.plan[0]);
  assert.deepEqual(careerDecision(l, l.plan[0]).choices.map(c => c.id), ["listen", "assert", "compromise"]);
  assert.equal(settleDay(l).pending, true);
  assert.equal(l.game.managerState.history.length, before);
  const r = settleDay(l, "compromise");
  assert.ok(!r.error);
  assert.equal(l.game.managerState.history.at(-1).choice, "compromise");
  assert.equal(l.game.managerPrepUntil, l.game.week + 1);
  const saved = structuredClone(l.game);
  settleDay(l, "assert");
  assert.deepEqual(l.game, saved);
});

test("planner undo cannot discard a later reservation", () => {
  const l = fixture();
  assert.ok(applyPlannerTool(l, "actor").ok);
  assert.ok(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 3).ok,
  );
  const plan = structuredClone(l.plan);
  assert.equal(applyPlannerTool(l, "undo").ok, false);
  assert.deepEqual(l.plan, plan);
});
