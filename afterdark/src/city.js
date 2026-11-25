// The city: a rain-soaked grid of avenues, towers with lit rooms behind every window, neon signage,
// street lamps and signals. Everything is generated here; the only files loaded are the asphalt textures.
import * as THREE from '/evermile/vendor/three.module.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';
import { Sky } from '/penalty/vendor/three-addons/objects/Sky.js';
import { loadGLB } from './car.js';
import { buildSea, wetSand, beachHeight } from './water.js';
import { Q as QUALITY_PRESET } from './render.js';

export const P = 120, ROADS = 9, HALF = 10, SW = 4, SPAN = P * (ROADS - 1);
export const CITY_PAVEMENT = {
  west: -(HALF + 13.5), east: SPAN + HALF + SW + 1,
  south: -(HALF + SW + 1), north: SPAN + HALF + SW + 1,
};
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const NEON = [0x19e3ff, 0xff2bd6, 0xffa329, 0x8a5cff, 0xff3048, 0x38ffb0, 0xfff1d0, 0x2f7bff];
const dummy = new THREE.Object3D(), col = new THREE.Color(), mtmp = new THREE.Matrix4();
const GLSL_HASH = 'float adH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }\nfloat adN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(adH(i), adH(i + vec2(1, 0)), f.x), mix(adH(i + vec2(0, 1)), adH(i + vec2(1, 1)), f.x), f.y); }\n';

// Splits one big instanced mesh into 320 m district chunks. Each chunk has its own bounds, so districts that are
// off screen (or out of the sun's shadow box) are skipped, and chunks beyond maxDist are hidden outright.
// The original mesh stays as an empty parent, so code that toggles it or shares its material keeps working.
export const CHUNK = 320;
// Distance fade: a chunk is only hidden once it is beyond its draw distance, so its material dissolves away (a fine
// screen-space dither) over the last stretch before that. Nothing pops in or out as the car moves.
function fadeWithDistance(material, far) {
  if (!material || Array.isArray(material)) return;
  const u = material.userData; far *= QUALITY_PRESET.reach || 1;
  if (u.fade) { u.fade.value.x = Math.min(u.fade.value.x, far); u.fade.value.y = Math.max(40, u.fade.value.x * 0.22); return; }
  u.fade = { value: new THREE.Vector2(far, Math.max(40, far * 0.22)) };
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    sh.uniforms.fdFar = u.fade;
    sh.vertexShader = 'varying vec3 fdW;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  { vec4 fdP = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    fdP = instanceMatrix * fdP;
  #endif
    fdW = (modelMatrix * fdP).xyz; }`);
    sh.fragmentShader = 'uniform vec2 fdFar; varying vec3 fdW;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  { float fdK = smoothstep(fdFar.x - fdFar.y, fdFar.x, distance(fdW, cameraPosition));
    if (fdK > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fdK) discard; }`);
  };
  material.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|fade';
}
export function splitChunks(mesh, maxDist, list, size = CHUNK) {
  const n = mesh.count, m4 = new THREE.Matrix4(), groups = new Map(), c = new THREE.Color();
  if (list && isFinite(maxDist)) fadeWithDistance(mesh.material, maxDist);
  for (let i = 0; i < n; i++) { mesh.getMatrixAt(i, m4); const e = m4.elements, key = Math.floor(e[12] / size) * 1000 + Math.floor(e[14] / size); (groups.get(key) || groups.set(key, []).get(key)).push(i); }
  const inst = Object.entries(mesh.geometry.attributes).filter(([, a]) => a.isInstancedBufferAttribute);
  for (const idx of groups.values()) { let geo = mesh.geometry;
    if (inst.length) { geo = mesh.geometry.clone(); for (const [name, a] of inst) { const arr = new a.array.constructor(idx.length * a.itemSize); idx.forEach((src, k) => { for (let q = 0; q < a.itemSize; q++) arr[k * a.itemSize + q] = a.array[src * a.itemSize + q]; }); geo.setAttribute(name, new THREE.InstancedBufferAttribute(arr, a.itemSize)); } }
    const part = new THREE.InstancedMesh(geo, mesh.material, idx.length);
    idx.forEach((src, k) => { mesh.getMatrixAt(src, m4); part.setMatrixAt(k, m4); if (mesh.instanceColor) { mesh.getColorAt(src, c); part.setColorAt(k, c); } });
    part.castShadow = mesh.castShadow; part.receiveShadow = mesh.receiveShadow; part.renderOrder = mesh.renderOrder; if (mesh.customDepthMaterial) part.customDepthMaterial = mesh.customDepthMaterial;
    part.computeBoundingSphere(); part.frustumCulled = true; mesh.add(part);
    if (list && isFinite(maxDist)) list.push({ mesh: part, x: part.boundingSphere.center.x, z: part.boundingSphere.center.z, r: part.boundingSphere.radius, max: maxDist }); }
  mesh.count = 0; mesh.frustumCulled = false; return mesh;
}

// Cycle of a junction's signals: 'g', 'y' or 'r' for traffic travelling along the given axis.
export function signal(i, j, axis, t) { const ph = (t + ((i + j) & 1) * 8 + (axis === 'z' ? 8 : 0)) % 16; return ph < 6 ? 'g' : ph < 7.5 ? 'y' : 'r'; }

function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x2 = c.getContext('2d'); if (!x2.roundRect) x2.roundRect = function (x, y, ww, hh) { this.rect(x, y, ww, hh); }; draw(x2, w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// Use the same seeded noise field for the rendered puddles and tyre contact sampling.
function roadPuddles() {
  const size = 64, random = rng(17803);
  const values = Uint8Array.from({ length: size * size }, () => Math.floor(random() * 256));
  const texture = new THREE.DataTexture(values, size, size, THREE.RedFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const value = (i, j) => values[(j & (size - 1)) * size + (i & (size - 1))] / 255;
  function noise(x, z) {
    const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j;
    const a = THREE.MathUtils.lerp(value(i, j), value(i + 1, j), u * u * (3 - 2 * u));
    const b = THREE.MathUtils.lerp(value(i, j + 1), value(i + 1, j + 1), u * u * (3 - 2 * u));
    return THREE.MathUtils.lerp(a, b, v * v * (3 - 2 * v));
  }
  function sample(x, z) {
    const edge = p => Math.abs(p - THREE.MathUtils.clamp(Math.round(p / P), 0, ROADS - 1) * P);
    const kerb = THREE.MathUtils.smoothstep(Math.min(edge(x), edge(z)), 6.6, 9.7) * 0.22;
    const depth = noise(x * 0.045, z * 0.045) * 0.65 + noise(x * 0.19 + 7, z * 0.19 + 7) * 0.35 + kerb;
    return THREE.MathUtils.smoothstep(depth, 0.52, 0.70);
  }
  return { texture, sample, size };
}

function roadMaterial(refl, repX, repY, puddles) {
  const L = new THREE.TextureLoader();
  const tex = (s, srgb) => { const t = L.load(`/evermile/assets/materials/asphalt_03_${s}_1k.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repX, repY); t.anisotropy = 16; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const m = new THREE.MeshStandardMaterial({ map: tex('diff', true), normalMap: tex('nor_gl'), roughnessMap: tex('rough'), roughness: 1, metalness: 0, envMapIntensity: 0.3, normalScale: new THREE.Vector2(0.5, 0.5) });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, refl.uniforms);
    sh.uniforms.uPuddleNoise = { value: puddles.texture };
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform sampler2D uRefl, uPuddleNoise; uniform mat4 uReflVP; uniform float uReflOn, uTime, uWet; varying vec3 vWPos;\n${GLSL_HASH}
float adPuddleNoise(vec2 p) {
  vec2 cell = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return texture2D(uPuddleNoise, (cell + f + 0.5) / ${puddles.size.toFixed(1)}).r;
}
// Painted lines for one carriageway: lat = distance from the centre line, along = distance from the nearest junction.
vec2 adMark(float lat, float sLat, float along, float run){
  float white = 0.0, yellow = 0.0;
  if (lat < ${HALF.toFixed(1)} && along > ${HALF.toFixed(1)}) {
    float open = step(16.5, along);
    yellow = open * (1.0 - smoothstep(0.065, 0.08, abs(lat - 0.2)));
    white = open * (1.0 - smoothstep(0.065, 0.08, abs(lat - 3.7))) * step(fract(run / 9.0), 0.36);
    white = max(white, step(20.0, along) * (1.0 - smoothstep(0.05, 0.065, abs(lat - 7.4))));
    white = max(white, step(abs(along - 15.0), 0.25) * step(lat, 7.4));
    float ay = 27.0 - along; vec2 al = vec2(min(abs(lat - 1.9), abs(lat - 5.5)), ay);
    white = max(white, step(0.0, ay) * (step(al.x, 0.085) * step(ay, 3.3) + step(3.3, ay) * step(ay, 4.9) * step(al.x, (4.9 - ay) * 0.34)));
    white = max(white, step(abs(along - 12.3), 1.5) * step(lat, 9.2) * step(fract(sLat / 1.15), 0.52));
  }
  return vec2(white, yellow);
}\n` + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
  vec2 adW = vWPos.xz; vec2 adC = adW - ${P.toFixed(1)} * clamp(floor(adW / ${P.toFixed(1)} + 0.5), 0.0, ${(ROADS - 1).toFixed(1)});
  vec2 adA = abs(adC);
  vec2 adMk = max(adMark(adA.x, adC.x, adA.y, adW.y), adMark(adA.y, adC.y, adA.x, adW.x));
  float adTexL = dot(diffuseColor.rgb, vec3(0.333));
  float adWear = smoothstep(0.08, 0.3, adTexL + adN(adW * 1.7) * 0.25);
  adMk *= adWear;
  float adPud = smoothstep(0.52, 0.7, adPuddleNoise(adW * 0.045) * 0.65 + adPuddleNoise(adW * 0.19 + 7.0) * 0.35 + smoothstep(6.6, 9.7, min(adA.x, adA.y)) * 0.22);
  adPud *= (1.0 - max(adMk.x, adMk.y) * 0.5) * uWet;
  // Repair patches, manhole covers and kerb-side drains.
  vec2 adPc = floor(adW / vec2(17.0, 31.0)); float adPatch = step(0.72, adH(adPc)) * step(abs(fract(adW.x / 17.0) - 0.5), 0.12 + 0.2 * adH(adPc + 3.0)) * step(abs(fract(adW.y / 31.0) - 0.5), 0.1 + 0.3 * adH(adPc + 7.0));
  vec2 adMc = floor(adW / 23.0); vec2 adMo = (fract(adW / 23.0) - 0.5 - (vec2(adH(adMc + 1.0), adH(adMc + 2.0)) - 0.5) * 0.6) * 23.0; float adMd = length(adMo);
  float adHole = (1.0 - smoothstep(0.4, 0.43, adMd)) * step(0.45, adH(adMc + 5.0));
  float adLatK = min(adA.x, adA.y), adRunK = adA.x < adA.y ? adW.y : adW.x;
  float adDrain = step(abs(adLatK - ${(HALF - 0.32).toFixed(2)}), 0.2) * step(abs(fract(adRunK / 15.0) - 0.5), 0.022) * step(${(HALF + 2).toFixed(1)}, max(adA.x, adA.y));
  adPud *= (1.0 - adPatch) * (1.0 - adHole);
  diffuseColor.rgb *= mix(mix(0.92, 0.5, uWet), 0.24, adPud) * mix(1.0, 0.6, adPatch);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.045, 0.045, 0.05) * (0.7 + 0.6 * step(0.5, fract(adMo.x * 6.0)) * step(0.5, fract(adMo.y * 6.0))), adHole);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012) + 0.03 * step(0.5, fract(adRunK * 14.0)), adDrain);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.62, 0.6), adMk.x * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66, 0.47, 0.08), adMk.y * 0.9);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(mix(clamp(roughnessFactor * 0.9 + 0.12, 0.5, 0.95), clamp(roughnessFactor * 0.52 + 0.08, 0.16, 0.6), uWet), 0.025, adPud);
  roughnessFactor = mix(roughnessFactor, 0.3, max(adMk.x, adMk.y) * (1.0 - adPud));
  roughnessFactor = mix(mix(roughnessFactor, 0.7, adPatch), 0.3, adHole);
  float adRR = roughnessFactor; roughnessFactor = max(roughnessFactor, 0.34);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  normal = normalize(mix(normal, nonPerturbedNormal, adPud * 0.97));`)
      .replace('#include <opaque_fragment>', `
  {
    vec4 adRc = uReflVP * vec4(vWPos, 1.0); vec2 adUv = adRc.xy / adRc.w * 0.5 + 0.5;
    float adNdv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
    float adF = 0.03 + 0.97 * pow(1.0 - adNdv, 4.2);
    // Rain rings in the standing water.
    vec2 adRp = adW * 1.6; vec2 adCi = floor(adRp), adCf = fract(adRp) - 0.5; float adHh = adH(adCi);
    float adT = fract(uTime * (0.7 + adHh * 0.6) + adHh * 9.0), adD = length(adCf);
    float adRing = sin(46.0 * (adD - adT * 0.45)) * smoothstep(0.45 * adT + 0.04, 0.45 * adT, adD) * smoothstep(0.45 * adT - 0.14, 0.45 * adT, adD) * (1.0 - adT);
    vec2 adDis = (normal.xy - nonPerturbedNormal.xy) * 0.018 + (adCf / max(adD, 0.01)) * adRing * 0.006 * adPud;
    float adDist = length(vViewPosition);
    float adBias = adRR * 9.5 + smoothstep(120.0, 500.0, adDist) * 1.5;
    float adSpread = adRR * 0.11 + 0.0015;
    vec3 adCol = vec3(0.0);
    adCol += texture2D(uRefl, adUv + adDis, adBias).rgb * 0.32;
    adCol += texture2D(uRefl, adUv + adDis + vec2(0.0, adSpread), adBias).rgb * 0.2;
    adCol += texture2D(uRefl, adUv + adDis - vec2(0.0, adSpread), adBias).rgb * 0.2;
    adCol += texture2D(uRefl, adUv + adDis + vec2(0.0, adSpread * 2.2), adBias + 0.6).rgb * 0.14;
    adCol += texture2D(uRefl, adUv + adDis - vec2(0.0, adSpread * 2.2), adBias + 0.6).rgb * 0.14;
    float adWet = mix(0.3, 1.0, adPud) * (1.0 - adRR * 0.7);
    outgoingLight += min(adCol, vec3(3.5)) * adF * adWet * uReflOn;
  }
#include <opaque_fragment>`);
  };
  return m;
}

