import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  change?: number;
  /** Set when a decrease is the good direction. */
  invert?: boolean;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "iris" | "rose" | "lagoon" | "apricot";
};

const TONES = {
  iris: "bg-[#f1ebfd] text-iris",
  rose: "bg-[#fdebf2] text-rose",
  lagoon: "bg-[#e5f5f6] text-[#2a8f9b]",
  apricot: "bg-[#fff0e7] text-[#e0743f]",
};

export function StatCard({ label, value, change, invert, hint, icon: Icon, tone }: Props) {
  const up = (change ?? 0) >= 0;
  const good = invert ? !up : up;
  return (
    <div className="rounded-[22px] border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(24,19,31,0.04)] sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-muted-foreground sm:text-[13px]">{label}</p>
        <span className={cn("hidden size-8 items-center justify-center rounded-xl sm:flex", TONES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-[32px] leading-none tracking-tight sm:mt-3 sm:text-[40px]">{value}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        {change !== undefined && Number.isFinite(change) && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change * 100).toFixed(change !== 0 && Math.abs(change) < 0.1 ? 1 : 0)}%
          </span>
        )}
        {hint && <span className="hidden text-muted-foreground sm:inline">{hint}</span>}
      </div>
    </div>
  );
}
