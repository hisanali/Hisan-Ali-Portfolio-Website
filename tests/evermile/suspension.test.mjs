import test from 'node:test';
import assert from 'node:assert/strict';
import {createSuspension, stepSuspension, restAttitude, wheelOffset, SUSPENSION} from '../../evermile/suspension.js';
import {sideslip, VEHICLE_DYNAMICS} from '../../evermile/handling.js';

test('the body settles on its springs: a kerb bump drops the body then it returns, overshooting a little, never diverging', () => {
  for (const vehicle of Object.keys(SUSPENSION)) {
    const s = createSuspension();
    stepSuspension(s, {vehicle, bump: .08});
    assert.ok(s.heave < -.07, 'body lags behind the ground rise');
    let minH = 0, maxH = 0;
    for (let i = 0; i < 120 * 3; i++) { stepSuspension(s, {vehicle, dt: 1 / 120}); minH = Math.min(minH, s.heave); maxH = Math.max(maxH, s.heave); }
    assert.ok(Math.abs(s.heave) < .004 && Math.abs(s.hv) < .05, `${vehicle} settles, got ${s.heave}`);
    assert.ok(maxH > 0 && maxH < .06, `${vehicle} overshoots but stays within travel, got ${maxH}`);
  }
});

test('weight transfer dips the nose under braking and rolls the body in a corner; soft off-roaders move more than the coupé', () => {
  const brake = restAttitude({vehicle: 'coupe', accel: -9}), power = restAttitude({vehicle: 'coupe', accel: 5}), corner = restAttitude({vehicle: 'coupe', lateral: 6});
  assert.ok(brake.pitch > .03, 'braking: nose down is positive pitch target'); assert.ok(power.pitch < 0); assert.ok(corner.roll > .02);
  assert.ok(restAttitude({vehicle: 'landcruiser', lateral: 6}).roll > corner.roll);
  const s = createSuspension(); for (let i = 0; i < 240; i++) stepSuspension(s, {vehicle: 'coupe', pitchTarget: brake.pitch, dt: 1 / 120});
  assert.ok(Math.abs(s.pitch - brake.pitch) < .003, 'pitch follows the target');
});

test('wheels follow the ground within their travel and stay on the body plane when it tilts', () => {
  assert.equal(wheelOffset({vehicle: 'coupe', ground: 10, base: 10, x: .8, z: 1.3}), 0);
  assert.ok(Math.abs(wheelOffset({vehicle: 'coupe', ground: 10.05, base: 10, x: .8, z: 1.3}) - .05) < 1e-9, 'a 5 cm rise lifts the wheel 5 cm');
  assert.equal(wheelOffset({vehicle: 'coupe', ground: 10.5, base: 10, x: .8, z: 1.3}), SUSPENSION.coupe.travel, 'clamped to travel');
  assert.equal(wheelOffset({vehicle: 'landcruiser', ground: 9.5, base: 10, x: .8, z: 1.3}), -SUSPENSION.landcruiser.travel);
  // Nose pitched down (positive pitch): the front wheel sits higher in the body, the rear lower.
  const front = wheelOffset({vehicle: 'coupe', ground: 10, base: 10, x: 0, z: 1.3, pitch: .04}), rear = wheelOffset({vehicle: 'coupe', ground: 10, base: 10, x: 0, z: -1.3, pitch: .04});
  assert.ok(front > 0 && rear < 0 && Math.abs(front + rear) < 1e-9);
});

test('rear sideslip: nothing at rest or in grip, the tail steps out on the handbrake or past the limit, and grip pulls it back', () => {
  assert.equal(sideslip({drift: 0, slip: 0, steer: .3, speed: 0, handbrake: true}), 0, 'no drift when stopped');
  assert.equal(sideslip({drift: 0, slip: 0, steer: .3, speed: 20}), 0, 'no drift with grip in hand');
  let d = 0; for (let i = 0; i < 60; i++) d = sideslip({drift: d, slip: 0, steer: .3, speed: 15, handbrake: true, dt: 1 / 120});
  assert.ok(d > .2, `handbrake turn builds sideslip, got ${d}`);
  const peak = d; for (let i = 0; i < 240; i++) d = sideslip({drift: d, slip: 0, steer: 0, speed: 15, mu: 1, dt: 1 / 120});
  assert.ok(d < peak * .1, `grip pulls it back, got ${d}`);
  let l = 0, r = 0; for (let i = 0; i < 60; i++) { l = sideslip({drift: l, slip: .6, steer: .3, speed: 25, dt: 1 / 120}); r = sideslip({drift: r, slip: .6, steer: -.3, speed: 25, dt: 1 / 120}); }
  assert.ok(l > .1 && Math.abs(l + r) < 1e-9, 'sign follows the steering');
  let bike = 0, coach = 0, car = 0; for (let i = 0; i < 60; i++) { bike = sideslip({vehicle: 'bike', drift: bike, slip: .6, steer: .3, speed: 25, dt: 1 / 120}); coach = sideslip({vehicle: 'coach', drift: coach, slip: .6, steer: .3, speed: 25, dt: 1 / 120}); car = sideslip({vehicle: 'coupe', drift: car, slip: .6, steer: .3, speed: 25, dt: 1 / 120}); }
  assert.ok(bike < car && coach < car, 'a bike and a coach slide far less than the car');
  assert.ok(Object.keys(VEHICLE_DYNAMICS).every((v) => Math.abs(sideslip({vehicle: v, drift: .8, slip: 1, steer: 1, speed: 40, handbrake: true, dt: 1})) <= .8), 'bounded');
});
