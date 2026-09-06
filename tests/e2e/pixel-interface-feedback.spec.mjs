import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
test.use({ serviceWorkers: "block" });
test.setTimeout(60000);
const read = page => page.evaluate(() => window.__pixelRead());
const close = page => page.getByRole("button", { name: "關閉視窗" }).click();
async function menu(page, id) {
  await page.getByRole("button", { name: "開啟選單" }).click();
  await page.locator(`#panel [data-ui="${id}"]`).click();
}
async function start(page, configure = () => {}) {
  const state = initialPixelState();
  state.flags.intro = true;
  state.playerName = "夏知星";
  configure(state);
  await page.addInitScript(s => {
    if (!sessionStorage.getItem("interface-seeded")) {
      localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state: s }));
      sessionStorage.setItem("interface-seeded", "true");
    }
  }, state);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
}

test("larger player card and weekly shortcut fit alongside the daily controls in every theme", async ({ page }, info) => {
  test.setTimeout(60000);
  await start(page, s => { s.objectStates = { home: { "prop-cushions": "blue" } }; });
  for (const theme of ["cream", "rose", "sage", "lilac", "night"]) {
    await menu(page, "settings");
    await page.locator(`button[data-pixel-theme="${theme}"]`).click();
    await close(page);
    await expect(page.locator("#player-name")).toHaveText("夏知星");
    expect(await page.locator("#player-name").evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(20);
    expect((await page.locator(".player-portrait-frame").boundingBox()).height).toBeGreaterThanOrEqual(70);
    for (const id of ["week-control", "auto-control", "run-label", "speed-label"]) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const actionRows = await page.locator(".runner-controls button").evaluateAll(es => es.map(e => Math.round(e.getBoundingClientRect().y)));
    expect(new Set(actionRows).size).toBe(1);
    const controls = await page.locator('.bottom-bar > button, .runner-controls button').evaluateAll(es => es.map(e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}; }));
    for (let i=0;i<controls.length;i++) {
      expect(controls[i].bottom).toBeLessThanOrEqual(page.viewportSize().height);
      for (let j=i+1;j<controls.length;j++) {
        const a=controls[i],b=controls[j];
        expect(a.right<=b.x || b.right<=a.x || a.bottom<=b.y || b.bottom<=a.y, JSON.stringify({i,j,a,b})).toBe(true);
      }
    }
    const colors = await page.locator(".resource-hud span").evaluateAll(es => es.map(e => getComputedStyle(e).backgroundColor));
    expect(new Set(colors).size).toBe(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${theme}-home.png`) });
  }
  await page.getByRole("button", { name: "查看我的角色" }).click();
  await expect(page.locator("#panel-title")).toHaveText("我的角色");
  await close(page);
  await page.locator("#week-control").click();
  await expect(page.locator("#panel-title")).toHaveText("我的一週");
  await page.locator('[data-day="2"]').click();
  await page.locator('[data-plan="rest"]').click();
  expect((await read(page)).state.life.plan[2].id).toBe("rest");
});

test("cancelling auto stops today's action immediately without consuming a day or rewards", async ({ page }) => {
  await start(page, s => { s.life.plan[0] = { id: "rest" }; });
  const before = (await read(page)).state.life;
  await page.locator("#auto-control").click();
  await expect.poll(async () => (await read(page)).state.life.pending?.phase, { timeout: 15000 }).toBe("performing");
  await page.locator("#auto-control").click();
  await expect.poll(async () => (await read(page)).state.life.pending).toBeNull();
  expect((await read(page)).state.activity).toBeNull();
  expect((await read(page)).player.moving).toBe(false);
  await page.waitForTimeout(1000);
  const after = (await read(page)).state.life;
  expect(after.auto).toBe(false);
  expect(after.day).toBe(before.day);
  expect(after.game.money).toBe(before.game.money);
  expect(after.ledger).toEqual(before.ledger);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  expect((await read(page)).state.life.pending).toBeNull();
  await page.locator("#week-control").click();
  await page.locator('[data-plan="social"]').click();
  expect((await read(page)).state.life.plan[0].id).toBe("social");
});

test("cancelled travel cannot resume its action after delayed room assets arrive", async ({ page }) => {
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  let loading = false;
  await page.route("**/assets/pixel/rehearsal.png", async route => {
    loading = true;
    await barrier;
    await route.continue();
  });
  try {
    await start(page, s => { s.life.plan[0] = { id: "acting" }; });
    await page.locator("#auto-control").click();
    await expect.poll(() => loading, { timeout: 15000 }).toBe(true);
    await page.locator("#auto-control").click();
    release();
    await page.waitForTimeout(1500);
    expect((await read(page)).scene).toBe("home");
    expect((await read(page)).state.life.pending).toBeNull();
    expect((await read(page)).state.activity).toBeNull();
    expect((await read(page)).state.life.day).toBe(0);
  } finally {
    release();
  }
});

test("career cards omit scene illustrations and agency visits actually travel to the companies", async ({ page }, info) => {
  test.setTimeout(60000);
  await start(page, s => { s.life.speed = 16; });
  await menu(page, "career");
  await expect(page.locator(".career-tile")).toHaveCount(6);
  await expect(page.locator(".career-tile img, .career-tile svg")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("career-cards.png") });
  await page.locator('[data-career="agencies"]').click();
  await expect.poll(async () => (await read(page)).scene, { timeout: 15000 }).toBe("business");
  await expect(page.locator('[data-interior="agency_starlight"]')).toBeVisible();
  await page.locator('[data-interior="agency_starlight"]').click();
  await expect.poll(async () => (await read(page)).scene, { timeout: 15000 }).toBe("agency_starlight");
  expect((await read(page)).state.life.day).toBe(0);
  expect((await read(page)).state.life.ledger).toHaveLength(0);
});

test("city directory is clickable and map hover previews places without losing a selected destination", async ({ page }, info) => {
  await start(page, s => { s.life.speed = 16; });
  await menu(page, "travel");
  await expect(page.locator("[data-map-list]")).toHaveCount(27);
  await expect(page.locator("[data-map-place]")).toHaveCount(27);
  await page.screenshot({ path: info.outputPath("map-directory-initial.png") });
  if (page.viewportSize().width > 650) {
    const map = await page.locator(".city-map-viewport").boundingBox();
    const directory = await page.locator(".city-map-sidebar").boundingBox();
    expect(directory.x).toBeGreaterThanOrEqual(map.x + map.width);
    expect((await page.locator('.city-place-list').boundingBox()).height).toBeGreaterThan(150);
    const search = await page.locator('.map-tools').boundingBox();
    expect(search.y + search.height).toBeLessThanOrEqual(map.y);
  }
  await page.locator('[data-map-list="cafe"]').click();
  await expect(page.locator("#map-detail")).toHaveAttribute("data-place", "cafe");
  await page.locator('[data-map-place="shop"]').hover();
  await expect(page.locator("#map-detail")).toHaveAttribute("data-place", "shop");
  await page.locator(".map-heading").hover();
  await expect(page.locator("#map-detail")).toHaveAttribute("data-place", "cafe");
  await page.screenshot({ path: info.outputPath("map-directory.png") });
  await page.locator("#map-search").fill("表演");
  await expect(page.locator('[data-map-list="rehearsal"]')).toBeVisible();
  await expect(page.locator('[data-map-list="shop"]')).toBeHidden();
  await page.locator("#map-search").fill("不存在的地點");
  await expect(page.locator(".map-no-results")).toBeVisible();
  await page.locator("#map-search").fill("");
  await page.locator('[data-map-list="shop"]').click();
  await page.locator('[data-map-enter="shop"]').click();
  await expect.poll(async () => (await read(page)).scene, { timeout: 15000 }).toBe("shop");
});


test("a wardrobe trip keeps its agreed destination when the pointer happens to cross the map", async ({ page }) => {
  await start(page, s => { s.sceneId = "shop"; s.life.speed = 16; });
  await menu(page, "profile");
  await page.locator('[data-ui="closet"]').click();
  await page.locator('[data-map-place="cafe"]').hover();
  await expect(page.locator('[data-map-enter="home"]')).toBeVisible();
  await page.locator('[data-map-enter="home"]').click();
  await expect(page.locator('[data-fitting="practice"]')).toBeVisible({ timeout: 15000 });
  expect((await read(page)).scene).toBe("home");
});
