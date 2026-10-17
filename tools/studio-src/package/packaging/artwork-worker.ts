import { artworkRegions } from "../lib/packaging-artwork";
self.onmessage = (event: MessageEvent<{pixels:ArrayBuffer;width:number;height:number;scale:number}>) => {
  try {
    const {pixels,width,height,scale}=event.data;
    self.postMessage({result:artworkRegions(new Uint8ClampedArray(pixels),width,height,scale)});
  } catch {
    self.postMessage({error:"Artwork extraction failed. Your current project is unchanged."});
  }
};
