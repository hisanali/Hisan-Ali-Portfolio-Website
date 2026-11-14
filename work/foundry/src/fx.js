/* Sparks, embers, smoke and steam. */
import * as THREE from 'three';
import { rng, clamp } from './util.js';

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* Struck sparks: thrown, pulled down, bouncing off the plate, cooling from white through orange. */
export function makeSparks(scene, count) {
  const pos = new Float32Array(count * 3).fill(-999), vel = new Float32Array(count * 3), life = new Float32Array(count), span = new Float32Array(count).fill(1);
  const tails = new Float32Array(count * 6).fill(-999), tcol = new Float32Array(count * 6), hcol = new Float32Array(count * 3);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(tails, 3)); lg.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(hcol, 3));
  const common = { vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false };
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial(common));
  const heads = new THREE.Points(pg, new THREE.PointsMaterial(Object.assign({ size: .075, sizeAttenuation: true, map: dotTexture() }, common)));
  lines.frustumCulled = heads.frustumCulled = false; scene.add(lines, heads);
  const rnd = rng(21); let next = 0, alive = 0;
  function burst(x, y, z, n, speed, dirX = 0, dirY = 1, dirZ = 1) {
    for (let k = 0; k < n; k++) {
      const i = next; next = (next + 1) % count;
      const a = rnd() * Math.PI * 2, s = speed * (.25 + rnd() * rnd() * 1.1), up = .2 + rnd() * .9;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      vel[i * 3] = (Math.cos(a) * .8 + dirX) * s; vel[i * 3 + 1] = (up + dirY * .4) * s; vel[i * 3 + 2] = (Math.sin(a) * .8 + dirZ) * s;
      span[i] = .45 + rnd() * 1.1; life[i] = span[i];
    }
    alive = Math.max(alive, 2);
  }
  function update(dt) {
    if (alive <= 0) return;
    let any = false;
    for (let i = 0; i < count; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt; const j = i * 3;
      if (life[i] <= 0) { pos[j + 1] = -999; tails[i * 6 + 1] = tails[i * 6 + 4] = -999; hcol[j] = hcol[j + 1] = hcol[j + 2] = 0; continue; }
      any = true;
      vel[j + 1] -= 9.8 * dt; vel[j] *= 1 - dt * .6; vel[j + 2] *= 1 - dt * .6;
      pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
      if (pos[j + 1] < .012) { pos[j + 1] = .012; vel[j + 1] = Math.abs(vel[j + 1]) * .32; vel[j] *= .55; vel[j + 2] *= .55; }
      const k = clamp(life[i] / span[i]), r = 10 * k + .8, g = 7.5 * k * k + .15, b = 4.6 * k * k * k, t = i * 6, tl = .032;
      hcol[j] = r; hcol[j + 1] = g; hcol[j + 2] = b;
      tails[t] = pos[j]; tails[t + 1] = pos[j + 1]; tails[t + 2] = pos[j + 2];
      tails[t + 3] = pos[j] - vel[j] * tl; tails[t + 4] = Math.max(.012, pos[j + 1] - vel[j + 1] * tl); tails[t + 5] = pos[j + 2] - vel[j + 2] * tl;
      tcol[t] = r; tcol[t + 1] = g; tcol[t + 2] = b; tcol[t + 3] = r * .1; tcol[t + 4] = g * .05; tcol[t + 5] = 0;
    }
    for (const g of [lg, pg]) { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; }
    if (!any) alive -= dt;
  }
  return { burst, update, objects: [lines, heads] };
}

/* Embers that lift off hot metal and wander upward. */
export function makeEmbers(scene, count) {
  const seed = new Float32Array(count * 4), rnd = rng(5);
  for (let i = 0; i < seed.length; i++) seed[i] = rnd();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const uniforms = { uTime: { value: 0 }, uOrigin: { value: new THREE.Vector3() }, uSpan: { value: new THREE.Vector2(3, 1) }, uAmt: { value: 0 }, uScale: { value: 500 } };
  const points = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`uniform float uTime,uAmt,uScale; uniform vec3 uOrigin; uniform vec2 uSpan; attribute vec4 aSeed; varying float vA;
      void main(){ float life=fract(uTime*(.05+.09*aSeed.x)+aSeed.y);
        vec3 p=uOrigin+vec3((aSeed.z-.5)*2.*uSpan.x+sin(uTime*.7+aSeed.w*40.+life*6.)*.35*life, uSpan.y*aSeed.w*.8+life*(2.2+2.6*aSeed.x), (aSeed.x-.5)*.9+cos(uTime*.5+aSeed.z*30.)*.3*life);
        vec4 mv=viewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
        gl_PointSize=(.016+.03*aSeed.w)*uScale/-mv.z;
        vA=smoothstep(0.,.08,life)*pow(1.-life,1.5)*uAmt*step(aSeed.y,.25+.75*uAmt); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vec3(6.,2.4,.5)*vA*a*a,1.); }`
  }));
  points.frustumCulled = false; scene.add(points);
  return { uniforms, object: points };
}

/* Smoke off hot scale, and the white steam of a quench. */
export function makeSmoke(scene, count) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), img = x.createImageData(128, 128), rnd = rng(13);
  const blobs = Array.from({ length: 9 }, () => [30 + rnd() * 68, 30 + rnd() * 68, 16 + rnd() * 26]);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
    let a = 0; for (const [bx, by, br] of blobs) a += Math.max(0, 1 - Math.hypot(i - bx, j - by) / br) ** 2;
    const edge = Math.max(0, 1 - Math.hypot(i - 64, j - 64) / 62), k = (j * 128 + i) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = Math.min(1, a * .55) * edge * 255;
  }
  x.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c), puffs = [], group = new THREE.Group(); scene.add(group);
  for (let i = 0; i < count; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false; group.add(s); puffs.push({ s, age: 1, life: 1, vx: 0, vy: 0, vz: 0, size: 1, grow: 1, peak: 0 });
  }
  let next = 0;
  function emit(px, py, pz, steam, warm = 0) {
    const p = puffs[next]; next = (next + 1) % count;
    p.s.position.set(px, py, pz); p.age = 0; p.s.visible = true; p.s.material.rotation = rnd() * 6.28;
    if (steam) { p.life = 1.6 + rnd() * 1.6; p.vx = (rnd() - .5) * 1.4; p.vy = 1.6 + rnd() * 2.4; p.vz = (rnd() - .2) * 1.2; p.size = .5 + rnd() * .5; p.grow = 2.4 + rnd() * 1.6; p.peak = .26; p.s.material.color.setRGB(.8, .86, .95); }
    else { p.life = 3 + rnd() * 3; p.vx = (rnd() - .5) * .25; p.vy = .45 + rnd() * .5; p.vz = (rnd() - .5) * .2; p.size = .5 + rnd() * .5; p.grow = .7 + rnd() * .6; p.peak = .05 + .05 * rnd(); p.s.material.color.setRGB(.13 + warm * .3, .115 + warm * .1, .11 + warm * .02); }
  }
  function update(dt) {
    for (const p of puffs) {
      if (!p.s.visible) continue;
      p.age += dt; const k = p.age / p.life;
      if (k >= 1) { p.s.visible = false; p.s.material.opacity = 0; continue; }
      p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt; p.vy *= 1 - dt * .25;
      p.s.scale.setScalar(p.size + p.grow * p.age);
      p.s.material.opacity = p.peak * Math.min(1, k * 6) * (1 - k) ** 1.4;
    }
  }
  return { emit, update, group };
}
