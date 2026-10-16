// Each control owns its pointer, so a joystick and a held action work together.
// Cancellation clears the hold without firing a pass/shot.
export function bindHold(element, { down, release, cancel }) {
 let pointer=null;
 const finish=(e,commit)=>{
  if(pointer===null||(e&&e.pointerId!==pointer))return;
  const id=pointer;pointer=null;element.classList.remove('is-down');
  if(element.hasPointerCapture(id))element.releasePointerCapture(id);
  (commit?release:cancel)?.();
 };
 element.addEventListener('pointerdown',e=>{
  if(pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();pointer=e.pointerId;element.setPointerCapture(pointer);
  element.classList.add('is-down');down();
 });
 element.addEventListener('pointerup',e=>finish(e,true));
 element.addEventListener('pointercancel',e=>finish(e,false));
 element.addEventListener('lostpointercapture',e=>finish(e,false));
 return ()=>finish(null,false);
}
export function guardGameGestures(){
 const editable=e=>e.target.closest?.('input,textarea,[contenteditable="true"]');
 for(const name of ['selectstart','contextmenu','dragstart'])document.addEventListener(name,e=>{if(!editable(e))e.preventDefault();});
 // Safari's legacy gesture event can bypass touch-action during a match.
 document.addEventListener('gesturestart',e=>{if(document.body.classList.contains('is-playing'))e.preventDefault();},{passive:false});
}
