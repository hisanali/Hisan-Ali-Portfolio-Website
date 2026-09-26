"""Build six CC0 MakeHuman-derived, clothed game citizens with an authored planted-foot gait.
Run with Blender --background --python scripts/evermile/build-pedestrians.py.
Inputs are pinned in source/; exported GLBs contain no external image dependencies.
"""
import bpy, math, pathlib, random
from mathutils import Vector, Matrix
ROOT=pathlib.Path(__file__).resolve().parents[2]
SRC=pathlib.Path(__file__).resolve().parent/'source'
OUT=ROOT/'evermile/assets/models'
verts=[];faces={};group=''
for line in open(SRC/'human-base.obj'):
 p=line.split()
 if not p:continue
 if p[0]=='v':verts.append(Vector(tuple(map(float,p[1:4]))))
 elif p[0]=='g':group=p[1];faces.setdefault(group,[])
 elif p[0]=='f':faces[group].append([int(q.split('/')[0])-1 for q in p[1:]])
profiles=[('caucasian-male-young',1.81,'short'),('african-male-young',1.85,'crop'),('asian-male-old',1.69,'receding'),('caucasian-female-young',1.70,'bob'),('african-female-old',1.65,'curly'),('asian-female-young',1.73,'pony')]

def mat(name,c,rough=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=rough
 return m

def mesh(name,vs,fs,m):
 d=bpy.data.meshes.new(name);d.from_pydata(vs,[],fs);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for p in d.polygons:p.use_smooth=True
 return o

def ball(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o

def rigid(o,arm,bone):
 vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Skeleton','ARMATURE');mod.object=arm
 o.parent=arm

def smoothstep(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)

for idx,(name,height,hairtype) in enumerate(profiles):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 random.seed(idx)
 vs=[v.copy() for v in verts]
 for l in open(SRC/(name+'.target')):
  p=l.split()
  if len(p)==4 and not l.startswith('#'):vs[int(p[0])]+=Vector(tuple(map(float,p[1:])))
 bodyindices={i for f in faces['body'] for i in f};low=min(vs[i].y for i in bodyindices);high=max(vs[i].y for i in bodyindices);sc=height/(high-low)
 vs=[Vector((v.x*sc,-v.z*sc,(v.y-low)*sc)) for v in vs]
 def joint(n):
  ids={i for f in faces['joint-'+n] for i in f};return sum((vs[i] for i in ids),Vector())/len(ids)
 joints={n:joint(n) for n in ['pelvis','spine-1','neck','head','head-2']}
 skin=mat('Skin',[(.64,.39,.25),(.22,.095,.052),(.52,.31,.19),(.76,.49,.34),(.27,.12,.075),(.66,.41,.26)][idx],.78)
 shirt=mat('Cloth_Shirt',[(.18,.25,.32),(.63,.57,.42),(.24,.31,.27),(.44,.17,.13),(.31,.24,.42),(.66,.65,.58)][idx],.94)
 pants=mat('Cloth_Trousers',[(.045,.065,.095),(.09,.075,.06),(.10,.105,.11),(.04,.07,.105),(.085,.065,.045),(.16,.18,.19)][idx],.97)
 shoes=mat('Leather_Shoes',(.025,.022,.021),.68);hair=mat('Hair',[(.035,.022,.015),(.014,.012,.01),(.29,.28,.25),(.12,.052,.021),(.14,.13,.115),(.025,.017,.013)][idx],.92)
 white=mat('Eye_Sclera',(.69,.65,.57),.36);iris=mat('Iris',(.07,.045,.023),.4);black=mat('Pupil',(.004,.003,.002),.2)
 # Exposed skin only. Clothing is separate sewn-volume geometry, not painted anatomy.
 ids=sorted(bodyindices);mapping={old:i for i,old in enumerate(ids)}
 hipz=joints['pelvis'].z;neckz=joints['neck'].z
 exposed=[]
 for f in faces['body']:
  c=sum((vs[i] for i in f),Vector())/len(f)
  wrist=joint('l-hand' if c.x>0 else 'r-hand')
  ishand=abs(c.x)>abs(wrist.x)-.065 and c.z<wrist.z+.145
  if idx in [3,5]:ishand=ishand or (abs(c.x)>abs(joint('l-elbow').x)-.04 and c.z<joint('l-elbow').z+.12)
  if (c.z>neckz-.11 and (abs(c.x)<.072 or c.z>neckz+.045)) or ishand or (idx==3 and c.z<hipz-.25 and c.z>.06):exposed.append([mapping[i] for i in f])
 body=mesh('ExposedSkin',[vs[i] for i in ids],exposed,skin)
 # Subtle vertex complexion, lip color and cheek warmth on the actual anatomical face.
 attr=body.data.color_attributes.new(name='Complexion',type='FLOAT_COLOR',domain='POINT');mouth=joint('mouth')
 for v,c in zip(body.data.vertices,attr.data):
  p=v.co;lip=math.exp(-((p.x/.035)**2+((p.z-mouth.z)/.012)**2+((p.y-mouth.y)/.04)**2))*0.38
  noise=.018*math.sin(p.x*831)*math.cos(p.z*917);base=skin.diffuse_color
  c.color=(base[0]*(1+noise),base[1]*(1-lip+noise),base[2]*(1-lip*.5+noise),1)
 vc=skin.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Complexion';skin.node_tree.links.new(vc.outputs['Color'],skin.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 clothes=[]
 def loft(label,rings,material):
  points=[];fs=[];segments=32
  for center,wx,dy in rings:
   for q in range(segments):
    angle=q*math.tau/segments;points.append(Vector(center)+Vector((wx*math.cos(angle),dy*math.sin(angle),0)))
  for k in range(len(rings)-1):
   for q in range(segments):a=k*segments+q;b=k*segments+(q+1)%segments;fs.append([a,b,b+segments,a+segments])
  fs.append(list(range(segments-1,-1,-1)));fs.append(list(range((len(rings)-1)*segments,len(rings)*segments)))
  o=mesh(label,points,fs,material);clothes.append(o);return o
 shoulder=abs(joint('l-shoulder').x)
 loft('TailoredShirt',[(Vector((0,0,hipz-.025)),.18,.115),(Vector((0,0,hipz+.05)),.185,.125),(Vector((0,0,hipz+.20)),.175,.118),(Vector((0,0,neckz-.22)),shoulder+.025,.13),(Vector((0,0,neckz-.12)),shoulder+.02,.11),(Vector((0,0,neckz-.055)),shoulder+.015,.075),(Vector((0,0,neckz-.025)),.065,.052)],shirt)
 loft('TrouserWaist',[(Vector((0,0,hipz-.15)),.165,.102),(Vector((0,0,hipz-.05)),.18,.118),(Vector((0,0,hipz+.035)),.172,.11)],pants)
 # Limb sleeves are aligned to the unposed anatomical limbs, then skinned with the same rig.
 def tube(label,centers,radii,material):
  points=[];fs=[];segments=24
  for j,c in enumerate(centers):
   direction=(centers[min(j+1,len(centers)-1)]-centers[max(0,j-1)]).normalized();x=direction.cross(Vector((0,1,0))).normalized();y=direction.cross(x).normalized()
   for q in range(segments):angle=q*math.tau/segments;points.append(c+radii[j]*(x*math.cos(angle)+y*math.sin(angle)))
  for j in range(len(centers)-1):
   for q in range(segments):a=j*segments+q;b=j*segments+(q+1)%segments;fs.append([a,b,b+segments,a+segments])
  fs.append(list(range(segments-1,-1,-1)));fs.append(list(range((len(centers)-1)*segments,len(centers)*segments)))
  o=mesh(label,points,fs,material);clothes.append(o);return o
 for side in ['l','r']:
  h=joint(side+'-upper-leg');k=joint(side+'-knee');a=joint(side+'-ankle');sh=joint(side+'-shoulder');el=joint(side+'-elbow');wr=joint(side+'-hand')
  if idx!=3:tube('TrouserLeg',[h+Vector((0,0,.055)),h.lerp(k,.28),h.lerp(k,.65),k,k.lerp(a,.5),a+Vector((0,0,-.025))],[.112,.103,.085,.075,.069,.063],pants)
  if idx in [3,5]:tube('ShirtSleeve',[sh,sh.lerp(el,.2),sh.lerp(el,.70)],[.083,.081,.069],shirt)
  else:tube('ShirtSleeve',[sh,sh.lerp(el,.2),sh.lerp(el,.65),el,el.lerp(wr,.70)],[.083,.081,.066,.061,.052],shirt)
 if idx==3:loft('Skirt',[(Vector((0,0,hipz-.28)),.27,.23),(Vector((0,0,hipz-.16)),.225,.18),(Vector((0,0,hipz+.035)),.173,.112)],pants)
 # Skin is allowed only beyond each cuff. Shoes cover toes and have a separate sole.
 # Sew intersecting garment panels into continuous closed fabric surfaces before skinning.
 sewn=[]
 panels=[[o for o in clothes if o.data.materials[0]==material] for material in [shirt,pants]]
 for parts in panels:
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=parts[0]
  mod=o.modifiers.new('SewnPanels','REMESH');mod.mode='VOXEL';mod.voxel_size=.009;bpy.ops.object.modifier_apply(modifier=mod.name)
  mod=o.modifiers.new('FabricRelax','SMOOTH');mod.factor=1;mod.iterations=6;bpy.ops.object.modifier_apply(modifier=mod.name)
  mod=o.modifiers.new('GameTopology','DECIMATE');mod.ratio=.45;bpy.ops.object.modifier_apply(modifier=mod.name)
  for p in o.data.polygons:p.use_smooth=True
  sewn.append(o)
 clothes=sewn
 # Skeleton joints derive from each morphed anatomy, not from a different character's pose.
 armdata=bpy.data.armatures.new('CitizenRig');arm=bpy.data.objects.new('CitizenRig',armdata);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);body.select_set(False);bpy.ops.object.mode_set(mode='EDIT')
 bones={}
 def bone(n,a,b,parent=None):
  e=armdata.edit_bones.new(n);e.head=a;e.tail=b
  if parent:e.parent=armdata.edit_bones[parent]
  bones[n]=(Vector(a),Vector(b));return e
 bone('Hips',joints['pelvis'],joints['spine-1'])
 bone('Chest',joints['spine-1'],joints['neck'],'Hips');bone('Head',joints['neck'],joints['head-2'],'Chest')
 for side in ['l','r']:
  h=joint(side+'-upper-leg');k=joint(side+'-knee');a=joint(side+'-ankle');toe=Vector((a.x,a.y-.15,.035))
  bone(side+'Thigh',h,k,'Hips');bone(side+'Shin',k,a,side+'Thigh');bone(side+'Foot',a,toe,side+'Shin')
  sh=joint(side+'-shoulder');el=joint(side+'-elbow');wr=joint(side+'-hand');tip=joint(side+'-hand-3')
  bone(side+'Arm',sh,el,'Chest');bone(side+'Forearm',el,wr,side+'Arm');bone(side+'Hand',wr,tip,side+'Forearm')
 bpy.ops.object.mode_set(mode='OBJECT')
 bpy.ops.object.select_all(action='DESELECT')
 for o in [body]+clothes:o.select_set(True)
 arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.parent_set(type='ARMATURE_AUTO')
 if idx==3:
  skirt=clothes[1];skirt.vertex_groups.clear();vg=skirt.vertex_groups.new(name='Hips');vg.add(list(range(len(skirt.data.vertices))),1,'REPLACE')
 for side in ['l','r']:
  a=joint(side+'-ankle');o=ball('Shoe',(a.x,a.y-.055,.058),(.074,.147,.060),shoes);rigid(o,arm,side+'Foot')
  o=ball('Sole',(a.x,a.y-.055,.016),(.076,.149,.018),shoes);rigid(o,arm,side+'Foot')
 # Eyes are real geometry with iris and pupils, attached to head.
 for side in ['l','r']:
  eye=joint(side+'-eye');e=ball('Eye',eye,(.020,.017,.015),white);rigid(e,arm,'Head')
  e=ball('Iris',eye+Vector((0,-.016,0)),(.010,.002,.010),iris);rigid(e,arm,'Head')
  e=ball('Pupil',eye+Vector((0,-.018,0)),(.0045,.001,.0045),black);rigid(e,arm,'Head')
 # Scalp follows the anatomical head; fringe and rear length differ by profile.
 hairfaces=[]
 for p in body.data.polygons:
  c=sum((body.data.vertices[i].co for i in p.vertices),Vector())/len(p.vertices)
  threshold=height-.10 if hairtype in ['short','crop'] else height-.075 if hairtype=='receding' else height-.12
  if c.z>threshold and (c.y>-.085 or c.z>height-.045) or (hairtype in ['bob','pony','curly'] and c.z>height-.24 and c.y>.015):hairfaces.append(list(p.vertices))
 hv=[v.co+v.normal*.006 for v in body.data.vertices];o=mesh('Hair_'+hairtype,hv,hairfaces,hair);rigid(o,arm,'Head')
 if hairtype=='pony':
  o=ball('Ponytail',(0,.105,height-.23),(.055,.054,.14),hair);rigid(o,arm,'Head')
 if hairtype=='curly':
  for q in range(26):
   ang=q*2.4;z=height-.07-(q%4)*.028;o=ball('Curl',(math.cos(ang)*.08,.015+math.sin(ang)*.09,z),(.027,.026,.028),hair);rigid(o,arm,'Head')
 # Different functional accessories, attached to their matching torso bone.
 if idx in [1,5]:
  bag=mat('Backpack',(.10,.085,.065),.93);o=ball('Backpack',(0,.17,hipz+.30),(.135,.08,.20),bag);rigid(o,arm,'Chest')
  for side in [-1,1]:
   o=ball('ShoulderStrap',(side*.115,-.12,hipz+.31),(.013,.012,.17),bag);rigid(o,arm,'Chest')
 # Tailored collar and front buttons distinguish real clothing layers.
 for side in [-1,1]:
  o=ball('Collar',(side*.04,-.055,neckz-.042),(.038,.021,.012),shirt);rigid(o,arm,'Chest')
 for k in range(4):
  o=ball('ShirtButton',(0,-.132,hipz+.10+k*.065),(.004,.002,.004),shoes);rigid(o,arm,'Chest' if k>1 else 'Hips')
 # Bake a stride with a 60% planted stance, heel lift and opposite arm swing.
 rest={b.name:b.matrix_local.to_quaternion() for b in arm.data.bones}
 def aim(n,a,b):
  pb=arm.pose.bones[n];direction=(b-a).normalized();q=(rest[n]@Vector((0,1,0))).rotation_difference(direction)@rest[n]
  pb.matrix=Matrix.Translation(a)@q.to_matrix().to_4x4();bpy.context.view_layer.update()
 def pose(t,walking):
  phase=t*math.tau;bob=.009*(1-math.cos(phase*2)) if walking else .002*math.sin(phase)
  offset=Vector((0,0,bob))
  for n in ['Hips','Chest','Head']:aim(n,bones[n][0]+offset,bones[n][1]+offset)
  for si,side in enumerate(['l','r']):
   ph=(t+si*.5)%1
   hip=bones[side+'Thigh'][0]+offset;oldankle=bones[side+'Shin'][1]
   stride=.62 if walking else 0
   if ph<.6:forward=stride*(.5-ph/.6);lift=0
   else:u=(ph-.6)/.4;forward=stride*(-.5+smoothstep(0,1,u));lift=.095*math.sin(math.pi*u)
   ankle=Vector((hip.x,oldankle.y-forward,oldankle.z+lift))
   a=(bones[side+'Thigh'][1]-bones[side+'Thigh'][0]).length;b=(bones[side+'Shin'][1]-bones[side+'Shin'][0]).length
   # Keep pelvis low enough to avoid knee locking throughout stance.
   hip.z-=.032
   delta=ankle-hip;dist=min(delta.length,a+b-.003);direction=delta.normalized();along=(a*a-b*b+dist*dist)/(2*dist);bend=math.sqrt(max(0,a*a-along*along));pole=Vector((0,-1,0));pole=(pole-direction*pole.dot(direction)).normalized();knee=hip+direction*along+pole*bend
   aim(side+'Thigh',hip,knee);aim(side+'Shin',knee,ankle)
   toe=ankle+Vector((0,-.15,-oldankle.z+.035));aim(side+'Foot',ankle,toe)
   shoulder=bones[side+'Arm'][0]+offset;armLength=(bones[side+'Arm'][1]-bones[side+'Arm'][0]).length;foreLength=(bones[side+'Forearm'][1]-bones[side+'Forearm'][0]).length
   swing=.20*math.sin(phase+si*math.pi) if walking else .012*math.sin(phase)
   sideSign=1 if side=='l' else -1
   elbow=shoulder+Vector((sideSign*.04,swing,-1)).normalized()*armLength
   wrist=elbow+Vector((sideSign*.015,swing-.16,-1)).normalized()*foreLength
   aim(side+'Arm',shoulder,elbow);aim(side+'Forearm',elbow,wrist);aim(side+'Hand',wrist,wrist+Vector((0,-.018,-.10)))
 for clip,walking,duration in [('Walk',True,32),('Idle',False,80)]:
  arm.animation_data_create();action=bpy.data.actions.new(clip);arm.animation_data.action=action
  for f in range(duration+1):
   bpy.context.scene.frame_set(f);pose(f/duration,walking)
   for pb in arm.pose.bones:
    pb.rotation_mode='QUATERNION';pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f)
  track=arm.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,0,action);track.mute=True;arm.animation_data.action=None
 for tr in arm.animation_data.nla_tracks:tr.mute=False
 bpy.context.scene.render.fps=30;bpy.context.scene.frame_set(0)
 # Merge skinned pieces into one mesh: shared materials keep the animated crowd affordable.
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];bpy.ops.object.select_all(action='DESELECT')
 for o in meshes:o.select_set(True)
 bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='Citizen'
 uv=body.data.uv_layers.new(name='FabricUV')
 for face in body.data.polygons:
  for li in face.loop_indices:
   co=body.data.vertices[body.data.loops[li].vertex_index].co;uv.data[li].uv=(co.x*2+co.y*.7,co.z*2)
 bpy.ops.export_scene.gltf(filepath=str(OUT/('pedestrian-'+str(idx)+'.glb')),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_skins=True)
 print('EXPORTED',idx,name,flush=True)
