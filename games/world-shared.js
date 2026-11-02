// Shared scene plumbing for the fully lit 3D games: renderer with shadows and post-processing, sky and
// environment lighting, PBR texture sets, glTF loading and the UI helpers from the arcade shell.
import * as THREE from '/evermile/vendor/three.module.js';
import { EffectComposer } from '/evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '/evermile/vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/evermile/vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/evermile/vendor/postprocessing/OutputPass.js';
import { ShaderPass } from '/evermile/vendor/postprocessing/ShaderPass.js';
import { Sky } from '/penalty/vendor/three-addons/objects/Sky.js';
import { SimplexNoise } from '/penalty/vendor/three-addons/math/SimplexNoise.js';
import { GLTFLoader } from '/evermile/vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from '/evermile/vendor/loaders/DRACOLoader.js';
export { THREE, Sky, SimplexNoise };
export { $, Particles, Sound, ui, seg, clamp, lerp, mulberry } from '/games/neon-shared.js';

// Graphics quality. Ultra is the default on desktop, High on phones and tablets; the menu can change it.
export const QUALITY = (() => {
  try { const q = new URLSearchParams(location.search).get('gfx') || localStorage.getItem('gfx-quality'); if (['ultra', 'high', 'balanced'].includes(q)) return q; } catch (e) {}
  return matchMedia('(pointer:coarse)').matches ? 'high' : 'ultra';
})();
export const Q = { ultra: { dpr: 2, msaa: 4, shadow: 4096, detail: 1 }, high: { dpr: 1.5, msaa: 4, shadow: 2048, detail: 0.75 }, balanced: { dpr: 1, msaa: 2, shadow: 1024, detail: 0.5 } }[QUALITY];
export function qualityField(container) {
  const wrap = document.createElement('div'); wrap.className = 'field'; wrap.innerHTML = '<span>Graphics</span><div class="seg"></div>'; container.append(wrap);
  const opts = [['ultra', 'Ultra'], ['high', 'High'], ['balanced', 'Balanced']];
  const segEl = wrap.querySelector('.seg');
  for (const [v, l] of opts) { const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.setAttribute('aria-pressed', String(v === QUALITY)); if (v === QUALITY) b.classList.add('is-on'); b.addEventListener('click', () => { if (v === QUALITY) return; try { localStorage.setItem('gfx-quality', v); } catch (e) {} location.reload(); }); segEl.append(b); }
}

// Final grade in display space: gentle filmic contrast, a lens vignette and fine animated grain.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVignette: { value: 0.32 }, uGrain: { value: 0.025 }, uContrast: { value: 1.06 }, uSaturation: { value: 1.04 }, uTint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVignette, uGrain, uContrast, uSaturation; uniform vec3 uTint; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb * uTint;
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722)); col = mix(vec3(l), col, uSaturation); col = (col - 0.5) * uContrast + 0.5;
      vec2 d = vUv - 0.5; col *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      col += (h(vUv * 1000.0 + uTime) - 0.5) * uGrain; gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a); }`
};

export function makeWorld(canvas, { fov = 60, near = 0.3, far = 1200, bloom = 0.35, threshold = 0.85, radius = 0.4, shadows = true, exposure = 1.0, grade = {} } = {}) {
  // The composer replaces the canvas' own antialiasing, so MSAA happens in a multisampled HDR target instead.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: Q.msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloom, radius, threshold);
  composer.addPass(bloomPass); composer.addPass(new OutputPass());
  const gradePass = new ShaderPass(GradeShader); Object.entries(grade).forEach(([k, v]) => { if (gradePass.uniforms[k]) { if (v && v.isVector3) gradePass.uniforms[k].value.copy(v); else gradePass.uniforms[k].value = v; } });
  composer.addPass(gradePass);
  const t0 = performance.now(); const render = composer.render.bind(composer); composer.render = dt => { gradePass.uniforms.uTime.value = (performance.now() - t0) * 0.001 % 100; render(dt); };
  const resize = () => { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize); resize();
  return { renderer, scene, camera, composer, bloomPass, gradePass, resize };
}

// Physical sky plus a matching environment map, so PBR materials pick up the sky's colour.
export function addSky(renderer, scene, { elevation = 12, azimuth = 160, turbidity = 6, rayleigh = 1.6, mie = 0.005, mieG = 0.8, exposureScale = 1, intensity = 0.5 } = {}) {
  const sky = new Sky(); sky.scale.setScalar(2000); scene.add(sky);
  const u = sky.material.uniforms; u.turbidity.value = turbidity; u.rayleigh.value = rayleigh; u.mieCoefficient.value = mie; u.mieDirectionalG.value = mieG;
  const sun = new THREE.Vector3();
  const setSun = (el, az) => { const phi = THREE.MathUtils.degToRad(90 - el), theta = THREE.MathUtils.degToRad(az); sun.setFromSphericalCoords(1, phi, theta); u.sunPosition.value.copy(sun); };
  setSun(elevation, azimuth);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(sky, 0.02).texture; scene.environment = env; scene.environmentIntensity = intensity; pmrem.dispose();
  return { sky, sun, setSun };
}

export function sunLight(scene, { color = 0xfff1d6, intensity = 2.4, size = 160, mapSize = 2048, near = 1, far = 600 } = {}) {
  mapSize = Math.max(mapSize, Q.shadow); const light = new THREE.DirectionalLight(color, intensity); light.castShadow = true;
  const s = light.shadow; s.mapSize.set(mapSize, mapSize); s.camera.left = -size; s.camera.right = size; s.camera.top = size; s.camera.bottom = -size; s.camera.near = near; s.camera.far = far; s.bias = -0.0005; s.normalBias = 0.6;
  scene.add(light); scene.add(light.target); return light;
}

const texLoader = new THREE.TextureLoader();
export function pbr(name, { repeat = 8, roughness = 1, metalness = 0, normalScale = 1, color = 0xffffff } = {}) {
  const base = `/evermile/assets/materials/${name}`;
  const load = (suffix, srgb) => { const t = texLoader.load(`${base}_${suffix}_1k.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 16; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return new THREE.MeshStandardMaterial({ color, map: load('diff', true), normalMap: load('nor_gl'), roughnessMap: load('rough'), roughness, metalness, normalScale: new THREE.Vector2(normalScale, normalScale) });
}

