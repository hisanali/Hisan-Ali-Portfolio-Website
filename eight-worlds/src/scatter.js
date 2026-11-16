// Vegetation and object scattering: deterministic per-cell placement streamed around the camera,
// full tree meshes nearby, baked impostors to the horizon, wind animation, grass, and triplanar rock materials.
import * as THREE from 'three';
import { clamp, lerp, smooth, rng, hash2, simplex2, fbm, tex, texD, loadTree, atmoUniform, ATMO_GLSL, A, Q, texturesReady } from './core.js';

// ---------- shared shader patches ----------
const WIND_VERT = (stiff, flutter, fade) => /* glsl */`
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
  vec3 root_ = instanceMatrix[3].xyz;
#else
  vec3 root_ = vec3(0.0);
#endif
{
  float hgt_ = max(mvPosition.y - root_.y, 0.0); float ph_ = root_.x*0.13 + root_.z*0.17;
  float w_ = uA[4].z, t_ = uA[1].w;
  float sway_ = sin(t_*1.1 + ph_) + 0.5*sin(t_*2.3 + ph_*1.7);
  float bend_ = hgt_*hgt_*${stiff.toFixed(5)};
  mvPosition.xz += uA[4].xy*bend_*(1.3*w_ + sway_*(0.25 + 0.5*w_));
  float rad_ = length(transformed.xz);
  float fl_ = sin(t_*(3.0 + w_*5.0) + mvPosition.x*1.3 + mvPosition.y*2.1 + mvPosition.z*1.7 + ph_)*${flutter.toFixed(4)}*(0.2 + w_)*min(rad_*0.25 + hgt_*0.02, 1.5);
  mvPosition.xyz += vec3(fl_, fl_*0.45, fl_*0.7);
}
${fade ? 'vFadeD = length(mvPosition.xyz - cameraPosition);' : ''}
mvPosition = viewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;
export function windPatch(mat, { stiff = 0.0006, flutter = 0.05, fadeOut = 0, fadeIn = 0, translucent = 0, depth = false } = {}) {
  const prev = mat.onBeforeCompile; const fade = fadeOut > 0 || fadeIn > 0;
  mat.onBeforeCompile = (s, r) => {
    prev?.(s, r); s.uniforms.uA = atmoUniform;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform vec4 uA[8];' + (fade ? '\nvarying float vFadeD;' : '')).replace('#include <project_vertex>', WIND_VERT(stiff, flutter, fade));
    if (fade) s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFadeD;').replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      { float dn_ = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
        ${fadeOut > 0 ? `if (vFadeD > ${(fadeOut * 0.86).toFixed(1)} + dn_*${(fadeOut * 0.14).toFixed(1)}) discard;` : ''}
        ${fadeIn > 0 ? `if (vFadeD < ${(fadeIn * 0.86).toFixed(1)} + dn_*${(fadeIn * 0.14).toFixed(1)}) discard;` : ''} }`);
    if (translucent && !depth) s.fragmentShader = s.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      { vec3 Ls_ = normalize((viewMatrix*vec4(uA[0].xyz, 0.0)).xyz); vec3 Vs_ = normalize(vViewPosition);
        float tr_ = pow(max(dot(-Vs_, Ls_), 0.0), 2.0)*0.75 + max(dot(-normal, Ls_), 0.0)*0.35;
        reflectedLight.directDiffuse += diffuseColor.rgb*vec3(1.1, 1.25, 0.6)*uA[1].rgb*uA[0].w*tr_*${translucent.toFixed(3)}*cloudShade(vWorldPosFog); }`);
  };
  mat.customProgramCacheKey = () => ['w', stiff, flutter, fadeOut, fadeIn, translucent, depth].join();
  return mat;
}

// Triplanar albedo with derivative bump; optional second material on upward faces (moss, lichen, sand, snow).
export function triMat({ d, scale = 2, tint = [1, 1, 1], rough = 0.9, bump = 1.2, top = null, topAmt = 0.6, topTint = [1, 1, 1], topScale = 1.5, world = false, emissive = null, emissiveK = 1, extra = {}, vertexColors = false, wet = null }) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: 0, vertexColors, ...extra });
  const u = { tTriD: { value: texD(d) }, uTri: { value: new THREE.Vector4(1 / scale, bump, topAmt, 1 / topScale) }, uTriTint: { value: new THREE.Color(...tint) }, uTopTint: { value: new THREE.Color(...topTint) } };
  if (top) u.tTriTop = { value: texD(top) }; if (emissive) u.tTriE = { value: texD(emissive) };
  m.userData.tri = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; varying vec3 vWNt;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        ${world ? `
        #ifdef USE_INSTANCING
          vOP = (modelMatrix*instanceMatrix*vec4(position, 1.0)).xyz; vON = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
        #else
          vOP = (modelMatrix*vec4(position, 1.0)).xyz; vON = normalize(mat3(modelMatrix)*normal);
        #endif` : 'vOP = position; vON = normal;'}
        #ifdef USE_INSTANCING
          vWNt = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
        #else
          vWNt = normalize(mat3(modelMatrix)*normal);
        #endif`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vOP; varying vec3 vON; varying vec3 vWNt; uniform sampler2D tTriD; uniform vec4 uTri; uniform vec3 uTriTint, uTopTint; ${top ? 'uniform sampler2D tTriTop;' : ''} ${emissive ? 'uniform sampler2D tTriE;' : ''}
      float triH; vec3 triE;
      vec3 triS(sampler2D t, vec3 p, vec3 w){ return texture2D(t, p.zy).rgb*w.x + texture2D(t, p.xz).rgb*w.y + texture2D(t, p.xy).rgb*w.z; }`)
      .replace('#include <map_fragment>', `
        vec3 tw_ = pow(abs(normalize(vON)), vec3(4.0)); tw_ /= (tw_.x + tw_.y + tw_.z);
        vec3 ta_ = triS(tTriD, vOP*uTri.x, tw_); ta_ = mix(ta_, triS(tTriD, vOP*uTri.x*0.23 + 0.37, tw_), 0.35);
        triH = dot(ta_, vec3(0.333)); ta_ *= uTriTint;
        ${top ? `float tp_ = smoothstep(0.35, 0.8, vWNt.y + (triH - 0.3)*0.9 + uTri.z - 0.6)*step(0.001, uTri.z);
        vec3 tt_ = triS(tTriTop, vOP*uTri.w, tw_)*uTopTint; triH = mix(triH, dot(tt_, vec3(0.333))*0.5 + 0.2, tp_); ta_ = mix(ta_, tt_, tp_);` : ''}
        ${emissive ? 'triE = triS(tTriE, vOP*uTri.x, tw_);' : ''}
        diffuseColor.rgb *= ta_;`)
      .replace('#include <normal_fragment_maps>', `
        { vec2 dH_ = vec2(dFdx(triH), dFdy(triH))*uTri.y*2.0; vec3 sx_ = dFdx(-vViewPosition), sy_ = dFdy(-vViewPosition);
          vec3 r1_ = cross(sy_, normal), r2_ = cross(normal, sx_); float det_ = dot(sx_, r1_);
          normal = normalize(abs(det_)*normal - sign(det_)*(dH_.x*r1_ + dH_.y*r2_)); }`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = clamp(roughness*(1.12 - triH*0.35), 0.05, 1.0);`)
      .replace('#include <emissivemap_fragment>', emissive ? `totalEmissiveRadiance += triE*${emissiveK.toFixed(2)};` : '');
  };
  m.customProgramCacheKey = () => ['tri', d, top || '', world, emissive || '', emissiveK].join();
  return m;
}

