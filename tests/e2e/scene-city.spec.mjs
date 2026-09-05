import { test, expect } from "@playwright/test";
import { MAP_LOCATIONS } from "../../src/data/map-locations.js";
test.use({ serviceWorkers: "block" });
async function create(page) {
  await page.goto("/");
  await page.locator("#player-real-name").fill("星望散步");
  await page.locator("#to-stats").click();
  await page.locator("#start").click();
  await page.locator("[data-skip-onboarding]").click();
}
async function openMap(page) {
  await page.locator('.scene-object[data-open-app="map"]').click();
  await expect(page.locator("[data-city-loading]")).toBeHidden();
}
async function progress(page) {
  return page.evaluate(async () => {
    const { state: s } = await import("/src/core/state.js");
    return {
      money: s.money,
      week: s.week,
      schedule: s.schedule,
      visits: s.visitedLocationsByWeek,
      shifts: s.partTimeShifts,
    };
  });
}
test("同張原畫涵蓋全部地點，建築可點選，預覽不改變生活進度", async ({
  page,
}) => {
  await create(page);
  const before = await progress(page);
  await openMap(page);
  await expect(page.locator("[data-city-place]")).toHaveCount(
    Object.keys(MAP_LOCATIONS).length,
  );
  await expect(page.locator("[data-city-preview]")).toBeHidden();
  for (const [id, location] of Object.entries(MAP_LOCATIONS)) {
    await page.locator(`[data-city-place="${id}"]`).click();
    await expect(page.locator(".city-preview h3")).toHaveText(location.name);
    await expect(page.locator(`[data-city-place="${id}"]`)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator(`[data-city-confirm="${id}"]`)).toBeVisible();
    if (id === "airport")
      await expect(page.locator(`[data-city-confirm="${id}"]`)).toBeDisabled();
    await page.locator("[data-city-dismiss]").click();
  }
  expect(await progress(page)).toEqual(before);
});
test("滑鼠移入才顯示線索，觸控點選、搜尋與縮放可抵達海岸", async ({ page }) => {
  await create(page);
  await openMap(page);
  const before = await progress(page);
  const hover = await page.evaluate(
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  if (hover) {
    await page.locator('[data-city-place="rehearsal"]').hover();
    await expect(page.locator(".city-clue")).toBeVisible();
    await expect(page.locator("[data-city-confirm]")).toHaveCount(0);
    await page.locator("[data-city-search]").hover();
    await expect(page.locator("[data-city-preview]")).toBeHidden();
  }
  await page.locator("[data-city-search]").fill("海灘");
  await page.locator('[data-city-search-result="beach"]').click();
  await expect(page.locator(".city-preview h3")).toHaveText("月灣海灘");
  await page.locator("[data-city-dismiss]").click();
  const prior = await page
    .locator("[data-city-world]")
    .evaluate((e) => e.clientWidth);
  await page.locator('[data-city-zoom="in"]').click();
  expect(
    await page.locator("[data-city-world]").evaluate((e) => e.clientWidth),
  ).toBeGreaterThan(prior);
  await page.locator("[data-city-overview]").click();
  const fit = await page.locator("[data-city-viewport]").evaluate((e) => ({
    w: e.clientWidth,
    world: e.firstElementChild.clientWidth,
  }));
  expect(fit.world).toBeLessThanOrEqual(fit.w + 1);
  await page.locator('[data-city-place="beach"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-city-confirm="beach"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-city-preview]")).toBeHidden();
  await expect(page.locator(".app-window.map")).toBeVisible();
  expect(await progress(page)).toEqual(before);
  expect(
    await page.locator("html").evaluate((e) => e.scrollWidth - e.clientWidth),
  ).toBeLessThanOrEqual(1);
});
test("地圖安排遵守重要預約確認，完成替換後仍能復原", async ({ page }) => {
  await create(page);
  await page.evaluate(async () => {
    const { state: s } = await import("/src/core/state.js");
    s.schedule[0] = "job_session";
    s.scheduledJobIds[0] = "J001";
    (await import("/src/render.js")).render();
  });
  const before = await progress(page);
  await openMap(page);
  await page.locator('[data-city-place="rehearsal"]').click();
  await page.locator("[data-city-day]").selectOption("0");
  await page.locator('[data-city-confirm="rehearsal"]').click();
  await expect(page.locator("[data-confirm-planner-edit]")).toBeVisible();
  expect(await progress(page)).toEqual(before);
  await page.locator("[data-confirm-planner-edit]").click();
  await expect(page.locator('[data-day="0"]')).toContainText("映畫排練室");
  await page.locator("[data-undo-action]").click();
  expect(await progress(page)).toEqual(before);
});
test("六個房間物件可開啟對應介面，十八個功能仍可從圖示選單存取", async ({
  page,
}, info) => {
  await create(page);
  const before = await progress(page);
  for (const id of ["phone", "planner", "jobs", "creative", "world", "map"]) {
    await page.locator(`.scene-object[data-open-app="${id}"]`).click();
    await expect(page.locator(`.app-window.${id}`)).toBeVisible();
    await page.locator(".window-close[data-close-app]").click();
  }
  await page.locator(".scene-menu-button").click();
  await expect(page.locator(".home-launchers [data-open-app]")).toHaveCount(18);
  for (const id of [
    "stats",
    "people",
    "social",
    "forum",
    "wardrobe",
    "agency",
    "achievements",
    "save",
    "settings",
    "timeline",
    "gallery",
    "log",
  ]) {
    await page.locator(`.home-launchers [data-open-app="${id}"]`).click();
    await expect(page.locator(`.app-window.${id}`)).toBeVisible();
    expect(
      await page.locator("html").evaluate((e) => e.scrollWidth - e.clientWidth),
    ).toBeLessThanOrEqual(1);
    await page.locator(".window-close[data-close-app]").click();
  }
  await page.locator(".scene-menu-button").click();
  expect(await progress(page)).toEqual(before);
  const geometry = await page.evaluate(() => {
    const hud = document.querySelector(".room-hud").getBoundingClientRect(),
      date = document.querySelector(".scene-date").getBoundingClientRect();
    return { hudBottom: hud.bottom, dateTop: date.top };
  });
  expect(geometry.dateTop).toBeGreaterThanOrEqual(geometry.hudBottom);
  await page.screenshot({ path: info.outputPath("interactive-room.png") });
});
