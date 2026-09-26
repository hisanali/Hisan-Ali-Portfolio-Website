import * as T from './vendor/three.module.js';
import {Water} from './vendor/objects/Water.js';
import {GlowPoints} from './glow.js?v=20260926b';
import {addMist} from './atmosphere.js?v=20260927a';

// Weather, water and wildlife layered over the world: rain, wet roads, puddles, lightning, thunder, reflective water and birds.
const rand = (a, b) => a + Math.random() * (b - a);

function canvasTexture(size, draw, repeat = false) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new T.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}

// A tiling normal map made from overlapping sine swells, for the water surface.
function waterNormals() {
  const size = 256, h = new Float32Array(size * size);
  const waves = Array.from({length: 14}, () => ({kx: Math.round(rand(-9, 9)), ky: Math.round(rand(-9, 9)) || 1, a: rand(.3, 1), p: rand(0, 6.28)}));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0; for (const w of waves) v += w.a * Math.sin((w.kx * x + w.ky * y) / size * Math.PI * 2 + w.p);
    h[y * size + x] = v;
  }
  return canvasTexture(size, (ctx) => {
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = h[y * size + (x + 1) % size] - h[y * size + (x - 1 + size) % size];
      const dy = h[((y + 1) % size) * size + x] - h[((y - 1 + size) % size) * size + x];
      const n = new T.Vector3(-dx * .35, -dy * .35, 1).normalize(), i = (y * size + x) * 4;
      img.data[i] = (n.x * .5 + .5) * 255; img.data[i + 1] = (n.y * .5 + .5) * 255; img.data[i + 2] = (n.z * .5 + .5) * 255; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, true);
}

function puddleAlpha() {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, s, s);
    const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 62);
    g.addColorStop(0, '#fff'); g.addColorStop(.72, '#fff'); g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, r = 46 + Math.sin(a * 3 + 1) * 6 + Math.cos(a * 2) * 5; const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r * .8; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.fill();
  });
}

export class Effects {
  constructor({scene, renderer, camera, world, settings, hemi, sun, getVolume, getState}) {
    Object.assign(this, {scene, renderer, camera, world, settings, hemi, sun, getVolume, getState});
    this.flash = 0; this.nextStrike = rand(6, 12); this.time = 0; this.fade = new T.Color();
    this.base = {hemi: hemi.intensity, sun: sun.intensity};
    this.original = {roadRough: world.roadMat.roughness, roadEnv: world.roadMat.envMapIntensity ?? 1, groundRough: world.groundMat.roughness};
    this.wetShown = -1;
    this.buildRain();
    this.buildPuddles();
    this.buildRipples();
    this.buildLightning();
    this.buildBirds();
    this.buildWater();
    this.buildTyreMarks();
    this.buildDust();
    this.buildSnow();
    this.buildAircraft();
    this.refresh();
  }

  get atmo() { return this.world.atmo; }
  get winter() { return this.settings.season === 'winter' && this.settings.location === 'hills'; }
  // In winter the showers fall as snow, unless you picked rain.
  get precip() { return this.settings.location === 'hills' ? this.atmo.rain : 0; }
  get snowAmount() { return this.winter && this.settings.weather !== 'rain' ? .3 + .7 * this.precip : 0; }
  get snowing() { return this.snowAmount > 0; }

  /* ---------- Snow: a light, slow fall of soft flakes drifting in the air around you ---------- */
  buildSnow() {
    const n = this.snowCount = 1700;
    this.snowPos = new Float32Array(n * 3); this.snowSeed = new Float32Array(n);
    for (let i = 0; i < n; i++) { this.snowPos.set([rand(-40, 40), rand(-4, 30), rand(-40, 40)], i * 3); this.snowSeed[i] = Math.random() * 100; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    const flake = canvasTexture(32, (x, n) => { const gr = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, n, n); });
    this.snow = new T.Points(g, new T.PointsMaterial({size: .17, map: flake, transparent: true, opacity: .9, depthWrite: false, sizeAttenuation: true, color: 0xffffff}));
    this.snow.frustumCulled = false; this.snowAnchor = new T.Vector3(); this.scene.add(this.snow);
  }

