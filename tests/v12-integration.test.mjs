import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{ABILITIES}from"../src/data/abilities.js";
import{setSeed}from"../src/core/rng.js";
import{meetNpc,adjustRelationship}from"../src/logic/npc-engine.js";
import{tickPublicOpinion,brandEligible,jobMarketModifier}from"../src/logic/reputation-engine.js";
import{createCreativeProject}from"../src/logic/creative.js";
import{toggleCreativeCollaborator,reserveCreativeTeam,completeCreativeTeamDay}from"../src/logic/creative-team.js";
import{isNpcBusy}from"../src/logic/npc-ecosystem.js";
function fresh(){resetState();state.name="測試玩家";state.stats=Object.fromEntries(ABILITIES.map(n=>[n,800]));state.hidden={幽默:600,共情:600,洞察:600,膽識:600,品德:600,自律:600,野心:600,抗壓:600};setSeed("v12")}
test("炎上會降低品牌市場並建立公關回應事件",()=>{fresh();state.rep.爭議度=760;state.rep.可信度=260;const p=tickPublicOpinion([{heat:500}]);assert.equal(p.state,"scandal");assert.equal(brandEligible(4),false);assert.ok(jobMarketModifier("廣告")<0);assert.ok(state.eventQueue.some(x=>x.event.id?.startsWith("scandal-response")));assert.ok(state.industryNews.some(n=>n.category==="輿論"))});
test("爆紅會提高工作市場並建立曝光選擇",()=>{fresh();state.fame=500;state.rep.路人緣=900;state.rep.國民度=700;state.rep.業界評價=700;state.rep.話題度=900;state.rep.可信度=700;const p=tickPublicOpinion([{heat:600}]);assert.equal(p.state,"viral");assert.ok(jobMarketModifier("廣告")>0);assert.ok(state.eventQueue.some(x=>x.event.id?.startsWith("viral-response")))});
test("原創作品合作 NPC 會占真實檔期且不能同日分身",()=>{fresh();meetNpc("tangtang");adjustRelationship("tangtang",{closeness:30,trust:25});const p=createCreativeProject("song","合作單曲");Object.assign(p,{status:"contracted",category:"歌曲"});assert.equal(toggleCreativeCollaborator(p.id,"tangtang").ok,true);const booking=reserveCreativeTeam(p,1,2);assert.equal(booking.ok,true);assert.equal(isNpcBusy("tangtang",1,2),true);assert.equal(reserveCreativeTeam(p,1,2).ok,true);completeCreativeTeamDay(p,1,2);assert.equal(isNpcBusy("tangtang",1,2),true)});
