import * as T from './vendor/three.module.js';
import {GlowPoints} from './glow.js?v=20260928b';
import {random, clamp} from './math.js?v=20260928b';

/*
  Life in town: the traffic lights run their cycle (and everyone obeys them), villages have a four-way stop where each
  driver stops and takes their turn, people stroll along the pavements, look in shop windows, wait at bus stops and
  cross at zebra crossings (traffic gives way), and cars come and go on the side streets.
*/
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const CYCLE = 44;
const M = new T.Matrix4(), M2 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(0, 0, 0, 'YXZ'), V = new T.Vector3(), S = new T.Vector3(), C = new T.Color();

export class TownLife {
  constructor({scene, world, settings, getState, life}) {
    Object.assign(this, {scene, world, settings, getState, life});
    this.time = 0; this.dt = 1 / 60; this.memory = new Map(); this.people = []; this.cross = []; this.towns = new Map();
    this.glow = new GlowPoints(scene, 60, {fade: 900});
    this.colors = {red: new T.Color(1, .12, .05), amber: new T.Color(1, .6, .1), green: new T.Color(.15, 1, .45)};
    this.buildPeople(26);
    for (let i = 0; i < 3; i++) { const c = life.car(pick(['sedan', 'hatch', 'suv', 'van'])); c.g.visible = false; c.beam.visible = false; scene.add(c.g); this.cross.push({car: c, active: false}); }
  }

  /* ---------- Traffic lights ---------- */
  // Each crossroads runs a fixed cycle, offset per town: main road green, amber, all red; side street green, amber, all red.
  phase(cross) { return (this.time + (cross.z * 7.31 % CYCLE) + CYCLE) % CYCLE; }
  light(cross, axis) {
    const t = this.phase(cross);
    if (axis === 'main') return t < 22 ? 'green' : t < 25 ? 'amber' : 'red';
    return t >= 27 && t < 38 ? 'green' : t >= 38 && t < 41 ? 'amber' : 'red';
  }
  // Pedestrians cross the main road while the side street has green, and the side streets while the main road does.
  walk(cross, axis) { const t = this.phase(cross); return axis === 'main' ? t >= 27.5 && t < 36 : t >= 1 && t < 19; }

  townsNear(z) {
    const r = this.world.road, out = [];
    for (let q = z - 400; q <= z + 900; q += 200) { const t = r.townAt(q); if (t && !out.includes(t) && t.end > z - 400 && t.start < z + 900) out.push(t); }
    return out;
  }
  layout(t) { return this.world.scenery.layout(t); }

  // Is anything in the middle of the crossroads, or about to arrive there along `axis`?
  boxBusy(cross, axis, ignore = null) {
    const r = this.world.road, s = this.getState();
    if (axis === 'main') for (const x of this.cross) if (x.active && x !== ignore && x.cross === cross && (Math.abs(x.lx) < x.w + 2 || (x.going && Math.abs(x.lx) < x.w + 9))) return true;
    if (axis === 'side') {
      for (const c of this.life.traffic) if (c.g.visible && c !== ignore && Math.abs(c.z - cross.z) < 10 + c.length / 2) return true;
      if (Math.abs(s.z - cross.z) < 9 && Math.abs(s.x - r.x(s.z)) < r.half(s.z) + 1) return true;
    }
    return false;
  }

