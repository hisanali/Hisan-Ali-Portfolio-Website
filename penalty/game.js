import * as T from '../evermile/vendor/three.module.js';
import { GLTFLoader } from '../evermile/vendor/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from '../evermile/vendor/utils/SkeletonUtils.js';

/* ---------- Constants (metres, seconds) ---------- */
const GOAL_W = 7.32, GOAL_H = 2.44, HALF_W = GOAL_W / 2, SPOT = 11, R = .11, POST = .06, G = 9.81, NET_D = 2.1;
const LEVELS = { easy: { save: .25, react: .3, reach: 2.6, shooterMiss: .2, shooterCorner: .5 }, normal: { save: .45, react: .22, reach: 3.1, shooterMiss: .1, shooterCorner: .7 }, hard: { save: .62, react: .16, reach: 3.5, shooterMiss: .05, shooterCorner: .88 } };
const $ = id => document.getElementById(id);
const settings = { level: 'normal', kit: 'red', sound: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem('penalty-settings') || '{}')); } catch {}
const save = () => { try { localStorage.setItem('penalty-settings', JSON.stringify(settings)); } catch {} };
const KITS = { red: ['#c8102e', '#1b1b1b'], white: ['#f3f3f3', '#1b1b1b'], blue: ['#1d4fb8', '#f3f3f3'], green: ['#0f7a3e', '#1b1b1b'] };

/* ---------- Renderer & scene ---------- */
const canvas = $('scene');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.fog = new T.Fog('#0b1220', 45, 140);
const camera = new T.PerspectiveCamera(42, 1, .05, 400);

const tex = (cv, srgb = true) => { const t = new T.CanvasTexture(cv); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
const canvas2d = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };

// Night sky
scene.background = tex(canvas2d(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#02040b'); gr.addColorStop(.55, '#0b1630'); gr.addColorStop(1, '#1c2a44'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
{ // reflections from floodlights
  const env = new T.Scene(); env.add(new T.Mesh(new T.BoxGeometry(60, 30, 60), new T.MeshBasicMaterial({ color: '#10182a', side: T.BackSide })));
  for (const [x, z] of [[-25, -25], [25, -25], [-25, 25], [25, 25]]) { const m = new T.Mesh(new T.PlaneGeometry(8, 4), new T.MeshBasicMaterial({ color: new T.Color('#fff6e6').multiplyScalar(6) })); m.position.set(x, 14, z); m.lookAt(0, 0, 0); env.add(m); }
  const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, .04).texture; pm.dispose();
}

scene.add(new T.HemisphereLight('#bcd2ff', '#1c3a17', .55));
const flood = new T.DirectionalLight('#fff4e2', 2.6); flood.position.set(-18, 30, 22); flood.castShadow = true;
Object.assign(flood.shadow.camera, { left: -14, right: 14, top: 14, bottom: -6, near: 5, far: 80 }); flood.shadow.mapSize.set(2048, 2048); flood.shadow.bias = -.0004; flood.shadow.normalBias = .03;
flood.target.position.set(0, 0, 4); scene.add(flood, flood.target);
const fill = new T.DirectionalLight('#cfe0ff', .7); fill.position.set(20, 22, 10); scene.add(fill);

/* ---------- Pitch ---------- */
const grassTex = tex(canvas2d(1024, 1024, (g, w, h) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#2f7d32' : '#37893a'; g.fillRect(0, i * h / 8, w, h / 8); }
  for (let i = 0; i < 90000; i++) { const s = Math.random(); g.fillStyle = s < .5 ? 'rgba(20,60,20,.18)' : 'rgba(150,210,120,.12)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3); }
}));
grassTex.wrapS = grassTex.wrapT = T.RepeatWrapping; grassTex.repeat.set(6, 6);
const pitch = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshStandardMaterial({ map: grassTex, roughness: .95 }));
pitch.rotation.x = -Math.PI / 2; pitch.position.z = 20; pitch.receiveShadow = true; scene.add(pitch);
{ // markings: penalty area, goal area, spot, arc, goal line
  const PX = 40, W = 46, D = 24, cv = canvas2d(W * PX, D * PX, (g) => {
    g.strokeStyle = 'rgba(255,255,255,.92)'; g.fillStyle = 'rgba(255,255,255,.92)'; g.lineWidth = .12 * PX;
    const X = x => (x + W / 2) * PX, Z = z => (z + 1) * PX;
    g.beginPath(); g.moveTo(0, Z(0)); g.lineTo(W * PX, Z(0)); g.stroke();
    g.strokeRect(X(-20.16), Z(0), 40.32 * PX, 16.5 * PX); g.strokeRect(X(-9.16), Z(0), 18.32 * PX, 5.5 * PX);
    g.beginPath(); g.arc(X(0), Z(SPOT), .15 * PX, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.rect(0, Z(16.5), W * PX, D * PX); g.clip(); g.beginPath(); g.arc(X(0), Z(SPOT), 9.15 * PX, 0, Math.PI * 2); g.stroke(); g.restore();
  });
  const lines = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: tex(cv), transparent: true, roughness: .9, depthWrite: false }));
  lines.rotation.x = -Math.PI / 2; lines.position.set(0, .006, D / 2 - 1); lines.receiveShadow = true; scene.add(lines);
}

