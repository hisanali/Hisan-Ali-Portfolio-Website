import * as T from './vendor/three.module.js';
import {Water} from './vendor/objects/Water.js';

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
    this.buildRain();
    this.buildPuddles();
    this.buildRipples();
    this.buildLightning();
    this.buildBirds();
    this.buildWater();
    this.refresh();
  }

  get raining() { return this.settings.weather === 'rain' && this.settings.location === 'hills'; }

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
    const s = this.getState(), c = this.camera.position, count = this.settings.quality === 'low' ? 2200 : this.settings.quality === 'medium' ? 3600 : this.dropCount;
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
    const half = this.settings.roadWidth / 2 - .8;
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
    const half = this.settings.roadWidth / 2 - .3;
    this.rippleData.forEach((p, i) => {
      p.age += dt;
      if (p.age > .6) { p.age = 0; p.z = s.z + rand(-4, 40); p.x = r.x(p.z) + rand(-half, half); p.y = r.y(p.z) + .07; }
      const t = p.age / .6;
      m.compose(v.set(p.x, p.y, p.z), q, sc.setScalar(.03 + t * .13));
      this.ripples.setMatrixAt(i, m);
      this.ripples.setColorAt(i, this.fade.setScalar((1 - t) * .22));
    });
    if (this.ripples.instanceColor) this.ripples.instanceColor.needsUpdate = true;
    this.ripples.instanceMatrix.needsUpdate = true;
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
    if (this.raining) {
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
      this.hemi.intensity = this.base.hemi + f * 2.2;
      this.world.skyMaterial.uniforms.flash && (this.world.skyMaterial.uniforms.flash.value = f);
      if (this.flash === 0) { this.hemi.intensity = this.base.hemi; this.flashLight.intensity = 0; }
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
    this.rainGain.gain.setTargetAtTime(this.raining ? this.getVolume() * .22 : 0, this.audio.currentTime, .4);
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
    const show = this.settings.location === 'hills' && this.settings.time !== 'night' && !this.raining;
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
    u.sunDirection.value.copy(this.world.skyMaterial.uniforms.sunDirection.value);
    const night = this.settings.time === 'night', sunset = this.settings.time === 'sunset';
    u.waterColor.value.set(night ? 0x08141c : this.raining ? 0x2a3a40 : sunset ? 0x33403f : 0x1d3b44);
    u.sunColor.value.set(night ? 0x223044 : sunset ? 0xffb070 : this.raining ? 0x6a7680 : 0xfff2d6);
    u.distortionScale.value = this.raining ? 5 : 2.4;
  }

  /* ---------- Settings changes ---------- */
  refresh() {
    this.base = {hemi: this.hemi.intensity, sun: this.sun.intensity};
    const wet = this.raining, road = this.world.roadMat;
    road.roughness = wet ? .32 : this.original.roadRough;
    road.envMapIntensity = wet ? 1.6 : this.original.roadEnv;
    if (wet) road.color.multiplyScalar(.62);
    this.world.groundMat.roughness = wet ? .82 : this.original.groundRough;
    road.needsUpdate = true;
    this.rain.visible = this.puddles.visible = this.ripples.visible = wet;
    this.rain.material.color.set(this.settings.time === 'night' ? 0x6d7a88 : 0xb9c6d2);
    if (!wet) { this.flash = 0; this.bolt.material.opacity = 0; this.flashLight.intensity = 0; }
    if (wet) this.updatePuddles(true);
  }

  update(dt) {
    this.time += dt;
    if (this.raining) { this.updateRain(dt); this.updatePuddles(); this.updateRipples(dt); }
    this.updateLightning(dt);
    this.updateBirds(dt);
    this.updateWater(dt);
    this.updateAudio();
  }
}
