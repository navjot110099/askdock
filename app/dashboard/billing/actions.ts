"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { env, hasStripe, isDemoMode } from "@/lib/env";
import type { PlanId } from "@/lib/plans";
import { priceIdFor, stripe } from "@/lib/stripe";

function parsePlan(value: FormDataEntryValue | null): PlanId | null {
  return value === "free" || value === "pro" || value === "business" ? value : null;
}

/** Sends the user to Stripe Checkout (test mode) for the chosen plan. */
export async function startCheckout(formData: FormData) {
  const user = await requireUser();
  const plan = parsePlan(formData.get("plan"));
  if (!plan) redirect("/dashboard/billing");

  if (!hasStripe) {
    // Without Stripe keys the demo workspace switches plans directly so limits can be explored.
    if (isDemoMode) {
      await repo.upsertSubscription({ userId: user.id, plan, status: "active" });
      redirect(`/dashboard/billing?checkout=demo&plan=${plan}`);
    }
    redirect("/dashboard/billing?checkout=unconfigured");
  }

  const sub = await repo.getSubscription(user.id);
  if (sub.stripeSubscriptionId) {
    // Existing subscribers change plans in the customer portal so proration is handled by Stripe.
    return openPortal();
  }
  const price = priceIdFor(plan);
  if (!price) redirect("/dashboard/billing");

  let customerId = sub.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
    customerId = customer.id;
    await repo.upsertSubscription({ userId: user.id, stripeCustomerId: customerId });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    success_url: `${env.appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${env.appUrl}/dashboard/billing?checkout=cancelled`,
  });
  redirect(session.url!);
}

/** Opens the Stripe customer portal for invoices, payment methods, plan changes and cancellation. */
export async function openPortal() {
  const user = await requireUser();
  if (!hasStripe) redirect("/dashboard/billing?checkout=unconfigured");
  const sub = await repo.getSubscription(user.id);
  if (!sub.stripeCustomerId) redirect("/dashboard/billing");
  const session = await stripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${env.appUrl}/dashboard/billing`,
  });
  redirect(session.url);
}
