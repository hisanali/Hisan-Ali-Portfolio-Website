// Afterdark renderer: HDR pipeline with MSAA, bloom and a film grade, a real-time planar reflection for the
// wet road, and a live cube map so the car's paint mirrors the street it is driving through.
import * as THREE from '/evermile/vendor/three.module.js';
import { EffectComposer } from '/evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '/evermile/vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/evermile/vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/evermile/vendor/postprocessing/OutputPass.js';
import { ShaderPass } from '/evermile/vendor/postprocessing/ShaderPass.js';
export { THREE };

const PRESETS = {
  ultra: { dpr: 2, msaa: 4, refl: 0.6, cube: 256, cubeEvery: 1, rain: 5000, traffic: 34, lights: 8, people: 12 },
  high: { dpr: 1.5, msaa: 4, refl: 0.5, cube: 128, cubeEvery: 2, rain: 3500, traffic: 28, lights: 6, people: 8 },
  medium: { dpr: 1.25, msaa: 2, refl: 0.35, cube: 128, cubeEvery: 4, rain: 2200, traffic: 20, lights: 5, people: 4 },
  low: { dpr: 1, msaa: 0, refl: 0, cube: 64, cubeEvery: 0, rain: 1200, traffic: 14, lights: 4, people: 0 }
};
export const QUALITY = (() => {
  try { const q = new URLSearchParams(location.search).get('gfx') || localStorage.getItem('afterdark:gfx'); if (PRESETS[q]) return q; } catch (e) {}
  return matchMedia('(pointer:coarse)').matches ? 'medium' : 'high';
})();
export const Q = PRESETS[QUALITY];

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// Removes NaN/Inf pixels and caps runaway highlights before bloom spreads them.
const Clean = { uniforms: { tDiffuse: { value: null } }, vertexShader: VERT, fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); if (!(c.r >= 0.0 && c.r < 1e20) || !(c.g >= 0.0 && c.g < 1e20) || !(c.b >= 0.0 && c.b < 1e20)) c.rgb = vec3(0.0); gl_FragColor = vec4(min(c.rgb, vec3(40.0)), 1.0); }` };
// Lens and film: speed blur toward the vanishing point, chromatic fringing, vignette, grain and a cool/warm grade.
const Film = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uSpeed: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uFlash: { value: 0 } },
  vertexShader: VERT,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uSpeed, uFlash; uniform vec2 uCenter; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec2 d = vUv - uCenter; float r2 = dot(d, d);
    float blur = uSpeed * smoothstep(0.02, 0.45, r2) * 0.06;
    vec3 col = vec3(0.0); float j = h(vUv * 913.0 + uTime) - 0.5;
    for (int i = 0; i < 6; i++) { float t = (float(i) + j) / 6.0; vec2 uv = vUv - d * blur * t; float ca = (0.0015 + 0.004 * uSpeed) * r2 * 2.0;
      col += vec3(texture2D(tDiffuse, uv + d * ca).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - d * ca).b); }
    col /= 6.0;
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(l), col, 1.08);
    col = mix(col * vec3(0.94, 1.0, 1.08), col * vec3(1.06, 1.0, 0.95), smoothstep(0.15, 0.75, l));
    col = (col - 0.5) * 1.06 + 0.5;
    col *= 1.0 - 0.55 * smoothstep(0.2, 1.0, r2 * 2.4);
    col += (h(vUv * 1400.0 + uTime * 3.1) - 0.5) * 0.03;
    col += uFlash * vec3(1.0, 0.85, 0.7);
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0); }`
};

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.25, 1600);
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: Q.msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass(Clean));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.48, 0.7, 1.0); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass(Film); composer.addPass(film);

  // ---- Planar reflection of everything above the road (y = 0) ----
  const refl = { on: Q.refl > 0, target: null, cam: new THREE.PerspectiveCamera(), matrix: new THREE.Matrix4(), hide: [], uniforms: { uRefl: { value: null }, uReflVP: { value: new THREE.Matrix4() }, uReflOn: { value: Q.refl > 0 ? 1 : 0 }, uTime: { value: 0 } } };
  if (refl.on) { refl.target = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter }); refl.uniforms.uRefl.value = refl.target.texture; }
  else refl.uniforms.uRefl.value = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  if (!refl.on) refl.uniforms.uRefl.value.needsUpdate = true;
  const dir = new THREE.Vector3(), tgt = new THREE.Vector3();
  function renderReflection() {
    if (!refl.on) return;
    const c = refl.cam; c.fov = camera.fov; c.aspect = camera.aspect; c.near = 0.3; c.far = 900; c.updateProjectionMatrix();
    camera.getWorldDirection(dir); c.position.set(camera.position.x, -camera.position.y, camera.position.z);
    tgt.set(c.position.x + dir.x, c.position.y - dir.y, c.position.z + dir.z); c.up.set(0, 1, 0); c.lookAt(tgt); c.updateMatrixWorld();
    refl.uniforms.uReflVP.value.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse);
    for (const o of refl.hide) { o.userData._v = o.visible; o.visible = false; }
    const prev = renderer.getRenderTarget(); renderer.setRenderTarget(refl.target); renderer.clear(); renderer.render(scene, c); renderer.setRenderTarget(prev);
    for (const o of refl.hide) o.visible = o.userData._v;
  }

  // ---- Live cube map for the player's car, one face per frame ----
  const cubeRT = new THREE.WebGLCubeRenderTarget(Q.cube, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.6, 500, cubeRT); scene.add(cubeCam);
  const cube = { texture: cubeRT.texture, hide: [], face: 0, tick: 0, primed: false };
  function setHidden(list, hidden) { for (const o of list) { if (hidden) { o.userData._v = o.visible; o.visible = false; } else o.visible = o.userData._v; } }
  function primeCube(pos) { cubeCam.position.copy(pos); setHidden(cube.hide, true); cubeCam.update(renderer, scene); setHidden(cube.hide, false); cube.primed = true; }
  function updateCube(pos) {
    if (!cube.primed) return primeCube(pos);
    if (!Q.cubeEvery) return;
    if (++cube.tick % Q.cubeEvery) return;
    if (cube.face === 0) { cubeCam.position.copy(pos); cubeCam.updateMatrixWorld(); }
    setHidden(cube.hide, true);
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(cubeRT, cube.face); renderer.render(scene, cubeCam.children[cube.face]); renderer.setRenderTarget(prev);
    setHidden(cube.hide, false);
    if (++cube.face === 6) { cube.face = 0; cubeRT.texture.needsPMREMUpdate = true; }
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (refl.on) { const pr = renderer.getPixelRatio() * Q.refl; refl.target.setSize(Math.max(2, Math.round(w * pr)), Math.max(2, Math.round(h * pr))); }
  }
  window.addEventListener('resize', resize); resize();
  const t0 = performance.now();
  function render(pos) {
    const t = (performance.now() - t0) * 0.001; film.uniforms.uTime.value = t % 100; refl.uniforms.uTime.value = t;
    updateCube(pos); renderReflection(); composer.render();
  }
  return { renderer, scene, camera, composer, bloom, film, refl, cube, render, resize, primeCube };
}
