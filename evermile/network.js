import {DESTINATIONS, DISTRICT_END, inDestination} from './destinations.js?v=20260926-supplied7';
import {clamp, lerp, smooth, noise, random, hashSeed} from './math.js?v=20260926-supplied7';

/*
  The road network. The world is still laid out along z, but the road is now a chain of segments, each of a kind
  (hill road, farm lanes, lakeside/coast road, mountain pass, motorway). Every few kilometres a junction offers two
  ways on: carry on along this kind of road, or turn off left or right towards another. Both branches are built and
  drawn through the junction; each climbs over a crest a few hundred metres on, so once you pick one the world beyond
  the crest can be rebuilt for your choice without you seeing it change.
*/
export const FORK = 420, ZONE = FORK + 150, RAMP = 500, CREST = 7, SEA = -8;

export const TYPES = {
  country: {label: 'Hill Road', half: 5.3, lanes: [2.65], limit: 27, towns: true, rivers: true, rail: .72},
  farm: {label: 'Farm Lanes', half: 3.7, lanes: [1.85], limit: 19, towns: true, rivers: true, rail: .7},
  coast: {label: 'Lakeside Road', half: 4.9, lanes: [2.45], limit: 24, towns: true, rail: .55},
  mountain: {label: 'Mountain Pass', half: 4.3, lanes: [2.15], limit: 16},
  highway: {label: 'Motorway', half: 11.6, lanes: [4, 7.6], limit: 33, median: 1.7},
};
const PLACES = {
  country: ['Millbrook', 'Ashford', 'Elmsworth', 'Harrow Vale', 'Linden', 'Oakhurst', 'Fernley', 'Wrenfield', 'Stonebridge', 'Marlow Green', 'Bramble End'],
  farm: ['Meadow Farms', 'Oak Barn', 'Willow Fields', 'Harvest Lane', 'Clover Hill', 'Hayfield'],
  coast: ['Kestrel Bay', 'Seabrook', 'Gull Cove', 'Harbour Point', 'Saltmarsh', 'Marina Heights'],
  mountain: ['Eagle Pass', 'Pine Ridge', 'Summit View', 'High Crag', 'Snowcap', 'Falcon Peak'],
  highway: ['M4 North', 'City Motorway', 'A1 Express', 'Coast Motorway'],
};
const NEXT = {country: ['farm', 'coast', 'mountain', 'highway'], farm: ['country', 'coast', 'mountain'], coast: ['country', 'mountain', 'farm', 'highway'], mountain: ['country', 'coast', 'farm'], highway: ['country', 'coast', 'mountain', 'farm']};
// Every road layout gets its own version number, so anything remembered against an older road (or a road from before a
// rebuild) is always recognised as stale.
let versions = 0;
const bump = (t) => (t <= -1 || t >= 1 ? 0 : (1 - t * t) ** 2);
const mix = (a, b) => (Math.imul(a ^ 0x9e3779b9, 2654435761) ^ b) >>> 0;

class Segment {
  constructor(net, parent, z0, type, side, option) {
    this.net = net; this.parent = parent; this.z0 = z0; this.type = type; this.side = side; this.option = option;
    this.id = parent ? mix(mix(parent.id, option + 1), Math.round(z0)) : net.id;
    const rng = random(this.id + 7);
    this.rng = rng;
    this.len = parent ? 2300 + rng() * 1300 : 1900 + rng() * 700;
    this.z1 = net.off ? Infinity : z0 + this.len;
    this.D = side ? 100 + rng() * 25 : 0;
    this.p = [rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28];
    this.name = PLACES[type][Math.floor(rng() * PLACES[type].length)];
    this.seaSide = rng() < .5 ? -1 : 1;
    this.same = parent && !side && parent.type === type;
    // Straight-on continuations share their road with the first ancestor that is not one, so lookups never chain back.
    this.base = this.same ? (parent.same ? parent.base : parent) : null;
    const t = TYPES[type];
    this.halfW = type === 'country' ? net.settings.roadWidth / 2 : t.half;
    this.laneOff = type === 'country' ? t.lanes.map((l) => l * this.halfW / 5.3) : t.lanes;
    if (this.same) { this.ownX = parent.ownX; this.ownY = parent.ownY; this.cx = parent.cx; this.seaSide = parent.seaSide; this.p = parent.p; }
    else this.makeGenerators();
    // A side road keeps its outer edge in line with the road it leaves, like a slip road, while it narrows or widens.
    this.startHalf = parent ? parent.half(z0) : this.halfW;
    this.edge = side ? side * (this.startHalf - this.halfW) : 0;
    if (parent && !this.same) {
      const zs = z0 + ZONE;
      this.cx = parent.x(zs) + side * this.D + this.edge - this.ownX(zs);
      this.cy = parent.y(zs) - this.ownY(zs);
    } else if (!parent) { this.cx = 0; this.cy = 0; }
    else this.cy = parent.y(z0 + ZONE) - this.ownY(z0 + ZONE);
    // Long enough to keep the change in height to about a 6% grade.
    this.settle = Math.max(900, Math.abs(this.cy || 0) / .035 * 1.6);
  }

