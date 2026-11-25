// The film follows one continuous circuit. Every vehicle samples the same distance-based path so the rear escorts take
// the same corner as the lead. With the frontier loaded it is a grand tour of the whole map: south past the harbour on
// the coast road, the Temple Road to the volcano, the lakeside forest, the Dune Highway, over the Alpine Pass to
// Fjordheim, down the Northern Link through Old Town and back through the city. The convoy follows the ground's height
// and slope. A Port Aurora Police Interceptor Utility leads and a GT500 pursuit car closes the column, their own LED
// heads flashing and throwing real red and blue light on everything around them.
import * as THREE from '/evermile/vendor/three.module.js';
import { fitEscaladeWrap } from './escalade-wrap.js';
import { createSkidMarks } from './skid-marks.js';
import { P, SPAN } from './city.js';
import { Q } from './render.js';
import { createEmergencyLights } from './emergency-lights.js';

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

// The tour route as a smooth curve in the right-hand lane, built from the road samples of each road in turn.
function grandTour(world) {
  const S = world?.samples, road = n => world?.roads.find(r => r.name === n);
  const legs = ['coast', 'temple', 'lakeside', 'dunes', 'alpine', 'north', 'old'].map(road);
  if (!S || legs.some(r => !r)) return null;
  const [coast, temple, lakeside, dunes, alpine, north, old] = legs, LANE = 2.8, pts = [];
  const nearest = (rd, x, z) => { let best = rd.from, bd = Infinity; for (let i = rd.from; i <= rd.to; i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; best = i; } } return best; };
  const run = (a, b) => { for (let i = a; i <= b; i += 4) { const s = S[i]; pts.push(new THREE.Vector2(s.x - s.lx * LANE, s.z - s.lz * LANE)); } };
  run(coast.from + 6, nearest(coast, S[temple.from].x, S[temple.from].z) - 5);
  for (const rd of [temple, lakeside, dunes, alpine, north]) run(rd.from + 5, rd.to - 5);
  run(nearest(old, S[north.to].x, S[north.to].z) + 5, old.to - 6);
  for (let z = SPAN - 6; z > 6; z -= 30) pts.push(new THREE.Vector2(2, z)); // south down the seafront avenue to the coast gate
  const curve = new THREE.SplineCurve(pts); curve.arcLengthDivisions = pts.length * 8;
  return curve;
}

