// The player's coupé: model set-up with physically based paint, lights, and the driving model.
import * as THREE from '/evermile/vendor/three.module.js';
import { GLTFLoader } from '/evermile/vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from '/evermile/vendor/loaders/DRACOLoader.js';
import { P, ROADS, HALF, SW, SPAN } from './city.js';

export const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/evermile/vendor/draco/').setWorkerLimit(1));
export const loadGLB = url => new Promise((res, rej) => loader.load(url, res, undefined, rej));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);

function beam(color, strength) {
  return new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uStrength; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(uColor * pow(vUv.y, 2.0) * f * uStrength, 1.0); }' });
}

export async function createPlayer(scene, envTexture, city, spec = {}) {
  let nightK = 0, wetK = 0; const T = { vmax: 82, acc: 1, grip: 1, brake: 1, off: 1, ...spec }, kitCar = !!spec.file, rigCar = !!spec.rig;
  const gltf = await loadGLB(kitCar ? `/evermile/assets/models/${spec.file}.glb?v=${rigCar ? '20260927a' : 'supplied7'}` : '/evermile/assets/sports-coupe.glb');
  const model = gltf.scene; if (!kitCar) model.rotation.y = Math.PI; model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), c = box.getCenter(new THREE.Vector3());
  model.position.set(-c.x, -box.min.y, -c.z);
  const len = box.max.z - box.min.z, wid = box.max.x - box.min.x, height = box.max.y - box.min.y;
  const frontHub = model.getObjectByName(kitCar ? 'Wheel_FL' : 'wheel_fl');
  const rearHub = model.getObjectByName(kitCar ? 'Wheel_RL' : 'wheel_rl');
  const axleSpacing = frontHub && rearHub
    ? Math.abs(frontHub.getWorldPosition(new THREE.Vector3()).z - rearHub.getWorldPosition(new THREE.Vector3()).z)
    : len * 0.61;
  const wheelbase = clamp(axleSpacing, 2.38, 3.4);
  const steeringWheel = model.getObjectByName('steering_wheel');
  const restSteering = steeringWheel?.quaternion.clone();
  const steeringAxis = new THREE.Vector3(0, 0, 1);
  const frontAngle = (steer, speed) => steer * 0.65 / (1 + (speed / 25) ** 2);
  const env = { envMap: envTexture, envMapIntensity: 1.7 };
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xb8bcc4, metalness: 0.72, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03, ...env, envMapIntensity: 2.4 });
  const M = {
    chrome: new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 1, roughness: 0.12, ...env }),
    rim: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.22, ...env }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0, roughness: 0.82, ...env, envMapIntensity: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x06080b, metalness: 0.6, roughness: 0.04, transparent: true, opacity: 0.82, ...env, envMapIntensity: 1.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.3, roughness: 0.55, ...env, envMapIntensity: 0.7 }),
    carbon: new THREE.MeshPhysicalMaterial({ color: 0x101114, metalness: 0.4, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, ...env }),
    tail: new THREE.MeshStandardMaterial({ color: 0x4a0508, emissive: 0xff1408, emissiveIntensity: 1.6, roughness: 0.25, ...env }),
    led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfeaff, emissiveIntensity: 6 }),
    lens: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3dc, emissiveIntensity: 7, roughness: 0.1 }),
    caliper: new THREE.MeshStandardMaterial({ color: 0xa30d12, metalness: 0.4, roughness: 0.4, ...env }),
    cabin: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.8, ...env, envMapIntensity: 0.3 })
  };
  // Detailed imported cars keep their own textured trim, cabin and lamps; only the paint, glass and tail lenses are ours.
  if (rigCar) model.traverse(o => { if (!o.isMesh) return; const mn = o.material?.name || ''; if (mn === 'BodyPaint') o.material = paint; else if (/^TailLens/.test(mn)) o.material = M.tail; else if (mn === 'EXT_Glass') o.material = M.glass; else { o.material.envMap = envTexture; o.material.envMapIntensity = 0.9; } });
  else if (kitCar) model.traverse(o => { if (!o.isMesh) return; const mn = o.material?.name || ''; o.material = /paint/i.test(mn) ? paint : /glass/i.test(mn) ? M.glass : /HeadLens/i.test(mn) ? M.lens : /TailLens/i.test(mn) ? M.tail : Object.assign(o.material.clone(), { envMap: envTexture, envMapIntensity: 0.8 }); });
  else model.traverse(o => { if (!o.isMesh) return; const n = o.name, mn = o.material?.name || '';
    o.material = n === 'body' ? paint : /glass/i.test(n) ? M.glass : n === 'lights_red' ? M.tail : n === 'leds' ? M.led : n === 'lights' ? M.lens : /^rim_|^wheel$|^nuts$|^centre$/.test(n) ? M.rim : n === 'chrome' || n === 'metal' ? M.chrome : n === 'tire' ? M.tyre
      : n === 'brakes' || n === 'brake' ? (n === 'brakes' ? M.caliper : M.rim) : /carbon/.test(n) ? M.carbon : /grills|wipers|plastic|trim$/.test(n) ? M.dark : /Leather|Carpet|Interior/i.test(mn) || /interior|leather|carpet|steering/.test(n) ? M.cabin : M.dark; });
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const root = new THREE.Group(), tilt = new THREE.Group(); tilt.add(model); root.add(tilt); scene.add(root);
  const wheels = (kitCar ? ['Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR'] : ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']).map(name => { const node = model.getObjectByName(name); return node && { node, base: node.quaternion.clone(), front: name[6].toLowerCase() === 'f', up: Y.clone().applyQuaternion(node.parent.getWorldQuaternion(new THREE.Quaternion()).invert()) }; }).filter(Boolean);
  let wheelR = kitCar ? 0.34 : 0.358; const rigs = [];
  if (rigCar) { wheels.length = 0; const found = [], calipers = []; model.traverse(o => { if (/^Wheel_[FR][LR]$/.test(o.name)) found.push(o); if (/^Caliper_[FR][LR]$/.test(o.name)) calipers.push(o); }); model.updateWorldMatrix(true, true);
    for (const w of found) { const b = new THREE.Box3(), tyres = []; w.traverse(o => { if (o.isMesh && /tire|tyre/i.test(o.name)) tyres.push(o); }); for (const t of tyres.length ? tyres : [w]) b.union(new THREE.Box3().setFromObject(t));
      const pivot = new THREE.Group(), rotor = new THREE.Group(); pivot.position.copy(model.worldToLocal(b.getCenter(new THREE.Vector3()))); model.add(pivot); pivot.updateWorldMatrix(true, false); pivot.add(rotor); rotor.attach(w); for (const k of calipers) if (k.name.slice(-2) === w.name.slice(-2)) pivot.attach(k);
      const sz = b.getSize(new THREE.Vector3()); wheelR = Math.max(sz.y, sz.z) / 2 || 0.36; rigs.push({ pivot, rotor, front: w.name[6] === 'F' }); } }

  // Contact shadow keeps the car planted on the road.
  const shTex = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const g = x.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(0.55, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return cv; })());
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(wid * 1.5, len * 1.28), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.025; shadow.renderOrder = 3; root.add(shadow);

  // Headlights: two real spot lights, volumetric cones and the pool they throw on the wet road.
  const front = len / 2 - 0.25, lights = [], cones = [];
  for (const sx of [-0.68, 0.68]) { const s = new THREE.SpotLight(0xfff0dc, 170, 110, 0.5, 0.65, 1.7); s.position.set(sx, 0.66, front); s.target.position.set(sx * 1.6, -0.9, front + 30); tilt.add(s, s.target); lights.push(s);
    const g = new THREE.ConeGeometry(2.6, 22, 24, 1, true); g.translate(0, -11, 0); g.rotateX(-Math.PI / 2); const cone = new THREE.Mesh(g, beam(0xdde8ff, 0.05)); cone.position.set(sx, 0.64, front); cone.rotation.x = 0.045; cone.renderOrder = 6; tilt.add(cone); cones.push(cone); }
  const poolM = new THREE.MeshBasicMaterial({ map: city.pool, color: new THREE.Color(1.0, 0.94, 0.84), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 26), poolM); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.035, front + 12); pool.renderOrder = 4; root.add(pool);
  const tailM = new THREE.MeshBasicMaterial({ map: city.pool, color: new THREE.Color(1, 0.06, 0.03), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const tailPool = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5), tailM); tailPool.rotation.x = -Math.PI / 2; tailPool.position.set(0, 0.035, -len / 2 - 2.2); tailPool.renderOrder = 4; root.add(tailPool);

  const car = { pinDir: 1, groundY: 0, onSand: false, slopeF: 0, slopeL: 0, vy: 0, air: false, rough: false, tunnel: false, root, tilt, model, paint, len, wid, pos: new THREE.Vector3(), vel: new THREE.Vector3(), heading: 0, speed: 0, steer: 0, yawRate: 0, slip: 0, accel: 0, spin: 0, onKerb: false, braking: false, reversing: false, bump: 0, impact: 0, cubeHide: [root] };
  let brakeToStop = false;
  const fwd = new THREE.Vector3(), left = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  const hw = wid / 2 - 0.14, hl = len / 2 - 0.06, CORNERS = [[hw, hl], [-hw, hl], [hw, -hl], [-hw, -hl]], KERB = HALF + SW - 0.06, SEA = -(HALF + 13.2) - 71, PROM = -(HALF + 13.2), prevC = [null, null, null, null];
  const grid = new Map(), boxGrid = new Map();
  const gridKey = (x, z) => x * 4096 + z;
  const addToCell = (map, x, z, shape) => {
    const key = gridKey(x, z);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(shape);
  };
  for (const shape of city.colliders) {
    if (shape.r != null) {
      addToCell(grid, Math.floor(shape.x / 16), Math.floor(shape.z / 16), shape);
    } else {
      const reach = Math.hypot(hw, hl);
      const dx = (shape.w * Math.abs(shape.ux) + shape.d * Math.abs(shape.uz)) / 2 + reach;
      const dz = (shape.w * Math.abs(shape.uz) + shape.d * Math.abs(shape.ux)) / 2 + reach;
      for (let ix = Math.floor((shape.x - dx) / 16); ix <= Math.floor((shape.x + dx) / 16); ix++) {
        for (let iz = Math.floor((shape.z - dz) / 16); iz <= Math.floor((shape.z + dz) / 16); iz++) addToCell(boxGrid, ix, iz, shape);
      }
    }
  }
  car.others = []; // moving things to keep clear of (people), set each frame
  const world = city.world, ginfo = { road: null, lat: 0 }, outside = (x, z) => x > SPAN + KERB || z < -KERB || z > SPAN + KERB;
  const groundAt = (x, z, info) => { if (outside(x, z)) return world.ground(x, z, info); if (info) { info.road = null; info.paved = false; } if (x < -HALF) return x > PROM ? 0.17 : 0.17 - Math.min(1, (PROM - x) / 92) ** 2 * 1.5; const dx = Math.abs(x - clamp(Math.round(x / P), 0, ROADS - 1) * P), dz = Math.abs(z - clamp(Math.round(z / P), 0, ROADS - 1) * P); return Math.min(dx, dz) > HALF ? 0.17 : 0; };
  car.place = (x, z, h) => { prevC.fill(null); brakeToStop = false; car.air = false; car.vy = 0; car.groundY = groundAt(x, z); car.slopeF = car.slopeL = 0; car.pos.set(x, 0, z); car.heading = h; car.vel.set(0, 0, 0); car.speed = 0; car.yawRate = 0; car.steer = 0; car.braking = car.reversing = false; car.accel = car.bump = car.slip = 0; tilt.rotation.set(0, 0, 0); car.sync(0); };
  car.setPaint = hex => paint.color.set(hex); car.spec = T; car.tune = s => Object.assign(T, s);
  car.setInterior = on => { M.glass.opacity = on ? 0.14 : 0.82; };
  car.setTime = e => { nightK = e.night; wetK = e.wet; paint.envMapIntensity = 2.4 - 1.65 * nightK; for (const s of lights) s.intensity = 360 * e.night; for (const k of cones) k.visible = e.night > 0.3; pool.visible = e.night > 0.05; poolM.opacity = 0.55 * e.night; tailPool.visible = e.night > 0.05;
    M.lens.emissiveIntensity = 1.6 + 5.4 * e.night; M.led.emissiveIntensity = 2.5 + 3.5 * e.night; shadow.material.opacity = 0.55 + 0.45 * e.night; };

  // ctrl: steer (+1 = left), throttle, brake, hand. Returns the strength of any wall impact this step.
  car.drive = (dt, ctrl) => {
    fwd.set(Math.sin(car.heading), 0, Math.cos(car.heading)); left.set(fwd.z, 0, -fwd.x);
    let vF = car.vel.dot(fwd), vL = car.vel.dot(left);
    const speed = Math.abs(vF);
    const steerRate = ctrl.steer === 0 || ctrl.steer * car.steer < 0 ? 15 : lerp(13, 7, clamp(speed / 41, 0, 1));
    car.steer = lerp(car.steer, ctrl.steer, 1 - Math.exp(-steerRate * dt));
    // A press that starts while moving forward remains a brake until the pedal is released.
    if (!ctrl.brake) brakeToStop = false;
    else if (vF > 0.12 || ctrl.stopOnly) brakeToStop = true;
    const serviceBrake = ctrl.brake > 0 && brakeToStop;
    if (!serviceBrake && ctrl.brake > 0 && !ctrl.throttle) car.reversing = true;
    else if (serviceBrake || ctrl.throttle || vF > -0.08) car.reversing = false;
    const VMAX = T.vmax; let a = 0;
    if (serviceBrake) {
      const decel = (11.3 - wetK * 2.45) * T.brake;
      a -= ctrl.brake * decel;
    } else if (ctrl.throttle > 0) {
      a += ctrl.throttle * T.acc * Math.min(10.5, 13.5 * (1 - Math.pow(Math.max(0, vF) / VMAX, 1.6)) + 0.4);
    } else if (ctrl.brake > 0) {
      a -= ctrl.brake * 5.6 * Math.max(0, 1 + vF / 6.5);
    }
    if (!ctrl.throttle && !ctrl.brake && Math.abs(vF) > 0.3) a -= Math.sign(vF) * Math.min(2.4, Math.abs(vF) / dt);
    if (ctrl.hand) a -= Math.sign(vF) * Math.min(Math.abs(vF) / dt, 9);
    a -= 0.00105 * vF * Math.abs(vF) + 0.035 * vF + (car.onSand ? 0.55 * vF : 0);
    const wild = outside(car.pos.x, car.pos.z); let sF = 0, sL = 0;
    if (wild) { const px = car.pos.x, pz = car.pos.z; sF = (groundAt(px + fwd.x * 1.6, pz + fwd.z * 1.6) - groundAt(px - fwd.x * 1.6, pz - fwd.z * 1.6)) / 3.2; sL = (groundAt(px + left.x * 0.9, pz + left.z * 0.9) - groundAt(px - left.x * 0.9, pz - left.z * 0.9)) / 1.8;
      sF = clamp(sF, -1.5, 1.5); sL = clamp(sL, -1.5, 1.5); if (!car.air) { a -= 9.81 * sF / Math.sqrt(1 + sF * sF); if (Math.abs(sL) > 0.18) vL -= 9.81 * (sL - Math.sign(sL) * 0.18) * dt * 0.8; if (car.rough) a -= 0.32 * T.off * vF; } }
    car.slopeF += (sF - car.slopeF) * Math.min(1, dt * 9); car.slopeL += (sL - car.slopeL) * Math.min(1, dt * 9);
    if (car.air) a = -0.0009 * vF * Math.abs(vF);
    const nextSpeed = vF + a * dt;
    const stopped = serviceBrake && !car.air && nextSpeed <= 0;
    car.accel = stopped ? Math.min(0, -vF / dt) : a;
    vF = stopped ? 0 : nextSpeed;
    if (stopped) vL *= Math.exp(-dt * 17);
    const onDirt = car.onSand || car.rough;
    const grip = (onDirt ? (T.off < 1 ? 8.2 : 6.5) : 11.3 - wetK * 1.6) * T.grip;
    const yaw = vF * Math.tan(frontAngle(car.steer, vF)) / wheelbase;
    const cap = (ctrl.hand ? grip * 1.56 : grip) / Math.max(2.8, Math.abs(vF));
    const targetYaw = car.air ? car.yawRate * 0.98 : clamp(yaw, -cap, cap);
    const yawResponse = lerp(15, 8.5, clamp(speed / 39, 0, 1));
    car.yawRate = lerp(car.yawRate, targetYaw, 1 - Math.exp(-yawResponse * dt));
    const turn = car.yawRate * dt;
    const wheelTracking = car.air ? 0 : ctrl.hand ? 0.12 : lerp(0.83, 0.44, clamp(speed / 32, 0, 1));
    const travel = car.heading + turn * wheelTracking;
    fwd.set(Math.sin(travel), 0, Math.cos(travel));
    left.set(fwd.z, 0, -fwd.x);
    car.heading += turn;
    // The tires track the steering on normal throttle, while the handbrake can still loosen the rear.
    const lateralDamping = car.air ? 0 : ctrl.hand ? 1.35 : onDirt ? 5 : 10.8 - wetK * 2.1;
    vL *= Math.exp(-lateralDamping * dt);
    car.vel.copy(fwd).multiplyScalar(vF).addScaledVector(left, vL);
    const ox0 = car.pos.x, oz0 = car.pos.z;
    car.pos.addScaledVector(car.vel, dt);
    // Stay inside the street canyon: carriageway plus pavement, up to the building line.
    // Keep the whole body on the carriageway. Each corner is tested against the kerb line; a touching corner pushes
    // the car back and turns its nose along the kerb, so a glancing hit slides instead of sticking.
    const p = car.pos; let hit = 0;
    for (let pass = 0; pass < 2; pass++) { const sn = Math.sin(car.heading), cs = Math.cos(car.heading); let bx = 0, bz = 0, bm = 0;
      for (let ci = 0; ci < 4; ci++) { const lx = CORNERS[ci][0], lz = CORNERS[ci][1], ox0 = cs * lx + sn * lz, oz0 = -sn * lx + cs * lz, x = p.x + ox0, z = p.z + oz0;
        const rx = clamp(Math.round(x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(z / P), 0, ROADS - 1) * P, dx = x - rx, dz = z - rz, ox = Math.abs(dx) - KERB, oz = Math.abs(dz) - KERB; let px = 0, pz = 0;
        if (outside(x, z)) { /* open country: no kerbs */ }
        else if (x < 0) { if (x < SEA) px = SEA - x; } // the seafront is open down to the water
        else if (ox > 0 && oz > 0) { // which face did this corner come through? Decide from where it was a moment ago, so block corners are not snagged.
          const q = prevC[ci]; let useX = ox <= oz;
          if (q) { const oxp = Math.abs(q[0] - rx) - KERB, ozp = Math.abs(q[1] - rz) - KERB; if (oxp <= 0 && ozp > 0) useX = true; else if (ozp <= 0 && oxp > 0) useX = false; else if (oxp <= 0 && ozp <= 0) useX = Math.abs(car.vel.x) < Math.abs(car.vel.z); }
          if (useX) px = -Math.sign(dx) * ox; else pz = -Math.sign(dz) * oz; }
        const m = Math.abs(px) + Math.abs(pz); if (m > bm) { bm = m; bx = px; bz = pz; } }
      if (bm <= 0) break;
      p.x += bx; p.z += bz; const nl = Math.hypot(bx, bz), nx = bx / nl, nz = bz / nl, vn = car.vel.x * nx + car.vel.z * nz;
      if (vn < 0) { hit = Math.max(hit, -vn); car.vel.x -= nx * vn * 1.12; car.vel.z -= nz * vn * 1.12; car.vel.multiplyScalar(-vn > 6 ? 0.8 : 0.992); }
      const into = -(sn * nx + cs * nz);
      const tx = -nz, tz = nx, along = sn * tx + cs * tz;
      // Only a glancing hit or active steering can guide the nose along the wall.
      if (into > 0.08 && (Math.abs(along) > 0.28 || Math.abs(ctrl.steer) > 0.10)) {
        const tangent = Math.atan2(tx, tz);
        const side = Math.abs(along) > 0.28 ? Math.sign(along)
          : Math.sign(Math.sin(tangent - car.heading)) === Math.sign(ctrl.steer) ? 1 : -1;
        const want = Math.atan2(tx * side, tz * side);
        const steerAway = Math.atan2(Math.sin(want - car.heading), Math.cos(want - car.heading));
        car.heading += clamp(steerAway, -1.1 * dt, 1.1 * dt);
        car.yawRate *= 0.75;
      }
    }
    { const sn = Math.sin(car.heading), cs = Math.cos(car.heading), gx = Math.floor(p.x / 16), gz = Math.floor(p.z / 16);
      const separate = (nx, nz, depth, soft) => {
        p.x += nx * depth;
        p.z += nz * depth;
        const vn = car.vel.x * nx + car.vel.z * nz;
        if (vn < 0) {
          if (!soft) hit = Math.max(hit, -vn);
          car.vel.x -= nx * vn * 1.1;
          car.vel.z -= nz * vn * 1.1;
          if (-vn > 6) car.vel.multiplyScalar(0.8);
        }
      };
      // Four separating axes for the car and the actual rectangular footprint of the obstacle.
      const pushOffBox = o => {
        let least = Infinity, nx = 0, nz = 0;
        for (const [x, z] of [[cs, -sn], [sn, cs], [o.ux, o.uz], [-o.uz, o.ux]]) {
          const center = (p.x - o.x) * x + (p.z - o.z) * z;
          const carSize = hw * Math.abs(cs * x - sn * z) + hl * Math.abs(sn * x + cs * z);
          const propSize = o.w / 2 * Math.abs(o.ux * x + o.uz * z) + o.d / 2 * Math.abs(-o.uz * x + o.ux * z);
          const depth = carSize + propSize - Math.abs(center);
          if (depth <= 0) return;
          if (depth < least) { least = depth; const side = center < 0 ? -1 : 1; nx = x * side; nz = z * side; }
        }
        separate(nx, nz, least, false);
      };
      const boxes = boxGrid.get(gridKey(gx, gz));
      if (boxes) for (const shape of boxes) pushOffBox(shape);
      const pushOff = (o, soft) => { if (o.top != null && (car.groundY > o.top || car.groundY + height < o.bottom)) return; const rx = o.x - p.x, rz = o.z - p.z, lx = cs * rx - sn * rz, lz = sn * rx + cs * rz, qx = clamp(lx, -hw, hw), qz = clamp(lz, -hl, hl); let ex = lx - qx, ez = lz - qz, d = Math.hypot(ex, ez); if (d >= o.r) return;
        if (d < 1e-4) { const mx = hw - Math.abs(lx), mz = hl - Math.abs(lz); if (mx < mz) { ex = Math.sign(lx) || 1; ez = 0; d = -mx; } else { ex = 0; ez = Math.sign(lz) || 1; d = -mz; } } else { ex /= d; ez /= d; }
        const pen = o.r - d, nx = -(cs * ex + sn * ez), nz = -(-sn * ex + cs * ez); separate(nx, nz, pen, soft);
        // Ease the car away from a pole when the contact or steering gives it a direction.
        if (!o.kind && Math.abs(ez) > 0.5 && (Math.abs(lx) > 0.23 || Math.abs(ctrl.steer) > 0.1) && (ctrl.throttle > 0 || ctrl.brake > 0)) { let side = Math.abs(lx) > 0.08 ? -Math.sign(lx) : (ctrl.steer || car.pinDir);
          if (car.onKerb && p.x >= 0) { const rx0 = clamp(Math.round(p.x / P), 0, ROADS - 1) * P, rz0 = clamp(Math.round(p.z / P), 0, ROADS - 1) * P, tx0 = Math.abs(p.x - rx0) < Math.abs(p.z - rz0) ? Math.sign(rx0 - p.x) : 0, tz0 = tx0 ? 0 : Math.sign(rz0 - p.z), toRoad = cs * tx0 - sn * tz0; if (Math.abs(toRoad) > 0.3) side = Math.sign(toRoad); } // on a pavement, always work back towards the road
          const k = Math.min(0.12, 0.04 + pen); car.pinDir = side; p.x += cs * side * k; p.z -= sn * side * k; car.heading += side * (ez > 0 ? 1 : -1) * 1.4 * dt; } };
      for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iz = gz - 1; iz <= gz + 1; iz++) { const cell = grid.get(gridKey(ix, iz)); if (cell) for (const o of cell) pushOff(o, false); }
      for (const o of car.others) pushOff(o, true); }
    { let gy = groundAt(p.x, p.z, ginfo); const rd = ginfo.road;
      if (rd) { const lim = 6 - hw - 0.15; for (const [flag, sg] of [['wallL', 1], ['wallR', -1]]) { const over = ginfo.lat * sg - lim; if (rd[flag] && over > 0 && over < 5) { p.x -= rd.lx * sg * over; p.z -= rd.lz * sg * over; const vn = (car.vel.x * rd.lx + car.vel.z * rd.lz) * sg; if (vn > 0) { hit = Math.max(hit, vn); car.vel.x -= rd.lx * sg * vn * 1.15; car.vel.z -= rd.lz * sg * vn * 1.15; }
            const al = Math.sin(car.heading) * rd.tx + Math.cos(car.heading) * rd.tz, want = Math.atan2(rd.tx * Math.sign(al || 1), rd.tz * Math.sign(al || 1)), df = Math.atan2(Math.sin(want - car.heading), Math.cos(want - car.heading)); car.heading += clamp(df, -2.2 * dt, 2.2 * dt); gy = groundAt(p.x, p.z, ginfo); } } }
      if (outside(p.x, p.z) && world.terrain(p.x, p.z) < -1.25 && !(ginfo.road && ginfo.road.bridge)) { p.x = ox0; p.z = oz0; car.vel.multiplyScalar(-0.25); gy = groundAt(p.x, p.z, ginfo); } // the sea
      car.rough = outside(p.x, p.z) && !ginfo.paved && !(ginfo.road && Math.abs(ginfo.lat) < 7.5); car.tunnel = !!(ginfo.road && ginfo.road.tunnel);
      const kerb = !outside(p.x, p.z) && gy > 0.08; if (kerb !== car.onKerb) { car.onKerb = kerb; car.bump = Math.min(1, Math.abs(car.speed) * 0.06); }
      // A rise too sharp to drive up is a wall: stop against it rather than popping to the top.
      if (!car.air && outside(p.x, p.z) && gy - car.groundY > 0.55 + Math.hypot(p.x - ox0, p.z - oz0) * 1.6) { const mx = p.x - ox0, mz = p.z - oz0, ml = Math.hypot(mx, mz) || 1; hit = Math.max(hit, Math.hypot(car.vel.x, car.vel.z) * 0.6); p.x = ox0; p.z = oz0; const vn = (car.vel.x * mx + car.vel.z * mz) / ml; car.vel.x -= mx / ml * vn * 1.3; car.vel.z -= mz / ml * vn * 1.3; gy = groundAt(p.x, p.z, ginfo); }
      // Leaving the ground over a crest: fall under gravity until the wheels meet the road again.
      if (car.air) { car.vy -= 9.81 * dt; car.groundY += car.vy * dt; if (car.groundY <= gy) { car.air = false; car.bump = Math.min(1, -car.vy * 0.18); if (car.vy < -7) hit = Math.max(hit, -car.vy * 0.6); car.groundY = gy; car.vy = 0; } }
      else { const fall = car.groundY + car.vy * dt - 4.9 * dt * dt; if (outside(p.x, p.z) && fall - gy > 0.3 && Math.hypot(car.vel.x, car.vel.z) > 9) { car.air = true; car.groundY = fall; car.vy -= 9.81 * dt; } else { const vy = (gy - car.groundY) / Math.max(dt, 1e-4); car.vy += (clamp(vy, -40, 40) - car.vy) * Math.min(1, dt * 30); car.groundY = gy; } }
      car.onSand = !outside(p.x, p.z) && p.x < PROM; }
    { const sn = Math.sin(car.heading), cs = Math.cos(car.heading); for (let ci = 0; ci < 4; ci++) { const lx = CORNERS[ci][0], lz = CORNERS[ci][1]; (prevC[ci] ||= [0, 0])[0] = p.x + cs * lx + sn * lz; prevC[ci][1] = p.z - sn * lx + cs * lz; } }
    fwd.set(Math.sin(car.heading), 0, Math.cos(car.heading)); left.set(fwd.z, 0, -fwd.x);
    car.speed = car.vel.dot(fwd); car.slip = Math.abs(car.vel.dot(left)); car.braking = serviceBrake || ctrl.hand;
    car.sync(dt); return hit;
  };
  car.sync = dt => {
    root.position.set(car.pos.x, car.groundY, car.pos.z); root.rotation.set(-Math.atan(car.slopeF), car.heading, Math.atan(car.slopeL), 'YXZ');
    car.bump = Math.max(0, car.bump - dt * 4);
    const k = 1 - Math.exp(-dt * 8);
    // Load moves to the outside wheels. Keep the body's movement small over the four contact patches.
    tilt.rotation.z = lerp(tilt.rotation.z, clamp(car.yawRate * car.speed * 0.0025, -0.032, 0.032), k);
    tilt.rotation.x = lerp(tilt.rotation.x, clamp(-car.accel * 0.0018, -0.020, 0.028), k);
    tilt.position.y = Math.sin(car.bump * Math.PI) * 0.045;
    const steerAngle = frontAngle(car.steer, car.speed);
    if (steeringWheel) {
      q1.setFromAxisAngle(steeringAxis, -2.35 * steerAngle);
      steeringWheel.quaternion.copy(restSteering).multiply(q1);
    }
    car.spin -= car.speed * dt / wheelR;
    for (const w of wheels) { q1.setFromAxisAngle(w.up, w.front ? steerAngle : 0); q2.setFromAxisAngle(X, kitCar ? -car.spin : car.spin); w.node.quaternion.copy(q1).multiply(w.base).multiply(q2); }
    for (const r of rigs) { if (r.front) r.pivot.rotation.y = steerAngle; r.rotor.rotation.x = -car.spin % (Math.PI * 2); }
    M.tail.emissiveIntensity = car.braking ? 5 + 4 * nightK : 0.5 + 1.1 * nightK; tailM.opacity = (car.braking ? 0.5 : 0.1) * nightK;
  };
  return car;
}
