# Prompt 04: Webhook Event Contracts

Harden Stripe webhook booking lifecycle and CRM sync payloads.

## Goals
- Keep `payment_intent.succeeded` handling idempotent.
- Handle failed/refunded statuses and emit CRM events.
- Preserve email behavior: payment confirmation at payment, final itinerary after provider confirmation.

## Files
- `ocean-luxe-app/api/stripe/webhook.ts`
- `ocean-luxe-app/api/_lib/crm-sync.ts`
- `ocean-luxe-app/api/cron/process-crm-sync.ts`

## Acceptance
- CRM receives typed lifecycle events (`booking_paid`, `booking_refunded`, etc.).
- Duplicate webhook delivery does not create duplicate side effects.
