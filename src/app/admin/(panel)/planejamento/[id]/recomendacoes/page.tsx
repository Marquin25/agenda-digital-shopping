import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listStores } from "@/application/catalog/stores";
import { getPlan } from "@/application/intelligence/plans";
import {
  getRecommendationRun,
  listRecommendationRuns,
  type Recommendation,
} from "@/application/intelligence/recommendations";
import { can } from "@/domain/auth/permissions";
import { OBJECTIVE_LABELS } from "@/domain/intelligence/experience-catalog";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { RecommendationList } from "@/ui/admin/recommendation-list";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { formatCostRange, formatDateKeyRange, formatDateTime } from "@/ui/format";

export const metadata: Metadata = { title: "Recomendações" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/;

export default async function RecommendationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ execucao?: string }>;
}) {
  const admin = await requireAdmin("plans:manage");
  const { id } = await params;
  const { execucao } = await searchParams;
  if (!UUID.test(id)) notFound();
  const db = await getDb();
  const plan = await getPlan(db, id);
  if (!plan) notFound();

  const runs = await listRecommendationRuns(db, plan.id);
  const selectedId = execucao && UUID.test(execucao) ? execucao : runs[0]?.id;
  const run = selectedId ? await getRecommendationRun(db, selectedId) : null;
  const shown = run && run.planId === plan.id ? run : null;
  const stores = shown ? await listStores(db) : [];
  const venueNames = Object.fromEntries(plan.venues.map((v) => [v.id, v.name]));
  const createEventHref = can(admin.role, "events:manage")
    ? (r: Recommendation) => {
        const query = new URLSearchParams({ planejamento: plan.id, modelo: r.templateId });
        if (r.compatibleVenueIds[0]) query.set("espaco", r.compatibleVenueIds[0]);
        return `/admin/eventos/novo?${query}`;
      }
    : null;

  return (
    <>
      <p>
        <Link href={`/admin/planejamento/${plan.id}`}>← {plan.title}</Link>
      </p>
      <h1>Recomendações</h1>
      <p>
        {OBJECTIVE_LABELS[plan.primaryObjective]} · {formatDateKeyRange(plan.periodStart, plan.periodEnd)} ·{" "}
        {formatCostRange(plan.budgetMin, plan.budgetMax)}
      </p>
      <p className="notice" role="status">
        A geração de recomendações será ligada quando o motor de regras (B-40) for integrado. As execuções
        registradas aparecem abaixo.
      </p>

      {shown ? (
        <section aria-labelledby="run-heading">
          <h2 id="run-heading">Execução de {formatDateTime(shown.createdAt)}</h2>
          <p className="hint">
            Regras {shown.rulesVersion} · pesos: objetivo {shown.weights.objective}, público{" "}
            {shown.weights.audience}, segmento {shown.weights.segment}, histórico {shown.weights.history}
            {shown.createdBy && ` · gerada por ${shown.createdBy}`}
          </p>
          <RecommendationList
            result={shown.result}
            venueNames={venueNames}
            stores={stores}
            createEventHref={createEventHref}
          />
        </section>
      ) : (
        <p className="empty-state">Nenhuma recomendação gerada para este planejamento.</p>
      )}

      {runs.length > 0 && (
        <section aria-labelledby="runs-heading">
          <h2 id="runs-heading">Execuções registradas</h2>
          <ScrollableTable label="Execuções registradas">
            <table>
              <caption>{runs.length} execução(ões), da mais recente para a mais antiga</caption>
              <thead>
                <tr>
                  <th scope="col">Gerada em</th>
                  <th scope="col">Por</th>
                  <th scope="col">Versão das regras</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <Link
                        href={`/admin/planejamento/${plan.id}/recomendacoes?execucao=${r.id}`}
                        aria-current={r.id === shown?.id ? "true" : undefined}
                      >
                        {formatDateTime(r.createdAt)}
                      </Link>
                    </th>
                    <td>{r.createdBy ?? "Conta removida"}</td>
                    <td>{r.rulesVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
        </section>
      )}
    </>
  );
}
