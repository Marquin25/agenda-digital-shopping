"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  confirmEventImport,
  discardEventImport,
  previewEventImport,
  stageEventImport,
} from "@/application/events/event-import";
import { IMPORT_LIMITS } from "@/domain/events/event-import";
import { getDb } from "@/infrastructure/db";
import { readSpreadsheet, SpreadsheetError } from "@/infrastructure/spreadsheet/read-spreadsheet";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import type { FormState } from "@/ui/admin/form-state";

const UUID = /^[0-9a-f-]{36}$/;

/** Reads the file on the server and keeps its cells for review; nothing is imported yet. */
export async function uploadImportAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("events:manage");
  const file = formData.get("planilha");
  if (!(file instanceof File) || file.size === 0)
    return { fieldErrors: { planilha: "Escolha uma planilha .xlsx ou .csv." }, message: "Revise o arquivo." };
  if (file.size > IMPORT_LIMITS.maxBytes)
    return { fieldErrors: { planilha: "Envie um arquivo de até 1 MB." }, message: "Revise o arquivo." };

  let sheet: string[][];
  try {
    sheet = await readSpreadsheet(Buffer.from(await file.arrayBuffer()), file.name);
  } catch (error) {
    if (error instanceof SpreadsheetError)
      return { fieldErrors: { planilha: error.message }, message: "Revise o arquivo." };
    throw error;
  }
  const db = await getDb();
  const preview = await previewEventImport(db, sheet);
  if (preview.fileErrors.length > 0) return { message: preview.fileErrors.join(" ") };
  const id = await stageEventImport(db, admin.id, file.name, sheet);
  redirect(`/admin/eventos/importar/${id}`);
}

const CONFIRM_MESSAGES = {
  changed: "Os eventos mudaram desde a revisão. Confira a prévia atualizada e confirme de novo.",
  not_found: "Esta importação não existe mais. Envie a planilha novamente.",
  already_confirmed: "Esta importação já foi confirmada.",
  expired: "A prévia expirou (24 horas). Envie a planilha novamente.",
  nothing_to_import: "Nenhuma linha válida para importar. Corrija a planilha e envie de novo.",
} as const;

export async function confirmImportAction(
  importId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("events:manage");
  if (!UUID.test(importId)) return { message: CONFIRM_MESSAGES.not_found };
  const result = await confirmEventImport(
    await getDb(),
    admin.id,
    importId,
    String(formData.get("fingerprint") ?? ""),
  );
  if (result.status !== "confirmed") return { message: CONFIRM_MESSAGES[result.status] };
  revalidatePath("/");
  redirect(`/admin/eventos/importar/${importId}`);
}

export async function discardImportAction(importId: string): Promise<void> {
  await requireAdmin("events:manage");
  if (UUID.test(importId)) await discardEventImport(await getDb(), importId);
  redirect("/admin/eventos/importar?descartada=1");
}
