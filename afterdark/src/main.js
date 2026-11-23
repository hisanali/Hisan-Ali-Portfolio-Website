// Afterdark: free-roam night driving. Boot, input, game state, camera, HUD and the frame loop.
import { THREE, createRenderer, Q, QUALITY } from './render.js';
import { buildCity, P, ROADS, SPAN, HALF } from './city.js';
import { createPlayer } from './car.js';
import { createTraffic } from './traffic.js';
import { buildStreet } from './street.js';
import { buildWorld } from './world.js';
import { buildPlaces } from './places.js';
import { createSound } from './sound.js';
import { createTyreSpray } from './spray.js';
import { buildRailway } from './railway.js';
import { CARS, UPGRADES, UP_COST, UP_MAX, MEDALS, carById, carSpec, upLevel, loadSave, commit, cr, clockText, buildRoutes, medalFor, jobSpots, nextJob, jobPay, createBigMap } from './career.js';

const $ = s => document.querySelector(s), clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const store = { get: (k, d) => { try { return localStorage.getItem('afterdark:' + k) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('afterdark:' + k, v); } catch (e) {} } };
const save = loadSave();
const loadEl = $('#loading'), loadMsg = $('#load-msg'), setLoad = t => { loadMsg.textContent = t; };
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

const R = createRenderer($('#scene')), { scene, camera, renderer } = R;
const S = { mode: 'boot', kind: store.get('kind', 'run'), time: 0, clock: 0, left: 120, score: 0, combo: 0, top: 0, hits: 0, shake: 0, cam: 0, sound: store.get('sound', 'on') === 'on', flash: 0 };
const input = { left: 0, right: 0, up: 0, down: 0, hand: 0 };
let city, street, world, places, player, traffic, audio = null;
const inCity = (x, z) => x <= SPAN + HALF + 4 && z >= -(HALF + 4) && z <= SPAN + HALF + 4;

// ---------- Rain and tyre spray ----------
const RAIN = Q.rain, RR = 34, rainPos = new Float32Array(RAIN * 6), rainGeo = new THREE.BufferGeometry();
const rainLengths = Float32Array.from({ length: RAIN }, () => 0.33 + Math.random() * 0.55);
const rainColors = new Float32Array(RAIN * 6);
for (let i = 0; i < RAIN; i++) {
  const x = (Math.random() - 0.5) * RR * 2, y = Math.random() * 26, z = (Math.random() - 0.5) * RR * 2;
  rainPos.set([x, y, z, x, y - rainLengths[i], z], i * 6);
  const brightness = 0.28 + Math.random() * 0.62;
  rainColors.set([brightness, brightness, brightness, 0.12, 0.14, 0.17], i * 6);
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
rainGeo.setAttribute('color', new THREE.BufferAttribute(rainColors, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xb8c5db, vertexColors: true, transparent: true, opacity: 0.17, depthWrite: false, blending: THREE.AdditiveBlending }));
rain.name = 'Local rainfall';
rain.frustumCulled = false;
rain.visible = false;
scene.add(rain);
R.refl.hide.push(rain); R.cube.hide.push(rain);
const spray = createTyreSpray(Q.reach >= 1 ? 820 : 560);
scene.add(spray.mesh);
R.refl.hide.push(spray.mesh); R.cube.hide.push(spray.mesh);
function stepRain(dt, position, vx, vz) {
  if (!rain.visible) return;
  const { x: cx, y: cy, z: cz } = position;
  const floor = cy - 11, ceiling = cy + 18, fall = 21 * dt, wind = 2.2 * dt;
  for (let i = 0; i < RAIN; i++) {
    const o = i * 6;
    let x = rainPos[o] + wind, y = rainPos[o + 1] - fall, z = rainPos[o + 2];
    if (Math.abs(x - cx) > RR || Math.abs(z - cz) > RR || y > ceiling || y < floor - 8) {
      x = cx + (Math.random() - 0.5) * RR * 2;
      z = cz + (Math.random() - 0.5) * RR * 2;
      y = floor + Math.random() * (ceiling - floor);
    } else if (y < floor) {
      y = ceiling - Math.random() * 3.8;
    }
    const streak = rainLengths[i];
    rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z;
    rainPos[o + 3] = x - (0.13 + vx * 0.009) * streak;
    rainPos[o + 4] = y - streak;
    rainPos[o + 5] = z - vz * 0.009 * streak;
  }
  rainGeo.attributes.position.needsUpdate = true;
}
// Collision sparks and soft dust or tyre smoke. Water mist uses its own transparent geometry.
function particles(n, size, additive, grav, drag) { const o = { n, i: 0, grav, drag, pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), life: new Float32Array(n), col: new Float32Array(n * 3), geo: new THREE.BufferGeometry(), size, additive, pts: null };
  o.pos.fill(-50); o.geo.setAttribute('position', new THREE.BufferAttribute(o.pos, 3)); o.geo.setAttribute('color', new THREE.BufferAttribute(o.col, 3)); return o; }
const sparks = particles(150, 0.046, true, 13, 0.6), haze = particles(160, 2.2, false, -0.6, 1.8);
function emit(o, x, y, z, vx, vy, vz, life, r, g, b) { const i = o.i++ % o.n, k = i * 3; o.pos[k] = x; o.pos[k + 1] = y; o.pos[k + 2] = z; o.vel[k] = vx; o.vel[k + 1] = vy; o.vel[k + 2] = vz; o.life[i] = life; o.col[k] = r; o.col[k + 1] = g; o.col[k + 2] = b; }
function stepParticles(o, dt) { const f = Math.exp(-o.drag * dt), fade = Math.exp(-(o.additive ? 2.2 : 1.6) * dt); for (let i = 0; i < o.n; i++) { const k = i * 3; if (o.life[i] <= 0) { o.pos[k + 1] = -50; continue; } o.life[i] -= dt; o.vel[k + 1] -= o.grav * dt; o.vel[k] *= f; o.vel[k + 2] *= f; o.pos[k] += o.vel[k] * dt; o.pos[k + 1] += o.vel[k + 1] * dt; o.pos[k + 2] += o.vel[k + 2] * dt; if (o.additive && o.pos[k + 1] < 0.02) o.life[i] = 0; o.col[k] *= fade; o.col[k + 1] *= fade; o.col[k + 2] *= fade; }
  o.geo.attributes.position.needsUpdate = true; o.geo.attributes.color.needsUpdate = true; }

// ---------- Objective beacon ----------
const beacon = new THREE.Group(); beacon.visible = false; scene.add(beacon);
{ const g = new THREE.CylinderGeometry(4.5, 4.5, 70, 40, 1, true); g.translate(0, 35, 0);
  const m = new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: { uTime: R.refl.uniforms.uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uTime; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 2.4) * (0.55 + 0.45 * sin(vUv.y * 60.0 - uTime * 5.0)); gl_FragColor = vec4(vec3(0.15, 1.0, 0.9) * a * 0.9, 1.0); }' });
  beacon.add(new THREE.Mesh(g, m));
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.9, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 3, 2.6), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; beacon.add(ring); }
function moveBeacon() {
  const far = S.beacons > 0 && Math.random() < 0.45 || !inCity(player.pos.x, player.pos.z);
  for (let n = 0; n < 60; n++) { let x, z, y = 0;
    if (far) { const s = world.samples[Math.floor(Math.random() * world.samples.length)]; if (s.tunnel) continue; x = s.x; z = s.z; y = s.y; }
    else { const ax = Math.random() < 0.5, r = Math.floor(Math.random() * ROADS) * P, s = (Math.floor(Math.random() * (ROADS - 1)) + 0.5) * P; x = ax ? r : s; z = ax ? s : r; }
    const d = Math.hypot(x - player.pos.x, z - player.pos.z); if (d > 230 && d < (far ? 1500 : 560)) { beacon.position.set(x, y, z); break; } }
  S.lastBeaconDist = Math.hypot(beacon.position.x - player.pos.x, beacon.position.z - player.pos.z); beacon.visible = true; A.label = 'Beacon';
}

// ---------- Street-lamp light pool ----------
const lampLights = Array.from({ length: Q.lights }, () => { const l = new THREE.PointLight(0xffcf9a, 42, 34, 1.7); scene.add(l); return l; });
let lampTick = 0;
function placeLampLights(p) { if ((lampTick++ & 7) && lampTick > 1) return; const L = city.lamps, best = [];
  for (let i = 0; i < L.length; i++) { const d = (L[i].x - p.x) ** 2 + (L[i].z - p.z) ** 2; if (d > 3600) continue; best.push([d, i]); }
  best.sort((a, b) => a[0] - b[0]); lampLights.forEach((l, k) => { if (best[k]) { l.position.copy(L[best[k][1]]); l.userData.on = 1; } else l.userData.on = 0; l.intensity = 42 * l.userData.on * (env ? env.night : 0); }); }

// ---------- Input ----------
const KEYS = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', ' ': 'hand' };
addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (KEYS[k]) { input[KEYS[k]] = 1; if (S.mode === 'play') e.preventDefault(); }
  if (e.repeat) return;
  if (k === 'c' && S.mode === 'play') nextCam();
  if (k === 'm') { if (S.mode === 'map') closeMap(); else openMap(); }
  if (k === 'o' && S.mode === 'play') photo(true);
  if (k === 'escape' && (S.mode === 'map' || S.mode === 'photo' || S.mode === 'replay')) { if (S.mode === 'map') closeMap(); else if (S.mode === 'photo') photo(false); else replay(false); return; }
  if ((k === 'p' || k === 'escape') && (S.mode === 'play' || S.mode === 'pause')) pause(S.mode === 'play');
  if (k === 'r' && S.mode === 'play') respawn();
  if (k === 'enter' && S.mode === 'menu') start(); });
addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (KEYS[k]) input[KEYS[k]] = 0; if (k === 'h') audio?.horn(false); });
addEventListener('keydown', e => { if (e.key.toLowerCase() === 'h' && S.mode === 'play') audio?.horn(true); });
addEventListener('blur', () => { for (const k in input) input[k] = 0; });
document.querySelectorAll('#touch [data-k]').forEach(b => { const k = b.dataset.k, on = e => { e.preventDefault(); input[k] = 1; b.classList.add('on'); }, off = e => { e.preventDefault(); input[k] = 0; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
const coarse = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 1; document.body.classList.toggle('is-touch', coarse);
addEventListener('contextmenu', e => e.preventDefault()); addEventListener('gesturestart', e => e.preventDefault()); addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (!e.target.closest('.panel')) e.preventDefault(); }, { passive: false });
document.querySelector('#touch [data-horn]')?.addEventListener('pointerdown', e => { e.preventDefault(); audio?.horn(true); }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) document.querySelector('#touch [data-horn]')?.addEventListener(ev, () => audio?.horn(false));

// ---------- UI ----------
let toastT = 0; function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1600); }
function seg(el, opts, cur, cb) { el.innerHTML = ''; opts.forEach(([v, label, sw]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (sw) { b.style.setProperty('--sw', sw); b.classList.add('swatch'); } b.setAttribute('aria-pressed', String(v === cur)); b.addEventListener('click', () => { el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); cb(v); }); el.append(b); }); }
const PAINTS = [['#b9bdc6', 'Silver', '#b9bdc6'], ['#16181d', 'Graphite', '#2a2d35'], ['#8f0f16', 'Crimson', '#b3151e'], ['#123c8f', 'Cobalt', '#1d55c4'], ['#d9a400', 'Solar', '#e9b500'], ['#e9ebee', 'Pearl', '#f2f3f5']];
let paintSel = store.get('paint', '#b9bdc6');
let routes = [], spots = [], bigmap = null, routeSel = store.get('route', 'coast'), jobSel = store.get('job', 'taxi'); if (!['free', 'run', 'trial', 'jobs'].includes(S.kind)) S.kind = 'free';
function modeUI() { const k = S.kind; let note = k === 'run' ? 'Reach the light beacons before the clock runs out. Each one adds time, and the score pays out in cash.' : 'No clock. Drive anywhere, open the map and tap a road to set a waypoint. New places pay a finder’s fee.';
  $('#field-sub').hidden = k !== 'trial' && k !== 'jobs';
  if (k === 'trial') { $('#sub-label').textContent = 'Route'; seg($('#seg-sub'), routes.map(r => [r.id, r.name]), routeSel, v => { routeSel = v; store.set('route', v); modeUI(); }); const r = routes.find(r => r.id === routeSel) || routes[0]; note = r ? `${r.note} ${(r.len / 1000).toFixed(1)} km · gold ${clockText(r.gold)} · ${save.times[r.id] ? 'your best ' + clockText(save.times[r.id], true) : 'no time set yet'}.` : ''; }
  if (k === 'jobs') { $('#sub-label').textContent = 'Work'; seg($('#seg-sub'), [['taxi', 'Taxi'], ['delivery', 'Delivery']], jobSel, v => { jobSel = v; store.set('job', v); modeUI(); }); note = jobSel === 'taxi' ? 'Pick riders up and get them there in time. Stop at the marker to let them in. A clean drive pays the full fare.' : 'Collect a parcel, stop to load it, then deliver against the clock. Every knock costs you.'; }
  $('#mode-note').textContent = note; $('#menu-cash').textContent = cr(save.cash); }
seg($('#seg-mode'), [['free', 'Free Roam'], ['run', 'Beacon Run'], ['trial', 'Time Trial'], ['jobs', 'Jobs']], S.kind, v => { S.kind = v; store.set('kind', v); modeUI(); });
modeUI();
seg($('#seg-paint'), PAINTS, paintSel, v => { paintSel = v; store.set('paint', v); player?.setPaint(v); });
const TIMES = { auto: null, day: 12.5, sunset: 17.4, night: 23, fixed: 12 }; let timeMode = store.get('time', 'auto'); if (!(timeMode in TIMES)) timeMode = 'auto';
seg($('#seg-tod'), [['auto', 'Live cycle'], ['day', 'Day'], ['sunset', 'Sunset'], ['night', 'Rainy night']], timeMode, v => { timeMode = v; store.set('time', v); if (TIMES[v] != null) hour = TIMES[v]; });
seg($('#seg-gfx'), [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['ultra', 'Ultra']], QUALITY, v => { if (v === QUALITY) return; store.set('gfx', v); const u = new URL(location.href); u.searchParams.delete('gfx'); location.href = u.href; });
$('#best').textContent = store.get('best', '0');
$('#play').addEventListener('click', () => start());
$('#again').addEventListener('click', () => start());
$('#to-menu').addEventListener('click', () => toMenu());
$('#resume').addEventListener('click', () => pause(false));
$('#quit').addEventListener('click', () => toMenu());
$('#btn-pause').addEventListener('click', () => { if (S.mode === 'play') pause(true); });
$('#btn-cam').addEventListener('click', () => nextCam());
$('#btn-map').addEventListener('click', () => openMap()); $('#map').addEventListener('click', () => openMap()); $('#map-close').addEventListener('click', () => closeMap()); $('#pause-map').addEventListener('click', () => openMap());
$('#pause-photo').addEventListener('click', () => photo(true)); $('#pause-replay').addEventListener('click', () => replay(true)); $('#photo-back').addEventListener('click', () => photo(false)); $('#photo-save').addEventListener('click', () => { shot = true; }); $('#replay-stop').addEventListener('click', () => replay(false));
$('#photo-in').addEventListener('click', () => { view.zoom = clamp(view.zoom * 0.85, 0.55, 2.6); }); $('#photo-out').addEventListener('click', () => { view.zoom = clamp(view.zoom * 1.18, 0.55, 2.6); });
$('#open-garage').addEventListener('click', () => { drawGarage(); show('garage'); }); $('#g-back').addEventListener('click', () => { modeUI(); show('menu'); });
$('#btn-sound').addEventListener('click', () => { S.sound = !S.sound; store.set('sound', S.sound ? 'on' : 'off'); document.body.classList.toggle('muted', !S.sound); audio?.setOn(S.sound); });
document.addEventListener('click', e => { if (e.target.closest('button')) audio?.click(); });
document.body.classList.toggle('muted', !S.sound);
$('#btn-full').addEventListener('click', () => { const d = document, el = d.documentElement; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen)?.call(d); else { const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); p?.catch?.(() => {}); } });
if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) $('#btn-full').hidden = true;
$('#scene').addEventListener('webglcontextlost', e => { e.preventDefault(); const el = $('#toast'); el.textContent = 'Graphics were reset. Tap to reload.'; el.classList.add('show'); el.style.pointerEvents = 'auto'; el.onclick = () => location.reload(); });
const show = id => { for (const s of ['menu', 'pause', 'result', 'garage', 'bigmap']) $('#' + s).hidden = s !== id; document.body.dataset.mode = S.mode; };

