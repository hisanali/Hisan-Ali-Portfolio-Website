import * as T from './vendor/three.module.js';
const loader = new T.TextureLoader(), cache = new Map(), pending = [];
const FILES = {
 stone: ['rock_wall_11', 'diff', 'nor_gl', 'rough'],
 asphalt: ['asphalt_03', 'diff', 'nor_gl', 'rough'],
 ground: ['forest_ground_04', 'diff', 'nor_gl', 'rough'],
 bark: ['bark_brown_02', 'diff', 'nor_gl', 'rough'],
 roof: ['clay_roof_tiles', 'diff', 'nor_gl', 'rough'],
};
// Procedural wall surfaces drawn once on a canvas: a normal map is derived from the height so render plaster, brick
// and concrete panels catch the light like real walls instead of flat painted boxes. Tiles every few metres.
function valueNoise(size, seed) {
 const g = 64, grid = new Float32Array((g + 1) * (g + 1)); let r = seed >>> 0 || 1; const rnd = () => (r = (r * 1664525 + 1013904223) >>> 0) / 4294967296;
 for (let i = 0; i < grid.length; i++) grid[i] = rnd();
 return (x, y) => { const fx = (x / size * g) % g, fy = (y / size * g) % g, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const at = (i, j) => grid[(j % g) * (g + 1) + (i % g)]; return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy; };
}
function fbm(size, seed) { const layers = [1, 2, 4, 8].map((f, i) => [f, valueNoise(size, seed + i * 977)]); return (x, y) => { let v = 0, w = 0; for (const [f, n] of layers) { v += n((x * f) % size, (y * f) % size) / f; w += 1 / f; } return v / w; }; }
const PROCEDURAL = {
 plaster(x, y, size, n) {
  // Mottled render with trowel marks and a few rain streaks, so the light catches it like a real wall.
  const h = n(x, y) * .55 + n((x * 3.1) % size, (y * 3.1) % size) * .3 + n((x * 9) % size, (y * 9) % size) * .15;
  const streak = Math.max(0, n((x * .25) % size, (y * 5) % size) - .6) * 2;
  return {height: h * .5 + streak * .15, tone: .84 - streak * .22 - (h - .5) * .28, rough: .78 + h * .2};
 },
 brick(x, y, size, n) {
  const bh = size / 10, bw = size / 4, row = Math.floor(y / bh), shift = row % 2 ? bw / 2 : 0, u = (x + shift) % bw, v = y % bh, mortar = u < bw * .07 || v < bh * .13;
  const id = row * 131 + Math.floor((x + shift) / bw) * 7, tone = mortar ? .78 : .55 + ((id * 2654435761 >>> 0) % 100) / 100 * .25;
  const grain = n(x, y) * .5 + n((x * 5) % size, (y * 5) % size) * .5;
  return {height: mortar ? .1 : .7 + grain * .25, tone: tone * (.9 + grain * .2), rough: mortar ? .95 : .75 + grain * .15, mortar};
 },
 concrete(x, y, size, n) { const panel = size / 3, u = x % panel, v = y % panel, seam = u < 4 || v < 4, h = n(x, y) * .5 + n((x * 7) % size, (y * 7) % size) * .5; return {height: seam ? .1 : .45 + h * .2, tone: (seam ? .62 : .82) - (h - .5) * .12, rough: .72 + h * .2}; },
};
export function generated(kind, size = 512, seed = 7) {
 const n = fbm(size, seed), f = PROCEDURAL[kind], height = new Float32Array(size * size);
 const make = () => { const c = document.createElement('canvas'); c.width = c.height = size; return [c, c.getContext('2d')]; };
 const [cd, dctx] = make(), [cn, nctx] = make(), [cr, rctx] = make(), diff = dctx.createImageData(size, size), norm = nctx.createImageData(size, size), rough = rctx.createImageData(size, size);
 for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const r = f(x, y, size, n), i = y * size + x; height[i] = r.height;
  const tint = kind === 'brick' && !r.mortar ? [1.05, .9, .82] : [1, 1, 1], t = Math.max(0, Math.min(1, r.tone)) * 255;
  diff.data[i * 4] = t * tint[0]; diff.data[i * 4 + 1] = t * tint[1]; diff.data[i * 4 + 2] = t * tint[2]; diff.data[i * 4 + 3] = 255;
  const g = Math.max(0, Math.min(1, r.rough)) * 255; rough.data[i * 4] = rough.data[i * 4 + 1] = rough.data[i * 4 + 2] = g; rough.data[i * 4 + 3] = 255;
 }
 const strength = kind === 'brick' ? 6 : 3;
 for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const at = (i, j) => height[((j + size) % size) * size + ((i + size) % size)];
  const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength, len = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
  norm.data[i] = (-dx / len * .5 + .5) * 255; norm.data[i + 1] = (dy / len * .5 + .5) * 255; norm.data[i + 2] = (1 / len * .5 + .5) * 255; norm.data[i + 3] = 255;
 }
 dctx.putImageData(diff, 0, 0); nctx.putImageData(norm, 0, 0); rctx.putImageData(rough, 0, 0);
 const tex = (c, srgb) => { const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = T.SRGBColorSpace; return t; };
 return {map: tex(cd, true), normalMap: tex(cn, false), roughnessMap: tex(cr, false)};
}
export function maps(kind) {
 if (cache.has(kind)) return cache.get(kind);
 if (PROCEDURAL[kind]) { const made = generated(kind); cache.set(kind, made); return made; }
 const [name, ...suffix] = FILES[kind], result = {};
 suffix.forEach((s, i) => {
  let resolve; pending.push(new Promise(r => resolve = r));
  const t = loader.load(new URL(`./assets/materials/${name}_${s}_1k.jpg`, import.meta.url).href, () => resolve(), undefined, () => {
   const canvas=document.createElement('canvas');canvas.width=canvas.height=2;const c=canvas.getContext('2d');c.fillStyle=i===1?'#8080ff':'#b8b8b8';c.fillRect(0,0,2,2);t.image=canvas;t.needsUpdate=true;resolve();
  });
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(!i)t.colorSpace=T.SRGBColorSpace;
  result[['map','normalMap','roughnessMap'][i]]=t;
 });
 cache.set(kind, result); return result;
}
// Project scanned surfaces in world metres so long walls do not stretch a single tile.
export function scanned(kind, options = {}, metres = 2.5) {
 const m = new T.MeshStandardMaterial({...maps(kind), roughness: 1, normalScale: new T.Vector2(.6, .6), ...options});
 const previous = m.onBeforeCompile;
 m.onBeforeCompile = (s, renderer) => {
  previous.call(m, s, renderer);
  s.vertexShader = s.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
   vec4 materialLocal = vec4(transformed, 1.0);
   #ifdef USE_INSTANCING
    materialLocal = instanceMatrix * materialLocal;
   #endif
   vec3 materialPosition = (modelMatrix * materialLocal).xyz;
   vec3 materialNormal = abs(mat3(modelMatrix) * normal);
   vec2 surfaceUv = materialNormal.y > materialNormal.x && materialNormal.y > materialNormal.z ? materialPosition.xz : materialNormal.x > materialNormal.z ? materialPosition.zy : materialPosition.xy;
   surfaceUv /= ${Number(metres).toFixed(3)};
   #ifdef USE_MAP
    vMapUv = surfaceUv;
   #endif
   #ifdef USE_NORMALMAP
    vNormalMapUv = surfaceUv;
   #endif
   #ifdef USE_ROUGHNESSMAP
    vRoughnessMapUv = surfaceUv;
   #endif`);
 };
 m.customProgramCacheKey = () => `scanned-${kind}-${metres}`;
 return m;
}
export function upgradeSurfaces(world) {
 const asphalt = maps('asphalt');
 for (const collection of [world.roadMats, world.stubMats, world.tunnelMats]) for (const m of Object.values(collection)) {
  // Keep road markings; use separate, metre-scale micro-normal/roughness maps.
  for (const key of ['normalMap', 'roughnessMap']) { m[key] = asphalt[key].clone(); m[key].repeat.set(5, 16); }
  m.normalScale = new T.Vector2(.24, .24); m.bumpMap = null; m.needsUpdate = true;
 }
 world.trunkMat.dispose(); world.trunkMat = scanned('bark', {color: 0xc8bbaa}, 2);
 world.rockMat.dispose(); world.rockMat = scanned('stone', {color: 0xb6b6ae}, 3);
 world.roadside.mats.tunnelShell.material.normalMap=maps('stone').normalMap;
 world.roadside.mats.tunnelShell.material.normalScale=new T.Vector2(.2,.2);
 world.roadside.mats.ballast.material.normalMap=maps('stone').normalMap;
 world.roadside.mats.ballast.material.roughnessMap=maps('stone').roughnessMap;
 world.scenery.mats.roof.material = scanned('roof', {vertexColors:true}, 3);
 const ground = maps('ground'); world.groundMat.map=ground.map; world.groundMat.normalMap = ground.normalMap; world.groundMat.normalScale = new T.Vector2(.65, .65); world.groundMat.roughnessMap = ground.roughnessMap; world.groundMat.bumpScale = .05; world.groundMat.needsUpdate = true;
}

// Finish texture uploads before cloning maps or starting the renderer.
for (const kind of Object.keys(FILES)) maps(kind);
await Promise.all(pending);
