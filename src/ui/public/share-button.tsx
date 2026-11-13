"use client";

import { useState } from "react";
import { reportEngagement } from "./report-engagement";

export function ShareButton({ eventId, title, url }: { eventId: string; title: string; url: string }) {
  const [message, setMessage] = useState("");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        reportEngagement(eventId, "share");
        return;
      }
      await navigator.clipboard.writeText(url);
      reportEngagement(eventId, "share");
      setMessage("Link copiado.");
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError")
        setMessage(`Não foi possível compartilhar. Link: ${url}`);
    }
  }

  return (
    <>
      <button type="button" className="button button--secondary" onClick={share}>
        Compartilhar
      </button>
      <span role="status" aria-live="polite" className="hint">
        {message}
      </span>
    </>
  );
}