/* ---------- Goal & net ---------- */
const white = new T.MeshPhysicalMaterial({ color: '#ffffff', roughness: .25, clearcoat: 1 });
const postGeo = new T.CylinderGeometry(POST, POST, GOAL_H + POST, 24);
for (const x of [-HALF_W - POST, HALF_W + POST]) { const p = new T.Mesh(postGeo, white); p.position.set(x, (GOAL_H + POST) / 2, 0); p.castShadow = true; scene.add(p); }
const bar = new T.Mesh(new T.CylinderGeometry(POST, POST, GOAL_W + POST * 4, 24), white); bar.rotation.z = Math.PI / 2; bar.position.set(0, GOAL_H + POST, 0); bar.castShadow = true; scene.add(bar);
for (const x of [-HALF_W - POST, HALF_W + POST]) { // back supports
  const s = new T.Mesh(new T.CylinderGeometry(.025, .025, 2.2, 8), white); s.position.set(x, 1.1, -NET_D); scene.add(s);
  const t = new T.Mesh(new T.CylinderGeometry(.025, .025, Math.hypot(NET_D, .5), 8), white); t.rotation.x = Math.atan2(NET_D, .5); t.position.set(x, 2.2 + .25, -NET_D / 2); scene.add(t);
}

class NetPanel {
  constructor(corner, u, v, nu, nv) {
    this.base = []; const idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) this.base.push(new T.Vector3().copy(corner).addScaledVector(u, i / nu).addScaledVector(v, j / nv));
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; if (i < nu) idx.push(k, k + 1); if (j < nv) idx.push(k, k + nu + 1); }
    this.geo = new T.BufferGeometry().setFromPoints(this.base); this.geo.setIndex(idx);
    this.mesh = new T.LineSegments(this.geo, new T.LineBasicMaterial({ color: '#e9eef5', transparent: true, opacity: .55 })); scene.add(this.mesh);
    this.offset = this.base.map(() => new T.Vector3()); this.vel = this.base.map(() => new T.Vector3());
  }
  hit(point, push) { this.base.forEach((b, k) => { const d = b.distanceToSquared(point); this.vel[k].addScaledVector(push, Math.exp(-d / .6) * 9); }); }
  update(dt) {
    const pos = this.geo.attributes.position; let moving = false;
    this.base.forEach((b, k) => { const o = this.offset[k], v = this.vel[k]; v.addScaledVector(o, -60 * dt).multiplyScalar(Math.exp(-6 * dt)); o.addScaledVector(v, dt); if (o.lengthSq() > 1e-6) moving = true; pos.setXYZ(k, b.x + o.x, b.y + o.y, b.z + o.z); });
    if (moving) pos.needsUpdate = true;
  }
}
const nets = [
  new NetPanel(new T.Vector3(-HALF_W, 0, -NET_D), new T.Vector3(GOAL_W, 0, 0), new T.Vector3(0, 2.2, 0), 44, 14),
  new NetPanel(new T.Vector3(-HALF_W, GOAL_H, 0), new T.Vector3(GOAL_W, 0, 0), new T.Vector3(0, -.24, -NET_D), 44, 12),
  new NetPanel(new T.Vector3(-HALF_W, 0, 0), new T.Vector3(0, 0, -NET_D), new T.Vector3(0, GOAL_H, 0), 12, 15),
  new NetPanel(new T.Vector3(HALF_W, 0, 0), new T.Vector3(0, 0, -NET_D), new T.Vector3(0, GOAL_H, 0), 12, 15)
];

/* ---------- Stadium ---------- */
const crowdTex = tex(canvas2d(2048, 512, (g, w, h) => {
  const rows = 4, rh = h / rows, shirts = ['#c8102e', '#c8102e', '#e9e9e9', '#c8102e', '#1d4fb8', '#d8d8d8', '#0f7a3e', '#f2c230', '#2a2a2a', '#c8102e'], skins = ['#d9a982', '#a8744f', '#7a4f31', '#eac4a3'];
  for (let r = 0; r < rows; r++) {
    g.fillStyle = r % 2 ? '#1a2238' : '#151c30'; g.fillRect(0, r * rh, w, rh);
    for (let x = -20; x < w + 20; x += 52 + Math.random() * 18) {
      if (Math.random() < .08) continue;
      const cx = x + Math.random() * 10, base = (r + 1) * rh - 6, tall = rh * (.62 + Math.random() * .12), shirt = shirts[Math.floor(Math.random() * shirts.length)];
      g.fillStyle = shirt; g.beginPath(); g.roundRect(cx - 21, base - tall * .55, 42, tall * .55, 14); g.fill();
      g.fillStyle = skins[Math.floor(Math.random() * 4)]; g.beginPath(); g.arc(cx, base - tall * .7, 14, 0, 7); g.fill();
      if (Math.random() < .3) { g.fillStyle = shirt; g.fillRect(cx + 16, base - tall * 1.05, 9, tall * .5); }
    }
  }
}));
crowdTex.wrapS = T.RepeatWrapping;
const stand = (w, h, pos, rotY) => {
  const t = crowdTex.clone(); t.needsUpdate = true; t.repeat.set(w / 20, h / 5);
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, roughness: 1, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .38 }));
  m.position.copy(pos); m.rotation.set(-.55, rotY, 0, 'YXZ'); scene.add(m); return m;
};
stand(110, 26, new T.Vector3(0, 9, -22), 0);
stand(80, 26, new T.Vector3(-34, 9, 12), Math.PI / 2);
stand(80, 26, new T.Vector3(34, 9, 12), -Math.PI / 2);
stand(110, 26, new T.Vector3(0, 9, 58), Math.PI);
{ // roof edge & floodlight towers
  for (const [x, z] of [[-30, -20], [30, -20], [-34, 34], [34, 34]]) {
    const pole = new T.Mesh(new T.CylinderGeometry(.35, .5, 30, 8), new T.MeshStandardMaterial({ color: '#3a4256', roughness: .6 })); pole.position.set(x, 15, z); scene.add(pole);
    const lamp = new T.Mesh(new T.BoxGeometry(6, 3, .5), new T.MeshBasicMaterial({ color: '#fffbea' })); lamp.position.set(x, 30, z); lamp.lookAt(0, 0, 6); scene.add(lamp);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: tex(canvas2d(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,230,1)'); gr.addColorStop(.25, 'rgba(255,240,200,.45)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); })), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    glow.scale.set(22, 22, 1); glow.position.copy(lamp.position); scene.add(glow);
  }
}
// LED advertising boards
const adCanvas = canvas2d(2048, 64, (g, w, h) => {
  g.fillStyle = '#05070d'; g.fillRect(0, 0, w, h);
  const items = [['HISAN ALI', '#dfff63'], ['DIGITAL MARKETING · MUSCAT', '#ffffff'], ['PLAY MORE AT HISANALI.COM', '#ff6a55'], ['SEO · ADS · ANALYTICS', '#66a6ff']];
  g.font = '800 38px Manrope, Arial, sans-serif'; g.textBaseline = 'middle'; let x = 20;
  while (x < w) for (const [t, c] of items) { g.fillStyle = c; g.fillText(t, x, h / 2 + 2); x += g.measureText(t).width + 70; }
});
const adTex = tex(adCanvas); adTex.wrapS = T.RepeatWrapping; adTex.repeat.set(2, 1);
const boards = new T.Mesh(new T.BoxGeometry(60, .9, .15), [0, 0, 0, 0, 1, 0].map(f => f ? new T.MeshBasicMaterial({ map: adTex, toneMapped: false }) : new T.MeshStandardMaterial({ color: '#0b0e16' })));
boards.position.set(0, .45, -5.5); scene.add(boards);

