import {cutterPathData,type CutterPath} from './packaging-contours';
/** Remove coloured cutter ink only where a reviewed structural path exists.
 * Black product illustrations and the original PDF are left untouched. */
export function cleanStructuralInk(canvas:HTMLCanvasElement,paths:CutterPath[],sheetWidth:number,sheetHeight:number) {
  if(!paths.length)return;
  const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
  const m=mask.getContext('2d')!,ctx=canvas.getContext('2d')!;
  m.scale(canvas.width/sheetWidth,canvas.height/sheetHeight);
  m.strokeStyle='#fff';m.lineWidth=.9;m.lineCap='round';m.lineJoin='round';
  for(const path of paths)m.stroke(new Path2D(cutterPathData(path)));
  const region=m.getImageData(0,0,mask.width,mask.height).data,image=ctx.getImageData(0,0,canvas.width,canvas.height),src=new Uint8ClampedArray(image.data);
  const coloured=(at:number)=>{const r=src[at],g=src[at+1],b=src[at+2];return (r>g+24&&b>g+12)||(g>r+20&&g>b+10);};
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++) {
    const at=(y*canvas.width+x)*4;if(!region[at+3]||!coloured(at))continue;
    const votes=new Map<number,{sum:number[];count:number}>();
    for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++) {
      const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=canvas.width||yy>=canvas.height)continue;
      const i=(yy*canvas.width+xx)*4;if(coloured(i))continue;
      const key=(src[i]>>4)*256+(src[i+1]>>4)*16+(src[i+2]>>4),vote=votes.get(key)||{sum:[0,0,0,0],count:0};
      vote.count++;for(let c=0;c<4;c++)vote.sum[c]+=src[i+c];votes.set(key,vote);
    }
    const best=[...votes.values()].sort((a,b)=>b.count-a.count)[0];
    if(best)for(let c=0;c<4;c++)image.data[at+c]=Math.round(best.sum[c]/best.count);
  }
  ctx.putImageData(image,0,0);
}
