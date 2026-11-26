// The ocean, after Eight Worlds: a Gerstner wave field (the same waves drive the GPU surface and the CPU height query
// used by boats), whitecaps where the crests fold, breaking bands on every shore, and colour that follows the depth
// of the water. It is a physically based material, so the sky, sun and moon light it like everything else.
import * as THREE from '/evermile/vendor/three.module.js';
import { CAUSTICS, CAUSTIC_GLSL } from './caustics.js';

export const SEA_LEVEL = -0.62;
// Two tides per twelve-minute game day. Keep high water below the promenade.
const tidePeriod = 360;
export function beachHeight(distance, z) {
  const width = 92 + 5 * Math.sin(z * .027) + 3 * Math.sin(z * .074);
  return .17 - 1.5 * Math.min(1, Math.max(0, distance / width)) ** 2;
}
const NW = 20, NV = 12, G = 9.81, DEPTH = 64;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Tileable foam lace: bright along the edges of three scales of Worley cells.
function foamTexture() {
  const S = 256, data = new Uint8Array(S * S * 4), r = rng(77);
  const mk = p => { const t = new Float32Array(p * p * 2); for (let i = 0; i < t.length; i++) t[i] = r(); return t; };
  const T8 = mk(8), T20 = mk(20), T48 = mk(48);
  const wor = (x, y, p, T) => { x *= p; y *= p; const xi = Math.floor(x), yi = Math.floor(y); let m1 = 9, m2 = 9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const cx = xi + dx, cy = yi + dy, k = ((((cy % p) + p) % p) * p + (((cx % p) + p) % p)) * 2, fx = cx + T[k] - x, fy = cy + T[k + 1] - y, d = fx * fx + fy * fy; if (d < m1) { m2 = m1; m1 = d; } else if (d < m2) m2 = d; }
    return Math.sqrt(m2) - Math.sqrt(m1); };
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const x = i / S, y = j / S, e1 = wor(x, y, 8, T8), e2 = wor(x, y, 20, T20), e3 = wor(x, y, 48, T48), k = (j * S + i) * 4;
    data[k] = clamp(clamp(1 - e1 * 3.2) * 0.55 + clamp(1 - e2 * 3.5) * 0.35 + clamp(1 - e3 * 4) * 0.25) * 255; data[k + 1] = clamp(1 - e2 * 2.4) * 255; data[k + 2] = clamp(e3 * 2.5) * 255; data[k + 3] = 255; }
  const t = new THREE.DataTexture(data, S, S); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

const WAVES = `uniform vec4 oWA[${NW}]; uniform vec4 oWB[${NW}]; uniform float oTime, oLevel, oWeather, oNight; uniform vec2 oCenter;
uniform sampler2D oDepth; uniform vec4 oDepthB; uniform vec3 oBeach;
vec2 oDepthAt(vec2 p) { vec2 t = (p - oDepthB.xy) * oDepthB.zw; vec2 d = vec2(1.0); if (all(greaterThanEqual(t, vec2(0.0))) && all(lessThanEqual(t, vec2(1.0)))) d = texture2D(oDepth, t).rg;
  d.x *= ${DEPTH.toFixed(1)};
  if (p.y > oBeach.y && p.y < oBeach.z && p.x > oBeach.x - 124.0) { float b = clamp((oBeach.x - p.x) / (92.0 + 5.0*sin(p.y*.027) + 3.0*sin(p.y*.074)), 0.0, 1.0); d.x = min(d.x, 1.5 * b * b - 0.79); }
  d.x = max(0.0, d.x + oLevel + 0.62); return d; }
float oAmp(vec2 d) { return smoothstep(0.3, 16.0, d.x) * mix(0.22, 1.0, d.y); }
`;

