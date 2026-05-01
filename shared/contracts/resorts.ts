import { booleanField, failure, isRecord, optionalStringField, stringArrayField, stringField, success, urlField, type ValidationResult } from "./_validation";

export interface Resort {
  id?: string;
  name: string;
  slug: string;
  destination: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  zip?: string | null;
  country: string;
  description: string;
  amenities: string[];
  hero_image_url?: string | null;
  gallery_images: string[];
  active: boolean;
}

export interface ResortFilter {
  destination?: string;
  activeOnly: boolean;
}

export const resortSchema = {
  safeParse(value: unknown): ValidationResult<Resort> {
    if (!isRecord(value)) return failure({ form: ["Invalid resort payload."] });
    const errors: Record<string, string[]> = {};
    const payload: Resort = {
      id: typeof value.id === "string" ? value.id : undefined,
      name: stringField(value.name, "name", 2, errors) ?? "",
      slug: stringField(value.slug, "slug", 2, errors) ?? "",
      destination: stringField(value.destination, "destination", 2, errors) ?? "",
      address_line1: stringField(value.address_line1, "address_line1", 2, errors) ?? "",
      address_line2: optionalStringField(value.address_line2),
      city: stringField(value.city, "city", 2, errors) ?? "",
      state: optionalStringField(value.state),
      zip: optionalStringField(value.zip),
      country: stringField(value.country ?? "US", "country", 2, errors) ?? "US",
      description: stringField(value.description, "description", 20, errors) ?? "",
      amenities: stringArrayField(value.amenities, "amenities", errors) ?? [],
      hero_image_url: value.hero_image_url == null ? null : urlField(value.hero_image_url, "hero_image_url", errors),
      gallery_images: stringArrayField(value.gallery_images, "gallery_images", errors) ?? [],
      active: booleanField(value.active, true),
    };

    if (payload.gallery_images.some((entry) => {
      try { new URL(entry); return false; } catch { return true; }
    })) {
      errors.gallery_images = ["gallery_images must contain valid URLs."];
    }

    return Object.keys(errors).length ? failure(errors) : success(payload);
  },
};

export const resortFilterSchema = {
  safeParse(value: unknown): ValidationResult<ResortFilter> {
    if (!isRecord(value)) return failure({ form: ["Invalid resort filter payload."] });
    return success({
      destination: typeof value.destination === "string" ? value.destination : undefined,
      activeOnly: typeof value.activeOnly === "boolean" ? value.activeOnly : true,
    });
  },
};
