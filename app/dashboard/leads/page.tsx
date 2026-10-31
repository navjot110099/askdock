import { Download, Inbox, Lock, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LeadStatusSelect } from "@/app/dashboard/leads/lead-status-select";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import type { LeadStatus } from "@/lib/types";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; bot?: string }> }) {
  const [sp, user] = await Promise.all([searchParams, requireUser()]);
  const [all, bots, { plan }] = await Promise.all([repo.listLeads(user.id, { botId: sp.bot }), repo.listBots(user.id), getWorkspace(user.id)]);
  const status = (["new", "contacted", "won"] as const).includes(sp.status as LeadStatus) ? (sp.status as LeadStatus) : null;
  const leads = status ? all.filter((l) => l.status === status) : all;
  const count = (s: LeadStatus) => all.filter((l) => l.status === s).length;
  const conversion = all.length ? Math.round((count("won") / all.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Visitors who left their details when your bot couldn't answer — or asked to talk to a person."
        actions={
          plan.csvExport ? (
            <Button asChild variant="outline" size="lg" className="h-10 rounded-xl bg-white">
              <a href="/api/leads/export">
                <Download /> Export CSV
              </a>
            </Button>
          ) : (
            <Button asChild variant="outline" size="lg" className="h-10 rounded-xl bg-white">
              <Link href="/dashboard/billing">
                <Lock /> Export CSV · Pro
              </Link>
            </Button>
          )
        }
      />

      {!plan.leadCapture && (
        <div className="mb-6 rounded-2xl border border-iris/20 bg-accent px-5 py-4 text-[14px] text-accent-foreground">
          Lead capture is available on Pro and Business. <Link href="/dashboard/billing" className="font-semibold underline-offset-2 hover:underline">Upgrade</Link> to start collecting emails when your bot can&apos;t help.
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total leads", value: all.length },
          { label: "Waiting for follow-up", value: count("new") },
          { label: "Contacted", value: count("contacted") },
          { label: "Won", value: `${count("won")} · ${conversion}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/[0.06] bg-white p-4">
            <p className="text-[12px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-[30px] leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <Suspense>
        <FilterBar
          tabParam="status"
          tabs={[
            { value: "all", label: "All", count: all.length },
            { value: "new", label: "New", count: count("new") },
            { value: "contacted", label: "Contacted", count: count("contacted") },
            { value: "won", label: "Won", count: count("won") },
          ]}
          bots={bots.map((b) => ({ value: b.id, label: b.name }))}
        />
      </Suspense>

      {leads.length === 0 ? (
        <EmptyState icon={Inbox} title="No leads to show" body="When a visitor leaves their email in the chat, they'll appear here with the question they asked." />
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white">
          <div className="hidden grid-cols-[1.1fr_1.4fr_130px_110px_130px] gap-4 border-b border-border px-5 py-3 text-[12px] font-medium uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Contact</span>
            <span>Question</span>
            <span>Bot</span>
            <span>Captured</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-border">
            {leads.map((lead) => (
              <li key={lead.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.1fr_1.4fr_130px_110px_130px] lg:items-center lg:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[13px] font-semibold text-white">
                    {(lead.name ?? lead.email)[0].toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{lead.name ?? "—"}</p>
                    <a href={`mailto:${lead.email}`} className="truncate text-[13px] text-muted-foreground hover:text-foreground hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[14px]">“{lead.question ?? "—"}”</p>
                  {lead.conversationId && (
                    <Link href={`/dashboard/conversations/${lead.conversationId}`} className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-iris hover:underline">
                      <MessageSquareText className="size-3" /> View conversation
                    </Link>
                  )}
                </div>
                <span className="text-[13px] text-muted-foreground">{lead.botName}</span>
                <span className="text-[13px] text-muted-foreground">{timeAgo(lead.createdAt)}</span>
                <LeadStatusSelect leadId={lead.id} status={lead.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
