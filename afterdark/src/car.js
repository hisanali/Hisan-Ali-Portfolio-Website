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
  const root = new THREE.Group(), tilt = new THREE.Group(); tilt.add(model); root.add(tilt); scene.add(root);
  const wheels = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].map(name => { const node = model.getObjectByName(name); return node && { node, base: node.quaternion.clone(), front: name[6] === 'f', up: Y.clone().applyQuaternion(node.parent.getWorldQuaternion(new THREE.Quaternion()).invert()) }; }).filter(Boolean);
  const wheelR = 0.358;

  // Contact shadow keeps the car planted on the road.
  const shTex = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const g = x.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(0.55, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return cv; })());
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(wid * 1.5, len * 1.28), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.025; shadow.renderOrder = 3; root.add(shadow);

  // Headlights: two real spot lights, volumetric cones and the pool they throw on the wet road.
  const front = len / 2 - 0.25, lights = [];
  for (const sx of [-0.68, 0.68]) { const s = new THREE.SpotLight(0xfff0dc, 260, 110, 0.5, 0.65, 1.7); s.position.set(sx, 0.66, front); s.target.position.set(sx * 1.6, -0.9, front + 30); tilt.add(s, s.target); lights.push(s);
    const g = new THREE.ConeGeometry(2.6, 22, 24, 1, true); g.translate(0, -11, 0); g.rotateX(-Math.PI / 2); const cone = new THREE.Mesh(g, beam(0xdde8ff, 0.05)); cone.position.set(sx, 0.64, front); cone.rotation.x = 0.045; cone.renderOrder = 6; tilt.add(cone); }
  const poolM = new THREE.MeshBasicMaterial({ map: city.pool, color: new THREE.Color(1.0, 0.94, 0.84), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 26), poolM); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.035, front + 12); pool.renderOrder = 4; root.add(pool);
  const tailM = new THREE.MeshBasicMaterial({ map: city.pool, color: new THREE.Color(1, 0.06, 0.03), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const tailPool = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5), tailM); tailPool.rotation.x = -Math.PI / 2; tailPool.position.set(0, 0.035, -len / 2 - 2.2); tailPool.renderOrder = 4; root.add(tailPool);

  const car = { root, tilt, model, paint, len, wid, pos: new THREE.Vector3(), vel: new THREE.Vector3(), heading: 0, speed: 0, steer: 0, yawRate: 0, slip: 0, accel: 0, spin: 0, onKerb: false, braking: false, bump: 0, impact: 0, cubeHide: [root] };
  const fwd = new THREE.Vector3(), left = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  car.place = (x, z, h) => { car.pos.set(x, 0, z); car.heading = h; car.vel.set(0, 0, 0); car.speed = 0; car.yawRate = 0; car.steer = 0; car.sync(0); };
  car.setPaint = hex => paint.color.set(hex);

  // ctrl: steer (+1 = left), throttle, brake, hand. Returns the strength of any wall impact this step.
  car.drive = (dt, ctrl) => {
    fwd.set(Math.sin(car.heading), 0, Math.cos(car.heading)); left.set(fwd.z, 0, -fwd.x);
    let vF = car.vel.dot(fwd), vL = car.vel.dot(left);
    car.steer += (ctrl.steer - car.steer) * Math.min(1, dt * (Math.abs(ctrl.steer) > Math.abs(car.steer) ? 5.5 : 9));
    const VMAX = 82; let a = 0;
    if (ctrl.throttle > 0) a += ctrl.throttle * Math.min(10.5, 13.5 * (1 - Math.pow(Math.max(0, vF) / VMAX, 1.6)) + 0.4);
    if (ctrl.brake > 0) a += vF > 0.6 ? -ctrl.brake * 15 : -ctrl.brake * 5 * Math.max(0, 1 + vF / 9);
    if (ctrl.hand) a -= Math.sign(vF) * Math.min(Math.abs(vF) / dt, 5);
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
    const p = car.pos, rx = clamp(Math.round(p.x / P), 0, ROADS - 1) * P, rz = clamp(Math.round(p.z / P), 0, ROADS - 1) * P;
    const dx = p.x - rx, dz = p.z - rz, ox = Math.abs(dx) - DRIVE, oz = Math.abs(dz) - DRIVE; let hit = 0;
    const inX = ox <= 0 && p.z > -DRIVE && p.z < SPAN + DRIVE, inZ = oz <= 0 && p.x > -DRIVE && p.x < SPAN + DRIVE;
    if (!inX && !inZ) {
      if (ox <= oz) { p.x = rx + Math.sign(dx) * DRIVE; const vn = car.vel.x * Math.sign(dx); if (vn > 0) { hit = vn; car.vel.x *= -0.28; } }
      else { p.z = rz + Math.sign(dz) * DRIVE; const vn = car.vel.z * Math.sign(dz); if (vn > 0) { hit = vn; car.vel.z *= -0.28; } }
    }
    p.x = clamp(p.x, -DRIVE, SPAN + DRIVE); p.z = clamp(p.z, -DRIVE, SPAN + DRIVE);
    if (hit > 0) car.vel.multiplyScalar(hit > 5 ? 0.72 : 0.97);
    const kerb = Math.min(Math.abs(dx), Math.abs(dz)) > HALF; if (kerb !== car.onKerb) { car.onKerb = kerb; car.bump = Math.min(1, Math.abs(vF) * 0.06); }
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
    M.tail.emissiveIntensity = car.braking ? 9 : 1.6; tailM.opacity = car.braking ? 0.5 : 0.1;
  };
  return car;
}
