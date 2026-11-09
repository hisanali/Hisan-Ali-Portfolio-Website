#!/bin/sh
set -eu
npm run build:games
npm run build:evermile
npm run build:cube
npm run build:avatar
node scripts/generate-static-site.mjs
node scripts/build-static-output.mjs
npx --yes @gltf-transform/cli@4.5.1 dedup evermile/assets/models/horse-supplied.glb .vercel/site-static/evermile/assets/models/horse-supplied.glb
npx --yes @gltf-transform/cli@4.5.1 webp evermile/assets/models/train-supplied.glb .vercel/site-static/evermile/assets/models/train-supplied.glb --quality 85
node scripts/prepare-cloudflare-production.mjs