  makeGenerators() {
    const [a, b, c, d] = this.p, z0 = this.z0, amp = {straight: 0, casual: .46, normal: 1, winding: 1.8}[this.net.settings.roadStyle] ?? 1;
    const G = {
      country: [(z) => amp * (62 * Math.sin(z * .0022 + a) + 22 * Math.sin(z * .0061 + a * .5) + 7 * Math.sin(z * .013 + a * 2)), (z) => 21 + 8 * Math.sin(z * .00165 + a) + 4 * Math.sin(z * .0042 + a * .2)],
      farm: [(z) => 30 * Math.sin(z * .0031 + a) + 12 * Math.sin(z * .0083 + b) + 4 * Math.sin(z * .019 + c), (z) => 13 + 3 * Math.sin(z * .0021 + b) + 1.2 * Math.sin(z * .0063 + c)],
      coast: [(z) => 55 * Math.sin(z * .0016 + a) + 20 * Math.sin(z * .0047 + b) + 6 * Math.sin(z * .012 + c), (z) => -1.2 + 2.2 * Math.sin(z * .0027 + b) + .8 * Math.sin(z * .0071 + c)],
      // Mountain: tight bends that snake up the slope, climbing about 190 m to a pass and back down.
      mountain: [(z) => 34 * Math.sin(z * .012 + a) + 14 * Math.sin(z * .026 + b) + 60 * Math.sin(z * .0021 + c), (z) => 24 + 82 * (1 - Math.cos(2 * Math.PI * (z - z0) / 8200)) + 2 * Math.sin(z * .011 + d)],
      highway: [(z) => 120 * Math.sin(z * .0007 + a) + 30 * Math.sin(z * .0019 + b), (z) => 18 + 5 * Math.sin(z * .0011 + b)],
    }[this.type];
    this.ownX = G[0]; this.ownY = G[1];
    if (!this.parent && !this.net.off && this.net.settings.destination && this.net.settings.destination !== 'journey') {
      const name = this.net.settings.destination, curve = name === 'airport' ? .3 : name === 'lake' ? 7 : 2;
      this.ownX = z => curve * Math.sin(z * .004);
      this.ownY = z => name === 'lake' ? -3 : name === 'oldtown' ? 1.5 : 0;
      this.seaSide = -1; this.len = 3000; this.z1 = this.z0 + this.len;
    }
  }

  x(z) {
    if (!this.parent) return this.ownX(z) + this.cx;
    if (this.same) return this.base.x(z);
    const u = z - this.z0;
    if (u >= ZONE + RAMP) return this.ownX(z) + this.cx;
    const trunk = this.parent.x(z);
    if (u <= 0) return trunk;
    // An S-bend away from the trunk: no kink where the roads part, so nobody (autodrive included) is thrown wide into the gore.
    const k = smooth(0, FORK, u), fork = this.side * this.D * k + this.edge * smooth(0, FORK, u), w = smooth(ZONE, ZONE + RAMP, u);
    return trunk + fork + (w ? w * (this.ownX(z) + this.cx - trunk - this.side * this.D - this.edge) : 0);
  }

  y(z) {
    if (!this.parent) return this.ownY(z);
    const u = z - this.z0, trunkRoad = this.same ? this.base : this.parent;
    const own = () => this.ownY(z) + this.cy * (1 - smooth(ZONE + RAMP, ZONE + RAMP + this.settle, u));
    if (u >= ZONE + RAMP && !this.same) return own();
    const trunk = trunkRoad.y(z);
    if (u <= 0 || u > FORK + 180) return this.same || u <= 0 ? trunk : trunk + smooth(ZONE, ZONE + RAMP, u) * (own() - trunk);
    let crest = CREST * bump((u - FORK - 10) / 160); const w = smooth(ZONE, ZONE + RAMP, u);
    if (crest) crest *= 1 - .75 * clamp(Math.abs(trunkRoad.y(z + 2) - trunkRoad.y(z - 2)) / 4 / .06, 0, 1);
    if (this.same) return trunk + crest;
    return trunk + crest + w * (own() - trunk);
  }

  // How much of this road's own character applies here: none in the junction's shared zone, full after the ramp.
  weight(z) { if (!this.parent) return 1; if (this.same) return this.base.weight(z); return smooth(ZONE, ZONE + RAMP, z - this.z0); }
  half(z) {
    if (this.same) return this.base.half(z);
    if (!this.parent) return this.halfW;
    if (this.side) return lerp(this.startHalf, this.halfW, smooth(0, FORK, z - this.z0));
    return lerp(this.parent.half(z), this.halfW, smooth(0, 80, z - this.z0));
  }
  // Lane centres; a branch starts with the lanes of the road it leaves (the outer ones when it has fewer) and blends to its own.
  lanes(z) {
    if (this.same) return this.base.lanes(z);
    const u = z - this.z0, span = this.side ? FORK : 80;
    if (!this.parent || u >= span) return this.laneOff;
    const k = smooth(0, span, u), p = this.parent.lanes(Math.min(z, this.z0)), n = this.laneOff.length, extra = Math.max(0, p.length - n);
    return this.laneOff.map((l, i) => lerp(p[Math.min(p.length - 1, i + extra)], l, k));
  }
  typeAt(z) { if (this.same) return this.base.typeAt(z); return this.weight(z) > .5 || !this.parent ? this.type : this.parent.typeAt(z); }
  upF(z) { return Math.sin(z * .0011 + this.p[3]); }
}

