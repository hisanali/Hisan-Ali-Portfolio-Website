// Frontier scenery, after the Eight Worlds landscapes: the cape lighthouse, the temple ruins, the crater's lava lake and
// smoke, Mirror Lake with its cabin and jetty, the dune outpost, the alpine lodge and cable car, the fishing village of
// Fjordheim with its boats and waterfalls, the fjord-mouth lookout, and the Eight Worlds brig sailing offshore.
import * as THREE from '/evermile/vendor/three.module.js';
import { rng, splitChunks } from './city.js';
import { buildShip } from './brig.js';
import { VOLCANO, LAKE } from './frontier-land.js';
import { weather } from './weathering.js';

const TEX = '/eight-worlds/assets/tex/', TAU = Math.PI * 2;
const loader = new THREE.TextureLoader();
const load = (n, srgb = true) => { const t = loader.load(TEX + n); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// World-space (triplanar) texturing, so stone and timber keep their scale on boxes of any size.
function triplanar(map, scale, rough = 0.85) {
  const m = new THREE.MeshStandardMaterial({ map, roughness: rough, envMapIntensity: 0.45 });
  m.onBeforeCompile = sh => { sh.uniforms.tpScale = { value: scale };
    sh.vertexShader = 'varying vec3 tpW; varying vec3 tpN;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vec4 tpP = vec4(transformed, 1.0); vec3 tpn = objectNormal;
  #ifdef USE_INSTANCING
  tpP = instanceMatrix * tpP; tpn = mat3(instanceMatrix) * tpn;
  #endif
  tpW = (modelMatrix * tpP).xyz; tpN = normalize(mat3(modelMatrix) * tpn);`);
    sh.fragmentShader = 'uniform float tpScale; varying vec3 tpW; varying vec3 tpN;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
  vec3 tpB = pow(abs(normalize(tpN)), vec3(4.0)); tpB /= dot(tpB, vec3(1.0));
  diffuseColor *= texture2D(map, tpW.zy * tpScale) * tpB.x + texture2D(map, tpW.xz * tpScale) * tpB.y + texture2D(map, tpW.xy * tpScale) * tpB.z;`); };
  m.customProgramCacheKey = () => 'afterdark-triplanar';
  return m;
}

