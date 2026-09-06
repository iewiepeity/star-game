import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { initialState } from "../../src/core/state.js";

const entryUrl = (path, baseURL) =>
  new URL(path, process.env.PIXEL_ENTRY_BASE_URL || baseURL).href;

test("homepage opens pixel life, preserves the save and does not trap Back navigation", async ({ page, baseURL }) => {
  const saved = initialPixelState();
  saved.flags.intro = true;
  saved.playerName = "首頁接續測試";
  saved.life.game.week = 7;
  saved.life.game.money = 12345;
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(saved => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state: saved }));
  }, saved);

  await page.goto(entryUrl("pixel.html", baseURL));
  await expect(page.locator("#loading")).toBeHidden();
  // Seed an independent original-game save without its pagehide autosave running.
  const legacySave = JSON.stringify({ game: "star-game", v: 16, state: initialState(), savedAt: Date.now(), label: "自動存檔" });
  await page.evaluate(value => localStorage.setItem("star-game-save", value), legacySave);
  for (const path of ["./?v=home-entry#resume", "index.html?v=home-entry#resume"]) {
    await page.goto(entryUrl(path, baseURL));
    await expect(page).toHaveURL(entryUrl("pixel.html?v=home-entry#resume", baseURL));
    await expect(page.locator("#loading")).toBeHidden();
    await expect(page.getByRole("button", { name: "開啟選單" })).toBeVisible();
    const loaded = await page.evaluate(() => window.__pixelRead().state);
    expect(loaded.playerName).toBe(saved.playerName);
    expect(loaded.life.game.week).toBe(7);
    expect(loaded.life.game.money).toBe(12345);
    expect(await page.evaluate(() => localStorage.getItem("star-game-save"))).toBe(legacySave);
    await page.goBack();
    await expect(page).toHaveURL(entryUrl("pixel.html", baseURL));
    await expect(page.locator("#loading")).toBeHidden();
  }
  await page.goto(entryUrl("classic.html", baseURL));
  await expect(page.locator("#app")).toBeVisible();
  expect(errors).toEqual([]);
});

test("cached homepage still enters pixel life while offline", async ({ page, context, baseURL }, info) => {
  test.skip(info.project.name !== "desktop", "Service worker lifecycle is checked once in Chromium.");
  const saved = initialPixelState();
  saved.flags.intro = true;
  await page.addInitScript(saved => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state: saved }));
  }, saved);
  await page.goto(entryUrl("./", baseURL));
  await expect(page.locator("#loading")).toBeHidden();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  // Wait for the actual entry and boot resources, not a fixed network delay.
  await expect.poll(() => page.evaluate(async () => {
    const paths = ["./index.html", "./src/entry.js", "./pixel.html", "./src/pixel/main.js", "./assets/vendor/phaser.esm.min.js"];
    return (await Promise.all(paths.map(path => caches.match(new URL(path, location.href))))).every(Boolean);
  })).toBe(true);
  await context.setOffline(true);
  try {
    await page.goto(entryUrl("index.html?offline-entry=1", baseURL));
    await expect(page).toHaveURL(entryUrl("pixel.html?offline-entry=1", baseURL));
    await expect(page.locator("#loading")).toBeHidden();
    await page.getByRole("button", { name: "開啟選單" }).click();
    await expect(page.locator(".command-menu")).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
