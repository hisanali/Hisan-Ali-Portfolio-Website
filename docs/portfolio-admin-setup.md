# Portfolio analytics admin

Private route: `/admin/`. Uses the same authenticated handler in local Next.js and a Vercel Node function alongside the existing static website. No tracking scripts are loaded in the admin HTML.

## Connect Google

1. In a Google Cloud project you own, enable **Google Analytics Data API** and **Google Search Console API**.
2. Configure the Google OAuth consent application. For a personal/testing application, add `hisanali73@gmail.com` as a test user. Google may expire testing refresh tokens; signing in again restores access.
3. Create an OAuth client of type **Web application** with these authorized redirect URIs:
   - Local: `http://localhost:4318/admin/callback/`
   - Production: `https://hisanali.com/admin/callback/`
4. Configure the following server-only environment variables in `.env.local` for local testing and in the hosting environment before deployment. Do not prefix them with `NEXT_PUBLIC_`, commit client downloads, or put credentials in the dashboard.

```text
GOOGLE_CLIENT_ID=<OAuth client ID>
GOOGLE_CLIENT_SECRET=<OAuth client secret>
ADMIN_SESSION_SECRET=<at least 32 random characters>
ADMIN_EMAIL=hisanali73@gmail.com
ADMIN_ORIGIN=http://localhost:4318
GA4_PROPERTY_ID=515896463
```

For production, set `ADMIN_ORIGIN=https://hisanali.com`. Generate the session secret using a secure password manager or `openssl rand -hex 32`; store it privately. Changing the secret invalidates existing sessions.

5. Open `/admin/`, sign in with the allowed account, and approve read-only access to Analytics and Search Console. The Google account must already have access to both properties. Verify live report results before publication. Browser sign-in from a previous task does not itself authorize this new app or provide API credentials.

## Preview and validation

Run `npx next dev --hostname 127.0.0.1 --port 4318`, then open `http://localhost:4318/admin/?demo=1`. The clearly labelled demo is only available in development on a loopback host. `/admin/data/` always requires a validated encrypted session for live data, even locally. Do not use demo figures as business measurements.

- `node --test scripts/test-admin.mjs`
- `npx tsc --noEmit`
- `npm run build`

## Reporting semantics

- Traffic: GA4 property 515896463, measurement G-DDNBW2YBFL. Date presets are 7, 28 and 90 completed days, ending yesterday. Date boundaries are selected in Asia/Muscat; GA4 applies its configured property timezone.
- SEO: URL-prefix property `https://hisanali.com/`, final web-search data, ending three days ago. Search Console uses Pacific Time. Each source has its own equal-length previous period.
- Country and device filters apply to all historical API requests; realtime deliberately remains all visitors and is labelled accordingly.
- Contact actions count `lead_whatsapp`, `lead_email`, `lead_phone` and `lead_form`. Downloads and contact CTA clicks are separate. Counts are repeated actions, not unique leads or sales.
- Full-period distinct visitors and Search Console aggregate CTR/position are queried directly, never summed/averaged from detail rows.
- Data failures remain unavailable, distinct from a successful report with zero activity. Daily charts plot returned dates; search query tables omit privacy-hidden queries. Tables show top 100 GA4 rows (250 for pages) and top 250 Search Console rows, with truncation notices. CSV includes the current view's searched rows, displayed trend series, filter values and source dates.
- `lead_location` is not queried until a GA4 custom dimension is registered. Existing Google settings are not changed by this app.
- No sales revenue, exact-person journeys, session recordings or visitor identities are inferred.

## Security and operations

OAuth authorization-code flow uses PKCE and an expiring encrypted state cookie. The verified Google account email must match the server-side allowlist. Access/refresh tokens are kept in an authenticated encrypted HttpOnly cookie, with Secure on HTTPS, SameSite=Lax, `/admin` scope and an eight-hour session lifetime. Tokens are never returned as report JSON or placed in localStorage. Sign-out is a same-origin POST. Responses are no-store, noindex and cannot be embedded in frames. A restrictive CSP is applied. Production has no demo or development-login bypass.

Reports are queried with concurrency capped at three per request and overall deadlines and cached in server memory for five minutes, scoped to account/property/filters. Serverless instances do not share this cache. Realtime uses a separate authenticated endpoint, a 25-second server cache, and 30-second browser polling while visible. It includes recent users, pages, events, countries, cities, devices and per-minute activity. Google processing can still delay events by a few minutes. Historical reports refresh every five minutes. Filter switches cancel stale browser requests; partial provider failures do not hide available reports.

The legacy file-serving route now denies dotfiles, internal source/dependency directories, sensitive source/config extensions and paths outside the project root (including symlink escapes). This is required before storing OAuth credentials.

## References

- [Google Analytics Data API reporting](https://developers.google.com/analytics/devguides/reporting/data/v1/basics)
- [Search Console Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Google web server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)

Production uses `vercel.json` rewrites for `/admin` and `/admin/:path*`. Public assets are packed into `.vercel/site-static`; application code, environment files, tests and dependency trees are not static output. The existing public pages and multiplayer function are preserved.
