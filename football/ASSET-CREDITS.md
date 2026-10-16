# Football 3D — assets and offline pipeline

Free assets only. Players and teams are fictional. Dream League Soccer is a
visual/gameplay reference; no DLS assets, branding, players, audio or code are
included. Runtime is static ES modules with no build step.

## Footballer and animations

`assets/athlete-match.glb`: Adobe Mixamo Ch38, shirt, shorts, socks, boots and
hair, with an independent mixer per player. The package includes full and 42-percent
triangle-count skinned meshes; 7/11-a-side matches on phones select the lighter set. Four lightweight face-width, hair
shape, height, skin-tone and boot-colour variations share geometry caches.
Numbers are drawn over the authored shirt UV island at runtime. Goalkeeper
latex gloves are generated from the hand-weighted mesh using the original
`penalty/equipment.js` implementation. This is a game character, not a scan of a
professional footballer. There is no facial performance capture.

Adobe Mixamo permits royalty-free use of characters and animation in games:
<https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html>.
These assets are not CC0; this repository incorporates them into this playable
game and does not offer a character/animation asset pack.

Acquisition mirrors (the original asset creator/licensor remains Adobe Mixamo):

- Character: `unity/Assets/Models/soccer_character.fbx`.
- Soccer Game Pack at immutable revision
  <https://github.com/kuiralabs/midnight-kicks/tree/e81a88ca03c8f78517dc6b0785c50a2a27c987b7/unity/Assets/Animations/Mixamo/Soccer%20Game%20Pack>.
  Sources: offensive idle; goalkeeper idle; diving save and diving save (2);
  jog forward/backward; jog strafe left/right; kick soccerball and (2); strike
  foward jog; receive soccerball; soccer tackle and (2); header soccerball;
  throw in; goalkeeper catch (2); goalkeeper body block; goalkeeper overhand
  throw; goalkeeper drop kick.
- Additional Adobe Mixamo animations from Linzhan's mirror, immutable revision
  <https://huggingface.co/datasets/Linzhan/Mixamo-Animations-Characters/tree/7f134bc734557b1d9516cb476d25ea1f577e45c1/animation>:
  `Sprint.fbx`, `Dribble.fbx` (Forward Jog Dribbling Soccer Ball),
  `Running_Right_Turn.fbx`, `Running_Turn_180.fbx`, `Soccer_Pass.fbx`,
  `Victory.fbx`, `Victory_2.fbx`.
- Original victory source shared with Penalty:
  <https://github.com/tairqaldy/three.js-3d-portfolio-website/tree/635d20527fb68d5ca4f7e325e64a59529060ff50>,
  `public/models/animations/victory.fbx`.

Clips are baked onto the common canonical Mixamo skeleton offline in Blender.
Horizontal hips motion is consumed by the match movement controller; captured
vertical movement is retained. Turning clips remove their extra hips yaw so
that controller heading and captured turning posture do not rotate twice.
Foot contacts use analytic two-bone IK; kick contact uses a short foot target.
The `punch` action adapts the captured goalkeeper body-block motion with hand
reach. It is not a separately captured aerial two-fist punch.

### Rebuild

`tools/build-athlete.py` takes a base source directory, an output GLB, and an
additional motion directory. Filenames used by the exporter match the runtime
clip names, with `.fbx` extensions. The base files are the same licensed sources
used for Penalty; additional source mapping is above and in
`tools/fetch-motions.py`. Raw FBX files are deliberately not committed.

```sh
blender -b --python football/tools/build-athlete.py -- /absolute/base /tmp/match.glb /absolute/motions
npx --yes --package=@gltf-transform/cli@4.5.1 gltf-transform resample /tmp/match.glb /tmp/match-resampled.glb
npx --yes --package=@gltf-transform/cli@4.5.1 gltf-transform meshopt /tmp/match-resampled.glb football/assets/athlete-match.glb --level high
```

## Surface maps, stadium and lighting

- `assets/player-detail.webp`, `player-normal.webp`, `hair-color.webp`, plus
  shared `penalty/assets/hair-normal.webp`: resized derivatives of the licensed
  Mixamo atlas and the project's prior AI-assisted UV refinement. Exact original
  edit prompt: [player-detail.prompt.txt](../penalty/assets/player-detail.prompt.txt).
  No new generative artwork was created for this Football update.
- `assets/pitch-color.webp`, `pitch-normal.webp`, `pitch-roughness.webp`:
  resized derivatives of TextureCan **Ground 0040**, CC0.
  <https://www.texturecan.com/details/469/>,
  <https://www.texturecan.com/terms/>. Original green turf shading, fine blade
  grain and broad circular mowing bands are applied in the material shader.
- `assets/concrete-normal.webp` and shared `penalty/assets/concrete-color.webp`:
  Poly Haven **Concrete Wall 006**, CC0.
  <https://polyhaven.com/a/concrete_wall_006>.
- `assets/stadium-light.bin`: 512×256 Radiance HDR derivative of **Stadium 01**,
  Sergej Majboroda / Poly Haven, CC0.
  <https://polyhaven.com/a/stadium_01>. Extension `.bin` is required by the site's
  static-file allowlist; the contents remain HDR. Used for environment lighting,
  not projected as a second visible stadium.
- Shared `penalty/assets/crowd-fans.webp`: original synthetic AI-generated fan
  portraits, 32 cells, instanced and animated. Original generation prompt:
  [crowd-fans.prompt.txt](../penalty/assets/crowd-fans.prompt.txt).
- Stadium bowl/roof/trusses/seats/scoreboard: original project procedural
  geometry in `penalty/stadium.js`. Corner flags, advertising, referee,
  assistants and camera operators/crews are original economical geometry in
  `presentation.js`. Officials are stylized background figures, not mocap actors.
- Ball: original truncated-icosahedron panels, recessed seams and generated
  micro-bump surface, adapted from the project's Penalty implementation.

## Recorded audio

All recordings are CC0; shared with Penalty. No commercial commentary or music.

- Stadium/crowd bed and goal-volume swell: BeeProductive,
  **Football stadium.wav**:
  <https://freesound.org/people/BeeProductive/sounds/395592/>.
- Near-miss crowd reaction: Sandermotions, **Soccer stadium Oehh2.wav**:
  <https://freesound.org/people/Sandermotions/sounds/494361/>.
- Ball strike: bittermelonheart, **Soccer Ball Kick**:
  <https://freesound.org/people/bittermelonheart/sounds/555042/>.
- Fallback touches, whistle and post resonance are original Web Audio synthesis.

## Libraries and fonts

- Three.js r180, loaders, SkeletonUtils and postprocessing: MIT;
  shared `evermile/vendor/` and `penalty/vendor/three-addons/`.
  <https://github.com/mrdoob/three.js>.
  License: [THREE-LICENSE.md](../penalty/vendor/THREE-LICENSE.md).
- Meshoptimizer decoder: MIT, shared `penalty/vendor/meshopt_decoder.module.js`.
  <https://github.com/zeux/meshoptimizer>.
  License: [MESHOPT-LICENSE.md](../penalty/vendor/MESHOPT-LICENSE.md).
- Manrope and DM Serif Display: SIL Open Font License, served by Google Fonts.
  <https://fonts.google.com/specimen/Manrope>,
  <https://fonts.google.com/specimen/DM+Serif+Display>.
