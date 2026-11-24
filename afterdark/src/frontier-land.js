// The frontier: the country beyond the original valley, shaped after the Eight Worlds landscapes. Sea cliffs and a
// lighthouse cape to the south-west, temple ruins in jungle hills to the south, a volcano to the south-east, a lake
// in deep forest to the east, a dune sea beyond it, an alpine pass to the north-east and a fjord to the north-west.
// Everything here is plain arithmetic, shared by the heightfield, the roads, the map and the scenery.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t;
export const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hash = (x, y) => { let n = Math.imul(x | 0, 668265263) + Math.imul(y | 0, 374761393) + 1013; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return mix(mix(hash(xi, yi), hash(xi + 1, yi), u), mix(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); };
export const fbm = (x, y, o = 5) => { let a = 0.5, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x, y); n += a; x = x * 2.03 + 31.7; y = y * 2.03 + 5.3; a *= 0.5; } return s / n; };

// The original valley (12 m cells) and the frontier around it (24 m cells). Their edges share grid lines.
export const INNER = { x0: -708, x1: 2892, z0: -1812, z1: 2028 };
export const EXT = { x0: INNER.x0 - 24 * 140, x1: INNER.x1 + 24 * 185, z0: INNER.z0 - 24 * 135, z1: INNER.z1 + 24 * 135, cell: 24 };

export const VOLCANO = { x: 4700, z: -3300, lava: 334 };
export const LAKE = { x: 3980, z: 250, rx: 420, rz: 360, level: 62 };
const FJORD = [[-4200, 3600], [-2500, 3560], [-1200, 3470], [0, 3520], [700, 3470]];
const fjordWidth = x => 170 + 160 * clamp((700 - x) / 4900, 0, 1);
const MESAS = [[6100, -700, 300, 160], [6500, 2300, 240, 190], [5700, 2750, 170, 130], [6650, -1650, 210, 140], [5450, -1250, 140, 95]];

// New roads: control points carry the intended road height, and the land is shaped into a valley or bench to meet
// it. A road may start at another road (a junction at the nearest point, or at its end) and may end at one.
export const FRONTIER_ROADS = [
  { name: 'temple', label: 'Temple Road', from: { road: 'coast', at: [700, -1395] }, grade: 0.1, valley: 220,
    pts: [[690, -1600, 28], [640, -1900, 34], [660, -2250, 44], [760, -2600, 52], [980, -2950, 62], [1200, -3200, 70], [1500, -3330, 72], [1900, -3300, 74], [2350, -3150, 85], [2800, -2950, 100], [3250, -2750, 118]] },
  { name: 'cape', label: 'Cape Road', from: { road: 'temple', at: [760, -2600] }, grade: 0.1, valley: 170,
    pts: [[500, -2780, 58], [150, -2980, 66], [-250, -3180, 78], [-700, -3380, 88], [-1100, -3500, 92], [-1390, -3540, 94]] },
  { name: 'crater', label: 'Crater Road', from: { road: 'temple', end: true }, grade: 0.125, valley: 120,
    pts: [[3650, -2620, 170], [4050, -2480, 240], [4480, -2470, 300], [4900, -2620, 350], [5150, -2950, 395], [5100, -3350, 425], [4850, -3600, 445], [4600, -3645, 447]] },
  { name: 'lakeside', label: 'Lakeside Road', from: { road: 'temple', end: true }, grade: 0.1, valley: 200,
    pts: [[3400, -2300, 112], [3480, -1800, 104], [3500, -1250, 96], [3420, -700, 86], [3400, -200, 76], [3440, 300, 74], [3560, 750, 80], [3850, 1100, 92], [4350, 1300, 104], [4950, 1250, 100], [5400, 1150, 96]] },
  { name: 'dunes', label: 'Dune Highway', from: { road: 'lakeside', end: true }, grade: 0.1, valley: 110,
    pts: [[5900, 1000, 92], [6400, 820, 88], [6700, 950, 90], [6850, 1500, 96], [6750, 2100, 104], [6400, 2650, 130], [5900, 3000, 165]] },
  { name: 'alpine', label: 'Alpine Pass', from: { road: 'dunes', end: true }, grade: 0.13, valley: 420,
    pts: [[5400, 3350, 215], [4850, 3650, 270], [4250, 3850, 315], [3650, 3950, 338], [3100, 3900, 280], [2500, 3750, 212], [1950, 3600, 148], [1450, 3500, 92], [1100, 3420, 52], [900, 3330, 27], [800, 3260, 11]] },
  { name: 'fjord', label: 'Fjord Road', from: { road: 'alpine', end: true }, grade: 0.1, valley: 70,
    pts: [[450, 3262, 12], [50, 3278, 16], [-400, 3250, 20], [-900, 3213, 24], [-1400, 3198, 28], [-1900, 3215, 32], [-2350, 3240, 32], [-2750, 3255, 36]] },
  { name: 'north', label: 'Northern Link', from: { road: 'alpine', end: true }, to: { road: 'old', at: [128, 1482] }, grade: 0.1, valley: 260,
    pts: [[700, 2950, 30], [560, 2600, 55], [420, 2250, 72], [300, 1900, 74], [200, 1640, 60]] }
];

