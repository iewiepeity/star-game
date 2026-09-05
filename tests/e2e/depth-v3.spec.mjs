import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("多幕人物場景會顯示選擇代價與專屬後續提示",async({page})=>{
 await page.goto("/");
 await page.evaluate(async()=>{
  const{state}=await import("/src/core/state.js");const{render}=await import("/src/render.js");
  state.screen="event";state.name="場景測試";state.week=40;
  state.activeEvent={source:"人物跨年主線",event:{id:"e2e-scene",kind:"人物事件",title:"喬映澄・沒有播出的那一集",text:"這次不是摘要。",beats:[{label:"收播",text:"錄音室只剩機器散熱聲。"},{label:"真正的問題",text:"她問自己是不是一直替別人說話。"},{label:"你的回答",text:"這次她沒有先替你圓場。"}],choices:[{id:"stay",label:"陪她錄完",note:"會共同承擔後續。",outcome:"你留下了。",effect:{mood:1},followUp:{delayWeeks:2,event:{title:"兩週後",text:"那集有了答案。"}}}]}};render();
 });
 await expect(page.locator(".event-scene-beats section")).toHaveCount(1);
 await expect(page.locator("[data-event-choice]")).toHaveCount(0);
 await page.locator("[data-scene-next]").click();
 await page.locator("[data-scene-next]").click();
 await expect(page.locator("[data-event-choice]")).toContainText("會共同承擔後續");
 await expect(page.locator("[data-event-choice]")).toContainText("專屬後續");
});

test("星途時間線在手機版集中顯示人物、作品與永久選擇",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto("/");
 await page.evaluate(async()=>{
  const{state}=await import("/src/core/state.js");const{render}=await import("/src/render.js");
  state.screen="game";state.name="時間線測試";state.knownPeople=["jiqing"];state.relationships.jiqing={closeness:60,trust:60,affection:30,hostility:0,romance:"none",visibility:"private",romanceHistory:[],affectionHistory:[],hostilityHistory:[]};
  state.npcMessages=[{id:"m",npcId:"jiqing",week:4,text:"到家跟我說。",read:false}];state.completedWorks=[{id:"w",title:"夜航試播集",category:"電視劇",completedWeek:3}];state.majorDecisionHistory=[{week:2,year:1,label:"守住作品"}];state.appOpen="timeline";render();
 });
 await expect(page.locator(".timeline-page")).toBeVisible();
 await expect(page.locator(".timeline-page")).toContainText("喬映澄");
 await expect(page.locator(".timeline-page")).toContainText("夜航試播集");
 await expect(page.locator(".timeline-page")).toContainText("守住作品");
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow).toBeLessThanOrEqual(1);
});
