import {Intro} from './loader.js?v=20260926-intro1';
import {citizenKey} from './citizen-assets.js?v=20260926-supplied7';
import {motorcycleLean} from './wheel-rig.js?v=20260926-supplied7';
import {DetailedModels} from './detailed-models.js?v=20260926-supplied7';
import {boomFraction} from './camera-clearance.js?v=20260926-supplied7';
import {DESTINATIONS, inDestination} from './destinations.js?v=20260926-supplied7';
import {traction, longitudinal, steeringMotion, steeringTarget, advancePose, VEHICLE_DYNAMICS} from './handling.js?v=20260926-supplied7';
import * as T from './vendor/three.module.js';
import {World} from './world.js?v=20260926-supplied7';
import {CameraOrbit} from './camera-orbit.js?v=20260926-supplied7';
import {Vehicle} from './vehicle.js?v=20260926-supplied7';
import {Effects} from './effects.js?v=20260926-supplied7';
import {Life} from './life.js?v=20260926-supplied7';
import {TownLife} from './townlife.js?v=20260926-supplied7';
import {Railway} from './railway.js?v=20260926-supplied7';
import {Atmosphere, PRESETS} from './atmosphere.js?v=20260926-supplied7';
import {Windscreen, Mirror} from './cockpit.js?v=20260926-supplied7';
import {Radio, STATIONS} from './radio.js?v=20260926-supplied7';
import {DriveAudio} from './audio.js?v=20260926-supplied7';
import {clamp, damp, angleDifference, smooth, lerp} from './math.js?v=20260926-supplied7';
import {ZONE, TYPES} from './network.js?v=20260926-supplied7';
import {EffectComposer} from './vendor/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './vendor/postprocessing/UnrealBloomPass.js';
import {OutputPass} from './vendor/postprocessing/OutputPass.js';

/* ---------- Settings and state ---------- */
export const settings = {destination: 'journey', seed: 'the-long-way', roadStyle: 'winding', location: 'hills', season: 'spring', planet: 'mars', time: 'dawn', clock: 'live', weather: 'changing', vehicle: 'coupe', color: '#b51f25', roadWidth: 10.6, quality: 'high', camera: 0, volume: .35, steerAssist: .8, speedFactor: 1, grip: .7, units: 'km', autoMode: 'full', autoLane: 'left', trafficOncoming: 'on', trafficOwn: 'on', cyclists: 'on', rushMode: 'off', junctions: 'surprise', fuel: 'on', mirror: 'on', radio: 0, radioVolume: .55, vehicleVolume: 1, weatherVolume: 1, sfxVolume: 1, fov: 45, hideUI: false, version: 4};
let savedVersion = 2;
try { const saved = JSON.parse(localStorage.getItem('evermile-settings') || 'null'); if (saved && typeof saved === 'object') { savedVersion = saved.version || 1; for (const k of Object.keys(settings)) if (k !== 'version' && typeof saved[k] === typeof settings[k]) settings[k] = saved[k]; } } catch {}
// Players from before the living world get it switched on once.
if (savedVersion < 2) { settings.weather = 'changing'; settings.clock = 'live'; }
// Calmer steering by default from version 3.
if (savedVersion < 3 && settings.grip === 1) settings.grip = .7;
// The new standard journey from version 4: spring dawn on winding roads, a red coupé, traffic and the fuel gauge on.
if (savedVersion < 4) Object.assign(settings, {season: 'spring', time: 'dawn', clock: 'live', weather: 'changing', roadStyle: 'winding', junctions: 'surprise', color: '#b51f25', camera: 0, quality: 'high', fov: 45, autoMode: 'full', rushMode: 'off', trafficOncoming: 'on', trafficOwn: 'on', cyclists: 'on', fuel: 'on', mirror: 'on'});
const valid = {destination: Object.keys(DESTINATIONS), roadStyle: ['winding', 'straight', 'casual', 'normal'], location: ['hills', 'offworld'], season: ['spring', 'summer', 'autumn', 'winter'], planet: ['mars', 'moon', 'venus'], time: ['dawn', 'day', 'sunset', 'night'], clock: ['live', 'still'], weather: ['changing', 'clear', 'overcast', 'rain'], vehicle: ['coupe', 'coach', 'bike', 'mercedes'], quality: ['low', 'medium', 'high', 'ultra'], units: ['km', 'mi'], autoMode: ['full', 'steering', 'speed'], autoLane: ['left', 'right', 'center'], trafficOncoming: ['on', 'off'], trafficOwn: ['on', 'off'], cyclists: ['on', 'off'], rushMode: ['off', 'on'], junctions: ['surprise', 'straight'], fuel: ['off', 'on'], mirror: ['on', 'off']};
for (const [k, v] of Object.entries(valid)) if (!v.includes(settings[k])) settings[k] = v[0];
settings.camera = clamp(settings.camera, 0, 4); settings.radio = clamp(Math.round(settings.radio), -1, STATIONS.length - 1); settings.version = 4;

export const state = {started: false, paused: false, auto: false, speed: 0, x: 0, z: 35, y: 0, yaw: 0, steer: 0, distance: 0, time: 0, fps: 60, headlights: false, cruise: false, cruiseSpeed: 22, photo: false, offroad: false, inspection: false, indicator: 0, fuel: 1, dirt: 0, medianSide: 1};
try { state.distance = Number(localStorage.getItem('evermile-distance')) || 0; state.fuel = clamp(Number(localStorage.getItem('evermile-fuel') ?? 1), 0, 1); if (Number.isNaN(state.fuel)) state.fuel = 1; } catch {}
export const keys = {};

/* ---------- Touch driving ---------- */
const touchPointers = new Map(), touchCounts = {KeyA: 0, KeyD: 0, KeyW: 0, KeyS: 0};
function beginTouchDrive(pointerId, code) { touchPointers.set(pointerId, code); touchCounts[code] = (touchCounts[code] || 0) + 1; keys[code] = true; }
function endTouchDrive(pointerId) { const code = touchPointers.get(pointerId); if (!code) return; touchPointers.delete(pointerId); touchCounts[code] = Math.max(0, (touchCounts[code] || 0) - 1); if (touchCounts[code] === 0) keys[code] = false; }
function endAllTouchDrive() { for (const id of touchPointers.keys()) touchCounts[touchPointers.get(id)] = 0; for (const code of Object.keys(touchCounts)) keys[code] = false; touchPointers.clear(); }

const $ = (id) => document.getElementById(id);
let renderer, world, vehicle, scene, camera, sun, hemi, pmrem, envTarget, effects, life, town, railway, atmo, windscreen, mirror, radio;
let last = 0, accumulator = 0, hudClock = 0, fpsTime = 0, fpsFrames = 0, panelOpen = false, frameId;
const cameraPos = new T.Vector3(), lookTarget = new T.Vector3(), tmp = new T.Vector3();
const driveOrbit = new CameraOrbit();
let chaseOrbitRadius = 0, orbitYaw = .72, orbitPitch = .28, orbitDistance = 7.5, orbitPointer = null;
let audioContext, windGain, mixer = null, audioReady = false, muted = false, driveAudio = null, horning = false;
// High quality extras: bloom on bright lights and live reflections on your car. They switch off by themselves if the frame rate drops.
let detailedModels, intro, starting = false;
let composer = null, bloom = null, cubeRT = null, cubeCam = null, cubeFace = 0, highFx = true, slowTime = 0;
let lastEnv = null, envClock = 0, tunnelDim = 1, valleyY = 0, valleyClock = 0, blockedTime = 0, lastType = null, lastTown = null, cardJunction = null, stopShown = null, stopStill = 0, lastTick = null;

function setupHighFx() {
  const on = ['high', 'ultra'].includes(settings.quality) && highFx && renderer.capabilities.isWebGL2;
  if (!on) {
    if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); composer = null; bloom = null; }
    if (cubeRT) { cubeRT.dispose(); cubeRT = null; scene.remove(cubeCam); cubeCam = null; vehicle?.setEnvMap(null); }
    return;
  }
  if (!composer) {
    const size = renderer.getDrawingBufferSize(new T.Vector2());
    composer = new EffectComposer(renderer, new T.WebGLRenderTarget(size.x, size.y, {type: T.HalfFloatType, samples: 4}));
    composer.addPass(new RenderPass(scene, camera)); bloom = new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), .3, .45, 1); composer.addPass(bloom); composer.addPass(new OutputPass());
    composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  }
  if (!cubeRT) { cubeRT = new T.WebGLCubeRenderTarget(128, {type: T.HalfFloatType, generateMipmaps: false}); cubeCam = new T.CubeCamera(.5, 1500, cubeRT); cubeCam.layers.set(3); scene.add(cubeCam); cubeFace = 0; }
}
// One cube face per frame, so the reflection costs one small extra render; the car itself is not on the reflection layer.
function updateLiveReflection() {
  if (!cubeCam) return;
  if (cubeCam.coordinateSystem !== renderer.coordinateSystem) { cubeCam.coordinateSystem = renderer.coordinateSystem; cubeCam.updateCoordinateSystem(); }
  cubeCam.position.set(state.x, state.y + 1.1, state.z); cubeCam.updateMatrixWorld(true);
  const auto = renderer.shadowMap.autoUpdate, prev = renderer.getRenderTarget(); renderer.shadowMap.autoUpdate = false;
  renderer.setRenderTarget(cubeRT, cubeFace); renderer.render(scene, cubeCam.children[cubeFace]); renderer.setRenderTarget(prev); renderer.shadowMap.autoUpdate = auto;
  cubeFace = (cubeFace + 1) % 6;
  if (cubeFace === 0) { cubeRT.texture.needsPMREMUpdate = true; vehicle.setEnvMap(cubeRT.texture); }
}
function watchPerformance(dt) { if (!composer && !cubeRT) return; if (state.started && state.time > 8 && state.fps < (settings.quality === 'ultra' ? 18 : 24)) slowTime += dt; else slowTime = Math.max(0, slowTime - dt); if (slowTime > 10) { highFx = false; setupHighFx(); toast('Effects reduced for smoother driving'); } }

/* ---------- Start up ---------- */
try {
  renderer = new T.WebGLRenderer({canvas: $('game'), antialias: true, alpha: false, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, settings.quality === 'ultra' ? 2 : settings.quality === 'high' ? 1.5 : settings.quality === 'medium' ? 1.15 : 1)); renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; renderer.shadowMap.enabled = settings.quality !== 'low'; renderer.shadowMap.type = T.PCFSoftShadowMap;
  scene = new T.Scene(); camera = new T.PerspectiveCamera(settings.fov, innerWidth / innerHeight, .08, 3000);
  hemi = new T.HemisphereLight(0xdce9f3, 0x646443, 2.05); scene.add(hemi);
  sun = new T.DirectionalLight(0xfff2d6, 3); sun.castShadow = true; sun.shadow.mapSize.set(settings.quality === 'ultra' ? 4096 : 2048, settings.quality === 'ultra' ? 4096 : 2048); Object.assign(sun.shadow.camera, {left: -65, right: 65, top: 80, bottom: -65, near: 1, far: 300}); sun.shadow.normalBias = .055; sun.shadow.bias = -.00015; scene.add(sun, sun.target);
  atmo = new Atmosphere(settings);
  try { const saved = localStorage.getItem('evermile-hour'), h = Number(saved); if (saved !== null && settings.clock === 'live' && h >= 0 && h < 24) atmo.hour = h; } catch {}
  world = new World(scene, settings, atmo);
  vehicle = new Vehicle(scene, settings.vehicle, settings.color);
  effects = new Effects({scene, renderer, camera, world, settings, hemi, sun, getVolume: () => state.started && !state.paused && !muted && !panelOpen && !state.inspection ? settings.volume : 0, getState: () => state});
  life = new Life({scene, world, settings, getState: () => state});
  railway = new Railway({scene, world, settings, getState: () => state});
  town = new TownLife({scene, world, settings, getState: () => state, life});
  life.town = town; life.railway = railway;
  windscreen = new Windscreen($('windscreen'));
  mirror = new Mirror(renderer, scene);
  reset(); world.update(state.z, camera, true); setupHighFx(); applyAtmosphere(0, true); initUI();
  intro = new Intro($('intro'), renderer, scene, () => camera);
  frameId = requestAnimationFrame(frame);
} catch (error) { console.error(error); $('fatal-message').textContent = error.message; $('fatal').hidden = false; }

function save() { try { localStorage.setItem('evermile-settings', JSON.stringify(settings)); localStorage.setItem('evermile-distance', String(state.distance)); localStorage.setItem('evermile-fuel', String(state.fuel)); localStorage.setItem('evermile-hour', String(atmo.hour)); } catch {} }

// Your lane's offset from the road centre (the slow lane on a motorway, or the centre if you asked for it on a single-lane road).
function ownLaneX(z, lane) { const r = world.road; if (settings.autoLane === 'center' && r.laneCount(z) === 1) return 0; return r.laneX(z, 1, lane ?? r.homeLane(z)); }

