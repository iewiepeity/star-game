import { revealControl } from "./reveal-control.mjs";
import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { ROOMS } from "../../src/pixel/data.js";
import { CHOICES } from "../../src/pixel/life.js";
test.use({ serviceWorkers: "block" });
const read = (page) => page.evaluate(() => window.__pixelRead());
async function seed(page, state) {
  await page.addInitScript((state) => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state }),
      );
  }, state);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
}
async function menu(page, id) {
  await page.getByRole("button", { name: "開啟選單" }).click();
  if (id) await page.locator(`#panel [data-ui="${id}"]`).click();
}
async function layout(page) {
  await page
    .locator("#panel img")
    .evaluateAll((images) =>
      Promise.all(
        images
          .filter((img) => img.loading !== "lazy")
          .map((img) => img.decode().catch(() => {})),
      ),
    );
  const box = await page.locator("#panel").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  expect(
    await page
      .locator("#panel")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
}
test("creation rerolls in place and the selected protagonist appears through the prologue", async ({
  page,
}, info) => {
  await seed(page, initialPixelState());
  await page.locator('[data-create-field="realName"]').fill("夏知星");
  await page.locator('[data-create-field="stageName"]').fill("小星");
  await page.locator(".creation-stats summary").click();
  const roll = page.locator('[data-onboarding="reroll"]');
  await roll.scrollIntoViewIfNeeded();
  await roll.evaluate((button) =>
    button.addEventListener("pointerdown", () => {
      button.dataset.scrollAtPress = String(
        document.getElementById("panel").scrollTop,
      );
    }),
  );
  const oldStats = (await read(page)).state.life.game.stats;
  for (let i = 0; i < 3; i++) {
    await roll.click();
    expect(
      Math.abs(
        (await page.locator("#panel").evaluate((e) => e.scrollTop)) -
          Number(await roll.getAttribute("data-scroll-at-press")),
      ),
    ).toBeLessThan(3);
  }
  // Safari does not focus buttons on pointer clicks. Keyboard activation must
  // retain focus as well as the existing scroll position.
  await roll.focus();
  const scroll = await page.locator("#panel").evaluate((e) => e.scrollTop);
  await roll.press("Enter");
  await expect(roll).toBeFocused();
  expect(
    Math.abs(
      (await page.locator("#panel").evaluate((e) => e.scrollTop)) - scroll,
    ),
  ).toBeLessThan(3);
  expect((await read(page)).state.life.game.stats).not.toEqual(oldStats);
  await expect(page.locator('[data-create-field="realName"]')).toHaveValue(
    "夏知星",
  );
  await layout(page);
  await page.locator("#panel").evaluate((e) => (e.scrollTop = 0));
  await page.screenshot({ path: info.outputPath("creation.png") });
  await page.getByRole("button", { name: "開始我的一天 →" }).click();
  await expect(page.locator("#dialogue .player-crop img")).toBeVisible();
  await expect(page.locator("#dialogue .player-crop img")).toHaveAttribute(
    "src",
    /raven-newcomer/,
  );
  await page.screenshot({ path: info.outputPath("prologue.png") });
  for (let i = 0; i < 5; i++) {
    const next = page
      .locator('#career-page-next,[data-onboarding="next"]')
      .first();
    await next.click();
  }
  await expect(page.locator("[data-choose-aspiration]")).toHaveCount(4);
  const bounds = await page
    .locator("[data-choose-aspiration]")
    .evaluateAll((es) =>
      es.map((e) => {
        const b = e.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
      }),
    );
  expect(Math.abs(bounds[0].y - bounds[1].y)).toBeLessThan(1);
  expect(Math.abs(bounds[2].y - bounds[3].y)).toBeLessThan(1);
  expect(Math.abs(bounds[0].w - bounds[3].w)).toBeLessThan(1);
  await page.screenshot({ path: info.outputPath("aspirations.png") });
  await page.reload();
  await expect(page.locator("#dialogue .player-crop img")).toBeVisible();
  await expect(page.locator("[data-choose-aspiration]")).toHaveCount(4);
});

for (const [id, def] of Object.entries(CHOICES).filter(
  ([, d]) => d.group === "訓練",
)) {
  test(`${def.label}: displayed course progress follows the activity and settles once`, async ({
    page,
  }, info) => {
    test.setTimeout(40000);
    const state = initialPixelState();
    state.flags.intro = true;
    state.sceneId = def.room;
    state.position = {
      ...ROOMS[def.room].objects.find((o) => o.id === def.item).target,
    };
    state.life.plan[0] = { id };
    state.life.speed = 1;
    await seed(page, state);
    await page.locator("#run-label").click();
    await page.locator(`[data-start="${id}"]`).click();
    await expect
      .poll(async () => (await read(page)).state.life.pending?.phase)
      .toBe("performing");
    const observations = [];
    for (let i = 0; i < 30; i++) {
      const sample = await page.evaluate(() => ({
        activity: window.__pixelRead().state.activity,
        value: document.getElementById("activity-progress").value,
        visible: !document.getElementById("activity-strip").hidden,
      }));
      if (!sample.activity) break;
      observations.push(sample.value);
      expect(sample.visible).toBe(true);
      expect(Math.abs(sample.value - sample.activity.elapsed / 6)).toBeLessThan(
        0.06,
      );
      if (i === 8 && id === "vocal")
        await page.screenshot({ path: info.outputPath("vocal-progress.png") });
      await page.waitForTimeout(180);
    }
    expect(
      new Set(observations.map((n) => Math.round(n * 100))).size,
    ).toBeGreaterThan(10);
    expect(Math.max(...observations)).toBeGreaterThan(0.7);
    await expect
      .poll(async () => (await read(page)).state.life.pending?.phase)
      .toBe("result");
    expect((await read(page)).state.life.game.trainingSessionsCompleted).toBe(
      1,
    );
    await page.reload();
    await expect(page.locator("#loading")).toBeHidden();
    expect((await read(page)).state.life.game.trainingSessionsCompleted).toBe(
      1,
    );
  });
}

test("pixel visual system covers menus, creation and every theme", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const state = initialPixelState();
  state.flags.intro = true;
  await seed(page, state);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await menu(page);
  await expect(
    page.locator('.command-menu [data-ui="settings"]'),
  ).toBeInViewport();
  expect(
    await page
      .locator(".command-menu strong")
      .first()
      .evaluate((e) => getComputedStyle(e).fontFamily),
  ).toContain("Cubic 11");
  expect(
    await page.evaluate(() => document.fonts.check('22px "Cubic 11"')),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("menu.png") });
  await page.locator('[data-life="creative"]').click();
  await layout(page);
  await page.screenshot({ path: info.outputPath("creative.png") });
  await page.getByRole("button", { name: "關閉視窗" }).click();
  await menu(page, "settings");
  for (const theme of ["rose", "sage", "lilac", "night", "cream"]) {
    await revealControl(page.locator(`[data-pixel-theme="${theme}"]`));
    await page.locator(`[data-pixel-theme="${theme}"]`).click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-pixel-theme",
      theme,
    );
    await layout(page);
    await page.screenshot({ path: info.outputPath(`settings-${theme}.png`) });
  }
  expect(errors).toEqual([]);
});

// Bound each visual tour instead of sharing one deadline across 5 themes and
// 17 apps. Read the same complete library in each group, then visit every entry.
for (let group = 0; group < 3; group++) {
  test(`pixel visual system covers app entrances ${group + 1}/3`, async ({
    page,
  }, info) => {
    test.setTimeout(60000);
    const state = initialPixelState();
    state.flags.intro = true;
    await seed(page, state);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await menu(page, "phone");
    const ids = await page
      .locator(".pixel-app-library [data-pixel-app]")
      .evaluateAll((es) => es.map((e) => e.dataset.pixelApp));
    expect(ids.length).toBe(17); // The phone itself is the eighteenth entrance.
    for (const id of ids.slice(group * 6, (group + 1) * 6)) {
      await test.step(`open ${id}`, async () => {
        await page.locator(`.pixel-app-library [data-pixel-app="${id}"]`).click();
        await layout(page);
        if (["stats", "social", "creative", "people", "wardrobe"].includes(id))
          await page.screenshot({ path: info.outputPath(`app-${id}.png`) });
        await page.getByRole("button", { name: "關閉視窗" }).click();
        await menu(page, "phone");
      });
    }
    expect(errors).toEqual([]);
  });
}
