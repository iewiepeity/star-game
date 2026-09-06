import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { ROOMS } from "../../src/pixel/data.js";
test.use({ serviceWorkers: "block" });
const read = (p) => p.evaluate(() => window.__pixelRead());
async function start(page, scene = "home") {
  const state = initialPixelState();
  state.flags.intro = true;
  state.sceneId = scene;
  state.position = { ...ROOMS[scene].entry };
  await page.addInitScript((s) => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state: s }),
      );
  }, state);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden();
}
async function inspect(page, id) {
  await page.locator('[data-ui="menu"]').click();
  await page.locator('#panel [data-ui="nearby"]').click();
  await page.locator(`[data-object="${id}"]`).click();
  await expect(page.locator("#panel")).toBeVisible();
}
test("furniture states change visibly and survive reload; observations cost nothing", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const before = (await read(page)).state.life;
  await inspect(page, "prop-wardrobe-doors");
  await page.locator('[data-object-state="open"]').click();
  await expect(page.locator(".object-state")).toHaveText("櫃門開著");
  await page.locator('[data-ui="close"]').first().click();
  await inspect(page, "prop-blinds");
  await page.locator('[data-object-state="closed"]').click();
  await page.locator('[data-ui="close"]').first().click();
  await inspect(page, "prop-lamp");
  await page.locator('[data-object-state="off"]').click();
  await page.locator('[data-ui="close"]').first().click();
  await page.screenshot({ path: info.outputPath("home-furniture.png") });
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  const result = await read(page);
  expect(result.state.objectStates.home).toEqual({
    "prop-wardrobe-doors": "open",
    "prop-blinds": "closed",
    "prop-lamp": "off",
  });
  expect(
    result.furniture.find((o) => o.id === "prop-wardrobe-doors").value,
  ).toBe("open");
  expect(result.state.life.day).toBe(before.day);
  expect(result.state.life.game.money).toBe(before.game.money);
  expect(errors).toEqual([]);
});
test("one click returns home, cancels automatic roaming, and retains props at both locations", async ({
  page,
}, info) => {
  await start(page, "cafe");
  await inspect(page, "prop-pendant-a");
  await page.locator('[data-object-state="off"]').click();
  await page.locator('[data-ui="close"]').first().click();
  const before = (await read(page)).state.life;
  await page.getByRole("button", { name: "一鍵回家" }).click();
  await expect.poll(async () => (await read(page)).scene).toBe("home");
  await expect(page.getByRole("button", { name: "一鍵回家" })).toBeDisabled();
  const after = (await read(page)).state;
  expect(after.life.day).toBe(before.day);
  expect(after.life.game.money).toBe(before.game.money);
  expect(after.life.auto).toBe(false);
  expect(after.objectStates.cafe["prop-pendant-a"]).toBe("off");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("home-shortcut.png") });
});
test("direct mouse/touch on a visible prop opens its reaction without entering a daily activity", async ({
  page,
}) => {
  await start(page);
  // The camera worldView is updated by Phaser on the render frame after ready.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(resolve),
        ),
      ),
  );
  const prop = ROOMS.home.objects.find((o) => o.id === "prop-lamp");
  const camera = (await read(page)).camera,
    box = await page.locator("#world canvas").boundingBox();
  const x = box.x + (prop.x - camera.x) * camera.zoom,
    y = box.y + (prop.y - camera.y) * camera.zoom;
  // Small screens pan to the character. First use nearby to keep the same path
  // accessible even when the authored object is outside the current camera.
  if (x < box.x || x > box.x + box.width || y < box.y || y > box.y + box.height)
    await inspect(page, prop.id);
  else if (test.info().project.use.hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y, { delay: 60 });
  await expect(page.locator("#panel-title")).toHaveText("床頭燈");
  expect((await read(page)).state.life.pending).toBeNull();
});
test("home download failure keeps the original room and can be retried", async ({
  page,
}) => {
  await page.route("**/assets/pixel/home.png", (route) => route.abort());
  await start(page, "cafe");
  await page.getByRole("button", { name: "一鍵回家" }).click();
  await expect(page.locator("#toast")).toContainText("住處素材載入失敗");
  expect((await read(page)).scene).toBe("cafe");
  await expect(page.getByRole("button", { name: "一鍵回家" })).toBeEnabled();
  await page.unroute("**/assets/pixel/home.png");
  await page.getByRole("button", { name: "一鍵回家" }).click();
  await expect.poll(async () => (await read(page)).scene).toBe("home");
});
