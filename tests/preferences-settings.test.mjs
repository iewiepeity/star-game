import test from"node:test";
import assert from"node:assert/strict";
import{normalizePreferences,setPreference,autoAdvanceDelay,runnerLoadingDelay,PLAYBACK_SPEEDS}from"../src/core/preferences.js";

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
