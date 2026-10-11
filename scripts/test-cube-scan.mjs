import assert from 'node:assert/strict';
import {classifySample,classifyCapturedFaces,calibrationError,identifyCenterFace,stableFaceSample,stableFrames,validFace,sampleFace} from '../tools/rubiks-cube/scan-colours.js';
const refs={U:[230,231,215],R:[210,45,38],F:[35,145,78],D:[230,204,30],L:[235,116,30],B:[36,82,180]};
for(const [face,rgb] of Object.entries(refs))for(const gain of [.85,1,1.08]){const value=rgb.map(v=>Math.min(255,Math.round(v*gain)));assert.equal(classifySample(value,refs).face,face,`${face} gain ${gain}`);assert.ok(classifySample(value,refs).confident);}
assert.ok(calibrationError([8,8,8],{}));assert.ok(calibrationError(refs.R,{R:refs.R}));assert.equal(calibrationError(refs.F,{R:refs.R}),null);
assert.equal(classifySample([222,80,34],refs).confident,false);
const frame=Array.from({length:9},()=>({face:'F',confident:true}));assert.equal(stableFrames(Array(5).fill(frame),'F'),false);assert.equal(stableFrames(Array(6).fill(frame),'F'),true);assert.equal(stableFrames(Array(6).fill(frame),'U'),false);const uncertain=frame.map((p,i)=>({...p,confident:i!==2}));assert.equal(stableFrames([...Array(5).fill(frame),uncertain],'F'),false);
assert.ok(validFace('F','FFFFFFFFF'));assert.equal(validFace('F','UUUUUUUUU'),false);assert.equal(validFace('F','FFF'),false);assert.equal(validFace('Z','FFFFFFFFF'),false);
const patches=sampleFace({getImageData(x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=480&&y+h<=480);return{data:Uint8ClampedArray.from(Array(w*h).fill([35,145,78,255]).flat())};}});assert.equal(patches.length,9);assert.ok(patches.every(p=>p.good));assert.deepEqual(patches[0].rgb,refs.F);
for(const [face,rgb] of Object.entries(refs)){const detected=identifyCenterFace(rgb);assert.equal(detected.face,face,`identify ${face}`);assert.ok(detected.confident,`confident ${face}`);}assert.equal(identifyCenterFace([45,45,45]).face,null);
const refFaces=Object.keys(refs),stableRaw=Array.from({length:6},(_,frameIndex)=>Array.from({length:9},(_,sticker)=>({rgb:refs[refFaces[sticker%6]].map((v,channel)=>v+(frameIndex%2?2:-2)+(channel===0?1:0)),good:true})));const averaged=stableFaceSample(stableRaw);assert.equal(averaged.length,9);assert.equal(stableFaceSample([...stableRaw.slice(0,5),stableRaw[5].map((sample,index)=>index===2?{rgb:[255,255,255],good:true}:sample)]),null);assert.ok(averaged.every(sample=>sample.good));
const captured=Object.fromEntries(Object.entries(refs).map(([face,rgb])=>[face,Array.from({length:9},()=>({rgb,good:true}))]));const automatic=classifyCapturedFaces(captured,refs);assert.equal(automatic.retryFace,null);for(const face of Object.keys(refs))assert.equal(automatic.faces[face],face.repeat(9));captured.F[2]={rgb:[222,80,34],good:true};assert.equal(classifyCapturedFaces(captured,refs).retryFace,'F');
const balanced=Object.fromEntries(Object.entries(refs).map(([face,rgb])=>[face,Array.from({length:9},()=>({rgb,good:true}))]));balanced.R[0]={rgb:[224,83,32],good:true};assert.equal(classifySample(balanced.R[0].rgb,refs).face,'L');const balancedResult=classifyCapturedFaces(balanced,refs);assert.equal(balancedResult.retryFace,'R');assert.equal(balancedResult.faces,null);
console.log('PASS: 18 calibrated colour/exposure cases, automatic centre identification, balanced whole-cube colour assignment, full-face temporal averaging, targeted rescan, centre validation and nine-patch sampling.');

// Regression: orange and white sampled from the reported iPhone screenshot.
const cameraRefs={U:[236,231,213],R:[210,32,25],F:[1,134,56],D:[237,211,2],L:[254,80,35],B:[1,114,194]};
for(const [face,rgb] of Object.entries(cameraRefs)){
 const centre=identifyCenterFace(rgb);assert.equal(centre.face,face);assert.ok(centre.confident,`photo centre ${face}`);
 for(const gain of [.6,.75,1]){const sample=rgb.map(v=>Math.round(v*gain));const match=classifySample(sample,cameraRefs);assert.equal(match.face,face,`photo ${face} at ${gain}`);assert.ok(match.confident);}
}
for(const white of [[245,204,155],[235,208,169],[180,170,145]]){assert.equal(identifyCenterFace(white).face,'U');assert.ok(identifyCenterFace(white).confident);}
// A near-boundary colour is withheld rather than captured as a confident guess.
assert.equal(identifyCenterFace([250,62,30]).confident,false);
// Use a real scrambled sticker arrangement, varying exposure per captured face.
const {FACES}=await import('../tools/rubiks-cube/cube-core.js');
const {createRequire}=await import('node:module');
const Cube=createRequire(import.meta.url)('../tools/rubiks-cube/vendor/cube.js');
const scrambled=new Cube().move("R U F' L D B").asString();
const photoFrames=Object.fromEntries(FACES.map((face,faceIndex)=>[face,Array.from({length:9},(_,i)=>({rgb:cameraRefs[scrambled[faceIndex*9+i]].map(v=>Math.round(v*(.65+faceIndex*.06))),good:true}))]));
const photoCentres=Object.fromEntries(FACES.map(face=>[face,photoFrames[face][4].rgb]));
const matched=classifyCapturedFaces(photoFrames,photoCentres);assert.equal(matched.retryFace,null);for(const [i,face] of FACES.entries())assert.equal(matched.faces[face],scrambled.slice(i*9,i*9+9));
console.log('PASS: reported orange/white colours, warm white, exposure changes, uncertain centre guard and scrambled six-face scan.');
