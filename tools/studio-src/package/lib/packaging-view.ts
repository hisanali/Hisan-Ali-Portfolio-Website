/** Editor-only transform; artwork coordinates and exports remain unchanged. */
export function artworkViewport(width:number,height:number,viewWidth:number,viewHeight:number,rotation:number,zoom=1):[number,number,number,number,number,number] {
  const angle=rotation*Math.PI/180,c=Math.round(Math.cos(angle)),s=Math.round(Math.sin(angle));
  const w=Math.abs(c)*width+Math.abs(s)*height,h=Math.abs(s)*width+Math.abs(c)*height;
  const scale=Math.max(.01,Math.min((viewWidth-40)/w,(viewHeight-40)/h))*zoom;
  return [c*scale,s*scale,-s*scale,c*scale,viewWidth/2-scale*(c*width-s*height)/2,viewHeight/2-scale*(s*width+c*height)/2];
}
export function artworkRuler(width:number,height:number,rotation:number,horizontal:boolean) {
  const quarter=((rotation%360)+360)%360;
  const swapped=quarter===90||quarter===270;
  const axis: 'x'|'y'=horizontal?(swapped?'y':'x'):(swapped?'x':'y');
  return {axis,length:axis==='x'?width:height,reversed:horizontal?(quarter===90||quarter===180):(quarter===180||quarter===270)};
}
