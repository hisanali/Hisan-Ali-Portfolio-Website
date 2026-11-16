// Old broadleaf forest in a stream valley.
import * as THREE from 'three';
import { clamp, lerp, smooth, rng, fbm, simplex2, Q } from '../core.js';
import { Heightfield, Terrain, makeMask } from '../terrain.js';
import { Forest, Layer, grassLayer, triMat, rockGeo, windPatch } from '../scatter.js';
import { streamMesh, cardGeo, cardMat, mistEmitter, loadGLBMeshes } from './common.js';
import { shots } from '../camera.js';
import { texD, tex } from '../core.js';

const SZ = 5200;
const streamZ = (x) => 70 * Math.sin(x * 0.0041) + 28 * Math.sin(x * 0.0113 + 1.3) + 9 * Math.sin(x * 0.031);
const FALLS = [-430, -210, 35, 262, 480, 715];
const bedY = (x) => { let y = 52 - x * 0.011; for (const f of FALLS) y -= 1.5 * smooth(f - 2.2, f + 2.2, x); return y; };
const fallAt = (x) => { let k = 0; for (const f of FALLS) k = Math.max(k, 1 - Math.abs(x - f - 1.5) / 7); return clamp(k); };
const distStream = (x, z) => Math.abs(z - streamZ(x)) / Math.sqrt(1 + (0.287 * Math.cos(x * 0.0041)) ** 2);
const CLEAR = [[48, 0, 34], [-250, 60, 26], [300, -70, 30]]; // x, offset from stream, radius
const clearing = (x, z) => { let c = 0; for (const [cx, off, r] of CLEAR) { const cz = streamZ(cx) + off; c = Math.max(c, 1 - smooth(r * 0.7, r * 1.15, Math.hypot(x - cx, z - cz))); } const n = fbm(x * 0.0035 + 9, z * 0.0035, 3); return Math.max(c, smooth(0.38, 0.6, n)); };

