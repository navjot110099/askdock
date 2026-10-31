import type { Metadata } from "next";
import Link from "next/link";
import { NewBotForm } from "@/app/dashboard/bots/new/new-bot-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "New bot" };

export default async function NewBotPage() {
  const user = await requireUser();
  const { plan, usage } = await getWorkspace(user.id);
  const atLimit = usage.bots >= plan.limits.bots;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={
          <Link href="/dashboard/bots" className="hover:text-foreground">
            ← Bots
          </Link>
        }
        title={
          <>
            Create a new <em>assistant.</em>
          </>
        }
        description="Start with the basics — you'll add knowledge and fine-tune the look on the next screens."
      />
      {atLimit ? (
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-8 text-center">
          <p className="font-semibold">You&apos;ve reached the {plan.name} plan limit of {plan.limits.bots} bot{plan.limits.bots === 1 ? "" : "s"}.</p>
          <p className="mt-1 text-[14px] text-muted-foreground">Upgrade to add more assistants for other sites, locations or brands.</p>
          <Button asChild className="mt-5 rounded-xl">
            <Link href="/dashboard/billing">See plans</Link>
          </Button>
        </div>
      ) : (
        <NewBotForm />
      )}
    </div>
  );
}
