import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { initialLife } from "../../src/pixel/life.js";

const read = (page) => page.evaluate(() => window.__pixelRead());
async function start(page, configure = () => {}) {
  const state = initialPixelState();
  // A stable simulation seed keeps unrelated random chapters out of these
  // focused life-flow scenarios; story interruptions have their own E2E suite.
  state.life = initialLife("city-life-browser-20260907");
  state.flags.intro = true;
  state.life.speed = 16;
  state.life.game.week = 11;
  state.life.game.money = 50000;
  state.life.game.birthMonth = 3;
  state.life.game.birthDay = 18;
  state.life.game.knownPeople = ["jiqing"];
  state.knownPeople = ["jiqing"];
  state.life.game.relationships.jiqing = {
    closeness: 70,
    trust: 65,
    affection: 60,
    hostility: 0,
    romance: "dating",
    events: [],
    hostilityHistory: [],
    romanceHistory: [
      { week: 1, from: "ambiguous", to: "dating", source: "正式交往" },
    ],
    affectionHistory: [],
  };
  state.life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  configure(state);
  await page.addInitScript((state) => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state }),
      );
  }, state);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
}
async function openCity(page, tab) {
  await page.getByRole("button", { name: "開啟選單" }).click();
  await page.locator('#panel [data-ui="city-life"]').click();
  await expect(
    page.getByRole("heading", { name: "城市生活", exact: true }),
  ).toBeVisible();
  if (tab) await page.locator(`[data-city-tab="${tab}"]`).click();
}
async function runToday(page, id) {
  await page.locator('#panel-content [data-ui="close"]').click();
  await page.locator("#run-label").click();
  await page.locator(`[data-start="${id}"]`).click();
}
async function result(page) {
  await expect
    .poll(async () => (await read(page)).state.life.pending?.phase, {
      timeout: 30000,
    })
    .toBe("result");
}

