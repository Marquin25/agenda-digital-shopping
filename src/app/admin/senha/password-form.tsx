"use client";

import { useActionState } from "react";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { changePasswordAction } from "./actions";

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="panel">
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="currentPassword">Senha atual</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="newPassword">Nova senha</label>
        <span id="nova-dica" className="hint">
          Pelo menos 12 caracteres. Pode usar uma frase.
        </span>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          aria-describedby="nova-dica"
        />
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirme a nova senha</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          {...invalidProps("confirmPassword", errors.confirmPassword)}
        />
        <FieldError id="confirmPassword" message={errors.confirmPassword} />
      </div>
      <SubmitButton>Salvar nova senha</SubmitButton>
    </form>
  );
}
