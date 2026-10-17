/** Packaging persistence is confined to this browser. No Studio API is contacted. */
let dbPromise:Promise<IDBDatabase>|undefined;
const database=()=>dbPromise??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('hisan-packaging-studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('items');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function access(mode:IDBTransactionMode,run:(s:IDBObjectStore)=>IDBRequest){const db=await database();return new Promise<any>((resolve,reject)=>{const tx=db.transaction('items',mode),r=run(tx.objectStore('items'));let result:any;r.onsuccess=()=>{result=r.result};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
const read=(key:string)=>access('readonly',s=>s.get(key));const write=(key:string,value:any)=>access('readwrite',s=>s.put(value,key));
const json=(value:any,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
export async function studioFetch(input:RequestInfo|URL,init:RequestInit={}){
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.origin);
 if(url.pathname==='/api/auth/session')return json({session:{username:'local-browser'}});
 if(!url.pathname.startsWith('/api/packaging'))return window.fetch(input,init);
 try{
  const method=init.method||'GET',body=init.body?JSON.parse(String(init.body)):{};
  if(url.pathname.endsWith('/jobs'))return method==='GET'?json({items:[],processor:{available:false}}):json({error:'Native design conversion requires a server. Export this file as PDF or SVG and import it here.'},422);
  const elements=url.pathname.endsWith('/elements'),key=elements?'elements':'projects',items=await read(key)||[];
  if(method==='GET'){const id=url.searchParams.get('id');return json(id?items.find((x:any)=>x.id===id)||{error:'Project not found in this browser.'}: {items},id&&!items.some((x:any)=>x.id===id)?404:200);}
  if(method==='POST'){
   const db=await database();return await new Promise<Response>((resolve,reject)=>{
    const tx=db.transaction('items','readwrite'),store=tx.objectStore('items'),r=store.get(key);let result:Response;
    r.onsuccess=()=>{const current=r.result||[],old=current.find((x:any)=>x.id===body.id);
     if(!elements&&old&&body.revision!==old.revision){result=json({error:'This project changed in another tab. Reopen it before saving.'},409);return;}
     const item={...body,...(!elements?{name:body.project.name,width:body.project.width,depth:body.project.depth,height:body.project.height,updatedAt:new Date().toISOString(),updatedBy:'This browser'}:{}),id:body.id||crypto.randomUUID(),revision:(old?.revision||0)+1,created_at:old?.created_at||new Date().toISOString(),updated_at:new Date().toISOString()};
     store.put([item,...current.filter((x:any)=>x.id!==item.id)],key);result=json(item);
    };tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });
  }
  if(method==='DELETE'){const id=url.searchParams.get('id')||body.id;await write(key,items.filter((x:any)=>x.id!==id));return json({ok:true});}
  return json({error:'Unsupported local operation.'},405);
 }catch(e){return json({error:'Browser storage could not save this change. Export a project file to keep a copy. '+(e as Error).message},507);}
}
