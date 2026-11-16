# Eight Worlds

A browser 3D explorer: a brig at sea plus seven landscapes (lighthouse coast, forest, alps, Arctic fjord,
desert, volcano, temple ruins), with shared weather, time of day and sound.

It is a self-contained static site. It does not touch, import or depend on the Bella Performance app in the
parent folder, and nothing in the app's build includes it.

## Run

```bash
node serve.mjs 8080
```

Then open http://localhost:8080. Any static file server works; the page needs to be served over http(s)
because it uses ES modules.

URL options: `?world=ocean|coast|forest|alpine|fjord|desert|volcano|ruins`, `&weather=clear|fair|overcast|rain|storm|fog|snow|gale`,
`&time=sunrise|day|sunset|blue|night`, `&q=0..3` (quality; chosen automatically otherwise), `&res=` (pixel ratio).

## Controls

Explore: click the view, `WASD` to move, `Shift` to run, `F` to switch walking and flying, `Space`/`C` up and down.
Orbit: drag and scroll, arrow keys change the subject. `T` starts the tour. `1`–`8` change world. `H` hides the interface.

## How it is built

- `src/sky.js` single-scattering atmosphere rendered to a lookup texture each frame, a ray-marched cloud layer,
  sun, moon, stars and aurora; the sky is captured to a cube map for reflections and image-based lighting.
- `src/weather.js` one state object for time and weather; every system reads it, so changes move together.
- `src/core.js` a shared uniform block and patches to three.js shader chunks so every material gets the same
  aerial perspective, cloud shadows, wetness and snow cover.
- `src/ocean.js` Gerstner wave field evaluated on GPU and CPU (buoyancy, camera), foam, wake buffer, shoreline,
  planar reflections.
- `src/terrain.js` baked height field with optional droplet erosion, nested clip rings built on the CPU,
  four scanned material layers with triplanar cliffs and ray-marched terrain shadows.
- `src/scatter.js` streamed instancing, tree impostors baked at load, wind, grass, triplanar rock.
- `src/fx.js` precipitation volumes, sprite particles, lightning. `src/audio.js` the mixer.
- `src/ship.js` the brig. `src/worlds/*.js` one file per world.

See `CREDITS.md` for third-party code and assets.
