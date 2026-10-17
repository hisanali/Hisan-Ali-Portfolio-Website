import {FONT_CSS,type TextObj} from './pdf-editor-model';
export const EXTRA_FONTS=[
 {id:'liberation-regular',name:'Liberation Sans',url:'/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Regular.ttf'},
 {id:'liberation-bold',name:'Liberation Sans Bold',url:'/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Bold.ttf'},
 {id:'liberation-italic',name:'Liberation Sans Italic',url:'/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-Italic.ttf'},
 {id:'liberation-bolditalic',name:'Liberation Sans Bold Italic',url:'/tools/studio-runtime/datasheets/standard-fonts/LiberationSans-BoldItalic.ttf'},
];
const loaded=new Map<string,{name:string;bytes:Uint8Array}>();
export const customFontCss=(o:TextObj)=>o.customFont?`"pdfe-${o.customFont}"`:FONT_CSS[o.font];
export const fontBytes=(id:string)=>loaded.get(id)?.bytes;
export async function registerEditorFont(id:string,name:string,bytes:Uint8Array){
 const face=new FontFace(`pdfe-${id}`,bytes.slice().buffer);await face.load();document.fonts.add(face);loaded.set(id,{name,bytes});return id;
}
export async function loadEditorFont(id:string){
 if(loaded.has(id))return id;const choice=EXTRA_FONTS.find(f=>f.id===id);if(!choice)throw Error('Font unavailable');const response=await fetch(choice.url);if(!response.ok)throw Error('Font could not load');return registerEditorFont(id,choice.name,new Uint8Array(await response.arrayBuffer()));
}
