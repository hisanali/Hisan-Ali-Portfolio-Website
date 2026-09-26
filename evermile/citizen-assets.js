import * as T from './vendor/three.module.js';
export const citizenAssets=[
 ['man-casual_2','Casual man'],['man-casual_hoodie','Hoodie'],['man-suit','Business suit'],['man-worker','Workwear'],['man-farmer','Farmer'],['man-beach','Beachwear'],
 ['woman-casual','Casual woman'],['woman-formal','Formal outfit'],['woman-suit','Tailored suit'],['woman-worker','Worker'],['woman-punk','Streetwear'],['michelle','Headphones'],
];
export const citizenKey=i=>i%18<12?citizenAssets[i%18][0]:'citizen'+(i%18-12);
export function fitCitizen(model,index=0){model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),height=box.max.y-box.min.y,scale=(1.66+(index%6)*.035)/height;model.scale.multiplyScalar(scale);model.position.y-=box.min.y*scale;}
