import { THREE, SimplexNoise, $, makeWorld, addSky, sunLight, pbr, canvasTexture, waterNormals, loadModel, shadowed, loadingUI, Particles, Sound, ui, seg, clamp, lerp, mulberry } from '/games/world-shared.js';
import { Water } from '/evermile/vendor/objects/Water.js';

const KEY = 'duneglider';
const load = loadingUI('Dune Glider');
const { renderer, scene, camera, composer } = makeWorld($('#scene'), { fov: 64, far: 2400, bloom: 0.16, threshold: 0.96, radius: 0.5, exposure: 0.72 });
const U = ui(KEY), snd = new Sound(KEY);
$('#credit').textContent = 'Terrain textures: Poly Haven (CC0). Trees: forest kit (CC BY 4.0).';

// ---------- Golden hour ----------
const sky = addSky(renderer, scene, { elevation: 10, azimuth: 215, turbidity: 6, rayleigh: 2.0, mie: 0.008, mieG: 0.82, intensity: 0.45 });
scene.fog = new THREE.FogExp2(0xf0c9a0, 0.0007);
const sun = sunLight(scene, { color: 0xffc98a, intensity: 2.6, size: 260, mapSize: 2048, far: 900 });
scene.add(new THREE.HemisphereLight(0xffd9b0, 0x8a5a2a, 0.35));

// ---------- Dunes ----------
const noise = new SimplexNoise({ random: mulberry(9) });
const SIZE = 2400, RES = 190;
function height(x, z) {
  const r1 = noise.noise(x * 0.0011, z * 0.0007), r2 = noise.noise(x * 0.0032 + 7, z * 0.0021), r3 = noise.noise(x * 0.011, z * 0.009 + 3);
  // Long crescent ridges running north-south with a sharp lee side.
  const ridge = Math.pow(Math.abs(Math.sin((x * 0.004 + r1 * 1.8))), 0.6) * 1;
  let h = 18 + r1 * 42 + ridge * 38 + r2 * 10 + r3 * 2.2;
  const oasis = Math.hypot(x - 60, z + 420); if (oasis < 160) h = lerp(0, h, Math.pow(oasis / 160, 1.4)) - 2;
  const d = Math.hypot(x, z); if (d < 110) h = lerp(14, h, Math.pow(d / 110, 2)); // flat launch pad
  return h;
}
const sandMat = pbr('forest_ground_04', { repeat: 70, roughness: 0.9, normalScale: 0.3, color: 0xffffff });
sandMat.map = canvasTexture(512, (c, s) => { c.fillStyle = '#e9b97e'; c.fillRect(0, 0, s, s); const img = c.getImageData(0, 0, s, s); for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 26; img.data[i] += n; img.data[i + 1] += n * 0.9; img.data[i + 2] += n * 0.7; } c.putImageData(img, 0, 0); c.globalAlpha = 0.18; c.strokeStyle = '#b8803f'; for (let k = 0; k < 40; k++) { c.beginPath(); c.moveTo(0, k * 13 + Math.random() * 6); for (let x = 0; x <= s; x += 16) c.lineTo(x, k * 13 + Math.sin(x * 0.05 + k) * 4); c.stroke(); } }, { repeat: 70 });
sandMat.roughnessMap = null; sandMat.needsUpdate = true;
const geo = new THREE.PlaneGeometry(SIZE, SIZE, RES, RES); geo.rotateX(-Math.PI / 2);
{ const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i))); geo.computeVertexNormals(); }
const dunes = new THREE.Mesh(geo, sandMat); dunes.receiveShadow = true; dunes.castShadow = true; scene.add(dunes);
const far = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({ color: 0xe3ab74, roughness: 1 })); far.rotation.x = -Math.PI / 2; far.position.y = -4; scene.add(far);

