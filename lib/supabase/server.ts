import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Cookie-bound client: queries run as the signed-in user, so RLS applies. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: the middleware refreshes sessions instead.
        }
      },
    },
  });
}

let admin: ReturnType<typeof createSupabaseClient> | undefined;

/** Service-role client for widget traffic, ingestion and Stripe webhooks. Never expose to the browser. */
export function createAdminClient() {
  admin ??= createSupabaseClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