// Eight shop interiors drawn once into an atlas; they sit on the back wall of every ground-floor unit.
function shopAtlas() {
  return canvasTex(2048, 1024, (c) => {
    const r = rng(77), S = 512;
    const glow = (x, y, rad, col, a = 1) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); c.globalAlpha = 1; };
    const shelves = (x, y, w, h, rows, pal) => { for (let i = 0; i < rows; i++) { const yy = y + i * h / rows; c.fillStyle = 'rgba(20,20,24,.9)'; c.fillRect(x, yy + h / rows - 5, w, 5); for (let px = x + 3; px < x + w - 8;) { const pw = 7 + r() * 13, ph = (h / rows - 9) * (0.55 + r() * 0.45); c.fillStyle = pal[Math.floor(r() * pal.length)]; c.fillRect(px, yy + h / rows - 5 - ph, pw, ph); px += pw + 2; } } };
    const themes = [
      (x, y) => { c.fillStyle = '#d9dde0'; c.fillRect(x, y, S, S); shelves(x + 20, y + 120, 300, 250, 5, ['#e14b3b', '#f2c230', '#3b8fe1', '#44b46a', '#f4f4f4', '#f08a2c']); c.fillStyle = '#bfe9ff'; c.fillRect(x + 340, y + 110, 150, 270); glow(x + 415, y + 245, 190, 'rgba(160,230,255,.9)', 0.7); for (let i = 0; i < 4; i++) { c.fillStyle = '#5a8aa6'; c.fillRect(x + 345, y + 170 + i * 55, 140, 4); } c.fillStyle = '#f7f7f2'; c.fillRect(x, y + 20, S, 26); c.fillStyle = '#8a8f96'; c.fillRect(x, y + 400, S, 112); },
      (x, y) => { const g = c.createLinearGradient(x, y, x, y + S); g.addColorStop(0, '#3a140c'); g.addColorStop(1, '#7a2c14'); c.fillStyle = g; c.fillRect(x, y, S, S); for (let i = 0; i < 5; i++) { glow(x + 60 + i * 98, y + 110, 70, 'rgba(255,120,50,.95)'); c.fillStyle = '#e6341c'; c.beginPath(); c.ellipse(x + 60 + i * 98, y + 110, 24, 32, 0, 0, 7); c.fill(); } c.fillStyle = '#1a0d08'; c.fillRect(x, y + 330, S, 182); c.fillStyle = '#c98a4a'; c.fillRect(x, y + 318, S, 16); c.fillStyle = '#20100a'; c.fillRect(x + 40, y + 180, 430, 60); c.fillStyle = '#ffe2a8'; for (let i = 0; i < 6; i++) c.fillRect(x + 56 + i * 70, y + 195, 46, 7 + (i % 3) * 8); },
      (x, y) => { c.fillStyle = '#c9d6de'; c.fillRect(x, y, S, S); c.fillStyle = '#eef4f7'; c.fillRect(x, y + 30, S, 20); for (let i = 0; i < 5; i++) { const cx = x + 56 + i * 100, cy = y + 290; c.fillStyle = '#f2f4f5'; c.fillRect(cx - 44, cy - 80, 88, 170); c.fillStyle = '#2a3440'; c.beginPath(); c.arc(cx, cy, 32, 0, 7); c.fill(); c.strokeStyle = '#9fb2c0'; c.lineWidth = 6; c.stroke(); c.fillStyle = 'rgba(120,200,255,.5)'; c.beginPath(); c.arc(cx, cy, 22, 0, 7); c.fill(); } c.fillStyle = '#7d8a93'; c.fillRect(x, y + 440, S, 72); },
      (x, y) => { c.fillStyle = '#e9f2ec'; c.fillRect(x, y, S, S); shelves(x + 20, y + 150, 470, 230, 4, ['#ffffff', '#3fa46a', '#2f7fd0', '#f0f0f0', '#e2574c']); glow(x + 256, y + 80, 120, 'rgba(60,255,140,.95)'); c.fillStyle = '#12c060'; c.fillRect(x + 236, y + 40, 40, 100); c.fillRect(x + 206, y + 70, 100, 40); c.fillStyle = '#b9c7bf'; c.fillRect(x, y + 400, S, 112); c.fillStyle = '#f5f8f6'; c.fillRect(x + 150, y + 380, 220, 60); },
      (x, y) => { const g = c.createLinearGradient(x, y, x, y + S); g.addColorStop(0, '#2b1d14'); g.addColorStop(1, '#5a3c26'); c.fillStyle = g; c.fillRect(x, y, S, S); for (let i = 0; i < 4; i++) { c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 80 + i * 118, y); c.lineTo(x + 80 + i * 118, y + 130); c.stroke(); glow(x + 80 + i * 118, y + 150, 95, 'rgba(255,200,120,.95)'); c.fillStyle = '#ffe9c0'; c.beginPath(); c.arc(x + 80 + i * 118, y + 140, 15, 0, 7); c.fill(); } c.fillStyle = '#141009'; c.fillRect(x + 30, y + 210, 200, 90); c.fillStyle = '#e8d8b8'; for (let i = 0; i < 5; i++) c.fillRect(x + 44, y + 224 + i * 14, 90 + (i * 37 % 70), 4); c.fillStyle = '#1c130c'; c.fillRect(x, y + 400, S, 112); for (let i = 0; i < 3; i++) { c.fillStyle = '#3b2a1c'; c.fillRect(x + 60 + i * 150, y + 372, 90, 10); c.fillRect(x + 100 + i * 150, y + 380, 10, 60); } },
      (x, y) => { c.fillStyle = '#0b0714'; c.fillRect(x, y, S, S); for (let i = 0; i < 6; i++) { const cx = x + 20 + i * 82, hue = (i * 67) % 360; c.fillStyle = '#15121f'; c.fillRect(cx, y + 190, 66, 250); c.fillStyle = `hsl(${hue},95%,60%)`; c.fillRect(cx + 7, y + 205, 52, 62); glow(cx + 33, y + 236, 80, `hsla(${hue},95%,60%,.9)`, 0.8); c.fillStyle = `hsl(${(hue + 150) % 360},90%,60%)`; c.fillRect(cx + 7, y + 160, 52, 16); } c.strokeStyle = '#ff2bd6'; c.lineWidth = 6; c.shadowColor = '#ff2bd6'; c.shadowBlur = 20; c.strokeRect(x + 30, y + 40, 452, 80); c.shadowBlur = 0; },
      (x, y) => { c.fillStyle = '#ece8e2'; c.fillRect(x, y, S, S); for (let i = 0; i < 4; i++) glow(x + 70 + i * 124, y + 30, 150, 'rgba(255,250,235,.9)', 0.8); for (let i = 0; i < 3; i++) { const cx = x + 100 + i * 150; c.fillStyle = ['#23262d', '#7a1f2a', '#2c3a55'][i]; c.fillRect(cx - 6, y + 182, 12, 28); c.beginPath(); c.moveTo(cx - 44, y + 400); c.lineTo(cx - 50, y + 215); c.quadraticCurveTo(cx, y + 185, cx + 50, y + 215); c.lineTo(cx + 44, y + 400); c.fill(); c.fillStyle = '#c9c4bb'; c.fillRect(cx - 34, y + 400, 68, 12); } c.fillStyle = '#b5aea3'; c.fillRect(x, y + 412, S, 100); },
      (x, y) => { c.fillStyle = '#120a06'; c.fillRect(x, y, S, S); const g = c.createLinearGradient(x, y + 90, x, y + 330); g.addColorStop(0, '#ffb24a'); g.addColorStop(1, '#a3470f'); c.fillStyle = g; c.fillRect(x + 40, y + 90, 432, 230); for (let row = 0; row < 3; row++) { c.fillStyle = '#1a0e07'; c.fillRect(x + 40, y + 160 + row * 76, 432, 8); for (let i = 0; i < 20; i++) { c.fillStyle = ['#2a1608', '#40210c', '#0f2a1c', '#3a0d10'][Math.floor(r() * 4)]; const bh = 34 + r() * 26; c.fillRect(x + 50 + i * 21, y + 160 + row * 76 - bh, 13, bh); } } c.fillStyle = '#2a170c'; c.fillRect(x, y + 372, S, 140); c.fillStyle = '#6b3a1a'; c.fillRect(x, y + 360, S, 14); }
    ];
    themes.forEach((t, k) => { const x = (k % 4) * S, y = Math.floor(k / 4) * S; c.save(); c.beginPath(); c.rect(x, y, S, S); c.clip(); t(x, y); c.restore(); });
  });
}

// What stands just behind the glass of each shop: counters, stools, racks and people, drawn with transparency
// so the interior shows between them. Same order as the interiors above.
function shopFront() {
  return canvasTex(2048, 1024, (c) => {
    const S = 512, r = rng(31);
    const stool = (x, y) => { c.fillStyle = '#1a1512'; c.fillRect(x - 3, y - 70, 6, 70); c.fillRect(x - 22, y - 80, 44, 12); c.fillRect(x - 18, y - 6, 36, 6); };
    const box = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y - h, w, h); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x, y - h, w, 6); };
    const neon = (x, y, txt, col) => { c.save(); c.font = '800 40px Arial, sans-serif'; c.textAlign = 'center'; c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = col; c.fillText(txt, x, y); c.fillStyle = '#fff'; c.globalAlpha = 0.7; c.fillText(txt, x, y); c.restore(); };
    const fronts = [
      (x, y) => { box(x + 20, y + S, 190, 150, '#e9ecee'); box(x + 40, y + S - 150, 60, 40, '#2a2e33'); for (let i = 0; i < 4; i++) box(x + 300 + i * 48, y + S, 40, 200 - i * 22, ['#c9302c', '#f0b429', '#2f7fd0', '#3aa76d'][i]); neon(x + 380, y + 90, 'OPEN', '#3dffb0'); },
      (x, y) => { box(x, y + S, S, 150, '#3b2416'); c.fillStyle = '#d7a35c'; c.fillRect(x, y + S - 156, S, 10); for (let i = 0; i < 5; i++) stool(x + 60 + i * 98, y + S); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#7a1a12' : '#2a1a30'; c.fillRect(x + 12 + i * 84, y, 70, 110); c.fillStyle = '#f4e2c0'; c.font = '700 40px Arial'; c.fillText('麺'[0], x + 30 + i * 84, y + 70); } },
      (x, y) => { box(x + 60, y + S, 380, 120, '#dfe5ea'); for (let i = 0; i < 3; i++) { c.fillStyle = ['#3a78c2', '#c2533a', '#e8e8e8'][i]; c.beginPath(); c.ellipse(x + 130 + i * 120, y + S - 135, 44, 26, 0, 0, 7); c.fill(); } neon(x + 256, y + 80, '24H', '#6fd3ff'); },
      (x, y) => { for (let i = 0; i < 3; i++) { box(x + 40 + i * 160, y + S, 110, 230, '#f3f6f4'); for (let k = 0; k < 3; k++) for (let q = 0; q < 4; q++) { c.fillStyle = ['#2f9e5f', '#2f7fd0', '#e8554a', '#f2c230'][(k + q + i) % 4]; c.fillRect(x + 48 + i * 160 + q * 25, y + S - 215 + k * 68, 20, 44); } } neon(x + 256, y + 70, '+', '#3dff8a'); },
      (x, y) => { for (let i = 0; i < 3; i++) { const tx = x + 90 + i * 165; c.fillStyle = '#2b1d12'; c.fillRect(tx - 46, y + S - 120, 92, 10); c.fillRect(tx - 5, y + S - 112, 10, 112); c.fillStyle = '#3a2a1c'; c.fillRect(tx - 80, y + S - 80, 26, 80); c.fillRect(tx + 54, y + S - 80, 26, 80); c.fillStyle = '#f4efe6'; c.fillRect(tx - 14, y + S - 140, 12, 20); } neon(x + 256, y + 70, 'COFFEE', '#ffc46b'); },
      (x, y) => { box(x + 40, y + S, 150, 300, '#1b1830'); c.fillStyle = 'rgba(120,220,255,.75)'; c.fillRect(x + 54, y + S - 280, 122, 150); c.fillStyle = '#ff4fb0'; c.beginPath(); c.arc(x + 115, y + S - 200, 26, 0, 7); c.fill(); box(x + 330, y + S, 130, 260, '#221a35'); c.fillStyle = '#ffd23f'; c.fillRect(x + 344, y + S - 240, 102, 90); neon(x + 256, y + 66, 'PLAY', '#ff4fd8'); },
      (x, y) => { for (let i = 0; i < 3; i++) { const cx = x + 100 + i * 156; c.fillStyle = ['#1d2026', '#7a1f2a', '#2c3a55'][i]; c.fillRect(cx - 6, y + S - 308, 12, 27); c.beginPath(); c.moveTo(cx - 46, y + S - 30); c.lineTo(cx - 54, y + S - 290); c.quadraticCurveTo(cx, y + S - 320, cx + 54, y + S - 290); c.lineTo(cx + 46, y + S - 30); c.fill(); c.fillStyle = '#d8d2c8'; c.fillRect(cx - 40, y + S - 30, 80, 30); } neon(x + 256, y + 66, 'SALE', '#ff5a5a'); },
      (x, y) => { box(x, y + S, S, 170, '#2a160b'); c.fillStyle = '#8a4b1f'; c.fillRect(x, y + S - 178, S, 12); for (let i = 0; i < 5; i++) stool(x + 56 + i * 100, y + S); neon(x + 256, y + 70, 'BAR', '#ffb347'); }
    ];
    c.clearRect(0, 0, 2048, 1024);
    fronts.forEach((f, k) => { const x = (k % 4) * S, y = Math.floor(k / 4) * S; c.save(); c.beginPath(); c.rect(x, y, S, S); c.clip(); f(x, y); c.restore(); });
  });
}

