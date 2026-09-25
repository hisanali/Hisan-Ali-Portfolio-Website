import * as T from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/geometries/RoundedBoxGeometry.js';

// Life around the road: grazing cows and sheep, dogs and cats by the verge, oncoming traffic and parked cars.
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const shadowed = (mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
function part(geometry, material, x, y, z, parent) { const m = shadowed(new T.Mesh(geometry, material)); m.position.set(x, y, z); parent.add(m); return m; }

function patchTexture(base, spot, count, seed = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d'); ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.fillStyle = spot;
  for (let i = 0; i < count; i++) {
    const x = r() * 256, y = r() * 256, w = 20 + r() * 50;
    ctx.beginPath();
    for (let n = 0; n < 12; n++) { const a = n / 12 * Math.PI * 2, rr = w * (.6 + r() * .5); n ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8); }
    ctx.fill();
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

function extruded(points, depth, bevel = .05) {
  const shape = new T.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const g = new T.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8});
  g.translate(0, 0, -depth / 2); g.rotateY(-Math.PI / 2); g.computeVertexNormals();
  return g;
}

export class Life {
  constructor({scene, world, settings, getState, onHit}) {
    Object.assign(this, {scene, world, settings, getState, onHit});
    this.materials();
    this.animals = [];
    this.traffic = [];
    this.parked = [];
    this.buildAnimals();
    this.buildTraffic();
  }

  materials() {
    this.m = {
      cow: new T.MeshStandardMaterial({map: patchTexture('#f1ede4', '#1c1a18', 9, 3), roughness: .85}),
      brownCow: new T.MeshStandardMaterial({map: patchTexture('#7a4a2a', '#f0e8dc', 5, 7), roughness: .85}),
      muzzle: new T.MeshStandardMaterial({color: 0xd9a39a, roughness: .7}),
      hoof: new T.MeshStandardMaterial({color: 0x2a2420, roughness: .7}),
      horn: new T.MeshStandardMaterial({color: 0xe8dcc4, roughness: .5}),
      wool: new T.MeshStandardMaterial({color: 0xeae6dc, roughness: 1, flatShading: true}),
      sheepFace: new T.MeshStandardMaterial({color: 0x2c2826, roughness: .8}),
      dogs: [0x8a5a32, 0x2a2624, 0xc9a06a, 0xe8e2d6].map((c) => new T.MeshStandardMaterial({color: c, roughness: .8})),
      cats: [0xd2843c, 0x3a3634, 0x9a948c, 0xf0ece4].map((c) => new T.MeshStandardMaterial({color: c, roughness: .75})),
      eye: new T.MeshStandardMaterial({color: 0x101010, roughness: .2}),
      nose: new T.MeshStandardMaterial({color: 0x1a1414, roughness: .4}),
      glass: new T.MeshPhysicalMaterial({color: 0x15202c, roughness: .05, metalness: .4, clearcoat: 1, envMapIntensity: 1.4}),
      tyre: new T.MeshStandardMaterial({color: 0x161616, roughness: .9}),
      rim: new T.MeshStandardMaterial({color: 0xb7bcc0, roughness: .3, metalness: .9}),
      trim: new T.MeshStandardMaterial({color: 0x1b1d20, roughness: .6}),
      head: new T.MeshStandardMaterial({color: 0xfff6e0, emissive: 0xfff2d6, emissiveIntensity: .2}),
      tail: new T.MeshStandardMaterial({color: 0x7a0a0a, emissive: 0xff2010, emissiveIntensity: .4}),
      plate: new T.MeshStandardMaterial({color: 0xe8e6da, roughness: .6}),
    };
    this.g = {
      leg: new T.CylinderGeometry(.07, .06, .7, 8).translate(0, -.35, 0),
      smallLeg: new T.CylinderGeometry(.035, .03, .32, 6).translate(0, -.16, 0),
      catLeg: new T.CylinderGeometry(.018, .016, .16, 6).translate(0, -.08, 0),
      sphere: new T.SphereGeometry(.5, 20, 14),
      woolBody: new T.IcosahedronGeometry(.5, 2),
      eye: new T.SphereGeometry(.025, 8, 6),
      wheel: new T.CylinderGeometry(.33, .33, .24, 22).rotateZ(Math.PI / 2),
      rim: new T.CylinderGeometry(.22, .22, .25, 16).rotateZ(Math.PI / 2),
      lamp: new RoundedBoxGeometry(.32, .12, .06, 2, .03),
      beam: new T.PlaneGeometry(2.4, 7).rotateX(-Math.PI / 2),
    };
    const glow = document.createElement('canvas'); glow.width = glow.height = 64;
    const gx = glow.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
    this.m.beam = new T.MeshBasicMaterial({map: new T.CanvasTexture(glow), color: 0xfff0cc, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false});
  }

