// Ocean / water surface: Gerstner wave field (shared by GPU and CPU), foam, wake, shoreline, planar reflection.
import * as THREE from 'three';
import { clamp, lerp, smooth, damp, rng, A, atmoUniform, ATMO_GLSL, tex, Q, simplex2 } from './core.js';

const NW = 22;      // total waves (fragment normals)
const NV = 14;      // waves used for vertex displacement
const G = 9.81;

function foamTexture() {
  const S = 256, data = new Uint8Array(S * S * 4), r = rng(77);
  const mk = (p) => { const t = new Float32Array(p * p * 2); for (let i = 0; i < t.length; i++) t[i] = r(); return t; };
  const T8 = mk(8), T20 = mk(20), T48 = mk(48);
  const wor = (x, y, p, T) => { x *= p; y *= p; const xi = Math.floor(x), yi = Math.floor(y); let m1 = 9, m2 = 9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const cx = xi + dx, cy = yi + dy; const k = ((((cy % p) + p) % p) * p + (((cx % p) + p) % p)) * 2;
      const fx = cx + T[k] - x, fy = cy + T[k + 1] - y, d = fx * fx + fy * fy; if (d < m1) { m2 = m1; m1 = d; } else if (d < m2) m2 = d; }
    return Math.sqrt(m2) - Math.sqrt(m1); };
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const x = i / S, y = j / S;
    const e1 = wor(x, y, 8, T8), e2 = wor(x, y, 20, T20), e3 = wor(x, y, 48, T48);
    const lace = clamp(1 - e1 * 3.2) * 0.55 + clamp(1 - e2 * 3.5) * 0.35 + clamp(1 - e3 * 4) * 0.25; // bright along cell edges
    const k = (j * S + i) * 4; data[k] = clamp(lace) * 255; data[k + 1] = clamp(1 - e2 * 2.4) * 255; data[k + 2] = clamp(e3 * 2.5) * 255; data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, S, S); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
let _foam = null;

const WAVES_GLSL = /* glsl */`
uniform vec4 uWA[${NW}];  // dir.x, dir.z, k, amplitude
uniform vec4 uWB[${NW}];  // omega, phase, chop, wavelength
uniform float uTime; uniform vec2 uOrigin;
`;

const VERT = /* glsl */`
${WAVES_GLSL}
uniform vec3 uCenter; uniform float uLevel;
varying vec3 vWorld; varying vec2 vRest; varying float vCrest;
void main(){
  float rr = position.x; float th = position.y;
  vec2 rest = uCenter.xz + vec2(cos(th), sin(th))*rr;
  float spacing = max(rr*0.028, 0.3);
  vec3 p = vec3(rest.x, uLevel, rest.y); vec2 w = rest + uOrigin; float jac = 0.0;
  for (int i = 0; i < ${NV}; i++){
    vec4 a = uWA[i], b = uWB[i];
    float lod = smoothstep(1.6, 4.5, b.w/spacing);
    float ph = a.z*dot(a.xy, w) - b.x*uTime + b.y;
    float s = sin(ph), c = cos(ph); float am = a.w*lod;
    p.xz -= a.xy*(b.z*am*s); p.y += am*c; jac += b.z*am*a.z*c;
  }
  vCrest = jac; vRest = rest; vWorld = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const FRAG = /* glsl */`
