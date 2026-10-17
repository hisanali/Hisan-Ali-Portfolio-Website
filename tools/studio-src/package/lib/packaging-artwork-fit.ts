import type {FoldPiece, StudioObject} from './packaging-document';
const origin=(v:unknown)=>typeof v==='number'?v+.5:v==='center'?.5:v==='right'||v==='bottom'?1:0;
export function artworkBounds(o:StudioObject){
 const w=(o.width||0)+(o.stroke?o.strokeWidth||0:0),h=(o.height||0)+(o.stroke?o.strokeWidth||0:0),sx=o.scaleX??1,sy=o.scaleY??1;
 const rad=(o.angle||0)*Math.PI/180,kx=Math.tan((o.skewX||0)*Math.PI/180),ky=Math.tan((o.skewY||0)*Math.PI/180);
 const points=[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>{x-=w*origin(o.originX);y-=h*origin(o.originY);y+=x*ky;x+=y*kx;x*=sx;y*=sy;return [(o.left||0)+x*Math.cos(rad)-y*Math.sin(rad),(o.top||0)+x*Math.sin(rad)+y*Math.cos(rad)];});
 return {left:Math.min(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),right:Math.max(...points.map(p=>p[0])),bottom:Math.max(...points.map(p=>p[1]))};
}
function containment(points:number[][]){
 const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1])),span=Math.max(.001,maxY-minY),count=128;
 const bins:{a:number[],b:number[]}[][]=Array.from({length:count},()=>[]);
 const bin=(y:number)=>Math.max(0,Math.min(count-1,Math.floor((y-minY)/span*count)));
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i];if(a[1]===b[1])continue;
  for(let k=bin(Math.min(a[1],b[1]));k<=bin(Math.max(a[1],b[1]));k++)bins[k].push({a,b});
 }
 return (x:number,y:number)=>{
  if(y<minY||y>maxY)return false;let yes=false;
  for(const {a:[ax,ay],b:[bx,by]}of bins[bin(y)])if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)yes=!yes;
  return yes;
 };
}
/** Keep each printed layout together and preserve aspect ratios; fit only when the new cut contour requires it. */
export function fitPanelArtwork(objects:StudioObject[],piece:FoldPiece):StudioObject[]{
 const printed=objects.filter(o=>o.name!=='Imported background');
 if(!printed.length)return objects;
 const boxes=printed.map(artworkBounds),left=Math.min(...boxes.map(b=>b.left)),top=Math.min(...boxes.map(b=>b.top)),right=Math.max(...boxes.map(b=>b.right)),bottom=Math.max(...boxes.map(b=>b.bottom));
 const w=right-left,h=bottom-top;if(!w||!h)return objects;
 const poly=piece.points||[[0,0],[piece.w,0],[piece.w,piece.h],[0,piece.h]];
 const contains=containment(poly),islands=(piece.islands||[]).map(containment),holes=(piece.holes||[]).map(containment);
 const fits=(x:number,y:number,s:number)=>{
  // Check the perimeter, including concave flap notches, not merely the bounding box.
  for(let i=0;i<=32;i++){const t=i/32;for(const [px,py] of [[x-w*s/2+w*s*t,y-h*s/2],[x-w*s/2+w*s*t,y+h*s/2],[x-w*s/2,y-h*s/2+h*s*t],[x+w*s/2,y-h*s/2+h*s*t]])if(!(contains(px,py)||islands.some(island=>island(px,py)))||holes.some(hole=>hole(px,py)))return false;}
  return true;
 };
 const cx=(left+right)/2,cy=(top+bottom)/2;
 if(fits(cx,cy,1))return objects;
 let best={x:piece.w/2,y:piece.h/2,s:0};
 const candidates=[[Math.max(w/2+.2,Math.min(piece.w-w/2-.2,cx)),Math.max(h/2+.2,Math.min(piece.h-h/2-.2,cy))],[piece.w/2,piece.h/2]];
 for(let x=1;x<8;x++)for(let y=1;y<8;y++)candidates.push([piece.w*x/8,piece.h*y/8]);
 for(const [x,y] of candidates){let lo=0,hi=1;for(let i=0;i<18;i++){const s=(lo+hi)/2;if(fits(x,y,s))lo=s;else hi=s;}if(lo>best.s){best={x,y,s:lo};if(lo>.99999)break;}}
 if(best.s<.001)throw new Error('This panel is too small for its artwork. Use larger box dimensions.');
 const s=best.s>.99999?1:best.s*.995;
 return objects.map(o=>o.name==='Imported background'?o:{...o,left:best.x+((o.left||0)-cx)*s,top:best.y+((o.top||0)-cy)*s,scaleX:(o.scaleX??1)*s,scaleY:(o.scaleY??1)*s});
}
