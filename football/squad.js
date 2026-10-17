import * as T from '../evermile/vendor/three.module.js';
import { matchPlayerMaterial } from './player-kits.js?v=15';
// Adult proportions, with coherent face deformation applied to skin, eyes and
// hair together in bind space. Profiles are shared across LODs and re-matches.
const builds=[
 [1.78,.96,1.03,.97,.05,'#e7c5ad','#33241d'],
 [1.87,1.06,.96,1.06,.02,'#b88c6c','#151719'],
 [1.81,1.01,1.04,1.02,-.02,'#edd4c0','#715b42'],
 [1.75,.95,.96,.95,.04,'#885f46','#171512'],
 [1.90,1.04,1.02,1.05,-.03,'#d4aa88','#44322b'],
 [1.83,.98,.97,1.07,.02,'#a77b5d','#241e1a'],
 [1.76,1.02,1.04,.94,-.04,'#e1b799','#514135'],
 [1.85,1.06,.98,1,.03,'#754f3a','#131211'],
 [1.80,.97,1.01,1.04,-.02,'#c59778','#30231b'],
 [1.88,1.02,1.05,.98,.03,'#e8c9b2','#423526'],
 [1.79,1.04,.96,1.02,-.03,'#996f52','#242020'],
 [1.84,.95,1.02,1.06,.02,'#ccaa8d','#29211c']
];
export function squadProfile(index,away,keeper){
 const id=(index+(away?5:0))%builds.length,[height,width,faceWidth,faceLength,jaw,skin,hair]=builds[id];
 return {id,height:keeper?1.93:height,width,faceWidth,faceLength,jaw,skin,hair};
}
const geometryCache=new Map();
export function shapeSquadMesh(mesh,model,profile){
 const key=mesh.geometry.uuid+':'+profile.id;if(geometryCache.has(key)){mesh.geometry=geometryCache.get(key);return;}
 model.updateWorldMatrix(true,true);
 const head=model.getObjectByName('Head').getWorldPosition(new T.Vector3());
 const matrix=mesh.matrixWorld.clone(),inverse=matrix.clone().invert(),source=mesh.geometry.attributes.position;
 const geometry=mesh.geometry.clone(),positions=new Float32Array(source.count*3),v=new T.Vector3();
 for(let i=0;i<source.count;i++){
  v.fromBufferAttribute(source,i).applyMatrix4(matrix);
  const blend=T.MathUtils.smoothstep(v.y,head.y-.09,head.y+.08),h=v.y-head.y;
  const jaw=1-T.MathUtils.smoothstep(h,0,.15);
  v.x+=(v.x-head.x)*(profile.faceWidth-1+profile.jaw*jaw)*blend;
  v.y+=h*(profile.faceLength-1)*blend;
  v.applyMatrix4(inverse).toArray(positions,i*3);
 }
 geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.deleteAttribute('normal');geometry.deleteAttribute('tangent');geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometryCache.set(key,geometry);mesh.geometry=geometry;
}
const shirtMaps=new Map();
function numberedShirt(map,number){
 const key=map.uuid+':'+number;if(shirtMaps.has(key))return shirtMaps.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const g=canvas.getContext('2d');g.drawImage(map.image,0,0,1024,1024);
 // The exported shirt UVs use an upward V axis; keep the back number upright.
 g.translate(0,1024);g.scale(1,-1);g.fillStyle='#171b20';g.textAlign='center';g.textBaseline='middle';g.font='700 190px Arial';g.fillText(String(number),270,300,240);
 const texture=map.clone();texture.source=new T.Source(canvas);texture.needsUpdate=true;shirtMaps.set(key,texture);return texture;
}
export function squadMaterial(source,profile,shirt,shorts,number){
 const m=matchPlayerMaterial(source,shirt,shorts,'squad'),name=source.name.toLowerCase();m.metalness=0;
 if(name==='t_shirt'&&m.map&&number)m.map=numberedShirt(m.map,number);
 if(name.startsWith('std_skin')||name==='std_nails'){
  // Authored pores and colour remain in the maps. The multiplier varies
  // complexion without painting dark eye sockets or losing skin detail.
  m.color.set(profile.skin);m.roughness=.68;m.roughnessMap=null;m.envMapIntensity=.45;
  if(m.normalMap)m.normalScale.set(.65,.65);
 }
 if(name.includes('hair')){m.color.set(profile.hair);m.roughness=.9;m.roughnessMap=null;m.envMapIntensity=.25;m.alphaTest=.38;m.transparent=false;m.depthWrite=true;m.side=T.DoubleSide;}
 if(name.includes('eyelash')){m.alphaTest=.4;m.transparent=false;m.depthWrite=true;}
 if(name.startsWith('std_eye')&&!name.includes('lash')){m.color.set('#e3ded3');m.roughness=.32;m.envMapIntensity=.55;}
 if(name.startsWith('std_cornea')){m.roughness=.16;m.envMapIntensity=.65;}
 if(name==='match_socks'){m.color.set('#deded2');m.roughness=.94;}
 if(name==='boots'){m.color.set('#898b83');m.roughness=.55;}
 return m;
}
