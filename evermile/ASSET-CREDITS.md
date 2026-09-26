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

## Imported everyday vehicles (September 2026)

Six passenger vehicles — saloon, hatchback, SUV, estate, pickup and van — are modified versions of **Generic Passenger Car Pack** by **Comrade1280**, licensed **CC BY 4.0**.

- Creator: https://sketchfab.com/3d-models/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5
- Source distribution and license: https://github.com/TUM-VT/Sumonity-PassengerCars
- License: https://creativecommons.org/licenses/by/4.0/

Evermile converts the FBX models to GLB, corrects orientation, separates wheel axles, adapts lamp materials and retains the original body textures. Runtime files are `road-*.glb`; source FBXs, textures and license are retained in `scripts/evermile/source/passenger-cars/`. The older Car Concept asset is retained for provenance but is no longer used as everyday traffic.

The playable **GYO motorcycle** is by **サラダたまご / BlenderでファンタジーCG！**, released **CC0**. Evermile separates wheels and steering parts, converts materials, and adds the game's rider and handling.

- Creator and explicit CC0 release: https://blenderfantasycg.seesaa.net/article/503528383.html
- Original archive: https://blenderfantasycg.up.seesaa.net/image/motorcycle-gyo.zip
- Runtime: `motorcycle-gyo.glb`; original Blender file/textures: `scripts/evermile/source/motorcycle/`.

## Imported civilian crowd

Eleven civilian characters (casual clothes, hoodie, business suits, workwear, farmer, beachwear, formal dress and streetwear) are from **Quaternius Ultimate Modular Men / Women**, **CC0**. Evermile welds split surface vertices, smooths the silhouettes, preserves the original skeletons, and retains Walk, Idle and Run clips.

- Creator: https://quaternius.com/packs/ultimatemodularmen.html
- Creator: https://quaternius.com/packs/ultimatemodularwomen.html
- Download mirror: https://github.com/agentkaerf/FreeModels
- Original CC0 notices: `scripts/evermile/source/imported/man-LICENSE.txt` and `woman-LICENSE.txt`.

**Michelle** and **Vanguard/Soldier** are Mixamo characters distributed in the official Three.js examples. Mixamo assets/animations are royalty-free for use in games under Adobe's Mixamo terms; they are not claimed to be CC0 or covered by the Three.js software license. Evermile retargets the Soldier walk/idle to Michelle with corrected root orientation and preserved joint lengths. Vanguard is available for inspection in Model Studio; it is not spawned as a civilian.

- Source: https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf
- Mixamo use FAQ: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

## Imported animals

The current cow and Shiba Inu dog are from **Quaternius Ultimate Animated Animals**, **CC0**. The earlier sheep from **Quaternius LowPoly Animated Farm Animal Pack**, **CC0**, is retained as a source reference. Evermile preserves the cow/dog rigs and clips and welds/smooths their surfaces. They are stylized game models, not scans.

- Creator: https://quaternius.com/packs/ultimateanimatedanimals.html
- Sheep creator/license: https://opengameart.org/content/lowpoly-animated-farm-animal-pack
- Sheep download: https://github.com/gfxfundamentals/threejsfundamentals/tree/master/threejs/resources/models/animals
- Cow distribution: https://github.com/mars-tw/storm-apocalypse/blob/main/public/models/cow.glb
- Dog distribution: https://github.com/wehrleymullanag18-design/mori-together/blob/main/public/assets/pets/dog.glb

**Bicolor Cat** by **kenchoo**, licensed **CC BY 4.0**, retains its textured mesh, rig and idle animation.

- Creator: https://sketchfab.com/3d-models/bicolor-cat-e623a618ca344a8393d7ba4d63ec23cf
- Distribution: https://github.com/code4fukui/vr-cats
- License: https://creativecommons.org/licenses/by/4.0/

The modified Khronos **Fox** retains the credits above. Evermile smooths its silhouette and adds eyes, nose and mouth geometry bound to its animated head. The older authored animal files remain as source/fallback references; close-up animals use the imported models.

## Imported architecture

**Modular Urban Apartments Facade**, **Modular Factory Facade**, and **Modular Fort 01** are from **Poly Haven**, **CC0**. Evermile assembles closed apartment/brick buildings and a coastal fort from their modular meshes, retains PBR texture maps, and reduces geometry for street viewing.

- https://polyhaven.com/a/modular_urban_apartments_facade
- https://polyhaven.com/a/modular_factory_facade
- https://polyhaven.com/a/modular_fort_01
- License: https://polyhaven.com/license

