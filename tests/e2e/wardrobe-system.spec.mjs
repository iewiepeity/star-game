import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });
async function start(page) {
  await page.goto("/");
  await page.locator("#player-real-name").fill("換裝測試");
  await page.locator("#to-stats").click();
  await page.locator("#start").click();
  await page.locator("[data-skip-onboarding]").click();
  await page.locator(".player-chip").click();
}
async function read(page) {
  return page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    return {
      money: state.money,
      outfit: state.outfitId,
      owned: state.ownedOutfits,
      looks: state.savedLooks,
    };
  });
}
test("試穿不扣款與存檔，購買後資訊、房間、社群同步，常用造型可重載", async ({
  page,
}) => {
  await start(page);
  const original = await read(page);
  await page.locator('button[data-preview-outfit="stage"]').last().click();
  await expect(page.locator("[data-cancel-fitting]")).toBeVisible();
  expect(await read(page)).toEqual(original);
  await expect(page.locator('[data-outfit="stage"]')).toBeDisabled();
  await page.locator("[data-cancel-fitting]").click();
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    state.money = 9000;
    state.visitedLocationsByWeek[state.week] = ["shop"];
    (await import("/src/render.js")).render();
  });
  await page.locator('button[data-preview-outfit="stage"]').last().click();
  await page.locator('[data-outfit="stage"]').click();
  await page.locator("button[data-confirm-cancel]").click();
  expect((await read(page)).money).toBe(9000);
  await page.locator('[data-outfit="stage"]').click();
  await page.locator("[data-confirm-accept]").click();
  await expect(page.locator(".wardrobe-current")).toContainText("舞台造型");
  expect((await read(page)).money).toBe(5500);
  await page.locator(".saved-looks summary").click();
  await page.locator('[data-save-look="stage"]').click();
  await page.locator('button[data-preview-outfit="newcomer"]').click();
  await page.locator('[data-outfit="newcomer"]').click();
  await expect(page.locator(".wardrobe-current")).toContainText("新人私服");
  await page.locator('[data-wear-look="stage"]').click();
  await expect(page.locator(".wardrobe-current")).toContainText("舞台造型");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    (await import("/src/core/app-navigation.js")).openApp(state, "stats");
    (await import("/src/render.js")).render();
  });
  await expect(
    page.locator('.player-look-card [data-player-look="raven:stage"]'),
  ).toBeVisible();
  await expect(
    page.locator('.player-chip [data-player-look="raven:stage"]'),
  ).toHaveCount(1);
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    (await import("/src/core/app-navigation.js")).openApp(state, "social");
    (await import("/src/render.js")).render();
  });
  await expect(
    page.locator('.social-profile [data-player-look="raven:stage"]'),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("star-game-save") || "{}").state
            ?.outfitId,
      ),
    )
    .toBe("stage");
  await page.reload();
  expect((await read(page)).looks.raven.stage).toBe("stage");
  expect((await read(page)).outfit).toBe("stage");
});
test("試衣間在窄螢幕可操作，篩選與常用造型不跨人物混用", async ({
  page,
}, testInfo) => {
  await start(page);
  await page.locator('[data-wardrobe-filter="owned"]').click();
  await expect(page.locator(".outfit-card")).toHaveCount(1);
  await page.locator("[data-wardrobe-category]").selectOption("stage");
  await expect(page.locator(".closet-empty")).toBeVisible();
  await page.locator('[data-wardrobe-filter="shop"]').click();
  await page.locator('button[data-preview-outfit="icon"]').last().click();
  await expect(page.locator("[data-cancel-fitting]")).toBeInViewport();
  expect(
    await page.locator("html").evaluate((e) => e.scrollWidth - e.clientWidth),
  ).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("wardrobe.png") });
  await page.locator('[data-wardrobe-avatar="sunny"]').click();
  await expect(page.locator(".wardrobe-art img")).toHaveAttribute(
    "src",
    /sunny-newcomer/,
  );
  expect((await read(page)).outfit).toBe("newcomer");
});
test("圖片載入失敗時不切換，能再次試穿", async ({ page }) => {
  await start(page);
  await page.route("**/assets/avatars/raven-icon.webp", (route) =>
    route.abort(),
  );
  await page.locator('button[data-preview-outfit="icon"]').last().click();
  await expect(page.locator(".wardrobe-notice")).toContainText("載入失敗");
  expect((await read(page)).outfit).toBe("newcomer");
  await page.locator('button[data-preview-outfit="icon"]').click();
  await expect(
    page.locator('button[data-preview-outfit="icon"]'),
  ).toBeEnabled();
  await page.unroute("**/assets/avatars/raven-icon.webp");
  await page.locator('button[data-preview-outfit="icon"]').last().click();
  await expect(page.locator("[data-cancel-fitting]")).toBeVisible();
});
