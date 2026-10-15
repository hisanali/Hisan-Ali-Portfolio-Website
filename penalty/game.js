import * as T from '../evermile/vendor/three.module.js';
import { GLTFLoader } from '../evermile/vendor/loaders/GLTFLoader.js';
import { EffectComposer } from '../evermile/vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../evermile/vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../evermile/vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../evermile/vendor/postprocessing/OutputPass.js';
import { DRACOLoader } from '../evermile/vendor/loaders/DRACOLoader.js';
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
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.fog = new T.Fog('#0b1220', 45, 140);
const camera = new T.PerspectiveCamera(42, 1, .05, 400);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), .26, .45, 1.6);
composer.addPass(bloom); composer.addPass(new OutputPass());

const tex = (cv, srgb = true) => { const t = new T.CanvasTexture(cv); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
const canvas2d = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };

// Night sky
scene.background = tex(canvas2d(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#02040b'); gr.addColorStop(.55, '#0b1630'); gr.addColorStop(1, '#1c2a44'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
{ // reflections from floodlights
  const env = new T.Scene(); env.add(new T.Mesh(new T.BoxGeometry(60, 30, 60), new T.MeshBasicMaterial({ color: '#10182a', side: T.BackSide })));
  for (const [x, z] of [[-25, -25], [25, -25], [-25, 25], [25, 25]]) { const m = new T.Mesh(new T.PlaneGeometry(8, 4), new T.MeshBasicMaterial({ color: new T.Color('#fff6e6').multiplyScalar(6) })); m.position.set(x, 14, z); m.lookAt(0, 0, 0); env.add(m); }
  const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, .04).texture; pm.dispose();
}

scene.add(new T.HemisphereLight('#bcd2ff', '#1c3a17', .55));
const flood = new T.DirectionalLight('#fff4e2', 2.6); flood.position.set(-18, 30, 22); flood.castShadow = true;
Object.assign(flood.shadow.camera, { left: -14, right: 14, top: 14, bottom: -6, near: 5, far: 80 }); flood.shadow.mapSize.set(2048, 2048); flood.shadow.bias = -.0004; flood.shadow.normalBias = .03;
flood.target.position.set(0, 0, 4); scene.add(flood, flood.target);
const fill = new T.DirectionalLight('#cfe0ff', .7); fill.position.set(20, 22, 10); scene.add(fill);

/* ---------- Pitch ---------- */
const grassTex = tex(canvas2d(1024, 1024, (g, w, h) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#245f2c' : '#2c7133'; g.fillRect(0, i * h / 8, w, h / 8); }
  for (let i = 0; i < 90000; i++) { const s = Math.random(); g.fillStyle = s < .5 ? 'rgba(20,60,20,.18)' : 'rgba(150,210,120,.12)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3); }
}));
grassTex.wrapS = grassTex.wrapT = T.RepeatWrapping; grassTex.repeat.set(6, 6);
const grassNormal = tex(canvas2d(512, 512, (g, w, h) => {
  g.fillStyle = '#8080ff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 55000; i++) { g.fillStyle = `rgb(${100 + Math.random()*55},${100 + Math.random()*55},245)`; g.fillRect(Math.random()*w, Math.random()*h, 1, 3); }
}), false);
grassNormal.wrapS = grassNormal.wrapT = T.RepeatWrapping; grassNormal.repeat.set(90,90);
const pitch = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshStandardMaterial({ map: grassTex, normalMap: grassNormal, normalScale: new T.Vector2(.22,.22), roughness: .98 }));
pitch.rotation.x = -Math.PI / 2; pitch.position.z = 20; pitch.receiveShadow = true; scene.add(pitch);
const wear = new T.Mesh(new T.PlaneGeometry(2.8, 3.5), new T.MeshStandardMaterial({
  map: tex(canvas2d(256,256,(g,w,h) => {
    for(let i=0;i<7000;i++) { const x=Math.random()*w,y=Math.random()*h, d=Math.hypot((x-w/2)/(w/2),(y-h/2)/(h/2));
      g.fillStyle=`rgba(112,91,48,${Math.max(0,1-d)*Math.random()*.45})`;g.fillRect(x,y,2,5); }
  })), transparent:true, depthWrite:false, roughness:1
}));
wear.rotation.x=-Math.PI/2;wear.position.set(0,.004,SPOT);scene.add(wear);

