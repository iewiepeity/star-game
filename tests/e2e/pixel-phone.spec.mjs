import { revealControl } from "./reveal-control.mjs";
import { careerCommand, bookCareer } from "../../src/pixel/career.js";
import { JOB_CATALOG } from "../../src/data/jobs.js";
import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import {
  initialLife,
  beginDay,
  settleDay,
  CHOICES,
  arriveAt,
  recordMeeting,
} from "../../src/pixel/life.js";
test.use({ serviceWorkers: "block" });
test.setTimeout(60000);
const read = (page) => page.evaluate(() => window.__pixelRead());
async function start(page, configure = () => {}) {
  const s = initialPixelState();
  s.flags.intro = true;
  s.playerName = "夏知星";
  s.life.game.name = "夏知星";
  s.life.game.realName = "夏知星";
  s.life.game.stageName = "";
  for (const id of ["guchengxi", "sufei"]) recordMeeting(s.life, id);
  s.knownPeople = ["guchengxi", "sufei"];
  s.life.game.npcMessages.push(
    {
      id: "hello-g",
      npcId: "guchengxi",
      week: 1,
      text: "今天排練結束了，有空再聊。",
      read: false,
    },
    {
      id: "hello-s",
      npcId: "sufei",
      week: 1,
      text: "路上看到了很漂亮的天空。",
      read: false,
    },
  );
  s.life.game.industryNews = [
    {
      id: "phone-news",
      week: 1,
      title: "新作品開拍，幕後日記第一頁",
      body: "演員們完成首次圍讀，團隊開始討論角色之間的距離。",
      category: "作品",
      heat: 88,
    },
  ];
  configure(s);
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("phone-seed")) {
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state: s }),
      );
      sessionStorage.setItem("phone-seed", "true");
    }
  }, s);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
}
async function app(page, id) {
  if (await page.locator("#panel").isVisible())
    await page.getByRole("button", { name: "關閉視窗" }).click();
  await page.getByRole("button", { name: "開啟選單" }).click();
  await page.locator('[data-ui="phone"]').click();
  if (id)
    await page.locator(`.pixel-app-library [data-pixel-app="${id}"]`).click();
}
async function layout(page) {
  expect(
    await page
      .locator("#panel")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("profiles show one chapter at a time, preserve public information, and have readable colorful layouts", async ({
  page,
}, info) => {
  await start(page);
  await app(page, "people");
  await page.locator('[data-people-section="profiles"]').click();
  await expect(page.locator('[data-profile-section="overview"]')).toBeVisible();
  await expect(page.locator('.npc-quick-actions [data-npc-interact="personal"]')).toBeVisible();
  await expect(page.locator(".npc-profile-tabs > button")).toHaveCount(4);
  const colors = await page
    .locator(".relationship-signals article")
    .evaluateAll((es) => es.map((e) => getComputedStyle(e).backgroundColor));
  expect(new Set(colors).size).toBe(3);
  await layout(page);
  await page.screenshot({ path: info.outputPath("npc-overview.png") });
  await page.locator('[data-npc-profile-tab="relationship"]').click();
  await expect(page.locator('[data-npc-interact="date"]')).toBeDisabled();
  await expect(page.locator(".npc-shared-memories")).toHaveCount(0);
  await page.locator('[data-npc-profile-tab="memories"]').first().click();
  await expect(page.locator("#npc-profile-content")).toContainText("初次相遇");
  await expect(page.locator("[data-npc-interact]")).toHaveCount(0);
  await page.locator('[data-npc-profile-tab="about"]').click();
  await expect(page.locator("#npc-profile-content")).toContainText("基本資料");
  await expect(page.locator("#npc-profile-content")).toContainText("工作資料");
  await layout(page);
  expect(
    (await read(page)).state.life.game.npcMessages
      .filter((m) => m.id.startsWith("hello"))
      .every((m) => !m.read),
  ).toBe(true);
});

test("messages keep separate conversations, show sent and received text, and persist the weekly allowance", async ({
  page,
}, info) => {
  await start(page);
  const before = (await read(page)).state.life;
  await app(page, "people");
  await page.locator('[data-chat-open="guchengxi"]').click();
  await expect(page.locator(".chat-history")).toContainText("今天排練結束");
  await expect(page.locator(".chat-history")).not.toContainText("漂亮的天空");
  await page.locator('[data-chat-topic="care"]').click();
  const outgoing = await page.locator(".chat-draft").inputValue();
  await page.locator('[data-contact-type="message"]').click();
  await expect(page.locator(".chat-bubble.outgoing").last()).toContainText(
    outgoing,
  );
  await expect(page.locator(".chat-bubble.outgoing").last()).toContainText(
    "已讀",
  );
  await expect(page.locator(".chat-bubble.incoming")).toHaveCount(2);
  const after = (await read(page)).state.life;
  expect(after.day).toBe(before.day);
  expect(after.plan).toEqual(before.plan);
  expect(after.game.money).toBe(before.game.money);
  expect(after.game.npcMessages.find((m) => m.id === "hello-s").read).toBe(
    false,
  );
  await layout(page);
  await page.screenshot({ path: info.outputPath("conversation.png") });
  await page.locator('[data-contact-type="call"]').click();
  await expect(page.locator('[data-contact-type="message"]')).toBeDisabled();
  await expect(page.locator(".chat-history")).toContainText("通話紀錄");
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await app(page, "people");
  if (!(await page.locator(".chat-header").isVisible()))
    await page.locator('[data-chat-open="guchengxi"]').click();
  await expect(page.locator('[data-contact-type="call"]')).toBeDisabled();
  await expect(page.locator(".chat-bubble.outgoing")).toHaveCount(2);
});

test("social hearts visibly toggle, preserve scroll and save state; replies show both participants", async ({
  page,
}, info) => {
  await start(page);
  await app(page, "social");
  await page.locator('[data-social-filter="friends"]').click();
  const like = page.locator('[data-social-like="npc-guchengxi-1"]');
  await expect(like).toHaveAttribute("aria-pressed", "false");
  await like.scrollIntoViewIfNeeded();
  const color = await like.evaluate((e) => getComputedStyle(e).color);
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText("已喜歡");
  await expect(like.locator("path")).toHaveAttribute("fill", "currentColor");
  expect(await like.evaluate((e) => getComputedStyle(e).color)).not.toBe(color);
  await expect(like).toBeInViewport();
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "false");
  await like.click();
  await page.locator('[data-social-comments="npc-guchengxi-1"]').click();
  await page.locator('[data-social-reply="guchengxi"]').first().click();
  const post = page.locator('[data-post-id="npc-guchengxi-1"]');
  await expect(post.locator(".social-comments")).toContainText("夏知星");
  await expect(post.locator(".social-comments")).toContainText("周予珩");
  await expect(post).toContainText("已用");
  await layout(page);
  await page.screenshot({ path: info.outputPath("social-replies.png") });
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await app(page, "social");
  await page.locator('[data-social-filter="friends"]').click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
});

test("forum has compact searchable rows, persistent hearts and real player reply floors", async ({
  page,
}, info) => {
  await start(page);
  await app(page, "forum");
  const icon = page.locator(".forum-thread-icon").first();
  expect((await icon.boundingBox()).width).toBeLessThanOrEqual(44);
  expect((await icon.boundingBox()).height).toBeLessThanOrEqual(48);
  await page.locator("[data-forum-query]").fill("幕後日記");
  await expect(page.locator("[data-forum-thread]")).toHaveCount(1);
  await layout(page);
  await page.screenshot({ path: info.outputPath("forum-list.png") });
  await page.locator('[data-forum-thread="news-phone-news"]').click();
  const like = page.locator('[data-forum-like="news-phone-news"]');
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  const reply = await page
    .locator('[data-forum-react="reason"] > span')
    .innerText();
  await page.locator('[data-forum-react="reason"]').click();
  await expect(page.locator(".own-reply")).toContainText(reply);
  await expect(page.locator(".own-reply")).toContainText("夏知星");
  await page.locator(".forum-replies [data-forum-like]").first().click();
  await expect(
    page.locator(".forum-replies [data-forum-like]").first(),
  ).toHaveAttribute("aria-pressed", "true");
  const before = (await read(page)).state.life.game;
  await page.locator("[data-forum-refresh]").click();
  expect((await read(page)).state.life.game.forumComments).toEqual(
    before.forumComments,
  );
  await expect(page.locator(".own-reply")).toHaveCount(1);
  await layout(page);
  await page.screenshot({ path: info.outputPath("forum-replies.png") });
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await app(page, "forum");
  if (await page.locator("[data-forum-back]").isVisible())
    await page.locator("[data-forum-back]").click();
  await page.locator('[data-forum-thread="news-phone-news"]').click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".own-reply")).toContainText(reply);
});

