import { test, expect } from "@playwright/test";
async function fillIdentity(page, name) {
  await expect
    .poll(
      async () => {
        const input = page.locator("#player-name");
        if (!(await input.isVisible().catch(() => false))) return "";
        await input.fill(name).catch(() => {});
        await input.dispatchEvent("input").catch(() => {});
        await input.dispatchEvent("change").catch(() => {});
        return input.inputValue().catch(() => "");
      },
      { timeout: 10000 },
    )
    .toBe(name);
}
async function createPlayer(page, name = "測試新人") {
  await page.goto("/");
  const enterIdentity = async () => {
    await fillIdentity(page, name);
    await page.locator("#to-stats").click();
  };
  await enterIdentity();
  if (
    !(await page
      .locator("#start")
      .isVisible()
      .catch(() => false))
  )
    await enterIdentity();
  await expect(page.locator("#start")).toBeVisible({ timeout: 10000 });
  await page.locator("#start").click();
  await expect(page.locator("[data-skip-onboarding]")).toBeVisible({
    timeout: 10000,
  });
  await page.locator("[data-skip-onboarding]").click();
  await expect(page.locator("body")).toContainText(name);
}
async function openApp(page, id) {
  const button = page.locator(`[data-open-app="${id}"]`).first();
  if (!(await button.isVisible().catch(() => false)))
    await page.locator("[data-app-library-toggle]").click();
  await page.locator(`[data-open-app="${id}"]`).first().click();
}
test("創角後可閱讀童年卡片序章並接到平板教學", async ({ page }) => {
  await page.goto("/");
  await fillIdentity(page, "序章測試");
  await page.locator("#to-stats").click();
  await page.locator("#start").click();
  await expect(page.locator(".childhood-card")).toContainText("要當明星");
  for (let i = 0; i < 4; i++)
    await page.locator(".prologue-dialogue [data-prologue-next]").click();
  await expect(page.locator(".room-screen")).toBeVisible();
  await expect(page.locator(".guide-toast")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".guide-toast")).toContainText("平板已經亮了");
});
test("創角、自動存檔、重新整理與離線啟動", async ({ page, context }) => {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await createPlayer(page);
  await expect(page.locator("body")).toContainText("工作信箱");
  await expect(page.locator("body")).toContainText("創作室");
  const save = await page.evaluate(() =>
    localStorage.getItem("star-game-save"),
  );
  expect(save).toContain("測試新人");
  await page.reload();
  await expect(page.locator("body")).toContainText("測試新人");
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller || false,
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("body")).toContainText("工作信箱");
  expect(errors).toEqual([]);
});
test("正式通告執行週會自動逐日結算，不點下一天也能進週總結", async ({
  page,
}) => {
  test.setTimeout(55000);
  await createPlayer(page, "作品測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { ABILITIES } = await import("/src/data/abilities.js");
    const { ensureJobState, signJob, scheduleJobSession } =
      await import("/src/logic/job-engine.js");
    const { setPreference } = await import("/src/core/preferences.js");
    const { render } = await import("/src/render.js");
    setPreference("autoSpeed", "x2");
    state.stats = Object.fromEntries(ABILITIES.map((name) => [name, 1000]));
    state.hidden = {
      幽默: 700,
      共情: 700,
      洞察: 700,
      膽識: 700,
      品德: 700,
      自律: 700,
      野心: 700,
      抗壓: 700,
    };
    state.trainingSessionsCompleted = 100;
    state.schedule = Array(7).fill("rest");
    state.scheduledJobIds = Array(7).fill(null);
    state.freeLocations = Array(7).fill(null);
    const record = ensureJobState("J001");
    record.stage = "passed";
    signJob("J001");
    record.remainingSessions = 1;
    scheduleJobSession("J001", 0);
    state.appOpen = "planner";
    render();
  });
  await page.locator("#begin-week").click();
  await expect(page.locator(".event-screen")).toBeVisible();
  await expect(page.locator(".first-meeting-scene")).toBeVisible({
    timeout: 5000,
  });
  await page.locator("#next-day").click();
  await expect(page.locator("#next-week")).toBeVisible({ timeout: 45000 });
  const result = await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    return {
      works: state.completedWorks.length,
      stage: state.activeJobs.J001?.stage,
      results: state.history.at(-1)?.results?.length,
    };
  });
  expect(result.works).toBeGreaterThan(0);
  expect(result.stage).toBe("completed");
  expect(result.results).toBe(7);
});
test("需要玩家選擇時自動播放會暫停，選完後才繼續", async ({ page }) => {
  await createPlayer(page, "選擇測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.schedule = Array(7).fill("rest");
    state.freeLocations = Array(7).fill(null);
    state.scheduledJobIds = Array(7).fill(null);
    state.schedule[0] = "audition";
    state.appOpen = "planner";
    render();
  });
  await page.locator("#begin-week").click();
  await expect(page.locator("[data-choice]").first()).toBeVisible({
    timeout: 3000,
  });
  await page.waitForTimeout(1800);
  await expect(page.locator("[data-choice]").first()).toBeVisible();
  await page.locator("[data-choice]").first().click();
  await expect(page.locator("#next-day")).toBeVisible();
});
test("操作提示以 Toast 顯示並會自動消失", async ({ page }) => {
  await createPlayer(page, "提示測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.notice = "星期日已安排休息";
    state.appOpen = "planner";
    render();
  });
  const toast = page.locator(".game-toast");
  await expect(toast).toHaveText(/星期日已安排休息/);
  await expect(page.locator(".mini-toast")).toHaveCount(0);
  await expect(toast).toBeHidden({ timeout: 4000 });
});
test("設定頁可調整主題字級、快速存檔並保護重新開始", async ({ page }) => {
  await createPlayer(page, "設定測試");
  await openApp(page, "settings");
  await expect(page.locator(".settings-page")).toBeVisible();
  await page.locator('[data-theme="night"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.locator('[data-font-size="large"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-font-size", "large");
  await page.locator('[data-save-slot="1"]').click();
  await expect(page.locator(".settings-page")).toContainText(
    "第 1 週・設定測試",
  );
  await page.locator("[data-request-reset]").click();
  await expect(page.locator("[data-confirm-reset]")).toBeVisible();
  await page.locator("[data-cancel-reset]").click();
  await expect(page.locator("[data-request-reset]")).toBeVisible();
  await page.locator("[data-request-reset]").click();
  await page.locator("[data-confirm-reset]").click();
  await expect(page.locator(".create-screen")).toBeVisible();
  await expect(page.locator("#player-name")).toHaveValue("");
  await page.reload();
  await expect(page.locator(".create-screen")).toBeVisible();
});
test("深化首頁、行程、地圖與手機在桌機與手機專案都可操作", async ({ page }) => {
  await createPlayer(page, "深化介面測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.knownPeople = ["jiqing"];
    state.relationships.jiqing = {
      closeness: 70,
      trust: 70,
      affection: 70,
      hostility: 0,
      romance: "dating",
      visibility: "underground",
    };
    state.partnerId = "jiqing";
    state.npcMessages = [
      {
        id: "e2e-romance",
        npcId: "jiqing",
        week: state.week,
        text: "到家跟我說。",
        read: false,
      },
    ];
    state.managerAdvice = {
      name: "許芮安",
      text: "先把已經答應的做好。曝光少一點不會死，失信會。",
      type: "conservative",
      week: state.week,
    };
    state.appOpen = null;
    render();
  });
  await expect(page.locator(".home-briefing")).toContainText("① 現在最急");
  await expect(page.locator(".home-briefing")).toContainText("② 有人在找你");
  await expect(page.locator(".home-briefing")).toContainText("③ 本章目標");
  await page.locator('.tablet-dock [data-open-app="people"]').click();
  await expect(page.locator(".message-inbox")).toContainText("到家跟我說");
  await page.locator(".window-close[data-close-app]").click();
  await page.locator('.tablet-dock [data-open-app="planner"]').click();
  await expect(page.locator(".planner-command-bar")).toContainText("疲勞趨勢");
  await page.locator(".window-close[data-close-app]").click();
  await openApp(page, "map");
  await expect(page.locator(".map-page")).toContainText("今日線索");
  await expect(page.locator(".app-window.map")).toBeVisible();
});
test("人物整合、原創輸入、線索樣式與存檔版面不再互相遮擋", async ({ page }) => {
  await createPlayer(page, "介面修正測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { meetNpc } = await import("/src/logic/npc-engine.js");
    const { render } = await import("/src/render.js");
    meetNpc("lujingran", "測試初遇");
    state.appOpen = "people";
    state.peopleSection = "contacts";
    render();
  });
  await expect(page.locator(".people-hub-tabs")).toBeVisible();
  await page.locator('[data-people-section="profiles"]').click();
  await expect(page.locator(".npc-dossier")).toBeVisible();
  expect(
    await page
      .locator(".relationship-panel")
      .evaluate((el) => getComputedStyle(el).position),
  ).toBe("static");
  expect(
    await page
      .locator(".npc-profile-copy>header")
      .evaluate((el) => getComputedStyle(el).position),
  ).toBe("static");
  await page.locator(".window-close[data-close-app]").click();
  await openApp(page, "creative");
  const title = page.locator("#creative-title");
  await title.fill("雨後的第二幕");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.notice = "畫面重繪測試";
    render();
  });
  await expect(page.locator("#creative-title")).toHaveValue("雨後的第二幕");
  await page.locator('[data-creative-new="script"]').click();
  await expect(page.locator(".creative-projects")).toContainText(
    "雨後的第二幕",
  );
  await page.locator(".window-close[data-close-app]").click();
  await openApp(page, "map");
  const clue = page.locator(".map-context").first();
  await expect(clue).toBeVisible();
  expect(
    await clue.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe("rgb(255, 255, 0)");
  await page.locator(".window-close[data-close-app]").click();
  await openApp(page, "save");
  const columns = await page
    .locator(".save-cards.multi-slot")
    .evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
  expect(columns).toBe(
    page.viewportSize().width > 1200
      ? 5
      : page.viewportSize().width > 760
        ? 3
        : 1,
  );
});
test("三種主題與大字體維持可操作版面", async ({ page }, testInfo) => {
  await createPlayer(page, "視覺矩陣測試");
  await page.evaluate(async () => {
    const { state } = await import("/src/core/state.js");
    const { render } = await import("/src/render.js");
    state.appOpen = "planner";
    render();
  });
  for (const theme of ["warm", "rose", "night"])
    for (const fontSize of ["standard", "large"]) {
      await page.evaluate(
        async ({ theme, fontSize }) => {
          const { setPreference } = await import("/src/core/preferences.js");
          const { render } = await import("/src/render.js");
          setPreference("theme", theme);
          setPreference("fontSize", fontSize);
          render({ persist: false });
        },
        { theme, fontSize },
      );
      await expect(page.locator(".app-window.planner")).toBeVisible();
      const layout = await page.evaluate(() => {
        const dialog = document.querySelector(".app-window"),
          hidden = document.querySelector(".skip-link"),
          box = dialog.getBoundingClientRect(),
          sr = getComputedStyle(hidden);
        return {
          left: box.left,
          right: box.right,
          width: box.width,
          viewport: window.innerWidth,
          srWidth: sr.width,
          srPosition: sr.position,
        };
      });
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.right).toBeLessThanOrEqual(layout.viewport + 1);
      expect(layout.srWidth).toBe("1px");
      expect(layout.srPosition).toBe("absolute");
      await testInfo.attach(`layout-${theme}-${fontSize}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }
});
