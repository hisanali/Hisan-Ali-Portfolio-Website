// A temple precinct gone back to woodland: columns, a broken cella, a processional way and a pool.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smooth, rng, fbm, simplex2, Q, tex, texD } from '../core.js';
import { Heightfield, Terrain, makeMask } from '../terrain.js';
import { Forest, Layer, grassLayer, triMat, rockGeo } from '../scatter.js';
import { cardGeo, cardMat, mistEmitter, pushOut } from './common.js';
import { shots } from '../camera.js';

const SZ = 4200, BASE = 30; // platform sits at BASE
const PX = 19, PZ = 10.5, STEP = 0.42, NSTEP = 4; // stylobate half-extents and steps
const inRect = (x, z, hx, hz) => Math.max(Math.abs(x) - hx, Math.abs(z) - hz);
function height(x, z) {
  const d = Math.hypot(x, z);
  const hills = BASE + fbm(x * 0.0011 + 2, z * 0.0011, 4) * 60 * smooth(60, 500, d) + fbm(x * 0.006, z * 0.006, 3) * 6 * smooth(30, 200, d) + smooth(300, 1800, d) * 60;
  const terrace = smooth(120, 46, d + fbm(x * 0.02, z * 0.02, 2) * 14); // levelled precinct
  let h = lerp(hills, BASE - 0.15, terrace);
  // sunken pool south of the temple
  const pd = inRect(x - 0, z - 38, 13.5, 6.5); h -= 1.25 * (1 - smooth(-0.6, 0.6, pd));
  return h;
}
function platformY(x, z) { // top surface of the stepped base, or null outside it
  for (let s = NSTEP - 1; s >= 0; s--) { const g = (NSTEP - 1 - s) * 0.55; if (inRect(x, z, PX + g, PZ + g) < 0) return BASE + (s + 1) * STEP; }
  return null;
}

function flutedColumn(h, r = 0.78, broken = false, seed = 1) {
  const g = new THREE.CylinderGeometry(r * 0.84, r, h, 40, Math.max(2, Math.round(h * 1.2)), false); const p = g.attributes.position; const rn = rng(seed);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const rad = Math.hypot(x, z); if (rad < 0.05) { if (broken && y > 0) p.setY(i, y - rn() * 0.25); continue; } const a = Math.atan2(z, x); const fl = 1 - 0.045 * Math.pow(Math.abs(Math.sin(a * 10)), 0.6); const t = (y + h / 2) / h; const ent = 1 + 0.035 * Math.sin(Math.min(t, 1) * Math.PI);
    let ny = y; if (broken && y > h / 2 - 0.01) ny = y - (0.15 + 0.5 * (0.5 + 0.5 * simplex2(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3))) * 1.0;
    p.setXYZ(i, x * fl * ent, ny, z * fl * ent); }
  g.translate(0, h / 2, 0); g.computeVertexNormals(); return g;
}

