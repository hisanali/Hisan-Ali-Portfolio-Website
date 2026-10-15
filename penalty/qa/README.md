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
The character GLB is **1,557,376 bytes**, downloaded once for both characters.
A cold-cache simulation at **6 Mbps / 80 ms latency** downloaded the model in
**2.17 seconds**, and the Draco decoder in **0.44 seconds**. Entire page readiness
was 6.56 seconds on the uncompressed local server;
that includes the existing Three.js dependency chain and scene initialization.
This is network emulation on a desktop, not a physical handset measurement.

To repeat with Playwright available, start the static server and run:

```sh
node penalty/tools/test-game.cjs
```

The test uses a localhost-only inspection interface. It is unavailable on public
hostnames. The test writes fresh PNG captures; the checked-in captures are WebP
encodings at the same pixel dimensions.
