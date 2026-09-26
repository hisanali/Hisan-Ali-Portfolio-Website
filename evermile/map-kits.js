import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';

/*
  The supplied street and forest scenes, split into kits by scripts/evermile/import-maps.py:
  city-kit.glb   one root node per building (footprint centred, ground at 0, front facing +Z), with w/d/h/kind extras.
  forest-kit.glb pines, spruces, boulders and undergrowth, planted as instances.
  Geometry is shared by every chunk that uses it and never disposed with one.
*/
const scratch = new T.Object3D(), matrix = new T.Matrix4();
export class MapKits {
 constructor(world) {
  this.buildings = []; this.forest = {}; this.errors = []; this.ready = {city: false, forest: false};
  const loader = new GLTFLoader(), done = (key) => { this.ready[key] = true; for (const g of world.chunks.values()) g.userData.stale = true; };
  loader.load(new URL('./assets/models/city-kit.glb?v=maps2', import.meta.url).href, (g) => {
   for (const node of g.scene.children) {
    const e = node.userData || {};
    node.position.set(0, 0, 0); node.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.shared = true; } });
    this.buildings.push({node, kind: e.kind || 'low', w: e.w || 10, d: e.d || 10, h: e.h || 8});
   }
   done('city');
  }, undefined, (e) => { this.errors.push('city'); console.warn('City kit unavailable', e.message); });
  loader.load(new URL('./assets/models/forest-kit.glb?v=maps2', import.meta.url).href, (g) => {
   for (const node of g.scene.children) {
    const parts = [];
    node.updateMatrixWorld(true);
    node.traverse((o) => {
     if (!o.isMesh) return;
     // Photo cards are cut out, lit from both sides and sway-free; boulders stay solid.
     const m = o.material;
     if (node.name.startsWith('boulder')) { m.alphaTest = 0; m.transparent = false; }
     else if (m.alphaTest > 0 || m.transparent) { m.transparent = false; m.alphaTest = Math.max(m.alphaTest, .45); m.side = T.DoubleSide; m.depthWrite = true; }
     parts.push({geometry: o.geometry, material: m, matrix: new T.Matrix4().copy(node.matrixWorld).invert().multiply(o.matrixWorld)});
    });
    this.forest[node.name] = {parts, h: node.userData?.h || 10};
   }
   done('forest');
  }, undefined, (e) => { this.errors.push('forest'); console.warn('Forest kit unavailable', e.message); });
 }
 // A building of one of these kinds, chosen by rng, or null before the kit has arrived.
 pick(kinds, rng, maxWidth = Infinity) {
  const list = this.buildings.filter((b) => kinds.includes(b.kind) && b.w <= maxWidth);
  return list.length ? list[Math.floor(rng() * list.length)] : null;
 }
 place(b, group, x, y, z, yaw) { const root = new T.Group(); root.add(b.node.clone(true)); root.position.set(x, y, z); root.rotation.y = yaw; group.add(root); return root; }
 // items: [{name, p:[x,y,z], yaw, s}] -> one InstancedMesh per prototype part.
 plant(group, items, shadows = true) {
  const byName = new Map();
  for (const it of items) { if (!this.forest[it.name]) continue; if (!byName.has(it.name)) byName.set(it.name, []); byName.get(it.name).push(it); }
  for (const [name, list] of byName) for (const part of this.forest[name].parts) {
   const mesh = new T.InstancedMesh(part.geometry, part.material, list.length);
   list.forEach((it, i) => { scratch.position.set(...it.p); scratch.rotation.set(0, it.yaw || 0, 0); scratch.scale.setScalar(it.s || 1); scratch.updateMatrix(); matrix.multiplyMatrices(scratch.matrix, part.matrix); mesh.setMatrixAt(i, matrix); });
   mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = shadows; mesh.receiveShadow = true; mesh.computeBoundingSphere(); group.add(mesh);
  }
 }
}
