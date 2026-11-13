"use client";

import { startTransition, useEffect, useRef } from "react";
import type { FormState } from "./form-state";

/**
 * A `<form>` bound to a `useActionState` action that keeps what the person typed when the server
 * answers with validation errors. React 19 clears a `<form action>` after every submission; submitting
 * from `onSubmit` inside a transition avoids that while `useFormStatus` still reports pending.
 * The `action` attribute stays as the no-JavaScript fallback.
 */
export function ActionForm({
  action,
  state,
  resetOnSuccess = false,
  children,
  ...props
}: Omit<React.ComponentProps<"form">, "action" | "onSubmit"> & {
  action: (formData: FormData) => void;
  state: FormState;
  /** Clear the fields after a successful save (forms that create a new item and stay on the page). */
  resetOnSuccess?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.ok) form.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      {...props}
      ref={form}
      action={action}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const formData = new FormData(event.currentTarget, submitter);
        startTransition(() => action(formData));
      }}
    >
      {children}
    </form>
  );
}
