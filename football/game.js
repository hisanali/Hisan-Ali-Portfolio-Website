import * as T from '../evermile/vendor/three.module.js';
import { GLTFLoader } from '../evermile/vendor/loaders/GLTFLoader.js';
import { EffectComposer } from '../evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../evermile/vendor/postprocessing/RenderPass.js';
import { OutputPass } from '../evermile/vendor/postprocessing/OutputPass.js';
import { clone as cloneSkinned } from '../evermile/vendor/utils/SkeletonUtils.js';
import { MeshoptDecoder } from '../penalty/vendor/meshopt_decoder.module.js';
import { HDRLoader } from '../penalty/vendor/three-addons/loaders/HDRLoader.js';
import { broadcastGrade } from '../penalty/rendering.js?v=10';
import { buildStadium } from '../penalty/stadium.js?v=6';
import { fittedGloves } from '../penalty/equipment.js?v=6';

/* ---------- Pitch geometry (metres). Your team attacks towards +z. ---------- */
const LEN = 70, WID = 46, HX = WID / 2, CZ = LEN / 2, GOAL_HW = 3, GOAL_H = 2.2, BOX_D = 11, BOX_HW = 11, R = .11, G = 9.81;
const $ = id => document.getElementById(id);
const settings = { kit: 'red', level: 'normal', length: '4', sound: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem('football-settings') || '{}')); } catch {}
const save = () => { try { localStorage.setItem('football-settings', JSON.stringify(settings)); } catch {} };
const KITS = { red: ['#c8102e', '#1b1b1b', 'Red Falcons'], white: ['#f2f2f2', '#1b1b1b', 'Muscat Whites'], blue: ['#1d4fb8', '#f2f2f2', 'Blue Waves'], green: ['#0f7a3e', '#1b1b1b', 'Green Oasis'] };
const LEVELS = { easy: { speed: .9, tackle: .45, save: .45, think: .55, accuracy: .55 }, normal: { speed: 1, tackle: .75, save: .62, think: .38, accuracy: .75 }, hard: { speed: 1.08, tackle: 1.05, save: .78, think: .24, accuracy: .9 } };
const level = () => LEVELS[settings.level] || LEVELS.normal;

/* ---------- Renderer ---------- */
const canvas = $('scene');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 800;
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2)); renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.AgXToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene(); scene.background = new T.Color('#9fb4c2'); scene.fog = new T.Fog('#9fb4c2', 120, 320);
const camera = new T.PerspectiveCamera(40, 1, .5, 600);
const composer = new EffectComposer(renderer, new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: mobile ? 0 : 4 }));
composer.addPass(new RenderPass(scene, camera)); composer.addPass(new OutputPass()); const grade = broadcastGrade(); composer.addPass(grade);

const environmentReady = new HDRLoader().loadAsync('../penalty/assets/stadium-light.bin?v=7').then(hdr => {
  hdr.mapping = T.EquirectangularReflectionMapping; const pm = new T.PMREMGenerator(renderer);
  scene.environment = pm.fromEquirectangular(hdr).texture; scene.environmentIntensity = .36; scene.environmentRotation.y = .8; hdr.dispose(); pm.dispose();
}).catch(() => scene.add(new T.HemisphereLight('#c7d9e8', '#52603d', .8)));
scene.add(new T.HemisphereLight('#d5e2eb', '#566044', .2));
const sun = new T.DirectionalLight('#fff0d6', 3.1); sun.position.set(-30, 45, CZ + 20); sun.target.position.set(0, 0, CZ); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 50, bottom: -50, near: 1, far: 160 }); sun.shadow.mapSize.set(mobile ? 2048 : 4096, mobile ? 2048 : 4096); sun.shadow.bias = -.0002; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);

/* ---------- Textures ---------- */
const jobs = [];
function asset(name, srgb = true, repeat = null, gltfUV = false) {
  let ok, bad; jobs.push(new Promise((a, b) => { ok = a; bad = b; }));
  const t = new T.TextureLoader().load(`../penalty/assets/${name}.webp?v=4`, ok, undefined, bad);
  if (srgb) t.colorSpace = T.SRGBColorSpace; t.flipY = !gltfUV; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(...repeat); } return t;
}
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };

/* ---------- Pitch, markings and goals ---------- */
{
  const grass = new T.MeshStandardMaterial({ map: asset('pitch-color', true, [70, 85]), normalMap: asset('pitch-normal', false, [70, 85]), roughnessMap: asset('pitch-roughness', false, [70, 85]), roughness: 1, color: '#c9d8bb' });
  const pitch = new T.Mesh(new T.PlaneGeometry(90, 110), grass); pitch.rotation.x = -Math.PI / 2; pitch.position.z = CZ; pitch.receiveShadow = true; scene.add(pitch);
  const PX = 24, lines = canvasTex((WID + 2) * PX, (LEN + 2) * PX, g => {
    const X = x => (x + HX + 1) * PX, Z = z => (z + 1) * PX; g.strokeStyle = 'rgba(255,255,255,.92)'; g.fillStyle = 'rgba(255,255,255,.92)'; g.lineWidth = .12 * PX;
    g.strokeRect(X(-HX), Z(0), WID * PX, LEN * PX); g.beginPath(); g.moveTo(X(-HX), Z(CZ)); g.lineTo(X(HX), Z(CZ)); g.stroke();
    g.beginPath(); g.arc(X(0), Z(CZ), 7 * PX, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(X(0), Z(CZ), .18 * PX, 0, Math.PI * 2); g.fill();
    for (const [z0, dir] of [[0, 1], [LEN, -1]]) {
      g.strokeRect(X(-BOX_HW), Math.min(Z(z0), Z(z0 + dir * BOX_D)), BOX_HW * 2 * PX, BOX_D * PX);
      g.strokeRect(X(-6), Math.min(Z(z0), Z(z0 + dir * 4.5)), 12 * PX, 4.5 * PX);
      g.beginPath(); g.arc(X(0), Z(z0 + dir * 8), .15 * PX, 0, Math.PI * 2); g.fill();
    }
  });
  const mark = new T.Mesh(new T.PlaneGeometry(WID + 2, LEN + 2), new T.MeshStandardMaterial({ map: lines, transparent: true, depthWrite: false, roughness: .9 }));
  mark.rotation.x = -Math.PI / 2; mark.position.set(0, .006, CZ); mark.receiveShadow = true; scene.add(mark);
  const white = new T.MeshPhysicalMaterial({ color: '#ffffff', roughness: .25, clearcoat: 1 }), netMat = new T.LineBasicMaterial({ color: '#eef2f6', transparent: true, opacity: .55 });
  for (const [z, dir] of [[0, -1], [LEN, 1]]) {
    for (const x of [-GOAL_HW - .06, GOAL_HW + .06]) { const p = new T.Mesh(new T.CylinderGeometry(.06, .06, GOAL_H + .06, 16), white); p.position.set(x, (GOAL_H + .06) / 2, z); p.castShadow = true; scene.add(p); }
    const bar = new T.Mesh(new T.CylinderGeometry(.06, .06, GOAL_HW * 2 + .24, 16), white); bar.rotation.z = Math.PI / 2; bar.position.set(0, GOAL_H + .06, z); bar.castShadow = true; scene.add(bar);
    const pts = [], D = 1.6, step = .2;
    for (let x = -GOAL_HW; x <= GOAL_HW + .01; x += step) { pts.push(x, GOAL_H, z, x, GOAL_H * .85, z + dir * D, x, GOAL_H * .85, z + dir * D, x, 0, z + dir * D); }
    for (let y = 0; y <= GOAL_H * .85 + .01; y += step) pts.push(-GOAL_HW, y, z + dir * D, GOAL_HW, y, z + dir * D);
    for (let k = 0; k <= D + .01; k += step) { const y = GOAL_H - (GOAL_H * .15) * (k / D); pts.push(-GOAL_HW, y, z + dir * k, GOAL_HW, y, z + dir * k); for (const x of [-GOAL_HW, GOAL_HW]) pts.push(x, 0, z + dir * k, x, y, z + dir * k); }
    for (const x of [-GOAL_HW, GOAL_HW]) for (let y = 0; y <= GOAL_H; y += step) pts.push(x, y, z, x, y * .85, z + dir * D);
    const net = new T.LineSegments(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(pts, 3)), netMat); scene.add(net);
  }
}
const stadium = buildStadium(scene, asset('crowd-fans'), { concrete: asset('concrete-color', true, [48, 1]), normal: asset('concrete-normal', false, [48, 1]) });

