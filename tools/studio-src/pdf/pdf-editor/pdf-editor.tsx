"use client";
import {Localized,useAppLocale,translateUi} from "./../app-locale";
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type PointerEvent as RPointerEvent,type ReactNode} from "react";
import {
 ArrowLeft,ArrowUpRight,Bold,Check,Copy,Crop,Download,Eraser,FilePlus2,FileUp,Highlighter,ImagePlus,Italic,Layers,
 Minus,MousePointer2,PenLine,PenTool,Plus,Redo2,RotateCw,Square,Circle,Trash2,Type,Undo2,X,AlignLeft,AlignCenter,AlignRight,
 ChevronUp,ChevronDown,CalendarDays,Signature,ShieldCheck,ZoomIn,ZoomOut,Files,BringToFront,SendToBack,TextCursorInput,ScanText,
} from "lucide-react";
import Link from "next/link";
import {safeToRebuild,recognizedObject,recognizeScan,type RecognizedLine} from "../lib/pdf-editor-ocr";
import {ensurePdfPromise} from "../lib/datasheet-pdf-reader";
import type {PDFDocumentProxy,PDFPageProxy} from "pdfjs-dist/types/src/display/api";
import {
 textFingerprint,untouchedText,isLine,BASELINE,FONT_CSS,LINE_HEIGHT,arrowHead,baselineOf,boxOf,contains,familyOf,groupParagraphs,groupTextLines,isGarbled,inkFromStrokes,inkPath,moveObj,normBox,resizeBox,rotateObjCw,sampleColors,
 type Box,type EditorObj,type FontFamily,type InkObj,type LineObj,type RawTextItem,type ShapeObj,type TextLine,type TextObj,
} from "../lib/pdf-editor-model";
import "./pdf-editor.css";
import {EXTRA_FONTS,customFontCss,loadEditorFont,registerEditorFont} from "../lib/pdf-editor-fonts";
import ScanImport from "./scan-import";
import {detectRules,removePaper} from "../lib/pdf-editor-vector";

type PdfJs=typeof import("pdfjs-dist");
type PageState={id:string;src?:string;index:number;baseRotation:number;rotation:number;w:number;h:number;crop:{left:number;bottom:number;width:number;height:number};objects:EditorObj[];hidden:string[]};
type Tool="edit"|"replace"|"text"|"draw"|"highlight"|"rect"|"ellipse"|"line"|"arrow"|"whiteout"|"area";
type Sel={page:string;obj:string}|null;
type Detected={lines:RecognizedLine[];images:(Box&{key:string})[]};

const uid=()=>Math.random().toString(36).slice(2,10);
const SWATCHES=["#111111","#ffffff","#0f5a70","#1d4ed8","#ad4136","#2c7453","#a9834d","#7c3aed","#f59e0b","#ec4899"];
const HIGHLIGHTS=["#fde047","#86efac","#93c5fd","#f9a8d4","#fdba74"];
// Editing comes first; drawing tools live under More.
const TOOLS:{id:Tool;label:string;icon:ReactNode;hint:string;more?:boolean}[]=[
 {id:"edit",label:"Edit",icon:<MousePointer2/>,hint:"Tap any text to change it, or an image to move it"},
 {id:"replace",label:"Replace",icon:<TextCursorInput/>,hint:"Drag over any words — even on a scan — to retype them"},
 {id:"text",label:"Add text",icon:<Type/>,hint:"Tap where the new text should go"},
 {id:"whiteout",label:"Erase",icon:<Eraser/>,hint:"Drag over anything to remove it"},
 {id:"area",label:"Move area",icon:<Crop/>,hint:"Drag around any part of the page, then move it"},
 {id:"highlight",label:"Highlight",icon:<Highlighter/>,hint:"Drag across what you want to highlight"},
 {id:"draw",label:"Draw",icon:<PenLine/>,hint:"Draw with your finger or mouse",more:true},
 {id:"rect",label:"Box",icon:<Square/>,hint:"Drag to draw a box",more:true},
 {id:"ellipse",label:"Circle",icon:<Circle/>,hint:"Drag to draw a circle",more:true},
 {id:"line",label:"Line",icon:<Minus/>,hint:"Drag to draw a line",more:true},
 {id:"arrow",label:"Arrow",icon:<ArrowUpRight/>,hint:"Drag to draw an arrow",more:true},
];

let pdfjsPromise:Promise<PdfJs>|null=null;
function loadPdfJs(){
 ensurePdfPromise();
 pdfjsPromise??=(async()=>{
  const lib=await import("pdfjs-dist/legacy/build/pdf.mjs") as unknown as PdfJs;
  lib.GlobalWorkerOptions.workerSrc="/tools/studio-runtime/datasheets/pdf.worker.4.8.69.min.js";return lib;
 })();
 return pdfjsPromise;
}
function readFile(file:File):Promise<string>{return new Promise((ok,fail)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=()=>fail(r.error);r.readAsDataURL(file);});}
function loadImg(src:string):Promise<HTMLImageElement>{return new Promise((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=fail;i.src=src;});}
/** Photos are re-encoded (max 2400px) so huge camera files stay light; PNG keeps transparency. */
async function normaliseImage(src:string){
 const img=await loadImg(src),k=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));
 const c=document.createElement("canvas");c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);c.getContext("2d")!.drawImage(img,0,0,c.width,c.height);
 const png=src.startsWith("data:image/png")||src.startsWith("data:image/gif")||src.startsWith("data:image/webp");
 return {src:c.toDataURL(png?"image/png":"image/jpeg",.9),w:c.width,h:c.height};
}
const totalRot=(p:PageState)=>(((p.baseRotation+p.rotation)%360)+360)%360;

