import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { ROOMS } from "../../src/pixel/data.js";
import { CITY_DETAIL_COPY } from "../../src/pixel/city-interaction-copy.js";

test.use({ serviceWorkers: "block" });

for (const room of ["beach", "clinic"]) {
  test(`${room}: walking to the detail shows an observation without authoring rules`, async ({ page }, info) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const state = initialPixelState();
    state.flags.intro = true;
    state.sceneId = room;
    state.position = { ...ROOMS[room].entry };
    state.life.speed = 16;
    await page.addInitScript(s => {
      localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state: s }));
    }, state);
    await page.goto("/pixel.html");
    await expect(page.locator("#loading")).toBeHidden({ timeout: 15000 });
    const before = await page.evaluate(() => window.__pixelRead().state.life);
    await page.locator('[data-ui="menu"]').first().click();
    await page.locator('#panel [data-ui="nearby"]').click();
    await page.locator('[data-object="detail"]').click();
    await expect(page.locator("#panel[open]")).toContainText(CITY_DETAIL_COPY[room], { timeout: 20000 });
    await expect(page.locator("#panel")).not.toContainText(/NPC|不可通行|可走岸線|不安排|觸發|avatar/);
    const after = await page.evaluate(() => window.__pixelRead().state.life);
    expect(after.day).toBe(before.day);
    expect(after.game.money).toBe(before.game.money);
    expect(after.game.stats).toEqual(before.game.stats);
    expect(after.ledger).toEqual(before.ledger);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath(`${room}-player-observation.png`) });
  });
}
