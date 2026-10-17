import {scaleCutterPaths} from "./packaging-contours";
import sourceProfiles from './studio-package-profiles.json';
import expandedProfiles from './studio-package-profiles-expanded.json';
import exportProfiles from './studio-package-profiles-exports.json';
import type {StudioNet} from './packaging-document';
export type StudioPackageProfile = {id:string; name:string; dimensions:[number,number,number]; scale:number; artworkPage:number; material:'kraft'|'colour'; artworkRects?:Record<string,{x:number;y:number;width:number;height:number}>; geometryNotes?:string[]; net:StudioNet};
/** Content fingerprints deliberately prevent applying a reviewed fold map to a different drawing. */
export const STUDIO_PACKAGE_PROFILES = {...sourceProfiles,...expandedProfiles,...exportProfiles} as unknown as Record<string,StudioPackageProfile>;
export async function studioPackageProfile(data:ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256',data);
  const fingerprint = Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  return STUDIO_PACKAGE_PROFILES[fingerprint] || null;
}
export function scaleImportedNet(net:StudioNet,scale:number):StudioNet {
  return {...net,sourcePaths:scaleCutterPaths(net.sourcePaths,scale),width:net.width*scale,height:net.height*scale,pieces:net.pieces.map(q=>({...q,x:q.x*scale,y:q.y*scale,w:q.w*scale,h:q.h*scale,points:q.points?.map(([x,y])=>[x*scale,y*scale]),islands:q.islands?.map(r=>r.map(([x,y])=>[x*scale,y*scale])),holes:q.holes?.map(r=>r.map(([x,y])=>[x*scale,y*scale])),hinge:q.hinge?{...q.hinge,a:q.hinge.a.map(v=>v*scale) as [number,number],b:q.hinge.b.map(v=>v*scale) as [number,number]}:undefined}))};
}