  /* ---------- Animals ---------- */
  cow() {
    const g = new T.Group(), skin = Math.random() < .6 ? this.m.cow : this.m.brownCow;
    const body = part(this.g.sphere, skin, 0, 1.05, 0, g); body.scale.set(.95, .85, 2.1);
    const neck = new T.Group(); neck.position.set(0, 1.25, .95); g.add(neck);
    const head = part(this.g.sphere, skin, 0, -.05, .42, neck); head.scale.set(.42, .45, .66);
    part(this.g.sphere, this.m.muzzle, 0, -.18, .72, neck).scale.set(.3, .24, .22);
    for (const s of [-1, 1]) {
      part(this.g.sphere, skin, s * .26, .12, .3, neck).scale.set(.2, .06, .1);
      const horn = part(new T.ConeGeometry(.04, .2, 8), this.m.horn, s * .15, .2, .3, neck); horn.rotation.z = -s * .9;
      part(this.g.eye, this.m.eye, s * .18, .04, .58, neck);
    }
    const legs = [];
    for (const [x, z] of [[-.3, .7], [.3, .7], [-.3, -.75], [.3, -.75]]) { const l = part(this.g.leg, skin, x, .75, z, g); part(new T.CylinderGeometry(.075, .075, .08, 8), this.m.hoof, 0, -.7, 0, l); legs.push(l); }
    part(this.g.sphere, this.m.muzzle, 0, .55, -.4, g).scale.set(.25, .15, .25);
    const tail = new T.Group(); tail.position.set(0, 1.35, -1.05); g.add(tail);
    part(new T.CylinderGeometry(.025, .02, .8, 6).translate(0, -.4, 0), skin, 0, 0, 0, tail);
    return {g, neck, legs, tail, kind: 'cow', size: 2.4};
  }

  sheep() {
    const g = new T.Group();
    const body = part(this.g.woolBody, this.m.wool, 0, .72, 0, g); body.scale.set(.75, .65, 1.1);
    const neck = new T.Group(); neck.position.set(0, .85, .5); g.add(neck);
    part(this.g.sphere, this.m.sheepFace, 0, 0, .18, neck).scale.set(.22, .24, .34);
    part(this.g.woolBody, this.m.wool, 0, .12, .05, neck).scale.set(.26, .16, .22);
    for (const s of [-1, 1]) part(this.g.sphere, this.m.sheepFace, s * .15, .05, .08, neck).scale.set(.14, .05, .07);
    const legs = [];
    for (const [x, z] of [[-.18, .3], [.18, .3], [-.18, -.3], [.18, -.3]]) legs.push(part(this.g.smallLeg, this.m.sheepFace, x, .42, z, g));
    legs.forEach((l) => l.scale.set(1.2, 1.3, 1.2));
    return {g, neck, legs, kind: 'sheep', size: 1.3};
  }

