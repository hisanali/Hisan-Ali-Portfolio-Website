import * as T from './vendor/three.module.js';
import {mountImportedWheel,rollWheel} from './wheel-rig.js?v=20260926-transit3';
export function prepareMotorcycle(asset){
 const model=asset.scene.clone(true);model.updateMatrixWorld(true);
 const front=model.getObjectByName('Wheel_F'),rear=model.getObjectByName('Wheel_R');
 const wheels=[mountImportedWheel(front,model,true),mountImportedWheel(rear,model,false)];
 const head=new T.Group();head.position.copy(model.getObjectByName('SteeringPivot').position);head.rotation.x=-.29;model.add(head);const steering=new T.Group();head.add(steering);model.updateMatrixWorld(true);
 for(const o of [model.getObjectByName('FrontAssembly'),wheels[0].pivot,model.getObjectByName('GripL'),model.getObjectByName('GripR')])if(o)steering.attach(o);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;}});
 return {model,steering,wheels,grips:[model.getObjectByName('GripL'),model.getObjectByName('GripR')],update(dt,speed,steer){steering.rotation.y=steer;for(const w of wheels)rollWheel(w,speed*dt,0);}};
}
