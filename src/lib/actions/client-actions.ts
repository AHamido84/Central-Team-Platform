"use server";

import { revalidatePath } from "next/cache";
import { clientSchema } from "@/lib/validations/client";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { zodFieldErrors } from "@/lib/form-utils";

export type ClientFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    companyName: formData.get("companyName"),
    legalName: formData.get("legalName"),
    industry: formData.get("industry"),
    website: formData.get("website"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

export async function createClientAction(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "clients.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseClientForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }

  const client = await prisma.client.create({
    data: {
      companyName: result.data.companyName,
      legalName: result.data.legalName || null,
      industry: result.data.industry || null,
      website: result.data.website || null,
      email: result.data.email || null,
      phone: result.data.phone || null,
      address: result.data.address || null,
      status: result.data.status,
      notes: result.data.notes || null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "client.created",
    entityType: "Client",
    entityId: client.id,
  });

  revalidatePath("/clients");
  const locale = await getLocale();
  redirect({ href: `/clients/${client.id}`, locale });
}

export async function updateClientAction(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "clients.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseClientForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      companyName: result.data.companyName,
      legalName: result.data.legalName || null,
      industry: result.data.industry || null,
      website: result.data.website || null,
      email: result.data.email || null,
      phone: result.data.phone || null,
      address: result.data.address || null,
      status: result.data.status,
      notes: result.data.notes || null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "client.updated",
    entityType: "Client",
    entityId: clientId,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  const locale = await getLocale();
  redirect({ href: `/clients/${clientId}`, locale });
}

export async function deleteClientAction(clientId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "clients.delete");

  await prisma.client.delete({ where: { id: clientId } });

  await recordAudit({
    actorId: user.id,
    action: "client.deleted",
    entityType: "Client",
    entityId: clientId,
  });

  revalidatePath("/clients");
  const locale = await getLocale();
  redirect({ href: "/clients", locale });
}
