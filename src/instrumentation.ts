/**
 * Runs once when the server starts: validates the configuration so a missing variable
 * (e.g. an S3 setting with STORAGE_DRIVER=s3) stops the start-up instead of failing on a later request.
 * Error messages name the variables, never their values.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getConfig } = await import("@/infrastructure/config");
  getConfig();
}