/* ---------- Ball ---------- */
const ball = new T.Mesh(new T.SphereGeometry(R, 32, 24), new T.MeshPhysicalMaterial({ map: canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#151515'; for (let i = 0; i < 12; i++) { const x = (i % 6) * w / 6 + (i > 5 ? w / 12 : 0), y = i > 5 ? h * .7 : h * .3; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 26); } g.fill(); } }), roughness: .45, clearcoat: .6 }));
ball.castShadow = true; scene.add(ball);
const B = { p: ball.position, v: new T.Vector3(), owner: null, lastTouch: null, kicker: null, kickTime: 0, shot: null };

/* ---------- Footballers ---------- */
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let athlete, locomotion;
const maps = { color: asset('player-detail', true, null, true), normal: asset('player-normal', false, null, true), hair: asset('hair-color', true, null, true), hairNormal: asset('hair-normal', false, null, true) };
const modelsReady = Promise.all([loader.loadAsync('../penalty/assets/athlete.glb?v=6', e => { if (e.total) $('load-progress').textContent = `${Math.round(e.loaded / e.total * 100)}%`; }), loader.loadAsync('../evermile/assets/models/citizen-soldier.glb')])
  .then(([a, s]) => { athlete = a; locomotion = retarget(s, a, ['Run', 'Walk']); });

// Mixamo locomotion from Evermile's soldier, corrected for the rest-pose difference of each bone.
function retarget(source, target, names) {
  const restS = {}, restT = {}; source.scene.traverse(o => { if (o.isBone) restS[o.name.replace(/^mixamorig:?/, '')] = o.quaternion.clone(); }); target.scene.traverse(o => { if (o.isBone) restT[o.name] = o.quaternion.clone(); });
  return names.map(n => {
    const clip = source.animations.find(a => a.name === n).clone(); clip.name = n.toLowerCase();
    clip.tracks = clip.tracks.filter(t => t.name.endsWith('.quaternion')).map(t => { t.name = t.name.replace(/^mixamorig:?/, ''); return t; }).filter(t => restT[t.name.split('.')[0]] && restS[t.name.split('.')[0]]);
    for (const t of clip.tracks) { const b = t.name.split('.')[0], c = restT[b].clone().multiply(restS[b].clone().invert()), q = new T.Quaternion(); for (let i = 0; i < t.values.length; i += 4) { q.fromArray(t.values, i).premultiply(c).toArray(t.values, i); } }
    return clip;
  });
}

const shadowTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
class Player {
  constructor(team, index, keeper, shirt, shorts) {
    this.team = team; this.index = index; this.keeper = keeper; this.pos = new T.Vector3(); this.vel = new T.Vector3(); this.facing = 0; this.target = new T.Vector3(); this.busy = 0; this.stun = 0;
    const model = cloneSkinned(athlete.scene); this.root = new T.Group(); this.root.add(model); model.scale.setScalar(keeper ? 1.09 : 1.045);
    model.traverse(o => {
      if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = !mobile; o.frustumCulled = false;
      const n = o.name.toLowerCase(), m = new T.MeshStandardMaterial({ map: maps.color, normalMap: maps.normal, roughness: .65, envMapIntensity: .85 });
      if (n.includes('shirt')) { m.color.set(shirt); m.roughness = .85; } if (n.includes('shorts')) { m.color.set(shorts); m.roughness = .88; }
      if (n.includes('socks')) { m.color.set(shirt); m.roughness = .95; } if (n.includes('shoes')) m.color.set('#c4c8cc');
      if (n.includes('hair') || n.includes('eyelashes')) { m.map = maps.hair; m.normalMap = maps.hairNormal; m.alphaTest = .32; m.side = T.DoubleSide; }
      o.material = m;
    });
    if (keeper) fittedGloves(model, '#f4f4f4');
    this.bones = {}; model.traverse(o => { if (o.isBone) this.bones[o.name] = o; });
    this.mixer = new T.AnimationMixer(model); this.clips = {};
    for (const src of [...athlete.animations, ...locomotion]) {
      const clip = src.clone();
      for (const t of clip.tracks) if (t.name === 'Hips.position') for (let i = 0; i < t.values.length; i += 3) { t.values[i] = t.values[0]; t.values[i + 2] = t.values[2]; if (!['dive', 'dive2', 'jump'].includes(clip.name)) t.values[i + 1] = t.values[1]; }
      const a = this.mixer.clipAction(clip); if (!['idle', 'run', 'walk', 'ready'].includes(clip.name)) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; } this.clips[clip.name] = a;
    }
    this.shadow = new T.Mesh(new T.PlaneGeometry(1.2, 1.2), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); this.shadow.rotation.x = -Math.PI / 2; scene.add(this.shadow);
    this.ring = new T.Mesh(new T.RingGeometry(.55, .68, 40), new T.MeshBasicMaterial({ color: '#dfff63', transparent: true, opacity: .9, depthWrite: false, toneMapped: false })); this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; scene.add(this.ring);
    this.pin = new T.Mesh(new T.ConeGeometry(.22, .45, 16), new T.MeshBasicMaterial({ color: '#39e07a', toneMapped: false })); this.pin.rotation.x = Math.PI; this.pin.visible = false; scene.add(this.pin);
    this.current = null; this.play(keeper ? 'ready' : 'idle'); scene.add(this.root);
  }
  play(name, speed = 1, fade = .2, from = 0) {
    const a = this.clips[name]; if (!a) return; a.setEffectiveTimeScale(speed);
    if (this.current === a && from === 0) return;
    a.enabled = true; a.reset(); a.time = from; a.setEffectiveWeight(1).play();
    if (this.current && this.current !== a) this.current.crossFadeTo(a, fade, false); this.current = a; this.anim = name;
  }
  get dir() { return this.team.dir; }
  update(dt) {
    const speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.busy <= 0) {
      if (this.keeper && speed < 1.2) this.play('ready');
      else if (speed > 4.2) this.play('run', T.MathUtils.clamp(speed / 6.4, .75, 1.35));
      else if (speed > .6) this.play('walk', T.MathUtils.clamp(speed / 1.6, .8, 1.9));
      else this.play(this.keeper ? 'ready' : 'idle');
    }
    if (speed > .3) { const want = Math.atan2(this.vel.x, this.vel.z); let d = want - this.facing; d = Math.atan2(Math.sin(d), Math.cos(d)); this.facing += d * Math.min(1, dt * 10); }
    this.mixer.update(dt);
    this.root.position.set(this.pos.x, 0, this.pos.z); this.root.rotation.y = this.facing;
    this.shadow.position.set(this.pos.x + .35, .01, this.pos.z - .3); this.ring.position.set(this.pos.x, .012, this.pos.z); this.pin.visible = this.ring.visible; this.pin.position.set(this.pos.x, 2.35 + Math.sin(performance.now() / 180) * .08, this.pos.z);
  }
  face(x, z) { this.facing = Math.atan2(x - this.pos.x, z - this.pos.z); }
}

/* ---------- Teams & formation ---------- */
// Base shape for a side attacking +z: keeper, two defenders, two forwards.
const SHAPE = [[0, 1.2], [-8, 12], [8, 12], [-7, 26], [7, 26]];
let teams = [], all = [], user = null, controlled = null;
function buildTeams() {
  for (const p of all) { scene.remove(p.root, p.shadow, p.ring, p.pin); p.mixer.stopAllAction(); }
  const [shirt, shorts, name] = KITS[settings.kit] || KITS.red, away = settings.kit === 'white' ? ['#1b1b1b', '#1b1b1b', 'Night Owls'] : ['#f2f2f2', '#1b1b1b', 'Muscat Whites'];
  teams = [{ name, dir: 1, score: 0, human: true, color: shirt }, { name: away[2], dir: -1, score: 0, human: false, color: away[0] }];
  teams[0].players = SHAPE.map((_, i) => new Player(teams[0], i, i === 0, i === 0 ? '#f2c230' : shirt, i === 0 ? '#1b1b1b' : shorts));
  teams[1].players = SHAPE.map((_, i) => new Player(teams[1], i, i === 0, i === 0 ? '#22c46e' : away[0], i === 0 ? '#1b1b1b' : away[1]));
  for (const t of teams) t.opp = teams[1 - teams.indexOf(t)];
  all = [...teams[0].players, ...teams[1].players]; user = teams[0];
}
const ownGoalZ = t => t.dir > 0 ? 0 : LEN, attackGoalZ = t => t.dir > 0 ? LEN : 0;
const toWorld = (t, x, z) => new T.Vector3(t.dir > 0 ? x : -x, 0, t.dir > 0 ? z : LEN - z);

function kickoffPositions(kicking) {
  for (const t of teams) t.players.forEach((p, i) => {
    let [x, z] = SHAPE[i]; z = Math.min(z, CZ - 1.5); if (i >= 3) { z = CZ - (t === kicking ? 1.2 : 8); x = t === kicking ? (i === 3 ? -.6 : 6) : x; }
    p.pos.copy(toWorld(t, x, z)); p.vel.set(0, 0, 0); p.face(0, CZ); p.busy = 0; p.stun = 0;
  });
  B.p.set(0, R, CZ); B.v.set(0, 0, 0); B.owner = null; B.shot = null; give(kicking.players[3]);
}

/* ---------- Ball control ---------- */
function give(p) { B.owner = p; B.lastTouch = p; B.shot = null; if (p.team === user && !p.keeper) setControlled(p); }
function setControlled(p) { if (controlled) controlled.ring.visible = false; controlled = p; if (p) p.ring.visible = true; }
function release(p) { if (B.owner === p) B.owner = null; B.kicker = p; B.kickTime = clock; B.lastTouch = p; }
function kickAnim(p, power) { p.busy = .45; p.play('kick-pro', 1.7, .08, .62 + (1 - power) * .1); }

function pass(p, target, lofted = false) {
  if (!target) return;
  const lead = target.vel.clone().multiplyScalar(.45), aim = target.pos.clone().add(lead), d = aim.clone().sub(B.p); d.y = 0; const dist = d.length();
  const speed = T.MathUtils.clamp(7 + dist * .55, 9, 22) * (lofted ? .75 : 1); d.normalize();
  release(p); kickAnim(p, .5); p.face(aim.x, aim.z);
  B.v.set(d.x * speed, lofted ? Math.min(7, 2 + dist * .15) : .4, d.z * speed); B.passTo = target; sfx('kick', .6);
}
function shoot(p, aimX, power, error = 0) {
  const gz = attackGoalZ(p.team), tx = T.MathUtils.clamp(aimX, -GOAL_HW + .35, GOAL_HW - .35) + (Math.random() - .5) * error * 4, ty = .3 + Math.random() * (power > .7 ? 1.6 : 1.0) + error * (Math.random() * 1.5);
  const from = B.p.clone(), dz = gz - from.z, dx = tx - from.x, dist = Math.hypot(dx, dz), hs = 17 + power * 13, t = dist / hs;
  release(p); kickAnim(p, power); p.face(tx, gz);
  B.v.set(dx / t, (ty - from.y + .5 * G * t * t) / t, dz / t); B.shot = { team: p.team, t: clock }; sfx('kick', 1);
}

/* ---------- Input ---------- */
const keys = {}, input = { x: 0, y: 0, sprint: false };
let shootHold = 0, shootDown = false;
addEventListener('keydown', e => { if (e.repeat) return; keys[e.code] = true; if (e.code === 'Space' || e.code === 'KeyJ') action('pass'); if (e.code === 'KeyK' || e.code === 'KeyL') shootDown = true; if (e.code === 'Escape') togglePause(); if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; if ((e.code === 'KeyK' || e.code === 'KeyL') && shootDown) { shootDown = false; action('shoot'); } });
const stick = $('stick'), knob = stick.querySelector('i'); let stickId = null, stickC = null;
stick.addEventListener('pointerdown', e => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); const r = stick.getBoundingClientRect(); stickC = [r.left + r.width / 2, r.top + r.height / 2]; moveStick(e); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) moveStick(e); });
const endStick = () => { stickId = null; input.x = input.y = 0; knob.style.transform = ''; };
stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
function moveStick(e) { let dx = e.clientX - stickC[0], dy = e.clientY - stickC[1]; const r = 52, l = Math.hypot(dx, dy); if (l > r) { dx *= r / l; dy *= r / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; input.x = dx / r; input.y = -dy / r; }
const hold = (id, down, up) => { const el = $(id); el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('is-down'); down(); }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, () => { if (el.classList.contains('is-down')) { el.classList.remove('is-down'); up?.(); } }); };
hold('btn-a', () => action('pass')); hold('btn-b', () => { shootDown = true; }, () => { if (shootDown) { shootDown = false; action('shoot'); } }); hold('btn-c', () => { input.sprint = true; }, () => { input.sprint = false; });

