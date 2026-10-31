import { AlertTriangle, FileText, Globe, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotAvatar } from "@/components/bot-avatar";
import { MessageContent } from "@/components/chat/message-content";
import { Panel } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth";
import { readableOn } from "@/lib/color";
import { repo } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const data = await repo.getConversation(user.id, id);
  if (!data) notFound();
  const { conversation: c, messages } = data;
  const bot = await repo.getBot(user.id, c.botId);

  return (
    <>
      <Link href="/dashboard/conversations" className="text-[13px] text-muted-foreground hover:text-foreground">
        ← Conversations
      </Link>
      <h1 className="mt-4 font-display text-[34px] leading-tight tracking-[-0.01em] sm:text-[40px]">“{c.firstQuestion}”</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        {c.botName} · started {formatDateTime(c.startedAt)} · {c.messageCount} messages
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="rounded-[22px] border border-black/[0.06] bg-[#fbf8f4] p-4 sm:p-8" aria-label="Transcript">
          <ol className="space-y-5">
            {messages.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="flex flex-col items-end">
                  <div className="max-w-[80%] rounded-[18px] rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed shadow-sm" style={{ backgroundColor: c.botColor, color: readableOn(c.botColor) }}>
                    {m.content}
                  </div>
                  <span className="mt-1 text-[11px] text-muted-foreground">Visitor · {formatDateTime(m.createdAt)}</span>
                </li>
              ) : (
                <li key={m.id} className="flex items-start gap-3">
                  <BotAvatar avatar={bot?.avatar ?? "preset:spark"} name={c.botName} className="mt-0.5 size-8" />
                  <div className="min-w-0 max-w-[85%]">
                    <div className="rounded-[18px] rounded-tl-md border border-black/[0.05] bg-white px-4 py-3 text-[14px] leading-relaxed shadow-sm">
                      <MessageContent text={m.content} citations={m.citations} color={c.botColor} />
                    </div>
                    {m.answered === false && (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        <AlertTriangle className="size-3" /> Not covered by your knowledge — consider adding it
                      </p>
                    )}
                    {m.citations.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {m.citations.map((cite) => (
                          <li key={cite.n} title={cite.snippet} className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-2.5 py-1 text-[12px]">
                            <span className="font-semibold" style={{ color: c.botColor }}>
                              {cite.n}
                            </span>
                            {cite.url ? <Globe className="size-3 text-muted-foreground" /> : <FileText className="size-3 text-muted-foreground" />}
                            {cite.title}
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                  </div>
                </li>
              ),
            )}
          </ol>
        </section>

        <div className="space-y-6">
          <Panel title="Details">
            <dl className="space-y-3 text-[14px]">
              {[
                ["Bot", c.botName],
                ["Visitor", c.visitorId],
                ["Location", c.country ?? "Unknown"],
                ["Started", formatDateTime(c.startedAt)],
                ["Last message", formatDateTime(c.lastMessageAt)],
                ["Status", c.unanswered ? "Had an unanswered question" : "All questions answered"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          {c.leadEmail && (
            <Panel title="Lead captured">
              <p className="flex items-center gap-2 text-[14px] font-medium">
                <Inbox className="size-4 text-rose" /> {c.leadEmail}
              </p>
              <Link href="/dashboard/leads" className="mt-3 inline-block text-[13px] font-medium text-iris hover:underline">
                Open in Leads →
              </Link>
            </Panel>
          )}
          {c.unanswered && bot && (
            <Panel title="Fill the gap">
              <p className="text-[14px] text-muted-foreground">Add a document or page that answers this question so {bot.name} can handle it next time.</p>
              <Link href={`/dashboard/bots/${bot.id}`} className="mt-3 inline-block text-[13px] font-medium text-iris hover:underline">
                Add knowledge →
              </Link>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
