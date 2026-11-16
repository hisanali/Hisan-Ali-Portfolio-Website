// Particles: precipitation volumes that wrap around the camera, a pooled sprite system for smoke, spray, mist
// and embers, and lightning bolts.
import * as THREE from 'three';
import { clamp, lerp, rng, A, atmoUniform, ATMO_GLSL, tex, Q, smooth } from './core.js';

const PRECIP_VERT = /* glsl */`
attribute vec4 seed; attribute vec2 corner;
uniform vec3 uCam, uBox, uVel, uRight, uUp; uniform float uT, uMode, uGround; uniform vec2 uSize; uniform sampler2D tHeight; uniform vec4 uTerr;
varying vec2 vC; varying float vFade; varying vec3 vW;
void main(){
  vec3 p = seed.xyz*uBox + uVel*uT*(0.75 + 0.5*seed.w);
  if (uMode > 0.5) p += vec3(sin(uT*1.3 + seed.w*40.0), 0.0, cos(uT*1.1 + seed.w*31.0))*0.35*(1.0 + uMode);
  vec3 w = uCam + mod(p - uCam + uBox*0.5, uBox) - uBox*0.5;
  if (uGround > 0.5){ vec2 uv = w.xz/uTerr.z + 0.5; float gh = texture2D(tHeight, uv).r; w.y = gh + 0.05 + seed.y*seed.y*uBox.y; }
  vec3 toC = w - uCam; float d = length(toC);
  vec3 pos;
  if (uMode < 0.5 || uMode > 1.5){ vec3 ax = normalize(uVel + vec3(0.0, uMode > 1.5 ? 0.0 : -0.001, 0.0)); vec3 sd = normalize(cross(ax, toC)); pos = w + sd*corner.x*uSize.x + ax*corner.y*uSize.y; }
  else pos = w + (uRight*corner.x + uUp*corner.y)*uSize.x*(0.6 + 0.8*seed.w);
  vFade = smoothstep(0.8, 4.0, d)*smoothstep(uBox.x*0.5, uBox.x*0.36, d);
  vC = corner; vW = pos;
  gl_Position = projectionMatrix*viewMatrix*vec4(pos, 1.0);
}`;
const PRECIP_FRAG = /* glsl */`
precision highp float; ${ATMO_GLSL}
uniform vec3 uColor; uniform float uAlpha, uMode; varying vec2 vC; varying float vFade; varying vec3 vW;
void main(){
  float a;
  if (uMode < 0.5) a = (1.0 - abs(vC.x))*(1.0 - vC.y*vC.y);
  else if (uMode > 1.5) a = (1.0 - abs(vC.x))*(1.0 - abs(vC.y));
  else { float r = length(vC); a = smoothstep(1.0, 0.25, r); }
  a *= uAlpha*vFade; if (a < 0.003) discard;
  vec3 c = uColor*(uA[2].rgb*2.6 + uA[1].rgb*uA[0].w*0.16 + vec3(0.8, 0.85, 1.0)*uA[5].w*2.0);
  c = applyAtmo(c, vW, cameraPosition);
  gl_FragColor = vec4(c*a, a);
}`;

class Precip {
  constructor(n, mode, box, size) {
    const g = new THREE.InstancedBufferGeometry(); const r = rng(11 + mode * 7 + n);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const s = new Float32Array(n * 4); for (let i = 0; i < s.length; i++) s[i] = r(); g.setAttribute('seed', new THREE.InstancedBufferAttribute(s, 4));
    this.n = n; g.instanceCount = 0;
    this.u = { uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(...box) }, uVel: { value: new THREE.Vector3(0, -9, 0) }, uRight: { value: new THREE.Vector3() }, uUp: { value: new THREE.Vector3() }, uT: { value: 0 }, uMode: { value: mode }, uGround: { value: 0 }, uSize: { value: new THREE.Vector2(...size) }, tHeight: { value: null }, uTerr: { value: new THREE.Vector4(0, 0, 1, 0) }, uColor: { value: new THREE.Color(1, 1, 1) }, uAlpha: { value: 0.3 }, uA: atmoUniform };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: PRECIP_VERT, fragmentShader: PRECIP_FRAG, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 50; this.mesh.userData.noReflect = true; this.t = 0;
  }
  set(amount, cam, dt) {
    this.mesh.geometry.instanceCount = Math.floor(this.n * clamp(amount)); this.mesh.visible = amount > 0.004; this.t += dt; this.u.uT.value = this.t;
    this.u.uCam.value.copy(cam.position); this.u.uRight.value.setFromMatrixColumn(cam.matrixWorld, 0); this.u.uUp.value.setFromMatrixColumn(cam.matrixWorld, 1);
  }
}

