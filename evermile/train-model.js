import {mountImportedWheel,rollWheel} from './wheel-rig.js?v=20260926-supplied7';
export function prepareTrain(asset){
 const model=asset.scene.clone(true),nodes=[];
 model.traverse(o=>{if(/^TrainWheel_\d+$/.test(o.name))nodes.push(o);if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 const wheels=nodes.map(o=>mountImportedWheel(o,model,false));
 return {model,wheels,update(dt,speed){for(const w of wheels)rollWheel(w,speed*dt);}};
}
