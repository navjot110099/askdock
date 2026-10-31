import "server-only";
import { repo, LimitError } from "@/lib/db";
import { hasOpenAI, isDemoMode } from "@/lib/env";
import { getPlan } from "@/lib/plans";
import { chunkText } from "@/lib/rag/chunk";
import { crawlSite, CrawlError, normaliseUrl } from "@/lib/rag/crawl";
import { detectFileKind, extractFileText } from "@/lib/rag/extract";
import type { ChunkInput, Source } from "@/lib/types";

const MAX_CHUNKS_PER_SOURCE = 1500;

async function assertCanAddSource(ownerId: string) {
  const [sub, count] = await Promise.all([repo.getSubscription(ownerId), repo.countSources(ownerId)]);
  const plan = getPlan(sub.plan);
  if (count >= plan.limits.sources) {
    throw new LimitError(`Your ${plan.name} plan includes ${plan.limits.sources} knowledge sources. Upgrade to add more.`);
  }
  if (!isDemoMode && !hasOpenAI) throw new Error("OPENAI_API_KEY is required to embed documents.");
  return plan;
}

/** Extracts, chunks, embeds and stores an uploaded PDF/DOCX/TXT/MD file. */
export async function ingestFile(ownerId: string, botId: string, file: File): Promise<Source> {
  const plan = await assertCanAddSource(ownerId);
  const kind = detectFileKind(file.name, file.type);
  if (!kind) throw new LimitError("Upload a PDF, DOCX, TXT or Markdown file.");
  if (file.size > plan.limits.fileSizeMb * 1024 * 1024) {
    throw new LimitError(`Files can be up to ${plan.limits.fileSizeMb} MB on the ${plan.name} plan.`);
  }

  const source = await repo.createSource(ownerId, botId, { kind: "file", name: file.name, url: null });
  try {
    const { text, pages } = await extractFileText(Buffer.from(await file.arrayBuffer()), kind);
    if (text.replace(/\s/g, "").length < 40) throw new Error("We couldn't find readable text in this file (scanned PDFs need OCR first).");
    const title = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
    const chunks = chunkText(text)
      .slice(0, MAX_CHUNKS_PER_SOURCE)
      .map<ChunkInput>((c, i) => ({ content: c.content, title, url: null, position: i }));
    await repo.completeSource(source.id, { status: "ready", charCount: text.length, pageCount: pages }, chunks);
    return { ...source, status: "ready", chunkCount: chunks.length, charCount: text.length, pageCount: pages };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await repo.completeSource(source.id, { status: "failed", error: message });
    throw error;
  }
}

/** Crawls a website (same host, bounded by the plan's page limit) and indexes every page. */
export async function ingestUrl(ownerId: string, botId: string, rawUrl: string): Promise<Source> {
  const plan = await assertCanAddSource(ownerId);
  let start: URL;
  try {
    start = normaliseUrl(rawUrl.trim());
  } catch {
    throw new CrawlError("That doesn't look like a valid website address.");
  }

  const source = await repo.createSource(ownerId, botId, { kind: "url", name: start.hostname + (start.pathname === "/" ? "" : start.pathname), url: start.toString() });
  try {
    const pages = await crawlSite(start.toString(), { maxPages: plan.limits.crawlPages });
    const chunks: ChunkInput[] = [];
    for (const page of pages) {
      for (const c of chunkText(page.text)) {
        if (chunks.length >= MAX_CHUNKS_PER_SOURCE) break;
        chunks.push({ content: c.content, title: page.title, url: page.url, position: chunks.length });
      }
    }
    const charCount = pages.reduce((s, p) => s + p.text.length, 0);
    await repo.completeSource(source.id, { status: "ready", charCount, pageCount: pages.length }, chunks);
    return { ...source, status: "ready", chunkCount: chunks.length, charCount, pageCount: pages.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Crawl failed";
    await repo.completeSource(source.id, { status: "failed", error: message });
    throw error;
  }
}
