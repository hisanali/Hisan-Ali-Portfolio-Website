import * as THREE from "three";
import type {FoldPiece} from "../lib/packaging-document";
const inside=(x:number,y:number,ring:number[][])=>{
 let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [ax,ay]=ring[i],[bx,by]=ring[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)yes=!yes;
 }return yes;
};
export function panelShapes(q:FoldPiece):THREE.Shape[] {
 const outer=[q.points||[[0,0],[q.w,0],[q.w,q.h],[0,q.h]],...(q.islands||[])];
 return outer.map(points=>{
  const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  for(const ring of q.holes||[]){
   if(!inside(ring[0][0],ring[0][1],points))continue;
   const hole=new THREE.Path();ring.forEach(([x,y],i)=>i?hole.lineTo(x,y):hole.moveTo(x,y));hole.closePath();shape.holes.push(hole);
  }return shape;
 });
}
/** An imported cutter is the board boundary; a decorative bevel must not expand it. */
export function panelBodyGeometry(q:FoldPiece,thickness:number,faithful:boolean) {
 return new THREE.ExtrudeGeometry(panelShapes(q),{
  depth:thickness,bevelEnabled:!faithful,bevelSize:Math.min(.25,thickness/3),bevelThickness:.12,bevelSegments:3,steps:1,
 });
}
