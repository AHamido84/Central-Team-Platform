"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pickLocalized } from "@/lib/dynamic-form-shared";
import { isFieldVisible } from "@/lib/dynamic-field-validation";
import type { TemplateFieldType } from "@prisma/client";

export type RenderFieldOption = {
  value: string;
  labelAr: string;
  labelEn: string;
  isActive: boolean;
};

export type RenderField = {
  key: string;
  labelAr: string;
  labelEn: string;
  description?: string | null;
  placeholder?: string | null;
  type: TemplateFieldType;
  required: boolean;
  defaultValue?: string | null;
  options: RenderFieldOption[];
  visibleIfFieldKey?: string | null;
  visibleIfValue?: string | null;
};

export type RenderSection = {
  key: string;
  titleAr: string;
  titleEn: string;
  fields: RenderField[];
};

export type FormValues = Record<string, unknown>;

/**
 * Reusable dynamic form: reads a template version's sections/fields
 * configuration and renders inputs, labels, options, and conditional
 * visibility — the same renderer for every request type, instead of a
 * hardcoded form per category.
 */
export function DynamicFormRenderer({
  sections,
  values,
  onChange,
  errors,
  locale,
  errorLabel,
  disabled,
}: {
  sections: RenderSection[];
  values: FormValues;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  locale: string;
  /** Translates a dynamic-field-validation error code (e.g. "required")
   * into display text — kept as an injected function so this component
   * doesn't own an i18n namespace of its own. */
  errorLabel: (code: string) => string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => {
        const visibleFields = section.fields.filter((field) => isFieldVisible(field, values));
        if (visibleFields.length === 0) return null;
        return (
          <div key={section.key} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">{pickLocalized(section.titleAr, section.titleEn, locale)}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleFields.map((field) => (
                <div
                  key={field.key}
                  className={field.type === "TEXTAREA" ? "flex flex-col gap-2 sm:col-span-2" : "flex flex-col gap-2"}
                >
                  <Label>
                    {pickLocalized(field.labelAr, field.labelEn, locale)}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <DynamicField
                    field={field}
                    value={values[field.key]}
                    onChange={(v) => onChange(field.key, v)}
                    locale={locale}
                    disabled={disabled}
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                  {errors?.[field.key] && (
                    <p className="text-xs font-medium text-destructive">{errorLabel(errors[field.key])}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
  locale,
  disabled,
}: {
  field: RenderField;
  value: unknown;
  onChange: (value: unknown) => void;
  locale: string;
  disabled?: boolean;
}) {
  const activeOptions = field.options.filter((o) => o.isActive);

  switch (field.type) {
    case "TEXTAREA":
      return (
        <Textarea
          value={(value as string) ?? ""}
          placeholder={field.placeholder ?? undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      );
    case "NUMBER":
      return (
        <Input
          type="number"
          value={(value as string) ?? ""}
          placeholder={field.placeholder ?? undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "DECIMAL":
      return (
        <Input
          type="number"
          step="0.01"
          value={(value as string) ?? ""}
          placeholder={field.placeholder ?? undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "DATE":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "DATETIME":
      return (
        <Input
          type="datetime-local"
          value={(value as string) ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "CHECKBOX":
      return (
        <div className="flex items-center pt-1">
          <Checkbox
            checked={Boolean(value)}
            disabled={disabled}
            onCheckedChange={(checked) => onChange(checked)}
          />
        </div>
      );
    case "RADIO":
      return (
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
        >
          {activeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={option.value} />
              {pickLocalized(option.labelAr, option.labelEn, locale)}
            </label>
          ))}
        </RadioGroup>
      );
    case "SELECT":
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v ?? "")}
          disabled={disabled}
          items={Object.fromEntries(
            activeOptions.map((o) => [o.value, pickLocalized(o.labelAr, o.labelEn, locale)]),
          )}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder ?? undefined} />
          </SelectTrigger>
          <SelectContent>
            {activeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {pickLocalized(option.labelAr, option.labelEn, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "MULTI_SELECT": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-3">
          {activeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(option.value)}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...selected, option.value]
                      : selected.filter((v) => v !== option.value),
                  )
                }
              />
              {pickLocalized(option.labelAr, option.labelEn, locale)}
            </label>
          ))}
        </div>
      );
    }
    case "EMAIL":
      return (
        <Input
          type="email"
          value={(value as string) ?? ""}
          placeholder={field.placeholder ?? undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "PHONE":
      return (
        <Input
          type="tel"
          value={(value as string) ?? ""}
          placeholder={field.placeholder ?? undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "URL":
    case "FILE":
      return (
        <Input
          type="url"
          value={(value as string) ?? ""}
          placeholder={field.placeholder ?? "https://..."}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "COLOR":
      return (
        <Input
          type="color"
          className="h-10 w-20 p-1"
          value={(value as string) || "#000000"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "TEXT":
    default:
      return (
        <Input
          type="text"
          value={(value as string) ?? ""}
          placeholder={field.placeholder ?? undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