export class Network {
  // With a route (from an older copy of the same road), the same turns are taken again, so a rebuild for a new season,
  // width or quality leaves you on the road you were driving rather than back on the one you turned off.
  constructor(settings, route = null) {
    this.settings = settings; this.id = hashSeed(settings.seed); this.off = settings.location !== 'hills';
    this.version = ++versions; this.junctions = []; this.count = 0; this.picks = []; this.done = 0;
    this.segs = [new Segment(this, null, -700, this.off ? 'country' : (DESTINATIONS[settings.destination]?.type || 'country'), 0, 0)];
    this.caches = new Map(); this.rowZ = NaN; this.row = null;
    this.extend(4000);
    if (route && !this.off) for (let n = 0; n < route.picks.length; n++) {
      let j; while (!(j = this.junctions.find((q) => q.n === n))) this.extend(this.segs[this.segs.length - 1].z1 + 1);
      if (route.picks[n]) this.choose(j, route.picks[n]);
      if (n < route.done) { j.committed = true; this.done = n + 1; }
      if (route.picked.includes(n)) j.picked = true;
    }
  }
  get route() { return {picks: this.picks.slice(), done: this.done, picked: this.junctions.filter((j) => j.picked).map((j) => j.n)}; }

  get type0() { return this.segs[0].type; }

  // Make sure the path is known this far ahead; new junctions default to carrying straight on.
  extend(zMax) {
    if (this.off) return;
    let last = this.segs[this.segs.length - 1];
    while (last.z1 < zMax) {
      const rng = random(last.id + 99), choices = NEXT[last.type], bType = choices[Math.floor(rng() * choices.length)];
      // Motorway exits leave from your own carriageway.
      const coin = rng(), side = last.type === 'highway' ? this.side : coin < .5 ? -1 : 1;
      const A = new Segment(this, last, last.z1, last.type, 0, 0), B = new Segment(this, last, last.z1, bType, side, 1);
      const j = {z: last.z1, from: last, options: [A, B], chosen: 0, committed: false, side, n: this.count++};
      this.picks[j.n] = 0;
      this.junctions.push(j); this.segs.push(A); last = A;
    }
  }

  segAt(z) { const s = this.segs; for (let i = s.length - 1; i > 0; i--) if (z >= s[i].z0) return s[i]; return s[0]; }
  x(z) { return this.segAt(z).x(z); }
  y(z) { return this.segAt(z).y(z); }
  tangent(z) { const s = this.segAt(z); return s.x(z + .5) - s.x(z - .5); }
  slope(z) { const s = this.segAt(z); return s.y(z + .5) - s.y(z - .5); }
  // The road is laid out as x(z), so where it runs at an angle its span across x is wider than its true width.
  stretch(s, z) { const t = s.x(z + .5) - s.x(z - .5); return Math.sqrt(1 + t * t); }
  half(z) { const s = this.segAt(z); return s.half(z) * this.stretch(s, z); }
  // True half width, across the road rather than across x.
  width(z) { return this.segAt(z).half(z); }
  typeAt(z) { return this.segAt(z).typeAt(z); }
  limit(z) { return TYPES[this.typeAt(z)].limit; }
  get side() { return this.settings.autoLane === 'right' ? -1 : 1; }
  // Lateral offset of a lane centre from the road centre. dir +1 = your direction, -1 = oncoming; lane 0 is the one nearest the centre.
  laneX(z, dir = 1, lane = 0) { const s = this.segAt(z), l = s.lanes(z); return this.side * dir * l[Math.min(lane, l.length - 1)] * this.stretch(s, z); }
  laneCount(z) { return this.segAt(z).lanes(z).length; }
  // Your usual lane: the outer (slow) lane on a motorway, the only lane elsewhere.
  homeLane(z) { return this.laneCount(z) - 1; }
  median(z) { return this.typeAt(z) === 'highway' ? TYPES.highway.median * this.segAt(z).weight(z) * this.stretch(this.segAt(z), z) : 0; }

