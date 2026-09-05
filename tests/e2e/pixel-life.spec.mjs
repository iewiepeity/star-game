import { test, expect } from "@playwright/test";
test.setTimeout(110000);
const read = (page) => page.evaluate(() => window.__pixelRead());
const close = (page) => page.getByRole("button", { name: "關閉視窗" }).click();
async function start(page) {
  await page.goto("/pixel.html");
  await page.getByRole("button", { name: "開始我的一天 →" }).click();
  await page.locator('[data-onboarding="skip"]').click();
}
async function menu(page, id) {
  await page.getByRole("button", { name: "開啟選單" }).click();
  if (id) await page.locator(`#panel [data-ui="${id}"]`).click();
}
async function fast(page) {
  for (let i = 0; i < 4; i++) await page.locator("#speed-label").click();
}
async function waitResult(page) {
  await expect
    .poll(async () => (await read(page)).state.life.pending?.phase, {
      timeout: 15000,
    })
    .toBe("result");
}
async function finishStories(page) {
  for (let i = 0; i < 60; i++) {
    const next = page.locator("#career-page-next"),
      choice = page.locator("[data-story-choice]:not([disabled])").first(),
      done = page.locator("[data-story-done]");
    if (await next.isVisible()) await next.click();
    else if (await choice.isVisible()) await choice.click();
    else if (await done.isVisible()) await done.click();
    else {
      const g = (await read(page)).state.life.game;
      if (!g.activeEvent && !g.eventOutcome && !g.eventQueue.length) return;
      if (await page.locator("#panel").isVisible()) await close(page);
      else await page.locator("#run-label").click();
    }
  }
  throw new Error("Story queue did not finish");
}
async function advance(page) {
  await finishStories(page);
  if (!(await page.locator('[data-life="advance"]').isVisible()))
    await page.locator("#run-label").click();
  await page.locator('[data-life="advance"]').click();
  await finishStories(page);
}

test("first week schedules immediately and all seven days complete without registration", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await fast(page);
  await menu(page, "schedule");
  await expect(page.locator('[data-plan="acting"]')).toBeEnabled();
  await page.locator('[data-day="0"]').click();
  await page.locator('[data-plan="acting"]').click();
  expect((await read(page)).state.life.plan[0].id).toBe("acting");
  await close(page);
  await page.locator("#run-label").click();
  await page.locator('[data-start="acting"]').click();
  await waitResult(page);
  expect((await read(page)).state.life.game.trainingSessionsCompleted).toBe(1);
  const saved = (await read(page)).state.life;
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  expect((await read(page)).state.life.game.money).toBe(saved.game.money);
  await page.locator("#run-label").click();
  await advance(page);
  await page.locator("#auto-control").click();
  const deadline = Date.now() + 55000;
  while ((await read(page)).state.life.day < 7 && Date.now() < deadline) {
    const l = (await read(page)).state.life;
    if (l.game.activeEvent || l.game.eventOutcome || l.game.eventQueue.length) {
      await finishStories(page);
    } else if (!l.auto && l.pending?.phase === "result") await advance(page);
    else if (!l.auto) {
      if (await page.locator("#panel").isVisible()) await close(page);
      await page.locator("#auto-control").click();
    } else await page.waitForTimeout(200);
  }
  await expect(page.locator('[data-life="next-week"]')).toBeVisible();
  const complete = (await read(page)).state.life;
  expect(complete.ledger).toHaveLength(7);
  expect(complete.game.partTimeShifts.tv_assistant).toBe(1);
  expect(complete.weekSummary.reward.money).toBe(1500);
  await page.locator('[data-life="next-week"]').click();
  expect((await read(page)).state.life.game.week).toBe(2);
  expect((await read(page)).state.life.day).toBe(0);
  expect(errors).toEqual([]);
});

