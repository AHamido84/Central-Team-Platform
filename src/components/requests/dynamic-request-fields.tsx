"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  REQUEST_FIELD_KEYS,
  metaFieldName,
  type RequestFieldSet,
} from "@/lib/request-type-fields";

/** Renders the request-type-specific fields (dimensions/platform for a
 * design request, duration/script for video, ...) selected by
 * `fieldSetForCategory`. Renders nothing for a generic request type. */
export function DynamicRequestFields({ fieldSet }: { fieldSet: RequestFieldSet | null }) {
  const t = useTranslations("requests.typeFields");

  if (!fieldSet) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {REQUEST_FIELD_KEYS[fieldSet].map(({ key, kind }) =>
          kind === "textarea" ? null : (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={metaFieldName(key)}>{t(`${fieldSet}.${key}`)}</Label>
              <Input id={metaFieldName(key)} name={metaFieldName(key)} type={kind === "number" ? "number" : "text"} />
            </div>
          ),
        )}
      </div>
      {REQUEST_FIELD_KEYS[fieldSet]
        .filter((f) => f.kind === "textarea")
        .map(({ key }) => (
          <div key={key} className="flex flex-col gap-2">
            <Label htmlFor={metaFieldName(key)}>{t(`${fieldSet}.${key}`)}</Label>
            <Textarea id={metaFieldName(key)} name={metaFieldName(key)} rows={3} />
          </div>
        ))}
    </div>
  );
}
