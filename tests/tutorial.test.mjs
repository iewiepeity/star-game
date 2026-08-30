import test from"node:test";
import assert from"node:assert/strict";
import{initialState}from"../src/core/state.js";
import{markTutorialSeen,nextTutorial,TUTORIALS}from"../src/logic/tutorial.js";

test("新手提示依目前介面出現且每則只顯示一次",()=>{
 const state=initialState();
 state.screen="game";
 assert.equal(nextTutorial(state)?.id,"room-welcome");
 markTutorialSeen(state,"room-welcome");
 assert.equal(nextTutorial(state),null);
 state.appOpen="planner";
 assert.equal(nextTutorial(state)?.id,"planner-basics");
 markTutorialSeen(state,"planner-basics");
 assert.equal(nextTutorial(state),null);
});

test("人物教學只在真正認識 NPC 後出現",()=>{
 const state=initialState();
 Object.assign(state,{screen:"game",appOpen:"people",peopleSection:"profiles"});
 assert.equal(nextTutorial(state),null);
 state.knownPeople=["jiqing"];
 assert.equal(nextTutorial(state)?.id,"npc-basics");
});

test("提示識別碼不重複且缺少舊欄位時仍可運作",()=>{
 const state=initialState();
 delete state.tutorialSeen;
 markTutorialSeen(state,"room-welcome");
 markTutorialSeen(state,"room-welcome");
 assert.deepEqual(state.tutorialSeen,["room-welcome"]);
 assert.equal(new Set(TUTORIALS.map(item=>item.id)).size,TUTORIALS.length);
});
