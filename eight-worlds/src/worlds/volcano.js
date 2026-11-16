// Active volcano: a lava lake in the crater, a river of lava down the flank, ash in the air.
import * as THREE from 'three';
import { clamp, lerp, smooth, damp, rng, fbm, ridged, simplex2, Q, tex, texD, atmoUniform, ATMO_GLSL } from '../core.js';
import { Heightfield, Terrain, makeMask } from '../terrain.js';
import { Forest, Layer, triMat, rockGeo } from '../scatter.js';
import { findSpot } from './common.js';
import { shots } from '../camera.js';

const SZ = 13000, TH0 = 0.9, LAKE_R = 210, LAKE_Y = 1228;
const pathAng = (rr) => TH0 + 0.3 * Math.sin(rr * 0.0021) + 0.12 * Math.sin(rr * 0.0063 + 1);
const pathXZ = (rr, o) => { const a = pathAng(rr); o[0] = Math.cos(a) * rr; o[1] = Math.sin(a) * rr; return o; };
const _t = [0, 0];
function distPath(x, z) { const rr = Math.hypot(x, z); if (rr < LAKE_R * 0.8 || rr > 4300) return 1e9; pathXZ(rr, _t); return Math.hypot(x - _t[0], z - _t[1]); }
const chanW = (rr) => 9 + 12 * smooth(300, 2600, rr) + 26 * smooth(3300, 4200, rr);
function cone(rr) { return 1500 * Math.exp(-Math.pow(rr / 2500, 1.55)) + 40; }
function height(x, z) {
  const rr = Math.hypot(x, z), th = Math.atan2(z, x);
  let h = cone(rr) * (0.94 + 0.1 * fbm(Math.cos(th) * 2.2 + 3, Math.sin(th) * 2.2, 3)) + fbm(x * 0.0007, z * 0.0007, 4) * 70 + ridged(x * 0.0016, z * 0.0016, 4) * 55 * smooth(900, 3000, rr);
  // radial gullies
  h -= 60 * smooth(350, 1500, rr) * (1 - smooth(2200, 4200, rr)) * Math.pow(1 - Math.abs(simplex2(th * 5.0, rr * 0.0004)), 4);
  // crater
  const rim = 400; if (rr < rim * 1.5) { const bowl = LAKE_Y - 14 + 190 * Math.pow(clamp((rr - LAKE_R * 0.9) / (rim - LAKE_R * 0.9)), 1.5); h = lerp(Math.min(h, bowl), h, smooth(rim * 0.92, rim * 1.5, rr)); }
  // breach and channel
  const d = distPath(x, z); if (d < 220) { const w = chanW(rr); const bed = Math.min(h, (rr < rim ? LAKE_Y - 2 : h) - 0) - 9 * (1 - smooth(w * 0.6, w * 2.4, d)) - (rr < rim * 1.2 ? 120 * (1 - smooth(w, w * 5, d)) * (1 - smooth(LAKE_R, rim * 1.2, rr)) * 0 : 0);
    if (rr < rim * 1.25 && rr > LAKE_R * 0.8) { const notch = lerp(LAKE_Y - 3, h, smooth(w * 1.2, w * 6, d)); h = Math.min(h, lerp(notch, h, smooth(rim * 0.95, rim * 1.25, rr))); }
    h = Math.min(h, bed + 0); }
  return h;
}

