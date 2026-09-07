"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { UserPlus } from "lucide-react";
import { inviteTeamMemberAction, type TeamInviteState } from "@/lib/actions/team-actions";
import { optionsToSelectItems } from "@/lib/select-items";

type RoleOption = { id: string; label: string };

export function TeamInviteDialog({ roles }: { roles: RoleOption[] }) {
  const t = useTranslations("team");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<TeamInviteState, FormData>(
    inviteTeamMemberAction,
    undefined,
  );

  const errorFor = (field: string) => {
    const key = state?.errors?.[field];
    return key ? tValidation(key) : undefined;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="size-4" />
            {t("inviteButton")}
          </Button>
        }
      />
      <DialogContent>
        {state?.temporaryPassword ? (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{t("invited.title")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t("invited.description")}</p>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("invited.emailLabel")}</span>
                <span className="font-medium">{state.invitedEmail}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("invited.temporaryPasswordLabel")}</span>
                <span className="font-mono font-medium">{state.temporaryPassword}</span>
              </div>
            </div>
            <p className="text-xs font-medium text-destructive">{t("invited.warning")}</p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                {tCommon("actions.close")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("inviteDialog.title")}</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">{t("inviteDialog.nameLabel")}</Label>
                <Input id="name" name="name" required />
                {errorFor("name") && (
                  <p className="text-xs font-medium text-destructive">{errorFor("name")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t("inviteDialog.emailLabel")}</Label>
                <Input id="email" name="email" type="email" required />
                {errorFor("email") && (
                  <p className="text-xs font-medium text-destructive">{errorFor("email")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("inviteDialog.roleLabel")}</Label>
                <Select name="roleId" defaultValue={roles[0]?.id} items={optionsToSelectItems(roles)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {t("inviteDialog.submit")}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
