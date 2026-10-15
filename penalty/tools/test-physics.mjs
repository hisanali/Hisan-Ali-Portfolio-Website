import assert from 'node:assert/strict';
import { Vector3 } from '../../evermile/vendor/three.module.js';
import { BALL,acceleration,advance,launchVelocity,groundContact,reflectContact } from '../physics.js';
let shots=0,maxError=0;
for(const duration of [.42,.65,.9])for(const x of [-3,0,3])for(const y of [.25,1.2,2.2])for(const curl of [-12,0,12]){
 const start=new Vector3(0,.11,11),target=new Vector3(x,y,0),spin=new Vector3(5,-curl*3.2,0),v=launchVelocity(start,target,duration,spin),p=start.clone(),w=spin.clone();
 const n=Math.ceil(duration*120),dt=duration/n;for(let i=0;i<n;i++)advance(p,v,w,dt);
 const error=p.distanceTo(target);maxError=Math.max(maxError,error);assert(error<.025,`Launch drift ${error}`);shots++;
}
const forward=new Vector3(0,0,-30),a=acceleration(forward,new Vector3());assert(a.z>0);assert.equal(a.y,-9.81);
const left=acceleration(forward,new Vector3(0,30,0)),right=acceleration(forward,new Vector3(0,-30,0));assert(left.x<0&&right.x>0);assert(Math.abs(left.x+right.x)<1e-9);
const kinetic=(v,s)=>.5*BALL.mass*v.lengthSq()+.5*(2/3*BALL.mass*BALL.radius**2)*s.lengthSq();
for(const spin of [new Vector3(),new Vector3(80,25,0),new Vector3(-80,-20,20)]){
 const p=new Vector3(0,.08,0),v=new Vector3(4,-7,-19),before=kinetic(v,spin);groundContact(p,v,spin,1/120);assert.equal(p.y,BALL.radius);assert(v.y>=0);assert(kinetic(v,spin)<=before+1e-6);
}
const reflected=new Vector3(0,0,-25);reflectContact(reflected,new Vector3(0,0,1),.76);assert.equal(reflected.z,19);
const slow=new Vector3(.5,0,0),p=new Vector3(0,.11,0),spin=new Vector3();for(let i=0;i<240;i++){advance(p,slow,spin,1/120);groundContact(p,slow,spin,1/120);}assert(slow.length()<.01);
console.log(JSON.stringify({shots,maxTargetErrorMetres:maxError,drag:'opposes motion',spin:'symmetric Magnus bend',bounce:'no added kinetic energy',rolling:'comes to rest'}));
