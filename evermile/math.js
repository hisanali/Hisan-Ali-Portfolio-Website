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
 const terrain=(px,z,offworld=false)=>{const d=Math.abs(px-x(z));const n=noise(px*.003,z*.003,id);const n2=noise(px*.011,z*.011,id+41);const n3=noise(px*.041,z*.041,id+9);const hills=(n-.42)*140+(n2-.5)*29+(n3-.5)*(offworld?12:5);const valley=-smooth(180,620,x(z)-px)*30;return y(z)+smooth(6.1,42,d)*(hills+valley)+smooth(120,400,d)*12};
 return {id,x,y,tangent,terrain};
}
export function angleDifference(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
