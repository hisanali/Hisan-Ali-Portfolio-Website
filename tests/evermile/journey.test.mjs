import test from 'node:test';
import assert from 'node:assert/strict';
import {loadJourney, saveJourney, startDrive, advance, foundPlace, summary, clockText, KEY, MILESTONES_KM} from '../../evermile/journey.js';

const memory = () => { const m = new Map(); return {getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), map: m}; };

test('loads an empty log, inherits the old running distance, and survives bad or missing storage', () => {
  const j = loadJourney(memory(), 42.5);
  assert.equal(j.totalKm, 42.5); assert.equal(j.drives, 0); assert.deepEqual(j.places, []);
  assert.equal(loadJourney(null, 0).totalKm, 0);
  const bad = memory(); bad.setItem(KEY, '{"drives":"x","totalKm":-3,"places":[1,"lake",null]}');
  const fixed = loadJourney(bad, 0); assert.equal(fixed.drives, 0); assert.equal(fixed.totalKm, 0); assert.deepEqual(fixed.places, ['lake']);
  const throwing = {getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }};
  assert.equal(loadJourney(throwing, 1).totalKm, 1); saveJourney(throwing, fixed);
});

test('a drive accumulates distance, announces milestones once, and remembers the longest drive', () => {
  const j = loadJourney(memory(), 0), s = startDrive(j);
  assert.equal(j.drives, 1);
  const notes = [];
  for (let i = 0; i < 1200; i++) { const n = advance(j, s, 10, 1 / 120); if (n) notes.push(n); } // 12 km at 10 m per step
  assert.deepEqual(notes, ['5 km this drive', '10 km this drive']);
  assert.ok(Math.abs(s.km - 12) < 1e-9); assert.ok(Math.abs(j.totalKm - 12) < 1e-9); assert.ok(Math.abs(j.longestKm - 12) < 1e-9);
  assert.equal(advance(j, s, 0, 1), null, 'no repeat while standing still');
  // A second, longer drive beats the record exactly once.
  const second = startDrive(j); const seen = [];
  for (let i = 0; i < 1500; i++) { const n = advance(j, second, 10, 1 / 120); if (n) seen.push(n); }
  assert.deepEqual(seen, ['5 km this drive', '10 km this drive', 'Your longest drive yet']);
  assert.ok(j.longestKm > 14.9); assert.equal(j.drives, 2);
  assert.equal(MILESTONES_KM[0], 5);
});

test('milestones read in miles when the player drives in miles', () => {
  const j = loadJourney(memory(), 0), s = startDrive(j);
  let note = null; for (let i = 0; i < 520; i++) note = advance(j, s, 10, 1 / 120, 'mi') || note;
  assert.equal(note, '3 mi this drive');
});

test('places are found once ever, and the title screen summary describes the log and this drive', () => {
  const j = loadJourney(memory(), 0);
  assert.deepEqual(summary(j, null).cells, [], 'nothing to show before the first drive');
  const s = startDrive(j);
  assert.equal(foundPlace(j, s, 'lake'), true); assert.equal(foundPlace(j, s, 'lake'), false); assert.equal(foundPlace(j, s, null), false);
  for (let i = 0; i < 90; i++) advance(j, s, 10, 40);
  const {cells, drive} = summary(j, s, 'km', 12);
  assert.deepEqual(cells.map((c) => c.label), ['DRIVEN', 'DRIVE', 'LONGEST', 'PLACES FOUND']);
  assert.equal(cells[0].value, '0.9 km'); assert.equal(cells[3].value, '1 / 12');
  assert.equal(drive, 'This drive · 0.9 km · 1h 00m · 1 new place');
  j.totalKm = 250.4; j.drives = 3;
  const mi = summary(j, null, 'mi'); assert.equal(mi.cells[0].value, '156 mi'); assert.equal(mi.cells[1].label, 'DRIVES'); assert.equal(mi.drive, '');
  assert.equal(clockText(90), '1 min'); assert.equal(clockText(3600 * 2 + 300), '2h 05m');
  const store = memory(); saveJourney(store, j); assert.equal(loadJourney(store, 0).places[0], 'lake');
});

test('shops: money is earned by driving and finding places, goods are bought only where stocked, kept things go in the bag', async () => {
  const {GOODS, STOCK, buy, useItem, bagText} = await import('../../evermile/journey.js');
  const j = loadJourney(memory(), 0), s = startDrive(j);
  assert.equal(j.money, 20);
  for (let i = 0; i < 300; i++) advance(j, s, 10, 1 / 120); // 3 km
  assert.equal(j.money, 23, 'a coin a kilometre');
  foundPlace(j, s, 'pier'); assert.equal(j.money, 33, 'ten for a new place');
  assert.equal(buy(j, 'fuelcan', 'FLOWERS').ok, false, 'not stocked');
  const r = buy(j, 'fuelcan', 'HARDWARE'); assert.equal(r.ok, true); assert.equal(r.kind, 'keep'); assert.equal(j.money, 21); assert.equal(j.bag.fuelcan, 1);
  assert.equal(buy(j, 'coffee', 'CAFÉ AROMA').kind, 'now'); assert.equal(j.bag.coffee, undefined, 'drunk, not carried');
  j.money = 1; assert.match(buy(j, 'haircut', 'BARBER').why, /more/);
  assert.equal(useItem(j, 'fuelcan'), true); assert.equal(useItem(j, 'fuelcan'), false); assert.equal(bagText(j), 'Nothing yet');
  for (const [shop, items] of Object.entries(STOCK)) for (const it of items) assert.ok(GOODS[it], `${shop} stocks a real item: ${it}`);
  const store = memory(); j.bag.map = 2; saveJourney(store, j); assert.equal(loadJourney(store, 0).bag.map, 2);
});
