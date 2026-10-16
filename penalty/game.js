import * as T from '../evermile/vendor/three.module.js';
import { fittedGloves } from './equipment.js?v=6';
import { FootContacts, reachBall, solveLimb } from './motion.js?v=6';
import { stadiumLighting, contactShading, broadcastLens, broadcastGrade } from './rendering.js?v=10';
import { advance, launchVelocity, predictAtPlane, groundContact, reflectContact, sweepSphereSegment } from './physics.js?v=6';
import { buildStadium } from './stadium.js?v=6';
import { GLTFLoader } from '../evermile/vendor/loaders/GLTFLoader.js';
import { EffectComposer } from '../evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../evermile/vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../evermile/vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../evermile/vendor/postprocessing/OutputPass.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';
import { clone as cloneSkinned } from '../evermile/vendor/utils/SkeletonUtils.js';

/* ---------- Constants (metres, seconds) ---------- */
const GOAL_W = 7.32, GOAL_H = 2.44, HALF_W = GOAL_W / 2, SPOT = 11, R = .11, POST = .06, G = 9.81, NET_D = 2.1;
const LEVELS = { easy: { save: .25, react: .3, reach: 2.6, shooterMiss: .2, shooterCorner: .5 }, normal: { save: .45, react: .22, reach: 3.1, shooterMiss: .1, shooterCorner: .7 }, hard: { save: .62, react: .16, reach: 3.5, shooterMiss: .05, shooterCorner: .88 } };
const $ = id => document.getElementById(id);
const settings = { level: 'normal', kit: 'red', sound: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem('penalty-settings') || '{}')); } catch {}
const save = () => { try { localStorage.setItem('penalty-settings', JSON.stringify(settings)); } catch {} };
const KITS = { red: ['#c8102e', '#1b1b1b'], white: ['#f3f3f3', '#1b1b1b'], blue: ['#1d4fb8', '#f3f3f3'], green: ['#0f7a3e', '#1b1b1b'] };

/* ---------- Renderer & scene ---------- */
const canvas = $('scene');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth<600?1.5:2)); renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.AgXToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;renderer.shadowMap.autoUpdate=false; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.fog = new T.Fog('#94a6b1', 90, 300);
const camera = new T.PerspectiveCamera(42, 1, .05, 300);camera.layers.enable(2);
const renderTarget=new T.WebGLRenderTarget(1,1,{samples:Math.min(4,renderer.capabilities.maxSamples),type:T.HalfFloatType});
const composer = new EffectComposer(renderer,renderTarget);
composer.addPass(new RenderPass(scene, camera));
const occlusion=contactShading(scene,camera);composer.addPass(occlusion);
const lens=broadcastLens(scene,camera);composer.addPass(lens.pass);
const bloom = new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), .06, .3, 2.5);
composer.addPass(bloom); composer.addPass(new OutputPass());
const grade=broadcastGrade();composer.addPass(grade);

const tex = (cv, srgb = true) => { const t = new T.CanvasTexture(cv); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
const canvas2d = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };

// Captured environment lighting supplies the subtle sky and stand reflections.
scene.background=new T.Color('#8a9fac');
const environmentReady=stadiumLighting(renderer,scene);
scene.add(new T.HemisphereLight('#d5e2eb','#566044',.18));
const flood=new T.DirectionalLight('#fff0d6',3.1);flood.position.set(-28,38,22);flood.castShadow=true;
Object.assign(flood.shadow.camera,{left:-18,right:18,top:20,bottom:-12,near:1,far:100});
flood.shadow.mapSize.set(innerWidth<600?2048:4096,innerWidth<600?2048:4096);flood.shadow.bias=-.00015;flood.shadow.normalBias=.018;flood.shadow.radius=1.6;
flood.target.position.set(0,0,7);scene.add(flood,flood.target);
const fill=new T.DirectionalLight('#c7def1',.32);fill.position.set(18,20,-14);scene.add(fill);

