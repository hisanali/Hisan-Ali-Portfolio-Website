import * as THREE from '/evermile/vendor/three.module.js';

const finishes = new Map();
// Project onto the actual panel triangles. Cutouts, handles, lamps and wheel
// arches retain their original geometry, including during suspension travel.
export function fitEscaladeWrap(group, kit, panels, artwork = 'escalade-wrap') {
  let finish = finishes.get(artwork);
  if (!finish) {
    const map = new THREE.TextureLoader().load(`./assets/${artwork}.webp?v=champagne-1`);
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    finish = new THREE.MeshStandardMaterial({map,alphaTest:.16,roughness:.34,metalness:.24,
      polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
    finishes.set(artwork,finish);
  }
  const positions=[], normals=[], uvs=[];
  const vertices=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
  const normal=new THREE.Vector3(), edge=new THREE.Vector3(), center=new THREE.Vector3(), smooth=new THREE.Vector3();
  for (const panel of panels) {
    const geo=panel.geometry, pos=geo.attributes.position, idx=geo.index;
    const normMatrix=new THREE.Matrix3().getNormalMatrix(panel.matrixWorld);
    for(let i=0;i<(idx?.count ?? pos.count);i+=3){
      for(let j=0;j<3;j++) vertices[j].fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(panel.matrixWorld);
      const [a,b,c]=vertices;
      normal.subVectors(b,a).cross(edge.subVectors(c,a)).normalize();
      center.copy(a).add(b).add(c).multiplyScalar(1/3);
      const side=Math.abs(normal.x)>.42 && Math.abs(center.x)>kit.width*.33;
      const hood=!side && normal.y>.42 && center.z>kit.len*.18 && center.y<kit.height*.81;
      const rear=!side && normal.z<-.42 && center.z< -kit.len*.4;
      if(panel.userData.wrapGlass && !(side && center.z < -kit.len*.235)) continue;
      if(!side && !hood && !rear) continue;
      for(let j=0;j<3;j++){
        const v=vertices[j], sign=Math.sign(center.x);
        let u, y, column, row;
        if(side){u=.5-sign*v.z/kit.len;y=v.y/kit.height;column=sign>0?0:1;row=1;}
        else if(hood){u=.5+v.x/kit.width;y=(kit.len*.5-v.z)/(kit.len*.32);column=0;row=0;}
        else {u=.5-v.x/kit.width;y=v.y/kit.height;column=1;row=0;}
        smooth.fromBufferAttribute(geo.attributes.normal,idx?idx.getX(i+j):i+j).applyNormalMatrix(normMatrix);
        positions.push(v.x+normal.x*.002,v.y+normal.y*.002,v.z+normal.z*.002);
        normals.push(smooth.x,smooth.y,smooth.z);
        uvs.push((column+THREE.MathUtils.clamp(u,.002,.998))*.5,(row+THREE.MathUtils.clamp(y,.002,.998))*.5);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  group.add(new THREE.Mesh(geo,finish));
}
