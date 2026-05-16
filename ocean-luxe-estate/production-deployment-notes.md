# Ocean Luxe Production Deployment Notes

## Shared Backend
- Use one Neon Postgres project/branch for the shared production schema across app variants.
- Apply migrations from `db/migrations` before deploying either frontend.
- Store media as URLs in Postgres (`resorts.hero_image_url`, `resorts.gallery_images`, `media_assets.file_url`) and keep object storage concerns outside this repo.

## Vercel Project A
- App: `ocean-luxe-app`
- Domain: `xp.oceanluxe.org`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `ocean-luxe-app`
- Required env vars: `.env.example` in `ocean-luxe-app`
- Wrap the public app in `BrowserRouter` so React Router routes render correctly in production.
- Ensure the Stripe webhook points to `/api/stripe/webhook`
- Enable cron for `/api/cron/process-crm-sync`
- Keep SPA rewrites and `/api/*` routes separate so serverless functions remain reachable.

## Existing CRM Integration
- Existing CRM domain: `deals.oceanluxe.org`
- Do not create a second CRM app in this repository.
- Point `CRM_API_BASE_URL` to the existing CRM API surface used for opportunity sync.
- Add new admin routes and queue processing only inside the real CRM codebase once that folder is available locally.

## Operational Notes
- Stripe is the only system allowed to confirm payment status.
- CRM sync is asynchronous. Booking success must not depend on CRM availability.
- Discord webhook is a secondary verification channel, not the source of truth.
- Admin access should be limited to authorized emails present in `admin_profiles`.
- External CI/CD, staging validation, and marketing distribution stay outside this repo and should consume the release artifacts generated here.
