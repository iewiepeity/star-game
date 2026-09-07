import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { normalizeAgencyAgreements, AGENCY_RESOURCES, applyAgencyAgreementEffect, agencyOfferPolicy, agencyAgreementPrep, recordAgencyWorkDelivery, tickAgencyAgreements } from "../src/logic/agency-agreements.js";
import { refreshAgencyJobOffers } from "../src/logic/agency-offers.js";
import { ensureManager } from "../src/logic/manager.js";
import { normalizeWorkEchoes, tickWorkEchoes, applyWorkEchoEffect, releasedEchoWorks, activeWorkEchoOpportunity, workEchoAuditionBonus } from "../src/logic/work-echoes.js";
import { generateIndustryNews } from "../src/logic/industry-news.js";
import { allThreads } from "../src/logic/forum-feed.js";
import { npcSocialPost } from "../src/logic/social-context.js";
import { jobSource, canAccessJob } from "../src/logic/industry.js";
import { JOB_BY_ID } from "../src/data/jobs.js";
import { ensureJobState, resolveAudition } from "../src/logic/job-engine.js";
import { agencySignedDashboard } from "../src/views/agency.js";
import { AGENCIES } from "../src/data/agencies.js";
import { workEchoTimeline } from "../src/views/work-echoes.js";

function fresh(agency = "starlight") {
  resetState();
  state.week = 1; state.currentAgencyId = agency; state.agencySignedWeek = 1; state.agencyContractEndWeek = 104;
  state.knownPeople = ["jiqing"];
  ensureManager();
}
function work(values = {}) {
  const result = { id: "old-song", jobId: null, title: "很久以後的雨", category: "歌曲", quality: 85, completedWeek: 1, fans: 50, npcCast: ["jiqing"], ...values };
  state.completedWorks.push(result);
  return result;
}
const queue = () => [...(state.eventQueue || []), ...(state.queuedEvents || []), ...(state.activeEvent ? [state.activeEvent] : [])];

test("四家公司以不同資源兌現方向、休息與宣傳，不改玩家排程或先發收入", () => {
  for (const agency of Object.keys(AGENCY_RESOURCES)) {
    fresh(agency);
    const original = JSON.stringify({ schedule: state.schedule, money: state.money, fame: state.fame, fans: state.fans });
    const resource = AGENCY_RESOURCES[agency], category = resource.categories[0];
    assert.equal(applyAgencyAgreementEffect({ kind: "direction", category }).ok, true);
    assert.equal(agencyAgreementPrep({ category }), resource.prep);
    assert.equal(agencyOfferPolicy().category, category);
    assert.equal(applyAgencyAgreementEffect({ kind: "rest" }).ok, true);
    const offers = refreshAgencyJobOffers();
    assert.equal(offers.length, 1);
    assert.equal(JOB_BY_ID[offers[0].jobId].category, category);
    assert.ok(offers[0].expiresWeek >= state.week + resource.restExpiry + 1);
    assert.equal(applyAgencyAgreementEffect({ kind: "promotion", mode: "launch" }).ok, true);
    assert.equal(JSON.stringify({ schedule: state.schedule, money: state.money, fame: state.fame, fans: state.fans }), original);
    const actual = { id: "work-actual", title: "實際交付", completedWeek: 1, fans: 100 };
    assert.equal(recordAgencyWorkDelivery(actual), 0);
    state.completedWorks.push(actual);
    const bonus = Math.round(100 * resource.promotion);
    assert.equal(recordAgencyWorkDelivery(actual), bonus);
    assert.equal(recordAgencyWorkDelivery(actual), 0);
    assert.equal(state.fans, bonus);
    assert.match(agencySignedDashboard(AGENCIES[agency]), /實際交付.*已兌現宣傳/s);
    assert.deepEqual(normalizeAgencyAgreements(state.agencyAgreements), state.agencyAgreements);
    state.week = 5; tickAgencyAgreements();
    assert.equal(agencyAgreementPrep({ category }), 0);
    assert.equal(agencyOfferPolicy().limit, Infinity);
  }
});

test("非公司偏好先短期試行；同週不能反覆重談，換公司取消舊承諾", () => {
  fresh("mirror");
  const result = applyAgencyAgreementEffect({ kind: "direction", category: "歌曲" });
  assert.equal(result.record.trial, true);
  assert.equal(result.record.untilWeek, 2);
  assert.equal(agencyAgreementPrep({ category: "歌曲" }), 2);
  assert.equal(applyAgencyAgreementEffect({ kind: "direction", category: "廣告" }).ok, false);
  state.currentAgencyId = "clearvoice"; tickAgencyAgreements();
  assert.equal(agencyAgreementPrep({ category: "歌曲" }), 0);
  assert.equal(state.agencyAgreements.records[0].status, "cancelled");
});