  dog() {
    const g = new T.Group(), fur = pick(this.m.dogs);
    const body = part(this.g.sphere, fur, 0, .5, 0, g); body.scale.set(.32, .34, .8);
    const neck = new T.Group(); neck.position.set(0, .66, .32); g.add(neck);
    part(this.g.sphere, fur, 0, .08, .08, neck).scale.set(.24, .24, .28);
    part(this.g.sphere, fur, 0, .02, .26, neck).scale.set(.13, .12, .2);
    part(this.g.sphere, this.m.nose, 0, .05, .36, neck).scale.set(.05, .04, .04);
    for (const s of [-1, 1]) { const ear = part(this.g.sphere, fur, s * .11, .17, .02, neck); ear.scale.set(.06, .14, .1); ear.rotation.z = s * .4; part(this.g.eye, this.m.eye, s * .07, .12, .2, neck); }
    const legs = [];
    for (const [x, z] of [[-.1, .26], [.1, .26], [-.1, -.26], [.1, -.26]]) legs.push(part(this.g.smallLeg, fur, x, .36, z, g));
    const tail = new T.Group(); tail.position.set(0, .6, -.38); g.add(tail);
    const t = part(new T.CylinderGeometry(.03, .015, .32, 6).translate(0, .16, 0), fur, 0, 0, 0, tail); t.rotation.x = -.7;
    return {g, neck, legs, tail, kind: 'dog', size: .9};
  }

  cat() {
    const g = new T.Group(), fur = pick(this.m.cats);
    const body = part(this.g.sphere, fur, 0, .2, -.04, g); body.scale.set(.18, .26, .26);
    const neck = new T.Group(); neck.position.set(0, .38, .07); g.add(neck);
    part(this.g.sphere, fur, 0, 0, 0, neck).scale.set(.15, .13, .13);
    for (const s of [-1, 1]) { part(new T.ConeGeometry(.035, .07, 4), fur, s * .05, .08, 0, neck); part(this.g.eye, new T.MeshStandardMaterial({color: 0x9ac23a, emissive: 0x2a3a08}), s * .035, .015, .06, neck).scale.setScalar(.6); }
    const legs = [];
    for (const [x, z] of [[-.05, .08], [.05, .08]]) legs.push(part(this.g.catLeg, fur, x, .14, z, g));
    const tail = new T.Group(); tail.position.set(0, .08, -.16); g.add(tail);
    part(new T.CylinderGeometry(.018, .012, .34, 6).translate(0, .17, 0), fur, 0, 0, 0, tail).rotation.x = -1.2;
    return {g, neck, legs, tail, kind: 'cat', size: .5};
  }

  buildAnimals() {
    const makers = [['cow', 10], ['sheep', 12], ['dog', 3], ['cat', 3]];
    for (const [kind, n] of makers) for (let i = 0; i < n; i++) {
      const a = this[kind](); a.phase = rand(0, 6.28); a.z = -1e9; a.visible = true;
      this.scene.add(a.g); this.animals.push(a);
    }
    this.nextHerd = 0;
  }

  // Herds graze in fields well off the road; dogs trot and cats sit near the verge.
  placeAnimal(a, z, side, offset) {
    const r = this.world.road;
    a.z = z; a.side = side; a.offset = offset;
    a.heading = a.kind === 'dog' ? (Math.random() < .5 ? 0 : Math.PI) : rand(0, Math.PI * 2);
    a.speed = a.kind === 'dog' ? rand(1.2, 2.2) : a.kind === 'cat' ? 0 : rand(0, .25);
    a.x = r.x(z) + side * offset;
  }