function readInput() {
  let x = input.x, y = input.y;
  if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1; if (keys.KeyW || keys.ArrowUp) y += 1; if (keys.KeyS || keys.ArrowDown) y -= 1;
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  // Side-on broadcast camera: screen-right runs down the pitch (+z), screen-up is the far touchline (+x).
  return { x: y, z: x, mag: Math.min(1, l), sprint: input.sprint || keys.ShiftLeft || keys.ShiftRight };
}
function action(kind) {
  if (state !== 'play' || !controlled) return; sfx('ctx');
  const attacking = B.owner?.team === user;
  if (kind === 'pass') {
    if (B.owner === controlled) { const inp = readInput(); pass(controlled, bestTarget(controlled, inp.mag > .2 ? new T.Vector3(inp.x, 0, inp.z) : null)); }
    else if (!attacking) setControlled(nearest(user, B.p, true));
  } else if (kind === 'shoot') {
    const power = T.MathUtils.clamp(.35 + shootHold * 1.3, .35, 1); shootHold = 0;
    if (B.owner === controlled) { const inp = readInput(); shoot(controlled, inp.x * 2.6 + (Math.random() - .5) * .4, power, power > .95 ? .35 : .08); }
    else if (B.owner && B.owner.team !== user) tackle(controlled, 1);
  }
}
function bestTarget(p, wanted) {
  let best = null, score = -Infinity; const fwd = new T.Vector3(0, 0, p.team.dir);
  for (const m of p.team.players) {
    if (m === p) continue; const d = m.pos.clone().sub(p.pos); const dist = d.length(); if (dist < 3) continue; d.normalize();
    let s = -dist * .05 + d.dot(fwd) * .6 + openness(m) * .8; if (wanted) s += d.dot(wanted) * 3; if (m.keeper) s -= 1.5;
    if (s > score) { score = s; best = m; }
  } return best;
}
const openness = m => { let d = 99; for (const o of m.team.opp.players) d = Math.min(d, o.pos.distanceTo(m.pos)); return Math.min(1, d / 8); };
function nearest(team, point, outfield = false) { let best = null, bd = Infinity; for (const p of team.players) { if (outfield && p.keeper) continue; const d = p.pos.distanceTo(point); if (d < bd) { bd = d; best = p; } } return best; }
function tackle(p, effort) {
  const o = B.owner; if (!o || p.stun > 0 || p.busy > 0) return; const d = p.pos.distanceTo(o.pos);
  p.busy = .5; p.face(o.pos.x, o.pos.z); p.play('jump', 1.6, .08, .15);
  if (d < 1.9 && Math.random() < .45 + effort * .3) { B.owner = null; B.v.set((Math.random() - .5) * 4, .3, (p.pos.z < o.pos.z ? 1 : -1) * -3 + (Math.random() - .5) * 3); B.lastTouch = p; sfx('kick', .4); o.stun = .7; }
  else p.stun = .8;
}

