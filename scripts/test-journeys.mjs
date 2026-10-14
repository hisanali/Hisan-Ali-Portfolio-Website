import {build} from 'esbuild';import{mkdtemp,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';import{pathToFileURL}from'node:url';import assert from'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'journey-tests-'));
try{
 await build({entryPoints:{activity:'app/insights/activity.ts',enquiries:'app/insights/enquiries.ts',route:'app/admin/[[...path]]/route.ts'},outdir:dir,bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'}});
 const activity=await import(pathToFileURL(join(dir,'activity.mjs'))),inbox=await import(pathToFileURL(join(dir,'enquiries.mjs')));
 const id='11111111-1111-4111-8111-111111111111';const base={id,event:'site_click',page:'/gcc/?email=test@example.com',label:'hello test@example.com +968 96110846',session_id:id,page_id:id,metadata:{password:'secret',latitude:23,longitude:58,accuracy:4,location_consent:true,active_seconds:999,scroll:200}};
 const basic=activity.sanitizeEvent(base);assert.equal(basic.session_id,null);assert.deepEqual(basic.metadata,{});assert.equal(basic.page,'/gcc/');assert(!basic.label.includes('test@example.com'));
 const consented=activity.sanitizeEvent({...base,consent:true});assert.equal(consented.session_id,id);assert.equal(consented.metadata.active_seconds,30);assert.equal(consented.metadata.scroll,100);assert.equal(consented.metadata.password,undefined);assert.equal(consented.metadata.latitude,undefined);
 const location=activity.sanitizeEvent({...base,consent:true,event:'location_shared'});assert.equal(location,null);
 assert.equal(activity.sanitizeEvent({...base,event:'heartbeat'}),null);assert.equal(activity.sanitizeEvent({...base,page:'/admin/'}),null);assert.equal(activity.sanitizeEvent({...base,consent:true,event:'location_shared',metadata:{latitude:500,longitude:58,accuracy:5,location_consent:true}}),null);
 assert.throws(()=>inbox.enquiryFields({name:'Test',message:'Test'}));assert.equal(inbox.enquiryFields({name:'Test',message:'Test',email:'sample@example.com',password:'secret'}).password,undefined);
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';let calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});if(String(url).includes('portfolio_enquiries'))return Response.json([]);throw new Error('Google must not be called for duplicate submission');};
 const request=new Request('http://localhost:4318/api/contact-enquiry/',{method:'POST',headers:{origin:'http://localhost:4318'},body:JSON.stringify({id,name:'Test',message:'Test',email:'sample@example.com'})});assert.equal((await inbox.collectEnquiry(request)).status,202);assert.equal(calls.length,1);assert.equal(calls[0].options.headers.Prefer,'resolution=ignore-duplicates,return=representation');
 // A fresh receipt mirrors once; a Google failure still leaves an authoritative inbox receipt.
 calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});if(String(url).includes('formResponse'))return new Response('ok');if(options.method==='POST')return Response.json([{id}]);return new Response(null,{status:204});};
 const fresh=()=>new Request('http://localhost:4318/api/contact-enquiry/',{method:'POST',headers:{origin:'http://localhost:4318'},body:JSON.stringify({id,name:'Test',message:'Test',email:'sample@example.com',session_id:id,link_journey:false})});
 assert.equal((await inbox.collectEnquiry(fresh())).status,202);assert.equal(calls.filter(x=>String(x.url).includes('formResponse')).length,1);assert.equal(JSON.parse(calls[0].options.body).session_id,null);assert.equal(JSON.parse(calls.at(-1).options.body).sheet_delivery,'accepted');
 globalThis.fetch=async(url,options)=>{if(String(url).includes('formResponse'))throw new Error('offline');if(options.method==='POST')return Response.json([{id}]);return new Response(null,{status:204});};assert.equal((await inbox.collectEnquiry(fresh())).status,202);
 assert.equal((await inbox.collectEnquiry(new Request('http://localhost:4318/api/contact-enquiry/',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'}))).status,403);
 const route=await import(pathToFileURL(join(dir,'route.mjs')));for(const path of ['journeys','enquiries','sheet'])assert.equal((await route.GET(new Request('https://hisanali.com/admin/'+path+'/'),{params:{path:[path]}})).status,401);
 assert.equal((await route.POST(new Request('https://hisanali.com/admin/enquiries/',{method:'POST',body:'{}'}),{params:{path:['enquiries']}})).status,401);
 console.log('PASS: consent gating, GPS rejection, private-field redaction, no duplicate Google Form forwarding, origin checks, and owner-only APIs.');
}finally{await rm(dir,{recursive:true,force:true});}
