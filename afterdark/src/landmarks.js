import * as THREE from '/evermile/vendor/three.module.js';
import { loadGLB } from './car.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';

const ASPHALT = '/evermile/assets/materials/asphalt_03_diff_1k.jpg';
const UP = new THREE.Vector3(0, 1, 0);

export function planAirfield(samples) {
  const entrance = samples.filter(s => s.road === 'coast' && s.z < -1320 && !s.bridge && !s.tunnel)
    .reduce((best, s) => Math.abs(s.x - 930) < Math.abs(best.x - 930) ? s : best);
  const runway = { u: 0, v: 36, length: 630, width: 23 };
  const site = {
    key: 'airport', name: 'Port Aurora Airfield', x: entrance.x, z: entrance.z + 236,
    y: Math.max(3, entrance.y), ux: 1, uz: 0, vx: 0, vz: 1, r: 225, road: entrance, runway,
    paving: [
      [runway.u, runway.v, runway.length, runway.width],
      [0, 0, 440, 8],        // Parallel taxiway
      [-215, 18, 8, 36], [215, 18, 8, 36], [28, 18, 12, 36],
      [22, -26, 133, 50],    // Apron
      [0, -77, 96, 22],      // Public parking
      [0, -158, 11, 147]     // Access from the coast road
    ]
  };
  site.arrival = { x: site.x, z: site.z - 78, y: site.y, name: site.name };
  site.contains = (x, z, margin = 0) => {
    const u = Math.abs(x - site.x), v = z - site.z;
    return (u < 332 + margin && v > -97 - margin && v < 81 + margin)
      || (u < 16 + margin && v > -232 - margin && v <= -97);
  };
  return site;
}

export function sitePosition(site, u, v) {
  return [site.x + site.ux * u + site.vx * v, site.z + site.uz * u + site.vz * v];
}

export function sitePaved(site, x, z) {
  const dx = x - site.x, dz = z - site.z, u = dx * site.ux + dz * site.uz, v = dx * site.vx + dz * site.vz;
  return site.paving.some(([px, pz, w, d]) => Math.abs(u - px) <= w / 2 && Math.abs(v - pz) <= d / 2);
}

function signTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeSite(scene, city, world, site) {
  const group = new THREE.Group();
  group.name = site.name;
  group.position.set(site.x, site.y, site.z);
  const yaw = Math.atan2(-site.uz, site.ux);
  group.rotation.y = yaw;
  const mirror = Math.sign(site.vx * Math.sin(yaw) + site.vz * Math.cos(yaw));
  scene.add(group);
  city.chunks.push({ mesh: group, x: site.x, z: site.z, r: site.key === 'airport' ? 400 : 50, max: site.key === 'airport' ? 1750 : 650 });

  const batches = new Map(), emitters = [], paintDetails = [];
  const standard = new THREE.MeshStandardMaterial({ roughness: 0.73, metalness: 0.08, envMapIntensity: 0.55 });
  const paint = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.91, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xb8beaf, emissive: 0xfff2d2, emissiveIntensity: 0.15, roughness: 0.38 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x24363e, metalness: 0.44, roughness: 0.19, clearcoat: 0.75, envMapIntensity: 1.9 });
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  const add = (geometry, mat, u, y, v, w, h, d, c, turn) => {
    const key = geometry.uuid + mat.uuid;
    const batch = batches.get(key) || { geometry, mat, entries: [] };
    if (!batches.has(key)) batches.set(key, batch);
    batch.entries.push([u, y, v * mirror, w, h, d, c, turn * mirror]);
  };
  function solid(u, v, w, d) {
    const radius = Math.min(w, d) * 0.5, long = Math.max(w, d), count = Math.max(1, Math.ceil(long / radius));
    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * (long - 2 * radius);
      const [x, z] = sitePosition(site, u + (w >= d ? offset : 0), v + (w < d ? offset : 0));
      city.colliders.push({ x, z, r: radius });
    }
  }
  function box(u, y, v, w, h, d, c, opts = {}) {
    add(cube, opts.mat || standard, u, y, v, w, h, d, c, opts.turn || 0);
    if (opts.hard) solid(u, v, w, d);
  }
  function post(u, y, v, radius, height, c, hard = false) {
    add(cylinder, standard, u, y, v, radius, height, radius, c, 0);
    if (hard) solid(u, v, 2 * radius, 2 * radius);
  }
  function patch(u, v, w, d, offset, material, step = 12, c = 0xffffff) {
    const g = new THREE.PlaneGeometry(w, d, Math.ceil(w / step), Math.ceil(d / step));
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, uv = g.attributes.uv, colors = [];
    color.set(c);
    for (let i = 0; i < pos.count; i++) {
      const lx = u + pos.getX(i), lz = v + pos.getZ(i);
      const [x, z] = sitePosition(site, lx, lz);
      pos.setXYZ(i, lx, world.ground(x, z) - site.y + offset, lz * mirror);
      uv.setXY(i, lx / 5, lz / 5);
      colors.push(color.r, color.g, color.b);
    }
    if (mirror < 0) {
      const index = g.index;
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i);
        index.setX(i, index.getX(i + 1));
        index.setX(i + 1, a);
      }
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    if (material === paint) {
      paintDetails.push(g);
      return;
    }
    const obj = new THREE.Mesh(g, material);
    obj.receiveShadow = true;
    group.add(obj);
  }
  const asphalt = new THREE.TextureLoader().load(ASPHALT);
  asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
  asphalt.colorSpace = THREE.SRGBColorSpace;
  asphalt.anisotropy = 8;
  const pavement = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.91, envMapIntensity: 0.25 });
  site.paving.forEach(([u, v, w, d]) => patch(u, v, w, d, 0.075, pavement, site.key === 'petrol' ? 2.3 : 4));
  const mark = (u, v, w, d, c = 0xd6d2b7) => patch(u, v, w, d, 0.123, paint, 3, c);

  function sign(u, y, v, width, height, turn, draw, lit = false) {
    const map = signTexture(1024, 256, draw);
    const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.58, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: lit ? 0.25 : 0 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    mesh.position.set(u, y, v * mirror);
    mesh.rotation.y = mirror > 0 ? turn : Math.PI - turn;
    group.add(mesh);
    if (lit) emitters.push(mat);
  }
  function install(model, u, y, v, turn = 0) {
    const mesh = model.clone();
    mesh.position.set(u, y, v * mirror);
    mesh.rotation.y = mirror > 0 ? turn : Math.PI - turn;
    mesh.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    group.add(mesh);
    return mesh;
  }
  function finish() {
    for (const { geometry, mat, entries } of batches.values()) {
      const mesh = new THREE.InstancedMesh(geometry, mat, entries.length);
      entries.forEach(([u, y, v, w, h, d, c, turn], i) => {
        dummy.position.set(u, y, v);
        dummy.rotation.y = turn;
        dummy.scale.set(w, h, d);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, color.set(c));
      });
      mesh.castShadow = mat !== glow;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    if (paintDetails.length) {
      const markings = new THREE.Mesh(mergeGeometries(paintDetails), paint);
      markings.receiveShadow = true;
      group.add(markings);
      paintDetails.forEach(g => g.dispose());
    }
  }
  return { group, box, post, solid, mark, sign, install, finish, glow, glass, ground(u, v) {
    return world.ground(...sitePosition(site, u, v)) - site.y + 0.05;
  }, setTime(e) {
    pavement.roughness = THREE.MathUtils.lerp(0.91, 0.42, e.wet);
    glow.emissiveIntensity = 0.15 + e.night * 2.1;
    for (const mat of emitters) mat.emissiveIntensity = 0.16 + e.night * 0.85;
  } };
}

