import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../evermile/vendor/three.module.js';
import {rotorFor,mountImportedWheel,rollWheel,motorcycleLean} from '../../evermile/wheel-rig.js';
const close=(a,b,e=1e-5)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('rolling preserves tyre axle, centre and stationary brake caliper',()=>{
 const frame=new T.Group(),source=new T.Group();source.rotation.y=Math.PI;frame.add(source);
 const wheel=new T.Group();wheel.name='wheel_fl';wheel.position.set(.8,.34,-1.3);wheel.rotation.x=-Math.PI/2;source.add(wheel);
 const tire=new T.Mesh(new T.CylinderGeometry(.34,.34,.22,48).rotateZ(Math.PI/2));tire.name='tire';wheel.add(tire);
 const caliper=new T.Mesh(new T.BoxGeometry(.03,.07,.08));caliper.name='brake';caliper.position.set(.1,.2,0);wheel.add(caliper);
 const rig=mountImportedWheel(wheel,frame,true);frame.updateMatrixWorld(true);const center=rig.pivot.position.clone(),brake=caliper.getWorldPosition(new T.Vector3());
 for(let i=0;i<120;i++){rollWheel(rig,.03,0);frame.updateMatrixWorld(true);const b=new T.Box3().setFromObject(tire),size=b.getSize(new T.Vector3());close(size.x,.22);assert.ok(b.getCenter(new T.Vector3()).distanceTo(center)<1e-5);assert.ok(caliper.getWorldPosition(new T.Vector3()).distanceTo(brake)<1e-5);}
 const before=rig.rotor.rotation.x;rollWheel(rig,-.12);close(rig.rotor.rotation.x,before-.12/rig.radius);
});
test('steering direction follows vehicle forward axis; rolling contact opposes travel',()=>{
 const pivot=new T.Group(),mesh=new T.Mesh(new T.CylinderGeometry(.4,.4,.2,24));mesh.rotation.z=Math.PI/2;pivot.add(mesh);const rotor=rotorFor(pivot);const rig={pivot,rotor,front:true,radius:.4};rollWheel(rig,.004,.3);
 assert.ok(new T.Vector3(0,0,1).applyQuaternion(pivot.quaternion).x>0);
 // A point at the bottom travels backwards relative to the axle for +Z driving.
 assert.ok(new T.Vector3(0,-.4,0).applyQuaternion(rotor.quaternion).z<0);
 close(mesh.rotation.z,Math.PI/2);
});
test('motorcycle centre of mass banks inward for both turn directions and settles upright',()=>{
 for(const lateral of [-8,-2,2,8]){const top=new T.Vector3(0,1,0).applyAxisAngle(new T.Vector3(0,0,1),motorcycleLean(lateral));assert.equal(Math.sign(top.x),Math.sign(lateral));}
 close(motorcycleLean(0),0);
});