const SPR_VERT = /* glsl */`
attribute vec2 corner; attribute vec3 iPos; attribute vec4 iPar; attribute vec4 iCol; // par: size, rot, alpha, frame
uniform vec3 uRight, uUp; varying vec2 vUv; varying vec4 vCol; varying float vAlpha, vFrame; varying vec3 vW;
void main(){
  float c = cos(iPar.y), s = sin(iPar.y); vec2 q = vec2(corner.x*c - corner.y*s, corner.x*s + corner.y*c);
  vec3 p = iPos + (uRight*q.x + uUp*q.y)*iPar.x; vW = p;
  vUv = corner*0.5 + 0.5; vCol = iCol; vAlpha = iPar.z; vFrame = iPar.w;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`;
const SPR_FRAG = /* glsl */`
precision highp float; ${ATMO_GLSL}
uniform sampler2D tSmoke; uniform vec3 uCam2; varying vec2 vUv; varying vec4 vCol; varying float vAlpha, vFrame; varying vec3 vW;
void main(){
  float a; float shade = 1.0;
  if (vFrame < 0.0){ float r = length(vUv - 0.5)*2.0; a = smoothstep(1.0, 0.0, r); a *= a; }
  else { float f = floor(vFrame); vec2 cell = vec2(mod(f, 8.0), 7.0 - floor(f/8.0)); vec4 t = texture2D(tSmoke, (cell + vUv)/8.0); a = t.a; shade = 0.55 + 0.6*dot(t.rgb, vec3(0.33)); float r = length(vUv - 0.5)*2.0; a *= smoothstep(1.0, 0.7, r); }
  a *= vAlpha; a *= smoothstep(0.3, 2.5, length(vW - cameraPosition));
  if (a < 0.004) discard;
  vec3 c = vCol.rgb*shade;
  if (vCol.a < 0.5) c = applyAtmo(c, vW, cameraPosition);
  gl_FragColor = vec4(c*a, a*(1.0 - vCol.a));
}`;

