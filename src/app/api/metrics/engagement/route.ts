import { NextResponse } from "next/server";
import { z } from "zod";
import { isPublicEventId } from "@/application/events/event-queries";
import { recordEngagement } from "@/application/metrics/record-metrics";
import { ENGAGEMENT_ACTIONS } from "@/domain/metrics/engagement";
import { toLocalDateKey } from "@/domain/time/time-zone";
import { getDb } from "@/infrastructure/db";
import { openVisitorMetric } from "@/infrastructure/web/visitor-metrics";

const bodySchema = z.object({ eventId: z.uuid(), action: z.enum(ENGAGEMENT_ACTIONS) });

/** Share and "add to calendar" clicks (estimated; they measure intent, not completion). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const gate = await openVisitorMetric(request);
  if (!gate.accepted) return gate.response;
  const db = await getDb();
  if (await isPublicEventId(db, parsed.data.eventId)) {
    await recordEngagement(db, {
      ...parsed.data,
      deviceHash: gate.deviceHash,
      day: toLocalDateKey(new Date()),
    });
  }
  return gate.response;
}