/* ---------- AI ---------- */
function teamTarget(p) {
  const t = p.team, [bx, bz] = SHAPE[p.index], own = t.dir > 0 ? B.p.z : LEN - B.p.z, attacking = B.owner?.team === t;
  let z = bz + (own - CZ) * .55 + (attacking ? 6 : -3), x = bx + (t.dir > 0 ? B.p.x : -B.p.x) * .35;
  if (p.index >= 3 && attacking) z += 4; z = T.MathUtils.clamp(z, p.index >= 3 ? 14 : 4, p.index >= 3 ? LEN - 6 : LEN - 22);
  return toWorld(t, T.MathUtils.clamp(x, -HX + 2, HX - 2), z);
}
function think(p, dt) {
  const t = p.team, L = t.human ? LEVELS.normal : level(), goalZ = attackGoalZ(t);
  p.thinkT = (p.thinkT || 0) - dt;
  if (p.keeper) return keeperAI(p, dt, L);
  if (B.owner === p) {
    const toGoal = Math.hypot(B.p.x, goalZ - B.p.z), press = Math.min(...t.opp.players.map(o => o.pos.distanceTo(p.pos)));
    if (p.thinkT <= 0) {
      p.thinkT = L.think * (.6 + Math.random() * .8);
      if (toGoal < 18 && Math.random() < .6) return shoot(p, (Math.random() < .5 ? -1 : 1) * (1.2 + Math.random() * 1.4), .7 + Math.random() * .3, 1 - L.accuracy);
      if (press < 3 && Math.random() < .75) return pass(p, bestTarget(p, null));
    }
    const dodge = t.opp.players.reduce((acc, o) => { const d = p.pos.clone().sub(o.pos); const l = d.length(); return l < 5 ? acc.add(d.multiplyScalar(1 / (l * l + .5))) : acc; }, new T.Vector3());
    p.target.set(p.pos.x * .9 + dodge.x * 6, 0, goalZ).add(new T.Vector3(dodge.x * 4, 0, 0)); return seek(p, p.target, 5.6 * L.speed, dt);
  }
  const chaser = t.chaser === p;
  if (chaser) { seek(p, B.owner ? B.owner.pos.clone().addScaledVector(new T.Vector3(0, 0, t.dir), -.6) : B.p.clone().addScaledVector(B.v, .25), 7 * L.speed, dt); if (B.owner && B.owner.team !== t && p.pos.distanceTo(B.owner.pos) < 1.6 && Math.random() < dt * L.tackle * 1.4) tackle(p, L.tackle * .6); return; }
  seek(p, teamTarget(p), (B.owner?.team === t ? 5.5 : 6) * L.speed, dt);
}
function keeperAI(p, dt, L) {
  const t = p.team, gz = ownGoalZ(t), towards = t.dir > 0 ? -B.v.z : B.v.z;
  if (B.owner === p) { p.vel.set(0, 0, 0); p.holdT = (p.holdT || 0) + dt; if (p.holdT > 1.1) { p.holdT = 0; pass(p, bestTarget(p, null)); } return; }
  let tx = T.MathUtils.clamp(B.p.x * .22, -GOAL_HW + .6, GOAL_HW - .6), tz = gz + t.dir * Math.min(2.4, Math.abs(B.p.z - gz) * .08 + .6);
  if (B.shot && B.shot.team !== t && towards > 6) {
    const tt = (Math.abs(B.p.z - gz)) / Math.max(1, towards), px = B.p.x + B.v.x * tt;
    if (!p.dived && tt < .55) { p.dived = true; const reachable = Math.abs(px - p.pos.x) < 3.4; p.saveWill = reachable && Math.random() < L.save * (1.25 - Math.min(1, Math.hypot(B.v.x, B.v.z) / 32) * .5); if (Math.abs(px - p.pos.x) > .9) { p.busy = .9; p.play((px - p.pos.x) * t.dir > 0 ? 'dive2' : 'dive', 1.35, .06); } }
    tx = T.MathUtils.clamp(px, -GOAL_HW, GOAL_HW);
  }
  seek(p, new T.Vector3(tx, 0, tz), 7.5, dt);
  if (B.shot && p.dived && p.saveWill && B.p.distanceTo(new T.Vector3(p.pos.x, Math.min(1.6, B.p.y), p.pos.z)) < 2.4 && Math.abs(B.p.z - p.pos.z) < .8) {
    p.dived = false; B.shot = null; sfx('save'); toast('Great save!');
    if (Math.random() < .5) { B.v.set(0, 0, 0); give(p); } else { B.v.set((Math.random() - .5) * 10, 3, t.dir * (6 + Math.random() * 4)); B.lastTouch = p; }
  }
}
function seek(p, target, maxSpeed, dt) {
  const d = target.clone().sub(p.pos); d.y = 0; const dist = d.length(), want = dist < .3 ? 0 : Math.min(maxSpeed, dist * 2.2);
  if (dist > .001) d.multiplyScalar(want / dist); p.vel.lerp(d, Math.min(1, dt * 4));
}

