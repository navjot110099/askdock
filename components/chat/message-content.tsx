import { Fragment, type ReactNode } from "react";
import type { Citation } from "@/lib/types";

/**
 * Renders an assistant answer: paragraphs, simple lists, **bold**, links and
 * `[n]` citation markers turned into small numbered chips.
 */
export function MessageContent({ text, citations, color }: { text: string; citations: Citation[]; color: string }) {
  // Tuck citation markers against the preceding word: "is $129 [1]." → "is $129[1]."
  const blocks = text.trim().replace(/\s+(\[\d{1,2}\])/g, "$1").split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
          const ordered = /^\s*\d/.test(lines[0]);
          const ListTag = ordered ? "ol" : "ul";
          return (
            <ListTag key={i} className={ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""), citations, color)}</li>
              ))}
            </ListTag>
          );
        }
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, citations, color)}</Fragment>)}</p>;
      })}
    </div>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|\[\d{1,2}\]|https?:\/\/[^\s)]+[^\s).,!?])/g;

function inline(text: string, citations: Citation[], color: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const cite = part.match(/^\[(\d{1,2})\]$/);
    if (cite) {
      const n = Number(cite[1]);
      const source = citations.find((c) => c.n === n);
      if (!source) return null;
      return (
        <sup key={i} className="mx-px">
          <span
            title={source.title}
            className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {n}
          </span>
        </sup>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">
          {part.replace(/^https?:\/\//, "")}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
