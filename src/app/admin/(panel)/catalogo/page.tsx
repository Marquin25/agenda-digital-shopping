import type { Metadata } from "next";
import Link from "next/link";
import { listExperienceTemplates } from "@/application/intelligence/experience-templates";
import { OBJECTIVE_LABELS, rankWeights } from "@/domain/intelligence/experience-catalog";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { ScrollableTable } from "@/ui/admin/scrollable-table";
import { formatCostRange, formatDateTime, formatDuration } from "@/ui/format";
import { ReviewBadge } from "./review-badge";

export const metadata: Metadata = { title: "Catálogo de experiências" };
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  await requireAdmin("catalog:manage");
  const templates = await listExperienceTemplates(await getDb(), { includeInactive: true });
  const drafts = templates.filter((t) => t.reviewStatus === "draft").length;
  return (
    <>
      <div className="toolbar">
        <h1>Catálogo de experiências</h1>
        <Link className="button" href="/admin/catalogo/novo">
          + Novo modelo
        </Link>
      </div>
      <p>
        Ideias de evento usadas pelas recomendações. Custos e públicos são informados pela equipe e não são
        previsões.
      </p>
      {drafts > 0 && (
        <p className="notice notice--warning">
          {drafts === 1 ? "1 modelo está" : `${drafts} modelos estão`} como rascunho para revisão. Revise o
          conteúdo antes de usá-los em decisões.
        </p>
      )}
      <ScrollableTable label="Modelos de experiência">
        <table>
          <caption>{templates.length} modelo(s)</caption>
          <thead>
            <tr>
              <th scope="col">Modelo</th>
              <th scope="col">Objetivos principais</th>
              <th scope="col">Faixa de custo</th>
              <th scope="col">Duração</th>
              <th scope="col">Situação</th>
              <th scope="col">Atualizado em</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhum modelo cadastrado.</td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id}>
                  <th scope="row">
                    <Link href={`/admin/catalogo/${t.id}`}>{t.name}</Link>
                    {!t.active && " (inativo)"}
                    {t.segments.length > 0 && <small>{t.segments.map((s) => s.name).join(", ")}</small>}
                  </th>
                  <td>
                    {rankWeights(t.objectiveWeights, OBJECTIVE_LABELS)
                      .slice(0, 2)
                      .map((w) => w.label)
                      .join(", ")}
                  </td>
                  <td>{formatCostRange(t.costMin, t.costMax)}</td>
                  <td>{formatDuration(t.durationMinutes)}</td>
                  <td>
                    <ReviewBadge status={t.reviewStatus} />
                  </td>
                  <td>{formatDateTime(t.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTable>
    </>
  );
}
