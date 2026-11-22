// The player's coupé: model set-up with physically based paint, lights, and the driving model.
import * as THREE from '/evermile/vendor/three.module.js';
import { GLTFLoader } from '/evermile/vendor/loaders/GLTFLoader.js';
import { DRACOLoader } from '/evermile/vendor/loaders/DRACOLoader.js';
import { P, ROADS, HALF, SPAN, DRIVE } from './city.js';

export const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/evermile/vendor/draco/').setWorkerLimit(1));
export const loadGLB = url => new Promise((res, rej) => loader.load(url, res, undefined, rej));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);

function beam(color, strength) {
  return new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uStrength; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(uColor * pow(vUv.y, 2.0) * f * uStrength, 1.0); }' });
}

export async function createPlayer(scene, envTexture, city) {
  let nightK = 0;
  const gltf = await loadGLB('/evermile/assets/sports-coupe.glb');
  const model = gltf.scene; model.rotation.y = Math.PI; model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), c = box.getCenter(new THREE.Vector3());
  model.position.set(-c.x, -box.min.y, -c.z);
  const len = box.max.z - box.min.z, wid = box.max.x - box.min.x;
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
  model.traverse(o => { if (!o.isMesh) return; const n = o.name, mn = o.material?.name || '';
    o.material = n === 'body' ? paint : /glass/i.test(n) ? M.glass : n === 'lights_red' ? M.tail : n === 'leds' ? M.led : n === 'lights' ? M.lens : /^rim_|^wheel$|^nuts$|^centre$/.test(n) ? M.rim : n === 'chrome' || n === 'metal' ? M.chrome : n === 'tire' ? M.tyre
      : n === 'brakes' || n === 'brake' ? (n === 'brakes' ? M.caliper : M.rim) : /carbon/.test(n) ? M.carbon : /grills|wipers|plastic|trim$/.test(n) ? M.dark : /Leather|Carpet|Interior/i.test(mn) || /interior|leather|carpet|steering/.test(n) ? M.cabin : M.dark; });
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const root = new THREE.Group(), tilt = new THREE.Group(); tilt.add(model); root.add(tilt); scene.add(root);
  const wheels = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].map(name => { const node = model.getObjectByName(name); return node && { node, base: node.quaternion.clone(), front: name[6] === 'f', up: Y.clone().applyQuaternion(node.parent.getWorldQuaternion(new THREE.Quaternion()).invert()) }; }).filter(Boolean);
  const wheelR = 0.358;

  // Contact shadow keeps the car planted on the road.
  const shTex = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const g = x.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(0.55, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return cv; })());
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(wid * 1.5, len * 1.28), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.025; shadow.renderOrder = 3; root.add(shadow);

  // Headlights: two real spot lights, volumetric cones and the pool they throw on the wet road.
  const front = len / 2 - 0.25, lights = [], cones = [];
  for (const sx of [-0.68, 0.68]) { const s = new THREE.SpotLight(0xfff0dc, 260, 110, 0.5, 0.65, 1.7); s.position.set(sx, 0.66, front); s.target.position.set(sx * 1.6, -0.9, front + 30); tilt.add(s, s.target); lights.push(s);
    const g = new THREE.ConeGeometry(2.6, 22, 24, 1, true); g.translate(0, -11, 0); g.rotateX(-Math.PI / 2); const cone = new THREE.Mesh(g, beam(0xdde8ff, 0.05)); cone.position.set(sx, 0.64, front); cone.rotation.x = 0.045; cone.renderOrder = 6; tilt.add(cone); cones.push(cone); }
  const poolM = new THREE.MeshBasicMaterial({ map: city.pool, color: new THREE.Color(1.0, 0.94, 0.84), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 26), poolM); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.035, front + 12); pool.renderOrder = 4; root.add(pool);
  const tailM = new THREE.MeshBasicMaterial({ map: city.pool, color: new THREE.Color(1, 0.06, 0.03), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const tailPool = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5), tailM); tailPool.rotation.x = -Math.PI / 2; tailPool.position.set(0, 0.035, -len / 2 - 2.2); tailPool.renderOrder = 4; root.add(tailPool);

  const car = { pinDir: 1, slideT: 0, slideH: 0, root, tilt, model, paint, len, wid, pos: new THREE.Vector3(), vel: new THREE.Vector3(), heading: 0, speed: 0, steer: 0, yawRate: 0, slip: 0, accel: 0, spin: 0, onKerb: false, braking: false, bump: 0, impact: 0, cubeHide: [root] };
  const fwd = new THREE.Vector3(), left = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  const hw = wid / 2 - 0.14, hl = len / 2 - 0.06, CORNERS = [[hw, hl], [-hw, hl], [hw, -hl], [-hw, -hl]], KERB = HALF + 0.04, prevC = [null, null, null, null];
  car.place = (x, z, h) => { prevC.fill(null); car.slideT = 0; car.pos.set(x, 0, z); car.heading = h; car.vel.set(0, 0, 0); car.speed = 0; car.yawRate = 0; car.steer = 0; car.sync(0); };
  car.setPaint = hex => paint.color.set(hex);
  car.setInterior = on => { M.glass.opacity = on ? 0.14 : 0.82; };
  car.setTime = e => { nightK = e.night; for (const s of lights) s.intensity = 260 * e.night; for (const k of cones) k.visible = e.night > 0.3; pool.visible = e.night > 0.05; poolM.opacity = 0.55 * e.night; tailPool.visible = e.night > 0.05;
    M.lens.emissiveIntensity = 1.6 + 5.4 * e.night; M.led.emissiveIntensity = 2.5 + 3.5 * e.night; shadow.material.opacity = 0.55 + 0.45 * e.night; };

  // ctrl: steer (+1 = left), throttle, brake, hand. Returns the strength of any wall impact this step.
  car.drive = (dt, ctrl) => {
    fwd.set(Math.sin(car.heading), 0, Math.cos(car.heading)); left.set(fwd.z, 0, -fwd.x);
    let vF = car.vel.dot(fwd), vL = car.vel.dot(left);
    car.steer += (ctrl.steer - car.steer) * Math.min(1, dt * (Math.abs(ctrl.steer) > Math.abs(car.steer) ? 5.5 : 9));
    const VMAX = 82; let a = 0;
    if (ctrl.throttle > 0) a += ctrl.throttle * Math.min(10.5, 13.5 * (1 - Math.pow(Math.max(0, vF) / VMAX, 1.6)) + 0.4);
    if (ctrl.brake > 0) a += vF > 0.6 ? -ctrl.brake * (22 + Math.min(6, vF * 0.12)) : -ctrl.brake * 6 * Math.max(0, 1 + vF / 9);
    if (!ctrl.throttle && !ctrl.brake && Math.abs(vF) > 0.3) a -= Math.sign(vF) * Math.min(2.4, Math.abs(vF) / dt);
    if (ctrl.hand) a -= Math.sign(vF) * Math.min(Math.abs(vF) / dt, 9);
    a -= 0.00105 * vF * Math.abs(vF) + 0.035 * vF + (car.onKerb ? 0.25 * vF : 0);
    vF += a * dt; car.accel = a;
    const grip = car.onKerb ? 7.5 : 10.2;
    const lock = 0.56 / (1 + vF * vF / 420);
    let yaw = vF * Math.tan(car.steer * lock) / 2.65;
    const cap = (ctrl.hand ? grip * 1.9 : grip) / Math.max(5, Math.abs(vF)); yaw = clamp(yaw, -cap, cap);
    car.yawRate = lerp(car.yawRate, yaw, Math.min(1, dt * 7.5)); car.heading += car.yawRate * dt;
    // Sideways speed is scrubbed off by the tyres; the handbrake, or full power at low speed, lets the tail slide.
    const loose = ctrl.hand ? 1.2 : ctrl.throttle > 0.9 && Math.abs(car.steer) > 0.6 && vF < 26 ? 3.2 : 7.5;
    vL *= Math.exp(-loose * dt);
    car.vel.copy(fwd).multiplyScalar(vF).addScaledVector(left, vL);
    car.pos.addScaledVector(car.vel, dt);
    // Stay inside the street canyon: carriageway plus pavement, up to the building line.
    // Keep the whole body on the carriageway. Each corner is tested against the kerb line; a touching corner pushes
    // the car back and turns its nose along the kerb, so a glancing hit slides instead of sticking.
    const p = car.pos; let hit = 0;
    for (let pass = 0; pass < 2; pass++) { const sn = Math.sin(car.heading), cs = Math.cos(car.heading); let bx = 0, bz = 0, bm = 0, brx = 0, brz = 0;
      for (let ci = 0; ci < 4; ci++) { const lx = CORNERS[ci][0], lz = CORNERS[ci][1], ox0 = cs * lx + sn * lz, oz0 = -sn * lx + cs * lz, x = p.x + ox0, z = p.z + oz0;
        const rx = clamp(Math.round(x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(z / P), 0, ROADS - 1) * P, dx = x - rx, dz = z - rz, ox = Math.abs(dx) - KERB, oz = Math.abs(dz) - KERB; let px = 0, pz = 0;
        if (ox > 0 && oz > 0) { // which face did this corner come through? Decide from where it was a moment ago, so block corners are not snagged.
          const q = prevC[ci]; let useX = ox <= oz;
          if (q) { const oxp = Math.abs(q[0] - rx) - KERB, ozp = Math.abs(q[1] - rz) - KERB; if (oxp <= 0 && ozp > 0) useX = true; else if (ozp <= 0 && oxp > 0) useX = false; else if (oxp <= 0 && ozp <= 0) useX = Math.abs(car.vel.x) < Math.abs(car.vel.z); }
          if (useX) px = -Math.sign(dx) * ox; else pz = -Math.sign(dz) * oz; }
        if (x + px < -KERB) px = -KERB - x; else if (x + px > SPAN + KERB) px = SPAN + KERB - x;
        if (z + pz < -KERB) pz = -KERB - z; else if (z + pz > SPAN + KERB) pz = SPAN + KERB - z;
        const m = Math.abs(px) + Math.abs(pz); if (m > bm) { bm = m; bx = px; bz = pz; brx = ox0; brz = oz0; } }
      if (bm <= 0) break;
      p.x += bx; p.z += bz; const nl = Math.hypot(bx, bz), nx = bx / nl, nz = bz / nl, vn = car.vel.x * nx + car.vel.z * nz;
      if (vn < 0) { hit = Math.max(hit, -vn); car.vel.x -= nx * vn * 1.12; car.vel.z -= nz * vn * 1.12; car.vel.multiplyScalar(-vn > 6 ? 0.8 : 0.992); }
      // Turn the nose along the kerb, towards whichever way the car is already heading (or the wheel is turned),
      // so any contact becomes a slide along the kerb and the car can always drive away.
      const into = -(sn * nx + cs * nz); if (into > 0.02) { let tx = -nz, tz = nx; const along = sn * tx + cs * tz;
        let sgn = Math.abs(along) > 0.2 ? Math.sign(along) : 0;
        if (!sgn) { const d0 = Math.atan2(Math.sin(Math.atan2(tx, tz) - car.heading), Math.cos(Math.atan2(tx, tz) - car.heading)); sgn = ctrl.steer ? (Math.sign(d0) === Math.sign(ctrl.steer) ? 1 : -1) : car.pinDir; }
        car.pinDir = sgn; tx *= sgn; tz *= sgn; const want = Math.atan2(tx, tz), diff = Math.atan2(Math.sin(want - car.heading), Math.cos(want - car.heading)), rate = (1.1 + 2.6 * into) * (ctrl.throttle > 0 ? 1 : 0.45) * dt;
        car.heading += clamp(diff, -rate, rate); car.yawRate *= 0.5; if (into > 0.5) { car.slideT = 0.4; car.slideH = want; } } }
    // After a nose-on hit the car bounces clear for a moment; keep turning it along the kerb through that gap.
    if (car.slideT > 0) { car.slideT -= dt; const vv = Math.hypot(car.vel.x, car.vel.z); if (ctrl.throttle > 0 && vv < 7) { const d2 = Math.atan2(Math.sin(car.slideH - car.heading), Math.cos(car.slideH - car.heading)); car.heading += clamp(d2, -3.0 * dt, 3.0 * dt); } }
    { const sn = Math.sin(car.heading), cs = Math.cos(car.heading); for (let ci = 0; ci < 4; ci++) { const lx = CORNERS[ci][0], lz = CORNERS[ci][1]; (prevC[ci] ||= [0, 0])[0] = p.x + cs * lx + sn * lz; prevC[ci][1] = p.z - sn * lx + cs * lz; } }
    fwd.set(Math.sin(car.heading), 0, Math.cos(car.heading)); left.set(fwd.z, 0, -fwd.x);
    car.speed = car.vel.dot(fwd); car.slip = Math.abs(car.vel.dot(left)); car.braking = ctrl.brake > 0 || ctrl.hand;
    car.sync(dt); return hit;
  };
  car.sync = dt => {
    root.position.set(car.pos.x, car.onKerb ? 0.16 : 0, car.pos.z); root.rotation.y = car.heading;
    car.bump = Math.max(0, car.bump - dt * 4);
    const k = Math.min(1, dt * 7);
    tilt.rotation.z = lerp(tilt.rotation.z, clamp(-car.yawRate * car.speed * 0.0042, -0.075, 0.075), k);
    tilt.rotation.x = lerp(tilt.rotation.x, clamp(-car.accel * 0.0036, -0.045, 0.05), k);
    tilt.position.y = Math.sin(car.bump * Math.PI) * 0.07;
    car.spin -= car.speed * dt / wheelR;
    for (const w of wheels) { q1.setFromAxisAngle(w.up, w.front ? car.steer * 0.5 : 0); q2.setFromAxisAngle(X, car.spin); w.node.quaternion.copy(q1).multiply(w.base).multiply(q2); }
    M.tail.emissiveIntensity = car.braking ? 5 + 4 * nightK : 0.5 + 1.1 * nightK; tailM.opacity = (car.braking ? 0.5 : 0.1) * nightK;
  };
  return car;
}