export default function PdfEditor({readOnly=false}:{readOnly?:boolean}){
 const {language}=useAppLocale();
 const sources=useRef(new Map<string,{bytes:Uint8Array;doc:PDFDocumentProxy}>());
 const [scan,setScan]=useState<""|"page"|"seal">("");
 const [docs,setDocs]=useState(()=>new Map<string,PDFDocumentProxy>());
 const [pages,setPages]=useState<PageState[]>([]);
 const past=useRef<PageState[][]>([]),future=useRef<PageState[][]>([]);
 const [hist,setHist]=useState({undo:0,redo:0});
// Undo/redo button state, read after React has applied the queued change.
 const sync=useCallback(()=>window.setTimeout(()=>setHist({undo:past.current.length,redo:future.current.length})),[]);
 const [fileName,setFileName]=useState("");
 const [tool,setTool]=useState<Tool>("edit");
 const [sel,setSel]=useState<Sel>(null);
 const [editing,setEditing]=useState<string|null>(null);
 const [zoom,setZoom]=useState(1);
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const [panel,setPanel]=useState<""|"pages"|"insert"|"sign"|"save">("");
 const [activePage,setActivePage]=useState("");
 const [width,setWidth]=useState(0);
 const [drag,setDrag]=useState(false);
 const [style,setStyle]=useState({color:"#111111",pen:3,hl:"#fde047",textSize:14,font:"sans" as FontFamily,stroke:"#ad4136",fill:"none",shapeWidth:2});
 const [toast,setToast]=useState("");
 const [saveFormat,setSaveFormat]=useState<"pdf"|"png"|"jpeg">("pdf"),[saveScope,setSaveScope]=useState("all");
 const [flatten,setFlatten]=useState(true);
 const [askPassword,setAskPassword]=useState<{wrong:boolean;answer:(pw:string|null)=>void}|null>(null);
 const fileInput=useRef<HTMLInputElement>(null),imageInput=useRef<HTMLInputElement>(null),mergeInput=useRef<HTMLInputElement>(null);
 const scroller=useRef<HTMLDivElement>(null);
 const dirty=hist.undo>0;
 const pagesRef=useRef(pages);
 useLayoutEffect(()=>{pagesRef.current=pages;},[pages]);

 // History: every committed change keeps the previous state for Undo.
 const commit=useCallback((next:PageState[]|((p:PageState[])=>PageState[]),base?:PageState[])=>{
  setPages(cur=>{const value=typeof next==="function"?next(cur):next;const b=base??cur;if(past.current[past.current.length-1]!==b)past.current.push(b);if(past.current.length>80)past.current.shift();future.current=[];return value;});sync();
 },[sync]);
 const undo=useCallback(()=>{const prev=past.current.pop();if(!prev)return;future.current.push(pagesRef.current);setPages(prev);setEditing(null);setSel(null);sync();},[sync]);
 const redo=useCallback(()=>{const next=future.current.pop();if(!next)return;past.current.push(pagesRef.current);setPages(next);setEditing(null);setSel(null);sync();},[sync]);
 const updateObj=useCallback((pageId:string,objId:string,fn:(o:EditorObj)=>EditorObj,live=false)=>{
  const apply=(ps:PageState[])=>ps.map(p=>p.id!==pageId?p:{...p,objects:p.objects.map(o=>o.id===objId?fn(o):o)});
  if(live)setPages(apply);else commit(apply);
 },[commit]);
 const addObj=useCallback((pageId:string,o:EditorObj,hide?:string)=>{commit(ps=>ps.map(p=>p.id!==pageId?p:{...p,objects:[...p.objects,o],hidden:hide?[...p.hidden,hide]:p.hidden}));setSel({page:pageId,obj:o.id});},[commit]);
 const removeSel=useCallback(()=>{if(!sel)return;commit(ps=>ps.map(p=>p.id!==sel.page?p:{...p,objects:p.objects.flatMap(o=>o.id!==sel.obj?[o]:o.cover?[{id:uid(),kind:"rect" as const,...o.cover,fill:o.cover.color,fillOpacity:1,stroke:"none",strokeWidth:0,cover:o.cover}]:[])}));setSel(null);setEditing(null);},[sel,commit]);

 // Typing is live; it becomes one undo step when the box closes.
 const editBase=useRef<PageState[]|null>(null);
 const startEdit=useCallback((id:string|null)=>{if(id)editBase.current=pagesRef.current;setEditing(id);},[]);
 const finishEdit=useCallback((pageId:string,objId:string)=>{
  setEditing(null);const base=editBase.current||undefined,cur=pagesRef.current;editBase.current=null;
  const o=cur.find(p=>p.id===pageId)?.objects.find(x=>x.id===objId);
  if(o?.kind==="text"&&!o.text.trim()&&!o.cover){commit(ps=>ps.map(p=>p.id!==pageId?p:{...p,objects:p.objects.filter(x=>x.id!==objId)}),base);setSel(null);}
  else if(cur!==base)commit(()=>cur,base);
 },[commit]);
 const flash=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(x=>x===t?"":x),2200);};

 const openPdf=useCallback(async(file:File,append=false)=>{
  setError("");setBusy(append?"Adding pages…":"Opening PDF…");
  try{
   let bytes=new Uint8Array(await file.arrayBuffer());
   if(file.type.startsWith("image/")){const image=await normaliseImage(await readFile(file));const {PDFDocument}=await import("pdf-lib");const pdf=await PDFDocument.create();const embedded=image.src.startsWith("data:image/png")?await pdf.embedPng(image.src):await pdf.embedJpg(image.src);const k=Math.min(1,842/Math.max(image.w,image.h));const pg=pdf.addPage([image.w*k,image.h*k]);pg.drawImage(embedded,{x:0,y:0,width:image.w*k,height:image.h*k});bytes=new Uint8Array(await pdf.save());}
   const lib=await loadPdfJs();
   const task=lib.getDocument({cMapUrl:"/tools/studio-runtime/datasheets/cmaps/",cMapPacked:true,standardFontDataUrl:"/tools/studio-runtime/datasheets/standard-fonts/",data:bytes.slice(),isEvalSupported:false,enableXfa:false,stopAtErrors:false});
   // Password-protected files: ask, and ask again after a wrong password.
   task.onPassword=(update:(pw:string)=>void,reason:number)=>{setBusy("");setAskPassword({wrong:reason===lib.PasswordResponses.INCORRECT_PASSWORD,answer:pw=>{setAskPassword(null);if(pw===null){void task.destroy();return;}setBusy("Opening PDF…");update(pw);}});};
   const doc=await task.promise;
   const srcId=uid();sources.current.set(srcId,{bytes,doc});setDocs(m=>new Map(m).set(srcId,doc));
   const added:PageState[]=[];
   for(let i=0;i<doc.numPages;i++){
    const pg=await doc.getPage(i+1),v=pg.getViewport({scale:1}),[x1,y1,x2,y2]=pg.view;
    added.push({id:uid(),src:srcId,index:i,baseRotation:pg.rotate,rotation:0,w:v.width,h:v.height,crop:{left:Math.min(x1,x2),bottom:Math.min(y1,y2),width:Math.abs(x2-x1),height:Math.abs(y2-y1)},objects:[],hidden:[]});
   }
   if(append){commit(ps=>[...ps,...added]);flash(`${added.length} page${added.length===1?"":"s"} added`);}
   else{past.current=[];future.current=[];setPages(added);setFileName(file.name.replace(/\.(pdf|png|jpe?g|webp)$/i,""));setSel(null);setEditing(null);setZoom(1);setTool("edit");setActivePage(added[0]?.id||"");scroller.current?.scrollTo({top:0});}
  }catch(e){
   const name=e instanceof Error?e.name:"";
   if(name==="PasswordException"||(e instanceof Error&&/destroy|abort/i.test(e.message)))return;// cancelled at the password prompt
   setError(name==="InvalidPDFException"?"This file is not a PDF, or it is damaged beyond repair. Try exporting it again as PDF.":"This PDF could not be opened. Try saving it again from the app that made it.");
  }finally{setBusy("");}
 },[commit]);

 // Leave-page guard while there are unsaved edits.
 useEffect(()=>{if(!dirty)return;const f=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",f);return()=>window.removeEventListener("beforeunload",f);},[dirty]);
 useEffect(()=>{const el=scroller.current;if(!el)return;const ro=new ResizeObserver(()=>setWidth(el.clientWidth));ro.observe(el);setWidth(el.clientWidth);return()=>ro.disconnect();},[pages.length>0]);// eslint-disable-line react-hooks/exhaustive-deps

 // Keyboard: undo/redo, delete, nudge, escape.
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   const typing=(e.target as HTMLElement)?.closest?.("input,textarea,[contenteditable=true]");
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&!typing){e.preventDefault();if(e.shiftKey)redo();else undo();return;}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"&&!typing){e.preventDefault();redo();return;}
   if(typing)return;
   if(e.key==="Escape"){setSel(null);setPanel("");setTool("edit");}
   if(sel&&(e.key==="Delete"||e.key==="Backspace")){e.preventDefault();removeSel();}
   if(sel&&e.key.startsWith("Arrow")){e.preventDefault();const d=e.shiftKey?10:1;const dx=e.key==="ArrowLeft"?-d:e.key==="ArrowRight"?d:0,dy=e.key==="ArrowUp"?-d:e.key==="ArrowDown"?d:0;updateObj(sel.page,sel.obj,o=>moveObj(o,dx,dy));}
  };
  window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
 },[sel,undo,redo,removeSel,updateObj]);

 const fitScale=useCallback((p:PageState)=>{const avail=Math.max(200,Math.min(width-(width<640?20:64),980));return avail/p.w;},[width]);
 const selected=useMemo(()=>{if(!sel)return null;const p=pages.find(x=>x.id===sel.page);const o=p?.objects.find(x=>x.id===sel.obj);return o&&p?{page:p,obj:o}:null;},[sel,pages]);
 const targetPage=()=>pages.find(p=>p.id===activePage)||pages[0];

 const placeImage=async(src:string,w:number,h:number,label?:string)=>{
  const p=targetPage();if(!p)return;
  const k=Math.min(1,(p.w*.5)/w,(p.h*.4)/h),iw=w*k,ih=h*k;
  // Centre on the part of the page currently on screen.
  const el=document.querySelector<HTMLElement>(`[data-page="${p.id}"]`),sc=scroller.current;let cy=p.h/2;
  if(el&&sc){const r=el.getBoundingClientRect(),s=sc.getBoundingClientRect(),mid=(Math.max(r.top,s.top)+Math.min(r.bottom,s.bottom))/2;cy=Math.max(ih/2,Math.min(p.h-ih/2,(mid-r.top)/(r.height/p.h)));}
  addObj(p.id,{id:uid(),kind:"image",src,x:(p.w-iw)/2,y:cy-ih/2,w:iw,h:ih});setTool("edit");if(label)flash(label);
 };
 const onImageFile=async(file?:File)=>{if(!file)return;try{const n=await normaliseImage(await readFile(file));await placeImage(n.src,n.w,n.h,"Image added — drag to place it");}catch{setError("That image could not be read.");}};

 const insertStamp=(kind:"check"|"cross"|"date")=>{
  const p=targetPage();if(!p)return;setPanel("");
  if(kind==="date"){const t=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});addObj(p.id,{id:uid(),kind:"text",text:t,x:p.w/2-45,y:p.h/2-10,w:90,h:style.textSize*LINE_HEIGHT,size:style.textSize,font:style.font,bold:false,italic:false,color:style.color,align:"left"});return;}
  const pts:[number,number][][]=kind==="check"?[[[0.08,0.55],[0.38,0.88],[0.92,0.12]]]:[[[0.12,0.12],[0.88,0.88]],[[0.88,0.12],[0.12,0.88]]];
  addObj(p.id,{id:uid(),kind:"ink",x:p.w/2-12,y:p.h/2-12,w:24,h:24,points:pts,stroke:kind==="check"?"#2c7453":"#ad4136",strokeWidth:3});
 };
 const addBlankPage=()=>{const ref=targetPage();const w=ref?.w||595.28,h=ref?.h||841.89;const at=ref?pages.indexOf(ref)+1:pages.length;const np:PageState={id:uid(),index:0,baseRotation:0,rotation:0,w,h,crop:{left:0,bottom:0,width:w,height:h},objects:[],hidden:[]};commit(ps=>[...ps.slice(0,at),np,...ps.slice(at)]);setActivePage(np.id);flash("Blank page added");};

 const download=async()=>{
  setPanel("");setBusy(saveFormat==="pdf"?"Saving your PDF…":"Rendering images…");setSel(null);setEditing(null);
  try{
   const {exportPdf}=await import("../lib/pdf-export");
   // A 200 dpi picture of the original page (forms and annotations included).
   const picture=async(p:{src?:string;index:number;rotation:number;w:number;h:number;objects?:EditorObj[]})=>{const doc=sources.current.get(p.src!)!.doc,pg=await doc.getPage(p.index+1),c=document.createElement("canvas");await (await renderTo(pg,p.rotation,Math.min(200/72,4000/Math.max(p.w,p.h)),c)).promise;if(flatten){const g=c.getContext("2d")!;g.save();g.scale(c.width/p.w,c.height/p.h);for(const o of p.objects||[])if(o.cover&&!untouchedText(o)){g.fillStyle=o.cover.color;g.fillRect(o.cover.x,o.cover.y,o.cover.w,o.cover.h);}g.restore();}const url=c.toDataURL("image/jpeg",.9);c.width=c.height=0;return url;};
   const out=[];
   for(const p of pages){
    const page={src:p.src,index:p.index,rotation:totalRot(p),w:p.w,h:p.h,crop:p.crop,objects:p.objects};
    // Replaced or moved content leaves the old text in the file unless the page is flattened.
    const background=flatten&&p.src&&p.objects.some(o=>o.cover)?await picture(page):undefined;
    out.push({...page,background});
   }
   const {bytes,rasterPages}=await exportPdf(new Map([...sources.current].map(([k,v])=>[k,v.bytes])),out,picture);
   if(rasterPages)flash(`Saved. ${rasterPages} page${rasterPages===1?" was":"s were"} protected or unusual, so ${rasterPages===1?"it is":"they are"} saved as a sharp image`);
   let name=`${fileName||"document"}-edited.pdf`,blob=new Blob([bytes as BlobPart],{type:"application/pdf"});
   if(saveFormat!=="pdf"){
    const lib=await loadPdfJs(),doc=await lib.getDocument({cMapUrl:"/tools/studio-runtime/datasheets/cmaps/",cMapPacked:true,standardFontDataUrl:"/tools/studio-runtime/datasheets/standard-fonts/",data:bytes.slice(),isEvalSupported:false}).promise;const indices=saveScope==="all"?pages.map((_,i)=>i):[Math.max(0,pages.findIndex(p=>p.id===saveScope))];const files:Record<string,Uint8Array>={};
    try{for(const i of indices){setBusy(`Rendering page ${i+1} of ${pages.length}…`);const pg=await doc.getPage(i+1),v=pg.getViewport({scale:1}),c=document.createElement("canvas");await (await renderTo(pg,pg.rotate,Math.min(300/72,6000/Math.max(v.width,v.height),Math.sqrt(16000000/(v.width*v.height))),c)).promise;const image=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error("Image export failed")),`image/${saveFormat}`,.95));files[`${fileName||"document"}-page-${String(i+1).padStart(3,"0")}.${saveFormat==="jpeg"?"jpg":"png"}`]=new Uint8Array(await image.arrayBuffer());c.width=c.height=0;}}finally{await doc.destroy();}
    if(indices.length===1){name=Object.keys(files)[0];blob=new Blob([files[name] as BlobPart],{type:`image/${saveFormat}`});}else{const {zipSync}=await import("fflate");name=`${fileName||"document"}-images.zip`;blob=new Blob([zipSync(files,{level:0}) as BlobPart],{type:"application/zip"});}
   }
   const file=new File([blob],name,{type:blob.type});
   const touch=matchMedia("(pointer: coarse)").matches;
   if(touch&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:name});return;}catch(e){if((e as Error).name==="AbortError")return;}}
   const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
   if(!rasterPages||saveFormat!=="pdf")flash(saveFormat==="pdf"?"PDF saved":"Images saved");
  }catch(e){console.error(e);setError("The file could not be saved. Try again, or remove the last edit.");}
  finally{setBusy("");}
 };

 const scanUi=scan?<ScanImport seal={scan==="seal"} close={()=>setScan("")} apply={async(src,w,h)=>{if(scan==="seal"){await placeImage(src,w,h,"Seal");}else{const response=await fetch(src);await openPdf(new File([await response.blob()],"Scanned page.png",{type:"image/png"}),pages.length>0);}}}/>:null;
 if(!pages.length)return <Localized as="main" className="pdfe pdfe-empty" onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)void openPdf(f);}}>
  <Localized as="header" className="pdfe-empty-top"><Link href="/tools/" className="pdfe-icon-btn" aria-label={translateUi("Back to Tools",language)}><ArrowLeft/></Link><Localized as="span">PDF Editor</Localized></Localized>
  <Localized as="section" className={`pdfe-drop${drag?" over":""}`}>
   <Localized as="div" className="pdfe-drop-art" aria-hidden="true"><FileUp/></Localized>
   <Localized as="h1">{readOnly?"View a PDF":"Edit any PDF"}</Localized>
   <Localized as="p">{readOnly?"Open PDF or image from this device to view its pages. Your file stays on this device.":"Change text, move images, sign, highlight, draw and rearrange pages — then save a new PDF."}</Localized>
   <Localized as="button" className="pdfe-primary big" onClick={()=>fileInput.current?.click()} disabled={Boolean(busy)}>{busy?<><Localized as="span" className="pdfe-spinner"/>{busy}</>:<><FileUp/>Open PDF or image</>}</Localized>
   {!readOnly&&<Localized as="button" className="pdfe-ghost" onClick={()=>setScan("page")}><ScanText/>Scan with camera</Localized>}
   <Localized as="small" className="pdfe-desktop-only">or drop a file here</Localized>
   {error&&<Localized as="p" className="pdfe-error" role="alert">{error}</Localized>}
   {!readOnly&&<Localized as="ul" className="pdfe-features">
    <Localized as="li"><Type/><Localized as="span"><Localized as="b">Edit text</Localized>Tap any line to rewrite it</Localized></Localized>
    <Localized as="li"><ImagePlus/><Localized as="span"><Localized as="b">Move images</Localized>Drag, resize or replace</Localized></Localized>
    <Localized as="li"><Signature/><Localized as="span"><Localized as="b">Sign</Localized>Draw your signature once</Localized></Localized>
    <Localized as="li"><Files/><Localized as="span"><Localized as="b">Pages</Localized>Rotate, reorder, add, delete</Localized></Localized>
   </Localized>}
   <Localized as="p" className="pdfe-privacy"><ShieldCheck/>Your file stays on this device. Nothing is uploaded.</Localized>
  </Localized>
  <Localized as="input" ref={fileInput} type="file" accept="application/pdf,.pdf,image/*" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void openPdf(f);}}/>
  {scanUi}
  {askPassword&&<PasswordSheet ask={askPassword}/>}
 </Localized>;

 if(readOnly)return <Localized as="main" className="pdfe pdfe-viewer">
  <Localized as="header" className="pdfe-top">
   <Link href="/tools/" className="pdfe-icon-btn" aria-label={translateUi("Back to Tools",language)}><ArrowLeft/></Link>
   <Localized as="div" className="pdfe-title"><Localized as="b">{fileName||"PDF viewer"}</Localized><Localized as="small">{pages.length} page{pages.length===1?"":"s"} · View only</Localized></Localized>
   <Localized as="button" className="pdfe-primary" onClick={()=>fileInput.current?.click()}><FileUp/><Localized as="span">Open PDF</Localized></Localized>
  </Localized>
  <Localized as="div" className="pdfe-body"><Localized as="div" className="pdfe-stage"><Localized as="div" ref={scroller} className="pdfe-scroll">
   {pages.map((p,i)=><PageView key={p.id} page={p} num={i+1} scale={fitScale(p)*zoom} tool="edit" sel={null} editing={null} style={style}
    source={p.src?docs.get(p.src):undefined} readOnly onActive={()=>setActivePage(p.id)} flash={()=>{}} setSel={()=>{}} setEditing={()=>{}} finishEdit={()=>{}} setTool={()=>{}}
    setPagesLive={()=>{}} commit={()=>{}} addObj={()=>{}} updateObj={()=>{}} getPages={()=>pagesRef.current}/>)}
  </Localized><Localized as="div" className="pdfe-zoom" role="group" aria-label="Zoom">
   <Localized as="button" onClick={()=>setZoom(z=>Math.max(.5,+(z-.25).toFixed(2)))} aria-label="Zoom out"><ZoomOut/></Localized>
   <Localized as="button" className="pct" onClick={()=>setZoom(1)} aria-label="Fit to width">{Math.round(zoom*100)}%</Localized>
   <Localized as="button" onClick={()=>setZoom(z=>Math.min(4,+(z+.25).toFixed(2)))} aria-label="Zoom in"><ZoomIn/></Localized>
  </Localized></Localized></Localized>
  <Localized as="input" ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void openPdf(f);}}/>
  {busy&&<Localized as="div" className="pdfe-busy" role="status"><Localized as="span" className="pdfe-spinner"/>{busy}</Localized>}
  {error&&<Localized as="div" className="pdfe-toast err" role="alert" onClick={()=>setError("")}>{error}</Localized>}
  {askPassword&&<PasswordSheet ask={askPassword}/>}
 </Localized>;

 const toolInfo=TOOLS.find(t=>t.id===tool)!;
 return <Localized as="main" className="pdfe">
  <Localized as="header" className="pdfe-top">
   <Link href="/tools/" className="pdfe-icon-btn" aria-label={translateUi("Back to Tools",language)} onClick={e=>{if(dirty&&!confirm(translateUi("Leave without saving your changes?",language)))e.preventDefault();}}><ArrowLeft/></Link>
   <Localized as="div" className="pdfe-title"><Localized as="input" value={fileName} onChange={e=>setFileName(e.target.value)} aria-label="File name" spellCheck={false}/><Localized as="small">{pages.length} page{pages.length===1?"":"s"}{dirty?" · edited":""}</Localized></Localized>
   <Localized as="button" className="pdfe-icon-btn" onClick={undo} disabled={!hist.undo} aria-label="Undo"><Undo2/></Localized>
   <Localized as="button" className="pdfe-icon-btn" onClick={redo} disabled={!hist.redo} aria-label="Redo"><Redo2/></Localized>
   <Localized as="button" className="pdfe-icon-btn pdfe-hide-xs" onClick={()=>setPanel(panel==="pages"?"":"pages")} aria-label="Pages" aria-pressed={panel==="pages"}><Layers/></Localized>
   <Localized as="button" className="pdfe-primary" onClick={()=>setPanel("save")} disabled={Boolean(busy)}><Download/><Localized as="span">Save</Localized></Localized>
  </Localized>

  <Localized as="div" className="pdfe-body">
   <nav className="pdfe-rail" aria-label="Tools">
    {TOOLS.filter(t=>!t.more).map(t=><Localized as="button" key={t.id} className={tool===t.id?"on":""} onClick={()=>{setTool(t.id);setEditing(null);if(t.id!=="edit")setSel(null);}} aria-pressed={tool===t.id} title={t.label}>{t.icon}<Localized as="span">{t.label}</Localized></Localized>)}
    <Localized as="span" className="pdfe-rail-sep"/>
    <Localized as="button" onClick={()=>setScan("page")} title="Scan document"><ScanText/><Localized as="span">Scan</Localized></Localized>
    <Localized as="button" onClick={()=>setScan("seal")} title="Import seal"><Signature/><Localized as="span">Seal</Localized></Localized>
    <Localized as="button" onClick={()=>imageInput.current?.click()} title="Image">{<ImagePlus/>}<Localized as="span">Image</Localized></Localized>
    <Localized as="button" onClick={()=>setPanel("sign")} title="Sign"><PenTool/><Localized as="span">Sign</Localized></Localized>
    <Localized as="button" onClick={()=>setPanel(panel==="insert"?"":"insert")} aria-pressed={panel==="insert"||Boolean(TOOLS.find(t=>t.id===tool)?.more)} title="More"><Plus/><Localized as="span">More</Localized></Localized>
    <Localized as="button" className="pdfe-show-xs" onClick={()=>setPanel(panel==="pages"?"":"pages")} aria-pressed={panel==="pages"} title="Pages"><Layers/><Localized as="span">Pages</Localized></Localized>
   </nav>

   <Localized as="div" className="pdfe-stage">
    <Localized as="div" className="pdfe-hint" aria-live="polite">{toolInfo.icon}<Localized as="span">{editing?"Typing — tap outside the box when you are done":selected?"Drag to move · handles resize":toolInfo.hint}</Localized></Localized>
    <Localized as="div" ref={scroller} className="pdfe-scroll" onPointerDown={e=>{if(e.target===e.currentTarget)setSel(null);}}>
     {pages.map((p,i)=><PageView key={p.id} page={p} num={i+1} scale={fitScale(p)*zoom} tool={tool} sel={sel} editing={editing} style={style}
      source={p.src?docs.get(p.src):undefined}
      onActive={()=>setActivePage(p.id)} flash={flash} setSel={setSel} setEditing={startEdit} finishEdit={finishEdit} setTool={setTool}
      setPagesLive={setPages} commit={commit} addObj={addObj} updateObj={updateObj} getPages={()=>pagesRef.current}/>)}
     <Localized as="div" className="pdfe-end"><Localized as="button" className="pdfe-ghost" onClick={addBlankPage}><FilePlus2/>Add blank page</Localized><Localized as="button" className="pdfe-ghost" onClick={()=>mergeInput.current?.click()}><FileUp/>Add pages from PDF</Localized></Localized>
    </Localized>
    <Localized as="div" className="pdfe-zoom" role="group" aria-label="Zoom">
     <Localized as="button" onClick={()=>setZoom(z=>Math.max(.5,+(z-.25).toFixed(2)))} aria-label="Zoom out"><ZoomOut/></Localized>
     <Localized as="button" className="pct" onClick={()=>setZoom(1)} aria-label="Fit to width">{Math.round(zoom*100)}%</Localized>
     <Localized as="button" onClick={()=>setZoom(z=>Math.min(4,+(z+.25).toFixed(2)))} aria-label="Zoom in"><ZoomIn/></Localized>
    </Localized>
    {selected&&!editing&&<Props key={selected.obj.id} obj={selected.obj} matchOriginal={async()=>{const {page,obj}=selected;if(obj.kind!=="text"||!obj.cover||!page.src)return;const doc=docs.get(page.src);if(!doc)return;const key=`${page.src}:${page.index}:${totalRot(page)}`;const lines=await scanAnalysis.get(key);if(!lines?.length)return;const cover=obj.cover;const original=lines.reduce((a,b)=>Math.hypot(a.x-cover.x,a.y-cover.y)<Math.hypot(b.x-cover.x,b.y-cover.y)?a:b);const matched=makeRecognized(original,await getHiRes(doc,page));if(obj.text===original.text)matched.originalStyle=textFingerprint({...matched,id:obj.id});updateObj(page.id,obj.id,()=>({...matched,id:obj.id,text:obj.text}));flash("Original appearance restored where wording is unchanged; font estimate updated.");}} pageWidth={selected.page.w} pageHeight={selected.page.h} update={(fn,live)=>updateObj(selected.page.id,selected.obj.id,fn,live)} remove={removeSel}
     duplicate={()=>{const o={...moveObj(selected.obj,12,12),id:uid(),cover:undefined};addObj(selected.page.id,o);}}
     layer={dir=>commit(ps=>ps.map(p=>{if(p.id!==selected.page.id)return p;const rest=p.objects.filter(o=>o.id!==selected.obj.id);return {...p,objects:dir>0?[...rest,selected.obj]:[selected.obj,...rest]};}))}
     edit={()=>startEdit(selected.obj.id)} close={()=>setSel(null)}/>}
    {!selected&&!editing&&!["edit","area","replace"].includes(tool)&&<ToolOptions tool={tool} style={style} setStyle={setStyle}/>}
   </Localized>

   {panel==="pages"&&<PagesPanel pages={pages} docs={docs} active={activePage} close={()=>setPanel("")}
    goTo={id=>{setActivePage(id);document.querySelector(`[data-page="${id}"]`)?.scrollIntoView({behavior:"smooth",block:"start"});}}
    rotate={id=>commit(ps=>ps.map(p=>p.id!==id?p:{...p,rotation:(p.rotation+90)%360,w:p.h,h:p.w,objects:p.objects.map(o=>rotateObjCw(o,p.h))}))}
    remove={id=>{if(pages.length<=1){flash("A PDF needs at least one page");return;}commit(ps=>ps.filter(p=>p.id!==id));}}
    duplicate={id=>commit(ps=>{const i=ps.findIndex(p=>p.id===id);const c={...ps[i],id:uid(),objects:ps[i].objects.map(o=>({...o,id:uid()}))};return [...ps.slice(0,i+1),c,...ps.slice(i+1)];})}
    move={(id,d)=>commit(ps=>{const i=ps.findIndex(p=>p.id===id),j=i+d;if(j<0||j>=ps.length)return ps;const n=[...ps];[n[i],n[j]]=[n[j],n[i]];return n;})}
    blank={addBlankPage} merge={()=>mergeInput.current?.click()}/>}
  </Localized>

  {panel==="insert"&&<Localized as="div" className="pdfe-sheet-back" onPointerDown={()=>setPanel("")}><Localized as="section" className="pdfe-sheet" onPointerDown={e=>e.stopPropagation()} aria-label="Insert">
   <Localized as="header"><Localized as="b">More tools</Localized><Localized as="button" className="pdfe-icon-btn" onClick={()=>setPanel("")} aria-label="Close"><X/></Localized></Localized>
   <Localized as="div" className="pdfe-insert-grid">
    {TOOLS.filter(t=>t.more).map(t=><Localized as="button" key={t.id} className={tool===t.id?"on":""} onClick={()=>{setPanel("");setTool(t.id);setSel(null);}}>{t.icon}<Localized as="span">{t.label}</Localized></Localized>)}
    <Localized as="button" onClick={()=>{setPanel("");imageInput.current?.click();}}><ImagePlus/><Localized as="span">Image</Localized></Localized>
    <Localized as="button" onClick={()=>setPanel("sign")}><PenTool/><Localized as="span">Signature</Localized></Localized>
    <Localized as="button" onClick={()=>insertStamp("check")}><Check/><Localized as="span">Tick</Localized></Localized>
    <Localized as="button" onClick={()=>insertStamp("cross")}><X/><Localized as="span">Cross</Localized></Localized>
    <Localized as="button" onClick={()=>insertStamp("date")}><CalendarDays/><Localized as="span">Today’s date</Localized></Localized>
    <Localized as="button" onClick={()=>{setPanel("");addBlankPage();}}><FilePlus2/><Localized as="span">Blank page</Localized></Localized>
    <Localized as="button" onClick={()=>{setPanel("");mergeInput.current?.click();}}><Files/><Localized as="span">Pages from PDF</Localized></Localized>
    <Localized as="button" onClick={()=>{setPanel("");fileInput.current?.click();}}><FileUp/><Localized as="span">Open another</Localized></Localized>
   </Localized>
  </Localized></Localized>}
  {panel==="save"&&<Localized as="div" className="pdfe-sheet-back" onPointerDown={()=>setPanel("")}><Localized as="section" className="pdfe-sheet" onPointerDown={e=>e.stopPropagation()} aria-label="Save document">
   <Localized as="header"><Localized as="b">Save document</Localized><Localized as="button" className="pdfe-icon-btn" onClick={()=>setPanel("")} aria-label="Close"><X/></Localized></Localized>
   <Localized as="label" className="pdfe-field"><Localized as="span">File name</Localized><Localized as="div"><Localized as="input" value={fileName} onChange={e=>setFileName(e.target.value)} spellCheck={false}/><Localized as="em">{saveFormat==="pdf"?"-edited.pdf":saveFormat==="png"?".png":".jpg"}</Localized></Localized></Localized>
   <Localized as="label" className="pdfe-field"><Localized as="span">Format</Localized><Localized as="select" aria-label="Export format" value={saveFormat} onChange={e=>setSaveFormat(e.target.value as typeof saveFormat)}><Localized as="option" value="pdf">Editable PDF — all pages</Localized><Localized as="option" value="png">PNG image</Localized><Localized as="option" value="jpeg">JPEG image</Localized></Localized></Localized>
   {saveFormat!=="pdf"&&<Localized as="label" className="pdfe-field"><Localized as="span">Pages</Localized><Localized as="select" aria-label="Pages to export" value={saveScope} onChange={e=>setSaveScope(e.target.value)}><Localized as="option" value="all">All pages{pages.length>1?" (ZIP of images)":""}</Localized>{pages.map((p,i)=><Localized as="option" key={p.id} value={p.id}>Page {i+1}</Localized>)}</Localized><Localized as="small">High-resolution images, up to 300 dpi. Images do not retain editable text.</Localized></Localized>}
   {pages.some(p=>p.objects.some(o=>o.cover))&&<Localized as="label" className="pdfe-option"><Localized as="input" type="checkbox" checked={flatten} onChange={e=>setFlatten(e.target.checked)}/><Localized as="span"><Localized as="b">Fully remove replaced text</Localized><Localized as="small">Removes the covered original content while keeping your new text sharp, selectable and editable. Recommended for prices and names.</Localized></Localized></Localized>}
   <Localized as="p" className="pdfe-save-sum"><Files/>{pages.length} page{pages.length===1?"":"s"} · {pages.reduce((n,p)=>n+p.objects.length,0)} edit{pages.reduce((n,p)=>n+p.objects.length,0)===1?"":"s"}</Localized>
   <Localized as="button" className="pdfe-primary big" onClick={download}><Download/>{saveFormat==="pdf"?"Save PDF":saveScope==="all"&&pages.length>1?"Save images (ZIP)":"Save image"}</Localized>
  </Localized></Localized>}
  {panel==="sign"&&<SignaturePad close={()=>setPanel("")} place={async src=>{setPanel("");const i=await loadImg(src);await placeImage(src,i.naturalWidth/4,i.naturalHeight/4,"Signature added — drag it into place");}}/>}

  {busy&&<Localized as="div" className="pdfe-busy" role="status"><Localized as="span" className="pdfe-spinner"/>{busy}</Localized>}
  {error&&<Localized as="div" className="pdfe-toast err" role="alert" onClick={()=>setError("")}>{error}</Localized>}
  {toast&&!error&&<Localized as="div" className="pdfe-toast" role="status">{toast}</Localized>}
  <Localized as="input" ref={fileInput} type="file" accept="application/pdf,.pdf,image/*" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f&&(!dirty||confirm(translateUi("Open a new PDF? Unsaved changes will be lost.",language))))void openPdf(f);}}/>
  <Localized as="input" ref={mergeInput} type="file" accept="application/pdf,.pdf,image/*" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void openPdf(f,true);}}/>
  <Localized as="input" ref={imageInput} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";void onImageFile(f);}}/>
  {scanUi}
  {askPassword&&<PasswordSheet ask={askPassword}/>}
 </Localized>;
}

