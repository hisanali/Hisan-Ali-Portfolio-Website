// Each pair of amber lenses turns with its vehicle. Instance transforms keep
// their width and orientation attached to the body when viewed from the side.
import * as THREE from '/evermile/vendor/three.module.js';

import { lampRole } from './vehicle-lamps.js';

// Find the lens surface nearest each outer lamp corner in the model's own geometry.
export function indicatorAnchors(model, escalade, bounds = new THREE.Box3().setFromObject(model, true)) {
  const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const targets = [], anchors = [], distances = [], vertex = new THREE.Vector3();
  const fallback = [], fallbackDistance = [];
  for (const side of [-1, 1]) for (const end of [-1, 1]) {
    const target = center.clone().add(new THREE.Vector3(side * size.x * .40, -size.y * .04, end * size.z * .49));
    targets.push(target); anchors.push(target.clone()); distances.push(Infinity); fallback.push(null); fallbackDistance.push(Infinity);
  }
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    const role = lampRole(mesh, escalade);
    const lens = ['tail', 'head', 'drl'].includes(role);
    if (!lens && !/body|paint|bumper|fascia/i.test(mesh.name + ' ' + mesh.material?.name)) return;
    const coords = mesh.geometry.attributes.position;
    for (let i = 0; i < coords.count; i++) {
      vertex.fromBufferAttribute(coords, i).applyMatrix4(mesh.matrixWorld);
      const front = vertex.z > center.z;
      if (lens && front === (role === 'tail')) continue;
      const index = (vertex.x > center.x ? 2 : 0) + Number(front);
      const distance = vertex.distanceToSquared(targets[index]);
      if (!lens) {
        if (distance < fallbackDistance[index]) { fallbackDistance[index] = distance; (fallback[index] ||= new THREE.Vector3()).copy(vertex); }
        continue;
      }
      if (distance < distances[index]) { anchors[index].copy(vertex); distances[index] = distance; }
    }
  });
  return anchors.map((anchor, i) => Number.isFinite(distances[i]) ? anchor : fallback[i]);
}

export function createIndicators(scene, max = 160) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffa31c, toneMapped: false });
  const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, max);
  lamps.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  lamps.frustumCulled = false;
  lamps.count = 0;
  scene.add(lamps);
  const lens = new THREE.Object3D();
  let time = 0;
  return {
    begin(t) { time = t; lamps.count = 0; },
    add(chassis, anchors, width, side, phase = 0) {
      if (!side || (time + phase) % 0.7 >= 0.38 || lamps.count + 2 > max) return;
      lens.scale.set(Math.min(0.16, width * .065), 0.038, 0.018);
      for (let end = 0; end < 2; end++) {
        const anchor = anchors[(side === 'l' ? 2 : 0) + end];
        if (!anchor) continue;
        lens.position.copy(anchor);
        lens.updateMatrix();
        lens.matrix.premultiply(chassis);
        lamps.setMatrixAt(lamps.count++, lens.matrix);
      }
    },
    end() { lamps.instanceMatrix.needsUpdate = true; }
  };
}
