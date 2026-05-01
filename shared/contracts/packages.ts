import { paymentModes, type PaymentMode } from "./enums";
import { booleanField, failure, isRecord, numberField, optionalStringField, stringField, success, uuidField, type ValidationResult } from "./_validation";

export interface ResortPackage {
  id?: string;
  resort_id: string;
  package_name: string;
  check_in_rules?: string | null;
  check_out_rules?: string | null;
  nights: number;
  base_cost: number;
  markup_amount: number;
  public_price: number;
  payment_mode: PaymentMode;
  deposit_amount?: number | null;
  refundable: boolean;
  active: boolean;
}

export const packageSchema = {
  safeParse(value: unknown): ValidationResult<ResortPackage> {
    if (!isRecord(value)) return failure({ form: ["Invalid package payload."] });
    const errors: Record<string, string[]> = {};
    const paymentMode = typeof value.payment_mode === "string" && paymentModes.includes(value.payment_mode as PaymentMode)
      ? (value.payment_mode as PaymentMode)
      : "full";

    const payload: ResortPackage = {
      id: typeof value.id === "string" ? value.id : undefined,
      resort_id: uuidField(value.resort_id, "resort_id", errors) ?? "",
      package_name: stringField(value.package_name, "package_name", 2, errors) ?? "",
      check_in_rules: optionalStringField(value.check_in_rules),
      check_out_rules: optionalStringField(value.check_out_rules),
      nights: numberField(value.nights, "nights", errors) ?? 0,
      base_cost: numberField(value.base_cost, "base_cost", errors) ?? 0,
      markup_amount: numberField(value.markup_amount, "markup_amount", errors) ?? 0,
      public_price: numberField(value.public_price, "public_price", errors) ?? 0,
      payment_mode: paymentMode,
      deposit_amount: value.deposit_amount == null || value.deposit_amount === "" ? null : numberField(value.deposit_amount, "deposit_amount", errors),
      refundable: booleanField(value.refundable, false),
      active: booleanField(value.active, true),
    };

    if (payload.nights <= 0) errors.nights = ["nights must be greater than zero."];
    if (payload.base_cost < 0) errors.base_cost = ["base_cost cannot be negative."];
    if (payload.markup_amount < 0) errors.markup_amount = ["markup_amount cannot be negative."];
    if (payload.public_price < 0) errors.public_price = ["public_price cannot be negative."];
    if (payload.payment_mode === "deposit") {
      if (payload.deposit_amount == null || payload.deposit_amount < 0 || payload.deposit_amount > payload.public_price) {
        errors.deposit_amount = ["Deposit amount must be set, non-negative, and no greater than public price."];
      }
    } else {
      payload.deposit_amount = null;
    }

    return Object.keys(errors).length ? failure(errors) : success(payload);
  },
};
