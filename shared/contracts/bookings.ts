import { bookingStatuses, paymentStatuses, type BookingStatus, type PaymentStatus } from "./enums";
import { dateField, emailField, failure, isRecord, numberField, stringField, uuidField, success, type ValidationResult } from "./_validation";

export interface BookingDraft {
  resort_id: string;
  package_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_dob: string;
  compliance_acknowledged: boolean;
  check_in_date: string;
  check_out_date: string;
  nights: number;
}

export interface BookingRecord extends BookingDraft {
  id: string;
  customer_price: number;
  base_cost: number;
  margin: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  stripe_payment_intent_id?: string | null;
  provider_confirmation_number?: string | null;
  created_at: string;
}

export interface AvailabilitySearch {
  resortId?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

export const bookingDraftSchema = {
  safeParse(value: unknown): ValidationResult<BookingDraft> {
    if (!isRecord(value)) return failure({ form: ["Invalid booking payload."] });
    const errors: Record<string, string[]> = {};
    const payload: BookingDraft = {
      resort_id: uuidField(value.resort_id, "resort_id", errors) ?? "",
      package_id: uuidField(value.package_id, "package_id", errors) ?? "",
      guest_name: stringField(value.guest_name, "guest_name", 2, errors) ?? "",
      guest_email: emailField(value.guest_email, "guest_email", errors) ?? "",
      guest_phone: stringField(value.guest_phone, "guest_phone", 7, errors) ?? "",
      guest_dob: dateField(value.guest_dob, "guest_dob", errors) ?? "",
      compliance_acknowledged: value.compliance_acknowledged === true,
      check_in_date: dateField(value.check_in_date, "check_in_date", errors) ?? "",
      check_out_date: dateField(value.check_out_date, "check_out_date", errors) ?? "",
      nights: numberField(value.nights, "nights", errors) ?? 0,
    };

    if (payload.nights <= 0) errors.nights = ["nights must be greater than zero."];
    if (payload.check_in_date && payload.check_out_date && Date.parse(payload.check_out_date) <= Date.parse(payload.check_in_date)) {
      errors.check_out_date = ["check_out_date must be after check_in_date."];
    }
    if (!payload.compliance_acknowledged) {
      errors.compliance_acknowledged = ["compliance_acknowledged must be true."];
    }

    return Object.keys(errors).length ? failure(errors) : success(payload);
  },
};

export const bookingRecordSchema = {
  safeParse(value: unknown): ValidationResult<BookingRecord> {
    const parsed = bookingDraftSchema.safeParse(value);
    if ("error" in parsed) {
      return parsed as ValidationResult<BookingRecord>;
    }
    if (!isRecord(value)) return failure({ form: ["Invalid booking record."] });
    const errors: Record<string, string[]> = {};
    const paymentStatus = typeof value.payment_status === "string" && paymentStatuses.includes(value.payment_status as PaymentStatus)
      ? (value.payment_status as PaymentStatus)
      : null;
    const bookingStatus = typeof value.booking_status === "string" && bookingStatuses.includes(value.booking_status as BookingStatus)
      ? (value.booking_status as BookingStatus)
      : null;

    const payload: BookingRecord = {
      ...parsed.data,
      id: uuidField(value.id, "id", errors) ?? "",
      customer_price: numberField(value.customer_price, "customer_price", errors) ?? 0,
      base_cost: numberField(value.base_cost, "base_cost", errors) ?? 0,
      margin: numberField(value.margin, "margin", errors) ?? 0,
      payment_status: paymentStatus ?? "draft",
      booking_status: bookingStatus ?? "draft",
      stripe_payment_intent_id: typeof value.stripe_payment_intent_id === "string" ? value.stripe_payment_intent_id : null,
      provider_confirmation_number: typeof value.provider_confirmation_number === "string" ? value.provider_confirmation_number : null,
      created_at: dateField(value.created_at, "created_at", errors) ?? "",
    };

    if (!paymentStatus) errors.payment_status = ["payment_status is invalid."];
    if (!bookingStatus) errors.booking_status = ["booking_status is invalid."];

    return Object.keys(errors).length ? failure(errors) : success(payload);
  },
};

export const availabilitySearchSchema = {
  safeParse(value: unknown): ValidationResult<AvailabilitySearch> {
    if (!isRecord(value)) return failure({ form: ["Invalid availability search payload."] });
    const errors: Record<string, string[]> = {};
    const payload: AvailabilitySearch = {
      resortId: value.resortId == null ? undefined : uuidField(value.resortId, "resortId", errors) ?? undefined,
      destination: typeof value.destination === "string" ? value.destination : undefined,
      startDate: value.startDate == null ? undefined : dateField(value.startDate, "startDate", errors) ?? undefined,
      endDate: value.endDate == null ? undefined : dateField(value.endDate, "endDate", errors) ?? undefined,
    };
    return Object.keys(errors).length ? failure(errors) : success(payload);
  },
};
