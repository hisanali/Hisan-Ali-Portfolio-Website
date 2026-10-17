import{slide2048,canMove2048,minefield,neighbours,revealMine}from'./extra-rules.js?v=1';
const $=(s,r=document)=>r.querySelector(s),active=p=>!p.hidden&&$('[data-game-stage]').classList.contains('is-open');
const best=(key,value)=>{try{const n=Math.max(Number(localStorage.getItem(key))||0,value);localStorage.setItem(key,String(n));return n;}catch{return value;}};
// 2048: one merge per tile per move, no spawn on an unchanged move.
{
 const panel=$('[data-game-panel="tiles"]'),grid=$('[data-tiles-board]',panel),status=$('[data-extra-status]',panel);let board,score,won;
 function spawn(){const free=board.map((v,i)=>v?null:i).filter(i=>i!==null);if(free.length)board[free[Math.floor(Math.random()*free.length)]]=Math.random()<.9?2:4;}
 function render(){grid.replaceChildren(...board.map(v=>{const e=document.createElement('div');e.className='tile-cell';e.dataset.level=v?Math.min(11,Math.log2(v)):0;e.textContent=v||'';e.setAttribute('aria-label',v?String(v):'Empty');return e;}));$('[data-extra-score]',panel).textContent=score;$('[data-tiles-best]',panel).textContent=best('hisan-2048-best',score);status.textContent=!canMove2048(board)?'No moves left. Start a new board.':!won&&board.includes(2048)?(won=true,'2048! Keep playing for a higher tile.'):'Swipe or use the arrow buttons to combine matching tiles.';}
 function move(d){const r=slide2048(board,d);if(r.changed){board=r.board;score+=r.score;spawn();render();}}
 function reset(){board=Array(16).fill(0);score=0;won=false;spawn();spawn();render();}
 $('[data-extra-reset]',panel).onclick=reset;panel.querySelectorAll('[data-tiles-dir]').forEach(b=>b.onclick=()=>move(Number(b.dataset.tilesDir)));
 addEventListener('keydown',e=>{if(!active(panel)||e.target.matches('input,textarea'))return;const d={ArrowLeft:0,ArrowRight:1,ArrowUp:2,ArrowDown:3}[e.key];if(d!==undefined){e.preventDefault();move(d);}});
 let start=null;grid.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY,e.pointerId];grid.setPointerCapture(e.pointerId);});grid.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start[2])return;const x=e.clientX-start[0],y=e.clientY-start[1];start=null;if(Math.hypot(x,y)>24)move(Math.abs(x)>Math.abs(y)?x<0?0:1:y<0?2:3);});grid.addEventListener('pointercancel',()=>start=null);reset();
}
// Minesweeper: first reveal protects its neighbours, flags never reveal a cell.
{
 const panel=$('[data-game-panel="mines"]'),grid=$('[data-mines-board]',panel),status=$('[data-extra-status]',panel);let mines,open,flags,ended,flagMode;
 function render(){const focused=[...grid.children].indexOf(document.activeElement);grid.replaceChildren(...Array.from({length:81},(_,i)=>{const b=document.createElement('button'),n=mines?neighbours(i).filter(j=>mines.has(j)).length:0;b.className='mine-cell'+(open.has(i)?' is-open':'');b.dataset.count=n;b.textContent=flags.has(i)?'⚑':ended&&mines?.has(i)?'●':open.has(i)&&n?n:'';b.setAttribute('aria-label',`Row ${Math.floor(i/9)+1}, column ${i%9+1}${flags.has(i)?', flagged':open.has(i)?`, ${n} neighbouring mines`: ', covered'}`);b.disabled=ended;b.onclick=()=>reveal(i,flagMode);b.oncontextmenu=e=>{e.preventDefault();reveal(i,true)};return b;}));if(focused>=0)grid.children[focused]?.focus({preventScroll:true});$('[data-extra-score]',panel).textContent=10-flags.size;$('[data-mine-mode]',panel).setAttribute('aria-pressed',String(flagMode));}
 function reveal(i,flag){if(ended||open.has(i))return;if(flag){if(flags.has(i))flags.delete(i);else if(flags.size<10)flags.add(i);}else if(!flags.has(i)){mines??=minefield(i);if(revealMine(i,mines,open,flags)){ended=true;status.textContent='Mine found. Try a new field.';}else if(open.size===71){ended=true;status.textContent='Field cleared! All safe squares found.';}else status.textContent=`${open.size} of 71 safe squares revealed.`;}render();}
 function reset(){mines=null;open=new Set();flags=new Set();ended=false;flagMode=false;status.textContent='Reveal a square. Numbers count mines in the eight surrounding squares.';render();}
 $('[data-mine-mode]',panel).onclick=()=>{flagMode=!flagMode;render();};$('[data-extra-reset]',panel).onclick=reset;reset();
}
// Brick Breaker: fixed substeps and circle/rectangle contacts prevent tunnelling.
{
 const panel=$('[data-game-panel="bricks"]'),canvas=$('canvas',panel),g=canvas.getContext('2d'),status=$('[data-extra-status]',panel),toggle=$('[data-bricks-toggle]',panel);let x,y,vx,vy,paddle,bricks,score,lives,phase,keys={},previous=0;
 function reset(){paddle=240;bricks=Array.from({length:40},(_,i)=>({x:11+i%8*58,y:42+Math.floor(i/8)*24,on:true,row:Math.floor(i/8)}));score=0;lives=3;serve();draw();}
 function serve(){x=paddle;y=365;vx=130;vy=-220;phase='ready';status.textContent='Move the paddle, then launch. Clear all 40 bricks.';toggle.textContent='Launch';}
 function update(dt){paddle=Math.max(42,Math.min(438,paddle+((keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0))*340*dt));if(phase!=='play'){if(phase==='ready'){x=paddle;y=365;}return;}
 x+=vx*dt;y+=vy*dt;if(x<8){x=8;vx=Math.abs(vx)}if(x>472){x=472;vx=-Math.abs(vx)}if(y<8){y=8;vy=Math.abs(vy)}
 if(vy>0&&y+8>=380&&y-8<=392&&x>=paddle-48&&x<=paddle+48){y=372;const angle=Math.max(-1,Math.min(1,(x-paddle)/48))*1.05,speed=Math.min(390,Math.hypot(vx,vy)+3);vx=Math.sin(angle)*speed;vy=-Math.cos(angle)*speed;}
 for(const b of bricks){if(!b.on)continue;const cx=Math.max(b.x,Math.min(b.x+52,x)),cy=Math.max(b.y,Math.min(b.y+16,y)),dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<64){b.on=false;score+=10;if(Math.abs(dx)>Math.abs(dy))vx=-vx;else vy=-vy;break;}}
 if(y>432){lives--;if(lives){serve();status.textContent='Ball lost. Launch your next ball.';}else{phase='over';status.textContent='Out of balls. Start a new game.';toggle.textContent='Play again';}}
 if(bricks.every(b=>!b.on)){phase='won';status.textContent='All bricks cleared!';toggle.textContent='Play again';}}
 function draw(){g.fillStyle='#0b1716';g.fillRect(0,0,480,420);for(const b of bricks)if(b.on){g.fillStyle=['#f47a52','#f2b76d','#dfff63','#91cfa9','#9fb8f4'][b.row];g.beginPath();g.roundRect(b.x,b.y,52,16,4);g.fill();}g.fillStyle='#dfff63';g.beginPath();g.roundRect(paddle-42,380,84,12,6);g.fill();g.fillStyle='#fff';g.shadowColor='#dfff63';g.shadowBlur=14;g.beginPath();g.arc(x,y,8,0,Math.PI*2);g.fill();g.shadowBlur=0;$('[data-extra-score]',panel).textContent=score;$('[data-bricks-lives]',panel).textContent=lives;}
 function togglePlay(){if(phase==='over'||phase==='won')reset();phase=phase==='play'?'paused':'play';toggle.textContent=phase==='play'?'Pause':'Resume';status.textContent=phase==='play'?'Keep the ball in play.':'Paused.';}
 function pointer(e){const r=canvas.getBoundingClientRect();paddle=Math.max(42,Math.min(438,(e.clientX-r.left)/r.width*480));}
 canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer(e);});canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||canvas.hasPointerCapture(e.pointerId))pointer(e)});canvas.addEventListener('pointercancel',()=>keys={});
 toggle.onclick=togglePlay;$('[data-extra-reset]',panel).onclick=reset;
 addEventListener('keydown',e=>{if(!active(panel)||e.target.matches('input,textarea'))return;if(['ArrowLeft','ArrowRight','KeyA','KeyD','Space'].includes(e.code)){e.preventDefault();keys[e.code]=true;if(e.code==='Space'&&!e.repeat)togglePlay();}});addEventListener('keyup',e=>keys[e.code]=false);
 function pause(){keys={};if(phase==='play'){phase='paused';toggle.textContent='Resume';status.textContent='Paused.';}}
 addEventListener('games:pause',pause);addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 function frame(now){const dt=Math.min(.04,(now-previous)/1000||0);previous=now;if(active(panel)){for(let t=0;t<dt;t+=1/240)update(Math.min(1/240,dt-t));draw();}else pause();requestAnimationFrame(frame);}reset();requestAnimationFrame(frame);
}
