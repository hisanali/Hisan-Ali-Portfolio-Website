// Dune sea under a distant escarpment. Sand moves whenever the wind gets up.
import * as THREE from 'three';
import { clamp, lerp, smooth, rng, fbm, ridged, simplex2, Q } from '../core.js';
import { Heightfield, Terrain } from '../terrain.js';
import { Forest, Layer, triMat, rockGeo } from '../scatter.js';
import { findSpot } from './common.js';
import { shots } from '../camera.js';

const SZ = 18000, WA = 0.35; // prevailing wind angle
const cw = Math.cos(WA), sw = Math.sin(WA);
function dune(u, sharp = 0.72) { // asymmetric profile: long windward ramp, short slip face
  const s = u - Math.floor(u); return s < sharp ? Math.pow(Math.sin(s / sharp * Math.PI * 0.5), 1.7) : Math.pow(Math.cos((s - sharp) / (1 - sharp) * Math.PI * 0.5), 1.15);
}
function height(x, z) {
  const a = x * cw + z * sw, b = -x * sw + z * cw;
  const warp = fbm(x * 0.0007, z * 0.0007, 3) * 1.4 + Math.sin(b * 0.0031 + fbm(x * 0.0004, z * 0.0004, 2) * 3) * 0.33;
  const field = smooth(-0.55, 0.25, fbm(x * 0.00023 + 4, z * 0.00023, 3)); // dunes thin out into gravel flats
  const big = dune(a / 560 + warp) * (38 + 46 * (0.5 + 0.5 * fbm(x * 0.0005 + 7, z * 0.0005, 2)));
  const mid = dune(a / 150 + warp * 2.1 + b * 0.0007) * 6.5 * (0.4 + 0.6 * dune(a / 560 + warp));
  let h = 20 + (big + mid) * field + fbm(x * 0.00018, z * 0.00018, 3) * 60;
  // escarpment and outliers
  const rr = Math.hypot(x * 0.85 - 900, z + 600); const esc = smooth(5200, 6900, rr + fbm(x * 0.0006, z * 0.0006, 3) * 1300);
  const strata = (v) => { const st = 55, f = v / st, i = Math.floor(f), t = f - i; return (i + smooth(0.55, 0.95, t)) * st; };
  let mesa = esc * (420 + 520 * ridged(x * 0.00042, z * 0.00042, 4));
  for (const [mx, mz, mr, mh] of [[2600, -1900, 330, 260], [3350, -1500, 170, 210], [-3100, 2500, 420, 300]]) mesa = Math.max(mesa, mh * (1 - smooth(mr * 0.55, mr * 1.2, Math.hypot(x - mx, z - mz) + fbm(x * 0.004, z * 0.004, 2) * 90)));
  if (mesa > 2) h = Math.max(h, 30 + strata(mesa) * 0.82 + mesa * 0.18);
  return h;
}

