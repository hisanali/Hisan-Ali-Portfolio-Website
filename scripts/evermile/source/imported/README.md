# Imported sources

Licenses, creators, download URLs and modifications are listed in `evermile/ASSET-CREDITS.md`.

- `import-crowd.py`: eleven CC0 Quaternius civilian characters, native locomotion clips.
- `import-citizens.py`: corrects opposite source root orientations when retargeting Mixamo motion to Michelle.
- `import-animals.py`: preserves Quaternius/Khronos rigs, welds disconnected flat-shaded vertices before subdivision, adds face details.
- `import-motorcycle.py`: converts the CC0 GYO Blender file, extracts wheel islands, separates the steering assembly, and corrects tyre materials.
- `import-passenger-cars.py`: converts CC BY cars and adds wheel/lamp anchors.
- `import-buildings.py`: assembles CC0 Poly Haven facade modules into closed buildings and a fort.

Run scripts with Blender 4.5 in background mode from any directory. Source assets are data, not executable code; GYO is opened with Python autorun disabled. Runtime GLBs embed their textures so they do not depend on external asset hosting.
