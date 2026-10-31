import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { env } from "@/lib/env";

export const openai = createOpenAI({ apiKey: env.openaiApiKey });

const embeddingModel = () => openai.embeddingModel(env.embeddingModel);

export async function embedQuery(text: string) {
  const { embedding } = await embed({ model: embeddingModel(), value: text.slice(0, 8000) });
  return embedding;
}

export async function embedChunks(texts: string[]) {
  if (!texts.length) return [];
  const { embeddings } = await embedMany({ model: embeddingModel(), values: texts, maxParallelCalls: 4 });
  return embeddings;
}
