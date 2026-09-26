import * as T from './vendor/three.module.js';
import {clone} from './vendor/utils/SkeletonUtils.js';
// Heights and strides are in metres; source files use several different unit systems.
export const animalAssets={cow:{file:'cow-imported',height:1.5,stride:1.35},dog:{file:'dog-imported',height:.65,stride:.85},cat:{file:'cat-imported',height:.36,stride:.45},fox:{file:'fox-supplied',height:.6,stride:1.05},horse:{file:'horse-supplied',height:2,stride:1.5},bighorn:{file:'bighorn-supplied',height:1.25,stride:1}};
export function animatedAnimal(asset,kind,variant=0){
 const config=animalAssets[kind],model=clone(asset.scene),root=new T.Group();root.add(model);model.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model),scale=config.height/bounds.getSize(new T.Vector3()).y*(.97+(variant%4)*.02),center=bounds.getCenter(new T.Vector3());
 model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false;}});
 const mixer=new T.AnimationMixer(model),find=name=>asset.animations.find(c=>c.name.toLowerCase()===name.toLowerCase());
 const walkClip=find('Walk'),idleClip=find('Idle')||find('Survey')||asset.animations[0],eatClip=find('Eating');
 const walk=walkClip?mixer.clipAction(walkClip).play():null,idle=idleClip?mixer.clipAction(idleClip).play():null,eat=eatClip?mixer.clipAction(eatClip).play():null;
 if(walk)walk.time=variant*.17%walkClip.duration;if(idle)idle.time=variant*.31%idleClip.duration;if(eat)eat.time=variant*.63%eatClip.duration;
 let blend=0,graze=0;
 return {root,model,mixer,update(dt,speed,grazing=false){
  const moving=Math.abs(speed)>.04;blend+=((moving?1:0)-blend)*(1-Math.exp(-dt*9));graze+=((grazing&&!moving?1:0)-graze)*(1-Math.exp(-dt*3));
  if(walk){walk.setEffectiveWeight(blend);walk.setEffectiveTimeScale(Math.min(3,Math.abs(speed)*walkClip.duration/config.stride));}
  if(idle)idle.setEffectiveWeight(walk?(1-blend)*(eat?1-graze:1):1);
  if(eat)eat.setEffectiveWeight((1-blend)*graze);
  mixer.update(dt);
 }};
}
