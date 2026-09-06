import test from "node:test";
import assert from "node:assert/strict";
import { titleTag } from "../src/core/utils.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
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

test("重寫後的75份試鏡結果保留正確作品名，且每份有獨立通過與落選內容", () => {
  for (const job of JOB_CATALOG) {
    const story = JOB_STORYLINES[job.id];
    const prefix = `${titleTag(job.title)}的試鏡結果到了。`;
    assert.ok(story.audition.passed.startsWith(prefix), job.id);
    assert.ok(story.audition.failed.startsWith(prefix), job.id);
    assert.notEqual(story.audition.passed, story.audition.failed, job.id);
    assert.ok(story.audition.passed.slice(prefix.length).length > 20, job.id);
    assert.ok(story.audition.failed.slice(prefix.length).length > 20, job.id);
  }
  const results = JOB_CATALOG.map((job) => {
    const prefix = `${titleTag(job.title)}的試鏡結果到了。`;
    const story = JOB_STORYLINES[job.id];
    return { passed: story.audition.passed.slice(prefix.length), failed: story.audition.failed.slice(prefix.length) };
  });
  assert.equal(new Set(results.map((r) => r.passed)).size, 75);
  assert.equal(new Set(results.map((r) => r.failed)).size, 75);
});
