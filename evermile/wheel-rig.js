import * as T from './vendor/three.module.js';

// All vehicle rigs use +Z forward, +Y up and +X along the axle.
// Spin a single rotor, never each mesh's Euler angles (their modelling axes differ).
export function rotorFor(pivot) {
 const rotor=new T.Group();rotor.name='WheelRotor';
 for(const part of [...pivot.children])if(!part.userData.fixed)rotor.add(part);
 pivot.add(rotor);pivot.userData.rotor=rotor;return rotor;
}
export function mountImportedWheel(wheel,frame,front=false) {
 frame.updateWorldMatrix(true,true);
 const bounds=new T.Box3();const tyre=[];wheel.traverse(o=>{if(o.isMesh&&/tire|tyre/i.test(o.name))tyre.push(o);});
 for(const mesh of tyre.length?tyre:[wheel])bounds.union(new T.Box3().setFromObject(mesh));
 const center=frame.worldToLocal(bounds.getCenter(new T.Vector3()));
 const pivot=new T.Group();pivot.name=wheel.name+'Steering';pivot.position.copy(center);frame.add(pivot);pivot.updateWorldMatrix(true,false);
 const rotor=new T.Group();rotor.name='WheelRotor';pivot.add(rotor);rotor.attach(wheel);
 // Calipers follow steering but remain stationary relative to the suspension.
 const brakes=[];wheel.traverse(o=>{if(o.isMesh&&/^brake(?:_\d+)?$|caliper/i.test(o.name))brakes.push(o);});
 for(const brake of brakes)pivot.attach(brake);
 const size=bounds.getSize(new T.Vector3()),radius=Math.max(size.y,size.z)/2;
 return {pivot,rotor,front,radius:radius||.34};
}
export function rollWheel(rig,distance,steer=0) {
 if(rig.front)rig.pivot.rotation.y=steer;
 rig.rotor.rotation.x=(rig.rotor.rotation.x+distance/rig.radius)%(2*Math.PI);
}
export function motorcycleLean(lateralAcceleration) {
 return -Math.max(-.65,Math.min(.65,Math.atan2(lateralAcceleration,9.81)));
}
