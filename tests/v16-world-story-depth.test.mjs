import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState } from "../src/core/state.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { JOB_STORYLINES } from "../src/data/job-storylines.js";
import {
  CREATIVE_DIRECTION_STORIES,
  createCreativeProject,
  chooseIndependentProduction,
  sellCreativeRights,
} from "../src/logic/creative.js";
import { INDUSTRY_LIST } from "../src/data/industry.js";
import { managerInteractionDecision } from "../src/logic/manager.js";
import { careerPhase, CAREER_PHASES } from "../src/logic/career-phases.js";
import { mapApp } from "../src/views/map.js";
import { plannerApp } from "../src/views/planner.js";
import { worldApp } from "../src/views/world.js";
import { socialDrafts } from "../src/logic/social-drafts.js";
const fresh = () => {
  resetState();
  const s = state;
  s.screen = "game";
  s.name = "測試者";
  s.stats = Object.fromEntries(
    [
      "創作",
      "作詞",
      "作曲",
      "歌藝",
      "聲線",
      "編劇",
      "學識",
      "演技",
      "鏡頭感",
      "口才",
      "主持",
      "社交",
    ].map((k) => [k, 800]),
  );
  return s;
};
test("75 份工作都有試鏡、簽約、四段製作、完成與違約專屬敘事", () => {
  assert.equal(JOB_CATALOG.length, 75);
  assert.equal(Object.keys(JOB_STORYLINES).length, 75);
  for (const job of JOB_CATALOG) {
    const s = JOB_STORYLINES[job.id];
    assert.ok(s.audition.passed.includes(job.title));
    assert.equal(s.production.length, 4);
    assert.ok(s.contract.text.includes(job.client));
    assert.ok(s.breach.text.length > 30);
  }
});
test("九條創作方向都有開發、製作、發行、優勢與風險", () => {
  const stories = Object.values(CREATIVE_DIRECTION_STORIES).flatMap(
    Object.values,
  );
  assert.equal(stories.length, 9);
  for (const s of stories)
    for (const key of [
      "development",
      "production",
      "release",
      "strength",
      "risk",
    ])
      assert.ok(s[key]);
});
test("完成草稿後可自主製作或把企劃權出售給公司", () => {
  let s = fresh(),
    p = createCreativeProject("song", "自己留下的歌");
  p.status = "ready";
  p.quality = 700;
  assert.equal(chooseIndependentProduction(p.id).ok, true);
  assert.equal(p.distributionMode, "independent");
  s = fresh();
  p = createCreativeProject("song", "交出去的歌");
  p.status = "ready";
  p.quality = 700;
  const company = INDUSTRY_LIST.find((c) => c.type === "唱片公司");
  assert.equal(sellCreativeRights(p.id, company.id).ok, true);
  assert.equal(p.status, "sold");
  assert.ok(p.saleValue > 0);
});
test("經紀人互動有三個真正取捨而非單鍵加數值", () => {
  const s = fresh();
  s.currentAgencyId = "starlight";
  const d = managerInteractionDecision({ payload: { type: "career" } });
  assert.equal(d.choices.length, 3);
  assert.equal(new Set(d.choices.map((c) => c.id)).size, 3);
  assert.ok(d.text.length > 30);
});
test("五年職涯、世界週報、目的型地圖與行程控制台均可見", () => {
  const s = fresh();
  assert.equal(CAREER_PHASES.length, 5);
  s.week = 209;
  assert.equal(careerPhase().year, 5);
  assert.match(worldApp(), /INDUSTRY DESK/);
  assert.match(mapApp(), /找試鏡／通告/);
  assert.match(plannerApp(), /WEEK CONTROL/);
});
test("社群草稿會引用已完成作品，而非永遠只有三句固定貼文", () => {
  const s = fresh();
  s.completedWorks.push({ title: "潮汐以後", storyLegacy: "守住最後一場戲" });
  const drafts = socialDrafts();
  assert.ok(drafts.afterwork.text.includes("潮汐以後"));
  assert.ok(Object.keys(drafts).length > 3);
});
