/**
 * Heading-aware text splitter.
 *
 * Text is first split into sections on markdown-style headings, so each chunk
 * stays on one topic and carries its heading as context ("Teeth whitening —
 * In-chair whitening takes…"). Long sections are packed paragraph by
 * paragraph (then sentence by sentence) up to `maxChars`, with a small
 * sentence overlap between neighbouring chunks.
 */

export type TextChunk = { content: string; heading: string | null };

type Options = { maxChars?: number; overlapChars?: number; minChars?: number };

const HEADING = /^(#{1,4})\s+(.+?)\s*#*$/;

export function chunkText(text: string, opts: Options = {}): TextChunk[] {
  const maxChars = opts.maxChars ?? 1100;
  const overlapChars = opts.overlapChars ?? 160;
  const minChars = opts.minChars ?? 80;

  const sections = splitSections(normalise(text));
  const chunks: TextChunk[] = [];

  for (const section of sections) {
    const body = section.body.trim();
    if (!body) continue;
    const prefix = section.heading ? `${section.heading}\n` : "";

    if (body.length + prefix.length <= maxChars) {
      chunks.push({ content: prefix + body, heading: section.heading });
      continue;
    }

    const units = body
      .split(/\n{2,}/)
      .flatMap((p) => (p.length > maxChars ? splitSentences(p) : [p]))
      .map((u) => u.trim())
      .filter(Boolean);

    let current = "";
    for (const unit of units) {
      if (current && prefix.length + current.length + unit.length + 1 > maxChars) {
        chunks.push({ content: prefix + current.trim(), heading: section.heading });
        current = tail(current, overlapChars);
      }
      current += (current ? "\n" : "") + unit;
    }
    if (current.trim()) chunks.push({ content: prefix + current.trim(), heading: section.heading });
  }

  // Fold fragments (e.g. a lone title line) into their neighbour.
  return chunks.reduce<TextChunk[]>((acc, chunk) => {
    const prev = acc[acc.length - 1];
    if (prev && prev.content.length < minChars && prev.content.length + chunk.content.length <= maxChars) {
      acc[acc.length - 1] = { content: `${prev.content}\n${chunk.content}`, heading: chunk.heading ?? prev.heading };
    } else {
      acc.push(chunk);
    }
    return acc;
  }, []);
}

function normalise(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitSections(text: string) {
  const sections: { heading: string | null; body: string }[] = [{ heading: null, body: "" }];
  for (const line of text.split("\n")) {
    const match = line.match(HEADING);
    if (match) {
      sections.push({ heading: match[2].trim(), body: "" });
    } else {
      sections[sections.length - 1].body += `${line}\n`;
    }
  }
  return sections;
}

function splitSentences(paragraph: string) {
  return paragraph.match(/[^.!?]+(?:[.!?]+["')\]]*\s*|$)/g) ?? [paragraph];
}

/** The trailing whole sentences of `text`, up to `maxChars`, used as overlap. */
function tail(text: string, maxChars: number) {
  const sentences = splitSentences(text.replace(/\n/g, " "));
  let out = "";
  for (let i = sentences.length - 1; i >= 0; i--) {
    const next = sentences[i].trim();
    if ((out + next).length > maxChars) break;
    out = `${next} ${out}`;
  }
  return out.trim();
}
