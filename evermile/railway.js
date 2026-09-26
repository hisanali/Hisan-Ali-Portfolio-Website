import * as T from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/geometries/RoundedBoxGeometry.js';
import {GlowPoints} from './glow.js?v=20260926b';
import {clamp} from './math.js?v=20260927a';
import {canvasTexture} from './scenery.js?v=20260927a';

/*
  Trains on the line beside the road. A train comes out of the tunnel at one end of the line, runs along the valley and
  disappears into the hill at the other end. Level crossings close ahead of it: the red lights flash, the barriers come
  down, everyone waits, the train thunders across, and the barriers lift again. Trains are often timed to reach a
  crossing about when you do, so you get to wait at the barrier now and then.
*/
const rand = (a, b) => a + Math.random() * (b - a);
const WARN = 24, CLOSE = 19, LOWER = 6, RAISE = 4.5, CLEAR = 3;

export class Railway {
  constructor({scene, world, settings, getState}) {
    Object.assign(this, {scene, world, settings, getState});
    this.train = null; this.timer = rand(8, 16); this.time = 0; this.arms = new Map(); this.lit = 0;
    this.glow = new GlowPoints(scene, 40, {fade: 2400});
    this.white = new T.Color(1, .96, .88); this.red = new T.Color(1, .15, .08);
    this.materials();
    this.pool = {passenger: this.makeTrain('passenger'), freight: this.makeTrain('freight')};
  }

