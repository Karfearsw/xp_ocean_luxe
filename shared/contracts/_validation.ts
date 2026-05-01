export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { flatten: () => { formErrors: string[]; fieldErrors: Record<string, string[]> } } };

function buildError(fieldErrors: Record<string, string[]>, formErrors: string[] = []) {
  return {
    flatten: () => ({ formErrors, fieldErrors }),
  };
}

export function failure<T>(fieldErrors: Record<string, string[]>, formErrors: string[] = []): ValidationResult<T> {
  return { success: false, error: buildError(fieldErrors, formErrors) };
}

export function success<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringField(value: unknown, field: string, min = 1, errors?: Record<string, string[]>) {
  if (typeof value !== "string" || value.trim().length < min) {
    if (errors) errors[field] = [`${field} is required.`];
    return null;
  }
  return value.trim();
}

export function optionalStringField(value: unknown) {
  if (value == null || value === "") return null;
  return typeof value === "string" ? value.trim() : null;
}

export function booleanField(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function numberField(value: unknown, field: string, errors?: Record<string, string[]>) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    if (errors) errors[field] = [`${field} must be a valid number.`];
    return null;
  }
  return num;
}

export function uuidField(value: unknown, field: string, errors?: Record<string, string[]>) {
  const str = stringField(value, field, 1, errors);
  if (!str) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(str)) {
    if (errors) errors[field] = [`${field} must be a valid UUID.`];
    return null;
  }
  return str;
}

export function emailField(value: unknown, field: string, errors?: Record<string, string[]>) {
  const str = stringField(value, field, 3, errors);
  if (!str) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    if (errors) errors[field] = [`${field} must be a valid email.`];
    return null;
  }
  return str;
}

export function urlField(value: unknown, field: string, errors?: Record<string, string[]>) {
  const str = stringField(value, field, 3, errors);
  if (!str) return null;
  try {
    new URL(str);
    return str;
  } catch {
    if (errors) errors[field] = [`${field} must be a valid URL.`];
    return null;
  }
}

export function dateField(value: unknown, field: string, errors?: Record<string, string[]>) {
  const str = stringField(value, field, 8, errors);
  if (!str) return null;
  if (Number.isNaN(Date.parse(str))) {
    if (errors) errors[field] = [`${field} must be a valid date.`];
    return null;
  }
  return str;
}

export function stringArrayField(value: unknown, field: string, errors?: Record<string, string[]>) {
  if (value == null) return [] as string[];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    if (errors) errors[field] = [`${field} must be an array of strings.`];
    return null;
  }
  return value;
}
