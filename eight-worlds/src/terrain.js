// Terrain: baked macro heightfield (+ optional hydraulic erosion), CPU detail, nested clip rings, layered scanned materials.
import * as THREE from 'three';
import { clamp, lerp, smooth, rng, fbm, simplex2, A, atmoUniform, tex, Q } from './core.js';

export class Heightfield {
  // fn(x,z) → macro height in metres. size: world extent. detail: {amp, freq, slopeAmp}
  constructor({ size = 16000, res = 1024, fn, erosion = 0, detail = { amp: 0.25, freq: 0.08, slopeAmp: 1.2 }, post = null, seed = 1 }) {
    this.size = size; this.res = res; this.detail = detail;
    const N = res, H = this.H = new Float32Array(N * N); const cell = this.cell = size / (N - 1); const half = size / 2;
    for (let j = 0; j < N; j++) { const z = -half + j * cell; for (let i = 0; i < N; i++) H[j * N + i] = fn(-half + i * cell, z); }
    if (erosion > 0) erode(H, N, erosion, seed);
    if (post) post(H, N, cell);
    // slope map for detail modulation and queries
    const S = this.S = new Float32Array(N * N); let mx = -1e9, mn = 1e9;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = H[j * N + Math.max(i - 1, 0)], b = H[j * N + Math.min(i + 1, N - 1)], c = H[Math.max(j - 1, 0) * N + i], d = H[Math.min(j + 1, N - 1) * N + i];
      S[j * N + i] = Math.hypot(b - a, d - c) / (2 * cell); const h = H[j * N + i]; if (h > mx) mx = h; if (h < mn) mn = h;
    }
    this.maxH = mx; this.minH = mn;
    const nd = new Uint8Array(N * N * 4);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = H[j * N + Math.max(i - 1, 0)], b = H[j * N + Math.min(i + 1, N - 1)], c = H[Math.max(j - 1, 0) * N + i], d = H[Math.min(j + 1, N - 1) * N + i]; const nx = a - b, nz = c - d, ny = 2 * cell, l = 1 / Math.hypot(nx, ny, nz), k = (j * N + i) * 4; nd[k] = (nx * l * 0.5 + 0.5) * 255; nd[k + 1] = (ny * l * 0.5 + 0.5) * 255; nd[k + 2] = (nz * l * 0.5 + 0.5) * 255; nd[k + 3] = 255; }
    const nt = this.normalTex = new THREE.DataTexture(nd, N, N); nt.minFilter = nt.magFilter = THREE.LinearFilter; nt.wrapS = nt.wrapT = THREE.ClampToEdgeWrapping; nt.needsUpdate = true;
    const t = this.heightTex = new THREE.DataTexture(H, N, N, THREE.RedFormat, THREE.FloatType);
    t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  }
  // Catmull-Rom bicubic sample of the macro field
  macro(x, z) {
    const N = this.res, H = this.H; let u = (x + this.size / 2) / this.cell, v = (z + this.size / 2) / this.cell;
    u = clamp(u, 1, N - 2.001); v = clamp(v, 1, N - 2.001);
    const i = u | 0, j = v | 0, fx = u - i, fy = v - j;
    const w = (t, o) => { const t2 = t * t, t3 = t2 * t; o[0] = -0.5 * t3 + t2 - 0.5 * t; o[1] = 1.5 * t3 - 2.5 * t2 + 1; o[2] = -1.5 * t3 + 2 * t2 + 0.5 * t; o[3] = 0.5 * t3 - 0.5 * t2; };
    w(fx, _wx); w(fy, _wy); let s = 0;
    for (let m = 0; m < 4; m++) { const row = (j - 1 + m) * N + i - 1; s += _wy[m] * (_wx[0] * H[row] + _wx[1] * H[row + 1] + _wx[2] * H[row + 2] + _wx[3] * H[row + 3]); }
    return s;
  }
  slope(x, z) {
    const N = this.res; let u = (x + this.size / 2) / this.cell, v = (z + this.size / 2) / this.cell; u = clamp(u, 0, N - 1.001); v = clamp(v, 0, N - 1.001);
    const i = u | 0, j = v | 0, fx = u - i, fy = v - j, S = this.S, k = j * N + i;
    return lerp(lerp(S[k], S[k + 1], fx), lerp(S[k + N], S[k + N + 1], fx), fy);
  }
  heightAt(x, z) {
    const d = this.detail; let h = this.macro(x, z); if (this.carve) h = this.carve(x, z, h);
    if (d.amp > 0 || d.slopeAmp > 0) {
      const s = this.slope(x, z); let a = d.amp + d.slopeAmp * smooth(0.25, 1.1, s); if (this.detailScale) a *= this.detailScale(x, z);
      h += a * (simplex2(x * d.freq, z * d.freq) * 0.6 + simplex2(x * d.freq * 2.7 + 9, z * d.freq * 2.7) * 0.28 + simplex2(x * d.freq * 7.1, z * d.freq * 7.1 + 5) * 0.12);
    }
    return h;
  }
  normalAt(x, z, out, e = 1.5) {
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z), hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return out.set(-hx, 2 * e, -hz).normalize();
  }
  dispose() { this.heightTex.dispose(); this.normalTex.dispose(); }
}
const _wx = [0, 0, 0, 0], _wy = [0, 0, 0, 0];