/* ---------- Ball ---------- */
const ballTex = tex(canvas2d(1024, 512, (g, w, h) => {
  g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let k = 0; k < 6; k++) { g.strokeStyle = ['#111', '#c8102e', '#111', '#1d4fb8', '#111', '#c8102e'][k]; g.lineWidth = 26; g.beginPath(); const y0 = 60 + k * 75; for (let x = 0; x <= w; x += 16) { const y = y0 + Math.sin(x / w * Math.PI * 4 + k) * 40; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
}));
const ball = new T.Mesh(new T.SphereGeometry(R, 48, 32), new T.MeshPhysicalMaterial({ map: ballTex, roughness: .4, clearcoat: .8, clearcoatRoughness: .2 }));
ball.castShadow = true; scene.add(ball);

/* ---------- People ---------- */
// Realistic rigged humans (MakeHuman CC0 bodies from Evermile), recoloured into football kits and posed bone by bone.
const BODY = { shooter: 'pedestrian-0', keeper: 'pedestrian-0' }, gltfs = {};
const bodiesReady = Promise.all(Object.entries(BODY).map(([k, f]) => new Promise((res, rej) => new GLTFLoader().load(`../evermile/assets/models/${f}.glb?v=1`, g => { gltfs[k] = g; res(); }, undefined, rej))));
class Rig {
  constructor(kind, shirt, trousers, gloves) {
    const g = gltfs[kind], model = cloneSkinned(g.scene); this.root = new T.Group(); this.root.add(model);
    const box = new T.Box3().setFromObject(model), h = box.max.y - box.min.y, k = 1.82 / h; model.scale.setScalar(k); model.position.y = -box.min.y * k; this.k = k; this.model = model;
    model.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
      o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(m => { const c = m.clone(); const n = m.name;
        if (n.startsWith('Cloth_Shirt')) { c.color.set(shirt); c.roughness = .62; c.map = null; }
        else if (n.startsWith('Cloth_Trousers')) { c.color.set(trousers); c.roughness = .7; c.map = null; }
        else if (n.startsWith('Leather_Shoes')) { c.color.set('#111'); c.roughness = .35; }
        else if (n.startsWith('Hair')) c.visible = false;
        return c; });
      if (o.material.length === 1) o.material = o.material[0]; });
    this.bones = {}; model.traverse(o => { if (o.isBone) this.bones[o.name] = o; });
    this.rest = Object.fromEntries(Object.entries(this.bones).map(([n, b]) => [n, b.quaternion.clone()]));
    this.restHips = this.bones.Hips.position.clone();
    this.mixer = new T.AnimationMixer(model); this.clips = Object.fromEntries(g.animations.map(a => [a.name, this.mixer.clipAction(a)]));
    if (gloves) for (const hand of ['lHand', 'rHand']) { const m = new T.Mesh(new T.SphereGeometry(.07 / k, 16, 12), new T.MeshStandardMaterial({ color: gloves, roughness: .5 })); m.scale.set(1, 1.35, .7); m.position.y = .06 / k; m.castShadow = true; this.bones[hand].add(m); }
    this.anim = null; scene.add(this.root);
  }
  play(name, speed = 1) { this.anim = name; Object.values(this.clips).forEach(a => a.stop()); const a = this.clips[name]; a.reset().play(); a.timeScale = speed; }
  // Sets bones to rest pose plus Euler offsets (radians); stops clip playback.
  pose(offsets, hipsDrop = 0) {
    if (this.anim) { Object.values(this.clips).forEach(a => a.stop()); this.anim = null; }
    for (const [n, b] of Object.entries(this.bones)) { b.quaternion.copy(this.rest[n]); const o = offsets[n]; if (o) b.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(o[0] || 0, o[1] || 0, o[2] || 0))); }
    this.bones.Hips.position.copy(this.restHips); this.bones.Hips.position.y -= hipsDrop / this.k;
  }
  update(dt) { if (this.anim) this.mixer.update(dt); }
  dispose() { scene.remove(this.root); }
}
const mix = (a, b, t) => a + (b - a) * t;
let keeper, shooter;
function dressTeams(youShoot) {
  keeper?.dispose(); shooter?.dispose();
  const [you, youShorts] = KITS[settings.kit] || KITS.red, cpu = settings.kit === 'white' ? ['#1d1d1d', '#1d1d1d'] : ['#f3f3f3', '#1d1d1d'];
  keeper = new Rig('keeper', youShoot ? '#f2c230' : '#22c46e', '#1b1b1b', '#f4f4f4');
  shooter = new Rig('shooter', youShoot ? you : cpu[0], '#141414');
  shooter.play('Idle');
}

