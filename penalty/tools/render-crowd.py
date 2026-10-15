import bpy, re, math, os, sys
from pathlib import Path
source=Path(sys.argv[sys.argv.index("--")+1]);output=Path(sys.argv[sys.argv.index("--")+2])
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=str(source/'character.fbx'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE');base=set(bpy.data.objects)
for bone in rig.data.bones:bone.name=re.sub(r'^.*:', '',bone.name)
# Separate uniforms from the shared skin atlas; retain skin, hair, normal detail.
for o in base:
 if o.type=='MESH':
  o.data.materials[0]=o.data.materials[0].copy()
  if any(n in o.name for n in ['Shirt','Shorts','Socks']):
   mat=o.data.materials[0];bs=mat.node_tree.nodes.get('Principled BSDF');link=next(l for l in mat.node_tree.links if l.to_node==bs and l.to_socket.name=='Base Color');node=mat.node_tree.nodes.new('ShaderNodeMixRGB');node.blend_type='MULTIPLY';node.inputs[0].default_value=1;mat.node_tree.links.new(link.from_socket,node.inputs[1]);mat.node_tree.links.new(node.outputs[0],bs.inputs['Base Color']);node.name='Uniform Tint'
  if 'Hair' in o.name or 'Eyelashes' in o.name:o.data.materials[0].surface_render_method='DITHERED'
rig.animation_data_clear()
bpy.ops.import_scene.fbx(filepath=str(source/'celebrate.fbx'));objs=set(bpy.data.objects)-base
src=next(o for o in objs if o.type=='ARMATURE');act=src.animation_data.action
for fc in list(act.fcurves):
 if not fc.data_path.startswith('pose.bones['):act.fcurves.remove(fc);continue
 fc.data_path=re.sub(r'pose.bones\["[^"\]]*:', 'pose.bones["',fc.data_path).replace('mixamorig','')
for o in objs:bpy.data.objects.remove(o,do_unlink=True)
rig.animation_data_create();rig.animation_data.action=act
if len(act.slots):rig.animation_data.action_slot=act.slots[0]
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.render.resolution_x=256;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.view_settings.view_transform='AgX';scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.85,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
camera=bpy.data.objects.new('Camera',bpy.data.cameras.new('Camera'));scene.collection.objects.link(camera);scene.camera=camera;camera.location=(0,-5,1.45);camera.rotation_euler=(Vector((0,0,1.25))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.75
for pos,energy,size in [((-3,-4,5),600,5),((3,2,4),450,4)]:
 light=bpy.data.objects.new('Key',bpy.data.lights.new('Key','AREA'));scene.collection.objects.link(light);light.location=pos;light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
colors=[(.48,.035,.045,1),(.7,.72,.75,1),(.025,.09,.25,1),(.12,.14,.17,1),(.1,.24,.16,1),(.55,.42,.18,1),(.22,.14,.10,1),(.7,.7,.68,1)]
output.mkdir(parents=True,exist_ok=True)
for i,frame in enumerate([1,28,46,69,12,35,57,84]):
 scene.frame_set(frame)
 # Do not retain the captured world-space locomotion in a crowd tile.
 rig.pose.bones['Hips'].location.x=0;rig.pose.bones['Hips'].location.z=0
 for o in base:
  if o.type=='MESH' and any(n in o.name for n in ['Shirt','Shorts','Socks']):o.data.materials[0].node_tree.nodes.get('Uniform Tint').inputs[2].default_value=colors[i]
 scene.render.filepath=str(output/('fan-'+str(i)+'.png'));bpy.ops.render.render(write_still=True)
