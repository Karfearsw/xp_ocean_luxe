import { licenseStatuses, type LicenseStatus } from "./enums";
import { failure, isRecord, numberField, stringField, success, urlField, uuidField, type ValidationResult } from "./_validation";

export interface MediaAsset {
  id?: string;
  resort_id: string;
  file_url: string;
  caption?: string | null;
  alt_text: string;
  license_status: LicenseStatus;
  sort_order: number;
}

export const mediaAssetSchema = {
  safeParse(value: unknown): ValidationResult<MediaAsset> {
    if (!isRecord(value)) return failure({ form: ["Invalid media payload."] });
    const errors: Record<string, string[]> = {};
    const licenseStatus = typeof value.license_status === "string" && licenseStatuses.includes(value.license_status as LicenseStatus)
      ? (value.license_status as LicenseStatus)
      : "licensed";

    const payload: MediaAsset = {
      id: typeof value.id === "string" ? value.id : undefined,
      resort_id: uuidField(value.resort_id, "resort_id", errors) ?? "",
      file_url: urlField(value.file_url, "file_url", errors) ?? "",
      caption: value.caption == null ? null : stringField(value.caption, "caption", 1, errors),
      alt_text: stringField(value.alt_text, "alt_text", 3, errors) ?? "",
      license_status: licenseStatus,
      sort_order: numberField(value.sort_order ?? 0, "sort_order", errors) ?? 0,
    };

    return Object.keys(errors).length ? failure(errors) : success(payload);
  },
};
