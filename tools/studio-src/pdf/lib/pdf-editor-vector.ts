import type {LineObj} from './pdf-editor-model';
/** Only thin, neutral strokes in a connected grid qualify as table rules.
 * Never split a wide ink band into strips: that turns display lettering into rules. */
export function detectRules(data:Uint8ClampedArray,w:number,h:number,scale:number):LineObj[]{
 if(!Number.isFinite(scale)||scale<=0)return [];
 const dark=(x:number,y:number)=>{const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];return data[i+3]>200&&Math.max(r,g,b)-Math.min(r,g,b)<30&&r*.299+g*.587+b*.114<155;};
 const candidates:{vertical:boolean;a:number;b:number;t:number;end:number}[]=[];
 for(const vertical of [false,true]){
  const major=vertical?h:w,minor=vertical?w:h,min=Math.max(50,major*.075),groups:typeof candidates=[];
  for(let t=0;t<minor;t++){
   let a=-1,last=-1;
   const flush=()=>{if(a>=0&&last-a>=min){const g=groups.find(g=>t-g.end<=2&&Math.min(g.b,last)-Math.max(g.a,a)>=Math.min(g.b-g.a,last-a)*.8);if(g){g.end=t;g.a=Math.min(g.a,a);g.b=Math.max(g.b,last);}else groups.push({vertical,a,b:last,t,end:t});}a=-1;};
   for(let s=0;s<major;s++){if(dark(vertical?t:s,vertical?s:t)){if(a<0)a=s;last=s;}else if(a>=0&&s-last>2)flush();}flush();
  }
  candidates.push(...groups.filter(g=>g.end-g.t+1<=Math.max(3,2*scale)&&(g.b-g.a)/(g.end-g.t+1)>=25));
 }
 // A table has at least two rules in each direction. Prune isolated stems and decorative lines.
 let grid=candidates;
 const crosses=(a:typeof candidates[number],b:typeof candidates[number])=>{if(a.vertical===b.vertical)return false;const x=a.vertical?(a.t+a.end)/2:(b.t+b.end)/2,y=a.vertical?(b.t+b.end)/2:(a.t+a.end)/2,hr=a.vertical?b:a,vr=a.vertical?a:b,pad=3*scale;return x>=hr.a-pad&&x<=hr.b+pad&&y>=vr.a-pad&&y<=vr.b+pad;};
 for(;;){const next=grid.filter(a=>grid.filter(b=>crosses(a,b)).length>=2);if(next.length===grid.length)break;grid=next;}
 return grid.map((g,index)=>{const {vertical}=g,mid=(g.t+g.end)/2/scale,a=g.a/scale,b=g.b/scale,thick=(g.end-g.t+1)/scale,pad=.5/scale;
  const px=vertical?Math.round((g.t+g.end)/2):Math.round((g.a+g.b)/2),py=vertical?Math.round((g.a+g.b)/2):Math.round((g.t+g.end)/2),i=(py*w+px)*4;
  const stroke='#'+Array.from(data.slice(i,i+3)).map(v=>v.toString(16).padStart(2,'0')).join('');
  return {id:`rule-${vertical?'v':'h'}-${index}`,kind:'line',x1:vertical?mid:a,y1:vertical?a:mid,x2:vertical?mid:b,y2:vertical?b:mid,stroke,strokeWidth:thick,cover:{x:vertical?g.t/scale-pad:a-pad,y:vertical?a-pad:g.t/scale-pad,w:vertical?thick+2*pad:b-a+2*pad,h:vertical?b-a+2*pad:thick+2*pad,color:'#ffffff'}};
 });
}
export function removePaper(data:Uint8ClampedArray,strength=30){
 const out=new Uint8ClampedArray(data);
 for(let i=0;i<out.length;i+=4){const min=Math.min(out[i],out[i+1],out[i+2]);const alpha=Math.min(1,Math.max(0,(255-min-strength)/(255-strength)));out[i+3]=Math.round(out[i+3]*alpha);if(alpha>0)for(let c=0;c<3;c++)out[i+c]=Math.max(0,Math.round((out[i+c]-255*(1-alpha))/alpha));}
 return out;
}
export type Corner=[number,number];
/** Projective mapping from a rectangular output into four ordered photo corners. */
export function quadPoint(q:Corner[],u:number,v:number):Corner{
 const [a,b,c,d]=q,dx1=b[0]-c[0],dx2=d[0]-c[0],dx3=a[0]-b[0]+c[0]-d[0],dy1=b[1]-c[1],dy2=d[1]-c[1],dy3=a[1]-b[1]+c[1]-d[1],det=dx1*dy2-dx2*dy1;
 const g=Math.abs(det)<1e-9?0:(dx3*dy2-dx2*dy3)/det,h=Math.abs(det)<1e-9?0:(dx1*dy3-dx3*dy1)/det,z=g*u+h*v+1;
 return [((b[0]-a[0]+g*b[0])*u+(d[0]-a[0]+h*d[0])*v+a[0])/z,((b[1]-a[1]+g*b[1])*u+(d[1]-a[1]+h*d[1])*v+a[1])/z];
}
