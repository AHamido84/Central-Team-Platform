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
    commercialRegistration: formData.get("commercialRegistration"),
    taxNumber: formData.get("taxNumber"),
    industry: formData.get("industry"),
    website: formData.get("website"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    country: formData.get("country"),
    city: formData.get("city"),
    accountManagerId: formData.get("accountManagerId"),
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
  const data = result.data;

  const client = await prisma.client.create({
    data: {
      companyName: data.companyName,
      legalName: data.legalName || null,
      commercialRegistration: data.commercialRegistration || null,
      taxNumber: data.taxNumber || null,
      industry: data.industry || null,
      website: data.website || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      country: data.country || null,
      city: data.city || null,
      accountManagerId: data.accountManagerId || null,
      status: data.status,
      notes: data.notes || null,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "CLIENT_CREATED",
    entityType: "Client",
    entityId: client.id,
    clientId: client.id,
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
  const data = result.data;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      companyName: data.companyName,
      legalName: data.legalName || null,
      commercialRegistration: data.commercialRegistration || null,
      taxNumber: data.taxNumber || null,
      industry: data.industry || null,
      website: data.website || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      country: data.country || null,
      city: data.city || null,
      accountManagerId: data.accountManagerId || null,
      status: data.status,
      notes: data.notes || null,
      updatedById: user.id,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "CLIENT_UPDATED",
    entityType: "Client",
    entityId: clientId,
    clientId,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  const locale = await getLocale();
  redirect({ href: `/clients/${clientId}`, locale });
}

async function countClientDependencies(clientId: string) {
  const [projects, contracts, contacts, requests, users] = await Promise.all([
    prisma.project.count({ where: { clientId } }),
    prisma.contract.count({ where: { clientId } }),
    prisma.clientContact.count({ where: { clientId } }),
    prisma.request.count({ where: { clientId } }),
    prisma.user.count({ where: { clientId } }),
  ]);
  return projects + contracts + contacts + requests + users;
}

export type DeleteClientState = { formError?: string } | undefined;

export async function deleteClientAction(
  clientId: string,
  _prevState: DeleteClientState,
  _formData: FormData,
): Promise<DeleteClientState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "clients.delete");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const dependencyCount = await countClientDependencies(clientId);
  if (dependencyCount > 0) {
    return { formError: "hasDependencies" };
  }

  await prisma.client.delete({ where: { id: clientId } });

  await recordAudit({
    actorId: user.id,
    action: "CLIENT_DELETED",
    entityType: "Client",
    entityId: clientId,
  });

  revalidatePath("/clients");
  const locale = await getLocale();
  redirect({ href: "/clients", locale });
}

export async function archiveClientAction(clientId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "clients.update");

  await prisma.client.update({
    where: { id: clientId },
    data: { status: "ARCHIVED", updatedById: user.id },
  });

  await recordAudit({
    actorId: user.id,
    action: "CLIENT_ARCHIVED",
    entityType: "Client",
    entityId: clientId,
    clientId,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}
