import * as T from '../evermile/vendor/three.module.js';
import { contactShading, broadcastLens } from '../penalty/rendering.js?v=10';
import { ShaderPass } from '../penalty/vendor/three-addons/postprocessing/ShaderPass.js';
// Neutral photographic response: retain skin/grass colour instead of the
// previous saturated S-curve. Exposure and material lighting happen in HDR.
export function naturalGrade(){return new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D tDiffuse;uniform float time;varying vec2 vUv;
void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,.98);c=(c-.5)*1.035+.5;vec2 p=vUv-.5;c*=1.-.08*dot(p,p);gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});}
export function matchOptics(scene,camera,mobile){
 const ao=contactShading(scene,camera);ao.kernelRadius=.32;ao.enabled=!mobile;
 const lens=broadcastLens(scene,camera);lens.pass.enabled=false;
 return {ao,lens,update(state,remaining,ball,scorer){
  const closeup=state==='goal';lens.pass.enabled=closeup&&!mobile;
  const target=closeup&&remaining>7&&scorer?scorer.root.position.clone().add(new T.Vector3(0,1.1,0)):ball.position;
  lens.update(camera.position.distanceTo(target),closeup);
 }};
}
export function goalCords(scene,points){
 const material=new T.MeshStandardMaterial({color:'#e5ebe3',roughness:.85});
 const geo=new T.CylinderGeometry(.005,.005,1,4),mesh=new T.InstancedMesh(geo,material,points.length/6),dummy=new T.Object3D(),up=new T.Vector3(0,1,0);
 for(let i=0;i<points.length;i+=6){const a=new T.Vector3(...points.slice(i,i+3)),b=new T.Vector3(...points.slice(i+3,i+6)),delta=b.clone().sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.scale.set(1,delta.length(),1);dummy.quaternion.setFromUnitVectors(up,delta.normalize());dummy.updateMatrix();mesh.setMatrixAt(i/6,dummy.matrix);}
 mesh.computeBoundingSphere();mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