export function reset() {
  releaseCameraDrag(true);
  const r = world.road, z = state.z;
  state.laneIndex = r.homeLane(z); state.x = r.x(z) + ownLaneX(z, state.laneIndex); state.y = r.y(z); state.yaw = Math.atan(r.tangent(z));
  state.speed = 0; state.steer = 0; state.yawRate = 0; state.lateralAcceleration = 0; state.vy = 0; state.lastGround = undefined; state.grounded = true; state.pass = null; state.pit = null; state.viewing = null;
  state.medianSide = Math.sign(state.x - r.x(z)) || 1;
  updateCar(1 / 60); positionCamera(1, true);
}
// The Begin button waits behind the loading screen until every model is in and every shader is ready, then drops you on the road.
function beginWithIntro() {
  if (state.started || starting) return; starting = true; initAudio();
  intro.run({task: () => { $('start').hidden = true; }}).then(() => { starting = false; begin(); });
}
// Settings that build a new world or swap the vehicle go behind a shorter version of the same screen.
const LOADED_SETTINGS = {destination: (v) => DESTINATIONS[v]?.name, seed: () => 'A new road', roadStyle: () => 'A new road', location: (v) => v === 'offworld' ? 'Off world' : 'The hills', planet: (v) => v, vehicle: (v) => ({coupe: 'Sports coupé', coach: 'Coach', bike: 'Motorcycle', mercedes: 'Mercedes W201'})[v]};
function changeSettingLoaded(key, value, after) {
  if (!state.started || !LOADED_SETTINGS[key] || settings[key] === value || intro.busy) { changeSetting(key, value); after?.(); return; }
  const wasPaused = state.paused; state.paused = true;
  intro.run({quick: true, minimum: 1300, label: String(LOADED_SETTINGS[key](value) || '').toUpperCase(), task: () => { changeSetting(key, value); after?.(); }}).then(() => { state.paused = wasPaused; updateUI(); });
}
export function begin() { if (state.started) return; state.started = true; $('start').classList.add('leaving'); setTimeout(() => $('start').hidden = true, 700); initAudio(); radio?.notify('start'); toast('WASD to drive · Drag to look around · F for autodrive'); }
export function toggleAuto(value = !state.auto) { state.auto = value; if (value) state.cruise = false; updateUI(); toast(value ? 'Autodrive on. Enjoy the view.' : 'You’re in control.'); }
export function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').classList.remove('visible'), 2700); }

export function changeSetting(key, value) {
  if (!(key in settings)) return;
  if (key === 'destination' && !DESTINATIONS[value]) return;
  settings[key] = value;
  if (key === 'destination') { lastType = null; settings.location = 'hills'; settings.seed = 'the-long-way'; state.auto = false; state.z = 35; state.viewing = null; state.inspection = false; state.fuel = Math.max(state.fuel, .5); }
  save();
  const rebuild = ['destination', 'seed', 'roadStyle', 'location', 'roadWidth', 'season', 'planet', 'quality', 'autoLane'];
  if (rebuild.includes(key)) {
    const moving = state.speed, same = !['destination', 'seed', 'roadStyle', 'location'].includes(key); world.rebuild(same); life.clear();
    if (['destination', 'seed', 'roadStyle', 'location'].includes(key)) { state.z = 35; reset(); } else { const r = world.road; state.laneIndex = r.homeLane(state.z); }
    world.update(state.z, camera, true); if (!['destination', 'seed', 'roadStyle', 'location'].includes(key)) state.speed = moving;
  }
  if (key === 'destination') { settings.time = DESTINATIONS[value].time || 'day'; atmo.setPreset(settings.time); save(); lastEnv = null; effects.refresh(); applyAtmosphere(0, true); }
  if (key === 'vehicle') { state.steer = 0; state.yawRate = 0; state.lateralAcceleration = 0; state.tireSlip = 0; vehicle.dispose(); vehicle = new Vehicle(scene, settings.vehicle, settings.color); if (cubeRT) vehicle.setEnvMap(cubeRT.texture); }
  if (key === 'color') vehicle.setColor(value);
  if (key === 'time') { atmo.setPreset(value); lastEnv = null; }
  if (key === 'weather') atmo.applyWeather(true);
  if (['time', 'weather', 'season', 'location', 'planet'].includes(key)) { world.updatePalette(); effects.refresh(); applyAtmosphere(0, true); }
  if (key === 'quality') { const size = value === 'ultra' ? 4096 : 2048; sun.shadow.mapSize.set(size,size); sun.shadow.map?.dispose(); sun.shadow.map = null; renderer.setPixelRatio(Math.min(devicePixelRatio, value === 'ultra' ? 2 : value === 'high' ? 1.5 : value === 'medium' ? 1.15 : 1)); renderer.shadowMap.enabled = value !== 'low'; highFx = true; slowTime = 0; setupHighFx(); composer?.setPixelRatio(renderer.getPixelRatio()); composer?.setSize(innerWidth, innerHeight); applyAtmosphere(0, true); }
  if (key === 'camera') { releaseCameraDrag(true); positionCamera(1, true); }
  if (key === 'radioVolume') radio?.update(0);
  updateUI();
}

/* ---------- Light, sky and reflections from the clock and the weather ---------- */
function applyAtmosphere(dt, force = false) {
  const a = atmo, r = world.road;
  // Mist settles in the lowest ground around the road ahead and behind.
  valleyClock -= dt;
  if (valleyClock <= 0 || force) { valleyClock = 1; let lo = Infinity; for (let q = state.z - 1500; q <= state.z + 1500; q += 150) lo = Math.min(lo, r.y(q)); valleyY = lo; }
  a.update(state.started && !state.paused ? dt : 0, {valleyY, cameraY: camera.position.y});
  world.applyAtmosphere(a, force);
  // Inside a tunnel the daylight fades; your eyes (and the camera) adjust to the lamps.
  const inside = r.tunnelAt(camera.position.z) && Math.abs(camera.position.x - r.x(camera.position.z)) < r.half(camera.position.z) + 2;
  tunnelDim = damp(tunnelDim, inside ? .4 : 1, 2.5, Math.max(dt, .016));
  sun.color.copy(a.lightColor); sun.intensity = a.lightIntensity; hemi.color.copy(a.hemiSky); hemi.groundColor.copy(a.hemiGround); hemi.intensity = a.hemiIntensity * tunnelDim;
  renderer.toneMappingExposure = a.exposure * lerp(1.18, 1, tunnelDim);
  const low = a.golden > .4 && a.se < .25;
  if (low !== applyAtmosphere.low || force) { applyAtmosphere.low = low; Object.assign(sun.shadow.camera, low ? {top: 40, bottom: -40, left: -55, right: 55, far: 420} : {top: 80, bottom: -65, left: -65, right: 65, far: 300}); sun.shadow.camera.updateProjectionMatrix(); }
  if (bloom) { bloom.strength = lerp(.14, .3, a.night) + .02 * a.golden; bloom.threshold = lerp(4, 1.25, a.night); bloom.radius = lerp(.3, .4, a.night); }
  railway.setLit(a.lit);
  // Sky reflections are re-captured when the light has changed enough to notice.
  envClock -= dt;
  const key = [a.hour, a.cloud, a.rain];
  if (force || !lastEnv || (envClock <= 0 && (Math.abs(key[0] - lastEnv[0]) > .2 || Math.abs(key[1] - lastEnv[1]) > .08 || Math.abs(key[2] - lastEnv[2]) > .1))) { lastEnv = key; envClock = 2; updateReflections(); }
}
function updateReflections() {
  if (!pmrem) pmrem = new T.PMREMGenerator(renderer);
  const environment = new T.Scene(), dome = new T.Mesh(new T.SphereGeometry(50, 24, 12), world.skyMaterial.clone()); environment.add(dome);
  const ground = new T.Mesh(new T.PlaneGeometry(120, 120), new T.MeshBasicMaterial({color: new T.Color(0x858969).lerp(new T.Color(0x17221b), atmo.night)})); ground.rotation.x = -Math.PI / 2; ground.position.y = -2; environment.add(ground);
  const previous = envTarget; envTarget = pmrem.fromScene(environment, .015, .1, 100); scene.environment = envTarget.texture; previous?.dispose();
  dome.geometry.dispose(); dome.material.dispose(); ground.geometry.dispose(); ground.material.dispose();
}

/* ---------- Driving ---------- */
function physics(dt) {
  if (!state.started || state.paused || panelOpen || state.inspection || state.viewing) return;
  const r = world.road, gamepad = navigator.getGamepads?.()[0];
  let throttle = keys.KeyW || keys.ArrowUp ? 1 : 0, brake = keys.KeyS || keys.ArrowDown ? 1 : 0;
  let input = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  if (gamepad) { if (Math.abs(gamepad.axes[0] || 0) > .1) input = -gamepad.axes[0]; throttle = Math.max(throttle, gamepad.buttons[7]?.value || 0); brake = Math.max(brake, gamepad.buttons[6]?.value || 0); }
  if ((input || throttle || brake) && state.auto) { if ((input && settings.autoMode !== 'speed') || (throttle && settings.autoMode === 'full') || brake) { state.auto = false; state.pit = null; updateUI(); } }
  // Steering gets gentler with speed, so the car no longer darts at the slightest touch.
  let steerTarget = steeringTarget({vehicle: settings.vehicle, speed: state.speed, input});
  const curvature = Math.abs(r.tangent(state.z + 45) - r.tangent(state.z)), plan = autoPlan(r, curvature);
  if (state.auto && settings.autoMode !== 'speed') {
    const quick = state.pass || state.laneMove > state.time, rushing = settings.rushMode === 'on';
    const lead = quick ? (rushing ? 7 : 10) + Math.abs(state.speed) * (rushing ? .38 : .6) : 13 + Math.abs(state.speed) * 1.05;
    const zt = state.z + lead, targetYaw = Math.atan2(r.x(zt) + plan.offset(zt) - state.x, lead), err = angleDifference(targetYaw, state.yaw);
    steerTarget = clamp(Math.atan2(2 * VEHICLE_DYNAMICS[settings.vehicle].wheelbase * Math.sin(err), lead), -.45, .45);
  }
  if ((state.auto && settings.autoMode !== 'steering') || state.cruise) {
    const target = state.cruise ? Math.min(state.cruiseSpeed, plan.safe) : plan.speed;
    throttle = state.speed < target ? clamp((target - state.speed) * (settings.rushMode === 'on' && state.auto ? .8 : .4), 0, 1) : 0;
    brake = state.speed > target + .6 ? clamp((state.speed - target) * .22, 0, 1) : 0;
    if (target < .05 && state.speed < 1.5) brake = Math.max(brake, .6);
  }
  state.throttle = throttle; state.brakeIn = brake; autoHonk(dt);
  const boost = keys.ShiftLeft || keys.ShiftRight || (state.auto && settings.rushMode === 'on' && !!state.pass && (state.pass.phase === 'pass' || state.pass.phase === 'commit'));
  const off = !world.onPaved(state.x, state.z); state.offroad = off;
  const mu = traction({vehicle: settings.vehicle, rain: atmo.rain, snow: settings.season === 'winter', offroad: off, grip: settings.grip, handbrake: !!keys.Space});
  const fx = Math.sin(state.yaw) * 1.4, fz = Math.cos(state.yaw) * 1.4;
  const slope = state.grounded !== false ? (world.groundHeight(state.x + fx, state.z + fz) - world.groundHeight(state.x - fx, state.z - fz)) / 2.8 : 0;
  const acceleration = longitudinal({vehicle: settings.vehicle, speed: state.speed, throttle, brake: keys.Space ? 1 : brake, mu, slope, offroad: off, speedFactor: settings.speedFactor, boost, powered: settings.fuel !== 'on' || state.fuel > 0, hold: state.auto || state.cruise, parking: !!keys.Space});
  const oldSpeed = state.speed;
  state.speed = clamp(state.speed + acceleration * dt, -9, boost ? 65 : 49);
  if (keys.Space && oldSpeed * state.speed <= 0) state.speed = 0;
  if ((state.auto || state.cruise) && brake && !throttle && oldSpeed >= 0 && state.speed < .12) state.speed = 0;
  if (!throttle && !brake && Math.abs(state.speed) < .02 && Math.abs(slope) < .012) state.speed = 0;
  state.steer = damp(state.steer, steerTarget, Math.abs(steerTarget) < Math.abs(state.steer) ? 10 : VEHICLE_DYNAMICS[settings.vehicle].response, dt);
  const motion = steeringMotion({vehicle: settings.vehicle, speed: state.speed, steer: state.steer, mu, acceleration, previousRate: state.yawRate || 0, dt});
  state.yawRate = state.grounded === false ? 0 : motion.yawRate;
  state.lateralAcceleration = state.grounded === false ? 0 : motion.lateral; state.tireSlip = motion.slip;
  Object.assign(state, advancePose({x: state.x, z: state.z, yaw: state.yaw, speed: state.speed, yawRate: state.yawRate, beta: state.grounded === false ? 0 : motion.beta, dt}));
  if (state.z < -200) { state.z = -180; reset(); toast('Back on the road'); }
  barriers(r);
  collide();
  // Heavy car: rising ground (a kerb, the road edge, an uphill) is followed, never turned into a launch; it only leaves the ground where the ground drops away.
  const ground = world.groundHeight(state.x, state.z);
  state.vy = (state.vy || 0) - 9.81 * dt; state.y += state.vy * dt;
  if (state.y <= ground + .02) { const fall = (ground - (state.lastGround ?? ground)) / dt; state.y = ground; state.vy = Math.min(0, Math.max(fall, -8)); state.grounded = true; } else state.grounded = false;
  state.lastGround = ground; state.distance += Math.abs(state.speed) * dt / 1000; state.time += dt;
  fuelAndDirt(dt, throttle, off);
}