// A gable roof: ridge along z, base at y = 0, unit size.
function prismGeometry() {
  const g = new THREE.BufferGeometry(), p = [], n = [], uv = [];
  const tri = (a, b, c) => { const ab = new THREE.Vector3().subVectors(b, a), ac = new THREE.Vector3().subVectors(c, a), nn = ab.cross(ac).normalize(); for (const v of [a, b, c]) { p.push(v.x, v.y, v.z); n.push(nn.x, nn.y, nn.z); uv.push(v.x + 0.5, v.y + v.z); } };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), A = V(-0.5, 0, -0.5), B = V(0.5, 0, -0.5), C = V(0, 1, -0.5), D = V(-0.5, 0, 0.5), E = V(0.5, 0, 0.5), F = V(0, 1, 0.5);
  tri(A, C, B); tri(D, E, F); tri(A, D, F); tri(A, F, C); tri(B, C, F); tri(B, F, E); tri(A, B, E); tri(A, E, D);
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export async function buildFrontier(scene, city, world, Q) {
  const R = rng(4242), terrain = world.terrain, solid = city.colliders, place = k => world.places.find(p => p.key === k);
  const out = { markers: world.places.filter(p => p.frontier), update: () => {}, setTime: () => {} }, updates = [], timers = [];
  const at = (pl, u, v) => [pl.x + pl.ux * u + pl.vx * v, pl.z + pl.uz * u + pl.vz * v];
  // ---- one instanced kit for all the simple solids ----
  const GEO = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), cone: new THREE.ConeGeometry(1, 1, 14), roof: prismGeometry(), dome: new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2) };
  const MAT = { paint: weather(new THREE.MeshStandardMaterial({ roughness: 0.75, envMapIntensity: 0.5 }), { seams: 0.5 }), metal: weather(new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.7, envMapIntensity: 0.8 }), { seams: 0 }),
    stone: triplanar(load('block_d.jpg'), 0.22), wood: triplanar(load('wood_d.jpg'), 0.35, 0.8), rock: triplanar(load('greyrock_d.jpg'), 0.12, 0.9), glow: new THREE.MeshBasicMaterial({ color: 0xffffff }), glass: new THREE.MeshStandardMaterial({ color: 0x223038, roughness: 0.08, metalness: 0.2, envMapIntensity: 1.4, emissive: 0xffd08a, emissiveIntensity: 0 }) };
  const parts = new Map(), col = new THREE.Color(), dummy = new THREE.Object3D();
  function put(geo, mat, x, y, z, sx, sy, sz, yaw = 0, color = 0xffffff, hard = false, pitch = 0, roll = 0) {
    const key = geo + '|' + mat; if (!parts.has(key)) parts.set(key, []); parts.get(key).push([x, y, z, sx, sy, sz, yaw, typeof color === 'number' ? new THREE.Color(color) : color, pitch, roll]);
    if (hard && sy > 1) { if (geo === 'cyl' || geo === 'cone') solid.push({ x, z, r: Math.max(sx, sz) * 1.02, bottom: y - sy / 2, top: y + sy / 2, kind: 'frontier' }); else solid.push({ x, z, w: sx, d: sz, ux: Math.cos(yaw), uz: -Math.sin(yaw), bottom: y - sy / 2, top: y + sy / 2, kind: 'frontier' }); }
  }
  const box = (x, y, z, sx, sy, sz, yaw, c, mat = 'paint', hard = true) => put('box', mat, x, y, z, sx, sy, sz, yaw, c, hard);
  const cyl = (x, y, z, r, h, c, mat = 'paint', hard = true) => put('cyl', mat, x, y, z, r, h, r, 0, c, hard);
  const roof = (x, y, z, w, h, d, yaw, c) => put('roof', 'paint', x, y, z, w, h, d, yaw, c);
  const glow = (x, y, z, sx, sy, sz, yaw, c) => put('box', 'glow', x, y, z, sx, sy, sz, yaw, c);
  // A house with a pitched roof and lit windows; returns its footprint.
  function house(x, z, y, w, d, h, yaw, wall, roofC, mat = 'paint', lit = 0.7) {
    box(x, y + h / 2 - 0.4, z, w, h + 0.8, d, yaw, wall, mat); roof(x, y + h, z, w + 0.9, Math.min(w, d) * 0.55, d + 0.9, yaw, roofC);
    const cs = Math.cos(yaw), sn = Math.sin(yaw), P = (ox, oz) => [x + cs * ox + sn * oz, z - sn * ox + cs * oz];
    box(x, y - 0.15, z, w + 0.35, 0.9, d + 0.35, yaw, 0x8a857c, 'stone', false); // plinth
    const nw = Math.max(1, Math.floor(d / 3.2));
    for (const side of [-1, 1]) for (let k = 0; k < nw; k++) { const along = (k + 0.5) * d / nw - d / 2, ox = side * (w / 2 + 0.03), [lx, lz] = P(ox, along), [fx, fz] = P(side * (w / 2 + 0.04), along);
      box(fx, y + h * 0.55, fz, 0.04, 1.35, 1.25, yaw, 0xf2efe8, 'paint', false); // white frame (pane sits in front of it) and sill
      box(fx + cs * side * 0.05, y + h * 0.55 - 0.72, fz - sn * side * 0.05, 0.16, 0.1, 1.4, yaw, 0xf2efe8, 'paint', false);
      const gx = lx + cs * side * 0.085, gz = lz - sn * side * 0.085; if (R() < lit) glow(gx, y + h * 0.55, gz, 0.02, 1.1, 1.0, yaw, 0xffc884); else box(gx, y + h * 0.55, gz, 0.02, 1.1, 1.0, yaw, 0x1d2328, 'metal', false); }
    { const [dx, dz] = P(0, d / 2 + 0.05); box(dx, y + 1.05, dz, 1.1, 2.1, 0.12, yaw, 0x5a3b28, 'wood', false); const [lx, lz] = P(0.95, d / 2 + 0.25); glow(lx, y + 2.3, lz, 0.18, 0.25, 0.18, yaw, 0xffd9a0); }
    if (R() < 0.7) { const [cx, cz] = P(w * 0.22, -d * 0.25); box(cx, y + h + Math.min(w, d) * 0.45, cz, 0.7, Math.min(w, d) * 0.6 + 1, 0.7, yaw, 0x6d6157, 'stone', false); }
  }

  // ---- Cape Lighthouse ----
  const cape = place('cape');
  let beam = null;
  if (cape) { let [tx, tz] = at(cape, 62, 0); for (let k = 0; k < 20 && terrain(tx, tz) < 30; k++) [tx, tz] = at(cape, 62 - k * 4, 0); const gy = terrain(tx, tz), yaw = cape.yaw;
    box(tx, gy + 0.6, tz, 10, 2.4, 10, yaw, 0xd8d4cc, 'stone');
    const H = 31, segs = 6; for (let k = 0; k < segs; k++) { const r0 = 3.4 - 1.1 * k / segs; cyl(tx, gy + 1.8 + (k + 0.5) * H / segs, tz, r0 - 0.09, H / segs, k % 2 ? 0xb3261e : 0xf2f0ea, 'paint', k === 0); }
    const top = gy + 1.8 + H; cyl(tx, top + 0.2, tz, 3.3, 0.4, 0x2a2c2e, 'metal', false); cyl(tx, top + 1.0, tz, 3.25, 1.2, 0x1c1d1f, 'metal', false);
    put('cyl', 'glass', tx, top + 2.2, tz, 1.9, 2.8, 1.9); put('cone', 'paint', tx, top + 4.6, tz, 2.4, 2.0, 2.4, 0, 0xb3261e); cyl(tx, top + 5.9, tz, 0.12, 1.2, 0x1c1d1f, 'metal', false);
    glow(tx, top + 2.2, tz, 1.2, 1.6, 1.2, 0, new THREE.Color(3.4, 3.0, 2.2));
    const [hx, hz] = at(cape, 62, 16); const hy = terrain(hx, hz); house(hx, hz, hy, 8, 12, 4.2, yaw, 0xf1eee6, 0x3a3f46); box(hx, hy + 6.3, hz + 3, 1.0, 2.2, 1.0, yaw, 0x8a7a6a);
    // the rotating beam: two long soft cones, visible after sunset
    const bm = new THREE.MeshBasicMaterial({ color: 0xfff1c8, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const cone = new THREE.ConeGeometry(11, 320, 24, 12, true); cone.translate(0, -160, 0); cone.rotateZ(Math.PI / 2); { const p = cone.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const f = Math.pow(Math.max(0, 1 - Math.abs(p.getX(i)) / 320), 2.2); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = f; } cone.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
    beam = new THREE.Group(); beam.position.set(tx, top + 2.2, tz); for (const s of [0, Math.PI]) { const m = new THREE.Mesh(cone, bm); m.rotation.y = s; beam.add(m); } scene.add(beam);
    updates.push(t => { beam.rotation.y = t * 0.7; }); timers.push(e => { bm.opacity = 0.09 * e.night; beam.visible = e.night > 0.05; });
    cape.lighthouse = { x: tx, z: tz, y: top }; }

  // ---- Temple of the Sun: a stepped pyramid, a broken colonnade and fallen drums, overgrown ----
  const temple = place('temple');
  if (temple) { const pl = temple, y = pl.y, yaw = pl.yaw, moss = new THREE.Color(1.1, 1.28, 0.92), sand = new THREE.Color(1.62, 1.48, 1.2);
    for (let k = 0; k < 5; k++) { const s = 62 - 12 * k, [x, z] = at(pl, 0, 0); box(x, y + 2.5 + 5 * k - 0.2, z, s, 5.4, s, yaw, k % 2 ? sand : moss, 'stone'); }
    for (let j = 0; j < 25; j++) { const [x, z] = at(pl, 0, -33 + (j + 0.5) * 1.1); box(x, y + (j + 1) / 2 + 0.035, z, 10, j + 1, 1.15, yaw, sand, 'stone', j < 3); }
    { const [x, z] = at(pl, 0, 0); box(x, y + 27.5, z, 8, 5, 8, yaw, sand, 'stone', false); box(x, y + 30.4, z, 10.5, 0.9, 10.5, yaw, sand, 'stone', false); const [dx, dz] = at(pl, 0, -4.05); glow(dx, y + 26.7, dz, 2.2, 3, 0.1, yaw, new THREE.Color(2.4, 1.1, 0.35)); }
    for (const u of [-6.5, 6.5]) { const [x, z] = at(pl, u, -36); cyl(x, y + 1.2, z, 0.14, 2.4, 0x3a2c20); glow(x, y + 2.6, z, 0.5, 0.7, 0.5, 0, new THREE.Color(3, 1.3, 0.3)); }
    for (let v = -108; v <= -46; v += 9) for (const u of [-10, 10]) { const [x, z] = at(pl, u, v), broken = R() < 0.35, h = broken ? 2 + R() * 4.5 : 8.5; cyl(x, y + h / 2, z, 0.85, h, broken ? moss : sand, 'stone');
      if (!broken) box(x, y + h + 0.35, z, 2.3, 0.7, 2.3, yaw, sand, 'stone', false); else if (R() < 0.7) { const [fx, fz] = at(pl, u + (u > 0 ? 3.5 : -3.5) + R() * 2, v + R() * 4); put('cyl', 'stone', fx, y + 0.8, fz, 0.8, 1.6 + R() * 1.6, 0.8, yaw + R(), sand, false, 0, Math.PI / 2); } }
    for (let v = -108; v <= -55; v += 18) { const [x, z] = at(pl, 0, v + 4.5); if (R() < 0.6) for (const u of [-10, 10]) { const [lx, lz] = at(pl, u, v + 4.5); box(lx, y + 9.1, lz, 1.4, 0.9, 10.5, yaw, sand, 'stone', false); } }
    for (let k = 0; k < 14; k++) { const a = R() * TAU, r = 48 + R() * 46, [x, z] = at(pl, Math.cos(a) * r, Math.sin(a) * r); if (Math.abs(Math.cos(a) * r) < 16 && Math.sin(a) < 0) continue; box(x, terrain(x, z) + 1, z, 3 + R() * 9, 1.4 + R() * 2.2, 1.2 + R() * 1.2, yaw + (R() < 0.5 ? 0 : Math.PI / 2), R() < 0.5 ? moss : sand, 'stone'); } }

  // ---- The crater: a lava lake, a smoking vent and a lookout hut at the rim ----
  { const g = new THREE.CircleGeometry(190, 64); g.rotateX(-Math.PI / 2);
    const lavaTex = load('lavatile.jpg'); lavaTex.repeat.set(3.2, 3.2); lavaTex.rotation = 0.6;
    const lm = new THREE.MeshBasicMaterial({ map: lavaTex, color: new THREE.Color(2.6, 1.0, 0.36) }), lake = new THREE.Mesh(g, lm); lake.position.set(VOLCANO.x, VOLCANO.lava, VOLCANO.z); scene.add(lake);
    const smokeT = loader.load(TEX + 'smoke.png'); smokeT.colorSpace = THREE.SRGBColorSpace; const puffs = [];
    for (let k = 0; k < 26; k++) { const m = new THREE.SpriteMaterial({ map: smokeT, color: 0x8c8580, transparent: true, opacity: 0.5, depthWrite: false }), s = new THREE.Sprite(m); s.userData = { ph: k / 26, a: R() * TAU, r: R() * 60 }; scene.add(s); puffs.push(s); }
    updates.push(t => { lavaTex.offset.set(t * 0.004, Math.sin(t * 0.05) * 0.02); for (const s of puffs) { const f = (t * 0.018 + s.userData.ph) % 1, size = 60 + f * 300; s.position.set(VOLCANO.x + Math.cos(s.userData.a) * s.userData.r + f * 260, VOLCANO.lava + 20 + f * 520, VOLCANO.z + Math.sin(s.userData.a) * s.userData.r + f * 120); s.scale.set(size, size, 1); s.material.opacity = 0.42 * Math.sin(f * Math.PI); s.material.rotation = s.userData.a + f; } });
    timers.push(e => { s0(e); }); const s0 = e => { const k = 0.55 + 0.45 * (1 - e.night); for (const s of puffs) s.material.color.setRGB(0.55 * k + 0.25 * e.night, 0.52 * k + 0.08 * e.night, 0.5 * k); };
    const rim = place('crater'); if (rim) { const [x, z] = at(rim, 14, 22), y = terrain(x, z); box(x, y + 1.5, z, 6, 3, 4, rim.yaw, 0x8f8a84, 'rock'); box(x, y + 3.2, z, 6.8, 0.4, 4.8, rim.yaw, 0x3a3a3a); glow(x, y + 1.8, z, 6.1, 0.8, 0.05, rim.yaw, 0xffc884); } }

  // ---- Mirror Lake: still water, a log cabin on the bluff and a jetty ----
  { const g = new THREE.PlaneGeometry(LAKE.rx * 2.32, LAKE.rz * 2.32, 96, 84); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, colors = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const depth = LAKE.level - terrain(LAKE.x + x, LAKE.z + z);
      const opacity = Math.hypot(x / LAKE.rx, z / LAKE.rz) > 1.14 ? 0 : THREE.MathUtils.smoothstep(depth, -.12, 2.8);
      colors.push(1, 1, 1, opacity);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    const nrm = load('waternormals.jpg', false); nrm.repeat.set(26, 26);
    const wm = new THREE.MeshPhysicalMaterial({ color: 0x0b2427, transparent: true, vertexColors: true, depthWrite: false, roughness: 0.03, metalness: 0, ior: 1.333, normalMap: nrm, normalScale: new THREE.Vector2(0.12, 0.12), envMapIntensity: 1.1 });
    const water = new THREE.Mesh(g, wm); water.position.set(LAKE.x, LAKE.level, LAKE.z); water.receiveShadow = true; scene.add(water); world.lake = { ...LAKE, mesh: water };
    updates.push(t => { nrm.offset.set(t * 0.003, t * 0.0021); });
    const cab = place('cabin'); if (cab) { const yaw = cab.yaw, y = cab.y; house(cab.x, cab.z, y, 7, 9.5, 3.4, yaw, 0xffffff, 0x3b2f27, 'wood', 0.9); box(cab.x + Math.cos(yaw) * 2.6, y + 5.4, cab.z - Math.sin(yaw) * 2.6, 1.1, 2.6, 1.1, yaw, 0x6d6157, 'rock');
      let dx = LAKE.x - cab.x, dz = LAKE.z - cab.z; const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl; let sx = cab.x, sz = cab.z; for (let k = 0; k < 120 && terrain(sx, sz) > LAKE.level - 0.2; k++) { sx += dx * 2; sz += dz * 2; }
      const jyaw = Math.atan2(dx, dz); cab.jetty = { x: sx, z: sz, dx, dz, level: LAKE.level }; // the wooden pier itself streams in with the props (props.js)
      const bx = sx + dx * 30 + dz * 3.4, bz = sz + dz * 30 - dx * 3.4; box(bx, LAKE.level + 0.2, bz, 1.4, 0.5, 4.2, jyaw, 0x8b2f24, 'paint', false); box(bx, LAKE.level + 0.42, bz, 1.0, 0.1, 3.4, jyaw, 0x6b5642, 'wood', false); } }

  // ---- Dune Outpost: fuel under a canopy, a diner with a neon sign, a water tower and a wind turbine ----
  const outpost = place('outpost'); let rotor = null;
  if (outpost) { const pl = outpost, y = pl.y, yaw = pl.yaw;
    for (const [u, v] of [[-7, -6], [7, -6], [-7, 6], [7, 6]]) { const [x, z] = at(pl, u, v); cyl(x, y + 2.8, z, 0.25, 5.6, 0xe9e4d8); }
    { const [x, z] = at(pl, 0, 0); box(x, y + 5.9, z, 18, 0.7, 14, yaw, 0xd9d4c8, 'paint', false); box(x, y + 6.4, z, 18.4, 0.35, 14.4, yaw, 0xc0392b, 'paint', false); glow(x, y + 5.5, z, 15, 0.06, 11, yaw, 0xfff1dc); }
    for (const u of [-3, 3]) { const [x, z] = at(pl, u, 0); box(x, y + 0.9, z, 0.9, 1.8, 0.6, yaw, 0xc0392b); }
    { const [x, z] = at(pl, 0, 20); box(x, y + 2.2, z, 16, 4.4, 8, yaw, 0xe8dcc0); box(x, y + 4.6, z, 16.8, 0.5, 8.8, yaw, 0x8a5a3c, 'paint', false); const [sx, sz] = at(pl, 0, 15.9); glow(sx, y + 5.6, sz, 9, 1.1, 0.12, yaw, new THREE.Color(0.4, 2.6, 2.8)); glow(sx, y + 2.1, sz, 12, 1.3, 0.05, yaw, 0xffd08a); }
    { const [x, z] = at(pl, 22, 14); for (const [a, b] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) cyl(x + a, y + 6, z + b, 0.18, 12, 0x6a6058, 'metal'); cyl(x, y + 14, z, 3.2, 4.2, 0x9a8f82, 'metal', false); put('cone', 'metal', x, y + 16.8, z, 3.4, 1.4, 3.4, 0, 0x6a6058); }
    { const [x, z] = at(pl, -26, 26), ty = terrain(x, z); cyl(x, ty + 16, z, 0.9, 32, 0xf0f0f0); box(x, ty + 32.3, z, 1.6, 1.6, 4, yaw, 0xf0f0f0, 'paint', false);
      rotor = new THREE.Group(); rotor.position.set(x + Math.sin(yaw) * 2.2, ty + 32.3, z + Math.cos(yaw) * 2.2); rotor.rotation.y = yaw; const bladeM = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.5 }), bg = new THREE.BoxGeometry(0.5, 14, 0.18); bg.translate(0, 7, 0);
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(bg, bladeM); b.rotation.z = k * TAU / 3; b.castShadow = true; rotor.add(b); } scene.add(rotor); updates.push(t => { rotor.rotation.z = t * 1.4; }); }
    for (let k = 0; k < 3; k++) { const [x, z] = at(pl, -12 - k * 9, 34 + R() * 6); house(x, z, terrain(x, z), 5, 6, 2.8, yaw + R() * 0.3, 0xcbb894, 0x6e5a48); } }

  // ---- Alpine Lodge and a cable car to the ridge ----
  const lodge = place('lodge'); let gondola = null;
  if (lodge) { const pl = lodge, y = pl.y, yaw = pl.yaw; const [x, z] = at(pl, 0, 6);
    box(x, y + 1.5, z, 24, 3, 13, yaw, 0xb8b2a6, 'stone'); box(x, y + 5.5, z, 24, 5, 13, yaw, 0xffffff, 'wood'); roof(x, y + 8, z, 14.6, 6.5, 26.5, yaw + Math.PI / 2, 0x2f2a26);
    for (let k = 0; k < 7; k++) { const [wx, wz] = at(pl, -10.5 + k * 3.5, -0.55); glow(wx, y + 5.6, wz, 1.6, 1.8, 0.08, yaw, 0xffc884); glow(wx, y + 1.8, wz, 1.6, 1.2, 0.08, yaw, 0xffd9a0); }
    for (let k = 0; k < 4; k++) { const [hx, hz] = at(pl, -40 + k * 26, 30 + (k % 2) * 10); const hy = terrain(hx, hz); if (Math.abs(hy - y) < 7) house(hx, hz, hy, 7, 9, 3.6, yaw + (k % 2) * 0.3, 0xffffff, 0x2f2a26, 'wood'); }
    // the cable climbs to the highest ground within reach on the far side of the road
    let best = null, bh = -1e9; for (let a = 0; a < 48; a++) { const ang = a / 48 * TAU, ex = x + Math.cos(ang) * 950, ez = z + Math.sin(ang) * 950; if ((ex - x) * pl.vx + (ez - z) * pl.vz < 200) continue; const h = terrain(ex, ez); if (h > bh) { bh = h; best = [ex, ez]; } }
    if (best) { const n = 6, pts = []; for (let k = 0; k <= n; k++) { const px = x + (best[0] - x) * k / n, pz = z + (best[1] - z) * k / n, gy = terrain(px, pz), h = k === 0 || k === n ? 8 : 18; if (k > 0 && k < n) { cyl(px, gy + h / 2, pz, 0.45, h, 0x4a4d52, 'metal'); box(px, gy + h, pz, 0.6, 0.6, 6, Math.atan2(best[0] - x, best[1] - z) + Math.PI / 2, 0x4a4d52, 'metal', false); } pts.push(new THREE.Vector3(px, gy + h, pz)); }
      const [ex, ez] = best, ey = terrain(ex, ez); box(ex, ey + 3, ez, 10, 6, 8, yaw, 0x8f8a84, 'rock'); roof(ex, ey + 6, ez, 11, 3, 9, yaw, 0x2f2a26);
      const curve = new THREE.CatmullRomCurve3(pts), lineG = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)); scene.add(new THREE.Line(lineG, new THREE.LineBasicMaterial({ color: 0x1a1c1f })));
      gondola = new THREE.Group(); const gm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 3.2), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.5, metalness: 0.2 })); gm.position.y = -2.6; gm.castShadow = true; gondola.add(gm);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5), new THREE.MeshStandardMaterial({ color: 0x333333 })); arm.position.y = -0.8; gondola.add(arm); scene.add(gondola);
      updates.push(t => { const f = (Math.sin(t * 0.045) + 1) / 2; curve.getPoint(f, gondola.position); }); } }

  // ---- Fjordheim: coloured houses on the shore, a church, a quay and moored boats ----
  const village = place('village'), boats = [];
  if (village) { const pl = village, PAL = [0x8e2b23, 0xa63a2a, 0xc89b3c, 0xe8e2d4, 0x5d6f7a, 0x8e2b23, 0xdfd3b8];
    let built = 0; for (let k = 0; k < 140 && built < 18; k++) { const a = R() * TAU, r = 34 + R() * 150, x = pl.x + Math.cos(a) * r, z = pl.z + Math.sin(a) * r, y = terrain(x, z);
      if (y < 2 || Math.abs(y - terrain(x + 6, z)) > 2.2 || Math.abs(y - terrain(x, z + 6)) > 2.2 || world.nearRoad(x, z, 11)) continue; const w = 5.5 + R() * 3, d = 7 + R() * 4; house(x, z, y - 0.1, w, d, 3.4 + R() * 2, Math.atan2(700 - x, 3470 - z) + (R() - 0.5) * 0.5, PAL[Math.floor(R() * PAL.length)], R() < 0.5 ? 0x26292c : 0x4a2a24); built++; }
    { let cx = pl.x, cz = pl.z, ok = false; for (let k = 0; k < 60 && !ok; k++) { const a = R() * TAU, r = 40 + R() * 90; cx = pl.x + Math.cos(a) * r; cz = pl.z + Math.sin(a) * r; ok = terrain(cx, cz) > 3 && !world.nearRoad(cx, cz, 14) && Math.abs(terrain(cx, cz) - terrain(cx + 8, cz + 8)) < 2; }
      if (ok) { const cy = terrain(cx, cz); house(cx, cz, cy, 8, 15, 6, 0.2, 0xf4f1ea, 0x26292c, 'paint', 0.5); box(cx + Math.sin(0.2) * 8.5, cy + 7, cz + Math.cos(0.2) * 8.5, 3.4, 14, 3.4, 0.2, 0xf4f1ea); put('cone', 'paint', cx + Math.sin(0.2) * 8.5, cy + 17, cz + Math.cos(0.2) * 8.5, 2.5, 6, 2.5, 0.2, 0x26292c); } }
    // the quay sits on the nearest shore toward the fjord head
    let dx = 700 - pl.x, dz = 3470 - pl.z; const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl; let sx = pl.x, sz = pl.z; for (let k = 0; k < 150 && terrain(sx, sz) > 0.4; k++) { sx += dx * 2; sz += dz * 2; }
    const qyaw = Math.atan2(dx, dz) + Math.PI / 2; pl.quay = { x: sx, z: sz, dx, dz }; // piers stream in with the props (props.js)
    const hullM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), cabM = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 });
    for (let k = 0; k < 0; k++) { const g = new THREE.Group(), L = 8 + R() * 4, /* real ships from props.js moor here instead */ hm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, L), hullM.clone()); hm.material.color.setHex([0x1f3a5f, 0x8e2b23, 0xf2f2f0, 0x2e6f5a][k]); hm.position.y = 0.2; const bow = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.6, 4), hm.material); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, 0.2, L / 2 + 1.2); bow.scale.set(1, 1, 0.5);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, L * 0.3), cabM); cab.position.set(0, 1.5, -L * 0.15); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5), cabM); mast.position.set(0, 3.2, L * 0.1); g.add(hm, bow, cab, mast); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const bx = sx + Math.sin(qyaw) * (k - 1.5) * 11 + dx * (9 + (k % 2) * 2), bz = sz + Math.cos(qyaw) * (k - 1.5) * 11 + dz * (9 + (k % 2) * 2); g.userData = { x: bx, z: bz, yaw: qyaw + (R() - 0.5) * 0.3 }; scene.add(g); boats.push(g); } }

  // ---- Waterfalls down the north wall of the fjord: ribbons draped over the rock, with spray at the foot ----
  { const fallT = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = 'rgba(230,240,245,0.55)'; x.fillRect(0, 0, 64, 256); for (let i = 0; i < 260; i++) { const w = 1 + R() * 3, a = 0.25 + R() * 0.6; x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(R() * 64, R() * 256, w, 18 + R() * 70); } return c; })());
    fallT.wrapS = fallT.wrapT = THREE.RepeatWrapping; fallT.repeat.set(1, 6); const fm = new THREE.MeshBasicMaterial({ map: fallT, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, color: 0xe8f0f2 });
    const FJ = [[-4200, 3600], [-2500, 3560], [-1200, 3470], [0, 3520], [700, 3470]], cz = x => { for (let i = 0; i < FJ.length - 1; i++) if (x >= FJ[i][0] && x <= FJ[i + 1][0]) return FJ[i][1] + (FJ[i + 1][1] - FJ[i][1]) * (x - FJ[i][0]) / (FJ[i + 1][0] - FJ[i][0]); return 3500; };
    for (const fx of [-2050, -1150, -350, 380]) { let z = cz(fx) + 120; while (terrain(fx, z) < 4 && z < cz(fx) + 600) z += 4; const foot = z - 6; let top = z; while (terrain(fx, top) < 230 && top < z + 600) top += 6; if (terrain(fx, top) < 120) continue;
      // only down a real cliff: on a gentler slope a ribbon reads as a grey slab lying on the hillside, not falling water
      { let steep = 0, n = 0; for (let zz = foot + 6; zz < top - 6; zz += 6) { steep += Math.abs(terrain(fx, zz + 3) - terrain(fx, zz - 3)) / 6; n++; } if (!n || steep / n < 1.4) continue; }
      const pos = [], uv = [], idx = []; let n = 0; for (let zz = top; zz >= foot; zz -= 3) { const y = Math.max(terrain(fx, zz) + 0.8, -0.5); const wob = Math.sin(zz * 0.05) * 3 + Math.sin(zz * 0.13) * 1.2, half = 2 + (top - zz) * 0.0015; /* a narrow stream, spreading a little toward the foot */ pos.push(fx + wob - half, y, zz, fx + wob + half, y, zz); uv.push(0, (top - zz) / 40, 1, (top - zz) / 40); if (n) idx.push((n - 1) * 2, n * 2, (n - 1) * 2 + 1, (n - 1) * 2 + 1, n * 2, n * 2 + 1); n++; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); const m = new THREE.Mesh(g, fm); m.frustumCulled = false; scene.add(m);
      const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: loader.load(TEX + 'smoke.png'), color: 0xf2f6f8, transparent: true, opacity: 0.45, depthWrite: false })); mist.position.set(fx, 4, foot - 4); mist.scale.set(26, 18, 1); scene.add(mist);
      (world.waterfalls ||= []).push({ x: fx, z: foot, top: terrain(fx, top) }); }
    updates.push(t => { fallT.offset.y = t * 0.9; }); }

  // ---- Fjord Mouth lookout ----
  const mouth = place('mouth');
  if (mouth) { const pl = mouth, y = pl.y, yaw = pl.yaw, [x, z] = at(pl, 26, 0); box(x, y + 0.25, z, 12, 0.5, 9, yaw, 0xffffff, 'wood', false); for (const [u, v] of [[6, 0], [-6, 0]]) { const [rx, rz] = at(pl, 26 + u * 0, v + u); box(rx, y + 1.1, rz, 0.12, 1.1, 0.12, yaw, 0x3a2c20, 'paint', false); }
    const [bx, bz] = at(pl, 34, 8), by = terrain(bx, bz); cyl(bx, by + 5, bz, 1.1, 10, 0xf2f0ea); cyl(bx, by + 10.4, bz, 1.3, 0.5, 0x2a2c2e, 'metal', false); glow(bx, by + 11.3, bz, 0.9, 1.2, 0.9, 0, new THREE.Color(0.3, 3, 0.8)); }

  // ---- Broadleaf woods (Eight Worlds oak, ash and aspen) around Mirror Lake and in the jungle ----
  try { const n = Math.round(300 * Math.max(0, Math.min(1, ((Q.reach || 1) - 0.5) * 2))); if (n > 0) await broadleaf(n); } catch (e) { console.warn('broadleaf trees unavailable', e); }
  async function broadleaf(total) {
    const load = async name => { const buf = await (await fetch('/eight-worlds/assets/models/' + name + '.bin')).arrayBuffer(), hl = new Uint32Array(buf, 0, 1)[0], head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))); let o = 4 + hl;
      const f32 = k => { const a = new Float32Array(buf, o, k); o += k * 4; return a; }, u32 = k => { const a = new Uint32Array(buf, o, k); o += k * 4; return a; };
      const mk = (nv, ni) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(f32(nv * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(f32(nv * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(f32(nv * 2), 2)); g.setIndex(new THREE.BufferAttribute(u32(ni), 1)); return g; };
      return { ...head, branches: mk(head.bv, head.bi), leaves: mk(head.lv, head.li) }; };
    const kinds = await Promise.all(['oak_a', 'ash_a', 'aspen_a'].map(load)), sites = kinds.map(() => []);
    const zones = [{ x: 3700, z: 150, r: 1500, share: 0.6, mix: [0.3, 0.3, 0.4] }, { x: 1250, z: -3000, r: 1300, share: 0.4, mix: [0.55, 0.45, 0] }];
    for (const zn of zones) { let placed = 0; for (let k = 0; k < 6000 && placed < total * zn.share; k++) { const a = R() * TAU, r = Math.sqrt(R()) * zn.r, x = zn.x + Math.cos(a) * r, z = zn.z + Math.sin(a) * r, y = terrain(x, z);
        const road = world.nearRoad(x, z, 60); if (!road || road.d < 13 || y < LAKE.level + 1 && Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1.3 || y < 3) continue;
        if (Math.abs(terrain(x + 3, z) - terrain(x - 3, z)) > 2.4 || world.places.some(p => Math.hypot(p.x - x, p.z - z) < (p.r || 30) + 12)) continue;
        if (sites.some(l => l.some(t => Math.abs(t.x - x) < 9 && Math.abs(t.z - z) < 9))) continue;
        let pick = R(), kk = 0; while (kk < 2 && pick > zn.mix[kk]) { pick -= zn.mix[kk]; kk++; }
        const sc = 0.15 + R() * 0.08; sites[kk].push({ x, y: y - 0.3, z, s: sc, a: R() * TAU }); solid.push({ x, z, r: 0.55 * sc / 0.2, bottom: y - 0.5, top: y + 14, kind: 'broadleaf trunk' }); placed++; } }
    const barkM = {}, leafM = {};
    kinds.forEach((t, k) => { if (!sites[k].length) return;
      barkM[t.bark] ||= new THREE.MeshStandardMaterial({ map: load2(`bark_${t.bark}_d.jpg`), normalMap: load2(`bark_${t.bark}_n.jpg`, false), roughness: 0.92 });
      leafM[t.leaf] ||= new THREE.MeshStandardMaterial({ map: load2(`leaf_${t.leaf}.png`), alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.85, envMapIntensity: 0.4 });
      for (const [g, m] of [[t.branches, barkM[t.bark]], [t.leaves, leafM[t.leaf]]]) { const im = new THREE.InstancedMesh(g, m, sites[k].length);
        sites[k].forEach((q, i) => { dummy.position.set(q.x, q.y, q.z); dummy.rotation.set(0, q.a, 0); dummy.scale.setScalar(q.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); im.setColorAt(i, col.setHSL(0.22 + R() * 0.06, 0.3, 0.8 + R() * 0.2)); });
        im.castShadow = true; im.receiveShadow = true; scene.add(im); splitChunks(im, 620, city.chunks, 300); } });
    out.broadleaf = sites.reduce((a, l) => a + l.length, 0);
  }
  function load2(n, srgb = true) { const t = loader.load(TEX + n); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

  // ---- instancing ----
  for (const [key, list] of parts) { const [geo, mat] = key.split('|'), mesh = new THREE.InstancedMesh(GEO[geo], MAT[mat], list.length);
    list.forEach((q, k) => { dummy.position.set(q[0], q[1], q[2]); dummy.rotation.set(q[8], q[6], q[9], 'YXZ'); dummy.scale.set(q[3], q[4], q[5]); dummy.updateMatrix(); mesh.setMatrixAt(k, dummy.matrix); mesh.setColorAt(k, col.copy(q[7])); });
    mesh.castShadow = mat !== 'glow'; mesh.receiveShadow = true; scene.add(mesh); splitChunks(mesh, mat === 'glow' ? 2600 : 2200, city.chunks, 400); }

  // ---- The Eight Worlds brig, under sail on a long loop offshore ----
  let brig = null;
  try { brig = buildShip(); brig.group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(brig.group); } catch (e) { console.warn('brig unavailable', e); }
  const sea = city.sea, wave = {}, BR = { x: -2350, z: -500, rx: 820, rz: 1500, speed: 4.2 };
  out.brig = brig;
  let night = 0;
  updates.push((t, dt) => {
    if (brig) { const a = t * BR.speed / ((BR.rx + BR.rz) / 2), x = BR.x + Math.cos(a) * BR.rx, z = BR.z + Math.sin(a) * BR.rz, vx = -Math.sin(a) * BR.rx, vz = Math.cos(a) * BR.rz, yaw = Math.atan2(-vz, vx);
      sea.heightAt(x, z, wave); const g = brig.group, fx = Math.cos(yaw), fz = -Math.sin(yaw), pitch = Math.atan(wave.gx * fx + wave.gz * fz), roll = Math.atan(wave.gx * fz - wave.gz * fx);
      g.position.set(x, wave.y - 0.15, z); g.rotation.set(roll * 0.6, yaw, pitch * 0.6, 'YXZ'); brig.update(dt, t, 0.55, night); }
    for (const b of boats) { sea.heightAt(b.userData.x, b.userData.z, wave); b.position.set(b.userData.x, wave.y + 0.1, b.userData.z); b.rotation.set(wave.gz * 0.5, b.userData.yaw, -wave.gx * 0.5, 'YXZ'); } });
  timers.push(e => { night = e.night; MAT.glow.color.setScalar(0.3 + 0.7 * e.night); MAT.glass.emissiveIntensity = 0.4 + 2.6 * e.night; });
  // What can be heard from a point: open water around it, the crater, the waterfalls, the high pass, the lake, the dunes.
  const amb = { sea: 0, fire: 0, falls: 0, alpine: 0, lake: 0, desert: 0 }; let ambT = -1;
  out.ambience = (x, z, t) => { if (Math.abs(t - ambT) < 0.3) return amb; ambT = t; let wet = sea.depthAt(x, z)[0] > 0.6 ? 2 : 0; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; if (sea.depthAt(x + Math.cos(a) * 140, z + Math.sin(a) * 140)[0] > 0.6) wet++; }
    amb.sea = Math.min(1, wet / 5); amb.fire = Math.max(0, 1 - Math.hypot(x - VOLCANO.x, z - VOLCANO.z) / 950) ** 1.5; amb.falls = 0; for (const f of world.waterfalls || []) amb.falls = Math.max(amb.falls, Math.max(0, 1 - Math.hypot(x - f.x, z - f.z) / 300) ** 2);
    amb.alpine = THREE.MathUtils.smoothstep(terrain(x, z), 240, 400); amb.lake = Math.max(0, 1 - Math.max(0, Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) - 1) * 1.4); amb.desert = world.zones(x, z)[0]; return amb; };
  let last = 0; out.update = t => { const dt = Math.min(0.1, Math.max(0, t - last)); last = t; for (const f of updates) f(t, dt); };
  out.setTime = e => { for (const f of timers) f(e); };
  out.stats = { instances: [...parts.values()].reduce((a, l) => a + l.length, 0), boats: boats.length, waterfalls: (world.waterfalls || []).length, brig: !!brig };
  return out;
}
