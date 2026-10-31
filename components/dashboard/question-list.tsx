import { MessageCircleQuestion } from "lucide-react";

export function QuestionList({ items, tone = "iris", emptyText }: { items: { question: string; count: number }[]; tone?: "iris" | "rose"; emptyText: string }) {
  if (!items.length) {
    return (
      <p className="flex items-center gap-2 py-6 text-[14px] text-muted-foreground">
        <MessageCircleQuestion className="size-4" /> {emptyText}
      </p>
    );
  }
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={item.question}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate">
              <span className="mr-2 font-mono text-[12px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              {item.question}
            </span>
            <span className="shrink-0 font-mono text-[12px] text-muted-foreground">{item.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={tone === "iris" ? "h-full rounded-full bg-[linear-gradient(90deg,var(--iris),var(--lagoon))]" : "h-full rounded-full bg-[linear-gradient(90deg,var(--apricot),var(--rose))]"}
              style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
