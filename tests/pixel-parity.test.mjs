import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLife, beginDay, settleDay, advanceDay, normalizeLife, CHOICES} from '../src/pixel/life.js';
import {SCHEDULE_EVENTS} from '../src/data/schedule-events.js';
import {LOCATION_EVENTS} from '../src/data/location-events.js';

for (const id of ['rest', 'study', Object.keys(CHOICES).find(id => CHOICES[id].venue === 'park' && CHOICES[id].action === 'free')]) {
  test(`${id}: authored daily moment keeps its story and effects across reload without a second award`, () => {
    let life = initialLife(`parity-${id}`);
    beginDay(life, {id});
    life = normalizeLife(JSON.parse(JSON.stringify(life)));
    const result = settleDay(life, 'focus');
    assert.equal(result.moments.length, 1);
    const moment = result.moments[0];
    const pool = CHOICES[id].action === 'free' ? LOCATION_EVENTS.park : SCHEDULE_EVENTS[CHOICES[id].action];
    const authored = pool.find(e => e.title === moment.title);
    assert.ok(authored);
    assert.equal(moment.text, authored.text);
    assert.equal(moment.outcome, authored.outcome);
    assert.equal(life.game.eventHistory.filter(e => e.title === moment.title).length, 1);
    assert.ok(life.game.weekResults[0].text.includes(moment.outcome));
    life = normalizeLife(JSON.parse(JSON.stringify(life)));
    const before = structuredClone(life.game);
    assert.deepEqual(settleDay(life, 'explore').moments, result.moments);
    assert.deepEqual(life.game, before, 'no duplicate stats, RNG draws or history after reload');
  });
}
test('successive rest days do not repeat the previous authored moment', () => {
  const life = initialLife('parity-rest-variety');
  beginDay(life, {id:'rest'});
  const first = settleDay(life).moments[0].title;
  advanceDay(life);
  beginDay(life, {id:'rest'});
  assert.notEqual(settleDay(life).moments[0].title, first);
});
test('focused park visits never create an unintroduced NPC through the restored event pool', () => {
  const id = Object.keys(CHOICES).find(id => CHOICES[id].venue === 'park' && CHOICES[id].action === 'free');
  for (let i=0;i<20;i++) {
    const life = initialLife(`parity-focus-${i}`);
    beginDay(life, {id});
    settleDay(life, 'focus');
    assert.deepEqual(life.game.knownPeople, []);
  }
});
