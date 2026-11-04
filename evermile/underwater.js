import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';

// Below the surface of the lakes and the sea: the water seen from underneath, shoals of fish, kelp swaying on
// the bed, wrecks (a broken ship, capsized boats), rising bubbles, and a shifting light. Everything is laid out
// in deep water near wherever you are and moves on with you.
const rand = (a, b) => a + Math.random() * (b - a);
function seeded(seed) { let r = seed >>> 0 || 1; return () => (r = (r * 1664525 + 1013904223) >>> 0) / 4294967296; }

export class Underwater {
  constructor(scene, world, settings) {
    this.scene = scene; this.world = world; this.settings = settings; this.time = 0; this.seedZ = null; this.active = false;
    this.group = new T.Group(); this.group.visible = false; scene.add(this.group);
    // The surface from below: a dim, rippling ceiling.
    this.underside = new T.Mesh(new T.PlaneGeometry(4000, 4000), new T.MeshStandardMaterial({color: 0x2f6f78, emissive: 0x15424a, emissiveIntensity: .35, roughness: .35, metalness: .2, transparent: true, opacity: .78, side: T.BackSide, depthWrite: false}));
    this.underside.rotation.x = -Math.PI / 2; this.underside.renderOrder = 1; this.group.add(this.underside);
    // Fish: a flattened body with a tail, wiggled in the shader; each instance swims its own loop.
    const body = new T.SphereGeometry(1, 10, 7).scale(.07, .11, .24), tail = new T.ConeGeometry(.1, .18, 3).rotateX(-Math.PI / 2).rotateZ(Math.PI / 2).translate(0, 0, -.3);
    const fishGeo = mergeGeometries([body.toNonIndexed(), tail.toNonIndexed()], false);
    this.fishCount = 56; this.fishMat = new T.MeshStandardMaterial({color: 0xffffff, roughness: .55, metalness: .25});
    this.fishMat.onBeforeCompile = (sh) => { sh.uniforms.uTime = this.timeUniform; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat fishPhase=float(gl_InstanceID)*1.7;float back=max(0.,-transformed.z);transformed.x+=sin(uTime*7.+fishPhase+transformed.z*6.)*back*back*.9;'); };
    this.fish = new T.InstancedMesh(fishGeo, this.fishMat, this.fishCount); this.fish.instanceMatrix.setUsage(T.DynamicDrawUsage); this.fish.frustumCulled = false;
    const palette = [0xc9d4d8, 0x8fb0a6, 0xd9a05b, 0x6c8ea6, 0xe0c9a0, 0x7f9c6b];
    for (let i = 0; i < this.fishCount; i++) this.fish.setColorAt(i, new T.Color(palette[i % palette.length]));
    this.group.add(this.fish); this.timeUniform = {value: 0}; this.fishMat.onBeforeCompile = ((f) => (sh) => { sh.uniforms.uTime = this.timeUniform; f(sh); })(this.fishMat.onBeforeCompile);
    this.shoals = []; this.fishData = [];
    // Kelp: tall strands on the bed, swaying from the root.
    this.kelpCount = 90; const kelpGeo = new T.PlaneGeometry(.35, 3.2, 1, 6).translate(0, 1.6, 0);
    this.kelpMat = new T.MeshStandardMaterial({color: 0x3f6b3a, roughness: .9, side: T.DoubleSide});
    this.kelpMat.onBeforeCompile = (sh) => { sh.uniforms.uTime = this.timeUniform; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat kelpPhase=float(gl_InstanceID)*.9;float h=transformed.y/3.2;transformed.x+=sin(uTime*1.3+kelpPhase+h*2.)*h*h*.55;transformed.z+=cos(uTime*.9+kelpPhase)*h*h*.3;'); };
    this.kelp = new T.InstancedMesh(kelpGeo, this.kelpMat, this.kelpCount); this.kelp.frustumCulled = false; this.group.add(this.kelp);
    // Bubbles: points rising from the wrecks and from the car when it is under.
    this.bubbleCount = 260; const bg = new T.BufferGeometry();
    this.bubblePos = new Float32Array(this.bubbleCount * 3); this.bubbleBorn = new Float32Array(this.bubbleCount).fill(-1e6); this.bubbleRise = new Float32Array(this.bubbleCount);
    bg.setAttribute('position', new T.BufferAttribute(this.bubblePos, 3)); bg.setAttribute('born', new T.BufferAttribute(this.bubbleBorn, 1)); bg.setAttribute('rise', new T.BufferAttribute(this.bubbleRise, 1));
    this.bubbleMat = new T.ShaderMaterial({uniforms: {time: {value: 0}, surface: {value: -8}, scale: {value: innerHeight}}, transparent: true, depthWrite: false,
      vertexShader: 'attribute float born,rise;uniform float time,surface,scale;varying float vA;void main(){float age=time-born;vec3 p=position+vec3(sin(age*3.+position.x)*.12,age*rise,cos(age*2.3+position.z)*.12);vA=age<0.||p.y>surface-.05?0.:.75;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((3.+age*1.5)*scale/max(-mv.z,1.)*.08,1.,22.);gl_Position=projectionMatrix*mv;if(vA<.01)gl_Position.w=-1.;}',
      fragmentShader: 'varying float vA;void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;float rim=smoothstep(.35,1.,r);gl_FragColor=vec4(vec3(.8,.92,1.),vA*(.25+rim*.6));}'});
    this.bubbles = new T.Points(bg, this.bubbleMat); this.bubbles.frustumCulled = false; this.group.add(this.bubbles); this.nextBubble = 0;
    this.wrecks = new T.Group(); this.group.add(this.wrecks);
    this.wood = new T.MeshStandardMaterial({color: 0x4b3b2c, roughness: .92}); this.rust = new T.MeshStandardMaterial({color: 0x6b4a33, roughness: .85, metalness: .35}); this.dark = new T.MeshStandardMaterial({color: 0x2c2f33, roughness: .9});
  }

  // A broken ship: a hull split in two with the bow heeled over, a snapped mast, ribs showing, a funnel.
  ship(rng) {
    const g = new T.Group(), L = 22 + rng() * 10, W = 5.4, H = 3.2;
    const stern = new T.Mesh(new T.BoxGeometry(W, H, L * .55), this.rust); stern.position.set(0, H / 2, -L * .22); g.add(stern);
    const bow = new T.Mesh(new T.BoxGeometry(W * .9, H * .9, L * .36), this.rust); bow.position.set(W * .4, H * .35, L * .3); bow.rotation.set(.25, .2, .55); g.add(bow);
    for (let k = 0; k < 7; k++) { const rib = new T.Mesh(new T.BoxGeometry(W * 1.02, .18, .18), this.dark); rib.position.set(0, H * .85, -L * .45 + k * L * .07); g.add(rib); }
    const house = new T.Mesh(new T.BoxGeometry(W * .6, 2.2, L * .18), this.dark); house.position.set(0, H + 1.1, -L * .3); g.add(house);
    const funnel = new T.Mesh(new T.CylinderGeometry(.7, .8, 3.6, 10), this.rust); funnel.position.set(0, H + 3, -L * .15); funnel.rotation.z = .35; g.add(funnel);
    const mast = new T.Mesh(new T.CylinderGeometry(.14, .2, 9, 8), this.wood); mast.position.set(.8, H + 2.5, L * .05); mast.rotation.set(1.1, 0, .5); g.add(mast);
    for (let k = 0; k < 10; k++) { const plank = new T.Mesh(new T.BoxGeometry(.3, .08, 2 + rng() * 2), this.wood); plank.position.set((rng() - .5) * 14, .1, (rng() - .5) * 30); plank.rotation.y = rng() * 3; g.add(plank); }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
    return g;
  }

  // Lay the scene out around z: deep water within a few hundred metres, on both sides of the road.
  seed(zc) {
    const w = this.world, r = w.road, water = w.water.position.y, rng = seeded(Math.floor(zc / 100) * 7919 + 3);
    const deep = []; for (let z = zc - 320; z <= zc + 320; z += 14) for (const side of [-1, 1]) for (let d = 14; d < 300; d += 12) { const x = r.x(z) + side * d, y = w.surfaceHeight(x, z, false); if (y < water - 2.2) deep.push({x, z, y}); }
    this.active = deep.length > 20;
    this.group.visible = this.active;
    if (!this.active) { this.seedZ = zc; return; }
    const pick = () => deep[Math.floor(rng() * deep.length)];
    // Shoals.
    this.shoals = []; this.fishData = [];
    for (let s = 0; s < 6; s++) { const p = pick(); this.shoals.push({x: p.x, z: p.z, y: Math.min(water - 1.5, p.y + 1.2 + rng() * Math.max(.5, water - p.y - 2)), radius: 3 + rng() * 6, speed: .3 + rng() * .5, phase: rng() * 6.28, clockwise: rng() < .5 ? 1 : -1}); }
    for (let i = 0; i < this.fishCount; i++) { const sh = this.shoals[i % this.shoals.length]; this.fishData.push({shoal: sh, a: rng() * 6.28, r: sh.radius * (.5 + rng() * .6), dy: (rng() - .5) * 1.4, size: .7 + rng() * .8, wobble: rng() * 6.28}); }
    // Kelp on the bed.
    const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3();
    for (let i = 0; i < this.kelpCount; i++) { const p = pick(); const h = .6 + rng() * .9; e.set(0, rng() * 6.28, 0); q.setFromEuler(e); m.compose(new T.Vector3(p.x + (rng() - .5) * 3, p.y, p.z + (rng() - .5) * 3), q, sc.set(1, Math.min(h, (water - p.y - .5) / 3.2), 1)); this.kelp.setMatrixAt(i, m); }
    this.kelp.instanceMatrix.needsUpdate = true;
    // Wrecks: one broken ship where it is deep enough, two capsized boats.
    for (const o of [...this.wrecks.children]) this.wrecks.remove(o);
    this.wreckSpots = [];
    const deepest = deep.filter((p) => p.y < water - 5).sort((a, b) => a.y - b.y);
    if (deepest.length) { const p = deepest[Math.floor(rng() * Math.min(5, deepest.length))], ship = this.ship(rng); ship.position.set(p.x, p.y - .4, p.z); ship.rotation.set(.08, rng() * 6.28, -.22); this.wrecks.add(ship); this.wreckSpots.push({x: p.x, y: p.y + 2, z: p.z}); }
    if (this.world.scenery?.boat) for (let k = 0; k < 2; k++) { const p = pick(), b = this.world.scenery.boat(false, rng); b.scale.setScalar(1.7); b.position.set(p.x, p.y + .5, p.z); b.rotation.set(0, rng() * 6.28, Math.PI * (.75 + rng() * .3)); this.wrecks.add(b); this.wreckSpots.push({x: p.x, y: p.y + .6, z: p.z}); }
    this.seedZ = zc;
  }

  bubble(x, y, z, rise = .6) { const i = this.nextBubble; this.nextBubble = (this.nextBubble + 1) % this.bubbleCount; this.bubblePos[i * 3] = x + (Math.random() - .5) * .4; this.bubblePos[i * 3 + 1] = y; this.bubblePos[i * 3 + 2] = z + (Math.random() - .5) * .4; this.bubbleBorn[i] = this.time; this.bubbleRise[i] = rise * (.7 + Math.random() * .6); this.bubblesDirty = true; }

  update(dt, state, camera) {
    const hills = this.settings.location === 'hills'; if (!hills) { this.group.visible = false; this.active = false; return; }
    this.time += dt; this.timeUniform.value = this.time;
    const water = this.world.water.position.y;
    if (this.seedZ === null || Math.abs(state.z - this.seedZ) > 240) this.seed(state.z);
    if (!this.active) return;
    this.underside.position.set(Math.round(camera.position.x / 50) * 50, water - .04, Math.round(camera.position.z / 50) * 50);
    this.underside.visible = camera.position.y < water + 1.5;
    // Fish swim their loops; the shoal drifts a little.
    const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s = new T.Vector3(), p = new T.Vector3();
    for (let i = 0; i < this.fishCount; i++) {
      const f = this.fishData[i], sh = f.shoal; f.a += dt * sh.speed * sh.clockwise / Math.max(f.r, 1) * 2.2;
      const x = sh.x + Math.cos(f.a) * f.r, z = sh.z + Math.sin(f.a) * f.r, y = sh.y + f.dy + Math.sin(this.time * .8 + f.wobble) * .3;
      const heading = f.a + (sh.clockwise > 0 ? Math.PI / 2 : -Math.PI / 2);
      e.set(0, Math.atan2(-Math.sin(heading), Math.cos(heading)) + Math.PI / 2, 0); q.setFromEuler(e); m.compose(p.set(x, y, z), q, s.setScalar(f.size)); this.fish.setMatrixAt(i, m);
    }
    this.fish.instanceMatrix.needsUpdate = true;
    // Bubbles from the wrecks now and then, and from the car when it is under.
    this.bubbleClock = (this.bubbleClock || 0) + dt;
    if (this.bubbleClock > .12) { this.bubbleClock = 0; for (const w of this.wreckSpots) if (Math.random() < .5) this.bubble(w.x, w.y, w.z, .5); if (state.depth > .3) this.bubble(state.x - Math.sin(state.yaw) * 2, state.y + .4, state.z - Math.cos(state.yaw) * 2, .9); }
    this.bubbleMat.uniforms.time.value = this.time; this.bubbleMat.uniforms.surface.value = water; this.bubbleMat.uniforms.scale.value = innerHeight;
    if (this.bubblesDirty) { this.bubblesDirty = false; const a = this.bubbles.geometry.attributes; a.position.needsUpdate = a.born.needsUpdate = a.rise.needsUpdate = true; }
  }
}
