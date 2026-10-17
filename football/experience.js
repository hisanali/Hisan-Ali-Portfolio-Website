import { fixture } from './clubs.js?v=18';
// Match presentation and coaching are separate from the simulation.
export const shapes={
 '433':[[0,1.2],[-17,11],[-6,10],[6,10],[17,11],[-12,21],[0,18],[12,21],[-14,30],[0,32],[14,30]],
 '442':[[0,1.2],[-17,11],[-6,10],[6,10],[17,11],[-17,22],[-6,20],[6,20],[17,22],[-7,31],[7,31]],
 '4231':[[0,1.2],[-17,11],[-6,10],[6,10],[17,11],[-7,18],[7,18],[-14,27],[0,25],[0,33],[14,27]]
};
export const lessonList=[
 ['Find your feet','Carry the ball for 8 metres. Use WASD / arrows, the left stick, or the touch joystick.','MOVE',8],
 ['Change the pace','Sprint for 6 metres. Hold Shift, RT / R2, or SPRINT while moving.','SPRINT',6],
 ['Keep it moving','Aim towards a teammate and complete a ground pass. Space / J · A / × · PASS.','PASS',1],
 ['Play into space','Complete a through pass to a runner. I · Y / △ · THROUGH.','THROUGH',1],
 ['Finish the attack','Aim and release a shot. Hold K for power, B / ○ on Classic, or SHOOT. Swipe up to chip; down to curl.','SHOOT',1],
 ['Defend the space','Hold jockey for 2 seconds while facing the attacker. Ctrl · LT / L2 · DEFEND.','JOCKEY',2]
];
export function mountExperience(api){
 const $=id=>document.getElementById(id),{settings,save}=api;
 let tab='match',panelReturn=null,previousFocus=null;
 function showTab(name){tab=name;document.querySelectorAll('[data-hub-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.hubTab===name)));document.querySelectorAll('[data-hub-panel]').forEach(p=>p.hidden=p.dataset.hubPanel!==name);$('hub-title').textContent=({match:'Match day',plan:'Your game plan',training:'Make every touch count',settings:'Play your way'})[name];}
 document.querySelectorAll('[data-hub-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.hubTab));
 document.querySelectorAll('[data-option]').forEach(el=>{
  const key=el.dataset.option;el.value=settings[key];
  el.oninput=()=>{settings[key]=el.type==='range'?Number(el.value):el.value;save();sync();api.changed(key);};
 });
 function sync(){
  document.body.dataset.buttonSize=settings.buttonSize;document.body.dataset.layout=settings.controlLayout;document.body.dataset.trainer=settings.trainer;
  document.documentElement.style.setProperty('--pad-opacity',settings.buttonOpacity);
  document.documentElement.style.setProperty('--pad-scale',settings.buttonSize==='large'?1.12:1);
  for(const el of document.querySelectorAll('[data-option]'))el.value=settings[el.dataset.option];
  $('gamepad-layout').textContent=settings.controlLayout==='alternate'?'A / × pass · X / □ shoot · B / ○ lob · Y / △ through':'A / × pass · B / ○ shoot · X / □ lob · Y / △ through';
  $('formation-value').textContent=settings.size==='11'?({433:'4–3–3',442:'4–4–2',4231:'4–2–3–1'})[settings.formation]:settings.size==='7'?'3–2–1':'2–2';
  document.querySelectorAll('[data-option=formation]').forEach(el=>el.disabled=settings.size!=='11');$('formation-note').textContent=settings.size==='11'?'Shape determines your starting positions and support lanes.':'Choose 11 a side to use full-pitch formations.';
  const shape=settings.size==='11'?shapes[settings.formation]:settings.size==='7'?[[0,1],[-12,11],[0,10],[12,11],[-11,24],[11,24],[0,29]]:[[0,1],[-8,12],[8,12],[-7,26],[7,26]];
  $('formation-pitch').innerHTML=shape.map(([x,z],i)=>`<i style="left:${50+x/46*86}%;bottom:${10+z/35*76}%"><b>${i===0?'GK':i+1}</b></i>`).join('');
  $('match-size').textContent=settings.size+' v '+settings.size;$('match-tempo').textContent=settings.pace==='authentic'?'Authentic tempo':'Responsive tempo';
  const [home,away]=fixture(settings.kit);$('fixture-home').textContent=home.name;$('fixture-away').textContent=away.name;$('away-captain').textContent=settings.captain==='messi'?'C. Ronaldo':'L. Messi';
  for(const [selector,club]of [['.home-crest',home],['.away-crest',away]]){const el=document.querySelector(selector);el.style.background=club.shirt;el.style.color=club.ink;el.textContent=club.crest;}
  $('captain-name').textContent=settings.captain==='messi'?'L. Messi':'C. Ronaldo';
  $('match-mentality').textContent=settings.mentality[0].toUpperCase()+settings.mentality.slice(1);
  document.querySelectorAll('[data-mentality]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mentality===settings.mentality)));
 }
 document.querySelectorAll('[data-mentality]').forEach(b=>b.onclick=()=>{settings.mentality=b.dataset.mentality;save();sync();});
 $('train-start').onclick=()=>api.training();$('trainer-retry').onclick=()=>api.retry();$('trainer-exit').onclick=()=>api.exitTraining();
 function openOptions(mode){previousFocus=document.activeElement;panelReturn=api.openOverlay();$('options-dialog').hidden=false;$('options-heading').textContent=mode==='controls'?'Command centre':'Match settings';$('options-close').focus();}
 function closeOptions(){if($('options-dialog').hidden)return;$('options-dialog').hidden=true;api.closeOverlay(panelReturn);previousFocus?.focus();}
 $('open-controls').onclick=()=>openOptions('controls');$('pause-options').onclick=()=>openOptions('settings');$('options-close').onclick=closeOptions;
 $('options-dialog').addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeOptions();}if(e.key==='Tab'){const nodes=[...$('options-dialog').querySelectorAll('button,select,input,a[href]')].filter(n=>!n.disabled),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 $('pause-plan').onclick=()=>{openOptions('settings');$('live-mentality').scrollIntoView({block:'nearest'});};
 let renderedLesson=-2;
 function coach(lesson,progress,complete){
  $('coach').hidden=lesson<0;document.body.classList.toggle('is-training',lesson>=0);
  if(lesson<0){renderedLesson=-2;return;}
  if(renderedLesson!==lesson||complete){const l=lessonList[lesson];$('coach-count').textContent=complete?'TRAINING COMPLETE':`TRAINING ${lesson+1} / ${lessonList.length}`;$('coach-title').textContent=complete?'Ready for kick off':l[0];$('coach-detail').textContent=complete?'You have practised movement, passing, shooting and defending. Return to the match hub to play.':l[1];renderedLesson=lesson;}
  $('coach-progress').style.width=Math.min(100,progress*100)+'%';
 }
 function stats(teams){if(!teams?.length)return;const total=teams.reduce((s,t)=>s+t.matchStats.possession,0)||1;const rows=[['Possession',...teams.map(t=>Math.round(t.matchStats.possession/total*100)+'%')],['Shots',...teams.map(t=>t.matchStats.shots)],['Passes completed',...teams.map(t=>t.matchStats.completed)],['Pass accuracy',...teams.map(t=>t.matchStats.passes?Math.round(t.matchStats.completed/t.matchStats.passes*100)+'%':'—')],['Tackles won',...teams.map(t=>t.matchStats.tackles)]];for(const el of document.querySelectorAll('.match-stats'))el.innerHTML=rows.map(([label,a,b])=>`<div><b>${a}</b><span>${label}</span><b>${b}</b></div>`).join('');}
 sync();showTab(tab);return {sync,coach,stats,closeOptions};
}
