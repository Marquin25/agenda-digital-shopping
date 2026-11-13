"use server";

import { revalidatePath } from "next/cache";
import { createPromoLink, promoLinkInputSchema, setPromoLinkActive } from "@/application/promo/promo-links";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { fieldErrorsFrom, INVALID_FORM_MESSAGE, type FormState } from "@/ui/admin/form-state";

export async function createPromoLinkAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("promo-links:manage");
  const destination = String(formData.get("destination") ?? "agenda");
  const category = String(formData.get("category") ?? "");
  const input = {
    channel: String(formData.get("channel") ?? ""),
    description: String(formData.get("description") ?? ""),
    eventId: destination === "event" ? String(formData.get("eventId") ?? "") : "",
    agendaQuery:
      destination === "agenda" && category ? new URLSearchParams({ categoria: category }).toString() : "",
  };
  if (destination === "event" && !input.eventId) {
    return { message: INVALID_FORM_MESSAGE, fieldErrors: { eventId: "Escolha o evento de destino." } };
  }
  const parsed = promoLinkInputSchema.safeParse(input);
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  const { code } = await createPromoLink(await getDb(), admin.id, parsed.data);
  revalidatePath("/admin/divulgacao");
  return { ok: true, message: `Link criado: /r/${code}` };
}

export async function togglePromoLinkAction(id: string, active: boolean) {
  const admin = await requireAdmin("promo-links:manage");
  await setPromoLinkActive(await getDb(), admin.id, id, active);
  revalidatePath("/admin/divulgacao");
}
