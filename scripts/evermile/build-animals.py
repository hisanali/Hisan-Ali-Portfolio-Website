"""Authored articulated animal meshes; Blender 4.5 background build, no downloaded assets."""
import bpy,math,pathlib,random
from mathutils import Vector
OUT=pathlib.Path(__file__).resolve().parents[2]/'evermile/assets/models'
def xyz(p):return (p[0],-p[2],p[1])
def mat(n,c,r=.85):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=r;return m
def group(n,p,parent=None):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);o.location=xyz(p);o.parent=parent;return o
def ell(n,p,s,m,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16);o=bpy.context.object;o.name=n;o.location=xyz(p);o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=parent
 for f in o.data.polygons:f.use_smooth=True
 return o
def sculpt(n,shapes,m,parent=None,voxel=.018):
 objs=[ell(n,p,s,m) for p,s in shapes];bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();o=objs[0];o.name=n
 mod=o.modifiers.new('SculptUnion','REMESH');mod.mode='VOXEL';mod.voxel_size=voxel;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('MuscleSmoothing','SMOOTH');mod.factor=.8;mod.iterations=4;bpy.ops.object.modifier_apply(modifier=mod.name)
 dec=o.modifiers.new('GameMesh','DECIMATE');dec.ratio=.65;bpy.ops.object.modifier_apply(modifier=dec.name)
 for f in o.data.polygons:f.use_smooth=True
 o.parent=parent;return o
def taper(n,a,b,r1,r2,m,parent=None):
 va,vb=Vector(xyz(a)),Vector(xyz(b));d=vb-va;bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r1,radius2=r2,depth=d.length,location=(va+vb)/2);o=bpy.context.object;o.name=n;o.rotation_quaternion=d.to_track_quat('Z','Y');o.rotation_mode='QUATERNION';o.rotation_quaternion=d.to_track_quat('Z','Y');o.data.materials.append(m);o.parent=parent
 for f in o.data.polygons:f.use_smooth=True
 return o