test("create twice in one week, publish a social post, and inspect responsive menu/phone", async ({
  page,
}) => {
  await start(page);
  await fast(page);
  await menu(page);
  await page.locator('#panel [data-life="creative"]').click();
  await page.locator("#project-title").fill("寄給明天的我");
  await page.getByRole("button", { name: "建立草稿" }).click();
  await page.locator('[data-offer="creative"]').click();
  await page.locator("[data-start]").click();
  await waitResult(page);
  await advance(page);
  const first = (await read(page)).state.life.game.creativeProjects[0].progress;
  await menu(page);
  await page.locator('#panel [data-life="creative"]').click();
  await page.locator('[data-offer="creative"]').click();
  await page.locator("[data-start]").click();
  await waitResult(page);
  await advance(page);
  expect(
    (await read(page)).state.life.game.creativeProjects[0].progress,
  ).toBeGreaterThan(first);
  await menu(page, "phone");
  await page.locator('[data-pixel-app="social"]').last().click();
  await page.locator(".social-compose summary").click();
  await page.locator('[data-social-post="daily"]').click();
  await page.locator('[data-book-day="2"]').click();
  await page.locator('#panel [data-life="today"]').click();
  await page.locator("[data-start]").click();
  await waitResult(page);
  await advance(page);
  await menu(page, "phone");
  await page.locator('[data-pixel-app="social"]').last().click();
  expect((await read(page)).state.life.game.socialPosts).toHaveLength(1);
  await expect(page.locator(".social-feed article").first()).toContainText(
    "星途新人",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test("enter the shop on Monday, buy immediately and synchronize illustration and pixel outfit", async ({
  page,
}) => {
  await start(page);
  await fast(page);
  await menu(page, "travel");
  await page.locator('[data-map-place="shop"]').click();
  await page.locator('[data-map-enter="shop"]').click();
  await expect
    .poll(async () => (await read(page)).scene, { timeout: 15000 })
    .toBe("shop");
  expect(
    (await read(page)).state.life.game.visitedLocationsByWeek[1],
  ).toContain("shop");
  expect((await read(page)).state.life.day).toBe(0);
  await menu(page, "nearby");
  await page.locator('[data-object="checkout"]').click();
  const before = (await read(page)).state.life.game.money;
  await page.locator('[data-buy="practice"]').click();
  expect((await read(page)).state.life.game.money).toBe(before - 1200);
  await expect(page.locator('[data-buy="practice"]')).toBeDisabled();
  await close(page);
  await menu(page, "profile");
  await page.locator('[data-ui="closet"]').click();
  await page.locator('[data-map-enter="home"]').click();
  await page.locator('[data-fitting="practice"]').click();
  await page.locator('[data-outfit="practice"]').click();
  await expect
    .poll(async () => (await read(page)).player.outfit)
    .toBe("raven-practice");
  await expect(page.locator("#player-head")).toHaveAttribute(
    "src",
    "./assets/avatars/raven-practice.webp",
  );
});

test("taking over a daily action cannot turn a furniture preview into a reward", async ({
  page,
}) => {
  await start(page);
  await menu(page, "schedule");
  await page.locator('[data-plan="study"]').click();
  await close(page);
  await page.locator("#run-label").click();
  await page.locator("[data-start]").click();
  await expect
    .poll(async () => (await read(page)).state.activity?.kind, {
      timeout: 15000,
    })
    .toBe("read");
  await menu(page, "nearby");
  await page.locator('[data-object="sofa"]').click();
  await expect
    .poll(async () => (await read(page)).state.activity?.kind, {
      timeout: 12000,
    })
    .toBe("sit");
  await expect
    .poll(async () => (await read(page)).state.activity, { timeout: 9000 })
    .toBe(null);
  expect((await read(page)).state.life.ledger).toHaveLength(0);
  expect((await read(page)).state.life.pending.phase).toBe("travel");
  await fast(page);
  await page.locator("#run-label").click();
  await waitResult(page);
  expect((await read(page)).state.life.ledger).toHaveLength(1);
  expect((await read(page)).state.life.pending.result.label).toBe("在家研究");
});
