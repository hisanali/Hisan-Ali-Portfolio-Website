// Crash damage for the player's car. A hit crumples the body where it struck: the panels near the contact are pushed
// in, more the harder the hit, with a crinkled surface, and the damage builds up hit after hit (up to a limit, so the
// car stays a car). The wheels are never bent. The car's geometry is copied the first time it is dented, so other cars
// sharing the same model are untouched, and repairing puts the original back.
import * as THREE from '/evermile/vendor/three.module.js';

const WHEEL = /wheel|tire|tyre|rim|caliper|brake|hub|nut|disc|rotor/i;
const MAX_DENT = 0.42; // metres any point can be pushed in, in all

function excluded(o) { for (let n = o; n; n = n.parent) if (WHEEL.test(n.name || '')) return true; return WHEEL.test(o.material?.name || ''); }
const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };

// root: the car's root object (its frame: +z forward, +x the car's left, y up from the ground)
export function createDamage(root, model) {
  const parts = []; let level = 0;
  // everything on the body crumples together: the panels and any wrap or decal laid over them (left behind, a decal would
  // show through the dent as speckle); not lamps' glow sprites, the instanced indicator lenses or additive light layers
  model.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.geometry?.attributes.position && o.material?.blending !== THREE.AdditiveBlending && !excluded(o)) parts.push({ mesh: o, original: o.geometry, own: null }); });
  const toCar = new THREE.Matrix4(), toMesh = new THREE.Matrix4(), v = new THREE.Vector3(), d = new THREE.Vector3(), n = new THREE.Vector3(), rootInv = new THREE.Matrix4(), near = new THREE.Vector3();
  return {
    get level() { return level; },
    // point: impact in the car's frame (x, y, z); dir: unit vector in the car's frame pointing into the car; speed in m/s
    hit(point, dir, speed) {
      if (speed < 4) return;
      const depth = Math.min(0.3, (speed - 3) * 0.014), radius = Math.min(2.1, 0.75 + speed * 0.05);
      level = Math.min(1, level + Math.min(0.45, (speed - 3) / 55));
      root.updateWorldMatrix(true, true); rootInv.copy(root.matrixWorld).invert();
      for (const p of parts) {
        const m = p.mesh;
        toCar.multiplyMatrices(rootInv, m.matrixWorld);
        // skip panels nowhere near the blow (most of the car), measured on their bounds in the car's frame
        if (!p.box) { if (!p.original.boundingBox) p.original.computeBoundingBox(); p.box = p.original.boundingBox.clone().applyMatrix4(toCar).expandByScalar(MAX_DENT); }
        if (p.box.distanceToPoint(near.set(point.x, point.y, point.z)) > radius) continue;
        toMesh.copy(toCar).invert();
        if (!p.own) { p.own = p.original.clone(); p.rest = p.original.attributes.position; m.geometry = p.own; }
        const pos = p.own.attributes.position, nor = p.own.attributes.normal, rest = p.rest; let moved = false;
        const lin = new THREE.Matrix3().setFromMatrix4(toMesh); // directions from the car's frame into the mesh's
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(toCar);
          const dx = v.x - point.x, dy = (v.y - point.y) * 1.4, dz = v.z - point.z, r = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (r >= radius) continue;
          const w = (1 - r / radius) ** 2, crinkle = 0.75 + 0.5 * (Math.sin(v.x * 4.3 + v.z * 2.9) * Math.sin(v.y * 5.1 - v.z * 3.7) * 0.5 + 0.5);
          // pushed in along the blow, a little down and sideways as metal folds
          d.copy(dir).multiplyScalar(depth * w * crinkle); d.y -= depth * w * 0.25 * (hash(v.z, v.x, v.y) - 0.3);
          v.add(d).applyMatrix4(toMesh);
          // never further than MAX_DENT from where the panel was built
          const ox = rest.getX(i), oy = rest.getY(i), oz = rest.getZ(i); d.set(v.x - ox, v.y - oy, v.z - oz);
          const len = d.length(), limit = MAX_DENT / Math.max(1e-6, m.matrixWorld.getMaxScaleOnAxis() / root.matrixWorld.getMaxScaleOnAxis());
          if (len > limit) v.set(ox, oy, oz).addScaledVector(d, limit / len);
          pos.setXYZ(i, v.x, v.y, v.z);
          if (nor) { const q = (k, o) => Math.sin(k * 5.3 + o) * 0.5 + Math.sin(k * 2.1 + o * 1.7) * 0.5; // smooth folds, not speckle
            n.fromBufferAttribute(nor, i); d.set(q(point.x + dx + dz, 1), q(point.y + dy, 2.3), q(point.z + dz - dx, 4.1)).applyMatrix3(lin); n.addScaledVector(d, w * 0.42).normalize(); nor.setXYZ(i, n.x, n.y, n.z); }
          moved = true;
        }
        if (moved) { pos.needsUpdate = true; if (nor) nor.needsUpdate = true; p.own.computeBoundingSphere(); }
      }
    },
    repair() {
      level = 0;
      for (const p of parts) if (p.own) { p.mesh.geometry = p.original; p.own.dispose(); p.own = null; p.rest = null; }
    }
  };
}
