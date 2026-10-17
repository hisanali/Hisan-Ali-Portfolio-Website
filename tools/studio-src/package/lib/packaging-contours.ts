import type {FoldPiece} from './packaging-document';
export type CutterCommand = ['M'|'L',number,number] | ['C',number,number,number,number,number,number] | ['Z'];
export type CutterPath = {kind:'cut'|'fold'; piece?:string; commands:CutterCommand[]};
export function cutterPathData(path:CutterPath) {return path.commands.map(c=>c[0]+c.slice(1).join(' ')).join(' ');}
export function panelPathData(q:FoldPiece) {
 const rings=[q.points || [[0,0],[q.w,0],[q.w,q.h],[0,q.h]],...(q.islands||[]),...(q.holes||[])];
 return rings.map(points=>'M'+points.map(p=>p.join(' ')).join(' L')+' Z').join(' ');
}
export function validCutterPaths(value:unknown,ids:Set<string>):value is CutterPath[] {
 return Array.isArray(value) && value.length<=12000 && value.every(p=>p && ['cut','fold'].includes(p.kind) && (!p.piece||ids.has(p.piece)) && Array.isArray(p.commands) && p.commands.length>1 && p.commands.length<=2000 && p.commands[0]?.[0]==='M' && p.commands.every((c:unknown)=>Array.isArray(c) && ((c[0]==='M'||c[0]==='L')?c.length===3:c[0]==='C'?c.length===7:c[0]==='Z'&&c.length===1) && c.slice(1).every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=10000)));
}
export function scaleCutterPaths(paths:CutterPath[]|undefined,scale:number) {return paths?.map(p=>({...p,commands:p.commands.map(c=>[c[0],...c.slice(1).map(v=>(v as number)*scale)] as CutterCommand)}));}

/** Adaptive mesh/display sampling; native export commands are never replaced by these samples. */
export function cutterPathPoints(path:CutterPath,tolerance=.005):number[][] {
 const points:number[][]=[];
 const mid=(a:number[],b:number[])=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 const curve=(a:number[],b:number[],c:number[],d:number[],depth=0)=>{
  const dx=d[0]-a[0],dy=d[1]-a[1],length=Math.hypot(dx,dy);
  const distance=(p:number[])=>length?Math.abs(dy*p[0]-dx*p[1]+d[0]*a[1]-d[1]*a[0])/length:Math.hypot(p[0]-a[0],p[1]-a[1]);
  if(depth===16||Math.max(distance(b),distance(c))<=tolerance){points.push(d);return;}
  const ab=mid(a,b),bc=mid(b,c),cd=mid(c,d),abc=mid(ab,bc),bcd=mid(bc,cd),centre=mid(abc,bcd);
  curve(a,ab,abc,centre,depth+1);curve(centre,bcd,cd,d,depth+1);
 };
 for(const c of path.commands) {
  if(c[0]==='M'||c[0]==='L')points.push([c[1],c[2]]);
  else if(c[0]==='C'&&points.length)curve(points[points.length-1],c.slice(1,3) as number[],c.slice(3,5) as number[],c.slice(5,7) as number[]);
  else if(c[0]==='Z'&&points.length)points.push(points[0]);
 }
 return points;
}
