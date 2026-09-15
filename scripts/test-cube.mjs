import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {FACES, SOLVED, NORMALS,position,validate,inverse} from '../tools/rubiks-cube/cube-core.js';
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
