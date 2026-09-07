import test from "node:test";
import assert from "node:assert/strict";
import { resetState, state } from "../src/core/state.js";
import { agencyApp } from "../src/views/agency.js";

import { playerFacingNpcUpdates } from "../src/logic/world-tick.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { castNpcsForJob, isNpcCastEligible } from "../src/logic/npc-ecosystem.js";
import { ensureJobState } from "../src/logic/job-engine.js";
import { meetNpc } from "../src/logic/npc-engine.js";


test("手機公司選擇提供明確提示且不要求左右滑動", () => {
  resetState();
  state.visitedLocationsByWeek[state.week] = ["business"];
  const html = agencyApp();
  assert.match(html, /先選一間公司/);
  assert.match(html, /不需要左右滑動/);
  assert.equal((html.match(/data-select-agency=/g) || []).length, 4);
});

test("陌生 NPC 自主工作保留在世界層但不進私人 Toast", () => {
  resetState();
  const updates = ["喬映澄接下新的電影工作", "市場需求正在回溫"];
  assert.deepEqual(playerFacingNpcUpdates(updates), ["市場需求正在回溫"]);
  assert.deepEqual(playerFacingNpcUpdates(updates, { knownPeople: ["jiqing"] }), updates);
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
