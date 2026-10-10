import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {DriveRoom,roomCode} from '../evermile/multiplayer-room.js';
const response=await fetch('https://hisanali.com/api/multiplayer/config');const config=await response.json();
const clients=Array.from({length:3},()=>createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}}));
const pose=(vehicle='mercedes')=>({x:20,y:3,z:50,yaw:.3,pitch:0,roll:0,speed:12,steer:.1,seq:0,vehicle,color:'#b51f25'});
const seen=[{}, {}, {}],world={settings:{seed:'test'},route:{picks:[0,1],done:1,picked:[0]},hour:12};
const rooms=clients.map((client,i)=>new DriveRoom(client,{world:()=>world,pose:()=>pose(),remote:p=>seen[i].pose=p,worldReceived:w=>seen[i].world=w}));
async function until(fn,label){const end=Date.now()+15000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out: '+label);}
try{
 const code=roomCode();await rooms[0].open(code,true,'Host');await until(()=>rooms[0].connected,'host subscription');await rooms[1].open(code,false,'Guest');await until(()=>rooms[1].accepted&&rooms[0].peer,'guest admission');
 assert.deepEqual(seen[1].world,world);rooms[0].publish(pose());rooms[1].publish(pose('grcorolla'));await until(()=>seen[0].pose&&seen[1].pose,'two-way poses');assert.equal(seen[0].pose.vehicle,'grcorolla');assert.equal(seen[1].pose.vehicle,'mercedes');
 await rooms[2].open(code,false,'Third');await until(()=>rooms[2].status.includes('already has two'),'capacity rejection');assert.ok(!rooms[2].code);
 await rooms[1].leave();await until(()=>!rooms[0].peer,'guest removal');await rooms[1].open(code,false,'Guest rejoined');await until(()=>rooms[1].accepted&&rooms[0].peer,'rejoin');rooms[1].publish(pose('bike'));await until(()=>seen[0].pose?.vehicle==='bike','vehicle after rejoin');
 rooms[1].connected=false;await rooms[1].channel.untrack();await until(()=>!rooms[0].peer,'temporary presence loss');rooms[1].connected=true;await rooms[1].channel.track({id:rooms[1].id,host:false,name:'Guest rejoined'});await until(()=>rooms[0].peer,'presence recovery');
 await rooms[0].leave();await until(()=>rooms[1].status.includes('host ended'),'host exit');console.log('PASS: live Supabase admission, shared world, two-way movement, independent vehicles, full-room rejection, leave/rejoin, presence recovery, host exit');
}finally{await Promise.all(rooms.map(r=>r.leave()));await Promise.all(clients.map(c=>c.removeAllChannels()));}
