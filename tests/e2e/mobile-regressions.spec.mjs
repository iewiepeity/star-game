import { test, expect } from "@playwright/test";
async function createPlayer(page, name) {
  await page.goto("/");
  await page.locator("#player-real-name").fill(name);
  await page.locator("#player-real-name").dispatchEvent("input");
  await page.locator("#to-stats").click();
  await expect(page.locator("#start")).toBeVisible();
  await page.locator("#start").click();
  await expect(page.locator("[data-skip-onboarding]")).toBeVisible();
  await page.locator("[data-skip-onboarding]").click();
  await expect(page.locator("body")).toContainText(name);
}

test("手機人物立繪完整清晰且事件選項維持橫排", async ({ page }) => {
  await createPlayer(page, "手機人物測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.screen = "runner";
    state.runnerDay = 0;
    state.runnerPhase = "result";
    state.schedule = Array(7).fill("rest");
    state.runnerResult = {
      success: true,
      title: "秦紹謙｜第一次照面",
      text: "測試完整立繪。",
      npcName: "秦紹謙",
      portrait: "./assets/portraits/hanzhiyuan.webp",
      accent: "#9b7356",
    };
    render();
  });
  const art = page.locator(".runner-npc-art img");
  await expect(art).toBeVisible();
  // Visibility does not imply the image has finished decoding.
  await expect.poll(() => art.evaluate(img => img.naturalWidth)).toBeGreaterThanOrEqual(600);
  const style = await art.evaluate((img) => ({
    fit: getComputedStyle(img).objectFit,
    position: getComputedStyle(img).objectPosition,
    transform: getComputedStyle(img).transform,
    naturalWidth: img.naturalWidth,
  }));
  expect(style.naturalWidth).toBeGreaterThanOrEqual(600);
  if (page.viewportSize().width <= 760) {
    expect(style.fit).toBe("contain");
    expect(style.position).toMatch(/top|0%$/);
    expect(style.transform).toBe("none");
  }
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.screen = "event";
    state.activeEvent = {
      event: {
        id: "mobile-choice",
        kind: "人物事件",
        title: "關係開始有了名字",
        text: "最近幾次碰面後，彼此不再只是通訊錄裡的一個名字。",
        choices: [
          { id: "chat", label: "主動多聊一點", outcome: "你們聊得更深。" },
          {
            id: "pace",
            label: "照現在的步調就好",
            outcome: "你們保留現在的節奏。",
          },
        ],
      },
    };
    render();
  });
  const label = page.locator(".event-choice-list button>span>b").first();
  await expect(label).toHaveText("主動多聊一點");
  const box = await label.evaluate((el) => ({
    writingMode: getComputedStyle(el).writingMode,
    width: el.getBoundingClientRect().width,
    height: el.getBoundingClientRect().height,
  }));
  expect(box.writingMode).toBe("horizontal-tb");
  expect(box.width).toBeGreaterThan(box.height * 2);
});

test("幕後職務不會進入共演卡且合作頭像保持小尺寸", async ({ page }) => {
  await createPlayer(page, "共演測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.activeJobs.J007 = {
      jobId: "J007",
      stage: "active",
      remainingSessions: 1,
      completedSessions: 0,
      deadlineWeek: 4,
      npcCast: ["hanzhiyuan"],
      npcScheduleSlots: [],
      storyHistory: [],
    };
    state.selectedJobId = "J007";
    state.appOpen = "jobs";
    render();
  });
  await expect(page.locator(".job-detail")).not.toContainText("秦紹謙");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.activeJobs.J007.npcCast = ["lujingran"];
    render();
  });
  const card = page.locator('.job-cast [data-open-cast-npc="lujingran"]');
  await expect(card).toContainText("江敘白");
  const size = await card.locator("img").evaluate((img) => ({
    width: img.getBoundingClientRect().width,
    height: img.getBoundingClientRect().height,
  }));
  expect(size.width).toBeLessThanOrEqual(70);
  expect(size.height).toBeLessThanOrEqual(70);
});

test("畫面例外會進入救援模式並保留安全備份", async ({ page }) => {
  await createPlayer(page, "救援測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.screen = "runner";
    state.schedule = null;
    render();
  });
  await expect(page.locator(".fatal-recovery")).toContainText(
    "畫面暫時無法繼續",
  );
  await expect(page.locator("[data-recovery-reload]")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("star-game-save-backup")),
  ).toContain("救援測試");
});
