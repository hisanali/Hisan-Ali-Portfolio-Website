/* Foundry: Hisan Ali's name and work as cast steel. Scrolling is cooling; the camera travels
   down the casting table from piece to piece. Touch reheats the metal, a tap is a hammer blow. */
import * as THREE from 'three';
import { clamp, lerp, smooth, track, blackbody, heatName, RAD, rng } from './util.js';
import { loadFont, makePiece, makeHeatStepper } from './pieces.js';
import { makeWorld } from './world.js';
import { makeSparks, makeEmbers, makeSmoke } from './fx.js';
import { makeAudio } from './audio.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const lite = coarse || Math.min(innerWidth, innerHeight) < 560;
const portrait = innerWidth < innerHeight;

/* ---------- the pieces, in the order the camera meets them ---------- */
const SP = 30;                                   // metres of table between pieces
const DEFS = [
  { lines: ['Hisan.'], hotLast: true, temp: track([[0, 1250], [.05, 1205], [.12, 1040], [.2, 830], [.26, 670], [.3, 610], [1, 610]]) },
  { lines: ['BELLA', 'BATHWARES'], temp: track([[0, 770], [.3, 745], [.44, 690], [1, 650]]) },
  { lines: portrait ? ['SOAL', 'OMAN'] : ['SOAL OMAN'], temp: track([[0, 345], [.46, 322], [.62, 286], [1, 270]]) },
  { lines: ['CRAFTORY'], temp: () => 24 },
  { lines: ['Hisan.'], hotLast: true, temp: () => 1140, quench: true }
];
const DOT_T = 990;                               // the full stop of the wordmark never drops below orange heat
const camX = track([[0, 0], [.26, 0], [.3, SP], [.44, SP], [.48, 2 * SP], [.62, 2 * SP], [.66, 3 * SP], [.8, 3 * SP], [.86, 4 * SP], [1, 4 * SP]]);

/* ---------- overlay ---------- */
const stage = $('#stage'), boot = $('#boot'), bootPct = $('#bootPct'), roTemp = $('#roTemp'), roState = $('#roState');
const caps = $$('.cap').map(el => ({ el, a: +el.dataset.a, b: +el.dataset.b, on: null }));
const setText = (el, s) => { if (el.textContent !== s) el.textContent = s; };
function hud(p, T) {
  setText(roTemp, Math.round(T).toLocaleString('en-US') + ' °C'); setText(roState, heatName(T));
  const F = .022;
  for (const c of caps) {
    const fin = c.a <= 0 ? 1 : smooth(c.a, c.a + F, p), fout = c.b >= 1 ? 1 : 1 - smooth(c.b - F, c.b, p), o = Math.min(fin, fout);
    c.el.style.opacity = o.toFixed(3);
    c.el.style.transform = 'translate3d(0,' + ((1 - o) * (p < c.a + F ? 16 : -16)).toFixed(1) + 'px,0)';
    const on = o > .35;
    if (on !== c.on) { c.on = on; c.el.classList.toggle('is-on', on); }
  }
}
const scrollMax = () => document.documentElement.scrollHeight - window.innerHeight;
const readP = () => { const m = scrollMax(); return m > 0 ? clamp(window.scrollY / m) : 0; };
caps.forEach(c => c.el.addEventListener('focusin', () => { if (!c.on) window.scrollTo({ top: ((c.a + c.b) / 2 + .02) * scrollMax() }); }));

const copyBtn = $('#copyMail'), mailAddr = $('#mailAddr');
if (copyBtn) copyBtn.addEventListener('click', () => {
  const back = () => setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
  const done = () => { copyBtn.textContent = 'Copied'; back(); };
  const select = () => { const r = document.createRange(); r.selectNodeContents(mailAddr); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copyBtn.textContent = 'Selected'; back(); };
  try { navigator.clipboard.writeText(mailAddr.textContent).then(done, select); } catch (e) { select(); }
});

const soundBtn = $('#sound'), soundLabel = $('#soundLabel');
let audio = null, soundOn = false, lastSizzle = 0;
soundBtn.addEventListener('click', () => {
  if (!audio) audio = makeAudio();
  if (!audio) { soundLabel.textContent = 'unavailable'; return; }
  soundOn = !soundOn; audio.ctx.resume();
  audio.master.gain.setTargetAtTime(soundOn ? .55 : 0, audio.ctx.currentTime, .3);
  soundBtn.setAttribute('aria-pressed', String(soundOn)); soundLabel.textContent = soundOn ? 'on' : 'off';
});

/* ---------- the scene ---------- */
let time = 0, p = 0, last = 0, app = null;
const ptr = { nx: 0, ny: 0, x: 0, y: 0, lastX: 9, lastY: 9, lastT: 0 };

