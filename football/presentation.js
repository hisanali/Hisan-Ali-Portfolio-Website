// Match presentation is separate from authoritative simulation. Replays store
// skeletal poses, not just root positions, and never run match AI a second time.
export function installPresentation({T,scene,camera,ball,mobile,canvasTex,LEN,HX}) {
 const history=[];let recording=0,playTime=0,replay=null,goalPlayer=null;
 const mini=document.getElementById('radar'),g=mini.getContext('2d');
 const label=document.getElementById('replay-label');
 const flags=[];
 const poleMat=new T.MeshStandardMaterial({color:0xe3e8dc,roughness:.5});
 const clothMat=new T.MeshStandardMaterial({color:0xe8b63d,side:T.DoubleSide});
 for(const x of [-HX,HX])for(const z of [0,LEN]){
  const pole=new T.Mesh(new T.CylinderGeometry(.018,.018,1.5,6),poleMat);pole.position.set(x,.75,z);scene.add(pole);
  const flag=new T.Mesh(new T.PlaneGeometry(.5,.32,3,1),clothMat);flag.position.set(x+.25,1.3,z);scene.add(flag);flags.push(flag);
 }
 const boardCanvas=document.createElement('canvas');boardCanvas.width=1024;boardCanvas.height=128;
 const bg=boardCanvas.getContext('2d'),boards=new T.CanvasTexture(boardCanvas);boards.colorSpace=T.SRGBColorSpace;boards.wrapS=T.RepeatWrapping;boards.repeat.set(4,1);
 let boardTick=-1,boardTime=0;
 const boardMaterial=new T.MeshBasicMaterial({map:boards,toneMapped:false,side:T.FrontSide});
 function updateBoards(dt,state,players){
  boardTime+=dt;if(Math.floor(boardTime*8)===boardTick)return;boardTick=Math.floor(boardTime*8);
  const home=players.find(p=>p.team.human)?.team,away=home?.opp,phase=Math.floor(boardTime/7)%5;
  const messages=[`${home?.name||'HOME'}  v  ${away?.name||'AWAY'}`,'MAKE EVERY TOUCH COUNT',`${home?.code||'HOME'}  ${home?.score||0} — ${away?.score||0}  ${away?.code||'AWAY'}`,'PLAY  •  CREATE  •  COMPETE','HISANALI.COM / FOOTBALL'];
  const accent=state==='goal'?'#d4ff59':['#61dcf0','#d4ff59','#edf4fa','#5be0b1','#aed6ff'][phase];
  bg.fillStyle='#071b2a';bg.fillRect(0,0,1024,128);bg.fillStyle=accent;
  const shift=boardTime*35%180;for(let x=-180;x<1100;x+=180){bg.globalAlpha=.13;bg.beginPath();bg.moveTo(x+shift,0);bg.lineTo(x+shift+65,0);bg.lineTo(x+shift-10,128);bg.lineTo(x+shift-75,128);bg.fill();}bg.globalAlpha=1;
  bg.fillRect(0,0,1024,5);bg.fillRect(0,123,1024,5);bg.font='800 48px Arial';bg.textAlign='center';bg.textBaseline='middle';bg.fillText(state==='goal'?'GOAL!  •  WHAT A FINISH!':messages[phase].toUpperCase(),512+Math.sin(boardTime*.7)*14,68,940);boards.needsUpdate=true;
 }
 updateBoards(.2,'menu',[]);
 for(const x of [-HX-2,HX+2]){const board=new T.Mesh(new T.PlaneGeometry(LEN,1),boardMaterial);board.rotation.y=x>0?-Math.PI/2:Math.PI/2;board.position.set(x,.6,LEN/2);scene.add(board);}
 for(const z of [-3,LEN+3]){const board=new T.Mesh(new T.PlaneGeometry(HX*2,1),boardMaterial);board.rotation.y=z<0?0:Math.PI;board.position.set(0,.6,z);scene.add(board);}
 // Match officials and broadcast operators: economical articulated silhouettes.
 const officials=[];
 function person(x,z,color,linesman=false){
  const root=new T.Group(),m=new T.MeshStandardMaterial({color}),dark=new T.MeshStandardMaterial({color:0x172127});
  const torso=new T.Mesh(new T.CapsuleGeometry(.2,.43,3,6),m);torso.position.y=1.15;root.add(torso);
  const head=new T.Mesh(new T.SphereGeometry(.13,8,6),new T.MeshStandardMaterial({color:0x9d7254}));head.position.y=1.68;root.add(head);
  for(const side of [-1,1]){const leg=new T.Mesh(new T.CylinderGeometry(.075,.055,.74,6),dark);leg.position.set(side*.12,.43,0);root.add(leg);const arm=new T.Mesh(new T.CylinderGeometry(.06,.05,.53,6),m);arm.position.set(side*.28,1.1,0);root.add(arm);}
  root.position.set(x,0,z);root.visible=true;scene.add(root);if(linesman){const f=new T.Mesh(new T.PlaneGeometry(.28,.22),clothMat);f.position.set(.4,.8,0);root.add(f);}return root;
 }
 officials.push(person(-4,LEN*.45,0xe2d530),person(-HX-1,LEN*.3,0xe2d530,true),person(HX+1,LEN*.7,0xe2d530,true));
 const targetPos=new T.Vector3(),targetLook=new T.Vector3();
 const qa=new T.Quaternion(),qb=new T.Quaternion(),va=new T.Vector3(),vb=new T.Vector3();
 function snapshot(players,B){return {time:playTime,ball:B.p.toArray(),rotation:ball.quaternion.toArray(),players:players.map(p=>({pos:p.root.position.toArray(),rot:p.root.quaternion.toArray(),bones:Object.values(p.bones).map(b=>({q:b.quaternion.toArray(),p:b.position.toArray()}))}))};}
 function mixPosition(out,a,b,t){out.fromArray(a).lerp(vb.fromArray(b),t);}
 function mixRotation(out,a,b,t){out.copy(qa.fromArray(a).slerp(qb.fromArray(b),t));}
 function sample(seconds){
  if(!replay?.frames.length)return null;
  const target=Math.max(replay.frames[0].time,replay.frames.at(-1).time-1.05)+seconds;
  let index=0;while(index<replay.frames.length-2&&replay.frames[index+1].time<target)index++;
  const a=replay.frames[index],b=replay.frames[Math.min(index+1,replay.frames.length-1)];
  return {a,b,t:T.MathUtils.clamp((target-a.time)/Math.max(.001,b.time-a.time),0,1)};
 }
 function apply(frame,players,next=frame,t=0){
  if(!frame)return;mixPosition(ball.position,frame.ball,next.ball,t);mixRotation(ball.quaternion,frame.rotation,next.rotation,t);
  players.forEach((p,i)=>{const a=frame.players[i],b=next.players[i];if(!a||!b)return;
   mixPosition(p.root.position,a.pos,b.pos,t);mixRotation(p.root.quaternion,a.rot,b.rot,t);
   Object.values(p.bones).forEach((bone,j)=>{mixRotation(bone.quaternion,a.bones[j].q,b.bones[j].q,t);mixPosition(bone.position,a.bones[j].p,b.bones[j].p,t);});
   p.root.updateMatrixWorld(true);p.shadow.position.set(p.root.position.x,.012,p.root.position.z);
  });
 }
 let lastPlayers=[];
 return {
  initOfficials(factory){
   for(let i=0;i<officials.length;i++){
    const old=officials[i],rig=factory();rig.pos.copy(old.position);rig.root.position.copy(old.position);rig.root.userData.rig=rig;
    scene.remove(old);old.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material!==clothMat)o.material.dispose();}});
    officials[i]=rig.root;
   }
  },
  reset(){history.length=0;recording=0;playTime=0;replay=null;goalPlayer=null;label.hidden=true;},
  goal(p){goalPlayer=p;replay={frames:history.slice(-48),elapsed:0,live:null};},
  camera(dt,state,remaining,teams,controlled){
   label.hidden=state!=='goal';
   if(state==='walkout'){
    const t=3.5-remaining;if(t<1.1){targetPos.set(-15,7,-3);targetLook.set(2,8,LEN*.6);}else{const p=controlled,heading=p?.facing||0;targetLook.copy(p?.pos||new T.Vector3(0,0,LEN/2));targetPos.copy(targetLook).add(new T.Vector3(Math.sin(heading)*4.6+Math.cos(heading)*2.2,1.9,Math.cos(heading)*4.6-Math.sin(heading)*2.2));targetLook.y=1.1;}label.hidden=false;label.textContent='MATCHDAY • '+teams[0].players.length+' A SIDE';
   }else if(state==='goal'&&replay){
    replay.elapsed+=dt;const t=replay.elapsed,angle=Math.min(2,Math.floor(Math.max(0,t-1.5)/2));
    if(t<1.5){const p=goalPlayer?.pos||ball.position;const heading=goalPlayer?.facing||0;targetPos.copy(p).add(new T.Vector3(Math.sin(heading)*3.4+Math.cos(heading)*2,1.8,Math.cos(heading)*3.4-Math.sin(heading)*2));targetLook.copy(p).y=1.15;label.textContent='GOAL • '+(goalPlayer?.number||'');}
    else{const phase=(t-1.5)%2,frame=sample(phase*.5),p=frame?new T.Vector3().fromArray(frame.a.ball).lerp(vb.fromArray(frame.b.ball),frame.t):ball.position;targetLook.copy(p);if(angle===0)targetPos.copy(p).add(new T.Vector3(-7,3,-9));else if(angle===1)targetPos.set(HX+3,7,p.z);else targetPos.set(0,1.1,p.z>LEN/2?LEN+3:-3);label.textContent='REPLAY 0.5× • '+(angle+1)+'/3';}
   }else{if(replay){replay=null;}return false;}
   camera.position.lerp(targetPos,1-Math.exp(-dt*5));camera.lookAt(targetLook);return true;
  },
  update(dt,players,B,state){
   lastPlayers=players;updateBoards(dt,state,players);
   for(const flag of flags){const a=flag.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,Math.sin(performance.now()*.003+a.getX(i)*9)*.045*(a.getX(i)+.25));a.needsUpdate=true;}
   if(state==='play')playTime+=dt;
   if(state==='play'&&(recording+=dt)>=1/24){recording%=1/24;history.push(snapshot(players,B));if(history.length>120)history.shift();}
   if(state==='goal'&&replay){
    replay.live=snapshot(players,B);
    if(replay.elapsed>=1.5&&replay.frames.length){const phase=(replay.elapsed-1.5)%2,frame=sample(phase*.5);if(frame)apply(frame.a,players,frame.b,frame.t);}
   }
   for(const [i,official]of officials.entries()){
    const rig=official.userData.rig;if(!rig)continue;
    official.visible=state==='play'||state==='restart';rig.shadow.visible=official.visible;
    const target=i===0?new T.Vector3(B.p.x*.45-5,0,T.MathUtils.clamp(B.p.z-6,3,LEN-3)):new T.Vector3(i===1?-HX-1:HX+1,0,T.MathUtils.clamp(B.p.z,2,LEN-2));
    const direction=target.sub(rig.pos),distance=direction.length();rig.vel.copy(direction).multiplyScalar(Math.min(5,distance*1.4)/Math.max(distance,.001));
    rig.pos.addScaledVector(rig.vel,dt);rig.update(dt);
   }
   g.clearRect(0,0,160,104);g.fillStyle='rgba(4,20,16,.65)';g.fillRect(0,0,160,104);g.strokeStyle='#a1b3a477';g.lineWidth=1;g.strokeRect(5,5,150,94);g.beginPath();g.moveTo(80,5);g.lineTo(80,99);g.stroke();g.beginPath();g.ellipse(80,52,14,14,0,0,Math.PI*2);g.stroke();
   for(const p of players){if(p.sentOff)continue;g.fillStyle=p.team.human?'#ef5465':'#f4f8ff';g.beginPath();g.arc(5+p.pos.z/LEN*150,99-(p.pos.x+HX)/(HX*2)*94,p.ring.visible?3.5:2.3,0,Math.PI*2);g.fill();}
   g.fillStyle='#fff16d';g.beginPath();g.arc(5+B.p.z/LEN*150,99-(B.p.x+HX)/(HX*2)*94,2,0,Math.PI*2);g.fill();
  },
  restore(){if(replay?.live)apply(replay.live,lastPlayers);},
 };
}
