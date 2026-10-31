import { THREE, SimplexNoise, $, makeWorld, addSky, sunLight, pbr, canvasTexture, loadModel, shadowed, loadingUI, Particles, Sound, ui, seg, clamp, lerp, mulberry } from '/games/world-shared.js';
import { mergeGeometries, mergeVertices } from '/evermile/vendor/utils/BufferGeometryUtils.js';

const KEY = 'reefdive';
const load = loadingUI('Reef Dive');
const { renderer, scene, camera, composer } = makeWorld($('#scene'), { fov: 70, far: 260, bloom: 0.4, threshold: 0.8, radius: 0.6, exposure: 0.95 });
const U = ui(KEY), snd = new Sound(KEY);
$('#credit').textContent = 'Fish: Barramundi Fish, Khronos glTF Sample Assets (CC0). Rock texture: Poly Haven (CC0).';

// ---------- Water volume ----------
const DEEP = new THREE.Color(0x03243a), SHALLOW = new THREE.Color(0x0e7f9a);
scene.background = new THREE.Color(0x0a5a78); scene.fog = new THREE.FogExp2(0x0a5a78, 0.022);
const sunLt = sunLight(scene, { color: 0xbfefff, intensity: 2.2, size: 120, mapSize: 1024, far: 300 }); sunLt.position.set(30, 90, 20);
scene.add(new THREE.HemisphereLight(0x5ed0ff, 0x062233, 0.9));
scene.add(new THREE.AmbientLight(0x1b6a8a, 0.5));
// Environment: a small gradient room so metals/glass pick up blue light.
{ const pm = new THREE.PMREMGenerator(renderer); const env = new THREE.Scene(); env.background = new THREE.Color(0x0b6a8c); const top = new THREE.Mesh(new THREE.SphereGeometry(50, 16, 8), new THREE.MeshBasicMaterial({ color: 0x8fe6ff, side: THREE.BackSide })); top.position.y = 60; env.add(top); scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose(); scene.environmentIntensity = 0.6; }

