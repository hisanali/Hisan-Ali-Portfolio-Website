# Penalty Shootout — asset credits and art pipeline

All runtime assets are served as static files. No paid asset was purchased.
Players are fictional; this game does not license professional-player likenesses,
club identities or official tournament branding.

## Athletes and motion

`assets/athlete.glb` is based on **Adobe Mixamo Ch38**, with a refined surface,
shirt, shorts, socks, boots, hair and eight animation clips. Blender subdivision
retains the original UVs and skin weights. Meshopt compresses the geometry and
animation tracks. The package is **1,579,504 bytes**, shared by independently
animated taker and goalkeeper instances. Approximate standing heights are 1.79 m
and 1.88 m. Goalkeeper gloves are original fitted skinned shells generated from
the character's hands; cuffs are original geometry.

Adobe permits royalty-free use in games:
https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
These Adobe assets are not CC0 and are incorporated into the game rather than
offered as an asset pack.

Original acquisition mirrors and immutable source revisions:

- Character: `unity/Assets/Models/soccer_character.fbx` from
  https://github.com/kuiralabs/midnight-kicks/tree/e81a88ca03c8f78517dc6b0785c50a2a27c987b7
- Mixamo clips: Soccer Game Pack in that same revision — offensive idle,
  goalkeeper idle, two diving saves, catch (4) and miss; plus victory below.
  The superseded jog and strike and the untrimmed studio take are omitted.
- Victory: `public/models/animations/victory.fbx` from
  https://github.com/tairqaldy/three.js-3d-portfolio-website/tree/635d20527fb68d5ca4f7e325e64a59529060ff50

The active strike uses **Rokoko / Sam Lazarus — Soccer_PenaltyKick_mixamo.fbx**,
from the free sports capture pack. The publisher permits commercial game use:
https://www.rokoko.com/resources/rokoko-mocap-12-free-sports-animations
Publisher's download folder:
https://drive.google.com/drive/folders/1lazpVXEa5Om8lEBmCUDGxueZdUgLnBr4

Frames 531–611 are trimmed and retargeted. Ground contact is at 1.10 seconds in
the resulting clip. Leg IK aligns the boot and support foot to the ball and turf.
Keeper capture variants adapt lateral reach and use ballistic additional lift,
short-range hand IK and anatomical contact capsules. These are game animation
adaptations, not full-body rigid-body dynamics.

### Character texture refinement

`player-detail.webp` is an AI-assisted surface refinement of the original licensed
Mixamo diffuse UV atlas: skin pores/stubble, technical fabric and boot detail.
The original normal and hair maps are retained. The original atlas remains as
`player-color.webp` for art-pipeline reference. Original UV layout and number 7
are retained. Built-in image_gen edit mode was used, not an API/CLI fallback.

Exact prompt: [player-detail.prompt.txt](assets/player-detail.prompt.txt).

### Offline conversion

Use `tools/build-hero.py` with the original FBX source directory. In addition to
the filenames documented in `tools/convert-assets.py`, place the Rokoko capture
at `kick-pro.fbx`. Then resample and compress with glTF Transform 4.5.1:

```sh
blender -b -t 4 --python penalty/tools/build-hero.py -- /absolute/source /absolute/hero.glb
npx --yes --package=@gltf-transform/cli gltf-transform resample hero.glb resampled.glb
npx --yes --package=@gltf-transform/cli gltf-transform meshopt resampled.glb athlete.glb --level high
```

The public site has no build or conversion step.

## Stadium, lighting, pitch and spectators

- **Stadium 01 HDRI**, Sergej Majboroda / Poly Haven, CC0.
  https://polyhaven.com/a/stadium_01
  1K Radiance HDR is used for captured sky/stand reflections and environmental
  lighting. It is stored as `stadium-light.bin` to use the site’s supported binary
  asset route; the file contents remain Radiance HDR.
- **Concrete Wall 006**, Poly Haven, CC0.
  https://polyhaven.com/a/concrete_wall_006
  1K color and OpenGL normal maps converted to WebP.
- **Ground 0040 — Football / Soccer Grass Field**, TextureCan, CC0.
  https://www.texturecan.com/details/469/
  https://www.texturecan.com/terms/
  Color, normal, AO and roughness maps converted to WebP. Roughness was remapped
  for dry turf. World-space mowing bands, wear and grass blades are original.
- `crowd-fans.webp`: original **AI-generated synthetic fan portraits**, created
  with the built-in image_gen tool for this project. These are not photographs
  of identifiable real spectators or a claim of scanned crowd geometry.
  The 32 RGBA portraits are packed into padded instanced sprite cells and animate
  with ambient movement and goal reactions.
  Exact prompt: [crowd-fans.prompt.txt](assets/crowd-fans.prompt.txt).
  Packing utility: `tools/pack-crowd.py`.

The visible sky uses Three.js atmospheric scattering; the HDR provides lighting
and reflections without projecting a duplicate photographed stadium.

The stadium bowl, seats, glazed hospitality level, trusses, roof, electronic
scoreboard, advertising boards and goal frame are original procedural geometry.
The net uses volumetric cord instances with pinned edges and damped deformation.
The panelled ball, seams, bump microtexture and trail are original geometry/code.

Free Renderpeople scans and an Innerscene footballer were evaluated locally but
are **not included** in the runtime assets or this repository.

## Recorded sound

All recordings below are CC0. MP3 conversion/fades are local edits. No music is
included. Original synthesized effects remain as a network/audio fallback.

- **Football stadium.wav**, BeeProductive — 28-second ambience excerpt.
  https://freesound.org/people/BeeProductive/sounds/395592/
- **Soccer stadium Oehh2.wav**, Sandermotions — crowd disappointment.
  https://freesound.org/people/Sandermotions/sounds/494361/
- **Referee whistle sound.wav**, Rosa-Orenes256.
  https://freesound.org/people/Rosa-Orenes256/sounds/538422/
- **Soccer Ball Kick**, bittermelonheart — strike, quieter impact/bounce variants.
  https://freesound.org/people/bittermelonheart/sounds/555042/

## Libraries and fonts

- Three.js r180 and loaders/utilities/postprocessing: MIT.
  https://github.com/mrdoob/three.js
  Existing core modules come from `evermile/vendor/`. Additional HDR, SSAO, Bokeh
  and shader-pass modules are copied from the same version into
  `penalty/vendor/three-addons/`; license: `vendor/THREE-LICENSE.md`.
- Meshoptimizer 0.22 decoder: MIT.
  https://github.com/zeux/meshoptimizer
  License: `vendor/MESHOPT-LICENSE.md`.
- Manrope and DM Serif Display: SIL Open Font License, Google Fonts.
  https://fonts.google.com/specimen/Manrope
  https://fonts.google.com/specimen/DM+Serif+Display