  // Frozen copy of the current path: traffic keeps driving the road it spawned on even if you turn off elsewhere.
  // With a junction and option, the copy takes that branch instead, so a car can turn off (or come in from) a side road.
  snapshot(j = null, option = 0) {
    let segs = this.segs.slice();
    if (j) { const at = segs.indexOf(j.from); if (at >= 0) segs = [...segs.slice(0, at + 1), j.options[option]]; }
    const net = this, end = j ? j.z + ZONE : Infinity, version = this.version;
    // The main path follows the live road while it is unchanged, and beyond its own last segment, so traffic never
    // drives on a stale copy (missing the crests after junctions, say) and ends up above or below the real road.
    const at = (z) => {
      if (!j && net.version === version) return net.segAt(z);
      const last = segs[segs.length - 1];
      if (!j && z > last.z1 && net.segs.includes(last)) return net.segAt(z);
      for (let i = segs.length - 1; i > 0; i--) if (z >= segs[i].z0) return segs[i]; return segs[0];
    };
    return {version: this.version, segs, end, seg: at, x: (z) => at(z).x(z), y: (z) => at(z).y(z), tangent: (z) => at(z).x(z + .5) - at(z).x(z - .5), slope: (z) => at(z).y(z + .5) - at(z).y(z - .5), half: (z) => at(z).half(z) * net.stretch(at(z), z),
      typeAt: (z) => at(z).typeAt(z), laneX: (z, dir = 1, lane = 0) => { const s = at(z), l = s.lanes(z); return net.side * dir * l[Math.min(lane, l.length - 1)] * net.stretch(s, z); }, laneCount: (z) => at(z).lanes(z).length,
      // Does this path still match the road you are on at z?
      current: (z) => at(z) === net.segAt(z) || Math.abs(at(z).x(z) - net.x(z)) < .5};
  }

  /* ---------- Junctions ---------- */
  junctionAhead(z, range = 900) { return this.junctions.find((j) => !j.committed && j.z > z - 30 && j.z - z < range) || null; }
  optionInfo(j, i) { const o = j.options[i]; return {type: o.type, label: TYPES[o.type].label, name: o.name, side: o.side, dir: o.side === 0 ? 'ahead' : o.side > 0 ? 'left' : 'right'}; }
  // Pick a branch before reaching it (indicator or tap); returns true if the road ahead changed.
  choose(j, i) {
    if (!j || j.committed || j.chosen === i) return false;
    const k = this.junctions.indexOf(j); if (k < 0) return false;
    j.chosen = i; this.junctions.length = k + 1; this.count = j.n + 1; this.picks.length = j.n + 1; this.picks[j.n] = i;
    const at = this.segs.indexOf(j.from); this.segs.length = at + 1; this.segs.push(j.options[i]);
    this.version = ++versions; this.rowZ = NaN;
    // Towns and rivers before the junction stay exactly as they are; those beyond it are worked out again.
    for (const key of [...this.caches.keys()]) {
      const m = /^(town|br)(-?\d+)$/.exec(key); if (!m) continue;
      const size = m[1] === 'town' ? 1400 : 2300, start = Number(m[2]) * size, old = this.caches.get(key);
      if (start + size <= j.z - 350) continue;
      this.caches.delete(key);
      // A cell straddling the junction keeps whatever already lies before it, so nothing already built moves.
      if (start < j.z) {
        const now = m[1] === 'town' ? this.townAt(start + 1) : this.bridgeCell(Number(m[2]));
        if ((old && old.end < j.z) || (now && now.start < j.z)) this.caches.set(key, old && old.end < j.z ? old : null);
      }
    }
    this.extend(j.z + 6000);
    return true;
  }
  // Once you are past a junction, the branch you are actually on becomes the road.
  commit(x, z) {
    let changed = null;
    for (const j of this.junctions.slice()) {
      if (j.committed || z < j.z + 25) continue;
      // Which road surface you are actually on (or nearer the edge of, if neither). While both roads still overlap
      // under you, wait until they part: you can still steer onto either.
      const edge = (o) => Math.abs(x - o.x(z)) - o.half(z) * this.stretch(o, z), eA = edge(j.options[0]), eB = edge(j.options[1]);
      if (eA <= 0 && eB <= 0 && z < j.z + ZONE) continue;
      const pick = z > j.z + ZONE ? j.chosen : eB < eA ? 1 : 0;
      if (pick !== j.chosen && this.choose(j, pick)) changed = j;
      j.committed = true; this.done = Math.max(this.done, j.n + 1);
    }
    // Forget segments far behind.
    while (this.segs.length > 3 && this.segs[1].z1 < z - 3000) this.segs.shift();
    while (this.junctions.length && this.junctions[0].z < z - 3000) this.junctions.shift();
    this.extend(z + 6000);
    return changed;
  }
  // The branch not taken is still drawn through the junction zone.
  stubs(z) {
    const out = [];
    for (const j of this.junctions) if (z >= j.z - 5 && z <= j.z + ZONE) out.push({seg: j.options[1 - j.chosen], j});
    return out;
  }

