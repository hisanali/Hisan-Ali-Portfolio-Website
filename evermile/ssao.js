import * as T from './vendor/three.module.js';
import {Pass, FullScreenQuad} from './vendor/postprocessing/Pass.js';

// Screen-space ambient occlusion from depth alone: a half-resolution depth pre-pass of the scene, a hemisphere
// sample pass that reconstructs position and normal from that depth, a depth-aware blur, then the colour frame is
// darkened where surfaces meet (under the car, along kerbs, in building corners). Needs no normal pass, so the
// scene's custom materials, points and sprites need no special handling.
const KERNEL = 14;
function kernel() {
  const out = [];
  for (let i = 0; i < KERNEL; i++) {
    const v = new T.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()).normalize();
    let s = i / KERNEL; s = .12 + s * s * .88; out.push(v.multiplyScalar(s * (.4 + Math.random() * .6)));
  }
  return out;
}
function noiseTexture() {
  const n = 4, data = new Float32Array(n * n * 4);
  for (let i = 0; i < n * n; i++) { const a = Math.random() * Math.PI * 2; data[i * 4] = Math.cos(a); data[i * 4 + 1] = Math.sin(a); data[i * 4 + 2] = 0; data[i * 4 + 3] = 1; }
  const t = new T.DataTexture(data, n, n, T.RGBAFormat, T.FloatType); t.wrapS = t.wrapT = T.RepeatWrapping; t.magFilter = t.minFilter = T.NearestFilter; t.needsUpdate = true; return t;
}

