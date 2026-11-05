import type { Metadata } from "next";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { DashboardSidebar, MobileTopbar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { isDemoMode } from "@/lib/env";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · AskDock" }, robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [{ plan, usage }, newLeads] = await Promise.all([getWorkspace(user.id), repo.listLeads(user.id, { status: "new" })]);
  const props = {
    user,
    planName: plan.name,
    planId: plan.id,
    messagesUsed: usage.messages,
    messagesLimit: plan.limits.messagesPerMonth,
    newLeads: newLeads.length,
  };

  return (
    <div className="flex min-h-dvh bg-ivory">
      <DashboardSidebar {...props} />
      <div className="min-w-0 flex-1">
        <MobileTopbar {...props} />
        {isDemoMode && <DemoBanner />}
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
