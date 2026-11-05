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


## Controller, photos and the journey log

- Standard-mapping game controllers now do everything the keyboard does: left stick steers with an eased dead zone, triggers drive, A autodrive, B handbrake, X horn, Y camera, bumpers indicate, Start pauses or continues, Back resets, D-pad toggles headlights and radio and adjusts cruise speed, right-stick click opens photo mode. A or Start also begins the drive from the title screen, and a toast names the controller when it connects. The mapping lives in `gamepad.js` and is listed in the help panel.
- Photo mode (U, or the camera button in the top bar) now has Save photo and Back buttons so it works on touch devices, and Enter saves the picture: the rendered frame plus the cockpit windscreen, downloaded as a PNG named after the place and distance.
- A journey log (`journey.js`, stored beside the settings) counts drives, lifetime distance, the longest drive and the destinations found. The title screen shows these figures, plus this drive's distance, time and new places while paused. Milestone toasts mark 5, 10, 25, 50, 100, 200, 500 and 1000 km in one drive, a new longest drive, and the first visit to each place. The old running distance becomes the lifetime total.
- Validation: 105 automated checks (eight new ones cover the controller mapping and the journey log). A rendered headless session began the drive from a simulated controller, drove on the right trigger, changed camera, held and released the horn, indicated, paused and resumed, saved a photo with the interface hidden, and showed the seeded log on the title screen with no runtime errors.


## Weight, impacts, water and walls

- Collisions now carry mass (`impact.js`). The car samples its four corners and sides, so it can no longer slip into a building or a parked car at an angle. Each thing it meets has a mass: a wall takes the whole overlap, a traffic car half, a pedestrian or animal almost none. A standing car is not pushed at all by someone walking into it; instead the person or animal is shoved aside, staggers to a stop facing the car, and animals bolt for a few seconds. Hitting a wall head-on takes the speed out with a small rebound instead of freezing the car; a glancing hit scrubs speed and turns the nose away.
- Hits feel like hits: the body jolts on a damped spring (nose dip or roll away from the side), the camera shakes in proportion, and there is a crash sound (thump, clatter and, above about 40 km/h, glass) or a dull thud for something soft. Collisions are counted on `state.crashes`.
- Weight transfer: the nose dips under braking and lifts under power on every vehicle (not just the detailed rigs, which dip more than before), the chase camera carries on for a moment under braking and hangs back under power, and the cockpit and bonnet views pitch with the body.
- Water: below the surface the car is dragged to a crawl, sinks slowly with buoyancy instead of free fall, the engine drowns past the sills, and a car more than two metres under for three seconds is towed back to the road. Entering water splashes (sound, toast, shake). With the camera under the surface the fog turns green-blue and close, the light dims, and the vehicle and effects audio is muffled.
- Junction side roads: the branch not taken used to fade out 570 m past the fork. It is now drawn, with its flattened terrain, for 1670 m and tapers out of sight, so every side road runs on somewhere.
- Walls: plaster, brick and concrete surfaces are generated once on a canvas (diffuse, normal and roughness maps) and projected in world metres, replacing the flat-coloured boxes on town shops, cottages, hotels, estates and old-town buildings. Imported kit buildings keep their own materials.
- Validation: 109 automated checks including the new impact tests (mass shares, body sample points, head-on and glancing responses, pedestrian hits, severity and jolt). Rendered checks of the extended side road, braking dive, driving into the lake, off-road impacts and the textured towns are recorded in the commit message. This is still a simplified driving simulation, not a rigid-body engine: no tyre deformation, no vehicle damage model, traffic does not swerve or dent, and the rendered checks ran on a software renderer.


## Reacting traffic, dents, cabin look-around and the cinematic camera

- Traffic reacts to being hit: a shove from behind pushes the car on, then it brakes hard, swerves away from the contact towards the verge, flashes its hazards for nine seconds and sits for a moment before driving on.
- Dents: collisions above a light bump dish the nearest body panel in the paint shader (up to ten dents, merging when hit again in the same place), with scuffed, duller paint around them. They stay until the car is washed ("Wash and repair" in the garage) or the vehicle is changed.
- Cockpit: dragging now turns your head round the cabin, out of the side windows and over your shoulder, instead of jumping to the chase view (bonnet and bumper still jump out). The view eases back to the road when you let go.
- Cinematic camera (sixth view, C or the camera button): cuts between a roadside tripod the car sweeps past with a long lens, a low tracking shot from ahead, a side tracker, a slow rising helicopter orbit and a low rear quarter. Pair it with photo mode (U) for clean footage.


