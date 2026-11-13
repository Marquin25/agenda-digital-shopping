import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy, NONCE_HEADER } from "@/infrastructure/web/content-security-policy";

/** Generates a fresh CSP nonce per request; Next.js reads it from the request's CSP header. */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy({ nonce, development: process.env.NODE_ENV === "development" });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set("content-security-policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", policy);
  return response;
}

export const config = {
  // Pages only: static assets, uploaded images and prefetches need no nonce.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|media/|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
