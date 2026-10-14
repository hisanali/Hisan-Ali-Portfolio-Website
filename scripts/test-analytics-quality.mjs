import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
function dashboard(fetch=()=>{}){
 const body={dataset:{mode:'live'}},element={addEventListener:()=>{}};
 const source=readFileSync('public/insights/dashboard.js','utf8');
 const code=source.slice(0,source.indexOf('  render(); load(); loadLive(); loadActivity();loadJourneys();loadInbox();'))+'window.qa={state,eventCards,loadJourneys,loadInbox,seconds,journeyStatus,facts};})();';
 const window={addEventListener:()=>{}},document={body,hidden:false,activeElement:null,addEventListener:()=>{},querySelector:()=>element};
 vm.runInNewContext(code,{window,document,Intl,URLSearchParams,Date,Number,AbortController,AbortSignal,fetch});return window.qa;
}
test('website action cards use direct receipts with an explicit window, not delayed GA4 totals',()=>{
 const q=dashboard();q.state.activity={generatedAt:'2026-10-14T08:00:00Z',counts:[{event_name:'lead_whatsapp',today:3,last30:1,last24:5,last30days:9}]};q.state.report={datasets:{events:{status:'ok',rows:[{eventName:'lead_whatsapp',eventCount:0}]}}};
 let html=q.eventCards();assert.match(html,/<b>3<\/b>/);assert.match(html,/GA4 · selected historical period: 0/);assert.match(html,/Today · Oman/);
 q.state.actionWindow='last30';assert.match(q.eventCards(),/<b>1<\/b>/);
 q.state.activityError='Disconnected';assert.doesNotMatch(q.eventCards(),/<b>0<\/b>/);assert.match(q.eventCards(),/<b>—<\/b>/);
});
test('a late timeline response cannot overwrite the newly selected visit',async()=>{
 const pending=[];const q=dashboard((url)=>new Promise(resolve=>pending.push({url,resolve})));
 q.state.visit='visit-a';const first=q.loadJourneys();q.state.visit='visit-b';const second=q.loadJourneys();
 pending[1].resolve(Response.json({sessions:[],events:[{id:'b'}]}));await second;
 pending[0].resolve(Response.json({sessions:[],events:[{id:'a'}]}));await first;
 assert.equal(q.state.journeyVisit,'visit-b');assert.equal(q.state.journey.events[0].id,'b');
});
test('loading the inbox does not block an independent response-sheet request',async()=>{
 const pending=[];const q=dashboard(url=>new Promise(resolve=>pending.push({url,resolve})));
 const inbox=q.loadInbox(),sheet=q.loadInbox(true);assert.equal(pending.length,2);assert.match(pending[1].url,/\/sheet\//);
 pending[0].resolve(Response.json({rows:[]}));pending[1].resolve(Response.json({rows:[['row']]}));await Promise.all([inbox,sheet]);assert.equal(q.state.sheet.rows.length,1);
});
test('private enquiry edits are protected from polling and failed reports do not create false referral insights',async()=>{
 let calls=0;const q=dashboard(()=>{calls++;});q.state.enquiryDirty=true;await q.loadInbox();assert.equal(calls,0);
 q.state.report={datasets:{sources:{status:'error',rows:[]}}};assert.equal(q.facts().find(x=>x.label==='AI assistant referrals'),undefined);
 assert.equal(q.seconds(59.9),'1m 0s');
});
