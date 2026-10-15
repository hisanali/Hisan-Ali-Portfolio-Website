import * as T from '../evermile/vendor/three.module.js';
const v=()=>new T.Vector3();
// Analytic two-bone IK. The captured knee/elbow supplies the bend plane;
// only endpoint errors are corrected, preserving the original body mechanics.
function pointBone(bone,child,target){
 const origin=bone.getWorldPosition(v()),direction=child.getWorldPosition(v()).sub(origin).normalize();
 const goal=target.clone().sub(origin).normalize(),delta=new T.Quaternion().setFromUnitVectors(direction,goal);
 const world=bone.getWorldQuaternion(new T.Quaternion()).premultiply(delta),parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();
 bone.quaternion.copy(parent.multiply(world));bone.updateWorldMatrix(false,true);
}
export function solveLimb(upper,lower,end,target,weight=1){
 if(weight<=0)return;
 const a=upper.getWorldPosition(v()),b=lower.getWorldPosition(v()),c=end.getWorldPosition(v()),goal=c.clone().lerp(target,weight);
 const l1=a.distanceTo(b),l2=b.distanceTo(c),axis=goal.clone().sub(a),distance=T.MathUtils.clamp(axis.length(),Math.abs(l1-l2)+.001,l1+l2-.002);axis.normalize();
 let bend=b.clone().sub(a).addScaledVector(axis,-b.clone().sub(a).dot(axis));
 if(bend.lengthSq()<1e-7)bend.set(0,0,1).addScaledVector(axis,-axis.z);bend.normalize();
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const knee=a.clone().addScaledVector(axis,along).addScaledVector(bend,height);
 const orientation=end.getWorldQuaternion(new T.Quaternion());
 pointBone(upper,lower,knee);pointBone(lower,end,goal);
 end.quaternion.copy(end.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(orientation));end.updateWorldMatrix(false,true);
}
export class FootContacts{
 constructor(rig){this.rig=rig;this.states={Left:{},Right:{}};}
 reset(){this.states={Left:{},Right:{}};}
 update(dt,enabled){
  const r=this.rig;
  for(const side of ['Left','Right']){
   const state=this.states[side],foot=r.bones[side+'Foot'],p=foot.getWorldPosition(v());
   if(!enabled){state.last=p;state.lock=null;state.weight=0;continue;}
   const speed=state.last?p.clone().sub(state.last).divideScalar(Math.max(dt,.001)):v();
   if(state.lock&&(p.y>.19||speed.y>.9||p.distanceTo(state.lock)>.28))state.lock=null;
   if(!state.lock&&p.y<.14&&Math.abs(speed.y)<.25&&Math.hypot(speed.x,speed.z)<.65)state.lock=p.clone();
   state.weight=T.MathUtils.damp(state.weight||0,state.lock?1:0,25,dt);
   if(state.lock&&state.weight>.01)solveLimb(r.bones[side+'UpLeg'],r.bones[side+'Leg'],foot,state.lock,state.weight);
   state.last=p;
  }
 }
}
export function reachBall(rig,side,target,weight){
 solveLimb(rig.bones[side+'Arm'],rig.bones[side+'ForeArm'],rig.bones[side+'Hand'],target,weight);
}