{ // markings: penalty area, goal area, spot, arc, goal line
  const PX = 40, W = 46, D = 24, cv = canvas2d(W * PX, D * PX, (g) => {
    g.strokeStyle = 'rgba(255,255,255,.92)'; g.fillStyle = 'rgba(255,255,255,.92)'; g.lineWidth = .12 * PX;
    const X = x => (x + W / 2) * PX, Z = z => (z + 1) * PX;
    g.beginPath(); g.moveTo(0, Z(0)); g.lineTo(W * PX, Z(0)); g.stroke();
    g.strokeRect(X(-20.16), Z(0), 40.32 * PX, 16.5 * PX); g.strokeRect(X(-9.16), Z(0), 18.32 * PX, 5.5 * PX);
    g.beginPath(); g.arc(X(0), Z(SPOT), .15 * PX, 0, Math.PI * 2); g.fill();
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

class NetPanel {
  constructor(corner, u, v, nu, nv) {
    this.base = []; const idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) this.base.push(new T.Vector3().copy(corner).addScaledVector(u, i / nu).addScaledVector(v, j / nv));
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; if (i < nu) idx.push(k, k + 1); if (j < nv) idx.push(k, k + nu + 1); }
    this.geo = new T.BufferGeometry().setFromPoints(this.base); this.geo.setIndex(idx);
    this.mesh = new T.LineSegments(this.geo, new T.LineBasicMaterial({ color: '#e9eef5', transparent: true, opacity: .55 })); scene.add(this.mesh);
    this.offset = this.base.map(() => new T.Vector3()); this.vel = this.base.map(() => new T.Vector3());
  }
  hit(point, push) { this.base.forEach((b, k) => { const d = b.distanceToSquared(point); this.vel[k].addScaledVector(push, Math.exp(-d / .6) * 9); }); }
  update(dt) {
    const pos = this.geo.attributes.position; let moving = false;
    this.base.forEach((b, k) => { const o = this.offset[k], v = this.vel[k]; v.addScaledVector(o, -60 * dt).multiplyScalar(Math.exp(-6 * dt)); o.addScaledVector(v, dt); if (o.lengthSq() > 1e-6) moving = true; pos.setXYZ(k, b.x + o.x, b.y + o.y, b.z + o.z); });
    if (moving) pos.needsUpdate = true;
  }
}
const nets = [
  new NetPanel(new T.Vector3(-HALF_W, 0, -NET_D), new T.Vector3(GOAL_W, 0, 0), new T.Vector3(0, 2.2, 0), 44, 14),
  new NetPanel(new T.Vector3(-HALF_W, GOAL_H, 0), new T.Vector3(GOAL_W, 0, 0), new T.Vector3(0, -.24, -NET_D), 44, 12),
  new NetPanel(new T.Vector3(-HALF_W, 0, 0), new T.Vector3(0, 0, -NET_D), new T.Vector3(0, GOAL_H, 0), 12, 15),
  new NetPanel(new T.Vector3(HALF_W, 0, 0), new T.Vector3(0, 0, -NET_D), new T.Vector3(0, GOAL_H, 0), 12, 15)
];

/* ---------- Stadium ---------- */
// Instanced spectators: separate skin, hair, shirts and arms; one GPU jump wave.
const crowdUniforms = { time: {value:0}, cheer: {value:0} };
const fanMat = new T.MeshStandardMaterial({roughness:.95});
fanMat.onBeforeCompile = shader => {
  Object.assign(shader.uniforms,crowdUniforms);
  shader.vertexShader = 'uniform float time; uniform float cheer;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
    #ifdef USE_INSTANCING
    float seed = instanceMatrix[3].x * 4.1 + instanceMatrix[3].z * 2.7;
    transformed.y += .025*sin(time*2.0+seed) + cheer * abs(sin(time*6.0+seed))*.48;
    #endif
    #include <project_vertex>`);
};
const fanParts = [new T.BoxGeometry(.43,.56,.24),new T.SphereGeometry(.13,6,5),new T.BoxGeometry(.12,.46,.12),new T.BoxGeometry(.12,.46,.12)];
const fans = Array.from({length:4},(_,i)=>new T.InstancedMesh(fanParts[i],fanMat,3600));
const dummy=new T.Object3D(), fanColors=['#a32237','#e4e7e4','#1c426b','#c2a745','#143f32','#252b39'];
let fi=0;
for(let side=0;side<4;side++) for(let row=0;row<12;row++) for(let col=0;col<75;col++) {
  const along=(col-37)*.85, dist=15+row*.85, y=.7+row*.65;
  const x=side<2?along:(side===2?-dist-13:dist+13), z=side<2?(side===0?-dist:dist+42):along+20;
  const rot=side===0?0:side===1?Math.PI:side===2?Math.PI/2:-Math.PI/2;
  fans.forEach((mesh,j)=>{dummy.position.set(x+(j===2?-.27:j===3?.27:0),y+(j===1?.43:0),z);dummy.rotation.set(0,rot,j>1?(j===2?-.25:.25):0);dummy.updateMatrix();mesh.setMatrixAt(fi,dummy.matrix);mesh.setColorAt(fi,new T.Color(j===1?['#bd8d69','#85583d','#d8ae8a'][fi%3]:fanColors[fi%fanColors.length]));});fi++;
}
fans.forEach(m=>{m.frustumCulled=false;scene.add(m);});
// Concrete seating tiers and cantilevered roof with steel triangulated trusses.
const concrete=new T.MeshStandardMaterial({color:'#293442',roughness:.88});
const steel=new T.MeshStandardMaterial({color:'#6e7e8b',metalness:.65,roughness:.45});
function beam(a,b,r=.07) { const d=new T.Vector3().subVectors(b,a),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),6),steel);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());scene.add(m); }
for(const side of [-1,1]) {
 for(let row=0;row<12;row++){const t=new T.Mesh(new T.BoxGeometry(85,.5,1),concrete);t.position.set(0,.25+row*.65,side<0?-15-row*.85:57+row*.85);scene.add(t);}
 const roof=new T.Mesh(new T.BoxGeometry(91,.22,16),concrete);roof.position.set(0,13,side<0?-23:65);scene.add(roof);
 for(let x=-44;x<=44;x+=8){const z=side<0?-30:72,front=z-side*15;
  beam(new T.Vector3(x,0,z),new T.Vector3(x,15,z),.16);
  beam(new T.Vector3(x,15,z),new T.Vector3(x,12.7,front));
  beam(new T.Vector3(x,12.7,z),new T.Vector3(x,12.7,front));
  for(let k=0;k<5;k++)beam(new T.Vector3(x,15-k*.46,z-side*k*3),new T.Vector3(x,12.7,z-side*(k+1)*3));
 }
}
// Roof-mounted floodlight banks illuminate the pitch beneath the canopy.
for(const z of [-15,57])for(let x=-36;x<=36;x+=9){
 const bank=new T.Mesh(new T.BoxGeometry(4,.55,.22),new T.MeshBasicMaterial({color:new T.Color('#dcecff').multiplyScalar(4),toneMapped:false}));
 bank.position.set(x,12.5,z);bank.rotation.x=z<0?.25:-.25;scene.add(bank);
}
{ // roof edge & floodlight towers
  for (const [x, z] of [[-30, -20], [30, -20], [-34, 34], [34, 34]]) {
    const pole = new T.Mesh(new T.CylinderGeometry(.35, .5, 30, 8), new T.MeshStandardMaterial({ color: '#3a4256', roughness: .6 })); pole.position.set(x, 15, z); scene.add(pole);
    const lamp = new T.Mesh(new T.BoxGeometry(6, 3, .5), new T.MeshBasicMaterial({ color: new T.Color('#fffbea').multiplyScalar(5), toneMapped:false })); lamp.position.set(x, 30, z); lamp.lookAt(0, 0, 6); scene.add(lamp);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: tex(canvas2d(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,230,1)'); gr.addColorStop(.25, 'rgba(255,240,200,.45)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); })), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    glow.scale.set(22, 22, 1); glow.position.copy(lamp.position); scene.add(glow);
  }
}
// LED advertising boards
const adCanvas = canvas2d(2048, 64, (g, w, h) => {
  g.fillStyle = '#05070d'; g.fillRect(0, 0, w, h);
  const items = [['HISAN ALI', '#dfff63'], ['DIGITAL MARKETING · MUSCAT', '#ffffff'], ['PLAY MORE AT HISANALI.COM', '#ff6a55'], ['SEO · ADS · ANALYTICS', '#66a6ff']];
  g.font = '800 38px Manrope, Arial, sans-serif'; g.textBaseline = 'middle'; let x = 20;
  while (x < w) for (const [t, c] of items) { g.fillStyle = c; g.fillText(t, x, h / 2 + 2); x += g.measureText(t).width + 70; }
});
const adTex = tex(adCanvas); adTex.wrapS = T.RepeatWrapping; adTex.repeat.set(2, 1);
const boards = new T.Mesh(new T.BoxGeometry(60, .9, .15), [0, 0, 0, 0, 1, 0].map(f => f ? new T.MeshBasicMaterial({ map: adTex, toneMapped: false }) : new T.MeshStandardMaterial({ color: '#0b0e16' })));
boards.position.set(0, .45, -5.5); scene.add(boards);

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
const shotTrail=new T.Line(new T.BufferGeometry().setFromPoints(Array.from({length:14},()=>new T.Vector3())),new T.LineBasicMaterial({color:'#e8f1ff',transparent:true,opacity:.24,depthWrite:false,blending:T.AdditiveBlending}));scene.add(shotTrail);
let shotPositions=[];
function updateShotTrail(){
 const fast=ballState&&!ballState.result&&ballState.v.length()>12;
 shotTrail.visible=!!fast;if(!fast){shotPositions=[];return;}
 shotPositions.unshift(ball.position.clone());shotPositions.length=Math.min(shotPositions.length,14);
 const attr=shotTrail.geometry.attributes.position;for(let i=0;i<14;i++)attr.setXYZ(i,...(shotPositions[Math.min(i,shotPositions.length-1)]||ball.position).toArray());attr.needsUpdate=true;shotTrail.geometry.computeBoundingSphere();
}