// Guard rails, bridge parapets, tunnel walls and the motorway's central barrier keep you on your side.
function barriers(r) {
  const R = settings.vehicle === 'coach' ? 1.3 : settings.vehicle === 'bike' ? .45 : .95, cx = r.x(state.z), dx = state.x - cx, half = r.half(state.z), along = Math.atan(r.tangent(state.z));
  const scrape = (msg) => { const back = Math.cos(state.yaw - along) < 0, heading = along + (back ? Math.PI : 0); if (Math.abs(angleDifference(state.yaw, heading)) > .25) { state.speed *= .7; if (state.time - (state.lastBump || -9) > 1.5 && Math.abs(state.speed) > 3) { state.lastBump = state.time; toast(msg); } } state.yaw = heading + clamp(angleDifference(state.yaw, heading), -.05, .05); };
  for (const side of world.railSides(state.z)) { const d = dx * side; if (d > half + .5 && d < half + 1.3 && Math.abs(state.speed) > 1) { state.x = cx + side * (half + .42); scrape('Scraped the guard rail'); } }
  if (settings.location !== 'hills') return;
  if (r.bridgeAt(state.z)) { const lim = half + (settings.vehicle === 'bike' ? 1.05 : .5); if (Math.abs(dx) > lim) { state.x = cx + Math.sign(dx) * lim; scrape('Scraped the bridge railing'); } }
  if (r.tunnelAt(state.z) && Math.abs(dx) < half + 3) { const lim = half + .35 - R; if (Math.abs(dx) > lim) { state.x = cx + Math.sign(dx) * lim; scrape('Scraped the tunnel wall'); } }
  const median = r.median(state.z);
  if (median > 0) {
    const lim = .34 + R;
    if (Math.abs(dx) < lim) { state.x = cx + state.medianSide * lim; scrape('Scraped the central barrier'); }
    else state.medianSide = Math.sign(dx);
  } else state.medianSide = Math.sign(dx) || 1;
}

function fuelAndDirt(dt, throttle, off) {
  const v = Math.abs(state.speed), a = atmo;
  if (settings.fuel === 'on') {
    const before = state.fuel;
    state.fuel = Math.max(0, state.fuel - dt * (.00016 + throttle * .0006) * v / 20);
    if (before > .2 && state.fuel <= .2) { toast(nextFuelText('Fuel is getting low')); radio?.notify('fuel'); }
    if (before > 0 && state.fuel <= 0) toast('Out of fuel. Limping on to the next station…');
    // Filling up: stopped beside a pump.
    state.refuelling = v < .4 && world.pumpNear(state.x, state.z, 3.2) && state.fuel < 1;
    if (state.refuelling) { state.fuel = Math.min(1, state.fuel + dt * .14); if (state.fuel >= 1) { state.refuelling = false; toast('Tank full. Safe travels!'); radio?.notify('tank'); if (state.pit) state.pit.stage = 'out'; } }
  }
  // Dust off-road and on farm tracks, washed off by the rain.
  const farm = world.road.typeAt(state.z) === 'farm';
  state.dirt = clamp(state.dirt + dt * v * (off ? .0045 : farm ? .00025 : 0) - dt * a.rain * .014 * (1 + v * .04), 0, 1);
}
function nextFuelText(prefix) { const st = nextFuelStop(world.road, false); if (!st) return prefix; const d = (st.z - state.z) / 1000 * (settings.units === 'mi' ? .621371 : 1); return `${prefix} · Petrol station in ${d.toFixed(1)} ${settings.units === 'mi' ? 'mi' : 'km'}`; }
function nextFuelStop(r, ownSide = true) {
  let best = null;
  for (const seg of r.segs) for (const st of r.stops(seg)) if (st.kind === 'fuel' && st.z - st.len > state.z + (ownSide ? 60 : -st.len) && (!ownSide || st.side === r.side) && (!best || st.z < best.z)) best = st;
  return best;
}

/* ---------- Autodrive ---------- */
// Keeps its lane, slows for bends, towns, red lights, stop signs, zebra crossings and level crossings, follows slower
// traffic, overtakes when the oncoming lane stays clear (or moves to the fast lane on the motorway), gives cyclists room,
// and pulls in for fuel when the tank runs low.
function autoPlan(r, curvature) {
  const coach = settings.vehicle === 'coach', len = life.playerLength(), pw = life.playerWidth() / 2, rush = settings.rushMode === 'on', z = state.z, side = r.side;
  const lanes = r.laneCount(z), home = r.homeLane(z);
  if (state.laneIndex === undefined || state.laneIndex > lanes - 1) state.laneIndex = home;
  const limit = r.limit(z) * (rush ? 1.3 : 1) * (coach ? .85 : 1) * settings.speedFactor;
  let speed = clamp(limit / (1 + curvature * (rush ? 2 : 3)), rush ? 14 : 11, Math.max(limit, 11));
  const townF = Math.max(r.townFactor(z), r.townFactor(z + 60));
  if (townF > .2) speed = Math.min(speed, rush ? 19 : 15);
  let offset = (q) => ownLaneX(q, state.laneIndex);
  if (!state.auto) { state.pass = null; state.pit = null; return {speed, offset, safe: safeSpeed(r, offset, 99)}; }
  const pit = pitPlan(r, speed); if (pit) return pit;
  const ownX = (q) => ownLaneX(q, 0), oppX = (q) => r.laneX(q, -1, 0);
  let lead = life.leadAhead(state, true);
  // Cyclists and a bus at its stop: ease out to give them room, or follow until there is a gap to pass.
  let nudge = 0, kerbLead = null; const kerb = life.kerbside(state, 80);
  for (const k of kerb) { const need = Math.abs(ownX(k.car.z)) + pw - (k.inner - (k.car.kind === 'bike' ? 1.2 : .8)); if (need > 0) { nudge = Math.max(nudge, need); if (!kerbLead || k.ahead < kerbLead.ahead) kerbLead = k; } }
  // A wide berth over the centre line is fine when nothing is coming for the few seconds it takes to get by.
  const NP = state.nudgePass;
  // A bus pulling away from its stop is back in the lane: follow it again instead of easing past.
  if (NP && (!NP.car.g.visible || z - NP.car.z > (NP.car.length + len) / 2 + 3 || NP.car.z - z > 90 || !kerb.some((k) => k.car === NP.car))) state.nudgePass = null;
  if (nudge > .9 && kerbLead && lanes === 1 && !state.pass) {
    const passV = Math.min(speed, kerbLead.speed + 9), tPass = (kerbLead.ahead + kerbLead.car.length + len + 4) / Math.max(3, passV - kerbLead.speed);
    const calm = r.townFactor(z) < .5 || kerbLead.car.kind === 'bus';
    if (state.nudgePass || (nudge <= 2.3 && calm && life.oncomingTime(state, passV) > tPass + 1.6)) {
      if (!state.nudgePass) { state.nudgePass = {car: kerbLead.car}; setIndicator(-side, 'auto', 1.5); }
      const base = offset, shift = Math.min(nudge, 2.3); offset = (q) => base(q) - side * shift; speed = Math.min(speed, passV + 2);
    } else { const gap = kerbLead.ahead - (kerbLead.car.length + len) / 2; if (!lead || gap < lead.gap) lead = {gap, speed: kerbLead.speed, car: kerbLead.car}; }
  }
  else if (nudge > 0 && !state.pass) { const base = offset; offset = (q) => base(q) - side * nudge; }
  if (lead && state.nudgePass && lead.car === state.nudgePass.car) lead = null;
  const committed = state.pass && (state.pass.phase === 'pass' || state.pass.phase === 'commit');
  if (lanes > 1) {
    // Motorway: overtake in the fast lane, then move back over.
    state.pass = null;
    const free = (lane, back, front) => { for (const c of life.traffic) { if (!c.g.visible || c.dir < 0) continue; const d = c.z - z, x = r.x(c.z) + r.laneX(c.z, 1, lane); if (d > -back && d < front && Math.abs(c.x - x) < 2.4) return false; } return true; };
    const t = state.time;
    if (state.laneIndex > 0 && lead && lead.gap < (rush ? 90 : 60) && lead.speed < speed - (rush ? 1 : 3) && t > (state.laneChangeAt || 0) + 3 && free(state.laneIndex - 1, rush ? 10 : 18, rush ? 35 : 55)) { state.laneIndex--; state.laneChangeAt = t; state.laneMove = t + 2.5; setIndicator(-side, 'auto', 2.6); }
    else if (state.laneIndex < home && t > (state.laneChangeAt || 0) + 5 && free(state.laneIndex + 1, 25, rush ? 60 : 110)) { state.laneIndex++; state.laneChangeAt = t; state.laneMove = t + 2.5; setIndicator(side, 'auto', 2.6); }
    offset = (q) => ownLaneX(q, state.laneIndex);
    lead = life.leadAhead(state, true);
    if (lead && lead.gap < 90) speed = Math.min(speed, Math.max(0, lead.speed + (lead.gap - (rush ? 8 : 14)) * .3));
  } else {
    const out = settings.autoLane === 'center' ? 0 : 1;
    if (lead && lead.car.yielding && Math.abs(lead.car.lat) > 1.1) { const base = offset; offset = (q) => base(q) - side * 1.5; }
    const P = state.pass;
    // An overtake has four phases: pass (out and alongside), commit (nearly past: full power, no turning back),
    // back (too early to make it: brake and tuck in behind) and return (clear of the car: straight back into lane).
    if (P) {
      const c = P.car, rear = z - c.z - (c.length + len) / 2, tOn = life.oncomingTime(state, Math.max(state.speed, 10)), vRel = Math.max(1, state.speed - c.speed), inLane = Math.abs(state.x - r.x(z) - ownX(z)) < .4;
      const clearT = Math.max(0, (rush ? 2.5 : 6) - rear) / vRel + .9;
      if (!c.g.visible) state.pass = null;
      else if (P.phase === 'pass') { if (rear > (tOn < 3 ? .8 : rush ? 2.5 : 6)) { P.phase = 'return'; setIndicator(side, 'auto', 2); } else if (tOn < clearT + .6) { if (rear > -len * .9) P.phase = 'commit'; else { P.phase = 'back'; toast('Oncoming traffic, dropping back'); } } }
      else if (P.phase === 'commit') { if (rear > .8) { P.phase = 'return'; setIndicator(side, 'auto', 2); } }
      else if (P.phase === 'back') { if (inLane && z < c.z) { state.pass = null; state.passCooldown = state.time + (rush ? 2.5 : 5); } }
      else if (P.phase === 'return' && inLane) state.pass = null;
      if (state.pass) {
        const ph = P.phase, behind = z < c.z - (c.length + len) / 2 - 1;
        if (ph === 'pass' || ph === 'commit') { offset = oppX; speed = Math.max(speed, ph === 'commit' ? 48 * settings.speedFactor : P.speed); }
        else if (ph === 'back') { offset = behind ? ownX : oppX; speed = Math.min(speed, Math.max(0, c.speed - (behind ? 1 : 3))); }
        else speed = Math.max(speed, Math.min(state.speed, P.speed));
      }
    }
    // No overtaking into a junction, a level crossing, a tunnel or a town.
    let hazard = townF > .1;
    for (let d = 0; d < 320 && !hazard; d += 40) { const q = z + d; if (r.crossingAt(q, 30) || r.tunnelAt(q) || r.junctions.some((j) => q > j.z - 40 && q < j.z + ZONE * .6) || r.townFactor(q) > 0) hazard = true; }
    if (!state.pass && state.time > (state.passCooldown || 0) && lead && settings.autoMode === 'full' && out && !hazard && !lead.car.yielding && lead.gap < (rush ? 110 : 40) && lead.speed < speed - (rush ? .3 : 2.5)) {
      let bend = 0; for (let d = 0; d < 260; d += 20) bend = Math.max(bend, Math.abs(r.tangent(z + d + 20) - r.tangent(z + d)));
      // Rush mode takes any gap that just fits and passes hard; normal mode waits for a comfortable one.
      const passSpeed = clamp(Math.max(speed + (rush ? 8 : 0), lead.speed + (rush ? 20 : 8)), 18, (rush ? 44 : 30) * settings.speedFactor), dist = lead.gap + lead.car.length + len + (rush ? 4 : 14);
      let t = 0, v = state.speed, x = 0; while (x < dist && t < 25) { v = Math.min(passSpeed, v + (rush ? 7.5 : 3.2) * .1); x += Math.max(.5, v - lead.speed) * .1; t += .1; }
      const need = t + (rush ? 1 : 2.2), avg = lead.speed + dist / Math.max(t, .1);
      if (bend < (rush ? .32 : .12) && life.oncomingTime(state, avg) > need + (rush ? .8 : 3)) { state.pass = {car: lead.car, phase: 'pass', speed: passSpeed}; offset = oppX; speed = passSpeed; setIndicator(-side, 'auto', 2); toast(lead.car.kind === 'bike' ? 'Passing the cyclist' : rush ? 'Rush overtake' : 'Overtaking'); }
    }
    if (!state.pass && lead && !(lead.car.yielding && Math.abs(lead.car.lat) > 1.1) && lead.gap < 80) speed = Math.min(speed, Math.max(0, lead.speed + (lead.gap - (rush ? 6 : 12)) * (rush ? .45 : .3)));
  }
  speed = Math.min(speed, stopLines(r, len));
  let safe = safeSpeed(r, offset, speed, committed);
  // Caught out of lane with something coming: if our own lane is clear, creep back into it rather than freeze.
  if (safe < 2 && speed > 2 && Math.abs(state.x - r.x(z) - offset(z)) > .6 && safeSpeed(r, offset, speed, committed, false) > 3) safe = 2.2;
  return {speed: Math.min(speed, safe), offset, safe};
}

