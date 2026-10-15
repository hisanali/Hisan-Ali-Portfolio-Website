import * as T from '../evermile/vendor/three.module.js';
import { mergeGeometries } from '../evermile/vendor/utils/BufferGeometryUtils.js';

// A closed elliptical bowl: the seats, spectators, concourses and roof share
// the same parametric footprint, so there are no open corners or floating rows.
export function buildStadium(scene, atlas,materials={}) {
  const centreZ=35, rows=25, columns=440, crowdTime={value:0}, cheer={value:0};
  const concrete=new T.MeshStandardMaterial({color:'#929795',map:materials.concrete,normalMap:materials.normal,normalScale:new T.Vector2(.2,.2),roughness:.92,side:T.DoubleSide});
  const roofMat=new T.MeshStandardMaterial({color:'#b8bec0',metalness:.55,roughness:.52,side:T.DoubleSide});
  const steel=new T.MeshStandardMaterial({color:'#8795a1',metalness:.72,roughness:.38});
  const structureParts=[],concreteParts=[],roofParts=[],lampParts=[];
  const bankMat=new T.MeshBasicMaterial({color:new T.Color('#e9f2ff').multiplyScalar(3),toneMapped:false});
  const seatMat=new T.MeshStandardMaterial({roughness:.58,metalness:.04});
  function ring(rx,rz,y,rx2,rz2,y2,material,segments=160){
    const p=[],uv=[];for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      for(const [t,x,z,h] of [[a,rx,rz,y],[b,rx,rz,y],[a,rx2,rz2,y2],[b,rx,rz,y],[b,rx2,rz2,y2],[a,rx2,rz2,y2]]){
        p.push(Math.sin(t)*x,h,centreZ+Math.cos(t)*z);uv.push(t/(Math.PI*2),h);
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,material);mesh.receiveShadow=true;
    if(material===concrete)concreteParts.push(geo);else if(material===steel)structureParts.push(geo);else if(material===roofMat)roofParts.push(geo);else scene.add(mesh);return mesh;
  }
  function beam(a,b,r=.07){const d=new T.Vector3().subVectors(b,a),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),6),steel);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.updateMatrix();structureParts.push(m.geometry.toNonIndexed().applyMatrix4(m.matrix));}
  const fanMat=new T.MeshBasicMaterial({map:atlas,color:'#aeb4b6',alphaTest:.45,side:T.DoubleSide});
  fanMat.onBeforeCompile=shader=>{
    shader.uniforms.crowdTime=crowdTime;shader.uniforms.cheer=cheer;
    shader.vertexShader='attribute float variant; varying float vVariant; uniform float crowdTime; uniform float cheer;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vVariant=variant;
      float seed=instanceMatrix[3].x*3.3+instanceMatrix[3].z*5.7;
      transformed.y+=.012*sin(crowdTime*1.6+seed)+cheer*.18*abs(sin(crowdTime*5.5+seed));`);
    shader.fragmentShader='varying float vVariant;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec2 tile=vec2(mod(vVariant,8.0),3.0-floor(vVariant/8.0));
      vec4 sampledDiffuseColor=texture2D(map,(vMapUv+tile)/vec2(8.0,4.0));
      diffuseColor*=sampledDiffuseColor;`);
  };
  const capacity=rows*columns, fanGeo=new T.PlaneGeometry(.76,1.32);
  fanGeo.translate(0,.94,0);const variants=new Float32Array(capacity);
  const fans=new T.InstancedMesh(fanGeo,fanMat,capacity);
  fanGeo.setAttribute('variant',new T.InstancedBufferAttribute(variants,1));
  const seats=new T.InstancedMesh(new T.BoxGeometry(.49,.1,.46),seatMat,capacity);
  const backs=new T.InstancedMesh(new T.BoxGeometry(.49,.46,.08),seatMat,capacity);
  const dummy=new T.Object3D(),colors=['#172b48','#223d60','#75263a','#243954'];let count=0;
  for(let row=0;row<rows;row++){
    const concourse=(row>=10?1.4:0)+(row>=19?1.4:0),rx=43+row*.73,rz=57+row*.73,y=.65+row*.49+concourse;
    ring(rx-.42,rz-.42,y-.14,rx+.42,rz+.42,y-.14,concrete);
    ring(rx+.42,rz+.42,y-.14,rx+.42,rz+.42,y+.35,concrete);
    for(let col=0;col<columns;col++){
      if(col%55<4||Math.random()<.035)continue;const a=(col+(row%2)*.5)/columns*Math.PI*2;
      const x=Math.sin(a)*rx,z=centreZ+Math.cos(a)*rz,rot=Math.atan2(-x,centreZ-z);
      dummy.position.set(x,y,z);dummy.rotation.set(0,rot,0);dummy.scale.setScalar(.91+Math.random()*.11);dummy.updateMatrix();fans.setMatrixAt(count,dummy.matrix);variants[count]=Math.floor(Math.random()*32);
      dummy.position.y=y+.36;dummy.scale.set(1,1,1);dummy.updateMatrix();seats.setMatrixAt(count,dummy.matrix);seats.setColorAt(count,new T.Color(colors[Math.floor(col/55)%4]));
      dummy.position.add(new T.Vector3(-Math.sin(rot)*.2,.2,-Math.cos(rot)*.2));dummy.updateMatrix();backs.setMatrixAt(count,dummy.matrix);backs.setColorAt(count,new T.Color(colors[Math.floor(col/55)%4]));count++;
    }
    if(row===10||row===19){ring(rx-.5,rz-.5,y-.5,rx-.5,rz-.5,y-.1,steel);}
  }
  fans.layers.set(2);
  for(const mesh of [fans,seats,backs]){mesh.count=count;mesh.frustumCulled=false;scene.add(mesh);}
  const glass=new T.MeshPhysicalMaterial({color:'#294858',metalness:.2,roughness:.22,transparent:true,opacity:.72});
  ring(52,66,10.9,52,66,12.5,glass);
  for(let i=0;i<88;i++){const a=i/88*Math.PI*2;beam(new T.Vector3(Math.sin(a)*52,10.8,centreZ+Math.cos(a)*66),new T.Vector3(Math.sin(a)*52,12.7,centreZ+Math.cos(a)*66),.035);}
  ring(65,79,0,65,79,23,concrete);
  // Roof skin, structural ring beams, radial cantilevers and outer columns.
  ring(40,54,18.4,65,79,23,roofMat);
  ring(40,54,18.05,40,54,18.5,steel);
  ring(65,79,21.5,65,79,23.1,concrete);
  for(let i=0;i<40;i++){
    const a=i/40*Math.PI*2,s=Math.sin(a),c=Math.cos(a);
    const outer=new T.Vector3(s*65,22,centreZ+c*79),inner=new T.Vector3(s*40,18.25,centreZ+c*54);
    beam(new T.Vector3(s*65,0,centreZ+c*79),outer,.17);beam(outer,inner,.12);
    beam(new T.Vector3(s*65,20.6,centreZ+c*79),inner,.09);
    for(let j=0;j<5;j++)beam(outer.clone().lerp(inner,j/5),outer.clone().lerp(inner,(j+1)/5).add(new T.Vector3(0,-.9,0)),.045);
    const bank=new T.Mesh(new T.BoxGeometry(3.6,.28,.65),bankMat);
    bank.position.set(s*40,17.9,centreZ+c*54);bank.rotation.set(.25,a,0);bank.updateMatrix();lampParts.push(bank.geometry.toNonIndexed().applyMatrix4(bank.matrix));
  }
  // Dark safety mesh and pitch-side barrier establish the real scale of the bowl.
  ring(40.5,54.5,.1,40.5,54.5,.8,new T.MeshStandardMaterial({color:'#111c29',roughness:.72}));
  for(const [parts,material]of [[structureParts,steel],[concreteParts,concrete],[roofParts,roofMat],[lampParts,bankMat]])if(parts.length){const mesh=new T.Mesh(mergeGeometries(parts,false),material);mesh.receiveShadow=true;scene.add(mesh);parts.forEach(g=>g.dispose());}
  const display=document.createElement('canvas');display.width=1024;display.height=512;const g=display.getContext('2d'),displayMap=new T.CanvasTexture(display);displayMap.colorSpace=T.SRGBColorSpace;
  const screen=new T.Mesh(new T.BoxGeometry(10.5,5.25,.3),[0,0,0,0,1,0].map(front=>front?new T.MeshBasicMaterial({map:displayMap,toneMapped:false}):new T.MeshStandardMaterial({color:'#15212a',roughness:.65})));screen.position.set(0,17.2,-34);scene.add(screen);
  function updateScore(home,away,round){
    g.fillStyle='#101c24';g.fillRect(0,0,1024,512);g.fillStyle='#c4decb';g.fillRect(0,0,1024,8);
    g.textAlign='center';g.fillStyle='#a5b7c4';g.font='600 26px Arial';g.fillText('MATCHDAY  /  PENALTY SERIES',512,67);
    g.fillStyle='#f4f7f7';g.font='700 150px Arial';g.fillText(home+'  :  '+away,512,269);
    g.font='700 31px Arial';g.fillText('HOME',220,345);g.fillText('AWAY',805,345);
    g.fillStyle='#86a297';g.font='24px Arial';g.fillText('ROUND '+round+'   •   HISANALI.COM',512,444);displayMap.needsUpdate=true;
  }
  updateScore(0,0,1);
  return {updateScore,update(time,goal,dt){crowdTime.value=time;cheer.value=T.MathUtils.damp(cheer.value,goal?1:0,3,dt);}};
}