/* ---------- People ---------- */
// One cached, Draco-compressed Mixamo footballer, cloned with independent skeletons.
const draco = new DRACOLoader().setDecoderPath('../evermile/vendor/draco/');
const loader = new GLTFLoader().setDRACOLoader(draco);
let footballer;
const bodiesReady = loader.loadAsync('./assets/footballer.glb?v=3', e => {
  if(e.total) $('load-progress').textContent = `${Math.round(e.loaded/e.total*100)}%`;
}).then(g => { footballer=g; draco.dispose(); });
const CONTACT = .76; // Toe reaches the ball at this timestamp in the converted 30fps capture.
const fabric=tex(canvas2d(128,128,(g,w,h)=>{g.fillStyle='#fafafa';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2){g.fillStyle=y%4?'#dedede':'#eeeeee';g.fillRect(0,y,w,1);}}));
fabric.wrapS=fabric.wrapT=T.RepeatWrapping;fabric.repeat.set(10,10);
class Rig {
  constructor(kind, shirt, shorts, gloves) {
    this.ownedGeometries=new Set();this.ownedTextures=new Set();
    const model = cloneSkinned(footballer.scene); this.root=new T.Group();this.root.add(model);this.kind=kind;
    model.updateMatrixWorld(true); model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
    const k=1; // Source is authored in metres; preserve skeleton and mesh scale together.
    model.scale.setScalar(k);model.position.y=0;this.k=k;this.model=model;
    model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.frustumCulled=false;
      const name=o.name.toLowerCase();o.material=o.material.clone();
      if(name.includes('shirt')){o.material.color.set(shirt);o.material.map=fabric;o.material.roughness=.86;}
      if(name.includes('shorts'))o.material.color.set(shorts);
      if(name.includes('socks')){o.material.color.set(shirt);o.material.map=fabric;}
      if(name.includes('shoes')){o.material.color.set('#171b22');o.material.roughness=.28;}
    });
    this.bones={};model.traverse(o=>{if(o.isBone)this.bones[o.name]=o;});
    this.mixer=new T.AnimationMixer(model);this.clips={};
    for(const original of footballer.animations){
      const clip=original.clone();
      // Locomotion is in-place; keep the captured root motion for strikes and dives.
      if(['idle','run','ready','celebrate','disappointed'].includes(clip.name)){
        for(const track of clip.tracks)if(track.name==='Hips.position'){
          for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+1]=track.values[1];}
        }
      }
      const action=this.mixer.clipAction(clip);this.clips[clip.name]=action;
      if(['dive','dive2'].includes(clip.name))for(const height of ['low','high']){
        const variant=clip.clone();variant.name=`dive-${clip.name==='dive'?'right':'left'}-${height}`;
        const diveAction=this.mixer.clipAction(variant);diveAction.setLoop(T.LoopOnce,1);diveAction.clampWhenFinished=true;this.clips[variant.name]=diveAction;
      }
      if(!['idle','run','ready'].includes(clip.name)){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}
    }
    // Gloves follow the captured hand and finger motion, including the thumb.
    if(gloves)for(const side of ['Left','Right']){
      const mat=new T.MeshStandardMaterial({color:gloves,roughness:.62});
      const palm=new T.Mesh(new T.BoxGeometry(.095/k,.12/k,.045/k),mat);this.ownedGeometries.add(palm.geometry);palm.position.y=.045/k;this.bones[side+'Hand'].add(palm);
      for(const finger of ['Thumb','Index','Middle','Ring','Pinky'])for(let j=1;j<=3;j++){
        const bone=this.bones[side+'Hand'+finger+j];if(!bone)continue;
        const f=new T.Mesh(new T.CapsuleGeometry(.012/k,.023/k,3,5),mat);this.ownedGeometries.add(f.geometry);f.position.y=.014/k;bone.add(f);
      }
    }
    // Skinned number decal copied from shirt weights, projected across its back.
    const shirtMesh=model.getObjectByName('Ch38_Shirt');
    if(shirtMesh){
      const geo=shirtMesh.geometry.clone(),pos=geo.attributes.position;
      const uv=new Float32Array(pos.count*2),bb=new T.Box3().setFromBufferAttribute(pos);
      for(let i=0;i<pos.count;i++){uv[i*2]=1-(pos.getX(i)-bb.min.x)/(bb.max.x-bb.min.x);uv[i*2+1]=(pos.getY(i)-bb.min.y)/(bb.max.y-bb.min.y);}
      for(let i=0;i<pos.count;i++)if(geo.attributes.normal.getZ(i)>0){uv[i*2]=-1;uv[i*2+1]=-1;}
      geo.setAttribute('uv',new T.BufferAttribute(uv,2));
      const number=tex(canvas2d(512,512,(g,w,h)=>{g.fillStyle='#fff';g.textAlign='center';g.font='bold 105px Arial';g.fillText(kind==='keeper'?'1':'10',w/2,h*.46);g.font='bold 20px Arial';g.fillText('HISAN FC',w/2,h*.23);}));
      this.ownedGeometries.add(geo);this.ownedTextures.add(number);
      const decal=new T.SkinnedMesh(geo,new T.MeshStandardMaterial({map:number,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,roughness:.85,side:T.FrontSide}));
      decal.bind(shirtMesh.skeleton,shirtMesh.bindMatrix);decal.frustumCulled=false;shirtMesh.parent.add(decal);
    }
    this.current=null;this.event=null;scene.add(this.root);
  }
  play(name, speed=1, fade=.16) {
    const action=this.clips[name];if(!action)return;
    if(this.current===action&&action.isRunning())return;
    const previous=this.current;action.enabled=true;action.reset().setEffectiveTimeScale(speed).setEffectiveWeight(1).play();
    if(previous&&previous!==action)previous.crossFadeTo(action,fade,false);
    this.current=action;this.anim=name;this.event=null;
  }
  update(dt){this.mixer.update(dt);if(this.event&&this.current.time>=this.event.at){const fn=this.event.fn;this.event=null;fn();}}
  hand(side){this.root.updateMatrixWorld(true);return this.bones[side+'Hand'].getWorldPosition(new T.Vector3());}
  dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);scene.remove(this.root);this.model.traverse(o=>{if(o.isMesh)o.material.dispose();});this.ownedGeometries.forEach(g=>g.dispose());this.ownedTextures.forEach(t=>t.dispose());}
}
let keeper, shooter;
function dressTeams(youShoot) {
  keeper?.dispose(); shooter?.dispose();
  const [you, youShorts] = KITS[settings.kit] || KITS.red, cpu = settings.kit === 'white' ? ['#1d1d1d', '#1d1d1d'] : ['#f3f3f3', '#1d1d1d'];
  keeper = new Rig('keeper', youShoot ? '#f2c230' : '#22c46e', '#1b1b1b', '#f4f4f4');
  shooter = new Rig('shooter', youShoot ? you : cpu[0], youShoot ? youShorts : cpu[1]);
  shooter.play('idle'); keeper.play('ready');
}

