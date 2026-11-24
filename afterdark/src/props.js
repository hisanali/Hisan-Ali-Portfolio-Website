// Photo-scanned props from Poly Haven (CC0, polyhaven.com), optimised to Draco + WebP. They stream in after the game has
// started, so loading is not held up: Dutch sailing ships at anchor, wooden piers, quiver trees and scrub in the dunes,
// mossy rocks, stumps, fallen logs and ferns in the woods, rocks along the shore, and the clutter of real places:
// lamps, covered cars, hydrants, bins, barrels, gas bottles, tyres, crates, lifebuoys and road barriers.
import * as THREE from '/evermile/vendor/three.module.js';
import { loadGLB } from './car.js';
import { rng, splitChunks } from './city.js';
import { coastX, LAKE } from './frontier-land.js';
import { loadFactoryKit } from './facades.js';

const DIR = '/afterdark/assets/props/';
const TAU = Math.PI * 2;

export async function buildProps(scene, city, world, Q, onCollider = () => {}) {
  const R = rng(8080), terrain = world.terrain, sea = city.sea, reach = Q.reach || 1, many = n => Math.round(n * Math.min(1, reach));
  const place = k => world.places.find(p => p.key === k), out = { update: () => {}, setTime: () => {}, ships: [], counts: {} };
  const dummy = new THREE.Object3D(), m4 = new THREE.Matrix4(), glass = [];
  const solid = shape => { city.colliders.push(shape); onCollider(shape); };

  // ---- a kind: meshes of one model, instanced at every placement ----
  const kinds = {};
  async function kind(name, { child = null, alphaCut = 0.5 } = {}) {
    const g = await loadGLB(DIR + name + '.glb'); let root = g.scene; if (child != null) { root = g.scene.children[child] || g.scene; root.position.set(0, 0, 0); }
    root.updateMatrixWorld(true); const parts = [];
    root.traverse(o => { if (!o.isMesh) return; const mat = o.material; mat.envMapIntensity = 0.55; if (mat.transparent || mat.alphaTest > 0 || /leaf|sail|fern|shrub/i.test(mat.name)) { mat.transparent = false; mat.alphaTest = alphaCut; mat.side = THREE.DoubleSide; mat.depthWrite = true; }
      if (/glass/i.test(mat.name)) { mat.emissive = new THREE.Color(1, 0.78, 0.5); mat.emissiveIntensity = 0; glass.push(mat); }
      parts.push({ geo: o.geometry, mat, m: o.matrixWorld.clone() }); });
    return (kinds[name] = { parts, list: [] });
  }
  const put = (k, x, y, z, yaw = 0, s = 1, tilt = 0) => { dummy.position.set(x, y, z); dummy.rotation.set(tilt * (R() - 0.5), yaw, tilt * (R() - 0.5)); dummy.scale.setScalar(s); dummy.updateMatrix(); k.list.push(dummy.matrix.clone()); };
  const build = (k, dist, shadows = true) => { if (!k.list.length) return; for (const p of k.parts) { const im = new THREE.InstancedMesh(p.geo, p.mat, k.list.length); k.list.forEach((m, i) => im.setMatrixAt(i, m4.multiplyMatrices(m, p.m))); im.castShadow = shadows; im.receiveShadow = true; scene.add(im); splitChunks(im, dist, city.chunks, 220); } };

  const names = ['coast_rocks_05', 'coastal_cliff_04', 'quiver_tree_01', 'quiver_tree_02', 'shrub_02', 'namaqualand_boulder_02', 'namaqualand_boulders_01', 'rock_moss_set_01', 'tree_stump_01', 'dead_tree_trunk', 'fern_02',
    'street_lamp_01', 'covered_car', 'utility_box_01', 'metal_trash_can', 'Barrel_01', 'barrel_03', 'propane_tank', 'old_tyre', 'old_military_crate', 'lifebuoy', 'concrete_road_barrier'];
  await Promise.all(names.map(n => kind(n).catch(e => console.warn('prop unavailable', n, e))));
  await kind('fire_hydrant', { child: 0 }).catch(() => {});
  const K = kinds;
  const flat = (x, z, r = 2) => Math.abs(terrain(x + r, z) - terrain(x - r, z)) + Math.abs(terrain(x, z + r) - terrain(x, z - r));
  const clearOfRoads = (x, z, d) => { const r = world.nearRoad(x, z, d + 4); return !r || r.d > d; };
  const inPlace = (x, z, pad = 6) => world.places.some(p => p.contains ? p.contains(x, z, pad) : Math.hypot(p.x - x, p.z - z) < (p.r || 30) + pad);

  // ---- Coast: scanned rocks along the waterline, cliff rock at the foot of the cape ----
  if (K.coast_rocks_05) { let n = 0; for (let k = 0; k < 9000 && n < many(110); k++) { const z = -4900 + R() * 9900, x = coastX(z) + (R() - 0.3) * 40 + (z > -1812 && z < 2028 ? 0 : 0), y = terrain(x, z);
      if (y < -1.2 || y > 1.6 || !clearOfRoads(x, z, 16) || inPlace(x, z, 20)) continue; if (x > -150 && z > -60 && z < 1000) continue; put(K.coast_rocks_05, x, y - 0.35, z, R() * TAU, 1 + R() * 2.2, 0.3); n++;
      if (n % 3 === 0) solid({ x, z, r: 2.2, kind: 'shore rock' }); } }
  if (K.coastal_cliff_04) for (let z = -4250; z <= -2900; z += 120) { const x = coastX(z) + 6, a = Math.atan2(coastX(z + 20) - coastX(z - 20), 40); if (terrain(x + 30, z) < 30) continue; put(K.coastal_cliff_04, x, -1.2, z, a + Math.PI / 2, 1 + R() * 0.4); }

  // ---- The dune sea: quiver trees, dry scrub and weathered boulders ----
  const desert = (x, z) => world.zones(x, z)[0] > 0.6, dunes = world.roads.find(rd => rd.name === 'dunes'), duneSample = () => dunes && world.samples[dunes.from + Math.floor(R() * (dunes.to - dunes.from))];
  for (let k = 0, n = 0; k < 9000 && n < many(180); k++) { const a = R() * TAU, r = 16 + R() * 240, s = duneSample(); if (!s) continue; const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if (!desert(x, z) || !clearOfRoads(x, z, 12) || flat(x, z) > 3 || inPlace(x, z)) continue; const y = terrain(x, z), q = R() < 0.6 ? K.quiver_tree_01 : K.quiver_tree_02, sc = 2.2 + R() * 1.3; if (!q) continue;
    put(q, x, y - 0.1, z, R() * TAU, sc); solid({ x, z, r: 0.18 * sc, kind: 'quiver tree' }); n++; }
  for (let k = 0, n = 0; k < 9000 && n < many(220); k++) { const s = duneSample(); if (!s) continue; const x = s.x + (R() - 0.5) * 420, z = s.z + (R() - 0.5) * 420;
    if (!desert(x, z) || !clearOfRoads(x, z, 9) || inPlace(x, z)) continue; const y = terrain(x, z);
    if (R() < 0.55 && K.shrub_02) put(K.shrub_02, x, y - 0.05, z, R() * TAU, 0.6 + R() * 0.6); else if (K.namaqualand_boulder_02) { const sc = 1 + R() * 2.4; put(R() < 0.5 ? K.namaqualand_boulder_02 : K.namaqualand_boulders_01 || K.namaqualand_boulder_02, x, y - 0.15 * sc, z, R() * TAU, sc, 0.3); if (sc > 2) solid({ x, z, r: sc * 0.7, kind: 'boulder' }); } n++; }

  // ---- Woods: mossy rocks, stumps, fallen logs and ferns along the forest roads ----
  const woodRoads = world.roads.filter(rd => ['lakeside', 'temple', 'north', 'fjord', 'alpine', 'mountain', 'old', 'coast'].includes(rd.name));
  for (let k = 0, n = 0; k < 20000 && n < many(520); k++) { const rd = woodRoads[Math.floor(R() * woodRoads.length)], s = world.samples[rd.from + Math.floor(R() * (rd.to - rd.from))]; if (!s || s.tunnel || s.bridge) continue;
    const side = R() < 0.5 ? -1 : 1, lat = 10 + R() * 45, x = s.x + s.lx * side * lat + (R() - 0.5) * 6, z = s.z + s.lz * side * lat + (R() - 0.5) * 6, y = terrain(x, z);
    if (y < 3 || y > 300 || (world.lushness ? world.lushness(x, z) : 1) < 0.75 || world.zones(x, z)[0] > 0.3 || !clearOfRoads(x, z, 9) || inPlace(x, z) || flat(x, z) > 2.6) continue; if (x > -40 && x < 1000 && z > -40 && z < 1000) continue;
    const roll = R();
    if (roll < 0.42 && K.fern_02) put(K.fern_02, x, y - 0.05, z, R() * TAU, 0.9 + R() * 0.7);
    else if (roll < 0.62 && K.tree_stump_01) { put(K.tree_stump_01, x, y - 0.12, z, R() * TAU, 0.8 + R() * 0.6, 0.15); solid({ x, z, r: 0.6, kind: 'stump' }); }
    else if (roll < 0.82 && K.dead_tree_trunk) put(K.dead_tree_trunk, x, y + 0.05, z, R() * TAU, 1.2 + R() * 1.2, 0.08);
    else if (K.rock_moss_set_01) { const sc = 0.6 + R() * 0.8; put(K.rock_moss_set_01, x, y - 0.4 * sc, z, R() * TAU, sc, 0.15); solid({ x, z, r: 2.4 * sc, kind: 'mossy rocks' }); }
    n++; }

  // ---- The clutter of real places ----
  const lamp = (x, z, yaw) => { if (!K.street_lamp_01) return; put(K.street_lamp_01, x, world.ground(x, z) - 0.02, z, yaw, 1.25); solid({ x, z, r: 0.16, kind: 'lamp post' }); };
  const scatter = (pl, list, rMin, rMax, tries = 60) => { if (!pl) return; for (const [k, n, sc = 1, hard = 0.35] of list) { if (!k) continue; for (let i = 0, made = 0; i < tries * n && made < n; i++) { const a = R() * TAU, r = rMin + R() * (rMax - rMin), x = pl.x + Math.cos(a) * r, z = pl.z + Math.sin(a) * r;
    if (!clearOfRoads(x, z, 7.5) || flat(x, z, 1) > 0.6) continue; const y = world.ground(x, z); if (y < 0.4) continue; put(k, x, y - 0.02, z, R() * TAU, sc * (0.9 + R() * 0.2)); if (hard) solid({ x, z, r: hard * sc, kind: 'prop' }); made++; } } };
  // Fjordheim: lamps along its three roads, parked cars under covers, hydrants, cabinets, bins
  const village = place('village');
  if (village) { for (const rd of world.roads.filter(r => ['alpine', 'fjord', 'north'].includes(r.name))) for (let k = 0; k < 6; k++) { const i = rd.name === 'alpine' ? rd.to - 14 - k * 13 : rd.from + 14 + k * 13, s = world.samples[i]; if (!s) continue; const sd = k % 2 ? 1 : -1; lamp(s.x + s.lx * sd * 7.6, s.z + s.lz * sd * 7.6, Math.atan2(-s.lx * sd, -s.lz * sd)); }
    scatter(village, [[K.covered_car, 4, 1.15, 1.2], [K.fire_hydrant, 3, 1, 0.3], [K.utility_box_01, 3, 1, 0.35], [K.metal_trash_can, 4, 1, 0.5], [K.barrel_03, 4], [K.old_military_crate, 2, 1, 0.6]], 20, 120); }
  // the outpost, the lodge, the crater lookout and the harbour yard
  scatter(place('outpost'), [[K.Barrel_01, 10], [K.barrel_03, 6], [K.propane_tank, 8, 1.3, 0.25], [K.old_tyre, 8, 1.4, 0], [K.old_military_crate, 4, 1, 0.6], [K.covered_car, 1, 1.15, 1.2], [K.metal_trash_can, 2, 1, 0.5]], 8, 60);
  scatter(place('lodge'), [[K.Barrel_01, 3], [K.old_military_crate, 3, 1, 0.6], [K.covered_car, 2, 1.15, 1.2], [K.propane_tank, 4, 1.3, 0.25], [K.utility_box_01, 2, 1, 0.35]], 14, 70);
  scatter(place('harbour'), [[K.Barrel_01, 26], [K.barrel_03, 18], [K.old_military_crate, 10, 1.4, 0.8], [K.propane_tank, 8, 1.3, 0.25], [K.old_tyre, 10, 1.4, 0], [K.lifebuoy, 6, 1.2, 0], [K.metal_trash_can, 4, 1, 0.5], [K.utility_box_01, 4, 1, 0.35]], 10, 90);
  scatter(place('cabin'), [[K.Barrel_01, 2], [K.old_military_crate, 1, 1, 0.6], [K.propane_tank, 2, 1.3, 0.25]], 6, 22);
  // concrete barriers close off the dead-end roads at the cape and the crater
  for (const key of ['cape', 'crater', 'mouth']) { const pl = place(key); if (!pl || !K.concrete_road_barrier) continue; const s = pl.road; for (let k = -4; k <= 4; k++) { const x = s.x + s.tx * 9 + s.lx * k * 1.7, z = s.z + s.tz * 9 + s.lz * k * 1.7; put(K.concrete_road_barrier, x, world.ground(x, z) - 0.02, z, Math.atan2(s.lx, s.lz) + Math.PI / 2, 1.4); solid({ x, z, w: 2.1, d: 0.9, ux: s.lx, uz: s.lz, kind: 'barrier' }); } }

  // ---- instancing ----
  for (const [name, k] of Object.entries(kinds)) { const big = /cliff|coast|quiver|boulder/.test(name); build(k, big ? 1400 : /fern|shrub|stump|trunk|moss/.test(name) ? 320 : 520, !/fern|shrub/.test(name) || reach >= 1); out.counts[name] = k.list.length; }

  // ---- Wooden piers at Fjordheim and Mirror Lake ----
  try { const pier = await loadGLB(DIR + 'modular_wooden_pier.glb');
    const pierAt = (spot, level) => { const g = pier.scene.clone(true), yaw = Math.atan2(-spot.dx, -spot.dz); g.position.set(spot.x - spot.dx * 6, level + 0.35, spot.z - spot.dz * 6); /* the main deck sits about 0.7 m above the model's base */ g.rotation.y = yaw; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material.envMapIntensity = 0.5; } }); scene.add(g); return g; };
    { const hb = place('harbour'); if (hb) for (let k = 0; k < 6; k++) { const v = hb.r - 2 + k * 15, x = hb.x + hb.ux * -8 + hb.vx * v, z = hb.z + hb.uz * -8 + hb.vz * v; pierAt({ x: x + hb.vx * 9, z: z + hb.vz * 9, dx: hb.vx, dz: hb.vz }, sea.level); } }
    if (village?.quay) { pierAt(village.quay, sea.level); const q = village.quay; pierAt({ x: q.x + q.dz * 9, z: q.z - q.dx * 9, dx: q.dx, dz: q.dz }, sea.level); }
    const cab = place('cabin'); if (cab?.jetty) pierAt(cab.jetty, LAKE.level + 0.2);
  } catch (e) { console.warn('pier unavailable', e); }

  // ---- Brick warehouses on the harbour quay, assembled from the factory facade kit ----
  let factory = null;
  try { const hb = place('harbour'); if (hb?.sheds) { factory = await loadFactoryKit(); hb.sheds.forEach((s, k) => factory.building({ x: s.x, y: s.y - 0.05, z: s.z, yaw: s.yaw, bays: 13, depth: 7, floors: k === 1 ? 4 : 3, seed: k + 3 })); factory.build(scene, city.chunks); } }
  catch (e) { console.warn('warehouses unavailable', e); }

  // ---- Dutch ships riding at anchor: off the harbour and in the fjord ----
  try { const [large, medium, pinnace] = await Promise.all([loadGLB(DIR + 'dutch_ship_large_01.glb'), loadGLB(DIR + 'dutch_ship_medium.glb'), loadGLB(DIR + 'ship_pinnace.glb')]);
    const prep = g => { g.scene.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; const m = o.material; m.envMapIntensity = 0.6; if (/sail|rigging/i.test(m.name)) { m.alphaTest = 0.5; m.transparent = false; m.side = THREE.DoubleSide; } }); return g.scene; };
    const deep = (x, z) => sea.depthAt(x, z)[0] > 7;
    const anchor = (scn, x0, z0, yaw) => { let x = x0, z = z0; for (let k = 0; k < 40 && !deep(x, z); k++) { x -= 25; } const g = scn.clone(true); scene.add(g); out.ships.push({ g, x, z, yaw, ph: R() * 10 }); };
    const L = prep(large), M = prep(medium), Pn = prep(pinnace), hb = place('harbour');
    if (hb) { anchor(L, hb.x - 240, hb.z - 120, 0.4); const along = Math.atan2(-hb.vz, hb.vx), moor = (scn, u, v) => { const g = scn.clone(true); scene.add(g); out.ships.push({ g, x: hb.x + hb.ux * u + hb.vx * v, z: hb.z + hb.uz * u + hb.vz * v, yaw: along, ph: R() * 10, moored: true }); };
      moor(M, 4, hb.r + 48); moor(Pn, -21, hb.r + 66); }
    anchor(M, 150, 3470, Math.PI * 0.55); if (village?.quay) { const q = village.quay; anchor(Pn, q.x + q.dx * 70, q.z + q.dz * 70, Math.atan2(q.dz, q.dx) + Math.PI / 2); } anchor(L, -1700, 3540, Math.PI * 0.5); anchor(M, -900, -2200, -0.9);
  } catch (e) { console.warn('ships unavailable', e); }

  const w = {};
  out.update = t => { for (const sh of out.ships) { sea.heightAt(sh.x, sh.z, w); const swing = sh.moored ? Math.sin(t * 0.07 + sh.ph) * 0.015 : Math.sin(t * 0.05 + sh.ph) * 0.25; sh.g.position.set(sh.x, w.y + 0.1, sh.z); sh.g.rotation.set(Math.atan(w.gz) * 0.8, sh.yaw + swing, -Math.atan(w.gx) * 0.8, 'YXZ'); } };
  out.setTime = e => { for (const m of glass) m.emissiveIntensity = 2.6 * e.night; factory?.setNight(e.night); };
  return out;
}
