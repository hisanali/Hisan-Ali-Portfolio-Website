# Browser verification — 15 October 2026

Verified in headless Google Chrome, using the real static ES-module page served
with `python3 -m http.server 8765`. No game bundler or build is required.

- Desktop: **1280 × 760**.
- Mobile portrait: **390 × 844**, device scale factor 2 (screenshots are 780 × 1688 pixels).
- Mobile landscape: **844 × 390**, device scale factor 2.
- Screenshots: aiming, captured mid-kick, keeper dive and goal celebration at
  both requested sizes, plus replay and mobile landscape menu views.
- No browser JavaScript errors in either run.
- Blue kit selection updates the actual shirt material.
- Curved pointer swipe launches a shot through the original power/curl input path.
- Captured kick releases the ball at the 0.76-second animation event.
- A dive towards the shot produces a save through the visible glove collision.
- Left/right, high/low and central jump selection checked.
- Goal increments the practice streak once, including during replay.
- Replay can be skipped and ends in the captured victory celebration.
- A real tap while the CPU prepares its shot produces the player's keeper dive.
- Sound toggle still works.
- Early shootout victory, a tied fifth round, and sudden-death victory checked.
- Landscape menu has no horizontal overflow.

`results.json` records model request sizes, kit tint, save outcome and browser errors.
The character GLB is **1,002,560 bytes**, downloaded once for both characters.
External character textures are shared. Local resource timings are not mobile
network benchmarks; a three-second load is not guaranteed on every connection.

Physics runs at a fixed 120 Hz with gravity, aerodynamic drag, spin-dependent
Magnus force, turf bounce/friction, rolling resistance and round post contacts.
Goals require the whole ball to cross the line. A glove or post touch can still
deflect into the goal. Visible glove/body capsules supply save contacts.
`physics-results.json` records 81 target trajectories and conservation/contact
checks. `physics-browser.json` records left/right low/high and central landing
checks, cancelled swipe handling and cancelled CPU turn handling.

These are practical game approximations, not a professional football simulator.
Keeper root adaptation and capsule collisions do not model every joint or net
thread physically. Tests use desktop Chrome and mobile viewport emulation;
physical handset performance and touch feel still need device testing.

To repeat with Playwright available, start the static server and run:

```sh
node penalty/tools/test-game.cjs
node penalty/tools/test-browser-physics.cjs
node penalty/tools/test-movement.cjs
node penalty/tools/test-physics.mjs
```

The test uses a localhost-only inspection interface. It is unavailable on public
hostnames. The test writes fresh PNG captures; the checked-in captures are WebP
encodings at the same pixel dimensions.

## Movement correction, version 5

The kicker uses the approach, plant, contact and follow-through from one capture.
The separate procedural jog and its world-position reset were removed. The
waiting position is calibrated to that capture before the round starts.
Transitions out of the kick compensate for different captured root origins.
Sole support prevents the kick and celebration from penetrating the pitch.

The keeper blends out of the live ready stance into the push-off, targets the
appropriate high/low glove, and returns to the capture's normal playback speed
after extension. The captured landing and get-up continue after a save. Replays
restore the live poses before resuming; they do not substitute an upright pose
for a prone keeper. A fixed replay angle and a keeper-focused save camera keep
the movement visible.

`movement-results.json` checks approach continuity, boot/ball contact, celebration
continuity and normal recovery playback. These address specific motion bugs;
they do not certify natural movement in every scenario or replace visual review.

`movement-demo.mp4` shows a controlled goal and save with the corrected approach,
replay transitions and recovery. It is a browser capture, not rendered concept art.
