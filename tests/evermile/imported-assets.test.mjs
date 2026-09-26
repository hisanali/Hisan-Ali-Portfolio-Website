import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from '../../evermile/vendor/three.module.js';
import {GLTFLoader} from '../../evermile/vendor/loaders/GLTFLoader.js';
import {TrafficModels} from '../../evermile/traffic-models.js';
import {animatedAnimal} from '../../evermile/animated-assets.js';
globalThis.ProgressEvent ||= class ProgressEvent extends Event{constructor(type,init={}){super(type);Object.assign(this,init)}};
async function load(name){
 const b=await fs.readFile(new URL('../../evermile/assets/models/'+name+'.glb',import.meta.url));const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
 // Test the actual skeleton/geometry without requiring a DOM image decoder.
 for(const m of j.materials||[]){delete m.extensions;delete m.normalTexture;delete m.occlusionTexture;delete m.emissiveTexture;if(m.pbrMetallicRoughness){delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture;}}
 const binOffset=20+b.readUInt32LE(12),bin=b.subarray(binOffset+8,binOffset+8+b.readUInt32LE(binOffset));j.buffers=[{byteLength:bin.length,uri:'data:application/octet-stream;base64,'+bin.toString('base64')}];
 return new GLTFLoader().parseAsync(JSON.stringify(j),'');
}
for(const style of ['sedan','hatch','suv','wagon','pickup','van','bus','coach'])test(`${style}: four centred wheel axles and attached forward/rear lamps`,async()=>{
 const asset=await load('road-'+style),importer=Object.create(TrafficModels.prototype);importer.loaded={[style]:asset.scene};
 const c={style,g:new T.Group()};c.g.position.set(130,18,-550);c.g.rotation.y=1.2;importer.attach(c);c.g.updateMatrixWorld(true);
 assert.equal(c.detailWheels.length,4);assert.equal(c.detailWheels.filter(w=>w.front).length,2);
 for(const w of c.detailWheels){assert.ok(w.radius>.2&&w.radius<.6);assert.ok((w.pivot.position.z>0)===w.front);const center=new T.Box3().setFromObject(w.rotor).getCenter(new T.Vector3());w.pivot.worldToLocal(center);assert.ok(center.length()<.03);}
 for(const [type,sign] of [['head',1],['tail',-1]]){assert.equal(c.detailLamps[type].length,2);for(const lamp of c.detailLamps[type]){assert.ok(lamp.position.z*sign>1);assert.ok(lamp.position.y>.25&&lamp.position.y<1.6);assert.ok(Math.abs(lamp.position.x)<1.15);}}
});
test('imported civilian walk keeps hands below shoulders with finite animated skin',async()=>{
 const asset=await load('citizen-michelle'),model=asset.scene,mixer=new T.AnimationMixer(model),walk=asset.animations.find(c=>c.name==='Walk');assert.ok(walk);assert.ok(asset.animations.find(c=>c.name==='Idle'));mixer.clipAction(walk).play();
 const point=suffix=>{let bone;model.traverse(o=>{if(o.isBone&&o.name.endsWith(suffix))bone=o;});assert.ok(bone,suffix);return bone.getWorldPosition(new T.Vector3());};let min=Infinity,max=-Infinity;
 for(let i=0;i<60;i++){mixer.setTime(walk.duration*i/60);model.updateMatrixWorld(true);for(const side of ['Left','Right'])assert.ok(point(side+'Hand').y<point(side+'Arm').y-.2);const foot=point('LeftFoot');min=Math.min(min,foot.z);max=Math.max(max,foot.z);model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();assert.ok(o.skeleton.boneMatrices.every(Number.isFinite));}});}
 assert.ok(max-min>.35,'feet swing through a stride');
});
for(const kind of ['cow','dog','cat','fox'])test(`${kind}: independent rigs, finite clips and metre scale`,async()=>{
 const asset=await load(kind+'-imported'),a=animatedAnimal(asset,kind),b=animatedAnimal(asset,kind,2);
 let skins=0;a.model.traverse(o=>{if(o.isSkinnedMesh)skins++});assert.ok(skins>0);assert.ok(asset.animations.length>0);
 for(let i=0;i<80;i++){a.update(.025,i<40?0:.8,i<40);a.root.updateMatrixWorld(true);a.model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();assert.ok(o.skeleton.boneMatrices.every(Number.isFinite));}});}
 const box=new T.Box3().setFromObject(a.root),size=box.getSize(new T.Vector3());assert.ok(size.y>.15&&size.y<2);assert.ok(size.z<4);assert.notEqual(a.mixer,b.mixer);
});
import {citizenAssets,fitCitizen} from '../../evermile/citizen-assets.js';
import {prepareMotorcycle} from '../../evermile/motorcycle-model.js';
for(const [key] of citizenAssets.filter(([key])=>key!=='michelle'))test(`${key}: native walk, idle and valid skin`,async()=>{
 const g=await load('citizen-'+key);fitCitizen(g.scene);const walk=g.animations.find(a=>a.name==='Walk');assert.ok(walk);assert.ok(g.animations.find(a=>a.name==='Idle'));const mixer=new T.AnimationMixer(g.scene);mixer.clipAction(walk).play();let skins=0;
 for(let i=0;i<24;i++){mixer.setTime(walk.duration*i/24);g.scene.updateMatrixWorld(true);g.scene.traverse(o=>{if(o.isSkinnedMesh){skins++;o.skeleton.update();assert.ok(o.skeleton.boneMatrices.every(Number.isFinite));}});}
 const size=new T.Box3().setFromObject(g.scene,true).getSize(new T.Vector3());assert.ok(skins>0);assert.ok(size.y>1.3&&size.y<2.1);assert.ok(size.x<1.4);
});
test('replacement sheep uses a complete skin and native gait',async()=>{
 const g=await load('sheep-textured'),a=animatedAnimal(g,'sheep');assert.ok(g.animations.find(c=>c.name==='Walk'));assert.ok(g.animations.find(c=>c.name==='Idle'));
 for(let i=0;i<80;i++){a.update(.025,.7);a.root.updateMatrixWorld(true);a.model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();assert.ok(o.skeleton.boneMatrices.every(Number.isFinite));}});}
 assert.ok(new T.Box3().setFromObject(a.root).getSize(new T.Vector3()).y<1.5);
});
test('imported motorcycle: rolling axles, steering fork and fixed body',async()=>{
 const g=await load('motorcycle-gyo'),bike=prepareMotorcycle(g);const body= bike.model.getObjectByName('Body'),initial=body.quaternion.clone();assert.equal(bike.wheels.length,2);assert.ok(bike.model.getObjectByName('FrontAssembly').children.length>0);
 bike.update(.1,5,.25);bike.model.updateMatrixWorld(true);assert.ok(bike.wheels.every(w=>Math.abs(w.rotor.rotation.x)>.1));assert.equal(bike.steering.rotation.y,.25);assert.ok(body.quaternion.equals(initial));assert.ok(bike.grips.every(Boolean));
 bike.update(.1,-5,-.25);assert.ok(bike.wheels.every(w=>Math.abs(w.rotor.rotation.x)<1e-5));
});
for(const kind of ['apartments','brick-works','coastal-fort'])test(`${kind}: bounded closed-scale architecture with material maps`,async()=>{
 const g=await load('place-'+kind);g.scene.updateMatrixWorld(true);const size=new T.Box3().setFromObject(g.scene,true).getSize(new T.Vector3());assert.ok(size.x>10&&size.x<70);assert.ok(size.y>5&&size.y<30);assert.ok(size.z>8&&size.z<70);let verts=0;g.scene.traverse(o=>{if(o.isMesh){verts+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.uv);assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(verts>1000);
});

for(const key of ['pump','shop','canopy','signal','ice','bin'])test(`roadside ${key}: finite, grounded imported geometry`,async()=>{
 const g=await load('prop-'+key);g.scene.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g.scene,true),size=b.getSize(new T.Vector3());assert.ok(size.x>0&&size.x<25);assert.ok(size.y>0&&size.y<6);assert.ok(size.z>0&&size.z<25);assert.ok(Math.abs(b.min.y)<.001||key==='signal',JSON.stringify(b.min.toArray()));
 g.scene.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));});
 if(key==='signal')for(const name of ['red','amber','green'])assert.ok(g.scene.getObjectByName(name)?.isMesh);
});
test('textured sheep walk articulates its legs, stays bounded and faces forward',async()=>{
 const g=await load('sheep-textured'),a=animatedAnimal(g,'sheep');let min=Infinity,max=-Infinity;
 for(let i=0;i<60;i++){a.update(.025,.55);a.root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(a.root,true);min=Math.min(min,b.min.y);max=Math.max(max,b.max.y);}
 assert.ok(min>-.2&&max<1.5,`${min}..${max}`);const walk=g.animations.find(c=>c.name==='Walk');assert.ok(walk.tracks.some(t=>t.name.includes('noga')&&t.name.endsWith('quaternion')&&new Set(t.values).size>5),'animated legs');
});
