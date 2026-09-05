import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });
async function create(page) {
  await page.goto("/");await page.locator("#player-real-name").fill("工作新人");
  await page.locator("#to-stats").click();await page.locator("#start").click();
  await page.locator("[data-skip-onboarding]").click();
  await page.evaluate(async()=>{(await import("/src/core/preferences.js")).setPreference("autoSpeed","manual");});
}
async function open(page, app) {
  await page.evaluate(async app=>{const {state}=await import("/src/core/state.js");(await import("/src/core/app-navigation.js")).openApp(state,app);(await import("/src/render.js")).render();},app);
}
test("工作入口說明來源，安排公司探訪不會提早取得打工", async ({page})=>{
  await create(page);await open(page,"jobs");
  await expect(page.locator('.jobs-page > h2')).toHaveText("目前信箱裡沒有工作");
  await expect(page.locator('[data-job-action="apply"]')).toHaveCount(0);
  await expect(page.locator('.work-discovery article')).toHaveCount(4);
  await page.locator('.work-discovery [data-city-shortcut="film_company"]').click();
  await expect(page.locator('.city-place-detail')).toContainText('首次到訪可登記');
  await page.locator('.city-place-detail [data-map-location="film_company"]').click();
  await expect(page.locator('[data-pick="film_runner"]')).toHaveCount(0);
  await expect(page.locator('[data-pick="newcomer_gig"]')).toBeVisible();
  await expect(page.locator('[data-pick="audition"]')).toHaveCount(0);
  await expect(page.locator('[data-pick="street"]')).toHaveCount(0);
  await page.locator('#begin-week').click();
  await page.locator('[data-choice="browse_jobs"]').click();
  await expect(page.locator('.day-result')).toContainText('臨時人員登記');
  const progress=await page.evaluate(async()=>{const {state}=await import('/src/core/state.js');return {visits:state.visitedLocationsByWeek,shifts:state.partTimeShifts};});
  expect(progress.visits[1]).toContain('film_company');expect(progress.shifts.film_runner).toBeUndefined();
});
test("已登記打工可從行程表安排，完成才領薪與累積第三次經驗", async ({page},info)=>{
  await create(page);
  // Returning player's two earlier shifts: exercise the third real shift through the UI.
  await page.evaluate(async()=>{const {state}=await import('/src/core/state.js');state.visitedLocationsByWeek={1:['film_company']};state.partTimeShifts={film_runner:2};state.week=4;state.appOpen='jobs';(await import('/src/render.js')).render();});
  await page.locator('[data-part-time-plan="film_runner"]').click();
  await page.locator('[data-pick="film_runner"]').click();
  const before=await page.evaluate(async()=>{const {state}=await import('/src/core/state.js');return{money:state.money,count:state.partTimeShifts.film_runner};});
  expect(before.count).toBe(2);
  await page.locator('#begin-week').click();
  await expect(page.locator('.day-result')).toContainText('已完成這裡的三次打工');
  const after=await page.evaluate(async()=>{const {state}=await import('/src/core/state.js');const {JOB_CATALOG}=await import('/src/data/jobs.js');const job=JOB_CATALOG.find(j=>j.category==='電影'&&j.stars===2);const {canAccessJob}=await import('/src/logic/industry.js');return{money:state.money,count:state.partTimeShifts.film_runner,access:canAccessJob(job)};});
  expect(after.money).toBeGreaterThanOrEqual(before.money+1500);expect(after.count).toBe(3);expect(after.access.ok).toBe(true);expect(after.access.source.type).toBe('experience');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('star-game-save')||'{}').state?.partTimeShifts?.film_runner)).toBe(3);
  await page.screenshot({path:info.outputPath('company-shift.png')});
  await page.reload();
  await expect.poll(()=>page.evaluate(async()=>(await import('/src/core/state.js')).state.partTimeShifts.film_runner)).toBe(3);
});
test("舊排程未到訪的公司打工不會領薪、增加能力或工作經驗", async ({page})=>{
  await create(page);
  const before=await page.evaluate(async()=>{const {state}=await import('/src/core/state.js');state.schedule[0]='film_runner';state.appOpen='planner';(await import('/src/render.js')).render();return{money:state.money,stats:state.stats};});
  await page.locator('#begin-week').click();
  await expect(page.locator('.day-result')).toContainText('沒有獲得工作收入或經驗');
  const after=await page.evaluate(async()=>{const {state}=await import('/src/core/state.js');return{money:state.money,stats:state.stats,shifts:state.partTimeShifts};});
  expect(after.money).toBe(before.money);expect(after.stats).toEqual(before.stats);expect(after.shifts).toEqual({});
});
