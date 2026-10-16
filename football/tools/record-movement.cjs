// Capture full viewport frames: Chrome's screencast recorder can clip the
// bottom controls in mobile landscape. The screenshots include the whole UI.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/hisan/.npm/_npx/5e2e484947874241/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome'}),c=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),p=await c.newPage();await p.goto('http://localhost:8765/football/?debug');await p.waitForFunction(()=>document.body.classList.contains('is-ready'));await p.evaluate(()=>{fb.startMatch();fb.sim(4.8);});await p.waitForTimeout(500);const s=await p.locator('#stick').boundingBox();await p.mouse.move(s.x+s.width/2,s.y+s.height/2);await p.mouse.down();await p.mouse.move(s.x+s.width*.9,s.y+s.height*.48);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'football-frames-')),frames=[];
for(let i=0;i<130;i++){
 if(i===40)await p.mouse.move(s.x+s.width*.77,s.y+s.height*.2);
 if(i===70)await p.mouse.move(s.x+s.width*.85,s.y+s.height*.7);
 if(i===90){await p.mouse.up();await p.keyboard.down('Space');}
 if(i===94)await p.keyboard.up('Space');
 const at=Date.now(),file=path.join(dir,`${String(i).padStart(4,'0')}.jpg`);await p.screenshot({path:file,type:'jpeg',quality:87});frames.push({file,at});await new Promise(r=>setTimeout(r,Math.max(0,50-(Date.now()-at))));
}
const list=frames.map((f,i)=>`file '${f.file}'\nduration ${i+1<frames.length?(frames[i+1].at-f.at)/1000:.05}`).join('\n');fs.writeFileSync(path.join(dir,'frames.txt'),list);
const ff=spawnSync(process.env.FFMPEG||'/opt/homebrew/bin/ffmpeg',['-y','-f','concat','-safe','0','-i',path.join(dir,'frames.txt'),'-vf','fps=30','-c:v','libx264','-crf','23','-an','-movflags','+faststart','football/qa/movement.mp4'],{stdio:'ignore'});if(ff.status!==0)throw Error('FFmpeg failed');await b.close();fs.rmSync(dir,{recursive:true});})().catch(e=>{console.error(e);process.exit(1)});
