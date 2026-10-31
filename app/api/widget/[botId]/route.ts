import { repo } from "@/lib/db";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "cache-control": "public, max-age=60, stale-while-revalidate=300",
};

/** Public bubble configuration fetched by /widget.js on the customer's website. */
export async function GET(_req: Request, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const bot = await repo.getPublicBot(botId);
  if (!bot) return Response.json({ error: "Bot not found" }, { status: 404, headers: CORS });
  return Response.json(
    {
      id: bot.id,
      name: bot.name,
      brandColor: bot.brandColor,
      avatar: bot.avatar.startsWith("preset:") || bot.avatar.startsWith("data:") ? null : bot.avatar,
      greeting: bot.welcomeMessage.slice(0, 140),
    },
    { headers: CORS },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
