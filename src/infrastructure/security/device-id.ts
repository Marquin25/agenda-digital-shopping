import { createHmac, randomUUID } from "node:crypto";

export const DEVICE_COOKIE = "cs_device";
export const DEVICE_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isValidDeviceId(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}

export function newDeviceId(): string {
  return randomUUID();
}

/** Only this HMAC is stored, so a database leak cannot be joined with cookies (docs/spec/03 §2). */
export function hashDeviceId(deviceId: string, pepper: string): string {
  return createHmac("sha256", pepper).update(deviceId).digest("base64url");
}
