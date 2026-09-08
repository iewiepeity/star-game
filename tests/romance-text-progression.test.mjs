import test from 'node:test';
import assert from 'node:assert/strict';
import {state,resetState} from '../src/core/state.js';
import {meetNpc} from '../src/logic/npc-engine.js';
import {queueNpcStoryEvents} from '../src/logic/npc-storylines.js';
import {resolveEvent} from '../src/logic/event-engine.js';
import {NPC_ROMANCE_SCENES} from '../src/data/romance-scenes.js';

function setup(stage='dating'){
 resetState();state.week=100;state.completedWorks.push({id:'test-work'});meetNpc('jiqing');
 Object.assign(state.relationships.jiqing,{romance:stage,romanceSinceWeek:20,closeness:100,trust:100,affection:100,hostility:0,romanceHistory:[]});
 state.characterMemories={jiqing:{bonds:['care','work']}};
 state.partnerId='jiqing';state.eventQueue=[];state.queuedEvents=[];state.activeEvent=null;state.npcStoryHistory=['jiqing:stage:bonded'];
}
function queuedRomances(){return [...state.eventQueue,...state.queuedEvents].map(x=>x.event).filter(x=>x.id.startsWith('npc-romance-jiqing:'))}
function postpone(){queueNpcStoryEvents();const event=queuedRomances()[0];assert.ok(event);assert.equal(event.text,NPC_ROMANCE_SCENES.jiqing[state.relationships.jiqing.romance].text);resolveEvent(event,'later');state.eventQueue=[];state.queuedEvents=[];state.activeEvent=null;return event;}

test('postponing a relationship commitment keeps the current relationship and waits eight weeks',()=>{
 setup();postpone();assert.equal(state.relationships.jiqing.romance,'dating');assert.equal(state.partnerId,'jiqing');
 state.week=107;queueNpcStoryEvents();assert.equal(queuedRomances().length,0);
});

test('all three partner commitments can be offered again after eight weeks and accepted',()=>{
 for(const [from,next] of [['dating','committed'],['committed','engaged'],['engaged','married']]){
  setup(from);const original=postpone();state.week=108;state.relationships.jiqing.affection=100;queueNpcStoryEvents();const retry=queuedRomances()[0];
  assert.ok(retry,from);assert.notEqual(retry.id,original.id);assert.match(retry.id,/:retry:100$/);
  const result=resolveEvent(retry,'yes');assert.ok(result);assert.equal(state.relationships.jiqing.romance,next);assert.equal(state.partnerId,'jiqing');
 }
});

test('queued commitment retries survive repeated ticks without a duplicate proposal',()=>{
 setup();postpone();state.week=108;queueNpcStoryEvents();const ids=queuedRomances().map(x=>x.id);
 queueNpcStoryEvents();state.week=109;queueNpcStoryEvents();assert.deepEqual(queuedRomances().map(x=>x.id),ids);assert.equal(ids.length,1);
});

test('every playable romance has distinct scenes and refusal outcomes for all eight entry stages',()=>{
 assert.equal(Object.keys(NPC_ROMANCE_SCENES).length,9);
 for(const stage of ['none','interested','ambiguous','dating','committed','engaged','rejected','broken']){
  const rows=Object.values(NPC_ROMANCE_SCENES).map(pool=>pool[stage]);assert.equal(new Set(rows.map(x=>x.text)).size,9);
  for(const s of rows){assert.ok(s.title&&s.label&&s.yes&&s.later);assert.notEqual(s.yes,s.later);}
 }
 setup('none');state.partnerId=null;queueNpcStoryEvents();resolveEvent(queuedRomances()[0],'later');assert.equal(state.relationships.jiqing.romance,'rejected');assert.equal(state.partnerId,null);
});
