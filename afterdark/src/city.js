// The city: a rain-soaked grid of avenues, towers with lit rooms behind every window, neon signage,
// street lamps and signals. Everything is generated here; the only files loaded are the asphalt textures.
import * as THREE from '/evermile/vendor/three.module.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';

export const P = 120, ROADS = 7, HALF = 10, SW = 4, SPAN = P * (ROADS - 1), DRIVE = HALF + 0.75;
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const NEON = [0x19e3ff, 0xff2bd6, 0xffa329, 0x8a5cff, 0xff3048, 0x38ffb0, 0xfff1d0, 0x2f7bff];
const dummy = new THREE.Object3D(), col = new THREE.Color();
const GLSL_HASH = 'float adH(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }\nfloat adN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(adH(i), adH(i + vec2(1, 0)), f.x), mix(adH(i + vec2(0, 1)), adH(i + vec2(1, 1)), f.x), f.y); }\n';

// Cycle of a junction's signals: 'g', 'y' or 'r' for traffic travelling along the given axis.
export function signal(i, j, axis, t) { const ph = (t + ((i + j) & 1) * 8 + (axis === 'z' ? 8 : 0)) % 16; return ph < 6 ? 'g' : ph < 7.5 ? 'y' : 'r'; }

function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

function roadMaterial(refl) {
  const L = new THREE.TextureLoader(), rep = 190;
  const tex = (s, srgb) => { const t = L.load(`/evermile/assets/materials/asphalt_03_${s}_1k.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 16; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const m = new THREE.MeshStandardMaterial({ map: tex('diff', true), normalMap: tex('nor_gl'), roughnessMap: tex('rough'), roughness: 1, metalness: 0, envMapIntensity: 0.15, normalScale: new THREE.Vector2(0.8, 0.8) });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, refl.uniforms);
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform sampler2D uRefl; uniform mat4 uReflVP; uniform float uReflOn, uTime; varying vec3 vWPos;\n${GLSL_HASH}
// Painted lines for one carriageway: lat = distance from the centre line, along = distance from the nearest junction.
vec2 adMark(float lat, float sLat, float along, float run){
  float white = 0.0, yellow = 0.0;
  if (lat < ${HALF.toFixed(1)} && along > ${HALF.toFixed(1)}) {
    float open = step(16.5, along);
    yellow = open * (1.0 - smoothstep(0.065, 0.08, abs(lat - 0.2)));
    white = open * (1.0 - smoothstep(0.065, 0.08, abs(lat - 3.7))) * step(fract(run / 9.0), 0.36);
    white = max(white, step(20.0, along) * (1.0 - smoothstep(0.05, 0.065, abs(lat - 7.4))));
    white = max(white, step(abs(along - 15.0), 0.25) * step(lat, 7.4));
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
  float adPud = smoothstep(0.52, 0.7, adN(adW * 0.045) * 0.65 + adN(adW * 0.19 + 7.0) * 0.35 + smoothstep(6.6, 9.7, min(adA.x, adA.y)) * 0.22);
  adPud *= 1.0 - max(adMk.x, adMk.y) * 0.5;
  // Repair patches, manhole covers and kerb-side drains.
  vec2 adPc = floor(adW / vec2(17.0, 31.0)); float adPatch = step(0.72, adH(adPc)) * step(abs(fract(adW.x / 17.0) - 0.5), 0.12 + 0.2 * adH(adPc + 3.0)) * step(abs(fract(adW.y / 31.0) - 0.5), 0.1 + 0.3 * adH(adPc + 7.0));
  vec2 adMc = floor(adW / 23.0); vec2 adMo = (fract(adW / 23.0) - 0.5 - (vec2(adH(adMc + 1.0), adH(adMc + 2.0)) - 0.5) * 0.6) * 23.0; float adMd = length(adMo);
  float adHole = (1.0 - smoothstep(0.4, 0.43, adMd)) * step(0.45, adH(adMc + 5.0));
  float adLatK = min(adA.x, adA.y), adRunK = adA.x < adA.y ? adW.y : adW.x;
  float adDrain = step(abs(adLatK - ${(HALF - 0.32).toFixed(2)}), 0.2) * step(abs(fract(adRunK / 15.0) - 0.5), 0.022) * step(${(HALF + 2).toFixed(1)}, max(adA.x, adA.y));
  adPud *= (1.0 - adPatch) * (1.0 - adHole);
  diffuseColor.rgb *= mix(0.5, 0.24, adPud) * mix(1.0, 0.6, adPatch);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.045, 0.045, 0.05) * (0.7 + 0.6 * step(0.5, fract(adMo.x * 6.0)) * step(0.5, fract(adMo.y * 6.0))), adHole);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012) + 0.03 * step(0.5, fract(adRunK * 14.0)), adDrain);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.62, 0.6), adMk.x * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66, 0.47, 0.08), adMk.y * 0.9);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(clamp(roughnessFactor * 0.52 + 0.08, 0.16, 0.6), 0.025, adPud);
  roughnessFactor = mix(roughnessFactor, 0.3, max(adMk.x, adMk.y) * (1.0 - adPud));
  roughnessFactor = mix(mix(roughnessFactor, 0.7, adPatch), 0.3, adHole);`)
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
    float adBias = roughnessFactor * 9.5 + smoothstep(120.0, 500.0, adDist) * 1.5;
    float adSpread = roughnessFactor * 0.11 + 0.0015;
    vec3 adCol = vec3(0.0);
    adCol += texture2D(uRefl, adUv + adDis, adBias).rgb * 0.32;
    adCol += texture2D(uRefl, adUv + adDis + vec2(0.0, adSpread), adBias).rgb * 0.2;
    adCol += texture2D(uRefl, adUv + adDis - vec2(0.0, adSpread), adBias).rgb * 0.2;
    adCol += texture2D(uRefl, adUv + adDis + vec2(0.0, adSpread * 2.2), adBias + 0.6).rgb * 0.14;
    adCol += texture2D(uRefl, adUv + adDis - vec2(0.0, adSpread * 2.2), adBias + 0.6).rgb * 0.14;
    float adWet = mix(0.3, 1.0, adPud) * (1.0 - roughnessFactor * 0.7);
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
    const person = (x, y, h, col = '#0b0b0e') => { c.fillStyle = col; c.beginPath(); c.arc(x, y - h * 0.9, h * 0.1, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - h * 0.17, y); c.lineTo(x - h * 0.2, y - h * 0.68); c.quadraticCurveTo(x, y - h * 0.84, x + h * 0.2, y - h * 0.68); c.lineTo(x + h * 0.17, y); c.fill(); };
    const shelves = (x, y, w, h, rows, pal) => { for (let i = 0; i < rows; i++) { const yy = y + i * h / rows; c.fillStyle = 'rgba(20,20,24,.9)'; c.fillRect(x, yy + h / rows - 5, w, 5); for (let px = x + 3; px < x + w - 8;) { const pw = 7 + r() * 13, ph = (h / rows - 9) * (0.55 + r() * 0.45); c.fillStyle = pal[Math.floor(r() * pal.length)]; c.fillRect(px, yy + h / rows - 5 - ph, pw, ph); px += pw + 2; } } };
    const themes = [
      (x, y) => { c.fillStyle = '#d9dde0'; c.fillRect(x, y, S, S); shelves(x + 20, y + 120, 300, 250, 5, ['#e14b3b', '#f2c230', '#3b8fe1', '#44b46a', '#f4f4f4', '#f08a2c']); c.fillStyle = '#bfe9ff'; c.fillRect(x + 340, y + 110, 150, 270); glow(x + 415, y + 245, 190, 'rgba(160,230,255,.9)', 0.7); for (let i = 0; i < 4; i++) { c.fillStyle = '#5a8aa6'; c.fillRect(x + 345, y + 170 + i * 55, 140, 4); } c.fillStyle = '#f7f7f2'; c.fillRect(x, y + 20, S, 26); c.fillStyle = '#8a8f96'; c.fillRect(x, y + 400, S, 112); person(x + 300, y + 420, 210); },
      (x, y) => { const g = c.createLinearGradient(x, y, x, y + S); g.addColorStop(0, '#3a140c'); g.addColorStop(1, '#7a2c14'); c.fillStyle = g; c.fillRect(x, y, S, S); for (let i = 0; i < 5; i++) { glow(x + 60 + i * 98, y + 110, 70, 'rgba(255,120,50,.95)'); c.fillStyle = '#e6341c'; c.beginPath(); c.ellipse(x + 60 + i * 98, y + 110, 24, 32, 0, 0, 7); c.fill(); } c.fillStyle = '#1a0d08'; c.fillRect(x, y + 330, S, 182); c.fillStyle = '#c98a4a'; c.fillRect(x, y + 318, S, 16); c.fillStyle = '#20100a'; c.fillRect(x + 40, y + 180, 430, 60); c.fillStyle = '#ffe2a8'; for (let i = 0; i < 6; i++) c.fillRect(x + 56 + i * 70, y + 195, 46, 7 + (i % 3) * 8); person(x + 150, y + 330, 190); person(x + 360, y + 330, 175); },
      (x, y) => { c.fillStyle = '#c9d6de'; c.fillRect(x, y, S, S); c.fillStyle = '#eef4f7'; c.fillRect(x, y + 30, S, 20); for (let i = 0; i < 5; i++) { const cx = x + 56 + i * 100, cy = y + 290; c.fillStyle = '#f2f4f5'; c.fillRect(cx - 44, cy - 80, 88, 170); c.fillStyle = '#2a3440'; c.beginPath(); c.arc(cx, cy, 32, 0, 7); c.fill(); c.strokeStyle = '#9fb2c0'; c.lineWidth = 6; c.stroke(); c.fillStyle = 'rgba(120,200,255,.5)'; c.beginPath(); c.arc(cx, cy, 22, 0, 7); c.fill(); } c.fillStyle = '#7d8a93'; c.fillRect(x, y + 440, S, 72); },
      (x, y) => { c.fillStyle = '#e9f2ec'; c.fillRect(x, y, S, S); shelves(x + 20, y + 150, 470, 230, 4, ['#ffffff', '#3fa46a', '#2f7fd0', '#f0f0f0', '#e2574c']); glow(x + 256, y + 80, 120, 'rgba(60,255,140,.95)'); c.fillStyle = '#12c060'; c.fillRect(x + 236, y + 40, 40, 100); c.fillRect(x + 206, y + 70, 100, 40); c.fillStyle = '#b9c7bf'; c.fillRect(x, y + 400, S, 112); c.fillStyle = '#f5f8f6'; c.fillRect(x + 150, y + 380, 220, 60); person(x + 255, y + 400, 190, '#1a2a22'); },
      (x, y) => { const g = c.createLinearGradient(x, y, x, y + S); g.addColorStop(0, '#2b1d14'); g.addColorStop(1, '#5a3c26'); c.fillStyle = g; c.fillRect(x, y, S, S); for (let i = 0; i < 4; i++) { c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 80 + i * 118, y); c.lineTo(x + 80 + i * 118, y + 130); c.stroke(); glow(x + 80 + i * 118, y + 150, 95, 'rgba(255,200,120,.95)'); c.fillStyle = '#ffe9c0'; c.beginPath(); c.arc(x + 80 + i * 118, y + 140, 15, 0, 7); c.fill(); } c.fillStyle = '#141009'; c.fillRect(x + 30, y + 210, 200, 90); c.fillStyle = '#e8d8b8'; for (let i = 0; i < 5; i++) c.fillRect(x + 44, y + 224 + i * 14, 90 + (i * 37 % 70), 4); c.fillStyle = '#1c130c'; c.fillRect(x, y + 400, S, 112); for (let i = 0; i < 3; i++) { c.fillStyle = '#3b2a1c'; c.fillRect(x + 60 + i * 150, y + 372, 90, 10); c.fillRect(x + 100 + i * 150, y + 380, 10, 60); } person(x + 400, y + 400, 185); },
      (x, y) => { c.fillStyle = '#0b0714'; c.fillRect(x, y, S, S); for (let i = 0; i < 6; i++) { const cx = x + 20 + i * 82, hue = (i * 67) % 360; c.fillStyle = '#15121f'; c.fillRect(cx, y + 190, 66, 250); c.fillStyle = `hsl(${hue},95%,60%)`; c.fillRect(cx + 7, y + 205, 52, 62); glow(cx + 33, y + 236, 80, `hsla(${hue},95%,60%,.9)`, 0.8); c.fillStyle = `hsl(${(hue + 150) % 360},90%,60%)`; c.fillRect(cx + 7, y + 160, 52, 16); } c.strokeStyle = '#ff2bd6'; c.lineWidth = 6; c.shadowColor = '#ff2bd6'; c.shadowBlur = 20; c.strokeRect(x + 30, y + 40, 452, 80); c.shadowBlur = 0; person(x + 140, y + 445, 170); person(x + 330, y + 445, 185); },
      (x, y) => { c.fillStyle = '#ece8e2'; c.fillRect(x, y, S, S); for (let i = 0; i < 4; i++) glow(x + 70 + i * 124, y + 30, 150, 'rgba(255,250,235,.9)', 0.8); for (let i = 0; i < 3; i++) { const cx = x + 100 + i * 150; c.fillStyle = ['#23262d', '#7a1f2a', '#2c3a55'][i]; c.beginPath(); c.arc(cx, y + 170, 22, 0, 7); c.fill(); c.beginPath(); c.moveTo(cx - 44, y + 400); c.lineTo(cx - 50, y + 215); c.quadraticCurveTo(cx, y + 185, cx + 50, y + 215); c.lineTo(cx + 44, y + 400); c.fill(); c.fillStyle = '#c9c4bb'; c.fillRect(cx - 34, y + 400, 68, 12); } c.fillStyle = '#b5aea3'; c.fillRect(x, y + 412, S, 100); },
      (x, y) => { c.fillStyle = '#120a06'; c.fillRect(x, y, S, S); const g = c.createLinearGradient(x, y + 90, x, y + 330); g.addColorStop(0, '#ffb24a'); g.addColorStop(1, '#a3470f'); c.fillStyle = g; c.fillRect(x + 40, y + 90, 432, 230); for (let row = 0; row < 3; row++) { c.fillStyle = '#1a0e07'; c.fillRect(x + 40, y + 160 + row * 76, 432, 8); for (let i = 0; i < 20; i++) { c.fillStyle = ['#2a1608', '#40210c', '#0f2a1c', '#3a0d10'][Math.floor(r() * 4)]; const bh = 34 + r() * 26; c.fillRect(x + 50 + i * 21, y + 160 + row * 76 - bh, 13, bh); } } c.fillStyle = '#2a170c'; c.fillRect(x, y + 372, S, 140); c.fillStyle = '#6b3a1a'; c.fillRect(x, y + 360, S, 14); person(x + 120, y + 372, 175); person(x + 250, y + 372, 190); person(x + 395, y + 372, 180); }
    ];
    themes.forEach((t, k) => { const x = (k % 4) * S, y = Math.floor(k / 4) * S; c.save(); c.beginPath(); c.rect(x, y, S, S); c.clip(); t(x, y); c.restore(); });
  });
}

