// Afterdark: free-roam night driving. Boot, input, game state, camera, HUD and the frame loop.
import { THREE, createRenderer, Q, QUALITY } from './render.js';
import { buildCity, P, ROADS, SPAN, HALF } from './city.js';
import { createPlayer } from './car.js';
import { createTraffic } from './traffic.js';
import { buildStreet } from './street.js';
import { buildWorld } from './world.js';
import { createSound } from './sound.js';

const $ = s => document.querySelector(s), clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const store = { get: (k, d) => { try { return localStorage.getItem('afterdark:' + k) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('afterdark:' + k, v); } catch (e) {} } };
const loadEl = $('#loading'), loadMsg = $('#load-msg'), setLoad = t => { loadMsg.textContent = t; };
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

const R = createRenderer($('#scene')), { scene, camera, renderer } = R;
const S = { mode: 'boot', kind: store.get('kind', 'run'), time: 0, clock: 0, left: 120, score: 0, combo: 0, top: 0, hits: 0, shake: 0, cam: 0, sound: store.get('sound', 'on') === 'on', flash: 0 };
const input = { left: 0, right: 0, up: 0, down: 0, hand: 0 };
let city, street, world, player, traffic, audio = null;
const inCity = (x, z) => x <= SPAN + HALF + 4 && z >= -(HALF + 4) && z <= SPAN + HALF + 4;

// ---------- Rain and tyre spray ----------
const RAIN = Q.rain, RR = 34, rainPos = new Float32Array(RAIN * 6), rainGeo = new THREE.BufferGeometry();
for (let i = 0; i < RAIN; i++) { const x = (Math.random() - 0.5) * RR * 2, y = Math.random() * 26, z = (Math.random() - 0.5) * RR * 2; rainPos.set([x, y, z, x, y - 0.9, z], i * 6); }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaab8d8, transparent: true, opacity: 0.17, depthWrite: false, blending: THREE.AdditiveBlending })); rain.frustumCulled = false; rain.visible = false; scene.add(rain);
R.refl.hide.push(rain); R.cube.hide.push(rain);
function stepRain(dt, cx, cz, vx, vz) {
  if (!rain.visible) return;
  const fall = 21 * dt, wx = 2.2 * dt - vx * dt * 0.0, wz = 0;
  for (let i = 0; i < RAIN; i++) { const o = i * 6; let x = rainPos[o] + wx, y = rainPos[o + 1] - fall, z = rainPos[o + 2] + wz;
    if (y < 0 || Math.abs(x - cx) > RR || Math.abs(z - cz) > RR) { y = y < 0 ? 20 + Math.random() * 8 : y; x = cx + (Math.random() - 0.5) * RR * 2; z = cz + (Math.random() - 0.5) * RR * 2; }
    rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z; rainPos[o + 3] = x - 0.1 - vx * 0.012; rainPos[o + 4] = y - 0.95; rainPos[o + 5] = z - vz * 0.012; }
  rainGeo.attributes.position.needsUpdate = true;
}
// Two particle sets: small bright points with gravity (water thrown up by the tyres, sparks from a hit)
// and soft grey puffs (tyre smoke on a dry slide, dust).
function particles(n, size, additive, grav, drag) { const o = { n, i: 0, grav, drag, pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), life: new Float32Array(n), col: new Float32Array(n * 3), geo: new THREE.BufferGeometry(), size, additive, pts: null };
  o.pos.fill(-50); o.geo.setAttribute('position', new THREE.BufferAttribute(o.pos, 3)); o.geo.setAttribute('color', new THREE.BufferAttribute(o.col, 3)); return o; }
