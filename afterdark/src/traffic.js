import { createMotorcade } from './vip.js';
import { beamTexture, lampColor } from './low-beams.js';
import { clearLampCover, lampRole } from './vehicle-lamps.js';
import { EMERGENCY } from './emergency-lights.js';
import { createIndicators, indicatorAnchors } from './indicators.js';
// Traffic: cars that keep to their lanes, obey the signals, queue behind each other and turn at junctions,
// plus parked cars along the kerbs. Every body style is drawn with instancing.
import { vehicleShadowMaterial } from './vehicle-shadow.js';
import * as THREE from '/evermile/vendor/three.module.js';
import { P, ROADS, HALF, SPAN, signal, rng } from './city.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';
import { CARS } from './career.js';
import { loadGLB } from './car.js';

const STYLES = ['sedan', 'hatch', 'suv', 'wagon', 'van', 'pickup'];
const TRANSIT = ['bus', 'coach'];
const trafficFiles = [...new Set([...STYLES, ...TRANSIT].map(style => 'road-' + style)
  .concat(CARS.map(car => car.file || 'sports-coupe')))];
const TINTS = [0xdadde2, 0x15171b, 0x8c9198, 0x2a3140, 0x7a1418, 0x1f3d6b, 0xb9b3a4, 0x3c4a3f, 0xc8a24a, 0x505560];
const dummy = new THREE.Object3D(), mat = new THREE.Matrix4(), col = new THREE.Color(), clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function rearPlate(style, i, bounds) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2a2d2e'; ctx.fillRect(0, 0, 128, 48);
  ctx.fillStyle = '#d8d8cd'; ctx.fillRect(3, 3, 122, 42);
  ctx.fillStyle = '#536763'; ctx.fillRect(3, 3, 122, 13);
  ctx.fillStyle = '#f0ead7'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('AURORA COAST', 64, 13);
  ctx.fillStyle = '#292d2e'; ctx.font = 'bold 24px monospace';
  ctx.fillText(style.slice(0, 2).toUpperCase() + ' ' + (284 + 109 * i), 64, 37);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(0.39, 0.145).rotateY(Math.PI);
  const height = style === 'pickup' || style === 'van' ? 0.58 : 0.53;
  const local = new THREE.Matrix4().makeTranslation(0, height, bounds.min.z - 0.013);
  return { geo, local, mat: new THREE.MeshStandardMaterial({ map, roughness: 0.5 }), paint: false, wheel: false, castShadow: false };
}

