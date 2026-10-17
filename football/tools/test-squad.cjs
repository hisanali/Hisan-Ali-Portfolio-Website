const assert=require('node:assert/strict'),fs=require('node:fs');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/hisan/.npm/_npx/5e2e484947874241/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8765/football/?debug');await page.waitForFunction(()=>document.body.classList.contains('is-ready'),null,{timeout:60000});
 await page.locator('[data-setting="size"] [data-value="11"]').click();await page.click('#play');await page.waitForTimeout(2800);await page.screenshot({path:'football/qa/squad-entrance.png'});await page.waitForFunction(()=>fb.state==='play',null,{timeout:20000});
 const result=await page.evaluate(async()=>{
  const T=await import('/evermile/vendor/three.module.js');fb.renderer.setAnimationLoop(null);fb.ball.owner=null;
  const result={players:fb.players.length,squad:fb.players.filter(p=>p.rigKind==='squad').length,profiles:[...new Set(fb.players.filter(p=>!p.star).map(p=>p.profile.id))],motion:[],garmentsOpaque:true,shirtSourcesUnique:false};
  for(const p of fb.players){p.busy=10;p.vel.set(0,0,0);p.pos.set(20,0,60);p.update(0);for(const m of p.surfaces)if(['T_shirt','Classic_Shorts'].includes(m.material.name)&&m.material.transparent)result.garmentsOpaque=false;}
  const shirts=fb.players.filter(p=>p.rigKind==='squad'&&!p.keeper&&p.team===fb.players[0].team).map(p=>p.surfaces.find(m=>m.material.name==='T_shirt').material.map.source);result.shirtSourcesUnique=new Set(shirts).size===shirts.length;
  for(const kind of ['squad','ronaldo','messi']){
   const p=fb.players.find(p=>p.rigKind===kind&&!p.keeper);p.busy=0;p.facing=0;p.pos.set(0,0,15);
   for(const speed of [1.7,3.8,5.5,7.6,0]){
    p.vel.set(0,0,speed);let locked=0,maxPlantError=0,maxFrameDisplacement=0,last=null;
    for(let frame=0;frame<120;frame++){
     p.pos.addScaledVector(p.vel,1/60);p.update(1/60);
     for(const side of ['Left','Right']){const s=p.contacts.states[side],foot=p.bones[side+'Foot'].getWorldPosition(new T.Vector3());if(s.lock&&s.weight>.85){locked++;maxPlantError=Math.max(maxPlantError,foot.distanceTo(s.lock));}}
     const head=p.bones.Head.getWorldPosition(new T.Vector3());if(last)maxFrameDisplacement=Math.max(maxFrameDisplacement,head.distanceTo(last));last=head;
    }
    const moving=Object.entries(p.blend).filter(([name,w])=>w>.1&&p.gaitProfile[name]);
    const phases=moving.map(([name])=>((p.clips[name].time/p.clips[name].getClip().duration-p.gaitProfile[name].offset)%1+1)%1);
    result.motion.push({kind,speed,locked,maxPlantError,maxFrameDisplacement,phases,finite:Object.values(p.bones).every(b=>b.matrixWorld.elements.every(Number.isFinite))});
   }
   p.busy=10;p.pos.set(20,0,60);p.update(0);
  }
  const lineup=fb.players.filter(p=>!p.star&&!p.keeper).slice(0,5);
  lineup.forEach((p,i)=>{p.pos.set((i-2)*1.05,0,35);p.facing=0;p.vel.set(0,0,0);p.play('idle',1,0);p.mixer.setTime(.3+i*.2);p.update(0);});
  fb.camera.position.set(.6,1.6,41);fb.camera.lookAt(0,1.05,35);fb.renderer.render(lineup[0].root.parent,fb.camera);
  return result;
 });
 await page.screenshot({path:'football/qa/squad-closeup.png'});
 await page.evaluate(()=>{for(const p of fb.players){p.facing=Math.PI;p.update(0);}fb.renderer.render(fb.players[0].root.parent,fb.camera);});await page.screenshot({path:'football/qa/squad-numbers.png'});
 fs.writeFileSync('football/qa/squad.json',JSON.stringify({...result,errors},null,2));assert.equal(result.players,22);assert.equal(result.squad,20);assert(result.profiles.length>=10,'squad build diversity');assert(result.shirtSourcesUnique,'each shirt number has an independent texture source');assert(result.garmentsOpaque,'clothing must write depth to cover the body');
 for(const motion of result.motion){assert(motion.finite,'finite skeleton');assert(motion.maxFrameDisplacement<.22,'continuous head movement');if(motion.speed>0){assert(motion.locked>0,motion.kind+' makes ground contact at '+motion.speed);assert(motion.maxPlantError<.07,'planted foot stays near contact');}if(motion.phases.length>1)assert(Math.abs(motion.phases[0]-motion.phases[1])<.01,'blend strides stay in phase');}
 assert.deepEqual(errors,[]);fs.writeFileSync('football/qa/squad.json',JSON.stringify({...result,errors},null,2));console.log(JSON.stringify(result,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
