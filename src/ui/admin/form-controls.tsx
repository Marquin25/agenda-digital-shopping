"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "./form-state";

export function SubmitButton({
  children,
  className = "button",
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
      name={name}
      value={value}
    >
      {children}
    </button>
  );
}

/** Summary at the top of a form; announced and linked to each invalid field. */
export function FormMessage({ state, labels = {} }: { state: FormState; labels?: Record<string, string> }) {
  const errors = Object.entries(state.fieldErrors ?? {});
  if (!state.message && errors.length === 0) return null;
  return (
    <div
      className={`notice ${state.ok ? "notice--success" : "notice--danger"}`}
      role={state.ok ? "status" : "alert"}
    >
      {state.message && <p>{state.message}</p>}
      {errors.length > 0 && (
        <ul>
          {errors.map(([field, message]) => (
            <li key={field}>
              <a href={`#${field}`}>
                {labels[field] ? `${labels[field]}: ` : ""}
                {message}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={`${id}-erro`} className="error">
      {message}
    </span>
  );
}

/** Props wiring an input to its error message for screen readers. */
export function invalidProps(id: string, message?: string) {
  return message ? { "aria-invalid": true as const, "aria-describedby": `${id}-erro` } : {};
}
