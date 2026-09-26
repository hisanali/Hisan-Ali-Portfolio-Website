"""Convert free Elbolilloduro station modules and a Kenney signal to game GLBs."""
import bpy,pathlib,math,bmesh
from mathutils import Matrix,Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).parent/'source/transport';OUT=ROOT/'evermile/assets/models'
def bounds(o):
 p=[o.matrix_world@Vector(v) for v in o.bound_box];return Vector([min(v[i] for v in p) for i in range(3)]),Vector([max(v[i] for v in p) for i in range(3)])
def export(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/('prop-'+name+'.glb')),export_format='GLB',use_selection=True,export_animations=False)
for kind in ['pump','shop','canopy','ice','bin']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=str(SRC/'station/Gas_station/Models/Gas_station.fbx'))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];objects=[]
 for o in meshes:
  lo,hi=bounds(o);c=(lo+hi)/2
  use=(o.name=='Fuel_pump_01' if kind=='pump' else o.name=='The_ceiling' if kind=='canopy' else ('Ice' in o.name or o.name=='ICE') if kind=='ice' else ('Trash' in o.name and hi.z-lo.z>.5) if kind=='bin' else c.y>13.2 and c.y<30 and c.x>-3 and c.x<12 and lo.x>-4 and hi.x<13 and hi.z<6)
  if use:objects.append(o)
 if not objects:print('SKIP',kind);continue
 lo=Vector([min(bounds(o)[0][i] for o in objects) for i in range(3)]);hi=Vector([max(bounds(o)[1][i] for o in objects) for i in range(3)]);center=(lo+hi)/2
 if kind=='pump':scale=2.05/(hi.z-lo.z)
 elif kind=='shop':scale=.62
 elif kind=='canopy':scale=1
 else:scale=1
 for o in objects:
  o.data=o.data.copy();o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4)
  for v in o.data.vertices:
   v.co-=Vector((center.x,center.y,lo.z));v.co*=scale
   if kind=='canopy':v.co.x*=20/(hi.x-lo.x);v.co.y*=12/(hi.y-lo.y);v.co.z*=.6/(hi.z-lo.z)
 # Resolve embedded FBX legacy texture paths against the supplied map directory.
 texdir=SRC/'station/Gas_station/Textures'
 for image in bpy.data.images:
  filename=image.filepath.replace('\\','/').split('/')[-1];p=texdir/filename
  if p.exists():image.filepath=str(p);image.reload()
 for m in bpy.data.materials:
  if not m.use_nodes:continue
  bs=m.node_tree.nodes.get('Principled BSDF')
  if not bs:continue
  bs.inputs['Metallic'].default_value=.35 if any(t in m.name.lower() for t in ['metal','fuel','frame']) else 0
  bs.inputs['Roughness'].default_value=.42 if 'Fuel' in m.name else .72
  if 'Glass' in m.name:
   bs.inputs['Base Color'].default_value=(.15,.23,.25,.3);bs.inputs['Alpha'].default_value=.3;bs.inputs['Roughness'].default_value=.12;m.surface_render_method='DITHERED'
  if m.name in ['Light','6twelve_Sign']:bs.inputs['Emission Color'].default_value=(.75,.85,.8,1);bs.inputs['Emission Strength'].default_value=.25
 # Join static meshes by material, reducing shop draw calls.
 if len(objects)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects=[bpy.context.object]
 lowest=min((o.matrix_world@o.data.vertices[i].co).z for o in objects for p in o.data.polygons for i in p.vertices)
 for o in objects:o.location.z-=lowest
 export(kind,objects)
# Imported signal: retain the housing/visors, use named lenses controlled by game phase.
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SRC/'signals/Models/GLB format/traffic-light-object-vertical.glb'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');o.data=o.data.copy();o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4);lo,hi=bounds(o);center=(lo+hi)/2
# Source's visor points toward -X; rotate it into glTF +Z (Blender -Y).
for v in o.data.vertices:
 p=v.co-center;v.co=Vector((-p.y*.42/(hi.y-lo.y),p.x*.38/(hi.x-lo.x),p.z*1.08/(hi.z-lo.z)))
m=bpy.data.materials.new('SignalHousing');m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.035,.038,.043,1);bs.inputs['Roughness'].default_value=.46;bs.inputs['Metallic'].default_value=.45;o.data.materials.clear();o.data.materials.append(m)
for p in o.data.polygons:p.material_index=0
be=o.modifiers.new('Machined edges','BEVEL');be.width=.008;be.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=be.name)
o.name='SignalHousing';objects=[o]
for name,z,color in [('red',.31,(.7,.005,.002)),('amber',0,(1,.28,.005)),('green',-.31,(.005,.52,.07))]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(0,-.165,z));lens=bpy.context.object;lens.name=name;lens.scale=(.118,.014,.118);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 m=bpy.data.materials.new('Signal_'+name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.22;bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=0;lens.data.materials.append(m);objects.append(lens)
export('signal',objects)