/* ---------- Match flow ---------- */
let state = 'menu', clock = 0, matchTime = 0, half = 1, restartT = 0, pending = null, paused = false;
const matchLength = () => Number(settings.length) * 60;
function startMatch() {
  buildTeams(); clock = 0; matchTime = 0; half = 1; teams.forEach(t => t.score = 0); stadium.updateScore(0, 0, 1);
  $('start').hidden = true; $('result').hidden = true; document.body.classList.add('is-playing'); kickoffPositions(teams[0]); state = 'kickoff'; restartT = 1.4; whistle(); hud();
}
function goalScored(team) {
  team.score++; stadium.updateScore(teams[0].score, teams[1].score, half); state = 'goal'; restartT = 3.2; B.shot = null;
  banner(team === user ? 'GOAL!' : `${team.name} score`, team === user); sfx(team === user ? 'cheer' : 'groan');
  const scorer = B.lastTouch?.team === team ? B.lastTouch : nearest(team, B.p, true); scorer.busy = 2.6; scorer.vel.set(0, 0, 0); scorer.play('celebrate', 1, .2);
  for (const p of team.opp.players) if (!p.keeper) { p.busy = 2; p.play('disappointed', 1, .3); }
  pending = () => { kickoffPositions(team.opp); state = 'kickoff'; restartT = 1.2; whistle(); }; hud();
}
function outOfPlay() {
  const p = B.p, last = B.lastTouch?.team || teams[0];
  B.owner = null; B.shot = null; state = 'restart'; restartT = 1.1;
  if (Math.abs(p.x) > HX) { const t = last.opp, x = Math.sign(p.x) * (HX - .3), z = T.MathUtils.clamp(p.z, 1, LEN - 1); banner('Throw-in', null); pending = () => restartWith(t, new T.Vector3(x, R, z)); return; }
  const endTeam = p.z < CZ ? teams.find(t => ownGoalZ(t) === 0) : teams.find(t => ownGoalZ(t) === LEN), endZ = p.z < CZ ? 0 : LEN;
  if (last === endTeam) { const t = endTeam.opp; banner('Corner', null); pending = () => restartWith(t, new T.Vector3(Math.sign(p.x || 1) * (HX - .5), R, endZ + (endZ ? -.5 : .5))); }
  else { banner('Goal kick', null); pending = () => restartWith(endTeam, new T.Vector3(0, R, endZ + (endZ ? -2 : 2)), endTeam.players[0]); }
}
function restartWith(team, spot, taker = null) {
  B.p.copy(spot); B.v.set(0, 0, 0); taker ||= nearest(team, spot, true);
  for (const p of all) if (p !== taker && p.pos.distanceTo(spot) < 4 && p.team !== team) p.pos.add(p.pos.clone().sub(spot).setY(0).normalize().multiplyScalar(4 - p.pos.distanceTo(spot)));
  taker.pos.copy(spot).addScaledVector(new T.Vector3(-Math.sign(spot.x) * .2, 0, team.dir), -.6); taker.pos.y = 0; taker.vel.set(0, 0, 0); give(taker);
}
function endHalf() {
  if (half === 1) { half = 2; state = 'restart'; restartT = 2.5; banner('Half-time', null); whistle(); pending = () => { kickoffPositions(teams[1]); state = 'kickoff'; restartT = 1.2; whistle(); }; return; }
  state = 'over'; whistle(); setTimeout(whistle, 400); const [a, b] = [teams[0].score, teams[1].score];
  $('result-label').textContent = 'Full time'; $('result-title').textContent = a > b ? 'You win!' : a < b ? 'Defeat' : 'Draw';
  $('result-reason').textContent = `${teams[0].name} ${a} – ${b} ${teams[1].name}`; setTimeout(() => { $('result').hidden = false; }, 1200);
}