// Oasis water + palms.
const water = new Water(new THREE.CircleGeometry(95, 48), { textureWidth: 512, textureHeight: 512, waterNormals: waterNormals(), sunDirection: sky.sun.clone(), sunColor: 0xffe0b0, waterColor: 0x1d6f74, distortionScale: 2.2, fog: true });
water.rotation.x = -Math.PI / 2; water.position.set(60, -1.2, -420); scene.add(water);
const trunkMat = pbr('bark_brown_02', { repeat: 1, roughness: 0.9 }); const frondMat = new THREE.MeshStandardMaterial({ color: 0x3f8a3c, roughness: 0.8, side: THREE.DoubleSide });
const rnd = mulberry(31);
for (let i = 0; i < 26; i++) {
  const a = rnd() * Math.PI * 2, r = 100 + rnd() * 40; const x = 60 + Math.cos(a) * r, z = -420 + Math.sin(a) * r; const y = height(x, z);
  const palm = new THREE.Group(); const h = 9 + rnd() * 6;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, h, 7), trunkMat); trunk.position.y = h / 2; trunk.rotation.z = (rnd() - 0.5) * 0.25; trunk.castShadow = true; palm.add(trunk);
  for (let k = 0; k < 9; k++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 5.5, 1, 4), frondMat); f.geometry.translate(0, 2.4, 0); const fp = f.geometry.attributes.position; for (let v = 0; v < fp.count; v++) fp.setZ(v, -Math.pow(fp.getY(v) / 5, 2) * 2.4); f.position.set(trunk.position.x + Math.sin(trunk.rotation.z) * -h, h, 0); f.rotation.y = k / 9 * Math.PI * 2; f.rotation.x = -0.5; f.castShadow = true; palm.add(f); }
  palm.position.set(x, y, z); scene.add(palm);
}

// ---------- Thermals ----------
// ---------- Air-race gates ----------
// Each gate is a pair of inflatable fabric pylons standing on the sand, like an air-race course.
// Fly between the two pylons, below their tops.
const GATE_HALF = 11, GATE_TALL = 34;
const bandTex = (a, b) => canvasTexture(256, (c, s) => {
  for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? b : a; c.fillRect(0, k * s / 4, s, s / 4); }
  const img = c.getImageData(0, 0, s, s); for (let k = 0; k < img.data.length; k += 4) { const n = (Math.random() - 0.5) * 10; img.data[k] += n; img.data[k + 1] += n; img.data[k + 2] += n; } c.putImageData(img, 0, 0);
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; for (let x = 0; x < s; x += s / 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, s); c.stroke(); }
}, { repeat: 1 });
const liveTex = bandTex('#d7362a', '#f3f0ea'), doneTex = bandTex('#8d8a85', '#d8d4cc');
const skirtMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
const rings = []; let route = [];
function pylon(x, z, top, mat) {
  const base = Math.max(height(x, z), -1.2), h = top - base;
  // Fabric profile: tapered tube with a slight bulge between the internal baffles, rounded top.
  const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40; let r = lerp(1.6, 1.15, t) + Math.abs(Math.sin(t * Math.PI * 7)) * 0.06; if (t > 0.96) r *= Math.sqrt(Math.max(0, 1 - (t - 0.96) / 0.04)); pts.push(new THREE.Vector2(r, t * h)); }
  pts.push(new THREE.Vector2(0, h + 0.4));
  const g = new THREE.Group(); g.position.set(x, base, z);
  const tube = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), mat); tube.castShadow = tube.receiveShadow = true; g.add(tube);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.6, 28), skirtMat); skirt.position.y = 0.3; skirt.receiveShadow = true; g.add(skirt);
  scene.add(g); return g;
}
function buildRoute() {
  for (const r of rings) for (const m of r.pylons) scene.remove(m); rings.length = 0; route = [];
  let x = 0, z = -140, dir = Math.PI; const rr = mulberry(123);
  for (let i = 0; i < 18; i++) {
    dir += (rr() - 0.5) * 1.1; x += Math.sin(dir) * 150; z += Math.cos(dir) * 150;
    if (i === 8) { x = 60; z = -420; } // through the oasis
    const normal = new THREE.Vector3(Math.sin(dir), 0, Math.cos(dir)), lateral = new THREE.Vector3(Math.cos(dir), 0, -Math.sin(dir));
    const ground = Math.max(height(x, z), 0), top = ground + GATE_TALL + rr() * 8;
    const mat = new THREE.MeshStandardMaterial({ map: liveTex, roughness: 0.75 });
    const pylons = [-1, 1].map(sd => pylon(x + lateral.x * GATE_HALF * sd, z + lateral.z * GATE_HALF * sd, top, mat));
    const pos = new THREE.Vector3(x, top - 12, z);
    rings.push({ pylons, mat, pos, normal, lateral, top, got: false, ph: rr() * 6 }); route.push(pos);
  }
}
buildRoute();
const particles = new Particles(scene, 700, 0xffffff, 1.4);
// Heat shimmer motes to make air visible when diving.
const MOTES = 900; const motePos = new Float32Array(MOTES * 3); for (let i = 0; i < MOTES; i++) { motePos[i * 3] = (Math.random() - 0.5) * 400; motePos[i * 3 + 1] = Math.random() * 120; motePos[i * 3 + 2] = (Math.random() - 0.5) * 400; }
const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
const dot = canvasTexture(32, (c, s) => { const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.clearRect(0, 0, s, s); c.fillStyle = g; c.fillRect(0, 0, s, s); }, { srgb: false });
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xfff0d0, size: 0.9, map: dot, transparent: true, opacity: 0.3, depthWrite: false })); motes.frustumCulled = false; scene.add(motes);

