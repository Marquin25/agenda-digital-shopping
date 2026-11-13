/** Loads .env.local / .env when present (Next.js does this for the app; scripts need it explicitly). */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file is optional
  }
}