/* ---------- Simulation step ---------- */
function step(dt) {
  clock += dt;
  if (state === 'goal' || state === 'restart' || state === 'kickoff') {
    restartT -= dt; for (const p of all) { p.vel.multiplyScalar(Math.exp(-dt * 5)); p.busy = Math.max(0, p.busy - dt); p.pos.addScaledVector(p.vel, dt); }
    if (state !== 'kickoff') moveBallLoose(dt);
    if (restartT <= 0) { const before = state, f = pending; pending = null; if (f) f(); if (state === before) state = 'play'; }
    return;
  }
  if (state !== 'play') return;
  matchTime += dt; if (matchTime >= matchLength() * half / 2) return endHalf();
  for (const t of teams) { let best = null, bd = Infinity; for (const p of t.players) { if (p.keeper) continue; const d = p.pos.distanceTo(B.owner ? B.owner.pos : B.p); if (d < bd) { bd = d; best = p; } } t.chaser = best; }
  if (!B.owner && B.lastTouch?.team !== user && controlled && user.chaser !== controlled && controlled.pos.distanceTo(B.p) > user.chaser.pos.distanceTo(B.p) + 4) setControlled(user.chaser);
  const inp = readInput(); if (shootDown) shootHold += dt;
  for (const p of all) {
    p.busy = Math.max(0, p.busy - dt); p.stun = Math.max(0, p.stun - dt);
    if (p.stun > 0) { p.vel.multiplyScalar(Math.exp(-dt * 6)); }
    else if (p === controlled) {
      const sp = (inp.sprint ? 8 : 6.2) * (B.owner === p ? .9 : 1), want = new T.Vector3(inp.x, 0, inp.z).multiplyScalar(sp * inp.mag);
      p.vel.lerp(want, Math.min(1, dt * (inp.mag > .1 ? 6 : 8)));
    } else think(p, dt);
    if (p.busy > 0 && !p.keeper) p.vel.multiplyScalar(Math.exp(-dt * 3));
    p.pos.addScaledVector(p.vel, dt); p.pos.x = T.MathUtils.clamp(p.pos.x, -HX - 1, HX + 1); p.pos.z = T.MathUtils.clamp(p.pos.z, -1, LEN + 1);
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i], b = all[j], d = a.pos.clone().sub(b.pos); d.y = 0; const l = d.length(); if (l < .7 && l > .001) { d.multiplyScalar((.7 - l) / l / 2); a.pos.add(d); b.pos.sub(d); } }
  if (B.owner) {
    const p = B.owner, f = new T.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing)), sp = Math.hypot(p.vel.x, p.vel.z), want = p.pos.clone().addScaledVector(f, .55 + sp * .06); want.y = R;
    B.v.copy(want).sub(B.p).multiplyScalar(12); B.p.lerp(want, Math.min(1, dt * 12)); ball.rotation.x += sp * dt / R;
  } else moveBallLoose(dt);
  if (!B.owner) for (const p of all) {
    if (p.stun > 0 || (p === B.kicker && clock - B.kickTime < .35)) continue;
    const reach = p.keeper && inOwnBox(p) ? 1.25 : .75, d = Math.hypot(B.p.x - p.pos.x, B.p.z - p.pos.z), fast = Math.hypot(B.v.x, B.v.z);
    if (d < reach && B.p.y < (p.keeper ? 2.2 : .9)) {
      if (B.shot && B.shot.team !== p.team && !p.keeper && fast > 14 && Math.random() > .35) continue;
      if (p.keeper && B.shot && B.shot.team !== p.team) { sfx('save'); toast('Saved!'); }
      give(p); B.v.set(0, 0, 0); sfx('touch'); break;
    }
  }
}
const inOwnBox = p => Math.abs(p.pos.x) < BOX_HW && Math.abs(p.pos.z - ownGoalZ(p.team)) < BOX_D;
function moveBallLoose(dt) {
  const p = B.p, v = B.v, prev = p.clone();
  v.y -= G * dt; v.multiplyScalar(Math.exp(-.08 * dt)); p.addScaledVector(v, dt);
  if (p.y < R) { p.y = R; if (v.y < -1) { v.y = -v.y * .5; } else { v.y = 0; const s = Math.hypot(v.x, v.z), ns = Math.max(0, s - 2.6 * dt); if (s > 0) { v.x *= ns / s; v.z *= ns / s; } } }
  ball.rotation.x += v.z * dt / R; ball.rotation.z -= v.x * dt / R;
  if (state !== 'play') return;
  for (const gz of [0, LEN]) if ((prev.z - gz) * (p.z - gz) <= 0 && prev.z !== p.z) {
    if (Math.abs(p.x) < GOAL_HW - R * .5 && p.y < GOAL_H) { const scorer = teams.find(t => attackGoalZ(t) === gz); return goalScored(scorer); }
    if (Math.abs(Math.abs(p.x) - GOAL_HW) < .2 && p.y < GOAL_H + .1) { v.z *= -.6; v.x *= -.4; sfx('post'); return; }
  }
  if (Math.abs(p.x) > HX + R || p.z < -R || p.z > LEN + R) outOfPlay();
}

/* ---------- Camera ---------- */
const camLook = new T.Vector3(0, 0, CZ), camPos = new T.Vector3(-HX - 30, 25, CZ);
function updateCamera(dt) {
  // Elevated touchline camera that tracks the ball along the pitch, like a TV broadcast.
  const portrait = innerHeight > innerWidth, t = B.p;
  const z = T.MathUtils.clamp(t.z, portrait ? 8 : 14, LEN - (portrait ? 8 : 14)), x = T.MathUtils.clamp(t.x, -HX, HX);
  const want = new T.Vector3(-HX - (portrait ? 10 : 4) + x * .45, portrait ? 18 : 11.5, z), look = new T.Vector3(x * .7 + 3.5, 0, z);
  const k = 1 - Math.exp(-dt * (state === 'menu' ? .6 : 2.6)); camPos.lerp(want, k); camLook.lerp(look, k); camera.position.copy(camPos); camera.lookAt(camLook);
}

