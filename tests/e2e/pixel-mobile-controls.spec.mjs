import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { bookCareer } from "../../src/pixel/career.js";
import { CHOICES } from "../../src/pixel/life.js";

test.use({ serviceWorkers: "block" });
const read = page => page.evaluate(() => window.__pixelRead());

async function start(page, amend = () => {}) {
  const state = initialPixelState();
  state.flags.intro = true;
  state.life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  amend(state);
  await page.addInitScript(state => {
    localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state }));
  }, state);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
}

async function settings(page) {
  await page.getByRole("button", { name: "開啟選單", exact: true }).click();
  await page.locator('#panel [data-ui="settings"]').click();
}

test("連點同一位置依序排週一至週日，保留捲動、篩選與展開狀態", async ({ page }) => {
  await start(page);
  await page.locator("#week-control").click();
  await page.locator(".planner-tools summary").click();
  await page.locator('[data-schedule-filter="訓練"]').click();
  const activity = page.locator('[data-plan="acting"]');
  await activity.scrollIntoViewIfNeeded();
  const before = await activity.boundingBox();
  const scrollTop = await page.locator("#panel").evaluate(node => node.scrollTop);
  expect(scrollTop).toBeGreaterThan(100);
  const gameBefore = (await read(page)).state.life.game;
  for (let day = 0; day < 8; day++) {
    // Fixed coordinates, deliberately without locator auto-scrolling on each tap.
    if (test.info().project.use.hasTouch) {
      await page.touchscreen.tap(before.x + before.width / 2, before.y + before.height / 2);
    } else {
      await page.mouse.click(before.x + before.width / 2, before.y + before.height / 2);
    }
    await expect(page.locator(`[data-day="${Math.min(day + 1, 6)}"]`)).toHaveClass("selected");
    expect((await read(page)).state.life.plan[Math.min(day, 6)].id).toBe("acting");
    expect(Math.abs((await activity.boundingBox()).y - before.y)).toBeLessThan(2);
    expect(await page.locator("#panel").evaluate(node => node.scrollTop)).toBeGreaterThan(100);
    await expect(page.locator(".planner-tools")).toHaveAttribute("open", "");
    await expect(page.locator('[data-schedule-filter="訓練"]')).toHaveAttribute("aria-pressed", "true");
  }
  const after = (await read(page)).state.life;
  expect(after.plan.map(a => a.id)).toEqual(Array(7).fill("acting"));
  expect(after.day).toBe(0);
  expect(after.game.week).toBe(gameBefore.week);
  expect(after.game.money).toBe(gameBefore.money);
  expect(after.game.stats).toEqual(gameBefore.stats);
  // Explicitly selecting an earlier date still allows a single-day correction.
  await page.locator('[data-day="1"]').click();
  await page.locator('[data-plan="vocal"]').click();
  expect((await read(page)).state.life.plan.map(a => a.id)).toEqual([
    "acting", "vocal", "acting", "acting", "acting", "acting", "acting",
  ]);
});

test("接續排程略過正式約定，未開放活動不改動日期", async ({ page }) => {
  await start(page, state => {
    state.life.day = 2;
    expect(bookCareer(state.life, CHOICES, "social_post", { type: "daily" }, 3).ok).toBe(true);
  });
  await page.locator("#week-control").click();
  const original = (await read(page)).state.life.plan;
  await expect(page.locator('[data-day="0"]')).toBeDisabled();
  await expect(page.locator('[data-day="1"]')).toBeDisabled();
  await page.locator('[data-plan="acting"]').click();
  await expect(page.locator('[data-day="4"]')).toHaveClass("selected");
  await page.locator('[data-plan="acting"]').click();
  await expect(page.locator('[data-day="5"]')).toHaveClass("selected");
  const after = (await read(page)).state.life.plan;
  for (const day of [0, 1, 3, 5, 6]) expect(after[day]).toEqual(original[day]);
  await expect(page.locator('[data-plan="creative"]')).toBeDisabled();
  await expect(page.locator('[data-day="5"]')).toHaveClass("selected");
});

test("場景放大與縮小皆能一鍵回原比例，設定與行程不受影響", async ({ page }) => {
  await start(page);
  const before = await read(page);
  await settings(page);
  await page.locator('[data-ui="zoom-in"]').click();
  await page.locator('[data-ui="zoom-in"]').click();
  expect((await read(page)).zoom).toBeGreaterThan(before.zoom);
  await page.locator('#panel-content [data-ui="reset-view"]').click();
  await expect.poll(async () => (await read(page)).zoom).toBeCloseTo(before.zoom, 5);
  await page.locator('[data-ui="zoom-out"]').click();
  expect((await read(page)).zoom).toBeLessThan(before.zoom);
  await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
  await page.locator("#reset-view").click();
  await expect.poll(async () => (await read(page)).zoom).toBeCloseTo(before.zoom, 5);
  const after = (await read(page)).state.life;
  expect(after.plan).toEqual(before.state.life.plan);
  expect(after.day).toBe(before.state.life.day);
  expect(after.game.money).toBe(before.state.life.game.money);
  await expect(page.locator("#toast")).toHaveText("已回到原比例");
});

test("手機頁面放大後，還原按鈕保持可點且恢復 100%，之後仍能縮放", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium" || !test.info().project.use.isMobile, "CDP mobile pinch-scale emulation is Chromium-only");
  await start(page);
  await page.locator("#week-control").click();
  const activity = page.locator('[data-plan="acting"]');
  await activity.scrollIntoViewIfNeeded();
  const originalViewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  const scrollTop = await page.locator("#panel").evaluate(node => node.scrollTop);
  const cdp = await page.context().newCDPSession(page);
  for (const scale of [2, 1.5]) {
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: scale });
    await expect.poll(() => page.evaluate(() => window.visualViewport.scale)).toBeCloseTo(scale, 2);
    await expect(page.locator("#panel > #viewport-reset")).toBeVisible();
    const bounds = await page.locator("#viewport-reset").boundingBox();
    const viewport = await page.evaluate(() => ({
      left: window.visualViewport.offsetLeft, top: window.visualViewport.offsetTop,
      width: window.visualViewport.width, height: window.visualViewport.height,
    }));
    expect(bounds.x).toBeGreaterThanOrEqual(viewport.left);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.left + viewport.width + 1);
    expect(bounds.y).toBeGreaterThanOrEqual(viewport.top);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.top + viewport.height + 1);
    await page.locator("#viewport-reset").tap();
    await expect.poll(() => page.evaluate(() => window.visualViewport.scale)).toBeCloseTo(1, 2);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", originalViewport);
    await expect(page.locator("#viewport-reset")).toBeHidden();
    expect(Math.abs(await page.locator("#panel").evaluate(node => node.scrollTop) - scrollTop)).toBeLessThan(2);
  }
  await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  await expect(page.locator("body > #viewport-reset")).toBeVisible();
  await page.locator("#viewport-reset").tap();
  await expect.poll(() => page.evaluate(() => window.visualViewport.scale)).toBeCloseTo(1, 2);
});
