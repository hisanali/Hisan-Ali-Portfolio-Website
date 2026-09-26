"""Prepare pracalic's CC0 textured sheep with its original rig and an in-place gait."""
import bpy,pathlib,math
from mathutils import Matrix,Quaternion
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).parent/'source/transport/sheep/owca'
bpy.ops.wm.open_mainfile(filepath=str(SRC/'owca.blend'),use_scripts=False)
if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
arm=bpy.data.objects['Armature.002'];mesh=bpy.data.objects['Cylinder.007']
for o in list(bpy.data.objects):
 if o not in [arm,mesh]:bpy.data.objects.remove(o,do_unlink=True)
arm.animation_data_clear();bpy.context.scene.frame_set(1)
print('HEAD',list(arm.data.bones['head'].head_local),list(arm.data.bones['head'].tail_local))
# Original file used Blender Internal texture slots; reconnect the supplied UV maps to PBR.
m=bpy.data.materials.new('SheepWool');m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=.96
tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(SRC/'owcaSkoraG.png'));m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
normal=n.new('ShaderNodeTexImage');normal.image=bpy.data.images.load(str(SRC/'owcaSkoraGN.png'));normal.image.colorspace_settings.name='Non-Color';nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.5;m.node_tree.links.new(normal.outputs['Color'],nm.inputs['Color']);m.node_tree.links.new(nm.outputs['Normal'],bs.inputs['Normal']);mesh.data.materials.clear();mesh.data.materials.append(m)
face=bpy.data.materials.new('SuffolkFace');face.use_nodes=True;bs=face.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.043,.037,.028,1);bs.inputs['Roughness'].default_value=.9;mesh.data.materials.append(face)
headIndex=mesh.vertex_groups['head'].index
for p in mesh.data.polygons:
 p.material_index=1 if sum(sum(g.weight for g in mesh.data.vertices[i].groups if g.group==headIndex) for i in p.vertices)/len(p.vertices)>.55 else 0;p.use_smooth=True
# Real side-set eyes and nostrils replace the source's painted cartoon eyes.
for name,pos,size,color in [('EyeL',(-.54,1.43,.72),(.09,.105,.085),(.11,.068,.018)),('EyeR',(.54,1.43,.72),(.09,.105,.085),(.11,.068,.018)),('PupilL',(-.625,1.43,.72),(.012,.06,.025),(.002,.002,.001)),('PupilR',(.625,1.43,.72),(.012,.06,.025),(.002,.002,.001)),('NostrilL',(-.18,2.44,.13),(.07,.015,.038),(.004,.003,.002)),('NostrilR',(.18,2.44,.13),(.07,.015,.038),(.004,.003,.002))]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=pos);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.parent=arm;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_basis=Matrix.Identity(4);vg=o.vertex_groups.new(name='head');vg.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Head skin','ARMATURE');mod.object=arm
 mat=bpy.data.materials.new(name);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.18;o.data.materials.append(mat)
# Use the source's cyclic walk only; exclude its long scene travel action.
source=bpy.data.actions['Armature.002Action.003']
walk=bpy.data.actions.new('Walk');arm.animation_data_create();arm.animation_data.action=walk
curves={(f.data_path,f.array_index):f for f in source.fcurves}
# Extract one cyclic stride from the source performance and offset the four legs.
for frame in range(1,26):
 for pb in arm.pose.bones:
  pb.rotation_mode='QUATERNION';pb.location=(0,0,0);pb.scale=(1,1,1)
  phase=(10 if '.r' in pb.name else 0)+(5 if 'nogaP' in pb.name else 0)
  time=90+(((frame-1)/24*20+phase)%20)
  path='pose.bones["'+pb.name+'"].rotation_quaternion'
  values=[curves[(path,i)].evaluate(time) if (path,i) in curves else (1 if i==0 else 0) for i in range(4)]
  pb.rotation_quaternion=Quaternion(values).normalized();pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
track=arm.animation_data.nla_tracks.new();track.name='Walk';track.strips.new('Walk',1,walk);arm.animation_data.action=None
idle=bpy.data.actions.new('Idle');arm.animation_data.action=idle
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
for frame in [1,24,48]:
 for name in ['head','ucho.l','ucho.r']:
  pb=arm.pose.bones[name];pb.rotation_quaternion=Quaternion((1,0,0),math.sin((frame-1)/47*math.tau)*(.025 if name=='head' else .06));pb.keyframe_insert('rotation_quaternion',frame=frame,group=name)
t=arm.animation_data.nla_tracks.new();t.name='Idle';t.strips.new('Idle',1,idle);arm.animation_data.action=None
for t in arm.animation_data.nla_tracks:t.mute=False
arm.rotation_euler.z=math.pi
bpy.context.scene.frame_set(1);bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'evermile/assets/models/sheep-textured.glb'),export_format='GLB',use_selection=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
