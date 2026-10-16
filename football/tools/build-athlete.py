import bpy, re, os, sys
from pathlib import Path
source = Path(sys.argv[sys.argv.index("--") + 1])
output = Path(sys.argv[sys.argv.index("--") + 2])
motion_source=Path(sys.argv[sys.argv.index('--')+3]) if len(sys.argv)>sys.argv.index('--')+3 else source
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(source/'character.fbx'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
# Canonical Mixamo bone names let source action channels target this skeleton.
for b in rig.data.bones:b.name=re.sub(r'^.*:', '', b.name)
rig.name='Footballer'
for o in list(bpy.data.objects):
 if o.type=='MESH':
  part=o.name.split('_')[-1]
  mat=bpy.data.materials.new(part);mat.diffuse_color=({'Body':(.54,.32,.20,1),'Hair':(.035,.019,.012,1),'Eyelashes':(.025,.018,.01,1),'Shirt':(.8,.8,.8,1),'Shorts':(.025,.03,.04,1),'Socks':(.85,.85,.85,1),'Shoes':(.025,.03,.035,1)}.get(part,(.5,.5,.5,1)))
  mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.68
  o.data.materials.clear();o.data.materials.append(mat)
  # Keep detailed face and kit; reduce hair cards to mobile density.
  if part in ['Hair','Eyelashes']:
   mod=o.modifiers.new('Mobile hair','DECIMATE');mod.ratio=.55;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
# One package includes a lighter skinned mesh set for larger phone matches.
# Shared armature/actions keep all LOD animation poses identical.
for original in list(bpy.data.objects):
 if original.type=='MESH':
  low=original.copy();low.data=original.data.copy();low.name=original.name+'__LOD'
  bpy.context.collection.objects.link(low)
  mod=low.modifiers.new('Mobile match LOD','DECIMATE');mod.ratio=.42
  bpy.context.view_layer.objects.active=low;bpy.ops.object.modifier_apply(modifier=mod.name)
# No original huge embedded textures are needed by the new PBR materials.
if rig.animation_data:rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
base=set(bpy.data.objects)
for name in ['idle','ready','dive','dive2','celebrate','sprint','jog','backpedal','strafe-left','strafe-right','pass-short','pass-long','strike','trap','slide','tackle','header','throw-in','catch','punch','keeper-throw','goal-kick','celebrate2','celebrate3','turn90','turn180','dribble-jog','pass-ground']:
 path=source/(name+'.fbx')
 if not path.exists():path=motion_source/(name+'.fbx')
 bpy.ops.import_scene.fbx(filepath=str(path))
 objs=set(bpy.data.objects)-base
 src=next(o for o in objs if o.type=='ARMATURE')
 a=src.animation_data.action
 print('ACTION',name,a.frame_range[:], 'scale',src.scale[:],flush=True)
 for fc in a.fcurves:
  fc.data_path=re.sub(r'pose.bones\["[^"\]]*:', 'pose.bones["', fc.data_path)
  fc.data_path=fc.data_path.replace('mixamorig','')
 a.name=name
 for fc in list(a.fcurves):
  if not fc.data_path.startswith('pose.bones['):a.fcurves.remove(fc)
 # FK local rotations work on the common Mixamo bind skeleton; scale hips translations to target height.
 srcH=next(b for b in src.data.bones if b.name.endswith(':Hips') or b.name=='mixamorigHips' or b.name=='Hips')
 targetH=rig.data.bones['Hips']
 ratio=targetH.head_local.y/srcH.head_local.y if abs(srcH.head_local.y)>.001 else 1
 for fc in a.fcurves:
  if fc.data_path=='pose.bones["Hips"].location':
   for k in fc.keyframe_points:k.co.y*=ratio;k.handle_left.y*=ratio;k.handle_right.y*=ratio
 rig.animation_data_create();rig.animation_data.action=a
 if hasattr(a,'slots') and len(a.slots):rig.animation_data.action_slot=a.slots[0]
 a.use_fake_user=True
 rig.animation_data.action=None
 for o in objs:bpy.data.objects.remove(o,do_unlink=True)
rig.scale=(.01,.01,.01)
rig.rotation_euler=(1.57079632679,0,0)
rig.location=(0,0,0)
for b in rig.pose.bones:b.matrix_basis.identity()
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
# Export independent actions, compressed with Blender's bundled Draco encoder.
bpy.context.scene.render.fps=30
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output.resolve()),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_anim_slide_to_zero=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=14,export_draco_normal_quantization=10,export_draco_texcoord_quantization=12)
