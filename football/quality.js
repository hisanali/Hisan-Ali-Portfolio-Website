import * as T from '../evermile/vendor/three.module.js';
import { contactShading, broadcastLens } from '../penalty/rendering.js?v=10';
import { ShaderPass } from '../penalty/vendor/three-addons/postprocessing/ShaderPass.js';
// Neutral photographic response: retain skin/grass colour instead of the
// previous saturated S-curve. Exposure and material lighting happen in HDR.
export function naturalGrade(){return new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D tDiffuse;uniform float time;varying vec2 vUv;
void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,.95);vec2 p=vUv-.5;c*=1.-.14*dot(p,p);gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});}
export function matchOptics(scene,camera,mobile){
 const ao=contactShading(scene,camera);ao.kernelRadius=.32;ao.enabled=false; // screen-space AO shimmered as the camera tracked play
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

// Damped net displacement in the vertex shader; anchors at ground/mouth stay put.
export function createNetMotion(){
 const nets=[];
 return {
  add(mesh,points,z,dir){
   const impact={value:new T.Vector3(0,1,z)},age={value:10},strength={value:0};
   mesh.material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{netImpact:impact,netAge:age,netStrength:strength});
    shader.vertexShader='uniform vec3 netImpact;uniform float netAge;uniform float netStrength;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
     vec4 mvPosition=vec4(transformed,1.0);
     #ifdef USE_INSTANCING
       mvPosition=instanceMatrix*mvPosition;
     #endif
     float depth=abs(mvPosition.z-${z.toFixed(1)});
     float anchor=smoothstep(0.,.35,depth)*smoothstep(0.,.3,mvPosition.y);
     float distanceToHit=length(mvPosition.xyz-netImpact);
     float wave=sin(max(0.,netAge-distanceToHit*.045)*18.)*exp(-netAge*3.3)*exp(-distanceToHit*.8);
     mvPosition.z+=${dir.toFixed(1)}*wave*netStrength*anchor;
     mvPosition=modelViewMatrix*mvPosition;
     gl_Position=projectionMatrix*mvPosition;`);
   };
   mesh.material.customProgramCacheKey=()=>`goal-net-${z}`;
   nets.push({impact,age,strength,z});
  },
  hit(point,velocity){for(const net of nets)if(Math.abs(point.z-net.z)<3){net.impact.value.copy(point);net.age.value=0;net.strength.value=Math.min(.65,.18+velocity.length()*.025);}},
  update(dt){for(const net of nets)net.age.value=Math.min(10,net.age.value+dt);},
 };
}