  // Where a vehicle on the main road (or the player) must stop: red lights, a stop sign it has not yet stopped at, a busy
  // crossroads, or a zebra crossing someone is using.
  stopFor(v, s) {
    const dir = v.dir, len = v.length || 4.6, front = v.z + dir * len / 2;
    let best = null; const keep = (z, kind) => { if (!best || (z - best.z) * dir < 0) best = {z, kind}; };
    for (const t of this.townsNear(v.z)) {
      const lay = this.layout(t), cr = lay.cross, lights = cr.kind === 'lights', line = cr.z - dir * (lights ? 8.2 : 6.6), ahead = (line - front) * dir;
      if (ahead > -1.5 && ahead < 120) {
        if (lights) {
          const st = this.light(cr, 'main');
          if (st === 'red' || (st === 'amber' && ahead > v.speed * v.speed / 7 + 1)) keep(line, 'light');
          else if (ahead < 25 && this.boxBusy(cr, 'main')) keep(line, 'busy');
        } else {
          const key = v.id + ':' + cr.z + ':' + dir; let m = this.memory.get(key);
          if (!m) { m = {done: false, at: this.time}; this.memory.set(key, m); }
          m.at = this.time;
          if (!m.done) {
            // Wait for a moment once properly stopped at the line, then go when the crossroads is clear.
            if (ahead < 2.2 && Math.abs(v.speed) < .35) m.since ??= this.time; else if (ahead > 3) m.since = undefined;
            if (m.since !== undefined && this.time - m.since > 1.4 && !this.boxBusy(cr, 'main')) m.done = true;
            else keep(line, 'stop');
          }
        }
      }
      // Zebra crossing: give way to anyone crossing or waiting at the kerb.
      if (lay.zebra !== null) {
        const zl = lay.zebra - dir * 3.4, za = (zl - front) * dir;
        if (za > -1 && za < 90 && this.zebraBusy(lay.zebra, za, v.speed)) keep(zl, 'zebra');
      }
      // A light-controlled crossing where people are still on the road.
      if (lights) for (const zc of [cr.z - 5.6, cr.z + 5.6]) { const zl = zc - dir * 1.8, za = (zl - front) * dir; if (za > -1 && za < 60 && this.people.some((p) => p.active && p.state === 'cross' && Math.abs(p.z - zc) < 2)) keep(zl, 'people'); }
    }
    return best;
  }

  zebraBusy(z, ahead, speed) {
    for (const p of this.people) {
      if (!p.active || Math.abs(p.z - z) > 2) continue;
      if (p.state === 'cross') return true;
      // Waiting at the kerb: give way if you can stop comfortably.
      if (p.state === 'wait' && ahead > speed * speed / 6) return true;
    }
    return false;
  }

  // Keep track of whether you stopped at stop signs and waited at red lights.
  watchPlayer(s, onNote) {
    const r = this.world.road, dir = Math.cos(s.yaw) >= 0 ? 1 : -1, front = s.z + dir * 2.3;
    for (const t of this.townsNear(s.z)) {
      const cr = this.layout(t).cross, line = cr.z - dir * (cr.kind === 'lights' ? 8.2 : 6.6), prev = this.lastFront;
      if (prev === undefined || Math.abs(s.x - r.x(s.z)) > r.half(s.z) + 1) continue;
      const crossed = (prev - line) * dir < 0 && (front - line) * dir >= 0;
      if (!crossed || Math.abs(s.speed) < 1.5) continue;
      if (cr.kind === 'lights' && this.light(cr, 'main') === 'red') onNote('That light was red!');
      if (cr.kind === 'stop') { const m = this.memory.get('player:' + cr.z + ':' + dir); if (!m || !m.done) onNote('Come to a full stop at STOP signs'); }
    }
    this.lastFront = front;
  }