export default {
  defaults: { time: 'sunrise', weather: 'fair', lat: 37, decl: 15, north: 2.05, ground: [0.06, 0.08, 0.04], sky: { cloudBase: 1500, cirrus: 0.3, fogDensity: 0.0011, fogFalloff: 0.05, fogBase: BASE, hazeMul: 1.4 } },
  async create(app) {
    const group = new THREE.Group(), env = app.env, fx = app.fx; const r = rng(53);
    const hf = new Heightfield({ size: SZ, res: Q.level >= 1 ? 768 : 512, fn: height, detail: { amp: 0.1, freq: 0.12, slopeAmp: 0.8 } });
    const way = (x, z) => Math.abs(x) < 3.4 && z > PZ + 2 && z < 150 ? 1 : 0;
    const mask = makeMask(SZ, 1024, (x, z, o) => { const d = Math.hypot(x, z); o[0] = Math.max(way(x, z), 1 - smooth(-1, 3, inRect(x, z, PX + 4, PZ + 4)), 1 - smooth(0, 2.5, inRect(x, z - 38, 15.5, 8.5))); o[1] = smooth(130, 40, d); o[2] = 0; o[3] = 1; });
    const terrain = new Terrain(app, hf, { mask, shadow: false,
      layers: [{ d: 'grass_d.jpg', n: 'grass_n.jpg', scale: 3.4, rough: 0.92, tint: [0.95, 1.1, 0.72] }, { d: 'rock23_d.jpg', n: 'rock23_n.jpg', scale: 5, rough: 0.9, tint: [0.78, 0.76, 0.72] }, { d: 'forest_d.jpg', n: 'forest_n.jpg', scale: 3.2, rough: 0.95, tint: [0.85, 0.8, 0.7] }, { d: 'paving_d.jpg', n: 'paving_n.jpg', scale: 3.0, rough: 0.85, tint: [0.92, 0.9, 0.82] }],
      rule: `float rk = smoothstep(0.45, 0.65, slope + (n2 - 0.5)*0.14); float pv = smoothstep(0.35, 0.75, mk.r + (n2 - 0.5)*0.7 + (n3 - 0.5)*0.2);
             float wood = smoothstep(0.4, 0.62, n1 + (1.0 - mk.g)*0.25)*(1.0 - rk);
             lw = vec4((1.0 - wood)*(1.0 - rk), rk*1.3, wood, 0.0); lw = mix(lw, vec4(0.25*(1.0 - pv), 0.0, 0.0, 1.2), pv);` });
    group.add(terrain.group);

    // ---------- architecture ----------
    const stone = [], marble = [], colliders = [];
    const B = (c, s, list = stone, ry = 0, rx = 0, rz = 0) => { const b = new THREE.BoxGeometry(...s); b.deleteAttribute('uv'); const g = b.toNonIndexed(); if (rx || rz) { g.rotateX(rx); g.rotateZ(rz); } if (ry) g.rotateY(ry); g.translate(...c); list.push(g); };
    for (let s = 0; s < NSTEP; s++) { const gI = (NSTEP - 1 - s) * 0.55; B([0, BASE + (s + 0.5) * STEP - (s === 0 ? 0.5 : 0), 0], [(PX + gI) * 2, STEP + (s === 0 ? 1 : 0), (PZ + gI) * 2]); }
    const top = BASE + NSTEP * STEP; const colH = 9.2; const cols = [];
    const NX = 11, NZ = 6; const sx = (PX - 1.5) * 2 / (NX - 1), sz = (PZ - 1.5) * 2 / (NZ - 1);
    const full = new Set();
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { if (i > 0 && i < NX - 1 && j > 0 && j < NZ - 1) continue; const x = -(PX - 1.5) + i * sx, z = -(PZ - 1.5) + j * sz; const k = r();
      // the south-west corner still stands; the north-east has mostly fallen
      const stand = k < 0.42 + 0.4 * smooth(6, -10, x) * (z > 0 ? 1 : 0.6) + (i <= 3 && j === NZ - 1 ? 0.5 : 0);
      const h = stand ? colH : k < 0.9 ? 1.2 + r() * 4.5 : 0; if (h <= 0) continue;
      const g = flutedColumn(h, 0.78, !stand, i * 7 + j); g.deleteAttribute('uv'); const gg = g.toNonIndexed(); gg.translate(x, top + 0.3, z); marble.push(gg);
      B([x, top + 0.15, z], [2.0, 0.3, 2.0], marble);
      if (stand) { B([x, top + 0.3 + colH + 0.16, z], [1.75, 0.32, 1.75], marble); const e = new THREE.CylinderGeometry(0.86, 0.68, 0.34, 28); e.deleteAttribute('uv'); const ee = e.toNonIndexed(); ee.translate(x, top + 0.3 + colH - 0.17, z); marble.push(ee); full.add(i + ',' + j); }
      cols.push([x, z, h, stand]); colliders.push({ t: 'cyl', x, z, r: 0.95, y0: top, y1: top + 0.3 + h + (stand ? 0.6 : 0), top: !stand });
    }
    // architrave and frieze wherever two neighbours still stand
    const yA = top + 0.3 + colH + 0.32;
    const span = (i0, j0, i1, j1) => { if (!full.has(i0 + ',' + j0) || !full.has(i1 + ',' + j1)) return; const x0 = -(PX - 1.5) + i0 * sx, z0 = -(PZ - 1.5) + j0 * sz, x1 = -(PX - 1.5) + i1 * sx, z1 = -(PZ - 1.5) + j1 * sz; const L = Math.hypot(x1 - x0, z1 - z0) + 1.6; const ry = Math.atan2(-(z1 - z0), x1 - x0);
      B([(x0 + x1) / 2, yA + 0.5, (z0 + z1) / 2], [L, 1.0, 1.5], marble, ry); B([(x0 + x1) / 2, yA + 1.45, (z0 + z1) / 2], [L, 0.9, 1.35], marble, ry); B([(x0 + x1) / 2, yA + 2.02, (z0 + z1) / 2], [L + 0.3, 0.24, 1.9], marble, ry);
      colliders.push({ t: 'box', x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: L / 2, hz: 0.95, rot: -ry, y0: yA - 0.4, y1: yA + 2.2 }); };
    for (let i = 0; i < NX - 1; i++) { span(i, 0, i + 1, 0); span(i, NZ - 1, i + 1, NZ - 1); } for (let j = 0; j < NZ - 1; j++) { span(0, j, 0, j + 1); span(NX - 1, j, NX - 1, j + 1); }
    // cella: ragged block walls
    const wall = (x0, z0, x1, z1, hMax, seed, gap = null) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 1.25), ry = Math.atan2(-(z1 - z0), x1 - x0); const rows = Math.round(hMax / 0.62); const rn = rng(seed);
      const prof = []; for (let k = 0; k < n; k++) prof.push(clamp(0.25 + 0.75 * (0.5 + 0.5 * simplex2(k * 0.23 + seed, seed * 1.7)) + (rn() - 0.5) * 0.2));
      for (let row = 0; row < rows; row++) for (let k = 0; k < n; k++) { if (row / rows > prof[k]) continue; const t = (k + 0.5 + (row % 2 ? 0.5 : 0)) / n; if (t > 1) continue; if (gap && t > gap[0] && t < gap[1] && row < gap[2]) continue; const x = lerp(x0, x1, t), z = lerp(z0, z1, t); const j = (rn() - 0.5) * 0.05;
        B([x + j, top + 0.31 + row * 0.62, z + j], [L / n - 0.02, 0.6, 1.1 + (rn() - 0.5) * 0.06], stone, ry + (rn() - 0.5) * 0.012); }
      const hAvg = hMax * 0.7; colliders.push({ t: 'box', x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: L / 2, hz: 0.6, rot: -ry, y0: top, y1: top + hAvg, top: false, gap }); };
    const cx = PX - 5.2, cz = PZ - 4.4; wall(-cx, -cz, cx, -cz, 8.4, 3); wall(-cx, cz, cx, cz, 7.4, 5, null); wall(-cx, -cz, -cx, cz, 8, 7); wall(cx, -cz, cx * 1.0, -1.6, 7, 9); wall(cx, 1.6, cx, cz, 6.2, 11);
    // processional way: flanking pedestals, a gate of two piers and a lintel, an altar
    for (let k = 0; k < 9; k++) for (const s of [-1, 1]) { const z = PZ + 14 + k * 13, x = s * 6.2; if (r() < 0.18) continue; const hh = 1.1 + (r() < 0.35 ? 1.6 + r() * 1.2 : 0); B([x, hf.heightAt(x, z) + hh / 2 - 0.1, z], [1.5, hh, 1.5], stone, (r() - 0.5) * 0.15); colliders.push({ t: 'box', x, z, hx: 0.8, hz: 0.8, rot: 0, y0: BASE - 2, y1: hf.heightAt(x, z) + hh }); }
    const gz = PZ + 132; for (const s of [-1, 1]) { B([s * 4.6, hf.heightAt(s * 4.6, gz) + 3.6, gz], [2.4, 7.6, 2.6]); colliders.push({ t: 'box', x: s * 4.6, z: gz, hx: 1.3, hz: 1.4, rot: 0, y0: BASE - 3, y1: BASE + 9, top: false }); }
    B([0, hf.heightAt(0, gz) + 8.0, gz], [12.4, 1.3, 2.9]); B([0, hf.heightAt(0, gz) + 9.0, gz], [13.2, 0.7, 3.3], marble);
    B([0, hf.heightAt(0, PZ + 8) + 0.6, PZ + 8], [2.6, 1.3, 1.6], marble); colliders.push({ t: 'box', x: 0, z: PZ + 8, hx: 1.4, hz: 0.9, rot: 0, y0: BASE - 1, y1: BASE + 1.35 });
    // pool kerb
    for (const [x, z, sxx, szz] of [[0, 38 - 7.1, 28.6, 0.9], [0, 38 + 7.1, 28.6, 0.9], [-14.1, 38, 0.9, 13.4], [14.1, 38, 0.9, 13.4]]) B([x, BASE + 0.02, z], [sxx, 0.7, szz], marble);
    // fallen drums and blocks
    const drumGeo = flutedColumn(1.5, 0.78, true, 99); drumGeo.rotateZ(Math.PI / 2); drumGeo.translate(0, 0.7, 0); drumGeo.deleteAttribute('uv');
    const debris = [];
    for (let i = 0; i < 46; i++) { const a = r() * 6.283, d = 13 + r() * 30; const x = Math.cos(a) * d * 1.5, z = Math.sin(a) * d * 0.9 - 2; if (way(x, z) || inRect(x, z, PX + 1.5, PZ + 1.5) < 0 || inRect(x, z - 38, 15, 8) < 0) continue; const y = hf.heightAt(x, z);
      if (r() < 0.5) { const g = drumGeo.clone().toNonIndexed(); g.rotateY(r() * 6.28); g.rotateZ((r() - 0.5) * 0.25); g.translate(x, y - 0.22, z); marble.push(g); colliders.push({ t: 'cyl', x, z, r: 1.0, y0: y - 1, y1: y + 1.3 }); }
      else { const s = 0.7 + r() * 1.1; B([x, y + s * 0.22, z], [s * 1.7, s * 0.7, s], r() < 0.5 ? stone : marble, r() * 6.28, (r() - 0.5) * 0.5, (r() - 0.5) * 0.4); colliders.push({ t: 'cyl', x, z, r: s * 0.8, y0: y - 1, y1: y + s * 0.6 }); } }
    const stoneM = triMat({ d: 'block_d.jpg', scale: 3.1, tint: [0.95, 0.93, 0.86], world: true, top: 'moss_d.jpg', topAmt: 0.62, topTint: [0.62, 0.82, 0.42], topScale: 1.8, bump: 1.8 });
    const marbleM = triMat({ d: 'sandsoft_d.jpg', scale: 2.6, tint: [1.12, 1.08, 0.98], world: true, top: 'moss_d.jpg', topAmt: 0.5, topTint: [0.66, 0.84, 0.44], topScale: 1.8, bump: 0.7, rough: 0.72 });
    for (const [list, mat] of [[stone, stoneM], [marble, marbleM]]) { const m = new THREE.Mesh(mergeGeometries(list), mat); m.geometry.computeVertexNormals(); m.castShadow = m.receiveShadow = true; group.add(m); }
    // still water in the pool
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(27.4, 13.4), new THREE.MeshStandardMaterial({ color: 0x0c1a16, roughness: 0.04, metalness: 0, normalMap: tex('waternormals.jpg'), normalScale: new THREE.Vector2(0.05, 0.05), envMapIntensity: 1.6 }));
    pool.material.normalMap.repeat?.set(3, 1.5); pool.material.defines = Object.assign(pool.material.defines || {}, { NO_WEATHER: 1 }); pool.rotation.x = -Math.PI / 2; pool.position.set(0, BASE - 0.42, 38); pool.receiveShadow = true; group.add(pool);

    // ---------- vegetation taking the place back ----------
    const inPrecinct = (x, z) => Math.hypot(x, z) < 52;
    const hardscape = (x, z) => inRect(x, z, PX + 1.8, PZ + 1.8) < 0 || inRect(x, z - 38, 14.6, 7.6) < 0;
    const forest = new Forest(app, hf, { cell: 36, near: 90, far: 1400, perCell: 15, unit: 0.22, seed: 33,
      density: (x, z, h, sl) => { if (hardscape(x, z) || way(x, z) || sl > 0.7) return 0; const d = Math.hypot(x, z); return d < 52 ? 0.07 : 0.85 * smooth(46, 95, d) * (0.5 + 0.5 * smooth(-0.3, 0.3, fbm(x * 0.008, z * 0.008, 2))); },
      variants: [{ model: 'oak_a', scale: [0.85, 1.15], weight: 2.5, trunk: 2 }, { model: 'oak_b', scale: [0.9, 1.3], weight: 3 }, { model: 'ash_a', scale: [0.8, 1.05], weight: 2 }, { model: 'ash_b', scale: [0.8, 1.1], weight: 2 }, { model: 'oak_c', scale: [1.0, 1.5], weight: 2 }, { model: 'pine_b', scale: [1.1, 1.5], weight: 1.2 }, { model: 'aspen_b', scale: [0.8, 1.1], weight: 0.6, leafTint: 0xb8d070 }] });
    await forest.init(); group.add(forest.group);
    // one tree has rooted in the cella floor
    const layers = [];
    const sap = cardMat(0xcfe0a8, 64), spr = cardMat(0xa9c47c, 64);
    const platHf = { heightAt: (x, z) => platformY(x, z) ?? hf.heightAt(x, z), slope: (x, z) => hf.slope(x, z), normalAt: (x, z, o) => platformY(x, z) != null ? o.set(0, 1, 0) : hf.normalAt(x, z, o) };
    layers.push(new Layer(platHf, { parts: [{ geo: cardGeo('sapling', 3, 1.5, 2.4, 0.1), ...sap }], cell: 12, radius: 64, perCell: 5, cap: 900, scale: [0.6, 1.7], seed: 101, place: (x, z) => inRect(x, z - 38, 14.6, 7.6) < 0 || way(x, z) ? 0 : platformY(x, z) != null ? (Math.abs(x) > PX - 5.2 || Math.abs(z) > PZ - 4.4 ? 0.05 : 0.25) : 0.5 }));
    layers.push(new Layer(platHf, { parts: [{ geo: cardGeo('spray', 4, 1.8, 1.05, 0.3), ...spr }], cell: 10, radius: 64, perCell: 7, cap: 1800, scale: [0.5, 1.5], seed: 102, tilt: 0.3, place: (x, z) => inRect(x, z - 38, 14.6, 7.6) < 0 ? 0 : way(x, z) ? 0.06 : platformY(x, z) != null ? 0.3 : 0.7 }));
    layers.push(grassLayer(platHf, { tint: [0.34, 0.47, 0.15], radius: 44, density: 8, h: 0.5, place: (x, z) => inRect(x, z - 38, 14.4, 7.4) < 0 ? 0 : platformY(x, z) != null ? 0.22 : way(x, z) ? 0.3 : 0.92 }));
    const rockM = triMat({ d: 'rock23_d.jpg', scale: 2.4, tint: [0.72, 0.7, 0.66], top: 'moss_d.jpg', topAmt: 0.7, topTint: [0.66, 0.86, 0.46], bump: 1.6 });
    layers.push(new Layer(hf, { parts: [{ geo: rockGeo(41, 3, 0.62), mat: rockM }], cell: 40, radius: 260, perCell: 5, cap: 700, scale: [0.4, 2.4], seed: 103, yOff: -0.14, tilt: 0.5, collide: 0.85, place: (x, z, h, sl) => inPrecinct(x, z) ? 0 : 0.25 + sl * 0.8 }));
    for (const l of layers) group.add(l.group);
    // ivy: sprays pinned flat against wall faces and column shafts
    { const g = cardGeo('spray', 1, 2.6, 2.1, 0); const iv = new THREE.InstancedMesh(g, spr.mat, 420); iv.customDepthMaterial = spr.depthMat; iv.castShadow = true; iv.receiveShadow = true; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(); let n = 0;
      const put = (x, y, z, ry, sc, flip) => { if (n >= 420) return; e.set(flip ? Math.PI : 0, ry, (r() - 0.5) * 0.6); q.setFromEuler(e); s.setScalar(sc); p.set(x, y, z); m.compose(p, q, s); iv.setMatrixAt(n++, m); };
      for (const c of colliders) { if (c.t === 'box' && c.hx > 3 && c.y1 - c.y0 > 3) { const cs = Math.cos(-c.rot), sn = Math.sin(-c.rot); for (let k = 0; k < 16; k++) { const t = (r() - 0.5) * 2 * c.hx, side = r() < 0.5 ? 1 : -1, off = side * (c.hz + 0.06); const flip = r() < 0.35; put(c.x + t * cs + off * sn, flip ? c.y1 - r() * 1.5 : c.y0 + r() * 1.2, c.z - t * sn + off * cs, -c.rot + (side > 0 ? 0 : Math.PI), 0.7 + r() * 0.9, flip); } }
        else if (c.t === 'cyl' && c.y1 - c.y0 > 4 && r() < 0.55) { for (let k = 0; k < 3; k++) { const a = r() * 6.283; put(c.x + Math.cos(a) * 0.86, c.y0 + 0.2 + r() * 2.2, c.z + Math.sin(a) * 0.86, -a + Math.PI / 2, 0.5 + r() * 0.6, false); } } }
      iv.count = n; iv.instanceMatrix.needsUpdate = true; iv.frustumCulled = false; group.add(iv); }

    const mist = mistEmitter(app, { rate: 1.4, radius: 80, alpha: 0.07, size: [9, 20] }); const col = new THREE.Color(); let ff = 0;
    const world = {
      group, hf, terrain, shadowRange: 80, flySpeed: 12, bounds: 1700, ceiling: 600,
      spawn: { pos: [0.8, hf.heightAt(0.8, 58) + 1.7, 58], yaw: 0.0, pitch: 0.1 },
      pois: [
        { name: 'The temple', pos: (o) => o.set(0, top + 4.5, 0), dist: 44, el: 0.13, az: 1.25, min: 6, max: 400 },
        { name: 'Inside the cella', pos: (o) => o.set(0, top + 2.6, 0), dist: 4.6, el: 0.06, az: 2.6, min: 2, max: 5.2, fov: 66 },
        { name: 'The pool', pos: (o) => o.set(0, BASE + 0.6, 38), dist: 24, el: 0.12, az: 1.9, min: 5, max: 120 },
        { name: 'The gate', pos: (o) => o.set(0, BASE + 5, gz), dist: 26, el: 0.1, az: 1.3, min: 5, max: 160 },
      ],
      tours: [
        shots.path([[0.5, 1.7, 142], [0.3, 1.7, 110], [-0.4, 1.8, 70], [0.2, 2.0, 30]], { dur: 26, fov: 54, look: [0, top + 6, 0] }),
        shots.orbit([0, top + 4, 0], { r0: 46, r1: 34, a0: 1.9, a1: 3.4, h0: 3, h1: 9, dur: 22, fov: 46 }),
        shots.dolly([-PX + 2.2, top + 1.7, PZ - 1.5], [PX - 5, top + 1.9, PZ - 1.5], [PX, top + 5, PZ - 1.5], [PX + 10, top + 6, 0], { dur: 18, fov: 60 }),
        shots.dolly([16, BASE + 0.7, 50], [-12, BASE + 1.0, 49], [0, top + 5, 0], [0, top + 7, 0], { dur: 16, fov: 40 }),
        shots.orbit([0, top, 10], { r0: 90, r1: 120, a0: 0.3, a1: 1.3, h0: 40, h1: 62, dur: 20, fov: 48 }),
      ],
      ground: (x, z) => platformY(x, z) ?? hf.heightAt(x, z),
      waterAt: (x, z) => inRect(x, z - 38, 13.6, 6.6) < 0 ? BASE - 0.42 : null, walkOnWater: true,
      collide(p, rad) { pushOut(p, rad, colliders); forest.collide(p, rad); const it = layers[3].items; for (let i = 0; i < it.length; i += 4) { const dx = p.x - it[i], dz = p.z - it[i + 1], rr = it[i + 2] + rad; if (p.y < it[i + 3] + it[i + 2] * 0.7 && dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1; p.x = it[i] + dx / d * rr; p.z = it[i + 1] + dz / d * rr; } } },
      audio: {
        beds: ['birds', 'trees', 'crickets', 'drips', 'rain_leaves', 'jungle'], shelter: 0.55,
        mix: (e) => { const day = 1 - e.night, dry = 1 - smooth(0.05, 0.5, e.precipRain); return { birds: 0.7 * smooth(0.2, 0.7, day) * dry, jungle: 0.22 * day * dry, trees: 0.1 + 0.8 * Math.pow(clamp(e.windNow), 1.1), crickets: 0.55 * smooth(0.3, 0.9, e.night) * dry + 0.08 * day * dry, rain_leaves: 0.8 * smooth(0.05, 0.6, e.precipRain), drips: 0.05 + 0.5 * e.wetness }; },
        points: [{ file: 'drips', pos: [0, BASE, 38], gain: 0.5, ref: 5, roll: 1.4 }],
        shots: [{ files: ['owl'], every: [18, 50], gain: 0.5, dist: [40, 120], height: 14, when: (e) => e.night > 0.7 }, { files: ['woodpecker'], every: [30, 80], gain: 0.4, dist: [50, 120], height: 12, when: (e) => e.night < 0.2 && e.precipRain < 0.2 }, { files: ['crows'], every: [45, 110], gain: 0.3, dist: [60, 160], height: 22, when: (e) => e.night < 0.3, slice: [40, 7] }],
      },
      update(dt, t) {
        const cam = app.camera.position; terrain.update(cam); forest.update(cam); for (const l of layers) l.update(cam);
        const dawn = smooth(0.3, 0.02, Math.abs(env.sunElev)); mist(dt, clamp(0.2 + dawn * 0.9 + env.w.fog * 1.2 + env.wetness * 0.5), cam, world.ground);
        // fireflies after dusk
        ff += dt * 16 * smooth(0.25, 0.8, env.night) * (1 - env.precipRain);
        while (ff > 1) { ff -= 1; const a = r() * 6.283, d = 3 + r() * 40, x = cam.x + Math.cos(a) * d, z = cam.z + Math.sin(a) * d; const g = world.ground(x, z); fx.emit({ x, y: g + 0.4 + r() * 2.5, z, vx: (r() - 0.5) * 0.7, vy: (r() - 0.3) * 0.3, vz: (r() - 0.5) * 0.7, life: 2.5 + r() * 3, s0: 0.05, s1: 0.05, a: 1, r: 0.12, g: 0.17, b: 0.03, add: 1, drag: 0.1, wind: 0.1, frame: -1, fin: 0.35 }); }
      },
      dispose() { terrain.dispose(); forest.dispose(); for (const l of layers) l.dispose(); hf.dispose(); mask.dispose(); },
    };
    return world;
  },
};
