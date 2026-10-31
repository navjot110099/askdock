import "server-only";
import Stripe from "stripe";
import { repo } from "@/lib/db";
import { env } from "@/lib/env";
import type { PlanId } from "@/lib/plans";

let client: Stripe | undefined;

export function stripe() {
  client ??= new Stripe(env.stripeSecretKey, { appInfo: { name: "AskDock" } });
  return client;
}

export function priceIdFor(plan: PlanId) {
  return plan === "business" ? env.stripePriceBusiness : plan === "pro" ? env.stripePricePro : null;
}

function planForPrice(priceId: string | undefined): PlanId {
  if (priceId && priceId === env.stripePriceBusiness) return "business";
  if (priceId && priceId === env.stripePricePro) return "pro";
  return "free";
}

/** Mirrors a Stripe subscription onto our `subscriptions` row. */
export async function syncSubscription(sub: Stripe.Subscription, userIdHint?: string | null) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = userIdHint || sub.metadata?.userId || (await repo.findUserIdByStripeCustomer(customerId));
  if (!userId) throw new Error(`No AskDock user for Stripe customer ${customerId}`);

  const item = sub.items.data[0];
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  await repo.upsertSubscription({
    userId,
    plan: active ? planForPrice(item?.price.id) : "free",
    status: sub.status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.status === "canceled" ? null : sub.id,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  });
}
