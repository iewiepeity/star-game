import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resetState, state } from "../src/core/state.js";
import { agencyApp } from "../src/views/agency.js";
import { activityPicker, plannerApp } from "../src/views/planner.js";
import { eventRecapText } from "../src/views/summary.js";
import { playerFacingNpcUpdates } from "../src/logic/world-tick.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { castNpcsForJob, isNpcCastEligible } from "../src/logic/npc-ecosystem.js";
import { ensureJobState } from "../src/logic/job-engine.js";
import { meetNpc } from "../src/logic/npc-engine.js";

const root = new URL("../", import.meta.url);

test("手機公司選擇提供明確提示且不要求左右滑動", () => {
  resetState();
  const html = agencyApp();
  assert.match(html, /先選一間公司/);
  assert.match(html, /不需要左右滑動/);
  assert.equal((html.match(/data-select-agency=/g) || []).length, 4);
});

test("缺少 choiceLabel 的事件回顧不再顯示 undefined", () => {
  assert.equal(eventRecapText({ outcome: "今天的喉嚨很誠實" }), "今天的喉嚨很誠實");
  assert.doesNotMatch(eventRecapText({}), /undefined/);
});

test("陌生 NPC 自主工作保留在世界層但不進私人 Toast", () => {
  resetState();
  const updates = ["喬映澄接下新的電影工作", "市場需求正在回溫"];
  assert.deepEqual(playerFacingNpcUpdates(updates), ["市場需求正在回溫"]);
  assert.deepEqual(playerFacingNpcUpdates(updates, { knownPeople: ["jiqing"] }), updates);
});

test("試鏡通過與進行中通告都直接出現在行程工作區", () => {
  resetState();
  const [passed, active] = JOB_CATALOG.slice(0, 2);
  state.activeJobs[passed.id] = { jobId: passed.id, stage: "passed", remainingSessions: passed.sessions };
  state.activeJobs[active.id] = { jobId: active.id, stage: "active", remainingSessions: active.sessions, deadlineWeek: state.week + 3, npcCast: [], npcScheduleSlots: [] };
  state.filter = "工作";
  assert.match(plannerApp(), new RegExp(`data-planner-sign-job="${passed.id}"`));
  assert.match(activityPicker(), new RegExp(`data-planner-job="${active.id}"`));
});

test("手機快捷列與事件選項有防溢位版面規則", async () => {
  const css = await readFile(new URL("style.css", root), "utf8");
  assert.match(css, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(css, /\.event-choice-list button\{display:flex!important/);
  assert.match(css, /\.event-choice-list button>span\{flex:1 1 auto!important/);
  assert.match(css, /\.runner-npc-art img\{object-fit:contain;object-position:center top;transform:none\}/);
});

test("手機人物場景使用完整清晰立繪而不是半身縮圖", () => {
  resetState();
  const result = meetNpc("hanzhiyuan");
  assert.equal(result.portrait, "./assets/portraits/hanzhiyuan.webp");
  assert.doesNotMatch(result.portrait, /\/busts\//);
});

test("幕後職務不會再被抽成歌曲或影視共演者，舊存檔也會清理", () => {
  resetState();
  const song = JOB_CATALOG.find(job => job.category === "歌曲");
  assert.ok(song);
  assert.equal(isNpcCastEligible("hanzhiyuan", song), false);
  assert.ok(castNpcsForJob(song).every(id => ["tangtang", "lujingran"].includes(id)));
  state.activeJobs[song.id] = { jobId: song.id, stage: "active", remainingSessions: 1, npcCast: ["hanzhiyuan"], npcScheduleSlots: [] };
  assert.deepEqual(ensureJobState(song.id).npcCast, []);
});

test("人物來源跳轉會明確開啟整合後的人物檔案分頁", async () => {
  const [jobs, timeline] = await Promise.all([
    readFile(new URL("src/bind/jobs.js", root), "utf8"),
    readFile(new URL("src/bind/timeline.js", root), "utf8"),
  ]);
  for (const source of [jobs, timeline]) {
    assert.match(source, /peopleSection="profiles"/);
    assert.match(source, /openApp\(state,/);
  }
});
