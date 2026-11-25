// Police pursuit. Knock down a pedestrian or ram another car and a Port Aurora patrol car responds, lights and siren on.
// It comes up from well behind, out of sight, along the ground you have driven (only where a car can go, never through
// your jumps, spins or doubling back), at its own car's pace: its top speed, acceleration and cornering grip, slower
// off the road. A fast car can outrun it. Stop with it behind you and you are pulled over and fined; get clear away and
// it gives up.
import * as THREE from '/evermile/vendor/three.module.js';
import { createEmergencyLights } from './emergency-lights.js';
import { vehicleShadowMaterial } from './vehicle-shadow.js';

const STEP = 1.5, KEEP = 900, clamp = THREE.MathUtils.clamp;
// Each patrol car's own performance: top speed (m/s), acceleration (m/s²) and cornering grip (m/s²).
const PERF = { 'police-interceptor': { vmax: 58, accel: 5.0, grip: 8.2 }, 'police-gt500': { vmax: 78, accel: 7.0, grip: 9.4 } };

export function createPursuit(scene, kits) {
  const trail = [], police = kits.filter(k => /^police-/.test(k.style)), built = new Map(), spinM = new THREE.Matrix4(), steerM = new THREE.Matrix4();
  // One drawable car per police model, made from the traffic kit's parts and kept for reuse.
  function build(kit) {
    if (built.has(kit)) return built.get(kit);
    const root = new THREE.Group(), body = new THREE.Group(), wheels = []; root.add(body);
    for (const part of kit.parts) { const m = new THREE.Mesh(part.geo, part.mat); m.matrixAutoUpdate = false; m.matrix.copy(part.local); m.castShadow = part.castShadow !== false; m.receiveShadow = true;
      if (part.wheel) { wheels.push({ m, part }); root.add(m); } else body.add(m); }
    const lights = createEmergencyLights(kit.emergency, kit.height, 5); body.add(lights.group);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.32).rotateX(-Math.PI / 2).translate(0, 0.028, 0), vehicleShadowMaterial()); blob.scale.set(kit.width, 1, kit.len); blob.renderOrder = 3; root.add(blob);
    root.visible = false; scene.add(root);
    const car = { kit, root, body, wheels, lights }; built.set(kit, car); return car;
  }
  let car = null, perf = PERF['police-interceptor'], lostT = 0, accel = 0, i = 0, v = 0, h = 0, spin = 0, t = 0, caught = 0, phase = 'off', endT = 0, levels = [0, 0], pending = false, wheel = 0;
  const at = k => { const a = trail[Math.max(0, Math.min(trail.length - 1, Math.floor(k)))], b = trail[Math.max(0, Math.min(trail.length - 1, Math.floor(k) + 1))], u = k - Math.floor(k);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u }; };
  const heading = k => { const a = at(k - 3), b = at(k + 3); return Math.atan2(b.x - a.x, b.z - a.z); };
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  function hide() { if (car) { car.root.visible = false; car.lights.update(0, 0, false); } car = null; phase = 'off'; pending = false; levels = [0, 0]; }
  function spawn() {
    // a patrol car already on the road 120-180 m behind, out of sight, coming on at speed
    const back = Math.min(trail.length - 1, 120); if (back < 80 || !police.length) { pending = true; return false; }
    const kit = police[Math.floor(Math.random() * police.length)]; car = build(kit); perf = PERF[kit.style] || PERF['police-interceptor'];
    i = trail.length - 1 - back; v = 22; h = heading(i); t = 0; caught = 0; lostT = 0; phase = 'chase'; pending = false;
    { const q = at(i); car.root.position.set(q.x, q.y, q.z); car.root.rotation.set(0, h, 0); }
    car.root.visible = true; return true;
  }
  return {
    get active() { return phase === 'chase'; },
    get levels() { return phase === 'off' ? [0, 0] : levels; },
    get car() { return car; },
    // Called every frame while driving: lays the trail of road behind the player.
    record(player) {
      const p = player.pos, last = trail[trail.length - 1];
      if (last && Math.hypot(p.x - last.x, p.z - last.z) > 25 && !player.air) { trail.length = 0; if (phase !== 'off') hide(); } // respawned or teleported
      if (player.air) return; // a jump is not a road: the next point on the ground joins straight on
      if (!last || Math.hypot(p.x - last.x, p.z - last.z) >= STEP) {
        // Spins, donuts and doubling back: if this point is back near ground already covered, cut the loop out, so the
        // police drive the road, not the antics.
        for (let k = Math.max(0, trail.length - 60); k < trail.length - 6; k++) if (Math.hypot(trail[k].x - p.x, trail[k].z - p.z) < 5) { trail.length = k + 1; i = Math.min(i, Math.max(0, k - 1)); break; }
        trail.push({ x: p.x, y: player.surfaceY ? player.surfaceY(p.x, p.z) : player.groundY || 0, z: p.z, off: !!player.rough });
        if (trail.length > KEEP) { trail.shift(); i = Math.max(0, i - 1); }
      }
    },
    // An offence: start a chase (or keep the current one going).
    report() { if (phase === 'chase') { t = Math.min(t, 20); return 'again'; } if (phase === 'leave') hide(); return spawn() ? 'chase' : 'soon'; },
    end() { hide(); },
    // Returns 'caught' or 'lost' on the frame a chase ends.
    update(dt, player, night = 0) {
      if (pending && spawn() === false) return null;
      if (!car) return null;
      t += dt; endT += dt;
      const n = trail.length, end = Math.max(0, n - 1 - 4), gap = Math.max(0, (end - i) * STEP), pv = Math.abs(player.speed);
      let event = null;
      if (phase === 'chase') {
        // its own pace: flat out when behind, matching speed once on the bumper, slowed by bends and rough ground
        const look = Math.min(end, i + 12), curv = Math.abs(wrap(heading(look) - heading(i))) / Math.max(3, (look - i) * STEP);
        let want = gap > 30 ? perf.vmax : clamp(pv + (gap - 6) * 0.5, 0, perf.vmax);
        want = Math.min(want, Math.sqrt(perf.grip / Math.max(curv, 1e-4)), trail[Math.floor(i)]?.off ? 24 : Infinity);
        const dv = clamp(want - v, -9.5 * dt, perf.accel * Math.max(0.35, 1 - v / perf.vmax) * dt); v += dv; accel = dt > 0 ? dv / dt : 0;
        if (gap < 7 && pv < 1.5) caught += dt; else caught = Math.max(0, caught - dt);
        if (caught > 2.4) { phase = 'leave'; endT = 0; event = 'caught'; }
        lostT = gap > 150 ? lostT + dt : 0;
        if (gap > 320 || lostT > 20 || (t > 110 && gap > 90)) { phase = 'leave'; endT = 0; event = 'lost'; }
      } else { accel = v > 0 ? -9 : 0; v = Math.max(0, v - 9 * dt); if (endT > 30 || (endT > 4 && Math.hypot(player.pos.x - car.root.position.x, player.pos.z - car.root.position.z) > 140)) { hide(); return event; } }
      i = Math.min(end, i + v * dt / STEP);
      // never sit inside the player's car
      const p = at(i); if (Math.hypot(p.x - player.pos.x, p.z - player.pos.z) < (car.kit.len + player.len) * 0.5 + 0.8 && i > 1) { i -= 0.5; v = Math.min(v, pv); }
      const q = at(i), nh = heading(i), turn = wrap(nh - h); h += turn * Math.min(1, dt * 4);
      const ahead = at(i + 2), behind = at(i - 2), pitch = Math.atan2(ahead.y - behind.y, 6);
      car.root.position.set(q.x, q.y, q.z); car.root.rotation.set(-pitch, h, 0, 'YXZ');
      car.body.rotation.set(clamp(-accel * 0.006, -0.04, 0.04), 0, clamp(turn * v * 0.02, -0.05, 0.05)); // squat, dive and roll
      spin += v * dt / 0.36; wheel += (clamp(turn * 3, -0.5, 0.5) - wheel) * Math.min(1, dt * 5);
      spinM.makeRotationX(spin); steerM.makeRotationY(wheel);
      for (const { m, part } of car.wheels) { m.matrix.copy(part.local); if (part.frontWheel) m.matrix.multiply(steerM); m.matrix.multiply(spinM); }
      const lit = phase === 'chase' || endT < 4; levels = car.lights.update(t, night, lit); if (!lit) levels = [0, 0];
      return event;
    },
    // the pursuing car's siren, relative to the player (the camera rides with the player)
    siren(player) { if (phase !== 'chase' || !car) return null; const vx = Math.sin(h) * v - Math.sin(player.heading) * player.speed, vz = Math.cos(h) * v - Math.cos(player.heading) * player.speed;
      return { x: car.root.position.x, z: car.root.position.z, vx, vz, gain: 0.9 }; },
    get pose() { return car && { x: car.root.position.x, y: car.root.position.y, z: car.root.position.z, h, height: car.kit.height }; }
  };
}
