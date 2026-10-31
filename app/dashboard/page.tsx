import { ArrowRight, CheckCircle2, Inbox, MessageSquareText, MessagesSquare, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BotAvatar } from "@/components/bot-avatar";
import { MessagesChart } from "@/components/dashboard/messages-chart";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { QuestionList } from "@/components/dashboard/question-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadStatusBadge } from "@/components/dashboard/status-badges";
import { Button } from "@/components/ui/button";
import { computeAnalytics, delta } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { compact, pct, plural, timeAgo } from "@/lib/format";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await requireUser();
  const { plan } = await getWorkspace(user.id);
  const days = Math.min(30, plan.limits.analyticsDays);
  const since = new Date(Date.now() - days * 2 * 86_400_000).toISOString();

  const [activity, bots, leads, conversations] = await Promise.all([
    repo.getActivity(user.id, since),
    repo.listBots(user.id),
    repo.listLeads(user.id),
    repo.listConversations(user.id, { limit: 6 }),
  ]);
  const a = computeAnalytics(activity, days);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={
          <>
            Welcome back, <em>{firstName}.</em>
          </>
        }
        description={`Here's how your assistants handled customer questions over the last ${days} days.`}
        actions={
          <Button asChild size="lg" className="h-10 rounded-xl px-4">
            <Link href="/dashboard/bots/new">
              <Plus /> New bot
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Conversations" value={compact(a.totals.conversations)} change={delta(a.totals.conversations, a.previous.conversations)} hint={`vs previous ${days} days`} icon={MessagesSquare} tone="iris" />
        <StatCard label="Visitor messages" value={compact(a.totals.questions)} change={delta(a.totals.messages, a.previous.messages)} hint={`${a.totals.avgTurns.toFixed(1)} per conversation`} icon={MessageSquareText} tone="lagoon" />
        <StatCard label="Answer rate" value={pct(a.totals.answerRate)} change={a.totals.answerRate - a.previous.answerRate} hint="answered from your content" icon={CheckCircle2} tone="apricot" />
        <StatCard label="Leads captured" value={compact(a.totals.leads)} change={delta(a.totals.leads, a.previous.leads)} hint={`${leads.filter((l) => l.status === "new").length} waiting for follow-up`} icon={Inbox} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Panel
          title="Messages per day"
          description={`Visitor messages and new conversations, last ${days} days`}
          action={
            <Link href="/dashboard/analytics" className="text-[13px] font-medium text-iris hover:underline">
              Analytics
            </Link>
          }
        >
          <MessagesChart data={a.daily} />
        </Panel>
        <Panel title="Top questions" description="What visitors ask most">
          <QuestionList items={a.topQuestions.slice(0, 6)} emptyText="Questions will appear once visitors start chatting." />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="Your bots"
          action={
            <Link href="/dashboard/bots" className="text-[13px] font-medium text-iris hover:underline">
              Manage
            </Link>
          }
        >
          <ul className="-my-3 divide-y divide-border">
            {bots.map((bot) => (
              <li key={bot.id}>
                <Link href={`/dashboard/bots/${bot.id}`} className="group flex items-center gap-4 py-3">
                  <BotAvatar avatar={bot.avatar} name={bot.name} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{bot.name}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {plural(bot.sourceCount, "source")} · {plural(bot.conversations30d, "chat")} (30d) · {plural(bot.leadCount, "lead")}
                    </p>
                  </div>
                  <span className="size-3 rounded-full ring-4 ring-black/[0.03]" style={{ backgroundColor: bot.brandColor }} />
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
            {bots.length === 0 && <li className="py-4 text-[14px] text-muted-foreground">No bots yet — create your first one.</li>}
          </ul>
        </Panel>

        <Panel
          title="Latest leads"
          action={
            <Link href="/dashboard/leads" className="text-[13px] font-medium text-iris hover:underline">
              All leads
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {leads.slice(0, 5).map((lead) => (
              <li key={lead.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-[13px] font-semibold">{(lead.name ?? lead.email)[0].toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{lead.name ?? lead.email}</p>
                  <p className="truncate text-[13px] text-muted-foreground">“{lead.question}”</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <LeadStatusBadge status={lead.status} />
                  <span className="text-[11px] text-muted-foreground">{timeAgo(lead.createdAt)}</span>
                </div>
              </li>
            ))}
            {leads.length === 0 && <li className="py-4 text-[14px] text-muted-foreground">No leads yet.</li>}
          </ul>
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Recent conversations"
        action={
          <Link href="/dashboard/conversations" className="text-[13px] font-medium text-iris hover:underline">
            View all
          </Link>
        }
      >
        <ul className="-my-3 divide-y divide-border">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/dashboard/conversations/${c.id}`} className="flex items-center gap-4 py-3 hover:opacity-80">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.botColor }} />
                <p className="min-w-0 flex-1 truncate text-[14px]">{c.firstQuestion}</p>
                {c.unanswered && <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 sm:inline">Unanswered</span>}
                <span className="hidden text-[13px] text-muted-foreground sm:inline">{c.botName}</span>
                <span className="w-24 text-right text-[12px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