export function buildSea(scene, promenade, center, beachLength) {
  const r = rng(7), waves = [], seaDir = 0.12;
  for (let i = 0; i < NW; i++) { const f = i / (NW - 1), lambda = 150 * Math.pow(1.6 / 150, f) * (0.9 + r() * 0.2), spread = (0.2 + 0.95 * f) * (r() * 2 - 1) + (i % 5 === 3 ? 0.9 * (r() > 0.5 ? 1 : -1) : 0), th = seaDir + spread, k = Math.PI * 2 / lambda;
    waves.push({ dx: Math.cos(th), dz: Math.sin(th), k, lambda, omega: Math.sqrt(G * k), phase: r() * 6.283, amp: 0, chop: 0.7 }); }
  const WA = waves.map(() => new THREE.Vector4()), WB = waves.map(() => new THREE.Vector4());
  const depthTex = new THREE.DataTexture(new Uint8Array([255, 255]), 1, 1, THREE.RGFormat); depthTex.needsUpdate = true;
  const nrm = new THREE.TextureLoader().load('/eight-worlds/assets/tex/waternormals.jpg'); nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping;
  const U = { oWA: { value: WA }, oWB: { value: WB }, oTime: { value: 0 }, oLevel: { value: SEA_LEVEL }, oWeather: { value: 0 }, oNight: { value: 0 }, oCenter: { value: new THREE.Vector2(promenade - 300, center) },
    oDepth: { value: depthTex }, oDepthB: { value: new THREE.Vector4(0, 0, 0, 0) }, oBeach: { value: new THREE.Vector3(promenade, center - beachLength / 2, center + beachLength / 2) },
    oFoam: { value: foamTexture() }, oNormal: { value: nrm }, oSunDir: { value: new THREE.Vector3(0, 1, 0) }, oSunCol: { value: new THREE.Color(1, 1, 1) } };
  let wind = 0.35;
  const setAmps = w => { for (let i = 0; i < NW; i++) { const W = waves[i], a = W.lambda / 220, s = 0.0045 * smooth(8, 60, W.lambda) + 0.0035 + 0.026 * smooth(a - 0.28, a + 0.36, w);
    W.amp = s * W.lambda / 3.5; W.chop = 0.55 + 0.3 * clamp(w); WA[i].set(W.dx, W.dz, W.k, W.amp); WB[i].set(W.omega, W.phase, W.chop, W.lambda); } };
  setAmps(wind);

  const material = new THREE.MeshPhysicalMaterial({ color: 0x0b2a33, roughness: 0.05, metalness: 0, ior: 1.333, specularIntensity: 1, envMapIntensity: 1.05 });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = WAVES + 'varying vec2 oRest; varying vec3 oWorld; varying vec2 oD; varying float oCrest;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
  float rr = position.x, th = position.z;
  vec2 rest = oCenter + vec2(cos(th), sin(th)) * rr;
  vec2 dd = oDepthAt(rest); float ak = oAmp(dd) * (1.0 + 0.35 * oWeather);
  float spacing = max(rr * 0.025, 0.25);
  vec3 transformed = vec3(rest.x, oLevel, rest.y); float jac = 0.0;
  for (int i = 0; i < ${NV}; i++) { vec4 a = oWA[i], b = oWB[i]; float lod = smoothstep(1.6, 4.5, b.w / spacing);
    float ph = a.z * dot(a.xy, rest) - b.x * oTime + b.y, s = sin(ph), c = cos(ph), am = a.w * lod * ak;
    transformed.xz -= a.xy * (b.z * am * s); transformed.y += am * c; jac += b.z * am * a.z * c; }
  // run-up on the town beach
  float west = oBeach.x - rest.x;
  float band = smoothstep(40.0, 53.0, west) * (1.0 - smoothstep(107.0, 124.0, west)) * smoothstep(0.0, 34.0, rest.y - oBeach.y) * smoothstep(0.0, 34.0, oBeach.z - rest.y);
  transformed.y += band * (0.075 * sin(dot(rest, vec2(0.42, -0.14)) - oTime * 1.45) + 0.145 * sin(rest.x * 0.81 + rest.y * 0.073 - oTime * 2.24 + sin(rest.y * 0.1) * 1.5)) * (1.0 + 0.46 * oWeather);
  oRest = rest; oWorld = transformed; oD = dd; oCrest = jac;`);
    shader.fragmentShader = WAVES + `uniform sampler2D oFoam, oNormal; uniform vec3 oSunDir, oSunCol; varying vec2 oRest; varying vec3 oWorld; varying vec2 oD; varying float oCrest; float oFoamK = 0.0;
float oHash(vec2 p) { vec3 v = fract(vec3(p.xyx) * 0.1031); v += dot(v, v.yzx + 33.33); return fract((v.x + v.y) * v.z); }
float oNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(oHash(i), oHash(i + vec2(1, 0)), f.x), mix(oHash(i + vec2(0, 1)), oHash(i + 1.0), f.x), f.y); }
` + shader.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  vec2 d = oDepthAt(oRest); float depth = d.x, dist = length(cameraPosition - oWorld);
  float wind = clamp(0.3 + oWeather * 0.6, 0.0, 1.0);
  vec3 ft = texture2D(oFoam, oRest * 0.055).rgb, ft2 = texture2D(oFoam, oRest * 0.19 + 0.37).rgb; float lace = ft.r * 0.7 + ft2.r * 0.5;
  float cap = smoothstep(0.62 - wind * 0.22, 0.98, oCrest + (ft.g - 0.5) * 0.22) * oAmp(d);
  float n = oNoise(oRest * 0.25 + oTime * 0.1), bandS = sin(depth * 1.9 - oTime * 1.15 + n * 4.0) * 0.5 + 0.5;
  float shore = (1.0 - smoothstep(0.0, 2.8, depth)) * (0.35 + 0.65 * bandS) * 0.75 + (1.0 - smoothstep(0.0, 0.35, depth)) * lace * 0.45;
  // the town beach keeps its breaking lines
  float warp = (oNoise(oRest * vec2(0.15, 0.085) + vec2(-oTime * 0.14, 0.0)) - 0.5) * 3.4 + sin(oRest.y * 0.31 + oTime * 0.59) * 0.39;
  float pulse = cos(clamp(depth, 0.0, 3.0) * 43.5 + oTime * (1.45 + 0.5 * oWeather) + warp), surf = 1.0 - smoothstep(0.06, 1.1, depth);
  float crestB = smoothstep(0.37, 0.94, pulse) * surf * 0.72;
  float fade = 1.0 - smoothstep(900.0, 4200.0, dist);
  oFoamK = clamp((cap * (0.55 + 0.6 * lace) + shore * (0.35 + 0.9 * lace) * 0.8 + crestB) * fade, 0.0, 1.0);
  vec3 deep = mix(vec3(0.010, 0.050, 0.075), vec3(0.006, 0.020, 0.040), smoothstep(8.0, 50.0, depth));
  vec3 shallow = vec3(0.10, 0.30, 0.27) * mix(1.0, 0.75, oWeather);
  vec3 water = mix(shallow, deep, smoothstep(0.4, 9.0, depth));
  water = mix(water, vec3(0.30, 0.27, 0.19), (1.0 - smoothstep(0.0, 0.45, depth)) * 0.6);
  diffuseColor.rgb = mix(water, vec3(0.80, 0.84, 0.85), oFoamK);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = clamp(0.035 + 0.07 * oWeather + smoothstep(300.0, 5000.0, length(cameraPosition - oWorld)) * 0.08 + oFoamK * 0.75, 0.0, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { vec2 w = oRest; float fw = max(length(fwidth(oRest)), 1e-4), ak = oAmp(oDepthAt(oRest)) * (1.0 + 0.35 * oWeather);
    vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0);
    for (int i = 0; i < ${NW}; i++) { vec4 a = oWA[i], b = oWB[i]; float lod = smoothstep(1.2, 3.5, b.w / fw) * (i < ${NV} ? ak : max(ak, 0.35)); if (lod <= 0.0) continue;
      float ph = a.z * dot(a.xy, w) - b.x * oTime + b.y, s = sin(ph), c = cos(ph), ka = a.z * a.w * lod, q = b.z * ka * c;
      T.x -= a.x * a.x * q; T.y -= a.x * ka * s; T.z -= a.x * a.y * q; B.x -= a.x * a.y * q; B.y -= a.y * ka * s; B.z -= a.y * a.y * q; }
    vec3 N = normalize(cross(B, T));
    float near = 1.0 / (1.0 + length(cameraPosition - oWorld) * 0.004);
    vec2 d1 = texture2D(oNormal, w * 0.11 + vec2(0.7, 0.2) * oTime * 0.035).xy - 0.5, d2 = texture2D(oNormal, w * 0.037 - vec2(0.2, 0.7) * oTime * 0.012 + 0.3).xy - 0.5, d3 = texture2D(oNormal, w * 0.006 + oTime * 0.004).xy - 0.5;
    float ds = 0.3 + 1.1 * clamp(0.3 + oWeather * 0.6, 0.0, 1.0);
    N = normalize(N + vec3(d1.x + d2.x, 0.0, d1.y + d2.y) * ds * (0.35 + 0.65 * near) + vec3(d3.x, 0.0, d3.y) * ds * 0.5);
    vec3 V = normalize(cameraPosition - oWorld); if (dot(N, V) < 0.03) N = normalize(N + V * (0.03 - dot(N, V)));
    normal = normalize((viewMatrix * vec4(N, 0.0)).xyz); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  { // light through the thin water near the crests
    vec3 V = normalize(cameraPosition - oWorld), L = normalize(oSunDir);
    float sss = pow(max(dot(V, -normalize(L + vec3(0.0, 0.35, 0.0))), 0.0), 3.0) * clamp(0.3 + oCrest * 1.6, 0.0, 1.6);
    totalEmissiveRadiance += vec3(0.04, 0.36, 0.32) * oSunCol * (sss * 0.35 + max(L.y, 0.0) * 0.02) * (1.0 - oFoamK) * (1.0 - oNight * 0.8); }`);
  };
  material.customProgramCacheKey = () => 'afterdark-ocean';

  // A polar grid around the camera: fine underfoot, kilometres wide at the horizon.
  const SEG = 256, RINGS = 210, rmax = 16000, r0 = 0.4, gr = Math.pow(rmax / r0, 1 / RINGS), pos = new Float32Array((RINGS + 1) * (SEG + 1) * 3), idx = [];
  let p = 0; for (let j = 0; j <= RINGS; j++) { const rr = j === 0 ? 0 : r0 * Math.pow(gr, j); for (let i = 0; i <= SEG; i++) { pos[p++] = rr; pos[p++] = 0; pos[p++] = i / SEG * Math.PI * 2; } }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) { const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length).fill(0).map((v, i) => i % 3 === 1 ? 1 : 0), 3)); g.setIndex(idx);
  const sea = new THREE.Mesh(g, material); sea.name = 'Ocean'; sea.frustumCulled = false; sea.receiveShadow = true;
  sea.onBeforeRender = (renderer, sc, camera) => { U.oCenter.value.set(camera.position.x, camera.position.z); };
  scene.add(sea);
  let sun = null, depthCPU = null;
  const tmp = new THREE.Vector3();
  const api = {
    mesh: sea, level: SEA_LEVEL, waterLevel: U.oLevel, waves,
    // Bathymetry over the whole map: depth below the sea and how open the water is (fjords are sheltered).
    setTerrain(bounds, heightAt, sheltered) {
      const cell = 16, w = Math.ceil((bounds.x1 - bounds.x0) / cell) + 1, h = Math.ceil((bounds.z1 - bounds.z0) / cell) + 1, data = new Uint8Array(w * h * 2);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const x = bounds.x0 + i * cell, z = bounds.z0 + j * cell, k = (j * w + i) * 2; data[k] = Math.round(clamp((SEA_LEVEL - heightAt(x, z)) / DEPTH) * 255); data[k + 1] = Math.round((1 - (sheltered ? sheltered(x, z) : 0)) * 255); }
      const t = new THREE.DataTexture(data, w, h, THREE.RGFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
      U.oDepth.value.dispose(); U.oDepth.value = t; U.oDepthB.value.set(bounds.x0, bounds.z0, 1 / ((w - 1) * cell), 1 / ((h - 1) * cell));
      depthCPU = { data, w, h, cell, bounds };
    },
    // Water depth and openness at a point (CPU twin of the shader lookup).
    depthAt(x, z) { if (!depthCPU) return [DEPTH, 1]; const { data, w, h, cell, bounds } = depthCPU, i = Math.round((x - bounds.x0) / cell), j = Math.round((z - bounds.z0) / cell); if (i < 0 || j < 0 || i >= w || j >= h) return [DEPTH, 1]; const k = (j * w + i) * 2; return [data[k] / 255 * DEPTH, data[k + 1] / 255]; },
    // Surface height and slope at a point for floating things (large waves only, as in the vertex shader).
    heightAt(x, z, out = {}) { const [dep, open] = api.depthAt(x, z), ak = smooth(0.3, 16, dep) * (0.22 + 0.78 * open) * (1 + 0.35 * U.oWeather.value), t = U.oTime.value; let y = U.oLevel.value, gx = 0, gz = 0;
      for (let i = 0; i < NV; i++) { const W = waves[i], ph = W.k * (W.dx * x + W.dz * z) - W.omega * t + W.phase, a = W.amp * ak; y += a * Math.cos(ph); gx -= a * W.k * W.dx * Math.sin(ph); gz -= a * W.k * W.dz * Math.sin(ph); }
      out.y = y; out.gx = gx; out.gz = gz; return out; },
    update(t) { U.oTime.value = t; U.oLevel.value = SEA_LEVEL - .075 + .30 * Math.sin(t * 2 * Math.PI / tidePeriod); sun ||= scene.children.find(o => o.isDirectionalLight); if (sun) { tmp.copy(sun.position).sub(sun.target.position).normalize(); U.oSunDir.value.copy(tmp); U.oSunCol.value.copy(sun.color).multiplyScalar(sun.intensity / 5.6); } },
    setTime(env) {
      U.oNight.value = env.night; U.oWeather.value = env.rain;
      const w = 0.3 + env.rain * 0.55; if (Math.abs(w - wind) > 0.01) { wind = w; setAmps(wind); }
      material.envMapIntensity = 1.05 - env.night * 0.45;
    }
  };
  return api;
}

/** Match the darker saturated sand to the lowest part of the beach profile. */
export function wetSand(material, level) {
  material.customProgramCacheKey = () => 'afterdark-wet-sand';
  material.onBeforeCompile = shader => {
    shader.uniforms.uTide = level; Object.assign(shader.uniforms, CAUSTICS);
    shader.vertexShader = 'varying vec3 beachPos; varying vec3 beachW;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nbeachPos = position; beachW = (modelMatrix * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = CAUSTIC_GLSL + 'uniform float uTide; varying vec3 beachPos; varying vec3 beachW;\n' + shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += adCaustics(beachW, diffuseColor.rgb);').replace('#include <color_fragment>', `#include <color_fragment>
  float edge = beachPos.y - uTide + .035*sin(beachPos.z*.43);
  float soaked = 1.0 - smoothstep(-.04, .34, edge);
  diffuseColor.rgb *= mix(vec3(1.0), vec3(0.53, 0.57, 0.61), soaked);
`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.93, 0.70, soaked);');
  };
}
