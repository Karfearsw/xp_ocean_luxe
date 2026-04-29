# Ocean Luxe Estate — Data Model (Conceptual)

## Core entities
### Lead
- id
- createdAt
- source (paid_search, referral_partner, organic, influencer, etc.)
- lane (family, couples, corporate, international)
- score (0–100)
- status (new, qualified, disqualified)
- contact (name, email, phone)
- consent (emailConsentAt, smsConsentAt, disclosuresAcceptedAt)

### Client
- id
- primaryContactLeadId
- householdMembers
- preferences (dining, mobility, language, celebration flags)
- communicationPreference (discord, sms, email, whatsapp)

### Trip
- id
- clientId
- dates (start, end)
- lodging (name, address, confirmationRefs)
- party (adults, children, notes)
- lane
- status (in_production, approved, in_trip, completed)

### ItineraryItem
- id
- tripId
- type (dining, park_day, transport, experience, shopping, downtime, admin)
- startAt/endAt
- location
- confirmationRef
- vendorId (optional)
- notes

### Booking
- id
- tripId
- type (vendor_service, transport, dining, ticketing, other)
- vendorId
- price
- cost
- margin
- status (quoted, confirmed, cancelled, refunded)

### Payment
- id
- clientId
- tripId (optional)
- type (deposit, retainer, invoice)
- provider (stripe)
- amount
- status

### Vendor
- id
- category (driver, photographer, dining, yacht, nightlife, planner, villa_manager, etc.)
- serviceArea
- insuranceDocs
- slaTier (preferred, elite, backup)
- commissionTerms
- performanceScore

### Partner
- id
- type (hotel, resort, airbnb_host, property_manager, event_planner, corporate_referrer)
- referralCode
- commissionTerms

### Task
- id
- tripId / leadId
- assignedTo
- type (call, quote_request, itinerary_build, dispatch, follow_up, review_request)
- dueAt
- status

### Message
- id
- relatedTo (leadId/tripId)
- channel (email, sms, discord)
- direction (inbound/outbound)
- status (sent, delivered, failed)

### WestgateCandidate (optional branch)
- id
- clientId/leadId
- consentAt
- status (requested, approved, education_scheduled, handed_off, outcome_recorded)
- outcome (unknown, attended, no_show, purchased, declined)

## Derived views (for ops)
- Trip manifest (arrivals, departures, pickups)
- Today’s concierge dashboard (tasks + urgent issues)
- Vendor availability + backlog
- Westgate pipeline dashboard (quality + outcomes)