// ---------- Glider ----------
const glider = new THREE.Group(); scene.add(glider);
{
  const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0); wingShape.lineTo(-7.5, 2.6); wingShape.lineTo(-6.8, 3.4); wingShape.lineTo(0, 1.6); wingShape.lineTo(6.8, 3.4); wingShape.lineTo(7.5, 2.6); wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ShapeGeometry(wingShape, 6); wingGeo.rotateX(-Math.PI / 2); wingGeo.translate(0, 0, -1.4);
  const sailTex = canvasTexture(256, (c, s) => { c.fillStyle = '#f6f1e6'; c.fillRect(0, 0, s, s); c.fillStyle = '#e3482f'; c.fillRect(0, 0, s, s * 0.22); c.fillStyle = '#1e2a44'; c.fillRect(0, s * 0.22, s, s * 0.08); });
  const sail = new THREE.Mesh(wingGeo, new THREE.MeshStandardMaterial({ map: sailTex, roughness: 0.65, side: THREE.DoubleSide })); sail.castShadow = true; glider.add(sail);
  const barMat = new THREE.MeshStandardMaterial({ color: 0xcfd3da, metalness: 0.9, roughness: 0.3 });
  const keel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6), barMat); keel.rotation.x = Math.PI / 2; keel.position.set(0, -0.02, 0.6); glider.add(keel);
  for (const sx of [-1, 1]) { const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), barMat); strut.position.set(sx * 0.65, -1.0, 0.6); strut.rotation.z = sx * 0.55; glider.add(strut); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), barMat); bar.rotation.z = Math.PI / 2; bar.position.set(0, -2.0, 0.6); glider.add(bar);
  // Pilot in a harness.
  const pilot = new THREE.Group(); const suit = new THREE.MeshStandardMaterial({ color: 0x1f6fd8, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.5, 4, 10), suit); body.rotation.x = Math.PI / 2; pilot.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 })); head.position.set(0, 0.08, 1.05); pilot.add(head);
  pilot.position.set(0, -1.7, 0.4); pilot.castShadow = true; glider.add(pilot);
}
const P = { pos: new THREE.Vector3(0, 60, -40), vel: new THREE.Vector3(0, 0, -26), yaw: Math.PI, pitch: 0, roll: 0, alive: true };

