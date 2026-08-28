import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{ABILITIES}from"../src/data/abilities.js";
import{NPC_STORY_CONTENT}from"../src/data/npc-story-content.js";
import{setSeed}from"../src/core/rng.js";
import{recordBrandOutcome,brandRelation,brandAuditionModifier}from"../src/logic/brand-relations.js";
import{recordScandal,respondToScandal,tickScandals,activeScandal}from"../src/logic/scandal-engine.js";
import{ensureManager,managerInteract,tickManager}from"../src/logic/manager.js";
import{meetNpc,adjustRelationship,advanceRomance}from"../src/logic/npc-engine.js";
import{queueNpcStoryEvents}from"../src/logic/npc-storylines.js";
import{createCreativeProject,startCreativeProduction}from"../src/logic/creative.js";
import{toggleCreativeCollaborator,cycleCreativeRole,setCreativeBudget,creativeTeamPower}from"../src/logic/creative-team.js";
function fresh(){resetState();state.name="測試玩家";state.stats=Object.fromEntries(ABILITIES.map(n=>[n,850]));state.hidden={幽默:600,共情:600,洞察:600,膽識:600,品德:600,自律:600,野心:600,抗壓:600};state.schedule=Array(7).fill("rest");state.freeLocations=Array(7).fill(null);state.scheduledJobIds=Array(7).fill(null);state.scheduledActivityIds=Array(7).fill(null);state.money=50000;setSeed("v13")}
test("品牌會記住合作表現並形成優先合作關係",()=>{fresh();recordBrandOutcome("晨露飲品","completed",{quality:95});recordBrandOutcome("晨露飲品","completed",{quality:90});recordBrandOutcome("晨露飲品","completed",{quality:92});const r=brandRelation("晨露飲品");assert.equal(r.works,3);assert.ok(r.trust>60);assert.ok(brandAuditionModifier("晨露飲品")>0);assert.notEqual(r.status,"new")});
test("醜聞有類型、回應與可完成的復原期",()=>{fresh();state.rep.爭議度=300;state.rep.可信度=700;const s=recordScandal("misstatement",2,"直播失言");assert.equal(s.label,"失言爭議");respondToScandal(s.id,"apologize");for(let i=0;i<20&&activeScandal();i++){state.week++;state.rep.爭議度=Math.max(0,state.rep.爭議度-30);tickScandals()}assert.equal(activeScandal(),null);assert.equal(s.status,"recovered")});
test("簽約公司會建立具信任、壓力、默契的固定經紀人",()=>{fresh();state.currentAgencyId="starlight";state.agencyContractEndWeek=100;const m=ensureManager();assert.equal(m.def.name,"許芮安");const before=m.state.rapport;assert.equal(managerInteract("career").ok,true);assert.ok(m.state.rapport>before);state.publicOpinion.state="scandal";tickManager();assert.ok(m.state.stress>18)});
test("NPC 專屬事件與戀愛事件會依角色與關係階段出現",()=>{fresh();assert.ok(NPC_STORY_CONTENT.tangtang?.hook&&NPC_STORY_CONTENT.tangtang?.private&&NPC_STORY_CONTENT.tangtang?.romance);meetNpc("tangtang");adjustRelationship("tangtang",{closeness:90,trust:85});state.eventQueue=[];queueNpcStoryEvents();assert.ok(state.eventQueue.some(x=>x.event.id==="npc-story-tangtang:stage:bonded"));advanceRomance("tangtang","interested");state.eventQueue=[];queueNpcStoryEvents();assert.ok(state.eventQueue.some(x=>x.event.id==="npc-romance-tangtang:romance:interested"))});
test("原創作品可設定預算與合作職位且影響製作",()=>{fresh();meetNpc("tangtang");adjustRelationship("tangtang",{closeness:35,trust:30});const p=createCreativeProject("song","規格測試");Object.assign(p,{status:"contracted",category:"歌曲"});assert.equal(toggleCreativeCollaborator(p.id,"tangtang").ok,true);const role=cycleCreativeRole(p.id,"tangtang");assert.ok(role);assert.equal(setCreativeBudget(p.id,"premium").ok,true);const power=creativeTeamPower(p);assert.ok(power>0);const moneyBefore=state.money;const r=startCreativeProduction(p.id);assert.ok(r&&!r.error);assert.equal(p.budgetSpent,9000);assert.equal(state.money,moneyBefore-9000)});
