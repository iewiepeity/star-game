import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { initialLife, CHOICES, newProject, recordMeeting, beginDay, settleDay, advanceDay, planDay, normalizeLife } from "../src/pixel/life.js";
import { bookCareer, careerCommand } from "../src/pixel/career.js";
import { applyPlannerTool } from "../src/pixel/planner-tools.js";
import { cityBookingProblem } from "../src/pixel/city-schedule.js";
import { recoveryRequired } from "../src/pixel/recovery-period.js";
import { remainingPlanCost } from "../src/pixel/ux-summaries.js";

function fresh() {
  const life = initialLife("reservation-recovery");
  life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  life.game.money = 100000;
  return life;
}

test("新增創作保留既有人物邀約與 NPC 檔期，讀檔後亦一致", () => {
  const life = fresh();
  recordMeeting(life, "sufei");
  assert.ok(bookCareer(life, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 1).ok);
  const original = structuredClone(life.plan[1]);
  const p = newProject(life, "song", "草稿");
  assert.ok(bookCareer(life, CHOICES, "creative_work", { projectId: p.id }, 2).ok);
  for (const copy of [life, normalizeLife(life)]) {
    assert.deepEqual(copy.plan[1], original);
    assert.equal(copy.game.scheduledActivityIds[1], original.taskId);
    assert.equal(copy.game.scheduledActivities[original.taskId].status, "scheduled");
    assert.equal(copy.game.npcSchedules.sufei.find(s => s.jobId === original.taskId).status, "reserved");
  }
});

test("連排製作日全部保留，可執行且只收一次製作預算", () => {
  const life = fresh();
  const p = newProject(life, "song", "連排製作");
  life.game.creativeProjects[0].status = "ready";
  assert.ok(careerCommand(life, "independent", p.id).ok);
  for (const day of [0, 1, 2]) assert.ok(bookCareer(life, CHOICES, "creative_production", { projectId: p.id }, day).ok);
  assert.ok(life.plan.slice(0, 3).every(a => a.id === "career_task"));
  assert.equal(remainingPlanCost(life), 3500);
  const money = life.game.money;
  for (let i = 0; i < 2; i++) {
    assert.ok(!beginDay(life).error);
    assert.equal(settleDay(life).success, true);
    advanceDay(life);
  }
  assert.equal(life.game.creativeProjects[0].productionSessions, 2);
  assert.equal(life.game.money, money - life.game.creativeProjects[0].budgetSpent);
  assert.equal(remainingPlanCost(life), 0);
});

test("不同作品各計一次製作費，不把兩份預算合併", () => {
  const life = fresh();
  for (let i = 0; i < 2; i++) {
    const p = newProject(life, "song", `作品${i}`);
    life.game.creativeProjects.find(x => x.id === p.id).status = "ready";
    careerCommand(life, "independent", p.id);
    for (const day of [i * 2, i * 2 + 1]) assert.ok(bookCareer(life, CHOICES, "creative_production", { projectId: p.id }, day).ok);
  }
  assert.equal(remainingPlanCost(life), 7000);
});

test("新增約定不改動已排正式通告，失敗安排完整回復", () => {
  const life = fresh();
  life.plan[1] = { id: "career_job", jobId: "J001" };
  life.game.activeJobs.J001 = { jobId: "J001", stage: "active", remainingSessions: 2, deadlineWeek: 3 };
  const p = newProject(life, "song", "保留工作");
  assert.ok(bookCareer(life, CHOICES, "creative_work", { projectId: p.id }, 2).ok);
  assert.deepEqual(life.plan[1], { id: "career_job", jobId: "J001" });
  assert.equal(life.game.scheduledJobIds[1], "J001");
  const before = structuredClone(life);
  assert.equal(bookCareer(life, CHOICES, "creative_work", { projectId: "missing" }, 3).ok, false);
  assert.deepEqual(life, before);
});

test("住院後課程、工作、助手與城市預約都不能繞過休養，讀檔仍受限", () => {
  const life = fresh();
  life.game.fatigue = 99;
  beginDay(life, { id: "acting" });
  settleDay(life);
  assert.equal(life.hospitalized, true);
  advanceDay(life);
  for (const copy of [life, normalizeLife(life)]) {
    assert.ok(planDay(copy, copy.day, { id: "acting" }));
    assert.equal(bookCareer(copy, CHOICES, "job", { jobId: "J001" }, copy.day).ok, false);
    assert.equal(applyPlannerTool(copy, "actor").ok, false);
    assert.match(cityBookingProblem(copy, "unused", "sufei", copy.day), /休養/);
    assert.equal(planDay(copy, copy.day, { id: "rest" }), "");
    beginDay(copy);
    assert.equal(settleDay(copy).success, true);
    advanceDay(copy);
    assert.ok(planDay(copy, copy.day, { id: "acting" }));
  }
});