## Suspension, tyres, rubber and dust, ambient occlusion, and an audit

- Suspension (`suspension.js`): the body rides on damped springs in pitch, roll and heave, tuned per vehicle (soft and long-travel on the Land Cruiser and coach, firm on the coupé and GR Corolla). The rest attitude comes from the terrain under each corner plus weight transfer; a kerb or bump the body only follows after a lag and then settles; each wheel follows its own corner of the ground within its travel.
- Tyres (`sideslip` in `handling.js`): past the lateral grip budget, or on the handbrake above walking pace, the rear steps out and the nose yaws beyond the path; grip pulls it back when the demand eases. Bikes and the coach slide far less. Sliding scrubs speed.
- Skid marks (`marks.js`) are laid behind sliding or locked tyres and fade over minutes; tyre smoke rises from rubber sliding on tarmac and dust from the wheels off the road (`dust.js`), lit and fogged with the scene.
- Ambient occlusion (`ssao.js`): a depth-only screen-space pass (half-resolution depth pre-pass, hemisphere sampling with normals from depth, depth-aware blur) darkens where surfaces meet. High and Ultra quality, switchable in Settings.
- Audit fixes: the longer side roads added earlier ran across railway lines, through towns and lay-bys and back over the main road (a scan of five seeds found 504 conflicts); each untaken branch now ends before the first such conflict and tapers out, and the scan finds none. A parked car no longer rolls on a slope: the brakes hold until a pedal is pressed. A controller only drives the car after a deliberate button press, stick push or trigger squeeze, and triggers have a dead zone, so an idle wheel or a drifting stick cannot move the car on its own.
- Validation: 114 automated checks. Rendered checks: AO on/off, a handbrake turn laying marks and smoke with the tail stepping out and recovering, dust off the verge, an idle controller and the steepest grade on the default route leaving a parked car still, throttle releasing the hold.


## Under the water, and side roads that go somewhere

- The underwater view was black: the fog colour below the surface was being blended with a vector scratch object instead of a colour, which produced NaN and painted every pixel black. Fixed, and the light below the surface is now kept bright enough to see by (clarity falls slowly with depth, the fog is a teal haze with a gentle shimmer, the sky light turns blue-green).
- Underwater world (`underwater.js`): the surface seen from below, six shoals of fish wiggling through their own loops, kelp swaying on the bed, a broken ship (split hull, snapped mast, funnel, ribs and planks) in the deepest water nearby, two capsized boats, bubbles rising from the wrecks and from the car when it is under. Laid out afresh in deep water around you every few hundred metres; only present where there is deep water.
- Junction side roads: the branch not taken now runs on for up to 1.1 km past the junction zone and only stops for hard geometry (rejoining the main road, a river valley, a tunnel, a destination, a town street or a lay-by). Where it stops, the ground rises into a low hill just beyond, so the road is seen to climb over a crest rather than end in the open. Railways are crossed at grade. The five-seed audit finds no conflicts.


## Real fish and wreck models

- Two real fish species replace the authored fish as soon as they load: the Khronos **Barramundi** (CC0, Microsoft) and the Babylon.js **Grey Snapper** (CC BY 4.0). Each is an instanced mesh with the same shader tail wiggle; shoals alternate species. Textures were downscaled (1K and 512) and re-encoded to keep the two under 1.1 MB together.
- Real wreck dressing from the Babylon.js Under Water Scene (CC BY 4.0): scattered **ship boards** and a **ship's wheel** lying on the bed round the hull, each extracted into its own GLB with its baseColor, normal and ORM textures embedded. The hull itself is still authored: no complete ship-wreck model with a usable licence was reachable from this environment (Sketchfab, Kenney, Poly Haven and Quaternius are blocked here); a hull GLB supplied with its licence can be dropped in the same way.
- The water surface is one-sided again; from below you see the dim rippling underside, not the sky mirror.
- Credits, sources, licences and modifications are in `ASSET-CREDITS.md`. Rendered check: both species load and fill their shoals, the wreck site gets seven pieces, no console warnings.


## On foot (Stage 1 of the character)

