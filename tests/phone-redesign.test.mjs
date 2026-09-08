import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { meetNpc } from "../src/logic/npc-engine.js";
import { shortContact } from "../src/logic/short-contact.js";
import {
  CONTACT_TOPICS,
  openConversation,
  conversationMessages,
} from "../src/logic/conversations.js";
import { toggleCommunityLike } from "../src/logic/community-likes.js";
import {
  forumReaction,
  forumReplyText,
} from "../src/logic/community-interactions.js";
import { allThreads, repliesFor } from "../src/logic/forum-feed.js";
import { forumApp } from "../src/views/forum.js";
import { npcApp } from "../src/views/npc.js";
import { resolveScheduledJobAudition } from "../src/logic/job-engine.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { setSeed } from "../src/core/rng.js";
import {
  initialLife,
  CHOICES,
  beginDay,
  settleDay,
  normalizeLife,
  arriveAt,
} from "../src/pixel/life.js";
import { careerCommand, bookCareer } from "../src/pixel/career.js";

test("conversation read receipts are per contact; topic messages retain both sides without spending a day", () => {
  resetState();
  meetNpc("guchengxi");
  meetNpc("sufei");
  state.npcMessages.push(
    { id: "a", npcId: "guchengxi", text: "一", read: false },
    { id: "b", npcId: "sufei", text: "二", read: false },
  );
  const before = {
    money: state.money,
    schedule: structuredClone(state.schedule),
    week: state.week,
  };
  assert.equal(openConversation("unknown"), false);
  assert.deepEqual(conversationMessages("unknown"), []);
  assert.equal(openConversation("guchengxi"), true);
  assert.equal(state.npcMessages.find((m) => m.id === "a").read, true);
  assert.equal(state.npcMessages.find((m) => m.id === "b").read, false);
  assert.equal(shortContact("guchengxi", "message", "care").ok, true);
  const record = state.npcMessages.at(-1);
  assert.equal(record.outgoingText, CONTACT_TOPICS.care.text);
  assert.ok(record.text.length > 10);
  assert.equal(shortContact("guchengxi", "call", "work").ok, true);
  const snapshot = structuredClone(state);
  hydrateState(snapshot);
  assert.equal(shortContact("guchengxi", "message", "day").ok, false);
  assert.equal(state.shortContacts.length, 2);
  assert.deepEqual(
    { money: state.money, schedule: state.schedule, week: state.week },
    before,
  );
  assert.equal(state.npcMessages.at(-1).outgoingText, CONTACT_TOPICS.work.text);
});
test("hearts toggle reversibly and persist without farming relationship or reputation rewards", () => {
  resetState();
  meetNpc("guchengxi");
  const thread = allThreads()[0],
    reply = repliesFor(thread)[0];
  const before = {
    rep: structuredClone(state.rep),
    relationships: structuredClone(state.relationships),
  };
  for (const [kind, id] of [
    ["social", "npc-guchengxi-1"],
    ["forum", thread.id],
    ["forum", reply.id],
  ]) {
    assert.equal(toggleCommunityLike(kind, id).liked, true);
    assert.equal(toggleCommunityLike(kind, id).liked, false);
    assert.equal(toggleCommunityLike(kind, id).liked, true);
  }
  hydrateState(structuredClone(state));
  assert.deepEqual(state.likedForumItems, [thread.id, reply.id]);
  assert.deepEqual(state.likedSocialPosts, ["npc-guchengxi-1"]);
  assert.deepEqual(
    { rep: state.rep, relationships: state.relationships },
    before,
  );
  assert.equal(toggleCommunityLike("forum", "invented").ok, false);
});
test("forum replies render the exact preview once and ignore does not pretend to post", () => {
  resetState();
  state.name = "小星";
  const thread = allThreads()[0];
  state.forumThread = thread.id;
  assert.equal(forumReaction(thread.id, "reason").ok, true);
  assert.equal(state.forumComments.length, 1);
  assert.equal(state.forumComments[0].text, forumReplyText(thread, "reason"));
  const reputation = structuredClone(state.rep);
  assert.equal(forumReaction(thread.id, "join").ok, false);
  assert.deepEqual(state.rep, reputation);
  assert.match(forumApp(), /own-reply/);
  hydrateState(structuredClone(state));
  assert.equal(state.forumComments.length, 1);
  const second = allThreads()[1];
  state.forumThread = second.id;
  assert.equal(forumReaction(second.id, "ignore").ok, true);
  assert.equal(state.forumComments.length, 1);
  assert.match(forumApp(), /沒有送出你的留言/);
  assert.doesNotMatch(forumApp(), /own-reply/);
  assert.equal(forumReaction("forged", "reason").ok, false);
});
test("old first-meeting memories display the event week and profiles separate actions from background", () => {
  resetState();
  meetNpc("guchengxi");
  state.selectedNpc = "guchengxi";
  state.relationships.guchengxi.metWeek = 2;
  state.relationships.guchengxi.firstMet = { week: 2 };
  state.sharedMemories = [
    {
      npcId: "guchengxi",
      type: "first_meeting",
      week: 3,
      title: "第一次見面",
      text: "你們在第 2 週第一次真正認識。",
    },
  ];
  state.npcProfileTab = "overview";
  assert.match(npcApp(), /npc-quick-actions/);
  assert.match(npcApp(), /data-npc-interact="personal"/);
  assert.doesNotMatch(npcApp(), /npc-info-section/);
  state.npcProfileTab = "relationship";
  assert.match(npcApp(), /data-npc-interact/);
  assert.doesNotMatch(npcApp(), /npc-info-section/);
  state.npcProfileTab = "memories";
  assert.match(npcApp(), /第 2 週・相處紀錄/);
  assert.doesNotMatch(npcApp(), /第 3 週・相處紀錄/);
  state.npcProfileTab = "about";
  assert.match(npcApp(), /基本資料/);
  assert.doesNotMatch(npcApp(), /data-npc-interact/);
});
test("audition results use the actual verdict and one location, with coherent passed and failed records", () => {
  const job = JOB_CATALOG.find((j) => j.stars === 1 && j.category === "歌曲");
  assert.ok(job);
  const seen = new Set();
  for (let seed = 0; seed < 50 && seen.size < 2; seed++) {
    resetState();
    setSeed(`phone-${seed}`);
    state.activeJobs[job.id] = {
      jobId: job.id,
      stage: "audition",
      storyHistory: [],
    };
    const r = resolveScheduledJobAudition(
      { payload: { jobId: job.id } },
      "bold",
    );
    assert.equal(r.ok, true);
    seen.add(r.audition.passed);
    assert.equal(r.audition.venue, job.audition.venue);
    assert.equal(r.audition.work, job.title);
    assert.equal(
      r.audition.choice.includes(job.audition.choices[1].label),
      true,
    );
    assert.equal(r.text.split(job.audition.venue).length - 1, 1);
    assert.doesNotMatch(r.text, /機會評估|值得一試|結果到了/);
    assert.equal(Boolean(r.jobOfferId), r.audition.passed);
    assert.match(r.text, r.audition.passed ? /試鏡通過/ : /這次未獲選/);
    assert.equal(
      resolveScheduledJobAudition({ payload: { jobId: job.id } }, "bold").ok,
      false,
    );
  }
  assert.equal(seen.size, 2);
});
test("pixel audition ledger retains the structured result across reload and settles only once", () => {
  const l = initialLife("career-0");
  l.game.money = 100000;
  l.game.stats = Object.fromEntries(
    Object.keys(l.game.stats).map((k) => [k, 350]),
  );
  l.game.trainingSessionsCompleted = 20;
  const job = JOB_CATALOG.find((j) => j.stars === 1 && j.category === "電視劇");
  arriveAt(l, "tv");
  assert.equal(careerCommand(l, "apply-job", job.id).ok, true);
  assert.equal(
    bookCareer(l, CHOICES, "audition", { jobId: job.id }, 0).ok,
    true,
  );
  beginDay(l);
  const result = settleDay(l, "steady");
  assert.ok(result.presentation.audition);
  assert.ok(result.presentation.audition.work);
  assert.equal(
    result.notes.some((n) => n.includes("機會評估")),
    false,
  );
  const restored = normalizeLife(structuredClone(l));
  assert.deepEqual(
    restored.pending.result.presentation.audition,
    result.presentation.audition,
  );
  assert.deepEqual(settleDay(restored, "steady"), result);
  assert.equal(restored.ledger.length, 1);
});
test("player-written messages and forum posts are escaped, bounded, and preserve their exact text", () => {
  resetState();
  meetNpc("guchengxi");
  assert.equal(shortContact("guchengxi", "message", "day", "  ").ok, false);
  assert.equal(
    shortContact("guchengxi", "message", "day", "字".repeat(201)).ok,
    false,
  );
  const text = "今天排練辛苦了！<b>記得吃飯</b>";
  assert.equal(shortContact("guchengxi", "message", "day", text).ok, true);
  assert.equal(state.npcMessages.at(-1).outgoingText, text);
  const thread = allThreads()[0];
  state.forumThread = thread.id;
  assert.equal(forumReaction(thread.id, "custom", "  ").ok, false);
  assert.equal(forumReaction(thread.id, "custom", "字".repeat(401)).ok, false);
  assert.equal(forumReaction(thread.id, "custom", text).ok, true);
  assert.equal(state.forumComments.at(-1).text, text);
  assert.match(forumApp(), /&lt;b&gt;記得吃飯&lt;\/b&gt;/);
  assert.doesNotMatch(forumApp(), /<b>記得吃飯<\/b>/);
});
