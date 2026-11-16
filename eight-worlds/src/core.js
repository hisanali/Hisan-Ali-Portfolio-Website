// Shared foundations: atmosphere uniform block, global shader patches, noise, asset loading.
import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const damp = (cur, tgt, tau, dt) => tgt + (cur - tgt) * Math.exp(-dt / Math.max(tau, 1e-4));
export const TAU = Math.PI * 2;

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function hash2(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// ---------- noise ----------
const P = new Uint8Array(512);
{ const r = rng(1337); const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const G2 = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1];
const F2 = 0.5 * (Math.sqrt(3) - 1), GG2 = (3 - Math.sqrt(3)) / 6;
export function simplex2(x, y) {
  const s = (x + y) * F2; const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * GG2; const x0 = x - (i - t), y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
  const x1 = x0 - i1 + GG2, y1 = y0 - j1 + GG2, x2 = x0 - 1 + 2 * GG2, y2 = y0 - 1 + 2 * GG2;
  const ii = i & 255, jj = j & 255; let n = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0; if (t0 > 0) { const g = (P[ii + P[jj]] & 7) * 2; t0 *= t0; n += t0 * t0 * (G2[g] * x0 + G2[g + 1] * y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1; if (t1 > 0) { const g = (P[ii + i1 + P[jj + j1]] & 7) * 2; t1 *= t1; n += t1 * t1 * (G2[g] * x1 + G2[g + 1] * y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2; if (t2 > 0) { const g = (P[ii + 1 + P[jj + 1]] & 7) * 2; t2 *= t2; n += t2 * t2 * (G2[g] * x2 + G2[g + 1] * y2); }
  return 70 * n; // ~[-1,1]
}
export function fbm(x, y, oct = 5, lac = 2, gain = 0.5) {
  let a = 1, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) { s += a * simplex2(x * f + i * 17.1, y * f - i * 9.3); n += a; a *= gain; f *= lac; }
  return s / n;
}
export function ridged(x, y, oct = 5, lac = 2.1, gain = 0.5) {
  let a = 1, f = 1, s = 0, n = 0, w = 1;
  for (let i = 0; i < oct; i++) { let v = 1 - Math.abs(simplex2(x * f + i * 31.7, y * f + i * 11.9)); v *= v; s += a * v * w; n += a; w = clamp(v * 1.6); a *= gain; f *= lac; }
  return s / n; // [0,1]
}
export function vnoise3(x, y, z) { // cheap value noise for misc CPU use
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); let xf = x - xi, yf = y - yi, zf = z - zi;
  xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf); zf = zf * zf * (3 - 2 * zf);
  const h = (a, b, c) => P[(P[(P[a & 255] + b) & 255] + c) & 255] / 255;
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), xf), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
    l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf), zf);
}

// ---------- shared atmosphere block (vec4 uA[8]) ----------
// 0: sunDir.xyz (main light dir), lightIntensity     1: lightColor.rgb, time
// 2: fogColor.rgb, heightFogDensity                  3: heightFalloff, fogBase, wetness, snowCover
// 4: windDir.x, windDir.z, windStrength, rain        5: sunward fog rgb, lightning flash
// 6: true sun dir xyz, night factor                  7: haze density, cloud cover, cloud shadow, cloud scroll
export const A = new Float32Array(32);
export const atmoUniform = { value: A };
A[0] = 0.3; A[1] = 0.8; A[2] = 0.5; A[14] = 0.0005; A[28] = 2e-5;

export const ATMO_GLSL = /* glsl */`
uniform vec4 uA[8];
float aHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float aNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(aHash(i), aHash(i+vec2(1,0)), f.x), mix(aHash(i+vec2(0,1)), aHash(i+vec2(1,1)), f.x), f.y); }
float aFbm(vec2 p){ return aNoise(p)*0.5 + aNoise(p*2.03+7.1)*0.3 + aNoise(p*4.1+3.3)*0.2; }
float cloudShade(vec3 wp){
  if (uA[7].z < 0.01) return 1.0;
  vec3 L = uA[0].xyz; vec2 p = wp.xz + L.xz / max(L.y, 0.12) * (1800.0 - wp.y);
  p = p * 0.00042 + uA[4].xy * uA[7].w;
  float n = aFbm(p); float c = uA[7].y;
  return 1.0 - uA[7].z * smoothstep(0.92 - c * 0.8, 1.12 - c * 0.8, n + 0.25);
}
vec3 applyAtmo(vec3 col, vec3 wpos, vec3 cam){
  vec3 v = wpos - cam; float d = length(v); vec3 dir = v / max(d, 1e-3);
  float b = uA[3].x; float t = b * v.y;
  float hf = exp(-b * max(cam.y - uA[3].y, -60.0)) * (abs(t) > 1e-3 ? (1.0 - exp(-t)) / t : 1.0);
  float od = d * (uA[2].w * min(hf, 40.0) + uA[7].x);
  float f = 1.0 - exp(-od);
  float sa = max(dot(dir, uA[6].xyz), 0.0);
  vec3 fc = mix(uA[2].rgb, uA[5].rgb, sa * sa * (0.35 + 0.65 * sa * sa * sa * sa));
  fc += vec3(0.7, 0.75, 1.0) * uA[5].w * 0.6;
  return mix(col, fc, f);
}
`;

