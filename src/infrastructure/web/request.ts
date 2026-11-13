/**
 * Client IP for rate limiting only (kept in memory, never stored).
 *
 * Assumes exactly one trusted reverse proxy in front of the app that appends the peer address to
 * X-Forwarded-For. Earlier entries are supplied by the client and can be forged, so only the last one
 * is used. Without a proxy, all requests share a key and only the per-device limits apply.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
