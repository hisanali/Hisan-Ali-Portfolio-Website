import {citizenAssets,citizenKey,fitCitizen} from './citizen-assets.js?v=20260926-supplied7';
import {animalAssets,animatedAnimal} from './animated-assets.js?v=20260926-supplied7';
import {TrafficModels} from './traffic-models.js?v=20260926-supplied7';
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {clone as cloneSkin} from './vendor/utils/SkeletonUtils.js';
import {addMicroSurface} from './surface-detail.js?v=20260926-supplied7';
import {reachHand} from './pedestrian-motion.js?v=20260926-supplied7';
import {batchStatic} from './mesh-batching.js?v=20260926-supplied7';

const box=new T.Box3();
export class DetailedModels{
 constructor(scene,settings){
  this.scene=scene;this.settings=settings;this.trafficModels=new TrafficModels();this.loaded={};this.errors=[];this.foxes=[];this.animalModels=new WeakSet();this.animalCount=0;const loader=new GLTFLoader();
  for(const [key,file] of Object.entries({...Object.fromEntries(Object.entries(animalAssets).map(([k,v])=>[k,v.file+'.glb'])),...Object.fromEntries(citizenAssets.map(([key])=>[key,'citizen-'+key+'.glb'])),...Object.fromEntries(Array.from({length:6},(_,i)=>['citizen'+i,'pedestrian-'+i+'.glb']))}))loader.load(new URL('./assets/models/'+file+'?v=supplied7',import.meta.url).href,g=>{this.loaded[key]=g;},undefined,e=>{this.errors.push(key);console.warn('Optional detailed model unavailable:',key,e.message);});
 }
 makeCitizen(p){
  const key=citizenKey(p.i),imported=!key.startsWith('citizen'),asset=this.loaded[key]||this.loaded['citizen'+p.i%6],model=cloneSkin(asset.scene),root=new T.Group();root.add(model);this.scene.add(root);if(imported)fitCitizen(model,p.i);
  const shirts=[0x365368,0xb6a17c,0x4c6152,0xa25040,0x766287,0xd0cabc,0x354351,0x7b3035,0x667d85,0x8b724c,0x405850,0x9b9691];
  const trousers=[0x253348,0x3e3931,0x353a3b,0x263e55,0x524532,0x606569];
  const mats=new Map();model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false;const original=o.material;
   if(!mats.has(original)){const m=original.clone();if(m.name.includes('Cloth_Shirt'))m.color.set(shirts[p.i%shirts.length]);if(m.name.includes('Cloth_Trousers'))m.color.set(trousers[(p.i*5+Math.floor(p.i/6))%trousers.length]);if(m.name.includes('Cloth'))addMicroSurface(m,'fabric',.002);mats.set(original,m);}o.material=mats.get(original);
  });
  const mixer=new T.AnimationMixer(model),walk=mixer.clipAction(asset.animations.find(a=>a.name==='Walk')).play(),idle=mixer.clipAction(asset.animations.find(a=>a.name==='Idle')).play();
  walk.time=(p.i*.173)%walk.getClip().duration;idle.time=p.i*.117;idle.setEffectiveWeight(0);
  p.detail={root,mixer,walk,idle,asset,arm:['lArm','lForearm','lHand'].map(n=>model.getObjectByName(n)),stride:imported?1.15:.96875,blend:1,lastX:p.x,lastZ:p.z,yaw:p.yaw};
 }
 makeAnimal(a){
  if(animalAssets[a.kind]){const animation=animatedAnimal(this.loaded[a.kind],a.kind,this.animalCount++);a.detailFallback=[...a.g.children];a.g.add(animation.root);a.detailModel=animation.root;a.detailAnimation=animation;a.detailLast={x:a.x,z:a.z};this.animalModels.add(a);return;}
  const model=this.loaded[a.kind].scene.clone(true);a.detailFallback=[...a.g.children];a.g.add(model);a.detailModel=model;
  const variant=this.animalCount++,mats=new Map();model.scale.setScalar(.94+(variant%5)*.025);
  model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const base=o.material;if(!mats.has(base)){const m=base.clone();if(m.name.startsWith('Coat')&&['dog','cat'].includes(a.kind))m.color.set([0x966e49,0x343333,0xb79c7b,0xbdb7a9][variant%4]);if(m.name.startsWith('CowPatches')&&variant%3===0)m.color.set(0xa97950);if(o.geometry.attributes.uv&&m.roughness>.7)addMicroSurface(m,'fur',.002);mats.set(base,m);}o.material=mats.get(base);});
  const groups=[];model.traverse(o=>{if(o.isGroup)groups.push(o);});groups.reverse().forEach(g=>batchStatic(g));
  a.detailControls={neck:model.getObjectByName('Neck'),head:model.getObjectByName('Head'),tail:model.getObjectByName('Tail'),legs:Array.from({length:a.kind==='cat'?2:4},(_,i)=>({hip:model.getObjectByName('Hip'+i),knee:model.getObjectByName('Knee'+i)}))};
  this.animalModels.add(a);
 }
 update(dt,state,traffic,people,world,animals=[],town=null){
  for(const a of animals)if(this.loaded[a.kind]&&!this.animalModels.has(a))this.makeAnimal(a);
  const high=this.settings.quality==='high'||this.settings.quality==='ultra';
  this.trafficModels.update(dt,state,traffic,high);
  for(const a of animals){if(!a.detailModel)continue;const use=Math.abs(a.z-state.z)<(high?220:90)&&a.g.position.y>-400;a.detailModel.visible=use;a.detailFallback.forEach(o=>o.visible=!use);if(!use){if(a.detailLast)Object.assign(a.detailLast,{x:a.x,z:a.z});continue;}if(a.detailAnimation){const speed=dt>0?Math.hypot(a.x-a.detailLast.x,a.z-a.detailLast.z)/dt:0;a.detailAnimation.update(dt,speed<10?speed:0,!!a.graze);Object.assign(a.detailLast,{x:a.x,z:a.z});continue;}for(const key of ['neck','head','tail'])if(a[key]&&a.detailControls[key])a.detailControls[key].quaternion.copy(a[key].quaternion);a.legs?.forEach((leg,i)=>{if(leg.hip){a.detailControls.legs[i].hip.quaternion.copy(leg.hip.quaternion);a.detailControls.legs[i].knee.quaternion.copy(leg.knee.quaternion);}});}

  for(const p of people){
   const use=!!(this.loaded[citizenKey(p.i)]||this.loaded['citizen'+p.i%6])&&p.active&&Math.abs(p.z-state.z)<(high?150:65);
   if(use&&p.detail&&this.loaded[citizenKey(p.i)]&&p.detail.asset!==this.loaded[citizenKey(p.i)]){this.scene.remove(p.detail.root);p.detail.mixer.stopAllAction();p.detail.root.traverse(o=>{if(o.isMesh)o.material.dispose();});p.detail=null;}if(use&&!p.detail)this.makeCitizen(p);const changed=p.detailed!==use;p.detailed=use;if(changed&&town)town.pose(p,['walk','cross','board'].includes(p.state),world.atmo.rain,0);if(!p.detail)continue;p.detail.root.visible=use;
   if(use){const d=p.detail;d.root.position.set(p.x,p.y,p.z);d.root.scale.setScalar(p.scale);
    const delta=Math.atan2(Math.sin(p.yaw-d.yaw),Math.cos(p.yaw-d.yaw));d.yaw+=delta*(1-Math.exp(-dt*10));d.root.rotation.y=d.yaw;
    const speed=dt>0?Math.hypot(p.x-d.lastX,p.z-d.lastZ)/dt:0,walking=speed>.08&&speed<4;
    d.blend+=((walking?1:0)-d.blend)*(1-Math.exp(-dt*12));d.walk.setEffectiveWeight(d.blend);d.idle.setEffectiveWeight(1-d.blend);
    d.walk.setEffectiveTimeScale(Math.min(2,Math.max(.2,speed/(d.stride*p.scale))));d.mixer.update(dt);
    if(p.umbrella&&world.atmo.rain>.25&&d.arm.every(Boolean)){d.root.updateMatrixWorld(true);const target=d.root.localToWorld(new T.Vector3(.1,1.68,.18)),pole=d.root.localToWorld(new T.Vector3(.42,1.18,.3));reachHand(...d.arm,target,pole);}
   }
   if(p.detail){p.detail.lastX=p.x;p.detail.lastZ=p.z;}

  }
  this.updateFoxes(dt,state,world);
 }
 updateFoxes(dt,state,world){
  if(!this.loaded.fox)return;
  if(!this.foxes.length)for(let i=0;i<3;i++){
   const animation=animatedAnimal(this.loaded.fox,'fox',i),root=animation.root;this.scene.add(root);this.foxes.push({root,animation,z:-1e6,i});
  }
  for(const f of this.foxes){const active=this.settings.location==='hills'&&(!world.landmarks.active(state.z)||['lake','forest'].includes(world.landmarks.kindAt(state.z)));f.root.visible=active;if(!active)continue;if(Math.abs(f.z-state.z)>220)f.z=state.z+65+f.i*45;f.z+=dt*.65;const x=world.road.x(f.z)+world.road.half(f.z)+10+f.i*2,y=world.surfaceHeight(x,f.z);f.root.position.set(x,y,f.z);f.root.rotation.y=Math.atan(world.road.tangent(f.z));f.root.visible=y>-7&&!world.road.roadUnder(x,f.z,2);f.animation.update(dt,.65);}
 }
}
