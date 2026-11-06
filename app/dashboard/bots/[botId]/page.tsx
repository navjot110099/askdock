import { FileText, Globe, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import { DeleteSourceButton } from "@/app/dashboard/bots/[botId]/delete-source-button";
import { SourceUploader } from "@/app/dashboard/bots/[botId]/source-uploader";
import { ChatWindow } from "@/components/chat/chat-window";
import { toChatConfig } from "@/lib/chat-config";
import { Panel } from "@/components/dashboard/page-header";
import { SourceStatusBadge } from "@/components/dashboard/status-badges";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { hasOpenAI, isDemoMode } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Knowledge" };

export default async function KnowledgePage({ params, searchParams }: { params: Promise<{ botId: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ botId }, { created }, user] = await Promise.all([params, searchParams, requireUser()]);
  const [sources, { plan, usage }, publicBot] = await Promise.all([repo.listSources(user.id, botId), getWorkspace(user.id), repo.getPublicBot(botId)]);

  const totalChunks = sources.reduce((s, x) => s + x.chunkCount, 0);
  const totalWords = Math.round(sources.reduce((s, x) => s + x.charCount, 0) / 5.5);
  const disabledReason =
    usage.sources >= plan.limits.sources
      ? `You've used all ${plan.limits.sources} knowledge sources on the ${plan.name} plan. Remove one or upgrade to add more.`
      : !isDemoMode && !hasOpenAI
        ? "Adding knowledge is unavailable right now. Please try again in a little while."
        : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <div className="min-w-0 space-y-6">
        {created && (
          <div className="flex items-start gap-3 rounded-2xl border border-iris/20 bg-accent px-5 py-4 text-accent-foreground">
            <PartyPopper className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Your bot is ready for its first lesson.</p>
              <p className="text-[14px] opacity-80">Upload a price list or FAQ, or crawl your website. You can test answers on the right straight away.</p>
            </div>
          </div>
        )}

        <Panel
          title="Add knowledge"
          description={`${usage.sources} of ${plan.limits.sources} sources used across your bots · ${plan.name} plan`}
        >
          <SourceUploader botId={botId} maxFileMb={plan.limits.fileSizeMb} crawlPages={plan.limits.crawlPages} disabledReason={disabledReason} />
        </Panel>

        <Panel title="Sources" description={`${sources.length} sources · ${totalChunks} chunks · ~${totalWords.toLocaleString()} words indexed`}>
          {sources.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-muted-foreground">No sources yet. Until you add some, the bot will politely say it doesn&apos;t know.</p>
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center gap-4 py-3.5">
                  <span className={s.kind === "url" ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f6] text-[#2a8f9b]" : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0e7] text-[#e0743f]"}>
                    {s.kind === "url" ? <Globe className="size-4" /> : <FileText className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{s.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {s.status === "failed"
                        ? s.error
                        : `${s.kind === "url" ? `${s.pageCount} pages · ` : ""}${s.chunkCount} chunks · ${Math.round(s.charCount / 5.5).toLocaleString()} words · added ${formatDate(s.createdAt)}`}
                    </p>
                  </div>
                  <SourceStatusBadge status={s.status} />
                  <DeleteSourceButton botId={botId} sourceId={s.id} name={s.name} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <p className="mb-3 text-[13px] font-medium text-muted-foreground">Test your bot</p>
        {publicBot && <ChatWindow bot={toChatConfig(publicBot)} className="h-[600px]" />}
        <p className="mt-3 text-[12px] text-muted-foreground">Test chats are recorded in Conversations like any visitor chat.</p>
      </div>
    </div>
  );
}
