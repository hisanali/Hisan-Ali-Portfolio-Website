import * as T from '../evermile/vendor/three.module.js';
import { HDRLoader } from './vendor/three-addons/loaders/HDRLoader.js';
import { SSAOPass } from './vendor/three-addons/postprocessing/SSAOPass.js';
import { BokehPass } from './vendor/three-addons/postprocessing/BokehPass.js';
import { ShaderPass } from './vendor/three-addons/postprocessing/ShaderPass.js';

export function stadiumLighting(renderer,scene){
 return new HDRLoader().loadAsync('./assets/stadium-light.bin?v=7').then(hdr=>{
  hdr.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(hdr).texture;
  scene.environmentIntensity=.5;scene.background=hdr;scene.backgroundBlurriness=.055;scene.backgroundIntensity=.3;
  scene.backgroundRotation.y=scene.environmentRotation.y=.8;pmrem.dispose();
 }).catch(()=>{
  // Lighting is optional. A failed environment download must not prevent play.
  scene.background=new T.Color('#9facb5');scene.add(new T.HemisphereLight('#c7d9e8','#52603d',.7));
 });
}
export function contactShading(scene,camera){
 const pass=new SSAOPass(scene,camera,1,1,innerWidth<600?8:16);
 pass.kernelRadius=.45;pass.minDistance=.00015;pass.maxDistance=.012;
 const size=pass.setSize.bind(pass);pass.setSize=(w,h)=>size(Math.max(1,Math.round(w*.65)),Math.max(1,Math.round(h*.65)));
 const render=pass.render.bind(pass);pass.render=(...args)=>{const mask=camera.layers.mask;camera.layers.disable(2);render(...args);camera.layers.mask=mask;};
 return pass;
}
export function broadcastLens(scene,camera){
 const pass=new BokehPass(scene,camera,{focus:12,aperture:.00008,maxblur:.005});
 return {pass,update(focus,closeup){pass.uniforms.focus.value=focus;pass.uniforms.aperture.value=closeup?.0007:.00002;pass.uniforms.maxblur.value=closeup?.008:.0015;}};
}
export function broadcastGrade(){
 return new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time;varying vec2 vUv;
 void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
 float lum=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(lum),c,.96);
 c=(c-.5)*1.035+.5;c*=vec3(1.015,1.005,.99);
 vec2 p=vUv-.5;c*=1.-.10*dot(p,p);
 float noise=fract(sin(dot(gl_FragCoord.xy+time,vec2(12.9898,78.233)))*43758.5453)-.5;
 gl_FragColor=vec4(clamp(c+noise*.003,0.,1.),1.);}`});
}
