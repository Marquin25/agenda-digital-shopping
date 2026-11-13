import { NextResponse } from "next/server";
import { recordPromoLinkHit } from "@/application/metrics/record-metrics";
import { resolvePromoRedirect } from "@/application/promo/promo-links";
import { isLikelyBot } from "@/domain/metrics/traffic-source";
import { toLocalDateKey } from "@/domain/time/time-zone";
import { getDb } from "@/infrastructure/db";
import { isStaffRequest } from "@/infrastructure/web/admin-session";

const CODE = /^[a-z0-9]{4,16}$/;

/** Promo link / promo QR code entry point: counts the hit (measured) and redirects with campaign parameters. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toLowerCase();
  const db = await getDb();
  const redirect = CODE.test(code) ? await resolvePromoRedirect(db, code) : null;
  const target = new URL(redirect?.location ?? "/", request.url);
  if (redirect && !isLikelyBot(request.headers.get("user-agent")) && !(await isStaffRequest())) {
    await recordPromoLinkHit(db, redirect.promoLinkId, toLocalDateKey(new Date()));
  }
  return NextResponse.redirect(target, { status: 302, headers: { "cache-control": "no-store" } });
}
