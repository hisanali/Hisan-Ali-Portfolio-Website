export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const damp=(a,b,s,dt)=>lerp(a,b,1-Math.exp(-s*dt));
export function hashSeed(str){let h=2166136261;for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function noise(x,z,seed=1){const ix=Math.floor(x),iz=Math.floor(z);const f=t=>t*t*(3-2*t);const h=(a,b)=>{let n=Math.imul(a,374761393)^Math.imul(b,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295};return lerp(lerp(h(ix,iz),h(ix+1,iz),f(x-ix)),lerp(h(ix,iz+1),h(ix+1,iz+1),f(x-ix)),f(z-iz))}
export function createRoad(seed='the-long-way',style='normal'){
 const id=hashSeed(seed),phase=(id%1000)/100;
 const amplitude={straight:0,casual:.46,normal:1,winding:1.8}[style]??1;
 const x=z=>amplitude*(62*Math.sin(z*.0022+phase)+22*Math.sin(z*.0061+phase*.5)+7*Math.sin(z*.013+phase*2));
 const y=z=>21+8*Math.sin(z*.00165+phase)+4*Math.sin(z*.0042+phase*.2);
 const tangent=z=>(x(z+.5)-x(z-.5));
 // Towns: every 1.7 km cell may hold one, 260-460 m long, with a name for its entry signs.
 const TOWN=1700,BRIDGE=2300,NAMES=['Millbrook','Ashford','Elmsworth','Kestrel Bay','Harrow Vale','Linden','Oakhurst','Fernley','Wrenfield','Stonebridge','Marlow Green','Bramble End'];
 const cellRand=(k,salt)=>random(id*31+k*977+salt)();
 const townCache=new Map();
 const townCell=k=>{if(townCache.has(k))return townCache.get(k);let t=null;if(k>=0&&cellRand(k,5)<.72){const half=130+cellRand(k,6)*100,center=k*TOWN+half+60+cellRand(k,7)*(TOWN-2*half-120);t={center,half,start:center-half,end:center+half,name:NAMES[Math.floor(cellRand(k,8)*NAMES.length)],k};}townCache.set(k,t);return t;};
 const townAt=z=>{const k=Math.floor(z/TOWN);return townCell(k);};
 const townFactor=z=>{const t=townAt(z);if(!t)return 0;return smooth(t.start-40,t.start+10,z)*(1-smooth(t.end-10,t.end+40,z));};
 // Bridges: rivers cross the road where it runs low, never inside a town.
 const bridgeCache=new Map();
 const bridgeCell=k=>{if(bridgeCache.has(k))return bridgeCache.get(k);let b=null;if(k>=1&&cellRand(k,11)<.8){let best=null;for(let i=0;i<30;i++){const zz=k*BRIDGE+300+i*(BRIDGE-600)/29;if(!best||y(zz)<y(best))best=zz;}const zc=best,t=townAt(zc),t2=townAt(zc-260),t3=townAt(zc+260),clear=[t,t2,t3].every(q=>!q||zc<q.start-260||zc>q.end+260);if(clear){const half=16+cellRand(k,12)*8;b={z:zc,river:half,bank:48,start:zc-half-48,end:zc+half+48,phase:cellRand(k,13)*6.3,deckY:y(zc)};}}bridgeCache.set(k,b);return b;};
 const bridgeNear=z=>{const k=Math.floor(z/BRIDGE);for(const kk of [k,k-1,k+1]){const b=bridgeCell(kk);if(b&&z>b.start-300&&z<b.end+300)return b;}return null;};
 const bridgeAt=z=>{const b=bridgeNear(z);return b&&z>=b.start&&z<=b.end?b:null;};
 // Distance across the river from a point: the channel meanders away from the road.
 const riverOff=(px,z)=>{const b=bridgeNear(z);if(!b)return Infinity;const dx=px-x(b.z);return Math.abs(z-b.z-(Math.sin(dx*.009+b.phase)-Math.sin(b.phase))*26-dx*.12)-b.river;};
 const riverDepth=(px,z)=>{const b=bridgeNear(z);if(!b)return 0;return 1-smooth(0,b.bank,riverOff(px,z));};
 const terrain=(px,z,offworld=false)=>{const d=Math.abs(px-x(z));const n=noise(px*.003,z*.003,id);const n2=noise(px*.011,z*.011,id+41);const n3=noise(px*.041,z*.041,id+9);const hills=(n-.42)*140+(n2-.5)*29+(n3-.5)*(offworld?12:5);const valley=-smooth(180,620,x(z)-px)*30;let h=y(z)+smooth(6.1,42,d)*(hills+valley)+smooth(120,400,d)*12;
  if(offworld)return h;
  const tf=townFactor(z);if(tf>0)h=lerp(h,y(z)+(noise(px*.02,z*.02,id+3)-.5)*.6*smooth(20,40,d),tf*(1-smooth(40,90,d)));
  // A river runs through an open valley: the hills fall away towards it, then the channel drops below the water line.
  const ro=riverOff(px,z);if(ro<260){const b=bridgeNear(z),open=1-smooth(b.bank,260,ro);h=lerp(h,Math.min(h,y(z)-2+ro*.03),open*.85);const rd=1-smooth(0,b.bank,ro);if(rd>0)h=lerp(h,-12.5+(noise(px*.05,z*.05,id+5)-.5)*1.2,rd*rd*(3-2*rd));}
  return h;};
 return {id,x,y,tangent,terrain,townAt,townFactor,bridgeAt,bridgeNear,riverDepth};
}
export function angleDifference(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
