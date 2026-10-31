import { z } from "zod";
import { repo } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  botId: z.string().min(1).max(64),
  conversationId: z.uuid().nullable(),
  email: z.email().max(200),
  name: z.string().trim().max(100).optional(),
  question: z.string().trim().max(1000).optional(),
});

/** Public endpoint the chat widget posts to when a visitor leaves their email. */
export async function POST(req: Request) {
  if (!rateLimit(`lead:${clientIp(req)}`, 5, 10 * 60_000)) {
    return Response.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });

  const { botId, conversationId, email, name, question } = parsed.data;
  const bot = await repo.getPublicBot(botId);
  if (!bot || !bot.leadCapture) return Response.json({ error: "Lead capture is not enabled for this bot." }, { status: 404 });

  await repo.createLead({ botId, conversationId, email: email.toLowerCase(), name: name || null, question: question || null });
  return Response.json({ ok: true });
}
