import * as T from './vendor/three.module.js';

// Dust thrown up behind the wheels off the tarmac, and tyre smoke when rubber slides on it. A pool of soft
// billboards animated entirely in the shader from their birth time, so emitting costs one attribute write.
export class Dust {
  constructor(scene, count = 700) {
    this.count = count; this.next = 0; this.time = 0; this.dirty = false;
    const g = new T.BufferGeometry();
    this.origin = new Float32Array(count * 3); this.velocity = new Float32Array(count * 3); this.born = new Float32Array(count).fill(-1e6); this.life = new Float32Array(count); this.kind = new Float32Array(count); this.size = new Float32Array(count);
    g.setAttribute('position', new T.BufferAttribute(this.origin, 3));
    g.setAttribute('velocity', new T.BufferAttribute(this.velocity, 3));
    g.setAttribute('born', new T.BufferAttribute(this.born, 1));
    g.setAttribute('life', new T.BufferAttribute(this.life, 1));
    g.setAttribute('kind', new T.BufferAttribute(this.kind, 1));
    g.setAttribute('size', new T.BufferAttribute(this.size, 1));
    this.material = new T.ShaderMaterial({
      uniforms: {time: {value: 0}, scale: {value: innerHeight * Math.min(devicePixelRatio || 1, 2)}, dustColor: {value: new T.Color(0xb9a98a)}, smokeColor: {value: new T.Color(0xd9dde0)}, light: {value: new T.Color(1, 1, 1)}, fogColor: {value: new T.Color(0xffffff)}, fogNear: {value: 400}, fogFar: {value: 1900}},
      vertexShader: `attribute vec3 velocity;attribute float born,life,kind,size;uniform float time,scale;varying float vA,vK,vFog;
        void main(){float age=time-born;float t=clamp(age/life,0.,1.);vK=kind;
        vec3 p=position+velocity*age*(1.-t*.55)+vec3(0.,age*(kind>.5?1.1:.55)*(1.-t*.4)+age*age*.02,0.);
        vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;
        vA=(age<0.||t>=1.)?0.:(smoothstep(0.,.08,t)*(1.-smoothstep(.45,1.,t)))*(kind>.5?.55:.42);
        gl_PointSize=clamp(size*(.5+t*1.8)*scale/max(d,1.)*.55,0.,220.);gl_Position=projectionMatrix*mv;
        vFog=smoothstep(fogNear,fogFar,d);if(vA<.002)gl_Position.w=-1.;}`.replace('uniform float time,scale;', 'uniform float time,scale,fogNear,fogFar;'),
      fragmentShader: `uniform vec3 dustColor,smokeColor,light,fogColor;varying float vA,vK,vFog;
        void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;float soft=(1.-r)*(1.-r);
        vec3 c=mix(dustColor,smokeColor,vK)*light;c=mix(c,fogColor,vFog);gl_FragColor=vec4(c,vA*soft*(1.-vFog));}`,
      transparent: true, depthWrite: false,
    });
    this.points = new T.Points(g, this.material); this.points.frustumCulled = false; this.points.renderOrder = 4; scene.add(this.points);
  }
  // Emit `n` puffs at a wheel contact: `kind` 0 dust, 1 smoke; velocity roughly along -travel with spread.
  emit(x, y, z, vx, vz, n, kind, size = 1) {
    for (let k = 0; k < n; k++) {
      const i = this.next; this.next = (this.next + 1) % this.count;
      const sx = (Math.random() - .5), sz = (Math.random() - .5);
      this.origin[i * 3] = x + sx * .35; this.origin[i * 3 + 1] = y + .12 + Math.random() * .2; this.origin[i * 3 + 2] = z + sz * .35;
      this.velocity[i * 3] = vx * (.35 + Math.random() * .4) + sx * 1.4; this.velocity[i * 3 + 1] = (kind ? .9 : .5) + Math.random() * .8; this.velocity[i * 3 + 2] = vz * (.35 + Math.random() * .4) + sz * 1.4;
      this.born[i] = this.time + Math.random() * .05; this.life[i] = (kind ? 1.6 : 2.2) + Math.random() * 1.2; this.kind[i] = kind; this.size[i] = size * (.8 + Math.random() * .7);
    }
    this.dirty = true;
  }
  update(dt, {light, fog, season} = {}) {
    this.time += dt; const u = this.material.uniforms; u.time.value = this.time; u.scale.value = innerHeight * Math.min(devicePixelRatio || 1, 2);
    if (light) u.light.value.copy(light);
    if (fog) { u.fogColor.value.copy(fog.color); u.fogNear.value = fog.near; u.fogFar.value = fog.far; }
    if (season) u.dustColor.value.set(season === 'winter' ? 0xe6ecf2 : season === 'autumn' ? 0xa88e6a : 0xb9a98a);
    if (!this.dirty) return; this.dirty = false;
    const a = this.points.geometry.attributes; for (const k of ['position', 'velocity', 'born', 'life', 'kind', 'size']) a[k].needsUpdate = true;
  }
}
