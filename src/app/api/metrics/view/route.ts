import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AGENDA_TARGET, eventTarget, recordPageView } from "@/application/metrics/record-metrics";
import { isLikelyBot, resolveTrafficSource, serializeVisitSource } from "@/domain/metrics/traffic-source";
import { toLocalDateKey } from "@/domain/time/time-zone";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { events } from "@/infrastructure/db/schema";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE_SECONDS,
  hashDeviceId,
  isValidDeviceId,
  newDeviceId,
  VISIT_COOKIE,
} from "@/infrastructure/security/device-id";
import { RateLimiter } from "@/infrastructure/security/rate-limiter";
import { isStaffRequest } from "@/infrastructure/web/admin-session";
import { clientIp } from "@/infrastructure/web/request";

const perIp = new RateLimiter(600, 60_000);
const perDevice = new RateLimiter(60, 60_000);
// Requests without a device cookie get a fresh ID, so they are limited per IP instead; otherwise a client
// that drops cookies could mint unlimited "unique devices".
const newDevicesPerIp = new RateLimiter(120, 60_000);

const bodySchema = z.object({
  target: z.enum(["agenda", "event"]),
  eventId: z.uuid().nullable(),
  utmSource: z.string().max(64).nullable(),
  utmCampaign: z.string().max(64).nullable(),
});

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  const jar = await cookies();
  if (isLikelyBot(request.headers.get("user-agent"))) return noContent();
  const ip = clientIp(request.headers);
  if (!perIp.consume(ip)) return new NextResponse(null, { status: 429 });
  // Staff browsing with a valid admin session never counts (docs/spec/03 §1).
  if (await isStaffRequest()) return noContent();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.target === "event" && !parsed.data.eventId)) {
    return new NextResponse(null, { status: 400 });
  }
  const body = parsed.data;
  const db = await getDb();

  if (body.target === "event") {
    const [exists] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, body.eventId!), ne(events.publicationStatus, "draft")))
      .limit(1);
    if (!exists) return noContent();
  }

  const config = getConfig();
  let deviceId = jar.get(DEVICE_COOKIE)?.value;
  const response = noContent();
  if (!isValidDeviceId(deviceId)) {
    if (!newDevicesPerIp.consume(ip)) return new NextResponse(null, { status: 429 });
    deviceId = newDeviceId();
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
    });
  }
  if (!perDevice.consume(deviceId)) return new NextResponse(null, { status: 429 });

  const source = resolveTrafficSource(
    { utmSource: body.utmSource, utmCampaign: body.utmCampaign },
    jar.get(VISIT_COOKIE)?.value ?? null,
  );
  if (source.fromCurrentPage) {
    // Session cookie: the visit's origin is the first page with campaign parameters.
    response.cookies.set(VISIT_COOKIE, serializeVisitSource(source), {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      path: "/",
    });
  }

  await recordPageView(db, {
    targetKey: body.target === "agenda" ? AGENDA_TARGET : eventTarget(body.eventId!),
    eventId: body.target === "event" ? body.eventId : null,
    day: toLocalDateKey(new Date()),
    deviceHash: hashDeviceId(deviceId, config.deviceIdPepper),
    channel: source.channel,
    promoCode: source.promoCode,
  });
  return response;
}