/* ───────────────────────── Page ───────────────────────── */

type Style={color:string;pen:number;hl:string;textSize:number;font:FontFamily;stroke:string;fill:string;shapeWidth:number};
type PageProps={page:PageState;num:number;scale:number;tool:Tool;sel:Sel;editing:string|null;style:Style;source?:PDFDocumentProxy;readOnly?:boolean;
 onActive:()=>void;flash:(t:string)=>void;setSel:(s:Sel)=>void;setEditing:(id:string|null)=>void;finishEdit:(page:string,obj:string)=>void;setTool:(t:Tool)=>void;
 setPagesLive:(f:(p:PageState[])=>PageState[])=>void;commit:(next:(p:PageState[])=>PageState[],base?:PageState[])=>void;
 addObj:(page:string,o:EditorObj,hide?:string)=>void;updateObj:(page:string,obj:string,fn:(o:EditorObj)=>EditorObj,live?:boolean)=>void;getPages:()=>PageState[]};

const analysis=new Map<string,Promise<Detected>>();
const scanAnalysis=new Map<string,Promise<RecognizedLine[]>>();
const hiRes=new Map<string,Promise<HTMLCanvasElement>>();
async function renderTo(pg:PDFPageProxy,rotation:number,scale:number,canvas:HTMLCanvasElement){
 const v=pg.getViewport({scale,rotation});canvas.width=Math.floor(v.width);canvas.height=Math.floor(v.height);
 const ctx=canvas.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
 const task=pg.render({canvasContext:ctx,viewport:v});return task;
}
function getHiRes(doc:PDFDocumentProxy,p:PageState){
 const key=`${p.src}:${p.index}:${totalRot(p)}`;
 if(!hiRes.has(key)){
  if(hiRes.size>6)hiRes.delete(hiRes.keys().next().value!);
  hiRes.set(key,(async()=>{const pg=await doc.getPage(p.index+1),c=document.createElement("canvas"),k=Math.min(3,3000/Math.max(p.w,p.h));await (await renderTo(pg,totalRot(p),k,c)).promise;c.dataset.k=String(k);return c;})());
 }
 return hiRes.get(key)!;
}
function crop(c:HTMLCanvasElement,b:Box){
 const k=Number(c.dataset.k),o=document.createElement("canvas");o.width=Math.max(1,Math.round(b.w*k));o.height=Math.max(1,Math.round(b.h*k));
 const g=o.getContext("2d")!;g.fillStyle="#ffffff";g.fillRect(0,0,o.width,o.height);g.drawImage(c,b.x*k,b.y*k,b.w*k,b.h*k,0,0,o.width,o.height);return o;
}
/** Grow a box until its edges are clear of ink, so a rough drag still covers whole letters. */
function fitToInk(c:HTMLCanvasElement,b:Box,bg:string):Box{
 const k=Number(c.dataset.k),g=c.getContext("2d")!,[br,bgc,bb]=[1,3,5].map(i=>parseInt(bg.slice(i,i+2),16));
 const inked=(x:number,y:number,w:number,h:number)=>{
  const px=Math.max(0,Math.round(x*k)),py=Math.max(0,Math.round(y*k)),pw=Math.min(c.width-px,Math.max(1,Math.round(w*k))),ph=Math.min(c.height-py,Math.max(1,Math.round(h*k)));
  if(pw<=0||ph<=0)return false;const d=g.getImageData(px,py,pw,ph).data;
  for(let i=0;i<d.length;i+=4)if(Math.abs(d[i]-br)+Math.abs(d[i+1]-bgc)+Math.abs(d[i+2]-bb)>90)return true;return false;
 };
 let {x,y,w,h}=b;const step=.75,maxY=b.h*.6,maxX=Math.min(b.h,b.w*.3);
 for(let n=0;n<maxY/step&&inked(x,y,w,step);n++){y-=step;h+=step;}
 for(let n=0;n<maxY/step&&inked(x,y+h-step,w,step);n++)h+=step;
 for(let n=0;n<maxX/step&&inked(x,y,step,h);n++){x-=step;w+=step;}
 for(let n=0;n<maxX/step&&inked(x+w-step,y,step,h);n++)w+=step;
 return {x:x-1,y:y-1,w:w+2,h:h+2};
}
 const makeRecognized=(line:RecognizedLine,c:HTMLCanvasElement)=>{
  let l={...line};
  // Compare normalized glyph silhouettes to keep scan headings and body weight close.
  if(l.ocr&&l.text.trim()){
   const k=Number(c.dataset.k),sample=document.createElement("canvas");sample.width=160;sample.height=32;const sg=sample.getContext("2d")!;sg.fillStyle="#fff";sg.fillRect(0,0,160,32);sg.drawImage(c,l.x*k,l.y*k,l.w*k,l.h*k,0,0,160,32);const actual=sg.getImageData(0,0,160,32).data;
   let best=Infinity;const glyph=document.createElement("canvas");glyph.width=1600;glyph.height=160;const gg=glyph.getContext("2d")!;
   for(const font of [line.font] as FontFamily[])for(const bold of [false,true]){
    gg.clearRect(0,0,glyph.width,160);gg.font=`${bold?"bold ":""}80px ${FONT_CSS[font]}`;const needed=Math.ceil(gg.measureText(l.text).width)+160;if(needed>glyph.width){glyph.width=needed;gg.font=`${bold?"bold ":""}80px ${FONT_CSS[font]}`;}const m=gg.measureText(l.text),left=m.actualBoundingBoxLeft||0,up=m.actualBoundingBoxAscent||60,down=m.actualBoundingBoxDescent||1;gg.fillStyle="#000";gg.fillText(l.text,left,up);
    sg.fillStyle="#fff";sg.fillRect(0,0,160,32);sg.drawImage(glyph,0,0,m.actualBoundingBoxRight+left,up+down,0,0,160,32);const candidate=sg.getImageData(0,0,160,32).data;let score=0,actualInk=0,candidateInk=0;for(let i=0;i<actual.length;i+=4){const a=actual[i]<160?1:0,b=candidate[i]<160?1:0;score+=Math.abs(a-b);actualInk+=a;candidateInk+=b;}score+=Math.abs(actualInk-candidateInk)*3;if(score<best){best=score;l={...l,font,bold};}
   }
  }
  const {bg,ink}=colorsIn(c,{x:l.x-1,y:l.y-1,w:l.w+2,h:l.h+2});
  const g=c.getContext("2d")!;
  return recognizedObject(l,uid(),bg,ink,(text,size)=>{g.font=`${l.italic?"italic ":""}${l.bold?"bold ":""}${size}px ${FONT_CSS[l.font]}`;return g.measureText(text).width;},(text,size)=>{g.font=`${l.italic?"italic ":""}${l.bold?"bold ":""}${size}px ${FONT_CSS[l.font]}`;const m=g.measureText(text);return {ascent:m.actualBoundingBoxAscent,descent:m.actualBoundingBoxDescent};});
 };

