// Physically based sky (single scattering LUT), volumetric cloud layer, sun/moon/stars,
// environment capture for image-based lighting, and the main directional light.
import * as THREE from 'three';
import { clamp, lerp, smooth, damp, rng, A, atmoUniform, ATMO_GLSL, Q } from './core.js';

function makeCloudNoise(S = 64, SZ = 32) {
  const data = new Uint8Array(S * S * SZ * 4);
  const r = rng(4242);
  const tables = {};
  for (const p of [2, 4, 8, 16, 32]) { const t = new Float32Array(p * p * p * 4); for (let i = 0; i < t.length; i++) t[i] = r(); tables[p] = t; }
  const worley = (x, y, z, p) => { // x,y,z in [0,1), returns 1 at feature points
    const T = tables[p]; x *= p; y *= p; z *= p; const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    let m = 9;
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx, cy = yi + dy, cz = zi + dz;
      const k = ((((cz % p) + p) % p) * p * p + (((cy % p) + p) % p) * p + (((cx % p) + p) % p)) * 4;
      const fx = cx + T[k] - x, fy = cy + T[k + 1] - y, fz = cz + T[k + 2] - z; const d = fx * fx + fy * fy + fz * fz; if (d < m) m = d;
    }
    return 1 - Math.min(Math.sqrt(m), 1);
  };
  const vnoise = (x, y, z, p) => {
    const T = tables[p]; x *= p; y *= p; z *= p; const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    let fx = x - xi, fy = y - yi, fz = z - zi; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    const g = (a, b, c) => T[(((c % p) * p + (b % p)) * p + (a % p)) * 4 + 3];
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(g(xi, yi, zi), g(xi + 1, yi, zi), fx), l(g(xi, yi + 1, zi), g(xi + 1, yi + 1, zi), fx), fy),
      l(l(g(xi, yi, zi + 1), g(xi + 1, yi, zi + 1), fx), l(g(xi, yi + 1, zi + 1), g(xi + 1, yi + 1, zi + 1), fx), fy), fz);
  };
  let o = 0;
  for (let k = 0; k < SZ; k++) for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const x = i / S, y = j / S, z = k / SZ;
    const pf = vnoise(x, y, z, 4) * 0.5 + vnoise(x, y, z, 8) * 0.3 + vnoise(x, y, z, 16) * 0.2;
    const w4 = worley(x, y, z, 4), w8 = worley(x, y, z, 8), w16 = worley(x, y, z, 16);
    const wf = w4 * 0.625 + w8 * 0.25 + w16 * 0.125;
    const pw = clamp((pf - (wf - 1) * 0.0 - (1 - wf) * 0.55) / (1 - (1 - wf) * 0.55) * 1.0);
    data[o++] = clamp(pw * 0.6 + wf * 0.5) * 255;
    data[o++] = (w8 * 0.55 + w16 * 0.3 + worley(x, y, z, 32) * 0.15) * 255;
    data[o++] = (vnoise(x, y, z, 2) * 0.6 + vnoise(x, y, z, 4) * 0.4) * 255;
    data[o++] = 255;
  }
  const t = new THREE.Data3DTexture(data, S, S, SZ);
  t.format = THREE.RGBAFormat; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

