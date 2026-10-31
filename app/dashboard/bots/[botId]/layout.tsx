import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotTabs } from "@/app/dashboard/bots/[botId]/bot-tabs";
import { BotAvatar } from "@/components/bot-avatar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";

export default async function BotLayout({ children, params }: { children: React.ReactNode; params: Promise<{ botId: string }> }) {
  const [{ botId }, user] = await Promise.all([params, requireUser()]);
  const bot = await repo.getBot(user.id, botId);
  if (!bot) notFound();

  return (
    <>
      <Link href="/dashboard/bots" className="text-[13px] text-muted-foreground hover:text-foreground">
        ← All bots
      </Link>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BotAvatar avatar={bot.avatar} name={bot.name} className="size-16 ring-4 ring-white" />
          <div>
            <h1 className="font-display text-[40px] leading-none tracking-[-0.015em]">{bot.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: bot.brandColor }} />
              {bot.brandColor} · {bot.leadCapture ? "Lead capture on" : "Lead capture off"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="lg" className="h-10 rounded-xl bg-white">
          <a href={`/embed/${bot.id}`} target="_blank" rel="noreferrer">
            Open full-page chat <ExternalLink />
          </a>
        </Button>
      </div>
      <BotTabs botId={bot.id} />
      <div className="mt-8">{children}</div>
    </>
  );
}