/* ---------- Sound ---------- */
const sound = {
  ctx() { if (!this.c) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.c = new A(); this.crowdGain = null; } if (this.c.state === 'suspended') this.c.resume(); return this.c; },
  noise(len, vol, type, freq, q = 1) { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const b = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(), t = c.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.3, len * .25)); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(f).connect(g).connect(c.destination); s.start(); },
  kick() { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g).connect(c.destination); o.start(); o.stop(t + .2); this.noise(.06, .4, 'bandpass', 900, 1.5); },
  whistle() { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.frequency.value = 2900; lfo.frequency.value = 38; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .02); g.gain.setValueAtTime(.12, t + .32); g.gain.linearRampToValueAtTime(0, t + .4); o.connect(g).connect(c.destination); o.start(); lfo.start(); o.stop(t + .45); lfo.stop(t + .45); },
  cheer() { this.noise(3.2, .5, 'bandpass', 1100, .5); this.noise(2.5, .25, 'lowpass', 500); },
  groan() { this.noise(1.8, .3, 'lowpass', 380); },
  net() { this.noise(.35, .35, 'highpass', 2500); },
  post() { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime; [420, 1130, 2210].forEach(f => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .9); o.connect(g).connect(c.destination); o.start(); o.stop(t + 1); }); },
  ambience() { if (!settings.sound || this.amb) return; const c = this.ctx(); if (!c) return; const b = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = .4; const g = c.createGain(); g.gain.value = .045; s.connect(f).connect(g).connect(c.destination); s.start(); this.amb = g; },
  setAmbience(on) { if (this.amb) this.amb.gain.value = on && settings.sound ? .045 : 0; }
};

/* ---------- Game state ---------- */
let mode = null, phase = 'menu', score = { you: [], cpu: [] }, round = 0, youShooting = true, streak = 0, best = Number(localStorage.getItem('penalty-best') || 0);
let ballState = null, keeperState = null, timeScale = 1, camTarget = null, swipe = null, tapAim = null;
const level = () => LEVELS[settings.level] || LEVELS.normal;

function setupKick(youShoot) {
  youShooting = youShoot; dressTeams(youShoot);
  ball.position.set(0, R, SPOT); ball.rotation.set(0, 0, 0);
  keeperState = { x: 0, y: 0, start: 0, from: new T.Vector3(0, 1, 0), to: null, dur: .6, diving: false, t: 0 };
  keeper.root.position.set(0, 0, .35); keeper.root.rotation.set(0, 0, 0);
  shooter.root.position.set(youShoot ? -.95 : -1.4, 0, SPOT + (youShoot ? 1.0 : 2.6)); shooter.root.rotation.set(0, Math.PI + (youShoot ? .35 : .45), 0);
  shooter.root.visible = true;
  ballState = null; timeScale = 1; tapAim = null;
  camTarget = youShoot ? { pos: new T.Vector3(.5, 2.35, SPOT + 7), look: new T.Vector3(0, .9, 0) } : { pos: new T.Vector3(1.1, 2.0, -4.3), look: new T.Vector3(-.2, .85, SPOT) };
  if (mode) { camera.position.copy(camTarget.pos); camTarget.cur = camTarget.look.clone(); camera.lookAt(camTarget.cur); }
  phase = youShoot ? 'aim' : 'cpu-runup';
  if (!youShoot) setTimeout(() => cpuShoot(), 1600);
  hud();
}

/* ---------- Shooting ---------- */
function kick(target, flight, curl, byYou) {
  // Solve the launch so the ball reaches `target` (on the goal plane) after `flight` seconds with sideways curl acceleration.
  const p0 = ball.position.clone(), t = flight, dz = target.z - p0.z;
  const v = new T.Vector3((target.x - p0.x - .5 * curl * t * t) / t, (target.y - p0.y + .5 * G * t * t) / t, dz / t);
  ballState = { v, curl, spin: new T.Vector3(-v.z * 3, curl * 2, 0), time: 0, crossed: false, result: null, byYou, done: false, rest: 0 };
  sound.kick(); phase = 'flight';
  if (byYou) strike();
  // Keeper reaction
  if (byYou) {
    const L = level(), guessRight = Math.random() < L.save, side = Math.random() < .5 ? -1 : 1;
    const aim = guessRight ? new T.Vector3(target.x + (Math.random() - .5) * 1.2, Math.min(2.3, Math.max(.3, target.y + (Math.random() - .5) * .8)), 0)
      : new T.Vector3(Math.random() < .2 ? 0 : side * (1.5 + Math.random() * 2), .4 + Math.random() * 1.6, 0);
    keeperState.pending = { at: simTime + L.react, aim, reach: L.reach };
  } else if (tapAim) dive(tapAim, 3.3);
}

