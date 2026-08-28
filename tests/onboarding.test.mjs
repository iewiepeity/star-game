import test from"node:test";
import assert from"node:assert/strict";
import{initialState}from"../src/core/state.js";
import{advancePrologue,completePrologue,PROLOGUE_LAST_STEP,startPrologue}from"../src/logic/onboarding.js";
import{TUTORIALS}from"../src/logic/tutorial.js";
import{playerAge}from"../src/logic/romance-engine.js";

test("完成創角後會進入四幕序章並接回遊戲",()=>{
 const state=initialState();
 startPrologue(state);
 assert.equal(state.screen,"prologue");
 assert.equal(state.prologueStep,0);
 for(let i=0;i<PROLOGUE_LAST_STEP;i++)assert.equal(advancePrologue(state),true);
 assert.equal(state.prologueStep,PROLOGUE_LAST_STEP);
 assert.equal(advancePrologue(state),false);
 assert.equal(state.screen,"game");
 assert.equal(state.prologueCompleted,true);
});

test("可只跳過序章或連同新手教學全部跳過",()=>{
 const storyOnly=initialState();
 completePrologue(storyOnly);
 assert.equal(storyOnly.screen,"game");
 assert.equal(storyOnly.tutorialSeen,undefined);
 const skipAll=initialState();
 completePrologue(skipAll,{skipTutorial:true});
 assert.deepEqual(skipAll.tutorialSeen,TUTORIALS.map(item=>item.id));
});

test("大學畢業開局年齡為 22 歲並逐年增加",()=>{
 assert.equal(playerAge({week:1}),22);
 assert.equal(playerAge({week:52}),22);
 assert.equal(playerAge({week:53}),23);
});
