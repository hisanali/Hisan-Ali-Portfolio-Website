"""Adapt ajanhallinta's CC0 bus into coach and city liveries with wheel pivots and PBR surfaces."""
import bpy,pathlib,math
from mathutils import Matrix,Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).parent/'source/transport'
def mat(name,color,rough=.5,metal=0,alpha=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,alpha);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal;bs.inputs['Alpha'].default_value=alpha
 if alpha<1:m.surface_render_method='DITHERED'
 return m
def box(name,pos,size,m,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Edge bevel','BEVEL');b.width=bevel;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
 return o
for kind in ['coach','bus']:
 bpy.ops.wm.open_mainfile(filepath=str(SRC/'bus/BUS.blend'),use_scripts=False);bpy.context.view_layer.update()
 objs=[o for o in bpy.context.scene.objects if o.type=='MESH'];scale=12/9.55089855
 # Source forward +X, vertical +Z. glTF forward +Z is Blender -Y.
 transform=Matrix(((0,scale,0,1.2445*scale),(-scale,0,0,-.0965*scale),(0,0,scale,2.762*scale),(0,0,0,1)))
 for o in objs:
  o.modifiers.clear();o.data.transform(transform@o.matrix_world);o.matrix_world=Matrix.Identity(4)
  if o.name.startswith('wheel'):
   pts=[v.co for v in o.data.vertices];center=Vector([(min(p[i] for p in pts)+max(p[i] for p in pts))/2 for i in range(3)])
   o.name='Wheel_'+('F' if center.y<0 else 'R')+('L' if center.x<0 else 'R');o.data.transform(Matrix.Translation(-center));o.location=center
   for p in o.data.polygons:p.use_smooth=True
 for o in list(bpy.context.scene.objects):
  if o not in objs:bpy.data.objects.remove(o,do_unlink=True)
 colors={'Body':((.68,.74,.76) if kind=='coach' else (.035,.22,.25),.3,.28,1),'Windows':((.075,.12,.15),.12,.12,.36),'karmi':((.018,.022,.027),.6,.1,1),'Tire':((.012,.015,.018),.91,0,1),'Metal':((.48,.51,.54),.24,.86,1),'Bolt':((.17,.19,.20),.31,.8,1),'RearLights':((.5,.006,.004),.22,.1,1),'FrontLights':((.84,.91,.96),.16,.12,1),'Indicators':((1,.24,.012),.23,.1,1),'FogLights':((.8,.86,.9),.2,.1,1)}
 for name,(color,r,m,a) in colors.items():
  old=bpy.data.materials.get(name)
  if old:
   new=mat(name+'PBR',color,r,m,a)
   if name in ['FrontLights','RearLights']:bs=new.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=.3
   for o in objs:
    for slot in o.material_slots:
     if slot.material==old:slot.material=new
 # Physical cabin visible through the tinted windows.
 fabric=mat('SeatFabric',(.045,.085,.13) if kind=='coach' else (.13,.18,.16),.95);dark=mat('InteriorTrim',(.025,.033,.04),.8);metal=mat('RailMetal',(.42,.45,.46),.25,.8)
 box('CabinFloor',(0,0,1.05),(2.44,11.2,.12),dark)
 for row in range(10):
  y=-4.2+row*.92
  for x in [-.83,-.35,.35,.83]:
   if kind=='bus' and row in [0,1,5]:continue
   box('Seat',(x,y,1.43),(.42,.50,.12),fabric,.05);box('SeatBack',(x,y+.23,1.77),(.43,.12,.67),fabric,.05)
 for x in [-.8,.8]:
  box('MirrorArm',(x*1.55,-5.16,2.51),(.35,.045,.045),metal,.012);box('Mirror',(x*1.77,-5.16,2.38),(.12,.20,.36),dark,.04)
 # Give source mesh lamp locations to runtime, avoiding floating generic lights.
 for name,pos in [('HeadL',(-.99,-5.96,.72)),('HeadR',(.99,-5.96,.72)),('TailL',(-1,-0+6,.81)),('TailR',(1,6,.81))]:
  o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=pos
 # A restrained route/destination panel sits inside the front windscreen.
 box('DestinationPanel',(0,-5.58,2.51),(1.7,.035,.19),dark,.015)
 bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(ROOT/'evermile/assets/models'/('road-'+kind+'.glb')),export_format='GLB',use_selection=True,export_animations=False)
 print('EXPORTED',kind)
