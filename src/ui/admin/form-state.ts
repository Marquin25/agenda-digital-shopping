import type { z } from "zod";

/** Result returned by admin server actions to `useActionState`. */
export interface FormState {
  message?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
}

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export const INVALID_FORM_MESSAGE = "Revise os campos destacados.";
