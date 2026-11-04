import * as T from './vendor/three.module.js';

// Rubber on the road: a ring of quads laid behind each tyre while it slides or locks, fading over a few minutes.
// One mesh, one draw call; segments are reused oldest first.
export class SkidMarks {
  constructor(scene, count = 2400) {
    this.count = count; this.next = 0; this.last = new Map(); this.time = 0;
    const g = new T.BufferGeometry();
    this.position = new Float32Array(count * 6 * 3); this.alpha = new Float32Array(count * 6); this.born = new Float32Array(count * 6).fill(-1e6);
    g.setAttribute('position', new T.BufferAttribute(this.position, 3));
    g.setAttribute('alpha', new T.BufferAttribute(this.alpha, 1));
    g.setAttribute('born', new T.BufferAttribute(this.born, 1));
    this.material = new T.ShaderMaterial({
      uniforms: {time: {value: 0}, life: {value: 240}, tint: {value: new T.Color(0x0b0d0e)}},
      vertexShader: `attribute float alpha,born;uniform float time,life;varying float vA;
        void main(){float age=time-born;vA=alpha*(1.-smoothstep(life*.5,life,age))*step(0.,age);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform vec3 tint;varying float vA;void main(){if(vA<=.003)discard;gl_FragColor=vec4(tint,vA);}`,
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    this.mesh = new T.Mesh(g, this.material); this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; scene.add(this.mesh);
    this.dirty = false;
  }
  // A tyre at (x, y, z) heading `yaw` is leaving a mark of `strength` (0..1). Call every frame; segments are laid
  // every ~0.3 m of travel and the mark closes off (so the next one starts fresh) when strength drops to zero.
  mark(key, x, y, z, yaw, strength, width = .22) {
    const prev = this.last.get(key);
    if (strength <= .02) { if (prev) this.last.delete(key); return; }
    if (!prev) { this.last.set(key, {x, y, z, s: strength}); return; }
    const dx = x - prev.x, dz = z - prev.z, d = Math.hypot(dx, dz);
    if (d < .3) return;
    if (d > 4) { this.last.set(key, {x, y, z, s: strength}); return; }
    const nx = -dz / d * width / 2, nz = dx / d * width / 2, i = this.next; this.next = (this.next + 1) % this.count;
    const y0 = prev.y + .015, y1 = y + .015, a0 = prev.s * .55, a1 = strength * .55;
    const quad = [[prev.x - nx, y0, prev.z - nz, a0], [prev.x + nx, y0, prev.z + nz, a0], [x + nx, y1, z + nz, a1], [prev.x - nx, y0, prev.z - nz, a0], [x + nx, y1, z + nz, a1], [x - nx, y1, z - nz, a1]];
    for (let k = 0; k < 6; k++) { const v = quad[k], o = i * 6 + k; this.position[o * 3] = v[0]; this.position[o * 3 + 1] = v[1]; this.position[o * 3 + 2] = v[2]; this.alpha[o] = v[3]; this.born[o] = this.time; }
    this.last.set(key, {x, y, z, s: strength}); this.dirty = true;
  }
  update(dt) {
    this.time += dt; this.material.uniforms.time.value = this.time;
    if (!this.dirty) return; this.dirty = false;
    const a = this.mesh.geometry.attributes; a.position.needsUpdate = a.alpha.needsUpdate = a.born.needsUpdate = true;
  }
  clear() { this.born.fill(-1e6); this.mesh.geometry.attributes.born.needsUpdate = true; this.last.clear(); }
}
