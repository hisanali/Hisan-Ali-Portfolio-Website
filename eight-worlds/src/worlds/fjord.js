// Arctic fjord: a tidewater glacier, bergs and brash ice on cold, silty water.
import * as THREE from 'three';
import { clamp, lerp, smooth, damp, rng, fbm, ridged, simplex2, Q, hash2 } from '../core.js';
import { Heightfield, Terrain, makeMask } from '../terrain.js';
import { Ocean } from '../ocean.js';
import { Layer, triMat, rockGeo } from '../scatter.js';
import { findSpot, mistEmitter } from './common.js';
import { shots } from '../camera.js';

const SZ = 15000, GX = 2600; // glacier front
const midZ = (x) => 520 * Math.sin(x * 0.00042 + 0.3) + 160 * Math.sin(x * 0.0013);
const halfW = (x) => 560 + 150 * Math.sin(x * 0.0011 + 2) - 120 * smooth(1200, 4200, x);
const iceTop = (x, z) => 46 + (x - GX) * 0.085 + 9 * fbm(x * 0.004, z * 0.004, 3) - 8 * Math.pow(Math.abs(z - midZ(x)) / Math.max(halfW(x), 1), 2);
function inIce(x, z) { if (x < GX) return 0; const front = GX + 26 * fbm(z * 0.012, 4.4, 2) + 40 * Math.pow(Math.abs(z - midZ(x)) / halfW(x), 2); return smooth(front - 4, front + 4, x) * (1 - smooth(0.96, 1.08, Math.abs(z - midZ(x)) / halfW(x))); }
function height(x, z) {
  const d = Math.abs(z - midZ(x)) - halfW(x); // > 0 on land
  const m = Math.pow(ridged(x * 0.00033 + 2, z * 0.00033, 5, 2.1, 0.5), 1.2);
  let h = -170 * (1 - smooth(-420, 30, d)) - 3 + 1350 * Math.pow(smooth(-40, 2100, d), 0.62) * (0.45 + 0.75 * m) + fbm(x * 0.0012, z * 0.0012, 4) * 60 * smooth(0, 300, d);
  h += 14 * smooth(-30, 40, d) * (1 - smooth(40, 160, d)); // low rocky shelf along the shore
  h -= 300 * smooth(0, 800, d) * Math.pow(1 - Math.abs(simplex2(x * 0.0005 + 7, z * 0.0005)), 5);
  const ice = inIce(x, z); if (ice > 0) h = lerp(h, Math.max(h, iceTop(x, z)), ice);
  return h;
}