  respawnAnimals() {
    const s = this.getState(), r = this.world.road, width = this.settings.roadWidth / 2;
    const off = this.settings.location !== 'hills', winter = this.settings.season === 'winter';
    for (const a of this.animals) a.g.visible = !off && !(winter && (a.kind === 'cat'));
    if (off) return;
    const due = this.animals.filter((a) => a.z < s.z - 60 || a.z > s.z + 700);
    const herd = (kind, count) => {
      const list = due.filter((a) => a.kind === kind && !a.claimed).slice(0, count);
      if (!list.length) return;
      const z = s.z + rand(260, 520), side = Math.random() < .5 ? -1 : 1, offset = rand(24, 70);
      list.forEach((a) => { a.claimed = true; this.placeAnimal(a, z + rand(-14, 14), side, offset + rand(-10, 10)); });
    };
    herd('cow', 4 + Math.floor(Math.random() * 3));
    herd('sheep', 5 + Math.floor(Math.random() * 5));
    for (const a of due.filter((x) => (x.kind === 'dog' || x.kind === 'cat') && !x.claimed)) {
      if (Math.random() < .5) { a.claimed = true; this.placeAnimal(a, s.z + rand(220, 600), Math.random() < .5 ? -1 : 1, width + rand(2.8, 5.5)); }
    }
    for (const a of this.animals) a.claimed = false;
  }

