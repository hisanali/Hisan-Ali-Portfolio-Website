// Life on the street: trees, the elevated train, steam rising from the road and people on the pavements.
import * as THREE from '/evermile/vendor/three.module.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from '/evermile/vendor/utils/SkeletonUtils.js';
import { P, ROADS, HALF, SW, SPAN, rng, splitChunks } from './city.js';
import { loadGLB } from './car.js';

const dummy = new THREE.Object3D(), col = new THREE.Color();
function tex(size, draw, srgb = true) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

export function buildStreet(scene, city, R3, Q) {
  const SH = true; let env = { night: 0, rain: 0 };
  const R = rng(4242), street = { people: [], update: () => {} };

  // Each street tree carries offset groups of leaf sprays on separate branches.
  const leaf = tex(256, (c, size) => {
    const random = rng(9);
    for (let i = 0; i < 98; i++) {
      const distance = random(), side = i % 2 ? -1 : 1;
      const x = size / 2 + side * (random() * 82 + 5) * Math.sin(distance * Math.PI);
      const y = 15 + distance * 226, length = 7 + random() * 14;
      const tone = 76 + random() * 79;
      c.save();
      c.translate(x, y);
      c.rotate(side * (0.45 + random() * 0.9));
      const shade = c.createLinearGradient(-length, 0, length, 0);
      shade.addColorStop(0, `rgb(${tone * 0.56 | 0},${tone * 0.76 | 0},${tone * 0.33 | 0})`);
      shade.addColorStop(1, `rgb(${tone * 0.7 | 0},${tone | 0},${tone * 0.45 | 0})`);
      c.fillStyle = shade;
      c.beginPath();
      c.moveTo(-length, 0);
      c.quadraticCurveTo(0, -length * 0.73, length, 0);
      c.quadraticCurveTo(0, length * 0.63, -length, 0);
      c.fill();
      c.restore();
    }
  });
  leaf.wrapS = leaf.wrapT = THREE.ClampToEdgeWrapping;
  const loader = new THREE.TextureLoader();
  const bark = loader.load('/evermile/assets/materials/bark_brown_02_diff_1k.jpg');
  bark.colorSpace = THREE.SRGBColorSpace; bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
  bark.repeat.set(1, 2.4); bark.anisotropy = 8;
  const barkMaterial = new THREE.MeshStandardMaterial({ map: bark, color: 0xc3b8a6, roughness: 0.91, envMapIntensity: 0.38 });
  const wind = { value: 0 };
  function sway(material, amplitude) {
    material.customProgramCacheKey = () => 'street-wind-' + amplitude;
    material.onBeforeCompile = shader => {
      shader.uniforms.uStreetWind = wind;
      shader.vertexShader = 'uniform float uStreetWind;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float windPhase = instanceMatrix[3].x * 0.031 + instanceMatrix[3].z * 0.022;
        float tip = smoothstep(3.2, 10.0, position.y);
        transformed.x += sin(uStreetWind * 1.2 + windPhase + position.y) * tip * ${amplitude};
        transformed.z += cos(uStreetWind * 0.7 + windPhase) * tip * ${amplitude * 0.6};
      `);
    };
    return material;
  }
  const cards = [], foliageRandom = rng(55);
  const trunkParts = [new THREE.CylinderGeometry(0.115, 0.25, 4.5, 8).translate(0, 2.25, 0)];
  for (let branch = 0; branch < 8; branch++) {
    const angle = branch * 2.39996, spread = 1.15 + foliageRandom() * 1.18;
    const crown = new THREE.Vector3(Math.cos(angle) * spread, 5.3 + foliageRandom() * 1.85, Math.sin(angle) * spread);
    const start = new THREE.Vector3(0, 2.85 + foliageRandom(), 0);
    const twig = new THREE.CylinderGeometry(0.026, 0.094, crown.distanceTo(start), 6);
    twig.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), crown.clone().sub(start).normalize()));
    twig.translate(...start.clone().lerp(crown, 0.5).toArray());
    trunkParts.push(twig);
    for (let k = 0; k < 17; k++) {
      const u = foliageRandom() * 2 - 1, a = foliageRandom() * Math.PI * 2, radius = 0.42 + foliageRandom() * 1.08;
      const sq = Math.sqrt(1 - u * u);
      const center = new THREE.Vector3(sq * Math.cos(a) * radius, u * radius * 0.72, sq * Math.sin(a) * radius).add(crown);
      const size = 0.88 + foliageRandom() * 0.77;
      const card = new THREE.PlaneGeometry(size, size * 0.97);
      card.rotateX(-0.35 - foliageRandom() * 1.7);
      card.rotateY(a);
      card.translate(...center.toArray());
      const normal = center.clone().sub(crown).normalize();
      normal.y = Math.max(0.16, normal.y + 0.44);
      normal.normalize();
      for (let i = 0; i < card.attributes.normal.count; i++) card.attributes.normal.setXYZ(i, ...normal.toArray());
      cards.push(card);
    }
  }
  const crownG = mergeGeometries(cards), trunkG = mergeGeometries(trunkParts);
  const spots = [], palmSpots = [], later = [];
  for (let r = 0; r < ROADS; r++) for (const ax of [0, 1]) for (const side of [-1, 1]) for (let s = 22.5; s < SPAN; s += 15) {
    if (Math.abs(s - Math.round(s / P) * P) < 21 || R() < 0.22) continue; if (ax === 1 && r * P === city.viaduct) continue;
    const lat = r * P + side * (HALF + 1.45), spot = { x: ax ? lat : s, z: ax ? s : lat, sc: 0.85 + R() * 0.45, rot: R() * 6.28, lit: R() < 0.16 };
    if (ax === 0 || (r === 0 && side < 0)) palmSpots.push(spot); else spots.push(spot); }
  for (let z = -40; z < SPAN + 40; z += 11) for (const lx of [-(HALF + 5.5), -(HALF + 11.3)]) palmSpots.push({ x: lx + (R() - 0.5), z: z + (lx < -18 ? 5.5 : 0) + (R() - 0.5) * 2, sc: 0.9 + R() * 0.4, rot: R() * 6.28 });
  // Layered palm crowns have short upright growth and older fronds that arch down.
  {
    const fr = tex(256, (c, size) => {
      const random = rng(310);
      c.strokeStyle = '#69764a'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(size / 2, size); c.lineTo(size / 2, 5); c.stroke();
      for (let i = 0; i < 36; i++) for (const e of [-1, 1]) {
        const t = (i + random() * 0.55) / 36;
        const y = size - t * (size - 12);
        const width = 113 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 0.84) * (0.72 + random() * 0.3);
        const tone = 71 + random() * 65, lead = 7 + random() * 13;
        c.fillStyle = `rgb(${tone * 0.63 | 0},${tone | 0},${tone * 0.46 | 0})`;
        c.beginPath(); c.moveTo(size / 2, y);
        c.quadraticCurveTo(size / 2 + e * width * 0.64, y - lead * 0.56 - 3, size / 2 + e * width, y - lead);
        c.quadraticCurveTo(size / 2 + e * width * 0.68, y - lead + 4, size / 2, y + 4);
        c.fill();
      }
    });
    fr.wrapS = fr.wrapT = THREE.ClampToEdgeWrapping;
    const fronds = [], random = rng(441);
    for (let k = 0; k < 14; k++) {
      const young = k > 9, len = young ? 2.2 + random() * 1.05 : 3.05 + random() * 1.5;
      const g = new THREE.PlaneGeometry(1.35, 1, 2, 4), p = g.attributes.position;
      const lift = young ? 0.82 + random() * 0.25 : 0.6 + random() * 0.34;
      const bend = young ? 0.35 + random() * 0.12 : 0.64 + random() * 0.47;
      const a = k * 2.39996 + random() * 0.24;
      for (let i = 0; i < p.count; i++) {
        const u = p.getY(i) + 0.5, x = p.getX(i);
        p.setXYZ(i, x * (0.43 + 0.57 * Math.sin(Math.PI * u)), len * (u * lift - u * u * bend) - Math.abs(x) * 0.23, u * len * (young ? 0.51 : 0.95));
      }
      g.rotateY(a);
      g.translate(0.9 + Math.sin(a) * 0.065, 9.0 + random() * 0.16, Math.cos(a) * 0.065);
      fronds.push(g);
    }
    const frondG = mergeGeometries(fronds); frondG.computeVertexNormals();
    const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector3(u * u * 0.9, u * 9.0, 0)); }
    const trunkPG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.2, 5, false); const tp = trunkPG.attributes.position; for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), k = 1.25 - y / 9 * 0.55 + 0.06 * Math.sin(y * 9); const cx = (y / 9) ** 2 * 0.9; tp.setX(i, cx + (tp.getX(i) - cx) * k); tp.setZ(i, tp.getZ(i) * k); } trunkPG.computeVertexNormals();
    const pf = new THREE.InstancedMesh(frondG, new THREE.MeshStandardMaterial({ map: fr, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.55, envMapIntensity: 0.6 }), palmSpots.length), pt = new THREE.InstancedMesh(trunkPG, barkMaterial, palmSpots.length);
    sway(pf.material, 0.19);
    pf.customDepthMaterial = sway(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: fr, alphaTest: 0.35, side: THREE.DoubleSide }), 0.19);
    palmSpots.forEach((t2, k) => { city.colliders.push({ x: t2.x, z: t2.z, r: 0.3 }); dummy.position.set(t2.x, 0.17, t2.z); dummy.rotation.set(0, t2.rot, 0); dummy.scale.set(t2.sc, t2.sc * (0.77 + (k % 7) * 0.066), t2.sc); dummy.updateMatrix(); pf.setMatrixAt(k, dummy.matrix); pf.setColorAt(k, col.setHSL(0.18 + (k % 7) * 0.009, 0.13, 0.59 + (k % 5) * 0.075)); pt.setMatrixAt(k, dummy.matrix); });
    for (const m of [pf, pt]) { m.frustumCulled = false; m.castShadow = (Q.reach || 1) >= 1 || m === pf; m.receiveShadow = SH; scene.add(m); later.push([m, 510]); } }
  dummy.scale.set(1, 1, 1);
  const crownM = new THREE.MeshStandardMaterial({ map: leaf, color: 0xffffff, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.6, metalness: 0, envMapIntensity: 0.45 });
  const crowns = new THREE.InstancedMesh(crownG, crownM, spots.length), trunks = new THREE.InstancedMesh(trunkG, barkMaterial, spots.length);
  const fairy = [], grates = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.03, 1.5), new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.5, metalness: 0.7 }), spots.length);
  spots.forEach((t, k) => { city.colliders.push({ x: t.x, z: t.z, r: 0.26 }); dummy.position.set(t.x, 0.17, t.z); dummy.rotation.set(0, t.rot, 0); dummy.scale.set(t.sc, t.sc, t.sc); dummy.updateMatrix(); crowns.setMatrixAt(k, dummy.matrix); trunks.setMatrixAt(k, dummy.matrix);
    crowns.setColorAt(k, col.setRGB(0.61 + R() * 0.34, 0.63 + R() * 0.24, 0.51 + R() * 0.36)); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.position.y = 0.18; dummy.updateMatrix(); grates.setMatrixAt(k, dummy.matrix);
    if (t.lit) for (let i = 0; i < 46; i++) { const a = R() * 6.28, rr = (0.6 + R() * 1.9) * t.sc, y = (4.2 + R() * 3.4) * t.sc; fairy.push(t.x + Math.cos(a) * rr, 0.17 + y, t.z + Math.sin(a) * rr); } });
  sway(crownM, 0.14);
  crowns.customDepthMaterial = sway(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leaf, alphaTest: 0.45, side: THREE.DoubleSide }), 0.14);
  for (const m of [crowns, trunks, grates]) { m.frustumCulled = false; m.castShadow = SH && m !== grates; m.receiveShadow = SH; scene.add(m); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fairy, 3));
  const fairyPts = new THREE.Points(fg, new THREE.PointsMaterial({ size: 0.42, map: city.dot, color: new THREE.Color(3.2, 2.2, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(fairyPts);

  // ---- Festoon lights strung across the side streets ----
  const fest = [[], []];
  for (let r = 1; r < ROADS - 1; r++) for (let s = 34; s < SPAN - 30; s += 17) { if (Math.abs(s - Math.round(s / P) * P) < 22 || R() < 0.45) continue;
    for (let i = 0; i <= 26; i++) { const u = i / 26, off = (u - 0.5) * (HALF + SW) * 2, y = 9.6 - Math.sin(u * Math.PI) * 2.1; fest[i % 2].push(s + (u - 0.5) * 1.5, y, r * P + off); } }
  const festPts = fest.map((arr, k) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.5, map: city.dot, color: new THREE.Color(k ? 3.0 : 3.2, k ? 2.4 : 1.9, k ? 1.6 : 0.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(p); return p; });

  // ---- The big wheel on the beach, its lights running round the rim and down the spokes ----
  const wheel = new THREE.Group(), WR = 27, WY = 31, wheelX = city.beachX - 34, wheelZ = SPAN * 0.42; let wheelLights = null;
  { const steel = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.4, metalness: 0.7 }), parts = [];
    for (const e of [-1.3, 1.3]) { const rim = new THREE.TorusGeometry(WR, 0.16, 6, 72); rim.rotateY(Math.PI / 2); rim.translate(e, 0, 0); parts.push(rim); const rim2 = new THREE.TorusGeometry(WR * 0.62, 0.1, 5, 60); rim2.rotateY(Math.PI / 2); rim2.translate(e, 0, 0); parts.push(rim2);
      for (let k = 0; k < 16; k++) { const g = new THREE.CylinderGeometry(0.07, 0.07, WR, 5); g.translate(0, WR / 2, 0); g.rotateX(k / 16 * Math.PI * 2); g.translate(e, 0, 0); parts.push(g); } }
    const hub = new THREE.CylinderGeometry(1.1, 1.1, 3.4, 16); hub.rotateZ(Math.PI / 2); parts.push(hub);
    const rimMesh = new THREE.Mesh(mergeGeometries(parts), steel); rimMesh.castShadow = SH; wheel.add(rimMesh);
    const cabM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.2 }); wheel.userData.cabs = [];
    for (let k = 0; k < 16; k++) { const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.3, 2.2), cabM); cab.castShadow = SH; wheel.add(cab); wheel.userData.cabs.push(cab); }
    const lp = [], N = 16; for (let k = 0; k < N; k++) for (let i = 1; i <= 12; i++) { const a = k / N * Math.PI * 2, d = i / 12 * WR; lp.push(1.5, Math.cos(a) * d, Math.sin(a) * d); }
    for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; lp.push(1.5, Math.cos(a) * WR, Math.sin(a) * WR); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lp.length), 3));
    wheelLights = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.5, map: city.dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); wheelLights.frustumCulled = false; wheel.add(wheelLights);
    wheel.position.set(wheelX, WY, wheelZ); scene.add(wheel);
    const legs = []; for (const e of [-2.6, 2.6]) for (const lz of [-13, 13]) { const len = Math.hypot(WY, lz), g2 = new THREE.CylinderGeometry(0.35, 0.5, len, 8); g2.translate(0, len / 2, 0); g2.rotateX(-Math.atan2(lz, WY)); g2.translate(e, 0, lz); legs.push(g2); }
    const base = new THREE.BoxGeometry(9, 0.3, 32); base.translate(0, -0.55, 0); legs.push(base); for (const e of [-2.6, 2.6]) for (const lz of [-13, 13]) city.colliders.push({ x: wheelX + e, z: wheelZ + lz, r: 0.8 });
    const legMesh = new THREE.Mesh(mergeGeometries(legs), new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.45, metalness: 0.6 })); legMesh.position.set(wheelX, -0.2, wheelZ); legMesh.castShadow = SH; scene.add(legMesh); }
  const wc = new THREE.Color();
  function stepWheel(t) { const rot = t * 0.05; wheel.rotation.x = rot; wheel.userData.cabs.forEach((cab, k) => { const a = k / 16 * Math.PI * 2; cab.position.set(0, Math.cos(a) * WR, Math.sin(a) * WR - 0); cab.rotation.x = -rot; cab.position.y -= 0; });
    const ca = wheelLights.geometry.attributes.color, gain = 0.25 + 0.75 * env.night, mode = Math.floor(t / 9) % 3;
    for (let k = 0; k < 16; k++) for (let i = 0; i < 12; i++) { const idx = k * 12 + i; let v, hue;
      if (mode === 0) { v = (Math.sin(i * 0.9 - t * 4) > 0.2 ? 1 : 0.12); hue = (k / 16 + t * 0.05) % 1; } else if (mode === 1) { v = ((k + Math.floor(t * 6)) % 4 === 0 ? 1 : 0.1); hue = (i / 12 * 0.3 + t * 0.08) % 1; } else { v = 0.55 + 0.45 * Math.sin(t * 3 + k); hue = (t * 0.1 + i * 0.02) % 1; }
      wc.setHSL(hue, 1, 0.55); ca.setXYZ(idx, wc.r * v * 2.6 * gain, wc.g * v * 2.6 * gain, wc.b * v * 2.6 * gain); }
    for (let i = 0; i < 120; i++) { const v = (i + Math.floor(t * 20)) % 6 < 3 ? 1 : 0.15; wc.setHSL((i / 120 + t * 0.07) % 1, 1, 0.6); ca.setXYZ(192 + i, wc.r * v * 3 * gain, wc.g * v * 3 * gain, wc.b * v * 3 * gain); }
    ca.needsUpdate = true; }

  // ---- The train on the elevated line ----
  const train = new THREE.Group(); const CARS = 5, CL = 17.5;
  { const body = new THREE.MeshStandardMaterial({ color: 0x8e949c, roughness: 0.32, metalness: 0.85 }), win = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.3, 1.7) }), stripe = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.6, 1.9) });
    for (let k = 0; k < CARS; k++) { const z = -k * (CL + 0.7); const b = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.1, CL), body); b.position.set(0, 12.75, z); train.add(b);
      for (const e of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, CL - 2.2), win); w.position.set(e * 1.47, 13.2, z); train.add(w); const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, CL - 0.4), stripe); st.position.set(e * 1.47, 12.1, z); train.add(st); } }
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.6, 3.8) })); head.position.set(0, 11.9, CL / 2 + 0.03); train.add(head);
    train.traverse(o => { if (o.isMesh) o.castShadow = SH; }); train.position.set(city.viaduct, 0, -400); scene.add(train); }
  let trainZ = -300, trainDir = 1;

  // ---- Steam from the road ----
  const smoke = tex(128, (c, s) => { const r = rng(3); for (let i = 0; i < 26; i++) { const x = 30 + r() * 68, y = 30 + r() * 68, rad = 18 + r() * 26, g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); } });
  const vents = []; for (let r = 0; r < ROADS; r++) for (const ax of [0, 1]) for (let seg = 0; seg < ROADS - 1; seg++) if (R() < 0.55) { const s = seg * P + 28 + R() * 64, lat = r * P + (R() < 0.5 ? -1 : 1) * (1.9 + (R() < 0.5 ? 0 : 3.6)); vents.push({ x: ax ? lat : s, z: ax ? s : lat }); }
  const PUFFS = Q.rain > 2000 ? 36 : 18, puffs = Array.from({ length: PUFFS }, (_, k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke, color: 0xb9b2c8, transparent: true, opacity: 0, depthWrite: false })); sp.userData = { t: k / PUFFS * 5, vent: null, dx: 0, dz: 0 }; sp.visible = false; scene.add(sp); return sp; });
  let ventTick = 0, nearVents = [];

  // ---- People ----
  const walkers = [], brollies = []; const NP = Q.people || 0;
  const PEOPLE = ['citizen-man-casual_2', 'citizen-woman-casual', 'citizen-man-casual_hoodie', 'citizen-woman-formal', 'citizen-man-worker', 'citizen-woman-suit'];
  async function loadPeople() {
    if (!NP) return;
    const names = PEOPLE.slice(0, NP > 6 ? PEOPLE.length : 3);
    const kits = (await Promise.all(names.map(async name => {
      try {
        const { scene, animations } = await loadGLB(`/evermile/assets/models/${name}.glb`);
        const bounds = new THREE.Box3().setFromObject(scene);
        return { scene, walk: animations.find(a => /^walk$/i.test(a.name)), idle: animations.find(a => /^idle$/i.test(a.name)), bounds };
      } catch (e) { console.warn('Person unavailable:', name, e); return null; }
    }))).filter(Boolean);
    if (!kits.length) return;
    const canopy = new THREE.SphereGeometry(0.64, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.31, 1).translate(0, 1.97, 0);
    const handle = new THREE.CylinderGeometry(0.012, 0.012, 0.83, 5).translate(0, 1.55, 0);
    const umbrella = mergeGeometries([canopy, handle]);
    for (let k = 0; k < NP; k++) {
      const kit = kits[k % kits.length], root = new THREE.Group(), body = SkeletonUtils.clone(kit.scene);
      const h = 1.62 + R() * 0.27, scale = h / Math.max(0.1, kit.bounds.max.y - kit.bounds.min.y);
      body.scale.setScalar(scale);
      body.position.y = -kit.bounds.min.y * scale;
      root.add(body);
      body.traverse(o => {
        if (!o.isMesh) return;
        o.frustumCulled = false; o.castShadow = SH; o.receiveShadow = true;
      });
      if (R() < 0.64) {
        const br = new THREE.Mesh(umbrella, new THREE.MeshStandardMaterial({ color: [0x222429, 0x273d55, 0x593030][k % 3], roughness: 0.64, side: THREE.DoubleSide }));
        br.position.set(0.22, h - 1.7, 0.12); br.rotation.z = 0.09;
        br.visible = env.rain > 0.2; br.castShadow = true; root.add(br); brollies.push(br);
      }
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.325, 16).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x0c1011, map: city.dot, transparent: true, opacity: 0.28, depthWrite: false }));
      shadow.position.y = 0.009; shadow.scale.set(1.14, 1, 0.72); root.add(shadow);
      const mixer = new THREE.AnimationMixer(body);
      const walk = kit.walk && mixer.clipAction(kit.walk).play();
      const idle = kit.idle && mixer.clipAction(kit.idle).play();
      if (walk) walk.time = R() * kit.walk.duration;
      idle?.setEffectiveWeight(0);
      root.visible = false; scene.add(root);
      walkers.push({ root, mixer, walk, idle, blend: 1, pause: 0, live: false, ax: 0, fixed: 0, s: 0, dir: 1, v: 0.94 + R() * 0.63 });
    }
    street.people = walkers;
  }
  function respawn(w, fx, fz, first) { // put a walker on a pavement 30-95 m from the player
    for (let n = 0; n < 8; n++) { const ax = Math.random() < 0.5 ? 0 : 1, r = Math.round((ax ? fx : fz) / P + (Math.random() - 0.5) * 1.2); if (r < 0 || r > ROADS - 1) continue;
      const side = Math.random() < 0.5 ? -1 : 1, along = (ax ? fz : fx) + (Math.random() < 0.5 ? -1 : 1) * ((first ? 12 : 45) + Math.random() * 50); if (along < 16 || along > SPAN - 16) continue;
      if (Math.abs(along - Math.round(along / P) * P) < 15) continue;
      const promenade = ax && r === 0 && fx < 16 && side < 0;
      const fixed = promenade ? -17.4 - Math.random() * 2.6 : r * P + side * (HALF + 2.05 + Math.random() * 0.96);
      Object.assign(w, { ax, fixed, s: along, dir: Math.random() < 0.5 ? -1 : 1, pause: 0, live: true });
      w.root.rotation.y = ax ? (w.dir > 0 ? 0 : Math.PI) : (w.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      w.root.visible = true; return; }
    w.live = false; w.root.visible = false;
  }

  street.update = (dt, t, focus) => {
    wind.value = t;
    // Train shuttles end to end with a pause out of sight.
    trainZ += trainDir * 24 * dt; if (trainZ > SPAN + 520) { trainDir = -1; } else if (trainZ < -520) { trainDir = 1; }
    train.position.z = trainZ; train.rotation.y = trainDir > 0 ? 0 : Math.PI;
    fairyPts.material.opacity = (0.85 + 0.15 * Math.sin(t * 3)) * (0.3 + 0.7 * env.night); stepWheel(t);
    festPts[0].material.opacity = (0.55 + 0.45 * Math.sin(t * 2.2)) * (0.25 + 0.75 * env.night); festPts[1].material.opacity = (0.55 - 0.45 * Math.sin(t * 2.2)) * (0.25 + 0.75 * env.night);
    if ((ventTick++ % 50) === 0) { nearVents = vents.map(v => [(v.x - focus.x) ** 2 + (v.z - focus.z) ** 2, v]).filter(a => a[0] < 150 * 150).sort((a, b) => a[0] - b[0]).slice(0, 6).map(a => a[1]); }
    puffs.forEach((p, k) => { const u = p.userData; u.t += dt; if (u.t > 5 || !u.vent) { u.t = u.t % 5; u.vent = nearVents.length ? nearVents[k % nearVents.length] : null; u.dx = (Math.random() - 0.5) * 0.5; u.dz = (Math.random() - 0.5) * 0.5; }
      if (!u.vent || env.night < 0.5) { p.visible = false; return; } const q = u.t / 5; p.visible = true; p.position.set(u.vent.x + u.dx * u.t * 2 + q * q * 2.5, 0.3 + q * 7.5, u.vent.z + u.dz * u.t * 2); const sc = 1.2 + q * 6; p.scale.set(sc, sc, 1); p.material.opacity = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q) * 0.4; p.material.rotation = k + q * 0.6; });
    for (const w of walkers) {
      if (!w.live || Math.hypot((w.ax ? w.fixed : w.s) - focus.x, (w.ax ? w.s : w.fixed) - focus.z) > 150) {
        respawn(w, focus.x, focus.z, !w.seen); w.seen = true;
        if (!w.live) continue;
      }
      if (w.pause > 0) w.pause -= dt;
      else {
        w.s += w.dir * w.v * dt;
        const nearest = Math.round(w.s / P) * P, distance = w.s - nearest;
        if (Math.abs(distance) < 13.5 && w.dir * distance < 0) {
          w.dir *= -1;
          w.pause = 0.45 + Math.random() * 2.8;
        }
      }
      const target = w.ax ? (w.dir > 0 ? 0 : Math.PI) : (w.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      const turn = target - w.root.rotation.y;
      w.root.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * Math.min(1, dt * 3.8);
      w.root.position.set(w.ax ? w.fixed : w.s, 0.17, w.ax ? w.s : w.fixed);
      w.blend += ((w.pause > 0 && w.idle ? 0 : 1) - w.blend) * Math.min(1, dt * 5.5);
      w.walk?.setEffectiveWeight(w.blend).setEffectiveTimeScale(w.v / 1.28);
      w.idle?.setEffectiveWeight(1 - w.blend);
      w.mixer.update(dt);
    }
  };
  street.setTime = e => { env = e; for (const b of brollies) b.visible = e.rain > 0.2; };
  street.trainZ = () => trainZ; street.loadPeople = loadPeople;
  later.push([crowns, 520], [trunks, 380], [grates, 150]); for (const [m, d] of later) splitChunks(m, d, city.chunks); street.hide = [...puffs]; street.stats = { trees: spots.length + palmSpots.length, vents: vents.length };
  return street;
}
