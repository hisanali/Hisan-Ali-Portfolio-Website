import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../evermile/vendor/three.module.js';
import {batchStatic} from '../../evermile/mesh-batching.js';
test('Static batching preserves bounds, shared geometry and independently controlled lamps',()=>{
 const g=new T.Group(),material=new T.MeshStandardMaterial(),source=new T.BoxGeometry(1,2,3);
 for(const x of [-4,4]){const m=new T.Mesh(source,material);m.position.set(x,1,2);m.rotation.y=.3;m.castShadow=true;g.add(m);}
 const lamp=new T.Mesh(source,material);lamp.position.y=4;g.add(lamp);const wheel=new T.Group();g.add(wheel);
 g.updateMatrixWorld(true);const before=new T.Box3().setFromObject(g),sourcePoints=source.attributes.position.array.slice();
 batchStatic(g,new Set([lamp]));g.updateMatrixWorld(true);const after=new T.Box3().setFromObject(g);
 assert.equal(g.children.length,3);assert.equal(lamp.parent,g);assert.equal(wheel.parent,g);assert.deepEqual(source.attributes.position.array,sourcePoints);
 assert.ok(before.min.distanceTo(after.min)<1e-6);assert.ok(before.max.distanceTo(after.max)<1e-6);assert.ok(g.children.find(o=>o!==lamp&&o.isMesh).castShadow);
});
