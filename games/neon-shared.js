// Shared helpers for the neon 3D games: renderer with bloom, overlays, HUD, sound and persistence.
import * as THREE from '/evermile/vendor/three.module.js';
import { EffectComposer } from '/evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '/evermile/vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/evermile/vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/evermile/vendor/postprocessing/OutputPass.js';
export { THREE };
export const $ = s => document.querySelector(s);
export function makeRenderer(canvas, { bloom = 1.1, radius = 0.6, threshold = 0.2, fov = 60, near = 0.1, far = 400 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloom, radius, threshold);
  composer.addPass(bloomPass); composer.addPass(new OutputPass());
  const resize = () => { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize); resize();
  return { renderer, scene, camera, composer, bloomPass, resize };
}
export function starfield(scene, { count = 1400, radius = 160, size = 0.9, color = 0xaad4ff } = {}) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { const r = radius * (0.6 + Math.random() * 0.4), t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1); pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t); pos[i * 3 + 2] = r * Math.cos(p); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color, size, map: softDot(), sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false });
  const pts = new THREE.Points(g, m); scene.add(pts); return pts;
}
export function glowMat(hex, intensity = 2.2) { return new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: intensity, roughness: 0.35, metalness: 0.2 }); }
let dotTex = null;
function softDot() {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); dotTex = new THREE.CanvasTexture(c); return dotTex;
}
export class Particles {
  constructor(scene, max = 600, color = 0xffffff, size = 0.35) {
    this.max = max; this.n = 0; this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.col = new Float32Array(max * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const m = new THREE.PointsMaterial({ size, map: softDot(), vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false; scene.add(this.points); this.g = g; this.tmp = new THREE.Color(color);
  }
  burst(x, y, z, count, hex, speed = 6, life = 0.8) {
    this.tmp.set(hex);
    for (let k = 0; k < count; k++) { const i = this.n % this.max; this.n++; this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), s = speed * (0.3 + Math.random()); this.vel[i * 3] = s * Math.sin(p) * Math.cos(t); this.vel[i * 3 + 1] = s * Math.sin(p) * Math.sin(t); this.vel[i * 3 + 2] = s * Math.cos(p); this.life[i] = life * (0.6 + Math.random() * 0.6); this.col[i * 3] = this.tmp.r; this.col[i * 3 + 1] = this.tmp.g; this.col[i * 3 + 2] = this.tmp.b; }
  }
  update(dt, drag = 0.98, gravity = 0) {
    for (let i = 0; i < this.max; i++) { if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; } this.life[i] -= dt; this.vel[i * 3] *= drag; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * drag - gravity * dt; this.vel[i * 3 + 2] *= drag; this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt; const f = Math.min(1, this.life[i] * 2); this.col[i * 3] *= 0.97 + 0.03 * f; this.col[i * 3 + 1] *= 0.97 + 0.03 * f; this.col[i * 3 + 2] *= 0.97 + 0.03 * f; }
    this.g.attributes.position.needsUpdate = true; this.g.attributes.color.needsUpdate = true;
  }
}
export class Sound {
  constructor(key) { this.key = key; this.on = localStorage.getItem(key + ':sound') !== 'off'; this.ctx = null; document.body.classList.toggle('is-sound', this.on); }
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
  toggle() { this.on = !this.on; localStorage.setItem(this.key + ':sound', this.on ? 'on' : 'off'); document.body.classList.toggle('is-sound', this.on); if (this.on) this.ensure(); }
  play(freq = 440, dur = 0.08, type = 'sine', gain = 0.12, slide = 0) {
    if (!this.on) return; this.ensure(); if (!this.ctx) return; const t = this.ctx.currentTime; const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
}
export function ui(key) {
  const toastEl = $('#toast'), banner = $('#banner'), hint = $('#hint'), hud = $('#hud'), flash = $('#flash');
  let toastT; const toast = msg => { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1600); };
  let bannerT; const showBanner = (msg, ms = 900) => { banner.textContent = msg; banner.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => banner.classList.remove('show'), ms); };
  const setHint = t => { hint.textContent = t; };
  const setHud = items => { hud.hidden = !items; if (!items) return; hud.innerHTML = items.map(([l, v, cls]) => `<div><small>${l}</small><b class="${cls || ''}">${v}</b></div>`).join(''); };
  const doFlash = () => { flash.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.remove('on'))); };
  const best = { get: () => Number(localStorage.getItem(key + ':best') || 0), set: v => localStorage.setItem(key + ':best', String(v)) };
  $('#btn-full').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => {}); });
  return { toast, showBanner, setHint, setHud, doFlash, best };
}
export function seg(el, values, initial, onChange) {
  el.innerHTML = values.map(v => `<button type="button" data-value="${v.value}">${v.label}</button>`).join('');
  let current = initial; const paint = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b.dataset.value === current));
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; current = b.dataset.value; paint(); onChange?.(current); }); paint();
  return () => current;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
