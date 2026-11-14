/**
 * Static security headers for every response (B-23). The Content-Security-Policy is not here: it carries
 * a per-request nonce and is set in src/proxy.ts.
 */
export function securityHeaders({ production }: { production: boolean }): { key: string; value: string }[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    { key: "X-Frame-Options", value: "DENY" },
    // Pages opened from other sites (Instagram, WhatsApp) cannot keep a handle on this window.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(production
      ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
      : []),
  ];
}
