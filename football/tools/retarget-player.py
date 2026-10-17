"""Retarget licensed Mixamo FBX/GLB motion onto a downloaded skinned GLB.
Usage: blender -b --python retarget-player.py -- input.glb output.glb height base_fbx extra_fbx
Source and target bind orientations are compared in world space. The mesh's
weights, UVs and textures are retained; authored rest poses are baked before retargeting.
Adult squad sock cuffs and fitted boots are prepared in the same export.
"""
import bpy, sys, re, math
from pathlib import Path
from mathutils import Vector, Quaternion
args=sys.argv[sys.argv.index('--')+1:]
source,output=Path(args[0]),Path(args[1]);height=float(args[2]);folders=[Path(x) for x in args[3:]]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
# Imported rigs may store the displayed T-pose as non-identity pose transforms.
# Bake that pose for EVERY model before clearing animation. Clearing it first
# restores a bent bind pose and folds the arms inward when motion is retargeted.
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
is_cc=any(b.name.startswith('CC_Base_') for b in rig.data.bones)
if is_cc:
 bpy.context.view_layer.update()
 def cc_bone(side,part):
  return next(b for b in rig.pose.bones if b.name.startswith(f'CC_Base_{side}_{part}_') and not b.name.endswith('scaleCompensation'))
 lateral=(rig.matrix_world.to_3x3()@(cc_bone('L','Upperarm').head-cc_bone('R','Upperarm').head)).normalized()
 for side,axis in [('L',lateral),('R',-lateral)]:
  for part,child in [('Upperarm','Forearm'),('Forearm','Hand')]:
   pb=next(b for b in rig.pose.bones if b.name.startswith(f'CC_Base_{side}_{part}_') and not b.name.endswith('scaleCompensation'))
   end=next(b for b in rig.pose.bones if b.name.startswith(f'CC_Base_{side}_{child}_') and not b.name.endswith('scaleCompensation'))
   origin=rig.matrix_world@pb.head;direction=(rig.matrix_world@end.head)-origin
   delta=direction.normalized().rotation_difference(axis)
   from mathutils import Matrix
   pb.matrix=rig.matrix_world.inverted()@Matrix.Translation(origin)@delta.to_matrix().to_4x4()@Matrix.Translation(-origin)@rig.matrix_world@pb.matrix
   bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
baked={o:bpy.data.meshes.new_from_object(o.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps) for o in bpy.context.scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers)}
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT')
for o,data in baked.items():o.data=data
rig.animation_data_clear()
# Remove importer-generated bone display meshes, which are not model geometry.
for o in list(bpy.data.objects):
 if o.type=='MESH' and not any(m.type=='ARMATURE' for m in o.modifiers):bpy.data.objects.remove(o,do_unlink=True)
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
mapping={'CC_Base_Hip':'Hips','CC_Base_Waist':'Spine','CC_Base_Spine01':'Spine1','CC_Base_Spine02':'Spine2','CC_Base_NeckTwist01':'Neck','CC_Base_Head':'Head'}
for side,long in [('L','Left'),('R','Right')]:
 for src,dst in {'Thigh':'UpLeg','Calf':'Leg','Foot':'Foot','ToeBase':'ToeBase','Clavicle':'Shoulder','Upperarm':'Arm','Forearm':'ForeArm','Hand':'Hand'}.items():mapping['CC_Base_'+side+'_'+src]=long+dst
 for finger,dst in [('Thumb','Thumb'),('Index','Index'),('Mid','Middle'),('Ring','Ring'),('Pinky','Pinky')]:
  for i in range(1,4):mapping[f'CC_Base_{side}_{finger}{i}']=f'{long}Hand{dst}{i}'
for bone in rig.data.bones:
 name=re.sub(r'_0\d+$','',bone.name.split(':')[-1]);bone.name=mapping.get(name,name)