export function createMotorcade(scene, kits, traffic, parked, world = null) {
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
  const tour = grandTour(world), path = tour || route, length = path.getLength(), root = new THREE.Group();
  const inCity = (x, z) => x > -18 && x < SPAN + 18 && z > -18 && z < SPAN + 18;
  const groundY = (x, z) => !world || inCity(x, z) ? 0 : world.ground(x, z);
  // Height along the route, sampled every 2 m when the convoy first runs.
  let heights = null; const STEP_H = 2;
  const heightAt = d => { if (!tour) return 0; if (!heights) { const n = Math.ceil(length / STEP_H) + 1; heights = new Float32Array(n); for (let k = 0; k < n; k++) { const p = tour.getPointAt(Math.min(1, k * STEP_H / length)); heights[k] = groundY(p.x, p.y); } }
    const f = THREE.MathUtils.euclideanModulo(d, length) / STEP_H, i = Math.floor(f), j = Math.min(heights.length - 1, i + 1); return heights[i] + (heights[j] - heights[i]) * (f - i); };
  // Red and blue light from the two police cars' light bars, lighting the road, the cars and the buildings. The lights stay
  // in the scene at zero intensity when the convoy is away so no material ever has to recompile.
  const perBar = Q.reach >= 1 ? 2 : Q.reach >= 0.7 ? 1 : 0;
  const barLights = Array.from({ length: 2 * perBar }, (v, k) => { const l = new THREE.PointLight(k % 2 ? 0x2f6bff : 0xff2030, 0, 26, 2); scene.add(l); return l; });
  scene.add(root); root.visible = false;
  const cars = roles.map((role,i) => {
    // the Interceptor Utility leads, the GT500 brings up the rear; both wear the Port Aurora Police livery in the model
    const style = role === 'van' ? 'vip-van' : role === 'police' ? (i === 0 ? 'police-interceptor' : 'police-gt500') : 'escalade';
    return { role, kit:kits.findIndex(k => k.style === style), tint: role === 'principal' ? 0x101115 : role === 'police' ? 0x0c0d10 : 0xfafaf6,
      push:new THREE.Vector2(), x:0,z:0,h:0,slide:0,spin:0,v:0, index:i };
  });
  let age = 0, built = false, rubber;
  const clamp = THREE.MathUtils.clamp;
  const wrapAngle = angle => Math.atan2(Math.sin(angle),Math.cos(angle));
  const sample = tour ? d => tour.getPointAt(THREE.MathUtils.euclideanModulo(d,length)/length) : d => route.getPoint(THREE.MathUtils.euclideanModulo(d,length)/length);
  function dress() {
    const templates = new Map();
    for (const c of cars) {
      c.rig = new THREE.Group(); root.add(c.rig);
      const kit = kits[c.kit];
      if (c.role === 'police') {
        // the car's own LED heads, lit in a real flash pattern
        c.lights = createEmergencyLights(kit.emergency, kit.height, c.index); c.rig.add(c.lights.group);
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
      h:c.h+(c.slide || 0),width:kit.width,len:kit.len,y:c.y || 0};
  }
  const stationary=parked.map(footprint);
  let playerBody;
  function obstacles() {
    return stationary.concat(traffic.map(footprint),playerBody || []);
  }
  function blocksTraffic(c) {
    const box=footprint(c);
    return cars.some(v=>Math.abs((c.y || 0)-(v.y || 0))<3 && occupied(box,footprint(v)));
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
        const desired = (kit.len+kits[front.kit].len)*.5 + 2.3 + c.v*(.18+.014*(c.index%4));
        target = Math.min(target+3, front.v + (gap-desired)*.85);
        const safeSpeed=Math.sqrt(front.v**2 + 8*Math.max(0,bumperGap-2));
        target=Math.min(target,safeSpeed);
      }
      // Pace the vehicle ahead as well as the follower. A slower van or a
      // blocked rear escort can then bring the group back together naturally.
      const rear=cars[c.index+1];
      let roomToPullAway=Infinity;
      if(rear) {
        const clearGap=c.distance-rear.distance-(kit.len+kits[rear.kit].len)*.5;
        roomToPullAway=Math.max(0,9-clearGap);
        target=Math.min(target,rear.v+Math.max(0,7-clearGap)*1.15);
      }
      const box=footprint(c);
      const near=obstaclesNow.filter(o=>Math.abs(o.x-c.x)+Math.abs(o.z-c.z)<45 && Math.abs((o.y || 0)-(c.y || 0))<3);
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
      if(rear && dt>0) c.v=Math.min(c.v,roomToPullAway/dt);
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
      c.y = heightAt(c.distance); c.pitch = Math.atan2(heightAt(c.distance + kit.len * .5) - heightAt(c.distance - kit.len * .5), kit.len);
      c.rig.position.set(c.x,c.y,c.z);c.rig.rotation.set(c.bodyPitch-c.pitch,c.h+c.slide,c.lean,'YXZ');
      const tyre=c.tyres;
      Object.assign(tyre,{speed:c.v,heading:h+c.slide,braking:c.braking,accel:c.accel,slip:Math.abs(c.v*Math.sin(c.slide))});
      rubber.update(tyre,false,wet,c.trail);
      if(c.role==='police' && c.lights) { const [left, right] = c.lights.update(age, api.night || 0), bar = cars.filter(v => v.role === 'police').indexOf(c);
        for (let k = 0; k < perBar; k++) { const l = barLights[bar * perBar + k], side = perBar === 2 ? (k ? 1 : -1) : (right > left ? 1 : -1), on = perBar === 2 ? (k ? right : left) : Math.max(left, right);
          if (!l) continue; l.color.setHex(side > 0 ? 0xff2030 : 0x2f6bff); l.intensity = on * (14 + 46 * (api.night || 0));
          l.position.set(c.x + Math.cos(c.h) * side * .55, c.y + kit.height + .35, c.z - Math.sin(c.h) * side * .55); } }
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
        const d=startDistance-c.index*8.5,p=sample(d),q=sample(d+1),kit=kits[c.kit];
        const box={x:p.x,z:p.y,h:Math.atan2(q.x-p.x,q.y-p.y),len:kit.len+1,width:kit.width+1};
        return !taken.some(o=>occupied(box,o));
      })) { clear=true; break; }
    }
    if (!clear) return null;
    for(const c of cars) {
      const kit=kits[c.kit];
      Object.assign(c,{distance:startDistance-c.index*8.5,v:7-.22*c.index,accel:0,slide:0,wheelAngle:0,spin:0,trail:[]});
      c.tyres={pos:c,wid:kit.width,surfaceY:(x,z)=>groundY(x,z),tyreContacts:[-1,1].map(side=>({x:side*kit.width*.37,z:-kit.len*.31}))};
    }
    root.visible=true; step(0); return cars[3];
  }
  const api = {cars,root,step,blocksTraffic,get age(){return age;},start,stop(){root.visible=false; for (const l of barLights) l.intensity = 0;},night:0,tour:!!tour,length,sample,heightAt,
    // distance along the route of a convoy car, and a point a given distance ahead of it
    ahead(c, metres) { const p = sample(c.distance + metres), q = sample(c.distance + metres + 1); return { x: p.x, z: p.y, y: heightAt(c.distance + metres), h: Math.atan2(q.x - p.x, q.y - p.y) }; }};
  return api;
}
