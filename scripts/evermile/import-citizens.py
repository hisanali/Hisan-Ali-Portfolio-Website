"""Bake the Mixamo walk/idle onto Michelle, preserving original textures and joint lengths."""
import bpy,pathlib,math
from mathutils import Matrix,Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).resolve().parent/'source/imported'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SRC/'Soldier.glb'))
source=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');source.name='MotionSource';sourceObjects=set(bpy.context.scene.objects)
actions={a.name:a for a in bpy.data.actions}
for tr in source.animation_data.nla_tracks:tr.mute=True
bpy.ops.import_scene.gltf(filepath=str(SRC/'Michelle.glb'))
target=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE' and o!=source);target.name='CitizenRig'
for tr in list(target.animation_data.nla_tracks):target.animation_data.nla_tracks.remove(tr)
target.animation_data.action=None
# The two source characters face opposite directions in their exported root transforms.
source.matrix_world=Matrix.Rotation(math.pi,4,'Z')@source.matrix_world
bpy.context.view_layer.update()
name=lambda n:n.replace('mixamorig:','').replace('mixamorig','')
sm={name(b.name):b for b in source.data.bones};tm={name(b.name):b for b in target.data.bones}
srest={n:source.matrix_world@b.matrix_local for n,b in sm.items()};trest={n:target.matrix_world@b.matrix_local for n,b in tm.items()}
heightRatio=trest['Hips'].translation.z/srest['Hips'].translation.z
frames={}
for label in ['Walk','Idle']:
 src=actions[label];source.animation_data.action=src
 lo,hi=src.frame_range;length=hi-lo;count=int(length)
 samples=[]
 for f in range(count+1):
  bpy.context.scene.frame_set(int(lo+f),subframe=(lo+f)%1);bpy.context.view_layer.update()
  samples.append({n:source.matrix_world@source.pose.bones[b.name].matrix for n,b in sm.items()})
 frames[label]=samples
source.animation_data.action=None
for label,samples in frames.items():
 action=bpy.data.actions.new(label+'_Imported');target.animation_data.action=action
 for frame,poses in enumerate(samples):
  bpy.context.scene.frame_set(frame)
  targetWorld={}
  for n,b in tm.items():
   rest=trest[n];src=poses.get(n);rot=(src.to_quaternion()@srest[n].to_quaternion().inverted()@rest.to_quaternion()) if src else rest.to_quaternion()
   parent=name(b.parent.name) if b.parent else None
   if parent in targetWorld:
    head=targetWorld[parent]@(trest[parent].inverted()@rest.translation)
   else:
    head=rest.translation.copy()
    if n=='Hips':head.z+=(poses[n].translation.z-srest[n].translation.z)*heightRatio
   world=Matrix.Translation(head)@rot.to_matrix().to_4x4()@Matrix.Diagonal((*rest.to_scale(),1));targetWorld[n]=world
   pb=target.pose.bones[b.name];pb.matrix=target.matrix_world.inverted()@world;bpy.context.view_layer.update()
   pb.rotation_mode='QUATERNION';pb.keyframe_insert('location',frame=frame);pb.keyframe_insert('rotation_quaternion',frame=frame)
  # No horizontal root translation: game locomotion owns movement.
 track=target.animation_data.nla_tracks.new();track.name=label;track.strips.new(label,0,action);track.mute=True;target.animation_data.action=None
for tr in target.animation_data.nla_tracks:tr.mute=False
for o in sourceObjects:
 if o.name in bpy.data.objects:bpy.data.objects.remove(o,do_unlink=True)
for mat in bpy.data.materials:
 if mat.use_nodes:
  bs=mat.node_tree.nodes.get('Principled BSDF')
  if bs:bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.85
bpy.context.scene.render.fps=24;bpy.context.scene.frame_set(0)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'evermile/assets/models/citizen-michelle.glb'),export_format='GLB',export_animation_mode='NLA_TRACKS',export_force_sampling=True)
