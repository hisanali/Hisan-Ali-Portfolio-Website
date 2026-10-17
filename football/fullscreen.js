export function installFullscreen({button,reset,resize,pause,resume}){
 const root=document.documentElement,dialog=document.getElementById('fullscreen-help');
 const current=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const sync=()=>{const active=!!current();button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');button.title=active?'Exit fullscreen':'Enter fullscreen';resize();};
 let previousPause=false;
 const close=()=>{dialog.hidden=true;resume(previousPause);button.focus();};
 const help=()=>{reset();previousPause=pause();dialog.hidden=false;document.getElementById('fullscreen-close').focus();};
 document.getElementById('fullscreen-close').onclick=close;
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}if(e.key==='Tab'){const first=dialog.querySelector('a'),last=document.getElementById('fullscreen-close');if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 button.onclick=async()=>{
  reset();
  try{
   if(current()){await (document.exitFullscreen||document.webkitExitFullscreen).call(document);}
   else{
    const request=root.requestFullscreen||root.webkitRequestFullscreen;
    if(!request){help();return;}
    // Invoke synchronously inside the click so browser user activation is retained.
    await request.call(root);
    if(!current())await new Promise(resolve=>{const done=()=>{clearTimeout(timer);document.removeEventListener('fullscreenchange',done);document.removeEventListener('webkitfullscreenchange',done);resolve();};const timer=setTimeout(done,1200);document.addEventListener('fullscreenchange',done);document.addEventListener('webkitfullscreenchange',done);});
    if(!current()){help();return;}
    if(navigator.maxTouchPoints&&screen.orientation?.lock)screen.orientation.lock('landscape').catch(()=>{});
   }
  }catch{help();}finally{sync();}
 };
 document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
 window.visualViewport?.addEventListener('resize',resize);sync();
}