  updateSnow(dt) {
    const show = this.snowing; this.snow.visible = show; if (!show) return;
    const c = this.camera.position, n = Math.round((this.settings.quality === 'low' ? 600 : this.settings.quality === 'medium' ? 1100 : this.snowCount) * this.snowAmount);
    this.snow.geometry.setDrawRange(0, n);
    // Flakes live in world space; the box around the camera wraps, so driving through them feels right.
    const moveX = c.x - this.snowAnchor.x, moveY = c.y - this.snowAnchor.y, moveZ = c.z - this.snowAnchor.z; this.snowAnchor.copy(c);
    const a = this.snow.geometry.attributes.position.array, p = this.snowPos, t = this.time;
    for (let i = 0; i < n; i++) {
      const k = i * 3, sd = this.snowSeed[i];
      p[k] += Math.sin(t * .7 + sd) * .35 * dt - moveX; p[k + 1] -= (.75 + (sd % 1) * .5) * dt + moveY; p[k + 2] += Math.cos(t * .5 + sd) * .3 * dt - moveZ;
      if (p[k] < -40) p[k] += 80; else if (p[k] > 40) p[k] -= 80;
      if (p[k + 2] < -40) p[k + 2] += 80; else if (p[k + 2] > 40) p[k + 2] -= 80;
      if (p[k + 1] < -4) p[k + 1] += 34; else if (p[k + 1] > 30) p[k + 1] -= 34;
      a[k] = c.x + p[k]; a[k + 1] = c.y + p[k + 1]; a[k + 2] = c.z + p[k + 2];
    }
    this.snow.geometry.attributes.position.needsUpdate = true;
    this.snow.material.color.set(0xffffff).lerp(this.fade.set(0xaab6cc), this.atmo.night);
  }

  get raining() { return this.precip > .02 && (!this.winter || this.settings.weather === 'rain'); }

  /* ---------- Rain ---------- */
  buildRain() {
    this.dropCount = 5200;
    const pos = new Float32Array(this.dropCount * 6);
    this.drops = new Float32Array(this.dropCount * 4);
    for (let i = 0; i < this.dropCount; i++) this.drops.set([rand(-45, 45), rand(-2, 38), rand(-45, 45), rand(.8, 1.2)], i * 4);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    this.rain = new T.LineSegments(g, new T.LineBasicMaterial({color: 0xb9c6d2, transparent: true, opacity: .42, depthWrite: false}));
    this.rain.frustumCulled = false; this.scene.add(this.rain);
  }

  updateRain(dt) {
    const s = this.getState(), c = this.camera.position, count = Math.round((this.settings.quality === 'low' ? 2200 : this.settings.quality === 'medium' ? 3600 : this.dropCount) * Math.min(1, .12 + this.precip));
    this.rain.geometry.setDrawRange(0, count * 2);
    const vx = -Math.sin(s.yaw) * s.speed, vz = -Math.cos(s.yaw) * s.speed, fall = 17;
    const len = .07, arr = this.rain.geometry.attributes.position.array, d = this.drops;
    for (let i = 0; i < count; i++) {
      const k = i * 4;
      d[k + 1] -= fall * d[k + 3] * dt; d[k] += vx * dt * .15; d[k + 2] += vz * dt * .15;
      if (d[k + 1] < -3) { d[k] = rand(-45, 45); d[k + 1] = rand(30, 40); d[k + 2] = rand(-45, 45); }
      if (d[k] < -45) d[k] += 90; else if (d[k] > 45) d[k] -= 90;
      if (d[k + 2] < -45) d[k + 2] += 90; else if (d[k + 2] > 45) d[k + 2] -= 90;
      const x = c.x + d[k], y = c.y + d[k + 1] - 6, z = c.z + d[k + 2], j = i * 6;
      arr[j] = x; arr[j + 1] = y; arr[j + 2] = z;
      arr[j + 3] = x - vx * len * .4; arr[j + 4] = y + fall * d[k + 3] * len; arr[j + 5] = z - vz * len * .4;
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
  }

  /* ---------- Wet road: mirror-like puddles and raindrop ripples ---------- */
  buildPuddles() {
    this.puddleCount = 36;
    const mat = new T.MeshPhysicalMaterial({color: 0x0c1116, roughness: .06, metalness: .7, clearcoat: 1, envMapIntensity: 1.05, opacity: .82, transparent: true, alphaMap: puddleAlpha(), depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3});
    this.puddles = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat, this.puddleCount);
    this.puddles.frustumCulled = false; this.puddles.renderOrder = 2;
    this.puddleData = Array.from({length: this.puddleCount}, () => ({z: 0, off: 0, w: 1, l: 1, rot: 0}));
    this.scene.add(this.puddles);
  }

  placePuddle(p, z) {
    const half = this.world.road.half(z) - .8;
    Object.assign(p, {z, off: rand(-half, half), w: rand(1.2, 3.6), l: rand(1.6, 5.5), rot: rand(-.3, .3)});
  }

  updatePuddles(force = false) {
    const s = this.getState(), r = this.world.road, m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
    for (const p of this.puddleData) {
      if (force || p.z < s.z - 25 || p.z > s.z + 260) this.placePuddle(p, force ? s.z + rand(-20, 240) : s.z + rand(200, 260));
      const x = r.x(p.z) + p.off, y = r.y(p.z) + .064;
      e.set(0, Math.atan(r.tangent(p.z)) + p.rot, 0); q.setFromEuler(e);
      m.compose(v.set(x, y, p.z), q, sc.set(p.w, 1, p.l));
      this.puddles.setMatrixAt(this.puddleData.indexOf(p), m);
    }
    this.puddles.instanceMatrix.needsUpdate = true;
  }

