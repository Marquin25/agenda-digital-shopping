import { randomBytes } from "node:crypto";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (see .env.example)"),
  DEVICE_ID_PEPPER: z.string().optional(),
  PUBLIC_BASE_URL: z.url().default("http://localhost:3000"),
  CRON_SECRET: z
    .string()
    .min(32, "CRON_SECRET must have at least 32 characters (see .env.example)")
    .optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  TRUSTED_PROXY_HOPS: z.coerce
    .number()
    .int()
    .min(1, "TRUSTED_PROXY_HOPS must be a whole number from 1 to 5 (see .env.example)")
    .max(5, "TRUSTED_PROXY_HOPS must be a whole number from 1 to 5 (see .env.example)")
    .default(1),
});

/** Where uploaded banners live: the local disk (default) or an S3-compatible bucket (AWS S3, R2, MinIO). */
export type StorageConfig =
  | { driver: "local"; uploadDir: string }
  | {
      driver: "s3";
      /** Custom endpoint for R2/MinIO; null uses the AWS endpoint for the region. */
      endpoint: string | null;
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle: boolean;
    };

type Env = Record<string, string | undefined>;

const S3_REQUIRED = ["S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;

const present = (value: string | undefined) => (value && value.trim() !== "" ? value : undefined);

/**
 * Reads the storage settings. Errors name the variables but never echo their values,
 * so a misconfigured secret does not end up in the logs.
 */
export function parseStorageConfig(env: Env): StorageConfig {
  const driver = present(env.STORAGE_DRIVER)?.trim() ?? "local";
  if (driver === "local") return { driver, uploadDir: present(env.UPLOAD_DIR) ?? "./storage/uploads" };
  if (driver !== "s3") throw new Error('STORAGE_DRIVER must be "local" or "s3" (see .env.example)');

  const missing = S3_REQUIRED.filter((name) => !present(env[name]));
  if (missing.length > 0) {
    throw new Error(`STORAGE_DRIVER=s3 requires ${missing.join(", ")} (see .env.example)`);
  }
  const endpoint = present(env.S3_ENDPOINT)?.trim() ?? null;
  if (endpoint !== null && !/^https?:$/.test(URL.parse(endpoint)?.protocol ?? "")) {
    throw new Error("S3_ENDPOINT must be an http(s) URL (see .env.example)");
  }
  const pathStyle = present(env.S3_FORCE_PATH_STYLE)?.trim() ?? "false";
  if (pathStyle !== "true" && pathStyle !== "false") {
    throw new Error('S3_FORCE_PATH_STYLE must be "true" or "false" (see .env.example)');
  }
  return {
    driver,
    endpoint,
    region: env.S3_REGION!,
    bucket: env.S3_BUCKET!,
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    forcePathStyle: pathStyle === "true",
  };
}

export interface AppConfig {
  databaseUrl: string;
  deviceIdPepper: string;
  publicBaseUrl: string;
  storage: StorageConfig;
  /** Bearer token for scheduled jobs called over HTTP (e.g. Vercel Cron); jobs are disabled when unset. */
  cronSecret: string | null;
  isProduction: boolean;
  /** Reverse proxies in front of the app that append to X-Forwarded-For (see clientIp). */
  trustedProxyHops: number;
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

/** A variable set to an empty or blank value (`CRON_SECRET=` in .env.example) counts as unset. */
function withoutBlankValues(env: Env): Env {
  return Object.fromEntries(Object.entries(env).filter(([, value]) => present(value) !== undefined));
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  cached ??= readConfig(process.env);
  return cached;
}

/** Builds the configuration from environment variables; errors name variables, never their values. */
export function readConfig(rawEnv: Env): AppConfig {
  const source = withoutBlankValues(rawEnv);
  const env = schema.parse(source);
  const isProduction = env.NODE_ENV === "production" && source.ALLOW_EPHEMERAL_PEPPER !== "true";
  let pepper = env.DEVICE_ID_PEPPER;
  if (!pepper || pepper.length < 32) {
    if (isProduction) throw new Error("DEVICE_ID_PEPPER must be set (>= 32 chars) in production");
    // Development fallback: a per-process random value. Deduplication resets on restart.
    pepper = randomBytes(32).toString("base64url");
    console.warn("[config] DEVICE_ID_PEPPER not set; using an ephemeral value (development only).");
  }
  const publicBaseUrl = env.PUBLIC_BASE_URL.replace(/\/$/, "");
  return {
    databaseUrl: env.DATABASE_URL,
    deviceIdPepper: pepper,
    publicBaseUrl,
    storage: parseStorageConfig(source),
    cronSecret: env.CRON_SECRET ?? null,
    trustedProxyHops: env.TRUSTED_PROXY_HOPS,
    isProduction: env.NODE_ENV === "production",
    secureCookies: shouldUseSecureCookies({
      isProduction: env.NODE_ENV === "production",
      publicBaseUrl,
      allowInsecureLocalhostCookies: source.ALLOW_INSECURE_LOCALHOST_COOKIES === "true",
    }),
  };
}
