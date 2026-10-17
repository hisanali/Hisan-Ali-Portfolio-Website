/** Pure board rules, shared by the browser and regression checks. */
export function slide2048(board,direction){
 const next=board.slice();let score=0;
 for(let lane=0;lane<4;lane++){
  const ids=Array.from({length:4},(_,i)=>direction===0?lane*4+i:direction===1?lane*4+3-i:direction===2?i*4+lane:(3-i)*4+lane);
  const values=ids.map(i=>board[i]).filter(Boolean),merged=[];
  for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){merged.push(values[i]*2);score+=values[i]*2;i++;}else merged.push(values[i]);}
  ids.forEach((id,i)=>next[id]=merged[i]||0);
 }
 return{board:next,score,changed:next.some((v,i)=>v!==board[i])};
}
export const canMove2048=board=>board.includes(0)||[0,1,2,3].some(d=>slide2048(board,d).changed);
export function minefield(first,random=Math.random){
 const mines=new Set(),safe=new Set();for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(Math.abs(x-first%9)<=1&&Math.abs(y-Math.floor(first/9))<=1)safe.add(y*9+x);
 const candidates=Array.from({length:81},(_,i)=>i).filter(i=>!safe.has(i));for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}candidates.slice(0,10).forEach(i=>mines.add(i));return mines;
}
export function neighbours(i){const out=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const nx=i%9+x,ny=Math.floor(i/9)+y;if((x||y)&&nx>=0&&nx<9&&ny>=0&&ny<9)out.push(ny*9+nx);}return out;}
export function revealMine(i,mines,open,flags){
 if(flags.has(i)||open.has(i))return false;if(mines.has(i))return true;
 const stack=[i];while(stack.length){const id=stack.pop();if(open.has(id)||flags.has(id))continue;open.add(id);if(!neighbours(id).some(n=>mines.has(n)))for(const n of neighbours(id))if(!mines.has(n)&&!open.has(n))stack.push(n);}
 return false;
}
