"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { Button } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease } };

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      <Aurora />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fade(0)}>
            <Link
              href="/#demo"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white/70 py-1 pl-1.5 pr-3 text-[13px] shadow-sm backdrop-blur transition hover:bg-white"
            >
              <span className="rounded-full bg-brand-gradient px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
              Lead capture when your bot doesn&apos;t know
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          </motion.div>

          <motion.h1 {...fade(0.08)} className="mt-7 font-display text-[44px] leading-[0.98] tracking-[-0.02em] text-balance sm:text-[76px] lg:text-[92px]">
            Turn your website into a <em className="text-gradient pr-2">front desk</em> that never sleeps.
          </motion.h1>

          <motion.p {...fade(0.16)} className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            AskDock learns your PDFs, docs and website, answers customers around the clock with cited sources, and collects an email
            whenever it doesn&apos;t know.
          </motion.p>

          <motion.div {...fade(0.24)} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 w-full rounded-2xl px-6 text-[15px] shadow-[0_14px_30px_-12px_rgba(24,19,31,0.6)] sm:w-auto">
              <Link href="/signup">
                Start free — no card needed <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-2xl bg-white/70 px-6 text-[15px] backdrop-blur sm:w-auto">
              <Link href="/#demo">Try the live demo</Link>
            </Button>
          </motion.div>

          <motion.ul {...fade(0.3)} className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            {["Set up in 5 minutes", "Works on any website", "Cancel anytime"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-lagoon" /> {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease }}
          className="mt-16 sm:mt-20"
        >
          <HeroDemo />
        </motion.div>
      </div>
    </section>
  );
}

export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -left-[10%] -top-[18%] h-[620px] w-[620px] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(255,154,108,0.42),transparent_62%)] blur-2xl" />
      <div className="absolute left-[30%] -top-[26%] h-[560px] w-[760px] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(238,95,146,0.30),transparent_60%)] blur-2xl [animation-delay:-6s]" />
      <div className="absolute -right-[12%] -top-[10%] h-[640px] w-[640px] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(143,103,238,0.34),transparent_62%)] blur-2xl [animation-delay:-11s]" />
      <div className="absolute right-[18%] top-[30%] h-[420px] w-[520px] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(63,181,194,0.22),transparent_62%)] blur-2xl [animation-delay:-3s]" />
      <div className="paper-grain absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
    </div>
  );
}
