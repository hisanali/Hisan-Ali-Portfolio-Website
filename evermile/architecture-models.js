import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
export class ArchitectureModels{
 constructor(world){this.loaded={};this.errors=[];const loader=new GLTFLoader();for(const key of ['apartments','brick-works','coastal-fort'])loader.load(new URL('./assets/models/place-'+key+'.glb?v=supplied7',import.meta.url).href,g=>{
  g.scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(g.scene),center=bounds.getCenter(new T.Vector3());g.scene.position.set(-center.x,-bounds.min.y,-center.z);
  g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.shared=true;}});this.loaded[key]=g.scene;
  for(const group of world.chunks.values())group.userData.stale=true;
 },undefined,e=>{this.errors.push(key);console.warn('Architecture asset unavailable',key,e.message)});}
 place(key,group,x,y,z,yaw){const source=this.loaded[key];if(!source)return null;const root=new T.Group();root.add(source.clone(true));root.position.set(x,y,z);root.rotation.y=yaw;group.add(root);return root;}
}