const SCATTER = /* glsl */`
const float PI = 3.14159265;
const float Re = 6371e3, Ra = 6471e3;
const vec3 bR = vec3(5.802e-6, 13.558e-6, 33.1e-6);
const vec3 bO = vec3(0.650e-6, 1.881e-6, 0.085e-6);
vec2 rsi(vec3 o, vec3 d, float r){ float b = dot(o, d), c = dot(o, o) - r*r, h = b*b - c; if (h < 0.0) return vec2(1e9, -1e9); h = sqrt(h); return vec2(-b - h, -b + h); }
vec3 dens(float h){ return vec3(exp(-h/8000.0), exp(-h/1200.0), max(0.0, 1.0 - abs(h - 25e3)/15e3)); }
vec3 scatter(vec3 rd, vec3 sun, float camH, float mie, float iSun){
  vec3 ro = vec3(0.0, Re + camH, 0.0);
  float tmax = rsi(ro, rd, Ra).y;
  vec2 g = rsi(ro, rd, Re); if (g.x > 0.0) tmax = min(tmax, g.x);
  const int N = 24; vec3 od = vec3(0.0), sR = vec3(0.0), sM = vec3(0.0), sMS = vec3(0.0);
  float bMs = 3.996e-6 * mie, bMe = 4.4e-6 * mie;
  for (int i = 0; i < N; i++){
    float a0 = float(i)/float(N), a1 = float(i+1)/float(N);
    float t0 = tmax*a0*a0, t1 = tmax*a1*a1; float dt = t1 - t0; vec3 p = ro + rd*(t0 + dt*0.5);
    float h = length(p) - Re; vec3 d = dens(max(h, 0.0))*dt; od += d*0.5;
    vec3 tauV = bR*od.x + bMe*od.y + bO*od.z;
    vec2 gl = rsi(p, sun, Re);
    float sh = (gl.x > 0.0 && gl.y > 0.0) ? 0.0 : 1.0;
    float tl = rsi(p, sun, Ra).y; vec3 odl = vec3(0.0);
    for (int j = 0; j < 6; j++){ float b0 = float(j)/6.0, b1 = float(j+1)/6.0; float s0 = tl*b0*b0, s1 = tl*b1*b1; vec3 q = p + sun*(s0+s1)*0.5; odl += dens(max(length(q) - Re, 0.0))*(s1 - s0); }
    vec3 tauL = bR*odl.x + bMe*odl.y + bO*odl.z;
    vec3 att = exp(-(tauV + tauL));
    sR += d.x*att*sh; sM += d.y*att*sh;
    // crude multiple scattering: isotropic skylight that survives where direct light is weak
    sMS += d.x*exp(-tauV)*exp(-tauL*0.35)*mix(0.25, 1.0, sh);
    od += d*0.5;
  }
  float mu = dot(rd, sun), gg = 0.8;
  float pR = 3.0/(16.0*PI)*(1.0 + mu*mu);
  float pM = 3.0/(8.0*PI)*((1.0 - gg*gg)*(1.0 + mu*mu))/((2.0 + gg*gg)*pow(1.0 + gg*gg - 2.0*gg*mu, 1.5));
  vec3 c = iSun*(pR*bR*sR + pM*bMs*sM) + iSun*bR*sMS*(0.022 + 0.01*mie);
  return c;
}
`;

const LUT_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; uniform float uSunEl, uCamH, uMie, uISun;
${SCATTER}
void main(){
  float az = vUv.x*PI; float e = vUv.y*2.0 - 1.0; float el = sign(e)*e*e*PI*0.5;
  vec3 rd = vec3(cos(el)*cos(az), sin(el), cos(el)*sin(az));
  vec3 sun = vec3(cos(uSunEl), sin(uSunEl), 0.0);
  gl_FragColor = vec4(scatter(rd, sun, uCamH, uMie, uISun), 1.0);
}`;

const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }`;

