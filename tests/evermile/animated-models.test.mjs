import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {GLTFLoader} from '../../evermile/vendor/loaders/GLTFLoader.js';
import * as T from '../../evermile/vendor/three.module.js';
async function load(name){const b=await fs.readFile(new URL('../../evermile/assets/models/'+name+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
for(let i=0;i<6;i++)test(`pedestrian ${i}: planted stance, lowered arms, continuous loop, finite skin`,async()=>{
 const g=await load('pedestrian-'+i),m=new T.AnimationMixer(g.scene),clip=g.animations.find(a=>a.name==='Walk');assert.ok(clip);assert.ok(g.animations.find(a=>a.name==='Idle'));m.clipAction(clip).play();
 const position=name=>g.scene.getObjectByName(name).getWorldPosition(new T.Vector3());
 let minFoot=Infinity,maxFoot=-Infinity,first,last;
 for(let frame=0;frame<=96;frame++){
  m.setTime(frame/96*clip.duration);g.scene.updateMatrixWorld(true);
  const l=position('lFoot'),r=position('rFoot');minFoot=Math.min(minFoot,l.y,r.y);maxFoot=Math.max(maxFoot,l.y,r.y);
  assert.ok(Math.min(l.y,r.y)<.11,'one foot stays planted');assert.ok(l.y>0&&r.y>0,'ankles never penetrate ground');
  for(const side of ['l','r'])assert.ok(position(side+'Hand').y<position(side+'Arm').y-.25,'arms do not flip above shoulders');
  if(frame===0)first=l.clone();if(frame===96)last=l.clone();
  g.scene.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isSkinnedMesh){o.skeleton.update();assert.ok(o.skeleton.boneMatrices.every(Number.isFinite));}});
 }
 assert.ok(maxFoot-minFoot>.065,'feet lift during swing');assert.ok(first.distanceTo(last)<.002,'loop closes without a jump');
 m.setTime(0);g.scene.updateMatrixWorld(true);const z0=position('lFoot').z;m.setTime(clip.duration*.3);g.scene.updateMatrixWorld(true);assert.ok(Math.abs((z0-position('lFoot').z)-.31)<.015,'stance matches intended travel distance');
});
for(const kind of ['cow','sheep','dog','cat'])test(`${kind}: valid articulated mesh with complete limb controls`,async()=>{
 const g=await load(kind);for(const n of ['Neck','Head','Tail'])assert.ok(g.scene.getObjectByName(n),n);for(let i=0;i<(kind==='cat'?2:4);i++){assert.ok(g.scene.getObjectByName('Hip'+i));assert.ok(g.scene.getObjectByName('Knee'+i));}
 g.scene.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g.scene),s=b.getSize(new T.Vector3());assert.ok(s.y>.25&&s.y<2.5);assert.ok(s.z>.25&&s.z<4);g.scene.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));});
});
import {reachHand} from '../../evermile/pedestrian-motion.js';
test('umbrella hand reaches the handle with unbroken arm lengths',async()=>{
 const g=await load('pedestrian-0');const m=new T.AnimationMixer(g.scene);m.clipAction(g.animations.find(a=>a.name==='Walk')).play();m.setTime(.4);g.scene.updateMatrixWorld(true);
 const bones=['lArm','lForearm','lHand'].map(n=>g.scene.getObjectByName(n)),point=b=>b.getWorldPosition(new T.Vector3()),lengths=[point(bones[0]).distanceTo(point(bones[1])),point(bones[1]).distanceTo(point(bones[2]))];
 const target=new T.Vector3(.1,1.68,.18);reachHand(...bones,target,new T.Vector3(.42,1.18,.3));
 assert.ok(point(bones[2]).distanceTo(target)<.002);assert.ok(Math.abs(point(bones[0]).distanceTo(point(bones[1]))-lengths[0])<1e-5);assert.ok(Math.abs(point(bones[1]).distanceTo(point(bones[2]))-lengths[1])<1e-5);
});
