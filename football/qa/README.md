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
| Boot contact | ~0.010 m measured separation during the contact window |
| Late slide | Full captured recovery finishes before locomotion; yellow card and restart; competing automatic steals cannot bypass the tackle event |
| Replays | Three successive angles, 0.4× source pose playback; returns to match |
| Penalty | Swipe input launches the strike; in-match score and possession retained |
| Physics | Shared SI ball integrator passes 81 target solves, drag/spin symmetry, energy-loss and swept-contact regression checks |
| Errors | No JavaScript page errors in the two complete match flows or action tests |
| Local cold ready time | 2.426 s desktop; 2.041 s phone emulation |
| First-party resource bodies | 8,030,306 bytes, including loaded audio; excludes externally served fonts/tracking |
| 11-a-side frame sample | 180 frames per viewport; median and p95 ~16.7 ms on this Mac |
| Geometry load | ~3.46 million triangles desktop vs ~1.12 million on phone, including shadow/postprocessing passes |
| Slow connection | Cold 10 Mbps, 80 ms latency: ready 7.161 s, model resource 6.508 s; fonts/tracking excluded. Loading screen remains until ready |
| Static delivery | GLB, HDR-as-bin and JS paths pass the production route allowlist |

The single player package is 3,180,708 bytes and contains 28 clips, shared close-up, match
and reduced mesh sets. Character action data is prepared once and shared across
mixers; shirt number textures are cached at 1024px desktop / 512px mobile. The ball's 32 panels are
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

## Touch and layout follow-up — version 8

`test-touch.cjs` exercises 844×390, 390×844, 667×375, 568×320,
768×1024 and 1280×640 in Chrome touch emulation. All six passed with no page
errors. Results: `touch-results.json`; screenshots: `touch-*-menu.webp`,
`touch-*-play.webp`, `touch-*-goal.webp`.

- Long holds and simultaneous joystick/action touches retain their pointer.
- Moving outside a held button does not release it prematurely.
- Pointer cancellation clears input without firing a pass or shot.
- Repeated taps retain viewport scale 1 and leave no selected text.
- Gameplay disables selection, callouts and browser gesture handling; setup
  panels retain normal vertical scrolling and pinch accessibility.
- All action controls fit, do not overlap, and the header elements do not overlap.
- Goal/event messages are compact badges; setup and pause headings are smaller.
- Goal presentation hides gameplay HUD clutter and exposes a working Skip replay button.
- Pause, menu, focus loss, visibility changes and rotation clear held controls.

Physical Safari/iOS long-press behaviour has not been tested on a device.

## Rendering follow-up — version 9

- Refined close-up face and cloth topology; three distance/device mesh tiers.
- Higher-resolution character colour/normal maps and cloth sheen.
- CC0 ambientCG Grass004 colour/normal/roughness maps, broad mowing stripes
  and subtle penalty-spot wear. Roughness is raised for dry football turf.
- Neutral colour response, softer contact grounding and desktop ambient occlusion.
- Celebration camera faces the scorer; desktop close-ups use depth of field.
- Goal nets now use shaded cord geometry; advertising repeats at readable scale.
- `*-render-pitch.webp` and `*-render-closeup.webp` show the final art comparison.

Both full match flows and six touch layouts passed again. These improvements do
not establish parity with DLS or eFootball. Mobile disables ambient occlusion
and depth of field; high-detail close-up meshes still work on both platforms.

## Possession and restarts — version 11, 17 October 2026

User story: load the static game → move/turn/stop with possession → pass or
shoot at clip contact → recover possession or cross a boundary → take the
correct restart → keeper catches and distributes → continue to full time.
No gameplay API, database, or credentials are involved.

- Controlled balls follow a bounded, smoothed ground target. Released passes
  and shots retain the SI flight solver. Turns no longer strand the carrier's ball.
- Throw-in and corner takers remain at their restart until distribution; stale
  strike, tackle, spin and restart state is cleared when setting up a new restart.
- Touchline takers stand outside the line. Throw-ins hold overhead and follow
  the captured hand motion; keeper throws leave the hand toward the receiver.
- Keeper possession follows the hands after animation/IK. Goal kicks remain on
  the ground. A keeper cannot immediately recatch his own release.
- Pass/strike preparation stops player drift; throw-in shot input distributes
  by hand instead of starting an illegal ground shot.
- Ball rendering now uses the same radius as collision/ground contact.

`tools/test-possession.cjs` tests turns, stops, thrower input lock, automatic
throw release, hand attachment, goal-kick height, goalkeeper distribution,
actual touchline transitions and dribble goals at both landscape sizes.
Results: `possession.json`; screenshots: `*-close-control.webp`,
`*-throw-in.webp`, `*-throw-motion.webp`, `*-goal-kick.webp`,
`*-keeper-hold.webp`, `*-keeper-throw.webp`. Updated full-match, action and
six-layout touch checks are recorded separately in the corresponding JSON files.
