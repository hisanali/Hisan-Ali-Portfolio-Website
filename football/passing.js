import {Vector3} from '../evermile/vendor/three.module.js';
import {advance,groundContact,launchVelocity,BALL} from '../penalty/physics.js';
// Solve against the same drag and turf losses used during the match.
export function groundPassVelocity(start,target,duration){
 const direction=target.clone().sub(start).setY(0),distance=direction.length();direction.normalize();
 let low=0,high=55;
 for(let n=0;n<13;n++){
  const speed=(low+high)/2,p=start.clone().setY(BALL.radius),v=direction.clone().multiplyScalar(speed),spin=new Vector3(v.z/BALL.radius,0,-v.x/BALL.radius),steps=Math.ceil(duration*120),dt=duration/steps;
  for(let i=0;i<steps;i++){advance(p,v,spin,dt);groundContact(p,v,spin,dt);}
  if(p.clone().sub(start).dot(direction)<distance)low=speed;else high=speed;
 }
 return direction.multiplyScalar((low+high)/2);
}
export function planPass(start,receiver,velocity,{power=.5,lofted=false,through=false,dir=1}={}){
 power=Math.max(0,Math.min(1,power));
 const distance=start.distanceTo(receiver),duration=Math.max(.45,Math.min(3,distance/(lofted?12+power*6:12+power*10)));
 const lead=velocity.clone().setY(0).multiplyScalar(Math.min(duration,.9)*(through?.8:.45));if(lead.length()>4)lead.setLength(4);
 const target=receiver.clone().add(lead);if(through)target.z+=dir*(3+power*3);target.x=Math.max(-21,Math.min(21,target.x));target.z=Math.max(1,Math.min(69,target.z));target.y=lofted?.25:BALL.radius;
 let time=lofted?Math.max(.8,start.distanceTo(target)/(11+power*4)):Math.max(.35,start.distanceTo(target)/(12+power*10));
 // A through ball must allow the runner to accelerate into the receiving space.
 if(through){const run=target.clone().sub(receiver).setY(0).length();time=Math.max(time,.25+Math.sqrt(2*run/9.8)+run/12);}
 const kick=lofted?launchVelocity(start,target,time,new Vector3()):groundPassVelocity(start,target,time);
 return {target,duration:time,velocity:kick,spin:lofted?new Vector3():new Vector3(kick.z/BALL.radius,0,-kick.x/BALL.radius)};
}