- Press X (or the Get out button, or A on a controller) with the car stopped to step out beside the driver's door. You are one of the rigged civilians (`walker.js`): W/S walk, A/D turn, Shift run, with the idle and walk clips blended by speed and the walk sped up for a run. You stand on whatever the ground is, step down small drops and fall off big ones, and are kept out of buildings, cars, people, animals and deep water.
- The car stays exactly where you left it; walk back to it and press X to get in. Walk up to any parked car (not the delivery truck) and X takes it: your own car stays parked there as a second car you can come back to and swap again. Parked cars become the nearest matching drivable model (saloon or estate → Mercedes W201, hatchback → GR Corolla, SUV, pickup or van → Land Cruiser, bus → coach).
- The camera is a shoulder chase behind the walker with the same drag-to-look-around; the world streams around you on foot; traffic treats the parked car as the obstacle and will push you out of its way, but does not yet brake for a pedestrian you.
- Not yet: entering moving traffic, doors that open, a run animation of its own (the walk is sped up), shops, talking, or saving the on-foot state across a reload (you reload inside the car).


## Stage 2: shops, the café, the petrol station shop, the bus

- Coins: you start with twenty, earn one a kilometre driven and ten for each new place found. Shown under the journey figures.
- Every town shop has a door you can walk to (its name and door are recorded on the lot as the street is built). X at the door takes you inside (`interiors.js`): a room built once per shop with a tiled floor, plaster walls, windows and the door, a counter with a shopkeeper (one of the civilians, idling), shelves of goods coloured for the trade, tables and chairs in cafés, a drinks fridge in markets and the petrol shop, a chair and mirror at the barber, a lit sign. The roadside café and the petrol station shop open the same way.
- At the counter, X opens the shop card: what the shop stocks, prices, what you have, and your bag. Coffee or tea passes twenty minutes; the newspaper gives a headline; a haircut is a haircut. Kept things go in the bag: a fuel can is used when you get into a car that is low on fuel, a wash token is offered on the petrol station card and washes the car and beats out the dents, plasters, a spare bulb, a road map, flowers and a paperback are yours to carry.
- Bus: stand at a town bus stop; when a bus is at the stop, X boards it. You ride with it (camera on the roof) and X at its next stop gets you off beside the door. If the bus goes out of range you are set down where you are.
- Rain and wind stay outside; the world keeps streaming around the door you came in by; the on-foot save remembers the door so a reload inside puts you outside it.
- Known limits: the café and petrol station doors are approximate positions in front of their buildings, not modelled doors; the shop card is a card, not a modelled till; the keeper does not speak yet (Stage 3).


## Stages 3 and 4: your outfit, and talking

- You: choose any of the twelve civilian outfits in the Vehicle panel ("You"); it is remembered, and the shopkeeper never wears the same one.
- Talking (`dialogue.js`): X beside a passer-by opens a conversation card. They stop and turn to face you while you talk. Lines fit the time of day, the weather, the town, and your state (low on fuel, a dented car); each has two or three replies with their answer. On the pier people are fishermen who know about the wreck. Shopkeepers can be talked to from the shop card; the petrol station keeper repairs dents (8 coins) and washes the car (4), the barber cuts hair (8). Names are stable per person per town.
- Not yet: spoken voice, and people reacting to the horn with a wave.


## Stage 5: the phone, jobs, home, and today's road

- Phone (Tab, or the PHONE button): four tabs. **Map** draws the road ahead for three kilometres as a ribbon with the next junctions and their signposted places, towns, petrol stations and cafés, and home; a note says what the next junction offers. **Journey** is the log: distance, drives, longest, places, this drive, coins, bag, photos, jobs, crashes and knockdowns. **Jobs** shows the job on (what, where to, what it pays, how far) and lets you give it up. **Home** says how far home is and how many times you have come home.
- Jobs: a shop that sells goods offers a parcel for the next town on its card (15 coins); someone waiting at a bus stop can be offered a lift to the next town when you talk to them (12 coins, they ride with you). A job pays when the car stops in that town. One job at a time; it survives a reload.
- Home is where this world's first drive began. Park within sight of it and get out to come home (5 coins and a count).
- Today's road: a button in the World panel sets the seed to the date, the same for everyone that day; your best crash-free distance on it is kept locally and shown on the phone and the title screen. An online leaderboard would need a table on the server and is deliberately not included.


