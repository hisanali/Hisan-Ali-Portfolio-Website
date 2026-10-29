import { THREE, $, makeWorld, addSky, sunLight, pbr, canvasTexture, loadModel, shadowed, loadingUI, Particles, Sound, ui, seg, clamp, lerp, mulberry } from '/games/world-shared.js';

const KEY = 'reefdive';
const load = loadingUI('Reef Dive');
const { renderer, scene, camera, composer } = makeWorld($('#scene'), { fov: 70, far: 260, bloom: 0.4, threshold: 0.8, radius: 0.6, exposure: 0.95 });
const U = ui(KEY), snd = new Sound(KEY);
$('#credit').textContent = 'Rock texture: Poly Haven (CC0).';

// ---------- Water volume ----------
const DEEP = new THREE.Color(0x03243a), SHALLOW = new THREE.Color(0x0e7f9a);
scene.background = new THREE.Color(0x0a5a78); scene.fog = new THREE.FogExp2(0x0a5a78, 0.022);
const sunLt = sunLight(scene, { color: 0xbfefff, intensity: 2.2, size: 120, mapSize: 1024, far: 300 }); sunLt.position.set(30, 90, 20);
scene.add(new THREE.HemisphereLight(0x5ed0ff, 0x062233, 0.9));
scene.add(new THREE.AmbientLight(0x1b6a8a, 0.5));
// Environment: a small gradient room so metals/glass pick up blue light.
{ const pm = new THREE.PMREMGenerator(renderer); const env = new THREE.Scene(); env.background = new THREE.Color(0x0b6a8c); const top = new THREE.Mesh(new THREE.SphereGeometry(50, 16, 8), new THREE.MeshBasicMaterial({ color: 0x8fe6ff, side: THREE.BackSide })); top.position.y = 60; env.add(top); scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose(); scene.environmentIntensity = 0.6; }

// Caustics: an animated light texture projected from the sun.
const causTex = canvasTexture(256, (c, s) => { c.fillStyle = '#000'; c.fillRect(0, 0, s, s); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; for (let k = 0; k < 24; k++) { c.beginPath(); for (let t = 0; t <= 1.001; t += 0.02) { const a = t * Math.PI * 2; const x = s / 2 + Math.cos(a * 3 + k) * s * 0.3 * Math.sin(k) + Math.cos(a) * s * 0.45; const y = s / 2 + Math.sin(a * 2 + k * 2) * s * 0.3 + Math.sin(a) * s * 0.45; t === 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); } c.filter = 'blur(2px)'; c.drawImage(c.canvas, 0, 0); }, { repeat: 1, srgb: false });
causTex.repeat.set(18, 18);