  /* ---------- People ---------- */
  buildPeople(n) {
    const mat = new T.MeshStandardMaterial({color: 0xffffff, roughness: .75});
    const inst = (geo, count) => { const m = new T.InstancedMesh(geo, mat, count); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(T.DynamicDrawUsage); this.scene.add(m); for (let i = 0; i < count; i++) m.setColorAt(i, C.set(0xffffff)); return m; };
    this.parts = {
      torso: inst(new T.CapsuleGeometry(.17, .42, 4, 10), n),
      head: inst(new T.SphereGeometry(.115, 14, 10), n),
      hair: inst(new T.SphereGeometry(.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * .55), n),
      thigh: inst(new T.CapsuleGeometry(.07, .34, 4, 8).translate(0, -.22, 0), n * 2),
      shin: inst(new T.CapsuleGeometry(.06, .36, 4, 8).translate(0, -.22, 0), n * 2),
      shoe: inst(new T.BoxGeometry(.1, .08, .24).translate(0, -.04, .05), n * 2),
      arm: inst(new T.CapsuleGeometry(.05, .5, 4, 8).translate(0, -.3, 0), n * 2),
      canopy: inst(new T.ConeGeometry(.55, .28, 12, 1, true), n),
      handle: inst(new T.CylinderGeometry(.012, .012, .9, 5).translate(0, -.45, 0), n),
    };
    const shirts = [0x2f5d8a, 0xb23a3a, 0xe8e2d6, 0x3e6b48, 0xd9a13b, 0x5a4a78, 0x202428, 0xc86a8a, 0x7a9cb8, 0x8a5a36];
    const legs = [0x2a3345, 0x1c1c1e, 0x5a4a3a, 0x7a7466, 0x31405a, 0xa89a82];
    const skins = [0xf1c7a5, 0xd9a47e, 0xb8835a, 0x8a5a3c, 0x5e3c28];
    const hairs = [0x1c1612, 0x3b2a1e, 0x6a4a2a, 0xb88a4a, 0x8a8680, 0x2a1a12];
    const brollies = [0x1d2a44, 0xb42a24, 0x2a2a2a, 0x2f6b3a, 0xe0b22b];
    for (let i = 0; i < n; i++) {
      const p = {i, active: false, x: 0, y: 0, z: 0, yaw: 0, phase: rand(0, 6.3), scale: rand(.88, 1.05), speed: 0, state: 'walk', umbrella: Math.random() < .75};
      this.parts.torso.setColorAt(i, C.set(pick(shirts))); this.parts.head.setColorAt(i, C.set(pick(skins))); this.parts.hair.setColorAt(i, C.set(pick(hairs)));
      const leg = pick(legs), shirt = new T.Color(); this.parts.torso.getColorAt(i, shirt);
      for (const k of [0, 1]) { this.parts.thigh.setColorAt(i * 2 + k, C.set(leg)); this.parts.shin.setColorAt(i * 2 + k, C.set(leg)); this.parts.shoe.setColorAt(i * 2 + k, C.set(pick([0x1a1a1a, 0x3a2a1e, 0xe8e8e2]))); this.parts.arm.setColorAt(i * 2 + k, shirt); }
      this.parts.canopy.setColorAt(i, C.set(pick(brollies))); this.parts.handle.setColorAt(i, C.set(0x222222));
      this.people.push(p);
    }
    for (const m of Object.values(this.parts)) m.instanceColor.needsUpdate = true;
  }

  // Give a town its people when you get near it.
  populate(t, s) {
    const r = this.world.road, lay = this.layout(t), w = r.half(t.center), lit = this.world.atmo?.lit || 0;
    const want = Math.round(clamp(t.half / 9, 6, 22) * (lit > .8 ? .45 : 1));
    const mine = this.people.filter((p) => p.active && p.town === t).length;
    for (let k = mine; k < want; k++) {
      const p = this.people.find((q) => !q.active); if (!p) return;
      let z = rand(t.start + 8, t.end - 8);
      // Keep new arrivals out of sight when you are already in town.
      if (Math.abs(z - s.z) < 90 && s.z > t.start - 60) z = s.z + (Math.random() < .5 ? -1 : 1) * rand(110, 200);
      if (z < t.start + 5 || z > t.end - 5 || Math.abs(z - lay.cross.z) < 5) continue;
      const side = Math.random() < .5 ? -1 : 1;
      Object.assign(p, {active: true, town: t, side, z, lane: w + rand(.95, 1.5), dir: Math.random() < .5 ? 1 : -1, speed: rand(1.05, 1.5), state: 'walk', timer: rand(4, 20), target: null});
      // Some wait at the bus stop on their side.
      const b = lay.busStops.find((q) => q.side === side);
      if (b && Math.random() < .25) { p.state = 'bus'; p.z = b.z + rand(-2.2, 2.2); p.lane = w + rand(1.3, 2.4); p.stop = b; }
    }
  }

