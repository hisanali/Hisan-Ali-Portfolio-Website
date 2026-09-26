"""Run with Blender --background --python scripts/evermile/prepare-models.py.
Optimizes the attributed concept-car source for repeated traffic use.
The original downloaded model is left intact.
"""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'scripts/evermile/source/CarConcept.glb'))
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 if len(o.data.polygons)>1800:
  bpy.context.view_layer.objects.active=o
  dec=o.modifiers.new('Traffic LOD','DECIMATE');dec.ratio=.38
  bpy.ops.object.modifier_apply(modifier=dec.name)
 for poly in o.data.polygons:poly.use_smooth=True
bpy.ops.export_scene.gltf(filepath=str(root/'evermile/assets/models/traffic-car.glb'),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False)
print('Traffic car exported')
