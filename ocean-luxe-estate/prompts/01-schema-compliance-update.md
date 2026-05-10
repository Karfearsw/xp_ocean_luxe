# Prompt 01: Schema Compliance Update

Update XP Ocean Luxe data contracts and SQL schema for guest-certificate compliance.

## Goals
- Add `packages.guest_certificate_fee` (numeric, non-negative).
- Add `bookings.guest_dob` (date, required).
- Add `bookings.provider_confirmation_number` (text, nullable).

## Files
- `supabase/migrations/0005_guest_certificate_compliance.sql`
- `shared/contracts/packages.ts`
- `shared/contracts/bookings.ts`
- `ocean-luxe-app/src/types/index.ts`

## Acceptance
- Migrations apply successfully.
- Shared validation accepts new required fields and rejects invalid payloads.
- Frontend and API types stay aligned.
