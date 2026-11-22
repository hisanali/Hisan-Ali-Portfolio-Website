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

  // ---- Trees: a branching trunk carrying a few hundred leaf sprays, shaded as one rounded crown ----
  const leaf = tex(256, (c, s) => { c.clearRect(0, 0, s, s); const r = rng(9); for (let i = 0; i < 150; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * s * 0.44, x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d, g = 70 + r() * 95, L = 10 + r() * 12; c.save(); c.translate(x, y); c.rotate(r() * 6.28); c.fillStyle = `rgb(${g * 0.42 | 0},${g | 0},${g * 0.26 | 0})`; c.beginPath(); c.ellipse(0, 0, L, L * 0.42, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(10,30,6,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-L, 0); c.lineTo(L, 0); c.stroke(); c.restore(); } });
  leaf.wrapS = leaf.wrapT = THREE.ClampToEdgeWrapping;
  const cards = [], r3 = rng(55), cc = new THREE.Vector3(0, 6.3, 0);
  for (let k = 0; k < 130; k++) { const u = r3() * 2 - 1, a = r3() * 6.28, rr = Math.cbrt(0.25 + 0.75 * r3()), sq = Math.sqrt(1 - u * u), px = sq * Math.cos(a) * 2.5 * rr, py = 6.3 + u * 2.0 * rr, pz = sq * Math.sin(a) * 2.5 * rr;
    const g = new THREE.PlaneGeometry(1.7, 1.7); g.rotateX((r3() - 0.5) * 2.2); g.rotateY(r3() * 6.28); g.translate(px, py, pz);
    const n = g.attributes.normal, p = g.attributes.position; for (let i = 0; i < n.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).sub(cc).normalize(); n.setXYZ(i, v.x, v.y * 0.8 + 0.35, v.z); } cards.push(g); }
  const crownG = mergeGeometries(cards);
  const trunkParts = [(() => { const g = new THREE.CylinderGeometry(0.1, 0.2, 4.6, 7); g.translate(0, 2.3, 0); return g; })()];
  for (let k = 0; k < 6; k++) { const g = new THREE.CylinderGeometry(0.03, 0.085, 2.8, 5); g.translate(0, 1.4, 0); g.rotateZ(0.5 + (k % 3) * 0.2); g.rotateY(k * 1.05); g.translate(0, 3.5 + (k % 3) * 0.35, 0); trunkParts.push(g); }
  const trunkG = mergeGeometries(trunkParts);
  const spots = [], palmSpots = [], later = [];
  for (let r = 0; r < ROADS; r++) for (const ax of [0, 1]) for (const side of [-1, 1]) for (let s = 22.5; s < SPAN; s += 15) {
    if (Math.abs(s - Math.round(s / P) * P) < 21 || R() < 0.22) continue; if (ax === 1 && r * P === city.viaduct) continue;
    const lat = r * P + side * (HALF + 1.45), spot = { x: ax ? lat : s, z: ax ? s : lat, sc: 0.85 + R() * 0.45, rot: R() * 6.28, lit: R() < 0.16 };
    if (ax === 0 || (r === 0 && side < 0)) palmSpots.push(spot); else spots.push(spot); }
  for (let z = -40; z < SPAN + 40; z += 11) for (const lx of [-(HALF + 5.5), -(HALF + 11.3)]) palmSpots.push({ x: lx + (R() - 0.5), z: z + (lx < -18 ? 5.5 : 0) + (R() - 0.5) * 2, sc: 0.9 + R() * 0.4, rot: R() * 6.28 });
  // Palms: a leaning trunk with a crown of drooping fronds.
  { const fr = tex(256, (c, s) => { c.clearRect(0, 0, s, s); c.strokeStyle = '#3d5a1e'; c.lineWidth = 5; c.beginPath(); c.moveTo(s / 2, 0); c.lineTo(s / 2, s); c.stroke(); for (let y = 4; y < s - 4; y += 5) { const w = (s / 2 - 6) * Math.sin(Math.PI * (0.12 + 0.88 * y / s)) , g = 70 + (y * 13 % 60); c.strokeStyle = `rgb(${g * 0.5 | 0},${g | 0},${g * 0.3 | 0})`; c.lineWidth = 3.4; c.beginPath(); c.moveTo(s / 2, y); c.lineTo(s / 2 - w, y + 16); c.moveTo(s / 2, y); c.lineTo(s / 2 + w, y + 16); c.stroke(); } });
    fr.wrapS = fr.wrapT = THREE.ClampToEdgeWrapping;
    const fronds = []; for (let k = 0; k < 10; k++) { const g = new THREE.PlaneGeometry(1.7, 4.6, 2, 4), p = g.attributes.position, droop = 0.55 + (k % 3) * 0.22, a = k / 10 * Math.PI * 2 + (k % 2) * 0.2;
      for (let i = 0; i < p.count; i++) { const u = (p.getY(i) + 2.3) / 4.6, x = p.getX(i); p.setXYZ(i, x, u * 4.6 * (0.55 - u * droop * 0.55) - Math.abs(x) * 0.35, u * 4.6 * (0.75 + 0.1 * droop)); }
      g.rotateY(a); g.translate(0.9 + Math.sin(a) * 0.1, 9.0, Math.cos(a) * 0.1); fronds.push(g); }
    const frondG = mergeGeometries(fronds); frondG.computeVertexNormals();
    const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector3(u * u * 0.9, u * 9.0, 0)); }
    const trunkPG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.2, 5, false); const tp = trunkPG.attributes.position; for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), k = 1.25 - y / 9 * 0.55 + 0.06 * Math.sin(y * 9); const cx = (y / 9) ** 2 * 0.9; tp.setX(i, cx + (tp.getX(i) - cx) * k); tp.setZ(i, tp.getZ(i) * k); } trunkPG.computeVertexNormals();
    const pf = new THREE.InstancedMesh(frondG, new THREE.MeshStandardMaterial({ map: fr, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.55, envMapIntensity: 0.6 }), palmSpots.length), pt = new THREE.InstancedMesh(trunkPG, new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.85 }), palmSpots.length);
    palmSpots.forEach((t2, k) => { city.colliders.push({ x: t2.x, z: t2.z, r: 0.3 }); dummy.position.set(t2.x, 0.17, t2.z); dummy.rotation.set(0, t2.rot, 0); dummy.scale.set(t2.sc, t2.sc * (0.85 + (k % 5) * 0.07), t2.sc); dummy.updateMatrix(); pf.setMatrixAt(k, dummy.matrix); pt.setMatrixAt(k, dummy.matrix); });
    for (const m of [pf, pt]) { m.frustumCulled = false; m.castShadow = (Q.reach || 1) >= 1 || m === pf; m.receiveShadow = SH; scene.add(m); later.push([m, 620]); } }
  dummy.scale.set(1, 1, 1);
  const crownM = new THREE.MeshStandardMaterial({ map: leaf, color: 0xffffff, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.6, metalness: 0, envMapIntensity: 0.45 });
  const crowns = new THREE.InstancedMesh(crownG, crownM, spots.length), trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.8 }), spots.length);
  const fairy = [], grates = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.03, 1.5), new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.5, metalness: 0.7 }), spots.length);
  spots.forEach((t, k) => { city.colliders.push({ x: t.x, z: t.z, r: 0.26 }); dummy.position.set(t.x, 0.17, t.z); dummy.rotation.set(0, t.rot, 0); dummy.scale.set(t.sc, t.sc, t.sc); dummy.updateMatrix(); crowns.setMatrixAt(k, dummy.matrix); trunks.setMatrixAt(k, dummy.matrix);
    crowns.setColorAt(k, col.setRGB(0.5 + R() * 0.28, 0.5 + R() * 0.22, 0.4 + R() * 0.2)); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.position.y = 0.18; dummy.updateMatrix(); grates.setMatrixAt(k, dummy.matrix);
    if (t.lit) for (let i = 0; i < 46; i++) { const a = R() * 6.28, rr = (0.6 + R() * 1.9) * t.sc, y = (4.2 + R() * 3.4) * t.sc; fairy.push(t.x + Math.cos(a) * rr, 0.17 + y, t.z + Math.sin(a) * rr); } });
  crowns.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leaf, alphaTest: 0.45 });
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
  const PEOPLE = ['citizen-man-suit', 'citizen-woman-casual', 'citizen-man-casual_hoodie', 'citizen-woman-formal'];
  async function loadPeople() {
    if (!NP) return; const kits = [];
    for (const name of PEOPLE.slice(0, NP > 6 ? 4 : 2)) { try { const g = await loadGLB(`/evermile/assets/models/${name}.glb`); const box = new THREE.Box3().setFromObject(g.scene); kits.push({ scene: g.scene, clip: g.animations.find(a => /walk/i.test(a.name)) || g.animations[0], scale: 1.74 / Math.max(0.1, box.max.y - box.min.y) }); } catch (e) { console.warn('person', name, e); } }
    if (!kits.length) return;
    const brollyG = mergeGeometries([(() => { const g = new THREE.ConeGeometry(0.62, 0.26, 10, 1, true); g.translate(0, 2.12, 0); return g; })(), (() => { const g = new THREE.CylinderGeometry(0.012, 0.012, 0.95, 4); g.translate(0, 1.62, 0); return g; })()]);
    for (let k = 0; k < NP; k++) { const kit = kits[k % kits.length], root = new THREE.Group(), body = SkeletonUtils.clone(kit.scene); body.scale.setScalar(kit.scale * (0.95 + R() * 0.1)); root.add(body);
      body.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.material = o.material.clone(); o.material.envMapIntensity = 0.5; } });
      body.traverse(o => { if (o.isMesh) o.castShadow = SH; });
      if (R() < 0.7) { const br = new THREE.Mesh(brollyG, new THREE.MeshStandardMaterial({ color: [0x0d0e12, 0x14213f, 0x5a1218, 0x1d1d22][Math.floor(R() * 4)], roughness: 0.35, side: THREE.DoubleSide })); br.position.set(0.12, 0, 0.1); root.add(br); brollies.push(br); }
      const mixer = new THREE.AnimationMixer(body); if (kit.clip) { const act = mixer.clipAction(kit.clip); act.play(); act.time = R() * kit.clip.duration; }
      root.visible = false; scene.add(root); walkers.push({ root, mixer, live: false, ax: 0, fixed: 0, s: 0, dir: 1, v: 1.2 + R() * 0.45 }); }
    street.people = walkers;
  }
  function respawn(w, fx, fz, first) { // put a walker on a pavement 30-95 m from the player
    for (let n = 0; n < 8; n++) { const ax = Math.random() < 0.5 ? 0 : 1, r = Math.round((ax ? fx : fz) / P + (Math.random() - 0.5) * 1.2); if (r < 0 || r > ROADS - 1) continue;
      const side = Math.random() < 0.5 ? -1 : 1, along = (ax ? fz : fx) + (Math.random() < 0.5 ? -1 : 1) * ((first ? 12 : 45) + Math.random() * 50); if (along < 16 || along > SPAN - 16) continue;
      if (Math.abs(along - Math.round(along / P) * P) < 15) continue;
      Object.assign(w, { ax, fixed: r * P + side * (HALF + 2.5 + Math.random() * 0.9), s: along, dir: Math.random() < 0.5 ? -1 : 1, live: true }); w.root.visible = true; return; }
    w.live = false; w.root.visible = false;
  }

  street.update = (dt, t, focus) => {
    // Train shuttles end to end with a pause out of sight.
    trainZ += trainDir * 24 * dt; if (trainZ > SPAN + 520) { trainDir = -1; } else if (trainZ < -520) { trainDir = 1; }
    train.position.z = trainZ; train.rotation.y = trainDir > 0 ? 0 : Math.PI;
    fairyPts.material.opacity = (0.85 + 0.15 * Math.sin(t * 3)) * (0.3 + 0.7 * env.night); stepWheel(t);
    festPts[0].material.opacity = (0.55 + 0.45 * Math.sin(t * 2.2)) * (0.25 + 0.75 * env.night); festPts[1].material.opacity = (0.55 - 0.45 * Math.sin(t * 2.2)) * (0.25 + 0.75 * env.night);
    if ((ventTick++ % 50) === 0) { nearVents = vents.map(v => [(v.x - focus.x) ** 2 + (v.z - focus.z) ** 2, v]).filter(a => a[0] < 150 * 150).sort((a, b) => a[0] - b[0]).slice(0, 6).map(a => a[1]); }
    puffs.forEach((p, k) => { const u = p.userData; u.t += dt; if (u.t > 5 || !u.vent) { u.t = u.t % 5; u.vent = nearVents.length ? nearVents[k % nearVents.length] : null; u.dx = (Math.random() - 0.5) * 0.5; u.dz = (Math.random() - 0.5) * 0.5; }
      if (!u.vent || env.night < 0.5) { p.visible = false; return; } const q = u.t / 5; p.visible = true; p.position.set(u.vent.x + u.dx * u.t * 2 + q * q * 2.5, 0.3 + q * 7.5, u.vent.z + u.dz * u.t * 2); const sc = 1.2 + q * 6; p.scale.set(sc, sc, 1); p.material.opacity = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q) * 0.4; p.material.rotation = k + q * 0.6; });
    for (const w of walkers) { if (!w.live || Math.abs((w.ax ? w.fixed : w.s) - focus.x) + Math.abs((w.ax ? w.s : w.fixed) - focus.z) > 150) { respawn(w, focus.x, focus.z, !w.seen); w.seen = true; if (!w.live) continue; }
      w.s += w.dir * w.v * dt; const near = Math.abs(w.s - Math.round(w.s / P) * P); if (near < 13.5 || w.s < 14 || w.s > SPAN - 14) { w.dir = -w.dir; w.s += w.dir * w.v * dt * 2; }
      w.root.position.set(w.ax ? w.fixed : w.s, 0.17, w.ax ? w.s : w.fixed); w.root.rotation.y = w.ax ? (w.dir > 0 ? 0 : Math.PI) : (w.dir > 0 ? Math.PI / 2 : -Math.PI / 2); w.mixer.update(dt * w.v / 1.35); }
  };
  street.setTime = e => { env = e; for (const b of brollies) b.visible = e.rain > 0.2; };
  street.trainZ = () => trainZ; street.loadPeople = loadPeople;
  later.push([crowns, 520], [trunks, 380], [grates, 150]); for (const [m, d] of later) splitChunks(m, d, city.chunks); street.hide = [...puffs]; street.stats = { trees: spots.length, vents: vents.length };
  return street;
}