const SKY_COMMON = /* glsl */`
precision highp float; precision highp sampler3D;
varying vec3 vDir;
uniform sampler2D tSky; uniform sampler3D tNoise;
uniform vec3 uSun, uMoon, uSunCol, uLightCol, uGround, uFlashDir, uAmb;
uniform vec4 uCloud;   // base, thickness, coverage, density
uniform vec4 uCloud2;  // wind offset x,z (m), evolve, cirrus
uniform vec4 uMisc;    // camH, time, night, flash
uniform vec4 uFogS;    // height fog density, falloff, base, cube flag
uniform vec3 uFogCol; uniform float uSteps, uAurora, uMoonLight; uniform sampler2D tPano; uniform float uFrame;
${ATMO_GLSL}
const float PI = 3.14159265; const float Rp = 6371e3;
vec3 skyLUT(vec3 d){
  vec2 s = normalize(uSun.xz + vec2(1e-5, 0.0)); vec2 h = normalize(d.xz + vec2(1e-5, 0.0));
  float az = acos(clamp(dot(h, s), -1.0, 1.0)); float el = asin(clamp(d.y, -1.0, 1.0));
  float v = sign(el)*sqrt(abs(el)/(PI*0.5));
  return texture2D(tSky, vec2(az/PI, v*0.5 + 0.5)).rgb;
}
float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
vec3 stars(vec3 d){
  float c = cos(uMisc.y*0.004), s = sin(uMisc.y*0.004); d = vec3(d.x*c - d.z*s, d.y, d.x*s + d.z*c);
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++){
    vec3 p = d*(k == 0 ? 190.0 : 95.0); vec3 i = floor(p); vec3 f = fract(p) - 0.5;
    float h = hash13(i + float(k)*17.0);
    vec3 off = vec3(hash13(i + 3.1), hash13(i + 7.7), hash13(i + 11.3)) - 0.5;
    float dd = length(f - off*0.7);
    float br = step(k == 0 ? 0.93 : 0.975, h)*pow(fract(h*91.7), 3.0);
    float tw = 0.75 + 0.25*sin(uMisc.y*(2.0 + h*5.0) + h*40.0);
    col += smoothstep(k == 0 ? 0.09 : 0.14, 0.0, dd)*br*tw*mix(vec3(1.0, 0.8, 0.6), vec3(0.7, 0.85, 1.0), fract(h*13.0))*(k == 0 ? 1.0 : 3.0);
  }
  // faint band of the galaxy
  float band = exp(-pow(dot(d, normalize(vec3(0.5, 0.3, -0.8)))*3.2, 2.0));
  col += vec3(0.5, 0.6, 0.9)*band*0.012*(0.5 + aFbm(d.xz*14.0 + d.y*9.0));
  return col;
}
float cDens(vec3 p, float h){
  vec2 xz = p.xz + uCloud2.xy;
  float cov = uCloud.z;
  float wm = texture(tNoise, vec3(xz*0.0000135, 0.35)).b;
  cov = clamp(cov + (wm - 0.5)*1.1*(1.0 - abs(cov*2.0 - 1.0)*0.75), 0.0, 1.0);
  float base = textureLod(tNoise, vec3(xz*0.000095, h*0.42 + uCloud2.z), 0.0).r;
  float prof = smoothstep(0.0, 0.1, h)*smoothstep(1.0, 0.35 + 0.5*cov, h);
  float thr = mix(0.74, 0.04, pow(cov, 0.85));
  float d = base*prof - thr;
  if (d <= 0.0) return 0.0;
  float det = textureLod(tNoise, vec3(xz*0.00052 + uCloud2.z, h*2.1), 0.0).g;
  float det2 = textureLod(tNoise, vec3(xz*0.0017 - uCloud2.z*2.0, h*5.0), 0.0).g;
  d = d - ((1.0 - det)*0.3 + (1.0 - det2)*0.12)*smoothstep(0.34, 0.0, d);
  return clamp(1.0 - exp(-max(d, 0.0)*5.5), 0.0, 1.0)*uCloud.w;
}
vec4 clouds(vec3 rd, float dither, out float dist){
  dist = 0.0;
  vec3 o = vec3(0.0, Rp + uMisc.x, 0.0);
  float r0 = Rp + uCloud.x, r1 = r0 + uCloud.y; float ro = length(o);
  float b = dot(o, rd); float c0 = dot(o, o) - r0*r0, c1 = dot(o, o) - r1*r1;
  float h0 = b*b - c0, h1 = b*b - c1; float ta, tb;
  if (ro < r0){ if (rd.y < -0.02) { float cg = dot(o,o) - Rp*Rp; float hg = b*b - cg; if (hg > 0.0 && -b - sqrt(hg) > 0.0) return vec4(0.0, 0.0, 0.0, 1.0); } ta = -b + sqrt(max(h0, 0.0)); tb = -b + sqrt(max(h1, 0.0)); }
  else if (ro < r1){ ta = 0.0; tb = (h0 > 0.0 && -b - sqrt(h0) > 0.0) ? -b - sqrt(h0) : -b + sqrt(max(h1, 0.0)); }
  else { if (h1 < 0.0 || b > 0.0) return vec4(0.0, 0.0, 0.0, 1.0); ta = -b - sqrt(h1); tb = (h0 > 0.0) ? -b - sqrt(h0) : -b + sqrt(h1); }
  tb = min(tb, ta + 26000.0); if (ta > 90000.0 || tb <= ta) return vec4(0.0, 0.0, 0.0, 1.0);
  int N = int(uSteps); float dt = (tb - ta)/float(N);
  float T = 1.0; vec3 col = vec3(0.0); float wsum = 0.0;
  float mu = dot(rd, uSun);
  float ph;
  float g1 = 0.72, g2 = -0.2;
  float hg1 = (1.0 - g1*g1)/pow(1.0 + g1*g1 - 2.0*g1*mu, 1.5), hg2 = (1.0 - g2*g2)/pow(1.0 + g2*g2 - 2.0*g2*mu, 1.5);
  ph = mix(hg2, hg1, 0.55)*0.25 + 0.38;
  float sig = 0.0105;
  vec3 ld = normalize(uSun + vec3(0.0, 0.12, 0.0));
  for (int i = 0; i < 64; i++){
    if (i >= N) break;
    float t = ta + (float(i) + dither)*dt; vec3 p = o + rd*t;
    float h = (length(p) - r0)/uCloud.y; vec3 q = vec3(p.x, 0.0, p.z);
    float d = cDens(q, h);
    if (d > 0.002){
      float ls = 0.0; float st = uCloud.y*0.09;
      for (int j = 1; j <= 4; j++){ vec3 lp = p + ld*st*float(j)*float(j)*0.5; float lh = (length(lp) - r0)/uCloud.y; if (lh > 1.0) break; ls += cDens(vec3(lp.x, 0.0, lp.z), lh)*st*float(j); }
      float Tl = exp(-ls*sig*0.5); Tl = max(Tl, exp(-ls*sig*0.12)*0.42);
      float powder = 1.0 - exp(-d*4.0 - ls*sig*0.5)*0.55;
      vec3 L = uLightCol*Tl*ph*powder*1.05 + uAmb*(0.3 + 0.62*h)*(0.75 + 0.25*Tl);
      L += vec3(0.75, 0.82, 1.0)*uMisc.w*(0.25 + 6.0*pow(max(dot(rd, uFlashDir), 0.0), 6.0));
      float a = 1.0 - exp(-d*sig*dt);
      col += T*a*L; wsum += T*a*t; T *= 1.0 - a;
      if (T < 0.015) { T = 0.0; break; }
    }
  }
  dist = (1.0 - T) > 1e-3 ? wsum/(1.0 - T) : tb;
  return vec4(col, T);
}
vec3 aurora(vec3 d){
  if (d.y < 0.04) return vec3(0.0);
  vec2 p = d.xz/(d.y + 0.35); float t = uMisc.y;
  float w = aNoise(p*1.3 + vec2(t*0.015, 0.0))*2.2;
  float band = smoothstep(0.58, 0.95, aNoise(vec2(p.x*0.9 + w, p.y*0.35 + t*0.01)*1.6));
  float rays = 0.55 + 0.45*aNoise(vec2(p.x*38.0 + w*8.0, t*0.25));
  float fade = smoothstep(0.04, 0.3, d.y)*smoothstep(1.0, 0.55, d.y);
  return (vec3(0.08, 1.0, 0.45) + vec3(0.6, 0.1, 0.7)*smoothstep(0.3, 0.8, d.y))*band*rays*fade*0.09;
}
`;
const DOME_FRAG = SKY_COMMON + /* glsl */`
void main(){
  vec3 d = normalize(vDir);
  vec3 dc = vec3(d.x, max(d.y, 0.0015), d.z);
  vec3 sky = skyLUT(normalize(dc));
  float night = uMisc.z;
  // night sky: airglow, moonlit scattering, stars
  vec3 nsky = vec3(0.0016, 0.0026, 0.0055)*(1.0 + 1.5*pow(1.0 - dc.y, 4.0)) + vec3(0.01, 0.014, 0.024)*uMoonLight*(0.4 + pow(max(dot(d, uMoon), 0.0), 3.0));
  vec3 col = sky + nsky*night;
  float cube = uFogS.w;
  if (night > 0.01 && cube < 0.5) col += stars(d)*night*smoothstep(0.0, 0.25, d.y)*0.6;
  if (uAurora > 0.001) col += aurora(d)*uAurora*night;
  // sun and moon discs
  float mu = dot(d, uSun);
  if (cube < 0.5) {
    float disc = smoothstep(0.99996, 0.999975, mu);
    col += uSunCol*disc*90.0*(0.55 + 0.45*smoothstep(0.99996, 0.99999, mu));
    float mm = dot(d, uMoon);
    float md = smoothstep(0.99985, 0.9999, mm);
    vec3 mp = d*900.0; float mare = 0.75 + 0.25*aNoise(mp.xy*0.9 + mp.z);
    col += vec3(0.85, 0.9, 1.0)*md*mare*0.55*smoothstep(0.02, 0.2, night + 0.05) + vec3(0.5, 0.6, 0.9)*pow(max(mm, 0.0), 900.0)*0.02*night;
  }
  col += uSunCol*pow(max(mu, 0.0), 2200.0)*1.6;
  // clouds
  vec4 c = vec4(0.0, 0.0, 0.0, 1.0);
  if (uCloud.z > 0.01){ vec3 nd = normalize(dc); c = texture2D(tPano, vec2(fract(atan(nd.z, nd.x)/(2.0*PI)), sqrt(max(nd.y, 0.0)))); }
  // cirrus veil
  if (d.y > 0.01 && uCloud2.w > 0.01){
    vec2 cp = d.xz/(d.y + 0.08)*9000.0 + uCloud2.xy*0.3;
    float ci = texture(tNoise, vec3(cp*vec2(0.00002, 0.00006), 0.7)).g*texture(tNoise, vec3(cp*0.000013, 0.2)).b;
    ci = smoothstep(0.22, 0.6, ci)*uCloud2.w*smoothstep(0.0, 0.2, d.y);
    col = mix(col, uLightCol*0.22 + uAmb*0.8, ci*0.5);
  }
  if (c.a < 0.999) col = col*c.a + c.rgb;
  // ground below the horizon
  if (d.y < 0.0) col = mix(col, uGround, smoothstep(0.0, -0.06, d.y));
  // low-lying fog swallows the lower sky
  float bb = uFogS.y; float ya = max(uMisc.x - uFogS.z, -60.0);
  float tt = bb*max(d.y, 0.004)*70000.0; float od = 70000.0*uFogS.x*exp(-bb*ya)*(1.0 - exp(-tt))/tt;
  float sa = max(dot(d, uSun), 0.0);
  col = mix(col, uFogCol*(1.0 + sa*sa*0.4), 1.0 - exp(-od));
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;
const PANO_FRAG = SKY_COMMON + /* glsl */`
varying vec2 vUv; uniform sampler2D tPrev; uniform float uBlend; uniform vec2 uJit;
void main(){
  vec2 uv = vUv + uJit; float y = max(uv.y*uv.y, 0.0015); float az = uv.x*2.0*PI; float ch = sqrt(1.0 - y*y);
  vec3 d = vec3(cos(az)*ch, y, sin(az)*ch);
  float dither = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uFrame*0.6180339);
  float cdist; vec4 c = clouds(d, dither, cdist); vec3 cc = c.rgb;
  if (c.a < 0.999){
    vec3 sky = skyLUT(d); float night = uMisc.z;
    vec3 nsky = vec3(0.0016, 0.0026, 0.0055)*(1.0 + 1.5*pow(1.0 - y, 4.0)) + vec3(0.01, 0.014, 0.024)*uMoonLight*(0.4 + pow(max(dot(d, uMoon), 0.0), 3.0));
    float far = 1.0 - exp(-cdist*0.000028*(1.0 + uFogS.x*900.0));
    cc = mix(c.rgb, (sky + nsky*night)*(1.0 - c.a), far);
  }
  vec4 now = vec4(max(cc, 0.0), c.a);
  gl_FragColor = mix(texture2D(tPrev, vUv), now, uBlend);
}`;

export class Sky {
  constructor(renderer, scene, env) {
    this.renderer = renderer; this.scene = scene; this.env = env;
    this.lutW = 128; this.lutH = 96;
    this.lutRT = new THREE.WebGLRenderTarget(this.lutW, this.lutH, { type: THREE.FloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping });
    this.lutData = new Float32Array(this.lutW * this.lutH * 4);
    this.lutMat = new THREE.ShaderMaterial({ uniforms: { uSunEl: { value: 0.5 }, uCamH: { value: 2 }, uMie: { value: 1 }, uISun: { value: 20 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: LUT_FRAG, depthTest: false, depthWrite: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.lutMat); this.quad.frustumCulled = false;
    this.quadScene = new THREE.Scene(); this.quadScene.add(this.quad); this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.noise = makeCloudNoise();
    this.u = {
      tSky: { value: this.lutRT.texture }, tNoise: { value: this.noise },
      uSun: { value: new THREE.Vector3(0, 1, 0) }, uMoon: { value: new THREE.Vector3(0, -1, 0) },
      uSunCol: { value: new THREE.Color() }, uLightCol: { value: new THREE.Color() }, uGround: { value: new THREE.Color(0.05, 0.06, 0.05) },
      uFlashDir: { value: new THREE.Vector3(1, 0.3, 0) }, uAmb: { value: new THREE.Color() },
      uCloud: { value: new THREE.Vector4(1300, 1700, 0.4, 0.7) }, uCloud2: { value: new THREE.Vector4(0, 0, 0, 0.3) },
      uMisc: { value: new THREE.Vector4(2, 0, 0, 0) }, uFogS: { value: new THREE.Vector4(0, 0.01, 0, 0) }, uFogCol: { value: new THREE.Color() },
      uSteps: { value: Q.steps }, uAurora: { value: 0 }, uMoonLight: { value: 1 }, uA: atmoUniform, tPano: { value: null }, uFrame: { value: 0 },
    };
    // clouds are marched into a direction-space panorama and averaged over frames: no per-pixel noise on screen
    const PW = Q.level >= 2 ? 1280 : Q.level === 1 ? 960 : 640, PH = Q.level >= 2 ? 448 : Q.level === 1 ? 320 : 224;
    const popt = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping, generateMipmaps: false };
    this.panoA = new THREE.WebGLRenderTarget(PW, PH, popt); this.panoB = new THREE.WebGLRenderTarget(PW, PH, popt); this.panoSize = [PW, PH];
    this.panoU = Object.assign({}, this.u, { tPrev: { value: null }, uBlend: { value: 1 }, uJit: { value: new THREE.Vector2() } });
    this.panoMat = new THREE.ShaderMaterial({ uniforms: this.panoU, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: PANO_FRAG, depthTest: false, depthWrite: false });
    this.panoQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.panoMat); this.panoQuad.frustumCulled = false; this.panoScene = new THREE.Scene(); this.panoScene.add(this.panoQuad);
    this.panoFresh = true; this.lastAlt = null;
    const mk = () => new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false });
    this.mat = mk();
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), this.mat);
    this.dome.frustumCulled = false; this.dome.renderOrder = 900; this.dome.matrixAutoUpdate = false;
    scene.add(this.dome);
    // capture scene for reflections and image-based lighting
    this.capScene = new THREE.Scene(); this.capDome = new THREE.Mesh(this.dome.geometry, mk()); this.capDome.material.depthTest = false; this.capDome.scale.setScalar(50); this.capScene.add(this.capDome);
    this.cubeRT = new THREE.WebGLCubeRenderTarget(Q.level >= 2 ? 512 : 256, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    this.cubeCam = new THREE.CubeCamera(1, 200, this.cubeRT);
    this.pmrem = new THREE.PMREMGenerator(renderer); this.envRT = null;
    this.envTimer = 0; this.envLum0 = 1; this.envStage = 0; this.lastKey = '';

    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(Q.shadow, Q.shadow);
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.06; this.sun.shadow.radius = 2.5;
    scene.add(this.sun); scene.add(this.sun.target);
    this.shadowRange = 120;
    this.fogCol = new THREE.Color(); this.fogSun = new THREE.Color(); this.amb = new THREE.Color(); this.zen = new THREE.Color();
    this.world = { cloudBase: 1300, cloudThick: 1700, cirrus: 0.3, fogBase: 0, fogFalloff: 0.012, fogDensity: 0, aurora: 0, ground: new THREE.Color(0.06, 0.07, 0.06), hazeMul: 1 };
    this._c = new THREE.Color(); this._v = new THREE.Vector3(); this.lumNow = 1; this.frame = 0;
  }
  sample(dir, out) { // CPU lookup of the clear-sky LUT
    const s = this.env.sunDir; let hx = dir.x, hz = dir.z; const hl = Math.hypot(hx, hz) || 1; let sx = s.x, sz = s.z; const sl = Math.hypot(sx, sz) || 1;
    const az = Math.acos(clamp((hx * sx + hz * sz) / (hl * sl), -1, 1)); const el = Math.asin(clamp(dir.y, -1, 1));
    const v = Math.sign(el) * Math.sqrt(Math.abs(el) / (Math.PI / 2)) * 0.5 + 0.5;
    const x = clamp(az / Math.PI) * (this.lutW - 1), y = clamp(v) * (this.lutH - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, this.lutW - 1), y1 = Math.min(y0 + 1, this.lutH - 1), fx = x - x0, fy = y - y0;
    const D = this.lutData, W = this.lutW; const g = (X, Y, c) => D[(Y * W + X) * 4 + c];
    const ch = (c) => lerp(lerp(g(x0, y0, c), g(x1, y0, c), fx), lerp(g(x0, y1, c), g(x1, y1, c), fx), fy);
    return out.setRGB(ch(0), ch(1), ch(2));
  }
  update(camera, dt, camAlt) {
    const env = this.env, w = env.w, W = this.world, r = this.renderer, u = this.u; this.frame++;
    // 1. sky LUT
    this.lutMat.uniforms.uSunEl.value = env.sunElev; this.lutMat.uniforms.uCamH.value = clamp(camAlt, 1, 9000);
    this.lutMat.uniforms.uMie.value = w.haze * W.hazeMul;
    const prevRT = r.getRenderTarget();
    r.setRenderTarget(this.lutRT); r.render(this.quadScene, this.quadCam);
    if (this.frame % 6 === 1 || this.frame < 4) r.readRenderTargetPixels(this.lutRT, 0, 0, this.lutW, this.lutH, this.lutData);
    r.setRenderTarget(prevRT);

    // 2. derive fog / ambient colours from the sky
    const v = this._v, c = this._c;
    const sun = env.sunDir; const hl = Math.hypot(sun.x, sun.z) || 1;
    this.sample(v.set(sun.x / hl * 0.999, 0.035, sun.z / hl * 0.999), this.fogSun);
    this.sample(v.set(-sun.z / hl, 0.05, sun.x / hl), this.fogCol);
    this.sample(v.set(-sun.x / hl, 0.05, -sun.z / hl), c); this.fogCol.lerp(c, 0.5);
    this.sample(v.set(0.1, 0.995, 0), this.zen);
    this.amb.copy(this.zen).lerp(this.fogCol, 0.35);
    const night = env.night;
    const nightAmb = 0.0045 * (0.4 + 0.6 * (1 - env.cloudOcc * 0.7));
    this.amb.r += 0.5 * nightAmb * night; this.amb.g += 0.7 * nightAmb * night; this.amb.b += 1.25 * nightAmb * night;
    this.fogCol.r += 0.0034 * night; this.fogCol.g += 0.005 * night; this.fogCol.b += 0.01 * night;
    this.fogSun.r += 0.0022 * night; this.fogSun.g += 0.0032 * night; this.fogSun.b += 0.006 * night;
    // overcast: sky light becomes grey and dimmer, fog follows the cloud base colour
    const oc = smooth(0.5, 1.0, w.cloud);
    const lum = (col) => 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
    const sunUp = smooth(-0.1, 0.25, env.sunDir.y);
    const dark = clamp(1.0 - 0.42 * oc * w.dens);
    const greyL = (lum(this.zen) * 1.6 + lum(this.fogCol) * 0.7 + 0.5 * sunUp * lum(env.sunColor) * 0.25) * dark;
    c.setRGB(greyL * 0.94, greyL * 0.98, greyL * 1.06);
    const fogMix = clamp(oc * 0.85 + w.fog * 0.6);
    this.fogCol.lerp(c, fogMix); this.fogSun.lerp(c, clamp(fogMix * 0.8 + w.fog * 0.2));
    this.amb.lerp(c, oc * 0.8);
    if (w.fog > 0.01) { const fl = lum(this.fogCol) + env.lightIntensity * lum(env.lightColor) * 0.035 * w.fog; c.setRGB(fl * 0.97, fl, fl * 1.04); this.fogCol.lerp(c, w.fog * 0.6); this.fogSun.lerp(c, w.fog * 0.5); }
    if (W.fogTint) { this.fogCol.lerp(c.copy(W.fogTint).multiplyScalar(lum(this.fogCol) * 3), W.fogTintAmt || 0.5); this.fogSun.lerp(c.copy(W.fogTint).multiplyScalar(lum(this.fogSun) * 3), (W.fogTintAmt || 0.5) * 0.7); }

    const fogDensity = W.fogDensity + w.fog * 0.013 + env.precipRain * 0.0009 + env.precipSnow * 0.0022;
    const fogFalloff = lerp(W.fogFalloff, 0.004, clamp(w.fog));
    env.writeUniforms(this.fogCol, this.fogSun, fogDensity, fogFalloff, W.fogBase);

    // 3. dome uniforms
    u.uSun.value.copy(env.sunDir); u.uMoon.value.copy(env.moonDir); u.uSunCol.value.copy(env.sunColor).multiplyScalar(smooth(-0.03, 0.02, env.sunDir.y) * (1 - w.fog * 0.85));
    u.uLightCol.value.copy(env.lightColor).multiplyScalar(env.sunDir.y > -0.06 ? 6.5 * smooth(-0.07, 0.03, env.sunDir.y) + 0.012 * night : 0.02 * night + 0.004);
    if (env.sunDir.y <= -0.06) u.uLightCol.value.setRGB(0.5, 0.62, 1.0).multiplyScalar(0.02 * night + 0.003);
    u.uAmb.value.copy(this.zen).multiplyScalar(1.0).lerp(c.setRGB(lum(this.zen), lum(this.zen), lum(this.zen) * 1.05), 0.35);
    u.uAmb.value.r += 0.003 * night; u.uAmb.value.g += 0.004 * night; u.uAmb.value.b += 0.007 * night;
    const thick = lerp(W.cloudThick, W.cloudThick * 2.4, smooth(0.8, 1.0, w.cloud) * clamp(w.dens - 0.5));
    const base = lerp(W.cloudBase, W.cloudBase * 0.6, smooth(0.85, 1.0, w.cloud));
    u.uCloud.value.set(base, thick, w.cloud, w.dens);
    const sp = 6 + env.wind * 34;
    u.uCloud2.value.x += env.windDir.x * sp * dt; u.uCloud2.value.y += env.windDir.y * sp * dt; u.uCloud2.value.z += dt * 0.0016; u.uCloud2.value.w = W.cirrus * (1 - oc);
    u.uMisc.value.set(camAlt, env.time, night, env.flash); u.uFlashDir.value.copy(env.flashDir);
    u.uFogS.value.set(fogDensity, fogFalloff, W.fogBase, 0); u.uFogCol.value.copy(this.fogCol);
    u.uSteps.value = Q.steps; u.uAurora.value = W.aurora * (1 - oc);
    // lit ground below the horizon (bounce light for the environment map)
    const E = env.lightIntensity * Math.max(env.lightDir.y, 0) * lum(env.lightColor) / Math.PI + lum(this.amb);
    u.uGround.value.copy(W.ground).multiplyScalar(E * 1.0);

    // update the cloud panorama
    if (this.forceEnv) this.panoFresh = true;
    { const steps = Math.min(64, Math.round(Q.steps * 1.6)); const keep = u.uSteps.value; u.uSteps.value = steps; u.uFrame.value = (u.uFrame.value + 1) % 4096;
      if (this.lastAlt == null || Math.abs(camAlt - this.lastAlt) > 300) this.panoFresh = true; this.lastAlt = camAlt;
      const t = this.panoA; this.panoA = this.panoB; this.panoB = t; const f = u.uFrame.value;
      this.panoU.tPrev.value = this.panoB.texture; this.panoU.uBlend.value = this.panoFresh ? 1 : 0.2;
      this.panoU.uJit.value.set((((f * 0.7548777) % 1) - 0.5) / this.panoSize[0], (((f * 0.5698403) % 1) - 0.5) / this.panoSize[1]);
      const pr = r.getRenderTarget(); r.setRenderTarget(this.panoA); r.render(this.panoScene, this.quadCam); r.setRenderTarget(pr);
      u.tPano.value = this.panoA.texture; u.uSteps.value = keep; this.panoFresh = false; }
    this.dome.matrix.makeScale(camera.far * 0.85, camera.far * 0.85, camera.far * 0.85).setPosition(camera.position);
    this.dome.matrixWorld.copy(this.dome.matrix);

    // 4. light
    this.sun.color.copy(env.lightColor); this.sun.intensity = env.lightIntensity + env.flash * 2.5;
    this.lumNow = lum(this.amb) + env.lightIntensity * 0.02;

    // 5. environment capture, throttled
    this.envTimer -= dt;
    const key = [env.hour.toFixed(2), w.cloud.toFixed(2), w.dens.toFixed(1), w.fog.toFixed(2), w.haze.toFixed(1), camAlt > 1500 ? 1 : 0].join();
    if (this.envStage === 1) { this._pmrem(); this.envStage = 0; }
    else if ((this.envTimer <= 0 && key !== this.lastKey) || this.forceEnv) {
      this.lastKey = key; this.forceEnv = false; this.envTimer = Q.level >= 2 ? 1.2 : 4;
      u.uFogS.value.w = 1;
      const xr = r.xr.enabled; this.cubeCam.position.set(0, 0, 0); this.cubeCam.update(r, this.capScene);
      u.uFogS.value.w = 0; this.envStage = 1; this.envLum0 = this.lumNow;
    }
    this.scene.environmentIntensity = clamp(this.lumNow / Math.max(this.envLum0, 1e-5), 0.3, 3) * (1 + env.flash * 3);
  }
  _pmrem() {
    const rt = this.pmrem.fromCubemap(this.cubeRT.texture);
    if (this.envRT) this.envRT.dispose(); this.envRT = rt; this.scene.environment = rt.texture;
  }
  updateShadow(focus, range) {
    const s = this.sun, cam = s.shadow.camera, R = range || this.shadowRange;
    if (cam.right !== R) { cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.near = 1; cam.far = R * 6; cam.updateProjectionMatrix(); }
    const texel = (2 * R) / s.shadow.mapSize.x; s.shadow.normalBias = texel * 1.8; s.shadow.bias = -0.0002 - texel * 0.0012;
    const d = this.env.lightDir;
    // snap the focus point in light space so shadows do not shimmer when the camera moves
    const up = Math.abs(d.y) > 0.99 ? _x : _y; _r.crossVectors(up, d).normalize(); _u.crossVectors(d, _r);
    const fx = Math.round(focus.dot(_r) / texel) * texel, fy = Math.round(focus.dot(_u) / texel) * texel, fz = focus.dot(d);
    _f.set(0, 0, 0).addScaledVector(_r, fx).addScaledVector(_u, fy).addScaledVector(d, fz);
    s.target.position.copy(_f); s.position.copy(_f).addScaledVector(d, R * 3); s.target.updateMatrixWorld(); s.updateMatrixWorld();
  }
}
const _x = new THREE.Vector3(1, 0, 0), _y = new THREE.Vector3(0, 1, 0), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3();
