import * as THREE from 'three';
import type {FoldPiece} from '../lib/packaging-document';
const rings=(p:FoldPiece)=>[p.points||[[0,0],[p.w,0],[p.w,p.h],[0,p.h]],...(p.islands||[])];
const inside=(x:number,y:number,ring:number[][])=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[a,b]=ring[i],[c,d]=ring[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;};
const boundary=(x:number,y:number,ring:number[][],allowance=.025)=>ring.some(([a,b],i)=>{const[c,d]=ring[(i+1)%ring.length],dx=c-a,dy=d-b,t=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a-t*dx,y-b-t*dy)<allowance;});
const materialAt=(p:FoldPiece,x:number,y:number,allowance=.025)=>rings(p).some(r=>inside(x-p.x,y-p.y,r)||boundary(x-p.x,y-p.y,r,allowance))&&!(p.holes||[]).some(r=>inside(x-p.x,y-p.y,r));
/** Only actual shared board connects: never bridge a slot, hole or disconnected edge. */
export function creaseSpans(parent:FoldPiece,piece:FoldPiece,allowance=.025):[number,number][] {
 const h=piece.hinge;if(!h)return[];const[ax,ay]=h.a,[bx,by]=h.b,dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);if(length<.01)return[];
 const cuts=[0,1];
 for(const p of[parent,piece])for(const ring of[...rings(p),...(p.holes||[])])for(let i=0;i<ring.length;i++){
  const[x,y]=ring[i],[X,Y]=ring[(i+1)%ring.length],ex=X-x,ey=Y-y,rx=x+p.x-ax,ry=y+p.y-ay,den=dx*ey-dy*ex;
  if(Math.abs(den)>1e-8){const t=(rx*ey-ry*ex)/den,u=(rx*dy-ry*dx)/den;if(t>0&&t<1&&u>=-1e-6&&u<=1+1e-6)cuts.push(t);}
  else if(Math.abs(rx*dy-ry*dx)<.001){for(const[v,w]of[[rx,ry],[rx+ex,ry+ey]]){const t=(v*dx+w*dy)/(length*length);if(t>0&&t<1)cuts.push(t);}}
 }
 const sorted=[...new Set(cuts.map(t=>Number(t.toFixed(8))))].sort((a,b)=>a-b),result:[number,number][]=[];
 for(let i=1;i<sorted.length;i++){const a=sorted[i-1],b=sorted[i],t=(a+b)/2;if((b-a)*length<.01||!materialAt(parent,ax+dx*t,ay+dy*t,allowance)||!materialAt(piece,ax+dx*t,ay+dy*t,allowance))continue;const last=result.at(-1);if(last&&Math.abs(last[1]-a)<1e-7)last[1]=b;else result.push([a,b]);}
 return result;
}
export type CreaseContact={parent:number[];child:number[]}[][];
/** Score centres may sit inside a narrow manufacturing allowance. Join the actual skin edges. */
export function creaseContacts(parent:FoldPiece,piece:FoldPiece,spans:[number,number][]):CreaseContact {
 const h=piece.hinge!,dx=h.b[0]-h.a[0],dy=h.b[1]-h.a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
 const offset=(p:FoldPiece,x:number,y:number)=>{
  if(materialAt(p,x,y))return[0,0];let distance=Infinity,result=[0,0];
  for(const ring of rings(p))for(let i=0;i<ring.length;i++){
   const[a,b]=ring[i],[c,d]=ring[(i+1)%ring.length],ex=c-a,ey=d-b,t=Math.max(0,Math.min(1,((x-p.x-a)*ex+(y-p.y-b)*ey)/(ex*ex+ey*ey||1))),X=p.x+a+ex*t,Y=p.y+b+ey*t,dist=Math.hypot(X-x,Y-y);
   if(dist<distance){distance=dist;const amount=(X-x)*nx+(Y-y)*ny;result=[nx*amount,ny*amount];}
  }return result;
 };
 return spans.map(span=>span.map(t=>{const x=h.a[0]+dx*t,y=h.a[1]+dy*t;return{parent:offset(parent,x,y),child:offset(piece,x,y)};}));
}
export function creaseRibbon(spans:[number,number][],steps=16){
 const geometry=new THREE.BufferGeometry(),positions=new Float32Array(spans.length*(steps+1)*2*3),uv=new Float32Array(spans.length*(steps+1)*2*2),indices:number[]=[];
 for(let s=0;s<spans.length;s++)for(let i=0;i<steps;i++){const a=s*(steps+1)*2+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);return geometry;
}
/** Curved paper skin joining the two printed surfaces around the neutral crease. */
export function updateCreaseRibbon(geometry:THREE.BufferGeometry,piece:FoldPiece,spans:[number,number][],angle:number,radius:number,parentShift:number,childShift:number,contacts?:CreaseContact){
 const h=piece.hinge!;const dx=h.b[0]-h.a[0],dy=h.b[1]-h.a[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,positions=geometry.getAttribute('position')as THREE.BufferAttribute,uv=geometry.getAttribute('uv')as THREE.BufferAttribute,steps=positions.count/(spans.length*2)-1;
 for(let s=0;s<spans.length;s++)for(let i=0;i<=steps;i++)for(let e=0;e<2;e++){
  const f=i/steps,t=spans[s][e],theta=angle*f,sin=Math.sin(theta),cos=Math.cos(theta),childSin=Math.sin(angle),childCos=Math.cos(angle),n=s*(steps+1)*2+i*2+e;
  const contact=contacts?.[s]?.[e],pa=contact?.parent||[0,0],ch=contact?.child||[0,0],childLift=(ux*ch[1]-uy*ch[0])*childSin;
  positions.setXYZ(n,dx*t+uy*(radius*sin+childShift*f*childSin)+pa[0]*(1-f)+ch[0]*childCos*f,dy*t-ux*(radius*sin+childShift*f*childSin)+pa[1]*(1-f)+ch[1]*childCos*f,radius*cos+parentShift*(1-f)+childShift*f*childCos+childLift*f);
  uv.setXY(n,(h.a[0]+dx*t-piece.x)/piece.w,1-(h.a[1]+dy*t-piece.y)/piece.h);
 }
 positions.needsUpdate=true;uv.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
