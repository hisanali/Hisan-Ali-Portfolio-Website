import * as T from '../evermile/vendor/three.module.js';
import { solveLimb } from '../penalty/motion.js?v=9';
export { solveLimb, reachBall } from '../penalty/motion.js?v=9';
export const gaitClips=['walk','jog','dribble-jog','sprint','backpedal','strafe-left','strafe-right'];
const profiles=new Map();
// Calibrate from the actual retargeted skeleton, once per model. Align all
// running blends at the left leg's forward reach, then advance by metres moved.
export function calibrateGait(key,model,mixer,clips,bones){
 if(profiles.has(key))return profiles.get(key);
 const result={};model.updateMatrixWorld(true);
 const left=new T.Vector3(),right=new T.Vector3(),hip=new T.Vector3();
 for(const name of gaitClips){
  const action=clips[name];if(!action)continue;
  mixer.stopAllAction();action.reset().setEffectiveWeight(1).play();
  let min=Infinity,max=-Infinity,peak=0,floor=Infinity;
  for(let i=0;i<48;i++){
   mixer.setTime(i/48*action.getClip().duration);model.updateMatrixWorld(true);
   bones.LeftFoot.getWorldPosition(left);bones.RightFoot.getWorldPosition(right);floor=Math.min(floor,left.y,right.y);bones.Hips.getWorldPosition(hip);left.sub(hip);
   const extension=name.startsWith('strafe')?left.x*(name==='strafe-left'?-1:1):left.z*(name==='backpedal'?-1:1);
   min=Math.min(min,extension);if(extension>max){max=extension;peak=i/48;}
  }
  result[name]={offset:peak,floor:floor/model.scale.y,stride:T.MathUtils.clamp((max-min)*2.15/model.scale.y,name==='walk'?.9:name==='sprint'?2.6:1.5,name==='walk'?2.1:name==='sprint'?4.8:3.6)};
 }
 mixer.stopAllAction();mixer.setTime(0);profiles.set(key,result);return result;
}
export function advanceGait(player,weights,speed,dt){
 let stride=0,total=0,groundOffset=0;
 for(const name of gaitClips){const w=weights[name]||0;stride+=(player.gaitProfile[name]?.stride||2.8)*w;groundOffset+=Math.max(0,(player.gaitProfile[name]?.floor||.1)-.1)*w;total+=w;}
 const scale=player.model.scale.y||1;
 if(total>.001)player.gait=(player.gait+speed*dt/(stride/total*scale))%1;
 player.groundOffset=T.MathUtils.damp(player.groundOffset||0,groundOffset*scale,10,dt);
 for(const name of gaitClips){const a=player.clips[name],profile=player.gaitProfile[name];if(!a||!profile)continue;
  a.setEffectiveTimeScale(0);a.time=((player.gait+profile.offset)%1)*a.getClip().duration;
 }
}
export function trackPlay(player,ball,dt){
 const target=Math.atan2(ball.x-player.pos.x,ball.z-player.pos.z)-player.facing;
 const yaw=T.MathUtils.clamp(Math.atan2(Math.sin(target),Math.cos(target)),-.55,.55);
 player.lookYaw=T.MathUtils.damp(player.lookYaw||0,yaw,4,dt);
 const head=player.bones.Head,parent=head.parent.getWorldQuaternion(new T.Quaternion()).invert();
 const axis=new T.Vector3(0,1,0).applyQuaternion(parent);
 head.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(axis,player.lookYaw));head.updateWorldMatrix(false,true);
}
export class FootContacts{
 constructor(player){this.rig=player;this.reset();}
 reset(){this.states={Left:{},Right:{}};}
 update(dt,enabled){
  if(dt<=0)return;
  const r=this.rig;
  for(const side of ['Left','Right']){
   const state=this.states[side],foot=r.bones[side+'Foot'],p=foot.getWorldPosition(new T.Vector3());
   const vertical=state.previous?(p.y-state.previous.y)/dt:0;
   if(!enabled){state.previous=p;state.lock=null;state.weight=0;continue;}
   state.age=(state.age||0)+dt;
   const speed=r.vel.length(),reach=speed>5?.4:.3;
   const hip=r.bones[side+'UpLeg'].getWorldPosition(new T.Vector3()),knee=r.bones[side+'Leg'].getWorldPosition(new T.Vector3());
   const legReach=hip.distanceTo(knee)+knee.distanceTo(p)-.012;
   if(state.lock&&(p.y>.23||vertical>1.1||p.distanceTo(state.lock)>reach||hip.distanceTo(state.lock)>legReach||state.age>.32)){state.lock=null;state.cooldown=.09;}
   state.cooldown=Math.max(0,(state.cooldown||0)-dt);
   // Detect the downward arrival, even when the animation and travel speeds
   // differ slightly. Lock in world space until toe-off, never to the root.
   if(!state.lock&&!state.cooldown&&p.y<.17&&vertical<.6){const contact=p.clone().setY(.09);if(hip.distanceTo(contact)<=legReach){state.lock=contact;state.age=0;state.weight=.8;}}
   state.weight=T.MathUtils.damp(state.weight||0,state.lock?1:0,28,dt);
   if(state.lock)solveLimb(r.bones[side+'UpLeg'],r.bones[side+'Leg'],foot,state.lock,state.weight*.9);
   else if(p.y<.075){const floor=p.clone();floor.y=.075;solveLimb(r.bones[side+'UpLeg'],r.bones[side+'Leg'],foot,floor,.8);}
   state.previous=p;
  }
 }
}

export function steerVelocity(p, want, dt) {
  const s = Math.hypot(p.vel.x, p.vel.z), ws = Math.hypot(want.x, want.z);
  let h = s > .25 ? Math.atan2(p.vel.x, p.vel.z) : (ws > .01 ? Math.atan2(want.x, want.z) : p.facing);
  const wh = ws > .01 ? Math.atan2(want.x, want.z) : h; let diff = Math.atan2(Math.sin(wh - h), Math.cos(wh - h));
  const maxTurn=Math.min(9,12/Math.max(1,s))*dt,turn=T.MathUtils.clamp(diff,-maxTurn,maxTurn);h+=turn;
  let target = ws * Math.max(0, Math.cos(Math.min(Math.abs(diff), Math.PI / 2)));
  if (Math.abs(diff) > 2.1 && s > 3.5) target = 0; // plant and turn
  const rate = target > s ? (s < 4 ? 6.8 : 4.2) : 9.8;
  const ns = s + T.MathUtils.clamp(target - s, -rate * dt, rate * dt);
  p.vel.set(Math.sin(h) * ns, 0, Math.cos(h) * ns); p.turnAngle=diff;p.turnRate = turn / Math.max(dt, 1e-4); p.accel = (ns - s) / Math.max(dt, 1e-4);
}