test("phone app accents stay colorful across five themes and liked hearts stay pink", async ({
  page,
}, info) => {
  // Five full theme/app round trips share one test. Software-rendered CI
  // needs a journey budget; individual controls must still respond promptly.
  test.setTimeout(120000);
  page.setDefaultTimeout(12000);
  await start(page);
  for (const theme of ["cream", "rose", "sage", "lilac", "night"]) {
    if (await page.locator("#panel").isVisible())
      await page.getByRole("button", { name: "關閉視窗" }).click();
    await page.getByRole("button", { name: "開啟選單" }).click();
    await page.locator('[data-ui="settings"]').click();
    await revealControl(page.locator(`button[data-pixel-theme="${theme}"]`));
    await page.locator(`button[data-pixel-theme="${theme}"]`).click();
    await app(page);
    const colors = await page
      .locator(".pixel-app-library button > i")
      .evaluateAll((es) => es.map((e) => getComputedStyle(e).backgroundColor));
    expect(new Set(colors).size).toBeGreaterThanOrEqual(5);
    await layout(page);
    await page.screenshot({ path: info.outputPath(`phone-${theme}.png`) });
    await page.locator('.pixel-app-library [data-pixel-app="social"]').click();
    await page.locator('[data-social-filter="friends"]').click();
    const heart = page.locator('[data-social-like="npc-guchengxi-1"]');
    if ((await heart.getAttribute("aria-pressed")) === "false")
      await heart.click();
    const ink = await heart.evaluate((e) => getComputedStyle(e).color);
    expect(ink).toBe("rgb(161, 46, 84)");
    await layout(page);
  }
});