function buildingMaterial(timeU) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, envMapIntensity: 1.0 });
  const shop = shopAtlas();
  m.onBeforeCompile = sh => {
    sh.uniforms.uShop = { value: shop }; sh.uniforms.uTime = timeU;
    sh.vertexShader = 'attribute vec4 aInfo; varying vec3 vWPos; varying vec3 vWN; flat varying vec4 vInfo;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(instanceMatrix) * normal); vInfo = aInfo;`);
    sh.fragmentShader = `uniform sampler2D uShop; uniform float uTime; varying vec3 vWPos; varying vec3 vWN; flat varying vec4 vInfo;\n${GLSL_HASH}` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  vec3 adNw = normalize(vWN); float adWall = step(abs(adNw.y), 0.5);
  vec3 adTw = normalize(vec3(-adNw.z, 0.0, adNw.x) + vec3(1e-5, 0.0, 0.0));
  float adSi = vInfo.x, vSeed = adSi / 4096.0;
  float adGlassT = step(vInfo.y, 0.5), adBrickT = step(0.5, vInfo.y) * step(vInfo.y, 1.5), adConcT = step(1.5, vInfo.y);
  float adU = dot(vWPos, adTw) + mod(adSi, 37.0), adV = vWPos.y;
  float adS2 = fract(vSeed * 13.7), adS3 = fract(vSeed * 29.3);
  float adGround = step(adV, 5.3);
  float adCw = mix(vInfo.z, 6.0, adGround), adCh = mix(vInfo.w, 5.2, adGround);
  vec2 adUV = vec2(adU / adCw, (adV - 0.1) / adCh); vec2 adCell = floor(adUV), adFr = fract(adUV);
  float adFx = mix(adGlassT * 0.035 + adBrickT * (0.18 + 0.07 * adS3) + adConcT * 0.02, 0.03, adGround);
  float adFy = mix(adGlassT * 0.25 + adBrickT * 0.27 + adConcT * 0.36, 0.09, adGround);
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
  // Curtain wall: dark spandrel glass between aluminium mullions.
  float adMull = 1.0 - smoothstep(0.0, 0.01, min(adFr.x, 1.0 - adFr.x) - 0.022);
  vec3 adCurt = mix(mix(vec3(0.05, 0.07, 0.095), vec3(0.09, 0.08, 0.07), step(0.6, adS3)), vec3(0.22, 0.23, 0.25), adMull);
  vec3 adFacade = adGlassT * adCurt + adBrickT * adBrick + adConcT * adConc;
  float adFascia = adGround * step(1.0 - adTop, adFr.y);
  adFacade = mix(adFacade, mix(vec3(0.02, 0.022, 0.028), vec3(0.09, 0.05, 0.04), step(0.5, fract(adSi * 0.37))) * adGrime, max(adFascia, adGround * (1.0 - adGlassT) * 0.6));
  diffuseColor.rgb = mix(mix(vec3(0.035, 0.036, 0.04) * adGrime, adFacade, adWall), vec3(0.3, 0.36, 0.45), adWin);
  // Which rooms have their lights on.
  vec2 adId = adCell + vec2(adSi, mod(adSi, 61.0));
  float adHc = adH(adId);
  float adFloorLit = step(adH(vec2(adCell.y, adSi)), 0.2);
  float adLit = max(step(adHc, mix(0.16, 0.44, fract(vSeed * 5.3)) + adBrickT * 0.06), adFloorLit * step(adHc, 0.8) * (1.0 - adBrickT));
  adLit = mix(adLit, step(adHc, 0.7), adGround);
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
  adLc = mix(adLc, vec3(1.0, 0.96, 0.9), adGround);
  float adBlind = step(adH(adId + 5.0), 0.3) * step(0.25 + 0.6 * adH(adId + 11.0), adFr.y) * (1.0 - adGround);
  adRoom = mix(adRoom, vec3(0.3) * (0.8 + 0.2 * step(0.5, fract(adFr.y * 26.0))), adBlind);
  vec3 adEmit = adRoom * adLc * adWin * adLit * mix(1.15, 1.25, adGround);
  // Shut shops pull down a ribbed shutter.
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.072, 0.08) * (0.7 + 0.3 * step(0.5, fract(adV * 9.0))), adGround * adWin * (1.0 - adLit));
  float adShut = adGround * adWin * (1.0 - adLit);
  float adWallR = mix(0.5, 0.9, adN(vec2(adU * 0.5, adV * 0.5) + adSi)) * adStreak;
  float adWallRough = adGlassT * mix(0.16, 0.4, adMull) + adBrickT * (adWallR + 0.1) + adConcT * adWallR;
  float adWallMetal = adGlassT * mix(0.75, 1.0, adMull);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(mix(0.85, adWallRough, adWall), mix(0.08, 0.6, adShut), adWin);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = mix(adWallMetal * adWall * (1.0 - adGround), mix(0.85, 0.5, adShut), adWin);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += adEmit;');
  };
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

