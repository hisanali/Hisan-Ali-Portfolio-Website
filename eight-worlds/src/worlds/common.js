// Pieces shared by several worlds: running water, foliage cards, mist, GLB props.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp, smooth, rng, tex, texD, atmoUniform, ATMO_GLSL, A, Q } from '../core.js';
import { windPatch } from '../scatter.js';

// --- flowing water ribbon (streams, lava uses its own) ---
const STREAM_FRAG = /* glsl */`
precision highp float; ${ATMO_GLSL}
uniform samplerCube tSky; uniform sampler2D tNormal, tBed; uniform float uT, uReflK; uniform vec3 uTint;
varying vec3 vW; varying vec2 vUv; varying float vFoam; varying vec3 vFlow;
void main(){
  vec3 V = normalize(cameraPosition - vW); float sp = 0.35 + vFoam*1.6;
  vec2 f = vec2(vUv.x, vUv.y);
  vec2 n1 = texture2D(tNormal, f*vec2(0.9, 0.22) + vec2(0.0, -uT*0.11*sp)).xy - 0.5;
  vec2 n2 = texture2D(tNormal, f*vec2(2.3, 0.6) + vec2(0.3, -uT*0.19*sp)).xy - 0.5;
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), vFlow));
  vec3 N = normalize(vec3(0.0, 1.0, 0.0) + (side*(n1.x + n2.x) + vFlow*(n1.y + n2.y))*(0.5 + vFoam));
  float F = 0.02 + 0.98*pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N); R.y = abs(R.y); vec3 refl = min(textureLod(tSky, R, 2.0).rgb, vec3(1.6))*uReflK;
  vec3 L = uA[0].xyz; vec3 lcol = uA[1].rgb*uA[0].w*cloudShade(vW);
  vec3 amb = uA[2].rgb;
  vec3 bed = texture2D(tBed, vW.xz*0.35 + N.xz*0.08).rgb*uTint*(amb*1.1 + lcol*max(L.y, 0.0)*0.22);
  float edge = smoothstep(0.0, 0.16, vUv.x)*smoothstep(1.0, 0.84, vUv.x);
  vec3 col = mix(bed*0.6, refl, F*0.7);
  vec3 H = normalize(L + V); col += lcol*pow(max(dot(N, H), 0.0), 380.0)*1.2*step(0.0, L.y);
  float fo = clamp(vFoam*(0.2 + 1.6*smoothstep(0.02, 0.12, n1.x*n2.y + n1.y*n2.x)) + smoothstep(0.05, 0.14, n1.x*n2.y)*0.25, 0.0, 1.0);
  col = mix(col, (amb*1.3 + lcol*0.12)*0.95, fo);
  col = applyAtmo(col, vW, cameraPosition);
  gl_FragColor = vec4(col, mix(0.72, 1.0, max(F, fo))*edge);
}`;
export function streamMesh(app, pathFn, { x0, x1, step = 2, half = 3.2, tint = [0.42, 0.36, 0.24], bed = 'gravel_d.jpg', reflK = 0.3 }) {
  // pathFn(x) → { z, y, foam }
  const pos = [], uv = [], foam = [], flow = [], idx = []; let n = 0, len = 0, pz = 0, py = 0;
  for (let x = x0; x <= x1; x += step) {
    const p = pathFn(x), q = pathFn(x + 0.5); const dx = 0.5, dz = q.z - p.z, dy = q.y - p.y; const l = Math.hypot(dx, dz); const nx = -dz / l, nz = dx / l;
    if (n) len += Math.hypot(step, p.z - pz, p.y - py); pz = p.z; py = p.y;
    for (const s of [-1, 1]) { pos.push(x + nx * s * half, p.y, p.z + nz * s * half); uv.push(s * 0.5 + 0.5, len / (half * 2)); foam.push(p.foam); const fl = Math.hypot(dx, dy, dz); flow.push(dx / fl, dy / fl, dz / fl); }
    if (n) { const a = (n - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } n++;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aFoam', new THREE.Float32BufferAttribute(foam, 1)); g.setAttribute('aFlow', new THREE.Float32BufferAttribute(flow, 3)); g.setIndex(idx);
  const u = { tSky: { value: app.sky.cubeRT.texture }, tNormal: { value: tex('waternormals.jpg') }, tBed: { value: texD(bed) }, uT: { value: 0 }, uReflK: { value: reflK }, uTint: { value: new THREE.Color(...tint) }, uA: atmoUniform };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: 'attribute float aFoam; attribute vec3 aFlow; varying vec3 vW; varying vec2 vUv; varying float vFoam; varying vec3 vFlow; void main(){ vW = position; vUv = uv; vFoam = aFoam; vFlow = aFlow; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }', fragmentShader: STREAM_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
  return { mesh, update(dt) { u.uT.value += dt; u.tSky.value = app.sky.cubeRT.texture; } };
}

// --- foliage cards cut from the broadleaf atlas: 'sapling' (upright) or 'spray' (bushy) ---
const REG = { sapling: [0.078, 0.497, 0.41, 0.941], spray: [0.03, 0.067, 0.47, 0.404] };
export function cardGeo(kind = 'spray', planes = 3, w = 1, h = 1, lean = 0.25) {
  const r = REG[kind], pos = [], uv = [], nor = [], idx = [];
  for (let k = 0; k < planes; k++) { const a = k / planes * Math.PI + 0.3, c = Math.cos(a), s = Math.sin(a), b = pos.length / 3; const lx = Math.cos(a * 2.1) * lean * h, lz = Math.sin(a * 1.7) * lean * h;
    for (const [x, y] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]]) { pos.push(c * x * w + lx * y, y * h, s * x * w + lz * y); uv.push(lerp(r[0], r[2], x + 0.5), lerp(r[1], r[3], y)); nor.push(c * x * 0.6, 0.8, s * x * 0.6); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
let _cardMats = {};
export function cardMat(tint = 0xffffff, radius = 60) {
  const k = tint + ':' + radius; if (_cardMats[k]) return _cardMats[k];
  const map = texD('broadleaf.png'); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, envMapIntensity: 0.45, color: new THREE.Color(tint).multiply(new THREE.Color(0.7, 0.8, 0.6)), alphaToCoverage: Q.level >= 2 });
  windPatch(m, { stiff: 0.03, flutter: 0.12, fadeOut: radius, translucent: 0.3 });
  const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.4, side: THREE.DoubleSide }); windPatch(d, { stiff: 0.03, flutter: 0.12, depth: true });
  return (_cardMats[k] = { mat: m, depthMat: d });
}

