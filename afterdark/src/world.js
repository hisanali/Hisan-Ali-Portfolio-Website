// The land around the city: a height-mapped coast, hills and mountains, with two spline roads laid over it.
// The coastal highway leaves the south-west corner, crosses a bay on a bridge, tunnels a ridge and returns to the
// east gate. The mountain road leaves the east side, climbs by hairpins to a summit lay-by and drops to the north gate.
import * as THREE from '/evermile/vendor/three.module.js';
import { P, ROADS, HALF, SW, SPAN, rng, splitChunks } from './city.js';
import { buildForest } from './forest.js';
import { roadClearance } from './road-clearance.js';
import { planAirfield, sitePaved, sitePosition } from './landmarks.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t;
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hash = (x, y) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return mix(mix(hash(xi, yi), hash(xi + 1, yi), u), mix(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); };
const fbm = (x, y, o = 5) => { let a = 0.5, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x, y); n += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return s / n; };

export const WORLD = { x0: -708, x1: 2892, z0: -1812, z1: 2028, cell: 12 };
const PROM = -(HALF + 13.2), EDGE = HALF + SW;
const shoreX = z => PROM + 150 * sst(-160, -520, z) + 620 * Math.exp(-(((z + 905) / 125) ** 2)) + 60 * Math.sin(z / 310) * sst(1120, 1400, z) - 120 * sst(1300, 1900, z);
// Height of the untouched land.
function natural(x, z) {
  const dx = Math.max(-44 - x, 0, x - (SPAN + 24)), dz = Math.max(-24 - z, 0, z - (SPAN + 24)), dCity = Math.hypot(dx, dz);
  const ramp = sst(10, 520, dCity);
  const hills = (fbm(x / 520, z / 520) - 0.42) * 95 * ramp;
  const mMask = Math.max(sst(1180, 2300, x), sst(1180, 2050, z) * 0.9, sst(-520, -1500, z) * 0.5 * sst(200, 900, x));
  const r = 1 - Math.abs(2 * fbm(x / 1150 + 3.1, z / 1150 + 7.3, 4) - 1);
  let h = dCity <= 0 ? -0.4 : mix(0.22, Math.max(1.1, 1.1 + hills + r * r * 460 * mMask + (fbm(x / 240, z / 240) - 0.5) * 46 * mMask), sst(2, 150, dCity) * 0.75 + sst(2, 40, dCity) * 0.25);
  const d = x - shoreX(z);
  if (d < 0) { const k = Math.min(-d, 92) / 92; return Math.max(-16, 0.02 - k * k * 1.5 - Math.max(0, -d - 92) * 0.06); }
  if (dCity > 0) h = mix(0.03, h, sst(0, 110, d));
  return h;
}

const COAST = [[0, -16], [-2, -150], [40, -330], [150, -520], [215, -700], [228, -805], [236, -1010], [300, -1180], [470, -1320], [720, -1385], [960, -1372], [1190, -1260], [1370, -1030], [1425, -720], [1385, -400], [1270, -130], [1150, 110], [1095, 340], [1035, 462], [SPAN + 14, 480]];
const MOUNT = [[SPAN + 14, 720], [1080, 735], [1280, 815], [1470, 770], [1600, 870], [1530, 1000], [1660, 1090], [1860, 1010], [2020, 1130], [1950, 1280], [2130, 1380], [2360, 1290], [2420, 1440], [2260, 1590], [2020, 1660], [1780, 1610], [1520, 1690], [1240, 1600], [960, 1480], [740, 1300], [600, 1110], [480, SPAN + 14]];
// A winding lane through the old town in the hills north of the grid: no straight lines anywhere.
const OLD = [[240, SPAN + 14], [246, 1045], [305, 1125], [262, 1205], [160, 1228], [112, 1318], [192, 1398], [128, 1482], [44, 1424], [34, 1304], [66, 1186], [14, 1082], [0, SPAN + 14]];

