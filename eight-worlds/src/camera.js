// Camera rig: free exploration (walk / fly), orbit around points of interest, and cinematic tours.
// Every mode ends with the same collision pass so the lens never enters terrain, water or solid objects.
import * as THREE from 'three';
import { clamp, lerp, damp, smooth } from './core.js';

const V = () => new THREE.Vector3();
const _a = V(), _b = V(), _c = V(), _f = V(), _r = V();

// --- shot builders for tours ---
export const shots = {
  orbit: (c, { r0 = 40, r1 = r0, a0 = 0, a1 = a0 + 1, h0 = 8, h1 = h0, dur = 14, fov = 45, lookY = 0, agl = false }) => ({
    dur, fov, agl,
    at: (k, o) => { const a = lerp(a0, a1, k), r = lerp(r0, r1, k); const cc = typeof c === 'function' ? c(_c) : _c.set(c[0], c[1], c[2]); return o.set(cc.x + Math.cos(a) * r, cc.y + lerp(h0, h1, k), cc.z + Math.sin(a) * r); },
    look: (k, o) => { const cc = typeof c === 'function' ? c(_c) : _c.set(c[0], c[1], c[2]); return o.set(cc.x, cc.y + lookY, cc.z); },
  }),
  dolly: (p0, p1, l0, l1, { dur = 14, fov = 50, agl = false, fov1 = fov } = {}) => ({
    dur, fov, fov1, agl,
    at: (k, o) => o.set(lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), lerp(p0[2], p1[2], k)),
    look: (k, o) => o.set(lerp(l0[0], l1[0], k), lerp(l0[1], l1[1], k), lerp(l0[2], l1[2], k)),
  }),
  path: (pts, { dur = 18, fov = 55, agl = true, lookAhead = 0.08, lookDown = 0, look = null } = {}) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    return { dur, fov, agl, at: (k, o) => curve.getPoint(clamp(k), o), look: (k, o) => { if (look) return o.set(look[0], look[1], look[2]); curve.getPoint(clamp(k + lookAhead), o); o.y -= lookDown; return o; }, lookAgl: !look };
  },
};