export function canvasTexture(size, draw, { repeat = 1, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}

// Tiling water normal map (same technique as Evermile's lake).
export function waterNormals(size = 256) {
  const h = new Float32Array(size * size);
  const waves = Array.from({ length: 14 }, (_, i) => ({ kx: Math.round(Math.sin(i * 3.1) * 9), ky: Math.round(Math.cos(i * 2.3) * 9) || 1, a: 0.3 + (i % 5) * 0.15, p: i * 1.7 }));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let v = 0; for (const w of waves) v += w.a * Math.sin((w.kx * x + w.ky * y) / size * Math.PI * 2 + w.p); h[y * size + x] = v; }
  return canvasTexture(size, (ctx, s) => {
    const img = ctx.createImageData(s, s); const n = new THREE.Vector3();
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const dx = h[y * s + (x + 1) % s] - h[y * s + (x - 1 + s) % s]; const dy = h[((y + 1) % s) * s + x] - h[((y - 1 + s) % s) * s + x]; n.set(-dx * 0.35, -dy * 0.35, 1).normalize(); const i = (y * s + x) * 4; img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
  }, { srgb: false });
}

let gltf = null;
export function loadModel(url) {
  if (!gltf) { gltf = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/evermile/vendor/draco/').setWorkerLimit(1)); }
  return new Promise((res, rej) => gltf.load(url, g => res(g), undefined, rej));
}
export function shadowed(root, cast = true, receive = true) { root.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } }); return root; }

export function loadingUI(label) {
  const el = document.createElement('div'); el.className = 'loading'; el.innerHTML = `<div class="loading-ring"></div><p>${label}</p><small id="load-progress">Loading models and materials</small>`; document.body.append(el);
  return { set: t => { const s = el.querySelector('#load-progress'); if (s) s.textContent = t; }, done: () => { el.classList.add('out'); setTimeout(() => el.remove(), 600); } };
}

// Soft volumetric light shaft for cones (street lamps, headlights, torches): brightest at the tip,
// fading toward the base and toward the silhouette edges. Additive, so it reads as lit haze or rain.
export function beamMaterial(color = 0xffd9a0, strength = 0.12) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uStrength; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.0); float a = pow(vUv.y, 1.8) * f * uStrength; gl_FragColor = vec4(uColor * a, 1.0); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
}
// A cone whose tip sits at the origin and opens along +Z (rotate/position it to aim).
export function beamCone(radius, length, mat) { const g = new THREE.ConeGeometry(radius, length, 32, 1, true); g.translate(0, -length / 2, 0); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat); m.renderOrder = 5; return m; }