function dive(aim, reach) {
  if (!keeperState || keeperState.diving) return;
  const dx = Math.max(-reach, Math.min(reach, aim.x)), dy = Math.max(.25, Math.min(2.4, aim.y));
  keeperState.diving = true; keeperState.start = simTime; keeperState.to = new T.Vector3(dx, dy, 0);
  keeperState.dur = .32 + Math.abs(dx) * .08;
}

function cpuShoot() {
  if (phase !== 'cpu-runup') return;
  phase = 'cpu-kick';
  runUp(() => {
    const L = level(), side = Math.random() < .5 ? -1 : 1, miss = Math.random() < L.shooterMiss, corner = Math.random() < L.shooterCorner;
    let tx = corner ? side * (2.4 + Math.random() * 1.0) : (Math.random() - .5) * 3.6, ty = corner ? (Math.random() < .5 ? .25 + Math.random() * .4 : 1.6 + Math.random() * .7) : .3 + Math.random() * 1.8;
    if (miss) { if (Math.random() < .5) ty = GOAL_H + .3 + Math.random() * .8; else tx = side * (HALF_W + .4 + Math.random()); }
    kick(new T.Vector3(tx, ty, 0), .55 + Math.random() * .25, (Math.random() - .5) * 8, false);
  });
}

// Run-up with the walk cycle sped up to a jog, then a real striking motion.
function runUp(then) {
  const start = shooter.root.position.clone(), end = new T.Vector3(-.55, 0, SPOT + .55), t0 = performance.now(), dur = 1100;
  shooter.root.rotation.y = Math.atan2(end.x - start.x, end.z - start.z); shooter.play('Walk', 2.1);
  const step = () => {
    const t = Math.min(1, (performance.now() - t0) / dur); shooter.root.position.lerpVectors(start, end, t);
    if (t < 1) requestAnimationFrame(step); else { shooter.root.rotation.y = Math.PI + .3; strike(then); }
  };
  step();
}
function strike(then) {
  const t0 = performance.now(), dur = 520; let fired = false;
  const step = () => {
    const t = Math.min(1, (performance.now() - t0) / dur);
    const back = t < .4 ? t / .4 : 1 - (t - .4) / .6, through = t < .4 ? 0 : Math.min(1, (t - .4) / .25);
    shooter.pose({
      rThigh: [mix(.9 * back, -1.25, through), 0, .05], rShin: [mix(1.5 * back, .15, through), 0, 0], rFoot: [.4, 0, 0],
      lThigh: [-.25, 0, -.08], lShin: [.35, 0, 0], Chest: [mix(.15, -.25, through), 0, 0], lArm: [0, 0, -1.0], rArm: [0, 0, .55]
    }, .05);
    if (!fired && t >= .45) { fired = true; then?.(); }
    if (t < 1) requestAnimationFrame(step); else setTimeout(() => shooter.play('Idle'), 500);
  };
  step();
}

/* ---------- Swipe input ---------- */
const trail = $('trail'), tg = trail.getContext('2d');
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w / h < .8 ? 58 : 42; camera.updateProjectionMatrix();
  trail.width = w * devicePixelRatio; trail.height = h * devicePixelRatio; trail.style.width = w + 'px'; trail.style.height = h + 'px';
}
addEventListener('resize', resize); resize();

canvas.addEventListener('pointerdown', e => {
  sound.ctx();
  if (phase === 'aim') { swipe = { pts: [[e.clientX, e.clientY, performance.now()]] }; canvas.setPointerCapture(e.pointerId); }
  else if (phase === 'cpu-runup' || phase === 'cpu-kick' || (phase === 'flight' && !youShooting && !keeperState.diving)) {
    const rc = new T.Raycaster(), p = new T.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); rc.setFromCamera(p, camera);
    const hit = new T.Vector3(); if (!rc.ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), 0), hit)) return;
    tapAim = hit; showAim(e.clientX, e.clientY);
    if (phase === 'flight') dive(hit, 3.3);
  }
});
canvas.addEventListener('pointermove', e => { if (swipe) { swipe.pts.push([e.clientX, e.clientY, performance.now()]); drawTrail(); } });
canvas.addEventListener('pointerup', () => {
  if (!swipe) return; const pts = swipe.pts; swipe = null; fadeTrail();
  if (pts.length < 3) return;
  const [x0, y0, t0] = pts[0], [x1, y1, t1] = pts.at(-1), dx = x1 - x0, dy = y0 - y1, len = Math.hypot(dx, dy);
  if (dy < 40 || len < 60) { toast('Swipe up towards the goal'); return; }
  const W = Math.min(innerWidth, innerHeight * 1.2), H = innerHeight;
  const speed = len / Math.max(60, t1 - t0); // px per ms
  // Sideways bend: how far the middle of the swipe strays from a straight line.
  const [mx, my] = pts[Math.floor(pts.length / 2)], dev = ((mx - x0) * dy + (my - y0) * dx) / Math.max(1, len);
  const power = Math.min(1.6, speed / 1.6), flight = Math.max(.42, .95 - power * .35);
  let tx = dx / (W * .38) * HALF_W, ty = Math.min(3.6, (dy / (H * .42)) * GOAL_H * (.75 + power * .35));
  const wobble = Math.max(0, power - 1.05) * 1.6; tx += (Math.random() - .5) * wobble; ty += Math.random() * wobble * .8;
  const curl = Math.max(-14, Math.min(14, -dev / W * 90));
  tx += .5 * curl * flight * flight * .25;
  kick(new T.Vector3(tx, Math.max(.12, ty), 0), flight, curl, true);
});
function drawTrail() {
  const d = devicePixelRatio, pts = swipe.pts; tg.clearRect(0, 0, trail.width, trail.height); tg.lineCap = 'round'; tg.lineJoin = 'round';
  for (let i = 1; i < pts.length; i++) { tg.strokeStyle = `rgba(223,255,99,${.25 + .75 * i / pts.length})`; tg.lineWidth = (4 + 10 * i / pts.length) * d; tg.beginPath(); tg.moveTo(pts[i - 1][0] * d, pts[i - 1][1] * d); tg.lineTo(pts[i][0] * d, pts[i][1] * d); tg.stroke(); }
}
function fadeTrail() { trail.style.transition = 'opacity .4s'; trail.style.opacity = 0; setTimeout(() => { tg.clearRect(0, 0, trail.width, trail.height); trail.style.transition = ''; trail.style.opacity = 1; }, 420); }
function showAim(x, y) { const a = $('aim'); a.style.left = x + 'px'; a.style.top = y + 'px'; a.classList.remove('is-on'); void a.offsetWidth; a.classList.add('is-on'); }