export async function buildFuelStation(scene, city, world, site) {
  const S = makeSite(scene, city, world, site);
  const cream = 0xd7d6cc, navy = 0x18343a, amber = 0xc89543;
  const branding = (ctx, w, h) => {
    ctx.fillStyle = '#18343a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e7b562'; ctx.fillRect(0, h - 20, w, 20);
    ctx.fillStyle = '#f6efdf'; ctx.font = '700 92px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('VALLEY FUEL', w / 2, h * 0.62);
  };
  const [station, cover, pump] = await Promise.all(['shop', 'canopy', 'pump'].map(async id => {
    try { return (await loadGLB('/evermile/assets/models/prop-' + id + '.glb')).scene; }
    catch (e) { console.warn('Fuel station model unavailable:', id, e); return null; }
  }));
  const slab = S.ground(0, 0);
  S.box(0, slab + 0.09, -3, 19, 0.15, 11, 0x99998a);
  for (const u of [-8.5, 8.5]) {
    S.post(u, slab + 2.47, -3, 0.28, 4.8, cream, true);
    S.box(u, slab + 0.31, -3, 0.65, 0.62, 1.25, navy);
  }
  if (cover) S.install(cover, 0, slab + 4.7, -3, Math.PI);
  S.box(0, slab + 5.08, -3, 20.3, 0.64, 12.3, navy);
  S.box(0, slab + 4.76, -9.18, 20.4, 0.11, 0.09, amber);
  S.sign(0, slab + 5.09, -9.24, 9, 0.63, Math.PI, branding, true);
  for (const u of [-6.3, 0, 6.3]) {
    S.box(u, slab + 0.12, -3, 1.7, 0.23, 2.45, 0x9f9e91);
    if (pump) S.install(pump, u, slab + 0.22, -3, Math.PI);
    else S.box(u, slab + 1.1, -3, 0.76, 1.8, 0.53, navy);
    S.solid(u, -3, 1.0, 1.7);
    S.box(u, slab + 4.73, -5.5, 1.3, 0.055, 0.42, 0xfff6da, { mat: S.glow });
    for (const v of [-4.4, -1.6]) S.post(u, slab + 0.36, v, 0.075, 0.72, amber);
    S.mark(u - 1.5, -3, 0.09, 6, 0xc9a947);
    S.mark(u + 1.5, -3, 0.09, 6, 0xc9a947);
  }
  const shopY = S.ground(0, 12);
  if (station) {
    // The converted model has its display glazing and public entrance on +Z.
    station.traverse(o => {
      if (o.isMesh && o.material.name === '6twelve.001') o.visible = false;
    });
    const market = S.install(station, 0, shopY, 14.8, Math.PI);
    market.scale.set(1.33, 1.13, 1.0);
    S.solid(0, 14.8, 11, 9.6);
  } else {
    S.box(0, shopY + 1.8, 13, 9, 3.6, 6, cream, { hard: true });
    S.box(0, shopY + 1.85, 9.96, 6.5, 2.65, 0.1, 0xffffff, { mat: S.glass });
  }
  S.sign(0, shopY + 3.12, station ? 9.87 : 9.88, station ? 11.25 : 6.8, 0.79, Math.PI, (ctx, w, h) => {
    ctx.fillStyle = '#18343a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f5efde'; ctx.textAlign = 'center'; ctx.font = '700 104px sans-serif';
    ctx.fillText('MARKET', w / 2, h * 0.66);
  }, true);
  const sy = S.ground(14.5, -16);
  S.box(14.5, sy + 2.8, -16, 0.2, 5.6, 0.35, navy, { hard: true });
  for (const u of [-10, 10]) S.box(u, slab + 0.085, 8, 0.2, 0.16, 12, 0x929589);
  S.box(14.5, sy + 4.3, -16, 3.1, 2.65, 0.24, navy);
  const prices = (ctx, w, h) => {
    ctx.fillStyle = '#18343a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#eee0bd'; ctx.font = '700 52px sans-serif'; ctx.fillText('VALLEY FUEL', 40, 62);
    ctx.fillStyle = '#121d23'; ctx.fillRect(36, 89, w - 72, h - 110);
    ctx.fillStyle = '#edba78'; ctx.font = '700 53px monospace';
    ctx.fillText('REGULAR        3.48', 56, 145);
    ctx.fillText('DIESEL         3.81', 56, 207);
  };
  S.sign(14.5, sy + 4.3, -16.13, 3.05, 2.6, Math.PI, prices, true);
  S.sign(14.5, sy + 4.3, -15.87, 3.05, 2.6, 0, prices, true);
  S.finish();
  return S.setTime;
}

