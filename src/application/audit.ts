import type { Database } from "@/infrastructure/db/client";
import { auditLog } from "@/infrastructure/db/schema";

export interface AuditEntry {
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  /** Never put personal data or secrets here. */
  details?: Record<string, unknown>;
}

export async function recordAudit(db: Database, entry: AuditEntry): Promise<void> {
  await db.insert(auditLog).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    details: entry.details ?? {},
  });
}