// Red lights, stop signs, zebra crossings in use and closing level crossings ahead: brake to stop at the line.
function stopLines(r, len) {
  let cap = Infinity; const front = state.z + len / 2;
  for (const st of [town.stopFor({id: 'player', z: state.z, dir: 1, speed: state.speed, length: len}, state), railway.stopLine(front, 1, 170)]) {
    if (!st) continue;
    const room = st.z - front - .6; if (room < -1.2) continue;
    cap = Math.min(cap, room <= 0 ? 0 : Math.sqrt(2 * 3.2 * room) * .92);
  }
  return cap;
}

// Low on fuel: indicate, pull into the next petrol station on your side, stop at a pump, fill up and rejoin the road.
function pitPlan(r, cruise) {
  if (settings.fuel !== 'on') { state.pit = null; return null; }
  if (!state.pit && state.fuel < .22) { const st = nextFuelStop(r); if (st && st.z - state.z < 2500 && r.typeAt(st.z) !== 'highway') state.pit = {st, stage: 'in'}; }
  const P = state.pit; if (!P) return null;
  const st = P.st, z = state.z;
  if (z > st.z + st.len + 5) { state.pit = null; return null; }
  const pump = world.pumpFor(st); if (!pump) return null;
  const own = (q) => ownLaneX(q, state.laneIndex), pumpOff = pump.x - r.x(pump.z);
  const zA = st.z - st.len * .9, zB = pump.z - 7, zC = pump.z + 9, zD = st.z + st.len * .9;
  const offset = (q) => q < zA ? own(q) : q < zB ? lerp(own(q), pumpOff, smooth(zA, zB, q)) : q < zC ? pumpOff : lerp(pumpOff, own(q), smooth(zC, zD, q));
  let speed = cruise;
  if (P.stage === 'in') {
    const room = pump.z - z; speed = Math.min(cruise, room < 140 ? Math.max(3, Math.sqrt(Math.max(0, 2 * 2 * (room - .3)))) : cruise, room < 60 ? 9 : 99);
    if (room < 2) speed = Math.min(speed, Math.max(0, room));
    if (room < 250) setIndicator(r.side, 'auto', .5);
    if (room < .8 && Math.abs(state.speed) < .4) P.stage = 'fuel';
  } else if (P.stage === 'fuel') { speed = 0; if (!state.refuelling && state.fuel >= .999) P.stage = 'out'; }
  else { speed = Math.min(cruise, 11); if (z < zD - 20) setIndicator(-r.side, 'auto', .5); }
  const safe = P.stage === 'fuel' ? 0 : safeSpeed(r, offset, speed);
  return {speed: Math.min(speed, safe), offset, safe};
}

// Highest speed that still stops short of anything solid in the path the car is heading for.
function safeSpeed(r, offset, limit, ignoreOncoming = false, fromHere = true) {
  const half = settings.vehicle === 'coach' ? 1.3 : settings.vehicle === 'bike' ? .45 : .95, len = life.playerLength() / 2; let safe = limit;
  const dx0 = fromHere ? state.x - r.x(state.z) - offset(state.z) : 0;
  for (const o of [...life.obstacles(state.z, 90), ...railway.colliders(state.x, state.z + 45, 60).map((k) => ({x: k.x, z: k.z, r: k.train ? 2 : Math.max(k.hx, .5), vz: 0}))]) {
    const dz = o.z - state.z; if (dz < -1 || (ignoreOncoming && o.vz < -1)) continue;
    const pathX = r.x(o.z) + offset(o.z) + dx0 * Math.exp(-Math.max(0, dz) / 16), gap = Math.abs(o.x - pathX) - o.r - half;
    // Squeezing past something coming the other way on a narrow road: crawl by rather than brush it.
    if (o.vz < -1 && gap < 1.2 && dz < 9 && safe > 2.5) { safe = 2.5; state.safeWhy = {dz: +dz.toFixed(1), squeeze: +gap.toFixed(2)}; }
    if (gap > .35) continue;
    const room = dz - o.r - len - 2.5, v = Math.sqrt(Math.max(0, 2 * 6 * room)) + Math.max(0, o.vz);
    if (v < safe) { safe = v; state.safeWhy = {dz: +dz.toFixed(1), dx: +(o.x - pathX).toFixed(2), r: o.r, vz: o.vz}; }
  }
  return safe;
}

// Autodrive waiting behind animals on the road gives them a short toot to move them along.
function autoHonk(dt) {
  const r = world.road;
  const blocked = state.auto && Math.abs(state.speed) < 1.5 && (life.roadAnimals || []).some((a) => a.z > state.z && a.z - state.z < 40 && Math.abs(a.x - r.x(a.z)) < r.half(a.z) + .5);
  blockedTime = blocked ? blockedTime + dt : 0;
  if (blockedTime > 2.5) { blockedTime = -3; setHorn(true); setTimeout(() => { if (!keys.KeyG) setHorn(false); }, 450); }
}

// Solid world: trees, rocks, buildings, traffic, trains, barriers, people and animals push the car back instead of passing through it.
function collide() {
  const bike = settings.vehicle === 'bike', coach = settings.vehicle === 'coach', R = coach ? 1.35 : bike ? .45 : .95, offsets = coach ? [-4.8, -2.4, 0, 2.4, 4.8] : bike ? [-.55, .55] : [-1.25, 0, 1.25];
  const fx = Math.sin(state.yaw), fz = Math.cos(state.yaw);
  const nearby = [...world.collidersNear(state.x, state.z, 16), ...life.colliders(state.x, state.z, 14), ...railway.colliders(state.x, state.z, 16), ...town.colliders(state.x, state.z, 12)];
  let impact = 0, what = null;
  for (const o of offsets) {
    const cx = state.x + fx * o, cz = state.z + fz * o;
    for (const k of nearby) {
      const dx = cx - k.x, dz = cz - k.z;
      if (k.hx) {
        const lx = dx * k.c - dz * k.s, lz = dx * k.s + dz * k.c, ex = k.hx + R, ez = k.hz + R;
        if (Math.abs(lx) < ex && Math.abs(lz) < ez) {
          const px = ex - Math.abs(lx), pz = ez - Math.abs(lz); let nlx = 0, nlz = 0, push;
          if (px < pz) { nlx = Math.sign(lx) || 1; push = px; } else { nlz = Math.sign(lz) || 1; push = pz; }
          const nx = nlx * k.c + nlz * k.s, nz = -nlx * k.s + nlz * k.c;
          state.x += nx * push; state.z += nz * push;
          const hit = -(fx * nx + fz * nz) * Math.sign(state.speed || 1); if (hit > impact) { impact = hit; what = k; }
        }
        continue;
      }
      const d = Math.hypot(dx, dz), min = R + k.r;
      if (d < min && d > 1e-4) { const nx = dx / d, nz = dz / d, push = min - d; state.x += nx * push; state.z += nz * push; const hit = -(fx * nx + fz * nz) * Math.sign(state.speed || 1); if (hit > impact) { impact = hit; what = k; } }
    }
  }
  if (impact > .15) {
    const hit = Math.abs(state.speed); state.speed = impact > .6 ? 0 : state.speed * .55; state.vy = Math.min(state.vy || 0, 0);
    if (hit > 3 && state.time - (state.lastBump || -9) > 1.5) { state.lastBump = state.time; state.lastHit = what; toast(what?.train ? 'The train! Wait for the barriers next time.' : what?.barrier ? 'Wait for the barrier to lift' : what?.person ? 'Watch out for pedestrians!' : hit > 12 ? 'Crash! Take it easy.' : 'Bump!'); }
  }
}

/* ---------- Indicators, junctions and road-side stops ---------- */
// +1 is left, -1 is right. Manual indicators also choose your way at the next junction.
function setIndicator(side, source = 'manual', seconds = 12) {
  if (source === 'auto' && state.indicatorSource === 'manual' && state.indicator) return;
  state.indicator = side; state.indicatorSource = source; state.indicatorUntil = state.time + seconds; updateIndicatorHUD();
}
function toggleIndicator(side) {
  const on = state.indicator === side && state.indicatorSource === 'manual' ? 0 : side;
  setIndicator(on, 'manual', 14);
  const r = world.road, j = r.junctionAhead(state.z, 900);
  if (j && j.z - state.z > 45) {
    const b = r.optionInfo(j, 1), toward = b.side > 0 ? 1 : -1;
    chooseJunction(j, on === toward ? 1 : 0, true);
  }
}
function chooseJunction(j, i, announce = true) {
  const r = world.road, was = j.chosen;
  if (r.choose(j, i)) { world.onRouteChange(j.z + ZONE - 80, state.z); life.onRouteChange(j.z); }
  if (announce && (was !== i || i === 1)) { const o = r.optionInfo(j, i); radio?.notify('junction', o); toast(`${o.dir === 'ahead' ? 'Straight on' : o.dir === 'left' ? 'Turning left' : 'Turning right'} · ${o.label}${o.name ? ' to ' + o.name : ''}`); }
  j.picked = true; updateJunctionCard(j, true);
}

function routeWatch() {
  if (settings.location !== 'hills') return;
  const r = world.road;
  const changed = r.commit(state.x, state.z);
  if (changed) { world.onRouteChange(changed.z + ZONE - 80, state.z); life.onRouteChange(changed.z); }
  const j = r.junctionAhead(state.z, 950);
  if (j && state.started) {
    const ahead = j.z - state.z, o = j.options[j.chosen];
    // Autodrive picks a way now and then (sometimes the side road), and signals for it.
    if (state.auto && settings.autoMode !== 'speed' && !j.picked && ahead < 800) { chooseJunction(j, settings.junctions === 'surprise' && Math.random() < .42 ? 1 : 0, true); }
    if (state.auto && ahead < 260 && ahead > -10 && o.side) setIndicator(o.side > 0 ? 1 : -1, 'auto', .4);
  }
  // Indicators switch off once the turn is done.
  if (state.indicator && state.time > state.indicatorUntil) { state.indicator = 0; state.indicatorSource = null; updateIndicatorHUD(); }
  if (changed === null && state.indicator && state.indicatorSource === 'manual' && r.junctions.some((q) => q.committed && state.z - q.z < 40 && state.z - q.z > 25)) { state.indicator = 0; updateIndicatorHUD(); }
  updateJunctionCard(j);
  const type = r.typeAt(state.z);
  if (type !== lastType) { if (lastType && state.started) { toast(`${TYPES[type].label} · ${r.segAt(state.z).name}`); radio?.notify('road', {type, label: TYPES[type].label, name: r.segAt(state.z).name}); } lastType = type; }
  // Every ten kilometres (or miles), the radio may notice.
  const mark = Math.floor(state.distance / (settings.units === 'mi' ? 16.09 : 10)); if (state.started && mark > (state.distanceMark ?? mark)) radio?.notify('miles'); state.distanceMark = mark;
  const t = r.townAt(state.z), inside = t && state.z > t.start && state.z < t.end ? t : null;
  if (inside && inside.center !== lastTown?.center && state.started) { toast('Welcome to ' + inside.name); radio?.notify('town', {name: inside.name}); }
  lastTown = inside;
  town.watchPlayer(state, (msg) => { if (state.time - (state.lastNote || -9) > 4) { state.lastNote = state.time; toast(msg); } });
}