export class Rig {
  constructor(app) {
    this.app = app; this.cam = app.camera; this.dom = app.renderer.domElement;
    this.mode = 'orbit'; this.walk = true;
    this.pos = V().set(0, 10, 30); this.yaw = 0; this.pitch = 0; this.vel = V(); this.eye = 1.7; this.fov = 55;
    this.keys = new Set(); this.orbit = { az: 0.6, el: 0.25, dist: 60, azV: 0, elV: 0, idle: 9, poi: 0, tgt: V(), cur: V() };
    this.tour = { i: 0, t: 0, fade: 1 }; this.locked = false; this.dragging = false; this.onMode = null; this.onPoi = null;
    this.shake = 0;
    const dom = this.dom;
    addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; this.keys.add(e.code); this._key(e); });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    dom.addEventListener('mousedown', (e) => { if (e.button !== 0) return; this.dragging = true; this._interact(); if (this.mode === 'explore' && !this.app.noLock) dom.requestPointerLock?.(); });
    addEventListener('mouseup', () => { this.dragging = false; });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === dom; });
    addEventListener('mousemove', (e) => { if (this.locked || this.dragging) this._look(e.movementX, e.movementY); });
    dom.addEventListener('wheel', (e) => { e.preventDefault(); this._interact(); if (this.mode === 'orbit') { const p = this.poi(); this.orbit.dist = clamp(this.orbit.dist * Math.exp(e.deltaY * 0.0012), p.min ?? 3, p.max ?? 4000); } else if (this.mode === 'explore') this.fov = clamp(this.fov + e.deltaY * 0.02, 20, 80); }, { passive: false });
    // touch: one finger looks, two fingers move / zoom
    let tp = null, pinch = 0;
    dom.addEventListener('touchstart', (e) => { this._interact(); if (e.touches.length === 1) tp = [e.touches[0].clientX, e.touches[0].clientY]; if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    dom.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && tp) { this._look((e.touches[0].clientX - tp[0]) * 1.6, (e.touches[0].clientY - tp[1]) * 1.6); tp = [e.touches[0].clientX, e.touches[0].clientY]; }
      else if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (this.mode === 'orbit') this.orbit.dist = clamp(this.orbit.dist * pinch / d, this.poi().min ?? 3, this.poi().max ?? 4000); else this.touchMove = clamp((d - pinch) / 60, -1, 1); if (this.mode === 'orbit') pinch = d; }
    }, { passive: false });
    dom.addEventListener('touchend', () => { tp = null; this.touchMove = 0; }, { passive: true });
  }
  get world() { return this.app.world; }
  poi() { const p = this.world?.pois || []; return p[this.orbit.poi % Math.max(p.length, 1)] || { pos: [0, 5, 0], dist: 50 }; }
  _interact() { this.orbit.idle = 0; if (this.mode === 'tour') this.setMode('orbit', true); }
  _key(e) {
    if (e.code === 'KeyF') { this.walk = !this.walk; this.app.ui?.toast(this.walk ? 'Walking' : 'Flying'); }
    if (this.mode === 'tour' && ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) this.setMode('explore');
    if (this.mode === 'orbit' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) this.nextPoi(e.code === 'ArrowRight' ? 1 : -1);
  }
  _look(dx, dy) {
    this.orbit.idle = 0;
    if (this.mode === 'explore') { this.yaw -= dx * 0.0022; this.pitch = clamp(this.pitch - dy * 0.0022, -1.5, 1.5); }
    else if (this.mode === 'orbit') { this.orbit.azV += dx * 0.0035; this.orbit.elV += dy * 0.003; }
  }
  nextPoi(d = 1) { const n = (this.world?.pois || []).length || 1; this.orbit.poi = (this.orbit.poi + d + n) % n; this._enterPoi(); }
  _enterPoi(snap = false) { const p = this.poi(); const o = this.orbit; o.dist = p.dist ?? 50; if (p.az != null) o.az = p.az; o.el = p.el ?? 0.22; o.idle = 9; if (snap) this._poiPos(o.cur); this.onPoi?.(p); }
  _poiPos(out) { const p = this.poi(); if (typeof p.pos === 'function') return p.pos(out); return out.set(p.pos[0], p.pos[1], p.pos[2]); }
  setMode(m, keep = false) {
    if (m === this.mode && !keep) return; const prev = this.mode; this.mode = m;
    if (m === 'explore') {
      this.cam.getWorldDirection(_f); this.yaw = Math.atan2(-_f.x, -_f.z); this.pitch = Math.asin(clamp(_f.y, -1, 1)); this.pos.copy(this.cam.position); this.vel.set(0, 0, 0);
      if (prev !== 'explore' && this.world?.spawn && !keep) { const s = this.world.spawn; this.pos.set(s.pos[0], s.pos[1], s.pos[2]); this.yaw = s.yaw ?? 0; this.pitch = s.pitch ?? 0; }
    } else if (m === 'orbit') {
      // continue from wherever the camera is
      this._poiPos(_a); _b.copy(this.cam.position).sub(_a); const o = this.orbit; const d = _b.length();
      if (keep || prev === 'tour') { o.dist = clamp(d, this.poi().min ?? 3, this.poi().max ?? 4000); o.az = Math.atan2(_b.z, _b.x); o.el = Math.asin(clamp(_b.y / Math.max(d, 1e-3), -1, 1)); o.cur.copy(_a); } else this._enterPoi(true);
      document.exitPointerLock?.();
    } else if (m === 'tour') { this.tour.i = 0; this.tour.t = 0; document.exitPointerLock?.(); }
    this.onMode?.(m);
  }
  reset() { // called when a world is entered
    this.orbit.poi = 0; this.walk = this.world.walkDefault !== false; this.eye = this.world.eye || 1.7;
    const s = this.world.spawn; if (s) { this.pos.set(s.pos[0], s.pos[1], s.pos[2]); this.yaw = s.yaw ?? 0; this.pitch = s.pitch ?? 0; }
    this.tour.i = 0; this.tour.t = 0; this._enterPoi(true); this.fov = 55;
    if (this.mode === 'explore') this.cam.position.copy(this.pos);
  }
  // push a point out of everything solid; returns true when it had to move
  resolve(p, radius = 0.35, minClear = 0.3) {
    const w = this.world; if (!w) return;
    for (let i = 0; i < 2; i++) w.collide?.(p, radius);
    const g = w.ground?.(p.x, p.z); if (g != null && p.y < g + minClear) p.y = g + minClear;
    const wl = w.waterAt?.(p.x, p.z); if (wl != null && p.y < wl + 0.45) p.y = wl + 0.45;
    if (w.bounds) { const b = w.bounds; const d = Math.hypot(p.x, p.z); if (d > b) { p.x *= b / d; p.z *= b / d; } }
    if (w.ceiling && p.y > w.ceiling) p.y = w.ceiling;
  }
  update(dt) {
    const cam = this.cam, w = this.world; if (!w) return;
    let fovT = this.fov;
    if (this.mode === 'explore') {
      const k = this.keys; const run = k.has('ShiftLeft') || k.has('ShiftRight');
      const sp = this.walk ? (run ? 7.5 : 2.6) * (w.walkSpeed || 1) : (run ? 5 : 1) * (w.flySpeed || 16);
      const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + (this.touchMove || 0), s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      const up = (k.has('Space') || k.has('KeyE') ? 1 : 0) - (k.has('KeyC') || k.has('KeyQ') ? 1 : 0);
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), spi = Math.sin(this.pitch);
      _f.set(-sy * (this.walk ? 1 : cp), this.walk ? 0 : spi, -cy * (this.walk ? 1 : cp)); _r.set(cy, 0, -sy);
      _a.set(0, 0, 0).addScaledVector(_f, f).addScaledVector(_r, s); if (!this.walk) _a.y += up; if (_a.lengthSq() > 1) _a.normalize();
      _a.multiplyScalar(sp);
      const tau = this.walk ? 0.12 : 0.35; this.vel.x = damp(this.vel.x, _a.x, tau, dt); this.vel.y = damp(this.vel.y, _a.y, tau, dt); this.vel.z = damp(this.vel.z, _a.z, tau, dt);
      _b.copy(this.pos); this.pos.addScaledVector(this.vel, dt);
      if (this.walk) {
        // do not walk off into deep water or up near-vertical faces
        const g1 = w.ground?.(this.pos.x, this.pos.z), g0 = w.ground?.(_b.x, _b.z);
        if (g1 != null && g0 != null) { const run2 = Math.hypot(this.pos.x - _b.x, this.pos.z - _b.z); if (run2 > 1e-4 && (g1 - g0) / run2 > 1.6) { this.pos.x = _b.x; this.pos.z = _b.z; } }
        const wl = w.waterAt?.(this.pos.x, this.pos.z), g = w.ground?.(this.pos.x, this.pos.z);
        if (g != null) {
          if (wl != null && g < wl - 0.9 && !w.walkOnWater) { this.pos.x = _b.x; this.pos.z = _b.z; }
          const gy = (w.ground(this.pos.x, this.pos.z) ?? g) + this.eye;
          this.pos.y = w.rigidGround ? gy : damp(this.pos.y, gy, 0.08, dt);
        } else this.walk = false;
      }
      this.resolve(this.pos, 0.4, this.walk ? 0.5 : 0.6);
      cam.position.copy(this.pos); cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      // gentle footstep bob
      if (this.walk) { const v = Math.hypot(this.vel.x, this.vel.z); this._bob = (this._bob || 0) + v * dt * 2.1; cam.position.y += Math.sin(this._bob * 2) * 0.025 * Math.min(v / 2.5, 1.5); }
    } else if (this.mode === 'orbit') {
      const o = this.orbit, p = this.poi(); o.idle += dt;
      o.az += o.azV; o.el = clamp(o.el + o.elV, p.minEl ?? -0.05, 1.45); o.azV *= Math.exp(-dt * 9); o.elV *= Math.exp(-dt * 9);
      if (o.idle > 3) o.az += dt * 0.035 * smooth(3, 7, o.idle);
      this._poiPos(o.tgt); o.cur.x = damp(o.cur.x, o.tgt.x, 0.6, dt); o.cur.y = damp(o.cur.y, o.tgt.y, 0.6, dt); o.cur.z = damp(o.cur.z, o.tgt.z, 0.6, dt);
      const ce = Math.cos(o.el); _a.set(o.cur.x + Math.cos(o.az) * ce * o.dist, o.cur.y + Math.sin(o.el) * o.dist, o.cur.z + Math.sin(o.az) * ce * o.dist);
      this.resolve(_a, 0.6, 0.8);
      cam.position.x = damp(cam.position.x, _a.x, 0.1, dt); cam.position.y = damp(cam.position.y, _a.y, 0.1, dt); cam.position.z = damp(cam.position.z, _a.z, 0.1, dt);
      this.resolve(cam.position, 0.5, 0.5);
      cam.lookAt(o.cur); fovT = p.fov ?? 48;
    } else if (this.mode === 'tour') {
      const T = this.tour, list = w.tours || []; if (!list.length) { this.setMode('orbit'); return; }
      const sh = list[T.i % list.length]; T.t += dt; const k = clamp(T.t / sh.dur);
      const e = k; // linear along the path; easing lives in the fade
      sh.at(e, _a); if (sh.agl) { const g = w.ground?.(_a.x, _a.z); const wl = w.waterAt?.(_a.x, _a.z); _a.y += Math.max(g ?? -1e9, wl ?? -1e9, -1e8) > -1e8 ? Math.max(g ?? -1e9, wl ?? -1e9) : 0; }
      sh.look(e, _b); if (sh.agl && sh.lookAgl) { const g = w.ground?.(_b.x, _b.z); const wl = w.waterAt?.(_b.x, _b.z); const m = Math.max(g ?? -1e9, wl ?? -1e9); if (m > -1e8) _b.y += m; }
      this.resolve(_a, 0.6, 0.7);
      if (T.t < 0.05 || T.snap) { cam.position.copy(_a); T.snap = false; this._tl = this._tl || V(); this._tl.copy(_b); }
      cam.position.x = damp(cam.position.x, _a.x, 0.25, dt); cam.position.y = damp(cam.position.y, _a.y, 0.4, dt); cam.position.z = damp(cam.position.z, _a.z, 0.25, dt);
      this._tl = this._tl || V().copy(_b); this._tl.x = damp(this._tl.x, _b.x, 0.3, dt); this._tl.y = damp(this._tl.y, _b.y, 0.3, dt); this._tl.z = damp(this._tl.z, _b.z, 0.3, dt);
      this.resolve(cam.position, 0.5, 0.5);
      cam.lookAt(this._tl); fovT = lerp(sh.fov, sh.fov1 ?? sh.fov, k);
      T.fade = Math.min(smooth(0, 1.1, T.t), smooth(sh.dur, sh.dur - 1.1, T.t));
      if (T.t >= sh.dur) { T.i = (T.i + 1) % list.length; T.t = 0; T.snap = true; }
    }
    const fadeT = this.mode === 'tour' ? this.tour.fade : 1; this.fade = damp(this.fade ?? 1, fadeT, 0.05, dt);
    if (Math.abs(cam.fov - fovT) > 0.01) { cam.fov = this.mode === 'tour' ? fovT : damp(cam.fov, fovT, 0.25, dt); cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
  }
}
