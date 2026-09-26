import {prepareMotorcycle} from './motorcycle-model.js?v=20260926-transit3';
import {rotorFor,mountImportedWheel,rollWheel} from './wheel-rig.js?v=20260926-transit3';
import {addMicroSurface} from './surface-detail.js?v=20260926-transit3';
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {DRACOLoader} from './vendor/loaders/DRACOLoader.js';
const draco=new DRACOLoader().setDecoderPath('./vendor/draco/').setWorkerLimit(1);
const modelLoader=new GLTFLoader().setDRACOLoader(draco);
function block(w,h,d,r=.07){const shape=new T.Shape();const x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:r*.5,bevelSize:r*.4,bevelSegments:4,steps:1,curveSegments:3});g.translate(0,0,-d/2);g.computeVertexNormals();return g}
function wedge(w,baseY,topY,zBack,zFront,topBack,topFront){const p=[-w,baseY,zBack,w,baseY,zBack,w,baseY,zFront,-w,baseY,zFront,-w*.84,topY,topBack,w*.84,topY,topBack,w*.84,topY,topFront,-w*.84,topY,topFront];const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);const ix=g.index;for(let i=0;i<ix.count;i+=3){const a=ix.getX(i);ix.setX(i,ix.getX(i+2));ix.setX(i+2,a)}g.computeVertexNormals();return g}
export class Vehicle{
 constructor(scene,type='coupe',color='#e9e7db'){this.scene=scene;this.group=new T.Group();scene.add(this.group);this.wheels=[];this.frontWheels=[];this.type=type;this.body=new T.MeshPhysicalMaterial({color,metalness:.45,roughness:.25,clearcoat:1,clearcoatRoughness:.16});this.glass=new T.MeshPhysicalMaterial({color:0x263c49,metalness:.65,roughness:.12,clearcoat:1});this.black=new T.MeshStandardMaterial({color:0x151b1d,roughness:.65});this.chrome=new T.MeshStandardMaterial({color:0xadb6ba,metalness:.9,roughness:.2});this.rubber=new T.MeshStandardMaterial({color:0x171c1e,roughness:.94});this.red=new T.MeshStandardMaterial({color:0x610b12,emissive:0xb92723,emissiveIntensity:.65,roughness:.25});this.white=new T.MeshStandardMaterial({color:0xeaf1ea,emissive:0xe6f8ff,emissiveIntensity:1});addMicroSurface(this.rubber,'rubber',.012);addMicroSurface(this.black,'fabric',.006);this.setupDirt();this.build();this.addContactShadow();if(type==='coupe')this.loadDetailedCar();if(type==='bike')this.loadDetailedBike();if(type==='coach')this.loadDetailedCoach();}
 add(g,m,x,y,z,parent=this.group){const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 wheel(x,z,r=.39){const wheel=new T.Group();wheel.userData.radius=r;wheel.position.set(x,r,z);this.group.add(wheel);this.wheels.push(wheel);if(z>0)this.frontWheels.push(wheel);const tire=this.add(new T.CylinderGeometry(r,r,.26,24),this.rubber,0,0,0,wheel);tire.rotation.z=Math.PI/2;const outer=x>0?.145:-.145;const hub=this.add(new T.CylinderGeometry(r*.68,r*.68,.015,24),this.chrome,outer,0,0,wheel);hub.rotation.z=Math.PI/2;const dark=this.add(new T.CylinderGeometry(r*.52,r*.52,.02,20),this.black,outer*1.06,0,0,wheel);dark.rotation.z=Math.PI/2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const spoke=this.add(new T.BoxGeometry(.03,r*.98,.05),this.chrome,outer*1.15,0,0,wheel);spoke.rotation.x=a;}rotorFor(wheel);return wheel}
 build(){const coach=this.type==='coach',bike=this.type==='bike';if(bike){this.buildBike();}
 else if(coach){this.buildCoach();}
 else{this.add(block(1.94,.49,4.1,.13),this.body,0,.78,0);this.add(block(1.88,.29,3.75,.1),this.black,0,.48,-.08);this.add(wedge(.88,.98,1.68,-1.44,.96,-.85,.24),this.glass,0,0,0);this.add(block(1.48,.075,1.06,.04),this.body,0,1.69,-.33);this.add(block(1.75,.13,1.05,.04),this.body,0,1.02,1.48);this.add(block(1.73,.17,.59,.06),this.body,0,1.03,-1.75);for(const x of [-.85,.85]){this.add(block(.035,.56,.06,.01),this.body,x,1.32,-.57);this.add(block(.22,.12,.3,.04),this.body,x*1.25,1.17,.45);this.add(block(.5,.1,.08,.025),this.white,x*.81,.9,2.1);this.add(block(.66,.1,.07,.025),this.red,x*.70,.96,-2.13);}this.add(block(1.65,.16,.06,.04),this.black,0,.54,2.12);this.add(block(1.66,.18,.07,.04),this.black,0,.47,-2.11);const plate=new T.MeshStandardMaterial({color:0xdedfcf});this.add(block(.48,.13,.035,.015),plate,0,.69,-2.16);this.add(new T.TorusGeometry(.055,.013,6,20),this.chrome,0,.99,-2.19);for(const x of [-.98,.98]){this.wheel(x,1.31);this.wheel(x,-1.31);}}
 this.makeInterior();this.headlights=[];for(const x of [-.65,.65]){const light=new T.SpotLight(0xe4f4ff,0,125,.42,.55,1.2);light.position.set(bike?x*.3:x,.85,coach?3.7:2);light.target.position.set(x,.1,60);this.group.add(light,light.target);this.headlights.push(light);}
 }
 profile(points,depth,bevel=.06){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:8});g.translate(0,0,-depth/2);g.rotateY(-Math.PI/2);g.computeVertexNormals();return g}
 buildCoach(){const W=2.5,silver=new T.MeshStandardMaterial({color:0xb9bec3,metalness:.7,roughness:.35}),dark=new T.MeshStandardMaterial({color:0x1a1d20,roughness:.6}),tint=new T.MeshPhysicalMaterial({color:0x14212c,metalness:.45,roughness:.05,clearcoat:1,envMapIntensity:1.4}),led=new T.MeshStandardMaterial({color:0x221400,emissive:0xffa21a,emissiveIntensity:1.4});
  // Body shell: a long rounded side profile extruded across the width.
  this.add(this.profile([[-3.9,.5],[-3.95,3.05],[-3.78,3.26],[3.45,3.26],[3.86,3.02],[3.98,1.35],[3.92,.5],[3.62,.36],[-3.62,.36]],W-.12),this.body,0,0,0);
  // Continuous tinted window band down both sides and a raked panoramic windscreen.
  this.add(this.profile([[-3.62,1.72],[-3.62,2.9],[3.2,2.92],[3.48,1.72]],W-.04,.03),tint,0,0,0);
  this.add(this.profile([[3.55,1.12],[3.72,2.94],[3.9,2.9],[4.0,1.2]],W-.3,.03),tint,0,0,0);
  for(let z=-3.3;z<3.1;z+=1.05)for(const x of [-W/2+.005,W/2-.005])this.add(new T.BoxGeometry(.03,1.14,.08),dark,x,2.31,z);
  // Roof air-conditioning pod, lower silver skirt, bumpers.
  this.add(block(1.5,.26,3.2,.1),silver,0,3.38,-.4);
  for(const x of [-W/2+.01,W/2-.01])this.add(new T.BoxGeometry(.02,.34,7.3),silver,x,.62,0);
  this.add(block(W-.1,.32,.18,.06),dark,0,.55,3.95);this.add(block(W-.1,.3,.16,.06),dark,0,.55,-3.95);
  // Wheel arches and doors.
  for(const z of [2.48,-2.42])for(const x of [-W/2+.02,W/2-.02]){const arch=this.add(new T.CylinderGeometry(.66,.66,.08,24,1,false,0,Math.PI),dark,x,.5,z);arch.rotation.z=Math.PI/2;arch.rotation.y=x>0?0:Math.PI;}
  this.add(new T.BoxGeometry(.03,1.9,.95),tint,W/2-.005,1.55,2.95);this.add(new T.BoxGeometry(.035,1.9,.04),silver,W/2+.005,1.55,2.95);
  // Destination display, bus mirrors on arms, lights.
  this.add(block(1.5,.22,.05,.03),dark,0,3.05,3.9);this.add(new T.BoxGeometry(1.3,.12,.02),led,0,3.05,3.935);
  for(const s of [-1,1]){const arm=this.add(new T.CylinderGeometry(.025,.025,.7,8),dark,s*1.45,2.75,3.75);arm.rotation.z=s*1.2;this.add(block(.1,.38,.22,.04),dark,s*1.72,2.55,3.8);
   this.add(block(.42,.14,.08,.03),this.white,s*.88,.95,3.97);this.add(block(.2,.1,.06,.02),new T.MeshStandardMaterial({color:0xffb020,emissive:0xff9a00,emissiveIntensity:.6}),s*1.1,.95,3.97);
   this.add(block(.14,.5,.08,.03),this.red,s*1.08,1.15,-3.98);this.add(block(.12,.22,.08,.03),this.white,s*1.08,.72,-3.98);}
  this.add(block(.55,.14,.03,.015),new T.MeshStandardMaterial({color:0xdedfcf}),0,.95,-3.99);
  this.add(new T.BoxGeometry(W-.4,.9,.04),new T.MeshStandardMaterial({color:0x2a2f35,metalness:.5,roughness:.45}),0,1.95,-3.965);
  for(let y=.95;y<1.5;y+=.1)this.add(new T.BoxGeometry(1.6,.04,.03),dark,0,y,-3.975);
  for(const x of [-1.2,1.2]){this.wheel(x,2.48,.52);this.wheel(x,-2.42,.52);}
 }
 makeInterior(){this.interior=new T.Group();this.group.add(this.interior);this.interior.visible=false;const bike=this.type==='bike',coach=this.type==='coach';if(bike){this.makeBikeCockpit();return;}this.seatY=coach?2.63:bike?1.73:1.43;this.seatZ=coach?2.4:bike?-.1:-.05;const dashY=this.seatY-(coach?.66:.38),dashZ=this.seatZ+(coach?1.05:1.12);this.add(block(bike?.7:coach?2.3:2,coach?.1:.16,coach?.7:.55,.05),this.black,0,dashY,dashZ,this.interior);const screen=document.createElement('canvas');screen.width=512;screen.height=160;this.dashboardCanvas=screen;this.dashboardTexture=new T.CanvasTexture(screen);this.dashboardTexture.colorSpace=T.SRGBColorSpace;this.screenMesh=this.add(new T.PlaneGeometry(.61,.19),new T.MeshBasicMaterial({map:this.dashboardTexture}),.40,dashY+.055,dashZ-.29,this.interior);this.screenMesh.rotation.y=Math.PI;this.screenMesh.rotation.x=.18;const steering=new T.Group();steering.position.set(coach?0:.4,dashY+(coach?.18:-.015),dashZ-(coach?.62:.53));if(coach){steering.rotation.x=-1.05;steering.scale.setScalar(1.7);}this.interior.add(steering);this.steering=steering;const rim=this.add(new T.TorusGeometry(.20,.026,10,32),this.black,0,0,0,steering);const core=this.add(block(.15,.1,.03,.015),this.black,0,-.025,0,steering);for(const a of [0,2.1,4.2]){const bar=this.add(new T.BoxGeometry(.023,.17,.025),this.chrome,Math.sin(a)*.07,Math.cos(a)*.07,0,steering);bar.rotation.z=-a;}this.updateDashboard(0,0,false);}
 addContactShadow(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,6,64,64,64);g.addColorStop(0,'rgba(0,0,0,.72)');g.addColorStop(.55,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);const size=this.type==='coach'?[3.4,9]:this.type==='bike'?[.9,2.4]:[2.4,5];const m=new T.Mesh(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));m.rotation.x=-Math.PI/2;m.position.y=.02;m.renderOrder=1;this.group.add(m);this.contact=m;}
 limb(a,b,r,mat,parent){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),len=d.length();const mesh=new T.Mesh(new T.CapsuleGeometry(r,Math.max(.01,len-r*1.2),6,12),mat);mesh.position.copy(A).add(B).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;}
 buildBike(){const m=new T.Group();this.group.add(m);this.bikeModel=m;
  const metal=new T.MeshStandardMaterial({color:0x2a2e32,metalness:.8,roughness:.38}),alloy=new T.MeshStandardMaterial({color:0x9ea5aa,metalness:.9,roughness:.26}),disc=new T.MeshStandardMaterial({color:0xc2c6c9,metalness:.95,roughness:.34}),gold=new T.MeshStandardMaterial({color:0xc9952b,metalness:.9,roughness:.3}),seat=new T.MeshStandardMaterial({color:0x16181a,roughness:.85}),screen=new T.MeshPhysicalMaterial({color:0x2a3a44,metalness:.2,roughness:.05,transparent:true,opacity:.55,clearcoat:1,side:T.DoubleSide});
  const add=(g,mat,x,y,z,rx=0,ry=0,rz=0,parent=m)=>{const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const wheel=(z,front)=>{const w=new T.Group();w.position.set(0,.32,z);m.add(w);this.wheels.push(w);if(front)this.frontWheels.push(w);
   add(new T.TorusGeometry(.25,.072,18,56),this.rubber,0,0,0,0,Math.PI/2,0,w);add(new T.TorusGeometry(.215,.016,8,56),alloy,0,0,0,0,Math.PI/2,0,w);
   for(let i=0;i<5;i++)add(new T.BoxGeometry(.018,.43,.03),alloy,0,0,0,i*Math.PI/5,0,0,w);
   add(new T.CylinderGeometry(.05,.05,.13,16),metal,0,0,0,0,0,Math.PI/2,w);
   for(const x of front?[-.075,.075]:[.065])add(new T.CylinderGeometry(front?.155:.12,front?.155:.12,.008,36),disc,x,0,0,0,0,Math.PI/2,w);
   if(front)for(const x of [-.075,.075])add(new T.BoxGeometry(.03,.09,.07),gold,x*1.25,.11,-.1,0,0,0,w).userData.fixed=true;w.userData.radius=.322;rotorFor(w);return w;};
  const frontWheel=wheel(.7,true);wheel(-.72,false);const steeringParts=[frontWheel];
  const beforeFork=new Set(m.children);
  // Front fork, yokes and handlebars.
  for(const x of [-.09,.09]){add(new T.CylinderGeometry(.03,.034,.72,14),gold,x,.66,.6,-.29);add(new T.CylinderGeometry(.036,.036,.25,14),alloy,x,.93,.51,-.29);}
  add(new T.BoxGeometry(.28,.04,.1),metal,0,1.02,.47);add(new T.BoxGeometry(.24,.035,.09),alloy,0,.86,.52);
  const bars=new T.Group();bars.position.set(0,1.02,.46);m.add(bars);this.bikeBars=bars;
  for(const s of [-1,1]){add(new T.BoxGeometry(.2,.032,.032),alloy,s*.15,-.01,-.02,0,s*-.2,s*-.12,bars);add(new T.CylinderGeometry(.021,.021,.12,12),this.rubber,s*.28,-.03,-.05,0,0,Math.PI/2,bars);add(new T.CylinderGeometry(.006,.006,.16,6),metal,s*.2,.08,.04,0,0,s*.35,bars);add(block(.1,.05,.03,.012),metal,s*.25,.16,.05,0,0,0,bars);}
  for(const child of m.children)if(!beforeFork.has(child))steeringParts.push(child);
  const head=new T.Group();head.position.set(0,1.02,.47);head.rotation.x=-.29;m.add(head);
  const steering=new T.Group();head.add(steering);this.bikeSteering=steering;m.updateMatrixWorld(true);
  for(const part of steeringParts)steering.attach(part);
  // A front mudguard follows the fork. Its arc leaves the road contact exposed.
  const fender=add(new T.TorusGeometry(.36,.024,8,40,Math.PI*.92),this.body,0,0,0,0,Math.PI/2,0,frontWheel);fender.rotation.x=0;fender.scale.z=3.6;
  // Frame, swingarm and engine.
  for(const x of [-.13,.13]){add(block(.05,.12,.66,.02),alloy,x,.76,.19,-.59);add(block(.04,.07,.64,.015),alloy,x*.85,.435,-.42,-.37);}
  add(block(.34,.36,.46,.05),metal,0,.5,.13);add(block(.3,.18,.28,.04),metal,0,.73,.25,-.3);
  for(const x of [-.19,.19])add(new T.CylinderGeometry(.12,.12,.02,28),alloy,x,.46,.1,0,0,Math.PI/2);
  add(new T.BoxGeometry(.4,.3,.05),new T.MeshStandardMaterial({color:0x111416,roughness:.6}),0,.72,.43,-.25);
  for(const x of [-.2,.2])add(new T.CylinderGeometry(.015,.015,.14,8),alloy,x,.44,-.1,0,0,Math.PI/2);
  // Bodywork: tank, fairings, screen, seat and tail.
  const sphere=new T.SphereGeometry(.5,36,22);
  add(sphere,this.body,0,.98,.12).scale.set(.52,.4,.72);
  const lampCase=add(new T.CylinderGeometry(.135,.12,.13,40),metal,0,.96,.6,Math.PI/2);
  const lens=add(new T.CylinderGeometry(.116,.116,.012,40),this.white,0,.96,.672,Math.PI/2);
  const rim=add(new T.TorusGeometry(.123,.012,10,40),alloy,0,.96,.68);
  m.updateMatrixWorld(true);for(const part of [lampCase,lens,rim])steering.attach(part);
  add(sphere,this.body,0,.61,.24).scale.set(.26,.2,.48);
  const dome=new T.SphereGeometry(.5,28,12,0,Math.PI*2,0,Math.PI/2);const windscreen=add(dome,screen,0,1.13,.56,-1.05);windscreen.scale.set(.25,.18,.34);windscreen.castShadow=false;

  add(block(.28,.07,.42,.03),seat,0,1.06,-.24,.07);
  add(sphere,this.body,0,1.07,-.56,-.16).scale.set(.19,.13,.42);
  add(block(.12,.035,.03,.01),this.red,0,1.1,-.75,-.2);
  this.limb([0,1.06,-.66],[0,.84,-.9],.025,metal,m);
  add(block(.16,.11,.02,.01),new T.MeshStandardMaterial({color:0xdedfcf}),0,.84,-.9,.25);
  // Visible radiator fins, cylinder ribs, chain run and rear coil-over.
  for(let y=.59;y<.82;y+=.022)add(new T.BoxGeometry(.37,.009,.008),alloy,0,y,.464);
  for(let y=.43;y<.7;y+=.035)add(block(.35,.014,.31,.02),metal,0,y,.13);
  for(const x of [-.145,.145]){this.limb([x,.91,.43],[x,.52,-.2],.027,alloy,m);this.limb([x,.52,-.2],[x,.34,-.72],.028,metal,m);}
  this.limb([-.12,.41,-.69],[-.12,.52,-.1],.008,metal,m);this.limb([-.12,.25,-.69],[-.12,.4,-.1],.008,metal,m);
  for(let i=0;i<9;i++)add(new T.TorusGeometry(.042,.007,6,16),gold,0,.55+i*.02,-.38,Math.PI/2);
  // Exhaust.
  add(new T.CylinderGeometry(.058,.068,.44,22),alloy,.17,.53,-.44,Math.PI/2-.26);add(new T.CylinderGeometry(.045,.045,.02,16),metal,.17,.58,-.66,Math.PI/2-.26);
  // Rider in leathers.
  const suit=new T.MeshStandardMaterial({color:0x1f2327,roughness:.62}),panel=new T.MeshStandardMaterial({color:0xd8dcd6,roughness:.55}),helmet=new T.MeshPhysicalMaterial({color:0xf1f1ee,roughness:.2,clearcoat:1,clearcoatRoughness:.08}),visor=new T.MeshPhysicalMaterial({color:0x0c141c,roughness:.03,metalness:.6,clearcoat:1});
  const rider=new T.Group();m.add(rider);this.rider=rider;
  this.limb([0,1.1,-.26],[0,1.4,.04],.16,suit,rider).scale.x=1.18;
  this.limb([0,1.18,-.18],[0,1.36,.0],.13,panel,rider).scale.set(1.25,1,.6);
  const helmetMesh=add(new T.SphereGeometry(.145,28,20),helmet,0,1.56,.13,0,0,0,rider);helmetMesh.scale.set(1,1,1.08);
  add(new T.SphereGeometry(.147,32,16,Math.PI*.18,Math.PI*.64,Math.PI*.36,Math.PI*.26),visor,0,1.56,.135,0,0,0,rider).scale.z=1.09;
  this.riderArms=[];
  for(const s of [-1,1]){const shoulder=new T.Vector3(s*.17,1.39,.02),elbow=new T.Vector3(s*.23,1.2,.25),hand=new T.Vector3(s*.28,.99,.41);
   const upper=this.limb(shoulder.toArray(),elbow.toArray(),.05,suit,rider),lower=this.limb(elbow.toArray(),hand.toArray(),.045,suit,rider),glove=add(new T.SphereGeometry(.045,12,10),seat,...hand.toArray(),0,0,0,rider);
   this.riderArms.push({side:s,shoulder,upper,lower,glove,upperLength:shoulder.distanceTo(elbow),lowerLength:elbow.distanceTo(hand)});this.limb([s*.12,1.08,-.2],[s*.21,.9,.1],.075,suit,rider);this.limb([s*.21,.9,.1],[s*.2,.5,-.08],.06,suit,rider);add(block(.09,.07,.2,.03),seat,s*.2,.46,-.04,0,0,0,rider);}
 }
 poseRider(){
  this.group.updateWorldMatrix(true,true);
  for(const arm of this.riderArms){
   const hand=this.importedBike?this.importedBike.grips[arm.side>0?0:1].getWorldPosition(new T.Vector3()):this.bikeBars.localToWorld(new T.Vector3(arm.side*.28,-.03,-.05));this.rider.worldToLocal(hand);
   const direction=hand.clone().sub(arm.shoulder),distance=Math.min(direction.length(),arm.upperLength+arm.lowerLength-.001);direction.normalize();
   const along=(arm.upperLength**2-arm.lowerLength**2+distance**2)/(2*distance),bend=Math.sqrt(Math.max(0,arm.upperLength**2-along**2));
   const pole=new T.Vector3(arm.side,.2,-.4);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
   const elbow=arm.shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,bend);
   for(const [mesh,a,b,len] of [[arm.upper,arm.shoulder,elbow,arm.upperLength],[arm.lower,elbow,hand,arm.lowerLength]]){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());mesh.scale.y=a.distanceTo(b)/len;}
   arm.glove.position.copy(hand);
  }
 }
 makeBikeCockpit(){this.seatY=1.5;this.seatZ=.06;const screen=document.createElement('canvas');screen.width=512;screen.height=160;this.dashboardCanvas=screen;this.dashboardTexture=new T.CanvasTexture(screen);this.dashboardTexture.colorSpace=T.SRGBColorSpace;const bezel=new T.Mesh(block(.24,.1,.035,.015),this.black);bezel.position.set(0,.14,.04);bezel.rotation.x=-.55;this.bikeBars.add(bezel);this.screenMesh=new T.Mesh(new T.PlaneGeometry(.21,.066),new T.MeshBasicMaterial({map:this.dashboardTexture}));this.screenMesh.position.set(0,.145,.02);this.screenMesh.rotation.set(-.55,Math.PI,0);this.screenMesh.rotation.order='YXZ';this.screenMesh.rotation.set(.55,Math.PI,0);this.bikeBars.add(this.screenMesh);this.steering=this.bikeBars;this.updateDashboard(0,0,false);}

 updateDashboard(speed,distance,auto){const ctx=this.dashboardCanvas.getContext('2d');ctx.fillStyle='#111c21';ctx.fillRect(0,0,512,160);ctx.strokeStyle='#82d9db';ctx.lineWidth=5;ctx.beginPath();ctx.arc(88,80,54,.7*Math.PI,2.3*Math.PI);ctx.stroke();ctx.fillStyle='#eaf4ee';ctx.font='50px sans-serif';ctx.textAlign='center';ctx.fillText(String(Math.round(Math.abs(speed))),88,91);ctx.font='13px monospace';ctx.fillStyle='#8ca7a7';ctx.fillText('KM/H',88,118);ctx.textAlign='left';ctx.font='20px monospace';ctx.fillStyle='#d7e5d3';ctx.fillText(distance.toFixed(1).padStart(7,'0')+' km',180,63);ctx.font='14px monospace';ctx.fillStyle=auto?'#dcefa9':'#9aadb5';ctx.fillText(auto?'◉  AUTODRIVE':'D   ELECTRIC',182,98);this.dashboardTexture.needsUpdate=true;}
 update(dt,speed,steer,night,braking,firstPerson){if(this.detailed){for(const item of this.realWheels)rollWheel(item,speed*dt,steer);for(const mat of this.realBrakeMats)mat.emissiveIntensity=braking?2.4:.45;this.detailed.visible=true;if(this.realSteer){this.realSteer.object.quaternion.copy(this.realSteer.base);this.realSteer.object.rotateY(-steer*3.2);}if(this.realGlass)this.realGlass.opacity=firstPerson?.14:.43;const raw=dt>1e-4?(speed-(this.prevSpeed??speed))/dt:0;this.prevSpeed=speed;this.accel=(this.accel||0)+(Math.max(-15,Math.min(15,raw))-(this.accel||0))*Math.min(1,dt*3);this.pitch=(this.pitch||0)+(Math.max(-.022,Math.min(.022,-this.accel*.0022))-(this.pitch||0))*Math.min(1,dt*4);if(this.rig)this.rig.rotation.x=this.pitch;}for(const wheel of this.wheels){if(wheel.userData.rotor)wheel.userData.rotor.rotation.x=(wheel.userData.rotor.rotation.x+speed*dt/(wheel.userData.radius||.39))%(Math.PI*2);}for(const wheel of this.frontWheels)if(this.type!=='bike')wheel.rotation.y=steer;this.red.emissiveIntensity=braking?4:.7;const flash=this.flashing;this.white.emissiveIntensity=flash?4:night?3:1;if(this.realLeds)this.realLeds.emissiveIntensity=flash?3.5:1.6;for(const light of this.headlights)light.intensity=flash?(night?130:20):night?100:0;this.interior.visible=firstPerson&&(!this.detailed||this.type==='coach');if(this.type==='bike'){this.importedBike?.update(dt,speed,steer);this.bikeSteering.rotation.y=steer;this.poseRider();if(this.rider)this.rider.visible=!firstPerson;}else this.steering.rotation.z=-steer*3.5;for(const child of this.group.children){if(child.userData.fallback)child.visible=!this.detailed&&!firstPerson;else if(child.isMesh)child.visible=!firstPerson;} }

 loadDetailedCoach(){
  const fallback=[...this.group.children].filter(o=>o!==this.interior&&o!==this.contact&&!o.isLight&&!this.headlights.some(l=>l.target===o));
  this.ready=new Promise(resolve=>modelLoader.load('./assets/models/road-coach.glb?v=transit3',asset=>{
   if(this.disposed){resolve();return;}const model=asset.scene;this.realWheels=[];this.realBrakeMats=[];const wheelNodes=[];
   model.traverse(o=>{if(/^Wheel_[FR][LR]$/.test(o.name))wheelNodes.push(o);if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material.name==='RearLightsPBR')this.realBrakeMats.push(o.material);if(o.material.name==='BodyPBR')o.material=this.body;}});
   for(const wheel of wheelNodes)this.realWheels.push(mountImportedWheel(wheel,model,wheel.name[6]==='F'));
   this.detailed=model;this.group.add(model);fallback.forEach(o=>{o.userData.fallback=true;o.visible=false;});this.wheels=[];this.frontWheels=[];
   this.seatY=2.17;this.seatZ=4.75;this.interior.position.set(0,-.46,2.35);this.contact.scale.y=12.6/9;
   this.headlights.forEach((l,i)=>l.position.set(i? .99:-.99,.72,5.96));resolve();
  },undefined,error=>{console.warn('Imported coach unavailable',error);resolve();}));
 }
 loadDetailedBike(){
  this.ready=new Promise(resolve=>modelLoader.load('./assets/models/motorcycle-gyo.glb?v=transit3',asset=>{
   if(this.disposed){resolve();return;}this.importedBike=prepareMotorcycle(asset);this.group.add(this.importedBike.model);
   for(const o of this.bikeModel.children)if(o!==this.rider)o.visible=false;
   this.rider.position.y=-.12;this.rider.position.z=-.08;resolve();
  },undefined,error=>{console.warn('Imported motorcycle unavailable',error);resolve();}));
 }
 loadDetailedCar(){
  modelLoader.load('./assets/sports-coupe.glb',gltf=>{
   if(this.disposed){gltf.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});return;}
   const model=gltf.scene;model.rotation.y=Math.PI;model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model);const center=box.getCenter(new T.Vector3());model.position.x=-center.x;model.position.z=-center.z;model.position.y=-box.min.y;
   this.detailed=model;this.realWheels=[];this.realFront=[];this.realBrakeMats=[];
   model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.envMapIntensity=.75;o.material.metalness=Math.min(o.material.metalness,.35);if(/glass/i.test(o.name)){o.material=new T.MeshPhysicalMaterial({color:0xa5c5d2,metalness:.1,roughness:.08,transparent:true,opacity:.43,depthWrite:false,clearcoat:1,side:T.DoubleSide});}if(/lights_red/.test(o.name)){o.material=new T.MeshStandardMaterial({color:0x8b0710,emissive:0xff1c12,emissiveIntensity:.5,roughness:.23});this.realBrakeMats.push(o.material);}if(o.name==='leds'){o.material=new T.MeshStandardMaterial({color:0xffffff,emissive:0xe2efff,emissiveIntensity:1.6});this.realLeds=o.material;}if(/rim_|chrome/.test(o.name))o.material=new T.MeshStandardMaterial({color:0xbdc4c7,metalness:.95,roughness:.2});}});
   const body=model.getObjectByName('body');if(body)body.material=this.body;this.body.metalness=.65;this.body.roughness=.24;this.body.envMapIntensity=1.25;this.body.clearcoat=1;
   for(const o of this.group.children){if(o!==this.interior&&!o.isLight&&!o.isObject3DTarget)o.userData.fallback=true;}
   const rig=new T.Group();rig.add(model);this.group.add(rig);this.rig=rig;for(const name of ['wheel_fl','wheel_fr','wheel_rl','wheel_rr']){const wheel=model.getObjectByName(name);if(wheel)this.realWheels.push(mountImportedWheel(wheel,rig,name==='wheel_fl'||name==='wheel_fr'));}this.interior.position.y=-.31;model.traverse(o=>{if(o.isMesh&&/glass/i.test(o.name))this.realGlass=o.material;if(o.isMesh&&o.material&&o.material!==this.body)o.material.envMapIntensity=Math.max(o.material.envMapIntensity||0,1.05);});const wheelNode=model.getObjectByName('steering_wheel');if(wheelNode){this.realSteer={object:wheelNode,base:wheelNode.quaternion.clone()};this.group.updateMatrixWorld(true);const p=this.group.worldToLocal(wheelNode.getWorldPosition(new T.Vector3()));this.seatX=p.x;this.seatY=p.y+.27;this.seatZ=p.z-.66;}else{this.seatY=1.12;this.seatZ=-.05;}
   document.dispatchEvent(new CustomEvent('vehicleloaded',{detail:{name:'Sports coupé',source:'vicent091036 / Three.js'}}));
  },undefined,error=>{console.error('Detailed vehicle load failed',error);document.dispatchEvent(new CustomEvent('vehicleloaderror'));});
 }
 setColor(color){this.body.color.set(color)}
 // Road dust and mud: builds up low on the bodywork and in blotches, dulls the paint; rain washes it away.
 setupDirt(){const u=this.dirtUniforms={dirt:{value:0},carInv:{value:new T.Matrix4()},height:{value:this.type==='coach'?3.3:this.type==='bike'?1.3:1.3}};
  this.body.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
   sh.vertexShader='uniform mat4 carInv;\nvarying vec3 vCarPos;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvCarPos=(carInv*modelMatrix*vec4(transformed,1.0)).xyz;');
   sh.fragmentShader='uniform float dirt;uniform float height;\nvarying vec3 vCarPos;\nfloat dh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\nfloat dn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(dh(i),dh(i+vec3(1,0,0)),f.x),mix(dh(i+vec3(0,1,0)),dh(i+vec3(1,1,0)),f.x),f.y),mix(mix(dh(i+vec3(0,0,1)),dh(i+vec3(1,0,1)),f.x),mix(dh(i+vec3(0,1,1)),dh(i+vec3(1,1,1)),f.x),f.y),f.z);}\n'+sh.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    float dn1=dn(vCarPos*3.1)*.6+dn(vCarPos*9.)*.4,low=1.-smoothstep(height*.12,height*.62,vCarPos.y);
    float dm=clamp(dirt*(low*1.25+.28)*(.55+dn1*.9)-(1.-dirt)*.2,0.,.92);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.46,.4,.31)*(.8+dn1*.35),dm);roughnessFactor=mix(roughnessFactor,.96,dm);`);};
  this.body.customProgramCacheKey=()=>'dirt';}
 setDirt(amount){this.dirtUniforms.dirt.value=amount;this.dirtUniforms.carInv.value.copy(this.group.matrixWorld).invert();this.body.clearcoat=1-amount*.85;}
 // Live reflection of the surroundings on the car's own materials (null returns them to the sky reflection).
 setEnvMap(texture){this.group.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&m.isMeshStandardMaterial&&m.envMap!==texture&&!(m.emissiveIntensity>.9)){m.envMap=texture;m.needsUpdate=true;}});}
 dispose(){this.disposed=true;this.scene.remove(this.group);const geos=new Set(),mats=new Set();this.group.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material)});for(const g of geos)g.dispose();for(const m of mats)m.dispose();this.dashboardTexture.dispose();}
}
