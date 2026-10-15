import bpy,os,sys
from pathlib import Path
source=Path(sys.argv[sys.argv.index("--")+1]);output=Path(sys.argv[sys.argv.index("--")+2])
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=str(source/'character.fbx'))
output.mkdir(parents=True,exist_ok=True)
for idx,(name,img) in enumerate([(i.name,i)for i in bpy.data.images]):
 if idx not in [0,1,4,7]:continue
 img.scale(2048 if idx==0 else 1024,2048 if idx==0 else 1024)
 img.filepath_raw=str(output/({0:'player-color',1:'player-normal',4:'hair-color',7:'hair-normal'}[idx]+'.png'));img.file_format='PNG';img.save()
for m in bpy.data.materials:
 print(m.name,[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name)for l in m.node_tree.links],flush=True)
