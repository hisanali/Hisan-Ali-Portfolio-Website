# Verification — 16 October 2026, version 6

The game remains static ES modules, with no game build step. Tests use headless
Google Chrome against `python3 -m http.server 8765`.

## Gameplay and visual checks

- Desktop: **1280 × 760**.
- Mobile portrait: **390 × 844**, device scale factor 2; renderer caps at 1.5.
- Landscape: **844 × 390**, no horizontal menu overflow.
- Captures cover aiming, mid-kick, keeper dive, replay and goal celebration at
  both requested sizes, plus the mobile menu and landscape menu.
- Actual curved pointer swipe, power/curl launch, selected kit tint, goals,
  saves, score updates, tap-to-dive, replay skip and sound mute checked.
- Replay includes a strike angle followed by a goalmouth angle.
- Left/right high/low dives and central jump selection checked.
- Early shootout victory, a tied fifth round and sudden death checked.
- Cancelled swipes and leaving during a CPU turn do not leave an armed action.
- No browser JavaScript errors in the full gameplay runs.

`results.json` records the gameplay checks. `movement-demo.mp4` is recorded
browser gameplay showing a controlled goal and save. Playwright video capture
has no audio; sound is tested separately in the running game. WebP captures are
encoded from the test PNGs at the same pixel dimensions.

## Movement, equipment and physics

- `movement-results.json`: no world-position jump at approach start; boot/ball
  contact at the **1.10-second** event; anchored celebration transitions;
  soles remain above the pitch; recovery returns to normal capture speed.
- `equipment-results.json`: the generated skinned glove shell stays within
  12 mm of the underlying hand geometry, including fingers.
- `physics-browser.json`: ground clearance and landing checks for all five
  keeper directions; cancelled input and CPU-turn checks.
- `physics-results.json`: 81 target trajectories, drag, opposite Magnus bend,
  bounce energy, rolling resistance, plus continuous capsule contact cases
  covering a fast crossing, miss, endpoint and departing overlap.

Simulation uses metres/seconds at a fixed 120 Hz. Ball mass/radius, gravity,
aerodynamic drag, spin-dependent Magnus force, turf friction, restitution and
rolling resistance are practical game approximations. Save contacts use visible
anatomical capsules; posts use swept sphere/capsule contacts. A parry/post touch
can still enter the goal. The full ball must cross the line. Net roof contact
matches the visible sloping net rather than an invisible lower plane.

Foot-placement and strike IK adapt the retargeted capture. Keeper lift uses a
ballistic offset, lateral adaptation follows captured hip displacement, and
short-range arm IK tracks a reachable ball. These are not full-body dynamics
or a simulation of every grass blade/net thread. The player remains a refined
Mixamo base, not a newly scanned professional footballer.

## Loading and rendering benchmark

`performance-results.json` records a cold local-server run at **10 Mbps / 80 ms**,
with analytics/fonts excluded. The shared **1,579,504-byte** athlete package
loaded in **2.74 seconds**. Full scene readiness was **8.93 seconds** on the
uncompressed local server. Median frame time was **16.7 ms**, 95th percentile
**18.5 ms**, over 211 samples. The model was requested once for both players.

This is desktop Chrome with a mobile viewport and network emulation. It has no
mobile CPU throttle and does not establish physical-handset performance or a
three-second full-page load. Static hosting compression and connection quality
will change download times. Physical portrait/landscape touch testing remains
separate from the browser checks.

## Repeat

With Playwright installed and Chrome available:

```sh
node penalty/tools/test-game.cjs
node penalty/tools/test-movement.cjs
node penalty/tools/test-equipment.cjs
node penalty/tools/test-browser-physics.cjs
node penalty/tools/test-performance.cjs
node penalty/tools/test-physics.mjs
```

Set `PLAYWRIGHT_MODULE` to an absolute installed package path if it is not in the
usual Node resolution path. A localhost-only inspection interface supports the
checks; it is unavailable on public hostnames.

Asset sources, licences, exact generation prompts and the offline Blender /
Meshopt pipeline are documented in [ASSET-CREDITS.md](../ASSET-CREDITS.md).