function colorsIn(c:HTMLCanvasElement,b:Box){const o=crop(c,b),d=o.getContext("2d")!.getImageData(0,0,o.width,o.height);return sampleColors(d.data,o.width,o.height);}

async function detect(lib:PdfJs,doc:PDFDocumentProxy,p:PageState):Promise<Detected>{
 const pg=await doc.getPage(p.index+1),v=pg.getViewport({scale:1,rotation:totalRot(p)});
 // Drawing commands first: this also loads the fonts, whose real names tell bold and serif apart.
 const ops=await pg.getOperatorList(),tc=await pg.getTextContent(),raw:RawTextItem[]=[];
 const realName=(id:string)=>{try{return String((pg.commonObjs.get(id) as {name?:string})?.name||id);}catch{return id;}};
 for(const it of tc.items){
  if(!("str" in it)||!it.str)continue;
  const t=lib.Util.transform(v.transform,it.transform),size=Math.hypot(t[2],t[3]);
  if(Math.abs(t[1])>size*.05||t[0]<0)continue;// horizontal text only
  const fam=tc.styles[it.fontName]?.fontFamily||"",fontName=realName(it.fontName),f=familyOf(fontName,fam).font;
  raw.push({str:it.str,x:t[4],y:t[5]-size*BASELINE[f],w:it.width,size,fontName,family:fam});
 }
 // Image positions from the drawing commands.
 const O=lib.OPS,images:(Box&{key:string})[]=[];
 let ctm=[1,0,0,1,0,0];const stack:number[][]=[];
 const mul=(a:number[],b:number[])=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 for(let i=0;i<ops.fnArray.length;i++){
  const fn=ops.fnArray[i],args=ops.argsArray[i];
  if(fn===O.save)stack.push(ctm);else if(fn===O.restore)ctm=stack.pop()||ctm;
  else if(fn===O.transform)ctm=mul(ctm,args as number[]);
  else if(fn===O.paintFormXObjectBegin){stack.push(ctm);if(Array.isArray(args?.[0])&&args[0].length===6)ctm=mul(ctm,args[0]);}
  else if(fn===O.paintFormXObjectEnd)ctm=stack.pop()||ctm;
  else if(fn===O.paintImageXObject||fn===O.paintInlineImageXObject||fn===O.paintImageMaskXObject){
   const m=mul(v.transform,ctm),pts=[[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);
   const xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]),b=normBox(Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys));
   const c={x:Math.max(0,b.x),y:Math.max(0,b.y),w:Math.min(v.width,b.x+b.w)-Math.max(0,b.x),h:Math.min(v.height,b.y+b.h)-Math.max(0,b.y)};
   if(c.w>10&&c.h>10&&c.w*c.h<v.width*v.height*.92)images.push({...c,key:`i${images.length}`});
  }
 }
 const lines=groupTextLines(raw).map(l=>({...l,garbled:isGarbled(l.text)}));
 return {lines:groupParagraphs(lines).map((l,i)=>({...l,key:`t${i}`})),images};
}