function parkedPlane(scene, site, u, v, turn, accent) {
  const plane = new THREE.Group();
  plane.position.set(u, site.ground(u, v) + 0.06, v);
  plane.rotation.y = turn;
  scene.add(plane);
  const white = new THREE.MeshStandardMaterial({ color: 0xe2e6e5, metalness: 0.25, roughness: 0.32 });
  const tinted = new THREE.MeshStandardMaterial({ color: 0x172c34, metalness: 0.46, roughness: 0.15 });
  const stripe = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.24, roughness: 0.45 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1d1c, roughness: 0.8 });
  const hub = new THREE.MeshStandardMaterial({ color: 0xacaea9, metalness: 0.52, roughness: 0.36 });
  function mesh(g, mat, x, y, z) {
    const o = new THREE.Mesh(g, mat);
    o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; plane.add(o);
    return o;
  }
  function wing(points, thickness, x, y, z, upright = false) {
    const path = new THREE.Shape(points.map(([a, b]) => new THREE.Vector2(a, b)));
    const g = new THREE.ExtrudeGeometry(path, { depth: thickness, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.045, bevelSegments: 1, steps: 1 });
    if (!upright) g.rotateX(Math.PI / 2);
    else g.rotateY(-Math.PI / 2);
    mesh(g, white, x, y, z);
  }
  const cross = [new THREE.Vector2(0, -4.1), new THREE.Vector2(0.12, -3.95), new THREE.Vector2(0.42, -1.7), new THREE.Vector2(0.68, -0.3), new THREE.Vector2(0.69, 1.24), new THREE.Vector2(0.55, 2.5), new THREE.Vector2(0.39, 3.13), new THREE.Vector2(0.22, 3.35), new THREE.Vector2(0, 3.42)];
  mesh(new THREE.LatheGeometry(cross, 20).rotateX(Math.PI / 2), white, 0, 1.42, 0);
  mesh(new THREE.SphereGeometry(1, 20, 12).scale(0.55, 0.34, 1.1), tinted, 0, 1.95, 0.67);
  wing([[-5.2, 0], [-5.2, 0.64], [-0.5, 1.24], [0.5, 1.24], [5.2, 0.64], [5.2, 0], [0, -0.54]], 0.11, 0, 1.33, 0.1);
  wing([[-1.65, 0], [-1.65, 0.38], [0, 0.78], [1.65, 0.38], [1.65, 0], [0, -0.2]], 0.07, 0, 1.53, -3.2);
  wing([[-0.48, 0], [0.65, 0], [0.09, 1.68], [-0.29, 1.68]], 0.09, 0, 1.54, -3.27, true);
  for (const x of [-1.13, 1.13, 0]) {
    const z = x === 0 ? 2.3 : -0.25;
    mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.15, 14).rotateZ(Math.PI / 2), rubber, x, 0.23, z);
    const start = new THREE.Vector3(x, 0.28, z), end = new THREE.Vector3(x * 0.4, 1.36, z);
    const leg = mesh(new THREE.CylinderGeometry(0.037, 0.045, start.distanceTo(end), 8), hub, ...start.clone().lerp(end, 0.5).toArray());
    leg.quaternion.setFromUnitVectors(UP, end.sub(start).normalize());
  }
  for (const e of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.04, 0.12, 2.26), stripe, e * 0.581, 1.46, 0.12);
    mesh(new THREE.SphereGeometry(0.08, 10, 8), stripe, e * 5.16, 1.41, -0.08);
  }
  mesh(new THREE.CylinderGeometry(0.13, 0.24, 0.36, 14).rotateX(Math.PI / 2), hub, 0, 1.42, 3.59);
  mesh(new THREE.BoxGeometry(0.11, 1.77, 0.09), rubber, 0, 1.42, 3.49).rotation.z = turn + 0.7;
}

