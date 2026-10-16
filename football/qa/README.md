# Football 3D verification — 16 October 2026

Story: choose a kit, team size and difficulty → load static game assets → play
with touch or keyboard → receive/pass/shoot/defend → restarts and penalties →
goal/replay → half-time/full-time → rematch/menu. No API, database, secrets or
runtime build step are required by this game.

## Local browser evidence

Chrome, macOS, fresh browser contexts. Phone tests emulate 844×390 landscape
with touch; desktop tests use 1280×640. These are not physical phone benchmarks.

| Check | Result / evidence |
| --- | --- |
| Both viewport layouts | Kickoff fits within the viewport; screenshots below |
| Team sizes | 10, 14, 22 actual independently animated players |
| Match flow | Both viewport tests reached full time at 240 match seconds, using `fb.sim()` for acceleration |
| Pass timing | Ownership retained before contact, released afterward; `actions.json` |
| Boot contact | ~0.0019 m measured separation during the contact window |
| Late slide | Full captured recovery finishes before locomotion; yellow card and restart; competing automatic steals cannot bypass the tackle event |
| Replays | Three successive angles, 0.4× source pose playback; returns to match |
| Penalty | Swipe input launches the strike; in-match score and possession retained |
| Physics | Shared SI ball integrator passes 81 target solves, drag/spin symmetry, energy-loss and swept-contact regression checks |
| Errors | No JavaScript page errors in the two complete match flows or action tests |
| Local cold ready time | 3.795 s desktop; 1.847 s phone emulation |
| First-party resource bodies | 6,835,239 bytes, including loaded audio; excludes externally served fonts/tracking |
| 11-a-side frame sample | 180 frames per viewport; median and p95 ~16.7 ms on this Mac |
| Geometry load | ~2.23 million triangles desktop vs ~1.12 million on phone, including shadow/postprocessing passes |
| Slow connection | Cold 10 Mbps, 80 ms latency: ready 5.976 s, model resource 3.930 s; fonts/tracking excluded. Loading screen remains until ready |
| Static delivery | GLB, HDR-as-bin and JS paths pass the production route allowlist |

The single player package is 2,350,048 bytes and contains 28 clips, shared full
and reduced mesh sets. Character action data is prepared once and shared across
mixers; shirt number textures are cached at 512px. The ball's 32 panels are
merged into two surface draws. The page remains plain static ES modules.

## Screenshots and video

For each size prefix (`1280`, `844`):

- `*-menu.webp`: complete landscape setup.
- `*-dribble.webp`, `*-pass.webp`, `*-strike.webp`: movement and ball actions.
- `*-11aside.webp`: larger team layout.
- `*-celebration.webp`: close-up celebration.
- `*-replay-1.webp` through `*-replay-3.webp`: successive replay camera angles.
- `*-penalty.webp`: in-match penalty view.
- `1280-keeper-dive.webp`: captured keeper extension pose in the controlled action scenario.
- `movement.mp4`: short real-time movement/turn/pass recording at 844×390.

The controlled action screenshot deliberately selects a dive pose; it does not
by itself prove the keeper saved a live shot. Full match recordings and
simulation tests exercise normal keeper AI separately.

## Reproduce

Serve the repository root on port 8765. Set `PLAYWRIGHT_MODULE` to an installed
Playwright module path if it is not on the normal Node module search path. Use
an installed Chrome channel.

```sh
node football/tools/test-match.cjs
node football/tools/test-actions.cjs
node football/tools/test-load.cjs
node penalty/tools/test-physics.mjs
node football/tools/record-movement.cjs
python3 football/tools/pack-qa.py
```

The local `?debug` object exposes simulation and action helpers only on
`localhost` / `127.0.0.1`. Browser screenshots are initially PNG and then packed
as WebP. The recording helper captures the complete viewport at approximately 20 frames
per second and writes a real-time, 30 fps encoded MP4 through FFmpeg. This avoids
a Chrome screencast issue that clips the bottom controls in mobile landscape.

## Limits

- 60 fps is measured in Chrome on this Mac, including phone emulation. A physical
  mid-range Android/iPhone remains untested.
- The game uses one Mixamo athlete with four mesh/material variations, not four
  scanned athletes, facial capture, or licensed professional-player likenesses.
- The keeper punch adapts a captured body block with hand reach. The officials
  and camera crews are economical background figures. Crowd sound is recorded
  ambience/reactions rather than spoken match commentary.
- Penalties reuse the Penalty game's ball solver, strike/keeper assets, swipe
  and tap interaction pattern inside the match. The page does not navigate away
  and lose the current match.
- This is a DLS-inspired browser game; equivalent DLS production quality is not
  established by these tests.
