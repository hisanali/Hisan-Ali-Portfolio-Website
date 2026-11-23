import * as THREE from '/evermile/vendor/three.module.js';
import { HALF, P, SPAN } from './city.js';

export function buildRailway(scene, city, world) {
  const x = city.viaduct, deck = 10.9, south = -128, north = SPAN + 136;
  const group = new THREE.Group();
  group.name = 'Elevated railway';
  scene.add(group);
  const mid = (south + north) * 0.5, length = north - south;
  const concrete = new THREE.MeshStandardMaterial({ roughness: 0.84, envMapIntensity: 0.45 });
  const steel = new THREE.MeshStandardMaterial({ roughness: 0.49, metalness: 0.52, envMapIntensity: 0.78 });
  const bulbs = new THREE.MeshStandardMaterial({ color: 0xc9e0e6, emissive: 0xb2d5ee, roughness: 0.47 });
  const boxes = new Map([[concrete, []], [steel, []], [bulbs, []]]);
  const beam = (mat, ex, y, z, w, h, d, color) => boxes.get(mat).push([x + ex, y, z, w, h, d, color]);

  beam(concrete, 0, deck - 0.46, mid, 8.8, 0.92, length, 0x7e8182);
  for (const side of [-1, 1]) {
    beam(steel, side * 2.95, deck - 1.07, mid, 0.65, 0.53, length, 0x444c53);
    beam(concrete, side * 4.29, deck + 0.25, mid, 0.27, 0.50, length, 0x777e81);
    beam(steel, side * 4.3, deck + 1.05, mid, 0.075, 0.085, length, 0x585f65);
    beam(steel, side * 0.74, deck + 0.15, mid, 0.08, 0.15, length - 1.3, 0x95a3a8);
  }
  for (let z = south + 1.5; z < north - 1; z += 2.2) {
    beam(concrete, 0, deck + 0.036, z, 2.23, 0.072, 0.32, 0x61686b);
    if (Math.floor(z * 10) % 4 === 0) for (const side of [-1, 1]) beam(steel, side * 4.3, deck + 0.74, z, 0.08, 0.57, 0.075, 0x555d64);
  }

  // Crossheads bridge both lanes. Outside town, footings follow the ground and avoid the Old Town road.
  function pier(z, end = false) {
    const inTown = z >= -14 && z <= SPAN + 14;
    const column = end ? 1.67 : 1.15, cap = end ? 2.55 : 1.55;
    const legs = [-1, 1].map(sign => {
      const distances = [HALF + 1.55, HALF + 4.8, 8.25, 5.2, HALF + 9.4];
      const width = inTown ? distances[0] : distances.find(d => !world.nearRoad(x + sign * d, z, 9.1));
      return sign * (width ?? distances[0]);
    });
    beam(concrete, (legs[0] + legs[1]) * 0.5, deck - 1.32, z, legs[1] - legs[0] + 1.8, 1.08, cap, 0x71777b);
    for (const offset of legs) {
      const bottom = (inTown ? 0.17 : world.terrain(x + offset, z)) - 0.17, top = deck - 1.48;
      if (bottom >= top) continue;
      beam(concrete, offset, (bottom + top) * 0.5, z, column, top - bottom, column, 0x797c7a);
      beam(concrete, offset, bottom + 0.22, z, column + 0.42, 0.42, column + 0.42, 0x565f5f);
      city.colliders.push({ x: x + offset, z, r: column * 0.62, bottom, top, kind: 'railway pier' });
    }
    for (const side of [-1, 1]) beam(bulbs, side * 3.15, deck - 1.38, z, 0.84, 0.07, 0.21, 0xd8e4e5);
  }
  for (let z = 15; z < SPAN; z += 30) if (Math.abs(z - Math.round(z / P) * P) >= 14) pier(z);
  for (const z of [south + 2.8, -98, -65, -32, SPAN + 33, SPAN + 66, SPAN + 102, north - 2.8]) {
    pier(z, z === south + 2.8 || z === north - 2.8);
  }

  function terminal(end, direction) {
    const sign = direction > 0 ? 'NORTH TERMINAL' : 'SOUTH TERMINAL';
    const inside = end - direction * 35;
    // The open approach leads into a covered platform and a solid track buffer at the end wall.
    beam(steel, 0, deck + 4.22, inside, 9.2, 0.32, 68, 0x4e585e);
    beam(concrete, 0, deck + 1.99, end - direction * 1.32, 8.81, 3.98, 0.44, 0x72777a);
    beam(concrete, 0, deck - 0.25, end - direction * 0.55, 8.95, 1.34, 1.10, 0x686f74);
    beam(steel, 0, deck + 0.64, end - direction * 2.9, 2.28, 0.62, 0.33, 0x5a6f77);
    beam(steel, 0, deck + 0.92, end - direction * 2.72, 2.32, 0.115, 0.15, 0xa87042);
    for (const side of [-1, 1]) {
      beam(concrete, side * 3.16, deck + 0.19, inside, 1.74, 0.38, 66, 0x8e9291);
      beam(steel, side * 2.28, deck + 0.405, inside, 0.075, 0.06, 66, 0xb7a16e);
      for (let i = 0; i < 10; i++) {
        const z = end - direction * (3.2 + i * 7.0);
        beam(steel, side * 4.35, deck + 2.18, z, 0.18, 3.72, 0.20, 0x626e73);
        if (i % 2 === 0) beam(bulbs, side * 3.2, deck + 4.026, z, 0.18, 0.09, 2.37, 0xdce7ea);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#34454f'; ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#ede9db'; ctx.font = '600 35px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(sign, 256, 44);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(5.65, 0.66),
      new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.23 }));
    label.position.set(x, deck + 2.52, end - direction * 1.07);
    label.rotation.y = direction > 0 ? 0 : Math.PI;
    group.add(label);
  }
  terminal(south, -1);
  terminal(north, 1);

  const geometry = new THREE.BoxGeometry(1, 1, 1), dummy = new THREE.Object3D(), color = new THREE.Color();
  for (const [material, list] of boxes) {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    for (const [i, [px, y, z, w, h, d, c]] of list.entries()) {
      dummy.position.set(px, y, z); dummy.scale.set(w, h, d); dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, color.set(c));
    }
    mesh.receiveShadow = true;
    mesh.castShadow = material !== bulbs;
    group.add(mesh);
  }
  return { deck, south, north, setTime(env) { bulbs.emissiveIntensity = 0.06 + env.night * 1.75; } };
}
