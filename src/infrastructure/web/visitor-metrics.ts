import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isLikelyBot } from "@/domain/metrics/traffic-source";
import { getConfig } from "@/infrastructure/config";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE_SECONDS,
  hashDeviceId,
  isValidDeviceId,
  newDeviceId,
} from "@/infrastructure/security/device-id";
import { RateLimiter } from "@/infrastructure/security/rate-limiter";
import { isStaffRequest } from "./admin-session";
import { clientIp } from "./request";

const perIp = new RateLimiter(600, 60_000);
const perDevice = new RateLimiter(60, 60_000);
// Requests without a device cookie get a fresh ID, so they are limited per IP instead; otherwise a client
// that drops cookies could mint unlimited "unique devices".
const newDevicesPerIp = new RateLimiter(120, 60_000);

export type VisitorMetricGate =
  | { accepted: false; response: NextResponse }
  | {
      accepted: true;
      deviceHash: string;
      /** 204 response carrying the device cookie when one was just created. */
      response: NextResponse;
    };

const noContent = () => new NextResponse(null, { status: 204 });
const tooManyRequests = () => new NextResponse(null, { status: 429 });

/**
 * Common gate for anonymous metric writes (docs/spec/03 §1, §2, §5): ignores bots and staff sessions,
 * applies the per-IP and per-device limits and resolves the pseudonymous device ID (cookie + HMAC).
 * Ignored requests still answer 204 so clients cannot tell what was counted.
 */
export async function openVisitorMetric(request: Request): Promise<VisitorMetricGate> {
  if (isLikelyBot(request.headers.get("user-agent"))) return { accepted: false, response: noContent() };
  const ip = clientIp(request.headers);
  if (!perIp.consume(ip)) return { accepted: false, response: tooManyRequests() };
  if (await isStaffRequest()) return { accepted: false, response: noContent() };

  const config = getConfig();
  const response = noContent();
  let deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!isValidDeviceId(deviceId)) {
    if (!newDevicesPerIp.consume(ip)) return { accepted: false, response: tooManyRequests() };
    deviceId = newDeviceId();
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
    });
  }
  if (!perDevice.consume(deviceId)) return { accepted: false, response: tooManyRequests() };
  return { accepted: true, deviceHash: hashDeviceId(deviceId, config.deviceIdPepper), response };
}
