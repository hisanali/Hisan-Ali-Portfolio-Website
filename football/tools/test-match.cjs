const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/hisan/.npm/_npx/5e2e484947874241/node_modules/playwright');
const out=path.resolve('football/qa');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
 for(const [width,height,mobile] of [[1280,640,false],[844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,recordVideo:mobile?{dir:'/tmp/football-video',size:{width,height}}:undefined});
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('localhost'))requests.push(r);});
  const before=Date.now();await page.goto('http://localhost:8765/football/?debug');await page.waitForFunction(()=>document.body.classList.contains('is-ready'),{timeout:60000});const readyMs=Date.now()-before;
  const menu=await page.locator('#play').boundingBox();assert(menu.y+menu.height<=height,'kickoff must fit the viewport');await page.screenshot({path:`${out}/${width}-menu.png`});
  await page.click('#play');await page.waitForFunction(()=>fb.state==='kickoff',null,{timeout:20000});assert(await page.evaluate(()=>fb.ball.owner?.star&&fb.ball.owner.pos.distanceTo(fb.ball.p)<1.5),'captain takes kickoff within reach');await page.waitForFunction(()=>fb.state==='play',null,{timeout:20000});assert.equal(await page.evaluate(()=>fb.state),'play');
  if(!mobile){await page.keyboard.down('KeyD');await page.keyboard.down('ShiftLeft');await page.waitForTimeout(1800);await page.keyboard.up('ShiftLeft');await page.keyboard.up('KeyD');}
  else{const r=await page.locator('#stick').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width*.85,r.y+r.height*.5);await page.waitForTimeout(1400);await page.mouse.move(r.x+r.width*.7,r.y+r.height*.25);await page.waitForTimeout(700);await page.mouse.up();}
  await page.screenshot({path:`${out}/${width}-dribble.png`});
  const pass=await page.evaluate(()=>{const p=fb.ball.owner||fb.players[3];p.busy=0;p.strike=null;fb.ball.v.set(0,0,0);fb.give(p);fb.ball.p.copy(p.pos);fb.ball.p.y=.11;fb.pass(p,p.team.players.find(x=>x!==p&&!x.keeper),false,false,.5);return {pending:!!p.strike,owner:fb.ball.owner===p};});assert(pass.pending&&pass.owner,'pass must wait for contact');
  await page.waitForTimeout(180);await page.screenshot({path:`${out}/${width}-pass.png`});await page.waitForTimeout(1100);
  // Team size selects actual 14/22 players rather than cosmetic text.
  for(const size of ['7','11']){
   await page.click('#btn-pause');await page.click('#quit');await page.locator(`[data-setting="size"] [data-value="${size}"]`).click();await page.click('#play');await page.waitForFunction(()=>fb.state==='kickoff',null,{timeout:20000});assert(await page.evaluate(()=>fb.ball.owner?.star&&fb.ball.owner.pos.distanceTo(fb.ball.p)<1.5),'captain takes kickoff within reach');await page.waitForFunction(()=>fb.state==='play',null,{timeout:20000});
   assert.equal(await page.evaluate(()=>fb.players.length),Number(size)*2);
   const sim=await page.evaluate(()=>fb.sim(20));assert(Number(sim.time)>5);
  }
  await page.screenshot({path:`${out}/${width}-11aside.png`});
  const frameTimes=await page.evaluate(()=>new Promise(resolve=>{const t=[];let previous=performance.now();const f=n=>{t.push(n-previous);previous=n;if(t.length<180)requestAnimationFrame(f);else{t.sort((a,b)=>a-b);resolve({median:t[90],p95:t[171],triangles:fb.renderer.info.render.triangles,calls:fb.renderer.info.render.calls});}};requestAnimationFrame(f);}));
  await page.evaluate(()=>fb.goal());await page.waitForTimeout(850);await page.screenshot({path:`${out}/${width}-celebration.png`});
  for(let angle=1;angle<=3;angle++){await page.waitForTimeout(angle===1?1400:2000);await page.screenshot({path:`${out}/${width}-replay-${angle}.png`});}
  await page.waitForTimeout(3000);assert(['play','kickoff'].includes(await page.evaluate(()=>fb.state)),'replay returns to match');
  await page.evaluate(()=>fb.penalty());await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>fb.state),'penalty');await page.screenshot({path:`${out}/${width}-penalty.png`});
  await page.mouse.move(width*.5,height*.75);await page.mouse.down();await page.mouse.move(width*.6,height*.3,{steps:8});await page.mouse.up();await page.waitForTimeout(300);await page.screenshot({path:`${out}/${width}-strike.png`});await page.waitForTimeout(1400);
  const long=await page.evaluate(()=>fb.sim(900));assert.equal(long.state,'over','full match completes');await page.waitForTimeout(1400);assert(await page.locator('#result').isVisible());
  const bytes=(await Promise.all(requests.map(async r=>{try{return(await r.body()).length}catch{return 0}}))).reduce((a,b)=>a+b,0);
  assert.deepEqual(errors,[]);results.push({width,height,readyMs,bytes,frameTimes,fullMatch:long,errors});
  const video=page.video();await context.close();if(video)fs.writeFileSync('/tmp/football-video-source.txt',await video.path());
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