// Polyline distance helpers, bucketed so land() stays cheap.
const SEGS = [];
for (const rd of FRONTIER_ROADS) { const p = rd.pts; for (let i = 0; i < p.length - 1; i++) SEGS.push({ a: p[i], b: p[i + 1], valley: rd.valley }); }
const BUCKET = 400, buckets = new Map(), bkey = (i, j) => i * 4096 + j;
for (const s of SEGS) { const reach = 30 + s.valley + 20, x0 = Math.floor((Math.min(s.a[0], s.b[0]) - reach) / BUCKET), x1 = Math.floor((Math.max(s.a[0], s.b[0]) + reach) / BUCKET), z0 = Math.floor((Math.min(s.a[1], s.b[1]) - reach) / BUCKET), z1 = Math.floor((Math.max(s.a[1], s.b[1]) + reach) / BUCKET);
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) (buckets.get(bkey(i, j)) || buckets.set(bkey(i, j), []).get(bkey(i, j))).push(s); }
function segProject(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1); return [Math.hypot(px - ax - dx * t, pz - az - dz * t), t]; }
function polyDist(px, pz, line) { let best = Infinity, at = 0; for (let i = 0; i < line.length - 1; i++) { const [d, t] = segProject(px, pz, line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]); if (d < best) { best = d; at = line[i][0] + (line[i + 1][0] - line[i][0]) * t; } } return [best, at]; }

export function coastX(z) { // x of the western shoreline beyond the valley
  const south = 60 + 140 * Math.sin(z / 530) - 1650 * Math.exp(-(((z + 3550) / 700) ** 2)) + 820 * Math.exp(-(((z + 4750) / 330) ** 2));
  const north = -128 + 80 * Math.sin(z / 400) - 2900 * sst(2200, 2900, z);
  return z < 0 ? south : north;
}
function dune(u, sharp = 0.72) { const s = u - Math.floor(u); return s < sharp ? Math.pow(Math.sin(s / sharp * Math.PI * 0.5), 1.7) : Math.pow(Math.cos((s - sharp) / (1 - sharp) * Math.PI * 0.5), 1.15); }
function desert(x, z) {
  const WA = 0.35, cw = Math.cos(WA), sw = Math.sin(WA), a = x * cw + z * sw, b = -x * sw + z * cw;
  const warp = fbm(x * 0.0007, z * 0.0007, 3) * 1.4 + Math.sin(b * 0.0031 + fbm(x * 0.0004, z * 0.0004, 2) * 3) * 0.33;
  const field = sst(0.32, 0.62, fbm(x * 0.00023 + 4, z * 0.00023, 3));
  const big = dune(a / 460 + warp) * (16 + 26 * fbm(x * 0.0005 + 7, z * 0.0005, 2)), mid = dune(a / 120 + warp * 2.1 + b * 0.0007) * 4.5 * (0.4 + 0.6 * dune(a / 460 + warp));
  let h = 72 + (big + mid) * field + (fbm(x * 0.0003, z * 0.0003, 3) - 0.5) * 50;
  for (const [mx, mz, mr, mh] of MESAS) { const m = mh * (1 - sst(mr * 0.55, mr * 1.15, Math.hypot(x - mx, z - mz) + (fbm(x * 0.004, z * 0.004, 2) - 0.5) * 120)); if (m > 2) { const f = (m + 40) / 38, i = Math.floor(f); h = Math.max(h, 80 + (i + sst(0.55, 0.95, f - i)) * 38 * 0.85 + m * 0.15); } }
  return h;
}

