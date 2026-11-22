// Traffic: cars that keep to their lanes, obey the signals, queue behind each other and turn at junctions,
// plus parked cars along the kerbs. Every body style is drawn with instancing.
import * as THREE from '/evermile/vendor/three.module.js';
import { P, ROADS, HALF, SPAN, signal, rng } from './city.js';
import { loadGLB } from './car.js';

const STYLES = ['sedan', 'hatch', 'suv', 'wagon', 'van', 'pickup'];
const TINTS = [0xdadde2, 0x15171b, 0x8c9198, 0x2a3140, 0x7a1418, 0x1f3d6b, 0xb9b3a4, 0x3c4a3f, 0xc8a24a, 0x505560];
const dummy = new THREE.Object3D(), mat = new THREE.Matrix4(), col = new THREE.Color(), clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export async function createTraffic(scene, city, count, seed = 7) {
  const R = rng(seed), kits = [];
  for (const style of STYLES) {
    const g = await loadGLB(`/evermile/assets/models/road-${style}.glb?v=supplied7`); g.scene.updateMatrixWorld(true);
    const parts = []; const lamp = n => { const o = g.scene.getObjectByName(n); return o ? o.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0.6, 0.65, n[0] === 'H' ? 2 : -2); };
    g.scene.traverse(o => { if (!o.isMesh) return; let m = o.material; const name = m.name || '';
      if (/paint/i.test(name)) m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5 });
      else if (/glass/i.test(name)) m = new THREE.MeshPhysicalMaterial({ color: 0x06080b, metalness: 0.7, roughness: 0.05, envMapIntensity: 1.8 });
      else if (/HeadLens/i.test(name)) { m = m.clone(); m.emissive = new THREE.Color(0xfff2da); m.emissiveIntensity = 3; m.emissiveMap = null; }
      else if (/TailLens/i.test(name)) { m = m.clone(); m.emissive = new THREE.Color(0xff1a0c); m.emissiveIntensity = 2.2; m.emissiveMap = null; }
      else { m = m.clone(); m.envMapIntensity = 0.8; }
      parts.push({ geo: o.geometry, mat: m, local: o.matrixWorld.clone(), paint: /paint/i.test(name) }); });
    const box = new THREE.Box3().setFromObject(g.scene);
    kits.push({ style, parts, head: [lamp('HeadL'), lamp('HeadR')], tail: [lamp('TailL'), lamp('TailR')], len: box.max.z - box.min.z });
  }
  // ---- Parked cars ----
  const parked = [];
  for (let r = 0; r < ROADS; r++) for (let s = 24; s < SPAN - 20; s += 6.4) { if (Math.abs(s - Math.round(s / P) * P) < 25) continue;
    for (const side of [-1, 1]) for (const ax of [0, 1]) { if (R() > 0.2) continue; const lat = r * P + side * (HALF - 1.25), j = (R() - 0.5) * 0.25;
      parked.push({ x: ax ? lat + j : s, z: ax ? s : lat + j, h: ax ? (side < 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2), kit: Math.floor(R() * kits.length), tint: TINTS[Math.floor(R() * TINTS.length)] }); } }
  // ---- Moving cars ----
  const cars = [];
  for (let k = 0; k < count; k++) { const ax = R() < 0.5 ? 0 : 1, dir = R() < 0.5 ? 1 : -1, road = Math.floor(R() * ROADS), seg = Math.floor(R() * (ROADS - 1));
    cars.push({ ax, dir, road, lane: R() < 0.5 ? 0 : 1, s: seg * P + 22 + R() * (P - 44), v: 8, vmax: 10.5 + R() * 5.5, kit: Math.floor(R() * kits.length), tint: TINTS[Math.floor(R() * TINTS.length)], mode: 0, turn: null, plan: null, x: 0, z: 0, h: 0, push: new THREE.Vector2(), stun: 0, near: false }); }
  const laneOff = c => 1.9 + c.lane * 3.6;
  const headingOf = (ax, dir) => ax ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  const posOf = (ax, dir, road, off, s, out) => { if (ax) { out.x = road * P - dir * off; out.z = s; } else { out.x = s; out.z = road * P + dir * off; } return out; };
  function place(c) { posOf(c.ax, c.dir, c.road, laneOff(c), c.s, c); c.h = headingOf(c.ax, c.dir); }
  cars.forEach(place);

  // ---- Instanced meshes: moving cars take the first slots, nearby parked cars fill the rest ----
  const PARK_MAX = 26;
  const groups = kits.map((kit, ki) => { const nM = cars.filter(c => c.kit === ki).length;
    return kit.parts.map(part => { const im = new THREE.InstancedMesh(part.geo, part.mat, nM + PARK_MAX); im.frustumCulled = false; im.userData.part = part; im.userData.nM = nM; im.count = nM; scene.add(im); return im; }); });
  kits.forEach((kit, ki) => { let m = 0; for (const c of cars) { if (c.kit !== ki) continue; c.slot = m++; }
    for (const im of groups[ki]) if (im.userData.part.paint) { for (let k = 0; k < im.instanceMatrix.count; k++) im.setColorAt(k, col.set(0xffffff)); for (const c of cars) if (c.kit === ki) im.setColorAt(c.slot, col.set(c.tint)); im.instanceColor.needsUpdate = true; } });
  const byKit = kits.map((_, ki) => parked.filter(p => p.kit === ki)); let parkTick = 0; const nearParked = [];
  function refreshParked(px, pz) {
    nearParked.length = 0;
    kits.forEach((kit, ki) => { const near = []; for (const p of byKit[ki]) { const d = (p.x - px) ** 2 + (p.z - pz) ** 2; if (d < 190 * 190) near.push([d, p]); }
      near.sort((a, b) => a[0] - b[0]); near.length = Math.min(near.length, PARK_MAX);
      const g = groups[ki], nM = g[0].userData.nM;
      near.forEach(([, p], k) => { nearParked.push(p); dummy.position.set(p.x, 0, p.z); dummy.rotation.set(0, p.h, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        for (const im of g) { mat.multiplyMatrices(dummy.matrix, im.userData.part.local); im.setMatrixAt(nM + k, mat); if (im.userData.part.paint) im.setColorAt(nM + k, col.set(p.tint)); } });
      for (const im of g) { im.count = nM + near.length; if (im.instanceColor) im.instanceColor.needsUpdate = true; } });
  }

  // ---- Lamps as glowing points, and the light they spill on the road ----
  const n = cars.length, lp = new Float32Array(n * 12), lc = new Float32Array(n * 12);
  for (let k = 0; k < n; k++) { lc.set([2.2, 2.0, 1.7, 2.2, 2.0, 1.7, 1.6, 0.08, 0.05, 1.6, 0.08, 0.05], k * 12); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const pts = new THREE.Points(lg, new THREE.PointsMaterial({ size: 1.25, map: city.dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; scene.add(pts);
  const poolG = new THREE.PlaneGeometry(7, 16); poolG.rotateX(-Math.PI / 2); poolG.translate(0, 0, 9.5);
  const pools = new THREE.InstancedMesh(poolG, new THREE.MeshBasicMaterial({ map: city.pool, color: new THREE.Color(0.75, 0.7, 0.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), n); pools.frustumCulled = false; pools.renderOrder = 4; scene.add(pools);

  const tmp = { x: 0, z: 0 }, v3 = new THREE.Vector3();
  function planFor(c, k) { // choose what to do at junction k (index along the car's travel axis)
    const straight = k + c.dir >= 0 && k + c.dir <= ROADS - 1;
    const rDir = c.ax ? -c.dir : c.dir, lDir = c.ax ? c.dir : -c.dir;
    const ok = d => c.road + d >= 0 && c.road + d <= ROADS - 1;
    let kind = 's'; const r = R();
    if (c.lane === 1 && ok(rDir) && (r < 0.34 || !straight)) kind = 'r'; else if (c.lane === 0 && ok(lDir) && (r < 0.1 || !straight)) kind = 'l';
    else if (!straight) kind = ok(rDir) ? 'r' : 'l';
    return { k, kind, dir: kind === 'r' ? rDir : lDir };
  }
  function update(dt, t, player, focus) {
    if (focus && (parkTick++ % 40) === 0) refreshParked(focus.x, focus.z);
    for (const c of cars) {
      const fx = Math.sin(c.h), fz = Math.cos(c.h); let target = c.vmax; c.near = false;
      if (c.stun > 0) { c.stun -= dt; target = 0; }
      // Anything ahead in my path?
      const look = 7 + c.v * 1.3;
      const test = (ox, oz, half) => { const rx = ox - c.x, rz = oz - c.z, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx); if (ahead > 0.5 && ahead < look + half && side < 1.75) target = Math.min(target, Math.max(0, (ahead - half - 4.2) * 1.1)); };
      for (const o of cars) if (o !== c && Math.abs(o.x - c.x) + Math.abs(o.z - c.z) < 40) test(o.x, o.z, 2.2);
      if (player) test(player.pos.x, player.pos.z, 2.3);
      if (c.mode === 0) {
        const k = c.dir > 0 ? Math.ceil((c.s + HALF) / P - 1e-6) : Math.floor((c.s - HALF) / P + 1e-6);
        if (k >= 0 && k <= ROADS - 1) {
          if (!c.plan || c.plan.k !== k) c.plan = planFor(c, k);
          const stop = k * P - c.dir * 17.6, dist = c.dir * (stop - c.s);
          const i = c.ax ? c.road : k, j = c.ax ? k : c.road, st = signal(i, j, c.ax ? 'z' : 'x', t);
          if (dist > -1 && (st === 'r' || (st === 'y' && dist > 9)) && dist < c.v * c.v / 7 + 8) target = Math.min(target, Math.sqrt(Math.max(0, 2 * 3.6 * (dist - 0.6))));
          if (c.plan.kind !== 's' && dist < 14) target = Math.min(target, 6.5);
          const entry = k * P - c.dir * HALF;
          if (c.dir * (c.s - entry) >= 0 && c.plan.kind !== 's') {
            const nAx = c.ax ? 0 : 1, nDir = c.plan.dir, nRoad = k, nLane = c.plan.kind === 'r' ? 1 : 0, off = 1.9 + nLane * 3.6, nS = c.road * P + nDir * HALF;
            const p0 = { x: c.x, z: c.z }, p2 = posOf(nAx, nDir, nRoad, off, nS, {}), p1 = c.ax ? { x: p0.x, z: p2.z } : { x: p2.x, z: p0.z };
            c.turn = { p0, p1, p2, u: 0, len: (Math.hypot(p1.x - p0.x, p1.z - p0.z) + Math.hypot(p2.x - p1.x, p2.z - p1.z)) * 0.82, next: { ax: nAx, dir: nDir, road: nRoad, lane: nLane, s: nS } }; c.mode = 1;
          }
        } else if (c.dir * (c.s - (c.dir > 0 ? SPAN : 0)) > 0) { c.dir = -c.dir; }
      }
      c.v += clamp(target - c.v, -9 * dt, 2.6 * dt); if (c.v < 0.05 && target === 0) c.v = 0;
      if (c.mode === 0) { c.s += c.dir * c.v * dt; place(c); }
      else { const tr = c.turn; tr.u = Math.min(1, tr.u + Math.max(c.v, 1.2) * dt / tr.len); const u = tr.u, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
        c.x = a * tr.p0.x + b * tr.p1.x + d * tr.p2.x; c.z = a * tr.p0.z + b * tr.p1.z + d * tr.p2.z;
        const tx = 2 * (1 - u) * (tr.p1.x - tr.p0.x) + 2 * u * (tr.p2.x - tr.p1.x), tz = 2 * (1 - u) * (tr.p1.z - tr.p0.z) + 2 * u * (tr.p2.z - tr.p1.z); c.h = Math.atan2(tx, tz);
        if (u >= 1) { Object.assign(c, tr.next); c.mode = 0; c.turn = null; c.plan = null; place(c); } }
      c.push.multiplyScalar(Math.exp(-2.2 * dt));
    }
    // Write instance transforms and lamp positions.
    cars.forEach((c, k) => { const kit = kits[c.kit]; dummy.position.set(c.x + c.push.x, 0, c.z + c.push.y); dummy.rotation.set(0, c.h, 0); dummy.updateMatrix();
      for (const im of groups[c.kit]) { mat.multiplyMatrices(dummy.matrix, im.userData.part.local); im.setMatrixAt(c.slot, mat); }
      pools.setMatrixAt(k, dummy.matrix);
      [kit.head[0], kit.head[1], kit.tail[0], kit.tail[1]].forEach((lpos, q) => { v3.copy(lpos).applyMatrix4(dummy.matrix); lp.set([v3.x, v3.y, v3.z], k * 12 + q * 3); }); });
    for (const g of groups) for (const im of g) im.instanceMatrix.needsUpdate = true;
    pools.instanceMatrix.needsUpdate = true; lg.attributes.position.needsUpdate = true;
  }
  // Player against traffic and parked cars: push apart, return the closing speed of the worst contact.
  function collide(player) {
    let worst = 0; const px = player.pos.x, pz = player.pos.z, pfx = Math.sin(player.heading), pfz = Math.cos(player.heading);
    const hitOne = (ox, oz, oh, o) => { if (Math.abs(ox - px) + Math.abs(oz - pz) > 9) return;
      const ofx = Math.sin(oh), ofz = Math.cos(oh);
      for (const a of [-1.15, 1.15]) for (const b of [-1.2, 1.2]) { const ax = px + pfx * a, az = pz + pfz * a, bx = ox + ofx * b, bz = oz + ofz * b; let dx = ax - bx, dz = az - bz; const d = Math.hypot(dx, dz);
        if (d < 1.95 && d > 1e-3) { dx /= d; dz /= d; const pen = 1.95 - d; player.pos.x += dx * pen; player.pos.z += dz * pen; const ovx = o ? ofx * o.v : 0, ovz = o ? ofz * o.v : 0;
          const vn = (player.vel.x - ovx) * dx + (player.vel.z - ovz) * dz; if (vn < 0) { player.vel.x -= dx * vn * 1.25; player.vel.z -= dz * vn * 1.25; player.vel.multiplyScalar(0.9); worst = Math.max(worst, -vn); if (o) { o.push.x -= dx * Math.min(1.2, -vn * 0.12); o.push.y -= dz * Math.min(1.2, -vn * 0.12); o.v *= 0.4; o.stun = 1.4; } } } } };
    for (const c of cars) hitOne(c.x + c.push.x, c.z + c.push.y, c.h, c);
    for (const p of nearParked) hitOne(p.x, p.z, p.h, null);
    return worst;
  }
  // Close pass at speed without contact.
  function nearMiss(player) { let got = 0; if (Math.abs(player.speed) < 17) return 0; for (const c of cars) { const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z); if (d < 3.6) { if (!c.near2) { c.near2 = true; got++; } } else if (d > 9) c.near2 = false; } return got; }
  return { cars, parked, update, collide, nearMiss };
}
