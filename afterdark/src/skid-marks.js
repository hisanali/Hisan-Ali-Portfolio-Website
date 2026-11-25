import * as THREE from '/evermile/vendor/three.module.js';

// Alpha only. The road shows through gaps in the tread and the irregular shoulders.
function rubberPattern() {
  const width = 32, length = 128;
  const pixels = new Uint8Array(width * length * 4);
  let seed = 1827;
  for (let y = 0; y < length; y++) {
    const phase = y / length * Math.PI * 2;
    const edge = .76 + .08 * Math.sin(phase * 7) + .05 * Math.cos(phase * 13);
    const deposit = .77 + .12 * Math.cos(phase * 3) + .07 * Math.sin(phase * 11);
    for (let x = 0; x < width; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = seed / 4294967296;
      const across = (x + .5) / width * 2 - 1;
      const rim = Math.abs(across + .055 * Math.sin(phase * 4));
      const feather = 1 - THREE.MathUtils.smoothstep(rim, .45, edge);
      const groove = .71 + .29 * Math.abs(Math.sin(across * 10 + .6 * Math.sin(phase * 5)));
      const i = (y * width + x) * 4;
      pixels[i + 1] = Math.round(255 * feather * deposit * groove * (.37 + grain * .63));
      pixels[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, width, length);
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

// Recycle road ribbons in one draw call. Distance-based UVs keep the rubber at the same scale at any speed.
export function createSkidMarks(scene) {
  const capacity = 3000;
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(new Float32Array(capacity * 12), 3).setUsage(THREE.DynamicDrawUsage);
  const colors = new THREE.BufferAttribute(new Float32Array(capacity * 16), 4).setUsage(THREE.DynamicDrawUsage);
  const uvs = new THREE.BufferAttribute(new Float32Array(capacity * 8), 2).setUsage(THREE.DynamicDrawUsage);
  const indices = [];
  for (let i = 0; i < capacity * 4; i += 4) indices.push(i, i + 1, i + 2, i + 2, i + 1, i + 3);
  geometry.setAttribute('position', positions);
  geometry.setAttribute('color', colors);
  geometry.setAttribute('uv', uvs);
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true,
    alphaMap: rubberPattern(), side: THREE.DoubleSide, forceSinglePass: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh.name = 'Tyre marks'; mesh.frustumCulled = false; mesh.renderOrder = 2; scene.add(mesh);
  let cursor = 0, count = 0, vehicle;
  const previous = [];
  function clear() { previous.length = 0; cursor = count = 0; geometry.setDrawRange(0, 0); }
  clear();
  function update(car, hand, wet, trail = previous) {
    const speed = Math.abs(car.speed);
    const onPavement = speed >= 2 && !car.air && !car.rough && !car.onSand && !car.onKerb;
    if ((trail === previous && vehicle !== car) || !onPavement) trail.length = 0;
    if (trail === previous) vehicle = car;
    if (!onPavement) return;
    const sin = Math.sin(car.heading), cos = Math.cos(car.heading);
    let wrote = false;
    car.tyreContacts.forEach((wheel, i) => {
      const braking = car.braking && !hand
        ? Math.max(0, -car.accel - 4.5) / 7 * Math.min(1, speed / 12) * (wheel.z > 0 ? 1 : .55)
        : 0;
      const slip = Math.max((car.slip - 2.4) / 5, hand && wheel.z < 0 ? speed / 12 : 0, braking);
      if (slip < .08) { trail[i] = null; return; }
      const x = car.pos.x + wheel.x * cos + wheel.z * sin, z = car.pos.z - wheel.x * sin + wheel.z * cos;
      const old = trail[i], distance = old ? Math.hypot(old.x - x, old.z - z) : Infinity;
      if (distance < .12) return;
      const joined = distance <= 8;
      const half = Math.min(.17, car.wid * .066);
      const vAlong = joined ? old.v + distance / 1.8 : i * .23;
      const deposit = .77 + .16 * Math.sin(vAlong * 2.7 + i * 1.3) + .07 * Math.cos(vAlong * 5.6 + i);
      const opacity = Math.min(.34, (slip - .08) * .52) * deposit * (1 - wet * .66);
      const point = { x, z, dx: cos * half, dz: -sin * half, y: car.surfaceY(x, z) + .012,
        alpha: joined ? opacity : 0, v: vAlong };
      trail[i] = point;
      if (!joined) return;
      let v = cursor * 4;
      for (const end of [old, point]) for (const side of [-1, 1]) {
        positions.setXYZ(v, end.x + side * end.dx, end.y, end.z + side * end.dz);
        uvs.setXY(v, (side + 1) / 2, end.v);
        colors.setXYZW(v++, .026, .024, .022, end.alpha);
      }
      cursor = (cursor + 1) % capacity; count = Math.min(capacity, count + 1);
      wrote = true;
    });
    if (wrote) {
      geometry.setDrawRange(0, count * 6);
      positions.needsUpdate = colors.needsUpdate = uvs.needsUpdate = true;
    }
  }
  return { update, clear, breakTrail() { previous.length = 0; } };
}