test("休養涵蓋本週及下週，期限後恢復正常安排", () => {
  const life = fresh();
  life.game.forcedRestWeek = 2;
  assert.equal(recoveryRequired(life, 1), true);
  assert.equal(recoveryRequired(life, 2), true);
  assert.equal(recoveryRequired(life, 3), false);
  life.game.week = 2;
  assert.ok(planDay(life, 0, { id: "acting" }));
  life.game.week = 3;
  assert.equal(planDay(life, 0, { id: "acting" }), "");
});

function loader(options = {}) {
  const source = readFileSync(new URL("../src/pixel/main.js", import.meta.url), "utf8");
  const fn = source.slice(source.indexOf("async function replaceState("), source.indexOf("async function restore("));
  let release;
  const idle = new Promise(resolve => { release = resolve; });
  const writes = [];
  const makeState = id => ({ id, flags: { intro: true }, life: { game: {} } });
  const ctx = vm.createContext({ structuredClone, appearanceBusy: false, controller: { transitioning: false },
    state: makeState("original"), storage: { conflicted: false, error: "conflict", idle: () => idle,
      replace: async (next, previous) => { writes.push([next.id, previous.id]); return options.writeOK !== false; } },
    lifeUI: { takeover() {}, resumeNarrative() {} }, leaveOverlay() {}, world: { restoreRoom: async () => {} },
    recoveryBlocked: false, $: () => ({}), changed() {}, welcome() {}, narrate() {}, renderDialogue() {}, toast() {}, saves() {}, storageConflict() {}, recovery() {} });
  vm.runInContext(fn, ctx);
  return { ctx, release, writes, makeState };
}

test("原始讀檔函式在首次 await 前上鎖，連點只載入第一份且備份正確", async () => {
  const { ctx, release, writes, makeState } = loader();
  const first = ctx.replaceState(makeState("A"));
  await assert.rejects(ctx.replaceState(makeState("B")), /請等場景/);
  release();
  await first;
  assert.deepEqual(writes, [["A", "original"]]);
  assert.equal(ctx.state.id, "A");
  assert.equal(ctx.appearanceBusy, false);
  await ctx.replaceState(makeState("C"));
  assert.deepEqual(writes[1], ["C", "A"]);
});

test("等待期間其他分頁衝突不替換狀態，並釋放載入鎖", async () => {
  const { ctx, release, writes, makeState } = loader();
  const pending = ctx.replaceState(makeState("A"));
  ctx.storage.conflicted = true;
  release();
  await assert.rejects(pending, /conflict/);
  assert.equal(ctx.state.id, "original");
  assert.equal(ctx.appearanceBusy, false);
  assert.deepEqual(writes, []);
});

test("讀檔寫入失敗還原原狀態，釋放鎖後可重試", async () => {
  const { ctx, release, makeState } = loader({ writeOK: false });
  const pending = ctx.replaceState(makeState("A"));
  release();
  await assert.rejects(pending);
  assert.equal(ctx.state.id, "original");
  assert.equal(ctx.appearanceBusy, false);
  ctx.storage.replace = async () => true;
  await ctx.replaceState(makeState("B"));
  assert.equal(ctx.state.id, "B");
});

test("等待存檔失敗不替換進度且會解鎖", async () => {
  const { ctx, writes, makeState } = loader();
  ctx.storage.idle = async () => { throw new Error("storage unavailable"); };
  await assert.rejects(ctx.replaceState(makeState("A")), /storage unavailable/);
  assert.equal(ctx.state.id, "original");
  assert.equal(ctx.appearanceBusy, false);
  assert.deepEqual(writes, []);
});

test("場景載入失敗還原原進度、不寫入新存檔且會解鎖", async () => {
  const { ctx, release, writes, makeState } = loader();
  let attempts = 0;
  ctx.world.restoreRoom = async () => { if (++attempts === 1) throw new Error("scene unavailable"); };
  const pending = ctx.replaceState(makeState("A"));
  release();
  await assert.rejects(pending, /scene unavailable/);
  assert.equal(ctx.state.id, "original");
  assert.equal(ctx.appearanceBusy, false);
  assert.equal(attempts, 2);
  assert.deepEqual(writes, []);
});
