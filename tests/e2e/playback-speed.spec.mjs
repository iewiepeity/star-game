import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });

async function boot(page) {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await page.locator("#player-real-name").fill("快轉測試");
  await page.locator("#to-stats").click();
  await page.locator("#start").click();
  await page.locator("[data-skip-onboarding]").click();
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
}
async function setupRunner(page, phase = "result") {
  await page.evaluate(async phase => {
    const stateModule = await import("/src/core/state.js");
    const { setRunnerPaused } = await import("/src/logic/runner.js");
    const { setPreference } = await import("/src/core/preferences.js");
    setRunnerPaused(true);
    stateModule.resetState();
    const { state } = stateModule;
    state.name = state.realName = "快轉測試";
    state.screen = "runner"; state.runnerDay = 0;
    state.schedule = Array(7).fill("rest");
    state.runnerPhase = phase;
    state.runnerResult = { success: true, title: "今日結算", text: "今天休息充足。" };
    setPreference("autoSpeed", "manual");
    (await import("/src/render.js")).render();
  }, phase);
}
async function current(page) {
  return page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    return { screen: state.screen, day: state.runnerDay, phase: state.runnerPhase, paused: state.runnerPaused,
      results: state.weekResults.length, money: state.money, history: state.history.length };
  });
}

test("五種倍速以實際時間推進，過場也等比例加速", async ({ page }) => {
  await boot(page);
  for (const [speed, delay, loading] of [["x1",4000,350],["x2",2000,175],["x4",1000,88],["x8",500,44],["x16",250,22]]) {
    await setupRunner(page);
    await page.locator(`[data-runner-speed="${speed}"]`).click();
    await page.clock.runFor(delay - 1);
    expect((await current(page)).day).toBe(0);
    await page.clock.runFor(1);
    expect(await current(page)).toMatchObject({ day: 1, phase: "loading", results: 0 });
    await page.clock.runFor(loading - 1);
    expect((await current(page)).phase).toBe("loading");
    await page.clock.runFor(1);
    expect(await current(page)).toMatchObject({ day: 1, phase: "result", results: 1 });
  }
});

test("過場中可即時切換倍速與暫停，16× 一週七天各結算一次", async ({ page }) => {
  await boot(page);
  await setupRunner(page);
  await page.evaluate(async () => {
    const { setRunnerSpeed, startDay } = await import("/src/logic/runner.js");
    setRunnerSpeed("x1"); startDay();
  });
  await page.clock.runFor(100);
  await page.locator('[data-runner-speed="x8"]').click();
  await page.clock.runFor(20);
  await page.locator('[data-runner-pause]').click();
  await page.locator('[data-runner-speed="x16"]').click();
  await page.clock.runFor(5000);
  expect(await current(page)).toMatchObject({ day: 0, phase: "loading", paused: true, results: 0 });
  await expect(page.locator(".story-loading")).toContainText("行程已暫停");
  await page.locator('[data-runner-pause]').click();
  await page.clock.runFor(22);
  expect(await current(page)).toMatchObject({ day: 0, phase: "result", results: 1 });
  await page.clock.runFor(2200);
  expect(await current(page)).toMatchObject({ screen: "summary", results: 7, history: 1 });
  await page.clock.runFor(10000);
  expect(await current(page)).toMatchObject({ screen: "summary", results: 7, history: 1 });
});

test("16× 仍等候選擇、人物與看板，手動模式不自動進入下一天", async ({ page }) => {
  await boot(page);
  await setupRunner(page);
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    state.schedule[0] = "free"; state.freeLocations[0] = "record_company";
    const { setRunnerSpeed, startDay } = await import("/src/logic/runner.js");
    setRunnerSpeed("x16"); startDay();
  });
  await page.clock.runFor(2000);
  await expect(page.locator('[data-choice="browse_jobs"]')).toBeVisible();
  const before = await current(page);
  await page.clock.runFor(10000);
  expect(await current(page)).toEqual(before);
  await page.locator('[data-choice="browse_jobs"]').click();
  await expect(page.locator('.venue-board')).toBeVisible();
  const atVenue = await current(page);
  await page.clock.runFor(10000);
  expect(await current(page)).toEqual(atVenue);
  for (const guard of ["requiresInteraction", "portrait"]) {
    await setupRunner(page);
    await page.evaluate(async guard => {
      const { state } = await import("/src/core/state.js");
      state.runnerResult[guard] = guard === "portrait" ? "./assets/rookie-room.webp" : true;
      (await import("/src/render.js")).render();
    }, guard);
    await page.locator('[data-runner-speed="x16"]').click();
    await page.clock.runFor(10000);
    expect((await current(page)).day).toBe(0);
  }
  await setupRunner(page, "loading");
  await page.evaluate(() => Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }));
  await page.locator('[data-runner-speed="x16"]').click();
  await page.clock.runFor(2000);
  expect(await current(page)).toMatchObject({ day: 0, phase: "loading", results: 0 });
  await page.evaluate(() => { delete document.visibilityState; });
  await page.clock.runFor(22);
  expect(await current(page)).toMatchObject({ day: 0, phase: "result", results: 1 });
  await setupRunner(page);
  await page.clock.runFor(10000);
  expect((await current(page)).day).toBe(0);
  await page.locator('#next-day').click();
  await page.clock.runFor(10000);
  expect(await current(page)).toMatchObject({ day: 1, phase: "result", results: 1 });
});

test("新倍速設定可儲存重載，手機與大字模式按鈕不溢出", async ({ page }) => {
  await boot(page);
  await page.evaluate(async () => {
    const { state } = await import('/src/core/state.js');
    state.appOpen = 'settings';
    (await import('/src/render.js')).render();
  });
  await expect(page.locator('[data-auto-speed]')).toHaveCount(6);
  await page.locator('[data-auto-speed="x16"]').click();
  await expect(page.locator('[data-auto-speed="x16"]')).toHaveAttribute('aria-pressed','true');
  await page.reload();
  const savedSpeed = await page.evaluate(async () => (await import('/src/core/preferences.js')).getPreferences().autoSpeed);
  expect(savedSpeed).toBe('x16');
  await setupRunner(page);
  await page.evaluate(async () => {
    (await import('/src/core/preferences.js')).setPreference('fontSize', 'large');
    (await import('/src/render.js')).render();
  });
  if (page.viewportSize().width <= 390) await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.locator('[data-runner-speed]')).toHaveCount(6);
  for (const button of await page.locator('.runner-playback button').all()) {
    const bounds = await button.boundingBox();
    // Firefox reports fractional CSS pixels just below the computed minimum.
    expect(bounds.height + 0.01).toBeGreaterThanOrEqual(44);
    expect(bounds.width + 0.01).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  }
  expect(await page.locator('html').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
});
