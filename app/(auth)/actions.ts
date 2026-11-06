"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { discardWorkspace } from "@/lib/db/demo-repo";
import { env, isDemoMode } from "@/lib/env";
import { cookieOptions, SESSION_COOKIE, WORKSPACE_COOKIE } from "@/lib/session-cookies";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | undefined;

const Credentials = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Passwords need at least 8 characters."),
  name: z.string().trim().max(80).optional(),
});

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function afterAuthPath(formData: FormData) {
  const plan = formData.get("plan");
  return plan === "pro" || plan === "business" ? `/dashboard/billing?upgrade=${plan}` : safeNext(formData.get("next"));
}

/** Without Supabase, signing in opens the visitor's private sample workspace. */
async function startDemoSession(path: string): Promise<never> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "1", cookieOptions(7));
  redirect(path);
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (isDemoMode) return startDemoSession(afterAuthPath(formData));

  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");

  if (formData.get("intent") === "magic") {
    if (!z.email().safeParse(email).success) return { error: "Enter your email first, then request a link." };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(safeNext(formData.get("next")))}`, shouldCreateUser: false },
    });
    return error ? { error: error.message } : { message: `We've emailed a sign-in link to ${email}.` };
  }

  const parsed = Credentials.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message === "Invalid login credentials" ? "That email and password don't match." : error.message };
  redirect(afterAuthPath(formData));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (isDemoMode) return startDemoSession(afterAuthPath(formData));

  const parsed = Credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(afterAuthPath(formData))}`,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(afterAuthPath(formData));
  return { message: `Almost there — check ${parsed.data.email} for a confirmation link.` };
}

export async function signInWithGoogle(formData: FormData) {
  if (isDemoMode) return startDemoSession(afterAuthPath(formData));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent(afterAuthPath(formData))}` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  if (isDemoMode) {
    // Signing out drops the visitor's workspace; the next sign-in starts from fresh sample data.
    const jar = await cookies();
    await discardWorkspace();
    jar.delete(SESSION_COOKIE);
    jar.set(WORKSPACE_COOKIE, crypto.randomUUID(), cookieOptions(30));
  } else {
    await (await createClient()).auth.signOut();
  }
  redirect("/");
}
