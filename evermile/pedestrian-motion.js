import * as T from './vendor/three.module.js';
// Match the two arm segments to a held object without changing their length.
export function reachHand(upper,lower,hand,target,pole,weight=1){
 upper.updateWorldMatrix(true,true);
 const a=upper.getWorldPosition(new T.Vector3()),b=lower.getWorldPosition(new T.Vector3()),c=hand.getWorldPosition(new T.Vector3());
 const l1=a.distanceTo(b),l2=b.distanceTo(c),direction=target.clone().sub(a),distance=T.MathUtils.clamp(direction.length(),Math.abs(l1-l2)+.001,l1+l2-.001);direction.normalize();
 const bend=pole.clone().sub(a);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const elbow=a.clone().addScaledVector(direction,along).addScaledVector(bend,height),end=a.clone().addScaledVector(direction,distance);
 const rotate=(bone,child,goal)=>{
  const origin=bone.getWorldPosition(new T.Vector3()),from=child.getWorldPosition(new T.Vector3()).sub(origin).normalize(),to=goal.clone().sub(origin).normalize();
  const q=new T.Quaternion().setFromUnitVectors(from,to).multiply(bone.getWorldQuaternion(new T.Quaternion()));
  if(bone.parent)q.premultiply(bone.parent.getWorldQuaternion(new T.Quaternion()).invert());
  bone.quaternion.slerp(q,weight);bone.updateWorldMatrix(true,true);
 };
 rotate(upper,lower,elbow);rotate(lower,hand,end);
}