const LAVA_FRAG = /* glsl */`
precision highp float; ${ATMO_GLSL}
uniform sampler2D tLava, tNoise; uniform float uT, uHeat; varying vec3 vW; varying vec2 vUv; varying float vEdge;
void main(){
  vec2 f = vUv; float sp = 0.045;
  vec2 warp = (texture2D(tNoise, f*vec2(0.5, 0.12) + vec2(0.0, -uT*sp*0.5)).rg - 0.5)*0.22;
  vec3 a = texture2D(tLava, f*vec2(1.0, 0.25) + warp + vec2(0.0, -uT*sp)).rgb;
  vec3 b = texture2D(tLava, f*vec2(2.7, 0.7) - warp*0.7 + vec2(0.37, -uT*sp*1.6)).rgb;
  float slab = texture2D(tNoise, f*vec2(0.7, 0.16) + vec2(0.1, -uT*sp*0.8) + warp).r*0.6 + texture2D(tNoise, f*vec2(0.23, 0.05) + vec2(0.4, -uT*sp*0.6)).g*0.5;
  float heat = smoothstep(0.24, 0.72, (a.g + b.g*0.6)*1.15 - (1.0 - vEdge)*0.45 - smoothstep(0.45, 0.7, slab)*0.35 + (uHeat - 1.0)*0.3);
  vec3 hot = mix(vec3(0.8, 0.06, 0.0), vec3(1.0, 0.48, 0.09), heat)*(0.05 + 3.0*heat*heat*heat)*uHeat;
  vec3 crust = vec3(0.045, 0.038, 0.036)*(0.4 + a.r)*(uA[2].rgb*0.9 + uA[1].rgb*uA[0].w*0.3*max(uA[0].y, 0.0));
  vec3 col = hot + crust*(1.0 - heat);
  col = applyAtmo(col, vW, cameraPosition);
  gl_FragColor = vec4(col, 1.0);
}`;

