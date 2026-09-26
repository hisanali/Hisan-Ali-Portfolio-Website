# Evermile asset credits

## Detailed sports car

Ferrari 458 Italia model by **vicent091036**, distributed with the official Three.js car materials example.

- Creator/model: https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6
- Official example: https://threejs.org/examples/webgl_materials_car.html
- Asset source: https://github.com/mrdoob/three.js/blob/r180/examples/models/gltf/ferrari.glb

Evermile adapts the model's materials, paint, orientation, wheel animation and lighting for driving. The vehicle model is third-party work, not modeled from scratch for Evermile. Vehicle names and emblems belong to their respective owners.

## Libraries

Three.js r180, GLTFLoader, DRACOLoader and BufferGeometryUtils: MIT license, included at vendor/LICENSE. https://github.com/mrdoob/three.js

Draco glTF decoder: Google Draco, Apache License 2.0. License included at vendor/draco/LICENSE. https://github.com/google/draco

## Typography

Manrope and DM Mono are loaded through Google Fonts, with system fallback fonts.

## Authored assets

Game interface, procedural landscape, road, sky, vegetation textures, fallback vehicles, driving controls and simulation are authored for Evermile.

## Scanned material upgrade

The 1K diffuse, OpenGL normal and roughness maps in `assets/materials/` are
CC0 assets from Poly Haven: [Rock Wall 11](https://polyhaven.com/a/rock_wall_11),
[Asphalt 03](https://polyhaven.com/a/asphalt_03),
[Forest Ground 04](https://polyhaven.com/a/forest_ground_04),
[Bark Brown 02](https://polyhaven.com/a/bark_brown_02), and
[Clay Roof Tiles](https://polyhaven.com/a/clay_roof_tiles).
Download URLs and verified source MD5 hashes are recorded in `assets/materials/sources.json`.
Destination geometry is original procedural artwork inspired by the user's references;
it is not a geographic reconstruction or extracted content from another game.

## Anatomical pedestrians

`assets/models/pedestrian-0.glb` through `pedestrian-5.glb` use the **MakeHuman hm08 base mesh** and six adult macro targets from MakeHuman Community. These source assets are **CC0**; their original copyright and explicit CC0 notice remain in `scripts/evermile/source/human-base.obj` and the target files.

- Base: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj
- Targets: https://github.com/makehumancommunity/makehuman/tree/master/makehuman/data/targets/macrodetails
- License: https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md

Evermile adds separate clothing, hair/accessories, complexion, a matching skeleton and authored Walk/Idle animation. The six bodies are not scans of identifiable people. Their build script and exact source inputs are in `scripts/evermile/build-pedestrians.py` and `scripts/evermile/source/`. No Mixamo animation or Michelle character remains in these pedestrian assets.

## Animals

Cow, sheep, dog and cat GLBs are authored for Evermile by `scripts/evermile/build-animals.py`. Their articulated heads, limbs and tails retain the game's original behavior. These are modeled animals, not scans.

The additional **Fox** comes from the Khronos glTF Sample Assets collection. Model by **PixelMannen** (CC0); rigging/animation by **tomkranis** (CC BY 4.0); glTF conversion by **Asobo Studio** and **scurest** (CC BY 4.0).

- Source and attribution: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox
- License: https://creativecommons.org/licenses/by/4.0/

## Detailed traffic car

**Car Concept**, by **Eric Chadwick**, copyright 2024 **Darmstadt Graphics Group GmbH**, licensed **CC BY 4.0**, from Khronos glTF Sample Assets. Evermile decimates geometry and adapts orientation, materials, paint and moving wheels; it is a modified version. Logos are subject to their respective trademark rights.

- Source, license and metadata: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept
- License: https://creativecommons.org/licenses/by/4.0/
- Original retained at `scripts/evermile/source/CarConcept.glb`; optimized runtime asset: `assets/models/traffic-car.glb`.

SkeletonUtils and OrbitControls are also from Three.js r180 under the included MIT license.
