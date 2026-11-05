import * as T from './vendor/three.module.js';
import {Pass, FullScreenQuad} from './vendor/postprocessing/Pass.js';

// Sun shafts and a lens flare. A mask of open sky round the sun (from the scene depth) is blurred radially
// towards the sun's position on screen and added back warm; a handful of ghost rings sit along the line from
// the sun through the centre of the frame. Both fade as the sun leaves the frame or drops below the horizon.
export class SunShaftsPass extends Pass {
  constructor(scene, camera, width, height, {scale = .5} = {}) {
    super(); this.scene = scene; this.camera = camera; this.scale = scale; this.needsSwap = true; this.depthTexture = null;
    this.sunDir = new T.Vector3(0, 1, 0); this.sunColor = new T.Color(0xffe2b0); this.strength = 1; this.flare = 1;
    this.depthMaterial = new T.MeshDepthMaterial({depthPacking: T.RGBADepthPacking, blending: T.NoBlending});
    this.depthTarget = new T.WebGLRenderTarget(1, 1, {minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true});
    this.maskTarget = new T.WebGLRenderTarget(1, 1, {minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false});
    this.blurTarget = new T.WebGLRenderTarget(1, 1, {minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false});
    const vs = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
    this.maskMaterial = new T.ShaderMaterial({uniforms: {tDepth: {value: null}, sunUv: {value: new T.Vector2()}, aspect: {value: 1}, radius: {value: .55}}, vertexShader: vs, fragmentShader: `#include <packing>
      uniform sampler2D tDepth;uniform vec2 sunUv;uniform float aspect,radius;varying vec2 vUv;
      void main(){float d=unpackRGBAToDepth(texture2D(tDepth,vUv));float sky=d>=.9999?1.:0.;vec2 q=(vUv-sunUv)*vec2(aspect,1.);float r=length(q)/radius;float glow=pow(max(0.,1.-r),1.6);gl_FragColor=vec4(vec3(sky*glow),1.);}`, depthTest: false, depthWrite: false});
    this.blurMaterial = new T.ShaderMaterial({uniforms: {tMask: {value: null}, sunUv: {value: new T.Vector2()}, density: {value: .9}, decay: {value: .96}}, vertexShader: vs, fragmentShader: `uniform sampler2D tMask;uniform vec2 sunUv;uniform float density,decay;varying vec2 vUv;
      void main(){vec2 uv=vUv;vec2 step=(uv-sunUv)*density/32.;float w=1.,sum=0.;for(int i=0;i<32;i++){uv-=step;sum+=texture2D(tMask,uv).r*w;w*=decay;}gl_FragColor=vec4(vec3(sum/32.*2.2),1.);}`, depthTest: false, depthWrite: false});
    this.compositeMaterial = new T.ShaderMaterial({uniforms: {tDiffuse: {value: null}, tShafts: {value: null}, sunUv: {value: new T.Vector2()}, sunColor: {value: new T.Color()}, strength: {value: 0}, flare: {value: 0}, aspect: {value: 1}}, vertexShader: vs, fragmentShader: `uniform sampler2D tDiffuse,tShafts;uniform vec2 sunUv;uniform vec3 sunColor;uniform float strength,flare,aspect;varying vec2 vUv;
      float ring(vec2 p,float r,float w){float d=abs(length(p)-r);return smoothstep(w,0.,d);}
      void main(){vec4 c=texture2D(tDiffuse,vUv);float s=texture2D(tShafts,vUv).r;vec3 col=c.rgb+sunColor*s*strength;
        if(flare>0.){vec2 centre=vec2(.5);vec2 dir=centre-sunUv;vec2 p=(vUv-sunUv)*vec2(aspect,1.);float core=pow(max(0.,1.-length(p)/.08),2.)*.6;float f=core;
          for(int i=0;i<5;i++){float k=float(i)*.45-.3;vec2 g=sunUv+dir*(1.+k);vec2 q=(vUv-g)*vec2(aspect,1.);float r=.035+float(i)*.022;f+=ring(q,r,.012)*.12+pow(max(0.,1.-length(q)/r),2.)*.05;}
          col+=sunColor*f*flare;}
        gl_FragColor=vec4(col,c.a);}`, depthTest: false, depthWrite: false});
    this.quad = new FullScreenQuad(null); this.setSize(width, height);
  }
  setSize(width, height) { const w = Math.max(1, Math.round(width * this.scale)), h = Math.max(1, Math.round(height * this.scale)); this.depthTarget.setSize(Math.round(w / 2), Math.round(h / 2)); this.maskTarget.setSize(w, h); this.blurTarget.setSize(w, h); this.maskMaterial.uniforms.aspect.value = width / height; this.compositeMaterial.uniforms.aspect.value = width / height; }
  // Where the sun is on screen (0..1) and how strongly it should show; null when it is behind the camera.
  sunOnScreen() {
    const v = this.sunDir.clone().multiplyScalar(5000).add(this.camera.position).project(this.camera);
    if (v.z > 1 || v.z < -1) return null;
    const uv = new T.Vector2(v.x * .5 + .5, v.y * .5 + .5), margin = .35;
    const inside = Math.min(1, Math.max(0, (1 - Math.max(Math.abs(v.x), Math.abs(v.y))) / margin + 1));
    return {uv, inside};
  }
  render(renderer, writeBuffer, readBuffer) {
    const sun = this.sunOnScreen(), elevation = this.sunDir.y, show = sun && sun.inside > 0 && elevation > -.05 && this.strength > .001;
    const autoClear = renderer.autoClear; renderer.autoClear = false;
    if (show) {
      let depth = this.depthTexture;
      if (!depth) {
        const scene = this.scene, camera = this.camera, override = scene.overrideMaterial, autoShadow = renderer.shadowMap.autoUpdate, fog = scene.fog, bg = scene.background, cc = renderer.getClearColor(new T.Color()), ca = renderer.getClearAlpha();
        scene.overrideMaterial = this.depthMaterial; renderer.shadowMap.autoUpdate = false; scene.fog = null; scene.background = null;
        renderer.setRenderTarget(this.depthTarget); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(scene, camera); renderer.setClearColor(cc, ca);
        scene.overrideMaterial = override; renderer.shadowMap.autoUpdate = autoShadow; scene.fog = fog; scene.background = bg; depth = this.depthTarget.texture;
      }
      const low = Math.min(1, Math.max(0, 1 - elevation / .35)), amount = sun.inside * (.35 + .65 * low) * this.strength;
      const m = this.maskMaterial.uniforms; m.tDepth.value = depth; m.sunUv.value.copy(sun.uv); m.radius.value = .45 + .3 * low;
      this.quad.material = this.maskMaterial; renderer.setRenderTarget(this.maskTarget); this.quad.render(renderer);
      const b = this.blurMaterial.uniforms; b.tMask.value = this.maskTarget.texture; b.sunUv.value.copy(sun.uv);
      this.quad.material = this.blurMaterial; renderer.setRenderTarget(this.blurTarget); this.quad.render(renderer);
      const c = this.compositeMaterial.uniforms; c.tDiffuse.value = readBuffer.texture; c.tShafts.value = this.blurTarget.texture; c.sunUv.value.copy(sun.uv); c.sunColor.value.copy(this.sunColor); c.strength.value = amount * .55; c.flare.value = this.flare * sun.inside * Math.min(1, Math.max(0, elevation / .08)) * .9;
    } else { const c = this.compositeMaterial.uniforms; c.tDiffuse.value = readBuffer.texture; c.strength.value = 0; c.flare.value = 0; }
    this.quad.material = this.compositeMaterial; renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
    renderer.autoClear = autoClear;
  }
  dispose() { for (const t of [this.depthTarget, this.maskTarget, this.blurTarget]) t.dispose(); for (const m of [this.depthMaterial, this.maskMaterial, this.blurMaterial, this.compositeMaterial]) m.dispose(); this.quad.dispose(); }
}
