"""Prepare user-supplied models; retain textures, rigs and source attribution."""
import bpy,bmesh,pathlib,math,json,struct
from mathutils import Vector,Matrix
ROOT=pathlib.Path(__file__).resolve().parents[2];SRC=pathlib.Path(__file__).parent/'source/supplied';OUT=ROOT/'evermile/assets/models'
def load(p):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 if p.suffix=='.fbx':bpy.ops.import_scene.fbx(filepath=str(p))
 else:bpy.ops.import_scene.gltf(filepath=str(p))
def bake(o):
 w=o.matrix_world.copy();o.parent=None;o.data.transform(w);o.matrix_world=Matrix.Identity(4)
def textures(maxsize=2048):
 for im in bpy.data.images:
  if im.size[0] and max(im.size)>maxsize:
   ratio=maxsize/max(im.size);im.scale(max(1,int(im.size[0]*ratio)),max(1,int(im.size[1]*ratio)))
  if im.size[0]:im.pack()
def export(name,animated=False):
 textures();bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=animated,export_animations=animated,export_animation_mode='ACTIONS',export_force_sampling=True,export_extras=True)
 print('EXPORTED',name,flush=True)
def split_quadrants(o):
 result=[]
 for sx in [-1,1]:
  for sy in [-1,1]:
   n=o.copy();n.data=o.data.copy();bpy.context.collection.objects.link(n);bm=bmesh.new();bm.from_mesh(n.data)
   bmesh.ops.delete(bm,geom=[f for f in bm.faces if (f.calc_center_median().x>0)!=(sx>0) or (f.calc_center_median().y>0)!=(sy>0)],context='FACES');bm.to_mesh(n.data);bm.free()
   if len(n.data.polygons):result.append((n,sx,sy))
   else:bpy.data.objects.remove(n,do_unlink=True)
 bpy.data.objects.remove(o,do_unlink=True);return result
# Mercedes: source is already in metres, front points -Y (glTF +Z).
load(SRC/'1982_mercedes_w201.glb')
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':bake(o)
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
meshes=list(bpy.context.scene.objects);pts=[v.co for o in meshes for v in o.data.vertices];lo=Vector([min(v[i] for v in pts) for i in range(3)]);hi=Vector([max(v[i] for v in pts) for i in range(3)]);center=(lo+hi)/2;scale=4.45/(hi.y-lo.y)
for o in meshes:
 for v in o.data.vertices:v.co=(v.co-Vector((center.x,center.y,lo.z)))*scale
wheel_groups={}
for o in list(meshes):
 mat=o.data.materials[0].name
 if 'Blur' in mat or mat in ['INT_Glass_Refl','HL_Glass_ONM','TL_Glass_ONM']:
  bpy.data.objects.remove(o,do_unlink=True);continue
 o.name=mat
 if any(x in mat for x in ['EXT_Rim','EXT_Tyre','EXT_Brake_Disc','EXT_Calipers']):
  for part,sx,sy in split_quadrants(o):
   key='Wheel_'+('F' if sy<0 else 'R')+('L' if sx>0 else 'R')
   if key not in wheel_groups:
    g=bpy.data.objects.new(key,None);bpy.context.collection.objects.link(g);wheel_groups[key]=g
   part.name='Caliper' if 'Calipers' in mat else mat;part.parent=wheel_groups[key]
for label,y in [('Head',-2.12),('Tail',2.2)]:
 for side,x in [('L',.62),('R',-.62)]:
  o=bpy.data.objects.new(label+side,None);bpy.context.collection.objects.link(o);o.location=(x,y,.62)
