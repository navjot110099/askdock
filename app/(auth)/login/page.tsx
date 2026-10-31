import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { AuthShell } from "@/app/(auth)/auth-shell";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your AskDock dashboard." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; plan?: string; error?: string }> }) {
  const { next, plan, error } = await searchParams;
  return (
    <AuthShell title={<>Welcome <em>back.</em></>} subtitle="Sign in to see your conversations, leads and analytics." demo={isDemoMode}>
      <AuthForm mode="login" next={next} plan={plan} error={error} demo={isDemoMode} />
    </AuthShell>
  );
}
