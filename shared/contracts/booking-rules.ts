import { failure, isRecord, numberField, success, uuidField, type ValidationResult } from "./_validation";

export interface BookingRules {
  packageId: string;
  minimumNights: number;
  checkInRules?: string;
  checkOutRules?: string;
}

export const bookingRulesSchema = {
  safeParse(value: unknown): ValidationResult<BookingRules> {
    if (!isRecord(value)) return failure({ form: ["Invalid booking rules payload."] });
    const errors: Record<string, string[]> = {};
    const payload: BookingRules = {
      packageId: uuidField(value.packageId, "packageId", errors) ?? "",
      minimumNights: numberField(value.minimumNights, "minimumNights", errors) ?? 0,
      checkInRules: typeof value.checkInRules === "string" ? value.checkInRules : undefined,
      checkOutRules: typeof value.checkOutRules === "string" ? value.checkOutRules : undefined,
    };
    if (payload.minimumNights <= 0) errors.minimumNights = ["minimumNights must be greater than zero."];
    return Object.keys(errors).length ? failure(errors) : success(payload);
  },
};
