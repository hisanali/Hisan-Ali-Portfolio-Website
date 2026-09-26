import * as T from './vendor/three.module.js';
const loader = new T.TextureLoader(), cache = new Map(), pending = [];
const FILES = {
 stone: ['rock_wall_11', 'diff', 'nor_gl', 'rough'],
 asphalt: ['asphalt_03', 'diff', 'nor_gl', 'rough'],
 ground: ['forest_ground_04', 'diff', 'nor_gl', 'rough'],
 bark: ['bark_brown_02', 'diff', 'nor_gl', 'rough'],
 roof: ['clay_roof_tiles', 'diff', 'nor_gl', 'rough'],
};
export function maps(kind) {
 if (cache.has(kind)) return cache.get(kind);
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
