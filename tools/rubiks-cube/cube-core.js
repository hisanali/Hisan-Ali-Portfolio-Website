// Facelet order follows cube.js / Kociemba: U R F D L B.
export const FACES = ['U','R','F','D','L','B'];
export const COLORS = {U:'#eeeedd',R:'#ef6257',F:'#59b889',D:'#f2cf55',L:'#ee984d',B:'#638fdf'};
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
 let cube;try{cube=Cube.fromString(state);}catch{return 'Some pieces have an impossible colour combination. Review the faces and their orientation.';}
 if(new Set(cube.cp).size!==8||new Set(cube.ep).size!==12||cube.asString()!==state)return 'Some corner or edge pieces are duplicated or have impossible colours. Check each face’s orientation.';
 if(cube.co.reduce((a,b)=>a+b,0)%3)return 'A corner appears twisted. Check the corner colours and face orientation.';
 if(cube.eo.reduce((a,b)=>a+b,0)%2)return 'An edge appears flipped. Check the edge colours and face orientation.';
 if(parity(cube.cp)!==parity(cube.ep))return 'Two pieces appear swapped. This arrangement cannot be solved by turning faces. Review your colours.';
 return null;
}
