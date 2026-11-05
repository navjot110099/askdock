import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  Code2,
  Dumbbell,
  FileText,
  FileType2,
  Globe,
  Home,
  Inbox,
  Palette,
  Quote,
  Scale,
  Scissors,
  ShoppingBag,
  Stethoscope,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { Aurora } from "@/components/marketing/hero";
import { Reveal } from "@/components/marketing/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      <span className="h-px w-6 bg-brand-gradient" />
      {children}
    </p>
  );
}

function SectionTitle({ eyebrow, title, intro, center }: { eyebrow: string; title: React.ReactNode; intro?: string; center?: boolean }) {
  return (
    <Reveal className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 font-display text-[40px] leading-[1.02] tracking-[-0.015em] text-balance sm:text-[56px]">{title}</h2>
      {intro && <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground text-pretty">{intro}</p>}
    </Reveal>
  );
}

// ---------------------------------------------------------------------------

const INDUSTRIES = [
  { icon: Stethoscope, label: "Dental & health clinics" },
  { icon: Scissors, label: "Salons & spas" },
  { icon: Scale, label: "Law & accounting" },
  { icon: Dumbbell, label: "Gyms & studios" },
  { icon: UtensilsCrossed, label: "Restaurants & cafés" },
  { icon: Home, label: "Real estate" },
  { icon: Briefcase, label: "Agencies" },
  { icon: ShoppingBag, label: "Online shops" },
];

export function Industries() {
  const row = [...INDUSTRIES, ...INDUSTRIES];
  return (
    <section aria-label="Who it's for" className="border-y border-black/[0.05] bg-white/50 py-8">
      <p className="px-4 text-center text-[13px] text-muted-foreground">Made for businesses that answer the same twenty questions every day</p>
      <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 motion-reduce:animate-none">
          {row.map(({ icon: Icon, label }, i) => (
            <span key={i} className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[14px] text-foreground/80 shadow-sm">
              <Icon className="size-4 text-iris" /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const STEPS = [
  {
    n: "01",
    title: "Add what you already know",
    body: "Upload price lists, policies and guides as PDF or Word files, or paste your website address and AskDock reads the pages for you.",
    visual: (
      <div className="space-y-2">
        {[
          { icon: FileText, name: "Services-and-Pricing-2026.pdf", meta: "8 chunks", tone: "text-[#e0743f] bg-[#fff1e9]" },
          { icon: FileType2, name: "New-Patient-Guide.docx", meta: "7 chunks", tone: "text-iris bg-[#f1ebfd]" },
          { icon: Globe, name: "juniperdental.example", meta: "4 pages", tone: "text-lagoon bg-[#e6f6f7]" },
        ].map((f) => (
          <div key={f.name} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 shadow-sm">
            <span className={cn("flex size-8 items-center justify-center rounded-lg", f.tone)}>
              <f.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{f.name}</span>
            <span className="flex items-center gap-1 text-[12px] text-emerald-700">
              <Check className="size-3" /> {f.meta}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    n: "02",
    title: "Make it sound like you",
    body: "Pick a name, avatar and brand colour, write a welcome message and suggest the questions customers ask most.",
    visual: (
      <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          {["#23798a", "#8f67ee", "#ee5f92", "#ff8a4c", "#2f8f6a"].map((c, i) => (
            <span key={c} className={cn("size-7 rounded-full ring-offset-2", i === 0 && "ring-2 ring-[#23798a]")} style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-[#fbf8f4] p-3 text-[13px] leading-relaxed text-foreground/80">“Hi, I&apos;m Juni 👋 I can help with appointments, prices and insurance.”</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Opening hours?", "Cleaning price?", "Insurance?"].map((q) => (
            <span key={q} className="rounded-full border border-[#23798a]/30 px-2.5 py-1 text-[12px] text-[#23798a]">
              {q}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    n: "03",
    title: "Paste one line. Done.",
    body: "Copy a single script tag into WordPress, Wix, Squarespace, Shopify, Webflow or plain HTML. A chat bubble appears instantly.",
    visual: (
      <pre className="overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-[12px] leading-relaxed text-white/80 shadow-sm">
        <span className="text-[#ff9a6c]">&lt;script</span> <span className="text-[#c5b3ff]">src</span>=
        <span className="text-[#8fe3c9]">&quot;https://askdock.app/widget.js&quot;</span>
        {"\n  "}
        <span className="text-[#c5b3ff]">data-bot</span>=<span className="text-[#8fe3c9]">&quot;6a1d2c3e…&quot;</span>{" "}
        <span className="text-[#c5b3ff]">async</span>
        <span className="text-[#ff9a6c]">&gt;&lt;/script&gt;</span>
      </pre>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle
          eyebrow="How it works"
          title={<>From documents to answers in <em>three</em> calm steps.</>}
          intro="No developer and no training data: just the documents and website you already have."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08} className="flex min-w-0 flex-col rounded-[26px] border border-black/[0.06] bg-white/60 p-6 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur">
              <p className="font-display text-[44px] leading-none text-gradient">{step.n}</p>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
              <div className="mt-6 flex-1 content-end">{step.visual}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-[#f6f1eb] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle
          eyebrow="Features"
          title={<>Everything a front desk does — <em>minus the hold music.</em></>}
          intro="Grounded answers, honest “I don't know”s, and the follow-up details you need to turn a question into a booking."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          <FeatureCard className="md:col-span-4" title="Answers with receipts" body="Every reply is built only from your content and cites the exact document or page it came from, so customers (and you) can check it.">
            <div className="rounded-2xl bg-[#fbf8f4] p-4">
              <div className="w-fit max-w-md rounded-[16px] rounded-tl-md border border-black/[0.05] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm">
                A routine check-up and cleaning is $129 <Chip n={1} />. With insurance, your cost is usually lower <Chip n={2} />.
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  ["Services & Pricing 2026", "Check-ups and cleanings"],
                  ["Insurance & Payment Policy", "Insurance we accept"],
                ].map(([t, s], i) => (
                  <div key={t} className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-white p-2.5 text-[12px]">
                    <Chip n={i + 1} />
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="text-muted-foreground">{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-2" title="Never lose a lead" body="When the bot can't answer, it says so — and offers to have your team follow up.">
            <div className="space-y-2 rounded-2xl bg-[#fbf8f4] p-3">
              <div className="flex gap-2">
                <span className="flex h-9 flex-1 items-center rounded-lg border border-black/10 bg-white px-2.5 text-[12px] text-muted-foreground">you@email.com</span>
                <span className="flex h-9 items-center rounded-lg bg-ink px-3 text-[12px] font-medium text-white">Send</span>
              </div>
              <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Inbox className="size-3.5 text-iris" /> Leads land in your dashboard
              </p>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-2" title="Learns from what you have" body="PDF, Word, text and Markdown files plus website crawls. Add or remove sources whenever things change.">
            <div className="flex flex-wrap gap-2">
              {["PDF", "DOCX", "TXT", "Markdown", "Website URL"].map((t) => (
                <span key={t} className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[13px]">
                  {t}
                </span>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-2" title="On-brand in a minute" body="Name, avatar, colour, greeting and suggested questions — previewed live as you type." icon={Palette} />

          <FeatureCard className="md:col-span-2" title="One line to install" body="A lightweight script adds a chat bubble to any site. No plugins, no developer needed." icon={Code2} />

          <FeatureCard className="md:col-span-6" title="Know what customers are really asking" body="Messages per day, your most common questions and every question the bot couldn't answer — so you know what to add next.">
            <div className="grid gap-4 rounded-2xl bg-[#fbf8f4] p-4 sm:grid-cols-[1.5fr_1fr]">
              <svg viewBox="0 0 400 120" className="h-32 w-full" aria-hidden>
                <defs>
                  <linearGradient id="feat-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#8f67ee" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#8f67ee" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="feat-line" x1="0" x2="1">
                    <stop offset="0" stopColor="#ff9a6c" />
                    <stop offset=".5" stopColor="#ee5f92" />
                    <stop offset="1" stopColor="#8f67ee" />
                  </linearGradient>
                </defs>
                <path d="M0 95 C30 90 50 70 80 76 S130 60 160 64 S210 40 240 48 S300 28 330 30 S380 14 400 12 L400 120 L0 120 Z" fill="url(#feat-area)" />
                <path d="M0 95 C30 90 50 70 80 76 S130 60 160 64 S210 40 240 48 S300 28 330 30 S380 14 400 12" fill="none" stroke="url(#feat-line)" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <ul className="space-y-2 text-[13px]">
                {[
                  ["What are your opening hours?", 64],
                  ["How much is a cleaning?", 51],
                  ["Do you take my insurance?", 43],
                ].map(([q, n]) => (
                  <li key={q} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                    <span className="truncate">{q}</span>
                    <span className="font-mono text-[12px] text-muted-foreground">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function Chip({ n }: { n: number }) {
  return <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-iris/15 text-[10px] font-semibold text-iris align-[2px]">{n}</span>;
}

function FeatureCard({
  title,
  body,
  children,
  className,
  icon: Icon,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
  className?: string;
  icon?: typeof BarChart3;
}) {
  return (
    <Reveal className={cn("flex min-w-0 flex-col gap-5 rounded-[26px] border border-black/[0.06] bg-white p-6 shadow-[0_20px_50px_-35px_rgba(24,19,31,0.35)]", className)}>
      {Icon && (
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm">
          <Icon className="size-5" />
        </span>
      )}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {children && <div className="mt-auto">{children}</div>}
    </Reveal>
  );
}

// ---------------------------------------------------------------------------

export function Pricing({ ctaHref = "/signup" }: { ctaHref?: string }) {
  return (
    <section id="pricing" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle
          center
          eyebrow="Pricing"
          title={<>Simple plans that <em>grow with you.</em></>}
          intro="Start free on one website. Upgrade when your assistant gets busy — billed monthly, cancel anytime."
        />
        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {PLAN_ORDER.map((id, i) => {
            const plan = PLANS[id];
            const featured = id === "pro";
            return (
              <Reveal
                key={id}
                delay={i * 0.06}
                className={cn(
                  "relative flex flex-col rounded-[28px] p-7",
                  featured ? "gradient-border bg-white shadow-[0_40px_90px_-40px_rgba(143,103,238,0.55)] lg:-my-3 lg:py-10" : "border border-black/[0.07] bg-white/70",
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-brand-gradient px-3 py-1 text-[12px] font-semibold text-white shadow-sm">Most popular</span>
                )}
                <p className="text-[15px] font-semibold">{plan.name}</p>
                <p className="mt-1 text-[14px] text-muted-foreground">{plan.tagline}</p>
                <p className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-[56px] leading-none">${plan.priceMonthly}</span>
                  <span className="text-[14px] text-muted-foreground">/ month</span>
                </p>
                <Button asChild size="lg" variant={featured ? "default" : "outline"} className="mt-7 h-11 rounded-xl">
                  <Link href={id === "free" ? ctaHref : `${ctaHref}?plan=${id}`}>
                    {id === "free" ? "Start free" : `Choose ${plan.name}`} <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <ul className="mt-7 space-y-3 text-[14px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-iris" : "text-lagoon")} />
                      {f}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-8 text-center text-[13px] text-muted-foreground">Prices in USD. Payments are processed securely by Stripe.</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const FAQS = [
  {
    q: "What can I train my chatbot on?",
    a: "PDF, Word (.docx), plain-text and Markdown files, plus any public website — paste the address and AskDock crawls up to your plan's page limit. Most small businesses start with a price list, a policies document and their website.",
  },
  {
    q: "Will the bot make things up?",
    a: "AskDock is designed not to. It retrieves the most relevant passages from your content and is instructed to answer only from them, citing each source. If nothing relevant is found, it says it doesn't know instead of guessing.",
  },
  {
    q: "What happens when a customer asks something it can't answer?",
    a: "On Pro and Business plans the assistant offers a short form so the visitor can leave their email. The lead, their question and the full conversation appear in your dashboard, and the question shows up in analytics so you know what to add.",
  },
  {
    q: "How do I add it to my website?",
    a: "Copy one script tag from the Install tab and paste it before the closing </body> tag — or into your site builder's custom-code setting. It works with WordPress, Wix, Squarespace, Shopify, Webflow and hand-coded sites.",
  },
  {
    q: "Which AI powers AskDock, and is my data used for training?",
    a: "Answers are generated with OpenAI models and your content is indexed with OpenAI embeddings stored in your own Supabase database. Data sent through the OpenAI API isn't used to train their models by default.",
  },
  {
    q: "What counts as a message?",
    a: "Each question a visitor sends counts as one message; the assistant's replies are free. Limits reset on the first of every month and cover all of your bots.",
  },
  {
    q: "Can I change or cancel my plan?",
    a: "Yes. Upgrade, downgrade or cancel at any time from the billing page, which opens Stripe's secure customer portal. If you cancel, you keep your plan until the end of the billing period, then move to Free.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-[#f6f1eb] py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionTitle eyebrow="FAQ" title={<>Questions, <em>answered</em> (with sources).</>} />
          <Reveal delay={0.1} className="mt-8 hidden rounded-[26px] border border-black/[0.06] bg-white p-6 lg:block">
            <Quote className="size-6 text-rose" />
            <p className="mt-3 font-display text-2xl leading-snug">
              Half our phone calls were the same five questions. Now Juni answers them, and we only hear about the ones that need a person.
            </p>
            <p className="mt-4 text-[13px] text-muted-foreground">Front-desk lead, Juniper Dental Studio (demo customer)</p>
          </Reveal>
        </div>
        <Reveal delay={0.05}>
          <Accordion type="single" collapsible defaultValue="item-0" className="rounded-[26px] border border-black/[0.06] bg-white px-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="py-5 text-left text-[16px] font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function FinalCta() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-ink px-6 py-16 text-center text-white sm:px-12 sm:py-24">
        <Aurora className="opacity-80" />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl font-display text-[40px] leading-[1.02] text-balance sm:text-[64px]">
            Give customers answers — and yourself <em className="text-gradient">an evening off.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] text-white/70">Create your first assistant for free. It takes about five minutes.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-2xl bg-white px-6 text-[15px] text-ink hover:bg-white/90">
              <Link href="/signup">
                Start free <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-2xl px-6 text-[15px] text-white hover:bg-white/10 hover:text-white">
              <Link href="/widget-demo">See it on a real website</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
