/**
 * Client IP for rate limiting only (kept in memory, never stored).
 *
 * Each trusted reverse proxy appends the address of its peer to X-Forwarded-For, so with
 * `trustedProxyHops` proxies the client is the entry that many positions from the end; anything
 * before it was supplied by the client and can be forged. Configure the count with
 * TRUSTED_PROXY_HOPS (default 1). Without a proxy, all requests share a key and only the
 * per-device limits apply.
 */
export function clientIp(headers: Headers, trustedProxyHops: number): string {
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const forwarded = entries.at(-trustedProxyHops) ?? entries[0];
  return forwarded || headers.get("x-real-ip") || "unknown";
}
