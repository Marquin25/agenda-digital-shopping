"use server";

import { headers } from "next/headers";
import { setInterest } from "@/application/interests/interests";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { RateLimiter } from "@/infrastructure/security/rate-limiter";
import { isStaffRequest } from "@/infrastructure/web/admin-session";
import { clientIp } from "@/infrastructure/web/request";
import { ensureVisitorDevice } from "@/infrastructure/web/visitor-device";

/** docs/spec/03 §5: 30 public writes per minute per IP, new devices per IP, 60 toggles a day per device. */
const perIp = new RateLimiter(30, 60_000);
const newDevicesPerIp = new RateLimiter(10, 60_000);
const perDevicePerDay = new RateLimiter(60, 24 * 60 * 60 * 1000);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface InterestState {
  interested: boolean;
  status: "idle" | "on" | "off" | "unavailable" | "staff" | "rate_limited";
}

/** B-20: "Tenho interesse" toggle. Works without JavaScript (plain form post). */
export async function toggleInterestAction(state: InterestState, formData: FormData): Promise<InterestState> {
  const eventId = formData.get("evento");
  const interested = formData.get("interesse") === "sim";
  if (typeof eventId !== "string" || !UUID.test(eventId)) return { ...state, status: "unavailable" };
  if (await isStaffRequest()) return { ...state, status: "staff" };

  const ip = clientIp(await headers(), getConfig().trustedProxyHops);
  if (!perIp.consume(ip)) return { ...state, status: "rate_limited" };
  const device = await ensureVisitorDevice();
  if (device.isNew && !newDevicesPerIp.consume(ip)) return { ...state, status: "rate_limited" };
  if (!perDevicePerDay.consume(device.deviceId)) return { ...state, status: "rate_limited" };

  const result = await setInterest(await getDb(), { eventId, deviceHash: device.deviceHash, interested });
  if (result === "unavailable") return { ...state, status: "unavailable" };
  return { interested: result === "on", status: result };
}
