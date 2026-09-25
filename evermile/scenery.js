import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import {GlowPoints} from './glow.js?v=20260926b';
import {random} from './math.js?v=20260926b';

// Places people live and cross: towns with shops, strip lights and street lamps, cottages with gardens,
// river bridges, and boats on the water. Everything static in a chunk is merged into a handful of meshes.
const V = new T.Vector3(), S = new T.Vector3(), Q = new T.Quaternion(), E = new T.Euler(0, 0, 0, 'YXZ'), M = new T.Matrix4(), C = new T.Color();
const UNIT = new T.BoxGeometry(1, 1, 1).toNonIndexed();
const PLANE = new T.PlaneGeometry(1, 1).toNonIndexed();
const FLAT = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).toNonIndexed();
const WALLS = [0xefe6d6, 0xe8dcc2, 0xf3efe6, 0xd9c4a3, 0xc98f6b, 0xb8c2c4, 0xd8d2b8, 0xa9b89d, 0xe2c9a5, 0xcfd6d8, 0xb9776a];
const ROOFS = [0x7a3b2e, 0x5a4038, 0x4a4f55, 0x6b2f24, 0x3d4148, 0x8a5a3c];
const AWNINGS = [0xa8322d, 0x2f5d45, 0x283d63, 0xc98b2b, 0x6d2f4f, 0x3f6f78];
const STRIPS = [[1, .82, .55], [.25, .85, 1], [1, .3, .75], [1, .62, .18], [.55, 1, .6]];
const SHOPS = ['CAFÉ AROMA', 'BAKERY', 'MINI MARKET', 'PHARMACY', 'BOOKS & CO', 'PIZZA', 'FLOWERS', 'HARDWARE', 'TAILOR', 'FRESH FRUIT', 'ICE CREAM', 'BARBER', 'TEA HOUSE', 'ELECTRONICS', 'SWEETS', 'GROCERY'];

function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Collects transformed, vertex-coloured copies of small geometries, then merges them per material.
class Batch {
  constructor() { this.lists = {}; }
  add(key, geo, x, y, z, yaw, color, sx, sy, sz, pitch = 0, roll = 0, uvRect = null) {
    const g = geo.clone();
    E.set(pitch, yaw, roll); Q.setFromEuler(E); M.compose(V.set(x, y, z), Q, S.set(sx, sy, sz)); g.applyMatrix4(M);
    const n = g.attributes.position.count, col = new Float32Array(n * 3); C.set(color);
    for (let i = 0; i < n; i++) { col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b; }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    if (uvRect) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uvRect[0] + uv.getX(i) * uvRect[2], uvRect[1] + uv.getY(i) * uvRect[3]); }
    (this.lists[key] ||= []).push(g);
  }
  flush(group, mats) {
    for (const [key, list] of Object.entries(this.lists)) {
      if (!list.length) continue;
      const geo = mergeGeometries(list, false); for (const g of list) g.dispose();
      const m = mats[key], mesh = new T.Mesh(geo, m.material);
      mesh.castShadow = !!m.cast; mesh.receiveShadow = m.receive !== false; if (m.order) mesh.renderOrder = m.order;
      group.add(mesh);
    }
    this.lists = {};
  }
}

// A local frame for one building: +x points away from the road, +z runs along it.
function frame(batch, ox, oy, oz, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const put = (key, geo, lx, ly, lz, color, sx, sy, sz, lyaw = 0, pitch = 0, roll = 0, uv = null) =>
    batch.add(key, geo, ox + lx * c + lz * s, oy + ly, oz - lx * s + lz * c, yaw + lyaw, color, sx, sy, sz, pitch, roll, uv);
  put.world = (lx, lz) => [ox + lx * c + lz * s, oz - lx * s + lz * c];
  put.c = c; put.s = s;
  return put;
}

export class Scenery {
  constructor(world) {
    this.world = world; this.scene = world.scene; this.settings = world.settings;
    this.layouts = new Map(); this.time = 0;
    this.makeMaterials();
    this.glow = new GlowPoints(this.scene, 220, {fade: 1000});
    this.lamps = [0, 1, 2].map(() => { const l = new T.PointLight(0xffd6a0, 0, 22, 1.8); this.scene.add(l); return l; });
    this.lampColor = new T.Color(1, .82, .56);
  }

