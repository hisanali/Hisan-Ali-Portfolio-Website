import * as THREE from 'three';
import { patchThree, Q, pending, clamp, damp, lerp, setAniso, A } from './core.js';
import { Env, PRESETS } from './weather.js';
import { Sky } from './sky.js';
import { Post } from './post.js';
import { Rig } from './camera.js';
import { FX } from './fx.js';
import { Sound } from './audio.js';
import { UI } from './ui.js';

export const WORLDS = [
  { id: 'ocean', name: 'Open Ocean', line: 'A brig under sail, a long way from land.' },
  { id: 'coast', name: 'Lighthouse Coast', line: 'Swell breaking on a headland below the light.' },
  { id: 'forest', name: 'Old Forest', line: 'Oak, ash and pine over a stream.' },
  { id: 'alpine', name: 'High Alps', line: 'Snowfields, rock walls and a valley under cloud.' },
  { id: 'fjord', name: 'Arctic Fjord', line: 'A glacier front and the ice it sheds.' },
  { id: 'desert', name: 'Dune Sea', line: 'Sand on the move below a far escarpment.' },
  { id: 'volcano', name: 'Volcano', line: 'Fresh lava, ash fall and a restless crater.' },
  { id: 'ruins', name: 'Lost Temple', line: 'Stonework that the woods are taking back.' },
];
const loaders = {
  ocean: () => import('./worlds/ocean.js'), coast: () => import('./worlds/coast.js'), forest: () => import('./worlds/forest.js'), alpine: () => import('./worlds/alpine.js'),
  fjord: () => import('./worlds/fjord.js'), desert: () => import('./worlds/desert.js'), volcano: () => import('./worlds/volcano.js'), ruins: () => import('./worlds/ruins.js'),
};

const qs = new URLSearchParams(location.search);
const errBox = document.getElementById('err');
addEventListener('error', (e) => { errBox.textContent += (e.message || e) + '\n'; });
addEventListener('unhandledrejection', (e) => { errBox.textContent += (e.reason?.stack || e.reason) + '\n'; });

function pickQuality() {
  if (qs.has('q')) return +qs.get('q');
  const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); if (!gl) return 0;
  const ext = gl.getExtension('WEBGL_debug_renderer_info'); const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
  if (/swiftshader|llvmpipe|software/i.test(name)) return 0;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (mobile) return 1;
  if (/Intel|UHD|Iris|Mali|Adreno/i.test(name) && !/Arc/i.test(name)) return 1;
  return 2;
}

