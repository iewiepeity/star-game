import test from"node:test";
import assert from"node:assert/strict";
import{readFileSync}from"node:fs";
import{normalizePreferences,setPreference,autoAdvanceDelay,runnerLoadingDelay,PLAYBACK_SPEEDS}from"../src/core/preferences.js";
import{initialState}from"../src/core/state.js";
import{settingsApp}from"../src/views/settings.js";

test("顯示偏好只接受既定字級與主題",()=>{
 assert.deepEqual(normalizePreferences({fontSize:"large",theme:"night",autoSpeed:"x2",musicVolume:.7,sfxVolume:.6,audioMuted:true}),{fontSize:"large",theme:"night",autoSpeed:"x2",musicVolume:.7,sfxVolume:.6,audioMuted:true});
 assert.equal(normalizePreferences({fontSize:"巨大",theme:"螢光綠",autoSpeed:"x99"}).fontSize,"standard");
});

test("手動與五種倍速控制結算與過場，未知速度回到 1×",()=>{
 setPreference("autoSpeed","manual");
 assert.equal(autoAdvanceDelay(),null);
 setPreference("autoSpeed","x1");
 assert.equal(autoAdvanceDelay(),4000);
 setPreference("autoSpeed","x2");
 assert.equal(autoAdvanceDelay(),2000);
 for(const [speed,delay,loading] of [["x4",1000,88],["x8",500,44],["x16",250,22]]){
  assert.equal(normalizePreferences({autoSpeed:speed}).autoSpeed,speed);
  setPreference("autoSpeed",speed);
  assert.equal(autoAdvanceDelay(),delay);
  assert.equal(runnerLoadingDelay(),loading);
 }
 assert.deepEqual(PLAYBACK_SPEEDS.map(s=>s.id),["manual","x1","x2","x4","x8","x16"]);
 setPreference("autoSpeed","x99");
 assert.equal(autoAdvanceDelay(),4000);
});

test("設定頁包含存讀檔、顯示偏好、教學與二次確認",()=>{
 const state=initialState();
 state.name="設定測試";
 const html=settingsApp();
 for(const text of["快速存檔與讀檔","字體大小","介面主題","自動播放速度","音樂與事件音效","新手教學","從頭開始"])assert.match(html,new RegExp(text));
 assert.match(html,/data-request-reset/);
 assert.match(html,/data-auto-speed="x1"/);
 for(const speed of ["x2","x4","x8","x16"]) assert.ok(html.includes(`data-auto-speed="${speed}"`));
 assert.match(html,/一般結算停留 0.25 秒/);
 assert.match(html,/data-auto-speed="manual"/);
});

test("開局公開文案不再殘留十八歲設定",()=>{
 const targets=["index.html","manifest.webmanifest","src/views/create.js","src/views/prologue.js","src/views/room.js","src/logic/romance-engine.js"];
 const text=targets.map(path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8")).join("\n");
 assert.doesNotMatch(text,/十八歲|18\s*歲|從十八/);
 assert.match(text,/大學畢業/);
});
