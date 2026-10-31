import { ExternalLink, MessageCircle, MonitorSmartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteBotButton } from "@/app/dashboard/bots/[botId]/install/delete-bot-button";
import { CopyButton } from "@/components/dashboard/copy-button";
import { Panel } from "@/components/dashboard/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { readableOn } from "@/lib/color";
import { repo } from "@/lib/db";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Install" };

const PLATFORMS = [
  { name: "Any HTML website", steps: "Paste the snippet just before the closing </body> tag on every page where the chat should appear." },
  { name: "WordPress", steps: "Install a header & footer code plugin (e.g. WPCode), open Code Snippets → Header & Footer, paste into the Footer box and save." },
  { name: "Wix", steps: "Go to Settings → Custom code → Add custom code. Paste the snippet, apply it to All pages, and place it in Body – end." },
  { name: "Squarespace", steps: "Open Settings → Advanced → Code Injection and paste the snippet into the Footer field." },
  { name: "Shopify", steps: "Online Store → Themes → Edit code → theme.liquid. Paste the snippet right above </body> and save." },
  { name: "Webflow", steps: "Project settings → Custom code → Footer code. Paste the snippet, save and republish your site." },
];

export default async function InstallPage({ params }: { params: Promise<{ botId: string }> }) {
  const [{ botId }, user] = await Promise.all([params, requireUser()]);
  const bot = await repo.getBot(user.id, botId);
  if (!bot) notFound();

  const snippet = `<script src="${env.appUrl}/widget.js" data-bot="${bot.id}" async></script>`;
  const shareLink = `${env.appUrl}/embed/${bot.id}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-6">
        <Panel title="Add AskDock to your website" description="One line, no plugins. The chat bubble appears in the bottom-right corner of every page that includes it.">
          <div className="overflow-hidden rounded-2xl bg-ink">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="font-mono text-[12px] text-white/50">HTML</span>
              <CopyButton value={snippet} label="Copy snippet" className="bg-white/10 text-white hover:bg-white/20" />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-white/85">
              <code>
                <span className="text-[#ff9a6c]">&lt;script</span> <span className="text-[#c5b3ff]">src</span>=<span className="text-[#8fe3c9]">&quot;{env.appUrl}/widget.js&quot;</span>
                {"\n        "}
                <span className="text-[#c5b3ff]">data-bot</span>=<span className="text-[#8fe3c9]">&quot;{bot.id}&quot;</span> <span className="text-[#c5b3ff]">async</span>
                <span className="text-[#ff9a6c]">&gt;&lt;/script&gt;</span>
              </code>
            </pre>
          </div>
          <div className="mt-5 grid gap-3 text-[13px] sm:grid-cols-2">
            <div className="rounded-xl bg-[#fbf8f4] p-3">
              <p className="font-mono text-[12px] text-iris">data-position=&quot;left&quot;</p>
              <p className="mt-1 text-muted-foreground">Show the bubble on the left instead.</p>
            </div>
            <div className="rounded-xl bg-[#fbf8f4] p-3">
              <p className="font-mono text-[12px] text-iris">data-greeting=&quot;off&quot;</p>
              <p className="mt-1 text-muted-foreground">Turn off the welcome pop-up next to the bubble.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Step-by-step by platform">
          <Accordion type="single" collapsible defaultValue="Any HTML website" className="-my-2">
            {PLATFORMS.map((p) => (
              <AccordionItem key={p.name} value={p.name}>
                <AccordionTrigger className="text-[14px] font-medium hover:no-underline">{p.name}</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-muted-foreground">{p.steps}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Panel>

        <Panel title="Share a direct link" description="No website? Send customers straight to a full-page chat — great for email signatures, QR codes and social bios.">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-xl border border-border bg-[#fbf8f4] px-3 py-2.5 font-mono text-[13px]">{shareLink}</code>
            <CopyButton value={shareLink} label="Copy link" className="h-10" />
          </div>
        </Panel>

        <section className="rounded-[22px] border border-red-200/70 bg-red-50/40 p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-red-700">Danger zone</h2>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-muted-foreground">Delete this bot and everything it has learned, including conversations and leads.</p>
            <DeleteBotButton botId={bot.id} name={bot.name} />
          </div>
        </section>
      </div>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white">
          <div className="relative h-56 bg-[linear-gradient(160deg,#f4f9f9,#eef1fb)] p-4">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-black/10" />
              <div className="h-6 w-3/4 rounded-lg bg-black/[0.07]" />
              <div className="h-3 w-2/3 rounded-full bg-black/[0.06]" />
              <div className="h-3 w-1/2 rounded-full bg-black/[0.06]" />
            </div>
            <div className="absolute bottom-16 right-4 max-w-[200px] rounded-2xl bg-white px-3 py-2 text-[12px] shadow-lg">{bot.welcomeMessage.slice(0, 70)}…</div>
            <span className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: bot.brandColor }}>
              <MessageCircle className="size-6" style={{ color: readableOn(bot.brandColor) }} />
            </span>
          </div>
          <div className="space-y-3 p-5">
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <MonitorSmartphone className="size-4 text-iris" /> See it on a real page
            </p>
            <p className="text-[13px] text-muted-foreground">Open a sample website with your widget installed exactly as your visitors will see it.</p>
            <Button asChild className="w-full rounded-xl">
              <Link href={`/widget-demo?bot=${bot.id}`} target="_blank">
                Open test page <ExternalLink />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