const ARROWS = {ahead: '<svg viewBox="0 0 24 24"><path d="M12 20V5M6 10l6-6 6 6"/></svg>', left: '<svg viewBox="0 0 24 24"><path d="M15 20v-6c0-4-3-6-8-6M10 4L6 8l4 4"/></svg>', right: '<svg viewBox="0 0 24 24"><path d="M9 20v-6c0-4 3-6 8-6M14 4l4 4-4 4"/></svg>'};
function updateJunctionCard(j, force = false) {
  const card = $('junction'); if (!card) return;
  const r = world.road, show = j && state.started && !state.photo && j.z - state.z < 900 && j.z - state.z > -15;
  card.hidden = !show; if (!show) { cardJunction = null; return; }
  const d = Math.max(0, j.z - state.z), dist = settings.units === 'mi' ? `${Math.max(.1, d / 1609).toFixed(1)} MI` : d > 950 ? `${(d / 1000).toFixed(1)} KM` : `${Math.round(d / 50) * 50} M`;
  $('junction-dist').textContent = d < 30 ? 'JUNCTION' : `JUNCTION IN ${dist}`;
  if (cardJunction !== j || force || card.dataset.chosen !== String(j.chosen)) {
    cardJunction = j; card.dataset.chosen = String(j.chosen);
    const opts = [0, 1].map((i) => ({i, ...r.optionInfo(j, i)})).sort((a, b) => ({left: 0, ahead: 1, right: 2}[a.dir] - {left: 0, ahead: 1, right: 2}[b.dir]));
    $('junction-options').innerHTML = opts.map((o) => `<button data-option="${o.i}" class="${j.chosen === o.i ? 'chosen' : ''}" aria-pressed="${j.chosen === o.i}">${ARROWS[o.dir]}<span><b>${o.label}</b><small>${o.name}</small></span></button>`).join('');
    for (const b of $('junction-options').querySelectorAll('button')) b.onclick = (e) => { e.stopPropagation(); const i = Number(b.dataset.option); if (j.z - state.z > 30) { chooseJunction(j, i); const o = r.optionInfo(j, i); if (!state.auto) setIndicator(o.side ? (o.side > 0 ? 1 : -1) : 0, 'manual', 14); } };
  }
}

function updateIndicatorHUD() { $('indicators')?.classList.toggle('on', !!state.indicator); $('ind-left')?.classList.toggle('on', state.indicator === 1); $('ind-right')?.classList.toggle('on', state.indicator === -1); }

// Pull into a petrol station, café or viewpoint and stop: a card offers something to do there.
function stopWatch(dt) {
  const r = world.road, card = $('stop-card'); if (!card || settings.location !== 'hills') return;
  const near = r.stopsNear(state.z, 80).find((st) => Math.abs(state.z - st.z) < st.len && world.onStopPad(st, state.x, state.z));
  stopStill = near && Math.abs(state.speed) < .5 && !state.viewing ? stopStill + dt : 0;
  if (near && stopStill > 1 && stopShown !== near) {
    stopShown = near;
    const title = {fuel: 'Petrol station', cafe: 'Roadside café', view: 'Scenic viewpoint'}[near.kind];
    const fuelOn = settings.fuel === 'on';
    const text = near.kind === 'fuel' ? (fuelOn ? (world.pumpNear(state.x, state.z, 3.2) ? 'Filling up…' : 'Pull up beside a pump to fill the tank.') : 'The fuel gauge is off. Turn it on to keep an eye on your tank.') : near.kind === 'cafe' ? 'Stretch your legs and grab a coffee.' : `${near.seg.name}. Take a moment to enjoy it.`;
    const action = near.kind === 'fuel' ? (fuelOn ? '' : '<button data-stop="fuel-on">Turn on fuel gauge</button>') : near.kind === 'cafe' ? '<button data-stop="coffee">Coffee break <small>+20 min</small></button>' : '<button data-stop="view">Take in the view</button>';
    card.innerHTML = `<small>${title.toUpperCase()}</small><h3>${near.kind === 'view' ? near.seg.name : title}</h3><p>${text}</p><div>${action}<button data-stop="close">Drive on</button></div>`;
    card.hidden = false;
    for (const b of card.querySelectorAll('button')) b.onclick = (e) => { e.stopPropagation(); stopAction(b.dataset.stop, near); };
  }
  if (stopShown && (!near || Math.abs(state.speed) > 2)) { card.hidden = true; stopShown = null; }
}
function stopAction(kind, st) {
  const card = $('stop-card');
  if (kind === 'fuel-on') { changeSetting('fuel', 'on'); card.hidden = true; toast('Fuel gauge on. Pull up to a pump to fill up.'); }
  if (kind === 'coffee') { radio?.notify('coffee');
    card.hidden = true; const fade = $('fade'); fade.classList.add('on');
    setTimeout(() => { atmo.hour = (atmo.hour + 1 / 3) % 24; applyAtmosphere(0, true); toast('Twenty minutes later. Refreshed and ready to go.'); fade.classList.remove('on'); }, 1400);
  }
  if (kind === 'view') { card.hidden = true; state.viewing = {st, t: 0}; toast('Press any key to drive on'); radio?.notify('view'); }
  if (kind === 'close') card.hidden = true;
}

/* ---------- Car and camera ---------- */
function updateCar(dt) {
  vehicle.flashing = !!state.horning; state.flashing = vehicle.flashing;
  vehicle.group.position.set(state.x, state.y + .05, state.z); vehicle.group.rotation.order = 'YXZ'; vehicle.group.rotation.y = state.yaw;
  const fx = Math.sin(state.yaw), fz = Math.cos(state.yaw), rx = Math.cos(state.yaw), rz = -Math.sin(state.yaw), L = settings.vehicle === 'coach' ? 3 : settings.vehicle === 'bike' ? .7 : 1.3, Wd = settings.vehicle === 'bike' ? .15 : .8;
  const hf = world.groundHeight(state.x + fx * L, state.z + fz * L), hb = world.groundHeight(state.x - fx * L, state.z - fz * L), hr = world.groundHeight(state.x + rx * Wd, state.z + rz * Wd), hl = world.groundHeight(state.x - rx * Wd, state.z - rz * Wd);
  const air = state.grounded === false ? 4 : 8;
  vehicle.group.rotation.x = damp(vehicle.group.rotation.x, -Math.atan2(hf - hb, L * 2), air, dt);
  const lateral = state.lateralAcceleration || 0;
  const lean = settings.vehicle === 'bike' ? motorcycleLean(lateral) : clamp(lateral * (settings.vehicle === 'coach' ? .009 : .004), -.08, .08);
  vehicle.group.rotation.z = damp(vehicle.group.rotation.z, (settings.vehicle === 'bike' ? 0 : Math.atan2(hr - hl, Wd * 2)) + lean, air, dt);
  vehicle.group.updateMatrixWorld(); vehicle.setDirt(state.dirt);
  const inTunnel = !!world.road.tunnelAt(state.z);
  vehicle.update(dt, (state.paused || panelOpen || state.inspection || !state.started) ? 0 : state.speed, state.steer, atmo.lit > .5 || state.headlights || inTunnel, keys.KeyS || keys.Space || (state.auto && state.brakeIn > .2), settings.camera === 2 && !state.inspection);
}

function positionCamera(dt, instant = false) {
  driveOrbit.update(dt);
  if (state.inspection) {
    if (!orbitPointer) orbitYaw += dt * .075;
    const a = state.yaw + orbitYaw, radius = orbitDistance * (settings.vehicle === 'coach' ? 1.5 : 1) * Math.max(1, .95 / camera.aspect);
    camera.position.set(state.x + Math.sin(a) * Math.cos(orbitPitch) * radius, state.y + 1 + Math.sin(orbitPitch) * radius, state.z + Math.cos(a) * Math.cos(orbitPitch) * radius);
    camera.lookAt(state.x, state.y + .85, state.z); camera.fov = 45; camera.updateProjectionMatrix(); return;
  }
  const r = world.road;
  // At a viewpoint: stand by the railing and slowly look across the view.
  if (state.viewing) {
    const v = state.viewing; v.t += dt;
    const st = v.st, yaw = Math.atan(r.tangent(st.z)), outX = Math.cos(yaw) * st.side, outZ = -Math.sin(yaw) * st.side, pan = Math.sin(v.t * .12) * .6;
    const ex = r.x(st.z) + st.side * (r.half(st.z) + st.depth - 1.5), ez = st.z, ey = r.y(st.z) + 1.7;
    cameraPos.set(ex, ey, ez); camera.position.lerp(cameraPos, instant ? 1 : 1 - Math.exp(-2 * dt));
    const lx = outX * Math.cos(pan) - outZ * Math.sin(pan), lz = outX * Math.sin(pan) + outZ * Math.cos(pan);
    lookTarget.set(ex + lx * 100, ey - 12, ez + lz * 100); camera.lookAt(lookTarget);
    camera.fov = damp(camera.fov, 55, 2, dt); camera.updateProjectionMatrix();
    if (v.t > 40) state.viewing = null;
    placeSun(Math.sin(state.yaw), Math.cos(state.yaw)); return;
  }
  const yaw = state.yaw, forward = new T.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), right = new T.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  let back = 7.6, up = 2.25, ahead = 14;
  const coach = settings.vehicle === 'coach', bike = settings.vehicle === 'bike';
  if(coach){back=14;up=4.8;}
  if (settings.camera === 1) { back = coach ? 21 : 14; up = coach ? 7 : 5.5; ahead = 20; }
  if (settings.camera === 2) { back = -vehicle.seatZ; up = vehicle.seatY; ahead = 45; }
  if (settings.camera === 3) { back = coach ? -5.85 : bike ? -.98 : -1.02; up = coach ? 1.8 : bike ? 1.1 : 1.06; ahead = 40; }
  if (settings.camera === 4) { back = coach ? -6.05 : bike ? -1 : -2.25; up = bike ? .5 : .55; ahead = 40; }
  cameraPos.set(state.x - forward.x * back, state.y + up, state.z - forward.z * back);
  if (settings.camera < 2) {
    const height = up - .95; let radius = Math.hypot(back, height);
    if (driveOrbit.focus > .001) { const portraitScale = 1 + (Math.max(1, .8 / camera.aspect) - 1) * driveOrbit.focus; chaseOrbitRadius = damp(chaseOrbitRadius || radius, radius * portraitScale, 6, dt); radius = chaseOrbitRadius; }
    const elevation = clamp(Math.atan2(height, back) + driveOrbit.pitch, .07, 1.3), angle = yaw + Math.PI + driveOrbit.yaw;
    cameraPos.set(state.x + Math.sin(angle) * Math.cos(elevation) * radius, state.y + .95 + Math.sin(elevation) * radius, state.z + Math.cos(angle) * Math.cos(elevation) * radius);
    // In a tunnel the camera stays under the roof and between the walls; elsewhere it stays above the ground.
    const tz = cameraPos.z, inTube = settings.location === 'hills' && r.tunnelAt(tz) && Math.abs(cameraPos.x - r.x(tz)) < r.half(tz) + 3;
    if (inTube) { const cx = r.x(tz), lim = r.half(tz) - .3; cameraPos.x = cx + clamp(cameraPos.x - cx, -lim, lim); cameraPos.y = clamp(cameraPos.y, r.y(tz) + .6, r.y(tz) + 5.4); }
    else cameraPos.y = Math.max(cameraPos.y, world.surfaceHeight(cameraPos.x, cameraPos.z, settings.location !== 'hills') + .6);
  }
  if (settings.camera === 2) cameraPos.addScaledVector(right, bike ? 0 : (vehicle.seatX ?? .4));
  // Views from inside or on the car are fixed to it; the chase cameras follow smoothly.
  if (instant || settings.camera >= 2 || driveOrbit.focus > .001) camera.position.copy(cameraPos); else camera.position.lerp(cameraPos, 1 - Math.exp(-5 * dt));
  // Retract the camera boom before it passes through a following vehicle.
  if (settings.camera < 2) {
    const target={x:state.x,y:state.y+1.35,z:state.z};
    const boxes=life.traffic.filter(c=>c.g.visible&&Math.abs(c.z-state.z)<40).map(c=>({x:c.g.position.x,y:c.g.position.y,z:c.g.position.z,yaw:c.g.rotation.y,width:c.width,length:c.length,height:c.kind==='bus'?3.9:c.kind==='truck'?4.4:2.2}));
    const fraction=boomFraction(target,camera.position,boxes);
    if(fraction<1)camera.position.set(target.x+(camera.position.x-target.x)*fraction,target.y+(camera.position.y-target.y)*fraction,target.z+(camera.position.z-target.z)*fraction);
  }
  lookTarget.set(state.x + forward.x * ahead, state.y + (settings.camera >= 2 ? up : 1.35), state.z + forward.z * ahead);
  if (settings.camera >= 2) lookTarget.y = world.road.y(state.z + ahead) + up * .8; else lookTarget.lerp(tmp.set(state.x, state.y + .95, state.z), driveOrbit.focus);
  camera.lookAt(lookTarget);
  camera.fov = damp(camera.fov, settings.fov + Math.min(Math.abs(state.speed) * .15, 9), 4, dt); camera.updateProjectionMatrix();
  placeSun(forward.x, forward.z);
}
function placeSun(fx, fz) { const ld = world.lightDir; sun.position.set(state.x + ld.x * 180 + fx * 20, state.y + ld.y * 180, state.z + ld.z * 180 + fz * 20); sun.target.position.set(state.x + fx * 20, state.y, state.z + fz * 20); }

