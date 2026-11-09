/* Website cat. Artwork by Octane0411 / maodie-codex-pet contributors, CC BY 4.0.
 * https://github.com/Octane0411/maodie-codex-pet
 * Original sheet unchanged; website animation and interaction adapted here. */
(() => {
  'use strict';
  if (window.__siteCat) return;
  window.__siteCat = true;
  const preview = ['localhost','127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('preview');
  const desktop = matchMedia('(min-width:1024px) and (hover:hover) and (pointer:fine)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const STORE = 'site-cat-photo-v1', W = 164, H = 150, CELL_W = 192, CELL_H = 208;
  const read = () => { try { return preview ? {} : JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch { return {}; } };
  if (read().away || (!preview && !desktop.matches)) return;
  const style = document.createElement('style');
  style.textContent = `.site-cat{position:fixed;left:0;bottom:0;width:${W}px;height:${H}px;z-index:9000;pointer-events:none;transform:translate3d(var(--x,0px),0,0)}
  .site-cat canvas{width:100%;height:100%;pointer-events:auto;cursor:grab;touch-action:pan-y}
  .site-cat .cat-response{position:absolute;left:50%;top:0;transform:translateX(-50%);font:18px system-ui;color:#bd714f;opacity:0;transition:opacity .2s;pointer-events:none}
  .site-cat.is-purr .cat-response{opacity:1}
  .cat-art-credit{font:11px system-ui;opacity:.65;margin-left:12px;color:inherit}
  @media print{.site-cat{display:none}}
  body.ua-menu-open .site-cat,body.hd-panel-open .site-cat{visibility:hidden}`;
  document.head.appendChild(style);
  const root = document.createElement('div');root.className='site-cat';
  root.innerHTML='<canvas width="328" height="300" tabindex="0" role="button" aria-label="Pet the cat" title="Stroke to pet · click to greet · double-click to dismiss"></canvas><span class="cat-response">♥</span>';
  const canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d');
  const img=new Image();img.src='/assets/cat-realistic/maodie.webp';
  let x=Math.max(12,innerWidth-W-30), target=x, dir=-1, state='idle', phase=0, elapsed=0, nextAt=performance.now()+4500;
  let hover=false, strokes=0, previousX=null, affectionUntil=0, greetingUntil=0, last=0, raf=0, gone=false;
  let pointer={x:innerWidth/2,y:innerHeight/2,t:0};
  const bounds=[];
  function limits(){
    let left=8, bottom=0;
    document.querySelectorAll('.journey-privacy,.journey-privacy > *').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(!r.width||!r.height||r.top>innerHeight||r.bottom<innerHeight-200)return;
      if(r.left<innerWidth/2){
        if(r.right+W+24<innerWidth)left=Math.max(left,r.right+12);
        else bottom=Math.max(bottom,innerHeight-r.top+8);
      }
    });
    root.style.bottom=`${bottom}px`;
    return [left,Math.max(left,innerWidth-W-12)];
  }
  function setState(value){if(state!==value){state=value;elapsed=0;phase=0;}root.dataset.act=value;}
  function selectFrame(now){
    if(reduced.matches)return [0,0];
    if(state==='walk')return [(dir>0?1:2),Math.floor(phase)%8];
    if(now<affectionUntil)return [8,2]; // closed eyes and raised chin
    if(now<greetingUntil)return [3,Math.min(3,Math.floor(elapsed*4)%4)];
    if(state==='sleep')return [5,4];
    if(state==='groom')return [5,1+Math.floor(elapsed*2)%2];
    if(now-pointer.t<1800){
      const dx=pointer.x-(x+W/2), dy=(innerHeight-H/2)-pointer.y;
      const angle=Math.atan2(dx,dy);
      const index=Math.round(((angle+2*Math.PI)%(2*Math.PI))*16/(2*Math.PI))%16;
      return [9+Math.floor(index/8),index%8];
    }
    // Brief blink, with a long still interval instead of cycling unrelated poses.
    return [0,(elapsed%5.3)>5.05?1:0];
  }
  function draw(now){
    const [row,col]=selectFrame(now), b=bounds[row*8+col];
    if(!b)return;
    ctx.clearRect(0,0,328,300);ctx.save();ctx.scale(2,2);
    const scale=state==='walk'?.79:.67;
    const dw=(b.right-b.left+1)*scale,dh=(b.bottom-b.top+1)*scale;
    const breathing=state==='sleep'&&!reduced.matches?Math.sin(now/900)*.6:0;
    ctx.drawImage(img,col*CELL_W+b.left,row*CELL_H+b.top,b.right-b.left+1,b.bottom-b.top+1,(W-dw)/2,H-dh-3-breathing,dw,dh+breathing);
    ctx.restore();root.dataset.frame=`${row}:${col}`;
  }
  function tick(now){
    if(gone)return;
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;elapsed+=dt;
    const [lo,hi]=limits();x=Math.max(lo,Math.min(hi,x));target=Math.max(lo,Math.min(hi,target));
    if(reduced.matches){setState('idle');target=x;}
    else if(now<affectionUntil||hover||now<greetingUntil){setState('idle');target=x;nextAt=now+3000;}
    else if(state==='walk'){
      const d=target-x,step=Math.min(Math.abs(d),58*dt);x+=Math.sign(d)*step;phase+=step/11;
      if(Math.abs(d)<1){setState('idle');nextAt=now+3500+Math.random()*3500;}
    }else if(now>nextAt){
      if(state==='sleep'||state==='groom'){setState('idle');nextAt=now+3000;}
      else{const choice=Math.random();if(choice<.66&&hi-lo>50){target=x>(lo+hi)/2?lo:hi;dir=target>x?1:-1;setState('walk');}
      else{setState(choice<.86?'groom':'sleep');nextAt=now+(state==='sleep'?14000:3000);}}
    }
    root.classList.toggle('is-purr',now<affectionUntil);root.style.setProperty('--x',`${x.toFixed(2)}px`);draw(now);
    raf=requestAnimationFrame(tick);
  }
  canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();affectionUntil=performance.now()+1800;}});
  canvas.addEventListener('pointerenter',()=>{hover=true;strokes=0;previousX=null;});
  canvas.addEventListener('pointerleave',()=>{hover=false;previousX=null;nextAt=performance.now()+2500;});
  canvas.addEventListener('pointermove',e=>{if(previousX!==null)strokes+=Math.min(18,Math.abs(e.clientX-previousX));previousX=e.clientX;if(strokes>24){affectionUntil=performance.now()+1800;strokes=0;}});
  canvas.addEventListener('click',()=>{greetingUntil=performance.now()+1200;elapsed=0;setState('idle');});
  canvas.addEventListener('dblclick',()=>{gone=true;cancelAnimationFrame(raf);root.remove();if(!preview)try{sessionStorage.setItem(STORE,JSON.stringify({away:true}));}catch{}});
  addEventListener('pointermove',e=>{pointer={x:e.clientX,y:e.clientY,t:performance.now()};},{passive:true});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&!gone){last=0;raf=requestAnimationFrame(tick);}});
  desktop.addEventListener('change',()=>{root.hidden=!preview&&!desktop.matches;});
  img.onload=()=>{
    const sample=document.createElement('canvas');sample.width=img.width;sample.height=img.height;const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(img,0,0);const pixels=sc.getImageData(0,0,img.width,img.height).data;
    for(let row=0;row<11;row++)for(let col=0;col<8;col++){
      let left=CELL_W,right=0,top=CELL_H,bottom=0;
      for(let y=0;y<CELL_H;y++)for(let xx=0;xx<CELL_W;xx++)if(pixels[((row*CELL_H+y)*img.width+col*CELL_W+xx)*4+3]>30){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      bounds.push(right>=left?{left,right,top,bottom}:null);
    }
    document.body.appendChild(root);limits();root.style.setProperty('--x',`${x}px`);draw(performance.now());raf=requestAnimationFrame(tick);
    const footer=document.querySelector('footer')||document.body;
    const credit=document.createElement('a');credit.className='cat-art-credit';credit.href='https://github.com/Octane0411/maodie-codex-pet';credit.target='_blank';credit.rel='noopener';credit.textContent='Cat artwork: Octane0411 · CC BY 4.0';footer.appendChild(credit);
  };
  img.onerror=()=>console.warn('Cat artwork could not be loaded.');
})();
