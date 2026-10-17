import type {StudioProject} from "./packaging-document";
export function changePackageMaterial(project:StudioProject,material:StudioProject['material']):StudioProject {
  return {...project,material,finish:"matte",panels:Object.fromEntries(Object.entries(project.panels).map(([id,p])=>[id,{
    ...p,color:material==='kraft'?'#b78b56':'#faf9f6',insideColor:material==='kraft'?'#b78b56':'#f1eee7',
    objects:p.objects.filter(o=>o.name!=='Imported background'),
  }]))};
}
