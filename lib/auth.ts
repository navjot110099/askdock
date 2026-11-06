import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEMO_USER } from "@/lib/demo/constants";
import { isDemoMode } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/session-cookies";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (isDemoMode) {
    const jar = await cookies();
    return jar.get(SESSION_COOKIE)?.value === "1" ? DEMO_USER : null;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata ?? {};
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: meta.full_name ?? meta.name ?? data.user.email?.split("@")[0] ?? "there",
    avatarUrl: meta.avatar_url ?? null,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