function buildingMaterial(timeU, litU) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, envMapIntensity: 1.0 });
  const shop = shopAtlas(), shopF = shopFront();
  m.onBeforeCompile = sh => {
    sh.uniforms.uShop = { value: shop }; sh.uniforms.uShopF = { value: shopF }; sh.uniforms.uTime = timeU; sh.uniforms.uLitK = litU;
    sh.vertexShader = 'attribute vec4 aInfo; varying vec3 vWPos; varying vec3 vWN; flat varying vec4 vInfo;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(instanceMatrix) * normal); vInfo = aInfo;`);
    sh.fragmentShader = `uniform sampler2D uShop, uShopF; uniform float uTime, uLitK; varying vec3 vWPos; varying vec3 vWN; flat varying vec4 vInfo;\n${GLSL_HASH}` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  vec3 adNw = normalize(vWN); float adWall = step(abs(adNw.y), 0.5);
  vec3 adTw = normalize(vec3(-adNw.z, 0.0, adNw.x) + vec3(1e-5, 0.0, 0.0));
  float adSi = vInfo.x, vSeed = adSi / 4096.0;
  float adCoastal = step(2.5, vInfo.y);
  float adGlassT = step(vInfo.y, 0.5), adBrickT = step(0.5, vInfo.y) * step(vInfo.y, 1.5), adConcT = step(1.5, vInfo.y);
  float adU = dot(vWPos, adTw) + mod(adSi, 37.0), adV = vWPos.y;
  float adS2 = fract(vSeed * 13.7), adS3 = fract(vSeed * 29.3);
  float adGround = step(adV, 5.3);
  float adCw = mix(vInfo.z, 6.0, adGround), adCh = mix(vInfo.w, 5.2, adGround);
  vec2 adUV = vec2(adU / adCw, (adV - 0.1) / adCh); vec2 adCell = floor(adUV), adFr = fract(adUV);
  float adFx = mix(adGlassT * 0.035 + adBrickT * (0.18 + 0.07 * adS3) + mix(adConcT * 0.02, 0.12, adCoastal), 0.058, adGround);
  float adFy = mix(adGlassT * 0.25 + adBrickT * 0.27 + adConcT * 0.36, mix(0.1, 0.21, step(0.5, adS2)), adGround);
  float adTop = mix(adGlassT * 0.03 + adBrickT * 0.13 + adConcT * 0.07, 0.24, adGround);
  float adWin = smoothstep(adFx, adFx + 0.012, adFr.x) * smoothstep(adFx, adFx + 0.012, 1.0 - adFr.x) * smoothstep(adFy, adFy + 0.012, adFr.y) * smoothstep(adTop, adTop + 0.012, 1.0 - adFr.y) * adWall;
  adWin *= mix(1.0, smoothstep(0.012, 0.02, abs(fract(adFr.x * 3.0 + 0.5) - 0.5)), adGround);
  float adGrime = 0.7 + 0.6 * adN(vec2(adU * 0.08, adV * 0.03) + adSi);
  float adStreak = 1.0 - 0.45 * smoothstep(0.45, 0.8, adN(vec2(adU * 1.7, adV * 0.06) + adSi * 0.37));
  // Masonry: brick courses with mortar, pale stone sills and lintels.
  vec2 adBq = vec2(adU / 0.26, adV / 0.085); adBq.x += 0.5 * mod(floor(adBq.y), 2.0);
  float adBfade = clamp(1.0 - fwidth(adBq.y) * 1.3, 0.0, 1.0);
  vec2 adBf = fract(adBq); float adMortar = (1.0 - step(0.06, adBf.x) * step(0.14, adBf.y)) * adBfade;
  vec3 adBrickA = mix(vec3(0.17, 0.07, 0.05), vec3(0.2, 0.15, 0.1), step(0.5, adS2));
  vec3 adBrick = mix(adBrickA * (0.75 + 0.5 * adH(floor(adBq) + adSi) * adBfade), vec3(0.13, 0.12, 0.11), adMortar) * adGrime;
  float adSill = step(adFx - 0.04, adFr.x) * step(adFx - 0.04, 1.0 - adFr.x) * (step(adFy - 0.06, adFr.y) * step(adFr.y, adFy) + step(1.0 - adTop, adFr.y) * step(adFr.y, 1.0 - adTop + 0.07));
  adBrick = mix(adBrick, vec3(0.3, 0.28, 0.25) * adGrime, adSill);
  // Concrete: cast panels with joints and rain streaks under the ribbon windows.
  float adJoint = 1.0 - 0.55 * max(1.0 - smoothstep(0.0, 0.012, abs(adFr.x - 0.5) - 0.488), 1.0 - smoothstep(0.0, 0.02, adFr.y));
  vec3 adConc = mix(vec3(0.1, 0.1, 0.098), vec3(0.17, 0.165, 0.155), adS2) * adGrime * adStreak * adJoint;
  adConc *= mix(vec3(1.22, 1.17, 1.05), vec3(0.94, 1.03, 1.09), adS3);
  vec3 adPlaster = mix(vec3(0.47, 0.40, 0.31), vec3(0.28, 0.38, 0.38), step(0.62, adS2)) * adGrime;
  adPlaster *= 0.83 + 0.23 * adN(vec2(adU, adV) * 3.1);
  adPlaster *= mix(0.69, 1.0, smoothstep(0.0, 0.12, adFr.y));
  adConc = mix(adConc, adPlaster, adCoastal);
  // Curtain wall: dark spandrel glass between aluminium mullions.
  float adMull = 1.0 - smoothstep(0.0, 0.01, min(adFr.x, 1.0 - adFr.x) - 0.022);
  vec3 adCurt = mix(mix(vec3(0.05, 0.07, 0.095), vec3(0.09, 0.08, 0.07), step(0.6, adS3)), vec3(0.22, 0.23, 0.25), adMull);
  vec3 adFacade = (adGlassT * adCurt + adBrickT * adBrick + adConcT * adConc) * mix(0.5, 1.0, smoothstep(0.0, 2.6, adV));
  float adFascia = adGround * step(1.0 - adTop, adFr.y);
  adFacade = mix(adFacade, mix(vec3(0.02, 0.022, 0.028), vec3(0.09, 0.05, 0.04), step(0.5, fract(adSi * 0.37))) * adGrime, max(adFascia, adGround * (1.0 - adGlassT) * 0.6));
  diffuseColor.rgb = mix(mix(vec3(0.035, 0.036, 0.04) * adGrime, adFacade, adWall), vec3(0.3, 0.36, 0.45), adWin);
  // Which rooms have their lights on.
  vec2 adId = adCell + vec2(adSi, mod(adSi, 61.0));
  float adHc = adH(adId);
  float adFloorLit = step(adH(vec2(adCell.y, adSi)), 0.2);
  float adLit = max(step(adHc, mix(0.16, 0.44, fract(vSeed * 5.3)) + adBrickT * 0.06), adFloorLit * step(adHc, 0.8) * (1.0 - adBrickT));
  adLit = mix(adLit, step(adHc, 0.9), adGround);
  // Interior mapping: trace the view ray into a box room behind the glass.
  vec3 adVd = normalize(vWPos - cameraPosition);
  vec3 adO = vec3(adFr, 0.0);
  vec3 adDd = vec3(dot(adVd, adTw) / adCw, adVd.y / adCh, max(-dot(adVd, adNw), 0.02) / mix(5.5, 2.3, adGround)) + 1e-5;
  vec3 adTt = (step(0.0, adDd) - adO) / adDd; float adTm = min(adTt.x, min(adTt.y, adTt.z)); vec3 adPp = adO + adDd * adTm;
  float adH2 = adH(adId + 17.0), adH3 = adH(adId + 41.0);
  vec3 adWallCol = mix(vec3(0.72, 0.64, 0.52), vec3(0.46, 0.52, 0.58), step(0.5, adH3));
  vec3 adRoom; float adShopHit = 0.0;
  if (adTt.z <= adTm + 1e-4) {
    vec2 adBk = floor(adPp.xy * vec2(3.0, 4.0));
    adRoom = adWallCol * (0.34 + 0.56 * adH(adBk + adId));
    adRoom *= mix(1.0, 0.28 + 0.5 * adH(vec2(adBk.x, 3.0) + adId), step(adPp.y, 0.34));
    adShopHit = 1.0;
  }
  else if (adTt.y <= adTm + 1e-4) adRoom = adDd.y > 0.0 ? vec3(0.5) + vec3(0.9) * step(abs(fract(adPp.z * 2.0 + 0.25) - 0.5), 0.12) * step(abs(fract(adPp.x * 2.0) - 0.5), 0.36) : mix(vec3(0.2, 0.16, 0.13), vec3(0.3) * (0.75 + 0.25 * step(0.5, fract(adPp.x * 3.0)) * step(0.5, fract(adPp.z * 3.0)) + 0.25 * step(fract(adPp.x * 3.0), 0.5) * step(fract(adPp.z * 3.0), 0.5)), adGround);
  else adRoom = adWallCol * (0.3 + 0.3 * adH(floor(adPp.zy * vec2(2.0, 3.0)) + adId + 3.0));
  adRoom *= mix(1.0, 0.45, adPp.z);
  vec3 adLc = adH2 < 0.45 ? vec3(1.0, 0.7, 0.42) : adH2 < 0.75 ? vec3(1.0, 0.9, 0.76) : adH2 < 0.9 ? vec3(0.55, 0.78, 1.0) : adH2 < 0.95 ? vec3(1.0, 0.25, 0.75) : vec3(0.2, 1.0, 0.85);
  // A few rooms are lit only by a television.
  float adTv = step(0.93, adH(adId + 71.0)) * (1.0 - adGround);
  adLc = mix(adLc, vec3(0.35, 0.55, 1.0) * (0.35 + 0.65 * adH(vec2(floor(uTime * 6.0 + adH2 * 50.0), adH2))), adTv);
  // Shops show a full interior on their back wall.
  float adShopId = floor(adH(adId + 23.0) * 8.0);
  vec3 adShop = texture2D(uShop, (vec2(mod(adShopId, 4.0), 1.0 - floor(adShopId / 4.0)) + clamp(adPp.xy, 0.004, 0.996)) / vec2(4.0, 2.0)).rgb;
  adRoom = mix(adRoom, mix(adRoom * mix(vec3(0.5), adShop, 0.5) * 1.3, adShop * 1.25, adShopHit), adGround);
  // A second layer a little way in: furniture and people that slide against the back wall as you pass.
  float adTf = 0.3 / adDd.z; vec2 adFq = adO.xy + adDd.xy * adTf;
  vec4 adFront = texture2D(uShopF, (vec2(mod(adShopId, 4.0), 1.0 - floor(adShopId / 4.0)) + clamp(adFq, 0.004, 0.996)) / vec2(4.0, 2.0));
  float adFa = adFront.a * adGround * step(adTf, adTm) * step(0.0, adFq.x) * step(adFq.x, 1.0) * step(0.0, adFq.y) * step(adFq.y, 1.0);
  adRoom = mix(adRoom, adFront.rgb * 0.9, adFa);
  adLc = mix(adLc, vec3(1.0, 0.96, 0.9), adGround);
  float adBlind = step(adH(adId + 5.0), 0.3) * step(0.25 + 0.6 * adH(adId + 11.0), adFr.y) * (1.0 - adGround);
  adRoom = mix(adRoom, vec3(0.3) * (0.8 + 0.2 * step(0.5, fract(adFr.y * 26.0))), adBlind);
  vec3 adEmit = adRoom * adLc * adWin * adLit * mix(1.15 * step(adH(adId + 97.0), uLitK * 0.85 + 0.15) * mix(0.3, 1.0, uLitK), mix(0.8, 1.25, uLitK), adGround);
  // Shut shops pull down a ribbed shutter.
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.072, 0.08) * (0.7 + 0.3 * step(0.5, fract(adV * 9.0))), adGround * adWin * (1.0 - adLit));
  float adShut = adGround * adWin * (1.0 - adLit);
  float adWallR = mix(0.5, 0.9, adN(vec2(adU * 0.5, adV * 0.5) + adSi)) * adStreak;
  float adWallRough = adGlassT * mix(0.16, 0.4, adMull) + adBrickT * (adWallR + 0.1) + adConcT * adWallR;
  float adWallMetal = adGlassT * mix(0.75, 1.0, adMull);
  // The display sits back from the glass. Darken the sill and the upper corners of the room.
  vec2 adEdge = min(adFr, 1.0 - adFr);
  float adRecess = mix(0.44, 1.0, smoothstep(0.045, 0.25, min(adEdge.x, adEdge.y)));
  float adFresnel = pow(1.0 - clamp(-dot(adVd, adNw), 0.0, 1.0), 3.0);
  float adShopGlass = adGround * adWin * adLit;
  vec3 adDisplay = mix(vec3(dot(adEmit, vec3(0.22, 0.7, 0.08))), adEmit, 0.44);
  adEmit = mix(adEmit, adDisplay * adRecess * mix(0.3, 0.93, uLitK) * (1.0 - adFresnel * 0.58), adShopGlass);
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.018, 0.028, 0.035), vec3(0.07, 0.09, 0.11), adFresnel), adShopGlass);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(mix(0.85, adWallRough, adWall), mix(mix(0.08, 0.22, adShopGlass), 0.6, adShut), adWin);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = mix(adWallMetal * adWall * (1.0 - adGround), mix(0.85, 0.5, adShut), adWin);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += adEmit;');
  };
  return m;
}

// The photo-textured building models: at night some of their windows light up.
export function kitMaterial(src, litU) {
  const m = src.clone(); m.envMapIntensity = 0.55; m.roughness = Math.max(m.roughness, 0.7); m.metalness = 0;
  m.onBeforeCompile = sh => { sh.uniforms.uLitK = litU;
    sh.vertexShader = 'varying vec3 vWPos; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(instanceMatrix) * normal);');
    sh.fragmentShader = `uniform float uLitK; varying vec3 vWPos; varying vec3 vWN;\n${GLSL_HASH}` + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
  float adLum = dot(diffuseColor.rgb, vec3(0.333)); vec3 adNw = normalize(vWN); vec3 adTw = normalize(vec3(-adNw.z, 0.0, adNw.x) + vec3(1e-5, 0.0, 0.0));
  vec2 adWindow = vec2(dot(vWPos, adTw) / 3.3, vWPos.y / 2.95);
  vec2 adCell = floor(adWindow), adEdge = abs(fract(adWindow) - 0.5);
  float adMask = (1.0 - smoothstep(0.23, 0.43, adEdge.x)) * (1.0 - smoothstep(0.24, 0.43, adEdge.y));
  float adOn = step(adH(adCell), 0.22 * uLitK) * adMask * step(abs(adNw.y), 0.5) * step(6.0, vWPos.y);
  vec3 adKitEmit = mix(vec3(1.0, 0.7, 0.38), vec3(0.75, 0.86, 1.0), step(0.78, adH(adCell + 7.0))) * (1.0 - smoothstep(0.095, 0.23, adLum)) * smoothstep(0.005, 0.055, diffuseColor.b - diffuseColor.r * 0.86) * adOn * 0.57;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += adKitEmit;'); };
  return m;
}

