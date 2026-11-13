"use client";

import { ActionForm } from "@/ui/admin/action-form";
import { useActionState } from "react";
import { ADMIN_ROLE_LABELS, ADMIN_ROLES, type AdminRole } from "@/domain/auth/permissions";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { createUserAction, updateUserAction } from "./actions";

function RoleSelect({ id, defaultValue, error }: { id: string; defaultValue: string; error?: string }) {
  return (
    <select id={id} name="role" defaultValue={defaultValue} required {...invalidProps(id, error)}>
      <option value="">Escolha…</option>
      {ADMIN_ROLES.map((r) => (
        <option key={r} value={r}>
          {ADMIN_ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

export function NewUserForm() {
  const [state, action] = useActionState<FormState, FormData>(createUserAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <ActionForm action={action} state={state} resetOnSuccess>
      <FormMessage
        state={state}
        labels={{ name: "Nome", email: "E-mail", role: "Perfil", temporaryPassword: "Senha temporária" }}
      />
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Nome *</label>
          <input id="name" name="name" type="text" required {...invalidProps("name", e.name)} />
          <FieldError id="name" message={e.name} />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="off"
            {...invalidProps("email", e.email)}
          />
          <FieldError id="email" message={e.email} />
        </div>
        <div className="field">
          <label htmlFor="role">Perfil *</label>
          <RoleSelect id="role" defaultValue="" error={e.role} />
          <FieldError id="role" message={e.role} />
        </div>
        <div className="field">
          <label htmlFor="temporaryPassword">Senha temporária * (mín. 12 caracteres)</label>
          <input
            id="temporaryPassword"
            name="temporaryPassword"
            type="password"
            autoComplete="new-password"
            required
            {...invalidProps("temporaryPassword", e.temporaryPassword)}
          />
          <FieldError id="temporaryPassword" message={e.temporaryPassword} />
        </div>
      </div>
      <SubmitButton>Criar usuário</SubmitButton>
    </ActionForm>
  );
}

export function EditUserForm({ user }: { user: { id: string; role: AdminRole; active: boolean } }) {
  const [state, action] = useActionState<FormState, FormData>(updateUserAction.bind(null, user.id), {});
  const prefix = `u-${user.id.slice(0, 8)}`;
  return (
    <ActionForm action={action} state={state}>
      <FormMessage state={state} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${prefix}-role`}>Perfil</label>
          <RoleSelect id={`${prefix}-role`} defaultValue={user.role} />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}-pw`}>Nova senha temporária (opcional)</label>
          <input
            id={`${prefix}-pw`}
            name="temporaryPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
          />
        </div>
      </div>
      <div className="checkbox-row">
        <input id={`${prefix}-active`} name="active" type="checkbox" defaultChecked={user.active} />
        <label htmlFor={`${prefix}-active`}>Acesso ativo</label>
      </div>
      <SubmitButton className="button button--secondary">Salvar usuário</SubmitButton>
    </ActionForm>
  );
}
