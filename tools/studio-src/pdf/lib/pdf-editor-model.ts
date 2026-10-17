// Pure helpers for the PDF editor: geometry, text-line grouping and colour maths.
// Coordinates are PDF points on the (rotated) page, origin top-left.

export type Box = {x:number;y:number;w:number;h:number};
export type Cover = Box & {color:string};
export type FontFamily = "sans"|"serif"|"mono";
type Base = {id:string;cover?:Cover;opacity?:number};
export type TextObj = Base & Box & {kind:"text";text:string;size:number;font:FontFamily;bold:boolean;italic:boolean;color:string;align:"left"|"center"|"right";bg?:string;
 /** Line spacing as a multiple of the size (original paragraphs keep theirs). */ lh?:number;customFont?:string;originalStyle?:string};
export type ImageObj = Base & Box & {kind:"image";src:string};
export type ShapeObj = Base & Box & {kind:"rect"|"ellipse";stroke:string;fill:string;strokeWidth:number;fillOpacity:number};
export type LineObj = Base & {kind:"line"|"arrow";x1:number;y1:number;x2:number;y2:number;stroke:string;strokeWidth:number};
// Ink points are stored relative to the box (0–1) so the drawing scales with it.
export type InkObj = Base & Box & {kind:"ink";points:[number,number][][];stroke:string;strokeWidth:number};
export type EditorObj = TextObj|ImageObj|ShapeObj|LineObj|InkObj;

export type TextLine = Box & {text:string;size:number;font:FontFamily;bold:boolean;italic:boolean;lh?:number;garbled?:boolean;align?:"left"|"center"};
export type RawTextItem = {str:string;x:number;y:number;w:number;size:number;fontName:string;family:string};

export const isLine=(o:EditorObj):o is LineObj=>o.kind==="line"||o.kind==="arrow";
export function boxOf(o:EditorObj):Box{
 if(isLine(o)){const x=Math.min(o.x1,o.x2),y=Math.min(o.y1,o.y2);return {x,y,w:Math.abs(o.x2-o.x1),h:Math.abs(o.y2-o.y1)};}
 return {x:o.x,y:o.y,w:o.w,h:o.h};
}
export function moveObj<T extends EditorObj>(o:T,dx:number,dy:number):T{
 if(isLine(o))return {...o,x1:o.x1+dx,y1:o.y1+dy,x2:o.x2+dx,y2:o.y2+dy};
 const b=o as Exclude<EditorObj,LineObj>;return {...b,x:b.x+dx,y:b.y+dy} as T;
}
/** Resize a box from one of eight handles ("n","se",...) keeping a minimum size. */
export function resizeBox(b:Box,handle:string,dx:number,dy:number,min=6,keepRatio=false):Box{
 let {x,y,w,h}=b;
 if(handle.includes("e"))w=b.w+dx;
 if(handle.includes("s"))h=b.h+dy;
 if(handle.includes("w")){w=b.w-dx;x=b.x+dx;}
 if(handle.includes("n")){h=b.h-dy;y=b.y+dy;}
 if(keepRatio&&handle.length===2&&b.w>0&&b.h>0){const r=b.w/b.h;if(w/h>r)h=w/r;else w=h*r;if(handle.includes("w"))x=b.x+b.w-w;if(handle.includes("n"))y=b.y+b.h-h;}
 if(w<min){if(handle.includes("w"))x-=min-w;w=min;}
 if(h<min){if(handle.includes("n"))y-=min-h;h=min;}
 return {x,y,w,h};
}
export function normBox(x1:number,y1:number,x2:number,y2:number):Box{return {x:Math.min(x1,x2),y:Math.min(y1,y2),w:Math.abs(x2-x1),h:Math.abs(y2-y1)};}
export function contains(b:Box,x:number,y:number,pad=0){return x>=b.x-pad&&x<=b.x+b.w+pad&&y>=b.y-pad&&y<=b.y+b.h+pad;}

/** Rotate an object's position a quarter turn clockwise with its page (page was w×h before). */
export function rotateObjCw(o:EditorObj,pageH:number):EditorObj{
 const p=(x:number,y:number):[number,number]=>[pageH-y,x];
 const cover=o.cover?(()=>{const [cx,cy]=p(o.cover.x+o.cover.w/2,o.cover.y+o.cover.h/2);return {...o.cover,x:cx-o.cover.h/2,y:cy-o.cover.w/2,w:o.cover.h,h:o.cover.w};})():undefined;
 if(isLine(o)){const [x1,y1]=p(o.x1,o.y1),[x2,y2]=p(o.x2,o.y2);return {...o,x1,y1,x2,y2,cover};}
 const [cx,cy]=p(o.x+o.w/2,o.y+o.h/2);
 return {...o,x:cx-o.w/2,y:cy-o.h/2,cover};
}