  buildRipples() {
    this.rippleCount = 90;
    const ring = new T.RingGeometry(.86, 1, 24).rotateX(-Math.PI / 2);
    this.ripples = new T.InstancedMesh(ring, new T.MeshBasicMaterial({color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false}), this.rippleCount);
    this.ripples.frustumCulled = false; this.ripples.renderOrder = 3;
    this.rippleData = Array.from({length: this.rippleCount}, () => ({x: 0, y: 0, z: 0, age: rand(0, .6)}));
    this.scene.add(this.ripples);
  }

  updateRipples(dt) {
    const s = this.getState(), r = this.world.road, m = new T.Matrix4(), v = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3();
    this.rippleData.forEach((p, i) => {
      p.age += dt;
      if (p.age > .6) { p.age = 0; p.z = s.z + rand(-4, 40); const half = r.half(p.z) - .3; p.x = r.x(p.z) + rand(-half, half); p.y = r.y(p.z) + .07; if (r.tunnelAt(p.z)) p.y = -999; }
      const t = p.age / .6;
      m.compose(v.set(p.x, p.y, p.z), q, sc.setScalar(.03 + t * .13));
      this.ripples.setMatrixAt(i, m);
      this.ripples.setColorAt(i, this.fade.setScalar((1 - t) * .22));
    });
    if (this.ripples.instanceColor) this.ripples.instanceColor.needsUpdate = true;
    this.ripples.instanceMatrix.needsUpdate = true;
  }

