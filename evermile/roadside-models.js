import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
// Static imported geometry is shared across streamed chunks, never disposed with one chunk.
export class RoadsideModels {
 constructor(world){this.loaded={};this.errors=[];const loader=new GLTFLoader();for(const key of ['pump','shop','canopy','signal','ice','bin'])loader.load(new URL('./assets/models/prop-'+key+'.glb?v=transit3',import.meta.url).href,g=>{
  g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.shared=true;}});this.loaded[key]=g.scene;
  for(const group of world.chunks.values())group.userData.stale=true;
 },undefined,e=>{this.errors.push(key);console.warn('Roadside asset unavailable',key,e.message)});}
 place(key,parent,x,y,z,yaw=0){const source=this.loaded[key];if(!source)return null;const root=new T.Group();root.name='Imported '+key;root.add(source.clone(true));root.position.set(x,y,z);root.rotation.y=yaw;parent.add(root);return root;}
 signal(parent,x,y){const root=this.place('signal',parent,x,y,0);if(!root)return null;return Object.fromEntries(['red','amber','green'].map(k=>[k,root.getObjectByName(k)]));}
}