// ---------- State ----------
const S = { mode: 'menu', time: 0, score: 0, got: 0, flight: 0, mult: 1, chain: 0, lastRing: 0, stall: 0 };
const input = { left: false, right: false, up: false, down: false, boost: false };
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['arrowleft', 'a'].includes(k)) input.left = true; if (['arrowright', 'd'].includes(k)) input.right = true; if (['arrowup', 'w'].includes(k)) input.up = true; if (['arrowdown', 's'].includes(k)) input.down = true; if (k === ' ') { input.boost = true; e.preventDefault(); } if (k === 'p' || k === 'escape') togglePause(); if (k === 'enter' && S.mode === 'menu') start(); });
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (['arrowleft', 'a'].includes(k)) input.left = false; if (['arrowright', 'd'].includes(k)) input.right = false; if (['arrowup', 'w'].includes(k)) input.up = false; if (['arrowdown', 's'].includes(k)) input.down = false; if (k === ' ') input.boost = false; });
const touch = $('#touch'); touch.innerHTML = '<button data-k="left" aria-label="Bank left">◀</button><button data-k="down" aria-label="Dive">DIVE</button><button data-k="up" aria-label="Climb">RISE</button><button data-k="right" aria-label="Bank right">▶</button>';
touch.querySelectorAll('button').forEach(b => { const k = b.dataset.k; const on = e => { e.preventDefault(); input[k] = true; }; const off = e => { e.preventDefault(); input[k] = false; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
// Tilt steering on phones.
let tilt = 0; window.addEventListener('deviceorientation', e => { if (typeof e.gamma === 'number') tilt = clamp(e.gamma / 25, -1, 1); });
$('#btn-sound').addEventListener('click', () => snd.toggle());
$('#btn-menu').addEventListener('click', () => { if (S.mode === 'playing' || S.mode === 'paused') endGame('Flight ended', 'You returned to the menu.'); });
function togglePause() { if (S.mode === 'playing') { S.mode = 'paused'; U.showBanner('Paused', 99999); } else if (S.mode === 'paused') { S.mode = 'playing'; U.showBanner('', 0); } }

const card = $('#start-card');
card.innerHTML = `<p class="lede">Golden hour over the Sharqiya sands. Dive to gain speed, pull up to trade it for height, and fly between the red pylon gates before the sun goes down. Touch the dunes and the flight is over.</p>
<ul class="facts"><li><b>18</b> gates</li><li>Real glide physics</li><li>Gate chains multiply</li><li>Best: <b id="best-lbl">${U.best.get()}</b></li></ul>
<div class="field"><span>Wind</span><div class="seg" id="seg-wind"></div></div>
<button class="primary" id="play" type="button"><span>Launch<small>↑/↓ pitch · ←/→ bank · tilt your phone to steer</small></span><span aria-hidden="true">→</span></button>
<p class="note">Gates flown in a row build a multiplier. Clipping a pylon costs points. Skimming the sand close without touching it earns a bonus.</p>`;
const getWind = seg($('#seg-wind'), [{ value: 'calm', label: 'Calm' }, { value: 'breeze', label: 'Breeze' }, { value: 'gusty', label: 'Gusty' }], 'breeze');
$('#play').addEventListener('click', start);
$('#again').addEventListener('click', () => { $('#result').hidden = true; start(); });
$('#to-menu').addEventListener('click', () => { $('#result').hidden = true; $('#start').hidden = false; $('#best-lbl').textContent = U.best.get(); S.mode = 'menu'; U.setHud(null); touch.classList.remove('on'); });
let ready = false;
async function init() {
  load.set('Shaping the dunes');
  const rockMat = pbr('rock_wall_11', { repeat: 2, roughness: 0.9, color: 0xb08a5a }); for (let i = 0; i < 36; i++) { const x = (rnd() - 0.5) * 1800, z = (rnd() - 0.5) * 1800; if (Math.hypot(x, z) < 150) continue; const b = new THREE.Mesh(new THREE.DodecahedronGeometry(3 + rnd() * 7, 1), rockMat); b.position.set(x, height(x, z) - 1, z); b.scale.y = 0.5 + rnd() * 0.4; b.rotation.set(rnd(), rnd() * 6, rnd()); b.castShadow = b.receiveShadow = true; scene.add(b); }
  ready = true; load.done(); document.body.classList.add('is-ready');
  if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) $('#play').addEventListener('click', () => DeviceOrientationEvent.requestPermission().catch(() => {}), { once: true });
}
let wind = 0;
function start() {
  if (!ready) return; snd.ensure(); wind = { calm: 0, breeze: 4, gusty: 9 }[getWind()];
  P.pos.set(0, 62, -40); P.vel.set(0, 0, -26); P.yaw = Math.PI; P.pitch = 0; P.roll = 0; P.alive = true;
  Object.assign(S, { score: 0, got: 0, flight: 0, mult: 1, chain: 0, lastRing: 0, stall: 0 }); for (const r of rings) { r.got = false; r.mat.map = liveTex; r.mat.needsUpdate = true; } S.next = 0;
  S.mode = 'playing'; $('#start').hidden = true; touch.classList.add('on'); U.showBanner('Fly the gates', 1200); hud();
}
function hud() { U.setHud([['Gates', `${S.got} / ${rings.length}`], ['Score', S.score], ['Speed', Math.round(P.vel.length() * 3.6) + ' km/h', 'speed'], ['Height', Math.max(0, Math.round(P.pos.y - height(P.pos.x, P.pos.z))) + ' m', 'drift']]); }
function endGame(title, reason) {
  S.mode = 'over'; const score = Math.round(S.score + S.flight * 2); const isBest = score > U.best.get(); if (isBest) U.best.set(score);
  $('#result-label').textContent = isBest ? 'New best' : 'Flight over'; $('#result-title').textContent = title; $('#result-reason').textContent = reason;
  $('#result-stats').innerHTML = `<div><small>Score</small><b>${score}</b></div><div><small>Gates</small><b>${S.got}/${rings.length}</b></div><div><small>Airtime</small><b>${Math.round(S.flight)}s</b></div>`;
  $('#result').hidden = false; U.setHud(null); touch.classList.remove('on');
}

// ---------- Flight model ----------
const fwd = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
function fly(dt) {
  const coarse = matchMedia('(pointer:coarse)').matches;
  const bank = (input.right ? 1 : 0) - (input.left ? 1 : 0) + (coarse ? tilt : 0);
  const pitchIn = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  P.roll = lerp(P.roll, clamp(bank, -1, 1) * 0.9, 1 - Math.pow(0.02, dt));
  P.yaw -= P.roll * 1.1 * dt;
  P.pitch = lerp(P.pitch, pitchIn * 0.55, 1 - Math.pow(0.05, dt));
  fwd.set(Math.sin(P.yaw) * Math.cos(P.pitch), Math.sin(P.pitch), Math.cos(P.yaw) * Math.cos(P.pitch));
  const speed = P.vel.length(); const dir = tmp.copy(P.vel).normalize();
  // Lift grows with speed squared; stall below 12 m/s.
  const lift = clamp(speed * speed * 0.03, 0, 18) * (speed < 12 ? 0.3 : 1);
  const liftDir = new THREE.Vector3().crossVectors(dir, new THREE.Vector3().crossVectors(up, dir)).normalize();
  if (!isFinite(liftDir.x)) liftDir.copy(up);
  // Bank rolls the lift vector.
  liftDir.applyAxisAngle(dir, P.roll);
  const g = -9.8; const drag = 0.012 * speed * speed + 0.3 * Math.abs(P.pitch) * speed;
  P.vel.addScaledVector(liftDir, lift * dt); P.vel.y += g * dt; P.vel.addScaledVector(dir, -drag * dt);
  // Steer velocity toward the nose.
  P.vel.lerp(fwd.clone().multiplyScalar(speed), 1 - Math.pow(0.08, dt));
  // Thermals over the oasis and ridges push up.
  const terrain = height(P.pos.x, P.pos.z); const slope = (height(P.pos.x + 5, P.pos.z) - terrain) / 5;
  P.vel.y += (Math.max(0, slope) * 6 + (Math.hypot(P.pos.x - 60, P.pos.z + 420) < 160 ? 4 : 0)) * dt;
  P.vel.x += wind * dt * 0.6 * Math.sin(S.time * 0.3); P.vel.z += wind * dt * 0.4 * Math.cos(S.time * 0.21);
  P.pos.addScaledVector(P.vel, dt);
  const agl = P.pos.y - terrain; S.stall = speed < 10 ? S.stall + dt : 0;
  if (agl < 2.2 && S.mode === 'playing') { U.doFlash(); particles.burst(P.pos.x, P.pos.y, P.pos.z, 60, 0xf1b57a, 14, 1.2); snd.play(80, 0.4, 'sawtooth', 0.14, -60); endGame('Into the sand', `${S.got} gates flown in ${Math.round(S.flight)} seconds of flight.`); return; }
  if (agl < 7 && speed > 20) { S.score += dt * 40; if (Math.random() < 0.2) particles.burst(P.pos.x, terrain + 0.5, P.pos.z, 2, 0xf1c08a, 3, 0.6); }
  if (P.pos.y > 420) P.vel.y = Math.min(P.vel.y, -2);
  // Gates.
  for (const r of rings) { if (r.got) continue; const gd = P.pos.clone().sub(r.pos); const along = gd.dot(r.normal), lat = gd.dot(r.lateral);
    if (P.pos.y < r.top + 0.4) for (const pl of r.pylons) { const dx = P.pos.x - pl.position.x, dz = P.pos.z - pl.position.z; if (dx * dx + dz * dz < 4 && S.time - (pl.userData.hit || -9) > 2) { pl.userData.hit = S.time; S.score = Math.max(0, S.score - 50); S.chain = 0; S.mult = 1; U.doFlash(); snd.play(140, 0.25, 'square', 0.12, -40); U.toast('Pylon hit −50'); } }
    if (Math.abs(along) < 6 && Math.abs(lat) < GATE_HALF - 1.5 && P.pos.y < r.top) { r.got = true; r.mat.map = doneTex; r.mat.needsUpdate = true; S.got++; S.chain = (S.time - S.lastRing < 14) ? S.chain + 1 : 1; S.lastRing = S.time; S.mult = Math.min(5, S.chain); const pts = 100 * S.mult; S.score += pts;  snd.play(660 + S.mult * 80, 0.18, 'triangle', 0.14, 300); U.toast(`Gate +${pts}${S.mult > 1 ? ' · x' + S.mult : ''}`); if (S.got === rings.length) { endGame('Every gate', `All ${rings.length} gates before sunset, ${Math.round(S.flight)} seconds airborne.`); return; } } }
  if (S.time - S.lastRing > 14 && S.chain) { S.chain = 0; S.mult = 1; }
  S.flight += dt;
}

const clock = new THREE.Clock(); const camPos = new THREE.Vector3(0, 70, 0); let bankVis = 0;
function loop() {
  requestAnimationFrame(loop); const dt = Math.min(0.05, clock.getDelta()); S.time += dt; if (!ready) return;
  if (S.mode === 'playing') { fly(dt); if (Math.floor(S.time * 4) % 2 === 0) hud(); }
  else if (S.mode === 'menu' || S.mode === 'over') { P.pos.x = Math.sin(S.time * 0.08) * 140; P.pos.z = -60 + Math.cos(S.time * 0.08) * 140; P.pos.y = 75; P.yaw = S.time * 0.08 + Math.PI / 2; P.roll = 0.35; P.vel.set(Math.cos(P.yaw) * 22, 0, -Math.sin(P.yaw) * 22); }
  bankVis = lerp(bankVis, P.roll, 0.1);
  glider.position.copy(P.pos); glider.rotation.set(0, 0, 0); glider.rotateY(P.yaw); glider.rotateX(-P.pitch * 0.6); glider.rotateZ(bankVis);
  // Inflatables lean and wobble a little in the wind.
  for (const r of rings) for (const [k, pl] of r.pylons.entries()) { pl.rotation.x = Math.sin(S.time * 1.3 + r.ph + k) * 0.012 * (1 + wind * 0.1); pl.rotation.z = Math.cos(S.time * 1.1 + r.ph + k * 2) * 0.012 * (1 + wind * 0.1); }
  particles.update(dt, 0.95, 3);
  for (let i = 0; i < MOTES; i++) { motePos[i * 3 + 1] += dt * 1.5; const dx = motePos[i * 3] - P.pos.x, dz = motePos[i * 3 + 2] - P.pos.z; if (Math.abs(dx) > 200) motePos[i * 3] = P.pos.x - Math.sign(dx) * 200 + (Math.random() - 0.5) * 10; if (Math.abs(dz) > 200) motePos[i * 3 + 2] = P.pos.z - Math.sign(dz) * 200; if (motePos[i * 3 + 1] > P.pos.y + 60) motePos[i * 3 + 1] = P.pos.y - 60; }
  moteGeo.attributes.position.needsUpdate = true;
  water.material.uniforms.time.value += dt * 0.5;
  sun.position.copy(P.pos).add(sky.sun.clone().multiplyScalar(300)); sun.target.position.copy(P.pos);
  // Chase camera: behind and slightly above, looking past the glider.
  const back = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw)).multiplyScalar(-16); back.y = 5 - P.pitch * 6;
  camPos.lerp(P.pos.clone().add(back), 1 - Math.pow(0.001, dt));
  camera.position.copy(camPos); camera.lookAt(P.pos.x + Math.sin(P.yaw) * 10, P.pos.y + 1, P.pos.z + Math.cos(P.yaw) * 10); camera.rotateZ(-bankVis * 0.25);
  camera.fov = lerp(camera.fov, 64 + Math.max(0, P.vel.length() - 25) * 0.5, 0.08); camera.updateProjectionMatrix();
  composer.render();
}
init(); loop();
