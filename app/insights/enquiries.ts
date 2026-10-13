import { createHash } from 'node:crypto';
export const SHEET_ID = '1DJQG8YA4keIZ7mB8Esd6zrrapjdUwPTZk9Xfioe7hNA';
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=599293004`;
const FORM = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfJndk37Z7sfGsaS8Nn3ujDMIBhU75pl0FRnykxge4fwxFfcQ/formResponse';
const headers = { 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff' };
const limits = new Map<string,{count:number;expires:number}>();
const uuid = (v:unknown) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v));
const text = (v:unknown,max:number) => String(v||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,max);
export function enquiryFields(value:Record<string,unknown>) {
 const details:Record<string,string>={};
 for (const [key,max] of [['name',100],['email',254],['phone',50],['service',100],['budget',100],['message',5000],['website',300],['goal',1000],['reply',100]] as const) details[key]=text(value[key],max);
 if(!details.name || !details.message || (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) && !/\d{6}/.test(details.phone.replace(/\D/g,'')))) throw new Error('Please include your name, message and a valid email or phone number.');
 return details;
}
export async function enquiryStore(path:string,method='GET',body?:object,prefer?:string){
 const base=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
 if(!base||!key)throw new Error('Enquiry storage is not configured.');
 const result=await fetch(`${base}/rest/v1/portfolio_enquiries${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!result.ok)throw new Error('Enquiry storage is temporarily unavailable.');
 return result.status===204?null:result.json();
}
export async function collectEnquiry(request:Request){
 const json=(body:object,status=200)=>Response.json(body,{status,headers});
 const origin=request.headers.get('origin');
 if(origin!=='https://hisanali.com'&&origin!=='https://www.hisanali.com'&&!(process.env.NODE_ENV!=='production'&&origin===new URL(request.url).origin&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin||'')))return json({error:'Invalid origin.'},403);
 const now=Date.now(),key=createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').digest('hex');
 for(const [id,item]of limits)if(item.expires<now)limits.delete(id);
 const limit=limits.get(key)||{count:0,expires:now+600000};limits.set(key,limit);
 if(++limit.count>10||limits.size>10000)return json({error:'Please wait before sending another enquiry.'},429);
 try{
  let data='';const reader=request.body?.getReader();if(!reader)return json({error:'Missing enquiry.'},400);let size=0;const decoder=new TextDecoder();
  while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>20000){await reader.cancel();return json({error:'Enquiry too large.'},413);}data+=decoder.decode(chunk.value,{stream:true});}data+=decoder.decode();
  const input=JSON.parse(data);if(!uuid(input.id))return json({error:'Invalid submission.'},400);
  if(input.company_website)return json({received:true},202); // honeypot: not stored or mirrored
  let details;try{details=enquiryFields(input);}catch(error){return json({error:(error as Error).message},400);}
  const rows=await enquiryStore('?on_conflict=id','POST',{id:input.id,details,session_id:input.link_journey===true&&uuid(input.session_id)?input.session_id:null},'resolution=ignore-duplicates,return=representation');
  if(rows.length){
   const body=new URLSearchParams({'entry.975940308':details.name,'entry.974041241':details.email,'entry.1031713771':details.phone,'entry.406911209':'','entry.1629603893':details.budget,'entry.1936083772':[details.message,details.service&&`Service: ${details.service}`,details.website&&`Website: ${details.website}`,details.goal&&`Primary goal: ${details.goal}`,details.reply&&`Preferred reply: ${details.reply}`].filter(Boolean).join('\n\n')});
   const services:Record<string,string>={'seo':'SEO Optimization','google-ads':'Google ADS management','meta-ads':'Social Media Marketing','social-media':'Social Media Marketing','content':'Graphic Design','analytics':'Consultation','strategy':'Consultation','consultation':'Consultation','other':'Other'};
   if(services[details.service])body.set('entry.427941684',services[details.service]);
   let delivery='unconfirmed';
   try{const response=await fetch(FORM,{method:'POST',body,signal:AbortSignal.timeout(8000)});if(response.ok)delivery='accepted';}catch{}
   // Inbox receipt is authoritative; Google Form HTTP acceptance is separately labelled.
   try{await enquiryStore(`?id=eq.${input.id}`,'PATCH',{sheet_delivery:delivery});}catch{}
  }
  return json({received:true,id:input.id},202);
 }catch(error){return json({error:error instanceof SyntaxError?'Invalid enquiry.':'Could not save your enquiry. Please retry or contact Hisan directly.'},error instanceof SyntaxError?400:503);}
}
export async function loadEnquiries(){return{generatedAt:new Date().toISOString(),source:'Private website inbox',rows:await enquiryStore('?select=*&order=created_at.desc&limit=500'),limit:500,sheetUrl:SHEET_URL};}
export async function updateEnquiry(input:Record<string,unknown>){
 if(!uuid(input.id)||!['new','read','contacted','qualified','won','lost','spam'].includes(String(input.status)))throw new Error('Invalid enquiry update.');
 return enquiryStore(`?id=eq.${input.id}`,'PATCH',{status:input.status,notes:text(input.notes,2000),updated_at:new Date().toISOString()},'return=representation');
}
export async function loadSheet(token:string){
 const range=encodeURIComponent("'Form responses 1'!A1:H5000");
 const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(response.status===403?'Google Sheets read access is not connected. Enable the Sheets API and approve read-only Sheets access when reconnecting.':response.status===401?'Sign in again to read the response sheet.':'The response sheet could not be read. Try again later.');
 const data=await response.json();return{generatedAt:new Date().toISOString(),source:'Contacts Us 2 (Responses)',sheetUrl:SHEET_URL,headers:data.values?.[0]||[],rows:(data.values||[]).slice(1),limit:4999};
}
