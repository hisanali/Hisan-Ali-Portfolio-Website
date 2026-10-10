import test from 'node:test';
import assert from 'node:assert/strict';
import {Network} from '../../evermile/network.js';
import {syncRoute} from '../../evermile/multiplayer-route.js';
import {DriveRoom,validPose,roomCode} from '../../evermile/multiplayer-room.js';
const pose={x:2,y:3,z:50,yaw:.1,pitch:0,roll:0,speed:12,steer:.2,seq:1,vehicle:'mercedes',color:'#b51f25'};
test('remote poses reject malformed or unbounded state',()=>{assert.ok(validPose(pose));for(const delta of [{x:NaN},{speed:Infinity},{vehicle:'unknown'},{seq:1.5},{color:'url(x)'},{z:1e20}])assert.ok(!validPose({...pose,...delta}));});
test('invite codes are eight cryptographically sampled characters',()=>{const codes=Array.from({length:100},roomCode);assert.equal(new Set(codes).size,100);for(const code of codes)assert.match(code,/^[A-HJ-NP-Z2-9]{8}$/);});
test('guest route follows repeated host forks and late join reconstructs identical terrain',()=>{
 const settings={seed:'multiplayer-road',destination:'journey',location:'hills',roadWidth:10.6,roadStyle:'normal',autoLane:'left'};
 const host=new Network(settings),guest=new Network(settings);
 for(let i=0;i<5;i++){host.extend(25000);const j=host.junctions.find(j=>j.n===i);host.choose(j,i%2);j.committed=true;j.picked=true;host.done=i+1;syncRoute(guest,host.route);const late=new Network(settings,host.route);for(let z=0;z<j.z+2000;z+=137){assert.equal(guest.x(z),host.x(z));assert.equal(guest.y(z),host.y(z));assert.equal(late.x(z),host.x(z));assert.equal(guest.typeAt(z),host.typeAt(z));}}
});
test('stale or unrelated movement cannot overwrite admitted player',()=>{let received=0;const r=new DriveRoom({}, {remote:()=>received++});r.peer={id:'friend',name:'Friend'};r.peerSeq=4;r.receive({id:'stranger',type:'pose',pose:{...pose,seq:6}});r.receive({id:'friend',type:'pose',pose:{...pose,seq:3}});assert.equal(received,0);r.receive({id:'friend',type:'pose',pose:{...pose,seq:5}});assert.equal(received,1);});
