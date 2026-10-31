"use client";

import { ChatWindow, type ChatBotConfig } from "@/components/chat/chat-window";

export function EmbedChat({ bot, inWidget }: { bot: ChatBotConfig; inWidget: boolean }) {
  return (
    <ChatWindow
      bot={bot}
      variant="embed"
      onClose={inWidget ? () => window.parent.postMessage("askdock:close", "*") : undefined}
    />
  );
}
