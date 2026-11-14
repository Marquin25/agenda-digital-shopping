"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setRatingHidden } from "@/application/ratings/ratings";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";

/** B-28: hide or show a rating again; audited in `setRatingHidden`. */
export async function setRatingHiddenAction(ratingId: string, hidden: boolean) {
  const admin = await requireAdmin("feedback:moderate");
  const id = z.uuid().safeParse(ratingId);
  if (!id.success) return;
  await setRatingHidden(await getDb(), admin.id, id.data, hidden);
  revalidatePath("/admin/avaliacoes");
}
