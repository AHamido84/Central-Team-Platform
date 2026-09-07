"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileAction, type SettingsFormState } from "@/lib/actions/settings-actions";

export function ProfileForm({ name, locale }: { name: string; locale: string }) {
  const t = useTranslations("settings.profile");
  const tLanguage = useTranslations("common.language");
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(
    updateProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" name="name" defaultValue={name} required />
        {state?.errors?.name && (
          <p className="text-xs font-medium text-destructive">{state.errors.name}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t("localeLabel")}</Label>
        <Select
          name="locale"
          defaultValue={locale}
          items={{ ar: tLanguage("ar"), en: tLanguage("en") }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ar">{tLanguage("ar")}</SelectItem>
            <SelectItem value="en">{tLanguage("en")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