for m in bpy.data.materials:
 if not m.use_nodes:continue
 bs=m.node_tree.nodes.get('Principled BSDF')
 if not bs:continue
 if m.name=='EXT_Car_Paint':m.name='BodyPaint';bs.inputs['Metallic'].default_value=.65;bs.inputs['Roughness'].default_value=.26;bs.inputs['Coat Weight'].default_value=.7
 if m.name.startswith('TL_'):bs.inputs['Emission Color'].default_value=(.45,.002,.001,1);bs.inputs['Emission Strength'].default_value=.25;m.name='TailLens_'+m.name
 if m.name in ['EXT_Glass','INT_Glass']:
  bs.inputs['Base Color'].default_value=(.2,.26,.28,1);bs.inputs['Alpha'].default_value=.22;bs.inputs['Roughness'].default_value=.09;m.surface_render_method='DITHERED'
export('road-mercedes')
# Locomotive: remove the source's short track diorama; fit the real mesh to the game's 19 m engine slot.
load(SRC/'enginetrain.glb')
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':bake(o)
for o in list(bpy.context.scene.objects):
 if o.type!='MESH' or 'trainrail' in o.name:bpy.data.objects.remove(o,do_unlink=True)
meshes=list(bpy.context.scene.objects);pts=[v.co for o in meshes for v in o.data.vertices];lo=Vector([min(v[i] for v in pts) for i in range(3)]);hi=Vector([max(v[i] for v in pts) for i in range(3)]);center=(lo+hi)/2;scale=19/(hi.x-lo.x)
for o in meshes:
 for v in o.data.vertices:
  p=v.co.copy();v.co=Vector(((p.y-center.y)*scale,-(p.x-center.x)*scale,(p.z-lo.z)*scale))
 o.name='WheelAssembly' if 'wheels' in o.name else 'LocomotiveBody'
# Separate connected wheel components; only circular discs rotate, bogie frames stay fixed.
w=next(o for o in bpy.context.scene.objects if o.name=='WheelAssembly');bpy.ops.object.select_all(action='DESELECT');w.select_set(True);bpy.context.view_layer.objects.active=w;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
rotors=[]
for o in list(bpy.context.selected_objects):
 pts=[v.co for v in o.data.vertices];a=Vector([min(v[i] for v in pts) for i in range(3)]);b=Vector([max(v[i] for v in pts) for i in range(3)]);d=b-a
 if d.z>.45 and .65<d.y/d.z<1.4 and d.x<d.z*.7:
  c=(a+b)/2
  for v in o.data.vertices:v.co-=c
  o.location=c;o.name='TrainWheel_'+str(len(rotors));o['radius']=max(d.y,d.z)/2;rotors.append(o)
 else:o.name='BogieFrame'
# Combine concentric pieces into one rotor per wheel and batch the fixed frame.
groups=[]
for o in rotors:
 match=next((g for g in groups if (g[0].location.x>0)==(o.location.x>0) and abs(g[0].location.y-o.location.y)<.18 and abs(g[0].location.z-o.location.z)<.18),None)
 if match is None:groups.append([o])
 else:match.append(o)
for i,group in enumerate(groups):
 bpy.ops.object.select_all(action='DESELECT')
 for o in group:o.select_set(True)
 bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();bpy.context.object.name='TrainWheel_'+str(i)
fixed=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.name.startswith('TrainWheel_')]
bpy.ops.object.select_all(action='DESELECT')
for o in fixed:o.select_set(True)
bpy.context.view_layer.objects.active=fixed[0];bpy.ops.object.join();bpy.context.object.name='LocomotiveBody'
for label,y in [('Head',-9.15),('Tail',9.1)]:
 for side,x in [('L',.8),('R',-.8)]:
  o=bpy.data.objects.new(label+side,None);bpy.context.collection.objects.link(o);o.location=(x,y,2)
