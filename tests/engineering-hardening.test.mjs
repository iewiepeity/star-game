import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/core/state.js";
import { validateGameState } from "../src/core/save-schema.js";
import {
  previewScheduleChange,
  commitScheduleChange,
  scheduleChange,
} from "../src/logic/schedule-transaction.js";
import { sortJobs } from "../src/logic/job-list-model.js";
import { sanitizeRichText } from "../src/core/safe-html.js";
import { birthDayLimit, normalizeBirthday } from "../src/core/birthday.js";
import { APP_IDS, isAppId } from "../src/core/app-navigation.js";

test("存檔 schema 拒絕非有限數值、未知工作階段與過長 UI 輸入", () => {
  const base = initialState();
  base.money = Number.NaN;
  assert.equal(validateGameState(base).ok, false);
  const badJob = initialState();
  badJob.activeJobs.J001 = {
    jobId: "J001",
    stage: "teleported",
    remainingSessions: 1,
    completedSessions: 0,
  };
  assert.equal(validateGameState(badJob).ok, false);
  const oversized = initialState();
  oversized.jobQuery = "x".repeat(201);
  assert.equal(validateGameState(oversized).ok, false);
});
test("存檔 schema 拒絕事件處理器與 script 注入", () => {
  const game = initialState();
  game.runnerResult = { text: '<img src=x onerror="alert(1)">' };
  assert.equal(validateGameState(game).ok, false);
  game.runnerResult = { text: "<script>alert(1)</script>" };
  assert.equal(validateGameState(game).ok, false);
});
test("匯入的 Runner 標題與選項不能夾帶 HTML", () => {
  for (const mutation of [
    (game) =>
      (game.runnerResult = {
        title: '<img src=x onerror="alert(1)">',
        text: "ok",
      }),
    (game) =>
      (game.runnerDecision = {
        title: "ok",
        text: "ok",
        choices: [{ id: "x", label: "<script>x</script>", note: "" }],
      }),
    (game) => (game.runnerDecision = { title: "ok", text: "ok", choices: {} }),
  ]) {
    const game = initialState();
    mutation(game);
    assert.equal(validateGameState(game).ok, false);
  }
});
test("Runner 富文字只保留白名單標記並移除危險屬性", () => {
  const html = sanitizeRichText(
    '<section class="signed" onclick="evil()"><b>完成</b><img src=x onerror=evil()></section>',
  );
  assert.equal(html.includes('<section class="signed">'), true);
  assert.equal(html.includes("<b>完成</b>"), true);
  assert.equal(html.includes("onclick"), false);
  assert.equal(html.includes("<img"), false);
  assert.equal(
    sanitizeRichText("</section><b>安全"),
    "&lt;/section&gt;<b>安全</b>",
  );
});
test("生日日期會依月份限制，二月最多 29 日", () => {
  assert.equal(birthDayLimit(2), 29);
  assert.deepEqual(normalizeBirthday(2, 31), { month: 2, day: 29 });
  assert.deepEqual(normalizeBirthday(4, 31), { month: 4, day: 30 });
});
test("App registry 是單一有效導覽來源", () => {
  assert.equal(new Set(APP_IDS).size, APP_IDS.length);
  assert.equal(isAppId("world"), true);
  assert.equal(isAppId("portfolio"), false);
});
test("排程交易先驗證再一次提交並清除互斥欄位", () => {
  const game = initialState(),
    preview = previewScheduleChange(game, 2, {
      type: "job_session",
      jobId: "J001",
    });
  assert.equal(preview.ok, true);
  assert.equal(game.schedule[2], "rest");
  commitScheduleChange(game, preview);
  assert.equal(game.schedule[2], "job_session");
  assert.equal(game.scheduledJobIds[2], "J001");
  assert.equal(game.scheduledActivityIds[2], null);
});
test("排程交易拒絕無效日期、缺少關聯 ID 與強制休養插單", () => {
  const game = initialState();
  assert.equal(scheduleChange(game, 7, { type: "rest" }).ok, false);
  assert.equal(scheduleChange(game, 0, { type: "personal_task" }).ok, false);
  game.forcedRestWeek = game.week;
  assert.equal(
    scheduleChange(game, 0, { type: "job_session", jobId: "J001" }).ok,
    false,
  );
});
test("五年規模存檔維持在 localStorage 安全預算內", () => {
  const game = initialState();
  game.history = Array.from({ length: 260 }, (_, week) => ({
    week: week + 1,
    results: Array.from({ length: 7 }, (__, day) => ({
      day,
      title: `第${week + 1}週-${day}`,
      text: "一段足以代表每日日誌長度的測試文字。",
    })),
  }));
  const bytes = Buffer.byteLength(JSON.stringify(game));
  assert.ok(bytes < 2_500_000, `五年存檔 ${bytes} bytes 已超過 2.5MB 預算`);
});
test("大量排程交易始終維持互斥欄位不變量", () => {
  const game = initialState();
  for (let index = 0; index < 1000; index++) {
    const day = index % 7,
      variant = index % 3,
      assignment =
        variant === 0
          ? { type: "rest" }
          : variant === 1
            ? { type: "job_session", jobId: `J${index}` }
            : { type: "personal_task", activityId: `A${index}` };
    assert.equal(scheduleChange(game, day, assignment).ok, true);
    for (let cursor = 0; cursor < 7; cursor++) {
      const type = game.schedule[cursor];
      assert.equal(
        Boolean(game.scheduledJobIds[cursor]),
        type === "job_session",
      );
      assert.equal(
        Boolean(game.scheduledActivityIds[cursor]),
        type === "personal_task",
      );
      if (type !== "free") assert.equal(game.freeLocations[cursor], null);
    }
  }
});
test("工作清單排序由純 view model 決定且不改動來源陣列", () => {
  const source = [
      { title: "乙", stars: 2 },
      { title: "甲", stars: 5 },
    ],
    sorted = sortJobs(source, "stars");
  assert.equal(sorted[0].title, "甲");
  assert.equal(source[0].title, "乙");
});