/* ---------- Sound ---------- */
const sound = {
  ctx() { if (!this.c) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.c = new A(); this.crowdGain = null; } if (this.c.state === 'suspended') this.c.resume(); return this.c; },
  noise(len, vol, type, freq, q = 1) { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const b = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(), t = c.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.3, len * .25)); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(f).connect(g).connect(c.destination); s.start(); },
  kick() { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g).connect(c.destination); o.start(); o.stop(t + .2); this.noise(.06, .4, 'bandpass', 900, 1.5); },
  whistle() { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.frequency.value = 2900; lfo.frequency.value = 38; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .02); g.gain.setValueAtTime(.12, t + .32); g.gain.linearRampToValueAtTime(0, t + .4); o.connect(g).connect(c.destination); o.start(); lfo.start(); o.stop(t + .45); lfo.stop(t + .45); },
  cheer() { this.noise(3.2, .5, 'bandpass', 1100, .5); this.noise(2.5, .25, 'lowpass', 500); },
  groan() { this.noise(1.8, .3, 'lowpass', 380); },
  net() { this.noise(.35, .35, 'highpass', 2500); },
  post() { if (!settings.sound) return; const c = this.ctx(); if (!c) return; const t = c.currentTime; [420, 1130, 2210].forEach(f => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .9); o.connect(g).connect(c.destination); o.start(); o.stop(t + 1); }); },
  ambience() { if (!settings.sound || this.amb) return; const c = this.ctx(); if (!c) return; const b = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = .4; const g = c.createGain(); g.gain.value = .045; s.connect(f).connect(g).connect(c.destination); s.start(); this.amb = g; },
  setAmbience(on) { if (this.amb) this.amb.gain.value = on && settings.sound ? .045 : 0; }
};

