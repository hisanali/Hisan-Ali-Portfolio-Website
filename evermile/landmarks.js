import {ArchitectureModels} from './architecture-models.js?v=20260926-supplied7';
import * as T from './vendor/three.module.js';
import {Batch, UNIT, PLANE, FLAT, frame, canvasTexture} from './scenery.js?v=20260926-supplied7';
import {scanned} from './materials.js?v=20260926-supplied7';
import {DESTINATIONS, inDestination} from './destinations.js?v=20260926-supplied7';
import {random, clamp} from './math.js?v=20260926-supplied7';

const CYLINDER = new T.CylinderGeometry(1, 1, 1, 12).toNonIndexed();
const SPHERE = new T.SphereGeometry(1, 12, 8).toNonIndexed();
const CONE = new T.ConeGeometry(1, 1, 16).toNonIndexed();
const ARCH = new T.TorusGeometry(1, .12, 8, 20, Math.PI).toNonIndexed();
function palmLeaf() {
 // Each leaflet is a curved, tapered blade rather than a striped alpha card.
 const p=[];const add=(a,b,c)=>p.push(...a,...b,...c);
 const spine=t=>[t*5.5,Math.sin(t*Math.PI)*1.15-t*1.9,0];
 for(let i=0;i<38;i++){
  const t=(i+1)/40,base=spine(t),next=spine(t+.018),length=Math.pow(Math.sin(t*Math.PI),.65)*1.05;
  for(const side of [-1,1]){
   const tip=[base[0]+.5,base[1]-.32-length*.18,side*length],mid=[base[0]+.16,base[1]+.05,side*length*.52];
   const edge=[mid[0]+.075,mid[1]-.02,mid[2]];
   add(base,mid,edge);add(base,edge,next);add(mid,tip,edge);
  }
  const q=spine(t+.025);add([base[0],base[1]+.01,-.018],[base[0],base[1]+.01,.018],[q[0],q[1]+.01,.012]);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(p.length/3*2),2));g.computeVertexNormals();return g;
}
const FROND = palmLeaf();
export class Landmarks {
 constructor(world) {
  this.imported=new ArchitectureModels(world);this.world = world; this.settings = world.settings; this.t = 0; this.signs = new Map(); this.wheels = []; this.lit = 0;
  const std = (o) => new T.MeshStandardMaterial({vertexColors:true, ...o});
  const leaves = canvasTexture(512, 128, (c,w,h) => { c.clearRect(0,0,w,h); c.strokeStyle='#fff'; c.lineWidth=3; c.beginPath(); c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke(); for(let i=0;i<65;i++){const x=i*w/65;c.lineWidth=3.8;for(const s of [-1,1]){c.beginPath();c.moveTo(x,h/2);c.lineTo(x+30,h/2+s*(h*.48));c.stroke();}} });
  this.m = {
   stone:{material:scanned('stone',{vertexColors:true},3),cast:true},
   roof:{material:scanned('roof',{vertexColors:true},3),cast:true},
   bark:{material:scanned('bark',{vertexColors:true},2),cast:true},
   plaster:{material:std({roughness:.89}),cast:true},
   pavement:{material:scanned('stone',{vertexColors:true,normalScale:new T.Vector2(.18,.18)},4),cast:false},
   metal:{material:std({metalness:.75,roughness:.28}),cast:true},
   wood:{material:scanned('bark',{vertexColors:true,normalScale:new T.Vector2(.1,.1)},1.8),cast:true},
   glass:{material:std({color:0xa6c4d0,metalness:.65,roughness:.13}),cast:false},
   window:{material:std({color:0xffd7a0,emissive:0xffb86b,emissiveIntensity:.3,roughness:.45}),cast:false},
   neonBlue:{material:std({color:0x9be7ff,emissive:0x39cfff,emissiveIntensity:1}),cast:false},
   neonPink:{material:std({color:0xffc2e7,emissive:0xff409f,emissiveIntensity:1}),cast:false},
   leaf:{material:std({side:T.DoubleSide,roughness:.84}),cast:true},
   green:{material:std({roughness:.96}),cast:true},
   water:{material:new T.MeshPhysicalMaterial({color:0x167b88,roughness:.15,metalness:.25,clearcoat:1,transparent:true,opacity:.86}),cast:false},
  };
  // A bounded light pool avoids hundreds of per-building point lights.
  this.lights = Array.from({length:4},()=>{const l=new T.PointLight(0xffcd8c,0,26,2);world.scene.add(l);return l;});
 }
 active(z) { return inDestination(this.settings,z); }
 blocked(x,z) { if(!this.active(z))return false; const r=this.world.road;return Math.abs(x-r.x(z))< (this.settings.destination==='lake'?18:115); }
 sign(text) {
  if(this.signs.has(text))return this.signs.get(text);
  const map=canvasTexture(1024,128,(c,w,h)=>{c.fillStyle='#16272b';c.fillRect(0,0,w,h);c.fillStyle='#e8efde';c.font='500 58px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2,w-50);});
  const material=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.25,roughness:.4,side:T.DoubleSide});const key='sign'+this.signs.size;this.m[key]={material};this.signs.set(text,key);return key;
 }
 label(b,text,x,y,z,w=12,yaw=-Math.PI/2){b.add(this.sign(text),PLANE,x,y,z,yaw,0xffffff,w,w/8,1);}
 palm(put,x,z,h=13){
  for(let j=0;j<7;j++){const u=j/7;put('bark',CYLINDER,x,h*(u+.5/7),z,0xa39b80,.24*(1-u*.5),h/7,.24*(1-u*.5));}
  for(let j=0;j<13;j++)put('leaf',FROND,x,h,z,j%2?0x718348:0x4d693c,.8+(j%3)*.13,1,.9,j*Math.PI*2/13,0,(j%3-1)*.18);
  put('green',SPHERE,x,h-.25,z,0x453d25,.45,.5,.45);
 }
 cypress(put,x,z,h=10){put('bark',CYLINDER,x,h/2,z,0x817256,.18,h,.18);for(let k=0;k<3;k++)put('green',SPHERE,x,h*(.43+k*.19),z,0x354c2b,1.15-k*.26,h*.31,1.15-k*.26);}
 lamp(put,x,z,group,h=5.4){put('metal',CYLINDER,x,h/2,z,0x343a39,.065,h,.065);put('metal',UNIT,x,h,z,0x313938,.65,.12,.65);put('window',UNIT,x,h-.25,z,0xffffff,.32,.42,.32);const [wx,wz]=put.world(x,z);(group.userData.destinationLights ||= []).push([wx,put.y+h-.3,wz]);}
 collider(group,put,x,z,hx,hz){const [wx,wz]=put.world(x,z);(group.userData.colliders ||= []).push({x:wx,z:wz,hx,hz,c:put.c,s:put.s,r:0});}
 windows(put,x,z,depth,width,floors=3,neon=false){
  for(let f=0;f<floors;f++)for(let j=0;j<Math.floor(width/3);j++){
   const q=z-width/2+1.7+j*3, y=2.1+f*3.35;
   put('metal',UNIT,x-depth/2-.08,y,q,0xd5d3c6,.18,2.05,1.7);
   put((j+f)%3?'glass':'window',UNIT,x-depth/2-.19,y,q,0xffffff,.04,1.8,1.43);
   put('metal',UNIT,x-depth/2-.22,y,q,0xdedbcc,.04,1.8,.05);
   if(neon)put(f%2?'neonPink':'neonBlue',UNIT,x-depth/2-.25,y+1.35,q,0xffffff,.09,.08,2.7);
  }
 }
 building(b,group,z,side,kind,rng){
  const r=this.world.road,y=r.y(z),yaw=Math.atan(r.tangent(z))+(side<0?Math.PI:0),put=frame(b,r.x(z),y,z,yaw);put.y=y;
  const importedKey=kind==='oldtown'?'apartments':kind==='hotel'&&Math.round(z/40)%2===0?'apartments':kind==='estate'&&Math.round(z/40)%3===0?'brick-works':null;
  if(importedKey&&this.imported.loaded[importedKey]){
   const edge=r.width(z),x=edge+14,[wx,wz]=put.world(x,0);this.imported.place(importedKey,group,wx,y,wz,yaw-Math.PI/2);this.collider(group,put,x,0,6.5,8);
   put('pavement',UNIT,edge+4,.08,0,0xa3a29a,8,.16,36);this.palm(put,edge+2,-15,12);this.lamp(put,edge+1,12,group);return;
  }
  const edge=r.width(z),w=kind==='hotel'?23:kind==='oldtown'?17:25,depth=kind==='modern'?23:16,x=edge+(kind==='modern'?14:7)+depth/2,levels=kind==='hotel'?4+Math.floor(rng()*3):kind==='residential'?1:2;
  put('pavement',UNIT,edge+3,.08,0,0xa3a29a,6,.16,36);
  const material=kind==='oldtown'?'stone':'plaster', color=kind==='hotel'?[0xeadfce,0xc9ddd7,0xe2c1bf,0xd4d8e5][Math.floor(rng()*4)]:0xe8dbc5;
  put(material,UNIT,x,levels*1.7,0,color,depth,levels*3.4,w);
  this.collider(group,put,x,0,depth/2,w/2);
  if(kind==='modern'){
   this.collider(group,put,x-depth/2-5,0,3.5,(w+3)/2);
   for(const f of [0,1]){put('glass',UNIT,x-depth/2-.08,1.6+f*3.6,0,0xffffff,.1,2.9,w-2);put('plaster',UNIT,x-1,3.4+f*3.6,0,0xaaa59a,depth+7,.38,w+3);for(let q=-w/2+1;q<w/2;q+=4)put('metal',UNIT,x-depth/2-.24,1.6+f*3.6,q,0x494b46,.15,3.1,.12);}
   put('stone',UNIT,x-depth/2-5,.5,0,0xd5cbbb,7,1,w+3);put('water',FLAT,x-depth/2-5,1.02,0,0xffffff,5,1,w-3);
   for(const q of [-w/2,w/2])put('glass',UNIT,x-depth/2-7,2,q,0xffffff,.07,1.4,3);
   for(const q of [-8,8]){put('wood',UNIT,x-depth/2-2,1.3,q,0xaa8a61,1.3,.2,2);put('plaster',UNIT,x-depth/2-2,1.43,q,0xddd7c6,1.2,.12,1.8);}
  }else{
   this.windows(put,x,0,depth,w,levels,kind==='hotel');
   if(kind==='hotel'){
    for(let f=0;f<=levels;f++){put('plaster',UNIT,x,3.4*f+.3,0,0xf0eee3,depth+.6,.24,w+.6);put('neonBlue',UNIT,x-depth/2-.4,3.4*f+.38,0,0xffffff,.08,.08,w+.6);}
    const [sx,sz]=put.world(x-depth/2-.5,0);this.label(b,['COLONY HOTEL','OCEAN HOUSE','THE PALMS','RIVIERA'][Math.floor(rng()*4)],sx,y+levels*3.4-1.3,sz,w*.8,yaw-Math.PI/2);
    put('plaster',UNIT,x-depth/2-2,3.5,0,0x376f68,4,.22,w-1);
    for(let q=-w/2+2;q<w/2;q+=5){put('metal',CYLINDER,edge+3,1,q,0x535a51,.04,2,.04);put('plaster',CONE,edge+3,2.2,q,0xe3d3b6,1.9,.6,1.9);put('wood',CYLINDER,edge+3,.75,q,0xad8251,.7,.1,.7);}
   }else{
    // Two roof slopes, with tile maps in metres and a ridge.
    for(const s of [-1,1])put('roof',UNIT,x+s*depth/4,levels*3.4+1,0,0xe1a483,depth*.58,.2,w+1,0,0,-s*.32);
    if(kind!=='oldtown')for(const q of [-7,0,7]){put('stone',ARCH,x-depth/2-1,3.3,q,0xe5d5b7,1.5,1.5,1.5,Math.PI/2);for(const dz of [-1.5,1.5])put('stone',CYLINDER,x-depth/2-1,1.65,q+dz,0xe9d6b8,.14,3.3,.14);}
   }
  }
  for(const q of [-w/2-2,w/2+2]){if(kind==='oldtown'||kind==='estate')this.cypress(put,edge+4,q,9);else this.palm(put,edge+2,q,12+rng()*5);}
  this.lamp(put,edge+1.1,-w/2+1,group);
 }
 terminal(b,group,z){const r=this.world.road,y=r.y(z),put=frame(b,r.x(z),y,z,Math.atan(r.tangent(z)));put.y=y;const x=46;
  put('pavement',UNIT,31,-.05,0,0xaaa59b,49,.1,180);
  put('plaster',UNIT,x,6,0,0xc8bdae,29,12,152);put('glass',UNIT,x-14.55,4.2,0,0xffffff,.08,7.5,147);
  for(let q=-72;q<=72;q+=6){put('metal',UNIT,x-14.7,4.3,q,0xb5b3ac,.24,8,.18);put('window',UNIT,x-13.9,6.5,q,0xffffff,.05,1,4.8);}
  for(let q=-66;q<=66;q+=22){put('plaster',UNIT,x-14.9,8.6,q,0xe5d8c5,.8,1.3,21);put('metal',UNIT,x-18,8,q,0x42433f,8,.4,21.8,0,.06);put('metal',CYLINDER,x-20,3.9,q,0xa5a8a0,.2,7.8,.2);}
  const [sx,sz]=put.world(x-15.2,0);this.label(b,'ESCOBAR INTERNATIONAL AIRPORT',sx,y+10.5,sz,74,-Math.PI/2+Math.atan(r.tangent(z)));
  for(const q of [-68,-34,0,34,68]){this.palm(put,14,q,16);this.lamp(put,19,q+4,group,6);put('stone',UNIT,14,.6,q,0x8d8978,4,1.2,4);}
  // Control tower with glazed cab, aerials and a low terminal service wing.
  put('plaster',CYLINDER,83,20,62,0xb7b3a7,3.4,40,3.4);put('glass',CYLINDER,83,40,62,0xffffff,7,5,7);put('metal',CYLINDER,83,43,62,0x454a4c,8,.7,8);put('metal',CYLINDER,83,48,62,0xc4c8c9,.12,10,.12);
  this.collider(group,put,x,0,14.5,76);
 }
 fortress(b,group,z){const r=this.world.road,y=r.y(z),put=frame(b,r.x(z),y,z,0);put.y=y;
  if(this.imported.loaded['coastal-fort']){put('stone',SPHERE,-43,-6,0,0xaaa797,28,10,29);this.imported.place('coastal-fort',group,r.x(z)-43,y,z,Math.PI/2);this.collider(group,put,-43,0,22,22);return;}
  // Rock promontory and masonry foundations descend below sea level.
  put('stone',SPHERE,-38,-5,0,0xaaa797,22,9,44);
  put('stone',UNIT,-38,-3,0,0xb4aa94,18,12,58);
  for(const q of [-25,25]){put('stone',CYLINDER,-38,10,q,0xc9bba0,8,23,8);for(let j=0;j<12;j++){const a=j/12*Math.PI*2;put('stone',UNIT,-38+Math.cos(a)*7.5,22,q+Math.sin(a)*7.5,0xd7c8ac,1.4,2,1.4);}}
  put('stone',UNIT,-38,8,0,0xc8bba4,8,19,52);for(let q=-22;q<24;q+=3)put('stone',UNIT,-38,18.3,q,0xd7c8ac,8,1.5,1.3);
  this.collider(group,put,-38,0,8,34);
 }
 wheel(b,group,z){const r=this.world.road,y=r.y(z),put=frame(b,r.x(z),y,z,0);put.y=y;
  const cx=-61,cy=28,cz=0;
  put('wood',UNIT,-50,-.25,0,0x9d8460,82,1,115);
  for(let q=-50;q<=50;q+=8)for(const x of [-15,-86])put('wood',CYLINDER,x,-5,q,0x514736,.35,10,.35);
  for(const s of [-1,1]){put('metal',UNIT,cx+s*9,13,0,0xc8c8b9,1,29,1,0,0,s*.35);put('metal',CYLINDER,cx,cy,0,0xbdbfae,.6,7,.6,0,Math.PI/2);}
  const wheel=new T.Group();wheel.position.set(r.x(z)+cx,y+cy,z);group.add(wheel);
  const mat=this.m.metal.material, ring=new T.TorusGeometry(23,.18,8,96);
  for(const d of [-1.6,1.6]){const mesh=new T.Mesh(ring,mat);mesh.position.z=d;wheel.add(mesh);}
  const gondolas=[];
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2,x=Math.cos(a)*23,yy=Math.sin(a)*23;
   const spoke=new T.Mesh(new T.CylinderGeometry(.055,.055,46,5),mat);spoke.rotation.z=a-Math.PI/2;wheel.add(spoke);
   const cabin=new T.Group();cabin.position.set(x,yy,0);wheel.add(cabin);
   const box=new T.Mesh(new T.BoxGeometry(2.2,1.35,3),this.m.glass.material);box.position.y=-1.5;cabin.add(box);
   const roof=new T.Mesh(new T.BoxGeometry(2.5,.15,3.3),this.m.plaster.material);roof.position.y=-.4;cabin.add(roof);gondolas.push(cabin);
  }
  group.userData.wheel={wheel,gondolas};
  // A continuous roller-coaster rail and regularly spaced supporting trestles.
  const points=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;points.push(new T.Vector3(r.x(z)-57+Math.cos(a)*34,y+6+Math.sin(a*3)*3,z+Math.sin(a)*45));}
  const curve=new T.CatmullRomCurve3(points,true);const coasterMaterial = this.coasterMaterial ||= new T.MeshStandardMaterial({color:0xc99135,metalness:.55,roughness:.35});group.add(new T.Mesh(new T.TubeGeometry(curve,192,.16,6,true),coasterMaterial));
  for(let i=0;i<24;i++){const p=curve.getPoint(i/24);b.add('metal',CYLINDER,p.x,(p.y+y)/2,p.z,0,0xd6d1bc,.12,p.y-y,.12);}
  this.collider(group,put,-61,0,2,2);
 }
 boardwalk(b,group,z,kind){const r=this.world.road,y=r.y(z),put=frame(b,r.x(z),y,z,Math.atan(r.tangent(z)));put.y=y;const edge=r.width(z);
  put('pavement',UNIT,-edge-4,.1,0,0xccc4ae,8,.2,40);put('stone',UNIT,-edge-8,.45,0,0xbab5a5,.35,.9,40);
  if(kind!=='lake')this.palm(put,-edge-3,0,14);
  this.lamp(put,-edge-1.2,0,group);
  put('wood',UNIT,-edge-5,.65,5,0x8d775b,.65,.1,2.1);put('wood',UNIT,-edge-5.3,1,5,0x8d775b,.1,.6,2.1);
  if(kind==='lake'){
   const dock=-7.35-y;
   // Timber stairs descend from the bank to a jetty just above the lake.
   for(let i=0;i<18;i++){const h=.1+(dock-.1)*(i+1)/18;put('wood',UNIT,-edge-8.5-i*.45,h,0,0xa38c68,.55,.2,2.7);}
   put('wood',UNIT,-edge-23,dock,0,0xa38c68,14,.2,3);
   for(let x=-edge-17;x>-edge-31;x-=4)for(const side of [-1,1])put('wood',CYLINDER,x,dock-1.2,side*1.6,0x756147,.15,3,.15);
   put('wood',UNIT,-edge-30,dock,0,0xb09773,3,.22,12);
   for(let i=0;i<8;i++)put('stone',SPHERE,-edge-9-i*2,-1.6-i*.25,8,0xaca795,1.9,1.5,1.7);
  }
 }
 build(group,index){
  const start=index*240,end=start+240,kind=this.settings.destination;if(!this.active(start+120))return;
  const b=new Batch(),rng=random(index*251+42),r=this.world.road,trunks=[],crowns=[];
  for(let z=Math.ceil(start/40)*40;z<end;z+=40){if(!this.active(z))continue;
   if(['neon','oldtown','pier','villa','lake'].includes(kind))this.boardwalk(b,group,z,kind);
   if(kind==='neon')this.building(b,group,z,1,'hotel',rng);
   if(kind==='oldtown'&&!(z>=120&&z<=280))this.building(b,group,z,1,'oldtown',rng);
   if(['estate','palms','villa'].includes(kind))for(const s of kind==='villa'?[1]:[-1,1])this.building(b,group,z,s,kind==='villa'?'modern':kind==='palms'?'residential':'estate',rng);
   if(kind==='airport'){const put=frame(b,r.x(z),r.y(z),z,0);put.y=r.y(z);for(const side of [-1,1])put('pavement',UNIT,side*(r.width(z)+3.7),.1,0,0xccc4ae,7.4,.2,40);this.palm(put,-10,0,15);this.lamp(put,-8,7,group);}
   if(kind==='pier'){const put=frame(b,r.x(z),r.y(z),z,0);put('pavement',UNIT,r.width(z)+3.7,.1,0,0xccc4ae,7.4,.2,40);}
   if(kind==='pier'&&z%80===0)this.building(b,group,z,1,'hotel',rng);
   if(kind==='lake')for(let t=0;t<5;t++){
    const tz=z-16+rng()*32,x=r.x(tz)+14+rng()*22,y=this.world.surfaceHeight(x,tz),size=5+rng()*5;
    trunks.push({p:[x,y+size*.43,tz],s:[size*.28,size*.86,size*.28]});
    for(let k=0;k<7;k++){const a=k*2.399;crowns.push({p:[x+Math.cos(a)*size*.24,y+size*(.75+rng()*.3),tz+Math.sin(a)*size*.24],s:[size*.4,size*.45,size*.4],r:[rng()*.3,rng()*6,0],c:k%4?0x829963:0x748861});}
   }
  }
  if(kind==='airport'&&start<=160&&end>160)this.terminal(b,group,160);
  if(kind==='oldtown'&&start<=210&&end>210)this.fortress(b,group,210);
  if(kind==='pier'&&start<=170&&end>170)this.wheel(b,group,170);
  b.flush(group,this.m);
  this.world.makeInstances(group,this.world.geos.trunk,this.world.trunkMat,trunks,true);
  this.world.makeInstances(group,this.world.geos.leaves,this.world.leafMat,crowns,true);
 }
 update(dt,state){
  this.t+=dt;const lit=this.world.atmo.lit;
  this.m.window.material.emissiveIntensity=.15+lit*1.3;
  this.m.neonBlue.material.emissiveIntensity=this.m.neonPink.material.emissiveIntensity=.6+lit*1.2;
  this.m.water.material.roughness=.12+this.world.atmo.rain*.12;
  const lights=[];
  for(const g of this.world.chunks.values()){
   if(g.userData.wheel){const {wheel,gondolas}=g.userData.wheel;wheel.rotation.z=this.t*.035;for(const c of gondolas)c.rotation.z=-wheel.rotation.z;}
   for(const p of g.userData.destinationLights||[])if(Math.abs(p[2]-state.z)<70)lights.push(p);
  }
  lights.sort((a,b)=>Math.hypot(a[0]-state.x,a[2]-state.z)-Math.hypot(b[0]-state.x,b[2]-state.z));
  this.lights.forEach((l,i)=>{const p=lights[i];l.intensity=p&&this.settings.quality!=='low'?lit*24:0;if(p)l.position.set(...p);});
 }
}
