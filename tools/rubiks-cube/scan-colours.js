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
export function validFace(face,colours){return SCAN_FACES.includes(face)&&typeof colours==='string'&&/^[URFDLB]{9}$/.test(colours)&&colours[4]===face;}
export function stableFrames(history,face){
 if(history.length<6)return false;const recent=history.slice(-6);return recent.every(frame=>frame.every(s=>s.confident)&&frame[4].face===face&&frame.map(s=>s.face).join('')===recent[0].map(s=>s.face).join(''));
}
