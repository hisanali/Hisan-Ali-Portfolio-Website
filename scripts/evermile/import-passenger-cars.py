"""Convert Comrade1280's CC-BY passenger cars to metre-scaled, wheel-separated GLBs."""
import bpy,pathlib
from mathutils import Vector,Matrix
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).resolve().parent/'source/passenger-cars'
colors={'sedan':'SedanYellow','hatchback':'HatchbackYellow','suv':'SUVBlack','wagon':'WagonBlue','pickup':'PickupGreen','multivan':'MinivanRed'}
lengths={'sedan':4.6,'hatchback':4.1,'suv':4.7,'wagon':4.85,'pickup':5.3,'multivan':5.0}
for kind,texture in colors.items():
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=str(SRC/'models/import'/f'{kind}.fbx'))
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
 for o in objects:
  world=o.matrix_world.copy();o.parent=None;o.data.transform(world);o.matrix_world=Matrix.Identity(4)
 pts=[v.co for o in objects for v in o.data.vertices];lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)]);center=(lo+hi)/2;scale=lengths[kind]/(hi.y-lo.y)
 for o in objects:
  for v in o.data.vertices:
   v.co=(v.co-Vector((center.x,center.y,lo.z)))*scale;v.co.x*=-1;v.co.y*=-1
  if o.name.lower().startswith('wheel'):
   pts=[v.co for v in o.data.vertices];c=Vector([(min(p[i] for p in pts)+max(p[i] for p in pts))/2 for i in range(3)])
   for v in o.data.vertices:v.co-=c
   o.location=c;o.name='Wheel_'+('F' if c.y<0 else 'R')+('L' if c.x>0 else 'R')
  else:o.name='Body'
 for m in bpy.data.materials:
  if not m.use_nodes:continue
  bs=m.node_tree.nodes.get('Principled BSDF')
  if m.name.startswith('Glass'):
   bs.inputs['Base Color'].default_value=(.065,.11,.15,1);bs.inputs['Roughness'].default_value=.14;bs.inputs['Metallic'].default_value=.2;bs.inputs['Coat Weight'].default_value=.8
  else:
   name=texture+'.png' if m.name.startswith('Body') else 'lights.jpg' if m.name.startswith('Optics') else None
   images=[n for n in m.node_tree.nodes if n.type=='TEX_IMAGE']
   if not name and images:name=pathlib.Path(images[0].image.filepath).name
   if name and (SRC/'textures'/name).exists():
    image=bpy.data.images.load(str(SRC/'textures'/name),check_existing=True)
    if max(image.size)>1024:image.scale(1024,1024)
    image.pack()
    node=images[0] if images else m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;m.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color'])
   bs.inputs['Metallic'].default_value=.38 if m.name.startswith('Body') else .12
   bs.inputs['Roughness'].default_value=.28 if m.name.startswith('Body') else .58
   if m.name.startswith('Body'):bs.inputs['Coat Weight'].default_value=.8;m.name='BodyPaint'
 # Keep real lamp geometry and expose anchors for the game's lighting system.
 body=next(o for o in objects if o.name=='Body');body.data.update()
 for end in ['Head','Tail']:
  for side in ['L','R']:
   verts=[]
   for face in body.data.polygons:
    mat=body.data.materials[face.material_index]
    if mat.name.startswith('Optics') and (face.center.y<0)==(end=='Head') and (face.center.x>0)==(side=='L'):verts.extend(body.data.vertices[i].co for i in face.vertices)
   if verts:
    p=Vector([(min(v[i] for v in verts)+max(v[i] for v in verts))/2 for i in range(3)]);o=bpy.data.objects.new(end+side,None);bpy.context.collection.objects.link(o);o.location=p
 for end in ['Head','Tail']:
  optics=next(m for m in body.data.materials if m.name.startswith('Optics'));mat=optics.copy();mat.name=end+'Lens';body.data.materials.append(mat);slot=len(body.data.materials)-1
  bs=mat.node_tree.nodes.get('Principled BSDF');tex=next((n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE'),None)
  if tex:mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color'])
  bs.inputs['Emission Strength'].default_value=.15
  for face in body.data.polygons:
   if body.data.materials[face.material_index].name.startswith('Optics') and (face.center.y<0)==(end=='Head'):face.material_index=slot
 for o in list(bpy.context.scene.objects):
  if o.type=='EMPTY' and o.name not in ['HeadL','HeadR','TailL','TailR']:bpy.data.objects.remove(o,do_unlink=True)
 out=ROOT/'evermile/assets/models'/('road-'+{'hatchback':'hatch','multivan':'van'}.get(kind,kind)+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_extras=True,export_animations=False)
 print('EXPORTED',out.name,flush=True)