export default {
  defaults: { time: 'day', weather: 'fair', lat: 49, decl: 16, north: 0.9, ground: [0.05, 0.08, 0.035], sky: { cloudBase: 1500, cirrus: 0.25, fogDensity: 0.0009, fogFalloff: 0.05, fogBase: 48, hazeMul: 1.2 } },
  async create(app) {
    const group = new THREE.Group(), env = app.env; const r = rng(4);
    const hf = new Heightfield({ size: SZ, res: Q.level >= 1 ? 768 : 512, detail: { amp: 0.16, freq: 0.11, slopeAmp: 0.7 }, fn: (x, z) => {
      const d = distStream(x, z); const hills = 62 + fbm(x * 0.00055, z * 0.00055, 4) * 85 + fbm(x * 0.0028 + 5, z * 0.0028, 4) * 16 + Math.abs(simplex2(x * 0.0011, z * 0.0011)) * 30 - x * 0.006;
      const t = Math.pow(smooth(5, 190, d), 0.75); return lerp(bedY(x) + 0.9 + d * 0.05, Math.max(hills, bedY(x) + 2 + d * 0.06), t); } });
    hf.carve = (x, z, h) => { const d = distStream(x, z); if (d > 9) return h; const b = bedY(x) - 0.6 * (1 - Math.min(d / 3.4, 1) ** 2); return lerp(Math.min(h, b), h, smooth(3.2, 8.5, d)); };
    hf.detailScale = (x, z) => smooth(2.5, 7, distStream(x, z));
    const mask = makeMask(SZ, 512, (x, z, o) => { o[0] = clearing(x, z); o[1] = 1 - smooth(2, 16, distStream(x, z)); o[2] = 0; o[3] = 1; });
    const terrain = new Terrain(app, hf, { mask, shadow: false,
      layers: [{ d: 'forest_d.jpg', n: 'forest_n.jpg', scale: 3.2, rough: 0.95, tint: [0.82, 0.78, 0.7] }, { d: 'rock23_d.jpg', n: 'rock23_n.jpg', scale: 5, rough: 0.9, tint: [0.75, 0.75, 0.72] }, { d: 'moss_d.jpg', n: 'moss_n.jpg', scale: 2.6, rough: 0.92, tint: [0.75, 0.9, 0.6] }, { d: 'grass_d.jpg', n: 'grass_n.jpg', scale: 3.5, rough: 0.9, tint: [1.0, 1.15, 0.8] }],
      rule: `float rk = smoothstep(0.42, 0.62, slope + n2*0.12); float gr = mk.r*(1.0 - rk); float ms = smoothstep(0.52, 0.72, n2 + mk.g*0.5 - mk.r*0.3)*(1.0 - rk);
             lw = vec4((1.0 - gr)*(1.0 - ms*0.8), rk*1.4, ms*(1.0 - gr), gr*1.1); lw.x += mk.g*smoothstep(0.75, 1.0, mk.g)*2.0;` });
    group.add(terrain.group);
    const stream = streamMesh(app, (x) => ({ z: streamZ(x), y: bedY(x) - 0.2, foam: fallAt(x) }), { x0: -1900, x1: 1900, step: 1.5, half: 3.9, tint: [0.3, 0.26, 0.17] });
    group.add(stream.mesh);

    const treeOK = (x, z, h, sl) => { const d = distStream(x, z); if (d < 6.5 || sl > 0.75) return 0; return (1 - clearing(x, z) * 0.985) * smooth(6.5, 14, d) * (0.55 + 0.45 * smooth(-0.3, 0.3, fbm(x * 0.01, z * 0.01, 2))); };
    const forest = new Forest(app, hf, { cell: 40, near: 78, far: 1500, perCell: 21, unit: 0.22, density: treeOK,
      variants: [{ model: 'oak_a', scale: [0.8, 1.1], weight: 2, trunk: 2.0 }, { model: 'oak_b', scale: [0.9, 1.3], weight: 3 }, { model: 'ash_a', scale: [0.75, 1.05], weight: 2.5, leafTint: 0xdfe8c8 }, { model: 'ash_b', scale: [0.8, 1.1], weight: 2 }, { model: 'aspen_a', scale: [0.7, 0.95], weight: 1.6, leafTint: 0xb4cf6a }, { model: 'aspen_b', scale: [0.8, 1.1], weight: 0.8, leafTint: 0xd8dc7a }, { model: 'pine_a', scale: [1.0, 1.35], weight: 1.6 }, { model: 'oak_c', scale: [0.9, 1.4], weight: 1.5 }, { model: 'dead_a', scale: [0.7, 1.0], weight: 0.35, noLeaves: true }] });
    await forest.init(); group.add(forest.group);

    const layers = [];
    const sap = cardMat(0xcfe0a8, 62), spr = cardMat(0xb9cf8a, 62);
    layers.push(new Layer(hf, { parts: [{ geo: cardGeo('sapling', 3, 1.5, 2.3, 0.12), ...sap }], cell: 16, radius: 62, perCell: 7, cap: 900, scale: [0.7, 1.6], seed: 21, place: (x, z, h, sl) => distStream(x, z) > 5 && sl < 0.7 ? 0.75 - clearing(x, z) * 0.5 : 0 }));
    layers.push(new Layer(hf, { parts: [{ geo: cardGeo('spray', 4, 1.9, 1.15, 0.3), ...spr }], cell: 12, radius: 62, perCell: 9, cap: 1600, scale: [0.6, 1.5], seed: 22, tilt: 0.3, place: (x, z, h, sl) => distStream(x, z) > 3.6 && sl < 0.8 ? 0.8 - clearing(x, z) * 0.6 : 0 }));
    // mossy boulders and stream stones
    const rockM = triMat({ d: 'rock23_d.jpg', scale: 2.4, tint: [0.7, 0.7, 0.68], top: 'moss_d.jpg', topAmt: 0.75, topTint: [0.7, 0.9, 0.55], topScale: 1.6, bump: 1.6 });
    layers.push(new Layer(hf, { parts: [{ geo: rockGeo(1, 3, 0.62), mat: rockM }], cell: 40, radius: 240, perCell: 5, cap: 900, scale: [0.5, 2.6], seed: 31, yOff: -0.12, tilt: 0.5, collide: 0.85, place: (x, z, h, sl) => 0.3 + sl * 0.9 + (distStream(x, z) < 12 ? 0.5 : 0) }));
    layers.push(new Layer(hf, { parts: [{ geo: rockGeo(2, 2, 0.55, 0.25), mat: rockM }], cell: 16, radius: 110, perCell: 26, cap: 2400, scale: [0.12, 0.6], seed: 32, yOff: -0.05, tilt: 1, place: (x, z) => { const d = distStream(x, z); return d < 6 ? 0.9 : d < 11 ? 0.25 : 0.03; } }));
    // fallen trunks
    { const g = new THREE.CylinderGeometry(0.34, 0.42, 9, 10, 4); g.rotateZ(Math.PI / 2); g.translate(0, 0.28, 0); const m = triMat({ d: 'bark_oak_d.jpg', scale: 1.4, top: 'moss_d.jpg', topAmt: 0.8, topTint: [0.65, 0.85, 0.5], bump: 1.8 });
      layers.push(new Layer(hf, { parts: [{ geo: g, mat: m }], cell: 60, radius: 200, perCell: 2, cap: 200, scale: [0.6, 1.3], seed: 33, align: 1, place: (x, z, h, sl) => distStream(x, z) > 8 && sl < 0.5 ? 0.55 : 0 })); }
    layers.push(grassLayer(hf, { tint: [0.3, 0.44, 0.13], radius: 46, density: 8, h: 0.5, place: (x, z, h, sl) => distStream(x, z) > 3.4 && sl < 0.7 ? 0.14 + clearing(x, z) * 0.86 : 0 }));
    try { for (const [n, sd] of [['flower_white', 41], ['flower_yellow', 42], ['flower_blue', 43]]) { const ms = await loadGLBMeshes(n); const parts = ms.map((m) => { m.mat.side = THREE.DoubleSide; windPatch(m.mat, { stiff: 0.25, flutter: 0, fadeOut: 40 }); return { geo: m.geo, mat: m.mat, cast: false }; });
      layers.push(new Layer(hf, { parts, cell: 10, radius: 40, perCell: 16, cap: 2200, scale: [0.2, 0.42], seed: sd, cast: false, place: (x, z) => clearing(x, z) > 0.6 ? 0.35 * smooth(0.1, 0.5, fbm(x * 0.05 + sd, z * 0.05, 2)) : 0.01 })); } } catch (e) { console.warn('flowers unavailable', e); }
    for (const l of layers) group.add(l.group);

    const mist = mistEmitter(app, { rate: 1.6, radius: 95, alpha: 0.075, where: (x, z, g) => distStream(x, z) < 70 || clearing(x, z) > 0.5 });
    const sx = 30, sz = streamZ(30) + 9;
    const pt = (x, off, h) => [x, h, streamZ(x) + off];
    const world = {
      group, hf, terrain, shadowRange: 85, flySpeed: 14, bounds: 2100, ceiling: 700,
      spawn: { pos: [sx, hf.heightAt(sx, sz) + 1.7, sz], yaw: 2.3, pitch: 0.02 },
      pois: [
        { name: 'The clearing', pos: (o) => o.set(48, hf.heightAt(48, streamZ(48)) + 2.5, streamZ(48) + 2), dist: 30, el: 0.16, az: 1.2, min: 4, max: 300 },
        { name: 'Cascade', pos: (o) => o.set(36, bedY(36) + 1.2, streamZ(36)), dist: 13, el: 0.2, az: 2.9, min: 3, max: 80 },
        { name: 'Stream bend', pos: (o) => o.set(-212, bedY(-212) + 1.5, streamZ(-212)), dist: 20, el: 0.14, az: 0.4, min: 4, max: 120 },
        { name: 'Canopy', pos: (o) => o.set(140, hf.heightAt(140, streamZ(140) + 60) + 30, streamZ(140) + 60), dist: 120, el: 0.5, az: 4, min: 20, max: 900 },
      ],
      tours: [
        shots.path([pt(-40, 0.5, 1.3), pt(-10, -0.8, 1.2), pt(22, 0.6, 1.5), pt(50, 1, 2.2), pt(80, -1, 1.6)], { dur: 24, fov: 58, lookAhead: 0.12 }),
        shots.path([pt(120, 26, 2), pt(100, 18, 2.4), pt(84, 30, 2), pt(70, 22, 3)], { dur: 18, fov: 48, lookAhead: 0.2 }),
        shots.orbit((o) => o.set(48, hf.heightAt(48, streamZ(48)), streamZ(48) + 6), { r0: 34, r1: 26, a0: 0.2, a1: 1.6, h0: 5, h1: 14, dur: 20, fov: 50, lookY: 4 }),
        shots.path([pt(-320, 40, 46), pt(-160, 20, 52), pt(0, -10, 44), pt(150, 10, 60)], { dur: 22, fov: 60, lookAhead: 0.15, lookDown: 30 }),
      ],
      ground: (x, z) => hf.heightAt(x, z),
      waterAt: (x, z) => distStream(x, z) < 3.6 ? bedY(x) - 0.2 : null, walkOnWater: true,
      collide(p, rad) { forest.collide(p, rad); for (const l of layers) if (l.items.length) for (let i = 0; i < l.items.length; i += 4) { const dx = p.x - l.items[i], dz = p.z - l.items[i + 1], rr = l.items[i + 2] + rad; if (p.y < l.items[i + 3] + l.items[i + 2] * 0.7 && dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1; p.x = l.items[i] + dx / d * rr; p.z = l.items[i + 1] + dz / d * rr; } } },
      audio: {
        beds: ['birds', 'trees', 'crickets', 'jungle', 'rain_leaves', 'frogs'], shelter: 0.7,
        mix: (e) => { const day = 1 - e.night, dry = 1 - smooth(0.05, 0.5, e.precipRain); return { birds: 0.75 * smooth(0.25, 0.75, day) * dry * (1 - e.w.storm * 0.8), jungle: 0.16 * day * dry, trees: 0.12 + 0.95 * Math.pow(clamp(e.windNow), 1.1), crickets: 0.5 * smooth(0.4, 0.9, e.night) * dry, frogs: 0.3 * smooth(0.5, 1, e.night) * (0.4 + 0.6 * e.wetness), rain_leaves: 0.9 * smooth(0.05, 0.6, e.precipRain) }; },
        points: [{ file: 'river', pos: () => { const c = app.camera.position; return [c.x, bedY(c.x), streamZ(c.x)]; }, gain: 1.1, ref: 7, roll: 1.2 }, { file: 'waterfall', pos: () => { const c = app.camera.position; let b = FALLS[0]; for (const f of FALLS) if (Math.abs(f - c.x) < Math.abs(b - c.x)) b = f; return [b, bedY(b), streamZ(b)]; }, gain: 0.55, ref: 5, roll: 1.4 }],
        shots: [{ files: ['woodpecker'], every: [25, 70], gain: 0.5, dist: [40, 110], height: 12, when: (e) => e.night < 0.2 && e.precipRain < 0.2 }, { files: ['owl'], every: [20, 55], gain: 0.55, dist: [40, 120], height: 14, when: (e) => e.night > 0.7 }, { files: ['crows'], every: [50, 120], gain: 0.3, dist: [80, 200], height: 25, when: (e) => e.night < 0.3, slice: [40, 8] }],
      },
      update(dt, t) {
        const cam = app.camera.position;
        terrain.update(cam); forest.update(cam); for (const l of layers) l.update(cam); stream.update(dt);
        // mist gathers at dawn, after rain and in fog
        const dawn = smooth(0.25, 0.02, Math.abs(env.sunElev)) * 0.8; mist(dt, clamp(0.25 + dawn + env.w.fog * 1.2 + env.wetness * 0.6), cam, world.ground);
        // spray at the nearest cascade
        let b = FALLS[0]; for (const f of FALLS) if (Math.abs(f - cam.x) < Math.abs(b - cam.x)) b = f;
        if (Math.abs(b - cam.x) < 90 && r() < dt * 14) { const c = app.fx.litColor(_c, 0.95, 0.25); app.fx.emit({ x: b + 2 + r() * 2, y: bedY(b + 3) + 0.1, z: streamZ(b + 2) + (r() - 0.5) * 5, vx: 0.6 + r(), vy: 0.6 + r() * 0.9, vz: (r() - 0.5) * 0.8, life: 1.6 + r() * 1.5, s0: 0.5, s1: 2.2 + r() * 1.5, a: 0.16, r: c.r, g: c.g, b: c.b, grav: 0.5, drag: 0.8, wind: 0.3, frame: -1 }); }
      },
      dispose() { terrain.dispose(); forest.dispose(); for (const l of layers) l.dispose(); hf.dispose(); mask.dispose(); stream.mesh.geometry.dispose(); },
    };
    return world;
  },
};
const _c = new THREE.Color();