  // Every road surface crossing this z: the main road first, then any junction branches. Cached per row.
  roadsAt(z) {
    if (z === this.rowZ) return this.row;
    const s = this.segAt(z), rows = [{x: s.x(z), y: s.y(z), half: s.half(z) * this.stretch(s, z), seg: s, w: s.weight(z), main: true, fade: 1}];
    for (const st of this.stubs(z)) { const u = z - st.j.z; rows.push({x: st.seg.x(z), y: st.seg.y(z), half: st.seg.half(z) * this.stretch(st.seg, z), seg: st.seg, w: 0, main: false, fade: 1 - smooth(ZONE - 70, ZONE, u), u}); }
    this.rowZ = z; this.row = rows;
    return rows;
  }
  // Which road surface is under a point, if any.
  roadUnder(x, z, margin = 0) {
    for (const r of this.roadsAt(z)) if (Math.abs(x - r.x) <= r.half + margin && r.fade > .5) return r;
    return null;
  }

  cached(key, fn) { if (!this.caches.has(key)) this.caches.set(key, fn()); return this.caches.get(key); }

  /* ---------- Features on each segment: tunnels, railway, stops ---------- */
  hills(px, z) {
    const id = this.id, n = noise(px * .003, z * .003, id), n2 = noise(px * .011, z * .011, id + 41), n3 = noise(px * .041, z * .041, id + 9);
    return (n - .42) * 140 + (n2 - .5) * 29 + (n3 - .5) * (this.off ? 12 : 5);
  }
  ridges(seg) {
    return this.cached('ridge' + seg.id, () => {
      if (seg.type !== 'mountain' || this.off) return [];
      const out = [];
      for (let u = ZONE + RAMP + 500; u < seg.len - 500; u += 1500 + seg.rng() * 700) out.push(seg.z0 + u);
      return out;
    });
  }
  ridgeAt(seg, z, d) { let r = 0; for (const zr of this.ridges(seg)) { const k = (z - zr) / 75; if (Math.abs(k) < 3) r += 50 * Math.exp(-k * k) * (1 - smooth(80, 300, d)); } return r; }
  tunnels(seg) {
    return this.cached('tun' + seg.id, () => {
      if (this.off) return [];
      const out = [], z0 = seg.z0 + (seg.parent ? ZONE + 120 : 300), z1 = Math.min(seg.z1 - 260, seg.z0 + seg.len - 260);
      let start = null;
      for (let z = z0; z <= z1; z += 10) {
        const lift = this.hills(seg.x(z), z) + this.ridgeAt(seg, z, 0) + (seg.type === 'mountain' ? 10 * Math.abs(seg.upF(z)) : 0);
        const deep = !inDestination(this.settings, z - 100) && !inDestination(this.settings, z + 100) && lift > (seg.type === 'mountain' ? 32 : 50);
        if (deep && start === null) start = z;
        if ((!deep || z + 10 > z1) && start !== null) { if (z - start >= 150) out.push({start: start - 15, end: z + 15, seg}); start = null; }
      }
      return out;
    });
  }
  tunnelAt(z) { const s = this.segAt(z); for (const t of this.tunnels(s)) if (z >= t.start && z <= t.end) return t; return null; }
  // How close z is to a tunnel mouth from outside (1 at the portal, 0 from 80 m away): the road runs into a cutting there.
  portalNear(z) { const s = this.segAt(z); let k = 0; for (const t of this.tunnels(s)) { if (z < t.start) k = Math.max(k, 1 - smooth(0, 80, t.start - z)); else if (z > t.end) k = Math.max(k, 1 - smooth(0, 80, z - t.end)); } return k; }
  inTunnel(x, z) { const t = this.tunnelAt(z); return t && Math.abs(x - this.x(z)) < this.half(z) + 3 ? t : null; }

