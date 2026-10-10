# Two-player driving

Open **Multiplayer** (or **Drive with a friend** on the title screen). Choose a name, vehicle and paint, then create a room. Send the invite link or eight-character code to a friend. They choose their own vehicle and join. **Start driving** closes the lobby; **Meet up** places you safely behind your friend.

The host's terrain seed, destination, road layout, branch choices, season and time are shared. Both players can independently change their car and paint. Leaving restores the player's solo world settings. Joining later reconstructs the host's road and places the joining player nearby.

This is relaxed co-op for two players. Player cars have no mutual collisions. Road traffic and cyclists are disabled during the room session; weather is clear and the shared time is fixed. Ambient pedestrians, wildlife and trains are still simulated locally, not synchronized. Rooms are temporary and end when the host leaves. Invite codes identify public Realtime channels; this is not an authenticated or authoritative competitive server.

## Implementation

Uses the site's existing `/api/multiplayer/config` and Supabase Realtime Broadcast/Presence. No new tables, accounts, schema changes, stored locations, service keys or paid assets. The host admits one guest, rejects a third, broadcasts world state once a second, and each player sends poses at up to 10 Hz. Rendering interpolates poses and briefly extrapolates movement. Background heartbeats preserve paused cars. Presence recovery admits the same player again without moving them back to the start. Disconnect status and room failures are shown in the UI.

## Development and verification

- `npm run build:evermile` rebuilds the browser Realtime bundle (also included in the production build).
- `python3 scripts/serve-evermile.py` serves the game at `http://127.0.0.1:4173/evermile/` and forwards the existing public configuration. A plain static server cannot serve this API route.
- `node --test tests/evermile/*.test.mjs` checks driving/world behavior plus malformed poses, ordering and identical shared junction routes.
- `node scripts/test-evermile-realtime.mjs` uses three real cloud connections in an ephemeral test room. It verifies admission, two-way poses, independent vehicle choices, full-room rejection, leave/rejoin, presence recovery and host shutdown, then removes all connections.

To test visually, open the preview in two tabs, create a room in one, and join from the other. Use different cars/paint, drive with WASD or arrows, and use Meet up. For different devices, both must access the deployed version or a reachable development server; localhost invite links only work on the same computer.