  makeMaterials() {
    const std = (o) => new T.MeshStandardMaterial(o);
    // Shop signs: one atlas row per shop name.
    this.signAtlas = canvasTexture(1024, 96 * SHOPS.length, (x, w) => {
      SHOPS.forEach((name, i) => {
        const y = i * 96, bg = ['#1d2b45', '#f2ead8', '#7a1f1f', '#1f4a36', '#2a2a2e', '#f6d36b'][i % 6], fg = ['#f6e7b8', '#3a2a1a', '#fff4e0', '#f1f5e8', '#ffcf6a', '#2a1a10'][i % 6];
        x.fillStyle = bg; x.fillRect(0, y, w, 96); x.strokeStyle = fg; x.globalAlpha = .6; x.lineWidth = 4; x.strokeRect(10, y + 10, w - 20, 76); x.globalAlpha = 1;
        x.fillStyle = fg; x.font = '700 58px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(name, w / 2, y + 50, w - 80);
      });
    });
    // Shop interiors seen through the window: warm light, shelves and goods.
    const interior = canvasTexture(256, 128, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff1d0'); g.addColorStop(1, '#d99a55'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const rng = random(44);
      for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(70,40,20,.55)'; x.fillRect(8 + i * 50, 30, 38, 90); for (let k = 0; k < 4; k++) { x.fillStyle = `hsla(${rng() * 360},55%,55%,.8)`; x.fillRect(10 + i * 50, 36 + k * 21, 34, 12); } }
      x.fillStyle = 'rgba(40,25,15,.5)'; x.beginPath(); x.ellipse(200, 70, 12, 14, 0, 0, 7); x.fill(); x.fillRect(188, 82, 24, 46);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 0, w, 6);
    });
    const pane = (lit) => canvasTexture(64, 64, (x, w, h) => {
      x.fillStyle = lit ? '#ffd9a0' : '#1c2a33'; x.fillRect(0, 0, w, h);
      if (!lit) { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(200,220,235,.35)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      else { x.fillStyle = 'rgba(160,90,40,.35)'; x.fillRect(4, 4, 18, 56); x.fillRect(42, 4, 18, 56); }
      x.fillStyle = lit ? '#000' : '#e9e4da'; x.fillRect(0, 0, w, 4); x.fillRect(0, h - 4, w, 4); x.fillRect(0, 0, 4, h); x.fillRect(w - 4, 0, 4, h); x.fillRect(30, 0, 4, h); x.fillRect(0, 30, w, 4);
    });
    const winMap = pane(false), winLit = pane(true);
    const roofTiles = canvasTexture(128, 128, (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) { x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, r * 16 + 13, w, 3); for (let k = 0; k < 8; k++) { x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(k * 16 + (r % 2) * 8, r * 16, 2, 16); } }
    });
    roofTiles.wrapS = roofTiles.wrapT = T.RepeatWrapping; roofTiles.repeat.set(5, 4);
    const paving = canvasTexture(256, 256, (x, w, h) => {
      x.fillStyle = '#b8b3a8'; x.fillRect(0, 0, w, h); const rng = random(12);
      for (let i = 0; i < 4000; i++) { const v = 140 + rng() * 70; x.fillStyle = `rgba(${v},${v},${v - 6},.25)`; x.fillRect(rng() * w, rng() * h, 2, 2); }
      x.strokeStyle = 'rgba(80,78,72,.55)'; x.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(0, i * 32); x.lineTo(w, i * 32); x.stroke(); }
      for (let r = 0; r < 8; r++) for (let k = 0; k <= 4; k++) { const px = k * 64 + (r % 2) * 32; x.beginPath(); x.moveTo(px, r * 32); x.lineTo(px, r * 32 + 32); x.stroke(); }
      x.fillStyle = '#d9d6cf'; x.fillRect(0, 0, 20, h); x.fillStyle = 'rgba(60,60,60,.5)'; x.fillRect(20, 0, 3, h);
    });
    paving.wrapS = paving.wrapT = T.RepeatWrapping;
    const pool = canvasTexture(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
    const streak = canvasTexture(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); const v = x.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(.25, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = v; x.fillRect(0, 0, w, h); });
    const zebra = canvasTexture(256, 32, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#eeeeE6'; for (let i = 0; i < 8; i++) x.fillRect(i * 32 + 6, 0, 18, h); });
    this.flowerTexture = canvasTexture(256, 256, (x, w, h) => {
      const rng = random(71); x.clearRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { const px = rng() * w, top = 70 + rng() * 140; x.strokeStyle = `rgb(${60 + rng() * 40},${110 + rng() * 50},${50 + rng() * 30})`; x.lineWidth = 1.5 + rng() * 1.5; x.beginPath(); x.moveTo(px, h); x.quadraticCurveTo(px + (rng() - .5) * 30, h - top * .6, px + (rng() - .5) * 20, h - top); x.stroke(); }
      const hues = [[255, 255, 250], [255, 214, 60], [240, 90, 140], [170, 110, 230], [230, 60, 50], [255, 150, 60], [120, 150, 255]];
      for (let i = 0; i < 46; i++) {
        const cx = 10 + rng() * (w - 20), cy = 20 + rng() * 150, r = 5 + rng() * 7, [cr, cg, cb] = hues[Math.floor(rng() * hues.length)];
        for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2 + rng(); x.fillStyle = `rgb(${cr},${cg},${cb})`; x.beginPath(); x.ellipse(cx + Math.cos(a) * r * .6, cy + Math.sin(a) * r * .6, r * .55, r * .32, a, 0, 7); x.fill(); }
        x.fillStyle = '#f4c430'; x.beginPath(); x.arc(cx, cy, r * .28, 0, 7); x.fill();
      }
    });
    this.mats = {
      wall: {material: std({vertexColors: true, roughness: .88}), cast: true},
      roof: {material: std({vertexColors: true, map: roofTiles, roughness: .78}), cast: true},
      shopGlass: {material: std({color: 0x707070, map: interior, emissive: 0xffe2b8, emissiveMap: interior, emissiveIntensity: 0, roughness: .12, metalness: .35})},
      win: {material: std({map: winMap, roughness: .15, metalness: .45})},
      winLit: {material: std({map: winMap, emissive: 0xffcf8a, emissiveMap: winLit, emissiveIntensity: 0, roughness: .15, metalness: .45})},
      sign: {material: std({map: this.signAtlas, emissive: 0xffffff, emissiveMap: this.signAtlas, emissiveIntensity: 0, roughness: .5})},
      metal: {material: std({vertexColors: true, metalness: .6, roughness: .42}), cast: true},
      lampHead: {material: std({color: 0xd8d4c8, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: .4})},
      pool: {material: new T.MeshBasicMaterial({map: pool, color: 0xffc27a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4}), receive: false, order: 3},
      streak: {material: new T.MeshBasicMaterial({map: streak, color: 0xffc98a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5}), receive: false, order: 3},
      pavement: {material: std({map: paving, roughness: .92})},
      zebra: {material: std({map: zebra, transparent: true, alphaTest: .4, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2})},
      glassTrim: {material: std({color: 0x20262b, roughness: .4, metalness: .5})},
    };
    this.stripMats = STRIPS.map(([r, g, b]) => ({material: std({color: new T.Color(r * .5, g * .5, b * .5), emissive: new T.Color(r, g, b), emissiveIntensity: .25, roughness: .3})}));
    STRIPS.forEach((_, i) => { this.mats['strip' + i] = this.stripMats[i]; });
    this.flowerMat = std({map: this.flowerTexture, alphaTest: .45, side: T.DoubleSide, roughness: .9});
    this.townSigns = new Map();
    this.boatParts = this.makeBoatParts();
  }

  townSign(name) {
    if (!this.townSigns.has(name)) {
      const t = canvasTexture(512, 170, (x, w, h) => {
        x.fillStyle = '#f7f5ee'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1d4d34'; x.lineWidth = 12; x.strokeRect(10, 10, w - 20, h - 20);
        x.fillStyle = '#1d4d34'; x.textAlign = 'center'; x.font = '700 72px Georgia, serif'; x.fillText(name, w / 2, 98, w - 60);
        x.font = '500 26px Arial, sans-serif'; x.fillText('Please drive carefully', w / 2, 140);
      });
      this.townSigns.set(name, new T.MeshStandardMaterial({map: t, roughness: .6}));
    }
    return this.townSigns.get(name);
  }

  /* ---------- Planning: what occupies a chunk, so trees and grass keep out of houses and streets ---------- */
  plan(index, CHUNK) {
    const r = this.world.road, z0 = index * CHUNK, z1 = z0 + CHUNK, hills = this.settings.location === 'hills', w = this.settings.roadWidth / 2;
    const plan = {index, z0, z1, towns: [], bridge: null, cottages: [], zones: []};
    if (!hills) { plan.blocked = () => false; return plan; }
    for (const z of [z0, z1]) { const t = r.townAt(z); if (t && t.end > z0 && t.start < z1 && !plan.towns.includes(t)) plan.towns.push(t); }
    const b = r.bridgeNear((z0 + z1) / 2); if (b && b.end > z0 && b.start < z1) plan.bridge = b;
    // Countryside cottages on level ground, away from towns and rivers.
    const rng = random(r.id * 13 + index * 7919 + 5);
    const tries = plan.towns.length ? 0 : rng() < .6 ? (rng() < .35 ? 2 : 1) : 0;
    for (let i = 0; i < tries; i++) {
      const z = z0 + 20 + rng() * (CHUNK - 40), side = rng() < .5 ? -1 : 1, d = 26 + rng() * 60, x = r.x(z) + side * d;
      if (r.riverDepth(x, z) > 0 || r.townFactor(z) > 0) continue;
      const W = 7 + rng() * 2.2, D = 6 + rng() * 1.2, yaw = Math.atan(r.tangent(z)) + (side < 0 ? Math.PI : 0), c = Math.cos(yaw), s = Math.sin(yaw);
      const hs = [];
      for (const [lx, lz] of [[-4.5, -W / 2 - 1], [D + 1, -W / 2 - 1], [-4.5, W / 2 + 1], [D + 1, W / 2 + 1], [D / 2, 0]]) hs.push(this.world.surfaceHeight(x + lx * c + lz * s, z - lx * s + lz * c));
      const lo = Math.min(...hs), hi = Math.max(...hs);
      if (hi - lo > 2.4 || lo < -5) continue;
      plan.cottages.push({x, z, yaw, W, D, lo, hi, seed: rng(), side});
      plan.zones.push({x: x + (D / 2 - 1.5) * c, z: z - (D / 2 - 1.5) * s, r: Math.max(W, D) / 2 + 6});
    }
    plan.blocked = (x, z) => {
      for (const zone of plan.zones) if (Math.hypot(x - zone.x, z - zone.z) < zone.r) return true;
      const d = Math.abs(x - r.x(z));
      if (plan.towns.length && r.townFactor(z) > 0 && d < 60) return true;
      if (plan.bridge && z > plan.bridge.start - 6 && z < plan.bridge.end + 6 && d < w + 4) return true;
      return false;
    };
    return plan;
  }

  layout(t) {
    if (this.layouts.has(t)) return this.layouts.get(t);
    const rng = random(this.world.road.id * 7 + t.k * 131 + 3), lots = [], lamps = [];
    for (const side of [-1, 1]) {
      let z = t.start + 14;
      while (z < t.end - 14) {
        const roll = rng(), kind = roll < .52 ? 'shop' : roll < .77 ? 'block' : roll < .88 ? 'house' : 'gap';
        const W = kind === 'block' ? 12 + rng() * 5 : kind === 'house' ? 9 + rng() * 2 : kind === 'gap' ? 6 + rng() * 9 : 7 + rng() * 5;
        if (z + W > t.end - 10) break;
        lots.push({side, z: z + W / 2, W, kind, seed: rng()});
        z += W + .5 + rng() * 2.4;
      }
      for (let bz = t.start + 26; bz < t.end - 20; bz += 20 + rng() * 16) if (rng() < .6) lots.push({side, z: bz, W: 7.5 + rng() * 2, kind: 'backHouse', seed: rng()});
    }
    for (let z = t.start + 8, i = 0; z < t.end - 4; z += 30, i++) lamps.push({z, side: i % 2 ? 1 : -1});
    const lay = {lots, lamps};
    this.layouts.set(t, lay);
    if (this.layouts.size > 12) this.layouts.delete(this.layouts.keys().next().value);
    return lay;
  }

  /* ---------- Building ---------- */
  build(group, plan) {
    if (this.settings.location !== 'hills') return;
    const batch = new Batch(), r = this.world.road, w = this.settings.roadWidth / 2;
    const colliders = group.userData.colliders, lamps = group.userData.lamps = [], boats = group.userData.boats = [];
    const inChunk = (z) => z >= plan.z0 && z < plan.z1;
    for (const t of plan.towns) {
      const lay = this.layout(t);
      for (const lot of lay.lots) if (inChunk(lot.z)) this.buildLot(batch, lot, colliders, w);
      for (const l of lay.lamps) if (inChunk(l.z)) this.streetLamp(batch, l.z, l.side, w + .55, colliders, lamps);
      this.pavement(group, t, plan, w);
      if (inChunk(t.center)) this.zebra(batch, t.center, w);
      if (inChunk(t.start - 14)) this.entrySign(group, t, t.start - 14, 1, w, colliders);
      if (inChunk(t.end + 14)) this.entrySign(group, t, t.end + 14, -1, w, colliders);
    }
    for (const c of plan.cottages) this.cottage(batch, c, colliders, true);
    if (plan.bridge) this.bridge(batch, plan.bridge, plan, w, lamps);
    this.placeBoats(group, plan, boats);
    batch.flush(group, this.mats);
  }

  buildLot(batch, lot, colliders, w) {
    const r = this.world.road, rng = random(Math.floor(lot.seed * 1e9));
    if (lot.kind === 'gap') return;
    const back = lot.kind === 'backHouse', front = back ? 30 + rng() * 8 : lot.kind === 'house' ? w + 7.5 : w + 3.4;
    const yaw = Math.atan(r.tangent(lot.z)) + (lot.side < 0 ? Math.PI : 0), bx = r.x(lot.z) + lot.side * front;
    if (lot.kind === 'house' || back) {
      const D = 6 + rng() * 1.2, W = Math.min(lot.W - 1.5, 7 + rng() * 2);
      const c = Math.cos(yaw), s = Math.sin(yaw), hs = [];
      for (const [lx, lz] of [[0, -W / 2], [D, -W / 2], [0, W / 2], [D, W / 2]]) hs.push(this.world.surfaceHeight(bx + lx * c + lz * s, lot.z - lx * s + lz * c));
      this.cottage(batch, {x: bx, z: lot.z, yaw, W, D, lo: Math.min(...hs), hi: Math.max(...hs), seed: lot.seed, side: lot.side}, colliders, !back);
      return;
    }
    const by = r.y(lot.z) + .075, put = frame(batch, bx, by, lot.z, yaw), W = lot.W, block = lot.kind === 'block';
    const D = block ? 10 + rng() * 2 : 8 + rng() * 3, floors = block ? 3 + Math.floor(rng() * 3) : rng() < .45 ? 2 : 1;
    const H = block ? 4.4 + (floors - 1) * 3.1 : floors === 2 ? 7.4 : 4.5, wall = WALLS[Math.floor(rng() * WALLS.length)], trim = rng() < .5 ? 0xf4f1ea : 0x3a3a3c;
    put('wall', UNIT, D / 2, H / 2, 0, wall, D, H, W);
    put('wall', UNIT, D / 2, .18, 0, 0x5d5a55, D + .06, .36, W + .06);
    put('wall', UNIT, .15, H + .18, 0, trim, .5, .36, W + .2);
    put('wall', UNIT, D / 2, H + .05, 0, 0x4a4a4a, D - .2, .1, W - .2);
    // Shopfront: lit window, door, sign board and LED strips.
    const gw = W * .6, sign = Math.floor(rng() * SHOPS.length), strip = 'strip' + Math.floor(rng() * STRIPS.length);
    put('shopGlass', UNIT, -.03, 1.5, -W * .12, 0xffffff, .1, 2.3, gw);
    put('shopGlass', UNIT, -.03, 1.3, W * .31, 0xffffff, .1, 2.1, 1.1);
    put('glassTrim', UNIT, -.06, 2.7, 0, 0xffffff, .14, .1, W * .92);
    put('glassTrim', UNIT, -.06, .38, -W * .12, 0xffffff, .14, .12, gw + .1);
    put('sign', UNIT, -.12, 3.25, 0, 0xffffff, .16, .72, W * .8, 0, 0, 0, [0, 1 - (sign + 1) / SHOPS.length + .002, 1, 1 / SHOPS.length - .004]);
    put(strip, UNIT, -.22, 2.84, 0, 0xffffff, .05, .05, W * .8);
    put(strip, UNIT, -.28, H - .06, 0, 0xffffff, .06, .06, W + .1);
    for (const e of [-1, 1]) put(strip, UNIT, -.05, (H - .2) / 2 + .1, e * (W / 2 + .03), 0xffffff, .06, H - .4, .06);
    if (rng() < .6) put('wall', UNIT, -.75, 2.5, -W * .12, AWNINGS[Math.floor(rng() * AWNINGS.length)], 1.55, .06, gw + .3, 0, 0, .36);
    // Upper floors: rows of windows on the front and the ends, some lit at night.
    for (let f = 1; f < floors; f++) {
      const y = 4.4 + (f - 1) * 3.1 + 1.45;
      if (block) put('wall', UNIT, -.04, y - 1.1, 0, trim, .1, .12, W + .04);
      for (let k = 0, n = Math.max(2, Math.floor(W / 2.5)); k < n; k++) put(rng() < .38 ? 'winLit' : 'win', UNIT, -.03, y, -W / 2 + (k + .5) * W / n, 0xffffff, .1, 1.4, 1.1);
      for (const e of [-1, 1]) for (let k = 0, n = Math.max(1, Math.floor(D / 3)); k < n; k++) put(rng() < .3 ? 'winLit' : 'win', UNIT, (k + .5) * D / n, y, e * (W / 2 + .03), 0xffffff, 1.1, 1.4, .1);
    }
    if (block && rng() < .7) put('metal', UNIT, D * .6, H + .6, W * .2, 0x8a8e92, 1.4, 1, 1.6);
    const [cx, cz] = put.world(D / 2, 0);
    colliders.push({x: cx, z: cz, hx: D / 2, hz: W / 2, c: put.c, s: put.s, r: 0});
  }

  // Cottage: walls, a tiled gable roof, chimney, windows and door; optionally a fenced front garden with a path and flowers.
  cottage(batch, h, colliders, garden) {
    const rng = random(Math.floor(h.seed * 1e9) + 17), base = h.hi + .15, put = frame(batch, h.x, base, h.z, h.yaw);
    const {W, D} = h, two = rng() < .35, H = two ? 5.4 : 3, wall = WALLS[Math.floor(rng() * WALLS.length)], roof = ROOFS[Math.floor(rng() * ROOFS.length)];
    const foot = base - h.lo + .3;
    put('wall', UNIT, D / 2, H / 2, 0, wall, D, H, W);
    put('wall', UNIT, D / 2, -foot / 2 + .15, 0, 0x7d776e, D + .2, foot, W + .2);
    // Gable: a wall-coloured prism under two tiled slabs.
    const rise = 2.1, half = D / 2 + .35, slope = Math.atan2(rise, half), len = Math.hypot(half, rise);
    put('wall', this.boatParts.gable, D / 2, H, 0, wall, D, rise, W);
    for (const e of [-1, 1]) put('roof', UNIT, D / 2 + e * half / 2, H + rise / 2 + .04, 0, roof, len, .14, W + .7, 0, 0, -e * slope);
    put('roof', UNIT, D / 2, H + rise + .02, 0, roof, .3, .16, W + .72);
    put('wall', UNIT, D * .72, H + rise * .7, W * .28, 0x8c5a45, .6, 1.8, .6);
    put('wall', UNIT, -.05, 1.05, 0, 0x5c3b26, .1, 2.1, 1);
    put('wall', UNIT, -.5, 2.35, 0, roof, 1.1, .1, 1.7, 0, 0, .25);
    for (const lz of [-W * .3, W * .3]) put(rng() < .5 ? 'winLit' : 'win', UNIT, -.03, 1.6, lz, 0xffffff, .1, 1.1, 1.1);
    if (two) for (const lz of [-W * .3, 0, W * .3]) put(rng() < .4 ? 'winLit' : 'win', UNIT, -.03, 4.1, lz, 0xffffff, .1, 1.05, 1);
    for (const e of [-1, 1]) put(rng() < .4 ? 'winLit' : 'win', UNIT, D / 2, 1.6, e * (W / 2 + .03), 0xffffff, 1, 1.1, .1);
    if (garden) {
      const fence = rng() < .5 ? 0xf2efe8 : 0x8a6a48, yard = 4.2;
      const posts = (ax, az, bx, bz) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 1.3)); for (let i = 0; i <= n; i++) put('wall', UNIT, ax + (bx - ax) * i / n, .45 - (base - h.lo) * .0, az + (bz - az) * i / n, fence, .09, .9, .09); };
      const rail = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az); for (const y of [.35, .72]) put('wall', UNIT, (ax + bx) / 2, y, (az + bz) / 2, fence, .05, .07, len, a); };
      const hw = W / 2 + 1.2;
      posts(-yard, -hw, -yard, -.8); posts(-yard, .8, -yard, hw); posts(-yard, -hw, 0, -hw); posts(-yard, hw, 0, hw);
      rail(-yard, -hw, -yard, -.8); rail(-yard, .8, -yard, hw); rail(-yard, -hw, 0, -hw); rail(-yard, hw, 0, hw);
      put('wall', UNIT, -yard / 2, .03, 0, 0xb9ad97, yard, .06, .9);
      for (const e of [-1, 1]) {
        put('wall', UNIT, -1, .04, e * (W * .32), 0x6e4a2e, 1.4, .08, W * .3);
        for (let k = 0; k < 2; k++) put('wall', this.boatParts.bush, -yard + .8 + rng() * 1.6, .45, e * (W * .15 + rng() * W * .3), [0x4f7a3a, 0x3f6a34, 0x5d8a42][k], .9 + rng() * .5, .8 + rng() * .3, .9 + rng() * .5, rng() * 6);
        for (let k = 0; k < 6; k++) put('flowerBed', this.boatParts.flower, -1 + (rng() - .5) * 1.1, .3, e * (W * .2 + rng() * W * .25), 0xffffff, .5, .5, .5, rng() * 6);
      }
    }
    const [cx, cz] = put.world(D / 2, 0);
    colliders.push({x: cx, z: cz, hx: D / 2 + .1, hz: W / 2 + .1, c: put.c, s: put.s, r: 0});
  }

  streetLamp(batch, z, side, dist, colliders, lamps, h = 7) {
    const r = this.world.road, yaw = Math.atan(r.tangent(z)) + (side < 0 ? Math.PI : 0), x = r.x(z) + side * dist, y = r.y(z) + .075;
    const put = frame(batch, x, y, z, yaw), reach = 1.7;
    put('metal', UNIT, 0, .3, 0, 0x3d4247, .32, .6, .32);
    put('metal', UNIT, 0, h / 2, 0, 0x50565c, .13, h, .13);
    put('metal', UNIT, -reach / 2, h - .05, 0, 0x50565c, reach, .09, .09);
    put('lampHead', UNIT, -reach, h - .16, 0, 0xffffff, .7, .14, .3);
    const [hx, hz] = put.world(-reach, 0);
    lamps.push({x: hx, y: y + h - .28, z: hz});
    batch.add('pool', FLAT, hx, r.y(hz) + .085, hz, yaw, 0xffffff, 11, 1, 11);
    batch.add('streak', FLAT, hx, r.y(hz - 5) + .09, hz - 5, Math.atan(r.tangent(hz)), 0xffffff, 1.3, 1, 10);
    const [px, pz] = put.world(0, 0);
    colliders.push({x: px, z: pz, r: .3});
  }

  // Paved footpaths on both sides of the street, with the kerb painted along the road edge.
  pavement(group, t, plan, w) {
    const r = this.world.road, a = Math.max(plan.z0, t.start - 6), b = Math.min(plan.z1, t.end + 6);
    if (b <= a) return;
    for (const side of [-1, 1]) {
      const pos = [], uv = [], idx = [];
      let i = 0;
      for (let z = a; z <= b + .01; z += 2.5, i++) {
        const zz = Math.min(z, b), y = r.y(zz) + .075;
        pos.push(r.x(zz) + side * w, y, zz, r.x(zz) + side * (w + 3.3), y, zz);
        uv.push(0, zz / 2.2, 1.28, zz / 2.2);
        if (i) { const k = (i - 1) * 2; if (side > 0) idx.push(k, k + 2, k + 1, k + 2, k + 3, k + 1); else idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new T.Mesh(g, this.mats.pavement.material); m.receiveShadow = true; group.add(m);
    }
  }

  zebra(batch, z, w) {
    const r = this.world.road;
    batch.add('zebra', FLAT, r.x(z), r.y(z) + .062, z, Math.atan(r.tangent(z)) + Math.PI / 2, 0xffffff, 3.2, 1, w * 2 - .8);
  }

  entrySign(group, t, z, side, w, colliders) {
    const r = this.world.road, x = r.x(z) + side * (w + 1.8), y = r.y(z), yaw = Math.atan(r.tangent(z)) + (side < 0 ? Math.PI : 0);
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = yaw + Math.PI;
    const post = new T.MeshStandardMaterial({color: 0x9aa0a6, metalness: .6, roughness: .4});
    for (const e of [-1, 1]) { const p = new T.Mesh(new T.CylinderGeometry(.05, .05, 2.6, 8), post); p.position.set(e * 1.1, 1.3, -.03); p.castShadow = true; g.add(p); }
    const board = new T.Mesh(new T.PlaneGeometry(2.8, .93), this.townSign(t.name)); board.position.y = 2.05; board.castShadow = true; g.add(board);
    const backing = new T.Mesh(new T.BoxGeometry(2.84, .97, .04), post); backing.position.set(0, 2.05, -.035); g.add(backing);
    group.add(g);
    colliders.push({x, z, r: .5});
  }

  // Bridge: deck and footpaths over the river valley, steel railings on concrete parapets, pillars down to the riverbed and lamps.
  bridge(batch, b, plan, w, lamps) {
    const r = this.world.road, a = Math.max(plan.z0, b.start - 4), e = Math.min(plan.z1, b.end + 4), step = 2.5;
    if (e <= a) return;
    const conc = 0xb3afa5, dark = 0x8d8a82;
    for (let z = a; z < e; z += step) {
      const zm = Math.min(z + step / 2, e), len = Math.min(step, e - z), t = r.tangent(zm), yaw = Math.atan(t), slope = (r.y(zm + 1) - r.y(zm - 1)) / 2, pitch = -Math.atan(slope), L = len * Math.sqrt(1 + t * t) + .02, y = r.y(zm);
      batch.add('wall', UNIT, r.x(zm), y - .78, zm, yaw, dark, w * 2 + 3.4, 1.5, L, pitch);
      for (const side of [-1, 1]) {
        const xo = r.x(zm) + side * (w + .85);
        batch.add('wall', UNIT, xo, y + .12, zm, yaw, conc, 1.7, .26, L, pitch);
        batch.add('wall', UNIT, r.x(zm) + side * (w + 1.6), y + .45, zm, yaw, conc, .22, .7, L, pitch);
        batch.add('metal', UNIT, r.x(zm) + side * (w + 1.6), y + 1.12, zm, yaw, 0x6a7078, .09, .08, L, pitch);
        batch.add('metal', UNIT, r.x(z) + side * (w + 1.6), y + .95, z, yaw, 0x6a7078, .07, .45, .07);
      }
    }
    // Pillars stand every 24 m where the deck is well above the ground.
    for (let k = -4; k <= 4; k++) {
      const z = b.z + k * 24; if (z < a || z >= e || z < b.start + 6 || z > b.end - 6) continue;
      const y = r.y(z), yaw = Math.atan(r.tangent(z));
      for (const side of [-1, 1]) {
        const x = r.x(z) + side * (w - .6), ground = Math.min(this.world.surfaceHeight(x, z), -9);
        const hgt = y - 1.5 - ground + 1;
        if (hgt < 2.5) continue;
        batch.add('wall', UNIT, x, ground - 1 + hgt / 2, z, yaw, conc, 1.3, hgt, 1.8);
      }
      batch.add('wall', UNIT, r.x(z), y - 1.75, z, yaw, dark, w * 2 + 1, .6, 1.6);
    }
    for (let z = b.start + 10, i = 0; z < b.end - 4; z += 28, i++) if (z >= plan.z0 && z < plan.z1) this.streetLamp(batch, z, i % 2 ? 1 : -1, w + 1.45, [], lamps, 6.5);
  }

  /* ---------- Boats ---------- */
  makeBoatParts() {
    // Rowing boat hull: a divided box pinched to a bow, rounded underneath and lifted at the bow.
    const hull = new T.BoxGeometry(1.5, .62, 4.4, 4, 3, 16), p = hull.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const t = z / 2.2;
      const pinch = t > 0 ? 1 - Math.pow(Math.max(0, t - .15) / .85, 1.6) * .92 : 1 - Math.pow(Math.max(0, -t - .6) / .4, 2) * .25;
      const bottom = y < 0 ? .45 + (y + .31) / .31 * .55 : 1;
      x *= pinch * bottom; if (y > 0) y += Math.pow(Math.max(0, t), 2) * .28; if (y < 0) y -= (1 - Math.abs(x) / .75) * .08;
      p.setXYZ(i, x, y, z);
    }
    hull.computeVertexNormals();
    const tri = new T.Shape(); tri.moveTo(0, 0); tri.lineTo(1, 0); tri.lineTo(.5, 1); tri.closePath();
    const gable = new T.ExtrudeGeometry(tri, {depth: 1, bevelEnabled: false}).translate(-.5, 0, -.5);
    const sail = new T.Shape(); sail.moveTo(0, 0); sail.lineTo(2.3, 0); sail.lineTo(0, 5); sail.closePath();
    const bush = new T.IcosahedronGeometry(.5, 1).toNonIndexed();
    const flower = new T.PlaneGeometry(1, 1).toNonIndexed();
    const flowerX = mergeGeometries([flower.clone(), flower.clone().rotateY(Math.PI / 2)]);
    this.mats.flowerBed = {material: new T.MeshStandardMaterial({map: this.flowerTexture, alphaTest: .45, side: T.DoubleSide, roughness: .9})};
    return {hull, gable, bush, flower: flowerX, sail: new T.ShapeGeometry(sail),
      hullMats: [0xf2f0ea, 0xa8322d, 0x2b4f7a, 0x2f6a4d, 0xe0c35a].map((c) => new T.MeshStandardMaterial({color: c, roughness: .55})),
      wood: new T.MeshStandardMaterial({color: 0x8a6440, roughness: .8}), sailMat: new T.MeshStandardMaterial({color: 0xf5f2ea, roughness: .7, side: T.DoubleSide}),
      mast: new T.MeshStandardMaterial({color: 0xd8d4c8, roughness: .5})};
  }

  boat(sailing, rng) {
    const P = this.boatParts, g = new T.Group(), hull = new T.Mesh(P.hull, P.hullMats[Math.floor(rng() * P.hullMats.length)]);
    hull.castShadow = true; g.add(hull);
    const deck = new T.Mesh(UNIT, P.wood); deck.scale.set(1.1, .05, 3.1); deck.position.y = .12; g.add(deck);
    for (const z of [-.9, .5]) { const seat = new T.Mesh(UNIT, P.wood); seat.scale.set(1.2, .06, .3); seat.position.set(0, .26, z); g.add(seat); }
    if (sailing) {
      const mast = new T.Mesh(new T.CylinderGeometry(.045, .06, 5.6, 8), P.mast); mast.position.set(0, 3, .6); g.add(mast);
      const sail = new T.Mesh(P.sail, P.sailMat); sail.rotation.y = -Math.PI / 2; sail.position.set(0, .45, .62); sail.castShadow = true; g.add(sail);
    }
    g.traverse((o) => { o.userData.shared = true; });
    return g;
  }

  placeBoats(group, plan, boats) {
    const r = this.world.road, rng = random(r.id * 5 + plan.index * 331 + 9), water = this.world.water.position.y;
    const spots = [];
    if (plan.bridge) for (const dx of [-70, 55, -130]) {
      const b = plan.bridge, x = r.x(b.z) + dx, z = b.z + (Math.sin(dx * .009 + b.phase) - Math.sin(b.phase)) * 26 + dx * .12;
      if (z >= plan.z0 && z < plan.z1) spots.push([x, z]);
    }
    for (let i = 0; i < 48; i++) { const z = plan.z0 + rng() * (plan.z1 - plan.z0), x = r.x(z) + (rng() < .5 ? -1 : 1) * (28 + rng() ** 1.5 * 240); spots.push([x, z, true]); }
    let placed = 0;
    for (const [x, z, check] of spots) {
      if (placed >= 2) break;
      const deep = (px, pz) => this.world.surfaceHeight(px, pz) < water - 1.2;
      if (!deep(x, z) || (check && !(deep(x + 4, z) && deep(x - 4, z) && deep(x, z + 4) && deep(x, z - 4)))) continue;
      // Only where you can see it from the road: nothing on the line from the driver's eye to the boat rises above that line.
      if (check) { const ex = r.x(z), ey = r.y(z) + 1.6; let seen = true; for (let k = 1; k < 10 && seen; k++) { const f = k / 10, px = ex + (x - ex) * f, py = ey + (water + .6 - ey) * f; if (this.world.surfaceHeight(px, z) > py) seen = false; } if (!seen) continue; }
      const g = this.boat(rng() < .4, rng); g.position.set(x, water + .05, z); g.rotation.y = rng() * Math.PI * 2;
      group.add(g); boats.push({g, phase: rng() * 6.28, yaw: g.rotation.y}); placed++;
    }
  }

  /* ---------- Per frame: lamps at night, boats on the swell ---------- */
  setMood({night, dusk, wet}) {
    const lit = night ? 1 : dusk ? .45 : 0;
    this.lit = lit; this.wet = wet;
    this.mats.shopGlass.material.emissiveIntensity = night ? 1.05 : dusk ? .55 : .06;
    this.mats.winLit.material.emissiveIntensity = night ? 1.3 : dusk ? .5 : 0;
    this.mats.sign.material.emissiveIntensity = night ? .85 : dusk ? .35 : 0;
    this.mats.lampHead.material.emissiveIntensity = night ? 6 : dusk ? 2.5 : 0;
    this.mats.pool.material.opacity = night ? .5 : dusk ? .18 : 0;
    this.mats.streak.material.opacity = wet ? (night ? .5 : dusk ? .25 : 0) : 0;
    for (const m of this.stripMats) m.material.emissiveIntensity = night ? 2.6 : dusk ? 1.6 : .25;
    if (!lit) { this.glow.begin(); this.glow.end(); for (const l of this.lamps) l.intensity = 0; }
  }

  update(dt, camera, focus) {
    this.time += dt;
    const t = this.time, chunks = this.world.chunks;
    for (const g of chunks.values()) for (const b of g.userData.boats || []) {
      b.g.position.y = this.world.water.position.y + .05 + Math.sin(t * 1.1 + b.phase) * .06;
      b.g.rotation.set(Math.sin(t * .7 + b.phase * 1.3) * .025, b.yaw + Math.sin(t * .05 + b.phase) * .3, Math.sin(t * .9 + b.phase) * .04);
    }
    if (!this.lit) return;
    this.glow.begin();
    const near = [];
    for (const g of chunks.values()) for (const l of g.userData.lamps || []) {
      const d = Math.hypot(l.x - camera.position.x, l.z - camera.position.z);
      if (d < 900) this.glow.add(l.x, l.y, l.z, this.lampColor, this.lit, 40);
      const df = Math.hypot(l.x - focus.x, l.z - focus.z);
      if (df < 40) near.push([df, l]);
    }
    this.glow.end();
    near.sort((a, b) => a[0] - b[0]);
    this.lamps.forEach((light, i) => {
      const l = near[i]?.[1];
      if (!l) { light.intensity = 0; return; }
      light.position.set(l.x, l.y - .3, l.z); light.intensity = 80 * this.lit;
    });
  }
}
