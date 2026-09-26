import {RoadsideModels} from './roadside-models.js?v=20260926-supplied7';
import * as T from './vendor/three.module.js';
import {random, noise, smooth, lerp, clamp} from './math.js?v=20260926-supplied7';
import {GlowPoints} from './glow.js?v=20260926-supplied7';
import {Batch, frame, UNIT, FLAT, PLANE, canvasTexture} from './scenery.js?v=20260926-supplied7';
import {sheltered} from './atmosphere.js?v=20260926-supplied7';
import {ZONE, TYPES, SEA} from './network.js?v=20260926-supplied7';

// Everything built along the road network itself: tunnels, motorway furniture, junction signs, the railway and its
// level crossings, petrol stations, cafés and viewpoints, lighthouses on the coast, snowbanks up high and farm fields.
const CYL = new T.CylinderGeometry(.5, .5, 1, 14).toNonIndexed();
const CYL8 = new T.CylinderGeometry(.5, .5, 1, 8).toNonIndexed();
const CONE = new T.ConeGeometry(.5, 1, 12).toNonIndexed();
const HALFCYL = new T.CylinderGeometry(.5, .5, 1, 14, 1, false, 0, Math.PI).toNonIndexed();
const SNOWBANK = new T.CylinderGeometry(.5, .5, 1, 10, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2).scale(1, 2, 1).toNonIndexed();

function stripes(w, h, a, b, n, vertical = false) {
  return canvasTexture(w, h, (x) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; if (vertical) x.fillRect(0, i * h / n, w, h / n + 1); else x.fillRect(i * w / n, 0, w / n + 1, h); } });
}

export class Roadside {
  constructor(world) {
    this.world = world; this.models = world.roadsideModels ||= new RoadsideModels(world); this.scene = world.scene; this.settings = world.settings; this.time = 0;
    this.lit = 0; this.glow = new GlowPoints(this.scene, 260, {fade: 900});
    this.lampColor = new T.Color(1, .86, .62); this.tunnelColor = new T.Color(1, .72, .38); this.red = new T.Color(1, .12, .05); this.white = new T.Color(1, 1, 1);
    this.signCache = new Map();
    this.tunnelLights = [0, 1, 2].map(() => { const l = new T.PointLight(0xffb870, 0, 26, 1.6); this.scene.add(l); return l; });
    this.makeMaterials();
  }

