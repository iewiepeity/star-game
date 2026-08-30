import { test, expect } from "@playwright/test";

// These checks exercise the document itself. Blocking the service worker keeps
// its first-install controller reload from stealing focus during keyboard tests.
test.use({ serviceWorkers: "block" });

test("鍵盤使用者可跳到遊戲內容且主要互動有可見焦點", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#app")).toBeFocused();
  await expect(page.locator("#app")).toHaveAttribute("role", "main");
});

test("減少動態偏好會停用非必要動畫", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const durationSeconds = await page.locator("#app").evaluate((node) => {
    const value = getComputedStyle(node).animationDuration.trim();
    return value.endsWith("ms")
      ? Number.parseFloat(value) / 1000
      : Number.parseFloat(value);
  });
  expect(durationSeconds).toBeLessThanOrEqual(0.00001);
});

test("手機建立角色頁沒有水平溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("App 視窗會管理焦點、支援 Esc 並回到觸發入口", async ({ page }) => {
  await page.goto("/");
  await page.locator("#player-name").fill("鍵盤測試");
  await page.locator("#player-name").dispatchEvent("input");
  await page.locator("#to-stats").click();
  await page.locator("#start").click();
  await page.locator("[data-skip-onboarding]").click();
  await page.locator("[data-app-library-toggle]").click();
  const trigger = page.locator('.home-launchers [data-open-app="settings"]');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await expect(page.locator(".app-window.settings")).toBeVisible();
  await expect(page.locator(".app-window.settings")).toContainText("遊戲設定");
  await page.keyboard.press("Escape");
  await expect(page.locator(".app-window")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