export function buildCity(scene, refl, quality) {
  const R = rng(20261122), city = { lamps: [], signalsAt: [], update: () => {}, spawn: { x: P * 3 - 5.5, z: P * 3 + 40 } };
  const ext = P * ROADS + P; // ground covers the outer ring of blocks too

  // ---- Sky: overcast night lit from below by the city ----
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vD;\n${GLSL_HASH} void main(){ float h = max(vD.y, 0.0); vec2 p = vD.xz / (h + 0.18);
      float cl = adN(p * 1.3) * 0.6 + adN(p * 3.1 + 4.0) * 0.4;
      vec3 glow = mix(vec3(0.20, 0.09, 0.22), vec3(0.06, 0.10, 0.20), smoothstep(-1.0, 1.0, vD.x));
      vec3 c = mix(glow * (0.55 + 0.6 * cl), vec3(0.012, 0.015, 0.028) + glow * 0.16 * cl, smoothstep(0.0, 0.55, h));
      gl_FragColor = vec4(c, 1.0); }` }));
  sky.renderOrder = -10; scene.add(sky); city.sky = sky;
  scene.fog = new THREE.FogExp2(0x0e0b18, 0.0021);
  scene.add(new THREE.HemisphereLight(0x33325a, 0x120d16, 0.42));

  // ---- Road surface ----
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ext + 240, ext + 240), roadMaterial(refl)); road.rotation.x = -Math.PI / 2; road.position.set(SPAN / 2, 0, SPAN / 2); scene.add(road);
  refl.hide.push(road);

  // ---- Pavement slabs ----
  const pave = canvasTex(512, 512, (c, w) => { c.fillStyle = '#3d3d42'; c.fillRect(0, 0, w, w); const r = rng(5); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 52 + r() * 16; c.fillStyle = `rgb(${v},${v},${v + 4})`; c.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } const img = c.getImageData(0, 0, w, w); for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 18; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; } c.putImageData(img, 0, 0); });
  pave.wrapS = pave.wrapT = THREE.RepeatWrapping; pave.repeat.set(22, 22);
  const slabSize = P - HALF * 2, blocks = [];
  for (let i = -1; i < ROADS; i++) for (let j = -1; j < ROADS; j++) blocks.push({ i, j, cx: (i + 0.5) * P, cz: (j + 0.5) * P });
  const slabHalf = (P - HALF * 2) / 2;
  const slabMat = new THREE.MeshStandardMaterial({ map: pave, roughness: 0.4, metalness: 0, envMapIntensity: 0.12, color: 0x8d8d95 });
  slabMat.onBeforeCompile = sh => { Object.assign(sh.uniforms, refl.uniforms);
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform sampler2D uRefl; uniform mat4 uReflVP; uniform float uReflOn; varying vec3 vWPos;\n${GLSL_HASH}` + sh.fragmentShader
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  vec2 adL = abs(fract(vWPos.xz / 120.0) - 0.5) * 120.0; float adEdge = 50.0 - max(adL.x, adL.y); float adKerb = step(adEdge, 0.34) * step(0.16, vWPos.y); float adRunS = adL.x > adL.y ? vWPos.z : vWPos.x;\n  float adPd = smoothstep(0.5, 0.72, adN(vWPos.xz * 0.11 + 3.0)) * (1.0 - adKerb); roughnessFactor = mix(mix(0.42, 0.55, adKerb), 0.05, adPd); diffuseColor.rgb *= mix(0.62, 0.36, adPd);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.13, 0.135) * (0.8 + 0.3 * adH(vec2(floor(adRunS / 0.9), 2.0))) * (1.0 - 0.6 * step(fract(adRunS / 0.9), 0.03)), adKerb);')
      .replace('#include <opaque_fragment>', `{ vec4 adRc = uReflVP * vec4(vWPos.x, 0.0, vWPos.z, 1.0); vec2 adUv = adRc.xy / adRc.w * 0.5 + 0.5; float adNdv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float adF = (0.03 + 0.97 * pow(1.0 - adNdv, 4.2));
        float adB = roughnessFactor * 9.5, adSp = roughnessFactor * 0.1 + 0.0015;
        vec3 adCol = texture2D(uRefl, adUv, adB).rgb * 0.4 + texture2D(uRefl, adUv + vec2(0.0, adSp), adB).rgb * 0.3 + texture2D(uRefl, adUv - vec2(0.0, adSp), adB).rgb * 0.3;
        outgoingLight += min(adCol, vec3(3.5)) * adF * mix(0.2, 0.8, adPd) * (1.0 - roughnessFactor * 0.7) * uReflOn * step(0.16, vWPos.y); }\n#include <opaque_fragment>`); };
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(slabSize, 0.17, slabSize), slabMat, blocks.length);
  refl.hide.push(slabs);
  blocks.forEach((b, k) => { dummy.position.set(b.cx, 0.085, b.cz); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); slabs.setMatrixAt(k, dummy.matrix); }); scene.add(slabs);

  // ---- Buildings ----
  const boxes = [], glows = [], signs = [], decals = [], beacons = [], screens = [], trim = [];
  const timeU = refl.uniforms.uTime;
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
    const central = Math.max(0, 1 - Math.hypot(b.cx - mid, b.cz - mid) / 430), outer = b.i < 0 || b.j < 0 || b.i >= ROADS - 1 || b.j >= ROADS - 1;
    for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) {
      const lx = b.cx - lotSpan / 2 + (a + 0.5) * lot, lz = b.cz - lotSpan / 2 + (c + 0.5) * lot;
      const gap = 0.4 + R() * 2.2, w = lot - gap, d = lot - gap;
      const tall = R(); let h = 14 + tall * tall * (46 + 230 * central * central) + R() * 14; if (R() < 0.2) h = 10 + R() * 9; if (outer) h = Math.min(h, 22 + R() * 60);
      const podium = h > 34 ? 8 + R() * 12 : h, sr = R();
      const lowStyle = sr < 0.5 ? 1 : sr < 0.82 ? 2 : 0, base = addBox(lx, lz, w, podium, d, lowStyle);
      let top = base, topY = podium;
      if (h > 34) { const tw = w * (0.55 + R() * 0.35), td = d * (0.55 + R() * 0.35), ts = h > 90 ? (R() < 0.78 ? 0 : 2) : R() < 0.4 ? 0 : R() < 0.6 ? 2 : 1;
        top = addBox(lx + (R() - 0.5) * (w - tw), lz + (R() - 0.5) * (d - td), tw, h, td, ts); topY = h;
        if (h > 110 && R() < 0.6) { top = addBox(top.x, top.z, top.w * 0.6, h + 14 + R() * 30, top.d * 0.6, ts); topY = top.h; } }
      const street = []; if (a === 0) street.push([-1, 0]); if (a === n - 1) street.push([1, 0]); if (c === 0) street.push([0, -1]); if (c === n - 1) street.push([0, 1]);
      // Cornice at the podium line, sun-shade ledges on concrete, balconies on brick.
      const floors = Math.floor((podium - 5.4) / base.ch);
      for (const [nx, nz] of FACES) { const L = faceLen(base, nx);
        onFace(base, nx, nz, 0, 0.12, podium - 0.12, L + 0.75, 0.55, 0.5, STONE);
        onFace(base, nx, nz, 0, 0.1, 5.42, L + 0.3, 0.2, 0.36, STONE);
        if (base.style === 2) for (let j = Math.ceil(5.6 / base.ch); 0.1 + j * base.ch < podium - 0.9 && j < 9; j++) onFace(base, nx, nz, 0, 0.22, 0.1 + j * base.ch, L + 0.2, 0.14, 0.5, STONE); }
      if (base.style === 1) for (const [nx, nz] of street) for (const cell of cellsOn(base, nx, nz, base.cw)) { if (cell.k % 2) continue;
        for (let j = Math.ceil(5.4 / base.ch); (j + 1) * base.ch + 0.1 < podium - 0.6 && j < 9; j++) { const y0 = 0.1 + j * base.ch; onFace(base, nx, nz, cell.t, 0.55, y0 + 0.08, base.cw * 0.84, 0.12, 1.1, STONE); onFace(base, nx, nz, cell.t, 1.08, y0 + 0.62, base.cw * 0.84, 0.95, 0.045, METAL); } }
      // Awnings over some shop fronts.
      for (const [nx, nz] of street) for (const cell of cellsOn(base, nx, nz, 6)) if (R() < 0.34) onFace(base, nx, nz, cell.t, 0.78, 3.98, 5.3, 0.07, 1.6, AWN[Math.floor(R() * AWN.length)], 0.3);
      // Tower corners, roof plant and masts.
      if (top !== base && top.style === 0) for (const sx of [-1, 1]) for (const sz of [-1, 1]) trim.push({ x: top.x + sx * (top.w / 2 + 0.06), y: (podium + topY) / 2, z: top.z + sz * (top.d / 2 + 0.06), sx: 0.34, sy: topY - podium, sz: 0.34, yaw: 0, tilt: 0, c: ALU });
      if (top !== base) for (const [nx, nz] of FACES) onFace(top, nx, nz, 0, 0.08, topY - 0.3, faceLen(top, nx) + 0.5, 0.9, 0.4, top.style === 0 ? ALU : STONE);
      trim.push({ x: top.x + (R() - 0.5) * top.w * 0.4, y: topY + 1.6, z: top.z + (R() - 0.5) * top.d * 0.4, sx: 4 + R() * 3, sy: 3.2, sz: 3 + R() * 2, yaw: 0, tilt: 0, c: STONE });
      for (let q = 0; q < 3; q++) trim.push({ x: base.x + (R() - 0.5) * base.w * 0.8, y: podium + 0.75, z: base.z + (R() - 0.5) * base.d * 0.8, sx: 2.2, sy: 1.5, sz: 1.3, yaw: R() < 0.5 ? 0 : Math.PI / 2, tilt: 0, c: 0x2c2e33 });
      if (topY > 60 && R() < 0.6) { const mh = 8 + R() * 20; trim.push({ x: top.x, y: topY + mh / 2, z: top.z, sx: 0.18, sy: mh, sz: 0.18, yaw: 0, tilt: 0, c: METAL }); beacons.push(top.x, topY + mh + 0.3, top.z); }
      const tone = NEON[Math.floor(R() * NEON.length)];
      if (h > 46 && R() < 0.42) { const t = 0.26, y = topY + 0.3; glows.push([top.x, y, top.z - top.d / 2, top.w, t, t, tone, 2.6], [top.x, y, top.z + top.d / 2, top.w, t, t, tone, 2.6], [top.x - top.w / 2, y, top.z, t, t, top.d, tone, 2.6], [top.x + top.w / 2, y, top.z, t, t, top.d, tone, 2.6]); }
      // Street-facing sides get signage.
      for (const [nx, nz] of street) {
        const fx = lx + nx * w / 2, fz = lz + nz * d / 2, along = (R() - 0.5) * (w - 9), px = fx + (nz ? along : 0), pz = fz + (nx ? along : 0);
        if (R() < 0.8) signs.push({ x: px + nx * 0.25, y: 4.72, z: pz + nz * 0.25, nx, nz, w: 4.4, h: 1.1, kind: 0 });
        if (R() < 0.55 && podium > 13) signs.push({ x: px + nx * 1.5, y: 9.5 + R() * Math.max(0, Math.min(podium, 30) - 15), z: pz + nz * 1.5, nx, nz, w: 5.6, h: 2.8, kind: 1 });
        if (R() < 0.34 && podium > 14) { const bw = Math.min(16, w - 3), by = Math.max(10, podium - bw / 4 - 1 - R() * 4); signs.push({ x: fx + nx * 0.5, y: by, z: fz + nz * 0.5, nx, nz, w: bw, h: bw / 2, kind: 2 }); onFace(base, nx, nz, 0, 0.3, by, bw + 0.5, bw / 2 + 0.5, 0.3, METAL); }
        if (h > 80 && top.w > 16 && R() < 0.3 && screens.length < 22) { const sw = Math.min(20, top.w - 3); screens.push({ x: (nx ? top.x + nx * top.w / 2 : top.x) + nx * 0.35, y: podium + 12 + sw * 0.75, z: (nz ? top.z + nz * top.d / 2 : top.z) + nz * 0.35, nx, nz, w: sw, h: sw * 1.5 }); }
      }
    }
  }
  // Far skyline beyond the playable grid, mostly lost in the haze.
  for (let k = 0; k < 90; k++) { const ang = R() * Math.PI * 2, rad = 620 + R() * 260, w = 30 + R() * 40; addBox(mid + Math.cos(ang) * rad, mid + Math.sin(ang) * rad, w, 60 + R() * R() * 300, w, R() < 0.6 ? 0 : 2); }

  // ---- Street furniture ----
  const VIA = 2; city.viaduct = VIA * P; // the avenue that carries the elevated line
  const place = (ax, r, side, s, lat, f) => { const fixed = r * P + side * lat; f(ax ? fixed : s, ax ? s : fixed, ax ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : (side > 0 ? Math.PI : 0), ax ? [0, 1] : [1, 0]); };
  const prop = (x, z, yaw, lx, y, lz, sx, sy, sz, c) => { const cs = Math.cos(yaw), sn = Math.sin(yaw); trim.push({ x: x + lx * cs + lz * sn, y, z: z - lx * sn + lz * cs, sx, sy, sz, yaw, tilt: 0, c }); };
  for (let r = 0; r < ROADS; r++) for (const ax of [0, 1]) for (const side of [-1, 1]) for (let seg = 0; seg < ROADS - 1; seg++) { const s0 = seg * P;
    if (R() < 0.42) place(ax, r, side, s0 + 44 + R() * 30, HALF + 1.7, (x, z, yaw, dir) => { // bus shelter: yaw faces the road
      for (const e of [-1.7, 1.7]) prop(x, z, yaw, e, 1.37, -0.55, 0.09, 2.4, 0.09, METAL);
      prop(x, z, yaw, 0, 2.6, 0, 3.9, 0.09, 1.55, METAL); prop(x, z, yaw, 0, 1.45, -0.6, 3.4, 2.0, 0.04, 0x1a2630); prop(x, z, yaw, 0, 0.62, -0.25, 2.6, 0.07, 0.42, 0x3a2c1e);
      for (const e of [-1.1, 1.1]) prop(x, z, yaw, e, 0.4, -0.25, 0.07, 0.45, 0.4, METAL);
      const cs = Math.cos(yaw), sn = Math.sin(yaw); signs.push({ x: x + 1.82 * cs, y: 1.5, z: z - 1.82 * sn, nx: dir[0], nz: dir[1], w: 2.1, h: 1.05, kind: 3 }); decals.push([x, 0.2, z, 7, 0xcfe4ff, 0.3]); });
    for (let s = s0 + 24; s < s0 + P - 22; s += 9.5) { const pick = R();
      if (pick < 0.12) place(ax, r, side, s, HALF + 1.0, (x, z, yaw) => { prop(x, z, yaw, 0, 0.67, 0, 0.5, 1.0, 0.5, 0x15171a); prop(x, z, yaw, 0, 1.2, 0, 0.56, 0.07, 0.56, 0x2a2d31); }); // litter bin
      else if (pick < 0.2) place(ax, r, side, s, HALF + 2.5, (x, z, yaw) => { prop(x, z, yaw, 0, 0.62, 0, 1.8, 0.07, 0.5, 0x3a2c1e); prop(x, z, yaw, 0, 0.95, -0.24, 1.8, 0.5, 0.06, 0x3a2c1e); for (const e of [-0.75, 0.75]) prop(x, z, yaw, e, 0.4, 0, 0.07, 0.45, 0.46, METAL); }); // bench
      else if (pick < 0.27) place(ax, r, side, s, HALF + SW - 0.55, (x, z, yaw) => { const tone = [0xbfe6ff, 0xff5a4a, 0xfff0c8, 0xd8e6ff][Math.floor(R() * 4)]; prop(x, z, yaw, 0, 1.12, 0, 1.0, 1.9, 0.75, 0x1b1d22); const cs = Math.cos(yaw), sn = Math.sin(yaw); glows.push([x + 0.39 * sn, 1.25, z + 0.39 * cs, Math.abs(cs) > 0.5 ? 0.82 : 0.03, 1.4, Math.abs(cs) > 0.5 ? 0.03 : 0.82, tone, 0.9]); decals.push([x + 1.6 * sn, 0.2, z + 1.6 * cs, 5, tone, 0.2]); }); // vending machine
      else if (pick < 0.33) place(ax, r, side, s, HALF + SW - 0.5, (x, z, yaw) => prop(x, z, yaw, 0, 0.87, 0, 1.3, 1.4, 0.5, 0x2b3034)); // utility cabinet
      else if (pick < 0.4) place(ax, r, side, s, HALF + 0.55, (x, z, yaw) => { prop(x, z, yaw, 0, 0.72, 0, 0.07, 1.1, 0.07, METAL); prop(x, z, yaw, 0, 1.38, 0, 0.2, 0.32, 0.16, 0x30343a); }); // parking meter
      else if (pick < 0.44) place(ax, r, side, s, HALF + 0.9, (x, z, yaw) => { prop(x, z, yaw, 0, 0.5, 0, 0.22, 0.66, 0.22, 0x8a1a14); prop(x, z, yaw, 0, 0.62, 0, 0.42, 0.14, 0.14, 0x8a1a14); }); // hydrant
    } }
  for (let i = 0; i < ROADS; i++) for (let j = 0; j < ROADS; j++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const [ox, oz] of [[1.5, 0.4], [0.4, 1.5], [0.6, 0.6]]) { const x = i * P + sx * (HALF + ox), z = j * P + sz * (HALF + oz); trim.push({ x, y: 0.6, z, sx: 0.17, sy: 0.9, sz: 0.17, yaw: 0, tilt: 0, c: 0x25272c }); glows.push([x, 0.92, z, 0.19, 0.06, 0.19, 0xffe9b0, 0.9]); }
  // ---- Elevated railway over one avenue ----
  { const vx = VIA * P, CONC = 0x4d4f54;
    trim.push({ x: vx, y: 10.4, z: mid, sx: 8.6, sy: 1.0, sz: SPAN + 80, yaw: 0, tilt: 0, c: CONC });
    for (const e of [-4.25, 4.25]) trim.push({ x: vx + e, y: 11.5, z: mid, sx: 0.25, sy: 1.2, sz: SPAN + 80, yaw: 0, tilt: 0, c: 0x1c1d21 });
    for (let z = 15; z < SPAN; z += 30) { if (Math.abs(z - Math.round(z / P) * P) < 14) continue;
      for (const e of [-1, 1]) trim.push({ x: vx + e * (HALF + 1.5), y: 4.9, z, sx: 1.1, sy: 9.5, sz: 1.1, yaw: 0, tilt: 0, c: CONC });
      trim.push({ x: vx, y: 9.25, z, sx: (HALF + 1.5) * 2 + 1.5, sy: 1.3, sz: 1.5, yaw: 0, tilt: 0, c: CONC });
      glows.push([vx - 4.6, 8.5, z, 5, 0.07, 0.3, 0xcfe2ff, 2.4], [vx + 4.6, 8.5, z, 5, 0.07, 0.3, 0xcfe2ff, 2.4]); decals.push([vx, 0.03, z, 24, 0xbcd4ff, 0.16]); } }

  const unit = new THREE.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0);
  const aInfo = new Float32Array(boxes.length * 4);
  const bm = new THREE.InstancedMesh(unit, buildingMaterial(timeU), boxes.length);
  boxes.forEach((b, k) => { dummy.position.set(b.x, 0.1, b.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(b.w, b.h, b.d); dummy.updateMatrix(); bm.setMatrixAt(k, dummy.matrix); aInfo.set([b.seed, b.style, b.cw, b.ch], k * 4); });
  unit.setAttribute('aInfo', new THREE.InstancedBufferAttribute(aInfo, 4));
  const trimMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.15, envMapIntensity: 0.9 }), trim.length);
  trim.forEach((t, k) => { dummy.position.set(t.x, t.y, t.z); dummy.rotation.set(t.tilt, t.yaw, 0, 'YXZ'); dummy.scale.set(t.sx, t.sy, t.sz); dummy.updateMatrix(); trimMesh.setMatrixAt(k, dummy.matrix); trimMesh.setColorAt(k, col.set(t.c)); });
  dummy.rotation.order = 'XYZ'; trimMesh.frustumCulled = false; scene.add(trimMesh);
  bm.frustumCulled = false; scene.add(bm);

  // ---- Street lamps ----
  const poleG = new THREE.CylinderGeometry(0.09, 0.14, 8.2, 8); poleG.translate(0, 4.1, 0);
  const armG = new THREE.CylinderGeometry(0.06, 0.07, 4.4, 6); armG.rotateZ(Math.PI / 2 - 0.12); armG.translate(-2.15, 8.35, 0);
  const lampG = mergeGeometries([poleG, armG]);
  const lampSpots = [];
  for (let r = 0; r < ROADS; r++) for (let s = 30; s < SPAN; s += 30) { if (Math.abs(s - Math.round(s / P) * P) < 16) continue;
    for (const side of [-1, 1]) { const stag = side > 0 ? 15 : 0; if (Math.abs((s + stag) - Math.round((s + stag) / P) * P) < 16) continue;
      lampSpots.push({ x: r * P + side * (HALF + SW - 0.5), z: s + stag, rot: side > 0 ? 0 : Math.PI, hx: r * P + side * (HALF - 0.9), hz: s + stag });
      lampSpots.push({ x: s + stag, z: r * P + side * (HALF + SW - 0.5), rot: side > 0 ? -Math.PI / 2 : Math.PI / 2, hx: s + stag, hz: r * P + side * (HALF - 0.9) }); } }
  const lampMesh = new THREE.InstancedMesh(lampG, new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.45, metalness: 0.8 }), lampSpots.length);
  lampSpots.forEach((l, k) => { dummy.position.set(l.x, 0.17, l.z); dummy.rotation.set(0, l.rot, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); lampMesh.setMatrixAt(k, dummy.matrix);
    const warm = (k * 7) % 5 === 0 ? 0xbfe0ff : 0xffc98f; glows.push([l.hx, 8.72, l.hz, l.rot % Math.PI ? 0.5 : 1.0, 0.1, l.rot % Math.PI ? 1.0 : 0.5, warm, 5]);
    decals.push([l.hx, 0.03, l.hz, 22, warm, 0.2]); city.lamps.push(new THREE.Vector3(l.hx, 8.2, l.hz)); });
  scene.add(lampMesh);

  // ---- Traffic signals ----
  const sigG = mergeGeometries([(() => { const g = new THREE.CylinderGeometry(0.08, 0.1, 5.2, 6); g.translate(0, 2.6, 0); return g; })(), (() => { const g = new THREE.BoxGeometry(0.42, 1.25, 0.34); g.translate(0, 5.3, 0); return g; })()]);
  const sigSpots = [];
  for (let i = 0; i < ROADS; i++) for (let j = 0; j < ROADS; j++) { const cx = i * P, cz = j * P, o = HALF + 0.9;
    sigSpots.push({ i, j, axis: 'z', x: cx - o, z: cz - o, fx: 0, fz: -1 }, { i, j, axis: 'z', x: cx + o, z: cz + o, fx: 0, fz: 1 }, { i, j, axis: 'x', x: cx - o, z: cz + o, fx: -1, fz: 0 }, { i, j, axis: 'x', x: cx + o, z: cz - o, fx: 1, fz: 0 }); }
  const sigMesh = new THREE.InstancedMesh(sigG, new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.5, metalness: 0.6 }), sigSpots.length);
  const sigPos = new Float32Array(sigSpots.length * 3), sigCol = new Float32Array(sigSpots.length * 3);
  sigSpots.forEach((s, k) => { dummy.position.set(s.x, 0.17, s.z); dummy.rotation.set(0, Math.atan2(s.fx, s.fz), 0); dummy.updateMatrix(); sigMesh.setMatrixAt(k, dummy.matrix); sigPos.set([s.x + s.fx * 0.22, 5.47, s.z + s.fz * 0.22], k * 3); });
  scene.add(sigMesh);
  const dot = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const sigGeo = new THREE.BufferGeometry(); sigGeo.setAttribute('position', new THREE.BufferAttribute(sigPos, 3)); sigGeo.setAttribute('color', new THREE.BufferAttribute(sigCol, 3));
  const sigPts = new THREE.Points(sigGeo, new THREE.PointsMaterial({ size: 1.1, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })); sigPts.frustumCulled = false; scene.add(sigPts);
  const SIG = { g: [0.1, 2.6, 0.9], y: [3.0, 1.7, 0.1], r: [3.2, 0.12, 0.08] }; let sigKey = '';
  function updateSignals(t) { const key = Math.floor(t * 2); if (key === sigKey) return; sigKey = key; sigSpots.forEach((s, k) => sigCol.set(SIG[signal(s.i, s.j, s.axis, t)], k * 3)); sigGeo.attributes.color.needsUpdate = true; }

  // ---- Rooftop beacons ----
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(beacons, 3));
  const beaconPts = new THREE.Points(bg, new THREE.PointsMaterial({ size: 7, map: dot, color: new THREE.Color(3, 0.15, 0.1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(beaconPts);

  // ---- Neon signs (one atlas, one draw call) ----
  const atlas = signAtlas();
  const signG = new THREE.PlaneGeometry(1, 1), aUv = new Float32Array(signs.length * 4), aSeed = new Float32Array(signs.length);
  const signM = new THREE.MeshBasicMaterial({ map: atlas.tex, side: THREE.DoubleSide, color: new THREE.Color(2.1, 2.1, 2.1) });
  signM.onBeforeCompile = sh => { sh.uniforms.uTime = timeU;
    sh.vertexShader = 'attribute vec4 aUv; attribute float aSeed; varying float vSd;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = aUv.xy + uv * aUv.zw; vSd = aSeed;');
    sh.fragmentShader = 'uniform float uTime; varying float vSd;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat adFl = vSd > 0.86 ? step(0.25, fract(sin(floor(uTime * 14.0) * 12.99 + vSd * 78.2) * 43758.5)) * 0.8 + 0.2 : 0.92 + 0.08 * sin(uTime * 60.0 + vSd * 40.0);\ndiffuseColor.rgb *= adFl;'); };
  const signMesh = new THREE.InstancedMesh(signG, signM, signs.length);
  signs.forEach((s, k) => { const cell = Math.floor(R() * atlas.count); aUv.set(s.kind === 0 ? [(cell % 4) / 4 + 0.012, 1 - (Math.floor(cell / 4) + 1) / 8 + 0.031, 0.226, 0.0565] : [(cell % 4) / 4, 1 - (Math.floor(cell / 4) + 1) / 8, 0.25, 0.125], k * 4); aSeed[k] = R();
    dummy.position.set(s.x, s.y, s.z); dummy.rotation.set(0, Math.atan2(s.nx, s.nz) + (s.kind === 1 ? Math.PI / 2 : 0), s.kind === 1 || s.kind === 3 ? Math.PI / 2 : 0, 'YXZ'); dummy.scale.set(s.w, s.h, 1); dummy.updateMatrix(); signMesh.setMatrixAt(k, dummy.matrix);
    if (s.kind !== 3) decals.push([s.x + s.nx * (s.kind === 2 ? 7 : 3.4), 0.2, s.z + s.nz * (s.kind === 2 ? 7 : 3.4), s.kind === 2 ? 30 : 13, atlas.colors[cell], s.kind === 2 ? 0.035 : 0.06]); });
  dummy.rotation.order = 'XYZ';
  signG.setAttribute('aUv', new THREE.InstancedBufferAttribute(aUv, 4)); signG.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  signMesh.frustumCulled = false; scene.add(signMesh);

  // ---- Giant animated screens ----
  const screenM = new THREE.ShaderMaterial({ uniforms: { uTime: timeU }, fog: false,
    vertexShader: 'varying vec2 vUv; varying float vId; void main(){ vUv = uv; vId = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.11; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying float vId;\n${GLSL_HASH} void main(){ float t = uTime * 0.35 + vId; vec2 p = vUv;
      vec3 a = 0.5 + 0.5 * cos(6.283 * (vec3(0.0, 0.33, 0.67) + floor(t * 0.2) * 0.37 + vId));
      vec3 b = 0.5 + 0.5 * cos(6.283 * (vec3(0.5, 0.2, 0.9) + floor(t * 0.2) * 0.61 + vId));
      float wave = sin(p.y * 9.0 + sin(p.x * 4.0 + t * 2.0) * 2.0 - t * 3.0) * 0.5 + 0.5;
      float blob = smoothstep(0.42, 0.4, length((p - vec2(0.5 + 0.2 * sin(t), 0.5 + 0.25 * cos(t * 0.8))) * vec2(1.0, 1.5)));
      float bars = step(0.5, fract(p.y * 6.0 - t)) * step(p.x, 0.12 + 0.05 * sin(t * 3.0));
      vec3 c = mix(a * 0.35, b, wave * 0.6) + blob * vec3(1.0, 0.95, 0.9) * 0.8 + bars * 0.6;
      c *= 0.82 + 0.18 * sin(p.y * 520.0); c *= smoothstep(0.0, 0.02, p.x) * smoothstep(0.0, 0.02, 1.0 - p.x) * smoothstep(0.0, 0.015, p.y) * smoothstep(0.0, 0.015, 1.0 - p.y);
      gl_FragColor = vec4(c * 1.9, 1.0); }` });
  const screenMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), screenM, Math.max(1, screens.length));
  screens.forEach((s, k) => { dummy.position.set(s.x, s.y, s.z); dummy.rotation.set(0, Math.atan2(s.nx, s.nz), 0); dummy.scale.set(s.w, s.h, 1); dummy.updateMatrix(); screenMesh.setMatrixAt(k, dummy.matrix); decals.push([s.x + s.nx * 12, 0.03, s.z + s.nz * 12, 46, 0x8fa8ff, 0.22]); });
  screenMesh.count = screens.length; screenMesh.frustumCulled = false; scene.add(screenMesh);

  // ---- Glowing tubes, lamp heads and trims ----
  const glowMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), glows.length);
  glows.forEach(([x, y, z, sx, sy, sz, hex, k2], k) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); glowMesh.setMatrixAt(k, dummy.matrix); col.set(hex).multiplyScalar(k2); glowMesh.setColorAt(k, col); });
  glowMesh.frustumCulled = false; scene.add(glowMesh);

  // ---- Pools of light on the ground ----
  const pool = canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.42)'); g.addColorStop(0.7, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  const decalG = new THREE.PlaneGeometry(1, 1); decalG.rotateX(-Math.PI / 2);
  const decalMesh = new THREE.InstancedMesh(decalG, new THREE.MeshBasicMaterial({ map: pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), decals.length);
  decals.forEach(([x, y, z, s, hex, k2], k) => { dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(s, 1, s); dummy.updateMatrix(); decalMesh.setMatrixAt(k, dummy.matrix); col.set(hex).multiplyScalar(k2); decalMesh.setColorAt(k, col); });
  decalMesh.frustumCulled = false; decalMesh.renderOrder = 2; scene.add(decalMesh);

  city.update = (t) => { updateSignals(t); beaconPts.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.4)); };
  city.dot = dot; city.pool = pool; city.stats = { trim: trim.length, buildings: boxes.length, signs: signs.length, lamps: lampSpots.length, screens: screens.length };
  return city;
}
