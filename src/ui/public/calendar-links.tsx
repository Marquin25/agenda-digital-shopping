"use client";

import { CalendarPlus } from "lucide-react";
import { reportEngagement } from "./report-engagement";

/** "Add to calendar" links; they work without JavaScript, the click report is a bonus. */
export function CalendarLinks({
  eventId,
  icsUrl,
  googleUrl,
}: {
  eventId: string;
  icsUrl: string;
  googleUrl: string;
}) {
  return (
    <>
      <a
        className="button button--lg button--primary-action"
        href={icsUrl}
        onClick={() => reportEngagement(eventId, "calendar_ics")}
      >
        <CalendarPlus size={20} aria-hidden="true" />
        Adicionar à agenda<span className="visually-hidden"> (.ics)</span>
      </a>
      <a
        className="button button--secondary"
        href={googleUrl}
        rel="noopener noreferrer"
        target="_blank"
        onClick={() => reportEngagement(eventId, "calendar_google")}
      >
        Google Agenda<span className="visually-hidden"> (abre em nova aba)</span>
      </a>
    </>
  );
}
