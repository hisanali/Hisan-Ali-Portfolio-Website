import { THREE, $, makeWorld, addSky, sunLight, pbr, canvasTexture, loadModel, shadowed, loadingUI, Particles, Sound, ui, seg, clamp, lerp, mulberry } from '/games/world-shared.js';

const KEY = 'nightdrift';
const load = loadingUI('Night Drift');
const { renderer, scene, camera, composer } = makeWorld($('#scene'), { fov: 62, far: 900, bloom: 0.5, threshold: 0.75, radius: 0.5, exposure: 0.95 });
const U = ui(KEY), snd = new Sound(KEY);
$('#credit').textContent = 'Car models: Generic Passenger Car Pack by Comrade1280 (CC BY 4.0). Road texture: Poly Haven (CC0).';

// ---------- Night sky, rain-wet lighting ----------
scene.fog = new THREE.FogExp2(0x070a16, 0.0036);
const skyInfo = addSky(renderer, scene, { elevation: -6, azimuth: 200, turbidity: 12, rayleigh: 0.3, mie: 0.02, intensity: 0.35 });
scene.background = new THREE.Color(0x070a16);
scene.add(new THREE.HemisphereLight(0x2a3a6a, 0x0b0a12, 0.22));
const moon = sunLight(scene, { color: 0x9fb4ff, intensity: 0.9, size: 140, mapSize: 2048, far: 500 }); moon.position.set(-80, 120, -40);

