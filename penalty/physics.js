import { Vector3 } from '../evermile/vendor/three.module.js';

// Regulation-sized ball, SI units. Aerodynamics and contact losses are an
// approximation; visual animation never determines a goal or a save.
export const BALL={mass:.43,radius:.11,airDensity:1.225,drag:.25,liftSlope:1.05,groundRestitution:.52,friction:.32,rollingResistance:.55};
const area=Math.PI*BALL.radius**2,inertia=2/3*BALL.mass*BALL.radius**2;
export function acceleration(velocity,spin){
 const speed=velocity.length();const a=new Vector3(0,-9.81,0);if(speed<.01)return a;
 a.addScaledVector(velocity,-.5*BALL.airDensity*BALL.drag*area*speed/BALL.mass);
 const magnus=new Vector3().crossVectors(spin,velocity),omega=spin.length();
 if(magnus.lengthSq()>1e-10&&omega>.01){
  const spinRatio=BALL.radius*omega/speed,cl=Math.min(.32,BALL.liftSlope*spinRatio);
  a.addScaledVector(magnus.normalize(),.5*BALL.airDensity*cl*area*speed**2/BALL.mass);
 }
 return a;
}
export function advance(position,velocity,spin,dt){
 // Midpoint integration: stable drag and Magnus forces at fixed 120 Hz.
 const a=acceleration(velocity,spin),mid=velocity.clone().addScaledVector(a,dt*.5);
 position.addScaledVector(velocity,dt).addScaledVector(a,.5*dt*dt);
 velocity.addScaledVector(acceleration(mid,spin),dt);spin.multiplyScalar(Math.exp(-.12*dt));
}
export function launchVelocity(start,target,duration,spin){
 const v=target.clone().sub(start).divideScalar(duration);v.y+=.5*9.81*duration;
 for(let iteration=0;iteration<9;iteration++){
  const p=start.clone(),w=v.clone(),s=spin.clone(),steps=Math.ceil(duration*240),dt=duration/steps;
  for(let i=0;i<steps;i++)advance(p,w,s,dt);
  const error=target.clone().sub(p);if(error.length()<.0005)break;v.addScaledVector(error,1/duration);
 }
 return v;
}
export function predictAtPlane(start,velocity,spin,z){
 const p=start.clone(),v=velocity.clone(),s=spin.clone(),dt=1/240;
 for(let i=0;i<480;i++){
  const prev=p.clone();advance(p,v,s,dt);
  if(p.z<=z){const f=(prev.z-z)/Math.max(1e-8,prev.z-p.z);return {position:prev.lerp(p,f),time:(i+f)*dt};}
  if(v.z>=0)break;
 }
 return {position:p,time:0};
}
export function groundContact(position,velocity,spin,dt){
 if(position.y>BALL.radius+.001)return false;
 position.y=BALL.radius;
 if(velocity.y<0){
  const impact=-velocity.y,restitution=impact<.75?0:BALL.groundRestitution;
  const normalImpulse=BALL.mass*(1+restitution)*impact;velocity.y=impact*restitution;
  const contactVelocity=velocity.clone().add(new Vector3().crossVectors(spin,new Vector3(0,-BALL.radius,0)));contactVelocity.y=0;
  const desired=contactVelocity.multiplyScalar(-1/(1/BALL.mass+BALL.radius**2/inertia));
  const limit=BALL.friction*normalImpulse;if(desired.length()>limit)desired.setLength(limit);
  velocity.addScaledVector(desired,1/BALL.mass);
  spin.addScaledVector(new Vector3().crossVectors(new Vector3(0,-BALL.radius,0),desired),1/inertia);
 }
 if(velocity.y<.15){
  velocity.y=0;const flat=new Vector3(velocity.x,0,velocity.z),speed=flat.length();
  if(speed>0){flat.multiplyScalar(Math.max(0,speed-BALL.rollingResistance*dt)/speed);velocity.x=flat.x;velocity.z=flat.z;spin.x=velocity.z/BALL.radius;spin.z=-velocity.x/BALL.radius;}
  spin.y*=Math.exp(-1.4*dt);
 }
 return true;
}
export function reflectContact(velocity,normal,restitution=.65,surfaceVelocity=new Vector3()){
 const relative=velocity.clone().sub(surfaceVelocity),vn=relative.dot(normal);
 if(vn>=0)return;
 relative.addScaledVector(normal,-(1+restitution)*vn);velocity.copy(relative).add(surfaceVelocity);
}
