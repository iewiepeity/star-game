import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { meetNpc, adjustRelationship } from "../src/logic/npc-engine.js";
import {
  transitionRomance,
  setRomanceVisibility,
} from "../src/logic/romance-engine.js";
import {
  matchesConditions,
  applyEffects,
  resolveEvent,
} from "../src/logic/event-engine.js";
import {
  initialLife,
  recordMeeting,
  beginDay,
  settleDay,
  CHOICES,
  withCore,
  normalizeLife,
  newProject,
} from "../src/pixel/life.js";
import { bookCareer, careerDecision } from "../src/pixel/career.js";
import { weeklyTaskCounts } from "../src/logic/weekly-task.js";
import { forumReaction } from "../src/logic/community-interactions.js";
import { allThreads } from "../src/logic/forum-feed.js";

function partner() {
  resetState();
  meetNpc("jiqing");
  adjustRelationship("jiqing", { closeness: 80, trust: 80, affection: 80 });
  for (const stage of ["interested", "ambiguous", "dating"])
    assert.equal(transitionRomance("jiqing", stage).ok, true);
}
function appointment(type = "meal") {
  const life = initialLife("audit-appointment");
  recordMeeting(life, "sufei");
  assert.equal(
    bookCareer(life, CHOICES, "npc", { npcId: "sufei", type }, 0).ok,
    true,
  );
  return life;
}

test("公開戀情只給一次曝光獎勵，切換與讀檔不能重複領取", () => {
  partner();
  assert.equal(setRomanceVisibility("jiqing", "public").ok, true);
  const fans = state.fans,
    buzz = state.rep.話題度;
  setRomanceVisibility("jiqing", "underground");
  hydrateState(structuredClone(state));
  assert.equal(setRomanceVisibility("jiqing", "public").ok, true);
  assert.equal(state.fans, fans);
  assert.equal(state.rep.話題度, buzz);
});

test("嚴重衝突分手同步清除公開伴侶狀態", () => {
  partner();
  setRomanceVisibility("jiqing", "public");
  adjustRelationship("jiqing", { hostility: 50, source: "失信" });
  assert.equal(state.partnerId, null);
  assert.equal(state.relationships.jiqing.romance, "broken");
  assert.equal(state.relationships.jiqing.visibility, "private");
});

test("條件判定使用傳入存檔的能力與服裝，不受另一份核心狀態污染", () => {
  resetState();
  const game = structuredClone(state);
  game.stats.演技 = 0;
  game.outfitId = "newcomer";
  state.stats.演技 = 1000;
  assert.equal(matchesConditions({ stats: { 演技: 500 } }, game), false);
  game.stats.演技 = 800;
  state.stats.演技 = 0;
  assert.equal(matchesConditions({ stats: { 演技: 500 } }, game), true);
});

test("隱藏能力為零時增加一點就是一點，不重設成五百", () => {
  resetState();
  state.hidden.共情 = 0;
  state.hidden.品德 = 0;
  applyEffects({ hidden: "共情", value: 1, hidden2: "品德", hiddenValue2: 2 });
  assert.equal(state.hidden.共情, 1);
  assert.equal(state.hidden.品德, 2);
});

test("事件結算重播不重複給獎，全部選項鎖定也不能自動結算", () => {
  resetState();
  const event = { id: "audit-once", title: "一次收入", effect: { money: 100 } };
  resolveEvent(event);
  const money = state.money;
  resolveEvent(event);
  assert.equal(state.money, money);
  const locked = {
    id: "audit-locked",
    effect: { money: 100 },
    choices: [{ id: "buy", requires: { moneyMin: money + 1 } }],
  };
  assert.equal(resolveEvent(locked)?.pending, true);
  assert.equal(state.money, money);
  assert.equal(
    state.eventHistory.some((e) => e.id === locked.id),
    false,
  );
});

test("NPC 相處必須確認有效選項，未選擇不能扣款或消耗一天", () => {
  const life = appointment();
  beginDay(life);
  const before = structuredClone(life.game);
  const result = settleDay(life, "not-a-choice");
  assert.equal(result.pending, true);
  assert.equal(life.ledger.length, 0);
  assert.equal(life.game.money, before.money);
  assert.equal(life.game.stamina, before.stamina);
  const choice = careerDecision(life, life.plan[0]).choices[0].id;
  const completed = settleDay(life, choice);
  assert.equal(completed.success, true);
  assert.equal(life.game.money, before.money - 700);
  const restored = normalizeLife(life);
  assert.deepEqual(settleDay(restored, choice), completed);
  assert.equal(restored.game.money, before.money - 700);
});

