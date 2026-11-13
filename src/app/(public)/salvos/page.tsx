import type { Metadata } from "next";
import { listPublicAgenda } from "@/application/events/event-queries";
import { parseAgendaFilters } from "@/domain/agenda/agenda-filters";
import { getDb } from "@/infrastructure/db";
import { SavedEventsList } from "@/ui/public/saved-events-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Eventos salvos", robots: { index: false } };

export default async function SavedEventsPage() {
  // The saved list lives in the browser, so the server sends every upcoming public event and the
  // client keeps only the saved ones; the server never learns what was saved.
  const events = await listPublicAgenda(await getDb(), parseAgendaFilters(new URLSearchParams()), new Date());
  return (
    <>
      <div className="page-intro">
        <h1>Eventos salvos</h1>
        <p>Ficam guardados só neste aparelho, sem cadastro.</p>
      </div>
      <SavedEventsList events={events} />
    </>
  );
}