let patched = false;
export function patchThree() {
  if (patched) return; patched = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = `#ifdef USE_FOG\n varying vec3 vWorldPosFog;\n#endif`;
  C.fog_vertex = `#ifdef USE_FOG\n vWorldPosFog = cameraPosition + transpose(mat3(viewMatrix)) * mvPosition.xyz;\n#endif`;
  C.fog_pars_fragment = `#ifdef USE_FOG\n uniform vec3 fogColor; uniform float fogDensity; varying vec3 vWorldPosFog;\n${ATMO_GLSL}\n#endif`;
  C.fog_fragment = `#ifdef USE_FOG\n gl_FragColor.rgb = applyAtmo(gl_FragColor.rgb, vWorldPosFog, cameraPosition);\n#endif`;
  // cloud shadows on the main directional light
  const key = 'getDirectionalLightInfo( directionalLight, directLight );';
  if (!C.lights_fragment_begin.includes(key)) console.warn('light patch: key missing');
  C.lights_fragment_begin = C.lights_fragment_begin.replace(key, key + `\n#if defined( USE_FOG ) && !defined( NO_WEATHER )\n directLight.color *= cloudShade( vWorldPosFog );\n#endif\n`);
  // wetness + snow cover on every lit surface
  C.lights_physical_fragment = `
#if defined( USE_FOG ) && !defined( NO_WEATHER )
{
  vec3 wN_ = inverseTransformDirection( nonPerturbedNormal, viewMatrix );
  float up_ = smoothstep( 0.15, 0.8, wN_.y );
  float wet_ = uA[3].z * ( 0.3 + 0.7 * up_ );
  diffuseColor.rgb *= mix( 1.0, 0.58, wet_ );
  roughnessFactor = mix( roughnessFactor, 0.1, wet_ * 0.85 );
  #ifndef NO_SNOW
  float sn_ = uA[3].w * 1.6 - 0.6 + wN_.y * 0.9 + ( aNoise( vWorldPosFog.xz * 0.7 ) - 0.5 ) * 0.5 - 0.35;
  sn_ = smoothstep( 0.0, 0.25, sn_ ) * step( 0.004, uA[3].w );
  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.86, 0.9, 0.95 ), sn_ );
  roughnessFactor = mix( roughnessFactor, 0.8, sn_ );
  #endif
}
#endif
` + C.lights_physical_fragment;
  for (const k of ['basic', 'lambert', 'phong', 'standard', 'physical', 'points', 'sprite', 'toon', 'matcap', 'dashed']) {
    if (THREE.ShaderLib[k]) THREE.ShaderLib[k].uniforms.uA = atmoUniform;
  }
}

// ---------- assets ----------
const texLoader = new THREE.TextureLoader();
const texCache = new Map();
export let maxAniso = 8;
export function setAniso(a) { maxAniso = a; }
export const pending = { n: 0, done: 0 };
export function tex(name, { srgb = false, repeat = true, flipY = true } = {}) {
  const key = name + (srgb ? ':s' : '');
  if (texCache.has(key)) return texCache.get(key);
  pending.n++;
  const t = texLoader.load('assets/tex/' + name, () => { pending.done++; }, undefined, () => { pending.done++; console.warn('texture failed', name); });
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso; t.flipY = flipY;
  texCache.set(key, t); return t;
}
export const texD = (n) => tex(n, { srgb: true });
export const texturesReady = (ms = 15000) => new Promise((res) => { const t0 = performance.now(); const f = () => (pending.done >= pending.n || performance.now() - t0 > ms) ? res() : setTimeout(f, 30); f(); });

const treeCache = new Map();
export async function loadTree(name) {
  if (treeCache.has(name)) return treeCache.get(name);
  const p = (async () => {
    const buf = await (await fetch('assets/models/' + name + '.bin')).arrayBuffer();
    const hl = new Uint32Array(buf, 0, 1)[0];
    const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
    let o = 4 + hl;
    const f32 = (n) => { const a = new Float32Array(buf, o, n); o += n * 4; return a; };
    const u32 = (n) => { const a = new Uint32Array(buf, o, n); o += n * 4; return a; };
    const mk = (nv, ni) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(f32(nv * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(f32(nv * 3), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(f32(nv * 2), 2));
      g.setIndex(new THREE.BufferAttribute(u32(ni), 1));
      return g;
    };
    const branches = mk(head.bv, head.bi), leaves = mk(head.lv, head.li);
    return { ...head, branches, leaves };
  })();
  treeCache.set(name, p); return p;
}

// small helpers
export function canvasTex(w, h, draw, { srgb = true, repeat = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; return t;
}
export const Q = { level: 2, steps: 16, shadow: 2048, ocean: 1, scale: 1 };
export function disposeTree(obj) {
  obj.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); });
}
