import type { TemplateFieldType } from "@prisma/client";

/** The subset of a RequestTemplateField the validator needs — shaped so it
 * works against both the Prisma row and the builder's local draft state. */
export type FieldDef = {
  key: string;
  type: TemplateFieldType;
  required: boolean;
  minValue?: number | null;
  maxValue?: number | null;
  minLength?: number | null;
  maxLength?: number | null;
  visibleIfFieldKey?: string | null;
  visibleIfValue?: string | null;
  options?: { value: string; isActive: boolean }[];
};

export type FieldValues = Record<string, unknown>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

/** A field whose `visibleIf` condition isn't met by the current values is
 * effectively hidden — the spec is explicit that conditional fields must
 * never block submission or store a value when hidden, in both the client
 * form and the server action that's the actual source of truth. */
export function isFieldVisible(field: FieldDef, values: FieldValues): boolean {
  if (!field.visibleIfFieldKey) return true;
  return String(values[field.visibleIfFieldKey] ?? "") === (field.visibleIfValue ?? "");
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

/**
 * Validates a full field-value submission against its field definitions.
 * Returns a map of fieldKey -> translation-key error, empty when valid.
 * Used both by the wizard (inline errors) and by the server action, which
 * is the only one that actually gets trusted.
 */
export function validateFieldValues(
  fields: FieldDef[],
  values: FieldValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!isFieldVisible(field, values)) continue;
    const value = values[field.key];

    if (field.required && isEmpty(value)) {
      errors[field.key] = "required";
      continue;
    }
    if (isEmpty(value)) continue;

    switch (field.type) {
      case "NUMBER":
      case "DECIMAL": {
        const num = Number(value);
        if (Number.isNaN(num)) {
          errors[field.key] = "invalidNumber";
          break;
        }
        if (field.minValue != null && num < field.minValue) errors[field.key] = "minValue";
        if (field.maxValue != null && num > field.maxValue) errors[field.key] = "maxValue";
        break;
      }
      case "EMAIL":
        if (typeof value !== "string" || !EMAIL_RE.test(value)) errors[field.key] = "invalidEmail";
        break;
      case "URL":
      case "FILE":
        if (typeof value !== "string" || !URL_RE.test(value)) errors[field.key] = "invalidUrl";
        break;
      case "DATE":
      case "DATETIME":
        if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
          errors[field.key] = "invalidDate";
        }
        break;
      case "SELECT":
      case "RADIO": {
        const activeValues = (field.options ?? []).filter((o) => o.isActive).map((o) => o.value);
        if (typeof value !== "string" || !activeValues.includes(value)) {
          errors[field.key] = "invalidOption";
        }
        break;
      }
      case "MULTI_SELECT": {
        const activeValues = new Set((field.options ?? []).filter((o) => o.isActive).map((o) => o.value));
        const selected = Array.isArray(value) ? value : [value];
        if (!selected.every((v) => typeof v === "string" && activeValues.has(v))) {
          errors[field.key] = "invalidOption";
        }
        break;
      }
      default:
        break;
    }

    if (errors[field.key]) continue;
    if (typeof value === "string" && field.minLength != null && value.length < field.minLength) {
      errors[field.key] = "minLength";
    }
    if (typeof value === "string" && field.maxLength != null && value.length > field.maxLength) {
      errors[field.key] = "maxLength";
    }
  }

  return errors;
}

/** Strips values for fields that are currently hidden (their `visibleIf`
 * condition isn't met) so a stray value from a previously-visible field can
 * never persist once the user changes the condition away from it. */
export function visibleValuesOnly(fields: FieldDef[], values: FieldValues): FieldValues {
  const result: FieldValues = {};
  for (const field of fields) {
    if (isFieldVisible(field, values) && !isEmpty(values[field.key])) {
      result[field.key] = values[field.key];
    }
  }
  return result;
}