  updatePeople(dt, s) {
    const r = this.world.road, rain = this.world.atmo?.rain || 0, towns = this.settings.location === 'hills' ? this.townsNear(s.z) : [];
    for (const t of towns) if (s.z > t.start - 320 && s.z < t.end + 80) this.populate(t, s);
    for (const p of this.people) {
      if (!p.active) continue;
      const t = p.town;
      if (!towns.includes(t) || s.z > t.end + 150 || s.z < t.start - 450) { p.active = false; continue; }
      const lay = this.layout(t), w = r.half(t.center);
      let moving = false;
      if (p.state === 'walk') {
        p.timer -= dt;
        p.z += p.dir * p.speed * dt; moving = true;
        if (p.z < t.start + 4 || p.z > t.end - 4) { p.dir = -p.dir; p.z = clamp(p.z, t.start + 4, t.end - 4); }
        // Side street mouth: walk across it on the crossing.
        // Stop at a zebra or light crossing now and then to cross the road.
        const spots = [lay.zebra, lay.cross.kind === 'lights' ? lay.cross.z - 5.6 : null, lay.cross.kind === 'lights' ? lay.cross.z + 5.6 : null].filter((q) => q !== null);
        for (const zc of spots) if (Math.abs(p.z - zc) < .6 && p.lastSpot !== zc) { p.lastSpot = zc; if (Math.random() < .55) { p.state = 'wait'; p.z = zc + rand(-.6, .6); p.lane = w + .45; p.crossAt = zc; p.light = zc !== lay.zebra; p.timer = 0; } break; }
        if (p.timer <= 0 && p.state === 'walk') { p.timer = rand(8, 25); if (Math.random() < .3) { p.state = 'look'; p.timer = rand(2.5, 7); } else if (Math.random() < .2) p.dir = -p.dir; }
      } else if (p.state === 'look') {
        p.timer -= dt; if (p.timer <= 0) { p.state = 'walk'; p.timer = rand(8, 25); }
      } else if (p.state === 'wait') {
        p.timer += dt;
        const cr = lay.cross, ok = p.light ? this.walk(cr, 'main') : this.safeToStep(p, s);
        if (ok && p.timer > .6) { p.state = 'cross'; p.from = p.side; }
      } else if (p.state === 'cross') {
        // Across the road at a steady pace, then carry on along the far pavement.
        p.lane -= 1.35 * dt; moving = true;
        if (p.lane < -(w + .5)) { p.side = -p.side; p.lane = w + rand(.95, 1.5); p.state = 'walk'; p.timer = rand(8, 20); }
      } else if (p.state === 'bus') {
        const bus = this.life.traffic.find((c) => c.kind === 'bus' && c.g.visible && c.atStop > 1 && c.nextStop === p.stop);
        if (bus) { p.state = 'board'; p.bus = bus; }
      } else if (p.state === 'board') {
        const door = new T.Vector3(r.side * 1.35, 0, 4.7); p.bus.g.localToWorld(door);
        const dx = door.x - p.x, dz = door.z - p.z, d = Math.hypot(dx, dz);
        // On board (or the bus left without them, and they go back to the shelter).
        if (d < .5 || !p.bus.g.visible) { p.active = false; continue; }
        if (!p.bus.atStop && p.bus.speed > .5) { p.state = 'bus'; p.bus = null; p.x = r.x(p.z) + p.side * p.lane; continue; }
        p.z += dz / d * 1.4 * dt; p.x += dx / d * 1.4 * dt; p.yaw = Math.atan2(dx, dz); moving = true;
        this.pose(p, moving, rain, dt); continue;
      }
      const lane = p.lane;
      p.x = r.x(p.z) + p.side * lane; p.y = r.y(p.z) + (Math.abs(lane) > w ? .075 : .06);
      const along = Math.atan(r.tangent(p.z));
      p.yaw = p.state === 'cross' ? along + (p.side > 0 ? -Math.PI / 2 : Math.PI / 2) : p.state === 'wait' || p.state === 'bus' ? along + (p.side > 0 ? -Math.PI / 2 : Math.PI / 2) : p.state === 'look' ? along + (p.side > 0 ? Math.PI / 2 : -Math.PI / 2) : along + (p.dir < 0 ? Math.PI : 0);
      this.pose(p, moving, rain, dt);
    }
  }

