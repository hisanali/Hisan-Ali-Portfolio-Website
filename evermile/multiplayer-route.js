// Apply the host's branch decisions in order, preserving already-built road before each fork.
export function syncRoute(network,route,onChange=()=>{}){
 if(network.off)return;
 for(let n=0;n<route.picks.length;n++){
  let j=network.junctions.find(j=>j.n===n);
  while(!j){network.extend(network.segs[network.segs.length-1].z1+1);j=network.junctions.find(j=>j.n===n);}
  if(j.chosen!==route.picks[n]){j.committed=false;if(network.choose(j,route.picks[n]))onChange(j);}
  if(n<route.done)j.committed=true;if(route.picked.includes(n))j.picked=true;
 }
 network.done=route.done;
}
