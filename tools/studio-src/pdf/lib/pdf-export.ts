import {customFontCss,fontBytes} from "./pdf-editor-fonts";
import {untouchedText} from "./pdf-editor-model";
// Builds the edited PDF in the browser. Each original page is embedded as a
// vector form (text stays sharp and selectable) and edits are drawn on top.
import {PDFDocument,StandardFonts,rgb,degrees,LineCapStyle,type PDFFont,type PDFEmbeddedPage,type PDFImage,type PDFPage} from "pdf-lib";
import {baselineOf,LINE_HEIGHT,FONT_CSS,arrowHead,inkPath,rgbOf,wrapText,type EditorObj,type TextObj,type FontFamily} from "./pdf-editor-model";

export type ExportPage = {src?:string;background?:string;index:number;rotation:number;w:number;h:number;crop:{left:number;bottom:number;width:number;height:number};objects:EditorObj[]};

const color=(c:string)=>{const [r,g,b]=rgbOf(c);return rgb(r/255,g/255,b/255);};
const FONTS:Record<FontFamily,[StandardFonts,StandardFonts,StandardFonts,StandardFonts]>={
 sans:[StandardFonts.Helvetica,StandardFonts.HelveticaBold,StandardFonts.HelveticaOblique,StandardFonts.HelveticaBoldOblique],
 serif:[StandardFonts.TimesRoman,StandardFonts.TimesRomanBold,StandardFonts.TimesRomanItalic,StandardFonts.TimesRomanBoldItalic],
 mono:[StandardFonts.Courier,StandardFonts.CourierBold,StandardFonts.CourierOblique,StandardFonts.CourierBoldOblique],
};
function dataUrlBytes(url:string){const b64=url.slice(url.indexOf(",")+1),bin=atob(b64),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}

/** Text the standard fonts cannot encode (Arabic, emoji…) is drawn as a high-resolution image. */
function rasterText(o:TextObj):string{
 const k=4,c=document.createElement("canvas");c.width=Math.ceil(o.w*k);c.height=Math.ceil(o.h*k);
 const g=c.getContext("2d")!;g.scale(k,k);
 if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,o.w,o.h);}
 g.font=`${o.italic?"italic ":""}${o.bold?"bold ":""}${o.size}px ${customFontCss(o)}`;g.fillStyle=o.color;g.textBaseline="alphabetic";
 g.direction=/[\u0590-\u08ff]/.test(o.text)?"rtl":"ltr";
 const lines=wrapText(o.text,o.w,s=>g.measureText(s).width);
 g.textAlign=o.align;const x=o.align==="center"?o.w/2:o.align==="right"?o.w:0;
 lines.forEach((line,i)=>g.fillText(line,x,i*o.size*(o.lh??LINE_HEIGHT)+o.size*baselineOf(o.font,o.lh)));
 return c.toDataURL("image/png");
}

/** Loads a source for vector copying; null when it cannot be copied faithfully (encrypted, damaged). */
async function loadSource(bytes:Uint8Array):Promise<PDFDocument|null>{
 try{
  const doc=await PDFDocument.load(bytes,{ignoreEncryption:true,throwOnInvalidObject:false,updateMetadata:false});
  // Encrypted files (including "restrictions only" ones) keep their streams encrypted when copied.
  if(doc.isEncrypted)return null;
  // Filled form fields live in annotations, which a page copy drops; draw them into the page first.
  try{doc.getForm().flatten({updateFieldAppearances:false});}catch{/* no form or unusual fields: keep the page as it is */}
  return doc;
 }catch{return null;}
}

