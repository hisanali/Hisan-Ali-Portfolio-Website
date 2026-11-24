// The film follows one continuous city circuit. Every vehicle samples the same
// distance-based path so the rear escorts take the same corner as the lead.
import * as THREE from '/evermile/vendor/three.module.js';
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
  let distance = 175, speed = 5, age = 0, built = false;
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
        const paint = kit.parts.filter(p => p.paint).map(p => {
          const m = new THREE.Mesh(p.geo,p.mat); m.matrixWorld.copy(p.local); return m;
        });
        const decals = new THREE.Group(); applyLivery(decals,kit,paint); c.rig.add(decals); templates.set(c.kit,decals);
      }
    }
  }
  function step(dt) {
    age += dt;
    const cornerAhead = cars.some((_,i) => {
      const d=distance-i*9, a=sample(d), b=sample(d+10), e=sample(d+20);
      return b.clone().sub(a).normalize().dot(e.sub(b).normalize()) < .93;
    });
    const target=cornerAhead?9:18+7*Math.sin(age*.14);
    const accel=THREE.MathUtils.clamp(target-speed,-4,3);
    speed+=accel*dt; distance+=speed*dt;
    for(const c of cars){
      const d=distance-c.index*9,p=sample(d),q=sample(d+1);
      c.x=p.x;c.z=p.y;c.h=Math.atan2(q.x-p.x,q.y-p.y);c.v=speed;c.spin+=speed*dt/.34;
      c.throttle=accel<-.2?0:.25+Math.max(accel,0)*.19;c.braking=accel<-.5;c.bodyPitch=-accel*.008;
      c.rig.position.set(c.x,0,c.z);c.rig.rotation.set(c.bodyPitch,c.h,0,'YXZ');
      if(c.role==='police') c.rig.children.forEach((lamp,i)=>lamp.material.color.setScalar(1).setHex(i?0x227aff:0xff1938).multiplyScalar((Math.floor(age*4+c.index)%2)===i?3:.22));
    }
  }
  return {cars,root,step,get age(){return age;},start(){if(!built){dress();built=true;}distance=175;speed=5;age=0;root.visible=true;step(0);return cars[6];},stop(){root.visible=false;}};
}
