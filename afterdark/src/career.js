// Afterdark career: saved progress, the garage, time-trial routes, taxi and delivery jobs, and the full map.
import { P, ROADS, SPAN, HALF } from './city.js';
import { WORLD, EXT } from './world.js';

// ---------- Cars and upgrades ----------
export const CARS = [
  { id: 'coupe', name: 'Vanta RS', kind: 'Rear-engined coupé', vmax: 82, acc: 1, grip: 1, brake: 1, off: 1, eye: 1.06 },
  { id: 'hatch', file: 'car-gr-corolla', rig: true, name: 'Pico GT', kind: 'Hot hatch · nimble', vmax: 60, acc: 0.86, grip: 1.1, brake: 1.06, off: 1, eye: 1.13 },
  { id: 'sedan', file: 'road-sedan', name: 'Meridian', kind: 'Saloon · steady', vmax: 68, acc: 0.9, grip: 1.02, brake: 1, off: 1, eye: 1.14 },
  { id: 'pickup', file: 'road-pickup', name: 'Bronto', kind: 'Pickup · goes anywhere', vmax: 56, acc: 0.82, grip: 0.95, brake: 0.95, off: 0.35, eye: 1.42 },
  { id: 'suv', file: 'car-land-cruiser', rig: true, name: 'Atlas X', kind: '4×4 · fast off the road', vmax: 66, acc: 0.92, grip: 0.98, brake: 1, off: 0.45, eye: 1.56 },
  { id: 'estate', file: 'road-wagon', name: 'Meridian Estate', kind: 'Touring wagon', vmax: 56, acc: 0.85, grip: 1.03, brake: 1, off: 0.85, eye: 1.19 },
  { id: 'crossover', file: 'road-suv', name: 'Trailcrest', kind: 'Family SUV', vmax: 53, acc: 0.84, grip: 0.99, brake: 1, off: 0.65, eye: 1.45 },
  { id: 'compact', file: 'road-hatch', name: 'Pico City', kind: 'City hatchback', vmax: 48, acc: 0.8, grip: 1.09, brake: 1.08, off: 1, eye: 1.12 },
  { id: 'van', file: 'road-van', name: 'Courier', kind: 'Delivery van', vmax: 44, acc: 0.72, grip: 0.93, brake: 0.92, off: 0.8, eye: 1.55 },
  { id: 'escalade', file: 'car-escalade', rig: true, name: '2021 Cadillac Escalade Premium Luxury', kind: 'Full-size luxury SUV', vmax: 83, acc: 1.23, grip: 1.18, brake: 1.44, off: 0.62, eye: 1.56 },
  { id: 'mercedes', file: 'road-mercedes', rig: true, name: '1982 Mercedes-Benz W201', kind: 'Classic saloon', vmax: 49, acc: 0.73, grip: 0.98, brake: 0.95, off: 1, eye: 1.12 },
  { id: 'bus', file: 'road-bus', name: 'City Bus', kind: 'Local transit', vmax: 25, acc: 0.37, grip: 0.84, brake: 0.76, off: 1, eye: 1.95 },
  { id: 'coach', file: 'road-coach', name: 'Regional Coach', kind: 'Long-distance passenger coach', vmax: 31, acc: 0.42, grip: 0.87, brake: 0.8, off: 1, eye: 2.0 }
];
export const UPGRADES = [['e', 'Engine'], ['t', 'Tyres'], ['b', 'Brakes']], UP_COST = [1200, 3000, 6500], UP_MAX = 3;
export const carById = id => CARS.find(c => c.id === id) || CARS.find(c => c.id === 'escalade');

