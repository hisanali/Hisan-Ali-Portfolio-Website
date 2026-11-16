// High alpine range: eroded ridges, snowfields, a lake in the valley and cloud snagging on the peaks.
import * as THREE from 'three';
import { clamp, lerp, smooth, rng, fbm, ridged, simplex2, Q } from '../core.js';
import { Heightfield, Terrain } from '../terrain.js';
import { Ocean } from '../ocean.js';
import { Forest, Layer, grassLayer, triMat, rockGeo } from '../scatter.js';
import { findSpot, cardGeo, cardMat } from './common.js';
import { shots } from '../camera.js';

const SZ = 26000, LAKE = 420;
const valleyZ = (x) => 950 * Math.sin(x * 0.00024 + 0.4) + 380 * Math.sin(x * 0.00071);
function height(x, z) {
  const dv = Math.abs(z - valleyZ(x));
  const wx = x + 900 * fbm(x * 0.00012, z * 0.00012 + 5, 2), wz = z + 900 * fbm(x * 0.00012 + 9, z * 0.00012, 2);
  const m = Math.pow(ridged(wx * 0.000135, wz * 0.000135, 6, 2.05, 0.52), 1.35);
  const rise = smooth(250, 5200, dv);
  let h = 330 + dv * 0.1 + rise * (m * 2900 + 300) + fbm(x * 0.0006, z * 0.0006, 4) * 130 * (0.3 + rise);
  // side valleys cutting into the range
  h -= 520 * rise * Math.pow(1 - Math.abs(simplex2(x * 0.00021 + 3, z * 0.00021)), 6);
  // lake basin
  const lr = Math.hypot((x + 300) / 1500, (z - valleyZ(-300)) / 620); h = Math.min(h, lerp(LAKE - 38, h, smooth(0.25, 1.0, lr)) + smooth(1.0, 1.6, lr) * 0);
  if (lr < 1.25) h = Math.min(h, LAKE - 38 * (1 - smooth(0.2, 1.0, lr)) + Math.max(lr - 1, 0) * 90);
  return h;
}

