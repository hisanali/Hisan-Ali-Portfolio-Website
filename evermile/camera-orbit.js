import {clamp, damp, angleDifference} from './math.js';

// A temporary look around the car, independent of driving input.
export class CameraOrbit {
 constructor(){this.reset();}
 reset(){this.pointer=null;this.yaw=0;this.pitch=0;this.targetYaw=0;this.targetPitch=0;this.focus=0;this.hold=0;this.moved=false;}
 begin(id,x,y){
  if(this.pointer)return false;
  this.pointer={id,x,y};this.moved=false;this.hold=0;
  return true;
 }
 move(id,x,y,width,height){
  const p=this.pointer;if(!p||p.id!==id)return false;
  const dx=x-p.x,dy=y-p.y;
  if(!this.moved&&Math.hypot(dx,dy)<3)return false;
  this.moved=true;p.x=x;p.y=y;
  this.targetYaw=angleDifference(this.targetYaw-dx/Math.max(width,1)*Math.PI*2,0);
  this.targetPitch=clamp(this.targetPitch+dy/Math.max(height,1)*2,-.18,.95);
  return true;
 }
 end(id){
  if(!this.pointer||this.pointer.id!==id)return;
  this.pointer=null;this.hold=this.moved?.65:0;
 }
 update(dt){
  const held=this.pointer!==null||this.hold>0;
  if(!this.pointer)this.hold=Math.max(0,this.hold-dt);
  if(!held){this.targetYaw=0;this.targetPitch=0;}
  const rate=held?16:3.2;
  this.yaw=angleDifference(this.yaw+angleDifference(this.targetYaw,this.yaw)*(1-Math.exp(-rate*dt)),0);
  this.pitch=damp(this.pitch,this.targetPitch,rate,dt);
  this.focus=damp(this.focus,held&&this.moved?1:0,held?10:3.2,dt);
  if(!held&&Math.abs(this.yaw)<.001&&Math.abs(this.pitch)<.001){this.yaw=0;this.pitch=0;this.focus=0;}
 }
}
