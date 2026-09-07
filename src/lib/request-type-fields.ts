import type { ScopeItemCategory } from "@prisma/client";

/**
 * Which dynamic field set a request form shows depends on the selected
 * RequestType's category — a design request asks for dimensions/platform,
 * a video request asks for duration/script, etc. `null` means a generic
 * request with no extra fields beyond title/description.
 */
export type RequestFieldSet = "design" | "video" | "brochure" | "campaign";

const CATEGORY_TO_FIELD_SET: Partial<Record<ScopeItemCategory, RequestFieldSet>> = {
  DESIGN: "design",
  PHOTOGRAPHY: "design",
  VIDEO: "video",
  BROCHURE: "brochure",
  ADVERTISING: "campaign",
  MEDIA_BUYING: "campaign",
  MARKETING_STRATEGY: "campaign",
};

export function fieldSetForCategory(
  category: ScopeItemCategory | null | undefined,
): RequestFieldSet | null {
  if (!category) return null;
  return CATEGORY_TO_FIELD_SET[category] ?? null;
}

type FieldKind = "text" | "textarea" | "number";

export const REQUEST_FIELD_KEYS: Record<RequestFieldSet, { key: string; kind: FieldKind }[]> = {
  design: [
    { key: "dimensions", kind: "text" },
    { key: "platform", kind: "text" },
    { key: "format", kind: "text" },
    { key: "references", kind: "textarea" },
    { key: "brandGuidelines", kind: "text" },
  ],
  video: [
    { key: "duration", kind: "text" },
    { key: "script", kind: "textarea" },
    { key: "voiceOver", kind: "text" },
    { key: "platform", kind: "text" },
    { key: "aspectRatio", kind: "text" },
    { key: "references", kind: "textarea" },
  ],
  brochure: [
    { key: "pages", kind: "number" },
    { key: "size", kind: "text" },
    { key: "language", kind: "text" },
    { key: "content", kind: "textarea" },
    { key: "brandAssets", kind: "text" },
  ],
  campaign: [
    { key: "platform", kind: "text" },
    { key: "objective", kind: "text" },
    { key: "audience", kind: "text" },
    { key: "budget", kind: "text" },
    { key: "duration", kind: "text" },
    { key: "landingPage", kind: "text" },
    { key: "tracking", kind: "text" },
  ],
};

/** Form field name for a dynamic metadata field — namespaced so it never
 * collides with the request's own top-level fields (title, dueDate, ...). */
export function metaFieldName(key: string): string {
  return `meta_${key}`;
}

/** Reads only the fields that belong to the given field set out of the
 * submitted FormData, so a switched request type can never leak stale
 * values from a previously-selected type into Request.metadata. */
export function collectRequestMetadata(
  formData: FormData,
  fieldSet: RequestFieldSet | null,
): Record<string, string> | null {
  if (!fieldSet) return null;
  const entries: [string, string][] = [];
  for (const { key } of REQUEST_FIELD_KEYS[fieldSet]) {
    const value = formData.get(metaFieldName(key));
    if (typeof value === "string" && value.trim()) {
      entries.push([key, value.trim()]);
    }
  }
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}
