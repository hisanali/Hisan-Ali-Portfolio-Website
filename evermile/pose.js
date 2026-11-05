import * as T from './vendor/three.module.js';

// Procedural poses on top of an animation clip, for any of the rigs (Quaternius civilians and the Mixamo soldier).
// Bones are found by pattern because the glTF loader strips '.' and ':' from node names ("UpperLeg.L" arrives as
// "UpperLegL", "mixamorig:LeftUpLeg" as "mixamorigLeftUpLeg"). Each bone is aimed in world space (rotate it so the
// segment to its child points the way we want) so nothing depends on how a rig's local axes happen to be set up.
const PATTERNS = {
  hips: /^(mixamorig)?hips$/i,
  thighL: /^(mixamorig)?(leftupleg|upperleg_?l|thigh_?l)$/i, thighR: /^(mixamorig)?(rightupleg|upperleg_?r|thigh_?r)$/i,
  shinL: /^(mixamorig)?(leftleg|lowerleg_?l|shin_?l|calf_?l)$/i, shinR: /^(mixamorig)?(rightleg|lowerleg_?r|shin_?r|calf_?r)$/i,
  armL: /^(mixamorig)?(leftarm|upperarm_?l)$/i, armR: /^(mixamorig)?(rightarm|upperarm_?r)$/i,
  foreL: /^(mixamorig)?(leftforearm|lowerarm_?l|forearm_?l)$/i, foreR: /^(mixamorig)?(rightforearm|lowerarm_?r|forearm_?r)$/i,
};
export function findBones(model) {
  const out = {};
  model.traverse((o) => { if (!o.isBone && o.type !== 'Bone' && !/leg|arm|hips/i.test(o.name)) return; for (const [k, re] of Object.entries(PATTERNS)) if (!out[k] && re.test(o.name)) out[k] = o; });
  return out;
}
const childBone = (b) => b?.children.find((c) => c.isBone || /leg|arm|hand|foot|shin|calf|forearm/i.test(c.name)) || null;

const A = new T.Vector3(), B = new T.Vector3(), D = new T.Vector3(), Q = new T.Quaternion(), P = new T.Quaternion(), W = new T.Quaternion();
// Rotate `bone` so the segment from it to its child points along `dirWorld` (a unit vector in world space).
export function aim(bone, dirWorld, weight = 1) {
  const child = childBone(bone); if (!bone || !child || weight <= 0) return;
  bone.updateWorldMatrix(true, true);
  bone.getWorldPosition(A); child.getWorldPosition(B); D.subVectors(B, A); if (D.lengthSq() < 1e-8) return; D.normalize();
  Q.setFromUnitVectors(D, dirWorld); if (weight < 1) Q.slerp(P.identity(), 1 - weight);
  bone.getWorldQuaternion(W); W.premultiply(Q);
  bone.parent.getWorldQuaternion(P); bone.quaternion.copy(P.invert().multiply(W));
  bone.updateWorldMatrix(false, true);
}
const dir = (frame, x, y, z) => new T.Vector3(x, y, z).normalize().transformDirection(frame.matrixWorld);

// Seated: thighs forward along the seat, shins down to the floor, hands forward (to a wheel when `driving`).
// `frame` is the object whose +z is forward (the car, or the walker). Returns the hips' height in `frame` space.
// `floorY` (world height of the floor under the feet) bends the shins so the feet rest on it: down to a bench's
// pavement, forward to the pedals in a low sports car.
export function seat(bones, frame, {driving = false, weight = 1, floorY = null} = {}) {
  frame.updateWorldMatrix(true, false);
  for (const s of [-1, 1]) {
    const thigh = s < 0 ? bones.thighL : bones.thighR, shin = s < 0 ? bones.shinL : bones.shinR, arm = s < 0 ? bones.armL : bones.armR, fore = s < 0 ? bones.foreL : bones.foreR;
    aim(thigh, dir(frame, s * .06, driving ? .02 : -.1, 1), weight);
    let shinDir = dir(frame, 0, -1, .18);
    if (floorY !== null && shin) { const foot = childBone(shin); if (foot) { shin.updateWorldMatrix(true, true); shin.getWorldPosition(A); foot.getWorldPosition(B); const len = A.distanceTo(B), drop = Math.max(-len * .97, Math.min(-len * .12, floorY - A.y + .06)), ahead = Math.sqrt(Math.max(0, len * len - drop * drop)) / len; shinDir = dir(frame, 0, drop / len, ahead); } }
    aim(shin, shinDir, weight);
    if (driving) { aim(arm, dir(frame, -s * .12, -.55, 1), weight); aim(fore, dir(frame, -s * .2, .15, 1), weight); }
    else { aim(arm, dir(frame, s * .12, -1, .15), weight); aim(fore, dir(frame, s * .05, -.4, 1), weight); }
  }
}
// In the air: knees drawn up a little, arms out for balance; `amount` 0..1.
export function tuck(bones, frame, amount) {
  if (amount <= .01) return;
  frame.updateWorldMatrix(true, false);
  for (const s of [-1, 1]) {
    aim(s < 0 ? bones.thighL : bones.thighR, dir(frame, s * .05, -.75, .55), amount);
    aim(s < 0 ? bones.shinL : bones.shinR, dir(frame, 0, -1, -.35), amount);
    aim(s < 0 ? bones.armL : bones.armR, dir(frame, s * .7, -.45, .2), amount * .8);
  }
}
// A crouch (before a jump, or soaking up a landing): knees bent; `amount` 0..1.
export function crouch(bones, frame, amount) {
  if (amount <= .01) return;
  frame.updateWorldMatrix(true, false);
  for (const s of [-1, 1]) { aim(s < 0 ? bones.thighL : bones.thighR, dir(frame, s * .05, -.8, .6), amount); aim(s < 0 ? bones.shinL : bones.shinR, dir(frame, 0, -1, -.45), amount); }
}
// Where the hips are, in `frame` space.
export function hipsIn(bones, frame, out = new T.Vector3()) { if (!bones.hips) return null; bones.hips.updateWorldMatrix(true, false); bones.hips.getWorldPosition(out); return frame.worldToLocal(out); }
