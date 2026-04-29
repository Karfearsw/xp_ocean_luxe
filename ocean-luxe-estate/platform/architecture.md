# Ocean Luxe Estate — Custom Platform Architecture (System of Record)

## Design principles
- Concierge-first data model: every inquiry becomes a structured “Trip” and a set of tasks.
- Human-in-the-loop automation: automations create tasks and reminders; humans deliver the luxury.
- Clear separation of roles: sales concierge vs trip designer vs dispatcher vs client success.
- Compliance by design: consent capture, disclosure acceptance, audit trails, minimal data retention.

## Core modules
1) **Marketing site**
- Pages, content, SEO, lead magnets

2) **Lead capture + qualification**
- Trip Snapshot → Concierge Intake
- Lead scoring + routing to pipelines

3) **Consult scheduling**
- Multiple consult types
- Automated reminders + no-show recovery

4) **Deposits + payments**
- Deposits for trip design
- Retainer payments for concierge support windows
- Corporate invoicing (phase 2)

5) **Trip workspace**
- Itinerary builder (timeline + map + reservations)
- Document center (confirmations, PDFs, policies)
- Client preferences + constraints

6) **Vendor & partner management**
- Vendor profiles, insurance docs, SLA tier, service area
- Quote requests + booking confirmation tracking
- Commission ledger

7) **Transportation coordination**
- Dispatch requests, pickup manifests, child-seat notes
- Driver/vendor assignment + escalation workflow

8) **CRM pipelines**
- Stages, tags, tasks, activity log
- Separate “Vacation Opportunities / Westgate” pipeline branch

9) **Automation engine**
- Event triggers: form submitted, consult booked, payment received, itinerary approved, trip started, trip ended
- Task templates per lane (family/couples/corporate)

10) **Client portal (Discord + optional web portal)**
- Discord invite + channel template provisioning
- Pinned itinerary links + concierge rules
- Privacy boundaries and role-based access

11) **Analytics + reporting**
- Funnel conversion rates (lead → consult → deposit → delivered)
- Margin reporting by SKU
- Vendor performance score
- Westgate lead quality + outcomes

## Recommended MVP technical stack (decision complete, but interchangeable)
- Web app: Next.js + TypeScript
- Database: Postgres
- ORM/migrations: Prisma
- Auth: magic link (admin) + role-based access
- Payments: Stripe
- Messaging: Twilio (SMS), SendGrid (email)
- Calendar: Google Calendar API
- File storage: S3-compatible storage
- Discord: bot + server templates (invites, channels, roles)

## Security and privacy baseline
- Do not store full payment details (Stripe only).
- Encrypt sensitive fields at rest (IDs, consent timestamps, notes if needed).
- Audit log for: consent captured, disclosures accepted, lead transferred to partners.
- Strict admin RBAC: sales vs ops vs finance.