/* ---------- Frame loop ---------- */
// Physics runs at a fixed 120 Hz; the car and camera are drawn between the last two steps so motion stays even at any frame rate.
const SMOOTHED = ['x', 'y', 'z', 'yaw', 'steer', 'speed'], previousState = {x: 0, y: 0, z: 0, yaw: 0, steer: 0, speed: 0};
function frame(now) {
  frameId = requestAnimationFrame(frame);
  const elapsed = (now - (last || now)) / 1000, dt = Math.min(elapsed, .05); last = now; accumulator += dt;
  while (accumulator >= 1 / 120) { for (const k of SMOOTHED) previousState[k] = state[k]; physics(1 / 120); accumulator -= 1 / 120; }
  const live = {}; for (const k of SMOOTHED) live[k] = state[k];
  if (Math.hypot(live.x - previousState.x, live.z - previousState.z) < 5) { const a = accumulator * 120; for (const k of SMOOTHED) state[k] = k === 'yaw' ? previousState.yaw + angleDifference(live.yaw, previousState.yaw) * a : previousState[k] + (live[k] - previousState[k]) * a; }
  applyAtmosphere(dt);
  updateCar(dt); positionCamera(dt);
  Object.assign(state, live);
  effects.inTunnel = !!world.road.tunnelAt(camera.position.z);
  effects.update(dt); town.update(dt, camera); life.update(dt); railway.update(dt, camera, () => effects.getVolume());
  world.update(state.z, camera); world.scenery.update(dt, camera, state); world.roadside.update(dt, camera, railway, state);
  world.landmarks.update(dt, state);
  detailedModels ||= new DetailedModels(scene,settings);
  detailedModels.update(dt,state,life.traffic,town.people,world,life.animals,town);
  routeWatch(); stopWatch(dt);
  renderer.info.autoReset = false; renderer.info.reset();
  updateLiveReflection();
  if (composer) composer.render(dt); else renderer.render(scene, camera);
  const cockpit = settings.camera === 2 && !state.inspection && !state.viewing;
  if (settings.mirror === 'on' && settings.quality !== 'low' && (cockpit || settings.camera === 3) && !state.viewing && !state.inspection && state.started) mirror.render(state, vehicle, ['high','ultra'].includes(settings.quality) ? 1 : 2, cockpit ? camera : null);
  windscreen.update(dt, {show: cockpit && settings.vehicle !== 'bike' && settings.location === 'hills' && !effects.inTunnel, rain: effects.raining ? atmo.rain : 0, speed: state.speed, wipers: effects.raining && atmo.rain > .03 && !effects.inTunnel});
  watchPerformance(dt); updateAudio(dt);
  hudClock += dt; fpsFrames++; fpsTime += elapsed;
  if (fpsTime > .75) { state.fps = Math.round(fpsFrames / fpsTime); fpsFrames = 0; fpsTime = 0; }
  if (hudClock > .12) { hudClock = 0; updateHUD(); }
}