  // Step out onto a zebra only when approaching traffic can stop in time.
  safeToStep(p, s) {
    const r = this.world.road;
    for (const c of this.life.traffic) { if (!c.g.visible || Math.abs(c.z - p.z) > 80) continue; const toward = (p.z - c.z) * c.dir; if (toward > 0 && toward < c.speed * 2 + 4 && c.speed > 1) return false; }
    const toward = (p.z - s.z) * (Math.cos(s.yaw) >= 0 ? 1 : -1), v = Math.abs(s.speed);
    if (toward > 0 && toward < v * 2.2 + 5 && v > 1 && Math.abs(s.x - r.x(s.z)) < r.half(s.z) + 1) return false;
    return true;
  }

  // Place one person's body parts: legs swing and knees bend as they walk, arms swing opposite, an umbrella in the rain.
  pose(p, moving, rain, dt) {
    const i = p.i, sc = p.scale, P = this.parts;
    p.phase += (moving ? 5.6 * (p.state === 'cross' ? 1.1 : 1) * p.speed / 1.3 : .8) * dt;
    const swing = moving ? Math.sin(p.phase) : Math.sin(p.phase * .3) * .04;
    const base = M.compose(V.set(p.x, p.y, p.z), Q.setFromEuler(E.set(0, p.yaw, 0)), S.setScalar(sc));
    const set = (mesh, k, x, y, z, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { M2.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, 0, rz)), S.set(sx, sy, sz)); mesh.setMatrixAt(k, M2.premultiply(base)); };
    const bob = moving ? Math.abs(Math.cos(p.phase)) * .03 : 0;
    set(P.torso, i, 0, 1.2 + bob, 0, moving ? .05 : 0);
    set(P.head, i, 0, 1.62 + bob, .02);
    set(P.hair, i, 0, 1.64 + bob, 0);
    for (const k of [0, 1]) {
      const sgn = k ? 1 : -1, a = swing * .45 * sgn, knee = moving ? Math.max(0, -Math.sin(p.phase + (k ? 0 : Math.PI) + .6)) * .7 : 0;
      M2.compose(V.set(sgn * .1, .9 + bob, 0), Q.setFromEuler(E.set(-a, 0, 0)), S.setScalar(1));
      const hip = M2.clone().premultiply(base);
      P.thigh.setMatrixAt(i * 2 + k, hip);
      const kneeM = new T.Matrix4().compose(V.set(0, -.44, 0), Q.setFromEuler(E.set(knee, 0, 0)), S.setScalar(1)).premultiply(hip);
      P.shin.setMatrixAt(i * 2 + k, kneeM);
      P.shoe.setMatrixAt(i * 2 + k, new T.Matrix4().makeTranslation(0, -.46, 0).premultiply(kneeM));
      const umbrellaArm = k === 1 && p.umbrella && rain > .25;
      set(P.arm, i * 2 + k, sgn * .24, 1.45 + bob, 0, umbrellaArm ? -1.9 : a * 1.1 * -1 + (p.state === 'board' ? -.3 : 0), sgn * .08);
    }
    const brolly = p.umbrella && rain > .25;
    if (brolly) { set(P.canopy, i, .1, 2.25 + bob, .18); set(P.handle, i, .1, 2.2 + bob, .18); }
    else { P.canopy.setMatrixAt(i, M2.makeScale(0, 0, 0)); P.handle.setMatrixAt(i, M2.makeScale(0, 0, 0)); }
  }

  hide(p) {
    const P = this.parts, z = M2.makeScale(0, 0, 0);
    for (const k of ['torso', 'head', 'hair', 'canopy', 'handle']) P[k].setMatrixAt(p.i, z);
    for (const k of ['thigh', 'shin', 'shoe', 'arm']) { P[k].setMatrixAt(p.i * 2, z); P[k].setMatrixAt(p.i * 2 + 1, z); }
  }

  /* ---------- Side-street traffic ---------- */
  updateCross(dt, s) {
    const r = this.world.road, towns = this.settings.location === 'hills' && this.settings.trafficOncoming !== 'off' ? this.townsNear(s.z) : [];
    this.crossTimer = (this.crossTimer ?? rand(3, 8)) - dt;
    if (this.crossTimer <= 0) {
      this.crossTimer = rand(6, 14);
      const t = towns.find((q) => { const zc = this.layout(q).cross.z; return zc > s.z - 60 && zc < s.z + 420; });
      const slot = this.cross.find((x) => !x.active);
      if (t && slot) {
        const cr = this.layout(t).cross, e = Math.random() < .5 ? -1 : 1;
        if (!this.cross.some((o) => o.active && o.cross === cr && o.e === e && Math.abs(o.lx - e * (cr.len - 3)) < 12)) { Object.assign(slot, {active: true, cross: cr, town: t, e, lx: e * (cr.len - 3), speed: 8, wait: 0, going: false, w: r.half(cr.z)}); slot.car.g.visible = true; }
      }
    }
    for (const x of this.cross) {
      if (!x.active) continue;
      const cr = x.cross, zc = cr.z, x0 = r.x(zc), y0 = r.y(zc), yaw = Math.atan(r.tangent(zc)), c = Math.cos(yaw), sn = Math.sin(yaw), w = x.w, e = x.e;
      if (!towns.includes(x.town) && Math.abs(zc - s.z) > 500) { x.active = false; x.car.g.visible = false; continue; }
      const lz = r.side * e * cr.lane, line = e * (w + 3.3 + (cr.kind === 'lights' ? 1.2 : .6)), front = x.lx - e * x.car.length / 2;
      const toLine = (front - line) * e;
      let target = 9;
      if (toLine > -.5) {
        let go;
        if (cr.kind === 'lights') go = this.light(cr, 'side') === 'green' && !this.boxBusy(cr, 'side', x);
        else { if (toLine < 1.2 && x.speed < .3) x.wait += dt; go = x.wait > 1.5 && !this.boxBusy(cr, 'side', x) && !this.mainApproaching(cr, s); }
        if (!go) target = Math.max(0, Math.min(9, Math.sqrt(Math.max(0, 2 * 3 * (toLine - .3)))));
        x.going = go;
      } else x.going = true;
      // Follow any side-street car ahead in the same lane.
      for (const o of this.cross) if (o !== x && o.active && o.cross === cr && o.e === e) { const gap = (x.lx - o.lx) * e - x.car.length - 1.5; if (gap > -2 && (o.lx - x.lx) * -e > 0) target = Math.min(target, Math.max(0, gap * .6)); }
      x.speed += clamp(target - x.speed, -6 * dt, 2.2 * dt);
      x.lx -= e * x.speed * dt;
      if (x.lx * e < -(cr.len - 3)) { x.active = false; x.car.g.visible = false; continue; }
      const wx = x0 + x.lx * c + lz * sn, wz = zc - x.lx * sn + lz * c, gy = Math.max(y0, this.world.surfaceHeight(wx, wz)) + .06;
      const g = x.car.g; g.position.set(wx, gy, wz); g.rotation.set(0, Math.atan2(-e * c, e * sn), 0);
      x.x = wx; x.z = wz;
      for (const wh of x.car.wheels) wh.spin.rotation.x += x.speed * dt / x.car.wheelRadius;
      x.car.braking = target < x.speed - .5 || x.speed < .3;
      for (const l of x.car.lamps.tail) l.material = x.car.braking ? this.life.m.brake : this.life.m.tail;
      const lit = this.world.atmo?.lit || 0;
      if (lit > .3) for (const sx of [-1, 1]) { V.set(sx * x.car.headX, x.car.headY, x.car.length / 2 + .05); g.localToWorld(V); this.glow.add(V.x, V.y, V.z, this.warm ||= new T.Color(1, .93, .8), .5 * lit, 18); }
    }
  }

  // At a four-way stop, side-street drivers wait while traffic on the main road is close to the crossroads.
  mainApproaching(cr, s) {
    const r = this.world.road;
    for (const c of this.life.traffic) if (c.g.visible && c.kind !== 'bike' && Math.abs(c.z - cr.z) < 16 + c.speed * 1.5 && (cr.z - c.z) * c.dir > -8) return true;
    const dir = Math.cos(s.yaw) >= 0 ? 1 : -1;
    if (Math.abs(s.z - cr.z) < 18 + Math.abs(s.speed) * 1.5 && (cr.z - s.z) * dir > -8 && Math.abs(s.x - r.x(s.z)) < r.half(s.z) + 1) return true;
    return false;
  }

  /* ---------- Queries for other systems ---------- */
  obstacles(z, range) {
    const out = [];
    for (const p of this.people) if (p.active && p.z > z - 6 && p.z < z + range && (p.state === 'cross' || p.state === 'wait' || p.state === 'board')) out.push({x: p.x, z: p.z, r: .45, vz: 0});
    for (const x of this.cross) if (x.active && x.z > z - 8 && x.z < z + range) out.push({x: x.x, z: x.z, r: 1.5, vz: 0});
    return out;
  }
  colliders(x, z, range) {
    const out = [];
    for (const p of this.people) if (p.active && Math.abs(p.x - x) < range && Math.abs(p.z - z) < range) out.push({x: p.x, z: p.z, r: .3, person: p});
    for (const c of this.cross) if (c.active && Math.abs(c.x - x) < range + 3 && Math.abs(c.z - z) < range + 3) { const yaw = c.car.g.rotation.y; out.push({x: c.x, z: c.z, hx: c.car.width / 2, hz: c.car.length / 2, c: Math.cos(yaw), s: Math.sin(yaw), r: 0}); }
    return out;
  }

  /* ---------- Per frame ---------- */
  update(dt, camera) {
    this.dt = dt; this.time += dt;
    const s = this.getState();
    this.updatePeople(dt, s);
    for (const p of this.people) if (!p.active) this.hide(p);
    for (const m of Object.values(this.parts)) m.instanceMatrix.needsUpdate = true;
    this.glow.begin();
    this.updateCross(dt, s);
    // Light up the signals in the chunks you can see.
    const sig = this.world.scenery.sig, blink = Math.floor(this.time * 1.3) % 2, lit = this.world.atmo?.lit || 0;
    if (sig) for (const g of this.world.chunks.values()) {
      for (const it of g.userData.signals || []) {
        const st = this.light(it.cross, it.axis);
        for (const h of it.heads) for (const k of ['red', 'amber', 'green']) {
          const on = st === k; h[k].material = sig[k][on ? 1 : 0];
          if (on && Math.abs(h[k].getWorldPosition(V).z - camera.position.z) < 500) this.glow.add(V.x, V.y, V.z, this.colors[k], .35 + .6 * lit, 10);
        }
        if (it.ped) { const walk = this.walk(it.cross, 'main'); it.ped.walk.material = sig.walk[walk ? 1 : 0]; it.ped.stand.material = sig.stand[walk ? 0 : 1]; }
      }
      for (const b of g.userData.belisha || []) { b.material = sig.belisha[blink]; if (blink) this.glow.add(b.position.x, b.position.y, b.position.z, this.colors.amber, .5 + .5 * lit, 12); }
    }
    this.glow.end();
    // Forget stop-sign visits that are long past.
    if (this.memory.size > 200) for (const [k, m] of this.memory) if (this.time - m.at > 30) this.memory.delete(k);
  }
}
