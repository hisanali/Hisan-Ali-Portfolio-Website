import type { artworkRegions } from "../lib/packaging-artwork";
export async function workerArtworkRegions(pixels:Uint8ClampedArray,width:number,height:number,scale:number) {
  return await new Promise<ReturnType<typeof artworkRegions>>((resolve,reject) => {
    const worker=new Worker(new URL("./artwork-worker.js",import.meta.url),{type:"module"});
    const stop=()=>{clearTimeout(timer);worker.terminate();};
    const timer=setTimeout(()=>{stop();reject(new Error("This panel took too long to process. Your current project is unchanged; retry the import."));},60000);
    worker.onmessage=event=>{stop();event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.result);};
    worker.onerror=()=>{stop();reject(new Error("Artwork processing could not start. Reload and retry the import."));};
    worker.postMessage({pixels:pixels.buffer,width:width,height:height,scale:scale},[pixels.buffer]);
  });
}
