import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { EventForm } from "../event-form";
import { loadEventFormOptions } from "../form-options";

export const metadata: Metadata = { title: "Novo evento" };

export default async function NewEventPage() {
  await requireAdmin("events:manage");
  const options = await loadEventFormOptions(await getDb());
  return (
    <>
      <p>
        <Link href="/admin/eventos">← Eventos</Link>
      </p>
      <h1>Novo evento</h1>
      {options.venues.length === 0 && (
        <p className="notice notice--warning">
          Cadastre um espaço antes de criar eventos: <Link href="/admin/espacos">Espaços</Link>.
        </p>
      )}
      <EventForm
        eventId={null}
        {...options}
        values={{
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
        }}
      />
    </>
  );
}
