import * as THREE from '/evermile/vendor/three.module.js';

// Recycle road ribbons in one draw call. Segment endpoints are in world space.
export function createSkidMarks(scene) {
  const capacity = 3000;
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(new Float32Array(capacity * 12), 3).setUsage(THREE.DynamicDrawUsage);
  const colors = new THREE.BufferAttribute(new Float32Array(capacity * 16), 4).setUsage(THREE.DynamicDrawUsage);
  const indices = [];
  for (let i = 0; i < capacity * 4; i += 4) indices.push(i, i + 1, i + 2, i + 2, i + 1, i + 3);
  geometry.setAttribute('position', positions); geometry.setAttribute('color', colors); geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true,
    side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh.name = 'Tyre marks'; mesh.frustumCulled = false; mesh.renderOrder = 2; scene.add(mesh);
  let cursor = 0, count = 0, vehicle;
  const previous = [];
  function clear() { previous.length = 0; cursor = count = 0; geometry.setDrawRange(0, 0); }
  clear();
  function update(car, hand, wet) {
    const speed = Math.abs(car.speed);
    if (vehicle !== car || speed < 2 || car.air || car.rough || car.onSand || car.onKerb) previous.length = 0;
    vehicle = car;
    if (speed < 2 || car.air || car.rough || car.onSand || car.onKerb) return;
    const sin = Math.sin(car.heading), cos = Math.cos(car.heading);
    car.tyreContacts.forEach((wheel, i) => {
      const slip = Math.max((car.slip - 2.4) / 5, hand && wheel.z < 0 ? speed / 12 : 0,
        car.braking && !hand ? Math.max(0, -car.accel - 3) / 9 * Math.min(1, speed / 12) : 0);
      if (slip < .08) { previous[i] = null; return; }
      const x = car.pos.x + wheel.x * cos + wheel.z * sin, z = car.pos.z - wheel.x * sin + wheel.z * cos;
      const old = previous[i], distance = old ? Math.hypot(old.x - x, old.z - z) : Infinity;
      if (distance < .12) return;
      const half = Math.min(.16, car.wid * .052);
      const point = { x, z, dx: cos * half, dz: -sin * half, y: car.surfaceY(x,z) + .018,
        alpha: Math.min(.62, slip * .48) * (1 - wet * .67) };
      previous[i] = point;
      if (distance > 8) return;
      let v = cursor * 4;
      for (const end of [old, point]) for (const side of [-1, 1]) {
        positions.setXYZ(v, end.x + side * end.dx, end.y, end.z + side * end.dz);
        colors.setXYZW(v++, .015, .014, .013, end.alpha);
      }
      cursor = (cursor + 1) % capacity; count = Math.min(capacity, count + 1);
      geometry.setDrawRange(0, count * 6); positions.needsUpdate = colors.needsUpdate = true;
    });
  }
  return { update, clear, breakTrail() { previous.length = 0; } };
}
