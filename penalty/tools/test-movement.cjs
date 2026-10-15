const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1280,height:760}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/penalty/');await page.locator('#loading').waitFor({state:'hidden'});await page.click('#play-practice');
 const approach=await page.evaluate(async()=>{
  const q=penaltyQA,r=q.rigs.shooter,start=r.bone('Hips');q.shoot(-2.8,1.6,[2.8,1.7,0]);
  const triggerDisplacement=start.distanceTo(r.bone('Hips'));
  const release=r.event.fn;r.event.fn=()=>{window.strikeSample={distance:r.bone('RightToeBase').distanceTo({x:0,y:.11,z:11}),clipTime:r.current.time};release();};
  while(!window.strikeSample)await new Promise(requestAnimationFrame);
  return {triggerDisplacement,...window.strikeSample};
 });
 assert(approach.triggerDisplacement<.001,'approach teleported');assert(approach.distance<.13,'boot misses ball at contact');assert(Math.abs(approach.clipTime-.76)<.02);
 await page.waitForFunction(()=>penaltyQA.state.phase==='replay');await page.click('#replay-skip');
 const celebration=await page.evaluate(async()=>{
  let r=penaltyQA.rigs.shooter,last=r.bone('Hips'),maxStep=0,minSole=1,start=performance.now();
  while(performance.now()-start<700){await new Promise(requestAnimationFrame);const next=r.bone('Hips');maxStep=Math.max(maxStep,next.distanceTo(last));last=next;minSole=Math.min(minSole,r.bone('LeftToeBase').y-.025,r.bone('RightToeBase').y-.025);}
  return {maxFrameDisplacement:maxStep,minimumSoleHeight:minSole};
 });
 assert(celebration.maxFrameDisplacement<.08,'celebration jumps to another capture origin');assert(celebration.minimumSoleHeight>=-.003);
 const recovery=await page.evaluate(async()=>{
  const q=penaltyQA;q.start('practice');q.dive(2.5,.35);const r=q.rigs.keeper;let extensionTime=null,start=performance.now(),samples=[];
  while(performance.now()-start<3300){await new Promise(requestAnimationFrame);if(!extensionTime&&r.current.time>=1.22)extensionTime=performance.now();if(extensionTime)samples.push(r.current.getEffectiveTimeScale());}
  return {recoveryAtNaturalSpeed:samples.every(s=>s===1),sampleCount:samples.length,root:r.root.position.toArray()};
 });
 assert(recovery.sampleCount>10);assert(recovery.recoveryAtNaturalSpeed,'landing/get-up remains fast-forwarded');assert.equal(errors.length,0);
 const report={approach,celebration,recovery,errors};fs.writeFileSync('penalty/qa/movement-results.json',JSON.stringify(report,null,2));console.log(report);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
