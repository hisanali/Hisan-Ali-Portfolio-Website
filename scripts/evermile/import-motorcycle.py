"""Prepare the CC0 GYO motorcycle with separate axles and a steering assembly."""
import bpy,bmesh,pathlib
from mathutils import Matrix,Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).resolve().parent/'source/motorcycle'
bpy.ops.wm.open_mainfile(filepath=str(SRC/'GYO.blend'),load_ui=False,use_scripts=False)
obj=bpy.data.objects['fairing'];rig=bpy.data.objects['gyo-rig'];rig.animation_data_clear()
for b in rig.pose.bones:b.matrix_basis=Matrix.Identity(4)
bpy.context.view_layer.update()
# Bake the neutral mesh, keeping original UVs and material assignments.
mesh=obj.data.copy();mesh.transform(obj.matrix_world);bm=bmesh.new();bm.from_mesh(mesh)
unseen=set(bm.verts);parts={'Body':set(),'FrontAssembly':set(),'Wheel_F':set(),'Wheel_R':set()}
while unseen:
 v=unseen.pop();group={v};stack=[v]
 while stack:
  for e in stack.pop().link_edges:
   for v in e.verts:
    if v in unseen:unseen.remove(v);group.add(v);stack.append(v)
 ps=[v.co for v in group];lo=Vector([min(p[i] for p in ps) for i in range(3)]);hi=Vector([max(p[i] for p in ps) for i in range(3)]);c=(lo+hi)/2;dim=hi-lo
 # Tyres, hubs, spokes and discs are concentric disconnected mesh islands.
 wheel=abs(c.z-.381)<.015 and abs(abs(c.y)-.9)<.018 and dim.y>.3 and dim.z>.3
 if wheel:key='Wheel_F' if c.y<0 else 'Wheel_R'
 else:
  weights={}
  for v in group:
   for item in obj.data.vertices[v.index].groups:weights[obj.vertex_groups[item.group].name]=weights.get(obj.vertex_groups[item.group].name,0)+item.weight
  weights={k:v for k,v in weights.items() if k in rig.data.bones}
  dominant=max(weights,key=weights.get) if weights else ''
  key='FrontAssembly' if dominant in ['handle','fork'] else 'Body'
 parts[key].update(v.index for v in group)
bm.free();made=[]
for name,indices in parts.items():
 m=mesh.copy();bm=bmesh.new();bm.from_mesh(m);bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.index not in indices],context='VERTS');bm.to_mesh(m);bm.free()
 o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);made.append(o)
 if name.startswith('Wheel'):
  c=Vector((0,-.897 if name=='Wheel_F' else .906,.381));m.transform(Matrix.Translation(-c));o.location=c
  rubber=bpy.data.materials.new('TyreRubber');rubber.use_nodes=True;bs=rubber.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.013,.015,.017,1);bs.inputs['Roughness'].default_value=.9;bs.inputs['Metallic'].default_value=0;m.materials.append(rubber)
  for face in m.polygons:
   radius=sum((m.vertices[i].co.y**2+m.vertices[i].co.z**2)**.5 for i in face.vertices)/len(face.vertices)
   if radius>.257:face.material_index=len(m.materials)-1
for o in list(bpy.context.scene.objects):
 if o not in made:bpy.data.objects.remove(o,do_unlink=True)
for img in bpy.data.images:
 if img.source=='FILE':
  filename=pathlib.Path(img.filepath).name
  if filename in ['Run.png','Run-N.png','Run-R.png','Run-M.png']:filename=filename.replace('Run','Stand')
  p=SRC/'textures'/filename
  if p.exists():img.filepath=str(p);img.reload()
  if max(img.size)>1024:img.scale(1024,1024)
  img.pack()
for mat in bpy.data.materials:
 if mat.use_nodes and mat.name=='Run':
  bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(0,0,0,1);bs.inputs['Emission Strength'].default_value=0
  mat.surface_render_method='DITHERED'
# Handlebar and headlamp anchors share the actual imported steering frame.
for name,p in [('SteeringPivot',(0,-.536,.768)),('GripL',(.36,-.36,.975)),('GripR',(-.36,-.36,.975))]:
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=p
bpy.ops.export_scene.gltf(filepath=str(ROOT/'evermile/assets/models/motorcycle-gyo.glb'),export_format='GLB',export_animations=False)
print('EXPORTED GYO',[(o.name,len(o.data.vertices)) for o in made],flush=True)