export function buildAirfield(scene, city, world, site) {
  const A = makeSite(scene, city, world, site);
  const white = 0xd6d5c4, slate = 0x485456, light = 0xa9ad9f, ochre = 0xb19046;
  for (let n = -255; n <= 255; n += 19) A.mark(n, 36, 10, 0.29, white);
  for (const e of [-1, 1]) {
    A.mark(0, 36 + e * 10.45, 624, 0.20, white);
    for (let i = 0; i < 4; i++) {
      const d = 1.4 + i * 2.17;
      A.mark(e * 304.8, 36 - d, 12.5, 0.72, white);
      A.mark(e * 304.8, 36 + d, 12.5, 0.72, white);
    }
    for (let u = -301; u < 309; u += 22) {
      const v = site.runway.v + e * (site.runway.width / 2 + 0.4);
      A.box(u, A.ground(u, v) + 0.085, v, 0.16, 0.19, 0.16, white, { mat: A.glow });
    }
  }
  const runwayNumber = (number, u, turn) => {
    const map = signTexture(256, 256, (ctx, w, h) => {
      ctx.font = '700 132px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#e8dfc6'; ctx.fillText(number, w / 2, h * 0.68);
    });
    const mat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.45, roughness: 0.94, polygonOffset: true, polygonOffsetFactor: -2 });
    const g = new THREE.PlaneGeometry(7.5, 6).rotateX(-Math.PI / 2).rotateY(turn);
    const m = new THREE.Mesh(g, mat);
    m.position.set(u, A.ground(u, 36) + 0.023, 36);
    A.group.add(m);
  };
  runwayNumber('09', -286, -Math.PI / 2);
  runwayNumber('27', 286, Math.PI / 2);
  A.mark(0, 0, 440, 0.15, ochre);
  for (const u of [-215, 28, 215]) {
    A.mark(u, 15, 0.15, 29, ochre);
    for (const delta of [-0.66, -0.31, 0.31, 0.66]) A.mark(u, 20 + delta, 6.7, 0.14, ochre);
  }
  for (let v = -218; v < -91; v += 9) A.mark(0, v, 0.11, 4.5, ochre);
  for (const v of [-84, -70]) for (let u = -43; u < 46; u += 2.9) {
    if (Math.abs(u) < 7.5) continue;
    A.mark(u, v, 0.10, 5.2, white);
  }
  for (const u of [-17, 3, 23, 43, 63]) {
    A.mark(u, -31, 0.16, 11, ochre);
    A.mark(u, -36.5, 8, 0.14, ochre);
  }

  // Low terminal with a sheltered arrivals forecourt and a smaller operations tower.
  const terminalU = -27, terminalV = -58;
  A.box(terminalU, 2.42, terminalV, 35, 4.8, 10, slate, { hard: true });
  A.box(terminalU, 4.84, terminalV, 36, 0.75, 11, light);
  A.box(terminalU, 0.36, -63.14, 34.9, 0.6, 0.28, light);
  A.box(terminalU, 1.22, -63.17, 34.9, 0.08, 0.18, slate);
  for (const u of [-41, -35, -20, -13]) {
    A.box(u, 0.35, -65.3, 2.25, 0.48, 0.52, 0x73766e);
    A.box(u, 0.63, -65.3, 2.25, 0.09, 0.56, 0x534c41);
  }
  A.box(terminalU, 3.65, -65.1, 33, 0.23, 4.5, slate);
  for (let i = -7; i <= 7; i++) {
    const u = terminalU + i * 2.16;
    A.box(u, 1.92, -63.07, 1.98, 2.9, 0.12, 0xffffff, { mat: A.glass });
    A.box(u, 1.15, -52.91, 1.98, 1.6, 0.12, 0xffffff, { mat: A.glass });
    A.box(u, 3.51, -66.05, 0.84, 0.06, 0.22, 0xfff3dc, { mat: A.glow });
  }
  for (const u of [-41, -34.5, -18, -11]) A.post(u, 1.83, -67.01, 0.11, 3.62, slate, true);
  A.sign(terminalU, 4.48, -63.56, 22.4, 1.1, Math.PI, (c, w, h) => {
    c.fillStyle = '#485456'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#eee9d4'; c.font = '700 76px sans-serif'; c.textAlign = 'center';
    c.fillText('PORT AURORA AIRFIELD', w / 2, h * 0.67);
  }, true);
  A.box(-54, 4.8, -56, 5.4, 9.6, 5.4, 0x797f75, { hard: true });
  A.box(-54, 9.5, -56, 7.35, 0.45, 7.35, slate);
  A.box(-54, 10.68, -56, 6.72, 1.95, 6.72, 0xffffff, { mat: A.glass });
  A.box(-54, 11.77, -56, 7.47, 0.45, 7.47, slate);
  A.post(-54, 12.97, -56, 0.055, 2.2, slate);
  A.box(-54, 14.09, -56, 0.16, 0.17, 0.16, 0xdd6e4c, { mat: A.glow });

  for (const u of [47, 77]) {
    A.box(u, 3.2, -58, 27.8, 6.4, 15, 0x969d98, { hard: true });
    const roof = new THREE.BufferGeometry();
    roof.setAttribute('position', new THREE.Float32BufferAttribute([
      u - 14.3, 6.37, -66, u - 14.3, 7.95, -58, u - 14.3, 6.37, -50,
      u + 14.3, 6.37, -66, u + 14.3, 7.95, -58, u + 14.3, 6.37, -50
    ], 3));
    roof.setIndex([0, 1, 3, 3, 1, 4, 1, 2, 4, 4, 2, 5, 0, 2, 1, 3, 4, 5]);
    roof.computeVertexNormals();
    const roofMesh = new THREE.Mesh(roof, new THREE.MeshStandardMaterial({ color: slate, roughness: 0.68, metalness: 0.15, side: THREE.DoubleSide }));
    roofMesh.castShadow = true;
    A.group.add(roofMesh);
    A.box(u, 2.87, -50.41, 23.8, 5.2, 0.12, slate);
    for (let k = -11; k < 12; k += 1.13) {
      A.box(u + k, 2.89, -50.30, 0.07, 5.1, 0.14, 0x667476);
    }
    for (const d of [-10.5, 10.5]) {
      A.box(u + d, 5.55, -50.32, 0.6, 0.12, 0.22, white, { mat: A.glow });
    }
  }
  for (const u of [-43, -12, 14, 43]) {
    A.post(u, 3.3, -86.5, 0.10, 6.6, slate, true);
    A.box(u, 6.56, -85.85, 0.32, 0.14, 1.31, slate);
    A.box(u, 6.47, -85.47, 0.21, 0.06, 0.46, white, { mat: A.glow });
  }
  for (const [u, v, turn, c] of [[-14, -27, 0, 0x2f5678], [31, -26, 0, 0xb54430], [58, -33, 0, 0x48776a]]) {
    parkedPlane(A.group, A, u, v, turn, c);
    A.solid(u, v, 1.6, 7.5);
    A.solid(u, v + 0.25, 10.25, 0.8);
  }
  // The public road and runway remain open. Low access fencing separates parking from the apron.
  for (const begin of [-88, 9]) {
    for (let u = begin; u < begin + 70; u += 3.5) {
      A.post(u, 0.8, -64.7, 0.045, 1.63, slate, true);
      A.box(u + 1.7, 1.57, -64.7, 3.4, 0.04, 0.043, slate);
      A.box(u + 1.7, 0.52, -64.7, 3.4, 0.03, 0.035, slate);
    }
  }
  A.finish();
  return A.setTime;
}
