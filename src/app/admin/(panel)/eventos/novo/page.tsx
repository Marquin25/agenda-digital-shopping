import type { Metadata } from "next";
import Link from "next/link";
import { getIdeaEventDraft, type IdeaEventDraft } from "@/application/intelligence/recommendations";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { formatDateKeyRange } from "@/ui/format";
import { EventForm, type EventFormValues } from "../event-form";
import { loadEventFormOptions } from "../form-options";

export const metadata: Metadata = { title: "Novo evento" };

const UUID = /^[0-9a-f-]{36}$/;

const EMPTY: EventFormValues = {
  title: "",
  description: "",
  startsAt: "",
  endsAt: "",
  venueId: "",
  locationDetail: "",
  categoryId: "",
  featureIds: [],
  storeIds: [],
  admissionInfo: "",
  capacityMode: "unlimited",
  displayedCapacity: "",
  bannerAlt: "",
  bannerUrl: null,
};

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ planejamento?: string; modelo?: string; espaco?: string }>;
}) {
  await requireAdmin("events:manage");
  const { planejamento, modelo, espaco } = await searchParams;
  const db = await getDb();
  const options = await loadEventFormOptions(db);
  const idea: IdeaEventDraft | null =
    planejamento && modelo && UUID.test(planejamento) && UUID.test(modelo)
      ? await getIdeaEventDraft(db, { planId: planejamento, templateId: modelo, venueId: espaco })
      : null;

  return (
    <>
      <p>
        <Link href="/admin/eventos">← Eventos</Link>
      </p>
      <h1>Novo evento</h1>
      {idea && (
        <p className="notice" role="status">
          Evento a partir da ideia “{idea.template.name}” do planejamento{" "}
          <Link href={`/admin/planejamento/${idea.plan.id}`}>{idea.plan.title}</Link>. Escolha as datas dentro
          do período planejado ({formatDateKeyRange(idea.plan.periodStart, idea.plan.periodEnd)}) e revise os
          dados antes de salvar.
        </p>
      )}
      {options.venues.length === 0 && (
        <p className="notice notice--warning">
          Cadastre um espaço antes de criar eventos: <Link href="/admin/espacos">Espaços</Link>.
        </p>
      )}
      <EventForm eventId={null} {...options} values={idea ? { ...EMPTY, ...idea.values } : EMPTY} />
    </>
  );
}