function ensureAudio() { // must run inside the tap itself or iOS keeps the audio context suspended
  if (audio) { audio.resume(); return; }
  try { audio = createSound(); audio.setOn(S.sound); audio.start(); } catch (e) { console.warn('audio unavailable', e); audio = null; }
}
for (const ev of ['pointerdown', 'touchend', 'keydown']) addEventListener(ev, () => audio?.resume(), { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) audio?.resume(); else if (S.mode === 'play') pause(true); });
function respawn() { snapCam = true; spray.clear(); const p = player.pos;
  if (!inCity(p.x, p.z)) { const r = world.nearRoad(p.x, p.z, 900); if (r) { player.place(r.s.x - r.s.lx * 2.5, r.s.z - r.s.lz * 2.5, Math.atan2(r.s.tx, r.s.tz)); toast('Back on the road'); return; } }
  const ax = Math.abs(p.x - Math.round(p.x / P) * P) < Math.abs(p.z - Math.round(p.z / P) * P), rx = clamp(Math.round(p.x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(p.z / P), 0, ROADS - 1) * P;
  if (ax) player.place(rx - 5.5, clamp(p.z, 20, SPAN - 20), 0); else player.place(clamp(p.x, 20, SPAN - 20), rz + 5.5, Math.PI / 2); toast('Back on the road'); }
// ---------- Things to do: time trials, taxi and delivery work, waypoints ----------
const A = { route: null, i: 0, t: 0, go: false, job: null, stage: '', hits0: 0, wait: 0, nag: 0, way: false, label: 'Beacon' };
function setTarget(p, label) { beacon.position.set(p.x, p.y || 0, p.z); beacon.visible = true; A.label = label; }
function earn(n) { save.cash += n; save.earned += n; commit(save); }
function offerJob() { const j = A.job = nextJob(spots, jobSel, player.pos.x, player.pos.z); A.stage = 'pickup'; setTarget(j.from, 'Pick-up · ' + j.from.name); toast(j.type === 'taxi' ? `${j.what} · ${j.from.name}` : `Collect ${j.what.toLowerCase()} · ${j.from.name}`); }
function stepActivity(dt) {
  const d = Math.hypot(beacon.position.x - player.pos.x, beacon.position.z - player.pos.z), sp = Math.abs(player.speed);
  if (S.kind === 'trial') { const r = A.route; if (!A.go && (input.up || sp > 1)) A.go = true; if (A.go) A.t += dt;
    if (d < r.r) { A.i++; if (A.i >= r.cps.length) { finishTrial(); return; } S.flash = 0.12; audio?.beacon(); toast(`Checkpoint ${A.i}/${r.cps.length} · ${clockText(A.t, true)}`); setTarget(r.cps[A.i], `Checkpoint ${A.i + 1}/${r.cps.length}`); }
    return; }
  if (S.kind === 'jobs') { const j = A.job;
    if (A.stage === 'wait') { A.wait -= dt; if (A.wait <= 0) offerJob(); return; }
    if (A.stage === 'drop') { S.left -= dt; if (S.left <= 0) { toast(j.type === 'taxi' ? 'Too late · the rider walked' : 'Too late · order cancelled'); A.stage = 'wait'; A.wait = 2.2; beacon.visible = false; return; } }
    if (d < 11) { A.nag -= dt; if (sp > 3.5) { if (A.nag <= 0) { toast('Stop at the marker'); A.nag = 2.5; } return; }
      if (A.stage === 'pickup') { A.stage = 'drop'; S.left = j.limit; A.hits0 = S.hits; setTarget(j.to, 'Drop-off · ' + j.to.name); audio?.beacon(); toast(`${j.type === 'taxi' ? 'Rider aboard' : 'Loaded'} · ${j.to.name} · ${cr(j.pay)}`); }
      else { const p = jobPay(j, S.left, S.hits - A.hits0); earn(p.total); save.jobs++; commit(save); S.jobs++; S.score += p.total; S.flash = 0.18; audio?.beacon(); toast(`Paid ${cr(p.total)}${p.care < 1 ? ' · the knocks cost you' : ''}`); A.stage = 'wait'; A.wait = 2.4; beacon.visible = false; } }
    return; }
  if (d < 9) {
    if (A.way) { A.way = false; S.flash = 0.12; audio?.beacon(); toast('Waypoint reached'); moveBeacon(); }
    else { S.combo++; S.beacons++; const gain = 250 + 50 * S.combo; S.score += gain; S.left = Math.min(240, S.left + clamp(S.lastBeaconDist / 20, 16, 55)); S.flash = 0.18; audio?.beacon(); toast(`Beacon +${gain}`); moveBeacon(); } }
  if (S.kind === 'run') { S.left -= dt; if (S.left <= 0) finish(); }
}
function start() {
  if (S.mode === 'boot' || swapping) return; spray.clear(); ensureAudio(); const k = S.kind; Object.assign(A, { way: false, job: null, stage: '', i: 0, t: 0, go: false, nag: 0 }); REC.n = REC.i = REC.acc = 0;
  if (k === 'trial') { A.route = routes.find(r => r.id === routeSel) || routes[0]; player.place(A.route.start.x, A.route.start.z, A.route.start.h); } else player.place(city.spawn.x, city.spawn.z, 0);
  player.setPaint(paintSel);
  Object.assign(S, { mode: 'play', clock: 0, left: 120, score: 0, combo: 0, top: 0, hits: 0, shake: 0, beacons: 0, jobs: 0 });
  camYaw = player.heading; snapCam = true; view.yaw = view.pitch = 0; view.zoom = 1; show(null); hudTick = 0;
  if (k === 'trial') { setTarget(A.route.cps[0], `Checkpoint 1/${A.route.cps.length}`); toast(`${A.route.name} · the clock starts when you move`); }
  else if (k === 'jobs') offerJob();
  else { moveBeacon(); toast(k === 'run' ? 'Follow the arrow to the beacon' : 'The whole map is yours'); }
  setTimeout(() => { if (S.mode === 'play' && S.clock < 6 && k !== 'trial') toast(coarse ? 'Drag to look around · tap the map to open it' : 'Drag to look around · C camera · M map · O photo'); }, 3200);
}
function pause(on) { S.mode = on ? 'pause' : 'play'; show(on ? 'pause' : null); if (on) { $('#pause-replay').disabled = REC.n < 30; commit(save); } }
function toMenu() { spray.clear(); S.mode = 'menu'; beacon.visible = false; player.place(city.spawn.x, city.spawn.z, 0); $('#best').textContent = store.get('best', '0'); commit(save); modeUI(); show('menu'); }
function finish() {
  S.mode = 'over'; const best = +store.get('best', '0'), isBest = S.score > best, pay = Math.round(S.score / 100) * 10; if (isBest) store.set('best', String(Math.round(S.score))); earn(pay);
  audio?.finish(isBest);
  $('#result-label').textContent = isBest ? 'New best run' : 'Run complete'; $('#result-score').textContent = Math.round(S.score).toLocaleString();
  $('#result-stats').innerHTML = `<div><small>Beacons</small><b>${S.beacons}</b></div><div><small>Top speed</small><b>${Math.round(S.top * 3.6)} km/h</b></div><div><small>Earned</small><b>${cr(pay)}</b></div>`;
  show('result');
}
function finishTrial() {
  const r = A.route, t = A.t, prev = save.times[r.id], m = medalFor(r, t), pm = prev ? medalFor(r, prev) : -1, isBest = !prev || t < prev; if (isBest) save.times[r.id] = +t.toFixed(2);
  // A medal pays in full the first time it is reached, and a fifth of that on later runs.
  const pay = m < 0 ? 0 : (pm < 0 || m < pm) ? MEDALS[m][2] : Math.round(MEDALS[m][2] * 0.2); earn(pay); S.mode = 'over'; beacon.visible = false; audio?.finish(isBest);
  $('#result-label').textContent = (m >= 0 ? MEDALS[m][1] + ' medal' : 'Finished') + (isBest ? ' · new best' : ''); $('#result-score').textContent = clockText(t, true);
  $('#result-stats').innerHTML = `<div><small>Best</small><b>${clockText(save.times[r.id], true)}</b></div><div><small>${m === 0 ? 'Gold' : m === 1 ? 'For gold' : m === 2 ? 'For silver' : 'For bronze'}</small><b>${clockText(m <= 1 ? r.gold : m === 2 ? r.silver : r.bronze)}</b></div><div><small>Earned</small><b>${cr(pay)}</b></div>`;
  show('result');
}

// ---------- Garage ----------
let swapping = false;
async function useCar(id) { // builds the new car off-scene, then swaps it in within one frame
  if (swapping) return; swapping = true;
  try { const old = player, p = await createPlayer(new THREE.Group(), R.cube.texture, city, carSpec(save, id)); scene.remove(old.root); scene.add(p.root); const i = R.cube.hide.indexOf(old.root); if (i >= 0) R.cube.hide[i] = p.root; else R.cube.hide.push(p.root);
    p.place(city.spawn.x, city.spawn.z, 0); p.setPaint(paintSel); if (env) p.setTime(env); view.inCab = false; player = p; save.car = id; commit(save); }
  catch (e) { console.warn('car', e); toast('That car would not load'); } finally { swapping = false; }
}
function drawGarage() {
  $('#g-cash').textContent = cr(save.cash); const box = $('#g-cars'); box.innerHTML = '';
  for (const c of CARS) { const own = save.cars.includes(c.id), cur = save.car === c.id, sp = carSpec(save, c.id), row = document.createElement('div'); row.className = 'g-car' + (cur ? ' cur' : '');
    row.innerHTML = `<div class="g-head"><div><b>${c.name}</b><small>${c.kind} · about ${Math.round(sp.vmax * 3.6 / 10) * 10} km/h</small></div><button type="button" class="g-act">${cur ? 'Driving' : own ? 'Drive' : 'Buy · ' + cr(c.price)}</button></div><div class="g-bars">${[['Speed', sp.vmax / 100], ['Pull', sp.acc / 1.35], ['Grip', sp.grip / 1.35], ['Brakes', sp.brake / 1.45]].map(([n, v]) => `<span>${n}<i><u style="width:${Math.round(clamp(v, 0.05, 1) * 100)}%"></u></i></span>`).join('')}</div>`;
    const act = row.querySelector('.g-act'); act.disabled = cur || swapping || (!own && save.cash < c.price);
    act.addEventListener('click', async () => { if (swapping) return; if (!own) { if (save.cash < c.price) return; save.cash -= c.price; save.cars.push(c.id); commit(save); } act.textContent = 'Loading…'; act.disabled = true; await useCar(c.id); drawGarage(); });
    if (cur) { const ups = document.createElement('div'); ups.className = 'g-ups';
      for (const [k, name] of UPGRADES) { const lv = upLevel(save, c.id, k), cost = UP_COST[lv], b = document.createElement('button'); b.type = 'button'; b.textContent = lv >= UP_MAX ? `${name} · full` : `${name} ${lv}/${UP_MAX} · ${cr(cost)}`; b.disabled = lv >= UP_MAX || save.cash < cost;
        b.addEventListener('click', () => { if (save.cash < cost) return; save.cash -= cost; (save.up[c.id] ||= {})[k] = lv + 1; commit(save); player.tune(carSpec(save, c.id)); drawGarage(); }); ups.append(b); }
      row.append(ups); }
    box.append(row); }
}

// ---------- Full map (M): tap a road in Free Roam to set a waypoint ----------
function drawBig() { bigmap?.draw({ px: player.pos.x, pz: player.pos.z, heading: player.heading, seen, t: S.time, target: beacon.visible ? beacon.position : null, targetName: A.label, route: S.kind === 'trial' ? A.route : null }); }
function openMap() { if (S.mode !== 'play' && S.mode !== 'pause') return; S.mode = 'map'; show('bigmap'); $('#map-note').textContent = S.kind === 'free' ? 'Tap a road or place to set a waypoint' : A.label; drawBig(); }
function closeMap() { if (S.mode !== 'map') return; S.mode = 'play'; show(null); }
$('#bigmap-canvas').addEventListener('click', e => { if (S.mode !== 'map') return; const r = e.currentTarget.getBoundingClientRect(), w = bigmap.toWorld(e.clientX - r.left, e.clientY - r.top); if (!w) return;
  if (S.kind !== 'free') { toast('Waypoints are for Free Roam'); return; } let t = null;
  if (inCity(w.x, w.z) && w.x >= -HALF) { const rx = clamp(Math.round(w.x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(w.z / P), 0, ROADS - 1) * P; t = Math.abs(w.x - rx) < Math.abs(w.z - rz) ? { x: rx, z: clamp(w.z, 0, SPAN), y: 0 } : { x: clamp(w.x, 0, SPAN), z: rz, y: 0 }; }
  else {
    const destination = world.places.find(p => p.arrival && (p.contains ? p.contains(w.x, w.z) : Math.hypot(w.x - p.x, w.z - p.z) < p.r));
    if (destination) t = destination.arrival;
    else { const n = world.nearRoad(w.x, w.z, 340); if (n && !n.s.tunnel) t = { x: n.s.x, z: n.s.z, y: n.s.y }; }
  }
  if (!t) { toast('Tap closer to a road'); return; } A.way = true; setTarget(t, t.name || 'Waypoint'); $('#map-note').textContent = 'Waypoint set · tap again to move it'; drawBig(); });

// ---------- Photo mode (O) ----------
let shot = false;
function photo(on) {
  if (on) { if (S.mode !== 'play' && S.mode !== 'pause') return; S.mode = 'photo'; view.yaw = 2.5; view.pitch = 0.1; view.zoom = 1; view.inCab = false; player.setInterior(false); show(null); }
  else if (S.mode === 'photo') { S.mode = 'pause'; view.yaw = view.pitch = 0; view.zoom = 1; snapCam = true; show('pause'); }
}
function photoCam() { const a = player.heading + view.yaw, dist = 6.2 * view.zoom, pc = Math.cos(view.pitch), gy = player.groundY;
  pivot.set(player.pos.x, gy + 0.9, player.pos.z);
  want.set(player.pos.x - Math.sin(a) * dist * pc, gy + Math.max(0.3, 0.85 + dist * Math.sin(view.pitch)), player.pos.z - Math.cos(a) * dist * pc);
  camera.position.copy(pivot).lerp(want, cameraClearance(pivot, want));
  if (camera.position.distanceToSquared(pivot) < 0.9) camera.position.copy(pivot).addScaledVector(UP_CAMERA, 1.15);
  camera.lookAt(player.pos.x, gy + 0.7, player.pos.z); camera.near = 0.25; camera.fov = 40; camera.updateProjectionMatrix(); }
function saveShot(blob) { if (!blob) { toast('Could not save the photo'); return; } const name = `afterdark-${Date.now()}.jpg`;
  try { const file = new File([blob], name, { type: 'image/jpeg' }); if (coarse && navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); return; } } catch (e) {}
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('Photo saved'); }

// ---------- Replay: the last twenty seconds from trackside cameras ----------
const REC = { n: 0, i: 0, acc: 0, N: 600, F: 12, d: new Float32Array(600 * 12) }, RP = { t: 0, end: 0, k: 0, camT: 0, side: 1, snap: null, cam: new THREE.Vector3() };
const rget = (k, f) => REC.d[(k % REC.N) * REC.F + f];
function record(dt) { REC.acc += dt; if (REC.acc < 1 / 30) return; REC.acc = 0; const o = (REC.i % REC.N) * REC.F, d = REC.d, p = player;
  d[o] = p.pos.x; d[o + 1] = p.pos.z; d[o + 2] = p.heading; d[o + 3] = p.groundY; d[o + 4] = p.slopeF; d[o + 5] = p.slopeL; d[o + 6] = p.steer; d[o + 7] = p.speed; d[o + 8] = p.braking ? 1 : 0; d[o + 9] = S.clock; d[o + 10] = p.yawRate; d[o + 11] = p.accel;
  { const C = traffic.cars, n = C.length, T = REC.tr ||= new Float32Array(REC.N * n * 5); let q = (REC.i % REC.N) * n * 5; for (let k = 0; k < n; k++) { const c = C[k]; T[q++] = c.x + c.push.x; T[q++] = c.z + c.push.y; T[q++] = c.h; T[q++] = c.y || 0; T[q++] = (c.pitch || 0) + (c.braking ? 10 : 0); } } // the traffic is recorded too, so a replay shows what was really there
  REC.i++; REC.n = Math.min(REC.N, REC.n + 1); }
function replay(on) { const p = player;
  if (on) { if (S.mode !== 'pause' || REC.n < 30) return; spray.clear(); RP.snap = { x: p.pos.x, z: p.pos.z, h: p.heading, gy: p.groundY, sf: p.slopeF, sl: p.slopeL, st: p.steer, sp: p.speed, br: p.braking, yaw: p.yawRate, accel: p.accel };
    RP.snap.traffic = traffic.cars.map(({ x, z, h, y, pitch, braking, spin }) => ({ x, z, h, y, pitch, braking, spin }));
    RP.k = REC.i - REC.n; RP.t = rget(RP.k, 9); RP.end = rget(REC.i - 1, 9); RP.camT = 0; view.inCab = false; p.setInterior(false); S.mode = 'replay'; show(null); }
  else if (S.mode === 'replay') { spray.clear(); const s = RP.snap; p.pos.x = s.x; p.pos.z = s.z; p.heading = s.h; p.groundY = s.gy; p.slopeF = s.sf; p.slopeL = s.sl; p.steer = s.st; p.speed = s.sp; p.braking = s.br; p.yawRate = s.yaw; p.accel = s.accel; p.sync(0);
    traffic.cars.forEach((car, i) => Object.assign(car, s.traffic[i]));
    traffic.update(0, S.time, null, p.pos, true);
    S.mode = 'pause'; snapCam = true; show('pause'); }
}
function stepReplay(dt) { const p = player; RP.t += dt; if (RP.t >= RP.end) { replay(false); return; }
  while (RP.k < REC.i - 2 && rget(RP.k + 1, 9) < RP.t) RP.k++;
  const k = RP.k, t0 = rget(k, 9), t1 = rget(k + 1, 9), u = clamp((RP.t - t0) / Math.max(1e-4, t1 - t0), 0, 1), L = f => lerp(rget(k, f), rget(k + 1, f), u); let dh = rget(k + 1, 2) - rget(k, 2); dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  p.pos.x = L(0); p.pos.z = L(1); p.heading = rget(k, 2) + dh * u; p.groundY = L(3); p.slopeF = L(4); p.slopeL = L(5); p.steer = L(6); p.speed = L(7); p.braking = rget(k, 8) > 0.5; p.yawRate = L(10); p.accel = L(11); p.sync(dt);
  if (REC.tr) { const C = traffic.cars, n = C.length, T = REC.tr, a = (k % REC.N) * n * 5, b = ((k + 1) % REC.N) * n * 5; for (let j = 0; j < n; j++) { const c = C[j], o = a + j * 5, o2 = b + j * 5, far = Math.abs(T[o2] - T[o]) + Math.abs(T[o2 + 1] - T[o + 1]) > 20, w = far ? 0 : u; let hh = T[o2 + 2] - T[o + 2]; hh = Math.atan2(Math.sin(hh), Math.cos(hh));
      c.x = lerp(T[o], T[o2], w); c.z = lerp(T[o + 1], T[o2 + 1], w); c.h = T[o + 2] + hh * w; c.y = lerp(T[o + 3], T[o2 + 3], w); const pb = T[o + 4]; c.braking = pb > 5; c.pitch = pb > 5 ? pb - 10 : pb; c.spin = (c.spin || 0) + (far ? 0 : Math.hypot(T[o2] - T[o], T[o2 + 1] - T[o + 1]) / Math.max(1e-3, t1 - t0)) * dt / 0.33; } }
  RP.camT -= dt; let cd = Math.hypot(RP.cam.x - p.pos.x, RP.cam.z - p.pos.z);
  if (RP.camT <= 0 || cd > 90) { let q = k; const tA = RP.t + 1.7; while (q < REC.i - 1 && rget(q, 9) < tA) q++; const ax = rget(q, 0), az = rget(q, 1), ah = rget(q, 2), ay = rget(q, 3); RP.side = -RP.side;
    const town = inCity(ax, az), n = town ? null : world.nearRoad(ax, az, 30), tight = !!(n && (n.s.tunnel || n.s.bridge)), off = tight ? -2.4 : town ? -(5.6 + Math.random() * 1.6) : RP.side * (5.5 + Math.random() * 3); // in town the camera stands on the near pavement, clear of parked cars
    RP.cam.set(ax + Math.cos(ah) * off, ay + (tight ? 1.0 : town ? 1.9 + Math.random() * 1.2 : 0.7 + Math.random() * 2.2), az - Math.sin(ah) * off); if (!tight) { keepInStreet(RP.cam); RP.cam.y = Math.max(RP.cam.y, ay + 0.5); } RP.camT = 3.6; cd = Math.hypot(RP.cam.x - p.pos.x, RP.cam.z - p.pos.z); }
  pivot.set(p.pos.x, p.groundY + 0.95, p.pos.z);
  camera.position.copy(pivot).lerp(RP.cam, cameraClearance(pivot, RP.cam));
  if (camera.position.distanceToSquared(pivot) < 1.5) camera.position.y += 1.15;
  camera.lookAt(p.pos.x, p.groundY + 0.7, p.pos.z); camera.near = 0.25; camera.fov = lerp(camera.fov, clamp(2 * Math.atan(5.5 / Math.max(3, cd)) * 57.3, 13, 58), Math.min(1, dt * 5)); camera.updateProjectionMatrix();
}

// ---------- HUD ----------
const hud = { speed: $('#hud-speed'), gear: $('#hud-gear'), rev: $('#hud-rev'), time: $('#hud-time'), score: $('#hud-score'), dist: $('#hud-dist'), arrow: $('#hud-arrow'), timeBox: $('#hud-timebox'), obj: $('#hud-obj'), scoreLabel: $('#hud-score-label') };
const map = $('#map'), mctx = map.getContext('2d');
function drawMap() { // a 1 km window around the car, heading up
  const w = map.width, c = w / 2, k = (c - 6) / 520, px = player.pos.x, pz = player.pos.z, X = x => c - (x - px) * k, Y = z => c - (z - pz) * k; mctx.clearRect(0, 0, w, w);
  mctx.save();
  mctx.translate(c, c);
  mctx.rotate(player.heading);
  mctx.translate(-c, -c);
  mctx.lineCap = 'round'; mctx.lineJoin = 'round';
  mctx.strokeStyle = 'rgba(190,205,235,.34)'; mctx.lineWidth = 3; mctx.beginPath(); for (let i = 0; i < ROADS; i++) { mctx.moveTo(X(i * P), Y(0)); mctx.lineTo(X(i * P), Y(SPAN)); mctx.moveTo(X(0), Y(i * P)); mctx.lineTo(X(SPAN), Y(i * P)); } mctx.stroke();
  mctx.strokeStyle = 'rgba(255,214,150,.6)'; mctx.lineWidth = 3.5; mctx.beginPath(); for (const rd of world.roads) for (let i = rd.from; i <= rd.to; i += 6) { const s = world.samples[i]; if (i === rd.from) mctx.moveTo(X(s.x), Y(s.z)); else mctx.lineTo(X(s.x), Y(s.z)); } mctx.stroke();
  mctx.fillStyle = 'rgba(255,214,150,.75)'; for (const t of traffic.cars) mctx.fillRect(X(t.x) - 1.5, Y(t.z) - 1.5, 3, 3);
  mctx.fillStyle = 'rgba(255,255,255,.9)'; for (const pm of places.markers) { const mx = X(pm.x), my = Y(pm.z); if (mx < 4 || my < 4 || mx > w - 4 || my > w - 4) continue; mctx.beginPath(); mctx.moveTo(mx, my - 5); mctx.lineTo(mx + 5, my); mctx.lineTo(mx, my + 5); mctx.lineTo(mx - 5, my); mctx.closePath(); mctx.fill(); }
  if (beacon.visible) { let bx = X(beacon.position.x) - c, by = Y(beacon.position.z) - c; const bl = Math.hypot(bx, by), lim = c - 10; if (bl > lim) { bx *= lim / bl; by *= lim / bl; } mctx.fillStyle = '#35ffe0'; mctx.beginPath(); mctx.arc(c + bx, c + by, 5 + Math.sin(S.time * 5) * 1.5, 0, 7); mctx.fill(); }
  mctx.restore();
  mctx.save(); mctx.translate(c, c); mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.moveTo(0, -8); mctx.lineTo(5.5, 6); mctx.lineTo(0, 3); mctx.lineTo(-5.5, 6); mctx.closePath(); mctx.fill(); mctx.restore();
}
let hudTick = 0;
function drawHud() {
  if (hudTick++ % 3) return; const kmh = Math.abs(player.speed) * 3.6;
  hud.speed.textContent = Math.round(kmh); hud.gear.textContent = player.reversing ? 'R' : kmh < 1 ? 'N' : (audio?.gear ?? Math.min(7, 1 + Math.floor(kmh / 42)));
  hud.rev.style.transform = `scaleX(${clamp(audio ? (audio.rpm - 800) / 7000 : (kmh % 42) / 42, 0.04, 1)})`;
  const k = S.kind, down = k === 'run' || (k === 'jobs' && A.stage === 'drop'); hud.timeBox.hidden = !(down || k === 'trial');
  if (down) { const t = Math.max(0, S.left); hud.time.textContent = clockText(t); hud.timeBox.classList.toggle('low', t < 15); } else if (k === 'trial') { hud.time.textContent = clockText(A.t, true); hud.timeBox.classList.remove('low'); }
  hud.scoreLabel.textContent = k === 'trial' ? 'Gold' : k === 'jobs' ? 'Cash' : 'Score'; hud.score.textContent = k === 'trial' ? clockText(A.route.gold) : k === 'jobs' ? Math.round(save.cash).toLocaleString() : Math.round(S.score).toLocaleString();
  if (hud.obj.textContent !== A.label) hud.obj.textContent = A.label; document.body.classList.toggle('no-target', !beacon.visible);
  const dx = beacon.position.x - player.pos.x, dz = beacon.position.z - player.pos.z; hud.dist.textContent = Math.round(Math.hypot(dx, dz)) + ' m';
  let rel = Math.atan2(dx, dz) - player.heading; hud.arrow.style.transform = `rotate(${-rel}rad)`;
  drawMap();
}

// ---------- Camera: five views, drag to look around, wheel to zoom ----------
const CAMS = ['Chase', 'Far chase', 'Bonnet', 'Cockpit', 'Low wheel'];
const view = { yaw: 0, pitch: 0, zoom: 1, drag: false, idle: 9, x: 0, y: 0, id: -1 };
function nextCam() { audio?.camera(); S.cam = (S.cam + 1) % CAMS.length; view.yaw = view.pitch = 0; snapCam = true; toast(CAMS[S.cam] + ' camera'); }
{ const cv = $('#scene');
  cv.addEventListener('pointerdown', e => { if (S.mode === 'replay') { replay(false); return; } if (S.mode !== 'play' && S.mode !== 'photo') return; view.drag = true; view.id = e.pointerId; view.x = e.clientX; view.y = e.clientY; view.idle = 0; cv.setPointerCapture?.(e.pointerId); cv.classList.add('dragging'); });
  cv.addEventListener('pointermove', e => { if (!view.drag || e.pointerId !== view.id) return; view.yaw -= (e.clientX - view.x) * 0.0055; view.pitch = clamp(view.pitch + (e.clientY - view.y) * 0.004, S.mode === 'photo' ? -0.1 : -0.3, 1.1); view.x = e.clientX; view.y = e.clientY; view.idle = 0; });
  const end = e => { if (e.pointerId !== view.id) return; view.drag = false; cv.classList.remove('dragging'); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', e => { if (S.mode !== 'play' && S.mode !== 'photo') return; e.preventDefault(); view.zoom = clamp(view.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.55, 2.6); }, { passive: false }); }
const CAMW = HALF + 3.4;
function keepInStreet(v) { if (!inCity(v.x, v.z)) { if (!player.tunnel) v.y = Math.max(v.y, world.terrain(v.x, v.z) + 0.9); return v; } const rx = clamp(Math.round(v.x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(v.z / P), 0, ROADS - 1) * P, dx = v.x - rx, dz = v.z - rz, ox = Math.abs(dx) - CAMW, oz = Math.abs(dz) - CAMW;
  if (v.x >= 0 && ox > 0 && oz > 0) { if (ox <= oz) v.x = rx + Math.sign(dx) * CAMW; else v.z = rz + Math.sign(dz) * CAMW; }
  v.x = clamp(v.x, -(HALF + 95), SPAN + CAMW); v.z = clamp(v.z, -CAMW, SPAN + CAMW); if (Math.abs(v.x - city.viaduct) < 12 && v.y > 8) v.y = 8; return v; }
let camYaw = 0, camHeight = 0, camArm = 1, snapCam = true;
const UP_CAMERA = new THREE.Vector3(0, 1, 0), cameraRoad = {};
const camPos = new THREE.Vector3(), pivot = new THREE.Vector3(), look = new THREE.Vector3(), want = new THREE.Vector3();
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function cameraBlocked(x, y, z) {
  if (!inCity(x, z)) {
    if (x < world.bounds.x0 + 0.45 || x > world.bounds.x1 - 0.45 || z < world.bounds.z0 + 0.45 || z > world.bounds.z1 - 0.45) return true;
    if (world.cameraWall?.(x, y, z)) return true;
    if (world.tunnelPassage(x, y, z)) return false;
    const floor = world.ground(x, z, cameraRoad);
    const onRoad = cameraRoad.road && !cameraRoad.road.tunnel && Math.abs(cameraRoad.lat) < 5.8;
    return y < (onRoad ? floor : Math.max(floor, world.terrain(x, z))) + 0.32;
  }
  if (x < 0 || z < 0 || x >= SPAN || z >= SPAN) return false;
  const buildings = city.cameraLots.get(Math.floor(x / P) * ROADS + Math.floor(z / P));
  return buildings?.some(b => y < b.h + 0.38 && Math.abs(x - b.x) < b.w / 2 + 0.28 && Math.abs(z - b.z) < b.d / 2 + 0.28);
}

// How far along the line from the car to the wanted camera position the view stays in open air (0 to 1).
// The test point is as wide and as deep as the near plane, so the edges of the picture cannot cut into a wall or the
// ground, and the first blocked step is refined so the answer changes smoothly rather than in half-metre steps.
function cameraClearance(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z, flat = Math.hypot(dx, dz) || 1, sx = -dz / flat * 0.4, sz = dx / flat * 0.4, ox = dx / flat * 0.32, oz = dz / flat * 0.32;
  const hit = t => { const x = from.x + dx * t, y = from.y + dy * t, z = from.z + dz * t;
    return cameraBlocked(x, y, z) || cameraBlocked(x + sx, y, z + sz) || cameraBlocked(x - sx, y, z - sz) || cameraBlocked(x + ox, y, z + oz) || cameraBlocked(x, y - 0.15, z); };
  const steps = Math.max(2, Math.ceil(from.distanceTo(to) / 0.42));
  for (let i = 1; i <= steps; i++) {
    if (!hit(i / steps)) continue;
    let lo = (i - 1) / steps, hi = i / steps;
    for (let k = 0; k < 5; k++) { const mid = (lo + hi) / 2; if (hit(mid)) hi = mid; else lo = mid; }
    return lo;
  }
  return 1;
}
// Open country: the height the camera needs at `to` for the straight line from the car to clear the land between them.
// Raising the view over a crest or a cutting keeps the car in sight; without it the only answer is to pull the camera in.
function cameraFloor(x, z) { const floor = world.ground(x, z, cameraRoad); return cameraRoad.road && !cameraRoad.road.tunnel && Math.abs(cameraRoad.lat) < 5.8 ? floor : Math.max(floor, world.terrain(x, z)); }
function cameraLift(from, to, margin) {
  const dx = to.x - from.x, dz = to.z - from.z, len = Math.hypot(dx, dz);
  if (len < 1.5 || world.tunnelPassage(from.x, from.y, from.z)) return to.y;
  let need = to.y; const n = Math.ceil(len / 0.7);
  for (let i = 1; i <= n; i++) { const f = i / n; if (f * len < 1.5) continue; const x = from.x + dx * f, z = from.z + dz * f;
    if (inCity(x, z) || world.tunnelPassage(x, from.y + (need - from.y) * f, z)) continue;
    need = Math.max(need, from.y + (cameraFloor(x, z) + margin - from.y) / f); }
  return Math.min(need, from.y + len * 1.9);
}
let camLift = 0, camRaise = 0, camGoal = 0, camClear = 0;

function chase(dt, snap) {
  const h = player.heading, speed = Math.abs(player.speed), cockpit = S.cam === 3, bonnet = S.cam === 2;
  if (view.inCab !== cockpit) { view.inCab = cockpit; player.setInterior(cockpit); }
  if (!view.drag) {
    view.idle += dt;
    if (view.idle > 1.55 && speed > 2) {
      const recenter = Math.exp(-3.5 * dt);
      view.yaw *= recenter;
      view.pitch *= recenter;
    }
  }
  const yawLead = clamp(player.yawRate * 0.08, -0.16, 0.16);
  const turn = angleDiff(h + yawLead, camYaw);
  if (snap) {
    camYaw = h;
    camHeight = player.groundY;
    camArm = 1; camLift = camRaise = 0;
  } else {
    camYaw = h + clamp(angleDiff(camYaw + turn * (1 - Math.exp(-8.5 * dt)), h), -0.24, 0.24);
    // Follow the road's height with its slope fed forward, so the camera neither lags up a hill nor hits a hard limit
    // where one begins (that limit was the kink felt at hill entries and crests).
    if (!player.air) camHeight += player.slopeF * player.speed * dt * 0.9;
    camHeight = lerp(camHeight, player.groundY, 1 - Math.exp(-(player.air ? 8 : 10) * dt));
    camHeight = clamp(camHeight, player.groundY - 0.7, player.groundY + 0.7);
  }
  const sh = S.shake, t = S.time;
  S.shake *= Math.exp(-9.5 * dt);
  const recoil = sh * Math.sin(t * 37), bob = sh * Math.sin(t * 28 + 0.8);
  if (cockpit || bonnet) {
    const height = player.spec.eye || 1.06, coupe = !player.spec.file;
    if (cockpit) {
      camPos.set(0.35, height - (coupe ? 0.07 : 0.03), coupe ? -0.035 : -0.28);
      player.tilt.localToWorld(camPos);
    } else {
      camPos.set(0, Math.max(0.88, height - 0.1), player.len * 0.34);
      player.root.localToWorld(camPos);
    }
    const yaw = h + clamp(view.yaw, -0.86, 0.86) + recoil * 0.008;
    const pitch = clamp(-0.018 - view.pitch * 0.53 + player.slopeF * 0.26 + bob * 0.008, -0.58, 0.26);
    const forward = Math.cos(pitch) * 24;
    look.set(camPos.x + Math.sin(yaw) * forward, camPos.y + Math.sin(pitch) * 24, camPos.z + Math.cos(yaw) * forward);
  } else {
    const [baseDistance, height, sideAngle] = S.cam === 1 ? [9.7, 3.0, 0] : S.cam === 4 ? [4.35, 0.69, 0.60] : [6.25, 1.86, 0];
    const distance = (baseDistance + Math.min(1.20, speed * 0.024)) * view.zoom;
    const a = camYaw + sideAngle + view.yaw, pitch = view.pitch;
    pivot.set(player.pos.x, player.groundY + 0.91, player.pos.z);
    const wild = !inCity(player.pos.x, player.pos.z), margin = S.cam === 4 ? 0.5 : 0.62;
    const aim = up => { const p = Math.max(pitch, up), flat = distance * Math.cos(p);
      want.set(player.pos.x - Math.sin(a) * flat, camHeight + Math.max(0.37, height + distance * Math.sin(p)) + bob * 0.07, player.pos.z - Math.cos(a) * flat);
      return wild || !inCity(want.x, want.z) ? Math.max(0, cameraLift(pivot, want, margin) - want.y) : 0; };
    // 1. Over open ground, rise just enough to see over whatever lies between the camera and the car. Up at once, down gently.
    let lift = aim(camRaise);
    camLift = lift > camLift || snap ? lift : lerp(camLift, lift, 1 - Math.exp(-2.6 * dt));
    want.y += camLift;
    let safe = cameraClearance(pivot, want);
    // 2. Hemmed in by a wall, a building or a rock face: look down from higher up instead of pressing the lens against the car.
    //    The higher view is held once chosen, and released only after the level view has stayed clear for a moment, so it cannot flap.
    const tight = safe * distance < Math.max(2.7, distance * 0.48), wasRaised = camGoal > 0.02 || camRaise > 0.02;
    if (snap) { camGoal = 0; camClear = 0; }
    if (tight) { camClear = 0; let pick = 1.2; for (const up of [0.5, 0.85, 1.2]) { if (up <= camGoal + 0.02) continue; want.y += Math.max(aim(up), camLift); if (cameraClearance(pivot, want) * distance >= Math.max(2.7, distance * 0.6)) { pick = up; break; } } camGoal = Math.max(camGoal, pick); }
    else if (wasRaised) { want.y += Math.max(aim(0), camLift); camClear = cameraClearance(pivot, want) > 0.9 ? camClear + dt : 0; if (camClear > 0.4) camGoal = 0; }
    if (tight || wasRaised) { camRaise = snap ? camGoal : lerp(camRaise, camGoal, 1 - Math.exp(-(camGoal > camRaise ? 7 : 2.2) * dt)); if (Math.abs(camRaise - camGoal) < 0.004) camRaise = camGoal;
      camLift = Math.max(camLift, aim(camRaise)); want.y += camLift; safe = cameraClearance(pivot, want); }
    camArm = safe < camArm || snap ? safe : lerp(camArm, safe, 1 - Math.exp(-5.1 * dt));
    camPos.copy(pivot).lerp(want, camArm);
    if (camPos.distanceTo(pivot) < player.len * 0.37) {
      // When the road leaves no horizontal room, lift the view rather than putting it inside the car.
      camPos.copy(pivot);
      camPos.y += 1.18;
    }
    const ahead = (S.cam === 4 ? 1.8 : 3.65 + Math.min(2.2, speed * 0.038)) * Math.max(0.15, 1 - Math.abs(view.yaw) * 0.66);
    const bearing = h + yawLead;
    look.set(player.pos.x + Math.sin(bearing) * ahead + Math.cos(bearing) * recoil * 0.22,
      camHeight + 0.68 + bob * 0.11 + Math.min(0.65, Math.max(-0.45, player.slopeF * ahead * 0.55)),
      player.pos.z + Math.cos(bearing) * ahead - Math.sin(bearing) * recoil * 0.22);
  }
  camera.position.copy(camPos);
  camera.lookAt(look);
  camera.near = cockpit || bonnet ? 0.055 : 0.20;
  const fov = (cockpit ? 58 : bonnet ? 60 : S.cam === 1 ? 54 : 56) + (cockpit ? 0 : Math.min(7.5, speed * 0.12));
  camera.fov = snap ? fov : lerp(camera.fov, fov, 1 - Math.exp(-6 * dt));
  camera.updateProjectionMatrix();
}
function orbit(t) { const a = t * 0.11 + 2.5, r = 7.4 + Math.sin(t * 0.21) * 1.6; camera.near = 0.25; camera.position.set(player.pos.x + Math.sin(a) * r, player.groundY + 0.95 + (Math.sin(t * 0.17) * 0.5 + 0.5) * 1.3, player.pos.z + Math.cos(a) * r); keepInStreet(camera.position); camera.lookAt(player.pos.x, player.groundY + 0.75, player.pos.z); camera.fov = 42; camera.updateProjectionMatrix(); }

// ---------- Time of day ----------
let dayCount = 0, rainyK = 1;
let hour = 17.2, env = null, envHour = -99, pmrem = null, envRT = null;
const DAY_SECONDS = 720; // one full day and night
function captureEnv() { // image-based lighting from the street itself, refreshed as the light changes
  const rv = rain.visible; rain.visible = false; const hid = street ? street.hide.map(o => [o, o.visible]) : []; hid.forEach(([o]) => { o.visible = false; });
  city.sky.position.copy(player ? player.pos : new THREE.Vector3(city.spawn.x, 0, city.spawn.z)); city.sky.scale.setScalar(0.1); city.sky.updateMatrixWorld(true); pmrem ??= new THREE.PMREMGenerator(renderer); renderer.shadowMap.needsUpdate = true;
  const p = player ? player.pos : city.spawn, rt = pmrem.fromScene(scene, 0.012, 0.5, 1900, { size: QUALITY === 'low' ? 128 : 256, position: new THREE.Vector3(p.x, (player?.groundY || 0) + 3.2, p.z) });
  scene.environment = rt.texture; envRT?.dispose(); envRT = rt; envHour = hour; city.sky.scale.setScalar(1); rain.visible = rv; hid.forEach(([o, v]) => { o.visible = v; });
}
function stepTime(dt, running) {
  if (timeMode === 'auto') { if (running) { const h0 = hour; hour = (hour + dt * 24 / DAY_SECONDS) % 24; if (h0 < 12 && hour >= 12) dayCount++; } } else hour += (TIMES[timeMode] - hour) * Math.min(1, dt * 1.5);
  // Nights alternate: rain on the first, clear and starlit on the next. The fixed Rainy night setting always rains.
  const wantRain = timeMode === 'night' ? 1 : timeMode === 'auto' ? (dayCount % 2 === 0 ? 1 : 0) : (window.__afterdark?.fixedRain || 0); rainyK += (wantRain - rainyK) * Math.min(1, dt * 0.6);
  env = city.setTime(hour, rainyK); world.setTime(env); street.setTime(env); player.setTime(env); traffic.setTime(env); places.setTime(env);
  scene.environmentIntensity = 1.5 - 0.9 * env.night; rain.visible = env.rain > 0.03; rain.material.opacity = 0.17 * env.rain;
  R.refl.active = env.wet > 0.2; R.refl.uniforms.uReflOn.value = R.refl.on ? Math.min(1, Math.max(0, (env.wet - 0.2) / 0.4)) : 0;
  R.bloom.strength = 0.22 + 0.19 * env.night; R.bloom.threshold = 1.05 - 0.05 * env.night;
  let dh = Math.abs(hour - envHour); dh = Math.min(dh, 24 - dh); if (dh > (env.day > 0.05 && env.day < 0.95 ? 0.3 : 0.9)) captureEnv();
}
addEventListener('keydown', e => { if (e.key.toLowerCase() === 't' && S.mode === 'play') { hour = (hour + 2) % 24; toast(`Time ${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.floor(hour % 1 * 60)).padStart(2, '0')}`); } });

// ---------- Performance read-out (F) and a report you can copy ----------
const perf = { on: store.get('fps', 'off') === 'on', t: 0, n: 0, worst: 0, fps: 0, low: 0, sum: 0, secs: 0, minFps: 999, el: $('#perf') };
function perfText() { const r = renderer.getDrawingBufferSize(new THREE.Vector2());
  return `Afterdark report\nFPS now ${perf.fps.toFixed(0)}, slowest frame ${perf.low.toFixed(0)} fps, session average ${(perf.secs ? perf.sum / perf.secs : 0).toFixed(0)}, session minimum ${perf.minFps === 999 ? '-' : perf.minFps.toFixed(0)}\nGraphics ${QUALITY}, auto level ${gov.level}, scale ${R.getScale().toFixed(2)}, canvas ${r.x}x${r.y}, screen ${innerWidth}x${innerHeight} @${devicePixelRatio}\nDraw calls ${R.stats.calls}, triangles ${(R.stats.tris / 1000).toFixed(0)}k, hour ${hour.toFixed(1)}, camera ${S.cam}\nPosition ${player.pos.x.toFixed(0)}, ${player.pos.z.toFixed(0)}, speed ${(Math.abs(player.speed) * 3.6).toFixed(0)} km/h\n${navigator.userAgent}`; }
function stepPerf(rawDt, playing) { perf.t += rawDt; perf.n++; perf.worst = Math.max(perf.worst, rawDt); if (perf.t < 1) return;
  perf.fps = perf.n / perf.t; perf.low = 1 / perf.worst; if (playing && rawDt < 0.3) { perf.sum += perf.fps; perf.secs++; if (S.clock > 6) perf.minFps = Math.min(perf.minFps, perf.fps); }
  perf.t = 0; perf.n = 0; perf.worst = 0;
  if (perf.on) perf.el.textContent = `${perf.fps.toFixed(0)} fps · low ${perf.low.toFixed(0)} · ${R.stats.calls} draws · ${(R.stats.tris / 1000).toFixed(0)}k tris · ${QUALITY}${gov.level ? ' L' + gov.level : ''}`; }
function setPerf(on) { perf.on = on; store.set('fps', on ? 'on' : 'off'); perf.el.hidden = !on; $('#btn-fps').textContent = on ? 'Hide frame rate' : 'Show frame rate'; }
$('#btn-fps').addEventListener('click', () => setPerf(!perf.on));
$('#btn-report').addEventListener('click', async () => { const text = perfText(); try { await navigator.clipboard.writeText(text); $('#btn-report').textContent = 'Copied — paste it to me'; } catch (e) { $('#report-text').hidden = false; $('#report-text').value = text; $('#report-text').select(); } setTimeout(() => { $('#btn-report').textContent = 'Copy performance report'; }, 2500); });
addEventListener('keydown', e => { if (e.key.toLowerCase() === 'f' && (S.mode === 'play' || S.mode === 'pause')) setPerf(!perf.on); });

// ---------- Keeps the frame rate up: if the device struggles, step the cost down without a reload ----------
const gov = { level: 0, t: 0, frames: 0, warm: 6 };
function govern(rawDt, playing) {
  if (!playing || rawDt > 0.3) { gov.t = 0; gov.frames = 0; return; }
  if (gov.warm > 0) { gov.warm -= rawDt; return; }
  gov.t += rawDt; gov.frames++; if (gov.t < 3) return;
  const fps = gov.frames / gov.t; gov.t = 0; gov.frames = 0; gov.fps = fps;
  if (fps < 27 && gov.level < 4) { gov.level++; gov.warm = 2.5;
    if (gov.level === 1) R.setScale(0.82);
    else if (gov.level === 2) { city.shadows = false; R.setScale(0.75); }
    else if (gov.level === 3) { R.refl.on = false; R.cube.frozen = true; R.setScale(0.68); }
    else R.setScale(0.58);
    if (gov.level === 1) toast('Graphics adjusted for a smoother drive'); }
}

const CITY = { name: 'Downtown' }, seen = new Set(save.seen); let lastPlace = CITY, arriveTick = 0;

// ---------- Frame ----------
const clock = new THREE.Clock(); const probe = new THREE.Vector3(); let crashCool = 0;
function frame() {
  requestAnimationFrame(frame);
  const rawDt = clock.getDelta(), dt = Math.min(0.05, rawDt); S.time += dt;
  if (S.mode === 'boot') return;
  const playing = S.mode === 'play'; govern(rawDt, playing); stepPerf(rawDt, playing);
  const replaying = S.mode === 'replay';
  if (S.mode === 'photo') photoCam(); else if (S.mode === 'map') { if ((hudTick++ & 7) === 0) drawBig(); }
  else if (S.mode !== 'pause') {
    stepTime(dt, playing || replaying || S.mode === 'menu'); city.update(S.time); street.update(dt, S.time, player.pos); places.update(S.time);
    if (replaying) {
      stepReplay(dt);
      if (S.mode === 'replay') spray.emit(dt, player, env.wet, city.puddleAt);
      if (S.mode === 'replay') traffic.update(dt, S.time, null, player.pos, true, true);
    } else traffic.update(dt, S.time, playing ? player : null, player.pos);
    if (!replaying && (playing || S.mode === 'over')) {
      const live = playing; const ctrl = { steer: live ? input.left - input.right : 0, throttle: live ? (input.up ? 1 : 0) : 0, brake: live ? input.down : 1, stopOnly: !live, hand: live ? !!input.hand : false };
      player.others.length = 0; for (const w of street.people) if (w.live) player.others.push({ x: w.root.position.x, z: w.root.position.z, r: 0.5 });
      const steps = clamp(Math.ceil(Math.abs(player.speed) * dt / 0.4), 2, 10); let hit = 0; for (let i = 0; i < steps; i++) { hit = Math.max(hit, player.drive(dt / steps, ctrl)); hit = Math.max(hit, traffic.collide(player)); }
      crashCool -= dt;
      if (hit > 2.5 && crashCool <= 0) { crashCool = 0.5; S.shake = Math.min(1.1, hit * 0.07); S.hits++; S.combo = 0; S.score = Math.max(0, S.score - Math.round(hit * 6)); audio?.crash(clamp(hit / 30, 0.2, 1));
        const hx = player.pos.x + Math.sin(player.heading) * 1.9, hz = player.pos.z + Math.cos(player.heading) * 1.9, ns = Math.round(clamp(hit * 1.2, 6, 26));
        for (let k = 0; k < ns && !player.rough; k++) emit(sparks, hx + (Math.random() - 0.5), player.groundY + 0.22 + Math.random() * 0.36, hz + (Math.random() - 0.5), (Math.random() - 0.5) * 11 - player.vel.x * 0.1, 1.5 + Math.random() * 4.5, (Math.random() - 0.5) * 11 - player.vel.z * 0.1, 0.25 + Math.random() * 0.3, 3.2, 2.3, 1.0);
        for (let k = 0; k < 5; k++) emit(haze, hx + (Math.random() - 0.5) * 1.5, player.groundY + 0.4, hz + (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2, 0.6, (Math.random() - 0.5) * 2, 1.1, 0.16, 0.16, 0.17); }
      if (live) {
        S.clock += dt; S.top = Math.max(S.top, Math.abs(player.speed));
        const nm = crashCool < -0.6 ? traffic.nearMiss(player) : 0; if (nm) { S.score += 40 * nm; toast('Near miss +' + 40 * nm); audio?.nearMiss(); }
        if (player.slip > 4 && Math.abs(player.speed) > 9) S.score += player.slip * dt * 3;
        record(dt); stepActivity(dt);
        if ((arriveTick++ & 31) === 0) { let here = null; for (const pm of places.markers) if (pm.contains ? pm.contains(player.pos.x, player.pos.z, 12) : Math.hypot(pm.x - player.pos.x, pm.z - player.pos.z) < pm.r + 40) here = pm; if (!here && inCity(player.pos.x, player.pos.z)) here = CITY; if (here && here !== lastPlace) { lastPlace = here; const fresh = !seen.has(here.name) && here !== CITY; toast(here.name + (here.key === 'summit' ? ` · ${Math.round(here.y)} m` : '') + (fresh ? ' · found +100 cr' : '')); if (!seen.has(here.name)) { seen.add(here.name); save.seen = [...seen]; if (fresh) { S.score += 150; earn(100); } else commit(save); } } else if (!here) lastPlace = null; }
        if (S.mode === 'play') drawHud();
      }
      spray.emit(dt, player, env.wet, city.puddleAt);
      const speed = Math.abs(player.speed);
      const dry = env.wet < 0.3;
      const dust = dry && (player.rough || player.onSand) && speed > 6;
      const smoke = dry && player.slip > 4.5 && speed > 8;
      if (!player.air && (dust || smoke)) {
        const sn = Math.sin(player.heading), cs = Math.cos(player.heading), g = dust ? 0.32 : 0.3;
        const chance = Math.min(0.7, dt * (dust ? 9 + speed * 0.48 : 26));
        for (const side of [-0.82, 0.82]) if (Math.random() < chance) {
          emit(haze, player.pos.x - sn * 1.5 + cs * side, player.groundY + 0.2, player.pos.z - cs * 1.5 - sn * side,
            (Math.random() - 0.5) * 1.5, 0.5 + Math.random(), (Math.random() - 0.5) * 1.5, 1.2,
            g * (dust ? 1.25 : 1), g * (dust ? 1.05 : 1), g * (dust ? 0.75 : 1.02));
        }
      }
      chase(dt, snapCam); snapCam = false;
    } else if (!replaying) orbit(S.time);
    rain.visible = env.rain > 0.03 && !world.tunnelPassage(camera.position.x, camera.position.y, camera.position.z);
    stepParticles(sparks, dt); spray.update(dt, env.night); stepParticles(haze, dt); stepRain(dt, camera.position, player.vel.x, player.vel.z);
    placeLampLights(player.pos);
  }
  if (window.__afterdark?.cam) { const c = window.__afterdark.cam; camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]); camera.fov = c[6] || 55; camera.updateProjectionMatrix(); }
  city.sky.position.copy(camera.position); city.updateSun(player.pos, player.groundY); city.cull(camera.position);
  S.flash = Math.max(0, S.flash - dt * 1.6); R.film.uniforms.uFlash.value = S.flash;
  R.film.uniforms.uSpeed.value = playing ? clamp((Math.abs(player.speed) - 22) / 55, 0, 1) : 0;
  if (audio) { const ev = audio.update(dt, { playing: playing || replaying, speed: player.speed, reverse: replaying ? player.speed < -0.5 : player.reversing, throttle: playing ? (input.up ? 1 : 0) : replaying ? 0.5 : 0, brake: playing ? input.down : 0, hand: playing && !!input.hand, steer: player.steer, slip: player.slip, env, x: player.pos.x, z: player.pos.z, heading: player.heading, beachX: city.beachX, cars: traffic.cars, trainX: city.viaduct, trainZ: street.trainZ(), cockpit: S.cam === 3, people: street.people.some(w => w.live && Math.abs(w.root.position.x - player.pos.x) + Math.abs(w.root.position.z - player.pos.z) < 26) });
    if (ev === 'thunder') S.flash = 0.35; }
  player.updateWetness(dt, env.rain);
  probe.set(player.pos.x, player.groundY + 1.15, player.pos.z); R.render(probe);
  if (shot) { shot = false; renderer.domElement.toBlob(saveShot, 'image/jpeg', 0.93); }
}

async function boot() {
  setLoad('Raising the skyline'); await nextFrame();
  city = await buildCity(scene, R.refl, Q, renderer);
  setLoad('Raising the mountains'); await nextFrame();
  world = city.world = await buildWorld(scene, city, Q);
  city.railway = buildRailway(scene, city, world);
  setLoad('Building the coast and airfield'); await nextFrame();
  places = await buildPlaces(scene, city, world, Q);
  { const sharp = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const x = cv.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return cv; })());
    sparks.pts = new THREE.Points(sparks.geo, new THREE.PointsMaterial({ size: sparks.size, map: sharp, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    haze.pts = new THREE.Points(haze.geo, new THREE.PointsMaterial({ size: haze.size, map: city.dot, vertexColors: true, transparent: true, depthWrite: false, opacity: 0.35 }));
    for (const o of [sparks, haze]) { o.pts.frustumCulled = false; scene.add(o.pts); R.refl.hide.push(o.pts); R.cube.hide.push(o.pts); } }
  setLoad('Planting the avenues'); await nextFrame();
  street = buildStreet(scene, city, R, Q); R.refl.hide.push(...street.hide); R.cube.hide.push(...street.hide);
  setLoad('Soaking the streets'); await nextFrame();
  // Image-based lighting captured from the street itself, so every surface carries the city's neon.
  env = city.setTime(hour, rainyK); captureEnv();
  setLoad('Rolling out the ' + carById(save.car).name); await nextFrame();
  player = await createPlayer(scene, R.cube.texture, city, carSpec(save, save.car)); R.cube.hide.push(player.root);
  player.place(city.spawn.x, city.spawn.z, 0); player.setPaint(paintSel);
  setLoad('Releasing the traffic'); await nextFrame();
  traffic = await createTraffic(scene, city, Q.traffic, Q.reach);
  traffic.update(0.016, 0, null, player.pos); if (TIMES[timeMode] != null) hour = TIMES[timeMode]; stepTime(0, false); captureEnv();
  routes = buildRoutes(world, city); spots = jobSpots(world, places); bigmap = createBigMap($('#bigmap-canvas'), world, places); if (!routes.some(r => r.id === routeSel)) routeSel = routes[0].id; modeUI();
  setPerf(perf.on); city.cull(player.pos, true);
  S.mode = 'menu'; show('menu'); loadEl.classList.add('out'); setTimeout(() => loadEl.remove(), 900);
  window.__afterdark = { S, A, save, traffic, city, street, world, places, R, start, input, useCar, photo, replay, openMap, closeMap, REC }; Object.defineProperty(window.__afterdark, 'player', { get: () => player }); Object.defineProperty(window.__afterdark, 'routes', { get: () => routes }); window.__afterdark.camTest = { view, step: chase, blocked: cameraBlocked, arm: () => camArm }; // lets the camera audit drive the chase camera at a fixed frame rate
  street.loadPeople().catch(e => console.warn('people', e));
  Object.defineProperty(window.__afterdark, 'audio', { get: () => audio }); window.__afterdark.gov = gov; window.__afterdark.perf = perf; window.__afterdark.perfText = perfText;
  window.__afterdark.setTime = (mode, h, rain) => { timeMode = mode; if (h != null) { hour = h; TIMES.fixed = h; } if (rain != null) { dayCount = rain ? 0 : 1; rainyK = rain; if (mode === 'fixed') window.__afterdark.fixedRain = rain; } };
}
boot().catch(e => { console.error(e); setLoad('Could not start: ' + (e?.message || e)); });
frame();
