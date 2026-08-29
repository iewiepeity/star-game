import{test,expect}from"@playwright/test";
async function createPlayer(page,name="實玩深化驗收"){
  await page.goto("/");
  await page.locator("#player-name").fill(name);
  await page.locator("#player-name").dispatchEvent("input");
  await page.locator("#to-stats").click();
  await expect(page.locator("#start")).toBeVisible({timeout:10000});
  await page.locator("#start").click();
  await expect(page.locator("[data-skip-onboarding]")).toBeVisible({timeout:10000});
  await page.locator("[data-skip-onboarding]").click();
  await expect(page.locator(".room-screen")).toBeVisible();
}

test("爆紅、年度倒數與二周目直覺會出現在首頁",async({page})=>{
  await createPlayer(page);
  await page.evaluate(async()=>{
    const{state}=await import("/src/core/state.js");
    const{buildWeeklyThread}=await import("/src/logic/playable-depth-engine.js");
    const{render}=await import("/src/render.js");
    state.week=5;
    state.fame=1600;
    state.ngPlusKnowledge={loops:1,unlocked:["電影"]};
    buildWeeklyThread();
    state.appOpen=null;
    render();
  });
  await expect(page.locator(".playable-pulse")).toContainText("爆紅生活");
  await expect(page.locator(".playable-pulse")).toContainText("春季平台招商");
  await expect(page.locator(".playable-pulse")).toContainText("二周目直覺");
});

test("正式工作頁會顯示試鏡情報與現場追加要求",async({page})=>{
  await createPlayer(page,"試鏡情報驗收");
  await page.evaluate(async()=>{
    const{state}=await import("/src/core/state.js");
    const{ABILITIES}=await import("/src/data/abilities.js");
    const{ensureJobState}=await import("/src/logic/job-engine.js");
    const{render}=await import("/src/render.js");
    state.stats=Object.fromEntries(ABILITIES.map(name=>[name,900]));
    state.trainingSessionsCompleted=100;
    state.selectedJobId="J001";
    state.visitedIndustryLocations=["tv-station"];
    const record=ensureJobState("J001");
    record.stage="applied";
    state.appOpen="jobs";
    render();
  });
  await expect(page.locator(".audition-intel")).toBeVisible();
  await expect(page.locator(".audition-intel")).toContainText("試鏡情報");
  await expect(page.locator(".audition-intel")).toContainText("現場可能追加要求");
});
