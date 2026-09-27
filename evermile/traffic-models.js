import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {DRACOLoader} from './vendor/loaders/DRACOLoader.js';
// The supplied Toyotas are detailed enough to be heavy in numbers, so they only drive in traffic on Ultra; elsewhere those
// cars wear the everyday hatchback and SUV bodies.
const ULTRA={grcorolla:{file:'car-gr-corolla.glb',base:'hatch'},landcruiser:{file:'car-land-cruiser.glb',base:'suv'}};
const PAINTS=[0xb51f25,0xe9e7db,0x1e2d4a,0x16171a,0xb9c1c9,0x3a5a48,0x7b9ba8];
import {mountImportedWheel,rollWheel} from './wheel-rig.js?v=20260927-train1';
export class TrafficModels {
 constructor(){this.loaded={};this.errors=[];const loader=this.loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('./vendor/draco/').setWorkerLimit(1));for(const style of ['sedan','hatch','suv','wagon','pickup','van','bus','coach','mercedes'])loader.load(new URL('./assets/models/road-'+style+'.glb?v=supplied7',import.meta.url).href,g=>this.loaded[style]=g.scene,undefined,e=>{this.errors.push(style);console.warn('Traffic asset',style,e.message)});}
 loadUltra(){if(this.ultraRequested)return;this.ultraRequested=true;for(const [style,{file}] of Object.entries(ULTRA))this.loader.load(new URL('./assets/models/'+file+'?v=20260927a',import.meta.url).href,g=>this.loaded[style]=g.scene,undefined,e=>{this.errors.push(style);console.warn('Traffic asset',style,e.message)});}
 // Which body a car shows: its own model, or on lower settings the everyday one it stands in for.
 styleFor(c,ultra){const u=ULTRA[c.style];if(!u)return c.style;if(ultra)this.loadUltra();return ultra&&this.loaded[c.style]?c.style:u.base;}
 attach(c,style=c.style){
  const original=c.detailFallback||[...c.g.children];if(c.detailModel)c.g.remove(c.detailModel);
  const model=(c.detailModels||={})[style]||this.loaded[style].clone(true);c.detailModels[style]=model;c.g.add(model);c.detailModel=model;c.detailStyle=style;c.detailFallback=original;if(model.userData.rigged){c.detailWheels=model.userData.rigged;c.detailLamps=model.userData.lamps;return;}
  const wheels=[];model.traverse(o=>{if(/^Wheel_[FR][LR]$/.test(o.name))wheels.push(o);});
  // Build pivots in the model's unscaled local frame, independent of the traffic root's world pose.
  const parent=model.parent;parent.remove(model);model.updateMatrixWorld(true);
  c.detailWheels=wheels.map(o=>mountImportedWheel(o,model,o.name[6]==='F'));
  // Separate calipers steer with their wheel; models without lamp anchors get them at the corners of the body.
  const calipers=[];model.traverse(o=>{if(/^Caliper_[FR][LR]$/.test(o.name))calipers.push(o);});
  for(const o of calipers){const w=c.detailWheels.find(q=>q.pivot.name==='Wheel_'+o.name.slice(-2)+'Steering');if(w)w.pivot.attach(o);}
  if(!model.getObjectByName('HeadL')){const box=new T.Box3().setFromObject(model),x=box.max.x-.32;for(const [name,px,py,pz] of [['HeadL',x,box.max.y*.45,box.max.z-.08],['HeadR',-x,box.max.y*.45,box.max.z-.08],['TailL',x,box.max.y*.55,box.min.z+.08],['TailR',-x,box.max.y*.55,box.min.z+.08]]){const o=new T.Object3D();o.name=name;o.position.set(px,py,pz);model.add(o);}}
  parent.add(model);
  c.detailLamps={head:['HeadL','HeadR'].map(n=>model.getObjectByName(n)).filter(Boolean),tail:['TailL','TailR'].map(n=>model.getObjectByName(n)).filter(Boolean),left:[],right:[]};
  c.detailLamps.left=[c.detailLamps.head[0],c.detailLamps.tail[0]].filter(Boolean);c.detailLamps.right=[c.detailLamps.head[1],c.detailLamps.tail[1]].filter(Boolean);
  const mats=new Map(),paint=PAINTS[Math.floor(Math.random()*PAINTS.length)];model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const src=o.material;if(!mats.has(src)){const m=src.clone();m.envMapIntensity=1;if(m.name==='BodyPaint'&&ULTRA[style])m.color.setHex(paint);mats.set(src,m);}o.material=mats.get(src);});
  model.userData.rigged=c.detailWheels;model.userData.lamps=c.detailLamps;
 }
 update(dt,state,traffic,high,ultra=false){
  for(const c of traffic){if(c.kind!=='car'&&c.kind!=='bus')continue;const style=this.styleFor(c,ultra),use=!!this.loaded[style]&&c.g.visible&&Math.abs(c.z-state.z)<(high?220:100);
   if(use&&c.detailStyle!==style)this.attach(c,style);if(!c.detailModel)continue;c.detailModel.visible=use;c.detailFallback.forEach(o=>{if(o!==c.beam)o.visible=!use;});
   if(use){for(const wheel of c.detailWheels)rollWheel(wheel,c.speed*dt,c.steer||0);c.detailModel.traverse(o=>{if(o.isMesh&&o.material.name.startsWith('TailLens'))o.material.emissiveIntensity=c.braking?2:.15;});}
  }
 }
}
