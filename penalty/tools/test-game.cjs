const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const fs=require('fs');const assert=require('assert');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const reports=[];
for(const size of [{width:1280,height:760},{width:390,height:844}]){
 const label=size.width===390?'mobile':'desktop';const page=await browser.newPage({viewport:size,deviceScaleFactor:size.width===390?2:1,isMobile:size.width===390,hasTouch:size.width===390});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/penalty/');await page.locator('#loading').waitFor({state:'hidden',timeout:30000});
 const loaded=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.name.includes('footballer.glb')).map(x=>({ms:x.duration,bytes:x.encodedBodySize})));
 await page.click('[data-setting="kit"] [data-value="blue"]');await page.click('#play-practice');await page.waitForTimeout(800);
 await page.screenshot({path:`penalty/qa/${label}-aiming.png`});
 const tint=await page.evaluate(()=>window.penaltyQA.rigs.shooter.model.getObjectByName('Ch38_Shirt').material.color.getHexString());assert.equal(tint,'1d4fb8');
 // A real curved pointer swipe exercises the original power/curl path.
 const x=size.width*.5,y=size.height*.8;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+18,y-45,{steps:5});await page.mouse.move(x+48,y-110,{steps:5});await page.mouse.up();
 await page.waitForFunction(()=>window.penaltyQA.state.clip==='kick');await page.waitForTimeout(640);await page.screenshot({path:`penalty/qa/${label}-mid-kick.png`});
 await page.waitForFunction(()=>['flight','replay','celebration'].includes(window.penaltyQA.state.phase),{timeout:15000});
 // Reset and put the dive on the opposite side for a repeatable goal.
 await page.evaluate(()=>{window.penaltyQA.start('practice');window.penaltyQA.shoot(-2.8,1.6,[2.8,1.7,0]);});
 await page.waitForFunction(()=>window.penaltyQA.state.keeperClip?.includes('right'));await page.waitForTimeout(430);await page.screenshot({path:`penalty/qa/${label}-keeper-dive.png`});
 await page.waitForFunction(()=>window.penaltyQA.state.phase==='replay',{timeout:20000});assert.equal(await page.evaluate(()=>window.penaltyQA.state.streak),1);
 await page.screenshot({path:`penalty/qa/${label}-replay.png`});await page.click('#replay-skip');await page.waitForTimeout(1050);await page.screenshot({path:`penalty/qa/${label}-goal-celebration.png`});
 // Same destination as the ball: actual visible gloves must cause a save.
 await page.evaluate(()=>{window.penaltyQA.start('practice');window.penaltyQA.shoot(2.5,1.5,[2.5,1.5,0]);});
 await page.waitForFunction(()=>!!window.penaltyQA.state.result,{timeout:20000});const save=await page.evaluate(()=>window.penaltyQA.state);assert.equal(save.result,'saved');
 for(const [tx,ty,expected] of [[-2,.3,'left-low'],[-2,2,'left-high'],[2,.3,'right-low'],[2,2,'right-high'],[0,2,'jump']]){
  const clip=await page.evaluate(([x,y])=>{window.penaltyQA.start('practice');window.penaltyQA.dive(x,y);return window.penaltyQA.state.keeperClip;},[tx,ty]);assert(clip.includes(expected));
 }
 const scoring=await page.evaluate(()=>[window.penaltyQA.setScore([true,true,true],[false,false,false]),window.penaltyQA.setScore([true,false,true,false,true],[true,false,true,false,true]),window.penaltyQA.setScore([true,true,true,true,true,true],[true,true,true,true,true,false])]);assert.deepEqual(scoring,['you',null,'you']);
 // Goal mode still accepts a tap to queue the player keeper's dive.
 await page.evaluate(()=>{window.penaltyQA.start('shootout');window.penaltyQA.setScore([true],[]);window.penaltyQA.next();});
 await page.mouse.click(size.width*.75,size.height*.45);await page.waitForFunction(()=>window.penaltyQA.state.phase==='flight');assert(await page.evaluate(()=>!!window.penaltyQA.state.keeperClip));
 await page.click('#btn-sound');assert(await page.locator('#btn-sound').getAttribute('class').then(c=>c.includes('is-off')));
 // Rotate and return to menu to verify control layout in landscape.
 if(label==='mobile'){await page.setViewportSize({width:844,height:390});page.on('dialog',d=>d.accept());await page.click('#btn-menu');await page.screenshot({path:'penalty/qa/mobile-landscape-menu.png'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);}
 reports.push({label,loaded,tint,save:save.result,errors});assert.equal(errors.length,0);await page.close();
}
fs.writeFileSync('penalty/qa/results.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));await browser.close();})();