rig.name='MatchAthlete'
for bone in rig.pose.bones:bone.matrix_basis.identity();bone.rotation_mode='QUATERNION'
bpy.context.view_layer.update()
meshes=[o for o in bpy.data.objects if o.type=='MESH']
coords=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
low=min(v.z for v in coords);high=max(v.z for v in coords);factor=height/(high-low)
# Keep a single parent normalization transform so inverse bind matrices stay valid.
normalizer=bpy.data.objects.new('PlayerOrigin',None);bpy.context.collection.objects.link(normalizer)
roots=[o for o in bpy.context.scene.objects if o.parent is None and o!=normalizer]
for o in roots:o.parent=normalizer
# Align left/right anatomical axes to Mixamo before comparing bind rotations.
side=rig.matrix_world.to_3x3()@(rig.data.bones['LeftArm'].head_local-rig.data.bones['RightArm'].head_local)
normalizer.rotation_euler.z=-math.atan2(side.y,side.x)
normalizer.scale=(factor,)*3
cx=(min(v.x for v in coords)+max(v.x for v in coords))/2
cy=(min(v.y for v in coords)+max(v.y for v in coords))/2
offset=normalizer.rotation_euler.to_matrix()@Vector((-cx*factor,-cy*factor,-low*factor))
normalizer.location=offset
bpy.context.view_layer.update()
# Each mesh keeps its authored material; meaningful names are assigned by bounds.
for mesh in meshes:
 mat=mesh.data.materials[0] if mesh.data.materials else None
 if mat:
  mat.use_nodes=True
  bs=mat.node_tree.nodes.get('Principled BSDF')
  if bs:bs.inputs['Roughness'].default_value=.76;bs.inputs['Metallic'].default_value=0
 mesh.name='PlayerPart_'+str(mesh.name)
