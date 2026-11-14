import { cookies } from "next/headers";
import { getConfig } from "@/infrastructure/config";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE_SECONDS,
  hashDeviceId,
  isValidDeviceId,
  newDeviceId,
} from "@/infrastructure/security/device-id";

/** Options of the functional device cookie (random ID; only its HMAC is stored). */
export function deviceCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
  };
}

/** Pseudonymous hash of this browser's device cookie, or null when it has none yet. */
export async function currentDeviceHash(): Promise<string | null> {
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  return isValidDeviceId(deviceId) ? hashDeviceId(deviceId, getConfig().deviceIdPepper) : null;
}

/**
 * For server actions: the device cookie's ID (creating the cookie when missing) and its hash.
 * `isNew` lets callers apply a per-IP limit to freshly minted devices.
 */
export async function ensureVisitorDevice(): Promise<{
  deviceId: string;
  deviceHash: string;
  isNew: boolean;
}> {
  const config = getConfig();
  const jar = await cookies();
  let deviceId = jar.get(DEVICE_COOKIE)?.value;
  const isNew = !isValidDeviceId(deviceId);
  if (isNew) {
    deviceId = newDeviceId();
    jar.set(DEVICE_COOKIE, deviceId, deviceCookieOptions(config.secureCookies));
  }
  return { deviceId: deviceId!, deviceHash: hashDeviceId(deviceId!, config.deviceIdPepper), isNew };
}
