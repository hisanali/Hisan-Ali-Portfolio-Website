import * as T from './vendor/three.module.js';
import {clone as cloneSkin} from './vendor/utils/SkeletonUtils.js';
import {fitCitizen} from './citizen-assets.js?v=20260927-train1';
import {clamp, damp, angleDifference} from './math.js?v=20260927-train1';

// You, on foot: one of the rigged civilians. Movement is relative to the camera: W walks where the camera looks,
// A/D step sideways, S walks back, Shift runs; the body turns smoothly towards the way you are going. (Legacy
// `forward`/`turn` input is still accepted.)
// standing on whatever the ground is, kept out of walls, cars, people and deep water, blending idle and walk clips
// with the walk sped up for a run. The car is left where it stands; walk back to a door to get in again.
export const WALK = 1.55, RUN = 4.6, TURN = 2.7, TURN_RATE = 9, RADIUS = .34;

export class Walker {
  constructor(scene, world, settings) {
    this.scene = scene; this.world = world; this.settings = settings;
    this.root = new T.Group(); this.root.visible = false; scene.add(this.root);
    this.x = 0; this.z = 0; this.y = 0; this.yaw = 0; this.speed = 0; this.vy = 0; this.grounded = true; this.key = null; this.detail = null; this.height = 1.72; this.floor = null;
  }
  // Dress the walker from a loaded citizen asset (the detailed-models loader keeps them); falls back to a capsule.
  dress(asset, key) {
    if (this.detail && this.key === key) return;
    this.undress();
    if (!asset) { const m = new T.Mesh(new T.CapsuleGeometry(.28, 1.1, 6, 12), new T.MeshStandardMaterial({color: 0x6a7f9a, roughness: .8})); m.position.y = .85; m.castShadow = true; this.root.add(m); this.detail = {mixer: null, placeholder: m}; this.key = key; return; }
    const model = cloneSkin(asset.scene); fitCitizen(model, 2); model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    this.root.add(model);
    const mixer = new T.AnimationMixer(model), find = (n) => asset.animations.find((a) => a.name === n), fallback = asset.animations[0];
    const walk = mixer.clipAction(find('Walk') || fallback).play(), idle = mixer.clipAction(find('Idle') || fallback).play(), runClip = find('Run'), run = runClip ? mixer.clipAction(runClip).play() : null;
    idle.setEffectiveWeight(1); walk.setEffectiveWeight(0); run?.setEffectiveWeight(0);
    this.detail = {mixer, walk, idle, run, blend: 0, runBlend: 0, stride: 1.15, runStride: 3.6}; this.key = key;
  }
  undress() { if (!this.detail) return; this.detail.mixer?.stopAllAction(); for (const o of [...this.root.children]) this.root.remove(o); this.detail = null; this.key = null; }

  // Step out of (or appear at) a point, facing a direction.
  // Indoors the floor is flat and known; outdoors it is the ground.
  ground(x, z) { return this.floor !== null ? this.floor : this.world.groundHeight(x, z); }
  place(x, z, yaw) { this.x = x; this.z = z; this.yaw = yaw; this.speed = 0; this.vy = 0; this.down = 0; this.lie = 0; this.y = this.ground(x, z); this.root.position.set(x, this.y, z); this.root.rotation.set(0, yaw, 0); this.root.visible = true; }
  hide() { this.root.visible = false; }