// droplet-based hydraulic erosion (after Hans Beyer / Sebastian Lague)
function erode(H, N, amount, seed) {
  const r = rng(seed * 31 + 5); const drops = Math.floor(amount * 70000);
  const inertia = 0.06, capacity = 5, minCap = 0.012, erodeSpeed = 0.32, deposit = 0.3, evap = 0.012, gravity = 4, maxLife = 46, R = 3;
  // brush
  const brush = []; let wsum = 0; for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d < R) { const w = 1 - d / R; brush.push(x, y, w); wsum += w; } }
  for (let i = 2; i < brush.length; i += 3) brush[i] /= wsum;
  let range = 0; { let mx = -1e9, mn = 1e9; for (let i = 0; i < H.length; i += 97) { if (H[i] > mx) mx = H[i]; if (H[i] < mn) mn = H[i]; } range = Math.max(mx - mn, 1); }
  const sc = range / 60; // normalise so parameters behave across worlds
  for (let n = 0; n < drops; n++) {
    let px = r() * (N - 3) + 1, py = r() * (N - 3) + 1, dx = 0, dy = 0, speed = 1, water = 1, sed = 0;
    for (let life = 0; life < maxLife; life++) {
      const ix = px | 0, iy = py | 0, fx = px - ix, fy = py - iy, k = iy * N + ix;
      const h00 = H[k], h10 = H[k + 1], h01 = H[k + N], h11 = H[k + N + 1];
      const gx = (h10 - h00) * (1 - fy) + (h11 - h01) * fy, gy = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;
      const h = h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;
      dx = dx * inertia - gx * (1 - inertia); dy = dy * inertia - gy * (1 - inertia);
      const l = Math.hypot(dx, dy); if (l < 1e-9) break; dx /= l; dy /= l; px += dx; py += dy;
      if (px < 1 || px >= N - 2 || py < 1 || py >= N - 2) break;
      const jx = px | 0, jy = py | 0, gx2 = px - jx, gy2 = py - jy, k2 = jy * N + jx;
      const nh = H[k2] * (1 - gx2) * (1 - gy2) + H[k2 + 1] * gx2 * (1 - gy2) + H[k2 + N] * (1 - gx2) * gy2 + H[k2 + N + 1] * gx2 * gy2;
      const dh = (nh - h) / sc; const cap = Math.max(-dh * speed * water * capacity, minCap);
      if (sed > cap || dh > 0) {
        const dep = dh > 0 ? Math.min(dh, sed) : (sed - cap) * deposit; sed -= dep; const d = dep * sc;
        H[k] += d * (1 - fx) * (1 - fy); H[k + 1] += d * fx * (1 - fy); H[k + N] += d * (1 - fx) * fy; H[k + N + 1] += d * fx * fy;
      } else {
        const er = Math.min((cap - sed) * erodeSpeed, -dh); sed += er; const e = er * sc;
        for (let b = 0; b < brush.length; b += 3) { const bx = ix + brush[b], by = iy + brush[b + 1]; if (bx < 0 || by < 0 || bx >= N || by >= N) continue; H[by * N + bx] -= e * brush[b + 2]; }
      }
      speed = Math.sqrt(Math.max(speed * speed + (-dh) * gravity, 0.01)); water *= 1 - evap;
    }
  }
}