const KEY = 'afterdark:save';
export function loadSave() {
  const d = { cash: 0, car: 'escalade', cars: [], up: {}, times: {}, jobs: 0, earned: 0, seen: ['Downtown'] };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') Object.assign(d, s); } catch (e) {}
  d.cars = CARS.map(car => car.id);
  if (!d.cars.includes(d.car)) d.car = 'escalade'; d.cash = Math.max(0, Math.round(+d.cash || 0));
  for (const k of ['up', 'times']) if (!d[k] || typeof d[k] !== 'object') d[k] = {}; if (!Array.isArray(d.seen)) d.seen = ['Downtown'];
  return d;
}
export const commit = save => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
export const upLevel = (save, id, k) => Math.min(UP_MAX, Math.max(0, (save.up[id] && +save.up[id][k]) || 0));
// The handling numbers a car actually drives with: its base figures plus what has been fitted.
export function carSpec(save, id) { const c = carById(id), e = upLevel(save, id, 'e'), t = upLevel(save, id, 't'), b = upLevel(save, id, 'b');
  return { voice: c.id, file: c.file, rig: c.rig, vmax: c.vmax * (1 + 0.06 * e), acc: c.acc * (1 + 0.1 * e), grip: c.grip * (1 + 0.06 * t), brake: c.brake * (1 + 0.12 * b), off: c.off, eye: c.eye }; }
