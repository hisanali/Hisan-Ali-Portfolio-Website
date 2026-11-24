// The film follows one continuous city circuit. Every vehicle samples the same
// distance-based path so the rear escorts take the same corner as the lead.
import * as THREE from '/evermile/vendor/three.module.js';
import { fitEscaladeWrap } from './escalade-wrap.js';
import { createSkidMarks } from './skid-marks.js';
import { P } from './city.js';

// Separating axes for two oriented vehicle footprints, including a small clearance margin.
function occupied(a,b) {
  const dx=b.x-a.x, dz=b.z-a.z;
  if(Math.abs(dx)+Math.abs(dz)>a.len+b.len+a.width+b.width) return false;
  const sin=Math.abs(Math.sin(a.h-b.h)), cos=Math.abs(Math.cos(a.h-b.h));
  for(const [p,q] of [[a,b],[b,a]]) {
    const x=Math.cos(p.h), z=Math.sin(p.h);
    if(Math.abs(dx*x-dz*z)>(p.width+q.width*cos+q.len*sin)*.5+.18 ||
       Math.abs(dx*z+dz*x)>(p.len+q.len*cos+q.width*sin)*.5+.18) return false;
  }
  return true;
}

export function createMotorcade(scene, kits, traffic, parked) {
  const roles = ['police','van','escort','principal','escort','escort','van','police'];
  const points = [[3*P-2,2*P-2],[3*P-2,6*P+2],[6*P+2,6*P+2],[6*P+2,2*P-2]].map(([x,z]) => new THREE.Vector2(x,z));
  const route = new THREE.CurvePath();
  const corners = points.map((p,i) => {
    const offset = j => points[j].clone().sub(p).normalize().multiplyScalar(15).add(p);
    return [offset((i+3)%4),p,offset((i+1)%4)];
  });
  corners.forEach(([entry,corner,exit],i) => {
    // Coincident controls give zero curvature where each bend meets the straight.
    route.add(new THREE.CubicBezierCurve(entry,corner,corner,exit));
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
        const paint = kit.parts.filter(p => c.role === 'escort' ? p.bodyPanel || p.wrapGlass : p.paint || p.wrapGlass).map(p => {
          const m = new THREE.Mesh(p.geo,p.mat); m.matrixWorld.copy(p.local); m.userData.wrapGlass = p.wrapGlass; return m;
        });
        const decals = new THREE.Group(); fitEscaladeWrap(decals,kit,paint,c.role === 'van' ? 'vip-van-wrap' : 'escalade-wrap'); c.rig.add(decals); templates.set(c.kit,decals);
      }
    }
  }
  function footprint(c) {
    const kit=kits[c.kit], shift=c.shoulder || 0;
    return {x:c.x-Math.cos(c.h)*shift+(c.push?.x || 0), z:c.z+Math.sin(c.h)*shift+(c.push?.y || 0),
      h:c.h+(c.slide || 0),width:kit.width,len:kit.len};
  }
  const stationary=parked.map(footprint);
  let playerBody;
  function obstacles() {
    return stationary.concat(traffic.filter(c=>Math.abs(c.y || 0)<2.5).map(footprint),playerBody || []);
  }
  function blocksTraffic(c) {
    const box=footprint(c);
    return Math.abs(c.y || 0)<2.5 && cars.some(v=>occupied(box,footprint(v)));
  }
  function step(dt,wet = 0) {
    age += dt;
    const obstaclesNow=obstacles();
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
      const box=footprint(c);
      const near=obstaclesNow.filter(o=>Math.abs(o.x-c.x)+Math.abs(o.z-c.z)<45);
      if(dt>0 && near.length) {
        const nose={...box};
        for(let ahead=1; ahead<=Math.min(26,3+c.v*c.v/9); ahead+=1.5) {
          const point=sample(c.distance+ahead);
          Object.assign(nose,{x:point.x,z:point.y,h:tangent(c.distance+ahead)});
          if(near.some(o=>occupied(nose,o))) {target=Math.min(target,Math.sqrt(8*Math.max(0,ahead-2)));break;}
        }
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
      const priorDistance=c.distance, priorSlide=c.slide;
      c.distance += c.v*dt;
      const p=sample(c.distance), h=tangent(c.distance);
      const curvature=wrapAngle(tangent(c.distance+1.5)-tangent(c.distance-1.5))/3;
      const lateral=c.v*c.v*curvature;
      const grip=(athletic ? 7.4 : van ? 6.2 : 7.0)*(1-.25*clamp(wet,0,1));
      const overload=Math.max(0,Math.abs(lateral)-grip);
      const slipTarget=Math.sign(lateral)*Math.min(athletic ? .34 : .23,overload*.036);
      const response=Math.abs(slipTarget)>Math.abs(c.slide) ? 4.2 : 2.8;
      c.slide+=(slipTarget-c.slide)*(1-Math.exp(-dt*response));
      // The front axle tracks the bend while the rear swings to its outside.
      const lateralOffset=.19*Math.sin(c.distance*.026+c.index*1.7)-Math.sin(c.slide)*kit.len*.31;
      const next={...box,x:p.x+Math.cos(h)*lateralOffset,z:p.y-Math.sin(h)*lateralOffset,h:h+c.slide};
      const blocked=dt>0 && (near.some(o=>occupied(next,o)) || (front && occupied(next,footprint(front))));
      if(blocked) {c.distance=priorDistance;c.slide=priorSlide;c.accel=-5;c.v=0;}
      else {c.x=next.x;c.z=next.z;c.h=h;}
      const desiredSteer=clamp(Math.atan(kit.len*.61*curvature)-c.slide*.82,-.59,.59);
      c.wheelAngle+=clamp(desiredSteer-c.wheelAngle,-1.35*dt,1.35*dt);
      c.lean=clamp(lateral*.005,-.055,.055);
      c.bodyPitch=-c.accel*.009; c.braking=c.accel<-.85;
      c.spin+=c.v*dt/.34; c.throttle=c.braking?0:clamp(.19+c.accel*.20,.04,.95);
      c.rig.position.set(c.x,0,c.z);c.rig.rotation.set(c.bodyPitch,c.h+c.slide,c.lean,'YXZ');
      const tyre=c.tyres;
      Object.assign(tyre,{speed:c.v,heading:h+c.slide,braking:c.braking,accel:c.accel,slip:Math.abs(c.v*Math.sin(c.slide))});
      rubber.update(tyre,false,wet,c.trail);
      if(c.role==='police') c.rig.children.forEach((lamp,i)=>lamp.material.color.setScalar(1).setHex(i?0x227aff:0xff1938).multiplyScalar((Math.floor(age*4+c.index)%2)===i?3:.22));
    }
  }
  function start(player) {
    if (!built) { dress(); rubber=createSkidMarks(root); built=true; }
    rubber.clear(); age=0;
    playerBody=player ? {x:player.pos.x,z:player.pos.z,h:player.heading,width:player.wid,len:player.len} : null;
    const taken=obstacles();
    let startDistance=344, clear=false;
    for(let n=0;n<Math.ceil(length/3);n++,startDistance+=3) {
      if(cars.every(c=>{
        const d=startDistance-c.index*10.8,p=sample(d),q=sample(d+1),kit=kits[c.kit];
        const box={x:p.x,z:p.y,h:Math.atan2(q.x-p.x,q.y-p.y),len:kit.len+1,width:kit.width+1};
        return !taken.some(o=>occupied(box,o));
      })) { clear=true; break; }
    }
    if (!clear) return null;
    for(const c of cars) {
      const kit=kits[c.kit];
      Object.assign(c,{distance:startDistance-c.index*10.8,v:7-.22*c.index,accel:0,slide:0,wheelAngle:0,spin:0,trail:[]});
      c.tyres={pos:c,wid:kit.width,surfaceY:()=>0,tyreContacts:[-1,1].map(side=>({x:side*kit.width*.37,z:-kit.len*.31}))};
    }
    root.visible=true; step(0); return cars[3];
  }
  return {cars,root,step,blocksTraffic,get age(){return age;},start,stop(){root.visible=false;}};
}