/* ---------- Sound ---------- */
let audio;
function sfx(kind, vol = 1) {
  if (!settings.sound) return; if (!audio) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; audio = new A(); } if (audio.state === 'suspended') audio.resume(); if (kind === 'ctx') return;
  const c = audio, t = c.currentTime, noise = (len, gain, type, freq) => { const b = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + Math.min(.25, len * .2)); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(f).connect(g).connect(c.destination); s.start(); };
  if (kind === 'kick' || kind === 'touch') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(kind === 'kick' ? 150 : 210, t); o.frequency.exponentialRampToValueAtTime(50, t + .1); g.gain.setValueAtTime(.5 * vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g).connect(c.destination); o.start(); o.stop(t + .16); }
  if (kind === 'cheer') { noise(3.5, .5, 'bandpass', 1000); noise(2.5, .25, 'lowpass', 500); }
  if (kind === 'groan' || kind === 'save') noise(1.6, .28, 'lowpass', 420);
  if (kind === 'post') [420, 1130, 2210].forEach(f => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .8); o.connect(g).connect(c.destination); o.start(); o.stop(t + .9); });
  if (kind === 'whistle') { const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.frequency.value = 2900; lfo.frequency.value = 38; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.1, t + .02); g.gain.setValueAtTime(.1, t + .3); g.gain.linearRampToValueAtTime(0, t + .38); o.connect(g).connect(c.destination); o.start(); lfo.start(); o.stop(t + .4); lfo.stop(t + .4); }
}
const whistle = () => sfx('whistle');

/* ---------- HUD ---------- */
let bannerT = 0, toastT = 0;
function banner(text, good) { const b = $('banner'); b.textContent = text; b.className = 'banner is-on' + (good === true ? ' is-good' : good === false ? ' is-bad' : ''); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('is-on'), 1800); }
function toast(text) { const el = $('toast'); el.textContent = text; el.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('is-on'), 1400); }
function hud() {
  if (!teams.length) return;
  const mins = Math.floor(matchTime / matchLength() * 90), shown = Math.min(mins, half === 1 ? 45 : 90);
  $('sb-home').textContent = teams[0].name; $('sb-away').textContent = teams[1].name; $('sb-score').textContent = `${teams[0].score} – ${teams[1].score}`; $('sb-time').textContent = `${shown}'`;
  $('sb-home-c').style.background = teams[0].color; $('sb-away-c').style.background = teams[1].color;
  const attacking = B.owner?.team === user; $('btn-a').querySelector('b').textContent = attacking ? 'PASS' : 'SWITCH'; $('btn-b').querySelector('b').textContent = attacking ? 'SHOOT' : 'TACKLE'; $('btn-c').querySelector('b').textContent = attacking ? 'SPRINT' : 'PRESS'; $('phase').textContent = attacking ? 'ATTACKING' : B.owner ? 'DEFENDING' : ''; $('phase').className = 'phase' + (attacking ? '' : ' is-def'); $('phase').hidden = !B.owner;
  $('power').style.transform = `scaleX(${shootDown && B.owner === controlled ? T.MathUtils.clamp(.35 + shootHold * 1.3, .35, 1) : 0})`;
}

/* ---------- Menus ---------- */
function syncSegments() { document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(settings[seg.dataset.setting] === b.dataset.value)))); $('btn-sound').classList.toggle('is-off', !settings.sound); }
document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (!b) return; settings[seg.dataset.setting] = b.dataset.value; save(); syncSegments(); }));
$('play').onclick = () => { sfx('ctx'); startMatch(); };
$('again').onclick = () => startMatch();
const toMenu = () => { state = 'menu'; paused = false; $('pause').hidden = true; $('result').hidden = true; $('start').hidden = false; document.body.classList.remove('is-playing'); };
$('to-menu').onclick = toMenu; $('quit').onclick = toMenu;
function togglePause() { if (state === 'menu' || state === 'over') return; paused = !paused; $('pause').hidden = !paused; }
$('btn-pause').onclick = togglePause; $('resume').onclick = togglePause;
$('btn-sound').onclick = () => { settings.sound = !settings.sound; save(); syncSegments(); };
$('btn-full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});

/* ---------- Loop ---------- */
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.fov = w / h < .8 ? 58 : 40; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const timer = new T.Clock(); let hudT = 0;
function loop() {
  const dt = Math.min(timer.getDelta(), 1 / 20);
  if (!paused && state !== 'menu') { const n = 2; for (let i = 0; i < n; i++) step(dt / n); }
  for (const p of all) p.update(paused ? 0 : dt);
  B.p.y = Math.max(B.p.y, R); updateCamera(dt); stadium.update(performance.now() / 1000, state === 'goal' && B.lastTouch?.team === user, dt);
  grade.uniforms.time.value = performance.now() / 1000; if ((hudT -= dt) <= 0) { hud(); hudT = .1; }
  composer.render();
}
if (new URLSearchParams(location.search).has('debug')) window.fb = { sim(seconds) { for (let i = 0; i < seconds * 60; i++) step(1 / 60); for (const p of all) p.update(0); hud(); return { state, score: teams.map(t => t.score), time: matchTime.toFixed(1), owner: B.owner ? (B.owner.team === user ? 'user' : 'cpu') + B.owner.index : null, ball: B.p.toArray().map(v => +v.toFixed(1)) }; } };
syncSegments();
Promise.all([modelsReady, environmentReady, ...jobs]).then(() => {
  buildTeams(); kickoffPositions(teams[0]); state = 'menu'; $('loading').hidden = true; document.body.classList.add('is-ready'); renderer.setAnimationLoop(loop);
}).catch(err => { console.error(err); $('load-progress').textContent = 'Could not load the match. Please refresh.'; });
