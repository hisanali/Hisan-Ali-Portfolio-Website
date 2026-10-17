// Standard-mapped browser controllers. Keep digital edges separate from analog movement.
export function createGamepad({press,release,cancel,pause,mentality,layout,onStatus}){
 let previous=[],active=null,blocked=false;
 const empty=()=>({x:0,y:0,sprint:false,jockey:false,second:false,finesse:false});let value=empty();
 function reset(){previous=[];value=empty();blocked=true;cancel();}
 function poll(paused=false){
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected&&p.mapping==='standard');
  if(!pad){if(active!==null){reset();onStatus('Keyboard & touch ready');}active=null;return value;}
  if(active!==pad.index){active=pad.index;previous=[];onStatus('Controller connected');}
  const now=pad.buttons.map(b=>b.pressed||b.value>.55);
  if(blocked){if(!now.some(Boolean))blocked=false;previous=now;value=empty();return value;}
  const mapping=layout()==='alternate'?{0:'pass',1:'lob',2:'shoot',3:'through',4:'switch'}:{0:'pass',1:'shoot',2:'lob',3:'through',4:'switch'};
  for(const [i,action]of Object.entries(mapping)){if(now[i]&&!previous[i]&&!paused)press(action);if(!now[i]&&previous[i]&&!paused)release(action);}
  if(now[9]&&!previous[9])pause();if(now[12]&&!previous[12]&&!paused)mentality(1);if(now[13]&&!previous[13]&&!paused)mentality(-1);
  const axis=n=>Math.abs(n||0)<.16?0:Math.sign(n)*(Math.abs(n)-.16)/.84;
  value=paused?empty():{x:axis(pad.axes[0]),y:-axis(pad.axes[1]),sprint:!!now[7],jockey:!!now[6],second:!!now[5],finesse:!!now[5]};previous=now;return value;
 }
 return {poll,reset,get value(){return value;}};
}
