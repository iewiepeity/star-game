import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { qualification } from "../src/logic/job-engine.js";
import { roleRequirements } from "../src/logic/work-profile.js";
import {
  weeklyTaskCounts,
  weeklyTaskReady,
  evaluateWeeklyTask,
} from "../src/logic/weekly-task.js";
import { shortContact, queueShortCheckIn } from "../src/logic/short-contact.js";
import { meetNpc } from "../src/logic/npc-engine.js";
import {
  romanceOpportunity,
  romanceProgress,
} from "../src/logic/romance-engine.js";
import { requestRomanceConversation } from "../src/logic/npc-storylines.js";
import {
  strongestRomance,
  maybeQueueMediaEvent,
} from "../src/logic/media-engine.js";
import {
  obsoleteMediaEvent,
  activateNextEvent,
} from "../src/logic/event-queue.js";
import { applyEffects } from "../src/logic/event-engine.js";
import { setSeed } from "../src/core/rng.js";
import { socialDrafts } from "../src/logic/social-drafts.js";
import {
  npcSocialPost,
  contextualReplyOptions,
} from "../src/logic/social-context.js";
import { replyToNpcPost } from "../src/logic/community-interactions.js";
import { allThreads } from "../src/views/forum.js";
const fresh = () => {
  resetState();
  state.schedule = Array(7).fill("rest");
  state.week = 10;
  state.money = 100000;
};
test("三星角色主能力降到可銜接區間，副能力落後仍能試鏡，主能力不足仍擋住", () => {
  fresh();
  const job = JOB_CATALOG.find((j) => j.title.includes("錯過的月臺"));
  const req = roleRequirements(job);
  assert.ok(req[0][1] <= 400);
  state.trainingSessionsCompleted = 100;
  state.stats[req[0][0]] = req[0][1] + 30;
  for (const [name] of req.slice(1)) state.stats[name] = 0;
  assert.equal(qualification(job).met, true);
  assert.ok(
    qualification(job)
      .rows.slice(1)
      .every((r) => !r.core && !r.met),
  );
  state.stats[req[0][0]] = 0;
  assert.equal(qualification(job).met, false);
});
test("每週預覽與結算計入經紀人、落選試鏡與創作，取消的活動不計", () => {
  fresh();
  const kinds = ["manager_interact", "job_audition", "creative_work"];
  kinds.forEach((kind, day) => {
    state.schedule[day] = "personal_task";
    state.scheduledActivities[`a${day}`] = {
      id: `a${day}`,
      week: 10,
      day,
      kind,
      status: "scheduled",
    };
  });
  assert.equal(weeklyTaskCounts(true).work, 3);
  assert.equal(weeklyTaskCounts().work, 0);
  state.weekResults = kinds.map((_, dayIndex) => ({ dayIndex, success: true }));
  Object.values(state.scheduledActivities).forEach(
    (t) => (t.status = "completed"),
  );
  assert.equal(weeklyTaskCounts().work, 3);
  assert.equal(weeklyTaskReady(weeklyTaskCounts()), true);
  const money = state.money;
  assert.equal(evaluateWeeklyTask().met, true);
  evaluateWeeklyTask();
  assert.equal(state.money, money + 1500);
  state.scheduledActivities.a1.status = "cancelled";
  assert.equal(weeklyTaskCounts().work, 2);
});
test("中期可以用一項職涯與兩天生活完成目標，純休息或超疲勞不發獎", () => {
  fresh();
  assert.equal(weeklyTaskReady({ work: 1, life: 2, train: 0 }), true);
  assert.equal(weeklyTaskReady({ work: 0, life: 7, train: 0 }), false);
  state.week = 2;
  assert.equal(weeklyTaskReady({ work: 1, life: 2, train: 0 }), false);
  state.week = 10;
  state.schedule[0] = "newcomer_gig";
  state.weekResults = [0, 1, 2].map((dayIndex) => ({
    dayIndex,
    success: true,
  }));
  state.fatigue = 61;
  assert.equal(evaluateWeeklyTask().met, false);
});
test("電話訊息不占一天、不改金錢與 RNG，限制與紀錄跨讀檔保存", () => {
  fresh();
  meetNpc("guchengxi");
  const before = JSON.stringify([
    state.schedule,
    state.week,
    state.money,
    state.rngCursor,
  ]);
  assert.equal(shortContact("guchengxi", "call").ok, true);
  assert.equal(shortContact("guchengxi").ok, true);
  hydrateState(structuredClone(state));
  assert.equal(shortContact("guchengxi", "call").ok, false);
  assert.equal(
    JSON.stringify([state.schedule, state.week, state.money, state.rngCursor]),
    before,
  );
  assert.equal(state.relationships.guchengxi.lastInteractionWeek, 10);
  state.relationships.guchengxi.hostility = 50;
  state.week++;
  assert.equal(shortContact("guchengxi").ok, false);
});
test("朋友主動短訊息每週至多一次，不自動增加感情", () => {
  fresh();
  meetNpc("guchengxi");
  state.relationships.guchengxi.closeness = 50;
  const before = state.relationships.guchengxi.affection;
  assert.equal(queueShortCheckIn(), true);
  assert.equal(queueShortCheckIn(), false);
  assert.equal(state.relationships.guchengxi.affection, before);
});
test("居中溝通不封鎖感情，友情滿值仍說明心意差異；可重開已準備好的談話", () => {
  fresh();
  meetNpc("guchengxi");
  meetNpc("shenyao");
  state.completedWorks = [{ id: "w1" }];
  Object.assign(state.relationships.guchengxi, {
    romance: "ambiguous",
    closeness: 100,
    trust: 100,
    affection: 40,
  });
  applyEffects([
    { npc: "guchengxi", trust: 5, relation: 2 },
    { npc: "shenyao", trust: 5, relation: 2 },
  ]);
  assert.equal(romanceOpportunity("guchengxi"), null);
  assert.match(romanceProgress("guchengxi"), /友情與信任不等於/);
  state.relationships.guchengxi.affection = 70;
  state.npcStoryHistory = ["guchengxi:romance:ambiguous:0"];
  assert.equal(romanceOpportunity("guchengxi").next, "dating");
  assert.equal(requestRomanceConversation("guchengxi").ok, true);
  assert.equal(requestRomanceConversation("guchengxi").ok, false);
});
test("媒體承認正式關係會公開並去除同類舊問題，曖昧承認不強制交往", () => {
  fresh();
  meetNpc("guchengxi");
  Object.assign(state.relationships.guchengxi, {
    romance: "dating",
    affection: 90,
    visibility: "underground",
  });
  state.partnerId = "guchengxi";
  state.fame = 500;
  state.cityLife.appointments.push({
    id: "actual-date",
    npcId: "guchengxi",
    status: "completed",
    photoConsent: true,
  });
  state.cityLife.photos.push({
    id: "actual-photo",
    appointmentId: "actual-date",
    npcId: "guchengxi",
    day: (state.week - 1) * 7,
    published: true,
  });
  let event;
  for (let seed = 1; seed < 100 && !event; seed++) {
    state.eventQueue = [];
    state.queuedEvents = [];
    state.rumors = [];
    setSeed(seed);
    maybeQueueMediaEvent();
    event = state.eventQueue.find((x) => x.event.mediaRomanceNpc)?.event;
  }
  assert.ok(event);
  applyEffects(event.choices.find((c) => c.id === "honest").effects);
  assert.equal(state.relationships.guchengxi.visibility, "public");
  assert.equal(strongestRomance(), null);
  assert.equal(obsoleteMediaEvent(event), true);
  state.eventQueue = [{ event }];
  assert.equal(activateNextEvent(), null);
  state.relationships.guchengxi.romance = "ambiguous";
  state.relationships.guchengxi.visibility = "private";
  state.partnerId = null;
  assert.equal(strongestRomance(), null);
  assert.equal(state.relationships.guchengxi.romance, "ambiguous");
});
test("貼文與回應跟隨週次與情境，回覆有本人接話且不能重複刷", () => {
  fresh();
  meetNpc("guchengxi");
  const texts = new Set(),
    drafts = new Set();
  for (let w = 10; w < 18; w++) {
    state.week = w;
    texts.add(npcSocialPost("guchengxi").text);
    drafts.add(socialDrafts().daily.text);
  }
  assert.equal(texts.size, 8);
  assert.equal(drafts.size, 8);
  const reply = contextualReplyOptions("guchengxi").care;
  assert.equal(replyToNpcPost("guchengxi", "care").ok, true);
  assert.ok(state.npcMessages.some((m) => m.text === reply.reply));
  assert.equal(replyToNpcPost("guchengxi", "care").ok, false);
});
test("論壇過期文章退到歷史區、真實新事件置頂，刷新不偽造消息", () => {
  fresh();
  state.week = 60;
  state.weekResults = [];
  state.industryNews = [];
  const communityIds = allThreads().map(thread => thread.id);
  assert.equal(communityIds.length, 5);
  assert.ok(communityIds.every(id => id.startsWith("community-")));
  state.industryNews = [
    { id: "old", week: 1, title: "舊作品", body: "old" },
    { id: "new", week: 60, title: "新作品", body: "new" },
  ];
  assert.deepEqual(
    allThreads().map((t) => t.id),
    ["news-new", ...communityIds],
  );
  state.forumRefresh += 3;
  assert.deepEqual(
    allThreads().map((t) => t.id),
    ["news-new", ...communityIds],
  );
  state.forumArchive = true;
  assert.ok(allThreads().some((t) => t.id === "news-old"));
});

test("舊檔承認戀情只修復一次，不重發獎勵也不覆蓋後來的私人選擇", () => {
  fresh();
  meetNpc("guchengxi");
  Object.assign(state.relationships.guchengxi, {
    romance: "dating",
    visibility: "underground",
  });
  state.rumors = [{ id: "old-rumor", npcId: "guchengxi", response: "confirm" }];
  const money = state.money,
    fans = state.fans;
  hydrateState(structuredClone(state));
  assert.equal(state.relationships.guchengxi.visibility, "public");
  assert.equal(state.fans, fans);
  assert.equal(state.money, money);
  state.relationships.guchengxi.visibility = "underground";
  hydrateState(structuredClone(state));
  assert.equal(state.relationships.guchengxi.visibility, "underground");
});
