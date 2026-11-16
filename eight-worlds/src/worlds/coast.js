// Lighthouse coast: a headland of broken cliffs taking Atlantic swell.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smooth, damp, rng, fbm, ridged, simplex2, Q, canvasTex, texD, tex } from '../core.js';
import { Heightfield, Terrain } from '../terrain.js';
import { Ocean } from '../ocean.js';
import { Forest, Layer, grassLayer, triMat, rockGeo } from '../scatter.js';
import { cardGeo, cardMat, pushOut, mistEmitter } from './common.js';
import { shots } from '../camera.js';

const SZ = 9000;
const coastZ = (x) => 60 + 240 * fbm(x * 0.00055, 3.1, 3) + 460 * Math.exp(-((x / 190) ** 2)) + 90 * fbm(x * 0.004, 7.7, 3) - 260 * Math.exp(-(((x + 760) / 240) ** 2));
const STACKS = [[150, 640, 30, 40], [-205, 585, 24, 30], [70, 745, 16, 21], [330, 470, 22, 27], [-40, 668, 12, 15]];
function height(x, z) {
  const d = coastZ(x) - z; // > 0 inland
  const cove = Math.exp(-(((x + 760) / 210) ** 2));
  const plateau = 36 + 26 * fbm(x * 0.0009, z * 0.0009, 4) + clamp(d, 0, 2500) * 0.035 + 18 * Math.exp(-((x / 150) ** 2)) * smooth(120, 520, d + 430);
  // ragged plan shape: geos, gullies and buttresses
  const jag = (ridged(x * 0.0085, z * 0.0085, 3) - 0.5) * 60 + fbm(x * 0.028, z * 0.028, 2) * 9;
  const dd = d + jag * (1 - cove);
  const k = smooth(-9 - cove * 40, 13 + cove * 150, dd);
  const sea = -4 - clamp(-dd, 0, 900) * 0.06 - 7 * smooth(0, 50, -dd);
  // two benches break the face so it reads as rock, not a ramp
  const face = Math.pow(k, lerp(0.7, 1.6, cove)); const bench = face + 0.1 * Math.sin(face * Math.PI * 3) * (1 - cove) * smooth(0, 0.2, face) * (1 - smooth(0.8, 1, face));
  let h = lerp(sea, lerp(plateau, 3 + d * 0.06, cove * 0.92), clamp(bench));
  for (const [sx, sz, r, top] of STACKS) { const q = Math.hypot(x - sx, z - sz) / (r * (1 + 0.25 * fbm(x * 0.03 + sx, z * 0.03, 2))); h = Math.max(h, (top + 5 * fbm(x * 0.05, z * 0.05, 2)) * Math.exp(-(q ** 4.5)) - 8); }
  // wave-cut platform at the foot of the cliffs
  const ledge = smooth(-30, -9, dd) * (1 - smooth(-4, 4, dd)); h = Math.max(h, lerp(-30, 0.5 + fbm(x * 0.05, z * 0.05, 2) * 1.4, ledge * (1 - cove)));
  return h;
}