  makeMaterials() {
    const std = (o) => new T.MeshStandardMaterial(o);
    const gravel = canvasTexture(128, 128, (x, w, h) => { const rng = random(3); x.fillStyle = '#7b776f'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = 70 + rng() * 110; x.fillStyle = `rgb(${v},${v - 4},${v - 10})`; x.fillRect(rng() * w, rng() * h, 1 + rng() * 2.5, 1 + rng() * 2.5); } });
    gravel.wrapS = gravel.wrapT = T.RepeatWrapping;
    const crop = (bg, row, n, dot) => { const t = canvasTexture(128, 128, (x, w, h) => { const rng = random(n); x.fillStyle = bg; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = row; x.fillRect(i * 16 + 3, 0, 8, h); } for (let i = 0; i < 1400; i++) { x.fillStyle = dot(rng); x.fillRect(rng() * w, rng() * h, 1.5, 1.5 + rng() * 3); } }); t.wrapS = t.wrapT = T.RepeatWrapping; return t; };
    this.fieldMats = [
      std({map: crop('#b9983f', '#d6b957', 1, (r) => `rgba(${230 + r() * 25},${190 + r() * 40},${90 + r() * 40},.8)`), roughness: .95, polygonOffset: true, polygonOffsetFactor: -2}),
      std({map: crop('#4f7a35', '#6a9a44', 2, (r) => `rgba(${70 + r() * 40},${120 + r() * 60},${40 + r() * 30},.8)`), roughness: .95, polygonOffset: true, polygonOffsetFactor: -2}),
      std({map: crop('#6b5037', '#5a4230', 3, (r) => `rgba(${90 + r() * 40},${66 + r() * 30},${44 + r() * 20},.7)`), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2}),
      std({map: crop('#8d9c47', '#9fb052', 4, (r) => `rgba(${150 + r() * 50},${160 + r() * 50},${70 + r() * 30},.6)`), roughness: .95, polygonOffset: true, polygonOffsetFactor: -2}),
    ];
    const barrierArm = stripes(256, 16, '#f4f2ee', '#c8231c', 10);
    const crossbuck = canvasTexture(256, 256, (x, w) => { x.clearRect(0, 0, w, w); x.translate(w / 2, w / 2); for (const a of [.785, -.785]) { x.save(); x.rotate(a); x.fillStyle = '#c8231c'; x.fillRect(-120, -22, 240, 44); x.fillStyle = '#fff'; x.fillRect(-114, -16, 228, 32); x.restore(); } });
    const lighthouse = stripes(64, 256, '#f4f2ee', '#b8261e', 6, true);
    this.mats = {
      concrete: {material: std({vertexColors: true, roughness: .92}), cast: true},
      tile: {material: sheltered(std({vertexColors: true, roughness: .45, metalness: .05}), .2), cast: true},
      tunnelShell: {material: sheltered(std({vertexColors: true, roughness: .92})), cast: true},
      metal: {material: std({vertexColors: true, metalness: .6, roughness: .4}), cast: true},
      paint: {material: std({vertexColors: true, roughness: .6}), cast: true},
      ballast: {material: std({map: gravel, roughness: 1})},
      rail: {material: std({color: 0x8c8f93, metalness: .85, roughness: .35})},
      tunnelLamp: {material: std({color: 0xffe0b0, emissive: 0xffc27a, emissiveIntensity: 2.4})},
      lamp: {material: std({color: 0xd8d4c8, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: .4})},
      canopyLight: {material: std({color: 0xf6f6f2, emissive: 0xfff4de, emissiveIntensity: .4})},
      screen: {material: std({color: 0x203040, emissive: 0x6fd0ff, emissiveIntensity: .8})},
      glass: {material: std({color: 0x7a8a94, emissive: 0xffe2b8, emissiveIntensity: 0, roughness: .1, metalness: .4})},
      dark: {material: std({color: 0x050506, roughness: 1})},
      crossbuck: {material: std({map: crossbuck, transparent: true, alphaTest: .4, side: T.DoubleSide, roughness: .6})},
      snow: {material: std({color: 0xf4f7f8, roughness: .85}), cast: false},
      hedge: {material: std({vertexColors: true, roughness: 1}), cast: true},
      stripe: {material: std({map: lighthouse, roughness: .5}), cast: true},
      beacon: {material: std({color: 0xfff5d6, emissive: 0xffe6a8, emissiveIntensity: 0})},
    };
    this.armMat = std({map: barrierArm, roughness: .5});
    this.redOn = std({color: 0xff2a14, emissive: 0xff1a08, emissiveIntensity: 5}); this.redOff = std({color: 0x3a0a08, emissive: 0x200402, emissiveIntensity: .2});
    this.boardMat = std({color: 0xdcdcd8, roughness: .6});
  }

  /* ---------- Planning, so vegetation keeps off fields, forecourts and railway ---------- */
  // Fields in a chunk, remembered per road version so ground checks stay cheap.
  fieldsCached(index) {
    const key = this.world.road.version + ':' + index, c = (this.fieldCache ||= new Map());
    if (!c.has(key)) { c.set(key, this.fields(index)); if (c.size > 40) c.delete(c.keys().next().value); }
    return c.get(key);
  }
  inField(x, z) {
    const r = this.world.road;
    for (const f of this.fieldsCached(Math.floor(z / 240))) if (z > f.za && z < f.zb) { const d = (x - r.x(z)) * f.side; if (d > f.d0 && d < f.d1) return true; }
    return false;
  }
  fields(index) {
    const r = this.world.road, z0 = index * 240, out = [];
    const mid = z0 + 120; if (r.typeAt(mid) !== 'farm' || this.settings.location !== 'hills') return out;
    const rng = random(r.id * 3 + index * 811);
    for (const side of [-1, 1]) {
      let z = z0 + 4;
      while (z < z0 + 236) {
        const len = 40 + rng() * 55, d0 = r.half(z) + 5 + rng() * 3, w = 30 + rng() * 50, kind = Math.floor(rng() * 5);
        const zz = Math.min(z + len, z0 + 238);
        const ok = !r.townFactor(z) && !r.townFactor(zz) && !r.stopAt(z, 20) && !r.stopAt(zz, 20) && !r.junctions.some((j) => z < j.z + ZONE + 30 && zz > j.z - 40);
        if (ok && kind < 4) out.push({side, za: z, zb: zz, d0, d1: d0 + w, kind, hay: kind === 0 && rng() < .5, seed: rng()});
        z = zz + 2 + rng() * 6;
      }
    }
    return out;
  }
  blocked(index) {
    const r = this.world.road, fields = this.fields(index);
    return (x, z) => {
      for (const f of fields) if (z > f.za && z < f.zb) { const d = (x - r.x(z)) * f.side; if (d > f.d0 - 1 && d < f.d1 + 1) return true; }
      return false;
    };
  }

  /* ---------- Building ---------- */
  build(group, index, rows) {
    if (this.settings.location !== 'hills') return;
    const r = this.world.road, z0 = index * 240, z1 = z0 + 240, batch = new Batch();
    const U = group.userData; U.lamps ||= []; U.colliders ||= []; U.tunnelLamps = []; U.crossings = []; U.beacons = []; U.pumps = [];
    for (const seg of this.segsIn(z0, z1)) {
      for (const t of r.tunnels(seg)) if (t.end > z0 - 10 && t.start < z1 + 10) this.tunnel(batch, group, t, z0, z1);
      const rail = r.rail(seg); if (rail && rail.b > z0 - 10 && rail.a < z1 + 10) this.railway(batch, group, rail, z0, z1);
      for (const st of r.stops(seg)) if (st.z + st.len > z0 && st.z - st.len < z1 && st.z >= z0 && st.z < z1) this.stop(batch, group, st);
      if (seg.type === 'coast') this.lighthouse(batch, group, seg, z0, z1);
    }
    this.highway(batch, group, rows);
    this.snowbanks(batch, rows);
    this.farm(batch, group, index);
    for (const j of r.junctions) this.junctionSigns(batch, group, j, z0, z1);
    batch.flush(group, this.mats);
  }

  segsIn(z0, z1) { const r = this.world.road, out = new Set(); for (let z = z0; z <= z1; z += 60) out.add(r.segAt(z)); return [...out]; }

  // Tunnel: tiled walls and an arched ceiling with lights, concrete portals set into the hillside at each end.
  tunnel(batch, group, t, z0, z1) {
    const r = this.world.road, a = Math.max(t.start, z0), b = Math.min(t.end, z1), step = 4;
    for (let z = a; z < b; z += step) {
      const zm = Math.min(z + step / 2, b), len = Math.min(step, b - z) + .05, half = r.width(zm), x = r.x(zm), y = r.y(zm), yaw = Math.atan(r.tangent(zm)), pitch = -Math.atan(r.slope(zm)), L = len * Math.sqrt(1 + r.tangent(zm) ** 2);
      const put = frame(batch, x, y, zm, yaw);
      for (const s of [-1, 1]) {
        put('tile', UNIT, s * (half + .8), 3.25, 0, 0xc9c2b2, .5, 4.1, L, 0, pitch);
        put('tunnelShell', UNIT, s * (half + .78), .7, 0, 0x4d4f52, .5, 1.3, L, 0, pitch);
        put('tunnelShell', UNIT, s * (half + .45), .45, 0, 0x55575a, .25, .9, L, 0, pitch);
        // The vault: panels sloping up from the tops of the walls to the crown, closed off above.
        put('tunnelShell', UNIT, s * (half * .5 + .45), 6.15, 0, 0x9f9c94, half + 1.1, .35, L, 0, pitch, -s * .36);
        put('tunnelShell', UNIT, s * (half + 1.15), 6.6, 0, 0x8d8a82, .7, 2.9, L, 0, pitch);
      }
      put('tunnelShell', UNIT, 0, 6.75, 0, 0xb2afa6, half * .95, .35, L, 0, pitch);
      put('tunnelShell', UNIT, 0, 7.6, 0, 0x8d8a82, 2 * half + 3, 1.3, L, 0, pitch);
      if (Math.round(z / step) % 2 === 0) for (const s of [-1, 1]) {
        const ly = 6.15 - (half * .62 - (half * .5 + .45)) * .376 - .24;
        put('tunnelLamp', UNIT, s * (half * .62), ly, 0, 0xffffff, .26, .08, 1.4, 0, pitch, -s * .36);
        const [lx, lz] = put.world(s * half * .62, 0); group.userData.tunnelLamps.push({x: lx, y: y + ly - .1, z: lz});
      }
    }
    for (const [zp, dir] of [[t.start, 1], [t.end, -1]]) {
      if (zp < z0 || zp >= z1) continue;
      const half = r.width(zp), x = r.x(zp), y = r.y(zp), yaw = Math.atan(r.tangent(zp)), put = frame(batch, x, y, zp + dir * 2.5, yaw);
      // The portal face follows the hillside above it, in steps, so it sits into the slope instead of standing up out of it.
      const W = half + 12, c = Math.cos(yaw), sn = Math.sin(yaw);
      for (let lx = -W; lx < W - .01; lx += 2) {
        const mid = lx + 1, wx = x + mid * c, wz = zp + dir * 4 - mid * sn, ground = r.terrain(wx, wz) - y;
        const H = clamp(ground + 1.2, Math.abs(mid) < half + 1.6 ? 8.2 : 1.5, 42);
        if (Math.abs(mid) < half + 1.6) put('concrete', UNIT, mid, (H + 6.9) / 2, 0, 0xa9a59b, 2.02, H - 6.9, 7);
        else put('concrete', UNIT, mid, H / 2 - .5, 0, 0xa9a59b, 2.02, H + 1, 7);
      }
      put('concrete', UNIT, 0, 7.3, -dir * 3.4, 0x8f8b82, 2 * half + 5, .7, .9);
      for (const s of [-1, 1]) {
        // Wing walls holding back the cutting.
        put('concrete', UNIT, s * (half + 3.2), 2.8, -dir * 11, 0x9d998f, .8, 5.6, 16, s * dir * -.18);
      }
      put('concrete', UNIT, 0, 7.05, -dir * 3.6, 0x77746c, 2 * half + 3.4, .5, .6);
      put('dark', UNIT, 0, 3.4, dir * 3.2, 0xffffff, 2 * half + 1.5, 6.8, .1);
    }
  }

  // Railway: ballast, sleepers and rails between two tunnel portals; level crossings where it meets the road.
  railway(batch, group, rail, z0, z1) {
    const r = this.world.road, a = Math.max(rail.a, z0), b = Math.min(rail.b, z1), step = 5;
    const bed = [], bu = [], bi = [];
    let n = 0;
    for (let z = a; z <= b + .01; z += step) {
      const zz = Math.min(z, b), x = r.railX(rail, zz), y = r.railY(rail, zz), dx = r.railX(rail, zz + 1) - r.railX(rail, zz - 1), ang = Math.atan2(dx, 2), c = Math.cos(ang), s = Math.sin(ang);
      const onRoad = Math.abs(x - r.x(zz)) < r.half(zz) + 2.2;
      bed.push(x - c * 2, y - .05, zz + s * 2, x + c * 2, y - .05, zz - s * 2); bu.push(0, zz / 3, 1.2, zz / 3);
      if (n) { const k = (n - 1) * 2; if (!onRoad) bi.push(k, k + 2, k + 1, k + 2, k + 3, k + 1); }
      n++;
      if (zz >= b) break;
      const zm = zz + step / 2, xm = r.railX(rail, zm), ym = r.railY(rail, zm), dxm = r.railX(rail, zm + 1) - r.railX(rail, zm - 1), yawm = Math.atan2(dxm, 2), L = step * Math.sqrt(1 + (dxm / 2) ** 2) + .05;
      const pm = frame(batch, xm, ym, zm, yawm), mOnRoad = Math.abs(xm - r.x(zm)) < r.half(zm) + 1.2;
      for (const g of [-.72, .72]) pm('rail', UNIT, g, mOnRoad ? .03 : .2, 0, 0xffffff, .075, mOnRoad ? .06 : .15, L);
      if (!mOnRoad) for (let k = 0; k < 7; k++) {
        const sleeperZ=-L/2+(k+.5)*L/7;pm('paint', UNIT, 0, .07, sleeperZ, 0x9d9a8a, 2.5, .14, .24);
        for(const railX of [-.72,.72]){pm('metal',UNIT,railX,.155,sleeperZ,0x5a493e,.28,.04,.2);for(const side of [-1,1])pm('metal',UNIT,railX+side*.095,.2,sleeperZ,0x866e49,.035,.08,.11);}
      }
      else pm('concrete', UNIT, 0, .045, 0, 0x2f3134, 2.2, .06, L);
    }
    if (bi.length) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(bed, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(bu, 2)); g.setIndex(bi); g.computeVertexNormals(); const m = new T.Mesh(g, this.mats.ballast.material); m.receiveShadow = true; group.add(m); }
    // Portals where the line disappears into the hills.
    for (const [zp, dirn] of [[rail.a, -1], [rail.b, 1]]) {
      if (zp < z0 || zp >= z1) continue;
      const x = r.railX(rail, zp), y = r.railY(rail, zp), yaw = Math.atan2(r.railX(rail, zp + 1) - r.railX(rail, zp - 1), 2), put = frame(batch, x, y, zp + dirn * 2, yaw);
      for (const s of [-1, 1]) put('concrete', UNIT, s * 3.2, 4, 0, 0x8f8b82, 1.6, 8, 3);
      put('concrete', UNIT, 0, 7.4, 0, 0x8f8b82, 8, 1.6, 3); put('concrete', UNIT, 0, 10, 0, 0x8f8b82, 12, 4, 3);
      put('dark', UNIT, 0, 3.3, dirn * 1.4, 0xffffff, 4.8, 6.6, .1);
    }
    for (const zc of rail.crossings) if (zc >= z0 && zc < z1) this.crossing(batch, group, rail, zc);
  }

  // Level crossing: half-barriers on each approach, flashing red lights and crossbuck signs.
  crossing(batch, group, rail, zc) {
    const r = this.world.road, side = r.side, cross = {z: zc, rail, arms: [], lights: [], stops: []};
    for (const dir of [1, -1]) {
      const zs = zc - dir * 8.5, half = r.width(zs), yaw = Math.atan(r.tangent(zs)), x = r.x(zs) + side * dir * (half + .9) / Math.cos(yaw), y = r.y(zs);
      const put = frame(batch, x, y, zs, yaw);
      put('metal', UNIT, 0, 1.6, 0, 0xe8e6e0, .18, 3.2, .18);
      put('metal', UNIT, 0, .55, 0, 0x2d2f31, .6, 1.1, .5);
      put('crossbuck', PLANE, 0, 3.55, 0, 0xffffff, 1.3, 1.3, 1, dir > 0 ? Math.PI : 0);
      put('metal', UNIT, 0, 2.6, 0, 0x151515, 1.1, .5, .12);
      // Pivoting arm across the lane.
      const pivot = new T.Group(); pivot.position.set(x, y + 1.05, zs); pivot.rotation.order = 'YXZ'; pivot.rotation.y = yaw; group.add(pivot);
      const arm = new T.Mesh(new T.BoxGeometry(half + .4, .14, .1).translate(-side * dir * (half + .4) / 2, 0, 0), this.armMat); arm.castShadow = true; pivot.add(arm);
      pivot.userData.dir = -side * dir;
      const lamps = [-.32, .32].map((o) => { const l = new T.Mesh(new T.SphereGeometry(.13, 10, 8), this.redOff); const [lx, lz] = put.world(0, 0); l.position.set(lx + Math.cos(yaw) * o, y + 2.6, lz - Math.sin(yaw) * o + (dir > 0 ? -.08 : .08)); group.add(l); return l; });
      cross.arms.push(pivot); cross.lights.push(lamps); cross.stops.push({dir, z: zc - dir * 10});
      group.userData.colliders.push({x, z: zs, r: .35});
    }
    group.userData.crossings.push(cross);
  }

  // Petrol station, café or scenic viewpoint beside the road, with a pull-in lay-by.
  stop(batch, group, st) {
    const r = this.world.road, z = st.z, half = r.width(z), x0 = r.x(z), y = r.y(z) + .06, yaw = Math.atan(r.tangent(z)) + (st.side < 0 ? Math.PI : 0);
    const put = frame(batch, x0 + st.side * r.half(z), y, z, yaw), col = group.userData.colliders;
    // Paved apron: a flat strip from the road edge out to the stop's depth, tapered at both ends.
    const pos = [], idx = [], n = 12;
    for (let i = 0; i <= n; i++) { const zz = z - st.len + 2 * st.len * i / n, u = Math.abs(zz - z) / st.len, dep = st.depth * (1 - smooth(.5, 1, u)), cx = r.x(zz), hx = r.half(zz), yy = r.y(zz) + .058; pos.push(cx + st.side * (hx - .1), yy, zz, cx + st.side * (hx + Math.max(.2, dep)), yy, zz); if (i) { const k = (i - 1) * 2; if (st.side > 0) idx.push(k, k + 2, k + 1, k + 2, k + 3, k + 1); else idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const apron = new T.Mesh(g, new T.MeshStandardMaterial({color: st.kind === 'view' ? 0x8f8a80 : 0x6a6c6e, roughness: .9, polygonOffset: true, polygonOffsetFactor: -1})); apron.receiveShadow = true; group.add(apron);
    const lamp = (lx, lz, h = 6) => { put('metal', UNIT, lx, h / 2, lz, 0x4d5257, .12, h, .12); put('lamp', UNIT, lx - .5, h - .1, lz, 0xffffff, 1, .12, .3); const [wx, wz] = put.world(lx - .5, lz); group.userData.lamps.push({x: wx, y: y + h - .3, z: wz}); };
    if (st.kind === 'fuel') {
      const d = 9, cw = 11, cl = 20;
      if(!this.models.loaded.canopy){put('paint', UNIT, d + 1, 5.3, 0, 0xf4f4f0, cw + 1, .5, cl);
      put('paint', UNIT, d + 1, 5.62, 0, 0xc81f25, cw + 1.1, .16, cl + .1);
      put('canopyLight', UNIT, d + 1, 5.03, 0, 0xffffff, cw - 1, .05, cl - 2); }else{const [cx,cz]=put.world(d+1,0);this.models.place('canopy',group,cx,y+5.03,cz,yaw+Math.PI/2);}
      for (const lx of [d - 3.5, d + 5.5]) for (const lz of [-7, 7]) { put('metal', UNIT, lx, 2.6, lz, 0xdadada, .35, 5.2, .35); const [cx, cz] = put.world(lx, lz); col.push({x: cx, z: cz, r: .35}); }
      for (const lz of [-4.5, 4.5]) {
        put('concrete', UNIT, d + 1, .12, lz, 0xbdbab2, 1.4, .24, 6);
        for (const pz of [-1.6, 1.6]) { if(this.models.loaded.pump){const [px,pzz]=put.world(d+1,lz+pz);this.models.place('pump',group,px,y+.24,pzz,yaw);continue;}put('paint', UNIT, d + 1, .95, lz + pz, 0xf1f1ee, .6, 1.5, .5); put('paint', UNIT, d + 1, 1.72, lz + pz, 0xc81f25, .62, .12, .52); put('screen', UNIT, d + .68, 1.25, lz + pz, 0xffffff, .02, .3, .3);
          for(let j=0;j<9;j++){const a=j/8*Math.PI;put('dark',UNIT,d+.65,.85-Math.sin(a)*.45,lz+pz+Math.cos(a)*.32,0xffffff,.05,.07,.14,0,-Math.cos(a)*.4);}
          put('metal',UNIT,d+.61,1.07,lz+pz+.32,0x323b37,.09,.22,.07,0,.3); }
        const [px, pz2] = put.world(d + 1, lz); col.push({x: px, z: pz2, hx: 1.1, hz: 3.2, c: Math.cos(yaw), s: Math.sin(yaw), r: 0});
        for (const lane of [-2.4, 2.4]) { const [ax, az] = put.world(d + 1 + lane, lz); group.userData.pumps.push({x: ax, z: az, stop: st}); }
      }
      if(!this.models.loaded.shop){put('paint', UNIT, d + 13.5, 1.9, 0, 0xeeece6, 6, 3.8, 10); put('glass', UNIT, d + 10.45, 1.6, 0, 0xffffff, .1, 2.4, 8); put('paint', UNIT, d + 10.4, 3.4, 0, 0xc81f25, .2, .7, 9.5);}else{const [sx,sz]=put.world(d+13.5,0);this.models.place('shop',group,sx,y,sz,yaw-Math.PI/2);for(const [key,lz] of [['ice',-5.3],['bin',5.3]]){const [px,pz]=put.world(d+8,lz);this.models.place(key,group,px,y,pz,yaw-Math.PI/2);}}
      const [bx, bz] = put.world(d + 13.5, 0); col.push({x: bx, z: bz, hx: 5.3, hz: 4.6, c: Math.cos(yaw), s: Math.sin(yaw), r: 0});
      put('metal', UNIT, 2, 3.2, -st.len * .7, 0x3c4045, .3, 6.4, .3); put('paint', UNIT, 2, 6.2, -st.len * .7, 0xc81f25, .3, 2.2, 1.8); put('screen', UNIT, 1.83, 5.8, -st.len * .7, 0xffffff, .02, 1, 1.4);
      lamp(d - 4, -st.len * .55); lamp(d - 4, st.len * .55);
      group.userData.lamps.push(...[[d + 1, -6], [d + 1, 6]].map(([lx, lz]) => { const [wx, wz] = put.world(lx, lz); return {x: wx, y: y + 4.8, z: wz}; }));
    } else if (st.kind === 'cafe') {
      const d = 13;
      put('paint', UNIT, d, 1.8, 0, 0xf1e6d2, 7, 3.6, 11); put('glass', UNIT, d - 3.55, 1.5, 0, 0xffffff, .1, 2.2, 8.5);
      put('paint', UNIT, d - 4.3, 2.75, 0, 0x2f5d45, 1.8, .08, 10, 0, 0, .35); put('paint', UNIT, d, 3.75, 0, 0x6b4a33, 7.6, .3, 11.6);
      const [bx, bz] = put.world(d, 0); col.push({x: bx, z: bz, hx: 3.6, hz: 5.6, c: Math.cos(yaw), s: Math.sin(yaw), r: 0});
      for (let k = 0; k < 4; k++) {
        const lz = -9 + k * 6, lx = d - 7;
        put('metal', CYL8, lx, .72, lz, 0x3a3a3a, .9, .06, .9); put('metal', UNIT, lx, .36, lz, 0x3a3a3a, .06, .72, .06);
        put('metal', UNIT, lx, 1.5, lz, 0x6a6a6a, .05, 1.8, .05); put('paint', CONE, lx, 2.4, lz, [0xc9573a, 0x2f5d45, 0xe0c35a, 0x283d63][k], 2.4, .5, 2.4);
        for (const cz of [-.7, .7]) put('metal', UNIT, lx, .45, lz + cz, 0x5a3b26, .45, .06, .45);
      }
      for (let k = -2; k <= 2; k++) put('paint', UNIT, 6, .005, k * 4, 0xe8e6dc, 5, .01, .12);
      lamp(3, -st.len * .55); lamp(3, st.len * .55);
    } else {
      const d = st.depth;
      for (let k = -8; k <= 8; k++) put('concrete', UNIT, d + .3, .45, k * 2, 0x9a9486, .5, .9, 2.02);
      put('metal', UNIT, d - .6, .45, -6, 0x5a3b26, .5, .06, 1.8); put('metal', UNIT, d - .6, .45, 6, 0x5a3b26, .5, .06, 1.8);
      put('metal', UNIT, d - .6, .8, -6, 0x5a3b26, .08, .5, 1.8); put('metal', UNIT, d - .6, .8, 6, 0x5a3b26, .08, .5, 1.8);
      put('metal', UNIT, d - .3, .6, 0, 0x2b2f33, .1, 1.2, .1); put('metal', CYL, d - .3, 1.3, 0, 0x3f6f78, .16, .6, .16, 0, 0, Math.PI / 2 - .3);
      put('paint', UNIT, 1.5, 1.8, -st.len * .75, 0x2f5d45, .1, 1.4, 2.2); put('metal', UNIT, 1.5, .6, -st.len * .75, 0x3a3a3a, .1, 1.2, .1);
      const [vx, vz] = put.world(d + .3, 0); col.push({x: vx, z: vz, hx: .3, hz: 17, c: Math.cos(yaw), s: Math.sin(yaw), r: 0});
    }
  }

  // Motorway: concrete central barrier, lamps along the median in stretches, and gantry signs.
  highway(batch, group, rows) {
    const r = this.world.road;
    for (let i = 0; i < rows.length - 1; i++) {
      const R = rows[i], inTube = R.tunnel && R.z > R.tunnel.start + 3 && R.z < R.tunnel.end - 3;
      // The central barrier follows whichever road here is the motorway: the one you are on, or the one you are leaving.
      const zm = R.z + 2.5, main = r.segAt(zm), here = main.typeAt(zm);
      const seg = here !== 'highway' ? null : main.type === 'highway' ? main : r.stubs(zm).map((q) => q.seg).find((q) => q.type === 'highway');
      if (!seg) continue;
      const onMain = seg === main;
      const x = seg.x(zm), y = seg.y(zm), t = seg.x(zm + .5) - seg.x(zm - .5), yaw = Math.atan(t), pitch = -Math.atan(seg.y(zm + .5) - seg.y(zm - .5)), L = 5 * Math.sqrt(1 + t * t) + .03;
      const put = frame(batch, x, y + .05, zm, yaw);
      const mat = inTube ? 'tunnelShell' : 'concrete';
      put(mat, UNIT, 0, .2, 0, 0xbab6ad, .62, .4, L, 0, pitch); put(mat, UNIT, 0, .6, 0, 0xc4c0b7, .26, .5, L, 0, pitch);
      if (R.tunnel) continue;
      if (Math.round(R.z / 5) % 12 === 0 && Math.floor(R.z / 900) % 2 === 0) {
        put('metal', UNIT, 0, 6, 0, 0x6a7078, .16, 12, .16);
        for (const s of [-1, 1]) { put('metal', UNIT, s * 1.2, 11.8, 0, 0x6a7078, 2.4, .1, .1); put('lamp', UNIT, s * 2.4, 11.7, 0, 0xffffff, .8, .14, .3); const [lx, lz] = put.world(s * 2.4, 0); group.userData.lamps.push({x: lx, y: y + 11.5, z: lz}); }
      }
      if (Math.round(R.z) % 1600 === 0 && onMain) this.gantry(batch, group, R.z);
    }
  }
  gantry(batch, group, z) {
    const r = this.world.road, x = r.x(z), y = r.y(z), yaw = Math.atan(r.tangent(z)), half = r.width(z), side = r.side, put = frame(batch, x, y, z, yaw);
    for (const px of [side * 1.4, side * (half + 1.2)]) put('metal', UNIT, px, 3.8, 0, 0x7c8288, .35, 7.6, .35);
    put('metal', UNIT, side * (half + 2.6) / 2, 7.4, 0, 0x7c8288, half, .5, .5);
    const j = r.junctionAhead(z, 3000), text = j ? [`${r.optionInfo(j, 1).label} · ${r.optionInfo(j, 1).name}`, `${Math.max(1, Math.round((j.z - z) / 100) / 10)} km`] : ['Services', `${1 + Math.round(random(Math.round(z))() * 20)} km`];
    const tex = this.signTexture(text, '#1f5c3a'), board = new T.Mesh(new T.PlaneGeometry(6.4, 2.4), new T.MeshStandardMaterial({map: tex, roughness: .6}));
    board.position.set(x + Math.cos(yaw) * side * (half * .55 + 1), y + 8.9, z - Math.sin(yaw) * side * (half * .55 + 1) - .3); board.rotation.y = yaw + Math.PI; group.add(board);
  }

  signTexture(lines, bg) {
    const key = lines.join('|') + bg; if (this.signCache.has(key)) return this.signCache.get(key);
    const t = canvasTexture(640, 240, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 54px Arial, sans-serif'; x.fillText(lines[0], w / 2, 108, w - 60); x.font = '600 42px Arial, sans-serif'; x.fillText(lines[1] || '', w / 2, 180, w - 60); });
    this.signCache.set(key, t); if (this.signCache.size > 60) this.signCache.delete(this.signCache.keys().next().value);
    return t;
  }

  // Direction signs before a junction: a map-style board, then a closer confirmation sign, then a chevron at the split.
  junctionSigns(batch, group, j, z0, z1) {
    const r = this.world.road, side = r.side, A = r.optionInfo(j, 0), B = r.optionInfo(j, 1);
    const place = (z, w, h, draw) => {
      if (z < z0 || z >= z1) return;
      const seg = j.from, yaw = Math.atan(seg.x(z + .5) - seg.x(z - .5)), x = seg.x(z) + side * (seg.half(z) + 2.6) / Math.cos(yaw), y = seg.y(z);
      const key = 'jn' + j.z + w; let tex = this.signCache.get(key);
      if (!tex) { tex = canvasTexture(640, Math.round(640 * h / w), draw); this.signCache.set(key, tex); }
      const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = yaw + Math.PI;
      const board = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map: tex, roughness: .6})); board.position.y = 2.2 + h / 2; board.castShadow = true; g.add(board);
      const back = new T.Mesh(new T.BoxGeometry(w + .1, h + .1, .06), this.boardMat); back.position.set(0, 2.2 + h / 2, -.05); g.add(back);
      for (const e of [-1, 1]) { const p = new T.Mesh(new T.CylinderGeometry(.07, .07, 2.2 + h, 8), this.boardMat); p.position.set(e * w * .35, (2.2 + h) / 2, -.1); g.add(p); }
      group.add(g); group.userData.colliders.push({x, z, r: .5});
    };
    const left = B.dir === 'left';
    place(j.z - 280, 4.6, 3.2, (x, w, h) => {
      x.fillStyle = '#1b3f8f'; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16);
      x.lineCap = 'round'; x.lineWidth = 34; x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(w / 2, h - 30); x.lineTo(w / 2, 150); x.stroke();
      x.beginPath(); x.moveTo(w / 2, h * .62); x.quadraticCurveTo(w / 2, h * .45, w / 2 + (left ? -150 : 150), h * .38); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.moveTo(w / 2 - 36, 158); x.lineTo(w / 2, 104); x.lineTo(w / 2 + 36, 158); x.fill();
      x.textAlign = 'center'; x.font = '700 40px Arial, sans-serif'; x.fillText(A.label, w / 2, 70, w - 60); x.font = '500 30px Arial, sans-serif'; x.fillText(A.name, w / 2, 100, w - 60);
      x.textAlign = left ? 'left' : 'right'; x.font = '700 38px Arial, sans-serif'; x.fillText(B.label, left ? 36 : w - 36, h * .52, w * .42); x.font = '500 28px Arial, sans-serif'; x.fillText(B.name, left ? 36 : w - 36, h * .52 + 36, w * .42);
    });
    place(j.z - 90, 3.4, 1.8, (x, w, h) => {
      x.fillStyle = '#1b3f8f'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 64px Arial, sans-serif';
      x.fillText(`${left ? '←' : '↑'}  ${left ? B.label : A.label}`, w / 2, h * .42, w - 40); x.fillText(`${left ? '↑' : '→'}  ${left ? A.label : B.label}`, w / 2, h * .82, w - 40);
    });
    // Chevron at the gore where the roads part.
    for (let u = 20; u < 200; u += 5) {
      const z = j.z + u, sep = Math.abs(j.options[1].x(z) - j.options[0].x(z)), need = j.options.reduce((n, o) => n + o.half(z) * r.stretch(o, z), 4);
      if (sep > need) { if (z >= z0 && z < z1) { const xm = (j.options[0].x(z) + j.options[1].x(z)) / 2, y = j.options[0].y(z), put = frame(batch, xm, y, z, 0); put('metal', UNIT, 0, .7, 0, 0x3a3a3a, .1, 1.4, .1); put('paint', UNIT, 0, 1.5, -.06, 0xffc21a, 1.2, .8, .04); group.userData.colliders.push({x: xm, z, r: .4}); } break; }
    }
  }

  lighthouse(batch, group, seg, z0, z1) {
    const r = this.world.road, z = seg.z0 + seg.len * .62; if (z < z0 || z >= z1 || r.stopAt(z, 60) || r.townFactor(z)) return;
    const d = r.half(z) + 150, x = r.x(z) + seg.seaSide * d, base = SEA - .5;
    for (let k = 0; k < 14; k++) { const a = k * 2.4, rr = 5 + (k % 3) * 2.5; batch.add('concrete', new T.IcosahedronGeometry(1, 1), x + Math.cos(a) * rr, base + .5, z + Math.sin(a) * rr, a, 0x6c665c, 3 + (k % 2) * 2, 2.2, 3.5); }
    batch.add('concrete', CYL, x, base + 1.2, z, 0, 0xcfcac0, 9, 2.6, 9);
    batch.add('stripe', CYL, x, base + 12, z, 0, 0xffffff, 3.4, 19, 3.4);
    batch.add('metal', CYL, x, base + 22, z, 0, 0x2a2d30, 4.4, .4, 4.4);
    batch.add('beacon', CYL, x, base + 23.4, z, 0, 0xffffff, 2.6, 2.4, 2.6);
    batch.add('metal', CONE, x, base + 25.6, z, 0, 0xb8261e, 3.2, 2, 3.2);
    group.userData.beacons.push({x, y: base + 23.4, z});
  }

  snowbanks(batch, rows) {
    const r = this.world.road;
    for (let i = 0; i < rows.length - 1; i++) {
      const R = rows[i]; if (R.y < 110 || R.tunnel || r.stopAt(R.z, 10)) continue;
      const zm = R.z + 2.5, x = r.x(zm), y = r.y(zm), yaw = Math.atan(r.tangent(zm)), put = frame(batch, x, y, zm, yaw), L = 5.4;
      // Low, soft banks of ploughed snow along the verges.
      for (const s of [-1, 1]) put('snow', SNOWBANK, s * (r.width(zm) + .9), -.05, 0, 0xffffff, 1.4 + noise(R.z * .1, s, 3) * .9, .28 + noise(R.z * .07, s, 5) * .3, L, 0, -Math.atan(r.slope(zm)), s * .12);
    }
  }

  // Farm lanes: crop fields draped over the land with hedges, hay bales on the harvested ones, and a barn now and then.
  farm(batch, group, index) {
    const r = this.world.road, w = this.world, fields = this.fields(index); if (!fields.length) return;
    for (const f of fields) {
      // Fine enough to lie on the ground everywhere, so nothing sinks into the crop.
      const nz = Math.max(4, Math.ceil((f.zb - f.za) / 3)), nd = Math.max(4, Math.ceil((f.d1 - f.d0) / 3)), pos = [], uv = [], idx = [];
      for (let i = 0; i <= nz; i++) for (let k = 0; k <= nd; k++) {
        const z = lerp(f.za, f.zb, i / nz), d = lerp(f.d0, f.d1, k / nd), x = r.x(z) + f.side * d, y = w.surfaceHeight(x, z) + .06;
        pos.push(x, y, z); uv.push(d / 6, z / 6);
        if (i < nz && k < nd) { const a = i * (nd + 1) + k, b = a + nd + 1; if (f.side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1); }
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new T.Mesh(g, this.fieldMats[f.kind]); m.receiveShadow = true; group.add(m);
      // Hedge along the road side of the field.
      for (let z = f.za; z < f.zb; z += 4) { const d = f.d0 - 1.2, x = r.x(z) + f.side * d, y = w.surfaceHeight(x, z); batch.add('hedge', UNIT, x, y + .6, z + 2, Math.atan(r.tangent(z)), 0x3f5f2c, 1.1, 1.2 + noise(z * .2, f.side, 2) * .5, 4.2); }
      if (f.hay) { const rng = random(Math.floor(f.seed * 1e6)); for (let k = 0; k < 7; k++) { const z = lerp(f.za + 6, f.zb - 6, rng()), d = lerp(f.d0 + 5, f.d1 - 5, rng()), x = r.x(z) + f.side * d, y = w.surfaceHeight(x, z); batch.add('paint', CYL, x, y + .7, z, rng() * 3, 0xd9b75a, 1.5, 1.2, 1.5, 0, 0, Math.PI / 2); group.userData.colliders.push({x, z, r: .8}); } }
      if (f.seed < .18) {
        const z = (f.za + f.zb) / 2, d = f.d1 + 12, x = r.x(z) + f.side * d, y = w.surfaceHeight(x, z), yaw = Math.atan(r.tangent(z)) + (f.side < 0 ? Math.PI : 0), put = frame(batch, x, y, z, yaw);
        put('paint', UNIT, 0, 3, 0, 0x8e2b22, 9, 6, 14); put('paint', UNIT, 0, 6.6, 0, 0x3b3f44, 9.8, .3, 14.6);
        for (const s of [-1, 1]) put('paint', UNIT, s * 2.6, 7.7, 0, 0x3b3f44, 5.6, .25, 14.6, 0, 0, -s * .6);
        put('paint', UNIT, -4.55, 2.2, 0, 0xf1efe8, .1, 4.4, 4.6); put('paint', UNIT, -4.6, 2.2, 0, 0x6e2019, .08, 3.8, .2);
        put('metal', CYL, 3.5, 5.5, 9.5, 0xb9bec2, 4, 11, 4); put('metal', new T.SphereGeometry(.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed(), 3.5, 11, 9.5, 0x9aa0a5, 4, 2.4, 4);
        const [cx, cz] = put.world(0, 0); group.userData.colliders.push({x: cx, z: cz, hx: 4.6, hz: 7.2, c: Math.cos(yaw), s: Math.sin(yaw), r: 0});
      }
    }
  }

  /* ---------- Per frame ---------- */
  setMood({lit}) {
    this.lit = lit;
    this.mats.lamp.material.emissiveIntensity = 3.2 * lit;
    this.mats.canopyLight.material.emissiveIntensity = .4 + 2 * lit;
    this.mats.glass.material.emissiveIntensity = .04 + .76 * lit;
    this.mats.beacon.material.emissiveIntensity = .3 + 3.7 * lit;
  }

  update(dt, camera, railway, focus) {
    this.time += dt;
    const t = this.time, cam = camera.position, blink = Math.floor(t * 1.7) % 2;
    this.glow.begin();
    const near = [];
    for (const g of this.world.chunks.values()) {
      const U = g.userData;
      for (const l of U.tunnelLamps || []) { const d = Math.abs(l.z - cam.z); if (d < 320) this.glow.add(l.x, l.y, l.z, this.tunnelColor, .42, 14); if (Math.abs(l.z - focus.z) < 30) near.push([Math.abs(l.z - focus.z), l]); }
      for (const b of U.beacons || []) {
        // A lighthouse beam sweeping round: brightest when it points your way.
        const a = t * 1.3, facing = Math.max(0, Math.cos(a - Math.atan2(cam.x - b.x, cam.z - b.z))) ** 16;
        if (this.lit > .05) this.glow.add(b.x, b.y, b.z, this.lampColor, this.lit * (.5 + facing * 2.5), 40 + facing * 60);
      }
      for (const c of U.crossings || []) {
        const state = railway ? railway.crossingState(c.z) : {closed: 0, flashing: false};
        c.arms.forEach((p) => { p.rotation.z = p.userData.dir * (1 - state.closed) * Math.PI * .48; });
        c.lights.forEach((pair) => pair.forEach((l, i) => { const on = state.flashing && i === blink; l.material = on ? this.redOn : this.redOff; if (on) this.glow.add(l.position.x, l.position.y, l.position.z, this.red, .9, 16); }));
      }
    }
    this.glow.end();
    // Warm light from the nearest tunnel lamps falls on the car and the walls around it.
    near.sort((a, b) => a[0] - b[0]);
    this.tunnelLights.forEach((light, i) => { const l = near[i * 2]?.[1]; light.intensity = l ? 18 : 0; if (l) light.position.set(l.x, l.y - .4, l.z); });
  }
}