async function build(step) {
  const world = makeWorld($('#gl'), { lite }), { renderer, scene, camera, key, glowA, glowB, shimmer } = world;
  await step(20);
  const font = await loadFont('dm-serif-display-400.woff');
  await step(34);
  const pieces = [];
  for (let i = 0; i < DEFS.length; i++) {
    const pc = makePiece(font, DEFS[i].lines, { floatType: world.floatType, hotLast: !!DEFS[i].hotLast });
    pc.x = i * SP; pc.group.position.x = pc.x; pc.T = 25; pc.fit = { d: 9, y: 1.4, ly: .9 };
    if (DEFS[i].hotLast) pc.uniforms.uHot.value.w = DOT_T;
    scene.add(pc.group); pieces.push(pc);
    await step(36 + i * 8);
  }
  const stepHeat = makeHeatStepper(renderer);
  const sparks = makeSparks(scene, lite ? 320 : 640), embers = makeEmbers(scene, lite ? 70 : 150), smoke = makeSmoke(scene, lite ? 26 : 44);
  const rnd = rng(77), ray = new THREE.Vector3(), tmp = new THREE.Vector3();
  let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 1.75), dirty = true, slow = 0, shake = 0, smokeAcc = 0, quenchAt = -1, steamLeft = 0, steamAcc = 0, active = 0;

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    world.resize(w, h, dpr);
    const t = Math.tan(camera.fov * RAD / 2);
    for (const pc of pieces) { const d = Math.max(pc.width * .5 * (camera.aspect < .8 ? 1.1 : 1.22) / (t * camera.aspect), pc.height * .5 * 2.2 / t, 6.5); pc.fit = { d, y: pc.height * .52 + d * .1, ly: pc.height * .44 }; }
    embers.uniforms.uScale.value = renderer.domElement.height / (2 * t);
  }
  // Where a point on the screen meets the face of the nearest piece, if it does.
  function pick(nx, ny) {
    const pc = pieces[active];
    ray.set(nx, ny, .5).unproject(camera).sub(camera.position).normalize();
    if (ray.z > -.01) return null;
    const k = (pc.frontZ - camera.position.z) / ray.z, wx = camera.position.x + ray.x * k, wy = camera.position.y + ray.y * k;
    const u = (wx - pc.x - pc.min.x) / pc.size.x, v = (wy - pc.min.y) / pc.size.y;
    return u < -.05 || u > 1.05 || v < -.1 || v > 1.1 ? null : { pc, u, v, wx, wy, wz: pc.frontZ };
  }
  function touch(nx, ny, amount) {
    const hit = pick(nx, ny);
    if (!hit) return;
    hit.pc.pending.push({ u: hit.u, v: hit.v, r: .2, amount }); if (hit.pc.pending.length > 5) hit.pc.pending.shift();
    if (soundOn && performance.now() - lastSizzle > 160) { lastSizzle = performance.now(); audio.sizzle(); }
  }
  function tap(nx, ny) {
    const hit = pick(nx, ny);
    if (hit && DEFS[active].quench && quenchAt < 0 && p > .86) {         // the last piece goes into the water
      quenchAt = time; steamLeft = lite ? 16 : 26; if (soundOn) audio.quench(); return;
    }
    if (hit) {
      sparks.burst(hit.wx, hit.wy, hit.wz + .04, reduced ? 20 : lite ? 55 : 95, 3.4, 0, .5, 1);
      hit.pc.pending.push({ u: hit.u, v: hit.v, r: .24, amount: 1 });
      shake = 1;
    } else {            // a blow on the bare plate
      ray.set(nx, ny, .5).unproject(camera).sub(camera.position).normalize();
      if (ray.y > -.02) return;
      const k = -camera.position.y / ray.y; if (k > 40) return;
      sparks.burst(camera.position.x + ray.x * k, .03, camera.position.z + ray.z * k, reduced ? 10 : 30, 2.2, 0, .8, .2);
      shake = .5;
    }
    if (soundOn) audio.strike();
  }
  function setGlow(light, pc) {
    const c = pc ? blackbody(pc.T * .96) : [0, 0, 0], m = Math.max(c[0], c[1], c[2]);
    if (m < .004) { light.intensity = 0; return; }
    light.color.setRGB(c[0] / m, c[1] / m, c[2] / m); light.intensity = m * 11;
    light.position.set(pc.x, pc.height * .45, 1.5);
  }
  function update(q, t, dt) {
    if (dirty) { dirty = false; resize(); }
    const cx = camX(q), f = cx / SP, i0 = clamp(Math.floor(f), 0, pieces.length - 1), i1 = Math.min(i0 + 1, pieces.length - 1), ft = smooth(0, 1, f - i0);
    active = clamp(Math.round(f), 0, pieces.length - 1);
    pieces.forEach((pc, i) => {
      pc.T = DEFS[i].quench && quenchAt >= 0 ? lerp(1140, 70, smooth(0, 1.7, t - quenchAt)) : DEFS[i].temp(q);
      pc.uniforms.uBaseT.value = pc.T; pc.group.visible = i === i0 || i === i1;
    });
    const A = pieces[i0].fit, B = pieces[i1].fit, drift = reduced ? 0 : 1;
    shake = Math.max(0, shake - dt * 5);
    camera.position.set(cx + Math.sin(t * .23) * .12 * drift + ptr.x * .45 + (rnd() - .5) * shake * .05, lerp(A.y, B.y, ft) + Math.sin(t * .31) * .05 * drift - ptr.y * .18 + (rnd() - .5) * shake * .05, lerp(A.d, B.d, ft) * lerp(1.1, 1, smooth(0, .1, q)));
    camera.lookAt(cx, lerp(A.ly, B.ly, ft), 0);
    key.position.set(cx + 4.5, 9.5, 6.5); key.target.position.set(cx, .7, 0); key.target.updateMatrixWorld();
    setGlow(glowA, pieces[i0]); setGlow(glowB, i1 !== i0 ? pieces[i1] : null);
    stepHeat(pieces[i0], dt); if (i1 !== i0) stepHeat(pieces[i1], dt);

    const pc = pieces[active], hot = smooth(520, 1050, pc.T);
    embers.uniforms.uTime.value = t; embers.uniforms.uOrigin.value.set(pc.x, 0, .25); embers.uniforms.uSpan.value.set(pc.width * .5, pc.height); embers.uniforms.uAmt.value = hot;
    smokeAcc += dt * (hot * 3 + smooth(250, 520, pc.T) * (1 - hot) * 1.2);
    while (smokeAcc > 1) { smokeAcc--; smoke.emit(pc.x + (rnd() - .5) * pc.width * .9, pc.height * (.45 + rnd() * .55), (rnd() - .5) * .4, false, hot); }
    if (steamLeft > 0) { steamAcc += dt * 30; while (steamAcc > 1 && steamLeft > 0) { steamAcc--; steamLeft--; smoke.emit(pc.x + (rnd() - .5) * pc.width, pc.height * rnd() * .8, .4, true); } }
    if (shimmer) {
      tmp.set(pc.x, pc.height * 1.1, 0).project(camera);
      shimmer.uniforms.uCenter.value.set(tmp.x * .5 + .5, tmp.y * .5 + .5); shimmer.uniforms.uSize.value.set(clamp(pc.width / (pieces[active].fit.d * 1.1), .12, .6), .34);
      shimmer.uniforms.uAmt.value = reduced ? 0 : hot; shimmer.uniforms.uTime.value = t;
    }
    sparks.update(dt); smoke.update(dt);
    world.render(dt, t, [smoke.group]);
    if (dt > .034) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 45 && dpr > .8) { dpr = Math.max(.75, dpr - .35); dirty = true; slow = 0; }
    return pc.T;
  }
  resize();
  new ResizeObserver(() => { dirty = true; }).observe(stage);
  // Draw every piece once behind the loading screen so scrolling never stalls on a shader compile.
  for (const q of [.95, .73, .55, .37, 0]) { update(q, 0, 0); await step(80 + Math.round((1 - q) * 18)); }
  return { update, touch, tap };
}

