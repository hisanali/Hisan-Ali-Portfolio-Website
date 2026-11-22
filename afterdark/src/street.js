// Life on the street: trees, the elevated train, steam rising from the road and people on the pavements.
import * as THREE from '/evermile/vendor/three.module.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from '/evermile/vendor/utils/SkeletonUtils.js';
import { P, ROADS, HALF, SW, SPAN, rng } from './city.js';
import { loadGLB } from './car.js';

const dummy = new THREE.Object3D(), col = new THREE.Color();
function tex(size, draw, srgb = true) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

export function buildStreet(scene, city, R3, Q) {
  const R = rng(4242), street = { people: [], update: () => {} };

  // ---- Trees: a branching trunk and a crown of overlapping leaf clusters ----
  const leaf = tex(256, (c, s) => { c.fillStyle = '#1c2a14'; c.fillRect(0, 0, s, s); const r = rng(9); for (let i = 0; i < 2600; i++) { const g = 40 + r() * 70; c.fillStyle = `rgba(${g * 0.55 | 0},${g | 0},${g * 0.35 | 0},${0.5 + r() * 0.5})`; c.beginPath(); c.ellipse(r() * s, r() * s, 2 + r() * 5, 1 + r() * 2.5, r() * 3.14, 0, 7); c.fill(); } for (let i = 0; i < 500; i++) { c.fillStyle = 'rgba(4,8,3,.8)'; c.beginPath(); c.arc(r() * s, r() * s, 1 + r() * 4, 0, 7); c.fill(); } });
  leaf.repeat.set(3, 2);
  const crownParts = [];
  for (let k = 0; k < 7; k++) { const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, r2 = rng(30 + k);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.22 * Math.sin(x * 5.1 + k) * Math.cos(z * 4.3 + k * 2) + 0.14 * Math.sin(y * 7 + k * 3); p.setXYZ(i, x * n, y * n * 0.82, z * n); }
    g.computeVertexNormals(); const a = k / 7 * Math.PI * 2, rad = k === 0 ? 0 : 1.15 + r2() * 0.5, sc = k === 0 ? 1.7 : 1.05 + r2() * 0.5; g.scale(sc, sc, sc); g.translate(Math.cos(a) * rad, 5.4 + (k === 0 ? 0.9 : (r2() - 0.4) * 1.5), Math.sin(a) * rad); crownParts.push(g); }
  const crownG = mergeGeometries(crownParts);
  const trunkParts = [(() => { const g = new THREE.CylinderGeometry(0.1, 0.19, 4.4, 7); g.translate(0, 2.2, 0); return g; })()];
  for (let k = 0; k < 4; k++) { const g = new THREE.CylinderGeometry(0.035, 0.085, 2.3, 5); g.translate(0, 1.15, 0); g.rotateZ(0.6 + (k % 2) * 0.2); g.rotateY(k * 1.7); g.translate(0, 3.4 + k * 0.25, 0); trunkParts.push(g); }
  const trunkG = mergeGeometries(trunkParts);
  const spots = [];
  for (let r = 0; r < ROADS; r++) for (const ax of [0, 1]) for (const side of [-1, 1]) for (let s = 22.5; s < SPAN; s += 15) {
    if (Math.abs(s - Math.round(s / P) * P) < 21 || R() < 0.22) continue; if (ax === 1 && r * P === city.viaduct) continue;
    const lat = r * P + side * (HALF + 1.45); spots.push({ x: ax ? lat : s, z: ax ? s : lat, sc: 0.85 + R() * 0.45, rot: R() * 6.28, lit: R() < 0.16 }); }
  const crownM = new THREE.MeshStandardMaterial({ map: leaf, color: 0xffffff, roughness: 0.42, metalness: 0, envMapIntensity: 0.7 });
  const crowns = new THREE.InstancedMesh(crownG, crownM, spots.length), trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.8 }), spots.length);
  const fairy = [], grates = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.03, 1.5), new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.5, metalness: 0.7 }), spots.length);
  spots.forEach((t, k) => { dummy.position.set(t.x, 0.17, t.z); dummy.rotation.set(0, t.rot, 0); dummy.scale.set(t.sc, t.sc, t.sc); dummy.updateMatrix(); crowns.setMatrixAt(k, dummy.matrix); trunks.setMatrixAt(k, dummy.matrix);
    crowns.setColorAt(k, col.setRGB(0.55 + R() * 0.5, 0.6 + R() * 0.5, 0.45 + R() * 0.3)); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.position.y = 0.18; dummy.updateMatrix(); grates.setMatrixAt(k, dummy.matrix);
    if (t.lit) for (let i = 0; i < 46; i++) { const a = R() * 6.28, rr = (0.6 + R() * 1.9) * t.sc, y = (4.2 + R() * 3.4) * t.sc; fairy.push(t.x + Math.cos(a) * rr, 0.17 + y, t.z + Math.sin(a) * rr); } });
  for (const m of [crowns, trunks, grates]) { m.frustumCulled = false; scene.add(m); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fairy, 3));
  const fairyPts = new THREE.Points(fg, new THREE.PointsMaterial({ size: 0.42, map: city.dot, color: new THREE.Color(3.2, 2.2, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(fairyPts);

  // ---- The train on the elevated line ----
  const train = new THREE.Group(); const CARS = 5, CL = 17.5;
  { const body = new THREE.MeshStandardMaterial({ color: 0x8e949c, roughness: 0.32, metalness: 0.85 }), win = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.3, 1.7) }), stripe = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.6, 1.9) });
    for (let k = 0; k < CARS; k++) { const z = -k * (CL + 0.7); const b = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.1, CL), body); b.position.set(0, 12.75, z); train.add(b);
      for (const e of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, CL - 2.2), win); w.position.set(e * 1.47, 13.2, z); train.add(w); const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, CL - 0.4), stripe); st.position.set(e * 1.47, 12.1, z); train.add(st); } }
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.6, 3.8) })); head.position.set(0, 11.9, CL / 2 + 0.03); train.add(head);
    train.position.set(city.viaduct, 0, -400); scene.add(train); }
  let trainZ = -300, trainDir = 1;

  // ---- Steam from the road ----
  const smoke = tex(128, (c, s) => { const r = rng(3); for (let i = 0; i < 26; i++) { const x = 30 + r() * 68, y = 30 + r() * 68, rad = 18 + r() * 26, g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); } });
  const vents = []; for (let r = 0; r < ROADS; r++) for (const ax of [0, 1]) for (let seg = 0; seg < ROADS - 1; seg++) if (R() < 0.55) { const s = seg * P + 28 + R() * 64, lat = r * P + (R() < 0.5 ? -1 : 1) * (1.9 + (R() < 0.5 ? 0 : 3.6)); vents.push({ x: ax ? lat : s, z: ax ? s : lat }); }
  const PUFFS = Q.rain > 2000 ? 36 : 18, puffs = Array.from({ length: PUFFS }, (_, k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke, color: 0xb9b2c8, transparent: true, opacity: 0, depthWrite: false })); sp.userData = { t: k / PUFFS * 5, vent: null, dx: 0, dz: 0 }; sp.visible = false; scene.add(sp); return sp; });
  let ventTick = 0, nearVents = [];

  // ---- People ----
  const walkers = []; const NP = Q.people || 0;
  const PEOPLE = ['citizen-man-suit', 'citizen-woman-casual', 'citizen-man-casual_hoodie', 'citizen-woman-formal'];
  async function loadPeople() {
    if (!NP) return; const kits = [];
    for (const name of PEOPLE.slice(0, NP > 6 ? 4 : 2)) { try { const g = await loadGLB(`/evermile/assets/models/${name}.glb`); const box = new THREE.Box3().setFromObject(g.scene); kits.push({ scene: g.scene, clip: g.animations.find(a => /walk/i.test(a.name)) || g.animations[0], scale: 1.74 / Math.max(0.1, box.max.y - box.min.y) }); } catch (e) { console.warn('person', name, e); } }
    if (!kits.length) return;
    const brollyG = mergeGeometries([(() => { const g = new THREE.ConeGeometry(0.62, 0.26, 10, 1, true); g.translate(0, 2.12, 0); return g; })(), (() => { const g = new THREE.CylinderGeometry(0.012, 0.012, 0.95, 4); g.translate(0, 1.62, 0); return g; })()]);
    for (let k = 0; k < NP; k++) { const kit = kits[k % kits.length], root = new THREE.Group(), body = SkeletonUtils.clone(kit.scene); body.scale.setScalar(kit.scale * (0.95 + R() * 0.1)); root.add(body);
      body.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.material = o.material.clone(); o.material.envMapIntensity = 0.5; } });
      if (R() < 0.7) { const br = new THREE.Mesh(brollyG, new THREE.MeshStandardMaterial({ color: [0x0d0e12, 0x14213f, 0x5a1218, 0x1d1d22][Math.floor(R() * 4)], roughness: 0.35, side: THREE.DoubleSide })); br.position.set(0.12, 0, 0.1); root.add(br); }
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
    fairyPts.material.opacity = 0.85 + 0.15 * Math.sin(t * 3);
    if ((ventTick++ % 50) === 0) { nearVents = vents.map(v => [(v.x - focus.x) ** 2 + (v.z - focus.z) ** 2, v]).filter(a => a[0] < 150 * 150).sort((a, b) => a[0] - b[0]).slice(0, 6).map(a => a[1]); }
    puffs.forEach((p, k) => { const u = p.userData; u.t += dt; if (u.t > 5 || !u.vent) { u.t = u.t % 5; u.vent = nearVents.length ? nearVents[k % nearVents.length] : null; u.dx = (Math.random() - 0.5) * 0.5; u.dz = (Math.random() - 0.5) * 0.5; }
      if (!u.vent) { p.visible = false; return; } const q = u.t / 5; p.visible = true; p.position.set(u.vent.x + u.dx * u.t * 2 + q * q * 2.5, 0.3 + q * 7.5, u.vent.z + u.dz * u.t * 2); const sc = 1.2 + q * 6; p.scale.set(sc, sc, 1); p.material.opacity = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q) * 0.4; p.material.rotation = k + q * 0.6; });
    for (const w of walkers) { if (!w.live || Math.abs((w.ax ? w.fixed : w.s) - focus.x) + Math.abs((w.ax ? w.s : w.fixed) - focus.z) > 150) { respawn(w, focus.x, focus.z, !w.seen); w.seen = true; if (!w.live) continue; }
      w.s += w.dir * w.v * dt; const near = Math.abs(w.s - Math.round(w.s / P) * P); if (near < 13.5 || w.s < 14 || w.s > SPAN - 14) { w.dir = -w.dir; w.s += w.dir * w.v * dt * 2; }
      w.root.position.set(w.ax ? w.fixed : w.s, 0.17, w.ax ? w.s : w.fixed); w.root.rotation.y = w.ax ? (w.dir > 0 ? 0 : Math.PI) : (w.dir > 0 ? Math.PI / 2 : -Math.PI / 2); w.mixer.update(dt * w.v / 1.35); }
  };
  street.loadPeople = loadPeople; street.hide = [...puffs]; street.stats = { trees: spots.length, vents: vents.length };
  return street;
}
