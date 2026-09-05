import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });
async function start(page) {
  await page.goto("/");
  await page.locator("#player-real-name").fill("瀏覽器測試");
  await page.locator("#to-stats").click();
  await page.locator("#start").click();
  await page.locator("[data-skip-onboarding]").click();
}
async function planner(page) {
  await page.locator('.tablet-dock [data-open-app="planner"]').click();
}
test("七天週曆在首屏，選擇活動後可以復原", async ({ page }) => {
  await start(page);
  await planner(page);
  const days = page.locator("[data-day]");
  await expect(days).toHaveCount(7);
  const box = await days.last().boundingBox();
  expect(box.y + box.height).toBeLessThan(page.viewportSize().height);
  expect(
    await page.locator("html").evaluate((e) => e.scrollWidth - e.clientWidth),
  ).toBeLessThanOrEqual(1);
  await page.locator('[data-day="2"]').click();
  await page.locator('[data-pick="vocal"]').click();
  await expect(page.locator('[data-day="2"]')).toContainText("聲樂");
  await page.locator("[data-undo-action]").click();
  await expect(page.locator('[data-day="2"]')).toContainText("休息");
});
test("清除重要預約要確認，例行休息不取消它", async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.schedule[0] = "job_session";
    state.scheduledJobIds[0] = "J001";
    render();
  });
  await planner(page);
  await page.locator("#rest-all").click();
  expect(
    await page.evaluate(
      async () => (await import("/src/core/state.js")).state.scheduledJobIds[0],
    ),
  ).toBe("J001");
  await page.locator('[data-day="0"]').click();
  await page.locator("[data-clear-day]").click();
  await expect(page.locator("[data-confirm-planner-edit]")).toBeVisible();
  await page.locator("[data-cancel-planner-edit]").click();
  expect(
    await page.evaluate(
      async () => (await import("/src/core/state.js")).state.scheduledJobIds[0],
    ),
  ).toBe("J001");
});
test("人物故事逐幕閱讀並在重新載入後恢復", async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.screen = "event";
    state.activeEvent = {
      event: {
        id: "browser-reader",
        title: "未說完的旋律",
        beats: [
          { label: "進場", text: "他把耳機遞過來。" },
          { label: "靠近", text: "這次，換你先聽。" },
        ],
        choices: [{ id: "listen", label: "接過耳機", effects: [{ mood: 1 }] }],
      },
    };
    render();
  });
  await expect(page.locator("[data-event-choice]")).toHaveCount(0);
  await page.locator("[data-scene-next]").click();
  await expect(page.locator("#current-scene")).toContainText("換你先聽");
  await page.reload();
  await expect(page.locator("#current-scene")).toContainText("換你先聽");
  await page.locator('[data-event-choice="listen"]').click();
  await expect(page.locator(".event-outcome")).toBeVisible();
});
