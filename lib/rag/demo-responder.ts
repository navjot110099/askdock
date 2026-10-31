import type { RetrievedChunk } from "@/lib/types";
import { tokenize } from "@/lib/rag/lexical";

/**
 * Offline stand-in for the LLM, used when no OPENAI_API_KEY is set. It builds
 * an extractive answer from the best-matching sentences of the retrieved
 * chunks, with the same `[n]` citation format the model is prompted to use.
 */

const CONTACT_INTENT = /\b(call me|call back|callback|speak to|talk to|human|real person|someone|quote|contact me|get in touch)\b/i;
const GREETING = /^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b[\s!.?]*$/i;
const THANKS = /^(thanks|thank you|cheers|great|perfect|ok(ay)?)\b[\s!.?]*$/i;

const ABBREVIATIONS = /\b(Dr|Mr|Mrs|Ms|St|No|vs|e\.g|i\.e)\./g;

function splitSentences(text: string) {
  const protectedText = text.replace(ABBREVIATIONS, "$1\u2024");
  return (protectedText.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [protectedText]).map((s) => s.replace(/\u2024/g, ".").trim()).filter(Boolean);
}

export type DemoAnswer = { text: string; answered: boolean; requestContact: boolean; usedChunks: RetrievedChunk[] };

export function demoAnswer(question: string, chunks: RetrievedChunk[], opts: { botName: string; leadCapture: boolean }): DemoAnswer {
  const q = question.trim();
  if (GREETING.test(q)) {
    return { text: `Hi there! I'm ${opts.botName}. What would you like to know?`, answered: true, requestContact: false, usedChunks: [] };
  }
  if (THANKS.test(q)) {
    return { text: "You're welcome! Is there anything else I can help with?", answered: true, requestContact: false, usedChunks: [] };
  }

  const wantsHuman = CONTACT_INTENT.test(q);
  const relevant = chunks.filter((c) => c.score >= 0.4);

  if (!relevant.length) {
    return {
      text: opts.leadCapture
        ? "I couldn't find that in the information I've been given, so I'd rather not guess. If you leave your email below, someone from the team will get back to you."
        : "I couldn't find that in the information I've been given, so I'd rather not guess. Please contact the team directly and they'll be happy to help.",
      answered: false,
      requestContact: opts.leadCapture,
      usedChunks: [],
    };
  }

  const qTerms = new Set(tokenize(q));
  const picked: { sentence: string; chunk: number }[] = [];
  const seen: Set<string>[] = [];
  relevant.slice(0, 2).forEach((chunk, chunkIndex) => {
    const body = (chunk.content.split("\n").slice(1).join(" ") || chunk.content).trim();
    // Short sections (opening hours, an address) read best in full.
    const sentences = body.length <= 280 && chunkIndex === 0 ? [body] : splitSentences(body);
    const scored = sentences.map((sentence, i) => ({ sentence, i, terms: tokenize(sentence), score: 0 }));
    for (const s of scored) s.score = new Set(s.terms.filter((t) => qTerms.has(t))).size;
    const minScore = chunkIndex === 0 ? 0 : 2;
    const best = [...scored]
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, chunkIndex === 0 ? 2 : 1)
      .filter((s) => s.score >= minScore)
      // Skip sentences that mostly repeat what's already been said.
      .filter((s) => !seen.some((prev) => s.terms.filter((t) => prev.has(t)).length / Math.max(1, s.terms.length) > 0.5))
      .sort((a, b) => a.i - b.i);
    for (const s of best) {
      picked.push({ sentence: s.sentence, chunk: chunkIndex });
      seen.push(new Set(s.terms));
    }
  });

  const used = [...new Set(picked.map((p) => p.chunk))].map((i) => relevant[i]);
  const text = picked
    .map((p) => {
      const n = used.indexOf(relevant[p.chunk]) + 1;
      const [, body, punct] = p.sentence.match(/^([\s\S]*?)([.!?]+)?$/) ?? [];
      return `${body} [${n}]${punct ?? "."}`;
    })
    .join(" ");

  const followUp = wantsHuman && opts.leadCapture ? " If you'd like the team to follow up personally, leave your email below." : "";
  return { text: text + followUp, answered: true, requestContact: wantsHuman && opts.leadCapture, usedChunks: used };
}
