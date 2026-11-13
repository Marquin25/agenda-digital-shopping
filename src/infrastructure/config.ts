import { randomBytes } from "node:crypto";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (see .env.example)"),
  DEVICE_ID_PEPPER: z.string().optional(),
  PUBLIC_BASE_URL: z.url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export interface AppConfig {
  databaseUrl: string;
  deviceIdPepper: string;
  publicBaseUrl: string;
  uploadDir: string;
  isProduction: boolean;
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
  cached = {
    databaseUrl: env.DATABASE_URL,
    deviceIdPepper: pepper,
    publicBaseUrl: env.PUBLIC_BASE_URL.replace(/\/$/, ""),
    uploadDir: env.UPLOAD_DIR,
    isProduction: env.NODE_ENV === "production",
  };
  return cached;
}
