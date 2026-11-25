// Each pair of amber lenses turns with its vehicle. Instance transforms keep
// their width and orientation attached to the body when viewed from the side.
import * as THREE from '/evermile/vendor/three.module.js';

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
    add(x, y, z, heading, width, length, side, height = 0.75, phase = 0) {
      if (!side || (time + phase) % 0.7 >= 0.38 || lamps.count + 2 > max) return;
      const lateral = width * 0.42 * (side === 'l' ? 1 : -1);
      const sin = Math.sin(heading), cos = Math.cos(heading);
      lens.rotation.y = heading;
      lens.scale.set(width * 0.10, 0.055, 0.045);
      for (const end of [-1, 1]) {
        const along = end * length * 0.5;
        lens.position.set(x + sin * along + cos * lateral, y + height, z + cos * along - sin * lateral);
        lens.updateMatrix();
        lamps.setMatrixAt(lamps.count++, lens.matrix);
      }
    },
    end() { lamps.instanceMatrix.needsUpdate = true; }
  };
}
