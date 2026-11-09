# Cloudflare production deployment

Pushes to `main` run `.github/workflows/cloudflare-production.yml`. Pull requests build and validate without deploying. Manual runs deploy only when main is selected. Deployments are serialized and never cancelled midway.

## One-time credential setup

Create a Cloudflare API token for this account with Account / Workers Scripts / Edit, Zone / Workers Routes / Edit, and Zone / Zone / Read. Scope account access to `df14e9260a7bd8c15086d0cd5af3daff` and zone access to hisanali.com. Save it as repository Actions secret `CLOUDFLARE_API_TOKEN`. Never commit it. Existing production backend secrets remain in Cloudflare.

## Build and deployment

Node 24 is required for the build scripts' TypeScript imports. The build bundles the games and avatar, generates the static site and API bundles, optimizes the two oversized models, and validates Cloudflare's 25 MiB asset limit. Only public assets are packaged. The Worker continues using the existing production backend.

Deployment targets only `wrangler.production.jsonc` and `hisan-portfolio`. The verification step restores the existing route's request-limit fail-open setting (Wrangler resets it), verifies that setting, and checks that live scripts match the build. The separate www/HTTP redirect Worker is unchanged.

Check the Cloudflare production Action after each push. A failed build does not deploy; a failed post-deployment check needs investigation because the deployment may already be live. Vercel remains available as the preserved origin/fallback. Manual rollback can use Cloudflare Worker deployment history.