  // Hit by a car: thrown along its direction, down on the ground for a moment, then up again.
  knock(dx, dz, speed) { if (this.down > 0) return; this.down = 2.4 + Math.min(1.6, speed * .1); this.throwX = dx * Math.min(6, 1.5 + speed * .3); this.throwZ = dz * Math.min(6, 1.5 + speed * .3); this.speed = 0; }
  // One step: `forward` −1..1, `turn` −1..1 (positive left), `run`; `colliders` are the solid things near by.
  update(dt, {forward = 0, turn = 0, run = false, moveX = 0, moveY = 0, camYaw = null} = {}, colliders = [], water = -1e9) {
    if (this.down > 0) { this.down -= dt; forward = 0; turn = 0; moveX = 0; moveY = 0; run = false; this.x += this.throwX * dt; this.z += this.throwZ * dt; this.throwX *= Math.exp(-dt * 3); this.throwZ *= Math.exp(-dt * 3); }
    // Camera-relative input: the stick or keys give a direction in the camera's frame; the body turns to it.
    if (camYaw !== null && (moveX || moveY)) { const amount = Math.min(1, Math.hypot(moveX, moveY)), heading = camYaw + Math.atan2(moveX, moveY); const back = Math.abs(angleDifference(heading, this.yaw)) > Math.PI * .75 && Math.abs(this.speed) < .3; this.yaw += angleDifference(heading, this.yaw) * (1 - Math.exp(-(back ? TURN_RATE * 2 : TURN_RATE) * dt)); forward = amount * (1 - Math.min(.7, Math.abs(angleDifference(heading, this.yaw)) / Math.PI)); turn = 0; }
    else if (camYaw !== null) { turn = 0; forward = 0; }
    const lying = this.down > .7 ? 1 : this.down > 0 ? this.down / .7 : 0; this.lie = damp(this.lie || 0, lying, this.down > 0 && this.down < .7 ? 4 : 9, dt);
    const want = forward * (run && forward > 0 ? RUN : WALK) * (forward < 0 ? .6 : 1);
    this.speed = damp(this.speed, want, want ? 9 : 14, dt);
    this.yaw += turn * TURN * dt * (Math.abs(this.speed) > RUN * .7 ? .55 : 1);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    let nx = this.x + fx * this.speed * dt, nz = this.z + fz * this.speed * dt;
    // Too steep, or into deep water: stay where you are.
    const gNext = this.ground(nx, nz), rise = gNext - this.y;
    if (rise > .55 || gNext < water - 1.05) { nx = this.x; nz = this.z; this.speed *= .3; }
    this.x = nx; this.z = nz;
    // Pushed out of anything solid.
    for (const k of colliders) {
      const dx = this.x - k.x, dz = this.z - k.z;
      if (k.hx) {
        const lx = dx * k.c - dz * k.s, lz = dx * k.s + dz * k.c, ex = k.hx + RADIUS, ez = k.hz + RADIUS;
        if (Math.abs(lx) >= ex || Math.abs(lz) >= ez) continue;
        const px = ex - Math.abs(lx), pz = ez - Math.abs(lz); let nlx = 0, nlz = 0, push;
        if (px < pz) { nlx = Math.sign(lx) || 1; push = px; } else { nlz = Math.sign(lz) || 1; push = pz; }
        this.x += (nlx * k.c + nlz * k.s) * push; this.z += (-nlx * k.s + nlz * k.c) * push;
      } else { const d = Math.hypot(dx, dz), min = RADIUS + (k.r || .3); if (d < min && d > 1e-4) { this.x += dx / d * (min - d); this.z += dz / d * (min - d); } }
    }
    // Feet on the ground (a small drop is walked down, a bigger one is fallen).
    const ground = this.ground(this.x, this.z);
    if (this.y - ground > .35 && this.grounded) { this.vy = 0; this.grounded = false; }
    if (!this.grounded) { this.vy -= 9.81 * dt; this.y += this.vy * dt; if (this.y <= ground) { this.y = ground; this.vy = 0; this.grounded = true; } }
    else this.y = damp(this.y, ground, 18, dt);
    this.root.position.set(this.x, this.y + this.lie * .18, this.z); this.root.rotation.y = this.yaw; this.root.rotation.x = -this.lie * Math.PI / 2 * .92;
    // Pose.
    const d = this.detail; if (!d) return;
    if (d.placeholder) { d.placeholder.position.y = .85 + Math.abs(Math.sin(performance.now() * .012)) * Math.min(1, Math.abs(this.speed)) * .04; return; }
    // Idle, walk and (when the model has one) a real run clip, blended by speed; without a run clip the walk speeds up.
    const pace = Math.abs(this.speed), moving = pace > .08, running = d.run ? clamp((pace - WALK * 1.15) / (RUN * .75 - WALK * 1.15), 0, 1) : 0;
    d.blend = damp(d.blend, moving ? 1 : 0, 12, dt); d.runBlend = damp(d.runBlend, running, 8, dt);
    d.idle.setEffectiveWeight(1 - d.blend); d.walk.setEffectiveWeight(d.blend * (1 - d.runBlend)); d.run?.setEffectiveWeight(d.blend * d.runBlend);
    d.walk.setEffectiveTimeScale(clamp(pace / d.stride, .3, d.run ? 1.6 : 3.1) * Math.sign(this.speed || 1)); d.run?.setEffectiveTimeScale(clamp(pace / d.runStride, .6, 1.5)); d.mixer.update(dt);
  }
  // Where the head is, for the camera.
  head(out) { return out.set(this.x, this.y + this.height * .92, this.z); }
}
