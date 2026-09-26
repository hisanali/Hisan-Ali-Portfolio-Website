"""Prepare free animated animals; retain source rigs and clips, add fox facial details."""
import bpy,pathlib,bmesh
from mathutils import Matrix,Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).resolve().parent/'source/imported'
for kind,file in [('sheep','Sheep.gltf'),('cow','cow-rig.glb'),('dog','dog-rig.glb'),('fox','fox.glb')]:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 src=ROOT/'evermile/assets/models/fox.glb' if kind=='fox' else SRC/file
 bpy.ops.import_scene.gltf(filepath=str(src));arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 if kind=='fox':
  mat=bpy.data.materials.new('EyesNoseMouth');mat.diffuse_color=(.008,.006,.004,1);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.26
  def bind(o):
   world=o.matrix_world.copy();bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.data.transform(arm.matrix_world.inverted());o.parent=arm;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_basis=Matrix.Identity(4)
   vg=o.vertex_groups.new(name='b_Head_05');vg.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('FaceRig','ARMATURE');mod.object=arm;o.data.materials.append(mat)
  for name,position,scale in [('EyeL',(8.7,-51.5,64),(1.35,1.2,1.25)),('EyeR',(-8.7,-51.5,64),(1.35,1.2,1.25)),('Nose',(0,-66.7,55),(1.8,1.1,1.2))]:
   bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=position);o=bpy.context.object;o.name=name;o.scale=scale;bind(o)
  curve=bpy.data.curves.new('MouthCurve','CURVE');curve.dimensions='3D';curve.bevel_depth=.32;curve.bevel_resolution=2;sp=curve.splines.new('POLY');sp.points.add(4)
  for pt,co in zip(sp.points,[(-6,-55.5,54.3),(-3.8,-61.5,53.7),(0,-66.5,53.7),(3.8,-61.5,53.7),(6,-55.5,54.3)]):pt.co=(*co,1)
  o=bpy.data.objects.new('Mouth',curve);bpy.context.collection.objects.link(o);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');bind(bpy.context.object)
 if kind=='sheep':
  for side in [-1,1]:
   for label,offset,scale,color in [('Eye',0,(.055,.09,.065),(.17,.11,.04,1)),('Pupil',.043,(.022,.048,.015),(.002,.002,.002,1))]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=(side*(.45+offset),-2.72,3.92));o=bpy.context.object;o.name='Sheep'+label+str(side);o.scale=scale
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.parent=arm;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_basis=Matrix.Identity(4)
    vg=o.vertex_groups.new(name='Head');vg.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('FaceRig','ARMATURE');mod.object=arm
    m=bpy.data.materials.new(o.name);m.diffuse_color=color;m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color;bs.inputs['Roughness'].default_value=.33;o.data.materials.append(m)
 if True:
  for o in list(bpy.context.scene.objects):
   if o.type=='MESH' and not o.name.startswith('SheepEye') and not o.name.startswith('SheepPupil') and o.name not in ['EyeL','EyeR','Nose','Mouth'] and any(m.type=='ARMATURE' for m in o.modifiers):
    bpy.context.view_layer.objects.active=o
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bm.to_mesh(o.data);bm.free()
    mod=o.modifiers.new('Smooth silhouette','SUBSURF');mod.levels=1;bpy.ops.object.modifier_move_up(modifier=mod.name);bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:p.use_smooth=True
 # Export only rig and skinned meshes, excluding Blender's bone-display helper spheres.
 bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
 for o in bpy.context.scene.objects:
  if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers):o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'evermile/assets/models'/(kind+'-imported.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
 print('EXPORTED',kind,flush=True)
