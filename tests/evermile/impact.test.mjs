import test from 'node:test';
import assert from 'node:assert/strict';
import {massOf, pushShare, bodyPoints, respond, severity, jolt, MASS, PLAYER_MASS} from '../../evermile/impact.js';

test('people and animals are light, traffic is heavy, the world is immovable', () => {
  assert.equal(massOf({person: {}}), MASS.person);
  assert.equal(massOf({animal: {kind: 'cow'}, kind: 'cow'}), MASS.cow);
  assert.equal(massOf({animal: {kind: 'unicorn'}}), 60);
  assert.equal(massOf({vehicle: {kind: 'bus'}}), MASS.bus);
  assert.equal(massOf({vehicle: {kind: 'car'}}), MASS.car);
  assert.equal(massOf({train: true}), MASS.train);
  assert.equal(massOf({x: 0, z: 0, hx: 3, hz: 3}), Infinity);
  assert.equal(pushShare(Infinity), 1, 'a wall moves the car by the whole overlap');
  assert.ok(pushShare(MASS.person, PLAYER_MASS.coupe) < .06, 'a pedestrian moves the car by almost nothing');
  assert.ok(Math.abs(pushShare(1480, 1480) - .5) < 1e-9, 'an equal car shares the overlap');
  assert.ok(pushShare(MASS.car, PLAYER_MASS.coach) < .12, 'a coach barely notices a car');
});

test('body sample points cover the corners and sides so an angled car cannot slip into a wall', () => {
  const pts = bodyPoints(1.9, 4.5, .32);
  assert.equal(pts.length, 8);
  const corners = pts.filter((p) => Math.abs(p.along) > 1.9 && Math.abs(p.lateral) > .6);
  assert.equal(corners.length, 4);
  assert.ok(pts.every((p) => Math.abs(p.along) <= 2.25 - .32 + 1e-9 && Math.abs(p.lateral) <= .95 - .32 + 1e-9), 'inset by the contact radius');
  assert.ok(bodyPoints(2.5, 12, .32).length > 8, 'a coach gets extra points along its long sides');
});

test('a head-on wall hit stops the car with a small rebound; a glancing hit only scrubs speed; a pedestrian barely slows it', () => {
  const wall = respond({speed: 20, approach: 20, cos: 1, share: 1});
  assert.ok(wall.speed < 0 && wall.speed > -2.5, `rebound, got ${wall.speed}`);
  const glance = respond({speed: 20, approach: 20 * .2, cos: .2, share: 1});
  assert.ok(glance.speed > 17 && glance.speed < 20, `glancing hit keeps most speed, got ${glance.speed}`);
  const person = respond({speed: 15, approach: 15, cos: 1, share: pushShare(MASS.person, 1480), restitution: 0});
  assert.ok(person.speed > 14 && person.speed < 15, `pedestrian is not a wall, got ${person.speed}`);
  assert.deepEqual(respond({speed: 10, approach: -3, cos: -.3, share: 1}), {speed: 10, loss: 0}, 'moving away from a contact changes nothing');
  assert.equal(respond({speed: 0, approach: 0, cos: 1, share: 1}).speed, 0, 'a parked car stays parked when something walks into it');
  const reverse = respond({speed: -6, approach: 6, cos: 1, share: 1});
  assert.ok(reverse.speed >= 0 && reverse.speed < 1, 'reversing into a wall stops with a nudge forward');
});

test('severity and jolt scale with closing speed and what was hit', () => {
  assert.ok(severity(14, 1) > severity(14, pushShare(MASS.dog, 1480)) * 5, 'a wall hurts the car far more than a dog');
  assert.equal(severity(-2, 1), 0);
  const front = jolt(12, 1, 0); assert.ok(front.pitch < -.05 && Math.abs(front.roll) < 1e-9, 'frontal: nose dips');
  const side = jolt(12, 0, 1); assert.ok(Math.abs(side.pitch) < 1e-9 && side.roll < -.05, 'side: rolls away');
  const gentle = jolt(1, 1, 0); assert.ok(Math.abs(gentle.pitch) < .01);
});