function PageView(props:PageProps){
 const {page:p,num,scale,tool,sel,editing,style,source,readOnly=false}=props;
 const wrap=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [visible,setVisible]=useState(num<=2);
 const [found,setFound]=useState<Detected|null>(null);
 const [ocrStatus,setOcrStatus]=useState(""),[ocrError,setOcrError]=useState(""),[ocrRevision,setOcrRevision]=useState(0);
 const [draft,setDraft]=useState<{kind:Tool;x1:number;y1:number;x2:number;y2:number;pts?:[number,number][]}|null>(null);
 const strokes=useRef<[number,number][][]>([]);const inkTimer=useRef(0);const [pending,setPending]=useState<[number,number][][]>([]);
 const gesture=useRef<{id:number;x:number;y:number;moved:boolean;type:string}|null>(null);
 const rot=totalRot(p);

 useEffect(()=>{const el=wrap.current;if(!el)return;const io=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVisible(true);},{rootMargin:"800px 0px"});io.observe(el);return()=>io.disconnect();},[]);
 // Render the page bitmap at screen resolution.
 useEffect(()=>{
  if(!visible||!source||!canvas.current)return;let cancelled=false,task:{cancel:()=>void;promise:Promise<void>}|null=null;
  const t=window.setTimeout(async()=>{
   const pg=await source.getPage(p.index+1);if(cancelled)return;
   const dpr=Math.min(window.devicePixelRatio||1,2.5),k=Math.min(scale*dpr,4096/Math.max(p.w,p.h));
   const off=document.createElement("canvas");task=await renderTo(pg,rot,k,off);
   try{await task.promise;}catch{return;}
   if(cancelled||!canvas.current)return;const c=canvas.current;c.width=off.width;c.height=off.height;c.getContext("2d")!.drawImage(off,0,0);
  },60);
  return()=>{cancelled=true;clearTimeout(t);task?.cancel();};
 },[visible,source,p.index,rot,scale,p.w,p.h]);
 useEffect(()=>{
  if(readOnly||!visible||!source||!p.src)return;let alive=true;const key=`${p.src}:${p.index}:${rot}`;
  if(!analysis.has(key))analysis.set(key,loadPdfJs().then(lib=>detect(lib,source,p)).catch(e=>{console.error("PDF analysis failed",e);return {lines:[],images:[]};}));
  setFound(null);setOcrError("");
  analysis.get(key)!.then(async d=>{
   if(!alive)return;
   setFound(d);
   if(d.lines.length&&!d.lines.every(l=>l.garbled))return;
   setOcrStatus("Reading scanned text…");
   if(!scanAnalysis.has(key))scanAnalysis.set(key,(async()=>{const c=await getHiRes(source,p);return recognizeScan(c,Number(c.dataset.k),message=>{if(alive)setOcrStatus(message);});})());
   try{const lines=await scanAnalysis.get(key)!;if(alive){setFound({lines,images:d.images});setOcrStatus("");if(!lines.length)setOcrError("No readable text found. Try a clearer scan, or use Replace to retype a region.");}}
   catch{scanAnalysis.delete(key);if(alive){setOcrStatus("");setOcrError("Text recognition failed. Retry, or use Replace to retype a region.");}}
  });return()=>{alive=false;};
 },[visible,source,p.src,p.index,rot,ocrRevision,readOnly]);// eslint-disable-line react-hooks/exhaustive-deps

 const pt=(e:{clientX:number;clientY:number})=>{const r=wrap.current!.getBoundingClientRect();return [(e.clientX-r.left)/scale,(e.clientY-r.top)/scale] as [number,number];};
 const hitObj=(x:number,y:number)=>{
  for(let i=p.objects.length-1;i>=0;i--){const o=p.objects[i];
   if(isLine(o)){const dx=o.x2-o.x1,dy=o.y2-o.y1,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-o.x1)*dx+(y-o.y1)*dy)/l));if(Math.hypot(x-(o.x1+t*dx),y-(o.y1+t*dy))<Math.max(8,o.strokeWidth)/Math.min(scale,1.5))return o;}
   else if(contains(boxOf(o),x,y,4/scale))return o;}
  return null;
 };

 const rebuildText=async()=>{
  if(!source||!found)return;
  const c=await getHiRes(source,p),pixels=c.getContext("2d")!.getImageData(0,0,c.width,c.height).data,k=Number(c.dataset.k);
  const candidates=found.lines.filter(l=>l.ocr&&!p.hidden.includes(l.key)),pending=candidates.filter(l=>safeToRebuild(l,pixels,c.width,c.height,k));
  const objects:EditorObj[]=pending.map(l=>makeRecognized(l,c));
  const rules=p.hidden.includes("rules")?[]:detectRules(pixels,c.width,c.height,k);objects.unshift(...rules);
  if(!objects.length){props.flash("No safe text or table grid to rebuild. Artwork kept unchanged; use individual text editing if needed.");return;}
  props.commit(ps=>ps.map(page=>page.id!==p.id?page:{...page,objects:[...page.objects,...objects],hidden:[...page.hidden,"rules",...pending.map(l=>l.key)]}));
  props.flash(pending.length<candidates.length?"Readable text and table grids rebuilt. Artwork and uncertain text kept unchanged.":"Text and table grids rebuilt. Review recognition before saving.");
 };
 const editLine=async(l:RecognizedLine)=>{
  if(l.ocr&&source){const o=makeRecognized(l,await getHiRes(source,p));o.originalStyle=textFingerprint(o);props.addObj(p.id,o,l.key);props.setEditing(o.id);return;}

  if(!source)return;const c=await getHiRes(source,p),s=l.size,first=l.y+s*BASELINE[l.font],lastBase=l.y+l.h-s*LINE_HEIGHT+s*BASELINE[l.font];
  const cover={x:l.x-1.5,y:first-s*.95,w:l.w+3,h:lastBase-first+s*1.22};
  const {bg,ink}=colorsIn(c,{x:cover.x-1,y:cover.y-1,w:cover.w+2,h:cover.h+2});
  // Text that could not be read (no character map) is cleared for retyping instead of shown as symbols.
  const o:TextObj={id:uid(),kind:"text",text:l.garbled?"":l.text,x:l.x,y:first-s*baselineOf(l.font,l.lh),w:Math.max(l.w+s*.6,30),h:l.h,size:+s.toFixed(2),font:l.font,bold:l.bold,italic:l.italic,color:ink,align:l.align||"left",lh:l.lh,cover:{...cover,color:bg}};
  if(!l.garbled)o.originalStyle=textFingerprint(o);
  if(l.garbled)props.flash("This text uses a font that cannot be read — type the new words");
  props.addObj(p.id,o,l.key);props.setEditing(o.id);
 };
 // Replace: cover the dragged area with the page colour and type over it, in the colour that was there.
 const replaceArea=async(b:Box)=>{
  let bg="#ffffff",ink=style.color;
  if(source){const c=await getHiRes(source,p);bg=colorsIn(c,{x:b.x-1,y:b.y-1,w:b.w+2,h:b.h+2}).bg;b=fitToInk(c,b,bg);ink=colorsIn(c,b).ink;}
  const size=Math.max(6,Math.min(72,+(b.h*.72).toFixed(1)));
  const o:TextObj={id:uid(),kind:"text",text:"",x:b.x,y:b.y+(b.h-size*LINE_HEIGHT)/2,w:Math.max(b.w,30),h:size*LINE_HEIGHT,size,font:"sans",bold:false,italic:false,color:ink,align:"left",cover:{...b,color:bg}};
  props.addObj(p.id,o);props.setEditing(o.id);props.setTool("edit");
 };
 const liftArea=async(b:Box,hide?:string)=>{
  if(b.w<4||b.h<4)return;
  let src="";let bg="#ffffff";
  if(source){const c=await getHiRes(source,p);src=crop(c,b).toDataURL("image/png");bg=colorsIn(c,{x:b.x-2,y:b.y-2,w:b.w+4,h:b.h+4}).bg;}
  else return;
  props.addObj(p.id,{id:uid(),kind:"image",src,x:b.x,y:b.y,w:b.w,h:b.h,cover:{x:b.x-1.5,y:b.y-1.5,w:b.w+3,h:b.h+3,color:bg}},hide);props.setTool("edit");
 };

 const down=(e:RPointerEvent<HTMLDivElement>)=>{
  if(readOnly)return;
  props.onActive();
  if(e.button>0)return;
  const [x,y]=pt(e);
  if(editing)return;// the open text box closes on blur
  if(tool==="edit"){
   gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,type:e.pointerType};
   // A mouse can grab and drag straight away; touch taps first so the page still scrolls.
   if(e.pointerType==="mouse"){const o=hitObj(x,y);if(o){props.setSel({page:p.id,obj:o.id});startMove(e,o);gesture.current=null;}}
   return;
  }
  e.preventDefault();(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  if(tool==="text"){
   const o:TextObj={id:uid(),kind:"text",text:"",x:Math.min(x,p.w-40),y:Math.max(0,y-style.textSize*.6),w:Math.min(200,p.w-x),h:style.textSize*LINE_HEIGHT,size:style.textSize,font:style.font,bold:false,italic:false,color:style.color,align:"left"};
   props.addObj(p.id,o);props.setEditing(o.id);props.setTool("edit");return;
  }
  clearTimeout(inkTimer.current);
  setDraft({kind:tool,x1:x,y1:y,x2:x,y2:y,pts:tool==="draw"?[[x,y]]:undefined});
 };
 const move=(e:RPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;if(g&&g.id===e.pointerId&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>8)g.moved=true;
  if(!draft)return;const [x,y]=pt(e);
  setDraft(d=>d&&{...d,x2:x,y2:y,pts:d.pts?[...d.pts,[x,y]]:undefined});
 };
 const up=(e:RPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;gesture.current=null;
  if(g&&!g.moved&&tool==="edit"){
   const [x,y]=pt(e),o=hitObj(x,y);
   if(o){if(sel?.obj===o.id&&o.kind==="text")props.setEditing(o.id);else props.setSel({page:p.id,obj:o.id});return;}
   const line=found?.lines.find(l=>!p.hidden.includes(l.key)&&contains(l,x,y,2));
   if(line){void editLine(line);return;}
   const img=found&&[...found.images].reverse().find(b=>!p.hidden.includes(b.key)&&contains(b,x,y));
   if(img){void liftArea(img,img.key);return;}
   props.setSel(null);return;
  }
  if(!draft)return;const d=draft;setDraft(null);
  const b=normBox(d.x1,d.y1,d.x2,d.y2),tap=b.w<3&&b.h<3;
  const id=uid();
  if(d.kind==="draw"&&d.pts){
   // Strokes drawn in quick succession become one drawing (handy for signatures and words).
   strokes.current=[...strokes.current,d.pts];setPending(strokes.current);
   inkTimer.current=window.setTimeout(()=>{const s=strokes.current;strokes.current=[];setPending([]);if(!s.length)return;const fit=inkFromStrokes(s,style.pen/2);props.addObj(p.id,{id,kind:"ink",...fit,stroke:style.color,strokeWidth:style.pen});props.setSel(null);},700);
   return;
  }
  if(d.kind==="highlight"){if(tap)return;props.addObj(p.id,{id,kind:"rect",...b,h:Math.max(b.h,6),stroke:"none",fill:style.hl,strokeWidth:0,fillOpacity:.38,opacity:1});return;}
  if(d.kind==="whiteout"){if(tap)return;void (async()=>{let bg="#ffffff";let box=b;if(source){const c=await getHiRes(source,p);bg=colorsIn(c,{x:b.x-2,y:b.y-2,w:b.w+4,h:b.h+4}).bg;box=fitToInk(c,b,bg);}props.addObj(p.id,{id,kind:"rect",...box,cover:{...box,color:bg},stroke:"none",fill:bg,strokeWidth:0,fillOpacity:1});})();return;}
  if(d.kind==="area"){void liftArea(b);return;}
  if(d.kind==="replace"){if(b.w<4||b.h<4)return;void replaceArea(b);return;}
  if(d.kind==="rect"||d.kind==="ellipse"){const bb=tap?{x:d.x1-40,y:d.y1-28,w:80,h:56}:b;props.addObj(p.id,{id,kind:d.kind,...bb,stroke:style.stroke,fill:style.fill,strokeWidth:style.shapeWidth,fillOpacity:style.fill==="none"?0:1});}
  if((d.kind==="line"||d.kind==="arrow")){const l=tap?{x1:d.x1-40,y1:d.y1,x2:d.x1+40,y2:d.y1}:{x1:d.x1,y1:d.y1,x2:d.x2,y2:d.y2};props.addObj(p.id,{id,kind:d.kind,...l,stroke:style.stroke,strokeWidth:style.shapeWidth});}
 };

 // Move and resize of the selected object.
 const startMove=(e:RPointerEvent,o:EditorObj,handle?:string)=>{
  e.preventDefault();e.stopPropagation();
  const base=props.getPages(),[sx,sy]=pt(e),orig=o;let changed=false;
  const mv=(ev:PointerEvent)=>{
   const [x,y]=pt(ev),dx=x-sx,dy=y-sy;if(!changed&&Math.hypot(dx,dy)*scale<2)return;changed=true;
   props.updateObj(p.id,o.id,()=>{
    if(!handle)return moveObj(orig,dx,dy);
    if(isLine(orig))return handle==="p1"?{...orig,x1:orig.x1+dx,y1:orig.y1+dy}:{...orig,x2:orig.x2+dx,y2:orig.y2+dy};
    const nb=resizeBox(boxOf(orig),handle,dx,dy,8,orig.kind==="image"&&!ev.shiftKey||orig.kind==="ink");
    if(orig.kind==="text")return {...orig,x:nb.x,w:nb.w};
    return {...orig,...nb} as EditorObj;
   },true);
  };
  const end=()=>{window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",end);window.removeEventListener("pointercancel",end);
   if(changed){const now=props.getPages();props.commit(()=>now,base);}};
  window.addEventListener("pointermove",mv);window.addEventListener("pointerup",end);window.addEventListener("pointercancel",end);
 };

 const selObj=sel?.page===p.id?p.objects.find(o=>o.id===sel.obj):undefined;
 const drawing=tool!=="edit";
 return <Localized as="section" className="pdfe-page-wrap" data-page={p.id}>
  {!readOnly&&p.src&&tool==="edit"&&found&&!found.lines.some(l=>l.ocr)&&!ocrStatus&&!p.hidden.includes("rules")&&<Localized as="div" className="pdfe-scan-note"><Localized as="button" onClick={()=>void rebuildText()}>Make table lines editable</Localized></Localized>}
  {!readOnly&&p.src&&tool==="edit"&&(ocrStatus||ocrError||found?.lines.some(l=>l.ocr))&&<Localized as="div" className="pdfe-scan-note" role="status"><ScanText/><Localized as="span">{ocrStatus||ocrError||"Text recognized — tap any words to edit. Check spelling and numbers before saving."}</Localized>{ocrError?<><Localized as="button" onClick={()=>setOcrRevision(n=>n+1)}>Retry</Localized><Localized as="button" onClick={()=>props.setTool("replace")}>Replace manually</Localized></>:!ocrStatus&&found?.lines.some(l=>l.ocr&&!p.hidden.includes(l.key))?<Localized as="button" onClick={()=>void rebuildText()}>Rebuild text & tables</Localized>:null}</Localized>}
  <Localized as="div" ref={wrap} className={`pdfe-page${drawing?" drawing":""}`} style={{width:p.w*scale,height:p.h*scale}}
   onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{gesture.current=null;setDraft(null);}}>
   {p.src?<canvas ref={canvas} className="pdfe-canvas" aria-label={`Page ${num}`}/>:<div className="pdfe-canvas blank" aria-label={`Page ${num}, blank`}/>}
   <Localized as="div" className="pdfe-layer" style={{width:p.w,height:p.h,transform:`scale(${scale})`}}>
    {!readOnly&&tool==="edit"&&found&&<>{found.images.filter(b=>!p.hidden.includes(b.key)).map(b=><i key={b.key} className="pdfe-target img" style={{left:b.x,top:b.y,width:b.w,height:b.h}}/>)}
     {found.lines.filter(l=>!p.hidden.includes(l.key)).map(l=><i key={l.key} className="pdfe-target" style={{left:l.x-1,top:l.y,width:l.w+2,height:l.h}}/>)}</>}
    {p.objects.map(o=>o.cover&&!untouchedText(o)&&<i key={"c"+o.id} className="pdfe-cover" style={{left:o.cover.x,top:o.cover.y,width:o.cover.w,height:o.cover.h,background:o.cover.color}}/>)}
    {p.objects.map(o=><ObjView key={o.id} o={o} editing={editing===o.id} pageW={p.w}
     onText={(text,h)=>props.updateObj(p.id,o.id,x=>{if(x.kind!=="text")return x;const g=document.createElement("canvas").getContext("2d")!;g.font=`${x.bold?"bold ":""}${x.size}px ${customFontCss(x)}`;const width=Math.max(...text.split("\n").map(t=>g.measureText(t).width))+2;const original=x.originalStyle?JSON.parse(x.originalStyle):null;return {...x,text,h,w:original&&text===original[0]?original[3]:Math.min(p.w-x.x,Math.max(x.w,width))};},true)}
     onMeasure={h=>props.updateObj(p.id,o.id,x=>({...x,h}) as EditorObj,true)}
     onDone={()=>props.finishEdit(p.id,o.id)}/>)}
    {draft&&<DraftView d={draft} style={style}/>}
    {pending.length>0&&<svg className="pdfe-svg" width={p.w} height={p.h}><path d={pending.map(s=>s.map(([x,y],i)=>`${i?"L":"M"}${x} ${y}`).join(" ")).join(" ")} stroke={style.color} strokeWidth={style.pen} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    {selObj&&!editing&&<Frame o={selObj} scale={scale} onStart={(e,h)=>startMove(e,selObj,h)} onTap={()=>{if(selObj.kind==="text")props.setEditing(selObj.id);}}/>}
   </Localized>
  </Localized>

  <Localized as="span" className="pdfe-page-num">{num}</Localized>
 </Localized>;
}

