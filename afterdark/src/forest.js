// Deterministic woodland. The same placements drive rendering and solid trunk collisions.
import * as THREE from '/evermile/vendor/three.module.js';
import { loadGLB } from './car.js';
import { rng, splitChunks } from './city.js';

const TAU = Math.PI * 2;
const CELL = 5;

// opt lets the same planting run over another area: its own road samples, groves, counts and an exclusion test.
export async function buildForest(scene, city, world, bounds, nearPlace, canopyCover, reach, opt = {}) {
  const roadSamples = opt.samples || world.samples, skip = opt.skip || (() => false), seed = opt.seed || 9501;
  const kit = await loadGLB('/evermile/assets/models/forest-kit.glb');
  kit.scene.updateMatrixWorld(true);
  const pines = kit.scene.children.filter(n => n.name.startsWith('pine'));
  const spruces = kit.scene.children.filter(n => n.name.startsWith('spruce'));
  const ferns = kit.scene.children.filter(n => n.name.startsWith('fern'));
  const all = pines.concat(spruces, ferns);
  const sites = new Map(all.map(node => [node, []]));
  const terrain = world.terrain, random = rng(seed), occupied = new Map();
  const dummy = new THREE.Object3D(), matrix = new THREE.Matrix4(), tint = new THREE.Color();
  const pick = list => list[Math.floor(random() * list.length)];
  const cell = (x, z) => x * 8192 + z;
  const steepness = (x, z) => Math.hypot(terrain(x + 4, z) - terrain(x - 4, z), terrain(x, z + 4) - terrain(x, z - 4)) / 8;
  const isVerge = (x, z, buffer) => {
    const road = world.nearRoad(x, z, 54);
    return road && road.d < buffer + (road.s.wide || 0);
  };

  function plant(x, z, verge = false, stand = false) {
    const y = terrain(x, z), gradient = steepness(x, z);
    if (y < 4 || y > 285 || gradient > 0.79 || skip(x, z) || isVerge(x, z, verge ? 11.5 : 14) || nearPlace(x, z, 7)) return false;
    const cover = canopyCover(x, z) + (stand ? 0.16 : 0);
    if (random() > THREE.MathUtils.smoothstep(cover, verge ? 0.31 : 0.40, 0.74) * (1 - 0.75 * THREE.MathUtils.smoothstep(y, 218, 285))) return false;
    const spruce = random() < THREE.MathUtils.clamp(cover * 2.2 - 0.67 + gradient * 0.27, 0.15, 0.83);
    const node = pick(spruce ? spruces : pines);
    const juvenile = random() < 0.25, breadth = juvenile ? 0.38 + random() * 0.40 : 0.75 + random() * 0.85;
    const stature = (juvenile ? 0.24 + random() * 0.32 : 0.49 + random() * 0.54) * (1 - gradient * 0.25);
    const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL);
    for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iz = gz - 1; iz <= gz + 1; iz++) {
      const stems = occupied.get(cell(ix, iz));
      if (stems?.some(t => Math.hypot(t.x - x, t.z - z) < 2.05 + (t.sx + breadth) * 0.88)) return false;
    }
    const tree = { x, y: y - 0.29, z, sx: breadth, sy: stature, angle: random() * TAU, tone: random() };
    const key = cell(gx, gz);
    if (!occupied.has(key)) occupied.set(key, []);
    occupied.get(key).push(tree);
    sites.get(node).push(tree);

    // The bark primitive sits at the asset's origin. Scale the trunk independently from its height and foliage.
    city.colliders.push({ x, z, r: (spruce ? 0.24 : 0.33) * breadth, bottom: y - 0.38, top: y + node.userData.h * stature * 0.91, kind: 'forest trunk' });

    if (random() < 0.48) {
      const fx = x + (random() - 0.5) * 8, fz = z + (random() - 0.5) * 8;
      if (!isVerge(fx, fz, 7.6) && !nearPlace(fx, fz, 2) && steepness(fx, fz) < 0.82) {
        const fern = pick(ferns), size = (0.34 + random() * 0.6) * (fern.userData.h > 3 ? 0.53 : 1);
        sites.get(fern).push({ x: fx, y: terrain(fx, fz) - 0.07, z: fz, sx: size * 1.34, sy: size, angle: random() * TAU, tone: random() });
      }
    }
    return true;
  }

  // Follow terrain benches and valley shoulders so there is vegetation at road level too.
  for (const s of roadSamples) {
    if (s.i % 3 || s.bridge || s.tunnel || s.wide > 3) continue;
    for (const sign of [-1, 1]) {
      const across = sign * (12.5 + random() ** 1.7 * 22), along = (random() - 0.5) * 11;
      plant(s.x + s.lx * across + s.tx * along, s.z + s.lz * across + s.tz * along, true);
    }
  }
  // Plant denser stands on selected low shoulders, keeping gaps between groves.
  for (const [name, fraction, side] of opt.groves || [['mountain', 0.19, 1], ['mountain', 0.23, -1], ['mountain', 0.68, 1], ['coast', 0.75, -1], ['old', 0.62, -1]]) {
    const road = world.roads.find(r => r.name === name);
    const sample = world.samples[Math.round(THREE.MathUtils.lerp(road.from, road.to, fraction))];
    for (let i = 0; i < 180; i++) {
      const across = side * (16 + random() * 38), along = (random() - 0.5) * 190;
      plant(sample.x + sample.lx * across + sample.tx * along, sample.z + sample.lz * across + sample.tz * along, true, true);
    }
  }
  // Seed clumps within a broader patchwork of woodland and openings.
  let count = 0;
  for (let tries = 0, goal = opt.count ?? 5700, most = opt.tries ?? 85000; count < goal && tries < most; tries++) {
    const x = THREE.MathUtils.lerp(bounds.x0 + 35, bounds.x1 - 35, random());
    const z = THREE.MathUtils.lerp(bounds.z0 + 35, bounds.z1 - 35, random());
    if (plant(x, z)) count++;
  }

  function batch(geometry, source, transform, placements, distance, shadows, name) {
    if (!placements.length) return;
    const mesh = new THREE.InstancedMesh(geometry, source, placements.length);
    mesh.name = name;
    placements.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.angle, 0);
      dummy.scale.set(p.sx, p.sy, p.sz || p.sx);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, matrix.multiplyMatrices(dummy.matrix, transform));
      const sweep = p.tone;
      mesh.setColorAt(i, tint.setRGB(0.74 + sweep * 0.42, 0.81 + sweep * 0.32, 0.72 + sweep * 0.32));
    });
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    scene.add(mesh);
    splitChunks(mesh, distance, city.chunks, distance <= 420 ? 145 : 340);
  }
  for (const [node, placements] of sites) {
    const groundCover = ferns.includes(node);
    node.traverse(part => {
      if (!part.isMesh) return;
      const mat = part.material.clone();
      mat.envMapIntensity = 0.49;
      if (mat.alphaTest || mat.transparent) {
        mat.alphaTest = groundCover ? 0.44 : 0.40;
        mat.transparent = false;
        mat.depthWrite = true;
        mat.side = THREE.DoubleSide;
      }
      batch(part.geometry, mat, part.matrixWorld, placements, groundCover ? 240 : 1770, !groundCover && reach >= 0.7, node.name);
    });
  }

  // Solid, irregular rock geometry shares a silhouette with its collision footprint.
  const loader = new THREE.TextureLoader();
  const rockTexture = loader.load('/afterdark/assets/rock-face.jpg');
  rockTexture.colorSpace = THREE.SRGBColorSpace;
  const rockMat = new THREE.MeshStandardMaterial({ map: rockTexture, color: 0xa9a196, roughness: 0.93, envMapIntensity: 0.35 });
  const rockShapes = new Map();
  for (let shape = 0; shape < 3; shape++) {
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const roughness = 1 + 0.13 * Math.sin(8 * x + shape * 3) * Math.cos(5 * z - 4 * y);
      vertices.setXYZ(i, x * roughness + y * (shape - 1) * 0.19, Math.max(-0.52, y * roughness) + 0.35, z * roughness);
    }
    geometry.computeVertexNormals();
    rockShapes.set(geometry, []);
  }
  const shapes = [...rockShapes.values()];
  let rocks = 0;
  function boulder(x, z) {
    const y = terrain(x, z), gradient = steepness(x, z);
    if (y < 3 || gradient < 0.10 || gradient > 1.55 || skip(x, z) || isVerge(x, z, 9) || nearPlace(x, z, 4)) return;
    const radius = 0.38 + random() ** 1.9 * 1.95, height = radius * (0.47 + random() * 0.62);
    pick(shapes).push({ x, y: y - 0.18 - gradient * radius * 0.19, z, sx: radius, sy: height, sz: radius * (0.65 + random() * 0.42), angle: random() * TAU, tone: random() });
    if (radius > 0.62) city.colliders.push({ x, z, r: radius * 0.82, bottom: y - 0.3, top: y + 1.20 * height - gradient * radius * 0.19, kind: 'boulder' });
    rocks++;
  }
  for (const s of roadSamples) {
    if (s.i % 6 || s.bridge || s.tunnel || s.wide > 1) continue;
    const d = (random() < 0.5 ? -1 : 1) * (10 + random() * 34);
    if (random() < 0.57) boulder(s.x + s.lx * d, s.z + s.lz * d);
  }
  for (let i = 0, most = opt.rockTries ?? 1700, goal = opt.rocks ?? 860; i < most && rocks < goal; i++) {
    boulder(THREE.MathUtils.lerp(bounds.x0, bounds.x1, random()), THREE.MathUtils.lerp(bounds.z0, bounds.z1, random()));
  }
  const identity = new THREE.Matrix4();
  for (const [geometry, placements] of rockShapes) batch(geometry, rockMat, identity, placements, 470, reach >= 0.7, 'Rock outcrops');

  world.trees = (world.trees || 0) + pines.concat(spruces).reduce((sum, node) => sum + sites.get(node).length, 0);
  world.understory = (world.understory || 0) + ferns.reduce((sum, node) => sum + sites.get(node).length, 0);
  world.rocks = (world.rocks || 0) + rocks;
}