  // Railway alongside: runs between two tunnel portals in the hills, crossing the road once or twice at level crossings.
  rail(seg) {
    return this.cached('rail' + seg.id, () => {
      const t = TYPES[seg.type]; if (this.off || !t.rail || random(seg.id + 5)() > t.rail) return null;
      const rng = random(seg.id + 6), a = seg.z0 + ZONE + 200, b = seg.z0 + seg.len - 160;
      if (b - a < 1000) return null;
      // Keep to the longest stretch that stays clear of tunnels; towns are passed at a wider berth.
      const blocks = this.tunnels(seg).map((t) => [t.start - 250, t.end + 250]), towns = [];
      if (inDestination(this.settings, 0)) blocks.push([-500, DISTRICT_END + 160]);
      for (let z = a; z < b; z += 400) { const br = this.bridgeNear(z); if (br && br.seg === seg && !blocks.some((q) => q[2] === br)) blocks.push([br.start - 280, br.end + 280, br]); }
      for (let z = a - 300; z < b + 300; z += 150) { const tw = this.townAt(z); if (tw && tw.seg === seg && !towns.includes(tw)) towns.push(tw); }
      blocks.sort((p, q) => p[0] - q[0]);
      let lo = a, bestA = 0, bestB = 0;
      for (const [s0, s1] of [...blocks, [b, b]]) { const hi = Math.min(s0, b); if (hi - lo > bestB - bestA) { bestA = lo; bestB = hi; } lo = Math.max(lo, s1); }
      if (bestB - bestA < 950) return null;
      const A = bestA, B = bestB, side = seg.type === 'coast' ? -seg.seaSide : (rng() < .5 ? -1 : 1), mag = seg.halfW + 20 + rng() * 8;
      const free = (c) => towns.every((tw) => c < tw.start - 180 || c > tw.end + 180) && c > A + 350 && c < B - 350;
      const crossings = [];
      for (let k = 0; k < 12 && !crossings.length; k++) { const c = lerp(A, B, .3 + rng() * .4); if (free(c)) crossings.push(c); }
      if (B - A > 2400 && rng() < .5) { const c = lerp(A, B, .82); if (free(c) && (!crossings.length || Math.abs(c - crossings[0]) > 500)) crossings.push(c); }
      return {seg, a: A, b: B, side, mag, crossings, towns};
    });
  }
  railAt(z) { const s = this.segAt(z), r = this.rail(s); return r && z > r.a - 30 && z < r.b + 30 ? r : null; }
  railOffset(r, z) {
    let s = 1; for (const c of r.crossings) s *= -Math.tanh((z - c) / 40);
    const swing = 75 * (1 - smooth(r.a, r.a + 420, z)) + 75 * smooth(r.b - 420, r.b, z);
    let town = 0; for (const tw of r.towns) town = Math.max(town, smooth(tw.start - 220, tw.start - 60, z) * (1 - smooth(tw.end + 60, tw.end + 220, z)));
    return r.side * s * (r.mag + swing + town * 34);
  }
  railX(r, z) { return r.seg.x(z) + this.railOffset(r, z); }
  railY(r, z) { let near = 0; for (const c of r.crossings) near = Math.max(near, 1 - smooth(20, 70, Math.abs(z - c))); return r.seg.y(z) + lerp(.35, .06, near); }
  crossingAt(z, range = 0) { const r = this.railAt(z); if (!r) return null; for (const c of r.crossings) if (Math.abs(z - c) <= range) return {rail: r, z: c}; return null; }

  // Petrol stations, cafés and viewpoints on each segment.
  stops(seg) {
    return this.cached('stop' + seg.id, () => {
      if (this.off) return [];
      const rng = random(seg.id + 17), out = [], own = this.side;
      const clear = (z, len) => {
        if (inDestination(this.settings, 0) && z + len > -240 && z - len < DISTRICT_END + 120) return false;
        if (z - len < seg.z0 + ZONE + 250 || z + len > seg.z0 + seg.len - 300) return false;
        for (const tn of this.tunnels(seg)) if (z + len > tn.start - 80 && z - len < tn.end + 80) return false;
        const r = this.rail(seg); if (r) for (const c of r.crossings) if (Math.abs(z - c) < len + 120) return false;
        for (const o of out) if (Math.abs(o.z - z) < o.len + len + 150) return false;
        const tw = this.townAt(z); if (tw && z + len > tw.start - 60 && z - len < tw.end + 60) return false;
        const br = this.bridgeNear(z); if (br && z + len > br.start - 80 && z - len < br.end + 80) return false;
        return true;
      };
      const want = [];
      if (seg.type !== 'mountain' && rng() < .85) want.push('fuel');
      if (rng() < .55) want.push('cafe');
      if (seg.type === 'mountain' || seg.type === 'coast') want.push('view', 'view');
      if (seg.type === 'highway') want.push('fuel');
      for (const kind of want) {
        const len = kind === 'fuel' ? 50 : kind === 'cafe' ? 34 : 28;
        for (let k = 0; k < 8; k++) {
          const z = seg.z0 + ZONE + 300 + rng() * (seg.len - ZONE - 700);
          if (!clear(z, len)) continue;
          let side = own;
          if (kind === 'view') side = seg.type === 'coast' ? seg.seaSide : (seg.upF(z) > 0 ? -1 : 1);
          if (kind === 'view' && seg.type === 'mountain' && Math.abs(seg.upF(z)) < .35) continue;
          out.push({kind, z, side, len, depth: kind === 'fuel' ? 30 : kind === 'cafe' ? 18 : 10, seg});
          break;
        }
      }
      return out;
    });
  }
  stopAt(z, pad = 0) { const s = this.segAt(z); for (const st of this.stops(s)) if (Math.abs(z - st.z) <= st.len + pad) return st; return null; }
  stopsNear(z, range) { const s = this.segAt(z), out = []; for (const seg of [s, this.segs[this.segs.indexOf(s) + 1]]) if (seg) for (const st of this.stops(seg)) if (Math.abs(st.z - z) < range) out.push(st); return out; }
  // The paved pull-in: from the road edge out to its depth, tapered at the ends.
  stopPad(st, x, z) {
    const u = Math.abs(z - st.z) / st.len; if (u > 1) return 0;
    const r = st.seg, half = r.half(z) * this.stretch(r, z), d = (x - r.x(z)) * st.side, depth = st.depth * (1 - smooth(.5, 1, u));
    return d > half - .2 && d < half + depth ? 1 : 0;
  }