// ---------- Track ----------
const rnd = mulberry(77);
const ctrl = [[0, 0], [90, 20], [150, 90], [120, 170], [40, 190], [-30, 150], [-110, 170], [-170, 100], [-150, 20], [-80, -30]].map(([x, z]) => new THREE.Vector3(x, 0, z));
const curve = new THREE.CatmullRomCurve3(ctrl, true, 'catmullrom', 0.6);
const ROAD_W = 13, SEG = 520;
const roadMat = pbr('asphalt_03', { repeat: 1, roughness: 0.55, normalScale: 0.9, color: 0xc8ccd8 }); roadMat.map.repeat.set(1, 1); roadMat.normalMap.repeat.set(1, 1); roadMat.roughnessMap.repeat.set(1, 1); roadMat.metalness = 0.08; roadMat.envMapIntensity = 1.6;
const kerbTex = canvasTexture(64, (c, s) => { c.fillStyle = '#d93a3a'; c.fillRect(0, 0, s, s / 2); c.fillStyle = '#f3f3f3'; c.fillRect(0, s / 2, s, s / 2); }, { repeat: 1 });
function buildRoad() {
  const pos = [], uv = [], idx = [], kpos = [], kuv = [], kidx = [];
  const pts = curve.getSpacedPoints(SEG); const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= SEG; i++) {
    const p = pts[i], t = curve.getTangentAt(i / SEG).normalize(), n = new THREE.Vector3().crossVectors(up, t).normalize();
    const l = p.clone().addScaledVector(n, ROAD_W / 2), r = p.clone().addScaledVector(n, -ROAD_W / 2);
    pos.push(l.x, 0.02, l.z, r.x, 0.02, r.z); uv.push(0, i * 0.35, 1, i * 0.35);
    for (const [a, b] of [[l, l.clone().addScaledVector(n, 0.6)], [r, r.clone().addScaledVector(n, -0.6)]]) { kpos.push(a.x, 0.03, a.z, b.x, 0.03, b.z); kuv.push(0, i * 0.8, 1, i * 0.8); }
    if (i < SEG) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); for (const o of [0, 2]) { const k = i * 4 + o; kidx.push(k, k + 1, k + 4, k + 1, k + 5, k + 4); } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const road = new THREE.Mesh(g, roadMat); road.receiveShadow = true; scene.add(road);
  const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute(kpos, 3)); kg.setAttribute('uv', new THREE.Float32BufferAttribute(kuv, 2)); kg.setIndex(kidx); kg.computeVertexNormals();
  const kerb = new THREE.Mesh(kg, new THREE.MeshStandardMaterial({ map: kerbTex, roughness: 0.6 })); kerb.receiveShadow = true; scene.add(kerb);
  // Centre line dashes and edge lines.
  const dash = canvasTexture(64, (c, s) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, s, s); c.fillStyle = '#e8e2c8'; c.fillRect(s * 0.47, 0, s * 0.06, s * 0.5); c.fillRect(0, 0, s * 0.03, s); c.fillRect(s * 0.97, 0, s * 0.03, s); });
  const lineMat = new THREE.MeshStandardMaterial({ map: dash, transparent: true, roughness: 0.5, emissive: 0xe8e2c8, emissiveMap: dash, emissiveIntensity: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const lines = new THREE.Mesh(g.clone(), lineMat); lines.position.y = 0.01; scene.add(lines);
}
buildRoad();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), pbr('asphalt_03', { repeat: 90, roughness: 0.95, color: 0x3a3d48 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);

// ---------- Lamps, signs, buildings ----------
const lampPositions = [];
const lampGeo = new THREE.CylinderGeometry(0.08, 0.12, 7, 8), lampMat = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.6, metalness: 0.7 });
const headGeo = new THREE.BoxGeometry(1.4, 0.25, 0.5), headMat = new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffd9a0, emissiveIntensity: 3 });
const lampGroup = new THREE.Group(); scene.add(lampGroup);
for (let i = 0; i < 48; i++) {
  const t = i / 48, p = curve.getPointAt(t), tg = curve.getTangentAt(t), n = new THREE.Vector3(0, 1, 0).cross(tg).normalize(); const side = i % 2 ? 1 : -1;
  const base = p.clone().addScaledVector(n, side * (ROAD_W / 2 + 2.2));
  const pole = new THREE.Mesh(lampGeo, lampMat); pole.position.set(base.x, 3.5, base.z); pole.castShadow = true; lampGroup.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.2), lampMat); arm.position.set(base.x, 6.9, base.z); arm.lookAt(p.x, 6.9, p.z); arm.translateZ(-1.0); lampGroup.add(arm);
  const head = new THREE.Mesh(headGeo, headMat); head.position.copy(arm.position); head.lookAt(p.x, 6.9, p.z); head.translateZ(-1.0); head.position.y = 6.8; lampGroup.add(head);
  lampPositions.push(new THREE.Vector3(head.position.x, 6.5, head.position.z));
}
// A pool of real point lights that jumps to the lamps nearest the player.
const lightPool = Array.from({ length: 8 }, () => { const l = new THREE.PointLight(0xffd9a0, 40, 34, 1.8); scene.add(l); return l; });
const signTex = (text, bg, fg) => canvasTexture(256, (c, s) => { c.fillStyle = bg; c.fillRect(0, 0, s, s); c.fillStyle = fg; c.font = 'bold 54px Manrope, Arial'; c.textAlign = 'center'; c.fillText(text, s / 2, s * 0.58); });
const signs = [['DRIFT', '#ff2d78', '#fff'], ['NEON', '#5ff2ff', '#101'], ['24H', '#ffd166', '#101'], ['OASIS', '#7dffb3', '#101'], ['KHANJAR', '#7a5bff', '#fff']];
let buildings = [];
async function placeCity() {
  const kit = await loadModel('/evermile/assets/models/city-kit.glb?v=maps2'); const parts = kit.scene.children.slice();
  const byKind = k => parts.filter(p => p.userData?.kind === k);
  const pts = curve.getSpacedPoints(96); const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 96; i++) {
    const p = pts[i], t = curve.getTangentAt(i / 96), n = new THREE.Vector3().crossVectors(up, t).normalize();
    for (const side of [1, -1]) {
      if (rnd() < 0.45) continue;
      const pool = rnd() < 0.3 ? byKind('tower') : rnd() < 0.5 ? byKind('block') : byKind('low'); const src = pool[Math.floor(rnd() * pool.length)]; if (!src) continue;
      const w = src.userData.w || 10, d = src.userData.d || 10;
      const dist = ROAD_W / 2 + 6 + Math.max(w, d) / 2 + rnd() * 10;
      const pos = p.clone().addScaledVector(n, side * dist);
      if (buildings.some(b => b.pos.distanceTo(pos) < (b.r + Math.max(w, d) / 2) * 0.9)) continue;
      if (curve.getPoints(200).some(q => q.distanceTo(pos) < dist - 1 && q.distanceTo(p) > 12)) continue;
      const m = src.clone(); m.position.copy(pos); m.rotation.y = Math.atan2(-n.x * side, -n.z * side); shadowed(m, true, true);
      m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.envMapIntensity = 0.25; o.material.color.multiplyScalar(0.55); } });
      scene.add(m); buildings.push({ pos, r: Math.max(w, d) / 2 });
      if (rnd() < 0.25) { const [txt, bg, fg] = signs[Math.floor(rnd() * signs.length)]; const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ map: signTex(txt, bg, fg), emissive: new THREE.Color(bg), emissiveMap: signTex(txt, bg, fg), emissiveIntensity: 1.6, roughness: 0.4 })); sign.position.copy(pos).addScaledVector(n, -side * (Math.max(w, d) / 2 + 0.2)); sign.position.y = 6 + rnd() * 8; sign.lookAt(p.x, sign.position.y, p.z); scene.add(sign); }
    }
  }
}

