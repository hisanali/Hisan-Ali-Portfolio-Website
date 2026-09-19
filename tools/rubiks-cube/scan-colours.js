// Camera samples are compared with this cube's six measured centres, not fixed RGB cutoffs.
export const SCAN_FACES=['U','R','F','D','L','B'];
export function lab(rgb){
 const [r,g,b]=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;
 const x=f((r*.4124564+g*.3575761+b*.1804375)/.95047),y=f(r*.2126729+g*.7151522+b*.072175),z=f((r*.0193339+g*.119192+b*.9503041)/1.08883);
 return [116*y-16,500*(x-y),200*(y-z)];
}
export function distance(a,b){return Math.hypot((a[0]-b[0])*.32,a[1]-b[1],a[2]-b[2]);}
export function classifySample(rgb,references){
 const value=lab(rgb);const scores=SCAN_FACES.filter(f=>references[f]).map(f=>({face:f,d:distance(value,lab(references[f]))})).sort((a,b)=>a.d-b.d);
 if(scores.length<6)return {face:null,confident:false};
 const [a,b]=scores,margin=(b.d-a.d)/Math.max(b.d,1);
 return {face:a.face,confident:a.d<32&&margin>.22,margin,distance:a.d};
}
export function calibrationError(rgb,references){
 const l=lab(rgb);if(l[0]<18)return 'Too dark. Move into brighter, even light.';
 if(Math.max(...rgb)>250&&Math.min(...rgb)>240)return 'Highlight detected. Tilt slightly to remove glare, then face the camera again.';
 if(Object.values(references).some(ref=>distance(l,lab(ref))<12))return 'This centre looks too similar to one already saved. Check the requested colour and reduce glare.';
 return null;
}
export function samplePatch(ctx,x,y,size=28){
 const data=ctx.getImageData(Math.round(x-size/2),Math.round(y-size/2),size,size).data;
 const pixels=[];for(let i=0;i<data.length;i+=4){const rgb=[data[i],data[i+1],data[i+2]];pixels.push({rgb,light:rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722});}
 pixels.sort((a,b)=>a.light-b.light);const middle=pixels.slice(Math.floor(pixels.length*.2),Math.floor(pixels.length*.8));
 const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];const rgb=[0,1,2].map(k=>median(middle.map(p=>p.rgb[k])));
 const spread=median(middle.map(p=>Math.hypot(...p.rgb.map((v,i)=>v-rgb[i]))));
 const glare=pixels.filter(p=>Math.min(...p.rgb)>248).length/pixels.length;
 return {rgb,good:lab(rgb)[0]>15&&spread<35&&glare<.35};
}
export function sampleFace(ctx){return Array.from({length:9},(_,i)=>samplePatch(ctx,48+(i%3+.5)*128,48+(Math.floor(i/3)+.5)*128));}
export function stableFaceSample(history,count=6,tolerance=22){
 if(history.length<count)return null;const recent=history.slice(-count);if(recent.some(frame=>!Array.isArray(frame)||frame.length!==9||frame.some(sample=>!sample.good)))return null;
 const median=values=>values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)],result=[];
 for(let i=0;i<9;i++){const rgb=[0,1,2].map(channel=>median(recent.map(frame=>frame[i].rgb[channel])));if(recent.some(frame=>Math.hypot(...frame[i].rgb.map((value,channel)=>value-rgb[channel]))>tolerance))return null;result.push({rgb,good:true});}
 return result;
}
export function identifyCenterFace(rgb){
 const [r,g,b]=rgb.map(value=>value/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,saturation=max?delta/max:0;
 if(max<.18)return {face:null,confident:false};
 if(saturation<.28)return {face:'U',confident:max>.48};
 let hue=0;if(delta){if(max===r)hue=60*((g-b)/delta%6);else if(max===g)hue=60*((b-r)/delta+2);else hue=60*((r-g)/delta+4);if(hue<0)hue+=360;}
 const ranges=[['R',hue<14||hue>=345],['L',hue>=14&&hue<42],['D',hue>=42&&hue<80],['F',hue>=80&&hue<185],['B',hue>=185&&hue<270]],match=ranges.find(([,inside])=>inside)?.[0]||null;
 const boundaries=[14,42,80,185,270,345],edge=Math.min(...boundaries.map(value=>Math.abs(hue-value)));
 return {face:match,confident:!!match&&saturation>.35&&edge>3,hue,saturation};
}
export function validFace(face,colours){return SCAN_FACES.includes(face)&&typeof colours==='string'&&/^[URFDLB]{9}$/.test(colours)&&colours[4]===face;}
// Solve a square assignment matrix in O(n^3). Repeating every colour eight
// times turns classification into a whole-cube decision: the 48 movable
// stickers must use exactly eight of each colour, while the six centres are
// fixed by calibration.
function assignMinimumCost(cost){
 const n=cost.length,u=Array(n+1).fill(0),v=Array(n+1).fill(0),p=Array(n+1).fill(0),way=Array(n+1).fill(0);
 for(let i=1;i<=n;i++){p[0]=i;let j0=0,min=Array(n+1).fill(Infinity),used=Array(n+1).fill(false);do{used[j0]=true;const i0=p[j0];let delta=Infinity,j1=0;for(let j=1;j<=n;j++)if(!used[j]){const cur=cost[i0-1][j-1]-u[i0]-v[j];if(cur<min[j]){min[j]=cur;way[j]=j0;}if(min[j]<delta){delta=min[j];j1=j;}}for(let j=0;j<=n;j++)if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else min[j]-=delta;j0=j1;}while(p[j0]!==0);do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);}
 const assignment=Array(n);for(let j=1;j<=n;j++)assignment[p[j]-1]=j-1;return assignment;
}
export function classifyCapturedFaces(frames,references){
 if(SCAN_FACES.some(face=>!references[face]||!Array.isArray(frames[face])||frames[face].length!==9))return {faces:null,retryFace:SCAN_FACES.find(face=>!frames[face])||SCAN_FACES[0]};
 const cells=[];for(const face of SCAN_FACES)for(let i=0;i<9;i++)if(i!==4)cells.push({face,index:i,sample:frames[face][i]});
 const slots=SCAN_FACES.flatMap(face=>Array(8).fill(face)),referenceLabs=Object.fromEntries(SCAN_FACES.map(face=>[face,lab(references[face])]));
 const distances=cells.map(({sample})=>Object.fromEntries(SCAN_FACES.map(face=>[face,distance(lab(sample.rgb),referenceLabs[face])])));
 const assignment=assignMinimumCost(distances.map(scores=>slots.map(face=>scores[face]))),faces=Object.fromEntries(SCAN_FACES.map(face=>[face,Array(9).fill(face)])),risk=new Map(SCAN_FACES.map(face=>[face,0]));
 cells.forEach((cell,row)=>{const assigned=slots[assignment[row]],scores=distances[row],ordered=SCAN_FACES.map(face=>({face,d:scores[face]})).sort((a,b)=>a.d-b.d),forced=scores[assigned]-ordered[0].d,bad=!cell.sample.good||!classifySample(cell.sample.rgb,references).confident||assigned!==ordered[0].face||scores[assigned]>38||forced>8;faces[cell.face][cell.index]=assigned;if(bad)risk.set(cell.face,risk.get(cell.face)+Math.max(1,scores[assigned]/8+forced));});
 const retry=[...risk].sort((a,b)=>b[1]-a[1]).find(([,score])=>score>0)?.[0]||null;if(retry)return {faces:null,retryFace:retry};
 const strings=Object.fromEntries(SCAN_FACES.map(face=>[face,faces[face].join('')]));return {faces:strings,retryFace:null};
}
export function stableFrames(history,face){
 if(history.length<6)return false;const recent=history.slice(-6);return recent.every(frame=>frame.every(s=>s.confident)&&frame[4].face===face&&frame.map(s=>s.face).join('')===recent[0].map(s=>s.face).join(''));
}
