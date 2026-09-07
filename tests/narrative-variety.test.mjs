import test from 'node:test';
import assert from 'node:assert/strict';
import { state, resetState, hydrateState } from '../src/core/state.js';
import { NPCS } from '../src/data/npcs.js';
import { NPC_INTERACTION_EVENTS } from '../src/data/npc-interaction-events.js';
import { NPC_EVERYDAY_SCENES } from '../src/data/npc-everyday-scenes.js';
import { NPC_CONTACT_STORIES } from '../src/data/npc-contact-stories.js';
import { SCHEDULE_EVENTS } from '../src/data/schedule-events.js';
import { meetNpc } from '../src/logic/npc-engine.js';
import { npcInteractionDecision, resolveNpcInteraction } from '../src/logic/npc-interaction-engine.js';
import { contactReply } from '../src/logic/conversations.js';
import { shortContact, queueShortCheckIn } from '../src/logic/short-contact.js';
import { prepareScheduleEvent, resolveScheduleMoment } from '../src/logic/random-events.js';
import { initialLife, beginDay, settleDay, normalizeLife } from '../src/pixel/life.js';
import { setSeed } from '../src/core/rng.js';

const actionIds = ['vocal','acting','dance','speech','creation','songwriting','script','image','networking'];
function fresh() { resetState(); state.money = 1000000; state.week = 2; setSeed('narrative-variety'); }

test('all ten NPCs gain authored encounters for every available interaction and nine romance routes gain two dates', () => {
  const ids = new Set(), texts = new Set();
  for (const [npcId, types] of Object.entries(NPC_EVERYDAY_SCENES)) {
    assert.ok(NPCS[npcId]);
    for (const type of Object.keys(NPC_INTERACTION_EVENTS[npcId])) {
      if (npcId === "hanzhiyuan" && type === "date") continue;
      assert.ok(types[type]?.length, `${npcId}:${type}`);
      if(type === 'date' && npcId !== 'hanzhiyuan') assert.ok(types[type].length >= 2);
      for (const scene of types[type]) {
        assert.ok(!ids.has(scene.id)); ids.add(scene.id);
        assert.ok(!texts.has(scene.text)); texts.add(scene.text);
        assert.ok(scene.text.length >= 35 && scene.choices.length >= 2);
        scene.choices.forEach((choice, index) => {
          assert.ok(choice.label && choice.note && choice.outcome.length >= 25);
          assert.deepEqual(choice.effect, NPC_INTERACTION_EVENTS[npcId][type].choices[npcId === "linxiafan" && type === "reconcile" ? 0 : index].effect);
        });
      }
    }
  }
  assert.equal(Object.keys(NPC_EVERYDAY_SCENES).length, 10);
  assert.ok(ids.size >= 80);
});

test('NPC encounter selection uses all alternatives and pins decisions through reopen, save and later history', () => {
  fresh(); meetNpc('jiqing');
  const pool = [NPC_INTERACTION_EVENTS.jiqing.chat, ...NPC_EVERYDAY_SCENES.jiqing.chat];
  const seen = [];
  for (let i = 0; i < pool.length * 3; i++) {
    const task = { kind: 'npc_interact', payload: { npcId: 'jiqing', type: 'chat' } };
    const before = structuredClone(state);
    const decision = npcInteractionDecision(task);
    assert.deepEqual(state, before, 'opening a decision must not consume a scene');
    const pinned = task.payload.interactionEventId;
    assert.equal(pinned, pool[i % pool.length].id);
    hydrateState(structuredClone(state));
    assert.deepEqual(npcInteractionDecision(structuredClone(task)), decision);
    const result = resolveNpcInteraction(task, decision.choices[1].id);
    assert.equal(result.ok, true);
    assert.equal(state.npcInteractionMemories.at(-1).eventId, pinned);
    assert.match(result.text, new RegExp(pool[i % pool.length].choices[1].outcome.slice(0, 8)));
    seen.push(pinned);
    state.week++;
    assert.equal(npcInteractionDecision(task).title, decision.title, 'a pinned task does not drift after completion');
  }
  assert.equal(new Set(seen.slice(0, pool.length)).size, pool.length);
  const blocked = { payload: { npcId: 'jiqing', type: 'personal' } };
  state.relationships.jiqing.hostility = 80;
  const history = structuredClone(state.npcInteractionEventHistory);
  assert.equal(resolveNpcInteraction(blocked, 'respond').ok, false);
  assert.deepEqual(state.npcInteractionEventHistory, history);
});