/* ---------- Simulation ---------- */
let simTime = 0;
function updateBall(dt) {
  const s = ballState; if (!s || s.done) return;
  s.time += dt; const p = ball.position, prevZ = p.z;
  s.v.x += s.curl * dt * (s.crossed ? 0 : 1); s.v.y -= G * dt; s.v.multiplyScalar(Math.exp(-.06 * dt));
  p.addScaledVector(s.v, dt);
  ball.rotation.x += s.spin.x * dt; ball.rotation.y += s.spin.y * dt;
  // Ground bounce
  if (p.y < R) { p.y = R; s.v.y = Math.abs(s.v.y) * .45; s.v.x *= .8; s.v.z *= .8; if (Math.abs(s.v.y) < .4) s.v.y = 0; }
  // Keeper contact
  if (!s.result && keeperState && !keeperState.diving && p.z < .6 && p.z > 0 && Math.abs(p.x - keeper.root.position.x) < .38 && p.y < 1.85) {
    s.result = 'saved'; s.v.z = Math.abs(s.v.z) * .3 + 1.5; s.v.x = (Math.random() - .5) * 4; s.v.y = 1.5; s.curl = 0; finishKick('saved');
  }
  if (!s.result && keeperState?.diving && p.z < 1.2 && p.z > -.4) {
    const hand = keeperHand(), d = hand.distanceTo(p);
    if (d < .55) { s.result = 'saved'; s.v.z = Math.abs(s.v.z) * .35 + 2; s.v.x = (p.x - hand.x) * 6 + (Math.random() - .5) * 3; s.v.y = 2 + Math.random() * 2; s.curl = 0; finishKick('saved'); }
  }
  // Posts and bar
  if (!s.result && prevZ > 0 && p.z <= .1) {
    const nearPost = Math.min(Math.abs(Math.abs(p.x) - (HALF_W + POST)), 9) < R + POST && p.y < GOAL_H + POST, nearBar = Math.abs(p.y - (GOAL_H + POST)) < R + POST && Math.abs(p.x) < HALF_W + POST;
    if (nearPost || nearBar) { s.result = 'post'; s.v.z = Math.abs(s.v.z) * .6; s.v.x *= nearPost ? -.6 : .8; if (nearBar) s.v.y = Math.abs(s.v.y) * .5 + 1; sound.post(); finishKick('post'); }
  }
  if (!s.crossed && p.z <= 0) {
    s.crossed = true;
    if (!s.result) {
      const inside = Math.abs(p.x) < HALF_W - R * .2 && p.y < GOAL_H - R * .2;
      s.result = inside ? 'goal' : 'miss'; finishKick(s.result);
    }
  }
  // Net
  if (s.result === 'goal') {
    if (p.z < -NET_D + R) { nets[0].hit(p.clone(), new T.Vector3(0, 0, -1).multiplyScalar(Math.min(1.4, Math.abs(s.v.z) * .1))); p.z = -NET_D + R; s.v.z = Math.abs(s.v.z) * .15; s.v.x *= .4; sound.net(); }
    if (p.y > GOAL_H - .3 - (-p.z) * .12 && p.z < 0 && s.v.y > 0) { nets[1].hit(p.clone(), new T.Vector3(0, 1, 0).multiplyScalar(.6)); s.v.y *= -.3; }
    if (Math.abs(p.x) > HALF_W - R && p.z < 0) { nets[p.x < 0 ? 2 : 3].hit(p.clone(), new T.Vector3(Math.sign(p.x), 0, 0).multiplyScalar(.8)); p.x = Math.sign(p.x) * (HALF_W - R); s.v.x *= -.2; }
  }
  // Slow motion as the ball arrives at a contested goal mouth
  const close = !s.result && p.z < 3 && p.z > -.2 && keeperState?.diving;
  timeScale += ((close ? .3 : 1) - timeScale) * Math.min(1, dt * 30);
  if (s.result) { s.rest += dt; if (s.rest > 2.6 / Math.max(.3, timeScale)) s.done = true; }
}

function keeperHand() {
  const k = keeperState, p = Math.min(1, (simTime - k.start) / k.dur), e = 1 - Math.pow(1 - p, 2.2);
  return new T.Vector3().lerpVectors(k.from, k.to, e).add(new T.Vector3(0, 0, .35));
}

