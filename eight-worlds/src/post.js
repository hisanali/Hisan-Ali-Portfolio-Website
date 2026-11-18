// HDR scene target, bloom, light shafts, tone mapping and grade.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Q } from './core.js';

const FRAG = /* glsl */`
precision highp float;
#include <common>
#include <tonemapping_pars_fragment>
varying vec2 vUv; uniform sampler2D tScene; uniform vec4 uSun; // uv.xy, strength, aspect
uniform vec4 uGrade; // exposure, saturation, contrast, vignette
uniform vec3 uTint; uniform float uTime, uFade, uShimmer, uWetLens, uThr, uNight;
float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
void main(){
  vec2 uv = vUv;
  if (uShimmer > 0.0){ float s = sin(uv.y*220.0 + uTime*7.0)*sin(uv.x*90.0 - uTime*4.0); uv.x += s*uShimmer*0.0012*smoothstep(0.62, 0.42, uv.y)*smoothstep(0.25, 0.42, uv.y); }
  vec3 col = texture2D(tScene, uv).rgb;
  // light shafts: march toward the sun in screen space, gathering only very bright sky
  if (uSun.z > 0.001){
    vec2 d = (uSun.xy - uv); float dl = length(d*vec2(uSun.w, 1.0)); vec2 st = d/22.0; vec2 p = uv + st*h21(uv*917.0 + uTime); float acc = 0.0, wgt = 1.0;
    for (int i = 0; i < 22; i++){ vec3 s = texture2D(tScene, clamp(p, 0.001, 0.999)).rgb; acc += smoothstep(uSun.w > 0.0 ? uThr : 1.4, uThr*5.0, lum(s))*wgt; wgt *= 0.955; p += st; }
    col += vec3(1.0, 0.86, 0.66)*acc/22.0*uSun.z*1.1*smoothstep(1.25, 0.0, dl);
  }
  col *= uTint;
  col = ACESFilmicToneMapping(col);
  // grade
  float l = lum(col); col = mix(vec3(l), col, uGrade.y*mix(1.0, 0.8, uNight)); col = mix(col, l*vec3(0.78, 0.9, 1.15), uNight*0.18); col = (col - 0.5)*uGrade.z + 0.5;
  col = clamp(col, 0.0, 1.0);
  vec2 q = vUv - 0.5; float v = 1.0 - dot(q, q)*uGrade.w; col *= v*v;
  col = pow(col, vec3(1.0/2.2));
  col += (fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5)/255.0;
  col *= uFade;
  gl_FragColor = vec4(col, 1.0);
}`;

export class Post {
  constructor(renderer) {
    this.r = renderer; const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.rt = new THREE.WebGLRenderTarget(s.x, s.y, { type: THREE.HalfFloatType, samples: Q.level >= 1 ? 4 : 2, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(s.x / 2, s.y / 2), 0.32, 0.75, 1.15);
    this.u = { tScene: { value: this.rt.texture }, uSun: { value: new THREE.Vector4(0.5, 0.5, 0, 1) }, uGrade: { value: new THREE.Vector4(1, 1.06, 1.03, 0.38) }, uTint: { value: new THREE.Color(1, 1, 1) }, uTime: { value: 0 }, uFade: { value: 1 }, uShimmer: { value: 0 }, uWetLens: { value: 0 }, uThr: { value: 3 }, uNight: { value: 0 }, toneMappingExposure: { value: 1 } };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: FRAG, depthTest: false, depthWrite: false, toneMapped: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); this.quad.frustumCulled = false; this.scene = new THREE.Scene(); this.scene.add(this.quad); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.useBloom = Q.level >= 1;
  }
  setSize(w, h) { this.rt.setSize(w, h); this.bloom.setSize(w / 2, h / 2); }
  render(scene, camera, env, time) {
    const r = this.r;
    r.setRenderTarget(this.rt); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, camera);
    if (this.useBloom) { this.bloom.threshold = 2.6 / Math.max(env.exposure, 0.02); this.bloom.strength = 0.22; this.bloom.render(r, null, this.rt, 0, false); }
    // sun position on screen for light shafts
    _v.copy(env.sunDir).multiplyScalar(1000).add(camera.position).project(camera);
    const front = _d.copy(env.sunDir).dot(camera.getWorldDirection(_w)) > 0.05;
    const vis = front ? Math.max(0, 1 - Math.max(Math.abs(_v.x), Math.abs(_v.y)) * 0.55) : 0;
    this.u.uSun.value.set(_v.x * 0.5 + 0.5, _v.y * 0.5 + 0.5, vis * Math.min(1, env.lightIntensity * 0.25) * (env.sunDir.y > -0.05 ? 1 : 0) * (0.5 + 0.8 * Math.min(1, env.w.fog * 2 + env.w.haze * 0.15)), camera.aspect);
    this.u.toneMappingExposure.value = env.exposure; this.u.uTime.value = time; this.u.uThr.value = 4.5 / Math.max(env.exposure, 0.02); this.u.uNight.value = env.night;
    r.setRenderTarget(null); r.render(this.scene, this.cam);
  }
}
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _w = new THREE.Vector3();
