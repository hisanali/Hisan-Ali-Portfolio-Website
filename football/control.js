import * as T from '../evermile/vendor/three.module.js';
import { advance, groundContact } from '../penalty/physics.js?v=9';

// Discrete controlled touches followed by free rolling. Possession is an intent
// to take the next touch, not a positional constraint on the ball.
export function controlledTouch(player, ball, dt, time) {
  const speed=Math.hypot(player.vel.x,player.vel.z);
  const heading=speed>.3?Math.atan2(player.vel.x,player.vel.z):player.facing;
  const forward=new T.Vector3(Math.sin(heading),0,Math.cos(heading));
  const offset=ball.p.clone().sub(player.pos).setY(0),distance=offset.length();
  if(distance>1.8||ball.p.y>.65)return {lost:true,touched:false};
  const last=player.touchHeading??heading,turn=Math.abs(Math.atan2(Math.sin(heading-last),Math.cos(heading-last)));
  const period=T.MathUtils.lerp(.34,.23,Math.min(speed/8,1));
  const stopped=speed<.3;
  const due=time>=(player.nextTouch??0)||turn>.45||distance<.22||(stopped&&ball.v.lengthSq()>.04);
  let touched=false;
  if(due&&distance<1.5) {
    const lead=stopped?.4:T.MathUtils.lerp(.38,.6,Math.min(speed/8,1));
    const target=player.pos.clone().addScaledVector(player.vel,period).addScaledVector(forward,lead);
    ball.v.copy(target).sub(ball.p).setY(0).divideScalar(period);
    ball.v.clampLength(0,speed+3.2);
    // A standing player cushions the ball underfoot with the sole.
    if(stopped)ball.v.set(0,0,0);
    ball.spin.set(ball.v.z/.11,0,-ball.v.x/.11);
    player.nextTouch=time+period;player.touchHeading=heading;player.touchCount=(player.touchCount||0)+1;
    player.lastTouchAt=time;player.touchSide=(player.touchSide==='Left'?'Right':'Left');touched=true;
  }
  if(stopped)ball.v.multiplyScalar(Math.exp(-dt*14));
  advance(ball.p,ball.v,ball.spin,dt);groundContact(ball.p,ball.v,ball.spin,dt);
  return {lost:false,touched};
}