function updateKeeper(dt, now) {
  const k = keeperState, kp = keeper; if (!k || !kp) return;
  if (k.pending && simTime >= k.pending.at) { const pd = k.pending; k.pending = null; dive(pd.aim, pd.reach); }
  if (!k.diving) {
    const sway = Math.sin(now * 2.2) * .22, bob = Math.sin(now * 4.4) * .03; kp.root.position.set(sway, 0, .35); kp.root.rotation.set(0, 0, 0); k.from.set(sway, 1.1, 0);
    kp.pose({ lThigh: [-.55, 0, -.22], rThigh: [-.55, 0, .22], lShin: [1.05, 0, 0], rShin: [1.05, 0, 0], lFoot: [-.45, 0, 0], rFoot: [-.45, 0, 0],
      Chest: [.32, 0, 0], lArm: [-.35, 0, -.95], rArm: [-.35, 0, .95], lForearm: [-.5, 0, 0], rForearm: [-.5, 0, 0] }, .2 + bob);
    return;
  }
  const p = Math.min(1, (simTime - k.start) / k.dur), e = 1 - Math.pow(1 - p, 2.2), hand = keeperHand();
  const side = Math.sign(k.to.x) || 0, high = Math.min(1, k.to.y / 2.2), lateral = Math.abs(k.to.x);
  const roll = side * Math.min(1.35, lateral / 2.3) * (1.15 - high * .4) * e;
  kp.root.position.x = k.from.x + (hand.x - k.from.x) * (lateral > .6 ? .62 : .25);
  kp.root.position.y = Math.max(0, Math.sin(Math.min(1, p * 1.15) * Math.PI) * (.2 + high * .55) + (lateral > 1 ? .25 * e : 0));
  kp.root.rotation.z = -roll;
  const up = side === 0 ? 2.7 : 2.85, lead = side >= 0 ? 'l' : 'r';
  // Arms stretch overhead towards the ball; the trailing leg tucks, the leading leg extends.
  kp.pose({
    lArm: [-.2 * (1 - e), 0, -mix(.95, up, e)], rArm: [-.2 * (1 - e), 0, mix(.95, up, e)], lForearm: [0, 0, 0], rForearm: [0, 0, 0],
    Chest: [mix(.32, .05, e), 0, -side * .45 * e],
    lThigh: [mix(-.55, lead === 'l' ? -.1 : -.9, e), 0, mix(-.22, -.5, e)], rThigh: [mix(-.55, lead === 'r' ? -.1 : -.9, e), 0, mix(.22, .5, e)],
    lShin: [mix(1.05, lead === 'l' ? .15 : 1.3, e), 0, 0], rShin: [mix(1.05, lead === 'r' ? .15 : 1.3, e), 0, 0]
  }, mix(.2, 0, e));
}

function updateCamera(dt) {
  if (!camTarget) return;
  const k = 1 - Math.exp(-dt * 3);
  let pos = camTarget.pos.clone(), look = camTarget.look.clone();
  if (ballState && youShooting && ballState.result !== 'miss') { pos.z = THREE_lerp(camTarget.pos.z, 9.5, Math.min(1, ballState.time * 1.2)); look.lerp(new T.Vector3(ball.position.x * .6, 1.1, ball.position.z), .3); }
  camera.position.lerp(pos, k);
  camTarget.cur = camTarget.cur ? camTarget.cur.lerp(look, k) : look; camera.lookAt(camTarget.cur);
}
const THREE_lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Results & flow ---------- */
function finishKick(result) {
  const youScored = youShooting && result === 'goal', youSaved = !youShooting && result !== 'goal';
  const good = youScored || youSaved;
  const text = { goal: 'GOAL!', saved: youShooting ? 'Saved!' : 'Great save!', post: 'Off the post!', miss: 'Missed!' }[result];
  if (result === 'goal') sound.cheer(); else if (good) sound.cheer(); else sound.groan();
  banner(youShooting ? text : (result === 'goal' ? 'They scored' : text), good);
  if (mode === 'practice') { streak = result === 'goal' ? streak + 1 : 0; if (streak > best) { best = streak; localStorage.setItem('penalty-best', best); } }
  else (youShooting ? score.you : score.cpu).push(result === 'goal');
  hud();
}

function nextKick() {
  if (mode === 'practice') return setupKick(true);
  const decided = shootoutWinner();
  if (decided) return endMatch(decided);
  setupKick(score.you.length === score.cpu.length);
}

function shootoutWinner() {
  const a = score.you, b = score.cpu, ga = a.filter(Boolean).length, gb = b.filter(Boolean).length;
  if (a.length <= 5 && b.length <= 5) {
    if (ga + (5 - a.length) < gb) return 'cpu';
    if (gb + (5 - b.length) < ga) return 'you';
    if (a.length === 5 && b.length === 5 && ga !== gb) return ga > gb ? 'you' : 'cpu';
    return null;
  }
  if (a.length === b.length && ga !== gb) return ga > gb ? 'you' : 'cpu';
  return null;
}

function endMatch(winner) {
  phase = 'over'; sound.whistle(); setTimeout(() => sound.whistle(), 450);
  const ga = score.you.filter(Boolean).length, gb = score.cpu.filter(Boolean).length;
  $('result-label').textContent = winner === 'you' ? 'Champions' : 'Full time';
  $('result-title').textContent = winner === 'you' ? 'You win the shootout!' : 'Beaten on penalties';
  $('result-reason').textContent = `Final score ${ga} – ${gb}${score.you.length > 5 ? ' after sudden death' : ''}.`;
  if (winner === 'you') confetti();
  setTimeout(() => { $('result').hidden = false; }, 900);
}

