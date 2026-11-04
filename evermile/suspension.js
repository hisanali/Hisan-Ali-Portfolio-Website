// Body-on-springs: pitch, roll and heave of the sprung body over the wheels, driven by the ground under each
// corner, weight transfer under braking, power and cornering, and kerb bumps that the body only follows after a
// lag. A damped spring per axis; the wheels keep ground contact within their travel. Pure, tested in node.
export const SUSPENSION = {
 coupe: {k: 95, c: 14, travel: .09, dive: .0046, roll: .0045, rate: 1},
 grcorolla: {k: 110, c: 15, travel: .1, dive: .0044, roll: .0042, rate: 1},
 landcruiser: {k: 48, c: 9, travel: .17, dive: .0058, roll: .0075, rate: 1},
 mercedes: {k: 62, c: 10, travel: .12, dive: .0054, roll: .006, rate: 1},
 coach: {k: 32, c: 7.5, travel: .14, dive: .0032, roll: .009, rate: 1},
 bike: {k: 120, c: 16, travel: .08, dive: .005, roll: 0, rate: 1},
};
export function tune(vehicle) { return SUSPENSION[vehicle] || SUSPENSION.coupe; }

export function createSuspension() { return {pitch: 0, roll: 0, heave: 0, pv: 0, rv: 0, hv: 0}; }

// One step. Targets are the rest attitude from the terrain and weight transfer (radians, metres); `bump` is how
// much the ground under the car rose this step (the body lags behind a rise, then settles).
export function stepSuspension(s, {vehicle = 'coupe', pitchTarget = 0, rollTarget = 0, heaveTarget = 0, bump = 0, dt = 1 / 120}) {
 const t = tune(vehicle), k = t.k, c = t.c;
 if (bump) { s.heave -= bump; }
 const h = Math.min(dt, 1 / 60);
 const spring = (x, v, target, kk, cc) => { const a = kk * (target - x) - cc * v; v += a * h; x += v * h; return [x, v]; };
 [s.pitch, s.pv] = spring(s.pitch, s.pv, pitchTarget, k, c);
 [s.roll, s.rv] = spring(s.roll, s.rv, rollTarget, k * 1.15, c * 1.1);
 [s.heave, s.hv] = spring(s.heave, s.hv, heaveTarget, k * .9, c);
 const lim = t.travel * 1.6; s.heave = Math.max(-lim, Math.min(lim, s.heave));
 s.pitch = Math.max(-.25, Math.min(.25, s.pitch)); s.roll = Math.max(-.3, Math.min(.3, s.roll));
 return s;
}

// Rest attitude: terrain tilt plus weight transfer. accel in m/s² (positive forward), lateral in m/s² (positive left).
export function restAttitude({vehicle = 'coupe', terrainPitch = 0, terrainRoll = 0, accel = 0, lateral = 0}) {
 const t = tune(vehicle);
 return {pitch: terrainPitch + Math.max(-.07, Math.min(.05, -accel * t.dive)), roll: terrainRoll + Math.max(-.1, Math.min(.1, lateral * t.roll))};
}

// Wheel height in body space so the tyre sits on the ground at its corner: `ground` is the corner's ground
// height, `base` the body's reference height, the body tilted by pitch (about x) and roll (about z).
export function wheelOffset({vehicle = 'coupe', ground, base, x, z, pitch = 0, roll = 0}) {
 const t = tune(vehicle), want = ground - base + z * pitch - x * roll;
 return Math.max(-t.travel, Math.min(t.travel, want));
}
