import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { loadPlanFormOptions } from "../form-options";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Novo planejamento" };
export const dynamic = "force-dynamic";

export default async function NewPlanPage() {
  await requireAdmin("plans:manage");
  const options = await loadPlanFormOptions(await getDb());
  return (
    <>
      <p>
        <Link href="/admin/planejamento">← Planejamento</Link>
      </p>
      <h1>Novo planejamento</h1>
      {options.venues.length === 0 && (
        <p className="notice notice--warning">
          Cadastre um espaço antes de planejar: <Link href="/admin/espacos">Espaços</Link>.
        </p>
      )}
      <PlanForm
        planId={null}
        {...options}
        values={{
          title: "",
          primaryObjective: "",
          secondaryObjectives: [],
          audiences: [],
          interests: "",
          segmentIds: [],
          storeIds: [],
          venueIds: [],
          budgetMin: "",
          budgetMax: "",
          periodStart: "",
          periodEnd: "",
          preferredWeekdays: [],
          timeFrom: "",
          timeTo: "",
        }}
      />
    </>
  );
}