# Target rest rotations, including the global importer axis/scale transforms.
rest={b.name:(rig.matrix_world@b.matrix_local).to_quaternion() for b in rig.data.bones}
arm_rot=rig.matrix_world.to_quaternion()
local_rest={b.name:((rest[b.parent.name].inverted() if b.parent else arm_rot.inverted())@rest[b.name]) for b in rig.data.bones}
base=set(bpy.data.objects)
clip_names=['walk','idle','ready','dive','dive2','celebrate','sprint','jog','backpedal','strafe-left','strafe-right','pass-short','pass-long','strike','trap','slide','tackle','header','throw-in','catch','punch','keeper-throw','goal-kick','celebrate2','celebrate3','turn90','turn180','dribble-jog','pass-ground']
for name in clip_names:
 path=next((folder/(name+ext) for ext in ['.glb','.fbx'] for folder in folders if (folder/(name+ext)).exists()),None)
 if not path:raise RuntimeError('Missing motion '+name)
 before_actions=set(bpy.data.actions)
 if path.suffix=='.glb':bpy.ops.import_scene.gltf(filepath=str(path))
 else:bpy.ops.import_scene.fbx(filepath=str(path))
 created=set(bpy.data.objects)-base
 source_actions=set(bpy.data.actions)-before_actions
 src=next(o for o in created if o.type=='ARMATURE');act=next((a for a in source_actions if a.name=='Walk'),src.animation_data.action)
 if path.suffix=='.glb':src.animation_data.action=next(a for a in source_actions if a.name=='TPose')
 for bone in src.data.bones:bone.name=bone.name.split(':')[-1].replace('mixamorig','')
 # Blender bone renaming updates animation paths.
 start,end=math.floor(act.frame_range[0]),math.ceil(act.frame_range[1]);fps=bpy.context.scene.render.fps
 if path.suffix=='.glb':
  bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
  space=bpy.data.objects.new('MotionAlignment',None);bpy.context.collection.objects.link(space)
  lateral=src.matrix_world.to_3x3()@(src.pose.bones['LeftArm'].head-src.pose.bones['RightArm'].head)
  for obj in list(created):
   if obj.parent not in created:obj.parent=space
  space.rotation_euler.z=-math.atan2(lateral.y,lateral.x);created.add(space);bpy.context.view_layer.update()
  src_rest={b.name:(src.matrix_world@b.matrix).to_quaternion() for b in src.pose.bones}
  src_hip=src.matrix_world@src.pose.bones['Hips'].head
  src.animation_data.action=act
 else:
  src_rest={b.name:(src.matrix_world@b.matrix_local).to_quaternion() for b in src.data.bones}
  src_hip=(src.matrix_world@src.data.bones['Hips'].head_local)
 target_hip=rig.matrix_world@rig.data.bones['Hips'].head_local
 ratio=target_hip.z/max(.01,src_hip.z)
 rig.animation_data_create();out_action=bpy.data.actions.new(name);rig.animation_data.action=out_action
 # Cache target local root-space vertical conversion, including scale.
 hip=rig.pose.bones['Hips'];parent_world=rig.matrix_world@(hip.parent.bone.matrix_local if hip.parent else __import__('mathutils').Matrix.Identity(4))
 vertical_local=(parent_world.to_3x3()@local_rest['Hips'].to_matrix()).inverted()@Vector((0,0,1))
 max_arm_error=0
 for frame in range(start,end+1):
  bpy.context.scene.frame_set(frame);desired={}
  for pb in rig.pose.bones:
   parent=desired.get(pb.parent.name,rest[pb.parent.name]) if pb.parent else arm_rot
   if pb.name not in src_rest:
    world=parent@local_rest[pb.name]
   else:
    source_pose=(src.matrix_world@src.pose.bones[pb.name].matrix).to_quaternion()
    delta=source_pose@src_rest[pb.name].inverted()
    world=delta@rest[pb.name]
   desired[pb.name]=world
   pb.rotation_quaternion=local_rest[pb.name].inverted()@parent.inverted()@world
   pb.keyframe_insert('rotation_quaternion',frame=frame-start,group=pb.name)
  delta_z=((src.matrix_world@src.pose.bones['Hips'].head).z-src_hip.z)*ratio
  hip.location=vertical_local*delta_z;hip.keyframe_insert('location',frame=frame-start,group='Hips')
  # A finite bounding box does not catch folded arms. Compare actual anatomical
  # segment directions against the source motion across every baked frame.
  bpy.context.view_layer.update()
  for side in ['Left','Right']:
   for upper,lower in [('Arm','ForeArm'),('ForeArm','Hand')]:
    a,b=side+upper,side+lower
    expected=src.matrix_world.to_3x3()@(src.pose.bones[b].head-src.pose.bones[a].head)
    actual=rig.matrix_world.to_3x3()@(rig.pose.bones[b].head-rig.pose.bones[a].head)
    max_arm_error=max(max_arm_error,math.degrees(actual.angle(expected)))
 if max_arm_error>12:raise RuntimeError(f'{name}: arm retarget deviates {max_arm_error:.2f} degrees from source')
 print('ARM_DIRECTION_ERROR',name,round(max_arm_error,3),flush=True)
 out_action.use_fake_user=True;rig.animation_data.action=None
 for pb in rig.pose.bones:pb.matrix_basis.identity()
 for o in created:bpy.data.objects.remove(o,do_unlink=True)
 for source_action in source_actions:bpy.data.actions.remove(source_action)
 print('RETARGET',name,end-start+1,'frames',flush=True)
if is_cc:
 # Add knee socks to the existing leg skin without changing silhouette or weights.
 socks=bpy.data.materials.new('Match_Socks');socks.diffuse_color=(.89,.90,.86,1)
 for mesh in meshes:
  if any(m and m.name.startswith('Std_Skin_Leg') for m in mesh.data.materials):
   # Split triangles at the cuff instead of recolouring whole knee polygons.
   import bmesh
   bm=bmesh.new();bm.from_mesh(mesh.data)
   bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=0.000001,plane_co=mesh.matrix_world.inverted()@Vector((0,0,.43)),plane_no=mesh.matrix_world.to_3x3().transposed()@Vector((0,0,1)),clear_inner=False,clear_outer=False)
   bm.to_mesh(mesh.data);bm.free()
   idx=len(mesh.data.materials);mesh.data.materials.append(socks)
   for poly in mesh.data.polygons:
    z=sum((mesh.matrix_world@mesh.data.vertices[i].co).z for i in poly.vertices)/len(poly.vertices)
    if z<.43:poly.material_index=idx