/* ---------- HUD ---------- */
const WEATHER_ICONS = {sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>', moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>', cloud: '<svg viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 18z"/></svg>', rain: '<svg viewBox="0 0 24 24"><path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>', mist: '<svg viewBox="0 0 24 24"><path d="M3 9h18M5 13h14M3 17h18"/></svg>'};
function updateHUD() {
  const factor = settings.units === 'mi' ? .621371 : 1, speed = Math.abs(state.speed) * 3.6 * factor;
  $('speed').textContent = Math.round(speed); $('gear').textContent = state.gearLabel || (state.speed < -.2 ? 'R' : 'D');
  $('distance').textContent = (state.distance * factor).toFixed(1); $('speed-fill').style.width = Math.min(speed / 180 * 100, 100) + '%';
  const m = Math.floor(state.time / 60), s = Math.floor(state.time % 60); $('journey-time').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ON THE ROAD`;
  vehicle.updateDashboard(Math.abs(state.speed) * 3.6, state.distance, state.auto);
  let path = 'M40 100'; for (let i = 1; i <= 16; i++) { const z = state.z + i * 7, off = (world.road.x(z) - world.road.x(state.z) - world.road.tangent(state.z) * i * 7) * .7; path += ` L${clamp(40 - off, 8, 72).toFixed(1)} ${100 - i * 5.2}`; }
  $('road-worm').setAttribute('d', path);
  // Clock and sky.
  const a = atmo, icon = a.rain > .15 ? 'rain' : a.mistAmount > .35 ? 'mist' : a.cloud > .7 ? 'cloud' : a.night > .5 ? 'moon' : 'sun';
  $('clock-time').textContent = a.clock; if ($('clock-icon').dataset.icon !== icon) { $('clock-icon').dataset.icon = icon; $('clock-icon').innerHTML = WEATHER_ICONS[icon]; }
  if (settings.time !== a.period) settings.time = a.period;
  // Fuel gauge.
  const fuelOn = settings.fuel === 'on' && settings.location === 'hills'; $('fuel').hidden = !fuelOn;
  if (fuelOn) { $('fuel-fill').style.width = (state.fuel * 100).toFixed(1) + '%'; $('fuel').classList.toggle('low', state.fuel < .2); const st = nextFuelStop(world.road, false); $('fuel-next').textContent = state.refuelling ? 'FILLING…' : st ? `${((st.z - state.z) / 1000 * factor).toFixed(1)} ${settings.units === 'mi' ? 'MI' : 'KM'}` : ''; }
  const blink = Math.floor(performance.now() / 380) % 2 === 0; $('indicators')?.classList.toggle('blink', blink);
  const st = radio?.station; $('radio-label').textContent = st ? st.freq : 'OFF';
  $('performance').textContent = `${state.fps} FPS · ${renderer.info.render.calls} draw calls\n${Math.round(renderer.info.render.triangles / 1000)}k triangles · ${world.chunks.size} chunks\n${settings.quality.toUpperCase()} · ${(renderer.getPixelRatio()).toFixed(2)}× resolution\n${state.auto ? 'AUTODRIVE' : 'MANUAL'} · ${state.offroad ? 'OFF ROAD' : 'ON ROAD'} · ${TYPES[world.road.typeAt(state.z)]?.label || ''}`;
}
export function updateUI() {
  $('autodrive-btn').classList.toggle('active', state.auto); $('autodrive-btn').setAttribute('aria-pressed', String(state.auto));
  $('drive-status').textContent = state.auto ? 'ENJOY THE VIEW' : state.cruise ? 'CRUISE CONTROL' : 'TAKE THE SCENIC ROUTE';
  $('scene-label').innerHTML = (settings.location === 'hills' ? (inDestination(settings,state.z) ? DESTINATIONS[settings.destination].name.toUpperCase() : 'HILLS') : 'OFF-WORLD') + ' <span>/</span> ' + (settings.location === 'hills' ? settings.season : settings.planet).toUpperCase();
  $('camera-label').textContent = ['CHASE', 'FAR CHASE', 'COCKPIT', 'BONNET', 'BUMPER'][settings.camera];
  $('speed-unit').textContent = settings.units === 'mi' ? 'MPH' : 'KM / H'; document.querySelector('.journey>span').textContent = settings.units === 'mi' ? 'MILES' : 'KILOMETERS';
  $('pause-indicator').hidden = !state.paused;
}

/* ---------- Sound ---------- */
function setHorn(on) { if (on === horning) return; horning = on; state.horning = on; if (on) { initAudio(); if (audioContext?.state === 'suspended') audioContext.resume(); life?.honk(); } $('horn-btn')?.classList.toggle('active', on); }
function initAudio() {
  if (audioReady) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate), data = buffer.getChannelData(0);
    let brown = 0; for (let i = 0; i < data.length; i++) { brown = (brown + (Math.random() * 2 - 1) * .025) / 1.02; data[i] = brown * 3; }
    const source = audioContext.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 500;
    // Mixer: one channel each for the vehicle (engine, brakes, wind, indicators), the weather and other sound effects.
    mixer = Object.fromEntries(['vehicle', 'weather', 'sfx'].map((k) => { const g = audioContext.createGain(); g.gain.value = settings[k + 'Volume']; g.connect(audioContext.destination); return [k, g]; }));
    windGain = audioContext.createGain(); windGain.gain.value = 0; source.connect(filter).connect(windGain).connect(mixer.vehicle); source.start();
    effects?.initAudio(audioContext, mixer); railway?.initAudio(audioContext, mixer.sfx);
    driveAudio = new DriveAudio(audioContext, mixer.vehicle);
    radio = new Radio(audioContext, () => state.started && !state.paused && !muted ? settings.radioVolume * Math.min(1, settings.volume * 2.6) : 0, radioContext);
    if (settings.radio >= 0) radio.tune(settings.radio, !state.started && !starting);
    audioReady = true;
  } catch (e) { console.warn(e); }
}
function radioContext() {
  const r = world.road; let townName = null;
  for (let q = state.z; q < state.z + 1600 && !townName; q += 200) { const t = r.townAt(q); if (t && t.end > state.z) townName = t.name; }
  return {hour: atmo.hour, clock: atmo.clock, rain: atmo.rain, cloud: atmo.cloud, mist: atmo.mistAmount, town: townName, road: settings.location === 'hills' ? r.typeAt(state.z) : 'offworld', roadName: settings.location === 'hills' ? r.segAt(state.z).name : '', fuel: settings.fuel === 'on' ? state.fuel : undefined,
    km: state.distance, kmh: Math.abs(state.speed) * 3.6, units: settings.units, season: settings.season, location: settings.location, planetName: {mars: 'Mars', moon: 'the Moon', venus: 'Venus'}[settings.planet], tunnel: settings.location === 'hills' && !!r.inTunnel(state.x, state.z)};
}
export function cycleRadio() {
  initAudio(); if (audioContext?.state === 'suspended') audioContext.resume();
  if (!radio) return;
  const st = radio.cycle(1); settings.radio = radio.index; save();
  toast(st ? `${st.name} · ${st.freq}` : 'Radio off'); updateHUD();
}
function updateAudio(dt = 0) {
  if (!audioReady) return;
  const active = state.started && !state.paused && !muted && !panelOpen && !state.inspection ? settings.volume : 0;
  if (driveAudio) { state.gearLabel = driveAudio.update(dt, {speed: state.speed, throttle: state.throttle || 0, brake: Math.max(state.brakeIn || 0, keys.Space ? 1 : 0), steer: state.steer, offroad: state.offroad, volume: active, vehicle: settings.vehicle, reverse: state.speed < -.2, grounded: state.grounded !== false}); state.slip = driveAudio.slip; driveAudio.horn(horning && state.started, active); }
  windGain.gain.setTargetAtTime(active * .14 * Math.min(Math.abs(state.speed) / 25, 1), audioContext.currentTime, .3);
  for (const k in mixer) mixer[k].gain.setTargetAtTime(settings[k + 'Volume'], audioContext.currentTime, .1);
  radio?.update(dt);
  // Indicator relay: tick on, tock off.
  const blink = state.indicator ? Math.floor(performance.now() / 380) % 2 : null;
  if (blink !== lastTick && blink !== null && active) { const t = audioContext.currentTime, o = audioContext.createOscillator(), g = audioContext.createGain(); o.type = 'square'; o.frequency.value = blink ? 1650 : 1250; g.gain.setValueAtTime(active * .05, t); g.gain.exponentialRampToValueAtTime(.0001, t + .018); o.connect(g).connect(mixer.vehicle); o.start(t); o.stop(t + .03); }
  lastTick = blink;
}

/* ---------- Controls ---------- */
function initUI() {
  $('begin').onclick = beginWithIntro; $('autodrive-btn').onclick = () => toggleAuto(); $('reset-btn').onclick = () => { reset(); toast('Back on the road'); };
  $('camera-btn').onclick = () => changeSetting('camera', (settings.camera + 1) % 5);
  $('sound-btn').onclick = () => { muted = !muted; $('sound-btn').style.opacity = muted ? .4 : 1; toast(muted ? 'Sound off' : 'Sound on'); initAudio(); };
  $('radio-btn').onclick = () => cycleRadio();
  $('ind-left-btn').onclick = () => toggleIndicator(1); $('ind-right-btn').onclick = () => toggleIndicator(-1);
  $('fullscreen-btn').onclick = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => toast('Fullscreen isn’t available in this browser')); };
  document.querySelector('.wordmark').onclick = (e) => { e.preventDefault(); state.paused = true; $('start').hidden = false; $('start').classList.remove('leaving'); $('begin').textContent = 'continue your drive ↗︎'; $('begin').onclick = () => { state.paused = false; $('start').hidden = true; updateUI(); }; };
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); bloom?.setSize(innerWidth, innerHeight); });
  addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = true; if (e.repeat) return;
    if (state.viewing) { state.viewing = null; positionCamera(1, true); return; }
    if (e.code === 'Enter' && !state.started && $('start').hidden === false) beginWithIntro();
    if (e.code === 'KeyF') toggleAuto();
    if (e.code === 'KeyC') changeSetting('camera', (settings.camera + 1) % 5);
    if (e.code === 'KeyR') { reset(); toast('Back on the road'); }
    if (e.code === 'KeyP') { state.paused = !state.paused; updateUI(); }
    if (e.code === 'KeyG') setHorn(true);
    if (e.code === 'KeyQ') toggleIndicator(1);
    if (e.code === 'KeyE') toggleIndicator(-1);
    if (e.code === 'KeyN') cycleRadio();
    if (e.code === 'KeyH') { state.headlights = !state.headlights; toast(state.headlights ? 'Headlights on' : 'Headlights off'); }
    if (e.code === 'KeyM') $('sound-btn').click();
    if (e.code === 'KeyU') { state.photo = !state.photo; document.body.classList.toggle('photo-mode', state.photo); toast(state.photo ? 'Photo mode · press U to return' : 'Controls visible'); }
    if (e.code === 'KeyJ') { state.cruise = !state.cruise; state.cruiseSpeed = Math.max(state.speed, 15); state.auto = false; updateUI(); toast(state.cruise ? 'Cruise control set' : 'Cruise control off'); }
    if (e.code === 'KeyI') state.cruiseSpeed += 2;
    if (e.code === 'KeyK') state.cruiseSpeed = Math.max(3, state.cruiseSpeed - 2);
    if (e.code === 'F4') { e.preventDefault(); $('performance').hidden = !$('performance').hidden; }
    if (e.code === 'KeyV') inspectCar(!state.inspection);
    if (e.code === 'Escape') { if (state.inspection) inspectCar(false); else if (panelOpen) closePanel(); else openPanel('settings'); }
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyG') setHorn(false); });
  const clearDriveTouchState = (pointerId) => { if (pointerId === undefined) endAllTouchDrive(); else endTouchDrive(pointerId); };
  for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'pointerout']) addEventListener(type, (e) => clearDriveTouchState(e.pointerId));
  addEventListener('blur', () => { releaseCameraDrag(); clearDriveTouchState(); for (const k of Object.keys(keys)) keys[k] = false; setHorn(false); });
  addEventListener('pagehide', save); setInterval(save, 10000);
  { const h = $('horn-btn'); if (h) { h.onpointerdown = (e) => { e.preventDefault(); h.setPointerCapture?.(e.pointerId); setHorn(true); }; const off = () => setHorn(false); h.onpointerup = off; h.onpointercancel = off; h.onlostpointercapture = off; h.addEventListener('touchstart', (e) => e.preventDefault(), {passive: false}); h.addEventListener('contextmenu', (e) => e.preventDefault()); } }
  for (const button of document.querySelectorAll('[data-drive]')) {
    const code = {left: 'KeyA', right: 'KeyD', throttle: 'KeyW', brake: 'KeyS'}[button.dataset.drive];
    const start = (e) => { e.preventDefault(); button.setPointerCapture(e.pointerId); beginTouchDrive(e.pointerId, code); };
    const end = (e) => { if (!touchPointers.has(e.pointerId)) return; e.preventDefault(); if (button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId); clearDriveTouchState(e.pointerId); };
    button.onpointerdown = start; button.onpointerup = end; button.onpointercancel = end; button.onlostpointercapture = end;
    button.addEventListener('touchstart', (e) => e.preventDefault(), {passive: false}); button.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  for (const type of ['selectstart', 'contextmenu']) document.addEventListener(type, (e) => { if (!e.target.closest?.('input,textarea,[contenteditable]')) e.preventDefault(); });
  for (const button of document.querySelectorAll('[data-panel]')) button.onclick = () => openPanel(button.dataset.panel);
  $('settings-btn').onclick = () => openPanel('settings'); $('help-btn').onclick = () => openPanel('help'); $('exit-inspection').onclick = () => inspectCar(false);
  bindCameraDrag(); $('close-panel').onclick = closePanel; updateUI(); updateIndicatorHUD();
}

function releaseCameraDrag(reset = false) {
  const canvas = $('game'), id = orbitPointer?.id ?? driveOrbit.pointer?.id;
  orbitPointer = null;
  if (reset) driveOrbit.reset(); else if (id !== undefined) driveOrbit.end(id);
  if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  document.body.classList.remove('camera-dragging');
}
function bindCameraDrag() {
  const canvas = $('game');
  canvas.addEventListener('pointerdown', (e) => {
    if (state.viewing) { state.viewing = null; positionCamera(1, true); return; }
    if (!state.started || panelOpen || !$('start').hidden || e.button !== 0 || orbitPointer || driveOrbit.pointer) return;
    e.preventDefault();
    if (state.inspection) orbitPointer = {id: e.pointerId, x: e.clientX, y: e.clientY};
    else { driveOrbit.begin(e.pointerId, e.clientX, e.clientY); chaseOrbitRadius = settings.camera < 2 ? camera.position.distanceTo(tmp.set(state.x, state.y + .95, state.z)) : Math.hypot(7.6, 1.3); }
    canvas.setPointerCapture(e.pointerId); document.body.classList.add('camera-dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (state.inspection) {
      if (!orbitPointer || e.pointerId !== orbitPointer.id) return;
      orbitYaw -= (e.clientX - orbitPointer.x) / canvas.clientWidth * Math.PI * 2; orbitPitch = clamp(orbitPitch + (e.clientY - orbitPointer.y) / canvas.clientHeight * 2, .04, .9);
      orbitPointer.x = e.clientX; orbitPointer.y = e.clientY;
    } else if (driveOrbit.move(e.pointerId, e.clientX, e.clientY, canvas.clientWidth, canvas.clientHeight) && settings.camera >= 2) {
      // A drag from an interior view reveals the whole car in chase view.
      settings.camera = 0; save(); updateUI();
    }
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, (e) => { if (e.pointerId === orbitPointer?.id || e.pointerId === driveOrbit.pointer?.id) releaseCameraDrag(); });
  canvas.addEventListener('wheel', (e) => { if (!state.inspection) return; e.preventDefault(); orbitDistance = clamp(orbitDistance + e.deltaY * .008, 4.5, 13); }, {passive: false});
}

function inspectCar(active) { releaseCameraDrag(true); state.inspection = active; orbitPointer = null; if (active) { begin(); closePanel(); orbitYaw = .72; orbitPitch = .25; orbitDistance = 7.5; } document.body.classList.toggle('inspection-mode', active); $('car-inspection').hidden = !active; positionCamera(1, true); }
export function openPanel(name) { endAllTouchDrive(); releaseCameraDrag(true); panelOpen = true; $('panel').hidden = false; $('panel-title').textContent = name[0].toUpperCase() + name.slice(1); $('panel-content').innerHTML = panelMarkup(name); document.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('active', b.dataset.panel === name)); bindPanel(); }
// Tapping anywhere outside an open panel closes it.
addEventListener('pointerdown', (e) => { if (!panelOpen || state.inspection) return; const t = e.target; if ($('panel').contains(t) || t.closest?.('[data-panel], .top-actions, #topbar button')) return; closePanel(); updateUI(); }, true);
function closePanel() { endAllTouchDrive(); panelOpen = false; $('panel').hidden = true; document.querySelectorAll('[data-panel]').forEach((b) => b.classList.remove('active')); }
function options(key, values) { return `<div class="options">${values.map((v) => { const [value, label] = Array.isArray(v) ? v : [v, v]; return `<button data-setting="${key}" data-value="${value}" class="${settings[key] === value ? 'selected' : ''}" aria-pressed="${settings[key] === value}">${label}</button>`; }).join('')}</div>`; }
function section(label, html) { return `<div class="control-group"><label>${label}</label>${html}</div>`; }
function panelMarkup(name) {
  if (name === 'world') return section('DESTINATIONS', `<div class="destination-list">${Object.entries(DESTINATIONS).map(([key, d]) => `<button data-destination="${key}" aria-pressed="${settings.destination === key}" class="destination-card ${settings.destination === key ? 'selected' : ''}"><strong>${d.name}</strong><span>${d.detail}</span></button>`).join('')}</div>`) + section('LANDSCAPE', options('location', [['hills', 'Hills'], ['offworld', 'Off-World']])) + section('ROAD', options('roadStyle', [['straight', 'Straight'], ['casual', 'Casual'], ['normal', 'Normal'], ['winding', 'Winding']])) + section('AT JUNCTIONS', options('junctions', [['surprise', 'Surprise me'], ['straight', 'Keep straight on']]) + '<p class="hint">What autodrive does at a junction. Indicate with Q or E, or tap the sign that pops up, to choose your own way.</p>') + section('WORLD SEED', '<input id="seed-input" aria-label="World seed" type="text" maxlength="60"><button id="generate-btn" class="action-btn">Generate a new journey ↗︎</button><p class="hint">The same seed always leads to the same road.</p>');
  if (name === 'style') return (settings.location === 'hills' ? section('SEASON', options('season', [['spring', 'Spring'], ['summer', 'Summer'], ['autumn', 'Autumn'], ['winter', 'Winter']])) : section('PLANET', options('planet', [['mars', 'Mars'], ['moon', 'Moon'], ['venus', 'Venus']]))) + section('TIME OF DAY', options('time', [['dawn', 'Dawn'], ['day', 'Day'], ['sunset', 'Golden hour'], ['night', 'Night']])) + section('CLOCK', options('clock', [['live', 'Time passes'], ['still', 'Hold the time']]) + '<p class="hint">With time passing, a whole day goes by in about half an hour: sunset, night, dawn.</p>') + section('WEATHER', options('weather', [['changing', 'Changing'], ['clear', 'Clear skies'], ['overcast', 'Overcast'], ['rain', 'Rain & thunder']]));
  if (name === 'vehicle') return section('YOUR RIDE', options('vehicle', [['coupe', 'Coupé'], ['mercedes', 'Mercedes W201'], ['coach', 'Coach'], ['bike', 'Bike']])) + '<p class="vehicle-description">' + ({mercedes: '1982 Mercedes W201. A classic saloon with a textured cabin, independently rigged wheels, and calmer everyday handling.', coupe: 'A detailed sports coupé with sculpted bodywork, alloy wheels, and reflective paint. Balanced, responsive, and made for the long way home.', coach: 'A higher perspective on the open road. Take your time and watch the scenery unfold.', bike: 'Light, nimble, and a little closer to the elements.'}[settings.vehicle]) + '</p>' + '<button id="inspect-car" class="action-btn">Explore in 3D <span>↗︎</span></button>' + (state.dirt > .15 ? '<button id="wash-car" class="action-btn">Wash the car <span>↗︎</span></button>' : '') + section('PAINT', `<div class="options swatches">${['#e9e7db', '#b51f25', '#335b4c', '#7b9ba8', '#333a43', '#d6ba75'].map((c) => `<button data-setting="color" data-value="${c}" aria-label="${{'#e9e7db': 'Pearl', '#335b4c': 'Forest', '#7b9ba8': 'Glacier', '#b51f25': 'Racing red', '#333a43': 'Graphite', '#d6ba75': 'Champagne'}[c]} paint" class="${settings.color === c ? 'selected' : ''}" style="background:${c}"></button>`).join('')}</div>`) + section('VIEW', options('camera', [[0, 'Chase'], [1, 'Far'], [2, 'Cockpit'], [3, 'Bonnet'], [4, 'Bumper']]));
  if (name === 'help') return '<p class="vehicle-description">There’s no finish line. Drive at your own pace, or let autodrive take you somewhere new.</p><div class="keylist">' + [['Look around / return behind', 'Drag / release'], ['Explore car in 3D', 'V'], ['Accelerate / brake', 'W / S or ↑︎ / ↓︎'], ['Steer', 'A / D or ←︎ / →︎'], ['Indicate left / right', 'Q / E'], ['Autodrive', 'F'], ['Boost', 'Shift'], ['Handbrake', 'Space'], ['Radio station', 'N'], ['Reset on road', 'R'], ['Change camera', 'C'], ['Cruise control', 'J'], ['Adjust cruise speed', 'I / K'], ['Headlights', 'H'], ['Horn', 'G'], ['Pause', 'P'], ['Mute', 'M'], ['Hide interface', 'U'], ['Performance', 'F4'], ['Settings', 'Esc']].map(([a, b]) => `<span>${a}</span><kbd>${b}</kbd>`).join('') + '</div><p class="hint">At a junction, indicate towards the side road (or tap the sign) to take it. Stop in a petrol station, café or viewpoint for something to do there.</p><p class="hint">Gamepad: left stick to steer, right trigger to accelerate, left trigger to brake.</p><p class="hint">3D car: Ferrari 458 Italia by <a href="https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6" target="_blank" rel="noopener noreferrer">vicent091036</a>, via the <a href="https://threejs.org/examples/webgl_materials_car.html" target="_blank" rel="noopener noreferrer">Three.js car demo</a>. Adapted materials and animation.</p>';
  return section('RENDER QUALITY', options('quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['ultra', 'Ultra']])) + section('CAMERA FIELD OF VIEW', `<input aria-label="Field of view" data-range="fov" type="range" min="45" max="85" step="1" value="${settings.fov}">`) + section('AUTODRIVE', options('autoMode', [['full', 'Full auto'], ['steering', 'Steer only'], ['speed', 'Speed only']])) + section('DRIVING LANE', options('autoLane', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']])) + section('RUSH MODE', options('rushMode', [['off', 'Off'], ['on', 'On']]) + '<p class="hint">Autodrive drives faster and overtakes as soon as a gap opens, even with oncoming cars in the distance.</p>') + section('ONCOMING TRAFFIC', options('trafficOncoming', [['on', 'On'], ['off', 'Off']])) + section('TRAFFIC IN YOUR LANE', options('trafficOwn', [['on', 'On'], ['off', 'Off']]) + '<p class="hint">Slower cars, buses and delivery trucks ahead of you. Autodrive follows them and overtakes when the road is clear.</p>') + section('CYCLISTS', options('cyclists', [['on', 'On'], ['off', 'Off']])) + section('FUEL GAUGE', options('fuel', [['off', 'Off'], ['on', 'On']]) + '<p class="hint">Keep an eye on the tank and fill up at petrol stations. Autodrive pulls in by itself when it runs low.</p>') + section('REAR-VIEW MIRROR', options('mirror', [['on', 'On'], ['off', 'Off']]) + '<p class="hint">Shown in the cockpit and bonnet views.</p>') + section('UNITS', options('units', [['km', 'Kilometers'], ['mi', 'Miles']])) + section('SOUND', [['volume', 'Master'], ['vehicleVolume', 'Vehicle'], ['weatherVolume', 'Weather'], ['sfxVolume', 'Effects'], ['radioVolume', 'Radio']].map(([k, label]) => `<label class="setting-line">${label}<input aria-label="${label} volume" data-range="${k}" type="range" min="0" max="1" step=".05" value="${settings[k]}"></label>`).join('') + '<p class="hint">Vehicle: engine, brakes, wind and indicators. Weather: rain and thunder. Effects: trains and aircraft.</p>') + section('RADIO', `<div class="options radio-options">${[[-1, 'Off'], ...STATIONS.map((s, i) => [i, s.name])].map(([i, label]) => `<button data-radio="${i}" class="${settings.radio === i ? 'selected' : ''}" aria-pressed="${settings.radio === i}">${label}</button>`).join('')}</div><p class="hint">${STATIONS.map((s) => `${s.name}: ${s.tag}`).join(' · ')}</p>`) + section('ROAD WIDTH', `<input aria-label="Road width" data-range="roadWidth" type="range" min="8" max="13" step=".5" value="${settings.roadWidth}">`) + section('HANDLING', `<label class="setting-line">Grip<input aria-label="Grip" data-range="grip" type="range" min=".4" max="1.5" step=".1" value="${settings.grip}"></label><label class="setting-line">Speed<input aria-label="Speed factor" data-range="speedFactor" type="range" min=".5" max="2" step=".1" value="${settings.speedFactor}"></label>`);
}
function bindPanel() {
  if ($('inspect-car')) $('inspect-car').onclick = () => inspectCar(true);
  if ($('wash-car')) $('wash-car').onclick = () => { state.dirt = 0; toast('Sparkling clean'); openPanel('vehicle'); };
  const name = $('panel-title').textContent.toLowerCase();
  for (const b of document.querySelectorAll('[data-destination]')) b.onclick = () => { closePanel(); changeSettingLoaded('destination', b.dataset.destination, () => toast(DESTINATIONS[settings.destination].name)); };
  for (const b of document.querySelectorAll('[data-setting]')) b.onclick = () => { const key = b.dataset.setting; changeSettingLoaded(key, key === 'camera' ? Number(b.dataset.value) : b.dataset.value, () => openPanel(name)); };
  for (const b of document.querySelectorAll('[data-radio]')) b.onclick = () => { initAudio(); if (audioContext?.state === 'suspended') audioContext.resume(); const i = Number(b.dataset.radio); settings.radio = i; save(); radio?.tune(i); openPanel(name); };
  for (const input of document.querySelectorAll('[data-range]')) { input.onchange = () => changeSetting(input.dataset.range, Number(input.value)); if (/olume$/.test(input.dataset.range)) input.oninput = input.onchange; }
  if ($('seed-input')) { $('seed-input').value = settings.seed; $('generate-btn').onclick = () => { closePanel(); changeSettingLoaded('seed', $('seed-input').value.trim() || String(Math.floor(Math.random() * 1e8)), () => toast('A new road is waiting')); }; $('seed-input').onkeydown = (e) => { if (e.key === 'Enter') $('generate-btn').click(); }; }
}

// Test hook (only with ?debug in the address): run the simulation without drawing, to check long drives quickly.
if (new URLSearchParams(location.search).has('debug')) window.evermile = {state, settings, get world() { return world; }, get life() { return life; }, get town() { return town; }, get railway() { return railway; }, get atmo() { return atmo; }, get radio() { return radio; }, get camera() { return camera; }, get vehicle() { return vehicle; }, plan() { const r = world.road; return autoPlan(r, Math.abs(r.tangent(state.z + 45) - r.tangent(state.z))); }, changeSetting, toggleAuto, reset, toggleIndicator, chooseJunction,
  simulate(seconds, step = 1 / 30) { const stop = state.time + seconds; let n = 0; while (state.time < stop && n++ < seconds * 200) { for (let i = 0; i < 4; i++) physics(step / 4); applyAtmosphere(step); updateCar(step); positionCamera(step); town.update(step, camera); life.update(step); railway.update(step, camera, () => 0); world.update(state.z, camera); routeWatch(); stopWatch(step); if (!state.started) break; } return {z: state.z, time: state.time}; },
  render() { if (composer) composer.render(0); else renderer.render(scene, camera); }};

// The same driving actions are available to browsers supporting WebMCP.
const modelContext = document.modelContext;
if (modelContext?.registerTool) {
  const controller = new AbortController(); addEventListener('pagehide', () => controller.abort(), {once: true});
  const read = () => ({game: 'Evermile', railway: {imported:!!railway.pool?.freight.cars[0].imported,errors:railway.importErrors||[],active:!!railway.train}, detailedModels: detailedModels ? {loaded:Object.keys(detailedModels.loaded),errors:detailedModels.errors,traffic:life.traffic.filter(c=>c.detailModel?.visible).length,people:town.people.filter(p=>p.detailed).length,pedestrianTypes:[...new Set(town.people.filter(p=>p.detailed).map(p=>citizenKey(p.i)))],trafficTypes:[...new Set(life.traffic.filter(c=>c.detailModel?.visible).map(c=>c.style))],trafficErrors:detailedModels.trafficModels.errors,architecture:{loaded:Object.keys(world.landmarks.imported.loaded),errors:world.landmarks.imported.errors},roadside:{loaded:Object.keys(world.roadsideModels.loaded),errors:world.roadsideModels.errors},motorcycleImported:!!vehicle.importedBike,animals:life.animals.filter(a=>detailedModels.animalModels.has(a)).reduce((out,a)=>(out[a.kind]=(out[a.kind]||0)+1,out),{})} : null, position: {x: state.x, y: state.y, z: state.z}, cameraPosition: camera.position.toArray(), terrainAtCamera: world.surfaceHeight(camera.position.x,camera.position.z), started: state.started, paused: state.paused || panelOpen || state.inspection, autodrive: state.auto, speedKmh: Math.round(Math.abs(state.speed) * 3.6), distanceKm: Number(state.distance.toFixed(3)), fps: state.fps, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, chunks: world.chunks.size, onRoad: !state.offroad, road: world.road.typeAt(state.z), clock: atmo.clock, vehicle: settings.vehicle, detailedCarLoaded: !!vehicle.detailed, location: settings.location, destination: settings.destination, tireSlip: state.tireSlip || 0, handling: {yaw:state.yaw, yawRate:state.yawRate || 0, steer:state.steer, lateralAcceleration:state.lateralAcceleration || 0}, season: settings.season, timeOfDay: atmo.period, weather: {cloud: Number(atmo.cloud.toFixed(2)), rain: Number(atmo.rain.toFixed(2))}, camera: settings.camera, cameraOrbit: {dragging: !!driveOrbit.pointer, yawDegrees: Number((driveOrbit.yaw * 180 / Math.PI).toFixed(1)), pitchDegrees: Number((driveOrbit.pitch * 180 / Math.PI).toFixed(1)), returning: !driveOrbit.pointer && Math.abs(driveOrbit.yaw) + Math.abs(driveOrbit.pitch) > .01}});
  const tools = [
    {name: 'get_drive_status', description: 'Read the current Evermile driving state and rendering performance.', inputSchema: {type: 'object', properties: {}, additionalProperties: false}, annotations: {readOnlyHint: true}, execute: () => read()},
    {name: 'start_drive', description: 'Start Evermile and optionally enable or disable autodrive, using the normal game controls.', inputSchema: {type: 'object', properties: {autodrive: {type: 'boolean'}}, required: ['autodrive'], additionalProperties: false}, annotations: {readOnlyHint: false}, execute: async (input) => { if (typeof input?.autodrive !== 'boolean') throw new Error('autodrive must be boolean'); inspectCar(false); state.paused = false; begin(); closePanel(); toggleAuto(input.autodrive); await new Promise(requestAnimationFrame); return read(); }},
    {name: 'configure_drive', description: 'Change the destination, vehicle, landscape, season, time, or camera using the same options as the visible menus.', inputSchema: {type: 'object', properties: {destination: {type: 'string', enum: valid.destination}, vehicle: {type: 'string', enum: valid.vehicle}, location: {type: 'string', enum: valid.location}, season: {type: 'string', enum: valid.season}, time: {type: 'string', enum: valid.time}, weather: {type: 'string', enum: valid.weather}, camera: {type: 'integer', minimum: 0, maximum: 4}}, additionalProperties: false}, annotations: {readOnlyHint: false}, execute: async (input) => { if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected options object'); for (const [key, value] of Object.entries(input)) { if (key === 'camera') { if (!Number.isInteger(value) || value < 0 || value > 4) throw new Error('Invalid camera'); } else if (!['destination', 'vehicle', 'location', 'season', 'time', 'weather'].includes(key) || !valid[key].includes(value)) throw new Error('Invalid option: ' + key); } for (const [key, value] of Object.entries(input)) changeSetting(key, value); await new Promise(requestAnimationFrame); return read(); }},
    {name: 'reset_vehicle', description: 'Put the vehicle back on the road and stop it, like pressing R.', inputSchema: {type: 'object', properties: {}, additionalProperties: false}, annotations: {readOnlyHint: false}, execute: () => { reset(); updateUI(); return read(); }},
  ];
  // Development-only review positions use the same generated roads and simulation as normal driving.
  if(['127.0.0.1','localhost'].includes(location.hostname))tools.push({name:'review_roadside',description:'In the local preview, position the player before a generated fuel station or signal junction for visual and gameplay checks.',inputSchema:{type:'object',properties:{subject:{type:'string',enum:['fuel','signals']}},required:['subject'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async({subject})=>{
   if(!['fuel','signals'].includes(subject))throw new Error('Unknown subject');const r=world.road;let target;
   for(let z=0;z<16000&&!target;z+=120){if(subject==='fuel')target=r.stops(r.segAt(z)).find(s=>s.kind==='fuel');else{const t=r.townAt(z);if(t){const lay=world.scenery.layout(t);if(lay.cross.kind==='lights')target=lay.cross;}}}
   if(!target)throw new Error('No matching roadside scene on this route');state.auto=false;state.z=target.z-30;life.clear();reset();world.update(state.z,camera,true);begin();closePanel();await new Promise(requestAnimationFrame);return {...read(),reviewTarget:{subject,z:target.z}};
  }});
  if(['127.0.0.1','localhost'].includes(location.hostname))tools.push({name:'review_controls',description:'Hold normal driving controls briefly in the local preview, then release them. Uses the rendered game loop for handling verification.',inputSchema:{type:'object',properties:{steer:{type:'integer',minimum:-1,maximum:1},pedal:{type:'string',enum:['accelerate','brake','coast']},seconds:{type:'number',minimum:.1,maximum:5}},required:['steer','pedal','seconds'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async({steer,pedal,seconds})=>{
   if(![-1,0,1].includes(steer)||!['accelerate','brake','coast'].includes(pedal)||!Number.isFinite(seconds)||seconds<.1||seconds>5)throw new Error('Invalid controls');
   state.auto=false;state.cruise=false;state.paused=false;begin();closePanel();const before=read();
   keys.KeyA=steer===1;keys.KeyD=steer===-1;keys.KeyW=pedal==='accelerate';keys.KeyS=pedal==='brake';
   try{await new Promise(resolve=>setTimeout(resolve,seconds*1000));return {before,after:read()};}finally{keys.KeyA=keys.KeyD=keys.KeyW=keys.KeyS=false;}
  }});
  for (const tool of tools) try { Promise.resolve(modelContext.registerTool(tool, {signal: controller.signal})).catch(() => {}); } catch {}
}
