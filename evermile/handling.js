// SI units. A traction-limited bicycle model; not a full suspension/tire simulator.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const VEHICLE_DYNAMICS = {
 mercedes: {mass: 1220, wheelbase: 2.66, power: 90000, force: 4700, brake: 8.7, drag: .43, rolling: .015, response: 6.5, mu: .96},
 grcorolla: {mass: 1475, wheelbase: 2.64, power: 200000, force: 8400, brake: 10.2, drag: .36, rolling: .014, response: 7.8, mu: 1.06},
 landcruiser: {mass: 2500, wheelbase: 2.85, power: 230000, force: 10500, brake: 8.4, drag: .62, rolling: .018, response: 5.2, mu: .92},
 coupe: {mass: 1480, wheelbase: 2.8, power: 185000, force: 7900, brake: 10.4, drag: .39, rolling: .014, response: 7.5, mu: 1.04},
 coach: {mass: 11500, wheelbase: 6.1, power: 245000, force: 42000, brake: 6.7, drag: 3.2, rolling: .012, response: 4.0, mu: .86},
 bike: {mass: 270, wheelbase: 1.42, power: 65000, force: 1900, brake: 9.0, drag: .25, rolling: .016, response: 10, mu: 1.02},
};
export function traction({vehicle = 'coupe', rain = 0, snow = false, offroad = false, grip = .7, handbrake = false}) {
 const v = VEHICLE_DYNAMICS[vehicle] || VEHICLE_DYNAMICS.coupe;
 return v.mu * clamp(grip / .7, .45, 1.45) * (offroad ? .53 : snow ? .43 : 1 - clamp(rain, 0, 1) * .32) * (handbrake ? .48 : 1);
}
export function longitudinal({vehicle = 'coupe', speed = 0, throttle = 0, brake = 0, mu = 1, slope = 0, offroad = false, speedFactor = 1, boost = false, powered = true, hold = false, parking = false}) {
 const v = VEHICLE_DYNAMICS[vehicle] || VEHICLE_DYNAMICS.coupe, a = Math.abs(speed), direction = Math.sign(speed);
 const engine = Math.min(v.force / v.mass, v.power / (v.mass * Math.max(a, 5))) * clamp(speedFactor, .5, 2) * (boost ? 1.18 : 1) * (powered ? 1 : .16);
 const resistance = direction * (9.81 * v.rolling + v.drag * a * a / v.mass + (offroad ? a * .12 : 0));
 let result = clamp(throttle, 0, 1) * engine - resistance - 9.81 * slope;
 // Brake and reverse share a pedal; stop hold is used only by automation.
 if (parking && a < .001) return 0;
 if (parking) return clamp(-direction * Math.min(v.brake, mu * 9.81) - resistance, -mu * 9.81, mu * 9.81);
 if (brake > 0) result -= clamp(brake, 0, 1) * (speed > .25 ? Math.min(v.brake, mu * 9.81) : hold ? Math.max(0, result) : engine * .55);
 if (throttle && speed < -.25) result += Math.min(v.brake, mu * 9.81) * throttle;
 if (!throttle && !brake && a < .04 && Math.abs(slope) < v.rolling) result = -speed * 120;
 return clamp(result, -mu * 9.81, mu * 9.81);
}
// Keyboard/stick travel maps to road-wheel angle, with a speed-dependent
// lateral-acceleration envelope. Parking retains a useful turning circle.
export function steeringTarget({vehicle = 'coupe', speed = 0, input = 0}) {
 const v = VEHICLE_DYNAMICS[vehicle] || VEHICLE_DYNAMICS.coupe;
 const lateral = vehicle === 'coach' ? 3.2 : 5.5;
 const lock = vehicle === 'bike' ? .5 : .58;
 return clamp(input, -1, 1) * Math.min(lock, Math.atan(v.wheelbase * lateral / (speed * speed + 8)));
}
export function steeringMotion({vehicle = 'coupe', speed, steer, mu, acceleration = 0}) {
 const v = VEHICLE_DYNAMICS[vehicle] || VEHICLE_DYNAMICS.coupe;
 // Steering is already rate-limited at the input. A second yaw filter allowed
 // rotation at rest and turning after the wheels had returned to centre.
 const grip = Math.max(0, mu) * 9.81;
 const budget = Math.sqrt(Math.max(0, grip * grip - Math.min(grip, Math.abs(acceleration)) ** 2));
 const requested = Math.tan(steer) / v.wheelbase;
 const maximum = budget / Math.max(speed * speed, .01);
 const curvature = clamp(requested, -maximum, maximum);
 // State position is the axle midpoint. The rear axle rolls along its own
 // heading; the midpoint has a small geometric velocity angle in a turn.
 const beta = Math.atan(v.wheelbase * .5 * curvature);
 const yawRate = speed * Math.cos(beta) * curvature;
 return {yawRate, beta, lateral: yawRate * speed, slip: clamp((Math.abs(requested) - maximum) / Math.max(maximum, .001), 0, 1)};
}
export function advancePose({x, z, yaw, speed, yawRate, beta = 0, dt}) {
 const turn = yawRate * dt, half = turn * .5;
 const distance = speed * dt * (Math.abs(half) < 1e-8 ? 1 : Math.sin(half) / half);
 return {x: x + Math.sin(yaw + beta + half) * distance, z: z + Math.cos(yaw + beta + half) * distance, yaw: yaw + turn};
}
// Rear-tyre sideslip: once the lateral budget is used up (or the handbrake locks the rear at speed), the rear
// steps out and the body yaws beyond the path it is following; grip pulls it back when the demand eases.
// `drift` is the angle between heading and velocity (radians, positive = tail out to the right in a left turn).
export function sideslip({vehicle = 'coupe', drift = 0, slip = 0, steer = 0, speed = 0, mu = 1, throttle = 0, handbrake = false, dt = 1 / 120}) {
 const v = Math.abs(speed), dir = Math.sign(steer) || Math.sign(drift) || 0;
 const can = vehicle === 'bike' ? .25 : vehicle === 'coach' ? .35 : 1;
 let target = 0;
 if (v > 3) {
  if (handbrake) target = dir * Math.min(.75, .25 + v * .02) * can;
  else if (slip > 0) target = dir * Math.min(.5, slip * .55 + throttle * .12) * can;
 }
 const grow = handbrake ? 5 : 3.2, settle = 1.8 + Math.max(0, mu) * 2.4 + (v < 3 ? 6 : 0);
 const rate = Math.abs(target) > Math.abs(drift) ? grow : settle;
 const next = drift + (target - drift) * (1 - Math.exp(-rate * dt));
 return Math.abs(next) < 1e-4 ? 0 : clamp(next, -.8, .8);
}