## A living world: seats and the driver, people with lives, overtaking traffic, weather that stays, sound, touch, the shared board

- You are visible at the wheel from outside the car, in your outfit, seated low in the driver's seat (hidden in the cockpit view and on the bike). Café chairs and the benches in towns can be sat on (X); time passes four times faster while you sit. Car doors still do not swing: none of the car models have separate door parts except the Land Cruiser's rear doors, so a convincing door animation needs models with hinged doors.
- People with lives: town walkers go into shops (out of sight at the door, back out later), sit on benches, stop to chat in pairs facing each other, step aside when you walk towards them, turn to look when someone is knocked down nearby, and some wave an arm when you sound the horn close by. Walkers rush in the rain as before, with umbrellas.
- Traffic overtakes you when you dawdle in its lane: the car behind eases out and passes when nothing is coming, using the same passing rules it uses for cyclists and buses. More traffic takes the side roads at junctions (55 % of the cars near a junction come from or go to the other branch).
- Weather that stays: puddles need a few minutes of rain to form and about four minutes to dry after it stops; snow settles and thaws slowly instead of following the moment's fall.
- Sound: footsteps that follow your stride, lighter when walking and heavier when running, dull on grass, crunchy on gravel, tight indoors; a door chime going into a shop; a murmur of voices and crockery inside cafés and shops; a low traffic hum in towns.
- Touch: on foot, a joystick appears bottom-left (drag to walk and turn) with a RUN toggle beside it.
- Today's board, shared: `supabase/migrations/20261105_evermile_daily.sql` creates `evermile_daily` (read for everyone, insert only, 24-character names, distance bounds) and `leaderboard.js` reads and posts through the site's existing public Realtime configuration. The phone's Home tab shows the top drives of the day, a name box and "Post my best". Until the migration is applied, the tab says the board is not available and keeps your best on the device.


## Fixes and the look

- You: the walker now plays a real run clip when the outfit has one (every Quaternius civilian does, and so does the Mixamo soldier), blended from the walk by speed, instead of a sped-up walk. The textured Mixamo soldier is a selectable outfit (never a pedestrian).
- Look (Settings, "Rich" by default on High and Ultra): sun shafts from the sky round the sun, blurred towards it and added warm, strongest at low sun and gone at night, under cloud, underwater and in tunnels; a lens flare with ghost rings along the line through the frame centre; a final filmic grade with a soft vignette, fine moving grain, a little extra saturation and contrast, and colour fringing at the edges in the cinematic camera. "Plain" switches all of it off. Texture filtering is now 16× anisotropic.
- Still waiting on you: the board's table on Supabase (`supabase/migrations/20261105_evermile_daily.sql`), and hinged-door car models if you want doors to swing.


## QA pass

A review of everything added since the controller work, plus a soak run switching vehicles, cameras, outfits, worlds, seasons, quality and look in every mode (driving, on foot, inside a shop, off-world), found and fixed eight interaction bugs: the door transition pressed the brake (reverse at a standstill, and it cancelled autodrive); a world rebuild left you logically inside a vanished shop or on a bus; X during a bus ride could get you into another car; traffic reacted to a phantom pedestrian while you were indoors or on the bus, and the bus you rode knocked you down; shoppers hidden inside a shop still collided and could be talked to; changing vehicle disposed the seated driver model; getting out under water stranded the walker; joining a multiplayer room on foot left the car parked. The soak run finished with no errors; 119 tests pass.


## Walking that follows the camera, any stopped car, a seated driver

- Walking is camera-relative: drag turns the camera and it stays where you put it; W walks where the camera looks, A and D step sideways, S walks back, and the body turns smoothly into the direction of travel (quickly, about a tenth of a second to settle) instead of spinning on the spot with A/D. A moment after you stop dragging, the camera eases in behind you again as you walk. The joystick and a controller stick work the same way.
- Getting in: X at the door of your own car, the car you left, any parked car, or any traffic car that has stopped (at lights, a bus at its stop). The prompt shows what you would get into; within nine metres of your own car it says to walk to the door. Trucks and moving cars cannot be entered.
- At the wheel you now sit: thighs forward, shins down, arms to the wheel, hips at seat height, posed on the rig after the idle clip. The coupé's cockpit view now has its dashboard and wheel (the model has no interior of its own).
