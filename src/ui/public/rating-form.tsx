"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { RatingFormState } from "@/app/(public)/eventos/[slug]/avaliar/actions";
import {
  MAX_COMMENT_LENGTH,
  RATING_SCORES,
  RATING_TAG_LABELS,
  RATING_TAGS,
  SCORE_LABELS,
} from "@/domain/ratings/rating";
import { ActionForm } from "@/ui/admin/action-form";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";

const OUTCOME: Partial<Record<RatingFormState["status"], { tone: "success" | "danger"; text: string }>> = {
  recorded: { tone: "success", text: "Obrigado! Sua avaliação foi registrada." },
  already_rated: { tone: "success", text: "Você já avaliou este evento neste aparelho. Obrigado!" },
  closed: { tone: "danger", text: "O período de avaliação deste evento terminou." },
  not_open: { tone: "danger", text: "A avaliação abre quando o evento terminar." },
  unavailable: { tone: "danger", text: "Este evento não pode ser avaliado." },
  staff: {
    tone: "danger",
    text: "Você está conectado como equipe do shopping: avaliações da equipe não são registradas.",
  },
  rate_limited: { tone: "danger", text: "Muitas tentativas. Tente de novo mais tarde." },
};

const FIELD_LABELS = { score: "Nota", tags: "Destaques", comment: "Comentário" };
/** Announce the character count only near the limit, so screen readers are not flooded. */
const COUNTER_WARNING_AT = MAX_COMMENT_LENGTH - 20;

export function RatingForm({
  slug,
  startedAt,
  action,
}: {
  slug: string;
  /** Server time when the form was rendered (minimum filling time, docs/spec/03 §5). */
  startedAt: number;
  action: (state: RatingFormState, formData: FormData) => Promise<RatingFormState>;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" });
  const [length, setLength] = useState(0);
  const outcome = OUTCOME[state.status];
  const errors = state.fieldErrors ?? {};

  if (state.status === "recorded" || state.status === "already_rated") {
    return (
      <div className="notice notice--success" role="status">
        <p>{outcome!.text}</p>
        <p>
          <Link href="/">Voltar para a agenda</Link>
        </p>
      </div>
    );
  }

  return (
    <ActionForm action={formAction} state={{}} className="rating-form" noValidate>
      {outcome && (
        <div className={`notice notice--${outcome.tone}`} role="alert">
          <p>{outcome.text}</p>
        </div>
      )}
      <FormMessage
        state={{
          message: state.status === "invalid" ? "Revise os campos destacados." : undefined,
          fieldErrors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [`avaliacao-${k}`, v])),
        }}
        labels={Object.fromEntries(Object.entries(FIELD_LABELS).map(([k, v]) => [`avaliacao-${k}`, v]))}
      />
      <input type="hidden" name="evento" value={slug} />
      <input type="hidden" name="inicio" value={startedAt} />
      <div className="rating-form__trap" aria-hidden="true">
        <label htmlFor="avaliacao-site">Deixe este campo em branco</label>
        <input id="avaliacao-site" type="text" name="site" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset
        id="avaliacao-score"
        className="rating-scores"
        {...invalidProps("avaliacao-score", errors.score)}
      >
        <legend>Sua nota (obrigatória)</legend>
        <div className="rating-scores__options">
          {RATING_SCORES.map((score) => (
            <label key={score} className="rating-score">
              <input type="radio" name="nota" value={score} required />
              <span className="rating-score__number">{score}</span>
              <span className="rating-score__label">{SCORE_LABELS[score]}</span>
            </label>
          ))}
        </div>
        <FieldError id="avaliacao-score" message={errors.score} />
      </fieldset>

      <fieldset id="avaliacao-tags" className="rating-tags" {...invalidProps("avaliacao-tags", errors.tags)}>
        <legend>O que se destacou? (opcional)</legend>
        <ul className="choice-list">
          {RATING_TAGS.map((tag) => (
            <li key={tag} className="choice">
              <input type="checkbox" id={`avaliacao-tag-${tag}`} name="tags" value={tag} />
              <span>
                <label htmlFor={`avaliacao-tag-${tag}`}>{RATING_TAG_LABELS[tag]}</label>
              </span>
            </li>
          ))}
        </ul>
        <FieldError id="avaliacao-tags" message={errors.tags} />
      </fieldset>

      <div className="field">
        <label htmlFor="avaliacao-comment">Comentário (opcional)</label>
        <textarea
          id="avaliacao-comment"
          name="comentario"
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          aria-describedby={`avaliacao-comment-ajuda avaliacao-comment-contador${errors.comment ? " avaliacao-comment-erro" : ""}`}
          aria-invalid={errors.comment ? true : undefined}
          onChange={(e) => setLength(e.currentTarget.value.length)}
        />
        <p id="avaliacao-comment-ajuda" className="hint">
          Não escreva dados pessoais (nome, telefone, e-mail). Só a equipe do shopping lê os comentários.
        </p>
        <p
          id="avaliacao-comment-contador"
          className="hint"
          aria-live={length >= COUNTER_WARNING_AT ? "polite" : "off"}
        >
          {length}/{MAX_COMMENT_LENGTH}
        </p>
        <FieldError id="avaliacao-comment" message={errors.comment} />
      </div>

      <SubmitButton>Enviar avaliação</SubmitButton>
    </ActionForm>
  );
}
