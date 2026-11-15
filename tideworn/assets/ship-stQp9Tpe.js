import{G as Wt,B as oe,V as b,D as ae,M as lt,a as Ht,b as Vt,C as St,S as Yt,U as Qt,c as Nt,d as ne,e as Jt,f as at,g as wt,P as ie,h as se,i as zt,j as $t,E as re,Q as le,k as ot,T as ce}from"./index-CfL0r0Zl.js";import{c as ue,G as de}from"./ocean-CKzexMJT.js";const me=`
#include <common>
#include <fog_pars_vertex>
attribute float aOpacity;
attribute float aSize;
uniform float uPixelRatio;
varying float vOpacity;
void main(){
  vOpacity = aOpacity;
  vec4 mvPosition = modelViewMatrix * vec4(position,1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(aSize * 380.0 * uPixelRatio / -mvPosition.z, 1.0, 25.0);
  #include <fog_vertex>
}`,fe=`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uColor;
varying float vOpacity;
void main(){
  vec2 p=gl_PointCoord-.5;
  float alpha=(1.0-smoothstep(.13,.50,length(p))) * vOpacity;
  if(alpha<.015) discard;
  gl_FragColor=vec4(uColor,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,he=`
#include <common>
#include <fog_pars_vertex>
attribute float aOpacity;
attribute float aKind;
varying vec2 vUv;
varying vec3 vWorld;
varying float vOpacity;
varying float vKind;
void main(){
 vUv=uv;vOpacity=aOpacity;vKind=aKind;
 vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;
 vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
}`,pe=`
#include <common>
#include <fog_pars_fragment>
uniform float uTime;
uniform float uSpeed;
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vWorld;
varying float vOpacity;
varying float vKind;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
void main(){
 vec2 drift=vec2(uTime*.035,-uTime*.045);
 float large=noise(vWorld.xz*.57+drift),fine=noise(vWorld.xz*2.9-drift*1.6);
 float lace=noise(vWorld.xz*7.2+drift);
 float islands=smoothstep(.26,.69,large*.68+fine*.32);
 float bubbles=smoothstep(.23,.52,fine)*(.55+.45*lace);
 float edge=pow(max(0.,sin(vUv.x*3.14159265)),.65);
 float foam=(.13+islands*.87)*(.52+bubbles*.48);
 if(vKind<.5){foam=max(foam,.28+.25*fine);edge*=smoothstep(0.,.035,vUv.y)*(1.-smoothstep(.965,1.,vUv.y));}
 if(vKind>1.5&&vKind<2.5){
  float r=length(vec2((vUv.x-.5)*3.2,fract(vUv.y*6.3-uTime*.018)-.5));
  float curl=(1.-smoothstep(.05,.18,abs(r-.35)))*(.25+.75*large);
  foam=mix(foam, max(foam,curl),.40);
 }
 float alpha=edge*foam*vOpacity;
 if(alpha<.012)discard;
 vec3 color=uColor*(.78+fine*.22);
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
}`;function vt(s,r,g,h,z){const y=(s+1)*(r+1)*g,M=new Float32Array(y*3),a=new Float32Array(y),L=new Float32Array(y*2),F=new Float32Array(y),O=[];for(let J=0;J<g;J++)for(let w=0;w<=s;w++)for(let c=0;c<=r;c++){const P=J*(s+1)*(r+1)+w*(r+1)+c;if(L[P*2]=c/r,L[P*2+1]=w/s,F[P]=h,w<s&&c<r){const p=P,_=p+r+1;O.push(p,_,p+1,_,_+1,p+1)}}const v=new Jt;v.setAttribute("position",new at(M,3).setUsage(wt)),v.setAttribute("aOpacity",new at(a,1).setUsage(wt)),v.setAttribute("uv",new at(L,2)),v.setAttribute("aKind",new at(F,1)),v.setIndex(O);const B=new lt(v,z);return B.frustumCulled=!1,B.renderOrder=1,{mesh:B,geometry:v,positions:M,opacity:a,rows:s,columns:r,parts:g}}function ge(s,r,g){const h=s.geometry,z=h.attributes.position,y=h.index;h.computeBoundingBox();const M=h.boundingBox,a=M.min.z*r+g.z,L=M.max.z*r+g.z,F=64,O=[-1.8,-.8,.2,1.2,2.2,3.2,4.5],v=O.map(()=>new Float32Array(F+1)),B=y?y.count:z.count;for(let w=0;w<O.length;w++)for(let c=0;c<B;c+=3){const P=[];for(let x=0;x<3;x++){const X=y?y.getX(c+x):c+x,T=y?y.getX(c+(x+1)%3):c+(x+1)%3,D=z.getY(X)*r+g.y,E=z.getY(T)*r+g.y,W=O[w];if(D<=W&&E>W||E<=W&&D>W){const R=(W-D)/(E-D);P.push({x:(z.getX(X)+(z.getX(T)-z.getX(X))*R)*r+g.x,z:(z.getZ(X)+(z.getZ(T)-z.getZ(X))*R)*r+g.z})}}if(P.length!==2)continue;const[p,_]=P;if(Math.abs(p.z-_.z)<1e-5)continue;const C=Math.max(0,Math.ceil((Math.min(p.z,_.z)-a)/(L-a)*F)),$=Math.min(F,Math.floor((Math.max(p.z,_.z)-a)/(L-a)*F));for(let x=C;x<=$;x++){const X=a+(L-a)*x/F,T=p.x+(_.x-p.x)*(X-p.z)/(_.z-p.z);v[w][x]=Math.max(v[w][x],Math.abs(T))}}for(const w of v)for(let c=1;c<F;c++)w[c]<.05&&(w[c]=Math.max(w[c-1],.1));return{minZ:a,maxZ:L,width:(w,c)=>{const P=ot.clamp((w-a)/(L-a)*F,0,F-1e-4),p=Math.floor(P),_=P-p;let C=0;for(;C<O.length-2&&c>O[C+1];)C++;const $=ot.clamp((c-O[C])/(O[C+1]-O[C]),0,1);return Math.max(.1,ot.lerp(ot.lerp(v[C][p],v[C][p+1],_),ot.lerp(v[C+1][p],v[C+1][p+1],_),$))}}}function H(s){const r=Math.sin(s*127.1+311.7)*43758.5453;return r-Math.floor(r)}function ve(){const s=new Wt,r=new Ht({color:2696219,roughness:.46,metalness:.75}),g=new se({color:16757343,toneMapped:!1,transparent:!0,opacity:.85}),h=new lt(new zt(.14,.14,.34,8),g);s.add(h);for(const y of[-.2,.2]){const M=new lt(new zt(.19,.21,.065,8),r);M.position.y=y,s.add(M)}for(let y=0;y<4;y++){const M=new lt(new zt(.016,.016,.44,4),r);M.position.set(Math.cos(y*Math.PI*.5)*.15,0,Math.sin(y*Math.PI*.5)*.15),s.add(M)}const z=new $t(16754515,24,17,2);return z.position.y=.1,s.add(z),s}async function xe(s,r){const g=new Wt;g.name="The open sea";const h=ue({size:2600,segments:s.quality==="low"?160:320,amplitude:4.4,color:2118758});g.add(h.mesh);const z=new de;r?.(8);const M=(await z.loadAsync(s.quality==="low"?"/tideworn/assets/ship-low.glb":"/tideworn/assets/ship.glb",t=>{t.total>0&&r?.(8+Math.min(.85,t.loaded/t.total*.85)*100)})).scene;M.name="The Tideworn · North Atlantic pinnace";const a=new Wt;a.name="Buoyant hull and rig";const L=new oe().setFromObject(M),F=L.getSize(new b),O=L.getCenter(new b),v=40/Math.max(F.x,F.z);M.scale.setScalar(v),M.position.set(-O.x*v,0,-O.z*v),a.add(M),g.add(a);const B=new ae(9679053,1.45);B.position.set(48,26,45),B.target.position.set(0,9,0),g.add(B,B.target);const J={value:0},w={value:s.wind},c={value:s.tide};let P;const p=[],_=new Set,C=new Set;M.traverse(t=>{if(!(t instanceof lt))return;C.add(t.geometry);const l=Array.isArray(t.material)?t.material:[t.material],o=/sail/i.test(t.name);/hull/i.test(t.name)&&(P=t),t.castShadow=!/rigging/i.test(t.name),t.receiveShadow=!0,/hull|deck|aft/i.test(t.name)&&p.push(t);for(const d of l)_.add(d),d instanceof Ht&&(d.roughness=Math.max(.42,d.roughness),d.envMapIntensity=.9,o?(d.side=Vt,d.roughness=.95,d.color.multiply(new St(.64,.63,.6)),d.envMapIntensity=.52,d.onBeforeCompile=i=>{i.uniforms.uSailTime=J,i.uniforms.uSailWind=w,i.vertexShader=`uniform float uSailTime;
uniform float uSailWind;
`+i.vertexShader,i.vertexShader=i.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
              float clothEdge=pow(abs(sin(uv.x*3.14159265)*sin(uv.y*3.14159265)),.55);
              float flutter=sin(position.y*1.13+position.x*.52+uSailTime*2.1)+.35*sin(position.x*3.7+uSailTime*4.3);
              transformed.z+=flutter*clothEdge*(.025+.19*uSailWind);
              transformed.x+=sin(position.y*.7+uSailTime*1.3)*clothEdge*.055*uSailWind;
            `)},d.customProgramCacheKey=()=>"tideworn-sail-cloth-v2"):/hull|deck|aft/i.test(t.name)&&(d.onBeforeCompile=i=>{i.uniforms.uWetLevel=c,i.vertexShader=`varying vec3 vWetWorld;
`+i.vertexShader,i.vertexShader=i.vertexShader.replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vWetWorld=(modelMatrix*vec4(transformed,1.)).xyz;`),i.fragmentShader=`varying vec3 vWetWorld;
uniform float uWetLevel;
`+i.fragmentShader,i.fragmentShader=i.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
float wetness=1.-smoothstep(uWetLevel+.2,uWetLevel+2.6,vWetWorld.y);diffuseColor.rgb*=mix(1.,.66,wetness);`),i.fragmentShader=i.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor=mix(roughnessFactor,min(roughnessFactor,.24),wetness*.85);`)},d.customProgramCacheKey=()=>"tideworn-wet-hull-v1"))});const $=[];for(const t of[new b(-3.35,6.8,-16.5),new b(3.35,6.8,-16.5),new b(0,8.6,-17.9)]){const l=ve();l.position.copy(t),a.add(l),$.push(l)}const x=P?ge(P,v,M.position):{minZ:-17.5,maxZ:15.5,width:(t,l)=>4.25*Math.sqrt(Math.max(.01,1-((t+1)/17)**2))},X={uTime:{value:0},uSpeed:{value:0},uColor:{value:new St(.42,.52,.58)}},T=new Yt({uniforms:Qt.merge([Nt.fog,X]),vertexShader:he,fragmentShader:pe,transparent:!0,depthWrite:!1,side:Vt,fog:!0,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),D=s.quality==="low"?.55:1,E=vt(Math.round(64*D),3,2,0,T);E.mesh.name="Foam at the hull waterline";const W=vt(Math.round(44*D),3,2,1,T);W.mesh.name="Diverging bow waves";const R=vt(Math.round(70*D),6,1,2,T);R.mesh.name="Fading turbulent wake";const k=vt(Math.round(32*D),3,4,3,T);k.mesh.name="Expanding stern turbulence";const yt=[E,W,R,k];yt.forEach(t=>g.add(t.mesh));const Mt=new ne,A=new b,nt=new b,ut=(t,l,o,d,i,I,K)=>{t.positions[l*3]=o,t.positions[l*3+1]=h.heightAt(o,d,I,K)+.03,t.positions[l*3+2]=d,t.opacity[l]=i},dt=s.quality==="low"?210:600,At=s.quality==="low"?90:240,mt=dt+At,j=new Jt,tt=new Float32Array(mt*3),xt=new Float32Array(mt),Pt=new Float32Array(mt);j.setAttribute("position",new at(tt,3).setUsage(wt)),j.setAttribute("aOpacity",new at(xt,1).setUsage(wt)),j.setAttribute("aSize",new at(Pt,1));for(let t=0;t<mt;t++)Pt[t]=t<dt?.42+H(t+200)*1.3:.05+H(t+100)*.13;const ft=new Yt({uniforms:Qt.merge([Nt.fog,{uColor:{value:new St(.38,.49,.55)},uPixelRatio:{value:Math.min(window.devicePixelRatio,1.5)}}]),vertexShader:me,fragmentShader:fe,transparent:!0,depthWrite:!1,fog:!0}),bt=new ie(j,ft);bt.frustumCulled=!1,bt.name="Bow spray and broken wake",g.add(bt);let _t=!1;const Ct=new b,Ut=new le,Ft=new re,Y=new b,ht=.06;let pt=0;const V=190,q={position:new b,heading:ht,speed:0},Ot=(t,l,o)=>{h.update(t,o);const d=o.reducedMotion?.36:1;J.value=t,w.value=o.wind*d,q.speed=.8+o.wind*5.4,pt+=l*q.speed;const i=pt/V,I=V*(1-Math.cos(i)),K=V*Math.sin(i),it=ht+i;q.position.set(I,0,K),q.heading=it;const Tt=Math.sin(it),Et=Math.cos(it),Zt=Math.cos(it),Bt=-Math.sin(it),jt=h.heightAt(I,K,t,o),Lt=h.heightAt(I+Tt*12,K+Et*12,t,o),kt=h.heightAt(I-Tt*12,K-Et*12,t,o),It=h.heightAt(I-Zt*4,K-Bt*4,t,o),Kt=h.heightAt(I+Zt*4,K+Bt*4,t,o),Rt=jt*.35+(Lt+kt)*.25+(It+Kt)*.075;Ct.set(I,Rt-.8,K),Ft.set(-Math.atan2(Lt-kt,24)*.76*d,it+Math.sin(t*.045)*.009,Math.atan2(Kt-It,8)*.5*d,"YXZ"),Ut.setFromEuler(Ft);const qt=_t?1-Math.exp(-Math.min(l,.1)*2.6):1;a.position.lerp(Ct,qt),a.quaternion.slerp(Ut,qt),_t=!0,a.updateMatrixWorld(!0),c.value=Rt,Mt.copy(a.matrixWorld).invert();const Q=ot.clamp(q.speed/5.5,.16,1),Gt=a.position.x-I,Xt=a.position.z-K;T.uniforms.uTime.value=t,T.uniforms.uSpeed.value=q.speed;for(let e=0;e<2;e++)for(let n=0;n<=E.rows;n++){const m=e===0?-1:1,u=ot.lerp(x.minZ+.15,x.maxZ-.15,n/E.rows);A.set(0,.8,u).applyMatrix4(a.matrixWorld),A.y=h.heightAt(A.x,A.z,t,o),nt.copy(A).applyMatrix4(Mt);let f=x.width(u,nt.y);A.set(m*f,nt.y,u).applyMatrix4(a.matrixWorld),A.y=h.heightAt(A.x,A.z,t,o),nt.copy(A).applyMatrix4(Mt),f=x.width(u,nt.y);const U=.5+Q*.62+Math.sin(u*1.7+t*.5)*.1;for(let S=0;S<=E.columns;S++){const Z=S/E.columns,G=e*(E.rows+1)*(E.columns+1)+n*(E.columns+1)+S;A.set(m*(f-.12+Z*U),nt.y,u).applyMatrix4(a.matrixWorld),ut(E,G,A.x,A.z,.49+Q*.3,t,o)}}for(let e=0;e<2;e++)for(let n=0;n<=W.rows;n++){const m=n/W.rows,u=e===0?-1:1,f=m*(8.5+Q*4),U=x.maxZ+.45-m*(24+Q*10);for(let S=0;S<=W.columns;S++){const Z=S/W.columns-.5,G=e*(W.rows+1)*(W.columns+1)+n*(W.columns+1)+S;A.set(u*(f+Z*(.55+m*1.75)),.5,U+Z*.35).applyMatrix4(a.matrixWorld),ut(W,G,A.x,A.z,(.3+Q*.41)*(1-m*.82)*Math.min(1,m*13),t,o)}}const te=44+q.speed*17,gt=x.minZ+1;for(let e=0;e<=R.rows;e++){const n=e/R.rows,m=n*te,u=(pt-m)/V,f=ht+u,U=V*(1-Math.cos(u))+Gt+Math.sin(f)*gt,S=V*Math.sin(u)+Xt+Math.cos(f)*gt,Z=3.2+m*.12,G=Math.pow(1-n,1.7)*(.22+Q*.46);for(let st=0;st<=R.columns;st++){const rt=(st/R.columns-.5)*2,et=rt*Z*(1+Math.sin(m*.32+t*.12)*.05),ct=e*(R.columns+1)+st;ut(R,ct,U+Math.cos(f)*et,S-Math.sin(f)*et,G*Math.min(1,n*28+.4),t,o)}}for(let e=0;e<k.parts;e++){const n=(t*(.055+q.speed*.009)+e/k.parts)%1,m=n*(27+q.speed*5),u=(pt-m)/V,f=ht+u,U=e%2?1:-1,S=V*(1-Math.cos(u))+Gt+Math.sin(f)*gt+Math.cos(f)*U*1.7,Z=V*Math.sin(u)+Xt+Math.cos(f)*gt-Math.sin(f)*U*1.7,G=.65+n*(3.5+Q*3),st=Math.sin(n*Math.PI)*(.12+Q*.23);for(let rt=0;rt<=k.rows;rt++)for(let et=0;et<=k.columns;et++){const ct=rt/k.rows*Math.PI*2+n*U*.7,Dt=G*(.67+et/k.columns*.45)*(1+Math.sin(ct*3+e)*.13),ee=e*(k.rows+1)*(k.columns+1)+rt*(k.columns+1)+et;ut(k,ee,S+Math.cos(ct)*Dt,Z+Math.sin(ct)*Dt*1.38,st,t,o)}}for(const e of yt)e.geometry.attributes.position.needsUpdate=!0,e.geometry.attributes.aOpacity.needsUpdate=!0;for(let e=0;e<dt;e++){const n=H(e*3+1),m=H(e*3+2),u=(t*(.055+o.wind*.04)+H(e*3+3))%1,f=e%2?1:-1,U=18-u*79,S=U>-18?4.4:4.4+(-U-18)*.18;Y.set(f*(S+n*2.6),0,U+m*3.2).applyQuaternion(a.quaternion).add(a.position);const Z=Y.x,G=Y.z;tt[e*3]=Z,tt[e*3+1]=h.heightAt(Z,G,t,o)+.08,tt[e*3+2]=G,xt[e]=Math.sin(u*Math.PI)*(.025+o.wind*.065)*(.35+m*.65)}for(let e=0;e<At;e++){const n=dt+e,m=H(e*5+10),u=H(e*5+11),f=(t*(.28+o.wind*.25)+H(e*5+12))%1,U=e%2?1:-1,S=Math.max(0,Math.sin(t*.77+1)),Z=(.3+o.wind)*d;Y.set(U*(2+f*(4+m*8)*Z),.45+Math.sin(f*Math.PI)*(1+u*4)*Z,16-f*(4+m*10)),Y.applyMatrix4(a.matrixWorld),tt[n*3]=Y.x,tt[n*3+1]=Y.y,tt[n*3+2]=Y.z,xt[n]=Math.sin(f*Math.PI)*.45*S*o.wind}j.attributes.position.needsUpdate=!0,j.attributes.aOpacity.needsUpdate=!0;const N=Math.max(0,Math.sin((o.time-.25)*Math.PI*2));B.intensity=1.45+N*.4,B.position.set(I+48,26,K+45),B.target.position.set(I,9,K),ft.uniforms.uColor.value.setRGB(.31+N*.24,.41+N*.23,.48+N*.19),T.uniforms.uColor.value.setRGB(.42+N*.25,.51+N*.25,.57+N*.21),ft.uniforms.uPixelRatio.value=Math.min(window.devicePixelRatio,o.quality==="low"?1:1.5),$.forEach((e,n)=>{const m=e.children.find(u=>u instanceof $t);m.intensity=(22+Math.sin(t*2.3+n)*2)*(1-N*.62)})};return Ot(0,0,s),r?.(100),{group:g,opening:{position:new b(44,13,30),target:new b(-11,13,7)},shots:[{position:new b(44,13,30),target:new b(-11,13,7)},{position:new b(37,12,-41),target:new b(0,10,-5)},{position:new b(-15,10,29),target:new b(1,16,-2)}],bounds:{radius:550,floor:1.3,ceiling:190},fog:{color:1518650,density:.00185},sky:{zenith:463647,horizon:2308683,sun:12178159,clouds:.72},key:{color:12046575,intensity:2.7,position:new b(-65,85,-60)},ambient:1.3,waterLevel:0,motion:q,colliders:p,update:Ot,trigger:()=>{},dispose:()=>{h.dispose(),j.dispose(),ft.dispose(),yt.forEach(l=>l.geometry.dispose()),T.dispose();const t=new Set;_.forEach(l=>{Object.values(l).forEach(o=>{o instanceof ce&&t.add(o)}),l.dispose()}),t.forEach(l=>l.dispose()),C.forEach(l=>l.dispose()),$.forEach(l=>l.traverse(o=>{o instanceof lt&&(o.geometry.dispose(),(Array.isArray(o.material)?o.material:[o.material]).forEach(i=>i.dispose()))}))}}}export{xe as createShipScene};