if is_cc:
 # Replace the squad's casual high-top shoes with fitted football boots.
 for mesh in list(meshes):
  if any(m and m.name.lower()=='boots' for m in mesh.data.materials):meshes.remove(mesh);bpy.data.objects.remove(mesh,do_unlink=True)
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(output.parent/'ronaldo.glb'));added=set(bpy.data.objects)-before
 bootrig=next(o for o in added if o.type=='ARMATURE');bootrig.animation_data_clear()
 for pb in bootrig.pose.bones:pb.matrix_basis.identity()
 bpy.context.view_layer.update()
 boots=next(o for o in added if o.type=='MESH' and any(m and m.name.startswith('t0167_0mat') for m in o.data.materials) and o.name.endswith('__MID'))
 # Work on a retained copy; every original group has the same canonical bone name.
 fitted=boots.copy();fitted.data=boots.data.copy();bpy.context.collection.objects.link(fitted)
 fitted.name='PlayerPart_MatchBoots';world=boots.matrix_world.copy();fitted.parent=rig;fitted.matrix_parent_inverse.identity();fitted.matrix_basis.identity()
 for mod in fitted.modifiers:
  if mod.type=='ARMATURE':mod.object=rig
 inv=rig.matrix_world.inverted()
 def side_of(v):
  return 'Left' if sum(g.weight for g in v.groups if fitted.vertex_groups[g.group].name.startswith('Left'))>.5 else 'Right'
 for side in ['Left','Right']:
  verts=[v for v in fitted.data.vertices if side_of(v)==side];points=[world@v.co for v in verts]
  feet=[mesh.matrix_world@v.co for mesh in meshes if any(m and m.name.startswith('Std_Skin_Leg') for m in mesh.data.materials) for v in mesh.data.vertices]
  feet=[v for v in feet if v.z<.085 and (v.x>0)==(side=='Left')]
  lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
  flo=Vector(tuple(min(v[i] for v in feet) for i in range(3)));fhi=Vector(tuple(max(v[i] for v in feet) for i in range(3)))
  center=(flo+fhi)/2;extent=fhi-flo;oldcenter=(lo+hi)/2;oldextent=hi-lo
  for v in verts:
   q=world@v.co
   q.x=center.x+(q.x-oldcenter.x)*extent.x/oldextent.x*1.15
   q.y=center.y+(q.y-oldcenter.y)*extent.y/oldextent.y*1.12
   q.z=(q.z-lo.z)*.93-.003
   v.co=inv@q
 meshes.append(fitted)
 for o in added:bpy.data.objects.remove(o,do_unlink=True)
 for a in list(bpy.data.actions):
  if a.name not in clip_names:bpy.data.actions.remove(a)
# Keep only target clips; all runups are controlled by the game, with vertical
# hips motion retained. Export full mesh and a reduced tier sharing the rig.
for mesh in meshes:
 mesh.name+='__MID'
 lowmesh=mesh.copy();lowmesh.data=mesh.data.copy();lowmesh.name=mesh.name.replace('__MID','__LOD');bpy.context.collection.objects.link(lowmesh)
 dec=lowmesh.modifiers.new('Match distance','DECIMATE');dec.ratio=.55;bpy.context.view_layer.objects.active=lowmesh;bpy.ops.object.modifier_apply(modifier=dec.name)
for pb in rig.pose.bones:pb.matrix_basis.identity()
bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
# Only export objects in the scene (not importer custom shapes).
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_anim_slide_to_zero=True,export_image_format='AUTO')
print('EXPORTED',output,flush=True)
