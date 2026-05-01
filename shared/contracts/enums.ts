export const paymentModes = ["full", "deposit"] as const;
export type PaymentMode = (typeof paymentModes)[number];

export const blockStatuses = ["available", "held", "reserved", "booked", "blocked"] as const;
export type BlockStatus = (typeof blockStatuses)[number];

export const paymentStatuses = ["draft", "pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const bookingStatuses = ["draft", "pending_payment", "confirmed", "cancelled", "refunded"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const licenseStatuses = ["licensed", "pending_review", "rejected"] as const;
export type LicenseStatus = (typeof licenseStatuses)[number];

export const crmDestinations = ["crm_rest", "discord"] as const;
export type CrmDestination = (typeof crmDestinations)[number];

export const crmSyncStatuses = ["pending", "processing", "sent", "failed", "dead_letter"] as const;
export type CrmSyncStatus = (typeof crmSyncStatuses)[number];
