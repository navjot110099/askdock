import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { AuthShell } from "@/app/(auth)/auth-shell";
import { isDemoMode } from "@/lib/env";
import { PLANS, type PlanId } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create your account",
  description: "Start free with AskDock: build an AI assistant from your own documents in about five minutes. No credit card needed.",
  path: "/signup",
});

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const chosen = plan && plan in PLANS && plan !== "free" ? PLANS[plan as PlanId] : null;
  return (
    <AuthShell
      title={<>Build your first <em>assistant.</em></>}
      subtitle={chosen ? `Create your account, then finish upgrading to ${chosen.name} ($${chosen.priceMonthly}/mo).` : "Free forever for one bot. No credit card needed."}
     
    >
      <AuthForm mode="signup" plan={chosen?.id} demo={isDemoMode} />
    </AuthShell>
  );
}