export class FX {
  constructor(app) {
    this.app = app; this.group = new THREE.Group(); app.scene.add(this.group);
    const k = Q.level >= 2 ? 1 : Q.level === 1 ? 0.6 : 0.3;
    this.rain = new Precip(Math.floor(30000 * k), 0, [40, 30, 40], [0.006, 0.34]);
    this.snow = new Precip(Math.floor(22000 * k), 1, [50, 32, 50], [0.022, 0.022]);
    this.drift = new Precip(Math.floor(16000 * k), 2, [70, 1.4, 70], [0.02, 0.5]);
    this.group.add(this.rain.mesh, this.snow.mesh, this.drift.mesh);
    // sprite pool
    const N = this.N = Q.level >= 1 ? 2600 : 1200;
    this.p = { x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N), vx: new Float32Array(N), vy: new Float32Array(N), vz: new Float32Array(N), age: new Float32Array(N), life: new Float32Array(N).fill(0), s0: new Float32Array(N), s1: new Float32Array(N), rot: new Float32Array(N), spin: new Float32Array(N), a: new Float32Array(N), r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N), add: new Float32Array(N), drag: new Float32Array(N), grav: new Float32Array(N), frame: new Float32Array(N), fin: new Float32Array(N), wind: new Float32Array(N) };
    this.next = 0; this.alive = 0;
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    this.iPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3); this.iPar = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); this.iCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4);
    for (const a of [this.iPos, this.iPar, this.iCol]) a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', this.iPos); g.setAttribute('iPar', this.iPar); g.setAttribute('iCol', this.iCol); g.instanceCount = 0;
    const smoke = tex('smoke.png', { repeat: false });
    this.su = { uRight: { value: new THREE.Vector3() }, uUp: { value: new THREE.Vector3() }, tSmoke: { value: smoke }, uA: atmoUniform };
    const m = new THREE.ShaderMaterial({ uniforms: this.su, vertexShader: SPR_VERT, fragmentShader: SPR_FRAG, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    this.sprites = new THREE.Mesh(g, m); this.sprites.frustumCulled = false; this.sprites.renderOrder = 40; this.group.add(this.sprites);
    this.order = new Uint16Array(N); this.keys = new Float32Array(N);
    // lightning
    this.boltMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(26, 30, 46), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, side: THREE.DoubleSide });
    this.boltMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.boltMat); this.boltMesh.frustumCulled = false; this.boltMesh.visible = false; this.boltMesh.renderOrder = 30; this.group.add(this.boltMesh);
    this.boltT = 0; this.rnd = rng(5);
    this.lit = new THREE.Color(); this.amb = new THREE.Color();
  }
  clear() { this.p.life.fill(0); this.sprites.geometry.instanceCount = 0; this.drift.u.uGround.value = 0; this.drift.amount = 0; }
  // colour of a white diffuse particle under the current light
  litColor(out, k = 1, sun = 0.14) { return out.setRGB((A[8] * 2.4 + A[4] * A[3] * sun) * k, (A[9] * 2.4 + A[5] * A[3] * sun) * k, (A[10] * 2.4 + A[6] * A[3] * sun) * k); }
  emit(o) {
    const p = this.p; let i = this.next; this.next = (this.next + 1) % this.N;
    p.x[i] = o.x; p.y[i] = o.y; p.z[i] = o.z; p.vx[i] = o.vx || 0; p.vy[i] = o.vy || 0; p.vz[i] = o.vz || 0; p.age[i] = 0; p.life[i] = o.life || 2;
    p.s0[i] = o.s0 ?? 1; p.s1[i] = o.s1 ?? p.s0[i] * 2; p.rot[i] = o.rot ?? this.rnd() * 6.28; p.spin[i] = o.spin ?? (this.rnd() - 0.5) * 0.6; p.a[i] = o.a ?? 0.5;
    p.r[i] = o.r ?? 1; p.g[i] = o.g ?? 1; p.b[i] = o.b ?? 1; p.add[i] = o.add || 0; p.drag[i] = o.drag ?? 0.4; p.grav[i] = o.grav ?? 0; p.frame[i] = o.frame ?? -1; p.fin[i] = o.fin ?? 0.15; p.wind[i] = o.wind ?? 1;
    if (o.age) { // start part-way through its life (used to pre-fill plumes)
      const env = this.app.env, wx = env.windDir.x * env.windNow * 6 * p.wind[i], wz = env.windDir.y * env.windNow * 6 * p.wind[i], d = Math.max(p.drag[i], 1e-3), k = (1 - Math.exp(-d * o.age)) / d;
      p.x[i] += (p.vx[i] - wx) * k + wx * o.age; p.z[i] += (p.vz[i] - wz) * k + wz * o.age; p.y[i] += p.vy[i] * k; p.vx[i] = (p.vx[i] - wx) * Math.exp(-d * o.age) + wx; p.vz[i] = (p.vz[i] - wz) * Math.exp(-d * o.age) + wz; p.vy[i] *= Math.exp(-d * o.age); p.age[i] = o.age; }
  }
  bolt(az, dist, dur) {
    const cam = this.app.camera.position, r = this.rnd; const pts = [];
    const bx = cam.x + Math.cos(az) * dist, bz = cam.z + Math.sin(az) * dist; const top = 1500 + r() * 500;
    const gy = this.app.world?.ground?.(bx, bz) ?? this.app.world?.waterAt?.(bx, bz) ?? 0;
    const seg = (a, b, w, depth) => {
      const n = 14; let p = a.clone();
      for (let i = 1; i <= n; i++) { const t = i / n; const q = a.clone().lerp(b, t); const j = (1 - Math.abs(t - 0.5) * 1.2) * a.distanceTo(b) * 0.07; q.x += (r() - 0.5) * j * 2; q.z += (r() - 0.5) * j * 2; q.y += (r() - 0.5) * j * 0.4; pts.push([p.clone(), q.clone(), w]);
        if (depth < 2 && r() < 0.22) { const e = q.clone().add(new THREE.Vector3((r() - 0.5) * 500, -150 - r() * 350, (r() - 0.5) * 500)); seg(q, e, w * 0.45, depth + 1); }
        p = q; }
    };
    seg(new THREE.Vector3(bx + (r() - 0.5) * 300, top, bz + (r() - 0.5) * 300), new THREE.Vector3(bx, gy, bz), dist * 0.0022 + 0.8, 0);
    const pos = new Float32Array(pts.length * 18); let o = 0; const side = new THREE.Vector3(), d = new THREE.Vector3(), v = new THREE.Vector3();
    for (const [a, b, w] of pts) { d.subVectors(b, a); v.subVectors(a, cam); side.crossVectors(d, v).normalize().multiplyScalar(w);
      const q = [a.x - side.x, a.y - side.y, a.z - side.z, a.x + side.x, a.y + side.y, a.z + side.z, b.x + side.x, b.y + side.y, b.z + side.z, a.x - side.x, a.y - side.y, a.z - side.z, b.x + side.x, b.y + side.y, b.z + side.z, b.x - side.x, b.y - side.y, b.z - side.z];
      pos.set(q, o); o += 18; }
    this.boltMesh.geometry.dispose(); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); this.boltMesh.geometry = g; this.boltT = dur;
  }
  update(dt, cam, env, world) {
    // precipitation
    const wx = env.windDir.x * env.windNow, wz = env.windDir.y * env.windNow;
    this.rain.u.uVel.value.set(wx * 9, -10.5, wz * 9); this.rain.u.uAlpha.value = 0.3; this.rain.u.uColor.value.setRGB(0.75, 0.8, 0.9);
    this.rain.set(env.precipRain * (world.rainScale ?? 1), cam, dt);
    const ash = world.ash || 0;
    this.snow.u.uVel.value.set(wx * 7, ash > 0 && env.precipSnow < 0.05 ? -0.55 : -1.25, wz * 7);
    if (ash > 0 && env.precipSnow < ash) { this.snow.u.uColor.value.setRGB(0.16, 0.15, 0.15); this.snow.u.uAlpha.value = 0.85; this.snow.u.uSize.value.set(0.016, 0.016); }
    else { this.snow.u.uColor.value.setRGB(1, 1, 1); this.snow.u.uAlpha.value = 0.8; this.snow.u.uSize.value.set(0.021, 0.021); }
    this.snow.set(Math.max(env.precipSnow, ash), cam, dt);
    // ground drift (sand or spindrift): needs the world's height texture
    const dr = world.drift;
    if (dr) { const u = this.drift.u; u.uGround.value = 1; u.tHeight.value = dr.hf.heightTex; u.uTerr.value.set(0, 0, dr.hf.size, 1); u.uColor.value.setRGB(...dr.color); u.uAlpha.value = dr.alpha ?? 0.5;
      const sp = 3 + env.windNow * 22; u.uVel.value.set(env.windDir.x * sp, 0, env.windDir.y * sp); u.uSize.value.set(0.018, 0.25 + env.windNow * 0.9);
      this.drift.set(smooth(dr.start ?? 0.3, 1.0, env.windNow) * (dr.amount ?? 1), cam, dt);
    } else this.drift.set(0, cam, dt);

    // sprites
    const p = this.p, N = this.N; let n = 0; const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    const wvx = wx * 6, wvz = wz * 6;
    for (let i = 0; i < N; i++) {
      if (p.life[i] <= 0) continue; p.age[i] += dt; if (p.age[i] >= p.life[i]) { p.life[i] = 0; continue; }
      const dg = Math.exp(-p.drag[i] * dt); p.vx[i] = (p.vx[i] - wvx * p.wind[i]) * dg + wvx * p.wind[i]; p.vz[i] = (p.vz[i] - wvz * p.wind[i]) * dg + wvz * p.wind[i]; p.vy[i] = p.vy[i] * dg - p.grav[i] * dt;
      p.x[i] += p.vx[i] * dt; p.y[i] += p.vy[i] * dt; p.z[i] += p.vz[i] * dt; p.rot[i] += p.spin[i] * dt;
      const dx = p.x[i] - cx, dy = p.y[i] - cy, dz = p.z[i] - cz; this.keys[i] = dx * dx + dy * dy + dz * dz; this.order[n++] = i;
    }
    const ord = this.order.subarray(0, n), keys = this.keys; if (n < 1800) ord.sort((a, b) => keys[b] - keys[a]);
    const P = this.iPos.array, R = this.iPar.array, C = this.iCol.array;
    for (let j = 0; j < n; j++) { const i = ord[j], k = p.age[i] / p.life[i];
      P[j * 3] = p.x[i]; P[j * 3 + 1] = p.y[i]; P[j * 3 + 2] = p.z[i];
      R[j * 4] = lerp(p.s0[i], p.s1[i], 1 - (1 - k) * (1 - k)); R[j * 4 + 1] = p.rot[i]; R[j * 4 + 2] = p.a[i] * Math.min(k / p.fin[i], 1) * (1 - k) * (1 - k * k); R[j * 4 + 3] = p.frame[i] < 0 ? -1 : Math.min(63, p.frame[i] + k * 40);
      C[j * 4] = p.r[i]; C[j * 4 + 1] = p.g[i]; C[j * 4 + 2] = p.b[i]; C[j * 4 + 3] = p.add[i]; }
    this.iPos.needsUpdate = this.iPar.needsUpdate = this.iCol.needsUpdate = true; this.sprites.geometry.instanceCount = n; this.alive = n;
    this.su.uRight.value.setFromMatrixColumn(cam.matrixWorld, 0); this.su.uUp.value.setFromMatrixColumn(cam.matrixWorld, 1);
    // bolt
    if (this.boltT > 0) { this.boltT -= dt; this.boltMesh.visible = env.flash > 0.08; this.boltMat.opacity = clamp(env.flash * 1.5); } else this.boltMesh.visible = false;
  }
}
