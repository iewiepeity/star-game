import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });
async function create(page, skip = true) {
  await page.goto("/");
  await page.locator("#player-real-name").fill("星望新人");
  await page.locator("#to-stats").click();
  await page.locator("#start").click();
  if (skip) await page.locator("[data-skip-onboarding]").click();
}
async function snapshot(page) {
  return page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    return {
      money: state.money,
      week: state.week,
      schedule: state.schedule,
      visits: state.visitedLocationsByWeek,
    };
  });
}
async function open(page, id) {
  await page.evaluate(async (id) => {
    const { state } = await import("/src/core/state.js");
    (await import("/src/core/app-navigation.js")).openApp(state, id);
    (await import("/src/render.js")).render();
  }, id);
}
test("開場志向帶到第一站，經紀公司必須先取得聯絡管道", async ({ page }) => {
  await create(page, false);
  for (let i = 0; i < 5; i++)
    await page.locator(".prologue-dialogue [data-prologue-next]").click();
  await page.locator('[data-aspiration="vocal"]').click();
  await page.locator(".prologue-dialogue [data-prologue-next]").click();
  await expect(page.locator(".journey-guide")).toContainText(
    "先認識迴聲錄音室",
  );
  await page.locator('.journey-guide [data-city-shortcut="recording"]').click();
  await expect(page.locator(".city-preview")).toContainText("聲樂基礎課");
  expect(Object.keys((await snapshot(page)).visits)).toHaveLength(0);
  await open(page, "agency");
  await expect(page.locator(".agency-discovery")).toContainText(
    "還沒有業界聯絡管道",
  );
  await expect(page.locator('[data-agency-action="apply"]')).toHaveCount(0);
  await page.locator('[data-city-shortcut="business"]').click();
  await expect(page.locator(".city-preview")).toContainText("星環商務中心");
});
test("實際探索後才解鎖課程，自由活動當天可以操作城市地圖", async ({
  page,
}, info) => {
  await create(page);
  await open(page, "planner");
  await expect(page.locator('[data-pick="vocal"]')).toHaveCount(0);
  await page.locator('[data-discover-training="recording"]').first().click();
  await expect(page.locator(".city-preview")).toContainText("尚未到訪");
  await page.locator('.city-preview [data-city-confirm="recording"]').click();
  await expect(page.locator('[data-day="0"]')).toContainText("迴聲錄音室");
  await page.evaluate(async () => {
    (await import("/src/core/preferences.js")).setPreference(
      "autoSpeed",
      "manual",
    );
  });
  await page.locator("#begin-week").click();
  await expect(page.locator('[data-choice="focus"]')).toBeVisible();
  await page.locator(".runner-city-map > summary").click();
  await page.locator('.runner-city-map [data-city-place="dance"]').click();
  await page.locator('[data-city-confirm="dance"]').click();
  expect(Object.keys((await snapshot(page)).visits)).toHaveLength(0);
  await page.screenshot({ path: info.outputPath("city-map.png") });
  await page.locator('[data-choice="focus"]').click();
  await expect(page.locator(".day-result")).toContainText("已開放");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    state.screen = "game";
    state.appOpen = "planner";
    (await import("/src/render.js")).render();
  });
  await expect(page.locator('[data-pick="dance"]')).toBeVisible();
  await expect(page.locator('[data-pick="vocal"]')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("star-game-save") || "{}",
        ).state?.visitedLocationsByWeek?.[1]?.includes("dance"),
      ),
    )
    .toBe(true);
  await page.reload();
  // A queued story can legitimately open on reload; verify the saved unlock independently.
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { state } = await import("/src/core/state.js");
        return (await import("/src/logic/city-progression.js")).trainingAccess(
          state,
          "dance",
        ).unlocked;
      }),
    )
    .toBe(true);
});
test("手機可查看社群與返回，瀏覽不推進日期或消耗資源", async ({ page }) => {
  await create(page);
  const before = await snapshot(page);
  await page.locator(".home-phone-entry").click();
  await page.locator('[data-phone-open="social"]').click();
  await expect(page.locator(".social-profile")).toBeVisible();
  await page.locator('[data-return-app="phone"]').click();
  await expect(page.locator(".phone-home")).toBeVisible();
  await page.locator('[data-phone-open="people"]').click();
  await expect(page.locator(".tablet-empty")).toContainText("還沒有認識任何人");
  expect(await snapshot(page)).toEqual(before);
});
test("邀約先選雙方空檔，確認前不更動行程或扣款", async ({ page }) => {
  await create(page);
  const id = await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { NPCS } = await import("/src/data/npcs.js");
    const id = Object.keys(NPCS)[0];
    (await import("/src/logic/npc-engine.js")).meetNpc(id, "測試相遇");
    state.npcSchedules[id] = [
      { week: state.week, day: 0, status: "reserved", jobId: "work" },
    ];
    state.selectedNpc = id;
    state.peopleSection = "profiles";
    state.appOpen = "people";
    (await import("/src/render.js")).render();
    return id;
  });
  const before = await snapshot(page);
  await page.locator(`[data-npc-id="${id}"][data-npc-interact="meal"]`).click();
  await expect(page.locator('[data-invitation-day="0"]')).toBeDisabled();
  expect(await snapshot(page)).toEqual(before);
  await page.locator('[data-invitation-day="2"]').click();
  await page.locator("[data-confirm-invitation]").click();
  await expect(page.locator(".game-toast")).toContainText("已保留星期三");
  const after = await snapshot(page);
  expect(after.money).toBe(before.money);
  expect(after.schedule[2]).toBe("personal_task");
});
