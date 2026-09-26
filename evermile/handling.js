// SI units. A traction-limited bicycle model; not a full suspension/tire simulator.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const VEHICLE_DYNAMICS = {
 coupe: {mass: 1480, wheelbase: 2.8, power: 185000, force: 7900, brake: 10.4, drag: .39, rolling: .014, response: 7.5, mu: 1.04},
 coach: {mass: 11500, wheelbase: 4.9, power: 245000, force: 42000, brake: 6.7, drag: 3.2, rolling: .012, response: 4.0, mu: .86},
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
export function steeringMotion({vehicle = 'coupe', speed, steer, mu, acceleration = 0, previousRate = 0, dt}) {
 const v = VEHICLE_DYNAMICS[vehicle] || VEHICLE_DYNAMICS.coupe;
 const requested = speed / v.wheelbase * Math.tan(steer), budget = Math.sqrt(Math.max(.16, (mu * 9.81) ** 2 - acceleration ** 2 * .55));
 const maximum = budget / Math.max(Math.abs(speed), 1.5), target = clamp(requested, -maximum, maximum);
 const yawRate = previousRate + (target - previousRate) * (1 - Math.exp(-v.response * dt));
 return {yawRate, lateral: yawRate * speed, slip: clamp((Math.abs(requested) - maximum) / Math.max(maximum, .01), 0, 1)};
}