test("邀約後關係惡化，失敗行程不算生活目標，也不完成 NPC 檔期", () => {
  const life = appointment();
  life.game.relationships.sufei.hostility = 75;
  beginDay(life);
  const choice = careerDecision(life, life.plan[0]).choices[0].id;
  const taskId = life.plan[0].taskId;
  const before = life.game.money;
  const result = settleDay(life, choice);
  assert.equal(result.success, false);
  assert.equal(life.game.money, before);
  assert.equal(life.game.weekResults[0].success, false);
  assert.equal(life.game.scheduledActivities[taskId].status, "failed");
  assert.equal(
    life.game.npcSchedules.sufei.find((s) => s.jobId === taskId).status,
    "released",
  );
  assert.equal(withCore(life, () => weeklyTaskCounts()).life, 0);
});

test("像素快捷社群與創作實際完成後納入每週養成目標", () => {
  const life = initialLife("audit-social");
  beginDay(life, { id: "social" });
  settleDay(life);
  assert.equal(withCore(life, () => weeklyTaskCounts()).life, 1);
  const creative = initialLife("audit-creative");
  const project = newProject(creative, "song", "每天寫一點");
  beginDay(creative, { id: "creative", projectId: project.id });
  settleDay(creative);
  assert.equal(withCore(creative, () => weeklyTaskCounts()).work, 1);
});

test("論壇無效回應型別不能造成例外或污染聲望", () => {
  resetState();
  const thread = allThreads()[0];
  const rep = structuredClone(state.rep);
  for (const type of ["__proto__", "constructor", "toString"]) {
    assert.equal(forumReaction(thread.id, type).ok, false);
  }
  assert.deepEqual(state.rep, rep);
});

test("職涯路線條件也必須讀取指定的存檔", () => {
  resetState();
  const game = structuredClone(state);
  game.careerProgress = { 電影: 1000 };
  state.careerProgress = { 歌曲: 1000 };
  assert.equal(matchesConditions({ careerRoute: "電影演員" }, game), true);
  assert.equal(matchesConditions({ careerRoute: "唱作歌手" }, game), false);
});

test("已排製作日不能臨時增刪團隊導致 NPC 無檔期演出或殘留占位", async () => {
  const { createCreativeProject } = await import("../src/logic/creative.js");
  const { toggleCreativeCollaborator, reserveCreativeTeam } =
    await import("../src/logic/creative-team.js");
  resetState();
  meetNpc("tangtang");
  adjustRelationship("tangtang", { closeness: 30, trust: 30 });
  const p = createCreativeProject("song", "合作檔期");
  Object.assign(p, { status: "contracted", category: "歌曲" });
  assert.equal(toggleCreativeCollaborator(p.id, "tangtang").ok, true);
  assert.equal(reserveCreativeTeam(p, 1, 2).ok, true);
  const before = structuredClone(state.npcSchedules);
  assert.equal(toggleCreativeCollaborator(p.id, "tangtang").ok, false);
  assert.deepEqual(p.team, ["tangtang"]);
  assert.deepEqual(state.npcSchedules, before);
});

test("共演檔期不預約已過去的日子，舊的過期預約會移到未來空檔", async () => {
  const { reserveNpcJobSchedule, refreshNpcJobSchedule } =
    await import("../src/logic/npc-ecosystem.js");
  resetState();
  state.weekResults = [
    { dayIndex: 0, success: true },
    { dayIndex: 1, success: true },
  ];
  const job = { id: "audit-job", workDays: [0, 1, 2, 3, 4], sessions: 2 };
  const record = { npcCast: ["sufei"], remainingSessions: 2, deadlineWeek: 2 };
  assert.equal(reserveNpcJobSchedule(job, record).ok, true);
  assert.deepEqual(
    record.npcScheduleSlots.map((s) => s.day),
    [2, 3],
  );
  state.weekResults.push({ dayIndex: 2, success: false });
  refreshNpcJobSchedule(job, record);
  assert.equal(
    record.npcScheduleSlots.find((s) => s.day === 2).status,
    "released",
  );
  assert.deepEqual(
    record.npcScheduleSlots
      .filter((s) => s.status === "reserved")
      .map((s) => s.day),
    [3, 4],
  );
});