// Landscape beyond the valley (before it is blended into the valley's own relief).
export function wild(x, z) {
  const d = x - coastX(z), n1 = fbm(x / 820 + 11, z / 820 - 4, 5), n2 = fbm(x / 230, z / 230, 4);
  if (d < 0) { const k = Math.min(-d, 120) / 120; return Math.max(-62, 0.02 - k * k * 2.2 - Math.max(0, -d - 120) * 0.05); }
  let h = 1.2 + sst(0, 260, d) * (24 + (n1 - 0.38) * 170 + (n2 - 0.5) * 22);
  // the cape: sheer cliffs straight out of the sea
  const C = Math.exp(-(((z + 3550) / 950) ** 2)); h = Math.max(h, C * (86 + (n2 - 0.5) * 30) * sst(2, 42, d));
  // northern ranges, highest in the east
  const N = sst(2250, 3150, z), r = 1 - Math.abs(2 * fbm(x / 1300 + 3.1, z / 1300 + 7.3, 4) - 1);
  const crag = 1 - Math.abs(2 * fbm(x / 160 + 9, z / 160 - 3, 3) - 1);
  h += N * sst(0, 600, d) * (60 + r * r * (470 + 330 * sst(500, 3500, x)) + (n2 - 0.5) * 60 + crag * crag * 70 * r);
  // the volcano: a cone with a crater
  const rv = Math.hypot(x - VOLCANO.x, z - VOLCANO.z);
  if (rv < 2500) { const cone = 560 * Math.max(0, 1 - Math.max(rv, 330) / 2400) ** 1.5 - 120 * (1 - sst(110, 330, rv)) + (n2 - 0.5) * 24 * sst(380, 1300, rv); h = Math.max(h, mix(h, cone, sst(2500, 1900, rv))); }
  // the dune sea
  const D = sst(4700, 5500, x) * (1 - sst(3000, 3700, z)) * sst(-2700, -2000, z); if (D > 0) h = mix(h, desert(x, z), D);
  // high ground around the lake so it holds water
  const rl = Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz); if (rl < 2) h = mix(h, Math.max(h, 70 + (n2 - 0.5) * 10), 1 - sst(1.25, 1.95, rl));
  // a frame of mountains closes the map to the north, east and south
  const dE = Math.min(EXT.x1 - x, EXT.z1 - z, z - EXT.z0); h += 420 * sst(950, 60, dE) ** 1.4 * sst(0, 600, d) * (0.75 + 0.5 * r);
  // fjord walls
  const [dF, fx] = polyDist(x, z, FJORD), W = fjordWidth(fx);
  if (dF < W + 700) h = Math.min(h, dF < W + 45 ? -2 + (dF - W) / 45 * 9 : 7 + (dF - W - 45) * 1.9);
  // road valleys and benches
  const bucket = buckets.get(bkey(Math.floor(x / BUCKET), Math.floor(z / BUCKET)));
  if (bucket) for (const s of bucket) { const [ds, t] = segProject(x, z, s.a[0], s.a[1], s.b[0], s.b[1]); const w = 1 - sst(28, 28 + s.valley, ds); if (w > 0) h = mix(h, mix(s.a[2], s.b[2], t) - 0.6, w * 0.97); }
  // the fjord and lake hold water
  if (dF < W) h = Math.min(h, -2 - 60 * (1 - (dF / W) ** 2));
  if (rl < 1.3) h = Math.min(h, rl < 1 ? LAKE.level - 0.4 - 13 * (1 - rl * rl) : LAKE.level - 0.4 + (rl - 1) * 46);
  return h;
}

// How far outside the valley a point is; the frontier replaces the valley's relief over the first 600 m.
export const outside = (x, z) => Math.hypot(Math.max(INNER.x0 - x, 0, x - INNER.x1), Math.max(INNER.z0 - z, 0, z - INNER.z1));
export function blendLand(natural, x, z) { const o = outside(x, z); if (o <= 0) return natural(x, z); const w = sst(0, 600, o); return w >= 1 ? wild(x, z) : mix(natural(x, z), wild(x, z), w); }
export const inFjord = (x, z) => { const [dF, fx] = polyDist(x, z, FJORD); return 1 - sst(fjordWidth(fx) * 0.6, fjordWidth(fx) + 60, dF); };

// Surface character: x sand, y snowfields, z volcanic rock, w jungle moss.
export function zones(x, z) {
  const o = sst(0, 300, outside(x, z));
  const sand = sst(4800, 5450, x) * (1 - sst(2900, 3500, z)) * sst(-2600, -2100, z);
  const snow = sst(2300, 3000, z);
  const volcanic = 1 - sst(1500, 2450, Math.hypot(x - VOLCANO.x, z - VOLCANO.z));
  const jungle = (1 - sst(-2300, -1900, z)) * sst(-200, 500, x) * (1 - sst(2400, 3200, x));
  return [sand * o, snow * o, volcanic * o, jungle * o * (1 - volcanic)];
}
// Tree cover multiplier for the frontier.
export function lushness(x, z) {
  const [sand, , volcanic, jungle] = zones(x, z), forest = 1 - sst(1300, 2600, Math.hypot(x - 3700, z + 150));
  return clamp((1 - sand * 1.3) * (1 - volcanic * 0.85) + forest * 0.3 + jungle * 0.18, 0, 1.3);
}

// Named places in the frontier: [key, name, road, nearest-to (or 'end'), offset from the road, radius, map note]
export const FRONTIER_PLACES = [
  ['cape', 'Cape Lighthouse', 'cape', 'end', 0, 42, 'Sea cliffs and the tallest light on the coast'],
  ['temple', 'Temple of the Sun', 'temple', [1420, -3300], 165, 112, 'Stepped temple ruins in the jungle hills'],
  ['crater', 'Crater Rim', 'crater', 'end', 0, 34, 'A lava lake 70 m below the rim'],
  ['cabin', 'Mirror Lake', 'lakeside', [3440, 300], 70, 26, 'A forest lake with a cabin and jetty'],
  ['outpost', 'Dune Outpost', 'dunes', [6400, 820], 46, 40, 'Fuel, water and shade in the dune sea'],
  ['lodge', 'Alpine Lodge', 'alpine', [3650, 3950], 50, 40, 'The top of the pass, 340 m up'],
  ['village', 'Fjordheim', 'alpine', 'end', 0, 64, 'A fishing village at the head of the fjord'],
  ['mouth', 'Fjord Mouth', 'fjord', 'end', 0, 32, 'Where the fjord opens to the ocean']
];