// ---------- Sea floor and reef ----------
const rnd = mulberry(5);
const SIZE = 420, RES = 140;
function floorH(x, z) { return -24 + Math.sin(x * 0.045) * 3 + Math.cos(z * 0.05 + x * 0.02) * 3.5 + Math.sin(x * 0.17 + z * 0.13) * 0.8; }
const floorMat = pbr('forest_ground_04', { repeat: 40, roughness: 0.95, normalScale: 0.5, color: 0xffffff });
floorMat.map = canvasTexture(512, (c, s) => { c.fillStyle = '#d9c9a3'; c.fillRect(0, 0, s, s); const img = c.getImageData(0, 0, s, s); for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 30; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n * 0.8; } c.putImageData(img, 0, 0); c.globalAlpha = 0.22; c.strokeStyle = '#a88f62'; c.lineWidth = 3; for (let k = 0; k < 30; k++) { c.beginPath(); for (let x = 0; x <= s; x += 12) c.lineTo(x, k * 17 + Math.sin(x * 0.04 + k * 1.3) * 5); c.stroke(); } }, { repeat: 40 }); floorMat.roughnessMap = null; floorMat.emissive = new THREE.Color(0x9fe8ff); floorMat.emissiveMap = causTex; floorMat.emissiveIntensity = 0.55; floorMat.needsUpdate = true;
const fg = new THREE.PlaneGeometry(SIZE, SIZE, RES, RES); fg.rotateX(-Math.PI / 2); { const p = fg.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, floorH(p.getX(i), p.getZ(i))); fg.computeVertexNormals(); }
const floor = new THREE.Mesh(fg, floorMat); floor.receiveShadow = true; scene.add(floor);
const rockMat = pbr('rock_wall_11', { repeat: 2, roughness: 0.9, normalScale: 1, color: 0x9a8f7c });
const coralCols = [0xff6b6b, 0xffa94d, 0xffd43b, 0xf783ac, 0x9775fa, 0x63e6be, 0x4dabf7];
const obstacles = []; // {pos, r}
// Everything on the reef is instanced so the whole scene is a handful of draw calls.
const inst = { rock: [], branch: [], dome: [], knot: [], weed: [] };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const put = (list, x, y, z, rx, ry, rz, sx, sy, sz, col) => { _e.set(rx, ry, rz); _q.setFromEuler(_e); _s.set(sx, sy, sz); _p.set(x, y, z); list.push({ m: _m.compose(_p, _q, _s).clone(), col }); };
function coralCluster(x, z) {
  const y = floorH(x, z);
  const rs = 3 + rnd() * 4; put(inst.rock, x, y, z, rnd() * 3, rnd() * 3, rnd() * 3, rs * (1 + rnd()), rs * (0.6 + rnd() * 0.5), rs * (1 + rnd()), 0xffffff);
  const n = 6 + Math.floor(rnd() * 7);
  for (let i = 0; i < n; i++) {
    const col = coralCols[Math.floor(rnd() * coralCols.length)]; const kind = rnd();
    const a = rnd() * Math.PI * 2, r = 2 + rnd() * 6; const cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r, cy = floorH(cx, cz) + 0.3;
    if (kind < 0.35) { for (let b = 0; b < 7; b++) { const h = 2 + rnd() * 2.5; put(inst.branch, cx + (rnd() - 0.5) * 0.6, cy, cz + (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 1.0, rnd() * 6, (rnd() - 0.5) * 1.0, 1, h, 1, col); } }
    else if (kind < 0.65) { const sr = 1 + rnd() * 1.6; put(inst.dome, cx, cy, cz, 0, rnd() * 6, 0, sr, sr * 0.6, sr, col); }
    else if (kind < 0.85) { const k = 0.8 + rnd() * 0.6; put(inst.knot, cx, cy + k, cz, rnd(), rnd() * 6, 0, k, k, k, col); }
    else { for (let b = 0; b < 12; b++) put(inst.weed, cx + (rnd() - 0.5) * 2, cy, cz + (rnd() - 0.5) * 2, (rnd() - 0.5) * 0.3, rnd() * 6, (rnd() - 0.5) * 0.3, 1, 3 + rnd() * 2, 1, 0x2fb36a); }
  }
  obstacles.push({ pos: new THREE.Vector3(x, y + 2, z), r: 5 });
}
for (let i = 0; i < 120; i++) { const a = rnd() * Math.PI * 2, r = 14 + rnd() * 180; coralCluster(Math.cos(a) * r, Math.sin(a) * r); }
for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, r = 60 + rnd() * 130; const x = Math.cos(a) * r, z = Math.sin(a) * r; const sr = 9 + rnd() * 8; put(inst.rock, x, floorH(x, z) + 2, z, 0, rnd() * 6, 0, sr * 1.2, sr * (0.8 + rnd()), sr * (0.5 + rnd() * 0.6), 0xffffff); obstacles.push({ pos: new THREE.Vector3(x, floorH(x, z) + 2, z), r: 9 }); }
function bake(list, geo, mat, shadow = true) {
  const im = new THREE.InstancedMesh(geo, mat, list.length); const c = new THREE.Color();
  list.forEach((it, i) => { im.setMatrixAt(i, it.m); im.setColorAt(i, c.set(it.col)); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = shadow; im.receiveShadow = true; scene.add(im); return im;
}
const coralMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.7 });
bake(inst.rock, new THREE.IcosahedronGeometry(1, 1), rockMat);
{ const g = new THREE.CylinderGeometry(0.08, 0.25, 1, 6); g.translate(0, 0.5, 0); bake(inst.branch, g, coralMat); }
bake(inst.dome, new THREE.SphereGeometry(1, 12, 9), coralMat);
bake(inst.knot, new THREE.TorusKnotGeometry(1, 0.3, 48, 8, 2, 3), coralMat);
{ const g = new THREE.PlaneGeometry(0.5, 1, 1, 3); g.translate(0, 0.5, 0); const wp = g.attributes.position; for (let v = 0; v < wp.count; v++) wp.setX(v, wp.getX(v) * (1 - wp.getY(v) * 0.7)); bake(inst.weed, g, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }), false); }

