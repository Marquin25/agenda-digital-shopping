/** Request header carrying the per-request nonce from `src/proxy.ts` to server components. */
export const NONCE_HEADER = "x-nonce";

/**
 * Strict, nonce-based CSP (docs/spec/06): scripts run only if they carry this response's nonce
 * (Next.js adds it to its own scripts during dynamic rendering), so injected inline scripts are blocked.
 * Inline styles stay allowed for React `style` attributes; they cannot execute code.
 */
export function buildContentSecurityPolicy({ nonce, development }: { nonce: string; development: boolean }) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}
