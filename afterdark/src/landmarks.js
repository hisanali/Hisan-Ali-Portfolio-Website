import * as THREE from '/evermile/vendor/three.module.js';
import { loadGLB } from './car.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';

const ASPHALT = '/evermile/assets/materials/asphalt_03_diff_1k.jpg';
const UP = new THREE.Vector3(0, 1, 0);

export function planAirfield(samples) {
  const entrance = samples.filter(s => s.road === 'coast' && s.z < -1320 && !s.bridge && !s.tunnel)
    .reduce((best, s) => Math.abs(s.x - 930) < Math.abs(best.x - 930) ? s : best);
  const runway = { u: -100, v: 36, length: 600, width: 23 };
  const pad = { west: -421, east: 221 };
  const site = {
    key: 'airport', name: 'Port Aurora Airfield', x: entrance.x, z: entrance.z + 236,
    y: Math.max(3, entrance.y), ux: 1, uz: 0, vx: 0, vz: 1, r: 225, road: entrance, runway, pad,
    paving: [
      [runway.u, runway.v, runway.length, runway.width],
      [0, 0, 440, 8],        // Parallel taxiway
      [-215, 18, 8, 36], [173, 18, 8, 36], [28, 18, 12, 36],
      [22, -26, 133, 50],    // Apron
      [0, -77, 96, 22],      // Public parking
      [0, -158, 11, 147]     // Access from the coast road
    ]
  };
  site.arrival = { x: site.x, z: site.z - 78, y: site.y, name: site.name };
  site.contains = (x, z, margin = 0) => {
    const u = x - site.x, v = z - site.z;
    return (u > pad.west - margin && u < pad.east + margin && v > -97 - margin && v < 81 + margin)
      || (Math.abs(u) < 16 + margin && v > -232 - margin && v <= -97);
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
  function solid(u, v, w, d, turn = 0) {
    const [x, z] = sitePosition(site, u, v), cs = Math.cos(turn), sn = Math.sin(turn);
    city.colliders.push({ x, z, w, d, ux: site.ux * cs - site.vx * sn, uz: site.uz * cs - site.vz * sn, kind: site.key });
  }
  function box(u, y, v, w, h, d, c, opts = {}) {
    add(cube, opts.mat || standard, u, y, v, w, h, d, c, opts.turn || 0);
    if (opts.hard) solid(u, v, w, d, opts.turn);
  }
  function post(u, y, v, radius, height, c, hard = false) {
    add(cylinder, standard, u, y, v, radius, height, radius, c, 0);
    if (hard) {
      const [x, z] = sitePosition(site, u, v);
      city.colliders.push({ x, z, r: radius, kind: site.key });
    }
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
  const mark = (u, v, w, d, c = 0xd6d2b7, offset = 0.123) => patch(u, v, w, d, offset, paint, 2, c);

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
  function light(u, y, v, c, distance, angle) {
    const node = new THREE.SpotLight(c, 0, distance, angle, 0.65, 2);
    node.position.set(u, y, v * mirror);
    node.target.position.set(u, 0, v * mirror);
    group.add(node, node.target);
    return node;
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
  return { group, box, post, solid, mark, patch, sign, install, light, finish, glow, glass, ground(u, v) {
    return world.ground(...sitePosition(site, u, v)) - site.y + 0.05;
  }, setTime(e) {
    pavement.roughness = THREE.MathUtils.lerp(0.91, 0.42, e.wet);
    glow.emissiveIntensity = 0.15 + e.night * 2.1;
    for (const mat of emitters) mat.emissiveIntensity = 0.16 + e.night * 0.85;
  } };
}

export async function buildFuelStation(scene, city, world, site) {
  const S = makeSite(scene, city, world, site);
  const cream = 0xd0c7b6, navy = 0x193638, amber = 0xc8944a, concrete = 0x8a8580;
  const assets = ['shop', 'canopy', 'pump', 'ice', 'bin'];
  const [station, cover, pump, ice, bin] = await Promise.all(assets.map(async id => {
    try { return (await loadGLB('/evermile/assets/models/prop-' + id + '.glb')).scene; }
    catch (e) { console.warn('Fuel station model unavailable:', id, e.message); return null; }
  }));

  const wordmark = (text, secondary) => (ctx, w, h) => {
    ctx.fillStyle = '#193638'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#dfaa61'; ctx.fillRect(0, h - 16, w, 16);
    ctx.fillStyle = '#f3eddf'; ctx.textAlign = 'center';
    ctx.font = '700 96px sans-serif'; ctx.fillText(text, w / 2, secondary ? h * 0.51 : h * 0.65);
    if (secondary) {
      ctx.font = '600 33px sans-serif';
      ctx.fillText(secondary, w / 2, h * 0.78);
    }
  };

  const y = S.ground(0, -3), canopy = y + 4.68;
  const concreteMaterial = new THREE.MeshStandardMaterial({ color: concrete, roughness: 0.81, envMapIntensity: 0.44 });
  const floorTexture = signTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#a5a09a'; ctx.fillRect(0, 0, w, h);
    const noise = ctx.getImageData(0, 0, w, h);
    let seed = 721;
    for (let i = 0; i < noise.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const n = (seed / 4294967296 - 0.5) * 26;
      for (let k = 0; k < 3; k++) noise.data[i + k] += n;
    }
    ctx.putImageData(noise, 0, 0);
    for (const [x, z] of [[56, 74], [204, 180], [180, 54]]) {
      const g = ctx.createRadialGradient(x, z, 2, x, z, 34);
      g.addColorStop(0, 'rgba(39,36,31,.27)'); g.addColorStop(1, 'rgba(39,36,31,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 34, z - 34, 68, 68);
    }
  });
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  concreteMaterial.map = floorTexture;
  S.patch(0, -3, 20.1, 12.3, 0.142, concreteMaterial, 1.1);
  S.patch(0, 8.9, 15.7, 2.6, 0.142, concreteMaterial, 1.1);
  S.patch(0, -10, 21, 0.26, 0.085, new THREE.MeshStandardMaterial({ color: 0x272a2a, metalness: 0.53, roughness: 0.64 }), 3);
  for (const u of [-7.5, -2.5, 2.5, 7.5]) S.mark(u, -3, 0.024, 12.25, 0x726e65, 0.175);
  for (const v of [-6.01, 0.03, 3.08]) S.mark(0, v, 20.0, 0.024, 0x726e65, 0.175);

  for (const u of [-8.3, 8.3]) for (const v of [-5.9, -0.07]) {
    S.box(u, y + 2.39, v, 0.43, 4.7, 0.46, cream, { hard: true });
    S.box(u, y + 0.33, v, 0.63, 0.58, 0.67, navy, { hard: true });
  }
  if (cover) S.install(cover, 0, canopy - 0.08, -3, Math.PI);
  S.box(0, canopy + 0.35, -3, 20.4, 0.66, 12.3, navy);
  for (const v of [-9.17, 3.17]) {
    S.box(0, canopy + 0.12, v, 20.43, 0.085, 0.08, amber);
    S.sign(0, canopy + 0.40, v + Math.sign(v) * 0.045, 8.8, 0.51, v < 0 ? Math.PI : 0, wordmark('VALLEY FUEL'), true);
  }

  const lights = [];
  for (const [i, u] of [-6, 0, 6].entries()) {
    S.box(u, y + 0.142, -3, 1.28, 0.22, 2.7, 0x99948c);
    S.box(u, y + 0.24, -3, 1.22, 0.05, 2.65, navy);
    if (pump) S.install(pump, u, y + 0.266, -3, Math.PI);
    else S.box(u, y + 1.14, -3, 0.68, 1.75, 0.61, navy);
    S.solid(u, -3, 1.15, 2.56);
    for (const v of [-4.4, -1.6]) {
      S.post(u, y + 0.52, v, 0.09, 0.98, amber, true);
      S.post(u, y + 0.86, v, 0.096, 0.13, navy);
    }
    for (const v of [-6.55, 0.5]) S.box(u, canopy - 0.13, v, 1.32, 0.057, 0.42, 0xf2e7d4, { mat: S.glow });
    lights.push([S.light(u, canopy - 0.17, -3, 0xfff6ea, 18, 1.05), 610]);
    S.sign(u, canopy - 0.43, -7.6, 0.45, 0.37, Math.PI, wordmark(String(i + 1)), true);
    for (const e of [-1, 1]) {
      S.mark(u + e * 1.32, -3, 0.052, 5.8, 0xc0a46a, 0.175);
      S.mark(u + e * 1.32, -7, 0.052, 1.3, 0xc0a46a, 0.175);
    }
  }

  const shopV = 14.7, shopY = S.ground(0, shopV);
  if (station) {
    station.traverse(o => { if (o.isMesh && o.material.name === '6twelve.001') o.visible = false; });
    const market = S.install(station, 0, shopY, shopV, Math.PI);
    market.scale.set(1.49, 1.12, 1.0);
    S.solid(0, shopV, 13.85, 10.4);
  } else {
    S.box(0, shopY + 1.78, shopV, 13.85, 3.56, 10.4, cream, { hard: true });
    S.box(0, shopY + 1.71, shopV - 5.21, 10.4, 2.38, 0.1, 0xffffff, { mat: S.glass });
  }
  S.box(0, shopY + 3.24, 9.34, 14.05, 0.22, 1.81, navy);
  S.box(0, shopY + 3.33, 8.4, 14.05, 0.35, 0.13, navy);
  S.sign(0, shopY + 3.34, 8.32, 5.2, 0.54, Math.PI, wordmark('MARKET'), true);
  S.box(0, shopY + 2.73, 8.9, 2.8, 0.075, 0.25, 0xffeed4, { mat: S.glow });
  lights.push([S.light(0, shopY + 3.26, 8.0, 0xffdfa6, 11, 0.98), 275]);
  for (const u of [-5.7, 5.7]) S.post(u, shopY + 0.46, 8.23, 0.09, 0.85, amber, true);

  if (ice) {
    S.install(ice, -7.1, S.ground(-7.1, 10.3), 10.3, Math.PI).scale.setScalar(0.72);
    S.solid(-7.1, 10.3, 1.36, 0.61);
  }
  if (bin) {
    S.install(bin, 12.5, S.ground(12.5, 16), 16, 0);
    S.solid(12.5, 16, 2.15, 1.53);
  }

  // Painted parking bays sit outside the pump approaches, with wheel stops at the storefront.
  for (const u of [-14.9, -11.6, -8.3, 8.3, 11.6, 14.9]) {
    S.mark(u, 6.0, 0.095, 4.5);
    S.mark(u, 6.0, 0.55, 0.085);
  }
  for (const u of [-13.25, -9.95, 9.95, 13.25]) S.box(u, S.ground(u, 8.19) + 0.06, 8.19, 1.45, 0.12, 0.18, 0x8a8069);
  for (const u of [-16.7, 16.7]) {
    S.box(u, S.ground(u, 1.3) + 0.032, 1.3, 0.21, 0.13, 22, concrete);
    for (const v of [-8.5, 7.3, 11.2]) {
      const ground = S.ground(u, v);
      S.box(u, ground + 0.14, v, 0.86, 0.28, 1.65, 0x6c6250, { hard: true });
      S.box(u, ground + 0.30, v, 0.64, 0.055, 1.4, 0x626745);
    }
  }
  for (const e of [-1, 1]) S.mark(e * 5.1, -25, 0.10, 9.7);
  for (const [u, v] of [[-2.65, -29.4], [2.65, -21]]) S.mark(u, v, 4.4, 0.19, 0xc9c6b6);
  for (let j = 0; j < 4; j++) S.mark(0, -28 + j * 2.1, 0.085, 1.05, 0xc3ad73);

  const entry = S.ground(6.8, -17.4);
  S.post(6.8, entry + 2.9, -17.4, 0.09, 5.8, navy, true);
  S.box(6.4, entry + 5.78, -17.4, 0.92, 0.1, 0.27, navy);
  S.box(6.15, entry + 5.7, -17.4, 0.31, 0.05, 0.22, 0xfff6e6, { mat: S.glow });
  lights.push([S.light(6.15, entry + 5.63, -17.4, 0xffe9c8, 18, 0.91), 525]);
  const sy = S.ground(14.5, -16);
  S.box(14.5, sy + 2.8, -16, 0.28, 5.6, 0.38, navy, { hard: true });
  S.box(14.5, sy + 4.3, -16, 3.1, 2.65, 0.24, navy);
  const prices = (ctx, w, h) => {
    ctx.fillStyle = '#193638'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#eee0bd'; ctx.font = '700 49px sans-serif'; ctx.fillText('VALLEY FUEL', 46, 57);
    ctx.fillStyle = '#142021'; ctx.fillRect(36, 77, w - 72, h - 96);
    ['REGULAR', 'PREMIUM', 'DIESEL'].forEach((label, i) => {
      ctx.fillStyle = '#e8e2d4'; ctx.font = '600 36px sans-serif'; ctx.fillText(label, 58, 123 + i * 48);
      ctx.fillStyle = '#efbd79'; ctx.font = '700 43px monospace'; ctx.fillText(['3.48', '3.79', '3.81'][i], w - 260, 123 + i * 48);
    });
  };
  S.sign(14.5, sy + 4.3, -16.13, 3.05, 2.6, Math.PI, prices, true);
  S.sign(14.5, sy + 4.3, -15.87, 3.05, 2.6, 0, prices, true);
  S.finish();

  return env => {
    S.setTime(env);
    concreteMaterial.roughness = 0.81 - env.wet * 0.38;
    for (const [light, power] of lights) {
      light.visible = env.night > 0.06;
      light.intensity = power * env.night;
    }
  };
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
  const runway = site.runway, half = runway.length / 2;
  const line = (u, v, w, d) => A.mark(runway.u + u, runway.v + v, w, d, white);
  for (let n = -half + 58; n < half - 58; n += 19) line(n, 0, 10, 0.29);
  for (const e of [-1, 1]) {
    line(0, e * (runway.width / 2 - 1.05), runway.length - 6, 0.20);
    for (let i = 0; i < 4; i++) {
      const d = 1.4 + i * 2.17;
      line(e * (half - 10.2), -d, 12.5, 0.72);
      line(e * (half - 10.2), d, 12.5, 0.72);
    }
    for (let u = runway.u - half + 12; u < runway.u + half; u += 22) {
      const v = runway.v + e * (runway.width / 2 + 0.4);
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
    m.position.set(u, A.ground(u, runway.v) + 0.073, runway.v);
    A.group.add(m);
  };
  runwayNumber('09', runway.u - half + 29, -Math.PI / 2);
  runwayNumber('27', runway.u + half - 29, Math.PI / 2);
  A.mark(0, 0, 440, 0.15, ochre);
  for (const u of [-215, 28, 173]) {
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
    A.solid(begin + 35, -64.7, 70, 0.12);
    for (let u = begin; u < begin + 70; u += 3.5) {
      A.post(u, 0.8, -64.7, 0.045, 1.63, slate, true);
      A.box(u + 1.7, 1.57, -64.7, 3.4, 0.04, 0.043, slate);
      A.box(u + 1.7, 0.52, -64.7, 3.4, 0.03, 0.035, slate);
    }
  }
  A.finish();
  return A.setTime;
}