export async function createTraffic(scene, city, count, reach = 1, seed = 7) {
  count += 5; // Extra city slots keep the expanded garage represented alongside everyday traffic.
  const R = rng(seed), kits = [], headMaterials = [], drlMaterials = [], tailMaterials = [];
  // Phones and tablets (reach below 1) leave the 1982 Mercedes, by far the heaviest model in textures, out of traffic:
  // with it a phone's browser can run out of memory and close the tab. It is still in the garage.
  const files = reach < 1 ? trafficFiles.filter(f => f !== 'road-mercedes') : trafficFiles;
  for (const file of files) {
    const coupe = file === 'sports-coupe';
    const style = file.replace(/^(road|car)-/, '');
    const url = coupe ? '/evermile/assets/sports-coupe.glb' : '/evermile/assets/models/' + file + '.glb?v=supplied7';
    const g = await loadGLB(url);
    if (coupe) g.scene.rotation.y = Math.PI;
    g.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g.scene, true);
    const signalAnchors = indicatorAnchors(g.scene, style === 'escalade', box);
    const parts = [], emergency = [];
    g.scene.traverse(o => { if (!o.isMesh) return; let m = o.material; const name = m.name || '';
      // A police car's LED heads: kept for the convoy to light (emergency-lights.js). The glow shells only exist while
      // lit, so traffic never draws them; the lenses stay on the body, dark, like a patrol car's bar when it is off.
      if (EMERGENCY.test(name)) { emergency.push({ geo: o.geometry, local: o.matrixWorld.clone(), name, map: m.emissiveMap || null }); if (/^Emergency_Glow/i.test(name)) return; }
      const role = lampRole(o, style === 'escalade');
      const painted = /paint/i.test(name) || (coupe && o.name === 'body');
      if (painted) m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: m.map, metalness: 0.51, roughness: 0.28, clearcoat: 0.84, clearcoatRoughness: 0.11, envMapIntensity: 1.5 });
      else if (role === 'cover') m = clearLampCover(m);
      else if (role) {
        const rear = role === 'tail' || role === 'stop';
        m = m.clone(); m.emissive = new THREE.Color(rear ? 0xff190a : style === 'escalade' ? 0xf2f7ff : 0xffefdb);
        (rear ? tailMaterials : role === 'drl' ? drlMaterials : headMaterials).push(m);
        if (rear) m.onBeforeCompile = shader => {
          shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance *= vColor.r;\n#endif');
        };
      }
      else if (/glass/i.test(name)) m = new THREE.MeshPhysicalMaterial({ color: 0x152024, metalness: 0.46, roughness: 0.16, clearcoat: 0.8, envMapIntensity: 1.5 });
      else { m = m.clone(); m.envMapIntensity = 0.8; if (/^ELED_Light_Pipe/.test(name)) m.emissiveIntensity = 0.12; } // the Escalade's LED door handles: a faint courtesy glow
      let hub = o;
      while (hub && !/^Wheel_[FR][LR]$/i.test(hub.name)) hub = hub.parent;
      let geo = o.geometry, local = o.matrixWorld.clone();
      if (hub) {
        const centre = new THREE.Box3().setFromObject(hub, true).getCenter(new THREE.Vector3());
        geo = geo.clone().applyMatrix4(local).translate(-centre.x, -centre.y, -centre.z);
        local = new THREE.Matrix4().makeTranslation(centre.x, centre.y, centre.z);
      }
      parts.push({ geo, mat: m, local, wrapGlass: name === 'EXT_Glass' || (style === 'van' && /glass/i.test(name)), bodyPanel: name === 'BodyPaint', paint: painted, tail: role === 'tail' || role === 'stop', stopOnly: role === 'stop', wheel: Boolean(hub), frontWheel: !!hub && /^Wheel_F/i.test(hub.name) }); });
    // Batch the many identical seat materials once for each transit model.
    if (TRANSIT.includes(style)) {
      const batches = new Map();
      for (const part of parts.filter(p => !p.wheel && !p.paint)) {
        const key = part.mat.name;
        if (!batches.has(key)) batches.set(key, []);
        batches.get(key).push(part);
      }
      for (const batch of batches.values()) {
        if (batch.length < 2) continue;
        const merged = mergeGeometries(batch.map(p => p.geo.clone().applyMatrix4(p.local)));
        if (!merged) continue;
        for (const part of batch) parts.splice(parts.indexOf(part), 1);
        parts.push({ ...batch[0], geo: merged, local: new THREE.Matrix4() });
      }
    }

    parts.push(rearPlate(style, kits.length, box));
    kits.push({ style, parts, emergency, signalAnchors, height: box.max.y, width: box.max.x - box.min.x, len: box.max.z - box.min.z });
  }
  // Draw from shuffled decks so short runs of spawns include the whole roster.
  function fleetDeck(pool) {
    let remaining = [];
    return () => {
      if (!remaining.length) remaining = pool.slice();
      return remaining.splice(Math.floor(R() * remaining.length), 1)[0];
    };
  }
  const fleet = kits.map((_, i) => i), patrol = fleet.filter(i => /^police-/.test(kits[i].style)), civil = fleet.filter(i => !patrol.includes(i));
  // Police cars are on patrol, one car in fourteen, and never parked at the kerb.
  const withPatrols = deck => { const cop = fleetDeck(patrol); let n = 0; return () => ++n % 14 === 0 && patrol.length ? cop() : deck(); };
  const parkedKit = fleetDeck(civil.filter(i => kits[i].len <= 6.2 && !TRANSIT.includes(kits[i].style)));
  const cityKit = withPatrols(fleetDeck(civil)), countryKit = withPatrols(fleetDeck(civil));
  // ---- Parked cars ----
  const parked = [];
  for (let r = 0; r < ROADS; r++) for (let s = 24; s < SPAN - 20; s += 6.4) { if (Math.abs(s - Math.round(s / P) * P) < 25) continue;
    for (const side of [-1, 1]) for (const ax of [0, 1]) { if (R() > 0.2) continue; const lat = r * P + side * (HALF - 1.25), j = (R() - 0.5) * 0.25;
      parked.push({ x: ax ? lat + j : s, z: ax ? s : lat + j, h: ax ? (side < 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2), kit: parkedKit(), tint: TINTS[Math.floor(R() * TINTS.length)] }); } }
  // ---- Moving cars ----
  const cars = [];
  for (let k = 0, tries = 0; k < count && tries < count * 40; tries++) { const ax = R() < 0.5 ? 0 : 1, dir = R() < 0.5 ? 1 : -1, road = Math.floor(R() * ROADS), seg = Math.floor(R() * (ROADS - 1)), lane = R() < 0.5 ? 0 : 1, s = seg * P + 24 + R() * (P - 48);
    if (cars.some(o => o.ax === ax && o.dir === dir && o.road === road && o.lane === lane && Math.abs(o.s - s) < 16)) continue;
    cars.push({ id: k, ax, dir, road, lane, s, v: 8, vmax: 10.5 + R() * 5.5, kit: -1, tint: TINTS[Math.floor(R() * TINTS.length)], mode: 0, turn: null, plan: null, x: 0, z: 0, h: 0, push: new THREE.Vector2(), stun: 0, near: false, wait: 0, go: 0 }); k++; }
  // Cars out on the coastal and mountain roads: they follow the road line, slow for bends and hills, and are
  // moved elsewhere on the road when they reach a city gate.
  const world = city.world, country = world ? Math.round(count * 0.45) : 0;
  // Half the country traffic keeps to the valley roads; the rest is spread over the frontier.
  const valley = world ? world.roads.filter(r => !r.frontier) : [], frontier = world ? world.roads.filter(r => r.frontier) : [], pickRoad = () => { const pool = frontier.length && R() < 0.5 ? frontier : valley; return pool[Math.floor(R() * pool.length)]; };
  const putOn = (c, avoid) => { for (let n = 0; n < 30; n++) { const rd = pickRoad(), i = rd.from + 12 + R() * (rd.to - rd.from - 24), s = world.samples[Math.round(i)]; if (s.tunnel && n < 20) continue; if (avoid && Math.hypot(s.x - avoid.x, s.z - avoid.z) < 380 && n < 25) continue; if (cars.some(o => o.mode === 2 && o !== c && o.rd === rd && o.dirS === c.dirS && Math.abs(o.i - i) < 12)) continue; c.rd = rd; c.i = i; return; } };
  const cityCarCount = cars.length;
  for (let k = 0; k < country; k++) { const c = { id: cars.length, mode: 2, dirS: R() < 0.5 ? 1 : -1, rd: null, i: 0, v: 14, vmax: 15 + R() * 8, kit: countryKit(), tint: TINTS[Math.floor(R() * TINTS.length)], x: 0, z: 0, h: 0, y: 0, pitch: 0, push: new THREE.Vector2(), stun: 0, wait: 0, go: 0, spin: 0 }; putOn(c, null); cars.push(c); }
  const placeOnRoad = c => { const i0 = Math.floor(c.i), a = world.samples[i0], b = world.samples[Math.min(c.rd.to, i0 + 1)], u = c.i - i0, sg = -c.dirS * 2.6; c.x = a.x + (b.x - a.x) * u + a.lx * sg; c.z = a.z + (b.z - a.z) * u + a.lz * sg; c.y = a.y + (b.y - a.y) * u + 0.03; c.h = Math.atan2(a.tx * c.dirS, a.tz * c.dirS); c.pitch = Math.atan2((b.y - a.y) * c.dirS, 3); };
  for (const c of cars) if (c.mode === 2) placeOnRoad(c);
  const laneOff = c => 1.9 + c.lane * 3.6;
  const headingOf = (ax, dir) => ax ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  const posOf = (ax, dir, road, off, s, out) => { if (ax) { out.x = road * P - dir * off; out.z = s; } else { out.x = s; out.z = road * P + dir * off; } return out; };
  function place(c) { posOf(c.ax, c.dir, c.road, laneOff(c), c.s, c); c.h = headingOf(c.ax, c.dir); }
  cars.forEach(c => { if (c.mode !== 2) place(c); });
  function stageDriveBy(c, shop, playerPos) {
    const ax = Math.abs(shop.nx), dir = ax ? shop.nx : -shop.nz;
    const road = Math.round((ax ? shop.x : shop.z) / P);
    const along = ax ? shop.z : shop.x;
    for (const gap of [7, 13, 2, 18]) for (const lane of [1, 0]) {
      const s = along - gap * dir;
      const pos = posOf(ax, dir, road, 1.9 + lane * 3.6, s, {});
      if (Math.hypot(pos.x - playerPos.x, pos.z - playerPos.z) < 6 ||
          cars.some(o => o !== c && Math.hypot(o.x - pos.x, o.z - pos.z) < 6)) continue;
      Object.assign(c, { ax, dir, road, lane, s, v: 3.5, mode: 0, plan: null, turn: null, slide: 0, stun: 0, go: 0, wait: 0 });
      c.push.set(0, 0); place(c); return;
    }
  }

  // Deal each full set outwards from the starting neighbourhood, then across town.
  const distanceFromStart = c => Math.abs(c.x - city.spawn.x) + Math.abs(c.z - city.spawn.z);
  cars.slice(0, cityCarCount).sort((a, b) => distanceFromStart(a) - distanceFromStart(b))
    .forEach(c => { c.kit = cityKit(); });

  // ---- Instanced meshes: moving cars take the first slots, nearby parked cars fill the rest ----
  const PARK_MAX = 12, DRAW_R = 270 * Math.max(0.6, reach); // cars further than this from the player are simulated but not drawn
  const van = kits.find(k => k.style === 'van');
  kits.push({ ...van, style:'vip-van', parts:van.parts.map(p => {
    if (!p.paint) return p;
    const paint = p.mat.clone(); paint.map = null;
    return { ...p, mat:paint };
  }) });
  const vip = createMotorcade(scene, kits, cars, parked, city.world);
  const blinkers = createIndicators(scene); let night = 0;
  const groups = kits.map((kit, ki) => { const nM = cars.filter(c => c.kit === ki).length + vip.cars.filter(c => c.kit === ki).length;
    return kit.parts.map(part => { const im = new THREE.InstancedMesh(part.geo, part.mat, nM + PARK_MAX); im.frustumCulled = false; im.userData.part = part; im.userData.nM = nM; im.count = 0; im.castShadow = part.castShadow !== false; im.receiveShadow = true; scene.add(im); return im; }); });
  kits.forEach((kit, ki) => { let m = 0; for (const c of cars) { if (c.kit !== ki) continue; c.slot = m++; }
    for (const im of groups[ki]) if (im.userData.part.paint) { for (let k = 0; k < im.instanceMatrix.count; k++) im.setColorAt(k, col.set(0xffffff)); for (const c of cars) if (c.kit === ki) im.setColorAt(c.slot, col.set(c.tint)); im.instanceColor.needsUpdate = true; } });
  const byKit = kits.map((_, ki) => parked.filter(p => p.kit === ki)); let parkTick = 0; const nearParked = [];
  const parkedNear = [];
  function refreshParked(px, pz) {
    nearParked.length = 0;
    kits.forEach((kit, ki) => { const near = []; for (const p of byKit[ki]) { const d = (p.x - px) ** 2 + (p.z - pz) ** 2; if (d < 150 * 150) near.push([d, p]); }
      near.sort((a, b) => a[0] - b[0]); near.length = Math.min(near.length, PARK_MAX); parkedNear[ki] = near.map(n => n[1]); nearParked.push(...parkedNear[ki]); });
  }

  const n = cars.length + vip.cars.length;
  const poolG = new THREE.PlaneGeometry(1, 1); poolG.rotateX(-Math.PI / 2);
  const vertices = poolG.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const distance = vertices.getZ(i) + .5;
    vertices.setXYZ(i, vertices.getX(i) * 12, .035, distance * 27);
  }
  const beamOffset = new THREE.Matrix4();
  const pools = new THREE.InstancedMesh(poolG, new THREE.MeshBasicMaterial({ map: beamTexture(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), n * 2); pools.frustumCulled = false; pools.renderOrder = 4; scene.add(pools);
  // A soft contact shadow under every car, moving or parked, so none of them float.
  const blobG = new THREE.PlaneGeometry(1.6, 1.32); blobG.rotateX(-Math.PI / 2); blobG.translate(0, 0.028, 0);
  const blobs = new THREE.InstancedMesh(blobG, vehicleShadowMaterial(), n + PARK_MAX * kits.length); blobs.frustumCulled = false; blobs.renderOrder = 3; scene.add(blobs);
  function setTime(e) {
    vip.wet = e.wet; vip.night = e.night; night = e.night;
    const beam = Math.max(e.night, .55 * e.rain);
    pools.visible = beam > .05; pools.material.opacity = .23 * beam;
    blobs.material.opacity = 0.97 - 0.12 * e.night;
    for (const mat of drlMaterials) mat.emissiveIntensity = 1.9 - .85 * beam;
    for (const mat of headMaterials) mat.emissiveIntensity = .18 + 2.1 * beam;
    for (const mat of tailMaterials) mat.emissiveIntensity = .4 + .6 * beam;
  }

  const tmp = { x: 0, z: 0 }, spinM = new THREE.Matrix4(), chassis = new THREE.Matrix4(), lean = new THREE.Matrix4(), steerWheel = new THREE.Matrix4();
  function planFor(c, k, featured) { // choose what to do at junction k (index along the car's travel axis)
    const straight = k + c.dir >= 0 && k + c.dir <= ROADS - 1;
    const rDir = c.ax ? -c.dir : c.dir, lDir = c.ax ? c.dir : -c.dir;
    const ok = d => c.road + d >= 0 && c.road + d <= ROADS - 1;
    let kind = 's'; const r = R();
    if (c.lane === 1 && ok(rDir) && (r < 0.34 || !straight)) kind = 'r'; else if (c.lane === 0 && ok(lDir) && (!straight || (featured && r < .55))) kind = 'l';
    else if (!straight) kind = ok(rDir) ? 'r' : 'l';
    return { k, kind, dir: kind === 'r' ? rDir : lDir };
  }
  function update(dt, t, player, focus, drawOnly = false, recorded = false) {
    if (vip.root.visible) vip.step(dt,vip.wet);
    if (focus && (parkTick++ % 40) === 0) refreshParked(focus.x, focus.z);
    for (const c of drawOnly ? [] : cars) {
      const nearbyConvoy=vip.root.visible && vip.cars.some(v=>Math.abs(v.x-c.x)+Math.abs(v.z-c.z)<35);
      const before=nearbyConvoy ? {...c,turn:c.turn && {...c.turn}} : null;
      const fx = Math.sin(c.h), fz = Math.cos(c.h); const featured = c === focus;
      let target = featured ? 19 + 4 * Math.sin(t * .17) : c.vmax; c.near = false;
      const yielding = vip.root.visible && c.mode !== 2 && vip.cars.some(v => {
        const dx=c.x-v.x, dz=c.z-v.z, ahead=dx*Math.sin(v.h)+dz*Math.cos(v.h);
        return ahead > -12 && ahead < 55 && Math.abs(dx*Math.cos(v.h)-dz*Math.sin(v.h)) < 7;
      });
      c.shoulder = (c.shoulder || 0) + ((yielding ? Math.max(0, 8.1-laneOff(c)) : 0) - (c.shoulder || 0)) * (1-Math.exp(-2.8*dt));
      if (yielding) target = Math.min(target, 1.4);
      if (c.stun > 0) { c.stun -= dt; target = 0; }
      // Anything ahead in my path?
      const look = 7 + c.v * 1.3;
      let blocker = null;
      const test = (ox, oz, half, o) => { const rx = ox - c.x, rz = oz - c.z, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx); if (ahead > -0.5 && ahead < look + half && side < 1.9) {
          if (o && ahead < 1.2 && o.id > c.id) return; // nose to nose or overlapping: the lower number moves off first
          if (o && c.go > 0 && Math.abs(Math.sin(o.h - c.h)) > 0.5) return; // breaking a junction stand-off
          const tg = Math.max(0, (ahead - half - kits[c.kit].len * 0.5 - 2.2) * 1.1); if (tg < target) { target = tg; blocker = o || null; } } };
      for (const o of cars) if (o !== c && Math.abs(o.x - c.x) + Math.abs(o.z - c.z) < 40) test(o.x, o.z, kits[o.kit].len * 0.5, o);
      if (player) test(player.pos.x, player.pos.z, 2.3, null);
      // Two cars waiting on each other at a junction: after a few seconds the lower number goes.
      if (c.go > 0) c.go -= dt; if (target === 0 && c.v < 0.1 && blocker && blocker.v < 0.1) { c.wait += dt; if (c.wait > 3.5 && blocker.id > c.id) { c.go = 2.5; c.wait = 0; } } else c.wait = 0;
      const cornerSpeed = featured ? 9 : 6.2;
      if (c.mode === 1) target = Math.min(target, cornerSpeed);
      if (c.mode === 2) { const j = Math.round(c.i), a = world.samples[j], b = world.samples[Math.max(c.rd.from, Math.min(c.rd.to, j + c.dirS * 9))], ang = Math.acos(Math.max(-1, Math.min(1, a.tx * b.tx + a.tz * b.tz))); if (ang > 0.02) target = Math.min(target, Math.max(7, Math.sqrt(6.5 * 27 / ang))); }
      if (c.mode === 0) {
        const k = c.dir > 0 ? Math.ceil((c.s + HALF - 1.2) / P) : Math.floor((c.s - HALF + 1.2) / P); // the junction ahead, held until just past its entry line
        if (k >= 0 && k <= ROADS - 1) {
          if (!c.plan || c.plan.k !== k) c.plan = planFor(c, k, featured);
          const stop = k * P - c.dir * (15.4 + kits[c.kit].len * 0.5), dist = c.dir * (stop - c.s);
          const i = c.ax ? c.road : k, j = c.ax ? k : c.road, st = signal(i, j, c.ax ? 'z' : 'x', t);
          if (dist > -1 && (st === 'r' || (st === 'y' && dist > 9)) && dist < c.v * c.v / 7 + 8) target = Math.min(target, Math.sqrt(Math.max(0, 2 * 3.6 * (dist - 0.6))));
          if (c.plan.kind !== 's' && dist < 14) target = Math.min(target, featured ? cornerSpeed : 6.5);
          c.signal = c.plan.kind !== 's' && dist < 48 ? c.plan.kind : null; // indicate well before the junction, and through the turn
          const entry = k * P - c.dir * HALF;
          if (c.dir * (c.s - entry) >= 0 && c.plan.kind !== 's') {
            const nAx = c.ax ? 0 : 1, nDir = c.plan.dir, nRoad = k, nLane = c.plan.kind === 'r' ? 1 : 0, off = 1.9 + nLane * 3.6, nS = c.road * P + nDir * HALF;
            const p0 = { x: c.x, z: c.z }, p2 = posOf(nAx, nDir, nRoad, off, nS, {}), p1 = c.ax ? { x: p0.x, z: p2.z } : { x: p2.x, z: p0.z };
            c.turn = { p0, p1, p2, u: 0, len: (Math.hypot(p1.x - p0.x, p1.z - p0.z) + Math.hypot(p2.x - p1.x, p2.z - p1.z)) * 0.82, next: { ax: nAx, dir: nDir, road: nRoad, lane: nLane, s: nS } }; c.mode = 1;
          }
        } else if (c.dir * (c.s - (c.dir > 0 ? SPAN : 0)) > 0) { c.dir = -c.dir; }
      }
      if (featured) c.throttle = target <= .1 || target < c.v - .2 ? 0 : clamp(.22 + (target - c.v) * .16, .16, .82);
      const lastSpeed = c.v, lastHeading = c.h;
      c.slide = 0;
      c.v += clamp(target - c.v, -(target === 0 && c.v > 6 ? 16 : 9) * dt, (featured ? 4 : 2.6) * dt); if (c.v < 0.05 && target === 0) c.v = 0;
      c.braking = target < c.v - 0.4; c.spin = (c.spin || 0) + c.v * dt / 0.33;
      if (c.mode === 2) { c.i += c.dirS * c.v * dt / 3; if (c.i >= c.rd.to - 5 || c.i <= c.rd.from + 5) { c.dirS = R() < 0.5 ? 1 : -1; putOn(c, focus); c.v = c.vmax * 0.8; } placeOnRoad(c); }
      else if (c.mode === 0) { c.s += c.dir * c.v * dt; place(c); }
      else { const tr = c.turn; const tangentLength = featured ? 2 * Math.hypot(
        (1 - tr.u) * (tr.p1.x - tr.p0.x) + tr.u * (tr.p2.x - tr.p1.x),
        (1 - tr.u) * (tr.p1.z - tr.p0.z) + tr.u * (tr.p2.z - tr.p1.z)) : tr.len;
        tr.u = Math.min(1, tr.u + (featured ? c.v : Math.max(c.v, 1.2)) * dt / Math.max(1, tangentLength)); const u = tr.u, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
        c.x = a * tr.p0.x + b * tr.p1.x + d * tr.p2.x; c.z = a * tr.p0.z + b * tr.p1.z + d * tr.p2.z;
        const tx = 2 * (1 - u) * (tr.p1.x - tr.p0.x) + 2 * u * (tr.p2.x - tr.p1.x), tz = 2 * (1 - u) * (tr.p1.z - tr.p0.z) + 2 * u * (tr.p2.z - tr.p1.z); c.h = Math.atan2(tx, tz);
        if (featured) {
          const cross = (tr.p1.z - tr.p0.z) * (tr.p2.x - tr.p1.x) - (tr.p1.x - tr.p0.x) * (tr.p2.z - tr.p1.z);
          c.slide = Math.sign(cross) * Math.sin(Math.PI * u) ** 2 * clamp((c.v - 5) * .115, 0, .46);
          const outward = -c.slide * 2.2;
          c.x += Math.cos(c.h) * outward;
          c.z -= Math.sin(c.h) * outward;
        }
        if (u >= 1) { Object.assign(c, tr.next); c.mode = 0; c.turn = null; c.plan = null; c.signal = null; place(c); } }
      if(before && vip.blocksTraffic(c)) {
        Object.assign(c,before,{v:0,braking:true});
      }
      const response = 1 - Math.exp(-5 * dt);
      const accel = (c.v - lastSpeed) / Math.max(.001, dt);
      const yawRate = Math.atan2(Math.sin(c.h - lastHeading), Math.cos(c.h - lastHeading)) / Math.max(.001, dt);
      c.bodyPitch = (c.bodyPitch || 0) + ((featured ? clamp(-accel * .010, -.055, .07) : 0) - (c.bodyPitch || 0)) * response;
      c.lean = (c.lean || 0) + ((featured ? clamp(yawRate * c.v * .006, -.055, .055) : 0) - (c.lean || 0)) * response;
      c.wheelAngle = featured ? clamp(Math.atan2(yawRate * 2.85, Math.max(c.v, 1)) - c.slide, -.55, .55) : 0;
      c.push.multiplyScalar(Math.exp(-2.2 * dt));
    }
    // Write instance transforms and lamp positions. Only cars near the focus are drawn; each body style packs its
    // visible moving cars into the first slots, with the nearby parked cars after them.
    const fx0 = focus ? focus.x : 0, fz0 = focus ? focus.z : 0, used = kits.map(() => 0); let shown = 0;
    const moving = vip.root.visible ? cars.concat(vip.cars) : cars;
    blinkers.begin(t, night);
    moving.forEach((c, k) => { const kit = kits[c.kit]; dummy.position.set(c.x - Math.cos(c.h)*(c.shoulder || 0) + (recorded ? 0 : c.push.x), c.y || 0, c.z + Math.sin(c.h)*(c.shoulder || 0) + (recorded ? 0 : c.push.y)); dummy.rotation.set(-(c.pitch || 0), c.h + (c.slide || 0), c.roll || 0, 'YXZ'); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); spinM.makeRotationX(c.spin || 0);
      const nearMe = !focus || Math.abs(c.x - fx0) + Math.abs(c.z - fz0) < DRAW_R * 1.3;
      if (nearMe) { const slot = used[c.kit]++; chassis.copy(dummy.matrix).multiply(lean.makeRotationX(c.bodyPitch || 0)).multiply(lean.makeRotationZ(c.lean || 0));
        if (c.signal) blinkers.add(chassis, kit.signalAnchors, kit.width, c.signal, (c.id ?? c.index) * 0.237);
        steerWheel.makeRotationY(c.wheelAngle || 0);
        for (const im of groups[c.kit]) { const part = im.userData.part;
          mat.multiplyMatrices(part.wheel ? dummy.matrix : chassis, part.local);
          if (part.frontWheel) mat.multiply(steerWheel);
          if (part.wheel) mat.multiply(spinM); im.setMatrixAt(slot, mat); if (im.userData.part.tail) im.setColorAt(slot, col.setScalar(c.braking || c.v < .5 ? 3.8 : im.userData.part.stopOnly ? 0 : .52)); if (im.userData.part.paint && c.shownSlot !== slot) im.setColorAt(slot, col.set(c.tint)); } c.shownSlot = slot;
        for (let side = 0; side < 2; side++) {
          beamOffset.makeTranslation((side ? 1 : -1) * kit.width * .36, 0, kit.len * .47);
          pools.setColorAt(shown * 2 + side, col.setHex(lampColor(kit.style)));
          pools.setMatrixAt(shown * 2 + side, mat.multiplyMatrices(dummy.matrix, beamOffset));
        }
        mat.makeScale(kit.width, 1, kit.len).premultiply(dummy.matrix);
        blobs.setMatrixAt(shown, mat);
        shown++; } else c.shownSlot = -1; });
    pools.count = shown * 2; dummy.rotation.order = 'XYZ'; blinkers.end();
    kits.forEach((kit, ki) => { const g = groups[ki], list = parkedNear[ki] || []; list.forEach((p, k) => { dummy.position.set(p.x, 0, p.z); dummy.rotation.set(0, p.h, 0); dummy.updateMatrix(); for (const im of g) { mat.multiplyMatrices(dummy.matrix, im.userData.part.local); im.setMatrixAt(used[ki] + k, mat); if (im.userData.part.tail) im.setColorAt(used[ki] + k, col.setScalar(im.userData.part.stopOnly ? 0 : .08)); if (im.userData.part.paint) im.setColorAt(used[ki] + k, col.set(p.tint)); } });
      for (const im of g) { im.count = used[ki] + list.length; if (im.instanceColor) im.instanceColor.needsUpdate = true; } });
    nearParked.forEach((p, k) => { dummy.position.set(p.x, 0, p.z); dummy.rotation.set(0, p.h, 0); dummy.updateMatrix(); const kit = kits[p.kit]; mat.makeScale(kit.width, 1, kit.len).premultiply(dummy.matrix); blobs.setMatrixAt(shown + k, mat); }); blobs.count = shown + nearParked.length;
    for (const g of groups) for (const im of g) im.instanceMatrix.needsUpdate = true;
    pools.instanceMatrix.needsUpdate = true; if (pools.instanceColor) pools.instanceColor.needsUpdate = true; blobs.instanceMatrix.needsUpdate = true;
  }
  // Player against traffic and parked cars: push apart, return the closing speed of the worst contact.
  let struck = 0; // the hardest the player has rammed a moving car since last asked
  function collide(player) {
    let worst = 0; const px = player.pos.x, pz = player.pos.z, pfx = Math.sin(player.heading), pfz = Math.cos(player.heading);
    const hitOne = (ox, oz, oh, o) => { const half = o ? Math.max(1.2, kits[o.kit].len * 0.5 - 0.95) : 1.2;
      if (Math.hypot(ox - px, oz - pz) > half + 4) return;
      const ofx = Math.sin(oh), ofz = Math.cos(oh);
      for (const a of [-1.15, 1.15]) { const b = clamp((px + pfx * a - ox) * ofx + (pz + pfz * a - oz) * ofz, -half, half); const ax = px + pfx * a, az = pz + pfz * a, bx = ox + ofx * b, bz = oz + ofz * b; let dx = ax - bx, dz = az - bz; const d = Math.hypot(dx, dz);
        if (d < 1.95 && d > 1e-3) { dx /= d; dz /= d; const pen = 1.95 - d; player.pos.x += dx * pen; player.pos.z += dz * pen; const ovx = o ? ofx * o.v : 0, ovz = o ? ofz * o.v : 0;
          const vn = (player.vel.x - ovx) * dx + (player.vel.z - ovz) * dz; if (vn < 0) { player.vel.x -= dx * vn * 1.25; player.vel.z -= dz * vn * 1.25; player.vel.multiplyScalar(0.9); worst = Math.max(worst, -vn); if (o) { struck = Math.max(struck, -vn); o.push.x -= dx * Math.min(1.2, -vn * 0.12); o.push.y -= dz * Math.min(1.2, -vn * 0.12); o.v *= 0.4; o.stun = 1.4; } } } } };
    for (const c of cars) if (Math.abs((c.y || 0) - (player.groundY || 0)) < 2.5) hitOne(c.x + c.push.x, c.z + c.push.y, c.h, c);
    for (const p of nearParked) hitOne(p.x, p.z, p.h, null);
    return worst;
  }
  // Close pass at speed without contact.
  function nearMiss(player) { let got = 0; if (Math.abs(player.speed) < 17) return 0; for (const c of cars) { const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z); if (d < 3.6) { if (!c.near2) { c.near2 = true; got++; } } else if (d > 9) c.near2 = false; } return got; }
  return { vip, kits, stageDriveBy, modelFiles: files, cars, parked, update, collide, nearMiss, setTime, takeStruck() { const s = struck; struck = 0; return s; } };
}