// ---------- Fish (instanced boids) ----------
const FISH = 420; const fishGeo = new THREE.ConeGeometry(0.22, 0.9, 6); fishGeo.rotateX(Math.PI / 2);
const fishMat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.5, emissiveIntensity: 0.15 });
const fish = new THREE.InstancedMesh(fishGeo, fishMat, FISH); fish.castShadow = false; scene.add(fish);
const fPos = [], fVel = [], fCol = new THREE.Color(); const schools = 6; const schoolCentres = Array.from({ length: schools }, () => new THREE.Vector3((rnd() - 0.5) * 200, -8 - rnd() * 10, (rnd() - 0.5) * 200)); schoolCentres[0].set(0, -7, 30);
for (let i = 0; i < FISH; i++) { const s = i % schools; const c = schoolCentres[s]; fPos.push(c.clone().add(new THREE.Vector3((rnd() - 0.5) * 12, (rnd() - 0.5) * 5, (rnd() - 0.5) * 12))); fVel.push(new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize().multiplyScalar(4)); fish.setColorAt(i, fCol.setHSL((s / schools + rnd() * 0.08) % 1, 0.85, 0.6)); }
fish.instanceColor.needsUpdate = true;
const fm = new THREE.Matrix4(), fq = new THREE.Quaternion(), fu = new THREE.Vector3(), fs = new THREE.Vector3(1, 1, 1);
function boids(dt) {
  for (let s = 0; s < schools; s++) { const c = schoolCentres[s]; c.x += Math.sin(S.time * 0.2 + s) * dt * 6; c.z += Math.cos(S.time * 0.17 + s * 2) * dt * 6; if (c.length() > 190) c.multiplyScalar(0.995); c.y = -8 - s * 2 + Math.sin(S.time * 0.3 + s) * 3; }
  for (let i = 0; i < FISH; i++) {
    const p = fPos[i], v = fVel[i], c = schoolCentres[i % schools];
    fu.subVectors(c, p); v.addScaledVector(fu, dt * 0.6);
    const j = (i * 7 + 3) % FISH; fu.subVectors(p, fPos[j]); const d = fu.length(); if (d < 1.2 && d > 0) v.addScaledVector(fu, dt * 4 / d); else if (d < 6) v.addScaledVector(fVel[j], dt * 0.3);
    fu.subVectors(p, sub.pos); const ds = fu.length(); if (ds < 10) v.addScaledVector(fu, dt * 30 / (ds + 0.1));
    const sp = v.length(); if (sp > 7) v.multiplyScalar(7 / sp); if (sp < 2.5) v.multiplyScalar(1.05);
    p.addScaledVector(v, dt); const fl = floorH(p.x, p.z) + 2; if (p.y < fl) { p.y = fl; v.y = Math.abs(v.y); } if (p.y > -2) { p.y = -2; v.y = -Math.abs(v.y); }
    fq.setFromUnitVectors(new THREE.Vector3(0, 0, 1), fu.copy(v).normalize()); fs.setScalar(0.8 + (i % 5) * 0.12); fs.z = fs.x * (1 + Math.sin(S.time * 9 + i) * 0.08); fm.compose(p, fq, fs); fish.setMatrixAt(i, fm);
  }
  fish.instanceMatrix.needsUpdate = true;
}