/* ---------- Game state ---------- */
let mode = null, phase = 'menu', score = { you: [], cpu: [] }, round = 0, youShooting = true, streak = 0, best = Number(localStorage.getItem('penalty-best') || 0);
let ballState = null, keeperState = null, timeScale = 1, camTarget = null, swipe = null, tapAim = null;
const level = () => LEVELS[settings.level] || LEVELS.normal;

function setupKick(youShoot) {
  animationToken++; replay=null;replayHistory=[];$('replay-skip').hidden=true; youShooting = youShoot; dressTeams(youShoot);
  ball.position.set(0, R, SPOT); ball.rotation.set(0, 0, 0);
  keeperState = { x: 0, y: 0, start: 0, from: new T.Vector3(0, 1, 0), to: null, dur: .6, diving: false, t: 0 };
  keeper.root.position.set(0, 0, .35); keeper.root.rotation.set(0, 0, 0);
  shooter.root.position.set(youShoot ? -.95 : -1.4, 0, SPOT + 3.2); shooter.root.rotation.set(0, Math.PI + (youShoot ? .35 : .45), 0);
  shooter.root.visible = true;
  ballState = null; timeScale = 1; tapAim = null;
  camTarget = youShoot ? { pos: new T.Vector3(innerWidth<600?-.55:.5, 2.5, SPOT + 8.5), look: new T.Vector3(0, .9, 0) } : { pos: new T.Vector3(1.1, 2.0, -4.3), look: new T.Vector3(-.2, .85, SPOT) };
  if (mode) { camera.position.copy(camTarget.pos); camTarget.cur = camTarget.look.clone(); camera.lookAt(camTarget.cur); }
  phase = youShoot ? 'aim' : 'cpu-runup';
  if (!youShoot) setTimeout(() => cpuShoot(), 1600);
  hud();
}

/* ---------- Shooting ---------- */
function kick(target, flight, curl, byYou) {
  // Solve the launch so the ball reaches `target` (on the goal plane) after `flight` seconds with sideways curl acceleration.
  const p0 = ball.position.clone(), t = flight, dz = target.z - p0.z;
  const v = new T.Vector3((target.x - p0.x - .5 * curl * t * t) / t, (target.y - p0.y + .5 * G * t * t) / t, dz / t);
  ballState = { v, curl, spin: new T.Vector3(-v.z * 3, curl * 2, 0), time: 0, crossed: false, result: null, byYou, done: false, rest: 0 };
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
  if (!keeperState || keeperState.diving) return;
  const dx = Math.max(-reach, Math.min(reach, aim.x)), dy = Math.max(.25, Math.min(2.4, aim.y));
  keeperState.diving = true; keeperState.start = simTime; keeperState.to = new T.Vector3(dx, dy, 0);
  keeperState.dur = .32 + Math.abs(dx) * .08;
  const central=Math.abs(dx)<.65;
  const clip=central?'jump':`dive-${dx<0?'left':'right'}-${dy>1.25?'high':'low'}`;
  keeperState.clip=clip;
  keeperState.handStart=keeper.hand(dx<0?'Right':'Left');
  // The capture reaches extension at ~0.9s. Retiming matches arrival at the ball.
  keeper.play(clip,(central?.76:dy>1.25?.82:1.15)/keeperState.dur,.06);
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
let animationToken=0;
function runUp(then) {
  const token=++animationToken;
  shooter.root.rotation.set(0,Math.PI,0);
  shooter.mixer.stopAllAction();shooter.current=null;
  shooter.play('kick',1,0);shooter.mixer.update(CONTACT);shooter.root.position.set(0,0,0);shooter.root.updateMatrixWorld(true);
  const boot=shooter.bones.RightToeBase.getWorldPosition(new T.Vector3());
  const strikeOrigin=new T.Vector3(-boot.x,0,SPOT-boot.z);
  shooter.mixer.stopAllAction();shooter.current=null;shooter.play('run',1.25,0);
  const start=strikeOrigin.clone().add(new T.Vector3(-.18,0,.75));
  shooter.root.position.copy(start);
  const t0=performance.now();
  const step=()=>{
    if(token!==animationToken||!mode)return;
    const t=Math.min(1,(performance.now()-t0)/450);shooter.root.position.lerpVectors(start,strikeOrigin,t);
    if(t<1)requestAnimationFrame(step);else strike(then);
  };step();
}
function strike(then) {
  shooter.play('kick',1,.08);
  shooter.event={at:CONTACT,fn:()=>{then?.();}};
}

/* ---------- Swipe input ---------- */
const trail = $('trail'), tg = trail.getContext('2d');
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w,h); camera.aspect = w / h;
  camera.fov = w / h < .8 ? 58 : 42; camera.updateProjectionMatrix();
  trail.width = w * devicePixelRatio; trail.height = h * devicePixelRatio; trail.style.width = w + 'px'; trail.style.height = h + 'px';
}
addEventListener('resize', resize); resize();