function ObjView({o,editing,pageW,onText,onDone,onMeasure}:{o:EditorObj;editing:boolean;pageW:number;onText:(t:string,h:number)=>void;onDone:()=>void;onMeasure:(h:number)=>void}){
 const ta=useRef<HTMLTextAreaElement>(null),div=useRef<HTMLDivElement>(null);
 // Keep the stored height in step with the rendered text (size, font and width changes).
 useLayoutEffect(()=>{const el=div.current;if(el&&o.kind==="text"&&Math.abs(el.offsetHeight-o.h)>.5)onMeasure(el.offsetHeight);});
 useEffect(()=>{if(editing&&ta.current){const t=ta.current;t.style.height="0";t.style.height=t.scrollHeight+"px";t.focus({preventScroll:true});t.setSelectionRange(t.value.length,t.value.length);t.scrollIntoView({block:"nearest"});}},[editing]);
 const op=o.opacity??1;
 if(o.kind==="text"){
  const css={left:o.x,top:o.y,width:o.w,fontSize:o.size,fontFamily:customFontCss(o),fontWeight:o.bold?700:400,fontStyle:o.italic?"italic":"normal",color:untouchedText(o)?"transparent":o.color,textAlign:o.align,lineHeight:o.lh??LINE_HEIGHT,background:o.bg||"transparent",opacity:op} as const;
  if(editing)return <Localized as="textarea" ref={ta} translate="no" className="pdfe-text editing" style={{...css,minHeight:o.size*LINE_HEIGHT,maxWidth:pageW-o.x}} value={o.text} placeholder="Type here" rows={1}
   onChange={e=>{const t=e.currentTarget;t.style.height="0";const h=t.scrollHeight;t.style.height=h+"px";onText(t.value,h);}}
   onBlur={onDone} onKeyDown={e=>{if(e.key==="Escape")(e.target as HTMLTextAreaElement).blur();}} onPointerDown={e=>e.stopPropagation()}/>;
  return <Localized as="div" ref={div} translate="no" className="pdfe-text" style={css} dir="auto">{o.text||" "}</Localized>;
 }
 if(o.kind==="image")return <img className="pdfe-img" src={o.src} alt="" draggable={false} style={{left:o.x,top:o.y,width:o.w,height:o.h,opacity:op}}/>;
 return <svg className="pdfe-svg" style={{opacity:op}}><ShapeSvg o={o}/></svg>;
}
function ShapeSvg({o}:{o:ShapeObj|LineObj|InkObj}){
 if(o.kind==="rect")return <rect x={o.x} y={o.y} width={o.w} height={o.h} fill={o.fill==="none"?"none":o.fill} fillOpacity={o.fillOpacity} stroke={o.stroke==="none"?"none":o.stroke} strokeWidth={o.strokeWidth}/>;
 if(o.kind==="ellipse")return <ellipse cx={o.x+o.w/2} cy={o.y+o.h/2} rx={o.w/2} ry={o.h/2} fill={o.fill==="none"?"none":o.fill} fillOpacity={o.fillOpacity} stroke={o.stroke==="none"?"none":o.stroke} strokeWidth={o.strokeWidth}/>;
 if(o.kind==="ink")return <path d={inkPath(o)} fill="none" stroke={o.stroke} strokeWidth={o.strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>;
 const l=o as LineObj;
 const [a,b]=arrowHead(l.x1,l.y1,l.x2,l.y2,Math.max(8,o.strokeWidth*4));
 return <g stroke={o.stroke} strokeWidth={o.strokeWidth} strokeLinecap="round" fill="none"><line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}/>{l.kind==="arrow"&&<path d={`M${a[0]} ${a[1]} L${l.x2} ${l.y2} L${b[0]} ${b[1]}`}/>}</g>;
}
function DraftView({d,style}:{d:{kind:Tool;x1:number;y1:number;x2:number;y2:number;pts?:[number,number][]};style:Style}){
 const b=normBox(d.x1,d.y1,d.x2,d.y2);
 if(d.kind==="area"||d.kind==="replace")return <i className="pdfe-marquee" style={{left:b.x,top:b.y,width:b.w,height:b.h}}/>;
 return <svg className="pdfe-svg">
  {d.kind==="draw"&&d.pts&&<path d={d.pts.map(([x,y],i)=>`${i?"L":"M"}${x} ${y}`).join(" ")} stroke={style.color} strokeWidth={style.pen} fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
  {d.kind==="highlight"&&<rect {...{x:b.x,y:b.y,width:b.w,height:b.h}} fill={style.hl} fillOpacity={.38}/>}
  {d.kind==="whiteout"&&<rect {...{x:b.x,y:b.y,width:b.w,height:b.h}} fill="#fff" stroke="#0f5a70" strokeDasharray="4 3" strokeWidth={1}/>}
  {(d.kind==="rect"||d.kind==="ellipse")&&<ShapeSvg o={{id:"",kind:d.kind,...b,stroke:style.stroke,fill:style.fill,strokeWidth:style.shapeWidth,fillOpacity:style.fill==="none"?0:1}}/>}
  {((d.kind==="line"||d.kind==="arrow"))&&<ShapeSvg o={{id:"",kind:d.kind,x1:d.x1,y1:d.y1,x2:d.x2,y2:d.y2,stroke:style.stroke,strokeWidth:style.shapeWidth}}/>}
 </svg>;
}

function Frame({o,scale,onStart,onTap}:{o:EditorObj;scale:number;onStart:(e:RPointerEvent,h?:string)=>void;onTap:()=>void}){
 const start=useRef<{x:number;y:number}|null>(null);
 const inv=1/scale,b=boxOf(o),hs=22*inv;
 const handle=(h:string,x:number,y:number)=><Localized as="span" key={h} className={`pdfe-handle h-${h}`} style={{left:x-hs/2,top:y-hs/2,width:hs,height:hs,["--inv" as string]:inv}} onPointerDown={e=>onStart(e,h)}/>;
 if(isLine(o))return <>
  <i className="pdfe-frame line" style={{left:b.x-6*inv,top:b.y-6*inv,width:b.w+12*inv,height:b.h+12*inv,borderWidth:1.5*inv}} onPointerDown={e=>onStart(e)}/>
  {handle("p1",o.x1,o.y1)}{handle("p2",o.x2,o.y2)}</>;
 const pad=3*inv,hList=o.kind==="text"?["w","e"]:["nw","ne","sw","se",...(o.kind==="image"||o.kind==="ink"?[]:["n","s","w","e"])];
 const pos:Record<string,[number,number]>={nw:[b.x-pad,b.y-pad],ne:[b.x+b.w+pad,b.y-pad],sw:[b.x-pad,b.y+b.h+pad],se:[b.x+b.w+pad,b.y+b.h+pad],n:[b.x+b.w/2,b.y-pad],s:[b.x+b.w/2,b.y+b.h+pad],w:[b.x-pad,b.y+b.h/2],e:[b.x+b.w+pad,b.y+b.h/2]};
 return <>
  <i className="pdfe-frame" style={{left:b.x-pad,top:b.y-pad,width:b.w+pad*2,height:b.h+pad*2,borderWidth:1.5*inv,borderRadius:3*inv}}
   onPointerDown={e=>{start.current={x:e.clientX,y:e.clientY};onStart(e);}}
   onPointerUp={e=>{const st=start.current;if(st&&Math.hypot(e.clientX-st.x,e.clientY-st.y)<4)onTap();start.current=null;}}/>
  {hList.map(h=>handle(h,...pos[h]))}
 </>;
}

/* ───────────────────────── Panels ───────────────────────── */

function Swatches({value,onChange,colors=SWATCHES,none}:{value:string;onChange:(c:string)=>void;colors?:string[];none?:boolean}){
 return <Localized as="div" className="pdfe-swatches">
  {none&&<button className={`sw none${value==="none"?" on":""}`} onClick={()=>onChange("none")} aria-label="No colour"/>}
  {colors.map(c=><button key={c} className={`sw${value.toLowerCase()===c?" on":""}`} style={{background:c}} onClick={()=>onChange(c)} aria-label={`Colour ${c}`}/>)}
  <Localized as="label" className="sw custom" aria-label="Custom colour"><Localized as="input" type="color" value={value==="none"?"#000000":value} onChange={e=>onChange(e.target.value)}/></Localized>
 </Localized>;
}
function Stepper({value,set,min,max,step=1,label,suffix=""}:{value:number;set:(n:number)=>void;min:number;max:number;step?:number;label:string;suffix?:string}){
 return <Localized as="div" className="pdfe-stepper" aria-label={label}><Localized as="button" onClick={()=>set(Math.max(min,+(value-step).toFixed(1)))} aria-label={`Smaller ${label}`}><Minus/></Localized><Localized as="span">{Math.round(value*10)/10}{suffix}</Localized><Localized as="button" onClick={()=>set(Math.min(max,+(value+step).toFixed(1)))} aria-label={`Larger ${label}`}><Plus/></Localized></Localized>;
}

function ToolOptions({tool,style,setStyle}:{tool:Tool;style:Style;setStyle:(f:(s:Style)=>Style)=>void}){
 const s=(patch:Partial<Style>)=>setStyle(x=>({...x,...patch}));
 return <Localized as="div" className="pdfe-props compact" role="toolbar" aria-label="Tool options">
  {(tool==="draw"||tool==="text")&&<Swatches value={style.color} onChange={c=>s({color:c})}/>}
  {tool==="draw"&&<Stepper label="pen size" value={style.pen} set={n=>s({pen:n})} min={1} max={20}/>}
  {tool==="text"&&<Stepper label="text size" value={style.textSize} set={n=>s({textSize:n})} min={6} max={96} suffix="pt"/>}
  {tool==="highlight"&&<Swatches value={style.hl} onChange={c=>s({hl:c})} colors={HIGHLIGHTS}/>}
  {(tool==="rect"||tool==="ellipse"||tool==="line"||tool==="arrow")&&<><Swatches value={style.stroke} onChange={c=>s({stroke:c})}/><Stepper label="line width" value={style.shapeWidth} set={n=>s({shapeWidth:n})} min={0.5} max={16} step={0.5}/></>}
  {(tool==="rect"||tool==="ellipse")&&<Localized as="label" className="pdfe-check"><Localized as="input" type="checkbox" checked={style.fill!=="none"} onChange={e=>s({fill:e.target.checked?"#fde047":"none"})}/>Fill</Localized>}
  {tool==="whiteout"&&<Localized as="span" className="pdfe-note">Covers with the page’s own background colour.</Localized>}
 </Localized>;
}

function Props({obj:o,matchOriginal,pageWidth,pageHeight,update,remove,duplicate,layer,edit,close}:{obj:EditorObj;matchOriginal:()=>Promise<void>;pageWidth:number;pageHeight:number;update:(fn:(o:EditorObj)=>EditorObj,live?:boolean)=>void;remove:()=>void;duplicate:()=>void;layer:(d:number)=>void;edit:()=>void;close:()=>void}){
 const [importedFonts,setImportedFonts]=useState<{id:string;name:string}[]>([]),[fontError,setFontError]=useState("");
 const importFont=useRef<HTMLInputElement>(null);
 const set=(patch:Partial<EditorObj>)=>update(x=>{const next={...x,...patch} as EditorObj;if(next.kind==="text"&&!next.text.includes("\n")&&("font" in patch||"customFont" in patch||"bold" in patch||"italic" in patch)){const g=document.createElement("canvas").getContext("2d")!;g.font=`${next.italic?"italic ":""}${next.bold?"bold ":""}${next.size}px ${customFontCss(next)}`;next.w=Math.min(pageWidth-next.x,Math.max(next.w,g.measureText(next.text).width+2));}return next;});
 const opacity=Math.round((o.opacity??1)*100);
 const bounds=boxOf(o);
 return <Localized as="div" className="pdfe-props" role="toolbar" aria-label="Selected item">
  <Localized as="div" className="pdfe-props-row">
   {o.kind==="text"&&<>
    <Localized as="button" className="pdfe-chip strong" onClick={edit}><Type/>Edit text</Localized>{o.cover&&<Localized as="button" className="pdfe-chip" onClick={()=>void matchOriginal()}>Match original style</Localized>}
    <Localized as="select" className="pdfe-select" value={o.customFont||o.font} onChange={async e=>{const id=e.target.value;setFontError("");try{if(["sans","serif","mono"].includes(id))set({font:id as FontFamily,customFont:undefined});else{await loadEditorFont(id);set({customFont:id,bold:false,italic:false});}}catch{setFontError("Could not load that font. Try another font.");}}} aria-label="Font"><Localized as="option" value="sans">Helvetica / Sans</Localized><Localized as="option" value="serif">Times / Serif</Localized><Localized as="option" value="mono">Courier / Mono</Localized>{[...EXTRA_FONTS,...importedFonts,...(o.customFont&&![...EXTRA_FONTS,...importedFonts].some(f=>f.id===o.customFont)?[{id:o.customFont,name:"Imported font"}]:[])].map(f=><Localized as="option" key={f.id} value={f.id}>{f.name}</Localized>)}</Localized>
    <Localized as="button" className="pdfe-chip" onClick={()=>importFont.current?.click()}>Import font</Localized><Localized as="input" ref={importFont} type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={async e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;try{if(file.size>20000000)throw Error("too large");const id=uid();await registerEditorFont(id,file.name,new Uint8Array(await file.arrayBuffer()));setImportedFonts(f=>[...f,{id,name:file.name}]);set({customFont:id,bold:false,italic:false});setFontError("");}catch{setFontError("Font could not be imported. Try a TTF or OTF file under 20 MB.");}}}/>{fontError&&<Localized as="span" role="alert">{fontError}</Localized>}
    <Stepper label="text size" value={o.size} set={n=>set({size:n,h:Math.max(o.h,n*LINE_HEIGHT)})} min={4} max={144} suffix="pt"/>
    <Localized as="button" className={`pdfe-tog${o.bold?" on":""}`} disabled={Boolean(o.customFont)} title={o.customFont?"Choose a bold font variant from the font list":undefined} onClick={()=>set({bold:!o.bold})} aria-pressed={o.bold} aria-label="Bold"><Bold/></Localized>
    <Localized as="button" className={`pdfe-tog${o.italic?" on":""}`} disabled={Boolean(o.customFont)} title={o.customFont?"Choose an italic font variant from the font list":undefined} onClick={()=>set({italic:!o.italic})} aria-pressed={o.italic} aria-label="Italic"><Italic/></Localized>
    <Localized as="span" className="pdfe-seg">{(["left","center","right"] as const).map(a=><Localized as="button" key={a} className={o.align===a?"on":""} onClick={()=>set({align:a})} aria-label={`Align ${a}`}>{a==="left"?<AlignLeft/>:a==="center"?<AlignCenter/>:<AlignRight/>}</Localized>)}</Localized>
   </>}
   <Localized as="span" className="pdfe-spacer"/>
   <Localized as="button" className="pdfe-tog" onClick={()=>layer(1)} aria-label="Bring to front" title="Bring to front"><BringToFront/></Localized>
   <Localized as="button" className="pdfe-tog" onClick={()=>layer(-1)} aria-label="Send to back" title="Send to back"><SendToBack/></Localized>
   <Localized as="button" className="pdfe-tog" onClick={duplicate} aria-label="Duplicate" title="Duplicate"><Copy/></Localized>
   <Localized as="button" className="pdfe-tog danger" onClick={remove} aria-label="Delete" title="Delete"><Trash2/></Localized>
   <Localized as="button" className="pdfe-tog" onClick={close} aria-label="Done" title="Done"><Check/></Localized>
  </Localized>
  <Localized as="div" className="pdfe-props-row">
   <Localized as="label">X <Localized as="input" aria-label="Position X" type="number" style={{width:70}} value={Math.round(bounds.x)} onChange={e=>update(x=>moveObj(x,+e.target.value-bounds.x,0))}/></Localized>
   <Localized as="label">Y <Localized as="input" aria-label="Position Y" type="number" style={{width:70}} value={Math.round(bounds.y)} onChange={e=>update(x=>moveObj(x,0,+e.target.value-bounds.y))}/></Localized>
   <Localized as="select" aria-label="Align on page" value="" onChange={e=>{const a=e.target.value;update(x=>moveObj(x,a==="left"?-bounds.x:a==="center"?(pageWidth-bounds.w)/2-bounds.x:a==="right"?pageWidth-bounds.w-bounds.x:0,a==="top"?-bounds.y:a==="middle"?(pageHeight-bounds.h)/2-bounds.y:a==="bottom"?pageHeight-bounds.h-bounds.y:0));}}><Localized as="option" value="">Align on page…</Localized>{["left","center","right","top","middle","bottom"].map(a=><Localized as="option" key={a}>{a}</Localized>)}</Localized>
   {o.kind==="text"&&<Stepper label="line spacing" value={o.lh||LINE_HEIGHT} set={n=>set({lh:n})} min={.8} max={3} step={.1}/>}
   {o.kind==="image"&&<Localized as="button" onClick={async()=>{const img=await loadImg(o.src),c=document.createElement("canvas");c.width=img.width;c.height=img.height;const g=c.getContext("2d")!;g.drawImage(img,0,0);const d=g.getImageData(0,0,c.width,c.height);d.data.set(removePaper(d.data));g.putImageData(d,0,0);set({src:c.toDataURL("image/png")});}}>Remove background</Localized>}
  </Localized>
  <Localized as="div" className="pdfe-props-row">
   {o.kind==="text"&&<Swatches value={o.color} onChange={c=>set({color:c})}/>}
   {(o.kind==="rect"||o.kind==="ellipse")&&<><Localized as="span" className="pdfe-lbl">Fill</Localized><Swatches none value={o.fill} onChange={c=>set({fill:c,fillOpacity:c==="none"?0:o.fillOpacity||1})} colors={[...HIGHLIGHTS.slice(0,2),...SWATCHES.slice(0,6)]}/><Localized as="span" className="pdfe-lbl">Line</Localized><Swatches none value={o.stroke} onChange={c=>set({stroke:c,strokeWidth:c!=="none"&&!o.strokeWidth?2:o.strokeWidth})} colors={SWATCHES.slice(0,6)}/><Stepper label="line width" value={o.strokeWidth} set={n=>set({strokeWidth:n})} min={0} max={16} step={0.5}/></>}
   {(isLine(o)||o.kind==="ink")&&<><Swatches value={o.stroke} onChange={c=>set({stroke:c})}/><Stepper label="line width" value={o.strokeWidth} set={n=>set({strokeWidth:n})} min={0.5} max={20} step={0.5}/></>}
   {o.kind==="image"&&o.cover&&<Localized as="span" className="pdfe-note">Moved from the page — the original spot is covered.</Localized>}
   <Localized as="label" className="pdfe-range"><Localized as="span">Opacity</Localized><Localized as="input" type="range" min={10} max={100} value={opacity} onChange={e=>update(x=>({...x,opacity:+e.target.value/100}),true)} onPointerUp={()=>update(x=>x)}/><Localized as="b">{opacity}%</Localized></Localized>
  </Localized>
 </Localized>;
}