export default {
  defaults: { time: 'day', weather: 'fair', lat: 46, decl: 14, north: 0.5, cold: true, ground: [0.1, 0.11, 0.1], sky: { cloudBase: 2500, cloudThick: 1500, cirrus: 0.4, fogDensity: 0.00011, fogFalloff: 0.003, fogBase: LAKE, hazeMul: 0.75 } },
  async create(app) {
    const group = new THREE.Group(), env = app.env, fx = app.fx; const r = rng(23);
    const hf = new Heightfield({ size: SZ, res: 1024, fn: height, erosion: Q.level >= 1 ? 2.6 : 1.2, seed: 4, detail: { amp: 0.25, freq: 0.07, slopeAmp: 3.2 } });
    const snowline = 1560;
    const terrain = new Terrain(app, hf, { shadow: true, params: [snowline, 1180, 0, 0], rings: 11,
      layers: [{ d: 'grassrock_d.jpg', n: 'grassrock_n.jpg', scale: 8, rough: 0.92, tint: [0.72, 0.86, 0.5] }, { d: 'rockface_d.jpg', n: 'rockface_n.jpg', scale: 22, rough: 0.9, tint: [0.62, 0.6, 0.6] }, { d: 'snow_d.jpg', n: 'snow_n.jpg', scale: 9, rough: 0.62, tint: [1.12, 1.14, 1.18] }, { d: 'greyrock_d.jpg', n: 'greyrock_n.jpg', scale: 9, rough: 0.92, tint: [0.72, 0.7, 0.68] }],
      rule: `float rk = smoothstep(0.34, 0.56, slope + (n2 - 0.5)*0.14);
             float sn = smoothstep(uP.x - 260.0, uP.x + 160.0, h + (n1 - 0.5)*520.0 + (n2 - 0.5)*120.0 + uA[3].w*1500.0)*(1.0 - smoothstep(0.5, 0.78, slope + (n2 - 0.5)*0.2));
             float gr = (1.0 - smoothstep(uP.y - 120.0, uP.y + 260.0, h + (n1 - 0.5)*300.0))*(1.0 - rk);
             lw = vec4(gr, rk*1.2, 0.0, (1.0 - gr)*(1.0 - rk)); lw = mix(lw, vec4(0.0, 0.0, 1.0, 0.0), sn);` });
    group.add(terrain.group);
    const lake = new Ocean(app, { level: LAKE, scale: 0.05, calm: 0.75, swell: 0.1, shoreFoam: 0.12, terrain: hf, planar: true, deep: [0.008, 0.045, 0.06], scatter: [0.06, 0.4, 0.38], foam: 2.5, clarity: 0.6, turb: 0.015, maxLambda: 30, minLambda: 0.6, bed: 'gravel_d.jpg', bedTint: [0.5, 0.62, 0.6], seed: 5 });
    group.add(lake.group);

    const forest = new Forest(app, hf, { cell: 60, near: 120, far: 4200, perCell: 16, unit: 0.21, seed: 14, capFar: 90000,
      density: (x, z, h, sl) => h > LAKE + 1.5 && h < 1250 && sl < 0.62 ? (1 - smooth(900, 1250, h + fbm(x * 0.002, z * 0.002, 2) * 260)) * smooth(-0.35, 0.25, fbm(x * 0.0013 + 3, z * 0.0013, 3)) * (1 - smooth(0.4, 0.62, sl)) : 0,
      variants: [{ model: 'pine_a', scale: [0.95, 1.5], weight: 3 }, { model: 'pine_b', scale: [1.0, 1.5], weight: 3 }, { model: 'pine_c', scale: [1.0, 1.7], weight: 2.5 }, { model: 'aspen_b', scale: [0.7, 1.0], weight: 0.6, leafTint: 0xe8d989 }] });
    await forest.init(); group.add(forest.group);
    const layers = [];
    layers.push(grassLayer(hf, { tint: [0.4, 0.5, 0.16], radius: 42, density: 7, h: 0.3, place: (x, z, h, sl) => h < 1500 && h > LAKE + 0.4 && sl < 0.5 ? 0.9 : 0 }));
    const rockM = triMat({ d: 'greyrock_d.jpg', scale: 4, tint: [0.7, 0.68, 0.67], top: 'moss_d.jpg', topAmt: 0.3, topTint: [0.7, 0.75, 0.4], bump: 1.6 });
    layers.push(new Layer(hf, { parts: [{ geo: rockGeo(7, 3, 0.7, 0.4), mat: rockM }], cell: 60, radius: 520, perCell: 7, cap: 1200, scale: [0.6, 5], seed: 61, yOff: -0.25, tilt: 0.7, collide: 0.8, place: (x, z, h, sl) => h > LAKE + 1 ? 0.14 + sl * 0.5 : 0 }));
    layers.push(new Layer(hf, { parts: [{ geo: rockGeo(8, 2, 0.6, 0.35), mat: rockM }], cell: 20, radius: 120, perCell: 9, cap: 1500, scale: [0.12, 0.7], seed: 62, yOff: -0.05, tilt: 1, place: (x, z, h, sl) => h > LAKE + 0.5 ? 0.2 + sl * 0.6 : 0 }));
    for (const l of layers) group.add(l.group);

    // viewpoints chosen from the generated terrain
    const lakeC = [-300, valleyZ(-300)];
    const camp = findSpot(hf, lakeC[0] + 1500, lakeC[1] - 1900, 1300, (h, s) => (h > 1150 && h < 1750 && s < 0.3) ? 2 - s - Math.abs(h - 1450) / 900 : -1, 70);
    let peak = [0, 0, 0]; for (let z = -9000; z <= 9000; z += 150) for (let x = -9000; x <= 9000; x += 150) { const h = hf.macro(x, z); if (h > peak[1]) peak = [x, h, z]; }
    const shore = findSpot(hf, lakeC[0] + 1000, lakeC[1] + 300, 900, (h, s) => (h > LAKE + 1 && h < LAKE + 10 && s < 0.25) ? 1 - s : -1, 40);
    const col = new THREE.Color(); const crests = [];
    for (let i = 0; i < 2600 && crests.length < 26; i++) { const x = (r() - 0.5) * 16000, z = (r() - 0.5) * 16000; const h = hf.macro(x, z); if (h > 2300 && hf.macro(x + 150, z) < h && hf.macro(x - 150, z) < h && hf.macro(x, z + 150) < h && hf.macro(x, z - 150) < h) crests.push([x, h, z]); }
    let acc = 0, acc2 = 0;
    const world = {
      group, hf, terrain, ocean: lake, altitude: 900, shadowRange: 140, flySpeed: 70, walkSpeed: 1.1, bounds: 10500, ceiling: 4600, exposure: 0.9,
      drift: { hf, color: [1, 1, 1], alpha: 0.45, start: 0.45, amount: 0 },
      spawn: { pos: [camp[0], camp[1] + 1.7, camp[2]], yaw: Math.atan2(-(lakeC[0] - camp[0]), -(lakeC[1] - camp[2])), pitch: -0.08 },
      pois: [
        { name: 'Lake shore', pos: (o) => o.set(shore[0], shore[1] + 3, shore[2]), dist: 150, el: 0.05, az: Math.atan2(shore[2] - lakeC[1], shore[0] - lakeC[0]), min: 6, max: 1500 },
        { name: 'The range', pos: (o) => o.set(camp[0], camp[1] + 40, camp[2]), dist: 600, el: 0.22, az: Math.atan2(camp[2] - lakeC[1], camp[0] - lakeC[0]), min: 30, max: 6000 },
        { name: 'Highest summit', pos: (o) => o.set(peak[0], peak[1] - 60, peak[2]), dist: 1500, el: 0.18, az: 0.8, min: 150, max: 7000 },
        { name: 'The valley', pos: (o) => o.set(2500, 600, valleyZ(2500)), dist: 2400, el: 0.3, az: 3.3, min: 200, max: 8000 },
      ],
      tours: [
        shots.orbit([peak[0], peak[1] - 120, peak[2]], { r0: 2300, r1: 1500, a0: 0.4, a1: 1.5, h0: 250, h1: 520, dur: 26, fov: 42 }),
        shots.path([[shore[0] + 500, 60, shore[2] + 260], [shore[0] + 200, 22, shore[2] + 90], [shore[0], 5, shore[2]], [shore[0] - 160, 4, shore[2] - 30]], { dur: 22, fov: 50, lookAhead: 0.2 }),
        shots.path([[camp[0] + 900, 160, camp[2] - 500], [camp[0] + 300, 60, camp[2] - 120], [camp[0], 12, camp[2]], [camp[0] - 300, 40, camp[2] + 200]], { dur: 24, fov: 56, lookAhead: 0.16, lookDown: 20 }),
        shots.dolly([-5200, 1500, valleyZ(-5200) + 300], [-2600, 900, valleyZ(-2600)], [0, 700, valleyZ(0)], [2000, 900, valleyZ(2000)], { dur: 24, fov: 46 }),
      ],
      ground: (x, z) => hf.heightAt(x, z),
      waterAt: (x, z) => hf.macro(x, z) < LAKE + 1 ? lake.heightAt(x, z) : null,
      collide(p, rad) { forest.collide(p, rad); for (const l of layers) for (let i = 0; i < l.items.length; i += 4) { const dx = p.x - l.items[i], dz = p.z - l.items[i + 1], rr = l.items[i + 2] + rad; if (p.y < l.items[i + 3] + l.items[i + 2] * 0.7 && dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1; p.x = l.items[i] + dx / d * rr; p.z = l.items[i + 1] + dz / d * rr; } } },
      audio: {
        beds: ['winter', 'trees', 'river', 'waves'], shelter: -0.2,
        mix: (e, cam) => { const hi = smooth(900, 1800, cam.position.y), nearLake = clamp(1 - Math.hypot(cam.position.x - lakeC[0], cam.position.z - lakeC[1]) / 2200) * (1 - hi); return { wind: (0.16 + 0.85 * Math.pow(clamp(e.windNow), 1.15)) * (0.6 + 0.6 * hi), winter: 0.5 * (1 - hi) * (1 - e.night * 0.5), trees: (0.1 + 0.5 * clamp(e.windNow)) * (1 - hi), river: 0.16 * (1 - hi), waves: 0.1 * nearLake }; },
        shots: [{ files: ['crows'], every: [30, 80], gain: 0.3, dist: [120, 400], height: 60, when: (e) => e.night < 0.3, slice: [40, 7], ref: 60, wet: 0.5 }, { files: ['wolf'], every: [50, 130], gain: 0.5, dist: [500, 1200], height: 0, when: (e) => e.night > 0.7, slice: [30, 14], ref: 220, wet: 0.8 }, { files: ['thunder'], every: [70, 180], gain: 0.4, dist: [1500, 3000], height: 400, when: (e, w) => w.avalanche, slice: [40, 12], ref: 600, wet: 0.7 }],
      },
      update(dt, t) {
        const cam = app.camera.position;
        lake.update(dt, app.camera, env); terrain.update(cam, 2); forest.update(cam); for (const l of layers) l.update(cam);
        world.drift.amount = smooth(snowline - 250, snowline + 100, cam.y) * 1.0 + env.snowCover * 0.6;
        world.avalanche = env.snowCover > 0.3 || env.lightIntensity > 4;
        // banner cloud and spindrift streaming from the high crests
        fx.litColor(col, 0.95, 0.24); acc += dt * (0.5 + env.windNow * 2.2 + env.w.cloud * 1.2);
        while (acc > 1) { acc -= 1; const c = crests[(r() * crests.length) | 0]; if (!c) break; const s = 160 + r() * 260;
          fx.emit({ x: c[0] + (r() - 0.5) * 300, y: c[1] - 60 + r() * 160, z: c[2] + (r() - 0.5) * 300, vx: 0, vy: 1 + r() * 2, vz: 0, life: 40 + r() * 40, s0: s, s1: s * 2.4, a: 0.2 + 0.25 * env.w.cloud, r: col.r, g: col.g, b: col.b, drag: 0.05, wind: 0.9 + r() * 0.6, frame: r() * 30 | 0, fin: 0.25, spin: 0.01 }); }
        if (cam.y > snowline - 200) { acc2 += dt * env.windNow * 6; while (acc2 > 1) { acc2 -= 1; const a = r() * 6.283, d = 20 + r() * 110, x = cam.x + Math.cos(a) * d, z = cam.z + Math.sin(a) * d; const g = hf.heightAt(x, z); if (g < snowline - 150) continue; fx.emit({ x, y: g + 0.4, z, vx: 0, vy: 0.4 + r(), vz: 0, life: 4 + r() * 4, s0: 3, s1: 12 + r() * 10, a: 0.1, r: col.r, g: col.g, b: col.b, drag: 0.5, wind: 1.4, frame: -1, fin: 0.2 }); } }
      },
      preRender(renderer, scene, cam) { if (cam.position.y < LAKE + 600) lake.renderPlanar(scene, cam); },
      dispose() { lake.dispose(); terrain.dispose(); forest.dispose(); for (const l of layers) l.dispose(); hf.dispose(); },
    };
    return world;
  },
};