  materials() {
    const std = (o) => new T.MeshStandardMaterial(o);
    const side = (body, stripe, lit) => canvasTexture(1024, 128, (x, w, h) => {
      x.fillStyle = body; x.fillRect(0, 0, w, h);
      x.fillStyle = stripe; x.fillRect(0, 96, w, 12); x.fillRect(0, 22, w, 4);
      for (let i = 0; i < 11; i++) {
        const wx = 30 + i * 88 + (i > 5 ? 40 : 0); if (i === 5) continue;
        x.fillStyle = lit ? '#ffe2a8' : '#1a242c'; x.fillRect(wx, 38, 66, 40);
        if (!lit) { const g = x.createLinearGradient(wx, 38, wx + 66, 78); g.addColorStop(0, 'rgba(210,230,240,.35)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(wx, 38, 66, 40); }
        else { x.fillStyle = 'rgba(120,70,30,.35)'; x.fillRect(wx + 8, 60, 50, 18); }
      }
      // Doors near each end and in the middle.
      for (const dx of [8, 470, 994]) { x.fillStyle = lit ? '#000' : '#2e3438'; x.fillRect(dx - 6, 30, 24, 76); x.fillStyle = lit ? '#ffe2a8' : '#1a242c'; x.fillRect(dx - 2, 36, 16, 30); }
    });
    this.m = {
      body: std({color: 0xe8e8e2, roughness: .35, metalness: .35}),
      nose: std({color: 0xd82b24, roughness: .3, metalness: .3}),
      dark: std({color: 0x1b1d20, roughness: .6, metalness: .4}),
      glass: std({color: 0x0f171d, roughness: .08, metalness: .6}),
      roof: std({color: 0x8d9296, roughness: .5, metalness: .5}),
      lamp: std({color: 0xffffff, emissive: 0xfff2d8, emissiveIntensity: 2}),
      tail: std({color: 0x4a0606, emissive: 0xff1a0a, emissiveIntensity: 1.5}),
      wheel: std({color: 0x4b4c4e, roughness: .4, metalness: .8}),
      flat: std({color: 0x3a3430, roughness: .8, metalness: .3}),
    };
    const coach = side('#e8e8e2', '#d82b24', false), coachLit = side('#e8e8e2', '#d82b24', true);
    this.m.coachSide = std({map: coach, emissive: 0xffffff, emissiveMap: coachLit, emissiveIntensity: 0, roughness: .35, metalness: .3});
    this.m.windows = [this.m.coachSide];
    this.m.containers = [0x9b2d20, 0x1f5c8f, 0x2f6b3a, 0xc9892b, 0x6a6e73, 0x7a2240, 0xe0dcd0].map((c) => std({map: this.corrugated(), color: c, roughness: .6, metalness: .3}));
  }

  corrugated() {
    if (this.ribs) return this.ribs;
    const t = this.ribs = canvasTexture(256, 64, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); for (let i = 0; i < 64; i++) { x.fillStyle = i % 2 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.2)'; x.fillRect(i * 4, 0, 2, h); } x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, w, 3); x.fillRect(0, h - 3, w, 3); });
    return t;
  }

  add(g, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }

  // Bogies under a car: two pairs of wheels on a frame at each end.
  bogies(g, len) {
    const wheel = this.wheelGeo ||= new T.CylinderGeometry(.46, .46, .16, 18).rotateZ(Math.PI / 2);
    for (const e of [-1, 1]) {
      const z = e * (len / 2 - 3);
      this.add(g, new T.BoxGeometry(2.3, .45, 3.4), this.m.dark, 0, .62, z);
      for (const dz of [-1.1, 1.1]) for (const x of [-.72, .72]) this.add(g, wheel, this.m.wheel, x, .46, z + dz);
    }
  }

  // Electric locomotive with a sloping nose and a pantograph on the roof. Length 19 m, nose towards +z.
  loco() {
    const g = new T.Group(), L = 19, W = 2.9;
    const shape = new T.Shape([[-L / 2, 1.05], [-L / 2, 4.05], [L / 2 - 2.6, 4.05], [L / 2 - .2, 2.3], [L / 2, 1.3], [L / 2 - .3, 1.05]].map(([a, b]) => new T.Vector2(a, b)));
    const body = new T.ExtrudeGeometry(shape, {depth: W, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2}).translate(0, 0, -W / 2).rotateY(-Math.PI / 2);
    this.add(g, body, this.m.body, 0, 0, 0);
    this.add(g, new T.BoxGeometry(W + .18, .5, L * .9), this.m.nose, 0, 1.5, -.4);
    this.add(g, new T.BoxGeometry(W + .19, .14, L * .96), this.m.nose, 0, 3.3, -.3);
    const screen = this.add(g, new T.PlaneGeometry(W - .4, 1.45), this.m.glass, 0, 3.1, L / 2 - 1.36, -.63);
    screen.castShadow = false;
    for (const s of [-1, 1]) {
      this.add(g, new T.PlaneGeometry(1, .8), this.m.glass, s * (W / 2 + .1), 3.1, L / 2 - 2.9, 0, s * Math.PI / 2);
      this.add(g, new T.PlaneGeometry(1.4, .9), this.m.glass, s * (W / 2 + .1), 3.05, -L / 2 + 2.2, 0, s * Math.PI / 2);
      this.add(g, new RoundedBoxGeometry(.34, .18, .08, 2, .04), this.m.lamp, s * .95, 1.45, L / 2 + .02);
      this.add(g, new RoundedBoxGeometry(.24, .14, .08, 2, .03), this.m.tail, s * .95, 1.45, -L / 2 - .08);
      for (let k = 0; k < 4; k++) this.add(g, new T.BoxGeometry(.04, .9, .5), this.m.dark, s * (W / 2 + .07), 2.6, -4 + k * 1.3);
    }
    this.add(g, new RoundedBoxGeometry(.3, .16, .08, 2, .04), this.m.lamp, 0, 3.92, L / 2 - 2.5);
    this.add(g, new T.BoxGeometry(W * .7, .3, 6), this.m.roof, 0, 4.2, -2);
    // Pantograph: a folding diamond frame reaching up to the (imagined) overhead wire.
    const pan = new T.Group(); pan.position.set(0, 4.35, 3.4); g.add(pan);
    this.add(pan, new T.CylinderGeometry(.04, .04, 1.3, 6), this.m.dark, 0, .45, -.4, .95);
    this.add(pan, new T.CylinderGeometry(.04, .04, 1.2, 6), this.m.dark, 0, 1.05, -.35, -1.05);
    this.add(pan, new T.BoxGeometry(1.8, .06, .12), this.m.dark, 0, 1.45, -.1);
    this.bogies(g, L);
    return {g, len: L, loco: true};
  }

  coach() {
    const g = new T.Group(), L = 20, W = 2.9;
    const mats = [this.m.coachSide, this.m.coachSide, this.m.roof, this.m.dark, this.m.body, this.m.body];
    this.add(g, new T.BoxGeometry(W, 2.9, L), mats, 0, 2.55, 0);
    this.add(g, new RoundedBoxGeometry(W - .2, .4, L - .3, 2, .18), this.m.roof, 0, 4.05, 0);
    this.add(g, new T.BoxGeometry(W - .3, .45, L - 2), this.m.dark, 0, 1, 0);
    // Gangway bellows between cars.
    for (const e of [-1, 1]) this.add(g, new T.BoxGeometry(1.8, 2.4, .5), this.m.dark, 0, 2.5, e * (L / 2 + .2));
    this.bogies(g, L);
    return {g, len: L};
  }

  wagon() {
    const g = new T.Group(), L = 16;
    this.add(g, new T.BoxGeometry(2.7, .35, L), this.m.flat, 0, 1.2, 0);
    for (let k = 0; k < 6; k++) this.add(g, new T.BoxGeometry(.08, .3, .08), this.m.flat, (k % 2 ? 1 : -1) * 1.3, 1.05, -L / 2 + 1.5 + Math.floor(k / 2) * 6.5);
    const one = Math.random() < .35;
    const box = (z, len) => { const c = this.add(g, new T.BoxGeometry(2.45, 2.6, len), this.m.containers[Math.floor(Math.random() * this.m.containers.length)], 0, 2.7, z); c.userData.container = true; return c; };
    const list = one ? [box(0, 12.2)] : [box(-3.9, 6.05), box(3.9, 6.05)];
    this.bogies(g, L);
    return {g, len: L, boxes: list};
  }

  makeTrain(kind) {
    const cars = kind === 'passenger' ? [this.loco(), this.coach(), this.coach(), this.coach(), this.coach()] : [this.loco(), this.wagon(), this.wagon(), this.wagon(), this.wagon(), this.wagon(), this.wagon(), this.wagon()];
    let offset = 0;
    for (const c of cars) { c.offset = offset + c.len / 2; offset += c.len + .9; c.g.visible = false; c.g.rotation.order = 'YXZ'; this.scene.add(c.g); }
    // A passenger train sometimes runs with a second loco at the back, facing the other way.
    return {kind, cars, length: offset - .9};
  }

  /* ---------- Where lines are ---------- */
  // Railway lines on the road ahead and just behind you.
  lines(z) {
    const r = this.world.road, out = [];
    if (this.settings.location !== 'hills') return out;
    for (const seg of r.segs) { if (seg.z0 > z + 3000 || seg.z0 + seg.len < z - 800) continue; const rail = r.rail(seg); if (rail && rail.b > z - 400 && rail.a < z + 2800) out.push(rail); }
    return out;
  }

  dispatch(s) {
    const lines = this.lines(s.z); if (!lines.length) return false;
    const pv = this.eta(s);
    // Prefer to meet you at a crossing ahead.
    let pick = null;
    for (const rail of lines) for (const c of rail.crossings) { const d = c - s.z; if (d > 300 && d < 1600 && (!pick || d < pick.d)) pick = {rail, c, d}; }
    const rail = pick && Math.random() < .75 ? pick.rail : lines[Math.floor(Math.random() * lines.length)];
    const dir = Math.random() < .5 ? 1 : -1, start = dir > 0 ? rail.a - 30 : rail.b + 30;
    const train = Math.random() < .55 ? this.pool.passenger : this.pool.freight;
    let speed = train.kind === 'passenger' ? rand(30, 40) : rand(21, 28), delay = 0;
    if (pick && pick.rail === rail) {
      const tP = pick.d / pv, dist = Math.abs(pick.c - start);
      // Aim for the barriers to be down (or coming down) as you arrive.
      const want = tP + rand(4, 16);
      speed = clamp(dist / want, train.kind === 'passenger' ? 24 : 18, train.kind === 'passenger' ? 44 : 32);
      delay = Math.max(0, want - dist / speed);
    }
    const aim = pick && pick.rail === rail ? {c: pick.c, margin: rand(3, 13), start} : null;
    for (const c of train.cars) for (const b of c.boxes || []) b.material = this.m.containers[Math.floor(Math.random() * this.m.containers.length)];
    this.train = {...train, rail, dir, speed, front: start, delay, horned: new Set(), age: 0, aim};
    return true;
  }

  /* ---------- Per frame ---------- */
  update(dt, camera, audio) {
    this.time += dt;
    const s = this.getState(), r = this.world.road;
    if (!this.train) {
      this.timer -= dt;
      if (this.timer <= 0 && s.started) { if (!this.dispatch(s)) this.timer = 6; }
    }
    const tr = this.train;
    this.glow.begin();
    if (tr) {
      // Until it sets off, the train keeps adjusting its departure to meet you at the crossing as you actually drive.
      if (tr.delay > 0 && tr.aim) { const d = tr.aim.c - s.z; if (d > 60) tr.delay = clamp(d / this.eta(s) + tr.aim.margin - Math.abs(tr.aim.c - tr.aim.start) / tr.speed, 0, 90); else if (d < -20) tr.aim = null; }
      if (tr.delay > 0) tr.delay -= dt;
      else { tr.front += tr.dir * tr.speed * dt; tr.age += dt; }
      const rail = tr.rail, cam = camera.position;
      const place = (z) => [r.railX(rail, z), r.railY(rail, z) + .2];
      for (const c of tr.cars) {
        const zc = tr.front - tr.dir * c.offset, shown = tr.delay <= 0 && zc > rail.a - 22 && zc < rail.b + 22;
        c.g.visible = shown; if (!shown) continue;
        const [x, y] = place(zc), [xa, ya] = place(zc + 4), [xb, yb] = place(zc - 4);
        c.g.position.set(x, y, zc);
        const yaw = Math.atan2(xa - xb, 8) + (tr.dir < 0 ? Math.PI : 0);
        c.g.rotation.set(-Math.atan2(ya - yb, 8) * tr.dir, yaw, 0);
      }
      // Headlights at the front, tail lights at the back, lit windows after dark.
      const lead = tr.cars[0];
      if (lead.g.visible) for (const sx of [-.95, .95]) { const v = new T.Vector3(sx, 1.45, lead.len / 2 + .1); lead.g.localToWorld(v); this.glow.add(v.x, v.y, v.z, this.white, .7 + this.lit * .6, 26); }
      const last = tr.cars[tr.cars.length - 1];
      if (last.g.visible) for (const sx of [-.95, .95]) { const v = new T.Vector3(sx, 1.45, -last.len / 2 - .1); last.g.localToWorld(v); this.glow.add(v.x, v.y, v.z, this.red, .6, 16); }
      // Horn before each crossing.
      for (const c of rail.crossings) {
        const ahead = (c - tr.front) * tr.dir;
        if (ahead > 0 && ahead < 380 && !tr.horned.has(c)) { tr.horned.add(c); if (Math.hypot(r.railX(rail, tr.front) - cam.x, tr.front - cam.z) < 1400) this.horn(audio); }
      }
      const tail = tr.front - tr.dir * tr.length;
      if ((tr.dir > 0 && tail > rail.b + 30) || (tr.dir < 0 && tail < rail.a - 30) || tr.age > 400) { for (const c of tr.cars) c.g.visible = false; this.train = null; this.timer = rand(30, 70); }
    }
    this.glow.end();
    // Barrier arms ease down and back up.
    for (const [z, a] of this.arms) { const want = this.wantClosed(z); a.closed = clamp(a.closed + (want ? dt / LOWER : -dt / RAISE), 0, 1); a.flashing = this.warning(z) || a.closed > .01; if (Math.abs(z - s.z) > 3000) this.arms.delete(z); }
    this.sound(dt, camera, audio);
  }

  // Your likely average speed from here: somewhere between how fast you are going and the road's limit.
  eta(s) { const r = this.world.road; return Math.max(8, Math.abs(s.speed) * .55 + r.limit(s.z) * .45 * (r.townFactor(s.z + 200) > .3 ? .6 : 1)); }

  // Seconds until the train front reaches the crossing, and whether its tail is clear of it.
  timing(zc) {
    const tr = this.train; if (!tr || tr.delay > 0 && tr.delay > 40) return null;
    if (!tr.rail.crossings.includes(zc)) return null;
    const until = ((zc - tr.front) * tr.dir) / tr.speed + Math.max(0, tr.delay), tailPast = ((tr.front - tr.dir * tr.length - zc) * tr.dir) / tr.speed;
    return {until, tailPast};
  }
  warning(zc) { const t = this.timing(zc); return !!t && t.until < WARN && t.tailPast < CLEAR; }
  wantClosed(zc) { const t = this.timing(zc); return !!t && t.until < CLOSE && t.tailPast < CLEAR; }
  crossingState(zc) {
    let a = this.arms.get(zc); if (!a) { a = {closed: 0, flashing: false}; this.arms.set(zc, a); }
    return a;
  }

  // Where traffic heading `dir` must stop for a crossing that is closing, within `range` ahead of z.
  stopLine(z, dir, range) {
    for (const rail of this.lines(z)) for (const c of rail.crossings) {
      const ahead = (c - z) * dir; if (ahead < -2 || ahead > range) continue;
      const st = this.crossingState(c);
      if (st.flashing || st.closed > .02) return {z: c - dir * 11, kind: 'rail'};
    }
    return null;
  }

  // Solid parts near a point: train cars and lowered barrier arms.
  colliders(x, z, range) {
    const out = [], tr = this.train, r = this.world.road;
    if (tr) for (const c of tr.cars) if (c.g.visible && Math.abs(c.g.position.z - z) < range + c.len / 2 && Math.abs(c.g.position.x - x) < range + 3) { const yaw = c.g.rotation.y; out.push({x: c.g.position.x, z: c.g.position.z, hx: 1.5, hz: c.len / 2, c: Math.cos(yaw), s: Math.sin(yaw), r: 0, train: true}); }
    for (const [zc, a] of this.arms) {
      if (a.closed < .75 || Math.abs(zc - z) > range + 12) continue;
      for (const dir of [1, -1]) {
        const zs = zc - dir * 8.5, w = r.width(zs), yaw = Math.atan(r.tangent(zs)), c = Math.cos(yaw), sn = Math.sin(yaw), px = r.x(zs) + r.side * dir * (w + .9) / c, back = -r.side * dir * (w + .4) / 2;
        out.push({x: px + back * c, z: zs - back * sn, hx: (w + .4) / 2, hz: .12, c, s: sn, r: 0, barrier: true});
      }
    }
    return out;
  }

  setLit(lit) { this.lit = lit; this.m.coachSide.emissiveIntensity = .9 * lit; this.m.lamp.emissiveIntensity = 2 + lit * 2; }

  /* ---------- Sound: rumble and wheel clatter, and a two-tone horn ---------- */
  initAudio(ctx, out) {
    if (this.ctx || !ctx) return;
    this.ctx = ctx;
    const sr = ctx.sampleRate, buf = ctx.createBuffer(1, sr * 2, sr), d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < d.length; i++) { b = (b + (Math.random() * 2 - 1) * .04) / 1.02; d[i] = b * 3; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 380;
    this.clack = ctx.createGain(); this.clack.gain.value = .6;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 3; this.lfo = lfo;
    const depth = ctx.createGain(); depth.gain.value = .35; lfo.connect(depth).connect(this.clack.gain); lfo.start();
    this.rumble = ctx.createGain(); this.rumble.gain.value = 0;
    src.connect(this.lp).connect(this.clack).connect(this.rumble).connect(out || ctx.destination); src.start();
    this.out = out || ctx.destination;
  }

  horn(getVolume) {
    const ctx = this.ctx, vol = typeof getVolume === 'function' ? getVolume() : 0; if (!ctx || !vol) return;
    const now = ctx.currentTime, g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol * .16, now + .08);
    g.gain.setValueAtTime(vol * .16, now + 1.1); g.gain.linearRampToValueAtTime(0, now + 1.35);
    g.gain.linearRampToValueAtTime(vol * .14, now + 1.55); g.gain.setValueAtTime(vol * .14, now + 2.4); g.gain.linearRampToValueAtTime(0, now + 2.8);
    for (const f of [311, 370, 466]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(now); o.stop(now + 2.9); }
    lp.connect(g).connect(this.out);
  }

  sound(dt, camera, getVolume) {
    if (!this.ctx) return;
    const tr = this.train, vol = typeof getVolume === 'function' ? getVolume() : 0;
    let level = 0;
    if (tr && tr.delay <= 0) {
      const cam = camera.position, r = this.world.road;
      // Loudest where the nearest car passes.
      const nz = clamp(cam.z, Math.min(tr.front, tr.front - tr.dir * tr.length), Math.max(tr.front, tr.front - tr.dir * tr.length)), d = Math.hypot(r.railX(tr.rail, nz) - cam.x, nz - cam.z);
      const inside = nz < tr.rail.a - 20 || nz > tr.rail.b + 20;
      level = vol * .55 / (1 + (d / 60) ** 2) * (inside ? .25 : 1);
      this.lfo.frequency.setTargetAtTime(tr.speed / 7.5, this.ctx.currentTime, .3);
    }
    this.rumble.gain.setTargetAtTime(level, this.ctx.currentTime, .25);
  }
}
