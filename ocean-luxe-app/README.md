# XP Ocean Luxe Booking App

Public-facing booking application for XP Ocean Luxe, built with Vite, React, TypeScript, Tailwind CSS, Vercel serverless functions, shared domain contracts, and a Neon Postgres-backed booking workflow shared with CRM.

## What This Repo Contains

- Public booking storefront under `src/`
- Serverless booking and payment APIs under `api/`
- Shared request/response validation contracts in `../shared/contracts`
- Postgres SQL migrations in `../db/migrations` (canonical schema source for local/preview runs)
- Deployment and release notes in `../ocean-luxe-estate`

## Core Flows

- Browse public resort inventory
- View package pricing and booking terms
- Create booking drafts
- Create Stripe payment intents
- Confirm bookings via webhook processing
- Queue CRM sync jobs and Discord verification notifications

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Run validation:

```bash
npm run build
npm run lint
npm run check
```

## Required Environment Variables

Create a local `.env` file based on `.env.example` and provide values for:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRM_API_BASE_URL`
- `CRM_API_TOKEN`
- `DISCORD_WEBHOOK_URL`

## Deployment Notes

- Vercel root directory: `ocean-luxe-app`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites must not intercept `/api/*`
- Stripe webhook target: `/api/stripe/webhook`
- Cron target: `/api/cron/process-crm-sync`

## Release Status

- Current application version: `0.1.0`
- Current release notes live in `../ocean-luxe-estate/release-notes.md`
