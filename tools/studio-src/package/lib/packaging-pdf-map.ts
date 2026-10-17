import {blankProject,cleanStudioProject,generatedNet,type StudioProject} from './packaging-document';
import type {StudioPackageProfile} from './studio-package-profiles';
export const PDF_MAP_NAMESPACE='https://hisanali.com/tools/packaging-studio/fold-map/v1';
/** Only structural data travels in the PDF: no private asset URLs or draft records. */
export function encodePdfMap(p:StudioProject):string|null {
  if(p.structure!=='custom'||!p.imported||p.imported.referenceOnly)return null;
  const net=generatedNet(p);
  if(net.pieces.filter(q=>!q.parent).length!==1)return null;
  return encodeURIComponent(JSON.stringify({kind:'hisan-packaging-fold-map',version:1,name:p.name,dimensions:[p.width,p.depth,p.height],material:p.material,net}));
}
export function readPdfMap(value:unknown,width:number,height:number):StudioPackageProfile|null {
  try {
    if(typeof value!=='string'||value.length>1500000)return null;
    const data=JSON.parse(decodeURIComponent(value));
    if(data.kind!=='hisan-packaging-fold-map'||data.version!==1||!Array.isArray(data.dimensions)||data.dimensions.length!==3||!data.net||!Array.isArray(data.net.pieces)||data.net.pieces.length<2||data.net.pieces.length>100)return null;
    if(Math.abs(data.net.width-width)>.1||Math.abs(data.net.height-height)>.1)return null;
    if(data.net.pieces.some((q:any)=>!q||q.face!==q.id||['__proto__','constructor','prototype'].includes(q.id)||q.parent&&!q.hinge)||data.net.pieces.filter((q:any)=>!q.parent).length!==1)return null;
    const p=cleanStudioProject({...blankProject(),name:data.name,structure:'custom',width:data.dimensions[0],depth:data.dimensions[1],height:data.dimensions[2],material:data.material,panels:{},imported:{name:'PDF fold map',source:'data:application/pdf;base64,AA==',confirmed:true,notes:[],net:data.net}});
    if(!p?.imported)return null;
    return {id:'studio-export-restored',name:p.name,dimensions:[p.width,p.depth,p.height],scale:1,artworkPage:1,material:p.material,net:p.imported.net,geometryNotes:['Fold map restored from Studio PDF export. Artwork is read from this PDF; text remains outlined artwork.']};
  }catch{return null;}
}