test('an older pending NPC scene retains its original choices when new alternatives exist', () => {
  fresh(); meetNpc('jiqing');
  state.npcInteractionEventHistory['jiqing:chat'] = ['jiqing-chat'];
  const task = { payload: { npcId: 'jiqing', type: 'chat', interactionEventId: 'jiqing-chat' } };
  const decision = npcInteractionDecision(task);
  assert.equal(decision.title, NPC_INTERACTION_EVENTS.jiqing.chat.title);
  assert.equal(resolveNpcInteraction(task, 'ask').ok, true);
  assert.equal(state.npcInteractionMemories.at(-1).eventId, 'jiqing-chat');
});

test('training rotates through a full pool before repeating and preserves its cycle across save/reload', () => {
  for (const actionId of actionIds) {
    fresh(); const length = SCHEDULE_EVENTS[actionId].length;
    const seen = [];
    for (let i = 0; i < length * 2; i++) {
      if (i === 7) hydrateState(structuredClone(state));
      seen.push(resolveScheduleMoment(actionId).title);
    }
    assert.equal(new Set(seen.slice(0, length)).size, length, actionId);
    assert.equal(new Set(seen.slice(length)).size, length, actionId);
    assert.notEqual(seen[length - 1], seen[length], actionId);
    assert.equal(state.randomEventHistory[`schedule:${actionId}:seen`].length, length);
  }
});

test('legacy numeric history and a prepared event retain their original meaning', () => {
  fresh();
  state.randomEventHistory['schedule:vocal'] = 1;
  prepareScheduleEvent('vocal');
  const pending = structuredClone(state.pendingRandomEvent);
  assert.notEqual(pending.index, 1);
  const cursor = state.rngCursor;
  hydrateState(structuredClone(state));
  assert.equal(resolveScheduleMoment('vocal').title, SCHEDULE_EVENTS.vocal[pending.index].title);
  assert.equal(state.rngCursor, cursor, 'prepared resolution must not draw twice');
  state.pendingRandomEvent = {kind:'schedule',key:'vocal',index:1};
  assert.equal(resolveScheduleMoment('vocal').title, SCHEDULE_EVENTS.vocal[1].title);
});

test('pixel training presents the new pool and replaying a settled saved day does not consume another event', () => {
  const life = initialLife('new-training'); life.game.money = 100000;
  life.game.randomEventHistory = { 'schedule:acting': 4, 'schedule:acting:seen': SCHEDULE_EVENTS.acting.slice(0,5).map(event=>event.title) };
  beginDay(life, { id:'acting' });
  const result = settleDay(life, 'focus');
  assert.ok(SCHEDULE_EVENTS.acting.slice(5).some(event=>event.title === result.moments[0].title));
  const restored = normalizeLife(structuredClone(life));
  const history = structuredClone(restored.game.randomEventHistory);
  assert.deepEqual(settleDay(restored, 'focus'), result);
  assert.deepEqual(restored.game.randomEventHistory, history);
});

test('short replies are character-specific, vary within a week and survive saving without spending time or RNG', () => {
  for (const npcId of Object.keys(NPCS)) {
    for (const topic of ['day','work','care']) {
      fresh(); meetNpc(npcId);
      const economicBefore = [state.money, state.fatigue, state.rngCursor, ...state.schedule];
      const received = [];
      for (let i = 0; i < NPC_CONTACT_STORIES[npcId][topic].length; i++) {
        assert.equal(shortContact(npcId, 'message', topic).ok, true);
        received.push(state.npcMessages.at(-1).text);
        hydrateState(structuredClone(state));
        if (i % 2 === 1) state.week++;
      }
      assert.equal(new Set(received).size, received.length, `${npcId}:${topic}`);
      assert.deepEqual([state.money, state.fatigue, state.rngCursor, ...state.schedule], economicBefore);
      const preview = contactReply(npcId, topic);
      assert.equal(contactReply(npcId, topic), preview);
    }
  }
  assert.equal(contactReply('missing', 'day'), undefined);
});

test('proactive check-ins consume the same message history instead of repeating their short-contact opener', () => {
  fresh(); meetNpc('jiqing'); state.relationships.jiqing.closeness = 50;
  const first = contactReply('jiqing', 'day');
  assert.equal(queueShortCheckIn(), true);
  assert.ok(state.npcMessages.at(-1).text.startsWith(first));
  assert.notEqual(contactReply('jiqing', 'day'), first);
  assert.equal(queueShortCheckIn(), false);
});


test('legacy NPC messages without text do not break replies or proactive weekly messages', () => {
  fresh(); meetNpc('jiqing'); state.relationships.jiqing.closeness = 50;
  const first = NPC_CONTACT_STORIES.jiqing.day[0];
  state.npcMessages.push({npcId:'jiqing',message:first}, {npcId:'jiqing',label:'舊訊息'}, {npcId:'jiqing'});
  hydrateState(structuredClone(state));
  assert.notEqual(contactReply('jiqing','day'), first);
  assert.equal(shortContact('jiqing','call').ok, true);
  assert.equal(queueShortCheckIn(), true);
});
