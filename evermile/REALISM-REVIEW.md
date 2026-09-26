# Evermile imported asset review — 26 September 2026

Development preview: `/Users/hisan/Documents/Codex/evermile-realism`, served at http://127.0.0.1:4173/evermile/. Production target: https://hisanali.com/evermile/. The validation below records local checks; production deployment must separately match the release commit and runtime assets.

## What changed

- Twelve imported civilian looks: eleven Quaternius outfits plus Michelle with corrected retargeted walking. The existing six anatomical pedestrians remain in the mix. People blend idle/walk from actual movement and ease into turns rather than rotating instantly.
- Six imported everyday traffic shapes: saloon, hatchback, SUV, estate, pickup and van. Wheels rotate about centred axles, front wheels steer independently, and lamp glows follow actual model anchors. The previous repeated concept supercar is no longer the ordinary traffic model.
- A playable imported GYO motorcycle with separate rotating wheels, steering fork/handlebars, corrected rubber materials, and rider hands following the grips. Inward lean and reverse wheel rotation are covered by tests.
- Imported cow, dog, textured cat and replacement sheep; the modified imported fox has visible eyes, nose and mouth. Sheep/cow/dog retain native skinning and locomotion; cow/dog have native feeding clips. The cat retains its idle animation and stays in its existing stationary role. Walking playback is matched to movement speed. Animal types were retained.
- Three architectural assemblies from Poly Haven modules: apartments, brick works, and a coastal fort. They appear in destination streets/estates and the Old Town fort location, with colliders and shared geometry. Apartment/brick geometry is reduced for street viewing.
- Model Studio previews the same runtime models, with play/pause, steering, reverse, and source credits.

## Validation

- 78 automated checks cover road/simulation behavior, wheel axle/rolling direction, motorcycle banking, imported models, every civilian's native walk/idle, finite animated skins, animal scale, and architecture geometry.
- All first-party JavaScript modules and Model Studio's module script pass syntax checks; `git diff --check` passes.
- Browser inspected the imported crowd, sheep, cow, cat, fox, saloon, motorcycle steering in both directions, apartments and fort. The driving scene loaded every animal/civilian/architecture family and imported traffic without current browser errors.
- Desktop coastal-town driving ran around 20–30 FPS in this machine's in-app browser while both game and Model Studio were open. This is not a 60 FPS certification. There is an initial asset-loading cost; fallback models render until imports are ready.

## Limits

These free assets vary in realism: the cat, motorcycle, vehicle textures and architectural materials are more detailed, while several characters and animals remain stylized. This update does not make the whole game photorealistic or reconstruct the reference locations geographically. Train, bicycle, much of the landscape, and the motorcycle rider still use existing authored geometry. Physics is still the game's simplified driving simulation. Passing checks does not establish that every route, collision, weather, camera or mobile combination is bug-free.

No paid asset was purchased. Attribution, licenses, modification notes and source URLs are recorded in `ASSET-CREDITS.md`; source files and build scripts are retained under `scripts/evermile/`. Runtime GLBs embed their textures and do not rely on third-party hosting while playing.


## Transit, roadside and handling follow-up

- Imported one authored 12 m bus in coach and city-bus variants, including independent wheels, interior seats and lamp anchors. Updated the coach camera, collision samples and wheelbase to fit the longer body.
- Imported modular petrol-station shop, pumps, canopy, ice cabinet and bins. Expanded station ground preparation and kept the existing refuelling interaction. Added imported signal housings with independent red/amber/green lenses.
- Replaced the sheep again with pracalic's textured, rigged model; retimed a real source animation cycle instead of using its static pose action. The shape remains stylized.
- Removed the second yaw smoothing stage that allowed body rotation after wheels straightened. Keyboard steering now has a vehicle-specific speed envelope; the coach uses a 6.1 m wheelbase. Position integrates the axle midpoint around a rolling rear axle, and braking/cornering share the available traction budget. Switching vehicles clears old steering state.
- Added regression checks for no rotation at rest, steering release, reverse direction, speed-dependent controls, rear-axle lateral slip, 30/60/120 Hz consistency, and combined braking/cornering traction. Existing stopping-distance checks remain 37.7 m dry / 55.5 m wet from 100 km/h (simplified model).
- Browser checked the coach chase/cockpit, station placement, bus traffic, sheep animation, and signal green/amber phases. Car and motorcycle accelerated and steered using the actual rendered game loop; yaw rate returned nearly to zero on release and both stayed on paved ground in those short checks. Current browser error/warning log was empty.
- These are short local checks, not exhaustive route testing or a full rigid-body tire/suspension simulation. Production verification is separate from these local checks.

### Assets supplied by the user

Preferred: GLB with embedded 2K textures, with source URL and license. People/animals should have a skin rig and in-place walk/idle clips. Vehicles should have separate wheel meshes; separate handlebars/forks are useful on bikes. If only glTF is available, retain the `.gltf`, `.bin` and texture directory together in a ZIP. FBX can be converted but should include its texture files.
