import {fitPanelArtwork} from "./packaging-artwork-fit";
import {syncPanels, type StudioProject, type FoldPiece} from './packaging-document';
type V = [number,number,number];
/** Resize the folded physical axes, then lay each panel back out about its shared crease. */
export function resizePackage(p:StudioProject,key:'width'|'depth'|'height',value:number):StudioProject {
  if(p.structure!=='custom'||!p.imported) return syncPanels({...p,[key]:value});
  if(p.imported.referenceOnly || !p.imported.net.pieces.some(q=>q.parent&&q.hinge)) throw new Error('Map the panels and folds before changing box dimensions. This import is still a flat reference.');
  const ratio:V=[key==='width'?value/p.width:1,key==='depth'?value/p.depth:1,key==='height'?value/p.height:1];
  const net=p.imported.net;
  if(net.rootPlane==='front') [ratio[1],ratio[2]]=[ratio[2],ratio[1]];
  const byId=new Map(net.pieces.map(q=>[q.id,q]));
  const result=new Map<string,{piece:FoldPiece,basis:V[],sx:number,sy:number, map:(v:number[])=>[number,number]}>();
  const visiting=new Set<string>();
  function visit(q:FoldPiece):ReturnType<typeof result.get> {
    if(result.has(q.id)) return result.get(q.id);
    if(visiting.has(q.id)) throw new Error('The imported fold map contains a cycle.');
    visiting.add(q.id);
    const parent=q.parent&&byId.get(q.parent), prev=parent?visit(parent):undefined;
    const basis=prev?.basis||[[1,0,0],[0,1,0],[0,0,1]] as V[];
    const apply=(v:V):V=>[0,1,2].map(i=>basis[0][i]*v[0]+basis[1][i]*v[1]+basis[2][i]*v[2]) as V;
    let local:V[]=[[1,0,0],[0,1,0],[0,0,1]];
    if(q.hinge){
      const dx=q.hinge.b[0]-q.hinge.a[0],dy=q.hinge.b[1]-q.hinge.a[1],len=Math.hypot(dx,dy);
      const a:V=[dx/len,dy/len,0], t=q.hinge.angle*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
      local=local.map(v=>{const dot=a[0]*v[0]+a[1]*v[1];const cross=[a[1]*v[2],-a[0]*v[2],a[0]*v[1]-a[1]*v[0]];return v.map((n,i)=>n*c+cross[i]*s+a[i]*dot*(1-c)) as V;});
    }
    const world=local.map(apply),scale=(v:V)=>Math.hypot(...v.map((n,i)=>n*ratio[i]));
    if(world.some(v=>Math.max(...v.map(Math.abs))<.9999)) throw new Error("This fold map has angled panels that need a reviewed structural resize. The original package has been preserved.");
    const sx=scale(world[0]),sy=scale(world[1]);
    const anchor=q.hinge?.a||[q.x,q.y],to=prev?prev.map(anchor):[anchor[0],anchor[1]];
    const map=(v:number[]):[number,number]=>[to[0]+(v[0]-anchor[0])*sx,to[1]+(v[1]-anchor[1])*sy];
    const [x,y]=map([q.x,q.y]);
    const piece={...q,x,y,w:q.w*sx,h:q.h*sy,points:q.points?.map(([x,y])=>[x*sx,y*sy]),islands:q.islands?.map(r=>r.map(([x,y])=>[x*sx,y*sy])),holes:q.holes?.map(r=>r.map(([x,y])=>[x*sx,y*sy])),hinge:q.hinge?{...q.hinge,a:map(q.hinge.a),b:map(q.hinge.b)}:undefined};
    const entry={piece,basis:world,sx,sy,map};result.set(q.id,entry);visiting.delete(q.id);return entry;
  }
  const pieces=net.pieces.map(q=>visit(q)!.piece);
  const minX=Math.min(0,...pieces.map(q=>q.x-10)),minY=Math.min(0,...pieces.map(q=>q.y-10));
  for(const q of pieces){q.x-=minX;q.y-=minY;if(q.hinge){q.hinge.a=[q.hinge.a[0]-minX,q.hinge.a[1]-minY];q.hinge.b=[q.hinge.b[0]-minX,q.hinge.b[1]-minY];}}
  const sourcePaths=net.sourcePaths?.map(path=>{
    const owner=path.piece&&result.get(path.piece);
    if(!owner)throw new Error('This cutter path has no mapped panel. Preserve the original dimensions until its panel is mapped.');
    return {...path,commands:path.commands.map(command=>{
      const values=command.slice(1) as number[], mapped:number[]=[];
      for(let i=0;i<values.length;i+=2){const point=owner.map([values[i],values[i+1]]);mapped.push(point[0]-minX,point[1]-minY);}
      return [command[0],...mapped] as typeof command;
    })};
  });
  const next=syncPanels({...p,[key]:value,imported:{...p.imported,net:{...net,sourcePaths,width:Math.max(...pieces.map(q=>q.x+q.w))+10,height:Math.max(...pieces.map(q=>q.y+q.h))+10,pieces}}});
  // Only the retained paper background stretches. Printed objects keep their physical size.
  for(const q of pieces){if(!q.face||!next.panels[q.face])continue;const old=p.panels[q.face];if(!old)continue;
    const resize=(objects:Record<string,any>[])=>objects.map(o=>o.name==='Imported background'?{...o,scaleX:(o.scaleX??1)*q.w/old.width,scaleY:(o.scaleY??1)*q.h/old.height}:o);
    next.panels[q.face]={...next.panels[q.face],objects:fitPanelArtwork(resize(old.objects),q),insideObjects:fitPanelArtwork(resize(old.insideObjects),q)};
  }
  return next;
}
