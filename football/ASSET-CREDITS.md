# Football 3D — assets and offline pipeline

Free assets only. Teams and supporting players are fictional; Ronaldo and
Messi use the credited community likenesses below. Dream League Soccer is a
visual/gameplay reference; no DLS assets, branding, audio or code are included. Runtime is static ES modules with no build step.

## Footballer and animations

`assets/athlete-match.glb`: Adobe Mixamo Ch38, shirt, shorts, socks, boots and
hair, with an independent mixer per player. The 3.18 MB meshopt package includes subdivided close-up meshes, original match
meshes, and 42-percent triangle-count meshes for 7/11-a-side matches on phones.
Distance selects the close-up tier; all three share the same skeleton and clips. Four lightweight face-width, hair
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
python3 football/tools/fetch-motions.py /tmp/football-source
blender -b --python football/tools/build-athlete.py -- /tmp/football-source /tmp/match.glb /tmp/football-source
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
  resized WebP derivatives of ambientCG **Grass004**, CC0.
  <https://ambientcg.com/view?id=Grass004>,
  <https://docs.ambientcg.com/license/>. Source: `Grass004_1K-JPG.zip`;
  Color 1024px, NormalGL 512px, Roughness 256px. Broad mowing bands,
  a green tint, dry blade roughness and subtle penalty-spot wear are applied
  in the material shader. Source download and conversion: `tools/fetch-turf.py`.
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

## October 2026 stadium and control revision

- `stadium.js`: original rounded-rectangle seating bowl, curved tensile roof,
  radial supports, dugouts and score screens. The visual brief referenced
  [Al Wakrah Stadium Worldcup 2022 by Ninh Phạm](https://sketchfab.com/3d-models/al-wakrah-stadium-worldcup-2022-d7452e247d55493e8e6a9c086a4eafe6).
  Sketchfab's public API lists 1,168,874 triangles and CC BY-NC-SA 4.0;
  this revision does not use its download. No geometry or textures from
  that model are included. This is an original stadium concept, not an exact
  reconstruction of Al Janoub.
- The existing licensed Mixamo athlete and clips remain for teammates and
  referees. Captains use the separately credited community models below.
- Existing CC0 turf, concrete and environment maps above are retained. Turf
  mowing, crowd variation, lighting, canopy, net deformation and camera work
  are implemented in code. No new raster asset was generated; the daylight sky is the CC0 HDR below.
- `control.js` applies discrete touch impulses and the shared SI-unit ball
  integrator between contacts. Player acceleration/turning remain simulated;
  ball reception cushions incoming speed. These are game approximations,
  not motion-capture-derived or experimentally validated sports models.
- Replays interpolate root transforms and every recorded bone's translation
  and rotation using actual snapshot timestamps. Replay state is cleared when
  starting a new match, including a different team size.

## Real-player captains (October 17, 2026)

- `assets/ronaldo.glb`: [Cristiano Ronaldo Rigged](https://sketchfab.com/3d-models/cristiano-ronaldo-rigged-66bb90f3f8d043eab3ab1e05ada4caba)
  by [lolohno75](https://sketchfab.com/lolohno75),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
  Downloaded using Sketchfab's authenticated GLB download. Normalized to 1.87m,
  baked the authored T-pose into the mesh and skeleton before retargeting,
  rotated to match game coordinates, renamed joints, retargeted 28 existing
  licensed Mixamo actions, generated reduced geometry, compressed mesh/textures.
- `assets/messi.glb`: [3D Lionel Messi Barca Jersey](https://sketchfab.com/3d-models/3d-lionel-messi-barca-jersey-7a2877c80f7a49018b425f223fb11049)
  by [caonghia2009](https://sketchfab.com/caonghia2009),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
  Downloaded using Sketchfab's authenticated GLB download. Repaired Character
  Creator bind pose, normalized to 1.70m, retargeted the same motions, added
  socks and fitted the boot mesh from the credited Ronaldo model. Reduced
  geometry and compressed mesh/textures.
- `player-kits.js` adapts authored garment maps to selected team colors; face,
  skin and hair maps are retained. These are community likenesses in fictional
  exhibition teams, not official rosters, endorsements or live player ratings.
- `assets/daylight-sky.bin`: [Kloofendal 48d Partly Cloudy Puresky](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky),
  Greg Zaal and Jarod Guest, Poly Haven, CC0. Original 1K HDR retained.
  MD5: `c69498687e876bf68d2a8b8a62234eb9`.
- Rebuild models with `tools/retarget-player.py` using Blender 4.5+, first
  Ronaldo, then Messi in the same output directory (the latter fits his boots).
  Supply the downloaded GLBs and the previously credited FBX motion folders.
  The importer checks both upper-arm and forearm directions against every source
  motion frame; preserving the authored pose prevents folded-arm regressions.
  Compress with glTF Transform `optimize --compress meshopt --texture-compress webp --texture-size 1024`.
  User-facing attribution is available in [credits.html](credits.html).

## Full-squad replacement (October 17, 2026)

- `assets/squad.glb`: [Man Player](https://sketchfab.com/3d-models/man-player-4c7133dbb06e4136891d59231372d818)
  by [RiverofCreative](https://sketchfab.com/RiverofCreative),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
  Downloaded through the authenticated Sketchfab download. Replaced the previous
  stylized supporting athletes and officials. Normalized to 1.82m, baked the
  authored T-pose, retargeted motion, split sock cuffs, fitted the above-credited
  Ronaldo boots, created reduced geometry, compressed textures and mesh.
  `squad.js` varies adult builds, face geometry, skin/hair tint and shirt numbers.
  Retains the author's skin, eye, hair, fabric and normal maps.
- Walking motion: Adobe Mixamo's Walk clip, supplied in the official Three.js
  [Soldier sample](https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Soldier.glb)
  and demonstrated by its [animation blending example](https://threejs.org/examples/webgl_animation_skinning_blending.html).
  Only animation is used; no soldier geometry is included in football. Copy the
  source GLB to the motion folder as `walk.glb` before running the retarget tool.
  Its authored T-pose defines the source rest rotations and coordinate alignment.
- Each player asset now contains 29 actions. Walking, jogging and sprinting share
  phase-aligned blends calibrated from each model's feet. Ground contact, turning,
  acceleration and head tracking are shared by all players in `locomotion.js`.
