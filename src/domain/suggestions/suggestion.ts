/**
 * Suggestions wall (B-29, docs/spec/01 RF13 and docs/spec/04 §`sugestao`): free text up to 500 characters
 * and an optional theme (an event category). Only staff read suggestions; there is no public wall.
 * No automatic analysis of the free text (docs/spec/10 §4): themes are only what the visitor picked.
 */

export const MIN_SUGGESTION_LENGTH = 10;
export const MAX_SUGGESTION_LENGTH = 500;

export const SUGGESTION_STATUSES = ["new", "read", "archived"] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  new: "Nova",
  read: "Lida",
  archived: "Arquivada",
};

export function isSuggestionStatus(value: string): value is SuggestionStatus {
  return (SUGGESTION_STATUSES as readonly string[]).includes(value);
}

export interface SuggestionInput {
  text: string;
  categoryId: number | null;
}

export type SuggestionFormErrors = Partial<Record<"text" | "categoryId", string>>;

export function parseSuggestionForm(form: {
  text: string | undefined;
  categoryId: string | undefined;
}): { ok: true; value: SuggestionInput } | { ok: false; errors: SuggestionFormErrors } {
  const errors: SuggestionFormErrors = {};
  const text = (form.text ?? "").trim();
  if (text.length < MIN_SUGGESTION_LENGTH)
    errors.text = `Escreva sua sugestão com pelo menos ${MIN_SUGGESTION_LENGTH} caracteres.`;
  else if (text.length > MAX_SUGGESTION_LENGTH)
    errors.text = `A sugestão pode ter até ${MAX_SUGGESTION_LENGTH} caracteres.`;
  const rawCategory = form.categoryId ?? "";
  const categoryId = /^[1-9]\d{0,8}$/.test(rawCategory) ? Number(rawCategory) : null;
  if (rawCategory !== "" && categoryId === null) errors.categoryId = "Escolha um tema da lista.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { text, categoryId } };
}