export async function buildWorld(scene, city, Q) {
  const world = { roads: [], hide: [], bounds: WORLD }, R = rng(909);
  const nx = Math.round((WORLD.x1 - WORLD.x0) / WORLD.cell) + 1, nz = Math.round((WORLD.z1 - WORLD.z0) / WORLD.cell) + 1, H = new Float32Array(nx * nz);

  // ---- Roads: sample each spline, give it a smooth drivable profile, and note bridge and tunnel stretches ----
  const samples = [], STEP = 3, HALFW = 6;
  for (const [name, ctrl, tunnels] of [['coast', COAST, true], ['mountain', MOUNT, false], ['old', OLD, false]]) {
    const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), n = Math.round(curve.getLength() / STEP), pts = curve.getSpacedPoints(n);
    const nat = pts.map(p => natural(p.x, p.z)), y = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) { let s = 0, c = 0; for (let k = -16; k <= 16; k++) { const j = clamp(i + k, 0, n); s += nat[j] < -0.5 ? 13 : Math.max(nat[j], 1.2); c++; } y[i] = s / c; }
    y[0] = 0.02; y[n] = 0.02; const grade = name === 'coast' ? 0.07 : name === 'old' ? 0.085 : 0.115;
    // The ends meet the city streets at their level; the grade limit is applied outward from both pinned ends.
    const lvl = 8; for (let i = 0; i <= lvl; i++) { y[i] = 0.02; y[n - i] = 0.02; }
    for (let pass = 0; pass < 4; pass++) { for (let i = lvl + 1; i < n - lvl; i++) y[i] = clamp(y[i], y[i - 1] - grade * STEP, y[i - 1] + grade * STEP); for (let i = n - lvl - 1; i > lvl; i--) y[i] = clamp(y[i], y[i + 1] - grade * STEP, y[i + 1] + grade * STEP); }
    for (let pass = 0; pass < 4; pass++) for (let i = lvl + 1; i < n - lvl; i++) y[i] = (y[i - 1] + y[i] * 2 + y[i + 1]) / 4;
    const start = samples.length;
    for (let i = 0; i <= n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], tl = Math.hypot(b.x - a.x, b.z - a.z) || 1, tx = (b.x - a.x) / tl, tz = (b.z - a.z) / tl;
      samples.push({ x: pts[i].x, z: pts[i].z, y: y[i], tx, tz, lx: tz, lz: -tx, road: name, i: samples.length, bridge: nat[i] < -0.5 && y[i] > 3, tunnel: tunnels && nat[i] - y[i] > 14, wallL: false, wallR: false, s: i * STEP }); }
    world.roads.push({ name, from: start, to: samples.length - 1, length: n * STEP });
  }
  // widen tunnel flags slightly so portals sit in a proper cutting, and close 1-2 sample gaps
  for (let i = 2; i < samples.length - 2; i++) if (!samples[i].tunnel && samples[i - 2].tunnel && samples[i + 2].tunnel && samples[i].road === samples[i - 2].road) samples[i].tunnel = true;
  const grid = new Map(), GC = 24, gk = (x, z) => Math.floor(x / GC) * 8192 + Math.floor(z / GC);
  for (const s of samples) (grid.get(gk(s.x, s.z)) || grid.set(gk(s.x, s.z), []).get(gk(s.x, s.z))).push(s);
  // Nearest road sample within reach metres, with signed lateral offset (+ = left of travel).
  const hit = { s: null, lat: 0, d: 0 };
  function nearRoad(x, z, reach) { const r = Math.ceil(reach / GC), cx = Math.floor(x / GC), cz = Math.floor(z / GC); let best = null, bd = reach * reach;
    for (let ix = cx - r; ix <= cx + r; ix++) for (let iz = cz - r; iz <= cz + r; iz++) { const cell = grid.get(ix * 8192 + iz); if (!cell) continue; for (const s of cell) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; best = s; } } }
    if (!best) return null; hit.s = best; hit.lat = (x - best.x) * best.lx + (z - best.z) * best.lz; hit.d = Math.sqrt(bd); return hit; }
  world.nearRoad = nearRoad; world.samples = samples;

  // ---- Places: each is anchored to a point on a road, set to one side on ground levelled to the road ----
  const PLACES = [['harbour', 'Harbour', 'coast', 0.1, 92, 78, 'low'], ['lighthouse', 'Lighthouse Point', 'coast', 0.31, 70, 20, 'low'], ['petrol', 'Valley Fuel', 'coast', 0.79, 36, 30, 'flat'], ['stadium', 'Eastside Stadium', 'mountain', 0.045, 128, 100, 'flat'], ['summit', 'Summit Lookout', 'mountain', -1, 34, 30, 'flat']];
  const sampleAt = (road, frac) => { const rd = world.roads.find(r => r.name === road); return samples[Math.round(rd.from + (rd.to - rd.from) * frac)]; };
  let topS = samples[0]; for (const s of samples) if (s.y > topS.y) topS = s;
  world.places = PLACES.map(([key, name, road, frac, off, r, pick]) => { const s = frac < 0 ? topS : sampleAt(road, frac), nl = natural(s.x + s.lx * off, s.z + s.lz * off), nr = natural(s.x - s.lx * off, s.z - s.lz * off);
    const side = pick === 'low' ? (nl < nr ? 1 : -1) : (Math.abs(nl - s.y) < Math.abs(nr - s.y) ? 1 : -1);
    return { key, name, x: s.x + s.lx * side * off, z: s.z + s.lz * side * off, y: Math.max(s.y, 1.5), r, side, ux: s.tx, uz: s.tz, vx: s.lx * side, vz: s.lz * side, yaw: Math.atan2(s.tx, s.tz), blend: key === 'harbour' ? 9 : 46, road: s }; });
  const fuel = world.places.find(p => p.key === 'petrol');
  fuel.paving = [[0, 0, 35, 40], [0, -25.4, 11.0, 10.8]];
  const [fx, fz] = sitePosition(fuel, 0, -15);
  fuel.arrival = { x: fx, z: fz, name: fuel.name };
  const airfield = planAirfield(samples);
  world.places.push(airfield);
  const gradedPlaces = world.places.filter(p => p !== airfield);
  const pavedPlaces = [fuel, airfield];
  const nearPlace = (x, z, margin) => airfield.contains(x, z, margin)
    || gradedPlaces.some(p => Math.hypot(p.x - x, p.z - z) < p.r + margin);
  // Stretches lined with houses get a wider level verge.
  const STRIPS = [['suburb', 'Eastfield', 'coast', 0.84, 0.955], ['village', 'Pinecrest', 'mountain', 0.655, 0.725], ['oldtown', 'Old Town', 'old', 0.14, 0.86]];
  world.strips = STRIPS.map(([key, name, road, a, b]) => { const rd = world.roads.find(r => r.name === road), i0 = Math.round(rd.from + (rd.to - rd.from) * a), i1 = Math.round(rd.from + (rd.to - rd.from) * b); for (let i = i0; i <= i1; i++) samples[i].wide = 30 * sst(i0, i0 + 14, i) * sst(i1, i1 - 14, i); const m = samples[Math.round((i0 + i1) / 2)]; return { key, name, i0, i1, x: m.x, z: m.z, y: m.y, r: (i1 - i0) * STEP / 2 }; });

  // ---- Heightfield: natural land, graded flat along the roads (not under bridges or over tunnels) ----
  const canopyCover = (x, z) => fbm(x / 103, z / 103, 4) * 0.62 + fbm(x / 290 + 17, z / 290, 3) * 0.38;
  const cand = [];
  const woodland = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = WORLD.x0 + i * WORLD.cell, z = WORLD.z0 + j * WORLD.cell; let h = natural(x, z);
    let roadDistance = Infinity, tunnelDistance = Infinity;
    { const rr = Math.ceil(100 / GC), cx = Math.floor(x / GC), cz = Math.floor(z / GC); let dmin = 999, dall = 999, covered = false; cand.length = 0;
      for (let ix = cx - rr; ix <= cx + rr; ix++) for (let iz = cz - rr; iz <= cz + rr; iz++) { const cell = grid.get(ix * 8192 + iz); if (!cell) continue; for (const s of cell) { const d = Math.hypot(s.x - x, s.z - z); if (d > 100) continue; if (d < dall) { dall = d; covered = s.bridge || s.tunnel; } if (s.tunnel) tunnelDistance = Math.min(tunnelDistance, d); if (s.bridge || s.tunnel) continue; const de = Math.max(0, d - (s.wide || 0)); cand.push(de, s.y); if (de < dmin) dmin = de; } }
      if (!covered) roadDistance = dall;
      // the nearest stretch of road sets the level; where two stretches are about equally near, their levels are averaged
      if (cand.length && !covered) { let sw = 0, sy = 0; for (let q = 0; q < cand.length; q += 2) { const wgt = Math.exp(-(cand[q] - dmin) * 0.55); sw += wgt; sy += wgt * cand[q + 1]; } h = mix(h, sy / sw - 0.28, 1 - sst(19, 98, dmin)); } }
    const roadbed = h;
    for (const pl of gradedPlaces) {
      const d = Math.hypot(pl.x - x, pl.z - z);
      if (d < pl.r + pl.blend) h = mix(h, pl.y - 0.05, 1 - sst(pl.r, pl.r + pl.blend, d));
    }
    if (airfield.contains(x, z, 84)) {
      const u = x - airfield.x, v = z - airfield.z, { west, east } = airfield.pad;
      const width = sst(west - 82, west + 2, u) * (1 - sst(east - 2, east + 82, u));
      const pad = width * sst(-137, -94, v) * (1 - sst(72, 157, v));
      const access = (1 - sst(10, 70, Math.abs(u))) * sst(-236, -216, v) * (1 - sst(-110, -86, v));
      const grade = mix(airfield.road.y, airfield.y, sst(-230, -113, v));
      h = mix(h, grade - 0.05, Math.max(pad, access) * sst(32, 88, tunnelDistance));
    }
    if (h > roadbed) h = mix(roadbed, h, sst(12, 26, roadDistance));
    H[j * nx + i] = h;
    woodland[j * nx + i] = sst(0.34, 0.66, canopyCover(x, z)) * sst(4, 12, h) * (1 - sst(218, 285, h)) * sst(16, 38, roadDistance); }
  const hAt = (x, z) => { const fx = clamp((x - WORLD.x0) / WORLD.cell, 0, nx - 1.001), fz = clamp((z - WORLD.z0) / WORLD.cell, 0, nz - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = H[j * nx + i], b = H[j * nx + i + 1], c = H[(j + 1) * nx + i], d = H[(j + 1) * nx + i + 1];
    return u + v < 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v); };
  world.terrain = hAt;
  city.sea.setTerrain(WORLD, nx, nz, H);
  for (const site of pavedPlaces) site.arrival.y = hAt(site.arrival.x, site.arrival.z);
  // Drop-side barriers: wherever the land falls away beside the road.
  for (const s of samples) { if (s.bridge || s.tunnel) { s.wallL = s.wallR = true; continue; } s.wallL = hAt(s.x + s.lx * 30, s.z + s.lz * 30) < s.y - 5.5; s.wallR = hAt(s.x - s.lx * 30, s.z - s.lz * 30) < s.y - 5.5; }
  for (let pass = 0; pass < 2; pass++) for (let i = 1; i < samples.length - 1; i++) for (const k of ['wallL', 'wallR']) if (samples[i - 1][k] && samples[i + 1][k]) samples[i][k] = true;
  // Ground height for the car and camera: road surface on the carriageway, land elsewhere.
  world.ground = (x, z, info) => {
    const r = nearRoad(x, z, 22), terrain = hAt(x, z);
    if (info) {
      info.road = null;
      info.lat = 0;
      info.paved = pavedPlaces.some(site => sitePaved(site, x, z));
    }
    if (!r) return terrain;
    const point = r.s;
    let lateral = r.lat, closest = r.d * r.d, roadY = point.y;
    // The nearest sample can be before or after the car. Project onto its adjacent segments
    // so the height at their shared vertex is continuous in both directions.
    for (let i = point.i - 1; i <= point.i; i++) {
      const a = samples[i], b = samples[i + 1];
      if (!a || !b || a.road !== point.road || b.road !== point.road) continue;
      const dx = b.x - a.x, dz = b.z - a.z, lengthSq = dx * dx + dz * dz;
      const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / lengthSq, 0, 1);
      const rx = x - a.x - dx * t, rz = z - a.z - dz * t;
      const d = rx * rx + rz * rz;
      if (d <= closest + 1e-7) {
        closest = d;
        lateral = (rx * dz - rz * dx) / Math.sqrt(lengthSq);
        roadY = mix(a.y, b.y, t);
      }
    }
    if (info) { info.road = point; info.lat = lateral; }
    const across = Math.abs(lateral), y = roadY + 0.03;
    if (point.bridge || point.tunnel) return across < HALFW + 1.5 ? y : terrain;
    return across <= HALFW ? y : mix(y, terrain, sst(HALFW, HALFW + 9, across));
  };

  world.tunnelPassage = (x, y, z) => {
    const r = nearRoad(x, z, 16);
    if (!r || !r.s.tunnel || Math.abs(r.lat) > 6.65) return false;
    const across = r.lat, floor = world.ground(x, z);
    const roof = floor + 6.42 * Math.sqrt(Math.max(0, 1 - (across / 7.17) ** 2));
    return y > floor + 0.18 && y < roof - 0.25;
  };

  // ---- Terrain mesh in patches, textured by slope and height ----
  const L = new THREE.TextureLoader(), tex = n => { const t = L.load(`/evermile/assets/materials/${n}_diff_1k.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const grass = tex('forest_ground_04');
  const loadTerrainTex = file => {
    const texture = L.load('/afterdark/assets/' + file);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  };
  const rock = loadTerrainTex('rock-face.jpg'), strata = loadTerrainTex('rocky-terrain.jpg');
  const landM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, envMapIntensity: 0.35 });
  const clearance = roadClearance(samples);
  landM.onBeforeCompile = sh => { Object.assign(sh.uniforms, clearance.uniforms); sh.uniforms.uGrass = { value: grass }; sh.uniforms.uRock = { value: rock }; sh.uniforms.uStrata = { value: strata };
    sh.vertexShader = 'attribute float aWoodland; varying float vWoodland; varying vec3 vWPos; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = transformed; vWN = normal; vWoodland = aWoodland;');
    sh.fragmentShader = clearance.glsl + `uniform sampler2D uGrass, uRock, uStrata; varying float vWoodland; varying vec3 vWPos; varying vec3 vWN;
float adH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float adN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(adH(i), adH(i + vec2(1, 0)), f.x), mix(adH(i + vec2(0, 1)), adH(i + vec2(1, 1)), f.x), f.y); }\n` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  clearRoad(vWPos);
  vec2 adP = vWPos.xz;
  vec3 adNn = normalize(vWN);
  float adSlope = 1.0 - adNn.y;
  float adMacro = adN(adP * 0.0037) * 0.66 + adN(adP * 0.012) * 0.34;
  float adBands = adN(vec2((vWPos.x + vWPos.z * 0.48) * 0.013, (vWPos.y + vWPos.x * 0.16) * 0.063));
  vec3 adAerial = texture2D(uStrata, adP / 88.0).rgb;
  vec3 adGround = texture2D(uGrass, adP / 7.0).rgb;
  vec3 adG = mix(adGround * 1.22, adAerial, 0.27) * mix(vec3(0.54, 0.7, 0.46), vec3(1.12, 1.12, 0.88), smoothstep(0.19, 0.77, adMacro));
  adG = mix(adG, adG * vec3(0.52, 0.69, 0.48), vWoodland * 0.75);
  vec3 adBlend = pow(abs(adNn), vec3(3.0));
  adBlend /= adBlend.x + adBlend.y + adBlend.z;
  vec3 adRock = texture2D(uRock, vWPos.zy / vec2(9.0, 5.0)).rgb * adBlend.x
              + texture2D(uRock, adP / 9.0).rgb * adBlend.y
              + texture2D(uRock, vWPos.xy / vec2(9.0, 5.0)).rgb * adBlend.z;
  vec2 adWarp = vec2(adN(adP * 0.028), adN(adP * 0.023 + 41.0)) * 0.24;
  vec3 adStrata = texture2D(uStrata, vec2(adP.x + adP.y * 0.51, vWPos.y * 1.59 + adP.y * 0.34) / 82.0 + adWarp).rgb;
  vec3 adR = mix(adRock * vec3(0.82, 0.78, 0.73), adStrata * vec3(0.85, 0.79, 0.70), 0.35 + adMacro * 0.29);
  adR *= mix(0.79, 1.21, smoothstep(0.13, 0.8, adBands));
  float adExposure = adSlope + (adMacro - 0.46) * 0.25 + (adBands - 0.5) * 0.14;
  vec3 adC = mix(adG, adR, smoothstep(0.115, 0.35, adExposure));
  float adDune = (1.0 - smoothstep(0.05, 1.2, vWPos.y)) * (1.0 - smoothstep(0.3, 0.5, adSlope));
  adC = mix(adC, vec3(0.54, 0.45, 0.31) * (0.76 + 0.24 * adN(adP * 0.7)), adDune);
  diffuseColor.rgb = adC;`); };
  const PATCH = 30, land = new THREE.Group();
  for (let pj = 0; pj < nz - 1; pj += PATCH) for (let pi = 0; pi < nx - 1; pi += PATCH) { const w = Math.min(PATCH, nx - 1 - pi) + 1, d = Math.min(PATCH, nz - 1 - pj) + 1, pos = new Float32Array(w * d * 3), nor = new Float32Array(w * d * 3), shade = new Float32Array(w * d), idx = []; let flat = true;
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) { const gi = pi + i, gj = pj + j, k = (j * w + i) * 3, h = H[gj * nx + gi]; pos[k] = WORLD.x0 + gi * WORLD.cell; pos[k + 1] = h; pos[k + 2] = WORLD.z0 + gj * WORLD.cell; shade[j * w + i] = woodland[gj * nx + gi]; if (h > -0.39 || h < -0.41) flat = false;
      const hl = H[gj * nx + Math.max(0, gi - 1)], hr = H[gj * nx + Math.min(nx - 1, gi + 1)], hd = H[Math.max(0, gj - 1) * nx + gi], hu = H[Math.min(nz - 1, gj + 1) * nx + gi], ax = hl - hr, az = hd - hu, ay = 2 * WORLD.cell, il = 1 / Math.hypot(ax, ay, az); nor[k] = ax * il; nor[k + 1] = ay * il; nor[k + 2] = az * il; }
    if (flat) continue; // entirely under the city
    for (let j = 0; j < d - 1; j++) for (let i = 0; i < w - 1; i++) { const a = j * w + i, b = a + 1, c = a + w, e = c + 1; idx.push(a, c, b, b, c, e); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aWoodland', new THREE.BufferAttribute(shade, 1)); g.setIndex(idx); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, landM); m.receiveShadow = true; land.add(m); }
  scene.add(land);

  // ---- Road ribbons with painted lines ----
  const AL = n => { const t = L.load(`/evermile/assets/materials/asphalt_03_${n}_1k.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (n === 'diff') t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t; };
  const roadM = new THREE.MeshStandardMaterial({ map: AL('diff'), normalMap: AL('nor_gl'), roughnessMap: AL('rough'), roughness: 1, normalScale: new THREE.Vector2(0.5, 0.5), envMapIntensity: 0.3 });
  roadM.onBeforeCompile = sh => { sh.uniforms.uWet = city.wetUniform;
    sh.fragmentShader = 'uniform float uWet;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  float adX = vMapUv.x * 2.0, adY = vMapUv.y * 6.3;
  float adLine = (1.0 - smoothstep(0.012, 0.016, abs(adX - 1.0))) * step(fract(adY / 12.0), 0.5) + (1.0 - smoothstep(0.012, 0.016, abs(abs(adX - 1.0) - 0.9)));
  adLine *= smoothstep(0.1, 0.32, dot(diffuseColor.rgb, vec3(0.333)) + 0.12);
  diffuseColor.rgb *= mix(0.92, 0.5, uWet); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66), clamp(adLine, 0.0, 1.0) * 0.9);`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = max(0.34, mix(clamp(roughnessFactor * 0.9 + 0.12, 0.5, 0.95), 0.4, uWet));'); };
  const strips = [];
  for (const rd of world.roads) { const pos = [], uv = [], idx = [], nor = []; let k = 0;
    for (let i = rd.from; i <= rd.to; i++) { const s = samples[i]; pos.push(s.x + s.lx * HALFW, s.y + 0.03, s.z + s.lz * HALFW, s.x - s.lx * HALFW, s.y + 0.03, s.z - s.lz * HALFW); uv.push(0, s.s / 6.3, 0.5, s.s / 6.3); nor.push(0, 1, 0, 0, 1, 0); if (i < rd.to) { idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } k += 2; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, roadM); m.receiveShadow = true; m.frustumCulled = false; scene.add(m); strips.push(m); }
  roadM.map.repeat.set(2, 1); roadM.normalMap.repeat.set(2, 1); roadM.roughnessMap.repeat.set(2, 1);

  // ---- Barriers, bridge and tunnel ----
  const dummy = new THREE.Object3D(), posts = [], railPos = [], railIdx = []; let rk = 0;
  const steel = new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.42, metalness: 0.85, side: THREE.DoubleSide }), conc = new THREE.MeshStandardMaterial({ color: 0x8d8f92, roughness: 0.85, side: THREE.DoubleSide });
  for (const side of ['wallL', 'wallR']) { const sg = side === 'wallL' ? 1 : -1; let run = false;
    for (let i = 0; i < samples.length; i++) { const s = samples[i], on = s[side] && !s.tunnel, off = HALFW + 0.35, x = s.x + s.lx * sg * off, z = s.z + s.lz * sg * off;
      if (on) { railPos.push(x, s.y + 0.86, z, x, s.y + 0.5, z); if (run && samples[i - 1].road === s.road) railIdx.push(rk - 2, rk - 1, rk, rk - 1, rk + 1, rk); rk += 2; run = true; if (i % 2 === 0) posts.push([x, s.y + 0.42, z, s.bridge]); } else run = false; } }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3)); g.setIndex(railIdx); g.computeVertexNormals(); const m = new THREE.Mesh(g, steel); m.frustumCulled = false; m.castShadow = true; scene.add(m);
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), steel, posts.length); posts.forEach((p, k) => { dummy.position.set(p[0], p[1], p[2]); dummy.updateMatrix(); pm.setMatrixAt(k, dummy.matrix); }); scene.add(pm); splitChunks(pm, 420, city.chunks); }
  // Bridge: deck edge beams, piers down to the seabed, two towers and their cables.
  { const bs = samples.filter(s => s.bridge), parts = []; if (bs.length > 8) { const boxes = []; bs.forEach((s, k) => { if (k % 13 === 6) boxes.push([s.x, (s.y - 16) / 2 - 0.6, s.z, 3.2, s.y + 16, 9, Math.atan2(s.tx, s.tz)]); });
      const a = bs[Math.floor(bs.length * 0.28)], b = bs[Math.floor(bs.length * 0.72)], TH = 46; for (const t of [a, b]) for (const sg of [-1, 1]) boxes.push([t.x + t.lx * sg * 7.2, t.y + TH / 2 - 6, t.z + t.lz * sg * 7.2, 1.6, TH + 12, 2.2, Math.atan2(t.tx, t.tz)]);
      for (const t of [a, b]) boxes.push([t.x, t.y + TH - 2, t.z, 2.0, 2.4, 14.4 + 1.6, Math.atan2(t.tx, t.tz) + Math.PI / 2]);
      const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), conc, boxes.length); boxes.forEach((q, k) => { dummy.position.set(q[0], q[1], q[2]); dummy.rotation.set(0, q[6], 0); dummy.scale.set(q[3], q[4], q[5]); dummy.updateMatrix(); bm.setMatrixAt(k, dummy.matrix); }); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); bm.castShadow = true; bm.frustumCulled = false; scene.add(bm);
      // deck underside slab
      const dp = [], di = []; bs.forEach((s, k) => { for (const sg of [-1, 1]) for (const dy of [0.0, -1.4]) dp.push(s.x + s.lx * sg * (HALFW + 0.7), s.y + dy, s.z + s.lz * sg * (HALFW + 0.7)); if (k) { const o = (k - 1) * 4; di.push(o, o + 1, o + 4, o + 1, o + 5, o + 4, o + 2, o + 6, o + 3, o + 3, o + 6, o + 7, o + 1, o + 3, o + 5, o + 3, o + 7, o + 5); } });
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setIndex(di); dg.computeVertexNormals(); const dm = new THREE.Mesh(dg, conc); dm.frustumCulled = false; dm.castShadow = true; scene.add(dm);
      // cables: main catenaries and hangers
      const lp = [], ia = bs.indexOf(a), ib = bs.indexOf(b); for (const sg of [-1, 1]) { const top = k => { const s = bs[k]; let hgt; if (k <= ia) hgt = mix(1.2, TH - 2, (k / ia) ** 1.6); else if (k >= ib) hgt = mix(1.2, TH - 2, ((bs.length - 1 - k) / (bs.length - 1 - ib)) ** 1.6); else { const u = (k - ia) / (ib - ia) * 2 - 1; hgt = mix(5, TH - 2, u * u); } return [s.x + s.lx * sg * 7.2, s.y + hgt, s.z + s.lz * sg * 7.2]; };
        for (let k = 0; k < bs.length - 1; k++) { lp.push(...top(k), ...top(k + 1)); if (k % 4 === 0) { const s = bs[k]; lp.push(...top(k), s.x + s.lx * sg * 7.2, s.y + 0.9, s.z + s.lz * sg * 7.2); } } }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2d31 })); lines.frustumCulled = false; scene.add(lines); world.bridge = { x: a.x, z: a.z }; } }
  // Tunnel: an arched lining with roof lights, and a concrete portal at each end.
  { const tm = new THREE.MeshStandardMaterial({ color: 0x777978, roughness: 0.84, side: THREE.DoubleSide, emissive: 0xa49e8d, emissiveIntensity: 0.065 }), lightM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, 1.2) }), lights = [], runs = []; let cur = null;
    samples.forEach(s => { if (s.tunnel) { if (!cur || cur[cur.length - 1].i !== s.i - 1) { cur = []; runs.push(cur); } cur.push(s); } });
    const ARC = 18, RAD = HALFW + 1.2;
    tm.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec2 vTunnel;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTunnel = uv;');
      shader.fragmentShader = 'varying vec2 vTunnel;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  float seam = smoothstep(0.018, 0.08, abs(fract(vTunnel.x / 6.0 + 0.5) - 0.5) * 6.0);
  float base = smoothstep(0.035, 0.083, min(vTunnel.y, 1.0 - vTunnel.y));
  float grain = 0.91 + 0.09 * sin(vTunnel.x * 4.9 + sin(vTunnel.y * 180.0)) * sin(vTunnel.y * 129.0 + vTunnel.x * 0.4);
  diffuseColor.rgb *= mix(0.65, 1.0, seam) * mix(0.38, 1.0, base) * grain;
