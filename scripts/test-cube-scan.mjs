import assert from 'node:assert/strict';
import {classifySample,classifyCapturedFaces,calibrationError,stableFrames,validFace,sampleFace} from '../tools/rubiks-cube/scan-colours.js';
const refs={U:[230,231,215],R:[210,45,38],F:[35,145,78],D:[230,204,30],L:[235,116,30],B:[36,82,180]};
for(const [face,rgb] of Object.entries(refs))for(const gain of [.85,1,1.08]){const value=rgb.map(v=>Math.min(255,Math.round(v*gain)));assert.equal(classifySample(value,refs).face,face,`${face} gain ${gain}`);assert.ok(classifySample(value,refs).confident);}
assert.ok(calibrationError([8,8,8],{}));assert.ok(calibrationError(refs.R,{R:refs.R}));assert.equal(calibrationError(refs.F,{R:refs.R}),null);
assert.equal(classifySample([222,80,34],refs).confident,false);
const frame=Array.from({length:9},()=>({face:'F',confident:true}));assert.equal(stableFrames(Array(5).fill(frame),'F'),false);assert.equal(stableFrames(Array(6).fill(frame),'F'),true);assert.equal(stableFrames(Array(6).fill(frame),'U'),false);const uncertain=frame.map((p,i)=>({...p,confident:i!==2}));assert.equal(stableFrames([...Array(5).fill(frame),uncertain],'F'),false);
assert.ok(validFace('F','FFFFFFFFF'));assert.equal(validFace('F','UUUUUUUUU'),false);assert.equal(validFace('F','FFF'),false);assert.equal(validFace('Z','FFFFFFFFF'),false);
const patches=sampleFace({getImageData(x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=480&&y+h<=480);return{data:Uint8ClampedArray.from(Array(w*h).fill([35,145,78,255]).flat())};}});assert.equal(patches.length,9);assert.ok(patches.every(p=>p.good));assert.deepEqual(patches[0].rgb,refs.F);
const captured=Object.fromEntries(Object.entries(refs).map(([face,rgb])=>[face,Array.from({length:9},()=>({rgb,good:true}))]));const automatic=classifyCapturedFaces(captured,refs);assert.equal(automatic.retryFace,null);for(const face of Object.keys(refs))assert.equal(automatic.faces[face],face.repeat(9));captured.F[2]={rgb:[222,80,34],good:true};assert.equal(classifyCapturedFaces(captured,refs).retryFace,'F');
console.log('PASS: 18 calibrated colour/exposure cases, uncertain colour rejection, automatic six-face classification and targeted rescan, temporal stability, centre validation and nine-patch sampling.');
