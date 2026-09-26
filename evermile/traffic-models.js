import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {mountImportedWheel,rollWheel} from './wheel-rig.js?v=20260926-supplied7';
export class TrafficModels {
 constructor(){this.loaded={};this.errors=[];const loader=new GLTFLoader();for(const style of ['sedan','hatch','suv','wagon','pickup','van','bus','coach','mercedes'])loader.load(new URL('./assets/models/road-'+style+'.glb?v=supplied7',import.meta.url).href,g=>this.loaded[style]=g.scene,undefined,e=>{this.errors.push(style);console.warn('Traffic asset',style,e.message)});}
 attach(c){
  const model=this.loaded[c.style].clone(true);const original=[...c.g.children];c.g.add(model);c.detailModel=model;c.detailFallback=original;
  const wheels=[];model.traverse(o=>{if(/^Wheel_[FR][LR]$/.test(o.name))wheels.push(o);});
  // Build pivots in the model's unscaled local frame, independent of the traffic root's world pose.
  const parent=model.parent;parent.remove(model);model.updateMatrixWorld(true);
  c.detailWheels=wheels.map(o=>mountImportedWheel(o,model,o.name[6]==='F'));parent.add(model);
  c.detailLamps={head:['HeadL','HeadR'].map(n=>model.getObjectByName(n)).filter(Boolean),tail:['TailL','TailR'].map(n=>model.getObjectByName(n)).filter(Boolean),left:[],right:[]};
  c.detailLamps.left=[c.detailLamps.head[0],c.detailLamps.tail[0]].filter(Boolean);c.detailLamps.right=[c.detailLamps.head[1],c.detailLamps.tail[1]].filter(Boolean);
  const mats=new Map();model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const src=o.material;if(!mats.has(src)){const m=src.clone();m.envMapIntensity=1;mats.set(src,m);}o.material=mats.get(src);});
 }
 update(dt,state,traffic,high){
  for(const c of traffic){if(c.kind!=='car'&&c.kind!=='bus')continue;const use=!!this.loaded[c.style]&&c.g.visible&&Math.abs(c.z-state.z)<(high?220:100);
   if(use&&!c.detailModel)this.attach(c);if(!c.detailModel)continue;c.detailModel.visible=use;c.detailFallback.forEach(o=>{if(o!==c.beam)o.visible=!use;});
   if(use){for(const wheel of c.detailWheels)rollWheel(wheel,c.speed*dt,c.steer||0);c.detailModel.traverse(o=>{if(o.isMesh&&o.material.name==='TailLens')o.material.emissiveIntensity=c.braking?2:.15;});}
  }
 }
}
