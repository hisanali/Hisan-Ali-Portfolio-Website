import assert from 'node:assert/strict';
import {Vector3} from '../../evermile/vendor/three.module.js';
import {steerVelocity} from '../locomotion.js';
function run(hz){const dt=1/hz,p={vel:new Vector3(),pos:new Vector3(),facing:0};let peakAcceleration=0,fastestTurn=0,atOneSecond=0,reversalSpeed=0;
 for(let i=0;i<hz*5;i++){
  const time=i/hz,want=new Vector3(time<2?0:time<3?8:0,0,time<2?8:time<3?0:time<4?-8:0);
  const oldSpeed=p.vel.length();steerVelocity(p,want,dt);p.pos.addScaledVector(p.vel,dt);
  peakAcceleration=Math.max(peakAcceleration,Math.abs(p.accel));if(oldSpeed>7)fastestTurn=Math.max(fastestTurn,Math.abs(p.turnRate));
  if(i===hz-1)atOneSecond=p.vel.length();if(i===3*hz)reversalSpeed=p.vel.length();
 }
 assert(atOneSecond>5&&atOneSecond<7,'takes time to build sprint speed');assert(fastestTurn<2.2,'high speed turns require a wider radius');assert(peakAcceleration<10,'bounded acceleration and braking');assert(p.vel.length()<.01,'fully stops');
 return{position:p.pos.toArray(),peakAcceleration,fastestTurn,atOneSecond,reversalSpeed};}
const a=run(60),b=run(120);assert(new Vector3(...a.position).distanceTo(new Vector3(...b.position))<.3,'frame-rate-independent trajectory');console.log(JSON.stringify({at60Hz:a,at120Hz:b},null,2));
