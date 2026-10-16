import * as T from '../evermile/vendor/three.module.js';
import { mergeGeometries } from '../evermile/vendor/utils/BufferGeometryUtils.js';
export function createMatchBall(R,canvasTex){
// Truncated-icosahedron panel construction: twelve pentagons, twenty hexagons.
const ico=new T.IcosahedronGeometry(1,0),verts=[],faces=[];
for(let i=0;i<ico.attributes.position.count;i+=3){const face=[];for(let j=0;j<3;j++){
 const v=new T.Vector3().fromBufferAttribute(ico.attributes.position,i+j);let n=verts.findIndex(p=>p.distanceToSquared(v)<1e-8);if(n<0){n=verts.length;verts.push(v);}face.push(n);
}faces.push(face);}
const ball=new T.Group();
const panels=[[],[]];
const panelMat=[new T.MeshPhysicalMaterial({color:'#f5f3e9',roughness:.5,clearcoat:.25}),new T.MeshPhysicalMaterial({color:'#111820',roughness:.4,clearcoat:.35})];
const ballBump=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#999';g.fillRect(0,0,w,h);for(let i=0;i<10000;i++){g.fillStyle=Math.random()<.5?'#777':'#bbb';g.fillRect(Math.random()*w,Math.random()*h,1,1);}});
for(const m of panelMat){m.bumpMap=ballBump;m.bumpScale=.0006;}
ball.add(new T.Mesh(new T.SphereGeometry(R*.94,32,24),new T.MeshStandardMaterial({color:'#353d42',roughness:.85})));
function panel(points,black){const center=points.reduce((a,b)=>a.add(b),new T.Vector3()).normalize(),sorted=points;
 const p=[],uv=[];for(let i=0;i<sorted.length;i++){
 const a=sorted[i].clone().lerp(center,.045).normalize(),b=sorted[(i+1)%sorted.length].clone().lerp(center,.045).normalize();
 // Radial subdivisions keep each panel spherical, with dark recessed seams.
 for(let k=0;k<4;k++){
  const q=a.clone().lerp(b,k/4).normalize(),r=a.clone().lerp(b,(k+1)/4).normalize();
  for(const v of [center,q,r]){p.push(...v.clone().multiplyScalar(R).toArray());uv.push(v.x*3,v.y*3);}
 }
 }const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
 // Winding follows the original icosahedron faces.
 panels[black?1:0].push(geo);
}
for(const f of faces){const points=[];for(let j=0;j<3;j++){const a=verts[f[j]],b=verts[f[(j+1)%3]];points.push(a.clone().lerp(b,1/3).normalize(),a.clone().lerp(b,2/3).normalize());}panel(points,false);}
verts.forEach((v,i)=>{const neighbors=new Set();for(const f of faces)if(f.includes(i))f.forEach(n=>{if(n!==i)neighbors.add(n);});const axis=new T.Vector3(0,1,0);if(Math.abs(v.y)>.9)axis.set(1,0,0);const u=new T.Vector3().crossVectors(v,axis).normalize(),w=new T.Vector3().crossVectors(v,u);
 const points=[...neighbors].map(n=>v.clone().lerp(verts[n],1/3).normalize());points.sort((a,b)=>Math.atan2(a.dot(w),a.dot(u))-Math.atan2(b.dot(w),b.dot(u)));panel(points,true);});

for(let i=0;i<2;i++){const geo=mergeGeometries(panels[i]);for(const p of panels[i])p.dispose();panelMat[i].side=T.DoubleSide;const mesh=new T.Mesh(geo,panelMat[i]);mesh.castShadow=true;ball.add(mesh);}
ico.dispose();return ball;
}
