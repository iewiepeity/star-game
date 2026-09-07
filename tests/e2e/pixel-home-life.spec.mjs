import { initialPixelState } from "../../src/pixel/model.js";
import { test, expect } from "@playwright/test";

const read = (page) => page.evaluate(() => window.__pixelRead());

async function start(page) {
  const fixture = initialPixelState();
  fixture.life.game.money = 30000;
  fixture.life.game.knownPeople = ["jiqing"];
  fixture.life.game.relationships.jiqing = {
    closeness: 70,
    trust: 65,
    romance: "dating",
    affection: 70,
    hostility: 0,
    stage: "confidant",
    events: [],
    hostilityHistory: [],
    romanceHistory: [],
    affectionHistory: [],
  };
  await page.addInitScript((state) => {
    localStorage.setItem(
      "star-game-pixel-phase-one-v1",
      JSON.stringify({ state }),
    );
  }, fixture);
  await page.goto("/pixel.html");
  await page.getByRole("button", { name: "開始我的一天 →" }).click();
  await page.locator('[data-onboarding="skip"]').click();
}

async function openHome(page) {
  await page.getByRole("button", { name: "開啟選單" }).click();
  await page.locator('#panel [data-ui="home-life"]').click();
}

test("居家生活可購買擺設、安排作客，並在重載後保留", async ({ page }) => {
  await start(page);
  await openHome(page);
  await expect(page.getByRole("heading", { name: "居家生活" })).toBeVisible();

  await page.locator('[data-home-buy="rose_sofa"]').click();
  await page.locator('[data-home-place="rose_sofa"]').click();
  await expect(page.locator('[data-home-slot="sofa"]')).toContainText("玫瑰絨布沙發");

  await page.locator('[data-home-tab="visits"]').click();
  await page.locator('[data-home-visit="jiqing"][data-home-activity="dinner"]').click();
  await page.locator('[data-home-plan-day="2"]').click();

  let game = (await read(page)).state.life.game;
  expect(game.homeLife.placedFurniture.sofa).toBe("rose_sofa");
  expect(game.npcSchedules.jiqing.some((slot) => slot.day === 2 && slot.status === "reserved")).toBe(true);
  expect((await read(page)).state.life.plan[2]).toMatchObject({ id: "home_host", npcId: "jiqing" });

  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  game = (await read(page)).state.life.game;
  expect(game.homeLife.placedFurniture.sofa).toBe("rose_sofa");
  expect((await read(page)).state.life.plan[2]).toMatchObject({ id: "home_host", npcId: "jiqing" });
});
