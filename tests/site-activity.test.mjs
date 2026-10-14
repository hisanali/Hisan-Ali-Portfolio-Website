import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {sanitizeEvent, collectActivity} from '../app/insights/activity.ts';
import {withSiteActivity} from '../app/site-activity-shell.ts';
const valid = {id:randomUUID(),event:'lead_whatsapp',page:'/gcc/?email=secret@example.com',label:'Call +968 9611 0846 or secret@example.com',target:'wa.me?text=private',area:'footer',device:'mobile'};
test('collector stores only allowlisted, redacted fields',()=>{
 const row=sanitizeEvent({...valid,email:'private@example.com',ip:'1.2.3.4',message:'private'});
 assert.equal(row.page,'/gcc/');assert.equal(row.target,'wa.me');assert.equal(row.label,'Call [number] or [email]');assert.equal(Object.keys(row).length,10);
 assert.equal(sanitizeEvent({...valid,page:'/admin/'}),null);assert.equal(sanitizeEvent({...valid,event:'unknown'}),null);assert.equal(sanitizeEvent({...valid,id:'bad'}),null);
});
test('rejects cross-origin requests and oversized input before storage',async()=>{
 assert.equal((await collectActivity(new Request('https://hisanali.com/api/site-activity/',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}))).status,403);
 assert.equal((await collectActivity(new Request('https://hisanali.com/api/site-activity/',{method:'POST',headers:{origin:'https://hisanali.com'},body:' '.repeat(12001)}))).status,413);
});
test('public script is injected once and works on pages without shared shell',()=>{
 const result=withSiteActivity(withSiteActivity('<html><head></head><body>Game</body></html>'));
 assert.equal((result.match(/site-activity\.js/g)||[]).length,1);
 assert.ok(withSiteActivity('<!doctype html><html><title>Tool</title></html>').includes('site-activity.js'));
 assert.equal(withSiteActivity('<footer>Fragment</footer>'), '<footer>Fragment</footer>');
});
function browser(path='/gcc/', consent=false) {
 const listeners={},events=[];const win={dataLayer:[],addEventListener:()=>{}};
 const storage=()=>({getItem:()=>null,setItem:()=>{},removeItem:()=>{}});
 const context={window:win,document:{readyState:'loading',hidden:false,addEventListener:(type,fn)=>listeners[type]=fn},sessionStorage:storage(),localStorage:{...storage(),getItem:()=>consent?JSON.stringify({allowed:true,at:Date.now()}):null},location:{pathname:path,href:'https://hisanali.com'+path,origin:'https://hisanali.com'},innerWidth:1000,crypto:{randomUUID},URL,URLSearchParams,Blob,navigator:{userAgent:"Chrome/130 Mac",language:"en"},setInterval:()=>{},fetch:async(_,init)=>{events.push(...JSON.parse(init.body).events);return {ok:true}}};
 vm.runInNewContext(readFileSync('site-activity.js','utf8'),context);
 return {listeners,win,events};
}
const anchor=(href,privateForm=false)=>({tagName:'A',textContent:privateForm?'A person private@example.com':'Contact',closest:(selector)=>selector.includes('contenteditable')?privateForm?{}:null:selector==='footer'?{}:null,getAttribute:key=>key==='href'?href:null,hasAttribute:()=>false,matches:selector=>selector==='a[href]' || selector.includes('canvas')});
test('contact links with parameters fire one correct GA4 event and no query text',async()=>{
 const b=browser();await new Promise(setImmediate);const a=anchor('/contact/?service=analytics&email=secret@example.com');
 b.listeners.click({target:{closest:()=>a}});await new Promise(setImmediate);
 assert.equal(b.win.dataLayer.length,1);assert.equal(b.win.dataLayer[0].event,'cta_contact');
 assert.equal(b.events.at(-1).target,'/contact/');assert.ok(!JSON.stringify(b.events).includes('secret'));
});
test('WhatsApp hostname matching, form redaction and button clicks',async()=>{
 const b=browser();await new Promise(setImmediate);const a=anchor('https://wa.me/96896110846?text=personal',true);
 b.listeners.click({target:{closest:()=>a}});await new Promise(setImmediate);
 assert.equal(b.events.at(-1).event,'lead_whatsapp');assert.equal(b.events.at(-1).label,'a control');assert.equal(b.events.at(-1).target,'wa.me');
 const fake=anchor('https://wa.me.evil.test/');b.listeners.click({target:{closest:()=>fake}});await new Promise(setImmediate);assert.equal(b.events.at(-1).event,'site_click');
 const button={...anchor(''),tagName:'BUTTON',textContent:'Open menu',matches:selector=>selector.includes('canvas')};b.listeners.click({target:{closest:()=>button}});await new Promise(setImmediate);assert.equal(b.events.at(-1).event,'site_click');assert.equal(b.events.at(-1).label,'Open menu');
});
test('admin sends no telemetry; contact lead only dispatched after successful request attempt',()=>{
 const b=browser('/admin/');assert.equal(b.events.length,0);assert.equal(Object.keys(b.listeners).length,0);
 const form=readFileSync('contact-studio.js','utf8');assert.equal((form.match(/portfolio:lead-submitted/g)||[]).length,1);assert.ok(form.indexOf("new CustomEvent('portfolio:lead-submitted')")>form.indexOf('await fetch('));
});

test('form attempts are not counted as confirmed leads and page-background clicks are ignored',async()=>{
 const b=browser();await new Promise(setImmediate);
 b.listeners.submit({target:{matches:()=>true,closest:()=>null}});await new Promise(setImmediate);
 assert.equal(b.events.at(-1).event,'form_submit');assert.equal(b.win.dataLayer.length,0);
 const before=b.events.length;b.listeners.click({target:{closest:()=>null}});await new Promise(setImmediate);assert.equal(b.events.length,before);
 b.listeners['portfolio:lead-submitted']();await new Promise(setImmediate);assert.equal(b.events.at(-1).event,'lead_form');assert.equal(b.win.dataLayer.length,1);
});
test('analytics choice gates linked visits and never requests browser location',async()=>{
 const basic=browser(),allowed=browser('/gcc/',true);await new Promise(setImmediate);
 assert.equal(basic.events[0].session_id,undefined);assert.ok(allowed.events[0].session_id);assert.equal(allowed.events[0].consent,true);
 const source=readFileSync('site-activity.js','utf8');assert.doesNotMatch(source,/getCurrentPosition|navigator\.geolocation|Share my location/);
});
