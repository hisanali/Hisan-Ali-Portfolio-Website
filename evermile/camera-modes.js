// The cinematic camera, split out of main.js: roadside tripod, low tracker ahead, side tracker, helicopter orbit
// and low rear quarter, cut together as you drive. The game hands in its camera and state through initCinematic.
import {clamp, damp} from './math.js?v=20260927-train1';
let g = null;
export function initCinematic(game) { g = game; }
// Cinematic: a roadside tripod the car sweeps past, a low tracking shot from ahead, a side tracker, a slow helicopter
// orbit and a low rear quarter, cut together as you drive.
const CINE_SHOTS = ['tripod', 'lowfront', 'side', 'heli', 'rearlow'];
export function cinematicCamera(dt, instant) {
  const r = g.world.road, yaw = g.state.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  let c = g.state.cine;
  if (!c || c.t > c.dur || (c.shot === 'tripod' && (g.state.z - c.z) * Math.sign(fz || 1) > 28)) {
    const previous = c?.shot, pick = CINE_SHOTS.filter((q) => q !== previous), shot = pick[Math.floor(Math.random() * pick.length)];
    c = g.state.cine = {shot, t: 0, dur: shot === 'tripod' ? 14 : shot === 'heli' ? 11 : 7, side: Math.random() < .5 ? -1 : 1, angle: Math.random() * Math.PI * 2, fov: 45};
    if (shot === 'tripod') { const zt = g.state.z + 38 + Math.abs(g.state.speed) * 2.2; c.z = zt; c.x = r.x(zt) + c.side * (r.half(zt) + 3.6 + Math.random() * 3); c.y = Math.max(g.world.surfaceHeight(c.x, zt), r.y(zt)) + 1.6 + Math.random() * 1.2; c.fov = 30; }
    instant = true;
  }
  c.t += dt;
  const car = g.tmp.set(g.state.x, g.state.y + .75, g.state.z);
  let fov = 45;
  if (c.shot === 'tripod') { g.cameraPos.set(c.x, c.y, c.z); const d = Math.hypot(g.state.x - c.x, g.state.z - c.z); fov = clamp(30 + 1400 / Math.max(d, 8), 30, 62); }
  else if (c.shot === 'lowfront') { g.cameraPos.set(g.state.x + fx * 9.5 + rx * 1.4 * c.side, g.state.y + .5, g.state.z + fz * 9.5 + rz * 1.4 * c.side); fov = 52; }
  else if (c.shot === 'side') { g.cameraPos.set(g.state.x + rx * 6.5 * c.side + fx * 1.5, g.state.y + 1.05, g.state.z + rz * 6.5 * c.side + fz * 1.5); fov = 40; }
  else if (c.shot === 'heli') { const a = c.angle + c.t * .22, radius = 17 + c.t * .4; g.cameraPos.set(g.state.x + Math.sin(a) * radius, g.state.y + 8 + c.t * .25, g.state.z + Math.cos(a) * radius); fov = 44; }
  else { g.cameraPos.set(g.state.x - fx * 4.6 - rx * 1.7 * c.side, g.state.y + .42, g.state.z - fz * 4.6 - rz * 1.7 * c.side); car.set(g.state.x + fx * 9, g.state.y + .9, g.state.z + fz * 9); fov = 58; }
  // Never under the ground, and inside a tunnel never through its walls.
  const floor = g.world.surfaceHeight(g.cameraPos.x, g.cameraPos.z, g.settings.location !== 'hills') + .35;
  if (g.cameraPos.y < floor) g.cameraPos.y = floor;
  if (c.shot === 'tripod') g.camera.position.copy(g.cameraPos); else g.camera.position.lerp(g.cameraPos, instant ? 1 : 1 - Math.exp(-12 * dt));
  if (g.state.shake > .001) { const k = g.state.shake * .12; g.camera.position.x += (Math.random() - .5) * k; g.camera.position.y += (Math.random() - .5) * k * .7; g.camera.position.z += (Math.random() - .5) * k; g.state.shake = damp(g.state.shake, 0, 7, dt); }
  g.lookTarget.lerp(car, instant ? 1 : 1 - Math.exp(-10 * dt)); g.camera.lookAt(g.lookTarget);
  g.camera.fov = instant ? fov : damp(g.camera.fov, fov, 3, dt); g.camera.updateProjectionMatrix();
  g.placeSun(fx, fz);
}