function Thumb({page,doc}:{page:PageState;doc?:PDFDocumentProxy}){
 const c=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(!doc||!c.current)return;let task:{cancel:()=>void}|null=null;let off=false;
  (async()=>{const pg=await doc.getPage(page.index+1);if(off||!c.current)return;const t=await renderTo(pg,totalRot(page),120/Math.max(page.w,page.h)*1.5,c.current);task=t;t.promise.catch(()=>{});})();
  return()=>{off=true;task?.cancel();};},[doc,page.index,page.rotation,page.baseRotation,page.w,page.h]);// eslint-disable-line react-hooks/exhaustive-deps
 return doc?<canvas ref={c}/>:<Localized as="span" className="blank"/>;
}
function PagesPanel({pages,docs,active,close,goTo,rotate,remove,duplicate,move,blank,merge}:{pages:PageState[];docs:Map<string,PDFDocumentProxy>;active:string;close:()=>void;goTo:(id:string)=>void;rotate:(id:string)=>void;remove:(id:string)=>void;duplicate:(id:string)=>void;move:(id:string,d:number)=>void;blank:()=>void;merge:()=>void}){
 return <Localized as="aside" className="pdfe-pages" aria-label="Pages">
  <Localized as="header"><Localized as="b">Pages</Localized><Localized as="button" className="pdfe-icon-btn" onClick={close} aria-label="Close pages"><X/></Localized></Localized>
  <Localized as="ol">{pages.map((p,i)=><Localized as="li" key={p.id} className={active===p.id?"on":""}>
   <Localized as="button" className="pdfe-thumb" onClick={()=>goTo(p.id)} aria-label={`Go to page ${i+1}`}><Thumb page={p} doc={p.src?docs.get(p.src):undefined}/>{p.objects.length>0&&<Localized as="em">{p.objects.length} edit{p.objects.length===1?"":"s"}</Localized>}</Localized>
   <Localized as="div" className="pdfe-thumb-tools"><Localized as="b">{i+1}</Localized>
    <Localized as="button" onClick={()=>move(p.id,-1)} disabled={i===0} aria-label="Move up"><ChevronUp/></Localized>
    <Localized as="button" onClick={()=>move(p.id,1)} disabled={i===pages.length-1} aria-label="Move down"><ChevronDown/></Localized>
    <Localized as="button" onClick={()=>rotate(p.id)} aria-label="Rotate"><RotateCw/></Localized>
    <Localized as="button" onClick={()=>duplicate(p.id)} aria-label="Duplicate page"><Copy/></Localized>
    <Localized as="button" className="danger" onClick={()=>remove(p.id)} aria-label="Delete page"><Trash2/></Localized>
   </Localized></Localized>)}</Localized>
  <Localized as="footer"><Localized as="button" className="pdfe-ghost" onClick={blank}><FilePlus2/>Blank page</Localized><Localized as="button" className="pdfe-ghost" onClick={merge}><FileUp/>From PDF</Localized></Localized>
 </Localized>;
}