// ---------- Rain ----------
const RAIN = 2600; const rainPos = new Float32Array(RAIN * 3); for (let i = 0; i < RAIN; i++) { rainPos[i * 3] = (Math.random() - 0.5) * 120; rainPos[i * 3 + 1] = Math.random() * 40; rainPos[i * 3 + 2] = (Math.random() - 0.5) * 120; }
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const streak = canvasTexture(32, (c, s) => { c.clearRect(0, 0, s, s); const g = c.createLinearGradient(0, 0, 0, s); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(s * 0.42, 0, s * 0.16, s); }, { srgb: false });
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xaab8d8, size: 1.1, map: streak, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })); rain.frustumCulled = false; scene.add(rain);
const particles = new Particles(scene, 500, 0xffffff, 0.5);

// ---------- Cars ----------
const cars = []; let player = null;
const STYLES = ['hatch', 'sedan', 'suv', 'wagon'];
async function makeCar(style, hex, isPlayer) {
  const g = await loadModel(`/evermile/assets/models/road-${style}.glb?v=supplied7`); const model = g.scene; shadowed(model, true, false);
  model.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.envMapIntensity = 1.4; if (o.name === 'Body' || /body|paint/i.test(o.material.name)) { o.material.color.set(hex); o.material.roughness = 0.25; o.material.metalness = 0.5; if ('clearcoat' in o.material) { o.material.clearcoat = 1; o.material.clearcoatRoughness = 0.08; } } if (/TailLens/i.test(o.material.name)) { o.material.emissive.set(0xff2020); o.material.emissiveIntensity = 0.6; } } });
  const wheels = []; model.traverse(o => { if (/^Wheel_[FR][LR]$/.test(o.name)) wheels.push(o); });
  const box = new THREE.Box3().setFromObject(model); const len = box.max.z - box.min.z, wid = box.max.x - box.min.x;
  const root = new THREE.Group(); root.add(model); scene.add(root);
  const car = { root, model, wheels, style, isPlayer, pos: new THREE.Vector3(), vel: new THREE.Vector3(), heading: 0, speed: 0, steer: 0, throttle: 0, brake: 0, hand: false, slip: 0, t: 0, lap: 0, next: 0, laneOff: 0, len, wid, finished: false, lapTimes: [], lapStart: 0 };
  if (isPlayer) { for (const name of ['HeadL', 'HeadR']) { const a = model.getObjectByName(name); if (!a) continue; const s = new THREE.SpotLight(0xfff4d6, 90, 70, 0.52, 0.5, 1.6); s.position.copy(a.position); s.target.position.set(a.position.x, a.position.y - 0.6, a.position.z + 30); model.add(s); model.add(s.target); s.castShadow = false; } }
  return car;
}
function placeOnTrack(car, t, lane = 0) { const p = curve.getPointAt(t), tg = curve.getTangentAt(t), n = new THREE.Vector3(0, 1, 0).cross(tg).normalize(); car.pos.copy(p).addScaledVector(n, lane); car.heading = Math.atan2(tg.x, tg.z); car.vel.set(0, 0, 0); car.speed = 0; car.t = t; car.next = Math.floor(t * CHECKS) + 1; }
const CHECKS = 24;

