# Prompt 02: Checkout Compliance Flow

Upgrade checkout to enforce provider rules.

## Goals
- Add mandatory DOB field.
- Block checkout if guest age is under 21.
- Add mandatory compliance checkbox with exact legal copy.

## Files
- `ocean-luxe-app/src/pages/BookingFlowPage.tsx`
- `ocean-luxe-app/src/lib/api-client.ts`
- `ocean-luxe-app/api/_lib/booking-service.ts`

## Rules
- Frontend must disable submit for under-21/unchecked compliance.
- Backend must enforce age and checkbox validation as source of truth.
- Error message must clearly explain age requirement.
