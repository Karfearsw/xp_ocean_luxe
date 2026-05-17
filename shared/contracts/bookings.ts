import { bookingStatuses, paymentStatuses, type BookingStatus, type PaymentStatus } from "./enums";
import { dateField, emailField, failure, isRecord, numberField, stringField, uuidField, success, type ValidationResult } from "./_validation";

export interface BookingDraft {
  resort_id: string;
  room_type_id?: string | null;
  package_id: string;
  car_type_id?: string | null;
  concierge_service_id?: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_dob: string;
  compliance_acknowledged: boolean;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guests_adults?: number;
  guests_children?: number;
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
  total_price?: number;
  deposit_amount?: number;
  balance_due?: number;
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
      room_type_id:
        value.room_type_id == null || value.room_type_id === ""
          ? null
          : uuidField(value.room_type_id, "room_type_id", errors) ?? null,
      car_type_id:
        value.car_type_id == null || value.car_type_id === ""
          ? null
          : uuidField(value.car_type_id, "car_type_id", errors) ?? null,
      concierge_service_id:
        value.concierge_service_id == null || value.concierge_service_id === ""
          ? null
          : uuidField(value.concierge_service_id, "concierge_service_id", errors) ?? null,
      guest_name: stringField(value.guest_name, "guest_name", 2, errors) ?? "",
      guest_email: emailField(value.guest_email, "guest_email", errors) ?? "",
      guest_phone: stringField(value.guest_phone, "guest_phone", 7, errors) ?? "",
      guest_dob: dateField(value.guest_dob, "guest_dob", errors) ?? "",
      compliance_acknowledged: value.compliance_acknowledged === true,
      check_in_date: dateField(value.check_in_date, "check_in_date", errors) ?? "",
      check_out_date: dateField(value.check_out_date, "check_out_date", errors) ?? "",
      nights: numberField(value.nights, "nights", errors) ?? 0,
      guests_adults: value.guests_adults == null ? 2 : numberField(value.guests_adults, "guests_adults", errors) ?? 0,
      guests_children:
        value.guests_children == null ? 0 : numberField(value.guests_children, "guests_children", errors) ?? 0,
    };

    if (payload.nights <= 0) errors.nights = ["nights must be greater than zero."];
    if ((payload.guests_adults ?? 0) < 0) errors.guests_adults = ["guests_adults must be zero or greater."];
    if ((payload.guests_children ?? 0) < 0) errors.guests_children = ["guests_children must be zero or greater."];
    if ((payload.guests_adults ?? 0) + (payload.guests_children ?? 0) <= 0) errors.guests_adults = ["At least one guest is required."];
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
      total_price: value.total_price == null ? undefined : numberField(value.total_price, "total_price", errors) ?? undefined,
      deposit_amount: value.deposit_amount == null ? undefined : numberField(value.deposit_amount, "deposit_amount", errors) ?? undefined,
      balance_due: value.balance_due == null ? undefined : numberField(value.balance_due, "balance_due", errors) ?? undefined,
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
