import { CheckCircle2, Inbox, Lock, MessageSquareText, MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HoursChart } from "@/components/dashboard/hours-chart";
import { MessagesChart } from "@/components/dashboard/messages-chart";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { QuestionList } from "@/components/dashboard/question-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { computeAnalytics, delta } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { compact, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [7, 30, 90];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string; bot?: string }> }) {
  const [sp, user] = await Promise.all([searchParams, requireUser()]);
  const { plan } = await getWorkspace(user.id);
  const requested = Number(sp.days) || 30;
  const days = RANGES.includes(requested) ? Math.min(requested, plan.limits.analyticsDays) : Math.min(30, plan.limits.analyticsDays);
  const bots = await repo.listBots(user.id);
  const botId = bots.some((b) => b.id === sp.bot) ? sp.bot : undefined;

  const activity = await repo.getActivity(user.id, new Date(Date.now() - days * 2 * 86_400_000).toISOString(), botId);
  const a = computeAnalytics(activity, days);

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h % 12 || 12}${h < 12 ? "am" : "pm"}`, questions: 0 }));
  for (const m of activity.messages) if (m.role === "user" && m.createdAt >= since) hours[new Date(m.createdAt).getHours()].questions += 1;
  const busiest = hours.reduce((best, h) => (h.questions > best.questions ? h : best), hours[0]);

  const href = (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    const merged = { days, bot: botId, ...params };
    if (merged.days && merged.days !== 30) q.set("days", String(merged.days));
    if (merged.bot) q.set("bot", String(merged.bot));
    return `/dashboard/analytics${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        description="What visitors ask, when they ask it, and where your knowledge has gaps."
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 rounded-xl bg-muted p-1">
              {RANGES.map((r) => {
                const locked = r > plan.limits.analyticsDays;
                return locked ? (
                  <Link key={r} href="/dashboard/billing" title={`Upgrade for ${r}-day analytics`} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground/70">
                    <Lock className="size-3" /> {r}d
                  </Link>
                ) : (
                  <Link
                    key={r}
                    href={href({ days: r })}
                    className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium", r === days ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    {r}d
                  </Link>
                );
              })}
            </div>
            {bots.length > 1 && (
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                <Link href={href({ bot: undefined })} className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium", !botId ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  All bots
                </Link>
                {bots.map((b) => (
                  <Link
                    key={b.id}
                    href={href({ bot: b.id })}
                    className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium", botId === b.id ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: b.brandColor }} />
                    {b.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Conversations" value={compact(a.totals.conversations)} change={delta(a.totals.conversations, a.previous.conversations)} hint={`vs previous ${days}d`} icon={MessagesSquare} tone="iris" />
        <StatCard label="Messages" value={compact(a.totals.messages)} change={delta(a.totals.messages, a.previous.messages)} hint={`${a.totals.questions} from visitors`} icon={MessageSquareText} tone="lagoon" />
        <StatCard label="Answer rate" value={pct(a.totals.answerRate)} change={a.totals.answerRate - a.previous.answerRate} hint="pts vs previous" icon={CheckCircle2} tone="apricot" />
        <StatCard label="Leads" value={compact(a.totals.leads)} change={delta(a.totals.leads, a.previous.leads)} hint={`${pct(a.totals.conversations ? a.totals.leads / a.totals.conversations : 0)} of chats`} icon={Inbox} tone="rose" />
      </div>

      <Panel className="mt-6" title="Messages per day" description={`Visitor messages and new conversations over the last ${days} days`}>
        <MessagesChart data={a.daily} height={320} />
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Top questions" description="Most frequently asked, grouped by wording">
          <QuestionList items={a.topQuestions} emptyText="No questions in this period yet." />
        </Panel>
        <Panel
          title="Knowledge gaps"
          description="Questions your bot couldn't answer from your content"
          action={
            bots[0] && (
              <Link href={`/dashboard/bots/${botId ?? bots[0].id}`} className="text-[13px] font-medium text-iris hover:underline">
                Add knowledge
              </Link>
            )
          }
        >
          <QuestionList items={a.unanswered} tone="rose" emptyText="Nothing unanswered — your knowledge covers every question so far." />
        </Panel>
      </div>

      <Panel className="mt-6" title="When visitors ask" description={a.totals.questions ? `Busiest around ${busiest.hour} — local server time` : "Hour of day"}>
        <HoursChart data={hours} />
      </Panel>
    </>
  );
}