canvas.addEventListener('pointerdown', e => {
  sound.ctx();
  if (phase === 'aim') { swipe = { pts: [[e.clientX, e.clientY, performance.now()]] }; canvas.setPointerCapture(e.pointerId); }
  else if (phase === 'cpu-runup' || phase === 'cpu-kick' || (phase === 'flight' && !youShooting && !keeperState.diving)) {
    const rc = new T.Raycaster(), p = new T.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); rc.setFromCamera(p, camera);
    const hit = new T.Vector3(); if (!rc.ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), 0), hit)) return;
    tapAim = hit; showAim(e.clientX, e.clientY);
    if (phase === 'flight') dive(hit, 3.3);
  }
});
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
let simTime = 0, replay=null, replayHistory=[];
function snapshotRig(r){return {p:r.root.position.clone(),q:r.root.quaternion.clone(),b:Object.values(r.bones).map(b=>[b.position.clone(),b.quaternion.clone()])};}
function snapshot(){return {t:simTime,ball:ball.position.clone(),q:ball.quaternion.clone(),s:snapshotRig(shooter),k:snapshotRig(keeper)};}
function restoreRig(r,a,b,t){r.root.position.lerpVectors(a.p,b.p,t);r.root.quaternion.slerpQuaternions(a.q,b.q,t);Object.values(r.bones).forEach((bone,i)=>{bone.position.lerpVectors(a.b[i][0],b.b[i][0],t);bone.quaternion.slerpQuaternions(a.b[i][1],b.b[i][1],t);});}
function updateReplay(raw){
 replay.elapsed+=raw*.32;const frames=replay.frames,target=frames[0].t+replay.elapsed;
 let i=0;while(i<frames.length-2&&frames[i+1].t<target)i++;
 const a=frames[i],b=frames[i+1],t=T.MathUtils.clamp((target-a.t)/Math.max(.001,b.t-a.t),0,1);
 ball.position.lerpVectors(a.ball,b.ball,t);ball.quaternion.slerpQuaternions(a.q,b.q,t);restoreRig(shooter,a.s,b.s,t);restoreRig(keeper,a.k,b.k,t);
 if(target>=frames.at(-1).t)endReplay();
}
function endReplay(){
 replay=null;$('replay-skip').hidden=true;phase='celebration';
 const goal=ballState?.result==='goal';
 shooter.play(goal?'celebrate':'disappointed',1,.2);
 if(!goal){keeperState.diving=false;keeper.root.position.set(T.MathUtils.clamp(keeper.root.position.x,-3,3),0,.35);keeper.play('celebrate',1,.18);}
 after=setTimeout(nextKick,1900);
}
$('replay-skip').onclick=endReplay;

function updateBall(dt) {
  const s = ballState; if (!s || s.done) return;
  s.time += dt; const p = ball.position, prevZ = p.z;
  s.v.x += s.curl * dt * (s.crossed ? 0 : 1); s.v.y -= G * dt; s.v.multiplyScalar(Math.exp(-.06 * dt));
  p.addScaledVector(s.v, dt);
  ball.rotation.x += s.spin.x * dt; ball.rotation.y += s.spin.y * dt;
  // Ground bounce
  if (p.y < R) { p.y = R; s.v.y = Math.abs(s.v.y) * .45; s.v.x *= .8; s.v.z *= .8; if (Math.abs(s.v.y) < .4) s.v.y = 0; }
  // Keeper contact
  if (!s.result && keeperState && !keeperState.diving && p.z < .6 && p.z > 0 && Math.abs(p.x - keeper.root.position.x) < .38 && p.y < 1.85) {
    s.result = 'saved'; s.v.z = Math.abs(s.v.z) * .3 + 1.5; s.v.x = (Math.random() - .5) * 4; s.v.y = 1.5; s.curl = 0; finishKick('saved');
  }
  if (!s.result && keeperState?.diving && p.z < 1.2 && p.z > -.4) {
    const hand = keeperHand(), d = hand.distanceTo(p);
    if (d < .55) { s.result = 'saved'; s.v.z = Math.abs(s.v.z) * .35 + 2; s.v.x = (p.x - hand.x) * 6 + (Math.random() - .5) * 3; s.v.y = 2 + Math.random() * 2; s.curl = 0; finishKick('saved'); }
  }
  // Posts and bar
  if (!s.result && prevZ > 0 && p.z <= .1) {
    const nearPost = Math.min(Math.abs(Math.abs(p.x) - (HALF_W + POST)), 9) < R + POST && p.y < GOAL_H + POST, nearBar = Math.abs(p.y - (GOAL_H + POST)) < R + POST && Math.abs(p.x) < HALF_W + POST;
    if (nearPost || nearBar) { s.result = 'post'; s.v.z = Math.abs(s.v.z) * .6; s.v.x *= nearPost ? -.6 : .8; if (nearBar) s.v.y = Math.abs(s.v.y) * .5 + 1; sound.post(); finishKick('post'); }
  }
  if (!s.crossed && p.z <= 0) {
    s.crossed = true;
    if (!s.result) {
      const inside = Math.abs(p.x) < HALF_W - R * .2 && p.y < GOAL_H - R * .2;
      s.result = inside ? 'goal' : 'miss'; finishKick(s.result);
    }
  }
  // Net
  if (s.result === 'goal') {
    if (p.z < -NET_D + R) { nets[0].hit(p.clone(), new T.Vector3(0, 0, -1).multiplyScalar(Math.min(1.4, Math.abs(s.v.z) * .1))); p.z = -NET_D + R; s.v.z = Math.abs(s.v.z) * .15; s.v.x *= .4; sound.net(); }
    if (p.y > GOAL_H - .3 - (-p.z) * .12 && p.z < 0 && s.v.y > 0) { nets[1].hit(p.clone(), new T.Vector3(0, 1, 0).multiplyScalar(.6)); s.v.y *= -.3; }
    if (Math.abs(p.x) > HALF_W - R && p.z < 0) { nets[p.x < 0 ? 2 : 3].hit(p.clone(), new T.Vector3(Math.sign(p.x), 0, 0).multiplyScalar(.8)); p.x = Math.sign(p.x) * (HALF_W - R); s.v.x *= -.2; }
  }
  // Slow motion as the ball arrives at a contested goal mouth
  const close = !s.result && p.z < 3 && p.z > -.2 && keeperState?.diving;
  timeScale += ((close ? .3 : 1) - timeScale) * Math.min(1, dt * 30);
  if (s.result) { s.rest += dt; if (s.rest > 2.6 / Math.max(.3, timeScale)) s.done = true; }
}

