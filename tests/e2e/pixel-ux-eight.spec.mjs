import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { recordMeeting } from "../../src/pixel/life.js";
import { resumePixelSave } from "./pixel-save-ready.mjs";
import { revealControl } from "./reveal-control.mjs";

test.use({ serviceWorkers: "block" });
const read = page => page.evaluate(() => window.__pixelRead().state.life);
async function start(page) {
  const seed = initialPixelState();
  seed.flags.intro = true;
  seed.life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  seed.life.game.money = 20000;
  recordMeeting(seed.life, "jiqing");
  seed.knownPeople = ["jiqing"];
  Object.assign(seed.life.game.relationships.jiqing, { romance: "married", visibility: "underground", ceremony: "undecided", closeness: 80, trust: 80 });
  seed.life.game.partnerId = "jiqing";
  await page.addInitScript(s => {
    if (!sessionStorage.getItem("ux-eight-seeded")) {
      localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state: s }));
      sessionStorage.setItem("ux-eight-seeded", "yes");
    }
  }, seed);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await resumePixelSave(page);
}
async function menu(page, action) {
  await page.getByRole("button", { name: "開啟選單", exact: true }).click();
  await page.locator(`#panel [data-ui="${action}"]`).click();
}
async function app(page, id) {
  await menu(page, "phone");
  await page.locator(`[data-pixel-app="${id}"]`).last().click();
}

test("連排時固定日期提示可見，復原只改最後一天", async ({ page }) => {
  await start(page);
  const before = await read(page);
  await page.locator("#week-control").click();
  await page.locator('[data-plan="acting"]').click();
  await page.locator('[data-plan="acting"]').click();
  await expect(page.locator(".planner-context")).toContainText("正在安排星期三");
  await expect(page.locator(".planner-context")).toBeInViewport();
  await page.locator("[data-routine-undo]").click();
  await expect(page.locator(".planner-context")).toContainText("正在安排星期二");
  const after = await read(page);
  expect(after.plan.slice(0, 2)).toEqual([{ id: "acting" }, { id: "rest" }]);
  expect(after.day).toBe(before.day);
  expect(after.game.money).toBe(before.game.money);
});

test("設定摺疊在修改後保持展開，大字仍能操作", async ({ page }) => {
  await start(page);
  await menu(page, "settings");
  await expect(page.locator('[data-ui="reset-view"]')).toBeVisible();
  await page.locator('[data-pixel-pref="fontSize"][data-value="large"]').click();
  const theme = page.locator('[data-pixel-theme="rose"]');
  await revealControl(theme);
  await theme.click();
  await expect(theme).toBeVisible();
  await expect(theme).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-pixel-pref="fontSize"][data-value="large"]')).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("#panel").evaluate(el => el.scrollWidth <= el.clientWidth + 2)).toBe(true);
});

test("人物速覽可直接找人，婚禮確認與取消不誤觸", async ({ page }) => {
  await start(page);
  await app(page, "people");
  await page.locator('[data-people-section="profiles"]').click();
  await expect(page.locator(".npc-quick-actions")).toContainText("不耗一天");
  await page.locator('[data-npc-profile-tab="relationship"]').click();
  await page.locator('[data-romance-ceremony="small"]').click();
  await expect(page.locator("#panel")).toContainText("不能重複舉辦");
  expect((await read(page)).game.relationships.jiqing.ceremony).toBe("undecided");
  await page.locator('[data-pixel-app="people"]').click();
  expect((await read(page)).game.relationships.jiqing.ceremony).toBe("undecided");
  await page.locator('[data-romance-ceremony="small"]').click();
  await page.locator('[data-confirm-relationship="yes"]').click();
  expect((await read(page)).game.relationships.jiqing.ceremony).toBe("small");
  expect((await read(page)).game.relationships.jiqing.visibility).toBe("underground");
});

test("地圖可用情境加搜尋，沒有約定時不捏造人物位置", async ({ page }) => {
  await start(page);
  await app(page, "map");
  await page.locator('[data-map-purpose="appointment"]').click();
  await expect(page.locator(".map-no-results")).toBeVisible();
  await expect(page.locator(".map-no-results")).toContainText("今天沒有");
  await page.locator('[data-map-purpose="training"]').click();
  await page.locator("#map-search").fill("演技");
  await expect(page.locator(".city-place-row:visible")).not.toHaveCount(0);
  await page.locator(".city-place-row:visible").first().click();
  await expect(page.locator("#map-detail")).toContainText("占一天");
  await expect(page.locator("#map-detail")).toContainText("不耗一天");
});
