import { getCurrentUser } from "@/lib/auth";
import { LimitError, NotFoundError } from "@/lib/db";
import { CrawlError } from "@/lib/rag/crawl";
import { ingestFile, ingestUrl } from "@/lib/rag/ingest";

export const maxDuration = 60;

/** Adds a knowledge source: multipart `file`, or a `url` to crawl. */
export async function POST(req: Request, { params }: { params: Promise<{ botId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { botId } = await params;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const url = form.get("url");
    const source =
      file instanceof File && file.size > 0
        ? await ingestFile(user.id, botId, file)
        : typeof url === "string" && url.trim()
          ? await ingestUrl(user.id, botId, url)
          : null;
    if (!source) return Response.json({ error: "Choose a file or enter a website URL." }, { status: 400 });
    return Response.json({ source });
  } catch (error) {
    if (error instanceof NotFoundError) return Response.json({ error: "Bot not found" }, { status: 404 });
    if (error instanceof LimitError) return Response.json({ error: error.message }, { status: 402 });
    if (error instanceof CrawlError) return Response.json({ error: error.message }, { status: 422 });
    console.error("[sources]", error);
    const message = error instanceof Error ? error.message : "Something went wrong while processing this source.";
    return Response.json({ error: message }, { status: 500 });
  }
}
