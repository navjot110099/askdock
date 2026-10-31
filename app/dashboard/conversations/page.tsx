import { ChevronRight, Inbox, MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Conversations" };

type Search = { filter?: "unanswered" | "leads"; bot?: string; q?: string };

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [sp, user] = await Promise.all([searchParams, requireUser()]);
  const filter = sp.filter === "unanswered" || sp.filter === "leads" ? sp.filter : "all";
  const [bots, conversations] = await Promise.all([
    repo.listBots(user.id),
    repo.listConversations(user.id, { filter, botId: sp.bot, query: sp.q, limit: 80 }),
  ]);

  return (
    <>
      <PageHeader title="Conversations" description="Every chat with your assistants, newest first. Open one to see the full transcript and the sources used." />
      <Suspense>
        <FilterBar
          tabs={[
            { value: "all", label: "All" },
            { value: "unanswered", label: "Unanswered" },
            { value: "leads", label: "With lead" },
          ]}
          bots={bots.map((b) => ({ value: b.id, label: b.name }))}
          searchPlaceholder="Search questions or emails"
        />
      </Suspense>

      {conversations.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="No conversations here yet" body="Once visitors start chatting with your bot, their conversations will show up here." />
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white">
          <div className="hidden grid-cols-[1fr_150px_90px_130px_24px] gap-4 border-b border-border px-5 py-3 text-[12px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <span>First question</span>
            <span>Bot</span>
            <span>Messages</span>
            <span>Last activity</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/conversations/${c.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-[#fbf8f4] md:grid-cols-[1fr_150px_90px_130px_24px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{c.firstQuestion ?? "—"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
                      <span>{c.visitorId}</span>
                      {c.country && <span>· {c.country}</span>}
                      {c.unanswered && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">Unanswered</span>}
                      {c.leadEmail && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-2 py-0.5 font-medium text-rose">
                          <Inbox className="size-3" /> {c.leadEmail}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="hidden items-center gap-2 text-[13px] md:flex">
                    <span className="size-2 rounded-full" style={{ backgroundColor: c.botColor }} />
                    <span className="truncate">{c.botName}</span>
                  </span>
                  <span className="hidden text-[13px] text-muted-foreground md:block">{c.messageCount}</span>
                  <span className="text-right text-[12px] text-muted-foreground md:text-left md:text-[13px]">{timeAgo(c.lastMessageAt)}</span>
                  <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
