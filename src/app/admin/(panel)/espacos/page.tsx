import type { Metadata } from "next";
import { listVenues } from "@/application/catalog/catalog";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { toggleVenueAction } from "./actions";
import { VenueForm } from "./venue-form";

export const metadata: Metadata = { title: "Espaços" };
export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  await requireAdmin("venues:manage");
  const venues = await listVenues(await getDb(), { includeInactive: true });
  return (
    <>
      <h1>Espaços</h1>
      <section className="panel" aria-labelledby="novo-espaco" style={{ marginBottom: "1.5rem" }}>
        <h2 id="novo-espaco">Novo espaço</h2>
        <VenueForm
          venueId={null}
          idPrefix="novo"
          values={{ name: "", floor: "", reference: "", areaSquareMeters: "", capacity: "", facilities: "" }}
        />
      </section>
      <h2>Espaços cadastrados ({venues.length})</h2>
      {venues.length === 0 && <p>Nenhum espaço cadastrado.</p>}
      {venues.map((v) => (
        <details key={v.id} className="panel" style={{ marginBottom: "0.75rem" }}>
          <summary>
            <strong>{[v.floor, v.name].filter(Boolean).join(" · ")}</strong>
            {!v.active && " (inativo)"}
          </summary>
          <VenueForm
            venueId={v.id}
            idPrefix={`v-${v.id.slice(0, 8)}`}
            values={{
              name: v.name,
              floor: v.floor,
              reference: v.reference,
              areaSquareMeters: v.areaSquareMeters?.toString() ?? "",
              capacity: v.capacity?.toString() ?? "",
              facilities: v.facilities.join(", "),
            }}
          />
          <form action={toggleVenueAction.bind(null, v.id, !v.active)} style={{ marginTop: "0.75rem" }}>
            <button type="submit" className="button button--secondary">
              {v.active ? "Desativar espaço" : "Reativar espaço"}
            </button>
          </form>
        </details>
      ))}
    </>
  );
}
