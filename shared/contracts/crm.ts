import { crmDestinations, crmSyncStatuses, type CrmDestination, type CrmSyncStatus } from "./enums";
import { failure, isRecord, success, uuidField, type ValidationResult } from "./_validation";

export interface CrmSyncPayload {
  bookingId: string;
  destination: CrmDestination;
  payload: Record<string, unknown>;
  status: CrmSyncStatus;
}

export const crmSyncPayloadSchema = {
  safeParse(value: unknown): ValidationResult<CrmSyncPayload> {
    if (!isRecord(value)) return failure({ form: ["Invalid CRM sync payload."] });
    const errors: Record<string, string[]> = {};
    const destination = typeof value.destination === "string" && crmDestinations.includes(value.destination as CrmDestination)
      ? (value.destination as CrmDestination)
      : null;
    const status = typeof value.status === "string" && crmSyncStatuses.includes(value.status as CrmSyncStatus)
      ? (value.status as CrmSyncStatus)
      : "pending";
    const payload = isRecord(value.payload) ? value.payload : null;

    const result: CrmSyncPayload = {
      bookingId: uuidField(value.bookingId, "bookingId", errors) ?? "",
      destination: destination ?? "crm_rest",
      payload: payload ?? {},
      status,
    };

    if (!destination) errors.destination = ["destination is invalid."];
    if (!payload) errors.payload = ["payload must be an object."];

    return Object.keys(errors).length ? failure(errors) : success(result);
  },
};