class App {
  constructor() {
    patchThree();
    const q = Q.level = pickQuality();
    Q.steps = [8, 14, 22, 30][q] ?? 22; Q.shadow = [1024, 2048, 4096, 4096][q] ?? 2048;
    const canvas = document.getElementById('view');
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, reversedDepthBuffer: true });
    this.pixelRatio = qs.has('res') ? +qs.get('res') : Math.min(devicePixelRatio || 1, q >= 2 ? 1.5 : q === 1 ? 1.25 : 1);
    this.maxRatio = this.pixelRatio; this.fixedRes = qs.has('res');
    r.setPixelRatio(this.pixelRatio); r.setSize(innerWidth, innerHeight, false);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.NoToneMapping; r.outputColorSpace = THREE.SRGBColorSpace; r.info.autoReset = true;
    setAniso(Math.min(r.capabilities.getMaxAnisotropy(), q >= 2 ? 12 : 4));
    this.scene = new THREE.Scene(); this.scene.fog = new THREE.FogExp2(0x000000, 0.0001); // enables the atmosphere chunk
    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.25, 140000);
    this.env = new Env(); this.sky = new Sky(r, this.scene, this.env); this.post = new Post(r);
    this.fx = new FX(this); this.sound = new Sound(this); this.rig = new Rig(this);
    this.world = null; this.worldId = null; this.time = 0; this.clock = new THREE.Clock(); this.noLock = qs.has('nolock');
    this.manual = qs.has('manual'); this.loading = false; this.fadeT = 0; this.fadeV = 0;
    this.env.onThunder = (dist, az) => this.sound.thunder(dist, az);
    this.env.onBolt = (az, dist, dur) => this.fx.bolt(az, dist, dur);
    this.ui = new UI(this, WORLDS);
    addEventListener('resize', () => this.resize());
    this.focus = new THREE.Vector3();
  }
  resize() {
    const r = this.renderer; r.setSize(innerWidth, innerHeight, false); const s = r.getDrawingBufferSize(new THREE.Vector2());
    this.post.setSize(s.x, s.y); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
  }
  async loadWorld(id, opts = {}) {
    if (this.loading || !loaders[id]) return; this.loading = true;
    const meta = WORLDS.find((w) => w.id === id);
    this.ui.veil(true, meta.name, meta.line);
    this.fadeT = 0; await new Promise((res) => setTimeout(res, this.world ? 650 : 30));
    if (this.world) { this.sound.leave(); this.scene.remove(this.world.group); this.world.dispose?.(); this.fx.clear(); this.world = null; }
    const mod = await loaders[id]();
    const env = this.env, d = mod.default.defaults || {};
    env.lat = d.lat ?? 45; env.decl = d.decl ?? 12; env.north = d.north ?? 0; env.cold = !!d.cold; env.baseSnow = d.baseSnow ?? 0; env.windUser = null; env.windAngle = d.windAngle ?? 0.6;
    env.setPreset(opts.weather || d.weather || 'fair', true); env.setTime(opts.time || d.time || 'day', true); if (opts.hour != null) env.hour = opts.hour;
    Object.assign(this.sky.world, { cloudBase: 1300, cloudThick: 1700, cirrus: 0.3, fogBase: 0, fogFalloff: 0.012, fogDensity: 0, aurora: 0, hazeMul: 1, fogTint: null, fogTintAmt: 0 }, d.sky || {});
    if (d.ground) this.sky.world.ground.setRGB(...d.ground);
    this.ui.progress(0.15);
    const world = await mod.default.create(this);
    world.id = id; world.meta = meta; this.scene.add(world.group); this.world = world; this.worldId = id;
    this.sky.shadowRange = world.shadowRange || 110; this.sky.forceEnv = true;
    this.rig.reset(); this.sound.enter(world);
    // wait for textures, then let a few frames settle before revealing
    const t0 = performance.now();
    while (pending.done < pending.n && performance.now() - t0 < 20000) { this.ui.progress(0.3 + 0.6 * pending.done / Math.max(pending.n, 1)); await new Promise((res) => setTimeout(res, 60)); }
    this.ui.progress(1); this.ui.setWorld(meta);
    this.loading = false; this.frames = 0;
    if (!this.manual) await new Promise((res) => setTimeout(res, 350));
    if (this.entered || qs.has('auto')) this.ui.veil(false);
    else this.ui.veilReady();
    try { try { history.replaceState(null, '', '?' + (() => { const p = new URLSearchParams(location.search); p.set('world', id); return p; })()); } catch (e) { /* ignore */ } } catch (e) { /* sandboxed frames may refuse */ }
  }
  frame(dt) {
    dt = Math.min(dt, 0.1); this.time += dt; const env = this.env, w = this.world;
    env.update(dt);
    if (w) {
      w.update?.(dt, this.time);
      this.rig.update(dt);
      const cam = this.camera;
      const alt = (w.altitude || 0) + cam.position.y;
      this.sky.update(cam, dt, alt);
      this.rig.mode === 'orbit' ? this.focus.copy(this.rig.orbit.cur) : cam.getWorldDirection(this.focus).multiplyScalar(this.sky.shadowRange * 0.55).add(cam.position);
      if (w.shadowFocus) w.shadowFocus(this.focus);
      this.sky.updateShadow(this.focus);
      this.fx.update(dt, cam, env, w);
      this.sound.update(dt, cam, env, w);
      // exposure follows the light the way an eye or a camera would, without fully flattening night
      const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      const E = env.lightIntensity * Math.max(env.lightDir.y, 0.08) * lum(env.lightColor) * 0.3 + lum(this.sky.amb) * 3.1 + 0.0006 + (w.ambientE || 0);
      const target = clamp(1.55 * Math.pow(E, -0.74), 0.3, 14) * (w.exposure || 1) * lerp(1, 0.8, env.night * (1 - (w.ambientE ? 0.5 : 0)));
      env.exposure = this.frames < 3 ? target : damp(env.exposure, target, 0.9, dt);
      this.post.u.uFade.value = (this.rig.fade ?? 1);
      this.post.u.uShimmer.value = (w.shimmer || 0) * clamp(env.lightIntensity / 5) * (1 - env.w.cloud * 0.6);
      if (w.preRender) w.preRender(this.renderer, this.scene, cam);
      this.post.render(this.scene, cam, env, this.time);
      this.frames = (this.frames || 0) + 1;
    }
    this.ui.tick(dt);
  }
  adapt(dt) { // keep the frame rate usable by trading resolution, within limits
    if (this.fixedRes || this.loading || !this.world) return; this._ft = (this._ft ?? dt) * 0.96 + dt * 0.04; this._at = (this._at || 0) + dt; if (this._at < 2.5 || this.frames < 40) return; this._at = 0;
    const max = this.maxRatio, min = Math.min(0.55, max); let pr = this.pixelRatio;
    if (this._ft > 1 / 26) pr = Math.max(min, pr * 0.85); else if (this._ft < 1 / 52 && pr < max) pr = Math.min(max, pr * 1.1); else return;
    if (Math.abs(pr - this.pixelRatio) < 0.01) return; this.pixelRatio = pr; this.renderer.setPixelRatio(pr); this.resize();
  }
  run() {
    if (this.manual) return;
    const loop = () => { requestAnimationFrame(loop); const dt = this.clock.getDelta(); this.frame(dt); this.adapt(dt); };
    loop();
  }
  step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) this.frame(dt); }
}

const app = window.app = new App();
app.ready = (async () => {
  const id = qs.get('world') && loaders[qs.get('world')] ? qs.get('world') : 'ocean';
  if (qs.has('mode')) app.rig.mode = qs.get('mode');
  app.run();
  await app.loadWorld(id, { weather: qs.get('weather'), time: qs.get('time'), hour: qs.has('hour') ? +qs.get('hour') : null });
  if (qs.has('mode')) app.rig.setMode(qs.get('mode'), true);
  return true;
})();
