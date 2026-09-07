"use server";

import { revalidatePath } from "next/cache";
import { contactSchema } from "@/lib/validations/contact";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";

export type ContactFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

function parseContactForm(formData: FormData) {
  return contactSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position"),
    department: formData.get("department"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    preferredContactMethod: formData.get("preferredContactMethod") || undefined,
    notes: formData.get("notes"),
    isPrimary: formData.get("isPrimary") === "on",
  });
}

export async function createContactAction(
  clientId: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "contacts.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseContactForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.$transaction(async (tx) => {
    if (data.isPrimary) {
      await tx.clientContact.updateMany({ where: { clientId, isPrimary: true }, data: { isPrimary: false } });
    }
    const contact = await tx.clientContact.create({
      data: {
        clientId,
        name: data.name,
        position: data.position || null,
        department: data.department || null,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        preferredContactMethod: data.preferredContactMethod || null,
        notes: data.notes || null,
        isPrimary: data.isPrimary ?? false,
      },
    });
    await recordAudit({
      actorId: user.id,
      action: "CONTACT_CREATED",
      entityType: "ClientContact",
      entityId: contact.id,
      clientId,
    });
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function updateContactAction(
  contactId: string,
  clientId: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "contacts.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseContactForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.$transaction(async (tx) => {
    if (data.isPrimary) {
      await tx.clientContact.updateMany({
        where: { clientId, isPrimary: true, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }
    await tx.clientContact.update({
      where: { id: contactId },
      data: {
        name: data.name,
        position: data.position || null,
        department: data.department || null,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        preferredContactMethod: data.preferredContactMethod || null,
        notes: data.notes || null,
        isPrimary: data.isPrimary ?? false,
      },
    });
  });

  await recordAudit({
    actorId: user.id,
    action: "CONTACT_UPDATED",
    entityType: "ClientContact",
    entityId: contactId,
    clientId,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function setPrimaryContactAction(contactId: string, clientId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "contacts.update");

  await prisma.$transaction([
    prisma.clientContact.updateMany({ where: { clientId, isPrimary: true }, data: { isPrimary: false } }),
    prisma.clientContact.update({ where: { id: contactId }, data: { isPrimary: true } }),
  ]);

  await recordAudit({
    actorId: user.id,
    action: "CONTACT_SET_PRIMARY",
    entityType: "ClientContact",
    entityId: contactId,
    clientId,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function archiveContactAction(contactId: string, clientId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "contacts.update");

  await prisma.clientContact.update({
    where: { id: contactId },
    data: { status: "ARCHIVED", isPrimary: false },
  });

  await recordAudit({
    actorId: user.id,
    action: "CONTACT_ARCHIVED",
    entityType: "ClientContact",
    entityId: contactId,
    clientId,
  });

  revalidatePath(`/clients/${clientId}`);
}

export type DeleteContactState = { formError?: string } | undefined;

export async function deleteContactAction(
  contactId: string,
  clientId: string,
  _prevState: DeleteContactState,
  _formData: FormData,
): Promise<DeleteContactState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "contacts.delete");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  await prisma.clientContact.delete({ where: { id: contactId } });

  await recordAudit({
    actorId: user.id,
    action: "CONTACT_DELETED",
    entityType: "ClientContact",
    entityId: contactId,
    clientId,
  });

  revalidatePath(`/clients/${clientId}`);
}
