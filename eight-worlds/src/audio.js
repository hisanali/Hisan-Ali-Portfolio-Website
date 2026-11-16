// Soundscape: looping field recordings mixed by weather, positional sources (HRTF), timed one-shots,
// thunder delayed by distance, and a few synthesised voices (ice, deep rumble) where no recording exists.
import * as THREE from 'three';
import { clamp, damp, lerp, smooth, rng } from './core.js';

const THUNDER = [[0.3, 9.5], [20.4, 11], [40.2, 18]]; // claps inside thunder.mp3 (start, length)

class Loop { // seamless loop built from overlapping, cross-faded plays of one buffer
  constructor(S, buf, out) { this.S = S; this.buf = buf; this.g = S.ctx.createGain(); this.g.gain.value = 0; this.g.connect(out); this.t = 0; this.live = true; this.srcs = []; this.next = 0; this.x = 2.2; this._plan(true); }
  _plan(first) {
    if (!this.live) return; const c = this.S.ctx, len = this.buf.duration - 0.15, x = Math.min(this.x, len / 3);
    const now = c.currentTime; if (first) this.next = now + 0.05;
    while (this.next < now + 4) {
      const s = c.createBufferSource(); s.buffer = this.buf; const eg = c.createGain(); s.connect(eg); eg.connect(this.g);
      const off = first ? Math.random() * (len - x * 2) : 0.05; const dur = len - off; first = false;
      eg.gain.setValueAtTime(0, this.next); eg.gain.linearRampToValueAtTime(1, this.next + x); eg.gain.setValueAtTime(1, this.next + dur - x); eg.gain.linearRampToValueAtTime(0, this.next + dur);
      s.start(this.next, off, dur + 0.05); this.srcs.push(s); s.onended = () => { const i = this.srcs.indexOf(s); if (i >= 0) this.srcs.splice(i, 1); eg.disconnect(); };
      this.next += dur - x;
    }
    this.timer = setTimeout(() => this._plan(false), 1500);
  }
  set(v, dt) { this.t = v; const c = this.S.ctx; this.g.gain.setTargetAtTime(v, c.currentTime, 0.35); }
  stop(fade = 1.2) { this.live = false; clearTimeout(this.timer); const c = this.S.ctx; this.g.gain.setTargetAtTime(0, c.currentTime, fade / 3); setTimeout(() => { for (const s of this.srcs) try { s.stop(); } catch (e) { /* already ended */ } this.g.disconnect(); }, fade * 1000 + 300); }
}