const drops = particles(1800, 0.075, true, 13, 0.6), haze = particles(160, 2.2, false, -0.6, 1.8);
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
  S.lastBeaconDist = Math.hypot(beacon.position.x - player.pos.x, beacon.position.z - player.pos.z); beacon.visible = true;
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
  if (k === 'c' && S.mode === 'play') nextCam();
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
seg($('#seg-mode'), [['run', 'Night Run'], ['free', 'Free Roam']], S.kind, v => { S.kind = v; store.set('kind', v); $('#mode-note').textContent = v === 'run' ? 'Reach the light beacons before the clock runs out. Each one adds time.' : 'No clock. Cruise the city, chase beacons if you feel like it.'; });
$('#mode-note').textContent = S.kind === 'run' ? 'Reach the light beacons before the clock runs out. Each one adds time.' : 'No clock. Cruise the city, chase beacons if you feel like it.';
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
$('#btn-sound').addEventListener('click', () => { S.sound = !S.sound; store.set('sound', S.sound ? 'on' : 'off'); document.body.classList.toggle('muted', !S.sound); audio?.setOn(S.sound); });
document.addEventListener('click', e => { if (e.target.closest('button')) audio?.click(); });
document.body.classList.toggle('muted', !S.sound);
$('#btn-full').addEventListener('click', () => { const d = document, el = d.documentElement; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen)?.call(d); else { const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); p?.catch?.(() => {}); } });
if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) $('#btn-full').hidden = true;
$('#scene').addEventListener('webglcontextlost', e => { e.preventDefault(); const el = $('#toast'); el.textContent = 'Graphics were reset. Tap to reload.'; el.classList.add('show'); el.style.pointerEvents = 'auto'; el.onclick = () => location.reload(); });
const show = id => { for (const s of ['menu', 'pause', 'result']) $('#' + s).hidden = s !== id; document.body.dataset.mode = S.mode; };

