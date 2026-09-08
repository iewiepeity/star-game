import { revealControl } from "./reveal-control.mjs";
import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
const read = (p) => p.evaluate(() => window.__pixelRead?.());
async function start(p, configure = () => {}, intro = true) {
  const s = initialPixelState();
  s.flags.intro = intro;
  s.life.speed = 16;
  configure(s);
  await p.addInitScript((s) => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state: s }),
      );
  }, s);
  await p.goto("/pixel.html");
  await expect(p.locator("#loading")).toBeHidden();
}
async function menu(p, id) {
  await p.locator('[data-ui="menu"]').first().click();
  if (id) await p.locator(`#panel [data-ui="${id}"]`).click();
}
async function close(p) {
  await p.getByRole("button", { name: "關閉視窗" }).click();
}
test("five palette themes apply across settings, gameplay, and reload without modifying the save", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await menu(page, "settings");
  await expect(page.locator("button[data-pixel-theme]")).toHaveCount(5);
  for (const id of ["cream", "rose", "sage", "lilac", "night"]) {
    await revealControl(page.locator(`button[data-pixel-theme="${id}"]`));
    await page.locator(`button[data-pixel-theme="${id}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("data-pixel-theme", id);
    await page.screenshot({
      animations: "disabled",
      path: info.outputPath("settings-" + id + ".png"),
    });
  }
  await revealControl(page.locator('[data-set-speed="4"]'));
  await page.locator('[data-set-speed="4"]').click();
  expect((await read(page)).state.life.speed).toBe(4);
  await close(page);
  await menu(page, "schedule");
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("schedule-night.png"),
  });
  await close(page);
  await menu(page);
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("menu-night.png"),
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-pixel-theme",
    "night",
  );
  await expect(page.locator("#loading")).toBeHidden();
  expect((await read(page)).state.life.game.money).toBe(18000);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("transient toast is centered above the HUD and stays visible inside a modal", async ({
  page,
}, info) => {
  await start(page);
  await menu(page, "settings");
  await revealControl(page.locator('[data-ui="pause"]'));
  await page.locator('[data-ui="pause"]').click();
  const toast = page.locator("#toast");
  await expect(toast).toHaveClass(/visible/);
  const t = await toast.boundingBox(),
    bar = await page.locator(".bottom-bar").boundingBox();
  expect(t.y + t.height).toBeLessThan(bar.y - 20);
  expect(t.y).toBeGreaterThan(page.viewportSize().height * 0.15);
  expect(await toast.evaluate((e) => e.parentElement.id)).toBe("panel");
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("centered-toast.png"),
  });
  await close(page);
  await expect(toast).toHaveClass(/visible/);
  await expect(toast).not.toHaveClass(/visible/, { timeout: 5000 });
});
test("starting gender is fixed, and a clinic change requires confirmation and pays only once", async ({
  page,
}, info) => {
  await start(page, (s) => {
    s.life.game.money = 100000;
    s.life.game.ownedOutfits.raven.push("practice");
  });
  await menu(page, "profile");
  await expect(page.locator("[data-avatar]")).toHaveCount(2);
  await expect(page.locator('[data-avatar="noir"]')).toHaveCount(0);
  await page.locator('[data-ui="clinic"]').click();
  await page.locator('[data-map-enter="clinic"]').click();
  await expect(page.locator("#panel")).toHaveAttribute("data-view", "clinic", {
    timeout: 15000,
  });
  await page.locator('[data-request-gender="noir"]').click();
  expect((await read(page)).state.life.game.money).toBe(100000);
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("clinic-confirm.png"),
  });
  await page.locator('[data-confirm-gender="noir"]').click();
  await expect(page.locator("#panel")).toHaveAttribute("data-view", "profile", {
    timeout: 15000,
  });
  let s = (await read(page)).state;
  expect(s.life.game.money).toBe(40000);
  expect(s.identity.gender).toBe("男性");
  expect(s.identity.changes).toHaveLength(1);
  expect(s.life.game.ownedOutfits.raven).toContain("practice");
  await expect(page.locator('[data-avatar="raven"]')).toHaveCount(0);
  await page.locator('[data-avatar="sage"]').click();
  await expect
    .poll(async () => (await read(page)).player.outfit)
    .toBe("sage-newcomer");
  await page.reload();
  await expect
    .poll(async () => (await read(page))?.state.avatarId)
    .toBe("sage");
  s = (await read(page)).state;
  expect(s.life.game.money).toBe(40000);
  expect(s.identity.gender).toBe("男性");
  expect(s.identity.changes).toHaveLength(1);
});
test("new game gender selection narrows portraits before the journey starts", async ({
  page,
}) => {
  await start(page, () => {}, false);
  await expect(page.locator("[data-avatar]")).toHaveCount(2);
  await page.locator('[data-create-gender="男性"]').click();
  await expect(page.locator('[data-avatar="noir"]')).toBeVisible();
  await expect(page.locator('[data-avatar="raven"]')).toHaveCount(0);
  await page.locator('[data-ui="begin"]').click();
  await page.locator('[data-onboarding="skip"]').click();
  await menu(page, "profile");
  expect((await read(page)).state.identity.locked).toBe(true);
  await expect(page.locator('[data-avatar="sunny"]')).toHaveCount(0);
  expect((await read(page)).playerCount).toBe(1);
});

// A failed paid appearance load must be recoverable without charging the save.
test.describe("failed asset recovery", () => {
  test.use({ serviceWorkers: "block" });
  test("clinic sprite load failure preserves gender, money and the playable screen", async ({
    page,
  }) => {
    await start(page, (s) => {
      s.sceneId = "clinic";
      s.life.game.money = 100000;
    });
    await menu(page, "profile");
    await page.locator('[data-ui="clinic"]').click();
    await page.locator('[data-request-gender="noir"]').click();
    await page.route("**/wardrobe/*noir-0.webp", (route) => route.abort());
    await page.locator('[data-confirm-gender="noir"]').click();
    await expect(page.locator("#toast")).toContainText("原外型與金錢已保留", {
      timeout: 15000,
    });
    await expect(page.locator("#loading")).toBeHidden();
    const s = (await read(page)).state;
    expect(s.life.game.money).toBe(100000);
    expect(s.identity.gender).toBe("女性");
    expect(s.avatarId).toBe("raven");
    expect(s.identity.changes).toHaveLength(0);
    await page.unroute("**/wardrobe/*noir-0.webp");
    await page.locator('[data-confirm-gender="noir"]').click();
    await expect(page.locator("#panel")).toHaveAttribute(
      "data-view",
      "profile",
      {
        timeout: 15000,
      },
    );
    expect((await read(page)).state.life.game.money).toBe(40000);
  });
});
