import{a as pu,d as mu,j as zc,k as so,l as gu}from"./chunk-FRJWHO6U.js";import{a as an,b as Os,c as fu,d as Oi,f as Vc,g as xu,h as _u,j as Hc}from"./chunk-YQVLCG7T.js";import{a as ou,b as Fc,e as Oc,f as lu,g as no,h as io,i as Us,j as Fs,k as Bc,l as Lr,m as cu,n as hu}from"./chunk-ABHQEUVS.js";import{$ as Kd,D as Pc,E as Ic,F as Dc,I as Od,K as Bd,L as zd,M as Vd,N as Lc,O as Hd,R as Gd,S as Wd,T as Xd,U as Yd,V as jd,Y as qd,Z as $d,_ as Zd,a as Uf,b as Ff,ba as Jd,c as Td,ca as Qd,d as Ad,e as Cd,ea as eu,f as Rd,ga as tu,ha as Nc,i as Pd,k as hs,la as nu,ma as iu,n as Id,na as su,p as Dd,pa as ru,qa as kc,r as Ld,ra as au,sa as Uc,t as Nd,ta as Ui,ua as Dr,v as ks,x as kd,y as Ud,z as Fd}from"./chunk-7EBTJZIV.js";import{a as Rc,b as Fi}from"./chunk-PRJB2RT3.js";import{a as du,b as uu}from"./chunk-F7XKTR4X.js";import{c as An}from"./chunk-3RNHDNP5.js";var kf=An(Ff(),1);function vu(i={}){return async(e,t)=>{if(e.size>25*1024*1024)throw Error("Choose artwork smaller than 25 MB.");return new Promise((n,s)=>{let r=new FileReader;r.onload=()=>n(String(r.result)),r.onerror=()=>s(Error("Could not read this artwork.")),r.readAsDataURL(e)})}}async function ro(i){let e=await Promise.allSettled(i),t=e.find(n=>n.status==="rejected");if(t)throw t.reason;return e.map(n=>n.value)}var ao=72/25.4,ai=i=>Number(i.toFixed(6)).toString();function yu(i){let e=Us(i),t=e.width*ao,n=e.height*ao;if(!Number.isFinite(t)||!Number.isFinite(n)||t<=0||n<=0)throw new Error("The dieline has invalid dimensions.");let s=i.name.replace(/[^\x20-\x7e]/g," ").replace(/[\r\n]/g," ").slice(0,150),r=o=>e.sourcePaths?.filter(l=>l.kind===o).map(l=>"newpath "+l.commands.map(c=>c[0]==="Z"?"closepath":c.slice(1).map(h=>ai(h)).join(" ")+" "+{M:"moveto",L:"lineto",C:"curveto"}[c[0]]).join(" ")+" stroke").join(`
`),a=o=>o.map(([l,c,h,f])=>`newpath ${ai(l)} ${ai(c)} moveto ${ai(h)} ${ai(f)} lineto stroke`).join(`
`);return`%!PS-Adobe-3.0 EPSF-3.0
%%Title: ${s} - vector dieline
%%Creator: Studio Packaging Studio
%%BoundingBox: 0 0 ${Math.ceil(t)} ${Math.ceil(n)}
%%HiResBoundingBox: 0 0 ${ai(t)} ${ai(n)}
%%LanguageLevel: 2
%%Pages: 1
%%DocumentData: Clean7Bit
%%EndComments
%%Page: 1 1
gsave
0 ${ai(n)} translate
${ai(ao)} ${ai(-ao)} scale
0.25 setlinewidth
1 setlinejoin
1 setlinecap
% CUT PATHS - magenta, solid. All coordinates are physical millimetres.
0 1 0 0 setcmykcolor
[] 0 setdash
${r("cut")??a(hu(e))}
% FOLD PATHS - cyan, dashed. Separate editable vector paths.
1 0 0 0 setcmykcolor
[2 1] 0 setdash
${r("fold")??a(cu(e))}
grestore
showpage
%%Trailer
%%EOF
`}function bu(i,e){return{...i,material:e,finish:"matte",panels:Object.fromEntries(Object.entries(i.panels).map(([t,n])=>[t,{...n,color:e==="kraft"?"#b78b56":"#faf9f6",insideColor:e==="kraft"?"#b78b56":"#f1eee7",objects:n.objects.filter(s=>s.name!=="Imported background")}]))}}var Mu=i=>typeof i=="number"?i+.5:i==="center"?.5:i==="right"||i==="bottom"?1:0;function Of(i){let e=(i.width||0)+(i.stroke&&i.strokeWidth||0),t=(i.height||0)+(i.stroke&&i.strokeWidth||0),n=i.scaleX??1,s=i.scaleY??1,r=(i.angle||0)*Math.PI/180,a=Math.tan((i.skewX||0)*Math.PI/180),o=Math.tan((i.skewY||0)*Math.PI/180),l=[[0,0],[e,0],[e,t],[0,t]].map(([c,h])=>(c-=e*Mu(i.originX),h-=t*Mu(i.originY),h+=c*o,c+=h*a,c*=n,h*=s,[(i.left||0)+c*Math.cos(r)-h*Math.sin(r),(i.top||0)+c*Math.sin(r)+h*Math.cos(r)]));return{left:Math.min(...l.map(c=>c[0])),top:Math.min(...l.map(c=>c[1])),right:Math.max(...l.map(c=>c[0])),bottom:Math.max(...l.map(c=>c[1]))}}function Gc(i){let e=Math.min(...i.map(o=>o[1])),t=Math.max(...i.map(o=>o[1])),n=Math.max(.001,t-e),s=128,r=Array.from({length:s},()=>[]),a=o=>Math.max(0,Math.min(s-1,Math.floor((o-e)/n*s)));for(let o=0,l=i.length-1;o<i.length;l=o++){let c=i[l],h=i[o];if(c[1]!==h[1])for(let f=a(Math.min(c[1],h[1]));f<=a(Math.max(c[1],h[1]));f++)r[f].push({a:c,b:h})}return(o,l)=>{if(l<e||l>t)return!1;let c=!1;for(let{a:[h,f],b:[d,m]}of r[a(l)])f>l!=m>l&&o<(d-h)*(l-f)/(m-f)+h&&(c=!c);return c}}function Wc(i,e){let t=i.filter(y=>y.name!=="Imported background");if(!t.length)return i;let n=t.map(Of),s=Math.min(...n.map(y=>y.left)),r=Math.min(...n.map(y=>y.top)),a=Math.max(...n.map(y=>y.right)),o=Math.max(...n.map(y=>y.bottom)),l=a-s,c=o-r;if(!l||!c)return i;let h=e.points||[[0,0],[e.w,0],[e.w,e.h],[0,e.h]],f=Gc(h),d=(e.islands||[]).map(Gc),m=(e.holes||[]).map(Gc),g=(y,M,E)=>{for(let R=0;R<=32;R++){let v=R/32;for(let[w,P]of[[y-l*E/2+l*E*v,M-c*E/2],[y-l*E/2+l*E*v,M+c*E/2],[y-l*E/2,M-c*E/2+c*E*v],[y+l*E/2,M-c*E/2+c*E*v]])if(!(f(w,P)||d.some(D=>D(w,P)))||m.some(D=>D(w,P)))return!1}return!0},A=(s+a)/2,u=(r+o)/2;if(g(A,u,1))return i;let p={x:e.w/2,y:e.h/2,s:0},S=[[Math.max(l/2+.2,Math.min(e.w-l/2-.2,A)),Math.max(c/2+.2,Math.min(e.h-c/2-.2,u))],[e.w/2,e.h/2]];for(let y=1;y<8;y++)for(let M=1;M<8;M++)S.push([e.w*y/8,e.h*M/8]);for(let[y,M]of S){let E=0,R=1;for(let v=0;v<18;v++){let w=(E+R)/2;g(y,M,w)?E=w:R=w}if(E>p.s&&(p={x:y,y:M,s:E},E>.99999))break}if(p.s<.001)throw new Error("This panel is too small for its artwork. Use larger box dimensions.");let C=p.s>.99999?1:p.s*.995;return i.map(y=>y.name==="Imported background"?y:{...y,left:p.x+((y.left||0)-A)*C,top:p.y+((y.top||0)-u)*C,scaleX:(y.scaleX??1)*C,scaleY:(y.scaleY??1)*C})}function Su(i,e,t){if(i.structure!=="custom"||!i.imported)return Fs({...i,[e]:t});if(i.imported.referenceOnly||!i.imported.net.pieces.some(g=>g.parent&&g.hinge))throw new Error("Map the panels and folds before changing box dimensions. This import is still a flat reference.");let n=[e==="width"?t/i.width:1,e==="depth"?t/i.depth:1,e==="height"?t/i.height:1],s=i.imported.net;s.rootPlane==="front"&&([n[1],n[2]]=[n[2],n[1]]);let r=new Map(s.pieces.map(g=>[g.id,g])),a=new Map,o=new Set;function l(g){if(a.has(g.id))return a.get(g.id);if(o.has(g.id))throw new Error("The imported fold map contains a cycle.");o.add(g.id);let A=g.parent&&r.get(g.parent),u=A?l(A):void 0,p=u?.basis||[[1,0,0],[0,1,0],[0,0,1]],S=U=>[0,1,2].map(G=>p[0][G]*U[0]+p[1][G]*U[1]+p[2][G]*U[2]),C=[[1,0,0],[0,1,0],[0,0,1]];if(g.hinge){let U=g.hinge.b[0]-g.hinge.a[0],G=g.hinge.b[1]-g.hinge.a[1],Y=Math.hypot(U,G),re=[U/Y,G/Y,0],W=g.hinge.angle*Math.PI/180,Z=Math.cos(W),ie=Math.sin(W);C=C.map(xe=>{let be=re[0]*xe[0]+re[1]*xe[1],pe=[re[1]*xe[2],-re[0]*xe[2],re[0]*xe[1]-re[1]*xe[0]];return xe.map((K,Je)=>K*Z+pe[Je]*ie+re[Je]*be*(1-Z))})}let y=C.map(S),M=U=>Math.hypot(...U.map((G,Y)=>G*n[Y]));if(y.some(U=>Math.max(...U.map(Math.abs))<.9999))throw new Error("This fold map has angled panels that need a reviewed structural resize. The original package has been preserved.");let E=M(y[0]),R=M(y[1]),v=g.hinge?.a||[g.x,g.y],w=u?u.map(v):[v[0],v[1]],P=U=>[w[0]+(U[0]-v[0])*E,w[1]+(U[1]-v[1])*R],[D,N]=P([g.x,g.y]),L={piece:{...g,x:D,y:N,w:g.w*E,h:g.h*R,points:g.points?.map(([U,G])=>[U*E,G*R]),islands:g.islands?.map(U=>U.map(([G,Y])=>[G*E,Y*R])),holes:g.holes?.map(U=>U.map(([G,Y])=>[G*E,Y*R])),hinge:g.hinge?{...g.hinge,a:P(g.hinge.a),b:P(g.hinge.b)}:void 0},basis:y,sx:E,sy:R,map:P};return a.set(g.id,L),o.delete(g.id),L}let c=s.pieces.map(g=>l(g).piece),h=Math.min(0,...c.map(g=>g.x-10)),f=Math.min(0,...c.map(g=>g.y-10));for(let g of c)g.x-=h,g.y-=f,g.hinge&&(g.hinge.a=[g.hinge.a[0]-h,g.hinge.a[1]-f],g.hinge.b=[g.hinge.b[0]-h,g.hinge.b[1]-f]);let d=s.sourcePaths?.map(g=>{let A=g.piece&&a.get(g.piece);if(!A)throw new Error("This cutter path has no mapped panel. Preserve the original dimensions until its panel is mapped.");return{...g,commands:g.commands.map(u=>{let p=u.slice(1),S=[];for(let C=0;C<p.length;C+=2){let y=A.map([p[C],p[C+1]]);S.push(y[0]-h,y[1]-f)}return[u[0],...S]})}}),m=Fs({...i,[e]:t,imported:{...i.imported,net:{...s,sourcePaths:d,width:Math.max(...c.map(g=>g.x+g.w))+10,height:Math.max(...c.map(g=>g.y+g.h))+10,pieces:c}}});for(let g of c){if(!g.face||!m.panels[g.face])continue;let A=i.panels[g.face];if(!A)continue;let u=p=>p.map(S=>S.name==="Imported background"?{...S,scaleX:(S.scaleX??1)*g.w/A.width,scaleY:(S.scaleY??1)*g.h/A.height}:S);m.panels[g.face]={...m.panels[g.face],objects:Wc(u(A.objects),g),insideObjects:Wc(u(A.insideObjects),g)}}return m}var Oe=An(Rc(),1);function wu(){return null}var Nr=An(Rc(),1),Eu=An(Uf(),1);var ds=An(Fi(),1);function Xc({label:i,onClose:e,busy:t=!1,className:n,children:s,feature:r,closeLabel:a="Close"}){let o=(0,Nr.useRef)(null);return(0,Nr.useEffect)(()=>{let l=c=>{c.key==="Escape"&&!t&&e()};return window.addEventListener("keydown",l),()=>window.removeEventListener("keydown",l)},[t,e]),(0,Nr.useEffect)(()=>{let l=document.activeElement,c=document.querySelector(".main-content"),h=document.body.style.overflow,f=c?.style.overflowY||"";return document.body.style.overflow="hidden",c&&(c.style.overflowY="hidden"),o.current?.contains(document.activeElement)||o.current?.querySelector("input,button")?.focus({preventScroll:!0}),()=>{document.body.style.overflow=h,c&&(c.style.overflowY=f),l?.focus({preventScroll:!0})}},[]),(0,Eu.createPortal)((0,ds.jsx)("div",{className:"modal-backdrop",role:"presentation",onMouseDown:()=>!t&&e(),children:(0,ds.jsxs)("section",{ref:o,className:`modal ${n}`,role:"dialog","aria-modal":"true","aria-label":i,onMouseDown:l=>l.stopPropagation(),children:[(0,ds.jsx)("button",{className:"modal-close",onClick:e,"aria-label":a,disabled:t,children:(0,ds.jsx)(Dr,{})}),(0,ds.jsx)(wu,{feature:r,label:i}),s]})}),document.body)}var Bf=(i,e=100,t=100)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${t}" viewBox="0 0 ${e} ${t}"><g fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${i}</g></svg>`,Mi=(i,e,t,n,s=100,r=100)=>({id:i,name:e,category:t,svg:Bf(n,s,r),width:s,height:r}),$t=i=>`<path d="${i}"/>`,Nt=(i,e,t,n)=>`<line x1="${i}" y1="${e}" x2="${t}" y2="${n}"/>`,Cn=(i,e,t)=>`<circle cx="${i}" cy="${e}" r="${t}"/>`,Bs=(i,e,t,n,s=0)=>`<rect x="${i}" y="${e}" width="${t}" height="${n}" rx="${s}"/>`,Tu=(i,e,t=-Math.PI/2,n=50,s=50)=>`<polygon points="${Array.from({length:i},(r,a)=>`${n+e*Math.cos(t+a*Math.PI*2/i)},${s+e*Math.sin(t+a*Math.PI*2/i)}`).join(" ")}"/>`,lt=(i,e)=>Array.from({length:i},(t,n)=>e(n)).join(""),Yc=(i,e,t,n)=>`<g transform="translate(${i} ${e}) rotate(${n}) scale(${t})">${$t("M0 0Q-20 -20 0 -40Q20 -20 0 0ZM0 0V-35")}</g>`,oo=[Mi("border-1","Fine rule","Borders",Nt(5,50,95,50)),Mi("border-2","Double rule","Borders",Nt(5,45,95,45)+Nt(5,55,95,55)),Mi("border-3","Dotted rule","Borders",lt(19,i=>Cn(5+i*5,50,1))),Mi("border-4","Dashed rule","Borders",'<path d="M5 50H95" stroke-dasharray="7 5"/>'),Mi("border-10","Corner brackets","Borders",$t("M30 10H10V30M70 10H90V30M10 70V90H30M70 90H90V70")),Mi("border-11","Rounded frame","Borders",Bs(10,10,80,80,15)),Mi("border-12","Inset frame","Borders",Bs(10,10,80,80)+Bs(16,16,68,68)),Mi("border-20","Open frame","Borders",$t("M40 10H10V90H90V60"))],zf=[["pinstripe","Pinstripe",lt(5,i=>Nt(i*20,0,i*20,100))],["horizontal-rule","Horizontal rules",lt(5,i=>Nt(0,i*20,100,i*20))],["diagonal","Diagonal lines",lt(9,i=>Nt(-100+i*25,0,i*25,100))],["crosshatch","Crosshatch",lt(9,i=>Nt(-100+i*25,0,i*25,100)+Nt(i*25,0,-100+i*25,100))],["dot-grid","Dot grid",lt(25,i=>Cn(10+i%5*20,10+Math.floor(i/5)*20,2))],["offset-dots","Offset dots",lt(25,i=>Cn(5+i%5*20+Math.floor(i/5)%2*10,10+Math.floor(i/5)*20,3))],["tiny-check","Fine gingham",lt(25,i=>(i+Math.floor(i/5))%2?Bs(i%5*20,Math.floor(i/5)*20,20,20):"")],["grid","Architect grid",lt(5,i=>Nt(i*20,0,i*20,100)+Nt(0,i*20,100,i*20))],["diamond-lattice","Diamond lattice",lt(9,i=>Nt(-100+i*25,0,i*25,100)+Nt(i*25,0,-100+i*25,100))+Cn(50,50,4)],["hex-tile","Hexagonal tile",lt(9,i=>Tu(6,17,Math.PI/6,18+i%3*32,18+Math.floor(i/3)*32))],["triangles","Triangle tiles",lt(16,i=>Tu(3,12,Math.floor(i/4)%2?Math.PI/2:-Math.PI/2,12+i%4*25,12+Math.floor(i/4)*25))],["circles","Linked circles",lt(9,i=>Cn(16+i%3*34,16+Math.floor(i/3)*34,20))],["arches","Repeating arches",lt(9,i=>$t(`M${i%3*34} ${Math.floor(i/3)*34+34}V${Math.floor(i/3)*34+17}a17 17 0 0 1 34 0v17`))],["scales","Scallop tiles",lt(12,i=>$t(`M${i%4*25} ${Math.floor(i/4)*34}a25 25 0 0 0 50 0`))],["chevrons","Chevron rows",lt(5,i=>$t(`M0 ${i*20}L25 ${i*20+15}L50 ${i*20}L75 ${i*20+15}L100 ${i*20}`))],["herringbone","Herringbone",lt(16,i=>`<g transform="translate(${i%4*25} ${Math.floor(i/4)*25}) rotate(${(i%4+Math.floor(i/4))%2?45:-45} 12 12)">${Bs(4,7,25,10)}</g>`)],["art-deco","Art deco fans",lt(4,i=>`<g transform="translate(${i%2*50} ${Math.floor(i/2)*50})">${$t("M0 45Q25 0 50 45M5 45Q25 10 45 45M10 45Q25 20 40 45M25 45V15")}</g>`)],["stepped","Deco steps",lt(4,i=>`<g transform="translate(${i%2*50} ${Math.floor(i/2)*50})">${$t("M0 45V30H10V20H20V10H30V20H40V30H50V45")}</g>`)],["greek-key","Greek key",lt(4,i=>$t(`M${i*25} 0V100M${i*25} 25h20v20h-12v-12M${i*25} 75h20v20h-12v-12`))],["woven","Woven strips",lt(5,i=>Nt(i*20,0,i*20,100)+Nt(i*20+5,0,i*20+5,100)+Nt(0,i*20,100,i*20)+Nt(0,i*20+5,100,i*20+5))],["leaf-sprigs","Leaf sprigs",lt(6,i=>`<g transform="translate(${15+i%3*32} ${35+Math.floor(i/3)*50})">${Yc(0,0,.55,-25)}</g>`)],["olive","Olive branches",lt(4,i=>`<g transform="translate(${i%2*50} ${Math.floor(i/2)*50})">${$t("M10 45L35 5")+Yc(20,30,.35,-50)+Yc(28,18,.35,50)}</g>`)],["petals","Four petal flowers",lt(9,i=>`<g transform="translate(${17+i%3*33} ${17+Math.floor(i/3)*33})">${lt(4,e=>`<ellipse cx="0" cy="-7" rx="4" ry="7" transform="rotate(${e*90})"/>`)}</g>`)],["daisy-field","Daisy field",lt(4,i=>`<g transform="translate(${25+i%2*50} ${25+Math.floor(i/2)*50})">${Cn(0,0,3)+lt(8,e=>`<ellipse cx="0" cy="-11" rx="3" ry="7" transform="rotate(${e*45})"/>`)}</g>`)],["fern-field","Fern field",lt(4,i=>`<g transform="translate(${i%2*50} ${Math.floor(i/2)*50})">${$t("M25 45V5")+lt(4,e=>$t(`M25 ${15+e*8}L12 ${7+e*8}M25 ${15+e*8}L38 ${7+e*8}`))}</g>`)],["bamboo-grid","Bamboo grove",lt(4,i=>Nt(12+i*25,0,12+i*25,100)+lt(4,e=>Nt(8+i*25,e*25,16+i*25,e*25)))],["water-drops","Water drops",lt(9,i=>`<g transform="translate(${i%3*34} ${Math.floor(i/3)*34})">${$t("M17 3Q0 22 17 29Q34 22 17 3Z")}</g>`)],["ripples","Water ripples",lt(4,i=>`<g transform="translate(${25+i%2*50} ${25+Math.floor(i/2)*50})"><ellipse rx="22" ry="8"/><ellipse rx="12" ry="4"/></g>`)],["waves","Optional wave lines",lt(5,i=>$t(`M0 ${i*20+10}Q25 ${i*20-5} 50 ${i*20+10}T100 ${i*20+10}`))],["bubble","Air bubbles",Cn(10,20,8)+Cn(40,15,4)+Cn(75,20,12)+Cn(25,65,15)+Cn(65,55,7)+Cn(88,80,9)+Cn(50,90,5)],["contour","Contour lines",lt(7,i=>$t(`M0 ${15+i*12}Q25 ${-15+i*12} 55 ${20+i*12}T100 ${10+i*12}`))],["pebbles","Pebble outlines",$t("M5 10Q20 0 30 15Q35 35 15 30Q0 25 5 10ZM50 10Q75 0 85 20Q90 40 60 35Q40 28 50 10ZM10 60Q35 40 45 65Q40 85 15 85Q0 80 10 60ZM60 65Q80 40 95 65Q100 95 75 95Q55 90 60 65Z")],["grain","Fine paper marks",lt(25,i=>Nt(i*37%100,i*17%100,i*37%100+3,i*17%100+1))],["dash-field","Short dash field",lt(25,i=>Nt(7+i%5*20,10+Math.floor(i/5)*20,13+i%5*20,10+Math.floor(i/5)*20))],["plus-field","Plus marks",lt(16,i=>Nt(8+i%4*25,12+Math.floor(i/4)*25,16+i%4*25,12+Math.floor(i/4)*25)+Nt(12+i%4*25,8+Math.floor(i/4)*25,12+i%4*25,16+Math.floor(i/4)*25))],["sparkle","Sparkle field",lt(9,i=>`<g transform="translate(${17+i%3*33} ${17+Math.floor(i/3)*33})">${$t("M0 -10Q2 -2 10 0Q2 2 0 10Q-2 2 -10 0Q-2 -2 0 -10Z")}</g>`)],["confetti","Confetti",lt(15,i=>`<g transform="translate(${i*37%100} ${i*23%100}) rotate(${i*31})">${Bs(0,0,3,8)}</g>`)],["bricks","Brickwork",lt(4,i=>Nt(0,i*25,100,i*25)+lt(4,e=>Nt(e*25+i%2*12,i*25,e*25+i%2*12,i*25+25)))],["truchet","Quarter circle tiles",lt(16,i=>`<g transform="translate(${i%4*25} ${Math.floor(i/4)*25}) rotate(${i*7%4*90} 12.5 12.5)">${$t("M0 12.5A12.5 12.5 0 0 0 12.5 0M12.5 25A12.5 12.5 0 0 1 25 12.5")}</g>`)],["interlace","Interlaced ribbons",lt(4,i=>$t(`M0 ${i*25}Q25 ${i*25+25} 50 ${i*25}T100 ${i*25}M0 ${i*25+10}Q25 ${i*25-15} 50 ${i*25+10}T100 ${i*25+10}`))]],lo=zf.filter(([i])=>["pinstripe","horizontal-rule","diagonal","crosshatch","dot-grid","diamond","hexagon","herringbone","ripples","waves","contour"].includes(i)).map(([i,e,t])=>Mi(`pattern-${i}`,e,["ripples","waves","contour"].includes(i)?"Water & stone":"Geometric",t)),co=[["noir-gold","Noir & gold","Luxury","#182027","#e3ca9b","#a98b55","frame"],["ivory-deco","Ivory art deco","Luxury","#f6f1e6","#484134","#b49960","deco","pattern-art-deco"],["charcoal-arch","Charcoal arch","Luxury","#29282c","#efe9df","#8a7970","arch"],["pearl-label","Pearl label","Luxury","#edebe4","#44433f","#a89d87","label"],["burgundy","Burgundy collection","Luxury","#512b39","#f4e8d8","#c8a378","frame"],["deep-green","Deep green edition","Luxury","#253c32","#eee9dc","#b5a47a","split"],["pure-white","Pure white","Minimal","#ffffff","#252b30","#aeb5b9","logo-centre"],["quiet-grey","Quiet grey","Minimal","#f0f1f0","#30383b","#9aa6a8","corner"],["black-type","Black typography","Minimal","#ffffff","#191919","#c5c5c5","type-led"],["stone-panel","Stone panel","Minimal","#ebe9e3","#4d4b47","#bbb7ac","split"],["thin-rule","Fine rule","Minimal","#fafaf8","#343b40","#929a9c","rule"],["wide-margin","Wide margins","Minimal","#f6f7f5","#2a3c46","#758d98","label"],["blue-grid","Blue grid","Geometric","#edf4f7","#254254","#8fa9b7","corner","pattern-grid"],["terracotta-block","Terracotta blocks","Geometric","#f3e6da","#7b4d3c","#be7b5c","split"],["sage-arch","Sage arches","Geometric","#e2e8df","#435347","#90a18e","arch","pattern-arches"],["sand-diamond","Sand diamonds","Geometric","#eee7d6","#615444","#b59c79","band","pattern-diamond-lattice"],["deco-fan","Deco fans","Geometric","#e8e5df","#38444b","#a89c81","deco","pattern-art-deco"],["cobalt-step","Cobalt steps","Geometric","#f4f5f7","#244b7b","#678eb6","corner","pattern-stepped"],["olive-garden","Olive garden","Botanical","#eceee3","#4b5e40","#91a07b","botanical","pattern-olive"],["fern-paper","Fern paper","Botanical","#f4f1e7","#3f5847","#8ba58b","frame","pattern-fern-field"],["lotus-calm","Lotus calm","Botanical","#eee9e7","#705c68","#b79ca9","label"],["bamboo-natural","Bamboo natural","Botanical","#f0ebda","#525c39","#afb080","band","pattern-bamboo-grid"],["petal-cream","Petal cream","Botanical","#faf0e4","#775f4e","#c5a488","botanical","pattern-petals"],["ink-leaves","Ink leaves","Botanical","#f8f7f1","#293e35","#86998d","corner","pattern-leaf-sprigs"],["retail-strip","Retail colour strip","Retail","#ffffff","#252d36","#e58a45","band"],["retail-info","Retail information","Retail","#f7f8f9","#293744","#4c8cb8","spec-grid"],["retail-tag","Retail label","Retail","#ecefe9","#334639","#74a577","label"],["retail-bold","Retail bold title","Retail","#f0e9da","#282c35","#d4a748","type-led"],["kraft-black","Kraft & black","Kraft","#bd956c","#28231d","#67513a","logo-centre"],["kraft-grid","Kraft architect","Kraft","#c3a078","#382e24","#846e52","spec-grid","pattern-grid"],["kraft-garden","Kraft garden","Kraft","#b7926b","#344336","#73836a","botanical","pattern-olive"],["kraft-label","Kraft label","Kraft","#c6a27c","#3b3028","#efe2ce","label"],["kraft-white","Kraft & white","Kraft","#ac855e","#fffaf0","#d7b795","frame"],["kraft-craft","Kraft stitched","Kraft","#be9c76","#4a3c30","#856b50","rule","pattern-dash-field"]].filter(i=>i[2]!=="Botanical"&&i[0]!=="kraft-garden").map(([i,e,t,n,s,r,a,o])=>({id:i,name:e,category:t,background:n,ink:s,accent:r,layout:a,patternId:o})),Au=[{id:"soft-white",name:"Soft white studio",background:"#f3f4f5",surface:"neutral",stage:"studio",light:1.1},{id:"warm-paper",name:"Warm paper studio",background:"#e9e3d8",surface:"neutral",stage:"studio",light:1},{id:"cool-grey",name:"Cool grey studio",background:"#d7dde1",surface:"neutral",stage:"studio",light:1.15},{id:"dark-studio",name:"Charcoal studio",background:"#2a3038",surface:"neutral",stage:"studio",light:1.3},{id:"oak-table",name:"Oak tabletop",background:"#e9e4dc",surface:"wood",stage:"table",light:1},{id:"walnut-table",name:"Walnut tabletop",background:"#c9bbae",surface:"wood",stage:"table",light:.9},{id:"stone-table",name:"Stone tabletop",background:"#e8e6e1",surface:"stone",stage:"table",light:1.15},{id:"concrete-floor",name:"Concrete floor",background:"#d4d4d0",surface:"concrete",stage:"floor",light:1.2},{id:"stone-floor",name:"Stone floor",background:"#dedbd3",surface:"stone",stage:"floor",light:1.1},{id:"white-plinth",name:"White pedestal",background:"#eceff0",surface:"neutral",stage:"pedestal",light:1.25},{id:"stone-plinth",name:"Stone pedestal",background:"#c9c6bd",surface:"stone",stage:"pedestal",light:1.1},{id:"gallery-plinth",name:"Gallery pedestal",background:"#343e45",surface:"concrete",stage:"pedestal",light:1.4}],Vy=new Map([...oo,...lo].map(i=>[i.id,i.svg]));var en=An(Rc(),1);var Qi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},es={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},op=0,Ih=1,lp=2;var wa=1,cp=2,ts=3,fi=0,Zt=1,Nn=2,Gt=0,yr=1,Ea=2,Dh=3,Lh=4,ml=5;var Gn=100,hp=101,dp=102,up=103,pp=104,Es=200,fp=201,mp=202,gp=203,Nh=204,kh=205,Ta=206,xp=207,Aa=208,_p=209,vp=210,yp=211,bp=212,Mp=213,Sp=214,ko=0,Uo=1,Fo=2,sr=3,Oo=4,Bo=5,zo=6,Vo=7,gl=0,wp=1,Ep=2,Jn=0,Ca=1,Ra=2,Pa=3,Ts=4,Ia=5,Da=6,La=7;var Uh=300,ns=301,As=302,br=303,xl=304,Na=306,zn=1e3,Bn=1001,Ho=1002,Ht=1003,Tp=1004;var ka=1005;var zt=1006,_l=1007;var Ii=1008;var xn=1009,Fh=1010,Oh=1011,Mr=1012,vl=1013,Qn=1014,bn=1015,Dt=1016,yl=1017,bl=1018,is=1020,Bh=35902,zh=35899,Vh=1021,Hh=1022,wn=1023,ci=1026,mi=1027,Ml=1028,Sl=1029,ss=1030,wl=1031;var El=1033,Ua=33776,Fa=33777,Oa=33778,Ba=33779,Tl=35840,Al=35841,Cl=35842,Rl=35843,Pl=36196,Il=37492,Dl=37496,Ll=37488,Nl=37489,za=37490,kl=37491,Ul=37808,Fl=37809,Ol=37810,Bl=37811,zl=37812,Vl=37813,Hl=37814,Gl=37815,Wl=37816,Xl=37817,Yl=37818,jl=37819,ql=37820,$l=37821,Zl=36492,Kl=36494,Jl=36495,Ql=36283,ec=36284,Va=36285,tc=36286;var Yr=2300,Go=2301,Lo=2302,xh=2303,_h=2400,vh=2401,yh=2402;var Ap=3200;var Sr=0,Cp=1,Di="",sn="srgb",xs="srgb-linear",jr="linear",St="srgb";var No=7680;var Rp=519,Pp=512,Ip=513,Dp=514,nc=515,Lp=516,Np=517,ic=518,kp=519,Up=35044;var Gh="300 es",qn=2e3,rr=2001;function Vf(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Hf(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function ar(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Fp(){let i=ar("canvas");return i.style.display="block",i}var Cu={},or=null;function Wh(...i){let e="THREE."+i.shift();or?or("log",e,...i):console.log(e,...i)}function Op(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function nt(...i){i=Op(i);let e="THREE."+i.shift();if(or)or("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function it(...i){i=Op(i);let e="THREE."+i.shift();if(or)or("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function gs(...i){let e=i.join(" ");e in Cu||(Cu[e]=!0,nt(...i))}function Bp(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var zp={[ko]:Uo,[Fo]:zo,[Oo]:Vo,[sr]:Bo,[Uo]:ko,[zo]:Fo,[Vo]:Oo,[Bo]:sr},Zn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},un=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ru=1234567,Hr=Math.PI/180,lr=180/Math.PI;function Cs(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(un[i&255]+un[i>>8&255]+un[i>>16&255]+un[i>>24&255]+"-"+un[e&255]+un[e>>8&255]+"-"+un[e>>16&15|64]+un[e>>24&255]+"-"+un[t&63|128]+un[t>>8&255]+"-"+un[t>>16&255]+un[t>>24&255]+un[n&255]+un[n>>8&255]+un[n>>16&255]+un[n>>24&255]).toLowerCase()}function ut(i,e,t){return Math.max(e,Math.min(t,i))}function Xh(i,e){return(i%e+e)%e}function Gf(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function Wf(i,e,t){return i!==e?(t-i)/(e-i):0}function Gr(i,e,t){return(1-t)*i+t*e}function Xf(i,e,t,n){return Gr(i,e,1-Math.exp(-t*n))}function Yf(i,e=1){return e-Math.abs(Xh(i,e*2)-e)}function jf(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function qf(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function $f(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Zf(i,e){return i+Math.random()*(e-i)}function Kf(i){return i*(.5-Math.random())}function Jf(i){i!==void 0&&(Ru=i);let e=Ru+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Qf(i){return i*Hr}function em(i){return i*lr}function tm(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function nm(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function im(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function sm(i,e,t,n,s){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),f=r((e-n)/2),d=a((e-n)/2),m=r((n-e)/2),g=a((n-e)/2);switch(s){case"XYX":i.set(o*h,l*f,l*d,o*c);break;case"YZY":i.set(l*d,o*h,l*f,o*c);break;case"ZXZ":i.set(l*f,l*d,o*h,o*c);break;case"XZX":i.set(o*h,l*g,l*m,o*c);break;case"YXY":i.set(l*m,o*h,l*g,o*c);break;case"ZYZ":i.set(l*g,l*m,o*h,o*c);break;default:nt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function tr(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function yn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var kn={DEG2RAD:Hr,RAD2DEG:lr,generateUUID:Cs,clamp:ut,euclideanModulo:Xh,mapLinear:Gf,inverseLerp:Wf,lerp:Gr,damp:Xf,pingpong:Yf,smoothstep:jf,smootherstep:qf,randInt:$f,randFloat:Zf,randFloatSpread:Kf,seededRandom:Jf,degToRad:Qf,radToDeg:em,isPowerOfTwo:tm,ceilPowerOfTwo:nm,floorPowerOfTwo:im,setQuaternionFromProperEuler:sm,normalize:yn,denormalize:tr},me=class i{static{i.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ut(this.x,e.x,t.x),this.y=ut(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ut(this.x,e,t),this.y=ut(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ut(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},mn=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],f=n[s+3],d=r[a+0],m=r[a+1],g=r[a+2],A=r[a+3];if(f!==A||l!==d||c!==m||h!==g){let u=l*d+c*m+h*g+f*A;u<0&&(d=-d,m=-m,g=-g,A=-A,u=-u);let p=1-o;if(u<.9995){let S=Math.acos(u),C=Math.sin(S);p=Math.sin(p*S)/C,o=Math.sin(o*S)/C,l=l*p+d*o,c=c*p+m*o,h=h*p+g*o,f=f*p+A*o}else{l=l*p+d*o,c=c*p+m*o,h=h*p+g*o,f=f*p+A*o;let S=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=S,c*=S,h*=S,f*=S}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],f=r[a],d=r[a+1],m=r[a+2],g=r[a+3];return e[t]=o*g+h*f+l*m-c*d,e[t+1]=l*g+h*d+c*f-o*m,e[t+2]=c*g+h*m+o*d-l*f,e[t+3]=h*g-o*f-l*d-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),f=o(r/2),d=l(n/2),m=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=d*h*f+c*m*g,this._y=c*m*f-d*h*g,this._z=c*h*g+d*m*f,this._w=c*h*f-d*m*g;break;case"YXZ":this._x=d*h*f+c*m*g,this._y=c*m*f-d*h*g,this._z=c*h*g-d*m*f,this._w=c*h*f+d*m*g;break;case"ZXY":this._x=d*h*f-c*m*g,this._y=c*m*f+d*h*g,this._z=c*h*g+d*m*f,this._w=c*h*f-d*m*g;break;case"ZYX":this._x=d*h*f-c*m*g,this._y=c*m*f+d*h*g,this._z=c*h*g-d*m*f,this._w=c*h*f+d*m*g;break;case"YZX":this._x=d*h*f+c*m*g,this._y=c*m*f+d*h*g,this._z=c*h*g-d*m*f,this._w=c*h*f-d*m*g;break;case"XZY":this._x=d*h*f-c*m*g,this._y=c*m*f-d*h*g,this._z=c*h*g+d*m*f,this._w=c*h*f+d*m*g;break;default:nt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],f=t[10],d=n+o+f;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(h-l)*m,this._y=(r-c)*m,this._z=(a-s)*m}else if(n>o&&n>f){let m=2*Math.sqrt(1+n-o-f);this._w=(h-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+c)/m}else if(o>f){let m=2*Math.sqrt(1+o-n-f);this._w=(r-c)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+h)/m}else{let m=2*Math.sqrt(1+f-n-o);this._w=(a-s)/m,this._x=(r+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ut(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},F=class i{static{i.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Pu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Pu.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),h=2*(o*t-r*s),f=2*(r*n-a*t);return this.x=t+l*c+a*f-o*h,this.y=n+l*h+o*c-r*f,this.z=s+l*f+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ut(this.x,e.x,t.x),this.y=ut(this.y,e.y,t.y),this.z=ut(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ut(this.x,e,t),this.y=ut(this.y,e,t),this.z=ut(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ut(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return jc.copy(this).projectOnVector(e),this.sub(jc)}reflect(e){return this.sub(jc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},jc=new F,Pu=new mn,ot=class i{static{i.prototype.isMatrix3=!0}constructor(e,t,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],f=n[7],d=n[2],m=n[5],g=n[8],A=s[0],u=s[3],p=s[6],S=s[1],C=s[4],y=s[7],M=s[2],E=s[5],R=s[8];return r[0]=a*A+o*S+l*M,r[3]=a*u+o*C+l*E,r[6]=a*p+o*y+l*R,r[1]=c*A+h*S+f*M,r[4]=c*u+h*C+f*E,r[7]=c*p+h*y+f*R,r[2]=d*A+m*S+g*M,r[5]=d*u+m*C+g*E,r[8]=d*p+m*y+g*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=h*a-o*c,d=o*l-h*r,m=c*r-a*l,g=t*f+n*d+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let A=1/g;return e[0]=f*A,e[1]=(s*c-h*n)*A,e[2]=(o*n-s*a)*A,e[3]=d*A,e[4]=(h*t-s*l)*A,e[5]=(s*r-o*t)*A,e[6]=m*A,e[7]=(n*l-c*t)*A,e[8]=(a*t-n*r)*A,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return gs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(qc.makeScale(e,t)),this}rotate(e){return gs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(qc.makeRotation(-e)),this}translate(e,t){return gs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(qc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},qc=new ot,Iu=new ot().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Du=new ot().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function rm(){let i={enabled:!0,workingColorSpace:xs,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===St&&(s.r=Pi(s.r),s.g=Pi(s.g),s.b=Pi(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===St&&(s.r=nr(s.r),s.g=nr(s.g),s.b=nr(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Di?jr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return gs("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return gs("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[xs]:{primaries:e,whitePoint:n,transfer:jr,toXYZ:Iu,fromXYZ:Du,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:sn},outputColorSpaceConfig:{drawingBufferColorSpace:sn}},[sn]:{primaries:e,whitePoint:n,transfer:St,toXYZ:Iu,fromXYZ:Du,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:sn}}}),i}var ft=rm();function Pi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function nr(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var zs,Wo=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{zs===void 0&&(zs=ar("canvas")),zs.width=e.width,zs.height=e.height;let s=zs.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=zs}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ar("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Pi(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Pi(t[n]/255)*255):t[n]=Pi(t[n]);return{data:t,width:e.width,height:e.height}}else return nt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},am=0,cr=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:am++}),this.uuid=Cs(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push($c(s[a].image)):r.push($c(s[a]))}else r=$c(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function $c(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Wo.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(nt("Texture: Unable to serialize Texture."),{})}var om=0,Zc=new F,gn=class i extends Zn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Bn,s=Bn,r=zt,a=Ii,o=wn,l=xn,c=i.DEFAULT_ANISOTROPY,h=Di){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:om++}),this.uuid=Cs(),this.name="",this.source=new cr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new me(0,0),this.repeat=new me(1,1),this.center=new me(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ot,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Zc).x}get height(){return this.source.getSize(Zc).y}get depth(){return this.source.getSize(Zc).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){nt(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){nt(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Uh)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case zn:e.x=e.x-Math.floor(e.x);break;case Bn:e.x=e.x<0?0:1;break;case Ho:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case zn:e.y=e.y-Math.floor(e.y);break;case Bn:e.y=e.y<0?0:1;break;case Ho:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};gn.DEFAULT_IMAGE=null;gn.DEFAULT_MAPPING=Uh;gn.DEFAULT_ANISOTROPY=1;var kt=class i{static{i.prototype.isVector4=!0}constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],f=l[8],d=l[1],m=l[5],g=l[9],A=l[2],u=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(f-A)<.01&&Math.abs(g-u)<.01){if(Math.abs(h+d)<.1&&Math.abs(f+A)<.1&&Math.abs(g+u)<.1&&Math.abs(c+m+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let C=(c+1)/2,y=(m+1)/2,M=(p+1)/2,E=(h+d)/4,R=(f+A)/4,v=(g+u)/4;return C>y&&C>M?C<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(C),s=E/n,r=R/n):y>M?y<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),n=E/s,r=v/s):M<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(M),n=R/r,s=v/r),this.set(n,s,r,t),this}let S=Math.sqrt((u-g)*(u-g)+(f-A)*(f-A)+(d-h)*(d-h));return Math.abs(S)<.001&&(S=1),this.x=(u-g)/S,this.y=(f-A)/S,this.z=(d-h)/S,this.w=Math.acos((c+m+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ut(this.x,e.x,t.x),this.y=ut(this.y,e.y,t.y),this.z=ut(this.z,e.z,t.z),this.w=ut(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ut(this.x,e,t),this.y=ut(this.y,e,t),this.z=ut(this.z,e,t),this.w=ut(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ut(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Xo=class extends Zn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:zt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new kt(0,0,e,t),this.scissorTest=!1,this.viewport=new kt(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:n.depth},r=new gn(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:zt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new cr(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ut=class extends Xo{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},qr=class extends gn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=Bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Yo=class extends gn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=Bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Mt=class i{static{i.prototype.isMatrix4=!0}constructor(e,t,n,s,r,a,o,l,c,h,f,d,m,g,A,u){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,h,f,d,m,g,A,u)}set(e,t,n,s,r,a,o,l,c,h,f,d,m,g,A,u){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=f,p[14]=d,p[3]=m,p[7]=g,p[11]=A,p[15]=u,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/Vs.setFromMatrixColumn(e,0).length(),r=1/Vs.setFromMatrixColumn(e,1).length(),a=1/Vs.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),f=Math.sin(r);if(e.order==="XYZ"){let d=a*h,m=a*f,g=o*h,A=o*f;t[0]=l*h,t[4]=-l*f,t[8]=c,t[1]=m+g*c,t[5]=d-A*c,t[9]=-o*l,t[2]=A-d*c,t[6]=g+m*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,m=l*f,g=c*h,A=c*f;t[0]=d+A*o,t[4]=g*o-m,t[8]=a*c,t[1]=a*f,t[5]=a*h,t[9]=-o,t[2]=m*o-g,t[6]=A+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,m=l*f,g=c*h,A=c*f;t[0]=d-A*o,t[4]=-a*f,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*h,t[9]=A-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,m=a*f,g=o*h,A=o*f;t[0]=l*h,t[4]=g*c-m,t[8]=d*c+A,t[1]=l*f,t[5]=A*c+d,t[9]=m*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,m=a*c,g=o*l,A=o*c;t[0]=l*h,t[4]=A-d*f,t[8]=g*f+m,t[1]=f,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=m*f+g,t[10]=d-A*f}else if(e.order==="XZY"){let d=a*l,m=a*c,g=o*l,A=o*c;t[0]=l*h,t[4]=-f,t[8]=c*h,t[1]=d*f+A,t[5]=a*h,t[9]=m*f-g,t[2]=g*f-m,t[6]=o*h,t[10]=A*f+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(lm,e,cm)}lookAt(e,t,n){let s=this.elements;return Rn.subVectors(e,t),Rn.lengthSq()===0&&(Rn.z=1),Rn.normalize(),Bi.crossVectors(n,Rn),Bi.lengthSq()===0&&(Math.abs(n.z)===1?Rn.x+=1e-4:Rn.z+=1e-4,Rn.normalize(),Bi.crossVectors(n,Rn)),Bi.normalize(),ho.crossVectors(Rn,Bi),s[0]=Bi.x,s[4]=ho.x,s[8]=Rn.x,s[1]=Bi.y,s[5]=ho.y,s[9]=Rn.y,s[2]=Bi.z,s[6]=ho.z,s[10]=Rn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],f=n[5],d=n[9],m=n[13],g=n[2],A=n[6],u=n[10],p=n[14],S=n[3],C=n[7],y=n[11],M=n[15],E=s[0],R=s[4],v=s[8],w=s[12],P=s[1],D=s[5],N=s[9],O=s[13],L=s[2],U=s[6],G=s[10],Y=s[14],re=s[3],W=s[7],Z=s[11],ie=s[15];return r[0]=a*E+o*P+l*L+c*re,r[4]=a*R+o*D+l*U+c*W,r[8]=a*v+o*N+l*G+c*Z,r[12]=a*w+o*O+l*Y+c*ie,r[1]=h*E+f*P+d*L+m*re,r[5]=h*R+f*D+d*U+m*W,r[9]=h*v+f*N+d*G+m*Z,r[13]=h*w+f*O+d*Y+m*ie,r[2]=g*E+A*P+u*L+p*re,r[6]=g*R+A*D+u*U+p*W,r[10]=g*v+A*N+u*G+p*Z,r[14]=g*w+A*O+u*Y+p*ie,r[3]=S*E+C*P+y*L+M*re,r[7]=S*R+C*D+y*U+M*W,r[11]=S*v+C*N+y*G+M*Z,r[15]=S*w+C*O+y*Y+M*ie,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],f=e[6],d=e[10],m=e[14],g=e[3],A=e[7],u=e[11],p=e[15],S=l*m-c*d,C=o*m-c*f,y=o*d-l*f,M=a*m-c*h,E=a*d-l*h,R=a*f-o*h;return t*(A*S-u*C+p*y)-n*(g*S-u*M+p*E)+s*(g*C-A*M+p*R)-r*(g*y-A*E+u*R)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=e[9],d=e[10],m=e[11],g=e[12],A=e[13],u=e[14],p=e[15],S=t*o-n*a,C=t*l-s*a,y=t*c-r*a,M=n*l-s*o,E=n*c-r*o,R=s*c-r*l,v=h*A-f*g,w=h*u-d*g,P=h*p-m*g,D=f*u-d*A,N=f*p-m*A,O=d*p-m*u,L=S*O-C*N+y*D+M*P-E*w+R*v;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let U=1/L;return e[0]=(o*O-l*N+c*D)*U,e[1]=(s*N-n*O-r*D)*U,e[2]=(A*R-u*E+p*M)*U,e[3]=(d*E-f*R-m*M)*U,e[4]=(l*P-a*O-c*w)*U,e[5]=(t*O-s*P+r*w)*U,e[6]=(u*y-g*R-p*C)*U,e[7]=(h*R-d*y+m*C)*U,e[8]=(a*N-o*P+c*v)*U,e[9]=(n*P-t*N-r*v)*U,e[10]=(g*E-A*y+p*S)*U,e[11]=(f*y-h*E-m*S)*U,e[12]=(o*w-a*D-l*v)*U,e[13]=(t*D-n*w+s*v)*U,e[14]=(A*C-g*M-u*S)*U,e[15]=(h*M-f*C+d*S)*U,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,f=o+o,d=r*c,m=r*h,g=r*f,A=a*h,u=a*f,p=o*f,S=l*c,C=l*h,y=l*f,M=n.x,E=n.y,R=n.z;return s[0]=(1-(A+p))*M,s[1]=(m+y)*M,s[2]=(g-C)*M,s[3]=0,s[4]=(m-y)*E,s[5]=(1-(d+p))*E,s[6]=(u+S)*E,s[7]=0,s[8]=(g+C)*R,s[9]=(u-S)*R,s[10]=(1-(d+A))*R,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Vs.set(s[0],s[1],s[2]).length(),o=Vs.set(s[4],s[5],s[6]).length(),l=Vs.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Xn.copy(this);let c=1/a,h=1/o,f=1/l;return Xn.elements[0]*=c,Xn.elements[1]*=c,Xn.elements[2]*=c,Xn.elements[4]*=h,Xn.elements[5]*=h,Xn.elements[6]*=h,Xn.elements[8]*=f,Xn.elements[9]*=f,Xn.elements[10]*=f,t.setFromRotationMatrix(Xn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,s,r,a,o=qn,l=!1){let c=this.elements,h=2*r/(t-e),f=2*r/(n-s),d=(t+e)/(t-e),m=(n+s)/(n-s),g,A;if(l)g=r/(a-r),A=a*r/(a-r);else if(o===qn)g=-(a+r)/(a-r),A=-2*a*r/(a-r);else if(o===rr)g=-a/(a-r),A=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=f,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=A,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=qn,l=!1){let c=this.elements,h=2/(t-e),f=2/(n-s),d=-(t+e)/(t-e),m=-(n+s)/(n-s),g,A;if(l)g=1/(a-r),A=a/(a-r);else if(o===qn)g=-2/(a-r),A=-(a+r)/(a-r);else if(o===rr)g=-1/(a-r),A=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=f,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=g,c[14]=A,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Vs=new F,Xn=new Mt,lm=new F(0,0,0),cm=new F(1,1,1),Bi=new F,ho=new F,Rn=new F,Lu=new Mt,Nu=new mn,hi=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],f=s[2],d=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(ut(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ut(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(ut(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-f,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ut(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ut(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-ut(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,m),this._y=0);break;default:nt("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Lu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Lu,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Nu.setFromEuler(this),this.setFromQuaternion(Nu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};hi.DEFAULT_ORDER="XYZ";var hr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},hm=0,ku=new F,Hs=new mn,Si=new Mt,uo=new F,kr=new F,dm=new F,um=new mn,Uu=new F(1,0,0),Fu=new F(0,1,0),Ou=new F(0,0,1),Bu={type:"added"},pm={type:"removed"},Gs={type:"childadded",child:null},Kc={type:"childremoved",child:null},rn=class i extends Zn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:hm++}),this.uuid=Cs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new F,t=new hi,n=new mn,s=new F(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Mt},normalMatrix:{value:new ot}}),this.matrix=new Mt,this.matrixWorld=new Mt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new hr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Hs.setFromAxisAngle(e,t),this.quaternion.multiply(Hs),this}rotateOnWorldAxis(e,t){return Hs.setFromAxisAngle(e,t),this.quaternion.premultiply(Hs),this}rotateX(e){return this.rotateOnAxis(Uu,e)}rotateY(e){return this.rotateOnAxis(Fu,e)}rotateZ(e){return this.rotateOnAxis(Ou,e)}translateOnAxis(e,t){return ku.copy(e).applyQuaternion(this.quaternion),this.position.add(ku.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Uu,e)}translateY(e){return this.translateOnAxis(Fu,e)}translateZ(e){return this.translateOnAxis(Ou,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Si.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?uo.copy(e):uo.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),kr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Si.lookAt(kr,uo,this.up):Si.lookAt(uo,kr,this.up),this.quaternion.setFromRotationMatrix(Si),s&&(Si.extractRotation(s.matrixWorld),Hs.setFromRotationMatrix(Si),this.quaternion.premultiply(Hs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(it("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Bu),Gs.child=e,this.dispatchEvent(Gs),Gs.child=null):it("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(pm),Kc.child=e,this.dispatchEvent(Kc),Kc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Si.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Si.multiply(e.parent.matrixWorld)),e.applyMatrix4(Si),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Bu),Gs.child=e,this.dispatchEvent(Gs),Gs.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(kr,e,dm),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(kr,um,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let f=l[c];r(e.shapes,f)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),f=a(e.shapes),d=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};rn.DEFAULT_UP=new F(0,1,0);rn.DEFAULT_MATRIX_AUTO_UPDATE=!0;rn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var $n=class extends rn{constructor(){super(),this.isGroup=!0,this.type="Group"}},fm={type:"move"},dr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new $n,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new $n,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new F,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new F),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new $n,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new F,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new F,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let A of e.hand.values()){let u=t.getJointPose(A,n),p=this._getHandJoint(c,A);u!==null&&(p.matrix.fromArray(u.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=u.radius),p.visible=u!==null}let h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],d=h.position.distanceTo(f.position),m=.02,g=.005;c.inputState.pinching&&d>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(fm)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new $n;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Vp={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},zi={h:0,s:0,l:0},po={h:0,s:0,l:0};function Jc(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var st=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=sn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ft.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=ft.workingColorSpace){return this.r=e,this.g=t,this.b=n,ft.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=ft.workingColorSpace){if(e=Xh(e,1),t=ut(t,0,1),n=ut(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Jc(a,r,e+1/3),this.g=Jc(a,r,e),this.b=Jc(a,r,e-1/3)}return ft.colorSpaceToWorking(this,s),this}setStyle(e,t=sn){function n(r){r!==void 0&&parseFloat(r)<1&&nt("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:nt("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);nt("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=sn){let n=Vp[e.toLowerCase()];return n!==void 0?this.setHex(n,t):nt("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Pi(e.r),this.g=Pi(e.g),this.b=Pi(e.b),this}copyLinearToSRGB(e){return this.r=nr(e.r),this.g=nr(e.g),this.b=nr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=sn){return ft.workingToColorSpace(pn.copy(this),e),Math.round(ut(pn.r*255,0,255))*65536+Math.round(ut(pn.g*255,0,255))*256+Math.round(ut(pn.b*255,0,255))}getHexString(e=sn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ft.workingColorSpace){ft.workingToColorSpace(pn.copy(this),t);let n=pn.r,s=pn.g,r=pn.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let f=a-o;switch(c=h<=.5?f/(a+o):f/(2-a-o),a){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=ft.workingColorSpace){return ft.workingToColorSpace(pn.copy(this),t),e.r=pn.r,e.g=pn.g,e.b=pn.b,e}getStyle(e=sn){ft.workingToColorSpace(pn.copy(this),e);let t=pn.r,n=pn.g,s=pn.b;return e!==sn?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(zi),this.setHSL(zi.h+e,zi.s+t,zi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(zi),e.getHSL(po);let n=Gr(zi.h,po.h,t),s=Gr(zi.s,po.s,t),r=Gr(zi.l,po.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},pn=new st;st.NAMES=Vp;var $r=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new st(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},_s=class extends rn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new hi,this.environmentIntensity=1,this.environmentRotation=new hi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Yn=new F,wi=new F,Qc=new F,Ei=new F,Ws=new F,Xs=new F,zu=new F,eh=new F,th=new F,nh=new F,ih=new kt,sh=new kt,rh=new kt,Wi=class i{constructor(e=new F,t=new F,n=new F){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Yn.subVectors(e,t),s.cross(Yn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Yn.subVectors(s,t),wi.subVectors(n,t),Qc.subVectors(e,t);let a=Yn.dot(Yn),o=Yn.dot(wi),l=Yn.dot(Qc),c=wi.dot(wi),h=wi.dot(Qc),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;let d=1/f,m=(c*l-o*h)*d,g=(a*h-o*l)*d;return r.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Ei)===null?!1:Ei.x>=0&&Ei.y>=0&&Ei.x+Ei.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,Ei)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ei.x),l.addScaledVector(a,Ei.y),l.addScaledVector(o,Ei.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return ih.setScalar(0),sh.setScalar(0),rh.setScalar(0),ih.fromBufferAttribute(e,t),sh.fromBufferAttribute(e,n),rh.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(ih,r.x),a.addScaledVector(sh,r.y),a.addScaledVector(rh,r.z),a}static isFrontFacing(e,t,n,s){return Yn.subVectors(n,t),wi.subVectors(e,t),Yn.cross(wi).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Yn.subVectors(this.c,this.b),wi.subVectors(this.a,this.b),Yn.cross(wi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;Ws.subVectors(s,n),Xs.subVectors(r,n),eh.subVectors(e,n);let l=Ws.dot(eh),c=Xs.dot(eh);if(l<=0&&c<=0)return t.copy(n);th.subVectors(e,s);let h=Ws.dot(th),f=Xs.dot(th);if(h>=0&&f<=h)return t.copy(s);let d=l*f-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(Ws,a);nh.subVectors(e,r);let m=Ws.dot(nh),g=Xs.dot(nh);if(g>=0&&m<=g)return t.copy(r);let A=m*c-l*g;if(A<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(Xs,o);let u=h*g-m*f;if(u<=0&&f-h>=0&&m-g>=0)return zu.subVectors(r,s),o=(f-h)/(f-h+(m-g)),t.copy(s).addScaledVector(zu,o);let p=1/(u+A+d);return a=A*p,o=d*p,t.copy(n).addScaledVector(Ws,a).addScaledVector(Xs,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Vn=class{constructor(e=new F(1/0,1/0,1/0),t=new F(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(jn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(jn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=jn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,jn):jn.fromBufferAttribute(r,a),jn.applyMatrix4(e.matrixWorld),this.expandByPoint(jn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),fo.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),fo.copy(n.boundingBox)),fo.applyMatrix4(e.matrixWorld),this.union(fo)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,jn),jn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ur),mo.subVectors(this.max,Ur),Ys.subVectors(e.a,Ur),js.subVectors(e.b,Ur),qs.subVectors(e.c,Ur),Vi.subVectors(js,Ys),Hi.subVectors(qs,js),us.subVectors(Ys,qs);let t=[0,-Vi.z,Vi.y,0,-Hi.z,Hi.y,0,-us.z,us.y,Vi.z,0,-Vi.x,Hi.z,0,-Hi.x,us.z,0,-us.x,-Vi.y,Vi.x,0,-Hi.y,Hi.x,0,-us.y,us.x,0];return!ah(t,Ys,js,qs,mo)||(t=[1,0,0,0,1,0,0,0,1],!ah(t,Ys,js,qs,mo))?!1:(go.crossVectors(Vi,Hi),t=[go.x,go.y,go.z],ah(t,Ys,js,qs,mo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,jn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(jn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ti[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ti[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ti[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ti[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ti[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ti[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ti[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ti[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ti),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ti=[new F,new F,new F,new F,new F,new F,new F,new F],jn=new F,fo=new Vn,Ys=new F,js=new F,qs=new F,Vi=new F,Hi=new F,us=new F,Ur=new F,mo=new F,go=new F,ps=new F;function ah(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){ps.fromArray(i,r);let o=s.x*Math.abs(ps.x)+s.y*Math.abs(ps.y)+s.z*Math.abs(ps.z),l=e.dot(ps),c=t.dot(ps),h=n.dot(ps);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Ri=mm();function mm(){let i=new ArrayBuffer(4),e=new Float32Array(i),t=new Uint32Array(i),n=new Uint32Array(512),s=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(n[l]=0,n[l|256]=32768,s[l]=24,s[l|256]=24):c<-14?(n[l]=1024>>-c-14,n[l|256]=1024>>-c-14|32768,s[l]=-c-1,s[l|256]=-c-1):c<=15?(n[l]=c+15<<10,n[l|256]=c+15<<10|32768,s[l]=13,s[l|256]=13):c<128?(n[l]=31744,n[l|256]=64512,s[l]=24,s[l|256]=24):(n[l]=31744,n[l|256]=64512,s[l]=13,s[l|256]=13)}let r=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;(c&8388608)===0;)c<<=1,h-=8388608;c&=-8388609,h+=947912704,r[l]=c|h}for(let l=1024;l<2048;++l)r[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)a[l]=l<<23;a[31]=1199570944,a[32]=2147483648;for(let l=33;l<63;++l)a[l]=2147483648+(l-32<<23);a[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:s,mantissaTable:r,exponentTable:a,offsetTable:o}}function gm(i){Math.abs(i)>65504&&nt("DataUtils.toHalfFloat(): Value out of range."),i=ut(i,-65504,65504),Ri.floatView[0]=i;let e=Ri.uint32View[0],t=e>>23&511;return Ri.baseTable[t]+((e&8388607)>>Ri.shiftTable[t])}function xm(i){let e=i>>10;return Ri.uint32View[0]=Ri.mantissaTable[Ri.offsetTable[e]+(i&1023)]+Ri.exponentTable[e],Ri.floatView[0]}var Xi=class{static toHalfFloat(e){return gm(e)}static fromHalfFloat(e){return xm(e)}},Yt=new F,xo=new me,_m=0,fn=class extends Zn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:_m++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Up,this.updateRanges=[],this.gpuType=bn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)xo.fromBufferAttribute(this,t),xo.applyMatrix3(e),this.setXY(t,xo.x,xo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Yt.fromBufferAttribute(this,t),Yt.applyMatrix3(e),this.setXYZ(t,Yt.x,Yt.y,Yt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Yt.fromBufferAttribute(this,t),Yt.applyMatrix4(e),this.setXYZ(t,Yt.x,Yt.y,Yt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Yt.fromBufferAttribute(this,t),Yt.applyNormalMatrix(e),this.setXYZ(t,Yt.x,Yt.y,Yt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Yt.fromBufferAttribute(this,t),Yt.transformDirection(e),this.setXYZ(t,Yt.x,Yt.y,Yt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=tr(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=yn(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=tr(t,this.array)),t}setX(e,t){return this.normalized&&(t=yn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=tr(t,this.array)),t}setY(e,t){return this.normalized&&(t=yn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=tr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=yn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=tr(t,this.array)),t}setW(e,t){return this.normalized&&(t=yn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=yn(t,this.array),n=yn(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=yn(t,this.array),n=yn(n,this.array),s=yn(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=yn(t,this.array),n=yn(n,this.array),s=yn(s,this.array),r=yn(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Zr=class extends fn{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Kr=class extends fn{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Vt=class extends fn{constructor(e,t,n){super(new Float32Array(e),t,n)}},vm=new Vn,Fr=new F,oh=new F,di=class{constructor(e=new F,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):vm.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Fr.subVectors(e,this.center);let t=Fr.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Fr,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(oh.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Fr.copy(e.center).add(oh)),this.expandByPoint(Fr.copy(e.center).sub(oh))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},ym=0,On=new Mt,lh=new rn,$s=new F,Pn=new Vn,Or=new Vn,nn=new F,ln=class i extends Zn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ym++}),this.uuid=Cs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Vf(e)?Kr:Zr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ot().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return On.makeRotationFromQuaternion(e),this.applyMatrix4(On),this}rotateX(e){return On.makeRotationX(e),this.applyMatrix4(On),this}rotateY(e){return On.makeRotationY(e),this.applyMatrix4(On),this}rotateZ(e){return On.makeRotationZ(e),this.applyMatrix4(On),this}translate(e,t,n){return On.makeTranslation(e,t,n),this.applyMatrix4(On),this}scale(e,t,n){return On.makeScale(e,t,n),this.applyMatrix4(On),this}lookAt(e){return lh.lookAt(e),lh.updateMatrix(),this.applyMatrix4(lh.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter($s).negate(),this.translate($s.x,$s.y,$s.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Vt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&nt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Vn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){it("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new F(-1/0,-1/0,-1/0),new F(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];Pn.setFromBufferAttribute(r),this.morphTargetsRelative?(nn.addVectors(this.boundingBox.min,Pn.min),this.boundingBox.expandByPoint(nn),nn.addVectors(this.boundingBox.max,Pn.max),this.boundingBox.expandByPoint(nn)):(this.boundingBox.expandByPoint(Pn.min),this.boundingBox.expandByPoint(Pn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&it('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new di);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){it("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new F,1/0);return}if(e){let n=this.boundingSphere.center;if(Pn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Or.setFromBufferAttribute(o),this.morphTargetsRelative?(nn.addVectors(Pn.min,Or.min),Pn.expandByPoint(nn),nn.addVectors(Pn.max,Or.max),Pn.expandByPoint(nn)):(Pn.expandByPoint(Or.min),Pn.expandByPoint(Or.max))}Pn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)nn.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(nn));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)nn.fromBufferAttribute(o,c),l&&($s.fromBufferAttribute(e,c),nn.add($s)),s=Math.max(s,n.distanceToSquared(nn))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&it('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){it("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new fn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let v=0;v<n.count;v++)o[v]=new F,l[v]=new F;let c=new F,h=new F,f=new F,d=new me,m=new me,g=new me,A=new F,u=new F;function p(v,w,P){c.fromBufferAttribute(n,v),h.fromBufferAttribute(n,w),f.fromBufferAttribute(n,P),d.fromBufferAttribute(r,v),m.fromBufferAttribute(r,w),g.fromBufferAttribute(r,P),h.sub(c),f.sub(c),m.sub(d),g.sub(d);let D=1/(m.x*g.y-g.x*m.y);isFinite(D)&&(A.copy(h).multiplyScalar(g.y).addScaledVector(f,-m.y).multiplyScalar(D),u.copy(f).multiplyScalar(m.x).addScaledVector(h,-g.x).multiplyScalar(D),o[v].add(A),o[w].add(A),o[P].add(A),l[v].add(u),l[w].add(u),l[P].add(u))}let S=this.groups;S.length===0&&(S=[{start:0,count:e.count}]);for(let v=0,w=S.length;v<w;++v){let P=S[v],D=P.start,N=P.count;for(let O=D,L=D+N;O<L;O+=3)p(e.getX(O+0),e.getX(O+1),e.getX(O+2))}let C=new F,y=new F,M=new F,E=new F;function R(v){M.fromBufferAttribute(s,v),E.copy(M);let w=o[v];C.copy(w),C.sub(M.multiplyScalar(M.dot(w))).normalize(),y.crossVectors(E,w);let D=y.dot(l[v])<0?-1:1;a.setXYZW(v,C.x,C.y,C.z,D)}for(let v=0,w=S.length;v<w;++v){let P=S[v],D=P.start,N=P.count;for(let O=D,L=D+N;O<L;O+=3)R(e.getX(O+0)),R(e.getX(O+1)),R(e.getX(O+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new fn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);let s=new F,r=new F,a=new F,o=new F,l=new F,c=new F,h=new F,f=new F;if(e)for(let d=0,m=e.count;d<m;d+=3){let g=e.getX(d+0),A=e.getX(d+1),u=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,A),a.fromBufferAttribute(t,u),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,A),c.fromBufferAttribute(n,u),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(A,l.x,l.y,l.z),n.setXYZ(u,c.x,c.y,c.z)}else for(let d=0,m=t.count;d<m;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)nn.fromBufferAttribute(e,t),nn.normalize(),e.setXYZ(t,nn.x,nn.y,nn.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,f=o.normalized,d=new c.constructor(l.length*h),m=0,g=0;for(let A=0,u=l.length;A<u;A++){o.isInterleavedBufferAttribute?m=l[A]*o.data.stride+o.offset:m=l[A]*h;for(let p=0;p<h;p++)d[g++]=c[m++]}return new fn(d,h,f)}if(this.index===null)return nt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,f=c.length;h<f;h++){let d=c[h],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let f=0,d=c.length;f<d;f++){let m=c[f];h.push(m.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],f=r[c];for(let d=0,m=f.length;d<m;d++)h.push(f[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var ch=new F,bm=new F,Mm=new ot,In=class{constructor(e=new F(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=ch.subVectors(n,t).cross(bm.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(ch),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Mm.getNormalMatrix(e),s=this.coplanarPoint(ch).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Sm=0,ui=class extends Zn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Sm++}),this.uuid=Cs(),this.name="",this.type="Material",this.blending=yr,this.side=fi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Nh,this.blendDst=kh,this.blendEquation=Gn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new st(0,0,0),this.blendAlpha=0,this.depthFunc=sr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Rp,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=No,this.stencilZFail=No,this.stencilZPass=No,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){nt(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){nt(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new st().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new In().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new me().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new me().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var Ai=new F,hh=new F,_o=new F,vo=new F,vs=class{constructor(e=new F,t=new F(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ai)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Ai.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ai.copy(this.origin).addScaledVector(this.direction,t),Ai.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){hh.copy(e).add(t).multiplyScalar(.5),_o.copy(t).sub(e).normalize(),vo.copy(this.origin).sub(hh);let r=e.distanceTo(t)*.5,a=-this.direction.dot(_o),o=vo.dot(this.direction),l=-vo.dot(_o),c=vo.lengthSq(),h=Math.abs(1-a*a),f,d,m,g;if(h>0)if(f=a*l-o,d=a*o-l,g=r*h,f>=0)if(d>=-g)if(d<=g){let A=1/h;f*=A,d*=A,m=f*(f+a*d+2*o)+d*(a*f+d+2*l)+c}else d=r,f=Math.max(0,-(a*d+o)),m=-f*f+d*(d+2*l)+c;else d=-r,f=Math.max(0,-(a*d+o)),m=-f*f+d*(d+2*l)+c;else d<=-g?(f=Math.max(0,-(-a*r+o)),d=f>0?-r:Math.min(Math.max(-r,-l),r),m=-f*f+d*(d+2*l)+c):d<=g?(f=0,d=Math.min(Math.max(-r,-l),r),m=d*(d+2*l)+c):(f=Math.max(0,-(a*r+o)),d=f>0?r:Math.min(Math.max(-r,-l),r),m=-f*f+d*(d+2*l)+c);else d=a>0?-r:r,f=Math.max(0,-(a*d+o)),m=-f*f+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(hh).addScaledVector(_o,d),m}intersectSphere(e,t){if(e.radius<0)return null;Ai.subVectors(e.center,this.origin);let n=Ai.dot(this.direction),s=Ai.dot(Ai)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,s=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,s=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(e.min.z-d.z)*f,l=(e.max.z-d.z)*f):(o=(e.max.z-d.z)*f,l=(e.min.z-d.z)*f),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Ai)!==null}intersectTriangle(e,t,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,f=e.x-a.x,d=e.y-a.y,m=e.z-a.z,g=t.x-a.x,A=t.y-a.y,u=t.z-a.z,p=n.x-a.x,S=n.y-a.y,C=n.z-a.z,y=Math.abs(l),M=Math.abs(c),E=Math.abs(h),R,v,w,P,D,N,O,L,U,G,Y,re;if(y>=M&&y>=E?(w=l,N=f,U=g,re=p,l>=0?(R=c,v=h,P=d,D=m,O=A,L=u,G=S,Y=C):(R=h,v=c,P=m,D=d,O=u,L=A,G=C,Y=S)):M>=E?(w=c,N=d,U=A,re=S,c>=0?(R=h,v=l,P=m,D=f,O=u,L=g,G=C,Y=p):(R=l,v=h,P=f,D=m,O=g,L=u,G=p,Y=C)):(w=h,N=m,U=u,re=C,h>=0?(R=l,v=c,P=f,D=d,O=g,L=A,G=p,Y=S):(R=c,v=l,P=d,D=f,O=A,L=g,G=S,Y=p)),w===0)return null;let W=R/w,Z=v/w,ie=1/w,xe=P-W*N,be=D-Z*N,pe=O-W*U,K=L-Z*U,Je=G-W*re,J=Y-Z*re,se=Je*K-J*pe,ce=xe*J-be*Je,Ye=pe*be-K*xe;if(s){if(se<0||ce<0||Ye<0)return null}else if((se<0||ce<0||Ye<0)&&(se>0||ce>0||Ye>0))return null;let Le=se+ce+Ye;if(Le===0)return null;let Qe=ie*(se*N+ce*U+Ye*re);return(Le>0?Qe<0:Qe>0)?null:this.at(Qe/Le,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ys=class extends ui{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new st(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hi,this.combine=gl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Vu=new Mt,fs=new vs,yo=new di,Hu=new F,bo=new F,Mo=new F,So=new F,dh=new F,wo=new F,Gu=new F,Eo=new F,mt=class extends rn{constructor(e=new ln,t=new ys){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){wo.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],f=r[l];h!==0&&(dh.fromBufferAttribute(f,e),a?wo.addScaledVector(dh,h):wo.addScaledVector(dh.sub(t),h))}t.add(wo)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),yo.copy(n.boundingSphere),yo.applyMatrix4(r),fs.copy(e.ray).recast(e.near),!(yo.containsPoint(fs.origin)===!1&&(fs.intersectSphere(yo,Hu)===null||fs.origin.distanceToSquared(Hu)>(e.far-e.near)**2))&&(Vu.copy(r).invert(),fs.copy(e.ray).applyMatrix4(Vu),!(n.boundingBox!==null&&fs.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,fs)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,f=r.attributes.normal,d=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,A=d.length;g<A;g++){let u=d[g],p=a[u.materialIndex],S=Math.max(u.start,m.start),C=Math.min(o.count,Math.min(u.start+u.count,m.start+m.count));for(let y=S,M=C;y<M;y+=3){let E=o.getX(y),R=o.getX(y+1),v=o.getX(y+2);s=To(this,p,e,n,c,h,f,E,R,v),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=u.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),A=Math.min(o.count,m.start+m.count);for(let u=g,p=A;u<p;u+=3){let S=o.getX(u),C=o.getX(u+1),y=o.getX(u+2);s=To(this,a,e,n,c,h,f,S,C,y),s&&(s.faceIndex=Math.floor(u/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,A=d.length;g<A;g++){let u=d[g],p=a[u.materialIndex],S=Math.max(u.start,m.start),C=Math.min(l.count,Math.min(u.start+u.count,m.start+m.count));for(let y=S,M=C;y<M;y+=3){let E=y,R=y+1,v=y+2;s=To(this,p,e,n,c,h,f,E,R,v),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=u.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),A=Math.min(l.count,m.start+m.count);for(let u=g,p=A;u<p;u+=3){let S=u,C=u+1,y=u+2;s=To(this,a,e,n,c,h,f,S,C,y),s&&(s.faceIndex=Math.floor(u/3),t.push(s))}}}};function wm(i,e,t,n,s,r,a,o){let l;if(e.side===Zt?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===fi,o),l===null)return null;Eo.copy(o),Eo.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Eo);return c<t.near||c>t.far?null:{distance:c,point:Eo.clone(),object:i}}function To(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,bo),i.getVertexPosition(l,Mo),i.getVertexPosition(c,So);let h=wm(i,e,t,n,bo,Mo,So,Gu);if(h){let f=new F;Wi.getBarycoord(Gu,bo,Mo,So,f),s&&(h.uv=Wi.getInterpolatedAttribute(s,o,l,c,f,new me)),r&&(h.uv1=Wi.getInterpolatedAttribute(r,o,l,c,f,new me)),a&&(h.normal=Wi.getInterpolatedAttribute(a,o,l,c,f,new F),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a:o,b:l,c,normal:new F,materialIndex:0};Wi.getNormal(bo,Mo,So,d.normal),h.face=d,h.barycoord=f}return h}var Kn=class extends gn{constructor(e=null,t=1,n=1,s,r,a,o,l,c=Ht,h=Ht,f,d){super(null,a,o,l,c,h,s,r,f,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Jr=class extends fn{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Zs=new Mt,Wu=new Mt,Ao=[],Xu=new Vn,Em=new Mt,Br=new mt,zr=new di,Qr=class extends mt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Jr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Em)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Vn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Zs),Xu.copy(e.boundingBox).applyMatrix4(Zs),this.boundingBox.union(Xu)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new di),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Zs),zr.copy(e.boundingSphere).applyMatrix4(Zs),this.boundingSphere.union(zr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Br.geometry=this.geometry,Br.material=this.material,Br.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),zr.copy(this.boundingSphere),zr.applyMatrix4(n),e.ray.intersectsSphere(zr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Zs),Wu.multiplyMatrices(n,Zs),Br.matrixWorld=Wu,Br.raycast(e,Ao);for(let a=0,o=Ao.length;a<o;a++){let l=Ao[a];l.instanceId=r,l.object=this,t.push(l)}Ao.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Jr(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Kn(new Float32Array(s*this.count),s,this.count,Ml,bn));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},ms=new di,Tm=new me(.5,.5),Co=new F,ur=class{constructor(e=new In,t=new In,n=new In,s=new In,r=new In,a=new In){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=qn,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],f=r[5],d=r[6],m=r[7],g=r[8],A=r[9],u=r[10],p=r[11],S=r[12],C=r[13],y=r[14],M=r[15];if(s[0].setComponents(c-a,m-h,p-g,M-S).normalize(),s[1].setComponents(c+a,m+h,p+g,M+S).normalize(),s[2].setComponents(c+o,m+f,p+A,M+C).normalize(),s[3].setComponents(c-o,m-f,p-A,M-C).normalize(),n)s[4].setComponents(l,d,u,y).normalize(),s[5].setComponents(c-l,m-d,p-u,M-y).normalize();else if(s[4].setComponents(c-l,m-d,p-u,M-y).normalize(),t===qn)s[5].setComponents(c+l,m+d,p+u,M+y).normalize();else if(t===rr)s[5].setComponents(l,d,u,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ms.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ms.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ms)}intersectsSprite(e){ms.center.set(0,0,0);let t=Tm.distanceTo(e.center);return ms.radius=.7071067811865476+t,ms.applyMatrix4(e.matrixWorld),this.intersectsSphere(ms)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Co.x=s.normal.x>0?e.max.x:e.min.x,Co.y=s.normal.y>0?e.max.y:e.min.y,Co.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Co)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ea=class extends gn{constructor(e=[],t=ns,n,s,r,a,o,l,c,h){super(e,t,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},pr=class extends gn{constructor(e,t,n,s,r,a,o,l,c){super(e,t,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var pi=class extends gn{constructor(e,t,n=Qn,s,r,a,o=Ht,l=Ht,c,h=ci,f=1){if(h!==ci&&h!==mi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:f};super(d,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new cr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},jo=class extends pi{constructor(e,t=Qn,n=ns,s,r,a=Ht,o=Ht,l,c=ci){let h={width:e,height:e,depth:1},f=[h,h,h,h,h,h];super(e,e,t,n,s,r,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ta=class extends gn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Yi=class i extends ln{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],f=[],d=0,m=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Vt(c,3)),this.setAttribute("normal",new Vt(h,3)),this.setAttribute("uv",new Vt(f,2));function g(A,u,p,S,C,y,M,E,R,v,w){let P=y/R,D=M/v,N=y/2,O=M/2,L=E/2,U=R+1,G=v+1,Y=0,re=0,W=new F;for(let Z=0;Z<G;Z++){let ie=Z*D-O;for(let xe=0;xe<U;xe++){let be=xe*P-N;W[A]=be*S,W[u]=ie*C,W[p]=L,c.push(W.x,W.y,W.z),W[A]=0,W[u]=0,W[p]=E>0?1:-1,h.push(W.x,W.y,W.z),f.push(xe/R),f.push(1-Z/v),Y+=1}}for(let Z=0;Z<v;Z++)for(let ie=0;ie<R;ie++){let xe=d+ie+U*Z,be=d+ie+U*(Z+1),pe=d+(ie+1)+U*(Z+1),K=d+(ie+1)+U*Z;l.push(xe,be,K),l.push(be,pe,K),re+=6}o.addGroup(m,re,w),m+=re,d+=Y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var na=class i extends ln{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],f=[],d=[],m=[],g=0,A=[],u=n/2,p=0;S(),a===!1&&(e>0&&C(!0),t>0&&C(!1)),this.setIndex(h),this.setAttribute("position",new Vt(f,3)),this.setAttribute("normal",new Vt(d,3)),this.setAttribute("uv",new Vt(m,2));function S(){let y=new F,M=new F,E=0,R=(t-e)/n;for(let v=0;v<=r;v++){let w=[],P=v/r,D=P*(t-e)+e;for(let N=0;N<=s;N++){let O=N/s,L=O*l+o,U=Math.sin(L),G=Math.cos(L);M.x=D*U,M.y=-P*n+u,M.z=D*G,f.push(M.x,M.y,M.z),y.set(U,R,G).normalize(),d.push(y.x,y.y,y.z),m.push(O,1-P),w.push(g++)}A.push(w)}for(let v=0;v<s;v++)for(let w=0;w<r;w++){let P=A[w][v],D=A[w+1][v],N=A[w+1][v+1],O=A[w][v+1];(e>0||w!==0)&&(h.push(P,D,O),E+=3),(t>0||w!==r-1)&&(h.push(D,N,O),E+=3)}c.addGroup(p,E,0),p+=E}function C(y){let M=g,E=new me,R=new F,v=0,w=y===!0?e:t,P=y===!0?1:-1;for(let N=1;N<=s;N++)f.push(0,u*P,0),d.push(0,P,0),m.push(.5,.5),g++;let D=g;for(let N=0;N<=s;N++){let L=N/s*l+o,U=Math.cos(L),G=Math.sin(L);R.x=w*G,R.y=u*P,R.z=w*U,f.push(R.x,R.y,R.z),d.push(0,P,0),E.x=U*.5+.5,E.y=G*.5*P+.5,m.push(E.x,E.y),g++}for(let N=0;N<s;N++){let O=M+N,L=D+N;y===!0?h.push(L,L+1,O):h.push(L+1,L,O),v+=3}c.addGroup(p,v,y===!0?1:2),p+=v}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Dn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){nt("Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,s=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(s),t.push(r),s=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),s=0,r=n.length,a;t?a=t:a=e*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);let h=n[s],d=n[s+1]-h,m=(a-h)/d;return(s+m)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=t||(a.isVector2?new me:new F);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new F,s=[],r=[],a=[],o=new F,l=new Mt;for(let m=0;m<=e;m++){let g=m/e;s[m]=this.getTangentAt(g,new F)}r[0]=new F,a[0]=new F;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),f=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),f<=c&&(c=f,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let m=1;m<=e;m++){if(r[m]=r[m-1].clone(),a[m]=a[m-1].clone(),o.crossVectors(s[m-1],s[m]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(ut(s[m-1].dot(s[m]),-1,1));r[m].applyMatrix4(l.makeRotationAxis(o,g))}a[m].crossVectors(s[m],r[m])}if(t===!0){let m=Math.acos(ut(r[0].dot(r[e]),-1,1));m/=e,s[0].dot(o.crossVectors(r[0],r[e]))>0&&(m=-m);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],m*g)),a[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},fr=class extends Dn{constructor(e=0,t=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new me){let n=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),f=Math.sin(this.aRotation),d=l-this.aX,m=c-this.aY;l=d*h-m*f+this.aX,c=d*f+m*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},qo=class extends fr{constructor(e,t,n,s,r,a){super(e,t,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Yh(){let i=0,e=0,t=0,n=0;function s(r,a,o,l){i=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,f){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,m=(o-a)/h-(l-a)/(h+f)+(l-o)/f;d*=h,m*=h,s(a,o,d,m)},calc:function(r){let a=r*r,o=a*r;return i+e*r+t*a+n*o}}}var Yu=new F,ju=new F,uh=new Yh,ph=new Yh,fh=new Yh,$o=class extends Dn{constructor(e=[],t=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=s}getPoint(e,t=new F){let n=t,s=this.points,r=s.length,a=(r-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(ju.subVectors(s[0],s[1]).add(s[0]),c=ju);let f=s[o%r],d=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(Yu.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Yu),this.curveType==="centripetal"||this.curveType==="chordal"){let m=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(f),m),A=Math.pow(f.distanceToSquared(d),m),u=Math.pow(d.distanceToSquared(h),m);A<1e-4&&(A=1),g<1e-4&&(g=A),u<1e-4&&(u=A),uh.initNonuniformCatmullRom(c.x,f.x,d.x,h.x,g,A,u),ph.initNonuniformCatmullRom(c.y,f.y,d.y,h.y,g,A,u),fh.initNonuniformCatmullRom(c.z,f.z,d.z,h.z,g,A,u)}else this.curveType==="catmullrom"&&(uh.initCatmullRom(c.x,f.x,d.x,h.x,this.tension),ph.initCatmullRom(c.y,f.y,d.y,h.y,this.tension),fh.initCatmullRom(c.z,f.z,d.z,h.z,this.tension));return n.set(uh.calc(l),ph.calc(l),fh.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new F().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function qu(i,e,t,n,s){let r=(n-e)*.5,a=(s-t)*.5,o=i*i,l=i*o;return(2*t-2*n+r+a)*l+(-3*t+3*n-2*r-a)*o+r*i+t}function Am(i,e){let t=1-i;return t*t*e}function Cm(i,e){return 2*(1-i)*i*e}function Rm(i,e){return i*i*e}function Wr(i,e,t,n){return Am(i,e)+Cm(i,t)+Rm(i,n)}function Pm(i,e){let t=1-i;return t*t*t*e}function Im(i,e){let t=1-i;return 3*t*t*i*e}function Dm(i,e){return 3*(1-i)*i*i*e}function Lm(i,e){return i*i*i*e}function Xr(i,e,t,n,s){return Pm(i,e)+Im(i,t)+Dm(i,n)+Lm(i,s)}var ia=class extends Dn{constructor(e=new me,t=new me,n=new me,s=new me){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new me){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Xr(e,s.x,r.x,a.x,o.x),Xr(e,s.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Zo=class extends Dn{constructor(e=new F,t=new F,n=new F,s=new F){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new F){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Xr(e,s.x,r.x,a.x,o.x),Xr(e,s.y,r.y,a.y,o.y),Xr(e,s.z,r.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},sa=class extends Dn{constructor(e=new me,t=new me){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new me){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new me){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ko=class extends Dn{constructor(e=new F,t=new F){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new F){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new F){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ra=class extends Dn{constructor(e=new me,t=new me,n=new me){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new me){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(Wr(e,s.x,r.x,a.x),Wr(e,s.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Jo=class extends Dn{constructor(e=new F,t=new F,n=new F){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new F){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(Wr(e,s.x,r.x,a.x),Wr(e,s.y,r.y,a.y),Wr(e,s.z,r.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},aa=class extends Dn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new me){let n=t,s=this.points,r=(s.length-1)*e,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],f=s[a>s.length-3?s.length-1:a+2];return n.set(qu(o,l.x,c.x,h.x,f.x),qu(o,l.y,c.y,h.y,f.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new me().fromArray(s))}return this}},bh=Object.freeze({__proto__:null,ArcCurve:qo,CatmullRomCurve3:$o,CubicBezierCurve:ia,CubicBezierCurve3:Zo,EllipseCurve:fr,LineCurve:sa,LineCurve3:Ko,QuadraticBezierCurve:ra,QuadraticBezierCurve3:Jo,SplineCurve:aa}),Qo=class extends Dn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new bh[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,s=this.curves.length;n<s;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(new bh[s.type]().fromJSON(s))}return this}},bs=class extends Qo{constructor(e){super(),this.type="Path",this.currentPoint=new me,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new sa(this.currentPoint.clone(),new me(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,s){let r=new ra(this.currentPoint.clone(),new me(e,t),new me(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(e,t,n,s,r,a){let o=new ia(this.currentPoint.clone(),new me(e,t),new me(n,s),new me(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new aa(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,s,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,s,r,a),this}absarc(e,t,n,s,r,a){return this.absellipse(e,t,n,n,s,r,a),this}ellipse(e,t,n,s,r,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,s,r,a,o,l),this}absellipse(e,t,n,s,r,a,o,l){let c=new fr(e,t,n,s,r,a,o,l);if(this.curves.length>0){let f=c.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Ms=class extends bs{constructor(e){super(e),this.uuid=Cs(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,s=this.holes.length;n<s;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(new bs().fromJSON(s))}return this}};function Nm(i,e,t=2){let n=e&&e.length,s=n?e[0]*t:i.length,r=Hp(i,0,s,t,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c;if(n&&(r=Bm(i,e,r,t)),i.length>80*t){o=i[0],l=i[1];let h=o,f=l;for(let d=t;d<s;d+=t){let m=i[d],g=i[d+1];m<o&&(o=m),g<l&&(l=g),m>h&&(h=m),g>f&&(f=g)}c=Math.max(h-o,f-l),c=c!==0?32767/c:0}return oa(r,a,t,o,l,c,0),a}function Hp(i,e,t,n,s){let r;if(s===Zm(i,e,t,n)>0)for(let a=e;a<t;a+=n)r=$u(a/n|0,i[a],i[a+1],r);else for(let a=t-n;a>=e;a-=n)r=$u(a/n|0,i[a],i[a+1],r);return r&&mr(r,r.next)&&(ca(r),r=r.next),r}function Ss(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(mr(t,t.next)||Bt(t.prev,t,t.next)===0)){if(ca(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function oa(i,e,t,n,s,r,a){if(!i)return;!a&&r&&Wm(i,n,s,r);let o=i;for(;i.prev!==i.next;){let l=i.prev,c=i.next;if(r?Um(i,n,s,r):km(i)){e.push(l.i,i.i,c.i),ca(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=Fm(Ss(i),e),oa(i,e,t,n,s,r,2)):a===2&&Om(i,e,t,n,s,r):oa(Ss(i),e,t,n,s,r,1);break}}}function km(i){let e=i.prev,t=i,n=i.next;if(Bt(e,t,n)>=0)return!1;let s=e.x,r=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=Math.min(s,r,a),f=Math.min(o,l,c),d=Math.max(s,r,a),m=Math.max(o,l,c),g=n.next;for(;g!==e;){if(g.x>=h&&g.x<=d&&g.y>=f&&g.y<=m&&Vr(s,o,r,l,a,c,g.x,g.y)&&Bt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Um(i,e,t,n){let s=i.prev,r=i,a=i.next;if(Bt(s,r,a)>=0)return!1;let o=s.x,l=r.x,c=a.x,h=s.y,f=r.y,d=a.y,m=Math.min(o,l,c),g=Math.min(h,f,d),A=Math.max(o,l,c),u=Math.max(h,f,d),p=Mh(m,g,e,t,n),S=Mh(A,u,e,t,n),C=i.prevZ,y=i.nextZ;for(;C&&C.z>=p&&y&&y.z<=S;){if(C.x>=m&&C.x<=A&&C.y>=g&&C.y<=u&&C!==s&&C!==a&&Vr(o,h,l,f,c,d,C.x,C.y)&&Bt(C.prev,C,C.next)>=0||(C=C.prevZ,y.x>=m&&y.x<=A&&y.y>=g&&y.y<=u&&y!==s&&y!==a&&Vr(o,h,l,f,c,d,y.x,y.y)&&Bt(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;C&&C.z>=p;){if(C.x>=m&&C.x<=A&&C.y>=g&&C.y<=u&&C!==s&&C!==a&&Vr(o,h,l,f,c,d,C.x,C.y)&&Bt(C.prev,C,C.next)>=0)return!1;C=C.prevZ}for(;y&&y.z<=S;){if(y.x>=m&&y.x<=A&&y.y>=g&&y.y<=u&&y!==s&&y!==a&&Vr(o,h,l,f,c,d,y.x,y.y)&&Bt(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function Fm(i,e){let t=i;do{let n=t.prev,s=t.next.next;!mr(n,s)&&Wp(n,t,t.next,s)&&la(n,s)&&la(s,n)&&(e.push(n.i,t.i,s.i),ca(t),ca(t.next),t=i=s),t=t.next}while(t!==i);return Ss(t)}function Om(i,e,t,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&jm(a,o)){let l=Xp(a,o);a=Ss(a,a.next),l=Ss(l,l.next),oa(a,e,t,n,s,r,0),oa(l,e,t,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function Bm(i,e,t,n){let s=[];for(let r=0,a=e.length;r<a;r++){let o=e[r]*n,l=r<a-1?e[r+1]*n:i.length,c=Hp(i,o,l,n,!1);c===c.next&&(c.steiner=!0),s.push(Ym(c))}s.sort(zm);for(let r=0;r<s.length;r++)t=Vm(s[r],t);return t}function zm(i,e){let t=i.x-e.x;if(t===0&&(t=i.y-e.y,t===0)){let n=(i.next.y-i.y)/(i.next.x-i.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=n-s}return t}function Vm(i,e){let t=Hm(i,e);if(!t)return e;let n=Xp(t,i);return Ss(n,n.next),Ss(t,t.next)}function Hm(i,e){let t=e,n=i.x,s=i.y,r=-1/0,a;if(mr(i,t))return t;do{if(mr(i,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){let f=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(f<=n&&f>r&&(r=f,a=t.x<t.next.x?t:t.next,f===n))return a}t=t.next}while(t!==e);if(!a)return null;let o=a,l=a.x,c=a.y,h=1/0;t=a;do{if(n>=t.x&&t.x>=l&&n!==t.x&&Gp(s<c?n:r,s,l,c,s<c?r:n,s,t.x,t.y)){let f=Math.abs(s-t.y)/(n-t.x);la(t,i)&&(f<h||f===h&&(t.x>a.x||t.x===a.x&&Gm(a,t)))&&(a=t,h=f)}t=t.next}while(t!==o);return a}function Gm(i,e){return Bt(i.prev,i,e.prev)<0&&Bt(e.next,i,i.next)<0}function Wm(i,e,t,n){let s=i;do s.z===0&&(s.z=Mh(s.x,s.y,e,t,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Xm(s)}function Xm(i){let e,t=1;do{let n=i,s;i=null;let r=null;for(e=0;n;){e++;let a=n,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(s=n,n=n.nextZ,o--):(s=a,a=a.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=a}r.nextZ=null,t*=2}while(e>1);return i}function Mh(i,e,t,n,s){return i=(i-t)*s|0,e=(e-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function Ym(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function Gp(i,e,t,n,s,r,a,o){return(s-a)*(e-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(s-a)*(n-o)}function Vr(i,e,t,n,s,r,a,o){return!(i===a&&e===o)&&Gp(i,e,t,n,s,r,a,o)}function jm(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!qm(i,e)&&(la(i,e)&&la(e,i)&&$m(i,e)&&(Bt(i.prev,i,e.prev)||Bt(i,e.prev,e))||mr(i,e)&&Bt(i.prev,i,i.next)>0&&Bt(e.prev,e,e.next)>0)}function Bt(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function mr(i,e){return i.x===e.x&&i.y===e.y}function Wp(i,e,t,n){let s=Po(Bt(i,e,t)),r=Po(Bt(i,e,n)),a=Po(Bt(t,n,i)),o=Po(Bt(t,n,e));return!!(s!==r&&a!==o||s===0&&Ro(i,t,e)||r===0&&Ro(i,n,e)||a===0&&Ro(t,i,n)||o===0&&Ro(t,e,n))}function Ro(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function Po(i){return i>0?1:i<0?-1:0}function qm(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&Wp(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function la(i,e){return Bt(i.prev,i,i.next)<0?Bt(i,e,i.next)>=0&&Bt(i,i.prev,e)>=0:Bt(i,e,i.prev)<0||Bt(i,i.next,e)<0}function $m(i,e){let t=i,n=!1,s=(i.x+e.x)/2,r=(i.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function Xp(i,e){let t=Sh(i.i,i.x,i.y),n=Sh(e.i,e.x,e.y),s=i.next,r=e.prev;return i.next=e,e.prev=i,t.next=s,s.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function $u(i,e,t,n){let s=Sh(i,e,t);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function ca(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Sh(i,e,t){return{i,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Zm(i,e,t,n){let s=0;for(let r=e,a=t-n;r<t;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}var wh=class{static triangulate(e,t,n=2){return Nm(e,t,n)}},li=class i{static area(e){let t=e.length,n=0;for(let s=t-1,r=0;r<t;s=r++)n+=e[s].x*e[r].y-e[r].x*e[s].y;return n*.5}static isClockWise(e){return i.area(e)<0}static triangulateShape(e,t){let n=[],s=[],r=[];Zu(e),Ku(n,e);let a=e.length;t.forEach(Zu);for(let l=0;l<t.length;l++)s.push(a),a+=t[l].length,Ku(n,t[l]);let o=wh.triangulate(n,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function Zu(i){let e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function Ku(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}var ha=class i extends ln{constructor(e=new Ms([new me(.5,.5),new me(-.5,.5),new me(-.5,-.5),new me(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,s=[],r=[];for(let o=0,l=e.length;o<l;o++){let c=e[o];a(c)}this.setAttribute("position",new Vt(s,3)),this.setAttribute("uv",new Vt(r,2)),this.computeVertexNormals();function a(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,f=t.depth!==void 0?t.depth:1,d=t.bevelEnabled!==void 0?t.bevelEnabled:!0,m=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:m-.1,A=t.bevelOffset!==void 0?t.bevelOffset:0,u=t.bevelSegments!==void 0?t.bevelSegments:3,p=t.extrudePath,S=t.UVGenerator!==void 0?t.UVGenerator:Km,C,y=!1,M,E,R,v;if(p){C=p.getSpacedPoints(h),y=!0,d=!1;let ae=p.isCatmullRomCurve3?p.closed:!1;M=p.computeFrenetFrames(h,ae),E=new F,R=new F,v=new F}d||(u=0,m=0,g=0,A=0);let w=o.extractPoints(c),P=w.shape,D=w.holes;if(!li.isClockWise(P)){P=P.reverse();for(let ae=0,de=D.length;ae<de;ae++){let _e=D[ae];li.isClockWise(_e)&&(D[ae]=_e.reverse())}}function O(ae){let _e=10000000000000001e-36,Me=ae[0];for(let Ae=1;Ae<=ae.length;Ae++){let je=Ae%ae.length,ve=ae[je],Pe=ve.x-Me.x,Be=ve.y-Me.y,k=Pe*Pe+Be*Be,ht=Math.max(Math.abs(ve.x),Math.abs(ve.y),Math.abs(Me.x),Math.abs(Me.y)),he=_e*ht*ht;if(k<=he){ae.splice(je,1),Ae--;continue}Me=ve}}O(P),D.forEach(O);let L=D.length,U=P;for(let ae=0;ae<L;ae++){let de=D[ae];P=P.concat(de)}function G(ae,de,_e){return de||it("ExtrudeGeometry: vec does not exist"),ae.clone().addScaledVector(de,_e)}let Y=P.length;function re(ae,de,_e){let Me,Ae,je,ve=ae.x-de.x,Pe=ae.y-de.y,Be=_e.x-ae.x,k=_e.y-ae.y,ht=ve*ve+Pe*Pe,he=ve*k-Pe*Be;if(Math.abs(he)>Number.EPSILON){let I=Math.sqrt(ht),b=Math.sqrt(Be*Be+k*k),V=de.x-Pe/I,j=de.y+ve/I,ne=_e.x-k/b,ye=_e.y+Be/b,Te=((ne-V)*k-(ye-j)*Be)/(ve*k-Pe*Be);Me=V+ve*Te-ae.x,Ae=j+Pe*Te-ae.y;let H=Me*Me+Ae*Ae;if(H<=2)return new me(Me,Ae);je=Math.sqrt(H/2)}else{let I=!1;ve>Number.EPSILON?Be>Number.EPSILON&&(I=!0):ve<-Number.EPSILON?Be<-Number.EPSILON&&(I=!0):Math.sign(Pe)===Math.sign(k)&&(I=!0),I?(Me=-Pe,Ae=ve,je=Math.sqrt(ht)):(Me=ve,Ae=Pe,je=Math.sqrt(ht/2))}return new me(Me/je,Ae/je)}let W=[];for(let ae=0,de=U.length,_e=de-1,Me=ae+1;ae<de;ae++,_e++,Me++)_e===de&&(_e=0),Me===de&&(Me=0),W[ae]=re(U[ae],U[_e],U[Me]);let Z=[],ie,xe=W.concat();for(let ae=0,de=L;ae<de;ae++){let _e=D[ae];ie=[];for(let Me=0,Ae=_e.length,je=Ae-1,ve=Me+1;Me<Ae;Me++,je++,ve++)je===Ae&&(je=0),ve===Ae&&(ve=0),ie[Me]=re(_e[Me],_e[je],_e[ve]);Z.push(ie),xe=xe.concat(ie)}let be;if(u===0)be=li.triangulateShape(U,D);else{let ae=[],de=[];for(let _e=0;_e<u;_e++){let Me=_e/u,Ae=m*Math.cos(Me*Math.PI/2),je=g*Math.sin(Me*Math.PI/2)+A;for(let ve=0,Pe=U.length;ve<Pe;ve++){let Be=G(U[ve],W[ve],je);ce(Be.x,Be.y,-Ae),Me===0&&ae.push(Be)}for(let ve=0,Pe=L;ve<Pe;ve++){let Be=D[ve];ie=Z[ve];let k=[];for(let ht=0,he=Be.length;ht<he;ht++){let I=G(Be[ht],ie[ht],je);ce(I.x,I.y,-Ae),Me===0&&k.push(I)}Me===0&&de.push(k)}}be=li.triangulateShape(ae,de)}let pe=be.length,K=g+A;for(let ae=0;ae<Y;ae++){let de=d?G(P[ae],xe[ae],K):P[ae];y?(R.copy(M.normals[0]).multiplyScalar(de.x),E.copy(M.binormals[0]).multiplyScalar(de.y),v.copy(C[0]).add(R).add(E),ce(v.x,v.y,v.z)):ce(de.x,de.y,0)}for(let ae=1;ae<=h;ae++)for(let de=0;de<Y;de++){let _e=d?G(P[de],xe[de],K):P[de];y?(R.copy(M.normals[ae]).multiplyScalar(_e.x),E.copy(M.binormals[ae]).multiplyScalar(_e.y),v.copy(C[ae]).add(R).add(E),ce(v.x,v.y,v.z)):ce(_e.x,_e.y,f/h*ae)}for(let ae=u-1;ae>=0;ae--){let de=ae/u,_e=m*Math.cos(de*Math.PI/2),Me=g*Math.sin(de*Math.PI/2)+A;for(let Ae=0,je=U.length;Ae<je;Ae++){let ve=G(U[Ae],W[Ae],Me);ce(ve.x,ve.y,f+_e)}for(let Ae=0,je=D.length;Ae<je;Ae++){let ve=D[Ae];ie=Z[Ae];for(let Pe=0,Be=ve.length;Pe<Be;Pe++){let k=G(ve[Pe],ie[Pe],Me);y?ce(k.x,k.y+C[h-1].y,C[h-1].x+_e):ce(k.x,k.y,f+_e)}}}Je(),J();function Je(){let ae=s.length/3;if(d){let de=0,_e=Y*de;for(let Me=0;Me<pe;Me++){let Ae=be[Me];Ye(Ae[2]+_e,Ae[1]+_e,Ae[0]+_e)}de=h+u*2,_e=Y*de;for(let Me=0;Me<pe;Me++){let Ae=be[Me];Ye(Ae[0]+_e,Ae[1]+_e,Ae[2]+_e)}}else{for(let de=0;de<pe;de++){let _e=be[de];Ye(_e[2],_e[1],_e[0])}for(let de=0;de<pe;de++){let _e=be[de];Ye(_e[0]+Y*h,_e[1]+Y*h,_e[2]+Y*h)}}n.addGroup(ae,s.length/3-ae,0)}function J(){let ae=s.length/3,de=0;se(U,de),de+=U.length;for(let _e=0,Me=D.length;_e<Me;_e++){let Ae=D[_e];se(Ae,de),de+=Ae.length}n.addGroup(ae,s.length/3-ae,1)}function se(ae,de){let _e=ae.length;for(;--_e>=0;){let Me=_e,Ae=_e-1;Ae<0&&(Ae=ae.length-1);for(let je=0,ve=h+u*2;je<ve;je++){let Pe=Y*je,Be=Y*(je+1),k=de+Me+Pe,ht=de+Ae+Pe,he=de+Ae+Be,I=de+Me+Be;Le(k,ht,he,I)}}}function ce(ae,de,_e){l.push(ae),l.push(de),l.push(_e)}function Ye(ae,de,_e){Qe(ae),Qe(de),Qe(_e);let Me=s.length/3,Ae=S.generateTopUV(n,s,Me-3,Me-2,Me-1);ct(Ae[0]),ct(Ae[1]),ct(Ae[2])}function Le(ae,de,_e,Me){Qe(ae),Qe(de),Qe(Me),Qe(de),Qe(_e),Qe(Me);let Ae=s.length/3,je=S.generateSideWallUV(n,s,Ae-6,Ae-3,Ae-2,Ae-1);ct(je[0]),ct(je[1]),ct(je[3]),ct(je[1]),ct(je[2]),ct(je[3])}function Qe(ae){s.push(l[ae*3+0]),s.push(l[ae*3+1]),s.push(l[ae*3+2])}function ct(ae){r.push(ae.x),r.push(ae.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Jm(t,n,e)}static fromJSON(e,t){let n=[];for(let r=0,a=e.shapes.length;r<a;r++){let o=t[e.shapes[r]];n.push(o)}let s=e.options.extrudePath;return s!==void 0&&(e.options.extrudePath=new bh[s.type]().fromJSON(s)),new i(n,e.options)}},Km={generateTopUV:function(i,e,t,n,s){let r=e[t*3],a=e[t*3+1],o=e[n*3],l=e[n*3+1],c=e[s*3],h=e[s*3+1];return[new me(r,a),new me(o,l),new me(c,h)]},generateSideWallUV:function(i,e,t,n,s,r){let a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[n*3],h=e[n*3+1],f=e[n*3+2],d=e[s*3],m=e[s*3+1],g=e[s*3+2],A=e[r*3],u=e[r*3+1],p=e[r*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new me(a,1-l),new me(c,1-f),new me(d,1-g),new me(A,1-p)]:[new me(o,1-l),new me(h,1-f),new me(m,1-g),new me(u,1-p)]}};function Jm(i,e,t){if(t.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){let r=i[n];t.shapes.push(r.uuid)}else t.shapes.push(i.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var ji=class i extends ln{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,f=e/o,d=t/l,m=[],g=[],A=[],u=[];for(let p=0;p<h;p++){let S=p*d-a;for(let C=0;C<c;C++){let y=C*f-r;g.push(y,-S,0),A.push(0,0,1),u.push(C/o),u.push(1-p/l)}}for(let p=0;p<l;p++)for(let S=0;S<o;S++){let C=S+c*p,y=S+c*(p+1),M=S+1+c*(p+1),E=S+1+c*p;m.push(C,y,E),m.push(y,M,E)}this.setIndex(m),this.setAttribute("position",new Vt(g,3)),this.setAttribute("normal",new Vt(A,3)),this.setAttribute("uv",new Vt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var da=class i extends ln{constructor(e=new Ms([new me(0,.5),new me(-.5,-.5),new me(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],s=[],r=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new Vt(s,3)),this.setAttribute("normal",new Vt(r,3)),this.setAttribute("uv",new Vt(a,2));function c(h){let f=s.length/3,d=h.extractPoints(t),m=d.shape,g=d.holes;li.isClockWise(m)===!1&&(m=m.reverse());for(let u=0,p=g.length;u<p;u++){let S=g[u];li.isClockWise(S)===!0&&(g[u]=S.reverse())}let A=li.triangulateShape(m,g);for(let u=0,p=g.length;u<p;u++){let S=g[u];m=m.concat(S)}for(let u=0,p=m.length;u<p;u++){let S=m[u];s.push(S.x,S.y,0),r.push(0,0,1),a.push(S.x,S.y)}for(let u=0,p=A.length;u<p;u++){let S=A[u],C=S[0]+f,y=S[1]+f,M=S[2]+f;n.push(C,y,M),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Qm(t,e)}static fromJSON(e,t){let n=[];for(let s=0,r=e.shapes.length;s<r;s++){let a=t[e.shapes[s]];n.push(a)}return new i(n,e.curveSegments)}};function Qm(i,e){if(e.shapes=[],Array.isArray(i))for(let t=0,n=i.length;t<n;t++){let s=i[t];e.shapes.push(s.uuid)}else e.shapes.push(i.uuid);return e}function Rs(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(Ju(s))s.isRenderTargetTexture?(nt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(Ju(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function _n(i){let e={};for(let t=0;t<i.length;t++){let n=Rs(i[t]);for(let s in n)e[s]=n[s]}return e}function Ju(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function eg(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function jh(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ft.workingColorSpace}var En={clone:Rs,merge:_n},tg=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ng=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ft=class extends ui{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tg,this.fragmentShader=ng,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Rs(e.uniforms),this.uniformsGroups=eg(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new st().setHex(s.value);break;case"v2":this.uniforms[n].value=new me().fromArray(s.value);break;case"v3":this.uniforms[n].value=new F().fromArray(s.value);break;case"v4":this.uniforms[n].value=new kt().fromArray(s.value);break;case"m3":this.uniforms[n].value=new ot().fromArray(s.value);break;case"m4":this.uniforms[n].value=new Mt().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},gr=class extends Ft{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Hn=class extends ui{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new st(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new st(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Sr,this.normalScale=new me(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},ua=class extends Hn{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new me(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ut(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new st(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new st(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new st(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var pa=class extends ui{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Sr,this.normalScale=new me(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}},fa=class extends ui{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new st(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new st(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Sr,this.normalScale=new me(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hi,this.combine=gl,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},el=class extends ui{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ap,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},tl=class extends ui{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Ks(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function mh(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var qi=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},nl=class extends qi{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:_h,endingEnd:_h}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case vh:r=e,o=2*t-n;break;case yh:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case vh:a=e,l=2*n-t;break;case yh:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,f=this._offsetNext,d=this._weightPrev,m=this._weightNext,g=(n-t)/(s-t),A=g*g,u=A*g,p=-d*u+2*d*A-d*g,S=(1+d)*u+(-1.5-2*d)*A+(-.5+d)*g+1,C=(-1-m)*u+(1.5+m)*A+.5*g,y=m*u-m*A;for(let M=0;M!==o;++M)r[M]=p*a[h+M]+S*a[c+M]+C*a[l+M]+y*a[f+M];return r}},il=class extends qi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(s-t),f=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*f+a[l+d]*h;return r}},sl=class extends qi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},rl=class extends qi{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,f=this.outTangents;if(!h||!f){let g=(n-t)/(s-t),A=1-g;for(let u=0;u!==o;++u)r[u]=a[c+u]*A+a[l+u]*g;return r}let d=o*2,m=e-1;for(let g=0;g!==o;++g){let A=a[c+g],u=a[l+g],p=m*d+g*2,S=f[p],C=f[p+1],y=e*d+g*2,M=h[y],E=h[y+1],R=sg(n,t,S,M,s);r[g]=Yp(R,A,C,E,u)}return r}};function Yp(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function ig(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function sg(i,e,t,n,s){let r=(i-e)/(s-e);for(let a=0;a<8;a++){let o=Yp(r,e,t,n,s)-i;if(Math.abs(o)<1e-10)break;let l=ig(r,e,t,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var Ln=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Ks(t,this.TimeBufferType),this.values=Ks(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Ks(e.times,Array),values:Ks(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),mh(e.settings)&&(n.settings={inTangents:Ks(e.settings.inTangents,Array),outTangents:Ks(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new sl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new il(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new nl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new rl(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Yr:t=this.InterpolantFactoryMethodDiscrete;break;case Go:t=this.InterpolantFactoryMethodLinear;break;case Lo:t=this.InterpolantFactoryMethodSmooth;break;case xh:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return nt("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Yr;case this.InterpolantFactoryMethodLinear:return Go;case this.InterpolantFactoryMethodSmooth:return Lo;case this.InterpolantFactoryMethodBezier:return xh}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;mh(this.settings)&&(Qu(this.settings.inTangents,e),Qu(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(it("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(it("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){it("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){it("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&Hf(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){it("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Lo,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let f=o*n,d=f-n,m=f+n;for(let g=0;g!==n;++g){let A=t[f+g];if(A!==t[d+g]||A!==t[m+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let f=o*n,d=a*n;for(let m=0;m!==n;++m)t[d+m]=t[f+m]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,mh(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function Qu(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}Ln.prototype.ValueTypeName="";Ln.prototype.TimeBufferType=Float32Array;Ln.prototype.ValueBufferType=Float32Array;Ln.prototype.DefaultInterpolation=Go;var $i=class extends Ln{constructor(e,t,n){super(e,t,n)}};$i.prototype.ValueTypeName="bool";$i.prototype.ValueBufferType=Array;$i.prototype.DefaultInterpolation=Yr;$i.prototype.InterpolantFactoryMethodLinear=void 0;$i.prototype.InterpolantFactoryMethodSmooth=void 0;var al=class extends Ln{constructor(e,t,n,s){super(e,t,n,s)}};al.prototype.ValueTypeName="color";var ol=class extends Ln{constructor(e,t,n,s){super(e,t,n,s)}};ol.prototype.ValueTypeName="number";var ll=class extends qi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)mn.slerpFlat(r,0,a,c-o,a,c,l);return r}},ma=class extends Ln{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new ll(this.times,this.values,this.getValueSize(),e)}};ma.prototype.ValueTypeName="quaternion";ma.prototype.InterpolantFactoryMethodSmooth=void 0;var Zi=class extends Ln{constructor(e,t,n){super(e,t,n)}};Zi.prototype.ValueTypeName="string";Zi.prototype.ValueBufferType=Array;Zi.prototype.DefaultInterpolation=Yr;Zi.prototype.InterpolantFactoryMethodLinear=void 0;Zi.prototype.InterpolantFactoryMethodSmooth=void 0;var cl=class extends Ln{constructor(e,t,n,s){super(e,t,n,s)}};cl.prototype.ValueTypeName="vector";var ir={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(ep(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!ep(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function ep(i){try{let e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var hl=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,f){return c.push(h,f),this},this.removeHandler=function(h){let f=c.indexOf(h);return f!==-1&&c.splice(f,2),this},this.getHandler=function(h){for(let f=0,d=c.length;f<d;f+=2){let m=c[f],g=c[f+1];if(m.global&&(m.lastIndex=0),m.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},jp=new hl,Ki=class{constructor(e){this.manager=e!==void 0?e:jp,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Ki.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ci={},Eh=class extends Error{constructor(e,t){super(e),this.response=t}},dl=class extends Ki{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=ir.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0);return}if(Ci[e]!==void 0){Ci[e].push({onLoad:t,onProgress:n,onError:s});return}Ci[e]=[],Ci[e].push({onLoad:t,onProgress:n,onError:s});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&nt("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let h=Ci[e],f=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),m=d?parseInt(d):0,g=m!==0,A=0,u=new ReadableStream({start(p){S();function S(){f.read().then(({done:C,value:y})=>{if(C)p.close();else{A+=y.byteLength;let M=new ProgressEvent("progress",{lengthComputable:g,loaded:A,total:m});for(let E=0,R=h.length;E<R;E++){let v=h[E];v.onProgress&&v.onProgress(M)}p.enqueue(y),S()}},C=>{p.error(C)})}}});return new Response(u)}else throw new Eh(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{let f=/charset="?([^;"\s]*)"?/i.exec(o),d=f&&f[1]?f[1].toLowerCase():void 0,m=new TextDecoder(d);return c.arrayBuffer().then(g=>m.decode(g))}}}).then(c=>{ir.add(`file:${e}`,c);let h=Ci[e];delete Ci[e];for(let f=0,d=h.length;f<d;f++){let m=h[f];m.onLoad&&m.onLoad(c)}}).catch(c=>{let h=Ci[e];if(h===void 0)throw this.manager.itemError(e),c;delete Ci[e];for(let f=0,d=h.length;f<d;f++){let m=h[f];m.onError&&m.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Js=new WeakMap,ul=class extends Ki{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=ir.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let f=Js.get(a);f===void 0&&(f=[],Js.set(a,f)),f.push({onLoad:t,onError:s})}return a}let o=ar("img");function l(){h(),t&&t(this);let f=Js.get(this)||[];for(let d=0;d<f.length;d++){let m=f[d];m.onLoad&&m.onLoad(this)}Js.delete(this),r.manager.itemEnd(e)}function c(f){h(),s&&s(f),ir.remove(`image:${e}`);let d=Js.get(this)||[];for(let m=0;m<d.length;m++){let g=d[m];g.onError&&g.onError(f)}Js.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),ir.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}};var ga=class extends Ki{constructor(e){super(e)}load(e,t,n,s){let r=this,a=new Kn,o=new dl(this.manager);return o.setResponseType("arraybuffer"),o.setRequestHeader(this.requestHeader),o.setPath(this.path),o.setWithCredentials(r.withCredentials),o.load(e,function(l){let c;try{c=r.parse(l)}catch(h){s!==void 0?s(h):it(h);return}r._applyTexData(a,c),t&&t(a,c)},n,s),a}createDataTexture(e){let t=new Kn;return this._applyTexData(t,this.parse(e)),t}_applyTexData(e,t){t.image!==void 0?e.image=t.image:t.data!==void 0&&(e.image.width=t.width,e.image.height=t.height,e.image.data=t.data),e.wrapS=t.wrapS!==void 0?t.wrapS:Bn,e.wrapT=t.wrapT!==void 0?t.wrapT:Bn,e.magFilter=t.magFilter!==void 0?t.magFilter:zt,e.minFilter=t.minFilter!==void 0?t.minFilter:zt,e.anisotropy=t.anisotropy!==void 0?t.anisotropy:1,t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.mipmaps!==void 0&&(e.mipmaps=t.mipmaps,e.minFilter=Ii),t.mipmapCount===1&&(e.minFilter=zt),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),e.needsUpdate=!0}},xr=class extends Ki{constructor(e){super(e)}load(e,t,n,s){let r=new gn,a=new ul(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}},_r=class extends rn{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new st(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},xa=class extends _r{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new st(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},gh=new Mt,tp=new F,np=new F,_a=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new me(512,512),this.mapType=xn,this.map=null,this.mapPass=null,this.matrix=new Mt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ur,this._frameExtents=new me(1,1),this._viewportCount=1,this._viewports=[new kt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;tp.setFromMatrixPosition(e.matrixWorld),t.position.copy(tp),np.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(np),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,s){gh.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(gh,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;e.coordinateSystem===rr||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(gh)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Io=new F,Do=new mn,oi=new F,va=class extends rn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Mt,this.projectionMatrix=new Mt,this.projectionMatrixInverse=new Mt,this.coordinateSystem=qn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Io,Do,oi),oi.x===1&&oi.y===1&&oi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Io,Do,oi.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Io,Do,oi),oi.x===1&&oi.y===1&&oi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Io,Do,oi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Gi=new F,ip=new me,sp=new me,on=class extends va{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=lr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Hr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return lr*2*Math.atan(Math.tan(Hr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Gi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Gi.x,Gi.y).multiplyScalar(-e/Gi.z),Gi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Gi.x,Gi.y).multiplyScalar(-e/Gi.z)}getViewSize(e,t){return this.getViewBounds(e,ip,sp),t.subVectors(sp,ip)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Hr*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var Th=class extends _a{constructor(){super(new on(90,1,.5,500)),this.isPointLightShadow=!0}},ya=class extends _r{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Th}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Ji=class extends va{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ah=class extends _a{constructor(){super(new Ji(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ws=class extends _r{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.target=new rn,this.shadow=new Ah}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Qs=-90,er=1,pl=class extends rn{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new on(Qs,er,e,t);s.layers=this.layers,this.add(s);let r=new on(Qs,er,e,t);r.layers=this.layers,this.add(r);let a=new on(Qs,er,e,t);a.layers=this.layers,this.add(a);let o=new on(Qs,er,e,t);o.layers=this.layers,this.add(o);let l=new on(Qs,er,e,t);l.layers=this.layers,this.add(l);let c=new on(Qs,er,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===qn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===rr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,f=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let A=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let u=!1;e.isWebGLRenderer===!0?u=e.state.buffers.depth.getReversed():u=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,s),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=A,e.setRenderTarget(n,5,s),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(f,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},fl=class extends on{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},ba=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=rg.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function rg(){this._document.hidden===!1&&this.reset()}var qh="\\[\\]\\.:\\/",ag=new RegExp("["+qh+"]","g"),$h="[^"+qh+"]",og="[^"+qh.replace("\\.","")+"]",lg=/((?:WC+[\/:])*)/.source.replace("WC",$h),cg=/(WCOD+)?/.source.replace("WCOD",og),hg=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",$h),dg=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",$h),ug=new RegExp("^"+lg+cg+hg+dg+"$"),pg=["material","materials","bones","map"],Ch=class{constructor(e,t,n){let s=n||It.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},It=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(ag,"")}static parseTrackName(e){let t=ug.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);pg.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){nt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){it("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){it("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){it("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){it("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){it("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){it("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){it("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;it("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){it("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){it("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};It.Composite=Ch;It.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};It.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};It.prototype.GetterByBindingType=[It.prototype._getValue_direct,It.prototype._getValue_array,It.prototype._getValue_arrayElement,It.prototype._getValue_toArray];It.prototype.SetterByBindingTypeAndVersioning=[[It.prototype._setValue_direct,It.prototype._setValue_direct_setNeedsUpdate,It.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[It.prototype._setValue_array,It.prototype._setValue_array_setNeedsUpdate,It.prototype._setValue_array_setMatrixWorldNeedsUpdate],[It.prototype._setValue_arrayElement,It.prototype._setValue_arrayElement_setNeedsUpdate,It.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[It.prototype._setValue_fromArray,It.prototype._setValue_fromArray_setNeedsUpdate,It.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Gy=new Float32Array(1);var rp=new Mt,Ma=class{constructor(e,t,n=0,s=1/0){this.ray=new vs(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new hr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):it("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return rp.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(rp),this}intersectObject(e,t=!0,n=[]){return Rh(e,this,n,t),n.sort(ap),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)Rh(e[s],this,n,t);return n.sort(ap),n}};function ap(i,e){return i.distance-e.distance}function Rh(i,e,t,n){let s=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let a=0,o=r.length;a<o;a++)Rh(r[a],e,t,!0)}}var vr=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=ut(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(ut(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Ph=class i{static{i.prototype.isMatrix2=!0}constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};var Sa=class extends Zn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Zh(i,e,t,n){let s=fg(n);switch(t){case Vh:return i*e;case Ml:return i*e/s.components*s.byteLength;case Sl:return i*e/s.components*s.byteLength;case ss:return i*e*2/s.components*s.byteLength;case wl:return i*e*2/s.components*s.byteLength;case Hh:return i*e*3/s.components*s.byteLength;case wn:return i*e*4/s.components*s.byteLength;case El:return i*e*4/s.components*s.byteLength;case Ua:case Fa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Oa:case Ba:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Al:case Rl:return Math.max(i,16)*Math.max(e,8)/4;case Tl:case Cl:return Math.max(i,8)*Math.max(e,8)/2;case Pl:case Il:case Ll:case Nl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Dl:case za:case kl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ul:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Fl:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Ol:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Bl:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case zl:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Vl:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Hl:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Gl:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Wl:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Xl:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Yl:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case jl:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ql:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case $l:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Zl:case Kl:case Jl:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Ql:case ec:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Va:case tc:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function fg(i){switch(i){case xn:case Fh:return{byteLength:1,components:1};case Mr:case Oh:case Dt:return{byteLength:2,components:1};case yl:case bl:return{byteLength:2,components:4};case Qn:case vl:case bn:return{byteLength:4,components:1};case Bh:case zh:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?nt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function gf(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function gg(i){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,f=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),o.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)m=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){let h=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,h);else{f.sort((m,g)=>m.start-g.start);let d=0;for(let m=1;m<f.length;m++){let g=f[d],A=f[m];A.start<=g.start+g.count+1?g.count=Math.max(g.count,A.start+A.count-g.start):(++d,f[d]=A)}f.length=d+1;for(let m=0,g=f.length;m<g;m++){let A=f[m];i.bufferSubData(c,A.start*h.BYTES_PER_ELEMENT,h,A.start,A.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var xg=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,_g=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,vg=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,yg=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,bg=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Mg=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Sg=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,wg=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Eg=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Tg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ag=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Cg=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Rg=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Pg=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ig=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Dg=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Lg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ng=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,kg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ug=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Fg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Og=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Bg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,zg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Vg=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Hg=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Gg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Wg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Xg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Yg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,jg="gl_FragColor = linearToOutputTexel( gl_FragColor );",qg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,$g=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Zg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Kg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Jg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Qg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,e0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,t0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,n0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,i0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,s0=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,r0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,a0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,o0=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,l0=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,c0=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,h0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,d0=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,u0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,p0=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,f0=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,m0=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,g0=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,x0=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,_0=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,v0=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,y0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,b0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,M0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,S0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,w0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,E0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,T0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,A0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,C0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,R0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,P0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,I0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,D0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,L0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,N0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,k0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,U0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,F0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,O0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,B0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,z0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,V0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,H0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,G0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,W0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,X0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Y0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,j0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,q0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,$0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Z0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,K0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,J0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Q0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,ex=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,tx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,nx=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ix=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,sx=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,rx=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ax=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,ox=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,lx=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,cx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,hx=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,dx=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,ux=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,px=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,fx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,mx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,gx=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,xx=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,_x=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,vx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,yx=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,bx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Mx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,wx=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Ex=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Tx=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Ax=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Cx=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Rx=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Px=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ix=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Dx=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lx=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Nx=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,kx=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Ux=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Fx=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Ox=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Bx=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,zx=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vx=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Hx=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gx=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Wx=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xx=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Yx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,jx=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qx=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$x=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Zx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,pt={alphahash_fragment:xg,alphahash_pars_fragment:_g,alphamap_fragment:vg,alphamap_pars_fragment:yg,alphatest_fragment:bg,alphatest_pars_fragment:Mg,aomap_fragment:Sg,aomap_pars_fragment:wg,batching_pars_vertex:Eg,batching_vertex:Tg,begin_vertex:Ag,beginnormal_vertex:Cg,bsdfs:Rg,iridescence_fragment:Pg,bumpmap_pars_fragment:Ig,clipping_planes_fragment:Dg,clipping_planes_pars_fragment:Lg,clipping_planes_pars_vertex:Ng,clipping_planes_vertex:kg,color_fragment:Ug,color_pars_fragment:Fg,color_pars_vertex:Og,color_vertex:Bg,common:zg,cube_uv_reflection_fragment:Vg,defaultnormal_vertex:Hg,displacementmap_pars_vertex:Gg,displacementmap_vertex:Wg,emissivemap_fragment:Xg,emissivemap_pars_fragment:Yg,colorspace_fragment:jg,colorspace_pars_fragment:qg,envmap_fragment:$g,envmap_common_pars_fragment:Zg,envmap_pars_fragment:Kg,envmap_pars_vertex:Jg,envmap_physical_pars_fragment:c0,envmap_vertex:Qg,fog_vertex:e0,fog_pars_vertex:t0,fog_fragment:n0,fog_pars_fragment:i0,gradientmap_pars_fragment:s0,lightmap_pars_fragment:r0,lights_lambert_fragment:a0,lights_lambert_pars_fragment:o0,lights_pars_begin:l0,lights_toon_fragment:h0,lights_toon_pars_fragment:d0,lights_phong_fragment:u0,lights_phong_pars_fragment:p0,lights_physical_fragment:f0,lights_physical_pars_fragment:m0,lights_fragment_begin:g0,lights_fragment_maps:x0,lights_fragment_end:_0,lightprobes_pars_fragment:v0,logdepthbuf_fragment:y0,logdepthbuf_pars_fragment:b0,logdepthbuf_pars_vertex:M0,logdepthbuf_vertex:S0,map_fragment:w0,map_pars_fragment:E0,map_particle_fragment:T0,map_particle_pars_fragment:A0,metalnessmap_fragment:C0,metalnessmap_pars_fragment:R0,morphinstance_vertex:P0,morphcolor_vertex:I0,morphnormal_vertex:D0,morphtarget_pars_vertex:L0,morphtarget_vertex:N0,normal_fragment_begin:k0,normal_fragment_maps:U0,normal_pars_fragment:F0,normal_pars_vertex:O0,normal_vertex:B0,normalmap_pars_fragment:z0,clearcoat_normal_fragment_begin:V0,clearcoat_normal_fragment_maps:H0,clearcoat_pars_fragment:G0,iridescence_pars_fragment:W0,opaque_fragment:X0,packing:Y0,premultiplied_alpha_fragment:j0,project_vertex:q0,dithering_fragment:$0,dithering_pars_fragment:Z0,roughnessmap_fragment:K0,roughnessmap_pars_fragment:J0,shadowmap_pars_fragment:Q0,shadowmap_pars_vertex:ex,shadowmap_vertex:tx,shadowmask_pars_fragment:nx,skinbase_vertex:ix,skinning_pars_vertex:sx,skinning_vertex:rx,skinnormal_vertex:ax,specularmap_fragment:ox,specularmap_pars_fragment:lx,tonemapping_fragment:cx,tonemapping_pars_fragment:hx,transmission_fragment:dx,transmission_pars_fragment:ux,uv_pars_fragment:px,uv_pars_vertex:fx,uv_vertex:mx,worldpos_vertex:gx,background_vert:xx,background_frag:_x,backgroundCube_vert:vx,backgroundCube_frag:yx,cube_vert:bx,cube_frag:Mx,depth_vert:Sx,depth_frag:wx,distance_vert:Ex,distance_frag:Tx,equirect_vert:Ax,equirect_frag:Cx,linedashed_vert:Rx,linedashed_frag:Px,meshbasic_vert:Ix,meshbasic_frag:Dx,meshlambert_vert:Lx,meshlambert_frag:Nx,meshmatcap_vert:kx,meshmatcap_frag:Ux,meshnormal_vert:Fx,meshnormal_frag:Ox,meshphong_vert:Bx,meshphong_frag:zx,meshphysical_vert:Vx,meshphysical_frag:Hx,meshtoon_vert:Gx,meshtoon_frag:Wx,points_vert:Xx,points_frag:Yx,shadow_vert:jx,shadow_frag:qx,sprite_vert:$x,sprite_frag:Zx},Fe={common:{diffuse:{value:new st(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ot},alphaMap:{value:null},alphaMapTransform:{value:new ot},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ot}},envmap:{envMap:{value:null},envMapRotation:{value:new ot},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ot}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ot}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ot},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ot},normalScale:{value:new me(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ot},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ot}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ot}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ot}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new st(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new F},probesMax:{value:new F},probesResolution:{value:new F}},points:{diffuse:{value:new st(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ot},alphaTest:{value:0},uvTransform:{value:new ot}},sprite:{diffuse:{value:new st(16777215)},opacity:{value:1},center:{value:new me(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ot},alphaMap:{value:null},alphaMapTransform:{value:new ot},alphaTest:{value:0}}},xi={basic:{uniforms:_n([Fe.common,Fe.specularmap,Fe.envmap,Fe.aomap,Fe.lightmap,Fe.fog]),vertexShader:pt.meshbasic_vert,fragmentShader:pt.meshbasic_frag},lambert:{uniforms:_n([Fe.common,Fe.specularmap,Fe.envmap,Fe.aomap,Fe.lightmap,Fe.emissivemap,Fe.bumpmap,Fe.normalmap,Fe.displacementmap,Fe.fog,Fe.lights,{emissive:{value:new st(0)},envMapIntensity:{value:1}}]),vertexShader:pt.meshlambert_vert,fragmentShader:pt.meshlambert_frag},phong:{uniforms:_n([Fe.common,Fe.specularmap,Fe.envmap,Fe.aomap,Fe.lightmap,Fe.emissivemap,Fe.bumpmap,Fe.normalmap,Fe.displacementmap,Fe.fog,Fe.lights,{emissive:{value:new st(0)},specular:{value:new st(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:pt.meshphong_vert,fragmentShader:pt.meshphong_frag},standard:{uniforms:_n([Fe.common,Fe.envmap,Fe.aomap,Fe.lightmap,Fe.emissivemap,Fe.bumpmap,Fe.normalmap,Fe.displacementmap,Fe.roughnessmap,Fe.metalnessmap,Fe.fog,Fe.lights,{emissive:{value:new st(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:pt.meshphysical_vert,fragmentShader:pt.meshphysical_frag},toon:{uniforms:_n([Fe.common,Fe.aomap,Fe.lightmap,Fe.emissivemap,Fe.bumpmap,Fe.normalmap,Fe.displacementmap,Fe.gradientmap,Fe.fog,Fe.lights,{emissive:{value:new st(0)}}]),vertexShader:pt.meshtoon_vert,fragmentShader:pt.meshtoon_frag},matcap:{uniforms:_n([Fe.common,Fe.bumpmap,Fe.normalmap,Fe.displacementmap,Fe.fog,{matcap:{value:null}}]),vertexShader:pt.meshmatcap_vert,fragmentShader:pt.meshmatcap_frag},points:{uniforms:_n([Fe.points,Fe.fog]),vertexShader:pt.points_vert,fragmentShader:pt.points_frag},dashed:{uniforms:_n([Fe.common,Fe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:pt.linedashed_vert,fragmentShader:pt.linedashed_frag},depth:{uniforms:_n([Fe.common,Fe.displacementmap]),vertexShader:pt.depth_vert,fragmentShader:pt.depth_frag},normal:{uniforms:_n([Fe.common,Fe.bumpmap,Fe.normalmap,Fe.displacementmap,{opacity:{value:1}}]),vertexShader:pt.meshnormal_vert,fragmentShader:pt.meshnormal_frag},sprite:{uniforms:_n([Fe.sprite,Fe.fog]),vertexShader:pt.sprite_vert,fragmentShader:pt.sprite_frag},background:{uniforms:{uvTransform:{value:new ot},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:pt.background_vert,fragmentShader:pt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ot}},vertexShader:pt.backgroundCube_vert,fragmentShader:pt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:pt.cube_vert,fragmentShader:pt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:pt.equirect_vert,fragmentShader:pt.equirect_frag},distance:{uniforms:_n([Fe.common,Fe.displacementmap,{referencePosition:{value:new F},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:pt.distance_vert,fragmentShader:pt.distance_frag},shadow:{uniforms:_n([Fe.lights,Fe.fog,{color:{value:new st(0)},opacity:{value:1}}]),vertexShader:pt.shadow_vert,fragmentShader:pt.shadow_frag}};xi.physical={uniforms:_n([xi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ot},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ot},clearcoatNormalScale:{value:new me(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ot},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ot},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ot},sheen:{value:0},sheenColor:{value:new st(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ot},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ot},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ot},transmissionSamplerSize:{value:new me},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ot},attenuationDistance:{value:0},attenuationColor:{value:new st(0)},specularColor:{value:new st(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ot},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ot},anisotropyVector:{value:new me},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ot}}]),vertexShader:pt.meshphysical_vert,fragmentShader:pt.meshphysical_frag};var sc={r:0,b:0,g:0},Kx=new Mt,xf=new ot;xf.set(-1,0,0,0,1,0,0,0,1);function Jx(i,e,t,n,s,r){let a=new st(0),o=s===!0?0:1,l,c,h=null,f=0,d=null;function m(S){let C=S.isScene===!0?S.background:null;if(C&&C.isTexture){let y=S.backgroundBlurriness>0;C=e.get(C,y)}return C}function g(S){let C=!1,y=m(S);y===null?u(a,o):y&&y.isColor&&(u(y,1),C=!0);let M=i.xr.getEnvironmentBlendMode();M==="additive"?t.buffers.color.setClear(0,0,0,1,r):M==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||C)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function A(S,C){let y=m(C);y&&(y.isCubeTexture||y.mapping===Na)?(c===void 0&&(c=new mt(new Yi(1,1,1),new Ft({name:"BackgroundCubeMaterial",uniforms:Rs(xi.backgroundCube.uniforms),vertexShader:xi.backgroundCube.vertexShader,fragmentShader:xi.backgroundCube.fragmentShader,side:Zt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(M,E,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=C.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Kx.makeRotationFromEuler(C.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(xf),c.material.toneMapped=ft.getTransfer(y.colorSpace)!==St,(h!==y||f!==y.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,h=y,f=y.version,d=i.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new mt(new ji(2,2),new Ft({name:"BackgroundMaterial",uniforms:Rs(xi.background.uniforms),vertexShader:xi.background.vertexShader,fragmentShader:xi.background.fragmentShader,side:fi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,l.material.toneMapped=ft.getTransfer(y.colorSpace)!==St,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||f!==y.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,h=y,f=y.version,d=i.toneMapping),l.layers.enableAll(),S.unshift(l,l.geometry,l.material,0,0,null))}function u(S,C){S.getRGB(sc,jh(i)),t.buffers.color.setClear(sc.r,sc.g,sc.b,C,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(S,C=1){a.set(S),o=C,u(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(S){o=S,u(a,o)},render:g,addToRenderList:A,dispose:p}}function Qx(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,a=!1;function o(D,N,O,L,U){let G=!1,Y=f(D,L,O,N);r!==Y&&(r=Y,c(r.object)),G=m(D,L,O,U),G&&g(D,L,O,U),U!==null&&e.update(U,i.ELEMENT_ARRAY_BUFFER),(G||a)&&(a=!1,y(D,N,O,L),U!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(U).buffer))}function l(){return i.createVertexArray()}function c(D){return i.bindVertexArray(D)}function h(D){return i.deleteVertexArray(D)}function f(D,N,O,L){let U=L.wireframe===!0,G=n[N.id];G===void 0&&(G={},n[N.id]=G);let Y=D.isInstancedMesh===!0?D.id:0,re=G[Y];re===void 0&&(re={},G[Y]=re);let W=re[O.id];W===void 0&&(W={},re[O.id]=W);let Z=W[U];return Z===void 0&&(Z=d(l()),W[U]=Z),Z}function d(D){let N=[],O=[],L=[];for(let U=0;U<t;U++)N[U]=0,O[U]=0,L[U]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:O,attributeDivisors:L,object:D,attributes:{},index:null}}function m(D,N,O,L){let U=r.attributes,G=N.attributes,Y=0,re=O.getAttributes();for(let W in re)if(re[W].location>=0){let ie=U[W],xe=G[W];if(xe===void 0&&(W==="instanceMatrix"&&D.instanceMatrix&&(xe=D.instanceMatrix),W==="instanceColor"&&D.instanceColor&&(xe=D.instanceColor)),ie===void 0||ie.attribute!==xe||xe&&ie.data!==xe.data)return!0;Y++}return r.attributesNum!==Y||r.index!==L}function g(D,N,O,L){let U={},G=N.attributes,Y=0,re=O.getAttributes();for(let W in re)if(re[W].location>=0){let ie=G[W];ie===void 0&&(W==="instanceMatrix"&&D.instanceMatrix&&(ie=D.instanceMatrix),W==="instanceColor"&&D.instanceColor&&(ie=D.instanceColor));let xe={};xe.attribute=ie,ie&&ie.data&&(xe.data=ie.data),U[W]=xe,Y++}r.attributes=U,r.attributesNum=Y,r.index=L}function A(){let D=r.newAttributes;for(let N=0,O=D.length;N<O;N++)D[N]=0}function u(D){p(D,0)}function p(D,N){let O=r.newAttributes,L=r.enabledAttributes,U=r.attributeDivisors;O[D]=1,L[D]===0&&(i.enableVertexAttribArray(D),L[D]=1),U[D]!==N&&(i.vertexAttribDivisor(D,N),U[D]=N)}function S(){let D=r.newAttributes,N=r.enabledAttributes;for(let O=0,L=N.length;O<L;O++)N[O]!==D[O]&&(i.disableVertexAttribArray(O),N[O]=0)}function C(D,N,O,L,U,G,Y){Y===!0?i.vertexAttribIPointer(D,N,O,U,G):i.vertexAttribPointer(D,N,O,L,U,G)}function y(D,N,O,L){A();let U=L.attributes,G=O.getAttributes(),Y=N.defaultAttributeValues;for(let re in G){let W=G[re];if(W.location>=0){let Z=U[re];if(Z===void 0&&(re==="instanceMatrix"&&D.instanceMatrix&&(Z=D.instanceMatrix),re==="instanceColor"&&D.instanceColor&&(Z=D.instanceColor)),Z!==void 0){let ie=Z.normalized,xe=Z.itemSize,be=e.get(Z);if(be===void 0)continue;let pe=be.buffer,K=be.type,Je=be.bytesPerElement,J=K===i.INT||K===i.UNSIGNED_INT||Z.gpuType===vl;if(Z.isInterleavedBufferAttribute){let se=Z.data,ce=se.stride,Ye=Z.offset;if(se.isInstancedInterleavedBuffer){for(let Le=0;Le<W.locationSize;Le++)p(W.location+Le,se.meshPerAttribute);D.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let Le=0;Le<W.locationSize;Le++)u(W.location+Le);i.bindBuffer(i.ARRAY_BUFFER,pe);for(let Le=0;Le<W.locationSize;Le++)C(W.location+Le,xe/W.locationSize,K,ie,ce*Je,(Ye+xe/W.locationSize*Le)*Je,J)}else{if(Z.isInstancedBufferAttribute){for(let se=0;se<W.locationSize;se++)p(W.location+se,Z.meshPerAttribute);D.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let se=0;se<W.locationSize;se++)u(W.location+se);i.bindBuffer(i.ARRAY_BUFFER,pe);for(let se=0;se<W.locationSize;se++)C(W.location+se,xe/W.locationSize,K,ie,xe*Je,xe/W.locationSize*se*Je,J)}}else if(Y!==void 0){let ie=Y[re];if(ie!==void 0)switch(ie.length){case 2:i.vertexAttrib2fv(W.location,ie);break;case 3:i.vertexAttrib3fv(W.location,ie);break;case 4:i.vertexAttrib4fv(W.location,ie);break;default:i.vertexAttrib1fv(W.location,ie)}}}}S()}function M(){w();for(let D in n){let N=n[D];for(let O in N){let L=N[O];for(let U in L){let G=L[U];for(let Y in G)h(G[Y].object),delete G[Y];delete L[U]}}delete n[D]}}function E(D){if(n[D.id]===void 0)return;let N=n[D.id];for(let O in N){let L=N[O];for(let U in L){let G=L[U];for(let Y in G)h(G[Y].object),delete G[Y];delete L[U]}}delete n[D.id]}function R(D){for(let N in n){let O=n[N];for(let L in O){let U=O[L];if(U[D.id]===void 0)continue;let G=U[D.id];for(let Y in G)h(G[Y].object),delete G[Y];delete U[D.id]}}}function v(D){for(let N in n){let O=n[N],L=D.isInstancedMesh===!0?D.id:0,U=O[L];if(U!==void 0){for(let G in U){let Y=U[G];for(let re in Y)h(Y[re].object),delete Y[re];delete U[G]}delete O[L],Object.keys(O).length===0&&delete n[N]}}}function w(){P(),a=!0,r!==s&&(r=s,c(r.object))}function P(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:w,resetDefaultState:P,dispose:M,releaseStatesOfGeometry:E,releaseStatesOfObject:v,releaseStatesOfProgram:R,initAttributes:A,enableAttribute:u,disableUnusedAttributes:S}}function e_(i,e,t){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let d=0;for(let m=0;m<h;m++)d+=c[m];t.update(d,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function t_(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(R){return!(R!==wn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){let v=R===Dt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==xn&&R!==bn&&!v&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(nt("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let f=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&nt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),A=i.getParameter(i.MAX_TEXTURE_SIZE),u=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),S=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),C=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),M=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:m,maxVertexTextures:g,maxTextureSize:A,maxCubemapSize:u,maxAttributes:p,maxVertexUniforms:S,maxVaryings:C,maxFragmentUniforms:y,maxSamples:M,samples:E}}function n_(i){let e=this,t=null,n=0,s=!1,r=!1,a=new In,o=new ot,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,d){let m=f.length!==0||d||n!==0||s;return s=d,n=f.length,m},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,d){t=h(f,d,0)},this.setState=function(f,d,m){let g=f.clippingPlanes,A=f.clipIntersection,u=f.clipShadows,p=i.get(f);if(!s||g===null||g.length===0||r&&!u)r?h(null):c();else{let S=r?0:n,C=S*4,y=p.clippingState||null;l.value=y,y=h(g,d,C,m);for(let M=0;M!==C;++M)y[M]=t[M];p.clippingState=y,this.numIntersection=A?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(f,d,m,g){let A=f!==null?f.length:0,u=null;if(A!==0){if(u=l.value,g!==!0||u===null){let p=m+A*4,S=d.matrixWorldInverse;o.getNormalMatrix(S),(u===null||u.length<p)&&(u=new Float32Array(p));for(let C=0,y=m;C!==A;++C,y+=4)a.copy(f[C]).applyMatrix4(S,o),a.normal.toArray(u,y),u[y+3]=a.constant}l.value=u,l.needsUpdate=!0}return e.numPlanes=A,e.numIntersection=0,u}}var Er=4,i_=6,s_=20,r_=256,Ha=new Ji,qp=new st,Kh=null,Jh=0,Qh=0,ed=!1,a_=new F,Ps=new F,Ar=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=a_}=r;Kh=this._renderer.getRenderTarget(),Jh=this._renderer.getActiveCubeFace(),Qh=this._renderer.getActiveMipmapLevel(),ed=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,s,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Kp(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Zp(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Kh,Jh,Qh),this._renderer.xr.enabled=ed,e.scissorTest=!1,wr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ns||e.mapping===As?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Kh=this._renderer.getRenderTarget(),Jh=this._renderer.getActiveCubeFace(),Qh=this._renderer.getActiveMipmapLevel(),ed=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:zt,minFilter:zt,generateMipmaps:!1,type:Dt,format:wn,colorSpace:xs,depthBuffer:!1},s=$p(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=$p(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=o_(r)),this._blurMaterial=c_(r,e,t),this._ggxMaterial=l_(r,e,t)}return s}_compileMaterial(e){let t=new mt(new ln,e);this._renderer.compile(t,Ha)}_sceneToCubeUV(e,t,n,s,r){let l=new on(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,d=f.autoClear,m=f.toneMapping;f.getClearColor(qp),f.toneMapping=Jn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new mt(new Yi,new ys({name:"PMREM.Background",side:Zt,depthWrite:!1,depthTest:!1})));let A=this._backgroundBox,u=A.material,p=!1,S=e.background;S?S.isColor&&(u.color.copy(S),e.background=null,p=!0):(u.color.copy(qp),p=!0);for(let C=0;C<6;C++){let y=C%3;y===0?(l.up.set(0,c[C],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[C],r.y,r.z)):y===1?(l.up.set(0,0,c[C]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[C],r.z)):(l.up.set(0,c[C],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[C]));let M=this._cubeSize;wr(s,y*M,C>2?M:0,M,M),f.setRenderTarget(s),p&&f.render(A,l),f.render(e,l)}f.toneMapping=m,f.autoClear=d,e.background=S}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===ns||e.mapping===As;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Kp()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Zp());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;wr(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,Ha)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),f=Math.sqrt(c*c-h*h),d=c*1.25,m=f*d,{_lodMax:g}=this,A=this._sizeLods[n],u=3*A*(n>g-Er?n-g+Er:0),p=4*(this._cubeSize-A);l.envMap.value=e.texture,l.roughness.value=m,l.mipInt.value=g-t,wr(r,u,p,3*A,2*A),s.setRenderTarget(r),s.render(o,Ha),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-n,wr(e,u,p,3*A,2*A),s.setRenderTarget(e),s.render(o,Ha)}_blur(e,t,n,s){let r=this._pingPongRenderTarget,a=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,a),this._blurPass(r,e,n,n,a)}_blurPass(e,t,n,s,r){let a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-n;let h=this._sizeLods[s],f=3*h*(s>this._lodMax-Er?s-this._lodMax+Er:0),d=4*(this._cubeSize-h);wr(t,f,d,3*h,2*h),a.setRenderTarget(t),a.render(l,Ha)}};function o_(i){let e=[],t=[],n=i,s=i-Er+1+i_;for(let r=0;r<s;r++){let a=Math.pow(2,n);e.push(a);let o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,d=6,m=3,g=new Float32Array(m*d*f),A=new Float32Array(m*d*f);for(let p=0;p<f;p++){let S=p%3*2/3-1,C=p>2?0:-1,y=[S,C,0,S+2/3,C,0,S+2/3,C+1,0,S,C,0,S+2/3,C+1,0,S,C+1,0];g.set(y,m*d*p);for(let M=0;M<d;M++){let E=h[M*2]*2-1,R=h[M*2+1]*2-1;p===0?Ps.set(1,R,E):p===1?Ps.set(-E,1,-R):p===2?Ps.set(-E,R,1):p===3?Ps.set(-1,R,-E):p===4?Ps.set(-E,-1,R):Ps.set(E,R,-1),Ps.toArray(A,(p*d+M)*m)}}let u=new ln;u.setAttribute("position",new fn(g,m)),u.setAttribute("outputDirection",new fn(A,m)),t.push(new mt(u,null)),n>Er&&n--}return{lodMeshes:t,sizeLods:e}}function $p(i,e,t){let n=new Ut(i,e,t);return n.texture.mapping=Na,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function wr(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function l_(i,e,t){return new Ft({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:r_,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:lc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Gt,depthTest:!1,depthWrite:!1})}function c_(i,e,t){return new Ft({name:"SphericalGaussianBlur",defines:{SAMPLES:s_,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:lc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Gt,depthTest:!1,depthWrite:!1})}function Zp(){return new Ft({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:lc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Gt,depthTest:!1,depthWrite:!1})}function Kp(){return new Ft({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:lc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Gt,depthTest:!1,depthWrite:!1})}function lc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var ac=class extends Ut{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new ea(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Yi(5,5,5),r=new Ft({name:"CubemapFromEquirect",uniforms:Rs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Zt,blending:Gt});r.uniforms.tEquirect.value=t;let a=new mt(s,r),o=t.minFilter;return t.minFilter===Ii&&(t.minFilter=zt),new pl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}};function h_(i){let e=new WeakMap,t=new WeakMap,n=null;function s(d,m=!1){return d==null?null:m?a(d):r(d)}function r(d){if(d&&d.isTexture){let m=d.mapping;if(m===br||m===xl)if(e.has(d)){let g=e.get(d).texture;return o(g,d.mapping)}else{let g=d.image;if(g&&g.height>0){let A=new ac(g.height);return A.fromEquirectangularTexture(i,d),e.set(d,A),d.addEventListener("dispose",c),o(A.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){let m=d.mapping,g=m===br||m===xl,A=m===ns||m===As;if(g||A){let u=t.get(d),p=u!==void 0?u.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return n===null&&(n=new Ar(i)),u=g?n.fromEquirectangular(d,u):n.fromCubemap(d,u),u.texture.pmremVersion=d.pmremVersion,t.set(d,u),u.texture;if(u!==void 0)return u.texture;{let S=d.image;return g&&S&&S.height>0||A&&S&&l(S)?(n===null&&(n=new Ar(i)),u=g?n.fromEquirectangular(d):n.fromCubemap(d),u.texture.pmremVersion=d.pmremVersion,t.set(d,u),d.addEventListener("dispose",h),u.texture):null}}}return d}function o(d,m){return m===br?d.mapping=ns:m===xl&&(d.mapping=As),d}function l(d){let m=0,g=6;for(let A=0;A<g;A++)d[A]!==void 0&&m++;return m===g}function c(d){let m=d.target;m.removeEventListener("dispose",c);let g=e.get(m);g!==void 0&&(e.delete(m),g.dispose())}function h(d){let m=d.target;m.removeEventListener("dispose",h);let g=t.get(m);g!==void 0&&(t.delete(m),g.dispose())}function f(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function d_(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&gs("WebGLRenderer: "+n+" extension not supported."),s}}}function u_(i,e,t,n){let s={},r=new WeakMap;function a(f){let d=f.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",a),delete s[d.id];let m=r.get(d);m&&(e.remove(m),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(f,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(f){let d=f.attributes;for(let m in d)e.update(d[m],i.ARRAY_BUFFER)}function c(f){let d=[],m=f.index,g=f.attributes.position,A=0;if(g===void 0)return;if(m!==null){let S=m.array;A=m.version;for(let C=0,y=S.length;C<y;C+=3){let M=S[C+0],E=S[C+1],R=S[C+2];d.push(M,E,E,R,R,M)}}else{let S=g.array;A=g.version;for(let C=0,y=S.length/3-1;C<y;C+=3){let M=C+0,E=C+1,R=C+2;d.push(M,E,E,R,R,M)}}let u=new(g.count>=65535?Kr:Zr)(d,1);u.version=A;let p=r.get(f);p&&e.remove(p),r.set(f,u)}function h(f){let d=r.get(f);if(d){let m=f.index;m!==null&&d.version<m.version&&c(f)}else c(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:h}}function p_(i,e,t){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,d){i.drawElements(n,d,r,f*a),t.update(d,n,1)}function c(f,d,m){m!==0&&(i.drawElementsInstanced(n,d,r,f*a,m),t.update(d,n,m))}function h(f,d,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,m);let A=0;for(let u=0;u<m;u++)A+=d[u];t.update(A,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function f_(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:it("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function m_(i,e,t){let n=new WeakMap,s=new kt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0,d=n.get(o);if(d===void 0||d.count!==f){let w=function(){R.dispose(),n.delete(o),o.removeEventListener("dispose",w)};d!==void 0&&d.texture.dispose();let m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,A=o.morphAttributes.color!==void 0,u=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],S=o.morphAttributes.color||[],C=0;m===!0&&(C=1),g===!0&&(C=2),A===!0&&(C=3);let y=o.attributes.position.count*C,M=1;y>e.maxTextureSize&&(M=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let E=new Float32Array(y*M*4*f),R=new qr(E,y,M,f);R.type=bn,R.needsUpdate=!0;let v=C*4;for(let P=0;P<f;P++){let D=u[P],N=p[P],O=S[P],L=y*M*4*P;for(let U=0;U<D.count;U++){let G=U*v;m===!0&&(s.fromBufferAttribute(D,U),E[L+G+0]=s.x,E[L+G+1]=s.y,E[L+G+2]=s.z,E[L+G+3]=0),g===!0&&(s.fromBufferAttribute(N,U),E[L+G+4]=s.x,E[L+G+5]=s.y,E[L+G+6]=s.z,E[L+G+7]=0),A===!0&&(s.fromBufferAttribute(O,U),E[L+G+8]=s.x,E[L+G+9]=s.y,E[L+G+10]=s.z,E[L+G+11]=O.itemSize===4?s.w:1)}}d={count:f,texture:R,size:new me(y,M)},n.set(o,d),o.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let A=0;A<c.length;A++)m+=c[A];let g=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function g_(i,e,t,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,f=c.geometry,d=e.get(c,f);if(r.get(d)!==h&&(e.update(d),r.set(d,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let m=c.skeleton;r.get(m)!==h&&(m.update(),r.set(m,h))}return d}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}var x_={[Ca]:"LINEAR_TONE_MAPPING",[Ra]:"REINHARD_TONE_MAPPING",[Pa]:"CINEON_TONE_MAPPING",[Ts]:"ACES_FILMIC_TONE_MAPPING",[Da]:"AGX_TONE_MAPPING",[La]:"NEUTRAL_TONE_MAPPING",[Ia]:"CUSTOM_TONE_MAPPING"};function __(i,e,t,n,s,r){let a=new Ut(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new ln;c.setAttribute("position",new Vt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Vt([0,2,0,0,2,0],2));let h=new gr({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new mt(c,h),d=new Ji(-1,1,1,-1,0,1),m=null,g=null,A=!1,u,p=null,S=[],C=!1;this.setSize=function(y,M){a.setSize(y,M),o!==null&&o.setSize(y,M),l!==null&&l.setSize(y,M);for(let E=0;E<S.length;E++){let R=S[E];R.setSize&&R.setSize(y,M)}},this.setEffects=function(y){S=y,C=S.length>0&&S[0].isRenderPass===!0;let M=a.width,E=a.height;S.length>0&&o===null&&(o=new Ut(M,E,{type:Dt,depthBuffer:!1,stencilBuffer:!1}),l=new Ut(M,E,{type:Dt,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<S.length;R++){let v=S[R];v.setSize&&v.setSize(M,E)}},this.begin=function(y,M){if(A||y.toneMapping===Jn&&S.length===0)return!1;if(p=M,M!==null){let E=M.width,R=M.height;(a.width!==E||a.height!==R)&&this.setSize(E,R)}return C===!1&&y.setRenderTarget(a),u=y.toneMapping,y.toneMapping=Jn,!0},this.hasRenderPass=function(){return C},this.end=function(y,M){y.toneMapping=u,A=!0;let E=a,R=o;for(let v=0;v<S.length;v++){let w=S[v];w.enabled!==!1&&(w.render(y,R,E,M),w.needsSwap!==!1&&(E=R,R=R===o?l:o))}if(m!==y.outputColorSpace||g!==y.toneMapping){m=y.outputColorSpace,g=y.toneMapping,h.defines={},ft.getTransfer(m)===St&&(h.defines.SRGB_TRANSFER="");let v=x_[g];v&&(h.defines[v]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=E.texture,y.setRenderTarget(p),y.render(f,d),p=null,A=!1},this.isCompositing=function(){return A},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var _f=new gn,id=new pi(1,1),vf=new qr,yf=new Yo,bf=new ea,Jp=[],Qp=[],ef=new Float32Array(16),tf=new Float32Array(9),nf=new Float32Array(4);function Cr(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Jp[s];if(r===void 0&&(r=new Float32Array(s),Jp[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Kt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Jt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function cc(i,e){let t=Qp[e];t===void 0&&(t=new Int32Array(e),Qp[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function v_(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function y_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Kt(t,e))return;i.uniform2fv(this.addr,e),Jt(t,e)}}function b_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Kt(t,e))return;i.uniform3fv(this.addr,e),Jt(t,e)}}function M_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Kt(t,e))return;i.uniform4fv(this.addr,e),Jt(t,e)}}function S_(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Kt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Jt(t,e)}else{if(Kt(t,n))return;nf.set(n),i.uniformMatrix2fv(this.addr,!1,nf),Jt(t,n)}}function w_(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Kt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Jt(t,e)}else{if(Kt(t,n))return;tf.set(n),i.uniformMatrix3fv(this.addr,!1,tf),Jt(t,n)}}function E_(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Kt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Jt(t,e)}else{if(Kt(t,n))return;ef.set(n),i.uniformMatrix4fv(this.addr,!1,ef),Jt(t,n)}}function T_(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function A_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Kt(t,e))return;i.uniform2iv(this.addr,e),Jt(t,e)}}function C_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Kt(t,e))return;i.uniform3iv(this.addr,e),Jt(t,e)}}function R_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Kt(t,e))return;i.uniform4iv(this.addr,e),Jt(t,e)}}function P_(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function I_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Kt(t,e))return;i.uniform2uiv(this.addr,e),Jt(t,e)}}function D_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Kt(t,e))return;i.uniform3uiv(this.addr,e),Jt(t,e)}}function L_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Kt(t,e))return;i.uniform4uiv(this.addr,e),Jt(t,e)}}function N_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(id.compareFunction=t.isReversedDepthBuffer()?ic:nc,r=id):r=_f,t.setTexture2D(e||r,s)}function k_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||yf,s)}function U_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||bf,s)}function F_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||vf,s)}function O_(i){switch(i){case 5126:return v_;case 35664:return y_;case 35665:return b_;case 35666:return M_;case 35674:return S_;case 35675:return w_;case 35676:return E_;case 5124:case 35670:return T_;case 35667:case 35671:return A_;case 35668:case 35672:return C_;case 35669:case 35673:return R_;case 5125:return P_;case 36294:return I_;case 36295:return D_;case 36296:return L_;case 35678:case 36198:case 36298:case 36306:case 35682:return N_;case 35679:case 36299:case 36307:return k_;case 35680:case 36300:case 36308:case 36293:return U_;case 36289:case 36303:case 36311:case 36292:return F_}}function B_(i,e){i.uniform1fv(this.addr,e)}function z_(i,e){let t=Cr(e,this.size,2);i.uniform2fv(this.addr,t)}function V_(i,e){let t=Cr(e,this.size,3);i.uniform3fv(this.addr,t)}function H_(i,e){let t=Cr(e,this.size,4);i.uniform4fv(this.addr,t)}function G_(i,e){let t=Cr(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function W_(i,e){let t=Cr(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function X_(i,e){let t=Cr(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Y_(i,e){i.uniform1iv(this.addr,e)}function j_(i,e){i.uniform2iv(this.addr,e)}function q_(i,e){i.uniform3iv(this.addr,e)}function $_(i,e){i.uniform4iv(this.addr,e)}function Z_(i,e){i.uniform1uiv(this.addr,e)}function K_(i,e){i.uniform2uiv(this.addr,e)}function J_(i,e){i.uniform3uiv(this.addr,e)}function Q_(i,e){i.uniform4uiv(this.addr,e)}function ev(i,e,t){let n=this.cache,s=e.length,r=cc(t,s);Kt(n,r)||(i.uniform1iv(this.addr,r),Jt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=id:a=_f;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function tv(i,e,t){let n=this.cache,s=e.length,r=cc(t,s);Kt(n,r)||(i.uniform1iv(this.addr,r),Jt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||yf,r[a])}function nv(i,e,t){let n=this.cache,s=e.length,r=cc(t,s);Kt(n,r)||(i.uniform1iv(this.addr,r),Jt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||bf,r[a])}function iv(i,e,t){let n=this.cache,s=e.length,r=cc(t,s);Kt(n,r)||(i.uniform1iv(this.addr,r),Jt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||vf,r[a])}function sv(i){switch(i){case 5126:return B_;case 35664:return z_;case 35665:return V_;case 35666:return H_;case 35674:return G_;case 35675:return W_;case 35676:return X_;case 5124:case 35670:return Y_;case 35667:case 35671:return j_;case 35668:case 35672:return q_;case 35669:case 35673:return $_;case 5125:return Z_;case 36294:return K_;case 36295:return J_;case 36296:return Q_;case 35678:case 36198:case 36298:case 36306:case 35682:return ev;case 35679:case 36299:case 36307:return tv;case 35680:case 36300:case 36308:case 36293:return nv;case 36289:case 36303:case 36311:case 36292:return iv}}var sd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=O_(t.type)}},rd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=sv(t.type)}},ad=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},td=/(\w+)(\])?(\[|\.)?/g;function sf(i,e){i.seq.push(e),i.map[e.id]=e}function rv(i,e,t){let n=i.name,s=n.length;for(td.lastIndex=0;;){let r=td.exec(n),a=td.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){sf(t,c===void 0?new sd(o,i,e):new rd(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new ad(o),sf(t,f)),t=f}}}var Tr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);rv(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function rf(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var av=37297,ov=0;function lv(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var af=new ot;function cv(i){ft._getMatrix(af,ft.workingColorSpace,i);let e=`mat3( ${af.elements.map(t=>t.toFixed(4))} )`;switch(ft.getTransfer(i)){case jr:return[e,"LinearTransferOETF"];case St:return[e,"sRGBTransferOETF"];default:return nt("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function of(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+lv(i.getShaderSource(e),o)}else return r}function hv(i,e){let t=cv(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var dv={[Ca]:"Linear",[Ra]:"Reinhard",[Pa]:"Cineon",[Ts]:"ACESFilmic",[Da]:"AgX",[La]:"Neutral",[Ia]:"Custom"};function uv(i,e){let t=dv[e];return t===void 0?(nt("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var rc=new F;function pv(){ft.getLuminanceCoefficients(rc);let i=rc.x.toFixed(4),e=rc.y.toFixed(4),t=rc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function fv(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Wa).join(`
`)}function mv(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function gv(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Wa(i){return i!==""}function lf(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function cf(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var xv=/^[ \t]*#include +<([\w\d./]+)>/gm;function od(i){return i.replace(xv,vv)}var _v=new Map;function vv(i,e){let t=pt[e];if(t===void 0){let n=_v.get(e);if(n!==void 0)t=pt[n],nt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return od(t)}var yv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function hf(i){return i.replace(yv,bv)}function bv(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function df(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var Mv={[wa]:"SHADOWMAP_TYPE_PCF",[ts]:"SHADOWMAP_TYPE_VSM"};function Sv(i){return Mv[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var wv={[ns]:"ENVMAP_TYPE_CUBE",[As]:"ENVMAP_TYPE_CUBE",[Na]:"ENVMAP_TYPE_CUBE_UV"};function Ev(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":wv[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var Tv={[As]:"ENVMAP_MODE_REFRACTION"};function Av(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Tv[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Cv={[gl]:"ENVMAP_BLENDING_MULTIPLY",[wp]:"ENVMAP_BLENDING_MIX",[Ep]:"ENVMAP_BLENDING_ADD"};function Rv(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Cv[i.combine]||"ENVMAP_BLENDING_NONE"}function Pv(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Iv(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Sv(t),c=Ev(t),h=Av(t),f=Rv(t),d=Pv(t),m=fv(t),g=mv(r),A=s.createProgram(),u,p,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Wa).join(`
`),u.length>0&&(u+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Wa).join(`
`),p.length>0&&(p+=`
`)):(u=[df(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Wa).join(`
`),p=[df(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+f:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Jn?"#define TONE_MAPPING":"",t.toneMapping!==Jn?pt.tonemapping_pars_fragment:"",t.toneMapping!==Jn?uv("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",pt.colorspace_pars_fragment,hv("linearToOutputTexel",t.outputColorSpace),pv(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Wa).join(`
`)),a=od(a),a=lf(a,t),a=cf(a,t),o=od(o),o=lf(o,t),o=cf(o,t),a=hf(a),o=hf(o),t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,u=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+u,p=["#define varying in",t.glslVersion===Gh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Gh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let C=S+u+a,y=S+p+o,M=rf(s,s.VERTEX_SHADER,C),E=rf(s,s.FRAGMENT_SHADER,y);s.attachShader(A,M),s.attachShader(A,E),t.index0AttributeName!==void 0?s.bindAttribLocation(A,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(A,0,"position"),s.linkProgram(A);function R(D){if(i.debug.checkShaderErrors){let N=s.getProgramInfoLog(A)||"",O=s.getShaderInfoLog(M)||"",L=s.getShaderInfoLog(E)||"",U=N.trim(),G=O.trim(),Y=L.trim(),re=!0,W=!0;if(s.getProgramParameter(A,s.LINK_STATUS)===!1)if(re=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,A,M,E);else{let Z=of(s,M,"vertex"),ie=of(s,E,"fragment");it("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(A,s.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+U+`
`+Z+`
`+ie)}else U!==""?nt("WebGLProgram: Program Info Log:",U):(G===""||Y==="")&&(W=!1);W&&(D.diagnostics={runnable:re,programLog:U,vertexShader:{log:G,prefix:u},fragmentShader:{log:Y,prefix:p}})}s.deleteShader(M),s.deleteShader(E),v=new Tr(s,A),w=gv(s,A)}let v;this.getUniforms=function(){return v===void 0&&R(this),v};let w;this.getAttributes=function(){return w===void 0&&R(this),w};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=s.getProgramParameter(A,av)),P},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(A),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=ov++,this.cacheKey=e,this.usedTimes=1,this.program=A,this.vertexShader=M,this.fragmentShader=E,this}var Dv=0,ld=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new cd(e),t.set(e,n)),n}},cd=class{constructor(e){this.id=Dv++,this.code=e,this.usedTimes=0}};function Lv(i){return i===ss||i===za||i===Va}function Nv(i,e,t,n,s,r){let a=new hr,o=new ld,l=new Set,c=[],h=new Map,f=n.logarithmicDepthBuffer,d=n.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(v){return l.add(v),v===0?"uv":`uv${v}`}function A(v,w,P,D,N,O){let L=D.fog,U=N.geometry,G=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?D.environment:null,Y=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,re=e.get(v.envMap||G,Y),W=re&&re.mapping===Na?re.image.height:null,Z=m[v.type];v.precision!==null&&(d=n.getMaxPrecision(v.precision),d!==v.precision&&nt("WebGLProgram.getParameters:",v.precision,"not supported, using",d,"instead."));let ie=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,xe=ie!==void 0?ie.length:0,be=0;U.morphAttributes.position!==void 0&&(be=1),U.morphAttributes.normal!==void 0&&(be=2),U.morphAttributes.color!==void 0&&(be=3);let pe,K,Je,J;if(Z){let gt=xi[Z];pe=gt.vertexShader,K=gt.fragmentShader}else{pe=v.vertexShader,K=v.fragmentShader;let gt=o.getVertexShaderStage(v),vt=o.getFragmentShaderStage(v);o.update(v,gt,vt),Je=gt.id,J=vt.id}let se=i.getRenderTarget(),ce=i.state.buffers.depth.getReversed(),Ye=N.isInstancedMesh===!0,Le=N.isBatchedMesh===!0,Qe=!!v.map,ct=!!v.matcap,ae=!!re,de=!!v.aoMap,_e=!!v.lightMap,Me=!!v.bumpMap&&v.wireframe===!1,Ae=!!v.normalMap,je=!!v.displacementMap,ve=!!v.emissiveMap,Pe=!!v.metalnessMap,Be=!!v.roughnessMap,k=v.anisotropy>0,ht=v.clearcoat>0,he=v.dispersion>0,I=v.retroreflectivity>0,b=v.iridescence>0,V=v.sheen>0,j=v.transmission>0,ne=k&&!!v.anisotropyMap,ye=ht&&!!v.clearcoatMap,Te=ht&&!!v.clearcoatNormalMap,H=ht&&!!v.clearcoatRoughnessMap,ee=b&&!!v.iridescenceMap,fe=b&&!!v.iridescenceThicknessMap,Ie=V&&!!v.sheenColorMap,Se=V&&!!v.sheenRoughnessMap,Ee=!!v.specularMap,Ve=!!v.specularColorMap,$e=!!v.specularIntensityMap,et=j&&!!v.transmissionMap,z=j&&!!v.thicknessMap,Re=!!v.gradientMap,le=!!v.alphaMap,De=v.alphaTest>0,ke=!!v.alphaHash,ge=!!v.extensions,Ke=Jn;v.toneMapped&&(se===null||se.isXRRenderTarget===!0)&&(Ke=i.toneMapping);let we={shaderID:Z,shaderType:v.type,shaderName:v.name,vertexShader:pe,fragmentShader:K,defines:v.defines,customVertexShaderID:Je,customFragmentShaderID:J,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:d,batching:Le,batchingColor:Le&&N._colorsTexture!==null,instancing:Ye,instancingColor:Ye&&N.instanceColor!==null,instancingMorph:Ye&&N.morphTexture!==null,outputColorSpace:se===null?i.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:ft.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:Qe,matcap:ct,envMap:ae,envMapMode:ae&&re.mapping,envMapCubeUVHeight:W,aoMap:de,lightMap:_e,bumpMap:Me,normalMap:Ae,displacementMap:je,emissiveMap:ve,normalMapObjectSpace:Ae&&v.normalMapType===Cp,normalMapTangentSpace:Ae&&v.normalMapType===Sr,packedNormalMap:Ae&&v.normalMapType===Sr&&Lv(v.normalMap.format),metalnessMap:Pe,roughnessMap:Be,anisotropy:k,anisotropyMap:ne,clearcoat:ht,clearcoatMap:ye,clearcoatNormalMap:Te,clearcoatRoughnessMap:H,dispersion:he,retroreflection:I,iridescence:b,iridescenceMap:ee,iridescenceThicknessMap:fe,sheen:V,sheenColorMap:Ie,sheenRoughnessMap:Se,specularMap:Ee,specularColorMap:Ve,specularIntensityMap:$e,transmission:j,transmissionMap:et,thicknessMap:z,gradientMap:Re,opaque:v.transparent===!1&&v.blending===yr&&v.alphaToCoverage===!1,alphaMap:le,alphaTest:De,alphaHash:ke,combine:v.combine,mapUv:Qe&&g(v.map.channel),aoMapUv:de&&g(v.aoMap.channel),lightMapUv:_e&&g(v.lightMap.channel),bumpMapUv:Me&&g(v.bumpMap.channel),normalMapUv:Ae&&g(v.normalMap.channel),displacementMapUv:je&&g(v.displacementMap.channel),emissiveMapUv:ve&&g(v.emissiveMap.channel),metalnessMapUv:Pe&&g(v.metalnessMap.channel),roughnessMapUv:Be&&g(v.roughnessMap.channel),anisotropyMapUv:ne&&g(v.anisotropyMap.channel),clearcoatMapUv:ye&&g(v.clearcoatMap.channel),clearcoatNormalMapUv:Te&&g(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:H&&g(v.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&g(v.iridescenceMap.channel),iridescenceThicknessMapUv:fe&&g(v.iridescenceThicknessMap.channel),sheenColorMapUv:Ie&&g(v.sheenColorMap.channel),sheenRoughnessMapUv:Se&&g(v.sheenRoughnessMap.channel),specularMapUv:Ee&&g(v.specularMap.channel),specularColorMapUv:Ve&&g(v.specularColorMap.channel),specularIntensityMapUv:$e&&g(v.specularIntensityMap.channel),transmissionMapUv:et&&g(v.transmissionMap.channel),thicknessMapUv:z&&g(v.thicknessMap.channel),alphaMapUv:le&&g(v.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(Ae||k),vertexNormals:!!U.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!U.attributes.uv&&(Qe||le),fog:!!L,useFog:v.fog===!0,fogExp2:!!L&&L.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||U.attributes.normal===void 0&&Ae===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:ce,skinning:N.isSkinnedMesh===!0,hasPositionAttribute:U.attributes.position!==void 0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:xe,morphTextureStride:be,numSunLights:w.sun.length,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numSunLightShadows:w.sunShadowMap.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:O.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:v.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ke,decodeVideoTexture:Qe&&v.map.isVideoTexture===!0&&ft.getTransfer(v.map.colorSpace)===St,decodeVideoTextureEmissive:ve&&v.emissiveMap.isVideoTexture===!0&&ft.getTransfer(v.emissiveMap.colorSpace)===St,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Nn,flipSided:v.side===Zt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:ge&&v.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ge&&v.extensions.multiDraw===!0||Le)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return we.vertexUv1s=l.has(1),we.vertexUv2s=l.has(2),we.vertexUv3s=l.has(3),l.clear(),we}function u(v){let w=[];if(v.shaderID?w.push(v.shaderID):(w.push(v.customVertexShaderID),w.push(v.customFragmentShaderID)),v.defines!==void 0)for(let P in v.defines)w.push(P),w.push(v.defines[P]);return v.isRawShaderMaterial===!1&&(p(w,v),S(w,v),w.push(i.outputColorSpace)),w.push(v.customProgramCacheKey),w.join()}function p(v,w){v.push(w.precision),v.push(w.outputColorSpace),v.push(w.envMapMode),v.push(w.envMapCubeUVHeight),v.push(w.mapUv),v.push(w.alphaMapUv),v.push(w.lightMapUv),v.push(w.aoMapUv),v.push(w.bumpMapUv),v.push(w.normalMapUv),v.push(w.displacementMapUv),v.push(w.emissiveMapUv),v.push(w.metalnessMapUv),v.push(w.roughnessMapUv),v.push(w.anisotropyMapUv),v.push(w.clearcoatMapUv),v.push(w.clearcoatNormalMapUv),v.push(w.clearcoatRoughnessMapUv),v.push(w.iridescenceMapUv),v.push(w.iridescenceThicknessMapUv),v.push(w.sheenColorMapUv),v.push(w.sheenRoughnessMapUv),v.push(w.specularMapUv),v.push(w.specularColorMapUv),v.push(w.specularIntensityMapUv),v.push(w.transmissionMapUv),v.push(w.thicknessMapUv),v.push(w.combine),v.push(w.fogExp2),v.push(w.sizeAttenuation),v.push(w.morphTargetsCount),v.push(w.morphAttributeCount),v.push(w.numSunLights),v.push(w.numDirLights),v.push(w.numPointLights),v.push(w.numSpotLights),v.push(w.numSpotLightMaps),v.push(w.numHemiLights),v.push(w.numRectAreaLights),v.push(w.numSunLightShadows),v.push(w.numDirLightShadows),v.push(w.numPointLightShadows),v.push(w.numSpotLightShadows),v.push(w.numSpotLightShadowsWithMaps),v.push(w.numLightProbes),v.push(w.shadowMapType),v.push(w.toneMapping),v.push(w.numClippingPlanes),v.push(w.numClipIntersection),v.push(w.depthPacking)}function S(v,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.retroreflection&&a.enable(24),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),w.hasPositionAttribute&&a.enable(23),v.push(a.mask)}function C(v){let w=m[v.type],P;if(w){let D=xi[w];P=En.clone(D.uniforms)}else P=v.uniforms;return P}function y(v,w){let P=h.get(w);return P!==void 0?++P.usedTimes:(P=new Iv(i,w,v,s),c.push(P),h.set(w,P)),P}function M(v){if(--v.usedTimes===0){let w=c.indexOf(v);c[w]=c[c.length-1],c.pop(),h.delete(v.cacheKey),v.destroy()}}function E(v){o.remove(v)}function R(){o.dispose()}return{getParameters:A,getProgramCacheKey:u,getUniforms:C,acquireProgram:y,releaseProgram:M,releaseShaderCache:E,programs:c,dispose:R}}function kv(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function Uv(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function uf(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function pf(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(d){let m=0;return d.isInstancedMesh&&(m+=2),d.isSkinnedMesh&&(m+=1),m}function o(d,m,g,A,u,p){let S=i[e];return S===void 0?(S={id:d.id,object:d,geometry:m,material:g,materialVariant:a(d),groupOrder:A,renderOrder:d.renderOrder,z:u,group:p},i[e]=S):(S.id=d.id,S.object=d,S.geometry=m,S.material=g,S.materialVariant=a(d),S.groupOrder=A,S.renderOrder=d.renderOrder,S.z=u,S.group=p),e++,S}function l(d,m,g,A,u,p,S){S.reversedDepth===!0&&(u=-u);let C=o(d,m,g,A,u,p);g.transmission>0?n.push(C):g.transparent===!0?s.push(C):t.push(C)}function c(d,m,g,A,u,p){let S=o(d,m,g,A,u,p);g.transmission>0?n.unshift(S):g.transparent===!0?s.unshift(S):t.unshift(S)}function h(d,m){t.length>1&&t.sort(d||Uv),n.length>1&&n.sort(m||uf),s.length>1&&s.sort(m||uf)}function f(){for(let d=e,m=i.length;d<m;d++){let g=i[d];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:f,sort:h}}function Fv(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new pf,i.set(n,[a])):s>=r.length?(a=new pf,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function Ov(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new F,color:new st};break;case"SpotLight":t={position:new F,direction:new F,color:new st,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new F,color:new st,distance:0,decay:0};break;case"HemisphereLight":t={direction:new F,skyColor:new st,groundColor:new st};break;case"RectAreaLight":t={color:new st,position:new F,halfWidth:new F,halfHeight:new F};break}return i[e.id]=t,t}}}function Bv(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new me};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new me};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new me,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var zv=0;function Vv(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Hv(i){let e=new Ov,t=Bv(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new F);let s=new F,r=new Mt,a=new Mt;function o(c){let h=0,f=0,d=0;for(let N=0;N<9;N++)n.probe[N].set(0,0,0);let m=0,g=0,A=0,u=0,p=0,S=0,C=0,y=0,M=0,E=0,R=0,v=0,w=0,P=0;c.sort(Vv);for(let N=0,O=c.length;N<O;N++){let L=c[N],U=L.color,G=L.intensity,Y=L.distance,re=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===ss?re=L.shadow.map.texture:re=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)h+=U.r*G,f+=U.g*G,d+=U.b*G;else if(L.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(L.sh.coefficients[W],G);P++}else if(L.isSunLight){let W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let Z=L.shadow,ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize.copy(Z.mapSize).multiply(Z.getFrameExtents()),n.sunShadow[g]=ie,n.sunShadowMap[g]=re;let xe=Z.getViewportCount();for(let be=0;be<xe;be++)n.sunShadowMatrix[A+be]=Z.getMatrix(be),n.sunShadowCascade[A+be]=Z._cascadeData[be];A+=xe,g++}n.sun[m]=W,m++}else if(L.isDirectionalLight){let W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let Z=L.shadow,ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize=Z.mapSize,n.directionalShadow[u]=ie,n.directionalShadowMap[u]=re,n.directionalShadowMatrix[u]=L.shadow.matrix,M++}n.directional[u]=W,u++}else if(L.isSpotLight){let W=e.get(L);W.position.setFromMatrixPosition(L.matrixWorld),W.color.copy(U).multiplyScalar(G),W.distance=Y,W.coneCos=Math.cos(L.angle),W.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),W.decay=L.decay,n.spot[S]=W;let Z=L.shadow;if(L.map&&(n.spotLightMap[v]=L.map,v++,Z.updateMatrices(L),L.castShadow&&w++),n.spotLightMatrix[S]=Z.matrix,L.castShadow){let ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize=Z.mapSize,n.spotShadow[S]=ie,n.spotShadowMap[S]=re,R++}S++}else if(L.isRectAreaLight){let W=e.get(L);W.color.copy(U).multiplyScalar(G),W.halfWidth.set(L.width*.5,0,0),W.halfHeight.set(0,L.height*.5,0),n.rectArea[C]=W,C++}else if(L.isPointLight){let W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),W.distance=L.distance,W.decay=L.decay,L.castShadow){let Z=L.shadow,ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize=Z.mapSize,ie.shadowCameraNear=Z.camera.near,ie.shadowCameraFar=Z.camera.far,n.pointShadow[p]=ie,n.pointShadowMap[p]=re,n.pointShadowMatrix[p]=L.shadow.matrix,E++}n.point[p]=W,p++}else if(L.isHemisphereLight){let W=e.get(L);W.skyColor.copy(L.color).multiplyScalar(G),W.groundColor.copy(L.groundColor).multiplyScalar(G),n.hemi[y]=W,y++}}C>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Fe.LTC_FLOAT_1,n.rectAreaLTC2=Fe.LTC_FLOAT_2):(n.rectAreaLTC1=Fe.LTC_HALF_1,n.rectAreaLTC2=Fe.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=d;let D=n.hash;(D.sunLength!==m||D.directionalLength!==u||D.pointLength!==p||D.spotLength!==S||D.rectAreaLength!==C||D.hemiLength!==y||D.numSunShadows!==g||D.numDirectionalShadows!==M||D.numPointShadows!==E||D.numSpotShadows!==R||D.numSpotMaps!==v||D.numLightProbes!==P)&&(n.sun.length=m,n.directional.length=u,n.spot.length=S,n.rectArea.length=C,n.point.length=p,n.hemi.length=y,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=A,n.sunShadowCascade.length=A,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.directionalShadowMatrix.length=M,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=R,n.spotShadowMap.length=R,n.spotLightMatrix.length=R+v-w,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=P,D.sunLength=m,D.directionalLength=u,D.pointLength=p,D.spotLength=S,D.rectAreaLength=C,D.hemiLength=y,D.numSunShadows=g,D.numDirectionalShadows=M,D.numPointShadows=E,D.numSpotShadows=R,D.numSpotMaps=v,D.numLightProbes=P,n.version=zv++)}function l(c,h){let f=0,d=0,m=0,g=0,A=0,u=0,p=h.matrixWorldInverse;for(let S=0,C=c.length;S<C;S++){let y=c[S];if(y.isSunLight){let M=n.sun[f];M.direction.setFromMatrixPosition(y.matrixWorld),M.direction.transformDirection(p),f++}else if(y.isDirectionalLight){let M=n.directional[d];M.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(p),d++}else if(y.isSpotLight){let M=n.spot[g];M.position.setFromMatrixPosition(y.matrixWorld),M.position.applyMatrix4(p),M.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(p),g++}else if(y.isRectAreaLight){let M=n.rectArea[A];M.position.setFromMatrixPosition(y.matrixWorld),M.position.applyMatrix4(p),a.identity(),r.copy(y.matrixWorld),r.premultiply(p),a.extractRotation(r),M.halfWidth.set(y.width*.5,0,0),M.halfHeight.set(0,y.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),A++}else if(y.isPointLight){let M=n.point[m];M.position.setFromMatrixPosition(y.matrixWorld),M.position.applyMatrix4(p),m++}else if(y.isHemisphereLight){let M=n.hemi[u];M.direction.setFromMatrixPosition(y.matrixWorld),M.direction.transformDirection(p),u++}}}return{setup:o,setupView:l,state:n}}function ff(i){let e=new Hv(i),t=[],n=[],s=[];function r(d){f.camera=d,t.length=0,n.length=0,s.length=0}function a(d){t.push(d)}function o(d){n.push(d)}function l(d){s.push(d)}function c(){e.setup(t)}function h(d){e.setupView(t,d)}let f={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function Gv(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new ff(i),e.set(s,[o])):r>=a.length?(o=new ff(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var Wv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Xv=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Yv=[new F(1,0,0),new F(-1,0,0),new F(0,1,0),new F(0,-1,0),new F(0,0,1),new F(0,0,-1)],jv=[new F(0,-1,0),new F(0,-1,0),new F(0,0,1),new F(0,0,-1),new F(0,-1,0),new F(0,-1,0)],mf=new Mt,Ga=new F,nd=new F;function qv(i,e,t){let n=new ur,s=new me,r=new me,a=new kt,o=new el,l=new tl,c={},h=t.maxTextureSize,f={[fi]:Zt,[Zt]:fi,[Nn]:Nn},d=new Ft({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new me},radius:{value:4}},vertexShader:Wv,fragmentShader:Xv}),m=d.clone();m.defines.HORIZONTAL_PASS=1;let g=new ln;g.setAttribute("position",new fn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let A=new mt(g,d),u=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=wa;let p=this.type;this.render=function(E,R,v){if(u.enabled===!1||u.autoUpdate===!1&&u.needsUpdate===!1||E.length===0)return;this.type===cp&&(nt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=wa);let w=i.getRenderTarget(),P=i.getActiveCubeFace(),D=i.getActiveMipmapLevel(),N=i.state;N.setBlending(Gt),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);let O=p!==this.type;O&&R.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(U=>U.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,U=E.length;L<U;L++){let G=E[L],Y=G.shadow;if(Y===void 0){nt("WebGLShadowMap:",G,"has no shadow.");continue}if(Y.autoUpdate===!1&&Y.needsUpdate===!1)continue;s.copy(Y.mapSize);let re=Y.getFrameExtents();s.multiply(re),r.copy(Y.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/re.x),s.x=r.x*re.x,Y.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/re.y),s.y=r.y*re.y,Y.mapSize.y=r.y));let W=i.state.buffers.depth.getReversed();if(Y.camera._reversedDepth=W,Y.map===null||O===!0){if(Y.map!==null&&(Y.map.depthTexture!==null&&(Y.map.depthTexture.dispose(),Y.map.depthTexture=null),Y.map.dispose()),this.type===ts){if(G.isPointLight){nt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}Y.map=new Ut(s.x,s.y,{format:ss,type:Dt,minFilter:zt,magFilter:zt,generateMipmaps:!1}),Y.map.texture.name=G.name+".shadowMap",Y.map.depthTexture=new pi(s.x,s.y,bn),Y.map.depthTexture.name=G.name+".shadowMapDepth",Y.map.depthTexture.format=ci,Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=Ht,Y.map.depthTexture.magFilter=Ht}else G.isPointLight?(Y.map=new ac(s.x),Y.map.depthTexture=new jo(s.x,Qn)):(Y.map=new Ut(s.x,s.y),Y.map.depthTexture=new pi(s.x,s.y,Qn)),Y.map.depthTexture.name=G.name+".shadowMap",Y.map.depthTexture.format=ci,this.type===wa?(Y.map.depthTexture.compareFunction=W?ic:nc,Y.map.depthTexture.minFilter=zt,Y.map.depthTexture.magFilter=zt):(Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=Ht,Y.map.depthTexture.magFilter=Ht);Y.camera.updateProjectionMatrix()}Y.map.isWebGLCubeRenderTarget!==!0&&(Y.map.width!==s.x||Y.map.height!==s.y)&&Y.map.setSize(s.x,s.y);let Z=Y.map.isWebGLCubeRenderTarget?6:Y.getViewportCount();G.isPointLight!==!0&&Y.updateMatrices(G,v);for(let ie=0;ie<Z;ie++){let xe=Y.getCamera(ie);if(G.isPointLight){let be=Y.camera,pe=Y.matrix,K=G.distance||be.far;K!==be.far&&(be.far=K,be.updateProjectionMatrix()),Ga.setFromMatrixPosition(G.matrixWorld),be.position.copy(Ga),nd.copy(be.position),nd.add(Yv[ie]),be.up.copy(jv[ie]),be.lookAt(nd),be.updateMatrixWorld(),pe.makeTranslation(-Ga.x,-Ga.y,-Ga.z),mf.multiplyMatrices(be.projectionMatrix,be.matrixWorldInverse),Y._frustum.setFromProjectionMatrix(mf,be.coordinateSystem,be.reversedDepth)}if(Y.map.isWebGLCubeRenderTarget)i.setRenderTarget(Y.map,ie),i.clear();else{ie===0&&(i.setRenderTarget(Y.map),i.clear());let be=Y.getViewport(ie);a.set(r.x*be.x,r.y*be.y,r.x*be.z,r.y*be.w),N.viewport(a)}n=Y.getFrustum(ie),y(R,v,xe,G,this.type)}Y.isPointLightShadow!==!0&&this.type===ts&&S(Y,v),Y.needsUpdate=!1}p=this.type,u.needsUpdate=!1,i.setRenderTarget(w,P,D)};function S(E,R){let v=e.update(A);d.defines.VSM_SAMPLES!==E.blurSamples&&(d.defines.VSM_SAMPLES=E.blurSamples,m.defines.VSM_SAMPLES=E.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),E.mapPass===null?E.mapPass=new Ut(s.x,s.y,{format:ss,type:Dt}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),d.uniforms.shadow_pass.value=E.map.depthTexture,d.uniforms.resolution.value.set(E.map.width,E.map.height),d.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(R,null,v,d,A,null),m.uniforms.shadow_pass.value=E.mapPass.texture,m.uniforms.resolution.value.set(E.map.width,E.map.height),m.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(R,null,v,m,A,null)}function C(E,R,v,w){let P=null,D=v.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(D!==void 0)P=D;else if(P=v.isPointLight===!0?l:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let N=P.uuid,O=R.uuid,L=c[N];L===void 0&&(L={},c[N]=L);let U=L[O];U===void 0&&(U=P.clone(),L[O]=U,R.addEventListener("dispose",M)),P=U}if(P.visible=R.visible,P.wireframe=R.wireframe,w===ts?P.side=R.shadowSide!==null?R.shadowSide:R.side:P.side=R.shadowSide!==null?R.shadowSide:f[R.side],P.alphaMap=R.alphaMap,P.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,P.map=R.map,P.clipShadows=R.clipShadows,P.clippingPlanes=R.clippingPlanes,P.clipIntersection=R.clipIntersection,P.displacementMap=R.displacementMap,P.displacementScale=R.displacementScale,P.displacementBias=R.displacementBias,P.wireframeLinewidth=R.wireframeLinewidth,P.linewidth=R.linewidth,v.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let N=i.properties.get(P);N.light=v}return P}function y(E,R,v,w,P){if(E.visible===!1)return;if(E.layers.test(R.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&P===ts)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,E.matrixWorld);let O=e.update(E),L=E.material;if(Array.isArray(L)){let U=O.groups;for(let G=0,Y=U.length;G<Y;G++){let re=U[G],W=L[re.materialIndex];if(W&&W.visible){let Z=C(E,W,w,P);E.onBeforeShadow(i,E,R,v,O,Z,re),i.renderBufferDirect(v,null,O,Z,E,re),E.onAfterShadow(i,E,R,v,O,Z,re)}}}else if(L.visible){let U=C(E,L,w,P);E.onBeforeShadow(i,E,R,v,O,U,null),i.renderBufferDirect(v,null,O,U,E,null),E.onAfterShadow(i,E,R,v,O,U,null)}}let N=E.children;for(let O=0,L=N.length;O<L;O++)y(N[O],R,v,w,P)}function M(E){E.target.removeEventListener("dispose",M);for(let v in c){let w=c[v],P=E.target.uuid;P in w&&(w[P].dispose(),delete w[P])}}}function $v(i,e){function t(){let z=!1,Re=new kt,le=null,De=new kt(0,0,0,0);return{setMask:function(ke){le!==ke&&!z&&(i.colorMask(ke,ke,ke,ke),le=ke)},setLocked:function(ke){z=ke},setClear:function(ke,ge,Ke,we,gt){gt===!0&&(ke*=we,ge*=we,Ke*=we),Re.set(ke,ge,Ke,we),De.equals(Re)===!1&&(i.clearColor(ke,ge,Ke,we),De.copy(Re))},reset:function(){z=!1,le=null,De.set(-1,0,0,0)}}}function n(){let z=!1,Re=!1,le=null,De=null,ke=null;return{setReversed:function(ge){if(Re!==ge){let Ke=e.get("EXT_clip_control");ge?Ke.clipControlEXT(Ke.LOWER_LEFT_EXT,Ke.ZERO_TO_ONE_EXT):Ke.clipControlEXT(Ke.LOWER_LEFT_EXT,Ke.NEGATIVE_ONE_TO_ONE_EXT),Re=ge;let we=ke;ke=null,this.setClear(we)}},getReversed:function(){return Re},setTest:function(ge){ge?se(i.DEPTH_TEST):ce(i.DEPTH_TEST)},setMask:function(ge){le!==ge&&!z&&(i.depthMask(ge),le=ge)},setFunc:function(ge){if(Re&&(ge=zp[ge]),De!==ge){switch(ge){case ko:i.depthFunc(i.NEVER);break;case Uo:i.depthFunc(i.ALWAYS);break;case Fo:i.depthFunc(i.LESS);break;case sr:i.depthFunc(i.LEQUAL);break;case Oo:i.depthFunc(i.EQUAL);break;case Bo:i.depthFunc(i.GEQUAL);break;case zo:i.depthFunc(i.GREATER);break;case Vo:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}De=ge}},setLocked:function(ge){z=ge},setClear:function(ge){ke!==ge&&(ke=ge,Re&&(ge=1-ge),i.clearDepth(ge))},reset:function(){z=!1,le=null,De=null,ke=null,Re=!1}}}function s(){let z=!1,Re=null,le=null,De=null,ke=null,ge=null,Ke=null,we=null,gt=null;return{setTest:function(vt){z||(vt?se(i.STENCIL_TEST):ce(i.STENCIL_TEST))},setMask:function(vt){Re!==vt&&!z&&(i.stencilMask(vt),Re=vt)},setFunc:function(vt,cn,hn){(le!==vt||De!==cn||ke!==hn)&&(i.stencilFunc(vt,cn,hn),le=vt,De=cn,ke=hn)},setOp:function(vt,cn,hn){(ge!==vt||Ke!==cn||we!==hn)&&(i.stencilOp(vt,cn,hn),ge=vt,Ke=cn,we=hn)},setLocked:function(vt){z=vt},setClear:function(vt){gt!==vt&&(i.clearStencil(vt),gt=vt)},reset:function(){z=!1,Re=null,le=null,De=null,ke=null,ge=null,Ke=null,we=null,gt=null}}}let r=new t,a=new n,o=new s,l=new WeakMap,c=new WeakMap,h={},f={},d={},m=new WeakMap,g=[],A=null,u=!1,p=null,S=null,C=null,y=null,M=null,E=null,R=null,v=new st(0,0,0),w=0,P=!1,D=null,N=null,O=null,L=null,U=null,G=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,re=0,W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(re=parseFloat(/^WebGL (\d)/.exec(W)[1]),Y=re>=1):W.indexOf("OpenGL ES")!==-1&&(re=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),Y=re>=2);let Z=null,ie={},xe=i.getParameter(i.SCISSOR_BOX),be=i.getParameter(i.VIEWPORT),pe=new kt().fromArray(xe),K=new kt().fromArray(be);function Je(z,Re,le,De){let ke=new Uint8Array(4),ge=i.createTexture();i.bindTexture(z,ge),i.texParameteri(z,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(z,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ke=0;Ke<le;Ke++)z===i.TEXTURE_3D||z===i.TEXTURE_2D_ARRAY?i.texImage3D(Re,0,i.RGBA,1,1,De,0,i.RGBA,i.UNSIGNED_BYTE,ke):i.texImage2D(Re+Ke,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ke);return ge}let J={};J[i.TEXTURE_2D]=Je(i.TEXTURE_2D,i.TEXTURE_2D,1),J[i.TEXTURE_CUBE_MAP]=Je(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),J[i.TEXTURE_2D_ARRAY]=Je(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),J[i.TEXTURE_3D]=Je(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),se(i.DEPTH_TEST),a.setFunc(sr),Me(!1),Ae(Ih),se(i.CULL_FACE),de(Gt);function se(z){h[z]!==!0&&(i.enable(z),h[z]=!0)}function ce(z){h[z]!==!1&&(i.disable(z),h[z]=!1)}function Ye(z,Re){return d[z]!==Re?(i.bindFramebuffer(z,Re),d[z]=Re,z===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=Re),z===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=Re),!0):!1}function Le(z,Re){let le=g,De=!1;if(z){le=m.get(Re),le===void 0&&(le=[],m.set(Re,le));let ke=z.textures;if(le.length!==ke.length||le[0]!==i.COLOR_ATTACHMENT0){for(let ge=0,Ke=ke.length;ge<Ke;ge++)le[ge]=i.COLOR_ATTACHMENT0+ge;le.length=ke.length,De=!0}}else le[0]!==i.BACK&&(le[0]=i.BACK,De=!0);De&&i.drawBuffers(le)}function Qe(z){return A!==z?(i.useProgram(z),A=z,!0):!1}let ct={[Gn]:i.FUNC_ADD,[hp]:i.FUNC_SUBTRACT,[dp]:i.FUNC_REVERSE_SUBTRACT};ct[up]=i.MIN,ct[pp]=i.MAX;let ae={[Es]:i.ZERO,[fp]:i.ONE,[mp]:i.SRC_COLOR,[Nh]:i.SRC_ALPHA,[vp]:i.SRC_ALPHA_SATURATE,[Aa]:i.DST_COLOR,[Ta]:i.DST_ALPHA,[gp]:i.ONE_MINUS_SRC_COLOR,[kh]:i.ONE_MINUS_SRC_ALPHA,[_p]:i.ONE_MINUS_DST_COLOR,[xp]:i.ONE_MINUS_DST_ALPHA,[yp]:i.CONSTANT_COLOR,[bp]:i.ONE_MINUS_CONSTANT_COLOR,[Mp]:i.CONSTANT_ALPHA,[Sp]:i.ONE_MINUS_CONSTANT_ALPHA};function de(z,Re,le,De,ke,ge,Ke,we,gt,vt){if(z===Gt){u===!0&&(ce(i.BLEND),u=!1);return}if(u===!1&&(se(i.BLEND),u=!0),z!==ml){if(z!==p||vt!==P){if((S!==Gn||M!==Gn)&&(i.blendEquation(i.FUNC_ADD),S=Gn,M=Gn),vt)switch(z){case yr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ea:i.blendFunc(i.ONE,i.ONE);break;case Dh:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Lh:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:it("WebGLState: Invalid blending: ",z);break}else switch(z){case yr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ea:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Dh:it("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Lh:it("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:it("WebGLState: Invalid blending: ",z);break}C=null,y=null,E=null,R=null,v.set(0,0,0),w=0,p=z,P=vt}return}ke=ke||Re,ge=ge||le,Ke=Ke||De,(Re!==S||ke!==M)&&(i.blendEquationSeparate(ct[Re],ct[ke]),S=Re,M=ke),(le!==C||De!==y||ge!==E||Ke!==R)&&(i.blendFuncSeparate(ae[le],ae[De],ae[ge],ae[Ke]),C=le,y=De,E=ge,R=Ke),(we.equals(v)===!1||gt!==w)&&(i.blendColor(we.r,we.g,we.b,gt),v.copy(we),w=gt),p=z,P=!1}function _e(z,Re){z.side===Nn?ce(i.CULL_FACE):se(i.CULL_FACE);let le=z.side===Zt;Re&&(le=!le),Me(le),z.blending===yr&&z.transparent===!1?de(Gt):de(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),a.setFunc(z.depthFunc),a.setTest(z.depthTest),a.setMask(z.depthWrite),r.setMask(z.colorWrite);let De=z.stencilWrite;o.setTest(De),De&&(o.setMask(z.stencilWriteMask),o.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),o.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),ve(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?se(i.SAMPLE_ALPHA_TO_COVERAGE):ce(i.SAMPLE_ALPHA_TO_COVERAGE)}function Me(z){D!==z&&(z?i.frontFace(i.CW):i.frontFace(i.CCW),D=z)}function Ae(z){z!==op?(se(i.CULL_FACE),z!==N&&(z===Ih?i.cullFace(i.BACK):z===lp?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ce(i.CULL_FACE),N=z}function je(z){z!==O&&(Y&&i.lineWidth(z),O=z)}function ve(z,Re,le){z?(se(i.POLYGON_OFFSET_FILL),(L!==Re||U!==le)&&(L=Re,U=le,a.getReversed()&&(Re=-Re),i.polygonOffset(Re,le))):ce(i.POLYGON_OFFSET_FILL)}function Pe(z){z?se(i.SCISSOR_TEST):ce(i.SCISSOR_TEST)}function Be(z){z===void 0&&(z=i.TEXTURE0+G-1),Z!==z&&(i.activeTexture(z),Z=z)}function k(z,Re,le){le===void 0&&(Z===null?le=i.TEXTURE0+G-1:le=Z);let De=ie[le];De===void 0&&(De={type:void 0,texture:void 0},ie[le]=De),(De.type!==z||De.texture!==Re)&&(Z!==le&&(i.activeTexture(le),Z=le),i.bindTexture(z,Re||J[z]),De.type=z,De.texture=Re)}function ht(){let z=ie[Z];z!==void 0&&z.type!==void 0&&(i.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function he(){try{i.compressedTexImage2D(...arguments)}catch(z){it("WebGLState:",z)}}function I(){try{i.compressedTexImage3D(...arguments)}catch(z){it("WebGLState:",z)}}function b(){try{i.texSubImage2D(...arguments)}catch(z){it("WebGLState:",z)}}function V(){try{i.texSubImage3D(...arguments)}catch(z){it("WebGLState:",z)}}function j(){try{i.compressedTexSubImage2D(...arguments)}catch(z){it("WebGLState:",z)}}function ne(){try{i.compressedTexSubImage3D(...arguments)}catch(z){it("WebGLState:",z)}}function ye(){try{i.texStorage2D(...arguments)}catch(z){it("WebGLState:",z)}}function Te(){try{i.texStorage3D(...arguments)}catch(z){it("WebGLState:",z)}}function H(){try{i.texImage2D(...arguments)}catch(z){it("WebGLState:",z)}}function ee(){try{i.texImage3D(...arguments)}catch(z){it("WebGLState:",z)}}function fe(z){return f[z]!==void 0?f[z]:i.getParameter(z)}function Ie(z,Re){f[z]!==Re&&(i.pixelStorei(z,Re),f[z]=Re)}function Se(z){pe.equals(z)===!1&&(i.scissor(z.x,z.y,z.z,z.w),pe.copy(z))}function Ee(z){K.equals(z)===!1&&(i.viewport(z.x,z.y,z.z,z.w),K.copy(z))}function Ve(z,Re){let le=c.get(Re);le===void 0&&(le=new WeakMap,c.set(Re,le));let De=le.get(z);De===void 0&&(De=i.getUniformBlockIndex(Re,z.name),le.set(z,De))}function $e(z,Re){let De=c.get(Re).get(z);l.get(Re)!==De&&(i.uniformBlockBinding(Re,De,z.__bindingPointIndex),l.set(Re,De))}function et(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},f={},Z=null,ie={},d={},m=new WeakMap,g=[],A=null,u=!1,p=null,S=null,C=null,y=null,M=null,E=null,R=null,v=new st(0,0,0),w=0,P=!1,D=null,N=null,O=null,L=null,U=null,pe.set(0,0,i.canvas.width,i.canvas.height),K.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:se,disable:ce,bindFramebuffer:Ye,drawBuffers:Le,useProgram:Qe,setBlending:de,setMaterial:_e,setFlipSided:Me,setCullFace:Ae,setLineWidth:je,setPolygonOffset:ve,setScissorTest:Pe,activeTexture:Be,bindTexture:k,unbindTexture:ht,compressedTexImage2D:he,compressedTexImage3D:I,texImage2D:H,texImage3D:ee,pixelStorei:Ie,getParameter:fe,updateUBOMapping:Ve,uniformBlockBinding:$e,texStorage2D:ye,texStorage3D:Te,texSubImage2D:b,texSubImage3D:V,compressedTexSubImage2D:j,compressedTexSubImage3D:ne,scissor:Se,viewport:Ee,reset:et}}function Zv(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new me,h=new WeakMap,f=new Set,d,m=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function A(I,b){return g?new OffscreenCanvas(I,b):ar("canvas")}function u(I,b,V){let j=1,ne=he(I);if((ne.width>V||ne.height>V)&&(j=V/Math.max(ne.width,ne.height)),j<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let ye=Math.floor(j*ne.width),Te=Math.floor(j*ne.height);d===void 0&&(d=A(ye,Te));let H=b?A(ye,Te):d;return H.width=ye,H.height=Te,H.getContext("2d").drawImage(I,0,0,ye,Te),nt("WebGLRenderer: Texture has been resized from ("+ne.width+"x"+ne.height+") to ("+ye+"x"+Te+")."),H}else return"data"in I&&nt("WebGLRenderer: Image in DataTexture is too big ("+ne.width+"x"+ne.height+")."),I;return I}function p(I){return I.generateMipmaps}function S(I){i.generateMipmap(I)}function C(I){return I.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?i.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function y(I,b,V,j,ne,ye=!1){if(I!==null){if(i[I]!==void 0)return i[I];nt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let Te;j&&(Te=e.get("EXT_texture_norm16"),Te||nt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let H=b;if(b===i.RED&&(V===i.FLOAT&&(H=i.R32F),V===i.HALF_FLOAT&&(H=i.R16F),V===i.UNSIGNED_BYTE&&(H=i.R8),V===i.UNSIGNED_SHORT&&Te&&(H=Te.R16_EXT),V===i.SHORT&&Te&&(H=Te.R16_SNORM_EXT)),b===i.RED_INTEGER&&(V===i.UNSIGNED_BYTE&&(H=i.R8UI),V===i.UNSIGNED_SHORT&&(H=i.R16UI),V===i.UNSIGNED_INT&&(H=i.R32UI),V===i.BYTE&&(H=i.R8I),V===i.SHORT&&(H=i.R16I),V===i.INT&&(H=i.R32I)),b===i.RG&&(V===i.FLOAT&&(H=i.RG32F),V===i.HALF_FLOAT&&(H=i.RG16F),V===i.UNSIGNED_BYTE&&(H=i.RG8),V===i.UNSIGNED_SHORT&&Te&&(H=Te.RG16_EXT),V===i.SHORT&&Te&&(H=Te.RG16_SNORM_EXT)),b===i.RG_INTEGER&&(V===i.UNSIGNED_BYTE&&(H=i.RG8UI),V===i.UNSIGNED_SHORT&&(H=i.RG16UI),V===i.UNSIGNED_INT&&(H=i.RG32UI),V===i.BYTE&&(H=i.RG8I),V===i.SHORT&&(H=i.RG16I),V===i.INT&&(H=i.RG32I)),b===i.RGB_INTEGER&&(V===i.UNSIGNED_BYTE&&(H=i.RGB8UI),V===i.UNSIGNED_SHORT&&(H=i.RGB16UI),V===i.UNSIGNED_INT&&(H=i.RGB32UI),V===i.BYTE&&(H=i.RGB8I),V===i.SHORT&&(H=i.RGB16I),V===i.INT&&(H=i.RGB32I)),b===i.RGBA_INTEGER&&(V===i.UNSIGNED_BYTE&&(H=i.RGBA8UI),V===i.UNSIGNED_SHORT&&(H=i.RGBA16UI),V===i.UNSIGNED_INT&&(H=i.RGBA32UI),V===i.BYTE&&(H=i.RGBA8I),V===i.SHORT&&(H=i.RGBA16I),V===i.INT&&(H=i.RGBA32I)),b===i.RGB&&(V===i.UNSIGNED_SHORT&&Te&&(H=Te.RGB16_EXT),V===i.SHORT&&Te&&(H=Te.RGB16_SNORM_EXT),V===i.UNSIGNED_INT_5_9_9_9_REV&&(H=i.RGB9_E5),V===i.UNSIGNED_INT_10F_11F_11F_REV&&(H=i.R11F_G11F_B10F)),b===i.RGBA){let ee=ye?jr:ft.getTransfer(ne);V===i.FLOAT&&(H=i.RGBA32F),V===i.HALF_FLOAT&&(H=i.RGBA16F),V===i.UNSIGNED_BYTE&&(H=ee===St?i.SRGB8_ALPHA8:i.RGBA8),V===i.UNSIGNED_SHORT&&Te&&(H=Te.RGBA16_EXT),V===i.SHORT&&Te&&(H=Te.RGBA16_SNORM_EXT),V===i.UNSIGNED_SHORT_4_4_4_4&&(H=i.RGBA4),V===i.UNSIGNED_SHORT_5_5_5_1&&(H=i.RGB5_A1)}return(H===i.R16F||H===i.R32F||H===i.RG16F||H===i.RG32F||H===i.RGBA16F||H===i.RGBA32F)&&e.get("EXT_color_buffer_float"),H}function M(I,b){let V;return I?b===null||b===Qn||b===is?V=i.DEPTH24_STENCIL8:b===bn?V=i.DEPTH32F_STENCIL8:b===Mr&&(V=i.DEPTH24_STENCIL8,nt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===Qn||b===is?V=i.DEPTH_COMPONENT24:b===bn?V=i.DEPTH_COMPONENT32F:b===Mr&&(V=i.DEPTH_COMPONENT16),V}function E(I,b){return p(I)===!0||I.isFramebufferTexture&&I.minFilter!==Ht&&I.minFilter!==zt?Math.log2(Math.max(b.width,b.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?b.mipmaps.length:1}function R(I){let b=I.target;b.removeEventListener("dispose",R),w(b),b.isVideoTexture&&h.delete(b),b.isHTMLTexture&&f.delete(b)}function v(I){let b=I.target;b.removeEventListener("dispose",v),D(b)}function w(I){let b=n.get(I);if(b.__webglInit===void 0)return;let V=I.source,j=m.get(V);if(j){let ne=j[b.__cacheKey];ne.usedTimes--,ne.usedTimes===0&&P(I),Object.keys(j).length===0&&m.delete(V)}n.remove(I)}function P(I){let b=n.get(I);i.deleteTexture(b.__webglTexture);let V=I.source,j=m.get(V);delete j[b.__cacheKey],a.memory.textures--}function D(I){let b=n.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),n.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(b.__webglFramebuffer[j]))for(let ne=0;ne<b.__webglFramebuffer[j].length;ne++)i.deleteFramebuffer(b.__webglFramebuffer[j][ne]);else i.deleteFramebuffer(b.__webglFramebuffer[j]);b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer[j])}else{if(Array.isArray(b.__webglFramebuffer))for(let j=0;j<b.__webglFramebuffer.length;j++)i.deleteFramebuffer(b.__webglFramebuffer[j]);else i.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&i.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let j=0;j<b.__webglColorRenderbuffer.length;j++)b.__webglColorRenderbuffer[j]&&i.deleteRenderbuffer(b.__webglColorRenderbuffer[j]);b.__webglDepthRenderbuffer&&i.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let V=I.textures;for(let j=0,ne=V.length;j<ne;j++){let ye=n.get(V[j]);ye.__webglTexture&&(i.deleteTexture(ye.__webglTexture),a.memory.textures--),n.remove(V[j])}n.remove(I)}let N=0;function O(){N=0}function L(){return N}function U(I){N=I}function G(){let I=N;return I>=s.maxTextures&&nt("WebGLTextures: Trying to use "+(I+1)+" texture units while this GPU supports only "+s.maxTextures),N+=1,I}function Y(I){let b=[];return b.push(I.wrapS),b.push(I.wrapT),b.push(I.wrapR||0),b.push(I.magFilter),b.push(I.minFilter),b.push(I.anisotropy),b.push(I.internalFormat),b.push(I.format),b.push(I.type),b.push(I.generateMipmaps),b.push(I.premultiplyAlpha),b.push(I.flipY),b.push(I.unpackAlignment),b.push(I.colorSpace),b.join()}function re(I,b){let V=n.get(I);if(I.isVideoTexture&&k(I),I.isRenderTargetTexture===!1&&I.isExternalTexture!==!0&&I.version>0&&V.__version!==I.version){let j=I.image;if(j===null)nt("WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)nt("WebGLRenderer: Texture marked for update but image is incomplete");else{ce(V,I,b);return}}else I.isExternalTexture&&(V.__webglTexture=I.sourceTexture?I.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,V.__webglTexture,i.TEXTURE0+b)}function W(I,b){let V=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&V.__version!==I.version){ce(V,I,b);return}else I.isExternalTexture&&(V.__webglTexture=I.sourceTexture?I.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,V.__webglTexture,i.TEXTURE0+b)}function Z(I,b){let V=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&V.__version!==I.version){ce(V,I,b);return}t.bindTexture(i.TEXTURE_3D,V.__webglTexture,i.TEXTURE0+b)}function ie(I,b){let V=n.get(I);if(I.isCubeDepthTexture!==!0&&I.version>0&&V.__version!==I.version){Ye(V,I,b);return}t.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture,i.TEXTURE0+b)}let xe={[zn]:i.REPEAT,[Bn]:i.CLAMP_TO_EDGE,[Ho]:i.MIRRORED_REPEAT},be={[Ht]:i.NEAREST,[Tp]:i.NEAREST_MIPMAP_NEAREST,[ka]:i.NEAREST_MIPMAP_LINEAR,[zt]:i.LINEAR,[_l]:i.LINEAR_MIPMAP_NEAREST,[Ii]:i.LINEAR_MIPMAP_LINEAR},pe={[Pp]:i.NEVER,[kp]:i.ALWAYS,[Ip]:i.LESS,[nc]:i.LEQUAL,[Dp]:i.EQUAL,[ic]:i.GEQUAL,[Lp]:i.GREATER,[Np]:i.NOTEQUAL};function K(I,b){if(b.type===bn&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===zt||b.magFilter===_l||b.magFilter===ka||b.magFilter===Ii||b.minFilter===zt||b.minFilter===_l||b.minFilter===ka||b.minFilter===Ii)&&nt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(I,i.TEXTURE_WRAP_S,xe[b.wrapS]),i.texParameteri(I,i.TEXTURE_WRAP_T,xe[b.wrapT]),(I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY)&&i.texParameteri(I,i.TEXTURE_WRAP_R,xe[b.wrapR]),i.texParameteri(I,i.TEXTURE_MAG_FILTER,be[b.magFilter]),i.texParameteri(I,i.TEXTURE_MIN_FILTER,be[b.minFilter]),b.compareFunction&&(i.texParameteri(I,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(I,i.TEXTURE_COMPARE_FUNC,pe[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===Ht||b.minFilter!==ka&&b.minFilter!==Ii||b.type===bn&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");i.texParameterf(I,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,s.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function Je(I,b){let V=!1;I.__webglInit===void 0&&(I.__webglInit=!0,b.addEventListener("dispose",R));let j=b.source,ne=m.get(j);ne===void 0&&(ne={},m.set(j,ne));let ye=Y(b);if(ye!==I.__cacheKey){ne[ye]===void 0&&(ne[ye]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,V=!0),ne[ye].usedTimes++;let Te=ne[I.__cacheKey];Te!==void 0&&(ne[I.__cacheKey].usedTimes--,Te.usedTimes===0&&P(b)),I.__cacheKey=ye,I.__webglTexture=ne[ye].texture}return V}function J(I,b,V){return Math.floor(Math.floor(I/V)/b)}function se(I,b,V,j){let ye=I.updateRanges;if(ye.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,b.width,b.height,V,j,b.data);else{ye.sort((Ie,Se)=>Ie.start-Se.start);let Te=0;for(let Ie=1;Ie<ye.length;Ie++){let Se=ye[Te],Ee=ye[Ie],Ve=Se.start+Se.count,$e=J(Ee.start,b.width,4),et=J(Se.start,b.width,4);Ee.start<=Ve+1&&$e===et&&J(Ee.start+Ee.count-1,b.width,4)===$e?Se.count=Math.max(Se.count,Ee.start+Ee.count-Se.start):(++Te,ye[Te]=Ee)}ye.length=Te+1;let H=t.getParameter(i.UNPACK_ROW_LENGTH),ee=t.getParameter(i.UNPACK_SKIP_PIXELS),fe=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,b.width);for(let Ie=0,Se=ye.length;Ie<Se;Ie++){let Ee=ye[Ie],Ve=Math.floor(Ee.start/4),$e=Math.ceil(Ee.count/4),et=Ve%b.width,z=Math.floor(Ve/b.width),Re=$e,le=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,et),t.pixelStorei(i.UNPACK_SKIP_ROWS,z),t.texSubImage2D(i.TEXTURE_2D,0,et,z,Re,le,V,j,b.data)}I.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,H),t.pixelStorei(i.UNPACK_SKIP_PIXELS,ee),t.pixelStorei(i.UNPACK_SKIP_ROWS,fe)}}function ce(I,b,V){let j=i.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(j=i.TEXTURE_2D_ARRAY),b.isData3DTexture&&(j=i.TEXTURE_3D);let ne=Je(I,b),ye=b.source;t.bindTexture(j,I.__webglTexture,i.TEXTURE0+V);let Te=n.get(ye);if(ye.version!==Te.__version||ne===!0){if(t.activeTexture(i.TEXTURE0+V),(typeof ImageBitmap<"u"&&b.image instanceof ImageBitmap)===!1){let le=ft.getPrimaries(ft.workingColorSpace),De=b.colorSpace===Di?null:ft.getPrimaries(b.colorSpace),ke=b.colorSpace===Di||le===De?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ke)}t.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment);let ee=u(b.image,!1,s.maxTextureSize);ee=ht(b,ee);let fe=r.convert(b.format,b.colorSpace),Ie=r.convert(b.type),Se=y(b.internalFormat,fe,Ie,b.normalized,b.colorSpace,b.isVideoTexture);K(j,b);let Ee,Ve=b.mipmaps,$e=b.isVideoTexture!==!0,et=Te.__version===void 0||ne===!0,z=ye.dataReady,Re=E(b,ee);if(b.isDepthTexture)Se=M(b.format===mi,b.type),et&&($e?t.texStorage2D(i.TEXTURE_2D,1,Se,ee.width,ee.height):t.texImage2D(i.TEXTURE_2D,0,Se,ee.width,ee.height,0,fe,Ie,null));else if(b.isDataTexture)if(Ve.length>0){$e&&et&&t.texStorage2D(i.TEXTURE_2D,Re,Se,Ve[0].width,Ve[0].height);for(let le=0,De=Ve.length;le<De;le++)Ee=Ve[le],$e?z&&t.texSubImage2D(i.TEXTURE_2D,le,0,0,Ee.width,Ee.height,fe,Ie,Ee.data):t.texImage2D(i.TEXTURE_2D,le,Se,Ee.width,Ee.height,0,fe,Ie,Ee.data);b.generateMipmaps=!1}else $e?(et&&t.texStorage2D(i.TEXTURE_2D,Re,Se,ee.width,ee.height),z&&se(b,ee,fe,Ie)):t.texImage2D(i.TEXTURE_2D,0,Se,ee.width,ee.height,0,fe,Ie,ee.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){$e&&et&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Re,Se,Ve[0].width,Ve[0].height,ee.depth);for(let le=0,De=Ve.length;le<De;le++)if(Ee=Ve[le],b.format!==wn)if(fe!==null)if($e){if(z)if(b.layerUpdates.size>0){let ke=Zh(Ee.width,Ee.height,b.format,b.type);for(let ge of b.layerUpdates){let Ke=Ee.data.subarray(ge*ke/Ee.data.BYTES_PER_ELEMENT,(ge+1)*ke/Ee.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,le,0,0,ge,Ee.width,Ee.height,1,fe,Ke)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,le,0,0,0,Ee.width,Ee.height,ee.depth,fe,Ee.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,le,Se,Ee.width,Ee.height,ee.depth,0,Ee.data,0,0);else nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else $e?z&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,le,0,0,0,Ee.width,Ee.height,ee.depth,fe,Ie,Ee.data):t.texImage3D(i.TEXTURE_2D_ARRAY,le,Se,Ee.width,Ee.height,ee.depth,0,fe,Ie,Ee.data);b.layerUpdates.size>0&&b.clearLayerUpdates()}else{$e&&et&&t.texStorage2D(i.TEXTURE_2D,Re,Se,Ve[0].width,Ve[0].height);for(let le=0,De=Ve.length;le<De;le++)Ee=Ve[le],b.format!==wn?fe!==null?$e?z&&t.compressedTexSubImage2D(i.TEXTURE_2D,le,0,0,Ee.width,Ee.height,fe,Ee.data):t.compressedTexImage2D(i.TEXTURE_2D,le,Se,Ee.width,Ee.height,0,Ee.data):nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):$e?z&&t.texSubImage2D(i.TEXTURE_2D,le,0,0,Ee.width,Ee.height,fe,Ie,Ee.data):t.texImage2D(i.TEXTURE_2D,le,Se,Ee.width,Ee.height,0,fe,Ie,Ee.data)}else if(b.isDataArrayTexture)if($e){if(et&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Re,Se,ee.width,ee.height,ee.depth),z)if(b.layerUpdates.size>0){let le=Zh(ee.width,ee.height,b.format,b.type);for(let De of b.layerUpdates){let ke=ee.data.subarray(De*le/ee.data.BYTES_PER_ELEMENT,(De+1)*le/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,De,ee.width,ee.height,1,fe,Ie,ke)}b.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,fe,Ie,ee.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Se,ee.width,ee.height,ee.depth,0,fe,Ie,ee.data);else if(b.isData3DTexture)$e?(et&&t.texStorage3D(i.TEXTURE_3D,Re,Se,ee.width,ee.height,ee.depth),z&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,fe,Ie,ee.data)):t.texImage3D(i.TEXTURE_3D,0,Se,ee.width,ee.height,ee.depth,0,fe,Ie,ee.data);else if(b.isFramebufferTexture){if(et)if($e)t.texStorage2D(i.TEXTURE_2D,Re,Se,ee.width,ee.height);else{let le=ee.width,De=ee.height;for(let ke=0;ke<Re;ke++)t.texImage2D(i.TEXTURE_2D,ke,Se,le,De,0,fe,Ie,null),le>>=1,De>>=1}}else if(b.isHTMLTexture){if("texElementImage2D"in i){let le=i.canvas;if(le.hasAttribute("layoutsubtree")||le.setAttribute("layoutsubtree","true"),ee.parentNode!==le){le.appendChild(ee),f.add(b),le.onpaint=De=>{let ke=De.changedElements;for(let ge of f)ke.includes(ge.image)&&(ge.needsUpdate=!0)},le.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,ee);else{let ke=i.RGBA,ge=i.RGBA,Ke=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,ke,ge,Ke,ee)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ve.length>0){if($e&&et){let le=he(Ve[0]);t.texStorage2D(i.TEXTURE_2D,Re,Se,le.width,le.height)}for(let le=0,De=Ve.length;le<De;le++)Ee=Ve[le],$e?z&&t.texSubImage2D(i.TEXTURE_2D,le,0,0,fe,Ie,Ee):t.texImage2D(i.TEXTURE_2D,le,Se,fe,Ie,Ee);b.generateMipmaps=!1}else if($e){if(et){let le=he(ee);t.texStorage2D(i.TEXTURE_2D,Re,Se,le.width,le.height)}z&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,fe,Ie,ee)}else t.texImage2D(i.TEXTURE_2D,0,Se,fe,Ie,ee);p(b)&&S(j),Te.__version=ye.version,b.onUpdate&&b.onUpdate(b)}I.__version=b.version}function Ye(I,b,V){if(b.image.length!==6)return;let j=Je(I,b),ne=b.source;t.bindTexture(i.TEXTURE_CUBE_MAP,I.__webglTexture,i.TEXTURE0+V);let ye=n.get(ne);if(ne.version!==ye.__version||j===!0){t.activeTexture(i.TEXTURE0+V);let Te=ft.getPrimaries(ft.workingColorSpace),H=b.colorSpace===Di?null:ft.getPrimaries(b.colorSpace),ee=b.colorSpace===Di||Te===H?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let fe=b.isCompressedTexture||b.image[0].isCompressedTexture,Ie=b.image[0]&&b.image[0].isDataTexture,Se=[];for(let ge=0;ge<6;ge++)!fe&&!Ie?Se[ge]=u(b.image[ge],!0,s.maxCubemapSize):Se[ge]=Ie?b.image[ge].image:b.image[ge],Se[ge]=ht(b,Se[ge]);let Ee=Se[0],Ve=r.convert(b.format,b.colorSpace),$e=r.convert(b.type),et=y(b.internalFormat,Ve,$e,b.normalized,b.colorSpace),z=b.isVideoTexture!==!0,Re=ye.__version===void 0||j===!0,le=ne.dataReady,De=E(b,Ee);K(i.TEXTURE_CUBE_MAP,b);let ke;if(fe){z&&Re&&t.texStorage2D(i.TEXTURE_CUBE_MAP,De,et,Ee.width,Ee.height);for(let ge=0;ge<6;ge++){ke=Se[ge].mipmaps;for(let Ke=0;Ke<ke.length;Ke++){let we=ke[Ke];b.format!==wn?Ve!==null?z?le&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke,0,0,we.width,we.height,Ve,we.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke,et,we.width,we.height,0,we.data):nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):z?le&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke,0,0,we.width,we.height,Ve,$e,we.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke,et,we.width,we.height,0,Ve,$e,we.data)}}}else{if(ke=b.mipmaps,z&&Re){ke.length>0&&De++;let ge=he(Se[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,De,et,ge.width,ge.height)}for(let ge=0;ge<6;ge++)if(Ie){z?le&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,0,0,Se[ge].width,Se[ge].height,Ve,$e,Se[ge].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,et,Se[ge].width,Se[ge].height,0,Ve,$e,Se[ge].data);for(let Ke=0;Ke<ke.length;Ke++){let gt=ke[Ke].image[ge].image;z?le&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke+1,0,0,gt.width,gt.height,Ve,$e,gt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke+1,et,gt.width,gt.height,0,Ve,$e,gt.data)}}else{z?le&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,0,0,Ve,$e,Se[ge]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,et,Ve,$e,Se[ge]);for(let Ke=0;Ke<ke.length;Ke++){let we=ke[Ke];z?le&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke+1,0,0,Ve,$e,we.image[ge]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,Ke+1,et,Ve,$e,we.image[ge])}}}p(b)&&S(i.TEXTURE_CUBE_MAP),ye.__version=ne.version,b.onUpdate&&b.onUpdate(b)}I.__version=b.version}function Le(I,b,V,j,ne,ye){let Te=r.convert(V.format,V.colorSpace),H=r.convert(V.type),ee=y(V.internalFormat,Te,H,V.normalized,V.colorSpace),fe=n.get(b),Ie=n.get(V);if(Ie.__renderTarget=b,!fe.__hasExternalTextures){let Se=Math.max(1,b.width>>ye),Ee=Math.max(1,b.height>>ye);ne===i.TEXTURE_3D||ne===i.TEXTURE_2D_ARRAY?t.texImage3D(ne,ye,ee,Se,Ee,b.depth,0,Te,H,null):t.texImage2D(ne,ye,ee,Se,Ee,0,Te,H,null)}t.bindFramebuffer(i.FRAMEBUFFER,I),Be(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,ne,Ie.__webglTexture,0,Pe(b)):(ne===i.TEXTURE_2D||ne>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ne<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,j,ne,Ie.__webglTexture,ye),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Qe(I,b,V){if(i.bindRenderbuffer(i.RENDERBUFFER,I),b.depthBuffer){let j=b.depthTexture,ne=j&&j.isDepthTexture?j.type:null,ye=M(b.stencilBuffer,ne),Te=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;Be(b)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Pe(b),ye,b.width,b.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,Pe(b),ye,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,ye,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Te,i.RENDERBUFFER,I)}else{let j=b.textures;for(let ne=0;ne<j.length;ne++){let ye=j[ne],Te=r.convert(ye.format,ye.colorSpace),H=r.convert(ye.type),ee=y(ye.internalFormat,Te,H,ye.normalized,ye.colorSpace);Be(b)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Pe(b),ee,b.width,b.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,Pe(b),ee,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,ee,b.width,b.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ct(I,b,V){let j=b.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,I),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ne=n.get(b.depthTexture);if(ne.__renderTarget=b,(!ne.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),j){if(ne.__webglInit===void 0&&(ne.__webglInit=!0,b.depthTexture.addEventListener("dispose",R)),ne.__webglTexture===void 0){ne.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,ne.__webglTexture),K(i.TEXTURE_CUBE_MAP,b.depthTexture);let fe=r.convert(b.depthTexture.format),Ie=r.convert(b.depthTexture.type),Se;b.depthTexture.format===ci?Se=i.DEPTH_COMPONENT24:b.depthTexture.format===mi&&(Se=i.DEPTH24_STENCIL8);for(let Ee=0;Ee<6;Ee++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Ee,0,Se,b.width,b.height,0,fe,Ie,null)}}else re(b.depthTexture,0);let ye=ne.__webglTexture,Te=Pe(b),H=j?i.TEXTURE_CUBE_MAP_POSITIVE_X+V:i.TEXTURE_2D,ee=b.depthTexture.format===mi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(b.depthTexture.format===ci)Be(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,H,ye,0,Te):i.framebufferTexture2D(i.FRAMEBUFFER,ee,H,ye,0);else if(b.depthTexture.format===mi)Be(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,H,ye,0,Te):i.framebufferTexture2D(i.FRAMEBUFFER,ee,H,ye,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ae(I){let b=n.get(I),V=I.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==I.depthTexture){let j=I.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),j){let ne=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,j.removeEventListener("dispose",ne)};j.addEventListener("dispose",ne),b.__depthDisposeCallback=ne}b.__boundDepthTexture=j}if(I.depthTexture&&!b.__autoAllocateDepthBuffer)if(V)for(let j=0;j<6;j++)ct(b.__webglFramebuffer[j],I,j);else{let j=I.texture.mipmaps;j&&j.length>0?ct(b.__webglFramebuffer[0],I,0):ct(b.__webglFramebuffer,I,0)}else if(V){b.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer[j]),b.__webglDepthbuffer[j]===void 0)b.__webglDepthbuffer[j]=i.createRenderbuffer(),Qe(b.__webglDepthbuffer[j],I,!1);else{let ne=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ye=b.__webglDepthbuffer[j];i.bindRenderbuffer(i.RENDERBUFFER,ye),i.framebufferRenderbuffer(i.FRAMEBUFFER,ne,i.RENDERBUFFER,ye)}}else{let j=I.texture.mipmaps;if(j&&j.length>0?t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=i.createRenderbuffer(),Qe(b.__webglDepthbuffer,I,!1);else{let ne=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ye=b.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ye),i.framebufferRenderbuffer(i.FRAMEBUFFER,ne,i.RENDERBUFFER,ye)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function de(I,b,V){let j=n.get(I);b!==void 0&&Le(j.__webglFramebuffer,I,I.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),V!==void 0&&ae(I)}function _e(I){let b=I.texture,V=n.get(I),j=n.get(b);I.addEventListener("dispose",v);let ne=I.textures,ye=I.isWebGLCubeRenderTarget===!0,Te=ne.length>1;if(Te||(j.__webglTexture===void 0&&(j.__webglTexture=i.createTexture()),j.__version=b.version,a.memory.textures++),ye){V.__webglFramebuffer=[];for(let H=0;H<6;H++)if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer[H]=[];for(let ee=0;ee<b.mipmaps.length;ee++)V.__webglFramebuffer[H][ee]=i.createFramebuffer()}else V.__webglFramebuffer[H]=i.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer=[];for(let H=0;H<b.mipmaps.length;H++)V.__webglFramebuffer[H]=i.createFramebuffer()}else V.__webglFramebuffer=i.createFramebuffer();if(Te)for(let H=0,ee=ne.length;H<ee;H++){let fe=n.get(ne[H]);fe.__webglTexture===void 0&&(fe.__webglTexture=i.createTexture(),a.memory.textures++)}if(I.samples>0&&Be(I)===!1){V.__webglMultisampledFramebuffer=i.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let H=0;H<ne.length;H++){let ee=ne[H];V.__webglColorRenderbuffer[H]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,V.__webglColorRenderbuffer[H]);let fe=r.convert(ee.format,ee.colorSpace),Ie=r.convert(ee.type),Se=y(ee.internalFormat,fe,Ie,ee.normalized,ee.colorSpace,I.isXRRenderTarget===!0),Ee=Pe(I);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ee,Se,I.width,I.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+H,i.RENDERBUFFER,V.__webglColorRenderbuffer[H])}i.bindRenderbuffer(i.RENDERBUFFER,null),I.depthBuffer&&(V.__webglDepthRenderbuffer=i.createRenderbuffer(),Qe(V.__webglDepthRenderbuffer,I,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ye){t.bindTexture(i.TEXTURE_CUBE_MAP,j.__webglTexture),K(i.TEXTURE_CUBE_MAP,b);for(let H=0;H<6;H++)if(b.mipmaps&&b.mipmaps.length>0)for(let ee=0;ee<b.mipmaps.length;ee++)Le(V.__webglFramebuffer[H][ee],I,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+H,ee);else Le(V.__webglFramebuffer[H],I,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+H,0);p(b)&&S(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Te){for(let H=0,ee=ne.length;H<ee;H++){let fe=ne[H],Ie=n.get(fe),Se=i.TEXTURE_2D;(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(Se=I.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Se,Ie.__webglTexture),K(Se,fe),Le(V.__webglFramebuffer,I,fe,i.COLOR_ATTACHMENT0+H,Se,0),p(fe)&&S(Se)}t.unbindTexture()}else{let H=i.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(H=I.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(H,j.__webglTexture),K(H,b),b.mipmaps&&b.mipmaps.length>0)for(let ee=0;ee<b.mipmaps.length;ee++)Le(V.__webglFramebuffer[ee],I,b,i.COLOR_ATTACHMENT0,H,ee);else Le(V.__webglFramebuffer,I,b,i.COLOR_ATTACHMENT0,H,0);p(b)&&S(H),t.unbindTexture()}I.depthBuffer&&ae(I)}function Me(I){let b=I.textures;for(let V=0,j=b.length;V<j;V++){let ne=b[V];if(p(ne)){let ye=C(I),Te=n.get(ne).__webglTexture;t.bindTexture(ye,Te),S(ye),t.unbindTexture()}}}let Ae=[],je=[];function ve(I){if(I.samples>0){if(Be(I)===!1){let b=I.textures,V=I.width,j=I.height,ne=i.COLOR_BUFFER_BIT,ye=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Te=n.get(I),H=b.length>1;if(H)for(let fe=0;fe<b.length;fe++)t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Te.__webglMultisampledFramebuffer);let ee=I.texture.mipmaps;ee&&ee.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Te.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Te.__webglFramebuffer);for(let fe=0;fe<b.length;fe++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(ne|=i.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(ne|=i.STENCIL_BUFFER_BIT)),H){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Te.__webglColorRenderbuffer[fe]);let Ie=n.get(b[fe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ie,0)}i.blitFramebuffer(0,0,V,j,0,0,V,j,ne,i.NEAREST),l===!0&&(Ae.length=0,je.length=0,Ae.push(i.COLOR_ATTACHMENT0+fe),I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&(Ae.push(ye),je.push(ye),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,je)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ae))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),H)for(let fe=0;fe<b.length;fe++){t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,Te.__webglColorRenderbuffer[fe]);let Ie=n.get(b[fe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,Ie,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Te.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&l){let b=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[b])}}}function Pe(I){return Math.min(s.maxSamples,I.samples)}function Be(I){let b=n.get(I);return I.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function k(I){let b=a.render.frame;h.get(I)!==b&&(h.set(I,b),I.update())}function ht(I,b){let V=I.colorSpace,j=I.format,ne=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||V!==xs&&V!==Di&&(ft.getTransfer(V)===St?(j!==wn||ne!==xn)&&nt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):it("WebGLTextures: Unsupported texture color space:",V)),b}function he(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(c.width=I.naturalWidth||I.width,c.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(c.width=I.displayWidth,c.height=I.displayHeight):(c.width=I.width,c.height=I.height),c}this.allocateTextureUnit=G,this.resetTextureUnits=O,this.getTextureUnits=L,this.setTextureUnits=U,this.setTexture2D=re,this.setTexture2DArray=W,this.setTexture3D=Z,this.setTextureCube=ie,this.rebindTextures=de,this.setupRenderTarget=_e,this.updateRenderTargetMipmap=Me,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=ae,this.setupFrameBufferTexture=Le,this.useMultisampledRTT=Be,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Kv(i,e){function t(n,s=Di){let r,a=ft.getTransfer(s);if(n===xn)return i.UNSIGNED_BYTE;if(n===yl)return i.UNSIGNED_SHORT_4_4_4_4;if(n===bl)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Bh)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===zh)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Fh)return i.BYTE;if(n===Oh)return i.SHORT;if(n===Mr)return i.UNSIGNED_SHORT;if(n===vl)return i.INT;if(n===Qn)return i.UNSIGNED_INT;if(n===bn)return i.FLOAT;if(n===Dt)return i.HALF_FLOAT;if(n===Vh)return i.ALPHA;if(n===Hh)return i.RGB;if(n===wn)return i.RGBA;if(n===ci)return i.DEPTH_COMPONENT;if(n===mi)return i.DEPTH_STENCIL;if(n===Ml)return i.RED;if(n===Sl)return i.RED_INTEGER;if(n===ss)return i.RG;if(n===wl)return i.RG_INTEGER;if(n===El)return i.RGBA_INTEGER;if(n===Ua||n===Fa||n===Oa||n===Ba)if(a===St)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ua)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Fa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Oa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ba)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ua)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Fa)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Oa)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ba)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Tl||n===Al||n===Cl||n===Rl)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Tl)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Al)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Cl)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Rl)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Pl||n===Il||n===Dl||n===Ll||n===Nl||n===za||n===kl)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Pl||n===Il)return a===St?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Dl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ll)return r.COMPRESSED_R11_EAC;if(n===Nl)return r.COMPRESSED_SIGNED_R11_EAC;if(n===za)return r.COMPRESSED_RG11_EAC;if(n===kl)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ul||n===Fl||n===Ol||n===Bl||n===zl||n===Vl||n===Hl||n===Gl||n===Wl||n===Xl||n===Yl||n===jl||n===ql||n===$l)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ul)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Fl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ol)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Bl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===zl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Vl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Hl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Gl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Wl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Xl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Yl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===jl)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ql)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===$l)return a===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Zl||n===Kl||n===Jl)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Zl)return a===St?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Kl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Jl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ql||n===ec||n===Va||n===tc)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Ql)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ec)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Va)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===tc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===is?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var Jv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Qv=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,hd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ta(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Ft({vertexShader:Jv,fragmentShader:Qv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new mt(new ji(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},dd=class extends Zn{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,f=null,d=null,m=null,g=null,A=typeof XRWebGLBinding<"u",u=new hd,p={},S=t.getContextAttributes(),C=null,y=null,M=[],E=[],R=new me,v=null,w=null,P=new on;P.viewport=new kt;let D=new on;D.viewport=new kt;let N=[P,D],O=new fl,L=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let se=M[J];return se===void 0&&(se=new dr,M[J]=se),se.getTargetRaySpace()},this.getControllerGrip=function(J){let se=M[J];return se===void 0&&(se=new dr,M[J]=se),se.getGripSpace()},this.getHand=function(J){let se=M[J];return se===void 0&&(se=new dr,M[J]=se),se.getHandSpace()};function G(J){let se=E.indexOf(J.inputSource);if(se===-1)return;let ce=M[se];ce!==void 0&&(ce.update(J.inputSource,J.frame,c||a),ce.dispatchEvent({type:J.type,data:J.inputSource}))}function Y(){s.removeEventListener("select",G),s.removeEventListener("selectstart",G),s.removeEventListener("selectend",G),s.removeEventListener("squeeze",G),s.removeEventListener("squeezestart",G),s.removeEventListener("squeezeend",G),s.removeEventListener("end",Y),s.removeEventListener("inputsourceschange",re);for(let J=0;J<M.length;J++){let se=E[J];se!==null&&(E[J]=null,M[J].disconnect(se))}L=null,U=null,u.reset();for(let J in p)delete p[J];if(e.setRenderTarget(C),m=null,d=null,f=null,s=null,y=null,Je.stop(),n.isPresenting=!1,e.setPixelRatio(v),e.setSize(R.width,R.height,!1),w!==null){let J=w.camera;J.fov=w.fov,J.zoom=w.zoom,J.updateProjectionMatrix(),w=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){r=J,n.isPresenting===!0&&nt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,n.isPresenting===!0&&nt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(J){c=J},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return f===null&&A&&(f=new XRWebGLBinding(s,t)),f},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(C=e.getRenderTarget(),s.addEventListener("select",G),s.addEventListener("selectstart",G),s.addEventListener("selectend",G),s.addEventListener("squeeze",G),s.addEventListener("squeezestart",G),s.addEventListener("squeezeend",G),s.addEventListener("end",Y),s.addEventListener("inputsourceschange",re),S.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(R),A&&"createProjectionLayer"in XRWebGLBinding.prototype){let ce=null,Ye=null,Le=null;S.depth&&(Le=S.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ce=S.stencil?mi:ci,Ye=S.stencil?is:Qn);let Qe={colorFormat:t.RGBA8,depthFormat:Le,scaleFactor:r};f=this.getBinding(),d=f.createProjectionLayer(Qe),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Ut(d.textureWidth,d.textureHeight,{format:wn,type:xn,depthTexture:new pi(d.textureWidth,d.textureHeight,Ye,void 0,void 0,void 0,void 0,void 0,void 0,ce),stencilBuffer:S.stencil,colorSpace:e.outputColorSpace,samples:S.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let ce={antialias:S.antialias,alpha:!0,depth:S.depth,stencil:S.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,ce),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),y=new Ut(m.framebufferWidth,m.framebufferHeight,{format:wn,type:xn,colorSpace:e.outputColorSpace,stencilBuffer:S.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Je.setContext(s),Je.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return u.getDepthTexture()};function re(J){for(let se=0;se<J.removed.length;se++){let ce=J.removed[se],Ye=E.indexOf(ce);Ye>=0&&(E[Ye]=null,M[Ye].disconnect(ce))}for(let se=0;se<J.added.length;se++){let ce=J.added[se],Ye=E.indexOf(ce);if(Ye===-1){for(let Qe=0;Qe<M.length;Qe++)if(Qe>=E.length){E.push(ce),Ye=Qe;break}else if(E[Qe]===null){E[Qe]=ce,Ye=Qe;break}if(Ye===-1)break}let Le=M[Ye];Le&&Le.connect(ce)}}let W=new F,Z=new F;function ie(J,se,ce){W.setFromMatrixPosition(se.matrixWorld),Z.setFromMatrixPosition(ce.matrixWorld);let Ye=W.distanceTo(Z),Le=se.projectionMatrix.elements,Qe=ce.projectionMatrix.elements,ct=Le[14]/(Le[10]-1),ae=Le[14]/(Le[10]+1),de=(Le[9]+1)/Le[5],_e=(Le[9]-1)/Le[5],Me=(Le[8]-1)/Le[0],Ae=(Qe[8]+1)/Qe[0],je=ct*Me,ve=ct*Ae,Pe=Ye/(-Me+Ae),Be=Pe*-Me;if(se.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX(Be),J.translateZ(Pe),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),Le[10]===-1)J.projectionMatrix.copy(se.projectionMatrix),J.projectionMatrixInverse.copy(se.projectionMatrixInverse);else{let k=ct+Pe,ht=ae+Pe,he=je-Be,I=ve+(Ye-Be),b=de*ae/ht*k,V=_e*ae/ht*k;J.projectionMatrix.makePerspective(he,I,b,V,k,ht),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function xe(J,se){se===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(se.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let se=J.near,ce=J.far;u.texture!==null&&(u.depthNear>0&&(se=u.depthNear),u.depthFar>0&&(ce=u.depthFar)),O.near=D.near=P.near=se,O.far=D.far=P.far=ce,(L!==O.near||U!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),L=O.near,U=O.far),O.layers.mask=J.layers.mask|6,P.layers.mask=O.layers.mask&-5,D.layers.mask=O.layers.mask&-3;let Ye=J.parent,Le=O.cameras;xe(O,Ye);for(let Qe=0;Qe<Le.length;Qe++)xe(Le[Qe],Ye);Le.length===2?ie(O,P,D):O.projectionMatrix.copy(P.projectionMatrix),w===null&&J.isPerspectiveCamera&&(w={camera:J,fov:J.fov,zoom:J.zoom}),be(J,O,Ye)};function be(J,se,ce){ce===null?J.matrix.copy(se.matrixWorld):(J.matrix.copy(ce.matrixWorld),J.matrix.invert(),J.matrix.multiply(se.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(se.projectionMatrix),J.projectionMatrixInverse.copy(se.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=lr*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(J){l=J,d!==null&&(d.fixedFoveation=J),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=J)},this.hasDepthSensing=function(){return u.texture!==null},this.getDepthSensingMesh=function(){return u.getMesh(O)},this.getCameraTexture=function(J){return p[J]};let pe=null;function K(J,se){if(h=se.getViewerPose(c||a),g=se,h!==null){let ce=h.views;m!==null&&(e.setRenderTargetFramebuffer(y,m.framebuffer),e.setRenderTarget(y));let Ye=!1;ce.length!==O.cameras.length&&(O.cameras.length=0,Ye=!0);for(let ae=0;ae<ce.length;ae++){let de=ce[ae],_e=null;if(m!==null)_e=m.getViewport(de);else{let Ae=f.getViewSubImage(d,de);_e=Ae.viewport,ae===0&&(e.setRenderTargetTextures(y,Ae.colorTexture,Ae.depthStencilTexture),e.setRenderTarget(y))}let Me=N[ae];Me===void 0&&(Me=new on,Me.layers.enable(ae),Me.viewport=new kt,N[ae]=Me),Me.matrix.fromArray(de.transform.matrix),Me.matrix.decompose(Me.position,Me.quaternion,Me.scale),Me.projectionMatrix.fromArray(de.projectionMatrix),Me.projectionMatrixInverse.copy(Me.projectionMatrix).invert(),Me.viewport.set(_e.x,_e.y,_e.width,_e.height),ae===0&&(O.matrix.copy(Me.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Ye===!0&&O.cameras.push(Me)}let Le=s.enabledFeatures;if(Le&&Le.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&A){f=n.getBinding();let ae=f.getDepthInformation(ce[0]);ae&&ae.isValid&&ae.texture&&u.init(ae,s.renderState)}if(Le&&Le.includes("camera-access")&&A){e.state.unbindTexture(),f=n.getBinding();for(let ae=0;ae<ce.length;ae++){let de=ce[ae].camera;if(de){let _e=p[de];_e||(_e=new ta,p[de]=_e);let Me=f.getCameraImage(de);_e.sourceTexture=Me}}}}for(let ce=0;ce<M.length;ce++){let Ye=E[ce],Le=M[ce];Ye!==null&&Le!==void 0&&Le.update(Ye,se,c||a)}pe&&pe(J,se),se.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:se}),g=null}let Je=new gf;Je.setAnimationLoop(K),this.setAnimationLoop=function(J){pe=J},this.dispose=function(){}}},ey=new Mt,Mf=new ot;Mf.set(-1,0,0,0,1,0,0,0,1);function ty(i,e){function t(u,p){u.matrixAutoUpdate===!0&&u.updateMatrix(),p.value.copy(u.matrix)}function n(u,p){p.color.getRGB(u.fogColor.value,jh(i)),p.isFog?(u.fogNear.value=p.near,u.fogFar.value=p.far):p.isFogExp2&&(u.fogDensity.value=p.density)}function s(u,p,S,C,y){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(u,p):p.isMeshLambertMaterial?(r(u,p),p.envMap&&(u.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(u,p),f(u,p)):p.isMeshPhongMaterial?(r(u,p),h(u,p),p.envMap&&(u.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(u,p),d(u,p),p.isMeshPhysicalMaterial&&m(u,p,y)):p.isMeshMatcapMaterial?(r(u,p),g(u,p)):p.isMeshDepthMaterial?r(u,p):p.isMeshDistanceMaterial?(r(u,p),A(u,p)):p.isMeshNormalMaterial?r(u,p):p.isLineBasicMaterial?(a(u,p),p.isLineDashedMaterial&&o(u,p)):p.isPointsMaterial?l(u,p,S,C):p.isSpriteMaterial?c(u,p):p.isShadowMaterial?(u.color.value.copy(p.color),u.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(u,p){u.opacity.value=p.opacity,p.color&&u.diffuse.value.copy(p.color),p.emissive&&u.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(u.map.value=p.map,t(p.map,u.mapTransform)),p.alphaMap&&(u.alphaMap.value=p.alphaMap,t(p.alphaMap,u.alphaMapTransform)),p.bumpMap&&(u.bumpMap.value=p.bumpMap,t(p.bumpMap,u.bumpMapTransform),u.bumpScale.value=p.bumpScale,p.side===Zt&&(u.bumpScale.value*=-1)),p.normalMap&&(u.normalMap.value=p.normalMap,t(p.normalMap,u.normalMapTransform),u.normalScale.value.copy(p.normalScale),p.side===Zt&&u.normalScale.value.negate()),p.displacementMap&&(u.displacementMap.value=p.displacementMap,t(p.displacementMap,u.displacementMapTransform),u.displacementScale.value=p.displacementScale,u.displacementBias.value=p.displacementBias),p.emissiveMap&&(u.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,u.emissiveMapTransform)),p.specularMap&&(u.specularMap.value=p.specularMap,t(p.specularMap,u.specularMapTransform)),p.alphaTest>0&&(u.alphaTest.value=p.alphaTest);let S=e.get(p),C=S.envMap,y=S.envMapRotation;C&&(u.envMap.value=C,u.envMapRotation.value.setFromMatrix4(ey.makeRotationFromEuler(y)).transpose(),C.isCubeTexture&&C.isRenderTargetTexture===!1&&u.envMapRotation.value.premultiply(Mf),u.reflectivity.value=p.reflectivity,u.ior.value=p.ior,u.refractionRatio.value=p.refractionRatio),p.lightMap&&(u.lightMap.value=p.lightMap,u.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,u.lightMapTransform)),p.aoMap&&(u.aoMap.value=p.aoMap,u.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,u.aoMapTransform))}function a(u,p){u.diffuse.value.copy(p.color),u.opacity.value=p.opacity,p.map&&(u.map.value=p.map,t(p.map,u.mapTransform))}function o(u,p){u.dashSize.value=p.dashSize,u.totalSize.value=p.dashSize+p.gapSize,u.scale.value=p.scale}function l(u,p,S,C){u.diffuse.value.copy(p.color),u.opacity.value=p.opacity,u.size.value=p.size*S,u.scale.value=C*.5,p.map&&(u.map.value=p.map,t(p.map,u.uvTransform)),p.alphaMap&&(u.alphaMap.value=p.alphaMap,t(p.alphaMap,u.alphaMapTransform)),p.alphaTest>0&&(u.alphaTest.value=p.alphaTest)}function c(u,p){u.diffuse.value.copy(p.color),u.opacity.value=p.opacity,u.rotation.value=p.rotation,p.map&&(u.map.value=p.map,t(p.map,u.mapTransform)),p.alphaMap&&(u.alphaMap.value=p.alphaMap,t(p.alphaMap,u.alphaMapTransform)),p.alphaTest>0&&(u.alphaTest.value=p.alphaTest)}function h(u,p){u.specular.value.copy(p.specular),u.shininess.value=Math.max(p.shininess,1e-4)}function f(u,p){p.gradientMap&&(u.gradientMap.value=p.gradientMap)}function d(u,p){u.metalness.value=p.metalness,p.metalnessMap&&(u.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,u.metalnessMapTransform)),u.roughness.value=p.roughness,p.roughnessMap&&(u.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,u.roughnessMapTransform)),p.envMap&&(u.envMapIntensity.value=p.envMapIntensity)}function m(u,p,S){u.ior.value=p.ior,p.sheen>0&&(u.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),u.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(u.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,u.sheenColorMapTransform)),p.sheenRoughnessMap&&(u.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,u.sheenRoughnessMapTransform))),p.clearcoat>0&&(u.clearcoat.value=p.clearcoat,u.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(u.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,u.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(u.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,u.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(u.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,u.clearcoatNormalMapTransform),u.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Zt&&u.clearcoatNormalScale.value.negate())),p.dispersion>0&&(u.dispersion.value=p.dispersion),p.retroreflectivity>0&&(u.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(u.iridescence.value=p.iridescence,u.iridescenceIOR.value=p.iridescenceIOR,u.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],u.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(u.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,u.iridescenceMapTransform)),p.iridescenceThicknessMap&&(u.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,u.iridescenceThicknessMapTransform))),p.transmission>0&&(u.transmission.value=p.transmission,u.transmissionSamplerMap.value=S.texture,u.transmissionSamplerSize.value.set(S.width,S.height),p.transmissionMap&&(u.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,u.transmissionMapTransform)),u.thickness.value=p.thickness,p.thicknessMap&&(u.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,u.thicknessMapTransform)),u.attenuationDistance.value=p.attenuationDistance,u.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(u.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(u.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,u.anisotropyMapTransform))),u.specularIntensity.value=p.specularIntensity,u.specularColor.value.copy(p.specularColor),p.specularColorMap&&(u.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,u.specularColorMapTransform)),p.specularIntensityMap&&(u.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,u.specularIntensityMapTransform))}function g(u,p){p.matcap&&(u.matcap.value=p.matcap)}function A(u,p){let S=e.get(p).light;u.referencePosition.value.setFromMatrixPosition(S.matrixWorld),u.nearDistance.value=S.shadow.camera.near,u.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function ny(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,M){let E=M.program;n.uniformBlockBinding(y,E)}function c(y,M){let E=s[y.id];E===void 0&&(u(y),E=h(y),s[y.id]=E,y.addEventListener("dispose",S));let R=M.program;n.updateUBOMapping(y,R);let v=e.render.frame;r[y.id]!==v&&(d(y),r[y.id]=v)}function h(y){let M=f();y.__bindingPointIndex=M;let E=i.createBuffer(),R=y.__size,v=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,R,v),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,E),E}function f(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return it("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){let M=s[y.id],E=y.uniforms,R=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let v=0,w=E.length;v<w;v++){let P=E[v];if(Array.isArray(P))for(let D=0,N=P.length;D<N;D++)m(P[D],v,D,R);else m(P,v,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(y,M,E,R){if(A(y,M,E,R)===!0){let v=y.__offset,w=y.value;if(Array.isArray(w)){let P=0;for(let D=0;D<w.length;D++){let N=w[D],O=p(N);g(N,y.__data,P),typeof N!="number"&&typeof N!="boolean"&&!N.isMatrix3&&!ArrayBuffer.isView(N)&&(P+=O.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(w,y.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,v,y.__data)}}function g(y,M,E){typeof y=="number"||typeof y=="boolean"?M[0]=y:y.isMatrix3?(M[0]=y.elements[0],M[1]=y.elements[1],M[2]=y.elements[2],M[3]=0,M[4]=y.elements[3],M[5]=y.elements[4],M[6]=y.elements[5],M[7]=0,M[8]=y.elements[6],M[9]=y.elements[7],M[10]=y.elements[8],M[11]=0):ArrayBuffer.isView(y)?M.set(new y.constructor(y.buffer,y.byteOffset,M.length)):y.toArray(M,E)}function A(y,M,E,R){let v=y.value,w=M+"_"+E;if(R[w]===void 0)return typeof v=="number"||typeof v=="boolean"?R[w]=v:ArrayBuffer.isView(v)?R[w]=v.slice():R[w]=v.clone(),!0;{let P=R[w];if(typeof v=="number"||typeof v=="boolean"){if(P!==v)return R[w]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(P.equals(v)===!1)return P.copy(v),!0}}return!1}function u(y){let M=y.uniforms,E=0,R=16;for(let w=0,P=M.length;w<P;w++){let D=Array.isArray(M[w])?M[w]:[M[w]];for(let N=0,O=D.length;N<O;N++){let L=D[N],U=Array.isArray(L.value)?L.value:[L.value];for(let G=0,Y=U.length;G<Y;G++){let re=U[G],W=p(re),Z=E%R,ie=Z%W.boundary,xe=Z+ie;E+=ie,xe!==0&&R-xe<W.storage&&(E+=R-xe),L.__data=new Float32Array(W.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=E,E+=W.storage}}}let v=E%R;return v>0&&(E+=R-v),y.__size=E,y.__cache={},this}function p(y){let M={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(M.boundary=4,M.storage=4):y.isVector2?(M.boundary=8,M.storage=8):y.isVector3||y.isColor?(M.boundary=16,M.storage=12):y.isVector4?(M.boundary=16,M.storage=16):y.isMatrix3?(M.boundary=48,M.storage=48):y.isMatrix4?(M.boundary=64,M.storage=64):y.isTexture?nt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(M.boundary=16,M.storage=y.byteLength):nt("WebGLRenderer: Unsupported uniform value type.",y),M}function S(y){let M=y.target;M.removeEventListener("dispose",S);let E=a.indexOf(M.__bindingPointIndex);a.splice(E,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function C(){for(let y in s)i.deleteBuffer(s[y]);a=[],s={},r={}}return{bind:l,update:c,dispose:C}}var iy=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),gi=null;function sy(){return gi===null&&(gi=new Kn(iy,16,16,ss,Dt),gi.name="DFG_LUT",gi.minFilter=zt,gi.magFilter=zt,gi.wrapS=Bn,gi.wrapT=Bn,gi.generateMipmaps=!1,gi.needsUpdate=!0),gi}var oc=class{constructor(e={}){let{canvas:t=Fp(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:d=!1,outputBufferType:m=xn}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;let A=m,u=new Set([El,wl,Sl]),p=new Set([xn,Qn,Mr,is,yl,bl]),S=new Uint32Array(4),C=new Int32Array(4),y=new F,M=null,E=null,R=[],v=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Jn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,D=!1,N=null,O=null,L=null,U=null;this._outputColorSpace=sn;let G=0,Y=0,re=null,W=-1,Z=null,ie=new kt,xe=new kt,be=null,pe=new st(0),K=0,Je=t.width,J=t.height,se=1,ce=null,Ye=null,Le=new kt(0,0,Je,J),Qe=new kt(0,0,Je,J),ct=!1,ae=new ur,de=!1,_e=!1,Me=new Mt,Ae=new F,je=new kt,ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Pe=!1;function Be(){return re===null?se:1}let k=n;function ht(T,B){return t.getContext(T,B)}let he,I,b,V,j,ne,ye,Te,H,ee,fe,Ie,Se,Ee,Ve,$e,et,z,Re,le,De,ke,ge;try{let T={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",gt,!1),t.addEventListener("webglcontextrestored",vt,!1),t.addEventListener("webglcontextcreationerror",cn,!1),k===null){let B="webgl2";if(k=ht(B,T),k===null)throw ht(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ke()}catch(T){throw t.removeEventListener("webglcontextlost",gt,!1),t.removeEventListener("webglcontextrestored",vt,!1),t.removeEventListener("webglcontextcreationerror",cn,!1),it("WebGLRenderer: "+T.message),T}function Ke(){he=new d_(k),he.init(),De=new Kv(k,he),I=new t_(k,he,e,De),b=new $v(k,he),I.reversedDepthBuffer&&d&&b.buffers.depth.setReversed(!0),O=k.createFramebuffer(),L=k.createFramebuffer(),U=k.createFramebuffer(),V=new f_(k),j=new kv,ne=new Zv(k,he,b,j,I,De,V),ye=new h_(P),Te=new gg(k),ke=new Qx(k,Te),H=new u_(k,Te,V,ke),ee=new g_(k,H,Te,ke,V),z=new m_(k,I,ne),Ve=new n_(j),fe=new Nv(P,ye,he,I,ke,Ve),Ie=new ty(P,j),Se=new Fv,Ee=new Gv(he),et=new Jx(P,ye,b,ee,g,l),$e=new qv(P,ee,I),ge=new ny(k,V,I,b),Re=new e_(k,he,V),le=new p_(k,he,V),V.programs=fe.programs,P.capabilities=I,P.extensions=he,P.properties=j,P.renderLists=Se,P.shadowMap=$e,P.state=b,P.info=V}A!==xn&&(w=new __(A,t.width,t.height,o,s,r));let we=new dd(P,k);this.xr=we,this.getContext=function(){return k},this.getContextAttributes=function(){return k.getContextAttributes()},this.forceContextLoss=function(){let T=he.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){let T=he.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return se},this.setPixelRatio=function(T){T!==void 0&&(se=T,this.setSize(Je,J,!1))},this.getSize=function(T){return T.set(Je,J)},this.setSize=function(T,B,te=!0){if(we.isPresenting){nt("WebGLRenderer: Can't change size while VR device is presenting.");return}Je=T,J=B,t.width=Math.floor(T*se),t.height=Math.floor(B*se),te===!0&&(t.style.width=T+"px",t.style.height=B+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,T,B)},this.getDrawingBufferSize=function(T){return T.set(Je*se,J*se).floor()},this.setDrawingBufferSize=function(T,B,te){Je=T,J=B,se=te,t.width=Math.floor(T*te),t.height=Math.floor(B*te),this.setViewport(0,0,T,B)},this.setEffects=function(T){if(A===xn){it("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(T){for(let B=0;B<T.length;B++)if(T[B].isOutputPass===!0){nt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(T||[])},this.getCurrentViewport=function(T){return T.copy(ie)},this.getViewport=function(T){return T.copy(Le)},this.setViewport=function(T,B,te,$){T.isVector4?Le.set(T.x,T.y,T.z,T.w):Le.set(T,B,te,$),b.viewport(ie.copy(Le).multiplyScalar(se).round())},this.getScissor=function(T){return T.copy(Qe)},this.setScissor=function(T,B,te,$){T.isVector4?Qe.set(T.x,T.y,T.z,T.w):Qe.set(T,B,te,$),b.scissor(xe.copy(Qe).multiplyScalar(se).round())},this.getScissorTest=function(){return ct},this.setScissorTest=function(T){b.setScissorTest(ct=T)},this.setOpaqueSort=function(T){ce=T},this.setTransparentSort=function(T){Ye=T},this.getClearColor=function(T){return T.copy(et.getClearColor())},this.setClearColor=function(){et.setClearColor(...arguments)},this.getClearAlpha=function(){return et.getClearAlpha()},this.setClearAlpha=function(){et.setClearAlpha(...arguments)},this.clear=function(T=!0,B=!0,te=!0){let $=0;if(T){let q=!1;if(re!==null){let Ue=re.texture.format;q=u.has(Ue)}if(q){let Ue=re.texture.type,He=p.has(Ue),Ne=et.getClearColor(),Xe=et.getClearAlpha(),We=Ne.r,dt=Ne.g,at=Ne.b;He?(S[0]=We,S[1]=dt,S[2]=at,S[3]=Xe,k.clearBufferuiv(k.COLOR,0,S)):(C[0]=We,C[1]=dt,C[2]=at,C[3]=Xe,k.clearBufferiv(k.COLOR,0,C))}else $|=k.COLOR_BUFFER_BIT}B&&($|=k.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),te&&($|=k.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),$!==0&&k.clear($)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(T){T.setRenderer(this),N=T},this.dispose=function(){t.removeEventListener("webglcontextlost",gt,!1),t.removeEventListener("webglcontextrestored",vt,!1),t.removeEventListener("webglcontextcreationerror",cn,!1),et.dispose(),Se.dispose(),Ee.dispose(),j.dispose(),ye.dispose(),ee.dispose(),ke.dispose(),ge.dispose(),fe.dispose(),we.dispose(),we.removeEventListener("sessionstart",Ir),we.removeEventListener("sessionend",yi),ti.stop()};function gt(T){T.preventDefault(),Wh("WebGLRenderer: Context Lost."),D=!0}function vt(){Wh("WebGLRenderer: Context Restored."),D=!1;let T=V.autoReset,B=$e.enabled,te=$e.autoUpdate,$=$e.needsUpdate,q=$e.type;Ke(),V.autoReset=T,$e.enabled=B,$e.autoUpdate=te,$e.needsUpdate=$,$e.type=q}function cn(T){it("WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function hn(T){let B=T.target;B.removeEventListener("dispose",hn),Pr(B)}function Pr(T){Ka(T),j.remove(T)}function Ka(T){let B=j.get(T).programs;B!==void 0&&(B.forEach(function(te){fe.releaseProgram(te)}),T.isShaderMaterial&&fe.releaseShaderCache(T))}this.renderBufferDirect=function(T,B,te,$,q,Ue){B===null&&(B=ve);let He=q.isMesh&&q.matrixWorld.determinantAffine()<0,Ne=eo(T,B,te,$,q);b.setMaterial($,He);let Xe=te.index,We=1;if($.wireframe===!0){if(Xe=H.getWireframeAttribute(te),Xe===void 0)return;We=2}let dt=te.drawRange,at=te.attributes.position,Ge=dt.start*We,yt=(dt.start+dt.count)*We;Ue!==null&&(Ge=Math.max(Ge,Ue.start*We),yt=Math.min(yt,(Ue.start+Ue.count)*We)),Xe!==null?(Ge=Math.max(Ge,0),yt=Math.min(yt,Xe.count)):at!=null&&(Ge=Math.max(Ge,0),yt=Math.min(yt,at.count));let Ot=yt-Ge;if(Ot<0||Ot===1/0)return;ke.setup(q,$,Ne,te,Xe);let Rt,At=Re;if(Xe!==null&&(Rt=Te.get(Xe),At=le,At.setIndex(Rt)),q.isMesh)$.wireframe===!0?(b.setLineWidth($.wireframeLinewidth*Be()),At.setMode(k.LINES)):At.setMode(k.TRIANGLES);else if(q.isLine){let qt=$.linewidth;qt===void 0&&(qt=1),b.setLineWidth(qt*Be()),q.isLineSegments?At.setMode(k.LINES):q.isLineLoop?At.setMode(k.LINE_LOOP):At.setMode(k.LINE_STRIP)}else q.isPoints?At.setMode(k.POINTS):q.isSprite&&At.setMode(k.TRIANGLES);if(q.isBatchedMesh)if(he.get("WEBGL_multi_draw"))At.renderMultiDraw(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount);else{let qt=q._multiDrawStarts,ze=q._multiDrawCounts,Wt=q._multiDrawCount,xt=Xe?Te.get(Xe).bytesPerElement:1,Sn=j.get($).currentProgram.getUniforms();for(let Un=0;Un<Wt;Un++)Sn.setValue(k,"_gl_DrawID",Un),At.render(qt[Un]/xt,ze[Un])}else if(q.isInstancedMesh)At.renderInstances(Ge,Ot,q.count);else if(te.isInstancedBufferGeometry){let qt=te._maxInstanceCount!==void 0?te._maxInstanceCount:1/0,ze=Math.min(te.instanceCount,qt);At.renderInstances(Ge,Ot,ze)}else At.render(Ge,Ot)};function Ds(T,B,te,$){N!==null&&T.isNodeMaterial&&N.setObject($,T),de===!0&&Ve.setState(T,te,!1),T.transparent===!0&&T.side===Nn&&T.forceSinglePass===!1?(T.side=Zt,T.needsUpdate=!0,Li(T,B,$),T.side=fi,T.needsUpdate=!0,Li(T,B,$),T.side=Nn):Li(T,B,$)}this.compile=function(T,B,te=null){te===null&&(te=T),N!==null&&N.renderStart(T,B,te),E=Ee.get(te),E.init(B),v.push(E),te.traverseVisible(function(q){q.isLight&&q.layers.test(B.layers)&&(E.pushLight(q),q.castShadow&&E.pushShadow(q))}),T!==te&&T.traverseVisible(function(q){q.isLight&&q.layers.test(B.layers)&&(E.pushLight(q),q.castShadow&&E.pushShadow(q))}),E.setupLights(),N!==null&&N.updateLights(E.state.lightsArray),_e=this.localClippingEnabled,de=Ve.init(this.clippingPlanes,_e),de===!0&&Ve.setGlobalState(this.clippingPlanes,B),N!==null&&$e.render(E.state.shadowsArray,te,B);let $=new Set;return T.traverse(function(q){if(!(q.isMesh||q.isPoints||q.isLine||q.isSprite))return;let Ue=q.material;if(Ue)if(Array.isArray(Ue))for(let He=0;He<Ue.length;He++){let Ne=Ue[He];Ds(Ne,te,B,q),$.add(Ne)}else Ds(Ue,te,B,q),$.add(Ue)}),E=v.pop(),N!==null&&N.renderEnd(),$},this.compileAsync=function(T,B,te=null){let $=this.compile(T,B,te);return new Promise(q=>{function Ue(){if($.forEach(function(He){let Xe=j.get(He).currentProgram;(Xe===void 0||Xe.isReady())&&$.delete(He)}),$.size===0){q(T);return}setTimeout(Ue,10)}he.get("KHR_parallel_shader_compile")!==null?Ue():setTimeout(Ue,10)})};let Ls=null;function Ja(T){Ls&&Ls(T)}function Ir(){ti.stop()}function yi(){ti.start()}let ti=new gf;ti.setAnimationLoop(Ja),typeof self<"u"&&ti.setContext(self),this.setAnimationLoop=function(T){Ls=T,we.setAnimationLoop(T),T===null?ti.stop():ti.start()},we.addEventListener("sessionstart",Ir),we.addEventListener("sessionend",yi),this.render=function(T,B){if(B!==void 0&&B.isCamera!==!0){it("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;N!==null&&N.renderStart(T,B);let te=we.enabled===!0&&we.isPresenting===!0,$=w!==null&&(re===null||te)&&w.begin(P,re);if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),we.enabled===!0&&we.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(we.cameraAutoUpdate===!0&&we.updateCamera(B),B=we.getCamera()),T.isScene===!0&&T.onBeforeRender(P,T,B,re),E=Ee.get(T,v.length),E.init(B),E.state.textureUnits=ne.getTextureUnits(),v.push(E),Me.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),ae.setFromProjectionMatrix(Me,qn,B.reversedDepth),_e=this.localClippingEnabled,de=Ve.init(this.clippingPlanes,_e),M=Se.get(T,R.length),M.init(),R.push(M),we.enabled===!0&&we.isPresenting===!0){let He=P.xr.getDepthSensingMesh();He!==null&&rs(He,B,-1/0,P.sortObjects)}rs(T,B,0,P.sortObjects),M.finish(),N!==null&&N.updateLights(E.state.lightsArray),P.sortObjects===!0&&M.sort(ce,Ye),Pe=we.enabled===!1||we.isPresenting===!1||we.hasDepthSensing()===!1,Pe&&et.addToRenderList(M,T),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),de===!0&&Ve.beginShadows();let q=E.state.shadowsArray;if($e.render(q,T,B),de===!0&&Ve.endShadows(),($&&w.hasRenderPass())===!1){let He=M.opaque,Ne=M.transmissive;if(E.setupLights(),B.isArrayCamera){let Xe=B.cameras;if(Ne.length>0)for(let We=0,dt=Xe.length;We<dt;We++){let at=Xe[We];Ns(He,Ne,T,at)}Pe&&et.render(T);for(let We=0,dt=Xe.length;We<dt;We++){let at=Xe[We];as(M,T,at,at.viewport)}}else Ne.length>0&&Ns(He,Ne,T,B),Pe&&et.render(T),as(M,T,B)}re!==null&&Y===0&&(ne.updateMultisampleRenderTarget(re),ne.updateRenderTargetMipmap(re)),$&&w.end(P),T.isScene===!0&&T.onAfterRender(P,T,B),ke.resetDefaultState(),W=-1,Z=null,v.pop(),v.length>0?(E=v[v.length-1],ne.setTextureUnits(E.state.textureUnits),de===!0&&Ve.setGlobalState(P.clippingPlanes,E.state.camera)):E=null,R.pop(),R.length>0?M=R[R.length-1]:M=null,N!==null&&N.renderEnd()};function rs(T,B,te,$){if(T.visible===!1)return;if(T.layers.test(B.layers)){if(T.isGroup)te=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(B);else if(T.isLightProbeGrid)E.pushLightProbeGrid(T);else if(T.isLight)E.pushLight(T),T.castShadow&&E.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||T.intersectsFrustum(ae)){$&&je.setFromMatrixPosition(T.matrixWorld).applyMatrix4(Me);let He=ee.update(T),Ne=T.material;Ne.visible&&M.push(T,He,Ne,te,je.z,null,B)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||T.intersectsFrustum(ae))){let He=ee.update(T),Ne=T.material;if($&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),je.copy(T.boundingSphere.center)):(He.boundingSphere===null&&He.computeBoundingSphere(),je.copy(He.boundingSphere.center)),je.applyMatrix4(T.matrixWorld).applyMatrix4(Me)),Array.isArray(Ne)){let Xe=He.groups;for(let We=0,dt=Xe.length;We<dt;We++){let at=Xe[We],Ge=Ne[at.materialIndex];Ge&&Ge.visible&&M.push(T,He,Ge,te,je.z,at,B)}}else Ne.visible&&M.push(T,He,Ne,te,je.z,null,B)}}let Ue=T.children;for(let He=0,Ne=Ue.length;He<Ne;He++)rs(Ue[He],B,te,$)}function as(T,B,te,$){let{opaque:q,transmissive:Ue,transparent:He}=T;E.setupLightsView(te),de===!0&&Ve.setGlobalState(P.clippingPlanes,te),$&&b.viewport(ie.copy($)),q.length>0&&ni(q,B,te),Ue.length>0&&ni(Ue,B,te),He.length>0&&ni(He,B,te),b.buffers.depth.setTest(!0),b.buffers.depth.setMask(!0),b.buffers.color.setMask(!0),b.setPolygonOffset(!1)}function Ns(T,B,te,$){if((te.isScene===!0?te.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[$.id]===void 0){let Ge=he.has("EXT_color_buffer_half_float")||he.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[$.id]=new Ut(1,1,{generateMipmaps:!0,type:Ge?Dt:xn,minFilter:Ii,samples:Math.max(4,I.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ft.workingColorSpace})}let Ue=E.state.transmissionRenderTarget[$.id],He=$.viewport||ie;Ue.setSize(He.z*P.transmissionResolutionScale,He.w*P.transmissionResolutionScale);let Ne=P.getRenderTarget(),Xe=P.getActiveCubeFace(),We=P.getActiveMipmapLevel();P.setRenderTarget(Ue),P.getClearColor(pe),K=P.getClearAlpha(),K<1&&P.setClearColor(16777215,.5),P.clear(),Pe&&et.render(te);let dt=P.toneMapping;P.toneMapping=Jn;let at=$.viewport;if($.viewport!==void 0&&($.viewport=void 0),E.setupLightsView($),de===!0&&Ve.setGlobalState(P.clippingPlanes,$),ni(T,te,$),ne.updateMultisampleRenderTarget(Ue),ne.updateRenderTargetMipmap(Ue),he.has("WEBGL_multisampled_render_to_texture")===!1){let Ge=!1;for(let yt=0,Ot=B.length;yt<Ot;yt++){let Rt=B[yt],{object:At,geometry:qt,material:ze,group:Wt}=Rt;if(ze.side===Nn&&At.layers.test($.layers)){let xt=ze.side;ze.side=Zt,ze.needsUpdate=!0,os(At,te,$,qt,ze,Wt),ze.side=xt,ze.needsUpdate=!0,Ge=!0}}Ge===!0&&(ne.updateMultisampleRenderTarget(Ue),ne.updateRenderTargetMipmap(Ue))}P.setRenderTarget(Ne,Xe,We),P.setClearColor(pe,K),at!==void 0&&($.viewport=at),P.toneMapping=dt}function ni(T,B,te){let $=B.isScene===!0?B.overrideMaterial:null;for(let q=0,Ue=T.length;q<Ue;q++){let He=T[q],{object:Ne,geometry:Xe,group:We}=He,dt=He.material;dt.allowOverride===!0&&$!==null&&(dt=$),Ne.layers.test(te.layers)&&os(Ne,B,te,Xe,dt,We)}}function os(T,B,te,$,q,Ue){N!==null&&q.isNodeMaterial&&N.setObject(T,q),T.onBeforeRender(P,B,te,$,q,Ue),T.modelViewMatrix.multiplyMatrices(te.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),q.onBeforeRender(P,B,te,$,T,Ue),q.transparent===!0&&q.side===Nn&&q.forceSinglePass===!1?(q.side=Zt,q.needsUpdate=!0,P.renderBufferDirect(te,B,$,q,T,Ue),q.side=fi,q.needsUpdate=!0,P.renderBufferDirect(te,B,$,q,T,Ue),q.side=Nn):P.renderBufferDirect(te,B,$,q,T,Ue),T.onAfterRender(P,B,te,$,q,Ue)}function Li(T,B,te){B.isScene!==!0&&(B=ve);let $=j.get(T),q=E.state.lights,Ue=E.state.shadowsArray,He=q.state.version,Ne=fe.getParameters(T,q.state,Ue,B,te,E.state.lightProbeGridArray),Xe=fe.getProgramCacheKey(Ne),We=$.programs;$.environment=T.isMeshStandardMaterial||T.isMeshLambertMaterial||T.isMeshPhongMaterial?B.environment:null,$.fog=B.fog;let dt=T.isMeshStandardMaterial||T.isMeshLambertMaterial&&!T.envMap||T.isMeshPhongMaterial&&!T.envMap;$.envMap=ye.get(T.envMap||$.environment,dt),$.envMapRotation=$.environment!==null&&T.envMap===null?B.environmentRotation:T.envMapRotation,We===void 0&&(T.addEventListener("dispose",hn),We=new Map,$.programs=We);let at=We.get(Xe);if(at!==void 0){if($.currentProgram===at&&$.lightsStateVersion===He)return Ce(T,Ne),at}else Ne.uniforms=fe.getUniforms(T),N!==null&&T.isNodeMaterial&&N.build(T,te,Ne),T.onBeforeCompile(Ne,P),at=fe.acquireProgram(Ne,Xe),We.set(Xe,at),$.uniforms=Ne.uniforms;let Ge=$.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Ge.clippingPlanes=Ve.uniform),Ce(T,Ne),$.needsLights=Ni(T),$.lightsStateVersion=He,$.needsLights&&(Ge.ambientLightColor.value=q.state.ambient,Ge.lightProbe.value=q.state.probe,Ge.sunLights.value=q.state.sun,Ge.sunLightShadows.value=q.state.sunShadow,Ge.directionalLights.value=q.state.directional,Ge.directionalLightShadows.value=q.state.directionalShadow,Ge.spotLights.value=q.state.spot,Ge.spotLightShadows.value=q.state.spotShadow,Ge.rectAreaLights.value=q.state.rectArea,Ge.ltc_1.value=q.state.rectAreaLTC1,Ge.ltc_2.value=q.state.rectAreaLTC2,Ge.pointLights.value=q.state.point,Ge.pointLightShadows.value=q.state.pointShadow,Ge.hemisphereLights.value=q.state.hemi,Ge.sunShadowMatrix.value=q.state.sunShadowMatrix,Ge.sunShadowCascade.value=q.state.sunShadowCascade,Ge.directionalShadowMatrix.value=q.state.directionalShadowMatrix,Ge.spotLightMatrix.value=q.state.spotLightMatrix,Ge.spotLightMap.value=q.state.spotLightMap,Ge.pointShadowMatrix.value=q.state.pointShadowMatrix),$.lightProbeGrid=E.state.lightProbeGridArray.length>0,$.currentProgram=at,$.uniformsList=null,at}function Qa(T){if(T.uniformsList===null){let B=T.currentProgram.getUniforms();T.uniformsList=Tr.seqWithValue(B.seq,T.uniforms)}return T.uniformsList}function Ce(T,B){let te=j.get(T);te.outputColorSpace=B.outputColorSpace,te.batching=B.batching,te.batchingColor=B.batchingColor,te.instancing=B.instancing,te.instancingColor=B.instancingColor,te.instancingMorph=B.instancingMorph,te.skinning=B.skinning,te.morphTargets=B.morphTargets,te.morphNormals=B.morphNormals,te.morphColors=B.morphColors,te.morphTargetsCount=B.morphTargetsCount,te.numClippingPlanes=B.numClippingPlanes,te.numIntersection=B.numClipIntersection,te.vertexAlphas=B.vertexAlphas,te.vertexTangents=B.vertexTangents,te.toneMapping=B.toneMapping}function tt(T,B){if(T.length===0)return null;if(T.length===1)return T[0].texture!==null?T[0]:null;y.setFromMatrixPosition(B.matrixWorld);for(let te=0,$=T.length;te<$;te++){let q=T[te];if(q.texture!==null&&q.boundingBox.containsPoint(y))return q}return null}function eo(T,B,te,$,q){B.isScene!==!0&&(B=ve),ne.resetTextureUnits();let Ue=B.fog,He=$.isMeshStandardMaterial||$.isMeshLambertMaterial||$.isMeshPhongMaterial?B.environment:null,Ne=re===null?P.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:ft.workingColorSpace,Xe=$.isMeshStandardMaterial||$.isMeshLambertMaterial&&!$.envMap||$.isMeshPhongMaterial&&!$.envMap,We=ye.get($.envMap||He,Xe),dt=$.vertexColors===!0&&!!te.attributes.color&&te.attributes.color.itemSize===4,at=!!te.attributes.tangent&&(!!$.normalMap||$.anisotropy>0),Ge=!!te.morphAttributes.position,yt=!!te.morphAttributes.normal,Ot=!!te.morphAttributes.color,Rt=Jn;$.toneMapped&&(re===null||re.isXRRenderTarget===!0)&&(Rt=P.toneMapping);let At=te.morphAttributes.position||te.morphAttributes.normal||te.morphAttributes.color,qt=At!==void 0?At.length:0,ze=j.get($),Wt=E.state.lights;if(de===!0&&(_e===!0||T!==Z)){let _t=T===Z&&$.id===W;Ve.setState($,T,_t)}let xt=!1;$.version===ze.__version?(ze.needsLights&&ze.lightsStateVersion!==Wt.state.version||ze.outputColorSpace!==Ne||q.isBatchedMesh&&ze.batching===!1||!q.isBatchedMesh&&ze.batching===!0||q.isBatchedMesh&&ze.batchingColor===!0&&q._colorsTexture===null||q.isBatchedMesh&&ze.batchingColor===!1&&q._colorsTexture!==null||q.isInstancedMesh&&ze.instancing===!1||!q.isInstancedMesh&&ze.instancing===!0||q.isSkinnedMesh&&ze.skinning===!1||!q.isSkinnedMesh&&ze.skinning===!0||q.isInstancedMesh&&ze.instancingColor===!0&&q.instanceColor===null||q.isInstancedMesh&&ze.instancingColor===!1&&q.instanceColor!==null||q.isInstancedMesh&&ze.instancingMorph===!0&&q.morphTexture===null||q.isInstancedMesh&&ze.instancingMorph===!1&&q.morphTexture!==null||ze.envMap!==We||$.fog===!0&&ze.fog!==Ue||ze.numClippingPlanes!==void 0&&(ze.numClippingPlanes!==Ve.numPlanes||ze.numIntersection!==Ve.numIntersection)||ze.vertexAlphas!==dt||ze.vertexTangents!==at||ze.morphTargets!==Ge||ze.morphNormals!==yt||ze.morphColors!==Ot||ze.toneMapping!==Rt||ze.morphTargetsCount!==qt||!!ze.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(xt=!0):(xt=!0,ze.__version=$.version);let Sn=ze.currentProgram;xt===!0&&(Sn=Li($,B,q),N&&$.isNodeMaterial&&N.onUpdateProgram($,Sn,ze));let Un=!1,ii=!1,ki=!1,Et=Sn.getUniforms(),Pt=ze.uniforms;if(b.useProgram(Sn.program)&&(Un=!0,ii=!0,ki=!0),$.id!==W&&(W=$.id,ii=!0),ze.needsLights){let _t=tt(E.state.lightProbeGridArray,q);ze.lightProbeGrid!==_t&&(ze.lightProbeGrid=_t,ii=!0)}if(Un||Z!==T){b.buffers.depth.getReversed()&&T.reversedDepth!==!0&&(T._reversedDepth=!0,T.updateProjectionMatrix()),Et.setValue(k,"projectionMatrix",T.projectionMatrix),Et.setValue(k,"viewMatrix",T.matrixWorldInverse);let si=Et.map.cameraPosition;si!==void 0&&si.setValue(k,Ae.setFromMatrixPosition(T.matrixWorld)),I.logarithmicDepthBuffer&&Et.setValue(k,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),($.isMeshPhongMaterial||$.isMeshToonMaterial||$.isMeshLambertMaterial||$.isMeshBasicMaterial||$.isMeshStandardMaterial||$.isShaderMaterial)&&Et.setValue(k,"isOrthographic",T.isOrthographicCamera===!0),Z!==T&&(Z=T,ii=!0,ki=!0)}if(ze.needsLights&&(Wt.state.sunShadowMap.length>0&&Et.setValue(k,"sunShadowMap",Wt.state.sunShadowMap,ne),Wt.state.directionalShadowMap.length>0&&Et.setValue(k,"directionalShadowMap",Wt.state.directionalShadowMap,ne),Wt.state.spotShadowMap.length>0&&Et.setValue(k,"spotShadowMap",Wt.state.spotShadowMap,ne),Wt.state.pointShadowMap.length>0&&Et.setValue(k,"pointShadowMap",Wt.state.pointShadowMap,ne)),q.isSkinnedMesh){Et.setOptional(k,q,"bindMatrix"),Et.setOptional(k,q,"bindMatrixInverse");let _t=q.skeleton;_t&&(_t.boneTexture===null&&_t.computeBoneTexture(),Et.setValue(k,"boneTexture",_t.boneTexture,ne))}q.isBatchedMesh&&(Et.setOptional(k,q,"batchingTexture"),Et.setValue(k,"batchingTexture",q._matricesTexture,ne),Et.setOptional(k,q,"batchingIdTexture"),Et.setValue(k,"batchingIdTexture",q._indirectTexture,ne),Et.setOptional(k,q,"batchingColorTexture"),q._colorsTexture!==null&&Et.setValue(k,"batchingColorTexture",q._colorsTexture,ne));let Wn=te.morphAttributes;if((Wn.position!==void 0||Wn.normal!==void 0||Wn.color!==void 0)&&z.update(q,te,Sn),(ii||ze.receiveShadow!==q.receiveShadow)&&(ze.receiveShadow=q.receiveShadow,Et.setValue(k,"receiveShadow",q.receiveShadow)),($.isMeshStandardMaterial||$.isMeshLambertMaterial||$.isMeshPhongMaterial)&&$.envMap===null&&B.environment!==null&&(Pt.envMapIntensity.value=B.environmentIntensity),Pt.dfgLUT!==void 0&&(Pt.dfgLUT.value=sy()),ii){if(Et.setValue(k,"toneMappingExposure",P.toneMappingExposure),ze.needsLights&&Tc(Pt,ki),Ue&&$.fog===!0&&Ie.refreshFogUniforms(Pt,Ue),Ie.refreshMaterialUniforms(Pt,$,se,J,E.state.transmissionRenderTarget[T.id]),ze.needsLights&&ze.lightProbeGrid){let _t=ze.lightProbeGrid;Pt.probesSH.value=_t.texture,Pt.probesMin.value.copy(_t.boundingBox.min),Pt.probesMax.value.copy(_t.boundingBox.max),Pt.probesResolution.value.copy(_t.resolution)}Tr.upload(k,Qa(ze),Pt,ne)}if($.isShaderMaterial&&$.uniformsNeedUpdate===!0&&(Tr.upload(k,Qa(ze),Pt,ne),$.uniformsNeedUpdate=!1),$.isSpriteMaterial&&Et.setValue(k,"center",q.center),Et.setValue(k,"modelViewMatrix",q.modelViewMatrix),Et.setValue(k,"normalMatrix",q.normalMatrix),Et.setValue(k,"modelMatrix",q.matrixWorld),$.uniformsGroups!==void 0){let _t=$.uniformsGroups;for(let si=0,bi=_t.length;si<bi;si++){let ls=_t[si];ge.update(ls,Sn),ge.bind(ls,Sn)}}return Sn}function Tc(T,B){T.ambientLightColor.needsUpdate=B,T.lightProbe.needsUpdate=B,T.sunLights.needsUpdate=B,T.sunLightShadows.needsUpdate=B,T.directionalLights.needsUpdate=B,T.directionalLightShadows.needsUpdate=B,T.pointLights.needsUpdate=B,T.pointLightShadows.needsUpdate=B,T.spotLights.needsUpdate=B,T.spotLightShadows.needsUpdate=B,T.rectAreaLights.needsUpdate=B,T.hemisphereLights.needsUpdate=B}function Ni(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return Y},this.getRenderTarget=function(){return re},this.setRenderTargetTextures=function(T,B,te){let $=j.get(T);$.__autoAllocateDepthBuffer=T.resolveDepthBuffer===!1,$.__autoAllocateDepthBuffer===!1&&($.__useRenderToTexture=!1),j.get(T.texture).__webglTexture=B,j.get(T.depthTexture).__webglTexture=$.__autoAllocateDepthBuffer?void 0:te,$.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(T,B){let te=j.get(T);te.__webglFramebuffer=B,te.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(T,B=0,te=0){re=T,G=B,Y=te;let $=null,q=!1,Ue=!1;if(T){let Ne=j.get(T);if(Ne.__useDefaultFramebuffer!==void 0){b.bindFramebuffer(k.FRAMEBUFFER,Ne.__webglFramebuffer),ie.copy(T.viewport),xe.copy(T.scissor),be=T.scissorTest,b.viewport(ie),b.scissor(xe),b.setScissorTest(be),W=-1;return}else if(Ne.__webglFramebuffer===void 0)ne.setupRenderTarget(T);else if(Ne.__hasExternalTextures)ne.rebindTextures(T,j.get(T.texture).__webglTexture,j.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){let dt=T.depthTexture;if(Ne.__boundDepthTexture!==dt){if(dt!==null&&j.has(dt)&&(T.width!==dt.image.width||T.height!==dt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ne.setupDepthRenderbuffer(T)}}let Xe=T.texture;(Xe.isData3DTexture||Xe.isDataArrayTexture||Xe.isCompressedArrayTexture)&&(Ue=!0);let We=j.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(We[B])?$=We[B][te]:$=We[B],q=!0):T.samples>0&&ne.useMultisampledRTT(T)===!1?$=j.get(T).__webglMultisampledFramebuffer:Array.isArray(We)?$=We[te]:$=We,ie.copy(T.viewport),xe.copy(T.scissor),be=T.scissorTest}else ie.copy(Le).multiplyScalar(se).floor(),xe.copy(Qe).multiplyScalar(se).floor(),be=ct;if(te!==0&&($=O),b.bindFramebuffer(k.FRAMEBUFFER,$)&&b.drawBuffers(T,$),b.viewport(ie),b.scissor(xe),b.setScissorTest(be),q){let Ne=j.get(T.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_CUBE_MAP_POSITIVE_X+B,Ne.__webglTexture,te)}else if(Ue){let Ne=B;for(let Xe=0;Xe<T.textures.length;Xe++){let We=j.get(T.textures[Xe]);k.framebufferTextureLayer(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0+Xe,We.__webglTexture,te,Ne)}}else if(T!==null&&te!==0){let Ne=j.get(T.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,Ne.__webglTexture,te)}W=-1};function Lt(T){let B=j.get(T);return(B.__readFormat!==T.format||B.__readType!==T.type)&&(B.__readFormat=T.format,B.__readType=T.type,B.__formatReadable=I.textureFormatReadable(T.format),B.__typeReadable=I.textureTypeReadable(T.type)),B}this.readRenderTargetPixels=function(T,B,te,$,q,Ue,He,Ne=0){if(!(T&&T.isWebGLRenderTarget)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Xe=j.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&He!==void 0&&(Xe=Xe[He]),Xe){b.bindFramebuffer(k.FRAMEBUFFER,Xe);try{let We=T.textures[Ne],dt=We.format,at=We.type;T.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+Ne);let Ge=Lt(We);if(Ge.__formatReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ge.__typeReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=T.width-$&&te>=0&&te<=T.height-q&&k.readPixels(B,te,$,q,De.convert(dt),De.convert(at),Ue)}finally{let We=re!==null?j.get(re).__webglFramebuffer:null;b.bindFramebuffer(k.FRAMEBUFFER,We)}}},this.readRenderTargetPixelsAsync=async function(T,B,te,$,q,Ue,He,Ne=0){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Xe=j.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&He!==void 0&&(Xe=Xe[He]),Xe)if(B>=0&&B<=T.width-$&&te>=0&&te<=T.height-q){b.bindFramebuffer(k.FRAMEBUFFER,Xe);let We=T.textures[Ne],dt=We.format,at=We.type;T.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+Ne);let Ge=Lt(We);if(Ge.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ge.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let yt=k.createBuffer();k.bindBuffer(k.PIXEL_PACK_BUFFER,yt),k.bufferData(k.PIXEL_PACK_BUFFER,Ue.byteLength,k.STREAM_READ),k.readPixels(B,te,$,q,De.convert(dt),De.convert(at),0),k.bindBuffer(k.PIXEL_PACK_BUFFER,null);let Ot=re!==null?j.get(re).__webglFramebuffer:null;b.bindFramebuffer(k.FRAMEBUFFER,Ot);let Rt=k.fenceSync(k.SYNC_GPU_COMMANDS_COMPLETE,0);return k.flush(),await Bp(k,Rt,4),k.bindBuffer(k.PIXEL_PACK_BUFFER,yt),k.getBufferSubData(k.PIXEL_PACK_BUFFER,0,Ue),k.bindBuffer(k.PIXEL_PACK_BUFFER,null),k.deleteBuffer(yt),k.deleteSync(Rt),Ue}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(T,B=null,te=0){let $=Math.pow(2,-te),q=Math.floor(T.image.width*$),Ue=Math.floor(T.image.height*$),He=B!==null?B.x:0,Ne=B!==null?B.y:0;ne.setTexture2D(T,0),k.copyTexSubImage2D(k.TEXTURE_2D,te,0,0,He,Ne,q,Ue),b.unbindTexture()},this.copyTextureToTexture=function(T,B,te=null,$=null,q=0,Ue=0){let He,Ne,Xe,We,dt,at,Ge,yt,Ot,Rt=T.isCompressedTexture?T.mipmaps[Ue]:T.image;if(te!==null)He=te.max.x-te.min.x,Ne=te.max.y-te.min.y,Xe=te.isBox3?te.max.z-te.min.z:1,We=te.min.x,dt=te.min.y,at=te.isBox3?te.min.z:0;else{let Pt=Math.pow(2,-q);He=Math.floor(Rt.width*Pt),Ne=Math.floor(Rt.height*Pt),T.isDataArrayTexture?Xe=Rt.depth:T.isData3DTexture?Xe=Math.floor(Rt.depth*Pt):Xe=1,We=0,dt=0,at=0}$!==null?(Ge=$.x,yt=$.y,Ot=$.z):(Ge=0,yt=0,Ot=0);let At=De.convert(B.format),qt=De.convert(B.type),ze;B.isData3DTexture?(ne.setTexture3D(B,0),ze=k.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(ne.setTexture2DArray(B,0),ze=k.TEXTURE_2D_ARRAY):(ne.setTexture2D(B,0),ze=k.TEXTURE_2D),b.activeTexture(k.TEXTURE0),b.pixelStorei(k.UNPACK_FLIP_Y_WEBGL,B.flipY),b.pixelStorei(k.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),b.pixelStorei(k.UNPACK_ALIGNMENT,B.unpackAlignment);let Wt=b.getParameter(k.UNPACK_ROW_LENGTH),xt=b.getParameter(k.UNPACK_IMAGE_HEIGHT),Sn=b.getParameter(k.UNPACK_SKIP_PIXELS),Un=b.getParameter(k.UNPACK_SKIP_ROWS),ii=b.getParameter(k.UNPACK_SKIP_IMAGES);b.pixelStorei(k.UNPACK_ROW_LENGTH,Rt.width),b.pixelStorei(k.UNPACK_IMAGE_HEIGHT,Rt.height),b.pixelStorei(k.UNPACK_SKIP_PIXELS,We),b.pixelStorei(k.UNPACK_SKIP_ROWS,dt),b.pixelStorei(k.UNPACK_SKIP_IMAGES,at);let ki=T.isDataArrayTexture||T.isData3DTexture,Et=B.isDataArrayTexture||B.isData3DTexture;if(T.isDepthTexture){let Pt=j.get(T),Wn=j.get(B),_t=j.get(Pt.__renderTarget),si=j.get(Wn.__renderTarget);b.bindFramebuffer(k.READ_FRAMEBUFFER,_t.__webglFramebuffer),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,si.__webglFramebuffer);for(let bi=0;bi<Xe;bi++)ki&&(k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,j.get(T).__webglTexture,q,at+bi),k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,j.get(B).__webglTexture,Ue,Ot+bi)),k.blitFramebuffer(We,dt,He,Ne,Ge,yt,He,Ne,k.DEPTH_BUFFER_BIT,k.NEAREST);b.bindFramebuffer(k.READ_FRAMEBUFFER,null),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else if(q!==0||T.isRenderTargetTexture||j.has(T)){let Pt=j.get(T),Wn=j.get(B);b.bindFramebuffer(k.READ_FRAMEBUFFER,L),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,U);for(let _t=0;_t<Xe;_t++)ki?k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Pt.__webglTexture,q,at+_t):k.framebufferTexture2D(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,Pt.__webglTexture,q),Et?k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Wn.__webglTexture,Ue,Ot+_t):k.framebufferTexture2D(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,Wn.__webglTexture,Ue),q!==0?k.blitFramebuffer(We,dt,He,Ne,Ge,yt,He,Ne,k.COLOR_BUFFER_BIT,k.NEAREST):Et?k.copyTexSubImage3D(ze,Ue,Ge,yt,Ot+_t,We,dt,He,Ne):k.copyTexSubImage2D(ze,Ue,Ge,yt,We,dt,He,Ne);b.bindFramebuffer(k.READ_FRAMEBUFFER,null),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else Et?T.isDataTexture||T.isData3DTexture?k.texSubImage3D(ze,Ue,Ge,yt,Ot,He,Ne,Xe,At,qt,Rt.data):B.isCompressedArrayTexture?k.compressedTexSubImage3D(ze,Ue,Ge,yt,Ot,He,Ne,Xe,At,Rt.data):k.texSubImage3D(ze,Ue,Ge,yt,Ot,He,Ne,Xe,At,qt,Rt):T.isDataTexture?k.texSubImage2D(k.TEXTURE_2D,Ue,Ge,yt,He,Ne,At,qt,Rt.data):T.isCompressedTexture?k.compressedTexSubImage2D(k.TEXTURE_2D,Ue,Ge,yt,Rt.width,Rt.height,At,Rt.data):k.texSubImage2D(k.TEXTURE_2D,Ue,Ge,yt,He,Ne,At,qt,Rt);b.pixelStorei(k.UNPACK_ROW_LENGTH,Wt),b.pixelStorei(k.UNPACK_IMAGE_HEIGHT,xt),b.pixelStorei(k.UNPACK_SKIP_PIXELS,Sn),b.pixelStorei(k.UNPACK_SKIP_ROWS,Un),b.pixelStorei(k.UNPACK_SKIP_IMAGES,ii),Ue===0&&B.generateMipmaps&&k.generateMipmap(ze),b.unbindTexture()},this.initRenderTarget=function(T){j.get(T).__webglFramebuffer===void 0&&ne.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?ne.setTextureCube(T,0):T.isData3DTexture?ne.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?ne.setTexture2DArray(T,0):ne.setTexture2D(T,0),b.unbindTexture()},this.resetState=function(){G=0,Y=0,re=null,b.reset(),ke.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return qn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=ft._getDrawingBufferColorSpace(e),t.unpackColorSpace=ft._getUnpackColorSpace()}};var Sf={type:"change"},fd={type:"start"},Ef={type:"end"},hc=new vs,wf=new In,ry=Math.cos(70*kn.DEG2RAD),Qt=new F,Tn=2*Math.PI,Ct={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},pd=1e-6,dc=class extends Sa{constructor(e,t=null){super(e,t),this.state=Ct.NONE,this.target=new F,this.cursor=new F,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Qi.ROTATE,MIDDLE:Qi.DOLLY,RIGHT:Qi.PAN},this.touches={ONE:es.ROTATE,TWO:es.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new F,this._lastQuaternion=new mn,this._lastTargetPosition=new F,this._quat=new mn().setFromUnitVectors(e.up,new F(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new vr,this._sphericalDelta=new vr,this._scale=1,this._panOffset=new F,this._rotateStart=new me,this._rotateEnd=new me,this._rotateDelta=new me,this._panStart=new me,this._panEnd=new me,this._panDelta=new me,this._dollyStart=new me,this._dollyEnd=new me,this._dollyDelta=new me,this._dollyDirection=new F,this._mouse=new me,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=oy.bind(this),this._onPointerDown=ay.bind(this),this._onPointerUp=ly.bind(this),this._onContextMenu=my.bind(this),this._onMouseWheel=dy.bind(this),this._onKeyDown=uy.bind(this),this._onTouchStart=py.bind(this),this._onTouchMove=fy.bind(this),this._onMouseDown=cy.bind(this),this._onMouseMove=hy.bind(this),this._interceptControlDown=gy.bind(this),this._interceptControlUp=xy.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Ct.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Sf),this.update(),this.state=Ct.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;Qt.copy(t).sub(this.target),Qt.applyQuaternion(this._quat),this._spherical.setFromVector3(Qt),this.autoRotate&&this.state===Ct.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Tn:n>Math.PI&&(n-=Tn),s<-Math.PI?s+=Tn:s>Math.PI&&(s-=Tn),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(Qt.setFromSpherical(this._spherical),Qt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Qt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=Qt.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new F(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new F(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=Qt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(hc.origin.copy(this.object.position),hc.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(hc.direction))<ry?this.object.lookAt(this.target):(wf.setFromNormalAndCoplanarPoint(this.object.up,this.target),hc.intersectPlane(wf,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>pd||8*(1-this._lastQuaternion.dot(this.object.quaternion))>pd||this._lastTargetPosition.distanceToSquared(this.target)>pd?(this.dispatchEvent(Sf),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Tn/60*this.autoRotateSpeed*e:Tn/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Qt.setFromMatrixColumn(t,0),Qt.multiplyScalar(-e),this._panOffset.add(Qt)}_panUp(e,t){this.screenSpacePanning===!0?Qt.setFromMatrixColumn(t,1):(Qt.setFromMatrixColumn(t,0),Qt.crossVectors(this.object.up,Qt)),Qt.multiplyScalar(e),this._panOffset.add(Qt)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Qt.copy(s).sub(this.target);let r=Qt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=e-n.left,r=t-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Tn*this._rotateDelta.x/t.clientHeight),this._rotateUp(Tn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Tn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Tn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Tn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Tn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(n,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),s=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Tn*this._rotateDelta.x/t.clientHeight),this._rotateUp(Tn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new me,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function ay(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function oy(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function ly(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Ef),this.state=Ct.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function cy(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Qi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=Ct.DOLLY;break;case Qi.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Ct.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Ct.ROTATE}break;case Qi.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Ct.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Ct.PAN}break;default:this.state=Ct.NONE}this.state!==Ct.NONE&&this.dispatchEvent(fd)}function hy(i){switch(this.state){case Ct.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case Ct.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case Ct.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function dy(i){this.enabled===!1||this.enableZoom===!1||this.state!==Ct.NONE||(i.preventDefault(),this.dispatchEvent(fd),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Ef))}function uy(i){this.enabled!==!1&&this._handleKeyDown(i)}function py(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case es.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=Ct.TOUCH_ROTATE;break;case es.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=Ct.TOUCH_PAN;break;default:this.state=Ct.NONE}break;case 2:switch(this.touches.TWO){case es.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=Ct.TOUCH_DOLLY_PAN;break;case es.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=Ct.TOUCH_DOLLY_ROTATE;break;default:this.state=Ct.NONE}break;default:this.state=Ct.NONE}this.state!==Ct.NONE&&this.dispatchEvent(fd)}function fy(i){switch(this._trackPointer(i),this.state){case Ct.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case Ct.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case Ct.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case Ct.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=Ct.NONE}}function my(i){this.enabled!==!1&&i.preventDefault()}function gy(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function xy(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var uc=class extends _s{constructor(){super(),this.name="RoomEnvironment",this.position.y=-3.5;let e=new Yi;e.deleteAttribute("uv");let t=new Hn({side:Zt}),n=new Hn,s=new ya(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new mt(e,t);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let a=new Qr(e,n,6),o=new rn;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),a.setMatrixAt(0,o.matrix),o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),a.setMatrixAt(1,o.matrix),o.position.set(6.167,.857,7.803),o.rotation.set(0,.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),a.setMatrixAt(2,o.matrix),o.position.set(-2.017,.018,6.124),o.rotation.set(0,.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),a.setMatrixAt(3,o.matrix),o.position.set(2.291,-.756,-2.621),o.rotation.set(0,-.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),a.setMatrixAt(4,o.matrix),o.position.set(-2.193,-.369,-5.547),o.rotation.set(0,.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),a.setMatrixAt(5,o.matrix),this.add(a);let l=new mt(e,Rr(50));l.position.set(-16.116,14.37,8.208),l.scale.set(.1,2.428,2.739),this.add(l);let c=new mt(e,Rr(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(.1,2.425,2.751),this.add(c);let h=new mt(e,Rr(17));h.position.set(14.904,12.198,-1.832),h.scale.set(.15,4.265,6.331),this.add(h);let f=new mt(e,Rr(43));f.position.set(-.462,8.89,14.52),f.scale.set(4.38,5.441,.088),this.add(f);let d=new mt(e,Rr(20));d.position.set(3.235,11.486,-12.541),d.scale.set(2.5,2,.1),this.add(d);let m=new mt(e,Rr(100));m.position.set(0,20,0),m.scale.set(1,.1,1),this.add(m)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function Rr(i){return new fa({color:0,emissive:16777215,emissiveIntensity:i})}var _i={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var Mn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},_y=new Ji(-1,1,1,-1,0,1),md=class extends ln{constructor(){super(),this.setAttribute("position",new Vt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Vt([0,2,0,0,2,0],2))}},vy=new md,vi=class{constructor(e){this._mesh=new mt(vy,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,_y)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var pc=class extends Mn{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Ft?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=En.clone(e.uniforms),this.material=new Ft({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new vi(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Xa=class extends Mn{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let s=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},fc=class extends Mn{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var mc=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new me);this._width=n.width,this._height=n.height,t=new Ut(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Dt}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new pc(_i),this.copyPass.material.blending=Gt,this.timer=new ba}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let s=0,r=this.passes.length;s<r;s++){let a=this.passes[s];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){let o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}Xa!==void 0&&(a instanceof Xa?n=!0:a instanceof fc&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new me);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var gc=class extends Mn{constructor(e,t,n=0,s=0){super(),this.scene=e,this.camera=t,this.sampleLevel=4,this.unbiased=!0,this.stencilBuffer=!1,this.clearColor=n,this.clearAlpha=s,this._sampleRenderTarget=null,this._oldClearColor=new st,this._copyUniforms=En.clone(_i.uniforms),this._copyMaterial=new Ft({uniforms:this._copyUniforms,vertexShader:_i.vertexShader,fragmentShader:_i.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,premultipliedAlpha:!0,blending:Ea}),this._fsQuad=new vi(this._copyMaterial)}dispose(){this._sampleRenderTarget&&(this._sampleRenderTarget.dispose(),this._sampleRenderTarget=null),this._copyMaterial.dispose(),this._fsQuad.dispose()}setSize(e,t){this._sampleRenderTarget&&this._sampleRenderTarget.setSize(e,t)}render(e,t,n){this._sampleRenderTarget||(this._sampleRenderTarget=new Ut(n.width,n.height,{type:Dt,stencilBuffer:this.stencilBuffer}),this._sampleRenderTarget.texture.name="SSAARenderPass.sample");let s=yy[Math.max(0,Math.min(this.sampleLevel,5))],r=e.autoClear;e.autoClear=!1,e.getClearColor(this._oldClearColor);let a=e.getClearAlpha(),o=1/s.length,l=1/32;this._copyUniforms.tDiffuse.value=this._sampleRenderTarget.texture;let c={fullWidth:n.width,fullHeight:n.height,offsetX:0,offsetY:0,width:n.width,height:n.height},h=Object.assign({},this.camera.view);h.enabled&&Object.assign(c,h);for(let f=0;f<s.length;f++){let d=s[f];this.camera.setViewOffset&&this.camera.setViewOffset(c.fullWidth,c.fullHeight,c.offsetX+d[0]*.0625,c.offsetY+d[1]*.0625,c.width,c.height);let m=o;if(this.unbiased){let g=-.5+(f+.5)/s.length;m+=l*g}this._copyUniforms.opacity.value=m,e.setClearColor(this.clearColor,this.clearAlpha),e.setRenderTarget(this._sampleRenderTarget),e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(this.renderToScreen?null:t),f===0&&(e.setClearColor(0,0),e.clear()),this._fsQuad.render(e)}this.camera.setViewOffset&&h.enabled?this.camera.setViewOffset(h.fullWidth,h.fullHeight,h.offsetX,h.offsetY,h.width,h.height):this.camera.clearViewOffset&&this.camera.clearViewOffset(),e.autoClear=r,e.setClearColor(this._oldClearColor,a)}},yy=[[[0,0]],[[4,4],[-4,-4]],[[-2,-6],[6,-2],[-6,2],[2,6]],[[1,-3],[-1,3],[5,1],[-3,-5],[-5,5],[-7,-1],[3,7],[7,-7]],[[1,1],[-1,-3],[-3,2],[4,-1],[-5,-2],[2,5],[5,3],[3,-5],[-2,6],[0,-7],[-4,-6],[-6,4],[-8,0],[7,-4],[6,7],[-7,-8]],[[-4,-7],[-7,-5],[-3,-5],[-5,-4],[-1,-4],[-2,-2],[-6,-1],[-4,0],[-7,1],[-1,2],[-6,3],[-3,3],[-7,6],[-3,6],[-5,7],[-1,7],[5,-7],[1,-6],[6,-5],[4,-4],[2,-3],[7,-2],[1,-1],[4,-1],[2,1],[6,2],[0,4],[4,4],[2,5],[7,5],[5,6],[3,7]]];var xc=class extends gc{constructor(e,t,n,s){super(e,t,n,s),this.sampleLevel=0,this.accumulate=!1,this.accumulateIndex=-1,this._sampleRenderTarget=null,this._holdRenderTarget=null}render(e,t,n,s){if(this.accumulate===!1){super.render(e,t,n,s),this.accumulateIndex=-1;return}let r=by[5];this._sampleRenderTarget===null&&(this._sampleRenderTarget=new Ut(n.width,n.height,{type:Dt}),this._sampleRenderTarget.texture.name="TAARenderPass.sample"),this._holdRenderTarget===null&&(this._holdRenderTarget=new Ut(n.width,n.height,{type:Dt,depthBuffer:!1}),this._holdRenderTarget.texture.name="TAARenderPass.hold"),this.accumulateIndex===-1&&(super.render(e,this._holdRenderTarget,n,s),this.accumulateIndex=0);let a=e.autoClear;e.autoClear=!1,e.getClearColor(this._oldClearColor);let o=e.getClearAlpha(),l=1/r.length;if(this.accumulateIndex>=0&&this.accumulateIndex<r.length){this._copyUniforms.opacity.value=l,this._copyUniforms.tDiffuse.value=t.texture;let h=Math.pow(2,this.sampleLevel);for(let f=0;f<h;f++){let d=this.accumulateIndex,m=r[d];if(this.camera.setViewOffset&&this.camera.setViewOffset(n.width,n.height,m[0]*.0625,m[1]*.0625,n.width,n.height),e.setRenderTarget(t),e.setClearColor(this.clearColor,this.clearAlpha),e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(this._sampleRenderTarget),this.accumulateIndex===0&&(e.setClearColor(0,0),e.clear()),this._fsQuad.render(e),this.accumulateIndex++,this.accumulateIndex>=r.length)break}this.camera.clearViewOffset&&this.camera.clearViewOffset()}e.setClearColor(this.clearColor,this.clearAlpha);let c=this.accumulateIndex*l;c>0&&(this._copyUniforms.opacity.value=1,this._copyUniforms.tDiffuse.value=this._sampleRenderTarget.texture,e.setRenderTarget(t),e.clear(),this._fsQuad.render(e)),c<1&&(this._copyUniforms.opacity.value=1-c,this._copyUniforms.tDiffuse.value=this._holdRenderTarget.texture,e.setRenderTarget(t),this._fsQuad.render(e)),e.autoClear=a,e.setClearColor(this._oldClearColor,o)}dispose(){super.dispose(),this._holdRenderTarget&&this._holdRenderTarget.dispose()}},by=[[[0,0]],[[4,4],[-4,-4]],[[-2,-6],[6,-2],[-6,2],[2,6]],[[1,-3],[-1,3],[5,1],[-3,-5],[-5,5],[-7,-1],[3,7],[7,-7]],[[1,1],[-1,-3],[-3,2],[4,-1],[-5,-2],[2,5],[5,3],[3,-5],[-2,6],[0,-7],[-4,-6],[-6,4],[-8,0],[7,-4],[6,7],[-7,-8]],[[-4,-7],[-7,-5],[-3,-5],[-5,-4],[-1,-4],[-2,-2],[-6,-1],[-4,0],[-7,1],[-1,2],[-6,3],[-3,3],[-7,6],[-3,6],[-5,7],[-1,7],[5,-7],[1,-6],[6,-5],[4,-4],[2,-3],[7,-2],[1,-1],[4,-1],[2,1],[6,2],[0,4],[4,4],[2,5],[7,5],[5,6],[3,7]]];var _c=class extends Mn{constructor(e,t,n=null,s=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new st}render(e,t,n){let s=e.autoClear;e.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=s}};var Ya={name:"GTAOShader",defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:"x",SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new me},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new Mt},cameraProjectionMatrixInverse:{value:new Mt},cameraWorldMatrix:{value:new Mt},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new F(-1,-1,-1)},sceneBoxMax:{value:new F(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);

			#ifdef USE_REVERSED_DEPTH_BUFFER
				if (depth <= 0.0) {
					discard;
					return;
				}
			#else
				if (depth >= 1.0) {
					discard;
					return;
				}
			#endif
			
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},ja={name:"GTAODepthShader",defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},vc={name:"GTAOBlendShader",uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`};function Tf(i=5){let e=Math.floor(i)%2===0?Math.floor(i)+1:Math.floor(i),t=My(e),n=t.length,s=new Uint8Array(n*4);for(let a=0;a<n;++a){let o=t[a],l=2*Math.PI*o/n,c=new F(Math.cos(l),Math.sin(l),0).normalize();s[a*4]=(c.x*.5+.5)*255,s[a*4+1]=(c.y*.5+.5)*255,s[a*4+2]=127,s[a*4+3]=255}let r=new Kn(s,e,e);return r.wrapS=zn,r.wrapT=zn,r.needsUpdate=!0,r}function My(i){let e=Math.floor(i)%2===0?Math.floor(i)+1:Math.floor(i),t=e*e,n=Array(t).fill(0),s=Math.floor(e/2),r=e-1;for(let a=1;a<=t;){if(s===-1&&r===e?(r=e-2,s=0):(r===e&&(r=0),s<0&&(s=e-1)),n[s*e+r]!==0){r-=2,s++;continue}else n[s*e+r]=a++;r++,s--}return n}var qa={name:"PoissonDenoiseShader",defines:{SAMPLES:16,SAMPLE_VECTORS:gd(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new me},cameraProjectionMatrixInverse:{value:new Mt},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function gd(i,e,t){let n=Sy(i,e,t),s="vec3[SAMPLES](";for(let r=0;r<i;r++){let a=n[r];s+=`vec3(${a.x}, ${a.y}, ${a.z})${r<i-1?",":")"}`}return s}function Sy(i,e,t){let n=[];for(let s=0;s<i;s++){let r=2*Math.PI*e*s/i,a=Math.pow(s/(i-1),t);n.push(new F(Math.cos(r),Math.sin(r),a))}return n}var yc=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let t=0;t<512;t++)this.perm[t]=this.p[t&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,s,r,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,l=Math.floor(e+o),c=Math.floor(t+o),h=(3-Math.sqrt(3))/6,f=(l+c)*h,d=l-f,m=c-f,g=e-d,A=t-m,u,p;g>A?(u=1,p=0):(u=0,p=1);let S=g-u+h,C=A-p+h,y=g-1+2*h,M=A-1+2*h,E=l&255,R=c&255,v=this.perm[E+this.perm[R]]%12,w=this.perm[E+u+this.perm[R+p]]%12,P=this.perm[E+1+this.perm[R+1]]%12,D=.5-g*g-A*A;D<0?n=0:(D*=D,n=D*D*this._dot(this.grad3[v],g,A));let N=.5-S*S-C*C;N<0?s=0:(N*=N,s=N*N*this._dot(this.grad3[w],S,C));let O=.5-y*y-M*M;return O<0?r=0:(O*=O,r=O*O*this._dot(this.grad3[P],y,M)),70*(n+s+r)}noise3d(e,t,n){let s,r,a,o,c=(e+t+n)*.3333333333333333,h=Math.floor(e+c),f=Math.floor(t+c),d=Math.floor(n+c),m=1/6,g=(h+f+d)*m,A=h-g,u=f-g,p=d-g,S=e-A,C=t-u,y=n-p,M,E,R,v,w,P;S>=C?C>=y?(M=1,E=0,R=0,v=1,w=1,P=0):S>=y?(M=1,E=0,R=0,v=1,w=0,P=1):(M=0,E=0,R=1,v=1,w=0,P=1):C<y?(M=0,E=0,R=1,v=0,w=1,P=1):S<y?(M=0,E=1,R=0,v=0,w=1,P=1):(M=0,E=1,R=0,v=1,w=1,P=0);let D=S-M+m,N=C-E+m,O=y-R+m,L=S-v+2*m,U=C-w+2*m,G=y-P+2*m,Y=S-1+3*m,re=C-1+3*m,W=y-1+3*m,Z=h&255,ie=f&255,xe=d&255,be=this.perm[Z+this.perm[ie+this.perm[xe]]]%12,pe=this.perm[Z+M+this.perm[ie+E+this.perm[xe+R]]]%12,K=this.perm[Z+v+this.perm[ie+w+this.perm[xe+P]]]%12,Je=this.perm[Z+1+this.perm[ie+1+this.perm[xe+1]]]%12,J=.6-S*S-C*C-y*y;J<0?s=0:(J*=J,s=J*J*this._dot3(this.grad3[be],S,C,y));let se=.6-D*D-N*N-O*O;se<0?r=0:(se*=se,r=se*se*this._dot3(this.grad3[pe],D,N,O));let ce=.6-L*L-U*U-G*G;ce<0?a=0:(ce*=ce,a=ce*ce*this._dot3(this.grad3[K],L,U,G));let Ye=.6-Y*Y-re*re-W*W;return Ye<0?o=0:(Ye*=Ye,o=Ye*Ye*this._dot3(this.grad3[Je],Y,re,W)),32*(s+r+a+o)}noise4d(e,t,n,s){let r=this.grad4,a=this.simplex,o=this.perm,l=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,h,f,d,m,g,A=(e+t+n+s)*l,u=Math.floor(e+A),p=Math.floor(t+A),S=Math.floor(n+A),C=Math.floor(s+A),y=(u+p+S+C)*c,M=u-y,E=p-y,R=S-y,v=C-y,w=e-M,P=t-E,D=n-R,N=s-v,O=w>P?32:0,L=w>D?16:0,U=P>D?8:0,G=w>N?4:0,Y=P>N?2:0,re=D>N?1:0,W=O+L+U+G+Y+re,Z=a[W][0]>=3?1:0,ie=a[W][1]>=3?1:0,xe=a[W][2]>=3?1:0,be=a[W][3]>=3?1:0,pe=a[W][0]>=2?1:0,K=a[W][1]>=2?1:0,Je=a[W][2]>=2?1:0,J=a[W][3]>=2?1:0,se=a[W][0]>=1?1:0,ce=a[W][1]>=1?1:0,Ye=a[W][2]>=1?1:0,Le=a[W][3]>=1?1:0,Qe=w-Z+c,ct=P-ie+c,ae=D-xe+c,de=N-be+c,_e=w-pe+2*c,Me=P-K+2*c,Ae=D-Je+2*c,je=N-J+2*c,ve=w-se+3*c,Pe=P-ce+3*c,Be=D-Ye+3*c,k=N-Le+3*c,ht=w-1+4*c,he=P-1+4*c,I=D-1+4*c,b=N-1+4*c,V=u&255,j=p&255,ne=S&255,ye=C&255,Te=o[V+o[j+o[ne+o[ye]]]]%32,H=o[V+Z+o[j+ie+o[ne+xe+o[ye+be]]]]%32,ee=o[V+pe+o[j+K+o[ne+Je+o[ye+J]]]]%32,fe=o[V+se+o[j+ce+o[ne+Ye+o[ye+Le]]]]%32,Ie=o[V+1+o[j+1+o[ne+1+o[ye+1]]]]%32,Se=.6-w*w-P*P-D*D-N*N;Se<0?h=0:(Se*=Se,h=Se*Se*this._dot4(r[Te],w,P,D,N));let Ee=.6-Qe*Qe-ct*ct-ae*ae-de*de;Ee<0?f=0:(Ee*=Ee,f=Ee*Ee*this._dot4(r[H],Qe,ct,ae,de));let Ve=.6-_e*_e-Me*Me-Ae*Ae-je*je;Ve<0?d=0:(Ve*=Ve,d=Ve*Ve*this._dot4(r[ee],_e,Me,Ae,je));let $e=.6-ve*ve-Pe*Pe-Be*Be-k*k;$e<0?m=0:($e*=$e,m=$e*$e*this._dot4(r[fe],ve,Pe,Be,k));let et=.6-ht*ht-he*he-I*I-b*b;return et<0?g=0:(et*=et,g=et*et*this._dot4(r[Ie],ht,he,I,b)),27*(h+f+d+m+g)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,s){return e[0]*t+e[1]*n+e[2]*s}_dot4(e,t,n,s,r){return e[0]*t+e[1]*n+e[2]*s+e[3]*r}};var $a=class i extends Mn{constructor(e,t,n=512,s=512,r,a,o){super(),this.width=n,this.height=s,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=Tf(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new Ut(this.width,this.height,{type:Dt,depthBuffer:!1}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new Ft({defines:Object.assign({},Ya.defines),uniforms:En.clone(Ya.uniforms),vertexShader:Ya.vertexShader,fragmentShader:Ya.fragmentShader,blending:Gt,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=this.camera.isPerspectiveCamera?1:0,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new pa,this.normalMaterial.blending=Gt,this.pdMaterial=new Ft({defines:Object.assign({},qa.defines),uniforms:En.clone(qa.uniforms),vertexShader:qa.vertexShader,fragmentShader:qa.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new Ft({defines:Object.assign({},ja.defines),uniforms:En.clone(ja.uniforms),vertexShader:ja.vertexShader,fragmentShader:ja.fragmentShader,blending:Gt}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new Ft({uniforms:En.clone(_i.uniforms),vertexShader:_i.vertexShader,fragmentShader:_i.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:Aa,blendDst:Es,blendEquation:Gn,blendSrcAlpha:Ta,blendDstAlpha:Es,blendEquationAlpha:Gn}),this.blendMaterial=new Ft({uniforms:En.clone(vc.uniforms),vertexShader:vc.vertexShader,fragmentShader:vc.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:ml,blendSrc:Aa,blendDst:Es,blendEquation:Gn,blendSrcAlpha:Ta,blendDstAlpha:Es,blendEquationAlpha:Gn}),this._fsQuad=new vi(null),this._originalClearColor=new st,this.setGBuffer(r?r.depthTexture:void 0,r?r.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e!==void 0?(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1):(this.depthTexture=new pi,this.depthTexture.format=mi,this.depthTexture.type=is,this.normalRenderTarget=new Ut(this.width,this.height,{minFilter:Ht,magFilter:Ht,type:Dt,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0);let n=this.normalTexture?1:0,s=this.depthTexture===this.normalTexture?"w":"x";this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=s,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=s,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&(e.screenSpaceRadius?1:0)!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=e.screenSpaceRadius?1:0,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=gd(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(e,t,n){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(e,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(e,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(e,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case i.OUTPUT.Off:break;case i.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=n.texture,this.copyMaterial.blending=Gt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=Gt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=Gt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(e,this.depthRenderMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=Gt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=n.texture,this.copyMaterial.blending=Gt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(e,this.blendMaterial,this.renderToScreen?null:t);break;default:console.warn("THREE.GTAOPass: Unknown output type.")}}_renderPass(e,t,n,s,r){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,s!=null&&(e.setClearColor(s),e.setClearAlpha(r||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,s,r){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,s=t.clearColor||s,r=t.clearAlpha||r,s!=null&&(e.setClearColor(s),e.setClearAlpha(r||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(n){(n.isPoints||n.isLine||n.isLine2)&&n.visible&&(n.visible=!1,t.push(n))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new yc,n=e*e*4,s=new Uint8Array(n);for(let a=0;a<e;a++)for(let o=0;o<e;o++){let l=a,c=o;s[(a*e+o)*4]=(t.noise(l,c)*.5+.5)*255,s[(a*e+o)*4+1]=(t.noise(l+e,c)*.5+.5)*255,s[(a*e+o)*4+2]=(t.noise(l,c+e)*.5+.5)*255,s[(a*e+o)*4+3]=(t.noise(l+e,c+e)*.5+.5)*255}let r=new Kn(s,e,e,wn,xn);return r.wrapS=zn,r.wrapT=zn,r.needsUpdate=!0,r}};$a.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};var Za={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var bc=class extends Mn{constructor(){super(),this.isOutputPass=!0,this.uniforms=En.clone(Za.uniforms),this.material=new gr({name:Za.name,uniforms:this.uniforms,vertexShader:Za.vertexShader,fragmentShader:Za.fragmentShader}),this._fsQuad=new vi(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},ft.getTransfer(this._outputColorSpace)===St&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Ca?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Ra?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Pa?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Ts?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Da?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===La?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===Ia&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Mc=class extends ga{constructor(e){super(e),this.type=Dt}parse(e){let a=function(v,w){switch(v){case 1:throw new Error("THREE.HDRLoader: Read Error: "+(w||""));case 2:throw new Error("THREE.HDRLoader: Write Error: "+(w||""));case 3:throw new Error("THREE.HDRLoader: Bad File Format: "+(w||""));default:case 4:throw new Error("THREE.HDRLoader: Memory Error: "+(w||""))}},f=function(v,w,P){w=w||1024;let N=v.pos,O=-1,L=0,U="",G=String.fromCharCode.apply(null,new Uint16Array(v.subarray(N,N+128)));for(;0>(O=G.indexOf(`
`))&&L<w&&N<v.byteLength;)U+=G,L+=G.length,N+=128,G=String.fromCharCode.apply(null,new Uint16Array(v.subarray(N,N+128)));return-1<O?(P!==!1&&(v.pos+=L+O+1),U+G.slice(0,O)):!1},d=function(v){let w=/^#\?(\S+)/,P=/^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,D=/^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,N=/^\s*FORMAT=(\S+)\s*$/,O=/^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,L={valid:0,string:"",comments:"",programtype:"RGBE",format:"",gamma:1,exposure:1,width:0,height:0},U,G;for((v.pos>=v.byteLength||!(U=f(v)))&&a(1,"no header found"),(G=U.match(w))||a(3,"bad initial token"),L.valid|=1,L.programtype=G[1],L.string+=U+`
`;U=f(v),U!==!1;){if(L.string+=U+`
`,U.charAt(0)==="#"){L.comments+=U+`
`;continue}if((G=U.match(P))&&(L.gamma=parseFloat(G[1])),(G=U.match(D))&&(L.exposure=parseFloat(G[1])),(G=U.match(N))&&(L.valid|=2,L.format=G[1]),(G=U.match(O))&&(L.valid|=4,L.height=parseInt(G[1],10),L.width=parseInt(G[2],10)),L.valid&2&&L.valid&4)break}return L.valid&2||a(3,"missing format specifier"),L.valid&4||a(3,"missing image size specifier"),L},m=function(v,w,P){let D=w;if(D<8||D>32767||v[0]!==2||v[1]!==2||v[2]&128)return new Uint8Array(v);D!==(v[2]<<8|v[3])&&a(3,"wrong scanline width");let N=new Uint8Array(4*w*P);N.length||a(4,"unable to allocate buffer space");let O=0,L=0,U=4*D,G=new Uint8Array(4),Y=new Uint8Array(U),re=P;for(;re>0&&L<v.byteLength;){L+4>v.byteLength&&a(1),G[0]=v[L++],G[1]=v[L++],G[2]=v[L++],G[3]=v[L++],(G[0]!=2||G[1]!=2||(G[2]<<8|G[3])!=D)&&a(3,"bad rgbe scanline format");let W=0,Z;for(;W<U&&L<v.byteLength;){Z=v[L++];let xe=Z>128;if(xe&&(Z-=128),(Z===0||W+Z>U)&&a(3,"bad scanline data"),xe){let be=v[L++];for(let pe=0;pe<Z;pe++)Y[W++]=be}else Y.set(v.subarray(L,L+Z),W),W+=Z,L+=Z}let ie=D;for(let xe=0;xe<ie;xe++){let be=0;N[O]=Y[xe+be],be+=D,N[O+1]=Y[xe+be],be+=D,N[O+2]=Y[xe+be],be+=D,N[O+3]=Y[xe+be],O+=4}re--}return N},g=function(v,w,P,D){let N=v[w+3],O=Math.pow(2,N-128)/255;P[D+0]=v[w+0]*O,P[D+1]=v[w+1]*O,P[D+2]=v[w+2]*O,P[D+3]=1},A=function(v,w,P,D){let N=v[w+3],O=Math.pow(2,N-128)/255;P[D+0]=Xi.toHalfFloat(Math.min(v[w+0]*O,65504)),P[D+1]=Xi.toHalfFloat(Math.min(v[w+1]*O,65504)),P[D+2]=Xi.toHalfFloat(Math.min(v[w+2]*O,65504)),P[D+3]=Xi.toHalfFloat(1)},u=new Uint8Array(e);u.pos=0;let p=d(u),S=p.width,C=p.height,y=m(u.subarray(u.pos),S,C),M,E,R;switch(this.type){case bn:R=y.length/4;let v=new Float32Array(R*4);for(let P=0;P<R;P++)g(y,P*4,v,P*4);M=v,E=bn;break;case Dt:R=y.length/4;let w=new Uint16Array(R*4);for(let P=0;P<R;P++)A(y,P*4,w,P*4);M=w,E=Dt;break;default:throw new Error("THREE.HDRLoader: Unsupported type: "+this.type)}return{width:S,height:C,data:M,header:p.string,gamma:p.gamma,exposure:p.exposure,type:E,colorSpace:xs,minFilter:zt,magFilter:zt,generateMipmaps:!1,flipY:!0}}setDataType(e){return this.type=e,this}};var Sc=class extends Mc{constructor(e){console.warn("RGBELoader has been deprecated. Please use HDRLoader instead."),super(e)}};var _d=i=>[i.points||[[0,0],[i.w,0],[i.w,i.h],[0,i.h]],...i.islands||[]],Af=(i,e,t)=>{let n=!1;for(let s=0,r=t.length-1;s<t.length;r=s++){let[a,o]=t[s],[l,c]=t[r];o>e!=c>e&&i<(l-a)*(e-o)/(c-o)+a&&(n=!n)}return n},wy=(i,e,t,n=.025)=>t.some(([s,r],a)=>{let[o,l]=t[(a+1)%t.length],c=o-s,h=l-r,f=Math.max(0,Math.min(1,((i-s)*c+(e-r)*h)/(c*c+h*h||1)));return Math.hypot(i-s-f*c,e-r-f*h)<n}),xd=(i,e,t,n=.025)=>_d(i).some(s=>Af(e-i.x,t-i.y,s)||wy(e-i.x,t-i.y,s,n))&&!(i.holes||[]).some(s=>Af(e-i.x,t-i.y,s));function Cf(i,e,t=.025){let n=e.hinge;if(!n)return[];let[s,r]=n.a,[a,o]=n.b,l=a-s,c=o-r,h=Math.hypot(l,c);if(h<.01)return[];let f=[0,1];for(let g of[i,e])for(let A of[..._d(g),...g.holes||[]])for(let u=0;u<A.length;u++){let[p,S]=A[u],[C,y]=A[(u+1)%A.length],M=C-p,E=y-S,R=p+g.x-s,v=S+g.y-r,w=l*E-c*M;if(Math.abs(w)>1e-8){let P=(R*E-v*M)/w,D=(R*c-v*l)/w;P>0&&P<1&&D>=-1e-6&&D<=1+1e-6&&f.push(P)}else if(Math.abs(R*c-v*l)<.001)for(let[P,D]of[[R,v],[R+M,v+E]]){let N=(P*l+D*c)/(h*h);N>0&&N<1&&f.push(N)}}let d=[...new Set(f.map(g=>Number(g.toFixed(8))))].sort((g,A)=>g-A),m=[];for(let g=1;g<d.length;g++){let A=d[g-1],u=d[g],p=(A+u)/2;if((u-A)*h<.01||!xd(i,s+l*p,r+c*p,t)||!xd(e,s+l*p,r+c*p,t))continue;let S=m.at(-1);S&&Math.abs(S[1]-A)<1e-7?S[1]=u:m.push([A,u])}return m}function Rf(i,e,t){let n=e.hinge,s=n.b[0]-n.a[0],r=n.b[1]-n.a[1],a=Math.hypot(s,r),o=-r/a,l=s/a,c=(h,f,d)=>{if(xd(h,f,d))return[0,0];let m=1/0,g=[0,0];for(let A of _d(h))for(let u=0;u<A.length;u++){let[p,S]=A[u],[C,y]=A[(u+1)%A.length],M=C-p,E=y-S,R=Math.max(0,Math.min(1,((f-h.x-p)*M+(d-h.y-S)*E)/(M*M+E*E||1))),v=h.x+p+M*R,w=h.y+S+E*R,P=Math.hypot(v-f,w-d);if(P<m){m=P;let D=(v-f)*o+(w-d)*l;g=[o*D,l*D]}}return g};return t.map(h=>h.map(f=>{let d=n.a[0]+s*f,m=n.a[1]+r*f;return{parent:c(i,d,m),child:c(e,d,m)}}))}function vd(i,e=16){let t=new ln,n=new Float32Array(i.length*(e+1)*2*3),s=new Float32Array(i.length*(e+1)*2*2),r=[];for(let a=0;a<i.length;a++)for(let o=0;o<e;o++){let l=a*(e+1)*2+o*2;r.push(l,l+1,l+2,l+1,l+3,l+2)}return t.setAttribute("position",new fn(n,3)),t.setAttribute("uv",new fn(s,2)),t.setIndex(r),t}function yd(i,e,t,n,s,r,a,o){let l=e.hinge,c=l.b[0]-l.a[0],h=l.b[1]-l.a[1],f=Math.hypot(c,h),d=c/f,m=h/f,g=i.getAttribute("position"),A=i.getAttribute("uv"),u=g.count/(t.length*2)-1;for(let p=0;p<t.length;p++)for(let S=0;S<=u;S++)for(let C=0;C<2;C++){let y=S/u,M=t[p][C],E=n*y,R=Math.sin(E),v=Math.cos(E),w=Math.sin(n),P=Math.cos(n),D=p*(u+1)*2+S*2+C,N=o?.[p]?.[C],O=N?.parent||[0,0],L=N?.child||[0,0],U=(d*L[1]-m*L[0])*w;g.setXYZ(D,c*M+m*(s*R+a*y*w)+O[0]*(1-y)+L[0]*P*y,h*M-d*(s*R+a*y*w)+O[1]*(1-y)+L[1]*P*y,s*v+r*(1-y)+a*y*P+U*y),A.setXY(D,(l.a[0]+c*M-e.x)/e.w,1-(l.a[1]+h*M-e.y)/e.h)}g.needsUpdate=!0,A.needsUpdate=!0,i.computeVertexNormals(),i.computeBoundingSphere()}var Ey=(i,e,t)=>{let n=!1;for(let s=0,r=t.length-1;s<t.length;r=s++){let[a,o]=t[s],[l,c]=t[r];o>e!=c>e&&i<(l-a)*(e-o)/(c-o)+a&&(n=!n)}return n};function bd(i){return[i.points||[[0,0],[i.w,0],[i.w,i.h],[0,i.h]],...i.islands||[]].map(t=>{let n=new Ms;t.forEach(([s,r],a)=>a?n.lineTo(s,r):n.moveTo(s,r)),n.closePath();for(let s of i.holes||[]){if(!Ey(s[0][0],s[0][1],t))continue;let r=new bs;s.forEach(([a,o],l)=>l?r.lineTo(a,o):r.moveTo(a,o)),r.closePath(),n.holes.push(r)}return n})}function Pf(i,e,t){return new ha(bd(i),{depth:e,bevelEnabled:!t,bevelSize:Math.min(.25,e/3),bevelThickness:.12,bevelSegments:3,steps:1})}function wc(i,e,t){let n=Math.max(0,Math.min(1,(i-e)/(t-e)));return n*n*(3-2*n)}function Md(i,e,t){if(!i.hinge)return 0;let n=i.hinge.stage||0,s=i.hinge.end??1;if(e==="custom"){if(i.id==="upper-tuck")return(180-90*(1-wc(Math.min(t,.09),0,.24)))*(1-wc(t,.09,.34));i.id==="top"?[n,s]=[0,.34]:i.id==="tuck"?[n,s]=[.34,.48]:i.id.startsWith("tuck-wing")||i.id.startsWith("wing-")?[n,s]=[.48,.6]:i.id==="lock"?[n,s]=[0,.06]:i.id.startsWith("inner-lock")?[n,s]=[.55,.62]:i.id.startsWith("inner-")?[n,s]=[.6,.72]:i.id.startsWith("bridge-")?[n,s]=[.72,.8]:i.id==="left"||i.id==="right"?[n,s]=[.8,.9]:i.id==="front"?[n,s]=[.85,.95]:i.id==="back"?[n,s]=[.9,1]:i.id.startsWith("dust")&&([n,s]=[.93,1])}return e==="mailer"?i.id==="tuck"?[n,s]=[0,.16]:i.id==="top"?[n,s]=[.1,.58]:i.id.startsWith("wing")?[n,s]=[.32,.62]:i.id.startsWith("dust")?[n,s]=[.48,.7]:[n,s]=[.68,1]:e==="carton"?i.id.endsWith("tuck")?[n,s]=[0,.15]:i.id==="top"||i.id==="bottom"?[n,s]=[.12,.42]:!i.face&&i.id!=="glue"?[n,s]=[.3,.54]:[n,s]=[.55,1]:e==="lid-base"&&([n,s]=[.28,.72]),i.hinge.angle*(1-wc(t,n,s))}function If(i,e,t,n){if(e.id!=="upper-tuck"||!e.hinge)return 0;let s=i.pieces.find(l=>l.id===e.parent),r=i.pieces.find(l=>l.id==="carton-right");if(!s?.hinge||!r)return 0;let a=Math.abs(e.hinge.a[1]-s.hinge.a[1]),o=Math.max(0,a-r.w+(1-(e.inset??1))*t+.05);return o>Math.max(3,t*3)?0:Math.sign(s.hinge.a[1]-e.hinge.a[1])*o*(1-wc(n,.09,.34))}var ei=An(Fi(),1),Sd=class extends xc{setSize(e,t){super.setSize(e,t),this._holdRenderTarget?.setSize(e,t),this.accumulateIndex=-1}};function Df(i,e,t,n){let s=t*2.399963229728653,r=140*Math.sqrt((t+.5)/n);i.position.copy(e).add(new F(Math.cos(s)*r,Math.sin(s)*r,0))}function Ec(i,e,t,n){let s=new xr,r=(a,o=!1)=>{let l=s.load(`/tools/studio-runtime/packaging/scenes/materials/${i}/${i}_1K-JPG_${a}.jpg`,()=>n?.());return l.wrapS=l.wrapT=zn,l.repeat.set(e,t),o&&(l.colorSpace=sn),l};return{color:r("Color",!0),normal:r("NormalGL"),roughness:r("Roughness")}}var Ty=(0,en.forwardRef)(function(e,t){let n=(0,en.useRef)(null),s=(0,en.useRef)(null),r=(0,en.useRef)(e),[a,o]=(0,en.useState)(""),[l,c]=(0,en.useState)(0),[h,f]=(0,en.useState)("high"),[d,m]=(0,en.useState)(""),g=(0,en.useRef)(h);g.current=h,r.current=e;let A=u=>{let p=s.current;if(!p)return;let S=(p.radius||300)*Math.max(1,.8/p.camera.aspect),C={hero:[1,.9,1.2],front:[0,.25,1.6],top:[0,1.8,.001],left:[-1.6,.4,0],right:[1.6,.4,0]},y=[...C[u]||C.hero];p.destination=new F(...y.map(M=>M*S))};return(0,en.useImperativeHandle)(t,()=>({camera:A,focusFace(u){let p=s.current;p&&(p.focusRequest=u,p.destination=null)},reset(){let u=s.current;u&&(u.viewRotation.identity(),u.viewTurn=null,u.focusRequest=null),A("hero")},async exportImage(u,p){let S=s.current;if(!S)throw new Error("3D rendering is unavailable.");let{renderer:C,scene:y,camera:M}=S,E=new me;C.getSize(E);let R=y.background,v=S.floor.visible,w=S.pedestal.visible,P=S.contact.visible,D=C.getPixelRatio(),N=S.key.position.clone();S.exporting=!0;try{if(y.background=u?null:R,S.floor.visible=!u&&v,S.contact.visible=!u&&v,S.pedestal.visible=!u&&w,C.setPixelRatio(1),C.setSize(3840,2880,!1),S.composer.setPixelRatio(1),S.composer.setSize(3840,2880),M.aspect=4/3,M.updateProjectionMatrix(),S.renderPass.enabled=g.current!=="high",S.refinedPass.enabled=!S.renderPass.enabled,S.refinedPass.accumulate=!1,S.refinedPass.sampleLevel=3,u)C.render(y,M);else if(g.current==="high"){S.refinedPass.accumulate=!0,S.refinedPass.accumulateIndex=-1,S.refinedPass.sampleLevel=1;for(let L=0;L<16;L++)Df(S.key,N,L,16),S.composer.render()}else S.composer.render();return S.refinedPass.sampleLevel=0,await new Promise((L,U)=>C.domElement.toBlob(G=>G?L(G):U(new Error("Could not render scene.")),p==="png"?"image/png":"image/jpeg",.96))}finally{y.background=R,S.key.position.copy(N),S.floor.visible=v,S.contact.visible=P,S.pedestal.visible=w,C.setPixelRatio(D),C.setSize(E.x,E.y,!1),S.composer.setPixelRatio(C.getPixelRatio()),S.composer.setSize(E.x,E.y),M.aspect=E.x/E.y,M.updateProjectionMatrix(),S.refinedPass.sampleLevel=0,S.exporting=!1}}})),(0,en.useEffect)(()=>{let u=n.current;if(!u)return;let p;try{p=new oc({antialias:!0,alpha:!0,preserveDrawingBuffer:!0,powerPreference:"high-performance"})}catch{o("3D is unavailable on this device. Your dieline and artwork remain editable.");return}p.setPixelRatio(Math.min(Math.max(window.devicePixelRatio,1.5),2)),p.shadowMap.enabled=!0,p.shadowMap.type=ts,p.outputColorSpace=sn,p.toneMapping=Ts,p.toneMappingExposure=.9,u.appendChild(p.domElement);let S=new _s,C=new on(34,1,5,1e4);C.position.set(480,440,560);let y=new dc(C,p.domElement);y.enableDamping=!0,y.dampingFactor=.09,y.minDistance=60,y.maxDistance=12e3,y.maxPolarAngle=Math.PI*.83,y.enablePan=!0;let M=new Ar(p),E=new uc,R=M.fromScene(E,.04);S.environment=R.texture,S.environmentIntensity=.45,E.dispose();let v=new xa(16777215,6641222,2);S.add(v);let w=new ws(16777215,4);w.castShadow=!0,w.shadow.mapSize.set(2048,2048),w.shadow.radius=12,w.shadow.blurSamples=16,w.shadow.camera.near=1,w.shadow.camera.far=3e3,w.shadow.camera.left=w.shadow.camera.bottom=-650,w.shadow.camera.right=w.shadow.camera.top=650,w.shadow.normalBias=.12,w.shadow.bias=-2e-4,S.add(w);let P=new ws(15332607,.3);P.position.set(-350,240,-300),S.add(P);let D=new ws(16777215,0);D.position.set(0,-800,0),S.add(D);let N=new mt(new ji(1e4,1e4),new Hn({color:"#dddcd5",roughness:.9}));N.rotation.x=-Math.PI/2,N.receiveShadow=!0,S.add(N);let O=document.createElement("canvas");O.width=O.height=256;let L=O.getContext("2d"),U=L.createRadialGradient(128,128,25,128,128,128);U.addColorStop(0,"rgba(28,23,17,.38)"),U.addColorStop(.55,"rgba(28,23,17,.20)"),U.addColorStop(1,"rgba(28,23,17,0)"),L.fillStyle=U,L.fillRect(0,0,256,256);let G=new pr(O),Y=new mt(new ji(1,1),new ys({map:G,transparent:!0,depthWrite:!1,opacity:.8}));Y.rotation.x=-Math.PI/2,S.add(Y);let re=new mt(new na(220,240,50,64),new Hn({color:"#e2e2dc",roughness:.65}));re.receiveShadow=!0,S.add(re);let W=new $n;W.scale.y=-1,S.add(W);let Z=new mc(p),ie=new _c(S,C),xe=new Sd(S,C);xe.enabled=!1,xe.sampleLevel=0;let be=new $a(S,C,512,512);be.updateGtaoMaterial({radius:12,thickness:2,distanceExponent:1.5,distanceFallOff:1,scale:1,samples:8,screenSpaceRadius:!1}),be.blendIntensity=.5;let pe=new bc;Z.addPass(ie),Z.addPass(xe),Z.addPass(be),Z.addPass(pe);let K={renderer:p,composer:Z,occlusion:be,renderPass:ie,refinedPass:xe,exporting:!1,detail:{value:0},qualityRevision:0,lastRenderSignature:"",lastQuality:"interactive",scene:S,camera:C,controls:y,key:w,ambient:v,floor:N,contact:Y,pedestal:re,container:W,groups:new Map,pieces:[],creases:[],current:0,inside:e.inside,autoFrame:!1,target:0,radius:300,rootRotation:Math.PI/2,viewRotation:new mn,viewTurn:null,focusRequest:null,destination:null,textureGeneration:0,flatInspection:{value:0},artworkTextures:new Map,disposeTextures:[],backgroundTexture:null,renderStatus:"",paperMaps:null,surfaceMaps:null,lidMotion:null};s.current=K,y.addEventListener("start",()=>{K.autoFrame=!1,K.destination=null,K.viewTurn=null,K.focusRequest=null}),new Sc().load("/tools/studio-runtime/packaging/scenes/studio-small-09.bin",ve=>{if(s.current!==K){ve.dispose();return}ve.mapping=br;let Pe=M.fromEquirectangular(ve);S.environment=Pe.texture,K.qualityRevision++,K.disposeTextures.push(Pe.texture),ve.dispose()},void 0,()=>{});let Je=new Ma,J=new me,se=null,ce=ve=>{se=[ve.clientX,ve.clientY]},Ye=ve=>{if(!se||Math.hypot(ve.clientX-se[0],ve.clientY-se[1])>5)return;let Pe=p.domElement.getBoundingClientRect();J.set((ve.clientX-Pe.left)/Pe.width*2-1,-(ve.clientY-Pe.top)/Pe.height*2+1),Je.setFromCamera(J,C);let Be=Je.intersectObjects(W.children,!0).find(k=>k.object.userData.face);Be&&r.current.onSelect(Be.object.userData.face,!!Be.object.userData.inside)};p.domElement.addEventListener("pointerdown",ce),p.domElement.addEventListener("pointerup",Ye);let Le=()=>{let ve=u.getBoundingClientRect();p.setSize(Math.max(100,ve.width),Math.max(100,ve.height)),Z.setSize(Math.max(100,ve.width),Math.max(100,ve.height)),C.aspect=Math.max(.1,ve.width/Math.max(1,ve.height)),C.updateProjectionMatrix(),K.autoFrame=!0},Qe=new ResizeObserver(Le);Qe.observe(u),Le();let ct=0,ae=performance.now(),de=0,_e=ae,Me=window.matchMedia("(prefers-reduced-motion: reduce)").matches,Ae=ve=>{if(ct=requestAnimationFrame(Ae),K.exporting)return;let Pe=Math.min(.05,(ve-ae)/1e3);ae=ve;let Be=r.current.unfold/100,k=Math.abs(Be-K.current)>.001?"true":"false";n.current?.getAttribute("aria-busy")!==k&&n.current?.setAttribute("aria-busy",k),(Be!==K.target||K.inside!==r.current.inside)&&(K.autoFrame=!0),K.inside=r.current.inside,K.target=Be,K.current=Me?K.target:kn.damp(K.current,K.target,9,Pe);let ht=H=>-(H.id.startsWith("tuck-wing")?1.7:H.inset??(r.current.project.imported?.profileId&&H.id==="tuck"?-1.1:H.face?0:1))*r.current.project.thickness*(1-kn.smoothstep(K.current,.75,1));for(let H of K.pieces){let ee=K.groups.get(H.id);if(!ee||!H.hinge)continue;ee.children.forEach(Ie=>{Ie instanceof mt&&!Ie.userData.crease&&(Ie.position.z=ht(H))});let fe=H.hinge;ee.quaternion.setFromAxisAngle(new F(fe.b[0]-fe.a[0],fe.b[1]-fe.a[1],0).normalize(),kn.degToRad(Md(H,r.current.project.structure,K.current)))}for(let H of K.pieces){let ee=K.groups.get(H.id);ee?.userData.flatPosition&&(ee.position.copy(ee.userData.flatPosition),ee.position.y+=If(K,H,r.current.project.thickness,K.current))}for(let H of K.creases){let ee=kn.degToRad(Md(H.piece,r.current.project.structure,K.current)),fe=r.current.project.thickness/2+.025;H.outer.visible=H.inner.visible=Math.abs(ee)>1e-4,H.outer.visible&&(yd(H.outer.geometry,H.piece,H.spans,ee,fe,ht(H.parent),ht(H.piece),H.contacts),yd(H.inner.geometry,H.piece,H.spans,ee,-fe,ht(H.parent),ht(H.piece),H.contacts))}if(K.lidMotion){let{root:H,flat:ee,target:fe}=K.lidMotion,Ie=kn.smoothstep(K.current,.4,1),Se=Math.PI*(1-kn.smoothstep(K.current,.65,1)),Ee=fe.clone();Ee.z-=r.current.project.height*1.5*Math.sin(Math.PI*K.current),H.rotation.x=Se,H.position.copy(ee.clone().lerp(Ee,1-Ie).sub(ee.clone().applyAxisAngle(new F(1,0,0),Se)))}if(K.viewTurn){let H=window.matchMedia("(prefers-reduced-motion: reduce)").matches?1:Math.min(1,(ve-K.viewTurn.start)/1800);K.viewRotation.slerpQuaternions(K.viewTurn.from,K.viewTurn.to,H*H*(3-2*H)),H===1&&(K.viewTurn=null)}if(W.rotation.set(K.rootRotation,0,r.current.project.scene.pose==="standing"?Math.PI/2:0),W.quaternion.premultiply(K.viewRotation),W.updateMatrixWorld(!0),K.focusRequest){let H;if(W.traverse(ee=>{ee.userData.face===K.focusRequest&&!ee.userData.inside&&(H=ee)}),H){let ee=new F(0,0,r.current.inside?-1:1).transformDirection(H.matrixWorld),fe=C.position.clone().sub(y.target).normalize(),Ie=new mn().setFromUnitVectors(ee,fe);K.viewTurn={from:K.viewRotation.clone(),to:Ie.multiply(K.viewRotation).normalize(),start:ve}}K.focusRequest=null}let he=new Vn().setFromObject(W),I=he.getCenter(new F);if(Number.isFinite(I.x)){let H=r.current.project.scene.stage==="pedestal"?50:0;W.position.y+=H-he.min.y+.5,W.position.x-=I.x,W.position.z-=I.z,Y.position.set(0,H+.2,0),Y.scale.set((he.max.x-he.min.x)*1.35,(he.max.z-he.min.z)*1.5,1)}let b=K.current>.9&&!r.current.inside;if(K.flatInspection&&(K.flatInspection.value=b?kn.smoothstep(K.current,.9,1):0),y.maxPolarAngle=b?Math.PI-.01:Math.PI*.83,D.intensity=b?r.current.project.scene.light*1.8:0,N.visible=!b,Y.visible=!b,re.visible=!b&&r.current.project.scene.stage==="pedestal",K.autoFrame){let H=he.getBoundingSphere(new di).radius,ee=kn.degToRad(C.fov/2),fe=H/Math.sin(Math.atan(Math.tan(ee)*Math.min(1,C.aspect)))*1.08,Ie=C.position.clone().sub(y.target).normalize();!b&&Ie.y<.15&&Ie.set(1,.9,1.2).normalize(),b&&Ie.lerp(new F(0,0,1).applyAxisAngle(new F(1,0,0),K.rootRotation).normalize(),kn.smoothstep(K.current,.9,1)).normalize(),K.destination=y.target.clone().addScaledVector(Ie,fe),Math.abs(K.current-K.target)<.001&&(K.autoFrame=!1)}y.target.lerp(new F(0,Math.max(20,(he.max.y+he.min.y)/2),0),.06),K.destination&&(C.position.lerp(K.destination,.08),C.position.distanceTo(K.destination)<.5&&(K.destination=null)),y.update(),be.enabled=!b;let V=g.current==="high";if(K.lastQuality!==g.current){K.lastQuality=g.current,K.detail.value=V?1:0,K.qualityRevision++,W.traverse(ee=>{if(ee instanceof mt){let fe=ee.material;fe.normalMap&&fe.normalScale.setScalar(V?r.current.project.material==="kraft"?.3:.16:.12)}});let H=Math.min(V?4096:2048,p.capabilities.maxTextureSize);w.shadow.mapSize.set(H,H),w.shadow.map?.dispose(),w.shadow.map=null,w.shadow.mapPass?.dispose(),w.shadow.mapPass=null,w.shadow.needsUpdate=!0,w.shadow.blurSamples=V?32:16,be.updateGtaoMaterial({samples:V?16:8})}let j=[...C.position.toArray(),...C.quaternion.toArray(),...W.quaternion.toArray(),K.current,K.qualityRevision,C.aspect].map(H=>Number(H).toFixed(5)).join(","),ne=j!==K.lastRenderSignature||!!K.destination||!!K.viewTurn||Math.abs(K.current-K.target)>1e-4;K.lastRenderSignature=j,ie.enabled=!V,xe.enabled=V,xe.accumulate=V&&!ne,xe.sampleLevel=0;let ye=w.position.clone();V&&!ne&&xe.accumulateIndex<32&&Df(w,ye,Math.max(0,xe.accumulateIndex),32),Z.render(),w.position.copy(ye);let Te=V?ne?"High render \xB7 moving":xe.accumulateIndex<32?"High render \xB7 refining\u2026":"High render \xB7 ready":"";if(Te!==K.renderStatus&&(K.renderStatus=Te,m(Te)),de++,ve-_e>2e3){let H=Math.round(de*1e3/(ve-_e));c(H);let fe=(Math.abs(K.current-K.target)>.002||!!K.destination)&&H<30?1:Math.min(Math.max(window.devicePixelRatio,1.5),2);p.getPixelRatio()!==fe&&(p.setPixelRatio(fe),Z.setPixelRatio(fe)),de=0,_e=ve}};ct=requestAnimationFrame(Ae);let je=ve=>{ve.preventDefault(),o("3D rendering paused. Reopen the studio to restore the scene.")};return p.domElement.addEventListener("webglcontextlost",je),()=>{cancelAnimationFrame(ct),Qe.disconnect(),y.dispose(),s.current=null,W.traverse(ve=>{ve instanceof mt&&(ve.geometry.dispose(),(Array.isArray(ve.material)?ve.material:[ve.material]).forEach(Be=>Be.dispose()))}),K.disposeTextures.forEach(ve=>ve.dispose()),K.artworkTextures.forEach(({texture:ve})=>ve.dispose()),[K.paperMaps,K.surfaceMaps].forEach(ve=>ve&&Object.values(ve).forEach(Pe=>Pe.dispose())),K.backgroundTexture?.dispose(),R.texture.dispose(),M.dispose(),Y.geometry.dispose(),Y.material.dispose(),G.dispose(),N.geometry.dispose(),N.material.dispose(),re.geometry.dispose(),re.material.dispose(),Z.dispose(),be.dispose(),pe.dispose(),ie.dispose(),xe.dispose(),p.dispose(),p.domElement.remove()}},[]),(0,en.useEffect)(()=>{let u=s.current;if(!u)return;let p=e.project,S=Us(p);u.creases=[],u.qualityRevision++,u.container.children.slice().forEach(M=>{u.container.remove(M),M.traverse(E=>{E instanceof mt&&(E.geometry.dispose(),(Array.isArray(E.material)?E.material:[E.material]).forEach(R=>R.dispose()))})}),u.paperMaps&&Object.values(u.paperMaps).forEach(M=>M.dispose()),u.paperMaps=Ec(p.material==="kraft"?"Paper006":"Paper001",2,2,()=>u.qualityRevision++),u.groups.clear(),u.pieces=S.pieces,u.rootRotation=p.structure==="carton"||S.rootPlane==="front"?0:Math.PI/2;let C=new Map,y=[...new Set(S.pieces.map(M=>M.component))];for(let M of y){let E=new $n;C.set(M,E),u.container.add(E)}for(let M of S.pieces){let E=M.hinge?.a||[M.x+M.w/2,M.y+M.h/2],R=S.pieces.find(pe=>pe.id===M.parent),v=R?.hinge?.a||(R?[R.x+R.w/2,R.y+R.h/2]:[S.width/2,S.height/2]),w=new $n;w.position.set(E[0]-v[0],E[1]-v[1],0),w.userData.flatPosition=w.position.clone(),u.groups.set(M.id,w),(M.parent&&u.groups.get(M.parent)||C.get(M.component)).add(w);let P=bd(M),D=Pf(M,p.thickness,p.structure==="custom");D.translate(M.x-E[0],M.y-E[1],-p.thickness/2);let N=new Hn({fog:!1,color:p.material==="kraft"?"#b68e60":"#d0b592",roughness:.92}),O=new mt(D,N);O.castShadow=!0,O.receiveShadow=!1,w.add(O);let L=new da(P),U=L.attributes.uv,G=L.attributes.position;for(let pe=0;pe<U.count;pe++)U.setXY(pe,G.getX(pe)/M.w,1-G.getY(pe)/M.h);L.translate(M.x-E[0],M.y-E[1],p.thickness/2+.025);let Y=M.face?p.panels[M.face]:null,re=new ua({fog:!1,color:Y?.color||(p.material==="kraft"?"#b78b56":"#f4f1e9"),roughness:p.finish==="glossy"?.24:p.material==="kraft"?.94:.86,metalness:0,clearcoat:p.finish==="glossy"?.8:0,clearcoatRoughness:.12,side:fi,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1,normalMap:u.paperMaps.normal,normalScale:new me(.12,.12),roughnessMap:u.paperMaps.roughness});re.onBeforeCompile=pe=>{pe.uniforms.paperAlbedo={value:u.paperMaps.color},pe.uniforms.renderDetail=u.detail,pe.uniforms.paperMean={value:p.material==="kraft"?.32:.65},pe.uniforms.paperPhysicalSize={value:new me(M.w/160,M.h/160)},pe.uniforms.flatInspection=u.flatInspection||(u.flatInspection={value:0}),pe.fragmentShader=`uniform sampler2D paperAlbedo; uniform float flatInspection; uniform float renderDetail; uniform float paperMean; uniform vec2 paperPhysicalSize;
`+pe.fragmentShader,pe.fragmentShader=pe.fragmentShader.replace("#include <map_fragment>",`
          #include <map_fragment>
          #ifdef USE_MAP
            float paperGrain = dot(texture2D(paperAlbedo, vMapUv * paperPhysicalSize).rgb, vec3(.2126, .7152, .0722));
            diffuseColor.rgb *= mix(mix(.94,1.04,paperGrain),clamp(paperGrain/paperMean,.65,1.32),renderDetail*.38);
          #endif
        `),pe.fragmentShader=pe.fragmentShader.replace("#include <opaque_fragment>",`outgoingLight = mix(outgoingLight, diffuseColor.rgb, flatInspection);
#include <opaque_fragment>`)},re.customProgramCacheKey=()=>"studio-paper-grain-render-quality-v4";let W=new mt(L,re);W.userData.face=M.face,W.userData.panelId=M.id,W.receiveShadow=!0,W.castShadow=!1,w.add(W);let Z=L.clone();Z.translate(0,0,-p.thickness-.05);let ie=new mt(Z,new Hn({fog:!1,color:Y?.insideColor||(p.material==="kraft"?"#b78b56":"#e5d6be"),roughness:.95,normalMap:u.paperMaps.normal,normalScale:new me(.18,.18),roughnessMap:u.paperMaps.roughness,side:Zt,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));ie.receiveShadow=!0,ie.userData.face=M.face,ie.userData.inside=!0,w.add(ie);let xe=S.pieces.find(pe=>pe.id===M.parent),be=M.parent?u.groups.get(M.parent):null;if(xe&&be&&M.hinge){let pe=Cf(xe,M,Math.min(1.25,p.thickness+.05));if(pe.length){let K=re.clone();K.side=Nn,K.onBeforeCompile=re.onBeforeCompile,K.customProgramCacheKey=re.customProgramCacheKey;let Je=ie.material.clone();Je.side=Nn;let J=new mt(vd(pe),K),se=new mt(vd(pe),Je);for(let ce of[J,se])ce.position.copy(w.position),ce.userData={face:M.face,panelId:M.id,crease:!0,inside:ce===se},ce.receiveShadow=!0,ce.castShadow=!0,be.add(ce);u.creases.push({piece:M,parent:xe,spans:pe,contacts:Rf(xe,M,pe),outer:J,inner:se})}}}if(u.lidMotion=null,p.structure==="lid-base"){let M=C.get("lid"),E=S.pieces.find(v=>v.component==="lid"&&!v.parent),R=S.pieces.find(v=>v.component==="base"&&!v.parent);u.lidMotion={root:M,flat:new F(E.x+E.w/2-S.width/2,E.y+E.h/2-S.height/2,0),target:new F(R.x+R.w/2-S.width/2,R.y+R.h/2-S.height/2,-p.height)}}u.radius=Math.max(p.width,p.depth,p.height,S.width*.38)*1.4,A("hero"),u.autoFrame=!0},[e.project.structure,e.project.width,e.project.depth,e.project.height,e.project.thickness,e.project.material,e.project.finish,e.project.imported]),(0,en.useEffect)(()=>{let u=s.current;if(!u)return;let p=++u.textureGeneration,S=new Set,C=(M,E,R)=>{u.container.traverse(v=>{if(v instanceof mt&&v.userData.face===M&&!!v.userData.inside===E){let w=v.material;w.map=R,w.color.set("#ffffff"),w.needsUpdate=!0,u.qualityRevision++}})},y=Object.values(e.project.panels).flatMap(M=>[!1,!0].map(async E=>{let R=`${M.id}:${E?"inside":"outside"}`;S.add(R);let v=JSON.stringify([M.width,M.height,E?M.insideColor:M.color,E?M.insideObjects:M.objects]),w=u.artworkTextures.get(R);if(w?.signature===v){C(M.id,E,w.texture);return}let P=await Os(M,E,Math.min(6,1800/Math.max(M.width,M.height)));try{if(p!==u.textureGeneration||s.current!==u)return;let D=document.createElement("canvas");D.width=P.canvas.width,D.height=P.canvas.height,D.getContext("2d").drawImage(P.canvas,0,0);let N=new pr(D);N.colorSpace=sn,N.anisotropy=u.renderer.capabilities.getMaxAnisotropy(),C(M.id,E,N),u.artworkTextures.set(R,{signature:v,texture:N}),w?.texture.dispose()}finally{await P.dispose()}}));for(let[M,E]of u.artworkTextures)S.has(M)||(E.texture.dispose(),u.artworkTextures.delete(M));Promise.all(y).catch(()=>{p===u.textureGeneration&&s.current===u&&o("Some artwork could not load in 3D. Replace the missing item from Uploads.")})},[e.project.panels,e.project.structure,e.project.width,e.project.depth,e.project.height,e.project.thickness,e.project.material,e.project.finish,e.project.imported]),(0,en.useEffect)(()=>{let u=s.current;if(!u)return;let p=e.project.scene;u.qualityRevision++,u.scene.background=new st(p.background),u.scene.fog=new $r(p.background,1800,6500),u.surfaceMaps&&Object.values(u.surfaceMaps).forEach(M=>M.dispose()),u.surfaceMaps=p.surface==="wood"?Ec("Wood095",1e4/650,1e4/325,()=>u.qualityRevision++):p.surface==="stone"?Ec("Marble012",1e4/700,1e4/700,()=>u.qualityRevision++):p.surface==="concrete"?Ec("Concrete034",1e4/900,1e4/450,()=>u.qualityRevision++):null;let S=u.floor.material;S.map=u.surfaceMaps?.color||null,S.normalMap=u.surfaceMaps?.normal||null,S.normalScale.set(p.surface==="stone"?.12:.45,p.surface==="stone"?.12:.45),S.roughness=p.surface==="stone"?.38:p.surface==="wood"?.68:.92,u.surfaceMaps&&Object.values(u.surfaceMaps).forEach(M=>M.anisotropy=u.renderer.capabilities.getMaxAnisotropy()),S.roughnessMap=u.surfaceMaps?.roughness||null,S.color.set(p.surface==="wood"&&p.preset==="walnut-table"?"#86604a":u.surfaceMaps?"#ffffff":p.background);let C=u.pedestal.material;C.map=u.surfaceMaps?.color||null,C.normalMap=u.surfaceMaps?.normal||null,C.roughnessMap=u.surfaceMaps?.roughness||null,C.color.set(p.preset==="gallery-plinth"?"#5b6064":"#ededeb"),C.needsUpdate=!0,S.envMapIntensity=.4,S.onBeforeCompile=M=>{M.fragmentShader=M.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor=max(roughnessFactor,.55);`)},S.customProgramCacheKey=()=>"studio-honed-surface-v1",S.needsUpdate=!0,u.pedestal.visible=p.stage==="pedestal",u.pedestal.position.y=25,u.pedestal.scale.set(e.project.width/285,1,e.project.width/285);let y=p.direction*Math.PI/180;u.key.position.set(Math.cos(y)*650,650,Math.sin(y)*650),u.key.intensity=p.light*3.1,u.ambient.intensity=p.light*.32,u.backgroundTexture?.dispose(),u.backgroundTexture=null,p.backgroundImage&&new xr().load(p.backgroundImage,M=>{s.current===u&&(M.colorSpace=sn,u.backgroundTexture=M,u.scene.background=M,u.qualityRevision++)})},[e.project.scene]),(0,ei.jsxs)("div",{className:`pk-scene ${e.large?"large":""}`,ref:n,"aria-label":"Interactive realistic packaging mockup",children:[a&&(0,ei.jsx)("div",{className:"pk-scene-error",children:a}),(0,ei.jsxs)("div",{className:"pk-scene-caption",children:[(0,ei.jsx)("span",{children:a?"2D artwork available":"Drag to orbit \xB7 scroll to zoom \xB7 click a face"}),(0,ei.jsxs)("label",{className:"pk-render-quality",children:[(0,ei.jsx)("span",{className:"pk-render-status",role:"status",children:h==="high"?d:l>0?`${l} fps`:""}),(0,ei.jsxs)("select",{"aria-label":"3D render quality",value:h,onChange:u=>f(u.target.value),children:[(0,ei.jsx)("option",{value:"interactive",children:"Interactive"}),(0,ei.jsx)("option",{value:"high",children:"High render"})]})]})]})]})}),Lf=Ty;var _=An(Fi(),1),Nf=[{id:"structure",label:"Structure",Icon:hs},{id:"templates",label:"Templates",Icon:zd},{id:"elements",label:"Elements",Icon:Nc},{id:"patterns",label:"Patterns",Icon:Ic},{id:"text",label:"Text",Icon:kc},{id:"colours",label:"Colours",Icon:Xd},{id:"uploads",label:"Uploads",Icon:Ui},{id:"layers",label:"Layers",Icon:Bd}];function vn({label:i,value:e,min:t=-1e4,max:n=1e4,step:s=.1,onChange:r,disabled:a=!1}){let[o,l]=(0,Oe.useState)(String(Math.round(e*100)/100));return(0,Oe.useEffect)(()=>l(String(Math.round(e*100)/100)),[e]),(0,_.jsxs)("label",{className:"pk-field",children:[(0,_.jsx)("span",{children:i}),(0,_.jsx)("input",{"aria-label":i,type:"number",min:t,max:n,step:s,disabled:a,value:o,onChange:c=>{l(c.target.value),c.target.value.trim()&&Number.isFinite(+c.target.value)&&+c.target.value>=t&&+c.target.value<=n&&r(+c.target.value)},onBlur:()=>l(String(Math.round(e*100)/100))})]})}function jt({label:i,children:e,onClick:t,disabled:n=!1,active:s=!1}){return(0,_.jsx)("button",{className:`pk-icon ${s?"active":""}`,"aria-label":i,title:i,onClick:t,disabled:n,children:e})}function Ay({project:i,selected:e,onSelect:t}){let[n,s]=(0,Oe.useState)({}),r=Us(i);return(0,Oe.useEffect)(()=>{let a=!1,o=[];return Promise.all(Object.values(i.panels).map(async l=>{let c=await Os(l,!1,2),h=c.canvas.toDataURL();return await c.dispose(),[l.id,h]})).then(l=>{a||s(Object.fromEntries(l))}),()=>{a=!0,o.forEach(URL.revokeObjectURL)}},[i.panels]),(0,_.jsxs)("div",{className:"pk-dieline-view",children:[(0,_.jsxs)("svg",{viewBox:`0 0 ${r.width} ${r.height}`,role:"img","aria-label":"Dimensioned interactive packaging dieline",children:[i.structure==="custom"&&!i.imported?.profileId&&i.imported?.preview&&(0,_.jsx)("image",{href:i.imported.preview,width:r.width,height:r.height,preserveAspectRatio:"none"}),r.pieces.map(a=>(0,_.jsxs)("g",{transform:`translate(${a.x} ${a.y})`,role:a.face?"button":void 0,tabIndex:a.face?0:void 0,"aria-label":a.face?`Design ${i.panels[a.face]?.name||a.face}`:void 0,onClick:()=>a.face&&t(a.face),onKeyDown:o=>o.key==="Enter"&&a.face&&t(a.face),children:[(0,_.jsx)("defs",{children:(0,_.jsx)("clipPath",{id:`net-${a.id}`,children:(0,_.jsx)("path",{d:Fc(a),clipRule:"evenodd",fillRule:"evenodd"})})}),(0,_.jsxs)("g",{clipPath:`url(#net-${a.id})`,children:[(0,_.jsx)("rect",{width:a.w,height:a.h,fill:a.face?i.panels[a.face]?.color:"#eee9df"}),a.face&&n[a.face]&&(0,_.jsx)("image",{href:n[a.face],width:a.w,height:a.h,preserveAspectRatio:"none"})]}),(0,_.jsx)("path",{d:Fc(a),fill:"none",stroke:e===a.face?"#27796b":r.sourcePaths?"none":"#c9687a",strokeWidth:e===a.face?1.4:.45}),a.face&&(0,_.jsx)("text",{x:a.w/2,y:a.h/2,textAnchor:"middle",fontSize:Math.min(9,a.w/10,a.h/7),fill:"#263d39",className:"pk-net-label",children:i.panels[a.face]?.name})]},a.id)),r.sourcePaths?.map((a,o)=>(0,_.jsx)("path",{d:ou(a),fill:"none",stroke:a.kind==="cut"?"#c9687a":"#378f83",strokeWidth:".45",strokeDasharray:a.kind==="fold"?"3 2":void 0,pointerEvents:"none"},`source-${o}`)),!r.sourcePaths&&r.pieces.filter(a=>a.hinge).map(a=>(0,_.jsx)("line",{x1:a.hinge.a[0],y1:a.hinge.a[1],x2:a.hinge.b[0],y2:a.hinge.b[1],stroke:"#378f83",strokeWidth:".6",strokeDasharray:"3 2"},a.id))]}),(0,_.jsxs)("div",{className:"pk-net-meta",children:[(0,_.jsxs)("span",{children:[(0,_.jsx)("i",{className:"cut"}),"Cut ",(0,_.jsx)("i",{className:"fold"}),"Fold"]}),(0,_.jsxs)("span",{children:[r.width.toFixed(1)," \xD7 ",r.height.toFixed(1)," mm \xB7 click a printed panel to design"]})]})]})}function wd({canEdit:i,onClose:e}){let[t,n]=(0,Oe.useState)(io),[s,r]=(0,Oe.useState)(null),[a,o]=(0,Oe.useState)("top"),[l,c]=(0,Oe.useState)(!1),[h,f]=(0,Oe.useState)("design"),[d,m]=(0,Oe.useState)("structure"),[g,A]=(0,Oe.useState)(!0),[u,p]=(0,Oe.useState)(""),[S,C]=(0,Oe.useState)("All"),[y,M]=(0,Oe.useState)(null),[E,R]=(0,Oe.useState)(null),[v,w]=(0,Oe.useState)(0),[P,D]=(0,Oe.useState)(!1),[N,O]=(0,Oe.useState)(!1),[L,U]=(0,Oe.useState)(!0),[G,Y]=(0,Oe.useState)(1),[re,W]=(0,Oe.useState)(0),[Z,ie]=(0,Oe.useState)(!1),[xe,be]=(0,Oe.useState)("Ready"),[pe,K]=(0,Oe.useState)(!1),[Je,J]=(0,Oe.useState)(null),[se,ce]=(0,Oe.useState)(""),[Ye,Le]=(0,Oe.useState)(!1),[Qe]=(0,Oe.useState)(()=>vu({onRetry:(x,X)=>J({label:`Connection interrupted \xB7 retrying ${x} (${X} of 3)`})})),[ct,ae]=(0,Oe.useState)([]),[de,_e]=(0,Oe.useState)([]),[Me,Ae]=(0,Oe.useState)([]),[je,ve]=(0,Oe.useState)([]),[Pe,Be]=(0,Oe.useState)(null),[k,ht]=(0,Oe.useState)(null),[he,I]=(0,Oe.useState)(null),[b,V]=(0,Oe.useState)("mailer"),[j,ne]=(0,Oe.useState)(1),[ye,Te]=(0,Oe.useState)(!1),[H,ee]=(0,Oe.useState)([285,125,74]),[fe,Ie]=(0,Oe.useState)([]),[Se,Ee]=(0,Oe.useState)(null),[Ve,$e]=(0,Oe.useState)({available:!1}),[et,z]=(0,Oe.useState)(null),[Re,le]=(0,Oe.useState)(38),[De,ke]=(0,Oe.useState)(!1),[ge,Ke]=(0,Oe.useState)("element"),we=(0,Oe.useRef)(null),gt=(0,Oe.useRef)(null),vt=(0,Oe.useRef)(v),cn=(0,Oe.useRef)(0),hn=(0,Oe.useRef)(null),Pr=(0,Oe.useRef)(null),Ka=(0,Oe.useRef)(null),Ds=(0,Oe.useRef)(null),Ls=(0,Oe.useRef)(null),Ja=(0,Oe.useRef)(null),Ir=(0,Oe.useRef)(null),yi=(0,Oe.useRef)(t),ti=(0,Oe.useRef)(s),rs=(0,Oe.useRef)(!1),as=(0,Oe.useRef)(""),Ns=(0,Oe.useRef)(null),ni=(0,Oe.useRef)(null),os=(0,Oe.useRef)("");yi.current=t,ti.current=s,vt.current=v,(0,Oe.useEffect)(()=>()=>{gt.current!==null&&cancelAnimationFrame(gt.current)},[]);function Li(){gt.current!==null&&cancelAnimationFrame(gt.current),gt.current=null,D(!1)}function Qa(){let x=gt.current!==null?cn.current===100?0:100:vt.current>=50?0:100;if(Li(),cn.current=x,window.matchMedia("(prefers-reduced-motion: reduce)").matches){w(x);return}let X=vt.current,Q=performance.now(),oe=Math.max(300,4e3*Math.abs(x-X)/100);D(!0);let ue=qe=>{let Ze=Math.min(1,(qe-Q)/oe),rt=Ze*Ze*(3-2*Ze);w(X+(x-X)*rt),Ze<1?gt.current=requestAnimationFrame(ue):(gt.current=null,D(!1))};gt.current=requestAnimationFrame(ue)}let Ce=i&&!pe,tt=t.panels[a]||Object.values(t.panels)[0],eo=l?tt?.insideObjects:tt?.objects,Tc=E&&tt?{...t,panels:{...t.panels,[tt.id]:{...tt,[l?"insideObjects":"objects"]:E}}}:t,Ni=()=>{ae(x=>[...x.slice(-59),yi.current]),_e([]),ie(!0)},Lt=x=>{Ce&&(Ni(),n(x),be("Unsaved changes"))},T=x=>Lt({...t,panels:{...t.panels,[tt.id]:{...tt,...x.color?{objects:tt.objects.filter(X=>X.name!=="Imported background")}:{},...x.insideColor?{insideObjects:tt.insideObjects.filter(X=>X.name!=="Imported background")}:{},...x}}}),B=(x,X=!1)=>{t.panels[x]&&(o(x),M(null),R(null),f("design"),X&&hn.current?.focusFace(x))},te=x=>{Ce&&(Ni(),n(X=>({...X,panels:{...X.panels,[tt.id]:{...X.panels[tt.id],[l?"insideObjects":"objects"]:x}}})),be("Unsaved changes"))};async function $(x,X){if(x.objects.length!==1||x.objects[0].name==="Imported background"||!/image/i.test(x.objects[0].type))return x;let Q=Math.min(5,2e3/Math.max(x.width,x.height)),oe=X?null:await Os(x,!1,Q),ue;try{ue=await uu(X||oe.canvas,Q)}finally{await oe?.dispose()}if(!ue)return x;if(!ue.pieces.length)return{...x,objects:x.objects.map(bt=>({...bt,name:"Imported background",locked:!0}))};let[qe,Ze]=await ro([at(ue.backdrop,"panel-background.png"),at(ue.foreground,"panel-elements.png")]),rt=(bt,wt,tn,Fn,ri,Xt,dn=!1)=>({type:"Image",version:"7.4.0",id:crypto.randomUUID(),name:wt,assetId:bt,src:bt,left:tn/Q,top:Fn/Q,width:ri,height:Xt,scaleX:1/Q,scaleY:1/Q,cropX:dn?0:tn,cropY:dn?0:Fn,originX:"left",originY:"top",crossOrigin:"anonymous",locked:dn}),Tt=[rt(qe,"Imported background",0,0,Math.round(x.width*Q),Math.round(x.height*Q),!0)];for(let[bt,wt]of ue.pieces.entries())Tt.push(rt(Ze,`Artwork ${bt+1}`,wt.x,wt.y,wt.width,wt.height));return{...x,objects:Tt}}async function q(x,X){let Q={...x.panels},oe=Object.values(Q);for(let ue=0;ue<oe.length;ue+=3){ce(`Preparing editable artwork \xB7 ${ue} of ${oe.length} panels`),J({label:"Separating printed elements and saving panel artwork",done:ue,total:oe.length}),await new Promise(Ze=>requestAnimationFrame(()=>Ze()));let qe=await ro(oe.slice(ue,ue+3).map(Ze=>{if(!X)return $(Ze);let rt=Ze.objects[0],Tt=Math.min(5,2e3/Math.max(Ze.width,Ze.height)),bt=document.createElement("canvas");bt.width=Math.max(1,Math.round(Ze.width*Tt)),bt.height=Math.max(1,Math.round(Ze.height*Tt));let wt=bt.getContext("2d");return wt.fillStyle=Ze.color,wt.fillRect(0,0,bt.width,bt.height),wt.drawImage(X,Number(rt.cropX||0),Number(rt.cropY||0),Number(rt.width),Number(rt.height),0,0,Number(rt.width)*Number(rt.scaleX)*Tt,Number(rt.height)*Number(rt.scaleY)*Tt),$(Ze,bt)}));for(let Ze of qe)Q[Ze.id]=Ze;J({label:"Separating printed elements and saving panel artwork",done:Math.min(ue+3,oe.length),total:oe.length})}return{...x,panels:Q}}async function Ue(){if(!Ce||pe||l)return;let x=t;K(!0);try{let X=await q(x),Q=Lr(X);if(!Q)throw new Error("The separated artwork exceeds project limits. Your original is unchanged.");if(yi.current!==x)throw new Error("The project changed while artwork was being separated. Your latest edits are preserved; try again.");let oe=Object.values(Q.panels).reduce((ue,qe)=>ue+qe.objects.filter(Ze=>Ze.name?.startsWith("Artwork ")).length,0);if(!oe)throw new Error("No separate marks were found against a solid background. The original artwork is preserved.");Lt(Q),M(null),R(null),f("design"),ce(`${oe} movable artwork pieces across the package. Click the printed artwork to drag or resize it. Backgrounds stay locked. Printed lettering remains artwork; Undo restores the original.`)}catch(X){ce(X instanceof Error?X.message:"Could not separate artwork. Your original is unchanged.")}finally{K(!1)}}async function He(x){if(!Ce||pe)return;let X=t;K(!0);try{let Q=X.imported?await q(X):X;if(yi.current!==X)throw new Error("The project changed while preparing its paper. Please retry the material change.");if(Object.values(Q.panels).some(ue=>ue.objects.some(qe=>qe.name==="Imported panel artwork")))throw new Error("Some artwork has a photographic or mixed background that could not be separated. Remove that image background before changing the material; the original artwork is preserved.");Lt(bu(Q,x)),ce("Material updated. Imported paper backgrounds were replaced; printed elements are preserved.")}catch(Q){ce(Q.message)}finally{K(!1),J(null)}}let Ne=()=>{!Ce||!ct.length||(_e(x=>[t,...x]),n(ct.at(-1)),ae(x=>x.slice(0,-1)),ie(!0),R(null))},Xe=()=>{!Ce||!de.length||(ae(x=>[...x,t]),n(de[0]),_e(x=>x.slice(1)),ie(!0))},We=(0,Oe.useCallback)(async(x=!1)=>{if(!i||rs.current)return;rs.current=!0,be("Saving\u2026");let X=yi.current,Q=ti.current;try{if(!Lr(X))throw new Error("Some artwork contains unsupported settings. Undo the last change and retry.");let oe=await an("/api/packaging",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:x?void 0:Q?.id,revision:x?void 0:Q?.revision,project:X})}),ue=await oe.json();if(!oe.ok)throw new Error(ue.error||"Could not save.");r(ue),yi.current===X&&ie(!1),be("Saved")}catch(oe){be("Save needs attention"),ce(oe.message)}finally{rs.current=!1}},[i]);(0,Oe.useEffect)(()=>{let x=!0,X=()=>an("/api/packaging/elements").then(oe=>oe.ok?oe.json():{items:[]}).then(oe=>x&&Ae(oe.items||[])).catch(()=>{});X(),window.addEventListener("focus",X);let Q=typeof BroadcastChannel<"u"?new BroadcastChannel("hisan-packaging-library"):null;return Q&&(Q.onmessage=X),an("/api/packaging/jobs").then(oe=>oe.json()).then(oe=>x&&$e(oe.processor||{available:!1})).catch(()=>{}),an("/api/auth/session").then(oe=>oe.json()).then(oe=>{let ue=oe.session?.username;if(ue){as.current="hisan-packaging-v2:"+String(ue);try{let qe=JSON.parse(localStorage.getItem(as.current)||"null"),Ze=Lr(qe?.project);Ze&&x&&z({project:Ze,record:qe.record||null})}catch{}}}),()=>{x=!1,window.removeEventListener("focus",X),Q?.close()}},[]),(0,Oe.useEffect)(()=>{if(Z&&(Ns.current&&clearTimeout(Ns.current),Ns.current=setTimeout(()=>{try{as.current&&localStorage.setItem(as.current,JSON.stringify({project:t,record:s}))}catch{}},700),s&&xe!=="Save needs attention")){let x=setTimeout(()=>{We()},2500);return()=>clearTimeout(x)}},[t,s,Z,xe,We]),(0,Oe.useEffect)(()=>{let x=X=>{Z&&(X.preventDefault(),X.returnValue="")};return window.addEventListener("beforeunload",x),()=>window.removeEventListener("beforeunload",x)},[Z]),(0,Oe.useEffect)(()=>{let x=X=>{let Q=X.target;["INPUT","TEXTAREA","SELECT"].includes(Q.tagName)||Q.isContentEditable||((X.ctrlKey||X.metaKey)&&X.key==="z"&&(X.preventDefault(),X.shiftKey?Xe():Ne()),(X.ctrlKey||X.metaKey)&&X.key==="s"&&(X.preventDefault(),We()))};return window.addEventListener("keydown",x),()=>window.removeEventListener("keydown",x)},[ct,de,t,We]);let dt=()=>{pe||Z&&!window.confirm("Your local draft is retained. Close Packaging Studio without saving to Projects?")||e()},at=Qe;async function Ge(x,X="artwork"){if(!(!x||!Ce)){K(!0),ce("");try{let Q=x;if(x.size>50*1024*1024)throw new Error("Choose a file under 50 MB.");if(X==="icc"){let rt=await at(x,x.name);Ni(),n(Tt=>({...Tt,print:{...Tt.print,iccAsset:rt,profileName:x.name}}));return}if(x.type==="application/pdf"&&(Q=(await zc(x)).preview),x.name.toLowerCase().endsWith(".svg")){let{sanitizeDielineSVG:rt}=await import("./packaging-import-4YJVFAUS.js");Q=new Blob([rt(await x.text())],{type:"image/svg+xml"})}let oe=await at(Q,x.name);if(X==="background"){Ni(),n(rt=>({...rt,scene:{...rt.scene,backgroundImage:oe}}));return}let ue=await an("/api/packaging/elements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:x.name.replace(/\.[^.]+$/,"").slice(0,100),src:oe,kind:X==="texture"||X==="pattern"?X:"element",mime:Q.type})}),qe=await ue.json();if(!ue.ok)throw new Error(qe.error||"Could not save the reusable element. Please try again.");let Ze=qe;if(Ae(rt=>[Ze,...rt.filter(Tt=>Tt.src!==oe)]),typeof BroadcastChannel<"u"){let rt=new BroadcastChannel("hisan-packaging-library");rt.postMessage("updated"),rt.close()}K(!1),await new Promise(requestAnimationFrame),De?(await we.current?.replace(oe),ke(!1)):await yt(Ze),ce(`\u201C${Ze.name}\u201D added to your design and saved for reuse.`),p(""),C("All"),m(X==="element"?"elements":X==="texture"||X==="pattern"?"patterns":"uploads")}catch(Q){ce(Q.message)}finally{K(!1)}}}async function yt(x){if(x.mime!=="image/svg+xml")return qt(x.src,x.name);let X=await an(x.src);if(!X.ok)throw new Error("This element could not be loaded.");let{sanitizeDielineSVG:Q}=await import("./packaging-import-4YJVFAUS.js"),oe=Q(await X.text()),ue=new DOMParser().parseFromString(oe,"image/svg+xml").documentElement,qe=ue.getAttribute("viewBox")?.split(/[ ,]+/).map(Number),Ze=qe?.[2]||Number.parseFloat(ue.getAttribute("width")||"100"),rt=qe?.[3]||Number.parseFloat(ue.getAttribute("height")||"100"),Tt=Math.min(55,tt.width*.4,tt.height*.4*Ze/rt),bt=Tt*rt/Ze;await we.current?.add({svg:oe,left:(tt.width-Tt)/2,top:(tt.height-bt)/2,width:Tt,height:bt,name:x.name,assetId:x.src})}let Ot=x=>{ke(!1),Ke(x),Ka.current?.click()},Rt=x=>Me.filter(X=>x.includes(X.kind||"element")&&(!u||X.name.toLowerCase().includes(u.toLowerCase()))).sort((X,Q)=>{let oe=["Fragile glass","Keep dry","This side up","Handle with care"],ue=qe=>oe.includes(qe.name)?oe.indexOf(qe.name):100;return ue(X)-ue(Q)}),At=x=>(0,_.jsx)("div",{className:"pk-card-grid uploads",children:x.map(X=>(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>{yt(X).catch(Q=>ce(Q.message))},children:[(0,_.jsx)("span",{children:(0,_.jsx)("img",{src:X.src,alt:X.name})}),(0,_.jsx)("strong",{children:X.name})]},X.src))});async function qt(x,X="Image"){if(!i)return;let Q=new window.Image;Q.src=x,await Q.decode();let oe=Math.min(tt.width*.55,tt.height*.55*Q.naturalWidth/Q.naturalHeight),ue=oe*Q.naturalHeight/Q.naturalWidth;await we.current?.add({type:"Image",version:"7.0.0",src:x,left:(tt.width-oe)/2,top:(tt.height-ue)/2,width:Q.naturalWidth,height:Q.naturalHeight,scaleX:oe/Q.naturalWidth,scaleY:ue/Q.naturalHeight,name:X,id:crypto.randomUUID(),crossOrigin:"anonymous",fit:"contain"})}async function ze(x,X=!1){if(Ce)if(X){let Q=x.svg.replace(/<svg[^>]*>/,"").replace("</svg>",""),oe=Math.max(15,Math.min(tt.width,tt.height)/3),ue="";for(let qe=0;qe<tt.width;qe+=oe)for(let Ze=0;Ze<tt.height;Ze+=oe)ue+=`<g transform="translate(${qe} ${Ze}) scale(${oe/x.width} ${oe/x.height})">${Q}</g>`;await we.current?.add({svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${tt.width}" height="${tt.height}" viewBox="0 0 ${tt.width} ${tt.height}">${ue}</svg>`,left:0,top:0,width:tt.width,height:tt.height,name:x.name,assetId:x.id})}else{let Q=Math.min(55,tt.width*.3),oe=Q*x.height/x.width;await we.current?.add({svg:x.svg,left:(tt.width-Q)/2,top:(tt.height-oe)/2,width:Q,height:oe,name:x.name,assetId:x.id})}}let Wt=(x="Your text",X=8,Q="PKMullerRegular")=>we.current?.add({type:"Textbox",text:x,left:tt.width*.1,top:tt.height*.15,width:tt.width*.7,fontSize:X,fontFamily:Q,lineHeight:1.2,fill:"#223c36",name:"Text",splitByGrapheme:!1}),xt=x=>we.current?.add({type:x,left:tt.width*.2,top:tt.height*.2,width:40,height:25,radius:x==="Circle"?15:void 0,fill:"#2e6d63",strokeWidth:0,name:x});async function Sn(){Be("projects"),K(!0);try{let x=await an("/api/packaging");if(!x.ok)throw new Error("Projects could not load.");ve((await x.json()).items||[])}catch(x){ce(x.message)}finally{K(!1)}}async function Un(x){if(!(Z&&!window.confirm("Open this project? Your current local draft is retained."))){K(!0);try{let X=await an("/api/packaging?id="+x),Q=await X.json(),oe=Bc(Q.project);if(!X.ok||!oe)throw new Error("This project could not be opened.");n(oe),r({...Q,project:oe}),o(oe.panels.top?"top":Object.keys(oe.panels)[0]),M(null),ae([]),_e([]),ie(!1),Be(null),be(Q.project.version===1?"Legacy project opened \xB7 save to upgrade":"Saved")}catch(X){ce(X.message)}finally{K(!1)}}}let ii=()=>{Z&&!window.confirm("Start a blank design? Your local draft is retained.")||(n(io()),r(null),o("top"),M(null),ie(!1),ae([]),_e([]),Be(null),be("New blank project"))};function ki(x,X=t){let Q={...X,panels:Object.fromEntries(Object.entries(X.panels).map(([tn,Fn])=>[tn,{...Fn,color:x.background,objects:Fn.objects.filter(ri=>ri.name==="Product image"||ri.name==="Product name"),insideObjects:Fn.insideObjects}]))},oe=Q.panels.top||Q.panels.front||Object.values(Q.panels)[0],ue=oe.width,qe=oe.height,Ze=co.indexOf(x),rt=Ze%6,Tt=(tn,Fn,ri,Xt,dn,to="PKMullerRegular")=>({type:"Textbox",id:crypto.randomUUID(),name:tn==="YOUR PRODUCT"?"Product name":"Template text",text:tn,left:Fn,top:ri,width:dn,fontSize:Xt,fontFamily:to,fill:x.ink,lineHeight:1.2,textAlign:rt===1?"center":"left"}),bt=oe.objects,wt=[];return bt.some(tn=>tn.name==="Product name")||wt.push(Tt("YOUR PRODUCT",ue*.1,qe*(rt===1?.4:.55),Math.min(11,ue/20),ue*.8)),wt.push(Tt("THOUGHTFULLY MADE",ue*.1,qe*.76,Math.min(3,ue/65),ue*.8)),wt.push(Tt(x.name.toUpperCase().split(" ").slice(0,2).join(" "),ue*.1,qe*.1,Math.min(5,ue/35),ue*.8,x.category==="Luxury"?"PKActaBook":"PKMullerMedium")),(rt===0||rt===3)&&wt.unshift({type:"Rect",id:crypto.randomUUID(),name:"Colour band",left:rt===3?ue*.7:0,top:0,width:rt===3?ue*.3:ue*.035,height:qe,fill:x.accent,strokeWidth:0}),(rt===2||rt===5)&&wt.unshift({type:"Rect",id:crypto.randomUUID(),name:"Frame",left:ue*.05,top:qe*.08,width:ue*.9,height:qe*.84,fill:"transparent",stroke:x.accent,strokeWidth:rt===5?.6:.25}),rt===4&&wt.unshift({type:"Circle",id:crypto.randomUUID(),name:"Graphic disc",left:ue*.65,top:-qe*.2,radius:qe*.55,fill:x.accent,opacity:.35}),oe.objects=[...wt,...bt],Q}function Et(){k&&(Lt(ki(k)),Be(null),f("design"),o(t.panels.top?"top":Object.keys(t.panels)[0]),M(null))}async function Pt(x,X=1){if(!(!x||!Ce)){K(!0),Be("import"),ce(""),ni.current=x,Le(!1),I(null),J({label:"Reading dieline and preparing preview"}),Te(!1);try{let Q=await zc(x,X);os.current&&URL.revokeObjectURL(os.current),os.current=URL.createObjectURL(Q.preview),I(Q),V("custom"),ee(Q.dimensions||[t.width,t.depth,t.height]),ne(Q.studioProfile?.scale||1),Te(!!Q.studioProfile),Ie(Q.panels.map((oe,ue)=>({id:oe.id,name:`Panel ${ue+1}`,parent:"",edge:"top",angle:90})))}catch(Q){let oe=x.name.split(".").pop()?.toLowerCase();if(["ai","eps","cdr","psd"].includes(oe||"")&&Ve.available)try{let ue=await at(x,x.name),qe=await an("/api/packaging/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operation:"convert",source:ue,filename:x.name})}),Ze=await qe.json();if(!qe.ok)throw new Error(Ze.error);Ee(Ze)}catch(ue){ce(ue.message)}else ce(Q.message)}finally{K(!1),J(null)}}}async function Wn(x=!1){if(!(!he||!ni.current||!ye)){if(!x&&b==="custom"&&!he.studioProfile){let X=so(he.panels.map(Q=>({id:Q.id,parent:fe.find(oe=>oe.id===Q.id)?.parent})));if(X){ce(X);return}}K(!0),ce(""),Le(!1),J({label:"Saving original dieline and preview"}),await new Promise(X=>requestAnimationFrame(()=>requestAnimationFrame(()=>X())));try{let[X,Q]=await ro([at(ni.current,ni.current.name),at(he.preview,"dieline-preview."+(he.preview.type.includes("svg")?"svg":"png"))]),oe=x?{...he,panels:[{id:"reference",x:0,y:0,width:he.width,height:he.height}]}:he,ue={...io(),name:he.name.replace(/\.[^.]+$/,""),width:H[0],depth:H[1],height:H[2],structure:b,material:he.studioProfile?.material||"colour",imported:{name:he.name,source:X,preview:Q,confirmed:!0,referenceOnly:x,profileId:x?void 0:he.studioProfile?.id,notes:he.notes,net:!x&&he.studioProfile?pu(he.studioProfile.net,j):gu(oe,j,x?[]:fe)}};if(b==="custom"&&!oe.panels.length)throw new Error("Trace at least one panel before creating a custom dieline.");if(ue=Fs(ue),b==="custom"){J({label:"Preparing package panels and artwork"});let Ze=new Image,rt=he.artworkPreview||he.preview,Tt=he.artworkPreview?await at(rt,"dieline-artwork.png"):Q,bt=URL.createObjectURL(rt);Ze.src=bt;try{await Ze.decode()}finally{URL.revokeObjectURL(bt)}let wt=Ze.naturalWidth/he.width,tn=Ze.naturalHeight/he.height,Fn=document.createElement("canvas");Fn.width=64,Fn.height=64;let ri=Fn.getContext("2d");for(let Xt of oe.panels){let dn=ue.panels[Xt.id];if(!dn)continue;dn.name=he.studioProfile?{bottom:"Base",top:"Lid",tuck:"Front closure"}[Xt.id]||Xt.id.replaceAll("-"," "):fe.find(Cc=>Cc.id===Xt.id)?.name||dn.name,ri.clearRect(0,0,64,64),ri.drawImage(Ze,Xt.x*wt,Xt.y*tn,Xt.width*wt,Xt.height*tn,0,0,64,64);let to=du(ri.getImageData(0,0,64,64).data,64,64,1)?.background;dn.color=to?"#"+to.map(Cc=>Cc.toString(16).padStart(2,"0")).join(""):ue.material==="kraft"?"#cba878":"#faf9f6",dn.insideColor=ue.material==="kraft"?"#b78b56":"#e6d4b7",dn.objects=[{type:"Image",version:"7.4.0",id:crypto.randomUUID(),name:"Imported panel artwork",assetId:Tt,src:Tt,originX:"left",originY:"top",left:0,top:0,width:Xt.width*wt,height:Xt.height*tn,cropX:Xt.x*wt,cropY:Xt.y*tn,scaleX:Math.min(j,dn.width/Xt.width,dn.height/Xt.height)/wt,scaleY:Math.min(j,dn.width/Xt.width,dn.height/Xt.height)/tn,crossOrigin:"anonymous",locked:!1}]}x||(ue=await q(ue,Ze))}let qe=Lr(ue);if(!qe)throw new Error("Check panel connections: every parent must exist and folds cannot form a cycle.");Ni(),n(qe),be("Unsaved changes"),Li(),w(0),c(!1),r(null),o(qe.panels.top?"top":Object.keys(qe.panels)[0]),f("design"),M(null),Be(null),ce(x||b==="custom"&&!he.studioProfile&&fe.filter(Ze=>Ze.parent).length<he.panels.length-1?"Imported as a 2D dieline. Connect every panel in Structure before using a custom mockup.":"Dieline confirmed. Printed elements on solid backgrounds are now separate movable layers. Click a panel, then drag the artwork. Printed text remains artwork; the original PDF is retained.")}catch(X){Le(!0),ce(X.message)}finally{K(!1),J(null)}}}async function _t(x){K(!0),ce("");try{let X=t.name.replace(/[^\w -]/g,"").trim()||"Packaging";if(x==="svg"&&Oi(new Blob([await Vc(t,l,!0)],{type:"image/svg+xml"}),X+".svg"),x==="pdf"&&Oi(await xu(t,l),X+"-dieline.pdf"),x==="eps"&&Oi(new Blob([yu(t)],{type:"application/postscript"}),X+"-dieline.eps"),x==="project"&&Oi(await _u(t),X+".package.zip"),x==="panel"){let Q=await Os(tt,l,Math.min(12,t.print.dpi/25.4)),oe=await import("./packaging-studio-export-CRZSADRR.js").then(ue=>ue.embedSVG(Q.svg(),!0));await Q.dispose(),Oi(new Blob([oe],{type:"image/svg+xml"}),X+"-"+tt.name+".svg")}if(x==="png"||x==="jpg"||x==="transparent"){let Q=await hn.current.exportImage(x==="transparent",x==="jpg"?"jpeg":"png");Oi(Q,X+"-mockup."+(x==="jpg"?"jpg":"png"))}if(x==="production"){let Q=Hc(t);if(Q.errors.length)throw new Error(Q.errors.join(" "));if(!Ve.available)throw new Error("The Studio prepress service is not connected. Screen proofs remain available; production PDF/X export is blocked.");let oe=await Vc(t,l,!0,!1),ue=await at(new Blob([oe],{type:"image/svg+xml"}),"production-artwork.svg"),qe=await an("/api/packaging/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operation:"prepress",source:ue,project:t,filename:X+".svg"})}),Ze=await qe.json();if(!qe.ok)throw new Error(Ze.error);Ee(Ze);return}Be(null)}catch(X){ce(X.message)}finally{K(!1)}}(0,Oe.useEffect)(()=>{if(!Se||!["queued","processing"].includes(Se.status))return;let x=!0,X=setInterval(async()=>{try{let Q=await an("/api/packaging/jobs?id="+Se.id),oe=await Q.json();if(!x)return;if(Ee(oe),oe.status==="completed")if(oe.operation==="convert"&&oe.result){let ue=await an(oe.result),qe=await ue.blob();await Pt(new File([qe],(oe.filename||"converted-dieline").replace(/\.[^.]+$/,qe.type==="image/png"?".png":".svg"),{type:qe.type}))}else oe.result&&Oi(await(await an(oe.result)).blob(),t.name+"-production.pdf");oe.status==="failed"&&ce(oe.error||"Processing failed.")}catch{ce("Processing connection interrupted. Retry from the job controls.")}},2e3);return()=>{x=!1,clearInterval(X)}},[Se?.id,Se?.status]);async function si(x){if(!(!x||!Ce)){K(!0);try{let X;if(x.name.endsWith(".zip")){let{unzipSync:oe,strFromU8:ue}=await import("./browser-GS27GFE6.js"),qe=oe(new Uint8Array(await x.arrayBuffer()));X=JSON.parse(ue(qe["project.json"]));let Ze=JSON.parse(ue(qe["assets.json"]||new Uint8Array([123,125]))),rt={};for(let[bt,wt]of Object.entries(Ze)){let tn=qe[wt];if(!tn)throw new Error("A portable project asset is missing.");rt[bt]=await at(new Blob([tn],{type:String(wt).endsWith(".svg")?"image/svg+xml":String(wt).endsWith(".jpg")?"image/jpeg":"image/png"}),String(wt))}let Tt=JSON.stringify(X);for(let[bt,wt]of Object.entries(rt))Tt=Tt.split(bt).join(wt);X=JSON.parse(Tt)}else X=JSON.parse(await x.text());let Q=Bc(X.project||X);if(!Q)throw new Error("This project is not supported. Your current design is unchanged.");Ni(),n(Q),r(null),o(Q.panels.top?"top":Object.keys(Q.panels)[0]),Be(null)}catch(X){ce(X.message)}finally{K(!1)}}}async function bi(){if(!(!t.imported||!Ce)){K(!0);try{let x=await an(t.imported.source);if(!x.ok)throw new Error("The original dieline could not load. Upload the original file again.");await Pt(new File([await x.blob()],t.imported.name)),ce("Review the original scale and folds. Applying this import replaces the current artwork layout; Undo restores it.")}catch(x){ce(x.message)}finally{K(!1)}}}let ls=he&&b==="custom"&&!he.studioProfile?so(he.panels.map(x=>({id:x.id,parent:fe.find(X=>X.id===x.id)?.parent}))):null,Ac=x=>x.filter(X=>(S==="All"||X.category===S)&&(!u||`${X.name} ${X.category||""}`.toLowerCase().includes(u.toLowerCase()))),Ed=d==="templates"?[...new Set(co.map(x=>x.category))]:d==="patterns"?[...new Set(lo.map(x=>x.category))]:d==="elements"?[...new Set(oo.map(x=>x.category))]:[],Cy=Hc(t),cs=t.structure!=="custom"||!!t.imported&&!t.imported.referenceOnly&&!so(t.imported.net.pieces)&&t.imported.net.pieces.every(x=>!x.parent||!!x.hinge);return(0,_.jsxs)(Xc,{label:"Packaging Studio",className:"pk-workspace",busy:pe,onClose:dt,children:[(0,_.jsxs)("header",{className:"pk-header",children:[(0,_.jsxs)("div",{className:"pk-brand",children:[(0,_.jsx)(hs,{}),(0,_.jsxs)("div",{children:[(0,_.jsx)("strong",{children:"Packaging Studio"}),(0,_.jsx)("span",{children:"HISAN ALI \xB7 BROWSER TOOLS"})]})]}),(0,_.jsx)("input",{className:"pk-project-name","aria-label":"Project name",value:t.name,disabled:!Ce,onChange:x=>Lt({...t,name:x.target.value})}),(0,_.jsxs)("div",{className:"pk-save-status",children:[(0,_.jsx)("span",{className:Z?"dirty":"saved"}),pe?"Working\u2026":xe]}),(0,_.jsxs)("div",{className:"pk-header-actions",children:[(0,_.jsxs)("button",{onClick:Sn,children:[(0,_.jsx)(Pc,{}),"Projects"]}),(0,_.jsxs)("button",{className:"pk-save",onClick:()=>{We()},disabled:!Ce,children:[(0,_.jsx)(Qd,{}),"Save"]}),(0,_.jsxs)("button",{className:"pk-primary",onClick:()=>Be("export"),disabled:pe,children:[(0,_.jsx)(ks,{}),"Export"]})]})]}),se&&(0,_.jsxs)("div",{className:"pk-notice",role:"status",children:[(0,_.jsx)(Ld,{}),(0,_.jsx)("span",{children:se}),(0,_.jsx)(jt,{label:"Dismiss message",onClick:()=>ce(""),children:(0,_.jsx)(Dr,{})})]}),et&&(0,_.jsxs)("div",{className:"pk-recover",children:[(0,_.jsx)("span",{children:"A recoverable draft is available."}),(0,_.jsx)("button",{onClick:()=>{n(et.project),r(et.record),o(et.project.panels.top?"top":Object.keys(et.project.panels)[0]),ie(!0),z(null)},children:"Restore draft"}),(0,_.jsx)("button",{onClick:()=>z(null),children:"Keep this design"})]}),(0,_.jsxs)("div",{className:"pk-body",children:[(0,_.jsxs)("nav",{className:"pk-tool-rail","aria-label":"Packaging design tools",children:[Nf.map(({id:x,label:X,Icon:Q})=>(0,_.jsxs)("button",{className:d===x&&g?"active":"","aria-label":X,"aria-pressed":d===x&&g,onClick:()=>{m(x),A(!0),C("All"),p("")},children:[(0,_.jsx)(Q,{}),(0,_.jsx)("span",{children:X})]},x)),(0,_.jsx)("div",{className:"pk-rail-bottom",children:(0,_.jsx)(jt,{label:"Printer settings",onClick:()=>Be("print"),children:(0,_.jsx)(tu,{})})})]}),g&&(0,_.jsxs)("aside",{className:"pk-library",children:[(0,_.jsxs)("header",{children:[(0,_.jsxs)("div",{children:[(0,_.jsx)("small",{children:"DESIGN TOOLS"}),(0,_.jsx)("h3",{children:Nf.find(x=>x.id===d)?.label})]}),(0,_.jsx)(jt,{label:"Collapse library",onClick:()=>A(!1),children:(0,_.jsx)(Yd,{})})]}),["templates","elements","patterns","uploads"].includes(d)&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsxs)("label",{className:"pk-search",children:[(0,_.jsx)(eu,{}),(0,_.jsx)("input",{"aria-label":"Search design library",placeholder:`Search ${d}\u2026`,value:u,onChange:x=>p(x.target.value)})]}),Ed.length>1&&(0,_.jsx)("div",{className:"pk-category-tabs",children:["All",...Ed].map(x=>(0,_.jsx)("button",{className:S===x?"active":"",onClick:()=>C(x),children:x},x))})]}),(0,_.jsxs)("div",{className:"pk-library-content",children:[d==="structure"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{className:"pk-description",children:"Choose your package. Dimensions update the artwork surface and 3D together."}),(0,_.jsx)("div",{className:"pk-structure-grid",children:no.map(x=>(0,_.jsxs)("button",{disabled:!Ce,className:t.structure===x.id?"active":"",onClick:()=>{Lt(Fs({...t,structure:x.id})),o(x.id==="carton"?"front":"top"),M(null)},children:[(0,_.jsx)(hs,{}),(0,_.jsx)("strong",{children:x.name}),(0,_.jsx)("span",{children:x.description})]},x.id))}),(0,_.jsxs)("h4",{children:["Box dimensions ",(0,_.jsx)("span",{children:"mm"})]}),(0,_.jsx)("div",{className:"pk-fields three",children:["width","depth","height"].map((x,X)=>(0,_.jsx)(vn,{label:["Length","Depth","Height"][X],value:t[x],min:30,max:800,disabled:!Ce,onChange:Q=>(()=>{try{Lt(Su(t,x,Q))}catch(oe){ce(oe instanceof Error?oe.message:"Could not resize this package.")}})()},x))}),t.structure==="custom"&&(0,_.jsx)("p",{className:"pk-fine",children:"Dimensions resize the mapped panels and folds together. Artwork keeps its proportions and is fitted inside smaller panels when needed. Review its placement after resizing."}),(0,_.jsx)(vn,{label:"Board thickness (mm)",value:t.thickness,min:.1,max:8,disabled:!Ce,onChange:x=>Lt({...t,thickness:x})}),(0,_.jsx)("h4",{children:"Material"}),(0,_.jsx)("div",{className:"pk-materials",children:["colour","kraft"].map(x=>(0,_.jsxs)("button",{className:t.material===x?"active":"",disabled:!Ce,onClick:()=>{He(x)},children:[(0,_.jsx)("i",{style:{background:x==="kraft"?"#cba878":"#faf9f6"}}),x==="kraft"?"Brown kraft":"Coated white"]},x))}),(0,_.jsx)("h4",{children:"Surface finish"}),(0,_.jsx)("div",{className:"pk-materials",role:"group","aria-label":"Surface finish",children:["matte","glossy"].map(x=>(0,_.jsx)("button",{disabled:!Ce,"aria-pressed":(t.finish||"matte")===x,className:(t.finish||"matte")===x?"active":"",onClick:()=>Lt({...t,finish:x}),children:x==="matte"?"Matte":"Glossy"},x))}),(0,_.jsxs)("button",{className:"pk-wide",onClick:()=>Ds.current?.click(),disabled:!Ce,children:[(0,_.jsx)(Fd,{}),"Import a dieline"]}),(0,_.jsx)("p",{className:"pk-fine",children:"PDF, SVG, DXF and images. Confirm scale and folds before creating a mockup."}),t.imported&&(0,_.jsxs)("div",{className:"pk-import-summary",children:[(0,_.jsx)("strong",{children:t.imported.name}),(0,_.jsx)("span",{children:"Original dieline retained"}),!cs&&(0,_.jsx)("p",{children:"This import has no complete fold map. Review its original dieline to connect the panels and enable 3D."}),(0,_.jsx)("button",{disabled:pe||!Ce,onClick:()=>{bi()},children:"Review imported dieline & folds"})]})]}),d==="templates"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{className:"pk-description",children:"Editable layouts for Studio and beyond. Start clean, then make it yours."}),(0,_.jsx)("div",{className:"pk-card-grid templates",children:Ac(co).map(x=>(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>{ht(x),Be("template")},children:[(0,_.jsxs)("span",{className:"pk-template-thumb",style:{background:x.background,color:x.ink},children:[(0,_.jsx)("i",{style:{background:x.accent}}),(0,_.jsx)("small",{children:x.category}),(0,_.jsx)("b",{children:x.name}),(0,_.jsx)("em",{children:"YOUR BRAND"})]}),(0,_.jsx)("strong",{children:x.name}),(0,_.jsx)("small",{children:x.category})]},x.id))})]}),(d==="elements"||d==="patterns")&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsxs)("button",{className:"pk-upload-area compact",disabled:!Ce,onClick:()=>Ot(d==="elements"?"element":"pattern"),children:[(0,_.jsx)(Ui,{}),(0,_.jsx)("strong",{children:d==="elements"?"Upload element":"Upload pattern"}),(0,_.jsx)("span",{children:d==="elements"?"Save your logo, symbol or graphic for reuse":"Add a pattern to your reusable library"}),(0,_.jsx)("small",{children:"SVG \xB7 PNG \xB7 JPG \xB7 WebP \xB7 PDF"})]}),d==="patterns"&&(0,_.jsxs)("button",{className:"pk-library-upload-secondary",disabled:!Ce,onClick:()=>Ot("texture"),children:[(0,_.jsx)(Ui,{}),"Upload texture"]}),Rt(d==="elements"?["element"]:["pattern","texture"]).length>0&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("h4",{children:d==="elements"?"Your elements":"Your patterns & textures"}),At(Rt(d==="elements"?["element"]:["pattern","texture"]))]}),d==="elements"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("h4",{children:"Your brand assets"}),(0,_.jsx)("div",{className:"pk-card-grid brands",children:lu.filter(x=>!u||x.name.toLowerCase().includes(u.toLowerCase())).map(x=>(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>{qt(x.src,x.name)},children:[(0,_.jsx)("span",{className:x.src.includes("white")?"dark":"",children:(0,_.jsx)("img",{src:x.src,alt:x.name})}),(0,_.jsx)("strong",{children:x.name})]},x.src))}),(0,_.jsxs)("div",{className:"pk-quick-shapes",children:[(0,_.jsx)("button",{disabled:!Ce,onClick:()=>xt("Rect"),children:"Rectangle"}),(0,_.jsx)("button",{disabled:!Ce,onClick:()=>xt("Circle"),children:"Circle"}),(0,_.jsx)("button",{disabled:!Ce,onClick:()=>we.current?.add({type:"Line",x1:0,y1:0,x2:50,y2:0,left:20,top:20,stroke:"#284f45",strokeWidth:1,name:"Line"}),children:"Line"})]}),(0,_.jsx)("h4",{children:"Packaging vectors & print rules"})]}),(0,_.jsx)("div",{className:"pk-card-grid vectors",children:Ac(d==="elements"?oo:lo).map(x=>(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>{ze(x,d==="patterns")},children:[(0,_.jsx)("span",{dangerouslySetInnerHTML:{__html:x.svg}}),(0,_.jsx)("strong",{children:x.name}),(0,_.jsx)("small",{children:x.category})]},x.id))})]}),d==="text"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{className:"pk-description",children:"Add text, then double-click it on the canvas to edit and select individual characters."}),(0,_.jsx)("button",{className:"pk-text-preset heading",disabled:!Ce,onClick:()=>{Wt("Add a heading",12,"PKMullerBold")},children:"Add a heading"}),(0,_.jsx)("button",{className:"pk-text-preset subheading",disabled:!Ce,onClick:()=>{Wt("Add a subheading",7,"PKMullerMedium")},children:"Add a subheading"}),(0,_.jsx)("button",{className:"pk-text-preset",disabled:!Ce,onClick:()=>{Wt("Add body text",4)},children:"Add body text"}),(0,_.jsx)("h4",{children:"Studio typography"}),Object.entries(Oc).map(([x,X])=>(0,_.jsxs)("button",{className:"pk-font-card",style:{fontFamily:X.family},disabled:!Ce,onClick:()=>{Wt("Thoughtfully designed.",7,X.family)},children:[(0,_.jsx)("span",{children:X.name}),(0,_.jsx)("b",{children:"Thoughtfully designed."})]},x))]}),d==="colours"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{className:"pk-description",children:"These colours print on the selected panel. Scene colours are separate."}),(0,_.jsxs)("label",{className:"pk-colour-field",children:[l?"Inside":"Outside"," panel colour",(0,_.jsx)("input",{type:"color","aria-label":"Printed panel colour",value:l?tt.insideColor:tt.color,disabled:!Ce,onChange:x=>T({[l?"insideColor":"color"]:x.target.value})})]}),(0,_.jsx)("div",{className:"pk-swatches",children:["#faf9f6","#ffffff","#cba878","#24516b","#1f4039","#222222","#bd9d62","#e6e1d5","#c9d4cd","#a9bfd0","#d5b4a6","#7f6356","#536a60","#b88070","#c0b5d2","#ecdfc7"].map(x=>(0,_.jsx)("button",{"aria-label":`Panel colour ${x}`,style:{background:x},disabled:!Ce,onClick:()=>T({[l?"insideColor":"color"]:x})},x))}),(0,_.jsx)("button",{className:"pk-wide",disabled:!Ce,onClick:()=>Lt({...t,panels:Object.fromEntries(Object.entries(t.panels).map(([x,X])=>[x,{...X,[l?"insideColor":"color"]:l?tt.insideColor:tt.color,[l?"insideObjects":"objects"]:(l?X.insideObjects:X.objects).filter(Q=>Q.name!=="Imported background")}]))}),children:"Apply this colour to all panels"}),y&&(0,_.jsxs)("div",{children:[(0,_.jsxs)("label",{className:"pk-colour-field",children:["Selected artwork colour",(0,_.jsx)("input",{type:"color","aria-label":"Selected artwork colour",value:y.fill?.startsWith("#")?y.fill:"#24516b",disabled:!Ce,onChange:x=>we.current?.patch({fill:x.target.value})})]}),y.type.toLowerCase()==="image"&&(0,_.jsx)("button",{disabled:!Ce,onClick:()=>we.current?.patch({tintColor:null}),children:"Restore original image colours"})]})]}),d==="uploads"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsxs)("button",{className:"pk-upload-area",disabled:!Ce,onClick:()=>{ke(!1),Pr.current?.click()},children:[(0,_.jsx)(Ui,{}),(0,_.jsx)("strong",{children:"Upload artwork"}),(0,_.jsx)("span",{children:"Logo, illustration, product photo or PDF"}),(0,_.jsx)("small",{children:"PNG \xB7 JPG \xB7 WebP \xB7 SVG \xB7 PDF"})]}),(0,_.jsx)("div",{className:"pk-card-grid uploads",children:Ac(Me).map(x=>(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>{yt(x).catch(X=>ce(X.message))},children:[(0,_.jsx)("span",{children:(0,_.jsx)("img",{src:x.src,alt:x.name})}),(0,_.jsx)("strong",{children:x.name})]},x.src))}),!Me.length&&(0,_.jsx)("p",{className:"pk-empty",children:"Your uploaded elements will appear here for reuse across projects."})]}),d==="layers"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{className:"pk-description",children:"Select, organize and protect the artwork on this panel."}),[...eo||[]].reverse().map(x=>(0,_.jsxs)("div",{className:`pk-layer-row ${y?.ids.includes(x.id)?"active":""}`,children:[(0,_.jsxs)("button",{className:"pk-layer-name",onClick:()=>we.current?.select(x.id),children:[(0,_.jsx)("span",{children:x.type?.toLowerCase().includes("text")?(0,_.jsx)(kc,{}):(0,_.jsx)(Nc,{})}),(0,_.jsx)("strong",{children:x.name||x.text?.slice(0,30)||x.type})]}),(0,_.jsx)(jt,{label:`${x.visible===!1?"Show":"Hide"} ${x.name||"layer"}`,disabled:!Ce,onClick:()=>{we.current?.select(x.id),we.current?.command("hide")},children:x.visible===!1?(0,_.jsx)(kd,{}):(0,_.jsx)(Ud,{})}),(0,_.jsx)(jt,{label:`${x.locked?"Unlock":"Lock"} ${x.name||"layer"}`,disabled:!Ce,onClick:()=>{we.current?.select(x.id),we.current?.command("lock")},children:x.locked?(0,_.jsx)(Lc,{}):(0,_.jsx)(Vd,{})})]},x.id)),!eo?.length&&(0,_.jsx)("p",{className:"pk-empty",children:"This panel is blank. Add text, elements or upload your artwork."}),(0,_.jsxs)("div",{className:"pk-layer-tools",children:[(0,_.jsx)("button",{onClick:()=>we.current?.command("selectAll"),children:"Select all"}),(0,_.jsxs)("button",{disabled:!Ce||!y,onClick:()=>we.current?.command("group"),children:[(0,_.jsx)(Dc,{}),"Group"]}),(0,_.jsxs)("button",{disabled:!Ce||!y,onClick:()=>we.current?.command("ungroup"),children:[(0,_.jsx)(Uc,{}),"Ungroup"]})]})]})]})]}),(0,_.jsxs)("main",{className:"pk-main",style:{"--scene-width":Re+"%"},children:[(0,_.jsxs)("div",{className:"pk-workbar",children:[(0,_.jsxs)("div",{className:"pk-workbar-left",children:[!g&&(0,_.jsx)(jt,{label:"Open library",onClick:()=>A(!0),children:(0,_.jsx)(jd,{})}),(0,_.jsx)("div",{className:"pk-mode-tabs",children:["design","dieline","scene"].map(x=>(0,_.jsx)("button",{className:h===x?"active":"",onClick:()=>{f(x),x==="scene"&&A(!1)},children:x==="design"?"Design":x==="dieline"?"Dieline":"Scene"},x))})]}),(0,_.jsxs)("div",{className:"pk-workbar-actions",children:[(0,_.jsx)(jt,{label:"Undo",onClick:Ne,disabled:!Ce||!ct.length,children:(0,_.jsx)(au,{})}),(0,_.jsx)(jt,{label:"Redo",onClick:Xe,disabled:!Ce||!de.length,children:(0,_.jsx)($d,{})}),h==="design"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(jt,{label:"Toggle grid",active:N,onClick:()=>O(!N),children:(0,_.jsx)(Ic,{})}),(0,_.jsx)(jt,{label:"Toggle snapping",active:L,onClick:()=>U(!L),children:(0,_.jsx)(Jd,{})}),(0,_.jsx)("select",{"aria-label":"Design view rotation",title:"Rotate the editing view; printed artwork stays unchanged",value:re,onChange:x=>W(Number(x.target.value)),children:[0,90,180,270].map(x=>(0,_.jsxs)("option",{value:x,children:["View ",x,"\xB0"]},x))}),(0,_.jsxs)("select",{"aria-label":"Canvas zoom",value:G,onChange:x=>{Y(+x.target.value),we.current?.zoom(+x.target.value)},children:[(0,_.jsx)("option",{value:.5,children:"50%"}),(0,_.jsx)("option",{value:1,children:"Fit"}),(0,_.jsx)("option",{value:1.5,children:"150%"}),(0,_.jsx)("option",{value:2,children:"200%"}),(0,_.jsx)("option",{value:3,children:"300%"})]})]})]})]}),(0,_.jsxs)("div",{className:"pk-facebar",children:[(0,_.jsx)("div",{className:"pk-face-list",children:Object.values(t.panels).map(x=>(0,_.jsx)("button",{className:tt.id===x.id?"active":"",onClick:()=>{o(x.id),M(null),R(null)},children:x.name},x.id))}),(0,_.jsxs)("div",{className:"pk-side-switch",children:[(0,_.jsx)("button",{className:l?"":"active",onClick:()=>{c(!1),M(null)},children:"Outside"}),(0,_.jsx)("button",{className:l?"active":"",onClick:()=>{c(!0),M(null)},children:"Inside"})]})]}),h!=="scene"&&t.imported&&!l&&Object.values(t.panels).some(x=>x.objects.length===1&&x.objects[0].name!=="Imported background"&&/image/i.test(x.objects[0].type))&&(0,_.jsxs)("div",{className:"pk-import-edit-help",children:[(0,_.jsx)("span",{children:h==="dieline"?"Click a panel to edit its artwork.":"Some imported panels are still combined images."}),(0,_.jsxs)("button",{disabled:!Ce||pe,onClick:()=>{Ue()},children:[(0,_.jsx)(Uc,{}),pe?"Separating artwork\u2026":"Separate all imported artwork"]})]}),(0,_.jsxs)("div",{className:`pk-stage ${h==="scene"?"scene-only":""}`,children:[h!=="scene"&&(0,_.jsx)("section",{className:"pk-artboard",children:h==="design"?(0,_.jsx)(fu,{ref:we,panel:tt,inside:l,editable:Ce,grid:N,snap:L,safe:t.print.safe,viewRotation:re,selected:y?.ids||[],onChange:te,onPreview:R,onSelect:M,onGuide:(x,X)=>T({guides:[...tt.guides,{axis:x,position:X}]})},tt.id+"-"+l):(0,_.jsx)(Ay,{project:t,selected:tt.id,onSelect:x=>B(x,!0)})}),h!=="scene"&&(0,_.jsx)("div",{className:"pk-splitter",role:"separator","aria-label":"Resize live preview","aria-valuenow":Re,tabIndex:0,onKeyDown:x=>{x.key==="ArrowLeft"&&le(Math.min(60,Re+3)),x.key==="ArrowRight"&&le(Math.max(25,Re-3))},onPointerDown:x=>{let X=x.clientX,Q=Re,oe=x.currentTarget;oe.setPointerCapture(x.pointerId);let ue=qe=>le(Math.min(60,Math.max(25,Q-(qe.clientX-X)/oe.parentElement.getBoundingClientRect().width*100)));oe.addEventListener("pointermove",ue),oe.addEventListener("pointerup",()=>oe.removeEventListener("pointermove",ue),{once:!0})}}),(0,_.jsxs)("section",{className:"pk-preview",style:!cs&&h!=="scene"?{display:"none"}:void 0,children:[(0,_.jsxs)("header",{children:[(0,_.jsxs)("span",{children:[(0,_.jsx)(hs,{}),"Live 3D"]}),(0,_.jsxs)("div",{children:[(0,_.jsx)(jt,{label:"Reset camera",onClick:()=>hn.current?.reset(),children:(0,_.jsx)(Kd,{})}),(0,_.jsx)(jt,{label:"Full scene workspace",onClick:()=>{f(h==="scene"?"design":"scene"),h!=="scene"&&A(!1)},children:(0,_.jsx)(Hd,{})})]})]}),cs?(0,_.jsx)(Lf,{ref:hn,project:Tc,unfold:v,inside:l,selected:a,onSelect:(x,X)=>{c(!!X),B(x)},large:h==="scene"}):(0,_.jsxs)("div",{className:"pk-scene-error",children:[(0,_.jsx)("strong",{children:"Fold mapping needed for 3D"}),(0,_.jsxs)("p",{children:[t.imported?.referenceOnly?"This file was imported as a 2D reference.":"The imported panels are not connected by a complete fold map."," Review the original dieline to map its panels and hinges."]}),(0,_.jsx)("button",{disabled:pe||!Ce,onClick:()=>{bi()},children:"Review imported dieline & folds"})]}),(0,_.jsxs)("div",{className:"pk-fold-control",children:[(0,_.jsxs)("div",{children:[(0,_.jsx)("span",{children:"Assembled"}),(0,_.jsxs)("strong",{children:[Math.round(v),"% unfolded"]}),(0,_.jsxs)("button",{className:"pk-fold-toggle",disabled:pe||!cs,onClick:Qa,"aria-label":P?cn.current===100?"Close box":"Open box":v>=50?"Close box":"Open box",children:[(0,_.jsx)(hs,{}),P?cn.current===100?"Close box":"Open box":v>=50?"Close box":"Open box"]}),(0,_.jsx)("span",{children:"Flat dieline"})]}),(0,_.jsx)("input",{"aria-label":"Unfold complete package",type:"range",min:"0",max:"100",value:v,onChange:x=>{Li(),w(+x.target.value)}})]}),h==="scene"&&(0,_.jsxs)("div",{className:"pk-scene-settings",children:[(0,_.jsxs)("div",{children:[(0,_.jsx)("h4",{children:"Presentation scene"}),(0,_.jsx)("div",{className:"pk-scene-presets",children:Au.map(x=>(0,_.jsxs)("button",{className:t.scene.preset===x.id?"active":"",disabled:!Ce,onClick:()=>Lt({...t,scene:{...t.scene,...x,preset:x.id}}),children:[(0,_.jsx)("i",{style:{backgroundColor:x.background,backgroundImage:x.surface!=="neutral"?`url(/packaging/scenes/materials/${x.surface==="wood"?"Wood095/Wood095":x.surface==="stone"?"Marble012/Marble012":"Concrete034/Concrete034"}_1K-JPG_Color.jpg)`:void 0,backgroundSize:"cover",filter:x.id==="walnut-table"?"brightness(.6) saturate(.8)":void 0}}),x.name]},x.id))})]}),(0,_.jsxs)("div",{children:[(0,_.jsx)("h4",{children:"Background & surface"}),(0,_.jsxs)("label",{className:"pk-colour-field",children:["Background",(0,_.jsx)("input",{type:"color","aria-label":"Scene background colour",value:t.scene.background,disabled:!Ce,onChange:x=>Lt({...t,scene:{...t.scene,background:x.target.value,backgroundImage:void 0}})})]}),(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>Ja.current?.click(),children:[(0,_.jsx)(Od,{}),"Upload background"]}),(0,_.jsxs)("label",{className:"pk-field",children:[(0,_.jsx)("span",{children:"Surface"}),(0,_.jsx)("select",{"aria-label":"Scene surface",disabled:!Ce,value:t.scene.surface,onChange:x=>Lt({...t,scene:{...t.scene,surface:x.target.value}}),children:["neutral","wood","stone","concrete"].map(x=>(0,_.jsx)("option",{children:x},x))})]})]}),(0,_.jsxs)("div",{children:[(0,_.jsx)("h4",{children:"Camera & light"}),(0,_.jsx)("div",{className:"pk-camera-presets",children:["hero","front","top","left","right"].map(x=>(0,_.jsx)("button",{onClick:()=>hn.current?.camera(x),children:x},x))}),(0,_.jsxs)("label",{className:"pk-field",children:[(0,_.jsx)("span",{children:"Box pose"}),(0,_.jsxs)("select",{"aria-label":"Box pose",disabled:!Ce,value:t.scene.pose,onChange:x=>Lt({...t,scene:{...t.scene,pose:x.target.value}}),children:[(0,_.jsx)("option",{value:"lying",children:"Lying on surface"}),(0,_.jsx)("option",{value:"standing",children:"Standing"})]})]}),(0,_.jsx)(vn,{label:"Light intensity",value:t.scene.light,min:.1,max:4,disabled:!Ce,onChange:x=>Lt({...t,scene:{...t.scene,light:x}})}),(0,_.jsx)(vn,{label:"Light direction (\xB0)",value:t.scene.direction,min:-180,max:180,disabled:!Ce,onChange:x=>Lt({...t,scene:{...t.scene,direction:x}})})]})]})]})]}),h==="design"&&y&&(0,_.jsxs)("div",{className:"pk-inspector",children:[(0,_.jsxs)("div",{className:"pk-selection-title",children:[(0,_.jsx)("strong",{children:y.ids.length>1?`${y.ids.length} objects selected`:y.text?"Text properties":"Artwork properties"}),(0,_.jsxs)("div",{children:[(0,_.jsx)(jt,{label:"Duplicate selection",disabled:!Ce,onClick:()=>we.current?.command("duplicate"),children:(0,_.jsx)(Nd,{})}),(0,_.jsx)(jt,{label:"Remove selection",disabled:!Ce,onClick:()=>we.current?.command("delete"),children:(0,_.jsx)(ru,{})})]})]}),(0,_.jsxs)("div",{className:"pk-transform-fields",children:[["left","top","width","height","angle"].map((x,X)=>(0,_.jsx)(vn,{label:["X (mm)","Y (mm)","Width (mm)","Height (mm)","Rotation (\xB0)"][X],value:y[x],disabled:!Ce||y.locked,min:x==="width"||x==="height"?.1:x==="angle"?-180:-2e3,max:x==="angle"?180:2e3,onChange:Q=>we.current?.patch({[x]:Q})},x)),(0,_.jsx)(vn,{label:"Opacity (%)",value:y.opacity*100,min:0,max:100,step:1,disabled:!Ce,onChange:x=>we.current?.patch({opacity:x/100})})]}),(0,_.jsxs)("div",{className:"pk-inspector-tools",children:[(0,_.jsx)("div",{className:"pk-alignment-tools",children:[{id:"left",label:"Align left",Icon:su},{id:"center-x",label:"Centre horizontally",Icon:nu},{id:"right",label:"Align right",Icon:iu},{id:"top",label:"Align top",Icon:Cd},{id:"center-y",label:"Centre vertically",Icon:Td},{id:"bottom",label:"Align bottom",Icon:Ad},{id:"distribute-x",label:"Equal horizontal spacing",Icon:Gd},{id:"distribute-y",label:"Equal vertical spacing",Icon:Wd}].map(({id:x,label:X,Icon:Q})=>(0,_.jsx)(jt,{label:X,disabled:!Ce,onClick:()=>we.current?.align(x),children:(0,_.jsx)(Q,{})},x))}),(0,_.jsxs)("div",{className:"pk-object-tools",children:[(0,_.jsx)(jt,{label:"Bring to front",disabled:!Ce,onClick:()=>we.current?.command("front"),children:(0,_.jsx)(Pd,{})}),(0,_.jsx)(jt,{label:"Send to back",disabled:!Ce,onClick:()=>we.current?.command("back"),children:(0,_.jsx)(Rd,{})}),(0,_.jsx)(jt,{label:"Lock or unlock",disabled:!Ce,onClick:()=>we.current?.command("lock"),children:(0,_.jsx)(Lc,{})}),y.ids.length>1&&(0,_.jsx)(jt,{label:"Group selection",disabled:!Ce,onClick:()=>we.current?.command("group"),children:(0,_.jsx)(Dc,{})})]})]}),y.text!==void 0&&(0,_.jsxs)("div",{className:"pk-text-properties",children:[(0,_.jsx)("select",{"aria-label":"Text font",value:y.fontFamily,disabled:!Ce,onChange:x=>we.current?.patch({fontFamily:x.target.value}),children:Object.values(Oc).map(x=>(0,_.jsx)("option",{value:x.family,children:x.name},x.family))}),(0,_.jsx)(vn,{label:"Font size (mm)",value:y.fontSize||8,min:1,max:100,disabled:!Ce,onChange:x=>we.current?.patch({fontSize:x})}),(0,_.jsx)(vn,{label:"Line spacing",value:y.lineHeight||1.2,min:.5,max:4,disabled:!Ce,onChange:x=>we.current?.patch({lineHeight:x})}),(0,_.jsx)(vn,{label:"Tracking",value:y.charSpacing||0,min:-100,max:1e3,disabled:!Ce,onChange:x=>we.current?.patch({charSpacing:x})}),(0,_.jsx)("select",{"aria-label":"Text alignment",value:y.textAlign||"left",disabled:!Ce,onChange:x=>we.current?.patch({textAlign:x.target.value}),children:["left","center","right","justify"].map(x=>(0,_.jsx)("option",{children:x},x))}),(0,_.jsx)("input",{type:"color","aria-label":"Text colour",value:y.fill?.startsWith("#")?y.fill:"#223c36",disabled:!Ce,onChange:x=>we.current?.patch({fill:x.target.value})})]}),!["image","textbox","i-text","text"].includes(y.type.toLowerCase())&&(0,_.jsxs)("div",{className:"pk-vector-colours",role:"group","aria-label":"Element colour",children:[(0,_.jsx)("span",{children:"Element colour"}),[["Black","#111111"],["Studio blue","#24516b"],["White","#ffffff"],["Grey","#737373"]].map(([x,X])=>(0,_.jsx)("button",{"aria-label":`Element colour ${x}`,title:x,disabled:!Ce||y.locked,style:{backgroundColor:X},onClick:()=>we.current?.patch({fill:X})},X)),(0,_.jsx)("input",{type:"color","aria-label":"Custom element colour",value:y.fill?.startsWith("#")?y.fill:"#111111",disabled:!Ce||y.locked,onChange:x=>we.current?.patch({fill:x.target.value})})]}),y.type.toLowerCase()==="image"&&(0,_.jsxs)("div",{className:"pk-image-properties",children:[(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>{ke(!0),Pr.current?.click()},children:[(0,_.jsx)(Zd,{}),"Replace image"]}),(0,_.jsx)("button",{disabled:!Ce,onClick:()=>we.current?.patch({width:tt.width,height:tt.height,left:0,top:0}),children:"Fill panel"}),(0,_.jsx)("p",{children:"Corner handles scale proportionally. Shift allows free resizing."})]})]}),(0,_.jsxs)("footer",{className:"pk-footer",children:[(0,_.jsxs)("span",{children:[no.find(x=>x.id===t.structure)?.name||(t.imported?.profileId?"Studio mapped box":"Custom dieline")," ","\xB7 ",t.imported?.referenceOnly?`${t.imported.net.width.toFixed(1)} \xD7 ${t.imported.net.height.toFixed(1)} mm sheet \xB7 folds not mapped`:`${t.width} \xD7 ${t.depth} \xD7 ${t.height} mm`]}),(0,_.jsxs)("span",{children:[i?"Editor":"View only"," \xB7"," ",l?"Inside":"Outside"," \xB7 ",tt.name]})]})]})]}),Pe&&(0,_.jsx)("div",{className:"pk-dialog-backdrop",onMouseDown:()=>!pe&&Be(null),children:(0,_.jsxs)("section",{className:`pk-dialog ${Pe==="import"?"wide":""}`,role:"dialog","aria-label":Pe==="import"?"Import dieline":Pe==="projects"?"Packaging projects":Pe==="template"?"Preview template":Pe==="print"?"Printer settings":"Export packaging",onMouseDown:x=>x.stopPropagation(),children:[(0,_.jsxs)("header",{children:[(0,_.jsxs)("div",{children:[(0,_.jsx)("small",{children:"PACKAGING STUDIO"}),(0,_.jsx)("h3",{children:Pe==="import"?"Understand your dieline":Pe==="projects"?"Your projects":Pe==="template"?"Preview this layout":Pe==="print"?"Printer settings":"Export your design"})]}),(0,_.jsx)(jt,{label:"Close panel",disabled:pe,onClick:()=>Be(null),children:(0,_.jsx)(Dr,{})})]}),Pe==="projects"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsxs)("div",{className:"pk-dialog-actions",children:[(0,_.jsxs)("button",{disabled:!Ce,onClick:ii,children:[(0,_.jsx)(qd,{}),"Blank project"]}),(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>Ls.current?.click(),children:[(0,_.jsx)(Ui,{}),"Import project"]}),s&&(0,_.jsx)("button",{disabled:!Ce,onClick:()=>{We(!0)},children:"Save a copy"})]}),(0,_.jsxs)("div",{className:"pk-project-list",children:[je.map(x=>(0,_.jsxs)("button",{onClick:()=>{Un(x.id)},children:[(0,_.jsx)(hs,{}),(0,_.jsxs)("div",{children:[(0,_.jsx)("strong",{children:x.name}),(0,_.jsxs)("span",{children:[x.width," \xD7 ",x.depth," \xD7 ",x.height," mm \xB7"," ",new Date(x.updatedAt).toLocaleDateString()]})]}),(0,_.jsx)(Dd,{})]},x.id)),!je.length&&(0,_.jsx)("p",{children:"Save your first project to reuse it later."})]})]}),Pe==="template"&&k&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsxs)("div",{className:"pk-template-preview",style:{background:k.background,color:k.ink},children:[(0,_.jsx)("small",{children:k.category}),(0,_.jsx)("h2",{children:k.name}),(0,_.jsx)("span",{style:{borderColor:k.accent},children:"YOUR PRODUCT"}),(0,_.jsx)("p",{children:"THOUGHTFULLY MADE"})]}),(0,_.jsx)("p",{children:"Applies an editable layout to this package. Product images and named product text are retained. You can undo the change."}),(0,_.jsx)("button",{className:"pk-primary",disabled:!Ce,onClick:Et,children:"Apply template"})]}),Pe==="print"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{children:"Choose settings from your printer. Production output is available only after the owned prepress service validates it."}),(0,_.jsxs)("div",{className:"pk-fields three",children:[(0,_.jsx)(vn,{label:"Bleed (mm)",value:t.print.bleed,min:0,max:20,disabled:!Ce,onChange:x=>Lt({...t,print:{...t.print,bleed:x}})}),(0,_.jsx)(vn,{label:"Safe area (mm)",value:t.print.safe,min:0,max:20,disabled:!Ce,onChange:x=>Lt({...t,print:{...t.print,safe:x}})}),(0,_.jsx)(vn,{label:"Raster target (dpi)",value:t.print.dpi,min:72,max:600,disabled:!Ce,onChange:x=>Lt({...t,print:{...t.print,dpi:x}})})]}),(0,_.jsxs)("label",{className:"pk-field",children:[(0,_.jsx)("span",{children:"Cut spot name"}),(0,_.jsx)("input",{value:t.print.cutSpot,disabled:!Ce,onChange:x=>Lt({...t,print:{...t.print,cutSpot:x.target.value}})})]}),(0,_.jsxs)("label",{className:"pk-field",children:[(0,_.jsx)("span",{children:"Crease spot name"}),(0,_.jsx)("input",{value:t.print.creaseSpot,disabled:!Ce,onChange:x=>Lt({...t,print:{...t.print,creaseSpot:x.target.value}})})]}),(0,_.jsxs)("button",{disabled:!Ce,onClick:()=>Ir.current?.click(),children:[(0,_.jsx)(Ui,{}),"Upload printer ICC profile"]}),(0,_.jsx)("p",{className:"pk-fine",children:t.print.profileName||"No printer profile selected"}),(0,_.jsxs)("div",{className:`pk-service ${Ve.available?"online":""}`,children:[(0,_.jsx)("span",{}),Ve.available?"Studio prepress service connected":"Studio prepress service not connected"]})]}),Pe==="export"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("h4",{children:"Design files"}),(0,_.jsxs)("div",{className:"pk-export-list",children:[(0,_.jsxs)("button",{disabled:pe,onClick:()=>{_t("svg")},children:[(0,_.jsx)(ks,{}),(0,_.jsx)("strong",{children:"Editable SVG dieline"}),(0,_.jsx)("span",{children:t.imported?"Actual size \xB7 includes imported artwork images":"Actual size \xB7 vector art \xB7 text outlined"})]}),(0,_.jsxs)("button",{disabled:pe,onClick:()=>{_t("pdf")},children:[(0,_.jsx)(ks,{}),(0,_.jsx)("strong",{children:"PDF for Illustrator"}),(0,_.jsx)("span",{children:"Actual size \xB7 artwork + vector cut/fold paths \xB7 text outlined \xB7 RGB"})]}),(0,_.jsxs)("button",{disabled:pe,onClick:()=>{_t("eps")},children:[(0,_.jsx)(ks,{}),(0,_.jsx)("strong",{children:"EPS vector dieline"}),(0,_.jsx)("span",{children:"Actual size \xB7 editable cut/fold paths only \xB7 no artwork"})]}),(0,_.jsxs)("button",{disabled:pe,onClick:()=>{_t("panel")},children:[(0,_.jsx)(ks,{}),(0,_.jsx)("strong",{children:"Selected panel artwork"}),(0,_.jsxs)("span",{children:[tt.name," \xB7 ",l?"inside":"outside"," \xB7 SVG"]})]}),(0,_.jsxs)("button",{disabled:pe,onClick:()=>{_t("project")},children:[(0,_.jsx)(Pc,{}),(0,_.jsx)("strong",{children:"Portable project"}),(0,_.jsx)("span",{children:"Editable project with assets and fonts"})]})]}),(0,_.jsx)("h4",{children:"Mockup images"}),(0,_.jsxs)("div",{className:"pk-dialog-actions",children:[(0,_.jsx)("button",{disabled:pe||!cs,onClick:()=>{_t("png")},children:"PNG \xB7 3840 px"}),(0,_.jsx)("button",{disabled:pe||!cs,onClick:()=>{_t("jpg")},children:"JPG \xB7 3840 px"}),(0,_.jsx)("button",{disabled:pe||!cs,onClick:()=>{_t("transparent")},children:"Transparent PNG"})]}),(0,_.jsx)("p",{className:"pk-fine",children:"PDF export uses RGB colour. Ask your printer to prepare and preflight production colour separations."})]}),Pe==="import"&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{children:"Keep the original file, identify structure, then confirm physical scale and folds. Your current project stays unchanged until confirmation."}),(0,_.jsxs)("button",{disabled:!Ce||pe,onClick:()=>Ds.current?.click(),children:[(0,_.jsx)(Ui,{}),"Choose another dieline"]}),Je&&(0,_.jsxs)("div",{className:"pk-import-progress",role:"status","aria-live":"polite","aria-busy":"true",children:[(0,_.jsx)("span",{className:"pk-import-spinner","aria-hidden":"true"}),(0,_.jsxs)("div",{children:[(0,_.jsx)("strong",{children:Je.label}),(0,_.jsx)("span",{children:Je.total?`${Je.done} of ${Je.total} panels ready`:"Your current project is kept safe while this file is prepared."}),(0,_.jsx)("progress",{max:Je.total||void 0,value:Je.total?Je.done:void 0})]})]}),!he&&!pe&&(0,_.jsx)("p",{className:"pk-import-empty",children:"Choose a dieline to see its preview and review the box structure."}),!pe&&se&&(0,_.jsx)("p",{className:"pk-import-error",role:"alert",children:se}),he&&(0,_.jsxs)("div",{className:"pk-import-grid",children:[(0,_.jsxs)("div",{className:"pk-import-preview",children:[(0,_.jsx)("img",{src:os.current,alt:"Original dieline preview"}),(0,_.jsxs)("svg",{viewBox:`0 0 ${he.width} ${he.height}`,"aria-label":"Trace panels on imported dieline",onPointerDown:x=>{if(b!=="custom")return;let X=x.currentTarget,Q=X.getBoundingClientRect(),oe=[(x.clientX-Q.left)/Q.width*he.width,(x.clientY-Q.top)/Q.height*he.height];X.setPointerCapture(x.pointerId);let ue=qe=>{let Ze=(qe.clientX-Q.left)/Q.width*he.width,rt=(qe.clientY-Q.top)/Q.height*he.height;if(Math.abs(Ze-oe[0])<3||Math.abs(rt-oe[1])<3)return;let Tt="panel-"+crypto.randomUUID().slice(0,8);I(bt=>bt&&{...bt,panels:[...bt.panels,{id:Tt,x:Math.min(Ze,oe[0]),y:Math.min(rt,oe[1]),width:Math.abs(Ze-oe[0]),height:Math.abs(rt-oe[1])}]}),Ie(bt=>[...bt,{id:Tt,name:`Panel ${bt.length+1}`,parent:"",edge:"top",angle:90}])};X.addEventListener("pointerup",ue,{once:!0})},children:[he.lines.filter(x=>x.kind!=="artwork").map(x=>(0,_.jsx)("polyline",{points:x.points.map(X=>X.join(",")).join(" "),fill:"none",stroke:x.kind==="fold"?"#2f987d":"#bc526b",strokeWidth:he.width/1e3},x.id)),he.panels.map((x,X)=>(0,_.jsxs)("g",{children:[(0,_.jsx)("path",{d:[x.points||[[x.x,x.y],[x.x+x.width,x.y],[x.x+x.width,x.y+x.height],[x.x,x.y+x.height]],...x.islands||[],...x.holes||[]].map(Q=>"M"+Q.map(oe=>oe.join(" ")).join(" L")+" Z").join(" "),fillRule:"evenodd",fill:"#347c6818",stroke:"#277d6a",strokeWidth:he.width/600}),(0,_.jsx)("text",{x:x.x+x.width/2,y:x.y+x.height/2,textAnchor:"middle",fontSize:he.width/50,fill:"#215447",children:X+1})]},x.id))]})]}),(0,_.jsxs)("div",{className:"pk-import-controls",children:[he.pages>1&&(0,_.jsx)(vn,{label:"PDF page",value:he.page,min:1,max:he.pages,step:1,disabled:pe,onChange:x=>{Pt(ni.current,x)}}),(0,_.jsxs)("label",{className:"pk-field",children:[(0,_.jsx)("span",{children:"Box style"}),(0,_.jsxs)("select",{"aria-label":"Imported box style",value:b,disabled:pe,onChange:x=>V(x.target.value),children:[no.map(x=>(0,_.jsx)("option",{value:x.id,children:x.name},x.id)),(0,_.jsx)("option",{value:"custom",children:he.studioProfile?"Mapped Studio package":"Custom panel mapping"})]})]}),!he.dimensions&&(0,_.jsx)("p",{className:"pk-fine",children:"Box dimensions could not be read reliably. The values below are placeholders: enter confirmed measurements before generating a standard box. Sheet size is independent of box size."}),he.notes.map(x=>(0,_.jsx)("p",{className:"pk-fine",children:x},x)),(0,_.jsx)("div",{className:"pk-fields three",children:H.map((x,X)=>(0,_.jsx)(vn,{label:["Imported length (mm)","Imported depth (mm)","Imported height (mm)"][X],value:x,min:30,max:800,disabled:pe||!!he.studioProfile,onChange:Q=>ee(oe=>oe.map((ue,qe)=>qe===X?Q:ue))},X))}),(0,_.jsx)(vn,{label:"Known sheet width (mm)",value:he.width*j,min:1,max:5e3,disabled:pe,onChange:x=>{let X=x/he.width;ne(X),he.studioProfile&&ee(he.studioProfile.dimensions.map(Q=>Q*X/he.studioProfile.scale))}}),(0,_.jsxs)("p",{className:"pk-fine",children:["Estimated sheet"," ",Math.round(he.width*j)," \xD7"," ",Math.round(he.height*j)," mm. Confirm against the original drawing."]}),(0,_.jsxs)("details",{children:[(0,_.jsxs)("summary",{children:["Classify structural paths (",he.lines.filter(x=>x.kind!=="artwork").length,")"]}),he.lines.filter(x=>x.kind!=="artwork").slice(0,150).map(x=>(0,_.jsxs)("label",{className:"pk-path-row",children:[(0,_.jsx)("span",{children:x.id}),(0,_.jsxs)("select",{value:x.kind,onChange:X=>I(Q=>{if(!Q)return Q;let oe=Q.lines.map(ue=>ue.id===x.id?{...ue,kind:X.target.value}:ue);return{...Q,lines:oe,panels:mu(oe)}}),children:[(0,_.jsx)("option",{value:"cut",children:"Cut"}),(0,_.jsx)("option",{value:"fold",children:"Fold"}),(0,_.jsx)("option",{value:"artwork",children:"Artwork / dimension"})]})]},x.id))]}),b==="custom"&&he.studioProfile&&(0,_.jsxs)("p",{className:"pk-fine",children:[he.studioProfile.net.pieces.length," panels mapped, including curved tabs and rollover folds. Ready for a live 3D mockup."]}),b==="custom"&&!he.studioProfile&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)("p",{className:"pk-fine",children:"Drag over the preview to trace a rectangular panel. Map each child to its parent and hinge. Leave one root panel."}),fe.map((x,X)=>(0,_.jsxs)("div",{className:"pk-mapping",children:[(0,_.jsxs)("strong",{children:["Panel ",X+1]}),(0,_.jsx)("input",{"aria-label":`Panel ${X+1} name`,value:x.name,onChange:Q=>Ie(oe=>oe.map(ue=>ue.id===x.id?{...ue,name:Q.target.value}:ue))}),(0,_.jsxs)("select",{"aria-label":`Panel ${X+1} parent`,value:x.parent,onChange:Q=>Ie(oe=>oe.map(ue=>ue.id===x.id?{...ue,parent:Q.target.value}:ue)),children:[(0,_.jsx)("option",{value:"",children:"Root / disconnected"}),fe.filter(Q=>Q.id!==x.id).map(Q=>(0,_.jsx)("option",{value:Q.id,children:Q.name},Q.id))]}),(0,_.jsx)("select",{"aria-label":`Panel ${X+1} hinge edge`,value:x.edge,onChange:Q=>Ie(oe=>oe.map(ue=>ue.id===x.id?{...ue,edge:Q.target.value}:ue)),children:["top","bottom","left","right"].map(Q=>(0,_.jsx)("option",{children:Q},Q))}),(0,_.jsx)(vn,{label:`Panel ${X+1} fold angle`,value:x.angle,min:-180,max:180,disabled:pe,onChange:Q=>Ie(oe=>oe.map(ue=>ue.id===x.id?{...ue,angle:Q}:ue))})]},x.id))]}),b==="custom"&&!he.studioProfile&&(0,_.jsx)("button",{disabled:pe||!i||!ye,onClick:()=>{Wn(!0)},children:"Keep complete original as a 2D reference"}),(0,_.jsx)("label",{className:"pk-field",children:(0,_.jsxs)("span",{children:[(0,_.jsx)("input",{type:"checkbox",checked:ye,onChange:x=>Te(x.target.checked)})," ",he.studioProfile?"Use reviewed Studio scale and fold map":"I checked the sheet scale and panel boundaries against the original."]})}),(0,_.jsx)("p",{className:"pk-fine",children:"Custom mapping preserves this file's layout and panel artwork. Selecting a standard box creates a new blank dieline with the entered dimensions; it does not map the source artwork automatically."}),ls&&(0,_.jsxs)("p",{className:"pk-fine",role:"status",children:[ls," You can still keep the original as a 2D reference."]})]})]}),he&&(0,_.jsxs)("div",{className:"pk-import-footer",children:[(0,_.jsx)("span",{children:pe?Je?.label||"Preparing package\u2026":Ye?"Import paused. Your selected dieline is retained; retry when connected.":ls||(ye?"Ready to create the package and live mockup.":"Confirm the scale and panel boundaries to continue.")}),(0,_.jsxs)("button",{className:"pk-primary",disabled:pe||!i||!ye||!!ls,onClick:()=>{Wn()},children:[pe?(0,_.jsx)("span",{className:"pk-import-spinner","aria-hidden":"true"}):(0,_.jsx)(Id,{}),pe?"Preparing package\u2026":Ye?"Retry import & open editor":"Create package & open editor"]})]})]}),Se&&(0,_.jsxs)("div",{className:"pk-job",children:[(0,_.jsxs)("strong",{children:[Se.operation==="prepress"?"Production export":"Native conversion"," ","\xB7 ",Se.status]}),(0,_.jsx)("span",{children:Se.message||Se.error}),["queued","processing"].includes(Se.status)&&(0,_.jsx)("button",{onClick:async()=>{let x=await an("/api/packaging/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",id:Se.id})});Ee(await x.json())},children:"Cancel processing"}),Se.status==="failed"&&(0,_.jsx)("button",{onClick:async()=>{let x=await an("/api/packaging/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"retry",id:Se.id})});Ee(await x.json())},children:"Retry"})]})]})}),(0,_.jsx)("input",{ref:Ka,hidden:!0,type:"file","aria-label":"Upload reusable design asset",accept:"image/png,image/jpeg,image/webp,image/svg+xml,application/pdf",onChange:x=>{Ge(x.target.files?.[0],ge),x.target.value=""}}),(0,_.jsx)("input",{ref:Pr,hidden:!0,type:"file",accept:"image/png,image/jpeg,image/webp,image/svg+xml,application/pdf",onChange:x=>{Ge(x.target.files?.[0]),x.target.value=""}}),(0,_.jsx)("input",{ref:Ds,hidden:!0,type:"file",accept:".pdf,.svg,.dxf,.png,.jpg,.jpeg,.webp",onChange:x=>{Pt(x.target.files?.[0]),x.target.value=""}}),(0,_.jsx)("input",{ref:Ls,hidden:!0,type:"file",accept:".json,.zip",onChange:x=>{si(x.target.files?.[0]),x.target.value=""}}),(0,_.jsx)("input",{ref:Ja,hidden:!0,type:"file",accept:"image/png,image/jpeg,image/webp",onChange:x=>{Ge(x.target.files?.[0],"background"),x.target.value=""}}),(0,_.jsx)("input",{ref:Ir,hidden:!0,type:"file",accept:".icc,.icm",onChange:x=>{Ge(x.target.files?.[0],"icc"),x.target.value=""}})]})}var Is=An(Fi(),1);(0,kf.createRoot)(document.getElementById("studio-root")).render((0,Is.jsxs)(Is.Fragment,{children:[(0,Is.jsx)(wd,{canEdit:!0,onClose:()=>location.href="/tools/"}),(0,Is.jsx)("span",{className:"local-storage-note",children:"Projects & uploads stay in this browser \xB7 Export a file to keep a backup"})]}));
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
