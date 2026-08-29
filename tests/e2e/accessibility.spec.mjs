import { test, expect } from "@playwright/test";

test("鍵盤使用者可跳到遊戲內容且主要互動有可見焦點",async({page})=>{
 await page.goto("/");
 await page.keyboard.press("Tab");
 await expect(page.locator(".skip-link")).toBeFocused();
 await page.keyboard.press("Enter");
 await expect(page.locator("#app")).toBeFocused();
 await expect(page.locator("#app")).toHaveAttribute("role","main");
});

test("減少動態偏好會停用非必要動畫",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 const duration=await page.locator("#app").evaluate(node=>getComputedStyle(node).animationDuration);
 expect(["0.01ms","0s"]).toContain(duration);
});

test("手機建立角色頁沒有水平溢出",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto("/");
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow).toBeLessThanOrEqual(1);
});
