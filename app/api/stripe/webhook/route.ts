import type Stripe from "stripe";
import { env, hasStripe } from "@/lib/env";
import { logger } from "@/lib/logger";
import { stripe, syncSubscription } from "@/lib/stripe";

const log = logger("stripe");

/**
 * Stripe → AskDock plan sync. Point a test-mode webhook endpoint (or
 * `stripe listen --forward-to localhost:3000/api/stripe/webhook`) here.
 */
export async function POST(req: Request) {
  if (!hasStripe || !env.stripeWebhookSecret) return new Response("Stripe is not configured", { status: 400 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, env.stripeWebhookSecret);
  } catch (error) {
    log.error("signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe().subscriptions.retrieve(
            typeof session.subscription === "string" ? session.subscription : session.subscription.id,
          );
          await syncSubscription(sub, session.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
    }
  } catch (error) {
    log.error(`failed to handle ${event.type}`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
