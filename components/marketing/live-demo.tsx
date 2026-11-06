"use client";

import { BookOpenCheck, Inbox, MessageSquareQuote } from "lucide-react";
import { ChatWindow, type ChatBotConfig } from "@/components/chat/chat-window";
import { Reveal } from "@/components/marketing/reveal";

const POINTS = [
  { icon: MessageSquareQuote, title: "Ask anything a patient would", body: "Prices, opening hours, insurance, parking, kids' visits, emergencies…" },
  { icon: BookOpenCheck, title: "Check the sources", body: "Each answer links to the document or page it came from." },
  { icon: Inbox, title: "Try something it doesn't know", body: "Ask about Botox or sleep apnea and watch it hand off to the team." },
];

export function LiveDemo({ bot }: { bot: ChatBotConfig | null }) {
  return (
    <section id="demo" className="relative scroll-mt-24 overflow-x-clip py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px w-6 bg-brand-gradient" /> Live demo
          </p>
          <h2 className="mt-4 font-display text-[40px] leading-[1.02] tracking-[-0.015em] text-balance sm:text-[56px]">
            Meet Juni. Ask it anything a <em>patient</em> would.
          </h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
            Juni is AskDock set up for Juniper Dental Studio, a sample clinic, from three documents and a four-page website. Go ahead — try it.
          </p>
          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-iris shadow-sm">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-[15px] text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="relative scroll-mt-24" id="demo-chat">
          <div aria-hidden className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(60%_60%_at_30%_20%,rgba(63,181,194,0.25),transparent),radial-gradient(60%_60%_at_80%_80%,rgba(143,103,238,0.25),transparent)] blur-2xl" />
          {bot ? (
            <ChatWindow bot={bot} className="relative mx-auto h-[620px] max-w-[440px]" />
          ) : (
            <div className="relative mx-auto flex h-[420px] max-w-[440px] items-center justify-center rounded-[22px] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-muted-foreground">
              The live demo is taking a short break. Please check back in a few minutes.
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
