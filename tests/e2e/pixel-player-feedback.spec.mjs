import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { recordMeeting } from "../../src/pixel/life.js";
const read = (p) => p.evaluate(() => window.__pixelRead());
async function start(page, amend = () => {}) {
  const s = initialPixelState();
  s.flags.intro = true;
  s.life.game.week = 60;
  s.life.game.completedWorks = [
    {
      id: "prior-work",
      title: "既有短片",
      category: "電影",
      completedWeek: 50,
      npcCast: [],
    },
  ];
  recordMeeting(s.life, "guchengxi");
  s.knownPeople = ["guchengxi"];
  s.life.game.relationships.guchengxi.closeness = 100;
  s.life.game.relationships.guchengxi.trust = 100;
  s.life.game.relationships.guchengxi.romance = "ambiguous";
  s.life.game.relationships.guchengxi.affection = 40;
  amend(s);
  await page.addInitScript((s) => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state: s }),
      );
  }, s);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 15000 });
}
async function app(page, id) {
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="phone"]').click();
  await page.locator(`[data-pixel-app="${id}"]`).last().click();
}
test("短聯絡可使用、說明感情卡關並保存上限，不占當天行程", async ({ page }) => {
  await start(page);
  const before = (await read(page)).state.life;
  await app(page, "people");
  await page.locator('[data-chat-open="guchengxi"]').first().click();
  await page.locator('[data-select-npc="guchengxi"]').click();
  await expect(page.locator("#panel")).toContainText("友情與信任不等於戀愛心意");
  await page.locator('[data-chat-open="guchengxi"]').first().click();
  await page
    .locator('[data-short-contact="guchengxi"][data-contact-type="call"]')
    .click();
  await page
    .locator('[data-short-contact="guchengxi"][data-contact-type="message"]')
    .click();
  let life = (await read(page)).state.life;
  expect(life.day).toBe(before.day);
  expect(life.plan).toEqual(before.plan);
  expect(life.game.money).toBe(before.game.money);
  expect(life.game.shortContacts).toHaveLength(2);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 15000 });
  await app(page, "people");
  if (!(await page.locator(".chat-header").isVisible())) await page.locator('[data-chat-open="guchengxi"]').first().click();
  await expect(page.locator('[data-short-contact="guchengxi"][data-contact-type="call"]')).toBeDisabled();
  life = (await read(page)).state.life;
  expect(life.game.shortContacts).toHaveLength(2);
});
test("社群回覆有接話，論壇記住已讀並可查看歷史", async ({ page }) => {
  await start(page, (s) => {
    s.life.game.industryNews = [
      {
        id: "feedback-new",
        week: 60,
        title: "新作品完成",
        body: "今天完成了正式製作。",
        category: "作品",
        heat: 70,
      },
    ];
  });
  await app(page, "social");
  await page.locator('[data-social-comments="npc-guchengxi-60"]').click();
  await page.locator('[data-social-reply="guchengxi"]').first().click();
  await expect(
    page
      .locator(".social-post")
      .filter({ has: page.locator('[data-social-like="npc-guchengxi-60"]') }),
  ).toContainText("已用");
  expect(
    (await read(page)).state.life.game.npcMessages.some(
      (m) => m.source === "social",
    ),
  ).toBe(true);
  await page.locator('[data-pixel-app="phone"]').click();
  await page.locator('[data-pixel-app="forum"]').last().click();
  await page.locator('[data-forum-thread="news-feedback-new"]').click();
  await expect(page.locator(".forum-thread-detail")).toContainText("第 60 週");
  await page.locator("[data-forum-back]").click();
  await expect(
    page.locator('[data-forum-thread="news-feedback-new"]'),
  ).toContainText("已讀");
  await page.locator("[data-forum-archive]").click();
  await expect(page.locator('[data-forum-thread="f01"]')).toBeVisible();
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 15000 });
  expect((await read(page)).state.life.game.forumReadIds).toContain(
    "news-feedback-new",
  );
});
test("行程表顯示職涯計數與生活替代目標", async ({ page }) => {
  await start(page, (s) => {
    s.life.game.schedule[0] = "personal_task";
    s.life.game.scheduledActivities.plan = {
      id: "plan",
      week: 60,
      day: 0,
      kind: "manager_interact",
      payload: { type: "career" },
      status: "completed",
    };
    s.life.game.weekResults = [{ dayIndex: 0, success: true }];
  });
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="schedule"]').click();
  await page.locator(".planner-extras > summary").click();
  await page.locator(".weekly-task summary").click();
  await expect(page.locator(".weekly-task")).toContainText("職涯 1");
  await expect(page.locator(".weekly-task")).toContainText("生活／休息 2 天");
  await expect(page.locator(".weekly-task")).toContainText("落選也計");
});
test("友情足夠後可主動開啟感情談話，重按不產生重複事件", async ({ page }) => {
  await start(page, (s) => {
    s.life.game.relationships.guchengxi.affection = 70;
    s.life.game.completedWorks = [
      {
        id: "w1",
        title: "既有短片",
        category: "電影",
        completedWeek: 50,
        npcCast: [],
      },
    ];
    s.life.game.npcStoryHistory = ["guchengxi:romance:ambiguous:0"];
  });
  await app(page, "people");
  await page.locator('[data-people-section="profiles"]').click();
  await page.locator('[data-select-npc="guchengxi"]').first().click();
  await page.locator('[data-npc-profile-tab="relationship"]').click();
  await page.locator('[data-romance-talk="guchengxi"]').click();
  await page.locator('[data-romance-talk="guchengxi"]').click();
  const g = (await read(page)).state.life.game;
  expect(
    [...g.eventQueue, ...g.queuedEvents, g.activeEvent].filter(
      (x) => x?.event?.npcId === "guchengxi" && x.event.kind === "戀愛事件",
    ),
  ).toHaveLength(1);
});

test("公開與地下戀切換會保存，但不重複領取曝光獎勵", async ({ page }) => {
  await start(page, (s) => {
    s.life.game.partnerId = "guchengxi";
    Object.assign(s.life.game.relationships.guchengxi, {
      romance: "dating", visibility: "underground", affection: 80,
      romanceSinceWeek: 50,
    });
  });
  async function profile() {
    await app(page, "people");
    await page.locator('[data-people-section="profiles"]').click();
    await page.locator('[data-select-npc="guchengxi"]').first().click();
    await page.locator('[data-npc-profile-tab="relationship"]').click();
  }
  await profile();
  const before = (await read(page)).state.life;
  await page.locator('[data-romance-action="public"]').click();
  expect((await read(page)).state.life.game.fans).toBe(before.game.fans);
  await page.locator('[data-confirm-relationship]').click();
  const first = (await read(page)).state.life.game;
  expect(first.fans).toBeGreaterThan(before.game.fans);
  await page.locator('[data-romance-action="underground"]').click();
  await page.locator('[data-confirm-relationship]').click();
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 15000 });
  await profile();
  await page.locator('[data-romance-action="public"]').click();
  await page.locator('[data-confirm-relationship]').click();
  const after = (await read(page)).state.life;
  expect(after.game.relationships.guchengxi.visibility).toBe("public");
  expect(after.game.fans).toBe(first.fans);
  expect(after.game.rep.話題度).toBe(first.rep.話題度);
  expect(after.day).toBe(before.day);
  expect(after.game.money).toBe(before.game.money);
});
