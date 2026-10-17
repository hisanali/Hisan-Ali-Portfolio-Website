const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/hisan/.npm/_npx/5e2e484947874241/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}),results=[];
 for(const [width,height]of [[1440,900],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|webgl|GL_INVALID/i.test(m.text()))errors.push(m.text())});
  await page.goto('http://localhost:8765/football/?debug');await page.waitForFunction(()=>document.body.classList.contains('is-ready'));
  await page.waitForTimeout(1600);await page.screenshot({path:`football/qa/realism-${width}-stadium.png`});
  await page.click('#btn-camera');assert.equal(await page.locator('#btn-camera').textContent(),'Touchline');
  await page.reload();await page.waitForFunction(()=>document.body.classList.contains('is-ready'));assert.equal(await page.locator('#btn-camera').textContent(),'Touchline');
  await page.click('#btn-camera');await page.click('#play');await page.waitForFunction(()=>fb.state==='play',null,{timeout:20000});
  assert.equal(await page.evaluate(()=>fb.state),'play');
  await page.keyboard.down('KeyD');await page.waitForTimeout(600);await page.keyboard.up('KeyD');
  await page.keyboard.down('Space');await page.waitForTimeout(140);await page.keyboard.up('Space');await page.waitForTimeout(900);
  await page.screenshot({path:`football/qa/realism-${width}-play.png`});
  const canopy=await page.evaluate(()=>{const root=fb.players[0].root.parent;let clipped=0;root.traverse(o=>{if(o.isMesh&&o.material?.clippingPlanes?.length)clipped++});return clipped});assert(canopy>5,'camera-side stand and roof cutaway enabled');
  await page.evaluate(()=>fb.goal());await page.waitForTimeout(2100);await page.click('#btn-pause');
  const pose=()=>page.evaluate(()=>({camera:fb.camera.position.toArray(),ball:fb.ball.p.toArray(),bones:fb.players[3].bones.Hips.position.toArray(),time:document.querySelector('#sb-time').textContent}));
  const first=await pose();await page.waitForTimeout(400);assert.deepEqual(await pose(),first,'paused replay must freeze camera, ball and pose');
  await page.click('#resume');await page.waitForTimeout(250);await page.screenshot({path:`football/qa/realism-${width}-replay.png`});
  await page.click('#skip-replay');await page.waitForTimeout(300);assert(['kickoff','play'].includes(await page.evaluate(()=>fb.state)));
  await page.click('#btn-pause');await page.click('#quit');await page.locator('[data-setting="size"] [data-value="11"]').click();await page.click('#play');await page.waitForFunction(()=>fb.state==='play',null,{timeout:20000});
  assert.equal(await page.evaluate(()=>fb.players.length),22);await page.evaluate(()=>fb.goal());await page.waitForTimeout(2200);assert.deepEqual(errors,[],'no shader or JavaScript errors after changing team size');
  results.push({width,height,canopyMeshes:canopy,cameraPreference:true,pausedReplay:true,rematch22Players:true,errors});console.log('Checks complete:',width);fs.writeFileSync('football/qa/realism.json',JSON.stringify(results,null,2));await context.close();
 }
 await browser.close();fs.writeFileSync('football/qa/realism.json',JSON.stringify(results,null,2));console.log(results);
})().catch(e=>{console.error(e);process.exit(1)});
