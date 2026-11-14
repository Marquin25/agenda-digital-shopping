"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { planInputSchema, savePlan, setPlanArchived } from "@/application/intelligence/plans";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { fieldErrorsFrom, INVALID_FORM_MESSAGE, type FormState } from "@/ui/admin/form-state";

function readPlanForm(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");
  const list = (name: string) => formData.getAll(name).map(String);
  return {
    title: text("title"),
    primaryObjective: text("primaryObjective"),
    secondaryObjectives: list("secondaryObjectives"),
    audiences: list("audiences"),
    interests: text("interests"),
    segmentIds: list("segmentIds"),
    storeIds: list("storeIds"),
    venueIds: list("venueIds"),
    budgetMin: text("budgetMin"),
    budgetMax: text("budgetMax"),
    periodStart: text("periodStart"),
    periodEnd: text("periodEnd"),
    preferredWeekdays: list("preferredWeekdays"),
    timeFrom: text("timeFrom"),
    timeTo: text("timeTo"),
  };
}

export async function savePlanAction(
  planId: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("plans:manage");
  const parsed = planInputSchema.safeParse(readPlanForm(formData));
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  const id = await savePlan(await getDb(), admin.id, parsed.data, planId ?? undefined);
  revalidatePath("/admin/planejamento");
  redirect(`/admin/planejamento/${id}?salvo=1`);
}

export async function archivePlanAction(planId: string, archived: boolean) {
  const admin = await requireAdmin("plans:manage");
  await setPlanArchived(await getDb(), admin.id, planId, archived);
  revalidatePath("/admin/planejamento");
  redirect(`/admin/planejamento/${planId}?acao=${archived ? "arquivado" : "restaurado"}`);
}
