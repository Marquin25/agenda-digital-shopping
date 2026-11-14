import { randomBytes } from "node:crypto";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (see .env.example)"),
  DEVICE_ID_PEPPER: z.string().optional(),
  PUBLIC_BASE_URL: z.url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  CRON_SECRET: z.string().min(32).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export interface AppConfig {
  databaseUrl: string;
  deviceIdPepper: string;
  publicBaseUrl: string;
  uploadDir: string;
  /** Bearer token for scheduled jobs called over HTTP (e.g. Vercel Cron); jobs are disabled when unset. */
  cronSecret: string | null;
  isProduction: boolean;
  /** Whether session and visitor cookies carry the `Secure` attribute (see shouldUseSecureCookies). */
  secureCookies: boolean;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Cookies are `Secure` in production. The only exception is a production build served over plain
 * HTTP on this machine (end-to-end tests), and only with ALLOW_INSECURE_LOCALHOST_COOKIES=true:
 * WebKit drops `Secure` cookies on http://localhost, unlike Chromium. A real deployment is never
 * affected, because its public URL is not plain-HTTP loopback.
 */
export function shouldUseSecureCookies(options: {
  isProduction: boolean;
  publicBaseUrl: string;
  allowInsecureLocalhostCookies: boolean;
}): boolean {
  if (!options.isProduction) return false;
  if (!options.allowInsecureLocalhostCookies) return true;
  const url = new URL(options.publicBaseUrl);
  return !(url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname));
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const env = schema.parse(process.env);
  const isProduction = env.NODE_ENV === "production" && process.env.ALLOW_EPHEMERAL_PEPPER !== "true";
  let pepper = env.DEVICE_ID_PEPPER;
  if (!pepper || pepper.length < 32) {
    if (isProduction) throw new Error("DEVICE_ID_PEPPER must be set (>= 32 chars) in production");
    // Development fallback: a per-process random value. Deduplication resets on restart.
    pepper = randomBytes(32).toString("base64url");
    console.warn("[config] DEVICE_ID_PEPPER not set; using an ephemeral value (development only).");
  }
  const publicBaseUrl = env.PUBLIC_BASE_URL.replace(/\/$/, "");
  cached = {
    databaseUrl: env.DATABASE_URL,
    deviceIdPepper: pepper,
    publicBaseUrl,
    uploadDir: env.UPLOAD_DIR,
    cronSecret: env.CRON_SECRET ?? null,
    isProduction: env.NODE_ENV === "production",
    secureCookies: shouldUseSecureCookies({
      isProduction: env.NODE_ENV === "production",
      publicBaseUrl,
      allowInsecureLocalhostCookies: process.env.ALLOW_INSECURE_LOCALHOST_COOKIES === "true",
    }),
  };
  return cached;
}
