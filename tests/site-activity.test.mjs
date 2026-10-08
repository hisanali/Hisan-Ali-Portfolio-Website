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
 assert.equal(row.page,'/gcc/');assert.equal(row.target,'wa.me');assert.equal(row.label,'Call [number] or [email]');assert.equal(Object.keys(row).length,7);
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
function browser(path='/gcc/') {
 const listeners={},events=[];const win={dataLayer:[],addEventListener:()=>{}};
 const context={window:win,document:{addEventListener:(type,fn)=>listeners[type]=fn},location:{pathname:path,href:'https://hisanali.com'+path,origin:'https://hisanali.com'},innerWidth:1000,crypto:{randomUUID},URL,Blob,navigator:{},setInterval:()=>{},fetch:async(_,init)=>{events.push(...JSON.parse(init.body).events);return {ok:true}}};
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
 const form=readFileSync('contact-studio.js','utf8');assert.equal((form.match(/portfolio:lead-submitted/g)||[]).length,1);assert.ok(form.indexOf("new CustomEvent('portfolio:lead-submitted')")>form.indexOf('await fetch(GOOGLE_FORM'));
});
