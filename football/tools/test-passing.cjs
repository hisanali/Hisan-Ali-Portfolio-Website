const assert=require('node:assert/strict'),fs=require('node:fs');const{chromium}=require('/Users/hisan/.npm/_npx/5e2e484947874241/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome'}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:8765/football/?debug&v=20');await p.waitForFunction(()=>document.body.classList.contains('is-ready'),null,{timeout:90000});const results=await p.evaluate(()=>{
 fb.startTraining();fb.renderer.setAnimationLoop(null);const results=[];
 for(const distance of [6,12,22,32])for(const power of [0,.5,1])for(const mode of ['ground','through','lob']){
  fb.training.index=2;fb.setupDrill();const passer=fb.controlled,target=fb.players.find(q=>q.team===passer.team&&!q.keeper&&q!==passer);
  for(const q of fb.players){q.busy=0;q.strike=null;q.runTo=null;q.receiveAt=null;q.vel.set(0,0,0);q.stun=10;q.pos.set(q.team===passer.team?-20:20,0,65-q.index*3);}
  passer.stun=target.stun=0;passer.pos.set(-3,0,8);target.pos.set(3,0,8+distance);fb.ball.owner=null;fb.ball.v.set(0,0,0);fb.give(passer);fb.ball.p.copy(passer.pos).setY(.11);fb.pass(passer,target,mode==='lob',mode==='through',power);
  let released=false,received=false,closest=99;for(let n=0;n<360;n++){fb.sim(1/60);if(fb.ball.owner!==passer)released=true;if(released){closest=Math.min(closest,fb.ball.p.distanceTo(target.pos));if(fb.ball.owner===target){received=true;break;}if(fb.ball.owner&&fb.ball.owner!==target)break;}}
  results.push({distance,power,mode,released,received,closest});
 }return results;});fs.writeFileSync('football/qa/passing-v20.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.filter(r=>!r.received)));assert(results.every(r=>r.received),'unopposed passes must reach the receiver');assert.deepEqual(errors,[]);await b.close();console.log(results.length,'unopposed passes received');})().catch(e=>{console.error(e);process.exit(1)});
