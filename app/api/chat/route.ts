import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessageStreamWriter,
} from "ai";
import { z } from "zod";
import { repo } from "@/lib/db";
import { env, hasOpenAI } from "@/lib/env";
import { getPlan } from "@/lib/plans";
import { clientIp, rateLimit, startOfMonthIso } from "@/lib/rate-limit";
import { demoAnswer } from "@/lib/rag/demo-responder";
import { openai } from "@/lib/rag/embed";
import { buildSystemPrompt, toCitations } from "@/lib/rag/prompt";
import type { ChatMessage, Citation, PublicBot } from "@/lib/types";

export const maxDuration = 30;

const Body = z.object({
  id: z.uuid(),
  botId: z.string().min(1).max(64),
  visitorId: z.string().min(1).max(64),
  messages: z
    .array(z.object({ id: z.string(), role: z.enum(["user", "assistant"]), parts: z.array(z.looseObject({ type: z.string() })) }))
    .min(1)
    .max(60),
});

type Writer = UIMessageStreamWriter<ChatMessage>;

const FOLLOW_UP = /^(and|or|but|so|also|what about|how about)\b|\b(it|that|this|they|them|those|these)\b/i;

const textOf = (m: { parts: { type: string; text?: unknown }[] }) =>
  m.parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("")
    .trim();

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { id: conversationId, botId, visitorId, messages } = parsed.data;

  if (!rateLimit(`chat:${clientIp(req)}`, 30, 60_000)) {
    return Response.json({ error: "You're sending messages too quickly. Please wait a moment." }, { status: 429 });
  }

  const bot = await repo.getPublicBot(botId);
  if (!bot) return Response.json({ error: "Bot not found" }, { status: 404 });

  const last = messages[messages.length - 1];
  const question = textOf(last).slice(0, 1000);
  if (last.role !== "user" || !question) return Response.json({ error: "Missing question" }, { status: 400 });

  // Plan limit: visitor messages per calendar month, counted across all of the owner's bots.
  const plan = getPlan((await repo.getSubscription(bot.ownerId)).plan);
  const used = await repo.countMessagesSince(bot.ownerId, startOfMonthIso());
  if (used >= plan.limits.messagesPerMonth) {
    return staticReply(
      "Thanks for your message! This assistant has reached its monthly limit, so please contact the business directly — they'll be happy to help.",
    );
  }

  const conversation = await repo.ensureConversation({
    id: conversationId,
    botId,
    visitorId,
    firstQuestion: question,
    country: req.headers.get("x-vercel-ip-country"),
  });
  if (!conversation) return Response.json({ error: "Conversation belongs to another bot" }, { status: 409 });
  await repo.addMessage({ conversationId, botId, role: "user", content: question });

  // Short follow-ups that lean on the previous turn ("and for kids?", "how much is it?")
  // are retrieved together with the previous question.
  const previous = [...messages].reverse().find((m, i) => i > 0 && m.role === "user");
  const isFollowUp = question.split(/\s+/).length < 7 && FOLLOW_UP.test(question);
  const query = isFollowUp && previous ? `${textOf(previous)} ${question}` : question;
  const chunks = await repo.searchChunks(bot.id, query, 6);

  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      if (hasOpenAI) await answerWithModel(writer, bot, messages, chunks, conversationId);
      else await answerOffline(writer, bot, question, chunks, conversationId);
    },
    onError: (error) => {
      console.error("[chat]", error);
      return "Sorry — something went wrong on our side. Please try again.";
    },
  });
  return createUIMessageStreamResponse({ stream });
}

async function answerWithModel(
  writer: Writer,
  bot: PublicBot,
  messages: z.infer<typeof Body>["messages"],
  chunks: Awaited<ReturnType<typeof repo.searchChunks>>,
  conversationId: string,
) {
  const citations = toCitations(chunks);
  if (citations.length) writer.write({ type: "data-sources", id: "sources", data: { citations } });

  let contactRequested = false;
  const history = messages.slice(-10).map((m) => ({ role: m.role, parts: [{ type: "text" as const, text: textOf(m) }] }));

  const result = streamText({
    model: openai(env.chatModel),
    instructions: buildSystemPrompt(bot, chunks),
    messages: await convertToModelMessages(history),
    maxOutputTokens: 700,
    stopWhen: stepCountIs(2),
    tools: bot.leadCapture
      ? {
          request_contact: tool({
            description:
              "Show the visitor a form to leave their email so the business can follow up. Use when the knowledge base doesn't answer the question, or the visitor asks for a person, callback or personalised quote.",
            inputSchema: z.object({ reason: z.string().describe("Short summary of what the visitor needs") }),
            execute: async ({ reason }) => {
              contactRequested = true;
              writer.write({ type: "data-lead", id: "lead", data: { reason } });
              return { formShown: true };
            },
          }),
        }
      : undefined,
    onEnd: async ({ steps }) => {
      const text = steps.map((s) => s.text).join("").trim();
      const cited = usedCitations(text, citations);
      await repo.addMessage({
        conversationId,
        botId: bot.id,
        role: "assistant",
        content: text,
        citations: cited,
        answered: !(contactRequested && cited.length === 0),
      });
    },
  });

  writer.merge(toUIMessageStream({ stream: result.stream, sendStart: false }));
}

async function answerOffline(
  writer: Writer,
  bot: PublicBot,
  question: string,
  chunks: Awaited<ReturnType<typeof repo.searchChunks>>,
  conversationId: string,
) {
  const answer = demoAnswer(question, chunks, { botName: bot.name, leadCapture: bot.leadCapture });
  const citations = toCitations(answer.usedChunks);
  if (citations.length) writer.write({ type: "data-sources", id: "sources", data: { citations } });

  await new Promise((r) => setTimeout(r, 450));
  await streamWords(writer, answer.text);
  if (answer.requestContact) writer.write({ type: "data-lead", id: "lead", data: { reason: question } });
  writer.write({ type: "finish" });

  await repo.addMessage({ conversationId, botId: bot.id, role: "assistant", content: answer.text, citations, answered: answer.answered });
}

/** Streams text word by word, mimicking model output. */
async function streamWords(writer: Writer, text: string) {
  const id = crypto.randomUUID();
  writer.write({ type: "text-start", id });
  for (const word of text.match(/\S+\s*/g) ?? []) {
    writer.write({ type: "text-delta", id, delta: word });
    await new Promise((r) => setTimeout(r, 16 + Math.random() * 30));
  }
  writer.write({ type: "text-end", id });
}

function usedCitations(text: string, citations: Citation[]) {
  const used = new Set([...text.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
  return citations.filter((c) => used.has(c.n));
}

function staticReply(text: string) {
  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      await streamWords(writer, text);
      writer.write({ type: "finish" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
