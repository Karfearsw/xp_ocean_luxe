# Ocean Luxe Estate — Automation Workflows (Event-Driven)

## Lead capture → qualification
### Trigger: Trip Snapshot submitted
- Create Lead
- Compute score (initial)
- Send confirmation email with:
  - next step link (Concierge Intake)
  - consult calendar link
- Create internal task: “Review lead + route within 4 business hours”

### Trigger: Concierge Intake submitted
- Update Lead score
- If score >= threshold:
  - tag “Qualified”
  - send “Book your Concierge Consult” sequence (email + SMS if consented)
- Else:
  - tag “Nurture”
  - send value sequence + invite to paid Trip Audit

## Consult → deposit
### Trigger: Consult booked
- Create calendar event (internal + client)
- Send reminders:
  - T-24h email
  - T-2h SMS (if consented)
- Create internal task: “Prep consult: review intake + draft offer recommendation”

### Trigger: Consult completed (manual outcome selection)
Outcome A: Closed (deposit requested)
- Send deposit link + policy summary
- Create task: “Follow up if unpaid in 24h”

Outcome B: Not a fit
- Send polite decline + referral (if appropriate)
- Tag and archive

Outcome C: Needs nurture
- Send 7-day nurture sequence + reschedule option

## Deposit → production
### Trigger: Deposit paid
- Create Trip + Client (if new)
- Create task pack (by lane):
  - itinerary template
  - vendor quote requests
  - transport plan
  - reservation plan
- Send welcome pack:
  - what happens next
  - communication channel setup (Discord invite request)
  - checklist (documents, IDs, preferences)

## Itinerary approval → execution
### Trigger: Itinerary ready (internal)
- Send itinerary review link + approval button
- Create task: “Schedule confirmation call (optional for VIP)”

### Trigger: Itinerary approved
- Lock vendor bookings / issue confirmations
- Create trip-day checklist and escalation contacts
- Start pre-arrival sequence

## In-trip concierge
### Trigger: Trip start date
- Create “Daily check-in” tasks
- Send “Arrival reset” message + key contacts
- If Discord enabled:
  - post pinned rules + itinerary link in client channel

## Post-trip → review/referral/membership
### Trigger: Trip end date + 1 day
- Send “Thank you + quick feedback” survey
- Create task: “Personal thank you note”

### Trigger: Positive feedback
- Request review (Google/other)
- Send referral offer
- Invite to VIP Club

## Westgate invitation-only branch
### Trigger: Client requests invitation + consents
- Create WestgateCandidate record
- Create task: “Education call”

### Trigger: Westgate education call completed
- Outcome: approved → handoff workflow
- Outcome: not approved → return to concierge nurture