export class Sound {
  constructor(app) { this.app = app; this.ctx = null; this.buffers = new Map(); this.loops = new Map(); this.points = []; this.shots = []; this.volume = 0.8; this.muted = false; this.world = null; this.rnd = rng(31); this.off = new URLSearchParams(location.search).has('nosound'); this.levels = {}; }
  start() {
    if (this.ctx || this.off) { this.ctx?.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) { this.off = true; return; }
    const c = this.ctx = new C();
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : this.volume;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    this.master.connect(comp); comp.connect(c.destination);
    this.bed = c.createGain(); this.bed.connect(this.master);
    // a light shared reverb tail for distant thunder and ice
    this.wet = c.createConvolver(); this.wet.buffer = this._impulse(3.2); const wg = c.createGain(); wg.gain.value = 0.5; this.wet.connect(wg); wg.connect(this.master);
    if (this.world) this._build(this.world);
  }
  _impulse(sec) { const c = this.ctx, n = c.sampleRate * sec | 0, b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += ((Math.random() * 2 - 1) - lp) * (0.5 - 0.42 * t); d[i] = lp * Math.pow(1 - t, 2.6); } } return b; }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.08); }
  setMuted(m) { this.muted = m; this.setVolume(this.volume); }
  async load(name) {
    if (this.buffers.has(name)) return this.buffers.get(name);
    const p = (async () => { try { const a = await (await fetch('assets/audio/' + name + '.mp3')).arrayBuffer(); return await this.ctx.decodeAudioData(a); } catch (e) { console.warn('audio failed', name, e); return null; } })();
    this.buffers.set(name, p); return p;
  }
  enter(world) { this.world = world; if (this.ctx) this._build(world); }
  leave() {
    for (const l of this.loops.values()) l.stop(0.8); this.loops.clear();
    for (const p of this.points) { p.loop?.stop(0.8); p.syn?.stop?.(); setTimeout(() => p.pan.disconnect(), 1500); } this.points = []; this.shots = []; this.world = null;
  }
  async _build(world) {
    const a = world.audio || {}; const token = this.token = {};
    const names = new Set(['wind', 'gale', 'rain_light', 'rain_heavy', 'thunder', ...(a.beds || [])]);
    for (const p of a.points || []) if (p.file) names.add(p.file);
    for (const s of a.shots || []) for (const f of s.files) names.add(f);
    await Promise.all([...names].map((n) => this.load(n)));
    if (this.token !== token || this.world !== world) return;
    for (const n of ['wind', 'gale', 'rain_light', 'rain_heavy', ...(a.beds || [])]) { const b = await this.buffers.get(n); if (b && !this.loops.has(n)) this.loops.set(n, new Loop(this, b, this.bed)); }
    for (const p of a.points || []) {
      const pan = this.ctx.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = p.ref ?? 8; pan.rolloffFactor = p.roll ?? 1; pan.maxDistance = 10000; pan.connect(this.master);
      const o = { def: p, pan }; if (p.file) { const b = await this.buffers.get(p.file); if (b) o.loop = new Loop(this, b, pan); } else if (p.synth === 'rumble') o.syn = this._rumble(pan);
      this.points.push(o);
    }
    this.shots = (a.shots || []).map((s) => ({ def: s, t: s.every[0] * this.rnd() }));
  }
  _rumble(out) { // deep continuous rumble: filtered noise with slow swell
    const c = this.ctx, n = c.sampleRate * 6, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let v = 0;
    for (let i = 0; i < n; i++) { v += (Math.random() * 2 - 1) * 0.02; v *= 0.997; d[i] = v * 6 * (0.7 + 0.3 * Math.sin(i / n * Math.PI * 2 * 3)); }
    for (let i = 0; i < 4000; i++) { const k = i / 4000; d[i] = d[i] * k + d[n - 4000 + i] * (1 - k); }
    const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.loopEnd = (n - 4000) / c.sampleRate; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 110; const g = c.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(out); s.start(); return { g, set: (v2) => g.gain.setTargetAtTime(v2, c.currentTime, 0.4), stop: () => { g.gain.setTargetAtTime(0, c.currentTime, 0.3); setTimeout(() => { try { s.stop(); } catch (e) { /* ended */ } }, 1500); } };
  }
  // one-shot recording at a world position
  async play(name, pos, { gain = 1, rate = 1, ref = 12, offset = 0, dur = null, delay = 0, lowpass = 0, wet = 0 } = {}) {
    if (!this.ctx || this.ctx.state !== 'running') return; const b = await this.load(name); if (!b) return; const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; const g = c.createGain(); const t0 = c.currentTime + delay; const len = dur ?? (b.duration - offset);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.06); g.gain.setValueAtTime(gain, t0 + Math.max(len / rate - 0.8, 0.1)); g.gain.linearRampToValueAtTime(0, t0 + len / rate);
    let node = s; if (lowpass) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; s.connect(f); node = f; }
    node.connect(g);
    if (pos) { const pan = c.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = ref; pan.rolloffFactor = 1; pan.positionX.value = pos[0]; pan.positionY.value = pos[1]; pan.positionZ.value = pos[2]; g.connect(pan); pan.connect(this.master); if (wet) { const w = c.createGain(); w.gain.value = wet; pan.connect(w); w.connect(this.wet); } s.onended = () => pan.disconnect(); }
    else { g.connect(this.master); if (wet) { const w = c.createGain(); w.gain.value = wet; g.connect(w); w.connect(this.wet); } }
    s.start(t0, offset, len);
  }
  thunder(dist, az) {
    const cam = this.app.camera.position; const seg = THUNDER[(this.rnd() * 3) | 0];
    const near = clamp(1 - dist / 7500); const pos = [cam.x + Math.cos(az) * 60, cam.y + 25, cam.z + Math.sin(az) * 60];
    this.play('thunder', pos, { gain: 0.5 + 1.6 * near * near, offset: seg[0], dur: seg[1], delay: dist / 343, lowpass: lerp(500, 9000, near * near), ref: 60, rate: lerp(0.82, 1.0, near), wet: 0.5 });
  }
  // synthesised ice voice: a sharp crack followed by a falling resonant groan
  ice(pos, power = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return; const c = this.ctx, t = c.currentTime + 0.02;
    const pan = c.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 40; pan.positionX.value = pos[0]; pan.positionY.value = pos[1]; pan.positionZ.value = pos[2]; pan.connect(this.master);
    const w = c.createGain(); w.gain.value = 0.9; pan.connect(w); w.connect(this.wet);
    const n = c.sampleRate * 0.5 | 0, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) { const k = i / n; d[i] = (Math.random() * 2 - 1) * Math.exp(-k * (14 + 30 * Math.random() * (k < 0.05 ? 0 : 1))) * (Math.random() < 0.004 ? 3 : 1); }
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = 0.6 + this.rnd() * 0.5; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(2600, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.45); bp.Q.value = 1.2;
    const g = c.createGain(); g.gain.value = 1.4 * power; s.connect(bp); bp.connect(g); g.connect(pan); s.start(t);
    const o = c.createOscillator(); o.type = 'sawtooth'; const f0 = 70 + this.rnd() * 60; o.frequency.setValueAtTime(f0, t + 0.05); o.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 2.4);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 7; const og = c.createGain(); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.5 * power, t + 0.15); og.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
    o.connect(lp); lp.connect(og); og.connect(pan); o.start(t); o.stop(t + 2.8); setTimeout(() => pan.disconnect(), 6500);
  }
  update(dt, cam, env, world) {
    if (!this.ctx || this.ctx.state !== 'running' || !world) return; const c = this.ctx, L = c.listener, p = cam.position;
    cam.getWorldDirection(_f); const e = cam.matrixWorld.elements;
    if (L.positionX) { const t = c.currentTime; L.positionX.setTargetAtTime(p.x, t, 0.03); L.positionY.setTargetAtTime(p.y, t, 0.03); L.positionZ.setTargetAtTime(p.z, t, 0.03); L.forwardX.setTargetAtTime(_f.x, t, 0.03); L.forwardY.setTargetAtTime(_f.y, t, 0.03); L.forwardZ.setTargetAtTime(_f.z, t, 0.03); L.upX.setTargetAtTime(e[4], t, 0.03); L.upY.setTargetAtTime(e[5], t, 0.03); L.upZ.setTargetAtTime(e[6], t, 0.03); }
    else { L.setPosition(p.x, p.y, p.z); L.setOrientation(_f.x, _f.y, _f.z, e[4], e[5], e[6]); }
    const a = world.audio || {}; const w = env.windNow, sh = a.shelter ?? 0;
    const mix = { wind: (0.05 + 0.75 * Math.pow(clamp(w), 1.25)) * (1 - sh * 0.7), gale: smooth(0.5, 1.05, w) * 0.85 * (1 - sh * 0.5), rain_light: smooth(0.02, 0.5, env.precipRain) * (1 - smooth(0.6, 1, env.precipRain) * 0.5) * 0.8, rain_heavy: smooth(0.45, 1, env.precipRain) * 0.9 };
    if (a.mix) Object.assign(mix, a.mix(env, cam, world));
    for (const [n, l] of this.loops) { const v = clamp(mix[n] ?? 0, 0, 2); l.set(v); this.levels[n] = v; }
    for (const o of this.points) { const d = o.def; const q = typeof d.pos === 'function' ? d.pos(_p) : d.pos; o.pan.positionX.setTargetAtTime(q[0], c.currentTime, 0.05); o.pan.positionY.setTargetAtTime(q[1], c.currentTime, 0.05); o.pan.positionZ.setTargetAtTime(q[2], c.currentTime, 0.05); const g = typeof d.gain === 'function' ? d.gain(env, world) : (d.gain ?? 1); o.loop?.set(g); o.syn?.set(g); }
    for (const s of this.shots) { s.t -= dt; if (s.t <= 0) { const d = s.def; s.t = lerp(d.every[0], d.every[1], this.rnd()); if (d.when && !d.when(env, world)) continue; const f = d.files[(this.rnd() * d.files.length) | 0]; const ang = this.rnd() * 6.283, r = lerp(d.dist?.[0] ?? 20, d.dist?.[1] ?? 80, this.rnd()); const pos = d.pos ? d.pos() : [p.x + Math.cos(ang) * r, p.y + (d.height ?? 6), p.z + Math.sin(ang) * r];
      if (d.synth === 'ice') this.ice(pos, d.gain ?? 1); else this.play(f, pos, { gain: (d.gain ?? 0.6) * (0.7 + 0.6 * this.rnd()), rate: 0.94 + this.rnd() * 0.12, ref: d.ref ?? 15, offset: d.slice ? this.rnd() * d.slice[0] : 0, dur: d.slice ? d.slice[1] : null, wet: d.wet ?? 0.15 }); } }
  }
}
const _f = new THREE.Vector3(); const _p = [0, 0, 0];
