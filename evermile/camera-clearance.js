// Fraction of a camera boom that stays in front of oriented vehicle bounds.
export function boomFraction(target, eye, boxes) {
 let nearest=1;
 for(const b of boxes){
  const c=Math.cos(b.yaw||0),s=Math.sin(b.yaw||0),dx=target.x-b.x,dz=target.z-b.z;
  const origin=[c*dx-s*dz,target.y-b.y,s*dx+c*dz],vx=eye.x-target.x,vz=eye.z-target.z;
  const direction=[c*vx-s*vz,eye.y-target.y,s*vx+c*vz];
  const low=[-b.width/2-.35,-.3,-b.length/2-.35],high=[b.width/2+.35,b.height+.35,b.length/2+.35];
  let enter=0,exit=1;
  for(let k=0;k<3;k++){
   if(Math.abs(direction[k])<1e-8){if(origin[k]<low[k]||origin[k]>high[k]){enter=2;break;}continue;}
   let a=(low[k]-origin[k])/direction[k],z=(high[k]-origin[k])/direction[k];if(a>z)[a,z]=[z,a];
   enter=Math.max(enter,a);exit=Math.min(exit,z);if(enter>exit)break;
  }
  if(enter<=exit&&enter>0&&enter<nearest)nearest=Math.max(.15,enter-.035);
 }
 return nearest;
}
