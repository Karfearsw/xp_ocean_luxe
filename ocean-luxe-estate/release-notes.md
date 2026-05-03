# XP Ocean Luxe Release Notes

## Version 0.1.0

### Release Summary

This release restores public page visibility for the booking experience and aligns the repository with the currently approved deployment and release posture.

### Included In This Release

- Fixed the public app runtime visibility failure by restoring the missing React Router provider at the application entrypoint.
- Corrected Vercel rewrite behavior so SPA routes can coexist with `/api/*` serverless endpoints.
- Synchronized deployment documentation with the live booking architecture and current environment-variable requirements.
- Replaced the placeholder app README with project-specific setup, validation, and deployment guidance.
- Formalized the booking app release as version `0.1.0`.

### Messaging For Marketing

- Public booking pages now render correctly across the live route structure.
- Booking flows, API endpoints, and deployment docs are aligned for the current XP Ocean Luxe release.
- The release is focused on stability, deployment readiness, and clearer operational handoff.

### Operational Notes

- Stripe remains the only authority for payment confirmation.
- CRM sync remains asynchronous and should not block booking confirmation.
- External staging, production approval, and campaign rollout should follow the existing deployment workflow outside this repository.