// Caustics: an animated light texture projected from the sun.
// Caustics: a tiling cellular pattern (Worley F2-F1), the shape sunlight takes when surface waves focus it.
const causTex = canvasTexture(256, (c, s) => {
  const r = mulberry(41), pts = []; for (let i = 0; i < 26; i++) pts.push([r() * s, r() * s]);
  const img = c.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let f1 = 1e9, f2 = 1e9;
    for (const [px, py] of pts) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const dx = x - px - ox * s, dy = y - py - oy * s, d = Math.sqrt(dx * dx + dy * dy); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
    const v = Math.pow(1 - Math.min(1, (f2 - f1) / 14), 2.2) * 255, i = (y * s + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}, { repeat: 1, srgb: false });
causTex.repeat.set(60, 60);

// ---------- Sea floor and reef ----------
const rnd = mulberry(5);
const SIZE = 420, RES = 140;
function floorH(x, z) { return -24 + Math.sin(x * 0.045) * 3 + Math.cos(z * 0.05 + x * 0.02) * 3.5 + Math.sin(x * 0.17 + z * 0.13) * 0.8; }
const floorMat = pbr('forest_ground_04', { repeat: 40, roughness: 0.95, normalScale: 0.5, color: 0xffffff });
floorMat.map = canvasTexture(512, (c, s) => { c.fillStyle = '#d9c9a3'; c.fillRect(0, 0, s, s); const img = c.getImageData(0, 0, s, s); for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 30; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n * 0.8; } c.putImageData(img, 0, 0); c.globalAlpha = 0.22; c.strokeStyle = '#a88f62'; c.lineWidth = 3; for (let k = 0; k < 30; k++) { c.beginPath(); for (let x = 0; x <= s; x += 12) c.lineTo(x, k * 17 + Math.sin(x * 0.04 + k * 1.3) * 5); c.stroke(); } }, { repeat: 40 }); floorMat.roughnessMap = null; floorMat.emissive = new THREE.Color(0x9fe8ff); floorMat.emissiveMap = causTex; floorMat.emissiveIntensity = 0.22; floorMat.needsUpdate = true;
const fg = new THREE.PlaneGeometry(SIZE, SIZE, RES, RES); fg.rotateX(-Math.PI / 2); { const p = fg.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, floorH(p.getX(i), p.getZ(i))); fg.computeVertexNormals(); }
const floor = new THREE.Mesh(fg, floorMat); floor.receiveShadow = true; scene.add(floor);
const rockMat = pbr('rock_wall_11', { repeat: 2, roughness: 0.9, normalScale: 1, color: 0x9a8f7c });
const coralCols = [0xc98b5a, 0xd9a46f, 0xb86a72, 0xd88f9c, 0x8e5f8f, 0x9a8a4a, 0xe3d2b0, 0xcf6f3e, 0x6f8a6a];
const obstacles = []; // {pos, r}
// Everything on the reef is instanced so the whole scene is a handful of draw calls.
const inst = { rock: [], stag: [], brain: [], table: [], fan: [], weed: [] };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const put = (list, x, y, z, rx, ry, rz, sx, sy, sz, col) => { _e.set(rx, ry, rz); _q.setFromEuler(_e); _s.set(sx, sy, sz); _p.set(x, y, z); list.push({ m: _m.compose(_p, _q, _s).clone(), col }); };
function coralCluster(x, z) {
  const y = floorH(x, z);
  const rs = 2 + rnd() * 2; put(inst.rock, x, y - rs * 0.3, z, rnd() * 0.4, rnd() * 6, rnd() * 0.4, rs * (1 + rnd() * 0.6), rs * (0.45 + rnd() * 0.3), rs * (1 + rnd() * 0.6), 0xffffff);
  const n = 6 + Math.floor(rnd() * 7);
  for (let i = 0; i < n; i++) {
    const col = coralCols[Math.floor(rnd() * coralCols.length)]; const kind = rnd();
    const a = rnd() * Math.PI * 2, r = 2 + rnd() * 6; const cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r, cy = floorH(cx, cz) + 0.3;
    if (kind < 0.3) { const k = 0.8 + rnd() * 0.7; put(inst.stag, cx, cy - 0.2, cz, (rnd() - 0.5) * 0.2, rnd() * 6, (rnd() - 0.5) * 0.2, k, k * (0.8 + rnd() * 0.4), k, col); }
    else if (kind < 0.55) { const sr = 0.8 + rnd() * 1.3; put(inst.brain, cx, cy - 0.3, cz, 0, rnd() * 6, 0, sr, sr * (0.55 + rnd() * 0.2), sr, col); }
    else if (kind < 0.7) { const k = 1 + rnd() * 1.2; put(inst.table, cx, cy, cz, (rnd() - 0.5) * 0.15, rnd() * 6, (rnd() - 0.5) * 0.15, k, k * (0.8 + rnd() * 0.5), k, col); }
    else if (kind < 0.85) { const k = 1.2 + rnd() * 1.2; put(inst.fan, cx, cy - 0.1, cz, (rnd() - 0.5) * 0.2, rnd() * 6, 0, k, k, k, [0x8e3f6f, 0xb3563f, 0xc9a05a][Math.floor(rnd() * 3)]); }
    else { for (let b = 0; b < 12; b++) put(inst.weed, cx + (rnd() - 0.5) * 2, cy, cz + (rnd() - 0.5) * 2, (rnd() - 0.5) * 0.3, rnd() * 6, (rnd() - 0.5) * 0.3, 1, 2 + rnd() * 2, 1, [0x4f7a3a, 0x6b7f35, 0x3e6b45][b % 3]); }
  }
  obstacles.push({ pos: new THREE.Vector3(x, y + 2, z), r: 5 });
}
for (let i = 0; i < 120; i++) { const a = rnd() * Math.PI * 2, r = 14 + rnd() * 180; coralCluster(Math.cos(a) * r, Math.sin(a) * r); }
for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, r = 60 + rnd() * 130; const x = Math.cos(a) * r, z = Math.sin(a) * r; const sr = 9 + rnd() * 8; put(inst.rock, x, floorH(x, z) + 2, z, 0, rnd() * 6, 0, sr * 1.2, sr * (0.8 + rnd()), sr * (0.5 + rnd() * 0.6), 0xffffff); obstacles.push({ pos: new THREE.Vector3(x, floorH(x, z) + 2, z), r: 9 }); }
function bake(list, geo, mat, shadow = true) {
  const im = new THREE.InstancedMesh(geo, mat, list.length); const c = new THREE.Color();
  list.forEach((it, i) => { im.setMatrixAt(i, it.m); im.setColorAt(i, c.set(it.col)); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = shadow; im.receiveShadow = true; scene.add(im); return im;
}
const cnoise = new SimplexNoise({ random: mulberry(17) });
// Porous polyp surface shared by the hard corals (used as colour detail and bump).
const polypTex = canvasTexture(256, (c, s) => { c.fillStyle = '#dcdcdc'; c.fillRect(0, 0, s, s); const r = mulberry(3); for (let i = 0; i < 1400; i++) { const x = r() * s, y = r() * s, rad = 1 + r() * 2.4; c.fillStyle = `rgba(60,50,45,${0.25 + r() * 0.35})`; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(x - rad * 0.4, y - rad * 0.4, rad * 0.5, 0, 7); c.fill(); } }, { repeat: 3 });
const coralMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: polypTex, bumpMap: polypTex, bumpScale: 2.5, roughness: 0.92, metalness: 0 });
// Lumpy boulders instead of faceted icosahedra.
{
  let g = new THREE.IcosahedronGeometry(1, 5); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g); const p = g.attributes.position; const v = new THREE.Vector3(); const uv = [];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + cnoise.noise3d(v.x * 1.6, v.y * 1.6, v.z * 1.6) * 0.22 + cnoise.noise3d(v.x * 5, v.y * 5, v.z * 5) * 0.06; uv.push(Math.atan2(v.z, v.x) / Math.PI + 1, v.y + 1); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); bake(inst.rock, g, rockMat);
}
// Staghorn: a recursive tree of tapered branches with rounded tips, merged into one mesh.
{
  const parts = []; const r = mulberry(8);
  const grow = (base, dir, len, rad, depth) => {
    const g = new THREE.CylinderGeometry(rad * 0.72, rad, len, 7, 1); g.translate(0, len / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)); g.translate(base.x, base.y, base.z); parts.push(g);
    const tip = base.clone().addScaledVector(dir, len);
    if (depth === 0) { const cap = new THREE.SphereGeometry(rad * 0.72, 7, 5); cap.translate(tip.x, tip.y, tip.z); parts.push(cap); return; }
    const n = depth > 1 ? 3 : 2;
    for (let i = 0; i < n; i++) { const d = dir.clone().add(new THREE.Vector3((r() - 0.5) * 1.3, 0.35 + r() * 0.4, (r() - 0.5) * 1.3)).normalize(); grow(tip, d, len * (0.65 + r() * 0.2), rad * 0.72, depth - 1); }
  };
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; grow(new THREE.Vector3(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25), new THREE.Vector3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5).normalize(), 0.9 + r() * 0.3, 0.13, 3); }
  bake(inst.stag, mergeGeometries(parts.map(g => g.toNonIndexed())), coralMat);
}
// Brain coral: a low dome with meandering grooves cut by ridged noise.
{
  const g = new THREE.SphereGeometry(1, 96, 48, 0, Math.PI * 2, 0, Math.PI * 0.58); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.abs(cnoise.noise3d(v.x * 3.4, v.y * 3.4, v.z * 3.4)); v.multiplyScalar(1 - Math.pow(1 - n, 8) * 0.08 + cnoise.noise3d(v.x, v.y, v.z) * 0.05); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); bake(inst.brain, g, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }));
}
// Table coral: a short trunk under a wide, wavy plate.
{
  const plate = new THREE.CylinderGeometry(1.4, 1.1, 0.14, 40, 1); const p = plate.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), rr = Math.hypot(x, z); p.setY(i, p.getY(i) + Math.sin(Math.atan2(z, x) * 7) * 0.08 * rr + rr * rr * 0.06); }
  plate.computeVertexNormals(); plate.translate(0, 0.9, 0);
  const stem = new THREE.CylinderGeometry(0.16, 0.3, 0.9, 8); stem.translate(0, 0.45, 0);
  bake(inst.table, mergeGeometries([plate.toNonIndexed(), stem.toNonIndexed()]), coralMat);
}
// Sea fans: a flat lattice of branching veins, cut out with alpha.
{
  const fanTex = canvasTexture(256, (c, s) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, s, s); c.strokeStyle = '#fff'; c.lineCap = 'round'; const r = mulberry(12);
    const br = (x, y, a, len, w, d) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); if (d > 0) { br(x2, y2, a - 0.3 - r() * 0.3, len * 0.8, w * 0.78, d - 1); br(x2, y2, a + 0.3 + r() * 0.3, len * 0.8, w * 0.78, d - 1); } };
    br(s / 2, s, -Math.PI / 2, s * 0.2, 7, 7);
  }, { repeat: 1, srgb: false });
  const g = new THREE.PlaneGeometry(2.2, 2.2, 6, 6); g.translate(0, 1.1, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 1.4) * 0.15);
  bake(inst.fan, g, new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: fanTex, alphaTest: 0.5, roughness: 0.8, side: THREE.DoubleSide }), false);
}
// Seagrass blades with a gentle curl.
{ const g = new THREE.PlaneGeometry(0.35, 1, 1, 6); g.translate(0, 0.5, 0); const wp = g.attributes.position; for (let v = 0; v < wp.count; v++) { const y = wp.getY(v); wp.setX(v, wp.getX(v) * (1 - y * 0.6)); wp.setZ(v, Math.sin(y * 3) * 0.12); } bake(inst.weed, g, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide }), false); }

