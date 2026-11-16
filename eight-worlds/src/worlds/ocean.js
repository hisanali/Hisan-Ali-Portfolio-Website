// Open ocean: the brig sails on a fixed heading while the sea scrolls beneath it.
import * as THREE from 'three';
import { clamp, lerp, damp, smooth, rng } from '../core.js';
import { Ocean } from '../ocean.js';
import { buildShip, SHIP, halfBeam, deckY } from '../ship.js';
import { shots } from '../camera.js';

export default {
  defaults: { time: 'day', weather: 'fair', lat: 38, decl: 14, north: 2.3, windAngle: 0.05, ground: [0.02, 0.06, 0.09], sky: { cloudBase: 1100, cloudThick: 1500, cirrus: 0.45 } },
  async create(app) {
    const group = new THREE.Group(); const env = app.env, fx = app.fx; const r = rng(12);
    const ocean = new Ocean(app, { seaDir: 0.25, scale: 1, wake: true, planar: true, deep: [0.008, 0.045, 0.075], scatter: [0.04, 0.4, 0.36], foam: 0.3 });
    group.add(ocean.group);
    const ship = buildShip(app); group.add(ship.group);
    const st = { heave: 0, pitch: 0, roll: 0, vh: 0, vp: 0, vr: 0, speed: 3, heel: 0, yaw: 0, sprayT: 0, lastBow: 0 };
    const m4 = new THREE.Matrix4(), inv = new THREE.Matrix4(), v = new THREE.Vector3(), v2 = new THREE.Vector3(), col = new THREE.Color();
    const toLocal = (p, out) => out.copy(p).applyMatrix4(inv), toWorld = (p, out) => out.copy(p).applyMatrix4(ship.group.matrixWorld);
    const deckWorldY = (x, z) => { // world height of the deck under a world xz
      v.set(x, st.heave + SHIP.deck, z); toLocal(v, v2); if (v2.x < SHIP.stern + 0.4 || v2.x > SHIP.bow - 1.2 || Math.abs(v2.z) > halfBeam(v2.x) - 0.45) return null;
      v2.y = deckY(v2.x) + 0.08; toWorld(v2, v); return v.y;
    };
    const wakeStep = (dt, dx) => { const s = st.speed, f = dt * 30 * clamp(s / 4, 0.2, 1.4);
      for (const sg of [1, -1]) { ocean.stamp(14.4, sg * 0.5, 0.4, sg * (0.9 + s * 0.3), 0.07 * f, 3.5, 3.2); ocean.stamp(10 + r() * 4, sg * (2.3 + r() * 0.8), -0.4, sg * (0.4 + s * 0.12), 0.045 * f, 3.5, 2.6); if (r() < 0.5) ocean.stamp(lerp(-13, 7, r()), sg * (3.5 + r() * 0.4), 0, sg * 0.2, 0.04 * f, 3, 1.8); }
      ocean.stamp(-15.5 - r() * 2, (r() - 0.5) * 4.2, -0.3, (r() - 0.5) * 0.7, 0.09 * f, 5, 1.8);
      ocean._updateWake(dt, dx, 0); };
    for (let i = 0; i < 260; i++) wakeStep(0.1, 0.4);
    const world = {
      group, ocean, shadowRange: 46, flySpeed: 14, eye: 1.68, rigidGround: true, bounds: 2500, ceiling: 900,
      spawn: { pos: [-12.6, 6, 2.3], yaw: -Math.PI / 2 + 0.1, pitch: 0.08 },
      pois: [
        { name: 'The brig', pos: (o) => o.set(0, 9 + st.heave, 0), dist: 62, el: 0.12, az: 2.2, min: 14, max: 900 },
        { name: 'Quarterdeck', pos: (o) => toWorld(v2.set(-9, deckY(-9) + 1.6, 0), o), dist: 7.5, el: 0.25, az: 3.3, min: 3.5, max: 40, fov: 58 },
        { name: 'Foretop', pos: (o) => toWorld(v2.set(6.2, deckY(6.2) + 13, 0), o), dist: 16, el: 0.3, az: 0.6, min: 5, max: 80 },
        { name: 'Bow wave', pos: (o) => o.set(15, 1.5 + st.heave * 0.5, 0), dist: 15, el: 0.08, az: -0.5, min: 6, max: 80 },
        { name: 'Wake', pos: (o) => o.set(-30, 1, 0), dist: 34, el: 0.2, az: 3.5, min: 8, max: 200 },
      ],
      tours: [
        shots.orbit([0, 7, 0], { r0: 78, r1: 52, a0: 2.5, a1: 1.5, h0: 4, h1: 9, dur: 20, fov: 38 }),
        shots.dolly([26, 2.2, -9], [19, 3.2, -5.5], [10, 5, 0], [4, 9, 0], { dur: 14, fov: 50 }),
        shots.dolly([-12, 5.4, 1.2], [3, 5.6, 1.6], [10, 9, 0], [14, 14, -1], { dur: 15, fov: 62 }),
        shots.orbit([0, 20, 0], { r0: 20, r1: 34, a0: -1.2, a1: 0.1, h0: 14, h1: 22, dur: 16, fov: 55, lookY: -12 }),
        shots.dolly([-62, 3, 16], [-40, 6, 5], [0, 10, 0], [0, 12, 0], { dur: 15, fov: 32 }),
      ],
      ground: (x, z) => deckWorldY(x, z),
      waterAt: (x, z) => ocean.heightAt(x, z),
      collide(p, rad) {
        toLocal(p, v); const hb = halfBeam(v.x); if (v.x < SHIP.stern - 0.6 || v.x > SHIP.bow + 0.3 || hb <= 0) return;
        const top = deckY(v.x) + SHIP.rail + 0.15; let moved = false;
        if (v.y < top + rad && Math.abs(v.z) < hb + rad && v.y > -SHIP.draft - 1) {
          const onDeck = Math.abs(v.z) < hb - 0.35 && v.y > deckY(v.x) - 0.2 && v.x > SHIP.stern + 0.3;
          if (onDeck) { // keep inside the bulwarks, off the furniture
            const lim = hb - 0.55; if (Math.abs(v.z) > lim) { v.z = Math.sign(v.z) * lim; moved = true; }
            for (const c of ship.colliders) { const dx = v.x - c.x, dz = v.z - c.z; if (Math.abs(dx) < c.hx + rad && Math.abs(dz) < c.hz + rad && v.y < deckY(c.x) + c.h + rad + 1.4) { if (c.hx + rad - Math.abs(dx) < c.hz + rad - Math.abs(dz)) v.x = c.x + Math.sign(dx || 1) * (c.hx + rad); else v.z = c.z + Math.sign(dz || 1) * (c.hz + rad); moved = true; } }
          } else { // outside: slide along the hull side or lift over the rail, whichever is nearer
            const side = hb + rad - Math.abs(v.z), up = top + rad - v.y;
            if (up < side) v.y = top + rad; else v.z = Math.sign(v.z || 1) * (hb + rad); moved = true;
          }
        }
        for (const m of ship.masts) { const dx = v.x - m.x, dz = v.z; const d = Math.hypot(dx, dz), rr = 0.42 + rad; if (d < rr && v.y < deckY(m.x) + m.h * 0.5 && v.y > 0) { const k = rr / Math.max(d, 1e-3); v.x = m.x + dx * k; v.z = dz * k; moved = true; } }
        if (moved) toWorld(v, p);
      },
      audio: {
        beds: ['waves', 'sailboat', 'rowing'],
        mix: (e) => ({ waves: 0.42 + 0.5 * clamp(e.windNow), sailboat: 0.9 + 0.8 * clamp(e.windNow), rowing: 0.12 + 0.2 * clamp(st.speed / 5), wind: 0.16 + 0.8 * Math.pow(clamp(e.windNow), 1.2) }),
        points: [{ file: 'waves', pos: () => [16, 1, 0], gain: () => 0.35 + 0.25 * clamp(st.speed / 4), ref: 6 }],
        shots: [{ files: ['gulls'], every: [28, 70], gain: 0.25, dist: [40, 120], height: 25, when: (e) => e.night < 0.3 && e.w.rain < 0.3, slice: [30, 9] }],
      },
      update(dt, t) {
        ocean.update(dt, app.camera, env);
        // speed follows the wind; the sea scrolls past and the foam trail with it
        const wind = env.windNow; st.speed = damp(st.speed, 1.2 + wind * 5.2, 5, dt);
        const dx = st.speed * dt; ocean.origin.x += dx;
        // buoyancy: sample the surface under bow, stern and both sides
        const hb = ocean.heightAt(11, 0), hs = ocean.heightAt(-11, 0), hp = ocean.heightAt(0, 3.4), hq = ocean.heightAt(0, -3.4), hc = ocean.heightAt(0, 0);
        const tH = (hb + hs + hp + hq + hc * 2) / 6 - 0.15, tP = Math.atan2(hb - hs, 22) * 0.8, tR = Math.atan2(hp - hq, 6.8) * 0.55 + 0.035 + wind * 0.11; // heel to leeward under sail
        const k = 5.5, c = 2.6; st.vh += ((tH - st.heave) * k - st.vh * c) * dt; st.heave += st.vh * dt; st.vp += ((tP - st.pitch) * k * 0.8 - st.vp * c * 0.8) * dt; st.pitch += st.vp * dt; st.vr += ((tR - st.roll) * 3.2 - st.vr * 1.6) * dt; st.roll += st.vr * dt;
        st.yaw = Math.sin(t * 0.07) * 0.018 + Math.sin(t * 0.31) * 0.006;
        ship.group.position.set(0, st.heave, 0); ship.group.rotation.set(st.roll, st.yaw, st.pitch, 'YZX'); ship.group.updateMatrixWorld(true); inv.copy(ship.group.matrixWorld).invert();
        ship.update(dt, t, wind, env.night);
        // wake: bow wave thrown outward, turbulence along the sides and astern
        const s = st.speed, f = dt * 30;
        wakeStep(dt, dx);
        // spray when the bow drives into a sea
        const bowY = toWorld(v2.set(15, 0.6, 0), v).y - hb; st.sprayT -= dt;
        const plunge = (st.lastBow - bowY) / Math.max(dt, 1e-3); st.lastBow = bowY;
        const burst = (plunge > 1.1 && bowY < 1.2) ? clamp(plunge * 0.5, 0, 2.2) : 0; fx.litColor(col, 1.0, 0.3);
        const n = burst > 0 ? Math.round(burst * 9) : (r() < s * 0.12 ? 1 : 0);
        for (let i = 0; i < n; i++) { const sg = r() > 0.5 ? 1 : -1; fx.emit({ x: 14.5 + r() * 1.8, y: hb + 0.3 + r() * 0.6, z: sg * (0.3 + r() * 1.4), vx: -1 + r() * 2.5 + s * 0.3, vy: 2.2 + r() * (2.5 + burst * 3.5), vz: sg * (1.5 + r() * 3.5), life: 1.1 + r() * 1.3, s0: 0.35 + r() * 0.5, s1: 1.8 + r() * 2.4 + burst, a: 0.3 + 0.2 * burst, r: col.r, g: col.g, b: col.b, grav: 6.5, drag: 0.9, wind: 0.6, frame: r() * 20 | 0, fin: 0.08 }); }
        world.motion = st;
      },
      shadowFocus: (f) => { if (f.length() < 70) f.set(0, 6, 0); },
      preRender(renderer, scene, cam) { ocean.renderPlanar(scene, cam); },
      dispose() { ocean.dispose(); },
    };
    return world;
  },
};