export function familyOf(fontName:string,family:string):{font:FontFamily;bold:boolean;italic:boolean}{
 const n=`${fontName} ${family}`.toLowerCase();
 const font:FontFamily=/mono|courier|consol/.test(n)?"mono":/serif|times|georgia|garamond|roman|book|minion|cambria/.test(n)&&!/sans/.test(n)?"serif":"sans";
 return {font,bold:/bold|black|heavy|semibold|demi/.test(n),italic:/italic|oblique/.test(n)};
}

/** Join pdf.js text runs that sit on the same baseline into editable lines. */
export function groupTextLines(items:RawTextItem[]):TextLine[]{
 // Rows first (runs on a line can differ slightly in y), then left to right within each row.
 const rows:RawTextItem[][]=[];
 for(const it of items.filter(i=>i.str.trim()&&i.size>0&&i.w>0).sort((a,b)=>a.y-b.y)){
  const row=rows.find(r=>Math.abs(r[0].y-it.y)<r[0].size*.3&&Math.abs(r[0].size-it.size)<r[0].size*.25);
  if(row)row.push(it);else rows.push([it]);
 }
 const lines:TextLine[]=[];
 for(const row of rows){
  let last:TextLine|null=null;
  for(const it of row.sort((a,b)=>a.x-b.x)){
   const gap=last?it.x-(last.x+last.w):0;
   if(last&&gap>-last.size*.3&&gap<last.size*1.2){
    const space=gap>last.size*.12&&!last.text.endsWith(" ")&&!it.str.startsWith(" ")?" ":"";
    last.text+=space+it.str;last.w=Math.max(last.w,it.x+it.w-last.x);
   }else{last={x:it.x,y:it.y,w:it.w,h:it.size*1.2,size:it.size,text:it.str,...familyOf(it.fontName,it.family)};lines.push(last);}
  }
 }
 return lines.map(l=>({...l,text:l.text.trim()}));
}

