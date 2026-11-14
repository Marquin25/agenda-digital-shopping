"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setSuggestionStatus } from "@/application/suggestions/suggestions";
import { SUGGESTION_STATUSES, type SuggestionStatus } from "@/domain/suggestions/suggestion";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";

/** B-29: triage a suggestion (new, read, archived); audited in `setSuggestionStatus`. */
export async function setSuggestionStatusAction(suggestionId: string, status: SuggestionStatus) {
  const admin = await requireAdmin("feedback:moderate");
  const input = z.object({ id: z.uuid(), status: z.enum(SUGGESTION_STATUSES) }).safeParse({
    id: suggestionId,
    status,
  });
  if (!input.success) return;
  await setSuggestionStatus(await getDb(), admin.id, input.data.id, input.data.status);
  revalidatePath("/admin/sugestoes");
}
