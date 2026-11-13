"use server";

import { revalidatePath } from "next/cache";
import { saveVenue, setVenueActive, venueInputSchema } from "@/application/catalog/catalog";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { fieldErrorsFrom, INVALID_FORM_MESSAGE, type FormState } from "@/ui/admin/form-state";

export async function saveVenueAction(
  venueId: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("venues:manage");
  const input = Object.fromEntries(
    ["name", "floor", "reference", "areaSquareMeters", "capacity", "facilities"].map((k) => [
      k,
      String(formData.get(k) ?? ""),
    ]),
  );
  const parsed = venueInputSchema.safeParse(input);
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  await saveVenue(await getDb(), admin.id, parsed.data, venueId ?? undefined);
  revalidatePath("/admin/espacos");
  return { ok: true, message: venueId ? "Espaço atualizado." : "Espaço cadastrado." };
}

export async function toggleVenueAction(venueId: string, active: boolean) {
  const admin = await requireAdmin("venues:manage");
  await setVenueActive(await getDb(), admin.id, venueId, active);
  revalidatePath("/admin/espacos");
}
