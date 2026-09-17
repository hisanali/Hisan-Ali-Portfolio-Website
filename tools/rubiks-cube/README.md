# Cube Studio

Route: `/tools/rubiks-cube/`. Linked in Tools → Create.

A standalone studio page inside the existing portfolio catch-all route. The page-renderer bypasses the shared interior shell only for this route, preserving its dedicated layout and portfolio navigation.

## Build and verify

- `npm run build:cube`: bundle Three.js UI and cube.js worker locally.
- `npm run test:cube`: verify the renderer's 18 face-turn mappings and inverses against cube.js, random solves, and invalid-state rejection.
- `npm run build`: existing portfolio build, including cube bundles and SEO checks.

The checked-in bundles run without third-party CDN JavaScript. Solver calculations and photo processing run on the device. Google Fonts supplies the typefaces. State and verified solution progress are stored locally in `hisan-cube-studio-v1`.

## Scope and limits

- Standard 3×3 colour scheme: white top, green front, red right.
- Six editable faces, fixed centres, direct 3D sticker painting, orbit and zoom.
- Validation for counts, piece combinations, corner twists, edge flips and parity. Invalid input is checked against all 4,096 face rotations in the worker; a unique legal arrangement is corrected automatically. Ambiguous arrangements require a rescan, and sticker colours are never changed to force a solution.
- Worker-based two-phase solver; sequence verified before being shown.
- Play/pause, forward/back, 0.5×/1×/2×/4× speed switch, restart, next-face highlight and direction guide.
- Live rear-camera scanning with six-centre calibration, perceptual colour matching, uncertain-sticker indicators and six-frame stability checks. Align one face with the guide, capture and review before applying. Photo upload with zoom/rotation remains available.
- Desktop “Scan from phone” QR pairing uses a random link and the existing Supabase broadcast service. Its QR entry is desktop-only; the phone link opens a dedicated full-screen companion with no portfolio, 3D cube, photo controls, manual face selector or review grid. After one Start scanning tap, stable faces are captured and classified automatically in centre-colour order, then all six colour strings are sent with receipt acknowledgements and retries. Only a face obscured by glare is requested again. Images stay on the phone. Links expire after 20 minutes. HTTPS and camera permission are required for live video.
- `npm run test:cube-scan` checks colour classification, ambiguity, calibration, sampling and stability. Synthetic images and a real relay transfer were tested; physical phone-camera accuracy remains unverified. Recalibrate when lighting changes.
- Reduced-motion support and written instructions if WebGL is unavailable.

Dependencies: Three.js and cube.js, both MIT. Licences are included alongside the bundles.

The two cube.js 1.3.2 runtime files are vendored with their MIT licence, avoiding its unused legacy npm package-manager dependency. Three.js is pinned in package.json.
