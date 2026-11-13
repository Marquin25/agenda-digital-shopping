"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="panel">
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton>Entrar</SubmitButton>
      <p className="hint">Esqueceu a senha? Fale com o administrador do sistema.</p>
    </form>
  );
}