export const cr = n => Math.round(n).toLocaleString() + ' cr';
export const clockText = (t, tenths) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}${tenths ? '.' + Math.floor(t * 10 % 10) : ''}`;

// ---------- Time trials ----------
export const MEDALS = [['gold', 'Gold', 1500], ['silver', 'Silver', 900], ['bronze', 'Bronze', 500]];
export function buildRoutes(world, city) {
  const S = world.samples, routes = [];
  const along = (id, road, name, note, pace) => { const rd = world.roads.find(r => r.name === road); if (!rd) return; const a = rd.from + 12, b = rd.to - 12, cps = [];
    for (let i = a + 70; i < b - 40; i += 70) { let k = i; while (S[k].tunnel && k < b - 40) k += 4; cps.push({ x: S[k].x, z: S[k].z, y: S[k].y }); }
    cps.push({ x: S[b].x, z: S[b].z, y: S[b].y }); const s0 = S[a], len = (b - a) * 3;
    routes.push({ id, name, note, len, r: 12, cps, start: { x: s0.x - s0.lx * 2.5, z: s0.z - s0.lz * 2.5, h: Math.atan2(s0.tx, s0.tz) }, gold: len / pace, silver: len / (pace * 0.85), bronze: len / (pace * 0.66) }); };
  along('coast', 'coast', 'Coast Road', 'Out past the harbour and the lighthouse, through the tunnel and home by Eastfield.', 41);
  along('old', 'old', 'Old Town Loop', 'A tight, twisting lane through the hill town north of the grid. Nothing straight, nowhere to rest.', 24);
  along('mountain', 'mountain', 'Mountain Pass', 'Up from the stadium to the summit lookout and back down through Pinecrest.', 30);
  along('temple', 'temple', 'Jungle Run', 'South from the coast road, past the Temple of the Sun to the foot of the volcano.', 33);
  along('crater', 'crater', 'Crater Climb', 'Hairpins up the volcano to the rim above the lava lake.', 26);
  along('lakeside', 'lakeside', 'Mirror Lake Forest', 'Through deep forest and along the lake shore toward the dunes.', 34);
  along('dunes', 'dunes', 'Dune Highway', 'Fast, open sweepers through the dune sea and past the mesas.', 40);
  along('alpine', 'alpine', 'Alpine Pass', 'Over the snowline at the Alpine Lodge and down to the fjord.', 31);
  along('fjord', 'fjord', 'Fjord Road', 'Along the water under the waterfalls to the open ocean.', 33);
  { const J = [[3, 6], [6, 6], [6, 1], [1, 1], [1, 4], [3, 4]], cps = J.map(([i, j]) => ({ x: i * P, z: j * P, y: 0 })); let len = 3 * P - 40, q = [3, 6]; for (const j of J.slice(1)) { len += (Math.abs(j[0] - q[0]) + Math.abs(j[1] - q[1])) * P; q = j; }
    routes.push({ id: 'city', name: 'Downtown Sprint', note: 'Six corners through the grid with the traffic running. Lights are yours to judge.', len, r: 13, cps, start: { x: city.spawn.x, z: city.spawn.z, h: 0 }, gold: len / 27, silver: len / 22, bronze: len / 16 }); }
  return routes;
}
export const medalFor = (route, t) => t <= route.gold ? 0 : t <= route.silver ? 1 : t <= route.bronze ? 2 : -1;

// ---------- Taxi and delivery jobs ----------
const DISTRICT = (i, j) => i <= 1 ? 'Seafront' : j <= 1 ? 'Southside' : j >= 6 ? 'Northgate' : i >= 6 ? 'Eastside' : 'Midtown';
export function jobSpots(world, places) {
  const out = [];
  for (let i = 0; i < ROADS; i++) for (let j = 0; j < ROADS - 1; j++) { if ((i * 3 + j) % 2) continue; out.push({ x: i * P, z: (j + 0.5) * P, y: 0, name: DISTRICT(i, j), city: true }); out.push({ x: (j + 0.5) * P, z: i * P, y: 0, name: DISTRICT(j, i), city: true }); }
  for (const pm of places.markers) { if (pm.arrival) { out.push({ ...pm.arrival, city: false }); continue; } let s = pm.road; if (!s) { const r = world.nearRoad(pm.x, pm.z, 700); s = r && r.s; } if (s && !s.tunnel) out.push({ x: s.x, z: s.z, y: s.y, name: pm.name, city: false }); }
  for (const rd of world.roads) for (const f of [0.22, 0.45, 0.6]) { const s = world.samples[Math.round(rd.from + (rd.to - rd.from) * f)]; if (s && !s.tunnel && !s.bridge) out.push({ x: s.x, z: s.z, y: s.y, name: rd.name === 'coast' ? 'Coast road lay-by' : rd.name === 'old' ? 'Old Town lane' : rd.name === 'mountain' ? 'Mountain road lay-by' : (rd.label || rd.name) + ' lay-by', city: false }); }
  return out;
}
const RIDERS = ['A night-shift nurse', 'Two tourists', 'A chef with a knife roll', 'A band with one guitar', 'A man in a hurry', 'A student with a cello', 'A photographer', 'Someone late for a ferry', 'A couple after the match', 'A lighthouse keeper'];
const PARCELS = ['Camera lenses', 'A wedding cake', 'Blueprints', 'Fresh fish on ice', 'A crate of records', 'Spare engine parts', 'Stage lights', 'Medicine', 'A neon sign', 'Glassware'];
export function nextJob(spots, type, px, pz, rnd = Math.random) {
  const d = (a, x, z) => Math.hypot(a.x - x, a.z - z); let from = null, to = null;
  for (let n = 0; n < 200 && !from; n++) { const s = spots[Math.floor(rnd() * spots.length)], k = d(s, px, pz); if (k > 110 && k < (n < 120 ? 900 : 4000)) from = s; }
  from ||= spots[0];
  for (let n = 0; n < 200 && !to; n++) { const s = spots[Math.floor(rnd() * spots.length)], k = d(s, from.x, from.z); if (s !== from && k > 420 && k < (n < 120 ? 2600 : 6000) && (n > 60 || s.city !== from.city || rnd() < 0.5)) to = s; }
  to ||= spots[spots.length - 1];
  const dist = d(to, from.x, from.z), wind = from.city && to.city ? 1.35 : 2.1, pay = Math.round((90 + dist * wind * 0.34) * (type === 'delivery' ? 1.25 : 1) / 10) * 10;
  return { type, from, to, dist, pay, limit: Math.round(dist * wind / (type === 'delivery' ? 17 : 14) + 26), what: (type === 'delivery' ? PARCELS : RIDERS)[Math.floor(rnd() * 10)] };
}
// What is paid out: a little for time in hand, less for every knock on the way.
export function jobPay(job, left, hits) { const care = Math.max(0.3, 1 - hits * (job.type === 'delivery' ? 0.15 : 0.08)); return { total: Math.round((job.pay * care + Math.max(0, left) * 2) / 10) * 10, care }; }

// ---------- Full map ----------
export function createBigMap(canvas, world, places) {
  const W = EXT, wx = W.x1 - W.x0, wz = W.z1 - W.z0, ctx = canvas.getContext('2d'); let base = null, fit = null, size = { w: 1, h: 1 };
  // The view: zoom 1 shows the whole map; the centre is a world point. Opening the map zooms in on the car.
  const view = { zoom: 2.4, cx: (W.x0 + W.x1) / 2, cz: (W.z0 + W.z1) / 2 }, clampView = () => { view.zoom = Math.min(8, Math.max(1, view.zoom)); const hx = wx / 2 * (1 - 1 / view.zoom), hz = wz / 2 * (1 - 1 / view.zoom), mx = (W.x0 + W.x1) / 2, mz = (W.z0 + W.z1) / 2; view.cx = Math.min(mx + hx + 400, Math.max(mx - hx - 400, view.cx)); view.cz = Math.min(mz + hz + 400, Math.max(mz - hz - 400, view.cz)); };
  function paint() { // shaded relief, drawn once
    const bw = 900, bh = Math.round(bw * wz / wx), cv = document.createElement('canvas'); cv.width = bw; cv.height = bh; const c = cv.getContext('2d'), img = c.createImageData(bw, bh), D = img.data; let top = 60; for (let i = 0; i < 4000; i++) top = Math.min(520, Math.max(top, world.terrain(W.x0 + wx * ((i * 0.6180339) % 1), W.z0 + wz * ((i * 0.7548776) % 1))));
    for (let py = 0; py < bh; py++) for (let px = 0; px < bw; px++) { const x = W.x1 - (px + 0.5) / bw * wx, z = W.z1 - (py + 0.5) / bh * wz, h = world.terrain(x, z), hl = world.terrain(x + 14, z + 14), sh = Math.max(-1, Math.min(1, (h - hl) * 0.09)); let r, g, b;
      if (h < -0.5) { const k = Math.min(1, (-h - 0.5) / 14); r = 22 - 10 * k; g = 52 - 22 * k; b = 78 - 26 * k; }
      else if (h < 1.6) { r = 138; g = 126; b = 96; }
      else { const k = Math.min(1, h / top); r = 40 + 92 * k; g = 68 + 40 * k; b = 46 + 50 * k; if (k > 0.8) { const s = Math.min(1, (k - 0.8) / 0.18); r += (214 - r) * s; g += (218 - g) * s; b += (224 - b) * s; } }
      if (h >= 1.6 && world.zones) { const [sa, , vo] = world.zones(x, z); r += (214 - r) * sa * 0.8; g += (182 - g) * sa * 0.8; b += (122 - b) * sa * 0.8; r += (52 - r) * vo * 0.7; g += (46 - g) * vo * 0.7; b += (46 - b) * vo * 0.7; }
      const lk = world.lake; if (lk && ((x - lk.x) / lk.rx) ** 2 + ((z - lk.z) / lk.rz) ** 2 < 1.4 && h < lk.level) { r = 30; g = 66; b = 92; }
      const l = 1 + sh * 0.5, o = (py * bw + px) * 4; D[o] = r * l; D[o + 1] = g * l; D[o + 2] = b * l; D[o + 3] = 255; }
    c.putImageData(img, 0, 0); base = cv; }
  const api = { view,
    center(x, z, zoom) { view.cx = x; view.cz = z; if (zoom) view.zoom = zoom; clampView(); },
    pan(dx, dy) { if (!fit) return; view.cx += dx / fit.k; view.cz += dy / fit.k; clampView(); },
    zoomAt(f, sx, sy) { if (!fit) return; const before = api.toWorld(sx, sy, true); view.zoom *= f; clampView(); const k = Math.min(size.w / wx, size.h / wz) * view.zoom; if (before) { view.cx = before.x + (sx - size.w / 2) / k; view.cz = before.z + (sy - size.h / 2) / k; clampView(); } },
    toWorld(cx, cy, loose) { if (!fit) return null; const x = W.x1 - (cx - fit.ox) / fit.k, z = W.z1 - (cy - fit.oy) / fit.k; return !loose && (x < W.x0 || x > W.x1 || z < W.z0 || z > W.z1) ? null : { x, z }; },
    draw(st) { if (!base) paint(); const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), cw = Math.max(200, Math.round(r.width * dpr)), ch = Math.max(200, Math.round(r.height * dpr)); if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      clampView(); size = { w: cw / dpr, h: ch / dpr }; const k = Math.min(cw / wx, ch / wz) * view.zoom, X = x => cw / 2 + (view.cx - x) * k, Y = z => ch / 2 + (view.cz - z) * k, ox = X(W.x1), oy = Y(W.z1), u = Math.min(cw, 1400) / 900; fit = { k: k / dpr, ox: ox / dpr, oy: oy / dpr };
      ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = 'rgba(12,20,34,.82)'; ctx.fillRect(0, 0, cw, ch); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(base, ox, oy, wx * k, wz * k); ctx.lineCap = ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(26,30,44,.86)'; ctx.fillRect(X(SPAN + HALF + 4), Y(SPAN + HALF + 4), (SPAN + 2 * HALF + 8) * k, (SPAN + 2 * HALF + 8) * k);
      ctx.strokeStyle = 'rgba(205,216,240,.75)'; ctx.lineWidth = Math.max(1, 1.6 * u); ctx.beginPath(); for (let i = 0; i < ROADS; i++) { ctx.moveTo(X(i * P), Y(0)); ctx.lineTo(X(i * P), Y(SPAN)); ctx.moveTo(X(0), Y(i * P)); ctx.lineTo(X(SPAN), Y(i * P)); } ctx.stroke();
      for (const [col, lw] of [['rgba(10,12,18,.8)', 5.2], ['#ffd896', 2.6]]) { ctx.strokeStyle = col; ctx.lineWidth = lw * u; ctx.beginPath(); for (const rd of world.roads) for (let i = rd.from; i <= rd.to; i += 4) { const s = world.samples[i]; if (i === rd.from) ctx.moveTo(X(s.x), Y(s.z)); else ctx.lineTo(X(s.x), Y(s.z)); } ctx.stroke(); }
      const airfield = world.places.find(p => p.key === 'airport');
      if (airfield) {
        ctx.strokeStyle = '#adb7bf'; ctx.lineWidth = Math.max(1, 1.7 * u);
        ctx.beginPath();
        ctx.moveTo(X(airfield.x), Y(airfield.road.z));
        ctx.lineTo(X(airfield.x), Y(airfield.arrival.z));
        const { u: runwayOffset, v, length } = airfield.runway;
        ctx.moveTo(X(airfield.x + runwayOffset - length / 2), Y(airfield.z + v));
        ctx.lineTo(X(airfield.x + runwayOffset + length / 2), Y(airfield.z + v));
        ctx.stroke();
      }
      if (st.route) { ctx.strokeStyle = '#35ffe0'; ctx.lineWidth = 1.5 * u; ctx.setLineDash([5 * u, 5 * u]); ctx.beginPath(); ctx.moveTo(X(st.route.start.x), Y(st.route.start.z)); for (const c of st.route.cps) ctx.lineTo(X(c.x), Y(c.z)); ctx.stroke(); ctx.setLineDash([]); }
      ctx.font = `700 ${Math.round(12.5 * u)}px system-ui,-apple-system,Segoe UI,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const label = (t, x, y, seen) => { ctx.lineWidth = 3.4 * u; ctx.strokeStyle = 'rgba(6,8,14,.85)'; ctx.strokeText(t, x, y); ctx.fillStyle = seen ? '#fff' : 'rgba(255,255,255,.62)'; ctx.fillText(t, x, y); };
      for (const pm of places.markers) { const mx = X(pm.x), my = Y(pm.z), seen = st.seen.has(pm.name); ctx.fillStyle = seen ? '#fff' : 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(mx, my - 5 * u); ctx.lineTo(mx + 5 * u, my); ctx.lineTo(mx, my + 5 * u); ctx.lineTo(mx - 5 * u, my); ctx.closePath(); ctx.fill(); label(seen ? pm.name : '?', mx, my - 7 * u, seen); }
      label('Downtown', X(SPAN / 2), Y(SPAN + HALF + 8), true);
      if (st.target) { const bx = X(st.target.x), by = Y(st.target.z); ctx.strokeStyle = '#35ffe0'; ctx.lineWidth = 2.2 * u; ctx.beginPath(); ctx.arc(bx, by, (8 + Math.sin(st.t * 5) * 2) * u, 0, 7); ctx.stroke(); ctx.fillStyle = '#35ffe0'; ctx.beginPath(); ctx.arc(bx, by, 3.4 * u, 0, 7); ctx.fill(); label(st.targetName, bx, by - 12 * u, true); }
      ctx.save(); ctx.translate(X(st.px), Y(st.pz)); ctx.rotate(-st.heading); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.moveTo(0, -10 * u); ctx.lineTo(7 * u, 8 * u); ctx.lineTo(0, 4 * u); ctx.lineTo(-7 * u, 8 * u); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } };
  return api;
}
