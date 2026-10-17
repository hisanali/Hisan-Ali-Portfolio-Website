const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/hisan/.npm/_npx/5e2e484947874241/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}),context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:false});
 await context.addInitScript(()=>Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8765/football/?debug&v=18');await page.waitForFunction(()=>document.body.classList.contains('is-ready'),null,{timeout:90000});
 assert(await page.evaluate(()=>matchMedia('(pointer:fine)').matches&&document.body.dataset.touch==='true'),'hybrid tablet detected');
 for(const [kit,name,away] of [['red','Falcon FC','Coastal FC'],['blue','Atlas United','Coastal FC'],['green','Emerald FC','Coastal FC'],['white','Coastal FC','Capital SC']]){
  await page.locator(`.seg[data-setting="kit"] [data-value="${kit}"]`).click();assert.equal(await page.locator('#fixture-home').innerText(),name);assert.equal(await page.locator('#fixture-away').innerText(),away);
  await page.evaluate(()=>{fb.startMatch();fb.sim(4.8)});
  assert.deepEqual(await page.evaluate(()=>[...new Set(fb.players.map(p=>p.team.name))]),[name,away]);
  await page.click('#btn-pause');await page.click('#quit');
 }
 await page.locator('.seg[data-setting="kit"] [data-value="red"]').click();
 await page.evaluate(()=>{fb.startMatch();fb.sim(4.8)});await page.waitForTimeout(300);
 for(const [width,height] of [[1024,768],[768,1024],[1024,768]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(180);
  assert.equal(await page.locator('.controls').evaluate(e=>getComputedStyle(e).display),'flex');
  const r=await page.locator('#btn-b').boundingBox();assert(r.x+r.width<width-50&&r.y+r.height<height-50,'tablet clearance after rotation');
 }
 await page.screenshot({path:'football/qa/layout-ipad-final.png'});
 await page.evaluate(()=>{fb.startTraining();fb.training.index=5;fb.setupDrill()});await page.waitForTimeout(250);
 assert.equal(await page.locator('#btn-b .defence-icon').evaluate(e=>getComputedStyle(e).display),'block');assert.equal(await page.locator('#btn-b .attack-icon').evaluate(e=>getComputedStyle(e).display),'none');
 await context.close();
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});desktop.on('pageerror',e=>errors.push(e.message));await desktop.goto('http://localhost:8765/football/?debug&v=18');await desktop.waitForFunction(()=>document.body.classList.contains('is-ready'),null,{timeout:90000});await desktop.screenshot({path:'football/qa/layout-desktop-menu.png'});await desktop.evaluate(()=>{fb.startMatch();fb.sim(4.8)});assert.equal(await desktop.locator('.controls').evaluate(e=>getComputedStyle(e).display),'none');await desktop.screenshot({path:'football/qa/layout-desktop-final.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync('football/qa/layout-details.json',JSON.stringify({hybridTablet:true,rotation:true,fourClubFixtures:true,contextualIcons:true,desktop:true,errors},null,2));await browser.close();console.log('Hybrid tablet, rotation, club identities, defence icons, desktop passed');
})().catch(e=>{console.error(e);process.exit(1)});
