// The film follows one continuous city circuit. Every vehicle samples the same
// distance-based path so the rear escorts take the same corner as the lead.
import * as THREE from '/evermile/vendor/three.module.js';
import { fitEscaladeWrap } from './escalade-wrap.js';
import { createSkidMarks } from './skid-marks.js';
import { P } from './city.js';

let material;
export function applyLivery(group,kit,paint) {
  if (!material) {
    const texture = new THREE.TextureLoader().load('./assets/vip-livery.webp');
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    material = new THREE.MeshStandardMaterial({map:texture, roughness:.48, polygonOffset:true, polygonOffsetFactor:-2});
  }
  const wrap = material;
  const ray = new THREE.Raycaster();
  for (const side of [-1,1]) {
    const geo = new THREE.PlaneGeometry(kit.len*.46,kit.height*.24,14,5);
    geo.rotateY(side*Math.PI/2);
    const pos = geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i)+kit.height*.49,z=pos.getZ(i)-kit.len*.06;
      ray.set(new THREE.Vector3(side*(kit.width+1),y,z),new THREE.Vector3(-side,0,0));
      const hit=ray.intersectObjects(paint,false)[0];
      pos.setXYZ(i,hit && hit.point.x*side>0 ? hit.point.x+side*.012 : side*kit.width*.44,y,z);
    }
    geo.computeVertexNormals(); group.add(new THREE.Mesh(geo,wrap));
  }
}