// displaced icosphere boulders
export function rockGeo(seed = 1, detail = 3, flat = 0.7, jag = 0.35) {
  const g = new THREE.IcosahedronGeometry(1, detail); const p = g.attributes.position; const s = seed * 17.3;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = simplex2(x * 1.1 + s, y * 1.1 + z * 0.9) * 0.5 + simplex2(x * 2.3 + z * 1.7, y * 2.3 - s) * 0.25 + simplex2(x * 5.1 - s, z * 5.1 + y * 4.0) * 0.1;
    let k = 1 + n * jag; // facet: clamp against a few random planes for a broken look
    x *= k; y *= k * flat; z *= k; if (y < -0.35 * flat) y = -0.35 * flat + (y + 0.35 * flat) * 0.25;
    p.setXYZ(i, x, y, z); }
  // merge duplicated verts so normals are smooth, then recompute
  g.deleteAttribute('uv'); g.deleteAttribute('normal'); const m = toIndexed(g); m.computeVertexNormals(); return m;
}
function toIndexed(g) {
  const p = g.attributes.position, map = new Map(), pos = [], idx = [];
  for (let i = 0; i < p.count; i++) { const k = Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4); let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(p.getX(i), p.getY(i), p.getZ(i)); } idx.push(j); }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setIndex(idx); return o;
}