function confetti() {
  const n = 300, mesh = new T.InstancedMesh(new T.PlaneGeometry(.18, .28), new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false }), n), items = [], m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), one = new T.Vector3(1, 1, 1);
  const pal = [...KITS[settings.kit], '#dfff63', '#ffffff'];
  for (let i = 0; i < n; i++) { mesh.setColorAt(i, new T.Color(pal[i % pal.length])); items.push({ p: new T.Vector3((Math.random() - .5) * 16, 6 + Math.random() * 10, SPOT - 4 + (Math.random() - .5) * 10), r: Math.random() * 6, w: (Math.random() - .5) * 8, v: 1 + Math.random() * 2 }); }
  scene.add(mesh); effects.push({ life: 0, update: dt => { items.forEach((it, i) => { it.p.y = Math.max(.02, it.p.y - it.v * dt); it.r += it.w * dt; m.compose(it.p, q.setFromEuler(e.set(it.r, it.r * .7, 0)), one); mesh.setMatrixAt(i, m); }); mesh.instanceMatrix.needsUpdate = true; }, max: 7, dispose: () => scene.remove(mesh) });
}
let effects = [];

/* ---------- HUD ---------- */
let bannerTimer = 0;
function banner(text, good) { const b = $('banner'); b.textContent = text; b.className = 'banner is-on ' + (good ? 'is-good' : 'is-bad'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('is-on'), 1900); }
let toastTimer = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 2000); }
function dots(list, n) { return Array.from({ length: Math.max(n, list.length) }, (_, i) => `<i class="${list[i] === true ? 'is-goal' : list[i] === false ? 'is-miss' : ''}"></i>`).join(''); }
function hud() {
  document.body.classList.toggle('is-playing', !!mode);
  document.body.dataset.mode = mode || '';
  const ga = score.you.filter(Boolean).length, gb = score.cpu.filter(Boolean).length, n = Math.max(5, score.you.length, score.cpu.length);
  $('board').innerHTML = mode === 'practice'
    ? `<div class="sb-practice"><span>Streak</span><b>${streak}</b><span>Best ${best}</span></div>`
    : `<div class="sb-row"><span class="sb-team"><i style="background:${KITS[settings.kit][0]}"></i>You</span><span class="sb-dots">${dots(score.you, n)}</span><b>${ga}</b></div><div class="sb-row"><span class="sb-team"><i style="background:#f3f3f3"></i>CPU</span><span class="sb-dots">${dots(score.cpu, n)}</span><b>${gb}</b></div>`;
  $('hint').textContent = phase === 'aim' ? 'Swipe the ball towards the goal · curve your swipe to bend it' : phase === 'cpu-runup' || phase === 'cpu-kick' ? 'You’re in goal — tap where to dive' : '';
}

/* ---------- Menus ---------- */
function syncSegments() {
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(settings[seg.dataset.setting] === b.dataset.value))));
  $('btn-sound').classList.toggle('is-off', !settings.sound);
}
document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (!b) return; settings[seg.dataset.setting] = b.dataset.value; save(); syncSegments(); }));
function start(m) {
  if (!keeper) return;
  sound.ctx(); sound.ambience(); sound.setAmbience(true); sound.whistle();
  mode = m; score = { you: [], cpu: [] }; streak = 0; $('start').hidden = true; $('result').hidden = true; setupKick(true);
}
$('play-shootout').onclick = () => start('shootout');
$('play-practice').onclick = () => start('practice');
$('again').onclick = () => start(mode);
const toMenu = () => { mode = null; phase = 'menu'; $('result').hidden = true; $('start').hidden = false; sound.setAmbience(false); setupMenuView(); hud(); };
$('to-menu').onclick = toMenu;
$('btn-menu').onclick = () => { if (mode && phase !== 'over' && !confirm('Leave this match?')) return; toMenu(); };
$('btn-sound').onclick = () => { settings.sound = !settings.sound; save(); syncSegments(); sound.setAmbience(!!mode); };
$('btn-full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});

function setupMenuView() { setupKick(true); phase = 'menu'; camTarget = { pos: new T.Vector3(6, 2.6, SPOT + 5), look: new T.Vector3(0, 1, 2) }; }

/* ---------- Loop ---------- */
const clock = new T.Clock();
let after = 0;
renderer.setAnimationLoop(() => {
  const raw = Math.min(clock.getDelta(), .05), now = performance.now() / 1000, dt = raw * timeScale;
  simTime += dt;
  if (ballState) { const sub = 4; for (let i = 0; i < sub; i++) updateBall(dt / sub); }
  updateKeeper(dt, now); shooter?.update(raw);
  nets.forEach(n => n.update(raw));
  adTex.offset.x = (adTex.offset.x + raw * .04) % 1;
  effects = effects.filter(f => { f.life += raw; f.update(raw); if (f.life > f.max) { f.dispose(); return false; } return true; });
  if (phase === 'menu' && camTarget) { const a = now * .12; camTarget.pos.set(Math.sin(a) * 9, 2.8, SPOT + Math.cos(a) * 6); }
  updateCamera(raw);
  if (ballState?.done && phase === 'flight') { phase = 'between'; after = setTimeout(nextKick, 300); }
  renderer.render(scene, camera);
});

syncSegments(); hud();
bodiesReady.then(() => { setupMenuView(); document.body.classList.add('is-loaded'); }).catch(() => toast('Could not load the players. Please refresh.'));
camera.position.set(8, 3, SPOT + 6);
setTimeout(() => document.body.classList.add('is-ready'), 50);
