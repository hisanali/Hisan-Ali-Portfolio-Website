import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {clone as cloneSkin} from './vendor/utils/SkeletonUtils.js';
import {addMicroSurface} from './surface-detail.js?v=20260926-people3';
import {reachHand} from './pedestrian-motion.js?v=20260926-people3';
import {batchStatic} from './mesh-batching.js?v=20260926-people3';

const box=new T.Box3();
function prepareCar(scene){
 scene.updateMatrixWorld(true);
 const lamp=scene.getObjectByName('BodyHeadlights');
 if(lamp&&new T.Box3().setFromObject(lamp).getCenter(new T.Vector3()).z<0)scene.rotation.y+=Math.PI;
 scene.updateMatrixWorld(true);
 const root=new T.Group(),wheels=new Map();
 scene.traverse(o=>{
  if(!o.isMesh)return;
  let ancestor=o.parent;while(ancestor&&!/^Wheel(?:Front|Rear)[LR]$/.test(ancestor.name))ancestor=ancestor.parent;
  let parent=root,center=new T.Vector3();
  if(ancestor){if(!wheels.has(ancestor.name)){const g=new T.Group();g.name=ancestor.name;g.position.setFromMatrixPosition(ancestor.matrixWorld);root.add(g);wheels.set(ancestor.name,g);}parent=wheels.get(ancestor.name);center.copy(parent.position);}
  const geometry=o.geometry.clone();geometry.applyMatrix4(o.matrixWorld);geometry.translate(-center.x,-center.y,-center.z);
  const mesh=new T.Mesh(geometry,o.material);mesh.name=o.name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 });
 batchStatic(root);for(const wheel of wheels.values())batchStatic(wheel);
 box.setFromObject(root);const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=4.7/size.z;
 root.scale.setScalar(scale);root.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
 const wrapper=new T.Group();wrapper.add(root);return wrapper;
}
export class DetailedModels{
 constructor(scene,settings){
  this.scene=scene;this.settings=settings;this.loaded={};this.errors=[];this.foxes=[];this.animalModels=new WeakSet();this.animalCount=0;const loader=new GLTFLoader();
  for(const [key,file] of Object.entries({car:'traffic-car.glb',fox:'fox.glb',...Object.fromEntries(Array.from({length:6},(_,i)=>['citizen'+i,'pedestrian-'+i+'.glb'])),...Object.fromEntries(['cow','sheep','dog','cat'].map(k=>[k,k+'.glb']))}))loader.load(new URL('./assets/models/'+file,import.meta.url).href,g=>{this.loaded[key]=key==='car'?{scene:prepareCar(g.scene)}:g;},undefined,e=>{this.errors.push(key);console.warn('Optional detailed model unavailable:',key,e.message);});
 }
 makeCar(c){
  const model=this.loaded.car.scene.clone(true),colors=[0x9c2524,0x243749,0xd2d1c8,0x26272a,0x557065,0x978467];
  const mats=new Map();model.traverse(o=>{if(!o.isMesh)return;const base=o.material;if(!mats.has(base)){const m=base.clone();if(/Paint 1/i.test(m.name)){m.color.set(colors[Math.floor(Math.random()*colors.length)]);m.metalness=.65;m.roughness=.25;}if(m.transmission){m.transmission=0;m.transparent=true;m.opacity=.42;m.depthWrite=false;}m.envMapIntensity=.8;mats.set(base,m);}o.material=mats.get(base);});
  model.scale.setScalar(c.length/4.7);c.detailWheels=[];model.traverse(o=>{if(/^Wheel(?:Front|Rear)[LR]$/.test(o.name))c.detailWheels.push({node:o,front:o.name.includes('Front'),base:o.quaternion.clone()});});
  const preserve=new Set([c.beam,...Object.values(c.lamps||{}).flat()]);c.detailFallback=c.g.children.filter(o=>!preserve.has(o));c.g.add(model);c.detailModel=model;
 }
 makeCitizen(p){
  const asset=this.loaded['citizen'+p.i%6],model=cloneSkin(asset.scene),root=new T.Group();root.add(model);this.scene.add(root);
  const shirts=[0x365368,0xb6a17c,0x4c6152,0xa25040,0x766287,0xd0cabc,0x354351,0x7b3035,0x667d85,0x8b724c,0x405850,0x9b9691];
  const trousers=[0x253348,0x3e3931,0x353a3b,0x263e55,0x524532,0x606569];
  const mats=new Map();model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;const original=o.material;
   if(!mats.has(original)){const m=original.clone();if(m.name.includes('Cloth_Shirt'))m.color.set(shirts[p.i%shirts.length]);if(m.name.includes('Cloth_Trousers'))m.color.set(trousers[(p.i*5+Math.floor(p.i/6))%trousers.length]);if(m.name.includes('Cloth'))addMicroSurface(m,'fabric',.002);mats.set(original,m);}o.material=mats.get(original);
  });
  const mixer=new T.AnimationMixer(model),walk=mixer.clipAction(asset.animations.find(a=>a.name==='Walk')).play(),idle=mixer.clipAction(asset.animations.find(a=>a.name==='Idle')).play();
  walk.time=(p.i*.173)%walk.getClip().duration;idle.time=p.i*.117;idle.setEffectiveWeight(0);
  p.detail={root,mixer,walk,idle,arm:['lArm','lForearm','lHand'].map(n=>model.getObjectByName(n)),blend:1,lastX:p.x,lastZ:p.z,yaw:p.yaw};
 }
 makeAnimal(a){
  const model=this.loaded[a.kind].scene.clone(true);a.detailFallback=[...a.g.children];a.g.add(model);a.detailModel=model;
  const variant=this.animalCount++,mats=new Map();model.scale.setScalar(.94+(variant%5)*.025);
  model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const base=o.material;if(!mats.has(base)){const m=base.clone();if(m.name.startsWith('Coat')&&['dog','cat'].includes(a.kind))m.color.set([0x966e49,0x343333,0xb79c7b,0xbdb7a9][variant%4]);if(m.name.startsWith('CowPatches')&&variant%3===0)m.color.set(0xa97950);if(o.geometry.attributes.uv&&m.roughness>.7)addMicroSurface(m,a.kind==='sheep'?'wool':'fur',a.kind==='sheep'?.008:.002);mats.set(base,m);}o.material=mats.get(base);});
  const groups=[];model.traverse(o=>{if(o.isGroup)groups.push(o);});groups.reverse().forEach(g=>batchStatic(g));
  a.detailControls={neck:model.getObjectByName('Neck'),head:model.getObjectByName('Head'),tail:model.getObjectByName('Tail'),legs:Array.from({length:a.kind==='cat'?2:4},(_,i)=>({hip:model.getObjectByName('Hip'+i),knee:model.getObjectByName('Knee'+i)}))};
  this.animalModels.add(a);
 }
 update(dt,state,traffic,people,world,animals=[],town=null){
  for(const a of animals)if(this.loaded[a.kind]&&!this.animalModels.has(a))this.makeAnimal(a);
  const high=this.settings.quality==='high'||this.settings.quality==='ultra';
  for(const a of animals){if(!a.detailModel)continue;const use=Math.abs(a.z-state.z)<(high?220:90)&&a.g.position.y>-400;a.detailModel.visible=use;a.detailFallback.forEach(o=>o.visible=!use);if(!use)continue;for(const key of ['neck','head','tail'])if(a[key]&&a.detailControls[key])a.detailControls[key].quaternion.copy(a[key].quaternion);a.legs?.forEach((leg,i)=>{if(leg.hip){a.detailControls.legs[i].hip.quaternion.copy(leg.hip.quaternion);a.detailControls.legs[i].knee.quaternion.copy(leg.knee.quaternion);}});}

  const nearby=traffic.filter(c=>c.g.visible&&c.kind==='car').sort((a,b)=>Math.abs(a.z-state.z)-Math.abs(b.z-state.z));
  const chosen=new Set(nearby.slice(0,high?8:3));
  for(const c of traffic){
   const use=!!this.loaded.car&&chosen.has(c)&&Math.abs(c.z-state.z)<(high?190:85);
   if(use&&!c.detailModel)this.makeCar(c);
   if(!c.detailModel)continue;c.detailModel.visible=use;for(const child of c.detailFallback)child.visible=!use;
   if(use){c.detailAngle=(c.detailAngle||0)-c.speed*dt/.34;for(const w of c.detailWheels){w.node.quaternion.copy(w.base);if(w.front)w.node.rotateY(c.steer||0);w.node.rotateX(c.detailAngle);}c.detailModel.traverse(o=>{if(o.isMesh&&/Brakelight/i.test(o.material.name))o.material.emissiveIntensity=c.braking?2:.4;});}
  }
  for(const p of people){
   const use=!!this.loaded['citizen'+p.i%6]&&p.active&&Math.abs(p.z-state.z)<(high?150:65);
   if(use&&!p.detail)this.makeCitizen(p);const changed=p.detailed!==use;p.detailed=use;if(changed&&town)town.pose(p,['walk','cross','board'].includes(p.state),world.atmo.rain,0);if(!p.detail)continue;p.detail.root.visible=use;
   if(use){const d=p.detail;d.root.position.set(p.x,p.y,p.z);d.root.scale.setScalar(p.scale);
    const delta=Math.atan2(Math.sin(p.yaw-d.yaw),Math.cos(p.yaw-d.yaw));d.yaw+=delta*(1-Math.exp(-dt*10));d.root.rotation.y=d.yaw;
    const speed=dt>0?Math.hypot(p.x-d.lastX,p.z-d.lastZ)/dt:0,walking=['walk','cross','board'].includes(p.state)&&speed>.03;
    d.blend+=((walking?1:0)-d.blend)*(1-Math.exp(-dt*12));d.walk.setEffectiveWeight(d.blend);d.idle.setEffectiveWeight(1-d.blend);
    d.walk.setEffectiveTimeScale(Math.min(2,Math.max(.2,speed/(.96875*p.scale))));d.mixer.update(dt);
    if(p.umbrella&&world.atmo.rain>.25){d.root.updateMatrixWorld(true);const target=d.root.localToWorld(new T.Vector3(.1,1.68,.18)),pole=d.root.localToWorld(new T.Vector3(.42,1.18,.3));reachHand(...d.arm,target,pole);}
   }
   if(p.detail){p.detail.lastX=p.x;p.detail.lastZ=p.z;}

  }
  this.updateFoxes(dt,state,world);
 }
 updateFoxes(dt,state,world){
  if(!this.loaded.fox)return;
  if(!this.foxes.length)for(let i=0;i<3;i++){
   const model=cloneSkin(this.loaded.fox.scene),root=new T.Group();model.scale.setScalar(.012);root.add(model);this.scene.add(root);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   const mixer=new T.AnimationMixer(model),action=mixer.clipAction(this.loaded.fox.animations.find(a=>a.name==='Walk'));action.play();action.time=i*.3;this.foxes.push({root,mixer,z:-1e6,i});
  }
  for(const f of this.foxes){const active=this.settings.location==='hills'&&(!world.landmarks.active(state.z)||this.settings.destination==='lake');f.root.visible=active;if(!active)continue;if(Math.abs(f.z-state.z)>220)f.z=state.z+65+f.i*45;f.z+=dt*.65;const x=world.road.x(f.z)+world.road.half(f.z)+10+f.i*2,y=world.surfaceHeight(x,f.z);f.root.position.set(x,y,f.z);f.root.rotation.y=Math.atan(world.road.tangent(f.z));f.root.visible=y>-7&&!world.road.roadUnder(x,f.z,2);f.mixer.update(dt*.8);}
 }
}