function ensureAudio() { // must run inside the tap itself or iOS keeps the audio context suspended
  if (audio) { audio.resume(); return; }
  try { audio = createSound(); audio.setOn(S.sound); audio.start(); } catch (e) { console.warn('audio unavailable', e); audio = null; }
}
for (const ev of ['pointerdown', 'touchend', 'keydown']) addEventListener(ev, () => audio?.resume(), { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) audio?.resume(); else if (S.mode === 'play') pause(true); });
function respawn() { const p = player.pos;
  if (!inCity(p.x, p.z)) { const r = world.nearRoad(p.x, p.z, 900); if (r) { player.place(r.s.x - r.s.lx * 2.5, r.s.z - r.s.lz * 2.5, Math.atan2(r.s.tx, r.s.tz)); toast('Back on the road'); return; } }
  const ax = Math.abs(p.x - Math.round(p.x / P) * P) < Math.abs(p.z - Math.round(p.z / P) * P), rx = clamp(Math.round(p.x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(p.z / P), 0, ROADS - 1) * P;
  if (ax) player.place(rx - 5.5, clamp(p.z, 20, SPAN - 20), 0); else player.place(clamp(p.x, 20, SPAN - 20), rz + 5.5, Math.PI / 2); toast('Back on the road'); }
function start() {
  if (S.mode === 'boot') return; ensureAudio();
  player.place(city.spawn.x, city.spawn.z, 0); player.setPaint(paintSel);
  Object.assign(S, { mode: 'play', clock: 0, left: 120, score: 0, combo: 0, top: 0, hits: 0, shake: 0, beacons: 0 });
  camYaw = 0; snapCam = true; view.yaw = view.pitch = 0; view.zoom = 1; moveBeacon(); show(null); toast(S.kind === 'run' ? 'Follow the arrow to the beacon' : 'The city is yours'); setTimeout(() => { if (S.mode === 'play') toast('Drag to look around · C changes camera'); }, 2600);
}
function pause(on) { S.mode = on ? 'pause' : 'play'; show(on ? 'pause' : null); }
function toMenu() { S.mode = 'menu'; beacon.visible = false; player.place(city.spawn.x, city.spawn.z, 0); $('#best').textContent = store.get('best', '0'); show('menu'); }
function finish() {
  S.mode = 'over'; const best = +store.get('best', '0'), isBest = S.score > best; if (isBest) store.set('best', String(Math.round(S.score)));
  audio?.finish(isBest);
  $('#result-label').textContent = isBest ? 'New best run' : 'Run complete'; $('#result-score').textContent = Math.round(S.score).toLocaleString();
  $('#result-stats').innerHTML = `<div><small>Beacons</small><b>${S.beacons}</b></div><div><small>Top speed</small><b>${Math.round(S.top * 3.6)} km/h</b></div><div><small>Contacts</small><b>${S.hits}</b></div>`;
  show('result');
}

// ---------- HUD ----------
const hud = { speed: $('#hud-speed'), gear: $('#hud-gear'), rev: $('#hud-rev'), time: $('#hud-time'), score: $('#hud-score'), dist: $('#hud-dist'), arrow: $('#hud-arrow'), timeBox: $('#hud-timebox') };
const map = $('#map'), mctx = map.getContext('2d');
function drawMap() { // a 1 km window around the car, north up
  const w = map.width, c = w / 2, k = (c - 6) / 520, px = player.pos.x, pz = player.pos.z, X = x => c - (x - px) * k, Y = z => c - (z - pz) * k; mctx.clearRect(0, 0, w, w); mctx.lineCap = 'round'; mctx.lineJoin = 'round';
  mctx.strokeStyle = 'rgba(190,205,235,.34)'; mctx.lineWidth = 3; mctx.beginPath(); for (let i = 0; i < ROADS; i++) { mctx.moveTo(X(i * P), Y(0)); mctx.lineTo(X(i * P), Y(SPAN)); mctx.moveTo(X(0), Y(i * P)); mctx.lineTo(X(SPAN), Y(i * P)); } mctx.stroke();
  mctx.strokeStyle = 'rgba(255,214,150,.6)'; mctx.lineWidth = 3.5; mctx.beginPath(); for (const rd of world.roads) for (let i = rd.from; i <= rd.to; i += 6) { const s = world.samples[i]; if (i === rd.from) mctx.moveTo(X(s.x), Y(s.z)); else mctx.lineTo(X(s.x), Y(s.z)); } mctx.stroke();
  mctx.fillStyle = 'rgba(255,214,150,.75)'; for (const t of traffic.cars) mctx.fillRect(X(t.x) - 1.5, Y(t.z) - 1.5, 3, 3);
  if (beacon.visible) { let bx = X(beacon.position.x) - c, by = Y(beacon.position.z) - c; const bl = Math.hypot(bx, by), lim = c - 10; if (bl > lim) { bx *= lim / bl; by *= lim / bl; } mctx.fillStyle = '#35ffe0'; mctx.beginPath(); mctx.arc(c + bx, c + by, 5 + Math.sin(S.time * 5) * 1.5, 0, 7); mctx.fill(); }
  mctx.save(); mctx.translate(c, c); mctx.rotate(-player.heading); mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.moveTo(0, -8); mctx.lineTo(5.5, 6); mctx.lineTo(0, 3); mctx.lineTo(-5.5, 6); mctx.closePath(); mctx.fill(); mctx.restore();
}
let hudTick = 0;
function drawHud() {
  if (hudTick++ % 3) return; const kmh = Math.abs(player.speed) * 3.6;
  hud.speed.textContent = Math.round(kmh); hud.gear.textContent = player.speed < -0.5 ? 'R' : kmh < 1 ? 'N' : (audio?.gear ?? Math.min(7, 1 + Math.floor(kmh / 42)));
  hud.rev.style.transform = `scaleX(${clamp(audio ? (audio.rpm - 800) / 7000 : (kmh % 42) / 42, 0.04, 1)})`;
  hud.score.textContent = Math.round(S.score).toLocaleString();
  hud.timeBox.hidden = S.kind !== 'run'; if (S.kind === 'run') { const t = Math.max(0, S.left); hud.time.textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; hud.timeBox.classList.toggle('low', t < 15); }
  const dx = beacon.position.x - player.pos.x, dz = beacon.position.z - player.pos.z; hud.dist.textContent = Math.round(Math.hypot(dx, dz)) + ' m';
  let rel = Math.atan2(dx, dz) - player.heading; hud.arrow.style.transform = `rotate(${-rel}rad)`;
  drawMap();
}

// ---------- Camera: five views, drag to look around, wheel to zoom ----------
const CAMS = ['Chase', 'Far chase', 'Bonnet', 'Cockpit', 'Low wheel'];
const view = { yaw: 0, pitch: 0, zoom: 1, drag: false, idle: 9, x: 0, y: 0, id: -1 };
function nextCam() { audio?.camera(); S.cam = (S.cam + 1) % CAMS.length; view.yaw = view.pitch = 0; snapCam = true; toast(CAMS[S.cam] + ' camera'); }
{ const cv = $('#scene');
  cv.addEventListener('pointerdown', e => { if (S.mode !== 'play') return; view.drag = true; view.id = e.pointerId; view.x = e.clientX; view.y = e.clientY; view.idle = 0; cv.setPointerCapture?.(e.pointerId); cv.classList.add('dragging'); });
  cv.addEventListener('pointermove', e => { if (!view.drag || e.pointerId !== view.id) return; view.yaw -= (e.clientX - view.x) * 0.0055; view.pitch = clamp(view.pitch + (e.clientY - view.y) * 0.004, -0.3, 1.1); view.x = e.clientX; view.y = e.clientY; view.idle = 0; });
  const end = e => { if (e.pointerId !== view.id) return; view.drag = false; cv.classList.remove('dragging'); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', e => { if (S.mode !== 'play') return; e.preventDefault(); view.zoom = clamp(view.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.55, 2.6); }, { passive: false }); }
const CAMW = HALF + 3.4;
function keepInStreet(v) { if (!inCity(v.x, v.z)) { if (!player.tunnel) v.y = Math.max(v.y, world.terrain(v.x, v.z) + 0.9); return v; } const rx = clamp(Math.round(v.x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(v.z / P), 0, ROADS - 1) * P, dx = v.x - rx, dz = v.z - rz, ox = Math.abs(dx) - CAMW, oz = Math.abs(dz) - CAMW;
  if (v.x >= 0 && ox > 0 && oz > 0) { if (ox <= oz) v.x = rx + Math.sign(dx) * CAMW; else v.z = rz + Math.sign(dz) * CAMW; }
  v.x = clamp(v.x, -(HALF + 95), SPAN + CAMW); v.z = clamp(v.z, -CAMW, SPAN + CAMW); if (Math.abs(v.x - city.viaduct) < 12 && v.y > 8) v.y = 8; return v; }
let camYaw = 0, snapCam = true; const camPos = new THREE.Vector3(), look = new THREE.Vector3(), want = new THREE.Vector3();
function chase(dt, snap) {
  const h = player.heading, sp = Math.abs(player.speed), inside = S.cam === 2 || S.cam === 3;
  if (view.inCab !== (S.cam === 3)) { view.inCab = S.cam === 3; player.setInterior(view.inCab); }
  if (!view.drag) { view.idle += dt; if (view.idle > 2.2 && sp > 2) { const k = Math.exp(-2.6 * dt); view.yaw *= k; view.pitch *= k; } }
  let dy = h - camYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); camYaw += dy * Math.min(1, dt * (inside ? 30 : 4.2)); if (snap) camYaw = h;
  if (inside) { const lx = S.cam === 3 ? 0.36 : 0, ly = S.cam === 3 ? 1.06 : 1.1, lz = S.cam === 3 ? -0.32 : 0.45, sn = Math.sin(h), cs = Math.cos(h);
    camPos.set(player.pos.x + sn * lz + cs * lx, ly + player.groundY, player.pos.z + cs * lz - sn * lx); const a = h + view.yaw, cp = Math.cos(view.pitch * 0.7);
    look.set(camPos.x + Math.sin(a) * cp * 30, camPos.y - 0.6 + Math.sin(view.pitch * 0.7) * -30 * 0 - view.pitch * 12, camPos.z + Math.cos(a) * cp * 30); }
  else { const base = S.cam === 1 ? [10.5, 3.3, 0] : S.cam === 4 ? [4.3, 0.55, 0.62] : [6.3, 1.75, 0], dist = (base[0] + sp * 0.028) * view.zoom, a = camYaw + base[2] + view.yaw, pc = Math.cos(view.pitch), ps = Math.sin(view.pitch);
    want.set(player.pos.x - Math.sin(a) * dist * pc, player.groundY + Math.max(0.35, base[1] + sp * 0.006 + dist * ps), player.pos.z - Math.cos(a) * dist * pc);
    keepInStreet(want); if (snap || view.drag) camPos.copy(want); else camPos.lerp(want, 1 - Math.pow(0.0006, dt)); keepInStreet(camPos);
    const ahead = S.cam === 4 ? 1.2 : 4.5 * Math.max(0, 1 - Math.abs(view.yaw) * 0.8); look.set(player.pos.x + Math.sin(h) * ahead, 0.95 + player.groundY, player.pos.z + Math.cos(h) * ahead); }
  const sh = S.shake; S.shake = Math.max(0, sh - dt * 2.4);
  camera.position.set(camPos.x + (Math.random() - 0.5) * sh * 0.5, Math.max(0.3 + player.groundY, camPos.y + (Math.random() - 0.5) * sh * 0.35), camPos.z + (Math.random() - 0.5) * sh * 0.5);
  camera.lookAt(look); const near = inside ? 0.08 : 0.25; if (camera.near !== near) camera.near = near;
  camera.fov = lerp(camera.fov, (S.cam === 3 ? 66 : 56) + clamp(sp * 0.24, 0, 20), Math.min(1, dt * 4)); camera.updateProjectionMatrix();
}
function orbit(t) { const a = t * 0.11 + 2.5, r = 7.4 + Math.sin(t * 0.21) * 1.6; camera.position.set(player.pos.x + Math.sin(a) * r, player.groundY + 0.95 + (Math.sin(t * 0.17) * 0.5 + 0.5) * 1.3, player.pos.z + Math.cos(a) * r); keepInStreet(camera.position); camera.lookAt(player.pos.x, player.groundY + 0.75, player.pos.z); camera.fov = 42; camera.updateProjectionMatrix(); }

// ---------- Time of day ----------
let hour = 17.2, env = null, envHour = -99, pmrem = null, envRT = null;
const DAY_SECONDS = 720; // one full day and night
function captureEnv() { // image-based lighting from the street itself, refreshed as the light changes
  const rv = rain.visible; rain.visible = false; const hid = street ? street.hide.map(o => [o, o.visible]) : []; hid.forEach(([o]) => { o.visible = false; });
  city.sky.position.copy(player ? player.pos : new THREE.Vector3(city.spawn.x, 0, city.spawn.z)); city.sky.scale.setScalar(0.1); city.sky.updateMatrixWorld(true); pmrem ??= new THREE.PMREMGenerator(renderer); renderer.shadowMap.needsUpdate = true;
  const p = player ? player.pos : city.spawn, rt = pmrem.fromScene(scene, 0.012, 0.5, 1900, { size: QUALITY === 'low' ? 128 : 256, position: new THREE.Vector3(p.x, 3.2, p.z) });
  scene.environment = rt.texture; envRT?.dispose(); envRT = rt; envHour = hour; city.sky.scale.setScalar(1); rain.visible = rv; hid.forEach(([o, v]) => { o.visible = v; });
}
function stepTime(dt, running) {
  if (timeMode === 'auto') { if (running) hour = (hour + dt * 24 / DAY_SECONDS) % 24; } else hour += (TIMES[timeMode] - hour) * Math.min(1, dt * 1.5);
  env = city.setTime(hour); street.setTime(env); player.setTime(env); traffic.setTime(env);
  scene.environmentIntensity = 1.5 - 0.9 * env.night; rain.visible = env.rain > 0.03; rain.material.opacity = 0.17 * env.rain;
  R.refl.active = env.wet > 0.2; R.refl.uniforms.uReflOn.value = R.refl.on ? Math.min(1, Math.max(0, (env.wet - 0.2) / 0.4)) : 0;
  R.bloom.strength = 0.22 + 0.26 * env.night; R.bloom.threshold = 1.05 - 0.05 * env.night;
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

// ---------- Frame ----------
const clock = new THREE.Clock(); const probe = new THREE.Vector3(); let crashCool = 0;
function frame() {
  requestAnimationFrame(frame);
  const rawDt = clock.getDelta(), dt = Math.min(0.05, rawDt); S.time += dt;
  if (S.mode === 'boot') return;
  const playing = S.mode === 'play'; govern(rawDt, playing); stepPerf(rawDt, playing);
  if (S.mode !== 'pause') {
    stepTime(dt, playing || S.mode === 'menu'); city.update(S.time); street.update(dt, S.time, player.pos);
    traffic.update(dt, S.time, playing ? player : null, player.pos);
    if (playing || S.mode === 'over') {
      const live = playing; const ctrl = { steer: live ? input.left - input.right : 0, throttle: live ? (input.up ? 1 : 0) : 0, brake: live ? input.down : 1, hand: live ? !!input.hand : false };
      player.others.length = 0; for (const w of street.people) if (w.live) player.others.push({ x: w.root.position.x, z: w.root.position.z, r: 0.5 });
      const steps = clamp(Math.ceil(Math.abs(player.speed) * dt / 0.4), 2, 10); let hit = 0; for (let i = 0; i < steps; i++) { hit = Math.max(hit, player.drive(dt / steps, ctrl)); hit = Math.max(hit, traffic.collide(player)); }
      crashCool -= dt;
      if (hit > 2.5 && crashCool <= 0) { crashCool = 0.5; S.shake = Math.min(1.1, hit * 0.07); S.hits++; S.combo = 0; S.score = Math.max(0, S.score - Math.round(hit * 6)); audio?.crash(clamp(hit / 30, 0.2, 1));
        const hx = player.pos.x + Math.sin(player.heading) * 1.9, hz = player.pos.z + Math.cos(player.heading) * 1.9, ns = Math.round(clamp(hit * 1.2, 6, 26));
        for (let k = 0; k < ns; k++) emit(drops, hx + (Math.random() - 0.5), 0.35 + Math.random() * 0.5, hz + (Math.random() - 0.5), (Math.random() - 0.5) * 11 - player.vel.x * 0.1, 1.5 + Math.random() * 4.5, (Math.random() - 0.5) * 11 - player.vel.z * 0.1, 0.25 + Math.random() * 0.3, 3.2, 2.3, 1.0);
        for (let k = 0; k < 5; k++) emit(haze, hx + (Math.random() - 0.5) * 1.5, 0.4, hz + (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2, 0.6, (Math.random() - 0.5) * 2, 1.1, 0.16, 0.16, 0.17); }
      if (live) {
        S.clock += dt; S.top = Math.max(S.top, Math.abs(player.speed));
        const nm = crashCool < -0.6 ? traffic.nearMiss(player) : 0; if (nm) { S.score += 40 * nm; toast('Near miss +' + 40 * nm); audio?.nearMiss(); }
        if (player.slip > 4 && Math.abs(player.speed) > 9) S.score += player.slip * dt * 3;
        if (Math.hypot(beacon.position.x - player.pos.x, beacon.position.z - player.pos.z) < 9) { S.combo++; S.beacons++; const gain = 250 + 50 * S.combo; S.score += gain; S.left = Math.min(240, S.left + clamp(S.lastBeaconDist / 20, 16, 55)); S.flash = 0.18; audio?.beacon(); toast(`Beacon +${gain}`); moveBeacon(); }
        if (S.kind === 'run') { S.left -= dt; if (S.left <= 0) finish(); }
        drawHud();
      }
      // Water thrown up by the tyres on a wet road: droplets fanning out behind each wheel. On a dry road a slide lays smoke.
      { const sp2 = Math.abs(player.speed), h = player.heading, sn = Math.sin(h), cs = Math.cos(h), gy = player.groundY;
        if (env.wet > 0.45 && sp2 > 5 && !player.onSand) { const n = Math.min(26, Math.round(sp2 * 0.42 * env.wet + player.slip * 2)); for (let k = 0; k < n; k++) { const side = (k & 1 ? -0.82 : 0.82), back = k % 4 < 3 ? -1.45 : 1.25, b = 0.5 + Math.random() * 0.5;
            emit(drops, player.pos.x + sn * back + cs * side, gy + 0.08, player.pos.z + cs * back - sn * side, player.vel.x * (0.25 + Math.random() * 0.3) + cs * side * (1 + Math.random() * 2.5), 0.8 + Math.random() * (1.2 + sp2 * 0.09), player.vel.z * (0.25 + Math.random() * 0.3) - sn * side * (1 + Math.random() * 2.5), 0.35 + Math.random() * 0.3, 1.1 * b, 1.25 * b, 1.5 * b); } }
        else if ((player.slip > 4.5 && sp2 > 8) || (player.onSand && sp2 > 6)) { const sand = player.onSand, g = sand ? 0.34 : 0.3; for (const side of [-0.82, 0.82]) if (Math.random() < 0.6) emit(haze, player.pos.x - sn * 1.5 + cs * side, gy + 0.2, player.pos.z - cs * 1.5 - sn * side, (Math.random() - 0.5) * 1.5, 0.5 + Math.random(), (Math.random() - 0.5) * 1.5, 1.2, g * (sand ? 1.25 : 1), g * (sand ? 1.05 : 1), g * (sand ? 0.75 : 1.02)); } }
      chase(dt, snapCam); snapCam = false;
    } else orbit(S.time);
    stepParticles(drops, dt); stepParticles(haze, dt); stepRain(dt, camera.position.x, camera.position.z, player.vel.x, player.vel.z);
    placeLampLights(player.pos);
  }
  if (window.__afterdark?.cam) { const c = window.__afterdark.cam; camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]); camera.fov = c[6] || 55; camera.updateProjectionMatrix(); }
  city.sky.position.copy(camera.position); city.updateSun(player.pos); city.cull(camera.position);
  S.flash = Math.max(0, S.flash - dt * 1.6); R.film.uniforms.uFlash.value = S.flash;
  R.film.uniforms.uSpeed.value = playing ? clamp((Math.abs(player.speed) - 22) / 55, 0, 1) : 0;
  if (audio) { const ev = audio.update(dt, { playing, speed: player.speed, throttle: playing ? (input.up ? 1 : 0) : 0, brake: playing ? input.down : 0, hand: playing && !!input.hand, steer: player.steer, slip: player.slip, env, x: player.pos.x, z: player.pos.z, heading: player.heading, beachX: city.beachX, cars: traffic.cars, trainX: city.viaduct, trainZ: street.trainZ(), cockpit: S.cam === 3, people: street.people.some(w => w.live && Math.abs(w.root.position.x - player.pos.x) + Math.abs(w.root.position.z - player.pos.z) < 26) });
    if (ev === 'thunder') S.flash = 0.35; }
  probe.set(player.pos.x, 1.15, player.pos.z); R.render(probe);
}

async function boot() {
  setLoad('Raising the skyline'); await nextFrame();
  city = await buildCity(scene, R.refl, Q, renderer);
  setLoad('Raising the mountains'); await nextFrame();
  world = city.world = await buildWorld(scene, city, Q);
  { const sharp = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const x = cv.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return cv; })());
    drops.pts = new THREE.Points(drops.geo, new THREE.PointsMaterial({ size: drops.size, map: sharp, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    haze.pts = new THREE.Points(haze.geo, new THREE.PointsMaterial({ size: haze.size, map: city.dot, vertexColors: true, transparent: true, depthWrite: false, opacity: 0.35 }));
    for (const o of [drops, haze]) { o.pts.frustumCulled = false; scene.add(o.pts); R.refl.hide.push(o.pts); R.cube.hide.push(o.pts); } }
  setLoad('Planting the avenues'); await nextFrame();
  street = buildStreet(scene, city, R, Q); R.refl.hide.push(...street.hide); R.cube.hide.push(...street.hide);
  setLoad('Soaking the streets'); await nextFrame();
  // Image-based lighting captured from the street itself, so every surface carries the city's neon.
  env = city.setTime(hour); captureEnv();
  setLoad('Rolling out the coupé'); await nextFrame();
  player = await createPlayer(scene, R.cube.texture, city); R.cube.hide.push(player.root);
  player.place(city.spawn.x, city.spawn.z, 0); player.setPaint(paintSel);
  setLoad('Releasing the traffic'); await nextFrame();
  traffic = await createTraffic(scene, city, Q.traffic, Q.reach);
  traffic.update(0.016, 0, null, player.pos); if (TIMES[timeMode] != null) hour = TIMES[timeMode]; stepTime(0, false); captureEnv();
  setPerf(perf.on); city.cull(player.pos, true);
  S.mode = 'menu'; show('menu'); loadEl.classList.add('out'); setTimeout(() => loadEl.remove(), 900);
  window.__afterdark = { S, player, traffic, city, street, world, R, start, input };
  street.loadPeople().catch(e => console.warn('people', e));
  Object.defineProperty(window.__afterdark, 'audio', { get: () => audio }); window.__afterdark.gov = gov; window.__afterdark.perf = perf; window.__afterdark.perfText = perfText;
  window.__afterdark.setTime = (mode, h) => { timeMode = mode; if (h != null) { hour = h; TIMES.fixed = h; } };
}
boot().catch(e => { console.error(e); setLoad('Could not start: ' + (e?.message || e)); });
frame();
