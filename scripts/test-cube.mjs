import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {FACES, SOLVED, NORMALS,position,validate,inverse,rotateFace,correctOrientation} from '../tools/rubiks-cube/cube-core.js';
const require=createRequire(import.meta.url),Cube=require('../tools/rubiks-cube/vendor/cube.js');
require('../tools/rubiks-cube/vendor/solve.js');
assert.equal(validate(SOLVED,Cube),null);
assert.match(validate('R'+SOLVED.slice(1),Cube),/exactly 9/);
let flipped=SOLVED.split('');[flipped[7],flipped[19]]=[flipped[19],flipped[7]];assert.match(validate(flipped.join(''),Cube),/flipped/);
const twisted=new Cube();twisted.co[0]=1;assert.match(validate(twisted.asString(),Cube),/twisted/);
const swapped=new Cube();[swapped.ep[0],swapped.ep[1]]=[swapped.ep[1],swapped.ep[0]];assert.match(validate(swapped.asString(),Cube),/swapped/);
// Independently compare every 3D sticker's physical endpoint against the solver's facelet model.
let checked=0;
const base=Cube.random().asString();
for(const f of FACES)for(const suffix of ['',"'",'2']){const move=f+suffix,axis=new THREE.Vector3(...NORMALS[f]),angle=-Math.PI/2*(suffix==='2'?2:suffix==="'"?-1:1),expected=Cube.fromString(base).move(move).asString(),result=Array(54);
FACES.forEach((face,fi)=>{for(let r=0;r<3;r++)for(let c=0;c<3;c++){const p=new THREE.Vector3(...position(face,r,c)),n=new THREE.Vector3(...NORMALS[face]);if(p.dot(axis)>.5){p.applyAxisAngle(axis,angle).round();n.applyAxisAngle(axis,angle).round();}const targetFace=FACES.find(k=>n.equals(new THREE.Vector3(...NORMALS[k])));let targetIndex;for(let rr=0;rr<3;rr++)for(let cc=0;cc<3;cc++)if(p.equals(new THREE.Vector3(...position(targetFace,rr,cc))))targetIndex=FACES.indexOf(targetFace)*9+rr*3+cc;result[targetIndex]=base[fi*9+r*3+c];}});assert.equal(result.join(''),expected,move);assert.equal(Cube.fromString(base).move(move).move(inverse(move)).asString(),base);checked++;}
Cube.initSolver();for(let i=0;i<12;i++){const cube=Cube.random();assert.equal(validate(cube.asString(),Cube),null);assert.ok(cube.clone().move(cube.solve()).isSolved());}
console.log(`PASS: ${checked} animated turn mappings, inverses, 12 random solves, colour counts, flipped edge, twisted corner, parity.`);

assert.equal(rotateFace('123456789'),'741852963');
let recovered=0;
for(let i=0;i<20;i++){
 const source=Cube.random().asString();
 const photographed=FACES.map((_,face)=>{let f=source.slice(face*9,face*9+9);for(let turn=0;turn<(i+face)%4;turn++)f=rotateFace(f);return f;}).join('');
 const result=correctOrientation(photographed,Cube);
 if(result.error){assert.match(result.error,/more than one/);}else{assert.equal(result.state,source);assert.equal(validate(result.state,Cube),null);recovered++;}
}
assert.ok(recovered>0);
assert.ok(correctOrientation(flipped.join(''),Cube).error);
assert.ok(correctOrientation(twisted.asString(),Cube).error);
assert.deepEqual(correctOrientation(SOLVED,Cube),{state:SOLVED,corrected:false});
console.log(`PASS: ${recovered} rotated cubes recovered, ambiguous arrangements rejected, impossible cubes preserved as errors.`);

const ambiguous=new Cube().move('R').asString();assert.match(correctOrientation(rotateFace(ambiguous.slice(0,9))+ambiguous.slice(9),Cube).error,/more than one/);

// A valid arrangement is not proof that arbitrary camera rotations are unique.
assert.match(correctOrientation(ambiguous,Cube,{requireUnique:true}).error,/more than one/);
assert.deepEqual(correctOrientation(SOLVED,Cube,{requireUnique:true}),{state:SOLVED,corrected:false});
