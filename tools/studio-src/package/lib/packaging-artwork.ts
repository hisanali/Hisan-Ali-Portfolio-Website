/** Find separate printed marks on a solid-colour panel. Never alters the input. */
export type ArtworkRegion = {x:number;y:number;width:number;height:number};
export function artworkRegions(pixels:Uint8ClampedArray,width:number,height:number,pxPerMm:number) {
  const histogram=new Map<number,number>();
  for(let i=0;i<pixels.length;i+=16) {
    const key=(pixels[i]>>3)*1024+(pixels[i+1]>>3)*32+(pixels[i+2]>>3);
    histogram.set(key,(histogram.get(key)||0)+1);
  }
  const dominant=[...histogram].sort((a,b)=>b[1]-a[1])[0];
  if(!dominant || dominant[1]/(pixels.length/16)<.45) return null;
  const key=dominant[0], bucket=[(key>>10)*8,((key>>5)&31)*8,(key&31)*8];
  const sums=[0,0,0];let count=0;
  for(let i=0;i<pixels.length;i+=4) if(Math.abs(pixels[i]-bucket[0]-3.5)<4.1 && Math.abs(pixels[i+1]-bucket[1]-3.5)<4.1 && Math.abs(pixels[i+2]-bucket[2]-3.5)<4.1) {
    sums[0]+=pixels[i];sums[1]+=pixels[i+1];sums[2]+=pixels[i+2];count++;
  }
  const background=sums.map(v=>Math.round(v/Math.max(1,count)));
  const mask=new Uint8Array(width*height), queue=new Int32Array(width*height);
  const [red,green,blue]=background;
  for(let n=0,i=0;n<mask.length;n++,i+=4) if(Math.abs(pixels[i]-red)>14 || Math.abs(pixels[i+1]-green)>14 || Math.abs(pixels[i+2]-blue)>14)mask[n]=1;
  const regions:ArtworkRegion[]=[];
  for(let n=0;n<mask.length;n++) {
    if(!mask[n])continue;
    let head=0,tail=1,minX=n%width,maxX=minX,minY=Math.floor(n/width),maxY=minY,area=0;
    queue[0]=n;mask[n]=0;
    while(head<tail) {
      const at=queue[head++],x=at%width,y=Math.floor(at/width);area++;
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const xx=x+dx,yy=y+dy,ix=yy*width+xx;
        if(xx>=0&&xx<width&&yy>=0&&yy<height&&mask[ix]){mask[ix]=0;queue[tail++]=ix;}
      }
    }
    // Cutter outlines and large background shapes stay in the original backdrop.
    if(area<2 || (maxX-minX>width*.8 && maxY-minY>height*.8))continue;
    if((minX<2||minY<2||maxX>width-3||maxY>height-3)&&((maxX-minX)>width*.7||(maxY-minY)>height*.7))continue;
    regions.push({x:Math.max(0,minX-2),y:Math.max(0,minY-2),width:Math.min(width-1,maxX+2)-Math.max(0,minX-2)+1,height:Math.min(height-1,maxY+2)-Math.max(0,minY-2)+1});
  }
  const gap=Math.max(3,pxPerMm*1.5);
  // Join letters into lines and nearby parts of a logo. Keep distant artwork separate.
  for(let changed=true;changed;) {
    changed=false;
    outer:for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++) {
      const a=regions[i],b=regions[j];
      const gx=Math.max(0,a.x-b.x-b.width,b.x-a.x-a.width),gy=Math.max(0,a.y-b.y-b.height,b.y-a.y-a.height);
      if((gx<=gap&&gy===0)||(gy<=gap*.4&&gx===0)) {
        const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);
        regions[i]={x,y,width:Math.max(a.x+a.width,b.x+b.width)-x,height:Math.max(a.y+a.height,b.y+b.height)-y};
        regions.splice(j,1);changed=true;break outer;
      }
    }
  }
  const useful=regions.filter(r=>r.width*r.height>Math.max(12,pxPerMm*pxPerMm));
  if(useful.length>80)return null;
  return {background,regions:useful.sort((a,b)=>a.y-b.y||a.x-b.x)};
}

export async function separatePanelArtwork(source:HTMLCanvasElement,pxPerMm:number) {
  const ctx=source.getContext('2d')!;
  const pixels=ctx.getImageData(0,0,source.width,source.height);
  const found=typeof Worker === "undefined" ? artworkRegions(pixels.data,source.width,source.height,pxPerMm) : await import("../packaging/artwork-task").then(m => m.workerArtworkRegions(pixels.data,source.width,source.height,pxPerMm));
  if(!found)return null;
  const backdrop=document.createElement('canvas');backdrop.width=source.width;backdrop.height=source.height;
  const back=backdrop.getContext('2d')!;back.drawImage(source,0,0);
  const blob=(c:HTMLCanvasElement)=>new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Artwork extraction failed')),'image/png'));
  const foreground=document.createElement('canvas');foreground.width=source.width;foreground.height=source.height;
  const front=foreground.getContext('2d')!;
  const pieces:ArtworkRegion[]=[];
  for(const r of found.regions) {
    const tile=document.createElement('canvas');tile.width=r.width;tile.height=r.height;
    const tc=tile.getContext('2d')!,data=ctx.getImageData(r.x,r.y,r.width,r.height);
    for(let i=0;i<data.data.length;i+=4) {
      // Remove the paper colour without leaving white rectangles around marks.
      let alpha=0;
      for(let c=0;c<3;c++) {
        const b=found.background[c],p=data.data[i+c];
        alpha=Math.max(alpha,p<b?(b-p)/Math.max(1,b):(p-b)/Math.max(1,255-b));
      }
      if(alpha<.025){data.data[i+3]=0;continue;}
      for(let c=0;c<3;c++)data.data[i+c]=Math.max(0,Math.min(255,(data.data[i+c]-found.background[c]*(1-alpha))/alpha));
      data.data[i+3]=Math.round(alpha*255);
    }
    tc.putImageData(data,0,0);
    back.fillStyle=`rgb(${found.background.join(',')})`;back.fillRect(r.x,r.y,r.width,r.height);
    front.drawImage(tile,r.x,r.y);
    pieces.push(r);
  }
  return {backdrop:await blob(backdrop),foreground:await blob(foreground),pieces};
}
