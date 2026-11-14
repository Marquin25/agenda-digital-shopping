import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlan } from "@/application/intelligence/plans";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { formatDateTime } from "@/ui/format";
import { archivePlanAction } from "../actions";
import { loadPlanFormOptions } from "../form-options";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Planejamento" };
export const dynamic = "force-dynamic";

const ACTION_MESSAGES: Record<string, string> = {
  arquivado: "Planejamento arquivado.",
  restaurado: "Planejamento restaurado.",
};

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; acao?: string }>;
}) {
  await requireAdmin("plans:manage");
  const { id } = await params;
  const flags = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await getDb();
  const plan = await getPlan(db, id);
  if (!plan) notFound();
  const message = flags.salvo ? "Alterações salvas." : flags.acao ? ACTION_MESSAGES[flags.acao] : undefined;
  const ids = {
    segmentIds: plan.segments.map((s) => s.id),
    storeIds: plan.stores.map((s) => s.id),
    venueIds: plan.venues.map((v) => v.id),
  };

  return (
    <>
      <p>
        <Link href="/admin/planejamento">← Planejamento</Link>
      </p>
      <h1>{plan.title}</h1>
      {message && (
        <p className="notice notice--success" role="status">
          {message}
        </p>
      )}
      <p>
        Atualizado em {formatDateTime(plan.updatedAt)}
        {plan.archived && " · arquivado"}
      </p>
      <form action={archivePlanAction.bind(null, plan.id, !plan.archived)} style={{ marginBottom: "1.5rem" }}>
        <button type="submit" className="button button--secondary">
          {plan.archived ? "Restaurar planejamento" : "Arquivar planejamento"}
        </button>
      </form>
      <h2>Dados do planejamento</h2>
      <PlanForm
        planId={plan.id}
        {...await loadPlanFormOptions(db, ids)}
        values={{
          title: plan.title,
          primaryObjective: plan.primaryObjective,
          secondaryObjectives: plan.secondaryObjectives,
          audiences: plan.audiences,
          interests: plan.interests.join(", "),
          segmentIds: ids.segmentIds.map(String),
          storeIds: ids.storeIds,
          venueIds: ids.venueIds,
          budgetMin: String(plan.budgetMin),
          budgetMax: String(plan.budgetMax),
          periodStart: plan.periodStart,
          periodEnd: plan.periodEnd,
          preferredWeekdays: plan.preferredWeekdays.map(String),
          timeFrom: plan.timeFrom ?? "",
          timeTo: plan.timeTo ?? "",
        }}
      />
    </>
  );
}
