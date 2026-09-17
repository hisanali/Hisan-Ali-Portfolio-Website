// Facelet order follows cube.js / Kociemba: U R F D L B.
export const FACES = ['U','R','F','D','L','B'];
export const COLORS = {U:'#ffffff',R:'#e52232',F:'#00a957',D:'#ffe600',L:'#ff7200',B:'#1464ed'};
export const NAMES = {U:'White',R:'Red',F:'Green',D:'Yellow',L:'Orange',B:'Blue'};
export const LABELS = {U:'Top',R:'Right',F:'Front',D:'Bottom',L:'Left',B:'Back'};
export const SOLVED = FACES.map(f=>f.repeat(9)).join('');
export const NORMALS = {U:[0,1,0],R:[1,0,0],F:[0,0,1],D:[0,-1,0],L:[-1,0,0],B:[0,0,-1]};
export function position(face,r,c){return {U:[c-1,1,r-1],R:[1,1-r,1-c],F:[c-1,1-r,1],D:[c-1,-1,1-r],L:[-1,1-r,c-1],B:[1-c,1-r,-1]}[face];}
export function inverse(move){return move.endsWith('2')?move:move.endsWith("'")?move[0]:move+"'";}
const parity=a=>a.reduce((p,v,i)=>p+a.slice(i+1).filter(x=>x<v).length,0)%2;
export function validate(state,Cube){
 if(typeof state!=='string'||state.length!==54||/[^URFDLB]/.test(state))return 'Fill all 54 squares using the six cube colours.';
 for(const f of FACES){const count=state.split(f).length-1;if(count!==9)return `${NAMES[f]} has ${count} squares. Each colour needs exactly 9.`;if(state[FACES.indexOf(f)*9+4]!==f)return 'The centre colours must stay in their original positions.';}
 let cube;try{cube=Cube.fromString(state);}catch{return 'Some pieces have an impossible colour combination. Compare the detected colours with your cube.';}
 if(new Set(cube.cp).size!==8||new Set(cube.ep).size!==12||cube.asString()!==state)return 'Some corner or edge pieces are duplicated or have impossible colours. Compare the detected colours with your cube.';
 if(cube.co.reduce((a,b)=>a+b,0)%3)return 'A corner appears twisted. Check the colours of the corner stickers.';
 if(cube.eo.reduce((a,b)=>a+b,0)%2)return 'An edge appears flipped. Check the colours of the edge stickers.';
 if(parity(cube.cp)!==parity(cube.ep))return 'Two pieces appear swapped. This arrangement cannot be solved by turning faces. Review your colours.';
 return null;
}

// A photo can be rotated without changing the physical cube. Search all 4^6
// face rotations, but never silently choose between different legal cubes.
export function rotateFace(face){return [6,3,0,7,4,1,8,5,2].map(i=>face[i]).join('');}
export function correctOrientation(state,Cube){
 const error=validate(state,Cube);
 if(!error)return {state,corrected:false};
 if(typeof state!=='string'||!/^[URFDLB]{54}$/.test(state)||FACES.some((f,i)=>state.split(f).length!==10||state[i*9+4]!==f))return {error};
 const options=FACES.map((_,i)=>{let face=state.slice(i*9,i*9+9);const choices=new Set();for(let j=0;j<4;j++){choices.add(face);face=rotateFace(face);}return [...choices];});
 const matches=new Set();
 function search(i,prefix){if(matches.size>1)return;if(i===6){if(!validate(prefix,Cube))matches.add(prefix);return;}for(const face of options[i])search(i+1,prefix+face);}
 search(0,'');
 if(matches.size===1)return {state:[...matches][0],corrected:true};
 if(matches.size>1)return {error:'These scans fit more than one cube arrangement. Please rescan the faces using the guide so we can identify your cube safely.'};
 return {error:'We checked every face rotation, but some colours still do not fit a possible cube. Compare the scanned stickers with your cube, especially orange/red and yellow/white, then try again.'};
}
