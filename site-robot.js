(() => {
  if(document.querySelector('.site-robot')) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const robot=document.createElement('div');robot.className='site-robot';robot.dataset.state='idle';
  robot.innerHTML=`<button class="robot-touch" aria-label="Play with the paper ghost"><svg viewBox="0 0 94 124" aria-hidden="true"><defs><linearGradient id="paper-sheet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6ffff" stop-opacity=".9"/><stop offset=".45" stop-color="#e4f1f2" stop-opacity=".55"/><stop offset=".78" stop-color="#d6e1ef" stop-opacity=".62"/><stop offset="1" stop-color="#d5dcee" stop-opacity=".88"/></linearGradient><linearGradient id="paper-fold"><stop stop-color="#b9cbd5" stop-opacity=".65"/><stop offset="1" stop-color="#ffffff" stop-opacity=".85"/></linearGradient><linearGradient id="ghost-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#b2c7d1" stop-opacity=".65"/><stop offset="1" stop-color="#f6ffff" stop-opacity=".9"/></linearGradient><radialGradient id="paper-shadow"><stop stop-color="#28382d" stop-opacity=".18"/><stop offset="1" stop-color="#28382d" stop-opacity="0"/></radialGradient></defs><ellipse cx="47" cy="116" rx="27" ry="5" fill="url(#paper-shadow)"/><g class="robot-upper"><g class="robot-head"><g class="robot-arm-l"><path d="M22 62L7 76L22 73" fill="url(#paper-fold)" stroke="#b6b9b0" stroke-width="1"/></g><g class="robot-arm-r"><path d="M72 62L87 73L73 76" fill="url(#paper-fold)" stroke="#b6b9b0" stroke-width="1"/></g><path d="M20 49Q20 23 46 23Q72 23 74 49L79 101Q69 94 62 104Q54 95 47 104Q39 95 31 103Q24 95 15 101Z" fill="url(#paper-sheet)" stroke="url(#ghost-rim)" stroke-width="1.8" stroke-linejoin="round"/><path d="M61 27Q71 32 73 46L61 41Z" fill="url(#paper-fold)"/><path d="M61 27L61 41L73 46" fill="none" stroke="#c8c9bf" stroke-width=".8"/><path d="M25 50Q27 32 43 30" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" opacity=".85"/><path d="M70 55L73 88" fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round" opacity=".55"/><path d="M31 80L29 96M62 80L64 96" stroke="#d9dacf" stroke-width=".8" fill="none"/><g class="robot-eyes" fill="#293b36"><ellipse cx="34" cy="59" rx="4" ry="7"/><ellipse cx="60" cy="59" rx="4" ry="7"/><circle cx="35" cy="57" r="1.2" fill="white"/><circle cx="61" cy="57" r="1.2" fill="white"/></g><ellipse cx="26" cy="70" rx="5" ry="2" fill="#edc1b4" opacity=".65"/><ellipse cx="68" cy="70" rx="5" ry="2" fill="#edc1b4" opacity=".65"/><path class="ghost-mouth" d="M43 72Q47 77 51 72" stroke="#293b36" stroke-width="1.5" stroke-linecap="round" fill="none"/></g></g></svg></button>`;
  document.body.append(robot);
  let x=innerWidth-130,y=innerHeight-150,target=null,until=performance.now()+1200,last=0,raf=0,gone=false,lastReaction=-Infinity,hoverAt=0;
  const eyes=robot.querySelector('.robot-eyes');
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const floor=()=>{const el=document.querySelector('.journey-privacy');if(el){const r=el.getBoundingClientRect();if(r.height>60&&r.width>150&&r.top>100&&r.top<innerHeight&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none')return r.top-18;}return innerHeight-18;};
  const point=(px,py,peek=false)=>({x:clamp(px,8,innerWidth-102),y:clamp(py,90,floor()-124),peek});
  const state=(name,duration=0)=>{robot.dataset.state=name;until=performance.now()+duration;};
  const paint=()=>{robot.style.translate=`${x}px ${y}px`;};
  const express=name=>{robot.dataset.expression=name;};
  let petDistance=0,petX=null,petAt=0,blinkUntil=0,nextBlink=performance.now()+2200;
  const moveEyes=(cx,cy)=>{eyes.style.transform=`translate(${clamp((cx-x-47)/40,-4,4)}px,${clamp((cy-y-42)/55,-3,3)}px)`;};
  const blocked=p=>[25,68].some(dx=>[30,85].some(dy=>document.elementsFromPoint(p.x+dx,p.y+dy).some(el=>!robot.contains(el)&&el.matches('button,input,textarea,select,nav,[role=dialog]'))));
  const spots=()=>{
    const result=[];
    document.querySelectorAll('.project-card,.featured-work,.made-card,.hero-visual,.about-portrait,.engine-item,main article').forEach(el=>{
      const r=el.getBoundingClientRect();if(r.bottom<180||r.top>innerHeight-120||r.width<90)return;
      if(r.top>165&&r.top<innerHeight-70)result.push(point(r.right-95,r.top-116,true));
      if(r.left>110)result.push(point(r.left-96,clamp(r.top+24,110,innerHeight-155)));
      if(r.right<innerWidth-110)result.push(point(r.right+6,clamp(r.top+24,110,innerHeight-155)));
    });
    if(!result.length)result.push(point(12,innerHeight*.4),point(innerWidth-110,innerHeight*.65));
    return result.filter(p=>!blocked(p));
  };
  let lastActivity=performance.now(),fetches=0,found=false;
  let visits=0;
  const choose=()=>{let options=spots().filter(p=>Math.hypot(p.x-x,p.y-y)>90);const peeks=options.filter(p=>p.peek);if(visits++%2===0&&peeks.length)options=peeks;target=options.length?options[Math.floor(Math.random()*options.length)]:point(x<innerWidth/2?innerWidth-110:12,innerHeight*.45);state(Math.abs(target.y-y)>25?'fly':'walk');};
  const cursor=e=>{lastActivity=performance.now();if(robot.dataset.state==='sleep'&&Math.hypot(e.clientX-x-47,e.clientY-y-60)<170)state('wake',1600);moveEyes(e.clientX,e.clientY);const now=performance.now();if(!reduced.matches&&Math.hypot(e.clientX-x-47,e.clientY-y-45)<120&&now-hoverAt>6000&&['idle','peek'].includes(robot.dataset.state)){hoverAt=now;state('curious',1100);}};
  const ripple=e=>{if(game!=='ready'||reduced.matches||performance.now()-lastReaction<900)return;lastReaction=performance.now();moveEyes(e.detail.x,e.detail.y);target=point(e.detail.x-47,e.detail.y-140);if(blocked(target)){target=spots().sort((a,b)=>Math.hypot(a.x-e.detail.x,a.y-e.detail.y)-Math.hypot(b.x-e.detail.x,b.y-e.detail.y))[0]||point(12,innerHeight-150);}state('curious',650);};
  let greetings=0;
  const hello=()=>{lastActivity=performance.now();if(found||robot.dataset.state==='seek'){found=false;target=null;state('reveal',2000);return;}if(performance.now()<ignoreClickUntil)return;target=null;state(++greetings%2?'happy':'wave',1700);};
  const resize=()=>{const p=point(x,y);x=p.x;y=p.y;target=null;paint();};
  const ball=document.createElement('button');ball.className='paper-ball';ball.type='button';ball.setAttribute('aria-label','Throw paper ball: drag and release, or press Enter');ball.title='Drag and throw · Click to toss';
  ball.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 6L22 3L32 10L36 23L29 34L15 37L5 28L3 16Z" fill="#f9f6ed" stroke="#9ca49b" stroke-width="1.3"/><path d="M10 6L15 18L3 16M15 18L22 3M15 18L29 15L32 10M29 15L25 27L36 23M25 27L15 37M15 18L12 28L25 27M5 28L12 28" fill="none" stroke="#ced0c4" stroke-width="1.2"/><path d="M29 15L25 27L36 23" fill="#e1e3d8"/></svg>';
  document.body.append(ball);
  let game='ready',bx=clamp(x-48,24,innerWidth-24),by=floor()-26,home={x:bx,y:by},ballDrag=null,vx=0,vy=0,flight=0,spin=0,catchUntil=0;
  const ballPaint=()=>{ball.style.translate=`${bx-22}px ${by-22}px`;ball.style.setProperty('--ball-spin',`${spin}deg`);ball.dataset.state=game;};
  const resetBall=()=>{game='ready';ballDrag=null;bx=clamp(home.x,24,innerWidth-24);by=clamp(home.y,120,floor()-10);ballPaint();};
  const toss=(dx=300,dy=-220)=>{if(reduced.matches){resetBall();state('happy',1200);return;}game='flight';flight=0;vx=clamp(dx,-850,850);vy=clamp(dy,-650,500);target=null;state('curious',300);};
  ball.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.stopPropagation();lastActivity=performance.now();home={x:bx,y:by};ballDrag={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),vx:0,vy:0,moved:false};game='held';target=null;ball.setPointerCapture(e.pointerId);state('curious',5000);});
  ball.addEventListener('pointermove',e=>{if(!ballDrag||e.pointerId!==ballDrag.id)return;const now=performance.now(),dt=Math.max(16,now-ballDrag.time)/1000;const dx=e.clientX-ballDrag.x,dy=e.clientY-ballDrag.y;ballDrag.moved ||= Math.hypot(e.clientX-home.x,e.clientY-home.y)>8;ballDrag.vx=ballDrag.vx*.4+dx/dt*.6;ballDrag.vy=ballDrag.vy*.4+dy/dt*.6;ballDrag.x=e.clientX;ballDrag.y=e.clientY;ballDrag.time=now;bx=clamp(e.clientX,24,innerWidth-24);by=clamp(e.clientY,120,floor()-10);moveEyes(bx,by);ballPaint();});
  ball.addEventListener('pointerup',e=>{if(!ballDrag||e.pointerId!==ballDrag.id)return;const d=ballDrag;if(performance.now()-d.time>120){d.vx=0;d.vy=-150;}ballDrag=null;ball.releasePointerCapture(e.pointerId);toss(d.moved?d.vx:(bx>innerWidth/2?-380:380),d.moved?d.vy:-260);});
  ball.addEventListener('pointercancel',()=>{resetBall();state('idle',1000);});
  ball.addEventListener('click',e=>{if(e.detail===0){home={x:bx,y:by};toss(bx>innerWidth/2?-380:380,-260);}});
  const fetchTick=(dt,now)=>{
    if(game==='ready'||game==='held')return;
    if(game==='flight'||game==='chase'){flight+=dt;vy+=320*dt;bx+=vx*dt;by+=vy*dt;spin+=vx*dt*.3;
      if(bx<24||bx>innerWidth-24){bx=clamp(bx,24,innerWidth-24);vx=-Math.sign(vx||1)*Math.max(120,Math.abs(vx)*.92);}
      if(by<120||by>floor()-12){by=clamp(by,120,floor()-12);vy=by>=floor()-12?-Math.max(240,Math.abs(vy)*.88):Math.max(160,Math.abs(vy)*.9);}
      if(flight>.8)game='chase';
    }
    if(game==='flight'||game==='chase'||game==='return'){
      const goal=game==='return'?home:{x:bx,y:by};const p=point(goal.x-47,goal.y-85);const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy),step=Math.min(d,dt*(game==='return'?290:360));
      if(game!=='flight'||flight>.2){state('fly');if(d>1){x+=dx/d*step;y+=dy/d*step;}}
      moveEyes(goal.x,goal.y);
      if(game==='return'){bx=x+47;by=y+85;spin=0;}
      if(d<16&&game==='chase'){game='catch';catchUntil=now+450;state('happy',450);bx=x+47;by=y+85;}
      if(d<4&&game==='return'){resetBall();fetches++;lastActivity=now;state(fetches%3===0?'victory':'wave',fetches%3===0?2200:1800);}
    }else if(game==='catch'&&now>catchUntil){game='return';}
    ballPaint();
  };
  ballPaint();

  const tick=now=>{
    if(gone)return;
    if(game==='ready'&&by>floor()-12){by=floor()-26;home.y=by;ballPaint();}
    if(now>nextBlink){blinkUntil=now+140;nextBlink=now+2800+Math.random()*3000;}
    const mood=robot.dataset.state;
    express(game==='catch'||game==='return'?'proud':game==='flight'||game==='chase'?'excited':mood==='sleep'?'sleepy':mood==='wake'?'surprised':mood==='carried'?'surprised':mood==='charge'?'determined':mood==='pet'?'loved':['happy','wave','dance','jump','victory','reveal'].includes(mood)?'happy':now<blinkUntil?'blink':'calm');const dt=Math.min((now-last)/1000,.05);last=now;
    if(game==='ready'&&!drag&&!charging&&!reduced.matches&&!document.hidden&&!scrolling&&!document.activeElement?.matches('input,textarea,select,[contenteditable=true]')){
      if(now-lastActivity>22000&&robot.dataset.state!=='sleep'){target=null;x=x<innerWidth/2?12:innerWidth-106;y=floor()-130;state('sleep',Infinity);}
      if(now>until&&!['walk','fly'].includes(robot.dataset.state)){if(target)state(Math.abs(target.y-y)>25?'fly':'walk');else choose();}
      if(target&&['walk','fly'].includes(robot.dataset.state)){
        const dx=target.x-x,dy=target.y-y,d=Math.hypot(dx,dy),step=Math.min(d,dt*(robot.dataset.state==='fly'?280:65));
        if(d>1){x+=dx/d*step;y+=dy/d*step;robot.style.setProperty('--robot-lean',`${clamp(dx/35,-8,8)}deg`);}
        if(d<3){const peek=target.peek;target=null;robot.style.setProperty('--robot-lean','0deg');state(peek?'seek':'idle',peek?12000:1800);}
      }
    }
    if(!document.hidden&&!reduced.matches)fetchTick(dt,now);
    paint();raf=requestAnimationFrame(tick);
  };
  let scrollTimer,scrolling=false;
  const onScroll=()=>{lastActivity=performance.now();scrolling=true;if(game==='ready'){target=null;state('idle',400);}clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{scrolling=false;if(game==='ready')state('idle',250);},350);};
  const avoid=e=>{if(!robot.contains(e.target)&&e.target.closest('a,button,input,textarea,select')){const r=e.target.getBoundingClientRect();if(r.bottom>y&&r.top<y+124&&r.left<x+94&&r.right>x){const p=point(r.left>innerWidth/2?r.left-104:r.right+12,y);x=p.x;y=p.y;target=null;paint();}}};
  const motion=()=>{resetBall();target=null;state('idle',1500);};
  document.addEventListener('pointermove',cursor,{passive:true});document.addEventListener('site:ripple',ripple);document.addEventListener('focusin',avoid);window.addEventListener('resize',resize);window.addEventListener('scroll',onScroll,{passive:true});reduced.addEventListener('change',motion);
  const touch=robot.querySelector('.robot-touch');
  let drag=null,charging=false,holdTimer=0,ignoreClickUntil=0;
  const clearHold=()=>{clearTimeout(holdTimer);charging=false;};
  touch.title='Stroke to pet · Drag to carry · Hold to jump · Double-click to tumble';
  touch.setAttribute('aria-label','Paper ghost: click to play, drag to stretch, hold to jump, or double-click to dance');
  touch.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    lastActivity=performance.now();found=robot.dataset.state==='seek';
    resetBall();
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x,y,moved:false};
    target=null;state('idle',2000);touch.setPointerCapture(e.pointerId);
    holdTimer=setTimeout(()=>{if(drag&&!drag.moved){charging=true;state('charge',5000);}},400);
  });
  touch.addEventListener('pointermove',e=>{
    if(!drag&&e.pointerType!=='touch'&&game==='ready'){
      const now=performance.now();if(now-petAt>900)petDistance=0;
      if(petX!==null)petDistance+=Math.abs(e.clientX-petX);petX=e.clientX;petAt=now;
      if(petDistance>85){target=null;state('pet',2200);petDistance=0;}
    }
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(Math.hypot(dx,dy)>7){drag.moved=true;clearHold();state('carried',5000);const p=point(drag.x+dx,drag.y+dy);x=p.x;y=p.y;paint();}
  });
  const release=e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const moved=drag.moved,jump=charging;drag=null;clearHold();
    if(touch.hasPointerCapture(e.pointerId))touch.releasePointerCapture(e.pointerId);
    if(moved||jump){ignoreClickUntil=performance.now()+450;state(jump?'jump':'happy',jump?1100:1300);}else state('idle',1200);
  };
  touch.addEventListener('pointerup',release);
  touch.addEventListener('pointercancel',e=>{drag=null;clearHold();state('idle',1200);});
  touch.addEventListener('click',hello);
  touch.addEventListener('dblclick',e=>{e.preventDefault();target=null;state('dance',3000);});
  touch.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='d'){target=null;state('dance',3000);}if(e.key==='ArrowUp'){e.preventDefault();target=null;state('jump',1100);}});


  window.addEventListener('resize',resetBall);
  resize();raf=requestAnimationFrame(tick);
})();
