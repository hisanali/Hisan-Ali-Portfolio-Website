import type {ImportWord} from './datasheet-import-model';
import type {Worker,Block} from 'tesseract.js';
/** Convert OCR words to the same positioned cells used by native PDF text. */
export function ocrCells(blocks:Block[],scale:number):ImportWord[]{
 const words=blocks.flatMap(b=>b.paragraphs.flatMap(p=>p.lines.flatMap(l=>l.words))).filter(w=>w.text.trim());
 const lines:typeof words[]=[];
 for(const word of words.sort((a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0)){
  const mid=(word.bbox.y0+word.bbox.y1)/2,line=lines.find(l=>Math.abs((l[0].bbox.y0+l[0].bbox.y1)/2-mid)<Math.max(3*scale,(word.bbox.y1-word.bbox.y0)*.45));
  if(line)line.push(word);else lines.push([word]);
 }
 const cells:ImportWord[]=[];
 for(const line of lines){line.sort((a,b)=>a.bbox.x0-b.bbox.x0);let group:typeof words=[];
  const flush=()=>{if(!group.length)return;const x=Math.min(...group.map(w=>w.bbox.x0)),y=Math.min(...group.map(w=>w.bbox.y0)),r=Math.max(...group.map(w=>w.bbox.x1)),b=Math.max(...group.map(w=>w.bbox.y1));cells.push({text:group.map(w=>w.text).join(' '),x:x/scale,y:y/scale,width:(r-x)/scale,height:(b-y)/scale});group=[];};
  for(const word of line){if(group.length&&word.bbox.x0-group[group.length-1].bbox.x1>12*scale)flush();group.push(word);}flush();
 }
 return cells;
}
export async function createDatasheetOcr(progress:(s:string)=>void):Promise<Worker>{
 const module=await import('tesseract.js');const {createWorker,PSM}=module.default||module;
 const worker=await createWorker('eng',1,{workerPath:'/tools/studio-runtime/datasheets/ocr/worker.min.js',corePath:'/tools/studio-runtime/datasheets/ocr',langPath:'/tools/studio-runtime/datasheets/ocr',logger:m=>{if(m.status==='recognizing text')progress(`Reading scanned text… ${Math.round(m.progress*100)}%`);}});
 await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,preserve_interword_spaces:'1'});return worker;
}
