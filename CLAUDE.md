# Publishing the portfolio

Production is https://hisanali.com, served by the Cloudflare Worker `hisan-portfolio`.

When the user explicitly asks to publish or push live:
1. Fetch and reconcile the latest `origin/main`, preserving other work.
2. Complete the requested changes and relevant checks, then push/merge the approved changes to `main`.
3. Every push to `main` triggers `.github/workflows/cloudflare-production.yml`. Watch the **Cloudflare production** GitHub Action for that exact commit through deployment and verification.
4. Verify the requested behavior on https://hisanali.com before saying it is live. A Git push or successful Vercel/GitHub Pages build alone is not proof of production deployment.

Pull requests run build validation without publishing. Do not request a Cloudflare token from the user: deployment uses the repository's encrypted `CLOUDFLARE_API_TOKEN` secret. Never print secrets. See `docs/cloudflare-deployment.md` for the build and fallback details.

If the Cloudflare action fails, inspect its logs and fix the failure. Do not assume old content is merely a cache issue or ask the user to purge everything without evidence. Preserve existing production secrets, backend data, redirect Worker, and Vercel fallback.
