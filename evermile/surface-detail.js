import * as T from './vendor/three.module.js';
import {random} from './math.js?v=20260926-transit3';
const cache=new Map();
export function microSurface(kind){
 if(cache.has(kind))return cache.get(kind);
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),rng=random(kind==='wool'?417:193);
 x.fillStyle='#888';x.fillRect(0,0,256,256);
 if(kind==='fabric'){
  x.lineWidth=1;for(let i=0;i<256;i+=3){x.strokeStyle=i%2?'#727272':'#aaa';x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.stroke();x.strokeStyle='#929292';x.beginPath();x.moveTo(0,i);x.lineTo(256,i);x.stroke();}
 }else if(kind==='rubber'){
  x.strokeStyle='#333';x.lineWidth=3;for(let i=-16;i<32;i++){x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16+100,128);x.lineTo(i*16,256);x.stroke();}
 }else for(let i=0;i<5500;i++){const v=90+rng()*90;x.strokeStyle=`rgb(${v},${v},${v})`;x.fillStyle=x.strokeStyle;x.lineWidth=.6+rng();x.beginPath();if(kind==='wool'){x.arc(rng()*256,rng()*256,1+rng()*3,0,6.28);x.stroke();}else{const px=rng()*256,py=rng()*256;x.moveTo(px,py);x.lineTo(px+1,py+3+rng()*6);x.stroke();}}
 const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;cache.set(kind,texture);return texture;
}
export function addMicroSurface(material,kind,scale=.015){material.bumpMap=microSurface(kind);material.bumpScale=scale;material.needsUpdate=true;return material;}
