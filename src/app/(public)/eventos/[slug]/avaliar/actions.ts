"use server";

import { headers } from "next/headers";
import { getRatingContext, submitRating } from "@/application/ratings/ratings";
import { isLikelyAutomated } from "@/domain/abuse/automated-submission";
import { parseRatingForm, type RatingFormErrors } from "@/domain/ratings/rating";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { RateLimiter } from "@/infrastructure/security/rate-limiter";
import { isStaffRequest } from "@/infrastructure/web/admin-session";
import { clientIp } from "@/infrastructure/web/request";
import { ensureVisitorDevice } from "@/infrastructure/web/visitor-device";

/** docs/spec/03 §5: 30 public writes per minute and 10 ratings per day per device; new devices per IP. */
const perIp = new RateLimiter(30, 60_000);
const newDevicesPerIp = new RateLimiter(10, 60_000);
const perDevicePerDay = new RateLimiter(10, 24 * 60 * 60 * 1000);

export type RatingFormStatus =
  | "idle"
  | "invalid"
  | "recorded"
  | "already_rated"
  | "not_open"
  | "closed"
  | "unavailable"
  | "staff"
  | "rate_limited";

export interface RatingFormState {
  status: RatingFormStatus;
  fieldErrors?: RatingFormErrors;
}

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
};

export async function submitRatingAction(_: RatingFormState, formData: FormData): Promise<RatingFormState> {
  const db = await getDb();
  const context = await getRatingContext(db, text(formData, "evento") ?? "");
  if (!context) return { status: "unavailable" };
  if (context.state !== "open") return { status: context.state };
  if (await isStaffRequest()) return { status: "staff" };
  // Field errors first: a person who forgot the score in under 3 s must see them, not a false thank-you.
  const parsed = parseRatingForm({
    score: text(formData, "nota"),
    tags: formData.getAll("tags").filter((v): v is string => typeof v === "string"),
    comment: text(formData, "comentario"),
  });
  if (!parsed.ok) return { status: "invalid", fieldErrors: parsed.errors };

  // Valid but suspicious submissions: bots get the same answer as people, so they cannot tell they were dropped (docs/spec/03 §5).
  if (
    isLikelyAutomated({
      honeypot: text(formData, "site"),
      startedAt: text(formData, "inicio"),
      now: Date.now(),
    })
  )
    return { status: "recorded" };

  const ip = clientIp(await headers(), getConfig().trustedProxyHops);
  if (!perIp.consume(ip)) return { status: "rate_limited" };
  const device = await ensureVisitorDevice();
  if (device.isNew && !newDevicesPerIp.consume(ip)) return { status: "rate_limited" };
  if (!perDevicePerDay.consume(device.deviceId)) return { status: "rate_limited" };

  const result = await submitRating(db, {
    eventId: context.eventId,
    deviceHash: device.deviceHash,
    input: parsed.value,
  });
  return { status: result };
}