function SignaturePad({close,place}:{close:()=>void;place:(src:string)=>void}){
 const c=useRef<HTMLCanvasElement>(null),strokes=useRef<[number,number][][]>([]);
 const [color,setColor]=useState("#102a33"),[has,setHas]=useState(false),[typed,setTyped]=useState(""),[mode,setMode]=useState<"draw"|"type">("draw");
 const redraw=useCallback(()=>{const cv=c.current;if(!cv)return;const g=cv.getContext("2d")!,k=cv.width/cv.clientWidth;g.clearRect(0,0,cv.width,cv.height);g.strokeStyle=color;g.lineWidth=2.6*k;g.lineCap="round";g.lineJoin="round";
  for(const s of strokes.current){g.beginPath();s.forEach(([x,y],i)=>i?g.lineTo(x*k,y*k):g.moveTo(x*k,y*k));if(s.length===1)g.lineTo(s[0][0]*k+.1,s[0][1]*k);g.stroke();}},[color]);
 useEffect(()=>{const cv=c.current;if(!cv)return;const k=Math.min(window.devicePixelRatio||1,3);cv.width=cv.clientWidth*k;cv.height=cv.clientHeight*k;redraw();},[redraw,mode]);
 const pos=(e:RPointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top] as [number,number];};
 const finish=()=>{
  const out=document.createElement("canvas");
  if(mode==="type"){const g0=out.getContext("2d")!;const f="64px 'Snell Roundhand','Segoe Script','Brush Script MT','Apple Chancery',cursive";g0.font=f;const w=Math.ceil(g0.measureText(typed).width)+40;out.width=w*2;out.height=200;const g=out.getContext("2d")!;g.scale(2,2);g.font=f;g.fillStyle=color;g.textBaseline="middle";g.fillText(typed,20,50);place(out.toDataURL("image/png"));return;}
  const all=strokes.current.flat();if(!all.length)return;const pad=6,k=4;
  const minX=Math.min(...all.map(p=>p[0]))-pad,minY=Math.min(...all.map(p=>p[1]))-pad,maxX=Math.max(...all.map(p=>p[0]))+pad,maxY=Math.max(...all.map(p=>p[1]))+pad;
  out.width=(maxX-minX)*k;out.height=(maxY-minY)*k;const g=out.getContext("2d")!;g.scale(k,k);g.translate(-minX,-minY);g.strokeStyle=color;g.lineWidth=2.6;g.lineCap="round";g.lineJoin="round";
  for(const s of strokes.current){g.beginPath();s.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(s.length===1)g.lineTo(s[0][0]+.1,s[0][1]);g.stroke();}
  place(out.toDataURL("image/png"));
 };
 return <Localized as="div" className="pdfe-sheet-back" onPointerDown={close}><Localized as="section" className="pdfe-sheet sign" onPointerDown={e=>e.stopPropagation()} aria-label="Signature">
  <Localized as="header"><Localized as="b">Your signature</Localized><Localized as="button" className="pdfe-icon-btn" onClick={close} aria-label="Close"><X/></Localized></Localized>
  <Localized as="div" className="pdfe-seg wide"><Localized as="button" className={mode==="draw"?"on":""} onClick={()=>setMode("draw")}>Draw</Localized><Localized as="button" className={mode==="type"?"on":""} onClick={()=>setMode("type")}>Type</Localized></Localized>
  {mode==="draw"?<Localized as="div" className="pdfe-pad"><canvas ref={c}
    onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);strokes.current.push([pos(e)]);setHas(true);redraw();}}
    onPointerMove={e=>{if(!e.buttons&&e.pointerType==="mouse")return;const s=strokes.current[strokes.current.length-1];if(s&&e.currentTarget.hasPointerCapture(e.pointerId)){s.push(pos(e));redraw();}}}/>
   <Localized as="span" className="pdfe-pad-line">Sign here</Localized>
   {has&&<Localized as="button" className="pdfe-chip" onClick={()=>{strokes.current=[];setHas(false);redraw();}}><Undo2/>Clear</Localized>}</Localized>
  :<Localized as="input" className="pdfe-typed" value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Type your name" style={{color}} autoFocus/>}
  <Localized as="div" className="pdfe-sign-foot"><Swatches value={color} onChange={setColor} colors={["#102a33","#111111","#1d4ed8","#0f5a70"]}/><Localized as="button" className="pdfe-primary" onClick={finish} disabled={mode==="draw"?!has:!typed.trim()}><Check/>Place</Localized></Localized>
 </Localized></Localized>;
}

function PasswordSheet({ask}:{ask:{wrong:boolean;answer:(pw:string|null)=>void}}){
 const [pw,setPw]=useState("");
 return <Localized as="div" className="pdfe-sheet-back" onPointerDown={()=>ask.answer(null)}><form className="pdfe-sheet" onPointerDown={e=>e.stopPropagation()} aria-label="PDF password" onSubmit={e=>{e.preventDefault();if(pw)ask.answer(pw);}}>
  <Localized as="header"><Localized as="b">This PDF is locked</Localized><Localized as="button" type="button" className="pdfe-icon-btn" onClick={()=>ask.answer(null)} aria-label="Cancel"><X/></Localized></Localized>
  <Localized as="p" className="pdfe-note wrap">{ask.wrong?"That password is not right. Try again.":"Enter the password to open and edit it. It is used only on this device."}</Localized>
  <Localized as="label" className="pdfe-field"><Localized as="span">Password</Localized><Localized as="div"><Localized as="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} autoFocus autoComplete="off"/></Localized></Localized>
  <Localized as="button" className="pdfe-primary big" type="submit" disabled={!pw}><Check/>Open PDF</Localized>
 </form></Localized>;
}
