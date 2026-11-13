"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  experienceTemplateInputSchema,
  saveExperienceTemplate,
  setExperienceTemplateActive,
} from "@/application/intelligence/experience-templates";
import { AUDIENCES, OBJECTIVES } from "@/domain/intelligence/experience-catalog";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { fieldErrorsFrom, INVALID_FORM_MESSAGE, type FormState } from "@/ui/admin/form-state";

function readTemplateForm(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");
  const weights = (prefix: string, keys: readonly string[]) =>
    Object.fromEntries(keys.map((k) => [k, String(formData.get(`${prefix}.${k}`) ?? "0")]));
  return {
    name: text("name"),
    description: text("description"),
    objectiveWeights: weights("objective", OBJECTIVES),
    audienceWeights: weights("audience", AUDIENCES),
    segmentIds: formData.getAll("segmentIds").map(String),
    costMin: text("costMin"),
    costMax: text("costMax"),
    minAreaSquareMeters: text("minAreaSquareMeters"),
    minCapacity: text("minCapacity"),
    facilities: text("facilities"),
    durationMinutes: text("durationMinutes"),
    categoryId: text("categoryId"),
    indicators: formData.getAll("indicators").map(String),
    reviewStatus: text("reviewStatus"),
  };
}

export async function saveTemplateAction(
  templateId: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("catalog:manage");
  const parsed = experienceTemplateInputSchema.safeParse(readTemplateForm(formData));
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  const id = await saveExperienceTemplate(await getDb(), admin.id, parsed.data, templateId ?? undefined);
  revalidatePath("/admin/catalogo");
  redirect(`/admin/catalogo/${id}?salvo=1`);
}

export async function toggleTemplateAction(templateId: string, active: boolean) {
  const admin = await requireAdmin("catalog:manage");
  await setExperienceTemplateActive(await getDb(), admin.id, templateId, active);
  revalidatePath("/admin/catalogo");
  redirect(`/admin/catalogo/${templateId}?acao=${active ? "reativado" : "desativado"}`);
}
