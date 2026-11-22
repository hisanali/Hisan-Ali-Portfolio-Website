// The city: a rain-soaked grid of avenues, towers with lit rooms behind every window, neon signage,
// street lamps and signals. Everything is generated here; the only files loaded are the asphalt textures.
import * as THREE from '/evermile/vendor/three.module.js';
import { mergeGeometries } from '/evermile/vendor/utils/BufferGeometryUtils.js';

export const P = 120, ROADS = 7, HALF = 10, SW = 4, SPAN = P * (ROADS - 1), DRIVE = HALF + SW - 1.1;
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
  diffuseColor.rgb *= mix(0.5, 0.24, adPud);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.62, 0.6), adMk.x * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66, 0.47, 0.08), adMk.y * 0.9);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(clamp(roughnessFactor * 0.52 + 0.08, 0.16, 0.6), 0.025, adPud);
  roughnessFactor = mix(roughnessFactor, 0.3, max(adMk.x, adMk.y) * (1.0 - adPud));`)
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
    float adWet = mix(0.5, 1.0, adPud) * (1.0 - roughnessFactor * 0.7);
    outgoingLight += min(adCol, vec3(12.0)) * adF * adWet * uReflOn;
  }
#include <opaque_fragment>`);
  };
  return m;
}

function buildingMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, envMapIntensity: 1.0 });
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vWPos; varying vec3 vWN; flat varying float vSeed;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(instanceMatrix) * normal);
  vSeed = floor(fract(sin(dot(floor(instanceMatrix[3].xz), vec2(12.9898, 78.233))) * 43758.5453) * 4096.0) / 4096.0;`);
    sh.fragmentShader = `varying vec3 vWPos; varying vec3 vWN; flat varying float vSeed;\n${GLSL_HASH}` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  vec3 adNw = normalize(vWN); float adWall = step(abs(adNw.y), 0.5);
  vec3 adTw = normalize(vec3(-adNw.z, 0.0, adNw.x) + vec3(1e-5, 0.0, 0.0));
  float adSi = floor(vSeed * 4096.0);
  float adU = dot(vWPos, adTw) + mod(adSi, 37.0), adV = vWPos.y;
  float adS1 = fract(vSeed * 7.13), adS2 = fract(vSeed * 13.7), adS3 = fract(vSeed * 29.3), adS4 = fract(vSeed * 3.7);
  float adGround = step(adV, 5.3);
  float adCw = mix(mix(2.3, 4.4, adS1), 6.0, adGround), adCh = mix(mix(3.3, 4.1, adS2), 5.2, adGround);
  vec2 adUV = vec2(adU / adCw, (adV - 0.1) / adCh); vec2 adCell = floor(adUV), adFr = fract(adUV);
  float adFx = mix(mix(0.05, 0.2, adS3), 0.03, adGround), adFy = mix(mix(0.1, 0.3, adS4), 0.09, adGround), adTop = mix(0.05, 0.24, adGround);
  float adWin = smoothstep(adFx, adFx + 0.012, adFr.x) * smoothstep(adFx, adFx + 0.012, 1.0 - adFr.x) * smoothstep(adFy, adFy + 0.012, adFr.y) * smoothstep(adTop, adTop + 0.012, 1.0 - adFr.y) * adWall;
  adWin *= mix(1.0, smoothstep(0.012, 0.02, abs(fract(adFr.x * 3.0 + 0.5) - 0.5)), adGround);
  float adGrime = 0.7 + 0.6 * adN(vec2(adU * 0.08, adV * 0.03) + adSi);
  float adBand = 1.0 - 0.3 * step(0.93, fract(adV / adCh)) * (1.0 - adGround);
  vec3 adFacade = mix(vec3(0.04, 0.045, 0.055), vec3(0.14, 0.118, 0.1), adS2) * adGrime * adBand;
  adFacade = mix(adFacade, vec3(0.022, 0.024, 0.03), adGround * step(1.0 - adTop, adFr.y));
  diffuseColor.rgb = mix(mix(vec3(0.03, 0.032, 0.036), adFacade, adWall), vec3(0.3, 0.36, 0.45), adWin);
  // Which rooms have their lights on.
  vec2 adId = adCell + vec2(adSi, mod(adSi, 61.0));
  float adHc = adH(adId);
  float adFloorLit = step(adH(vec2(adCell.y, adSi)), 0.2);
  float adLit = max(step(adHc, mix(0.14, 0.42, fract(vSeed * 5.3))), adFloorLit * step(adHc, 0.8));
  adLit = mix(adLit, step(adHc, 0.66), adGround);
  // Interior mapping: trace the view ray into a box room behind the glass.
  vec3 adVd = normalize(vWPos - cameraPosition);
  vec3 adO = vec3(adFr, 0.0);
  vec3 adDd = vec3(dot(adVd, adTw) / adCw, adVd.y / adCh, max(-dot(adVd, adNw), 0.02) / mix(5.5, 4.5, adGround)) + 1e-5;
  vec3 adTt = (step(0.0, adDd) - adO) / adDd; float adTm = min(adTt.x, min(adTt.y, adTt.z)); vec3 adPp = adO + adDd * adTm;
  float adH2 = adH(adId + 17.0), adH3 = adH(adId + 41.0);
  vec3 adWallCol = mix(vec3(0.72, 0.64, 0.52), vec3(0.46, 0.52, 0.58), step(0.5, adH3));
  vec3 adRoom;
  if (adTt.z <= adTm + 1e-4) {
    vec2 adBk = floor(adPp.xy * mix(vec2(3.0, 4.0), vec2(7.0, 5.0), adGround));
    adRoom = adWallCol * (0.3 + 0.6 * adH(adBk + adId)) * mix(1.0, 0.75, adGround);
    adRoom *= mix(1.0, 0.28 + 0.5 * adH(vec2(adBk.x, 3.0) + adId), step(adPp.y, 0.34) * (1.0 - adGround));
    adRoom = mix(adRoom, adRoom * (0.5 + 0.9 * (0.5 + 0.5 * cos(6.283 * (adH(adBk + adId + 9.0) + vec3(0.0, 0.33, 0.67))))), adGround * 0.22);
  }
  else if (adTt.y <= adTm + 1e-4) adRoom = adDd.y > 0.0 ? vec3(0.5) + vec3(0.9) * step(abs(fract(adPp.z * 2.0 + 0.25) - 0.5), 0.12) * step(abs(fract(adPp.x * 2.0) - 0.5), 0.36) : mix(vec3(0.2, 0.16, 0.13), vec3(0.34), adGround) * (0.8 + 0.2 * step(0.5, fract(adPp.x * 4.0)));
  else adRoom = adWallCol * (0.3 + 0.45 * adH(floor(adPp.zy * mix(vec2(2.0, 3.0), vec2(5.0, 5.0), adGround)) + adId + 3.0)) * mix(vec3(1.0), 0.55 + 0.7 * (0.5 + 0.5 * cos(6.283 * (adH(floor(adPp.zy * 5.0) + adId + 9.0) + vec3(0.0, 0.33, 0.67)))), adGround * 0.18);
  adRoom *= mix(1.0, 0.45, adPp.z);
  vec3 adLc = adH2 < 0.45 ? vec3(1.0, 0.7, 0.42) : adH2 < 0.75 ? vec3(1.0, 0.9, 0.76) : adH2 < 0.9 ? vec3(0.55, 0.78, 1.0) : adH2 < 0.95 ? vec3(1.0, 0.25, 0.75) : vec3(0.2, 1.0, 0.85);
  adLc = mix(adLc, mix(vec3(1.0, 0.9, 0.78), 0.5 + 0.5 * cos(6.283 * (adH2 + vec3(0.0, 0.33, 0.67))), 0.3), adGround);
  float adBlind = step(adH(adId + 5.0), 0.3) * step(0.25 + 0.6 * adH(adId + 11.0), adFr.y) * (1.0 - adGround);
  adRoom = mix(adRoom, vec3(0.3) * (0.8 + 0.2 * step(0.5, fract(adFr.y * 26.0))), adBlind);
  vec3 adEmit = adRoom * adLc * adWin * adLit * mix(1.15, 1.05, adGround);
  // Shut shops pull down a ribbed shutter.
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.072, 0.08) * (0.7 + 0.3 * step(0.5, fract(adV * 9.0))), adGround * adWin * (1.0 - adLit));
  float adShut = adGround * adWin * (1.0 - adLit);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(0.82, mix(0.08, 0.6, adShut), adWin);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = adWin * mix(0.85, 0.5, adShut);')
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
  const slabMat = new THREE.MeshStandardMaterial({ map: pave, roughness: 0.4, metalness: 0, envMapIntensity: 0.12, color: 0x8d8d95 });
  slabMat.onBeforeCompile = sh => { Object.assign(sh.uniforms, refl.uniforms);
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform sampler2D uRefl; uniform mat4 uReflVP; uniform float uReflOn; varying vec3 vWPos;\n${GLSL_HASH}` + sh.fragmentShader
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  float adPd = smoothstep(0.5, 0.72, adN(vWPos.xz * 0.11 + 3.0)); roughnessFactor = mix(0.42, 0.05, adPd); diffuseColor.rgb *= mix(0.62, 0.36, adPd);')
      .replace('#include <opaque_fragment>', `{ vec4 adRc = uReflVP * vec4(vWPos.x, 0.0, vWPos.z, 1.0); vec2 adUv = adRc.xy / adRc.w * 0.5 + 0.5; float adNdv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float adF = (0.03 + 0.97 * pow(1.0 - adNdv, 4.2));
        float adB = roughnessFactor * 9.5, adSp = roughnessFactor * 0.1 + 0.0015;
        vec3 adCol = texture2D(uRefl, adUv, adB).rgb * 0.4 + texture2D(uRefl, adUv + vec2(0.0, adSp), adB).rgb * 0.3 + texture2D(uRefl, adUv - vec2(0.0, adSp), adB).rgb * 0.3;
        outgoingLight += min(adCol, vec3(10.0)) * adF * mix(0.4, 0.9, adPd) * (1.0 - roughnessFactor * 0.7) * uReflOn * step(0.16, vWPos.y); }\n#include <opaque_fragment>`); };
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(slabSize, 0.17, slabSize), slabMat, blocks.length);
  refl.hide.push(slabs);
  blocks.forEach((b, k) => { dummy.position.set(b.cx, 0.085, b.cz); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); slabs.setMatrixAt(k, dummy.matrix); }); scene.add(slabs);

  // ---- Buildings ----
  const boxes = [], glows = [], signs = [], decals = [], beacons = [], screens = [];
  const lotSpan = slabSize - SW * 2, mid = SPAN / 2;
  for (const b of blocks) {
    const n = R() < 0.45 ? 2 : 3, lot = lotSpan / n;
    const central = Math.max(0, 1 - Math.hypot(b.cx - mid, b.cz - mid) / 430), outer = b.i < 0 || b.j < 0 || b.i >= ROADS - 1 || b.j >= ROADS - 1;
    for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) {
      const lx = b.cx - lotSpan / 2 + (a + 0.5) * lot, lz = b.cz - lotSpan / 2 + (c + 0.5) * lot;
      const gap = 0.4 + R() * 2.2, w = lot - gap, d = lot - gap;
      const tall = R(); let h = 14 + tall * tall * (46 + 230 * central * central) + R() * 14; if (R() < 0.16) h = 9 + R() * 7; if (outer) h = Math.min(h, 22 + R() * 60);
      const podium = h > 34 ? 7 + R() * 12 : h;
      boxes.push([lx, lz, w, podium, d]);
      let topW = w, topD = d, topX = lx, topZ = lz, topY = podium;
      if (h > 34) { topW = w * (0.55 + R() * 0.35); topD = d * (0.55 + R() * 0.35); topX = lx + (R() - 0.5) * (w - topW); topZ = lz + (R() - 0.5) * (d - topD); boxes.push([topX, topZ, topW, h, topD]); topY = h;
        if (h > 110 && R() < 0.6) { const cw = topW * 0.6, cd = topD * 0.6, ch = h + 14 + R() * 30; boxes.push([topX, topZ, cw, ch, cd]); topW = cw; topD = cd; topY = ch; } }
      const tone = NEON[Math.floor(R() * NEON.length)];
      if (h > 46 && R() < 0.42) { const t = 0.28; glows.push([topX, topY + 0.2, topZ - topD / 2, topW, t, t, tone, 2.6], [topX, topY + 0.2, topZ + topD / 2, topW, t, t, tone, 2.6], [topX - topW / 2, topY + 0.2, topZ, t, t, topD, tone, 2.6], [topX + topW / 2, topY + 0.2, topZ, t, t, topD, tone, 2.6]); }
      if (h > 60 && R() < 0.3) { const sx = R() < 0.5 ? -1 : 1, sz = R() < 0.5 ? -1 : 1; glows.push([topX + sx * topW / 2, (podium + topY) / 2, topZ + sz * topD / 2, 0.3, topY - podium, 0.3, tone, 2.2]); }
      if (topY > 95) beacons.push(topX, topY + 2.5, topZ);
      // Street-facing sides get signage.
      const faces = []; if (a === 0) faces.push([-1, 0]); if (a === n - 1) faces.push([1, 0]); if (c === 0) faces.push([0, -1]); if (c === n - 1) faces.push([0, 1]);
      for (const [nx, nz] of faces) {
        const fx = lx + nx * w / 2, fz = lz + nz * d / 2, along = (R() - 0.5) * (w - 9), px = fx + (nz ? along : 0), pz = fz + (nx ? along : 0);
        if (R() < 0.8) signs.push({ x: px + nx * 0.25, y: 6.6 + R() * 0.8, z: pz + nz * 0.25, nx, nz, w: 5.2, h: 2.6, kind: 0 });
        if (R() < 0.55 && podium > 13) signs.push({ x: px + nx * 1.5, y: 10.5 + R() * Math.max(0, Math.min(podium, 30) - 16), z: pz + nz * 1.5, nx, nz, w: 5.6, h: 2.8, kind: 1 });
        if (R() < 0.34 && podium > 20) signs.push({ x: fx + nx * 0.3, y: 15 + R() * Math.max(0, Math.min(podium, 44) - 24), z: fz + nz * 0.3, nx, nz, w: Math.min(16, w - 3), h: Math.min(8, (w - 3) / 2), kind: 2 });
        if (h > 80 && topW > 16 && R() < 0.3 && screens.length < 22) { const sw = Math.min(20, topW - 3); screens.push({ x: (nx ? topX + nx * topW / 2 : topX) + nx * 0.35, y: podium + 12 + sw * 0.75, z: (nz ? topZ + nz * topD / 2 : topZ) + nz * 0.35, nx, nz, w: sw, h: sw * 1.5 }); }
      }
    }
  }
  // Far skyline beyond the playable grid, mostly lost in the haze.
  for (let k = 0; k < 90; k++) { const ang = R() * Math.PI * 2, rad = 620 + R() * 260, w = 30 + R() * 40; boxes.push([mid + Math.cos(ang) * rad, mid + Math.sin(ang) * rad, w, 60 + R() * R() * 300, w]); }
  const unit = new THREE.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0);
  const bm = new THREE.InstancedMesh(unit, buildingMaterial(), boxes.length);
  boxes.forEach(([x, z, w, h, d], k) => { dummy.position.set(x, 0.1, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(w, h, d); dummy.updateMatrix(); bm.setMatrixAt(k, dummy.matrix); });
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
  const signM = new THREE.MeshBasicMaterial({ map: atlas.tex, side: THREE.DoubleSide, color: new THREE.Color(3.0, 3.0, 3.0) });
  const timeU = refl.uniforms.uTime;
  signM.onBeforeCompile = sh => { sh.uniforms.uTime = timeU;
    sh.vertexShader = 'attribute vec4 aUv; attribute float aSeed; varying float vSd;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = aUv.xy + uv * aUv.zw; vSd = aSeed;');
    sh.fragmentShader = 'uniform float uTime; varying float vSd;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat adFl = vSd > 0.86 ? step(0.25, fract(sin(floor(uTime * 14.0) * 12.99 + vSd * 78.2) * 43758.5)) * 0.8 + 0.2 : 0.92 + 0.08 * sin(uTime * 60.0 + vSd * 40.0);\ndiffuseColor.rgb *= adFl;'); };
  const signMesh = new THREE.InstancedMesh(signG, signM, signs.length);
  signs.forEach((s, k) => { const cell = Math.floor(R() * atlas.count); aUv.set([(cell % 4) / 4, 1 - (Math.floor(cell / 4) + 1) / 8, 0.25, 0.125], k * 4); aSeed[k] = R();
    dummy.position.set(s.x, s.y, s.z); dummy.rotation.set(0, Math.atan2(s.nx, s.nz) + (s.kind === 1 ? Math.PI / 2 : 0), s.kind === 1 ? Math.PI / 2 : 0, 'YXZ'); dummy.scale.set(s.w, s.h, 1); dummy.updateMatrix(); signMesh.setMatrixAt(k, dummy.matrix);
    decals.push([s.x + s.nx * (s.kind === 2 ? 7 : 3.4), 0.2, s.z + s.nz * (s.kind === 2 ? 7 : 3.4), s.kind === 2 ? 30 : 13, atlas.colors[cell], s.kind === 2 ? 0.2 : 0.26]); });
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
  city.dot = dot; city.pool = pool; city.stats = { buildings: boxes.length, signs: signs.length, lamps: lampSpots.length, screens: screens.length };
  return city;
}
