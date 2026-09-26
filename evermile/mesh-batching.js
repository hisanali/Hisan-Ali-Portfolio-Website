import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
// Merge only static siblings. Animated wheels, lamps, riders and transparent beams stay separate.
export function batchStatic(group, excluded = new Set()) {
 const batches=new Map();
 for(const child of [...group.children]){
  if(!child.isMesh||child.isInstancedMesh||excluded.has(child)||Array.isArray(child.material)||child.material.transparent||child.userData.container)continue;
  const key=child.material.uuid+':'+child.castShadow+':'+child.receiveShadow;
  if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);
 }
 for(const list of batches.values()){
  if(list.length<2)continue;
  const pieces=list.map(o=>{o.updateMatrix();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.color){const colors=new Float32Array(g.attributes.position.count*3);colors.fill(1);g.setAttribute('color',new T.Float32BufferAttribute(colors,3));}return g;});
  const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geometry)continue;
  const mesh=new T.Mesh(geometry,list[0].material);mesh.castShadow=list[0].castShadow;mesh.receiveShadow=list[0].receiveShadow;group.add(mesh);list.forEach(o=>group.remove(o));
 }
}
