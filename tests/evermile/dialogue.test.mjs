import test from 'node:test';
import assert from 'node:assert/strict';
import {conversation, nameFor} from '../../evermile/dialogue.js';

test('every conversation has a name, an opening line and two or more replies with answers', () => {
  const contexts = [{kind: 'keeper', shop: 'PETROL STATION', dented: true, dirty: true}, {kind: 'keeper', shop: 'CAFÉ AROMA', town: 'Linden'}, {kind: 'keeper', shop: 'BARBER'}, {kind: 'keeper', shop: 'HARDWARE'}, {kind: 'keeper', shop: 'BOOKS & CO'}, {kind: 'keeper', shop: 'FLOWERS'}, {kind: 'fisherman'}, {kind: 'mechanic', dented: true}, {kind: 'passerby', seed: .1, town: 'Wrenfield'}, {kind: 'passerby', seed: .5, lowFuel: true}, {kind: 'passerby', seed: .9, hour: 23, rain: .5}];
  for (const c of contexts) {
    const t = conversation({name: 'Ada', hour: 9, ...c});
    assert.equal(t.name, 'Ada'); assert.ok(t.line.length > 5, JSON.stringify(c)); assert.ok(t.replies.length >= 2);
    for (const r of t.replies) { assert.ok(r.text && r.reply, 'reply has text and answer'); if (r.effect) assert.ok(r.price > 0, 'a service has a price'); }
  }
});

test('services appear only when they apply, and names are stable per person', () => {
  const petrolDented = conversation({kind: 'keeper', shop: 'PETROL STATION', dented: true}), petrolClean = conversation({kind: 'keeper', shop: 'PETROL STATION'});
  assert.ok(petrolDented.replies.some((r) => r.effect === 'repair')); assert.ok(!petrolClean.replies.some((r) => r.effect === 'repair'));
  assert.match(conversation({kind: 'passerby', hour: 3, seed: 0}).line, /night|Late/i);
  assert.equal(nameFor(5), nameFor(5)); assert.notEqual(nameFor(5), nameFor(6));
});
