"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, FileText, Inbox, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { BotAvatar } from "@/components/bot-avatar";

const TEAL = "#23798a";

const ANSWER_1 =
  "Yes — we're in-network with most PPO dental plans, and we'll check your benefits before your first visit [1]. No insurance? Our Smile Club is $29/month [2].";
const ANSWER_2 = "I couldn't find that in Juniper Dental's information, so I'd rather not guess. Leave your email and the team will follow up.";

// Timeline (ms) for the looping scripted conversation.
const STEPS = [700, 1500, 2300, 5200, 6400, 7300, 8100, 9800, 10600, 15500];

export function HeroDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? STEPS.length - 1 : 0);

  useEffect(() => {
    if (reduce) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setStep(0);
      timers = STEPS.map((t, i) => setTimeout(() => (i === STEPS.length - 1 ? run() : setStep(i + 1)), t));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      {/* Floating proof cards (desktop) */}
      <FloatCard className="-left-6 top-16 hidden lg:flex" delay={0.6}>
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff1e9] text-[#e0743f]">
          <FileText className="size-4" />
        </span>
        <div>
          <p className="text-[13px] font-semibold">Services-and-Pricing-2026.pdf</p>
          <p className="text-[12px] text-muted-foreground">Indexed · 8 chunks · 2 sec</p>
        </div>
      </FloatCard>
      <AnimatePresence>
        {step >= 8 && (
          <FloatCard key="lead" className="-left-10 bottom-24 hidden lg:flex" delay={0}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#f1ebfd] text-iris">
              <Inbox className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold">New lead captured</p>
              <p className="text-[12px] text-muted-foreground">sam.rivera@example.com · “veneers?”</p>
            </div>
          </FloatCard>
        )}
      </AnimatePresence>
      <FloatCard className="-right-6 top-10 hidden xl:flex" delay={0.9}>
        <div>
          <p className="text-[12px] text-muted-foreground">Answered this week</p>
          <p className="font-display text-3xl leading-none">
            94<span className="text-lg">%</span>
          </p>
        </div>
        <svg viewBox="0 0 80 32" className="h-8 w-20" aria-hidden>
          <defs>
            <linearGradient id="spark" x1="0" x2="1">
              <stop offset="0" stopColor="#ee5f92" />
              <stop offset="1" stopColor="#8f67ee" />
            </linearGradient>
          </defs>
          <path d="M2 26 L14 22 L26 24 L38 15 L50 17 L62 9 L78 5" fill="none" stroke="url(#spark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </FloatCard>

      {/* Browser frame */}
      <div className="relative overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_50px_120px_-40px_rgba(24,19,31,0.45),0_18px_40px_-24px_rgba(24,19,31,0.3)]">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f7f3ee] px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff6b5f]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#28c940]" />
          <div className="mx-auto flex h-7 w-full max-w-xs items-center justify-center rounded-lg bg-white px-3 text-[12px] text-muted-foreground ring-1 ring-black/[0.05]">
            juniperdental.example
          </div>
        </div>

        <div className="relative h-[560px] sm:h-[600px]">
          <ClinicSite />
          {/* Chat panel */}
          <div className="absolute inset-x-3 bottom-3 top-24 sm:inset-x-auto sm:right-6 sm:top-auto sm:bottom-6 sm:h-[500px] sm:w-[360px]">
            <ScriptedChat step={step} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatCard({ children, className, delay }: { children: React.ReactNode; className?: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute z-20 items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/90 px-4 py-3 shadow-[0_20px_50px_-22px_rgba(24,19,31,0.45)] backdrop-blur ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ClinicSite() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f4f9f9]">
      <div className="flex items-center justify-between px-6 py-4 sm:px-10">
        <p className="text-[15px] font-semibold tracking-tight text-[#15474f]">
          Juniper <span className="font-normal">Dental Studio</span>
        </p>
        <div className="hidden gap-6 text-[13px] text-[#15474f]/70 md:flex">
          <span>Services</span>
          <span>Pricing</span>
          <span>Insurance</span>
          <span>Visit</span>
        </div>
        <span className="rounded-full px-3.5 py-1.5 text-[12px] font-medium text-white" style={{ backgroundColor: TEAL }}>
          Book a visit
        </span>
      </div>
      <div className="grid gap-8 px-6 pt-6 sm:px-10 sm:pt-10 md:grid-cols-[1.1fr_1fr]">
        <div className="max-w-md">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#2b8c9b]">Family & cosmetic dentistry</p>
          <h3 className="mt-3 font-display text-[40px] leading-[1.02] text-[#123b42] sm:text-[54px]">
            Calm, modern dentistry in <em>Brookhaven</em>.
          </h3>
          <p className="mt-4 hidden max-w-sm text-[14px] leading-relaxed text-[#15474f]/70 sm:block">
            Unhurried appointments, clear prices and a team that explains everything before we start.
          </p>
          <div className="mt-6 hidden gap-3 sm:flex">
            {[
              ["Check-up & clean", "$129"],
              ["Whitening", "$449"],
              ["Aligners", "from $3,800"],
            ].map(([label, price]) => (
              <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#2b8c9b]/10">
                <p className="text-[11px] text-[#15474f]/60">{label}</p>
                <p className="text-[14px] font-semibold text-[#123b42]">{price}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden h-[360px] md:block">
          <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(120%_90%_at_20%_10%,#bfe7e6,transparent_60%),radial-gradient(90%_80%_at_90%_90%,#a7d3f0,transparent_55%),linear-gradient(160deg,#dff3f1,#cfe8f3)]" />
          <div className="absolute left-10 top-12 h-40 w-40 rounded-full bg-white/50 blur-2xl" />
        </div>
      </div>
    </div>
  );
}

function useTypewriter(text: string, active: boolean) {
  const [count, setCount] = useState(0);
  const words = text.split(" ");
  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    setCount(0);
    const id = setInterval(() => setCount((c) => (c >= words.length ? c : c + 1)), 55);
    return () => clearInterval(id);
  }, [active, words.length]);
  return words.slice(0, count).join(" ");
}

function Cite({ n }: { n: number }) {
  return (
    <sup className="mx-px">
      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold" style={{ backgroundColor: `${TEAL}1f`, color: TEAL }}>
        {n}
      </span>
    </sup>
  );
}

function withCites(text: string) {
  return text.split(/(\[\d\])/).map((part, i) => (/^\[\d\]$/.test(part) ? <Cite key={i} n={Number(part[1])} /> : <span key={i}>{part}</span>));
}

function ScriptedChat({ step }: { step: number }) {
  const a1 = useTypewriter(ANSWER_1, step >= 3);
  const a2 = useTypewriter(ANSWER_2, step >= 7);
  const pop = { initial: { opacity: 0, y: 10, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.35 } };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-[#fbf8f4] shadow-[0_30px_80px_-30px_rgba(24,19,31,0.5)]">
      <div className="relative flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: TEAL }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
        <BotAvatar avatar="preset:tooth" name="Juni" className="relative size-9 ring-2 ring-white/40" />
        <div className="relative">
          <p className="text-[14px] font-semibold leading-tight">Juni</p>
          <p className="flex items-center gap-1.5 text-[11px] opacity-85">
            <span className="size-1.5 rounded-full bg-emerald-300" /> Online · replies instantly
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden px-3.5 py-4 text-[13px] leading-relaxed">
        <Row>
          <Bubble>Hi, I&apos;m Juni 👋 Ask me about appointments, prices or insurance.</Bubble>
        </Row>
        {step >= 1 && (
          <motion.div {...pop} className="flex justify-end">
            <span className="rounded-[16px] rounded-br-md px-3 py-2 text-white" style={{ backgroundColor: TEAL }}>
              Do you take my insurance?
            </span>
          </motion.div>
        )}
        {step === 2 && <Typing />}
        {step >= 3 && (
          <motion.div {...pop}>
            <Row>
              <Bubble>{withCites(a1)}</Bubble>
              {step >= 4 && (
                <motion.p {...pop} className="mt-1 flex items-center gap-1 px-1 text-[11px] font-medium text-black/50">
                  2 sources · Insurance &amp; Payment Policy <ChevronDown className="size-3" />
                </motion.p>
              )}
            </Row>
          </motion.div>
        )}
        {step >= 5 && (
          <motion.div {...pop} className="flex justify-end">
            <span className="rounded-[16px] rounded-br-md px-3 py-2 text-white" style={{ backgroundColor: TEAL }}>
              Do you offer veneers?
            </span>
          </motion.div>
        )}
        {step === 6 && <Typing />}
        {step >= 7 && (
          <motion.div {...pop}>
            <Row>
              <Bubble>{a2}</Bubble>
              {step >= 8 && (
                <motion.div {...pop} className="mt-2 rounded-xl border border-black/[0.07] bg-white p-2.5 shadow-sm">
                  <div className="flex gap-2">
                    <span className="flex h-8 flex-1 items-center rounded-lg border border-black/10 bg-[#fbf8f4] px-2.5 text-[12px]">sam.rivera@example.com</span>
                    <span className="flex h-8 items-center rounded-lg px-3 text-[12px] font-medium text-white" style={{ backgroundColor: TEAL }}>
                      {step >= 9 ? <Check className="size-3.5" /> : "Send"}
                    </span>
                  </div>
                  {step >= 9 && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700">
                      <Sparkles className="size-3" /> Saved — the team will be in touch.
                    </p>
                  )}
                </motion.div>
              )}
            </Row>
          </motion.div>
        )}
      </div>

      <div className="border-t border-black/[0.06] bg-white px-3 py-2.5">
        <div className="flex h-10 items-center rounded-xl border border-black/10 bg-[#fbf8f4] px-3 text-[12px] text-black/40">Ask Juni anything…</div>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <BotAvatar avatar="preset:tooth" name="Juni" className="mt-0.5 size-6" />
      <div className="min-w-0 max-w-[88%]">{children}</div>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[16px] rounded-tl-md border border-black/[0.05] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(24,19,31,0.06)]">{children}</div>;
}

function Typing() {
  return (
    <Row>
      <Bubble>
        <span className="flex gap-1 py-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full"
              style={{ backgroundColor: TEAL }}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      </Bubble>
    </Row>
  );
}