// ---------- Fish (instanced boids) ----------
const FISH = 360; let fish = null; const fishTime = { value: 0 };
const fPos = [], fVel = [], fScale = []; const schools = 6; const schoolCentres = Array.from({ length: schools }, () => new THREE.Vector3((rnd() - 0.5) * 200, -8 - rnd() * 10, (rnd() - 0.5) * 200)); schoolCentres[0].set(0, -7, 30);
// Each school is one species-like tint over the scanned skin: silver, bronze, blue-grey, gold, dusky, pale.
const schoolTints = [0xffffff, 0xe8c79a, 0xb8c8e0, 0xf2dc8a, 0x9aa09a, 0xf0e6dc];
for (let i = 0; i < FISH; i++) { const s = i % schools; const c = schoolCentres[s]; fPos.push(c.clone().add(new THREE.Vector3((rnd() - 0.5) * 12, (rnd() - 0.5) * 5, (rnd() - 0.5) * 12))); fVel.push(new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize().multiplyScalar(4)); fScale.push((0.8 + rnd() * 0.5) * (1 + s * 0.12)); }
async function loadFish() {
  const g = await loadModel('/reefdive/barramundi.glb?v=1'); let src = null; g.scene.updateMatrixWorld(true); g.scene.traverse(o => { if (o.isMesh && !src) src = o; });
  const geo = src.geometry.clone(); geo.applyMatrix4(src.matrixWorld); geo.computeBoundingBox();
  // Normalise: centred, nose pointing +Z, 1 unit long.
  const bb = geo.boundingBox, len = bb.max.z - bb.min.z; geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -(bb.max.z + bb.min.z) / 2); geo.scale(1 / len, 1 / len, 1 / len);
  if (FISH_FLIP) geo.rotateY(Math.PI);
  const mat = src.material.clone(); mat.envMapIntensity = 1.2;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uSwim = fishTime;
    sh.vertexShader = 'uniform float uSwim;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = float(gl_InstanceID) * 1.37;
      float tail = smoothstep(0.25, -0.5, transformed.z);
      transformed.x += sin(transformed.z * 9.0 - uSwim * 11.0 + ph) * (0.012 + 0.07 * tail * tail);`);
  };
  fish = new THREE.InstancedMesh(geo, mat, FISH); fish.castShadow = false; fish.frustumCulled = false;
  const col = new THREE.Color(); for (let i = 0; i < FISH; i++) fish.setColorAt(i, col.set(schoolTints[i % schools]).offsetHSL(0, 0, (rnd() - 0.5) * 0.08));
  fish.instanceColor.needsUpdate = true; scene.add(fish);
}
const fm = new THREE.Matrix4(), fq = new THREE.Quaternion(), fu = new THREE.Vector3(), fs = new THREE.Vector3(1, 1, 1);
function boids(dt) {
  for (let s = 0; s < schools; s++) { const c = schoolCentres[s]; c.x += Math.sin(S.time * 0.2 + s) * dt * 6; c.z += Math.cos(S.time * 0.17 + s * 2) * dt * 6; if (c.length() > 190) c.multiplyScalar(0.995); c.y = -8 - s * 2 + Math.sin(S.time * 0.3 + s) * 3; }
  for (let i = 0; i < FISH; i++) {
    const p = fPos[i], v = fVel[i], c = schoolCentres[i % schools];
    fu.subVectors(c, p); v.addScaledVector(fu, dt * 0.6);
    const j = (i * 7 + 3) % FISH; fu.subVectors(p, fPos[j]); const d = fu.length(); if (d < 1.2 && d > 0) v.addScaledVector(fu, dt * 4 / d); else if (d < 6) v.addScaledVector(fVel[j], dt * 0.3);
    fu.subVectors(p, sub.pos); const ds = fu.length(); if (ds < 10) v.addScaledVector(fu, dt * 30 / (ds + 0.1));
    const sp = v.length(); if (sp > 7) v.multiplyScalar(7 / sp); if (sp < 2.5) v.multiplyScalar(1.05);
    p.addScaledVector(v, dt); const fl = floorH(p.x, p.z) + 2; if (p.y < fl) { p.y = fl; v.y = Math.abs(v.y); } if (p.y > -2) { p.y = -2; v.y = -Math.abs(v.y); }
    if (!fish) continue;
    // Keep fish upright: yaw toward the heading, limited pitch, no roll.
    const h = fu.copy(v).normalize(); _e.set(-Math.asin(clamp(h.y, -0.5, 0.5)), Math.atan2(h.x, h.z), 0, 'YXZ'); fq.setFromEuler(_e); fs.setScalar(fScale[i]); fm.compose(p, fq, fs); fish.setMatrixAt(i, fm);
  }
  fishTime.value = S.time; if (fish) fish.instanceMatrix.needsUpdate = true;
}

// ---------- Jellyfish, pearls, vents ----------
const jellies = [];
const jellyMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe9f2, transparent: true, opacity: 0.32, roughness: 0.15, transmission: 0.4, thickness: 0.6, side: THREE.DoubleSide, depthWrite: false });
const gonadMat = new THREE.MeshStandardMaterial({ color: 0xe9b7c8, transparent: true, opacity: 0.6, roughness: 0.5, depthWrite: false });
const tentMat = new THREE.LineBasicMaterial({ color: 0xe8eef5, transparent: true, opacity: 0.35 });
const bellGeo = (() => { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(Math.sin(t * Math.PI / 2) * 1.5 * (1 + 0.05 * Math.sin(t * 9)), Math.cos(t * Math.PI / 2) * 0.75)); } return new THREE.LatheGeometry(pts, 40); })();
for (let i = 0; i < 16; i++) {
  const g = new THREE.Group(); const bell = new THREE.Mesh(bellGeo, jellyMat); bell.renderOrder = 2; g.add(bell);
  for (let k = 0; k < 4; k++) { const gon = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 6, 16), gonadMat); const a = k / 4 * Math.PI * 2; gon.position.set(Math.cos(a) * 0.45, 0.35, Math.sin(a) * 0.45); gon.rotation.x = Math.PI / 2; g.add(gon); }
  const tp = []; for (let t = 0; t < 48; t++) { const a = t / 48 * Math.PI * 2; for (let k = 0; k < 6; k++) { const y0 = -k * 0.35, y1 = -(k + 1) * 0.35; tp.push(Math.cos(a) * 1.45, y0, Math.sin(a) * 1.45, Math.cos(a) * 1.45 + Math.sin(k + t) * 0.05, y1, Math.sin(a) * 1.45); } }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.add(new THREE.LineSegments(tg, tentMat));
  g.position.set((rnd() - 0.5) * 240, -6 - rnd() * 12, (rnd() - 0.5) * 240); g.userData.ph = rnd() * 6; scene.add(g); jellies.push(g);
}
const pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xfff6ea, emissive: 0xfff0dc, emissiveIntensity: 0.25, roughness: 0.08, metalness: 0, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6 });
const shellTex = canvasTexture(128, (c, s) => { c.fillStyle = '#8a7a66'; c.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 4) { c.fillStyle = `rgba(${40 + (y * 7) % 60},${35 + (y * 5) % 50},30,0.5)`; c.fillRect(0, y, s, 2); } });
const shellOut = new THREE.MeshStandardMaterial({ color: 0xffffff, map: shellTex, roughness: 0.95 });
const shellIn = new THREE.MeshStandardMaterial({ color: 0xe9e3e8, roughness: 0.3, metalness: 0.1, side: THREE.BackSide });
const valveGeo = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); valveGeo.scale(1.1, 0.35, 0.9);
const pearls = []; const pearlGeo = new THREE.SphereGeometry(0.45, 20, 14);
function spawnPearls(n) {
  for (let i = 0; i < n; i++) {
    let x, z, tries = 0; do { const a = rnd() * Math.PI * 2, r = 20 + rnd() * 170; x = Math.cos(a) * r; z = Math.sin(a) * r; tries++; } while (tries < 30 && obstacles.some(o => Math.hypot(o.pos.x - x, o.pos.z - z) < o.r + 2.5));
    const y = floorH(x, z); const g = new THREE.Group(); g.position.set(x, y + 0.15, z); g.rotation.y = rnd() * 6;
    const low = new THREE.Group(); low.add(new THREE.Mesh(valveGeo, shellOut)); const lowIn = new THREE.Mesh(valveGeo, shellIn); lowIn.scale.setScalar(0.96); low.add(lowIn); low.rotation.x = Math.PI; g.add(low);
    const top = new THREE.Group(); top.add(new THREE.Mesh(valveGeo, shellOut)); const topIn = new THREE.Mesh(valveGeo, shellIn); topIn.scale.setScalar(0.96); top.add(topIn); top.position.z = -0.85; top.rotation.x = -0.9; top.children.forEach(m => m.position.z = 0.85); g.add(top);
    g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    const m = new THREE.Mesh(pearlGeo, pearlMat); m.position.set(0, 0.25, 0); g.add(m); scene.add(g); pearls.push({ group: g, pearl: m, position: new THREE.Vector3(x, y + 0.6, z) });
  }
}
const vents = []; const ventGeo = (() => { const g = new THREE.CylinderGeometry(0.7, 2.4, 1.4, 20, 4, true); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + cnoise.noise3d(p.getX(i) * 0.9, p.getY(i), p.getZ(i) * 0.9) * 0.25; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); return g; })();
for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.5, r = 70 + rnd() * 60; const x = Math.cos(a) * r, z = Math.sin(a) * r; const m = new THREE.Mesh(ventGeo, rockMat); m.position.set(x, floorH(x, z) + 0.3, z); m.castShadow = m.receiveShadow = true; scene.add(m); vents.push(m.position); }
const bubbles = new Particles(scene, 1400, 0xe6f8ff, 0.35);

// ---------- Submersible ----------
const sub = { root: new THREE.Group(), body: new THREE.Group(), pos: new THREE.Vector3(0, -8, 60), vel: new THREE.Vector3(), yaw: Math.PI, pitch: 0, roll: 0 };
{
  const hullMat = new THREE.MeshPhysicalMaterial({ color: 0xe8a21c, roughness: 0.38, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  sub.body.rotation.y = Math.PI; sub.root.add(sub.body);
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.4, 6, 16), hullMat); hull.rotation.x = Math.PI / 2; hull.castShadow = true; sub.body.add(hull);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0x8fd8ff, transmission: 0.9, roughness: 0.05, thickness: 0.4, transparent: true, opacity: 0.85 })); dome.position.set(0, 0.35, -1.5); sub.body.add(dome);
  for (const sx of [-1, 1]) { const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 10), new THREE.MeshStandardMaterial({ color: 0x2e3440, metalness: 0.6, roughness: 0.4 })); pod.rotation.x = Math.PI / 2; pod.position.set(sx * 1.25, -0.2, 0.6); sub.body.add(pod); const prop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.2), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.3 })); prop.position.set(sx * 1.25, -0.2, 1.5); prop.userData.prop = true; sub.body.add(prop); }
  const lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5d0, emissiveIntensity: 4 })); lampMesh.position.set(0, -0.3, -2.1); sub.body.add(lampMesh);
  const lamp = new THREE.SpotLight(0xfff2cc, 120, 60, 0.5, 0.5, 1.4); lamp.position.set(0, -0.3, -2); lamp.target.position.set(0, -0.6, -40); lamp.castShadow = false; sub.body.add(lamp); sub.body.add(lamp.target);
  scene.add(sub.root);
}
const props = []; sub.root.traverse(o => { if (o.userData.prop) props.push(o); });

// ---------- State ----------
const FISH_FLIP = false;
const S = { mode: 'menu', time: 0, score: 0, air: 100, pearlsGot: 0, depthBest: 0, stings: 0, chain: 0, lastPearl: -99 };
const input = { left: false, right: false, up: false, down: false, dive: false, rise: false };
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['arrowleft', 'a'].includes(k)) input.left = true; if (['arrowright', 'd'].includes(k)) input.right = true; if (['arrowup', 'w'].includes(k)) input.up = true; if (['arrowdown', 's'].includes(k)) input.down = true; if (k === 'q' || k === 'shift') input.rise = true; if (k === 'e' || k === ' ') { input.dive = true; e.preventDefault(); } if (k === 'p' || k === 'escape') togglePause(); if (k === 'enter' && S.mode === 'menu') start(); });
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (['arrowleft', 'a'].includes(k)) input.left = false; if (['arrowright', 'd'].includes(k)) input.right = false; if (['arrowup', 'w'].includes(k)) input.up = false; if (['arrowdown', 's'].includes(k)) input.down = false; if (k === 'q' || k === 'shift') input.rise = false; if (k === 'e' || k === ' ') input.dive = false; });
const touch = $('#touch'); touch.innerHTML = '<button data-k="left" aria-label="Turn left">◀</button><button data-k="dive" aria-label="Dive">▼</button><button data-k="rise" aria-label="Rise">▲</button><button data-k="right" aria-label="Turn right">▶</button>';
touch.querySelectorAll('button').forEach(b => { const k = b.dataset.k; const on = e => { e.preventDefault(); input[k] = true; }; const off = e => { e.preventDefault(); input[k] = false; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
$('#btn-sound').addEventListener('click', () => snd.toggle());
$('#btn-menu').addEventListener('click', () => { if (S.mode === 'playing' || S.mode === 'paused') endGame('Dive ended', 'You surfaced for the menu.'); });
function togglePause() { if (S.mode === 'playing') { S.mode = 'paused'; U.showBanner('Paused', 99999); } else if (S.mode === 'paused') { S.mode = 'playing'; U.showBanner('', 0); } }

const card = $('#start-card');
card.innerHTML = `<p class="lede">A living reef off the Daymaniyat Islands: schools of fish part around your sub, jellyfish drift through the beams and pearls glow in the coral. Air runs down. Bubble vents refill it.</p>
<ul class="facts"><li>Pearls to collect</li><li>Fish that react to you</li><li>Air management</li><li>Best: <b id="best-lbl">${U.best.get()}</b></li></ul>
<div class="field"><span>Air supply</span><div class="seg" id="seg-air"></div></div>
<button class="primary" id="play" type="button"><span>Dive<small>↑ thrust · ←/→ turn · Space dive · Shift rise</small></span><span aria-hidden="true">→</span></button>
<p class="note">Pearls taken quickly in a row score more. Jellyfish stings cost air. Below the reef floor, pressure drains air faster.</p>`;
const getAir = seg($('#seg-air'), [{ value: 'long', label: 'Generous' }, { value: 'normal', label: 'Standard' }, { value: 'short', label: 'Tight' }], 'normal');
$('#play').addEventListener('click', start);
$('#again').addEventListener('click', () => { $('#result').hidden = true; start(); });
$('#to-menu').addEventListener('click', () => { $('#result').hidden = true; $('#start').hidden = false; $('#best-lbl').textContent = U.best.get(); S.mode = 'menu'; U.setHud(null); touch.classList.remove('on'); });
let airRate = 1;
function start() {
  snd.ensure(); airRate = { long: 0.6, normal: 1, short: 1.5 }[getAir()];
  for (const p of pearls) scene.remove(p.group); pearls.length = 0; spawnPearls(28);
  sub.pos.set(0, -8, 60); sub.vel.set(0, 0, 0); sub.yaw = Math.PI; sub.pitch = 0;
  Object.assign(S, { score: 0, air: 100, pearlsGot: 0, depthBest: 0, stings: 0, chain: 0, lastPearl: -99 }); S.mode = 'playing'; $('#start').hidden = true; touch.classList.add('on'); U.showBanner('Find the pearls', 1200); hud();
}
function hud() { U.setHud([['Pearls', `${S.pearlsGot} / 28`], ['Score', Math.round(S.score)], ['Air', Math.max(0, Math.round(S.air)) + '%', 'o2'], ['Depth', Math.round(-sub.pos.y) + ' m', 'speed']]); }
function endGame(title, reason) {
  S.mode = 'over'; const score = Math.round(S.score); const isBest = score > U.best.get(); if (isBest) U.best.set(score);
  $('#result-label').textContent = isBest ? 'New best' : 'Dive over'; $('#result-title').textContent = title; $('#result-reason').textContent = reason;
  $('#result-stats').innerHTML = `<div><small>Score</small><b>${score}</b></div><div><small>Pearls</small><b>${S.pearlsGot}/28</b></div><div><small>Deepest</small><b>${Math.round(S.depthBest)} m</b></div>`;
  $('#result').hidden = false; U.setHud(null); touch.classList.remove('on');
}

// ---------- Sub physics ----------
const fwd = new THREE.Vector3();
function pilot(dt) {
  const coarse = matchMedia('(pointer:coarse)').matches;
  const turn = (input.right ? 1 : 0) - (input.left ? 1 : 0); const thrust = input.up || coarse ? 1 : input.down ? -0.5 : 0;
  const vert = (input.rise ? 1 : 0) - (input.dive ? 1 : 0);
  sub.yaw -= turn * 1.4 * dt; sub.roll = lerp(sub.roll, turn * 0.3, 0.1); sub.pitch = lerp(sub.pitch, -vert * 0.35, 0.08);
  fwd.set(Math.sin(sub.yaw), 0, Math.cos(sub.yaw));
  sub.vel.addScaledVector(fwd, thrust * 14 * dt); sub.vel.y += vert * 9 * dt; sub.vel.multiplyScalar(Math.pow(0.35, dt));
  sub.pos.addScaledVector(sub.vel, dt);
  const fl = floorH(sub.pos.x, sub.pos.z) + 1.6; if (sub.pos.y < fl) { sub.pos.y = fl; sub.vel.y = Math.abs(sub.vel.y) * 0.3; } if (sub.pos.y > -1.5) { sub.pos.y = -1.5; sub.vel.y = -Math.abs(sub.vel.y); }
  const R = 200; if (sub.pos.length() > R) { sub.pos.setLength(R); sub.vel.multiplyScalar(0.5); U.toast('Open water, turn back'); }
  for (const o of obstacles) { const d = sub.pos.clone().sub(o.pos); const L = d.length(); if (L < o.r + 1.2) { sub.pos.addScaledVector(d.normalize(), o.r + 1.2 - L); sub.vel.multiplyScalar(0.6); if (sub.vel.length() > 4) { snd.play(120, 0.15, 'square', 0.1, -60); U.doFlash(); S.air -= 2; } } }
  if (Math.random() < 0.6) bubbles.burst(sub.pos.x - Math.sin(sub.yaw) * 2 + (Math.random() - 0.5) * 0.6, sub.pos.y - 0.2, sub.pos.z - Math.cos(sub.yaw) * 2, 1, 0xe6f8ff, 0.5, 2.2);
  // Air.
  const depth = -sub.pos.y; S.depthBest = Math.max(S.depthBest, depth);
  S.air -= dt * airRate * (1.4 + Math.max(0, depth - 15) * 0.08);
  let nearVent = false; for (const v of vents) if (v.distanceTo(sub.pos) < 5) { nearVent = true; S.air = Math.min(100, S.air + dt * 25); }
  if (nearVent && Math.floor(S.time * 10) % 3 === 0) U.setHint('Refilling air'); else if (S.air < 25) U.setHint('Air low. Find a bubble vent.'); else U.setHint('');
  if (S.air <= 0) { endGame('Out of air', `${S.pearlsGot} pearls, deepest ${Math.round(S.depthBest)} m.`); return; }
  // Pearls.
  for (let i = pearls.length - 1; i >= 0; i--) { const p = pearls[i]; if (p.position.distanceTo(sub.pos) < 2.8) { p.group.remove(p.pearl); pearls.splice(i, 1); S.pearlsGot++; S.chain = (S.time - S.lastPearl < 8) ? S.chain + 1 : 1; S.lastPearl = S.time; const pts = 100 * Math.min(5, S.chain); S.score += pts; bubbles.burst(p.position.x, p.position.y, p.position.z, 30, 0xfff1c8, 5, 1); snd.play(880 + S.chain * 60, 0.2, 'sine', 0.14, 400); U.toast(`Pearl +${pts}${S.chain > 1 ? ' · x' + Math.min(5, S.chain) : ''}`); if (S.pearlsGot >= 28) { endGame('Reef cleared', `Every pearl with ${Math.round(S.air)}% air to spare.`); return; } } }
  // Jellyfish stings.
  for (const j of jellies) if (j.position.distanceTo(sub.pos) < 2.4 && S.time - (j.userData.last || -9) > 2) { j.userData.last = S.time; S.air -= 12; S.stings++; U.doFlash(); snd.play(200, 0.3, 'sawtooth', 0.12, -120); U.toast('Stung! Air -12'); }
  S.score += dt * 2;
}

const clock = new THREE.Clock(); const camPos = new THREE.Vector3(0, -4, 72);
function loop() {
  requestAnimationFrame(loop); const dt = Math.min(0.05, clock.getDelta()); S.time += dt;
  if (S.mode === 'playing') { pilot(dt); if (Math.floor(S.time * 4) % 2 === 0) hud(); }
  else if (S.mode === 'menu' || S.mode === 'over') { sub.yaw = Math.PI + Math.sin(S.time * 0.2) * 0.4; sub.pos.set(Math.sin(S.time * 0.15) * 30, -7 + Math.sin(S.time * 0.5) * 1.5, 40 + Math.cos(S.time * 0.15) * 30); }
  boids(dt);
  sub.root.position.copy(sub.pos); sub.root.rotation.set(0, 0, 0); sub.root.rotateY(sub.yaw); sub.root.rotateX(sub.pitch); sub.root.rotateZ(sub.roll);
  for (const p of props) p.rotation.z += dt * 30;
  jellies.forEach((j, i) => { j.position.y += Math.sin(S.time * 1.2 + j.userData.ph) * dt * 1.5; j.position.x += Math.sin(S.time * 0.3 + i) * dt * 0.8; const pulse = Math.sin(S.time * 2.4 + j.userData.ph); j.children[0].scale.set(1 - pulse * 0.1, 1 + pulse * 0.12, 1 - pulse * 0.1); if (j.position.y > -3) j.position.y = -3; });
  for (const p of pearls) p.pearl.material.emissiveIntensity = 0.2 + Math.max(0, Math.sin(S.time * 2 + p.position.x)) * 0.25;
  for (const v of vents) if (Math.random() < 0.5) bubbles.burst(v.x + (Math.random() - 0.5) * 2, v.y + 1, v.z + (Math.random() - 0.5) * 2, 1, 0xd9f6ff, 0.3, 3);
  bubbles.update(dt, 0.99, -2.2);
  causTex.offset.set(Math.sin(S.time * 0.21) * 0.08 + S.time * 0.01, S.time * 0.02);
  sunLt.position.set(sub.pos.x + 30, 90, sub.pos.z + 20); sunLt.target.position.copy(sub.pos);
  // Colour the fog with depth.
  const t = clamp((-sub.pos.y) / 30, 0, 1); scene.fog.color.copy(SHALLOW).lerp(DEEP, t); scene.background.copy(scene.fog.color);
  const back = new THREE.Vector3(Math.sin(sub.yaw), 0, Math.cos(sub.yaw)).multiplyScalar(-10); back.y = 3;
  camPos.lerp(sub.pos.clone().add(back), 1 - Math.pow(0.002, dt));
  camera.position.copy(camPos); camera.lookAt(sub.pos.x, sub.pos.y + 0.5, sub.pos.z); camera.rotateZ(Math.sin(S.time * 0.5) * 0.01);
  composer.render();
}
loadFish().catch(e => console.warn('fish', e)).finally(() => { document.body.classList.add('is-ready'); load.done(); }); loop();