const TERR_PARS = /* glsl */`
uniform sampler2D tD0, tD1, tD2, tD3, tN0, tN1, tN2, tN3, tHeightT, tMask, tNrmT;
uniform vec4 uScale, uRoughL, uP, uP2; uniform vec3 uTint0, uTint1, uTint2, uTint3; uniform vec4 uTerrT; // size, maxH, shadow on, normal strength
varying vec3 vWN;
vec3 gNrm; float gRough; float gEmis; float gSlope;
float terrShadow(vec3 p, float slope){
  if (uTerrT.z < 0.5) return 1.0;
  vec3 L = uA[0].xyz; if (L.y <= 0.001) return 1.0;
  float cell = uTerrT.x/1024.0; float res = 1.0; float t = cell*1.5; float bias = cell*(0.3 + 1.1*slope);
  for (int i = 0; i < 20; i++){
    vec3 q = p + L*t; if (q.y > uTerrT.y + 2.0) break;
    vec2 uv = q.xz/uTerrT.x + 0.5; if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
    float d = q.y + bias - texture2D(tHeightT, uv).r;
    res = min(res, 7.0*d/t + 0.6); if (res < 0.0) break;
    t *= 1.38;
  }
  return smoothstep(0.0, 1.0, res);
}
vec3 lyrA(sampler2D d, vec2 p, float s, float far){ vec3 a = texture2D(d, p*s).rgb; vec3 b = texture2D(d, p*s*0.137 + 0.31).rgb; vec3 c = texture2D(d, p*s*0.023 + 0.11).rgb; return mix(mix(a, b, 0.35 + 0.55*far), c, 0.25 + 0.3*far)*1.0; }
`;

