// Near-field grass: thousands of wind-swayed clumps on a grid that travels with the camera, so the ground close to the
// road has real blades instead of a painted surface. Clumps avoid roads, water, sand, snow, rock faces and paving.
import * as THREE from '/evermile/vendor/three.module.js';
import { rng } from './city.js';

export function createGrass(scene, world, camera, quality = 1) {
  const R = rng(5150), CELL = quality >= 1 ? 2.1 : 3.1, RAD = quality >= 1 ? 116 : 84, N = Math.ceil(RAD * 2 / CELL), count = N * N;
  // a clump: three crossed cards of painted blades
  const tex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    // a tuft: blades rooted near the middle, tallest there, leaning outward, a few dry seed heads
    for (let i = 0; i < 120; i++) { const u = (R() + R() + R()) / 3 - 0.5, bx = 128 + u * 200, h = (30 + R() * 90) * (1 - Math.abs(u) * 1.3), lean = u * 70 + (R() - 0.5) * 22, g = 0.6 + R() * 0.4, w = 0.9 + R() * 1.6, dry = R() < 0.25;
      const grad = x.createLinearGradient(0, 128, 0, 128 - h); grad.addColorStop(0, `rgb(${34 * g | 0},${40 * g | 0},${18 * g | 0})`); grad.addColorStop(0.55, dry ? `rgb(${128 * g | 0},${118 * g | 0},${70 * g | 0})` : `rgb(${92 * g | 0},${108 * g | 0},${46 * g | 0})`); grad.addColorStop(1, dry ? `rgb(${190 * g | 0},${172 * g | 0},${112 * g | 0})` : `rgb(${150 * g | 0},${152 * g | 0},${84 * g | 0})`);
      x.fillStyle = grad; x.beginPath(); x.moveTo(bx - w, 128); x.quadraticCurveTo(bx + lean * 0.4, 128 - h * 0.6, bx + lean, 128 - h); x.quadraticCurveTo(bx + lean * 0.4 + w * 0.3, 128 - h * 0.6, bx + w, 128); x.fill(); }
    return c; })());
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const card = new THREE.PlaneGeometry(1.1, 0.55, 1, 2); card.translate(0, 0.275, 0); const cards = [];
  for (let k = 0; k < 3; k++) { const g = card.clone(); g.rotateY(k * Math.PI / 3); cards.push(g); }
  const pos = [], uv = [], nor = [], idx = []; cards.forEach((g, k) => { const o = pos.length / 3; pos.push(...g.attributes.position.array); uv.push(...g.attributes.uv.array); for (let i = 0; i < g.attributes.position.count; i++) nor.push(0, 1, 0); idx.push(...Array.from(g.index.array, v => v + o)); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.92, envMapIntensity: 0.35 });
  const U = { gTime: { value: 0 }, gWind: { value: 0.5 } };
  mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = 'uniform float gTime, gWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  { vec3 base = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float tip = position.y / 0.55;
    float sway = sin(gTime * 1.7 + base.x * 0.21 + base.z * 0.17) * 0.6 + sin(gTime * 3.1 + base.x * 0.7) * 0.25;
    transformed.x += sway * tip * tip * (0.08 + 0.18 * gWind); transformed.z += sway * tip * tip * 0.06; }`);
    // fade the far ring out so the edge of the field never shows
    sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>', 'diffuseColor.a *= 1.0 - smoothstep(' + (RAD * 0.72).toFixed(1) + ', ' + (RAD * 0.90).toFixed(1) + ', length(vViewPosition));\n#include <alphatest_fragment>')
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n  normal = normalize(mix(normal, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz, 0.7));');
  };
  mat.customProgramCacheKey = () => 'afterdark-grass';
  const mesh = new THREE.InstancedMesh(geo, mat, count); mesh.name = 'Roadside grass'; mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.count = 0; scene.add(mesh);
  // fixed per-cell jitter, scale and tint, so a cell always grows the same clump
  const jit = new Float32Array(count * 4); for (let i = 0; i < count; i++) { jit[i * 4] = R(); jit[i * 4 + 1] = R(); jit[i * 4 + 2] = R(); jit[i * 4 + 3] = R(); }
  const dummy = new THREE.Object3D(), col = new THREE.Color(), info = { road: null, lat: 0, paved: false };
  let cx = 1e9, cz = 1e9; const cache = new Map(); // cell -> ground height, or -1 where nothing grows
  const fits = (x, z) => {
    if (x > -40 && x < 1000 && z > -40 && z < 1000) return -1; // the city has its own streets and planting
    const y = world.ground(x, z, info); if (info.road && Math.abs(info.lat) < 7.6 || info.paved || y < 0.6) return -1;
    if (world.isWater?.(x, z)) return -1;
    const zz = world.zones ? world.zones(x, z) : [0, 0, 0, 0]; if (zz[0] > 0.45 || zz[2] > 0.6 || zz[1] > 0.5 && y > 420) return -1;
    const sl = Math.hypot(world.terrain(x + 1.5, z) - world.terrain(x - 1.5, z), world.terrain(x, z + 1.5) - world.terrain(x, z - 1.5)) / 3; if (sl > 0.7) return -1;
    for (const p of world.places) if (Math.hypot(p.x - x, p.z - z) < (p.r || 30) * (p.contains ? 0 : 1) || p.contains?.(x, z, 6)) return -1;
    return y;
  };
  function rebuild(px, pz) {
    let n = 0; const ox = Math.floor(px / CELL) - (N >> 1), oz = Math.floor(pz / CELL) - (N >> 1);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const gi = ox + i, gj = oz + j, h = ((gi * 73856093) ^ (gj * 19349663)) >>> 0, k = (h % count) * 4;
      const x = (gi + jit[k]) * CELL, z = (gj + jit[k + 1]) * CELL; if ((x - px) ** 2 + (z - pz) ** 2 > RAD * RAD) continue;
      const key = gi * 100003 + gj; let y = cache.get(key); if (y === undefined) { y = fits(x, z); if (y >= 0 && jit[k + 2] > 0.35 + 0.65 * (world.lushness ? Math.min(1, world.lushness(x, z)) : 1)) y = -1; if (cache.size > 90000) cache.clear(); cache.set(key, y); } if (y < 0) continue;
      const s = 0.6 + jit[k + 3] * 1.1; dummy.position.set(x, y - 0.04, z); dummy.rotation.set(0, jit[k + 2] * 6.283, 0); dummy.scale.set(s * 1.65, s * (0.7 + jit[k] * 0.7), s * 1.65); dummy.updateMatrix(); mesh.setMatrixAt(n, dummy.matrix);
      mesh.setColorAt(n, col.setRGB(0.86 + jit[k + 1] * 0.28, 0.84 + jit[k + 3] * 0.2, 0.68 + jit[k] * 0.18)); n++; }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  return {
    mesh,
    update(t) { U.gTime.value = t; const p = camera.position; if (Math.hypot(p.x - cx, p.z - cz) > RAD * 0.09) { cx = p.x; cz = p.z; rebuild(cx, cz); } },
    setTime(e) { U.gWind.value = 0.4 + e.rain * 0.6; mat.color.setScalar(1 - e.night * 0.55); }
  };
}
