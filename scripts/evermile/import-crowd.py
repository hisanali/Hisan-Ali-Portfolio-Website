"""Prepare CC0 Quaternius civilians with native walk/idle rigs and smooth silhouettes."""
import bpy,bmesh,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).resolve().parent/'source/imported'
for path in sorted(list(SRC.glob('man-*.gltf'))+list(SRC.glob('woman-*.gltf'))):
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(path))
 for o in list(bpy.context.scene.objects):
  if o.animation_data:
   o.animation_data.action=None
   for tr in list(o.animation_data.nla_tracks):
    if tr.name not in ['Walk','Idle','Run']:o.animation_data.nla_tracks.remove(tr)
  if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers):
   bpy.context.view_layer.objects.active=o
   bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bm.to_mesh(o.data);bm.free()
   mod=o.modifiers.new('Continuous surface','SUBSURF');mod.levels=1;bpy.ops.object.modifier_move_up(modifier=mod.name);bpy.ops.object.modifier_apply(modifier=mod.name)
   for p in o.data.polygons:p.use_smooth=True
 for mat in bpy.data.materials:
  if mat.use_nodes:
   bs=mat.node_tree.nodes.get('Principled BSDF')
   if bs:bs.inputs['Roughness'].default_value=.85;bs.inputs['Metallic'].default_value=0
 bpy.ops.object.select_all(action='DESELECT')
 for o in bpy.context.scene.objects:
  if o.type=='ARMATURE' or o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers):o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'evermile/assets/models'/('citizen-'+path.stem+'.glb')),export_format='GLB',use_selection=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
 print('EXPORTED',path.stem,flush=True)
