import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../evermile/vendor/three.module.js';
import {Walker} from '../../evermile/walker.js';
import {findBones, seat, hipsIn} from '../../evermile/pose.js';

const flat = () => new Walker({add() {}}, {groundHeight: () => 0}, {});

test('a jump crouches first, rises about half a metre, keeps the feet off the ground until it lands, then soaks up the landing', () => {
  const w = flat(); w.place(0, 0, 0); w.dress(null, 'placeholder');
  assert.equal(w.jump(), true); assert.equal(w.jump(), false, 'no second jump from the crouch');
  let peak = 0, airborne = 0, crouched = 0, landed = false;
  for (let i = 0; i < 120; i++) { w.update(1 / 60, {camYaw: 0}); if (w.crouchT > 0) crouched++; if (w.grounded === false) { airborne++; peak = Math.max(peak, w.y); } if (w.landT > 0) landed = true; }
  assert.ok(crouched >= 6 && crouched <= 10, `a short crouch before take-off, got ${crouched} frames`);
  assert.ok(peak > .4 && peak < .62, `about half a metre, got ${peak.toFixed(2)}`);
  assert.ok(airborne > 30 && airborne < 50, `about two thirds of a second in the air, got ${airborne} frames`);
  assert.ok(landed && w.grounded && Math.abs(w.y) < 1e-6, 'lands back on the ground');
});

test('a running jump carries you forward', () => {
  const w = flat(); w.place(0, 0, 0); w.dress(null, 'placeholder');
  for (let i = 0; i < 120; i++) w.update(1 / 60, {moveY: 1, run: true, camYaw: 0});
  const z0 = w.z; w.jump(); for (let i = 0; i < 50; i++) w.update(1 / 60, {moveY: 1, run: true, camYaw: 0});
  assert.ok(w.z - z0 > 1.5, `travelled ${(w.z - z0).toFixed(2)} m`);
});

test('bones are found on the names the glTF loader produces (dots and colons stripped), for both rigs', () => {
  for (const names of [['Hips', 'UpperLegL', 'LowerLegL', 'UpperLegR', 'LowerLegR', 'UpperArmL', 'LowerArmL', 'UpperArmR', 'LowerArmR'], ['mixamorigHips', 'mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigLeftArm', 'mixamorigLeftForeArm', 'mixamorigRightArm', 'mixamorigRightForeArm']]) {
    const root = new T.Group(); for (const n of names) { const b = new T.Bone(); b.name = n; root.add(b); }
    const b = findBones(root);
    for (const k of ['hips', 'thighL', 'thighR', 'shinL', 'shinR', 'armL', 'armR', 'foreL', 'foreR']) assert.ok(b[k], `${names[0]}: ${k}`);
  }
});

test('seated: thighs point forward and the feet rest on the floor given', () => {
  // A minimal standing leg: hips at 1 m, knee at 0.5 m, foot on the ground, facing +z.
  const frame = new T.Group(), hips = new T.Bone(), thigh = new T.Bone(), shin = new T.Bone(), foot = new T.Bone();
  hips.name = 'Hips'; thigh.name = 'UpperLegL'; shin.name = 'LowerLegL'; foot.name = 'FootL';
  frame.add(hips); hips.position.set(0, 1, 0); hips.add(thigh); thigh.add(shin); shin.position.set(0, -.5, 0); shin.add(foot); foot.position.set(0, -.5, 0);
  const bones = findBones(frame); seat(bones, frame, {floorY: .62});
  const k = new T.Vector3(), f = new T.Vector3(); shin.getWorldPosition(k); foot.getWorldPosition(f);
  assert.ok(k.z > .45 && Math.abs(k.y - 1) < .06, `knee forward at hip height, got ${k.toArray().map((v) => v.toFixed(2))}`);
  assert.ok(Math.abs(f.y - .68) < .06, `foot on the floor, got ${f.y.toFixed(2)}`);
  assert.ok(hipsIn(bones, frame).y > .99);
});