function keeperHand() {
  if(!keeper)return new T.Vector3(0,1,.35);
  return keeper.hand(keeperState?.to?.x<0?'Right':'Left');
}
function updateKeeper(dt,now) {
  const k=keeperState,kp=keeper;if(!k||!kp)return;
  if(k.pending&&simTime>=k.pending.at){const pd=k.pending;k.pending=null;dive(pd.aim,pd.reach);}
  kp.update(dt);
  if(!k.diving){
    if(ballState?.result==='saved'){kp.play('celebrate');return;}
    kp.root.position.set(Math.sin(now*2.2)*.12,0,.35);return;
  }
  const p=Math.min(1,(simTime-k.start)/k.dur),e=p*p*(3-2*p);
  // Warp the captured reach onto the gameplay target, keeping the visible glove
  // and collision point identical. Captured recovery/landing continues afterwards.
  const side=k.to.x<0?'Right':'Left',hand=kp.hand(side);
  if(p<1||!ballState?.result){
    const desired=new T.Vector3().lerpVectors(k.handStart,k.to.clone().add(new T.Vector3(0,0,.35)),e);
    kp.root.position.add(desired.sub(hand));
    kp.root.updateMatrixWorld(true);
  }
}

function updateCamera(dt) {
  if (!camTarget) return;
  const k = 1 - Math.exp(-dt * 3);
  let pos = camTarget.pos.clone(), look = camTarget.look.clone();
  if(phase==='replay'){pos.set(ball.position.x>0?6.5:-6.5,2.1,5.8);look.set(ball.position.x*.4,1,0);}
  else if(phase==='celebration'){
    const r=ballState?.result==='goal'?shooter:keeper,focus=r.bones.Head.getWorldPosition(new T.Vector3());
    pos.copy(r.root.position).add(new T.Vector3(2,1.65,-3.5));look.copy(focus).add(new T.Vector3(0,-.3,0));
  }
  else if (ballState && youShooting && ballState.result !== 'miss') { pos.z = THREE_lerp(camTarget.pos.z, 9.5, Math.min(1, ballState.time * 1.2)); look.lerp(new T.Vector3(ball.position.x * .6, 1.1, ball.position.z), .3); }
  camera.position.lerp(pos, k);
  camTarget.cur = camTarget.cur ? camTarget.cur.lerp(look, k) : look; camera.lookAt(camTarget.cur);
}
const THREE_lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Results & flow ---------- */
function finishKick(result) {
  const youScored = youShooting && result === 'goal', youSaved = !youShooting && result !== 'goal';
  const good = youScored || youSaved;
  const text = { goal: 'GOAL!', saved: youShooting ? 'Saved!' : 'Great save!', post: 'Off the post!', miss: 'Missed!' }[result];
  if(result==='goal'||result==='saved')replay={pending:.65,elapsed:0};
  if (result === 'goal') sound.cheer(); else if (good) sound.cheer(); else sound.groan();
  banner(youShooting ? text : (result === 'goal' ? 'They scored' : text), good);
  if (mode === 'practice') { streak = result === 'goal' ? streak + 1 : 0; if (streak > best) { best = streak; localStorage.setItem('penalty-best', best); } }
  else (youShooting ? score.you : score.cpu).push(result === 'goal');
  setTimeout(()=>{if(!shooter||ballState?.result!==result||phase==='replay')return;shooter.play(result==='goal'?'celebrate':'disappointed');},350);
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
  $('board').innerHTML = mode === 'practice'
    ? `<div class="sb-practice"><span>Streak</span><b>${streak}</b><span>Best ${best}</span></div>`
    : `<div class="sb-row"><span class="sb-team"><i style="background:${KITS[settings.kit][0]}"></i>You</span><span class="sb-dots">${dots(score.you, n)}</span><b>${ga}</b></div><div class="sb-row"><span class="sb-team"><i style="background:#f3f3f3"></i>CPU</span><span class="sb-dots">${dots(score.cpu, n)}</span><b>${gb}</b></div>`;
  $('hint').textContent = phase === 'aim' ? 'Swipe the ball towards the goal · curve your swipe to bend it' : phase === 'cpu-runup' || phase === 'cpu-kick' ? 'You’re in goal — tap where to dive' : '';
}

