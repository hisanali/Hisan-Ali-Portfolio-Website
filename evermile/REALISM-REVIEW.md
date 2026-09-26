# Evermile realism preview — 26 September 2026

Worktree: `/Users/hisan/Documents/Codex/evermile-realism`
Branch: `codex/evermile-realism`
Base: `e048857` from `origin/main`.
Local preview: http://127.0.0.1:4173/evermile/

## Implemented

- World menu with eight reference-inspired districts: Escobar Airport, Ocean Drive, Adriatic Old Town, Cypress Estate, Palm Hills, Pacific Pier, Azure Retreat and Silverpine Lake. Each provides an approximately one-kilometre authored section before the existing endless road continues. These are original procedural interpretations, not geographically accurate replicas.
- CC0 scanned stone, bark, roof, asphalt and ground surface maps, with local files and attribution in ASSET-CREDITS.md. World-scale mapping avoids stretching a single texture across a building.
- Airport terminal/control tower, neon hotel fronts, old-town ramparts, arched estates, low-rise palm residences, animated Ferris wheel and coaster structure, glass-front villas/pools, and lakeside timber stairs/jetties. Street lighting and pedestrians are pooled/batched.
- Ultra option: up to 2× display pixel ratio and 4096-pixel shadow maps. High effects retain automatic fallback when frame rate remains low. Static traffic and train parts are merged while animated wheels, lamps and freight containers remain individually controlled.
- Vehicle-specific mass/power/drag/braking and wheelbase-based steering, with a shared traction budget affected by rain, snow and off-road surfaces. Coach stopping distance and motorcycle lean differ from the coupe. This is a simplified driving model, not a full tire/suspension simulator.
- Additional rail fastenings, train bogie/brake details, pump hoses/nozzles, traffic trim, rubber and animal surface detail.
- Authored-district exclusions prevent invisible fuel stops/towns/tunnels/rail routes from conflicting with landmark geometry. Livestock crossings stay outside these districts. Chase camera retracts before passing through nearby traffic.

## Validation

`node --test tests/evermile/*.test.mjs` — 35 passing tests: traction and braking, steering limits, finite long simulation, deterministic road/terrain, district feature exclusions, static-batch bounds preserved animation controls, camera clearance around traffic, six pedestrian gait/skin checks, four animal rig checks and the umbrella hand solver.

At 100 km/h, isolated model tests stop the coupe in about 37.7 m dry and 55.5 m wet, and the coach in about 55.6 m dry. These are model results, not real-vehicle measurements or in-game obstacle avoidance guarantees.

All top-level Evermile modules pass `node --check`; relative module imports resolve; `git diff --check` passes. The browser preview was inspected across the eight destinations, clear/rain and day/sunset, all three player vehicles, and Ultra selection. Fresh preview console had no errors or warnings during the final sampled check. Coupe, coach and motorcycle autodrive were observed staying on-road. Frame rate varied with simultaneous running game tabs; 30 FPS was observed in sampled checks, but a controlled hardware benchmark remains necessary.

## Remaining scope

This preview does not reach the photorealistic reference images. Nearby cars and pedestrians now use imported/authored GLB meshes, and all four original animal types have articulated replacement GLBs. These are still game models; their surfaces, hair/fur and clothing do not match photorealistic scans. Buildings and much of the landscape remain procedural. Matching the supplied photographic references still needs higher-quality art, richer terrain/foliage, improved water/reflections and further performance/physics tuning. A usable browser preview and passing checks do not establish that every gameplay situation is bug-free. The train, railway and fuel details have code changes but have not received a complete end-to-end playtest in every route/weather combination. Mobile performance has not been certified; desktop/laptop was the requested priority.

Production release is authorized. Deployment status and live verification are recorded in the release task.

## Pedestrian repair and model pass

- Removed the mismatched Michelle/Soldier rig integration. Six CC0 MakeHuman-derived adult bodies now use skeletons generated from their own anatomy, with original planted-foot Walk and Idle clips. Older/younger appearances, different faces/builds, varied skin/hair, short/long sleeves, skirt/trousers and backpacks replace the single repeated character. Runtime assigns 26 distinct combinations of body, outfit colors, scale and animation phase.
- Runtime gait speed follows measured motion; idle transitions and heading changes are damped. A two-segment arm solver holds the existing umbrella during rain. Close-range/distant fallback switching updates the fallback pose immediately.
- Rebuilt cows, sheep, dogs and cats as articulated GLBs, preserving 10 cows, 12 sheep, 3 dogs and 3 cats, original wandering/grazing and collision roots. Distance detail reduces rendering cost. Corrected dogs facing the wrong direction after multiple turns or while crossing. An attributed animated fox is additional wildlife.
- Added optimized attributed CarConcept traffic meshes and real leaflet geometry for district palms. Authoring scripts, exact source assets, hashes and credits are retained.
- Model Studio provides crowd and individual/animal inspection. Browser checks confirmed all six pedestrian types and all 28 original animals loaded without model errors; a roughly 2.5 km lake-route autodrive sample stayed on-road. Clear/day and rain/day crowd scenes were inspected, including umbrella holding. Fresh console samples had no warnings or errors. Sampled steady state was 30 FPS; startup loading was slower. This is not a hardware benchmark or an exhaustive bug-free guarantee.

The same build is available locally at port 4173. Production deployment must be verified against the committed assets, rather than inferred from local checks.
