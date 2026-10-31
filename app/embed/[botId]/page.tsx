import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedChat } from "@/app/embed/[botId]/embed-chat";
import { toChatConfig } from "@/lib/chat-config";
import { repo } from "@/lib/db";

export const metadata: Metadata = { title: "Chat", robots: { index: false, follow: false } };

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ botId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ botId }, { mode }] = await Promise.all([params, searchParams]);
  const bot = await repo.getPublicBot(botId);
  if (!bot) notFound();
  return <EmbedChat bot={toChatConfig(bot)} inWidget={mode === "widget"} />;
}
