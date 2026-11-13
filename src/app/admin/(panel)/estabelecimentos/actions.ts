"use server";

import { revalidatePath } from "next/cache";
import {
  saveSegment,
  saveStore,
  segmentInputSchema,
  setSegmentActive,
  setStoreActive,
  StoreRuleError,
  storeInputSchema,
} from "@/application/catalog/stores";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { fieldErrorsFrom, INVALID_FORM_MESSAGE, type FormState } from "@/ui/admin/form-state";

const PAGE = "/admin/estabelecimentos";

async function runRule(save: () => Promise<unknown>, done: string): Promise<FormState> {
  try {
    await save();
  } catch (error) {
    if (error instanceof StoreRuleError) return { message: error.message };
    throw error;
  }
  revalidatePath(PAGE);
  return { ok: true, message: done };
}

export async function saveSegmentAction(
  segmentId: number | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("stores:manage");
  const parsed = segmentInputSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  const db = await getDb();
  return runRule(
    () => saveSegment(db, admin.id, parsed.data, segmentId ?? undefined),
    segmentId ? "Segmento atualizado." : "Segmento cadastrado.",
  );
}

export async function toggleSegmentAction(segmentId: number, active: boolean) {
  const admin = await requireAdmin("stores:manage");
  await setSegmentActive(await getDb(), admin.id, segmentId, active);
  revalidatePath(PAGE);
}

export async function saveStoreAction(
  storeId: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("stores:manage");
  const parsed = storeInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    segmentId: String(formData.get("segmentId") ?? ""),
    floor: String(formData.get("floor") ?? ""),
  });
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  const db = await getDb();
  return runRule(
    () => saveStore(db, admin.id, parsed.data, storeId ?? undefined),
    storeId ? "Loja atualizada." : "Loja cadastrada.",
  );
}

export async function toggleStoreAction(storeId: string, active: boolean) {
  const admin = await requireAdmin("stores:manage");
  await setStoreActive(await getDb(), admin.id, storeId, active);
  revalidatePath(PAGE);
}