for kind in ['cow','sheep','dog','cat']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);random.seed(17)
 fur=mat('Coat',{'cow':(.72,.68,.60),'sheep':(.71,.67,.57),'dog':(.26,.12,.05),'cat':(.27,.22,.17)}[kind]);dark=mat('DarkCoat',(.025,.022,.020));nose=mat('Nose',(.035,.025,.023),.4);eye=mat('Eyes',(.013,.009,.006),.2);pink=mat('EarInterior',(.24,.12,.10));hoof=mat('Hooves',(.055,.044,.035),.6)
 root=group('Animal',(0,0,0))
 if kind=='cow':
  body=sculpt('Body',[((0,1.10,0),(.40,.43,.87)),((0,1.17,.59),(.35,.42,.40)),((0,1.16,-.66),(.39,.41,.36)),((0,1.40,-.1),(.25,.12,.66))],fur,root)
  neck=group('Neck',(0,1.34,1.02),root);sculpt('NeckMuscle',[((0,-.09,.10),(.24,.31,.31)),((0,-.23,.27),(.17,.23,.26))],fur,neck)
  head=group('Head',(0,-.30,.50),neck);sculpt('Skull',[((0,.07,-.1),(.17,.23,.24)),((0,-.025,.14),(.125,.16,.27))],fur,head,.012);ell('Muzzle',(0,-.11,.32),(.16,.115,.11),pink,head)
  legs=[(-.29,.68),(.29,.68),(-.30,-.67),(.30,-.67)];ly=.95;upper=.44;lower=.43;radius=.075
  for side in [-1,1]:
   ell('Ear',(side*.25,.18,-.09),(.16,.048,.09),fur,head);ell('EarInset',(side*.26,.191,-.04),(.12,.014,.048),pink,head)
   taper('Horn',(side*.12,.23,-.12),(side*.24,.42,-.17),.042,.003,hoof,head)
   ell('Eye',(side*.15,.105,.01),(.027,.025,.025),eye,head);ell('Nostril',(side*.066,-.08,.41),(.023,.013,.010),nose,head)
  tail=group('Tail',(0,1.40,-.94),root);taper('TailShaft',(0,0,0),(0,-.70,-.15),.024,.013,fur,tail);ell('TailTuft',(0,-.73,-.16),(.05,.11,.04),dark,tail)
  # Irregular coat patches follow the curved body rather than repeating UV squares.
  for o in list(root.children)+list(neck.children)+list(head.children):
   if o.type!='MESH' or not o.data.materials or o.data.materials[0]!=fur:continue
   attr=o.data.color_attributes.new(name='CoatColor',type='FLOAT_COLOR',domain='POINT')
   for v,col in zip(o.data.vertices,attr.data):
    p=o.matrix_local@v.co;n=math.sin(p.x*9+math.sin(p.y*7))*math.cos(p.z*8)+.4*math.sin(p.y*13+p.z*5);c=.026 if n>.32 else .72;col.color=(c,c*.96,c*.87,1)
   m=fur.copy();m.name='CowPatches';nodes=m.node_tree.nodes;b=nodes.get('Principled BSDF');vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='CoatColor';m.node_tree.links.new(vc.outputs['Color'],b.inputs['Base Color']);o.data.materials[0]=m
 elif kind=='sheep':
  body=sculpt('Fleece',[((0,.72,0),(.27,.30,.49)),((0,.76,.30),(.23,.28,.24)),((0,.73,-.33),(.24,.26,.23))],fur,root,.012)
  for v in body.data.vertices:
   p=v.co;n=.005*(math.sin(p.x*220)*math.cos(p.z*190)+math.sin(p.y*170));v.co+=v.normal*n
  neck=group('Neck',(0,.80,.52),root);ell('NeckCoat',(0,-.015,.035),(.115,.17,.15),fur,neck);head=group('Head',(0,-.04,.14),neck);sculpt('Skull',[((0,0,.045),(.092,.125,.15)),((0,-.055,.16),(.063,.085,.1))],dark,head,.008)
  for side in [-1,1]:ell('Ear',(side*.145,.045,-.01),(.10,.025,.045),dark,head);ell('Eye',(side*.083,.045,.08),(.012,.013,.013),eye,head)
  legs=[(-.16,.30),(.16,.30),(-.16,-.30),(.16,-.30)];ly=.50;upper=.23;lower=.24;radius=.027;tail=group('Tail',(0,.75,-.51),root);ell('TailWool',(0,-.08,0),(.06,.13,.065),fur,tail)
 elif kind=='dog':
  body=sculpt('Body',[((0,.51,.09),(.14,.19,.25)),((0,.53,-.16),(.125,.155,.22)),((0,.59,.20),(.145,.19,.13))],fur,root,.009)
  neck=group('Neck',(0,.68,.32),root);ell('NeckMuscle',(0,.02,.015),(.085,.14,.115),fur,neck);head=group('Head',(0,.16,.12),neck);sculpt('Skull',[((0,.0,0),(.104,.11,.12)),((0,-.025,.12),(.064,.06,.12))],fur,head,.007);ell('Nose',(0,-.012,.224),(.044,.034,.025),nose,head)
  for side in [-1,1]:ell('Ear',(side*.087,-.025,-.033),(.042,.100,.060),dark,head);ell('Eye',(side*.067,.04,.080),(.015,.014,.013),eye,head);ell('Brow',(side*.064,.054,.074),(.026,.009,.024),fur,head)
  legs=[(-.105,.23),(.105,.23),(-.105,-.27),(.105,-.27)];ly=.44;upper=.20;lower=.21;radius=.029;tail=group('Tail',(0,.60,-.34),root);taper('TailShaft',(0,0,0),(0,.22,-.25),.034,.008,fur,tail)
 else:
  # Seated cat with folded hindquarters and two straight front paws.
  body=sculpt('Body',[((0,.19,-.055),(.10,.17,.14)),((0,.29,.015),(.072,.12,.085)),((0,.075,-.105),(.12,.073,.115))],fur,root,.006)
  neck=group('Neck',(0,.38,.07),root);head=group('Head',(0,0,0),neck);sculpt('Skull',[((0,0,0),(.076,.067,.067)),((0,-.025,.05),(.047,.035,.04))],fur,head,.005)
  for side in [-1,1]:
   taper('Ear',(side*.051,.034,-.012),(side*.064,.11,-.016),.036,.002,fur,head);ell('Eye',(side*.033,.01,.057),(.014,.009,.003),mat('Iris'+str(side),(.23,.29,.08),.3),head);ell('Pupil',(side*.033,.01,.060),(.0025,.007,.001),eye,head)
   ell('Muzzle',(side*.018,-.025,.065),(.023,.018,.019),fur,head)
   for w in range(3):taper('Whisker',(side*.027,-.025,.075),(side*.12,-.018-w*.008,.062+w*.01),.0006,.0002,dark,head)
   ell('HindPaw',(side*.083,.024,-.01),(.040,.021,.062),fur,root)
  ell('Nose',(0,-.016,.083),(.009,.006,.005),pink,head)
  legs=[(-.044,.075),(.044,.075)];ly=.18;upper=.07;lower=.085;radius=.018;tail=group('Tail',(0,.08,-.16),root);taper('TailShaft',(0,0,0),(.17,-.045,-.09),.02,.009,fur,tail)
 for i,(x,z) in enumerate(legs):
  hip=group('Hip'+str(i),(x,ly,z),root);sculpt('UpperLeg',[((0,-upper*.22,0),(radius*1.55,upper*.38,radius*1.45)),((0,-upper*.65,0),(radius*.96,upper*.37,radius))],fur if kind!='sheep' else dark,hip,max(.003,radius*.16));ell('KneeMuscle',(0,-upper,0),(radius*1.15,radius*1.3,radius*1.12),fur if kind!='sheep' else dark,hip)
  knee=group('Knee'+str(i),(0,-upper,0),hip);ell('LowerLeg',(0,-lower*.48,0),(radius*.77,lower*.56,radius*.79),fur if kind!='sheep' else dark,knee)
  if kind in ['cow','sheep']:
   for side in [-1,1]:ell('ClovenHoof',(side*radius*.39,-lower-.01,.018),(radius*.36,.035 if kind=='cow' else .020,radius*.95),hoof,knee)
  else:
   ell('Paw',(0,-lower,.025),(radius*1.3,.021,radius*1.9),fur,knee)
   for toe in [-1,0,1]:ell('Toe',(toe*radius*.6,-lower-.003,.056 if kind=='dog' else .041),(radius*.45,.015,radius*.65),fur,knee)
 # Fine UVs for the runtime fur/wool bump; coat markings are baked vertex colors.
 for o in list(bpy.context.scene.objects):
  if o.type!='MESH':continue
  if not o.data.uv_layers:
   uv=o.data.uv_layers.new(name='FurUV')
   for f in o.data.polygons:
    for li in f.loop_indices:
     co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co.x*2+co.y,co.z*2)
  if kind in ['cat','dog'] and o.data.materials[0]==fur:
   attr=o.data.color_attributes.new(name='CoatColor',type='FLOAT_COLOR',domain='POINT')
   for v,col in zip(o.data.vertices,attr.data):
    p=o.matrix_world@v.co;stripe=.72+.28*math.sin(p.z*75+math.sin(p.x*22)*1.5) if kind=='cat' else .82+.18*math.cos(p.z*5)
    col.color=(stripe,stripe*.98,stripe*.94,1)
   o.data.materials[0].use_nodes=True;nodes=fur.node_tree.nodes
   if not nodes.get('CoatColor'):
    vc=nodes.new('ShaderNodeVertexColor');vc.name='CoatColor';vc.layer_name='CoatColor';fur.node_tree.links.new(vc.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
 bpy.ops.export_scene.gltf(filepath=str(OUT/(kind+'.glb')),export_format='GLB',export_animations=False)
 print('EXPORTED',kind,flush=True)