// ---------- Jellyfish, pearls, vents ----------
const jellies = []; const jellyMat = new THREE.MeshPhysicalMaterial({ color: 0xff7bd1, emissive: 0xff4fb8, emissiveIntensity: 0.9, transparent: true, opacity: 0.55, roughness: 0.2, side: THREE.DoubleSide });
for (let i = 0; i < 16; i++) { const g = new THREE.Group(); const bell = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), jellyMat); g.add(bell); for (let t = 0; t < 7; t++) { const ten = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 4, 4), jellyMat); ten.position.set(Math.cos(t) * 0.8, -2, Math.sin(t) * 0.8); g.add(ten); } g.position.set((rnd() - 0.5) * 240, -6 - rnd() * 12, (rnd() - 0.5) * 240); g.userData.ph = rnd() * 6; if (i < 5) { const light = new THREE.PointLight(0xff5fc0, 6, 14, 2); g.add(light); } scene.add(g); jellies.push(g); }
const pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xfff6ea, emissive: 0xffe9c8, emissiveIntensity: 1.1, roughness: 0.05, metalness: 0.1, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6 });
const pearls = []; const pearlGeo = new THREE.SphereGeometry(0.7, 16, 12);
function spawnPearls(n) { for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, r = 20 + rnd() * 170; const x = Math.cos(a) * r, z = Math.sin(a) * r; const m = new THREE.Mesh(pearlGeo, pearlMat); m.position.set(x, floorH(x, z) + 2 + rnd() * 10, z); scene.add(m); pearls.push(m); } }
const vents = []; const ventGeo = new THREE.CylinderGeometry(1.4, 2, 1.2, 12);
for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.5, r = 70 + rnd() * 60; const x = Math.cos(a) * r, z = Math.sin(a) * r; const m = new THREE.Mesh(ventGeo, new THREE.MeshStandardMaterial({ color: 0x55606a, roughness: 0.6, emissive: 0x3fd8ff, emissiveIntensity: 0.5 })); m.position.set(x, floorH(x, z) + 0.5, z); scene.add(m); vents.push(m.position); const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.12, 8, 32), new THREE.MeshStandardMaterial({ color: 0x9ff3ff, emissive: 0x3fd8ff, emissiveIntensity: 1.2 })); ring.rotation.x = Math.PI / 2; ring.position.copy(m.position).add(new THREE.Vector3(0, 0.8, 0)); scene.add(ring); }
const bubbles = new Particles(scene, 900, 0xd9f6ff, 0.5);

// ---------- Submersible ----------
const sub = { root: new THREE.Group(), pos: new THREE.Vector3(0, -8, 60), vel: new THREE.Vector3(), yaw: Math.PI, pitch: 0, roll: 0 };
{
  const hullMat = new THREE.MeshPhysicalMaterial({ color: 0xffb020, roughness: 0.3, metalness: 0.2, clearcoat: 0.8 });
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.4, 6, 16), hullMat); hull.rotation.x = Math.PI / 2; hull.castShadow = true; sub.root.add(hull);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0x8fd8ff, transmission: 0.9, roughness: 0.05, thickness: 0.4, transparent: true, opacity: 0.85 })); dome.position.set(0, 0.35, -1.5); sub.root.add(dome);
  for (const sx of [-1, 1]) { const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 10), new THREE.MeshStandardMaterial({ color: 0x2e3440, metalness: 0.6, roughness: 0.4 })); pod.rotation.x = Math.PI / 2; pod.position.set(sx * 1.25, -0.2, 0.6); sub.root.add(pod); const prop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.2), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.3 })); prop.position.set(sx * 1.25, -0.2, 1.5); prop.userData.prop = true; sub.root.add(prop); }
  const lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5d0, emissiveIntensity: 4 })); lampMesh.position.set(0, -0.3, -2.1); sub.root.add(lampMesh);
  const lamp = new THREE.SpotLight(0xfff2cc, 120, 60, 0.5, 0.5, 1.4); lamp.position.set(0, -0.3, -2); lamp.target.position.set(0, -0.6, -40); lamp.castShadow = false; sub.root.add(lamp); sub.root.add(lamp.target);
  scene.add(sub.root);
}
const props = []; sub.root.traverse(o => { if (o.userData.prop) props.push(o); });