`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  float lit = 1.0 - smoothstep(1.4, 7.3, abs(fract(vTunnel.x / 15.0 + 0.1) - 0.5) * 15.0);
  totalEmissiveRadiance += vec3(0.058, 0.052, 0.041) * lit * smoothstep(0.07, 0.49, min(vTunnel.y, 1.0 - vTunnel.y));
`);
    };
    for (const run of runs) { if (run.length < 6) { run.forEach(s => { s.tunnel = false; }); continue; } const tp = [], ti = [], tuv = [];
      run.forEach((s, k) => { for (let a = 0; a <= ARC; a++) { const th = a / ARC * Math.PI, ox = Math.cos(th) * RAD, oy = Math.sin(th) * (RAD - 0.6); tp.push(s.x + s.lx * ox, s.y + oy, s.z + s.lz * ox); tuv.push(k * STEP, a / ARC); } if (k) { const o = (k - 1) * (ARC + 1); for (let a = 0; a < ARC; a++) ti.push(o + a, o + a + ARC + 1, o + a + 1, o + a + 1, o + a + ARC + 1, o + a + ARC + 2); } if (k % 5 === 2) lights.push([s.x, s.y + RAD - 0.75, s.z, Math.atan2(s.tx, s.tz)]); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2)); g.setIndex(ti); g.computeVertexNormals(); const m = new THREE.Mesh(g, tm); m.frustumCulled = false; scene.add(m);
      { const fp = [], fi = []; run.forEach((s, k) => { fp.push(s.x + s.lx * (RAD + 0.4), s.y - 0.02, s.z + s.lz * (RAD + 0.4), s.x - s.lx * (RAD + 0.4), s.y - 0.02, s.z - s.lz * (RAD + 0.4)); if (k) { const o = (k - 1) * 2; fi.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }); const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setIndex(fi); fg.computeVertexNormals(); const fm = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ color: 0x2c2b2a, roughness: 0.9, side: THREE.DoubleSide })); fm.frustumCulled = false; scene.add(fm); }
      for (const e of [run[0], run[run.length - 1]]) { for (const sg of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 1.6), conc); b.position.set(e.x + e.lx * sg * (RAD + 3.3), e.y + 5.4, e.z + e.lz * sg * (RAD + 3.3)); b.rotation.y = Math.atan2(e.tx, e.tz); scene.add(b); } const top = new THREE.Mesh(new THREE.BoxGeometry(RAD * 2 + 13.6, 4.2, 1.6), conc); top.position.set(e.x, e.y + RAD + 1.6, e.z); top.rotation.y = Math.atan2(e.tx, e.tz); scene.add(top); } }
    const lm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.08, 2.4), lightM, Math.max(1, lights.length)); lights.forEach((q, k) => { dummy.position.set(q[0], q[1], q[2]); dummy.rotation.set(0, q[3], 0); dummy.updateMatrix(); lm.setMatrixAt(k, dummy.matrix); }); dummy.rotation.set(0, 0, 0); lm.count = lights.length; lm.frustumCulled = false; scene.add(lm); world.tunnels = runs.filter(r => r.length >= 6).length; }

  try { await buildForest(scene, city, world, WORLD, nearPlace, canopyCover, Q.reach || 1); }
  catch (error) { console.warn('Forest unavailable', error); }

  // ---- Roadside: tufts of grass along the verge, and reflective studs that pick out the road after dark ----
  { const gt = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d'), r = rng(12); for (let i = 0; i < 90; i++) { const x = r() * 128, hgt = 18 + r() * 44, g = 48 + r() * 62; c.strokeStyle = `rgb(${g * 0.82 | 0},${g * 0.86 | 0},${g * 0.4 | 0})`; c.lineWidth = 1 + r() * 1.6; c.beginPath(); c.moveTo(x, 64); c.quadraticCurveTo(x + (r() - 0.5) * 10, 64 - hgt * 0.6, x + (r() - 0.5) * 22, 64 - hgt); c.stroke(); } return cv; })()); gt.colorSpace = THREE.SRGBColorSpace;
    const q1 = new THREE.PlaneGeometry(1.6, 0.8); q1.translate(0, 0.4, 0); const q2 = q1.clone(); q2.rotateY(Math.PI / 2); const pos = [...q1.attributes.position.array, ...q2.attributes.position.array], uv = [...q1.attributes.uv.array, ...q2.attributes.uv.array], idx = [...q1.index.array, ...Array.from(q2.index.array, v => v + 4)], tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); tg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(24).fill(0).map((v, i) => i % 3 === 1 ? 1 : 0), 3)); tg.setIndex(idx);
    const list = []; for (const s of samples) { if (s.bridge || s.tunnel || s.i % 2) continue; for (const sg of [-1, 1]) for (let n = 0; n < 3; n++) { const lat = HALFW + 1.2 + R() * (9 + (s.wide || 0) * 0.3), x = s.x + s.lx * sg * lat + (R() - 0.5) * 3, z = s.z + s.lz * sg * lat + (R() - 0.5) * 3; if (nearPlace(x, z, 0)) continue;
      list.push([x, hAt(x, z) - 0.045, z, 0.25 + R() * 0.45, R() * Math.PI]); } }
    const tm = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ map: gt, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, envMapIntensity: 0.3 }), list.length); list.forEach((q, n) => { dummy.position.set(q[0], q[1], q[2]); dummy.rotation.set(0, q[4], 0); dummy.scale.setScalar(q[3]); dummy.updateMatrix(); tm.setMatrixAt(n, dummy.matrix); }); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); tm.receiveShadow = true; scene.add(tm); splitChunks(tm, 190, city.chunks); world.tufts = list.length;
    const sp = [], sc = []; for (const s of samples) { if (s.i % 4 || s.tunnel) continue; for (const sg of [-1, 1]) { sp.push(s.x + s.lx * sg * (HALFW - 0.25), s.y + 0.12, s.z + s.lz * sg * (HALFW - 0.25)); if (sg > 0) sc.push(2.6, 0.35, 0.2); else sc.push(2.4, 2.4, 2.2); } }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); const studs = new THREE.Points(rg, new THREE.PointsMaterial({ size: 0.34, map: city.dot, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); studs.frustumCulled = false; scene.add(studs);
    world.setTime = e => { studs.material.opacity = e.night; studs.visible = e.night > 0.05; }; }

  // Summit lay-by marker for the map and the beacon list.
  let top = samples[0]; for (const s of samples) if (s.y > top.y) top = s; world.summit = top;
  world.stats = { samples: samples.length, grid: [nx, nz], summit: Math.round(top.y), tunnels: world.tunnels, bridge: samples.filter(s => s.bridge).length * STEP, roads: world.roads.map(r => r.name + ' ' + Math.round(r.length) + ' m'), trees: world.trees, understory: world.understory, rocks: world.rocks };
  return world;
}
