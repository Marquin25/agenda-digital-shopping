"use client";

import { useActionState } from "react";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { confirmImportAction, uploadImportAction } from "./actions";

export function UploadForm() {
  const [state, action] = useActionState<FormState, FormData>(uploadImportAction, {});
  const error = state.fieldErrors?.planilha;
  return (
    <form action={action}>
      <FormMessage state={state} labels={{ planilha: "Planilha" }} />
      <div className="field">
        <label htmlFor="planilha">Planilha de eventos (.xlsx ou .csv, até 1 MB)</label>
        <input
          type="file"
          id="planilha"
          name="planilha"
          required
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          {...invalidProps("planilha", error)}
        />
        <FieldError id="planilha" message={error} />
      </div>
      <SubmitButton>Ver prévia</SubmitButton>
    </form>
  );
}

export function ConfirmForm({
  importId,
  fingerprint,
  total,
}: {
  importId: string;
  fingerprint: string;
  total: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(confirmImportAction.bind(null, importId), {});
  return (
    <form action={action}>
      <FormMessage state={state} />
      <input type="hidden" name="fingerprint" value={fingerprint} />
      <SubmitButton>{`Confirmar importação de ${total} evento(s)`}</SubmitButton>
    </form>
  );
}
