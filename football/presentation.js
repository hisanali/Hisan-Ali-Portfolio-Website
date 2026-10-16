// Match presentation is separate from authoritative simulation. Replays store
// skeletal poses, not just root positions, and never run match AI a second time.
export function installPresentation({T,scene,camera,ball,mobile,canvasTex,LEN,HX}) {
 const history=[];let recording=0,replay=null,goalPlayer=null;
 const mini=document.getElementById('radar'),g=mini.getContext('2d');
 const label=document.getElementById('replay-label');
 const poleMat=new T.MeshStandardMaterial({color:0xe3e8dc,roughness:.5});
 const clothMat=new T.MeshStandardMaterial({color:0xe8b63d,side:T.DoubleSide});
 for(const x of [-HX,HX])for(const z of [0,LEN]){
  const pole=new T.Mesh(new T.CylinderGeometry(.018,.018,1.5,6),poleMat);pole.position.set(x,.75,z);scene.add(pole);
  const flag=new T.Mesh(new T.PlaneGeometry(.5,.32,3,1),clothMat);flag.position.set(x+.25,1.3,z);scene.add(flag);
 }
 const boards=canvasTex(1024,128,(g,w,h)=>{g.fillStyle='#102231';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.textAlign='center';g.font='bold 58px Arial';g.fillText('HISAN ALI  •  HISANALI.COM',w/2,85);});
 boards.wrapS=T.RepeatWrapping;boards.repeat.set(8,1);
 for(const x of [-HX-2,HX+2]){
  const board=new T.Mesh(new T.PlaneGeometry(LEN,1),new T.MeshStandardMaterial({map:boards,emissive:0xffffff,emissiveMap:boards,emissiveIntensity:.25,side:T.FrontSide}));board.rotation.y=x>0?-Math.PI/2:Math.PI/2;board.position.set(x,.6,LEN/2);scene.add(board);
 }
 // Match officials and broadcast operators: economical articulated silhouettes.
 const officials=[];
 function person(x,z,color,linesman=false){
  const root=new T.Group(),m=new T.MeshStandardMaterial({color}),dark=new T.MeshStandardMaterial({color:0x172127});
  const torso=new T.Mesh(new T.CapsuleGeometry(.2,.43,3,6),m);torso.position.y=1.15;root.add(torso);
  const head=new T.Mesh(new T.SphereGeometry(.13,8,6),new T.MeshStandardMaterial({color:0x9d7254}));head.position.y=1.68;root.add(head);
  for(const side of [-1,1]){const leg=new T.Mesh(new T.CylinderGeometry(.075,.055,.74,6),dark);leg.position.set(side*.12,.43,0);root.add(leg);const arm=new T.Mesh(new T.CylinderGeometry(.06,.05,.53,6),m);arm.position.set(side*.28,1.1,0);root.add(arm);}
  root.position.set(x,0,z);scene.add(root);if(linesman){const f=new T.Mesh(new T.PlaneGeometry(.28,.22),clothMat);f.position.set(.4,.8,0);root.add(f);}return root;
 }
 officials.push(person(-4,LEN*.45,0xe2d530),person(-HX-1,LEN*.3,0xe2d530,true),person(HX+1,LEN*.7,0xe2d530,true));
 for(const x of [-HX-5,HX+5])for(const z of [LEN*.2,LEN*.8]){
  person(x,z,0x596877);const cam=new T.Mesh(new T.BoxGeometry(.35,.3,.6),new T.MeshStandardMaterial({color:0x1a1d23}));cam.position.set(x,1.45,z+.4);scene.add(cam);
  for(const dx of [-.2,.2]){const tripod=new T.Mesh(new T.CylinderGeometry(.02,.02,1.3,5),poleMat);tripod.position.set(x+dx,.65,z+.4);tripod.rotation.z=dx;scene.add(tripod);}
 }
 const targetPos=new T.Vector3(),targetLook=new T.Vector3();
 function snapshot(players,B){return {ball:B.p.toArray(),rotation:ball.quaternion.toArray(),players:players.map(p=>({pos:p.root.position.toArray(),rot:p.root.quaternion.toArray(),bones:Object.values(p.bones).map(b=>b.quaternion.toArray())}))};}
 function apply(frame,players){if(!frame)return;ball.position.fromArray(frame.ball);ball.quaternion.fromArray(frame.rotation);players.forEach((p,i)=>{const f=frame.players[i];if(!f)return;p.root.position.fromArray(f.pos);p.root.quaternion.fromArray(f.rot);Object.values(p.bones).forEach((b,j)=>b.quaternion.fromArray(f.bones[j]));p.root.updateMatrixWorld(true);});}
 let lastPlayers=[];
 return {
  goal(p){goalPlayer=p;replay={frames:history.slice(-20),elapsed:0,live:null};},
  camera(dt,state,remaining,teams,controlled){
   label.hidden=state!=='goal';
   if(state==='walkout'){
    const t=3.5-remaining;targetPos.set(-9+t*2,2.5,LEN/2-6);targetLook.set(0,1,LEN/2);label.hidden=false;label.textContent='MATCHDAY • '+teams[0].players.length+' A SIDE';
   }else if(state==='goal'&&replay){
    replay.elapsed+=dt;const t=replay.elapsed,angle=Math.min(2,Math.floor(Math.max(0,t-1.5)/2));
    if(t<1.5){const p=goalPlayer?.pos||ball.position;const heading=goalPlayer?.facing||0;targetPos.copy(p).add(new T.Vector3(Math.sin(heading)*3.4+Math.cos(heading)*2,1.8,Math.cos(heading)*3.4-Math.sin(heading)*2));targetLook.copy(p).y=1.15;label.textContent='GOAL • '+(goalPlayer?.number||'');}
    else{const phase=(t-1.5)%2,frame=replay.frames[Math.min(replay.frames.length-1,Math.floor(phase*.4*24))],p=frame?new T.Vector3().fromArray(frame.ball):ball.position;targetLook.copy(p);if(angle===0)targetPos.copy(p).add(new T.Vector3(-7,3,-9));else if(angle===1)targetPos.set(HX+3,7,p.z);else targetPos.set(0,1.1,p.z>LEN/2?LEN+3:-3);label.textContent='REPLAY 0.4× • '+(angle+1)+'/3';}
   }else{if(replay){replay=null;}return false;}
   camera.position.lerp(targetPos,1-Math.exp(-dt*5));camera.lookAt(targetLook);return true;
  },
  update(dt,players,B,state){
   lastPlayers=players;
   if(state==='play'&&(recording+=dt)>1/24){recording=0;history.push(snapshot(players,B));if(history.length>120)history.shift();}
   if(state==='goal'&&replay){
    replay.live=snapshot(players,B);
    if(replay.elapsed>=1.5&&replay.frames.length){const phase=(replay.elapsed-1.5)%2,index=Math.min(replay.frames.length-1,Math.floor(phase*.4*24));apply(replay.frames[index],players);}
   }
   officials[0].position.x=T.MathUtils.damp(officials[0].position.x,B.p.x*.4-4,1,dt);officials[0].position.z=T.MathUtils.damp(officials[0].position.z,B.p.z-5,1,dt);officials[1].position.z=B.p.z*.7;officials[2].position.z=LEN*.3+B.p.z*.7;
   g.clearRect(0,0,160,104);g.fillStyle='rgba(4,20,16,.65)';g.fillRect(0,0,160,104);g.strokeStyle='#a1b3a477';g.lineWidth=1;g.strokeRect(5,5,150,94);g.beginPath();g.moveTo(80,5);g.lineTo(80,99);g.stroke();g.beginPath();g.ellipse(80,52,14,14,0,0,Math.PI*2);g.stroke();
   for(const p of players){if(p.sentOff)continue;g.fillStyle=p.team.human?'#ef5465':'#f4f8ff';g.beginPath();g.arc(5+p.pos.z/LEN*150,99-(p.pos.x+HX)/(HX*2)*94,p.ring.visible?3.5:2.3,0,Math.PI*2);g.fill();}
   g.fillStyle='#fff16d';g.beginPath();g.arc(5+B.p.z/LEN*150,99-(B.p.x+HX)/(HX*2)*94,2,0,Math.PI*2);g.fill();
  },
  restore(){if(replay?.live)apply(replay.live,lastPlayers);},
 };
}
