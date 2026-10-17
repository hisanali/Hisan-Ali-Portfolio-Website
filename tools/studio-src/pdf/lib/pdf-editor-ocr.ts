import {detectRules} from './pdf-editor-vector';
import type {Block} from 'tesseract.js';
import {baselineOf,LINE_HEIGHT,type TextLine,type TextObj,type Cover} from './pdf-editor-model';
export type RecognizedLine=TextLine&{key:string;ocr?:boolean;confidence?:number;inkBox?:Cover};
/** Keep separate OCR lines/cells separate: invoices must not merge adjacent columns. */
export function recognizedLines(blocks:Block[],scale:number):RecognizedLine[]{
 const result:RecognizedLine[]=[];
 for(const block of blocks)for(const para of block.paragraphs)for(const line of para.lines){
  let words:typeof line.words=[];
  const flush=()=>{
   if(!words.length)return;
   const text=words.map(w=>w.text.trim()).join(' '),x=Math.min(...words.map(w=>w.bbox.x0))/scale,y=Math.min(...words.map(w=>w.bbox.y0))/scale;
   const w=Math.max(...words.map(w=>w.bbox.x1))/scale-x,h=Math.max(...words.map(w=>w.bbox.y1))/scale-y;
   const confidence=words.reduce((s,w)=>s+w.confidence,0)/words.length;
   if(text&&w>0&&h>0)result.push({key:`ocr-${result.length}`,text,x,y,w,h,size:Math.max(4,h/.74),font:'sans',bold:/bold/i.test(words[0]?.font_name||''),italic:/italic|oblique/i.test(words[0]?.font_name||''),ocr:true,confidence});
   words=[];
  };
  for(const word of line.words.filter(w=>w.text.trim()).sort((a,b)=>a.bbox.x0-b.bbox.x0)){
   const prev=words.at(-1);if(prev&&word.bbox.x0-prev.bbox.x1>Math.max(10*scale,(word.bbox.y1-word.bbox.y0)*1.25))flush();words.push(word);
  }flush();
 }
 return result;
}
/** Fit a real font to the observed ink box, leaving the other invoice columns untouched. */
export function recognizedObject(line:RecognizedLine,id:string,bg:string,ink:string,measure:(s:string,size:number)=>number,inkMetrics?:(s:string,size:number)=>{ascent:number;descent:number}):TextObj{
 const metrics=inkMetrics?.(line.text,line.size);
 const heightFit=metrics&&metrics.ascent+metrics.descent>0?line.size*line.h/(metrics.ascent+metrics.descent):line.size;
 const size=Math.min(heightFit,line.size*line.w/Math.max(1,measure(line.text,line.size)));
 const descent=metrics?metrics.descent*size/line.size:0;
 const pad=.7;
 return {id,kind:'text',text:line.text,x:line.x,y:line.y+line.h-descent-size*baselineOf(line.font),w:line.w+1,h:size*LINE_HEIGHT,size,font:line.font,bold:line.bold,italic:line.italic,color:ink,align:'left',cover:{x:line.x-pad,y:line.y-pad,w:line.w+pad*2,h:line.h+pad*2,color:bg}};
}
// Only one recognition engine at a time, even when several PDF pages are visible.
let queue:Promise<unknown>=Promise.resolve();
export function recognizeScan(canvas:HTMLCanvasElement,scale:number,progress:(s:string)=>void):Promise<RecognizedLine[]>{
 const job=queue.catch(()=>{}).then(async()=>{
  const {createDatasheetOcr}=await import('./datasheet-ocr');
  progress('Preparing text recognition…');const worker=await createDatasheetOcr(progress);
  try{const input=document.createElement('canvas');input.width=canvas.width;input.height=canvas.height;const ctx=input.getContext('2d')!;const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height);pixels.data.set(cleanRecognitionPixels(pixels.data,canvas.width,canvas.height));ctx.putImageData(pixels,0,0);const result=await worker.recognize(input,{}, {blocks:true});input.width=input.height=0;return recognizedLines(result.data.blocks||[],scale);}finally{await worker.terminate();}
 });queue=job;return job;
}
/** Remove table rules only from the OCR input. The displayed/exported original is untouched. */
export function cleanRecognitionPixels(pixels:Uint8ClampedArray,width:number,height:number):Uint8ClampedArray{
 const out=new Uint8ClampedArray(pixels);
 for(let i=0;i<out.length;i+=4){const gray=.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2],value=Math.max(0,Math.min(255,(gray-35)*255/205));out[i]=out[i+1]=out[i+2]=value;}
 for(const rule of detectRules(pixels,width,height,1)){const c=rule.cover!;for(let y=Math.max(0,Math.floor(c.y));y<Math.min(height,Math.ceil(c.y+c.h));y++)for(let x=Math.max(0,Math.floor(c.x));x<Math.min(width,Math.ceil(c.x+c.w));x++){const i=(y*width+x)*4;out[i]=out[i+1]=out[i+2]=255;}}
 return out;
}
/** Bulk reconstruction is for readable document text, not decorative/multicolour artwork. */
export function safeToRebuild(line:RecognizedLine,pixels:Uint8ClampedArray,width:number,height:number,scale:number):boolean{
 if((line.confidence??0)<85||line.h>36||line.h>line.w||!line.text.trim())return false;
 let ink=0,coloured=0;
 for(let y=Math.max(0,Math.floor(line.y*scale));y<Math.min(height,Math.ceil((line.y+line.h)*scale));y++)for(let x=Math.max(0,Math.floor(line.x*scale));x<Math.min(width,Math.ceil((line.x+line.w)*scale));x++){const i=(y*width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(Math.min(r,g,b)<180){ink++;if(Math.max(r,g,b)-Math.min(r,g,b)>35)coloured++;}}
 return ink>0&&coloured/ink<.08;
}
