"use server";

import { revalidatePath } from "next/cache";
import { contractSchema } from "@/lib/validations/contract";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { zodFieldErrors } from "@/lib/form-utils";

export type ContractFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

function parseContractForm(formData: FormData) {
  return contractSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    contractNumber: formData.get("contractNumber"),
    type: formData.get("type"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    value: formData.get("value") || undefined,
    currency: formData.get("currency"),
    paymentTerms: formData.get("paymentTerms"),
    status: formData.get("status"),
    fileUrl: formData.get("fileUrl"),
    notes: formData.get("notes"),
  });
}

export async function createContractAction(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "contracts.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseContractForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const contract = await prisma.contract.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      contractNumber: data.contractNumber || null,
      type: data.type || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      value: data.value,
      currency: data.currency || "SAR",
      paymentTerms: data.paymentTerms || null,
      status: data.status,
      fileUrl: data.fileUrl || null,
      notes: data.notes || null,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "CONTRACT_CREATED",
    entityType: "Contract",
    entityId: contract.id,
    clientId: data.clientId,
  });

  revalidatePath("/contracts");
  revalidatePath(`/clients/${data.clientId}`);
  const locale = await getLocale();
  redirect({ href: `/contracts/${contract.id}`, locale });
}

export async function updateContractAction(
  contractId: string,
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "contracts.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseContractForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      clientId: data.clientId,
      title: data.title,
      contractNumber: data.contractNumber || null,
      type: data.type || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      value: data.value,
      currency: data.currency || "SAR",
      paymentTerms: data.paymentTerms || null,
      status: data.status,
      fileUrl: data.fileUrl || null,
      notes: data.notes || null,
      updatedById: user.id,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "CONTRACT_UPDATED",
    entityType: "Contract",
    entityId: contractId,
    clientId: data.clientId,
  });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath(`/clients/${data.clientId}`);
  const locale = await getLocale();
  redirect({ href: `/contracts/${contractId}`, locale });
}

export async function archiveContractAction(contractId: string, clientId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "contracts.update");

  await prisma.contract.update({
    where: { id: contractId },
    data: { status: "ARCHIVED", updatedById: user.id },
  });

  await recordAudit({
    actorId: user.id,
    action: "CONTRACT_ARCHIVED",
    entityType: "Contract",
    entityId: contractId,
    clientId,
  });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath(`/clients/${clientId}`);
}

export type DeleteContractState = { formError?: string } | undefined;

export async function deleteContractAction(
  contractId: string,
  clientId: string,
  _prevState: DeleteContractState,
  _formData: FormData,
): Promise<DeleteContractState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "contracts.delete");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const dependentProjects = await prisma.project.count({ where: { contractId } });
  if (dependentProjects > 0) {
    return { formError: "hasDependencies" };
  }

  await prisma.contract.delete({ where: { id: contractId } });

  await recordAudit({
    actorId: user.id,
    action: "CONTRACT_DELETED",
    entityType: "Contract",
    entityId: contractId,
    clientId,
  });

  revalidatePath("/contracts");
  const locale = await getLocale();
  redirect({ href: "/contracts", locale });
}
