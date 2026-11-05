import "server-only";
import { siteUrl } from "@/lib/site-url";

/**
 * Central place for environment configuration.
 *
 * AskDock runs in two modes:
 * - **Live**: Supabase (auth, Postgres + pgvector, storage), OpenAI and Stripe
 *   are configured through `.env.local`.
 * - **Demo**: when Supabase keys are missing the app falls back to an in-memory
 *   workspace seeded with the Juniper Dental demo bot, so the whole product can
 *   be explored (and screenshotted) without any third-party accounts.
 */
export const env = {
  appUrl: siteUrl,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-5.4-mini",
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePricePro: process.env.STRIPE_PRICE_PRO ?? "",
  stripePriceBusiness: process.env.STRIPE_PRICE_BUSINESS ?? "",
  demoBotId: process.env.NEXT_PUBLIC_DEMO_BOT_ID ?? "",
};

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
export const hasOpenAI = Boolean(env.openaiApiKey);
export const hasStripe = Boolean(env.stripeSecretKey && env.stripePricePro && env.stripePriceBusiness);

/** True when the app is running on the in-memory demo workspace. */
export const isDemoMode = !hasSupabase;

if (hasStripe && env.stripeSecretKey.startsWith("sk_live_")) {
  // The showcase is meant to run against Stripe test mode only.
  throw new Error("AskDock refuses to start with a live Stripe key. Use an sk_test_ key.");
}
