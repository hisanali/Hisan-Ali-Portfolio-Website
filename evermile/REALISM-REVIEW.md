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


## Supplied-asset integration

Added the user-supplied Mercedes W201 as a selectable vehicle and one traffic variant, with independently rigged wheels/calipers and preserved textured cockpit. Added the supplied locomotive to passenger and freight train pools, with twelve wheel rotors; existing wagons, tracks and crossing controls remain. Added three horses and four bighorns to field herds, and replaced the close-up fox with the supplied animated model. The user subsequently requested sheep removal: domestic sheep no longer spawn, cross roads, load a model, or appear in Model Studio. Other species, including the separately supplied bighorn, remain.

The original horse/fox glTF animation channels are retained because Blender resampling changed their root basis. Their legacy specular/glossiness materials are converted to the renderer's metallic/roughness format. Bighorn horns are a separate source object and are attached to the head rig. The original saddled horse remains in source; field horses omit the tack meshes.

Model Studio includes all five new imports. Browser checked model rendering and Mercedes chase/cockpit driving; animal scale, root drift, wheel rolling and native clips have regression checks. This is still a simplified game simulation, and the W201's textured dashboard instruments are static. Horse/fox retain their source non-commercial license; the bighorn archive lacks license/source metadata. See ASSET-CREDITS.md. Publication of this supplied-asset pass was authorized on 26 September 2026; deployment is verified separately against the production files.

Validation after sheep removal: all 82 Evermile tests pass, including native animal clips, horn attachment, wheel pivots and locomotive scale. Reloaded game reports no sheep assets or instances, all new imports loaded, an active imported train, and no browser warnings/errors. W201 acceleration and steering-release checks ran in the rendered game loop; steering/yaw rate settled near zero. This short check is not an exhaustive handling audit.


## One connected map

Destinations are no longer separate maps. Every district is a place on the endless road network: junction signs and the junction card name it ("Ocean Drive · Art deco hotels"), the road settles flat and gentle through it, then winds back into open country and reaches the next junction, so no place is a dead end. About three in four junctions offer a place (never straight after one, never one of the last four visited); motorways reach them by exits. Autodrive takes a signposted place most of the time. Starting a drive in a destination still starts inside it, and the rest of the network is reachable from there.

Two new districts use the supplied dasy444 scenes: Eastgate City (shop rows and street facades at the kerb, panel tower blocks behind, street trees and lamps) and Pinecrest Forest (dense imported pines, spruces, boulders and undergrowth on a quiet road). Mountain passes also get stands of the imported pines and boulders.

Buses now ease out round cyclists between stops like other traffic; previously one bus behind a cyclist held every vehicle behind it at cycling pace.

Validation: 93 automated checks, including 160 km network walks in three road styles (continuous road, grade under 15 %, every junction offering two ways that run on to another junction, every destination signposted, districts aligned, level and clear of tunnels, towns, rail and services). A 21 km autodrive run in the rendered game went through the airport, lake and forest districts with no errors, averaging 50 km/h. City and forest cost about the same to draw as the existing Old Town.
