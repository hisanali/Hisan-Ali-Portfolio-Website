import test from 'node:test';
import assert from 'node:assert/strict';
import {traction,longitudinal,steeringMotion,steeringTarget,advancePose,VEHICLE_DYNAMICS} from '../../evermile/handling.js';
function stopping(vehicle,rain){let speed=27.78,d=0;const mu=traction({vehicle,rain});for(let i=0;i<24000&&speed>.25;i++){const a=longitudinal({vehicle,speed,brake:1,mu,hold:true});speed=Math.max(0,speed+a/120);d+=speed/120;}assert.ok(speed<=.25);return d;}
test('Wet and icy roads offer less tire grip than dry asphalt',()=>{assert.ok(traction({rain:1})<traction({rain:0}));assert.ok(traction({snow:true})<traction({rain:1}));assert.ok(traction({offroad:true})<traction({}));});
test('100 km/h stopping distance grows in rain; coach stops more slowly',()=>{const dry=stopping('coupe',0),wet=stopping('coupe',1),bus=stopping('coach',0);assert.ok(dry>30&&dry<50,`dry ${dry}`);assert.ok(wet>dry*1.25,`wet ${wet}`);assert.ok(bus>dry,`bus ${bus}`);console.log({dryMetres:dry.toFixed(1),wetMetres:wet.toFixed(1),coachMetres:bus.toFixed(1)});});
test('Vehicle wheelbase affects low-speed turning; tire budget limits high-speed turns',()=>{for(const vehicle of Object.keys(VEHICLE_DYNAMICS)){let rate=0;for(let i=0;i<600;i++)rate=steeringMotion({vehicle,speed:45,steer:.4,mu:.6,previousRate:rate,dt:1/120}).yawRate;assert.ok(Math.abs(rate*45)<=.6*9.81+.01);}const car=steeringMotion({speed:3,steer:.2,mu:1,dt:1,vehicle:'coupe'});const bus=steeringMotion({speed:3,steer:.2,mu:1,dt:1,vehicle:'coach'});assert.ok(bus.yawRate<car.yawRate);});
test('Brake reverses manually after stop; automation and parking brake hold stationary',()=>{assert.ok(longitudinal({speed:0,brake:1})<0);assert.equal(longitudinal({speed:0,brake:1,hold:true}),0);assert.equal(longitudinal({speed:0,brake:1,parking:true}),0);assert.ok(longitudinal({speed:-3,parking:true})>0);});
test('Long runs remain finite for all vehicles and traction conditions',()=>{for(const vehicle of Object.keys(VEHICLE_DYNAMICS))for(const rain of [0,1]){let speed=0,rate=0;const mu=traction({vehicle,rain});for(let i=0;i<120*60;i++){const throttle=i<3600?1:0,brake=i>=3600?1:0,a=longitudinal({vehicle,speed,throttle,brake,mu});speed=Math.max(-9,Math.min(65,speed+a/120));rate=steeringMotion({vehicle,speed,steer:Math.sin(i*.01)*.4,mu,acceleration:a,previousRate:rate,dt:1/120}).yawRate;assert.ok(Number.isFinite(speed)&&Number.isFinite(rate));}}});

test('Steering cannot rotate a stopped vehicle or carry old yaw into straight driving',()=>{
 for(const vehicle of Object.keys(VEHICLE_DYNAMICS)){
  assert.equal(steeringMotion({vehicle,speed:0,steer:.5,mu:1,previousRate:2,dt:1/120}).yawRate,0);
  assert.equal(steeringMotion({vehicle,speed:25,steer:0,mu:1,previousRate:2,dt:1/120}).yawRate,0);
  assert.ok(steeringMotion({vehicle,speed:-3,steer:.2,mu:1}).yawRate<0);
 }
});
test('Full keyboard steering is progressive and keeps highway turns below the comfort envelope',()=>{
 for(const vehicle of Object.keys(VEHICLE_DYNAMICS)){
  let last=1;
  for(const speed of [0,5,15,30,49]){
   const steer=steeringTarget({vehicle,speed,input:1});assert.ok(steer<=last);last=steer;
   assert.equal(steeringTarget({vehicle,speed,input:-1}),-steer);
   const m=steeringMotion({vehicle,speed,steer,mu:1});assert.ok(Math.abs(m.lateral)<=(vehicle==='coach'?3.2:5.5));
  }
 }
});
test('The rear axle follows a rolling circle without lateral slip; timestep does not change that circle',()=>{
 for(const vehicle of Object.keys(VEHICLE_DYNAMICS)){
  const speed=3,m=steeringMotion({vehicle,speed,steer:.3,mu:1});
  const half=VEHICLE_DYNAMICS[vehicle].wheelbase/2;
  const p=advancePose({x:0,z:0,yaw:0,speed,...m,dt:1e-5});
  assert.ok(Math.abs(p.x-Math.sin(p.yaw)*half)<1e-8,'rear axle must not move sideways');
  let reference;
  for(const hz of [30,60,120]){
   let pose={x:0,z:0,yaw:0};for(let i=0;i<hz*5;i++)pose=advancePose({...pose,speed,...m,dt:1/hz});
   if(reference)assert.ok(Math.hypot(pose.x-reference.x,pose.z-reference.z)<1e-8);reference=pose;
  }
 }
});
test('Braking and cornering share traction immediately, including loss of grip',()=>{
 const m=steeringMotion({speed:25,steer:.4,mu:.4,acceleration:3,previousRate:1,dt:1/120});
 assert.ok(Math.hypot(m.lateral,3)<=.4*9.81+1e-6);
 assert.equal(steeringMotion({speed:25,steer:.4,mu:0}).yawRate,0);
});