export function hex(r:number,g:number,b:number){return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");}
export function rgbOf(color:string):[number,number,number]{
 const m=/^#?([0-9a-f]{6})$/i.exec(color.trim());if(!m)return [0,0,0];
 const n=parseInt(m[1],16);return [(n>>16)&255,(n>>8)&255,n&255];
}
/** Background = most common colour on the box edge; ink = the pixel least like it. */
export function sampleColors(data:Uint8ClampedArray,width:number,height:number):{bg:string;ink:string}{
 const count=new Map<number,number>();
 const key=(i:number)=>((data[i]>>4)<<8)|((data[i+1]>>4)<<4)|(data[i+2]>>4);
 const edge=(x:number,y:number)=>{const i=(y*width+x)*4;const k=key(i);count.set(k,(count.get(k)||0)+1);};
 for(let x=0;x<width;x++){edge(x,0);edge(x,height-1);}
 for(let y=0;y<height;y++){edge(0,y);edge(width-1,y);}
 let best=0,bestN=-1;for(const [k,n] of count)if(n>bestN){best=k;bestN=n;}
 const br=((best>>8)&15)*17,bg=((best>>4)&15)*17,bb=(best&15)*17;
 // Average the real edge pixels in that bucket for an exact match.
 let sr=0,sg=0,sb=0,sn=0,far=-1,ink:[number,number,number]=[0,0,0];
 for(let i=0;i<data.length;i+=4){
  const d=Math.abs(data[i]-br)+Math.abs(data[i+1]-bg)+Math.abs(data[i+2]-bb);
  if(key(i)===best){sr+=data[i];sg+=data[i+1];sb+=data[i+2];sn++;}
  if(d>far){far=d;ink=[data[i],data[i+1],data[i+2]];}
 }
 return {bg:sn?hex(sr/sn,sg/sn,sb/sn):hex(br,bg,bb),ink:far>60?hex(...ink):"#111111"};
}

/** Greedy word wrap with a width function; keeps explicit line breaks. */
export function wrapText(text:string,maxWidth:number,width:(s:string)=>number):string[]{
 const out:string[]=[];
 for(const para of text.split("\n")){
  const words=para.split(/(\s+)/);let line="";
  for(const w of words){
   const next=line+w;
   if(line&&width(next.trimEnd())>maxWidth&&w.trim()){out.push(line.trimEnd());line=w;}
   else line=next;
  }
  out.push(line.trimEnd());
 }
 return out;
}

export const FONT_CSS:Record<FontFamily,string>={sans:"Helvetica, Arial, sans-serif",serif:"'Times New Roman', Times, serif",mono:"'Courier New', Courier, monospace"};
// Distance from the top of a 1.2 line box to the baseline, per font size.
export const BASELINE:Record<FontFamily,number>={sans:.947,serif:.937,mono:.866};
export const LINE_HEIGHT=1.2;
/** Top of a text box to the first baseline, in font sizes, for a given line spacing (CSS half-leading). */
export const baselineOf=(font:FontFamily,lh=LINE_HEIGHT)=>BASELINE[font]+(lh-LINE_HEIGHT)/2;

/** Text whose font has no usable character map extracts as symbols; it can only be retyped. */
export const isGarbled=(t:string)=>{const bad=(t.match(/[\u0000-\u0008\u000e-\u001f\ue000-\uf8ff\ufffd]/g)||[]).length;return bad>0&&bad>=t.replace(/\s/g,"").length*.3;};

/**
 * Stack lines into paragraphs: same font and size, left edges aligned (or centred together)
 * and an even gap between baselines. Original line breaks are kept, so the layout is unchanged
 * until the text is edited.
 */
export function groupParagraphs(lines:TextLine[]):TextLine[]{
 const out:(TextLine&{step?:number;centre:number;left:boolean})[]=[];
 const sorted=[...lines].sort((a,b)=>a.y-b.y||a.x-b.x);
 const used=new Set<TextLine>();
 for(const first of sorted){
  if(used.has(first))continue;used.add(first);
  const block={...first,centre:first.x+first.w/2,step:undefined as number|undefined,left:true};let last=first;
  for(;;){
   const next=sorted.find(l=>!used.has(l)&&l.y>last.y&&Math.abs(l.size-first.size)<first.size*.08&&l.font===first.font&&l.bold===first.bold&&!l.garbled&&!first.garbled
    &&(Math.abs(l.x-block.x)<first.size*.6||Math.abs(l.x+l.w/2-block.centre)<first.size*.6)
    &&l.y-last.y<first.size*1.75&&l.y-last.y>first.size*.9
    &&(block.step===undefined||Math.abs(l.y-last.y-block.step)<first.size*.15));
   if(!next)break;
   used.add(next);block.step??=next.y-last.y;if(Math.abs(next.x-block.x)>=first.size*.6)block.left=false;
   const x=Math.min(block.x,next.x);block.w=Math.max(block.x+block.w,next.x+next.w)-x;block.x=x;
   block.text+="\n"+next.text;block.h=next.y+next.h-block.y;last=next;
  }
  out.push(block);
 }
 return out.map(({step,left,...b})=>({...b,lh:step?step/b.size:undefined,align:left?"left":"center"}));
}

export function inkPath(o:InkObj):string{
 return o.points.map(stroke=>stroke.map(([px,py],i)=>`${i?"L":"M"}${(o.x+px*o.w).toFixed(2)} ${(o.y+py*o.h).toFixed(2)}`).join(" ")+(stroke.length===1?` l0.01 0`:"")).join(" ");
}
/** Fit absolute stroke points into a box and store them relative to it. */
export function inkFromStrokes(strokes:[number,number][][],pad:number):Box&{points:[number,number][][]}{
 const all=strokes.flat();
 const minX=Math.min(...all.map(p=>p[0]))-pad,minY=Math.min(...all.map(p=>p[1]))-pad;
 const w=Math.max(Math.max(...all.map(p=>p[0]))+pad-minX,1),h=Math.max(Math.max(...all.map(p=>p[1]))+pad-minY,1);
 return {x:minX,y:minY,w,h,points:strokes.map(s=>s.map(([x,y])=>[(x-minX)/w,(y-minY)/h] as [number,number]))};
}
export function arrowHead(x1:number,y1:number,x2:number,y2:number,size:number):[[number,number],[number,number]]{
 const a=Math.atan2(y2-y1,x2-x1),s=Math.PI/7;
 return [[x2-size*Math.cos(a-s),y2-size*Math.sin(a-s)],[x2-size*Math.cos(a+s),y2-size*Math.sin(a+s)]];
}

export function textFingerprint(o:TextObj){return JSON.stringify([o.text,o.x,o.y,o.w,o.size,o.font,o.bold,o.italic,o.color,o.align,o.lh,o.opacity,o.customFont]);}
export function untouchedText(o:EditorObj){return o.kind==="text"&&o.originalStyle!==undefined&&o.originalStyle===textFingerprint(o);}
