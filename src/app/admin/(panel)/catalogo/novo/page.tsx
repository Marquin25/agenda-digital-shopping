import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { loadTemplateFormOptions } from "../form-options";
import { TemplateForm } from "../template-form";

export const metadata: Metadata = { title: "Novo modelo de experiência" };

export default async function NewTemplatePage() {
  await requireAdmin("catalog:manage");
  return (
    <>
      <p>
        <Link href="/admin/catalogo">← Catálogo de experiências</Link>
      </p>
      <h1>Novo modelo de experiência</h1>
      <TemplateForm
        templateId={null}
        {...await loadTemplateFormOptions(await getDb())}
        values={{
          name: "",
          description: "",
          objectiveWeights: {},
          audienceWeights: {},
          segmentIds: [],
          costMin: "",
          costMax: "",
          minAreaSquareMeters: "",
          minCapacity: "",
          facilities: "",
          durationMinutes: "",
          categoryId: "",
          indicators: [],
          reviewStatus: "draft",
        }}
      />
    </>
  );
}
