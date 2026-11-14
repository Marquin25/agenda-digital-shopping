"use server";

import { headers } from "next/headers";
import { submitSuggestion } from "@/application/suggestions/suggestions";
import { isLikelyAutomated } from "@/domain/abuse/automated-submission";
import { parseSuggestionForm, type SuggestionFormErrors } from "@/domain/suggestions/suggestion";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { RateLimiter } from "@/infrastructure/security/rate-limiter";
import { isStaffRequest } from "@/infrastructure/web/admin-session";
import { clientIp } from "@/infrastructure/web/request";
import { ensureVisitorDevice } from "@/infrastructure/web/visitor-device";

/** docs/spec/03 §5: 30 public writes per minute per IP and new devices per IP; 3 per device a day in the DB. */
const perIp = new RateLimiter(30, 60_000);
const newDevicesPerIp = new RateLimiter(10, 60_000);

export type SuggestionFormStatus = "idle" | "invalid" | "recorded" | "daily_limit" | "staff" | "rate_limited";

export interface SuggestionFormState {
  status: SuggestionFormStatus;
  fieldErrors?: SuggestionFormErrors;
}

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
};

export async function submitSuggestionAction(
  _: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  if (await isStaffRequest()) return { status: "staff" };
  // Field errors first, so a person who sent too short a text sees them (docs/spec/03 §5).
  const parsed = parseSuggestionForm({
    text: text(formData, "sugestao"),
    categoryId: text(formData, "tema"),
  });
  if (!parsed.ok) return { status: "invalid", fieldErrors: parsed.errors };
  // Valid but suspicious submissions get the same answer people get, without being stored.
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

  const result = await submitSuggestion(await getDb(), {
    deviceHash: device.deviceHash,
    input: parsed.value,
  });
  if (result === "invalid_category")
    return { status: "invalid", fieldErrors: { categoryId: "Escolha um tema da lista." } };
  return { status: result };
}
