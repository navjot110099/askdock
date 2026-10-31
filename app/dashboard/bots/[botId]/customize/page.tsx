import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotCustomizer } from "@/app/dashboard/bots/[botId]/customize/bot-customizer";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Customise" };

export default async function CustomizePage({ params }: { params: Promise<{ botId: string }> }) {
  const [{ botId }, user] = await Promise.all([params, requireUser()]);
  const [bot, { plan }] = await Promise.all([repo.getBot(user.id, botId), getWorkspace(user.id)]);
  if (!bot) notFound();

  return (
    <BotCustomizer
      botId={bot.id}
      planAllowsLeads={plan.leadCapture}
      showBranding={!plan.removeBranding}
      initial={{
        name: bot.name,
        avatar: bot.avatar,
        brandColor: bot.brandColor,
        welcomeMessage: bot.welcomeMessage,
        suggestedQuestions: bot.suggestedQuestions,
        instructions: bot.instructions,
        leadCapture: bot.leadCapture,
      }}
    />
  );
}
