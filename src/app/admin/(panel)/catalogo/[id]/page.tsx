import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExperienceTemplate } from "@/application/intelligence/experience-templates";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { formatCostRange, formatDateTime, formatDuration } from "@/ui/format";
import { toggleTemplateAction } from "../actions";
import { loadTemplateFormOptions } from "../form-options";
import { ReviewBadge } from "../review-badge";
import { TemplateForm } from "../template-form";

export const metadata: Metadata = { title: "Modelo de experiência" };
export const dynamic = "force-dynamic";

const ACTION_MESSAGES: Record<string, string> = {
  desativado: "Modelo desativado: ele não será usado nas recomendações.",
  reativado: "Modelo reativado.",
};

export default async function TemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; acao?: string }>;
}) {
  await requireAdmin("catalog:manage");
  const { id } = await params;
  const flags = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await getDb();
  const template = await getExperienceTemplate(db, id);
  if (!template) notFound();
  const message = flags.salvo ? "Alterações salvas." : flags.acao ? ACTION_MESSAGES[flags.acao] : undefined;

  return (
    <>
      <p>
        <Link href="/admin/catalogo">← Catálogo de experiências</Link>
      </p>
      <div className="toolbar">
        <h1>{template.name}</h1>
        <ReviewBadge status={template.reviewStatus} />
      </div>
      {message && (
        <p className="notice notice--success" role="status">
          {message}
        </p>
      )}
      <dl className="template-facts">
        <div>
          <dt>Atualizado em</dt>
          <dd>{formatDateTime(template.updatedAt)}</dd>
        </div>
        <div>
          <dt>Faixa de custo informada</dt>
          <dd>{formatCostRange(template.costMin, template.costMax)}</dd>
        </div>
        <div>
          <dt>Duração típica</dt>
          <dd>{formatDuration(template.durationMinutes)}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>{template.active ? "Ativo" : "Inativo"}</dd>
        </div>
      </dl>
      <form
        action={toggleTemplateAction.bind(null, template.id, !template.active)}
        style={{ marginBottom: "1.5rem" }}
      >
        <button type="submit" className="button button--secondary">
          {template.active ? "Desativar modelo" : "Reativar modelo"}
        </button>
      </form>
      <h2>Dados do modelo</h2>
      <TemplateForm
        templateId={template.id}
        {...await loadTemplateFormOptions(
          db,
          template.segments.map((s) => s.id),
        )}
        values={{
          name: template.name,
          description: template.description,
          objectiveWeights: template.objectiveWeights,
          audienceWeights: template.audienceWeights,
          segmentIds: template.segments.map((s) => s.id),
          costMin: String(template.costMin),
          costMax: String(template.costMax),
          minAreaSquareMeters: template.minAreaSquareMeters?.toString() ?? "",
          minCapacity: template.minCapacity?.toString() ?? "",
          facilities: template.facilities.join(", "),
          durationMinutes: String(template.durationMinutes),
          categoryId: template.categoryId ? String(template.categoryId) : "",
          indicators: template.indicators,
          reviewStatus: template.reviewStatus,
        }}
      />
    </>
  );
}