  updateAnimals(dt) {
    this.respawnTimer = (this.respawnTimer || 0) - dt;
    if (this.respawnTimer <= 0) { this.respawnAnimals(); this.respawnTimer = 1.2; }
    if (this.settings.location !== 'hills') return;
    const s = this.getState(), off = false, r = this.world.road;
    for (const a of this.animals) {
      if (!a.g.visible || Math.abs(a.z - s.z) > 700) { a.g.position.y = -500; continue; }
      a.phase += dt;
      if (a.speed) {
        a.z += Math.cos(a.heading) * a.speed * dt;
        if (a.kind === 'dog') a.x = r.x(a.z) + a.side * a.offset; else a.x += Math.sin(a.heading) * a.speed * dt;
      }
      const y = this.world.surfaceHeight(a.x, a.z, off);
      if (y < -7) { a.g.position.y = -500; continue; }
      a.g.position.set(a.x, y, a.z);
      a.g.rotation.y = a.kind === 'dog' ? (a.heading === 0 ? Math.atan(r.tangent(a.z)) : Math.atan(r.tangent(a.z)) + Math.PI) : a.heading;
      const walk = a.speed > .05;
      if (a.legs) a.legs.forEach((l, i) => { l.rotation.x = walk ? Math.sin(a.phase * (a.kind === 'dog' ? 11 : 4) + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * .5 : 0; });
      if (a.kind === 'cow' || a.kind === 'sheep') a.neck.rotation.x = .55 + Math.sin(a.phase * .45 + a.z) * .35 + (Math.sin(a.phase * .11) > .6 ? -.8 : 0);
      if (a.kind === 'dog') { a.neck.rotation.x = Math.sin(a.phase * 11) * .04; a.tail.rotation.z = Math.sin(a.phase * 14) * .6; }
      if (a.kind === 'cat') { a.tail.rotation.z = Math.sin(a.phase * 1.3) * .5; a.neck.rotation.y = Math.sin(a.phase * .4) * .7; }
      if (a.kind === 'cow') a.tail.rotation.z = Math.sin(a.phase * 1.7) * .25;
    }
  }

  /* ---------- Cars: oncoming traffic and cars parked on the shoulder ---------- */
  car(type) {
    const g = new T.Group(), paint = new T.MeshPhysicalMaterial({color: pick([0xb9c1c9, 0x1e2d4a, 0x8a1c1f, 0xeeeeee, 0x16171a, 0x3a5a48, 0xc7a452, 0x4a5a70, 0x6b6f75, 0x7a2c52]), roughness: .3, metalness: .55, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.2});
    const specs = {
      sedan: {body: [[-2.25, .32], [-2.3, .72], [-2.05, .86], [-1.25, .9], [.9, .92], [1.7, .82], [2.25, .66], [2.28, .36], [2.05, .26], [-2.05, .26]], cabin: [[-1.5, .88], [-1, 1.42], [.45, 1.44], [1.05, .9]], width: 1.72, wheels: [1.38, -1.38]},
      hatch: {body: [[-1.85, .34], [-1.9, .98], [-1.7, 1.02], [.7, .94], [1.5, .82], [1.95, .64], [1.98, .36], [1.75, .26], [-1.7, .26]], cabin: [[-1.82, .98], [-1.55, 1.48], [.3, 1.5], [.95, .92]], width: 1.66, wheels: [1.2, -1.2]},
      suv: {body: [[-2.3, .42], [-2.34, 1.1], [-2.1, 1.16], [1.1, 1.12], [1.9, 1.0], [2.32, .82], [2.34, .46], [2.1, .34], [-2.1, .34]], cabin: [[-2.2, 1.12], [-2.02, 1.78], [.55, 1.8], [1.25, 1.14]], width: 1.86, wheels: [1.45, -1.45], big: true},
      van: {body: [[-2.5, .38], [-2.52, 2.05], [-2.35, 2.12], [1.35, 2.1], [2.35, 1.2], [2.5, .9], [2.52, .42], [2.3, .32], [-2.3, .32]], cabin: [[1.2, 1.95], [1.4, 2.0], [2.28, 1.24], [1.9, 1.2]], width: 1.9, wheels: [1.6, -1.6], big: true},
    }[type];
    part(extruded(specs.body, specs.width - .1), paint, 0, 0, 0, g);
    part(extruded(specs.cabin, specs.width - .26, .06), this.m.glass, 0, 0, 0, g);
    const r = specs.big ? 1.1 : 1, hw = specs.width / 2;
    for (const z of specs.wheels) for (const x of [-hw + .1, hw - .1]) { part(this.g.wheel, this.m.tyre, x, .33 * r, z, g).scale.setScalar(r); part(this.g.rim, this.m.rim, x * 1.01, .33 * r, z, g).scale.setScalar(r); }
    const front = specs.body.reduce((m, p) => Math.max(m, p[0]), -9), back = specs.body.reduce((m, p) => Math.min(m, p[0]), 9);
    const lamps = {head: [], tail: []};
    for (const s of [-1, 1]) {
      lamps.head.push(part(this.g.lamp, this.m.head, s * (hw - .28), .66, front + .03, g));
      lamps.tail.push(part(this.g.lamp, this.m.tail, s * (hw - .26), .76, back - .03, g));
    }
    part(new T.BoxGeometry(.5, .13, .03), this.m.plate, 0, .45, back - .06, g);
    part(new T.BoxGeometry(specs.width - .2, .16, .08), this.m.trim, 0, .34, front + .02, g);
    const beam = new T.Mesh(this.g.beam, this.m.beam); beam.position.set(0, .04, front + 4); g.add(beam);
    return {g, beam, length: front - back};
  }

  buildTraffic() {
    const types = ['sedan', 'hatch', 'suv', 'van', 'sedan', 'hatch', 'sedan', 'suv'];
    for (let i = 0; i < 6; i++) { const c = this.car(types[i % types.length]); c.z = -1e9; this.scene.add(c.g); this.traffic.push(c); }
    for (let i = 0; i < 2; i++) { const c = this.car(types[(i + 3) % types.length]); c.z = -1e9; c.beam.visible = false; this.scene.add(c.g); this.parked.push(c); }
  }

  laneOffset() { const lane = this.settings.autoLane; return lane === 'right' ? -2.4 : 2.4; }

  updateTraffic(dt) {
    const s = this.getState(), r = this.world.road, off = this.settings.location !== 'hills';
    const night = this.settings.time === 'night' || this.settings.weather === 'rain';
    this.m.head.emissiveIntensity = night ? 3 : .2; this.m.tail.emissiveIntensity = night ? 1.6 : .4; this.m.beam.opacity = this.settings.time === 'night' ? .32 : this.settings.weather === 'rain' ? .12 : 0;
    const oncoming = -Math.sign(this.laneOffset()) * 2.55, width = this.settings.roadWidth / 2;
    const count = this.settings.quality === 'low' ? 3 : 6;
    this.traffic.forEach((c, i) => {
      c.g.visible = !off && i < count;
      if (!c.g.visible) return;
      if (c.z < s.z - 60 || c.z > s.z + 900) { c.z = s.z + rand(280, 820); c.cruise = rand(13, 21); c.speed = c.cruise; }
      c.z -= c.speed * dt;
      const x = r.x(c.z) + oncoming, y = r.y(c.z) + .06;
      c.g.position.set(x, y, c.z);
      c.g.rotation.set(0, Math.atan(r.tangent(c.z)) + Math.PI, 0);
    });
    this.parked.forEach((c) => {
      if (off) { c.g.visible = false; return; }
      if (c.z < s.z - 60 || c.z > s.z + 900) this.parkCar(c, s.z);
      c.g.visible = c.spot;
    });
    // Oncoming cars brake to a stop when your car is in their lane ahead of them.
    this.traffic.forEach((c) => {
      if (!c.g.visible) return;
      const x = c.g.position.x, gap = c.z - s.z, blocked = gap > -1 && gap < 42 && Math.abs(s.x - x) < 2.4;
      const target = blocked ? 0 : c.cruise;
      c.speed = c.speed > target ? Math.max(target, c.speed - (blocked ? 9 : 3) * dt) : Math.min(target, c.speed + 2.5 * dt);
    });
  }

  // Park on the shoulder only where the ground is level, resting the car on its wheels.
  parkCar(c, fromZ) {
    const r = this.world.road, width = this.settings.roadWidth / 2;
    c.spot = false;
    for (let attempt = 0; attempt < 10 && !c.spot; attempt++) {
      const z = fromZ + rand(250, 850), railSide = (Math.floor(Math.floor(z / 240) / 3) % 3 === 0) ? 1 : -1, side = -railSide;
      const yaw = Math.atan(r.tangent(z)) + (side > 0 ? 0 : Math.PI), x = r.x(z) + side * (width + 2.2);
      const fx = Math.sin(yaw) * 1.7, fz = Math.cos(yaw) * 1.7, rx = Math.cos(yaw) * .8, rz = -Math.sin(yaw) * .8, h = (px, pz) => this.world.surfaceHeight(px, pz, false);
      const hf = h(x + fx, z + fz), hb = h(x - fx, z - fz), hr = h(x + rx, z + rz), hl = h(x - rx, z - rz);
      if (Math.abs(hf - hb) > .5 || Math.abs(hr - hl) > .3 || Math.min(hf, hb, hr, hl) < -6) continue;
      c.z = z; c.spot = true;
      c.g.rotation.order = 'YXZ';
      c.g.rotation.set(-Math.atan2(hf - hb, 3.4), yaw, Math.atan2(hr - hl, 1.6));
      c.g.position.set(x, (hf + hb + hr + hl) / 4 + .02, z);
    }
    if (!c.spot) c.z = fromZ + 400;
  }

  // Solid bodies near a point, for the player's collisions.
  colliders(x, z, range) {
    const out = [], add = (px, pz, r) => { if (Math.abs(px - x) < range && Math.abs(pz - z) < range) out.push({x: px, z: pz, r}); };
    for (const c of [...this.traffic, ...this.parked]) {
      if (!c.g.visible) continue;
      const yaw = c.g.rotation.y, q = c.length / 4, px = c.g.position.x, pz = c.g.position.z;
      add(px + Math.sin(yaw) * q, pz + Math.cos(yaw) * q, .95); add(px - Math.sin(yaw) * q, pz - Math.cos(yaw) * q, .95);
    }
    for (const a of this.animals) if (a.g.visible && a.g.position.y > -400 && a.kind !== 'cat') add(a.x, a.z, a.kind === 'cow' ? 1 : a.kind === 'sheep' ? .55 : .35);
    return out;
  }

  update(dt) {
    this.updateAnimals(dt);
    this.updateTraffic(dt);
  }
}