// --- drifting mist: call each frame; picks low spots near the camera ---
export function mistEmitter(app, { rate = 1.2, size = [10, 22], alpha = 0.07, life = [14, 26], height = [0.5, 3], radius = 90, where = null, color = [1, 1, 1] }) {
  const r = rng(71); let acc = 0; const c = new THREE.Color();
  return (dt, amount, cam, ground) => {
    acc += dt * rate * amount; if (amount <= 0.01) return;
    while (acc > 1) { acc -= 1; const a = r() * 6.283, d = Math.sqrt(r()) * radius; const x = cam.x + Math.cos(a) * d, z = cam.z + Math.sin(a) * d; const g = ground(x, z); if (g == null) continue; if (where && !where(x, z, g)) continue;
      app.fx.litColor(c, 0.85, 0.2); const s = lerp(size[0], size[1], r());
      app.fx.emit({ x, y: g + lerp(height[0], height[1], r()) + s * 0.12, z, vx: (r() - 0.5) * 0.3, vy: 0.02, vz: (r() - 0.5) * 0.3, life: lerp(life[0], life[1], r()), s0: s * 0.7, s1: s * 1.25, a: alpha * (0.6 + 0.8 * r()) * Math.min(1, amount), r: c.r * color[0], g: c.g * color[1], b: c.b * color[2], drag: 0.2, wind: 0.12, frame: -1, fin: 0.3, spin: 0.02 }); }
  };
}

const gltf = new GLTFLoader();
export async function loadGLBMeshes(name) { // → [{geo, mat}] with transforms baked
  const g = await gltf.loadAsync('assets/models/' + name + '.glb'); const out = []; g.scene.updateMatrixWorld(true);
  g.scene.traverse((o) => { if (o.isMesh) { const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); out.push({ geo, mat: o.material }); } });
  return out;
}

// --- solid colliders: {t:'cyl', x, z, r, y0, y1} or {t:'box', x, z, hx, hz, rot, y0, y1} ---
export function pushOut(p, rad, list) {
  for (const c of list) {
    if (p.y < c.y0 - rad || p.y > c.y1 + rad) continue;
    if (c.t === 'cyl') { const dx = p.x - c.x, dz = p.z - c.z, rr = c.r + rad, d2 = dx * dx + dz * dz; if (d2 < rr * rr) { if (c.y1 - p.y < rad * 0.9 + 0.25 && c.top !== false) { p.y = c.y1 + rad; continue; } const d = Math.sqrt(d2) || 1e-3; p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr; } }
    else { const cs = Math.cos(c.rot || 0), sn = Math.sin(c.rot || 0); const dx = p.x - c.x, dz = p.z - c.z; let lx = dx * cs + dz * sn, lz = -dx * sn + dz * cs; const ox = c.hx + rad - Math.abs(lx), oz = c.hz + rad - Math.abs(lz);
      if (ox > 0 && oz > 0) { const oy = c.y1 + rad - p.y; if (oy < Math.min(ox, oz) && oy < 0.6) { p.y = c.y1 + rad; continue; } if (ox < oz) lx = Math.sign(lx || 1) * (c.hx + rad); else lz = Math.sign(lz || 1) * (c.hz + rad); p.x = c.x + lx * cs - lz * sn; p.z = c.z + lx * sn + lz * cs; } }
  }
}
// search outward for ground that satisfies a test: test(h, slope, x, z) → score (higher is better) or -1
export function findSpot(hf, cx, cz, radius, test, step = 40) {
  let best = null, bs = -1; for (let z = cz - radius; z <= cz + radius; z += step) for (let x = cx - radius; x <= cx + radius; x += step) { const h = hf.heightAt(x, z), s = hf.slope(x, z); const sc = test(h, s, x, z); if (sc > bs) { bs = sc; best = [x, h, z]; } }
  return best || [cx, hf.heightAt(cx, cz), cz];
}