precision highp float;
${WAVES_GLSL}
${ATMO_GLSL}
uniform samplerCube tSky; uniform sampler2D tNormal, tFoam, tWake, tHeight, tPlanar, tBed;
uniform vec3 uDeep, uScatter, uBedTint; uniform vec4 uWake; // center.xz, size, on
uniform vec4 uTerr; // origin.xz, size, on
uniform vec4 uOpt;  // foam amount, clarity, planar strength, roughness add
uniform mat4 uPlanarM; uniform float uLevel, uChop, uShoreAmp, uTurb;
varying vec3 vWorld; varying vec2 vRest; varying float vCrest;
float terrH(vec2 p){ vec2 uv = (p - uTerr.xy)/uTerr.z + 0.5; if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return -200.0; return texture2D(tHeight, uv).r; }
float ripple(vec2 p, float t){
  vec2 c = floor(p), f = fract(p) - 0.5; float h = aHash(c);
  float ph = fract(t*1.3 + h*7.0); vec2 o = (vec2(aHash(c + 3.7), aHash(c + 9.1)) - 0.5)*0.5; float d = length(f - o);
  return sin((d - ph*0.42)*52.0)*smoothstep(0.42*ph + 0.05, 0.42*ph, d)*smoothstep(0.42*ph - 0.12, 0.42*ph, d)*(1.0 - ph);
}
void main(){
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv/dist;
  vec2 w = vRest + uOrigin; float fw = max(length(fwidth(vRest)), 1e-4);
  // analytic normal from the full wave set
  vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0); float jac = 0.0, hgt = 0.0;
  for (int i = 0; i < ${NW}; i++){
    vec4 a = uWA[i], b = uWB[i];
    float lod = smoothstep(1.2, 3.5, b.w/fw); if (lod <= 0.0) continue;
    float ph = a.z*dot(a.xy, w) - b.x*uTime + b.y; float s = sin(ph), c = cos(ph);
    float ka = a.z*a.w*lod; float q = b.z*ka*c;
    T.x -= a.x*a.x*q; T.y -= a.x*ka*s; T.z -= a.x*a.y*q;
    B.x -= a.x*a.y*q; B.y -= a.y*ka*s; B.z -= a.y*a.y*q;
    jac += q; hgt += a.w*c*lod;
  }
  vec3 N = normalize(cross(B, T));
  // fine detail from scrolling normal maps, driven by wind
  float wind = uA[4].z; vec2 wd = uA[4].xy;
  float nearF = 1.0/(1.0 + dist*0.004);
  vec2 d1 = texture2D(tNormal, w*0.11 + wd*uTime*0.035).xy - 0.5;
  vec2 d2 = texture2D(tNormal, w*0.037 - wd.yx*uTime*0.012 + 0.3).xy - 0.5;
  vec2 d3 = texture2D(tNormal, w*0.006 + wd*uTime*0.004).xy - 0.5;
  float ds = (0.25 + 1.3*wind)*uChop;
  N = normalize(N + vec3(d1.x + d2.x, 0.0, d1.y + d2.y)*ds*(0.35 + 0.65*nearF) + vec3(d3.x, 0.0, d3.y)*ds*0.5);
  float rain = uA[4].w;
  if (rain > 0.01 && dist < 90.0){ float rp = ripple(w*2.3, uTime) + ripple(w*3.7 + 5.0, uTime + 0.37); N = normalize(N + vec3(dFdx(rp), 0.0, dFdy(rp))*0.0 + vec3(rp, 0.0, rp*0.7)*0.22*rain*smoothstep(90.0, 20.0, dist)); }
  if (dot(N, V) < 0.03) N = normalize(N + V*(0.03 - dot(N, V)));
  vec3 L = uA[0].xyz; vec3 lcol = uA[1].rgb*uA[0].w*cloudShade(vWorld);
  float NoV = max(dot(N, V), 0.0);
  float rough = 0.045 + 0.09*wind + uOpt.w + smoothstep(200.0, 6000.0, dist)*0.1;
  float F = 0.02 + 0.98*pow(1.0 - NoV, 5.0); F *= 1.0 - rough*1.6*step(0.0, 1.0);
  // reflection
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.002; R = normalize(R);
  vec3 refl = textureLod(tSky, R, 1.0 + rough*16.0).rgb;
  if (uOpt.z > 0.0){
    vec4 pc = uPlanarM*vec4(vWorld.x + N.x*2.2, uLevel, vWorld.z + N.z*2.2, 1.0); vec2 puv = pc.xy/pc.w*0.5 + 0.5;
    if (pc.w > 0.0 && puv.x > 0.0 && puv.x < 1.0 && puv.y > 0.0 && puv.y < 1.0){ vec4 pr = texture2D(tPlanar, puv); float e = smoothstep(0.0, 0.05, puv.x)*smoothstep(1.0, 0.95, puv.x)*smoothstep(0.0, 0.05, puv.y); refl = mix(refl, pr.rgb, pr.a*uOpt.z*e); }
  }
  // sun glitter
  vec3 H = normalize(L + V); float NoH = max(dot(N, H), 0.0); float a2 = rough*rough; a2 *= a2;
  float dn = NoH*NoH*(a2 - 1.0) + 1.0; float D = a2/(3.14159*dn*dn);
  float spec = D*0.25*(0.02 + 0.98*pow(1.0 - max(dot(V, H), 0.0), 5.0))*step(0.0, L.y)*step(0.0, dot(N, L));
  // water body
  vec3 amb = uA[2].rgb*1.15 + uA[5].rgb*0.15;
  float sunUp = max(L.y, 0.0);
  vec3 body = uDeep*(amb*1.4 + lcol*sunUp*0.22);
  float sss = pow(max(dot(V, -normalize(L + N*0.35)), 0.0), 3.0)*clamp(0.3 + hgt*0.35 + jac*1.2, 0.0, 1.6);
  body += uScatter*(lcol*(sss*0.5 + sunUp*0.014) + amb*0.05*clamp(0.5 + hgt*0.3, 0.0, 1.0));
  float depth = 60.0; float shore = 0.0;
  if (uTerr.w > 0.5){
    float th = terrH(vWorld.xz); depth = max(vWorld.y - th, 0.0);
    vec2 rp = vWorld.xz - N.xz*min(depth, 3.0)*0.6;
    vec3 bed = texture2D(tBed, rp*0.17).rgb*uBedTint;
    float ca = 0.6 + 0.8*pow(texture2D(tFoam, rp*0.09 + uTime*0.02).r*texture2D(tFoam, rp*0.07 - uTime*0.017 + 0.4).r, 0.7)*sunUp;
    bed *= amb*1.5 + lcol*sunUp*0.32*ca;
    vec3 tr = exp(-depth*vec3(0.42, 0.085, 0.07)*uOpt.y - depth*uTurb);
    body = mix(body, bed, tr);
    // shoreline: breaking bands and wash
    float n = aNoise(vWorld.xz*0.25 + uTime*0.1);
    float band = sin(depth*1.9 - uTime*1.15 + n*4.0)*0.5 + 0.5;
    shore = smoothstep(2.6 + uShoreAmp*3.0, 0.0, depth)*(0.35 + 0.65*band)*(0.4 + uShoreAmp)*min(uShoreAmp*4.0, 1.0) + smoothstep(0.35, 0.0, depth)*min(uShoreAmp*2.6, 1.0);
  }
  vec3 col = mix(body, refl, clamp(F, 0.0, 1.0)) + lcol*spec;
  // foam: whitecaps, streaks, wake, shore
  vec3 ft = texture2D(tFoam, w*0.055 + N.xz*0.02).rgb; vec3 ft2 = texture2D(tFoam, w*0.19 + 0.37).rgb;
  float lace = ft.r*0.7 + ft2.r*0.5;
  float cap = smoothstep(uOpt.x, uOpt.x + 0.34, jac + (ft.g - 0.5)*0.22);
  float streak = smoothstep(0.62, 0.95, aNoise(vec2(dot(w, wd)*0.012, dot(w, vec2(-wd.y, wd.x))*0.09)) + wind*0.25)*smoothstep(0.45, 1.0, wind)*0.5*smoothstep(uOpt.x - 0.5, uOpt.x, jac + 0.15);
  float foam = cap*(0.55 + 0.6*lace) + streak*lace;
  if (uWake.w > 0.5){ vec2 wuv = (vRest - uWake.xy)/uWake.z + 0.5; if (wuv.x > 0.0 && wuv.x < 1.0 && wuv.y > 0.0 && wuv.y < 1.0){ vec4 wk = texture2D(tWake, wuv); float wv = min(wk.r, 1.6); foam += wv*(0.08 + 1.0*lace*lace)*0.9 + smoothstep(1.0, 1.6, wv)*0.3*lace; } }
  foam += shore*(0.35 + 0.9*lace);
  foam = clamp(foam, 0.0, 1.0);
  vec3 foamCol = (amb*2.2 + lcol*(0.25 + 0.75*max(dot(N, L), 0.0))*0.33)*vec3(0.93, 0.96, 0.98);
  col = mix(col, foamCol, foam*smoothstep(0.0, 0.25, foam + 0.1));
  col += vec3(0.7, 0.75, 1.0)*uA[5].w*0.25*F;
  col = applyAtmo(col, vWorld, cameraPosition);
  gl_FragColor = vec4(col, 1.0);
}`;

const WAKE_FRAG = /* glsl */`
precision highp float; varying vec2 vUv; uniform sampler2D tPrev; uniform vec2 uShift; uniform float uFade, uTexel, uBlur;
void main(){
  vec2 uv = vUv + uShift; vec4 c = vec4(0.0);
  if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0){
    c = texture2D(tPrev, uv)*(1.0 - uBlur) + (texture2D(tPrev, uv + vec2(uTexel, 0.0)) + texture2D(tPrev, uv - vec2(uTexel, 0.0)) + texture2D(tPrev, uv + vec2(0.0, uTexel)) + texture2D(tPrev, uv - vec2(0.0, uTexel)))*uBlur*0.25;
  }
  gl_FragColor = vec4(c.rgb*uFade, 1.0);
}`;

export class Ocean {
  constructor(app, o = {}) {
    this.app = app; const env = app.env;
    this.o = Object.assign({ level: 0, scale: 1, seaDir: 0.6, deep: [0.012, 0.055, 0.085], scatter: [0.05, 0.42, 0.38], foam: 0.62, clarity: 1, turb: 0.02, planar: false, wake: false, terrain: null, bed: 'beach_d.jpg', bedTint: [1, 1, 1], maxLambda: 230, minLambda: 1.4, swell: 1, calm: 0, shoreFoam: 1 }, o);
    this.level = this.o.level; this.tide = 0;
    this.origin = new THREE.Vector2(); this.time = 0;
    // wave set
    const r = rng(o.seed || 7);
    this.W = [];
    for (let i = 0; i < NW; i++) {
      const f = i / (NW - 1); const lambda = this.o.maxLambda * Math.pow(this.o.minLambda / this.o.maxLambda, f) * (0.9 + r() * 0.2);
      const spread = lerp(0.2, 1.15, f) * (r() * 2 - 1) + (i % 5 === 3 ? 0.9 * (r() > 0.5 ? 1 : -1) : 0);
      const th = this.o.seaDir + spread; const k = Math.PI * 2 / lambda;
      this.W.push({ dx: Math.cos(th), dz: Math.sin(th), k, lambda, omega: Math.sqrt(G * k), phase: r() * 6.283, amp: 0, chop: 0.78 });
    }
    this.uWA = []; this.uWB = [];
    for (let i = 0; i < NW; i++) { this.uWA.push(new THREE.Vector4()); this.uWB.push(new THREE.Vector4()); }
    this.windSm = env.windNow;
    if (!_foam) _foam = foamTexture();
    const nrm = tex('waternormals.jpg');
    this.u = {
      uWA: { value: this.uWA }, uWB: { value: this.uWB }, uTime: { value: 0 }, uOrigin: { value: this.origin },
      uCenter: { value: new THREE.Vector3() }, uLevel: { value: 0 }, uA: atmoUniform,
      tSky: { value: app.sky.cubeRT.texture }, tNormal: { value: nrm }, tFoam: { value: _foam }, tWake: { value: null }, tHeight: { value: null }, tPlanar: { value: null }, tBed: { value: tex(this.o.bed, { srgb: true }) },
      uDeep: { value: new THREE.Color(...this.o.deep) }, uScatter: { value: new THREE.Color(...this.o.scatter) }, uBedTint: { value: new THREE.Color(...this.o.bedTint) },
      uWake: { value: new THREE.Vector4(0, 0, 300, 0) }, uTerr: { value: new THREE.Vector4(0, 0, 1, 0) },
      uOpt: { value: new THREE.Vector4(this.o.foam, this.o.clarity, 0, 0) }, uPlanarM: { value: new THREE.Matrix4() }, uChop: { value: 1 }, uShoreAmp: { value: 0.3 }, uTurb: { value: this.o.turb },
    };
    if (this.o.terrain) { const t = this.o.terrain; this.u.tHeight.value = t.heightTex; this.u.uTerr.value.set(0, 0, t.size, 1); }
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, fog: false });
    this.mat.extensions = { derivatives: true };
    // polar grid
    const SEG = Q.level >= 2 ? 512 : Q.level === 1 ? 320 : 200, RINGS = Q.level >= 2 ? 380 : Q.level === 1 ? 260 : 170;
    const pos = new Float32Array((RINGS + 1) * (SEG + 1) * 3); const idx = [];
    const rmax = 90000, r0 = 0.35, gr = Math.pow(rmax / r0, 1 / RINGS);
    let p = 0;
    for (let j = 0; j <= RINGS; j++) { const rr = j === 0 ? 0 : r0 * Math.pow(gr, j); for (let i = 0; i <= SEG; i++) { pos[p++] = rr; pos[p++] = i / SEG * Math.PI * 2; pos[p++] = 0; } }
    for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) { const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 5;
    this.group = new THREE.Group(); this.group.add(this.mesh);
    // wake
    if (this.o.wake) this._initWake();
    if (this.o.planar && Q.level >= 1) this._initPlanar();
    this._setAmps(env.windNow, 0);
  }
  _setAmps(wind, dt) {
    this.windSm = dt ? damp(this.windSm, wind, 6, dt) : wind;
    const w = clamp(this.windSm * (1 - this.o.calm), 0, 1.3), sc = this.o.scale;
    for (let i = 0; i < NW; i++) {
      const W = this.W[i]; const a = W.lambda / 260;
      const s = 0.0055 * this.o.swell * smooth(8, 60, W.lambda) + 0.004 + 0.031 * smooth(a - 0.28, a + 0.36, w);
      W.amp = s * W.lambda / 3.5 * sc; W.chop = 0.55 + 0.3 * clamp(w);
      this.uWA[i].set(W.dx, W.dz, W.k, W.amp); this.uWB[i].set(W.omega, W.phase, W.chop, W.lambda);
    }
  }
  // CPU surface query (matches the vertex shader for the large waves)
  heightAt(x, z, out) {
    const t = this.time; let px = x + this.origin.x, pz = z + this.origin.y;
    let ox = 0, oz = 0, y = 0;
    for (let it = 0; it < 3; it++) {
      const qx = px - ox, qz = pz - oz; ox = 0; oz = 0; y = 0;
      for (let i = 0; i < NV; i++) { const W = this.W[i]; const ph = W.k * (W.dx * qx + W.dz * qz) - W.omega * t + W.phase; const s = Math.sin(ph), c = Math.cos(ph); ox -= W.dx * W.chop * W.amp * s; oz -= W.dz * W.chop * W.amp * s; y += W.amp * c; }
    }
    return this.level + y;
  }
  normalAt(x, z, out) {
    const e = 0.6, h = this.heightAt(x, z), hx = this.heightAt(x + e, z), hz = this.heightAt(x, z + e);
    return out.set(-(hx - h) / e, 1, -(hz - h) / e).normalize();
  }
  _initWake() {
    const S = 512; const opt = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
    this.wkA = new THREE.WebGLRenderTarget(S, S, opt); this.wkB = new THREE.WebGLRenderTarget(S, S, opt); this.wkSize = 320;
    this.wkMat = new THREE.ShaderMaterial({ uniforms: { tPrev: { value: null }, uShift: { value: new THREE.Vector2() }, uFade: { value: 0.99 }, uTexel: { value: 1 / S }, uBlur: { value: 0.02 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: WAKE_FRAG, depthTest: false, depthWrite: false });
    this.wkScene = new THREE.Scene(); const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.wkMat); q.frustumCulled = false; this.wkScene.add(q);
    this.wkCam = new THREE.OrthographicCamera(-this.wkSize / 2, this.wkSize / 2, this.wkSize / 2, -this.wkSize / 2, -10, 10);
    // stamps are soft points in wake space (x → u, z → v)
    const N = 700; this.wkN = N; this.wkPos = new Float32Array(N * 3); this.wkCol = new Float32Array(N * 3); this.wkVel = new Float32Array(N * 2); this.wkLife = new Float32Array(N); this.wkI = 0;
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(this.wkPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(this.wkCol, 3));
    const pm = new THREE.ShaderMaterial({ vertexShader: 'attribute vec3 color; varying vec3 vC; void main(){ vC = color; gl_Position = projectionMatrix*modelViewMatrix*vec4(position.x, position.y, 0.0, 1.0); gl_PointSize = color.g; }', fragmentShader: 'varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5)*2.0; float a = smoothstep(1.0, 0.0, d); gl_FragColor = vec4(vC.r*a*a, 0.0, 0.0, 1.0); }', blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
    this.wkPts = new THREE.Points(pg, pm); this.wkPts.frustumCulled = false; this.wkPtScene = new THREE.Scene(); this.wkPtScene.add(this.wkPts);
    this.u.uWake.value.set(0, 0, this.wkSize, 1);
  }
  // emit a foam stamp at world-local position with drift velocity
  stamp(x, z, vx, vz, strength, size, life = 1.5) {
    if (!this.wkPos) return; const i = this.wkI = (this.wkI + 1) % this.wkN;
    this.wkPos[i * 3] = x; this.wkPos[i * 3 + 1] = z; this.wkVel[i * 2] = vx; this.wkVel[i * 2 + 1] = vz; this.wkLife[i] = life; this.wkCol[i * 3] = strength; this.wkCol[i * 3 + 1] = size; this.wkCol[i * 3 + 2] = life;
  }
  _updateWake(dt, shiftX, shiftZ) {
    const r = this.app.renderer, prev = r.getRenderTarget();
    for (let i = 0; i < this.wkN; i++) { if (this.wkLife[i] <= 0) { this.wkCol[i * 3] = 0; continue; } this.wkLife[i] -= dt; this.wkPos[i * 3] += (this.wkVel[i * 2]) * dt - shiftX; this.wkPos[i * 3 + 1] += (this.wkVel[i * 2 + 1]) * dt - shiftZ; this.wkVel[i * 2] *= 1 - dt * 0.7; this.wkVel[i * 2 + 1] *= 1 - dt * 0.7; if (this.wkLife[i] <= 0) this.wkCol[i * 3] = 0; }
    this.wkPts.geometry.attributes.position.needsUpdate = true; this.wkPts.geometry.attributes.color.needsUpdate = true;
    const t = this.wkA; this.wkA = this.wkB; this.wkB = t;
    this.wkMat.uniforms.tPrev.value = this.wkB.texture; this.wkMat.uniforms.uShift.value.set(shiftX / this.wkSize, shiftZ / this.wkSize); this.wkMat.uniforms.uFade.value = Math.exp(-dt / 14); this.wkMat.uniforms.uBlur.value = Math.min(dt * 1.1, 0.4);
    const ac = r.autoClear; r.autoClear = false;
    r.setRenderTarget(this.wkA); r.render(this.wkScene, this.wkCam);
    // points: wake-space x → right, z → up; scale intensity by dt so the result is frame-rate independent
    this.wkPts.material.uniforms = this.wkPts.material.uniforms || {};
    r.render(this.wkPtScene, this.wkCam); r.setRenderTarget(prev); r.autoClear = ac;
    this.u.tWake.value = this.wkA.texture;
  }
  _initPlanar() {
    const r = this.app.renderer; const sz = r.getDrawingBufferSize(new THREE.Vector2());
    const s = Q.level >= 2 ? 0.5 : 0.33;
    this.plRT = new THREE.WebGLRenderTarget(Math.max(64, sz.x * s | 0), Math.max(64, sz.y * s | 0), { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.plCam = new THREE.PerspectiveCamera(); this.plPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.u.tPlanar.value = this.plRT.texture; this.u.uOpt.value.z = 1;
  }
  renderPlanar(scene, camera) {
    if (!this.plRT) return; const r = this.app.renderer, lv = this.level;
    if (camera.position.y < lv + 0.05) return;
    const pc = this.plCam; pc.fov = camera.fov; pc.aspect = camera.aspect; pc.near = camera.near; pc.far = camera.far; pc.projectionMatrix.copy(camera.projectionMatrix); pc.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    camera.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(camera.quaternion);
    pc.position.set(camera.position.x, 2 * lv - camera.position.y, camera.position.z);
    pc.up.set(_u.x, -_u.y, _u.z); _t.set(pc.position.x + _f.x, pc.position.y - _f.y, pc.position.z + _f.z); pc.lookAt(_t); pc.updateMatrixWorld(true);
    this.u.uPlanarM.value.multiplyMatrices(pc.projectionMatrix, pc.matrixWorldInverse);
    this.plPlane.constant = -(lv + 0.05);
    const prev = r.getRenderTarget(), vis = this.group.visible, sh = r.shadowMap.autoUpdate, cp = r.clippingPlanes;
    this.group.visible = false; r.shadowMap.autoUpdate = false; r.clippingPlanes = [this.plPlane];
    const hidden = []; scene.traverse((o) => { if (o.userData.noReflect && o.visible) { o.visible = false; hidden.push(o); } });
    r.setRenderTarget(this.plRT); r.setClearColor(0x000000, 0); r.clear();
    r.render(scene, pc);
    r.setRenderTarget(prev); r.clippingPlanes = cp; r.shadowMap.autoUpdate = sh; this.group.visible = vis; for (const o of hidden) o.visible = true;
  }
  update(dt, camera, env) {
    this.time += dt; this._setAmps(env.windNow, dt);
    this.tide = Math.sin(this.time * 0.021) * (this.o.tideRange || 0);
    this.level = this.o.level + this.tide;
    const u = this.u; u.uTime.value = this.time; u.uLevel.value = this.level; u.uChop.value = 1 - this.o.calm * 0.6;
    u.uCenter.value.set(Math.round(camera.position.x), 0, Math.round(camera.position.z));
    u.uShoreAmp.value = clamp(0.2 + this.windSm * 0.9) * this.o.shoreFoam;
    u.tSky.value = this.app.sky.cubeRT.texture;
  }
  dispose() { this.mesh.geometry.dispose(); this.mat.dispose(); for (const k of ['wkA', 'wkB', 'plRT']) if (this[k]) this[k].dispose(); }
}
const _f = new THREE.Vector3(), _u = new THREE.Vector3(), _t = new THREE.Vector3();