function lighthouse(app) {
  const g = new THREE.Group(); const parts = { white: [], red: [], stone: [], iron: [], roof: [] };
  const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  parts.stone.push(lathe([[0, 0], [5.6, 0], [5.6, 0.8], [5.0, 1.0], [5.0, 3.2], [4.55, 3.5]]));
  parts.white.push(lathe([[4.5, 3.4], [4.25, 8], [3.95, 12.5]])); parts.red.push(lathe([[3.95, 12.5], [3.65, 17], [3.4, 20.5]])); parts.white.push(lathe([[3.4, 20.5], [3.15, 25.5], [3.05, 27.2]]));
  parts.iron.push(lathe([[3.05, 27.2], [4.3, 27.9], [4.3, 28.15], [0, 28.15]]), lathe([[4.25, 28.15], [4.25, 29.2], [4.18, 29.2], [4.18, 28.15]], 40));
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; const c = new THREE.CylinderGeometry(0.03, 0.03, 1.05, 5); c.translate(Math.cos(a) * 4.22, 28.67, Math.sin(a) * 4.22); parts.iron.push(c); }
  parts.white.push(lathe([[2.5, 28.15], [2.5, 29.0], [2.3, 29.0]]));
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; const c = new THREE.BoxGeometry(0.09, 3.3, 0.09); c.translate(Math.cos(a) * 2.32, 30.65, Math.sin(a) * 2.32); parts.iron.push(c); }
  parts.roof.push(lathe([[2.55, 32.3], [2.6, 32.45], [1.9, 33.6], [0.6, 34.4], [0.25, 34.5], [0.2, 35.3], [0, 35.4]]));
  // windows and door as dark insets
  for (const [y, a] of [[8, 0.6], [14, 2.4], [20, 4.3], [24.5, 0.9]]) { const b = new THREE.BoxGeometry(0.7, 1.3, 0.5); const rr = lerp(4.3, 3.1, (y - 3.4) / 24); b.translate(0, y, rr - 0.1); b.rotateY(a); parts.iron.push(b); }
  { const b = new THREE.BoxGeometry(1.3, 2.4, 0.6); b.translate(0, 2.2, 4.85); b.rotateY(2.0); parts.iron.push(b); }
  const mk = (list, mat) => { const m = new THREE.Mesh(mergeGeometries(list.map((x) => { const y = x.index ? x.toNonIndexed() : x; y.deleteAttribute('uv'); return y; })), mat); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  mk(parts.white, triMat({ d: 'block_d.jpg', scale: 3.2, tint: [1.55, 1.52, 1.45], rough: 0.8, bump: 0.9 }));
  mk(parts.red, triMat({ d: 'block_d.jpg', scale: 3.2, tint: [1.25, 0.22, 0.16], rough: 0.75, bump: 0.9 }));
  mk(parts.stone, triMat({ d: 'block_d.jpg', scale: 2.4, tint: [0.8, 0.8, 0.78], bump: 1.6 }));
  mk(parts.iron, new THREE.MeshStandardMaterial({ color: 0x15181a, roughness: 0.5, metalness: 0.7 }));
  mk(parts.roof, new THREE.MeshStandardMaterial({ color: 0x3f6a5c, roughness: 0.55, metalness: 0.6 }));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.28, 2.28, 3.3, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xbfd6dc, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide })); glass.position.y = 30.65; glass.renderOrder = 20; g.add(glass);
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.86, 0.6), fog: false }); const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.3, 16), lampMat); lamp.position.y = 30.6; g.add(lamp);
  // rotating beams: soft cones drawn additively, plus a real spotlight sweeping the ground and sea
  const beamMat = new THREE.ShaderMaterial({ uniforms: { uI: { value: 0 } }, vertexShader: 'varying float vK; varying vec3 vN; varying vec3 vV; void main(){ vK = uv.y; vec4 mv = modelViewMatrix*vec4(position, 1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }', fragmentShader: 'uniform float uI; varying float vK; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float a = rim*(1.0 - vK)*(1.0 - vK)*uI; gl_FragColor = vec4(vec3(1.0, 0.9, 0.68)*a, a); }', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const head = new THREE.Group(); head.position.y = 30.6; g.add(head);
  for (const s of [1, -1]) { const c = new THREE.CylinderGeometry(1.0, 34, 520, 24, 1, true); c.rotateZ(-Math.PI / 2 * s); c.translate(260 * s, 0, 0); const b = new THREE.Mesh(c, beamMat); b.renderOrder = 45; b.frustumCulled = false; b.userData.noReflect = true; head.add(b); }
  const spot = new THREE.SpotLight(0xffe2b0, 0, 1400, 0.11, 0.6, 1.2); spot.position.set(0, 0, 0); spot.target.position.set(100, -6, 0); head.add(spot); head.add(spot.target);
  return { group: g, head, beamMat, lampMat, spot };
}

function cottage() {
  const g = new THREE.Group(); const wall = [], roof = [], dark = [], stone = [];
  const B = (c, s, list) => { const b = new THREE.BoxGeometry(...s); b.translate(...c); b.deleteAttribute('uv'); list.push(b.toNonIndexed()); };
  B([0, 1.5, 0], [9, 3, 5.4], wall); B([-6.6, 1.2, 0.4], [4.2, 2.4, 4.2], wall);
  const prism = (w, d, h, c) => { const s = new THREE.Shape(); s.moveTo(-d / 2 - 0.3, 0); s.lineTo(d / 2 + 0.3, 0); s.lineTo(0, h); s.closePath(); const e = new THREE.ExtrudeGeometry(s, { depth: w + 0.6, bevelEnabled: false }); e.rotateY(Math.PI / 2); e.translate(c[0] - w / 2 - 0.3, c[1], c[2]); e.deleteAttribute('uv'); roof.push(e.toNonIndexed()); };
  prism(9, 5.4, 2.5, [0, 3, 0]); prism(4.2, 4.2, 1.9, [-6.6, 2.4, 0.4]);
  B([3.2, 4.8, 0], [0.8, 2.2, 0.8], stone); for (const x of [-2.6, 0.2, 2.8]) B([x, 1.6, 2.72], [0.9, 1.1, 0.12], dark); B([-0.9, 1.05, -2.72], [1.0, 2.1, 0.12], dark);
  // drystone wall around the yard
  for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283; if (a > 1.2 && a < 1.7) continue; const rx = 15, rz = 11; const b = new THREE.BoxGeometry(2.1, 1.0 + (i % 3) * 0.08, 0.6); b.rotateY(-a + Math.PI / 2); b.translate(Math.cos(a) * rx - 1, 0.45, Math.sin(a) * rz); b.deleteAttribute('uv'); stone.push(b.toNonIndexed()); }
  const mk = (l, m) => { const x = new THREE.Mesh(mergeGeometries(l), m); x.castShadow = x.receiveShadow = true; g.add(x); };
  mk(wall, triMat({ d: 'block_d.jpg', scale: 2.2, tint: [1.45, 1.42, 1.34], bump: 0.8, world: false })); mk(roof, triMat({ d: 'strata_d.jpg', scale: 1.6, tint: [0.34, 0.36, 0.4], rough: 0.7, top: 'moss_d.jpg', topAmt: 0.35, topTint: [0.6, 0.75, 0.4] }));
  mk(stone, triMat({ d: 'rock23_d.jpg', scale: 1.5, tint: [0.75, 0.74, 0.7], top: 'moss_d.jpg', topAmt: 0.5, topTint: [0.7, 0.8, 0.45], bump: 1.8 }));
  const win = new THREE.MeshStandardMaterial({ color: 0x0c0e10, roughness: 0.2, emissive: new THREE.Color(1, 0.6, 0.25), emissiveIntensity: 0 }); const wm = new THREE.Mesh(mergeGeometries(dark), win); g.add(wm);
  return { group: g, win };
}