// ---------- State ----------
const S = { mode: 'menu', time: 0, score: 0, air: 100, pearlsGot: 0, depthBest: 0, stings: 0, chain: 0, lastPearl: -99 };
const input = { left: false, right: false, up: false, down: false, dive: false, rise: false };
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['arrowleft', 'a'].includes(k)) input.left = true; if (['arrowright', 'd'].includes(k)) input.right = true; if (['arrowup', 'w'].includes(k)) input.up = true; if (['arrowdown', 's'].includes(k)) input.down = true; if (k === 'q' || k === 'shift') input.rise = true; if (k === 'e' || k === ' ') { input.dive = true; e.preventDefault(); } if (k === 'p' || k === 'escape') togglePause(); if (k === 'enter' && S.mode === 'menu') start(); });
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (['arrowleft', 'a'].includes(k)) input.left = false; if (['arrowright', 'd'].includes(k)) input.right = false; if (['arrowup', 'w'].includes(k)) input.up = false; if (['arrowdown', 's'].includes(k)) input.down = false; if (k === 'q' || k === 'shift') input.rise = false; if (k === 'e' || k === ' ') input.dive = false; });
const touch = $('#touch'); touch.innerHTML = '<button data-k="left" aria-label="Turn left">◀</button><button data-k="dive" aria-label="Dive">▼</button><button data-k="rise" aria-label="Rise">▲</button><button data-k="right" aria-label="Turn right">▶</button>';
touch.querySelectorAll('button').forEach(b => { const k = b.dataset.k; const on = e => { e.preventDefault(); input[k] = true; }; const off = e => { e.preventDefault(); input[k] = false; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
$('#btn-sound').addEventListener('click', () => snd.toggle());
$('#btn-menu').addEventListener('click', () => { if (S.mode === 'playing' || S.mode === 'paused') endGame('Dive ended', 'You surfaced for the menu.'); });
function togglePause() { if (S.mode === 'playing') { S.mode = 'paused'; U.showBanner('Paused', 99999); } else if (S.mode === 'paused') { S.mode = 'playing'; U.showBanner('', 0); } }

const card = $('#start-card');
card.innerHTML = `<p class="lede">A living reef off the Daymaniyat Islands: schools of fish part around your sub, jellyfish drift through the beams and pearls glow in the coral. Air runs down. Bubble vents refill it.</p>
<ul class="facts"><li>Pearls to collect</li><li>Fish that react to you</li><li>Air management</li><li>Best: <b id="best-lbl">${U.best.get()}</b></li></ul>
<div class="field"><span>Air supply</span><div class="seg" id="seg-air"></div></div>
<button class="primary" id="play" type="button"><span>Dive<small>↑ thrust · ←/→ turn · Space dive · Shift rise</small></span><span aria-hidden="true">→</span></button>
<p class="note">Pearls taken quickly in a row score more. Jellyfish stings cost air. Below the reef floor, pressure drains air faster.</p>`;
const getAir = seg($('#seg-air'), [{ value: 'long', label: 'Generous' }, { value: 'normal', label: 'Standard' }, { value: 'short', label: 'Tight' }], 'normal');
$('#play').addEventListener('click', start);
$('#again').addEventListener('click', () => { $('#result').hidden = true; start(); });
$('#to-menu').addEventListener('click', () => { $('#result').hidden = true; $('#start').hidden = false; $('#best-lbl').textContent = U.best.get(); S.mode = 'menu'; U.setHud(null); touch.classList.remove('on'); });
let airRate = 1;
function start() {
  snd.ensure(); airRate = { long: 0.6, normal: 1, short: 1.5 }[getAir()];
  for (const p of pearls) scene.remove(p); pearls.length = 0; spawnPearls(28);
  sub.pos.set(0, -8, 60); sub.vel.set(0, 0, 0); sub.yaw = Math.PI; sub.pitch = 0;
  Object.assign(S, { score: 0, air: 100, pearlsGot: 0, depthBest: 0, stings: 0, chain: 0, lastPearl: -99 }); S.mode = 'playing'; $('#start').hidden = true; touch.classList.add('on'); U.showBanner('Find the pearls', 1200); hud();
}
function hud() { U.setHud([['Pearls', `${S.pearlsGot} / 28`], ['Score', Math.round(S.score)], ['Air', Math.max(0, Math.round(S.air)) + '%', 'o2'], ['Depth', Math.round(-sub.pos.y) + ' m', 'speed']]); }
function endGame(title, reason) {
  S.mode = 'over'; const score = Math.round(S.score); const isBest = score > U.best.get(); if (isBest) U.best.set(score);
  $('#result-label').textContent = isBest ? 'New best' : 'Dive over'; $('#result-title').textContent = title; $('#result-reason').textContent = reason;
  $('#result-stats').innerHTML = `<div><small>Score</small><b>${score}</b></div><div><small>Pearls</small><b>${S.pearlsGot}/28</b></div><div><small>Deepest</small><b>${Math.round(S.depthBest)} m</b></div>`;
  $('#result').hidden = false; U.setHud(null); touch.classList.remove('on');
}

// ---------- Sub physics ----------
const fwd = new THREE.Vector3();
function pilot(dt) {
  const coarse = matchMedia('(pointer:coarse)').matches;
  const turn = (input.right ? 1 : 0) - (input.left ? 1 : 0); const thrust = input.up || coarse ? 1 : input.down ? -0.5 : 0;
  const vert = (input.rise ? 1 : 0) - (input.dive ? 1 : 0);
  sub.yaw -= turn * 1.4 * dt; sub.roll = lerp(sub.roll, -turn * 0.35, 0.1); sub.pitch = lerp(sub.pitch, -vert * 0.35, 0.08);
  fwd.set(Math.sin(sub.yaw), 0, Math.cos(sub.yaw));
  sub.vel.addScaledVector(fwd, thrust * 14 * dt); sub.vel.y += vert * 9 * dt; sub.vel.multiplyScalar(Math.pow(0.35, dt));
  sub.pos.addScaledVector(sub.vel, dt);
  const fl = floorH(sub.pos.x, sub.pos.z) + 1.6; if (sub.pos.y < fl) { sub.pos.y = fl; sub.vel.y = Math.abs(sub.vel.y) * 0.3; } if (sub.pos.y > -1.5) { sub.pos.y = -1.5; sub.vel.y = -Math.abs(sub.vel.y); }
  const R = 200; if (sub.pos.length() > R) { sub.pos.setLength(R); sub.vel.multiplyScalar(0.5); U.toast('Open water, turn back'); }
  for (const o of obstacles) { const d = sub.pos.clone().sub(o.pos); const L = d.length(); if (L < o.r + 1.2) { sub.pos.addScaledVector(d.normalize(), o.r + 1.2 - L); sub.vel.multiplyScalar(0.6); if (sub.vel.length() > 4) { snd.play(120, 0.15, 'square', 0.1, -60); U.doFlash(); S.air -= 2; } } }
  if (Math.random() < 0.6) bubbles.burst(sub.pos.x + (Math.random() - 0.5), sub.pos.y - 0.2, sub.pos.z + Math.cos(sub.yaw) * 1.6, 1, 0xd9f6ff, 0.5, 2.2);
  // Air.
  const depth = -sub.pos.y; S.depthBest = Math.max(S.depthBest, depth);
  S.air -= dt * airRate * (1.4 + Math.max(0, depth - 15) * 0.08);
  let nearVent = false; for (const v of vents) if (v.distanceTo(sub.pos) < 5) { nearVent = true; S.air = Math.min(100, S.air + dt * 25); }
  if (nearVent && Math.floor(S.time * 10) % 3 === 0) U.setHint('Refilling air'); else if (S.air < 25) U.setHint('Air low. Find a bubble vent.'); else U.setHint('');
  if (S.air <= 0) { endGame('Out of air', `${S.pearlsGot} pearls, deepest ${Math.round(S.depthBest)} m.`); return; }
  // Pearls.
  for (let i = pearls.length - 1; i >= 0; i--) { const p = pearls[i]; if (p.position.distanceTo(sub.pos) < 2.6) { scene.remove(p); pearls.splice(i, 1); S.pearlsGot++; S.chain = (S.time - S.lastPearl < 8) ? S.chain + 1 : 1; S.lastPearl = S.time; const pts = 100 * Math.min(5, S.chain); S.score += pts; bubbles.burst(p.position.x, p.position.y, p.position.z, 30, 0xfff1c8, 5, 1); snd.play(880 + S.chain * 60, 0.2, 'sine', 0.14, 400); U.toast(`Pearl +${pts}${S.chain > 1 ? ' · x' + Math.min(5, S.chain) : ''}`); if (S.pearlsGot >= 28) { endGame('Reef cleared', `Every pearl with ${Math.round(S.air)}% air to spare.`); return; } } }
  // Jellyfish stings.
  for (const j of jellies) if (j.position.distanceTo(sub.pos) < 2.4 && S.time - (j.userData.last || -9) > 2) { j.userData.last = S.time; S.air -= 12; S.stings++; U.doFlash(); snd.play(200, 0.3, 'sawtooth', 0.12, -120); U.toast('Stung! Air -12'); }
  S.score += dt * 2;
}

const clock = new THREE.Clock(); const camPos = new THREE.Vector3(0, -4, 72);
function loop() {
  requestAnimationFrame(loop); const dt = Math.min(0.05, clock.getDelta()); S.time += dt;
  if (S.mode === 'playing') { pilot(dt); if (Math.floor(S.time * 4) % 2 === 0) hud(); }
  else if (S.mode === 'menu' || S.mode === 'over') { sub.yaw = Math.PI + Math.sin(S.time * 0.2) * 0.4; sub.pos.set(Math.sin(S.time * 0.15) * 30, -7 + Math.sin(S.time * 0.5) * 1.5, 40 + Math.cos(S.time * 0.15) * 30); }
  boids(dt);
  sub.root.position.copy(sub.pos); sub.root.rotation.set(0, 0, 0); sub.root.rotateY(sub.yaw); sub.root.rotateX(sub.pitch); sub.root.rotateZ(sub.roll);
  for (const p of props) p.rotation.z += dt * 30;
  jellies.forEach((j, i) => { j.position.y += Math.sin(S.time * 1.2 + j.userData.ph) * dt * 1.5; j.position.x += Math.sin(S.time * 0.3 + i) * dt * 0.8; j.scale.y = 1 + Math.sin(S.time * 2.4 + j.userData.ph) * 0.15; j.scale.x = j.scale.z = 1 - Math.sin(S.time * 2.4 + j.userData.ph) * 0.1; if (j.position.y > -3) j.position.y = -18; });
  for (const p of pearls) p.position.y += Math.sin(S.time * 2 + p.position.x) * dt * 0.4;
  for (const v of vents) if (Math.random() < 0.5) bubbles.burst(v.x + (Math.random() - 0.5) * 2, v.y + 1, v.z + (Math.random() - 0.5) * 2, 1, 0xd9f6ff, 0.3, 3);
  bubbles.update(dt, 0.99, -2.2);
  causTex.offset.set(Math.sin(S.time * 0.21) * 0.08 + S.time * 0.01, S.time * 0.02);
  sunLt.position.set(sub.pos.x + 30, 90, sub.pos.z + 20); sunLt.target.position.copy(sub.pos);
  // Colour the fog with depth.
  const t = clamp((-sub.pos.y) / 30, 0, 1); scene.fog.color.copy(SHALLOW).lerp(DEEP, t); scene.background.copy(scene.fog.color);
  const back = new THREE.Vector3(Math.sin(sub.yaw), 0, Math.cos(sub.yaw)).multiplyScalar(-10); back.y = 3;
  camPos.lerp(sub.pos.clone().add(back), 1 - Math.pow(0.002, dt));
  camera.position.copy(camPos); camera.lookAt(sub.pos.x, sub.pos.y + 0.5, sub.pos.z); camera.rotateZ(Math.sin(S.time * 0.5) * 0.01);
  composer.render();
}
document.body.classList.add('is-ready'); load.done(); loop();