test("日曆邀約、改期、實際赴約合照與公開確認，讀檔保留", async ({
  page,
}, info) => {
  test.setTimeout(70000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await openCity(page, "calendar");
  await page.locator('[data-city-invite="birthday:jiqing:0"]').click();
  await page.locator('[data-city-book="72"]').click();
  await page.locator("[data-city-reschedule]").click();
  await page.locator('[data-city-book="70"]').click();
  const initial = await read(page);
  expect(initial.state.life.plan[0].id).toBe("city_date");
  expect(initial.state.life.plan[2].id).toBe("rest");
  expect(initial.state.life.game.money).toBe(50000);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await openCity(page, "calendar");
  await runToday(page, "city_date");
  await page.locator('[data-career-decision="photo"]').click();
  await result(page);
  const before = await read(page);
  expect(before.state.life.game.cityLife.photos).toHaveLength(1);
  expect(before.state.life.game.cityLife.outfitMemories).toHaveLength(1);
  expect(before.state.life.game.money).toBe(49700);
  expect(before.npcs.some((n) => n.id === "jiqing")).toBe(true);
  await page.screenshot({ path: info.outputPath("city-date-result.png") });
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  expect((await read(page)).state.life.game.money).toBe(49700);
  // A narrative result is modal; acknowledge it before opening another feature.
  for (
    let i = 0;
    i < 6 && (await page.locator("#career-page-next").isVisible());
    i++
  )
    await page.locator("#career-page-next").click();
  await page.locator('[data-life="advance"]').click();
  await openCity(page, "echoes");
  await page.locator("[data-city-share]").click();
  expect((await read(page)).state.life.game.socialPosts).toHaveLength(0);
  await page.locator("[data-city-share-confirm]").click();
  expect((await read(page)).state.life.game.socialPosts).toHaveLength(1);
  await expect(page.locator("#panel")).not.toContainText("romanceHistory");
  expect(errors).toEqual([]);
});

test("寵物領養确认、低負擔陪伴、場景可見與託顧存檔", async ({ page }, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await openCity(page, "pets");
  await page.locator("#city-pet-name").fill("棉花");
  await page.locator('[data-city-adopt="cat"]').click();
  expect((await read(page)).state.life.game.cityLife.pet).toBeNull();
  await page.locator("[data-city-adopt-confirm]").click();
  await page.locator("[data-city-comfort]").click();
  const mood = (await read(page)).state.life.game.mood;
  await page.locator("[data-city-comfort]").click();
  expect((await read(page)).state.life.game.mood).toBe(mood);
  await page.locator("#city-pet-carer").selectOption("service");
  await page.locator("[data-city-care]").click();
  await page.screenshot({ path: info.outputPath("city-pet-panel.png") });
  await page.locator('#panel-content [data-ui="close"]').click();
  await expect.poll(async () => (await read(page)).pet?.name).toBe("棉花");
  await page.screenshot({ path: info.outputPath("city-pet-home.png") });
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  expect((await read(page)).state.life.game.cityLife.pet.care.npcId).toBe(
    "service",
  );
  expect((await read(page)).state.life.day).toBe(0);
  expect(errors).toEqual([]);
});

test("三段對戲可玩、途中讀檔可續接，略過與快速複習有入口", async ({
  page,
}, info) => {
  test.setTimeout(70000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await openCity(page, "practice");
  await page.locator('[data-city-plan="city_challenge"]').click();
  await page.locator('[data-city-plan-day="0"]').click();
  await runToday(page, "city_challenge");
  await page.locator('[data-city-answer="0"]').click();
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await expect(
    page.getByRole("heading", { name: "對戲接話 · 2 / 3" }),
  ).toBeVisible();
  await page.locator('[data-city-answer="1"]').click();
  await page.screenshot({ path: info.outputPath("city-practice-round.png") });
  await page.locator('[data-city-answer="2"]').click();
  await result(page);
  expect((await read(page)).state.life.game.cityLife.practice.mastered).toBe(1);
  const saved = (await read(page)).state.life.ledger;
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  expect((await read(page)).state.life.ledger).toEqual(saved);
  expect(errors).toEqual([]);
});

test("場地圖片晚到也不會推走行動確認按鈕", async ({ page }) => {
  test.setTimeout(70000);
  let releaseImage;
  const imageGate = new Promise((resolve) => {
    releaseImage = resolve;
  });
  await page.route("**/assets/pixel/rehearsal.png", async (route) => {
    await imageGate;
    await route.continue();
  });
  try {
    await start(page);
    await openCity(page, "practice");
    await page.locator('[data-city-plan="city_challenge"]').click();
    await page.locator('[data-city-plan-day="0"]').click();
    await page.locator('#panel-content [data-ui="close"]').click();
    await page.locator("#run-label").click();
    const confirm = page.locator('[data-start="city_challenge"]');
    await expect(confirm).toBeVisible();
    await expect(page.locator(".action-detail img")).toHaveJSProperty(
      "naturalWidth",
      0,
    );
    const before = await confirm.boundingBox();
    releaseImage();
    await expect
      .poll(() =>
        page
          .locator(".action-detail img")
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    const after = await confirm.boundingBox();
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    expect(Math.abs(after.x - before.x)).toBeLessThan(1);
    await confirm.click();
    await expect(page.locator('[data-city-answer="0"]')).toBeVisible({
      timeout: 30000,
    });
    await page.locator("[data-city-practice-skip]").click();
    await result(page);
    expect((await read(page)).state.life.ledger[0].success).toBe(true);
  } finally {
    releaseImage();
  }
});

for (const mode of ["quick", "skip"])
  test(`對戲${mode === "quick" ? "熟練後快速複習" : "略過挑戰"}仍完整結算`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await start(page, (s) => {
      s.life.game.cityLife.practice.mastered = 3;
    });
    await openCity(page, "practice");
    await page.locator('[data-city-plan="city_challenge"]').click();
    await page.locator('[data-city-plan-day="0"]').click();
    await runToday(page, "city_challenge");
    await expect(page.locator("[data-city-practice-skip]")).toBeVisible();
    await page.locator(`[data-city-practice-${mode}]`).click();
    await result(page);
    expect((await read(page)).state.life.ledger[0].notes.join("")).toContain(
      mode === "quick" ? "快速複習" : "基礎對戲練習",
    );
  });
