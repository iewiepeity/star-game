import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{NPC_LIST}from"../src/data/npcs.js";
import{NPC_INTERACTION_EVENTS,NPC_INTERACTION_TYPES}from"../src/data/npc-interaction-events.js";
import{meetNpc}from"../src/logic/npc-engine.js";
import{npcInteractionDecision,resolveNpcInteraction}from"../src/logic/npc-interaction-engine.js";

function fresh(){resetState();state.money=100000;state.runnerDay=2;state.schedule=Array(7).fill("rest")}

test("十名主要 NPC 都有六種專屬相處事件與兩個選擇",()=>{const ids=new Set;for(const npc of NPC_LIST){const events=NPC_INTERACTION_EVENTS[npc.id];assert.ok(events,`${npc.name} 缺少事件資料`);for(const type of NPC_INTERACTION_TYPES){const event=events[type];assert.ok(event,`${npc.name} 缺少 ${type}`);assert.equal(event.choices.length,2);assert.ok(event.choices.every(c=>c.label&&c.note&&c.outcome&&c.effect));assert.equal(ids.has(event.id),false,`事件 ID 重複：${event.id}`);ids.add(event.id)}}assert.equal(ids.size,60)});

test("排入行程的人物互動會在當天顯示專屬選擇並記住結果",()=>{fresh();meetNpc("jiqing");const task={kind:"npc_interact",payload:{npcId:"jiqing",type:"chat"}};const decision=npcInteractionDecision(task);assert.equal(decision.title,"收音燈熄滅之後");assert.equal(decision.npcName,"喬映澄");assert.equal(decision.choices.length,2);const before=state.relationships.jiqing.affection,result=resolveNpcInteraction(task,"ask");assert.equal(result.ok,true);assert.ok(state.relationships.jiqing.affection>before);assert.equal(state.npcInteractionMemories.at(-1).choiceId,"ask");assert.deepEqual(state.npcInteractionEventHistory["jiqing:chat"],["jiqing-chat"]);assert.doesNotMatch(result.text,/好感|affection|\+\d/)});

test("不同 NPC 的相處內容與回應不共用模板",()=>{fresh();const titles=new Set,openingTexts=new Set;for(const npc of NPC_LIST){const event=NPC_INTERACTION_EVENTS[npc.id].chat;titles.add(event.title);openingTexts.add(event.text)}assert.equal(titles.size,NPC_LIST.length);assert.equal(openingTexts.size,NPC_LIST.length);assert.notDeepEqual(NPC_INTERACTION_EVENTS.shenyao.collaborate.choices,NPC_INTERACTION_EVENTS.tangtang.collaborate.choices)});
