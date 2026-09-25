import * as T from './vendor/three.module.js';

// Soft light halos drawn as screen-facing points: headlights, flashes, indicators and street lamps.
// Each point has its own colour, strength and size in pixels, so a far headlight flash still reads clearly.
export class GlowPoints {
  constructor(scene, count, {size = 1, fade = 900} = {}) {
    this.count = count;
    this.position = new Float32Array(count * 3).fill(-1e5);
    this.color = new Float32Array(count * 3);
    this.strength = new Float32Array(count);
    this.size = new Float32Array(count);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(this.position, 3));
    g.setAttribute('glowColor', new T.BufferAttribute(this.color, 3));
    g.setAttribute('strength', new T.BufferAttribute(this.strength, 1));
    g.setAttribute('glowSize', new T.BufferAttribute(this.size, 1));
    this.material = new T.ShaderMaterial({
      uniforms: {scale: {value: size * Math.min(devicePixelRatio || 1, 2)}, fade: {value: fade}, viewport: {value: innerHeight}},
      vertexShader: `attribute vec3 glowColor;attribute float strength,glowSize;uniform float scale,fade,viewport;varying vec3 vColor;varying float vStrength;
        void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float d=-mv.z;vColor=glowColor;vStrength=strength*(1.-smoothstep(fade*.55,fade,d));
        gl_PointSize=clamp(glowSize*scale*viewport/900.*(.35+18./max(d,1.)),0.,glowSize*scale*3.);gl_Position=projectionMatrix*mv;if(vStrength<.002)gl_Position.w=-1.;}`,
      fragmentShader: `varying vec3 vColor;varying float vStrength;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;
        float core=exp(-r*14.),halo=exp(-r*3.2)*.45;gl_FragColor=vec4(vColor*(core+halo)*vStrength,1.);}`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    });
    this.points = new T.Points(g, this.material);
    this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
    this.used = 0;
  }

  begin() { this.used = 0; }

  add(x, y, z, color, strength, size) {
    if (this.used >= this.count || strength <= 0) return;
    const i = this.used++, k = i * 3;
    this.position[k] = x; this.position[k + 1] = y; this.position[k + 2] = z;
    this.color[k] = color.r; this.color[k + 1] = color.g; this.color[k + 2] = color.b;
    this.strength[i] = strength; this.size[i] = size;
  }

  end() {
    for (let i = this.used; i < this.count; i++) this.strength[i] = 0;
    const a = this.points.geometry.attributes;
    a.position.needsUpdate = a.glowColor.needsUpdate = a.strength.needsUpdate = a.glowSize.needsUpdate = true;
    this.material.uniforms.viewport.value = innerHeight;
  }
}