// grass tuft: a handful of tapered, curved blades with a baked root-to-tip gradient
export function tuftGeo(blades = 12, h = 0.55, seed = 3) {
  const r = rng(seed), pos = [], col = [], nor = [], uv = [], idx = [];
  for (let b = 0; b < blades; b++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 0.22, ox = Math.cos(a) * d, oz = Math.sin(a) * d, ya = r() * 6.283, lean = 0.1 + r() * 0.55, hh = h * (0.45 + r() * 0.85), w = 0.007 + r() * 0.008; const SEG = 3, base = pos.length / 3;
    const cx = Math.cos(ya), sx = Math.sin(ya); const dry = r() < 0.18 ? 1 : 0;
    for (let s = 0; s <= SEG; s++) { const t = s / SEG; const bend = lean * t * t * hh; const ww = w * (1 - t * 0.9);
      for (const sd of [-1, 1]) { pos.push(ox + cx * bend + -sx * ww * sd, t * hh * (1 - lean * 0.25 * t), oz + sx * bend + cx * ww * sd); nor.push(cx * 0.3, 0.95, sx * 0.3); const g = 0.3 + 0.7 * t; col.push(g * (1 + dry * 0.9), g * (1 + dry * 0.35), g * (1 - dry * 0.2)); uv.push(sd * 0.5 + 0.5, t); } }
    for (let s = 0; s < SEG; s++) { const k = base + s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler(), _n = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

// A streamed layer of instanced parts. place(x, z, h, slope, rnd) → probability 0..1 (or false).
export class Layer {
  constructor(hf, o) {
    this.hf = hf; this.o = Object.assign({ cell: 32, radius: 120, perCell: 10, cap: 4000, scale: [0.8, 1.2], yOff: 0, align: 0, tilt: 0, cast: true, receive: true, seed: 1, scaleY: null, minScaleFade: 0 }, o);
    this.cells = new Map(); this.group = new THREE.Group(); this.meshes = [];
    for (const p of this.o.parts) { const m = new THREE.InstancedMesh(p.geo, p.mat, this.o.cap); m.count = 0; m.frustumCulled = false; m.castShadow = this.o.cast && p.cast !== false; m.receiveShadow = this.o.receive; if (p.depthMat) m.customDepthMaterial = p.depthMat; m.matrixAutoUpdate = false; if (p.noReflect) m.userData.noReflect = true; this.meshes.push(m); this.group.add(m); }
    this.cx = 1e9; this.cz = 1e9; this.items = [];
  }
  _cell(ix, iz) {
    const key = ix * 73856093 ^ iz * 19349663; let c = this.cells.get(key); if (c) return c;
    const o = this.o, r = rng((hash2(ix, iz, o.seed) * 4294967296) >>> 0), hf = this.hf; c = [];
    const n = o.perCell; const C = o.cell;
    for (let i = 0; i < n; i++) {
      const x = (ix + r()) * C, z = (iz + r()) * C, pr = r(), sc = lerp(o.scale[0], o.scale[1], r() * r()), rot = r() * 6.283, tl = r(), tl2 = r();
      const h = hf ? hf.heightAt(x, z) : 0, sl = hf ? hf.slope(x, z) : 0;
      const pp = o.place(x, z, h, sl, pr); if (!pp || pr > pp) continue;
      c.push(x, h + o.yOff * sc, z, sc, rot, tl, tl2, sl);
    }
    if (this.cells.size > 9000) this.cells.clear(); this.cells.set(key, c); return c;
  }
  update(cam, force = false) {
    const o = this.o, C = o.cell; const ix0 = Math.floor(cam.x / C), iz0 = Math.floor(cam.z / C);
    if (!force && ix0 === this.cx && iz0 === this.cz) return false; this.cx = ix0; this.cz = iz0;
    const R = Math.ceil(o.radius / C); let n = 0; const cap = o.cap, M = this.meshes[0].instanceMatrix.array; this.items.length = 0;
    outer: for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dz * dz > (R + 0.7) * (R + 0.7)) continue; const c = this._cell(ix0 + dx, iz0 + dz);
      for (let i = 0; i < c.length; i += 8) {
        if (n >= cap) break outer; const sc = c[i + 3];
        _e.set((c[i + 5] - 0.5) * o.tilt, c[i + 4], (c[i + 6] - 0.5) * o.tilt, 'YXZ'); _q.setFromEuler(_e);
        if (o.align > 0 && this.hf) { this.hf.normalAt(c[i], c[i + 2], _n, 1.0); _n.lerp(_up, 1 - o.align).normalize(); _q.premultiply(_QA.setFromUnitVectors(_up, _n)); }
        _s.set(sc, o.scaleY ? sc * o.scaleY : sc, sc); _p.set(c[i], c[i + 1], c[i + 2]); _m.compose(_p, _q, _s); _m.toArray(M, n * 16); n++;
        if (o.collide) this.items.push(c[i], c[i + 2], o.collide * sc, c[i + 1]);
      }
    }
    for (let k = 0; k < this.meshes.length; k++) { const m = this.meshes[k]; if (k > 0) m.instanceMatrix.array.set(M.subarray(0, n * 16)); m.count = n; m.instanceMatrix.needsUpdate = true; }
    return true;
  }
  dispose() { for (const m of this.meshes) m.dispose(); }
}
const _QA = new THREE.Quaternion();

// ---------- trees ----------
const IMP_VERT = /* glsl */`
attribute vec2 corner; attribute vec4 iA; attribute vec4 iB; // iA: pos.xyz, height   iB: width, atlas col, atlas row, phase
uniform vec4 uA[8]; uniform float uNear; uniform vec2 uGrid;
varying vec2 vUv; varying vec3 vW; varying float vD; varying vec3 vNrm; varying float vV;
void main(){
  vec3 root = iA.xyz; vec3 toC = cameraPosition - root; float d = length(toC);
  vec3 fw = normalize(vec3(toC.x, 0.0, toC.z) + vec3(1e-4, 0.0, 0.0)); vec3 right = vec3(fw.z, 0.0, -fw.x);
  // lean the card toward a camera that looks down on it, so canopies do not vanish from above
  float tilt = clamp(toC.y/max(d, 1.0), 0.0, 0.85); vec3 up = normalize(vec3(0.0, 1.0, 0.0) + fw*tilt*0.9);
  float sway = (sin(uA[1].w*1.1 + iB.w) + 0.5*sin(uA[1].w*2.3 + iB.w*1.7))*uA[4].z*0.012*iA.w*corner.y*corner.y;
  vec3 p = root + right*corner.x*iB.x + up*corner.y*iA.w + vec3(uA[4].x, 0.0, uA[4].y)*sway;
  vUv = (vec2(corner.x + 0.5, corner.y) + iB.yz)*uGrid; vW = p; vD = d; vV = corner.y;
  vNrm = normalize(right*corner.x*1.6 + fw*0.7 + vec3(0.0, 0.25 + corner.y*0.6, 0.0));
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`;
const IMP_FRAG = /* glsl */`
precision highp float; ${ATMO_GLSL}
uniform sampler2D tAtlas; uniform float uNear;
varying vec2 vUv; varying vec3 vW; varying float vD; varying vec3 vNrm; varying float vV;
void main(){
  vec4 t = texture2D(tAtlas, vUv); if (t.a < 0.42) discard;
  float dn = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (vD < uNear*(0.86 + 0.14*dn)) discard;
  vec3 alb = t.rgb/max(t.a, 0.5);
  vec3 L = uA[0].xyz; float nl = dot(normalize(vNrm), L)*0.5 + 0.5;
  vec3 light = uA[2].rgb*(0.75 + 0.55*vV)*1.5 + uA[1].rgb*uA[0].w*(nl*nl*0.4 + 0.08)*cloudShade(vW)*(0.5 + 0.5*vV);
  float sn = smoothstep(0.25, 0.7, uA[3].w)*smoothstep(0.2, 0.9, vV + (alb.g - 0.2))*0.75; alb = mix(alb, vec3(0.82, 0.86, 0.92), sn);
  alb *= mix(1.0, 0.62, uA[3].z);
  vec3 c = applyAtmo(alb*light, vW, cameraPosition);
  gl_FragColor = vec4(c, 1.0);
}`;

export class Forest {
  // variants: [{model, scale:[a,b], weight}], density(x,z,h,slope) → 0..1 acceptance, perCell candidates
  constructor(app, hf, o) { this.app = app; this.hf = hf; this.o = Object.assign({ cell: 40, near: 130, far: 1500, perCell: 14, seed: 5, capNear: 260, capFar: 60000, unit: 0.22 }, o); if (Q.level < 2) { this.o.near *= 0.6; this.o.far *= Q.level === 0 ? 0.45 : 0.75; } this.group = new THREE.Group(); this.cells = new Map(); this.cx = 1e9; this.cz = 1e9; this.fx = 1e9; this.fz = 1e9; this.trunks = []; this.ready = false; }
  async init() {
    const o = this.o; const vs = this.variants = [];
    const tw = o.variants.reduce((s, v) => s + (v.weight ?? 1), 0); let acc = 0;
    for (const v of o.variants) { const t = await loadTree(v.model); acc += (v.weight ?? 1) / tw; vs.push({ ...v, tree: t, cum: acc }); }
    const barkMats = {}, leafMats = {};
    const nearR = o.near;
    for (const v of vs) {
      const t = v.tree; const U = o.unit;
      if (!barkMats[t.bark]) { const m = new THREE.MeshStandardMaterial({ map: texD(`bark_${t.bark}_d.jpg`), normalMap: tex(`bark_${t.bark}_n.jpg`), roughness: 0.92, color: v.barkTint || 0xffffff }); windPatch(m, { stiff: 0.00035 / U, flutter: 0.012, fadeOut: nearR }); barkMats[t.bark] = m; const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); windPatch(dm, { stiff: 0.00035 / U, flutter: 0.012, depth: true }); barkMats[t.bark + '_d'] = dm; }
      const lk = t.leaf + (v.leafTint || '');
      if (!leafMats[lk]) { const map = texD(`leaf_${t.leaf}.png`); const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.9, envMapIntensity: 0.45, color: new THREE.Color(v.leafTint || 0xffffff).multiply(new THREE.Color(0.62, 0.74, 0.5)), alphaToCoverage: Q.level >= 2 }); windPatch(m, { stiff: 0.00035 / U, flutter: 0.3, fadeOut: nearR, translucent: 0.3 }); leafMats[lk] = m; const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.42, side: THREE.DoubleSide }); windPatch(dm, { stiff: 0.00035 / U, flutter: 0.3, depth: true }); leafMats[lk + '_d'] = dm; }
      // soften foliage shading: normals radiate from the crown
      if (!t.leaves.userData.sph) { const p = t.leaves.attributes.position, n = t.leaves.attributes.normal; const cy = t.height * 0.55; for (let i = 0; i < p.count; i++) { _n.set(p.getX(i), (p.getY(i) - cy) * 0.8 + t.height * 0.12, p.getZ(i)).normalize(); n.setXYZ(i, _n.x, _n.y, _n.z); } t.leaves.userData.sph = true; t.branches.userData.shared = t.leaves.userData.shared = true; }
      v.bm = new THREE.InstancedMesh(t.branches, barkMats[t.bark], o.capNear); v.bm.customDepthMaterial = barkMats[t.bark + '_d'];
      v.lm = v.noLeaves ? null : new THREE.InstancedMesh(t.leaves, leafMats[lk], o.capNear); if (v.lm) v.lm.customDepthMaterial = leafMats[lk + '_d'];
      for (const m of [v.bm, v.lm]) if (m) { m.count = 0; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; this.group.add(m); }
      v.n = 0;
    }
    await texturesReady(); this._bake(barkMats, leafMats);
    // impostor buffers
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0.5, 0, 0.5, 1, -0.5, 1]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    this.iA = new THREE.InstancedBufferAttribute(new Float32Array(o.capFar * 4), 4); this.iB = new THREE.InstancedBufferAttribute(new Float32Array(o.capFar * 4), 4); g.setAttribute('iA', this.iA); g.setAttribute('iB', this.iB); g.instanceCount = 0;
    this.impMat = new THREE.ShaderMaterial({ uniforms: { tAtlas: { value: this.atlas.texture }, uNear: { value: nearR }, uGrid: { value: new THREE.Vector2(1 / this.grid, 1 / this.grid) }, uA: atmoUniform }, vertexShader: IMP_VERT, fragmentShader: IMP_FRAG, side: THREE.DoubleSide });
    this.imp = new THREE.Mesh(g, this.impMat); this.imp.frustumCulled = false; this.group.add(this.imp);
    this.ready = true;
  }
  _bake(barkMats, leafMats) { // render each variant once, side-on, into an atlas
    const r = this.app.renderer, vs = this.variants; const grid = this.grid = Math.ceil(Math.sqrt(vs.length)); const cellPx = Q.level >= 2 ? 384 : 256;
    const rt = this.atlas = new THREE.WebGLRenderTarget(grid * cellPx, grid * cellPx, { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true, colorSpace: THREE.NoColorSpace });
    rt.texture.anisotropy = 4;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x3a3f36, 2.6)); const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(0.4, 1, 0.8); sc.add(dl);
    const prev = r.getRenderTarget(), pc = r.getClearColor(new THREE.Color()), pa = r.getClearAlpha(); r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear();
    const cam = new THREE.OrthographicCamera();
    vs.forEach((v, i) => {
      const t = v.tree; const h = t.height * 1.02, w = Math.max(t.radius * 2.1, h * 0.3); v.aspect = w / h; v.col = i % grid; v.row = Math.floor(i / grid);
      const bm = new THREE.Mesh(t.branches, new THREE.MeshLambertMaterial({ map: barkMats[t.bark].map, color: v.barkTint || 0xffffff, fog: false })); const grp = new THREE.Group(); grp.add(bm);
      if (!v.noLeaves) grp.add(new THREE.Mesh(t.leaves, new THREE.MeshLambertMaterial({ map: leafMats[t.leaf + (v.leafTint || '')].map, alphaTest: 0.42, side: THREE.DoubleSide, color: new THREE.Color(v.leafTint || 0xffffff).multiply(new THREE.Color(0.62, 0.74, 0.5)), fog: false })));
      sc.add(grp); cam.left = -w / 2; cam.right = w / 2; cam.bottom = 0; cam.top = h; cam.near = 0.1; cam.far = 1000; cam.position.set(0, 0, 400); cam.lookAt(0, 0, 0); cam.position.set(0, 0, 400); cam.rotation.set(0, 0, 0); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      r.setViewport(v.col * cellPx, v.row * cellPx, cellPx, cellPx); r.setScissor(v.col * cellPx, v.row * cellPx, cellPx, cellPx); r.setScissorTest(true); r.render(sc, cam); sc.remove(grp);
      for (const c of grp.children) c.material.dispose();
    });
    r.setScissorTest(false); r.setRenderTarget(prev); r.setClearColor(pc, pa); const s = r.getSize(new THREE.Vector2()); r.setViewport(0, 0, s.x, s.y);
  }
  _cell(ix, iz) {
    const key = ix * 73856093 ^ iz * 19349663; let c = this.cells.get(key); if (c) return c;
    const o = this.o, r = rng((hash2(ix, iz, o.seed) * 4294967296) >>> 0), hf = this.hf, vs = this.variants; c = [];
    for (let i = 0; i < o.perCell; i++) {
      const x = (ix + r()) * o.cell, z = (iz + r()) * o.cell, pr = r(), pick = r(), s = r(), rot = r() * 6.283;
      const h = hf.heightAt(x, z), sl = hf.slope(x, z); const d = o.density(x, z, h, sl); if (!(pr < d)) continue;
      let vi = 0; const pk = o.pick ? o.pick(x, z, h, sl, pick) : pick; while (vi < vs.length - 1 && pk > vs[vi].cum) vi++;
      const v = vs[vi]; const sc = lerp(v.scale[0], v.scale[1], s) * o.unit;
      c.push(x, h - 0.15, z, sc, rot, vi);
    }
    if (this.cells.size > 20000) this.cells.clear(); this.cells.set(key, c); return c;
  }
  update(cam) {
    if (!this.ready) return; const o = this.o, C = o.cell, vs = this.variants;
    const ix0 = Math.floor(cam.x / C), iz0 = Math.floor(cam.z / C);
    if (ix0 !== this.cx || iz0 !== this.cz) { // near meshes
      this.cx = ix0; this.cz = iz0; const R = Math.ceil((o.near + C * 0.5) / C); for (const v of vs) v.n = 0; this.trunks.length = 0;
      for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const c = this._cell(ix0 + dx, iz0 + dz);
        for (let i = 0; i < c.length; i += 6) { const v = vs[c[i + 5]]; if (v.n >= o.capNear) continue; _q.setFromAxisAngle(_up, c[i + 4]); _s.setScalar(c[i + 3]); _p.set(c[i], c[i + 1], c[i + 2]); _m.compose(_p, _q, _s); _m.toArray(v.bm.instanceMatrix.array, v.n * 16); if (v.lm) _m.toArray(v.lm.instanceMatrix.array, v.n * 16); v.n++;
          this.trunks.push(c[i], c[i + 2], c[i + 3] * (v.trunk ?? 1.6), c[i + 1] + v.tree.height * c[i + 3] * 0.45); } }
      for (const v of vs) { v.bm.count = v.n; v.bm.instanceMatrix.needsUpdate = true; if (v.lm) { v.lm.count = v.n; v.lm.instanceMatrix.needsUpdate = true; } }
    }
    const FC = 4; const fx0 = Math.floor(ix0 / FC), fz0 = Math.floor(iz0 / FC);
    if (fx0 !== this.fx || fz0 !== this.fz) { // impostors, refreshed on a coarser grid
      this.fx = fx0; this.fz = fz0; const R = Math.ceil(o.far / C); let n = 0; const Aa = this.iA.array, Bb = this.iB.array, cap = o.capFar; const cxm = (fx0 + 0.5) * FC, czm = (fz0 + 0.5) * FC;
      outer: for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { if (dx * dx + dz * dz > R * R) continue; const c = this._cell(Math.floor(cxm) + dx, Math.floor(czm) + dz);
        for (let i = 0; i < c.length; i += 6) { if (n >= cap) break outer; const v = vs[c[i + 5]], sc = c[i + 3], hh = v.tree.height * 1.02 * sc; Aa[n * 4] = c[i]; Aa[n * 4 + 1] = c[i + 1]; Aa[n * 4 + 2] = c[i + 2]; Aa[n * 4 + 3] = hh; Bb[n * 4] = hh * v.aspect; Bb[n * 4 + 1] = v.col; Bb[n * 4 + 2] = v.row; Bb[n * 4 + 3] = c[i + 4] * 3; n++; } }
      this.iA.needsUpdate = this.iB.needsUpdate = true; this.imp.geometry.instanceCount = n; this.count = n;
    }
  }
  collide(p, rad) { const t = this.trunks; for (let i = 0; i < t.length; i += 4) { if (p.y > t[i + 3]) continue; const dx = p.x - t[i], dz = p.z - t[i + 1], rr = t[i + 2] + rad; const d2 = dx * dx + dz * dz; if (d2 < rr * rr && d2 > 1e-6) { const k = rr / Math.sqrt(d2); p.x = t[i] + dx * k; p.z = t[i + 1] + dz * k; } } }
  dispose() { for (const v of this.variants || []) { v.bm.dispose(); v.lm?.dispose(); } this.atlas?.dispose(); this.imp?.geometry.dispose(); }
}

// grass layer with wind and distance fade
export function grassLayer(hf, { tint = [0.45, 0.6, 0.22], radius = 48, density = 5, h = 0.5, place, seed = 9 }) {
  const k = Q.level >= 2 ? 1 : Q.level === 1 ? 0.6 : 0.3; radius *= Q.level >= 2 ? 1 : 0.75;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, color: new THREE.Color(...tint.map((v) => Math.pow(v, 2.2) * 1.5)), roughness: 0.85, side: THREE.DoubleSide });
  mat.defines = Object.assign(mat.defines || {}, { NO_SNOW: 1 });
  windPatch(mat, { stiff: 0.22, flutter: 0.0, fadeOut: radius, translucent: 0.12 });
  const cell = 8; const perCell = Math.round(cell * cell * density * k);
  return new Layer(hf, { parts: [{ geo: tuftGeo(Q.level >= 2 ? 14 : Q.level === 1 ? 11 : 8, h), mat, cast: false }], cell, radius, perCell, cap: Math.ceil(Math.PI * radius * radius * density * k * 1.15), scale: [0.7, 1.5], place, cast: false, seed, align: 0.6 });
}