test("作品三階段不漏跨週、不重複原創紀錄、讀檔不重排事件", () => {
  fresh();
  work({ id: "creative-demo", creativeProjectId: "demo", marketScore: 40 });
  state.creativeProjects = [{ id: "demo", title: "很久以後的雨", type: "song", status: "released", releaseWeek: 1, quality: 850, marketScore: 40 }];
  assert.equal(releasedEchoWorks().length, 1);
  state.week = 1; tickWorkEchoes(); assert.equal(state.workEchoes.records.length, 0);
  state.week = 60; tickWorkEchoes();
  assert.deepEqual(state.workEchoes.records.map(r => r.stage), ["opening", "weeks", "anniversary"]);
  assert.deepEqual(state.workEchoes.records.map(r => r.dueWeek), [2, 5, 53]);
  assert.equal(queue().length, 3);
  assert.ok(state.workEchoes.records[1].text.includes("重新提起"));
  assert.equal(state.characterMemories.jiqing.shared.length, 3);
  const before = JSON.stringify(state.workEchoes);
  hydrateState(JSON.parse(JSON.stringify(state)));
  tickWorkEchoes();
  assert.equal(queue().length, 3);
  assert.equal(JSON.stringify(state.workEchoes), before);
  assert.match(workEchoTimeline("creative-demo"), /隔年回看/);
  assert.deepEqual(normalizeWorkEchoes(state.workEchoes), state.workEchoes);
});

test("市場成功與自我不滿意可共存；公開論壇及NPC不偷知道內心選擇", () => {
  fresh();
  work({ marketScore: 90, fans: 300 });
  state.week = 60; tickWorkEchoes();
  assert.equal(applyWorkEchoEffect({ workId: "old-song", stage: "opening", choice: "mixed" }).ok, true);
  const chapter = state.workEchoes.records.find(r => r.stage === "weeks");
  assert.match(chapter.text, /亮眼的市場回應/);
  assert.match(chapter.text, /不滿意/);
  assert.ok(queue().find(e => e.event.id === chapter.id).event.text.includes("不滿意"));
  generateIndustryNews();
  const threads = allThreads().filter(t => t.workId === "old-song");
  assert.equal(threads.length, 3);
  assert.ok(threads.every(t => t.title.includes("很久以後的雨") && t.replies.every(r => r.includes("很久以後的雨"))));
  assert.ok(threads.every(t => !/不滿意|不甘心/.test(t.body)));
  const post = npcSocialPost("jiqing");
  assert.equal(post.workId, "old-song");
  assert.match(post.text, /隔了一年/);
  assert.doesNotMatch(post.text, /不滿意/);
  const unknown = npcSocialPost("sufei");
  assert.notEqual(unknown.workId, "old-song");
});

test("舊作推薦連到真通告，維持資格與手動排程，準備加成只在實際試鏡使用一次", () => {
  fresh();
  work(); state.week = 5; tickWorkEchoes();
  const before = JSON.stringify({ schedule: state.schedule, money: state.money, fans: state.fans, fame: state.fame });
  const result = applyWorkEchoEffect({ workId: "old-song", stage: "weeks", choice: "revisit" });
  assert.equal(result.ok, true); assert.ok(result.opportunity);
  const job = JOB_BY_ID[result.opportunity.jobId];
  assert.equal(job.category, "歌曲");
  assert.equal(jobSource(job).type, "legacy");
  assert.equal(canAccessJob(job).ok, true);
  assert.equal(workEchoAuditionBonus(job.id), 4);
  assert.equal(JSON.stringify({ schedule: state.schedule, money: state.money, fans: state.fans, fame: state.fame }), before);
  assert.equal(applyWorkEchoEffect({ workId: "old-song", stage: "weeks", choice: "revisit" }).ok, false);
  const record = ensureJobState(job.id); record.stage = "audition";
  assert.ok(resolveAudition(job.id, "steady"));
  assert.equal(activeWorkEchoOpportunity(job.id), null);
  assert.equal(workEchoAuditionBonus(job.id), 0);
  assert.equal(state.workEchoes.opportunities.length, 1);
});

test("實際通告完成與原創發行會兌現宣傳，正常存檔通過schema且重載不重領", async () => {
  const { completeJobSession } = await import("../src/logic/job-engine.js");
  const { createCreativeProject, releaseCreativeProject } = await import("../src/logic/creative.js");
  const { validateGameState } = await import("../src/core/save-schema.js");
  fresh();
  applyAgencyAgreementEffect({ kind: "promotion", mode: "steady" });
  assert.equal(agencyAgreementPrep(JOB_BY_ID.J001), 2);
  const before = state.fans;
  const record = ensureJobState("J001"); record.stage = "active";
  let jobResult;
  for (let i = 0; i < JOB_BY_ID.J001.sessions; i++) jobResult = completeJobSession("J001");
  assert.equal(jobResult.completed, true);
  assert.equal(state.fans, before + jobResult.work.fans + jobResult.work.agencyPromotion.fansBonus);
  assert.equal(state.agencyAgreements.records[0].deliveries.length, 1);
  const project = createCreativeProject("song", "公司答應的那首歌");
  Object.assign(project, { status: "ready_release", progress: 100, quality: 850, category: "歌曲", distributionMode: "independent" });
  const initial = state.fans;
  const release = releaseCreativeProject(project.id);
  assert.ok(release.work.agencyPromotion);
  assert.equal(state.fans, initial + release.fanGain);
  assert.equal(release.fanGain, release.work.fans + release.work.agencyPromotion.fansBonus);
  state.week = 5; tickWorkEchoes();
  assert.deepEqual(normalizeWorkEchoes(state.workEchoes), state.workEchoes);
  const validation = validateGameState(state);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const savedFans = state.fans, deliveries = state.agencyAgreements.records[0].deliveries.length;
  hydrateState(JSON.parse(JSON.stringify(state)));
  assert.equal(validateGameState(state).ok, true);
  assert.equal(releaseCreativeProject(project.id), null);
  assert.equal(completeJobSession("J001").ok, false);
  assert.equal(state.fans, savedFans);
  assert.equal(state.agencyAgreements.records[0].deliveries.length, deliveries);
});
