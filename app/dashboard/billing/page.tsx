import { CalendarClock, Check, CheckCircle2, CreditCard, Info, Sparkles, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { openPortal, startCheckout } from "@/app/dashboard/billing/actions";
import { SubmitButton } from "@/app/dashboard/billing/submit-button";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { hasStripe, isDemoMode } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Billing" };

const NOTICES = {
  success: { icon: CheckCircle2, tone: "border-emerald-200 bg-emerald-50 text-emerald-800", text: "Payment received — your plan updates as soon as Stripe confirms it (usually a few seconds)." },
  cancelled: { icon: XCircle, tone: "border-amber-200 bg-amber-50 text-amber-800", text: "Checkout was cancelled. You haven't been charged." },
  demo: { icon: Info, tone: "border-iris/20 bg-accent text-accent-foreground", text: "Demo mode: Stripe isn't configured, so the plan was switched instantly without payment." },
  unconfigured: { icon: Info, tone: "border-amber-200 bg-amber-50 text-amber-800", text: "Stripe isn't configured yet. Add your test-mode keys and price IDs to .env.local to enable checkout." },
} as const;

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; upgrade?: string }> }) {
  const [sp, user] = await Promise.all([searchParams, requireUser()]);
  const { plan, subscription, usage } = await getWorkspace(user.id);
  const notice = NOTICES[sp.checkout as keyof typeof NOTICES];
  const highlight = sp.upgrade === "pro" || sp.upgrade === "business" ? sp.upgrade : null;

  const meters = [
    { label: "Visitor messages this month", used: usage.messages, limit: plan.limits.messagesPerMonth },
    { label: "Bots", used: usage.bots, limit: plan.limits.bots },
    { label: "Knowledge sources", used: usage.sources, limit: plan.limits.sources },
  ];

  return (
    <>
      <PageHeader title="Billing" description="Your plan, usage and invoices. Payments are handled securely by Stripe." />

      {notice && (
        <div className={cn("mb-6 flex items-start gap-3 rounded-2xl border px-5 py-4 text-[14px]", notice.tone)} role="status">
          <notice.icon className="mt-0.5 size-4 shrink-0" /> {notice.text}
        </div>
      )}
      {highlight && !notice && plan.id === "free" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-iris/20 bg-accent px-5 py-4 text-[14px] text-accent-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" /> Your account is ready. Finish upgrading to {PLANS[highlight].name} below.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="Current plan">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-[44px] leading-none">{plan.name}</p>
              <p className="mt-2 text-[14px] text-muted-foreground">
                ${plan.priceMonthly}/month · <span className="capitalize">{subscription.status.replace("_", " ")}</span>
              </p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
              <CreditCard className="size-5" />
            </span>
          </div>
          {subscription.currentPeriodEnd && plan.id !== "free" && (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-[#fbf8f4] px-3 py-2.5 text-[13px]">
              <CalendarClock className="size-4 text-muted-foreground" />
              {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on {formatDate(subscription.currentPeriodEnd)}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {subscription.stripeCustomerId && hasStripe && (
              <form action={openPortal}>
                <SubmitButton variant="outline" size="lg" className="h-10 rounded-xl bg-white">
                  Manage billing & invoices
                </SubmitButton>
              </form>
            )}
            {isDemoMode && !hasStripe && plan.id !== "free" && (
              <form action={startCheckout}>
                <input type="hidden" name="plan" value="free" />
                <SubmitButton variant="outline" size="lg" className="h-10 rounded-xl bg-white">
                  Switch to Free (demo)
                </SubmitButton>
              </form>
            )}
          </div>
          {hasStripe && (
            <p className="mt-4 text-[12px] text-muted-foreground">
              Stripe test mode — pay with card <span className="font-mono">4242 4242 4242 4242</span>, any future expiry and any CVC.
            </p>
          )}
        </Panel>

        <Panel title="Usage" description="Limits reset on the 1st of every month.">
          <div className="space-y-5">
            {meters.map((m) => {
              const pct = Math.min(100, Math.round((m.used / m.limit) * 100));
              return (
                <div key={m.label}>
                  <div className="flex justify-between text-[14px]">
                    <span>{m.label}</span>
                    <span className="font-mono text-[13px] text-muted-foreground">
                      {m.used.toLocaleString()} / {m.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={cn("mt-2 h-2", pct >= 90 ? "[&>[data-slot=progress-indicator]]:bg-red-500" : "[&>[data-slot=progress-indicator]]:bg-brand-gradient")}
                  />
                  {pct >= 90 && <p className="mt-1 text-[12px] text-red-600">Almost at your limit — upgrade to avoid interruptions.</p>}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <h2 className="mb-4 mt-10 text-[15px] font-semibold">Plans</h2>
      <div className="grid gap-5 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const current = id === plan.id;
          const nextUp = PLAN_ORDER[PLAN_ORDER.indexOf(plan.id) + 1];
          const featured = highlight ? id === highlight : id === nextUp;
          const isUpgrade = PLAN_ORDER.indexOf(id) > PLAN_ORDER.indexOf(plan.id);
          return (
            <div key={id} className={cn("relative flex flex-col rounded-[24px] p-6", featured && !current ? "gradient-border bg-white shadow-[0_30px_70px_-40px_rgba(143,103,238,0.6)]" : "border border-black/[0.06] bg-white")}>
              {current && <span className="absolute right-5 top-5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">Current plan</span>}
              <p className="font-semibold">{p.name}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{p.tagline}</p>
              <p className="mt-4">
                <span className="font-display text-[44px] leading-none">${p.priceMonthly}</span>
                <span className="text-[13px] text-muted-foreground"> / month</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-[14px]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-iris" /> {f}
                  </li>
                ))}
              </ul>
              <form action={startCheckout} className="mt-6">
                <input type="hidden" name="plan" value={id} />
                {current ? (
                  <SubmitButton disabled variant="outline" className="h-10 w-full rounded-xl">
                    Your current plan
                  </SubmitButton>
                ) : id === "free" ? (
                  subscription.stripeCustomerId && hasStripe ? (
                    <SubmitButton formAction={openPortal} variant="outline" className="h-10 w-full rounded-xl">
                      Downgrade in billing portal
                    </SubmitButton>
                  ) : (
                    <SubmitButton variant="outline" className="h-10 w-full rounded-xl">
                      Switch to Free
                    </SubmitButton>
                  )
                ) : (
                  <SubmitButton variant={featured ? "default" : "outline"} className="h-10 w-full rounded-xl">
                    {isUpgrade ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
                  </SubmitButton>
                )}
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}