export class Terrain {
  // layers: [{d, n, scale, rough, tint}] ×4.  rule: GLSL assigning vec4 lw from (h, slope, n1, n2, xz, wn)
  constructor(app, hf, { layers, rule, params = [0, 0, 0, 0], params2 = [0, 0, 0, 0], shadow = true, extra = '', emissive = null, normalStrength = 1, rings = 10, cell0 = 0.5, mask = null, post = '' }) {
    this.app = app; this.hf = hf; this.group = new THREE.Group();
    const N = this.N = Q.level >= 2 ? 96 : 64; this.cell0 = Q.level >= 2 ? cell0 : cell0 * 1.5;
    const mat = this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    const u = this.u = {
      tD0: { value: tex(layers[0].d, { srgb: true }) }, tD1: { value: tex(layers[1].d, { srgb: true }) }, tD2: { value: tex(layers[2].d, { srgb: true }) }, tD3: { value: tex(layers[3].d, { srgb: true }) },
      tN0: { value: tex(layers[0].n) }, tN1: { value: tex(layers[1].n) }, tN2: { value: tex(layers[2].n) }, tN3: { value: tex(layers[3].n) },
      uScale: { value: new THREE.Vector4(...layers.map((l) => 1 / l.scale)) }, uRoughL: { value: new THREE.Vector4(...layers.map((l) => l.rough ?? 0.9)) },
      uTint0: { value: new THREE.Color(...(layers[0].tint || [1, 1, 1])) }, uTint1: { value: new THREE.Color(...(layers[1].tint || [1, 1, 1])) }, uTint2: { value: new THREE.Color(...(layers[2].tint || [1, 1, 1])) }, uTint3: { value: new THREE.Color(...(layers[3].tint || [1, 1, 1])) },
      uP: { value: new THREE.Vector4(...params) }, uP2: { value: new THREE.Vector4(...params2) }, tHeightT: { value: hf.heightTex }, uTerrT: { value: new THREE.Vector4(hf.size, hf.maxH, shadow ? 1 : 0, normalStrength) },
    };
    if (emissive) u.tEm = { value: tex(emissive, { srgb: true }) };
    u.tMask = { value: mask || hf.heightTex }; u.tNrmT = { value: hf.normalTex };
    mat.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u, this.ringUniforms || {});
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWN; uniform vec4 uInner;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vWN = normal; if (abs(position.x - uInner.x) < uInner.z && abs(position.z - uInner.y) < uInner.z) transformed.y -= uInner.w;');
      s.fragmentShader = s.fragmentShader.replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\n' + TERR_PARS + (emissive ? 'uniform sampler2D tEm;\n' : '') + extra)
        .replace('#include <map_fragment>', /* glsl */`
  vec3 wn = normalize(vWN); vec3 wp = vWorldPosFog; vec2 xz = wp.xz; float h = wp.y;
  float dist = length(cameraPosition - wp); float far = smoothstep(30.0, 600.0, dist);
  // beyond the fine rings, take the surface normal from the baked field so distant relief stays smooth
  { vec3 nb = texture2D(tNrmT, xz/uTerrT.x + 0.5).xyz*2.0 - 1.0; wn = normalize(mix(wn, nb, smoothstep(uTerrT.x*0.012, uTerrT.x*0.05, dist))); }
  float slope = 1.0 - wn.y; gSlope = slope;
  float n1 = aFbm(xz*0.0031 + 4.0); float n2 = aFbm(xz*0.045); float n3 = aNoise(xz*0.5);
  vec4 lw = vec4(1.0, 0.0, 0.0, 0.0); gEmis = 0.0; vec4 mk = texture2D(tMask, xz/uTerrT.x + 0.5);
  ${rule}
  lw = max(lw, 0.0); lw /= (lw.x + lw.y + lw.z + lw.w + 1e-4);
  vec3 c0 = lyrA(tD0, xz, uScale.x, far)*uTint0, c2 = lyrA(tD2, xz, uScale.z, far)*uTint2, c3 = lyrA(tD3, xz, uScale.w, far)*uTint3;
  // cliffs use triplanar projection so strata do not stretch
  vec3 tw = pow(abs(wn), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);
  vec3 c1 = (lyrA(tD1, wp.zy, uScale.y, far)*tw.x + lyrA(tD1, xz, uScale.y, far)*tw.y + lyrA(tD1, wp.xy, uScale.y, far)*tw.z)*uTint1;
  // height-style blend: brighter texels win at the borders, giving ragged natural edges
  vec4 lum = vec4(dot(c0, vec3(0.33)), dot(c1, vec3(0.33)), dot(c2, vec3(0.33)), dot(c3, vec3(0.33)));
  vec4 bw = lw*(0.55 + lum*1.2 + n3*0.35); bw = pow(bw, vec4(2.2)); bw /= (bw.x + bw.y + bw.z + bw.w + 1e-5); lw = mix(bw, lw, far);
  vec3 alb = c0*lw.x + c1*lw.y + c2*lw.z + c3*lw.w;
  alb *= 0.78 + 0.42*n1; alb *= 0.9 + 0.2*n2;
  ${post}
  float nf = (1.0 - smoothstep(60.0, 420.0, dist))*uTerrT.w;
  vec3 t0 = texture2D(tN0, xz*uScale.x).xyz*2.0 - 1.0, t2 = texture2D(tN2, xz*uScale.z).xyz*2.0 - 1.0, t3 = texture2D(tN3, xz*uScale.w).xyz*2.0 - 1.0;
  vec3 t1y = texture2D(tN1, xz*uScale.y).xyz*2.0 - 1.0, t1x = texture2D(tN1, wp.zy*uScale.y).xyz*2.0 - 1.0, t1z = texture2D(tN1, wp.xy*uScale.y).xyz*2.0 - 1.0;
  vec2 top = t0.xy*lw.x + t2.xy*lw.z + t3.xy*lw.w + t1y.xy*lw.y*tw.y;
  vec3 n = wn + vec3(top.x, 0.0, top.y)*nf*1.3;
  n += (vec3(0.0, t1x.y, -t1x.x)*tw.x + vec3(t1z.x, t1z.y, 0.0)*tw.z)*lw.y*nf*1.3*vec3(1.0, 1.0, 1.0);
  // medium-scale relief that survives at distance
  float mr = aFbm(xz*0.09) - 0.5; n.xz += vec2(dFdx(mr), dFdy(mr))*0.0;
  gNrm = normalize(n);
  gRough = dot(uRoughL, lw);
  diffuseColor.rgb = alb;
  ${emissive ? 'vec3 emTex = texture2D(tEm, xz*uScale.w).rgb;' : ''}
`)
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = gRough;')
        .replace('#include <normal_fragment_maps>', 'normal = normalize((viewMatrix*vec4(gNrm, 0.0)).xyz);')
        .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace('cloudShade( vWorldPosFog )', 'cloudShade( vWorldPosFog ) * terrShadow( vWorldPosFog, gSlope )'))
        .replace('#include <emissivemap_fragment>', emissive ? 'totalEmissiveRadiance += emTex*gEmis;' : '');
      this.shader = s;
    };
    // rings
    this.rings = [];
    const V = N + 1;
    const idx = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * V + i, b = a + 1, c = a + V, d = c + 1; idx.push(a, c, b, b, c, d); }
    const index = new THREE.BufferAttribute(new Uint32Array(idx), 1);
    let cell = this.cell0;
    for (let k = 0; k < rings; k++) {
      if (k > 0 && N * cell > hf.size * 1.2) break;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(V * V * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(V * V * 3), 3)); g.setIndex(index);
      const m = mat.clone(); m.onBeforeCompile = mat.onBeforeCompile; const inner = { value: new THREE.Vector4(0, 0, -1, 0) };
      const ob = mat.onBeforeCompile; m.onBeforeCompile = (s) => { ob(s); s.uniforms.uInner = inner; };
      m.customProgramCacheKey = () => 'terrain' + (emissive ? 'e' : '') + rule.length + ':' + post.length;
      m.polygonOffset = k > 0; m.polygonOffsetFactor = k * 0.6; m.polygonOffsetUnits = k * 2;
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.castShadow = false; mesh.matrixAutoUpdate = false;
      this.group.add(mesh);
      this.rings.push({ k, cell, mesh, inner, cx: 1e9, cz: 1e9, built: false, H: new Float32Array((V + 2) * (V + 2)) });
      cell *= 2;
    }
    this._q = [];
  }
  _build(r, cx, cz) {
    const N = this.N, V = N + 1, W = V + 2, c = r.cell, hf = this.hf, H = r.H; const x0 = cx - N / 2 * c - c, z0 = cz - N / 2 * c - c;
    const fine = r.k < 6;
    for (let j = 0; j < W; j++) { const z = z0 + j * c; for (let i = 0; i < W; i++) H[j * W + i] = fine ? hf.heightAt(x0 + i * c, z) : hf.macro(x0 + i * c, z); }
    const P = r.mesh.geometry.attributes.position.array, Nn = r.mesh.geometry.attributes.normal.array; let o = 0;
    for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
      const k = (j + 1) * W + i + 1; P[o] = x0 + (i + 1) * c; P[o + 1] = H[k]; P[o + 2] = z0 + (j + 1) * c;
      const nx = H[k - 1] - H[k + 1], nz = H[k - W] - H[k + W], ny = 2 * c, l = 1 / Math.hypot(nx, ny, nz); Nn[o] = nx * l; Nn[o + 1] = ny * l; Nn[o + 2] = nz * l; o += 3;
    }
    r.mesh.geometry.attributes.position.needsUpdate = true; r.mesh.geometry.attributes.normal.needsUpdate = true;
    r.cx = cx; r.cz = cz; r.built = true;
  }
  update(camPos, budget = 2) {
    let done = 0; const N = this.N;
    // coarse rings first so there is never a hole
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i], snap = r.cell * 2; const cx = Math.round(camPos.x / snap) * snap, cz = Math.round(camPos.z / snap) * snap;
      if (!r.built) { this._build(r, cx, cz); continue; }
      if ((cx !== r.cx || cz !== r.cz) && done < budget) { this._build(r, cx, cz); done++; }
    }
    for (let i = 1; i < this.rings.length; i++) {
      const r = this.rings[i], f = this.rings[i - 1];
      r.inner.value.set(f.cx, f.cz, (N / 2) * f.cell - r.cell * 1.01, r.cell * 3 + 2);
    }
  }
  dispose() { for (const r of this.rings) { r.mesh.geometry.dispose(); r.mesh.material.dispose(); } }
}

// bake a low-resolution mask (RGBA8) the terrain shader can read as `mk`
export function makeMask(size, res, fn) {
  const d = new Uint8Array(res * res * 4), o = [0, 0, 0, 0]; const cell = size / (res - 1);
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) { fn(-size / 2 + i * cell, -size / 2 + j * cell, o); const k = (j * res + i) * 4; d[k] = clamp(o[0]) * 255; d[k + 1] = clamp(o[1]) * 255; d[k + 2] = clamp(o[2]) * 255; d[k + 3] = clamp(o[3]) * 255; }
  const t = new THREE.DataTexture(d, res, res); t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t;
}
