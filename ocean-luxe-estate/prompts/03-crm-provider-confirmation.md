# Prompt 03: CRM Provider Confirmation

Implement manual fulfillment completion from admin to customer.

## Goals
- Add admin endpoint for `provider_confirmation_number`.
- Persist confirmation number to booking.
- Emit CRM event `provider_confirmation_added`.

## Files
- `ocean-luxe-app/api/admin/bookings/[id]/provider-confirmation.ts`
- `ocean-luxe-app/api/_lib/crm-sync.ts`
- `shared/contracts/crm.ts`

## Acceptance
- Endpoint requires admin auth.
- Missing/empty confirmation numbers are rejected.
- CRM queue gets payload with booking id + provider confirmation number.
