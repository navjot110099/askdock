"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, ChevronDown, FileText, Globe, RotateCcw, Square, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { BotAvatar } from "@/components/bot-avatar";
import { LeadForm } from "@/components/chat/lead-form";
import { MessageContent } from "@/components/chat/message-content";
import { readableOn } from "@/lib/color";
import type { ChatMessage, Citation, PublicBot } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ChatBotConfig = Pick<
  PublicBot,
  "id" | "name" | "avatar" | "brandColor" | "welcomeMessage" | "suggestedQuestions" | "leadCapture" | "showBranding"
>;

type Props = {
  bot: ChatBotConfig;
  variant?: "embed" | "card";
  /** Absolute origin when rendered inside a third-party page; empty for same-origin. */
  apiBase?: string;
  onClose?: () => void;
  className?: string;
};

function uuid() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function visitorId() {
  try {
    const existing = localStorage.getItem("askdock_visitor");
    if (existing) return existing;
    const id = `v_${uuid().slice(0, 12)}`;
    localStorage.setItem("askdock_visitor", id);
    return id;
  } catch {
    return `v_${uuid().slice(0, 12)}`;
  }
}

const textOf = (m: ChatMessage) =>
  m.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");

export function ChatWindow({ bot, variant = "card", apiBase = "", onClose, className }: Props) {
  const [conversationId] = useState(uuid);
  const visitor = useRef<string>("");
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const color = bot.brandColor;
  const onColor = readableOn(color);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatMessage>({
        api: `${apiBase}/api/chat`,
        body: () => ({ botId: bot.id, visitorId: (visitor.current ||= visitorId()) }),
      }),
    [apiBase, bot.id],
  );

  const { messages, sendMessage, status, error, regenerate, stop } = useChat<ChatMessage>({ id: conversationId, transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ text: q });
    setInput("");
  }

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !textOf(last));

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-[#fbf8f4] text-[#18131f]",
        variant === "card" && "rounded-[22px] border border-black/[0.06] shadow-[0_30px_80px_-30px_rgba(24,19,31,0.35),0_8px_24px_-12px_rgba(24,19,31,0.18)]",
        variant === "embed" && "h-dvh",
        className,
      )}
      style={{ ["--bot" as string]: color }}
    >
      <header className="relative flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: color, color: onColor }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
        <BotAvatar avatar={bot.avatar} name={bot.name} className="relative size-10 ring-2 ring-white/40" />
        <div className="relative min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{bot.name}</p>
          <p className="flex items-center gap-1.5 text-[12px] opacity-85">
            <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.25)]" /> Online · replies instantly
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="relative inline-flex size-8 items-center justify-center rounded-full transition hover:bg-white/15"
          >
            <X className="size-4" />
          </button>
        )}
      </header>

      <div ref={scroller} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
        <BotRow bot={bot}>
          <Bubble>{bot.welcomeMessage}</Bubble>
        </BotRow>

        {messages.length === 0 && bot.suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 pl-10">
            {bot.suggestedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border bg-white px-3 py-1.5 text-left text-[13px] font-medium shadow-sm transition hover:-translate-y-px hover:shadow"
                style={{ borderColor: `${color}40`, color }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, idx) => {
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[82%] rounded-[18px] rounded-br-md px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm" style={{ backgroundColor: color, color: onColor }}>
                  {textOf(m)}
                </div>
              </div>
            );
          }
          const text = textOf(m);
          const citations = m.parts.find((p) => p.type === "data-sources")?.data.citations ?? [];
          const lead = m.parts.find((p) => p.type === "data-lead");
          const cited = citations.filter((c) => text.includes(`[${c.n}]`));
          const done = !(busy && idx === messages.length - 1);
          if (!text && !lead) return null;
          const question = [...messages.slice(0, idx)].reverse().find((x) => x.role === "user");
          return (
            <BotRow key={m.id} bot={bot}>
              {text && (
                <Bubble>
                  <MessageContent text={text} citations={citations} color={color} />
                </Bubble>
              )}
              {done && cited.length > 0 && <Sources citations={cited} color={color} />}
              {lead && done && (
                <LeadForm
                  apiBase={apiBase}
                  botId={bot.id}
                  conversationId={conversationId}
                  question={question ? textOf(question) : ""}
                  color={color}
                  textOnColor={onColor}
                />
              )}
            </BotRow>
          );
        })}

        <AnimatePresence>
          {waiting && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BotRow bot={bot}>
                <Bubble>
                  <span className="flex items-center gap-1 py-1" aria-label={`${bot.name} is typing`}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                        animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </span>
                </Bubble>
              </BotRow>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center justify-center gap-2 text-[13px] text-red-700">
            Something went wrong.
            <button type="button" onClick={() => regenerate()} className="inline-flex items-center gap-1 font-medium underline underline-offset-2">
              <RotateCcw className="size-3" /> Retry
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="border-t border-black/[0.06] bg-white px-3 pb-2 pt-3"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-[#fbf8f4] py-1 pl-4 pr-1 focus-within:border-[var(--bot)] focus-within:ring-2 focus-within:ring-[var(--bot)]/20">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${bot.name} anything…`}
            aria-label="Your message"
            maxLength={1000}
            className="h-9 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-black/40"
          />
          {busy ? (
            <button type="button" onClick={() => stop()} aria-label="Stop" className="inline-flex size-9 items-center justify-center rounded-xl bg-black/5">
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="inline-flex size-9 items-center justify-center rounded-xl transition disabled:opacity-40"
              style={{ backgroundColor: color, color: onColor }}
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-black/40">
          {bot.showBranding ? (
            <a href="https://askdock.app" target="_blank" rel="noopener noreferrer" className="hover:text-black/60">
              Powered by <span className="font-semibold">AskDock</span>
            </a>
          ) : (
            "AI answers can be imperfect — check important details."
          )}
        </p>
      </form>
    </div>
  );
}

function BotRow({ bot, children }: { bot: ChatBotConfig; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <BotAvatar avatar={bot.avatar} name={bot.name} className="mt-0.5 size-7" />
      <div className="min-w-0 max-w-[86%] flex-1">{children}</div>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-fit max-w-full rounded-[18px] rounded-tl-md border border-black/[0.05] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[0_1px_2px_rgba(24,19,31,0.06)]">
      {children}
    </div>
  );
}

function Sources({ citations, color }: { citations: Citation[]; color: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    // Bring the expanded list into view inside the chat scroller once it has animated open.
    const id = setTimeout(() => ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 260);
    return () => clearTimeout(id);
  }, [open]);
  return (
    <div ref={ref} className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full px-1 text-[12px] font-medium text-black/55 transition hover:text-black/80"
      >
        {citations.length} {citations.length === 1 ? "source" : "sources"}
        <ChevronDown className={cn("size-3 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-1 space-y-1.5 overflow-hidden"
          >
            {citations.map((c) => (
              <li key={c.n} className="rounded-xl border border-black/[0.06] bg-white/70 p-2.5 text-[12px]">
                <p className="flex items-center gap-1.5 font-medium">
                  <span
                    className="inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    {c.n}
                  </span>
                  {c.url ? <Globe className="size-3 text-black/40" /> : <FileText className="size-3 text-black/40" />}
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:underline">
                      {c.title}
                    </a>
                  ) : (
                    <span className="truncate">{c.title}</span>
                  )}
                </p>
                <p className="mt-1 line-clamp-2 text-black/55">{c.snippet}</p>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
