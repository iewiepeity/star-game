import { initialPixelState } from "../../src/pixel/model.js";
import { test, expect } from "@playwright/test";

const read = (page) => page.evaluate(() => window.__pixelRead());

async function start(page) {
  const fixture = initialPixelState();
  fixture.life.game.money = 30000;
  fixture.life.speed = 16;
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
    if (localStorage.getItem("star-game-pixel-phase-one-v1")) return;
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
  expect(
    (await read(page)).furniture.find((item) => item.id === "sofa").home.itemId,
  ).toBe("rose_sofa");
  await expect(page.locator('[data-home-slot="sofa"]')).toContainText(
    "玫瑰絨布沙發",
  );

  await page.locator('[data-home-tab="visits"]').click();
  await page
    .locator('[data-home-visit="jiqing"][data-home-activity="dinner"]')
    .click();
  await page.locator('[data-home-plan-day="2"]').click();

  let game = (await read(page)).state.life.game;
  expect(game.homeLife.placedFurniture.sofa).toBe("rose_sofa");
  expect(
    game.npcSchedules.jiqing.some(
      (slot) => slot.day === 2 && slot.status === "reserved",
    ),
  ).toBe(true);
  expect((await read(page)).state.life.plan[2]).toMatchObject({
    id: "home_host",
    npcId: "jiqing",
  });

  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  game = (await read(page)).state.life.game;
  expect(game.homeLife.placedFurniture.sofa).toBe("rose_sofa");
  expect((await read(page)).state.life.plan[2]).toMatchObject({
    id: "home_host",
    npcId: "jiqing",
  });
});

for (const activity of ["craft", "visit"]) {
  test(`手動${activity === "craft" ? "製作" : "作客"}保留參數並完整結算，重載不重複收益`, async ({
    page,
  }, info) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await start(page);
    await openHome(page);
    if (activity === "craft") {
      await page.locator('[data-home-tab="craft"]').click();
      await page.locator('[data-home-supply="pantry"]').click();
      await page.locator('[data-home-recipe="cocoa_cookie"]').click();
    } else {
      await page.locator('[data-home-tab="visits"]').click();
      await page
        .locator('[data-home-visit="jiqing"][data-home-activity="movie"]')
        .click();
    }
    await page.locator('[data-home-plan-day="0"]').click();
    await page.locator('#panel-content [data-ui="close"]').click();
    await page.locator("#run-label").click();
    await page
      .locator(`[data-start="home_${activity === "craft" ? "craft" : "host"}"]`)
      .click();
    await expect
      .poll(async () => (await read(page)).state.life.pending?.phase, {
        timeout: 30000,
      })
      .toBe("result");
    const before = await read(page);
    expect(before.state.life.ledger[0].success).toBe(true);
    if (activity === "craft") {
      expect(before.state.life.game.homeLife.craftedItems).toHaveLength(1);
      expect(before.state.life.game.homeLife.materials.cocoa).toBe(0);
    } else {
      expect(before.npcs.some((npc) => npc.id === "jiqing")).toBe(true);
      expect(before.state.life.game.homeLife.visits).toHaveLength(1);
      expect(before.state.life.ledger[0].notes.join("")).toContain(
        "電影播到片尾",
      );
    }
    await page.screenshot({
      path: info.outputPath(`home-${activity}-result.png`),
    });
    await page.reload();
    await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
    const after = await read(page);
    expect(after.state.life.game.homeLife).toEqual(
      before.state.life.game.homeLife,
    );
    expect(after.state.life.ledger).toEqual(before.state.life.ledger);
    expect(errors).toEqual([]);
  });
}