/* ---------- Pitch ---------- */
const materialJobs=[];
function assetTexture(name, srgb=true, repeats=null, gltfUV=false){
  let resolve,reject;const job=new Promise((a,b)=>{resolve=a;reject=b;});materialJobs.push(job);
  const map=new T.TextureLoader().load(`./assets/${name}.webp?v=4`,resolve,undefined,reject);
  if(srgb)map.colorSpace=T.SRGBColorSpace;map.flipY=!gltfUV;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  if(repeats){map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(...repeats);}return map;
}
const grassTex=assetTexture('pitch-color',true,[55,70]),grassNormal=assetTexture('pitch-normal',false,[55,70]);
const grassMaterial=new T.MeshStandardMaterial({map:grassTex,normalMap:grassNormal,normalScale:new T.Vector2(.18,.18),roughnessMap:assetTexture('pitch-roughness',false,[55,70]),aoMap:assetTexture('pitch-ao',false,[55,70]),aoMapIntensity:.45,roughness:1,color:'#c7d2ad'});
grassMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 vPitchWorld;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vPitchWorld=(modelMatrix*vec4(position,1.0)).xyz;');
 shader.fragmentShader='varying vec3 vPitchWorld;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
  float stripe=mod(floor((vPitchWorld.z+2.5)/5.0),2.0);
  diffuseColor.rgb*=mix(.96,1.025,stripe);
  float variation=sin(vPitchWorld.x*.18+sin(vPitchWorld.z*.31))*sin(vPitchWorld.z*.12);diffuseColor.rgb*=1.+variation*.035;
 `);
};
const pitch=new T.Mesh(new T.PlaneGeometry(110,140),grassMaterial);pitch.rotation.x=-Math.PI/2;pitch.position.z=40;pitch.receiveShadow=true;scene.add(pitch);
// Short cut grass at the action area, tapering into the scanned surface.
const bladeGeo=new T.BufferGeometry();bladeGeo.setAttribute('position',new T.Float32BufferAttribute([-.006,0,0,.006,0,0,.002,.034,.003],3));bladeGeo.computeVertexNormals();
const blades=new T.InstancedMesh(bladeGeo,new T.MeshBasicMaterial({color:'#9daf82',side:T.DoubleSide}),6500),bladeDummy=new T.Object3D();
for(let i=0;i<blades.count;i++){bladeDummy.position.set((Math.random()-.5)*14,.002,10+Math.random()*13);bladeDummy.rotation.y=Math.random()*Math.PI*2;bladeDummy.scale.setScalar(.55+Math.random()*.85);bladeDummy.updateMatrix();blades.setMatrixAt(i,bladeDummy.matrix);blades.setColorAt(i,new T.Color().setHSL(.21+Math.random()*.035,.27,.3+Math.random()*.1));}scene.add(blades);
const wear = new T.Mesh(new T.PlaneGeometry(2.8, 3.5), new T.MeshStandardMaterial({
  map: tex(canvas2d(256,256,(g,w,h) => {
    for(let i=0;i<7000;i++) { const x=Math.random()*w,y=Math.random()*h, d=Math.hypot((x-w/2)/(w/2),(y-h/2)/(h/2));
      g.fillStyle=`rgba(112,91,48,${Math.max(0,1-d)*Math.random()*.45})`;g.fillRect(x,y,2,5); }
  })), transparent:true, depthWrite:false, roughness:1
}));
wear.rotation.x=-Math.PI/2;wear.position.set(0,.004,SPOT);scene.add(wear);

{ // markings: penalty area, goal area, spot, arc, goal line
  const PX = 20, W = 72, D = 110, cv = canvas2d(W * PX, D * PX, (g) => {
    g.strokeStyle = 'rgba(255,255,255,.92)'; g.fillStyle = 'rgba(255,255,255,.92)'; g.lineWidth = .12 * PX;
    const X = x => (x + W / 2) * PX, Z = z => (z + 1) * PX;
    g.beginPath(); g.moveTo(0, Z(0)); g.lineTo(W * PX, Z(0)); g.stroke();
    g.strokeRect(X(-20.16), Z(0), 40.32 * PX, 16.5 * PX); g.strokeRect(X(-9.16), Z(0), 18.32 * PX, 5.5 * PX);
    g.beginPath(); g.arc(X(0), Z(SPOT), .15 * PX, 0, Math.PI * 2); g.fill();
    g.strokeRect(X(-34),Z(0),68*PX,105*PX);
    g.beginPath();g.moveTo(X(-34),Z(52.5));g.lineTo(X(34),Z(52.5));g.stroke();
    g.beginPath();g.arc(X(0),Z(52.5),9.15*PX,0,Math.PI*2);g.stroke();
    g.strokeRect(X(-20.16),Z(88.5),40.32*PX,16.5*PX);g.strokeRect(X(-9.16),Z(99.5),18.32*PX,5.5*PX);
    g.beginPath();g.arc(X(0),Z(94),.15*PX,0,Math.PI*2);g.fill();
    g.save();g.beginPath();g.rect(0,0,W*PX,Z(88.5));g.clip();g.beginPath();g.arc(X(0),Z(94),9.15*PX,0,Math.PI*2);g.stroke();g.restore();
    g.save(); g.beginPath(); g.rect(0, Z(16.5), W * PX, D * PX); g.clip(); g.beginPath(); g.arc(X(0), Z(SPOT), 9.15 * PX, 0, Math.PI * 2); g.stroke(); g.restore();
  });
  const lines = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: tex(cv), transparent: true, roughness: .9, depthWrite: false }));
  lines.rotation.x = -Math.PI / 2; lines.position.set(0, .006, D / 2 - 1); lines.receiveShadow = true; scene.add(lines);
}

/* ---------- Goal & net ---------- */
const white = new T.MeshPhysicalMaterial({ color: '#ffffff', roughness: .25, clearcoat: 1 });
const postGeo = new T.CylinderGeometry(POST, POST, GOAL_H + POST, 24);
for (const x of [-HALF_W - POST, HALF_W + POST]) { const p = new T.Mesh(postGeo, white); p.position.set(x, (GOAL_H + POST) / 2, 0); p.castShadow = true; scene.add(p); }
const bar = new T.Mesh(new T.CylinderGeometry(POST, POST, GOAL_W + POST * 4, 24), white); bar.rotation.z = Math.PI / 2; bar.position.set(0, GOAL_H + POST, 0); bar.castShadow = true; scene.add(bar);
for (const x of [-HALF_W - POST, HALF_W + POST]) { // back supports
  const s = new T.Mesh(new T.CylinderGeometry(.025, .025, 2.2, 8), white); s.position.set(x, 1.1, -NET_D); scene.add(s);
  const t = new T.Mesh(new T.CylinderGeometry(.025, .025, Math.hypot(NET_D, .5), 8), white); t.rotation.x = Math.atan2(NET_D, .5); t.position.set(x, 2.2 + .25, -NET_D / 2); scene.add(t);
}

// The far goal and complete pitch remain visible from the goalkeeper camera.
for(const x of [-HALF_W-POST,HALF_W+POST]){const p=new T.Mesh(postGeo,white);p.position.set(x,(GOAL_H+POST)/2,105);scene.add(p);}
const farBar=new T.Mesh(new T.CylinderGeometry(POST,POST,GOAL_W+POST*4,16),white);farBar.rotation.z=Math.PI/2;farBar.position.set(0,GOAL_H+POST,105);scene.add(farBar);
const farNet=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(GOAL_W,GOAL_H,NET_D)),new T.LineBasicMaterial({color:'#b4c0c8',transparent:true,opacity:.35}));farNet.position.set(0,GOAL_H/2,105+NET_D/2);scene.add(farNet);

class NetPanel {
  constructor(corner, u, v, nu, nv) {
    this.base = []; const idx = [];this.nu=nu;this.nv=nv;this.pinned=[];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) this.base.push(new T.Vector3().copy(corner).addScaledVector(u, i / nu).addScaledVector(v, j / nv));
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; if (i < nu) idx.push(k, k + 1); if (j < nv) idx.push(k, k + nu + 1); }
    this.edges=idx;this.points=this.base.map(p=>p.clone());
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)this.pinned.push(i===0||i===nu||j===0||j===nv);
    this.mesh=new T.InstancedMesh(new T.CylinderGeometry(.0028,.0028,1,4),new T.MeshStandardMaterial({color:'#cbd0cb',roughness:.86}),idx.length/2);this.mesh.frustumCulled=false;scene.add(this.mesh);this.draw();
    this.offset = this.base.map(() => new T.Vector3()); this.vel = this.base.map(() => new T.Vector3());
  }
  hit(point, push) { this.base.forEach((b, k) => { const d = b.distanceToSquared(point); this.vel[k].addScaledVector(push, (this.pinned[k]?0:Math.exp(-d / .6)) * 9); }); }
  draw(){
    const dummy=new T.Object3D(),up=new T.Vector3(0,1,0);
    for(let i=0;i<this.edges.length;i+=2){const a=this.points[this.edges[i]],b=this.points[this.edges[i+1]],d=b.clone().sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.clone().normalize());dummy.scale.set(1,d.length(),1);dummy.updateMatrix();this.mesh.setMatrixAt(i/2,dummy.matrix);}this.mesh.instanceMatrix.needsUpdate=true;
  }
  update(dt) {
    let moving=false;dt=Math.min(dt,.035);
    this.base.forEach((b,k)=>{const o=this.offset[k],v=this.vel[k];if(this.pinned[k]){o.set(0,0,0);v.set(0,0,0);}else{v.addScaledVector(o,-60*dt).multiplyScalar(Math.exp(-6*dt));o.addScaledVector(v,dt);if(o.lengthSq()>1e-6)moving=true;}this.points[k].copy(b).add(o);});
    if(moving||this.lastMoving)this.draw();this.lastMoving=moving;
  }
}
const nets = [
  new NetPanel(new T.Vector3(-HALF_W, 0, -NET_D), new T.Vector3(GOAL_W, 0, 0), new T.Vector3(0, 2.2, 0), 44, 14),
  new NetPanel(new T.Vector3(-HALF_W, GOAL_H, 0), new T.Vector3(GOAL_W, 0, 0), new T.Vector3(0, -.24, -NET_D), 44, 12),
  new NetPanel(new T.Vector3(-HALF_W, 0, 0), new T.Vector3(0, 0, -NET_D), new T.Vector3(0, GOAL_H, 0), 12, 15),
  new NetPanel(new T.Vector3(HALF_W, 0, 0), new T.Vector3(0, 0, -NET_D), new T.Vector3(0, GOAL_H, 0), 12, 15)
];

/* ---------- Stadium ---------- */
const stadium=buildStadium(scene,assetTexture('crowd-fans'),{concrete:assetTexture('concrete-color',true,[48,1]),normal:assetTexture('concrete-normal',false,[48,1])});
// LED advertising boards
const adCanvas = canvas2d(2048, 64, (g, w, h) => {
  g.fillStyle = '#05070d'; g.fillRect(0, 0, w, h);
  const items = [['HISAN ALI', '#e1e9ed'], ['PENALTY · MATCHDAY', '#8cb6ca'], ['THE BEAUTIFUL GAME', '#e1e9ed'], ['HISANALI.COM', '#b5c8d5']];
  g.font = '800 38px Manrope, Arial, sans-serif'; g.textBaseline = 'middle'; let x = 20;
  while (x < w) for (const [t, c] of items) { g.fillStyle = c; g.fillText(t, x, h / 2 + 2); x += g.measureText(t).width + 70; }
});
const adTex = tex(adCanvas); adTex.wrapS = T.RepeatWrapping; adTex.repeat.set(4, 1);
const boards = new T.Mesh(new T.BoxGeometry(72, .7, .15), [0, 0, 0, 0, 1, 0].map(f => f ? new T.MeshBasicMaterial({ map: adTex, toneMapped: false }) : new T.MeshStandardMaterial({ color: '#0b0e16' })));
boards.position.set(0, .35, -10); scene.add(boards);

/* ---------- Ball ---------- */
// Truncated-icosahedron panel construction: twelve pentagons, twenty hexagons.
const ico=new T.IcosahedronGeometry(1,0),verts=[],faces=[];
for(let i=0;i<ico.attributes.position.count;i+=3){const face=[];for(let j=0;j<3;j++){
 const v=new T.Vector3().fromBufferAttribute(ico.attributes.position,i+j);let n=verts.findIndex(p=>p.distanceToSquared(v)<1e-8);if(n<0){n=verts.length;verts.push(v);}face.push(n);
}faces.push(face);}
const ball=new T.Group();scene.add(ball);
const panelMat=[new T.MeshPhysicalMaterial({color:'#f5f3e9',roughness:.5,clearcoat:.25}),new T.MeshPhysicalMaterial({color:'#111820',roughness:.4,clearcoat:.35})];
const ballBump=tex(canvas2d(128,128,(g,w,h)=>{g.fillStyle='#999';g.fillRect(0,0,w,h);for(let i=0;i<10000;i++){g.fillStyle=Math.random()<.5?'#777':'#bbb';g.fillRect(Math.random()*w,Math.random()*h,1,1);}}),false);
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
 const mesh=new T.Mesh(geo,panelMat[black?1:0]);mesh.material.side=T.DoubleSide;mesh.castShadow=true;ball.add(mesh);
}
for(const f of faces){const points=[];for(let j=0;j<3;j++){const a=verts[f[j]],b=verts[f[(j+1)%3]];points.push(a.clone().lerp(b,1/3).normalize(),a.clone().lerp(b,2/3).normalize());}panel(points,false);}
verts.forEach((v,i)=>{const neighbors=new Set();for(const f of faces)if(f.includes(i))f.forEach(n=>{if(n!==i)neighbors.add(n);});const axis=new T.Vector3(0,1,0);if(Math.abs(v.y)>.9)axis.set(1,0,0);const u=new T.Vector3().crossVectors(v,axis).normalize(),w=new T.Vector3().crossVectors(v,u);
 const points=[...neighbors].map(n=>v.clone().lerp(verts[n],1/3).normalize());points.sort((a,b)=>Math.atan2(a.dot(w),a.dot(u))-Math.atan2(b.dot(w),b.dot(u)));panel(points,true);});
const shotTrail=new T.Line(new T.BufferGeometry().setFromPoints(Array.from({length:14},()=>new T.Vector3())),new T.LineBasicMaterial({color:'#e8f1ff',transparent:true,opacity:.13,depthWrite:false,blending:T.AdditiveBlending}));scene.add(shotTrail);
function updateShotTrail(){
 const fast=ballState&&!ballState.result&&ballState.v.length()>20;
 shotTrail.visible=!!fast;if(!fast)return;
 // A short shutter-length smear, rather than a multi-metre arcade trail.
 const attr=shotTrail.geometry.attributes.position;
 for(let i=0;i<14;i++){const p=ball.position.clone().addScaledVector(ballState.v,-i/13/120);attr.setXYZ(i,p.x,p.y,p.z);}attr.needsUpdate=true;shotTrail.geometry.computeBoundingSphere();
}

/* ---------- People ---------- */
// One cached Meshopt-compressed athlete package, cloned with independent skeletons.
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let footballer;
const playerMaps={color:assetTexture('player-detail',true,null,true),normal:assetTexture('player-normal',false,null,true),hair:assetTexture('hair-color',true,null,true),hairNormal:assetTexture('hair-normal',false,null,true)};
const modelReady = loader.loadAsync('./assets/athlete.glb?v=6', e => {
  if(e.total) $('load-progress').textContent = `${Math.round(e.loaded/e.total*100)}%`;
}).then(g => { footballer=g; });
const bodiesReady=Promise.all([modelReady,environmentReady,...materialJobs]);
const KICK_CLIP='kick-pro',CONTACT=1.10; // Ground-contact event after capture retargeting and strike IK.
const footShadowGeometry=new T.PlaneGeometry(.34,.48);
const footShadowMap=tex(canvas2d(64,64,(g,w,h)=>{const gradient=g.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);gradient.addColorStop(0,'rgba(0,0,0,.6)');gradient.addColorStop(.45,'rgba(0,0,0,.25)');gradient.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gradient;g.fillRect(0,0,w,h);}));
class Rig {
  constructor(kind, shirt, shorts, gloves) {
    this.ownedGeometries=new Set();this.ownedTextures=new Set();
    this.footShadows=['Left','Right'].map(side=>{const mesh=new T.Mesh(footShadowGeometry,new T.MeshBasicMaterial({map:footShadowMap,transparent:true,depthWrite:false,opacity:.45}));mesh.rotation.x=-Math.PI/2;mesh.renderOrder=2;mesh.layers.set(2);scene.add(mesh);return {side,mesh};});
    const model = cloneSkinned(footballer.scene); this.root=new T.Group();this.root.add(model);this.kind=kind;
    model.updateMatrixWorld(true); model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
    const k=kind==='keeper'?1.10:1.045; // Athletic scale: roughly 1.88 m keeper and 1.79 m taker.
    model.scale.setScalar(k);model.position.y=0;this.k=k;this.model=model;
    model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
      const name=o.name.toLowerCase();o.material=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.54,metalness:0,envMapIntensity:.85,reflectivity:.28});o.material.color.set('#ffffff');o.material.map=playerMaps.color;o.material.normalMap=playerMaps.normal;o.material.normalScale.set(.7,.7);o.material.roughness=.65;
      if(name.includes('shirt')){o.material.color.set(shirt);o.material.roughness=.83;o.material.sheen=.7;o.material.sheenRoughness=.8;o.material.sheenColor.set(shirt);}
      if(name.includes('shorts')){o.material.color.set(shorts);o.material.roughness=.88;o.material.sheen=.5;o.material.sheenColor.set(shorts);}
      if(name.includes('socks')){o.material.color.set(shirt);o.material.roughness=.95;}
      if(name.includes('shoes')){o.material.color.set('#c4c8cc');o.material.roughness=.32;o.material.clearcoat=.25;}
      if(name.includes('hair')||name.includes('eyelashes')){o.material.map=playerMaps.hair;o.material.normalMap=playerMaps.hairNormal;o.material.alphaTest=.32;o.material.side=T.DoubleSide;o.material.roughness=.8;}
    });
    this.bones={};model.traverse(o=>{if(o.isBone)this.bones[o.name]=o;});
    this.mixer=new T.AnimationMixer(model);this.clips={};
    for(const original of footballer.animations){
      const clip=original.clone();
      // Locomotion is in-place; keep the captured root motion for strikes and dives.
      if(['idle','run','ready','celebrate','disappointed','dive','dive2','jump'].includes(clip.name)){
        for(const track of clip.tracks)if(track.name==='Hips.position'){
          for(let i=0;i<track.values.length;i+=3){if(!['dive','dive2','jump'].includes(clip.name))track.values[i]=track.values[0];track.values[i+1]=track.values[1];}
        }
      }
      const action=this.mixer.clipAction(clip);this.clips[clip.name]=action;
      if(['dive','dive2'].includes(clip.name))for(const height of ['low','high']){
        const variant=clip.clone();variant.name=`dive-${clip.name==='dive'?'right':'left'}-${height}`;
        const diveAction=this.mixer.clipAction(variant);diveAction.setLoop(T.LoopOnce,1);diveAction.clampWhenFinished=true;this.clips[variant.name]=diveAction;
      }
      if(!['idle','run','ready'].includes(clip.name)){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}
    }
    if(gloves){const fitted=fittedGloves(model,gloves);if(fitted)this.ownedGeometries.add(fitted.geometry);
      const units=this.bones.LeftHand.getWorldScale(new T.Vector3()).x;
      for(const side of ['Left','Right']){const cuff=new T.Mesh(new T.CylinderGeometry(.036/units,.031/units,.045/units,10),new T.MeshStandardMaterial({color:'#17282c',roughness:.85}));cuff.position.y=-.016/units;this.bones[side+'Hand'].add(cuff);this.ownedGeometries.add(cuff.geometry);}
    }
    // The original kit atlas supplies its number, stitching, boot and skin detail.
    this.current=null;this.event=null;this.contacts=new FootContacts(this);scene.add(this.root);
  }
  play(name, speed=1, fade=.16, anchored=false) {
    const action=this.clips[name];if(!action)return;
    if(this.current===action)return;
    const previous=this.current;
    this.contacts?.reset();this.rootTransition=null;
    if(anchored&&previous){
      // Captures have different root origins. Blend an equal and opposite
      // world offset alongside the bones so the hips do not slide backwards.
      this.root.updateMatrixWorld(true);
      const old=this.bone('Hips'),track=action.getClip().tracks.find(t=>t.name==='Hips.position');
      if(track){const next=this.bones.Hips.parent.localToWorld(new T.Vector3().fromArray(track.values));
        const offset=old.sub(next);offset.y=0;
        this.rootTransition={from:this.root.position.clone(),to:this.root.position.clone().add(offset),time:0,duration:Math.max(.001,fade)};
      }
    }
    action.enabled=true;action.reset().setEffectiveTimeScale(speed).setEffectiveWeight(1).play();
    if(previous&&previous!==action)previous.crossFadeTo(action,fade,false);
    this.current=action;this.anim=name;this.event=null;
  }
  update(dt){
    this.root.position.y-=this.groundLift||0;this.groundLift=0;
    this.mixer.update(dt);
    if(this.rootTransition){const t=this.rootTransition;t.time+=dt;this.root.position.lerpVectors(t.from,t.to,Math.min(1,t.time/t.duration));if(t.time>=t.duration)this.rootTransition=null;}
    if(this.kind==='shooter'){
      this.root.updateMatrixWorld(true);
      let sole=Infinity;for(const [name,radius]of [['LeftToeBase',.025],['RightToeBase',.025],['LeftFoot',.045],['RightFoot',.045]])sole=Math.min(sole,this.bone(name).y-radius);
      this.groundLift=Math.max(0,.001-sole);this.root.position.y+=this.groundLift;
    }
    this.contacts.update(dt,this.kind==='shooter'&&['idle','kick','kick-pro'].includes(this.anim)||this.kind==='keeper'&&this.anim==='ready');
    if(this.kind==='shooter'&&this.anim===KICK_CLIP){
      const t=this.current.time;
      const plant=T.MathUtils.smoothstep(t,CONTACT-.32,CONTACT-.12)*(1-T.MathUtils.smoothstep(t,CONTACT+.12,CONTACT+.35));
      if(this.plantAnchor)solveLimb(this.bones.LeftUpLeg,this.bones.LeftLeg,this.bones.LeftFoot,this.plantAnchor,plant);
      const strike=Math.max(0,1-Math.abs(t-CONTACT)/.19),weight=strike*strike*(3-2*strike);
      const offset=this.bone('RightToeBase').sub(this.bone('RightFoot'));
      const contact=new T.Vector3(0,R,SPOT).sub(offset);
      solveLimb(this.bones.RightUpLeg,this.bones.RightLeg,this.bones.RightFoot,contact,weight);
    }
    this.updateContactShadows();
    if(this.event&&this.current.time>=this.event.at){const fn=this.event.fn;this.event=null;fn();}}
  updateContactShadows(){for(const {side,mesh}of this.footShadows){const ankle=this.bone(side+'Foot'),toe=this.bone(side+'ToeBase'),p=ankle.clone().lerp(toe,.6);mesh.position.set(p.x,.008,p.z);mesh.rotation.z=-Math.atan2(toe.x-ankle.x,toe.z-ankle.z);mesh.material.opacity=.4*T.MathUtils.clamp(1-(ankle.y-.08)/.32,0,1);}}
  hand(side){const bone=this.bones[side+'Hand'];return bone.localToWorld(new T.Vector3(0,4,0));}
  bone(name){return this.bones[name].getWorldPosition(new T.Vector3());}
  dispose(){for(const {mesh}of this.footShadows){scene.remove(mesh);mesh.material.dispose();}this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);scene.remove(this.root);this.model.traverse(o=>{if(o.isMesh)o.material.dispose();});this.ownedGeometries.forEach(g=>g.dispose());this.ownedTextures.forEach(t=>t.dispose());}
}
let keeper, shooter;
function dressTeams(youShoot) {
  keeper?.dispose(); shooter?.dispose();
  const [you, youShorts] = KITS[settings.kit] || KITS.red, cpu = settings.kit === 'white' ? ['#1d1d1d', '#1d1d1d'] : ['#f3f3f3', '#1d1d1d'];
  keeper = new Rig('keeper', youShoot ? '#f2c230' : '#22c46e', '#1b1b1b', '#f4f4f4');
  shooter = new Rig('shooter', youShoot ? you : cpu[0], youShoot ? youShorts : cpu[1]);
  shooter.play('idle'); keeper.play('ready');shooter.mixer.update(0);keeper.mixer.update(0);
}

/* ---------- Sound ---------- */
const sound = {
  loadRecordings(){
    if(this.loading||!settings.sound)return;const c=this.ctx();if(!c)return;
    this.loading=Promise.all(['stadium-bed','crowd-reaction','referee-whistle','ball-kick'].map(name=>fetch(`./assets/${name}.mp3?v=4`).then(r=>{if(!r.ok)throw new Error('audio');return r.arrayBuffer();}).then(bytes=>c.decodeAudioData(bytes)))).then(([bed,reaction,whistle,kick])=>{
      this.recordedKick=kick;this.bed=bed;this.reaction=reaction;this.recordedWhistle=whistle;if(this.ambSource)this.ambSource.stop();if(this.amb)this.amb.disconnect();this.amb=null;if(mode&&settings.sound){this.ambience();this.setAmbience(true);}
    }).catch(()=>{});
  },
  sample(buffer,volume,offset=0,duration=buffer.duration){if(!settings.sound)return;const c=this.ctx(),source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;const t=c.currentTime,len=Math.min(duration,buffer.duration-offset);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.04);gain.gain.setValueAtTime(volume,t+Math.max(.04,len-.2));gain.gain.linearRampToValueAtTime(0,t+len);source.connect(gain).connect(this.master);source.onended=()=>{source.disconnect();gain.disconnect();};source.start(0,offset,len);},
  ctx() { if (!this.c) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.c = new A();this.master=this.c.createGain();this.master.gain.value=settings.sound?1:0;this.master.connect(this.c.destination); this.crowdGain = null; } if (this.c.state === 'suspended') this.c.resume(); return this.c; },
  noise(len, vol, type, freq, q = 1) { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const b = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(), t = c.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.3, len * .25)); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(f).connect(g).connect(this.master); s.start(); },
  kick() { if(this.recordedKick){this.sample(this.recordedKick,.7);return;}if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g).connect(this.master); o.start(); o.stop(t + .2); this.noise(.06, .4, 'bandpass', 900, 1.5); },
  whistle() { if(this.recordedWhistle){this.sample(this.recordedWhistle,.35);return;}if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.frequency.value = 2900; lfo.frequency.value = 38; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .02); g.gain.setValueAtTime(.12, t + .32); g.gain.linearRampToValueAtTime(0, t + .4); o.connect(g).connect(this.master); o.start(); lfo.start(); o.stop(t + .45); lfo.stop(t + .45); },
  cheer() { if(this.bed){this.sample(this.bed,.32,Math.random()*Math.max(0,this.bed.duration-4),3.6);return;}this.noise(3.2,.3,'bandpass',1100,.5); },
  groan() { if(this.reaction){this.sample(this.reaction,.28);return;}this.noise(1.8,.2,'lowpass',380); },
  net() { this.noise(.35, .35, 'highpass', 2500); },
  post() { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime; [420, 1130, 2210].forEach(f => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .9); o.connect(g).connect(this.master); o.start(); o.stop(t + 1); }); },
  ambience() { if (!settings.sound || this.amb) return; const c = this.ctx(); if (!c) return; const b = this.bed||c.createBuffer(1,c.sampleRate*4,c.sampleRate);if(!this.bed){const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;} const s = c.createBufferSource(); s.buffer = b; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = .4; const g = c.createGain(); g.gain.value=this.bed?.13:.045;s.connect(f).connect(g).connect(this.master);s.start();this.amb=g;this.ambSource=s; },
  setAmbience(on) { if(this.master)this.master.gain.value=settings.sound?1:0; if (this.amb) this.amb.gain.value = on && settings.sound ? this.bed?.13:.045 : 0; }
};

/* ---------- Game state ---------- */
let cpuTimer=0;
let mode = null, phase = 'menu', score = { you: [], cpu: [] }, youShooting = true, streak = 0, best = Number(localStorage.getItem('penalty-best') || 0);
let ballState = null, keeperState = null, timeScale = 1, camTarget = null, swipe = null, tapAim = null;
const level = () => LEVELS[settings.level] || LEVELS.normal;

function keeperView(){
  // Fit the entire goal mouth, so every legal dive destination can be tapped.
  const horizontal=Math.tan(T.MathUtils.degToRad(camera.fov*.5))*camera.aspect;
  const distance=T.MathUtils.clamp((GOAL_W+1.2)/(2*horizontal),6.5,17);
  return {pos:new T.Vector3(0,2.3+Math.max(0,distance-8)*.46,-distance),look:new T.Vector3(0,.95,SPOT)};
}
function setupKick(youShoot) {
  clearTimeout(cpuTimer); replay=null;replayHistory=[];$('replay-skip').hidden=true; youShooting = youShoot; dressTeams(youShoot);
  ball.position.set(0, R, SPOT); ball.rotation.set(0, 0, 0);
  keeperState = { x: 0, y: 0, start: 0, from: new T.Vector3(0, 1, 0), to: null, dur: .6, diving: false, t: 0 };
  keeper.root.position.set(0, 0, .35); keeper.root.rotation.set(0, 0, 0);
  shooter.root.rotation.set(0,Math.PI,0);
  // The kick capture already travels from the waiting stance to the ball.
  // Align its contact once, then begin the idle at that same world origin.
  shooter.mixer.stopAllAction();shooter.current=null;shooter.play(KICK_CLIP,1,0);shooter.mixer.update(CONTACT);
  shooter.root.position.set(0,0,0);shooter.root.updateMatrixWorld(true);
  const lateral=shooter.bone('LeftUpLeg').sub(shooter.bone('RightUpLeg')),forward=lateral.cross(new T.Vector3(0,1,0)).normalize();
  shooter.root.rotation.y+=Math.PI-Math.atan2(forward.x,forward.z);shooter.root.updateMatrixWorld(true);
  const toe=shooter.bone('RightToeBase');shooter.root.position.set(-toe.x,0,SPOT-toe.z);
  shooter.plantAnchor=shooter.bone('LeftFoot');shooter.plantAnchor.y=.105;
  shooter.mixer.stopAllAction();shooter.current=null;shooter.play('idle',1,0);shooter.mixer.update(0);
  shooter.root.visible = true;
  ballState = null; timeScale = 1; tapAim = null;
  camTarget = youShoot ? { pos: new T.Vector3(innerWidth<600?-.55:.5, 2.5, SPOT + 8.5), look: new T.Vector3(0, .9, 0) } : keeperView();
  if (mode) { camera.position.copy(camTarget.pos); camTarget.cur = camTarget.look.clone(); camera.lookAt(camTarget.cur); camera.updateMatrixWorld(true); }
  phase = youShoot ? 'aim' : 'cpu-runup';
  if (!youShoot) cpuTimer=setTimeout(() => cpuShoot(), 1400);
  hud();
}

/* ---------- Shooting ---------- */
function kick(target, flight, curl, byYou) {
  // Solve the launch so the ball reaches `target` (on the goal plane) after `flight` seconds with sideways curl acceleration.
  const p0=ball.position.clone(),spin=new T.Vector3(5,-curl*3.2,0);
  const v=launchVelocity(p0,target,flight,spin);
  ballState={goalTarget:target.clone(),v,curl,spin,time:0,launchTime:simTime,crossed:false,result:null,byYou,done:false,rest:0,touched:false,hitPost:false};
  sound.kick(); phase = 'flight';

  // Keeper reaction
  if (byYou) {
    const L = level(), guessRight = Math.random() < L.save, side = Math.random() < .5 ? -1 : 1;
    const aim = guessRight ? new T.Vector3(target.x + (Math.random() - .5) * 1.2, Math.min(2.3, Math.max(.3, target.y + (Math.random() - .5) * .8)), 0)
      : new T.Vector3(Math.random() < .2 ? 0 : side * (1.5 + Math.random() * 2), .4 + Math.random() * 1.6, 0);
    keeperState.pending = { at: simTime + L.react, aim, reach: L.reach };
  } else if (tapAim) dive(tapAim, 3.3);
}

function dive(aim, reach) {
  const k=keeperState;if(!k||k.diving)return;
  const previousAction=keeper.current,previousTime=previousAction?.time||0;
  const incoming=ballState?.v.z<0?ballState:null;
  const prediction=incoming?predictAtPlane(ball.position,incoming.v,incoming.spin,.9):null;
  const bias=prediction?prediction.position.clone().sub(incoming.goalTarget):new T.Vector3();
  const dx=T.MathUtils.clamp(aim.x+bias.x,-reach,reach),dy=T.MathUtils.clamp(aim.y+bias.y,.18,2.4);
  const central=Math.abs(dx)<.6,high=dy>1.25;
  const clip=central?'jump':`dive-${dx<0?'left':'right'}-${high?'high':'low'}`;
  const reachTime=central?.76:high?.88:1.22;
  k.diving=true;k.start=simTime;k.to=new T.Vector3(dx,dy,.8);k.dur=prediction?Math.max(.32+Math.abs(dx)*.065,Math.min(.8,prediction.time)):.32+Math.abs(dx)*.075;k.clip=clip;k.origin=keeper.root.position.clone();
  // Calibrate one absolute trajectory from the captured extension. Never drag
  // the entire actor upwards every frame to force its glove onto a target.
  keeper.mixer.stopAllAction();keeper.current=null;keeper.play(clip,1,0);keeper.mixer.update(reachTime);
  const left=keeper.hand('Left'),right=keeper.hand('Right');
  k.hand=high?(left.y>right.y?'Left':'Right'):(left.y<right.y?'Left':'Right');
  const sample=keeper.hand(k.hand);
  k.shiftX=dx-sample.x;k.sampleHipX=keeper.bone('Hips').x-k.origin.x;
  k.jump=T.MathUtils.clamp(dy-sample.y,0,.85);
  k.takeoff=.07;const airborne=Math.max(.12,k.dur-k.takeoff);
  k.verticalSpeed=(k.jump+.5*G*airborne*airborne)/airborne;
  keeper.mixer.stopAllAction();
  // Restore the live ready pose after calibration, then blend into the push-off.
  if(previousAction){previousAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();previousAction.time=previousTime;keeper.current=previousAction;keeper.mixer.update(0);}
  else keeper.current=null;
  keeper.play(clip,reachTime/k.dur,.09);keeper.mixer.update(0);
}

function cpuShoot() {
  if (phase !== 'cpu-runup') return;
  phase = 'cpu-kick';
  runUp(() => {
    const L = level(), side = Math.random() < .5 ? -1 : 1, miss = Math.random() < L.shooterMiss, corner = Math.random() < L.shooterCorner;
    let tx = corner ? side * (2.4 + Math.random() * 1.0) : (Math.random() - .5) * 3.6, ty = corner ? (Math.random() < .5 ? .25 + Math.random() * .4 : 1.6 + Math.random() * .7) : .3 + Math.random() * 1.8;
    if (miss) { if (Math.random() < .5) ty = GOAL_H + .3 + Math.random() * .8; else tx = side * (HALF_W + .4 + Math.random()); }
    kick(new T.Vector3(tx, ty, 0), .55 + Math.random() * .25, (Math.random() - .5) * 8, false);
  });
}

// The penalty clip includes its final strides. Sample its boot at the contact
// marker to place the whole captured motion precisely against the stationary ball.
function runUp(then) {
  // Use the continuous approach, plant, strike and follow-through from the
  // same capture. An unrelated jog inserted here caused a visible hitch.
  shooter.play(KICK_CLIP,1,.12);
  shooter.event={at:CONTACT,fn:()=>{then?.();}};
}

/* ---------- Swipe input ---------- */
const trail = $('trail'), tg = trail.getContext('2d');
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w,h); camera.aspect = w / h;
  camera.fov = w / h < .8 ? 58 : 42; camera.updateProjectionMatrix();
  trail.width = w * devicePixelRatio; trail.height = h * devicePixelRatio; trail.style.width = w + 'px'; trail.style.height = h + 'px';
  if(mode&&!youShooting&&camTarget){const view=keeperView();camTarget.pos.copy(view.pos);camTarget.look.copy(view.look);
    if(['cpu-runup','cpu-kick','flight'].includes(phase)){camera.position.copy(view.pos);camTarget.cur=view.look.clone();camera.lookAt(view.look);camera.updateMatrixWorld(true);}
  }
}
addEventListener('resize', resize); resize();

canvas.addEventListener('pointerdown', e => {
  sound.ctx();
  if (phase === 'aim') { swipe = { pts: [[e.clientX, e.clientY, performance.now()]] }; canvas.setPointerCapture(e.pointerId); }
  else if (phase === 'cpu-runup' || phase === 'cpu-kick' || (phase === 'flight' && !youShooting && !keeperState.diving)) {
    const rc = new T.Raycaster(), p = new T.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); camera.updateMatrixWorld(true); rc.setFromCamera(p, camera);
    const hit = new T.Vector3(); if (!rc.ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), 0), hit)) return;
    tapAim = hit; showAim(e.clientX, e.clientY);
    if (phase === 'flight') dive(hit, 3.3);
  }
});
canvas.addEventListener('pointercancel',()=>{swipe=null;fadeTrail();});
canvas.addEventListener('lostpointercapture',()=>{if(swipe){swipe=null;fadeTrail();}});
canvas.addEventListener('pointermove', e => { if (swipe) { swipe.pts.push([e.clientX, e.clientY, performance.now()]); drawTrail(); } });
canvas.addEventListener('pointerup', () => {
  if (!swipe) return; const pts = swipe.pts; swipe = null; fadeTrail();
  if (pts.length < 3) return;
  const [x0, y0, t0] = pts[0], [x1, y1, t1] = pts.at(-1), dx = x1 - x0, dy = y0 - y1, len = Math.hypot(dx, dy);
  if (dy < 40 || len < 60) { toast('Swipe up towards the goal'); return; }
  const W = Math.min(innerWidth, innerHeight * 1.2), H = innerHeight;
  const speed = len / Math.max(60, t1 - t0); // px per ms
  // Sideways bend: how far the middle of the swipe strays from a straight line.
  const [mx, my] = pts[Math.floor(pts.length / 2)], dev = ((mx - x0) * dy + (my - y0) * dx) / Math.max(1, len);
  const power = Math.min(1.6, speed / 1.6), flight = Math.max(.42, .95 - power * .35);
  let tx = dx / (W * .38) * HALF_W, ty = Math.min(3.6, (dy / (H * .42)) * GOAL_H * (.75 + power * .35));
  const wobble = Math.max(0, power - 1.05) * 1.6; tx += (Math.random() - .5) * wobble; ty += Math.random() * wobble * .8;
  const curl = Math.max(-14, Math.min(14, -dev / W * 90));
  tx += .5 * curl * flight * flight * .25;
  phase='runup'; hud();
  runUp(()=>kick(new T.Vector3(tx, Math.max(.12, ty), 0), flight, curl, true));
});
function drawTrail() {
  const d = devicePixelRatio, pts = swipe.pts; tg.clearRect(0, 0, trail.width, trail.height); tg.lineCap = 'round'; tg.lineJoin = 'round';
  for (let i = 1; i < pts.length; i++) { tg.strokeStyle = `rgba(223,255,99,${.25 + .75 * i / pts.length})`; tg.lineWidth = (4 + 10 * i / pts.length) * d; tg.beginPath(); tg.moveTo(pts[i - 1][0] * d, pts[i - 1][1] * d); tg.lineTo(pts[i][0] * d, pts[i][1] * d); tg.stroke(); }
}
function fadeTrail() { trail.style.transition = 'opacity .4s'; trail.style.opacity = 0; setTimeout(() => { tg.clearRect(0, 0, trail.width, trail.height); trail.style.transition = ''; trail.style.opacity = 1; }, 420); }
function showAim(x, y) { const a = $('aim'); a.style.left = x + 'px'; a.style.top = y + 'px'; a.classList.remove('is-on'); void a.offsetWidth; a.classList.add('is-on'); }

/* ---------- Simulation ---------- */
let simTime=0,replay=null,replayHistory=[],cameraCut=false;
function snapshotRig(r){return {p:r.root.position.clone(),q:r.root.quaternion.clone(),b:Object.values(r.bones).map(b=>[b.position.clone(),b.quaternion.clone()])};}
function snapshot(){return {t:simTime,ball:ball.position.clone(),q:ball.quaternion.clone(),s:snapshotRig(shooter),k:snapshotRig(keeper)};}
function restoreRig(r,a,b,t){r.root.position.lerpVectors(a.p,b.p,t);r.root.quaternion.slerpQuaternions(a.q,b.q,t);Object.values(r.bones).forEach((bone,i)=>{bone.position.lerpVectors(a.b[i][0],b.b[i][0],t);bone.quaternion.slerpQuaternions(a.b[i][1],b.b[i][1],t);});}
function updateReplay(raw){
 replay.elapsed+=raw*.40;const frames=replay.frames,target=frames[0].t+replay.elapsed;
 let i=0;while(i<frames.length-2&&frames[i+1].t<target)i++;
 const stage=target<ballState.launchTime+.10?'strike':'save';if(stage!==replay.stage){replay.stage=stage;cameraCut=true;}
 const a=frames[i],b=frames[i+1],t=T.MathUtils.clamp((target-a.t)/Math.max(.001,b.t-a.t),0,1);
 ball.position.lerpVectors(a.ball,b.ball,t);ball.quaternion.slerpQuaternions(a.q,b.q,t);restoreRig(shooter,a.s,b.s,t);restoreRig(keeper,a.k,b.k,t);
 if(target>=frames.at(-1).t)endReplay();
}
function endReplay(){
 const live=replay?.live;
 if(live){restoreRig(shooter,live.s,live.s,0);restoreRig(keeper,live.k,live.k,0);ball.position.copy(live.ball);ball.quaternion.copy(live.q);}
 replay=null;cameraCut=true;$('replay-skip').hidden=true;phase='celebration';
 const goal=ballState?.result==='goal';
 shooter.play(goal?'celebrate':'disappointed',1,.25,true);
 // Keep the dive capture playing through landing and getting back up. It
 // cannot be replaced by a standing celebration while the keeper is prone.
 after=setTimeout(nextKick,1900);
}
$('replay-skip').onclick=endReplay;

function updateBall(dt) {
  const s = ballState; if (!s || s.done) return;
  s.time += dt; const p = ball.position, previous=p.clone(), prevZ = p.z;
  advance(p,s.v,s.spin,dt);const groundSpeed=s.v.y;const grounded=groundContact(p,s.v,s.spin,dt);if(grounded&&groundSpeed< -1.8&&sound.recordedKick)sound.sample(sound.recordedKick,Math.min(.25,-groundSpeed*.025));
  const rotation=s.spin.length()*dt;if(rotation>1e-7)ball.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(s.spin.clone().normalize(),rotation));
  // Physical glove/body contact, with a parry reflected from the actual surface.
  if(!s.result&&!s.touched&&p.z<1.8&&p.z>-.4){
    const contact=keeperContact(previous,p);
    if(contact){
      s.touched=true;if(sound.recordedKick)sound.sample(sound.recordedKick,.2);const normal=contact.ball.clone().sub(contact.point).normalize();
      if(normal.lengthSq()<.5)normal.set(0,0,1);
      p.copy(contact.ball).addScaledVector(normal,.012);reflectContact(s.v,normal,.35);s.spin.multiplyScalar(.6);
    }
  }
  // Swept sphere against the round posts and bar, including side/inside
  // impacts. A post rebound can still become a goal before the ball is dead.
  if(!s.result&&!s.postCooldown){
    const frameParts=[new T.Line3(new T.Vector3(-HALF_W-POST,0,0),new T.Vector3(-HALF_W-POST,GOAL_H+POST,0)),new T.Line3(new T.Vector3(HALF_W+POST,0,0),new T.Vector3(HALF_W+POST,GOAL_H+POST,0)),new T.Line3(new T.Vector3(-HALF_W-POST,GOAL_H+POST,0),new T.Vector3(HALF_W+POST,GOAL_H+POST,0))];
    let earliest=null;
    for(const frame of frameParts){const hit=sweepSphereSegment(previous,p,frame.start,frame.end,R+POST);if(hit&&(!earliest||hit.time<earliest.time))earliest=hit;}
    if(earliest){p.copy(earliest.center).addScaledVector(earliest.normal,.002);reflectContact(s.v,earliest.normal,.76);p.addScaledVector(s.v,dt*(1-earliest.time));s.hitPost=true;s.postCooldown=.025;sound.post();}
  }
  s.postCooldown=Math.max(0,(s.postCooldown||0)-dt);
  if (!s.crossed && p.z <= -R) {
    s.crossed = true;
    if (!s.result) {
      const inside = Math.abs(p.x) < HALF_W - R && p.y < GOAL_H - R;
      s.result = inside ? 'goal' : s.touched?'saved':s.hitPost?'post':'miss'; finishKick(s.result);
    }
  }
  // Net
  if (s.result === 'goal') {
    if (p.z < -NET_D + R) { nets[0].hit(p.clone(), new T.Vector3(0, 0, -1).multiplyScalar(Math.min(1.4, Math.abs(s.v.z) * .1))); p.z = -NET_D + R; s.v.z = Math.abs(s.v.z) * .15; s.v.x *= .4; sound.net(); }
    const ceiling=GOAL_H+p.z*(.24/NET_D)-R;if(p.y>ceiling&&p.z<0&&s.v.y>0){nets[1].hit(p.clone().add(new T.Vector3(0,R,0)),new T.Vector3(0,.6,0));p.y=ceiling;reflectContact(s.v,new T.Vector3(0,-1,.24/NET_D).normalize(),.25);}
    if (Math.abs(p.x) > HALF_W - R && p.z < 0) { nets[p.x < 0 ? 2 : 3].hit(p.clone(), new T.Vector3(Math.sign(p.x), 0, 0).multiplyScalar(.8)); p.x = Math.sign(p.x) * (HALF_W - R); s.v.x *= -.2; }
  }
  // Resolve a parry only after it has actually left the goalmouth. A touch
  // or post collision alone does not end the penalty or prevent an own goal.
  if(!s.result&&((s.touched||s.hitPost)&&p.z>2.2&&s.v.z>0||s.time>5)){
    s.result=s.touched?'saved':s.hitPost?'post':'miss';finishKick(s.result);
  }
  timeScale=1;
  if(s.result){s.rest+=dt;if(s.rest>2.6)s.done=true;}

}

function keeperHand() {
  if(!keeper)return new T.Vector3(0,1,.35);
  return keeper.hand(keeperState?.hand||(keeperState?.to?.x<0?'Right':'Left'));
}
function updateKeeper(dt,now) {
  const k=keeperState,kp=keeper;if(!k||!kp)return;
  if(k.pending&&simTime>=k.pending.at){const pd=k.pending;k.pending=null;dive(pd.aim,pd.reach);}
  kp.update(dt);
  if(k.diving&&kp.current){
    const marker=k.clip==='jump'?.76:k.clip?.endsWith('high')?.88:1.22;
    if(kp.current.time>=marker)kp.current.setEffectiveTimeScale(1);
  }
  if(k.diving&&kp.current.time>=kp.current.getClip().duration-.001){
    k.diving=false;
    kp.play(phase==='celebration'&&ballState?.result==='saved'?'celebrate':'ready',1,.3,true);
    if(kp.rootTransition)kp.rootTransition.to.y=0;
  }
  if(!k.diving){
    if(phase==='celebration'&&ballState?.result==='saved')return;
    return; // The ready capture supplies its own weight shift; do not slide the root.
  }
  const elapsed=Math.max(0,simTime-k.start),nativeHipX=kp.bone('Hips').x-kp.root.position.x;
  const reachProgress=Math.abs(k.sampleHipX)>.1?T.MathUtils.clamp(nativeHipX/k.sampleHipX,0,1.3):T.MathUtils.smoothstep(elapsed/k.dur,0,1);
  const airborne=Math.max(0,elapsed-k.takeoff);
  kp.root.position.copy(k.origin);kp.root.position.x+=k.shiftX*reachProgress;
  kp.root.position.y=k.jump>.025?Math.max(0,k.verticalSpeed*airborne-.5*G*airborne*airborne):0;
  kp.root.updateMatrixWorld(true);
  // Ground support is derived from the body, including the landing hip and
  // shoulder. Only the small penetration correction is applied to the capture.
  const supports=[['Hips',.13],['Head',.11],['Spine2',.13],['LeftLeg',.08],['RightLeg',.08],['LeftFoot',.045],['RightFoot',.045],['LeftHand',.035],['RightHand',.035]];
  let lowest=Infinity;for(const [bone,r]of supports)lowest=Math.min(lowest,kp.bone(bone).y-r);
  if(lowest<.006){kp.root.position.y+=.006-lowest;kp.root.updateMatrixWorld(true);}
  if(ballState&&!ballState.result&&ball.position.z<1.8&&ball.position.z>-.2){
    const side=k.hand||'Left',hand=kp.hand(side),distance=hand.distanceTo(ball.position);
    if(distance<.32){const normal=hand.clone().sub(ball.position).normalize(),offset=hand.clone().sub(kp.bone(side+'Hand'));
      const target=ball.position.clone().addScaledVector(normal,R+.045).sub(offset);reachBall(kp,side,target,1-distance/.32);
    }
  }
}

// The shot and the displayed keeper share these anatomical capsules. Four
// fixed physics substeps make the visible catch and collision use the same pose.
function keeperContact(previous,position){
 const capsules=[
  ['Spine','Spine2',.20],['Hips','Spine',.20],['Head','HeadTop_End',.115],
  ['LeftUpLeg','LeftLeg',.105],['RightUpLeg','RightLeg',.105],['LeftLeg','LeftFoot',.08],['RightLeg','RightFoot',.08],
  ['LeftArm','LeftForeArm',.07],['RightArm','RightForeArm',.07],['LeftForeArm','LeftHand',.065],['RightForeArm','RightHand',.065]
 ];
 let earliest=null;
 const test=(a,b,r)=>{const hit=sweepSphereSegment(previous,position,a,b,R+r);if(hit&&(!earliest||hit.time<earliest.time))earliest=hit;};
 for(const side of ['Left','Right']){const hand=keeper.hand(side);test(hand,hand,.095);}
 for(const [a,b,r]of capsules)test(keeper.bone(a),keeper.bone(b),r);
 if(earliest)return {point:earliest.point,ball:earliest.center};
 return null;
}

function updateCamera(dt) {
  if (!camTarget) return;
  const k=cameraCut?1:1-Math.exp(-dt*3);cameraCut=false;
  let pos = camTarget.pos.clone(), look = camTarget.look.clone();
  if(phase==='replay'){
    if(replay.stage==='strike'){pos.set(-2.4,1.05,SPOT+1.4);look.set(0,.65,SPOT-.2);}
    else{pos.copy(replay.cameraPos);look.copy(replay.cameraLook);}
  }
  else if(phase==='celebration'){
    const r=ballState?.result==='goal'?shooter:keeper,focus=r.bones.Head.getWorldPosition(new T.Vector3());
    const goal=ballState?.result==='goal';
    // A keeper faces the pitch; a camera behind him puts the net and posts
    // across his recovery. Show both actors from their front instead.
    pos.copy(focus).add(goal?new T.Vector3(2,.15,-3.5):new T.Vector3(-2.7,.2,4.5));pos.y=Math.max(1.6,pos.y);
    look.copy(focus).add(new T.Vector3(0,-.3,0));
  }
  else if(ballState?.result==='saved'&&youShooting){look.copy(keeper.bone('Spine2'));pos.set(camTarget.pos.x,2.3,9.5);}
  else if (ballState && youShooting && !ballState.result) { pos.z = THREE_lerp(camTarget.pos.z, 9.5, Math.min(1, ballState.time * 1.2)); look.lerp(new T.Vector3(ball.position.x * .6, 1.1, ball.position.z), .3); }
  camera.position.lerp(pos, k);
  camTarget.cur = camTarget.cur ? camTarget.cur.lerp(look, k) : look; camera.lookAt(camTarget.cur);
}
function updateLens(now){
 const close=phase==='celebration'||phase==='replay';
 let focus=new T.Vector3(0,1,0);
 if(phase==='celebration')focus.copy((ballState?.result==='goal'?shooter:keeper).bone('Spine2'));
 else if(phase==='replay')focus.copy(replay.stage==='strike'?shooter.bone('RightFoot'):keeper.bone('Spine2'));
 else if(phase==='menu')focus.copy(shooter?.bone('Spine2')||focus);
 else focus.set(0,.7,SPOT-3);
 lens.update(camera.position.distanceTo(focus),close||phase==='menu');grade.uniforms.time.value=now;
}
const THREE_lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Results & flow ---------- */
function finishKick(result) {
  const youScored = youShooting && result === 'goal', youSaved = !youShooting && result !== 'goal';
  const good = youScored || youSaved;
  const text = { goal: 'GOAL!', saved: youShooting ? 'Saved!' : 'Great save!', post: 'Off the post!', miss: 'Missed!' }[result];
  if(result==='goal'||result==='saved')replay={pending:.65,elapsed:0,resultTime:simTime};
  if (result === 'goal') sound.cheer(); else if (good) sound.cheer(); else sound.groan();
  banner(youShooting ? text : (result === 'goal' ? 'They scored' : text), good);
  if (mode === 'practice') { streak = result === 'goal' ? streak + 1 : 0; if (streak > best) { best = streak; localStorage.setItem('penalty-best', best); } }
  else (youShooting ? score.you : score.cpu).push(result === 'goal');
  if(result==='miss'||result==='post')shooter.play('disappointed',1,.25,true);
  hud();
}

function nextKick() {
  if (mode === 'practice') return setupKick(true);
  const decided = shootoutWinner();
  if (decided) return endMatch(decided);
  setupKick(score.you.length === score.cpu.length);
}

function shootoutWinner() {
  const a = score.you, b = score.cpu, ga = a.filter(Boolean).length, gb = b.filter(Boolean).length;
  if (a.length <= 5 && b.length <= 5) {
    if (ga + (5 - a.length) < gb) return 'cpu';
    if (gb + (5 - b.length) < ga) return 'you';
    if (a.length === 5 && b.length === 5 && ga !== gb) return ga > gb ? 'you' : 'cpu';
    return null;
  }
  if (a.length === b.length && ga !== gb) return ga > gb ? 'you' : 'cpu';
  return null;
}

function endMatch(winner) {
  phase = 'over'; sound.whistle(); setTimeout(() => sound.whistle(), 450);
  const ga = score.you.filter(Boolean).length, gb = score.cpu.filter(Boolean).length;
  $('result-label').textContent = winner === 'you' ? 'Champions' : 'Full time';
  $('result-title').textContent = winner === 'you' ? 'You win the shootout!' : 'Beaten on penalties';
  $('result-reason').textContent = `Final score ${ga} – ${gb}${score.you.length > 5 ? ' after sudden death' : ''}.`;
  if (winner === 'you') confetti();
  setTimeout(() => { $('result').hidden = false; }, 900);
}

function confetti() {
  const n = 300, mesh = new T.InstancedMesh(new T.PlaneGeometry(.18, .28), new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false }), n), items = [], m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), one = new T.Vector3(1, 1, 1);
  const pal = [...KITS[settings.kit], '#dfff63', '#ffffff'];
  for (let i = 0; i < n; i++) { mesh.setColorAt(i, new T.Color(pal[i % pal.length])); items.push({ p: new T.Vector3((Math.random() - .5) * 16, 6 + Math.random() * 10, SPOT - 4 + (Math.random() - .5) * 10), r: Math.random() * 6, w: (Math.random() - .5) * 8, v: 1 + Math.random() * 2 }); }
  scene.add(mesh); effects.push({ life: 0, update: dt => { items.forEach((it, i) => { it.p.y = Math.max(.02, it.p.y - it.v * dt); it.r += it.w * dt; m.compose(it.p, q.setFromEuler(e.set(it.r, it.r * .7, 0)), one); mesh.setMatrixAt(i, m); }); mesh.instanceMatrix.needsUpdate = true; }, max: 7, dispose: () => scene.remove(mesh) });
}
let effects = [];

/* ---------- HUD ---------- */
let bannerTimer = 0;
function banner(text, good) { const b = $('banner'); b.textContent = text; b.className = 'banner is-on ' + (good ? 'is-good' : 'is-bad'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('is-on'), 1900); }
let toastTimer = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 2000); }
function dots(list, n) { return Array.from({ length: Math.max(n, list.length) }, (_, i) => `<i class="${list[i] === true ? 'is-goal' : list[i] === false ? 'is-miss' : ''}"></i>`).join(''); }
function hud() {
  document.body.classList.toggle('is-playing', !!mode);
  document.body.dataset.mode = mode || '';
  const ga = score.you.filter(Boolean).length, gb = score.cpu.filter(Boolean).length, n = Math.max(5, score.you.length, score.cpu.length);
  stadium.updateScore(ga,gb,Math.min(5,Math.min(score.you.length,score.cpu.length)+1));
  $('board').innerHTML = `<div class="sb-heading">${mode==='practice'?'Training':'Penalty series'}<span>${mode==='practice'?'Personal best':score.you.length>=5&&score.cpu.length>=5?'Sudden death':`Round ${Math.min(5,Math.min(score.you.length,score.cpu.length)+1)} / 5`}</span></div>` + (mode === 'practice'
    ? `<div class="sb-practice"><span>Streak</span><b>${streak}</b><span>Best ${best}</span></div>`
    : `<div class="sb-row"><span class="sb-team"><i style="background:${KITS[settings.kit][0]}"></i>You</span><span class="sb-dots">${dots(score.you, n)}</span><b>${ga}</b></div><div class="sb-row"><span class="sb-team"><i style="background:#f3f3f3"></i>CPU</span><span class="sb-dots">${dots(score.cpu, n)}</span><b>${gb}</b></div>`);
  $('hint').textContent = phase === 'aim' ? 'Swipe to shoot · curve for curl · swipe faster for power' : phase === 'cpu-runup' || phase === 'cpu-kick' ? 'You’re in goal — tap where to dive' : '';
}

/* ---------- Menus ---------- */
function syncSegments() {
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(settings[seg.dataset.setting] === b.dataset.value))));
  $('btn-sound').classList.toggle('is-off', !settings.sound);
}
document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (!b) return; settings[seg.dataset.setting] = b.dataset.value; save(); syncSegments();if(seg.dataset.setting==='kit'&&phase==='menu'&&keeper)setupMenuView(); }));
function start(m) {
  clearTimeout(after);
  if (!keeper) return;
  sound.ctx();sound.loadRecordings(); sound.ambience(); sound.setAmbience(true); sound.whistle();
  mode = m; score = { you: [], cpu: [] }; streak = 0; $('start').hidden = true; $('result').hidden = true; setupKick(true);
}
$('play-shootout').onclick = () => start('shootout');
$('play-practice').onclick = () => start('practice');
$('again').onclick = () => start(mode);
const toMenu = () => { clearTimeout(after);replay=null;$('replay-skip').hidden=true; mode = null; phase = 'menu'; $('result').hidden = true; $('start').hidden = false; sound.setAmbience(false); setupMenuView(); hud(); };
$('to-menu').onclick = toMenu;
$('btn-menu').onclick = () => { if (mode && phase !== 'over' && !confirm('Leave this match?')) return; toMenu(); };
$('btn-sound').onclick = () => { settings.sound = !settings.sound; save(); syncSegments();if(settings.sound)sound.loadRecordings(); sound.setAmbience(!!mode); };
$('btn-full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});

function setupMenuView() { setupKick(true); phase = 'menu'; camTarget = { pos: new T.Vector3(2.8,1.55,SPOT-2),look:shooter.bone('Spine2') }; }

/* ---------- Loop ---------- */
const clock = new T.Clock();
let after = 0,accumulator=0;
renderer.setAnimationLoop(() => {
  const raw = Math.min(clock.getDelta(), .1), now = performance.now() / 1000, dt = raw * timeScale;
  if(phase==='replay'){updateReplay(raw);updateCamera(raw);stadium.update(now,ballState?.result==='goal',raw);shooter.updateContactShadows();keeper.updateContactShadows();updateLens(now);renderer.shadowMap.needsUpdate=true;composer.render();return;}
  accumulator+=dt;while(accumulator>=1/120){const step=1/120;simTime+=step;updateKeeper(step,now);shooter?.update(step);
    if(shooter?.anim===KICK_CLIP&&shooter.current.time>=shooter.current.getClip().duration-.001)shooter.play('idle',1,.3,true);
    if(ballState)updateBall(step);accumulator-=step;}
  updateShotTrail();
  if(shooter&&keeper&&['runup','cpu-kick','flight'].includes(phase)){
    replayHistory.push(snapshot());while(replayHistory.length>250||replayHistory.length>2&&simTime-replayHistory[0].t>2.8)replayHistory.shift();
    if(replay?.pending!==undefined){replay.pending-=raw;if(replay.pending<=0&&replayHistory.length>2){replay.live=snapshot();
      const focus=keeperState.to||ball.position;
      replay.cameraPos=new T.Vector3(focus.x>0?-6:6,2,5.5);replay.cameraLook=new T.Vector3(T.MathUtils.clamp(focus.x*.65,-2,2),1,.3);
      replay.frames=replayHistory.filter(f=>f.t>=ballState.launchTime-.35&&f.t<=replay.resultTime+.32);if(replay.frames.length<2)replay.frames=replayHistory.slice();replay.elapsed=0;delete replay.pending;phase='replay';updateReplay(0);cameraCut=true;shotTrail.visible=false;$('replay-skip').hidden=false;}}
  }
  nets.forEach(n => n.update(raw));
  adTex.offset.x = (adTex.offset.x + raw * .04) % 1;
  effects = effects.filter(f => { f.life += raw; f.update(raw); if (f.life > f.max) { f.dispose(); return false; } return true; });
  if (phase === 'menu' && camTarget) { const a=now*.08,focus=shooter.bone('Spine2');camTarget.pos.copy(focus).add(new T.Vector3(2.8+Math.sin(a)*.5,.3,-3.6));camTarget.look.copy(focus).add(new T.Vector3(0,-.12,0)); }
  updateCamera(raw);
  if (ballState?.done && phase === 'flight') { phase = 'between'; after = setTimeout(nextKick, 300); }
  stadium.update(now,ballState?.result==='goal',raw);
  updateLens(now);renderer.shadowMap.needsUpdate=true;composer.render();
});

syncSegments(); hud();
bodiesReady.then(() => { setupMenuView(); $('loading').hidden=true; document.body.classList.add('is-loaded'); }).catch(error => { console.error(error); $('load-progress').textContent='Unable to load players'; $('load-retry').hidden=false; });
$('load-retry').onclick=()=>location.reload();
camera.position.set(8, 3, SPOT + 6);
setTimeout(() => document.body.classList.add('is-ready'), 50);
// Local QA only; unavailable on the public site.
if(['localhost','127.0.0.1'].includes(location.hostname))window.penaltyQA={get state(){return {phase,score,mode,sound:{enabled:settings.sound,masterGain:sound.master?.gain.value,recorded:!!sound.bed},queuedDive:!!tapAim,ball:ball.position.toArray(),clip:shooter?.anim,keeperClip:keeperState?.clip,result:ballState?.result,streak,replay:!!replay,replayStage:replay?.stage,glove:keeper?keeperHand().toArray():null,modelScale:shooter?.model.scale.toArray(),bounds:shooter?new T.Box3().setFromObject(shooter.model).getSize(new T.Vector3()).toArray():null,hips:shooter?.bones.Hips.getWorldPosition(new T.Vector3()).toArray(),foot:shooter?.bones.RightToeBase.getWorldPosition(new T.Vector3()).toArray()};},shoot:(x,y,aim=null)=>{phase='runup';hud();runUp(()=>{kick(new T.Vector3(x,y,0),.7,0,true);if(aim)keeperState.pending={at:simTime+.04,aim:new T.Vector3(...aim),reach:3.5};});},dive:(x,y)=>dive(new T.Vector3(x,y,0),3.3),start,next:nextKick,winner:shootoutWinner,setScore:(you,cpu)=>{score={you,cpu};return shootoutWinner();}, get simulation(){return {keeperState,ballState,simTime};},get view(){return camera;},get rigs(){return {shooter,keeper};}};
