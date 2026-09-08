import { revealControl } from "./reveal-control.mjs";
import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";

test("CSP blocks script injection while game and privacy entry remain usable", async ({ page, context }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await expect(page.locator('[data-create-field="realName"]')).toHaveAttribute("autocomplete", "off");
  const malicious = '\"><svg onload=alert(1)>';
  await page.locator('[data-create-field="realName"]').fill(malicious);
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "window.__injected = true";
    document.body.append(script);
  });
  expect(await page.evaluate(() => window.__injected)).toBeUndefined();
  expect(await context.cookies()).toEqual([]);
  await page.getByRole("link", { name: "隱私與本機資料", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("隱私與本機資料");
  await expect(page.locator("#erase-data")).toBeDisabled();
  expect(errors).toEqual([]);
});

test("imported hostile name is escaped and settings links to scoped data erasure", async ({ page }) => {
  const state = initialPixelState();
  state.flags.intro = true;
  state.playerName = '<svg/onload=1>';
  state.life.game.realName = '<svg/onload=1>';
  await page.goto("/privacy.html");
  await page.evaluate(state => localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state })), state);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await page.locator('[data-ui="profile"]').first().click();
  await expect(page.locator("#real-name-input")).toHaveValue('<svg/onload=1>');
  expect(await page.locator("#panel svg[onload]").count()).toBe(0);
  await page.locator('[data-ui="close"]').first().click();
  await page.getByRole("button", { name: "開啟選單", exact: true }).click();
  await page.locator('#panel [data-ui="settings"]').click();
  await revealControl(page.getByRole("link", { name: "查看隱私說明／清除本遊戲資料" }));
  await expect(page.getByRole("link", { name: "查看隱私說明／清除本遊戲資料" })).toBeVisible();
});

test("explicit erase clears game data and stops an open game tab without deleting other projects", async ({ page, context }) => {
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await page.evaluate(async () => {
    localStorage.setItem("other-project", "keep");
    localStorage.setItem("star-game-preferences", "{}");
    await caches.open("other-project-cache");
    await caches.open("star-game-runtime-test");
  });
  const privacy = await context.newPage();
  await privacy.goto("/privacy.html");
  await privacy.locator("#erase-confirmation").fill("清除");
  await privacy.locator("#erase-data").click();
  await expect(privacy.locator("#erase-status")).toContainText("已清除本遊戲");
  await expect(page).toHaveURL(/privacy.html$/);
  const remaining = await privacy.evaluate(async () => ({ keys: Object.keys(localStorage), caches: await caches.keys(), databases: (await window.indexedDB.databases()).map(d => d.name) }));
  expect(remaining.keys).toEqual(["other-project"]);
  expect(remaining.caches).toEqual(["other-project-cache"]);
  expect(remaining.databases).not.toContain("star-game-pixel-saves-v2");
});
