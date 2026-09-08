import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";

test.use({ serviceWorkers: "block" });
async function start(page, week) {
  const state = initialPixelState();
  state.flags.intro = true;
  state.life.game.pixelPrologueActive = false;
  state.life.game.week = week;
  state.life.game.weekResults = [];
  state.life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  await page.addInitScript((state) => {
    if (!sessionStorage.getItem("growth-depth-seeded")) {
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state }),
      );
      sessionStorage.setItem("growth-depth-seeded", "yes");
    }
  }, state);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await page.locator("#week-control").click();
}

test("week-eight planner warns of next week's tuition before the subsidy changes", async ({
  page,
}) => {
  await start(page, 8);
  await expect(page.locator("[data-training-subsidy]")).toContainText(
    "下週將改為8折",
  );
  await expect(page.locator("[data-weekly-goal]")).toHaveCount(0);
});

test("year-three goal choice updates its visible requirements and persists after reload", async ({
  page,
}) => {
  await start(page, 105);
  await page.locator(".planner-extras > summary").click();
  await page.locator(".weekly-task summary").click();
  await page.locator('[data-weekly-goal="team"]').click();
  await expect(page.locator('[data-weekly-goal="team"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".weekly-task")).toContainText(
    "製作 1 天＋人物相處／合作 1 天",
  );
  await expect
    .poll(() =>
      page.evaluate(() => window.__pixelRead().state.life.game.weeklyGoal?.id),
    )
    .toBe("team");
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await page.locator("#week-control").click();
  await page.locator(".planner-extras > summary").click();
  await page.locator(".weekly-task summary").click();
  await expect(page.locator('[data-weekly-goal="team"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