test("a failed audition displays a coherent verdict card and survives reload without repeated rewards", async ({
  page,
}, info) => {
  const job = JOB_CATALOG.find((j) => j.stars === 1 && j.category === "電視劇");
  let audition;
  for (let i = 0; i < 80; i++) {
    const l = initialLife(`phone-audition-${i}`);
    l.game.money = 100000;
    l.game.stats = Object.fromEntries(
      Object.keys(l.game.stats).map((k) => [k, 350]),
    );
    l.game.trainingSessionsCompleted = 20;
    arriveAt(l, "tv");
    careerCommand(l, "apply-job", job.id);
    bookCareer(l, CHOICES, "audition", { jobId: job.id }, 0);
    beginDay(l);
    const r = settleDay(l, "bold");
    if (r?.presentation?.audition?.passed === false) {
      audition = l;
      break;
    }
  }
  expect(audition).toBeTruthy();
  await start(page, (s) => {
    s.life = audition;
  });
  await page.locator("#run-label").click();
  await expect(page.locator(".audition-result-card.failed")).toBeVisible();
  const result = page.locator(".audition-result-card");
  await expect(result).toContainText("這次未獲選");
  await expect(result).toContainText(job.title);
  await expect(result).not.toContainText("機會評估");
  await expect(page.locator(".result-scene")).toHaveCount(0);
  await expect(result.locator(".audition-result-steps article")).toHaveCount(3);
  expect((await result.innerText()).split(job.audition.venue).length - 1).toBe(
    1,
  );
  await layout(page);
  await page.screenshot({ path: info.outputPath("audition-result.png") });
  const before = (await read(page)).state.life;
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await page.locator("#run-label").click();
  await expect(page.locator(".audition-result-card.failed")).toBeVisible();
  expect((await read(page)).state.life.ledger).toEqual(before.ledger);
  expect((await read(page)).state.life.game.money).toBe(before.game.money);
});

test("players can compose their own messages and forum replies instead of only choosing a preset", async ({
  page,
}) => {
  await start(page);
  await app(page, "people");
  await page.locator('[data-chat-open="guchengxi"]').click();
  await page
    .locator("[data-chat-draft]")
    .fill("今天排練順利嗎？記得吃飯，別餓著了。");
  await page.locator('[data-contact-type="message"]').click();
  await expect(page.locator(".chat-bubble.outgoing").last()).toContainText(
    "今天排練順利嗎？記得吃飯，別餓著了。",
  );
  await app(page, "forum");
  await page.locator('[data-forum-thread="news-phone-news"]').click();
  await page.locator(".forum-custom-composer summary").click();
  await page
    .locator("[data-forum-draft]")
    .fill("期待這次圍讀的成果，想看看角色怎麼慢慢成形。");
  await page.locator('[data-forum-react="custom"]').click();
  await expect(page.locator(".own-reply")).toContainText(
    "期待這次圍讀的成果，想看看角色怎麼慢慢成形。",
  );
  expect((await read(page)).state.life.day).toBe(0);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  const game = (await read(page)).state.life.game;
  expect(game.forumComments.at(-1).text).toBe(
    "期待這次圍讀的成果，想看看角色怎麼慢慢成形。",
  );
  expect(
    game.npcMessages.some(
      (m) => m.outgoingText === "今天排練順利嗎？記得吃飯，別餓著了。",
    ),
  ).toBe(true);
});
