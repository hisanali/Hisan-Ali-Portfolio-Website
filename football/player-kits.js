// Keep the authors' skin, face and hair maps; adapt only garment colors.
import * as T from '../evermile/vendor/three.module.js';
const kitTextures=new Map();
function neutralKit(texture,lift){
 const key=texture.uuid+':'+lift;if(kitTextures.has(key))return kitTextures.get(key);
 const image=texture.image,c=document.createElement('canvas');c.width=image.width;c.height=image.height;
 const g=c.getContext('2d');g.drawImage(image,0,0);const pixels=g.getImageData(0,0,c.width,c.height),d=pixels.data;
 for(let i=0;i<d.length;i+=4){const y=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;const value=Math.round(255*(lift+(1-lift)*Math.sqrt(y)));d[i]=d[i+1]=d[i+2]=value;}
 g.putImageData(pixels,0,0);const map=texture.clone();map.source=new T.Source(c);map.needsUpdate=true;kitTextures.set(key,map);return map;
}
export function matchPlayerMaterial(source,shirt,shorts,star){
 const m=source.clone(),name=source.name.toLowerCase();m.roughness=Math.max(.65,m.roughness);m.envMapIntensity=.5;
 const top=name.startsWith('t0163_')||name==='t_shirt';
 const bottom=name.startsWith('t0162_')||name==='classic_shorts';
 if(top||bottom){if(m.map)m.map=neutralKit(m.map,star==='messi'?.5:star==='squad'?.28:0);m.color.set(top?shirt:shorts);m.roughness=.88;m.roughnessMap=null;m.envMapIntensity=.35;if(m.normalMap)m.normalScale.set(.5,.5);m.metalness=0;m.transparent=false;m.depthWrite=true;m.opacity=1;m.alphaTest=0;}
 return m;
}
