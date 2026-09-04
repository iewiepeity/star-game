import test from "node:test";
import assert from "node:assert/strict";
import { titleTag } from "../src/core/utils.js";
import { JOB_CATALOG, JOB_BY_ID } from "../src/data/jobs.js";
import { JOB_STORYLINES } from "../src/data/job-storylines.js";

test("作品標題只在尚未以書名號開頭時加上書名號", () => {
  assert.equal(titleTag("晨露汽水形象廣告"), "《晨露汽水形象廣告》");
  assert.equal(titleTag("《最後一班車》學生短片"), "《最後一班車》學生短片");
  for (const job of JOB_CATALOG) {
    const expected = job.title.startsWith("《") ? job.title : `《${job.title}》`;
    assert.equal(titleTag(job.title), expected, job.id);
    assert.equal(titleTag(titleTag(job.title)), expected, `${job.id}: idempotent`);
  }
});

test("75 份工作的敘事與段落標題不會出現雙重書名號", () => {
  assert.equal(JOB_CATALOG.length, 75);
  for (const job of JOB_CATALOG) {
    const story = JOB_STORYLINES[job.id];
    const fields = {
      "audition.passed": story.audition.passed,
      "audition.failed": story.audition.failed,
      "contract.text": story.contract.text,
      "breach.text": story.breach.text,
      "legacy.text": story.legacy.text,
      "contract.title": story.contract.title,
      "breach.title": story.breach.title,
      "legacy.title": story.legacy.title,
    };
    story.production.forEach((step, index) => {
      fields[`production[${index}].text`] = step.text;
      fields[`production[${index}].title`] = step.title;
    });
    for (const [field, text] of Object.entries(fields)) {
      assert.equal(typeof text, "string", `${job.id}.${field}`);
      assert.ok(!text.includes("《《"), `${job.id}.${field}: ${text}`);
    }
    assert.ok(story.audition.passed.includes(job.title), job.id);
  }
});

test("已知帶書名號與未帶書名號工作的試鏡文案只改標題組合", () => {
  for (const id of ["J001", "J003", "J004", "J008"]) {
    const job = JOB_BY_ID[id], story = JOB_STORYLINES[id];
    assert.ok(story.audition.passed.startsWith(`「${titleTag(job.title)}，我們要你。」你笑了，攥緊的手才終於鬆開。`));
    assert.equal(story.audition.failed, `${titleTag(job.title)}的名單翻到底，沒有你。你把螢幕按黑。那句「${job.audition.tip}」卻還留在眼前。`);
  }
});