  /* ---------- Towns and rivers (only on hill roads, farm lanes and the coast) ---------- */
  townAt(z) {
    const TOWN = 1400, k = Math.floor(z / TOWN);
    return this.cached('town' + k, () => {
      const rnd = (salt) => random(this.id * 31 + k * 977 + salt)();
      if (this.off || k < 0 || rnd(5) > .85) return null;
      const seg = this.segAt(k * TOWN + TOWN / 2), type = seg.typeAt(k * TOWN + TOWN / 2);
      if (!TYPES[type].towns) return null;
      const small = type === 'farm', half = small ? 70 + rnd(6) * 40 : 130 + rnd(6) * 100, center = k * TOWN + half + 60 + rnd(7) * (TOWN - 2 * half - 120);
      const s = this.segAt(center);
      if (inDestination(this.settings, 0) && center + half > -240 && center - half < DISTRICT_END + 120) return null;
      if (s.typeAt(center) !== type || center - half < s.z0 + ZONE + 250 || center + half > s.z0 + s.len - 250) return null;
      for (const tn of this.tunnels(s)) if (center + half > tn.start - 100 && center - half < tn.end + 100) return null;
      const names = PLACES[type === 'coast' ? 'coast' : 'country'];
      return {center, half, start: center - half, end: center + half, name: names[Math.floor(rnd(8) * names.length)], k, type, small, seg: s};
    });
  }
  townFactor(z) { const t = this.townAt(z); if (!t) return 0; return smooth(t.start - 40, t.start + 10, z) * (1 - smooth(t.end - 10, t.end + 40, z)); }

  bridgeCell(k) {
    const BRIDGE = 2300;
    return this.cached('br' + k, () => {
      const rnd = (salt) => random(this.id * 31 + k * 977 + salt)();
      if (this.off || k < 1 || rnd(11) > .8) return null;
      let best = null;
      for (let i = 0; i < 30; i++) { const zz = k * BRIDGE + 300 + i * (BRIDGE - 600) / 29; if (!best || this.y(zz) < this.y(best)) best = zz; }
      const zc = best, s = this.segAt(zc);
      if (!TYPES[s.typeAt(zc)].rivers || zc - 330 < s.z0 + ZONE + 200 || zc + 330 > s.z0 + s.len - 200) return null;
      for (const q of [this.townAt(zc), this.townAt(zc - 300), this.townAt(zc + 300)]) if (q && zc > q.start - 300 && zc < q.end + 300) return null;
      for (const tn of this.tunnels(s)) if (zc + 300 > tn.start && zc - 300 < tn.end) return null;
      const half = 16 + rnd(12) * 8;
      return {z: zc, river: half, bank: 48, start: zc - half - 48, end: zc + half + 48, phase: rnd(13) * 6.3, deckY: this.y(zc), seg: s};
    });
  }
  // Only rivers on the road you are actually on (a straddling cell can remember one on a branch not taken).
  bridgeNear(z) { const k = Math.floor(z / 2300); for (const kk of [k, k - 1, k + 1]) { const b = this.bridgeCell(kk); if (b && z > b.start - 300 && z < b.end + 300 && this.segs.includes(b.seg)) return b; } return null; }
  bridgeAt(z) { const b = this.bridgeNear(z); return b && z >= b.start && z <= b.end ? b : null; }
  riverOff(px, z) { const b = this.bridgeNear(z); if (!b) return Infinity; const dx = px - b.seg.x(b.z); return Math.abs(z - b.z - (Math.sin(dx * .009 + b.phase) - Math.sin(b.phase)) * 26 - dx * .12) - b.river; }
  riverDepth(px, z) { const b = this.bridgeNear(z); if (!b) return 0; return 1 - smooth(0, b.bank, this.riverOff(px, z)); }

