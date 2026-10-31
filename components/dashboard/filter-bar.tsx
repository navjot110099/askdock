"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; count?: number };

/** URL-driven filters: segmented tabs, an optional bot select and a search box. */
export function FilterBar({ tabs, tabParam = "filter", bots, searchPlaceholder }: { tabs: Option[]; tabParam?: string; bots?: Option[]; searchPlaceholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  useEffect(() => {
    if (!searchPlaceholder) return;
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update("q", q.trim() || null);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the query text changes
  }, [q]);

  const active = params.get(tabParam) ?? tabs[0].value;

  return (
    <div className={cn("mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", pending && "opacity-70")}>
      <div role="tablist" className="flex w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1 lg:w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={active === t.value}
            onClick={() => update(tabParam, t.value === tabs[0].value ? null : t.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
              active === t.value ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="rounded-full bg-black/[0.05] px-1.5 text-[11px] text-muted-foreground">{t.count}</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {bots && bots.length > 1 && (
          <Select value={params.get("bot") ?? "all"} onValueChange={(v) => update("bot", v === "all" ? null : v)}>
            <SelectTrigger className="h-10 w-full rounded-xl bg-white sm:w-48" aria-label="Filter by bot">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All bots</SelectItem>
              {bots.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {searchPlaceholder && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} aria-label="Search" className="h-10 w-full rounded-xl bg-white pl-9 sm:w-64" />
          </div>
        )}
      </div>
    </div>
  );
}
