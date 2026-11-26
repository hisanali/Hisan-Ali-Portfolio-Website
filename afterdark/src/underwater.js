// Under the sea, the fjord and the lake. When the camera goes below the surface the world turns to water: a blue-green
// murk that swallows the distance and darkens with depth, the surface overhead seen from below (a bright rippling
// window straight up, a dark mirror towards the edges), shafts of sunlight swaying down through it, motes drifting in
// the water, bubbles streaming off the car, shoals of fish, kelp on the bed and a wreck lying in the deep.
import * as THREE from '/evermile/vendor/three.module.js';
import { GLTFLoader } from '/evermile/vendor/loaders/GLTFLoader.js';
import { SEA_LEVEL } from './water.js';
import { LAKE } from './frontier-land.js';
import { CAUSTICS } from './caustics.js';

const clamp = THREE.MathUtils.clamp;

export function createUnderwater(scene, world, sea, sky) {
  const group = new THREE.Group(); group.visible = false; scene.add(group);
  const U = { uTime: { value: 0 }, uDeep: { value: new THREE.Color() }, uSky: { value: new THREE.Color() }, uSun: { value: 1 } };
  // The surface from below: Snell's window straight up, total internal reflection (the dark water) past it.
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 1, 1).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, depthWrite: false, transparent: true, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime, uSun; uniform vec3 uDeep, uSky; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec3 v = normalize(vW - cameraPosition); float up = clamp(v.y, 0.0, 1.0);
        float window = smoothstep(0.62, 0.86, up); // the circle of sky seen through the surface (48.6 degrees off vertical)
        vec2 p = vW.xz * 0.11; float r = n(p + uTime * 0.35) * 0.6 + n(p * 2.3 - uTime * 0.5) * 0.4;
        vec3 c = mix(uDeep * 1.6, uSky * (1.1 + 0.6 * r) * uSun, window) + vec3(0.9, 1.0, 1.0) * pow(r, 6.0) * 0.6 * uSun * window;
        float far = smoothstep(40.0, 300.0, length(vW.xz - cameraPosition.xz));
        gl_FragColor = vec4(mix(c, uDeep, far), 1.0); }` })); // the distance fades into the murk
  surface.renderOrder = 2; group.add(surface);
  // The murk all around beyond the fog: lighter towards the surface, darker below.
  const murkU = { uDeep: U.uDeep };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 12), new THREE.ShaderMaterial({ uniforms: murkU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uDeep; varying vec3 vD; void main(){ gl_FragColor = vec4(uDeep * mix(0.55, 1.35, smoothstep(-0.6, 0.5, vD.y)), 1.0); }' }));
  dome.renderOrder = -10; group.add(dome);
  // Shafts of light hanging from the surface around the camera, swaying and slowly breathing.
  const shaftTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 256);
    const s = x.getImageData(0, 0, 64, 256); for (let i = 0; i < 64; i++) { const k = Math.pow(Math.sin(i / 63 * Math.PI), 2); for (let j = 0; j < 256; j++) s.data[(j * 64 + i) * 4 + 3] *= k; } x.putImageData(s, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, color: 0x9fe8e0, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const shafts = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0), shaftMat); m.userData = { a: Math.random() * 6.28, d: 4 + Math.random() * 26, w: 1.2 + Math.random() * 3, ph: Math.random() * 6.28 }; group.add(m); shafts.push(m); }
  // Motes suspended in the water around the camera.
  const MOTES = 900, mp = new Float32Array(MOTES * 3); for (let i = 0; i < MOTES; i++) mp.set([(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 24, (Math.random() - 0.5) * 40], i * 3);
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: 0.06, color: 0xcfe9e2, transparent: true, opacity: 0.55, depthWrite: false })); motes.frustumCulled = false; group.add(motes);
  // Bubbles: streaming up from the car while it is under, and from the wreck.
  const BUB = 240, bp = new Float32Array(BUB * 3), born = new Float32Array(BUB).fill(-1e6), rise = new Float32Array(BUB);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bg.setAttribute('born', new THREE.BufferAttribute(born, 1)); bg.setAttribute('rise', new THREE.BufferAttribute(rise, 1));
  const bubbleU = { time: { value: 0 }, surface: { value: 0 }, scale: { value: innerHeight } };
  const bubbles = new THREE.Points(bg, new THREE.ShaderMaterial({ uniforms: bubbleU, transparent: true, depthWrite: false,
    vertexShader: 'attribute float born, rise; uniform float time, surface, scale; varying float vA; void main(){ float age = time - born; vec3 p = position + vec3(sin(age * 3.0 + position.x) * 0.12, age * rise, cos(age * 2.3 + position.z) * 0.12); vA = age < 0.0 || p.y > surface - 0.05 ? 0.0 : 0.8; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (0.05 + 0.04 * fract(born * 7.3)) * scale / -mv.z; }',
    fragmentShader: 'varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; float rim = smoothstep(0.35, 1.0, r); gl_FragColor = vec4(vec3(0.85, 0.95, 1.0), vA * (0.2 + rim * 0.7)); }' }));
  bubbles.frustumCulled = false; group.add(bubbles); let nextBubble = 0, bubbleClock = 0;
  const bubble = (x, y, z, r = 0.8) => { const i = nextBubble; nextBubble = (nextBubble + 1) % BUB; bp.set([x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4], i * 3); born[i] = U.uTime.value; rise[i] = r * (0.7 + Math.random() * 0.6);
    const a = bg.attributes; a.position.needsUpdate = a.born.needsUpdate = a.rise.needsUpdate = true; };
  // Kelp on the bed, swaying from the root.
  const KELP = 140, kelpMat = new THREE.MeshStandardMaterial({ color: 0x3d6a38, roughness: 0.9, side: THREE.DoubleSide });
  kelpMat.onBeforeCompile = sh => { sh.uniforms.uTime = U.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat kp = float(gl_InstanceID) * 0.9; float sw = position.y / 3.2; transformed.x += sin(uTime * 0.9 + kp) * 0.45 * sw * sw; transformed.z += cos(uTime * 0.7 + kp) * 0.3 * sw * sw;'); };
  const kelp = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.4, 3.2, 1, 6).translate(0, 1.6, 0), kelpMat, KELP); kelp.frustumCulled = false; kelp.count = 0; group.add(kelp);
  // Fish: two real species, swimming loops in shoals.
  const FISH = 60, fishModels = {}, fishData = []; const loader = new GLTFLoader();
  for (const [key, scale] of [['fish-barramundi', 1.35], ['fish-snapper', 0.021]]) loader.load('/evermile/assets/models/' + key + '.glb?v=20261104-water2', g => {
    let mesh = null; g.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) return; g.scene.updateMatrixWorld(true);
    const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld); geo.scale(scale, scale, scale); const box = new THREE.Box3().setFromBufferAttribute(geo.attributes.position), c = box.getCenter(new THREE.Vector3()); geo.translate(-c.x, -c.y, -c.z);
    if (key === 'fish-barramundi') geo.rotateY(Math.PI);
    const mat = mesh.material.clone(); mat.envMapIntensity = 0.6;
    mat.onBeforeCompile = sh => { sh.uniforms.uTime = U.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat fp = float(gl_InstanceID) * 1.7; transformed.x += sin(uTime * 7.0 + fp + position.z * 6.0) * 0.06 * smoothstep(0.0, -0.3, position.z);'); };
    const inst = new THREE.InstancedMesh(geo, mat, FISH); inst.frustumCulled = false; inst.count = 0; fishModels[key] = inst; group.add(inst); }, undefined, () => {});
  // A wreck in the deep: a broken hull, the bow heeled over, ribs, a funnel and a snapped mast, with real boards and a wheel.
  const rust = new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.85, metalness: 0.35 }), dark = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.9 }), wood = new THREE.MeshStandardMaterial({ color: 0x4b3b2c, roughness: 0.92 });
  const wreck = new THREE.Group(); { const L = 26, W = 5.4, H = 3.2, box = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); wreck.add(o); };
    box(W, H, L * 0.55, rust, 0, H / 2, -L * 0.22); box(W * 0.9, H * 0.9, L * 0.36, rust, W * 0.4, H * 0.35, L * 0.3, 0.25, 0.2, 0.55);
    for (let k = 0; k < 7; k++) box(W * 1.02, 0.18, 0.18, dark, 0, H * 0.85, -L * 0.45 + k * L * 0.07); box(W * 0.6, 2.2, L * 0.18, dark, 0, H + 1.1, -L * 0.3);
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 3.6, 10), rust); funnel.position.set(0, H + 3, -L * 0.15); funnel.rotation.z = 0.35; wreck.add(funnel);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 9, 8), wood); mast.position.set(0.8, H + 2.5, L * 0.05); mast.rotation.set(1.1, 0, 0.5); wreck.add(mast);
    for (const key of ['wreck-boards', 'wreck-wheel']) loader.load('/evermile/assets/models/' + key + '.glb?v=20261104-water2', g => { const o = g.scene; if (key === 'wreck-wheel') { o.position.set(6, 0.05, 4); o.rotation.set(-Math.PI / 2 + 0.3, 0.6, 0); } else o.position.set(-7, 0.05, 6); wreck.add(o); }, undefined, () => {}); }
  wreck.visible = false; group.add(wreck); let wreckSpot = null;

  const levelAt = (x, z) => ((x - LAKE.x) / LAKE.rx) ** 2 + ((z - LAKE.z) / LAKE.rz) ** 2 < 1.5 ? LAKE.level : sea ? sea.waterLevel.value : SEA_LEVEL;
  // Lay out the bed around a point: kelp, shoals and (in deep water) the wreck.
  let seeded = null; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  function seed(x0, z0, level) {
    const spots = []; for (let i = 0; i < 400 && spots.length < KELP; i++) { const x = x0 + (Math.random() - 0.5) * 160, z = z0 + (Math.random() - 0.5) * 160, y = world.ground(x, z); if (y < level - 1.2) spots.push([x, y, z]); }
    kelp.count = spots.length; spots.forEach(([x, y, z], i) => { e.set(0, Math.random() * 6.28, 0); q.setFromEuler(e); m4.compose(p3.set(x, y, z), q, s3.set(1, clamp((level - y - 0.5) / 3.2, 0.2, 1.2) * (0.6 + Math.random() * 0.7), 1)); kelp.setMatrixAt(i, m4); });
    kelp.instanceMatrix.needsUpdate = true;
    fishData.length = 0; const shoals = []; for (let k = 0; k < 6 && spots.length; k++) { const [x, y, z] = spots[Math.floor(Math.random() * spots.length)]; shoals.push({ x, z, y: Math.min(level - 1.2, y + 1.2 + Math.random() * Math.max(0.5, level - y - 2.5)), r: 3 + Math.random() * 6, v: 0.3 + Math.random() * 0.5, cw: Math.random() < 0.5 ? 1 : -1, sp: k % 2 ? 'fish-snapper' : 'fish-barramundi' }); }
    for (let i = 0; i < FISH && shoals.length; i++) { const sh = shoals[i % shoals.length]; fishData.push({ sh, a: Math.random() * 6.28, r: sh.r * (0.5 + Math.random() * 0.6), dy: (Math.random() - 0.5) * 1.4, size: 0.7 + Math.random() * 0.6, w: Math.random() * 6.28 }); }
    const deep = spots.filter(p => p[1] < level - 6).sort((a, b) => a[1] - b[1])[0]; wreck.visible = !!deep;
    if (deep) { wreck.position.set(deep[0], deep[1] - 0.4, deep[2]); wreck.rotation.set(0.08, Math.random() * 6.28, -0.22); wreckSpot = { x: deep[0], y: deep[1] + 2, z: deep[2] }; } else wreckSpot = null;
    seeded = { x: x0, z: z0 };
  }
  const fog = new THREE.Color(), deepCol = new THREE.Color();
  let saved = null;
  return {
    // How deep the camera is below the water here (negative above it).
    depthAt(x, y, z) { const level = levelAt(x, z); return world.ground(x, z) < level ? level - y : -1; },
    get active() { return group.visible; },
    // Each frame, after the time of day has set the fog: if the camera is under, turn the world to water.
    update(dt, camera, car, env) {
      const c = camera.position, level = levelAt(c.x, c.z), under = world.ground(c.x, c.z) < level - 0.2 && c.y < level - 0.05;
      U.uTime.value += dt; bubbleU.time.value = U.uTime.value;
      // sunlight focused by the waves onto the bed, from above in the shallows and all around below
      CAUSTICS.uCausticT.value = U.uTime.value * 0.55; CAUSTICS.uWaterLevel.value = sea ? sea.waterLevel.value : SEA_LEVEL; CAUSTICS.uCausticK.value = (1 - (env?.night || 0)) * (1 - 0.6 * (env?.rain || 0)) * 6.0; bubbleU.surface.value = level; bubbleU.scale.value = innerHeight;
      // bubbles from the car whenever it is under, seen from above or below
      bubbleClock += dt; if (bubbleClock > 0.07) { bubbleClock = 0; const cy = car.groundY || 0, cl = levelAt(car.pos.x, car.pos.z);
        if (cl - cy > 1.3) { const fx = Math.sin(car.heading), fz = Math.cos(car.heading); bubble(car.pos.x - fx * car.len * 0.5, cy + 0.4, car.pos.z - fz * car.len * 0.5, 1.0); if (Math.random() < 0.5) bubble(car.pos.x, cy + 1.2, car.pos.z, 0.7); bubbles.visible = true; group.visible = true; }
        if (wreckSpot && Math.random() < 0.3) bubble(wreckSpot.x, wreckSpot.y, wreckSpot.z, 0.5); }
      if (!under) {
        if (saved) { saved = null; if (sky) sky.visible = true; }
        surface.visible = shafts[0].visible = motes.visible = kelp.visible = wreck.visible = dome.visible = false; for (const k in fishModels) fishModels[k].visible = false;
        group.visible = bubbles.visible = levelAt(car.pos.x, car.pos.z) - (car.groundY || 0) > 1.3; return 0;
      }
      group.visible = surface.visible = motes.visible = kelp.visible = bubbles.visible = dome.visible = true; for (const sh of shafts) sh.visible = true; for (const k in fishModels) fishModels[k].visible = true;
      if (!seeded || Math.hypot(c.x - seeded.x, c.z - seeded.z) > 70) seed(c.x, c.z, level);
      wreck.visible = !!wreckSpot;
      const depth = level - c.y, day = 1 - (env?.night || 0), murk = clamp(depth / 30, 0, 1);
      // the water's colour: green-blue in the shallows, deep blue lower down, nearly black at night
      deepCol.setRGB(0.03, 0.2, 0.24).lerp(fog.setRGB(0.01, 0.07, 0.14), murk).multiplyScalar(0.15 + 0.85 * day);
      if (!saved) { saved = true; if (sky) sky.visible = false; }
      scene.fog.color.copy(deepCol); scene.fog.density = 0.06 + 0.035 * murk; dome.position.copy(c); if (scene.background?.isColor) scene.background.copy(deepCol);
      U.uDeep.value.copy(deepCol); U.uSky.value.setRGB(0.55, 0.85, 0.9).multiplyScalar(0.2 + 0.8 * day); U.uSun.value = 0.3 + 0.7 * day;
      surface.position.set(Math.round(c.x / 20) * 20, level - 0.03, Math.round(c.z / 20) * 20);
      // light shafts around the camera, fading with depth and at night
      shaftMat.opacity = 0.16 * day * (1 - murk * 0.7); const t = U.uTime.value;
      for (const sh of shafts) { const u = sh.userData, a = u.a + t * 0.02; sh.position.set(c.x + Math.cos(a) * u.d, level, c.z + Math.sin(a) * u.d); sh.scale.set(u.w * (0.8 + 0.3 * Math.sin(t * 0.7 + u.ph)), Math.min(40, depth + 18), 1); sh.lookAt(c.x, level, c.z); sh.rotation.z = 0.18 * Math.sin(t * 0.3 + u.ph); }
      // motes ride along with the camera, wrapping round it
      motes.position.set(Math.floor(c.x / 40) * 40, c.y, Math.floor(c.z / 40) * 40); motes.material.opacity = 0.5 * (0.3 + 0.7 * day);
      // fish swim their loops
      const counts = {};
      for (const f of fishData) { const sh = f.sh, inst = fishModels[sh.sp]; if (!inst) continue; f.a += dt * sh.v * sh.cw / Math.max(f.r, 1) * 2.2;
        const x = sh.x + Math.cos(f.a) * f.r, z = sh.z + Math.sin(f.a) * f.r, y = sh.y + f.dy + Math.sin(t * 0.8 + f.w) * 0.3, hd = f.a + (sh.cw > 0 ? Math.PI / 2 : -Math.PI / 2);
        e.set(0, Math.atan2(-Math.sin(hd), Math.cos(hd)) + Math.PI / 2, 0); q.setFromEuler(e); m4.compose(p3.set(x, y, z), q, s3.setScalar(f.size)); const n = counts[sh.sp] = (counts[sh.sp] || 0); inst.setMatrixAt(n, m4); counts[sh.sp] = n + 1; }
      for (const k in fishModels) { fishModels[k].count = counts[k] || 0; fishModels[k].instanceMatrix.needsUpdate = true; }
      return depth;
    }
  };
}
