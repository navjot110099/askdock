import { Check, Info } from "lucide-react";
import { BotAvatar } from "@/components/bot-avatar";
import { Logo } from "@/components/brand/logo";
import { Aurora } from "@/components/marketing/hero";

export function AuthShell({ title, subtitle, demo, children }: { title: React.ReactNode; subtitle: string; demo: boolean; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.015em] sm:text-5xl">{title}</h1>
          <p className="mt-3 text-[15px] text-muted-foreground">{subtitle}</p>
          {demo && (
            <p className="mt-6 flex gap-2.5 rounded-2xl border border-iris/20 bg-accent px-4 py-3 text-[13px] leading-relaxed text-accent-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>Demo mode.</strong> Supabase keys aren&apos;t configured, so any sign-in opens the seeded Juniper Dental workspace.
              </span>
            </p>
          )}
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-[12px] text-muted-foreground">
          Demo project by <span className="font-semibold text-foreground">OVIOWEB</span>
        </p>
      </main>

      <aside className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Aurora className="opacity-90" />
        <div className="relative">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">Why teams switch to AskDock</p>
          <ul className="mt-6 space-y-3 text-[15px] text-white/85">
            {["Answers grounded in your own documents", "Citations on every reply", "Leads captured when the bot can't help", "Live on your site with one line"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md space-y-3">
          <div className="ml-auto w-fit rounded-[18px] rounded-br-md bg-[#23798a] px-4 py-2.5 text-[14px]">Are you open on Saturdays?</div>
          <div className="flex items-start gap-2.5">
            <BotAvatar avatar="preset:tooth" name="Juni" className="size-8" />
            <div className="rounded-[18px] rounded-tl-md bg-white px-4 py-3 text-[14px] leading-relaxed text-ink shadow-xl">
              Yes — alternate Saturdays, 9:00 am to 2:00 pm. You can check which ones in online booking.
              <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-[#23798a]/15 align-[2px] text-[10px] font-semibold text-[#23798a]">1</span>
              <p className="mt-2 border-t border-black/5 pt-2 text-[12px] text-black/50">Source · Hours &amp; location</p>
            </div>
          </div>
        </div>

        <figure className="relative">
          <blockquote className="font-display text-[30px] leading-[1.15]">
            “It&apos;s like hiring a receptionist who has read every page of our website — and never takes a lunch break.”
          </blockquote>
          <figcaption className="mt-4 text-[13px] text-white/60">Demo testimonial · Juniper Dental Studio (fictional)</figcaption>
        </figure>
      </aside>
    </div>
  );
}