export default {
  defaults: { time: 'day', weather: 'fair', lat: 54, decl: 10, north: 2.6, windAngle: -1.45, ground: [0.04, 0.06, 0.06], sky: { cloudBase: 1000, cloudThick: 1500, cirrus: 0.4, fogDensity: 0.00015, fogFalloff: 0.02, fogBase: 0, hazeMul: 1.3 } },
  async create(app) {
    const group = new THREE.Group(), env = app.env, fx = app.fx; const r = rng(17);
    const hf = new Heightfield({ size: SZ, res: 1024, fn: height, detail: { amp: 0.12, freq: 0.07, slopeAmp: 3.4 } });
    const terrain = new Terrain(app, hf, { shadow: true,
      post: `{ float band = aNoise(vec2(h*0.16 + n1*2.0, 5.0)); alb = mix(alb, alb*(0.7 + 0.55*band), lw.y*0.8); alb *= mix(1.0, 0.55, (1.0 - smoothstep(0.5, 3.5, h))*lw.y); }`,
      layers: [{ d: 'grassrock_d.jpg', n: 'grassrock_n.jpg', scale: 7, rough: 0.92, tint: [0.78, 0.92, 0.6] }, { d: 'cliff_d.jpg', n: 'cliff_n.jpg', scale: 14, rough: 0.9, tint: [0.72, 0.7, 0.66] }, { d: 'beach_d.jpg', n: 'beach_n.jpg', scale: 6, rough: 0.95, tint: [1.0, 0.95, 0.85] }, { d: 'seaside_d.jpg', n: 'seaside_n.jpg', scale: 5, rough: 0.55, tint: [0.5, 0.5, 0.48] }],
      rule: `float rk = smoothstep(0.2, 0.4, slope + (n2 - 0.5)*0.12); float low = 1.0 - smoothstep(1.2, 4.5, h + n2*2.0); float sand = low*(1.0 - smoothstep(0.12, 0.3, slope))*step(-9000.0, h);
             float wetr = (1.0 - smoothstep(2.0, 7.0, h + n2*3.0))*rk; lw = vec4((1.0 - rk)*(1.0 - low), rk*(1.0 - wetr*0.85)*1.3, sand*1.2 + (1.0 - smoothstep(-3.0, 0.5, h))*0.6, wetr*1.3 + low*(1.0 - sand)*0.8);` });
    group.add(terrain.group);
    const ocean = new Ocean(app, { seaDir: -1.42, scale: 0.85, terrain: hf, tideRange: 0.85, deep: [0.01, 0.05, 0.062], scatter: [0.07, 0.42, 0.34], foam: 0.28, bed: 'gravel_d.jpg', bedTint: [0.55, 0.6, 0.5], clarity: 0.8, turb: 0.05, seed: 3 });
    group.add(ocean.group);

    // lighthouse at the tip of the headland, cottage behind it
    const lx = 6, lz = coastZ(6) - 78, ly = hf.heightAt(lx, lz) - 0.4; const lh = lighthouse(app); lh.group.position.set(lx, ly, lz); group.add(lh.group);
    const cx = lx - 14, cz = lz - 46, cy = hf.heightAt(cx, cz) - 0.1; const ct = cottage(); ct.group.position.set(cx, cy, cz); ct.group.rotation.y = 0.5; group.add(ct.group);
    const colliders = [{ t: 'cyl', x: lx, z: lz, r: 5.7, y0: ly - 5, y1: ly + 3.3, top: false }, { t: 'cyl', x: lx, z: lz, r: 4.6, y0: ly, y1: ly + 36, top: false }, { t: 'box', x: cx, z: cz, hx: 4.7, hz: 2.9, rot: -0.5, y0: cy - 2, y1: cy + 6 }, { t: 'box', x: cx - 6.6 * Math.cos(0.5) + 0.4 * Math.sin(0.5), z: cz + 6.6 * Math.sin(0.5) + 0.4 * Math.cos(0.5), hx: 2.3, hz: 2.3, rot: -0.5, y0: cy - 2, y1: cy + 4.6 }];

    const layers = [];
    const inland = (x, z) => coastZ(x) - z;
    layers.push(grassLayer(hf, { tint: [0.34, 0.46, 0.16], radius: 44, density: 9, h: 0.42, place: (x, z, h, sl) => h > 6 && sl < 0.55 ? 0.95 : 0 }));
    const spr = cardMat(0x93a86a, 70);
    layers.push(new Layer(hf, { parts: [{ geo: cardGeo('spray', 4, 1.5, 0.75, 0.2), ...spr }], cell: 14, radius: 70, perCell: 5, cap: 900, scale: [0.6, 1.5], seed: 51, tilt: 0.3, place: (x, z, h, sl) => h > 8 && sl < 0.6 ? 0.28 + 0.6 * smooth(0, 0.4, fbm(x * 0.02, z * 0.02, 2)) : 0 }));
    const rockM = triMat({ d: 'cliff_d.jpg', scale: 5, tint: [0.62, 0.6, 0.56], top: 'moss_d.jpg', topAmt: 0.42, topTint: [0.7, 0.8, 0.4], bump: 1.5 });
    const wetRock = triMat({ d: 'seaside_d.jpg', scale: 3, tint: [0.45, 0.45, 0.43], rough: 0.5, bump: 1.6 });
    layers.push(new Layer(hf, { parts: [{ geo: rockGeo(4, 3, 0.65), mat: rockM }], cell: 50, radius: 420, perCell: 5, cap: 900, scale: [0.6, 3.4], seed: 52, yOff: -0.2, tilt: 0.6, collide: 0.8, place: (x, z, h, sl) => h > 5 ? 0.12 + sl * 0.6 : 0 }));
    layers.push(new Layer(hf, { parts: [{ geo: rockGeo(5, 3, 0.6, 0.42), mat: wetRock }], cell: 30, radius: 380, perCell: 10, cap: 2600, scale: [0.5, 3.6], seed: 53, yOff: -0.25, tilt: 0.8, collide: 0.8, place: (x, z, h, sl) => h > -3.5 && h < 3 ? 0.75 : 0 }));
    for (const l of layers) group.add(l.group);
    const forest = new Forest(app, hf, { cell: 50, near: 110, far: 2400, perCell: 9, unit: 0.2, seed: 8, density: (x, z, h, sl) => { const d = inland(x, z); return h > 18 && sl < 0.45 ? smooth(240, 700, d) * smooth(-0.1, 0.35, fbm(x * 0.0016, z * 0.0016, 3)) * 0.9 : 0; },
      variants: [{ model: 'pine_a', scale: [0.9, 1.3], weight: 3 }, { model: 'pine_b', scale: [0.9, 1.3], weight: 3 }, { model: 'oak_c', scale: [0.8, 1.2], weight: 1.5 }, { model: 'bush_b', scale: [0.9, 1.6], weight: 2 }] });
    await forest.init(); group.add(forest.group);

    // shoreline sample points where surf can explode against rock
    const surf = [];
    for (let x = -1200; x <= 900; x += 9) { let z0 = coastZ(x) + 80, z1 = coastZ(x) - 80; if (hf.macro(x, z0) > 0 || hf.macro(x, z1) < 0) continue; for (let i = 0; i < 12; i++) { const m = (z0 + z1) / 2; hf.macro(x, m) > 0 ? (z1 = m) : (z0 = m); } const z = z0 + 3; const steep = hf.slope(x, z0 - 6); if (steep > 0.5) surf.push({ x, z, steep, cool: r() * 4, prev: 0 }); }
    for (const [sx, sz, rr] of STACKS) for (let a = 0; a < 6; a++) { const an = a / 6 * 6.283 + 0.4; surf.push({ x: sx + Math.cos(an) * (rr + 3), z: sz + Math.sin(an) * (rr + 3), steep: 1.2, cool: r() * 4, prev: 0 }); }
    const col = new THREE.Color(); const mist = mistEmitter(app, { rate: 0.8, radius: 160, size: [14, 30], alpha: 0.05, where: (x, z, g) => g < 4 });
    let surfLevel = 0;
    const world = {
      group, hf, terrain, ocean, shadowRange: 120, flySpeed: 26, bounds: 3600, ceiling: 1500,
      spawn: { pos: [lx - 34, hf.heightAt(lx - 34, lz - 22) + 1.7, lz - 22], yaw: -2.15, pitch: 0.05 },
      pois: [
        { name: 'The light', pos: (o) => o.set(lx, ly + 20, lz), dist: 95, el: 0.1, az: 1.15, min: 12, max: 900 },
        { name: 'Under the cliffs', pos: (o) => o.set(40, 14, coastZ(40) + 8), dist: 70, el: 0.06, az: 1.75, min: 14, max: 400 },
        { name: 'Sea stacks', pos: (o) => o.set(150, 14, 640), dist: 120, el: 0.1, az: 2.4, min: 22, max: 500 },
        { name: 'The cove', pos: (o) => o.set(-760, 4, coastZ(-760) + 10), dist: 110, el: 0.16, az: 1.2, min: 12, max: 600 },
      ],
      tours: [
        shots.orbit([lx, ly + 16, lz], { r0: 150, r1: 90, a0: 0.9, a1: 2.0, h0: 6, h1: 26, dur: 22, fov: 40, lookY: 4 }),
        shots.dolly([230, 4, 790], [120, 6, 590], [lx, ly + 22, lz], [lx, ly + 26, lz], { dur: 18, fov: 34 }),
        shots.path([[lx - 70, 2.2, lz - 40], [lx - 40, 2.0, lz - 22], [lx - 16, 2.2, lz - 4], [lx - 9, 2.6, lz + 14]], { dur: 20, fov: 58, look: [lx, ly + 24, lz] }),
        shots.orbit([150, 10, 640], { r0: 70, r1: 110, a0: 3.4, a1: 2.3, h0: 3, h1: 12, dur: 18, fov: 46 }),
        shots.dolly([-640, 30, coastZ(-640) + 220], [-720, 9, coastZ(-720) + 70], [-800, 6, coastZ(-800) - 30], [-760, 12, coastZ(-760) - 60], { dur: 18, fov: 50 }),
      ],
      ground: (x, z) => hf.heightAt(x, z),
      waterAt: (x, z) => hf.macro(x, z) < ocean.level + 2.5 ? ocean.heightAt(x, z) : null,
      collide(p, rad) { pushOut(p, rad, colliders); forest.collide(p, rad); for (const l of layers) for (let i = 0; i < l.items.length; i += 4) { const dx = p.x - l.items[i], dz = p.z - l.items[i + 1], rr = l.items[i + 2] + rad; if (p.y < l.items[i + 3] + l.items[i + 2] * 0.7 && dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1; p.x = l.items[i] + dx / d * rr; p.z = l.items[i + 1] + dz / d * rr; } } },
      audio: {
        beds: ['waves', 'trees'],
        mix: (e, cam) => { const dSea = clamp(1 - Math.max(coastZ(cam.position.x) - cam.position.z, 0) / 900); return { waves: (0.3 + 0.75 * clamp(e.windNow)) * (0.35 + 0.65 * dSea), trees: 0.06 + 0.3 * clamp(e.windNow) * (1 - dSea) }; },
        points: [{ file: 'waves', pos: () => [lx + 10, 2, coastZ(lx) + 6], gain: () => 0.8 + surfLevel * 0.8, ref: 30, roll: 1.1 }, { file: 'waterfall', pos: () => { const c = app.camera.position; return [c.x, 1, coastZ(c.x) + 4]; }, gain: () => 0.25 + 0.5 * clamp(env.windNow), ref: 22, roll: 1.3 }],
        shots: [{ files: ['gulls'], every: [9, 26], gain: 0.5, dist: [30, 160], height: 30, when: (e) => e.night < 0.4 && e.w.storm < 0.5, slice: [30, 10] }],
      },
      update(dt, t) {
        const cam = app.camera.position;
        ocean.update(dt, app.camera, env); terrain.update(cam); forest.update(cam); for (const l of layers) l.update(cam);
        // lighthouse: lit from dusk, and in fog or heavy weather
        const on = clamp(Math.max(smooth(0.12, -0.02, env.sunDir.y), env.w.fog * 1.4, smooth(0.7, 1, env.w.cloud) * 0.8)); lh.head.rotation.y = t * 0.42;
        lh.beamMat.uniforms.uI.value = on * (0.05 + 0.3 * clamp(env.w.fog * 1.5 + env.w.haze * 0.12 + env.precipRain)) * (0.4 + 0.6 * env.night + env.w.fog * 0.6) / Math.max(env.exposure, 0.3);
        lh.lampMat.color.setRGB(1, 0.86, 0.6).multiplyScalar(0.3 + on * (4 - 3.6 * env.night)); lh.spot.intensity = on * 900 * (0.2 + 0.8 * env.night);
        ct.win.emissiveIntensity = smooth(0.1, 0.6, env.night) * 0.14;
        // surf: where a crest arrives at steep rock, throw spray
        const amp = clamp(0.25 + env.windNow * 1.1, 0, 1.6); let lvl = 0; fx.litColor(col, 1.0, 0.28);
        for (const s of surf) {
          const d2 = (s.x - cam.x) ** 2 + (s.z - cam.z) ** 2; if (d2 > 520 * 520) continue; s.cool -= dt; if (s.cool > 0) continue;
          const hh = ocean.heightAt(s.x, s.z + 5) - ocean.level; const rising = hh - s.prev; s.prev = hh;
          if (hh > 0.42 * amp + 0.12 && rising > 0.0 && r() < 0.5) { s.cool = 2.2 + r() * 3.5; const power = clamp(hh * 0.9 + amp * 0.7, 0.3, 2.6) * Math.min(s.steep, 1.4); lvl += power / (1 + d2 / 6000);
            const n = Math.round((4 + power * 7) * (Q.level >= 1 ? 1 : 0.5));
            for (let i = 0; i < n; i++) fx.emit({ x: s.x + (r() - 0.5) * 9, y: ocean.level + 0.2 + r() * 1.2, z: s.z + (r() - 0.5) * 4, vx: (r() - 0.5) * 3, vy: 3.5 + r() * (5 + power * 6.5), vz: -1 - r() * 2.5 + (r() - 0.5) * 2, life: 1.6 + r() * 2.0, s0: 0.8 + r() * 1.2, s1: 4.5 + r() * 5 + power * 2.5, a: 0.38 + r() * 0.2, r: col.r, g: col.g, b: col.b, grav: 7.5, drag: 0.55, wind: 0.5, frame: r() * 24 | 0, fin: 0.06 }); }
        }
        surfLevel = damp(surfLevel, clamp(lvl), 0.8, dt);
        mist(dt, clamp(env.w.fog * 1.5 + amp * 0.25 - 0.15), cam, (x, z) => { const g = hf.macro(x, z); return g < 3 ? Math.max(g, ocean.level) : null; });
      },
      dispose() { ocean.dispose(); terrain.dispose(); forest.dispose(); for (const l of layers) l.dispose(); hf.dispose(); },
    };
    return world;
  },
};