/* ---------- Menus ---------- */
function syncSegments() {
  document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(settings[seg.dataset.setting] === b.dataset.value))));
  $('btn-sound').classList.toggle('is-off', !settings.sound);
}
document.querySelectorAll('.seg[data-setting]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-value]'); if (!b) return; settings[seg.dataset.setting] = b.dataset.value; save(); syncSegments(); }));
function start(m) {
  clearTimeout(after);
  if (!keeper) return;
  sound.ctx(); sound.ambience(); sound.setAmbience(true); sound.whistle();
  mode = m; score = { you: [], cpu: [] }; streak = 0; $('start').hidden = true; $('result').hidden = true; setupKick(true);
}
$('play-shootout').onclick = () => start('shootout');
$('play-practice').onclick = () => start('practice');
$('again').onclick = () => start(mode);
const toMenu = () => { animationToken++;clearTimeout(after);replay=null;$('replay-skip').hidden=true; mode = null; phase = 'menu'; $('result').hidden = true; $('start').hidden = false; sound.setAmbience(false); setupMenuView(); hud(); };
$('to-menu').onclick = toMenu;
$('btn-menu').onclick = () => { if (mode && phase !== 'over' && !confirm('Leave this match?')) return; toMenu(); };
$('btn-sound').onclick = () => { settings.sound = !settings.sound; save(); syncSegments(); sound.setAmbience(!!mode); };
$('btn-full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});

function setupMenuView() { setupKick(true); phase = 'menu'; camTarget = { pos: new T.Vector3(6, 2.6, SPOT + 5), look: new T.Vector3(0, 1, 2) }; }

/* ---------- Loop ---------- */
const clock = new T.Clock();
let after = 0;
renderer.setAnimationLoop(() => {
  const raw = Math.min(clock.getDelta(), .05), now = performance.now() / 1000, dt = raw * timeScale;
  if(phase==='replay'){updateReplay(raw);updateCamera(raw);composer.render();return;}
  simTime += dt;
  if (ballState) { const sub = 4; for (let i = 0; i < sub; i++) updateBall(dt / sub); }
  updateKeeper(dt, now); shooter?.update(dt);
  updateShotTrail();
  if(shooter&&keeper&&phase==='flight'){
    replayHistory.push(snapshot());while(replayHistory.length>160||replayHistory.length>2&&simTime-replayHistory[0].t>1.4)replayHistory.shift();
    if(replay?.pending!==undefined){replay.pending-=raw;if(replay.pending<=0&&replayHistory.length>2){replay.frames=replayHistory.filter(f=>f.ball.z<4);if(replay.frames.length<2)replay.frames=replayHistory.slice();replay.elapsed=0;delete replay.pending;phase='replay';shotTrail.visible=false;$('replay-skip').hidden=false;}}
  }
  nets.forEach(n => n.update(raw));
  adTex.offset.x = (adTex.offset.x + raw * .04) % 1;
  effects = effects.filter(f => { f.life += raw; f.update(raw); if (f.life > f.max) { f.dispose(); return false; } return true; });
  if (phase === 'menu' && camTarget) { const a = now * .12; camTarget.pos.set(Math.sin(a) * 9, 2.8, SPOT + Math.cos(a) * 6); }
  updateCamera(raw);
  if (ballState?.done && phase === 'flight') { phase = 'between'; after = setTimeout(nextKick, 300); }
  crowdUniforms.time.value=now; crowdUniforms.cheer.value=T.MathUtils.damp(crowdUniforms.cheer.value, ballState?.result==='goal'?1:0,3,raw);
  composer.render();
});

syncSegments(); hud();
bodiesReady.then(() => { setupMenuView(); $('loading').hidden=true; document.body.classList.add('is-loaded'); }).catch(error => { console.error(error); $('load-progress').textContent='Unable to load players'; $('load-retry').hidden=false; });
$('load-retry').onclick=()=>location.reload();
camera.position.set(8, 3, SPOT + 6);
setTimeout(() => document.body.classList.add('is-ready'), 50);
// Local QA only; unavailable on the public site.
if(['localhost','127.0.0.1'].includes(location.hostname))window.penaltyQA={get state(){return {phase,score,mode,ball:ball.position.toArray(),clip:shooter?.anim,keeperClip:keeperState?.clip,result:ballState?.result,streak,replay:!!replay,glove:keeper?keeperHand().toArray():null,modelScale:shooter?.model.scale.toArray(),bounds:shooter?new T.Box3().setFromObject(shooter.model).getSize(new T.Vector3()).toArray():null,hips:shooter?.bones.Hips.getWorldPosition(new T.Vector3()).toArray(),foot:shooter?.bones.RightToeBase.getWorldPosition(new T.Vector3()).toArray()};},shoot:(x,y,aim=null)=>{phase='runup';hud();runUp(()=>{kick(new T.Vector3(x,y,0),.7,0,true);if(aim)keeperState.pending={at:simTime+.04,aim:new T.Vector3(...aim),reach:3.5};});},dive:(x,y)=>dive(new T.Vector3(x,y,0),3.3),start,next:nextKick,winner:shootoutWinner,setScore:(you,cpu)=>{score={you,cpu};return shootoutWinner();}, get rigs(){return {shooter,keeper};}};
