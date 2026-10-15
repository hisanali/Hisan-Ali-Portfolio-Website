const{chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('assert');const fs=require('fs');
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:1280,height:760}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8765/penalty/');await p.locator('#loading').waitFor({state:'hidden',timeout:30000});await p.click('#play-practice');
const supports=[];
for(const [x,y]of [[-2.5,.3],[-2.5,2.2],[2.5,.3],[2.5,2.2],[0,2.2]]){
 await p.evaluate(([x,y])=>{window.penaltyQA.start('practice');window.penaltyQA.dive(x,y);},[x,y]);
 const sample=await p.evaluate(async()=>{let min=100,maxRoot=-100;const started=performance.now();while(performance.now()-started<1900){await new Promise(requestAnimationFrame);const r=window.penaltyQA.rigs.keeper;for(const [n,rad]of [['Hips',.13],['LeftFoot',.045],['RightFoot',.045],['LeftHand',.035],['RightHand',.035]])min=Math.min(min,r.bone(n).y-rad);maxRoot=Math.max(maxRoot,r.root.position.y);}const r=window.penaltyQA.rigs.keeper;return {minimumClearance:min,maxRootY:maxRoot,landingFootHeight:Math.min(r.bone('LeftFoot').y,r.bone('RightFoot').y),hipsY:r.bone('Hips').y};});
 assert(sample.minimumClearance>=-.0001);assert(sample.maxRootY<1.2);assert(sample.landingFootHeight<.45);supports.push({x,y,...sample});
}
// Cancelling an actual swipe cannot leave a shot armed.
await p.evaluate(()=>window.penaltyQA.start('practice'));await p.mouse.move(600,600);await p.mouse.down();await p.mouse.move(630,520,{steps:5});await p.dispatchEvent('#scene','pointercancel');await p.mouse.up();assert.equal(await p.evaluate(()=>window.penaltyQA.state.phase),'aim');
await p.evaluate(()=>{window.penaltyQA.start('shootout');window.penaltyQA.setScore([true],[]);window.penaltyQA.next();});
p.on('dialog',d=>d.accept());await p.click('#btn-menu');await p.waitForTimeout(1600);assert.equal(await p.evaluate(()=>window.penaltyQA.state.phase),'menu');
assert.equal(errors.length,0);fs.writeFileSync('penalty/qa/physics-browser.json',JSON.stringify({supports,cancelledSwipe:'passed',cancelledCpuTurn:'passed',errors},null,2));console.log({supports,cancelledSwipe:'passed',cancelledCpuTurn:'passed',errors});await b.close();})();
