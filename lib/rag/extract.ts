import "server-only";
import * as cheerio from "cheerio";

export const ACCEPTED_FILE_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/markdown": "md",
} as const;

export type FileKind = (typeof ACCEPTED_FILE_TYPES)[keyof typeof ACCEPTED_FILE_TYPES];

export function detectFileKind(name: string, mime: string): FileKind | null {
  const byMime = ACCEPTED_FILE_TYPES[mime as keyof typeof ACCEPTED_FILE_TYPES];
  if (byMime) return byMime;
  const ext = name.toLowerCase().split(".").pop();
  return ext === "pdf" || ext === "docx" || ext === "txt" || ext === "md" ? ext : null;
}

export async function extractFileText(buffer: Buffer, kind: FileKind): Promise<{ text: string; pages: number }> {
  switch (kind) {
    case "pdf": {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text, totalPages } = await extractText(pdf, { mergePages: false });
      return { text: text.map((page) => markPdfHeadings(page.trim())).join("\n\n"), pages: totalPages };
    }
    case "docx": {
      const mammoth = await import("mammoth");
      // Converting via HTML keeps headings, which the chunker splits on.
      const { value } = await mammoth.convertToHtml({ buffer });
      return { text: htmlToText(value).text, pages: 1 };
    }
    default:
      return { text: buffer.toString("utf8"), pages: 1 };
  }
}

/**
 * PDFs have no semantic headings, so short title-like lines (no closing
 * punctuation, followed by body text) are marked as `##` for the chunker.
 */
function markPdfHeadings(text: string) {
  const lines = text.split("\n").map((l) => l.trim());
  return lines
    .map((line, i) => {
      const next = lines[i + 1] ?? "";
      const titleLike = line.length >= 3 && line.length <= 70 && /^[A-Z0-9]/.test(line) && !/[.,;:!?)]$/.test(line);
      return titleLike && next.length > line.length ? `\n## ${line}` : line;
    })
    .join("\n");
}

const NOISE ="script, style, noscript, svg, iframe, form, nav, footer, header, aside, [role=navigation], [aria-hidden=true], .cookie, #cookie-banner";

/** Converts HTML into heading-marked plain text and collects outgoing links. */
export function htmlToText(html: string, baseUrl?: string) {
  const $ = cheerio.load(html);
  const title = ($("title").first().text() || $("h1").first().text() || "").trim().replace(/\s+/g, " ");

  const links = new Set<string>();
  if (baseUrl) {
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;
      try {
        const url = new URL(href, baseUrl);
        url.hash = "";
        links.add(url.toString());
      } catch {
        /* ignore malformed links */
      }
    });
  }

  $(NOISE).remove();
  const root = $("main").first().length ? $("main").first() : $("article").first().length ? $("article").first() : $("body");

  const lines: string[] = [];
  root.find("h1, h2, h3, h4, p, li, td, th, blockquote, dt, dd, pre").each((_, el) => {
    const node = $(el);
    // Skip containers whose text is already emitted by a nested element.
    if (node.find("p, li, h1, h2, h3, h4").length && !/^h[1-4]$/.test(el.tagName)) return;
    const text = node.text().replace(/\s+/g, " ").trim();
    if (!text) return;
    if (/^h[1-4]$/.test(el.tagName)) lines.push(`\n## ${text}`);
    else if (el.tagName === "li") lines.push(`- ${text}`);
    else lines.push(text);
  });

  let text = lines.join("\n").trim();
  if (text.length < 200) text = root.text().replace(/\s+/g, " ").trim();
  return { title, text, links: [...links] };
}
