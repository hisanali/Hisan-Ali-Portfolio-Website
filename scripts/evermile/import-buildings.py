"""Assemble closed buildings from Poly Haven's CC0 modular architecture kits."""
import bpy,pathlib,math
from mathutils import Matrix,Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).resolve().parent/'source/architecture'
for slug,label in [('modular_urban_apartments_facade','apartments'),('modular_factory_facade','brick-works'),('modular_fort_01','coastal-fort')]:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SRC/slug/(slug+'.gltf')))
 originals={o.name:o for o in list(bpy.context.scene.objects) if o.type=='MESH'};made=[]
 def put(name,x,y,z,angle=0,center=False):
  src=originals[name];o=src.copy();o.data=src.data.copy();o.parent=None;bpy.context.collection.objects.link(o)
  # Bake object rotation/scale while removing the source kit's display-grid translation.
  mat=src.matrix_world.copy();mat.translation=(0,0,0);o.data.transform(mat)
  if center:
   vs=[v.co for v in o.data.vertices];lo=Vector([min(v[i] for v in vs) for i in range(3)]);hi=Vector([max(v[i] for v in vs) for i in range(3)]);offset=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z));o.data.transform(Matrix.Translation(-offset))
  o.matrix_world=Matrix.Translation((x,y,z))@Matrix.Rotation(angle,4,'Z');made.append(o);return o
 if label!='coastal-fort':
  width,depth,floors=15,12,4 if label=='apartments' else 3
  for angle,length,distance in [(0,width,depth/2),(math.pi,width,depth/2),(math.pi/2,depth,width/2),(-math.pi/2,depth,width/2)]:
   rot=Matrix.Rotation(angle,4,'Z')
   for col in range(int(length/3)):
    for floor in range(floors):
     pos=rot@Vector((-length/2+3+col*3, -distance,floor*3))
     door=floor==0 and col==int(length/6) and angle==0
     part='door_centered_small_01' if door else 'window_centered_small_01'
     put('wall_'+part,*pos,angle);put(part,*pos,angle)
    pos=rot@Vector((-length/2+3+col*3,-distance,floors*3));put('crown_standard_standard_01',*pos,angle)
  # A closed roof prevents open interiors being visible from the driving camera.
  bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,floors*3-.12));roof=bpy.context.object;roof.name='Roof';roof.scale=(width,depth,.24);roof.data.materials.append(originals['wall_standard_standard_01'].data.materials[0]);made.append(roof)
 else:
  # Gatehouse court: four towers, complete perimeter walls and a walkable-looking entrance.
  prefix='modular_fort_01_'
  for x in [-15,15]:
   for y in [-15,15]:put(prefix+'tower_round',x,y,0,center=True)
  for side in [-1,1]:
   for q in [-7.4,7.4]:put(prefix+'wall_thin_straight_01',side*15,q,0,center=True)
   for q in [-7.4,7.4]:put(prefix+'wall_thin_straight_01',q,15,0,math.pi/2,center=True)
  put(prefix+'wall_thin_gate_01',0,-15,0,math.pi/2,center=True)
  for x in [-8.9,8.9]:
   o=put(prefix+'wall_thin_straight_01',x,-15,0,math.pi/2,center=True);o.scale.y=.70
 for o in originals.values():bpy.data.objects.remove(o,do_unlink=True)
 bpy.ops.object.select_all(action='DESELECT')
 for o in made:o.select_set(True)
 bpy.context.view_layer.objects.active=made[0];bpy.ops.object.join()
 if label!='coastal-fort':
  o=bpy.context.object;mod=o.modifiers.new('Street viewing detail','DECIMATE');mod.ratio=.35;bpy.ops.object.modifier_apply(modifier=mod.name)
 for img in bpy.data.images:
  if img.source=='FILE':img.pack()
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'evermile/assets/models'/('place-'+label+'.glb')),export_format='GLB',use_selection=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=82)
 print('EXPORTED',label,flush=True)
