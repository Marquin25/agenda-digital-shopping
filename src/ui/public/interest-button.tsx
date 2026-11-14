"use client";

import { Star } from "lucide-react";
import { useActionState } from "react";
import type { InterestState } from "@/app/(public)/eventos/[slug]/interest-actions";

const MESSAGES: Partial<Record<InterestState["status"], string>> = {
  on: "Interesse registrado. Isso não reserva vaga.",
  off: "Interesse removido.",
  unavailable: "Não é mais possível marcar interesse neste evento.",
  staff: "Você está conectado como equipe do shopping: o interesse da equipe não é contado.",
  rate_limited: "Muitas tentativas. Tente de novo mais tarde.",
};

/**
 * "Tenho interesse" (B-20): a toggle (`aria-pressed`) that tells the mall how many people are
 * interested. Never a reservation. The result is announced without moving focus (docs/spec/06).
 */
export function InterestButton({
  eventId,
  initiallyInterested,
  action,
}: {
  eventId: string;
  initiallyInterested: boolean;
  action: (state: InterestState, formData: FormData) => Promise<InterestState>;
}) {
  const initial: InterestState = { interested: initiallyInterested, status: "idle" };
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="interest">
      <input type="hidden" name="evento" value={eventId} />
      <input type="hidden" name="interesse" value={state.interested ? "nao" : "sim"} />
      <button
        type="submit"
        className={state.interested ? "button" : "button button--secondary"}
        aria-pressed={state.interested}
        disabled={pending}
      >
        <Star size={18} aria-hidden="true" fill={state.interested ? "currentColor" : "none"} />
        Tenho interesse
      </button>
      <p className="hint interest__hint">
        Avisa o shopping que você quer ir. <strong>Não reserva vaga.</strong>
      </p>
      <p role="status" className="hint interest__status">
        {MESSAGES[state.status] ?? ""}
      </p>
    </form>
  );
}
