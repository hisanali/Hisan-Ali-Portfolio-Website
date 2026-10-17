import {filters, type FabricImage} from "fabric";
/** Tint RGB pixels without changing alpha, source files, crop or transforms. */
export function tintImage(image:FabricImage,colour:string|null) {
  if(colour!==null && !/^#[a-f0-9]{6}$/i.test(colour)) throw new Error("Choose a valid artwork colour.");
  image.filters=image.filters.filter(filter=>!(filter instanceof filters.BlendColor && filter.mode==='tint'));
  if(colour) image.filters.push(new filters.BlendColor({color:colour,mode:'tint',alpha:1}));
  image.set('tintColor' as any,colour);
  image.applyFilters();
  image.set('dirty',true);
}