  /* ---------- Terrain ---------- */
  terrain(px, z, offworld = this.off) {
    const R = this.roadsAt(z); let best = R[0], d = Math.abs(px - best.x);
    for (let i = 1; i < R.length; i++) { const di = Math.abs(px - R[i].x) / Math.max(R[i].fade, .05); if (di < d) { d = di; best = R[i]; } }
    const seg = best.seg, y = best.y, half = best.half, side = Math.sign(px - best.x) || 1;
    let base = this.hills(px, z) + this.ridgeAt(seg, z, d);
    if (offworld) { const valley = -smooth(180, 620, best.x - px) * 30; return y + smooth(half + .8, half + 36, d) * (base + valley) + smooth(120, 400, d) * 12; }
    const tunnel = best.main ? this.tunnelAt(z) : null;
    // Parent road's character fades out as this road's own takes over after the junction.
    const tw = best.w, typeOwn = seg.type, typeParent = seg.parent ? seg.parent.typeAt(z) : typeOwn;
    const k = (t) => (t === typeOwn ? tw : 0) + (t === typeParent ? 1 - tw : 0);
    base *= 1 - .55 * k('farm') - .25 * k('highway');
    const valley = -smooth(180, 620, best.x - px) * 30;
    // Approaching a tunnel the ground rises in steep banks beside the road, a cutting that leads into the portal.
    const cut = !tunnel && best.main ? this.portalNear(z) : 0;
    let flat = tunnel ? 1 : smooth(half + .8, half + lerp(36, 7, cut), d);
    const hw = k('highway'); if (hw && !tunnel) flat = lerp(flat, smooth(half + 2, half + 60, d), hw);
    let h = y + flat * (base + valley) + smooth(120, 400, d) * 12;
    const coast = k('coast');
    if (coast) {
      const town = this.townFactor(z);
      if (side === seg.seaSide || (seg.parent && side === seg.parent.seaSide && typeParent === 'coast')) {
        const target = SEA - 4 - clamp((d - half - 40) * .12, 0, 26), near = town > 0 ? smooth(half + 40, half + 95, d) : smooth(half + 6, half + 55, d);
        h = lerp(h, Math.min(h, target), coast * near);
      } else h += coast * smooth(half + 4, half + 60, d) * 8;
    }
    const mt = k('mountain');
    if (mt) {
      const lift = side * seg.upF(z);
      h += mt * (lift > 0 ? lift * smooth(half + 1.5, half + 30, d) * (22 + d * .45) : lift * smooth(half + 3, half + 45, d) * (10 + d * .35));
    }
    const tf = this.townFactor(z);
    if (tf > 0 && best.main) h = lerp(h, y + (noise(px * .02, z * .02, this.id + 3) - .5) * .6 * smooth(20, 40, d), tf * (1 - smooth(40, 90, d)));
    const ro = this.riverOff(px, z);
    if (ro < 260) { const b = this.bridgeNear(z), open = 1 - smooth(b.bank, 260, ro); h = lerp(h, Math.min(h, y - 2 + ro * .03), open * .85); const rd = 1 - smooth(0, b.bank, ro); if (rd > 0) h = lerp(h, -12.5 + (noise(px * .05, z * .05, this.id + 5) - .5) * 1.2, rd * rd * (3 - 2 * rd)); }
    if (best.main) {
      const rail = this.railAt(z);
      if (rail) {
        const rx = this.railX(rail, z), rd = Math.abs(px - rx), ry = this.railY(rail, z), live = smooth(rail.a - 12, rail.a, z) * (1 - smooth(rail.b, rail.b + 12, z));
        h = lerp(h, ry - .12, live * (1 - smooth(3.5, 16, rd)));
        // A hillside rises straight up from each end of the line, where the track runs into its tunnel.
        // It keeps off the road itself, which would otherwise be buried under its foot.
        for (const [zp, dirn] of [[rail.a, -1], [rail.b, 1]]) { const into = (z - zp) * dirn + 2; if (into > 0 && into < 90) { const dx = px - this.railX(rail, zp); h = Math.max(h, this.railY(rail, zp) + Math.min(28, into * 1.4) * Math.exp(-dx * dx / 1800) * (1 - smooth(55, 90, into)) * smooth(half + 3, half + 30, d)); } }
      }
      for (const st of this.stopsNear(z, 60)) {
        const u = Math.abs(z - st.z) / (st.len + 14); if (u > 1) continue;
        const dd = (px - best.x) * st.side, inside = dd > half - 1 && dd < half + st.depth * (1 - smooth(.45, 1, u)) + 7;
        if (inside) h = lerp(h, y - .02, 1 - smooth(.8, 1, u));
      }
      if (tunnel && d < half + 3) h = Math.max(h, y + 9.5);
    }
    if (inDestination(this.settings, z) && !offworld && !tunnel) {
      const area = this.settings.destination, coastal = DESTINATIONS[area].type === 'coast', signed = px - this.x(z);
      const fade = smooth(-180, -100, z) * (1 - smooth(980, 1080, z));
      const width = area === 'lake' ? 22 : area === 'airport' ? 120 : 90;
      const plot = 1 - smooth(width, width + 45, Math.abs(signed));
      const shore = coastal && signed < -half - 12 ? smooth(half + 12, half + 45, -signed) : 0;
      h = lerp(h, lerp(y - .02, SEA - 5, shore), fade * plot);
    }
    if (inDestination(this.settings,z) && this.settings.destination === 'lake' && px < this.x(z)-100) {
      // Far bank encloses the lake, rising into a mountain rather than an infinite ocean.
      const far = smooth(280,540,this.x(z)-px), bank = 42 + 80*Math.pow(Math.max(0,Math.sin(z*.004+1)),2);
      h = lerp(h,bank,far);
    }
    // The ground never rises through a road surface you can drive on.
    if (d < half + .6 && !(tunnel && d < half + 3) && (best.main || best.fade > .5)) h = Math.min(h, y);
    return h;
  }
}