/** `render` draws a source page as a JPEG data URL; used whenever vector copying is not possible. */
export async function exportPdf(sources:Map<string,Uint8Array>,pages:ExportPage[],render:(p:ExportPage)=>Promise<string>):Promise<{bytes:Uint8Array;rasterPages:number}>{
 const out=await PDFDocument.create();
 const docs=new Map<string,PDFDocument|null>();let rasterPages=0;
 const embedded=new Map<string,PDFEmbeddedPage>();
 const fonts=new Map<string,PDFFont>();
 const images=new Map<string,PDFImage>();
 const font=async(o:TextObj)=>{if(o.customFont){if(!fonts.has(o.customFont)){const bytes=fontBytes(o.customFont);if(!bytes)throw Error("Selected font is no longer loaded");const {default:fontkit}=await import("@pdf-lib/fontkit");out.registerFontkit(fontkit);fonts.set(o.customFont,await out.embedFont(bytes,{subset:true}));}return fonts.get(o.customFont)!;}const name=FONTS[o.font][(o.bold?1:0)+(o.italic?2:0)];if(!fonts.has(name))fonts.set(name,await out.embedFont(name));return fonts.get(name)!;};
 const image=async(src:string)=>{if(!images.has(src))images.set(src,src.startsWith("data:image/png")?await out.embedPng(dataUrlBytes(src)):await out.embedJpg(dataUrlBytes(src)));return images.get(src)!;};

 for(const p of pages){
  const page=out.addPage([p.w,p.h]);
  let background=p.background;
  if(!background&&p.src){
   if(!docs.has(p.src))docs.set(p.src,await loadSource(sources.get(p.src)!));
   const doc=docs.get(p.src),key=`${p.src}:${p.index}`;
   if(doc&&!embedded.has(key)){try{const src=doc.getPage(p.index),c=p.crop;embedded.set(key,await out.embedPage(src,{left:c.left,bottom:c.bottom,right:c.left+c.width,top:c.bottom+c.height}));}catch{/* falls back to an image below */}}
   if(!embedded.has(key)){background=await render(p);rasterPages++;}
  }
  if(background){
   // Picture of the page: used for flattened edits and for files that cannot be copied as vectors.
   page.drawImage(await out.embedJpg(dataUrlBytes(background)),{x:0,y:0,width:p.w,height:p.h});
  }else if(p.src){
   const e=embedded.get(`${p.src}:${p.index}`)!,W=p.crop.width,H=p.crop.height,r=((p.rotation%360)+360)%360;
   // Turn the unrotated page clockwise by r into the visible page.
   const at=r===90?{x:0,y:W,rotate:degrees(-90)}:r===180?{x:W,y:H,rotate:degrees(180)}:r===270?{x:H,y:0,rotate:degrees(90)}:{x:0,y:0,rotate:degrees(0)};
   page.drawPage(e,{...at,width:W,height:H});
  }
  // Covers hide the original content only, never another edit, so they go first.
  for(const o of p.objects)if(o.cover&&!untouchedText(o))page.drawRectangle({x:o.cover.x,y:p.h-o.cover.y-o.cover.h,width:o.cover.w,height:o.cover.h,color:color(o.cover.color)});
  for(const o of p.objects)if(!untouchedText(o))await drawObj(page,p.h,o,font,image);
 }
 return {bytes:await out.save(),rasterPages};
}

async function drawObj(page:PDFPage,H:number,o:EditorObj,font:(o:TextObj)=>Promise<PDFFont>,image:(s:string)=>Promise<PDFImage>){
 const opacity=o.opacity??1;
 switch(o.kind){
  case "image":{const img=await image(o.src);page.drawImage(img,{x:o.x,y:H-o.y-o.h,width:o.w,height:o.h,opacity});break;}
  case "rect":page.drawRectangle({x:o.x,y:H-o.y-o.h,width:o.w,height:o.h,color:o.fill==="none"?undefined:color(o.fill),opacity:o.fillOpacity*opacity,borderColor:o.strokeWidth>0&&o.stroke!=="none"?color(o.stroke):undefined,borderWidth:o.strokeWidth,borderOpacity:opacity});break;
  case "ellipse":page.drawEllipse({x:o.x+o.w/2,y:H-o.y-o.h/2,xScale:o.w/2,yScale:o.h/2,color:o.fill==="none"?undefined:color(o.fill),opacity:o.fillOpacity*opacity,borderColor:o.strokeWidth>0&&o.stroke!=="none"?color(o.stroke):undefined,borderWidth:o.strokeWidth,borderOpacity:opacity});break;
  case "line":case "arrow":{
   const c=color(o.stroke),line=(x1:number,y1:number,x2:number,y2:number)=>page.drawLine({start:{x:x1,y:H-y1},end:{x:x2,y:H-y2},thickness:o.strokeWidth,color:c,opacity,lineCap:LineCapStyle.Round});
   line(o.x1,o.y1,o.x2,o.y2);
   if(o.kind==="arrow"){const [a,b]=arrowHead(o.x1,o.y1,o.x2,o.y2,Math.max(8,o.strokeWidth*4));line(o.x2,o.y2,a[0],a[1]);line(o.x2,o.y2,b[0],b[1]);}
   break;
  }
  case "ink":page.drawSvgPath(inkPath(o),{x:0,y:H,borderColor:color(o.stroke),borderWidth:o.strokeWidth,borderOpacity:opacity,borderLineCap:LineCapStyle.Round});break;
  case "text":{
   if(!o.text.trim())break;
   const f=await font(o);
   try{f.encodeText(o.text.replace(/\n/g,""));}catch{const img=await image(rasterText(o));page.drawImage(img,{x:o.x,y:H-o.y-o.h,width:o.w,height:o.h,opacity});break;}
   if(o.bg)page.drawRectangle({x:o.x,y:H-o.y-o.h,width:o.w,height:o.h,color:color(o.bg),opacity});
   const lines=wrapText(o.text,o.w+.5,s=>f.widthOfTextAtSize(s,o.size));
   lines.forEach((line,i)=>{
    const lw=f.widthOfTextAtSize(line,o.size),x=o.align==="center"?o.x+(o.w-lw)/2:o.align==="right"?o.x+o.w-lw:o.x;
    page.drawText(line,{x,y:H-(o.y+i*o.size*(o.lh??LINE_HEIGHT)+o.size*baselineOf(o.font,o.lh)),size:o.size,font:f,color:color(o.color),opacity});
   });
  }
 }
}