These are adapted architectural assemblies, not scanned replicas of the user's reference locations. No paid model was purchased.


## Coach, city bus, sheep and roadside imports

The coach and city bus are two adaptations of **3D Bus** by **ajanhallinta**, **CC0**. Evermile converts the original authored mesh, uses separate wheel axles, adds interior seats and destination panels, and adapts materials and lights. These are two liveries of one source bus, not two independently modelled vehicles.

- Source and license: https://opengameart.org/node/79570
- Runtime: `road-coach.glb`, `road-bus.glb`.
- Original archive and source: `scripts/evermile/source/transport/bus/`.

The current textured sheep is **Sheep** by **pracalic**, **CC0**. Evermile restores legacy textures as PBR materials, changes the face material, adds eye/nostril geometry, and extracts/retimes a cyclic four-leg gait from the original rigged performance. Its proportions remain stylized.

- Source and license: https://opengameart.org/content/sheep
- Runtime: `sheep-textured.glb`; source: `scripts/evermile/source/transport/sheep/`.

The station pump, shop, canopy, ice cabinet and bins come from **Gas Station** by **Elbolilloduro**. The creator's itch.io page releases the models as **CC0** and identifies some texture sources as Pexels/textures.com; this is not a claim that every original third-party texture is CC0. Evermile converts FBX, reconnects supplied maps, separates modules, adjusts scale and keeps the shop interior.

- Creator, download and terms: https://elbolilloduro.itch.io/gas-station
- Runtime: `prop-pump.glb`, `prop-shop.glb`, `prop-canopy.glb`, `prop-ice.glb`, `prop-bin.glb`.
- Source: `scripts/evermile/source/transport/station/`.

The traffic-signal housing is adapted from **Kenney City Kit Roads**, **CC0**. Evermile rescales the housing, adds separate lenses and LED textures, and connects them to the existing junction phases.

- Source and license: https://opengameart.org/content/city-kit-roads
- Runtime: `prop-signal.glb`; source and license: `scripts/evermile/source/transport/signals/`.


## User-supplied models — 26 September 2026

**1982 Mercedes W201** by **Dave Love SketchFab / Tyler_Dave**, **CC BY 4.0**, supplied as `1982_mercedes_w201.glb`.

- Source embedded in the file: https://sketchfab.com/3d-models/1982-mercedes-w201-9b2ea34482654173a7f421aab8f1b287
- Adaptation: metre scale, independent wheel/caliper rigs, removal of duplicate motion-blur meshes, lamp anchors, glass/material adjustments, playable saloon and traffic integration.

**EngineTrain** by **DJMaesen**, **CC BY 4.0**, supplied as `enginetrain.glb`.

- Source embedded in the file: https://sketchfab.com/3d-models/enginetrain-b90db0a968dd4ddd85e04eab7f15163f
- Adaptation: remove the source track diorama, fit the existing locomotive slot, preserve textures, separate twelve rolling wheels, batch static bogie/body parts. Existing rail paths, carriages and crossing control remain in use.

**HORSE - Realistic 3D Model (DEMO FREE)** and **FOX - Realistic 3D Model (DEMO FREE)** by **WildMesh 3D**, marked **CC BY-NC 4.0** in both supplied GLBs. The original non-commercial license designation is retained; user approval to use the models does not change that designation.

- Horse: https://sketchfab.com/3d-models/horse-realistic-3d-model-demo-free-65d6a70a6721495f938c93e80a5998e4
- Fox: https://sketchfab.com/3d-models/fox-realistic-3d-model-demo-free-83b1b144712c43d282d90c2fb15ba450
- Adaptation: native glTF rigs/animation channels retained, clip names standardized, legacy specular/glossiness materials converted to metallic/roughness, saddle meshes omitted from the field horse. Walk/idle blend is driven by actual travel.

**Bighorn demo** was supplied as `bighorn-realistic-3d-model-demo-free.zip`, containing `BIGHORN_DEMO.fbx` and two textures. No license text or source-page link was included in that archive. Attribution/source details were not supplied; the archive metadata remains unresolved. The FBX rig, walk/idle clips and textures are converted to GLB; the separate horn mesh retains its original head-bone attachment, and the native breathing loop supplies the idle state.

Original supplied files are retained under `scripts/evermile/source/supplied/`. Conversion is reproducible with `scripts/evermile/import-supplied.py`. The user authorized publication of this supplied-asset pass on 26 September 2026.
