import test from 'node:test';
import assert from 'node:assert/strict';
import {Network, ZONE} from '../../evermile/network.js';
import {DESTINATIONS, DISTRICT_END, DISTRICT_START, DISTRICT_GRID, DISTRICT_LEVEL, PLACE_KINDS} from '../../evermile/destinations.js';
import {random} from '../../evermile/math.js';

const base = {seed: 'the-long-way', location: 'hills', roadWidth: 10.6, autoLane: 'left', destination: 'journey'};

// Drive a long way, taking the signposted place most of the time, as autodrive does.
function drive(settings, km, seed = 7) {
  const n = new Network(settings), rng = random(seed), offered = new Set(), visited = new Set(), districts = new Set();
  let z = 35, px = n.x(z), py = n.y(z), junctions = 0, worstGrade = 0, worstStep = 0;
  while (z < km * 1000) {
    const j = n.junctionAhead(z, 900);
    if (j && !j.seen) {
      j.seen = true; junctions++;
      assert.equal(j.options.length, 2);
      for (const o of j.options) { assert.ok(o.z1 > o.z0 + 1500, 'each way runs on to another junction'); if (o.district) offered.add(o.district); }
      const place = j.options.findIndex((o) => o.district);
      n.choose(j, place >= 0 && rng() < .7 ? place : rng() < .4 ? 1 : 0);
    }
    z += 5;
    const x = n.x(z), y = n.y(z);
    assert.ok(Number.isFinite(x) && Number.isFinite(y), `finite road at ${z}`);
    worstStep = Math.max(worstStep, Math.abs(x - px)); worstGrade = Math.max(worstGrade, Math.abs(y - py) / 5); px = x; py = y;
    n.commit(x, z);
    const d = n.districtAt(z); if (d) { visited.add(d.district); districts.add(d); }
  }
  return {n, offered, visited, districts, junctions, worstGrade, worstStep};
}

for (const style of ['winding', 'normal', 'straight']) test(`endless journey (${style}): one connected road, no dead ends, gentle joins`, () => {
  const run = drive({...base, roadStyle: style}, 160);
  assert.ok(run.junctions > 30, 'junctions keep coming');
  assert.ok(run.visited.size >= 6, `several places reached by road (${[...run.visited]})`);
  assert.ok(run.worstGrade < .15, `grade ${run.worstGrade}`);
  assert.ok(run.worstStep < 6.5, `no lateral jump (${run.worstStep})`);
});

test('every destination is signposted somewhere on the endless road', () => {
  const offered = new Set();
  for (const seed of ['the-long-way', 'coast-to-coast', 'sunday drive']) for (const k of drive({...base, seed, roadStyle: 'normal'}, 220, 3).offered) offered.add(k);
  assert.deepEqual([...offered].sort(), [...PLACE_KINDS].sort());
});

test('districts on the network: aligned, level, clear of tunnels, towns, rail and services, and followed by a junction', () => {
  const run = drive({...base, roadStyle: 'winding'}, 160, 11), n = run.n;
  assert.ok(run.districts.size >= 5);
  for (const d of run.districts) {
    assert.equal(d.d0 % DISTRICT_GRID, 0);
    assert.ok(d.d0 + DISTRICT_START > d.z0 + ZONE + 500, 'the district starts after the road has left its junction');
    assert.ok(d.z1 > d.d0 + DISTRICT_END + 300, 'the next junction comes after the district');
    const level = DISTRICT_LEVEL[d.district] ?? 0;
    for (let z = d.d0 + DISTRICT_START + 60; z < d.d0 + DISTRICT_END - 60; z += 40) {
      assert.ok(Math.abs(d.y(z) - level) < .35, `${d.district} level at ${z - d.d0}`);
      assert.equal(n.tunnels(d).some((t) => z > t.start && z < t.end), false);
      assert.equal(n.stops(d).some((s) => Math.abs(s.z - z) < s.len), false);
    }
    const rail = n.rail(d); if (rail) assert.ok(rail.b < d.d0 + DISTRICT_START - 100 || rail.a > d.d0 + DISTRICT_END + 100);
  }
});

test('starting in a destination still starts inside it, and the road carries on to other places', () => {
  for (const kind of PLACE_KINDS) {
    const n = new Network({...base, roadStyle: 'normal', destination: kind});
    assert.equal(n.districtAt(35)?.district, kind);
    assert.equal(n.segs[0].d0, 0);
    const run = drive({...base, roadStyle: 'normal', destination: kind}, 40, 5);
    assert.ok([...run.visited].some((k) => k !== kind) || run.offered.size > 0, `${kind}: other places reachable`);
  }
});

test('junction information names the destination', () => {
  const n = new Network({...base, roadStyle: 'normal'}), j = n.junctions[0], i = j.options.findIndex((o) => o.district);
  assert.ok(i >= 0, 'the first junction offers a place');
  const info = n.optionInfo(j, i);
  assert.equal(info.label, DESTINATIONS[info.district].name);
  assert.ok(info.name.length > 0);
});
