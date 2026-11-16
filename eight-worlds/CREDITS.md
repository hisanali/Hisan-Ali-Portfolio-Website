# Credits and sources

Everything here was fetched from public repositories. Licences differ; check them before redistributing the
assets outside this project.

## Code
- three.js r187, MIT — `vendor/three`.
- Tree geometry in `assets/models/*.tree` was generated offline with **EZ-Tree** by Dan Greenheck (MIT).
  Bark and leaf textures (`bark_*`, `leaf_*`) and the three flower models come from the same package.

## Textures (`assets/tex`)
- Poly Haven scans (CC0), taken from the PlayCanvas engine examples: `rockface` (rock_face_03), `cliff`
  (aerial_rocks_02), `grass` (sparse_grass), `grassrock` (aerial_grass_rock), `beach` (aerial_beach_01),
  `cracked` (rock_boulder_cracked).
- ambientCG scans (CC0): `dune` (Ground092C) and `block` (Bricks076A) via the PlayCanvas examples;
  `rock23` (Rock023) and `forest` (Ground037) via the Terrain3D demo project.
- `seaside`, `smoke` flipbook: PlayCanvas engine examples (MIT repository).
- `moss`, `gravel`: Google Filament sample textures (Apache-2.0 repository).
- `greyrock`, `strata`, `snow`, `lava`, `basalt`, `paving`, `sandsoft`: Wicked Engine terrain content (MIT repository).
- `wood`, `waternormals`, `lavatile`: three.js examples.
- `broadleaf` foliage atlas: Babylon.js Assets repository.

## Sound (`assets/audio`)
Field recordings trimmed and re-encoded from the **Moodist** project (github.com/remvze/moodist), which
collects them from Pixabay and similar libraries under their respective licences; `winter` is from the
Babylon.js Assets repository. Ice cracks and the deep volcanic and glacial rumble are synthesised in
`src/audio.js` because no suitable recording was available.
