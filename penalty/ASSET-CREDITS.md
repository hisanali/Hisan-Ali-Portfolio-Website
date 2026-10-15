# Penalty Shootout asset credits

## Footballer and captured motion

`assets/footballer.glb` contains the **Adobe Mixamo Ch38 soccer character** and
Mixamo soccer/motion-capture clips, converted with Blender 4.5.9 LTS and glTF Transform 4.5.1
Meshopt compression. It is shared by two independently animated player instances.
The character has modeled hair, shirt, shorts, socks and football boots.
Original diffuse and normal maps supply skin, eyes, hair, kit stitching, number 7
and boot detail. Team colors multiply the kit texture. Goalkeeper gloves are
original skinned attachments made for this game. These are fictional players, without licensed
professional-player likenesses or club marks.

Adobe permits royalty-free character and animation use in personal, commercial
and nonprofit projects, including video games:
https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
These assets are incorporated into this game, not offered as an asset pack.
The Adobe assets are **not CC0**.

Acquisition mirrors and immutable source revisions:

- Character: `unity/Assets/Models/soccer_character.fbx` in
  https://github.com/kuiralabs/midnight-kicks/tree/e81a88ca03c8f78517dc6b0785c50a2a27c987b7
  Its import commit identifies it as the Mixamo soccer character:
  https://github.com/kuiralabs/midnight-kicks/commits/main/unity/Assets/Models/soccer_character.fbx
- Soccer clips: `unity/Assets/Animations/Mixamo/Soccer Game Pack/` in the same revision:
  `offensive idle`, `jog forward`, `soccer penalty kick`, `goalkeeper idle`,
  `goalkeeper diving save`, `goalkeeper diving save (2)`,
  `goalkeeper catch (4)` and `goalkeeper miss`.
- Victory: Mixamo `public/models/animations/victory.fbx` from
  https://github.com/tairqaldy/three.js-3d-portfolio-website/tree/635d20527fb68d5ca4f7e325e64a59529060ff50

The two dive captures provide left/right motion. Low/high variants retime the
captured extension and adapt the world-space reach to the chosen target. The
central jump uses `goalkeeper catch (4)`. The visible glove position supplies
the collision point; the clips do not change the rules or award a synthetic save.
The strike's contact event is 0.76 seconds into the converted penalty clip.

The GLB is **1,002,560 bytes**, including all nine animations and Meshopt-compressed
geometry and tracks. One download serves both players. Separate WebP diffuse and
normal textures retain the original character detail. This is a game character,
not a scanned face. Natural captured dive motion is adapted at the root for target
reach and landing support; it is not a full-body rigid-body simulation.

### Rebuilding the asset (offline art pipeline only)

No asset conversion or build runs in the browser. Download the files above into
a local source directory, naming them `character.fbx`, `idle.fbx`, `run.fbx`,
`kick.fbx`, `ready.fbx`, `dive.fbx`, `dive2.fbx`, `jump.fbx`,
`disappointed.fbx`, and `celebrate.fbx`, respectively. Then run:

```sh
blender -b -t 2 --python penalty/tools/convert-assets.py -- /absolute/source/directory /absolute/output/footballer.glb
```

After Blender conversion, resample and compress the GLB with glTF Transform:

```sh
npx --yes --package=@gltf-transform/cli gltf-transform resample footballer.glb resampled.glb
npx --yes --package=@gltf-transform/cli gltf-transform meshopt resampled.glb footballer-final.glb --level high
```

`tools/extract-textures.py` extracts embedded source maps and
`tools/render-crowd.py` renders eight spectator variants from the same licensed
character. Both are offline Blender utilities. Convert their PNG output to WebP;
none of these tools runs on the public site.

## Grass and crowd sound

- Grass color, normal and roughness: **ambientCG Grass005**, CC0.
  https://ambientcg.com/view?id=Grass005
  License: https://docs.ambientcg.com/license/
  Converted to WebP; mowing stripes and penalty-spot wear are original additions.
- `stadium-bed.mp3`: **Football stadium.wav**, BeeProductive, CC0.
  https://freesound.org/people/BeeProductive/sounds/395592/
  A filtered 28-second excerpt, encoded to MP3 with fades.
- `crowd-reaction.mp3`: **Soccer stadium Oehh2.wav**, Sandermotions, CC0.
  https://freesound.org/people/Sandermotions/sounds/494361/
  Encoded to MP3 with short fades.
- `referee-whistle.mp3`: **Referee whistle sound.wav**, Rosa-Orenes256, CC0.
  https://freesound.org/people/Rosa-Orenes256/sounds/538422/
  Encoded to MP3. No music is included.

## Original game assets

The panelled football and recessed seams, close grass blades, stadium structure,
seats, goal/net, lighting, trail, interface and fallback synthesized effects are
created by this game's code. `spectators.webp` contains eight Blender renders of
the credited Mixamo character, with kit-color and pose variations. Crowd sprites
use instanced camera-facing geometry with animated cheering.

## Libraries and fonts

- Three.js r180, GLTFLoader, SkeletonUtils, EffectComposer, RenderPass,
  UnrealBloomPass and OutputPass: MIT, reused from `evermile/vendor/`.
  https://github.com/mrdoob/three.js
- Meshoptimizer 0.22 decoder: MIT, `penalty/vendor/meshopt_decoder.module.js`.
  License: `penalty/vendor/MESHOPT-LICENSE.md`.
  https://github.com/zeux/meshoptimizer
- Manrope and DM Serif Display: SIL Open Font License, loaded from Google Fonts.
  https://fonts.google.com/specimen/Manrope
  https://fonts.google.com/specimen/DM+Serif+Display
