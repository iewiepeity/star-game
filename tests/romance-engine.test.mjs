import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{meetNpc,adjustRelationship}from"../src/logic/npc-engine.js";
import{romanceEligibility,romanceOpportunity,setRomanceVisibility,transitionRomance,breakUp}from"../src/logic/romance-engine.js";
import{migrateV10ToV11}from"../src/core/migrations.js";
import{npcApp}from"../src/views/npc.js";
import{peopleApp}from"../src/views/people.js";
import{evaluateEnding,endingSnapshot}from"../src/logic/career.js";

function fresh(){resetState();state.name="戀愛測試";state.schedule=Array(7).fill("rest");state.freeLocations=Array(7).fill(null);state.scheduledJobIds=Array(7).fill(null);state.scheduledActivityIds=Array(7).fill(null)}

test("好感值存在後台，但 NPC 與通訊錄介面不顯示精確數字",()=>{fresh();meetNpc("tangtang");adjustRelationship("tangtang",{closeness:42,trust:31,affection:37});assert.equal(state.relationships.tangtang.affection,37);const html=npcApp()+peopleApp();assert.doesNotMatch(html,/好感\s*37|37\s*[／/]\s*100/);assert.match(html,/相處感覺/);assert.match(html,/朋友/)});

test("條件型路線會檢查年齡、作品與直接工作衝突",()=>{fresh();meetNpc("shenyao");assert.equal(romanceEligibility("shenyao").ok,false);state.week=105;state.completedWorks.push({id:"W1"});assert.equal(romanceEligibility("shenyao").ok,true);state.activeJobs.JX={stage:"active",npcCast:["shenyao"]};assert.equal(romanceEligibility("shenyao").ok,false)});

test("隱藏好感與友情、信任共同解鎖曖昧，且只能有一位正式伴侶",()=>{fresh();for(const id of["tangtang","sufei"]){meetNpc(id);adjustRelationship(id,{closeness:70,trust:60,affection:70});transitionRomance(id,"interested");transitionRomance(id,"ambiguous")}assert.equal(romanceOpportunity("tangtang").next,"dating");assert.equal(transitionRomance("tangtang","dating").ok,true);assert.equal(state.partnerId,"tangtang");assert.equal(transitionRomance("sufei","dating").ok,false)});

test("正式關係支援公開、地下戀與分手",()=>{fresh();meetNpc("jiqing");adjustRelationship("jiqing",{closeness:70,trust:60,affection:70});transitionRomance("jiqing","interested");transitionRomance("jiqing","ambiguous");transitionRomance("jiqing","dating");assert.equal(state.relationships.jiqing.visibility,"underground");assert.equal(setRomanceVisibility("jiqing","public").ok,true);assert.equal(state.relationships.jiqing.visibility,"public");assert.equal(breakUp("jiqing").ok,true);assert.equal(state.partnerId,null);assert.equal(state.relationships.jiqing.romance,"broken")});

test("v10 關係資料會補齊隱藏好感與唯一伴侶",()=>{fresh();const old=structuredClone(state);old.saveVersion=10;old.relationships={jiqing:{closeness:80,trust:70,romance:"dating"}};delete old.partnerId;const migrated=migrateV10ToV11(old);assert.equal(migrated.saveVersion,11);assert.equal(migrated.partnerId,"jiqing");assert.ok(migrated.relationships.jiqing.affection>=60);assert.equal(migrated.relationships.jiqing.visibility,"underground")});

test("穩定伴侶、訂婚與婚姻會進入五年戀愛結局判定",()=>{fresh();meetNpc("jiqing");Object.assign(state.relationships.jiqing,{closeness:92,trust:90,affection:95,romance:"married",visibility:"public"});state.partnerId="jiqing";state.endingSnapshot=endingSnapshot("fiveyear");const result=evaluateEnding("fiveyear");assert.equal(result.endingId,"soulmate");assert.equal(result.relationship.npcId,"jiqing")});