function signAtlas() {
  const words = ['NOVA', 'HELIX', 'ORBIT', 'RAMEN 24', 'HOTEL', 'ARCADE', 'SYNTH', 'BAR ZERO', 'LOTUS', 'VOLT', 'MIRA', 'ONYX', 'NOODLES', 'PHARMA+', 'CINEMA', 'KARAOKE', 'TAXI', 'OPEN 24H', 'DINER', 'CASINO', 'VINYL', 'TATTOO', 'CLUB 9', 'SAUNA', 'MOTEL', 'PIZZA', 'LASER', 'ECHO', 'PRISM', 'KOI', 'EXIT 7', 'ATLAS'];
  const colors = [];
  const tex = canvasTex(2048, 2048, (c) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, 2048, 2048); const r = rng(11);
    words.forEach((w, k) => {
      const x = (k % 4) * 512, y = Math.floor(k / 4) * 256, hex = NEON[Math.floor(r() * NEON.length)], hex2 = NEON[Math.floor(r() * NEON.length)]; colors.push(hex);
      const css = h => '#' + h.toString(16).padStart(6, '0');
      const g = c.createLinearGradient(x, y, x, y + 256); g.addColorStop(0, '#07080d'); g.addColorStop(1, '#10121c'); c.fillStyle = g; c.fillRect(x + 4, y + 4, 504, 248);
      c.save(); c.shadowColor = css(hex2); c.shadowBlur = 22; c.strokeStyle = css(hex2); c.lineWidth = 7; c.strokeRect(x + 26, y + 26, 460, 204); c.restore();
      c.save(); c.font = `800 ${w.length > 6 ? 84 : 118}px "Arial Black", "Helvetica Neue", Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = css(hex); c.shadowBlur = 34; c.fillStyle = css(hex); c.fillText(w, x + 256, y + 132, 420); c.shadowBlur = 10; c.fillStyle = '#ffffff'; c.globalAlpha = 0.85; c.fillText(w, x + 256, y + 132, 420); c.restore();
    });
  });
  return { tex, colors, count: words.length };
}

// Thirty-two advertisements for invented brands, used on billboards and cycled on the LED screens.
function adAtlas() {
  const brands = [['NOVA COLA', 'Taste the night', 'can'], ['ORBIT AIR', 'Anywhere by morning', 'plane'], ['KOI SUSHI', 'Fresh every hour', 'fish'], ['VOLT', 'Charge up', 'bolt'], ['MIRA 9', 'The phone that sees', 'phone'], ['HELIX GYM', 'Open 24 hours', 'bell'], ['LOTUS SPA', 'Breathe out', 'flower'], ['PRISM', 'Eyewear since 1989', 'glasses'],
    ['ATLAS BANK', 'Your city, your bank', 'columns'], ['ECHO', 'Hear everything', 'phones'], ['ONYX', 'Time, perfected', 'watch'], ['SOLAR', 'Run lighter', 'shoe'], ['DUNE COFFEE', 'Roasted by the sea', 'cup'], ['PIXEL', 'Level up tonight', 'pad'], ['ZEST BURGER', 'Stacked high', 'burger'], ['LUMA TV', 'Blacker blacks', 'tv']];
  const pal = [['#0b1f4a', '#1d6bff', '#ffffff'], ['#3a0d14', '#ff3b4e', '#fff3d6'], ['#062b24', '#19d3a2', '#f2fffb'], ['#2a1245', '#b45cff', '#ffe9ff'], ['#3b2a05', '#ffb400', '#1a1204'], ['#0d0d10', '#f5f5f5', '#ff4f2e'], ['#04303f', '#3fd0ff', '#ffffff'], ['#40121f', '#ff7ab8', '#ffffff']];
  const icon = (c, k, x, y, s, col) => { c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    if (k === 'can') { c.roundRect(-28, -70, 56, 140, 12); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-28, -18, 56, 30); }
    else if (k === 'plane') { c.moveTo(-80, 10); c.lineTo(80, -30); c.lineTo(20, 20); c.lineTo(30, 60); c.lineTo(0, 30); c.lineTo(-50, 40); c.closePath(); c.fill(); }
    else if (k === 'fish') { c.ellipse(-10, 0, 60, 30, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(45, 0); c.lineTo(85, -30); c.lineTo(85, 30); c.closePath(); c.fill(); }
    else if (k === 'bolt') { c.moveTo(15, -80); c.lineTo(-40, 10); c.lineTo(-5, 10); c.lineTo(-20, 80); c.lineTo(42, -15); c.lineTo(5, -15); c.closePath(); c.fill(); }
    else if (k === 'phone') { c.roundRect(-36, -75, 72, 150, 14); c.fill(); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-28, -62, 56, 112); }
    else if (k === 'bell') { c.fillRect(-60, -8, 120, 16); c.fillRect(-82, -38, 22, 76); c.fillRect(60, -38, 22, 76); }
    else if (k === 'flower') { for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(Math.cos(i * 1.047) * 38, Math.sin(i * 1.047) * 38, 34, 16, i * 1.047, 0, 7); c.fill(); } }
    else if (k === 'glasses') { c.arc(-42, 0, 32, 0, 7); c.stroke(); c.beginPath(); c.arc(42, 0, 32, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-10, 0); c.lineTo(10, 0); c.stroke(); }
    else if (k === 'columns') { c.moveTo(-80, -40); c.lineTo(0, -80); c.lineTo(80, -40); c.closePath(); c.fill(); for (let i = -2; i <= 2; i++) c.fillRect(i * 32 - 9, -30, 18, 80); c.fillRect(-84, 54, 168, 16); }
    else if (k === 'phones') { c.arc(0, 0, 62, Math.PI, 0); c.stroke(); c.fillRect(-78, 0, 30, 62); c.fillRect(48, 0, 30, 62); }
    else if (k === 'watch') { c.fillRect(-22, -90, 44, 180); c.beginPath(); c.arc(0, 0, 48, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -28); c.moveTo(0, 0); c.lineTo(20, 8); c.stroke(); }
    else if (k === 'shoe') { c.moveTo(-85, 30); c.lineTo(-80, -30); c.lineTo(-30, -20); c.lineTo(20, 0); c.lineTo(80, 12); c.lineTo(88, 38); c.lineTo(-85, 38); c.closePath(); c.fill(); }
    else if (k === 'cup') { c.moveTo(-50, -45); c.lineTo(50, -45); c.lineTo(36, 60); c.lineTo(-36, 60); c.closePath(); c.fill(); c.beginPath(); c.arc(56, -5, 22, -1.2, 1.4); c.stroke(); }
    else if (k === 'pad') { c.roundRect(-80, -38, 160, 76, 34); c.fill(); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(-56, -6, 34, 12); c.fillRect(-45, -17, 12, 34); c.beginPath(); c.arc(40, -6, 9, 0, 7); c.arc(58, 10, 9, 0, 7); c.fill(); }
    else if (k === 'burger') { c.arc(0, -12, 70, Math.PI, 0); c.fill(); c.fillRect(-74, -2, 148, 18); c.fillRect(-70, 26, 140, 14); c.beginPath(); c.roundRect(-70, 48, 140, 30, 12); c.fill(); }
    else { c.roundRect(-85, -55, 170, 100, 8); c.fill(); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(-74, -44, 148, 78); c.fillStyle = col; c.fillRect(-30, 50, 60, 10); }
    c.restore(); };
  return canvasTex(2048, 2048, (c) => {
    for (let k = 0; k < 32; k++) { const [name, tag, ic] = brands[k % 16], [bg, hi, fg] = pal[(k * 3 + (k > 15 ? 1 : 0)) % pal.length], x = (k % 4) * 512, y = Math.floor(k / 4) * 256, flip = k % 2;
      c.save(); c.beginPath(); c.rect(x, y, 512, 256); c.clip();
      const g = c.createLinearGradient(x, y, x + 512, y + 256); g.addColorStop(0, bg); g.addColorStop(1, hi); c.fillStyle = g; c.fillRect(x, y, 512, 256);
      c.globalAlpha = 0.16; c.fillStyle = fg; c.beginPath(); c.arc(x + (flip ? 400 : 110), y + 128, 150, 0, 7); c.fill(); c.globalAlpha = 1;
      icon(c, ic, x + (flip ? 400 : 110), y + 124, 96, fg);
      c.fillStyle = fg; c.textAlign = flip ? 'left' : 'right'; c.textBaseline = 'middle'; const tx = x + (flip ? 30 : 482);
      c.font = `900 ${name.length > 9 ? 44 : 62}px "Arial Black", Arial, sans-serif`; c.fillText(name, tx, y + 104, 290);
      c.font = '600 22px Arial, sans-serif'; c.globalAlpha = 0.9; c.fillText(tag, tx, y + 156, 290); c.globalAlpha = 1;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x, y + 226, 512, 30); c.fillStyle = fg; c.font = '700 13px Arial, sans-serif'; c.textAlign = 'left'; c.fillText(name.toLowerCase().replace(/ /g, '') + '.city', x + 16, y + 242);
      c.restore(); }
  });
}

export async function buildCity(scene, refl, quality, renderer) {
  const R = rng(20261122), city = { lamps: [], signalsAt: [], update: () => {}, spawn: { x: P * 3 - 5.5, z: P * 3 + 40 } };
  const SH = true, hooks = [], solid = city.colliders = []; // upright things the car cannot pass through: { x, z, r }
  const ext = P * ROADS + P; // ground covers the outer ring of blocks too

  // ---- Sky and light: one sun that crosses the sky, setting over the sea, with an overcast neon night between ----
  const skyG = new THREE.Group(); scene.add(skyG); city.sky = skyG;
  const sky = new Sky(); sky.scale.setScalar(16000); const su = sky.material.uniforms; su.turbidity.value = 2.4; su.rayleigh.value = 2.2; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.86; skyG.add(sky);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(7500, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, transparent: true, uniforms: { uA: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uA; varying vec3 vD;\n${GLSL_HASH} void main(){ float h = max(vD.y, 0.0); vec2 p = vD.xz / (h + 0.18);
      float cl = adN(p * 1.3) * 0.6 + adN(p * 3.1 + 4.0) * 0.4;
      vec3 glow = mix(vec3(0.20, 0.09, 0.22), vec3(0.06, 0.10, 0.20), smoothstep(-1.0, 1.0, vD.x));
      vec3 c = mix(glow * (0.55 + 0.6 * cl), vec3(0.012, 0.015, 0.028) + glow * 0.16 * cl, smoothstep(0.0, 0.55, h));
      gl_FragColor = vec4(c, uA); }` }));
  dome.renderOrder = -5; skyG.add(dome);
  // Stars and a moon for clear nights, and a layer of drifting cloud lit by the sun.
  const sp = []; { const r = rng(404); while (sp.length < 1500 * 3) { const u = r(), a = r() * Math.PI * 2, y = 0.03 + u * 0.97, q = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * q * 7000, y * 7000, Math.sin(a) * q * 7000); } }
  const sg0 = new THREE.BufferGeometry(); sg0.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  { const r = rng(405), mag = new Float32Array(sp.length / 3), tint = new Float32Array(sp.length); for (let i = 0; i < mag.length; i++) { mag[i] = Math.pow(r(), 3.2); const warm = r(); tint.set(warm < 0.2 ? [1, 0.82, 0.62] : warm > 0.8 ? [0.72, 0.84, 1] : [1, 0.97, 0.92], i * 3); }
    sg0.setAttribute('mag', new THREE.BufferAttribute(mag, 1)); sg0.setAttribute('tint', new THREE.BufferAttribute(tint, 3)); }
  // Stars of different brightness and colour, twinkling, dimmed near the horizon.
  const starU = { uTime: refl.uniforms.uTime, uOpacity: { value: 0 } };
  const stars = new THREE.Points(sg0, new THREE.ShaderMaterial({ uniforms: starU, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float mag; attribute vec3 tint; uniform float uTime; varying vec3 vC; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; float tw = 0.75 + 0.25 * sin(uTime * (2.0 + mag * 5.0) + position.x * 0.37); float h = normalize(position).y; vA = tw * smoothstep(0.02, 0.25, h) * (0.35 + 0.65 * mag); vC = tint; gl_PointSize = 1.2 + mag * 2.8; }',
    fragmentShader: 'uniform float uOpacity; varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC * a * vA * uOpacity * 1.6, 1.0); }' }));
  stars.renderOrder = -6; stars.frustumCulled = false; skyG.add(stars);
  // The moon: maria and craters painted once, a soft halo around it.
  const moonTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), r = rng(77);
    const g = x.createRadialGradient(128, 128, 10, 128, 128, 126); g.addColorStop(0, '#f4f2ea'); g.addColorStop(0.85, '#dcd9cf'); g.addColorStop(1, '#b9b6ad'); x.fillStyle = g; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill();
    x.save(); x.beginPath(); x.arc(128, 128, 126, 0, 7); x.clip();
    for (const [mx, my, mr] of [[96, 92, 44], [150, 80, 30], [170, 130, 36], [110, 150, 28], [80, 130, 22]]) { x.fillStyle = 'rgba(120,122,128,0.38)'; x.beginPath(); x.ellipse(mx, my, mr, mr * 0.8, r() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 90; i++) { const cx = r() * 256, cy = r() * 256, cr = 1.5 + Math.pow(r(), 3) * 12; x.fillStyle = 'rgba(90,92,98,0.3)'; x.beginPath(); x.arc(cx, cy, cr, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,250,0.25)'; x.beginPath(); x.arc(cx - cr * 0.3, cy - cr * 0.3, cr * 0.6, 0, 7); x.fill(); }
    x.restore(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const moon = new THREE.Mesh(new THREE.CircleGeometry(150, 48), new THREE.MeshBasicMaterial({ map: moonTex, color: new THREE.Color(1.6, 1.6, 1.65), transparent: true, opacity: 0, depthWrite: false, fog: false })); moon.renderOrder = -6; skyG.add(moon);
  const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.25, 'rgba(220,230,255,0.18)'); g.addColorStop(1, 'rgba(200,215,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1300), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); halo.renderOrder = -7; moon.add(halo); halo.position.z = -2;
  let sunsetLoaded = false;
  const sunsetSky = new THREE.TextureLoader().load('/afterdark/assets/qwantani-sunset.jpg', () => { sunsetLoaded = true; });
  sunsetSky.colorSpace = THREE.SRGBColorSpace;
  sunsetSky.wrapS = THREE.RepeatWrapping;
  const cloudU = { uTime: refl.uniforms.uTime, uPhoto: { value: sunsetSky }, uPhotoK: { value: 0 }, uCover: { value: 0.48 }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uLit: { value: new THREE.Color(2, 2, 2) }, uShade: { value: new THREE.Color(1, 1, 1) }, uHaze: { value: new THREE.Color(0.9, 0.85, 0.8) } };
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(6800, 48, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, transparent: true, uniforms: cloudU,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTime, uCover, uPhotoK; uniform sampler2D uPhoto; uniform vec3 uSun, uLit, uShade, uHaze; varying vec3 vD;\n${GLSL_HASH} float adF(vec2 p){ return adN(p) * 0.5 + adN(p * 2.1 + 3.7) * 0.27 + adN(p * 4.3 + 9.1) * 0.15 + adN(p * 8.9 + 1.3) * 0.08; }
      float cloud(vec2 p){ return adF(p * vec2(0.72, 1.25)) * 0.78 + adF(p * 0.36 + 5.0) * 0.22; }
      void main(){ vec3 d = normalize(vD); if (d.y < 0.0) discard; vec2 base = d.xz / (d.y + 0.17) * 1.35, wind = uTime * vec2(0.0055, 0.0028), p = base + wind;
        float n = cloud(p);
        float edge = mix(0.66, 0.2, uCover);
        float alpha = smoothstep(edge, edge + 0.16, n);
        float density = smoothstep(edge + 0.02, edge + 0.3, n);
        // light through the cloud: how much cloud lies between this point and the sun
        vec2 toSun = normalize(uSun.xz + vec2(1e-4)) * 0.11;
        float shade = max(0.0, cloud(p + toSun) - edge) + max(0.0, cloud(p + toSun * 2.4) - edge) * 0.7;
        float lit = exp(-shade * 5.5);
        vec3 color = mix(uShade * 0.62, uLit, lit * (1.0 - 0.45 * density)); // sunlit tops, grey shaded bases
        float forward = pow(max(dot(d, uSun), 0.0), 8.0);
        color += uLit * forward * (0.45 * (1.0 - density) + 0.12); // silver lining towards the sun
        // high cirrus, stretched by the jet stream, over the clear sky
        float ci = smoothstep(0.56, 0.86, adF(base * vec2(0.22, 1.7) + wind * 2.6 + 11.0)) * 0.38 * (1.0 - 0.6 * uCover);
        color = mix(color, uLit * 1.04 + uLit * forward * 0.3, ci * (1.0 - alpha)); alpha = max(alpha, ci);
        // aerial perspective: distant cloud fades into the horizon haze
        color = mix(uHaze, color, 0.3 + 0.7 * smoothstep(0.0, 0.28, d.y));
        float photo = uPhotoK * smoothstep(0.0, 0.035, d.y);
        if (photo > 0.01) {
          float bearing = atan(d.z, d.x) - atan(uSun.z, uSun.x);
          float elevation = asin(clamp(d.y, 0.0, 1.0));
          vec2 uv = vec2(fract(0.603 + bearing / 6.283185), 0.5 + elevation / 3.141593);
          vec3 photographed = texture2D(uPhoto, uv).rgb * 2.1;
          color = mix(color, photographed, photo);
          alpha = mix(alpha, 1.0, photo);
        }
        gl_FragColor = vec4(color, alpha * smoothstep(0.0, 0.13, d.y)); }` }));
  clouds.renderOrder = -4; clouds.frustumCulled = false; skyG.add(clouds);
  scene.fog = new THREE.FogExp2(0xe6bd9c, 0.00065);
  const hemi = new THREE.HemisphereLight(0xb9cdf2, 0xa08468, 3.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc08c, 5.6), sunDir = new THREE.Vector3(-0.8, 0.3, 0.3).normalize(), lightDir = sunDir.clone(); sun.castShadow = renderer.shadowMap.enabled;
  { const sm = sun.shadow, size = quality.dpr >= 1.5 ? 4096 : 2048, half = 90; sm.mapSize.set(size, size); Object.assign(sm.camera, { left: -half, right: half, top: half, bottom: -half, near: 10, far: 2400 }); sm.camera.updateProjectionMatrix(); sm.bias = -0.000035; sm.normalBias = 0.022;
    scene.add(sun, sun.target); const step = (half * 2) / size * 8;
    city.updateSun = (p, height = 0) => {
      const x = Math.round(p.x / step) * step, y = Math.round(height / step) * step, z = Math.round(p.z / step) * step;
      sun.target.position.set(x, y, z);
      sun.position.set(x + lightDir.x * 1200, y + Math.max(60, lightDir.y * 1200), z + lightDir.z * 1200);
    }; }
  const C = (a, b, t, out) => out.set(a).lerp(col.set(b), t), mix = (a, b, t) => a + (b - a) * t, sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // hour: 0-24. Returns the factors everything else keys off.
  city.setTime = (hour, rainy = 1) => {
    const h = (hour - 6) / 12 * Math.PI, sn = Math.sin(h), el = (sn > 0 ? sn * 58 : sn * 35), er = THREE.MathUtils.degToRad(el), ce = Math.cos(er);
    sunDir.set(Math.cos(h) * ce, Math.sin(er), 0.38 * ce).normalize(); su.sunPosition.value.copy(sunDir);
    const night = 1 - sst(-7, 5, el), day = sst(-2, 14, el), high = sst(6, 36, el), dawn = Math.exp(-(((hour - 6.3) / 0.9) ** 2)), e = { hour, el, night, day, high, rainy, wet: rainy, rain: rainy };
    C(0xffa060, 0xfff4e6, high, sun.color).lerp(col.set(0x9db4e8), night); sun.intensity = 5.6 * day * (1 - 0.58 * rainy) * (0.8 + 0.2 * high) + night * (1 - rainy) * 0.5;
    lightDir.copy(sunDir); if (night > 0.5) lightDir.set(-sunDir.x, Math.abs(sunDir.y) + 0.35, -sunDir.z).normalize(); // The same light represents the moon at night.
    sun.castShadow = renderer.shadowMap.enabled && city.shadows !== false && day > 0.02;
    C(0xb9cdf2, 0x33325a, night, hemi.color); C(0x8d806e, 0x120d16, night, hemi.groundColor); hemi.intensity = mix(mix(2.7, 3.3, high), mix(0.95, 0.42, rainy), night);
    C(0xe6bd9c, 0xc9d8ea, high, scene.fog.color).lerp(col.set(rainy > 0.5 ? 0x0e0b18 : 0x070b16), night); scene.fog.density = mix(mix(0.00054, 0.00034, high), mix(0.00045, 0.0017, rainy), night) + dawn * 0.0006 * (1 - night);
    su.rayleigh.value = mix(2.65, 2.0, high); renderer.toneMappingExposure = mix(mix(0.47, 0.42, high), 1.0, night); dome.material.uniforms.uA.value = night * mix(0.3, 1, rainy); dome.visible = night > 0.01;
    starU.uOpacity.value = night * (1 - rainy) * 0.9; stars.visible = starU.uOpacity.value > 0.02; moon.material.opacity = night * (1 - rainy); moon.visible = moon.material.opacity > 0.02; halo.material.opacity = moon.material.opacity * 0.8;
    if (moon.visible) { moon.position.set(-sunDir.x, Math.abs(sunDir.y) + 0.35, -sunDir.z).normalize().multiplyScalar(6600); moon.lookAt(skyG.position); }
    cloudU.uPhotoK.value = sunsetLoaded ? day * (1 - sst(3, 13, el)) * 0.8 : 0; // the photographed sunset only while the sun is low
    cloudU.uSun.value.copy(sunDir); cloudU.uHaze.value.copy(scene.fog.color).multiplyScalar(1.15 - 0.85 * night); cloudU.uCover.value = mix(0.32, 0.88, Math.max(e.wet, rainy * sst(0.3, 0.9, night)));
    { const sunset = (1 - high) * day, k = 1 - night; cloudU.uLit.value.setRGB(mix(0.07, mix(1.55, 1.6, sunset), k), mix(0.07, mix(1.62, 1.0, sunset), k), mix(0.1, mix(1.75, 0.74, sunset), k)); cloudU.uShade.value.setRGB(mix(0.03, mix(0.92, 0.75, sunset), k), mix(0.03, mix(0.97, 0.62, sunset), k), mix(0.05, mix(1.1, 0.7, sunset), k)); if (rainy > 0.5 && night > 0.5) { cloudU.uLit.value.setRGB(0.1, 0.07, 0.12); cloudU.uShade.value.setRGB(0.05, 0.04, 0.07); } }
    refl.uniforms.uWet.value = mix(0.06, 1, e.wet); refl.uniforms.uLitK.value = mix(0.04, 1, night);
    for (const f of hooks) f(e, mix, C); return e;
  };

  // ---- Road surface ----
  const { west: WEST, east: EAST, south: SOUTH, north: NORTH } = CITY_PAVEMENT;
  const roadW = EAST - WEST, roadL = NORTH - SOUTH; city.wetUniform = refl.uniforms.uWet;
  const puddles = roadPuddles();
  city.puddleAt = (x, z) => x >= WEST && x <= EAST && z >= -HALF - SW && z <= SPAN + HALF + SW ? puddles.sample(x, z) : 0;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(roadW, roadL), roadMaterial(refl, roadW / 6.3, roadL / 6.3, puddles)); road.rotation.x = -Math.PI / 2; road.position.set(WEST + roadW / 2, 0, SOUTH + roadL / 2); road.receiveShadow = SH; scene.add(road);
  refl.hide.push(road);

  // ---- Pavement slabs ----
  const pave = canvasTex(512, 512, (c, w) => { c.fillStyle = '#3d3d42'; c.fillRect(0, 0, w, w); const r = rng(5); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 52 + r() * 16; c.fillStyle = `rgb(${v},${v},${v + 4})`; c.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } const img = c.getImageData(0, 0, w, w); for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 18; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; } c.putImageData(img, 0, 0); });
  pave.wrapS = pave.wrapT = THREE.RepeatWrapping; pave.repeat.set(22, 22);
  const slabSize = P - HALF * 2, blocks = [];
  for (let i = 0; i < ROADS - 1; i++) for (let j = 0; j < ROADS - 1; j++) blocks.push({ i, j, cx: (i + 0.5) * P, cz: (j + 0.5) * P });
  const slabHalf = (P - HALF * 2) / 2;
  const slabMat = new THREE.MeshStandardMaterial({ map: pave, roughness: 0.4, metalness: 0, envMapIntensity: 0.12, color: 0xf2efe8 });
  hooks.push((e, mix, C) => C(0xf2efe8, 0x8d8d95, e.night, slabMat.color));
  slabMat.onBeforeCompile = sh => { Object.assign(sh.uniforms, refl.uniforms);
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform sampler2D uRefl; uniform mat4 uReflVP; uniform float uReflOn, uWet; varying vec3 vWPos;\n${GLSL_HASH}` + sh.fragmentShader
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  vec2 adL = abs(fract(vWPos.xz / 120.0) - 0.5) * 120.0; float adEdge = 50.0 - max(adL.x, adL.y); float adKerb = step(adEdge, 0.34) * step(0.16, vWPos.y); float adRunS = adL.x > adL.y ? vWPos.z : vWPos.x;\n  float adPd = smoothstep(0.5, 0.72, adN(vWPos.xz * 0.11 + 3.0)) * (1.0 - adKerb) * uWet; roughnessFactor = mix(mix(mix(0.85, 0.42, uWet), 0.55, adKerb), 0.05, adPd); float adRR = roughnessFactor; roughnessFactor = max(roughnessFactor, 0.34); diffuseColor.rgb *= mix(mix(1.0, 0.62, uWet), 0.36, adPd);\n  diffuseColor.rgb *= mix(1.0, 0.6, smoothstep(2.3, 4.0, adEdge));\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.13, 0.135) * mix(2.6, 1.0, uWet) * (0.8 + 0.3 * adH(vec2(floor(adRunS / 0.9), 2.0))) * (1.0 - 0.6 * step(fract(adRunS / 0.9), 0.03)), adKerb);\n  float adAlongS = adL.x > adL.y ? adL.y : adL.x; float adTact = step(adEdge, 0.95) * step(0.34, adEdge) * step(46.0, adAlongS) * step(adAlongS, 49.4) * step(0.16, vWPos.y);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.38, 0.07) * (0.7 + 0.5 * step(0.5, fract(vWPos.x * 5.0)) * step(0.5, fract(vWPos.z * 5.0))), adTact);')
      .replace('#include <opaque_fragment>', `{ vec4 adRc = uReflVP * vec4(vWPos.x, 0.0, vWPos.z, 1.0); vec2 adUv = adRc.xy / adRc.w * 0.5 + 0.5; float adNdv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float adF = (0.03 + 0.97 * pow(1.0 - adNdv, 4.2));
        float adB = adRR * 9.5, adSp = adRR * 0.1 + 0.0015;
        vec3 adCol = texture2D(uRefl, adUv, adB).rgb * 0.4 + texture2D(uRefl, adUv + vec2(0.0, adSp), adB).rgb * 0.3 + texture2D(uRefl, adUv - vec2(0.0, adSp), adB).rgb * 0.3;
        outgoingLight += min(adCol, vec3(3.5)) * adF * mix(0.2, 0.8, adPd) * (1.0 - adRR * 0.7) * uReflOn * step(0.16, vWPos.y); }\n#include <opaque_fragment>`); };
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(slabSize, 0.17, slabSize), slabMat, blocks.length + 1);
  refl.hide.push(slabs); slabs.receiveShadow = SH;
  blocks.forEach((b, k) => { dummy.position.set(b.cx, 0.085, b.cz); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); slabs.setMatrixAt(k, dummy.matrix); });
  dummy.position.set(-(HALF + 6.75), 0.085, SPAN / 2); dummy.scale.set(13.5 / slabSize, 1, (ext + 200) / slabSize); dummy.updateMatrix(); slabs.setMatrixAt(blocks.length, dummy.matrix); dummy.scale.set(1, 1, 1); slabs.frustumCulled = false; scene.add(slabs);

  // ---- Buildings ----
  const boxes = [], glows = [], signs = [], decals = [], beacons = [], screens = [], trim = [], ads = [];
  const timeU = refl.uniforms.uTime, litU = city.litU = refl.uniforms.uLitK;
  // Photo-textured building models; each lot gets one standing on a row of shops. Only the intact models are used.
  const KIT_OK = new Set(['c7-06', 'c7-07', 'c7-08', 'c7-18', 'c7-19', 'c7-20', 'c7-21', 'c8-22', 'c8-25', 'c8-28', 'c8-29', 'c8-30', 'c8-31', 'ls-35']);
  const kit = [];
  try { const g = await loadGLB('/evermile/assets/models/city-kit.glb?v=maps2'); g.scene.updateMatrixWorld(true);
    for (const node of g.scene.children.slice()) { const bb = new THREE.Box3().setFromObject(node), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3()); if (!KIT_OK.has(node.name)) continue;
      const fix = new THREE.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z), meshes = []; node.traverse(o => { if (o.isMesh) meshes.push({ geo: o.geometry, mat: kitMaterial(o.material, litU), local: fix.clone().multiply(o.matrixWorld) }); });
      kit.push({ w: sz.x, h: sz.y, d: sz.z, meshes, uses: [] }); } } catch (e) { console.warn('building kit unavailable', e); }
  const AWN = [0x5a1218, 0x12331f, 0x14213f, 0x3a2a12, 0x23232a, 0x5a3a10], STONE = 0x3b3c42, METAL = 0x17181c, ALU = 0x4a4e57;
  const addBox = (x, z, w, h, d, style) => { const b = { x, z, w, h, d, style, seed: Math.floor(R() * 4096), cw: style === 0 ? 1.6 + R() * 0.6 : style === 1 ? 2.8 + R() * 0.6 : 3.0 + R() * 1.5, ch: style === 0 ? 3.7 : style === 1 ? 3.3 : 3.6 }; boxes.push(b); return b; };
  // A box of trim placed on a facade: t along the wall, out from it, y up. Local x runs along the wall, local z points out.
  const onFace = (b, nx, nz, t, out, y, len, sy, depth, c, tilt = 0) => { const fx = b.x + nx * b.w / 2, fz = b.z + nz * b.d / 2; trim.push({ x: fx - nz * t + nx * out, y, z: fz + nx * t + nz * out, sx: len, sy, sz: depth, yaw: Math.atan2(nx, nz), tilt, c }); };
  const faceLen = (b, nx) => nx ? b.d : b.w;
  const cellsOn = (b, nx, nz, cw) => { const L = faceLen(b, nx), fc = (b.x + nx * b.w / 2) * -nz + (b.z + nz * b.d / 2) * nx, off = b.seed % 37, u0 = fc - L / 2 + off, out = []; for (let k = Math.ceil(u0 / cw); (k + 1) * cw <= u0 + L; k++) out.push({ k, t: (k + 0.5) * cw - off - fc }); return out; };
  const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const lotSpan = slabSize - SW * 2, mid = SPAN / 2;
  for (const b of blocks) {
    const n = R() < 0.45 ? 2 : 3, lot = lotSpan / n;
    const central = Math.max(0, 1 - Math.hypot(b.cx - mid, b.cz - mid) / (SPAN * 0.6)), outer = b.i < 0 || b.j < 0 || b.i >= ROADS - 1 || b.j >= ROADS - 1;
    for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) {
      const lx = b.cx - lotSpan / 2 + (a + 0.5) * lot, lz = b.cz - lotSpan / 2 + (c + 0.5) * lot;
      const gap = 0.4 + R() * 2.2, w = lot - gap, d = lot - gap;
      const tall = R(); let h = 14 + tall * tall * (46 + 230 * central * central) + R() * 14; if (R() < 0.2) h = 10 + R() * 9; if (outer) h = Math.min(h, 22 + R() * 60);
      const seafront = b.i < 2 && (a + c + b.j) % 3 !== 0;
      const kitRoll = R();
      const kp = kit.length && kitRoll < (seafront ? 0.32 : central > 0.72 ? 0.5 : 0.84) ? kit[Math.floor(R() * kit.length)] : null;
      if (seafront && !kp) h = Math.min(h, 29 + kitRoll * 21);
      const podium = kp ? 5.45 : h > 34 ? 8 + R() * 12 : h, sr = R();
      const lowStyle = sr < 0.5 ? 1 : sr < 0.82 ? 2 : 0, base = addBox(lx, lz, w, podium, d, seafront ? 3 : kp ? (sr < 0.6 ? 1 : 2) : lowStyle);
      let top = base, topY = podium;
      if (kp) { const turn = (kp.w > kp.d) !== (w > d) ? 1 : (R() < 0.5 ? 0 : 2), pw = turn === 1 ? kp.d : kp.w, pd = turn === 1 ? kp.w : kp.d;
        const fit = Math.min(1.25, Math.max(0.85, Math.min((w - 2.2) / pw, (d - 2.2) / pd))), wx = fit, wz = fit, sy = fit * (0.97 + R() * 0.12);
        kp.uses.push({ x: lx, y: podium + 0.1, z: lz, rot: turn * Math.PI / 2, sx: turn === 1 ? wz : wx, sy, sz: turn === 1 ? wx : wz }); topY = podium + kp.h * sy; }
      else if (h > 34) { const tw = w * (0.55 + R() * 0.35), td = d * (0.55 + R() * 0.35), ts = h > 90 ? (R() < 0.78 ? 0 : 2) : R() < 0.4 ? 0 : R() < 0.6 ? 2 : 1;
        top = addBox(lx + (R() - 0.5) * (w - tw), lz + (R() - 0.5) * (d - td), tw, h, td, seafront ? 3 : ts); topY = h;
        if (h > 110 && R() < 0.6) { top = addBox(top.x, top.z, top.w * 0.6, h + 14 + R() * 30, top.d * 0.6, ts); topY = top.h; } }
      const signTop = kp ? Math.min(topY, 30) : podium;
      const street = []; if (a === 0) street.push([-1, 0]); if (a === n - 1) street.push([1, 0]); if (c === 0) street.push([0, -1]); if (c === n - 1) street.push([0, 1]);
      // Cornice at the podium line, sun-shade ledges on concrete, balconies on brick.
      const floors = Math.floor((podium - 5.4) / base.ch);
      for (const [nx, nz] of FACES) { const L = faceLen(base, nx);
        onFace(base, nx, nz, 0, 0.12, podium - 0.12, L + 0.75, 0.55, 0.5, STONE);
        onFace(base, nx, nz, 0, 0.1, 5.42, L + 0.3, 0.2, 0.36, STONE);
        if (base.style === 2) for (let j = Math.ceil(5.6 / base.ch); 0.1 + j * base.ch < podium - 0.9 && j < 9; j++) onFace(base, nx, nz, 0, 0.22, 0.1 + j * base.ch, L + 0.2, 0.14, 0.5, STONE); }
      if (base.style === 1 || base.style === 3) for (const [nx, nz] of street) for (const cell of cellsOn(base, nx, nz, base.cw)) { if (cell.k % 2) continue;
        for (let j = Math.ceil(5.4 / base.ch); (j + 1) * base.ch + 0.1 < podium - 0.6 && j < 9; j++) { const y0 = 0.1 + j * base.ch; onFace(base, nx, nz, cell.t, 0.55, y0 + 0.08, base.cw * 0.84, 0.12, 1.1, STONE); onFace(base, nx, nz, cell.t, 1.08, y0 + 0.62, base.cw * 0.84, 0.95, 0.045, seafront ? 0x678888 : METAL); } }
      // Awnings over some shop fronts.
      for (const [nx, nz] of street) for (const cell of cellsOn(base, nx, nz, 6)) if (R() < 0.34) onFace(base, nx, nz, cell.t, 0.78, 3.98, 5.3, 0.13, 1.75, AWN[Math.floor(R() * AWN.length)], 0.3);
      // Door frames, sills and fabric valances cast real shadows across the ground floor.
      for (const [nx, nz] of street) for (const cell of cellsOn(base, nx, nz, 6)) {
        const tone = (cell.k + base.seed) % 5 === 0 ? 0xb4a69a : 0x353c40;
        for (const e of [-2.58, 2.58]) onFace(base, nx, nz, cell.t + e, 0.07, 2.35, 0.15, 3.72, 0.16, tone);
        onFace(base, nx, nz, cell.t, 0.1, 0.57, 5.24, 0.16, 0.26, tone);
        if ((cell.k + base.seed) % 4 === 0) {
          onFace(base, nx, nz, cell.t + 1.48, 0.13, 1.26, 0.05, 0.28, 0.08, 0x9a8c7c);
          onFace(base, nx, nz, cell.t, 0.07, 3.94, 5.32, 0.14, 0.16, tone);
        }
      }
      // Tower corners, roof plant and masts.
      if (top !== base && top.style === 0) for (const sx of [-1, 1]) for (const sz of [-1, 1]) trim.push({ x: top.x + sx * (top.w / 2 + 0.06), y: (podium + topY) / 2, z: top.z + sz * (top.d / 2 + 0.06), sx: 0.34, sy: topY - podium, sz: 0.34, yaw: 0, tilt: 0, c: ALU });
      if (top !== base) for (const [nx, nz] of FACES) onFace(top, nx, nz, 0, 0.08, topY - 0.3, faceLen(top, nx) + 0.5, 0.9, 0.4, top.style === 0 ? ALU : STONE);
      if (!kp) trim.push({ x: top.x + (R() - 0.5) * top.w * 0.4, y: topY + 1.6, z: top.z + (R() - 0.5) * top.d * 0.4, sx: 4 + R() * 3, sy: 3.2, sz: 3 + R() * 2, yaw: 0, tilt: 0, c: STONE });
      if (!kp) for (let q = 0; q < 3; q++) trim.push({ x: base.x + (R() - 0.5) * base.w * 0.8, y: podium + 0.75, z: base.z + (R() - 0.5) * base.d * 0.8, sx: 2.2, sy: 1.5, sz: 1.3, yaw: R() < 0.5 ? 0 : Math.PI / 2, tilt: 0, c: 0x2c2e33 });
      if (!kp && topY > 60 && R() < 0.6) { const mh = 8 + R() * 20; trim.push({ x: top.x, y: topY + mh / 2, z: top.z, sx: 0.18, sy: mh, sz: 0.18, yaw: 0, tilt: 0, c: METAL }); beacons.push(top.x, topY + mh + 0.3, top.z); }
      const tone = NEON[Math.floor(R() * NEON.length)];
      if (!kp && h > 46 && R() < 0.42) { const t = 0.26, y = topY + 0.3; glows.push([top.x, y, top.z - top.d / 2, top.w, t, t, tone, 2.6], [top.x, y, top.z + top.d / 2, top.w, t, t, tone, 2.6], [top.x - top.w / 2, y, top.z, t, t, top.d, tone, 2.6], [top.x + top.w / 2, y, top.z, t, t, top.d, tone, 2.6]); }
      // Street-facing sides get signage.
      for (const [nx, nz] of street) {
        const fx = lx + nx * w / 2, fz = lz + nz * d / 2, along = (R() - 0.5) * (w - 9), px = fx + (nz ? along : 0), pz = fz + (nx ? along : 0);
        if (R() < 0.8) signs.push({ x: px + nx * 0.25, y: 4.72, z: pz + nz * 0.25, nx, nz, w: 4.4, h: 1.1, kind: 0 });
        if (!kp && R() < 0.5 && podium > 13) signs.push({ x: px + nx * 1.5, y: Math.min(9.5 + R() * Math.max(0, Math.min(podium, 30) - 15), podium - 3.2), z: pz + nz * 1.5, nx, nz, w: 5.6, h: 2.8, kind: 1 });
        if (!kp && R() < 0.34 && podium > 14) { const bw = Math.min(16, w - 3), by = Math.max(10, podium - bw / 4 - 1 - R() * 4); ads.push({ x: fx + nx * 0.5, y: by, z: fz + nz * 0.5, nx, nz, w: bw, h: bw / 2 }); onFace(base, nx, nz, 0, 0.3, by, bw + 0.5, bw / 2 + 0.5, 0.3, METAL); }
        if (!kp && h <= 34 && R() < 0.3) { const bw = Math.min(13, w - 4), by = podium + 1.6 + bw / 4; ads.push({ x: fx - nx * 0.5, y: by, z: fz - nz * 0.5, nx, nz, w: bw, h: bw / 2 }); onFace(base, nx, nz, 0, -0.75, by, bw + 0.4, bw / 2 + 0.4, 0.22, METAL); for (const e of [-bw * 0.32, bw * 0.32]) onFace(base, nx, nz, e, -1.0, podium + 0.9, 0.2, 1.9, 0.2, METAL); }
        if (!kp && h > 80 && top.w > 16 && R() < 0.5 && screens.length < 40) { const sw = Math.min(22, top.w - 2); screens.push({ x: (nx ? top.x + nx * top.w / 2 : top.x) + nx * 0.35, y: podium + 9 + sw * 0.25, z: (nz ? top.z + nz * top.d / 2 : top.z) + nz * 0.35, nx, nz, w: sw, h: sw * 0.5 }); }
      }
    }
  }
  // The chase camera tests the same podium and tower footprints the street renders.
  const cameraLots = city.cameraLots = new Map();
  for (const b of boxes) {
    const key = Math.floor(b.x / P) * ROADS + Math.floor(b.z / P);
    if (!cameraLots.has(key)) cameraLots.set(key, []);
    cameraLots.get(key).push(b);
  }

  // (The land beyond the grid is built in world.js.)


  // ---- Street furniture ----
  const VIA = 2; city.viaduct = VIA * P; // the avenue that carries the elevated line
  const place = (ax, r, side, s, lat, f, rad = 0.4) => { const fixed = r * P + side * lat; if (rad) solid.push({ x: ax ? fixed : s, z: ax ? s : fixed, r: rad }); f(ax ? fixed : s, ax ? s : fixed, ax ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : (side > 0 ? Math.PI : 0), ax ? [0, 1] : [1, 0]); };
  const prop = (x, z, yaw, lx, y, lz, sx, sy, sz, c) => { const cs = Math.cos(yaw), sn = Math.sin(yaw); trim.push({ x: x + lx * cs + lz * sn, y, z: z - lx * sn + lz * cs, sx, sy, sz, yaw, tilt: 0, c }); };
  for (let r = 0; r < ROADS; r++) for (const ax of [0, 1]) for (const side of [-1, 1]) for (let seg = 0; seg < ROADS - 1; seg++) { const s0 = seg * P;
    if (R() < 0.42) place(ax, r, side, s0 + 44 + R() * 30, HALF + 1.7, (x, z, yaw, dir) => { // bus shelter: yaw faces the road
      for (const e of [-1.7, 1.7]) prop(x, z, yaw, e, 1.37, -0.55, 0.09, 2.4, 0.09, METAL);
      prop(x, z, yaw, 0, 2.6, 0, 3.9, 0.09, 1.55, METAL); prop(x, z, yaw, 0, 1.45, -0.6, 3.4, 2.0, 0.04, 0x1a2630); prop(x, z, yaw, 0, 0.62, -0.25, 2.6, 0.07, 0.42, 0x3a2c1e);
      for (const e of [-1.1, 1.1]) prop(x, z, yaw, e, 0.4, -0.25, 0.07, 0.45, 0.4, METAL);
      const cs = Math.cos(yaw), sn = Math.sin(yaw); for (const e of [-1.2, 0, 1.2]) solid.push({ x: x + e * cs - 0.3 * sn, z: z - e * sn - 0.3 * cs, r: 0.7 }); ads.push({ x: x - 0.56 * sn, y: 1.5, z: z - 0.56 * cs, nx: sn, nz: cs, w: 2.9, h: 1.45, lit: 1 }); decals.push([x, 0.2, z, 7, 0xcfe4ff, 0.3]); });
    for (let s = s0 + 24; s < s0 + P - 22; s += 9.5) { const pick = R();
      if (pick < 0.12) place(ax, r, side, s, HALF + 1.0, (x, z, yaw) => { prop(x, z, yaw, 0, 0.67, 0, 0.5, 1.0, 0.5, 0x15171a); prop(x, z, yaw, 0, 1.2, 0, 0.56, 0.07, 0.56, 0x2a2d31); }); // litter bin
      else if (pick < 0.2) place(ax, r, side, s, HALF + 2.5, (x, z, yaw) => { prop(x, z, yaw, 0, 0.62, 0, 1.8, 0.07, 0.5, 0x3a2c1e); prop(x, z, yaw, 0, 0.95, -0.24, 1.8, 0.5, 0.06, 0x3a2c1e); for (const e of [-0.75, 0.75]) prop(x, z, yaw, e, 0.4, 0, 0.07, 0.45, 0.46, METAL); }); // bench
      else if (pick < 0.27) place(ax, r, side, s, HALF + SW - 0.55, (x, z, yaw) => { const tone = [0xbfe6ff, 0xff5a4a, 0xfff0c8, 0xd8e6ff][Math.floor(R() * 4)]; prop(x, z, yaw, 0, 1.12, 0, 1.0, 1.9, 0.75, 0x1b1d22); const cs = Math.cos(yaw), sn = Math.sin(yaw); glows.push([x + 0.39 * sn, 1.25, z + 0.39 * cs, Math.abs(cs) > 0.5 ? 0.82 : 0.03, 1.4, Math.abs(cs) > 0.5 ? 0.03 : 0.82, tone, 0.9]); decals.push([x + 1.6 * sn, 0.2, z + 1.6 * cs, 5, tone, 0.2]); }); // vending machine
      else if (pick < 0.33) place(ax, r, side, s, HALF + SW - 0.5, (x, z, yaw) => prop(x, z, yaw, 0, 0.87, 0, 1.3, 1.4, 0.5, 0x2b3034)); // utility cabinet
      else if (pick < 0.4) place(ax, r, side, s, HALF + 0.55, (x, z, yaw) => { prop(x, z, yaw, 0, 0.72, 0, 0.07, 1.1, 0.07, METAL); prop(x, z, yaw, 0, 1.38, 0, 0.2, 0.32, 0.16, 0x30343a); }); // parking meter
      else if (pick < 0.44) place(ax, r, side, s, HALF + 0.9, (x, z, yaw) => { prop(x, z, yaw, 0, 0.5, 0, 0.22, 0.66, 0.22, 0x8a1a14); prop(x, z, yaw, 0, 0.62, 0, 0.42, 0.14, 0.14, 0x8a1a14); }); // hydrant
    } }
  for (let i = 0; i < ROADS; i++) for (let j = 0; j < ROADS; j++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const [ox, oz] of [[1.5, 0.4], [0.4, 1.5], [0.6, 0.6]]) { const x = i * P + sx * (HALF + ox), z = j * P + sz * (HALF + oz); solid.push({ x, z, r: 0.14 }); trim.push({ x, y: 0.6, z, sx: 0.17, sy: 0.9, sz: 0.17, yaw: 0, tilt: 0, c: 0x25272c }); glows.push([x, 0.92, z, 0.19, 0.06, 0.19, 0xffe9b0, 0.9]); }
  const unit = new THREE.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0);
  const aInfo = new Float32Array(boxes.length * 4);
  const bm = new THREE.InstancedMesh(unit, buildingMaterial(timeU, litU), boxes.length); bm.castShadow = bm.receiveShadow = SH;
  boxes.forEach((b, k) => { dummy.position.set(b.x, 0.1, b.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(b.w, b.h, b.d); dummy.updateMatrix(); bm.setMatrixAt(k, dummy.matrix); aInfo.set([b.seed, b.style, b.cw, b.ch], k * 4); });
  unit.setAttribute('aInfo', new THREE.InstancedBufferAttribute(aInfo, 4));
  const trimMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.15, envMapIntensity: 0.9 }), trim.length);
  trim.forEach((t, k) => { dummy.position.set(t.x, t.y, t.z); dummy.rotation.set(t.tilt, t.yaw, 0, 'YXZ'); dummy.scale.set(t.sx, t.sy, t.sz); dummy.updateMatrix(); trimMesh.setMatrixAt(k, dummy.matrix); trimMesh.setColorAt(k, col.set(t.c)); });
  dummy.rotation.order = 'XYZ'; trimMesh.frustumCulled = false; trimMesh.castShadow = (quality.reach || 1) >= 1; trimMesh.receiveShadow = SH; scene.add(trimMesh);
  // Photo-textured buildings by district. Far districts swap to plain lit blocks of the same size, which cost
  // a few triangles each instead of a few thousand.
  const kitLod = city.kitLod = [], districts = new Map(), dkey = u => Math.min(2, Math.max(0, Math.floor(u.x / (SPAN / 3)))) * 3 + Math.min(2, Math.max(0, Math.floor(u.z / (SPAN / 3))));
  for (const kp of kit) for (const u of kp.uses) { const k = dkey(u); if (!districts.has(k)) districts.set(k, { near: new THREE.Group(), by: new Map(), all: [] }); const d = districts.get(k); (d.by.get(kp) || d.by.set(kp, []).get(kp)).push(u); d.all.push([kp, u]); }
  for (const d of districts.values()) { const box3 = new THREE.Box3();
    for (const [kp, list] of d.by) for (const part of kp.meshes) { const im = new THREE.InstancedMesh(part.geo, part.mat, list.length);
      list.forEach((u, k) => { dummy.position.set(u.x, u.y, u.z); dummy.rotation.set(0, u.rot, 0); dummy.scale.set(u.sx, u.sy, u.sz); dummy.updateMatrix(); im.setMatrixAt(k, mtmp.multiplyMatrices(dummy.matrix, part.local)); });
      im.computeBoundingSphere(); im.castShadow = im.receiveShadow = SH; d.near.add(im); }
    const fg = new THREE.BoxGeometry(1, 1, 1); fg.translate(0, 0.5, 0); const info = new Float32Array(d.all.length * 4), farM = new THREE.InstancedMesh(fg, bm.material, d.all.length);
    d.all.forEach(([kp, u], k) => { const quarter = Math.abs(Math.sin(u.rot)) > 0.5, w = (quarter ? kp.d : kp.w) * u.sx * 0.96, dd = (quarter ? kp.w : kp.d) * u.sz * 0.96; dummy.position.set(u.x, u.y, u.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(w, kp.h * u.sy, dd); dummy.updateMatrix(); farM.setMatrixAt(k, dummy.matrix); info.set([(k * 131 + 7) % 4096, 2, 3.4, 3.0], k * 4); box3.expandByPoint(dummy.position); });
    fg.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4)); farM.computeBoundingSphere(); farM.castShadow = farM.receiveShadow = SH; farM.visible = false;
    scene.add(d.near, farM); const c = box3.getCenter(new THREE.Vector3()); kitLod.push({ near: d.near, far: farM, x: c.x, z: c.z, r: box3.getSize(new THREE.Vector3()).length() / 2 }); }
  dummy.scale.set(1, 1, 1);

  // ---- The seafront: promenade rail, beach and water along the western edge ----
  { const px = -(HALF + 13.2), len = ext + 200;
    const sandT = canvasTex(512, 512, (c, w) => { c.fillStyle = '#cbb488'; c.fillRect(0, 0, w, w); const r = rng(8), img = c.getImageData(0, 0, w, w); for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 34; img.data[i] += n; img.data[i + 1] += n * 0.95; img.data[i + 2] += n * 0.8; } c.putImageData(img, 0, 0); c.globalAlpha = 0.12; for (let i = 0; i < 90; i++) { c.fillStyle = r() < 0.5 ? '#8f7a55' : '#e6d4ab'; c.beginPath(); c.ellipse(r() * w, r() * w, 20 + r() * 60, 3 + r() * 6, r() * 0.4, 0, 7); c.fill(); } });
    sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(10, 110);
    const sg = new THREE.PlaneGeometry(92, len, 24, Math.ceil(len / 5)); sg.rotateX(-Math.PI / 2); const sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { sp.setY(i, beachHeight(46 - sp.getX(i), mid + sp.getZ(i))); } sg.computeVertexNormals();
    const sandMaterial = new THREE.MeshStandardMaterial({ map: sandT, roughness: 0.95, envMapIntensity: 0.4 });
    city.sea = buildSea(scene, px, mid, len);
    wetSand(sandMaterial, city.sea.waterLevel);
    const sand = new THREE.Mesh(sg, sandMaterial);
    sand.position.set(px - 46, 0, mid);
    sand.receiveShadow = SH;
    scene.add(sand);
    city.beachX = px;
    hooks.push(city.sea.setTime);
  }
  bm.frustumCulled = false; scene.add(bm);

  // ---- Street lamps ----
  const poleG = new THREE.CylinderGeometry(0.09, 0.14, 8.2, 5); poleG.translate(0, 4.1, 0);
  const armG = new THREE.CylinderGeometry(0.06, 0.07, 4.4, 4); armG.rotateZ(Math.PI / 2 - 0.12); armG.translate(-2.15, 8.35, 0);
  const lampG = mergeGeometries([poleG, armG]);
  const lampSpots = [];
  for (let r = 0; r < ROADS; r++) for (let s = 30; s < SPAN; s += 30) { if (Math.abs(s - Math.round(s / P) * P) < 16) continue;
    for (const side of [-1, 1]) { const stag = side > 0 ? 15 : 0; if (Math.abs((s + stag) - Math.round((s + stag) / P) * P) < 16) continue;
      lampSpots.push({ x: r * P + side * (HALF + SW - 0.5), z: s + stag, rot: side > 0 ? 0 : Math.PI, hx: r * P + side * (HALF - 0.9), hz: s + stag });
      lampSpots.push({ x: s + stag, z: r * P + side * (HALF + SW - 0.5), rot: side > 0 ? -Math.PI / 2 : Math.PI / 2, hx: s + stag, hz: r * P + side * (HALF - 0.9) }); } }
  const lampMesh = new THREE.InstancedMesh(lampG, new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.45, metalness: 0.8 }), lampSpots.length);
  lampSpots.forEach((l, k) => { solid.push({ x: l.x, z: l.z, r: 0.2 }); dummy.position.set(l.x, 0.17, l.z); dummy.rotation.set(0, l.rot, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); lampMesh.setMatrixAt(k, dummy.matrix);
    const warm = (k * 7) % 5 === 0 ? 0xbfe0ff : 0xffc98f; glows.push([l.hx, 8.72, l.hz, l.rot % Math.PI ? 0.5 : 1.0, 0.1, l.rot % Math.PI ? 1.0 : 0.5, warm, 5]);
    decals.push([l.hx, 0.03, l.hz, 22, warm, 0.2]); city.lamps.push(new THREE.Vector3(l.hx, 8.2, l.hz)); });
  scene.add(lampMesh);

  // ---- Traffic signals ----
  const sigG = mergeGeometries([(() => { const g = new THREE.CylinderGeometry(0.09, 0.13, 6.6, 8); g.translate(0, 3.3, 0); return g; })(), (() => { const g = new THREE.CylinderGeometry(0.055, 0.075, 6.8, 6); g.rotateZ(Math.PI / 2); g.translate(3.3, 6.35, 0); return g; })(), (() => { const g = new THREE.BoxGeometry(0.36, 1.3, 0.42); g.translate(6.6, 5.72, 0); return g; })(), (() => { const g = new THREE.BoxGeometry(0.5, 0.42, 0.3); g.translate(0.2, 2.6, 0); return g; })()]);
  const sigSpots = [];
  for (let i = 0; i < ROADS; i++) for (let j = 0; j < ROADS; j++) { const cx = i * P, cz = j * P, o = HALF + 0.9;
    sigSpots.push({ i, j, axis: 'z', x: cx - o, z: cz - o, fx: 0, fz: -1 }, { i, j, axis: 'z', x: cx + o, z: cz + o, fx: 0, fz: 1 }, { i, j, axis: 'x', x: cx - o, z: cz + o, fx: -1, fz: 0 }, { i, j, axis: 'x', x: cx + o, z: cz - o, fx: 1, fz: 0 }); }
  const sigMesh = new THREE.InstancedMesh(sigG, new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.5, metalness: 0.6 }), sigSpots.length);
  const sigPos = new Float32Array(sigSpots.length * 3), sigCol = new Float32Array(sigSpots.length * 3);
  sigSpots.forEach((s, k) => { solid.push({ x: s.x, z: s.z, r: 0.2 }); const cx = s.i * P, cz = s.j * P, ax = s.axis === 'z' ? Math.sign(cx - s.x) : 0, az = s.axis === 'x' ? Math.sign(cz - s.z) : 0; dummy.position.set(s.x, 0.17, s.z); dummy.rotation.set(0, Math.atan2(-az, ax), 0); dummy.updateMatrix(); sigMesh.setMatrixAt(k, dummy.matrix); sigPos.set([s.x + ax * 6.6 + s.fx * 0.26, 5.89, s.z + az * 6.6 + s.fz * 0.26], k * 3); });

  scene.add(sigMesh);
  const dot = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const sigGeo = new THREE.BufferGeometry(); sigGeo.setAttribute('position', new THREE.BufferAttribute(sigPos, 3)); sigGeo.setAttribute('color', new THREE.BufferAttribute(sigCol, 3));
  const sigPts = new THREE.Points(sigGeo, new THREE.PointsMaterial({ size: 1.1, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })); sigPts.frustumCulled = false; scene.add(sigPts);
  const SIG = { g: [0.1, 2.6, 0.9], y: [3.0, 1.7, 0.1], r: [3.2, 0.12, 0.08] }; let sigKey = '';
  function updateSignals(t) { const key = Math.floor(t * 2); if (key === sigKey) return; sigKey = key; sigSpots.forEach((s, k) => { const st = signal(s.i, s.j, s.axis, t); sigCol.set(SIG[st], k * 3); sigPos[k * 3 + 1] = st === 'r' ? 6.3 : st === 'y' ? 5.89 : 5.48; }); sigGeo.attributes.color.needsUpdate = true; sigGeo.attributes.position.needsUpdate = true; }

  // ---- Rooftop beacons ----
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(beacons, 3));
  const beaconPts = new THREE.Points(bg, new THREE.PointsMaterial({ size: 7, map: dot, color: new THREE.Color(3, 0.15, 0.1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(beaconPts);

  // ---- Neon signs (one atlas, one draw call) ----
  const storefronts = signs.filter(s => s.kind === 0);
  const distanceToSpawn = s => Math.hypot(s.x - city.spawn.x, s.z - city.spawn.z);
  const shop = storefronts.reduce((a, b) => distanceToSpawn(a) < distanceToSpawn(b) ? a : b);
  city.hisanShop = shop;
  signs.splice(signs.indexOf(shop), 1);
  screens.push({ ...shop, w: 6.4, h: 1.35, shop: true });
  screens.push({ ...shop, x: shop.x + shop.nx * .65, z: shop.z + shop.nz * .65, y: 9.5, w: 8, h: 4, flagship: true });
  // Small digital displays above individual storefronts also carry the local rotation.
  for (let i = 1; i < storefronts.length; i += 5) {
    const s = storefronts[i];
    if (s !== shop) screens.push({ ...s, y: 6.9, w: 3.2, h: 1.6 });
  }
  const shopName = canvasTex(768, 162, ctx => {
    ctx.fillStyle = '#0a2629'; ctx.fillRect(0, 0, 768, 162);
    ctx.font = 'bold 110px Arial'; ctx.textAlign = 'center';
    ctx.fillStyle = '#b9ffdf'; ctx.fillText('HISAN', 384, 122);
  });
  const atlas = signAtlas();
  const signG = new THREE.PlaneGeometry(1, 1), aUv = new Float32Array(signs.length * 4), aSeed = new Float32Array(signs.length);
  const signM = new THREE.MeshBasicMaterial({ map: atlas.tex, side: THREE.DoubleSide, color: new THREE.Color().setScalar(1.15) });
  hooks.push((e, mix) => signM.color.setScalar(mix(1.15, 2.1, e.night)));
  signM.onBeforeCompile = sh => { sh.uniforms.uTime = timeU;
    sh.vertexShader = 'attribute vec4 aUv; attribute float aSeed; varying float vSd; varying vec2 vSu;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = aUv.xy + uv * aUv.zw; vSd = aSeed; vSu = uv;');
    sh.fragmentShader = 'uniform float uTime; varying float vSd; varying vec2 vSu;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nvec2 adE = min(vSu, 1.0 - vSu); float adPer = adE.x < adE.y ? (vSu.x < 0.5 ? vSu.y : 3.0 - vSu.y) * 0.5 : (vSu.y < 0.5 ? 1.5 + (1.0 - vSu.x) : 0.5 + vSu.x) * 0.5;\nfloat adBulb = step(min(adE.x * 2.0, adE.y), 0.07) * step(0.33, fract(vSd * 7.0)) * step(0.5, fract(adPer * 14.0)) * (0.35 + 0.65 * step(0.5, fract(adPer * 3.5 - uTime * 1.3)));\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.86, 0.55) * 1.6, adBulb);\nfloat adFl = vSd > 0.86 ? step(0.25, fract(sin(floor(uTime * 14.0) * 12.99 + vSd * 78.2) * 43758.5)) * 0.8 + 0.2 : 0.92 + 0.08 * sin(uTime * 60.0 + vSd * 40.0);\ndiffuseColor.rgb *= adFl;'); };
  const signMesh = new THREE.InstancedMesh(signG, signM, signs.length);
  signs.forEach((s, k) => { const cell = Math.floor(R() * atlas.count); aUv.set(s.kind === 0 ? [(cell % 4) / 4 + 0.012, 1 - (Math.floor(cell / 4) + 1) / 8 + 0.031, 0.226, 0.0565] : [(cell % 4) / 4, 1 - (Math.floor(cell / 4) + 1) / 8, 0.25, 0.125], k * 4); aSeed[k] = R();
    dummy.position.set(s.x, s.y, s.z); dummy.rotation.set(0, Math.atan2(s.nx, s.nz) + (s.kind === 1 ? Math.PI / 2 : 0), s.kind === 1 || s.kind === 3 ? Math.PI / 2 : 0, 'YXZ'); dummy.scale.set(s.w, s.h, 1); dummy.updateMatrix(); signMesh.setMatrixAt(k, dummy.matrix);
    if (s.kind !== 3) decals.push([s.x + s.nx * (s.kind === 2 ? 7 : 3.4), 0.2, s.z + s.nz * (s.kind === 2 ? 7 : 3.4), s.kind === 2 ? 30 : 13, atlas.colors[cell], s.kind === 2 ? 0.035 : 0.06]); });
  dummy.rotation.order = 'XYZ';
  signG.setAttribute('aUv', new THREE.InstancedBufferAttribute(aUv, 4)); signG.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  signMesh.frustumCulled = false; scene.add(signMesh);

  // ---- Billboards (printed, floodlit after dark) and LED screens that cycle through the adverts ----
  const adTex = adAtlas();
  const late = [], boardPosts = [];
  { const px = city.beachX; for (let z = 60; z < SPAN; z += P) { const x = px - 7; boardPosts.push([x, z]);
      const featured = true;
      for (const sgn of [-1, 1]) screens.push({ featured, x, y: 10.2, z: z + sgn * 0.16, nx: 0, nz: sgn, w: 13, h: 6.5 }); } }
  // Keep a handful of printed posters among the larger digital placements.
  for (let i = ads.length - 1; i >= 0; i--) {
    if (i % 4 !== 0) screens.push({ ...ads.splice(i, 1)[0], framed: true });
  }
  // Use mounted facade screens facing each leg of the VIP circuit.
  city.convoyBoards = screens.filter(s => {
    if (s.shop || s.w < 5 || s.y > 21) return false;
    const across = s.nx ? s.x : s.z, along = s.nx ? s.z : s.x;
    const roads = s.nx ? [3*P-2,6*P+2] : [2*P-2,6*P+2];
    const inside = along > (s.nx ? 2 : 3)*P && along < 6*P;
    return inside && roads.some(road => {
      const offset=(road-across)*(s.nx || s.nz);
      return offset > 6 && offset < 27;
    });
  });
  // Freestanding panels face the motorcade from the outer sidewalk on each avenue.
  for (const [ax, road, normal, from, to] of [[1,3,1,2,6],[1,6,-1,2,6],[0,2,1,3,6],[0,6,-1,3,6]]) {
    for (let block=from; block<to; block++) {
      const cross = road*P - normal*(HALF+2.3), along=(block+.52)*P;
      const x=ax?cross:along, z=ax?along:cross, nx=ax?normal:0, nz=ax?0:normal;
      const panel={x:x+nx*.18,y:6.2,z:z+nz*.18,nx,nz,w:7.6,h:3.8,convoy:true,framed:true};
      screens.push(panel); city.convoyBoards.push(panel);
      late.push({x,y:6.2,z,sx:ax ? .32 : 7.9,sy:4.08,sz:ax?7.9:.32});
      for (const side of [-2.7,2.7]) {
        const px=x+nz*side,pz=z+nx*side;
        late.push({x:px,y:2.14,z:pz,sx:.24,sy:4.28,sz:.24}); solid.push({x:px,z:pz,r:.17});
      }
    }
  }
  for (const board of city.convoyBoards) board.convoy = true;
  const adG = new THREE.PlaneGeometry(1, 1), adUv = new Float32Array(ads.length * 4);
  const adM = new THREE.MeshStandardMaterial({ map: adTex, emissiveMap: adTex, emissive: 0xffffff, emissiveIntensity: 0.05, roughness: 0.55, metalness: 0, envMapIntensity: 0.4 });
  adM.onBeforeCompile = sh => { sh.vertexShader = 'attribute vec4 aUv;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = aUv.xy + uv * aUv.zw; vEmissiveMapUv = vMapUv;'); };
  const adMesh = new THREE.InstancedMesh(adG, adM, Math.max(1, ads.length));
  ads.forEach((s2, k) => { const cell = Math.floor(R() * 32); adUv.set([(cell % 4) / 4, 1 - (Math.floor(cell / 4) + 1) / 8, 0.25, 0.125], k * 4); dummy.position.set(s2.x, s2.y, s2.z); dummy.rotation.set(0, Math.atan2(s2.nx, s2.nz), 0); dummy.scale.set(s2.w, s2.h, 1); dummy.updateMatrix(); adMesh.setMatrixAt(k, dummy.matrix); });
  adG.setAttribute('aUv', new THREE.InstancedBufferAttribute(adUv, 4)); adMesh.count = ads.length; adMesh.frustumCulled = false; adMesh.receiveShadow = SH; scene.add(adMesh);
  hooks.push((e, mix) => { adM.emissiveIntensity = mix(0.04, 0.85, e.night); });
  const portraitAd = new THREE.TextureLoader().load('./assets/hisan-campaign.webp');
  portraitAd.colorSpace = THREE.SRGBColorSpace;
  const ledU = { uShopName: { value: shopName }, uPortrait: { value: portraitAd }, uTime: timeU, uAds: { value: adTex }, uGain: { value: 1.2 } };
  const screenM = new THREE.ShaderMaterial({ uniforms: ledU, fog: false,
    vertexShader: 'attribute float featured; varying float vFeatured; varying vec2 vUv; varying float vId; void main(){ vFeatured = featured; vUv = uv; vId = fract(instanceMatrix[3].x * 0.137 + instanceMatrix[3].z * 0.071); gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTime, uGain; uniform sampler2D uAds, uPortrait, uShopName; varying float vFeatured; varying vec2 vUv; varying float vId;
      vec3 ad(float k, vec2 uv){ k = mod(k, 32.0); return texture2D(uAds, (vec2(mod(k, 4.0), 7.0 - floor(k / 4.0)) + uv) / vec2(4.0, 8.0)).rgb; }
      void main(){ float t = uTime / 5.5 + vId * 32.0, k = floor(t), f = fract(t);
        float wipe = smoothstep(0.9, 1.0, f); vec2 uv = clamp(vUv, 0.003, 0.997);
        vec3 c = mix(ad(k, uv), ad(k + 1.0, uv), step(uv.x, wipe * 1.02));
        c += vec3(1.0) * (1.0 - smoothstep(0.0, 0.02, abs(uv.x - wipe * 1.02))) * step(0.001, wipe) * 0.6;
        float slot = floor(uTime / 6.0 + vId * 12.0);
        if (mod(slot, 5.0) < 3.0 || vFeatured > 1.5) {
          c = texture2D(uPortrait, vec2(uv.x, (2.0 - mod(slot, 3.0) + uv.y) / 3.0)).rgb;
          float phase = fract(uTime / 7.0 + vId);
          float underline = 1.0 - smoothstep(0.003, 0.008, abs(uv.y - 0.815));
          c += vec3(0.18, 0.56, 0.43) * underline * step(0.05, uv.x) * (1.0 - smoothstep(phase * 0.55, phase * 0.55 + 0.01, uv.x));
        }
        if (vFeatured > 2.5) {
          float t = mod(uTime, 4.1);
          float dip = exp(-80.0 * abs(t - 1.4)) + 0.6 * exp(-65.0 * abs(t - 1.63));
          c = texture2D(uShopName, uv).rgb * (1.0 - 0.40 * dip);
        }
        vec2 px = fract(vUv * vec2(220.0, 110.0)) - 0.5; c *= 0.72 + 0.4 * (1.0 - smoothstep(0.2, 0.5, length(px)));
        c *= 0.94 + 0.06 * sin(vUv.y * 60.0 - uTime * 9.0);
        gl_FragColor = vec4(c * uGain, 1.0); }` });
  const screenMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), screenM, Math.max(1, screens.length));
  screenMesh.geometry.setAttribute('featured', new THREE.InstancedBufferAttribute(Float32Array.from(screens, s => s.shop ? 3 : s.flagship || s.convoy ? 2 : Number(!!s.featured)), 1));
  screens.forEach((s2, k) => { dummy.position.set(s2.x, s2.y, s2.z); dummy.rotation.set(0, Math.atan2(s2.nx, s2.nz), 0); dummy.scale.set(s2.w, s2.h, 1); dummy.updateMatrix(); screenMesh.setMatrixAt(k, dummy.matrix); decals.push([s2.x + s2.nx * 12, 0.03, s2.z + s2.nz * 12, 40, 0x8fa8ff, 0.16]);
    if (s2.flagship) {
      // Support the elevated marquee independently of the varying facade setbacks.
      for (const side of [-1, 1]) {
        const x = s2.x + side * s2.nz * 3.5 - s2.nx * .24;
        const z = s2.z - side * s2.nx * 3.5 - s2.nz * .24;
        late.push({ x, z, y: 3.83, sy: 7.66, sx: .26, sz: .26 });
        solid.push({ x, z, r: .2 });
      }
    }
    if (!s2.featured && !s2.framed) late.push({ x: s2.x - s2.nx * 0.55, y: s2.y, z: s2.z - s2.nz * 0.55, sx: s2.nx ? 1.08 : s2.w + 0.6, sy: s2.h + 0.6, sz: s2.nz ? 1.08 : s2.w + 0.6 }); });
  for (const [x, z] of boardPosts) { solid.push({ x, z, r: 0.45 }); late.push({ x, y: 3.51, z, sx: 0.53, sy: 7.02, sz: 0.53 }); late.push({ x, y: 10.2, z, sx: 13.32, sy: 6.79, sz: 0.28 }); }
  { const lm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.5 }), Math.max(1, late.length)); late.forEach((t, k) => { dummy.position.set(t.x, t.y, t.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(t.sx, t.sy, t.sz); dummy.updateMatrix(); lm.setMatrixAt(k, dummy.matrix); }); dummy.scale.set(1, 1, 1); lm.count = late.length; lm.frustumCulled = false; lm.castShadow = SH; scene.add(lm); }
  screenMesh.count = screens.length; screenMesh.frustumCulled = false; scene.add(screenMesh);
  hooks.push((e, mix) => { ledU.uGain.value = mix(1.15, 2.3, e.night); });

  // ---- Glowing tubes, lamp heads and trims ----
  const glowMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), glows.length);
  glows.forEach(([x, y, z, sx, sy, sz, hex, k2], k) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); glowMesh.setMatrixAt(k, dummy.matrix); col.set(hex).multiplyScalar(k2); glowMesh.setColorAt(k, col); });
  glowMesh.frustumCulled = false; hooks.push((e, mix) => glowMesh.material.color.setScalar(mix(0.4, 1, e.night))); scene.add(glowMesh);

  // ---- Pools of light on the ground ----
  const pool = canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.42)'); g.addColorStop(0.7, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  const decalG = new THREE.PlaneGeometry(1, 1); decalG.rotateX(-Math.PI / 2);
  const decalMesh = new THREE.InstancedMesh(decalG, new THREE.MeshBasicMaterial({ map: pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), decals.length);
  decals.forEach(([x, y, z, s, hex, k2], k) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(s, 1, s); dummy.updateMatrix(); decalMesh.setMatrixAt(k, dummy.matrix); col.set(hex).multiplyScalar(k2); decalMesh.setColorAt(k, col); });
  decalMesh.frustumCulled = false; decalMesh.renderOrder = 2; hooks.push(e => { decalMesh.visible = e.night > 0.03; decalMesh.material.opacity = e.night; }); scene.add(decalMesh);

  // District chunks: frustum culling comes free, and distant street-level detail is switched off.
  const far = city.chunks = [];
  for (const [mesh, dist] of [[bm, Infinity], [trimMesh, 430], [lampMesh, 430], [sigMesh, 380], [signMesh, 650], [adMesh, 900], [glowMesh, 760], [decalMesh, 330]]) splitChunks(mesh, dist, far);
  let cullTick = 0;
  const reach = quality.reach || 1; // lighter presets draw street detail less far
  city.cull = (p, force) => { const now = performance.now(); if (now - cullTick < 140 && !force) return; cullTick = now; for (const c of far) c.mesh.visible = Math.hypot(c.x - p.x, c.z - p.z) < c.max * reach + c.r;
    for (const k of kitLod) { const close = Math.hypot(k.x - p.x, k.z - p.z) < 330 * reach + k.r; k.near.visible = close; k.far.visible = !close; } };
  city.update = (t) => { updateSignals(t); city.sea.update(t); beaconPts.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.4)); };
  city.dot = dot; city.pool = pool; city.stats = { kit: kit.reduce((n, k) => n + k.uses.length, 0), trim: trim.length, buildings: boxes.length, signs: signs.length, lamps: lampSpots.length, screens: screens.length };
  return city;
}
