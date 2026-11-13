import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isPublicEventId } from "@/application/events/event-queries";
import { AGENDA_TARGET, eventTarget, recordPageView } from "@/application/metrics/record-metrics";
import { resolveTrafficSource, serializeVisitSource } from "@/domain/metrics/traffic-source";
import { toLocalDateKey } from "@/domain/time/time-zone";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { VISIT_COOKIE } from "@/infrastructure/security/device-id";
import { openVisitorMetric } from "@/infrastructure/web/visitor-metrics";

const bodySchema = z.object({
  target: z.enum(["agenda", "event"]),
  eventId: z.uuid().nullable(),
  utmSource: z.string().max(64).nullable(),
  utmCampaign: z.string().max(64).nullable(),
});

/** Page view beacon (agenda or event page): estimated unique views, measured page loads and origin. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.target === "event" && !parsed.data.eventId)) {
    return new NextResponse(null, { status: 400 });
  }
  const body = parsed.data;

  const gate = await openVisitorMetric(request);
  if (!gate.accepted) return gate.response;
  const db = await getDb();
  if (body.target === "event" && !(await isPublicEventId(db, body.eventId!))) return gate.response;

  const source = resolveTrafficSource(
    { utmSource: body.utmSource, utmCampaign: body.utmCampaign },
    (await cookies()).get(VISIT_COOKIE)?.value ?? null,
  );
  if (source.fromCurrentPage) {
    // Session cookie: the visit's origin is the first page with campaign parameters.
    gate.response.cookies.set(VISIT_COOKIE, serializeVisitSource(source), {
      httpOnly: true,
      secure: getConfig().isProduction,
      sameSite: "lax",
      path: "/",
    });
  }

  await recordPageView(db, {
    targetKey: body.target === "agenda" ? AGENDA_TARGET : eventTarget(body.eventId!),
    eventId: body.target === "event" ? body.eventId : null,
    day: toLocalDateKey(new Date()),
    deviceHash: gate.deviceHash,
    channel: source.channel,
    promoCode: source.promoCode,
  });
  return gate.response;
}