export function createMotorcade(scene, kits) {
  const roles = ['police','police','van','van','escort','escort','principal','escort','escort','van','van','police'];
  const points = [[3*P-2,2*P-2],[3*P-2,6*P+2],[6*P+2,6*P+2],[6*P+2,2*P-2]].map(([x,z]) => new THREE.Vector2(x,z));
  const route = new THREE.CurvePath();
  const corners = points.map((p,i) => {
    const offset = j => points[j].clone().sub(p).normalize().multiplyScalar(10).add(p);
    return [offset((i+3)%4),p,offset((i+1)%4)];
  });
  corners.forEach(([entry,corner,exit],i) => {
    route.add(new THREE.QuadraticBezierCurve(entry,corner,exit));
    route.add(new THREE.LineCurve(exit,corners[(i+1)%4][0]));
  });
  const length = route.getLength(), root = new THREE.Group();
  scene.add(root); root.visible = false;
  const cars = roles.map((role,i) => {
    const style = role === 'police' ? 'sedan' : role === 'van' ? 'van' : 'escalade';
    return { role, kit:kits.findIndex(k => k.style === (role === 'van' ? 'vip-van' : style)), tint: role === 'principal' ? 0x101115 : role === 'police' ? 0x273546 : 0xfafaf6,
      push:new THREE.Vector2(), x:0,z:0,h:0,slide:0,spin:0,v:0, index:i };
  });
  let age = 0, built = false, rubber;
  const clamp = THREE.MathUtils.clamp;
  const wrapAngle = angle => Math.atan2(Math.sin(angle),Math.cos(angle));
  const sample = d => route.getPoint(THREE.MathUtils.euclideanModulo(d,length)/length);
  function dress() {
    const templates = new Map();
    for (const c of cars) {
      c.rig = new THREE.Group(); root.add(c.rig);
      const kit = kits[c.kit];
      if (c.role === 'police') {
        const height = kit.height + .04;
        for (const side of [-1,1]) {
          const light = new THREE.Mesh(new THREE.BoxGeometry(.48,.11,.24),new THREE.MeshBasicMaterial({color:side<0?0xff1938:0x227aff}));
          light.position.set(side*.25,height,0); c.rig.add(light);
        }
      } else if (c.role !== 'principal') {
        // Fit the door graphic to the painted sheet metal, including its curvature.
        if (templates.has(c.kit)) { c.rig.add(templates.get(c.kit).clone()); continue; }
        const paint = kit.parts.filter(p => c.role === 'escort' ? p.bodyPanel || p.wrapGlass : p.paint).map(p => {
          const m = new THREE.Mesh(p.geo,p.mat); m.matrixWorld.copy(p.local); m.userData.wrapGlass = p.wrapGlass; return m;
        });
        const decals = new THREE.Group(); if (c.role === 'escort') fitEscaladeWrap(decals,kit,paint); else applyLivery(decals,kit,paint); c.rig.add(decals); templates.set(c.kit,decals);
      }
    }
  }
  function step(dt,wet = 0) {
    age += dt;
    for (const c of cars) {
      const kit = kits[c.kit], front = cars[c.index-1];
      const van = c.role === 'van', athletic = c.role === 'escort' || c.role === 'police';
      const tangent = d => { const a=sample(d-1), b=sample(d+1); return Math.atan2(b.x-a.x,b.y-a.y); };
      const heading = tangent(c.distance);
      const look = 7 + c.v * .75;
      const bend = Math.abs(wrapAngle(tangent(c.distance+look)-heading));
      let target = 20 + 4*Math.sin(age*.16) + 2*Math.sin(age*.29);
      if (front) {
        const gap = front.distance - c.distance;
        const bumperGap = gap - (kit.len+kits[front.kit].len)*.5;
        const desired = (kit.len+kits[front.kit].len)*.5 + 3 + c.v*(.46+.035*(c.index%4));
        target = Math.min(target+3, front.v + (gap-desired)*.55);
        const safeSpeed=Math.sqrt(front.v**2 + 8*Math.max(0,bumperGap-2));
        target=Math.min(target,safeSpeed);
      }
      const cornerSpeed = van ? 8.2 : athletic ? 11.8 : 9.4;
      target = Math.min(target, cornerSpeed + 15*Math.exp(-bend*4));
      const demand = clamp((target-c.v)*1.4,van?-4.9:-6.4,van?2.6:3.7);
      c.accel += (demand-c.accel)*(1-Math.exp(-dt*(2.4+.19*(c.index%4))));
      c.v = Math.max(0,c.v+c.accel*dt);
      if (front && dt > 0) {
        const available = front.distance-c.distance-(kit.len+kits[front.kit].len)*.5-1.7;
        c.v = Math.min(c.v, Math.max(0,available/dt));
      }
      c.distance += c.v*dt;
      const p=sample(c.distance), h=tangent(c.distance);
      const curvature=wrapAngle(tangent(c.distance+1.5)-tangent(c.distance-1.5))/3;
      const lateral=c.v*c.v*curvature;
      const slipTarget=athletic ? Math.sign(lateral)*clamp((Math.abs(lateral)-7)*.035,0,.26) : 0;
      c.slide+=(slipTarget-c.slide)*(1-Math.exp(-dt*5));
      const lateralOffset=.19*Math.sin(c.distance*.026+c.index*1.7)-c.slide*2;
      c.x=p.x+Math.cos(h)*lateralOffset; c.z=p.y-Math.sin(h)*lateralOffset; c.h=h;
      c.wheelAngle=clamp(Math.atan(kit.len*.61*curvature)-c.slide*.65,-.59,.59);
      c.lean=clamp(lateral*.005,-.055,.055);
      c.bodyPitch=-c.accel*.009; c.braking=c.accel<-.85;
      c.spin+=c.v*dt/.34; c.throttle=c.braking?0:clamp(.19+c.accel*.20,.04,.95);
      c.rig.position.set(c.x,0,c.z);c.rig.rotation.set(c.bodyPitch,h+c.slide,c.lean,'YXZ');
      const tyre=c.tyres;
      Object.assign(tyre,{speed:c.v,heading:h+c.slide,braking:c.braking,accel:c.accel,slip:Math.abs(c.v*Math.sin(c.slide))});
      rubber.update(tyre,false,wet,c.trail);
      if(c.role==='police') c.rig.children.forEach((lamp,i)=>lamp.material.color.setScalar(1).setHex(i?0x227aff:0xff1938).multiplyScalar((Math.floor(age*4+c.index)%2)===i?3:.22));
    }
  }
  function start() {
    if (!built) { dress(); rubber=createSkidMarks(root); built=true; }
    rubber.clear(); age=0;
    for(const c of cars) {
      const kit=kits[c.kit];
      Object.assign(c,{distance:344-c.index*10.8,v:7-.22*c.index,accel:0,slide:0,spin:0,trail:[]});
      c.tyres={pos:c,wid:kit.width,surfaceY:()=>0,tyreContacts:[-1,1].map(side=>({x:side*kit.width*.37,z:-kit.len*.31}))};
    }
    root.visible=true; step(0); return cars[6];
  }
  return {cars,root,step,get age(){return age;},start,stop(){root.visible=false;}};
}