export default {
  defaults: { time: 'day', weather: 'fair', lat: 70, decl: 9, north: 1.2, cold: true, baseSnow: 0.42, windAngle: 3.0, ground: [0.2, 0.24, 0.27], sky: { cloudBase: 1400, cloudThick: 1400, cirrus: 0.5, fogDensity: 0.00025, fogFalloff: 0.008, fogBase: 0, aurora: 1, hazeMul: 0.7 } },
  async create(app) {
    const group = new THREE.Group(), env = app.env, fx = app.fx; const r = rng(29);
    const hf = new Heightfield({ size: SZ, res: 1024, fn: height, erosion: Q.level >= 1 ? 1.2 : 0.6, seed: 9, detail: { amp: 0.2, freq: 0.08, slopeAmp: 2.6 },
      post: (H, N, cell) => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -SZ / 2 + i * cell, z = -SZ / 2 + j * cell; const ice = inIce(x, z); if (ice > 0.5) H[j * N + i] = Math.max(H[j * N + i], iceTop(x, z)); } } });
    hf.carve = (x, z, h) => { const ice = inIce(x, z); if (ice < 0.02) return h; // crevasses and seracs
      const c = Math.pow(1 - Math.abs(simplex2(x * 0.02 + fbm(x * 0.004, z * 0.004, 2) * 3, z * 0.045)), 9) * 9 + Math.pow(1 - Math.abs(simplex2(x * 0.05, z * 0.013 + 3)), 12) * 5; return h - c * ice + ridged(x * 0.03, z * 0.03, 2) * 3 * ice; };
    const mask = makeMask(SZ, 512, (x, z, o) => { o[0] = inIce(x, z); o[1] = 0; o[2] = 0; o[3] = 1; });
    const terrain = new Terrain(app, hf, { mask, shadow: true,
      layers: [{ d: 'greyrock_d.jpg', n: 'greyrock_n.jpg', scale: 7, rough: 0.9, tint: [0.5, 0.5, 0.52] }, { d: 'rockface_d.jpg', n: 'rockface_n.jpg', scale: 20, rough: 0.9, tint: [0.42, 0.42, 0.46] }, { d: 'snow_d.jpg', n: 'snow_n.jpg', scale: 8, rough: 0.6, tint: [1.12, 1.15, 1.2] }, { d: 'snow_d.jpg', n: 'snow_n.jpg', scale: 14, rough: 0.28, tint: [0.62, 0.92, 1.08] }],
      rule: `float rk = smoothstep(0.42, 0.62, slope + (n2 - 0.5)*0.16);
             float sn = smoothstep(6.0, 60.0, h + (n1 - 0.5)*90.0)*(1.0 - smoothstep(0.5, 0.74, slope + (n2 - 0.5)*0.2)) + uA[3].w*0.3;
             lw = vec4((1.0 - rk), rk*1.2, 0.0, 0.0); lw = mix(lw, vec4(0.0, 0.0, 1.0, 0.0), clamp(sn, 0.0, 1.0));
             float icy = mk.r; float blue = smoothstep(0.25, 0.6, slope + n3*0.1); lw = mix(lw, vec4(0.0, 0.0, 1.0 - blue, blue*1.4), icy);
             gEmis = 0.0;`,
    });
    group.add(terrain.group);
    const ocean = new Ocean(app, { seaDir: 3.1, scale: 0.2, calm: 0.45, swell: 0.3, shoreFoam: 0.3, terrain: hf, planar: true, tideRange: 0.3, deep: [0.01, 0.05, 0.055], scatter: [0.12, 0.42, 0.4], foam: 1.6, clarity: 1.6, turb: 0.1, maxLambda: 60, minLambda: 0.8, bed: 'gravel_d.jpg', bedTint: [0.5, 0.6, 0.62], seed: 11 });
    group.add(ocean.group);

    // icebergs: a few hundred floating bodies, most near the glacier front
    const iceMat = triMat({ d: 'snow_d.jpg', scale: 5, tint: [0.72, 0.95, 1.08], rough: 0.32, bump: 2.2, top: 'snow_d.jpg', topAmt: 0.75, topTint: [1.15, 1.17, 1.2], topScale: 3 });
    iceMat.defines = Object.assign(iceMat.defines || {}, { NO_SNOW: 1 });
    const prevC = iceMat.onBeforeCompile; iceMat.onBeforeCompile = (s) => { prevC(s); s.fragmentShader = s.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      { vec3 Ls = normalize((viewMatrix*vec4(uA[0].xyz, 0.0)).xyz); float thr = 0.35 + 0.65*pow(max(dot(normalize(vViewPosition), -Ls), 0.0), 2.0);
        reflectedLight.directDiffuse += vec3(0.05, 0.36, 0.5)*(uA[1].rgb*uA[0].w*0.2*thr + uA[2].rgb*0.9)*(1.0 - smoothstep(0.2, 0.75, vWNt.y)); }`); }; iceMat.customProgramCacheKey = () => 'iceberg';
    const NB = Q.level >= 1 ? 260 : 120; const geos = [rockGeo(11, 3, 0.75, 0.5), rockGeo(12, 3, 0.55, 0.42), rockGeo(13, 3, 0.95, 0.55)];
    const bergs = []; const bergMeshes = geos.map((g) => { const m = new THREE.InstancedMesh(g, iceMat, NB); m.count = 0; m.frustumCulled = false; m.castShadow = m.receiveShadow = true; group.add(m); return m; });
    for (let i = 0; i < NB * 30 && bergs.length < NB; i++) { const near = r() < 0.7; const x = near ? GX - 30 - Math.pow(r(), 1.6) * 1500 : -5200 + r() * 7600, z = midZ(x) + (r() - 0.5) * 2 * (halfW(x) - 40); if (hf.macro(x, z) > -9 || inIce(x, z) > 0) continue; const big = r(); const s = big > 0.93 ? 14 + r() * 22 : big > 0.6 ? 4 + r() * 8 : 1.2 + r() * 3; bergs.push({ x, z, s, rot: r() * 6.28, tilt: (r() - 0.5) * 0.5, tilt2: (r() - 0.5) * 0.5, ph: r() * 6.28, g: (r() * 3) | 0, vx: 0, vz: 0, sy: 0.6 + r() * 0.7 }); }
    bergs.sort((a, b) => b.s - a.s);
    // brash ice near the camera
    const waterHf = { heightAt: () => ocean.level, slope: () => 0, normalAt: (x, z, o) => o.set(0, 1, 0) };
    const brash = new Layer(waterHf, { parts: [{ geo: rockGeo(14, 2, 0.5, 0.45), mat: iceMat }], cell: 20, radius: 170, perCell: 30, cap: 5000, scale: [0.12, 0.9], seed: 71, yOff: -0.1, tilt: 1.2, cast: false, place: (x, z) => hf.macro(x, z) < -1.5 && inIce(x, z) < 0.01 ? 0.12 + 0.75 * smooth(0.1, 0.6, fbm(x * 0.012, z * 0.012, 3)) * smooth(-2600, GX, x) : 0 });
    group.add(brash.group);
    const rockM = triMat({ d: 'greyrock_d.jpg', scale: 4, tint: [0.45, 0.45, 0.48], bump: 1.6 });
    const rocks = new Layer(hf, { parts: [{ geo: rockGeo(15, 3, 0.7, 0.42), mat: rockM }], cell: 50, radius: 420, perCell: 9, cap: 1600, scale: [0.5, 4.5], seed: 72, yOff: -0.25, tilt: 0.7, collide: 0.8, place: (x, z, h, sl) => h > -1 && h < 260 && inIce(x, z) < 0.01 ? 0.2 + sl * 0.5 : 0 });
    group.add(rocks.group);

    const shore = findSpot(hf, GX - 520, midZ(GX - 520) + halfW(GX - 520) + 30, 380, (h, s) => (h > 2.5 && h < 9 && s < 0.3) ? 1 - s : -1, 20);
    const frontC = [GX, 30, midZ(GX)]; const col = new THREE.Color(); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    const mist = mistEmitter(app, { rate: 1.3, radius: 220, size: [20, 50], alpha: 0.045, height: [0.5, 5] });
    let calveT = 25, bigBerg = bergs[0] || { x: GX - 300, z: midZ(GX - 300), s: 20 };
    const world = {
      group, hf, terrain, ocean, shadowRange: 150, flySpeed: 40, bounds: 6600, ceiling: 2600, exposure: 0.85,
      drift: { hf, color: [1, 1, 1], alpha: 0.4, start: 0.5, amount: 0.7 },
      spawn: { pos: [shore[0], shore[1] + 1.7, shore[2]], yaw: Math.atan2(-(frontC[0] - shore[0]), -(frontC[2] - shore[2])), pitch: 0.04 },
      pois: [
        { name: 'Glacier front', pos: (o) => o.set(GX - 20, 24, midZ(GX)), dist: 330, el: 0.07, az: 3.5, min: 40, max: 2500 },
        { name: 'Great berg', pos: (o) => o.set(bigBerg.x, bigBerg.s * 0.3, bigBerg.z), dist: 80, el: 0.1, az: 2.2, min: 30, max: 600 },
        { name: 'The shore', pos: (o) => o.set(shore[0], shore[1] + 2, shore[2]), dist: 40, el: 0.12, az: 0.4, min: 5, max: 500 },
        { name: 'Down the fjord', pos: (o) => o.set(-1500, 40, midZ(-1500)), dist: 900, el: 0.2, az: 3.1, min: 60, max: 4000 },
      ],
      tours: [
        shots.dolly([GX - 900, 9, midZ(GX - 900) - 160], [GX - 300, 14, midZ(GX - 300) - 60], [GX + 40, 26, midZ(GX)], [GX + 40, 40, midZ(GX) + 80], { dur: 24, fov: 46 }),
        shots.orbit((o) => o.set(bigBerg.x, 6, bigBerg.z), { r0: 110, r1: 70, a0: 1.2, a1: 2.6, h0: 3, h1: 14, dur: 20, fov: 44 }),
        shots.path([[shore[0] - 60, 2.4, shore[2] + 14], [shore[0] - 20, 2.0, shore[2] + 4], [shore[0] + 10, 2.2, shore[2] - 2]], { dur: 18, fov: 58, look: [GX, 30, midZ(GX)] }),
        shots.dolly([-3800, 520, midZ(-3800) + 300], [-1200, 260, midZ(-1200)], [GX, 60, midZ(GX)], [GX + 600, 160, midZ(GX)], { dur: 26, fov: 50 }),
        shots.path([[GX + 300, 60, midZ(GX) - 200], [GX + 700, 50, midZ(GX) + 60], [GX + 1200, 60, midZ(GX) + 240]], { dur: 20, fov: 60, lookAhead: 0.2, lookDown: 30 }),
      ],
      ground: (x, z) => hf.heightAt(x, z),
      waterAt: (x, z) => hf.macro(x, z) < ocean.level + 2 ? ocean.heightAt(x, z) : null,
      collide(p, rad) {
        for (const b of bergs) { const dx = p.x - b.x, dz = p.z - b.z, rr = b.s * 1.05 + rad; if (dx * dx + dz * dz < rr * rr && p.y < b.s * b.sy * 0.75 + rad + 1) { const d = Math.hypot(dx, dz) || 1; const top = b.s * b.sy * 0.75 + rad + 1 - p.y; if (top < rr - d) p.y += top; else { p.x = b.x + dx / d * rr; p.z = b.z + dz / d * rr; } } }
        for (let i = 0; i < rocks.items.length; i += 4) { const dx = p.x - rocks.items[i], dz = p.z - rocks.items[i + 1], rr = rocks.items[i + 2] + rad; if (p.y < rocks.items[i + 3] + rocks.items[i + 2] * 0.7 && dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1; p.x = rocks.items[i] + dx / d * rr; p.z = rocks.items[i + 1] + dz / d * rr; } }
      },
      audio: {
        beds: ['waves', 'drips', 'winter'],
        mix: (e, cam) => { const low = 1 - smooth(20, 300, cam.position.y); return { waves: (0.1 + 0.3 * clamp(e.windNow)) * low, drips: 0.35 * low * (1 - e.night * 0.5) * smooth(0, 3, e.lightIntensity), winter: 0.12 * (1 - e.night), wind: 0.14 + 0.85 * Math.pow(clamp(e.windNow), 1.15) }; },
        points: [{ synth: 'rumble', pos: () => [GX + 200, 40, midZ(GX)], gain: () => 0.5, ref: 400, roll: 0.8 }],
        shots: [{ files: [], synth: 'ice', every: [7, 22], gain: 1, pos: () => { const z = midZ(GX) + (r() - 0.5) * 900; return [GX + 20 + r() * 300, 30, z]; } }, { files: [], synth: 'ice', every: [14, 40], gain: 0.7, dist: [40, 240], height: 0 }, { files: ['whale'], every: [70, 200], gain: 0.22, dist: [400, 900], height: -10, ref: 200, wet: 0.9, slice: [10, 9] }, { files: ['gulls'], every: [40, 110], gain: 0.25, dist: [60, 200], height: 30, when: (en) => en.night < 0.3, slice: [30, 8] }],
      },
      update(dt, t) {
        const cam = app.camera.position;
        ocean.update(dt, app.camera, env); terrain.update(cam); brash.update(cam); rocks.update(cam);
        // bergs bob, tilt and drift slowly with the wind
        const counts = [0, 0, 0]; const wx = env.windDir.x * env.windNow * 0.05, wz = env.windDir.y * env.windNow * 0.05;
        for (const b of bergs) {
          const nx = b.x + wx * dt / (1 + b.s * 0.2), nz = b.z + wz * dt / (1 + b.s * 0.2); if (hf.macro(nx, nz) < -8 && inIce(nx + 20, nz) < 0.01) { b.x = nx; b.z = nz; }
          const wl = ocean.level + Math.sin(t * 0.5 + b.ph) * 0.06 * clamp(4 / b.s, 0.2, 1) + Math.sin(t * 0.21 + b.ph * 2) * 0.05;
          e.set(b.tilt + Math.sin(t * 0.33 + b.ph) * 0.03 * clamp(5 / b.s, 0.15, 1), b.rot + t * 0.004 * (b.ph - 3) / b.s, b.tilt2 + Math.cos(t * 0.27 + b.ph) * 0.03 * clamp(5 / b.s, 0.15, 1)); q.setFromEuler(e);
          sc.set(b.s, b.s * b.sy, b.s); v.set(b.x, wl + b.s * b.sy * 0.16, b.z); m4.compose(v, q, sc); const mm = bergMeshes[b.g]; m4.toArray(mm.instanceMatrix.array, counts[b.g] * 16); counts[b.g]++;
        }
        bergMeshes.forEach((m, i) => { m.count = counts[i]; m.instanceMatrix.needsUpdate = true; });
        // calving: a section of the front lets go
        calveT -= dt;
        if (calveT <= 0) { calveT = 30 + r() * 55; const z = midZ(GX) + (r() - 0.5) * 2 * (halfW(GX) - 120), x = GX - 6; fx.litColor(col, 1.0, 0.3);
          app.sound.ice([x, 20, z], 2.2); app.sound.play('thunder', [x, 15, z], { gain: 1.4, offset: 21, dur: 9, lowpass: 900, ref: 300, rate: 0.7, delay: Math.hypot(cam.x - x, cam.z - z) / 343, wet: 0.7 });
          for (let i = 0; i < 70; i++) { const dl = r() * 1.6; fx.emit({ x: x - r() * 30, y: 1 + r() * 30 * (1 - dl / 1.6), z: z + (r() - 0.5) * 90, vx: -3 - r() * 9, vy: 3 + r() * 16, vz: (r() - 0.5) * 10, life: 3 + r() * 4, s0: 3 + r() * 4, s1: 16 + r() * 22, a: 0.5, r: col.r, g: col.g, b: col.b, grav: 6, drag: 0.5, wind: 0.3, frame: r() * 20 | 0, fin: 0.05 + dl * 0.1 }); } }
        mist(dt, clamp(0.3 + env.w.fog * 1.3 + (1 - env.windNow) * 0.3), cam, (x, z) => hf.macro(x, z) < 1 ? ocean.level : null);
        world.drift.amount = 0.5 + env.snowCover;
      },
      preRender(renderer, scene, cam) { ocean.renderPlanar(scene, cam); },
      dispose() { ocean.dispose(); terrain.dispose(); brash.dispose(); rocks.dispose(); hf.dispose(); mask.dispose(); for (const m of bergMeshes) m.dispose(); },
    };
    return world;
  },
};
