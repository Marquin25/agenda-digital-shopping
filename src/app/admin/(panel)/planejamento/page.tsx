import type { Metadata } from "next";
import Link from "next/link";
import { listPlans } from "@/application/intelligence/plans";
import { OBJECTIVE_LABELS } from "@/domain/intelligence/experience-catalog";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { formatCostRange, formatDateKeyRange, formatDateTime } from "@/ui/format";

export const metadata: Metadata = { title: "Planejamento" };
export const dynamic = "force-dynamic";

export default async function PlansPage() {
  await requireAdmin("plans:manage");
  const plans = await listPlans(await getDb(), { includeArchived: true });
  return (
    <>
      <div className="toolbar">
        <h1>Planejamento</h1>
        <Link className="button" href="/admin/planejamento/novo">
          + Novo planejamento
        </Link>
      </div>
      <p>
        Descreva o que o shopping quer alcançar com os próximos eventos: objetivo, público-alvo, segmentos,
        orçamento, período e espaços. As recomendações usam estes dados.
      </p>
      <ScrollableTable label="Planejamentos">
        <table>
          <caption>{plans.length} planejamento(s)</caption>
          <thead>
            <tr>
              <th scope="col">Planejamento</th>
              <th scope="col">Objetivo principal</th>
              <th scope="col">Período</th>
              <th scope="col">Orçamento</th>
              <th scope="col">Atualizado em</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={5}>Nenhum planejamento cadastrado.</td>
              </tr>
            ) : (
              plans.map((p) => (
                <tr key={p.id}>
                  <th scope="row">
                    <Link href={`/admin/planejamento/${p.id}`}>{p.title}</Link>
                    {p.archived && " (arquivado)"}
                  </th>
                  <td>{OBJECTIVE_LABELS[p.primaryObjective]}</td>
                  <td>{formatDateKeyRange(p.periodStart, p.periodEnd)}</td>
                  <td>{formatCostRange(p.budgetMin, p.budgetMax)}</td>
                  <td>{formatDateTime(p.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTable>
    </>
  );
}
