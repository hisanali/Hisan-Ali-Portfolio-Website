import assert from 'node:assert/strict';
import {Vector3} from '../../evermile/vendor/three.module.js';
import {controlledTouch} from '../control.js';
function run(dt) {
 const p={pos:new Vector3(),vel:new Vector3(0,0,5),facing:0};
 const ball={p:new Vector3(0,.11,.4),v:new Vector3(),spin:new Vector3()};
 let maxGap=0,freeSteps=0,maxStep=0,time=0;
 for(let i=0;i<Math.round(3/dt);i++) {
  time+=dt;p.pos.addScaledVector(p.vel,dt);const before=ball.p.clone();const result=controlledTouch(p,ball,dt,time);
  assert(!result.lost,'steady dribbling must retain possession');
  if(!result.touched)freeSteps++;
  maxGap=Math.max(maxGap,Math.hypot(ball.p.x-p.pos.x,ball.p.z-p.pos.z));maxStep=Math.max(maxStep,before.distanceTo(ball.p));
 }
 assert(freeSteps>2/dt,'ball must roll freely between discrete touches');
 assert(maxGap<1.2,'steady touches stay within foot reach');
 assert(maxStep<9*dt,'no positional snapping');
 // Simulate the fastest captain decelerating from a full dribble.
 p.vel.set(0,0,5.65);
 for(let i=0;i<Math.round(.65/dt);i++){time+=dt;p.vel.z=Math.max(0,p.vel.z-11*dt);p.pos.addScaledVector(p.vel,dt);controlledTouch(p,ball,dt,time);}
 assert(ball.v.length()<.2,'braking must cushion the ball as the carrier stops');
 const coast=ball.p.z;p.vel.set(0,0,0);
 for(let i=0;i<1/dt;i++){time+=dt;controlledTouch(p,ball,dt,time);}
 assert(ball.v.length()<.1,'standing player cushions a rolling ball');assert(ball.p.z>=coast-.1);
 const displaced=ball.p.clone().add(new Vector3(4,0,0));ball.p.copy(displaced);
 assert(controlledTouch(p,ball,dt,time).lost,'ball beyond reach must become loose');assert(ball.p.equals(displaced),'losing possession must not teleport ball');
 return {maxGap,maxStep,freeSteps,touches:p.touchCount,position:p.pos.z};
}
const fast=run(1/120),slow=run(1/60);assert(Math.abs(fast.maxGap-slow.maxGap)<.12,'touch integration stable across tick rates');console.log(JSON.stringify({fast,slow},null,2));
