// Transport only. No accounts or persistent player data; the invite code identifies a room.
export const VEHICLES = ['coupe','mercedes','grcorolla','landcruiser','coach','bike'];
export const cleanCode = value => String(value || '').toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,8);
export function roomCode(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>a[n%a.length]).join('');}
export function validPose(p){return p && VEHICLES.includes(p.vehicle) && /^#[\da-f]{6}$/i.test(p.color) && ['x','y','z','yaw','pitch','roll','speed','steer','seq'].every(k=>Number.isFinite(p[k])) && Math.abs(p.x)<1e7 && Math.abs(p.z)<1e7 && Math.abs(p.y)<1e5 && Math.abs(p.speed)<150 && Math.abs(p.steer)<2 && Number.isSafeInteger(p.seq);}
export class DriveRoom {
 constructor(client, hooks={}){this.client=client;this.hooks=hooks;this.id=crypto.randomUUID();this.code='';this.seq=0;this.generation=0;this.status='Offline';this.peer=null;this.connected=false;}
 emit(status){this.status=status;this.hooks.status?.(this);}
 async open(code,host,name){
  await this.leave();const generation=++this.generation;
  this.code=cleanCode(code);if(this.code.length!==8)throw Error('Enter the eight-character room code.');
  this.host=host;this.name=String(name||'Driver').trim().slice(0,24)||'Driver';this.hostId=host?this.id:null;this.accepted=host;this.peerSeq=-1;this.seq=0;
  this.channel=this.client.channel('evermile:v1:'+this.code,{config:{broadcast:{self:false,ack:false},presence:{key:this.id}}});
  const current=()=>generation===this.generation;
  this.channel.on('presence',{event:'sync'},()=>{if(current())this.presence();})
   .on('broadcast',{event:'room'},({payload:p})=>{if(current())this.receive(p);});
  this.everConnected=false;this.emit('Connecting…');
  this.channel.subscribe(async status=>{
   if(!current())return;
   if(status==='SUBSCRIBED'){
    this.connected=true;
    try{const result=await this.channel.track({id:this.id,host:this.host,name:this.name});if(!current())return;if(result!=='ok')throw Error('Presence unavailable');}catch{if(current())this.fail('Could not join the room. Please try again.');return;}
    this.everConnected=true;
    this.emit(this.host?'Waiting for your friend…':'Joining room…');if(!this.host)this.send({type:'hello',name:this.name});
   }else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){this.connected=false;this.emit('Connection interrupted — reconnecting…');this.hooks.remote?.(null);}
  });
  this.joinDeadline=Date.now()+12000;this.lastPeer=Date.now();
  this.timer=setInterval(()=>{
   if(!current())return;
   if(!this.everConnected&&Date.now()>this.joinDeadline){this.fail('Could not connect. Check your connection and try again.');return;}
   if(!this.host&&!this.accepted){if(Date.now()>this.joinDeadline){this.fail('Room not found. Ask your friend to create it first.');return;}this.send({type:'hello',name:this.name});}
   if(this.host&&this.peer)this.sendWorld();
   if(this.peer&&this.accepted)this.publish(this.hooks.pose?.());
   if(this.peer&&Date.now()-this.lastPeer>7000){this.emit('Friend disconnected — waiting to reconnect…');this.hooks.remote?.(null);}
  },1000);
 }
 send(payload){if(!this.connected||!this.channel)return;this.channel.send({type:'broadcast',event:'room',payload:{...payload,id:this.id}}).catch(()=>{});}
 presence(){
  const members=Object.values(this.channel.presenceState()).flat();this.members=members;
  if(!this.host){const host=members.find(p=>p.host&&p.id!==this.id);if(host){this.hostId=host.id;this.send({type:'hello',name:this.name});}}
  if(this.host&&this.peer&&!members.some(p=>p.id===this.peer.id)){this.peer=null;this.hooks.remote?.(null);this.emit('Waiting for your friend…');}
  if(!this.host&&this.accepted&&!members.some(p=>p.id===this.hostId))this.emit('Host disconnected — waiting to reconnect…');
 }
 receive(p){
  if(!p||typeof p.id!=='string'||p.id===this.id)return;
  if(this.host&&p.type==='hello'){
   if(this.peer&&this.peer.id!==p.id){this.send({type:'full',target:p.id});return;}
   if(!this.peer){this.peer={id:p.id,name:String(p.name||'Friend').slice(0,24)};this.peerSeq=-1;}
   this.lastPeer=Date.now();this.send({type:'welcome',target:p.id,name:this.name,world:this.hooks.world?.(),pose:this.hooks.pose?.()});this.emit('Two drivers connected');return;
  }
  if(!this.host&&p.id===this.hostId&&p.target===this.id&&p.type==='full'){this.fail('This room already has two drivers.');return;}
  if(!this.host&&p.id===this.hostId&&p.target===this.id&&p.type==='welcome'){
   const first=!this.accepted;this.accepted=true;this.peer={id:p.id,name:String(p.name||'Host').slice(0,24)};this.lastPeer=Date.now();this.hooks.worldReceived?.(p.world,first,p.pose);this.emit('Two drivers connected');return;
  }
  if(p.id!==this.peer?.id)return;
  if(p.type==='bye'){if(this.host){this.peer=null;this.hooks.remote?.(null);this.emit('Waiting for your friend…');}else this.fail('The host ended this drive. Create or join another room.');return;}
  if(!this.host&&p.type==='world'){this.lastPeer=Date.now();this.hooks.worldReceived?.(p.world,false);return;}
  if(p.type==='pose'&&validPose(p.pose)&&p.pose.seq>this.peerSeq){this.peerSeq=p.pose.seq;this.lastPeer=Date.now();this.remotePose=p.pose;this.hooks.remote?.({...p.pose,name:this.peer.name});if(this.status!=='Two drivers connected')this.emit('Two drivers connected');}
 }
 sendWorld(){this.send({type:'world',world:this.hooks.world?.()});}
 publish(pose){if(this.accepted&&this.peer)this.send({type:'pose',pose:{...pose,seq:++this.seq}});}
 async fail(message){await this.leave();this.emit(message);}
 async leave(){
  this.send({type:'bye'});++this.generation;clearInterval(this.timer);const channel=this.channel;this.channel=null;this.connected=false;this.accepted=false;this.peer=null;this.remotePose=null;this.code='';this.hooks.remote?.(null);
  if(channel)await this.client.removeChannel(channel);this.emit('Offline');
 }
}
