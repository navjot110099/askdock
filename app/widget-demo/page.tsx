import { ArrowLeft, Clock, MapPin, Phone, ShieldCheck, Smile, Sparkles, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { repo } from "@/lib/db";
import { DEMO_BOT_ID } from "@/lib/demo/constants";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Example site — AskDock on a clinic website",
  description: "See the AskDock chat widget running on an example clinic website.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const SERVICES = [
  { icon: Stethoscope, title: "Check-ups & cleaning", price: "$129", body: "Unhurried exams with low-dose digital X-rays." },
  { icon: Sparkles, title: "Teeth whitening", price: "$449", body: "In-chair whitening plus take-home touch-up trays." },
  { icon: Smile, title: "Clear aligners", price: "from $3,800", body: "Free consultation with a 3D smile preview." },
  { icon: ShieldCheck, title: "Smile Club", price: "$29/mo", body: "No insurance? Two cleanings, X-rays and 15% off." },
];

/**
 * A sample clinic website with the real AskDock embed snippet on it, so the
 * widget can be tried exactly as a customer's visitors would see it.
 */
export default async function WidgetDemoPage({ searchParams }: { searchParams: Promise<{ bot?: string }> }) {
  const { bot: requested } = await searchParams;
  const bot = (requested && (await repo.getPublicBot(requested))) || (await repo.getPublicBot(env.demoBotId || DEMO_BOT_ID));

  return (
    <div className="min-h-dvh bg-[#f4f9f9] text-[#123b42]">
      <div className="bg-ink px-4 py-2 text-center text-[12px] text-white/80">
        Example website · The chat bubble in the corner is AskDock →{" "}
        <Link href="/" className="inline-flex items-center gap-1 font-semibold text-white underline-offset-2 hover:underline">
          <ArrowLeft className="size-3" /> Back to AskDock
        </Link>
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <p className="text-[17px] font-semibold tracking-tight">
          Juniper <span className="font-normal">Dental Studio</span>
        </p>
        <nav className="hidden gap-8 text-[14px] text-[#15474f]/70 md:flex" aria-label="Clinic">
          <span>Services</span>
          <span>Pricing</span>
          <span>Insurance</span>
          <span>Visit us</span>
        </nav>
        <span className="rounded-full bg-[#2b8c9b] px-4 py-2 text-[13px] font-medium text-white">Book a visit</span>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#2b8c9b]">Family & cosmetic dentistry · Brookhaven</p>
            <h1 className="mt-4 font-display text-[48px] leading-[1.02] sm:text-[68px]">
              Calm, modern dentistry — <em>without the waiting room dread.</em>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-[#15474f]/75">
              Unhurried appointments, clear prices and a team that explains everything before we start. New patients are usually seen within the same week.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#2b8c9b] px-5 py-3 text-[14px] font-medium text-white">Book online</span>
              <span className="rounded-full border border-[#2b8c9b]/30 bg-white px-5 py-3 text-[14px] font-medium">Call (555) 014-2290</span>
            </div>
          </div>
          <div className="relative h-[340px] overflow-hidden rounded-[36px] bg-[radial-gradient(120%_90%_at_20%_10%,#bfe7e6,transparent_60%),radial-gradient(90%_80%_at_90%_90%,#a7d3f0,transparent_55%),linear-gradient(160deg,#dff3f1,#cfe8f3)] sm:h-[420px]">
            <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/80 p-5 backdrop-blur">
              <p className="font-display text-2xl">“The calmest dental visit I&apos;ve ever had.”</p>
              <p className="mt-1 text-[13px] text-[#15474f]/60">Patient review</p>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-display text-[40px]">Treatments & prices</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map(({ icon: Icon, title, price, body }) => (
                <div key={title} className="rounded-3xl bg-[#f4f9f9] p-6">
                  <Icon className="size-6 text-[#2b8c9b]" />
                  <p className="mt-4 font-semibold">{title}</p>
                  <p className="font-display text-2xl text-[#2b8c9b]">{price}</p>
                  <p className="mt-2 text-[14px] text-[#15474f]/70">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-8 md:grid-cols-3">
          {[
            { icon: Clock, title: "Opening hours", body: "Mon–Thu 8–6 · Fri 8–3 · alternate Saturdays 9–2" },
            { icon: MapPin, title: "Find us", body: "48 Harbour Lane, Suite 200, Brookhaven. Free parking behind the building." },
            { icon: Phone, title: "Emergencies", body: "Same-day slots every weekday morning. Call (555) 014-2290." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2b8c9b] shadow-sm">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-[14px] text-[#15474f]/70">{body}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[#2b8c9b]/10 py-8 text-center text-[12px] text-[#15474f]/60">
        Juniper Dental Studio · a sample site showing the AskDock widget in place.
      </footer>

      {bot && <script src="/widget.js" data-bot={bot.id} async />}
    </div>
  );
}
