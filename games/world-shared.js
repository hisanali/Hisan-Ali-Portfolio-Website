// Shared scene plumbing for the fully lit 3D games: renderer with shadows and post-processing, sky and
// environment lighting, PBR texture sets, glTF loading and the UI helpers from the arcade shell.
import * as THREE from '/evermile/vendor/three.module.js';
import { EffectComposer } from '/evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '/evermile/vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/evermile/vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/evermile/vendor/postprocessing/OutputPass.js';
import { Sky } from '/penalty/vendor/three-addons/objects/Sky.js';
import { SimplexNoise } from '/penalty/vendor/three-addons/math/SimplexNoise.js';
import { GLTFLoader } from '/evermile/vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from '/evermile/vendor/loaders/DRACOLoader.js';
export { THREE, Sky, SimplexNoise };
export { $, Particles, Sound, ui, seg, clamp, lerp, mulberry } from '/games/neon-shared.js';

export function makeWorld(canvas, { fov = 60, near = 0.3, far = 1200, bloom = 0.35, threshold = 0.85, radius = 0.4, shadows = true, exposure = 1.0 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloom, radius, threshold);
  composer.addPass(bloomPass); composer.addPass(new OutputPass());
  const resize = () => { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize); resize();
  return { renderer, scene, camera, composer, bloomPass, resize };
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
  const light = new THREE.DirectionalLight(color, intensity); light.castShadow = true;
  const s = light.shadow; s.mapSize.set(mapSize, mapSize); s.camera.left = -size; s.camera.right = size; s.camera.top = size; s.camera.bottom = -size; s.camera.near = near; s.camera.far = far; s.bias = -0.0005; s.normalBias = 0.6;
  scene.add(light); scene.add(light.target); return light;
}

const texLoader = new THREE.TextureLoader();
export function pbr(name, { repeat = 8, roughness = 1, metalness = 0, normalScale = 1, color = 0xffffff } = {}) {
  const base = `/evermile/assets/materials/${name}`;
  const load = (suffix, srgb) => { const t = texLoader.load(`${base}_${suffix}_1k.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return new THREE.MeshStandardMaterial({ color, map: load('diff', true), normalMap: load('nor_gl'), roughnessMap: load('rough'), roughness, metalness, normalScale: new THREE.Vector2(normalScale, normalScale) });
}

export function canvasTexture(size, draw, { repeat = 1, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
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
