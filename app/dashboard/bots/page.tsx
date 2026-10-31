import { ArrowUpRight, Bot, FileText, Inbox, MessagesSquare, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BotAvatar } from "@/components/bot-avatar";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Bots" };

export default async function BotsPage() {
  const user = await requireUser();
  const [bots, { plan }] = await Promise.all([repo.listBots(user.id), getWorkspace(user.id)]);
  const atLimit = bots.length >= plan.limits.bots;

  return (
    <>
      <PageHeader
        title="Bots"
        description={`${bots.length} of ${plan.limits.bots} bot${plan.limits.bots === 1 ? "" : "s"} on the ${plan.name} plan.`}
        actions={
          atLimit ? (
            <Button asChild variant="outline" size="lg" className="h-10 rounded-xl">
              <Link href="/dashboard/billing">Upgrade for more bots</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-10 rounded-xl px-4">
              <Link href="/dashboard/bots/new">
                <Plus /> New bot
              </Link>
            </Button>
          )
        }
      />

      {bots.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Create your first assistant"
          body="Give it a name, add a document or your website, and you'll have a working chatbot in minutes."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/bots/new">
                <Plus /> New bot
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/dashboard/bots/${bot.id}`}
              className="group relative overflow-hidden rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(24,19,31,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(24,19,31,0.4)]"
            >
              <div className="absolute inset-x-0 top-0 h-24 opacity-90" style={{ background: `linear-gradient(135deg, ${bot.brandColor}33, transparent 70%)` }} />
              <div className="relative flex items-start justify-between">
                <BotAvatar avatar={bot.avatar} name={bot.name} className="size-14 ring-4 ring-white" />
                <ArrowUpRight className="size-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <h2 className="relative mt-5 text-xl font-semibold tracking-tight">{bot.name}</h2>
              <p className="relative mt-1 line-clamp-2 min-h-[40px] text-[14px] text-muted-foreground">{bot.welcomeMessage}</p>
              <dl className="relative mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                {[
                  { icon: FileText, label: "Sources", value: bot.sourceCount },
                  { icon: MessagesSquare, label: "Chats · 30d", value: bot.conversations30d },
                  { icon: Inbox, label: "Leads", value: bot.leadCount },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <Icon className="size-3" /> {label}
                    </dt>
                    <dd className="mt-1 font-display text-2xl">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="relative mt-4 text-[12px] text-muted-foreground">Updated {timeAgo(bot.updatedAt)}</p>
            </Link>
          ))}
          {!atLimit && (
            <Link
              href="/dashboard/bots/new"
              className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/15 bg-white/40 text-center transition hover:border-iris/40 hover:bg-white"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                <Plus className="size-5" />
              </span>
              <p className="mt-4 font-semibold">New bot</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{plan.limits.bots - bots.length} remaining on your plan</p>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