export default {
  defaults: { time: 'sunset', weather: 'clear', lat: 24, decl: 16, north: -0.4, windAngle: WA, ground: [0.26, 0.19, 0.12], sky: { cloudBase: 2600, cloudThick: 1200, cirrus: 0.55, fogDensity: 0.00005, fogFalloff: 0.01, fogBase: 20, hazeMul: 1.5, fogTint: new THREE.Color(0.95, 0.72, 0.5), fogTintAmt: 0.15 } },
  async create(app) {
    const group = new THREE.Group(), env = app.env, fx = app.fx; const r = rng(37);
    const hf = new Heightfield({ size: SZ, res: 1024, fn: height, detail: { amp: 0.05, freq: 0.05, slopeAmp: 1.4 } });
    const terrain = new Terrain(app, hf, { shadow: true, normalStrength: 1.25,
      post: `{ float band = aNoise(vec2(h*0.085 + n1*1.5, 3.0))*0.6 + aNoise(vec2(h*0.31, 9.0))*0.4; alb = mix(alb, alb*(0.55 + 0.9*band)*vec3(1.05, 0.92, 0.85), lw.y); }`,
      layers: [{ d: 'dune_d.jpg', n: 'dune_n.jpg', scale: 2.6, rough: 0.93, tint: [1.02, 0.84, 0.62] }, { d: 'strata_d.jpg', n: 'strata_n.jpg', scale: 26, rough: 0.9, tint: [1.25, 0.78, 0.52] }, { d: 'sandsoft_d.jpg', n: 'sandsoft_n.jpg', scale: 5, rough: 0.95, tint: [1.02, 0.82, 0.6] }, { d: 'cracked_d.jpg', n: 'gravel_n.jpg', scale: 7, rough: 0.92, tint: [0.92, 0.8, 0.66] }],
      rule: `float rk = smoothstep(0.55, 0.8, slope + (n2 - 0.5)*0.12);
             float slip = smoothstep(0.36, 0.5, slope)*(1.0 - rk);
             float flat_ = (1.0 - smoothstep(0.03, 0.09, slope))*smoothstep(0.52, 0.66, n1);
             lw = vec4((1.0 - slip)*(1.0 - flat_), rk*1.5, slip + 0.12, flat_*1.2); lw.xzw *= (1.0 - rk);` });
    group.add(terrain.group);
    const rockM = triMat({ d: 'strata_d.jpg', scale: 5, tint: [1.2, 0.76, 0.5], top: 'sandsoft_d.jpg', topAmt: 0.55, topTint: [1.0, 0.82, 0.6], bump: 1.5 });
    const layers = [
      new Layer(hf, { parts: [{ geo: rockGeo(21, 3, 0.6, 0.45), mat: rockM }], cell: 70, radius: 600, perCell: 5, cap: 900, scale: [0.5, 5.5], seed: 81, yOff: -0.3, tilt: 0.6, collide: 0.8, place: (x, z, h, sl) => sl > 0.5 ? 0.6 : smooth(0.5, 0.66, fbm(x * 0.00023 * 13.5 + 4, z * 0.00023 * 13.5, 2) * 0.5 + 0.5) * 0.25 }),
      new Layer(hf, { parts: [{ geo: rockGeo(22, 2, 0.5, 0.4), mat: rockM }], cell: 24, radius: 140, perCell: 8, cap: 1400, scale: [0.08, 0.5], seed: 82, yOff: -0.04, tilt: 1, place: (x, z, h, sl) => sl < 0.1 ? 0.25 : sl > 0.5 ? 0.6 : 0.02 }),
    ];
    for (const l of layers) group.add(l.group);
    const scrub = new Forest(app, hf, { cell: 60, near: 150, far: 1300, perCell: 5, unit: 0.05, seed: 19, density: (x, z, h, sl) => sl < 0.12 ? 0.25 * smooth(-0.1, 0.4, fbm(x * 0.003, z * 0.003, 2)) : 0,
      variants: [{ model: 'dead_a', scale: [0.6, 1.3], weight: 2, noLeaves: true, barkTint: 0xc9b596 }, { model: 'bush_c', scale: [0.7, 1.4], weight: 3, leafTint: 0x9a9468, barkTint: 0xb9a888 }, { model: 'bush_b', scale: [0.6, 1.0], weight: 1.5, leafTint: 0xa8a070, barkTint: 0xb9a888 }] });
    await scrub.init(); group.add(scrub.group);

    // the tallest crest near the middle of the dune field, and the ground below it
    const crest = findSpot(hf, 300, 200, 1800, (h, s, x, z) => Math.hypot(x, z) < 2600 && s < 0.25 ? h : -1, 45);
    const foot = findSpot(hf, crest[0] + 260 * cw, crest[2] + 260 * sw, 240, (h, s) => s < 0.12 ? 500 - h : -1, 30);
    const col = new THREE.Color(); let acc = 0;
    const world = {
      group, hf, terrain, shadowRange: 130, flySpeed: 40, bounds: 7600, ceiling: 2500, shimmer: 1, rainScale: 0.6,
      drift: { hf, color: [0.95, 0.74, 0.5], alpha: 0.6, start: 0.22, amount: 1 },
      spawn: { pos: [crest[0], crest[1] + 1.7, crest[2]], yaw: -WA - Math.PI / 2 + 0.4, pitch: -0.06 },
      pois: [
        { name: 'The great dune', pos: (o) => o.set(crest[0], crest[1] - 14, crest[2]), dist: 330, el: 0.14, az: WA + 2.4, min: 12, max: 3000 },
        { name: 'Slip face', pos: (o) => o.set(lerp(crest[0], foot[0], 0.45), lerp(crest[1], foot[1], 0.5), lerp(crest[2], foot[2], 0.45)), dist: 70, el: 0.1, az: WA + 0.9, min: 6, max: 800 },
        { name: 'Outlier buttes', pos: (o) => o.set(2700, 150, -1850), dist: 950, el: 0.1, az: 2.4, min: 120, max: 4000 },
        { name: 'The escarpment', pos: (o) => o.set(900, 260, -600), dist: 5200, el: 0.2, az: 0.9, min: 500, max: 7500 },
      ],
      tours: [
        shots.orbit([crest[0], crest[1] - 10, crest[2]], { r0: 520, r1: 300, a0: WA + 2.0, a1: WA + 3.0, h0: 40, h1: 90, dur: 24, fov: 40 }),
        shots.path([[crest[0] - 400 * sw, 3, crest[2] + 400 * cw], [crest[0] - 200 * sw, 2.4, crest[2] + 200 * cw], [crest[0], 2.6, crest[2]], [crest[0] + 180 * sw, 3, crest[2] - 180 * cw]], { dur: 24, fov: 56, lookAhead: 0.16 }),
        shots.dolly([foot[0] + 60, foot[1] + 2.2, foot[2] + 30], [foot[0] + 20, foot[1] + 2.6, foot[2] + 4], [crest[0], crest[1], crest[2]], [crest[0], crest[1] + 6, crest[2]], { dur: 16, fov: 36 }),
        shots.dolly([-1800, 520, 2600], [300, 300, 900], [2600, 120, -1900], [2900, 160, -1700], { dur: 26, fov: 42 }),
      ],
      ground: (x, z) => hf.heightAt(x, z),
      collide(p, rad) { scrub.collide(p, rad); for (let i = 0; i < layers[0].items.length; i += 4) { const it = layers[0].items; const dx = p.x - it[i], dz = p.z - it[i + 1], rr = it[i + 2] + rad; if (p.y < it[i + 3] + it[i + 2] * 0.7 && dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1; p.x = it[i] + dx / d * rr; p.z = it[i + 1] + dz / d * rr; } } },
      audio: {
        beds: ['trees', 'crickets'], shelter: -0.1,
        mix: (e) => ({ wind: 0.08 + 0.95 * Math.pow(clamp(e.windNow), 1.2), trees: 0.5 * smooth(0.35, 1, e.windNow), crickets: 0.22 * smooth(0.5, 1, e.night) * (1 - smooth(0.3, 0.7, e.windNow)) }),
        shots: [{ files: ['owl'], every: [50, 140], gain: 0.3, dist: [150, 400], height: 8, when: (e) => e.night > 0.8, ref: 60, wet: 0.4 }],
      },
      update(dt, t) {
        const cam = app.camera.position; terrain.update(cam); scrub.update(cam); for (const l of layers) l.update(cam);
        // airborne dust thickens with the wind; a gale turns into a sandstorm
        const wv = env.windNow, W = app.sky.world; W.fogDensity = 0.00005 + Math.pow(clamp(wv - 0.3, 0, 1), 2) * 0.0085; W.fogTintAmt = 0.15 + clamp(wv - 0.25) * 0.85; W.hazeMul = 1.5 + wv * 2.5;
        world.drift.amount = 0.6 + wv; world.shimmer = clamp(1 - wv) * smooth(0.2, 0.7, env.sunDir.y);
        // plumes streaming off crest lines
        acc += dt * smooth(0.3, 1, wv) * 26; fx.litColor(col, 1.0, 0.3);
        while (acc > 1) { acc -= 1; const a = r() * 6.283, d = 15 + r() * 260, x = cam.x + Math.cos(a) * d, z = cam.z + Math.sin(a) * d; const g = hf.heightAt(x, z); const up = hf.heightAt(x - env.windDir.x * 9, z - env.windDir.y * 9), dn = hf.heightAt(x + env.windDir.x * 9, z + env.windDir.y * 9); if (!(g >= up && g > dn + 2.0)) continue;
          fx.emit({ x, y: g + 0.3, z, vx: env.windDir.x * 3, vy: 0.3 + r() * 0.8, vz: env.windDir.y * 3, life: 3 + r() * 4, s0: 1.5, s1: 9 + r() * 12, a: 0.22 * smooth(0.3, 0.9, wv), r: col.r * 0.95, g: col.g * 0.76, b: col.b * 0.52, drag: 0.5, wind: 1.6, frame: r() * 20 | 0, fin: 0.15 }); }
      },
      dispose() { terrain.dispose(); scrub.dispose(); for (const l of layers) l.dispose(); hf.dispose(); },
    };
    return world;
  },
};