print('TRAIN ROTORS',len(rotors),flush=True);export('train-supplied')
# Animals: keep native skins and clips, no synthetic leg animation.
for kind,file in [('bighorn','bighorn/source/BIGHORN_DEMO.fbx')]:
 load(SRC/file);arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 if kind=='bighorn':
  for m in bpy.data.materials:
   m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(SRC/'bighorn/textures'/('T_BigHorn_Antler.png' if 'Antler' in m.name else 'T_BighornSheep.png')));m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.85
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH' and ((not any(m.type=='ARMATURE' for m in o.modifiers) and 'Trophy' not in o.name) or (kind=='horse' and any('Saddle' in m.name for m in o.data.materials))):bpy.data.objects.remove(o,do_unlink=True)
 if kind=='bighorn':
  arm.animation_data_create();arm.animation_data.action=None
  for action in list(bpy.data.actions):
   track=arm.animation_data.nla_tracks.new();track.name=action.name;track.strips.new(action.name,int(action.frame_range[0]),action)
 for track in arm.animation_data.nla_tracks:
  name=track.name.lower();label='Walk' if 'walk' in name else 'Idle' if ('idle' in name or 'stand' in name) else 'Howl' if 'howl' in name else 'Breathing'
  track.name=label
  for strip in track.strips:strip.name=label
 arm.animation_data.action=None
 bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
 for o in bpy.context.scene.objects:
  if o.type=='MESH' and (any(m.type=='ARMATURE' for m in o.modifiers) or 'Trophy' in o.name):o.select_set(True)
 for t in list(arm.animation_data.nla_tracks):arm.animation_data.nla_tracks.remove(t)
 for action in bpy.data.actions:
  n=action.name.lower();action.name='Walk' if 'walk' in n else 'Idle' if 'idle' in n or 'stand' in n else 'Howl' if 'howl' in n else 'Breathing'
 arm.animation_data.action=next(a for a in bpy.data.actions if a.name=='Idle')
 export(kind+'-supplied',True)
 # The FBX's static Idle take has no changing channels and is omitted by glTF.
 # Use its native breathing loop as the animated standing state.
 p=OUT/(kind+'-supplied.glb');data=p.read_bytes();length=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+length]);chunks=data[20+length:]
 for animation in doc.get('animations',[]):
  if animation['name']=='Breathing':animation['name']='Idle'
 j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);p.write_bytes(struct.pack('<III',0x46546c67,2,20+len(j)+len(chunks))+struct.pack('<II',len(j),0x4e4f534a)+j+chunks)
# Preserve original glTF animation channels for these complex control rigs.
# Blender resampling changes their animated armature root basis; a lossless
# container rewrite keeps the source's skin bind matrices and clips together.
for kind,file in [('horse','horse_-_realistic_3d_model_demo_free.glb'),('fox','fox_-_realistic_3d_model_demo_free.glb')]:
 data=(SRC/file).read_bytes();length=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+length]);chunks=data[20+length:]
 for m in doc.get('materials',[]):
  ext=m.get('extensions',{}).pop('KHR_materials_pbrSpecularGlossiness',None)
  if ext:
   pbr={'baseColorFactor':ext.get('diffuseFactor',[1,1,1,1]),'metallicFactor':0,'roughnessFactor':max(.35,1-ext.get('glossinessFactor',0))}
   if 'diffuseTexture' in ext:pbr['baseColorTexture']=ext['diffuseTexture']
   m['pbrMetallicRoughness']=pbr
 for key in ['extensionsUsed','extensionsRequired']:
  if key in doc:doc[key]=[x for x in doc[key] if x!='KHR_materials_pbrSpecularGlossiness']
 for a in doc.get('animations',[]):
  n=a['name'].lower();a['name']='Walk' if 'walk' in n else 'Idle' if 'idle' in n or 'stand' in n else 'Howl'
 if kind=='horse':
  for node in doc['nodes']:
   if 'mesh' in node and any('Saddle' in doc['materials'][p['material']]['name'] for p in doc['meshes'][node['mesh']]['primitives']):del node['mesh']
 j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);out=struct.pack('<III',0x46546c67,2,20+len(j)+len(chunks))+struct.pack('<II',len(j),0x4e4f534a)+j+chunks;(OUT/(kind+'-supplied.glb')).write_bytes(out)