test("海外行程不能零元執行，獎勵不超過聲望上限", async () => {
  const { resolveOverseasVisit } = await import("../src/logic/overseas.js");
  resetState();
  state.week = 53;
  state.fame = 80;
  state.completedWorks = [{}, {}, {}];
  state.money = 4999;
  const before = structuredClone(state);
  assert.equal(resolveOverseasVisit("festival").ok, false);
  assert.deepEqual(state, before);
  state.money = 5000;
  state.rep.業界評價 = 999;
  assert.equal(resolveOverseasVisit("festival").ok, true);
  assert.equal(state.money, 0);
  assert.equal(state.rep.業界評價, 1000);
});

test("戀愛引擎實際結算也要檢查好感與交往週數", () => {
  resetState();
  meetNpc("jiqing");
  assert.equal(transitionRomance("jiqing", "interested").ok, false);
  partner();
  Object.assign(state.relationships.jiqing, {
    affection: 100,
    closeness: 100,
    trust: 100,
  });
  assert.equal(transitionRomance("jiqing", "committed").ok, false);
  state.week += 8;
  assert.equal(transitionRomance("jiqing", "committed").ok, false);
  state.characterMemories = { jiqing: { bonds: ["care"] } };
  assert.equal(transitionRomance("jiqing", "committed").ok, true);
});

test("戀愛談話排入後失去資格，不可顯示成功告白並偷偷給獎", async () => {
  const { requestRomanceConversation } =
    await import("../src/logic/npc-storylines.js");
  const { availableChoices } = await import("../src/logic/event-engine.js");
  resetState();
  meetNpc("jiqing");
  adjustRelationship("jiqing", { closeness: 80, trust: 80, affection: 80 });
  state.eventQueue = [];
  state.queuedEvents = [];
  assert.equal(requestRomanceConversation("jiqing").ok, true);
  const event = [...state.eventQueue, ...state.queuedEvents].find(
    (x) => x.event.kind === "戀愛事件",
  ).event;
  state.relationships.jiqing.affection = 0;
  const before = structuredClone(state.relationships.jiqing);
  assert.equal(
    availableChoices(event).some((c) => c.id === "yes"),
    false,
  );
  assert.equal(resolveEvent(event, "yes").pending, true);
  assert.deepEqual(state.relationships.jiqing, before);
  assert.equal(
    state.eventHistory.some((e) => e.id === event.id),
    false,
  );
  assert.ok(resolveEvent(event, "later"));
});

test("取消製作檔期後可移除失和夥伴，但不能重新邀入", async () => {
  const { createCreativeProject } = await import("../src/logic/creative.js");
  const {
    toggleCreativeCollaborator,
    reserveCreativeTeam,
    releaseCreativeTeam,
    eligibleCreativeCollaborators,
  } = await import("../src/logic/creative-team.js");
  resetState();
  meetNpc("tangtang");
  adjustRelationship("tangtang", { closeness: 30, trust: 30 });
  const p = createCreativeProject("song", "重新排期");
  Object.assign(p, { status: "contracted", category: "歌曲" });
  assert.equal(toggleCreativeCollaborator(p.id, "tangtang").ok, true);
  reserveCreativeTeam(p, 1, 2);
  state.relationships.tangtang.hostility = 50;
  assert.ok(eligibleCreativeCollaborators(p).some((x) => x.id === "tangtang"));
  releaseCreativeTeam(p.id, 1, 2);
  assert.equal(toggleCreativeCollaborator(p.id, "tangtang").ok, true);
  assert.deepEqual(p.team, []);
  assert.equal(toggleCreativeCollaborator(p.id, "tangtang").ok, false);
});

test("排程預覽包含快捷創作與社群，預覽本身不給獎", async () => {
  const { weeklyFocusMarkup } = await import("../src/pixel/planner-tools.js");
  const { planDay } = await import("../src/pixel/life.js");
  const life = initialLife("audit-plan-preview");
  for (let day = 0; day < 7; day++) planDay(life, day, { id: "rest" });
  const p = newProject(life, "song", "預定寫的歌");
  planDay(life, 0, { id: "creative", projectId: p.id });
  planDay(life, 1, { id: "social" });
  const money = life.game.money;
  const markup = weeklyFocusMarkup(life);
  assert.match(markup, /依目前安排：訓練 0・職涯 1・生活 6・探訪 0/);
  assert.equal(life.game.money, money);
  assert.equal(life.game.weekResults.length, 0);
});
