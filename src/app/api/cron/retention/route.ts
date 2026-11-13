import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { applyRetention } from "@/application/metrics/retention";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";

export const dynamic = "force-dynamic";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Daily retention job for HTTP schedulers (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`). */
export async function GET(request: Request) {
  const secret = getConfig().cronSecret;
  if (!secret) return new NextResponse(null, { status: 404 });
  const provided = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(digest(provided), digest(`Bearer ${secret}`))) {
    return new NextResponse(null, { status: 401 });
  }
  const result = await applyRetention(await getDb());
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}
