import * as T from '../evermile/vendor/three.module.js';
// A fitted, skinned latex shell follows the existing hand and every finger.
// This replaces rigid palm boxes and finger capsules.
export function fittedGloves(model,color){
 const body=model.getObjectByName('Ch38_Body');if(!body?.isSkinnedMesh)return null;
 // The compressed mesh is in normalized bind space; its inverse-bind
 // matrices carry the dequantization scale. Match that space when inflating.
 const inflation=.003;
 const source=body.geometry,idx=source.index,positions=[],normals=[],indices=[],weights=[],sourceVertices=[];
 const handBones=new Set(body.skeleton.bones.map((b,i)=>b.name.includes('Hand')?i:-1));handBones.delete(-1);
 const ids=source.attributes.skinIndex,w=source.attributes.skinWeight,p=source.attributes.position,n=source.attributes.normal;
 const influence=i=>{let sum=0;for(let j=0;j<4;j++)if(handBones.has(ids.getComponent(i,j)))sum+=w.getComponent(i,j);return sum;};
 const count=idx?idx.count:p.count;
 for(let f=0;f<count;f+=3){const triangle=[0,1,2].map(j=>idx?idx.getX(f+j):f+j);if(triangle.some(i=>influence(i)<.48))continue;
  for(const i of triangle){sourceVertices.push(i);positions.push(p.getX(i)+n.getX(i)*inflation,p.getY(i)+n.getY(i)*inflation,p.getZ(i)+n.getZ(i)*inflation);normals.push(n.getX(i),n.getY(i),n.getZ(i));for(let j=0;j<4;j++){indices.push(ids.getComponent(i,j));weights.push(w.getComponent(i,j));}}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const glove=new T.SkinnedMesh(geometry,new T.MeshPhysicalMaterial({color,roughness:.52,clearcoat:.12,clearcoatRoughness:.65}));glove.name='Fitted goalkeeper gloves';glove.userData.sourceVertices=sourceVertices;glove.bind(body.skeleton,body.bindMatrix);glove.position.copy(body.position);glove.quaternion.copy(body.quaternion);glove.scale.copy(body.scale);glove.castShadow=true;glove.frustumCulled=false;body.parent.add(glove);return glove;
}
