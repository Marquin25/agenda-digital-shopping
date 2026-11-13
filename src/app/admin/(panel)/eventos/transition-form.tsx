"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { transitionEventAction } from "./actions";

const COPY = {
  publish: { button: "Publicar", className: "button", confirm: null },
  end: { button: "Encerrar evento agora", className: "button button--secondary", confirm: null },
  cancel: {
    button: "Cancelar evento",
    className: "button button--danger",
    confirm: "Confirmo o cancelamento deste evento publicado.",
  },
  delete: {
    button: "Excluir rascunho",
    className: "button button--danger",
    confirm: "Confirmo a exclusão definitiva deste rascunho.",
  },
} as const;

export function TransitionForm({ eventId, transition }: { eventId: string; transition: keyof typeof COPY }) {
  const [state, action] = useActionState<FormState, FormData>(
    transitionEventAction.bind(null, eventId, transition),
    {},
  );
  const copy = COPY[transition];
  return (
    <form action={action}>
      <FormMessage state={state} />
      {copy.confirm && (
        <div className="checkbox-row">
          <input type="checkbox" id={`confirm-${transition}`} name="confirm" value="yes" />
          <label htmlFor={`confirm-${transition}`}>{copy.confirm}</label>
        </div>
      )}
      <SubmitButton className={copy.className}>{copy.button}</SubmitButton>
    </form>
  );
}
