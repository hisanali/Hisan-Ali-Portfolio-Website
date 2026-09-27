/*
  Prepare the supplied Toyota GR Corolla and Land Cruiser 300 for Evermile.

  Needs Node 18+ with @gltf-transform/core, @gltf-transform/extensions, @gltf-transform/functions, meshoptimizer,
  draco3dgltf and sharp installed where it runs (they are not site dependencies):

    npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer draco3dgltf sharp
    node scripts/evermile/import-toyotas.mjs

  Each car is turned to face +Z with +Y up, scaled to its real length, centred on the ground, and its wheels are
  gathered into Wheel_FL/FR/RL/RR groups (tyre, rim and disc turn; calipers are named so the rig keeps them still).
  Paint is renamed BodyPaint so the game can recolour it, the window glass EXT_Glass and the tail lamps TailLens_*.
  Transmission glass (an extra full render pass in three.js) becomes ordinary transparent glass. Dense meshes are
  simplified, textures resized to 1024 px WebP, and geometry Draco-compressed.
*/
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, prune, weld, simplifyPrimitive, textureCompress, draco, getBounds} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), SRC = path.join(ROOT, 'scripts/evermile/source/imported');
const CARS = [
  {src: '2023_toyota_gr_corolla.glb', out: 'car-gr-corolla.glb', length: 4.41, turn: Math.PI / 2, wheel: /^wheel/i, caliper: /^calliper/i,
    paint: ['paint'], glass: ['glass_2'], tail: ['red_glass']},
  {src: '2022_toyota_land_cruiser_300_vxr.glb', out: 'car-land-cruiser.glb', length: 4.985, turn: 0, wheel: /^T:W[1-4]$/, caliper: null,
    paint: ['TMI_1350010001_044'], glass: ['TMI_Glass_011'], tail: ['phong1']},
];

await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule()});
const tris = (doc) => doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().reduce((a, p) => a + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0), 0);
const centre = (b) => b.min.map((v, i) => (v + b.max[i]) / 2);

for (const car of CARS) {
  const doc = await io.read(path.join(SRC, car.src)), root = doc.getRoot(), scene = root.listScenes()[0], before = tris(doc);

  // One root node carries the turn, the scale and the centring.
  const rig = doc.createNode('Vehicle');
  for (const child of scene.listChildren()) { scene.removeChild(child); rig.addChild(child); }
  scene.addChild(rig);
  rig.setRotation([0, Math.sin(car.turn / 2), 0, Math.cos(car.turn / 2)]);
  let b = getBounds(rig); const s = car.length / (b.max[2] - b.min[2]); rig.setScale([s, s, s]);
  b = getBounds(rig); const c = centre(b); rig.setTranslation([-c[0], -b.min[1], -c[2]]);

  // Wheels: name each group by where it sits (+Z front, +X left), with the tyre mesh on its own child.
  const wheels = [];
  for (const node of root.listNodes()) {
    if (!car.wheel.test(node.getName())) continue;
    const [x, , z] = centre(getBounds(node)), key = (z > 0 ? 'F' : 'R') + (x > 0 ? 'L' : 'R');
    node.setName('Wheel_' + key); wheels.push({node, x, z, key});
    if (node.getMesh()) { const tyre = doc.createNode('Tyre').setMesh(node.getMesh()); node.setMesh(null); node.addChild(tyre); }
    node.traverse((n) => { const mat = n.getMesh()?.listPrimitives()[0].getMaterial()?.getName() || ''; if (/tyre/i.test(mat)) n.setName('Tyre'); });
    // Brake pieces much shorter than the wheel are calipers: they steer but do not spin.
    const height = (q) => { const bb = getBounds(q); return bb.max[1] - bb.min[1]; }, wheelHeight = height(node);
    node.traverse((n) => { const mat = n.getMesh()?.listPrimitives()[0].getMaterial()?.getName() || ''; if (n.getMesh() && /brake/i.test(mat) && height(n) < wheelHeight * .42) n.setName('Caliper'); });
  }
  if (wheels.length !== 4 || new Set(wheels.map((w) => w.key)).size !== 4) throw new Error(`${car.src}: expected four distinct wheels, found ${wheels.map((w) => w.key)}`);
  // Separate calipers join the wheel they sit in (kept at the same place in the world).
  if (car.caliper) for (const node of root.listNodes().filter((n) => car.caliper.test(n.getName()))) {
    const [x, , z] = centre(getBounds(node)), w = wheels.reduce((best, q) => (Math.hypot(q.x - x, q.z - z) < Math.hypot(best.x - x, best.z - z) ? q : best));
    node.setName('Caliper_' + w.key); node.traverse((n) => { if (n.getMesh()) n.setName('Caliper'); });
  }

  // Materials the game drives: recolourable paint, window glass it can fade, tail lamps that light when braking.
  for (const m of root.listMaterials()) {
    const name = m.getName(), transmission = m.getExtension('KHR_materials_transmission');
    if (transmission) {
      m.setExtension('KHR_materials_transmission', null);
      const [r, g, bl, a] = m.getBaseColorFactor(); m.setBaseColorFactor([r, g, bl, Math.max(a, .2)]).setAlphaMode('BLEND');
    }
    if (car.paint.includes(name)) m.setName('BodyPaint');
    if (car.glass.includes(name)) m.setName('EXT_Glass').setBaseColorFactor([.12, .16, .18, .42]).setAlphaMode('BLEND').setMetallicFactor(.2).setRoughnessFactor(.06);
    if (car.tail.includes(name)) m.setName('TailLens_' + name).setBaseColorFactor([.55, .02, .02, .82]).setAlphaMode('BLEND').setEmissiveFactor([.6, .01, .01]).setRoughnessFactor(.12);
  }
  for (const e of root.listExtensionsUsed()) if (e.extensionName === 'KHR_materials_transmission' && !root.listMaterials().some((m) => m.getExtension(e.extensionName))) e.dispose();

  // Fewer triangles where they cannot be seen: tyre treads and dense trim lose the most.
  await doc.transform(dedup(), prune(), weld());
  for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
    const n = (prim.getIndices() ? prim.getIndices().getCount() : prim.getAttribute('POSITION').getCount()) / 3;
    if (n < 4000) continue;
    const ratio = n > 30000 ? .24 : n > 12000 ? .42 : .62;
    simplifyPrimitive(prim, {simplifier: MeshoptSimplifier, ratio, error: .0012, lockBorder: false});
  }
  await doc.transform(prune(), textureCompress({encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88}), draco({method: 'edgebreaker', quantizePosition: 14}));
  root.getAsset().extras = {...root.getAsset().extras, evermile: 'Prepared by scripts/evermile/import-toyotas.mjs'};
  const out = path.join(ROOT, 'evermile/assets/models', car.out);
  await io.write(out, doc);
  console.log(`${car.out}: ${Math.round(before / 1000)}k -> ${Math.round(tris(doc) / 1000)}k triangles, wheels ${wheels.map((w) => w.key).join(' ')}`);
}
