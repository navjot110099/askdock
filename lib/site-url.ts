/**
 * Public origin of the app. Prefers NEXT_PUBLIC_APP_URL, then Vercel's
 * production domain (system env var), then localhost for development.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
