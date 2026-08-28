import test from"node:test";
import assert from"node:assert/strict";
import{readFileSync}from"node:fs";
import{normalizePreferences}from"../src/core/preferences.js";
import{initialState}from"../src/core/state.js";
import{settingsApp}from"../src/views/settings.js";

test("顯示偏好只接受既定字級與主題",()=>{
 assert.deepEqual(normalizePreferences({fontSize:"large",theme:"night"}),{fontSize:"large",theme:"night"});
 assert.deepEqual(normalizePreferences({fontSize:"巨大",theme:"螢光綠"}),{fontSize:"standard",theme:"warm"});
});

test("設定頁包含存讀檔、顯示偏好、教學與二次確認",()=>{
 const state=initialState();
 state.name="設定測試";
 const html=settingsApp();
 for(const text of["快速存檔與讀檔","字體大小","介面主題","新手教學","從頭開始"])assert.match(html,new RegExp(text));
 assert.match(html,/data-request-reset/);
});

test("開局公開文案不再殘留十八歲設定",()=>{
 const targets=["index.html","manifest.webmanifest","src/views/create.js","src/views/prologue.js","src/views/room.js","src/logic/romance-engine.js"];
 const text=targets.map(path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8")).join("\n");
 assert.doesNotMatch(text,/十八歲|18\s*歲|從十八/);
 assert.match(text,/大學畢業/);
});
