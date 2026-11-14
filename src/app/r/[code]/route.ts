import { NextResponse } from "next/server";
import { recordPromoLinkHit } from "@/application/metrics/record-metrics";
import { resolvePromoRedirect } from "@/application/promo/promo-links";
import { isLikelyBot } from "@/domain/metrics/traffic-source";
import { toLocalDateKey } from "@/domain/time/time-zone";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { RateLimiter } from "@/infrastructure/security/rate-limiter";
import { isStaffRequest } from "@/infrastructure/web/admin-session";
import { clientIp } from "@/infrastructure/web/request";

const CODE = /^[a-z0-9]{4,16}$/;
// Hits are a measured indicator: beyond this many per IP and minute they still redirect but are not
// counted, so a script cannot inflate a campaign's numbers (a crowd behind one Wi-Fi stays well below).
const countedHitsPerIp = new RateLimiter(120, 60_000);

/** Promo link / promo QR code entry point: counts the hit (measured) and redirects with campaign parameters. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toLowerCase();
  const db = await getDb();
  const redirect = CODE.test(code) ? await resolvePromoRedirect(db, code) : null;
  const target = new URL(redirect?.location ?? "/", request.url);
  if (
    redirect &&
    !isLikelyBot(request.headers.get("user-agent")) &&
    countedHitsPerIp.consume(clientIp(request.headers, getConfig().trustedProxyHops)) &&
    !(await isStaffRequest())
  ) {
    await recordPromoLinkHit(db, redirect.promoLinkId, toLocalDateKey(new Date()));
  }
  return NextResponse.redirect(target, { status: 302, headers: { "cache-control": "no-store" } });
}
