import * as T from './vendor/three.module.js';
import {Pass, FullScreenQuad} from './vendor/postprocessing/Pass.js';

// The last pass, in display colour: a gentle filmic contrast curve and a touch more saturation, a soft vignette,
// fine grain that moves, and in the cinematic camera a little chromatic aberration at the edges of the frame.
export class FilmPass extends Pass {
  constructor() {
    super(); this.needsSwap = true;
    this.material = new T.ShaderMaterial({uniforms: {tDiffuse: {value: null}, time: {value: 0}, vignette: {value: .32}, grain: {value: .035}, contrast: {value: .08}, saturation: {value: .06}, aberration: {value: 0}},
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `uniform sampler2D tDiffuse;uniform float time,vignette,grain,contrast,saturation,aberration;varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+time*7.)*43758.5453);}
        void main(){vec2 d=vUv-.5;float r2=dot(d,d);vec3 c;
          if(aberration>0.){float k=aberration*r2;c=vec3(texture2D(tDiffuse,vUv+d*k).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-d*k).b);}else c=texture2D(tDiffuse,vUv).rgb;
          float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.+saturation);
          c=mix(c,smoothstep(0.,1.,c),contrast);
          c*=1.-vignette*smoothstep(.15,.9,r2*2.4);
          c+=(hash(gl_FragCoord.xy)-.5)*grain*(1.-l*.6);
          gl_FragColor=vec4(c,1.);}`, depthTest: false, depthWrite: false});
    this.quad = new FullScreenQuad(this.material);
  }
  render(renderer, writeBuffer, readBuffer, deltaTime) {
    const u = this.material.uniforms; u.tDiffuse.value = readBuffer.texture; u.time.value += deltaTime || 1 / 60;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); if (this.clear) renderer.clear(); this.quad.render(renderer);
  }
  dispose() { this.material.dispose(); this.quad.dispose(); }
}