export default {
  defaults: { time: 'sunset', weather: 'fair', lat: 20, decl: 8, north: 2.2, ground: [0.03, 0.028, 0.026], sky: { cloudBase: 2800, cloudThick: 1300, cirrus: 0.3, fogDensity: 0.00012, fogFalloff: 0.0025, fogBase: 300, hazeMul: 1.8, fogTint: new THREE.Color(0.5, 0.38, 0.32), fogTintAmt: 0.3 } },
  async create(app) {
    const group = new THREE.Group(), env = app.env, fx = app.fx; const r = rng(43);
    const hf = new Heightfield({ size: SZ, res: 1024, fn: height, erosion: Q.level >= 1 ? 1.1 : 0.5, seed: 21, detail: { amp: 0.3, freq: 0.09, slopeAmp: 2.2 },
      post: (H, N, cell) => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -SZ / 2 + i * cell, z = -SZ / 2 + j * cell; if (Math.hypot(x, z) < LAKE_R * 1.02) H[j * N + i] = Math.min(H[j * N + i], LAKE_Y - 6); } } });
    const centre = (rr) => { pathXZ(rr, _t); return hf.macro(_t[0], _t[1]); };
    hf.carve = (x, z, h) => { const d = distPath(x, z); if (d > 90) return h; const rr = Math.hypot(x, z), w = chanW(rr); if (d > w * 2.6) return h; const bed = centre(rr) - 0.9; return lerp(bed, h + 1.5 * smooth(w * 1.0, w * 1.5, d) * (1 - smooth(w * 1.6, w * 2.6, d)), smooth(w * 0.95, w * 1.45, d)); };
    const lavaY = (rr) => centre(rr) + 0.55;
    hf.detailScale = (x, z) => { const d = distPath(x, z); if (d > 200) return 1; const w = chanW(Math.hypot(x, z)); return smooth(w * 1.0, w * 2.2, d); };
    const mask = makeMask(SZ, 512, (x, z, o) => { const rr = Math.hypot(x, z), d = distPath(x, z); o[0] = Math.max(1 - smooth(chanW(rr) * 0.9, chanW(rr) * 2.6 + 14, d), 1 - smooth(LAKE_R, LAKE_R + 90, rr)); o[1] = smooth(2600, 900, rr); o[2] = 0; o[3] = 1; });
    const terrain = new Terrain(app, hf, { mask, shadow: true, emissive: 'lava_e.jpg', normalStrength: 1.3,
      layers: [{ d: 'basalt_d.jpg', n: 'basalt_n.jpg', scale: 7, rough: 0.86, tint: [1.5, 1.42, 1.38] }, { d: 'greyrock_d.jpg', n: 'greyrock_n.jpg', scale: 12, rough: 0.9, tint: [0.34, 0.31, 0.3] }, { d: 'sandsoft_d.jpg', n: 'sandsoft_n.jpg', scale: 6, rough: 0.96, tint: [0.2, 0.185, 0.18] }, { d: 'lava_d.jpg', n: 'lava_n.jpg', scale: 9, rough: 0.8, tint: [1.0, 0.95, 0.9] }],
      rule: `float rk = smoothstep(0.42, 0.64, slope + (n2 - 0.5)*0.14); float ash = smoothstep(0.42, 0.62, n1 + mk.g*0.2)*(1.0 - rk)*(1.0 - smoothstep(0.25, 0.42, slope));
             float hot = smoothstep(0.08, 0.75, mk.r + (n2 - 0.5)*0.25);
             lw = vec4((1.0 - ash)*(1.0 - rk), rk*1.2, ash, 0.0); lw = mix(lw, vec4(0.0, 0.0, 0.0, 1.0), hot*0.92);
             gEmis = hot*hot*(0.7 + 0.35*sin(uA[1].w*0.7 + n3*6.0 + xz.x*0.05))*lw.w;` });
    group.add(terrain.group);

    // lava river ribbon and lake
    const lavaU = { tLava: { value: texD('lavatile.jpg') }, tNoise: { value: tex('waternormals.jpg') }, uT: { value: 0 }, uHeat: { value: 1 }, uA: atmoUniform };
    const lavaMat = new THREE.ShaderMaterial({ uniforms: lavaU, vertexShader: 'attribute float aEdge; varying vec3 vW; varying vec2 vUv; varying float vEdge; void main(){ vec3 p = (modelMatrix*vec4(position, 1.0)).xyz; p.y += min(length(cameraPosition - p)*0.011, 9.0) - 0.5; vW = p; vUv = uv; vEdge = aEdge; gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0); }', fragmentShader: LAVA_FRAG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
    { const pos = [], uv = [], ed = [], idx = []; let n = 0, len = 0; const p = [0, 0], q = [0, 0]; const NS = 5;
      for (let rr = LAKE_R * 0.92; rr <= 4250; rr += 4) { pathXZ(rr, p); pathXZ(rr + 1, q); const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l; const w = chanW(rr) * 0.92, y = lavaY(rr); len += 4;
        for (let s = 0; s <= NS; s++) { const t = s / NS * 2 - 1; pos.push(p[0] + nx * t * w, y - Math.abs(t) * Math.abs(t) * 0.35, p[1] + nz * t * w); uv.push(t * 0.5 + 0.5, len / 40); ed.push(1 - Math.abs(t)); }
        if (n) for (let s = 0; s < NS; s++) { const a = (n - 1) * (NS + 1) + s, b = a + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); } n++; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aEdge', new THREE.Float32BufferAttribute(ed, 1)); g.setIndex(idx); const m = new THREE.Mesh(g, lavaMat); m.frustumCulled = false; group.add(m); }
    { const g = new THREE.CircleGeometry(LAKE_R * 1.06, 64, 0, Math.PI * 2); g.rotateX(-Math.PI / 2); const p = g.attributes.position, u = g.attributes.uv, ed = new Float32Array(p.count); for (let i = 0; i < p.count; i++) { const rr = Math.hypot(p.getX(i), p.getZ(i)) / LAKE_R; ed[i] = clamp(1.2 - rr); u.setXY(i, p.getX(i) / 60, p.getZ(i) / 15); } g.setAttribute('aEdge', new THREE.BufferAttribute(ed, 1)); const m = new THREE.Mesh(g, lavaMat); m.position.y = LAKE_Y; m.frustumCulled = false; group.add(m); }
    // light from the lava: a strong glow in the crater and a few lights that follow the river near the camera
    const craterLight = new THREE.PointLight(0xff5a1c, 0, 2600, 1.5); craterLight.position.set(0, LAKE_Y + 60, 0); group.add(craterLight);
    const riverLights = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xff7a30, 0, 420, 1.6); group.add(l); return l; });

    const rockM = triMat({ d: 'basalt_d.jpg', scale: 3.5, tint: [1.5, 1.4, 1.36], top: 'sandsoft_d.jpg', topAmt: 0.42, topTint: [0.2, 0.185, 0.18], bump: 2 });
    const layers = [
      new Layer(hf, { parts: [{ geo: rockGeo(31, 3, 0.75, 0.55), mat: rockM }], cell: 50, radius: 520, perCell: 9, cap: 1800, scale: [0.5, 5], seed: 91, yOff: -0.25, tilt: 0.9, collide: 0.8, place: (x, z, h, sl) => distPath(x, z) > chanW(Math.hypot(x, z)) * 1.3 && Math.hypot(x, z) > LAKE_R * 1.2 ? 0.22 + sl * 0.5 : 0 }),
      new Layer(hf, { parts: [{ geo: rockGeo(32, 2, 0.6, 0.5), mat: rockM }], cell: 18, radius: 120, perCell: 12, cap: 2400, scale: [0.1, 0.7], seed: 92, yOff: -0.05, tilt: 1.2, place: (x, z) => distPath(x, z) > chanW(Math.hypot(x, z)) * 1.2 && Math.hypot(x, z) > LAKE_R * 1.1 ? 0.45 : 0 }),
    ];
    for (const l of layers) group.add(l.group);
    const snags = new Forest(app, hf, { cell: 60, near: 150, far: 2200, perCell: 6, unit: 0.2, seed: 29, density: (x, z, h, sl) => { const rr = Math.hypot(x, z); return rr > 2300 && sl < 0.4 && distPath(x, z) > 60 ? 0.5 * smooth(2300, 3600, rr) * smooth(-0.2, 0.4, fbm(x * 0.002, z * 0.002, 2)) : 0; }, variants: [{ model: 'dead_a', scale: [0.6, 1.1], weight: 1, noLeaves: true, barkTint: 0x4a4440 }] });
    await snags.init(); group.add(snags.group);

    // vantage points
    const vp = [0, 0]; pathXZ(1650, vp); const side = [-(Math.sin(pathAng(1650))), Math.cos(pathAng(1650))];
    const stand = findSpot(hf, vp[0] + side[0] * 75, vp[1] + side[1] * 75, 60, (h, s, x, z) => distPath(x, z) > 38 && s < 0.5 ? 1 - s : -1, 8);
    const rimP = [Math.cos(TH0 + 2.4) * 415, 0, Math.sin(TH0 + 2.4) * 415]; rimP[1] = hf.heightAt(rimP[0], rimP[2]);
    const vents = []; for (let i = 0; i < 9; i++) { const a = r() * 6.283, rr = 500 + r() * 1500; vents.push([Math.cos(a) * rr, 0, Math.sin(a) * rr]); vents[i][1] = hf.heightAt(vents[i][0], vents[i][2]); }
    const col = new THREE.Color(); let accP = 0, accS = 0, accE = 0, boom = 12, burst = 0;
    for (let i = 0; i < 330; i++) { const a = r() * 6.283, rr = r() * 120, life = 44 + r() * 30; fx.litColor(col, 0.5, 0.2); fx.emit({ x: Math.cos(a) * rr, y: LAKE_Y + 20 + r() * 30, z: Math.sin(a) * rr, vx: (r() - 0.5) * 6, vy: 30 + r() * 22, vz: (r() - 0.5) * 6, life, age: r() * life * 0.95, s0: 60 + r() * 40, s1: 320 + r() * 300, a: 0.6, r: col.r * 0.55 + 0.05, g: col.g * 0.5 + 0.01, b: col.b * 0.5, drag: 0.022, wind: 5, frame: r() * 24 | 0, fin: 0.06, spin: 0.03 }); }
    const world = {
      group, hf, terrain, altitude: 300, shadowRange: 130, flySpeed: 45, bounds: 5600, ceiling: 3600, ash: 0.5, exposure: 1.0, ambientE: 0.55,
      spawn: { pos: [stand[0], stand[1] + 1.7, stand[2]], yaw: Math.atan2(-(0 - stand[0]), -(0 - stand[2])) + 0.25, pitch: 0.1 },
      pois: [
        { name: 'Lava river', pos: (o) => o.set(vp[0], lavaY(1650) + 3, vp[1]), dist: 95, el: 0.16, az: pathAng(1650) + 1.9, min: 16, max: 900 },
        { name: 'Crater lake', pos: (o) => o.set(0, LAKE_Y + 10, 0), dist: 520, el: 0.42, az: TH0 + 2.4, min: 120, max: 2000, minEl: 0.15 },
        { name: 'The mountain', pos: (o) => o.set(0, 900, 0), dist: 4300, el: 0.06, az: TH0 - 0.5, min: 900, max: 5400 },
        { name: 'Lava front', pos: (o) => { pathXZ(4050, vp); return o.set(vp[0], lavaY(4050) + 4, vp[1]); }, dist: 150, el: 0.2, az: pathAng(4050) + 0.3, min: 30, max: 900 },
      ],
      tours: [
        shots.path([1100, 1350, 1600, 1850, 2100].map((rr) => { const p = pathXZ(rr, [0, 0]); const a = pathAng(rr); return [p[0] - Math.sin(a) * 46, 12, p[1] + Math.cos(a) * 46]; }).reverse(), { dur: 26, fov: 56, lookAhead: 0.18, lookDown: 6 }),
        shots.orbit([0, LAKE_Y, 0], { r0: 620, r1: 470, a0: TH0 + 1.6, a1: TH0 + 3.2, h0: 300, h1: 230, dur: 24, fov: 50 }),
        shots.dolly([Math.cos(TH0 - 0.6) * 4900, 420, Math.sin(TH0 - 0.6) * 4900], [Math.cos(TH0 - 0.3) * 3900, 520, Math.sin(TH0 - 0.3) * 3900], [0, 1000, 0], [0, 1300, 0], { dur: 24, fov: 38 }),
        shots.dolly([stand[0] + 14, stand[1] + 2.0, stand[2] + 10], [stand[0], stand[1] + 2.4, stand[2]], [vp[0], lavaY(1650), vp[1]], [0, LAKE_Y + 200, 0], { dur: 18, fov: 60 }),
      ],
      ground: (x, z) => hf.heightAt(x, z),
      // molten rock is treated like deep water so nothing wades into it
      waterAt: (x, z) => { const rr = Math.hypot(x, z); if (rr < LAKE_R * 1.02) return LAKE_Y + 3; const d = distPath(x, z); return d < chanW(rr) * 0.95 ? lavaY(rr) + 3 : null; },
      collide(p, rad) { snags.collide(p, rad); for (let i = 0; i < layers[0].items.length; i += 4) { const it = layers[0].items; const dx = p.x - it[i], dz = p.z - it[i + 1], rr = it[i + 2] + rad; if (p.y < it[i + 3] + it[i + 2] * 0.7 && dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1; p.x = it[i] + dx / d * rr; p.z = it[i + 1] + dz / d * rr; } } },
      audio: {
        beds: [],
        mix: (e) => ({ wind: 0.1 + 0.7 * Math.pow(clamp(e.windNow), 1.2) }),
        points: [{ synth: 'rumble', pos: () => [0, LAKE_Y, 0], gain: () => 1.3 + burst * 2, ref: 900, roll: 0.7 }, { file: 'boil', pos: () => [0, LAKE_Y, 0], gain: 1.3, ref: 120, roll: 1 },
          { file: 'fire', pos: () => { const c = app.camera.position; const rr = clamp(Math.hypot(c.x, c.z), LAKE_R, 4200); pathXZ(rr, _t); return [_t[0], lavaY(rr), _t[1]]; }, gain: 1.5, ref: 26, roll: 1.2 },
          { synth: 'rumble', pos: () => { const c = app.camera.position; const rr = clamp(Math.hypot(c.x, c.z), LAKE_R, 4200); pathXZ(rr, _t); return [_t[0], lavaY(rr), _t[1]]; }, gain: () => 0.8, ref: 40, roll: 1 }],
        shots: [],
      },
      update(dt, t) {
        const cam = app.camera.position; terrain.update(cam); snags.update(cam); for (const l of layers) l.update(cam);
        lavaU.uT.value += dt; lavaU.uHeat.value = 1 + 0.12 * Math.sin(t * 0.9) + burst * 0.5;
        const glow = 0.12 + 0.88 * env.night; craterLight.intensity = (9000 + 2500 * Math.sin(t * 1.7) + burst * 14000) * glow;
        const cr = clamp(Math.hypot(cam.x, cam.z), LAKE_R + 30, 4200);
        riverLights.forEach((l, i) => { const rr = clamp(Math.round((cr + (i - 1.5) * 70) / 70) * 70, LAKE_R, 4230); pathXZ(rr, _t); l.position.set(_t[0], lavaY(rr) + 5, _t[1]); l.intensity = (1500 + 300 * Math.sin(t * 2.3 + rr)) * glow; });
        // plume: hot at the base, cooling to grey as it climbs and shears downwind
        fx.litColor(col, 0.5, 0.2); accP += dt * (6 + burst * 14);
        while (accP > 1) { accP -= 1; const a = r() * 6.283, rr = r() * 120, hotk = 0.5 + burst;
          fx.emit({ x: Math.cos(a) * rr, y: LAKE_Y + 20 + r() * 30, z: Math.sin(a) * rr, vx: (r() - 0.5) * 6, vy: 30 + r() * 22 + burst * 20, vz: (r() - 0.5) * 6, life: 44 + r() * 30, s0: 60 + r() * 40, s1: 320 + r() * 300, a: 0.6, r: col.r * 0.55 + 0.16 * hotk * glow, g: col.g * 0.5 + 0.035 * hotk * glow, b: col.b * 0.5 + 0.006 * hotk, drag: 0.022, wind: 5, frame: r() * 24 | 0, fin: 0.06, spin: 0.03 }); }
        // steam from fumaroles
        accS += dt * 5; fx.litColor(col, 0.95, 0.22);
        while (accS > 1) { accS -= 1; const v = vents[(r() * vents.length) | 0]; if (Math.hypot(v[0] - cam.x, v[2] - cam.z) > 1800) continue; fx.emit({ x: v[0] + (r() - 0.5) * 6, y: v[1] + 1, z: v[2] + (r() - 0.5) * 6, vx: 0, vy: 2.5 + r() * 2.5, vz: 0, life: 9 + r() * 8, s0: 3, s1: 26 + r() * 22, a: 0.3, r: col.r, g: col.g, b: col.b, drag: 0.12, wind: 0.8, frame: r() * 30 | 0, fin: 0.12 }); }
        // embers and spatter along the river near the camera
        accE += dt * 26; while (accE > 1) { accE -= 1; const rr = clamp(cr + (r() - 0.5) * 260, LAKE_R, 4200); pathXZ(rr, _t); const w = chanW(rr) * 0.8; const big = r() < 0.06;
          fx.emit({ x: _t[0] + (r() - 0.5) * w * 2, y: lavaY(rr) + 0.4, z: _t[1] + (r() - 0.5) * w * 2, vx: (r() - 0.5) * (big ? 7 : 2), vy: big ? 7 + r() * 9 : 1.5 + r() * 3.5, vz: (r() - 0.5) * (big ? 7 : 2), life: big ? 1.8 + r() : 2.5 + r() * 3, s0: big ? 0.5 : 0.08 + r() * 0.1, s1: big ? 0.2 : 0.03, a: 1, r: 2.6, g: big ? 0.9 : 0.55, b: 0.08, add: 1, grav: big ? 9.8 : -0.25, drag: big ? 0.1 : 0.5, wind: big ? 0.1 : 0.9, frame: -1, fin: 0.03 }); }
        // strombolian bursts
        boom -= dt; burst = damp(burst, 0, 1.6, dt);
        if (boom <= 0) { boom = 14 + r() * 34; burst = 1; const dist = Math.hypot(cam.x, cam.z, cam.y - LAKE_Y);
          app.sound.play('thunder', [0, LAKE_Y + 40, 0], { gain: 2.2, offset: 40.3, dur: 12, lowpass: 700, ref: 500, rate: 0.62, delay: dist / 343, wet: 0.6 });
          for (let i = 0; i < 90; i++) { const a = r() * 6.283, sp = 20 + r() * 55, el = 0.9 + r() * 0.6; fx.emit({ x: (r() - 0.5) * 60, y: LAKE_Y + 4, z: (r() - 0.5) * 60, vx: Math.cos(a) * Math.cos(el) * sp, vy: Math.sin(el) * sp, vz: Math.sin(a) * Math.cos(el) * sp, life: 5 + r() * 5, s0: 3 + r() * 5, s1: 1.2, a: 1, r: 3.2, g: 1.0, b: 0.1, add: 1, grav: 9.8, drag: 0.03, wind: 0.05, frame: -1, fin: 0.02 }); } }
      },
      dispose() { terrain.dispose(); snags.dispose(); for (const l of layers) l.dispose(); hf.dispose(); mask.dispose(); lavaMat.dispose(); },
    };
    return world;
  },
};
