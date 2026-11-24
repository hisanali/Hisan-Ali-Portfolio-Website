// Real buildings assembled from the Poly Haven "Modular Factory Facade" kit (CC0): brick wall panels on a 3 m grid with
// their own window and door inserts, a stone base, dado band, cornices between floors, a crown along the parapet and
// corner piers. Every piece is instanced, so a street of warehouses costs a handful of draw calls.
import * as THREE from '/evermile/vendor/three.module.js';
import { loadGLB } from './car.js';
import { splitChunks } from './city.js';

const BAY = 3, FLOOR = 3, BASE = 0.75, DADO = 0.55;
// wall panels and the insert that fills each one's opening
const PAIRS = { door: ['wall_door_centered_large_01', 'door_centered_large_01'], tall: ['wall_window_tall_large_01', 'window_tall_large_01'],
  large: ['wall_window_centered_large_01', 'window_centered_large_01'], medium: ['wall_window_centered_medium_02', 'window_centered_medium_02'], plain: ['wall_standard_standard_01'] };

export async function loadFactoryKit(url = '/afterdark/assets/props/kit_factory.glb') {
  const g = await loadGLB(url); g.scene.updateMatrixWorld(true);
  const nodes = new Map(); for (const o of g.scene.children) nodes.set(o.name, o);
  const box = new THREE.Box3(), origin = n => { box.setFromObject(nodes.get(n)); return new THREE.Vector3(box.min.x, box.min.y, 0); };
  const pieces = {}, lists = new Map(), glass = [];
  // a piece: its meshes, each with a matrix that puts the piece's grid corner at the origin
  const piece = (name, o) => { const node = nodes.get(name); if (!node) return null; const parts = []; const shift = new THREE.Matrix4().makeTranslation(-o.x, -o.y, -o.z);
    node.traverse(m => { if (!m.isMesh) return; const mat = m.material; mat.envMapIntensity = 0.6; if (/glass/i.test(mat.name)) { mat.roughness = 0.08; mat.metalness = 0.1; mat.envMapIntensity = 1.3; glass.push(mat); } parts.push({ geo: m.geometry, mat, m: new THREE.Matrix4().multiplyMatrices(shift, m.matrixWorld) }); });
    return { parts }; };
  for (const [key, [wall, insert]] of Object.entries(PAIRS)) { const o = origin(wall); pieces[key] = [piece(wall, o), insert ? piece(insert, o) : null].filter(Boolean); }
  for (const n of ['base_standard_standard_01', 'dado_standard_standard_01', 'cornice01_standard_standard_01', 'crown_standard_standard_01']) pieces[n] = [piece(n, origin(n))];
  for (const n of ['crown_pier_corner_01', 'dado_pier_corner_01']) { box.setFromObject(nodes.get(n)); const c = box.getCenter(new THREE.Vector3()); pieces[n] = [piece(n, new THREE.Vector3(c.x, box.min.y, c.z))]; }
  const put = (key, m) => { for (const p of pieces[key] || []) for (const part of p.parts) { const k = part; if (!lists.has(k)) lists.set(k, []); lists.get(k).push(new THREE.Matrix4().multiplyMatrices(m, part.m)); } };
  const roofM = new THREE.MeshStandardMaterial({ color: 0x55534f, roughness: 0.95 }), roofs = [];
  const T = new THREE.Matrix4(), S = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);

  const kit = {
    glass,
    // A rectangular building: length (local x) by depth (local z) in bays, `floors` storeys, front door bays on the long sides.
    building({ x, y, z, yaw, bays, depth, floors, seed = 1 }) {
      const L = bays * BAY, D = depth * BAY, top = BASE + DADO + floors * FLOOR, R = (() => { let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
      const world = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, yaw), new THREE.Vector3(1, 1, 1));
      // the four faces: origin of the facade's left end and the turn that points its outside (+z) away from the building
      const faces = [[-L / 2, D / 2, 0, bays], [L / 2, D / 2, Math.PI / 2, depth], [L / 2, -D / 2, Math.PI, bays], [-L / 2, -D / 2, -Math.PI / 2, depth]];
      for (const [fx, fz, turn, n] of faces) {
        const face = new THREE.Matrix4().multiplyMatrices(world, new THREE.Matrix4().compose(new THREE.Vector3(fx, 0, fz), q.setFromAxisAngle(up, turn), new THREE.Vector3(1, 1, 1)));
        const door = n >= 5 ? Math.floor(n / 2) : -1;
        for (let i = 0; i < n; i++) { const at = (h) => new THREE.Matrix4().multiplyMatrices(face, T.makeTranslation(i * BAY, h, 0));
          put('base_standard_standard_01', at(0)); put('dado_standard_standard_01', at(BASE));
          for (let f = 0; f < floors; f++) { const h = BASE + DADO + f * FLOOR, edge = i === 0 || i === n - 1;
            const key = f === 0 ? (i === door ? 'door' : edge ? 'plain' : 'tall') : edge ? 'plain' : R() < 0.75 ? 'large' : 'medium';
            put(key, at(h)); if (f < floors - 1) put('cornice01_standard_standard_01', at(h + FLOOR - 0.08)); }
          put('crown_standard_standard_01', at(top)); } }
      for (const [cx, cz] of [[-L / 2, D / 2], [L / 2, D / 2], [L / 2, -D / 2], [-L / 2, -D / 2]]) { const at = h => new THREE.Matrix4().multiplyMatrices(world, T.makeTranslation(cx, h, cz)); put('crown_pier_corner_01', at(top)); put('dado_pier_corner_01', at(BASE)); }
      roofs.push(new THREE.Matrix4().multiplyMatrices(world, new THREE.Matrix4().compose(new THREE.Vector3(0, top - 0.15, 0), new THREE.Quaternion(), new THREE.Vector3(L - 0.05, 0.3, D - 0.05))));
      return { top, L, D };
    },
    build(scene, chunks, maxDist = 1800) {
      for (const [part, list] of lists) { const im = new THREE.InstancedMesh(part.geo, part.mat, list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = true; im.receiveShadow = true; scene.add(im); splitChunks(im, maxDist, chunks, 400); }
      if (roofs.length) { const rm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), roofM, roofs.length); roofs.forEach((m, i) => rm.setMatrixAt(i, m)); rm.castShadow = rm.receiveShadow = true; scene.add(rm); splitChunks(rm, maxDist, chunks, 400); }
    },
    setNight(k) { for (const m of glass) { m.emissive ||= new THREE.Color(); m.emissive.setRGB(1, 0.78, 0.5); m.emissiveIntensity = 0.35 * k; } }
  };
  return kit;
}