  /* ---------- Aircraft: now and then an airliner high overhead or a helicopter low over the hills ---------- */
  buildAircraft() {
    const white = new T.MeshStandardMaterial({color: 0xf2f3f5, roughness: .45, metalness: .3}), grey = new T.MeshStandardMaterial({color: 0x9aa2aa, roughness: .5, metalness: .5});
    const add = (g, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
    // Airliner, about 38 m long, nose along +z.
    const plane = new T.Group();
    add(plane, new T.CapsuleGeometry(2, 32, 6, 12).rotateX(Math.PI / 2), white, 0, 0, 0);
    for (const s of [1, -1]) { add(plane, new T.BoxGeometry(17, .5, 5.5).translate(s * 8.5, 0, 0), white, s * 1.5, -.6, -1, 0, s * .45, 0); add(plane, new T.CylinderGeometry(1.2, 1.1, 4.5, 12).rotateX(Math.PI / 2), grey, s * 7, -1.8, 2); }
    add(plane, new T.BoxGeometry(.5, 7, 5).translate(0, 3.5, 0), white, 0, 1.2, -15, -.35, 0, 0);
    for (const s of [1, -1]) add(plane, new T.BoxGeometry(6, .35, 3).translate(s * 3, 0, 0), white, s * .8, .8, -15.5, 0, s * .4, 0);
    this.plane = plane;
    // Helicopter, about 12 m long.
    const heli = new T.Group(), body = new T.MeshStandardMaterial({color: 0xb42a24, roughness: .4, metalness: .35}), glass = new T.MeshStandardMaterial({color: 0x1a232b, roughness: .1, metalness: .6});
    add(heli, new T.SphereGeometry(1.6, 16, 12).scale(1, .95, 1.5), body, 0, 0, 0);
    add(heli, new T.SphereGeometry(1.25, 14, 10).scale(1, .8, 1), glass, 0, .25, 1.35);
    add(heli, new T.CylinderGeometry(.22, .45, 6.5, 8).rotateX(Math.PI / 2), body, 0, .35, -4.6);
    add(heli, new T.BoxGeometry(.12, 1.6, 1.1), body, 0, 1.05, -7.6);
    for (const s of [1, -1]) { add(heli, new T.BoxGeometry(.12, .12, 3.6), grey, s * 1.1, -1.65, 0); add(heli, new T.BoxGeometry(.1, .7, .1), grey, s * 1.1, -1.3, .8); add(heli, new T.BoxGeometry(.1, .7, .1), grey, s * 1.1, -1.3, -.9); }
    this.rotor = new T.Group(); this.rotor.position.y = 1.75; heli.add(this.rotor);
    for (const a of [0, Math.PI / 2]) add(this.rotor, new T.BoxGeometry(11, .06, .35), grey, 0, 0, 0, 0, a, 0);
    this.tailRotor = new T.Group(); this.tailRotor.position.set(.2, 1.05, -7.6); heli.add(this.tailRotor);
    for (const a of [0, Math.PI / 2]) add(this.tailRotor, new T.BoxGeometry(.06, 1.8, .18), grey, 0, 0, 0, a, 0, 0);
    this.heli = heli;
    for (const g of [plane, heli]) { g.visible = false; g.traverse((o) => { if (o.isMesh) o.castShadow = false; }); this.scene.add(g); }
    const trail = new T.PlaneGeometry(1, 1).translate(0, -.5, 0).rotateX(-Math.PI / 2);
    this.contrail = new T.Mesh(trail, new T.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false, side: T.DoubleSide}));
    this.contrail.visible = false; this.scene.add(this.contrail);
    this.navGlow = new GlowPoints(this.scene, 8, {fade: 3500});
    this.flight = null; this.nextFlight = rand(12, 25);
  }

  launchFlight() {
    const s = this.getState(), heli = Math.random() < .6, dir = Math.random() < .5 ? 1 : -1;
    // Kept within the view ahead: low enough to sit in the sky above the road, far enough to feel distant.
    const across = heli ? rand(650, 900) : 1400, ahead = heli ? rand(300, 520) : rand(550, 850), alt = heli ? rand(45, 80) : rand(150, 220);
    const craft = heli ? this.heli : this.plane, speed = heli ? rand(38, 50) : rand(105, 125);
    const heading = Math.atan2(dir, rand(-.35, .35) * (heli ? 1 : .4));
    craft.position.set(s.x - dir * across, this.world.road.y(s.z) + alt, s.z + ahead);
    craft.rotation.set(0, heading, 0); craft.visible = true;
    this.flight = {craft, heli, speed, heading, dir, age: 0, life: (across * 2) / speed, baseY: craft.position.y};
  }

  updateAircraft(dt) {
    const show = this.settings.location === 'hills';
    this.navGlow.begin();
    if (!this.flight) {
      this.nextFlight -= dt;
      if (show && this.nextFlight <= 0 && this.getState().started) this.launchFlight();
      if (this.contrail.visible) this.contrail.visible = false;
    }
    const f = this.flight;
    if (f) {
      f.age += dt;
      const c = f.craft, fx = Math.sin(f.heading), fz = Math.cos(f.heading);
      c.position.x += fx * f.speed * dt; c.position.z += fz * f.speed * dt;
      // Climb over any hill in the way, then settle back to cruising height.
      const clear = Math.max(f.baseY ?? c.position.y, this.world.road.terrain(c.position.x, c.position.z) + (f.heli ? 38 : 120), this.world.road.terrain(c.position.x + fx * 120, c.position.z + fz * 120) + (f.heli ? 38 : 120));
      c.position.y += (clear - c.position.y) * Math.min(1, dt * .8);
      if (f.heli) { this.rotor.rotation.y += dt * 38; this.tailRotor.rotation.x += dt * 60; c.rotation.set(.12, f.heading, Math.sin(f.age * .4) * .05); c.position.y += Math.sin(f.age * .6) * .08; }
      else c.rotation.set(0, f.heading, Math.sin(f.age * .15) * .04);
      // Contrail behind a high airliner in clear daylight.
      const trail = false;
      this.contrail.visible = trail;
      if (trail) { const len = Math.min(900, f.age * f.speed); this.contrail.position.copy(c.position).addScaledVector(new T.Vector3(fx, 0, fz), -22); this.contrail.rotation.set(0, f.heading, 0); this.contrail.scale.set(3.2, 1, len); this.contrail.material.opacity = .5; }
      // Navigation lights: red left, green right, a white tail light, and a blinking strobe and beacon.
      const night = .35 + .65 * this.atmo.night + .3 * this.atmo.golden, v = new T.Vector3(), t = this.time;
      const lights = f.heli ? [[-1.2, 0, 0, 0xff2a1a], [1.2, 0, 0, 0x2aff5a], [0, 1.6, 0, 0xff3322, 'beacon'], [0, .4, -7.8, 0xffffff]] : [[-17.5, -.2, -8, 0xff2a1a], [17.5, -.2, -8, 0x2aff5a], [0, 8, -17, 0xffffff], [0, -2.2, 2, 0xff3322, 'beacon'], [-17.5, -.2, -8.4, 0xffffff, 'strobe'], [17.5, -.2, -8.4, 0xffffff, 'strobe']];
      for (const [x, y, z, col, kind] of lights) {
        if (kind === 'beacon' && Math.floor(t * 1.2) % 2) continue;
        if (kind === 'strobe' && (t % 1.3) > .08) continue;
        v.set(x, y, z); c.localToWorld(v); this.fade.set(col);
        this.navGlow.add(v.x, v.y, v.z, this.fade, kind ? 1.6 * night + .4 : night, kind === 'strobe' ? 40 : 18);
      }
      if (f.age > f.life || !show) { c.visible = false; this.flight = null; this.nextFlight = rand(18, 45); this.contrail.visible = false; }
    }
    this.navGlow.end();
    // Distant engine rumble or rotor thud, fading with distance.
    if (this.aircraftGain) {
      const cam = this.camera.position, d = f ? f.craft.position.distanceTo(cam) : 1e4, vol = this.getVolume();
      const level = f ? vol * (f.heli ? .5 : .3) / Math.pow(1 + d / (f.heli ? 260 : 700), 2) : 0;
      this.aircraftGain.gain.setTargetAtTime(level, this.audio.currentTime, .3);
      this.aircraftFilter.frequency.setTargetAtTime(f?.heli ? 180 : 320, this.audio.currentTime, .3);
      this.rotorDepth.gain.setTargetAtTime(f?.heli ? .9 : 0, this.audio.currentTime, .3);
    }
  }

  /* ---------- Lightning and thunder ---------- */
  buildLightning() {
    this.bolt = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({color: 0xeef3ff, transparent: true, opacity: 0, fog: false}));
    this.bolt.frustumCulled = false; this.scene.add(this.bolt);
    this.flashLight = new T.DirectionalLight(0xdfe8ff, 0); this.scene.add(this.flashLight);
  }

  strike() {
    const c = this.camera.position, s = this.getState(), ahead = rand(350, 900), side = rand(-500, 500);
    const x0 = c.x + Math.sin(s.yaw) * ahead + side, z0 = c.z + Math.cos(s.yaw) * ahead, pts = [];
    let x = x0, y = 420, z = z0;
    while (y > 20) { pts.push(new T.Vector3(x, y, z)); y -= rand(18, 42); x += rand(-22, 22); z += rand(-10, 10); }
    this.bolt.geometry.dispose(); this.bolt.geometry = new T.BufferGeometry().setFromPoints(pts);
    this.flash = 1; this.flashLight.position.set(x0 - c.x, 300, z0 - c.z).normalize();
    this.flashLight.target.position.set(0, 0, 0);
    this.flashTimes = [0, .09, .2]; this.flashClock = 0;
    const distance = Math.hypot(side, ahead);
    this.thunder(distance / 343, Math.min(1, 380 / distance));
  }

  updateLightning(dt) {
    if (this.raining && this.atmo.storm && this.precip > .7) {
      this.nextStrike -= dt;
      if (this.nextStrike <= 0) { this.strike(); this.nextStrike = rand(9, 22); }
    }
    if (this.flash > 0) {
      this.flashClock += dt;
      const pulse = this.flashTimes.some((t) => this.flashClock >= t && this.flashClock < t + .06) ? 1 : 0;
      this.flash = Math.max(0, this.flash - dt * 1.6);
      const f = pulse * this.flash;
      this.bolt.material.opacity = f;
      this.flashLight.intensity = f * 3.2;
      this.hemi.intensity += f * 2.2;
      this.world.skyMaterial.uniforms.flash && (this.world.skyMaterial.uniforms.flash.value = f);
      if (this.flash === 0) this.flashLight.intensity = 0;
    }
  }

  /* ---------- Sound: rain hiss and thunder, built from noise ---------- */
  initAudio(context) {
    if (this.audio || !context) return;
    this.audio = context;
    const sr = context.sampleRate, buffer = context.createBuffer(1, sr * 2, sr), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = context.createBufferSource(); src.buffer = buffer; src.loop = true;
    const hp = context.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const lp = context.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
    this.rainGain = context.createGain(); this.rainGain.gain.value = 0;
    src.connect(hp).connect(lp).connect(this.rainGain).connect(context.destination); src.start();
    this.noise = buffer;
    // Aircraft: low filtered noise, pulsed by the rotor for a helicopter.
    const air = context.createBufferSource(); air.buffer = buffer; air.loop = true; air.playbackRate.value = .5;
    this.aircraftFilter = context.createBiquadFilter(); this.aircraftFilter.type = 'lowpass'; this.aircraftFilter.frequency.value = 300;
    const pulse = context.createGain(); pulse.gain.value = .6;
    const rotor = context.createOscillator(); rotor.frequency.value = 17; this.rotorDepth = context.createGain(); this.rotorDepth.gain.value = 0;
    rotor.connect(this.rotorDepth).connect(pulse.gain); rotor.start();
    this.aircraftGain = context.createGain(); this.aircraftGain.gain.value = 0;
    air.connect(this.aircraftFilter).connect(pulse).connect(this.aircraftGain).connect(context.destination); air.start();
  }

  thunder(delay, strength) {
    if (!this.audio) return;
    const volume = this.getVolume(); if (!volume) return;
    const ctx = this.audio, now = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true; src.playbackRate.value = .35;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900 * strength + 120, now); lp.frequency.exponentialRampToValueAtTime(90, now + 3.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(volume * (.5 + strength * .9), now + .06);
    g.gain.setTargetAtTime(volume * .35 * strength, now + .3, .4); g.gain.setTargetAtTime(0, now + 1.2, 1.1);
    src.connect(lp).connect(g).connect(ctx.destination); src.start(now); src.stop(now + 7);
  }

  updateAudio() {
    if (!this.rainGain) return;
    this.rainGain.gain.setTargetAtTime(this.raining ? this.getVolume() * .24 * Math.min(1, .25 + this.precip) * (this.inTunnel ? .25 : 1) : 0, this.audio.currentTime, .4);
  }

  /* ---------- Birds: small flocks gliding and flapping ahead of the drive ---------- */
  buildBirds() {
    const wing = new T.BufferGeometry();
    wing.setAttribute('position', new T.Float32BufferAttribute([0, 0, .18, 0, 0, -.12, .62, .02, -.05], 3));
    wing.computeVertexNormals();
    const mat = new T.MeshStandardMaterial({color: 0x23262a, roughness: .9, side: T.DoubleSide});
    const body = new T.CapsuleGeometry(.055, .32, 4, 8).rotateX(Math.PI / 2);
    this.flocks = Array.from({length: 4}, () => {
      const birds = Array.from({length: 7 + Math.floor(Math.random() * 5)}, () => {
        const g = new T.Group(), left = new T.Mesh(wing, mat), right = new T.Mesh(wing, mat);
        right.scale.x = -1; g.add(new T.Mesh(body, mat), left, right); g.scale.setScalar(rand(.9, 1.3)); this.scene.add(g);
        return {g, left, right, off: new T.Vector3(rand(-9, 9), rand(-3, 3), rand(-9, 9)), phase: rand(0, 6.28), rate: rand(7, 10)};
      });
      return {birds, center: new T.Vector3(), angle: rand(0, 6.28), radius: rand(18, 45), height: rand(16, 38), speed: rand(.12, .22), ahead: rand(60, 220), side: rand(-90, 90)};
    });
  }

  updateBirds(dt) {
    const show = this.settings.location === 'hills' && this.atmo.night < .5 && this.precip < .3;
    const s = this.getState(), fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    for (const f of this.flocks) {
      for (const b of f.birds) b.g.visible = show;
      if (!show) continue;
      f.angle += f.speed * dt;
      const baseX = s.x + fx * f.ahead + fz * f.side, baseZ = s.z + fz * f.ahead - fx * f.side;
      if (!f.placed || Math.hypot(f.center.x - baseX, f.center.z - baseZ) > 260) { f.center.set(baseX, 0, baseZ); f.placed = true; f.ahead = rand(80, 240); f.side = rand(-100, 100); }
      const ground = this.world.road.y(f.center.z);
      const cx = f.center.x + Math.cos(f.angle) * f.radius, cz = f.center.z + Math.sin(f.angle) * f.radius, heading = Math.atan2(-Math.sin(f.angle), Math.cos(f.angle));
      for (const b of f.birds) {
        b.phase += dt * b.rate;
        const glide = Math.sin(b.phase * .13) > .45, flap = glide ? .12 : Math.sin(b.phase) * .75;
        b.left.rotation.z = flap; b.right.rotation.z = -flap;
        b.g.position.set(cx + b.off.x, ground + f.height + b.off.y + Math.sin(b.phase * .21) * .6, cz + b.off.z);
        b.g.rotation.set(0, heading + Math.PI / 2 * Math.sign(f.speed), Math.sin(f.angle * 2) * .15);
      }
    }
  }

  /* ---------- Water: a real reflective surface for lakes and valleys ---------- */
  buildWater() {
    this.water = new Water(new T.PlaneGeometry(6000, 6000), {textureWidth: 512, textureHeight: 512, waterNormals: waterNormals(), sunDirection: new T.Vector3(-.5, .48, .65).normalize(), sunColor: 0xfff2d6, waterColor: 0x1d3b44, distortionScale: 2.4, fog: true, alpha: 1});
    this.water.rotation.x = -Math.PI / 2; this.water.position.y = this.world.water.position.y + .05;
    this.water.material.uniforms.size.value = 2.2;
    addMist(this.water.material.uniforms);
    this.scene.add(this.water);
  }

  updateWater(dt) {
    const use = this.settings.location === 'hills' && this.settings.quality !== 'low';
    this.water.visible = use;
    this.world.water.visible = !use && this.settings.location === 'hills';
    if (!use) return;
    const c = this.camera.position;
    this.water.position.x = Math.round(c.x / 50) * 50; this.water.position.z = Math.round(c.z / 50) * 50;
    const u = this.water.material.uniforms;
    u.time.value += dt * (this.raining ? 1.6 : .7);
    u.sunDirection.value.copy(this.world.lightDir);
    const a = this.atmo, wet = Math.min(1, this.precip * 1.5);
    u.waterColor.value.set(0x1d3b44).lerp(this.fade.set(0x33403f), a.golden).lerp(this.fade.set(0x2a3a40), wet).lerp(this.fade.set(0x08141c), a.night);
    u.sunColor.value.set(0xfff2d6).lerp(this.fade.set(0xffa050), a.golden).lerp(this.fade.set(0x6a7680), wet).lerp(this.fade.set(0x8fa6d8), a.night);
    u.distortionScale.value = 2.4 + 2.6 * wet;
  }

  /* ---------- Settings changes ---------- */
  refresh() { this.base = {hemi: this.hemi.intensity, sun: this.sun.intensity}; this.wetShown = -1; this.updateWet(true); }

  // Rain soaks the road and it dries slowly afterwards; winter slush and spring showers leave it damp and glossy.
  updateWet(force = false) {
    const hills = this.settings.location === 'hills', a = this.atmo;
    const damp = Math.max(hills ? a.wet : 0, hills && this.settings.season === 'winter' ? .42 : hills && this.settings.season === 'spring' ? .3 : 0);
    const key = Math.round(damp * 50) + (a.golden > .5 ? 100 : 0);
    if (!force && key === this.wetShown) return;
    this.wetShown = key;
    const soaked = hills && a.wet > .5, low = a.golden > .5;
    for (const road of this.world.allRoadMats) {
      road.userData.base ||= road.color.clone();
      road.roughness = Math.min(.96, this.original.roadRough + (low ? .06 : 0) + ((soaked ? .32 : .5) - this.original.roadRough) * damp);
      road.envMapIntensity = this.original.roadEnv * (low ? .75 : 1) + ((soaked ? 1.5 : 1.15) - this.original.roadEnv) * damp;
      road.color.copy(road.userData.base).multiplyScalar(1 - .38 * damp);
    }
    this.world.groundMat.roughness = soaked ? .82 : this.original.groundRough;
    this.puddles.visible = soaked && a.wet > .55;
    if (this.puddles.visible && !this.puddlesPlaced) { this.updatePuddles(true); this.puddlesPlaced = true; }
    if (!this.puddles.visible) this.puddlesPlaced = false;
  }

  /* ---------- Tyres: skid marks on hard braking or cornering, dust off the road, spray in the rain ---------- */
  buildTyreMarks() {
    this.markCount = 700; this.markNext = 0; this.markTravel = 0; this.lastMark = null;
    const mat = new T.MeshBasicMaterial({color: 0x050505, transparent: true, opacity: .38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
    this.marks = new T.InstancedMesh(new T.PlaneGeometry(.24, 1).rotateX(-Math.PI / 2), mat, this.markCount);
    this.marks.frustumCulled = false;
    const hidden = new T.Matrix4().makeTranslation(0, -9999, 0);
    for (let i = 0; i < this.markCount; i++) this.marks.setMatrixAt(i, hidden);
    this.scene.add(this.marks);
  }

  wheelSpots(s) {
    const v = this.settings.vehicle, back = v === 'coach' ? -3.2 : v === 'bike' ? -.75 : -1.3, sides = v === 'bike' ? [0] : v === 'coach' ? [-1.05, 1.05] : [-.8, .8];
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    return sides.map((side) => ({x: s.x + fx * back + fz * side, z: s.z + fz * back - fx * side}));
  }

  updateTyreMarks(dt) {
    const s = this.getState(), speed = Math.abs(s.speed || 0);
    const skidding = s.started && s.grounded !== false && !s.offroad && this.settings.location === 'hills' && speed > 5 && ((s.slip || 0) > .35 || ((s.brakeIn || 0) > .7 && speed > 9));
    if (!skidding) { this.lastMark = null; return; }
    this.markTravel += speed * dt;
    if (this.markTravel < .45) return;
    const spots = this.wheelSpots(s), m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1), v = new T.Vector3(), up = new T.Vector3(0, 1, 0);
    spots.forEach((p, i) => {
      const prev = this.lastMark?.[i];
      const len = prev ? Math.hypot(p.x - prev.x, p.z - prev.z) : this.markTravel;
      const cx = prev ? (p.x + prev.x) / 2 : p.x, cz = prev ? (p.z + prev.z) / 2 : p.z;
      const yaw = prev ? Math.atan2(p.x - prev.x, p.z - prev.z) : s.yaw;
      q.setFromAxisAngle(up, yaw); sc.set(1, 1, Math.min(2, len + .05));
      m.compose(v.set(cx, this.world.groundHeight(cx, cz) + .015, cz), q, sc);
      this.marks.setMatrixAt(this.markNext, m); this.markNext = (this.markNext + 1) % this.markCount;
    });
    this.marks.instanceMatrix.needsUpdate = true;
    this.lastMark = spots; this.markTravel = 0;
  }

  buildDust() {
    const n = this.dustCount = 360;
    this.dustPos = new Float32Array(n * 3).fill(-9999); this.dustVel = new Float32Array(n * 3); this.dustLife = new Float32Array(n); this.dustAlpha = new Float32Array(n); this.dustCol = new Float32Array(n * 4);
    this.dustNext = 0; this.dustSpawn = 0;
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(this.dustPos, 3));
    g.setAttribute('color', new T.BufferAttribute(this.dustCol, 4));
    const puff = canvasTexture(64, (x, n) => { const gr = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, n, n); });
    this.dust = new T.Points(g, new T.PointsMaterial({size: 1.6, map: puff, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true}));
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  updateDust(dt) {
    const s = this.getState(), speed = Math.abs(s.speed || 0), n = this.dustCount;
    const hills = this.settings.location === 'hills', winter = hills && this.settings.season === 'winter';
    const dusty = s.started && s.grounded !== false && s.offroad && speed > 3, spray = s.started && this.raining && !s.offroad && speed > 6;
    let tint = null;
    if (dusty) tint = winter ? [.92, .94, .97, .5] : hills ? [.62, .54, .42, .42] : ({mars: [.72, .38, .22, .5], moon: [.62, .62, .62, .5], venus: [.78, .62, .36, .5]}[this.settings.planet] || [.6, .5, .4, .45]);
    else if (spray) tint = [.82, .86, .9, .3];
    if (tint && this.settings.quality !== 'low') {
      this.dustSpawn += dt * Math.min(70, speed * (dusty ? 2.6 : 1.8));
      const spots = this.wheelSpots(s), fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
      while (this.dustSpawn >= 1) {
        this.dustSpawn--;
        const p = spots[this.dustNext % spots.length], i = this.dustNext, k = i * 3;
        this.dustPos[k] = p.x + rand(-.2, .2); this.dustPos[k + 1] = this.world.groundHeight(p.x, p.z) + .15; this.dustPos[k + 2] = p.z + rand(-.2, .2);
        const back = speed * rand(.08, .2);
        this.dustVel[k] = -fx * back + rand(-.8, .8); this.dustVel[k + 1] = rand(.6, dusty ? 1.8 : 1.2); this.dustVel[k + 2] = -fz * back + rand(-.8, .8);
        this.dustLife[i] = 1; this.dustCol.set(tint, i * 4); this.dustAlpha[i] = tint[3];
        this.dustNext = (this.dustNext + 1) % n;
      }
    }
    for (let i = 0; i < n; i++) {
      if (this.dustLife[i] <= 0) continue;
      const k = i * 3, drag = Math.exp(-dt * 1.8);
      this.dustLife[i] -= dt * .75;
      this.dustVel[k] *= drag; this.dustVel[k + 2] *= drag; this.dustVel[k + 1] = this.dustVel[k + 1] * drag + .15 * dt;
      this.dustPos[k] += this.dustVel[k] * dt; this.dustPos[k + 1] += this.dustVel[k + 1] * dt; this.dustPos[k + 2] += this.dustVel[k + 2] * dt;
      const life = Math.max(0, this.dustLife[i]);
      this.dustCol[i * 4 + 3] = this.dustAlpha[i] * life * Math.min(1, (1 - life) / .12 + .1);
      if (life <= 0) this.dustPos[k + 1] = -9999;
    }
    this.dust.geometry.attributes.position.needsUpdate = true;
    this.dust.geometry.attributes.color.needsUpdate = true;
  }

  update(dt) {
    this.time += dt;
    this.updateTyreMarks(dt);
    this.updateDust(dt);
    this.updateSnow(dt);
    this.updateAircraft(dt);
    const rain = this.raining;
    this.rain.visible = rain; this.ripples.visible = rain && this.precip > .08;
    this.rain.material.opacity = .42 * Math.min(1, .35 + this.precip);
    this.rain.material.color.set(0xb9c6d2).lerp(this.fade.set(0x6d7a88), this.atmo.night);
    if (rain) { this.updateRain(dt); if (this.ripples.visible) this.updateRipples(dt); }
    this.updateWet();
    if (this.puddles.visible) this.updatePuddles();
    if (!rain && this.flash) { this.flash = 0; this.bolt.material.opacity = 0; this.flashLight.intensity = 0; }
    this.updateLightning(dt);
    this.updateBirds(dt);
    this.updateWater(dt);
    this.updateAudio();
  }
}