/* ---------- input ---------- */
const ndc = (cx, cy) => { const r = stage.getBoundingClientRect(); return [(cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height * 2 - 1)]; };
function moved(cx, cy) {
  const [nx, ny] = ndc(cx, cy), dist = Math.hypot(nx - ptr.lastX, ny - ptr.lastY), now = performance.now();
  ptr.nx = nx; ptr.ny = ny;
  if (dist > .015 || now - ptr.lastT > 70) { ptr.lastX = nx; ptr.lastY = ny; ptr.lastT = now; if (app) app.touch(nx, ny, clamp(.3 + dist * 6, .3, 1)); }
}
addEventListener('mousemove', e => moved(e.clientX, e.clientY), { passive: true });
addEventListener('touchstart', e => { const t = e.touches[0]; if (t) moved(t.clientX, t.clientY); }, { passive: true });
addEventListener('touchmove', e => { const t = e.touches[0]; if (t) moved(t.clientX, t.clientY); }, { passive: true });
stage.addEventListener('click', e => { if (app && !e.target.closest('button, a, .mail__addr')) app.tap(...ndc(e.clientX, e.clientY)); });

/* ---------- run ---------- */
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  time += dt * (reduced ? .4 : 1);
  const target = readP();
  p += (target - p) * (1 - Math.exp(-dt * (reduced ? 40 : 4.5)));
  if (Math.abs(target - p) < 2e-5) p = target;
  ptr.x += (ptr.nx - ptr.x) * (1 - Math.exp(-dt * 3)); ptr.y += (ptr.ny - ptr.y) * (1 - Math.exp(-dt * 3));
  hud(p, app ? app.update(p, time, dt) : DEFS[clamp(Math.round(camX(p) / SP), 0, DEFS.length - 1)].temp(p));
}
const step = n => {
  bootPct.textContent = String(Math.min(100, n)).padStart(3, '0');
  return new Promise(res => { const t = setTimeout(res, 80); requestAnimationFrame(() => { clearTimeout(t); res(); }); });
};
(async () => {
  hud(0, 1250);
  try { app = await build(step); }
  catch (err) { console.warn('Scene unavailable:', err); document.documentElement.classList.add('no-gl'); }
  await step(100);
  boot.classList.add('is-done');
  p = readP(); last = performance.now();
  requestAnimationFrame(tick);
})();
