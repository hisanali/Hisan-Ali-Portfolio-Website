import * as T from '../evermile/vendor/three.module.js';
import { mergeGeometries } from '../evermile/vendor/utils/BufferGeometryUtils.js';

// Original compact stadium. Rounded rectangular tiers keep corner seats off the
// field; a ribbed tensile canopy follows the same footprint. No Sketchfab mesh.
export function buildStadium(scene, atlas, materials = {}) {
  const firstObject=scene.children.length;
  const centre = 35, rows = 28, columns = 400;
  const clock = {value: 0}, cheer = {value: 0};
  const concrete = new T.MeshStandardMaterial({color: '#89918d', map: materials.concrete, normalMap: materials.normal, normalScale: new T.Vector2(.16,.16), roughness: .94, side: T.DoubleSide});
  const steel = new T.MeshStandardMaterial({color: '#a5b3b8', metalness: .65, roughness: .43});
  const membrane = new T.MeshStandardMaterial({color: '#deddd2', roughness: .8, side: T.DoubleSide});
  const dark = new T.MeshStandardMaterial({color: '#172732', roughness: .76});
  const light = new T.MeshBasicMaterial({color: '#f0f6ff', toneMapped: false});
  const groups = new Map([[concrete,[]],[steel,[]],[membrane,[]],[dark,[]],[light,[]]]);
  const dummy = new T.Object3D();
  const rnd = n => {const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const shape = (a,rx,rz,y) => new T.Vector3(Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.65*rx,y,centre+Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.65*rz);
  function add(geo,mat,position,rotation) {
    dummy.position.copy(position);dummy.rotation.set(0,0,0);if(rotation)dummy.rotation.copy(rotation);dummy.scale.set(1,1,1);dummy.updateMatrix();
    const baked=(geo.index?geo.toNonIndexed():geo.clone()).applyMatrix4(dummy.matrix);groups.get(mat).push(baked);geo.dispose();
  }
  function beam(a,b,r=.055) {
    const delta=b.clone().sub(a),g=new T.CylinderGeometry(r,r,delta.length(),5);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));add(g,steel,a.clone().add(b).multiplyScalar(.5));
  }
  function ribbon(rx,rz,y,rx2,rz2,y2,mat,segments=192) {
    const pos=[],uv=[];
    for(let i=0;i<segments;i++) {
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      for(const [angle,x,z,h] of [[a,rx,rz,y],[b,rx,rz,y],[a,rx2,rz2,y2],[b,rx,rz,y],[b,rx2,rz2,y2],[a,rx2,rz2,y2]]) {pos.push(...shape(angle,x,z,h).toArray());uv.push(angle/Math.PI/2,h*.2);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();groups.get(mat).push(g);
  }
  const capacity=rows*columns, variants=new Float32Array(capacity);
  const fanGeo=new T.PlaneGeometry(.88,1.42);fanGeo.translate(0,.86,0);fanGeo.setAttribute('variant',new T.InstancedBufferAttribute(variants,1));
  const fanMat=new T.MeshBasicMaterial({map:atlas,color:'#a8b0b7',alphaTest:.5,side:T.DoubleSide});
  fanMat.onBeforeCompile=s=>{
    Object.assign(s.uniforms,{crowdTime:clock,cheer});
    s.vertexShader='attribute float variant; varying float vVariant; uniform float crowdTime; uniform float cheer;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vVariant=variant;float seed=instanceMatrix[3].x*3.3+instanceMatrix[3].z*5.7;
      transformed.x+=sin(crowdTime*1.3+seed)*.015;
      transformed.y+=.008*sin(crowdTime*1.6+seed)+cheer*.15*max(0.,sin(crowdTime*4.5+seed));`);
    s.fragmentShader='varying float vVariant;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec2 tile=vec2(mod(vVariant,8.),3.-floor(vVariant/8.));
      vec4 texel=texture2D(map,(vMapUv+tile)/vec2(8.,4.));float l=dot(texel.rgb,vec3(.2126,.7152,.0722));texel.rgb=mix(vec3(l),texel.rgb,.48);diffuseColor*=texel;`);
  };
  const fans=new T.InstancedMesh(fanGeo,fanMat,capacity);
  const seatMat=new T.MeshStandardMaterial({roughness:.7});
  const seats=new T.InstancedMesh(new T.BoxGeometry(.48,.09,.43),seatMat,capacity);
  const backs=new T.InstancedMesh(new T.BoxGeometry(.48,.4,.07),seatMat,capacity);
  let count=0,fanCount=0;
  const seatColor=new T.Color(),fanColor=new T.Color();
  for(let row=0;row<rows;row++) {
    const upper=row>=12,concourse=upper?2:0,rx=31+row*.7,rz=44+row*.7,y=.55+row*.54+concourse;
    ribbon(rx-.36,rz-.36,y-.15,rx+.36,rz+.36,y-.15,concrete);
    ribbon(rx+.36,rz+.36,y-.15,rx+.36,rz+.36,y+.39,concrete);
    for(let col=0;col<columns;col++) {
      // Radial stair aisles; a few empty seats preserve depth among the crowd.
      if(col%50<3)continue;
      const n=row*columns+col,a=(col+.5*(row%2))/columns*Math.PI*2,p=shape(a,rx,rz,y),rot=Math.atan2(-p.x,centre-p.z);
      dummy.position.copy(p);dummy.position.y+=.34;dummy.rotation.set(0,rot,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
      seats.setMatrixAt(count,dummy.matrix);seatColor.set((col%100>76&&row>15)?'#73818a':['#183b4d','#214552','#243f54'][Math.floor(col/50)%3]);seats.setColorAt(count,seatColor);
      dummy.position.add(new T.Vector3(-Math.sin(rot)*.18,.22,-Math.cos(rot)*.18));dummy.updateMatrix();backs.setMatrixAt(count,dummy.matrix);backs.setColorAt(count++,seatColor);
      if(rnd(n+10)<.1)continue;
      dummy.position.copy(p);dummy.rotation.y=rot+(rnd(n+1)-.5)*.18;dummy.scale.setScalar(.88+rnd(n+2)*.17);dummy.updateMatrix();fans.setMatrixAt(fanCount,dummy.matrix);
      variants[fanCount]=Math.floor(rnd(n+3)*32);fanColor.setRGB(.65+rnd(n+4)*.35,.65+rnd(n+4)*.35,.65+rnd(n+4)*.35);fans.setColorAt(fanCount++,fanColor);
    }
    if(row===11||row===27) {
      ribbon(rx+.4,rz+.4,y+.4,rx+.4,rz+.4,y+1.2,steel);
      for(let c=0;c<80;c++){const a=c/80*Math.PI*2;beam(shape(a,rx+.5,rz+.5,y+.4),shape(a,rx+.5,rz+.5,y+1.25),.025);}
    }
  }
  seats.count=backs.count=count;fans.count=fanCount;fans.layers.set(2);
  for(const m of [seats,backs,fans]){m.computeBoundingSphere();scene.add(m);}
  ribbon(30.4,43.4,.05,30.4,43.4,1,dark);
  ribbon(39.4,52.4,7.1,39.4,52.4,8.6,dark);
  ribbon(51,64,0,51,64,19,concrete);
  // Canopy arches up between the compression ring and pitch-side tension ring.
  function roof(a,t) {
    const y=19.8+Math.sin(t*Math.PI)*5+Math.cos(a*2)*1.25+t*1.5;
    return shape(a,27+26*t,40+26*t,y);
  }
  const positions=[],uv=[];
  for(let i=0;i<192;i++)for(let j=0;j<10;j++) {
    for(const [u,v]of [[i,j],[i+1,j],[i,j+1],[i+1,j],[i+1,j+1],[i,j+1]]) {positions.push(...roof(u/192*Math.PI*2,v/10).toArray());uv.push(u/192,v/10);}
  }
  const shell=new T.BufferGeometry();shell.setAttribute('position',new T.Float32BufferAttribute(positions,3));shell.setAttribute('uv',new T.Float32BufferAttribute(uv,2));shell.computeVertexNormals();groups.get(membrane).push(shell);
  for(let i=0;i<64;i++) {
    const a=i/64*Math.PI*2;
    for(let j=0;j<8;j++) {const p=roof(a,j/8).add(new T.Vector3(0,-.16,0)),q=roof(a,(j+1)/8).add(new T.Vector3(0,-.16,0));beam(p,q,i%4===0?.1:.045);if(i%4===0)beam(p,q.clone().add(new T.Vector3(0,-.7,0)),.035);}
    if(i%2===0){beam(shape(a,51,64,0),roof(a,1),.13);const lamp=roof(a,0);lamp.y-=.55;add(new T.BoxGeometry(2.4,.15,.45),light,lamp,new T.Euler(0,a,0));}
    for(const t of [0,.5,1])beam(roof(a,t).add(new T.Vector3(0,-.18,0)),roof((i+1)/64*Math.PI*2,t).add(new T.Vector3(0,-.18,0)),.07);
  }
  // Player tunnels and transparent curved dugouts, placed outside the boards.
  for(const z of [22,48]) {
    add(new T.BoxGeometry(2.6,2.5,4.2),dark,new T.Vector3(-30.8,1.25,z));
    const shelter=new T.Mesh(new T.CylinderGeometry(1.4,1.4,6,16,1,true,0,Math.PI),new T.MeshPhysicalMaterial({color:'#9fb4bb',transparent:true,opacity:.3,roughness:.2,metalness:.1,side:T.DoubleSide,depthWrite:false}));
    shelter.rotation.z=Math.PI/2;shelter.rotation.y=Math.PI/2;shelter.position.set(-27.8,1.1,z);scene.add(shelter);
    for(let i=0;i<7;i++)add(new T.BoxGeometry(.55,.45,.5),dark,new T.Vector3(-27.8,.45,z-2.5+i*.8));
  }
  for(const [mat,parts] of groups)if(parts.length){const mesh=new T.Mesh(mergeGeometries(parts,false),mat);mesh.receiveShadow=true;mesh.castShadow=mat===membrane||mat===steel;scene.add(mesh);parts.forEach(g=>g.dispose());}
  const display=document.createElement('canvas');display.width=1024;display.height=384;const g=display.getContext('2d'),map=new T.CanvasTexture(display);map.colorSpace=T.SRGBColorSpace;
  for(const dir of [-1,1]){const screen=new T.Mesh(new T.PlaneGeometry(9,3.375),new T.MeshBasicMaterial({map,toneMapped:false}));screen.position.set(0,18.6,centre+dir*59);screen.rotation.y=dir<0?0:Math.PI;scene.add(screen);}
  let score=[0,0,1],screenFrame=-1;
  function updateScore(home,away,half){score=[home,away,half];screenFrame=-1;}
  function drawScreen(time,match={}){
    const frame=Math.floor(time*8);if(frame===screenFrame)return;screenFrame=frame;
    const teams=match.teams||[],home=teams[0],away=teams[1],goal=match.state==='goal';
    g.fillStyle='#071925';g.fillRect(0,0,1024,384);g.textAlign='left';g.textBaseline='middle';
    g.fillStyle=goal?'#d4ff59':'#56dfdb';g.fillRect(26,30,10,30);g.font='700 26px Arial';g.fillText(goal?'GOAL!  THE STADIUM ERUPTS':'MATCH LIVE',52,46);g.textAlign='right';g.fillText(`${String(match.minutes||0).padStart(2,'0')}′  •  HALF ${match.half||score[2]}`,980,46);
    g.textAlign='center';g.fillStyle='#fff';g.font='800 128px Arial';g.fillText(`${home?.score??score[0]}  :  ${away?.score??score[1]}`,335,175);g.font='700 27px Arial';g.fillText(home?.name||'HOME',177,280,290);g.fillText(away?.name||'AWAY',491,280,290);
    g.fillStyle='#163c34';g.fillRect(688,87,300,216);g.strokeStyle='#9cccc0';g.lineWidth=2;g.strokeRect(697,96,282,198);g.beginPath();g.moveTo(838,96);g.lineTo(838,294);g.stroke();g.beginPath();g.arc(838,195,30,0,Math.PI*2);g.stroke();
    for(const team of teams)for(const p of team.players||[]){if(p.sentOff)continue;g.fillStyle=team.human?'#ff697b':'#eaf5ff';g.beginPath();g.arc(697+p.pos.z/70*282,294-(p.pos.x+23)/46*198,5,0,Math.PI*2);g.fill();}
    if(match.ball){g.fillStyle='#f5ed73';g.beginPath();g.arc(697+match.ball.z/70*282,294-(match.ball.x+23)/46*198,4,0,Math.PI*2);g.fill();}
    g.fillStyle='#65e4e1';g.fillRect((time*75)%1024,334,130,3);g.font='600 22px Arial';g.textAlign='center';g.fillStyle='#bfdae5';
    const stats=Math.floor(time/6)%2===0;g.fillText(stats?`SHOTS  ${home?.matchStats?.shots||0} — ${away?.matchStats?.shots||0}     •     PASSES  ${home?.matchStats?.completed||0} — ${away?.matchStats?.completed||0}`:'LIVE MATCH TRACKER  •  EVERY PASS. EVERY GOAL.',512,363);map.needsUpdate=true;
  }
  drawScreen(0);
  // Cut the foreground stands and overhead canopy from gameplay cameras only.
  // Clipping does not apply to shadow maps, so the roof still shades the pitch.
  const xCut=new T.Plane(new T.Vector3(1,0,0),24.8),zCut=new T.Plane(new T.Vector3(0,0,1),3),roofCut=new T.Plane(new T.Vector3(0,-1,0),18);
  const stadiumObjects=scene.children.slice(firstObject),stadiumMaterials=new Set();for(const object of stadiumObjects){object.userData.stadium=true;object.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])stadiumMaterials.add(m);});}
  let mask='';
  return {updateScore,setCameraClearance(active,camera){
    const x=active&&Math.abs(camera.position.x)>23,z=active&&(camera.position.z<0||camera.position.z>70),key=`${active}/${x}/${z}`;
    xCut.normal.set(camera.position.x<0?1:-1,0,0);xCut.constant=24.8;
    zCut.normal.set(0,0,camera.position.z<35?1:-1);zCut.constant=camera.position.z<35?3:73;
    if(mask!==key){mask=key;const planes=active?[roofCut,...(x?[xCut]:[]),...(z?[zCut]:[])]:[];for(const material of stadiumMaterials){material.clippingPlanes=planes;material.clipShadows=false;material.needsUpdate=true;}}
  },update(time,goal,dt,match){clock.value=time;cheer.value=T.MathUtils.damp(cheer.value,goal?1:0,3,dt);drawScreen(time,match);}};
}
