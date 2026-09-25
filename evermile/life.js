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
  // Jointed leg: a hip pivot with the upper leg, and a knee pivot with the lower leg and hoof or paw.
  leg(parent, x, y, z, upper, lower, r, mat, foot) {
    const hip = new T.Group(); hip.position.set(x, y, z); parent.add(hip);
    part(new T.CylinderGeometry(r, r * .8, upper, 10).translate(0, -upper / 2, 0), mat, 0, 0, 0, hip);
    const knee = new T.Group(); knee.position.y = -upper; hip.add(knee);
    part(new T.CylinderGeometry(r * .75, r * .62, lower, 10).translate(0, -lower / 2, 0), mat, 0, 0, 0, knee);
    if (foot) part(new T.CylinderGeometry(r * .78, r * .9, r * 1.1, 10), foot, 0, -lower - r * .35, 0, knee);
    return {hip, knee};
  }

  cow() {
    const g = new T.Group(), skin = Math.random() < .6 ? this.m.cow : this.m.brownCow, S = this.g.sphere;
    part(S, skin, 0, 1.12, .05, g).scale.set(.92, .82, 1.75);
    part(S, skin, 0, 1.18, .72, g).scale.set(.82, .86, .8);
    part(S, skin, 0, 1.16, -.72, g).scale.set(.86, .82, .9);
    part(S, this.m.muzzle, 0, .74, -.45, g).scale.set(.3, .16, .3);
    const neck = new T.Group(); neck.position.set(0, 1.34, 1.02); g.add(neck);
    const n = part(new T.CylinderGeometry(.2, .3, .62, 12), skin, 0, -.12, .2, neck); n.rotation.x = 1.1;
    const head = new T.Group(); head.position.set(0, -.3, .5); neck.add(head);
    part(new RoundedBoxGeometry(.34, .4, .56, 3, .12), skin, 0, 0, 0, head);
    part(new RoundedBoxGeometry(.3, .24, .2, 3, .08), this.m.muzzle, 0, -.1, .3, head);
    for (const s of [-1, 1]) {
      part(this.g.eye, this.m.eye, s * .17, .08, .12, head);
      const ear = part(S, skin, s * .26, .12, -.08, head); ear.scale.set(.22, .07, .12); ear.rotation.z = s * .3;
      const horn = part(new T.ConeGeometry(.035, .18, 8), this.m.horn, s * .13, .24, -.12, head); horn.rotation.z = -s * .8;
      part(new T.SphereGeometry(.02, 6, 4), this.m.nose, s * .05, -.14, .41, head);
    }
    const legs = [[-.3, .7], [.3, .7], [-.3, -.72], [.3, -.72]].map(([x, z]) => this.leg(g, x, .95, z, .45, .42, .1, skin, this.m.hoof));
    const tail = new T.Group(); tail.position.set(0, 1.42, -1.12); g.add(tail);
    part(new T.CylinderGeometry(.025, .018, .85, 6).translate(0, -.42, 0), skin, 0, 0, 0, tail);
    part(S, this.m.hoof, 0, -.88, 0, tail).scale.set(.07, .14, .07);
    return {g, neck, head, legs, tail, kind: 'cow', size: 2.4, gait: 3.6};
  }

  sheep() {
    const g = new T.Group();
    for (const [x, y, z, s] of [[0, .78, .05, 1], [.12, .86, .32, .7], [-.12, .86, .3, .7], [.14, .84, -.26, .72], [-.14, .84, -.28, .72], [0, .98, 0, .62], [0, .74, .42, .6], [0, .76, -.44, .62]]) {
      const lump = part(this.g.woolBody, this.m.wool, x, y, z, g); lump.scale.setScalar(.5 * s); lump.rotation.set(rand(0, 3), rand(0, 3), 0);
    }
    const neck = new T.Group(); neck.position.set(0, .88, .52); g.add(neck);
    const head = new T.Group(); head.position.set(0, -.04, .14); neck.add(head);
    part(new RoundedBoxGeometry(.18, .22, .3, 3, .07), this.m.sheepFace, 0, 0, .06, head);
    part(this.g.woolBody, this.m.wool, 0, .12, -.04, head).scale.set(.24, .14, .2);
    for (const s of [-1, 1]) { const ear = part(this.g.sphere, this.m.sheepFace, s * .13, .05, -.02, head); ear.scale.set(.14, .045, .07); part(this.g.eye, this.m.eye, s * .08, .05, .12, head).scale.setScalar(.8); }
    const legs = [[-.16, .3], [.16, .3], [-.16, -.3], [.16, -.3]].map(([x, z]) => this.leg(g, x, .58, z, .26, .28, .04, this.m.sheepFace, this.m.hoof));
    return {g, neck, head, legs, kind: 'sheep', size: 1.3, gait: 4.5};
  }

  dog() {
    const g = new T.Group(), fur = pick(this.m.dogs), S = this.g.sphere;
    part(S, fur, 0, .56, .14, g).scale.set(.3, .36, .42);
    part(S, fur, 0, .54, -.2, g).scale.set(.25, .28, .36);
    const neck = new T.Group(); neck.position.set(0, .68, .32); g.add(neck);
    part(new T.CylinderGeometry(.08, .11, .22, 10), fur, 0, .05, .04, neck).rotation.x = -.6;
    const head = new T.Group(); head.position.set(0, .16, .12); neck.add(head);
    part(S, fur, 0, 0, 0, head).scale.set(.22, .22, .24);
    part(new RoundedBoxGeometry(.11, .1, .18, 2, .04), fur, 0, -.04, .16, head);
    part(S, this.m.nose, 0, -.02, .26, head).scale.set(.045, .035, .035);
    for (const s of [-1, 1]) { const ear = part(S, fur, s * .1, .06, -.02, head); ear.scale.set(.05, .14, .09); ear.rotation.z = s * .5; part(this.g.eye, this.m.eye, s * .065, .04, .1, head); }
    const legs = [[-.1, .24], [.1, .24], [-.1, -.28], [.1, -.28]].map(([x, z]) => this.leg(g, x, .44, z, .2, .22, .038, fur));
    const tail = new T.Group(); tail.position.set(0, .64, -.46); g.add(tail);
    part(new T.CylinderGeometry(.028, .012, .34, 6).translate(0, .17, 0), fur, 0, 0, 0, tail).rotation.x = -.8;
    return {g, neck, head, legs, tail, kind: 'dog', size: .9, gait: 10};
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
      if (a.legs) a.legs.forEach((l, i) => {
        if (!l.hip) { l.rotation.x = 0; return; }
        const swing = walk ? Math.sin(a.phase * a.gait + (i === 0 || i === 3 ? 0 : Math.PI)) : 0;
        l.hip.rotation.x = swing * .42;
        l.knee.rotation.x = walk ? (i < 2 ? Math.max(0, -swing) * .7 : -Math.max(0, swing) * .6) : 0;
      });
      if (a.kind === 'cow' || a.kind === 'sheep') { const grazing = Math.sin(a.phase * .11 + a.z) < .5; a.neck.rotation.x = grazing ? .75 + Math.sin(a.phase * 1.3) * .08 : Math.sin(a.phase * .4) * .12; if (a.head) a.head.rotation.x = grazing ? .35 : 0; }
      if (a.kind === 'dog') { a.neck.rotation.x = Math.sin(a.phase * 11) * .04; a.tail.rotation.z = Math.sin(a.phase * 14) * .6; }
      if (a.kind === 'cat') { a.tail.rotation.z = Math.sin(a.phase * 1.3) * .5; a.neck.rotation.y = Math.sin(a.phase * .4) * .7; }
      if (a.kind === 'cow') a.tail.rotation.z = Math.sin(a.phase * 1.7) * .25;
    }
  }

  /* ---------- Cars: a shaped body with painted-in glass, oncoming and same-direction traffic, parked cars ---------- */
  // The body is a finely divided box bent to a side profile (bonnet, windscreen, roof, rear) with the glasshouse tapered in;
  // window areas are coloured dark glass through vertex colours so pillars and panels read correctly.
  bodyGeometry(spec, paintColor) {
    const {L, W, clear, belt, top, glass} = spec, seg = [14, 10, 44];
    const g = new T.BoxGeometry(2, 1, 2, ...seg), pos = g.attributes.position, colors = [];
    const profile = (w) => { for (let i = 0; i < top.length - 1; i++) { const [w0, y0] = top[i], [w1, y1] = top[i + 1]; if (w <= w0 && w >= w1) { const t = (w0 - w) / (w0 - w1); const s = t * t * (3 - 2 * t); return y0 + (y1 - y0) * s; } } return top[top.length - 1][1]; };
    const paint = new T.Color(paintColor), dark = new T.Color(0x0c1218), trim = new T.Color(0x14171a), c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i), v = pos.getY(i) + .5, w = pos.getZ(i) / 1, roof = profile(w);
      const lift = Math.pow(Math.max(0, Math.abs(w) - .88) / .12, 2) * .1;
      const y = clear + lift + v * (roof - clear - lift);
      let half = W / 2;
      if (y > belt) half *= 1 - Math.min(1, (y - belt) / Math.max(.2, roof - belt)) * .2;
      half *= 1 - Math.pow(Math.max(0, Math.abs(w) - .78) / .22, 2) * .16;
      half *= 1 - Math.pow(Math.max(0, 1 - (y - clear) / .12), 2) * .06;
      pos.setXYZ(i, u * half, y, w * L / 2);
      const side = Math.abs(u) > .99, topFace = v > .99;
      let isGlass = false;
      if (y > belt + .05 && y < roof - .05 && side && w < glass.side[0] && w > glass.side[1] && !(w < glass.b[0] && w > glass.b[1])) isGlass = true;
      if (topFace && Math.abs(u) < .86 && ((w < glass.front[0] && w > glass.front[1]) || (w < glass.rear[0] && w > glass.rear[1]))) isGlass = true;
      const sill = y < clear + .1 || (!topFace && Math.abs(w) > .985 && y < clear + .32);
      c.copy(isGlass ? dark : sill ? trim : paint);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }

  car(type) {
    const specs = {
      sedan: {L: 4.6, W: 1.8, clear: .26, belt: .95, wheelbase: 1.38, top: [[1, .62], [.93, .84], [.62, .95], [.38, .99], [.1, 1.42], [-.36, 1.44], [-.6, 1.04], [-.9, .99], [-1, .8]], glass: {front: [.36, .12], rear: [-.38, -.58], side: [.33, -.56], b: [-.08, -.16]}},
      hatch: {L: 4.1, W: 1.74, clear: .26, belt: .97, wheelbase: 1.24, top: [[1, .62], [.93, .83], [.64, .95], [.42, .99], [.13, 1.46], [-.74, 1.45], [-.9, 1.2], [-.97, .95], [-1, .76]], glass: {front: [.4, .15], rear: [-.73, -.94], side: [.38, -.72], b: [-.1, -.19]}},
      suv: {L: 4.7, W: 1.9, clear: .38, belt: 1.18, wheelbase: 1.45, top: [[1, .78], [.93, 1.04], [.64, 1.16], [.44, 1.2], [.18, 1.76], [-.82, 1.78], [-.95, 1.6], [-1, 1.06]], glass: {front: [.42, .2], rear: [-.8, -.975], side: [.4, -.8], b: [-.1, -.18]}},
      van: {L: 5.0, W: 1.96, clear: .32, belt: 1.25, wheelbase: 1.62, top: [[1, .74], [.94, 1.02], [.8, 1.26], [.6, 1.4], [.42, 2.02], [-.97, 2.06], [-1, 1.8]], glass: {front: [.58, .44], rear: [-2, -3], side: [.56, .18], b: [.3, .26]}},
    }[type];
    const color = pick([0xb9c1c9, 0x1e2d4a, 0x8a1c1f, 0xeeeeee, 0x16171a, 0x3a5a48, 0xc7a452, 0x4a5a70, 0x6b6f75, 0x7a2c52, 0xdcdcd8, 0x2a3440]);
    const g = new T.Group(), hw = specs.W / 2, front = specs.L / 2, back = -specs.L / 2;
    part(this.bodyGeometry(specs, color), this.m.bodyPaint, 0, 0, 0, g);
    const r = type === 'suv' || type === 'van' ? 1.12 : 1;
    for (const z of [specs.wheelbase, -specs.wheelbase]) for (const x of [-hw + .12, hw - .12]) {
      part(this.g.wheel, this.m.tyre, x, .33 * r, z, g).scale.setScalar(r);
      part(this.g.rim, this.m.rim, x + Math.sign(x) * .02, .33 * r, z, g).scale.setScalar(r);
    }
    const lamps = {head: [], tail: []}, hy = specs.top[1][1] - .08, ty = specs.top[specs.top.length - 2][1] - .12;
    for (const s of [-1, 1]) {
      lamps.head.push(part(new RoundedBoxGeometry(.42, .1, .06, 2, .03), this.m.head, s * (hw - .32), hy, front - .02, g));
      lamps.tail.push(part(new RoundedBoxGeometry(.38, .09, .05, 2, .025), this.m.tail, s * (hw - .28), ty, back + .02, g));
      const mirror = part(new RoundedBoxGeometry(.16, .1, .12, 2, .04), this.m.bodyTrim, s * (hw + .06), specs.belt + .08, specs.L * .5 * specs.glass.side[0] - .05, g);
      mirror.scale.x = 1.2;
    }
    part(new RoundedBoxGeometry(specs.W * .46, .16, .05, 2, .03), this.m.grille, 0, specs.top[0][1] - .06, front - .02, g);
    part(new T.BoxGeometry(.5, .13, .03), this.m.plate, 0, specs.clear + .2, back + .01, g);
    part(new T.BoxGeometry(.5, .11, .03), this.m.plate, 0, specs.clear + .16, front - .01, g);
    const beam = new T.Mesh(this.g.beam, this.m.beam); beam.position.set(0, .04, front + 4); g.add(beam);
    return {g, beam, length: specs.L, lamps};
  }

  buildTraffic() {
    this.m.bodyPaint = new T.MeshPhysicalMaterial({vertexColors: true, roughness: .28, metalness: .5, clearcoat: 1, clearcoatRoughness: .07, envMapIntensity: 1.3});
    this.m.bodyTrim = new T.MeshStandardMaterial({color: 0x15181b, roughness: .5});
    this.m.grille = new T.MeshStandardMaterial({color: 0x0e1012, roughness: .45, metalness: .5});
    this.m.flash = new T.MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 6});
    const types = ['sedan', 'hatch', 'suv', 'van', 'sedan', 'hatch', 'suv', 'sedan'];
    for (let i = 0; i < 6; i++) { const c = this.car(types[i % types.length]); c.z = -1e9; c.dir = -1; this.scene.add(c.g); this.traffic.push(c); }
    for (let i = 0; i < 3; i++) { const c = this.car(types[(i + 2) % types.length]); c.z = -1e9; c.dir = 1; this.scene.add(c.g); this.traffic.push(c); }
    for (let i = 0; i < 2; i++) { const c = this.car(types[(i + 3) % types.length]); c.z = -1e9; c.beam.visible = false; this.scene.add(c.g); this.parked.push(c); }
  }

  laneOffset() { const lane = this.settings.autoLane; return lane === 'right' ? -2.4 : 2.4; }

  // Honking makes nearby oncoming drivers flash their headlights back.
  honk() {
    const s = this.getState();
    for (const c of this.traffic) if (c.dir < 0 && c.g.visible && c.z > s.z && c.z - s.z < 180) c.flashAt = performance.now() + rand(250, 700);
  }

  // Nearest same-direction car ahead in the player's lane, so autodrive can follow it.
  leadAhead(s) {
    let best = null;
    for (const c of this.traffic) {
      if (c.dir < 0 || !c.g.visible) continue;
      const gap = c.z - s.z;
      if (gap > 0 && gap < 90 && Math.abs(c.g.position.x - s.x) < 2.2 && (!best || gap < best.gap)) best = {gap, speed: c.speed, car: c};
    }
    return best;
  }

  // No oncoming car within this distance ahead, so it is safe to overtake.
  oncomingClear(s, range) {
    return !this.traffic.some((c) => c.dir < 0 && c.g.visible && c.z > s.z - 10 && c.z - s.z < range);
  }

  updateTraffic(dt) {
    const s = this.getState(), r = this.world.road, off = this.settings.location !== 'hills';
    const night = this.settings.time === 'night' || this.settings.weather === 'rain';
    this.m.head.emissiveIntensity = night ? 3 : .2; this.m.tail.emissiveIntensity = night ? 1.6 : .4; this.m.beam.opacity = this.settings.time === 'night' ? .32 : this.settings.weather === 'rain' ? .12 : 0;
    const lane = this.laneOffset(), oncoming = -Math.sign(lane) * 2.55, width = this.settings.roadWidth / 2, now = performance.now();
    const limit = this.settings.quality === 'low' ? [3, 1] : [6, 3];
    let shown = [0, 0];
    for (const c of this.traffic) {
      const k = c.dir < 0 ? 0 : 1;
      const enabled = (c.dir < 0 ? this.settings.trafficOncoming : this.settings.trafficOwn) !== 'off';
      c.g.visible = !off && enabled && shown[k] < limit[k]; shown[k]++;
      if (!c.g.visible) { c.z = -1e9; continue; }
      if (c.dir < 0) {
        if (c.z < s.z - 60 || c.z > s.z + 900) { c.z = s.z + rand(280, 820); c.cruise = rand(13, 21); c.speed = c.cruise; }
      } else if (c.z < s.z - 90 || c.z > s.z + 700) { c.z = s.z + rand(160, 600); c.cruise = rand(13, 18.5); c.speed = c.cruise; }
      c.z += c.dir * c.speed * dt;
      const x = r.x(c.z) + (c.dir < 0 ? oncoming : lane), y = r.y(c.z) + .06;
      c.g.position.set(x, y, c.z);
      c.g.rotation.set(0, Math.atan(r.tangent(c.z)) + (c.dir < 0 ? Math.PI : 0), 0);
      // Any car stops for yours when you are in its lane just ahead; same-direction cars also keep their distance behind you.
      const gap = (c.z - s.z) * -c.dir, blocked = gap > -1 && gap < (c.dir < 0 ? 42 : 26) && Math.abs(s.x - x) < 2.4;
      const target = blocked ? (c.dir > 0 ? Math.max(0, Math.min(c.cruise, s.speed - 1)) : 0) : c.cruise;
      c.speed = c.speed > target ? Math.max(target, c.speed - (blocked ? 9 : 3) * dt) : Math.min(target, c.speed + 2.5 * dt);
      const flashing = c.flashAt && now > c.flashAt && now < c.flashAt + 520 && (Math.floor((now - c.flashAt) / 130) % 2 === 0);
      for (const l of c.lamps.head) l.material = flashing ? this.m.flash : this.m.head;
      c.beam.visible = c.dir < 0 || this.settings.time === 'night';
    }
    this.parked.forEach((c) => {
      if (off) { c.g.visible = false; return; }
      if (c.z < s.z - 60 || c.z > s.z + 900) this.parkCar(c, s.z);
      c.g.visible = c.spot;
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
