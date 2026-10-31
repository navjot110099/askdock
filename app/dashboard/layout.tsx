import type { Metadata } from "next";
import { Info } from "lucide-react";
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
        {isDemoMode && (
          <div className="border-b border-iris/15 bg-accent/70 px-4 py-2 text-center text-[12px] text-accent-foreground sm:px-8">
            <Info className="mr-1.5 inline size-3.5 align-[-2px]" />
            <span className="sm:hidden">Demo workspace · seeded data, resets on restart.</span>
            <span className="hidden sm:inline">Demo workspace with seeded data for the fictional Juniper Dental Studio. Changes are kept in memory and reset when the server restarts.</span>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
