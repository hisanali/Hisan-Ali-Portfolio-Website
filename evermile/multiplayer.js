import * as T from './vendor/three.module.js';
import {Vehicle} from './vehicle.js?v=20260927-train1';
import {DriveRoom,roomCode,cleanCode,VEHICLES} from './multiplayer-room.js?v=20261010-mp2';
const labels={coupe:'Sports coupé',mercedes:'Mercedes W201',grcorolla:'Toyota GR Corolla',landcruiser:'Land Cruiser',coach:'Coach',bike:'Motorcycle'};
export class Multiplayer {
 constructor(game){
  this.game=game;this.remote=null;this.packet=null;this.lastSend=0;this.lastWorld='';this.savedPause=false;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="drive-room"><div class="room-heading"><div><small>TAKE THE ROAD TOGETHER</small><h2>Drive with a friend</h2></div><button id="room-close" aria-label="Close multiplayer">×</button></div><p>Two drivers. Your own cars. One shared journey.</p><div class="room-fields"><label>Your name<input id="room-name" maxlength="24" autocomplete="nickname" placeholder="Driver"></label><label>Your vehicle<select id="room-car">${VEHICLES.map(v=>`<option value="${v}">${labels[v]}</option>`).join('')}</select></label><label>Paint<select id="room-color"><option value="#b51f25">Racing red</option><option value="#e9e7db">Pearl</option><option value="#335b4c">Forest</option><option value="#333a43">Graphite</option><option value="#7b9ba8">Glacier</option></select></label></div><div id="room-lobby"><button id="room-create" class="room-primary">Create a room ↗</button><div class="room-join"><input id="room-code" aria-label="Room code" placeholder="8-character code" maxlength="8" autocapitalize="characters"><button id="room-join">Join room</button></div></div><div id="room-connected" hidden><p class="room-code-label">INVITE CODE <strong id="room-current"></strong></p><button id="room-drive" class="room-primary">Start driving ↗</button><div class="room-actions"><button id="room-copy">Copy invite link</button><button id="room-meet">Meet my friend</button><button id="room-leave">Leave room</button></div></div><p id="room-status" role="status" aria-live="polite">Create a room, then share its code with your friend.</p><p class="room-note">The host chooses the route. World settings stay shared until you leave. Relaxed co-op: player cars pass through each other.</p></dialog><div id="room-hud" hidden><button id="room-hud-open"></button><button id="room-hud-meet">Meet up ↗</button></div><div id="remote-driver" hidden></div>`);
  this.$=id=>document.getElementById(id);this.dialog=this.$('drive-room');
  const button=document.createElement('button');button.id='multiplayer-btn';button.textContent='MULTIPLAYER';document.querySelector('.bottom-nav').append(button);button.onclick=()=>this.open();const startButton=document.createElement('button');startButton.id='start-multiplayer';startButton.textContent='drive with a friend ↗';document.querySelector('.start-content').append(startButton);startButton.onclick=()=>this.open();
  this.$('room-close').onclick=()=>this.dialog.close();this.$('room-drive').onclick=()=>{this.savedPause=false;this.dialog.close();};this.dialog.addEventListener('close',()=>{game.pause(this.savedPause);});this.dialog.addEventListener('cancel',()=>{});
  this.$('room-car').onchange=e=>game.setting('vehicle',e.target.value);this.$('room-color').onchange=e=>game.setting('color',e.target.value);
  this.$('room-code').oninput=e=>e.target.value=cleanCode(e.target.value);this.$('room-code').onkeydown=e=>{if(e.key==='Enter')this.join(false);};
  this.$('room-create').onclick=()=>this.join(true);this.$('room-join').onclick=()=>this.join(false);
  this.$('room-leave').onclick=async()=>{await this.room?.leave();game.leave();this.updateURL('');this.refresh();};
  this.$('room-meet').onclick=this.$('room-hud-meet').onclick=()=>{if(this.packet){game.meet(this.packet);this.dialog.close();}else this.message('Wait for your friend to connect.');};
  this.$('room-hud-open').onclick=()=>this.open();this.$('room-copy').onclick=async()=>{try{await navigator.clipboard.writeText(this.invite());this.message('Invite link copied. Send it to your friend.');}catch{this.message('Copy this invite link: '+this.invite());}};
  addEventListener('pagehide',()=>this.room?.leave());
  const code=cleanCode(new URL(location.href).searchParams.get('room'));if(code){this.$('room-code').value=code;this.open();}
 }
 get active(){return !!this.room?.code;}
 get guest(){return this.active&&!this.room.host;}
 open(){this.savedPause=this.game.paused();this.game.pause(true);this.$('room-car').value=this.game.settings.vehicle;this.$('room-color').value=this.game.settings.color;this.dialog.showModal();}
 message(text){this.$('room-status').textContent=text;}
 invite(){const u=new URL(location.href);u.search='';u.searchParams.set('room',this.room.code);return u.href;}
 updateURL(code){const u=new URL(location.href);if(code)u.searchParams.set('room',code);else u.searchParams.delete('room');history.replaceState({},'',u);}
 async client(){
  if(this.room)return;
  const [{createClient},response]=await Promise.all([import('./vendor/realtime-client.js'),fetch('/api/multiplayer/config',{cache:'no-store'})]);
  if(!response.ok)throw Error('Online play is unavailable. Please try again shortly.');const config=await response.json();
  const client=createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:20}}});
  this.room=new DriveRoom(client,{world:()=>this.game.world(),pose:()=>this.game.pose(),status:()=>this.refresh(),worldReceived:(w,first,p)=>{this.game.applyWorld(w,first);if(first&&p)this.game.meet(p);},remote:p=>this.receive(p)});
 }
 async join(host){
  if(this.busy)return;const code=host?roomCode():cleanCode(this.$('room-code').value);if(code.length!==8){this.message('Enter the eight-character room code.');return;}
  this.busy=true;this.$('room-create').disabled=this.$('room-join').disabled=true;this.message('Connecting…');
  try{await this.client();this.game.enter(host);await this.room.open(code,host,this.$('room-name').value);this.updateURL(code);this.game.begin();this.refresh();}
  catch(e){this.message(e.message||'Could not connect.');this.game.leave();}
  finally{this.busy=false;this.$('room-create').disabled=this.$('room-join').disabled=false;}
 }
 refresh(){
  const r=this.room;if(this.wasActive&&!r?.code)this.game.leave();this.wasActive=!!r?.code;this.$('room-lobby').hidden=!!r?.code;this.$('room-connected').hidden=!r?.code;this.$('room-hud').hidden=!r?.code;this.$('room-current').textContent=r?.code||'';this.$('room-name').disabled=!!r?.code;
  this.$('room-meet').disabled=!this.packet;this.$('room-hud-meet').disabled=!this.packet;
  this.$('room-hud-open').textContent=r?.peer?`${r.peer.name} · ${r.status==='Two drivers connected'?'connected':'reconnecting'}`:`Room ${r?.code||''} · waiting`;
  this.message(r?.status||'Offline');
 }
 receive(p){
  this.packet=p;this.receivedAt=performance.now();
  if(!p){if(this.remote){this.remote.dispose();this.remote=null;}this.$('remote-driver').hidden=true;this.refresh();return;}
  if(!this.remote||this.remote.type!==p.vehicle){this.remote?.dispose();this.remote=new Vehicle(this.game.scene,p.vehicle,p.color);this.remote.group.rotation.order='YXZ';this.remote.group.position.set(p.x,p.y,p.z);this.remote.group.rotation.set(p.pitch,p.yaw,p.roll);this.remoteColor=p.color;const current=this.remote;current.ready?.then(()=>{if(this.remote===current)current.setColor(this.remoteColor);});}
  if(this.remoteColor!==p.color){this.remoteColor=p.color;this.remote.setColor(p.color);}
 }
 update(dt,now,camera){
  if(this.active&&now-this.lastSend>=100){this.lastSend=now;this.room.publish(this.game.pose());}
  const p=this.packet,r=this.remote;if(!p||!r)return;
  const age=(now-this.receivedAt)/1000,visible=age<3;r.group.visible=visible;this.$('remote-driver').hidden=!visible;if(!visible)return;
  const s=1-Math.exp(-dt*14),ahead=Math.min(.12,age);this.target ||= new T.Vector3();this.target.set(p.x+Math.sin(p.yaw)*p.speed*ahead,p.y,p.z+Math.cos(p.yaw)*p.speed*ahead);
  if(r.group.position.distanceTo(this.target)>30)r.group.position.copy(this.target);else r.group.position.lerp(this.target,s);
  r.group.rotation.y+=Math.atan2(Math.sin(p.yaw-r.group.rotation.y),Math.cos(p.yaw-r.group.rotation.y))*s;r.group.rotation.x+=(p.pitch-r.group.rotation.x)*s;r.group.rotation.z+=(p.roll-r.group.rotation.z)*s;r.update(dt,p.speed,p.steer,!!p.lights,!!p.brake,false);
  const distance=Math.round(r.group.position.distanceTo(this.game.position()));const v=r.group.position.clone().add(new T.Vector3(0,2.8,0)).project(camera);const tag=this.$('remote-driver');tag.hidden=v.z>1||v.z< -1||Math.abs(v.x)>1||Math.abs(v.y)>1;tag.style.transform=`translate(-50%,-100%) translate(${(v.x*.5+.5)*innerWidth}px,${(-v.y*.5+.5)*innerHeight}px)`;tag.textContent=`${p.name} · ${distance} m`;
  if(now-(this.lastHUD||0)>500){this.lastHUD=now;this.$('room-hud-open').textContent=`${p.name} · ${distance} m away`;this.$('room-meet').disabled=this.$('room-hud-meet').disabled=false;}
 }
 status(){return {room:this.room?.code||'',role:this.room?.host?'host':'guest',status:this.room?.status||'Offline',connected:!!this.room?.connected,peer:this.room?.peer?.name||null,remoteVehicle:this.remote?.type||null,remotePosition:this.remote?.group.position.toArray()||null,receivedSequence:this.room?.peerSeq??-1};}
}
