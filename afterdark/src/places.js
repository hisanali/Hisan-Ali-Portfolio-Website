// Places beyond the city: harbour, lighthouse, fuel station, stadium, summit lookout, a suburb and a mountain village.
// Everything is assembled from instanced boxes and cylinders plus the small photo-textured houses from the city kit.
import * as THREE from '/evermile/vendor/three.module.js';
import { rng, splitChunks, kitMaterial } from './city.js';
import { loadGLB } from './car.js';
import { buildAirfield, buildFuelStation } from './landmarks.js';

export async function buildPlaces(scene, city, world, Q) {
  const R = rng(3131), dummy = new THREE.Object3D(), col = new THREE.Color(), out = { markers: [], update: () => {}, setTime: () => {} };
  const boxes = [], cyls = [], glows = [], solid = city.colliders;
  // local frame of a place: u along the road, v away from it
  const at = (pl, u, v) => [pl.x + pl.ux * u + pl.vx * v, pl.z + pl.uz * u + pl.vz * v];
  const box = (x, y, z, sx, sy, sz, yaw, c, hard = true) => { boxes.push([x, y, z, sx, sy, sz, yaw, c]); if (hard && sy > 1.2) { const r = Math.min(sx, sz) / 2, n = Math.max(1, Math.round(Math.max(sx, sz) / (r * 1.6))), long = sx >= sz, dx = long ? Math.cos(yaw) : Math.sin(yaw), dz = long ? -Math.sin(yaw) : Math.cos(yaw), len = Math.max(sx, sz) - r * 2; for (let k = 0; k < n; k++) { const t = n === 1 ? 0 : (k / (n - 1) - 0.5) * len; solid.push({ x: x + dx * t, z: z + dz * t, r: r * 1.04 }); } } };
  const cyl = (x, y, z, r, h, c, rTop = r, hard = true) => { cyls.push([x, y, z, r, h, c, rTop]); if (hard) solid.push({ x, z, r: r * 1.03 }); };
  const glow = (x, y, z, sx, sy, sz, yaw, c, k) => glows.push([x, y, z, sx, sy, sz, yaw, c, k]);
  const place = k => world.places.find(p => p.key === k);
  const beams = [];

  // ---- Harbour: quay sheds, container stacks, gantry cranes, tanks, a pier with boats ----
  { const pl = place('harbour'), y = pl.y, yaw = pl.yaw, CC = [0xb23a2e, 0x2f6fb2, 0x2e8f5a, 0xd9a321, 0x8a8f96, 0xe9e4d8, 0x5b3f8f];
    for (let k = 0; k < 3; k++) { const [x, z] = at(pl, -46 + k * 46, -30); box(x, y + 5, z, 40, 10, 20, yaw, [0x6f7b86, 0x8a5a3c, 0x59646d][k]); box(x, y + 10.6, z, 41, 1.2, 21, yaw, 0x3a3f45, false); glow(x + pl.vx * 10.1, y + 6.2, z + pl.vz * 10.1, 12, 0.5, 0.2, yaw, 0xfff0c8, 1.6); }
    for (let row = 0; row < 4; row++) for (let n = 0; n < 9; n++) { const h = 1 + Math.floor(R() * 3), [x, z] = at(pl, -52 + n * 13, 8 + row * 6.2); for (let s = 0; s < h; s++) box(x, y + 1.3 + s * 2.6, z, 12.2, 2.6, 2.44, yaw, CC[Math.floor(R() * CC.length)], s === 0); }
    for (const u of [-34, 26]) { const [x, z] = at(pl, u, 52); for (const du of [-9, 9]) for (const dv of [-7, 7]) { const [lx, lz] = at(pl, u + du, 52 + dv); box(lx, y + 15, lz, 1.4, 30, 1.4, yaw, 0xd9a321); }
      box(x, y + 30.6, z, 20, 2.2, 16, yaw, 0xd9a321, false); const [bx, bz] = at(pl, u, 66); box(bx, y + 33, bz, 3, 2.4, 64, yaw, 0xc0392b, false); const [cx, cz] = at(pl, u, 52); box(cx, y + 33.6, cz, 5, 4, 6, yaw, 0xe9e4d8, false); glow(bx, y + 31.6, bz, 1, 0.3, 30, yaw, 0xfff0c8, 2.2); beams.push([bx, y + 40, bz]); }
    for (let k = 0; k < 3; k++) { const [x, z] = at(pl, 52 - k * 2, -58 + k * 17); cyl(x, y + 5.5, z, 7.5, 11, 0xe7e9ea); }
    for (const k of [0, 1]) { const [x, z] = at(pl, -64 + k * 8, -56); cyl(x, y + 20, z, 1.5, 40, 0x9a8f88, 1.0); beams.push([x, y + 40.5, z]); }
    // pier and boats
    const [px, pz] = at(pl, -8, pl.r + 44); box(px, y - 0.25, pz, 7, 0.5, 96, yaw, 0x6b5642, false); for (let k = 0; k < 9; k++) for (const e of [-3, 3]) { const [qx, qz] = at(pl, -8 + e, pl.r + 2 + k * 11); cyl(qx, y - 3, qz, 0.28, 6, 0x3d3127, 0.28, false); }
    for (let k = 0; k < 8; k++) { const side = k % 2 ? 1 : -1, [bx, bz] = at(pl, -8 + side * 9, pl.r + 14 + Math.floor(k / 2) * 21), L = 9 + R() * 5; box(bx, -0.1, bz, 3.2, 1.3, L, yaw, [0xf2f2f0, 0x1f3a5f, 0xf2f2f0, 0x7a1f24][k % 4], false); box(bx, 1.1, bz - pl.vz * 0 + 0, 2.3, 1.3, L * 0.38, yaw, 0xfafafa, false); cyl(bx, 4.2, bz, 0.07, 7, 0xd8d8d8, 0.05, false); }
    for (let k = 0; k < 6; k++) { const [x, z] = at(pl, -60 + k * 24, -4); cyl(x, y + 4.5, z, 0.12, 9, 0x24272c, 0.09); glow(x, y + 9, z, 1.2, 0.12, 0.5, yaw, 0xffd6a0, 4); }
    out.markers.push(pl); }

  // ---- Lighthouse on the point ----
  let lamp = null;
  { const pl = place('lighthouse'), y = pl.y; cyl(pl.x, y + 9, pl.z, 3.3, 18, 0xf4f1ea, 2.7); cyl(pl.x, y + 3, pl.z, 3.5, 6, 0xb3261e, 3.3, false); cyl(pl.x, y + 14, pl.z, 2.95, 4, 0xb3261e, 2.75, false);
    cyl(pl.x, y + 18.4, pl.z, 3.6, 0.5, 0x25282d, 3.6, false); cyl(pl.x, y + 20.1, pl.z, 1.7, 2.9, 0x2a2d32, 1.7, false); cyl(pl.x, y + 22.2, pl.z, 2.1, 1.4, 0xb3261e, 0.2, false);
    const [hx, hz] = at(pl, 10, -4); box(hx, y + 2.4, hz, 9, 4.8, 7, pl.yaw, 0xf4f1ea); box(hx, y + 5.3, hz, 9.6, 1.0, 7.6, pl.yaw, 0x8a3a2c, false);
    lamp = new THREE.Group(); lamp.position.set(pl.x, y + 20.1, pl.z); const bm = new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: { uK: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'uniform float uK; varying vec2 vUv; void main(){ gl_FragColor = vec4(vec3(1.0, 0.95, 0.8) * pow(vUv.y, 1.6) * 0.5 * uK, 1.0); }' });
    for (const s of [0, Math.PI]) { const g = new THREE.ConeGeometry(11, 170, 20, 1, true); g.translate(0, -85, 0); g.rotateX(-Math.PI / 2 + 0.02); const m = new THREE.Mesh(g, bm); m.rotation.y = s; m.frustumCulled = false; lamp.add(m); }
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.6, 2.6) })); lamp.add(bulb); scene.add(lamp); lamp.userData.mat = bm; out.markers.push(pl); }

  const fuel = place('petrol'), airfield = place('airport');
  const fuelTime = await buildFuelStation(scene, city, world, fuel);
  const airfieldTime = buildAirfield(scene, city, world, airfield);
  out.markers.push(fuel, airfield);

  // ---- Stadium: a bowl of stands round a pitch, with floodlight masts ----
  { const pl = place('stadium'), y = pl.y, A = 74, B = 56, N = 30; for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2, ex = Math.cos(a) * A, ez = Math.sin(a) * B, [x, z] = at(pl, ex, ez), tang = Math.atan2(-Math.sin(a) * A * pl.ux + Math.cos(a) * B * pl.vx, -Math.sin(a) * A * pl.uz + Math.cos(a) * B * pl.vz);
      box(x, y + 9, z, 15.5, 18, 15, tang + Math.PI / 2, 0x8f9499); const [ix, iz] = at(pl, ex * 0.9, ez * 0.9); box(ix, y + 6.2, iz, 15.5, 9, 4, tang + Math.PI / 2, [0x1e5aa8, 0xc8201a][k % 6 < 3 ? 0 : 1], false); box(x, y + 18.6, z, 16, 1.2, 17, tang + Math.PI / 2, 0xe6e8ea, false); }
    box(pl.x, y + 0.03, pl.z, 104, 0.06, 66, pl.yaw + Math.PI / 2, 0x2f7a3a, false); for (const u of [-52, 0, 52]) { const [lx, lz] = at(pl, u, 0); box(lx, y + 0.07, lz, 0.5, 0.02, 66, pl.yaw, 0xf2f2f2, false); }
    for (const [u, v] of [[-84, -64], [84, -64], [-84, 64], [84, 64]]) { const [x, z] = at(pl, u, v); cyl(x, y + 22, z, 0.7, 44, 0x9aa0a6, 0.45); glow(x, y + 44.5, z, 7, 4, 1, Math.atan2(pl.x - x, pl.z - z), 0xf4f8ff, 5); beams.push([x, y + 47.5, z]); }
    out.markers.push(pl); }

  // ---- Summit lookout: lay-by, hut and a radio mast ----
  { const pl = place('summit'), y = pl.y, yaw = pl.yaw; const [mx, mz] = at(pl, 8, 12); cyl(mx, y + 34, mz, 0.5, 68, 0xd8d8d8, 0.16); for (let k = 0; k < 9; k++) { box(mx, y + 6 + k * 7, mz, 3.6 - k * 0.3, 0.16, 0.16, yaw + k * 0.7, k % 2 ? 0xc8201a : 0xf2f2f2, false); box(mx, y + 6 + k * 7, mz, 0.16, 0.16, 3.6 - k * 0.3, yaw + k * 0.7, k % 2 ? 0xc8201a : 0xf2f2f2, false); } beams.push([mx, y + 68.5, mz], [mx, y + 40, mz]);
    const [hx, hz] = at(pl, -9, 14); box(hx, y + 1.7, hz, 7, 3.4, 5, yaw, 0x6b5642); box(hx, y + 3.7, hz, 7.8, 0.5, 5.8, yaw, 0x3a2e24, false); glow(hx - pl.vx * 2.55, y + 1.7, hz - pl.vz * 2.55, 2.2, 1.2, 0.1, yaw, 0xffd9a0, 1.3);
    for (let k = -5; k <= 5; k++) { const [x, z] = at(pl, k * 5, 27); box(x, y + 0.55, z, 0.14, 1.1, 0.14, yaw, 0x3a2e24, false); } const [rx, rz] = at(pl, 0, 27); box(rx, y + 1.05, rz, 50, 0.12, 0.12, yaw, 0x3a2e24, false); out.markers.push(pl); }

  // ---- Houses: a suburb on the valley road and a village on the mountain ----
  try { const kit = await loadGLB('/evermile/assets/models/city-kit.glb?v=maps2'); kit.scene.updateMatrixWorld(true);
    const names = ['c7-00', 'c7-01', 'c7-02', 'c7-03', 'c7-04', 'c7-09', 'c7-11', 'c7-15'], kinds = names.map(n => kit.scene.getObjectByName(n)).filter(Boolean).map(node => { const bb = new THREE.Box3().setFromObject(node), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3()), fix = new THREE.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z), parts = []; node.traverse(o => { if (o.isMesh) parts.push({ geo: o.geometry, mat: kitMaterial(o.material, city.litU), local: fix.clone().multiply(o.matrixWorld) }); }); return { w: sz.x, d: sz.z, h: sz.y, parts, uses: [] }; });
    for (const st of world.strips) { const old = st.key === 'oldtown'; for (let i = st.i0 + 10; i < st.i1 - 10; i += old ? 7 : 8) { const s = world.samples[i]; if (s.bridge || s.tunnel) continue; for (const side of [-1, 1]) { if (R() < (old ? 0.08 : 0.18)) continue; const k = kinds[Math.floor(R() * kinds.length)], off = 6 + (old ? 4.5 : 9) + k.d / 2 + R() * (old ? 1.5 : 3), x = s.x + s.lx * side * off, z = s.z + s.lz * side * off, yaw = Math.atan2(-s.lx * side, -s.lz * side);
          k.uses.push([x, world.terrain(x, z) - 0.15, z, yaw]); const r = Math.min(k.w, k.d) / 2; solid.push({ x, z, r: r * 1.05 }); if (R() < 0.5) { const lx = s.x + s.lx * side * 7.6, lz = s.z + s.lz * side * 7.6; cyl(lx, s.y + 3, lz, 0.09, 6, 0x24272c, 0.07); glow(lx, s.y + 6, lz, 0.9, 0.1, 0.4, yaw, 0xffd6a0, 4); } } }
      if (st.key === 'village') { const s = world.samples[Math.round((st.i0 + st.i1) / 2)], x = s.x + s.lx * 30, z = s.z + s.lz * 30, y = world.terrain(x, z), yaw = Math.atan2(s.tx, s.tz); box(x, y + 4.5, z, 9, 9, 16, yaw, 0xe9e4d8); box(x, y + 9.6, z, 9.6, 1.2, 16.6, yaw, 0x6b3a2c, false); const tx = x + s.tx * 9.5, tz = z + s.tz * 9.5; box(tx, y + 10, tz, 5, 20, 5, yaw, 0xe9e4d8); cyl(tx, y + 23.5, tz, 3.4, 7, 0x4a3a34, 0.1, false); glow(tx - s.lx * 2.55, y + 14, tz - s.lz * 2.55, 1.4, 2.2, 0.1, yaw + Math.PI / 2, 0xffd9a0, 1.2); }
      if (old) { // a clock tower on a small square, lit at night
        const s = world.samples[Math.round((st.i0 + st.i1) / 2)], x = s.x + s.lx * 24, z = s.z + s.lz * 24, y = world.terrain(x, z), yaw = Math.atan2(s.tx, s.tz); box(x, y + 0.2, z, 22, 0.4, 22, yaw, 0xb9b2a4, false); box(x, y + 13, z, 5.4, 26, 5.4, yaw, 0xd9cfbd); box(x, y + 26.6, z, 6.4, 1.2, 6.4, yaw, 0x7a4a36, false); cyl(x, y + 30, z, 2.6, 6, 0x5a3a2e, 0.1, false);
        for (const q of [0, 1, 2, 3]) { const a = yaw + q * Math.PI / 2; glow(x + Math.sin(a) * 2.75, y + 21.5, z + Math.cos(a) * 2.75, 2.6, 2.6, 0.1, a, 0xfff0c8, 1.6); } solid.push({ x, z, r: 3.4 }); }
      out.markers.push(st); }
    for (const k of kinds) { if (!k.uses.length) continue; for (const part of k.parts) { const im = new THREE.InstancedMesh(part.geo, part.mat, k.uses.length), m4 = new THREE.Matrix4(); k.uses.forEach((u, n) => { dummy.position.set(u[0], u[1], u[2]); dummy.rotation.set(0, u[3], 0); dummy.scale.set(1.25, 1.25, 1.25); dummy.updateMatrix(); im.setMatrixAt(n, m4.multiplyMatrices(dummy.matrix, part.local)); }); im.castShadow = im.receiveShadow = true; scene.add(im); splitChunks(im, 900, city.chunks, 640); } }
    out.houses = kinds.reduce((a, k) => a + k.uses.length, 0); } catch (e) { console.warn('houses unavailable', e); }
  dummy.scale.set(1, 1, 1);

  // ---- Instancing ----
  const bM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.1, envMapIntensity: 0.6 });
  const bI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bM, boxes.length); boxes.forEach((b, k) => { dummy.position.set(b[0], b[1], b[2]); dummy.rotation.set(0, b[6], 0); dummy.scale.set(b[3], b[4], b[5]); dummy.updateMatrix(); bI.setMatrixAt(k, dummy.matrix); bI.setColorAt(k, col.set(b[7])); }); bI.castShadow = bI.receiveShadow = true; scene.add(bI); splitChunks(bI, 1400, city.chunks, 640);
  // cylinders differ in taper, so each distinct taper gets its own geometry
  const byT = new Map(); for (const c of cyls) { const key = (c[6] / c[3]).toFixed(2); (byT.get(key) || byT.set(key, []).get(key)).push(c); }
  for (const [key, list] of byT) { const cI = new THREE.InstancedMesh(new THREE.CylinderGeometry(+key, 1, 1, 14), bM, list.length); list.forEach((c, k) => { dummy.position.set(c[0], c[1], c[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(c[3], c[4], c[3]); dummy.updateMatrix(); cI.setMatrixAt(k, dummy.matrix); cI.setColorAt(k, col.set(c[5])); }); cI.castShadow = true; scene.add(cI); splitChunks(cI, 1600, city.chunks, 640); }
  const gM = new THREE.MeshBasicMaterial({ color: 0xffffff }), gI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), gM, glows.length); glows.forEach((g, k) => { dummy.position.set(g[0], g[1], g[2]); dummy.rotation.set(0, g[6], 0); dummy.scale.set(g[3], g[4], g[5]); dummy.updateMatrix(); gI.setMatrixAt(k, dummy.matrix); gI.setColorAt(k, col.set(g[7]).multiplyScalar(g[8])); }); scene.add(gI); splitChunks(gI, 2200, city.chunks, 640);
  dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
  // red aircraft-warning lights on tall structures
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(beams.flat(), 3)); const warn = new THREE.Points(bg, new THREE.PointsMaterial({ size: 7, map: city.dot, color: new THREE.Color(3, 0.15, 0.1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); warn.frustumCulled = false; scene.add(warn);
  out.setTime = e => { fuelTime(e); airfieldTime(e); gM.color.setScalar(0.35 + 0.65 * e.night); if (lamp) { lamp.userData.mat.uniforms.uK.value = e.night; lamp.children[0].visible = lamp.children[1].visible = e.night > 0.05; } };
  out.update = t => { if (lamp) lamp.rotation.y = t * 0.55; warn.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.4)); };
  out.stats = { boxes: boxes.length, cylinders: cyls.length, lights: glows.length, houses: out.houses, places: out.markers.map(m => m.name) };
  return out;
}
