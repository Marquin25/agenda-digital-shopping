"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { SuggestionFormState } from "@/app/(public)/sugerir/actions";
import { MAX_SUGGESTION_LENGTH } from "@/domain/suggestions/suggestion";
import { ActionForm } from "@/ui/admin/action-form";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";

const REFUSED: Partial<Record<SuggestionFormState["status"], string>> = {
  daily_limit: "Você já enviou 3 sugestões nas últimas 24 horas. Tente de novo amanhã.",
  staff: "Você está conectado como equipe do shopping: sugestões da equipe não são registradas.",
  rate_limited: "Muitas tentativas. Tente de novo mais tarde.",
};

const FIELD_LABELS = { "sugestao-text": "Sua sugestão", "sugestao-categoryId": "Tema" };
/** Announce the character count only near the limit, so screen readers are not flooded. */
const COUNTER_WARNING_AT = MAX_SUGGESTION_LENGTH - 30;

export function SuggestionForm({
  categories,
  startedAt,
  action,
}: {
  categories: { id: number; name: string }[];
  /** Server time when the form was rendered (minimum filling time, docs/spec/03 §5). */
  startedAt: number;
  action: (state: SuggestionFormState, formData: FormData) => Promise<SuggestionFormState>;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" });
  const [length, setLength] = useState(0);
  const errors = state.fieldErrors ?? {};
  const refused = REFUSED[state.status];

  if (state.status === "recorded") {
    return (
      <div className="notice notice--success" role="status">
        <p>Obrigado! Sua sugestão foi enviada para a equipe do shopping.</p>
        <p>
          <Link href="/">Voltar para a agenda</Link>
        </p>
      </div>
    );
  }

  return (
    <ActionForm action={formAction} state={{}} className="rating-form" noValidate>
      {refused && (
        <div className="notice notice--danger" role="alert">
          <p>{refused}</p>
        </div>
      )}
      <FormMessage
        state={{
          message: state.status === "invalid" ? "Revise os campos destacados." : undefined,
          fieldErrors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [`sugestao-${k}`, v])),
        }}
        labels={FIELD_LABELS}
      />
      <input type="hidden" name="inicio" value={startedAt} />
      <div className="rating-form__trap" aria-hidden="true">
        <label htmlFor="sugestao-site">Deixe este campo em branco</label>
        <input id="sugestao-site" type="text" name="site" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="sugestao-text">Sua sugestão *</label>
        <textarea
          id="sugestao-text"
          name="sugestao"
          rows={5}
          required
          maxLength={MAX_SUGGESTION_LENGTH}
          aria-describedby={`sugestao-text-ajuda sugestao-text-contador${errors.text ? " sugestao-text-erro" : ""}`}
          aria-invalid={errors.text ? true : undefined}
          onChange={(e) => setLength(e.currentTarget.value.length)}
        />
        <p id="sugestao-text-ajuda" className="hint">
          De 10 a {MAX_SUGGESTION_LENGTH} caracteres. Não escreva dados pessoais (nome, telefone, e-mail).
        </p>
        <p
          id="sugestao-text-contador"
          className="hint"
          aria-live={length >= COUNTER_WARNING_AT ? "polite" : "off"}
        >
          {length}/{MAX_SUGGESTION_LENGTH}
        </p>
        <FieldError id="sugestao-text" message={errors.text} />
      </div>

      <div className="field">
        <label htmlFor="sugestao-categoryId">Tema (opcional)</label>
        <select
          id="sugestao-categoryId"
          name="tema"
          defaultValue=""
          {...invalidProps("sugestao-categoryId", errors.categoryId)}
        >
          <option value="">Sem tema</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError id="sugestao-categoryId" message={errors.categoryId} />
      </div>

      <SubmitButton>Enviar sugestão</SubmitButton>
    </ActionForm>
  );
}
