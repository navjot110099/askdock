import type { PublicBot } from "@/lib/types";

/** The fields the browser chat UI needs — never the owner id or system instructions. */
export function toChatConfig(bot: PublicBot) {
  return {
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    brandColor: bot.brandColor,
    welcomeMessage: bot.welcomeMessage,
    suggestedQuestions: bot.suggestedQuestions,
    leadCapture: bot.leadCapture,
    showBranding: bot.showBranding,
  };
}
