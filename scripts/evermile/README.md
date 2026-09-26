# Evermile model sources

Run from the repository root using Blender 4.5:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/evermile/build-pedestrians.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/evermile/build-animals.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/evermile/prepare-models.py
node --test tests/evermile/*.test.mjs
```

The builders write the runtime GLBs to `evermile/assets/models/`. They create their own temporary scene in the background Blender process; no user Blender project is opened or saved. Exact CC0 human base/target inputs and original attributed CarConcept source are retained in `source/`. See `evermile/ASSET-CREDITS.md` for upstream URLs and licenses. Source and output hashes are in `model-manifest.json`.

Pedestrians have six distinct adult anatomical meshes, sewn clothing volumes, hair, eyes, accessories, and separate Walk/Idle clips. Each model's skeleton derives from its own morphed anatomy. The authored walk has a 60% planted stance and a 0.62 m foot travel over that stance; runtime playback speed is matched to actual world movement. Bone transforms are evaluated between parent/child assignments while baking, including frame zero and the loop seam. Tests verify all six clips and the umbrella arm solver.

Animals retain the existing pool, behavior and collision roots. Their detailed meshes replace near-distance appearance; distant animals use the original cheaper models. Named Head/Neck/Tail/Hip/Knee controls follow the existing animation. These are original modeled animals, not photogrammetry or production fur simulations.

`evermile/model-studio.html` previews the actual exported assets. No raster scene images are substituted for 3D geometry.