// ---------- State ----------
const S = { mode: 'menu', time: 0, laps: 3, drift: 0, driftRun: 0, best: 0, started: 0, diff: 'normal', raceTime: 0, pos: 1, shake: 0 };
const DIFF = { easy: 0.86, normal: 1.0, hard: 1.1 };
const input = { left: false, right: false, up: false, down: false, hand: false, px: null };
function hud() { if (!player) return; U.setHud([['Lap', `${Math.min(player.lap + 1, S.laps)} / ${S.laps}`], ['Pos', S.pos + ' / ' + cars.length], ['Speed', Math.round(Math.abs(player.speed) * 3.6) + ' km/h', 'speed'], ['Drift', Math.round(S.drift), 'drift']]); }

// ---------- Input ----------
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') input.left = true; if (k === 'arrowright' || k === 'd') input.right = true; if (k === 'arrowup' || k === 'w') input.up = true; if (k === 'arrowdown' || k === 's') input.down = true; if (k === ' ') { input.hand = true; e.preventDefault(); } if (k === 'p' || k === 'escape') togglePause(); if (k === 'enter' && S.mode === 'menu') start(); });
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') input.left = false; if (k === 'arrowright' || k === 'd') input.right = false; if (k === 'arrowup' || k === 'w') input.up = false; if (k === 'arrowdown' || k === 's') input.down = false; if (k === ' ') input.hand = false; });
const touch = $('#touch'); touch.innerHTML = '<button data-k="left" aria-label="Steer left">◀</button><button data-k="hand" class="wide" aria-label="Handbrake">DRIFT</button><button data-k="down" aria-label="Brake">▼</button><button data-k="right" aria-label="Steer right">▶</button>';
touch.querySelectorAll('button').forEach(b => { const k = b.dataset.k; const on = e => { e.preventDefault(); input[k] = true; }; const off = e => { e.preventDefault(); input[k] = false; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
$('#btn-sound').addEventListener('click', () => snd.toggle());
$('#btn-menu').addEventListener('click', () => { if (S.mode === 'playing' || S.mode === 'paused') endGame('Race abandoned', 'You returned to the menu.'); });
function togglePause() { if (S.mode === 'playing') { S.mode = 'paused'; U.showBanner('Paused', 99999); } else if (S.mode === 'paused') { S.mode = 'playing'; U.showBanner('', 0); } }

// ---------- Menu ----------
const card = $('#start-card');
card.innerHTML = `<p class="lede">Three laps through a rain-soaked city against three rivals. Hold the handbrake into a corner, steer through the slide and the drift points pile up.</p>
<ul class="facts"><li><b>3</b> laps</li><li>Drift scoring</li><li>Wet-road physics</li><li>Best: <b id="best-lbl">${U.best.get()}</b></li></ul>
<div class="field"><span>Rivals</span><div class="seg" id="seg-diff"></div></div>
<div class="field"><span>Your paint</span><div class="seg" id="seg-paint"></div></div>
<button class="primary" id="play" type="button"><span>Start the race<small>W/↑ throttle · A/D steer · Space handbrake · on mobile, throttle is automatic</small></span><span aria-hidden="true">→</span></button>
<p class="note">Drift points count while the car slides at speed. Finishing position adds a bonus; hitting barriers costs you.</p>`;
const getDiff = seg($('#seg-diff'), [{ value: 'easy', label: 'Relaxed' }, { value: 'normal', label: 'Normal' }, { value: 'hard', label: 'Ruthless' }], 'normal');
const getPaint = seg($('#seg-paint'), [{ value: '0xff2d78', label: 'Magenta' }, { value: '0x18c8ff', label: 'Cyan' }, { value: '0xffd166', label: 'Gold' }, { value: '0xf4f4f4', label: 'Pearl' }], '0xff2d78');
$('#play').addEventListener('click', start);
$('#again').addEventListener('click', () => { $('#result').hidden = true; start(); });
$('#to-menu').addEventListener('click', () => { $('#result').hidden = true; $('#start').hidden = false; $('#best-lbl').textContent = U.best.get(); S.mode = 'menu'; U.setHud(null); touch.classList.remove('on'); });
let ready = false;
async function init() {
  load.set('Building the city');
  await placeCity().catch(e => console.warn('city', e));
  load.set('Rolling out the cars');
  player = await makeCar('hatch', 0xff2d78, true); cars.push(player);
  const rivals = [['sedan', 0x2b6cff], ['suv', 0xe8e8e8], ['wagon', 0xffa726]];
  for (const [st, hex] of rivals) cars.push(await makeCar(st, hex, false));
  cars.forEach((c, i) => placeOnTrack(c, 0.985 - i * 0.012, (i % 2 ? 3 : -3)));
  ready = true; load.done(); document.body.classList.add('is-ready');
}
function start() {
  if (!ready) return; snd.ensure(); S.diff = getDiff(); const paint = Number(getPaint());
  player.model.traverse(o => { if (o.isMesh && (o.name === 'Body' || /body|paint/i.test(o.material.name))) o.material.color.set(paint); });
  cars.forEach((c, i) => { placeOnTrack(c, 0.985 - i * 0.012, (i % 2 ? 3 : -3)); c.lap = 0; c.finished = false; c.lapTimes = []; c.laneOff = (i % 2 ? 3 : -3); });
  Object.assign(S, { drift: 0, driftRun: 0, raceTime: 0, pos: cars.length, shake: 0 }); S.mode = 'countdown'; $('#start').hidden = true; touch.classList.add('on'); hud();
  let n = 3; const tick = () => { if (n > 0) { U.showBanner(String(n), 800); snd.play(440, 0.15, 'sine', 0.1); n--; setTimeout(tick, 900); } else { U.showBanner('Go!', 700); snd.play(880, 0.3, 'sine', 0.12); S.mode = 'playing'; player.lapStart = S.raceTime; } }; tick();
}
function endGame(title, reason, finishedPos) {
  S.mode = 'over'; const bonus = finishedPos ? [0, 1500, 800, 400, 100][finishedPos] : 0; const score = Math.round(S.drift) + bonus;
  const best = U.best.get(); const isBest = score > best; if (isBest) U.best.set(score);
  const bestLap = player.lapTimes.length ? Math.min(...player.lapTimes) : 0;
  $('#result-label').textContent = isBest ? 'New best' : finishedPos ? 'Race complete' : 'Race over'; $('#result-title').textContent = title; $('#result-reason').textContent = reason;
  $('#result-stats').innerHTML = `<div><small>Score</small><b>${score}</b></div><div><small>Drift</small><b>${Math.round(S.drift)}</b></div><div><small>Best lap</small><b>${bestLap ? bestLap.toFixed(1) + 's' : '—'}</b></div>`;
  $('#result').hidden = false; U.setHud(null); touch.classList.remove('on');
}

// ---------- Physics ----------
const tmpF = new THREE.Vector3(), tmpR = new THREE.Vector3();
function drive(car, dt, ctrl) {
  const fwd = tmpF.set(Math.sin(car.heading), 0, Math.cos(car.heading));
  const right = tmpR.set(fwd.z, 0, -fwd.x);
  const vF = car.vel.dot(fwd), vR = car.vel.dot(right);
  const maxSpeed = 46 * (car.isPlayer ? 1 : DIFF[S.diff]);
  const accel = ctrl.throttle * 22 - ctrl.brake * 30; const drag = 0.012 * vF * Math.abs(vF) + 0.6 * vF;
  const newF = vF + (accel - drag) * dt;
  const grip = ctrl.hand ? 1.2 : 7; const lat = vR - vR * Math.min(1, grip * dt);
  const steerMax = 0.034 + 0.03 * (1 - Math.min(1, Math.abs(vF) / 40)); const effSteer = ctrl.steer * steerMax * (ctrl.hand ? 1.5 : 1);
  car.heading += effSteer * clamp(vF / 10, -1, 1) * 60 * dt;
  car.vel.copy(fwd.clone().multiplyScalar(clamp(newF, -12, maxSpeed))).addScaledVector(right, lat);
  car.speed = car.vel.dot(fwd); car.slip = Math.abs(lat); car.steer = ctrl.steer;
  car.pos.addScaledVector(car.vel, dt);
  // Keep on the road corridor: nearest curve point.
  const near = nearestT(car); const p = curve.getPointAt(near), tg = curve.getTangentAt(near), n = new THREE.Vector3(0, 1, 0).cross(tg).normalize();
  const off = car.pos.clone().sub(p).dot(n); const limit = ROAD_W / 2 + 0.9 - car.wid / 2;
  if (Math.abs(off) > limit) { car.pos.addScaledVector(n, (limit * Math.sign(off)) - off); const vn = car.vel.dot(n); car.vel.addScaledVector(n, -vn * 1.6); car.vel.multiplyScalar(0.7); if (car.isPlayer && Math.abs(vn) > 3) { S.shake = 0.5; S.drift = Math.max(0, S.drift - 40); U.doFlash(); snd.play(90, 0.2, 'square', 0.12, -40); particles.burst(car.pos.x, 0.8, car.pos.z, 20, 0xffc27a, 5, 0.5); } }
  car.t = near;
  // Checkpoints and laps.
  const seg = Math.floor(near * CHECKS); if (seg === car.next % CHECKS) { car.next++; if (car.next % CHECKS === 0) { car.lap++; if (car.isPlayer) { const lt = S.raceTime - player.lapStart; player.lapTimes.push(lt); player.lapStart = S.raceTime; U.showBanner(car.lap >= S.laps ? 'Finish!' : `Lap ${car.lap + 1}`, 900); } if (car.lap >= S.laps && !car.finished) { car.finished = true; car.finishPos = cars.filter(c => c.finished).length; } } }
  car.root.position.copy(car.pos); car.root.rotation.y = car.heading;
  car.model.rotation.z = lerp(car.model.rotation.z, -lat * 0.012, 0.2); car.model.rotation.x = lerp(car.model.rotation.x, -accel * 0.003, 0.15);
  for (const w of car.wheels) { w.rotation.x += car.speed * dt / 0.33; if (w.name[6] === 'F') w.rotation.y = ctrl.steer * 0.5; }
}
function nearestT(car) { let best = car.t, bd = Infinity; for (let k = -6; k <= 10; k++) { const t = ((car.t + k * 0.0025) % 1 + 1) % 1; const d = curve.getPointAt(t).distanceToSquared(car.pos); if (d < bd) { bd = d; best = t; } } return best; }
function aiControl(car) {
  const ahead = (car.t + 0.02) % 1; const p = curve.getPointAt(ahead), tg = curve.getTangentAt(ahead), n = new THREE.Vector3(0, 1, 0).cross(tg).normalize();
  const target = p.clone().addScaledVector(n, car.laneOff); const to = target.sub(car.pos); const desired = Math.atan2(to.x, to.z); let diff = desired - car.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const curv = curve.getTangentAt((car.t + 0.05) % 1).angleTo(tg); const throttle = curv > 0.35 ? 0.35 : curv > 0.2 ? 0.7 : 1;
  for (const o of cars) if (o !== car) { const d = o.pos.clone().sub(car.pos); if (d.length() < 9 && d.dot(new THREE.Vector3(Math.sin(car.heading), 0, Math.cos(car.heading))) > 0) return { steer: clamp(diff * 2.5, -1, 1) + (d.dot(n) > 0 ? -0.3 : 0.3), throttle: throttle * 0.6, brake: 0, hand: false }; }
  return { steer: clamp(diff * 2.5, -1, 1), throttle, brake: 0, hand: false };
}

// ---------- Loop ----------
const clock = new THREE.Clock(); const camPos = new THREE.Vector3(0, 6, -12);
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta()); S.time += dt;
  if (!ready) return;
  const racing = S.mode === 'playing';
  if (racing) S.raceTime += dt;
  if (S.mode === 'playing' || S.mode === 'countdown' || S.mode === 'over') {
    for (const car of cars) {
      let ctrl; if (car.isPlayer) { const coarse = matchMedia('(pointer:coarse)').matches; ctrl = { steer: (input.right ? 1 : 0) - (input.left ? 1 : 0), throttle: racing ? (input.up || (coarse && !input.down) ? 1 : 0) : 0, brake: input.down ? 1 : 0, hand: input.hand }; } else ctrl = racing ? aiControl(car) : { steer: 0, throttle: 0, brake: 0, hand: false };
      if (car.finished && !car.isPlayer) ctrl.throttle = 0.4;
      drive(car, dt, ctrl);
      if (car.slip > 2.5 && Math.abs(car.speed) > 8) { particles.burst(car.pos.x, 0.25, car.pos.z, 2, 0xc9d4e8, 1.2, 0.6); if (car.isPlayer && racing) { S.drift += car.slip * dt * 6; S.driftRun += car.slip * dt * 6; } } else if (car.isPlayer && S.driftRun > 0) { if (S.driftRun > 120) U.toast(`Drift +${Math.round(S.driftRun)}`); S.driftRun = 0; }
    }
    // Position: laps then track progress.
    const order = cars.slice().sort((a, b) => (b.lap + b.t) - (a.lap + a.t)); S.pos = order.indexOf(player) + 1;
    if (racing && Math.floor(S.time * 4) % 2 === 0) hud();
    if (racing && player.finished) { const pos = player.finishPos; endGame(pos === 1 ? 'You win the night' : `Finished ${['', '1st', '2nd', '3rd', '4th'][pos]}`, `${Math.round(S.drift)} drift points over three laps.`, pos); }
    if (racing && S.raceTime > 420) endGame('Time over', 'Seven minutes is long enough for one race.');
  }
  // Lights follow the car.
  const sorted = lampPositions.map(p => ({ p, d: p.distanceToSquared(player.pos) })).sort((a, b) => a.d - b.d);
  lightPool.forEach((l, i) => { l.position.copy(sorted[i].p); });
  moon.position.set(player.pos.x - 80, 120, player.pos.z - 40); moon.target.position.copy(player.pos);
  // Rain follows the player and falls.
  for (let i = 0; i < RAIN; i++) { rainPos[i * 3 + 1] -= dt * 38; if (rainPos[i * 3 + 1] < 0) { rainPos[i * 3 + 1] = 40; rainPos[i * 3] = player.pos.x + (Math.random() - 0.5) * 120; rainPos[i * 3 + 2] = player.pos.z + (Math.random() - 0.5) * 120; } }
  rainGeo.attributes.position.needsUpdate = true;
  particles.update(dt, 0.92);
  // Chase camera.
  const back = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading)).multiplyScalar(-11 - Math.abs(player.speed) * 0.08);
  const want = player.pos.clone().add(back); want.y = 4.6 + Math.abs(player.speed) * 0.02;
  camPos.lerp(want, 1 - Math.pow(0.002, dt)); const sx = (Math.random() - 0.5) * S.shake; S.shake = Math.max(0, S.shake - dt * 2);
  camera.position.copy(camPos).add(new THREE.Vector3(sx, sx * 0.5, 0)); camera.lookAt(player.pos.x, player.pos.y + 1.2, player.pos.z);
  camera.fov = lerp(camera.fov, 62 + Math.abs(player.speed) * 0.35, 0.1); camera.updateProjectionMatrix();
  composer.render();
}
init(); loop();
