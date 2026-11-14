import { and, count, desc, eq, gt } from "drizzle-orm";
import { recordAudit } from "@/application/audit";
import {
  SUGGESTION_STATUSES,
  type SuggestionInput,
  type SuggestionStatus,
} from "@/domain/suggestions/suggestion";
import type { Database } from "@/infrastructure/db/client";
import { categories, suggestions } from "@/infrastructure/db/schema";

/** docs/spec/03 §5: 3 suggestions per device in 24 hours, counted in the database. */
export const SUGGESTIONS_PER_DEVICE_PER_DAY = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SubmitSuggestionResult = "recorded" | "invalid_category" | "daily_limit";

export async function submitSuggestion(
  db: Database,
  suggestion: { deviceHash: string; input: SuggestionInput; now?: Date },
): Promise<SubmitSuggestionResult> {
  const now = suggestion.now ?? new Date();
  const { categoryId, text } = suggestion.input;
  if (categoryId !== null) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.active, true)))
      .limit(1);
    if (!category) return "invalid_category";
  }
  const [recent] = await db
    .select({ n: count() })
    .from(suggestions)
    .where(
      and(
        eq(suggestions.deviceHash, suggestion.deviceHash),
        gt(suggestions.createdAt, new Date(now.getTime() - DAY_MS)),
      ),
    );
  if ((recent?.n ?? 0) >= SUGGESTIONS_PER_DEVICE_PER_DAY) return "daily_limit";
  await db
    .insert(suggestions)
    .values({ text, categoryId, deviceHash: suggestion.deviceHash, createdAt: now });
  return "recorded";
}

export interface ListedSuggestion {
  id: string;
  text: string;
  categoryName: string | null;
  status: SuggestionStatus;
  createdAt: Date;
}

/** Staff list (docs/spec/01 RF13): newest first, never with the device hash. */
export async function listSuggestions(
  db: Database,
  filter: { status?: SuggestionStatus; limit?: number },
): Promise<ListedSuggestion[]> {
  return db
    .select({
      id: suggestions.id,
      text: suggestions.text,
      categoryName: categories.name,
      status: suggestions.status,
      createdAt: suggestions.createdAt,
    })
    .from(suggestions)
    .leftJoin(categories, eq(categories.id, suggestions.categoryId))
    .where(filter.status ? eq(suggestions.status, filter.status) : undefined)
    .orderBy(desc(suggestions.createdAt))
    .limit(filter.limit ?? 200);
}

export async function countSuggestionsByStatus(db: Database): Promise<Record<SuggestionStatus, number>> {
  const rows = await db
    .select({ status: suggestions.status, n: count() })
    .from(suggestions)
    .groupBy(suggestions.status);
  const counts = Object.fromEntries(SUGGESTION_STATUSES.map((s) => [s, 0])) as Record<
    SuggestionStatus,
    number
  >;
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

/** Triage (new → read → archived, in any order); audited without the text. */
export async function setSuggestionStatus(
  db: Database,
  userId: string,
  suggestionId: string,
  status: SuggestionStatus,
): Promise<boolean> {
  const updated = await db
    .update(suggestions)
    .set({ status })
    .where(eq(suggestions.id, suggestionId))
    .returning({ id: suggestions.id });
  if (updated.length === 0) return false;
  await recordAudit(db, {
    userId,
    action: "suggestion.status",
    entity: "suggestion",
    entityId: suggestionId,
    details: { status },
  });
  return true;
}
