import "server-only";
import { cache } from "react";
import { repo } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { startOfMonthIso } from "@/lib/rate-limit";

/** Plan + current usage for the signed-in owner; memoised per request. */
export const getWorkspace = cache(async (userId: string) => {
  const [subscription, messages, bots, sources] = await Promise.all([
    repo.getSubscription(userId),
    repo.countMessagesSince(userId, startOfMonthIso()),
    repo.countBots(userId),
    repo.countSources(userId),
  ]);
  const plan = getPlan(subscription.plan);
  return { subscription, plan, usage: { messages, bots, sources } };
});

export type Workspace = Awaited<ReturnType<typeof getWorkspace>>;