export class SSAOPass extends Pass {
  constructor(scene, camera, width, height, {radius = .9, intensity = .85, scale = .5} = {}) {
    super();
    this.scene = scene; this.camera = camera; this.radius = radius; this.intensity = intensity; this.scale = scale; this.needsSwap = true;
    this.depthMaterial = new T.MeshDepthMaterial({depthPacking: T.RGBADepthPacking, blending: T.NoBlending});
    const opts = {minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: true};
    this.depthTarget = new T.WebGLRenderTarget(1, 1, {...opts, minFilter: T.NearestFilter, magFilter: T.NearestFilter});
    this.aoTarget = new T.WebGLRenderTarget(1, 1, {...opts, depthBuffer: false});
    this.blurTarget = new T.WebGLRenderTarget(1, 1, {...opts, depthBuffer: false});
    this.aoMaterial = new T.ShaderMaterial({
      defines: {KERNEL},
      uniforms: {tDepth: {value: null}, tNoise: {value: noiseTexture()}, kernel: {value: kernel()}, projection: {value: new T.Matrix4()}, inverseProjection: {value: new T.Matrix4()}, cameraNear: {value: .1}, cameraFar: {value: 1000}, radius: {value: radius}, resolution: {value: new T.Vector2()}, fadeStart: {value: 90}, fadeEnd: {value: 160}},
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `#include <packing>
        uniform sampler2D tDepth,tNoise;uniform vec3 kernel[KERNEL];uniform mat4 projection,inverseProjection;uniform float cameraNear,cameraFar,radius,fadeStart,fadeEnd;uniform vec2 resolution;varying vec2 vUv;
        float readDepth(vec2 uv){return unpackRGBAToDepth(texture2D(tDepth,uv));}
        vec3 viewPos(vec2 uv,float d){vec4 c=vec4(uv*2.-1.,d*2.-1.,1.);vec4 v=inverseProjection*c;return v.xyz/v.w;}
        void main(){float d=readDepth(vUv);if(d>=.9999){gl_FragColor=vec4(1.);return;}
          vec3 p=viewPos(vUv,d);float dist=-p.z;if(dist>fadeEnd){gl_FragColor=vec4(1.);return;}
          vec2 px=1./resolution;
          vec3 pr=viewPos(vUv+vec2(px.x,0.),readDepth(vUv+vec2(px.x,0.)));vec3 pl=viewPos(vUv-vec2(px.x,0.),readDepth(vUv-vec2(px.x,0.)));
          vec3 pu=viewPos(vUv+vec2(0.,px.y),readDepth(vUv+vec2(0.,px.y)));vec3 pd=viewPos(vUv-vec2(0.,px.y),readDepth(vUv-vec2(0.,px.y)));
          vec3 dx=abs(pr.z-p.z)<abs(p.z-pl.z)?pr-p:p-pl;vec3 dy=abs(pu.z-p.z)<abs(p.z-pd.z)?pu-p:p-pd;
          vec3 n=normalize(cross(dx,dy));
          vec3 rnd=texture2D(tNoise,vUv*resolution/4.).xyz;vec3 t=normalize(rnd-n*dot(rnd,n));vec3 b=cross(n,t);mat3 tbn=mat3(t,b,n);
          float r=radius*(1.+dist*.02);float occ=0.;
          for(int i=0;i<KERNEL;i++){vec3 s=p+tbn*kernel[i]*r;vec4 o=projection*vec4(s,1.);o.xyz/=o.w;vec2 suv=o.xy*.5+.5;
            if(suv.x<0.||suv.x>1.||suv.y<0.||suv.y>1.)continue;
            float sd=readDepth(suv);float sz=viewPos(suv,sd).z;
            float range=smoothstep(0.,1.,r/max(abs(p.z-sz),1e-4));occ+=(sz>=s.z+.03?1.:0.)*range;}
          float ao=1.-occ/float(KERNEL);ao=pow(clamp(ao,0.,1.),1.4);
          ao=mix(ao,1.,smoothstep(fadeStart,fadeEnd,dist));gl_FragColor=vec4(vec3(ao),1.);}`,
      depthTest: false, depthWrite: false,
    });
    this.blurMaterial = new T.ShaderMaterial({
      uniforms: {tAO: {value: null}, tDepth: {value: null}, resolution: {value: new T.Vector2()}},
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `#include <packing>
        uniform sampler2D tAO,tDepth;uniform vec2 resolution;varying vec2 vUv;
        void main(){vec2 px=1./resolution;float d0=unpackRGBAToDepth(texture2D(tDepth,vUv));float sum=0.,w=0.;
          for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){vec2 uv=vUv+vec2(float(x),float(y))*px;float d=unpackRGBAToDepth(texture2D(tDepth,uv));
            float k=exp(-abs(d-d0)*4000.)*(1.-.12*float(abs(x)+abs(y)));sum+=texture2D(tAO,uv).r*k;w+=k;}
          gl_FragColor=vec4(vec3(sum/max(w,1e-4)),1.);}`,
      depthTest: false, depthWrite: false,
    });
    this.compositeMaterial = new T.ShaderMaterial({
      uniforms: {tDiffuse: {value: null}, tAO: {value: null}, intensity: {value: intensity}},
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'uniform sampler2D tDiffuse,tAO;uniform float intensity;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float ao=texture2D(tAO,vUv).r;gl_FragColor=vec4(c.rgb*mix(1.,ao,intensity),c.a);}',
      depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(null);
    this.setSize(width, height);
  }
  setSize(width, height) {
    const w = Math.max(1, Math.round(width * this.scale)), h = Math.max(1, Math.round(height * this.scale));
    this.depthTarget.setSize(w, h); this.aoTarget.setSize(w, h); this.blurTarget.setSize(w, h);
    this.aoMaterial.uniforms.resolution.value.set(w, h); this.blurMaterial.uniforms.resolution.value.set(w, h);
  }
  render(renderer, writeBuffer, readBuffer) {
    const scene = this.scene, camera = this.camera;
    // Depth pre-pass at half resolution: shadows and the sky are not needed for it.
    const override = scene.overrideMaterial, autoShadow = renderer.shadowMap.autoUpdate, fog = scene.fog, bg = scene.background, autoClear = renderer.autoClear;
    scene.overrideMaterial = this.depthMaterial; renderer.shadowMap.autoUpdate = false; scene.fog = null; scene.background = null;
    const clearColor = renderer.getClearColor(new T.Color()), clearAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(this.depthTarget); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(scene, camera);
    renderer.setClearColor(clearColor, clearAlpha);
    scene.overrideMaterial = override; renderer.shadowMap.autoUpdate = autoShadow; scene.fog = fog; scene.background = bg;
    // Occlusion.
    const u = this.aoMaterial.uniforms; u.tDepth.value = this.depthTarget.texture; u.projection.value.copy(camera.projectionMatrix); u.inverseProjection.value.copy(camera.projectionMatrixInverse);
    u.cameraNear.value = camera.near; u.cameraFar.value = camera.far; u.radius.value = this.radius;
    renderer.autoClear = false;
    this.quad.material = this.aoMaterial; renderer.setRenderTarget(this.aoTarget); this.quad.render(renderer);
    const b = this.blurMaterial.uniforms; b.tAO.value = this.aoTarget.texture; b.tDepth.value = this.depthTarget.texture;
    this.quad.material = this.blurMaterial; renderer.setRenderTarget(this.blurTarget); this.quad.render(renderer);
    const c = this.compositeMaterial.uniforms; c.tDiffuse.value = readBuffer.texture; c.tAO.value = this.blurTarget.texture; c.intensity.value = this.intensity;
    this.quad.material = this.compositeMaterial; renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
    renderer.autoClear = autoClear;
  }
  dispose() { for (const t of [this.depthTarget, this.aoTarget, this.blurTarget]) t.dispose(); for (const m of [this.depthMaterial, this.aoMaterial, this.blurMaterial, this.compositeMaterial]) m.dispose(); this.quad.dispose(); }
}
