/** The pinned PDF.js 4 reader supports Safari 16.4+, with missing standard APIs shimmed.
 * Install the standard resolver capability before either preview or importer loads it.
 */
export function ensurePdfPromise(){
 // PDF.js also uses at() in parsing/rendering; its legacy bundle does not include this shim.
 const at=function(this:{length:number;[index:number]:unknown},index:number){if(this==null)throw new TypeError('Invalid receiver');const length=Math.max(0,Math.min(Math.floor(Number(this.length)||0),Number.MAX_SAFE_INTEGER));const n=Math.trunc(Number(index)||0),position=n<0?length+n:n;return position<0||position>=length?undefined:this[position];};
 for(const prototype of [Array.prototype,String.prototype,Object.getPrototypeOf(Uint8Array.prototype)])if(typeof prototype.at!=='function')Object.defineProperty(prototype,'at',{configurable:true,writable:true,value:at});
 if(typeof (Promise as unknown as {withResolvers?:unknown}).withResolvers!=='function')Object.defineProperty(Promise,'withResolvers',{configurable:true,writable:true,value:function(this:PromiseConstructor){let resolve!:(value:unknown)=>void,reject!:(reason?:unknown)=>void;const promise=new this((res,rej)=>{resolve=res;reject=rej;});return {promise,resolve,reject};}});
}
export async function datasheetPdfReader(){
 ensurePdfPromise();const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc='/tools/studio-runtime/datasheets/pdf.worker.4.8.69.min.js';
 return pdfjs;
}
